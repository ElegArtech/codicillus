/**
 * V-13 — LES PROPRIÉTÉS DE CONTEXTE, ET LE DOMAINE (T-042).
 *
 * `T-032` avait mesuré le défaut : `const DOMAINE = 'Infrastructure'` en tête
 * du script faisait rendre l'arborescence d'Infrastructure pour l'adresse de
 * n'importe quel domaine. La propriété le referme, DÉFAUT INCHANGÉ.
 *
 * CE QUE CE FICHIER PROUVE, ET RIEN D'AUTRE : la propriété fournie l'emporte,
 * la propriété absente retombe sur la valeur du gel. La conformité de rendu est
 * mesurée par `pnpm verif:maquette V-13 --contre=app`, et par lui seul.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import {
	corpusPourVue,
	INSTANCE,
	MOI,
	UNIVERS,
	type EtatDInstance,
	type UtilisateurCourant
} from '../../seeds/corpus';
import { cheminAffiche, segmentsAffiches, type LigneDeDossier } from '../lib/donnees/rangement';

const NOTES = corpusPourVue('V-13');

const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9-epreuve', synchro: "à l'instant" };

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-13', { vecteur: null, notes: NOTES, ...proprietes });
}

/**
 * Le fil d'Ariane seul, découpé du rendu.
 *
 * Ces cas repéraient un segment du fil par `<a href="#">Nom</a>` : le gel n'y
 * déclarait aucune destination, et le lien mort faisait un marqueur unique. Le
 * fil porte désormais de vraies adresses (plan de remédiation §3.6), et le
 * marqueur ne peut plus être un `href`. Ce qui est éprouvé est INCHANGÉ — quel
 * nom le fil porte —, et le découpage rend au marqueur l'unicité que le lien
 * mort lui donnait : le rail nomme les mêmes domaines, mais hors de ce `<nav>`.
 */
function filDe(html: string): string {
	return /<nav class="fil"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
}

afterAll(fermerLeHarnais);

describe('V-13 — la propriété fournie l’emporte', () => {
	it('sert le compte reçu, et non celui du jeu de semence', async () => {
		const html = await rendu({ compte: SOPHIE });
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('sert la version d’instance reçue', async () => {
		expect(await rendu({ instance: AUTRE_INSTANCE })).toContain('9.9.9-epreuve');
	});

	/**
	 * LE DÉFAUT DE `T-032`, MESURÉ DANS LES DEUX POLARITÉS. Le dossier demandé —
	 * `Exploitation`, valeur par défaut du vecteur — n'existe QUE dans
	 * Infrastructure : sous un autre domaine, la page rend son état sans
	 * sous-dossier, ce qu'elle ne pouvait pas faire tant que le domaine était
	 * une constante.
	 */
	it('range la page dans le domaine reçu, jamais dans Infrastructure par défaut', async () => {
		/* Le témoin de polarité — sans lui, les assertions négatives qui suivent
		   passeraient même si la propriété était inerte (P-5). */
		const defaut = await rendu({});
		expect(filDe(defaut)).toContain('>Infrastructure</a>');
		expect(defaut).toContain('<b>2</b> sous-dossiers');

		const html = await rendu({ domaine: 'Applications' });
		expect(filDe(html)).toContain('>Applications</a>');
		expect(filDe(html)).not.toContain('>Infrastructure</a>');
		expect(html).toContain('<b>0</b> sous-dossier');
	});

	it('lit l’univers du domaine dans la liste de domaines reçue', async () => {
		/* Le fil d'Ariane, et non le rail : le rail abrégé porte une section
		   « Projets » écrite au balisage, qu'une assertion large trouverait sans
		   rien mesurer (P-5). */
		expect(filDe(await rendu({}))).toContain('>Production</a>');
		const html = await rendu({
			domaine: 'Migration 2026',
			domaines: [{ nom: 'Migration 2026', univers: 'Projets', couleur: '#3e5266' }]
		});
		expect(filDe(html)).toContain('>Projets</a>');
		expect(filDe(html)).not.toContain('>Production</a>');
	});

	it('sert la table de modifications reçue', async () => {
		expect(await rendu({})).not.toContain('modification inconnue');
		/* Une table PARTIELLE est admise, et ce qu'elle ne porte pas se DIT
		   plutôt que de se combler par une valeur d'illustration (P-02). */
		expect(await rendu({ modifications: {} })).toContain('modification inconnue');
	});

	/** Vue de forme ABRÉGÉE : `univers` ne sert pas au rail (`Coquille.svelte`). */
	it('accepte la liste d’univers reçue sans rien changer au rail abrégé', async () => {
		const restreint = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Projets') });
		expect(restreint).toEqual(await rendu({}));
	});
});

describe('V-13 — la propriété absente retombe sur la valeur du gel', () => {
	it('rend le compte et la version du jeu de semence', async () => {
		const html = await rendu({});
		expect(html).toContain(`${MOI.nom} — menu utilisateur`);
		expect(html).toContain(INSTANCE.version);
	});

	it('rend le domaine Infrastructure et son univers Production', async () => {
		const html = await rendu({});
		expect(filDe(html)).toContain('>Infrastructure</a>');
		expect(filDe(html)).toContain(`>${UNIVERS[0]?.nom}</a>`);
	});
});

/**
 * LA PAGE DE LA RACINE D'UN DOMAINE — et la forme éprouvée est PRODUITE, non
 * recopiée.
 *
 * Le défaut mesuré : `noeudDe([])` sortait de sa boucle sans rien trouver, donc
 * la racine n'annonçait jamais ses sous-dossiers et son titre était vide. On
 * créait un dossier, il disparaissait de l'écran qui venait de le créer.
 *
 * CE QUI FAIT LA VALEUR DE CE CAS, C'EST QU'IL NE FABRIQUE PAS SON ENTRÉE. La
 * suite vide de la racine et la chaîne vide du vecteur ne sont pas écrites ici :
 * elles sortent de `segmentsAffiches()` et de `cheminAffiche()`, les deux
 * fonctions que le chargeur appelle pour composer `rangement.destinations` et
 * `vecteur.dos`. Un cas qui poserait la chaîne vide à la main partagerait avec
 * le code l'hypothèse qu'il prétend éprouver.
 */
const LIGNES: readonly LigneDeDossier[] = [
	{
		id: 'r-infra',
		parentId: null,
		domaineId: 'd1',
		nom: 'Infrastructure',
		profondeur: 1,
		position: 0
	},
	{
		id: 'expl',
		parentId: 'r-infra',
		domaineId: 'd1',
		nom: 'Exploitation',
		profondeur: 2,
		position: 0
	},
	{ id: 'serv', parentId: 'r-infra', domaineId: 'd1', nom: 'Serveurs', profondeur: 2, position: 1 },
	{ id: 'sauv', parentId: 'expl', domaineId: 'd1', nom: 'Sauvegardes', profondeur: 3, position: 0 }
];

/** Exactement ce que le chargeur compose, par les mêmes fonctions que lui. */
function rangementDe(dossierId: string): Record<string, unknown> {
	return {
		destinations: LIGNES.map((d) => ({
			id: d.id,
			segments: segmentsAffiches(LIGNES, d.id),
			refus: null
		})),
		dossierId,
		parentId: LIGNES.find((d) => d.id === dossierId)?.parentId ?? ''
	};
}

function renduDe(dossierId: string): Promise<string> {
	return rendreLaVue('V-13', {
		vecteur: { dos: cheminAffiche(segmentsAffiches(LIGNES, dossierId)), dr: 'gestionnaire' },
		notes: NOTES,
		domaine: 'Infrastructure',
		universDuDomaine: 'Production',
		rangement: rangementDe(dossierId)
	});
}

describe('V-13 — la racine d’un domaine se comporte comme un dossier', () => {
	it('liste ses sous-dossiers et porte le nom du domaine', async () => {
		const html = await renduDe('r-infra');
		expect(html).toContain('<b>2</b> sous-dossiers');
		expect(html).toContain('<span id="titre">Infrastructure</span>');
		expect(html).toContain('Exploitation');
		expect(html).toContain('Serveurs');
	});

	it('n’annonce plus « aucun sous-dossier » sur une racine qui en porte', async () => {
		/* Le bloc d'état vide est rendu masqué : c'est son attribut qu'on lit, non
		   sa présence. */
		expect(await renduDe('r-infra')).toContain('id="bloc-vide" hidden');
	});

	/**
	 * `renommerOuDeplacerUnDossier()` et `supprimerUnDossier()` refusent MUETTEMENT
	 * tout dossier sans parent. Les deux gestes sont donc omis sur la racine, avec
	 * leurs dialogues — `P-03`, `P-09`.
	 */
	it('n’offre ni « Renommer ou déplacer » ni « Supprimer » sur la racine', async () => {
		const racine = await renduDe('r-infra');
		expect(racine).not.toContain('id="a-renommer"');
		expect(racine).not.toContain('id="a-supprimer"');
		expect(racine).not.toContain('id="dlg-deplacer"');
		expect(racine).not.toContain('id="dlg-supprimer"');
		/* Le témoin de polarité : les deux gestes existent bien un niveau plus bas. */
		const enfant = await renduDe('expl');
		expect(enfant).toContain('id="a-renommer"');
		expect(enfant).toContain('id="a-supprimer"');
	});

	it('nomme le domaine comme parent du sous-dossier à créer', async () => {
		expect(await renduDe('r-infra')).toContain('id="creer-parent">Infrastructure<');
		expect(await renduDe('expl')).toContain('id="creer-parent">Exploitation<');
	});

	it('n’a pas fait régresser un dossier de profondeur 2', async () => {
		const html = await renduDe('expl');
		expect(html).toContain('<b>1</b> sous-dossier');
		expect(html).toContain('<span id="titre">Exploitation</span>');
	});
});
