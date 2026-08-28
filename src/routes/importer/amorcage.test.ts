/**
 * `/importer` — LE MESSAGE DU REFUS, SITE PAR SITE.
 *
 * Le garde `importateur()` de `+page.server.ts` refuse en 404 quand l'appelant
 * ne peut écrire dans aucune racine de domaine — ce qui est TOUJOURS le cas sur
 * une instance à zéro univers. Ce qu'il DIT en refusant est décidé par
 * `messageDeRefusDEcriture()`, et c'est ce que ce fichier éprouve, avec les
 * identités exactes que le garde lui passe (l'anonyme, lui, n'arrive jamais
 * jusque-là : il est refusé au-dessus).
 *
 * Le garde lui-même n'est pas importable ici : un `+page.server.ts` importe
 * `./$types` et les alias `$lib`, que `vitest.config.ts` ne résout pas — aucun
 * test du dépôt n'en importe. Le test se pose donc au site, sur la décision.
 */
import { describe, expect, it } from 'vitest';
import type { Base } from '../../lib/base/acces';
import { MESSAGE_AMORCAGE, messageDeRefusDEcriture } from '../../lib/donnees/amorcage';
import { MESSAGE_INTROUVABLE } from '../../lib/donnees/rangement';
import { identiteAuthentifiee, type RoleDeCompte } from '../../lib/droits/resolution';

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

/** Une base qui REFUSE toute requête : elle prouve qu'un refus ne lit rien. */
function baseQuiRefuse(): Base {
	const refuser = (): never => {
		throw new Error('la base ne doit pas être interrogée pour un refus ordinaire');
	};
	const chaine: Record<string, unknown> = {};
	for (const methode of ['select', 'from', 'limit', 'where', 'then']) chaine[methode] = refuser;
	return chaine as unknown as Base;
}

const ADMIN = identiteAuthentifiee('c-admin', 'administrateur');
const AUTRES_ROLES: readonly RoleDeCompte[] = ['referent', 'contributeur', 'lecteur'];

describe('/importer — le 404 nu d’une instance vide nomme la console', () => {
	it('administrateur + zéro univers : le message nomme la console et son adresse', async () => {
		const message = await messageDeRefusDEcriture(baseAvecUnivers(0), ADMIN);

		expect(message).toBe(MESSAGE_AMORCAGE);
		expect(message).toContain('console');
		expect(message).toContain('/console/univers');
		expect(message).not.toBe(MESSAGE_INTROUVABLE);
	});

	it('administrateur + au moins un univers : MESSAGE_INTROUVABLE, au même octet', async () => {
		/* Le refus tient alors à autre chose — aucune racine de domaine ouverte à
		   l'appelant — et `ADR-007` reprend la main. */
		expect(await messageDeRefusDEcriture(baseAvecUnivers(1), ADMIN)).toBe(MESSAGE_INTROUVABLE);
	});

	it('tout autre rôle : MESSAGE_INTROUVABLE, et la base n’est même pas lue', async () => {
		for (const role of AUTRES_ROLES) {
			const identite = identiteAuthentifiee('c-x', role);
			expect(await messageDeRefusDEcriture(baseQuiRefuse(), identite)).toBe(MESSAGE_INTROUVABLE);
		}
	});
});
