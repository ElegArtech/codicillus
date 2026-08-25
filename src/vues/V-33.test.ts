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

	it('sert le plafond de versions REÇU, et l’annonce dans l’aide du champ', async () => {
		const html = await rendreLaVue('V-33', {
			vecteur: null,
			notes: NOTES,
			config: { ...CONFIGURATION_PAR_DEFAUT, versionsMax: 7 }
		});
		expect(html).toContain('Au-delà de 7 versions');
	});
});
