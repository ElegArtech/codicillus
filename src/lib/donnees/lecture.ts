/**
 * LA COUCHE DE LECTURE — les formes de `seeds/corpus.ts`, rendues depuis la base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE EST, ET POURQUOI ELLE REND LES TYPES DU JEU DE SEMENCE
 *
 * Les 41 vues gelées attendent leurs données en PROPRIÉTÉ, et elles les
 * déclarent avec les types de `seeds/corpus.ts` — `V-12.svelte:78-85` déclare
 * `notes: readonly Note[]`. Ce module ne définit donc AUCUN type nouveau : il
 * réemploie ceux du jeu de semence. C'est ce qui permet à un chargeur de route
 * de remplacer `corpusPourVue('V-12')` par `lireNotes(...)` sans toucher la vue.
 *
 * La base a été semée DEPUIS `seeds/corpus.ts` (`src/lib/base/semence.ts` et
 * `commandes.ts:325` `semer()`). Ce module est donc l'INVERSE de la semence, et
 * `pnpm verif:donnees` mesure que l'aller-retour est fidèle. Là où il ne l'est
 * pas, la batterie le dit et le compte : ce n'est pas à ce module de combler.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI `base` EST UN PARAMÈTRE, ET NON `basePartagee()` APPELÉ ICI
 *
 * Le contrat veut un seul groupe de connexions, celui de
 * `src/lib/base/acces.ts`. Ce module l'honore en n'en ouvrant AUCUN : il reçoit
 * la poignée. Deux raisons de ne pas appeler `basePartagee()` ici même :
 *
 *   1. `acces.ts` importe `$env/dynamic/private`, qui n'existe que dans le
 *      graphe de modules de SvelteKit. Un module de lecture qui en dépendrait
 *      au chargement ne serait plus éprouvable par `vitest`.
 *   2. Un paramètre explicite rend la transaction possible : un chargeur qui
 *      veut plusieurs lectures cohérentes passe son `tx` au lieu de la base.
 *
 * Le type `Base` est importé en `import type` : la déclaration est effacée à la
 * compilation, donc `$env/dynamic/private` n'entre jamais dans ce graphe.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA FRAÎCHEUR N'EST PAS RECALCULÉE ICI (P-01)
 *
 * `src/lib/fraicheur.ts` est l'implémentation unique. Ce module lui passe une
 * ancienneté et des seuils, et n'écrit aucune comparaison de date à un seuil.
 *
 * ET L'INSTANT DE RÉFÉRENCE EST UN PARAMÈTRE, jamais `new Date()` pris ici.
 * `Note.fraicheur` du jeu de semence est vraie À `DATE_REFERENCE` ; en service,
 * elle est vraie maintenant. Une couche de lecture qui prendrait l'heure
 * elle-même rendrait ses résultats non reproductibles, donc non mesurables —
 * et la batterie d'équivalence ne pourrait rien prouver.
 */
import { eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Base } from '../base/acces';
import {
	champsDeTypeDeFiche,
	CLES_DE_PARAMETRE,
	comptes,
	domaines,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	modulesDeDomaine,
	notes,
	parametres,
	relations,
	templates,
	typesDeFiche,
	typesDeNote,
	typesDeRelation,
	univers
} from '../base/schema';
import { niveauFraicheur, type SeuilsDeFraicheur } from '../fraicheur';
import type {
	ChampDeFiche,
	CleDeModule,
	CleDeTypeDeRelation,
	Compte,
	Configuration,
	Domaine,
	LibellesDeRelation,
	Note,
	Relation,
	Template,
	TypeDeFiche,
	TypeDeNote,
	Univers
} from '../../../seeds/corpus';
import { analyserDocument, texteBrut } from '../contenu/document';

/* ═══════════════════════════════════════════════════ Les instants ═══════ */

/**
 * `2026-07-18T00:00:00.000Z` vers `18/07/2026` — l'inverse exact de
 * `dateCourteEnIso()` de la semence, qui écrit `HEURE_DE_REFERENCE` en UTC.
 *
 * LES COMPOSANTES SONT LUES EN UTC, ET C'EST LA SEULE LECTURE JUSTE. La
 * semence écrit `new Date('2026-07-18T00:00:00.000Z')` ; relire avec
 * `getDate()` donnerait le 17 dans tout fuseau à l'ouest de Greenwich. Le
 * décalage d'un jour déplacerait l'ancienneté, donc le niveau de fraîcheur
 * d'une note posée sur un seuil — le défaut exact que `semer()` se garde de
 * commettre (`commandes.ts`, « un `timestamptz` traverse une conversion de
 * fuseau à l'aller comme au retour »).
 */
export function dateCourteDInstant(instant: Date): string {
	const jour = String(instant.getUTCDate()).padStart(2, '0');
	const mois = String(instant.getUTCMonth() + 1).padStart(2, '0');
	return `${jour}/${mois}/${String(instant.getUTCFullYear())}`;
}

/** `2026-07-18` vers `18/07/2026`. Le type SQL `date` se relit en chaîne. */
export function dateCourteDIso(iso: string): string {
	const [annee, mois, jour] = iso.split('-');
	if (annee === undefined || mois === undefined || jour === undefined) {
		throw new Error(`date ISO illisible : ${iso}`);
	}
	return `${jour}/${mois}/${annee}`;
}

const MILLISECONDES_PAR_JOUR = 86_400_000;

/** Le nombre de jours entiers écoulés entre un instant et l'instant de lecture. */
export function joursEcoules(instant: Date, maintenant: Date): number {
	return Math.floor((maintenant.getTime() - instant.getTime()) / MILLISECONDES_PAR_JOUR);
}

/**
 * Le contexte d'une lecture : l'instant qui fait foi, et les seuils en vigueur.
 * Les deux sont exigés — aucun défaut, pour qu'aucun appelant ne les subisse
 * sans le savoir.
 */
export interface ContexteDeLecture {
	readonly maintenant: Date;
	readonly seuils: SeuilsDeFraicheur;
}

/* ═══════════════════════════════════════════════════ Le contenu ═════════ */

/**
 * L'EXTRAIT D'UNE NOTE — dérivé du TEXTE BRUT de son corps.
 *
 * `cadrage/STACK-TECHNIQUE.md:261` tranche la question, et il faut le lire avant
 * de toucher à cette fonction : des trois formes que le format canonique dérive,
 * le **texte brut** est produit « à l'enregistrement » et sert à
 * « l'indexation, les EXTRAITS, la détection de doublon ». L'extrait n'est donc
 * pas une donnée stockée — la table `notes` n'en porte aucune colonne — c'est
 * une dérivation, et sa source est nommée.
 *
 * LE PARCOURS RESTE STRUCTUREL, JAMAIS TEXTUEL : `texteBrut()` de
 * `src/lib/contenu/document.ts` parcourt l'arbre de nœuds, et `ADR-003` interdit
 * « toute manipulation du corps par expression régulière ou par transformation
 * de chaîne ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CETTE FONCTION NE LÈVE PLUS, ET CE QUE ÇA A COÛTÉ DE LE DÉCOUVRIR
 *
 * Sa première écriture n'admettait qu'un document d'UN SEUL paragraphe à UN SEUL
 * nœud de texte — la forme exacte que la semence écrit — et LEVAIT sur tout le
 * reste. L'intention était juste : un extrait faux se verrait à l'écran sans que
 * rien ne l'ait signalé.
 *
 * Mais l'effet ne l'était pas. `T-050` l'a mesuré en enregistrant une vraie note
 * par l'éditeur : dès le premier corps à deux blocs, `lireNotes()` levait, donc
 * **toute route qui lit le corpus tombait**. Et aucune batterie ne l'aurait vu —
 * aucune n'enregistre. C'est une sonde d'exécutant qui l'a trouvé.
 *
 * Le remède n'est pas d'élargir la tolérance : c'est d'employer la source que la
 * pile désigne. Vérifié sur les 32 notes du corpus : la semence bâtissant le
 * corps DEPUIS l'extrait (`corpsDepuisTexte`), `texteBrut()` rend exactement la
 * même chaîne — l'unitaire qui l'exige est conservé, et il passe à l'octet.
 *
 * CE QU'AUCUNE SOURCE NE DIT, et qui n'est donc pas décidé ici : la LONGUEUR
 * d'un extrait. Les 32 du corpus sont rédigés à la main, d'une à deux phrases ;
 * rien ne fixe où couper, ni comment traiter un titre, une alerte ou un tableau.
 * Cette fonction ne tronque donc pas. Le jour où une source le dira, la coupe se
 * pose ICI, et nulle part ailleurs.
 */
export function extraitDuCorps(corps: unknown): string {
	return texteBrut(analyserDocument(corps));
}

/* ═══════════════════════════════════════════════════ Le rangement ══════ */

/** Les univers, dans l'ordre que l'administrateur leur a donné (RG-STR-01). */
export async function lireUnivers(base: Base): Promise<readonly Univers[]> {
	const lignes = await base
		.select({
			nom: univers.nom,
			couleur: univers.couleur,
			glyphe: univers.glyphe,
			ordre: univers.ordre,
			systeme: univers.systeme,
			description: univers.description
		})
		.from(univers)
		.orderBy(univers.ordre);

	return lignes.map((u) => {
		const rendu: Record<string, unknown> = {
			nom: u.nom,
			couleur: u.couleur,
			glyphe: u.glyphe,
			ordre: u.ordre,
			description: u.description
		};
		/* `systeme` est OPTIONNEL dans `interface Univers` : le jeu de semence ne
		   porte la clé que sur « Non classé ». Elle est donc OMISE quand elle est
		   fausse, et non posée à `false` — une clé de plus se verrait dans toute
		   comparaison profonde. */
		if (u.systeme) rendu['systeme'] = true;
		return rendu as unknown as Univers;
	});
}

/** Les domaines, groupés par univers, dans l'ordre d'affichage du rail. */
export async function lireDomaines(base: Base): Promise<readonly Domaine[]> {
	const lignes = await base
		.select({ nom: domaines.nom, universNom: univers.nom, couleur: domaines.couleur })
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.orderBy(univers.ordre, domaines.nom);

	return lignes.map((d) => ({ nom: d.nom, univers: d.universNom, couleur: d.couleur }) as Domaine);
}

/**
 * Les modules activés, par domaine (RG-STR-06, P-04).
 *
 * `MODULE_EN_ENUM` de la semence traduit `carteMentale` en `carte_mentale` ;
 * la table de retour est son inverse, déclarée et non tacite.
 */
const MODULE_DEPUIS_ENUM: Record<string, CleDeModule> = {
	notes: 'notes',
	dossiers: 'dossiers',
	fiches: 'fiches',
	cartographie: 'cartographie',
	signets: 'signets',
	carte_mentale: 'carteMentale'
};

export async function lireModulesParDomaine(
	base: Base
): Promise<ReadonlyMap<string, readonly CleDeModule[]>> {
	const lignes = await base
		.select({ domaineNom: domaines.nom, module: modulesDeDomaine.module })
		.from(modulesDeDomaine)
		.innerJoin(domaines, eq(modulesDeDomaine.domaineId, domaines.id))
		.orderBy(domaines.nom, modulesDeDomaine.module);

	const par = new Map<string, CleDeModule[]>();
	for (const ligne of lignes) {
		const cle = MODULE_DEPUIS_ENUM[ligne.module];
		if (cle === undefined) throw new Error(`module inconnu en base : ${ligne.module}`);
		const deja = par.get(ligne.domaineNom);
		if (deja === undefined) par.set(ligne.domaineNom, [cle]);
		else deja.push(cle);
	}
	return par;
}

/** La description d'un domaine — `DETAIL_DOMAINES[…].description` du jeu. */
export async function lireDescriptionsDeDomaine(base: Base): Promise<ReadonlyMap<string, string>> {
	const lignes = await base
		.select({ nom: domaines.nom, description: domaines.description })
		.from(domaines);
	return new Map(lignes.map((d) => [d.nom, d.description]));
}

/**
 * Le chemin de rangement de chaque dossier, tel que `Note.dossier` l'écrit :
 * les segments SOUS la racine, séparés par « › ».
 *
 * La racine porte le nom de son domaine (décision de la semence,
 * `lignesDeDossier()`) et n'entre pas dans le chemin affiché — c'est ce que
 * `segmentsDeDossier()` défait, et ce que cette fonction refait.
 */
export async function lireCheminsDeDossier(base: Base): Promise<ReadonlyMap<string, string>> {
	const lignes = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			nom: dossiers.nom,
			profondeur: dossiers.profondeur
		})
		.from(dossiers);

	const parId = new Map(lignes.map((d) => [d.id, d]));
	const chemins = new Map<string, string>();
	for (const dossier of lignes) {
		const segments: string[] = [];
		let courant: typeof dossier | undefined = dossier;
		/* On remonte jusqu'à la racine EXCLUSE : `profondeur === 1` est la racine,
		   dont le nom est celui du domaine et que `Note.dossier` n'affiche pas. */
		while (courant !== undefined && courant.profondeur > 1) {
			segments.unshift(courant.nom);
			courant = courant.parentId === null ? undefined : parId.get(courant.parentId);
		}
		chemins.set(dossier.id, segments.join(' › '));
	}
	return chemins;
}

/** Le domaine de chaque dossier, par identifiant de dossier. */
export async function lireDomainesParDossier(base: Base): Promise<ReadonlyMap<string, string>> {
	const lignes = await base
		.select({ id: dossiers.id, domaineNom: domaines.nom })
		.from(dossiers)
		.innerJoin(domaines, eq(dossiers.domaineId, domaines.id));
	return new Map(lignes.map((d) => [d.id, d.domaineNom]));
}

/* ═══════════════════════════════════════════════════ Les notes ══════════ */

/**
 * Les notes, dans la forme exacte de `interface Note`.
 *
 * UN SEUL CHAMP N'EST PLUS RENDU TEL QUE LE JEU LE PORTE, et c'est `pj`.
 *
 *   `pj`          le nombre de pièces jointes. Le compte rendu est le compte
 *                 RÉEL de la table — 0 —, jamais le chiffre du jeu : P-02
 *                 interdit la valeur illustrative, et rendre des pièces
 *                 qu'aucune ligne ne porte en serait une. `T-049` a rouvert la
 *                 question et conclu comme `T-030b`, pour un motif plus étroit :
 *                 le gel nomme DEUX des treize pièces (V-14:1831-1840), mais
 *                 leurs tailles y sont RENDUES — « 1,2 Mo », « 18 Ko » — et
 *                 `taille_octets` veut un nombre. « 1,2 Mo » ne désigne pas un
 *                 nombre d'octets, il en désigne un intervalle. Ce ne sont donc
 *                 pas onze pièces qui manquent, ce sont treize TAILLES : même
 *                 les deux nommées ne se sèment pas sans fabriquer un chiffre.
 *                 Le manque est porté par la lacune `Note.pj`, chiffrée à chaque
 *                 exécution, et c'est un défaut du GEL, pas du schéma.
 *
 *   `etiquettes`  leur ORDRE EST RENDU, depuis `T-049`. `005` avait posé
 *                 `etiquettes_de_note.ordre` et `semer()` l'écrivait déjà ;
 *                 seule la référence de l'instrument triait encore.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE `T-049` A DÛ DÉFAIRE, ET POURQUOI C'ÉTAIT UN SEUL GESTE
 *
 * Ce module a rendu, huit lots durant, des étiquettes triées par libellé et des
 * comptes amputés de leur rattachement — alors que la base portait les deux. La
 * cause n'était pas ici : `equivalence.ts` écrivait ses lacunes en LITTÉRAUX et
 * normalisait sa référence en conséquence, si bien que rendre la donnée juste
 * aurait fait DIVERGER 25 notes sur 32 et 5 comptes sur 5. Or « divergence » y
 * signifie « la couche rend MAL » : la couche aurait rougi POUR AVOIR EU RAISON,
 * dans la seule prémisse dont dépendent les lots de câblage.
 *
 * L'instrument gouvernait donc la couche, et c'est l'inversion qu'il fallait
 * défaire. `chiffrerLesLacunes()` MESURE désormais chaque lacune contre la base ;
 * la normalisation se déduit de ce qu'elle rend. Les deux éditions ne pouvaient
 * pas être séparées — d'où un lot, un geste.
 *
 * @param identifiants restreint la lecture à ces notes, DANS la requête. Absent :
 *   tout le corpus, comme les huit appelants qui ne le passent pas. Présent, il
 *   vient d'une décision d'accès déjà prise — le périmètre de `/recherche`, que
 *   le moteur a filtré (`ADR-006`) — et il ne DÉCIDE de rien : il transporte.
 */
export async function lireNotes(
	base: Base,
	contexte: ContexteDeLecture,
	identifiants?: readonly string[]
): Promise<readonly Note[]> {
	/* AUCUN IDENTIFIANT RETENU, AUCUNE REQUÊTE. Le tableau vide n'est pas un cas
	   limite à écarter : c'est le périmètre fermé de `RG-DRO-02`, et la bonne
	   réponse est de ne rien demander à la base. */
	if (identifiants !== undefined && identifiants.length === 0) return [];

	const chemins = await lireCheminsDeDossier(base);

	const socle = base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel,
			typeNom: typesDeNote.nom,
			typeFicheNom: typesDeFiche.nom,
			universNom: univers.nom,
			domaineNom: domaines.nom,
			dossierId: notes.dossierId,
			auteurNom: comptes.nom,
			visibilite: notes.visibilite,
			statut: notes.statut,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			consultations: notes.compteurDeConsultations,
			signetAdresse: notes.signetAdresse,
			signetAjouteLe: notes.signetAjouteLe
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.leftJoin(typesDeFiche, eq(notes.typeDeFicheId, typesDeFiche.id));

	/* LA RESTRICTION EST DANS LA REQUÊTE, JAMAIS APRÈS ELLE. `ADR-006` interdit
	   « toute route qui reçoit une liste puis la filtre » : quand l'appelant sait
	   déjà quelles notes il a le droit de lire, c'est la clause SQL qui le dit,
	   et la base ne remonte pas une ligne de plus. */
	const lignes = await (identifiants === undefined
		? socle.orderBy(notes.identifiant)
		: socle.where(inArray(notes.identifiant, [...identifiants])).orderBy(notes.identifiant));

	const etiquettesParNote = await lireEtiquettesParNote(base);
	const piecesParNote = await lirePiecesJointesParNote(base);

	return lignes.map((n) => {
		/* La fraîcheur se lit sur la dernière vérification, et à défaut sur la
		   dernière modification : c'est la règle de RG-M06-01, et `semer()` la
		   relit dans les mêmes termes. */
		const reference = n.verifieLe ?? n.modifieLe;
		const rendu: Record<string, unknown> = {
			id: n.identifiant,
			titre: n.titre,
			extrait: extraitDuCorps(n.corpsReference),
			type: n.typeNom as TypeDeNote,
			univers: n.universNom,
			domaine: n.domaineNom,
			dossier: chemins.get(n.dossierId) ?? '',
			auteur: n.auteurNom,
			fraicheur: niveauFraicheur(joursEcoules(reference, contexte.maintenant), contexte.seuils),
			/* L'ÂGE DE LA VÉRIFICATION, PAS CELUI DE LA MODIFICATION. `seeds/corpus.ts`
			   le documente en propres termes — « jours écoulés depuis la dernière
			   vérification » —, et la ligne du dessus calcule la fraîcheur sur
			   `verifie_le ?? modifie_le`. Les deux ont longtemps divergé : le
			   cartouche d'une note pouvait écrire « Vérifié il y a 3 jours » sur une
			   note vérifiée il y a neuf mois et modifiée avant-hier. Un seul
			   instant de référence, deux emplois, aucune seconde définition. */
			jours: joursEcoules(reference, contexte.maintenant),
			revise: n.verifieLe === null ? null : dateCourteDInstant(n.verifieLe),
			vues: n.consultations,
			pj: piecesParNote.get(n.identifiant) ?? 0,
			brouillon: n.statut === 'brouillon',
			visibilite: n.visibilite === 'publique' ? 'Publique' : 'Interne',
			operationnel: n.corpsOperationnel !== null,
			etiquettes: etiquettesParNote.get(n.identifiant) ?? []
		};
		/* `typeFiche`, `url` et `ajoute` sont OPTIONNELS : la clé est OMISE quand
		   la colonne est nulle, et non posée à `undefined`. Une clé présente et
		   vide n'est pas la même valeur qu'une clé absente pour une comparaison
		   profonde, et c'est cette comparaison qui garde les huit lots suivants. */
		if (n.typeFicheNom !== null) rendu['typeFiche'] = n.typeFicheNom as TypeDeFiche;
		if (n.signetAdresse !== null) rendu['url'] = n.signetAdresse;
		if (n.signetAjouteLe !== null) rendu['ajoute'] = dateCourteDIso(n.signetAjouteLe);
		return rendu as unknown as Note;
	});
}

/**
 * Les étiquettes de chaque note, triées par libellé — voir `lireNotes`.
 *
 * LE TRI EST FAIT ICI, EN TYPESCRIPT, ET SURTOUT PAS PAR `ORDER BY`. Les deux
 * ne donnent pas le même ordre, et l'écart a été mesuré : sur `n-sig-facturation`,
 * PostgreSQL rend « facturation » avant « éditeur », là où
 * `localeCompare(…, 'fr')` rend « éditeur » avant « facturation ». La collation
 * du serveur classe sur les octets de l'encodage, où `é` suit `f` ; la collation
 * française traite `é` comme un `e` accentué, donc avant `f`.
 *
 * Le français est le bon ordre — c'est celui que les maquettes montrent —, et
 * c'est déjà celui de la semence : `lignesDEtiquette()` emploie exactement
 * `localeCompare(a, b, 'fr')`. Déléguer le tri au serveur ferait dépendre
 * l'ordre affiché de la collation de l'instance, c'est-à-dire d'un réglage
 * d'exploitation. Un seul comparateur, dans le code, comme pour la fraîcheur.
 *
 * CE PARAGRAPHE RESTE VRAI ET CESSE D'ÊTRE LE MOTIF, ET LE TRI EST TOMBÉ.
 * Depuis `005`, `etiquettes_de_note.ordre` porte le rang du jeu, `semer()`
 * l'écrit, et `ORDER BY ordre` ne dépend d'aucune collation : c'est l'ordre
 * exact des maquettes, rendu sans comparateur et sans accident. Ce qui retenait
 * la bascule était l'instrument — sa référence triait les étiquettes du jeu par
 * un littéral, si bien que rendre l'ordre juste aurait fait DIVERGER 25 notes
 * sur 32. `T-049` a réparé les deux en un seul geste : `chiffrerLesLacunes()`
 * MESURE désormais l'ordre porté par la base, la lacune se referme d'elle-même,
 * et la normalisation qui triait la référence disparaît avec elle.
 *
 * `localeCompare(…, 'fr')` reste employé par `lignesDEtiquette()` de la semence,
 * qui range le RÉFÉRENTIEL des étiquettes ; ce module n'en a plus besoin, parce
 * qu'il ne classe plus rien — il restitue.
 */
export async function lireEtiquettesParNote(
	base: Base
): Promise<ReadonlyMap<string, readonly string[]>> {
	const lignes = await base
		.select({ noteIdentifiant: notes.identifiant, libelle: etiquettes.libelle })
		.from(etiquettesDeNote)
		.innerJoin(notes, eq(etiquettesDeNote.noteId, notes.id))
		.innerJoin(etiquettes, eq(etiquettesDeNote.etiquetteId, etiquettes.id))
		.orderBy(etiquettesDeNote.ordre);

	const par = new Map<string, string[]>();
	for (const ligne of lignes) {
		const deja = par.get(ligne.noteIdentifiant);
		if (deja === undefined) par.set(ligne.noteIdentifiant, [ligne.libelle]);
		else deja.push(ligne.libelle);
	}
	return par;
}

/**
 * Le nombre de pièces jointes par note — le compte RÉEL de la table.
 *
 * Il vaut 0 partout tant que la semence n'écrit pas de pièce jointe. C'est un
 * fait, pas un défaut de ce module : le rendre autrement serait la « valeur
 * illustrative » que P-02 proscrit.
 */
export async function lirePiecesJointesParNote(base: Base): Promise<ReadonlyMap<string, number>> {
	const lignes = await base.execute<{ identifiant: string; n: number }>(
		`select n.identifiant, count(p.id)::int as n
		   from notes n left join pieces_jointes p on p.note_id = n.id
		  group by n.identifiant`
	);
	const rangs = lignes.rows ?? (lignes as unknown as { identifiant: string; n: number }[]);
	return new Map(rangs.map((l) => [l.identifiant, l.n]));
}

/* ═══════════════════════════════════════════════════ Les relations ══════ */

/**
 * Les relations, par les identifiants lisibles de leurs deux extrémités.
 *
 * `notes` est jointe DEUX FOIS — la source et la cible —, ce qui exige deux
 * alias : sans eux, la seconde jointure écraserait la première et les deux
 * extrémités porteraient le même identifiant.
 */
export async function lireRelations(base: Base): Promise<readonly Relation[]> {
	const source = alias(notes, 'note_source');
	const cible = alias(notes, 'note_cible');
	const lignes = await base
		.select({
			de: source.identifiant,
			vers: cible.identifiant,
			type: typesDeRelation.identifiant
		})
		.from(relations)
		.innerJoin(typesDeRelation, eq(relations.typeDeRelationId, typesDeRelation.id))
		.innerJoin(source, eq(relations.sourceId, source.id))
		.innerJoin(cible, eq(relations.cibleId, cible.id))
		.orderBy(source.identifiant, cible.identifiant, typesDeRelation.ordre);

	return lignes.map(
		(r) => ({ de: r.de, vers: r.vers, type: r.type as CleDeTypeDeRelation }) as unknown as Relation
	);
}

/** Les six types de relation et leurs deux libellés (RG-M08-06). */
export async function lireTypesDeRelation(base: Base): Promise<Record<string, LibellesDeRelation>> {
	const lignes = await base
		.select({
			identifiant: typesDeRelation.identifiant,
			sortant: typesDeRelation.libelleSortant,
			entrant: typesDeRelation.libelleEntrant
		})
		.from(typesDeRelation)
		.orderBy(typesDeRelation.ordre);

	const rendu: Record<string, LibellesDeRelation> = {};
	for (const t of lignes) rendu[t.identifiant] = { sortant: t.sortant, entrant: t.entrant };
	return rendu;
}

/** Les types de relation qui portent une dépendance technique. */
export async function lireRelationsTechniques(base: Base): Promise<readonly CleDeTypeDeRelation[]> {
	const lignes = await base
		.select({ identifiant: typesDeRelation.identifiant })
		.from(typesDeRelation)
		.where(eq(typesDeRelation.technique, true))
		.orderBy(typesDeRelation.ordre);
	return lignes.map((t) => t.identifiant as CleDeTypeDeRelation);
}

/* ═══════════════════════════════════════════════════ Le référentiel ════ */

/** Les types de note, dans l'ordre du référentiel. */
export async function lireTypesDeNote(base: Base): Promise<readonly TypeDeNote[]> {
	const lignes = await base
		.select({ nom: typesDeNote.nom })
		.from(typesDeNote)
		.orderBy(typesDeNote.ordre);
	return lignes.map((t) => t.nom as TypeDeNote);
}

/** Les types de fiche et leur schéma de propriétés (CDC §3.5). */
export async function lireTypesDeFiche(
	base: Base
): Promise<Record<string, readonly ChampDeFiche[]>> {
	const TYPE_DEPUIS_ENUM: Record<string, string> = {
		texte: 'texte',
		nombre: 'nombre',
		liste: 'liste',
		booleen: 'interrupteur'
	};
	const lignes = await base
		.select({
			typeNom: typesDeFiche.nom,
			typeOrdre: typesDeFiche.ordre,
			cle: champsDeTypeDeFiche.cle,
			nom: champsDeTypeDeFiche.nom,
			type: champsDeTypeDeFiche.type,
			exemple: champsDeTypeDeFiche.exemple,
			valeurs: champsDeTypeDeFiche.valeurs
		})
		.from(champsDeTypeDeFiche)
		.innerJoin(typesDeFiche, eq(champsDeTypeDeFiche.typeDeFicheId, typesDeFiche.id))
		.orderBy(typesDeFiche.ordre, champsDeTypeDeFiche.ordre);

	const rendu: Record<string, ChampDeFiche[]> = {};
	/* Les types SANS champ existeraient sans cette passe : la jointure ne les
	   rendrait pas, et le référentiel serait amputé sans que rien ne le dise. */
	const tous = await base
		.select({ nom: typesDeFiche.nom })
		.from(typesDeFiche)
		.orderBy(typesDeFiche.ordre);
	for (const t of tous) rendu[t.nom] = [];

	for (const c of lignes) {
		const type = TYPE_DEPUIS_ENUM[c.type];
		if (type === undefined) throw new Error(`type de champ inconnu en base : ${c.type}`);
		const champ: Record<string, unknown> = { cle: c.cle, nom: c.nom, type };
		if (c.exemple !== null) champ['exemple'] = c.exemple;
		if (c.valeurs !== null) champ['valeurs'] = c.valeurs;
		const liste = rendu[c.typeNom];
		if (liste === undefined) throw new Error(`type de fiche inconnu : ${c.typeNom}`);
		liste.push(champ as unknown as ChampDeFiche);
	}
	return rendu;
}

/** Les templates fournis (RG-REF-01). */
export async function lireTemplates(base: Base): Promise<readonly Template[]> {
	const lignes = await base
		.select({
			identifiant: templates.identifiant,
			nom: templates.nom,
			description: templates.description,
			typeNom: typesDeNote.nom,
			defaut: templates.defaut,
			structure: templates.structure,
			contenu: templates.contenu
		})
		.from(templates)
		.innerJoin(typesDeNote, eq(templates.typeDeNoteId, typesDeNote.id))
		.orderBy(templates.identifiant);

	/* `defaut` est déclaré OPTIONNEL dans `interface Template`, et le commentaire
	   du jeu dit pourquoi : « porté par le jeu complet seulement », c'est-à-dire
	   absent des variantes réduites. Dans le jeu complet il est TOUJOURS présent,
	   `false` compris — il est donc toujours rendu, et jamais omis quand il est
	   faux. L'optionnel d'un type n'est pas l'optionnel d'un jeu de données.

	   `utilisations` n'a AUCUNE colonne : c'est un compteur d'emploi, et la
	   batterie d'équivalence le porte en lacune plutôt que ce module en zéro. */
	return lignes.map(
		(t) =>
			({
				id: t.identifiant,
				defaut: t.defaut,
				nom: t.nom,
				type: t.typeNom,
				description: t.description,
				structure: t.structure,
				contenu: t.contenu
			}) as unknown as Template
	);
}

/* ═══════════════════════════════════════════════════ Les comptes ════════ */

/**
 * L'ÉNUMÉRÉ DE LA BASE VERS LE LIBELLÉ AFFICHÉ — les quatre rôles de CDC §2.3.
 *
 * EXPORTÉE DEPUIS `T-077`, et pour une raison de règle : la console doit lire le
 * chemin INVERSE — le sélecteur de `V-32` rend un libellé, la colonne attend
 * l'énuméré — et `RG-M14-07` se joue sur cette correspondance. Deux tables de
 * libellés auraient fini par diverger ; `roleDepuisLeLibelle()`
 * (`./administration.ts`) retourne celle-ci plutôt que d'en écrire une seconde.
 */
export const ROLE_DEPUIS_ENUM: Record<string, string> = {
	administrateur: 'Administrateur',
	referent: 'Référent',
	contributeur: 'Contributeur',
	lecteur: 'Lecteur'
};

/**
 * Les comptes de la console (V-28).
 *
 * TROIS CHAMPS D'`interface Compte` SONT OMIS DU RÉSULTAT, et la migration `005`
 * a changé le motif de deux d'entre eux :
 *
 *   `id`        `c-karim` et ses quatre voisins. TOUJOURS SANS PLACE, et par
 *               décision : `comptes.identifiant` porte déjà l'identifiant de
 *               connexion que CDC:1178 énumère (`karim.belhadj`), et un second
 *               identifiant qu'aucune règle du produit ne demande serait une
 *               colonne de commodité de semence. La table a bien un `id`, mais
 *               c'est un UUID tiré au hasard — rendre l'un pour l'autre serait
 *               rendre une valeur qui change à chaque semence.
 *   `derniere`  « aujourd'hui à 08:41 » — un libellé RELATIF, donc un rendu et
 *               non une donnée. `comptes.derniere_connexion_le` porte l'INSTANT
 *               depuis `005`. Le LIBELLÉ, lui, n'est calculable par aucune règle
 *               du gel : V-32:3043 et V-25:2712 l'écrivent tel quel, et rien ne
 *               dit où « N jours » devient « N mois ». Le rendre demanderait
 *               d'inventer ce seuil, donc un arbitrage — pas une ligne de code.
 *               `chiffrerLesLacunes()` mesure sa restitution ICI, sur ce que ce
 *               module rend : le jour où l'arbitrage tombe et où la fabrique
 *               s'écrit, la lacune se referme sans qu'on touche à l'instrument.
 *
 * `domaine` EST RENDU DEPUIS `T-049`, et son motif d'omission est tombé avec
 * l'instrument qui le portait. `comptes.domaine_id` existe depuis `005`, nullable
 * comme RG-M14-04 (CDC:1149) l'exige, et `semer()` l'écrit pour les cinq comptes.
 * Ce qui retenait le rendu n'était pas la base : c'était le
 * `champsDeCompteSansContrepartie` EN DUR d'`equivalence.ts`, qui écartait le
 * champ de la référence — rendre la donnée juste y aurait produit cinq
 * « divergences », mot qui signifie « la couche rend MAL ». Les deux éditions
 * étaient couplées ; `T-049` les a faites en une fois.
 *
 * LE RATTACHEMENT VIDE SE DIT PAR L'ABSENCE DE LA CLÉ, jamais par une chaîne
 * vide ni par `null` posé. `interface Compte` déclare `domaine` requis, et le
 * jeu en donne un aux cinq comptes ; mais la colonne est nullable PAR EXIGENCE,
 * et un compte dont le domaine a été supprimé n'en a plus. Poser la clé à `null`
 * fabriquerait un nom de domaine qui n'existe pas — l'omettre dit exactement ce
 * que la base dit. C'est la règle que `premiereDifference()` sait voir, et que
 * la sonde `optionnel-pose` éprouve sur les notes.
 */
export async function lireComptes(base: Base): Promise<readonly Partial<Compte>[]> {
	const lignes = await base
		.select({
			identifiant: comptes.identifiant,
			nom: comptes.nom,
			courriel: comptes.courriel,
			role: comptes.role,
			actif: comptes.actif,
			arriveLe: comptes.arriveLe,
			domaineNom: domaines.nom
		})
		.from(comptes)
		.leftJoin(domaines, eq(comptes.domaineId, domaines.id))
		.orderBy(comptes.identifiant);

	return lignes.map((c) => {
		const role = ROLE_DEPUIS_ENUM[c.role];
		if (role === undefined) throw new Error(`rôle inconnu en base : ${c.role}`);
		const rendu: Record<string, unknown> = {
			nom: c.nom,
			identifiant: c.identifiant,
			courriel: c.courriel,
			role,
			actif: c.actif,
			arrivee: dateCourteDIso(c.arriveLe)
		};
		if (c.domaineNom !== null) rendu['domaine'] = c.domaineNom;
		return rendu as unknown as Partial<Compte>;
	});
}

/* ═══════════════════════════════════════════════ La configuration ══════ */

/**
 * La configuration globale (CDC §3.3, M14.7) — la table `parametres`.
 *
 * ELLE EST LUE, JAMAIS REDÉCLARÉE. ADR-005 interdit de dupliquer les seuils
 * ailleurs que dans la configuration que lit l'implémentation unique : cette
 * fonction est le chemin par lequel `niveauFraicheur()` reçoit ses seuils, et
 * il n'y en a pas d'autre.
 */
export async function lireConfiguration(base: Base): Promise<Configuration> {
	const lignes = await base
		.select({ cle: parametres.cle, valeur: parametres.valeur })
		.from(parametres);
	const par = new Map(lignes.map((p) => [p.cle, p.valeur]));

	const nombre = (cle: string): number => {
		const valeur = par.get(cle);
		if (typeof valeur !== 'number') {
			throw new Error(`paramètre ${cle} attendu numérique, obtenu ${typeof valeur}`);
		}
		return valeur;
	};
	const chaine = (cle: string): string => {
		const valeur = par.get(cle);
		if (typeof valeur !== 'string') {
			throw new Error(`paramètre ${cle} attendu textuel, obtenu ${typeof valeur}`);
		}
		return valeur;
	};

	/* LES SEPT CLÉS VIENNENT DU SCHÉMA, ET DE NULLE PART AILLEURS. Elles étaient
	   ici en littéraux, ce qui suffisait tant que rien n'écrivait dans
	   `parametres` ; `T-077` y écrit, et `RG-M14-09` — « toute modification de
	   seuil provoque un recalcul immédiat » — serait fausse à la lettre si
	   l'écriture posait une clé que cette lecture n'interroge pas. Une seule
	   table de clés rend ce cas INÉCRIVABLE. */
	return {
		seuilFrais: nombre(CLES_DE_PARAMETRE.seuilFrais),
		seuilVieillissant: nombre(CLES_DE_PARAMETRE.seuilVieillissant),
		versionsMax: nombre(CLES_DE_PARAMETRE.versionsMax),
		portailAssistance: chaine(CLES_DE_PARAMETRE.portailAssistance),
		motFiche: chaine(CLES_DE_PARAMETRE.motFiche),
		tailleMaxPieceJointe: nombre(CLES_DE_PARAMETRE.tailleMaxPieceJointe),
		dureeSession: nombre(CLES_DE_PARAMETRE.dureeSession)
	};
}

/**
 * Les seuils de fraîcheur en vigueur, dans la forme que `niveauFraicheur()`
 * attend. C'est le raccourci qu'un chargeur de route emploie avant `lireNotes`.
 */
export async function lireSeuils(base: Base): Promise<SeuilsDeFraicheur> {
	const config = await lireConfiguration(base);
	return { frais: config.seuilFrais, vieillissant: config.seuilVieillissant };
}
