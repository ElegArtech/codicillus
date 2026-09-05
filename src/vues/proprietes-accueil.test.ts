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
	INSTANCE,
	MOI,
	UNIVERS,
	corpusPourVue,
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

/**
 * LES ÉTATS DE VIVACITÉ SERVIS — des valeurs de CONTRÔLE, distinctes du jeu de
 * semence : leurs titres n'y figurent pas, de sorte qu'un titre lu à l'écran ne
 * puisse venir que de la propriété.
 */
const UNIVERS_DE_CONTROLE = [
	{
		nom: 'Univers de contrôle T-07',
		couleur: '#1f5a3c',
		glyphe: 'boussole',
		ordre: 1,
		description: DESCRIPTION_DE_CONTROLE
	}
];

const VIVACITES = [
	{
		identifiant: 'ctrl-a',
		titre: 'Contrôle T-07 — à jour',
		univers: 'Univers de contrôle T-07',
		etat: 'ajour',
		libelle: 'À jour',
		compact: 'dans 67 j',
		reste: 67
	},
	{
		identifiant: 'ctrl-b',
		titre: 'Contrôle T-07 — bientôt',
		univers: 'Univers de contrôle T-07',
		etat: 'bientot',
		libelle: 'Bientôt à vérifier',
		compact: 'dans 6 j',
		reste: 6
	},
	{
		identifiant: 'ctrl-c',
		titre: 'Contrôle T-07 — obsolète',
		univers: 'Univers de contrôle T-07',
		etat: 'obsolete',
		libelle: 'Obsolète',
		compact: '110 j de retard',
		reste: -110
	}
];

describe('V-07 — accueil connecté', () => {
	/**
	 * CE QUE CE CAS PROUVE, ET C'EST L'OBJET DE LA CAMPAGNE : une source qui
	 * n'arrive pas ne rend PLUS le jeu de démonstration. Elle rendait « Bonjour
	 * Karim. » et « Codicillus 1.0.0 » sur toute instance, et rien ne protestait.
	 *
	 * ET L'ÉTAT VIDE NOMME LE GESTE : chacun des cinq blocs dit quoi faire, aucun
	 * n'affiche un zéro muet. C'est le chemin de l'instance neuve, celui qu'un
	 * écran vérifié sur une base semée ne prouve jamais.
	 */
	it('sans source servie, rien du jeu de démonstration n’atteint l’écran', async () => {
		const b = await corps('V-07', {});
		expect(b).not.toContain('Bonjour ' + MOI.prenom + '.'); // compte
		expect(b).toContain('Bonjour.');
		expect(b).not.toContain('Codicillus ' + INSTANCE.version); // instance
		expect(b).toContain('Votre bibliothèque ne contient encore aucune note.');
		// Les deux listes et le tableau disent le vide, ils ne l'affichent pas en zéro.
		expect(b).toContain('Rien à consulter pour l’instant');
		expect(b).toContain('Aucun univers');
		// Aucune note lisible : pas d'alerte, pas de compteur, pas de bilan.
		expect(b).not.toContain('surveiller=bientot');
	}, 60_000);

	it('la propriété fournie l’emporte', async () => {
		expect(await corps('V-07', { compte: SOPHIE })).toContain('Bonjour Sophie.');

		const peuple = await corps('V-07', { vivacites: VIVACITES, seuilBientot: 10 });
		// La salutation compte ce qui est servi, jamais le corpus du jeu.
		expect(peuple).toContain('3</b> notes dans votre bibliothèque, dont <b>1</b>');
		// Les deux alertes MÈNENT quelque part — une liste filtrée, pas un chevron mort.
		expect(peuple).toContain('surveiller=bientot');
		expect(peuple).toContain('surveiller=retard');
		// Le bilan nomme la plus ancienne des notes critiques, et son retard.
		expect(peuple).toContain('Contrôle T-07 — obsolète');
		expect(peuple).toContain('échéance dépassée de 110 jours');

		// Le seuil affiché est CELUI QUI EST SERVI : il est configurable en console.
		expect(await corps('V-07', { vivacites: VIVACITES, seuilBientot: 3 })).toContain(
			'dans les 3 prochains jours'
		);

		// Les deux listes de consultation, et leur sous-ligne propre.
		const listes = await corps('V-07', {
			vivacites: VIVACITES,
			recemment: [{ identifiant: 'ctrl-a', titre: 'Contrôle T-07 — à jour', minutes: 12 }],
			plusConsultees: [
				{ identifiant: 'ctrl-c', titre: 'Contrôle T-07 — obsolète', consultations: 412 }
			]
		});
		expect(listes).toContain('il y a 12 min');
		expect(listes).toContain('412 consultations');

		// Le tableau des univers groupe les états servis sous l'univers servi.
		const tableau = await corps('V-07', {
			vivacites: VIVACITES,
			univers: UNIVERS_DE_CONTROLE
		});
		expect(tableau).toContain('Univers de contrôle T-07');
		expect(tableau).toContain('3 notes');
	}, 60_000);

	/* ═══════════════════════════════════════════════════════════════════════
	   L'ÉCRAN NEUF OFFRE LE GESTE QU'IL CONSEILLE

	   Mesuré sur le produit construit, instance à zéro univers, session
	   administrateur : le bloc d'actions sortait VIDE sous un texte qui
	   conseille de rapatrier. Trois situations, trois suites, et une seule
	   vraie à la fois.
	   ═══════════════════════════════════════════════════════════════════════ */

	/** Le bloc d'amorce, commentaires de rendu retirés. */
	function amorce(rendu: string): string {
		const bloc = /<div class="vide">([\s\S]*?)<\/div>/.exec(rendu)?.[1] ?? '';
		return bloc.replace(/<!--[\s\S]*?-->/g, '').trim();
	}

	it('à zéro univers, l’administrateur reçoit le geste que l’écran conseille', async () => {
		const bloc = amorce(
			await corps('V-07', { univers: [], vivacites: [], ecriture: false, administrateur: true })
		);
		expect(bloc).not.toBe('');
		expect(bloc).toContain('/console/univers');
		expect(bloc).toContain('Créer votre premier univers');
		// Les deux gestes d'écriture restent gardés : leurs adresses rendent 404.
		expect(bloc).not.toContain('/notes/nouvelle');
	}, 60_000);

	it('à zéro univers, un compte qui n’est pas administrateur ne reçoit aucun bouton', async () => {
		const rendu = await corps('V-07', {
			univers: [],
			vivacites: [],
			ecriture: false,
			administrateur: false
		});
		expect(amorce(rendu)).not.toContain('<a');
		// Il reçoit tout de même la SUITE VRAIE, qui n'est pas un bouton.
		expect(rendu).toContain('Aucun univers ne vous est ouvert');
	}, 60_000);

	it('des univers et l’écriture ouverte : le geste est la première note', async () => {
		const bloc = amorce(
			await corps('V-07', {
				univers: UNIVERS,
				vivacites: [],
				ecriture: true,
				administrateur: true
			})
		);
		expect(bloc).toContain('/notes/nouvelle');
		expect(bloc).toContain('Créer votre première note');
		expect(bloc).not.toContain('/console/univers');
	}, 60_000);
});

describe('V-08 — recherche interne', () => {
	it('sans compte servi, la barre supérieure ne nomme plus le jeu', async () => {
		const b = await corps('V-08', {});
		expect(b).not.toContain(MOI.nom + ' — menu utilisateur');
		expect(b).not.toContain('Codicillus ' + INSTANCE.version);
	}, 60_000);

	it('la propriété fournie l’emporte', async () => {
		expect(await corps('V-08', { compte: SOPHIE })).toContain('Sophie Nguyen — menu utilisateur');
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
		expect(b).toContain('ligne-note__n">0 vue<');
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
