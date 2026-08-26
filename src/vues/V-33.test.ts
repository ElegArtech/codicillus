/**
 * V-33 — LES BLOCS D'ERREUR QUE LE PEINTRE VA CHERCHER.
 *
 * CE QUE CE FICHIER PROUVE, ET RIEN D'AUTRE : les sept champs que
 * `validerLaConfiguration()` sait refuser ont, dans l'écran RENDU, les trois
 * nœuds que `peindreLesRefusDeConfiguration()` interroge — `#champ-{id}`,
 * `#erreur-{id}` et `#erreur-{id}-txt`.
 *
 * POURQUOI CE CONTRÔLE-LÀ. Le peintre ne lève pas quand un nœud manque : il
 * passe. Un refus rattaché à un champ sans bloc serait donc un enregistrement
 * qui n'aboutit pas et que l'écran n'annonce pas — le défaut de l'échec muet,
 * et la seule chose qui le distingue du cas réparé est la présence de ces
 * nœuds. Trois d'entre eux viennent d'être ajoutés (versions, taille, session),
 * et rien d'autre ne les tenait.
 *
 * LES IDENTIFIANTS NE SONT PAS RECOPIÉS À LA MAIN : ils sont DÉRIVÉS du type
 * `ErreurDeConfiguration` par la liste que le peintre lui-même emploie, et
 * l'écran est celui que le produit rend, pas un gabarit reconstruit ici.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import { CONFIGURATION_PAR_DEFAUT } from '../lib/base/schema';
import { CHAMPS_DE_CONFIGURATION } from '../lib/donnees/administration';
import { corpusPourVue } from '../../seeds/corpus';

afterAll(fermerLeHarnais);

const NOTES = corpusPourVue('V-33');

/** Les sept champs refusables, par leur suffixe de bloc — `ErreurDeConfiguration`. */
const CHAMPS_REFUSABLES = ['frais', 'vieil', 'portail', 'mot', 'versions', 'taille', 'session'];

describe('V-33 — chaque champ refusable a son bloc d’erreur', () => {
	it('rend les trois nœuds que le peintre interroge, pour les sept champs', async () => {
		const html = await rendreLaVue('V-33', {
			vecteur: null,
			notes: NOTES,
			config: CONFIGURATION_PAR_DEFAUT
		});
		for (const champ of CHAMPS_REFUSABLES) {
			expect(html, `bloc du champ ${champ}`).toContain(`id="champ-${champ}"`);
			expect(html, `erreur du champ ${champ}`).toContain(`id="erreur-${champ}"`);
			expect(html, `texte d’erreur du champ ${champ}`).toContain(`id="erreur-${champ}-txt"`);
		}
	});

	/**
	 * LE HUITIÈME RÉGLAGE A SON CHAMP, ET IL PORTE LA VALEUR ENREGISTRÉE.
	 *
	 * `nom_organisation` avait sa clé de base, son canal jusqu'à la coquille, et
	 * AUCUN écran : le seul geste capable de l'écrire était une requête à la
	 * main. Le contrôle éprouve les deux moitiés — le champ existe, et sa valeur
	 * est celle qui a été servie —, parce que c'est exactement la paire qui
	 * manquait quand un `c-organisation` fictif faisait écraser le réglage par
	 * la chaîne vide à chaque enregistrement.
	 *
	 * L'IDENTIFIANT N'EST PAS RECOPIÉ : il vient de `CHAMPS_DE_CONFIGURATION`,
	 * la table même que le câblage interroge. Une divergence entre la table et
	 * l'écran est précisément ce qu'aucun compilateur ne voit.
	 */
	it('rend le champ du nom d’organisation, et la valeur servie s’y trouve', async () => {
		const id = CHAMPS_DE_CONFIGURATION.nomOrganisation;
		const html = await rendreLaVue('V-33', {
			vecteur: null,
			notes: NOTES,
			config: { ...CONFIGURATION_PAR_DEFAUT, nomOrganisation: 'Organisation d’épreuve' }
		});
		expect(html).toContain(`id="${id}"`);
		expect(html).toContain('Organisation d’épreuve');

		/* VIDE, LE CHAMP RESTE, ET L'AIDE LE DIT FACULTATIF. */
		const neuve = await rendreLaVue('V-33', {
			vecteur: null,
			notes: NOTES,
			config: CONFIGURATION_PAR_DEFAUT
		});
		expect(neuve).toContain(`id="${id}"`);
		expect(neuve).not.toContain('Organisation d’épreuve');
		expect(neuve).toContain('Facultatif.');
	});

	/**
	 * L'ÉCRAN NE PROMET AUCUN RENDU QU'IL NE PEUT PAS TENIR.
	 *
	 * L'aide annonçait que les pieds de page et l'écran de connexion signeraient
	 * « Codicillus · le nom saisi ». AUCUNE VUE NE LIT ENCORE CE RÉGLAGE : les
	 * pieds publics portent leur signature en dur, et le contrôle précédent
	 * n'éprouvait que la PRÉSENCE du texte, jamais sa véracité — une aide fausse
	 * passait donc au vert.
	 *
	 * CE CAS MESURE L'AUTRE MOITIÉ : les trois tournures interdites sont celles
	 * que l'aide employait, et il les refuse dans LES DEUX ÉTATS du champ — vide
	 * et rempli —, là où l'ancienne aide en portait une par état. Le jour où une
	 * vue lira vraiment le réglage, c'est ici qu'il faudra venir lever la
	 * contrainte : la promesse et sa preuve se relisent alors ensemble.
	 */
	it('n’annonce aucun écran qui rendrait le nom saisi', async () => {
		for (const config of [
			CONFIGURATION_PAR_DEFAUT,
			{ ...CONFIGURATION_PAR_DEFAUT, nomOrganisation: 'Organisation d’épreuve' }
		]) {
			const html = await rendreLaVue('V-33', { vecteur: null, notes: NOTES, config });
			for (const promesse of ['pied de page', 'pieds de page', 'écran de connexion']) {
				expect(html, `l’aide promet « ${promesse} »`).not.toContain(promesse);
			}
		}
	});

	it('sert le plafond de versions REÇU, et l’annonce dans l’aide du champ', async () => {
		const html = await rendreLaVue('V-33', {
			vecteur: null,
			notes: NOTES,
			config: { ...CONFIGURATION_PAR_DEFAUT, versionsMax: 7 }
		});
		expect(html).toContain('Au-delà de 7 versions');
	});
});
