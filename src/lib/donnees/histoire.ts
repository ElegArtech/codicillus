/**
 * L'HISTORIQUE ET LA COMPARAISON DE DEUX VERSIONS — ce que V-15 et V-16
 * demandent à la base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE COMPOSE, IL NE REDÉFINIT RIEN
 *
 *   `src/lib/donnees/note.ts`      la RÉSOLUTION d'une note, et donc la porte
 *                                  d'accès : ce module ne prend aucune décision
 *                                  d'accès, il reçoit une `LectureDeNote` que
 *                                  `lireLaNote()` a déjà résolue — filtre de
 *                                  périmètre DANS la requête (ADR-006), sortie
 *                                  unique par `INTROUVABLE` (RG-ACC-04).
 *   `src/lib/droits/resolution.ts` jamais appelé ici, et c'est le point :
 *                                  AUCUNE seconde règle de droit n'est écrite.
 *   `src/lib/donnees/lecture.ts`   les formes de `seeds/corpus.ts` rendues
 *                                  depuis la base (T-030) — dates, ancienneté,
 *                                  configuration.
 *   `src/lib/contenu/markdown.ts`  `serialiserEnMarkdown`, et rien d'autre.
 *                                  ADR-004 interdit tout second convertisseur ;
 *                                  `pnpm verif:convertisseur` compte les
 *                                  implémentations.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA BASE NE PORTE PAS, ET QUI N'EST DONC PAS INVENTÉ ICI
 *
 * Mesuré le 20 août 2026 sur la base semée : la table `versions` porte ZÉRO
 * ligne, pour 32 notes. `base/migrations/004_versions.montee.sql:13` le dit en
 * propres termes — « le lot de V-15 / V-16 la remplira » —, et la semence ne
 * l'écrit pas. Conséquences, et aucune n'est comblée :
 *
 *   · l'historique de toute note est VIDE : c'est le troisième cas de la
 *     planche de V-15 (« aucune version antérieure »), rendu parce qu'il est
 *     VRAI, et non parce qu'il serait commode ;
 *   · aucune comparaison n'a de matière : les deux bornes d'une adresse
 *     `?versions={a}-{b}` désignent des versions qui n'existent pas, et le
 *     résultat le DIT (`presentes`) au lieu de rendre un écart nul.
 *
 * `seeds/corpus.ts:1503` porte `CONTENU_VERSIONS` — trois états de contenu de
 * `n-restaurer-pg` —, dans la forme `BlocDeContenu` des maquettes
 * (`seeds/corpus.ts:309-331`). T-014 et T-015 ont tous deux REFUSÉ de la
 * transposer au format canonique, faute des informations qu'ADR-003 exige. Ce
 * module ne la transpose pas davantage : la servir en lecture d'une note réelle
 * serait la « valeur illustrative » que P-02 proscrit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE MODE TEXTE — ARB-055, ET POURQUOI LA LINÉARISATION DU GEL N'EST PAS
 * TRANSPOSÉE ICI
 *
 * Le gel porte une linéarisation « façon texte source »
 * (`mockups/V-16-comparaison.html:1864-1878`), et `src/vues/V-16.svelte:198-222`
 * la transcrit à la lettre. ARB-055 a tranché ce qu'elle est : un QUATRIÈME
 * RENDU dérivé du document canonique, jamais un second convertisseur — et sa
 * forme fait loi À L'AFFICHAGE.
 *
 * Trois faits, tous vérifiés, empêchent de la transposer au document canonique :
 *
 *   1. SON ENTRÉE N'EST PAS LE DOCUMENT CANONIQUE. Elle prend le
 *      `BlocDeContenu` de `seeds/corpus.ts:309-331` — neuf types, six
 *      variantes. Le document canonique porte DOUZE natures de blocs
 *      (`src/lib/contenu/document.ts:295-307`), plus cinq conteneurs et les
 *      marques. Quatre natures — citation, liste numérotée, séparateur,
 *      diagramme — n'ont AUCUNE forme dans le gel, et aucune marque n'y est
 *      rendue.
 *   2. ELLE EFFACE CE QU'ELLE NE CONNAÎT PAS : son cas par défaut rend la
 *      ligne vide, et sa forme d'image perd la source comme l'alternative
 *      (ARB-055, fait 2). Transposée telle quelle, elle ferait disparaître de
 *      la comparaison quatre natures de blocs sur douze, sans que rien ne le
 *      signale.
 *   3. LUI INVENTER LES FORMES MANQUANTES SERAIT COMBLER un vide de
 *      spécification (`CLAUDE.md` §2), et le comblement porterait sur la SEULE
 *      chose que le gel ne dit pas.
 *
 * Ce module emploie donc ce que la pile désigne, et elle désigne un rendu :
 * `cadrage/STACK-TECHNIQUE.md` §4.5 — « Mode Texte (V-16). Différences ligne à
 * ligne sur le RENDU MARKDOWN des deux versions ». Le rendu Markdown est
 * produit par l'implémentation unique, et par elle seule.
 *
 * LA BORNE D'ARB-055 EST TENUE, ET ELLE EST LA SEULE QUI COMPTE : aucune de ces
 * lignes n'est RELUE. `analyserMarkdown` n'est pas importé ici, et rien de ce
 * fichier ne reconstruit un document à partir d'une ligne de comparaison. Le
 * jour où une seule le serait, ce serait un second convertisseur.
 *
 * L'ÉCART DE FORME AVEC LE GEL EST RÉEL, ET IL EST DÉCLARÉ AU RAPPORT DE LOT.
 * Il est aujourd'hui LATENT : `src/vues/V-16.svelte` calcule ses lignes
 * lui-même, à partir de la forme des maquettes, et ne déclare aucune propriété
 * qui porterait celles-ci. Aucun pixel du gel n'en dépend.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE MODE VISUEL — C-05, ET IL EST LA RAISON D'ÊTRE D'ADR-003
 *
 * ADR-003 : « la comparaison visuelle s'appuie sur une plus longue
 * sous-séquence commune sur les NŒUDS DE PREMIER NIVEAU, avec empreinte de
 * nœud calculée sur son CONTENU NORMALISÉ ». C'est mot pour mot ce que
 * `comparerEnVisuel()` fait, et rien de plus.
 *
 * « NORMALISÉ » N'EST DÉFINI NULLE PART, et ce module en prend la lecture la
 * plus PAUVRE : l'ordre des clés est rendu stable, et rien d'autre n'est
 * touché — ni les blancs, ni la casse, ni les marques. Toute normalisation plus
 * riche serait un choix fonctionnel — deux blocs « identiques à un espace près »
 * seraient-ils le même bloc ? —, donc un comblement. Déclaré au rapport.
 *
 * CE QUE L'EMPREINTE NE SAIT PAS FAIRE, ET LE GEL SI. Le gel apparie les blocs
 * par `b.cle` — une identité STABLE d'une version à l'autre — puis distingue
 * « réécrit » de « commun » en comparant les contenus. Le document canonique ne
 * porte AUCUNE identité de bloc : ADR-003 ne la prévoit pas, et l'inventer
 * serait étendre le format. Un bloc réécrit sort donc ici en « retiré » suivi
 * d'« ajouté », jamais en « réécrit ». Déclaré au rapport.
 */
import { desc, eq } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { comptes, notes, versions } from '../base/schema';
import { analyserDocument, type Bloc, type Document } from '../contenu/document';
import { serialiserEnMarkdown } from '../contenu/markdown';
import { dateCourteDInstant, joursEcoules, lireConfiguration } from './lecture';
import type { LectureDeNote } from './note';
import type { Version } from '../../../seeds/corpus';

/* ═══════════════════════════════════ Les versions, forme du corpus ══════ */

/** Une ligne de `versions`, jointe à son auteur — ce que la requête rapporte. */
export interface LigneDeVersion {
	readonly numero: number;
	readonly le: Date;
	readonly auteurNom: string;
	readonly resume: string;
	readonly ajout: number;
	readonly retrait: number;
	readonly titre: string;
	readonly corpsReference: unknown;
	readonly corpsOperationnel: unknown;
}

/**
 * L'HEURE D'AFFICHAGE, LUE EN UTC — même raison que `dateCourteDInstant()`,
 * dont l'en-tête porte le raisonnement : la semence écrit des instants UTC, et
 * les relire en heure locale déplacerait la date d'un jour à l'ouest de
 * Greenwich. La date et l'heure d'une version sont DEUX CHAMPS D'AFFICHAGE d'un
 * seul instant (`base/migrations/004_versions.montee.sql:53-57`) : les lire
 * dans deux fuseaux les ferait se contredire.
 */
export function heureCourteDInstant(instant: Date): string {
	const heures = String(instant.getUTCHours()).padStart(2, '0');
	const minutes = String(instant.getUTCMinutes()).padStart(2, '0');
	return `${heures}:${minutes}`;
}

/**
 * Une ligne de base rendue dans la forme `Version` de `seeds/corpus.ts:292-305`.
 *
 * `jours` est L'ANCIENNETÉ, comptée par `joursEcoules()` — l'implémentation de
 * T-030 —, et jamais recalculée ici. `auteur` est le nom du compte : le type
 * `NomDAuteur` du jeu de semence énumère les trois auteurs des maquettes, que
 * la base n'a aucune raison de respecter ; la conversion est exactement celle
 * de `lireNotes()`, qui pose `auteur` sans autre garantie que la colonne.
 */
export function versionRendue(ligne: LigneDeVersion, maintenant: Date): Version {
	const rendu: Record<string, unknown> = {
		n: ligne.numero,
		jours: joursEcoules(ligne.le, maintenant),
		date: dateCourteDInstant(ligne.le),
		heure: heureCourteDInstant(ligne.le),
		auteur: ligne.auteurNom,
		ajout: ligne.ajout,
		retrait: ligne.retrait,
		resume: ligne.resume
	};
	return rendu as unknown as Version;
}

/* ═══════════════════════════════════ Le quatrième rendu ═════════════════ */

/**
 * LES LIGNES DE COMPARAISON D'UNE VERSION — le rendu Markdown, découpé.
 *
 * `serialiserEnMarkdown()` termine son résultat par un saut de ligne : le
 * découpage produirait donc une dernière ligne vide, qui n'est pas une ligne du
 * document et qui compterait comme un ajout ou un retrait. Elle est retirée, et
 * elle seule.
 *
 * Un document absent — le registre Opérationnel d'une note qui n'en a pas
 * (RG-NOT-02) — rend l'ensemble vide, jamais une ligne inventée.
 */
export function lignesDeComparaison(valeur: unknown): readonly string[] {
	if (valeur === null || valeur === undefined) return [];
	const lignes = serialiserEnMarkdown(valeur).split('\n');
	if (lignes.length > 0 && lignes[lignes.length - 1] === '') lignes.pop();
	return lignes;
}

/* ═══════════════════════════════════ L'empreinte d'un nœud ══════════════ */

/**
 * LA NORMALISATION, ET ELLE S'ARRÊTE À L'ORDRE DES CLÉS. Deux nœuds dont les
 * clés seraient sérialisées dans un ordre différent sont le MÊME nœud ; tout le
 * reste — blancs, casse, marques — est du contenu, et deux contenus différents
 * sont deux nœuds différents. Voir l'en-tête du module.
 */
function normaliser(valeur: unknown): unknown {
	if (Array.isArray(valeur)) return valeur.map(normaliser);
	if (valeur === null || typeof valeur !== 'object') return valeur;
	const entrees = Object.entries(valeur as Record<string, unknown>);
	entrees.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
	const trie: Record<string, unknown> = {};
	for (const [cle, sous] of entrees) trie[cle] = normaliser(sous);
	return trie;
}

/** L'empreinte d'un nœud de premier niveau — ADR-003, « contenu normalisé ». */
export function empreinteDeNoeud(noeud: Bloc): string {
	return JSON.stringify(normaliser(noeud));
}

/* ═══════════════════════════════════ L'alignement ═══════════════════════ */

/** L'état d'une paire alignée : commune aux deux versions, retirée, ajoutée. */
export type EtatDePaire = 'commun' | 'retire' | 'ajoute';

/** Une paire alignée. Un côté manque exactement quand la paire n'est pas commune. */
export interface Paire<T> {
	readonly etat: EtatDePaire;
	readonly a: T | undefined;
	readonly b: T | undefined;
}

/**
 * PLUS LONGUE SOUS-SÉQUENCE COMMUNE — l'algorithme que le gel porte déjà.
 *
 * LE PAQUET QUE `cadrage/STACK-TECHNIQUE.md` §4.5 ASSIGNE AU MODE TEXTE N'EST
 * PAS INSTALLÉ : `package.json` ne le liste ni en dépendance ni en dépendance
 * de développement, et `P-24` interdit à un lot d'en installer une. Le contrat
 * de ce lot tranche : employer l'algorithme du gel. C'est celui-ci, et le
 * départage d'égalité — le retrait AVANT l'ajout — est celui de
 * `mockups/V-16-comparaison.html:1882-1902`, repris tel quel : un autre
 * départage donnerait un autre ordre de lignes, donc un autre écran.
 *
 * LA MÊME TRANSCRIPTION VIT DÉJÀ DANS `src/vues/V-16.svelte:236-278`. Elle
 * n'est pas importable : elle est locale au bloc de script d'un composant, et
 * `src/vues/` est hors du périmètre d'écriture de ce lot. La duplication est
 * déclarée au rapport ; aucune batterie ne la mesure.
 */
export function alignement<T>(
	a: readonly T[],
	b: readonly T[],
	cle: (x: T) => unknown = (x) => x
): readonly Paire<T>[] {
	const n = a.length;
	const m = b.length;
	const t: number[][] = [];
	for (let i = 0; i <= n; i++) t.push(new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		const ligne = t[i]!;
		const suivante = t[i + 1]!;
		for (let j = m - 1; j >= 0; j--) {
			ligne[j] =
				cle(a[i]!) === cle(b[j]!) ? suivante[j + 1]! + 1 : Math.max(suivante[j]!, ligne[j + 1]!);
		}
	}
	const res: Paire<T>[] = [];
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (cle(a[i]!) === cle(b[j]!)) {
			res.push({ etat: 'commun', a: a[i]!, b: b[j]! });
			i++;
			j++;
		} else if (t[i + 1]![j]! >= t[i]![j + 1]!) {
			res.push({ etat: 'retire', a: a[i]!, b: undefined });
			i++;
		} else {
			res.push({ etat: 'ajoute', a: undefined, b: b[j]! });
			j++;
		}
	}
	while (i < n) {
		res.push({ etat: 'retire', a: a[i]!, b: undefined });
		i++;
	}
	while (j < m) {
		res.push({ etat: 'ajoute', a: undefined, b: b[j]! });
		j++;
	}
	return res;
}

/* ═══════════════════════════════════ Les deux modes ═════════════════════ */

/** Le mode Texte : le journal ligne à ligne, et ses deux quantités. */
export interface ComparaisonEnTexte {
	readonly lignes: readonly Paire<string>[];
	/** Lignes ajoutées et lignes retirées : deux quantités, jamais un solde. */
	readonly ajouts: number;
	readonly retraits: number;
}

/** Le mode Texte de V-16 — voir l'en-tête du module pour ce qui le gouverne. */
export function comparerEnTexte(a: unknown, b: unknown): ComparaisonEnTexte {
	const lignes = alignement(lignesDeComparaison(a), lignesDeComparaison(b));
	return {
		lignes,
		ajouts: lignes.filter((l) => l.etat === 'ajoute').length,
		retraits: lignes.filter((l) => l.etat === 'retire').length
	};
}

/** Le mode Visuel : les rangées de blocs, et le nombre de blocs touchés. */
export interface ComparaisonEnVisuel {
	readonly rangees: readonly Paire<Bloc>[];
	/** Les blocs qui ne sont pas communs aux deux versions. */
	readonly touches: number;
	/** Le nombre de nœuds de premier niveau de la version d'arrivée. */
	readonly blocs: number;
}

/** Les nœuds de premier niveau d'un document, ou l'ensemble vide. */
function blocsDe(valeur: unknown): readonly Bloc[] {
	if (valeur === null || valeur === undefined) return [];
	const document: Document = analyserDocument(valeur);
	return document.content;
}

/**
 * LE MODE VISUEL — C-05 et ADR-003 : plus longue sous-séquence commune sur les
 * nœuds de premier niveau, appariés par l'empreinte de leur contenu normalisé.
 * Les paires communes sont celles que V-16 aligne horizontalement.
 */
export function comparerEnVisuel(a: unknown, b: unknown): ComparaisonEnVisuel {
	const arrivee = blocsDe(b);
	const rangees = alignement(blocsDe(a), arrivee, empreinteDeNoeud);
	return {
		rangees,
		touches: rangees.filter((r) => r.etat !== 'commun').length,
		blocs: arrivee.length
	};
}

/* ═══════════════════════════════════ L'historique ═══════════════════════ */

/** Le corps capturé par une version — les deux registres, tels quels. */
export interface VersionCapturee {
	readonly numero: number;
	/** Capturé parce que le titre est renommable (RG-M07-02). */
	readonly titre: string;
	readonly reference: Document;
	/** Absent quand la note n'avait pas de registre Opérationnel (RG-NOT-02). */
	readonly operationnel: Document | null;
}

/** Ce que l'historique d'une note met à disposition de la route. */
export interface Historique {
	/** L'historique, de la plus récente à la plus ancienne — l'ordre de l'index. */
	readonly versions: readonly Version[];
	/** Le plafond en vigueur : `versions_max` de `parametres` (M14.7). */
	readonly retention: number;
	/**
	 * La version que `?version={n}` désigne, ou `null` — ce qui couvre les deux
	 * cas que `docs/routes.md:224` distingue : le paramètre absent (« la version
	 * courante ») et un numéro qui ne désigne aucune version.
	 */
	readonly affichee: VersionCapturee | null;
}

/**
 * LE NUMÉRO DEMANDÉ PAR L'ADRESSE — `?version=`, `docs/routes.md:224` :
 * « entier ; `?` nu = version courante ».
 *
 * Toute autre valeur rend `null`, c'est-à-dire la version courante : une adresse
 * forgée ne fabrique pas un troisième état.
 */
export function versionDemandee(parametre: string | null): number | null {
	if (parametre === null) return null;
	if (!/^\d+$/.test(parametre)) return null;
	const numero = Number(parametre);
	return Number.isSafeInteger(numero) && numero >= 1 ? numero : null;
}

/** Les colonnes d'une version, jointes à leur auteur. */
const COLONNES_DE_VERSION = {
	numero: versions.numero,
	le: versions.le,
	auteurNom: comptes.nom,
	resume: versions.resume,
	ajout: versions.ajout,
	retrait: versions.retrait,
	titre: versions.titre,
	corpsReference: versions.corpsReference,
	corpsOperationnel: versions.corpsOperationnel
};

/**
 * LES VERSIONS D'UNE NOTE, DE LA PLUS RÉCENTE À LA PLUS ANCIENNE.
 *
 * L'ACCÈS EST DÉJÀ DÉCIDÉ QUAND CETTE REQUÊTE PART. Les deux fonctions
 * publiques de cette section prennent une `LectureDeNote`, c'est-à-dire le
 * résultat d'une résolution RÉUSSIE de `lireLaNote()` : le périmètre de
 * l'appelant est entré dans le `where` de la requête de note (ADR-006), et un
 * appelant sans droit n'a jamais atteint cette ligne — il a reçu `INTROUVABLE`
 * par le point de sortie unique de RG-ACC-04. Dépendre d'une lecture déjà
 * résolue, plutôt que de refaire le calcul, est ce qui garantit qu'il n'existe
 * pas deux décisions d'accès à la famille des adresses de note.
 *
 * L'ordre est celui de `versions_note_idx` — « c'est l'ordre de l'index, pas un
 * tri à faire » (`base/migrations/004_versions.montee.sql:91-92`).
 */
async function lignesDeVersion(
	base: Base,
	identifiant: string
): Promise<readonly LigneDeVersion[]> {
	return await base
		.select(COLONNES_DE_VERSION)
		.from(versions)
		.innerJoin(notes, eq(versions.noteId, notes.id))
		.innerJoin(comptes, eq(versions.auteurId, comptes.id))
		.where(eq(notes.identifiant, identifiant))
		.orderBy(desc(versions.numero));
}

/** La version capturée, validée par le schéma canonique et par lui seul. */
function capturee(ligne: LigneDeVersion): VersionCapturee {
	return {
		numero: ligne.numero,
		titre: ligne.titre,
		reference: analyserDocument(ligne.corpsReference),
		operationnel:
			ligne.corpsOperationnel === null || ligne.corpsOperationnel === undefined
				? null
				: analyserDocument(ligne.corpsOperationnel)
	};
}

/** L'historique d'une note déjà résolue — V-15. */
export async function lireLHistoire(
	base: Base,
	lecture: LectureDeNote,
	maintenant: Date,
	numero: number | null
): Promise<Historique> {
	const lignes = await lignesDeVersion(base, lecture.note.id);
	const demandee = numero === null ? undefined : lignes.find((l) => l.numero === numero);
	const configuration = await lireConfiguration(base);
	return {
		versions: lignes.map((l) => versionRendue(l, maintenant)),
		retention: configuration.versionsMax,
		affichee: demandee === undefined ? null : capturee(demandee)
	};
}

/* ═══════════════════════════════════ La comparaison ═════════════════════ */

/** Les deux bornes d'une comparaison, telles que l'adresse les porte. */
export interface Bornes {
	readonly a: number;
	readonly b: number;
}

/**
 * LE COUPLE DEMANDÉ PAR L'ADRESSE — `?versions=`, `docs/routes.md:284` :
 * « `{a}-{b}`, ex. 13-14 ».
 *
 * Toute autre valeur rend `null`. AUCUN COUPLE PAR DÉFAUT N'EST POSÉ ICI :
 * `docs/routes.md` n'en nomme aucun, et le couple que le gel porte
 * (`mockups/V-16-comparaison.html:1997`) est l'état de départ D'UNE PLANCHE DE
 * REVUE, pas un défaut de produit. En poser un serait combler. Déclaré au
 * rapport de lot.
 */
export function bornesDemandees(parametre: string | null): Bornes | null {
	if (parametre === null) return null;
	const trouve = /^(\d+)-(\d+)$/.exec(parametre);
	if (trouve === null) return null;
	const a = Number(trouve[1]);
	const b = Number(trouve[2]);
	if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return null;
	if (a < 1 || b < 1) return null;
	return { a, b };
}

/**
 * Le registre comparé. `docs/routes.md:223` porte `?registre=` sur deux adresses
 * et deux seules — celle d'une note et celle d'un guide —, et l'adresse de
 * comparaison n'en est pas : le registre comparé n'est nommé NULLE PART, ni au
 * tableau des paramètres d'état, ni au gel, qui ne connaît qu'un contenu par
 * version. Le Référence est retenu parce qu'il
 * est le seul que toute note porte — RG-NOT-02 rend l'Opérationnel facultatif —
 * et parce que `docs/routes.md` §4.1 le nomme défaut partout ailleurs. La
 * comparaison du registre Opérationnel n'a aucun porteur : déclarée au rapport.
 */
export type RegistreCompare = 'reference';

/** Ce qu'une comparaison de deux versions met à disposition de la route. */
export interface Comparaison {
	readonly bornes: Bornes | null;
	readonly registre: RegistreCompare;
	/**
	 * Les deux bornes désignent-elles une version que la base porte ? Deux
	 * booléens, et non un seul : « la version 11 n'existe pas » et « la version
	 * 14 n'existe pas » ne sont pas le même fait.
	 */
	readonly presentes: { readonly a: boolean; readonly b: boolean };
	/** Les deux bornes désignent la même version : il n'y a rien à comparer. */
	readonly memeVersion: boolean;
	readonly texte: ComparaisonEnTexte;
	readonly visuel: ComparaisonEnVisuel;
	/** L'historique complet — V-16 nomme les deux versions qu'elle compare. */
	readonly versions: readonly Version[];
}

/** La comparaison sans matière : rien n'est comparé, et rien n'est compté. */
const RIEN_A_COMPARER: ComparaisonEnTexte = { lignes: [], ajouts: 0, retraits: 0 };
const AUCUNE_RANGEE: ComparaisonEnVisuel = { rangees: [], touches: 0, blocs: 0 };

/** La comparaison de deux versions d'une note déjà résolue — V-16. */
export async function lireLaComparaison(
	base: Base,
	lecture: LectureDeNote,
	maintenant: Date,
	bornes: Bornes | null
): Promise<Comparaison> {
	const lignes = await lignesDeVersion(base, lecture.note.id);
	const de = (numero: number | undefined): LigneDeVersion | undefined =>
		numero === undefined ? undefined : lignes.find((l) => l.numero === numero);
	const a = de(bornes?.a);
	const b = de(bornes?.b);
	/* LES DEUX BORNES DÉSIGNENT LA MÊME VERSION : le gel rend « il n'y a rien à
	   comparer », et non une comparaison dont l'écart serait nul. La distinction
	   est portée ici, jamais déduite d'un compte à zéro — deux versions
	   DISTINCTES de contenu identique ne sont pas le même cas, et le gel leur
	   réserve d'ailleurs une autre branche. */
	const memeVersion = bornes !== null && bornes.a === bornes.b;
	const compare = bornes !== null && !memeVersion;
	return {
		bornes,
		registre: 'reference',
		presentes: { a: a !== undefined, b: b !== undefined },
		memeVersion,
		texte: compare ? comparerEnTexte(a?.corpsReference, b?.corpsReference) : RIEN_A_COMPARER,
		visuel: compare ? comparerEnVisuel(a?.corpsReference, b?.corpsReference) : AUCUNE_RANGEE,
		versions: lignes.map((l) => versionRendue(l, maintenant))
	};
}
