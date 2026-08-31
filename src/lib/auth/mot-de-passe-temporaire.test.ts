/**
 * `motDePasseTemporaire()` — CE QUE L'ADMINISTRATION POSE SUR UN COMPTE DONT
 * L'ACCÈS EST PERDU. Le produit n'ayant ni expéditeur de courriel ni table de
 * jeton, c'est la seule porte de secours : la valeur doit être imprévisible, et
 * elle doit déjà satisfaire les règles que le titulaire devra tenir.
 */
import { describe, expect, it } from 'vitest';
import { motDePasseTemporaire } from './mot-de-passe-temporaire';
import { motDePasseAcceptable } from '../donnees/profil';

const IDENTIFIANT = 'claire.contrib';

describe('le mot de passe temporaire posé par un administrateur', () => {
	it('sort en trois groupes de quatre symboles, sans caractère ambigu', () => {
		for (let essai = 0; essai < 200; essai++) {
			expect(motDePasseTemporaire(IDENTIFIANT)).toMatch(
				/^[a-hj-km-np-z2-9]{4}-[a-hj-km-np-z2-9]{4}-[a-hj-km-np-z2-9]{4}$/
			);
		}
	});

	it('satisfait les règles exigées du titulaire — longueur, natures, identifiant', () => {
		for (let essai = 0; essai < 200; essai++) {
			expect(motDePasseAcceptable(motDePasseTemporaire(IDENTIFIANT), IDENTIFIANT)).toBe(true);
		}
	});

	/* CE QUI SE REJOUE NE PROTÈGE RIEN. Deux cents tirages sur douze symboles pris
	   parmi trente et un ne se répètent pas : une collision signalerait une source
	   figée — c'est exactement ce que produisait `Math.random()` sur seize mots. */
	it('ne rend jamais deux fois la même valeur', () => {
		const vues = new Set<string>();
		for (let essai = 0; essai < 200; essai++) vues.add(motDePasseTemporaire(IDENTIFIANT));
		expect(vues.size).toBe(200);
	});

	/* Un identifiant d'une seule lettre est le seul cas où le tirage se rejoue :
	   la règle « différent de votre identifiant » porte sur l'INCLUSION. */
	it('évite un identifiant réduit à une lettre de son alphabet', () => {
		for (let essai = 0; essai < 200; essai++) {
			expect(motDePasseTemporaire('a')).not.toContain('a');
		}
	});
});
