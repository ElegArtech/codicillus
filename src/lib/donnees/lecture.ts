/**
 * La couche de lecture — les formes de `seeds/corpus.ts`, rendues depuis la base.
 *
 * Les 41 vues gelées déclarent leurs propriétés avec les types de `seeds/corpus.ts` : ce
 * module ne définit donc AUCUN type nouveau, ce qui permet à un chargeur de remplacer
 * `corpusPourVue(…)` par `lireNotes(…)` sans toucher la vue. Il est l'INVERSE de la
 * semence, et une mesure en base établit la fidélité de l'aller-retour.
 *
 * `base` EST UN PARAMÈTRE, et `basePartagee()` n'est pas appelée ici : `acces.ts` importe
 * `$env/dynamic/private`, qui n'existe que dans le graphe de SvelteKit et rendrait ce
 * module inéprouvable par `vitest` ; et un paramètre explicite rend la transaction
 * possible. LA FRAÎCHEUR N'EST PAS RECALCULÉE ICI (`P-01`), et L'INSTANT DE RÉFÉRENCE EST
 * UN PARAMÈTRE : une couche de lecture qui prendrait l'heure elle-même rendrait ses
 * résultats non reproductibles.
 */
import { count, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Base } from '../base/acces';
import {
	champsDeTypeDeFiche,
	CLES_DE_PARAMETRE,
	CONFIGURATION_PAR_DEFAUT,
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
	DemandeDeRevision,
	CleDeModule,
	CleDeTypeDeRelation,
	Compte,
	Configuration,
	Domaine,
	IdentifiantNote,
	LibellesDeRelation,
	Note,
	PresentationDeTypeDeFiche,
	Relation,
	Template,
	TypeDeFiche,
	TypeDeNote,
	Univers
} from '../../../seeds/corpus';
import { analyserDocument, texteBrut } from '../contenu/document';

/**
 * `2026-07-18T00:00:00.000Z` vers `18/07/2026` — l'inverse de `dateCourteEnIso()` de la
 * semence. LES COMPOSANTES SONT LUES EN UTC, ET C'EST LA SEULE LECTURE JUSTE : relire
 * avec `getDate()` donnerait le 17 dans tout fuseau à l'ouest de Greenwich, et le décalage
 * d'un jour déplacerait le niveau de fraîcheur d'une note posée sur un seuil.
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

export function joursEcoules(instant: Date, maintenant: Date): number {
	return Math.floor((maintenant.getTime() - instant.getTime()) / MILLISECONDES_PAR_JOUR);
}

/**
 * L'ancienneté de la dernière MODIFICATION de chaque note, en jours. Ce n'est pas
 * `Note.jours`, qui porte l'âge de la VÉRIFICATION. LA TABLE RENDUE EST PARTIELLE, ET
 * C'EST `P-02` : une note dont la ligne manque s'affiche « modification inconnue » plutôt
 * que de recevoir une ancienneté inventée.
 */
export async function ancienneteDeModification(
	base: Base,
	lisibles: readonly Note[],
	maintenant: Date
): Promise<Partial<Record<IdentifiantNote, number>>> {
	const identifiants = lisibles.map((n) => n.id as string);
	if (identifiants.length === 0) return {};
	const lignes = await base
		.select({ identifiant: notes.identifiant, modifieLe: notes.modifieLe })
		.from(notes)
		.where(inArray(notes.identifiant, identifiants));
	const table: Record<string, number> = {};
	for (const ligne of lignes) table[ligne.identifiant] = joursEcoules(ligne.modifieLe, maintenant);
	return table as Partial<Record<IdentifiantNote, number>>;
}

/**
 * LES DEMANDES DE RÉVISION OUVERTES, SANS FILTRE DE PÉRIMÈTRE — `notes.revision_*`
 * (`RG-M06-05` : le signalement est porté par la NOTE, non par une table à part).
 *
 * SANS FILTRE, DONC RÉSERVÉE À LA CONSOLE, où l'appelant est administrateur : les vues de
 * périmètre restreint ont leur propre lecture, filtrée sur leurs dossiers (`ADR-006`).
 *
 * LA JOINTURE INTERNE SUR `comptes` PORTE UNE RÈGLE : `revision_par_id` est `SET NULL` à la
 * suppression du demandeur, et l'écran affiche « signalée par X ». Une demande dont le
 * demandeur a disparu est écartée plutôt que dotée d'un nom inventé.
 */
export async function lireToutesLesDemandesDeRevision(
	base: Base,
	maintenant: Date
): Promise<readonly DemandeDeRevision[]> {
	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			par: comptes.nom,
			le: notes.revisionLe,
			commentaire: notes.revisionCommentaire
		})
		.from(notes)
		.innerJoin(comptes, eq(notes.revisionParId, comptes.id))
		.where(eq(notes.revisionDemandee, true))
		.orderBy(desc(notes.revisionLe));

	return lignes.flatMap((l) =>
		l.le === null
			? []
			: [
					{
						id: l.identifiant,
						par: l.par,
						le: dateCourteDInstant(l.le),
						jours: joursEcoules(l.le, maintenant),
						/* La contrainte de base autorise une demande SANS commentaire : la chaîne
						   vide dit l'absence sans rien fabriquer. */
						commentaire: l.commentaire ?? ''
					} as unknown as DemandeDeRevision
				]
	);
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

/**
 * L'extrait d'une note — dérivé du TEXTE BRUT de son corps. `STACK-TECHNIQUE.md` tranche :
 * des trois formes que le format dérive, le texte brut est produit « à l'enregistrement »
 * et sert à « l'indexation, les EXTRAITS, la détection de doublon ». L'extrait n'est pas
 * stocké — aucune colonne — c'est une dérivation.
 *
 * LE PARCOURS RESTE STRUCTUREL, JAMAIS TEXTUEL : `texteBrut()` parcourt l'arbre de nœuds,
 * et `ADR-003` interdit « toute manipulation du corps par expression régulière ».
 *
 * CE QU'AUCUNE SOURCE NE DIT, et qui n'est donc pas décidé ici : la LONGUEUR d'un extrait.
 * Cette fonction ne tronque pas ; le jour où une source le dira, la coupe se pose ICI.
 */
export function extraitDuCorps(corps: unknown): string {
	return texteBrut(analyserDocument(corps));
}

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

export async function lireDomaines(base: Base): Promise<readonly Domaine[]> {
	const lignes = await base
		.select({ nom: domaines.nom, universNom: univers.nom, couleur: domaines.couleur })
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.orderBy(univers.ordre, domaines.nom);

	return lignes.map((d) => ({ nom: d.nom, univers: d.universNom, couleur: d.couleur }) as Domaine);
}

/**
 * Les modules activés, par domaine (`RG-STR-06`, `P-04`). `MODULE_EN_ENUM` de la semence
 * traduit `carteMentale` en `carte_mentale` ; la table de retour est son inverse, déclarée
 * et non tacite.
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
 * Le chemin de rangement de chaque dossier, tel que `Note.dossier` l'écrit : les segments
 * SOUS la racine, séparés par « › ». La racine porte le nom de son domaine et n'entre pas
 * dans le chemin affiché — c'est ce que `segmentsDeDossier()` défait, et ce que cette
 * fonction refait.
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

export async function lireDomainesParDossier(base: Base): Promise<ReadonlyMap<string, string>> {
	const lignes = await base
		.select({ id: dossiers.id, domaineNom: domaines.nom })
		.from(dossiers)
		.innerJoin(domaines, eq(dossiers.domaineId, domaines.id));
	return new Map(lignes.map((d) => [d.id, d.domaineNom]));
}

/**
 * Les notes, dans la forme exacte de `interface Note`.
 *
 * `pj` N'EST PAS RENDU TEL QUE LE JEU LE PORTE : le compte rendu est le compte RÉEL de la
 * table, jamais le chiffre du jeu. Le gel nomme deux des treize pièces, mais leurs tailles
 * y sont RENDUES — « 1,2 Mo » désigne un intervalle, pas un nombre d'octets.
 *
 * @param identifiants restreint la lecture à ces notes, DANS la requête. Absent : tout le
 *   corpus. Présent, il vient d'une décision d'accès déjà prise et ne DÉCIDE de rien.
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

	/* LA RESTRICTION EST DANS LA REQUÊTE, JAMAIS APRÈS ELLE : quand l'appelant sait
	   déjà quelles notes il a le droit de lire, c'est la clause SQL qui le dit, et
	   la base ne remonte pas une ligne de plus (`ADR-006`). */
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
			/* L'ÂGE DE LA VÉRIFICATION, PAS CELUI DE LA MODIFICATION, quand la ligne du
			   dessus calcule la fraîcheur sur `verifie_le ?? modifie_le`. Les deux ont
			   longtemps divergé : le cartouche pouvait écrire « Vérifié il y a 3 jours »
			   sur une note vérifiée il y a neuf mois et modifiée avant-hier. */
			jours: joursEcoules(reference, contexte.maintenant),
			revise: n.verifieLe === null ? null : dateCourteDInstant(n.verifieLe),
			vues: n.consultations,
			pj: piecesParNote.get(n.identifiant) ?? 0,
			brouillon: n.statut === 'brouillon',
			visibilite: n.visibilite === 'publique' ? 'Publique' : 'Interne',
			operationnel: n.corpsOperationnel !== null,
			etiquettes: etiquettesParNote.get(n.identifiant) ?? []
		};
		/* Trois clés OPTIONNELLES : omises quand la colonne est nulle, jamais posées
		   à `undefined`. Une clé présente et vide n'est pas la même valeur qu'une clé
		   absente pour une comparaison profonde. */
		if (n.typeFicheNom !== null) rendu['typeFiche'] = n.typeFicheNom as TypeDeFiche;
		if (n.signetAdresse !== null) rendu['url'] = n.signetAdresse;
		if (n.signetAjouteLe !== null) rendu['ajoute'] = dateCourteDIso(n.signetAjouteLe);
		return rendu as unknown as Note;
	});
}

/**
 * Les étiquettes de chaque note, dans l'ordre porté par `etiquettes_de_note.ordre` —
 * l'ordre des maquettes, rendu sans comparateur. NE PAS LE REMPLACER PAR UN TRI DE
 * LIBELLÉ, NI EN SQL NI EN TYPESCRIPT : la collation du serveur classe sur les octets de
 * l'encodage, où `é` suit `f`, là où `localeCompare(…, 'fr')` le place avant.
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
 * Le nombre de pièces jointes par note — le compte RÉEL de la table, donc 0
 * partout tant que rien n'en écrit. Le rendre autrement serait la valeur
 * illustrative que `P-02` proscrit.
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

/**
 * Les relations, par les identifiants lisibles de leurs deux extrémités. `notes`
 * est jointe DEUX FOIS — source et cible —, ce qui exige deux alias : sans eux, la
 * seconde jointure écraserait la première.
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

export async function lireRelationsTechniques(base: Base): Promise<readonly CleDeTypeDeRelation[]> {
	const lignes = await base
		.select({ identifiant: typesDeRelation.identifiant })
		.from(typesDeRelation)
		.where(eq(typesDeRelation.technique, true))
		.orderBy(typesDeRelation.ordre);
	return lignes.map((t) => t.identifiant as CleDeTypeDeRelation);
}

export async function lireTypesDeNote(base: Base): Promise<readonly TypeDeNote[]> {
	const lignes = await base
		.select({ nom: typesDeNote.nom })
		.from(typesDeNote)
		.orderBy(typesDeNote.ordre);
	return lignes.map((t) => t.nom as TypeDeNote);
}

/**
 * Un type de note tel que `/console/types-de-note` le montre — le nom, et CE QUI LE
 * RETIENT. `RG-REF-03` refuse la suppression d'un type EMPLOYÉ : le refus doit dire
 * combien, et les deux tables qui pointent `types_de_note` comptent toutes les deux —
 * `notes.type_de_note_id` et `templates.type_de_note_id`, l'une comme l'autre en
 * `ON DELETE RESTRICT`. Compter les notes seules laisserait la base refuser un geste
 * que l'écran vient d'annoncer comme possible.
 */
export interface TypeDeNoteAdministrable {
	readonly identifiant: string;
	readonly nom: string;
	readonly ordre: number;
	readonly notes: number;
	readonly templates: number;
}

/**
 * Les types de note ET leur emploi, dans l'ordre de la nomenclature.
 *
 * `count(distinct …)` PARCE QUE LES DEUX JOINTURES SE MULTIPLIENT : un type porté par
 * trois notes et deux templates rendrait six d'un côté comme de l'autre sans le
 * `distinct`, et le refus annoncerait un nombre que personne ne retrouve à l'écran.
 */
export async function lireLesTypesDeNoteAdministrables(
	base: Base
): Promise<readonly TypeDeNoteAdministrable[]> {
	return base
		.select({
			identifiant: typesDeNote.identifiant,
			nom: typesDeNote.nom,
			ordre: typesDeNote.ordre,
			notes: sql<number>`count(distinct ${notes.id})::int`,
			templates: sql<number>`count(distinct ${templates.id})::int`
		})
		.from(typesDeNote)
		.leftJoin(notes, eq(notes.typeDeNoteId, typesDeNote.id))
		.leftJoin(templates, eq(templates.typeDeNoteId, typesDeNote.id))
		.groupBy(typesDeNote.id)
		.orderBy(typesDeNote.ordre);
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
			aide: champsDeTypeDeFiche.aide,
			defaut: champsDeTypeDeFiche.defaut,
			obligatoire: champsDeTypeDeFiche.obligatoire,
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
		/* UNE COLONNE VIDE N'EST PAS UNE CLÉ VIDE : la propriété n'est posée que
		   si la console a écrit quelque chose, si bien qu'un référentiel monté
		   avant la migration rend exactement ce qu'il rendait. */
		if (c.aide !== null) champ['aide'] = c.aide;
		if (c.defaut !== null) champ['defaut'] = c.defaut;
		if (c.obligatoire) champ['obligatoire'] = true;
		if (c.valeurs !== null) champ['valeurs'] = c.valeurs;
		const liste = rendu[c.typeNom];
		if (liste === undefined) throw new Error(`type de fiche inconnu : ${c.typeNom}`);
		liste.push(champ as unknown as ChampDeFiche);
	}
	return rendu;
}

/**
 * La présentation des types de fiche — description et icône, par nom de type. ELLE EST LUE
 * À PART, ET C'EST DÉLIBÉRÉ : `lireTypesDeFiche()` rend le SCHÉMA, et une douzaine
 * d'appelants en dépendent sous cette forme exacte. Un type sans description ni icône rend
 * des chaînes vides, jamais `null`.
 */
export async function lirePresentationsDeTypeDeFiche(
	base: Base
): Promise<Record<string, PresentationDeTypeDeFiche>> {
	const lignes = await base
		.select({
			nom: typesDeFiche.nom,
			description: typesDeFiche.description,
			glyphe: typesDeFiche.glyphe
		})
		.from(typesDeFiche)
		.orderBy(typesDeFiche.ordre);

	const rendu: Record<string, PresentationDeTypeDeFiche> = {};
	for (const t of lignes) {
		rendu[t.nom] = { description: t.description ?? '', glyphe: t.glyphe ?? '' };
	}
	return rendu;
}

export interface ChampNommeDeFiche {
	readonly cle: string;
	readonly nom: string;
}

/**
 * Les champs d'un seul type de fiche, dans l'ordre du référentiel — le libellé et la clé.
 *
 * POURQUOI CETTE PORTE PLUTÔT QUE `lireTypesDeFiche()` : celle-là convertit l'énumération
 * `type_de_champ` en type d'écran, sa table ne couvre que quatre des six valeurs que la
 * base accepte, et une valeur non couverte fait LEVER la lecture — un champ `date` posé
 * n'importe où ferait tomber la lecture de TOUTE fiche. Celle-ci ne convertit rien.
 */
export async function lireLesChampsDUnTypeDeFiche(
	base: Base,
	nomDuType: string
): Promise<readonly ChampNommeDeFiche[]> {
	return await base
		.select({ cle: champsDeTypeDeFiche.cle, nom: champsDeTypeDeFiche.nom })
		.from(champsDeTypeDeFiche)
		.innerJoin(typesDeFiche, eq(champsDeTypeDeFiche.typeDeFicheId, typesDeFiche.id))
		.where(eq(typesDeFiche.nom, nomDuType))
		.orderBy(champsDeTypeDeFiche.ordre);
}

/**
 * Les propriétés typées des notes demandées — `notes.proprietes_typees`.
 *
 * Le schéma d'un type de fiche dit quels champs une fiche PORTE ; il ne dit rien de ce que
 * CETTE note y a mis. Sans cette lecture, le panneau de détail de la cartographie affichait
 * sous « Propriétés » la valeur d'EXEMPLE du référentiel. LA RESTRICTION EST DANS LA
 * REQUÊTE (`ADR-006`). LA COLONNE EST UN `jsonb`, DONC DE FORME NON GARANTIE : ce qui ne
 * se rend pas en texte est ÉCARTÉ plutôt que converti au jugé.
 */
export async function lireLesProprietesDeFiche(
	base: Base,
	identifiants: readonly string[]
): Promise<Record<string, Record<string, string>>> {
	if (identifiants.length === 0) return {};
	const lignes = await base
		.select({ identifiant: notes.identifiant, proprietes: notes.proprietesTypees })
		.from(notes)
		.where(inArray(notes.identifiant, [...identifiants]));

	const rendu: Record<string, Record<string, string>> = {};
	for (const ligne of lignes) {
		const brut = ligne.proprietes;
		if (brut === null || typeof brut !== 'object' || Array.isArray(brut)) continue;
		const valeurs: Record<string, string> = {};
		for (const [cle, valeur] of Object.entries(brut as Record<string, unknown>)) {
			if (typeof valeur === 'string') {
				if (valeur !== '') valeurs[cle] = valeur;
			} else if (typeof valeur === 'number' || typeof valeur === 'boolean') {
				valeurs[cle] = String(valeur);
			}
		}
		if (Object.keys(valeurs).length > 0) rendu[ligne.identifiant] = valeurs;
	}
	return rendu;
}

/**
 * Les templates fournis (RG-REF-01), et LE NOMBRE DE NOTES QUI EN SONT PARTIES.
 *
 * `utilisations` EST COMPTÉ, JAMAIS DÉCLARÉ. La migration `011` a posé
 * `notes.template_id`, une TRACE D'ORIGINE : `creerUneNote()` l'écrit, cette jointure la
 * compte. Le compteur des quatre endroits de V-31 — total, ligne, tiroir, dialogue de
 * suppression — rendait « — » faute de toute colonne ; zéro y est désormais un
 * RÉSULTAT, celui d'un squelette dont personne n'est encore parti.
 *
 * LA JOINTURE EST EXTERNE À GAUCHE, et `count()` porte sur `notes.id` et non sur `*` :
 * `count(*)` d'un template sans note rendrait UN, la ligne de gauche étant comptée.
 */
export async function lireTemplates(base: Base): Promise<readonly Template[]> {
	const lignes = await base
		.select({
			identifiant: templates.identifiant,
			nom: templates.nom,
			description: templates.description,
			typeNom: typesDeNote.nom,
			defaut: templates.defaut,
			structure: templates.structure,
			contenu: templates.contenu,
			utilisations: count(notes.id)
		})
		.from(templates)
		.innerJoin(typesDeNote, eq(templates.typeDeNoteId, typesDeNote.id))
		.leftJoin(notes, eq(notes.templateId, templates.id))
		.groupBy(
			templates.id,
			templates.identifiant,
			templates.nom,
			templates.description,
			typesDeNote.nom,
			templates.defaut,
			templates.structure,
			templates.contenu
		)
		.orderBy(templates.identifiant);

	/* `defaut` est déclaré OPTIONNEL dans `interface Template` parce qu'il est
	   absent des variantes réduites du jeu ; dans le jeu complet il est toujours
	   présent, `false` compris. L'optionnel d'un type n'est pas l'optionnel d'un jeu
	   de données. */
	return lignes.map(
		(t) =>
			({
				id: t.identifiant,
				defaut: t.defaut,
				nom: t.nom,
				type: t.typeNom,
				description: t.description,
				structure: t.structure,
				contenu: t.contenu,
				utilisations: t.utilisations
			}) as unknown as Template
	);
}

/**
 * L'énuméré de la base vers le libellé affiché — les quatre rôles de CDC §2.3. EXPORTÉE
 * parce que la console lit le chemin INVERSE, et que `RG-M14-07` se joue sur cette
 * correspondance : `roleDepuisLeLibelle()` retourne celle-ci plutôt que d'en écrire une
 * seconde, deux tables de libellés ayant fini par diverger.
 */
export const ROLE_DEPUIS_ENUM: Record<string, string> = {
	administrateur: 'Administrateur',
	referent: 'Référent',
	contributeur: 'Contributeur',
	lecteur: 'Lecteur'
};

/**
 * Les comptes de la console (V-28). Deux champs d'`interface Compte` sont omis :
 *
 *   `id`        `comptes.identifiant` porte déjà l'identifiant de connexion que le cahier
 *               énumère ; la table a bien un `id`, mais c'est un UUID tiré au hasard.
 *   `derniere`  un libellé RELATIF, donc un rendu et non une donnée. Le libellé n'est
 *               calculable par aucune règle du gel, qui l'écrit tel quel sans dire où
 *               « N jours » devient « N mois ».
 *
 * LE RATTACHEMENT VIDE SE DIT PAR L'ABSENCE DE LA CLÉ, jamais par une chaîne vide ni par
 * `null` posé : `interface Compte` déclare `domaine` requis, mais la colonne est nullable
 * PAR EXIGENCE (`RG-M14-04`). Poser la clé à `null` fabriquerait un nom de domaine qui
 * n'existe pas.
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

/**
 * La configuration globale (CDC §3.3, M14.7) — la table `parametres`. Elle est
 * LUE, jamais redéclarée : `ADR-005` interdit de dupliquer les seuils ailleurs, et
 * c'est par ici que `niveauFraicheur()` reçoit les siens.
 */
export async function lireConfiguration(base: Base): Promise<Configuration> {
	const lignes = await base
		.select({ cle: parametres.cle, valeur: parametres.valeur })
		.from(parametres);
	const par = new Map(lignes.map((p) => [p.cle, p.valeur]));

	/* UN PARAMÈTRE ABSENT PREND SON DÉFAUT — IL NE FAIT PAS TOMBER LA PAGE. Sur une
	   installation neuve, `parametres` est vide, et ces lecteurs faisaient sortir
	   les pages en 500. Un paramètre PRÉSENT MAIS DU MAUVAIS TYPE lève encore :
	   c'est une base corrompue, pas une base neuve. */
	const nombre = (cle: string, defaut: number): number => {
		const valeur = par.get(cle);
		if (valeur === undefined) return defaut;
		if (typeof valeur !== 'number') {
			throw new Error(`paramètre ${cle} attendu numérique, obtenu ${typeof valeur}`);
		}
		return valeur;
	};
	/* UN PLAFOND DE VERSIONS HORS DOMAINE PREND SON DÉFAUT, IL NE SE PROPAGE PAS.
	   `RG-M07-03` donne au plafond un défaut, qui vaut pour la clé absente comme pour la
	   valeur inutilisable. `lireConfiguration()` est la SEULE source des deux consommateurs
	   du plafond — l'écran d'historique et la purge —, et les replier ici les empêche de
	   diverger. */
	const plafond = (cle: string, defaut: number): number => {
		const valeur = nombre(cle, defaut);
		return Number.isSafeInteger(valeur) && valeur >= 1 ? valeur : defaut;
	};
	/* UN DRAPEAU ABSENT VAUT SON DÉFAUT, comme les autres — et son défaut est
	   `false` : une instance neuve n'est pas indisponible. Une valeur présente
	   mais non booléenne lève, comme partout ici : base corrompue, pas base neuve. */
	const booleen = (cle: string, defaut: boolean): boolean => {
		const valeur = par.get(cle);
		if (valeur === undefined) return defaut;
		if (typeof valeur !== 'boolean') {
			throw new Error(`paramètre ${cle} attendu booléen, obtenu ${typeof valeur}`);
		}
		return valeur;
	};
	const chaine = (cle: string, defaut: string): string => {
		const valeur = par.get(cle);
		if (valeur === undefined) return defaut;
		if (typeof valeur !== 'string') {
			throw new Error(`paramètre ${cle} attendu textuel, obtenu ${typeof valeur}`);
		}
		return valeur;
	};

	/* LES DIX CLÉS VIENNENT DU SCHÉMA, ET DE NULLE PART AILLEURS : `RG-M14-09`
	   serait fausse à la lettre si l'écriture posait une clé que cette lecture
	   n'interroge pas. Une seule table de clés rend ce cas INÉCRIVABLE. */
	return {
		seuilFrais: nombre(CLES_DE_PARAMETRE.seuilFrais, CONFIGURATION_PAR_DEFAUT.seuilFrais),
		seuilVieillissant: nombre(
			CLES_DE_PARAMETRE.seuilVieillissant,
			CONFIGURATION_PAR_DEFAUT.seuilVieillissant
		),
		versionsMax: plafond(CLES_DE_PARAMETRE.versionsMax, CONFIGURATION_PAR_DEFAUT.versionsMax),
		portailAssistance: chaine(
			CLES_DE_PARAMETRE.portailAssistance,
			CONFIGURATION_PAR_DEFAUT.portailAssistance
		),
		nomOrganisation: chaine(
			CLES_DE_PARAMETRE.nomOrganisation,
			CONFIGURATION_PAR_DEFAUT.nomOrganisation
		),
		motFiche: chaine(CLES_DE_PARAMETRE.motFiche, CONFIGURATION_PAR_DEFAUT.motFiche),
		tailleMaxPieceJointe: nombre(
			CLES_DE_PARAMETRE.tailleMaxPieceJointe,
			CONFIGURATION_PAR_DEFAUT.tailleMaxPieceJointe
		),
		dureeSession: nombre(CLES_DE_PARAMETRE.dureeSession, CONFIGURATION_PAR_DEFAUT.dureeSession),
		indisponibiliteActive: booleen(
			CLES_DE_PARAMETRE.indisponibiliteActive,
			CONFIGURATION_PAR_DEFAUT.indisponibiliteActive
		),
		messageDIndisponibilite: chaine(
			CLES_DE_PARAMETRE.messageDIndisponibilite,
			CONFIGURATION_PAR_DEFAUT.messageDIndisponibilite
		)
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
