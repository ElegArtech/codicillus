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
		expect(defaut).toContain('<a href="#">Infrastructure</a>');
		expect(defaut).toContain('<b>2</b> sous-dossiers');

		const html = await rendu({ domaine: 'Applications' });
		expect(html).toContain('<a href="#">Applications</a>');
		expect(html).not.toContain('<a href="#">Infrastructure</a>');
		expect(html).toContain('<b>0</b> sous-dossier');
	});

	it('lit l’univers du domaine dans la liste de domaines reçue', async () => {
		/* Le fil d'Ariane, et non le rail : le rail abrégé porte une section
		   « Projets » écrite au balisage, qu'une assertion large trouverait sans
		   rien mesurer (P-5). */
		expect(await rendu({})).toContain('<a href="#">Production</a>');
		const html = await rendu({
			domaine: 'Migration 2026',
			domaines: [{ nom: 'Migration 2026', univers: 'Projets', couleur: '#3e5266' }]
		});
		expect(html).toContain('<a href="#">Projets</a>');
		expect(html).not.toContain('<a href="#">Production</a>');
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
		expect(html).toContain('<a href="#">Infrastructure</a>');
		expect(html).toContain(`<a href="#">${UNIVERS[0]?.nom}</a>`);
	});
});
