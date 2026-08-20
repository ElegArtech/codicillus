/**
 * LES COMMANDES DE L'INDEX — réindexer, lire son état, l'éprouver.
 *
 * Elles vivent en TypeScript pour la même raison que celles de la base : elles
 * sont contrôlées par `pnpm check`, et le lanceur (`recherche/recherche.mjs`)
 * ne fait que charger, appeler et imprimer.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CHAQUE COMMANDE PROUVE, ET CE QU'ELLE NE PROUVE PAS
 *
 *   `reindexer`  l'index est reconstruit DEPUIS LA BASE, et le rapport donne
 *                les deux nombres — projetées, indexées. Il ne prouve rien de
 *                l'autorisation : c'est `epreuve` qui s'en charge.
 *
 *   `etat`       ce que l'index porte RÉELLEMENT — entrées, champs réglés,
 *                embedders. Mesuré sur le moteur, jamais supposé. C'est aussi
 *                là que l'indisponibilité du mode « Sens » se lit sur pièce :
 *                aucun embedder déclaré.
 *
 *   `epreuve`    qu'AUCUNE entrée interdite ne sort de l'index, pour les SEPT
 *                personas du plan §5, et que le filtre n'est pas inerte. Elle
 *                ne prouve rien des réponses HTTP du produit : c'est la
 *                batterie 6 qui les mesure.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI L'ÉPREUVE COMPARE À `resolution.ts` PLUTÔT QU'À UNE LISTE ATTENDUE
 *
 * Une liste écrite à la main serait une seconde définition du droit, et la
 * première divergence donnerait raison à la liste. La référence est donc
 * `identifiantsLisibles()` — le chemin que `/` emploie —, et l'épreuve exige
 * l'ÉGALITÉ des deux ensembles, pas l'inclusion :
 *
 *   une entrée dans l'index et pas dans la référence est une FUITE ;
 *   une entrée dans la référence et pas dans l'index est une PERTE — le
 *   produit cacherait à un ayant droit ce qu'il a le droit de lire.
 *
 * Les deux sont des défauts. Ne mesurer que le premier laisserait le second
 * s'installer, et un index trop fermé se signale mal : il ressemble à un corpus
 * pauvre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES SONT SYNTHÉTIQUES, ET C'EST `P-26`
 *
 * « Un contrôle dont le seul cas d'épreuve est le défaut qu'il trouve devient
 * inerte en réussissant. » Le corpus livré ne porte AUCUNE note publique en
 * brouillon (mesuré : 0), et aucun droit explicite de dossier (mesuré : 0). Les
 * cas qui séparent les règles les unes des autres n'y sont donc pas.
 *
 * L'épreuve les FABRIQUE — six entrées d'index qui n'existent dans aucune base,
 * posées puis retirées —, et elle porte ses CONTRÔLES POSITIFS avec elle : une
 * entrée qui DOIT sortir à côté de chacune qui doit rester. Sans eux, un filtre
 * qui ne rendrait jamais rien passerait l'épreuve haut la main.
 */
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { comptes, dossiers, droitsDeDossier } from '../base/schema';
import { identifiantsLisibles } from '../donnees/accueil';
import { parametresHonores } from '../donnees/public';
import {
	ANONYME,
	type DroitDeDossier,
	type Identite,
	type RoleDeCompte,
	chaineDAncetres,
	identiteAuthentifiee,
	indexerLesDroits
} from '../droits/resolution';
import { type EnvironnementDeRecherche } from './connexion';
import {
	type RapportDeReindexation,
	chercherLesNotes,
	etatDeLIndex,
	filtreDeLIdentite,
	indexerDesNotes,
	moteurDeRecherche,
	projeterLeCorpus,
	reindexer,
	retirerDesNotes
} from './moteur';
import type { NoteIndexee } from './notes-indexees';

export { moteurDeRecherche, etatDeLIndex };
export type { RapportDeReindexation };

/** La réindexation complète, telle que le lanceur l'appelle. */
export async function reindexerLeCorpus(
	base: Base,
	env: EnvironnementDeRecherche
): Promise<RapportDeReindexation> {
	return await reindexer(base, moteurDeRecherche(env));
}

/* ═══════════════════════════════════ Les sept personas ════════════════ */

/**
 * LES SEPT PERSONAS — ceux du plan §5 l. 341, plus le compte désactivé.
 *
 * L'attribution des comptes est celle de la batterie 6 (`verif/etancheite-attendu.mjs`),
 * et elle est reprise à l'identique : deux tables de personas divergeraient, et
 * la divergence se lirait comme un défaut du produit.
 *
 * LES TROIS PERSONAS DE DROIT SONT UN GABARIT, ET LA BATTERIE 6 LE DIT AUSSI :
 * « le corpus porte cinq comptes et AUCUN droit explicite de dossier. Les trois
 * personas de droit sont donc posés en GABARIT DÉCLARÉ, sur le même compte, le
 * droit étant réécrit entre les passes. Un compte fabriqué serait une semence
 * inventée. »
 *
 * LE COMPTE DÉSACTIVÉ N'EST PAS UNE IDENTITÉ AUTHENTIFIÉE, et c'est le point de
 * son cas. `RG-M14-08` : « un compte désactivé perd IMMÉDIATEMENT l'accès ». Son
 * point d'application est l'établissement de session, pas la résolution des
 * droits — `Identite` ne porte pas `actif`, délibérément
 * (`resolution.ts`). Ce persona est donc mesuré ANONYME, et l'épreuve le
 * déclare : ce qu'elle prouve de lui, c'est qu'aucun chemin de l'index ne lui
 * rend davantage qu'à un anonyme.
 */
export interface PersonaDIndex {
	readonly nom: string;
	readonly compte: string | null;
	readonly droit: DroitDeDossier | null;
	readonly incarnation: string;
}

export const PERSONAS_DINDEX: readonly PersonaDIndex[] = [
	{ nom: 'anonyme', compte: null, droit: null, incarnation: 'aucune session — réel' },
	{
		nom: 'contributeur-sans-droit',
		compte: 'marc.ferreira',
		droit: null,
		incarnation: 'marc.ferreira (contributeur, actif, aucun droit explicite) — réel'
	},
	{
		nom: 'lecteur',
		compte: 'marc.ferreira',
		droit: 'lecteur',
		incarnation: 'marc.ferreira + droit « lecteur » sur un dossier racine — GABARIT'
	},
	{
		nom: 'redacteur',
		compte: 'marc.ferreira',
		droit: 'redacteur',
		incarnation: 'marc.ferreira + droit « rédacteur » sur un dossier racine — GABARIT'
	},
	{
		nom: 'gestionnaire',
		compte: 'marc.ferreira',
		droit: 'gestionnaire',
		incarnation: 'marc.ferreira + droit « gestionnaire » sur un dossier racine — GABARIT'
	},
	{
		nom: 'administrateur',
		compte: 'sophie.nguyen',
		droit: null,
		incarnation: 'sophie.nguyen (administrateur) — réel'
	},
	{
		nom: 'compte-desactive',
		compte: 'pierre.dubois',
		droit: null,
		incarnation: 'pierre.dubois (actif: false) — réel, mesuré ANONYME (RG-M14-08)'
	}
];

/* ═══════════════════════════════════ Les entrées de sonde ═════════════ */

/**
 * LE DOSSIER D'UNE SONDE — un identifiant qui n'est dans aucune arborescence.
 *
 * Il est volontairement hors de la base : aucun périmètre authentifié ne peut le
 * contenir, donc une sonde qui le porte ne peut sortir que par le filtre
 * anonyme ou par le filtre total. C'est ce qui rend chaque attendu lisible.
 */
const DOSSIER_DE_SONDE = '00000000-0000-4000-8000-000000000051';
const AUTRE_DOSSIER_DE_SONDE = '00000000-0000-4000-8000-000000000052';

/** Le terme qui n'appartient qu'aux sondes — il n'est dans aucun titre du corpus. */
export const TERME_DE_SONDE = 'sondeperimetret051';

/** Une entrée d'index fabriquée pour l'épreuve. Le dossier est celui du parcours. */
function entreeDeSonde(
	id: string,
	visibilite: 'interne' | 'publique',
	statut: 'brouillon' | 'publiee',
	dossier: string
): NoteIndexee {
	return {
		id,
		titre: `${TERME_DE_SONDE} ${id}`,
		extrait: TERME_DE_SONDE,
		auteur: 'sonde',
		type: 'Procédure',
		typeFiche: null,
		univers: 'sonde',
		domaine: 'sonde',
		etiquettes: [],
		dossier,
		ancetres: [dossier],
		visibilite,
		statut,
		modifieLe: 0,
		verifieLe: null,
		consultations: 0
	};
}

/* ═══════════════════════════════════ Le rapport ═══════════════════════ */

/** Ce qu'un persona a obtenu de l'index, comparé à ce que la résolution donne. */
export interface CasDePersona {
	readonly persona: string;
	readonly incarnation: string;
	/** Le filtre effectivement envoyé au moteur — `null` : aucune requête. */
	readonly filtre: string | null;
	readonly attendu: number;
	readonly obtenu: number;
	/** Dans l'index et pas dans la référence : une FUITE. */
	readonly fuites: readonly string[];
	/** Dans la référence et pas dans l'index : une PERTE. */
	readonly pertes: readonly string[];
	/** Le nombre de termes essayés, et ce que le filtre a effectivement retenu. */
	readonly termes: number;
	readonly fuitesParTerme: readonly string[];
	/**
	 * Le nombre de termes pour lesquels le périmètre TOTAL rapporte au moins une
	 * note interdite à ce persona. Zéro signifie que l'essai est INERTE pour lui
	 * — le filtre n'avait rien à retenir, et le vert ne prouve rien.
	 */
	readonly termesMordants: number;
	/** Le nombre d'entrées interdites que le filtre a effectivement écartées. */
	readonly ecartees: number;
}

/** Ce qu'une sonde synthétique attendait, et ce qu'elle a obtenu. */
export interface CasDeSonde {
	readonly persona: string;
	readonly attendues: readonly string[];
	readonly obtenues: readonly string[];
	readonly conforme: boolean;
}

/** Ce que l'épreuve rapporte. Des nombres, des cas nommés, et des défauts. */
export interface RapportDEpreuve {
	readonly reindexation: RapportDeReindexation;
	readonly personas: readonly CasDePersona[];
	readonly sondes: readonly CasDeSonde[];
	readonly parametresIgnores: {
		readonly filtreSans: string | null;
		readonly filtreAvec: string | null;
		readonly memeResultat: boolean;
		readonly refus: boolean;
		readonly facetteHonoree: boolean;
	};
	readonly defauts: readonly string[];
}

/* ═══════════════════════════════════ L'épreuve ════════════════════════ */

/**
 * L'ÉPREUVE — sept personas, l'égalité à la résolution, et des sondes qui
 * mordent.
 *
 * ELLE ÉCRIT DANS LA BASE, ET ELLE LA REND PROPRE. Les trois personas de droit
 * exigent un droit explicite, que le corpus ne porte pas ; il est posé sur un
 * dossier racine, puis RETIRÉ, et le rapport dit combien de lignes de droits
 * restent à la fin. La batterie 6 procède exactement ainsi, pour la même raison.
 *
 * ELLE TERMINE PAR UNE RÉINDEXATION. Les entrées de sonde ne vivent que dans
 * l'index ; la reconstruction finale les emporte par construction, plutôt que
 * par un nettoyage qu'un échec en cours de route pourrait sauter.
 */
export async function eprouverLePerimetre(
	base: Base,
	env: EnvironnementDeRecherche
): Promise<RapportDEpreuve> {
	const client = moteurDeRecherche(env);
	const defauts: string[] = [];

	const reindexation = await reindexer(base, client);
	if (reindexation.projetees !== reindexation.indexees) {
		defauts.push(
			`la réindexation projette ${reindexation.projetees} notes et l’index en porte ` +
				`${reindexation.indexees} : la reconstruction n’a pas reconstruit le corpus`
		);
	}

	/* ── Le décor : les comptes, un dossier racine, et les termes d'essai ── */
	const lignesDeCompte = await base
		.select({ id: comptes.id, identifiant: comptes.identifiant, role: comptes.role })
		.from(comptes);
	const parIdentifiant = new Map(lignesDeCompte.map((c) => [c.identifiant, c]));

	const racine = await dossierRacineLePlusPeuple(base);
	if (racine === null) {
		defauts.push('aucun dossier racine dans la base : les droits sont inposables');
	}

	const corpus = await projeterLeCorpus(base);
	const termes = termesDEssai(corpus);

	/* ── Les sept personas ─────────────────────────────────────────────── */
	const personas: CasDePersona[] = [];
	for (const persona of PERSONAS_DINDEX) {
		const identite = await incarner(base, persona, parIdentifiant, racine);
		const reference = await identifiantsLisibles(base, identite);
		const filtre = await filtreDeLIdentite(base, identite);
		const trouvees = await chercherLesNotes(base, client, identite, { requete: '' });

		const obtenues = new Set(trouvees.identifiants);
		const fuites = [...obtenues].filter((id) => !reference.has(id)).sort();
		const pertes = [...reference].filter((id) => !obtenues.has(id)).sort();

		/* L'essai par terme, et sa MORDANCE. Le périmètre total est celui de
		   l'administrateur (`RG-DRO-03`) : ce qu'il rapporte pour un terme est ce
		   que le terme rapporterait SANS filtre de périmètre. Comparer les deux
		   dit, terme par terme, ce que le filtre a effectivement écarté. */
		const fuitesParTerme: string[] = [];
		let termesMordants = 0;
		let ecartees = 0;
		for (const terme of termes) {
			const sous = await chercherLesNotes(base, client, identite, { requete: terme });
			const total = await chercherLesNotes(base, client, ADMINISTRATEUR_DE_SONDE, {
				requete: terme
			});
			const interdites = total.identifiants.filter((id) => !reference.has(id));
			if (interdites.length > 0) {
				termesMordants += 1;
				ecartees += interdites.length;
			}
			for (const id of sous.identifiants) {
				if (!reference.has(id)) fuitesParTerme.push(`${terme} → ${id}`);
			}
		}

		if (fuites.length > 0) {
			defauts.push(
				`[fuite] ${persona.nom} : ${fuites.length} entrée(s) hors périmètre — ${fuites.join(', ')}`
			);
		}
		if (pertes.length > 0) {
			defauts.push(
				`[perte] ${persona.nom} : ${pertes.length} entrée(s) dues et absentes — ${pertes.join(', ')}`
			);
		}
		if (fuitesParTerme.length > 0) {
			defauts.push(`[fuite par terme] ${persona.nom} : ${fuitesParTerme.join(' · ')}`);
		}
		if (termesMordants === 0 && reference.size < corpus.length) {
			defauts.push(
				`[inerte] ${persona.nom} : aucun des ${termes.length} termes ne rapporte une note ` +
					'interdite sous le périmètre total — le vert de ce persona ne prouve rien'
			);
		}

		personas.push({
			persona: persona.nom,
			incarnation: persona.incarnation,
			filtre: filtre.interroger ? filtre.filtre : null,
			attendu: reference.size,
			obtenu: obtenues.size,
			fuites,
			pertes,
			termes: termes.length,
			fuitesParTerme,
			termesMordants,
			ecartees
		});
	}

	/* ── Les paramètres ignorés, jamais refusés — `RG-M02-04` ──────────── */
	const parametres = await eprouverLesParametres(base, client, corpus);
	if (parametres.refus) {
		defauts.push('[RG-M02-04] un paramètre non honoré a été REFUSÉ : le filtre se révèle');
	}
	if (!parametres.memeResultat) {
		defauts.push(
			'[RG-M02-04] `statut=` et `visibilite=` changent la réponse de l’anonyme : ils ne sont pas ignorés'
		);
	}
	if (!parametres.facetteHonoree) {
		defauts.push(
			'[RG-M02-04] aucune facette honorée ne change le filtre — le contrôle des paramètres ' +
				'ignorés est alors inerte : un crible qui laisse TOUT tomber le passerait aussi'
		);
	}

	/* ── Les sondes synthétiques ───────────────────────────────────────── */
	const sondes = await eprouverLesSondes(base, client, parIdentifiant, racine, defauts);

	/* ── La base est rendue propre, puis l'index reconstruit ──────────── */
	await base.delete(droitsDeDossier);
	const restants = await base
		.select({ dossierId: droitsDeDossier.dossierId })
		.from(droitsDeDossier);
	if (restants.length > 0) {
		defauts.push(`[décor] ${restants.length} droit(s) de dossier laissés derrière l’épreuve`);
	}
	await reindexer(base, client);

	return { reindexation, personas, sondes, parametresIgnores: parametres, defauts };
}

/** L'administrateur employé par l'essai comme mesure du périmètre TOTAL. */
const ADMINISTRATEUR_DE_SONDE: Identite = identiteAuthentifiee(
	'00000000-0000-4000-8000-0000000000ad',
	'administrateur'
);

/** Le persona, incarné : une identité, et le droit posé s'il en faut un. */
async function incarner(
	base: Base,
	persona: PersonaDIndex,
	parIdentifiant: ReadonlyMap<string, { id: string; role: string }>,
	racine: string | null
): Promise<Identite> {
	/* Le décor est REMIS À ZÉRO avant chaque persona : une matrice dont les cases
	   se contaminent mesure l'ordre du parcours, pas la propriété (`P-28`). */
	await base.delete(droitsDeDossier);

	if (persona.compte === null) return ANONYME;
	const compte = parIdentifiant.get(persona.compte);
	if (compte === undefined) return ANONYME;

	/* `RG-M14-08` — le compte désactivé n'obtient pas de session, donc pas
	   d'identité authentifiée. Il est mesuré pour ce qu'il est : un anonyme. */
	if (persona.nom === 'compte-desactive') return ANONYME;

	if (persona.droit !== null && racine !== null) {
		await base
			.insert(droitsDeDossier)
			.values({ dossierId: racine, compteId: compte.id, droit: persona.droit });
	}
	return identiteAuthentifiee(compte.id, compte.role as RoleDeCompte);
}

/**
 * LE DOSSIER RACINE LE PLUS PEUPLÉ — celui dont le sous-arbre porte le plus de
 * notes.
 *
 * Poser le droit du gabarit sur une racine vide rendrait un périmètre vide, et
 * l'épreuve serait verte sans rien exercer : c'est `P-5`. Le choix est donc
 * MESURÉ, jamais nommé en dur.
 */
async function dossierRacineLePlusPeuple(base: Base): Promise<string | null> {
	const arbre = await base.select({ id: dossiers.id, parentId: dossiers.parentId }).from(dossiers);
	if (arbre.length === 0) return null;
	const index = indexerLesDroits(arbre);
	const corpus = await projeterLeCorpus(base);

	const parRacine = new Map<string, number>();
	for (const dossier of arbre) {
		if (dossier.parentId === null) parRacine.set(dossier.id, 0);
	}
	for (const note of corpus) {
		for (const ancetre of chaineDAncetres(index, note.dossier)) {
			const deja = parRacine.get(ancetre);
			if (deja !== undefined) parRacine.set(ancetre, deja + 1);
		}
	}
	let meilleur: string | null = null;
	let compte = -1;
	for (const [id, n] of [...parRacine].sort((a, b) => a[0].localeCompare(b[0]))) {
		if (n > compte) {
			meilleur = id;
			compte = n;
		}
	}
	return meilleur;
}

/**
 * LES TERMES D'ESSAI — tirés des titres du corpus, jamais inventés.
 *
 * « Quel que soit le terme » ne s'éprouve pas en énumérant tous les mots de la
 * langue. Ce qui compte est que les termes essayés SOIENT CEUX QUI ATTEINDRAIENT
 * les notes interdites : ils sont donc pris dans les titres des notes du corpus,
 * un par note au moins, et le rapport dit combien d'entre eux rapportent
 * effectivement une note interdite sous le périmètre total.
 */
export function termesDEssai(corpus: readonly NoteIndexee[]): readonly string[] {
	const termes = new Set<string>();
	for (const note of corpus) {
		for (const mot of note.titre.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
			if (mot.length >= 4) termes.add(mot);
		}
	}
	return [...termes].sort();
}

/**
 * `RG-M02-04` — EN ANONYME, `statut=` ET `visibilite=` SONT IGNORÉS, JAMAIS
 * REFUSÉS.
 *
 * Trois mesures, et la troisième est celle qui empêche le contrôle d'être vide :
 *
 *   1. le filtre envoyé au moteur est le MÊME avec et sans ces paramètres —
 *      ignorer, c'est ne pas pouvoir s'en servir, pas seulement s'en abstenir ;
 *   2. aucun refus n'est levé : la commande n'attrape rien, et l'absence
 *      d'exception est constatée plutôt que supposée ;
 *   3. un paramètre HONORÉ — `domaine=` — change bien le filtre. Sans cette
 *      mesure, un crible qui laisserait tout tomber passerait le contrôle.
 */
async function eprouverLesParametres(
	base: Base,
	client: Meilisearch,
	corpus: readonly NoteIndexee[]
): Promise<RapportDEpreuve['parametresIgnores']> {
	const sans = parametresHonores(new URLSearchParams('q=note'), false);
	const avec = parametresHonores(
		new URLSearchParams('q=note&statut=Brouillon&visibilite=Interne&statut=Publiee'),
		false
	);
	let refus = false;
	let memeResultat = false;
	let filtreSans: string | null = null;
	let filtreAvec: string | null = null;
	try {
		const a = await chercherLesNotes(base, client, ANONYME, { requete: 'note', facettes: sans });
		const b = await chercherLesNotes(base, client, ANONYME, { requete: 'note', facettes: avec });
		filtreSans = a.filtre;
		filtreAvec = b.filtre;
		memeResultat =
			a.filtre === b.filtre &&
			a.identifiants.length === b.identifiants.length &&
			a.identifiants.every((id, i) => b.identifiants[i] === id);
	} catch {
		refus = true;
	}

	/* Le contrôle positif : une facette HONORÉE doit peser sur le filtre. Le
	   domaine est pris dans le corpus, jamais nommé en dur. */
	const domaine = corpus.find(
		(n) => n.visibilite === 'publique' && n.statut === 'publiee'
	)?.domaine;
	let facetteHonoree = false;
	if (domaine !== undefined) {
		const honore = await chercherLesNotes(base, client, ANONYME, {
			requete: '',
			facettes: parametresHonores(
				new URLSearchParams(`domaine=${encodeURIComponent(domaine)}`),
				false
			)
		});
		facetteHonoree = honore.filtre !== filtreSans;
	}

	return { filtreSans, filtreAvec, memeResultat, refus, facetteHonoree };
}

/**
 * LES SONDES SYNTHÉTIQUES — six entrées que le corpus ne porte pas.
 *
 * Chacune isole UNE règle, et chaque groupe porte son contrôle positif :
 *
 *   `pub-pub`         publique ET publiée      → l'anonyme la voit
 *   `pub-bro`         publique, BROUILLON      → l'anonyme ne la voit pas
 *   `int-pub`         INTERNE, publiée         → l'anonyme ne la voit pas
 *   `droit-oui`       dans le dossier où le droit est posé → l'ayant droit la voit
 *   `droit-non`       dans un dossier sans droit → l'ayant droit ne la voit pas
 *   `sans-perimetre`  aucun dossier            → PERSONNE ne la voit, administrateur
 *                     compris (`ADR-006` : « un document indexé sans périmètre est
 *                     un document public » — le filtre total exige un dossier)
 *
 * La dernière est construite en forçant le type, et c'est délibéré : le produit
 * ne peut pas fabriquer une entrée sans périmètre — `projeterLeCorpus()` refuse,
 * et le type l'interdit —, mais le filtre doit tenir même si une entrée d'une
 * autre origine s'y trouvait. Une garde qu'aucun cas n'exerce est une garde
 * qu'on espère.
 */
async function eprouverLesSondes(
	base: Base,
	client: Meilisearch,
	parIdentifiant: ReadonlyMap<string, { id: string; role: string }>,
	racine: string | null,
	defauts: string[]
): Promise<readonly CasDeSonde[]> {
	if (racine === null) return [];

	const entrees: NoteIndexee[] = [
		entreeDeSonde('epr-pub-pub', 'publique', 'publiee', DOSSIER_DE_SONDE),
		entreeDeSonde('epr-pub-bro', 'publique', 'brouillon', DOSSIER_DE_SONDE),
		entreeDeSonde('epr-int-pub', 'interne', 'publiee', DOSSIER_DE_SONDE),
		entreeDeSonde('epr-droit-oui', 'interne', 'publiee', racine),
		entreeDeSonde('epr-droit-non', 'interne', 'publiee', AUTRE_DOSSIER_DE_SONDE)
	];
	const sansPerimetre = { ...entreeDeSonde('epr-sans-perimetre', 'interne', 'publiee', '') };
	const forcee = sansPerimetre as unknown as Record<string, unknown>;
	delete forcee['dossier'];
	delete forcee['ancetres'];
	/* `attendre` — `ARB-060` point 1 : l'attente est CONSERVÉE partout où la
	   latence ne coûte rien, et une épreuve de périmètre qui interrogerait
	   l'index avant que ses entrées de sonde y soient rendrait « aucune fuite »
	   sur un index vide. Ce serait un vert sur un chemin non emprunté. */
	await indexerDesNotes(client, [...entrees, sansPerimetre], 'attendre');

	const cas: CasDeSonde[] = [];
	try {
		/* L'anonyme : la publique ET publiée, et elle seule. */
		cas.push(await mesurerUneSonde(base, client, 'anonyme', ANONYME, ['epr-pub-pub'], defauts));

		/* L'ayant droit : ce qui est dans le dossier de son droit, et rien d'autre.
		   Les entrées de sonde ne sont pas dans la base, donc la référence de
		   `resolution.ts` ne les connaît pas : c'est bien le FILTRE qui décide, et
		   c'est ce que cette sonde isole. */
		const marc = parIdentifiant.get('marc.ferreira');
		if (marc !== undefined) {
			await base.delete(droitsDeDossier);
			await base
				.insert(droitsDeDossier)
				.values({ dossierId: racine, compteId: marc.id, droit: 'lecteur' });
			cas.push(
				await mesurerUneSonde(
					base,
					client,
					'lecteur',
					identiteAuthentifiee(marc.id, 'contributeur'),
					['epr-droit-oui'],
					defauts
				)
			);
			await base.delete(droitsDeDossier);
			cas.push(
				await mesurerUneSonde(
					base,
					client,
					'contributeur-sans-droit',
					identiteAuthentifiee(marc.id, 'contributeur'),
					[],
					defauts
				)
			);
		}

		/* L'administrateur : tout, SAUF l'entrée sans périmètre. */
		cas.push(
			await mesurerUneSonde(
				base,
				client,
				'administrateur',
				ADMINISTRATEUR_DE_SONDE,
				['epr-droit-non', 'epr-droit-oui', 'epr-int-pub', 'epr-pub-bro', 'epr-pub-pub'],
				defauts
			)
		);
	} finally {
		/* `attendre` de nouveau : le retrait des sondes doit être ACQUIS quand la
		   commande rend, sinon six entrées étrangères au corpus survivraient à
		   l'épreuve dans l'index d'exploitation. */
		await retirerDesNotes(client, [...entrees.map((e) => e.id), 'epr-sans-perimetre'], 'attendre');
	}
	return cas;
}

/** Une sonde : ce que le terme de sonde rapporte à ce persona, et rien d'autre. */
async function mesurerUneSonde(
	base: Base,
	client: Meilisearch,
	persona: string,
	identite: Identite,
	attendues: readonly string[],
	defauts: string[]
): Promise<CasDeSonde> {
	const trouvees = await chercherLesNotes(base, client, identite, { requete: TERME_DE_SONDE });
	const obtenues = [...trouvees.identifiants].sort();
	const conforme =
		obtenues.length === attendues.length && obtenues.every((id, i) => attendues[i] === id);
	if (!conforme) {
		defauts.push(
			`[sonde] ${persona} : attendu ${attendues.length === 0 ? 'aucune entrée' : attendues.join(', ')}, ` +
				`obtenu ${obtenues.length === 0 ? 'aucune entrée' : obtenues.join(', ')}`
		);
	}
	return { persona, attendues, obtenues, conforme };
}
