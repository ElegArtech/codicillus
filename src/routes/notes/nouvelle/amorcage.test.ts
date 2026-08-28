/**
 * `/notes/nouvelle` — LE MESSAGE DU REFUS, SITE PAR SITE.
 *
 * Le chargeur de cette adresse refuse en 404 tant que rien n'est rangeable
 * (`+page.server.ts`, `load` et porte 1 de l'action). Ce qu'il DIT en refusant
 * est décidé par `messageDeRefusDEcriture()`, et c'est ce que ce fichier
 * éprouve, avec les identités exactes que le chargeur lui passe.
 *
 * Le chargeur lui-même n'est pas importable ici : un `+page.server.ts` importe
 * `./$types` et les alias `$lib`, que `vitest.config.ts` ne résout pas — aucun
 * test du dépôt n'en importe. Le test se pose donc au site, sur la décision.
 */
import { describe, expect, it } from 'vitest';
import type { Base } from '../../../lib/base/acces';
import { MESSAGE_AMORCAGE, messageDeRefusDEcriture } from '../../../lib/donnees/amorcage';
import { MESSAGE_INTROUVABLE } from '../../../lib/donnees/rangement';
import { ANONYME, identiteAuthentifiee, type RoleDeCompte } from '../../../lib/droits/resolution';

/** Une base qui porte `combien` univers, et qui ne sait rien faire d'autre. */
function baseAvecUnivers(combien: number): Base {
	const lignes = Array.from({ length: combien }, (_, i) => ({ id: `u-${i}` }));
	const chaine = {
		select: () => chaine,
		from: () => chaine,
		limit: (n: number) => Promise.resolve(lignes.slice(0, n))
	};
	return chaine as unknown as Base;
}

const ADMIN = identiteAuthentifiee('c-admin', 'administrateur');
const AUTRES_ROLES: readonly RoleDeCompte[] = ['referent', 'contributeur', 'lecteur'];

describe('/notes/nouvelle — le 404 nu d’une instance vide nomme la console', () => {
	it('administrateur + zéro univers : le message nomme la console et son adresse', async () => {
		const message = await messageDeRefusDEcriture(baseAvecUnivers(0), ADMIN);

		expect(message).toBe(MESSAGE_AMORCAGE);
		expect(message).toContain('console');
		expect(message).toContain('/console/univers');
		expect(message).not.toBe(MESSAGE_INTROUVABLE);
	});

	it('administrateur + au moins un univers : MESSAGE_INTROUVABLE, au même octet', async () => {
		/* Le refus tient alors à autre chose — aucun dossier ouvert à l'appelant —
		   et `ADR-007` reprend la main : rien ne distingue plus ce refus d'une
		   adresse qui ne désigne rien. */
		expect(await messageDeRefusDEcriture(baseAvecUnivers(1), ADMIN)).toBe(MESSAGE_INTROUVABLE);
	});

	it('tout autre compte, même à zéro univers : MESSAGE_INTROUVABLE', async () => {
		for (const role of AUTRES_ROLES) {
			const identite = identiteAuthentifiee('c-x', role);
			expect(await messageDeRefusDEcriture(baseAvecUnivers(0), identite)).toBe(MESSAGE_INTROUVABLE);
		}
		expect(await messageDeRefusDEcriture(baseAvecUnivers(0), ANONYME)).toBe(MESSAGE_INTROUVABLE);
	});
});
