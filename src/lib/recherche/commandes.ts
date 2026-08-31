/**
 * Les commandes de l'index — réindexer, lire son état, l'éprouver. Elles vivent en TypeScript
 * parce que `pnpm check` les contrôle ; le lanceur ne fait que charger, appeler et imprimer.
 *
 *   `reindexer`  l'index est reconstruit DEPUIS LA BASE, avec les deux nombres — projetées,
 *                indexées. Il ne prouve rien de l'autorisation.
 *   `etat`       ce que l'index porte RÉELLEMENT, mesuré sur le moteur.
 *   `epreuve`    qu'AUCUNE entrée interdite ne sort de l'index, pour les sept personas.
 *
 * L'ÉPREUVE COMPARE À `resolution.ts` PLUTÔT QU'À UNE LISTE ATTENDUE : une liste écrite à la
 * main serait une seconde définition du droit. Elle exige l'ÉGALITÉ des deux ensembles, pas
 * l'inclusion — une entrée en trop est une FUITE, une entrée manquante une PERTE.
 *
 * LES SONDES SONT SYNTHÉTIQUES (`P-26`) : le corpus livré ne porte aucune note publique en
 * brouillon ni aucun droit explicite de dossier. L'épreuve les FABRIQUE, et porte ses
 * CONTRÔLES POSITIFS avec elle — sans eux, un filtre qui ne rendrait jamais rien passerait.
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

export async function reindexerLeCorpus(
	base: Base,
	env: EnvironnementDeRecherche
): Promise<RapportDeReindexation> {
	return await reindexer(base, moteurDeRecherche(env));
}

/**
 * Les sept personas — ceux du plan §5, plus le compte désactivé. L'attribution des comptes est
 * reprise à l'identique de la batterie 6 : deux tables de personas divergeraient.
 *
 * LES TROIS PERSONAS DE DROIT SONT UN GABARIT : le corpus ne porte aucun droit explicite de
 * dossier, ils sont donc posés sur le même compte, le droit étant réécrit entre les passes. LE
 * COMPTE DÉSACTIVÉ N'EST PAS UNE IDENTITÉ AUTHENTIFIÉE : `RG-M14-08` s'applique à
 * l'établissement de session, pas à la résolution des droits — il est mesuré ANONYME.
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

/**
 * Le dossier d'une sonde — un identifiant qui n'est dans aucune arborescence, donc
 * dans aucun périmètre authentifié : une sonde qui le porte ne peut sortir que par
 * le filtre anonyme ou par le filtre total.
 */
const DOSSIER_DE_SONDE = '00000000-0000-4000-8000-000000000051';
const AUTRE_DOSSIER_DE_SONDE = '00000000-0000-4000-8000-000000000052';

/** Le terme qui n'appartient qu'aux sondes — il n'est dans aucun titre du corpus. */
export const TERME_DE_SONDE = 'sondeperimetret051';

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

export interface CasDePersona {
	readonly persona: string;
	readonly incarnation: string;
	/** Le filtre effectivement envoyé au moteur — `null` : aucune requête. */
	readonly filtre: string | null;
	readonly attendu: number;
	readonly obtenu: number;
	readonly fuites: readonly string[];
	readonly pertes: readonly string[];
	readonly termes: number;
	readonly fuitesParTerme: readonly string[];
	/**
	 * Le nombre de termes pour lesquels le périmètre TOTAL rapporte au moins une note
	 * interdite à ce persona. Zéro signifie que l'essai est INERTE pour lui.
	 */
	readonly termesMordants: number;
	readonly ecartees: number;
}

export interface CasDeSonde {
	readonly persona: string;
	readonly attendues: readonly string[];
	readonly obtenues: readonly string[];
	readonly conforme: boolean;
}

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

/**
 * L'épreuve — sept personas, l'égalité à la résolution, et des sondes qui mordent. ELLE ÉCRIT
 * DANS LA BASE, ET ELLE LA REND PROPRE : le droit exigé est posé sur un dossier racine puis
 * RETIRÉ, et le rapport dit combien de lignes restent. ELLE TERMINE PAR UNE RÉINDEXATION : les
 * entrées de sonde ne vivent que dans l'index, et la reconstruction les emporte par
 * construction plutôt que par un nettoyage qu'un échec pourrait sauter.
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

		/* L'essai par terme, et sa MORDANCE : ce que l'administrateur rapporte pour un
		   terme est ce que le terme rapporterait SANS filtre. Comparer les deux dit,
		   terme par terme, ce que le filtre a écarté. */
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
 * Le dossier racine le plus peuplé. Poser le droit du gabarit sur une racine vide
 * rendrait un périmètre vide, et l'épreuve serait verte sans rien exercer : le choix
 * est MESURÉ, jamais nommé en dur.
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
 * Les termes d'essai — tirés des titres du corpus, jamais inventés. Ce qui compte est
 * qu'ils SOIENT CEUX QUI ATTEINDRAIENT les notes interdites, et le rapport dit
 * combien rapportent effectivement une note interdite sous le périmètre total.
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
 * `RG-M02-04` — en anonyme, `statut=` et `visibilite=` sont IGNORÉS, jamais refusés.
 * Trois mesures, et la troisième empêche le contrôle d'être vide : le filtre envoyé
 * est le MÊME avec et sans ces paramètres ; aucun refus n'est levé ; et un paramètre
 * HONORÉ change bien le filtre — sans quoi un crible qui laisserait tout tomber
 * passerait le contrôle.
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
 * Les sondes synthétiques — six entrées que le corpus ne porte pas. Chacune isole UNE règle,
 * et chaque groupe porte son contrôle positif : publique et publiée, publique en brouillon et
 * interne publiée, dans le dossier du droit et hors de lui, et une entrée SANS PÉRIMÈTRE que
 * personne ne voit. La dernière est construite en forçant le type, et c'est délibéré : le
 * produit ne peut pas fabriquer une entrée sans périmètre, mais le filtre doit tenir.
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
	/* `attendre` (`ARB-060` point 1) : une épreuve de périmètre qui interrogerait
	   l'index avant que ses sondes y soient rendrait « aucune fuite » sur un index
	   vide. */
	await indexerDesNotes(client, [...entrees, sansPerimetre], 'attendre');

	const cas: CasDeSonde[] = [];
	try {
		/* L'anonyme : la publique ET publiée, et elle seule. */
		cas.push(await mesurerUneSonde(base, client, 'anonyme', ANONYME, ['epr-pub-pub'], defauts));

		/* L'ayant droit : ce qui est dans le dossier de son droit. Les entrées de sonde
		   ne sont pas dans la base, donc la référence ne les connaît pas — c'est bien
		   le FILTRE qui décide. */
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
		/* `attendre` de nouveau : le retrait doit être ACQUIS quand la commande rend,
		   sinon six entrées étrangères survivraient dans l'index d'exploitation. */
		await retirerDesNotes(client, [...entrees.map((e) => e.id), 'epr-sans-perimetre'], 'attendre');
	}
	return cas;
}

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
