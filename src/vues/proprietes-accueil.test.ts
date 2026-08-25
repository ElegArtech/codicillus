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
	DOMAINES,
	UNIVERS,
	corpusPourVue,
	type EtatDInstance,
	type IdentifiantDeVue,
	type UtilisateurCourant
} from '../../seeds/corpus';
import { CATALOGUE_DE_MODULES } from '../lib/rangement/modules';
import type { CompteAffiche } from '../lib/coquille/identite';

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
		// LE SURVEILLANT NE DOIT PAS DESCENDRE DANS .claude/worktrees/ NI DANS build/.
		// Il parcourt toute la racine ; sous .claude/worktrees/ vivent des copies
		// complètes du dépôt, et les veilleurs du système s'épuisent : la série sort
		// en ENOSPC, ses tests verts compris. Le surveillant attend un prédicat, pas
		// un motif : les jokers y sont inertes, et `watch: null` ne l'éteint pas —
		// il ne fait que lui retirer ce filtre.
		server: {
			middlewareMode: true,
			hmr: false,
			watch: {
				ignored: (chemin: string) => chemin.includes('/.claude') || chemin.includes('/build/')
			}
		}
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

/* ═════════════════════════════════════════════════════════════════════════
   V-10 ET V-11 — LE MOTIF EST RETIRÉ, ET C'EST L'AUTRE POLARITÉ QUI EST ÉPROUVÉE

   Ces deux vues ont déclaré leurs sources OPTIONNELLES, de défaut la constante
   de `seeds/corpus.ts`. Ce défaut garantissait qu'une route qui en oubliait une
   servait le jeu de démonstration SANS QUE RIEN NE PROTESTE, et les cas
   « la propriété absente rend la constante du jeu » l'épinglaient comme un
   acquis. Ils sont retirés avec lui.

   CE QUI EST ÉPROUVÉ MAINTENANT, et ce sont les deux moitiés du geste :
     1. LA PROPRIÉTÉ SERVIE DÉCIDE — sans quoi le câblage est décoratif ;
     2. RIEN DU JEU N'ATTEINT L'ÉCRAN quand les sources servies ne le portent
        pas — c'est la garantie qu'aucune constante ne s'est glissée derrière.

   Le compilateur tient la troisième moitié : ces propriétés sont REQUISES, et
   `svelte-check` refuse une route qui en oublierait une (`pnpm check`).
   ═════════════════════════════════════════════════════════════════════════ */

/** Un univers qui n'est pas le premier du jeu — le titre le nomme. */
const UNIVERS_PROJETS = UNIVERS.filter((u) => u.nom === 'Projets');
/** Un domaine, et un seul — celui de « Projets ». */
const DOMAINE_MIGRATION = DOMAINES.filter((d) => d.nom === 'Migration 2026');

/**
 * L'IDENTITÉ DANS LA FORME QUE LA COQUILLE AFFICHE, dérivée de `SOPHIE` plutôt
 * que recopiée : deux littéraux divergeraient sans qu'aucun compilateur ne le
 * voie, et le contrôle mesurerait sa propre copie.
 */
const SOPHIE_AFFICHEE: CompteAffiche = {
	nom: SOPHIE.nom,
	initiales: SOPHIE.initiales,
	role: SOPHIE.role,
	domaine: SOPHIE.domaine
};

describe('V-10 — page d’un univers', () => {
	/** Le strict nécessaire pour rendre l'écran, sans une ligne du jeu. */
	const SOCLE_VIDE = {
		univers: UNIVERS_PROJETS,
		domaines: [],
		detailDomaines: {},
		activite: [],
		modules: CATALOGUE_DE_MODULES
	};

	it('l’univers rendu est celui de la liste servie', async () => {
		const b = await corps('V-10', { ...SOCLE_VIDE, notes: [] });
		expect(b).toContain('<h1 id="titre">Projets</h1>');
		expect(b).not.toContain('<h1 id="titre">Production</h1>');
	});

	it('sans domaine servi, l’univers rend son état vide', async () => {
		const b = await corps('V-10', { ...SOCLE_VIDE, notes: [] });
		expect(b).toContain('Cet univers ne contient aucun domaine');
	});

	/**
	 * LE CONTRÔLE QUI TIENT TOUT LE LOT : sur des sources qui ne portent rien du
	 * jeu, rien du jeu ne doit apparaître. Un défaut de propriété resté quelque
	 * part se verrait ici, et nulle part ailleurs.
	 *
	 * LA MESURE EST DÉCOUPÉE SUR LE CONTENU, ET C'EST DÉCLARÉ. Le rail de forme
	 * ABRÉGÉE est une DONNÉE écrite au balisage du gel
	 * (`arborescence-abregee.ts`) : hors gabarit racine — ce que rend ce harnais
	 * —, il nomme les dossiers du gel. En application il suit la base
	 * (`Coquille.svelte`, `sectionsAbregeesDuCorpus`). Mesurer le document
	 * entier mesurerait ce balisage, pas les propriétés de la vue.
	 */
	it('aucune ligne du jeu de démonstration n’atteint le contenu', async () => {
		const b = await corps('V-10', { ...SOCLE_VIDE, notes: [] });
		const contenu = /<main[\s\S]*?<\/main>/.exec(b)?.[0] ?? '';
		expect(contenu).not.toContain('Karim Belhadj');
		expect(contenu).not.toContain('Infrastructure');
		expect(contenu).not.toContain('Restaurer une sauvegarde PostgreSQL');
		expect(b).not.toContain('Karim Belhadj — menu utilisateur');
		expect(b).not.toContain('Codicillus 1.0.0');
	});

	it('l’identité servie l’emporte', async () => {
		const b = await corps('V-10', { ...SOCLE_VIDE, notes: [], compte: SOPHIE_AFFICHEE });
		expect(b).toContain('Sophie Nguyen — menu utilisateur');
	});

	it('sans activité servie, la semaine se dit vide', async () => {
		expect(await corps('V-10', { ...SOCLE_VIDE, notes: [] })).toContain(
			'Rien de neuf cette semaine'
		);
	});

	/**
	 * LES PASTILLES DE MODULE — deux sources, et elles sont distinctes. Les CLÉS
	 * actives viennent de `detailDomaines`, donc de `modules_de_domaine`
	 * (`RG-STR-06`) ; les LIBELLÉS du catalogue de produit. `P-04` : un module
	 * retiré du domaine disparaît de sa carte.
	 */
	it('les pastilles suivent les modules du domaine, et se nomment par le catalogue', async () => {
		const b = await corps('V-10', {
			...SOCLE_VIDE,
			domaines: DOMAINE_MIGRATION,
			detailDomaines: {
				'Migration 2026': { description: DESCRIPTION_DE_CONTROLE, modules: ['signets'] }
			},
			notes: []
		});
		expect(b).toContain(DESCRIPTION_DE_CONTROLE);
		expect(b).toContain(CATALOGUE_DE_MODULES.signets.nom);
		expect(b).not.toContain(CATALOGUE_DE_MODULES.carteMentale.sous);
	});

	/**
	 * UNE CLÉ STOCKÉE QUE LE CATALOGUE NE PORTE PAS NE MET PAS L'ÉCRAN EN ERREUR.
	 * `modules[m].nom` la déréférençait sans garde : une énumération élargie en
	 * base avant que le catalogue ne suive faisait sortir la page en 500.
	 */
	it('une clé de module inconnue du catalogue se nomme par elle-même', async () => {
		const b = await corps('V-10', {
			...SOCLE_VIDE,
			domaines: DOMAINE_MIGRATION,
			detailDomaines: {
				'Migration 2026': { description: '', modules: ['module-a-venir'] }
			},
			notes: []
		});
		expect(b).toContain('module-a-venir');
	});
});

describe('V-11 — page d’un domaine', () => {
	/** Le strict nécessaire pour rendre l'écran, sans une ligne du jeu. */
	const SOCLE_VIDE = {
		univers: UNIVERS_PROJETS,
		domaines: DOMAINE_MIGRATION,
		detailDomaines: { 'Migration 2026': { description: '', modules: ['notes'] } },
		mesures7j: {},
		modifications: {},
		revisions: [],
		modules: CATALOGUE_DE_MODULES
	};

	it('le domaine rendu est celui de la liste servie', async () => {
		const b = await corps('V-11', { ...SOCLE_VIDE, notes: [] });
		expect(b).toContain('<h1 id="titre">Migration 2026</h1>');
		expect(b).not.toContain('<h1 id="titre">Infrastructure</h1>');
	});

	/* Même découpage qu'en V-10, et pour la même raison : le rail abrégé est une
	   donnée du gel tant qu'aucun gabarit racine ne lui sert la base. */
	it('aucune ligne du jeu de démonstration n’atteint le contenu', async () => {
		const b = await corps('V-11', { ...SOCLE_VIDE, notes: [] });
		const contenu = /<main[\s\S]*?<\/main>/.exec(b)?.[0] ?? '';
		expect(contenu).not.toContain('Karim Belhadj');
		expect(contenu).not.toContain('Restaurer une sauvegarde PostgreSQL');
		expect(b).not.toContain('Karim Belhadj — menu utilisateur');
		expect(b).not.toContain('Codicillus 1.0.0');
	});

	it('l’identité servie l’emporte', async () => {
		const b = await corps('V-11', { ...SOCLE_VIDE, notes: [], compte: SOPHIE_AFFICHEE });
		expect(b).toContain('Sophie Nguyen — menu utilisateur');
	});

	it('sans demande de révision servie, rien n’est signalé', async () => {
		expect(await corps('V-11', { ...SOCLE_VIDE, notes: [] })).toContain('Rien de signalé');
	});

	/* Tables de mesure vides : zéro consulté et ancienneté inconnue, jamais un
	   chiffre repris d'ailleurs (`P-02`). */
	it('une table de mesure vide se dit, elle ne se comble pas', async () => {
		const notes = corpusPourVue('V-11').filter((n) => n.domaine === 'Migration 2026');
		const b = await corps('V-11', { ...SOCLE_VIDE, notes });
		expect(b).toContain('ligne-note__n">0 vues<');
		expect(b).toContain('ligne-note__n">—<');
	});

	/* LE LIBELLÉ DE JOUR ZÉRO. `joursEcoules()` rend 0 en deçà de vingt-quatre
	   heures, et la vue disait « hier » d'une note modifiée le jour même. */
	it('une modification du jour se dit « aujourd’hui », jamais « hier »', async () => {
		const notes = corpusPourVue('V-11').filter((n) => n.domaine === 'Migration 2026');
		const premiere = notes[0];
		if (premiere === undefined) throw new Error('le corpus de V-11 ne porte pas Migration 2026');
		const b = await corps('V-11', {
			...SOCLE_VIDE,
			notes,
			modifications: { [premiere.id]: 0 }
		});
		expect(b).toContain("aujourd'hui");
	});

	/**
	 * LA SECTION « ACCÈS » SUIT LES MODULES DU DOMAINE — `P-04` —, et les nomme
	 * par le catalogue de produit, jamais par une constante du jeu.
	 */
	it('la section « Accès » suit les modules du domaine et le catalogue', async () => {
		const b = await corps('V-11', {
			...SOCLE_VIDE,
			detailDomaines: {
				'Migration 2026': { description: DESCRIPTION_DE_CONTROLE, modules: ['signets'] }
			},
			notes: []
		});
		expect(b).toContain(DESCRIPTION_DE_CONTROLE);
		expect(b).toContain(`module__nom">${CATALOGUE_DE_MODULES.signets.nom}`);
		expect(b).not.toContain(`module__nom">${CATALOGUE_DE_MODULES.notes.nom}`);
	});

	it('une clé de module inconnue du catalogue se nomme par elle-même', async () => {
		const b = await corps('V-11', {
			...SOCLE_VIDE,
			detailDomaines: {
				'Migration 2026': { description: '', modules: ['module-a-venir'] }
			},
			notes: []
		});
		expect(b).toContain('module-a-venir');
	});
});
