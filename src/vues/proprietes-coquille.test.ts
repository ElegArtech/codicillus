/**
 * T-045 — LE CONTRAT DE PROPRIÉTÉS DES VUES CÂBLÉES.
 *
 * Ce que ces cas prouvent, et rien d'autre : chacune des vues du lot accepte en
 * PROPRIÉTÉ les sources qu'elle importait en constante, et pour chacune
 *
 *   · ABSENTE, LE DÉFAUT S'APPLIQUE — la rendre en passant explicitement la
 *     constante du jeu de semence donne le MÊME balisage, à l'octet, que de
 *     l'omettre. C'est la propriété qui garantit que le banc ne bouge pas : le
 *     mode démo ne passe que `vecteur`/`etat` et `notes`.
 *   · FOURNIE, ELLE L'EMPORTE — la rendre avec une autre valeur change le
 *     balisage. Sans ce second cas, la propriété serait acceptée sans être lue,
 *     et le contrôle serait celui d'une règle que rien n'exerce (P-5).
 *
 * CHAQUE SOURCE EST ÉPROUVÉE DANS UN ÉTAT QUI LA LIT. Onze des dix-neuf ne sont
 * lues que dans un état précis — l'étape 3 de l'import, le dialogue de gabarits,
 * le rapport de lot. Mesurée dans l'état par défaut, la source aurait rendu le
 * même balisage des deux côtés et le cas aurait été VERT SANS RIEN PROUVER.
 * L'état choisi est porté à `base`, et le motif avec lui.
 *
 * LA COMPARAISON PORTE SUR LE BALISAGE ENTIER, jamais sur une chaîne choisie :
 * un marqueur bien choisi prouve qu'une chaîne a circulé, l'égalité du rendu
 * prouve que RIEN d'autre n'a bougé.
 *
 * LE CHEMIN EMPRUNTÉ EST CELUI DU PRODUIT — `ssrLoadModule` puis `render()`,
 * comme le mode démo, les deux tirés du MÊME graphe de modules. Un cas qui
 * n'aurait pas traversé le compilateur Svelte ne dirait rien du composant
 * réellement servi (ÉCART-013 É-1).
 *
 * CE QUE CES CAS NE PROUVENT PAS : la conformité au gel, qui est le domaine du
 * banc de comparaison, et le routage, qui n'est pas de ce lot — aucune vue
 * n'est branchée à un chargeur ici.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import {
	ACTIVITE,
	COMPTES,
	CONTRIBUTIONS,
	DISTINCTIONS,
	DOMAINES,
	FORMATS_IMPORT,
	INSTANCE,
	JOURNAL_IMPORTS,
	LOT_IMPORT,
	MOI,
	RELATIONS,
	TEMPLATES,
	TYPES_NOTE,
	TYPES_RELATION,
	UNIVERS,
	VERSIONS,
	corpusDeVariante,
	type Compte,
	type Domaine,
	type EtatDInstance,
	type Note,
	type Univers,
	type UtilisateurCourant,
	type Version
} from '../../seeds/corpus';

type Proprietes = Record<string, unknown>;
type Rendre = (composant: unknown, options: { props: Proprietes }) => { body: string };

/** Une source portée par une vue, et de quoi l'éprouver dans les deux sens. */
interface Source {
	/** Le nom contractuel de la propriété — camelCase du nom de la constante. */
	readonly cle: string;
	/** La constante du jeu de semence, celle sur laquelle la vue retombe. */
	readonly defaut: unknown;
	/** Une autre valeur, du même type, qui doit changer le rendu. */
	readonly autre: unknown;
	/** L'état dans lequel la source est lue, quand ce n'est pas celui de base. */
	readonly base?: Proprietes;
	/**
	 * Déclaré INERTE : la propriété est acceptée et transmise, et AUCUN nœud ne
	 * s'en dérive dans cette vue. Le cas exige alors l'égalité — le dire est plus
	 * honnête que de choisir un état qui l'éviterait.
	 */
	readonly inerte?: true;
	/** Une chaîne que la valeur fournie doit faire apparaître au balisage. */
	readonly marqueur?: string;
}

/* ── Les valeurs de contre-épreuve ─────────────────────────────────────────
   Toutes restent dans les types de `seeds/corpus.ts` : aucun type n'est
   déclaré ici, et les noms d'univers, de domaine et d'auteur sont ceux que le
   jeu de semence admet. */

const AUTRE_COMPTE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'ZQ',
	domaine: 'Applications',
	role: 'Administrateur'
};
const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9', synchro: 'à l’instant' };
const AUTRES_UNIVERS: readonly Univers[] = UNIVERS.filter((u) => u.nom === 'Production');
const AUTRES_DOMAINES: readonly Domaine[] = DOMAINES.filter((d) => d.nom === 'Applications');

/** Un compte que le jeu de semence ne porte pas, et qui n'a donc aucun accès. */
const COMPTE_SYNTHETIQUE: Compte = {
	...COMPTES[0]!,
	id: 'c-zq',
	nom: 'Zoé Quintard',
	identifiant: 'zquintard',
	courriel: 'zq@exemple.test',
	actif: true
};

/** Un historique posé sur une note qui n'en a pas au jeu de semence. */
const TROIS_VERSIONS: readonly Version[] = (
	Object.values(VERSIONS).find((v) => v !== undefined) ?? []
).slice(0, 3);

/** Les quatre sources de la coquille, communes aux vues qui la portent. */
function coquille(inertes: readonly string[] = []): readonly Source[] {
	const inerte = (cle: string) => (inertes.includes(cle) ? ({ inerte: true } as const) : {});
	return [
		{ cle: 'univers', defaut: UNIVERS, autre: AUTRES_UNIVERS, ...inerte('univers') },
		{ cle: 'domaines', defaut: DOMAINES, autre: AUTRES_DOMAINES, ...inerte('domaines') },
		{ cle: 'compte', defaut: MOI, autre: AUTRE_COMPTE, marqueur: 'ZQ', ...inerte('compte') },
		{
			cle: 'instance',
			defaut: INSTANCE,
			autre: AUTRE_INSTANCE,
			marqueur: '9.9.9',
			...inerte('instance')
		}
	];
}

/**
 * LES VUES DU LOT ET LEURS SOURCES.
 *
 * `base` au niveau de la vue est le réglage minimal — ce que le mode démo lui
 * passe déjà. `base` au niveau d'une source le remplace, et seulement pour ce
 * cas-là.
 *
 * V-25 et V-26 rendent la coquille en forme ABRÉGÉE, dont le rail est écrit au
 * balisage et ne se dérive pas du corpus : `univers` et `domaines` y sont
 * acceptées sans qu'aucun nœud n'en dépende. V-24, abrégée elle aussi, lit
 * pourtant `domaines` — son sélecteur de domaine de destination les énumère.
 */
const VUES: Readonly<
	Record<string, { readonly base: Proprietes; readonly sources: readonly Source[] }>
> = {
	'V-06': {
		base: { vecteur: { et: '2' } },
		sources: [
			{
				cle: 'comptes',
				defaut: COMPTES,
				autre: COMPTES.filter((c) => c.id !== 'c-sophie'),
				/* L'étape 2 est la seule qui affiche l'identifiant du compte. */
				base: { vecteur: { et: '2' } }
			}
		]
	},
	'V-24': {
		base: { vecteur: { et: '2' } },
		sources: [
			...coquille(['univers']),
			{
				cle: 'lotImport',
				defaut: LOT_IMPORT,
				autre: { ...LOT_IMPORT, fichiers: LOT_IMPORT.fichiers.slice(0, 4) },
				/* L'étape 3 est celle de l'aperçu : c'est là que le lot est compté. */
				base: { vecteur: { et: '3' } }
			},
			{
				cle: 'formatsImport',
				defaut: FORMATS_IMPORT,
				autre: {},
				base: { vecteur: { et: '3' } }
			}
		]
	},
	'V-25': {
		base: { vecteur: null },
		sources: [
			...coquille(['univers', 'domaines']),
			{
				cle: 'comptes',
				defaut: COMPTES,
				autre: COMPTES.map((c) => ({ ...c, courriel: 'zq@exemple.test' })),
				marqueur: 'zq@exemple.test'
			},
			{
				cle: 'contributions',
				defaut: CONTRIBUTIONS,
				autre: {
					...CONTRIBUTIONS,
					'Karim Belhadj': { ...CONTRIBUTIONS['Karim Belhadj'], verifiees: 999 }
				}
			},
			{ cle: 'distinctions', defaut: DISTINCTIONS, autre: DISTINCTIONS.slice(0, 1) },
			{ cle: 'activite', defaut: ACTIVITE, autre: ACTIVITE.slice(0, 1) },
			{ cle: 'relations', defaut: RELATIONS, autre: [] }
		]
	},
	'V-26': { base: { vecteur: null }, sources: coquille(['univers', 'domaines']) },
	'V-35': {
		base: { etat: 'journal-peuple' },
		sources: [
			{
				cle: 'journalImports',
				defaut: JOURNAL_IMPORTS,
				autre: JOURNAL_IMPORTS.slice(0, 1)
			},
			{
				cle: 'lotImport',
				defaut: LOT_IMPORT,
				autre: { ...LOT_IMPORT, fichiers: LOT_IMPORT.fichiers.filter((f) => f.s !== 'echec') },
				/* Le rapport de lot est le seul état qui liste les fichiers en échec. */
				base: { etat: 'rapport-de-lot' }
			}
		]
	},
	'V-36': { base: {}, sources: [{ cle: 'domaines', defaut: DOMAINES, autre: AUTRES_DOMAINES }] },
	'V-37': { base: { vecteur: null }, sources: coquille() },
	'V-38': { base: { etat: 'succes' }, sources: coquille() },
	'V-39': { base: { etat: 'vide' }, sources: coquille() },
	'V-40': {
		base: { etat: 'd-note' },
		sources: [
			...coquille(),
			{
				cle: 'comptes',
				defaut: COMPTES,
				autre: [...COMPTES, COMPTE_SYNTHETIQUE],
				/* Le dialogue des droits est le seul à énumérer les comptes. */
				base: { etat: 'd-droits' },
				marqueur: 'Zoé Quintard'
			},
			{ cle: 'relations', defaut: RELATIONS, autre: [] },
			{ cle: 'versions', defaut: VERSIONS, autre: { ...VERSIONS, 'n-pg-prod-01': TROIS_VERSIONS } },
			{
				cle: 'templates',
				defaut: TEMPLATES,
				autre: TEMPLATES.slice(0, 1),
				base: { etat: 'd-template' }
			},
			{
				cle: 'typesRelation',
				defaut: TYPES_RELATION,
				autre: {
					...TYPES_RELATION,
					heberge: { sortant: 'zq-sortant', entrant: 'zq-entrant' }
				},
				base: { etat: 'd-relation' },
				marqueur: 'zq-sortant'
			}
		]
	},
	'V-41': {
		base: {},
		sources: [
			...coquille(),
			{ cle: 'activite', defaut: ACTIVITE, autre: ACTIVITE.slice(0, 1) },
			{ cle: 'typesNote', defaut: TYPES_NOTE, autre: TYPES_NOTE.slice(0, 1) }
		]
	}
};

const NOMS = Object.keys(VUES);

let vite: ViteDevServer;
let rendre: Rendre;
let notes: readonly Note[];
const composants = new Map<string, unknown>();

beforeAll(async () => {
	vite = await createServer({
		server: { middlewareMode: true },
		appType: 'custom',
		logLevel: 'error'
	});
	const serveur = (await vite.ssrLoadModule('svelte/server')) as unknown as { render: Rendre };
	rendre = serveur.render;
	notes = corpusDeVariante('complete');
	for (const nom of NOMS) {
		const module = (await vite.ssrLoadModule(`/src/vues/${nom}.svelte`)) as unknown as {
			default: unknown;
		};
		composants.set(nom, module.default);
	}
}, 300_000);

afterAll(async () => {
	await vite?.close();
});

/** Le balisage rendu par la vue, dans l'état donné, plus les propriétés données. */
function corps(vue: string, base: Proprietes, sup: Proprietes = {}): string {
	return rendre(composants.get(vue), { props: { ...base, notes, ...sup } }).body;
}

describe.each(NOMS)('%s — les sources en propriétés optionnelles', (vue) => {
	const { base, sources } = VUES[vue]!;

	it('rend sans qu’aucune source ne lui soit passée', () => {
		expect(corps(vue, base).length).toBeGreaterThan(0);
	});

	for (const source of sources) {
		const etat = source.base ?? base;

		it(`absente, \`${source.cle}\` retombe sur la constante du jeu de semence`, () => {
			expect(corps(vue, etat, { [source.cle]: source.defaut })).toBe(corps(vue, etat));
		});

		if (source.inerte) {
			it(`fournie, \`${source.cle}\` ne change rien — le rail abrégé ne s’en dérive pas`, () => {
				expect(corps(vue, etat, { [source.cle]: source.autre })).toBe(corps(vue, etat));
			});
		} else {
			it(`fournie, \`${source.cle}\` l’emporte sur la constante`, () => {
				expect(corps(vue, etat, { [source.cle]: source.autre })).not.toBe(corps(vue, etat));
			});

			if (source.marqueur) {
				it(`la valeur fournie pour \`${source.cle}\` atteint le balisage`, () => {
					expect(corps(vue, etat)).not.toContain(source.marqueur);
					expect(corps(vue, etat, { [source.cle]: source.autre })).toContain(source.marqueur);
				});
			}
		}
	}
});
