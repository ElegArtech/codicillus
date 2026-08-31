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
import { dossiers, droitsDeDossier, notes } from '../base/schema';
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
	readonly adresse: string;
}

export interface CorpsEnBase {
	readonly identifiant: string;
	readonly titre: string;
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
	const arbre = await base.select({ id: dossiers.id, parentId: dossiers.parentId }).from(dossiers);
	if (identite.type === 'anonyme') return indexerLesDroits(arbre);
	const explicites = await base
		.select({
			dossierId: droitsDeDossier.dossierId,
			compteId: droitsDeDossier.compteId,
			droit: droitsDeDossier.droit
		})
		.from(droitsDeDossier)
		.where(eq(droitsDeDossier.compteId, identite.compteId));
	return indexerLesDroits(arbre, explicites);
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

export interface LectureDeNote {
	readonly note: Note;
	readonly corps: CorpsDeNote;
	/** Ce que l'appelant peut faire sur le dossier porteur (CDC §2.3). */
	readonly capacites: Capacites;
	readonly retroliens: readonly Retrolien[];
	/**
	 * Le corpus lisible par l'appelant, dans la forme que les vues attendent en propriété — la
	 * coquille en dérive son rail. Lui passer les 32 notes montrerait à un lecteur les dossiers
	 * qu'il n'a pas le droit de lire (`RG-ACC-01`). L'intersection avec `lireNotes()` est faite
	 * en mémoire, et c'est l'écart déclaré en tête de ce module.
	 */
	readonly notes: readonly Note[];
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

	/* La forme `Note` vient de la couche de lecture, et d'elle seule : c'est ce
	   qui garantit que l'écran reçoit ce que le jeu de semence lui donnait. */
	const toutes = await lireNotes(base, demande.contexte);
	const note = toutes.find((n) => n.id === trouvee.identifiant);
	/* La couche de lecture n'a pas rendu une note que la table porte : c'est un
	   défaut de cette couche, pas un refus. Il sort quand même par `INTROUVABLE` —
	   rien de ce chemin ne doit pouvoir distinguer deux causes. */
	if (note === undefined) return resoudre<LectureDeNote>(null, () => false);

	/* Le corpus DU PÉRIMÈTRE, en une seule requête : il sert trois fois — cibles des
	   liens internes, matière des rétroliens, identifiants que la coquille montre. */
	const citables = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			visibilite: notes.visibilite,
			statut: notes.statut,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel
		})
		.from(notes)
		.where(conditionDePerimetre(perimetre))
		.orderBy(notes.identifiant);
	const lisibles = new Set(citables.map((c) => c.identifiant));

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
			capacites: capacites(resoudreDroitDeDossier(demande.identite, trouvee.dossierId, index)),
			retroliens: retroliensVers(
				trouvee.identifiant,
				citables.map((c) => ({
					identifiant: c.identifiant,
					titre: c.titre,
					reference: c.corpsReference,
					operationnel: c.corpsOperationnel
				}))
			),
			notes: toutes.filter((n) => lisibles.has(n.id)),
			resoudreUneNote: resolveur
		}
	};
}
