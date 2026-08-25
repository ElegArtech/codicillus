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
import {
	DOMAINES,
	FORMATS_IMPORT,
	LOT_IMPORT,
	corpusDeVariante,
	type Note
} from '../../seeds/corpus';
import { LIBELLE_PAR_FORMAT } from '../lib/donnees/import';
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

/**
 * CE QUE CHAQUE VUE EXIGE, et qu'elle ne fabrique plus elle-même.
 *
 * `journalImports` de V-35 retombait sur `JOURNAL_IMPORTS` du jeu de
 * démonstration ; la propriété est devenue EXIGÉE, et l'état que le produit
 * sert est la table vide — aucune table n'enregistre d'import.
 */
const EXIGEES: Readonly<Record<string, Proprietes>> = { 'V-35': { journalImports: [] } };

function corps(vue: string, props: Proprietes = {}): string {
	return rendre(composants.get(vue), { props: { notes, ...EXIGEES[vue], ...props } }).body;
}

/**
 * LES BORNES D'UN ÉLÉMENT SERVI, RELEVÉES SUR LE BALISAGE RÉEL.
 *
 * Ni le fragment ni ses attributs ne sont écrits ici : ils sont cherchés dans
 * ce que le compilateur Svelte a produit. Un contrôle qui fabriquerait le
 * balisage qu'il éprouve ne dirait rien de celui que le produit sert.
 */
function borneServie(
	rendu: string,
	identifiant: string,
	balise: string
): { readonly ouvrante: string; readonly debut: number; readonly fin: number } {
	const ancre = rendu.indexOf('id="' + identifiant + '"');
	expect(ancre).toBeGreaterThan(-1);
	const debut = rendu.lastIndexOf('<' + balise, ancre);
	const finDeLOuvrante = rendu.indexOf('>', ancre);
	const fin = rendu.indexOf('</' + balise + '>', ancre);
	expect(debut).toBeGreaterThan(-1);
	expect(fin).toBeGreaterThan(finDeLOuvrante);
	return { ouvrante: rendu.slice(debut, finDeLOuvrante + 1), debut, fin };
}

/** Les positions d'un fragment dans le rendu, toutes. */
function positionsDe(rendu: string, fragment: string): readonly number[] {
	const trouvees: number[] = [];
	for (let i = rendu.indexOf(fragment); i !== -1; i = rendu.indexOf(fragment, i + 1)) {
		trouvees.push(i);
	}
	return trouvees;
}

/**
 * CE QUE `/importer` SERT TOUJOURS, ET QUE V-24 EXIGE DÉSORMAIS.
 *
 * Ces quatre propriétés étaient optionnelles, de défaut la constante de
 * `seeds/corpus.ts` : un écran d'import sans chargeur montrait trente fichiers
 * de démonstration comme s'ils venaient d'être déposés. Le socle du cas les
 * passe comme la route les sert. `formatsImport` vient du référentiel du
 * produit, `$lib/donnees/import.ts`, et non plus du jeu.
 */
const SOCLE_V24: Proprietes = {
	domaines: DOMAINES,
	lotImport: LOT_IMPORT,
	formatsImport: LIBELLE_PAR_FORMAT,
	domaineParDefaut: DOMAINES[0]!.nom
};

/** Les quatre étapes du parcours, telles que la clé d'état les nomme. */
const VECTEURS: readonly (Proprietes | null)[] = [null, { et: '2' }, { et: '3' }, { et: '4' }];

/* ══════════════════════════════════════════════════════════════════════════
   LA COPIE DU JEU EST LIÉE À SON ORIGINE

   Les libellés de format sont un RÉFÉRENTIEL DU PRODUIT — `LIBELLE_PAR_FORMAT`
   de `$lib/donnees/import.ts`, la contrepartie française de `VOIE_PAR_FORMAT` —
   et `/importer` les sert de là. `seeds/corpus.ts` en garde une copie mot pour
   mot, `FORMATS_IMPORT`, pour le jeu de démonstration. Deux tables identiques
   qu'aucun contrôle ne lie divergent en silence : aucun compilateur ne voit la
   copie, et c'est le jeu qui montrerait alors un libellé que le produit n'écrit
   nulle part. Le lien est ici, et il rougit dans les deux sens.
   ══════════════════════════════════════════════════════════════════════════ */
describe('les libellés de format — le jeu de démonstration recopie le produit', () => {
	it('la table du jeu est celle du produit, clé pour clé', () => {
		expect(FORMATS_IMPORT).toEqual(LIBELLE_PAR_FORMAT);
	});
});

describe('V-24 — l’étape 1 n’offre que le scénario que l’import exécute', () => {
	it('rend la vignette du scénario livré', () => {
		expect(corps('V-24', { ...SOCLE_V24, vecteur: null })).toContain(
			'Importer des notes dans un domaine existant'
		);
	});

	it('ne nomme AUCUN des scénarios non livrés', () => {
		/* Les noms sont ceux du gel, et ce sont ceux que l'utilisateur lisait
		   avant de choisir un scénario dont son lot ne portait aucune trace. */
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: null });
		expect(SCENARIOS_NON_LIVRES.map((s) => s.id)).toEqual(['domaine', 'prepare']);
		expect(rendu).not.toContain('Importer un domaine complet');
		expect(rendu).not.toContain('Importer un corpus préparé');
	});

	/**
	 * LE CONTRÔLE QUI MANQUAIT, ET CE QU'IL AURAIT ARRÊTÉ.
	 *
	 * Le cas ci-dessus cherche les NOMS du gel. Cherchés ainsi, ils suffisaient
	 * à laisser passer l'étape 2 : l'aide de la case « Simulation » recommande
	 * de vérifier un corpus préparé — le scénario `UC-M12-03` — sous une autre
	 * forme que son nom de vignette, et l'y rebrancher l'aurait rendue visible
	 * sous le seul scénario offert sans qu'aucun cas ne rougisse. C'est arrivé.
	 *
	 * Ce cas cherche donc la RACINE du mot, sur les quatre étapes, et exige de
	 * chaque occurrence qu'elle soit portée par un élément servi caché.
	 */
	it('ne sert aucune mention VISIBLE d’un scénario que l’import n’exécute pas', () => {
		for (const vecteur of VECTEURS) {
			const rendu = corps('V-24', { ...SOCLE_V24, vecteur });
			const laCase = borneServie(rendu, 'champ-simulation', 'label');
			expect(laCase.ouvrante).toContain('hidden');
			const mentions = positionsDe(rendu, 'prépar');
			expect(mentions.length).toBeGreaterThan(0);
			for (const position of mentions) {
				expect(position > laCase.debut && position < laCase.fin).toBe(true);
			}
		}
	});

	it('ne demande plus un nom de domaine que personne ne lisait', () => {
		/* « Nom du domaine à créer * » était OBLIGATOIRE à l'écran et n'était
		   envoyé nulle part : ni `+page.svelte`, ni l'action ne le lisaient. */
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: { et: '2' } });
		expect(rendu).not.toContain('nom-domaine');
		expect(rendu).not.toContain('Nom du domaine à créer');
	});

	it('ne promet plus la résolution automatique des liens', () => {
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: null });
		expect(rendu).not.toContain('liens entre documents sont résolus automatiquement');
	});

	it('n’invite plus à déposer une archive, que le classement écarte', () => {
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: { et: '2' } });
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

	it('ne mentionne un scénario non livré sous AUCUNE forme, dans ce qu’il sert', () => {
		/* Même exigence que sur V-24, et le même piège évité : la vignette
		   retirée, il ne doit rester aucune REFORMULATION du scénario.

		   L'état éprouvé est celui que le produit sert — le drapeau est faux,
		   `journalDImportsEnregistre()` le dit plus bas. L'autre branche rend le
		   journal du jeu de DÉMONSTRATION, dont les lignes nomment des imports
		   passés (`seeds/corpus.ts`) : ce sont des données, pas une offre, et
		   aucune table ne les produit aujourd'hui. */
		const rendu = corps('V-35', { journalImports: [], journalEnregistre: false });
		expect(rendu).not.toContain('prépar');
		expect(rendu).not.toContain('domaine complet');
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
