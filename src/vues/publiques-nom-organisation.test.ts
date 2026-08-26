/**
 * LES ÉCRANS PUBLICS, ET CE QU'ILS ÉCRIVENT DU NOM DE L'ORGANISATION.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE
 *
 * Les cinq vues publiques ont cessé d'écrire « Direction technique » en dur et
 * lisent désormais `nomOrganisation` sur le contexte de coquille. La première
 * livraison n'a été mesurée que sur une base MIGRÉE ET JAMAIS SEMÉE, donc avec
 * `nom_organisation` à la chaîne vide : la BRANCHE NON VIDE — celle que le
 * geste ajoute — n'était exercée par rien. Un port dont seule la branche de
 * repli est éprouvée n'est pas éprouvé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CES CAS PROUVENT
 *
 *   · VIDE, l'écran ne nomme personne et n'écrit ni préposition orpheline ni
 *     séparateur pendant ;
 *   · NOMMÉE, le nom atteint le balisage, DANS LA FORME EXACTE que la vue
 *     promet — et la forme est le sujet même du cas : « Documentation de X »
 *     fabriquait une faute d'accord sur tout nom propre, y compris sur la
 *     valeur du cadrage (« Documentation de Direction technique »).
 *
 * LE NOM D'ÉPREUVE PORTE SA PROPRE PRÉPOSITION — « Mairie de Sainte-Foy ». Un
 * nom d'un seul mot aurait laissé passer la faute qu'on répare.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ILS NE PROUVENT PAS
 *
 * V-03 n'y figure pas : son unique propriété exigée est une interface LOCALE
 * que la vue n'exporte pas, et la recopier ici éprouverait la copie. Son pied
 * dérive la signature par le même calcul, à la lettre, et il se mesure au
 * navigateur.
 *
 * LE CHEMIN EST CELUI DU PRODUIT — `ssrLoadModule` puis `render()`, comme
 * `proprietes-coquille.test.ts` : un cas qui n'aurait pas traversé le
 * compilateur Svelte ne dirait rien du composant réellement servi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { corpusDeVariante, type Note } from '../../seeds/corpus';
import { CONFIGURATION_PAR_DEFAUT } from '../lib/base/schema';
import { CLE_IDENTITE, type IdentiteDeCoquille } from '../lib/coquille/identite';

type Proprietes = Record<string, unknown>;
type Rendre = (
	composant: unknown,
	options: { props: Proprietes; context?: Map<unknown, unknown> }
) => {
	body: string;
};

/**
 * L'IDENTITÉ TELLE QUE LE GABARIT RACINE LA POSE — le type vient du produit,
 * il n'est pas recopié : le jour où un membre s'ajoute, ce fichier ne compile
 * plus au lieu de mesurer une forme périmée.
 *
 * Tous les membres sont à leur état hors application, sauf celui qu'on éprouve.
 */
function identiteNommee(nom: string): IdentiteDeCoquille {
	return {
		compte: null,
		administrateur: false,
		univers: [],
		domaines: [],
		version: null,
		nomOrganisation: nom,
		synchro: null,
		rangement: null,
		vocabulaire: null
	};
}

/** L'état d'une installation qui ne s'est pas nommée — le défaut du produit. */
const SANS_NOM = CONFIGURATION_PAR_DEFAUT.nomOrganisation;
/** Un nom qui porte SA PROPRE préposition : c'est là que la faute se voyait. */
const NOM = 'Mairie de Sainte-Foy';

/** Les vues sans coquille et leurs propriétés exigées, hors `notes`. */
const BASES: Record<string, Proprietes> = {
	'V-01': { vecteur: null, portail: '' },
	'V-02': { vecteur: null, portail: '', pistes: [] },
	'V-04': { vecteur: null, portail: '', pistes: [] },
	'V-05': { vecteur: null }
};

let vite: ViteDevServer;
let rendre: Rendre;
let notes: readonly Note[];
const composants = new Map<string, unknown>();

beforeAll(async () => {
	vite = await createServer({
		// Le surveillant ne doit pas descendre dans .claude/worktrees/ ni dans
		// build/ : il s'y épuise et la série sort en ENOSPC, ses tests verts
		// compris. Même parade que `proprietes-coquille.test.ts`.
		server: {
			middlewareMode: true,
			watch: {
				ignored: (chemin: string) => chemin.includes('/.claude') || chemin.includes('/build/')
			}
		},
		appType: 'custom',
		logLevel: 'error'
	});
	const serveur = (await vite.ssrLoadModule('svelte/server')) as unknown as { render: Rendre };
	rendre = serveur.render;
	notes = corpusDeVariante('complete');
	for (const nom of [...Object.keys(BASES), 'V-09']) {
		const module = (await vite.ssrLoadModule(`/src/vues/${nom}.svelte`)) as unknown as {
			default: unknown;
		};
		composants.set(nom, module.default);
	}
}, 300_000);

afterAll(async () => {
	await vite?.close();
});

/** Le balisage de la vue, rendue sous le contexte d'une instance ainsi nommée. */
function corps(vue: string, nomOrganisation: string): string {
	return rendre(composants.get(vue), {
		props: { ...BASES[vue], notes },
		context: new Map<unknown, unknown>([[CLE_IDENTITE, identiteNommee(nomOrganisation)]])
	}).body;
}

/**
 * LES VUES QUI PORTENT UNE SIGNATURE DE PIED. V-05 n'en a pas : son bandeau de
 * marque écrit « Codicillus » seul, le nom du LOGICIEL, et c'est juste — le nom
 * de l'organisation s'y pose dans le titre, éprouvé plus bas.
 */
const A_SIGNATURE = ['V-01', 'V-02', 'V-04'];

describe('la signature de pied — « Codicillus · <organisation> »', () => {
	for (const vue of A_SIGNATURE) {
		it(`${vue} — sans nom, le pied dit « Codicillus » seul`, () => {
			const rendu = corps(vue, SANS_NOM);
			expect(rendu).toContain('Codicillus');
			expect(rendu).not.toContain('Codicillus ·');
		});

		it(`${vue} — nommée, le pied juxtapose le nom`, () => {
			expect(corps(vue, NOM)).toContain(`Codicillus · ${NOM}`);
		});
	}
});

describe('V-01 — le surtitre de l’hameçon n’invente pas d’article', () => {
	it('sans nom, il dit « Documentation » seul', () => {
		const rendu = corps('V-01', SANS_NOM);
		expect(rendu).toContain('>Documentation<');
		expect(rendu).not.toContain('Documentation ·');
	});

	it('nommée, il juxtapose le nom au lieu de le gouverner', () => {
		const rendu = corps('V-01', NOM);
		expect(rendu).toContain(`Documentation · ${NOM}`);
		/* LA FORME QUI ÉTAIT SERVIE, ET QUI EST UNE FAUTE. « Documentation de
		   <nom propre> » exige un article que l'instance ne nous donne pas. */
		expect(rendu).not.toContain(`Documentation de ${NOM}`);
	});
});

describe('V-05 — la phrase d’accueil de la connexion reste une phrase', () => {
	it('sans nom, le titre dit « Connexion » seul', () => {
		const rendu = corps('V-05', SANS_NOM);
		expect(rendu).toContain('>Connexion</h1>');
	});

	it('nommée, le nom se pose dans le titre, jamais dans la phrase', () => {
		const rendu = corps('V-05', NOM);
		expect(rendu).toContain(`Connexion · ${NOM}</h1>`);
		expect(rendu).toContain('Utilisez les identifiants de votre compte.');
		/* LES DEUX RECOMPOSITIONS FAUTIVES : celle qui supprime la préposition
		   du gel, et celle qui la garde sans son article. */
		expect(rendu).not.toContain(`votre compte ${NOM}`);
		expect(rendu).not.toContain(`votre compte de ${NOM}`);
	});
});

describe('V-09 — la palette au repos ne nomme plus le jeu de démonstration', () => {
	/** Les quatre identifiants que la vue portait écrits. */
	const ANCIENS = ['n-restaurer-pg', 'n-astreinte', 'n-pg-prod-01', 'n-diag-barman'];

	function palette(ensemble: readonly Note[]): string {
		return rendre(composants.get('V-09'), { props: { notes: ensemble, dureeMs: null } }).body;
	}

	it('aucun identifiant du jeu n’est écrit dans la vue', () => {
		const rendu = palette([]);
		for (const id of ANCIENS) expect(rendu).not.toContain(id);
	});

	it('sur un ensemble vide, le groupe « Consultées récemment » n’est pas annoncé', () => {
		expect(palette([])).not.toContain('Consultées récemment');
	});

	it('sur un ensemble servi, le repos montre la tête de CET ensemble', () => {
		const ensemble = corpusDeVariante('palette');
		const premier = ensemble[0];
		expect(premier).toBeDefined();
		const rendu = palette(ensemble);
		expect(rendu).toContain('Consultées récemment');
		expect(rendu).toContain(premier!.titre);
	});
});
