/**
 * T-044 — LES HUIT CONSOLES REÇOIVENT LEURS DONNÉES EN PROPRIÉTÉ.
 *
 * CE QUE CE FICHIER PROUVE, ET RIEN D'AUTRE. Pour chacune des huit vues de
 * console, deux choses, et ce sont exactement les deux du contrat :
 *   1. PROPRIÉTÉ ABSENTE — le défaut s'applique, et c'est la constante du jeu
 *      de semence. C'est ce défaut qui garantit que le banc ne bouge pas : le
 *      mode de conception ne passe rien de nouveau.
 *   2. PROPRIÉTÉ FOURNIE — elle l'emporte, et le rendu change là où la vue lit
 *      cette source.
 *
 * POURQUOI CE FICHIER MONTE UN SERVEUR VITE. Le harnais unitaire du dépôt est
 * autonome et ne connaît pas les composants Svelte : `vitest.config.ts` le dit
 * en toutes lettres — « le harnais de composants Svelte viendra avec les lots
 * qui en écrivent ». Plutôt que d'amender une configuration partagée par les
 * lots parallèles de la vague, ce fichier emprunte le MÊME chemin que le banc
 * de comparaison : `ssrLoadModule` du graphe SSR de Vite, puis `render()` de
 * `svelte/server` pris DANS ce graphe. C'est la parade d'ECART-013 É-1, et
 * elle vaut ici pour la même raison : un rendu obtenu hors de `render()` ne
 * prouve rien sur le rendu réel. Coût mesuré : moins de deux secondes.
 *
 * CE QU'IL NE PROUVE PAS. `univers` est INERTE sur les sept vues de forme
 * abrégée, et `domaines` l'est sur quatre d'entre elles. Ce n'est pas un
 * défaut de câblage : `src/lib/coquille/Coquille.svelte` l'écrit à sa
 * propriété `forme` — « en forme abrégée, `univers`, `domaines`, `notes` et
 * `brancheEnChargement` ne servent PAS au rail : il ne se dérive pas du
 * corpus ». Les vues concernées passaient déjà les constantes tout aussi
 * inertement. L'inertie est donc CONSTATÉE ici, jamais contournée : le contrôle
 * dit « fournir cette source ne change rien à ce rendu », ce qui est une
 * propriété du gel et non un vert de complaisance (P-5).
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
	COMPTES,
	CONFIG,
	DATE_REFERENCE,
	DETAIL_DOMAINES,
	DOMAINES,
	MODULES,
	TEMPLATES,
	TYPES_FICHE,
	TYPES_RELATION,
	UNIVERS,
	type Compte,
	type Configuration,
	type Domaine,
	type EtatDInstance,
	type Note,
	type Relation,
	type Univers,
	type UtilisateurCourant
} from '../../seeds/corpus';
import { nomDArchive } from '../lib/export/archive';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let serveur: ViteDevServer;
let rendreComposant: (composant: unknown, options: { props: object }) => { body: string };
let corpusPourVue: (vue: string) => readonly Note[];

beforeAll(async () => {
	serveur = await createServer({
		configFile: join(racine, 'vite.config.ts'),
		root: racine,
		// LE SURVEILLANT NE DOIT PAS DESCENDRE DANS .claude/worktrees/ NI DANS build/.
		// Il parcourt toute la racine ; sous .claude/worktrees/ vivent des copies
		// complètes du dépôt, et les veilleurs du système s'épuisent : la série sort
		// en ENOSPC, ses tests verts compris. Le surveillant attend un prédicat, pas
		// un motif : les jokers y sont inertes, et `watch: null` ne l'éteint pas —
		// il ne fait que lui retirer ce filtre.
		server: {
			middlewareMode: true,
			watch: {
				ignored: (chemin: string) => chemin.includes('/.claude') || chemin.includes('/build/')
			}
		},
		appType: 'custom',
		logLevel: 'error'
	});
	rendreComposant = (await serveur.ssrLoadModule('svelte/server')).render;
	corpusPourVue = (await serveur.ssrLoadModule('/seeds/corpus.ts')).corpusPourVue;
}, 120_000);

afterAll(async () => {
	await serveur?.close();
});

/** Le corps rendu d'une vue, par le graphe SSR de Vite — jamais autrement. */
async function rendre(
	vue: string,
	proprietes: object = {},
	vecteur: Record<string, string | boolean> | null = null
): Promise<string> {
	const module = await serveur.ssrLoadModule(`/src/vues/${vue}.svelte`);
	return rendreComposant(module.default, {
		props: { vecteur, notes: corpusPourVue(vue), ...proprietes }
	}).body;
}

/* ── Les quatre sources de remplacement, toutes distinctes du jeu ────────── */

const AUTRE_COMPTE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};
const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9-epreuve', synchro: 'a l instant' };
/** Un seul univers, « Projets » : « Production » et sa description disparaissent. */
const AUTRES_UNIVERS: readonly Univers[] = [UNIVERS[1] as Univers];
/** Un seul domaine, « Migration 2026 » : les trois autres disparaissent. */
const AUTRES_DOMAINES: readonly Domaine[] = [DOMAINES[3] as Domaine];

const LES_QUATRE = {
	univers: AUTRES_UNIVERS,
	domaines: AUTRES_DOMAINES,
	compte: AUTRE_COMPTE,
	instance: AUTRE_INSTANCE
};

/** Le pied du rail, rendu par les deux formes de coquille. */
const VERSION_DU_JEU = 'Codicillus 1.0.0';
const VERSION_FOURNIE = 'Codicillus 9.9.9-epreuve';
/** Le titre de l'avatar de la barre, rendu par les deux formes de coquille. */
const COMPTE_DU_JEU = 'Karim Belhadj — menu utilisateur';
const COMPTE_FOURNI = 'Sophie Nguyen — menu utilisateur';

/** Les deux constats communs aux huit vues : la coquille lit bien les sources. */
function coquilleDuJeu(rendu: string): void {
	expect(rendu).toContain(VERSION_DU_JEU);
	expect(rendu).toContain(COMPTE_DU_JEU);
	expect(rendu).not.toContain(VERSION_FOURNIE);
	expect(rendu).not.toContain(COMPTE_FOURNI);
}
function coquilleFournie(rendu: string): void {
	expect(rendu).toContain(VERSION_FOURNIE);
	expect(rendu).toContain(COMPTE_FOURNI);
	expect(rendu).not.toContain(VERSION_DU_JEU);
	expect(rendu).not.toContain(COMPTE_DU_JEU);
}

/**
 * Le nombre d'occurrences d'un texte dans un rendu.
 *
 * NÉCESSAIRE, ET LA RAISON EST DANS LE GEL. Le rail de la forme ABRÉGÉE porte
 * une arborescence de quinze nœuds ÉCRITE AU BALISAGE — `arborescence-abregee.ts`
 * —, que le corpus ne peut pas produire. Le nom d'un domaine y figure donc même
 * quand la table des domaines ne le porte plus : une simple absence ne se
 * mesure pas, un DÉCOMPTE si.
 */
function occurrences(rendu: string, texte: string): number {
	return rendu.split(texte).length - 1;
}

/* ══════════════════════════════════════════════════════════════════════════ */

describe('V-27 — Univers', () => {
	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-27');
		coquilleDuJeu(rendu);
		// `univers` : la description de « Production », que seule cette table porte.
		expect(rendu).toContain("Ce qui tourne aujourd'hui");
		// `domaines` : le rail de la forme complète les nomme.
		expect(rendu).toContain('Poste de travail');
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-27', LES_QUATRE);
		coquilleFournie(rendu);
		expect(rendu).not.toContain("Ce qui tourne aujourd'hui");
		expect(rendu).not.toContain('Poste de travail');
		expect(rendu).toContain('Migration 2026');
	});
});

describe('V-28 — Domaines', () => {
	const AUTRES_MODULES = { ...MODULES, notes: { nom: 'Carnets', sous: 'Épreuve T-044' } };
	const AUTRES_DETAILS = {
		...DETAIL_DOMAINES,
		Infrastructure: {
			...DETAIL_DOMAINES.Infrastructure,
			description: 'Description dépose par l’épreuve T-044.'
		}
	};

	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-28');
		coquilleDuJeu(rendu);
		expect(rendu).toContain(DETAIL_DOMAINES.Applications?.description ?? '');
		expect(rendu).toContain(MODULES.notes.nom);
		expect(rendu).not.toContain('Carnets');
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-28', {
			...LES_QUATRE,
			modules: AUTRES_MODULES,
			detailDomaines: AUTRES_DETAILS
		});
		coquilleFournie(rendu);
		// `domaines` : le tableau ne porte plus que « Migration 2026 » et le
		// domaine littéral du gel ; la description d'« Applications » a disparu.
		expect(rendu).not.toContain(DETAIL_DOMAINES.Applications?.description ?? '');
		expect(rendu).toContain(DETAIL_DOMAINES['Migration 2026']?.description ?? '');
		// `modules` : le nom du module vient de la table fournie.
		expect(rendu).toContain('Carnets');
	});

	test('`univers` fournie, la couleur de l’univers suit', async () => {
		const duJeu = await rendre('V-28');
		const sansUnivers = await rendre('V-28', { univers: [] });
		expect(sansUnivers).not.toBe(duJeu);
	});
});

describe('V-29 — Types de fiche', () => {
	/* L'ÉTAT PAR DÉFAUT NE REND QUE LE NOMBRE de propriétés d'un type ; leurs
	   libellés n'apparaissent qu'au panneau d'édition, qui porte sur « Serveur ».
	   L'épreuve emploie donc le vecteur d'édition du scénario de la vue. */
	const EDITION = { form: 'edition', sup: 'refus' };
	const AUTRES_TYPES = {
		...TYPES_FICHE,
		Serveur: [{ cle: 'epreuve', nom: 'Champ de l’épreuve T-044', type: 'texte' as const }]
	};

	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-29', {}, EDITION);
		coquilleDuJeu(rendu);
		expect(rendu).toContain(TYPES_FICHE.Serveur[0]!.nom);
		expect(rendu).not.toContain('Champ de l’épreuve T-044');
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-29', { ...LES_QUATRE, typesFiche: AUTRES_TYPES }, EDITION);
		coquilleFournie(rendu);
		expect(rendu).toContain('Champ de l’épreuve T-044');
		expect(rendu).not.toContain(TYPES_FICHE.Serveur[0]!.nom);
	});
});

describe('V-30 — Types de relation', () => {
	const AUTRES_TYPES = {
		...TYPES_RELATION,
		heberge: { sortant: 'porte l’épreuve', entrant: 'est porté par l’épreuve' }
	};
	const AUCUNE_RELATION: readonly Relation[] = [];

	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-30');
		coquilleDuJeu(rendu);
		expect(rendu).toContain(TYPES_RELATION.heberge.sortant);
		expect(rendu).not.toContain('porte l’épreuve');
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-30', {
			...LES_QUATRE,
			typesRelation: AUTRES_TYPES,
			relations: AUCUNE_RELATION
		});
		coquilleFournie(rendu);
		expect(rendu).toContain('porte l’épreuve');
		// `relations` : l'usage est compté, jamais écrit — sans relation, il tombe.
		const duJeu = await rendre('V-30');
		expect(rendu).not.toBe(duJeu);
	});
});

describe('V-31 — Squelettes', () => {
	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-31');
		coquilleDuJeu(rendu);
		for (const t of TEMPLATES) expect(rendu).toContain(t.nom);
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-31', { ...LES_QUATRE, templates: [TEMPLATES[0]!] });
		coquilleFournie(rendu);
		expect(rendu).toContain(TEMPLATES[0]!.nom);
		expect(rendu).not.toContain(TEMPLATES[1]!.nom);
	});
});

describe('V-32 — Comptes', () => {
	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-32');
		coquilleDuJeu(rendu);
		for (const c of COMPTES) expect(rendu).toContain(c.identifiant);
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-32', { ...LES_QUATRE, comptes: [COMPTES[0] as Compte] });
		coquilleFournie(rendu);
		expect(rendu).toContain(COMPTES[0]!.identifiant);
		expect(rendu).not.toContain(COMPTES[1]!.identifiant);
	});

	test('`domaines` fournie, le sélecteur du panneau la suit', async () => {
		const ouvert = { form: 'creation', 'c-mdp': false, 'c-des': false };
		const duJeu = await rendre('V-32', {}, ouvert);
		const fourni = await rendre('V-32', { domaines: AUTRES_DOMAINES }, ouvert);
		const sansDomaine = await rendre('V-32', { domaines: [] }, ouvert);
		const plancher = occurrences(sansDomaine, 'Poste de travail');
		expect(occurrences(duJeu, 'Poste de travail')).toBeGreaterThan(plancher);
		expect(occurrences(fourni, 'Poste de travail')).toBe(plancher);
	});
});

describe('V-33 — Configuration', () => {
	const AUTRE_CONFIG: Configuration = {
		...CONFIG,
		portailAssistance: 'https://epreuve.t044.invalid/assistance',
		versionsMax: 7
	};

	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-33');
		coquilleDuJeu(rendu);
		expect(rendu).toContain(CONFIG.portailAssistance);
		expect(rendu).not.toContain('epreuve.t044.invalid');
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-33', { ...LES_QUATRE, config: AUTRE_CONFIG });
		coquilleFournie(rendu);
		expect(rendu).toContain('epreuve.t044.invalid');
		expect(rendu).not.toContain(CONFIG.portailAssistance);
	});
});

describe('V-34 — Analytique', () => {
	test('absente, le défaut du jeu de semence s’applique', async () => {
		const rendu = await rendre('V-34');
		const plancher = await rendre('V-34', { domaines: [] });
		coquilleDuJeu(rendu);
		// `domaines` : la santé documentaire est rendue domaine par domaine.
		expect(occurrences(rendu, 'Poste de travail')).toBeGreaterThan(
			occurrences(plancher, 'Poste de travail')
		);
	});

	test('fournie, la propriété l’emporte', async () => {
		const rendu = await rendre('V-34', LES_QUATRE);
		const plancher = await rendre('V-34', { domaines: [] });
		coquilleFournie(rendu);
		expect(occurrences(rendu, 'Poste de travail')).toBe(occurrences(plancher, 'Poste de travail'));
		expect(occurrences(rendu, 'Migration 2026')).toBeGreaterThan(
			occurrences(plancher, 'Migration 2026')
		);
	});

	/*
	 * LES CINQ TABLES DE MESURE. Elles sont typées PARTIELLES, et c'est la seule
	 * façon qu'un chargeur ait le droit de n'en passer aucune ligne : le rendu
	 * tombe alors à zéro consultation, ce qui est un état neutre EXPLICITE et non
	 * une valeur fabriquée (P-02). L'épreuve passe la table vide, parce que c'est
	 * le cas qu'un chargeur rencontrera d'abord.
	 */
	test('les tables de mesure fournies l’emportent', async () => {
		const duJeu = await rendre('V-34');
		const vide = await rendre('V-34', {
			mesures7j: {},
			mesures7jPrec: {},
			modifications: {},
			revisions: [],
			recherches: []
		});
		expect(vide).not.toBe(duJeu);
		// `mesures7j` alimente le décompte de consultations sur sept jours.
		expect(duJeu).toContain('vues / 7 j');
		expect(occurrences(vide, '0 vues / 7 j')).toBeGreaterThan(occurrences(duJeu, '0 vues / 7 j'));
	});
});

describe('V-36 — Exports', () => {
	/**
	 * LE NOM D'ARCHIVE ANNONCÉ EST CELUI QUE L'UTILISATEUR OBTIENDRA.
	 *
	 * LE NOM ATTENDU N'EST PAS ÉCRIT ICI, ET C'EST TOUT LE CONTRÔLE : il est
	 * PRODUIT par `nomDArchive()`, la fabrique que le point de téléchargement
	 * appelle pour nommer le fichier. Un cas qui recopierait la forme du nom
	 * pourrait rester vert pendant que la fabrique en produit une autre —
	 * exactement la faute que ce lot répare, la vue ayant longtemps composé le
	 * nom de son côté avec la date à laquelle le jeu de semence est figé.
	 */
	test('le nom d’archive annoncé est celui que la fabrique produira', async () => {
		const duJeu = await rendre('V-36');
		expect(duJeu).toContain('infrastructure-2026-08-13.zip');

		const attendu = nomDArchive('infra-prod', '2027-01-09T10:12:00.000Z');
		const rendu = await rendre('V-36', { nomsDArchive: { Infrastructure: attendu } });
		expect(rendu).toContain(attendu);
		expect(rendu).not.toContain('infrastructure-2026-08-13.zip');
	});

	/**
	 * UNE INSTANCE NEUVE N'A AUCUN DOMAINE, ET C'EST LE CHEMIN QUI COMPTE.
	 *
	 * Le produit commence VIDE : la liste servie est alors vide, aucun domaine
	 * n'est choisi, et la vue composait `-{date de semence}.zip` sur un nom de
	 * domaine vide — la date à laquelle le jeu de semence est figé, servie par le
	 * produit sur le premier écran d'export d'une installation réelle. Sans
	 * domaine il n'y a rien à nommer : l'arborescence d'archive n'est pas rendue.
	 */
	test('une instance sans aucun domaine n’annonce aucun nom d’archive', async () => {
		const neuve = await rendre('V-36', { domaines: [], notes: [], nomsDArchive: {} });
		expect(neuve).not.toContain(DATE_REFERENCE);
		expect(neuve).not.toContain('.zip');
		expect(neuve).not.toContain('arbo-archive');
	});
});

/* ══════════════════════════════════════════════════════════════════════════
   CE QUE L'INERTIE VAUT, ET POURQUOI ELLE EST ÉCRITE ICI

   `univers` ne change RIEN au rendu des sept vues de forme abrégée : le rail
   abrégé ne se dérive pas du corpus. Le constater est le seul énoncé honnête
   possible — l'affirmer sans le mesurer serait exactement la faute que P-21
   décrit. Si un lot ultérieur fait servir `univers` au rail abrégé, ce
   contrôle rougira, et ce sera la bonne nouvelle.
   ══════════════════════════════════════════════════════════════════════════ */
describe('l’inertie constatée de `univers` en forme abrégée', () => {
	for (const vue of ['V-29', 'V-30', 'V-31', 'V-32', 'V-33', 'V-34']) {
		test(`${vue} — fournir « univers » ne change pas le rendu`, async () => {
			const duJeu = await rendre(vue);
			const fourni = await rendre(vue, { univers: AUTRES_UNIVERS });
			expect(fourni).toBe(duJeu);
		});
	}
});
