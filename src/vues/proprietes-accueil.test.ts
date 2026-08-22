/**
 * T-041 — LES QUATRE VUES ACCEPTENT LEURS SOURCES, ET LE DÉFAUT RESTE LE JEU.
 *
 * V-07, V-08, V-10 et V-11 lisaient les constantes du jeu de semence AU NIVEAU
 * DU MODULE : un chargeur de route pouvait passer `notes`, et rien d'autre
 * n'atteignait l'écran. « En attente de révision = 3 » s'affichait pour un
 * compte qui ne lit aucune note ; « Bonjour Karim. » était servi à Sophie
 * Nguyen. Ces sources sont désormais des propriétés OPTIONNELLES.
 *
 * DEUX PROPRIÉTÉS À PROUVER, ET IL FAUT LES DEUX :
 *
 *   1. LA PROPRIÉTÉ FOURNIE L'EMPORTE — sans quoi le câblage ne sert à rien ;
 *   2. LA PROPRIÉTÉ ABSENTE REND LE DÉFAUT — sans quoi le banc bougerait. Le
 *      mode démo ne passe que `etat`, `vecteur` et `notes` : c'est le défaut
 *      qui tient les 52 couples de ces quatre vues à zéro écart.
 *
 * POURQUOI UN SERVEUR VITE PLUTÔT QU'UN IMPORT DIRECT. `vitest.config.ts`
 * n'installe pas le greffon Svelte — un `.svelte` n'est pas importable depuis
 * un unitaire. Le composant est donc chargé par le graphe de modules de Vite,
 * comme le mode démo le fait, et `render` en vient AUSSI : deux exemplaires de
 * `svelte/internal/server` feraient rendre 500 à tout composant (ÉCART-013
 * É-1). Le serveur est en mode intergiciel : il n'ouvre aucun port, donc il ne
 * peut pas mesurer celui d'un voisin (P-22).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import {
	DETAIL_DOMAINES,
	DOMAINES,
	MODULES,
	UNIVERS,
	corpusPourVue,
	type EtatDInstance,
	type IdentifiantDeVue,
	type UtilisateurCourant
} from '../../seeds/corpus';

interface Rendu {
	readonly body: string;
	readonly head: string;
}

type Rendre = (composant: unknown, options: { props: Record<string, unknown> }) => Rendu;

let serveur: ViteDevServer;
let render: Rendre;

/** Le corps rendu d'une vue, vecteur nul, jeu de semence de la vue. */
async function corps(vue: IdentifiantDeVue, props: Record<string, unknown>): Promise<string> {
	const module = await serveur.ssrLoadModule(`/src/vues/${vue}.svelte`);
	return render(module.default, {
		props: { vecteur: null, notes: corpusPourVue(vue), ...props }
	}).body;
}

/* ── Les valeurs de contrôle, toutes distinctes de celles du jeu ─────────── */

/** Un utilisateur qui n'est pas `MOI` — le prénom et les initiales se lisent. */
const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

/** Une instance qui n'est pas `INSTANCE` — la version se lit au pied du rail. */
const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9', synchro: "à l'instant" };

const DESCRIPTION_DE_CONTROLE = 'Description de contrôle T-041, absente du jeu de semence.';

beforeAll(async () => {
	serveur = await createServer({
		configFile: new URL('../../vite.config.ts', import.meta.url).pathname,
		appType: 'custom',
		logLevel: 'silent',
		server: { middlewareMode: true, hmr: false, watch: null }
	});
	const svelte = await serveur.ssrLoadModule('svelte/server');
	render = svelte.render as Rendre;
}, 120_000);

afterAll(async () => {
	// P-22 — un lot ne laisse pas son serveur derrière lui.
	await serveur?.close();
});

describe('V-07 — accueil contributeur', () => {
	it('la propriété absente rend la constante du jeu de semence', async () => {
		const b = await corps('V-07', {});
		expect(b).toContain('Bonjour Karim.'); // compte
		expect(b).toContain('Codicillus 1.0.0'); // instance
		expect(b).toContain('>Projets</a>'); // univers
		expect(b).toContain('dans 4 domaines'); // domaines
		expect(b).toContain('Signalées par des collègues'); // revisions
		expect(b).toContain('evt evt--'); // activite
		expect(b).toContain('mises à jour cette semaine'); // modifications
		expect(b).not.toContain('tendance--stable'); // mesures7jPrec
		expect(b).not.toContain('-100 %'); // mesures7j
	}, 60_000);

	it('la propriété fournie l’emporte', async () => {
		expect(await corps('V-07', { compte: SOPHIE })).toContain('Bonjour Sophie.');
		expect(await corps('V-07', { instance: AUTRE_INSTANCE })).toContain('Codicillus 9.9.9');
		expect(await corps('V-07', { univers: [UNIVERS[0]] })).not.toContain('>Projets</a>');
		expect(await corps('V-07', { domaines: [DOMAINES[3]] })).toContain('dans 1 domaine');
		expect(await corps('V-07', { revisions: [] })).toContain('Rien de signalé');
		expect(await corps('V-07', { activite: [] })).toContain('Rien de neuf cette semaine');
		expect(await corps('V-07', { modifications: {} })).toContain("Aucune n'a bougé cette semaine");
		// Une table de mesure vide n'est pas un chiffre faux : c'est l'état neutre
		// que P-02 réclame quand la mesure n'a pas répondu. La tendance le dit.
		expect(await corps('V-07', { mesures7j: {} })).toContain('-100 %');
		expect(await corps('V-07', { mesures7jPrec: {} })).toContain('tendance--stable');
	}, 60_000);
});

describe('V-08 — recherche interne', () => {
	it('la propriété absente rend la constante du jeu de semence', async () => {
		const b = await corps('V-08', {});
		expect(b).toContain('Karim Belhadj — menu utilisateur');
		expect(b).toContain('Codicillus 1.0.0');
	}, 60_000);

	it('la propriété fournie l’emporte', async () => {
		expect(await corps('V-08', { compte: SOPHIE })).toContain('Sophie Nguyen — menu utilisateur');
		expect(await corps('V-08', { instance: AUTRE_INSTANCE })).toContain('Codicillus 9.9.9');
	}, 60_000);

	/**
	 * MESURÉ, ET DÉCLARÉ AU RAPPORT DE LOT : `univers` et `domaines` N'ONT AUCUN
	 * OBSERVABLE sur V-08. La vue ne les emploie que pour nourrir la coquille, et
	 * la coquille de FORME ABRÉGÉE rend un rail qui est une DONNÉE — les quinze
	 * nœuds écrits au balisage du gel, identiques à l'octet sur les 26 maquettes
	 * abrégées (ARB-021, A-1e). Le rail abrégé ne lit ni l'un ni l'autre.
	 *
	 * Les deux propriétés sont posées quand même : les noms sont contractuels, et
	 * un chargeur ne peut pas savoir quelle forme de coquille la vue emploie.
	 * L'invariance est ce qu'il y a à prouver ici — et si un lot branche un jour
	 * le rail abrégé, ce contrôle rougit AVANT le banc.
	 */
	it('univers et domaines sont acceptés et sans effet — rail abrégé écrit au balisage', async () => {
		const defaut = await corps('V-08', {});
		expect(await corps('V-08', { univers: [UNIVERS[0]] })).toBe(defaut);
		expect(await corps('V-08', { domaines: [DOMAINES[3]] })).toBe(defaut);
	}, 60_000);
});

describe('V-10 — page d’un univers', () => {
	it('la propriété absente rend la constante du jeu de semence', async () => {
		const b = await corps('V-10', {});
		expect(b).toContain('Karim Belhadj — menu utilisateur');
		expect(b).toContain('Codicillus 1.0.0');
		expect(b).toContain('<h1 id="titre">Production</h1>'); // univers
		expect(b).not.toContain('Cet univers ne contient aucun domaine'); // domaines
		expect(b).not.toContain('Rien de neuf cette semaine'); // activite
		expect(b).toContain(DETAIL_DOMAINES['Infrastructure']?.description ?? ''); // detailDomaines
		expect(b).toContain(MODULES.carteMentale.sous); // modules
	}, 60_000);

	it('la propriété fournie l’emporte', async () => {
		expect(await corps('V-10', { compte: SOPHIE })).toContain('Sophie Nguyen — menu utilisateur');
		expect(await corps('V-10', { instance: AUTRE_INSTANCE })).toContain('Codicillus 9.9.9');
		expect(await corps('V-10', { univers: [UNIVERS[1], UNIVERS[0]] })).toContain(
			'<h1 id="titre">Projets</h1>'
		);
		expect(await corps('V-10', { domaines: [DOMAINES[3]] })).toContain(
			'Cet univers ne contient aucun domaine'
		);
		expect(await corps('V-10', { activite: [] })).toContain('Rien de neuf cette semaine');
		const detaille = await corps('V-10', {
			detailDomaines: {
				...DETAIL_DOMAINES,
				Infrastructure: { description: DESCRIPTION_DE_CONTROLE, modules: ['signets'] }
			}
		});
		expect(detaille).toContain(DESCRIPTION_DE_CONTROLE);
		// P-04 — un module retiré du domaine disparaît de sa carte.
		expect(detaille).not.toContain(MODULES.carteMentale.sous);
		expect(
			await corps('V-10', {
				modules: {
					...MODULES,
					carteMentale: { nom: 'Carte mentale', sous: 'Sous-titre de contrôle T-041' }
				}
			})
		).toContain('Sous-titre de contrôle T-041');
	}, 60_000);
});

describe('V-11 — page d’un domaine', () => {
	it('la propriété absente rend la constante du jeu de semence', async () => {
		const b = await corps('V-11', {});
		expect(b).toContain('Karim Belhadj — menu utilisateur');
		expect(b).toContain('Codicillus 1.0.0');
		expect(b).toContain('<h1 id="titre">Infrastructure</h1>'); // domaines
		expect(b).toContain(DETAIL_DOMAINES['Infrastructure']?.description ?? ''); // detailDomaines
		expect(b).toContain('module__nom">Notes'); // modules
		expect(b).toContain('Signalées par des collègues'); // revisions
		expect(b).not.toContain('ligne-note__n">0 vues<'); // mesures7j
		expect(b).not.toContain('ligne-note__n">—<'); // modifications
	}, 60_000);

	it('la propriété fournie l’emporte', async () => {
		expect(await corps('V-11', { compte: SOPHIE })).toContain('Sophie Nguyen — menu utilisateur');
		expect(await corps('V-11', { instance: AUTRE_INSTANCE })).toContain('Codicillus 9.9.9');
		expect(await corps('V-11', { domaines: [DOMAINES[3]] })).toContain(
			'<h1 id="titre">Migration 2026</h1>'
		);
		expect(await corps('V-11', { revisions: [] })).toContain('Rien de signalé');
		// Table de mesure vide : zéro consulté et ancienneté inconnue, jamais un
		// chiffre repris d'ailleurs.
		expect(await corps('V-11', { mesures7j: {} })).toContain('ligne-note__n">0 vues<');
		expect(await corps('V-11', { modifications: {} })).toContain('ligne-note__n">—<');
		const detaille = await corps('V-11', {
			detailDomaines: {
				...DETAIL_DOMAINES,
				Infrastructure: { description: DESCRIPTION_DE_CONTROLE, modules: ['signets'] }
			}
		});
		expect(detaille).toContain(DESCRIPTION_DE_CONTROLE);
		// P-04 — la section « Accès » suit les modules du domaine, elle ne les
		// devine pas.
		expect(detaille).not.toContain('module__nom">Notes');
		expect(
			await corps('V-11', {
				modules: { ...MODULES, notes: { nom: 'Notes de contrôle T-041', sous: MODULES.notes.sous } }
			})
		).toContain('module__nom">Notes de contrôle T-041');
	}, 60_000);

	/**
	 * MESURÉ, ET DÉCLARÉ AU RAPPORT DE LOT : `univers` n'a AUCUN OBSERVABLE sur
	 * V-11 — même cause qu'en V-08, le rail de forme abrégée est une donnée écrite
	 * au balisage (ARB-021, A-1e), et l'univers du fil vient du domaine courant,
	 * pas de la liste. La propriété est posée parce que son nom est contractuel.
	 */
	it('univers est accepté et sans effet — rail abrégé écrit au balisage', async () => {
		const defaut = await corps('V-11', {});
		expect(await corps('V-11', { univers: [UNIVERS[0]] })).toBe(defaut);
	}, 60_000);
});
