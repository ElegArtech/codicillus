/**
 * L'historique et la comparaison de deux versions — ce que V-15 et V-16 demandent à la base.
 *
 * Ce module ne prend AUCUNE décision d'accès : il reçoit une `LectureDeNote` que
 * `lireLaNote()` a déjà résolue — filtre de périmètre DANS la requête (`ADR-006`), sortie
 * unique par `INTROUVABLE` (`RG-ACC-04`). Il n'emploie que `serialiserEnMarkdown` du
 * convertisseur unique (`ADR-004`).
 *
 * LA SEMENCE N'ÉCRIT AUCUNE VERSION : l'historique d'une note semée est VIDE — le troisième
 * cas de la planche de V-15, rendu parce qu'il est vrai —, et une comparaison dont les
 * bornes ne désignent aucune version le DIT au lieu de rendre un écart nul.
 * `CONTENU_VERSIONS` du jeu de démonstration n'est pas transposé : le servir en lecture
 * d'une note réelle serait la valeur illustrative que `P-02` proscrit.
 *
 * LE MODE TEXTE — `ARB-055`. La linéarisation « façon texte source » du gel est un QUATRIÈME
 * RENDU dont la forme fait loi À L'AFFICHAGE, et elle n'est pas transposée : son entrée n'est
 * pas le document canonique (neuf types contre douze natures de blocs) et elle EFFACE ce
 * qu'elle ne connaît pas. Ce module emploie ce que la pile désigne : « différences ligne à
 * ligne sur le RENDU MARKDOWN des deux versions » (`STACK` §4.5). LA BORNE D'`ARB-055` EST
 * TENUE : aucune de ces lignes n'est RELUE, `analyserMarkdown` n'est pas importé.
 *
 * LE MODE VISUEL — `ADR-003` : « plus longue sous-séquence commune sur les NŒUDS DE PREMIER
 * NIVEAU, avec empreinte de nœud calculée sur son CONTENU NORMALISÉ ». « Normalisé » n'est
 * défini nulle part, et ce module en prend la lecture la plus PAUVRE — l'ordre des clés est
 * rendu stable, rien d'autre n'est touché. Le document canonique ne porte AUCUNE identité de
 * bloc, là où le gel apparie par `b.cle` : un bloc réécrit sort donc en « retiré » suivi
 * d'« ajouté ».
 */
import { desc, eq } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { comptes, notes, versions } from '../base/schema';
import {
	analyserDocument,
	texteBrut,
	texteDeCopie,
	type Bloc,
	type Document
} from '../contenu/document';
import { serialiserEnMarkdown } from '../contenu/markdown';
import { dateCourteDInstant, joursEcoules, lireConfiguration } from './lecture';
import type { LectureDeNote } from './note';
import type { BlocDeContenu, Version } from '../../../seeds/corpus';

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
 * L'heure d'affichage, lue en UTC — même raison que `dateCourteDInstant()` : la
 * semence écrit des instants UTC, et les relire en heure locale déplacerait la
 * date d'un jour à l'ouest de Greenwich. La date et l'heure d'une version sont
 * deux champs d'affichage d'un SEUL instant.
 */
export function heureCourteDInstant(instant: Date): string {
	const heures = String(instant.getUTCHours()).padStart(2, '0');
	const minutes = String(instant.getUTCMinutes()).padStart(2, '0');
	return `${heures}:${minutes}`;
}

/**
 * Une ligne de base rendue dans la forme `Version` du jeu. `jours` est
 * L'ANCIENNETÉ, comptée par `joursEcoules()` et jamais recalculée ici ; `auteur`
 * est le nom du compte, converti comme `lireNotes()` le fait — le type du jeu
 * énumère les trois auteurs des maquettes, que la base n'a pas à respecter.
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

/**
 * Les lignes de comparaison d'une version — le rendu Markdown, découpé.
 * `serialiserEnMarkdown()` termine par un saut de ligne : le découpage produirait une
 * dernière ligne vide, qui n'est pas une ligne du document et compterait comme un ajout ou
 * un retrait. Elle est retirée, et elle seule. Un document absent rend l'ensemble vide.
 */
export function lignesDeComparaison(valeur: unknown): readonly string[] {
	if (valeur === null || valeur === undefined) return [];
	const lignes = serialiserEnMarkdown(valeur).split('\n');
	if (lignes.length > 0 && lignes[lignes.length - 1] === '') lignes.pop();
	return lignes;
}

/**
 * La normalisation, et elle s'arrête à l'ordre des clés : deux nœuds dont les clés
 * seraient sérialisées dans un ordre différent sont le MÊME nœud ; tout le reste —
 * blancs, casse, marques — est du contenu.
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

export type EtatDePaire = 'commun' | 'retire' | 'ajoute';

export interface Paire<T> {
	readonly etat: EtatDePaire;
	readonly a: T | undefined;
	readonly b: T | undefined;
}

/**
 * Plus longue sous-séquence commune — l'algorithme que le gel porte déjà. Le paquet que
 * `STACK` §4.5 assigne au mode Texte n'est pas installé, et `P-24` interdit à un lot d'en
 * installer un. Le départage d'égalité — le retrait AVANT l'ajout — est celui de
 * `V-16-comparaison.html:1882-1902` : un autre départage donnerait un autre écran. La même
 * transcription vit dans `src/vues/V-16.svelte`, locale à un bloc de script.
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

export interface ComparaisonEnTexte {
	readonly lignes: readonly Paire<string>[];
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

export interface ComparaisonEnVisuel {
	readonly rangees: readonly Paire<Bloc>[];
	readonly touches: number;
	readonly blocs: number;
}

function blocsDe(valeur: unknown): readonly Bloc[] {
	if (valeur === null || valeur === undefined) return [];
	const document: Document = analyserDocument(valeur);
	return document.content;
}

/**
 * Le mode Visuel — `ADR-003` : plus longue sous-séquence commune sur les nœuds de
 * premier niveau, appariés par l'empreinte de leur contenu normalisé.
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

export interface VersionCapturee {
	readonly numero: number;
	/** Capturé parce que le titre est renommable (RG-M07-02). */
	readonly titre: string;
	readonly reference: Document;
	/** Absent quand la note n'avait pas de registre Opérationnel (RG-NOT-02). */
	readonly operationnel: Document | null;
}

export interface Historique {
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
 * Le numéro demandé par l'adresse — `?version=`, « entier ; `?` nu = version
 * courante ». Toute autre valeur rend `null`, donc la version courante : une
 * adresse forgée ne fabrique pas un troisième état.
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
 * Les versions d'une note, de la plus récente à la plus ancienne. L'ACCÈS EST DÉJÀ DÉCIDÉ
 * QUAND CETTE REQUÊTE PART : les deux fonctions publiques de cette section prennent une
 * `LectureDeNote`, résultat d'une résolution RÉUSSIE — il n'existe donc pas deux décisions
 * d'accès à la famille des adresses de note. L'ordre est celui de `versions_note_idx`.
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

export interface Bornes {
	readonly a: number;
	readonly b: number;
}

/**
 * Le couple demandé par l'adresse — `?versions={a}-{b}`. Toute autre valeur rend
 * `null`, et AUCUN COUPLE PAR DÉFAUT N'EST POSÉ : le couple que le gel porte est
 * l'état de départ d'une planche de revue, pas un défaut de produit.
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
 * Le registre comparé. `?registre=` ne porte que sur l'adresse d'une note et celle
 * d'un guide, jamais sur celle d'une comparaison : le registre comparé n'est nommé
 * nulle part, et le gel ne connaît qu'un contenu par version. La Référence est
 * retenue parce qu'elle est le seul registre que toute note porte (`RG-NOT-02`).
 */
export type RegistreCompare = 'reference';

export interface Comparaison {
	readonly bornes: Bornes | null;
	readonly registre: RegistreCompare;
	/**
	 * Les deux bornes désignent-elles une version que la base porte ? Deux
	 * booléens, et non un seul : « la version 11 n'existe pas » et « la version
	 * 14 n'existe pas » ne sont pas le même fait.
	 */
	readonly presentes: { readonly a: boolean; readonly b: boolean };
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
	   comparer », et non une comparaison dont l'écart serait nul. La distinction est
	   portée ici, jamais déduite d'un compte à zéro — deux versions DISTINCTES de
	   contenu identique ne sont pas le même cas. */
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

/**
 * La transposition d'affichage — un nœud canonique dans la forme que le mode Visuel de V-16
 * sait peindre. ELLE NE TOUCHE NI LE STOCKAGE NI LA COMPARAISON : l'alignement d'`ADR-003`
 * est calculé plus haut, sur les nœuds CANONIQUES, et aucune de ces valeurs n'est RELUE.
 *
 * CE QU'ELLE PERD EST NOMMÉ : le gel ne dessine que neuf formes, le format en porte douze.
 * Une liste numérotée est rendue par la forme à puces, une citation en paragraphe avec son
 * attribution à la suite, un séparateur par sa forme Markdown, un diagramme comme une
 * figure. Le langage d'un bloc de code et le niveau d'une alerte sortent de l'ensemble clos
 * du gel : la valeur RÉELLE est portée telle quelle.
 *
 * LA CLÉ EST L'EMPREINTE DU CONTENU : le format canonique ne porte pas l'identité stable par
 * laquelle le gel apparie ses blocs.
 */
function texteDUnBloc(bloc: Bloc): string {
	return texteBrut({ type: 'doc', content: [bloc] });
}

function texteDeBlocs(blocs: readonly Bloc[]): string {
	return texteBrut({ type: 'doc', content: blocs });
}

function markdownDUnBloc(bloc: Bloc): string {
	return serialiserEnMarkdown({ type: 'doc', content: [bloc] }).trim();
}

function tableauDAffichage(bloc: Extract<Bloc, { type: 'table' }>): {
	readonly entetes: readonly string[];
	readonly lignes: readonly (readonly string[])[];
} {
	const rangees = bloc.content.map((ligne) => ({
		enTete: ligne.content.every((c) => c.type === 'tableHeader'),
		cellules: ligne.content.map((c) => texteDeBlocs(c.content))
	}));
	const premiere = rangees[0];
	/* Les lignes de tête sont celles dont TOUTES les cellules sont des cellules
	   d'en-tête — la lecture de `rendu.ts`, reprise et non réécrite. */
	return premiere !== undefined && premiere.enTete
		? { entetes: premiere.cellules, lignes: rangees.slice(1).map((r) => r.cellules) }
		: { entetes: [], lignes: rangees.map((r) => r.cellules) };
}

/** Un nœud canonique dans la forme d'affichage de V-16. Voir l'en-tête. */
export function blocDAffichage(bloc: Bloc): BlocDeContenu {
	const cle = empreinteDeNoeud(bloc);
	switch (bloc.type) {
		case 'heading':
			return { cle, type: bloc.attrs.level <= 2 ? 'h2' : 'h3', texte: texteDUnBloc(bloc) };
		case 'paragraph':
			return { cle, type: 'p', texte: texteDUnBloc(bloc) };
		case 'blockquote':
			return { cle, type: 'p', texte: texteDUnBloc(bloc).split('\n').join(' ') };
		case 'bulletList':
		case 'orderedList':
			return { cle, type: 'liste', items: bloc.content.map((e) => texteDeBlocs(e.content)) };
		case 'taskList':
			return { cle, type: 'taches', items: bloc.content.map((t) => texteDeBlocs(t.content)) };
		case 'codeBlock':
			return {
				cle,
				type: 'code',
				langage: bloc.attrs.language ?? '',
				lignes: texteDeCopie(bloc).split('\n')
			} as BlocDeContenu;
		case 'alerte':
			return {
				cle,
				type: 'alerte',
				niveau: bloc.attrs.niveau,
				titre: bloc.attrs.titre,
				texte: texteDeBlocs(bloc.content)
			} as BlocDeContenu;
		case 'table':
			return { cle, type: 'tableau', ...tableauDAffichage(bloc) };
		case 'image':
			return { cle, type: 'figure', legende: bloc.attrs.legende ?? bloc.attrs.alt };
		case 'diagramme':
			return { cle, type: 'figure', legende: bloc.attrs.legende ?? bloc.attrs.alternative };
		case 'horizontalRule':
			return { cle, type: 'p', texte: markdownDUnBloc(bloc) };
	}
}

export function rangeesDAffichage(visuel: ComparaisonEnVisuel): readonly Paire<BlocDeContenu>[] {
	return visuel.rangees.map((r) => ({
		etat: r.etat,
		a: r.a === undefined ? undefined : blocDAffichage(r.a),
		b: r.b === undefined ? undefined : blocDAffichage(r.b)
	}));
}
