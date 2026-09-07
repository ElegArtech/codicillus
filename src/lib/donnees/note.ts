/**
 * La lecture d'une note, depuis la base — ce que `/notes/{identifiant}` charge.
 *
 * Quatre implémentations uniques sont appelées ici, aucune n'est recopiée : `./lecture.ts`
 * pour les formes du jeu, `../droits/resolution.ts` pour les droits, `../contenu/rendu.ts`
 * pour `rendreDocument` (`ADR-004`), et `../fraicheur.ts` par `lireNotes`.
 *
 * CE QUE LA BASE NE PORTE PAS N'EST PAS INVENTÉ ICI : les corps semés sont d'un seul bloc,
 * les corps Opérationnels des cinq notes qui en déclarent un sont VIDES, et aucune note ne
 * porte de lien interne. Les quatre corps de `../contenu/documents-du-gel.ts` ne sont PAS
 * substitués — les servir en lecture d'une note réelle serait la valeur illustrative que
 * `P-02` proscrit.
 *
 * LE FILTRE EST DANS LA REQUÊTE (`ADR-006`) : la condition de périmètre est portée par le
 * `where`, jamais par un tri de son résultat. `resoudre()` reste appelé par-dessus — il est
 * le garde-fou, pas le filtre. LE CORPUS DE LA COQUILLE, LUI, EST FILTRÉ APRÈS COUP, et
 * c'est un écart déclaré : `lireNotes()` n'accepte aucun périmètre.
 */
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { domaines, dossiers, droitsDeDossier, notes } from '../base/schema';
import { analyserDocument, liensInternes, texteBrut, type Document } from '../contenu/document';
import { rendreDocument, type CibleDeNote, type ResolveurDeNote } from '../contenu/rendu';
import {
	capacites,
	indexerLesDroits,
	noteLisible,
	perimetreDeLecture,
	resoudre,
	resoudreDroitDeDossier,
	type Capacites,
	type Identite,
	type IndexDesDroits,
	type Perimetre,
	type Resolution
} from '../droits/resolution';
import { adresseDeNote } from '../rangement/adresses';
import { lireNotes, type ContexteDeLecture } from './lecture';
import type { Note } from '../../../seeds/corpus';

export type Registre = 'reference' | 'operationnel';

/**
 * Le registre demandé par l'adresse — `?registre=`, « `reference` (défaut) ·
 * `operationnel` ». Le gel ÉCRIT ce paramètre et ne le LIT jamais : aucune ligne de la
 * maquette ne relit `location.search` au chargement. L'état initial vient donc de
 * `docs/routes.md` §4.1, qui nomme `reference` comme défaut.
 */
export function registreDemande(parametre: string | null): Registre {
	return parametre === 'operationnel' ? 'operationnel' : 'reference';
}

/**
 * Le corps d'un registre, tel que la base le porte — et ce qu'il faut en dire
 * quand elle ne porte rien.
 */
export interface CorpsDeNote {
	readonly registre: Registre;
	readonly existe: boolean;
	/**
	 * Le document porte du texte. Faux : il existe et il est VIDE — l'état que
	 * le gel prévoit, jamais un corps inventé.
	 */
	readonly redige: boolean;
	/** Le HTML rendu par `rendreDocument`, et par rien d'autre (ADR-004). */
	readonly html: string;
	readonly cites: readonly string[];
}

/**
 * Le corps rendu. Un document absent rend un corps vide déclaré tel : il n'y a
 * pas de branche « à défaut, prendre l'autre registre ».
 */
export function corpsRendu(
	valeur: unknown,
	registre: Registre,
	resoudreUneNote: ResolveurDeNote
): CorpsDeNote {
	if (valeur === null || valeur === undefined) {
		return { registre, existe: false, redige: false, html: '', cites: [] };
	}
	const document: Document = analyserDocument(valeur);
	return {
		registre,
		existe: true,
		redige: texteBrut(document).trim() !== '',
		html: rendreDocument(document, { resoudre: resoudreUneNote, contexte: 'interne' }),
		cites: liensInternes(document)
	};
}

export interface NoteCitable {
	readonly identifiant: string;
	readonly titre: string;
	readonly publique: boolean;
}

/**
 * Le résolveur des liens internes, adossé à la base.
 *
 * L'ADRESSE EST BÂTIE SUR `notes.identifiant`, et non sur un identifiant dérivé du titre :
 * c'est celui que la colonne porte et que cette route résout. `resoudreDansLeCorpus` de
 * `documents-du-gel.ts` construit, lui, une adresse dérivée du titre ; les deux formes
 * divergent sur les 32 notes du corpus, et l'écart est déclaré.
 *
 * Une cible inconnue rend `null`, ce qui fait rendre `a.lien-casse` sans `href`.
 */
export function resolveurDeNotes(citables: readonly NoteCitable[]): ResolveurDeNote {
	const parIdentifiant = new Map<string, NoteCitable>(citables.map((c) => [c.identifiant, c]));
	return (identifiant: string): CibleDeNote | null => {
		const cible = parIdentifiant.get(identifiant);
		if (cible === undefined) return null;
		return {
			id: cible.identifiant,
			titre: cible.titre,
			adresse: adresseDeNote(cible.identifiant),
			publique: cible.publique
		};
	};
}

export interface Retrolien {
	readonly identifiant: string;
	readonly titre: string;
	readonly domaine: string;
	readonly adresse: string;
}

export interface CorpsEnBase {
	readonly identifiant: string;
	readonly titre: string;
	readonly domaine: string;
	readonly reference: unknown;
	readonly operationnel: unknown;
}

/**
 * Les rétroliens sont déduits, jamais saisis — `RG-M05-02` : « recalculés par
 * parcours de l'arbre du document ». Les deux registres comptent : une note citée
 * depuis un corps Opérationnel est citée. L'ordre est celui de la requête :
 * déterministe, et sans invention d'un ordre de pertinence.
 */
export function retroliensVers(
	identifiant: string,
	corps: readonly CorpsEnBase[]
): readonly Retrolien[] {
	const vers: Retrolien[] = [];
	for (const c of corps) {
		if (c.identifiant === identifiant) continue;
		const cites = new Set<string>();
		for (const valeur of [c.reference, c.operationnel]) {
			if (valeur === null || valeur === undefined) continue;
			for (const cible of liensInternes(analyserDocument(valeur))) cites.add(cible);
		}
		if (cites.has(identifiant)) {
			vers.push({
				identifiant: c.identifiant,
				titre: c.titre,
				domaine: c.domaine,
				adresse: adresseDeNote(c.identifiant)
			});
		}
	}
	return vers;
}

/**
 * Le périmètre de la famille `/notes/…` — `docs/routes.md` §5.5 rend **404 V-04** à
 * l'anonyme, sans condition sur la note. Une note publique et publiée se lit à
 * `/guides/{identifiant}` : « une seule adresse, un seul rendu » (`ARB-007` A-05).
 * L'anonyme reçoit donc un périmètre VIDE, et non le périmètre public.
 */
const AUCUN_DOSSIER: Perimetre = { tout: false, dossiers: new Set<string>() };

export function perimetreDeLaLectureDUneNote(identite: Identite, index: IndexDesDroits): Perimetre {
	if (identite.type === 'anonyme') return AUCUN_DOSSIER;
	return perimetreDeLecture(identite, index);
}

/**
 * L'index des droits de l'appelant : l'arborescence complète, et les droits
 * explicites DE CE COMPTE seulement — les autres ne changent rien à ce qu'il
 * peut lire, et les charger coûterait sans servir.
 */
export async function lireIndexDesDroits(base: Base, identite: Identite): Promise<IndexDesDroits> {
	const arbre = base.select({ id: dossiers.id, parentId: dossiers.parentId }).from(dossiers);
	if (identite.type === 'anonyme') return indexerLesDroits(await arbre);
	/* L'ARBRE ET LES DROITS EN MÊME TEMPS : la seconde requête ne dépend pas de la
	   première, et les enchaîner doublait le coût d'un index qu'une ouverture de note
	   lit deux fois. */
	const [dessin, explicites] = await Promise.all([
		arbre,
		base
			.select({
				dossierId: droitsDeDossier.dossierId,
				compteId: droitsDeDossier.compteId,
				droit: droitsDeDossier.droit
			})
			.from(droitsDeDossier)
			.where(eq(droitsDeDossier.compteId, identite.compteId))
	]);
	return indexerLesDroits(dessin, explicites);
}

/**
 * La condition de périmètre, telle qu'elle entre dans le `where`. Un périmètre vide
 * devient `false` : la requête ne rapporte rien, PAR LE MÊME CHEMIN qu'une note
 * inexistante — ce qu'un court-circuit avant la requête n'aurait pas donné.
 */
function conditionDePerimetre(perimetre: Perimetre): SQL | undefined {
	if (perimetre.tout) return undefined;
	const ids = [...perimetre.dossiers];
	if (ids.length === 0) return sql`false`;
	return inArray(notes.dossierId, ids);
}

/**
 * « PARMI CES IDENTIFIANTS-LÀ » — un SEUL paramètre, jamais trois cents.
 *
 * `inArray()` écrit un `in ($1, $2, … $300)`, et le prix se paie deux fois : le pilote
 * sérialise trois cents valeurs, PostgreSQL analyse et lie un ordre à trois cents
 * emplacements. Mesuré sur l'ouverture d'une note de l'instance de recette, sur les
 * trois requêtes qui portent le périmètre : 14,4 ms de `parse` et de `bind`, pour une
 * liste dont le contenu ne change pas d'une requête à l'autre. Un tableau passé en
 * bloc et comparé par `= any(…)` dit la même chose en un paramètre.
 */
export function parmiLesIdentifiants(identifiants: readonly string[]): SQL {
	/* `sql.param()` PLUTÔT QUE LA VALEUR NUE : un tableau posé tel quel dans le
	   gabarit est ÉCLATÉ par l'ORM en autant d'emplacements, et l'on retrouve le
	   `in ($1, … $299)` qu'on voulait fuir — sur un `any()`, qui n'en veut pas. */
	return sql`${notes.identifiant} = any(${sql.param([...identifiants])}::text[])`;
}

export interface LectureDeNote {
	readonly note: Note;
	readonly corps: CorpsDeNote;
	/**
	 * LES DEUX CORPS BRUTS, TELS QUE LA TABLE LES PORTE — déjà lus par cette fonction, et
	 * donnés pour n'être pas relus. Un appelant qui les redemandait à la base payait une
	 * seconde fois le transport et l'analyse du document : 65 ko pour la plus grosse note
	 * de l'instance de recette, à chaque ouverture. `null` quand la colonne l'est.
	 */
	readonly documents: {
		readonly reference: unknown;
		readonly operationnel: unknown;
	};
	/** Ce que l'appelant peut faire sur le dossier porteur (CDC §2.3). */
	readonly capacites: Capacites;
	readonly retroliens: readonly Retrolien[];
	/**
	 * LA NOTE OUVERTE ET SES DEUX VOISINES DE RANGEMENT, dans la forme que les vues
	 * attendent en propriété — et lisibles par l'appelant : une note qu'il n'a pas le droit
	 * de lire n'y est pas (`RG-ACC-01`), le filtre étant dans la requête.
	 *
	 * TROIS NOTES, ET JAMAIS PLUS. Deux usages tirent de cette liste : la fratrie du
	 * panneau « Position », qui nomme la précédente et la suivante, et le fil d'Ariane qui
	 * y retrouve la note ouverte. Ni l'un ni l'autre ne regarde plus loin. Ce qui se
	 * COMPTE est dans `voisinage`, ce qui BORNE est dans `identifiantsLisibles`.
	 */
	readonly notes: readonly Note[];
	/**
	 * TOUS LES IDENTIFIANTS QUE L'APPELANT PEUT LIRE — le périmètre, sous la seule forme
	 * qui n'oblige pas à en dresser les notes. C'est lui qui borne les relations affichées
	 * et les cibles offertes, et il ne coûte qu'une colonne.
	 */
	readonly identifiantsLisibles: readonly string[];
	/**
	 * CE QU'IL Y A D'AUTRE À LIRE À CÔTÉ — compté sur le corpus LISIBLE, jamais sur la
	 * table : une note qu'on n'a pas le droit de lire n'est pas une voisine, et la compter
	 * dirait à un lecteur qu'il existe des notes qu'il ne verra pas (`RG-ACC-01`). Deux
	 * décomptes parce que l'écran en emploie deux : le dossier quand la note en a un, le
	 * domaine sinon.
	 */
	readonly voisinage: {
		readonly dansLeRangement: number;
		readonly dansLeDomaine: number;
	};
	/**
	 * Le résolveur des liens internes du périmètre, celui-là même qui a rendu `corps` — et non
	 * un second, reconstruit par l'appelant. `/notes/{identifiant}?version={n}` montre le corps
	 * CAPTURÉ d'une version antérieure : le rendre en HTML demande le même résolveur, faute de
	 * quoi l'appelant redériverait « quelles notes sont citables » — une seconde définition de
	 * la visibilité. IL PORTE DÉJÀ LE PÉRIMÈTRE : une cible hors périmètre y est inconnue.
	 */
	readonly resoudreUneNote: ResolveurDeNote;
}

export interface DemandeDeLecture {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
}

/**
 * Le corpus lisible par l'appelant, sans note désignée. `/notes/nouvelle` n'a aucune note à
 * résoudre et a pourtant besoin du corpus, dont la coquille dérive le rail. Sans cette
 * fonction, la route aurait dû écrire une SECONDE règle d'accès.
 *
 * LE FILTRE EST LE MÊME : `conditionDePerimetre()` est l'unique traduction d'un périmètre en
 * `where`. Un périmètre vide devient `false`, et l'appelant reçoit l'ensemble VIDE.
 */
export async function lireLeCorpusLisible(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<readonly Note[]> {
	const index = await lireIndexDesDroits(base, identite);
	const perimetre = perimetreDeLaLectureDUneNote(identite, index);
	const lisibles = new Set(
		(
			await base
				.select({ identifiant: notes.identifiant })
				.from(notes)
				.where(conditionDePerimetre(perimetre))
		).map((n) => n.identifiant)
	);
	if (lisibles.size === 0) return [];
	return (await lireNotes(base, contexte)).filter((n) => lisibles.has(n.id));
}

/**
 * La lecture d'une note — une ressource, ou rien. Le type de retour est celui de
 * `RG-ACC-04` : `Resolution<T>` n'a pas de troisième forme, et les deux causes
 * sortent par le même `return`, avec le même objet gelé.
 */
export async function lireLaNote(
	base: Base,
	demande: DemandeDeLecture
): Promise<Resolution<LectureDeNote>> {
	const index = await lireIndexDesDroits(base, demande.identite);
	const perimetre = perimetreDeLaLectureDUneNote(demande.identite, index);

	/* ADR-006 — le périmètre est DANS la requête. */
	const [ligne] = await base
		.select({
			identifiant: notes.identifiant,
			dossierId: notes.dossierId,
			domaineId: notes.domaineId,
			visibilite: notes.visibilite,
			statut: notes.statut,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel
		})
		.from(notes)
		.where(and(eq(notes.identifiant, demande.identifiant), conditionDePerimetre(perimetre)))
		.limit(1);

	/* LE GARDE-FOU PASSE PAR `noteLisible`, LA COMPOSITION DES DEUX FILTRES, et non
	   par `perimetreContient` seul : « les employer séparément est le moyen le plus
	   simple de publier le corpus interne ». Le filtre de NOTE et celui de DOSSIER
	   n'ont ainsi qu'une seule écriture. */
	const resolution = resoudre(ligne, (l) =>
		noteLisible(
			demande.identite,
			{ dossierId: l.dossierId, visibilite: l.visibilite, statut: l.statut },
			perimetre
		)
	);
	if (!resolution.trouve) return resolution;
	const trouvee = resolution.ressource;

	/* LE CORPUS CITABLE — SANS SES CORPS. Le résolveur des liens internes n'a besoin
	   que du titre et de la visibilité ; les deux colonnes de corps n'étaient
	   sélectionnées que pour nourrir les rétroliens, qui ont désormais leur propre
	   requête, bornée. Les charger ici, c'était lire 3 Mo de JSONB — 47 ms de base
	   et 165 ms de désérialisation mesurés sur l'instance de recette — à chaque
	   ouverture de note. */
	const citables = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			domaineId: notes.domaineId,
			dossierId: notes.dossierId,
			visibilite: notes.visibilite,
			statut: notes.statut
		})
		.from(notes)
		.where(conditionDePerimetre(perimetre))
		.orderBy(notes.identifiant);
	const identifiantsLisibles = citables.map((c) => c.identifiant);

	/* LE RANGEMENT DE LA NOTE, SUR LES IDENTIFIANTS SEULS — la fratrie triée dont
	   `voisinesDe()` tire la précédente et la suivante, et les deux décomptes que
	   l'écran affiche. Aucune de ces trois réponses ne demande un corps ; les
	   dresser en forme `Note` coûtait, sur le plus gros domaine de l'instance de
	   recette, 32 ms de base et 118 ms d'analyse — les 143 corps du domaine lus et
	   parcourus pour en tirer 143 extraits que la lecture d'une note n'affiche pas. */
	const duRangement = citables.filter(
		(c) => c.domaineId === trouvee.domaineId && c.dossierId === trouvee.dossierId
	);
	const rang = duRangement.findIndex((c) => c.identifiant === trouvee.identifiant);
	const voisinage = {
		dansLeRangement: Math.max(duRangement.length - 1, 0),
		dansLeDomaine: Math.max(citables.filter((c) => c.domaineId === trouvee.domaineId).length - 1, 0)
	};

	/* LA FORME `Note`, POUR LA NOTE OUVERTE ET SES DEUX VOISINES — trois notes, et
	   jamais plus. C'est exactement ce que la vue en tire : le panneau « Position »
	   nomme la précédente et la suivante, et le fil d'Ariane y retrouve la note
	   ouverte. Le PÉRIMÈTRE, lui, reste entier et vit dans `identifiantsLisibles` ;
	   les décomptes vivent dans `voisinage`. Servir le corpus ici coûtait 286 ko de
	   charge d'hydratation pour une note qui en pèse 139 octets. */
	const troisNotes = [
		duRangement[rang - 1]?.identifiant,
		trouvee.identifiant,
		duRangement[rang + 1]?.identifiant
	].filter((i): i is string => i !== undefined);
	const toutes = await lireNotes(base, demande.contexte, troisNotes);
	const note = toutes.find((n) => n.id === trouvee.identifiant);
	/* La couche de lecture n'a pas rendu une note que la table porte : c'est un
	   défaut de cette couche, pas un refus. Il sort quand même par `INTROUVABLE` —
	   rien de ce chemin ne doit pouvoir distinguer deux causes. */
	if (note === undefined) return resoudre<LectureDeNote>(null, () => false);

	const resolveur = resolveurDeNotes(
		citables.map((c) => ({
			identifiant: c.identifiant,
			titre: c.titre,
			publique: c.visibilite === 'publique' && c.statut === 'publiee'
		}))
	);

	const valeur =
		demande.registre === 'operationnel' ? trouvee.corpsOperationnel : trouvee.corpsReference;

	return {
		trouve: true,
		ressource: {
			note,
			corps: corpsRendu(valeur, demande.registre, resolveur),
			documents: {
				reference: trouvee.corpsReference,
				operationnel: trouvee.corpsOperationnel
			},
			capacites: capacites(resoudreDroitDeDossier(demande.identite, trouvee.dossierId, index)),
			retroliens: await lireLesRetroliens(base, trouvee.identifiant, perimetre),
			notes: toutes,
			identifiantsLisibles,
			voisinage,
			resoudreUneNote: resolveur
		}
	};
}

/**
 * LES RÉTROLIENS D'UNE NOTE — déduits, jamais saisis (`RG-M05-02`), et lus sur les
 * seules notes qui peuvent en porter un.
 *
 * LA DÉCISION RESTE À `liensInternes()`, qui parcourt l'arbre du document : c'est
 * `retroliensVers()`, inchangé, qui dit si une note en cite une autre. Ce que la
 * requête fait n'est pas de décider, c'est de RESTREINDRE LES CANDIDATES — une note
 * dont le corps sérialisé ne contient nulle part l'identifiant visé ne peut pas le
 * citer. `ADR-003` n'est pas enfreint : le corps n'est ni découpé ni réécrit, il est
 * seulement testé pour savoir s'il vaut la peine d'être analysé.
 *
 * ELLE ÉPARGNE LE CORPUS. Les rétroliens se lisaient en chargeant les DEUX corps des
 * 300 notes de l'instance de recette puis en analysant les 600 documents : 47 ms de
 * base et 165 ms d'analyse, à chaque ouverture de note. Les candidates se comptent
 * ici sur les doigts d'une main.
 */
async function lireLesRetroliens(
	base: Base,
	identifiant: string,
	perimetre: Perimetre
): Promise<readonly Retrolien[]> {
	const candidates = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			domaine: domaines.nom,
			reference: notes.corpsReference,
			operationnel: notes.corpsOperationnel
		})
		.from(notes)
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.where(and(conditionDePerimetre(perimetre), citeLIdentifiant(identifiant)))
		.orderBy(notes.identifiant);
	return retroliensVers(identifiant, candidates);
}

/**
 * LE FILTRE DE CANDIDATURE, EN SQL — vrai dès que la note porte, dans l'un de ses
 * deux registres, une marque de lien interne visant l'identifiant.
 *
 * IL N'AFFIRME PAS QU'IL Y A UN RÉTROLIEN : il écarte les notes où il ne PEUT PAS y
 * en avoir. La décision reste à `retroliensVers()`, qui parcourt l'arbre.
 *
 * IL LIT LA COLONNE DÉRIVÉE, JAMAIS LE CORPS (migration `015`) : le corps est stocké
 * hors ligne, et l'interroger demandait de décompresser tout le corpus — 47 ms
 * mesurés à chaque ouverture de note sur l'instance de recette.
 */
function citeLIdentifiant(identifiant: string): SQL {
	return sql`${notes.liensInternes} @> ${JSON.stringify([identifiant])}::jsonb`;
}
