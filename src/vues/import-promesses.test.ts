/**
 * L'IMPORT N'OFFRE QUE CE QU'IL FAIT — les deux écrans, rendus par le chemin du
 * produit.
 *
 * Ce que ces cas éprouvent : le BALISAGE RÉELLEMENT SERVI. Le composant est
 * chargé par `ssrLoadModule` et rendu par `svelte/server`, comme le mode démo et
 * comme `proprietes-coquille.test.ts` — un cas qui n'aurait pas traversé le
 * compilateur Svelte ne dirait rien du composant réellement servi.
 *
 * CE QU'ILS NE PROUVENT PAS, ET C'EST DÉLIBÉRÉ : le refus d'un scénario non
 * livré par l'action de `/importer`. Ce refus se joue sur une `FormData` qui
 * arrive du navigateur ; la fabriquer ici ferait partager au contrôle et au code
 * la même hypothèse sur la forme de l'entrée, et le contrôle ne pourrait pas la
 * détecter fausse. Il est relevé au navigateur, par un envoi réel, et son code
 * HTTP est au rapport du lot.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { corpusDeVariante, type Note } from '../../seeds/corpus';
import {
	MESURES_DE_CONSOLE_SANS_CONTREPARTIE,
	journalDImportsEnregistre
} from '../lib/donnees/consoles';
import { SCENARIOS_NON_LIVRES, SCENARIO_LIVRE } from '../lib/donnees/scenarios-d-import';

type Proprietes = Record<string, unknown>;
type Rendre = (composant: unknown, options: { props: Proprietes }) => { body: string };

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
	for (const nom of ['V-24', 'V-35']) {
		const module = (await vite.ssrLoadModule(`/src/vues/${nom}.svelte`)) as unknown as {
			default: unknown;
		};
		composants.set(nom, module.default);
	}
}, 300_000);

afterAll(async () => {
	await vite?.close();
});

function corps(vue: string, props: Proprietes = {}): string {
	return rendre(composants.get(vue), { props: { notes, ...props } }).body;
}

describe('V-24 — l’étape 1 n’offre que le scénario que l’import exécute', () => {
	it('rend la vignette du scénario livré', () => {
		expect(corps('V-24', { vecteur: null })).toContain(
			'Importer des notes dans un domaine existant'
		);
	});

	it('ne nomme AUCUN des scénarios non livrés', () => {
		/* Les noms sont ceux du gel, et ce sont ceux que l'utilisateur lisait
		   avant de choisir un scénario dont son lot ne portait aucune trace. */
		const rendu = corps('V-24', { vecteur: null });
		expect(SCENARIOS_NON_LIVRES.map((s) => s.id)).toEqual(['domaine', 'prepare']);
		expect(rendu).not.toContain('Importer un domaine complet');
		expect(rendu).not.toContain('Importer un corpus préparé');
	});

	it('ne demande plus un nom de domaine que personne ne lisait', () => {
		/* « Nom du domaine à créer * » était OBLIGATOIRE à l'écran et n'était
		   envoyé nulle part : ni `+page.svelte`, ni l'action ne le lisaient. */
		const rendu = corps('V-24', { vecteur: { et: '2' } });
		expect(rendu).not.toContain('nom-domaine');
		expect(rendu).not.toContain('Nom du domaine à créer');
	});

	it('ne promet plus la résolution automatique des liens', () => {
		const rendu = corps('V-24', { vecteur: null });
		expect(rendu).not.toContain('liens entre documents sont résolus automatiquement');
	});

	it('n’invite plus à déposer une archive, que le classement écarte', () => {
		const rendu = corps('V-24', { vecteur: { et: '2' } });
		expect(rendu).toContain('Glissez un dossier ici');
		expect(rendu).not.toContain('Glissez un dossier ou une archive ici');
	});

	it('le scénario livré reste celui de l’étape 2 de la planche', () => {
		expect(SCENARIO_LIVRE).toBe('notes');
	});
});

describe('V-35 — le journal dit ce qu’il conserve', () => {
	it('sans journal enregistré, l’écran l’annonce au lieu d’un tableau vide', () => {
		const rendu = corps('V-35', { journalImports: [], journalEnregistre: false });
		expect(rendu).toContain("Aucun lot n'est conservé");
		expect(rendu).not.toContain('restent consultables indéfiniment');
		expect(rendu).not.toContain('Chaque lot conserve son rapport');
	});

	it('journal enregistré, le tableau et les phrases du gel reviennent', () => {
		const rendu = corps('V-35', { journalEnregistre: true });
		expect(rendu).toContain('restent consultables indéfiniment');
		expect(rendu).not.toContain("Aucun lot n'est conservé");
	});

	it('le drapeau absent rend exactement ce que la vue rendait', () => {
		expect(corps('V-35', { journalEnregistre: true })).toBe(corps('V-35'));
	});

	it('n’offre plus les scénarios que l’import n’exécute pas', () => {
		const rendu = corps('V-35');
		expect(rendu).toContain('Dans un domaine existant');
		expect(rendu).not.toContain('Un domaine complet');
		expect(rendu).not.toContain('Un corpus préparé');
	});

	it('n’invite plus à déposer une archive', () => {
		const rendu = corps('V-35');
		expect(rendu).toContain('Déposez un dossier');
		expect(rendu).not.toContain('Déposez un dossier ou une archive');
	});
});

describe('journalDImportsEnregistre — le drapeau est LU sur le recensement réel', () => {
	it('rend faux sur le recensement du dépôt, qui porte encore JOURNAL_IMPORTS', () => {
		/* Le défaut par défaut, pas un recensement fabriqué : le jour où une
		   migration portera la table, l'entrée partira et ce cas rougira. */
		expect(journalDImportsEnregistre()).toBe(false);
		expect(MESURES_DE_CONSOLE_SANS_CONTREPARTIE.some((m) => m.donnee === 'JOURNAL_IMPORTS')).toBe(
			true
		);
	});

	it('rend vrai dès que l’entrée disparaît du recensement', () => {
		const sansEntree = MESURES_DE_CONSOLE_SANS_CONTREPARTIE.filter(
			(m) => m.donnee !== 'JOURNAL_IMPORTS'
		);
		expect(journalDImportsEnregistre(sansEntree)).toBe(true);
	});

	it('recense la moitié « accueil » de RG-M12-09, que rien ne signalait', () => {
		const accueil = MESURES_DE_CONSOLE_SANS_CONTREPARTIE.filter((m) => m.vue === 'V-07');
		expect(accueil).toHaveLength(1);
		expect(accueil[0]?.motif).toContain('flux d’activité');
	});
});
