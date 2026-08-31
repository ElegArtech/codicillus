/**
 * LES FAMILLES SÉMANTIQUES — `RG-M09-06`, et M09.6 du cahier : « regroupement des notes
 * par proximité de sens, INDÉPENDAMMENT DES RELATIONS DÉCLARÉES. Révèle les notes qui
 * parlent du même sujet sans être liées. »
 *
 * CE N'EST DONC PAS LE GRAPHE DE `cartographie.ts` QU'ON REGROUPE. `sousGraphe()` part des
 * relations et retire tout nœud que rien ne relie ; une famille sémantique doit au
 * contraire pouvoir réunir deux notes qu'aucune relation ne touche. Le regroupement se
 * fait sur un SECOND graphe, celui des AFFINITÉS : deux notes sont voisines quand elles
 * partagent une étiquette, un dossier, ou un mot de titre.
 *
 * LE PÉRIMÈTRE EST TENU PAR CONSTRUCTION (`ADR-006`). Rien n'est lu ici : la seule entrée
 * est la liste de notes que l'appelant a le droit de lire, telle que `lireNotesLisibles()`
 * la rend. Aucun nœud, aucun compteur, aucun NOM DE FAMILLE ne peut donc naître d'une note
 * hors périmètre — les noms sont des traits relevés SUR CES NOTES-LÀ.
 *
 * LE CALCUL EST DÉTERMINISTE. Louvain tire au sort l'ordre de sa marche ; le tirage est
 * remplacé par un générateur de graine fixe, sans quoi deux consultations du même corpus
 * rendraient deux découpages, et la date affichée daterait un regroupement qui a changé
 * tout seul.
 *
 * IL N'EST PAS REFAIT À CHAQUE CONSULTATION, et c'est la lettre de `RG-M09-06`. Voir
 * `famillesDuPerimetre()` pour le déclenchement et pour la date.
 */
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import type { Note } from '../../../seeds/corpus';
import { dansLePerimetre, type Perimetre } from './cartographie';

/* ── LES TRAITS D'UNE NOTE ─────────────────────────────────────────────────
   Trois natures, trois poids. L'étiquette est le trait le plus intentionnel —
   quelqu'un l'a posée pour dire de quoi la note parle ; le dossier dit un
   rangement, donc un sujet commun mais large ; le mot de titre est le plus
   faible, parce qu'un mot peut être un homonyme. */

export type NatureDeTrait = 'etiquette' | 'dossier' | 'mot';

const POIDS: Readonly<Record<NatureDeTrait, number>> = {
	etiquette: 3,
	dossier: 2,
	mot: 1
};

/**
 * CE QUE LA LÉGENDE DIT D'UNE NATURE, en toutes lettres. La phrase est calculée ICI et
 * descend AVEC la famille : les deux vues n'ont ainsi aucune valeur à importer de ce
 * module — un `import type` est effacé, un import de valeur ferait partir Louvain et
 * graphology dans le paquet servi au navigateur, pour trois mots.
 */
const ORIGINE_DE_NATURE: Readonly<Record<NatureDeTrait, string>> = {
	etiquette: "d'après l'étiquette",
	dossier: "d'après le dossier",
	mot: "d'après un mot du titre"
};

interface Trait {
	readonly nature: NatureDeTrait;
	/** La forme comparée — sans accent ni casse. */
	readonly cle: string;
	/** La forme affichée — celle que la note porte. */
	readonly libelle: string;
}

/**
 * LES MOTS QUI NE DISENT RIEN D'UN SUJET. Grammaticaux uniquement : aucun mot du
 * métier n'y figure, sans quoi le regroupement cesserait de voir un sujet réel. Les
 * mots de moins de quatre lettres sont déjà écartés par la longueur.
 */
const MOTS_OUTILS: ReadonlySet<string> = new Set([
	'AINSI',
	'APRES',
	'AUTRE',
	'AUTRES',
	'AVANT',
	'AVEC',
	'AVOIR',
	'CELA',
	'CELLE',
	'CELLES',
	'CETTE',
	'CEUX',
	'CHEZ',
	'COMME',
	'DANS',
	'DEPUIS',
	'DONC',
	'DONT',
	'ELLE',
	'ELLES',
	'ENTRE',
	'ETRE',
	'LEUR',
	'LEURS',
	'MAIS',
	'MEME',
	'MEMES',
	'MOINS',
	'NOTRE',
	'PLUS',
	'POUR',
	'QUAND',
	'SANS',
	'SELON',
	'SOUS',
	'TOUS',
	'TOUT',
	'TOUTE',
	'TOUTES',
	'VOTRE'
]);

/** La longueur en deçà de laquelle un mot de titre ne distingue rien. */
const LONGUEUR_MINIMALE_DE_MOT = 4;

/** La forme comparée d'un libellé : sans diacritique, en capitales, élaguée. */
function cleDeLibelle(libelle: string): string {
	return libelle.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().trim();
}

/** Les mots significatifs d'un titre — les mots outils et les trop courts en moins. */
function motsDuTitre(titre: string): { cle: string; libelle: string }[] {
	const bruts = titre.split(/[^\p{L}\p{N}]+/u).filter((m) => m !== '');
	const retenus: { cle: string; libelle: string }[] = [];
	for (const brut of bruts) {
		const cle = cleDeLibelle(brut);
		if (cle.length < LONGUEUR_MINIMALE_DE_MOT) continue;
		if (MOTS_OUTILS.has(cle)) continue;
		retenus.push({ cle, libelle: brut.toLocaleLowerCase('fr') });
	}
	return retenus;
}

/**
 * LES TRAITS D'UNE NOTE. Le dossier est qualifié de son univers et de son domaine :
 * deux domaines peuvent porter un dossier du même nom, et les confondre réunirait
 * deux sujets étrangers sous une même famille.
 */
function traitsDeLaNote(note: Note): readonly Trait[] {
	const traits: Trait[] = [];
	for (const etiquette of note.etiquettes) {
		traits.push({ nature: 'etiquette', cle: 'E:' + cleDeLibelle(etiquette), libelle: etiquette });
	}
	const rangement = note.dossier === '' ? note.domaine : note.dossier;
	traits.push({
		nature: 'dossier',
		cle: 'D:' + cleDeLibelle(note.univers + '/' + note.domaine + '/' + rangement),
		libelle: rangement
	});
	for (const mot of motsDuTitre(note.titre)) {
		traits.push({ nature: 'mot', cle: 'M:' + mot.cle, libelle: mot.libelle });
	}
	return traits;
}

/* ── LE GRAPHE DES AFFINITÉS ───────────────────────────────────────────────
   Un trait porté par UNE seule note ne rapproche personne : il ne fabrique aucune
   arête. C'est la SEULE raison d'écarter un trait, avec le coût.

   UN TRAIT TRÈS RÉPANDU N'EST PAS ÉCARTÉ, ET C'ÉTAIT UN DÉFAUT DE LE FAIRE. Le calcul
   commençait par jeter tout trait porté par plus de la moitié du périmètre — la règle
   classique du mot trop fréquent. Sur un GRAND corpus elle ne se voit pas ; sur un
   petit périmètre — trois notes lisibles, toutes étiquetées « exploitation » — elle
   jette le seul trait qui existe, et l'écran affiche alors « ces trois notes ne
   partagent ni étiquette, ni dossier, ni mot de titre », ce qui est FAUX. Le poids
   d'un trait est déjà divisé par le nombre de voisins qu'il donne (voir
   `poidsParPaire`) : un trait répandu pèse peu par paire, il n'a pas besoin d'être
   jeté. S'il réunit tout le périmètre, la réponse juste est « une seule famille », pas
   « aucune ». */

/** Le nombre de notes au-delà duquel un trait coûterait plus d'arêtes qu'il n'informe. */
const NOTES_MAXIMALES_PAR_TRAIT = 60;

/**
 * Le poids qu'un trait pose sur chaque paire qu'il réunit. Il est DIVISÉ par le nombre
 * de voisins qu'il donne à chaque note : sans cela, un dossier de trente notes pèserait
 * plus lourd, à lui seul, que toutes les étiquettes du périmètre réunies.
 */
function poidsParPaire(nature: NatureDeTrait, effectif: number): number {
	return POIDS[nature] / (effectif - 1);
}

/* ── LE TIRAGE, RENDU STABLE ───────────────────────────────────────────────
   Louvain parcourt ses nœuds dans un ordre tiré au sort. Le générateur ci-dessous
   remplace `Math.random` : même corpus, même découpage, toujours. */

const GRAINE = 0x9e3779b9;

function generateurStable(): () => number {
	let etat = GRAINE >>> 0;
	return () => {
		etat = (etat + 0x6d2b79f5) >>> 0;
		let t = etat;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/* ── LE RÉSULTAT ───────────────────────────────────────────────────────────── */

export interface FamilleSemantique {
	/** Une clé stable dans la page — le premier identifiant de note, par ordre. */
	readonly cle: string;
	/** Le trait dominant de la famille, relevé sur ses seules notes. */
	readonly nom: string;
	/** Ce dont ce nom est tiré, pour que la légende n'ait rien à deviner. */
	readonly nature: NatureDeTrait;
	/** La même chose en toutes lettres, prête à lire — voir `ORIGINE_DE_NATURE`. */
	readonly origine: string;
	/** Les identifiants des notes de la famille, dans l'ordre du périmètre. */
	readonly membres: readonly string[];
}

export interface FamillesSemantiques {
	readonly familles: readonly FamilleSemantique[];
	/** Les notes que rien ne rapproche d'aucune autre — comptées, jamais tues. */
	readonly sansFamille: number;
	/** Le nombre de notes lisibles examinées, familles et solitaires confondues. */
	readonly notesExaminees: number;
	/**
	 * LA DATE DU CALCUL, en forme lisible par une machine. `RG-M09-06` l'exige
	 * affichée ; elle est produite ICI, jamais dans la vue, parce que la vue n'a
	 * aucun moyen de savoir si le regroupement qu'elle rend vient d'être calculé ou
	 * s'il attendait en mémoire depuis une heure.
	 */
	readonly calculeLe: string;
}

/** Le résultat d'un périmètre sans une seule note lisible. */
function aucuneFamille(calculeLe: string): FamillesSemantiques {
	return { familles: [], sansFamille: 0, notesExaminees: 0, calculeLe };
}

/**
 * LE CALCUL, NU. Pur : mêmes notes, même instant, même résultat — aucune horloge,
 * aucun tirage, aucune lecture. C'est `famillesDuPerimetre()` qui décide QUAND
 * l'appeler ; celle-ci ne décide que de CE QU'ELLE TROUVE.
 */
export function calculerLesFamilles(
	notesLisibles: readonly Note[],
	maintenant: Date
): FamillesSemantiques {
	const calculeLe = maintenant.toISOString();
	if (notesLisibles.length === 0) return aucuneFamille(calculeLe);

	/* L'index inversé : pour chaque trait, les notes qui le portent. L'ordre des
	   notes est celui du périmètre, donc celui de la requête — déterministe. */
	const parTrait = new Map<string, { nature: NatureDeTrait; libelle: string; notes: string[] }>();
	const traitsParNote = new Map<string, Set<string>>();
	for (const note of notesLisibles) {
		const siennes = new Set<string>();
		for (const trait of traitsDeLaNote(note)) {
			if (siennes.has(trait.cle)) continue;
			siennes.add(trait.cle);
			const deja = parTrait.get(trait.cle);
			if (deja === undefined) {
				parTrait.set(trait.cle, {
					nature: trait.nature,
					libelle: trait.libelle,
					notes: [note.id]
				});
			} else deja.notes.push(note.id);
		}
		traitsParNote.set(note.id, siennes);
	}

	/* Les traits qui rapprochent : au moins deux notes, et pas plus que le plafond
	   de coût. Le reste ne fabrique aucune arête. */
	const retenus = [...parTrait.entries()].filter(
		([, t]) => t.notes.length >= 2 && t.notes.length <= NOTES_MAXIMALES_PAR_TRAIT
	);

	const graphe = new Graph({ type: 'undirected' });

	/**
	 * LES VOISINS D'AFFINITÉ DE CHAQUE NOTE, et le poids de chaque voisinage. La table
	 * est bâtie AVANT le graphe et gardée après lui : le rattachement des notes que
	 * Louvain laisse seules s'y lit sans réinterroger graphology.
	 */
	const voisins = new Map<string, Map<string, number>>();
	const rapprocher = (a: string, b: string, poids: number): void => {
		const siens = voisins.get(a);
		if (siens === undefined) voisins.set(a, new Map([[b, poids]]));
		else siens.set(b, (siens.get(b) ?? 0) + poids);
	};
	for (const [, trait] of retenus) {
		const part = poidsParPaire(trait.nature, trait.notes.length);
		for (let i = 0; i < trait.notes.length; i += 1) {
			for (let j = i + 1; j < trait.notes.length; j += 1) {
				const a = trait.notes[i] as string;
				const b = trait.notes[j] as string;
				rapprocher(a, b, part);
				rapprocher(b, a, part);
			}
		}
	}

	for (const [a, siens] of voisins) {
		if (!graphe.hasNode(a)) graphe.addNode(a);
		for (const [b, poids] of siens) {
			if (!graphe.hasNode(b)) graphe.addNode(b);
			if (!graphe.hasEdge(a, b)) graphe.addEdge(a, b, { poids });
		}
	}

	const rang = new Map<string, number>();
	notesLisibles.forEach((n, i) => rang.set(n.id, i));

	/* Louvain refuse un graphe sans arête, et il aurait raison : sans arête, il
	   n'y a rien à regrouper. Toutes les notes sont alors solitaires. */
	const communautes: Record<string, number> =
		graphe.order > 0 && graphe.size > 0
			? louvain(graphe, { getEdgeWeight: 'poids', rng: generateurStable() })
			: {};

	const membresParCommunaute = new Map<number, string[]>();
	for (const note of notesLisibles) {
		const communaute = communautes[note.id];
		if (communaute === undefined) continue;
		const deja = membresParCommunaute.get(communaute);
		if (deja === undefined) membresParCommunaute.set(communaute, [note.id]);
		else deja.push(note.id);
	}

	/* UNE NOTE N'EST SOLITAIRE QUE SI RIEN NE LA RAPPROCHE DE PERSONNE, et c'est la
	   seule définition que l'écran puisse dire sans mentir — « ces notes ne partagent
	   ni étiquette, ni dossier, ni mot de titre ».

	   LOUVAIN LAISSE DES COMMUNAUTÉS D'UN SEUL NŒUD, y compris quand ce nœud est relié
	   à tous les autres : sur un graphe complet, toutes les partitions ont la même
	   modularité, et le découpage rendu est arbitraire. Mesuré : douze notes du même
	   dossier rendaient une famille de onze et UNE solitaire — une note présentée
	   comme ne partageant rien avec les onze autres, alors qu'elle partageait tout.
	   Une communauté d'un seul nœud RELIÉ rejoint donc la famille avec laquelle son
	   affinité totale est la plus forte. */
	const groupes = [...membresParCommunaute.values()]
		.filter((membres) => membres.length >= 2)
		.sort(
			(a, b) => b.length - a.length || (rang.get(a[0] ?? '') ?? 0) - (rang.get(b[0] ?? '') ?? 0)
		);

	const seules = [...membresParCommunaute.values()]
		.filter((membres) => membres.length === 1)
		.map((membres) => membres[0] as string);

	const parRang = (a: string, b: string): number => (rang.get(a) ?? 0) - (rang.get(b) ?? 0);

	for (const seule of [...seules]) {
		if (!seules.includes(seule)) continue;
		const siens = voisins.get(seule);
		if (siens === undefined) continue;

		let meilleure: string[] | null = null;
		let meilleurPoids = 0;
		for (const groupe of groupes) {
			let poids = 0;
			for (const membre of groupe) poids += siens.get(membre) ?? 0;
			if (poids > meilleurPoids) {
				meilleure = groupe;
				meilleurPoids = poids;
			}
		}

		if (meilleure !== null) {
			meilleure.push(seule);
			meilleure.sort(parRang);
			seules.splice(seules.indexOf(seule), 1);
			continue;
		}

		/* AUCUNE FAMILLE VOISINE. C'est le cas des tout petits périmètres : deux notes
		   qui se rapprochent l'une l'autre font deux communautés d'un nœud, et les
		   déclarer solitaires démentirait l'étiquette qu'elles partagent. Elles
		   forment leur propre famille. */
		const compagnons = seules.filter((autre) => autre !== seule && siens.has(autre));
		if (compagnons.length === 0) continue;
		const groupe = [seule, ...compagnons].sort(parRang);
		for (const membre of groupe) seules.splice(seules.indexOf(membre), 1);
		groupes.push(groupe);
	}

	groupes.sort(
		(a, b) => b.length - a.length || (rang.get(a[0] ?? '') ?? 0) - (rang.get(b[0] ?? '') ?? 0)
	);

	const regroupees = new Set<string>();
	for (const membres of groupes) for (const id of membres) regroupees.add(id);

	const nomsPris = new Set<string>();
	const familles: FamilleSemantique[] = groupes.map((membres, position) => {
		const nomme = nommerLaFamille(membres, traitsParNote, parTrait, retenus, nomsPris, position);
		nomsPris.add(nomme.nom);
		return {
			cle: membres[0] as string,
			nom: nomme.nom,
			nature: nomme.nature,
			origine: ORIGINE_DE_NATURE[nomme.nature],
			membres
		};
	});

	return {
		familles,
		sansFamille: notesLisibles.length - regroupees.size,
		notesExaminees: notesLisibles.length,
		calculeLe
	};
}

/**
 * LE NOM D'UNE FAMILLE — le trait que ses notes partagent le plus. Il ne peut venir que
 * des notes de la famille, donc du périmètre lisible : aucune famille ne peut se nommer
 * d'un mot lu sur une note interdite.
 *
 * DEUX FAMILLES NE PORTENT PAS LE MÊME NOM : le second trait est pris quand le premier
 * est déjà employé, et à défaut la famille est numérotée plutôt que confondue.
 */
function nommerLaFamille(
	membres: readonly string[],
	traitsParNote: ReadonlyMap<string, ReadonlySet<string>>,
	parTrait: ReadonlyMap<string, { nature: NatureDeTrait; libelle: string; notes: string[] }>,
	retenus: readonly [string, { nature: NatureDeTrait; libelle: string; notes: string[] }][],
	nomsPris: ReadonlySet<string>,
	position: number
): { nom: string; nature: NatureDeTrait } {
	const candidats = new Set<string>();
	for (const [cle] of retenus) candidats.add(cle);

	const comptes = new Map<string, number>();
	for (const membre of membres) {
		for (const cle of traitsParNote.get(membre) ?? []) {
			if (!candidats.has(cle)) continue;
			comptes.set(cle, (comptes.get(cle) ?? 0) + 1);
		}
	}

	const classes = [...comptes.entries()]
		.filter(([, n]) => n >= 2)
		.sort((a, b) => {
			if (b[1] !== a[1]) return b[1] - a[1];
			const na = parTrait.get(a[0]);
			const nb = parTrait.get(b[0]);
			const pa = na === undefined ? 0 : POIDS[na.nature];
			const pb = nb === undefined ? 0 : POIDS[nb.nature];
			if (pb !== pa) return pb - pa;
			return (na?.libelle ?? '').localeCompare(nb?.libelle ?? '', 'fr');
		});

	for (const [cle] of classes) {
		const trait = parTrait.get(cle);
		if (trait === undefined) continue;
		if (nomsPris.has(trait.libelle)) continue;
		return { nom: trait.libelle, nature: trait.nature };
	}
	return { nom: `Famille ${position + 1}`, nature: 'mot' };
}

/* ── QUAND LE CALCUL EST REFAIT, ET CE QUE LA DATE DATE ────────────────────
   `RG-M09-06` : « recalculées PÉRIODIQUEMENT, PAS À CHAQUE CONSULTATION. Leur date
   de calcul est affichée. »

   LA DATE N'EST PAS RANGÉE EN BASE, ET C'EST LE PÉRIMÈTRE QUI L'INTERDIT. Une famille
   se calcule sur les notes que L'APPELANT a le droit de lire (`ADR-006`) : deux comptes
   n'ont pas le même découpage, et n'ont donc pas la même date de calcul. Une ligne
   unique dans `parametres` daterait un regroupement que personne ne voit — un chiffre
   juste sous un écran faux. Le souvenir vit donc dans le PROCESSUS, indexé par
   l'EMPREINTE du corpus lisible.

   LE RECALCUL SE DÉCLENCHE À DEUX CONDITIONS, ET À DEUX SEULEMENT : le corpus lisible a
   bougé — un titre, une étiquette, un rangement, une note de plus ou de moins —, ou le
   dernier calcul de ce même corpus a passé la période. Entre les deux, la consultation
   ressert le regroupement déjà calculé, avec SA date. Il n'y a ni tâche de fond ni
   planificateur dans ce produit : les inventer pour cette règle coûterait un service de
   plus pour un résultat qu'une consultation obtient déjà. */

/** La période au bout de laquelle un regroupement inchangé est refait — douze heures. */
export const PERIODE_DE_RECALCUL_MS = 12 * 60 * 60 * 1000;

/** Le nombre d'empreintes gardées en mémoire — au-delà, la plus ancienne sort. */
const EMPREINTES_GARDEES = 24;

interface Souvenir {
	readonly resultat: FamillesSemantiques;
	readonly calculeA: number;
}

const SOUVENIRS = new Map<string, Souvenir>();

/**
 * L'EMPREINTE DU CORPUS LISIBLE — tout ce dont le regroupement dépend, et rien d'autre :
 * l'identifiant, le titre, le rangement et les étiquettes de chaque note. Deux corpus qui
 * ne diffèrent que par un compteur de vues rendent la même empreinte, donc ne relancent
 * aucun calcul.
 */
export function empreinteDuCorpus(notesLisibles: readonly Note[]): string {
	let h1 = 2166136261;
	let h2 = 2166136261;
	const avaler = (texte: string): void => {
		for (let i = 0; i < texte.length; i += 1) {
			const c = texte.charCodeAt(i);
			h1 ^= c;
			h1 = Math.imul(h1, 16777619);
			h2 = Math.imul(h2 ^ c, 2246822519);
			h2 = (h2 << 13) | (h2 >>> 19);
		}
	};
	avaler(String(notesLisibles.length));
	for (const note of notesLisibles) {
		avaler(note.id);
		avaler(note.titre);
		avaler(note.univers);
		avaler(note.domaine);
		avaler(note.dossier);
		for (const etiquette of note.etiquettes) avaler(etiquette);
	}
	return (h1 >>> 0).toString(36) + '-' + (h2 >>> 0).toString(36);
}

/**
 * LES FAMILLES DU PÉRIMÈTRE AFFICHÉ, avec la date de leur calcul.
 *
 * @param notesLisibles les notes que l'appelant a le droit de lire, et elles seules
 * @param perimetre le périmètre d'AFFICHAGE choisi dans le sélecteur — jamais un droit
 * @param maintenant l'instant de la requête
 */
export function famillesDuPerimetre(
	notesLisibles: readonly Note[],
	perimetre: Perimetre,
	maintenant: Date
): FamillesSemantiques {
	const dedans = notesLisibles.filter((n) => dansLePerimetre(n, perimetre));
	const empreinte = empreinteDuCorpus(dedans);
	const souvenir = SOUVENIRS.get(empreinte);
	if (souvenir !== undefined && maintenant.getTime() - souvenir.calculeA < PERIODE_DE_RECALCUL_MS) {
		return souvenir.resultat;
	}

	const resultat = calculerLesFamilles(dedans, maintenant);
	SOUVENIRS.delete(empreinte);
	SOUVENIRS.set(empreinte, { resultat, calculeA: maintenant.getTime() });
	while (SOUVENIRS.size > EMPREINTES_GARDEES) {
		const plusAncienne = SOUVENIRS.keys().next();
		if (plusAncienne.done === true) break;
		SOUVENIRS.delete(plusAncienne.value);
	}
	return resultat;
}

/** Vide le souvenir — les unitaires en ont besoin pour observer un recalcul. */
export function oublierLesFamilles(): void {
	SOUVENIRS.clear();
}
