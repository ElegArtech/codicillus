/**
 * V-12 — LES PROPRIÉTÉS DE CONTEXTE (T-042).
 *
 * CE QUE CE FICHIER PROUVE, ET RIEN D'AUTRE : la propriété fournie l'emporte,
 * la propriété absente retombe sur la constante du jeu de semence. Il ne dit
 * rien de la conformité au gel — c'est `pnpm verif:maquette V-12 --contre=app`
 * qui la mesure, et lui seul.
 *
 * LA SECONDE MOITIÉ EST LA PLUS IMPORTANTE. Un contrôle qui n'éprouverait que
 * la substitution laisserait passer un défaut de DÉFAUT, et un défaut de défaut
 * fait bouger les 409 couples du banc sans qu'aucun unitaire ne le voie (P-5 :
 * une règle doit être éprouvée dans les deux polarités).
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import {
	corpusPourVue,
	DOMAINES,
	INSTANCE,
	MODIFICATIONS,
	MOI,
	UNIVERS,
	type EtatDInstance,
	type UtilisateurCourant
} from '../../seeds/corpus';

const NOTES = corpusPourVue('V-12');

/** Une identité qui n'est PAS celle du jeu de semence — le défaut mesuré. */
const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9-epreuve', synchro: "à l'instant" };

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-12', { vecteur: null, notes: NOTES, ...proprietes });
}

afterAll(fermerLeHarnais);

describe('V-12 — la propriété fournie l’emporte', () => {
	it('sert le compte reçu, et non celui du jeu de semence', async () => {
		const html = await rendu({ compte: SOPHIE });
		/* La désignation du menu utilisateur — le seul endroit où le compte
		   COURANT est nommé. Le nom de `MOI` figure par ailleurs comme AUTEUR de
		   notes du corpus : le chercher tel quel mesurerait le corpus, pas la
		   propriété. */
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('sert la version d’instance reçue', async () => {
		expect(await rendu({ instance: AUTRE_INSTANCE })).toContain('9.9.9-epreuve');
	});

	it('sert la liste de domaines reçue — le domaine courant en sort', async () => {
		const html = await rendu({ domaines: DOMAINES.filter((d) => d.nom === 'Applications') });
		expect(html).toContain('Notes de Applications');
	});

	it('sert la table de modifications reçue', async () => {
		expect(await rendu({})).toContain('modifiée il y a 3 jours');
		const html = await rendu({ modifications: { 'n-restaurer-pg': 42 } });
		expect(html).toContain('modifiée il y a 42 jours');
		/* Une table PARTIELLE est admise, et ce qu'elle ne porte pas se DIT
		   plutôt que de se combler par une valeur d'illustration (P-02). */
		expect(html).toContain('date de modification inconnue');
	});

	/**
	 * `univers` N'A AUCUN EFFET DE RENDU DANS UNE VUE DE FORME ABRÉGÉE, et ce
	 * n'est pas un oubli de ce contrôle : `Coquille.svelte` le dit en propres
	 * termes — « en forme abrégée, `univers`, `domaines`, `notes` et
	 * `brancheEnChargement` ne servent PAS au rail : il ne se dérive pas du
	 * corpus », l'arborescence de quinze nœuds étant ÉCRITE AU BALISAGE
	 * (`arborescence-abregee.ts`).
	 *
	 * Écrire ici un contrôle qui « passerait » sur du balisage figé serait une
	 * règle qu'aucun cas n'exerce (P-5) : il rendrait le même verdict avec ou
	 * sans la propriété. La preuve de `univers` est portée par V-14, seule vue
	 * de forme COMPLÈTE de ce lot, où le rail se dérive réellement.
	 */
	it('accepte la liste d’univers reçue sans rien changer au rail abrégé', async () => {
		const restreint = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Projets') });
		expect(restreint).toEqual(await rendu({}));
	});
});

describe('V-12 — la propriété absente retombe sur la constante du jeu', () => {
	it('rend le compte, la version et le premier domaine du jeu de semence', async () => {
		const html = await rendu({});
		expect(html).toContain(`${MOI.nom} — menu utilisateur`);
		expect(html).toContain(MOI.initiales);
		expect(html).toContain(INSTANCE.version);
		expect(html).toContain(`Notes de ${DOMAINES[0]?.nom}`);
	});

	it('rend les anciennetés de la table du jeu de semence', async () => {
		const html = await rendu({});
		expect(html).toContain(`modifiée il y a ${MODIFICATIONS['n-restaurer-pg']} jours`);
		expect(html).not.toContain('date de modification inconnue');
	});

	it('rend l’arborescence abrégée du gel, que le corpus ne produit pas', async () => {
		const html = await rendu({});
		expect(html).toContain('Ordonnancement');
		expect(html).toContain('Astreinte');
	});
});
