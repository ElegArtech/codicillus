/**
 * LA LECTURE D'UNE NOTE, DEPUIS LA BASE — ce que `/notes/{identifiant}` charge.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE COMPOSE, IL NE REDÉFINIT RIEN
 *
 * Quatre implémentations uniques sont appelées ici, et aucune n'est recopiée :
 *
 *   `src/lib/donnees/lecture.ts`    les formes de `seeds/corpus.ts` rendues
 *                                   depuis la base (T-030). `Note` vient de
 *                                   là, avec sa fraîcheur déjà calculée.
 *   `src/lib/droits/resolution.ts`  la résolution des droits. AUCUNE règle de
 *                                   droit n'est écrite ici : ni remontée
 *                                   d'arbre, ni table de capacités, ni
 *                                   fermeture par défaut.
 *   `src/lib/contenu/rendu.ts`      `rendreDocument`, et rien d'autre —
 *                                   ADR-004 interdit nommément tout second
 *                                   rendu, et `pnpm verif:convertisseur`
 *                                   compte les implémentations.
 *   `src/lib/fraicheur.ts`          par `lireNotes`, jamais directement : ce
 *                                   module n'écrit AUCUN libellé de fraîcheur
 *                                   et aucun seuil (P-01, ADR-005, A3 de la
 *                                   batterie 5).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA BASE NE PORTE PAS, ET QUI N'EST DONC PAS INVENTÉ ICI
 *
 * Mesuré le 20 août 2026 sur la base semée (32 notes) :
 *
 *   · `corps_reference` — 32 notes sur 32 portent UN SEUL BLOC, le paragraphe
 *     que `corpsDepuisTexte(n.extrait)` écrit (`semence.ts:426`). Aucune note
 *     ne porte le corps RÉDIGÉ que les maquettes montrent.
 *   · `corps_operationnel` — 5 notes sur 32 en portent un, et les cinq sont
 *     VIDES : `corpsVide()`, un paragraphe sans texte
 *     (`src/lib/contenu/corps-vide.ts`). Les
 *     27 autres n'en portent aucun.
 *   · aucun lien interne — 0 note sur 32 porte une marque `lienInterne`, donc
 *     0 rétrolien pour les 32 (RG-M05-02 est calculée, et rend l'ensemble
 *     vide qu'elle doit rendre).
 *
 * `src/lib/contenu/documents-du-gel.ts` porte QUATRE corps transcrits des
 * maquettes — deux notes, deux registres. **Ils ne sont pas substitués ici**,
 * et c'est le point : ce sont des transcriptions de planche, et les servir en
 * lecture d'une note réelle serait exactement la « valeur illustrative » que
 * P-02 proscrit. Ce module rend le document que la base porte, fût-il vide, et
 * DIT qu'il est vide (`CorpsDeNote.redige`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE FILTRE EST DANS LA REQUÊTE — ADR-006
 *
 * « Le serveur calcule l'ensemble des dossiers effectivement lisibles par
 * l'appelant et l'injecte comme filtre. La requête envoyée au moteur NE PEUT
 * PAS rapporter un document interdit. » La condition de périmètre est donc
 * portée par le `where` de la requête de note, jamais par un tri de son
 * résultat. `resoudre()` reste appelé par-dessus — son propre en-tête le dit :
 * il est le garde-fou, pas le filtre.
 *
 * LE CORPUS DE LA COQUILLE, LUI, EST FILTRÉ APRÈS COUP, et c'est un écart
 * déclaré au rapport du lot : `lireNotes()` de `T-030` n'accepte aucun
 * périmètre, et ce module n'écrit pas dans son fichier. Le périmètre décide
 * bien quels identifiants sont retenus — la décision d'accès est prise sur la
 * base —, mais l'intersection se fait en mémoire. Une signature de `lireNotes`
 * portant le périmètre refermerait l'écart en une ligne.
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

/* ═══════════════════════════════════════════════════ Le registre ════════ */

/** L'un des deux registres de lecture d'une note (vocabulaire contractuel §3). */
export type Registre = 'reference' | 'operationnel';

/**
 * LE REGISTRE DEMANDÉ PAR L'ADRESSE — `?registre=`, `docs/routes.md` §4.1 :
 * « `reference` (défaut) · `operationnel` ».
 *
 * Le gel ÉCRIT ce paramètre et ne le LIT jamais : `majAdresse("?registre=" +
 * reg)` (`mockups/V-14-lecture-note.html:3958`) est la seule occurrence, dans
 * l'écouteur de la bascule, et aucune ligne de la maquette ne relit
 * `location.search` au chargement. L'état initial n'est donc pas porté par le
 * gel : il est porté par §4.1, qui nomme `reference` comme DÉFAUT, et par
 * `RG-M02-02`, qui fait ouvrir `?registre=operationnel` depuis un résultat de
 * recherche trouvé dans le corps Opérationnel.
 *
 * Toute autre valeur retombe donc sur le défaut — c'est ce que « défaut »
 * veut dire, et non une décision prise ici.
 */
export function registreDemande(parametre: string | null): Registre {
	return parametre === 'operationnel' ? 'operationnel' : 'reference';
}

/* ═══════════════════════════════════════════════════ Le corps ═══════════ */

/**
 * Le corps d'un registre, tel que la base le porte — et ce qu'il faut en dire
 * quand elle ne porte rien.
 */
export interface CorpsDeNote {
	readonly registre: Registre;
	/** La colonne porte un document. Faux : la note n'a pas ce registre. */
	readonly existe: boolean;
	/**
	 * Le document porte du texte. Faux : il existe et il est VIDE — l'état que
	 * le gel prévoit, jamais un corps inventé.
	 */
	readonly redige: boolean;
	/** Le HTML rendu par `rendreDocument`, et par rien d'autre (ADR-004). */
	readonly html: string;
	/** Les notes citées par le corps — matière des rétroliens de la cible. */
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

/* ═══════════════════════════════════════════════════ Les liens ══════════ */

/** Ce qu'une note offre à un lien qui la cite, ou à un rétrolien qui la nomme. */
export interface NoteCitable {
	readonly identifiant: string;
	readonly titre: string;
	readonly publique: boolean;
}

/**
 * LE RÉSOLVEUR DES LIENS INTERNES, ADOSSÉ À LA BASE.
 *
 * L'ADRESSE EST BÂTIE SUR `notes.identifiant`, et non sur un identifiant
 * dérivé du titre. C'est celui que la colonne porte, celui que
 * `docs/routes.md` §3 substitue dans `/notes/{identifiant}`, et celui que
 * cette route résout — un lien qui porterait autre chose serait un lien mort
 * (P-03). `resoudreDansLeCorpus` de `documents-du-gel.ts` construit, lui,
 * `adresseDeNote(identifiantLisible(note.titre))` : les deux formes divergent
 * sur les 32 notes du corpus. Écart déclaré au rapport ; aucune des deux n'est
 * modifiée ici.
 *
 * UNE CIBLE INCONNUE REND `null`, ce qui fait rendre `a.lien-casse` sans
 * `href` par `rendu.ts` (CONSTRUCTIONS n° 14). Aucun corps de la base ne porte
 * de lien interne : le cas est donc éprouvé par un document ÉCRIT POUR LE
 * TEST, jamais par l'état du dépôt (P-5, P-26).
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

/** Un rétrolien : la note qui cite celle qu'on lit. */
export interface Retrolien {
	readonly identifiant: string;
	readonly titre: string;
	readonly adresse: string;
}

/** Le corps d'un registre d'une note, tel que la base le rend. */
export interface CorpsEnBase {
	readonly identifiant: string;
	readonly titre: string;
	readonly reference: unknown;
	readonly operationnel: unknown;
}

/**
 * LES RÉTROLIENS SONT DÉDUITS, JAMAIS SAISIS — `RG-M05-02` : « recalculés par
 * parcours de l'arbre du document ». Les deux registres comptent : une note
 * citée depuis un corps Opérationnel est citée.
 *
 * L'ordre est celui des identifiants des notes citantes, qui est celui de la
 * requête : déterministe, et sans invention d'un ordre de pertinence.
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

/* ═══════════════════════════════════════════════════ Le périmètre ═══════ */

/**
 * LE PÉRIMÈTRE DE LA FAMILLE `/notes/…` — `docs/routes.md` §5.5, ligne
 * « `/notes/{id}` et sous-routes » : la colonne « Anonyme » y rend **404
 * V-04**, sans condition sur la note. Une note publique et publiée se lit à
 * `/guides/{identifiant}` — « une seule adresse, un seul rendu » (ARB-007,
 * A-05) —, et cette route-là appartient à `T-035`.
 *
 * L'anonyme reçoit donc un périmètre VIDE, et non le périmètre public que
 * `perimetreDeLecture()` rend pour lui : le premier est le périmètre de CETTE
 * famille d'adresses, le second celui de l'espace public. L'en-tête de
 * `perimetreDeLecture` le dit en propres termes — « il existe deux périmètres,
 * et la route choisit lequel ».
 *
 * Aucune règle de droit n'est écrite ici : le choix du périmètre est celui
 * qu'une ligne de §5.5 dicte.
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
 * La condition de périmètre, telle qu'elle entre dans le `where` de la
 * requête. Un périmètre vide devient `false` : la requête ne rapporte rien, et
 * elle ne rapporte rien PAR LE MÊME CHEMIN qu'une note inexistante — ce que
 * `RG-ACC-04` demande, et qu'un court-circuit avant la requête n'aurait pas
 * donné.
 */
function conditionDePerimetre(perimetre: Perimetre): SQL | undefined {
	if (perimetre.tout) return undefined;
	const ids = [...perimetre.dossiers];
	if (ids.length === 0) return sql`false`;
	return inArray(notes.dossierId, ids);
}

/* ═══════════════════════════════════════════════════ La lecture ═════════ */

/** Ce qu'une lecture de note met à disposition de la route. */
export interface LectureDeNote {
	/** La note, dans la forme du jeu de semence — fraîcheur comprise. */
	readonly note: Note;
	readonly corps: CorpsDeNote;
	/** Ce que l'appelant peut faire sur le dossier porteur (CDC §2.3). */
	readonly capacites: Capacites;
	readonly retroliens: readonly Retrolien[];
	/**
	 * LE CORPUS LISIBLE PAR L'APPELANT, dans la forme que les vues attendent en
	 * propriété — `src/vues/V-14.svelte:92` déclare `notes: readonly Note[]`, et
	 * la coquille en dérive son rail (`src/lib/coquille/arborescence.ts`).
	 *
	 * Lui passer les 32 notes montrerait à un lecteur les dossiers qu'il n'a pas
	 * le droit de lire, ce que `RG-ACC-01` refuse — « le filtrage est appliqué au
	 * plus près de la donnée, pas seulement dans l'affichage ». Les identifiants
	 * retenus sont ceux que le `where` de périmètre rapporte ; l'intersection
	 * avec `lireNotes()` est faite en mémoire, et c'est l'écart déclaré en tête
	 * de ce module.
	 */
	readonly notes: readonly Note[];
	/**
	 * LE RÉSOLVEUR DES LIENS INTERNES DU PÉRIMÈTRE, CELUI-LÀ MÊME QUI A RENDU
	 * `corps` — et non un second, reconstruit par l'appelant.
	 *
	 * IL EXISTE PARCE QUE `corps` N'EST PAS LE SEUL DOCUMENT QUE CETTE ADRESSE
	 * AFFICHE. `/notes/{identifiant}?version={n}` montre le corps CAPTURÉ d'une
	 * version antérieure, que `$lib/donnees/histoire.ts` rend sous forme de
	 * `Document` : le rendre en HTML demande le même résolveur, faute de quoi
	 * l'appelant devrait redériver « quelles notes sont citables et lesquelles
	 * sont publiques » à partir de `notes` — une seconde définition de la
	 * visibilité, qui divergerait de celle-ci au premier changement de règle
	 * (`P-01`).
	 *
	 * IL PORTE DÉJÀ LE PÉRIMÈTRE : il a été construit sur les notes que le
	 * `where` d'accès a rapportées, et une cible hors périmètre y est donc
	 * inconnue, exactement comme dans le corps courant (`RG-ACC-01`).
	 */
	readonly resoudreUneNote: ResolveurDeNote;
}

/** Ce qu'une lecture demande : l'adresse, le registre, et qui demande. */
export interface DemandeDeLecture {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
}

/**
 * LE CORPUS LISIBLE PAR L'APPELANT, SANS NOTE DÉSIGNÉE — ajouté par `T-050`.
 *
 * `/notes/nouvelle` n'a aucune note à résoudre et a pourtant besoin du corpus :
 * `src/lib/coquille/arborescence.ts` en dérive le rail, et la vue le déclare en
 * propriété. Sans cette fonction, la route aurait dû reconstruire un périmètre —
 * c'est-à-dire écrire une SECONDE règle d'accès, ce qu'`ADR-006` interdit
 * nommément (« toute route qui reçoit une liste puis la filtre »).
 *
 * LE FILTRE EST LE MÊME, ET C'EST LE POINT : `conditionDePerimetre()` est
 * l'unique traduction d'un périmètre en `where`, et `lireLaNote()` l'emploie
 * pour la même chose quelques lignes plus bas. Un périmètre vide devient
 * `false` — la requête ne rapporte rien, par le même chemin qu'une base sans
 * note (`RG-ACC-04`), et l'appelant reçoit l'ensemble VIDE, qui est l'état
 * vide de `RG-M18-03` et non un corpus commode.
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
 * LA LECTURE D'UNE NOTE — une ressource, ou rien.
 *
 * Le type de retour est celui de `RG-ACC-04` : `Resolution<T>` n'a pas de
 * troisième forme, et cette fonction n'a donc rien à rendre qui distingue « la
 * note n'existe pas » de « la note existe et vous n'y avez pas droit ». Les
 * deux sortent par le même `return`, avec le même objet gelé.
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

	/* LE GARDE-FOU PASSE PAR `noteLisible`, LA COMPOSITION DES DEUX FILTRES, et
	   non par `perimetreContient` seul : son en-tête le dit — « les employer
	   séparément est le moyen le plus simple de publier le corpus interne ». Le
	   filtre de NOTE (visibilité, statut) et le filtre de DOSSIER n'ont ainsi
	   qu'une seule écriture, celle de `resolution.ts`. Et ce qu'elle ne tranche
	   pas — la visibilité des brouillons pour un authentifié — n'est pas tranché
	   ici non plus : le lot qui la spécifiera ajoutera son filtre là-bas. */
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
	   défaut de cette couche, pas un refus. Il sort quand même par `INTROUVABLE`
	   — rien de ce chemin ne doit pouvoir distinguer deux causes (RG-ACC-04). */
	if (note === undefined) return resoudre<LectureDeNote>(null, () => false);

	/* Le corpus DU PÉRIMÈTRE, en une seule requête : il sert trois fois — les
	   cibles des liens internes, la matière des rétroliens, et les identifiants
	   que la coquille a le droit de montrer. */
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
