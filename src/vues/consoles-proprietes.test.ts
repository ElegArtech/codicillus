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
	MOI,
	RELATIONS,
	RELATIONS_TECHNIQUES,
	TEMPLATES,
	TYPES_FICHE,
	TYPES_NOTE,
	TYPES_RELATION,
	UNIVERS,
	type Compte,
	type Configuration,
	type Domaine,
	type EtatDInstance,
	type Note,
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

/* ══════════════════════════════════════════════════════════════════════════
   LES SIX REGISTRES DE CONSOLE — CE QUI EST SERVI EST TOUT CE QUI EST RENDU

   LE CONTRAT A CHANGÉ, ET CES CONTRÔLES DISENT LE NOUVEAU. Les propriétés de
   données de V-27 à V-32 étaient FACULTATIVES, et leur défaut était la
   constante du jeu de démonstration : une route qui en oubliait une servait le
   jeu, sur l'écran d'administration d'une instance réelle, SANS QUE RIEN NE
   PROTESTE — aucun compilateur ne le voyait, aucun contrôle ne le voyait.

   Elles sont désormais REQUISES, et c'est `svelte-check` qui tient la porte :
   la route qui en oublierait une NE COMPILE PLUS. Ce que ces contrôles mesurent
   est l'autre moitié, celle qu'aucun type ne peut dire — SERVIS VIDES, les six
   écrans ne montrent RIEN du corpus de démonstration.

   `coquilleDuJeu()` NE S'APPLIQUE PLUS À CES SIX VUES, et pour la même raison :
   elles passaient `instance.version` au pied du rail, le `1.0.0` d'`INSTANCE`.
   La version vient du contexte de coquille, que le gabarit racine pose depuis
   `package.json` ; hors gabarit, le pied ne nomme plus rien.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * LE COMPTE D'UNE INSTANCE NEUVE — personne du jeu de démonstration.
 *
 * L'ASSERTION EST NÉCESSAIRE, ET ELLE DIT QUELQUE CHOSE. `UtilisateurCourant`
 * du jeu déclare `nom: NomDAuteur` et `domaine: NomDeDomaine`, deux UNIONS DE
 * LITTÉRAUX : les trois auteurs et les quatre domaines de la démonstration.
 * Aucune instance réelle ne les respecte — les routes servent le compte connecté
 * —, et un compte neuf ne peut donc pas s'écrire sans sortir de ces unions.
 */
const COMPTE_NEUF = {
	prenom: 'Ada',
	nom: 'Ada Vasseur',
	initiales: 'AV',
	domaine: '',
	role: 'Administrateur'
} as unknown as UtilisateurCourant;

/** Ce que les six routes servent toutes — le socle désormais REQUIS. */
const SOCLE = { univers: UNIVERS, domaines: DOMAINES, compte: MOI };
/** Le même socle sur une instance neuve : rien n'a encore été créé. */
const SOCLE_NEUF = { univers: [], domaines: [], compte: COMPTE_NEUF, notes: [] };

/** L'avatar de la barre nomme le compte SERVI, jamais celui du jeu. */
function compteRendu(rendu: string, nom: string): void {
	expect(rendu).toContain(`${nom} — menu utilisateur`);
}

/** Aucun de ces textes ne survit à un registre servi vide. */
function aucun(rendu: string, textes: readonly string[]): void {
	for (const t of textes) expect(rendu).not.toContain(t);
}

describe('V-27 — Univers', () => {
	test('les univers servis sont les seuls rendus', async () => {
		const rendu = await rendre('V-27', SOCLE);
		compteRendu(rendu, MOI.nom);
		// `univers` : la description de « Production », que seule cette table porte.
		expect(rendu).toContain("Ce qui tourne aujourd'hui");
		// `domaines` : le rail de la forme complète les nomme.
		expect(rendu).toContain('Poste de travail');

		const autre = await rendre('V-27', {
			...SOCLE,
			univers: AUTRES_UNIVERS,
			domaines: AUTRES_DOMAINES,
			compte: AUTRE_COMPTE
		});
		compteRendu(autre, AUTRE_COMPTE.nom);
		expect(autre).not.toContain("Ce qui tourne aujourd'hui");
		expect(autre).not.toContain('Poste de travail');
		expect(autre).toContain('Migration 2026');
	});

	test('sur une instance neuve, aucun univers du jeu n’est rendu', async () => {
		const neuve = await rendre('V-27', SOCLE_NEUF);
		compteRendu(neuve, COMPTE_NEUF.nom);
		aucun(neuve, [...UNIVERS.map((u) => u.description), ...DOMAINES.map((d) => d.nom)]);
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
	/** Ce que `/console/domaines` sert : les quatre sources, plus le catalogue. */
	const SERVI = { ...SOCLE, detailDomaines: DETAIL_DOMAINES, modules: MODULES };

	test('les domaines servis sont les seuls rendus', async () => {
		const rendu = await rendre('V-28', SERVI);
		compteRendu(rendu, MOI.nom);
		expect(rendu).toContain(DETAIL_DOMAINES.Applications?.description ?? '');
		expect(rendu).toContain(MODULES.notes.nom);
		expect(rendu).not.toContain('Carnets');

		const autre = await rendre('V-28', {
			...SERVI,
			univers: AUTRES_UNIVERS,
			domaines: AUTRES_DOMAINES,
			compte: AUTRE_COMPTE,
			modules: AUTRES_MODULES,
			detailDomaines: AUTRES_DETAILS
		});
		compteRendu(autre, AUTRE_COMPTE.nom);
		// `domaines` : le tableau ne porte plus que « Migration 2026 ».
		expect(autre).not.toContain(DETAIL_DOMAINES.Applications?.description ?? '');
		expect(autre).toContain(DETAIL_DOMAINES['Migration 2026']?.description ?? '');
		// `modules` : le nom du module vient du catalogue fourni.
		expect(autre).toContain('Carnets');
	});

	/**
	 * LE DOMAINE « TÉLÉPHONIE » N'EXISTE PLUS, MÊME SUR LE REGISTRE DU JEU.
	 *
	 * Il était injecté par une comparaison d'identité — `domaines === DOMAINES` —,
	 * c'est-à-dire précisément quand la route avait oublié de passer les domaines.
	 * Aucune table ne le porte : servi à côté des domaines réels, c'était une
	 * ligne que l'administrateur voyait et qui ne correspondait à rien.
	 */
	test('aucun domaine littéral ne s’ajoute au registre servi', async () => {
		const rendu = await rendre('V-28', SERVI);
		expect(rendu).not.toContain('Téléphonie');
	});

	/**
	 * SUR UNE INSTANCE NEUVE, LE REGISTRE EST VIDE — ET LE DÉCOMPTE LE DIT.
	 *
	 * Les noms de domaine se mesurent par OCCURRENCES : le gel écrit
	 * `placeholder="Infrastructure"` sur le champ du panneau, un exemple de
	 * saisie qui porte le nom d'un domaine du jeu. Ce qui doit tomber à zéro,
	 * c'est la LIGNE du domaine et sa description.
	 */
	test('sur une instance neuve, aucun domaine du jeu n’est rendu', async () => {
		const servi = await rendre('V-28', SERVI);
		const neuve = await rendre('V-28', {
			...SOCLE_NEUF,
			detailDomaines: {},
			modules: MODULES
		});
		compteRendu(neuve, COMPTE_NEUF.nom);
		expect(neuve).not.toContain('Téléphonie');
		aucun(
			neuve,
			Object.values(DETAIL_DOMAINES).map((d) => d.description)
		);
		for (const d of DOMAINES) {
			expect(occurrences(neuve, d.nom)).toBeLessThan(occurrences(servi, d.nom));
		}
	});

	test('`univers` fournie, la couleur de l’univers suit', async () => {
		const servi = await rendre('V-28', SERVI);
		const sansUnivers = await rendre('V-28', { ...SERVI, univers: [] });
		expect(sansUnivers).not.toBe(servi);
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
	/** Les descriptions et glyphes que la console a écrits, tels que la route les sert. */
	const PRESENTATIONS = {
		Serveur: {
			description:
				"Machine physique ou virtuelle exploitée par l'équipe. Devient un nœud de la cartographie.",
			glyphe: 'serveur'
		}
	};
	const SERVI = { ...SOCLE, typesFiche: TYPES_FICHE, presentations: PRESENTATIONS };

	test('les types servis sont les seuls rendus', async () => {
		const rendu = await rendre('V-29', SERVI, EDITION);
		compteRendu(rendu, MOI.nom);
		expect(rendu).toContain(TYPES_FICHE.Serveur[0]!.nom);
		expect(rendu).not.toContain('Champ de l’épreuve T-044');

		const autre = await rendre(
			'V-29',
			{
				...SERVI,
				univers: AUTRES_UNIVERS,
				domaines: AUTRES_DOMAINES,
				compte: AUTRE_COMPTE,
				typesFiche: AUTRES_TYPES
			},
			EDITION
		);
		compteRendu(autre, AUTRE_COMPTE.nom);
		expect(autre).toContain('Champ de l’épreuve T-044');
		expect(autre).not.toContain(TYPES_FICHE.Serveur[0]!.nom);
	});

	/* LA DESCRIPTION ET L'ICÔNE VIENNENT DE LA BASE DEPUIS `008_saisies_de_console`.
	   La console les demandait déjà et les jetait ; sans cette source, l'écran ne
	   pouvait montrer que les trois descriptions écrites à la main pour le jeu. */
	test('la description servie est la seule rendue', async () => {
		const servi = await rendre('V-29', SERVI, EDITION);
		expect(servi).toContain('Machine physique ou virtuelle');

		const rendu = await rendre(
			'V-29',
			{
				...SERVI,
				presentations: { Serveur: { description: 'Décrit par la console.', glyphe: 'contrat' } }
			},
			EDITION
		);
		expect(rendu).toContain('Décrit par la console.');
		expect(rendu).not.toContain('Machine physique ou virtuelle');
	});

	/**
	 * SUR UNE INSTANCE NEUVE, LES TROIS TYPES DU JEU N'EXISTENT PAS.
	 *
	 * Ils étaient la valeur par défaut de `typesFiche`, et leurs descriptions
	 * celle de `presentations` — deux constantes de module dérivées du jeu, qui
	 * s'affichaient dès qu'une route les oubliait, avec deux clés marquées
	 * obligatoires que la base n'avait jamais dites telles.
	 */
	test('sur une instance neuve, aucun type du jeu n’est rendu', async () => {
		const neuve = await rendre('V-29', { ...SOCLE_NEUF, typesFiche: {}, presentations: {} });
		compteRendu(neuve, COMPTE_NEUF.nom);
		aucun(neuve, [
			'Machine physique ou virtuelle',
			'Logiciel en service pour le métier',
			'prestataire, éditeur, opérateur',
			...TYPES_FICHE.Serveur.map((c) => c.nom)
		]);
	});
});

describe('V-30 — Types de relation', () => {
	const AUTRES_TYPES = {
		...TYPES_RELATION,
		heberge: { sortant: 'porte l’épreuve', entrant: 'est porté par l’épreuve' }
	};
	const SERVI = {
		...SOCLE,
		typesRelation: TYPES_RELATION,
		relationsTechniques: RELATIONS_TECHNIQUES,
		relations: RELATIONS
	};

	test('les types servis sont les seuls rendus', async () => {
		const rendu = await rendre('V-30', SERVI);
		compteRendu(rendu, MOI.nom);
		expect(rendu).toContain(TYPES_RELATION.heberge.sortant);
		expect(rendu).not.toContain('porte l’épreuve');

		const autre = await rendre('V-30', {
			...SERVI,
			univers: AUTRES_UNIVERS,
			domaines: AUTRES_DOMAINES,
			compte: AUTRE_COMPTE,
			typesRelation: AUTRES_TYPES,
			relations: []
		});
		compteRendu(autre, AUTRE_COMPTE.nom);
		expect(autre).toContain('porte l’épreuve');
		// `relations` : l'usage est compté, jamais écrit — sans relation, il tombe.
		expect(autre).not.toBe(rendu);
	});

	/**
	 * LE TYPE « remplace » N'EXISTE PLUS, MÊME SUR LE CATALOGUE DU JEU.
	 *
	 * Il était injecté par une comparaison d'identité — `typesRelation ===
	 * TYPES_RELATION` —, c'est-à-dire quand la route avait oublié de passer le
	 * catalogue. Aucune table ne le porte.
	 */
	test('aucun type littéral ne s’ajoute au catalogue servi', async () => {
		const rendu = await rendre('V-30', SERVI);
		expect(rendu).not.toContain('est remplacé par');
	});

	/**
	 * SUR UNE INSTANCE NEUVE, LE CATALOGUE EST VIDE — ET LE DÉCOMPTE LE DIT.
	 *
	 * Les libellés se mesurent par OCCURRENCES et non par absence, parce que le
	 * gel en écrit deux au balisage : `placeholder="héberge"` sur le champ du
	 * panneau, et la phrase de tête qui illustre la lecture dans les deux sens.
	 * Ce sont des exemples de formulaire, pas des types servis comme des faits ;
	 * ce qui doit tomber à zéro, c'est la LIGNE de chaque type.
	 */
	test('sur une instance neuve, aucun type du jeu n’est rendu', async () => {
		const servi = await rendre('V-30', SERVI);
		const neuve = await rendre('V-30', {
			...SOCLE_NEUF,
			typesRelation: {},
			relationsTechniques: [],
			relations: []
		});
		compteRendu(neuve, COMPTE_NEUF.nom);
		expect(neuve).not.toContain('est remplacé par');
		for (const t of Object.values(TYPES_RELATION)) {
			expect(occurrences(neuve, t.sortant)).toBeLessThan(occurrences(servi, t.sortant));
		}
	});
});

describe('V-31 — Squelettes', () => {
	const SERVI = { ...SOCLE, templates: TEMPLATES, typesNote: TYPES_NOTE };

	test('les squelettes servis sont les seuls rendus', async () => {
		const rendu = await rendre('V-31', SERVI);
		compteRendu(rendu, MOI.nom);
		for (const t of TEMPLATES) expect(rendu).toContain(t.nom);

		const autre = await rendre('V-31', {
			...SERVI,
			univers: AUTRES_UNIVERS,
			domaines: AUTRES_DOMAINES,
			compte: AUTRE_COMPTE,
			templates: [TEMPLATES[0]!]
		});
		compteRendu(autre, AUTRE_COMPTE.nom);
		expect(autre).toContain(TEMPLATES[0]!.nom);
		expect(autre).not.toContain(TEMPLATES[1]!.nom);
	});

	/**
	 * SUR UNE INSTANCE NEUVE, LA LISTE EST VIDE — ET LE DÉCOMPTE LE DIT.
	 *
	 * Par occurrences, pour la même raison qu'en `V-30` : le gel écrit
	 * `placeholder="Procédure d'intervention"` sur le champ du panneau, un
	 * exemple de saisie qui porte le nom d'un squelette du jeu.
	 */
	test('sur une instance neuve, aucun squelette du jeu n’est rendu', async () => {
		const servi = await rendre('V-31', SERVI);
		const neuve = await rendre('V-31', { ...SOCLE_NEUF, templates: [], typesNote: TYPES_NOTE });
		compteRendu(neuve, COMPTE_NEUF.nom);
		for (const t of TEMPLATES) {
			expect(occurrences(neuve, t.nom)).toBeLessThan(occurrences(servi, t.nom));
		}
	});
});

describe('V-32 — Comptes', () => {
	const SERVI = { ...SOCLE, comptes: COMPTES, verrous: { 'lea.marchand': true } };

	test('les comptes servis sont les seuls rendus', async () => {
		const rendu = await rendre('V-32', SERVI);
		compteRendu(rendu, MOI.nom);
		for (const c of COMPTES) expect(rendu).toContain(c.identifiant);

		const autre = await rendre('V-32', {
			...SERVI,
			univers: AUTRES_UNIVERS,
			domaines: AUTRES_DOMAINES,
			compte: AUTRE_COMPTE,
			comptes: [COMPTES[0] as Compte]
		});
		compteRendu(autre, AUTRE_COMPTE.nom);
		expect(autre).toContain(COMPTES[0]!.identifiant);
		expect(autre).not.toContain(COMPTES[1]!.identifiant);
	});

	test('sur une instance neuve, aucun compte du jeu n’est rendu', async () => {
		const neuve = await rendre('V-32', { ...SOCLE_NEUF, comptes: [], verrous: {} });
		compteRendu(neuve, COMPTE_NEUF.nom);
		aucun(
			neuve,
			COMPTES.map((c) => c.identifiant)
		);
	});

	test('`domaines` fournie, le sélecteur du panneau la suit', async () => {
		const ouvert = { form: 'creation', 'c-mdp': false, 'c-des': false };
		const servi = await rendre('V-32', SERVI, ouvert);
		const fourni = await rendre('V-32', { ...SERVI, domaines: AUTRES_DOMAINES }, ouvert);
		const sansDomaine = await rendre('V-32', { ...SERVI, domaines: [] }, ouvert);
		const plancher = occurrences(sansDomaine, 'Poste de travail');
		expect(occurrences(servi, 'Poste de travail')).toBeGreaterThan(plancher);
		expect(occurrences(fourni, 'Poste de travail')).toBe(plancher);
	});
});

/**
 * L'INERTIE D'`univers` SUR LES QUATRE REGISTRES DE FORME ABRÉGÉE.
 *
 * Même énoncé que celui de la fin du fichier, mais les quatre vues qui le
 * portaient exigent désormais leurs sources : elles ne peuvent plus être
 * rendues sans rien. Le constat, lui, est le même — le rail abrégé ne se dérive
 * pas du corpus, et fournir d'autres univers ne change pas un octet du rendu.
 */
describe('l’inertie constatée de « univers » sur les quatre registres', () => {
	const REGISTRES: readonly (readonly [string, object])[] = [
		['V-29', { typesFiche: TYPES_FICHE, presentations: {} }],
		[
			'V-30',
			{
				typesRelation: TYPES_RELATION,
				relationsTechniques: RELATIONS_TECHNIQUES,
				relations: RELATIONS
			}
		],
		['V-31', { templates: TEMPLATES, typesNote: TYPES_NOTE }],
		['V-32', { comptes: COMPTES, verrous: {} }]
	];
	for (const [vue, propres] of REGISTRES) {
		test(`${vue} — fournir d’autres univers ne change pas le rendu`, async () => {
			const servi = await rendre(vue, { ...SOCLE, ...propres });
			const fourni = await rendre(vue, { ...SOCLE, ...propres, univers: AUTRES_UNIVERS });
			expect(fourni).toBe(servi);
		});
	}
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
	for (const vue of ['V-33', 'V-34']) {
		test(`${vue} — fournir « univers » ne change pas le rendu`, async () => {
			const duJeu = await rendre(vue);
			const fourni = await rendre(vue, { univers: AUTRES_UNIVERS });
			expect(fourni).toBe(duJeu);
		});
	}
});
