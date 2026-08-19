/**
 * L'AUTHENTIFICATION — l'unicité de l'échec, l'égalité de coût, et RG-M14-08.
 *
 * Ces tests calculent de vrais condensats Argon2id : ils coûtent une vingtaine
 * de millisecondes chacun, et c'est le prix d'éprouver la vraie fonction plutôt
 * qu'un doublon qui n'aurait pas ses défauts.
 */
import { describe, expect, it } from 'vitest';
import {
	ECHEC,
	type CompteAAuthentifier,
	authentifier,
	identitePourCompte
} from './authentification';
import { hacherMotDePasse, motDePasseCorrespond } from './mots-de-passe';

const MOT_DE_PASSE = 'un mot de passe de compte local';

async function compteActif(): Promise<CompteAAuthentifier> {
	return {
		id: 'c-karim',
		role: 'referent',
		actif: true,
		condensatMotDePasse: await hacherMotDePasse(MOT_DE_PASSE)
	};
}

describe('le condensat — Argon2id, et jamais le clair', () => {
	it('produit un condensat Argon2id, jamais le mot de passe', async () => {
		const condensat = await hacherMotDePasse(MOT_DE_PASSE);
		expect(condensat.startsWith('$argon2id$')).toBe(true);
		expect(condensat).not.toContain(MOT_DE_PASSE);
	});

	it('sale : deux condensats du même mot de passe diffèrent', async () => {
		const a = await hacherMotDePasse(MOT_DE_PASSE);
		const b = await hacherMotDePasse(MOT_DE_PASSE);
		expect(a).not.toBe(b);
		expect(await motDePasseCorrespond(a, MOT_DE_PASSE)).toBe(true);
		expect(await motDePasseCorrespond(b, MOT_DE_PASSE)).toBe(true);
	});

	it('refuse un mot de passe faux, un condensat absent, un condensat illisible', async () => {
		const condensat = await hacherMotDePasse(MOT_DE_PASSE);
		expect(await motDePasseCorrespond(condensat, 'autre chose')).toBe(false);
		expect(await motDePasseCorrespond(null, MOT_DE_PASSE)).toBe(false);
		expect(await motDePasseCorrespond('pas un condensat', MOT_DE_PASSE)).toBe(false);
	});
});

describe('une seule valeur d’échec, et c’est LE MÊME OBJET', () => {
	it('identifiant inconnu et mot de passe faux rendent la même référence', async () => {
		const inconnu = await authentifier(null, MOT_DE_PASSE);
		const faux = await authentifier(await compteActif(), 'faux');
		expect(inconnu).toBe(ECHEC);
		expect(faux).toBe(ECHEC);
		expect(inconnu).toBe(faux);
	});

	it('l’échec ne porte AUCUN champ qui distingue les cas', async () => {
		const echec = await authentifier(null, 'x');
		expect(Object.keys(echec)).toEqual(['reussie']);
		expect(Object.isFrozen(echec)).toBe(true);
	});

	it('un compte sans mot de passe posé échoue par le même chemin', async () => {
		const compte: CompteAAuthentifier = {
			id: 'c-neuf',
			role: 'contributeur',
			actif: true,
			condensatMotDePasse: null
		};
		expect(await authentifier(compte, MOT_DE_PASSE)).toBe(ECHEC);
	});

	it('rend une identité authentifiée quand tout concorde', async () => {
		const decision = await authentifier(await compteActif(), MOT_DE_PASSE);
		expect(decision.reussie).toBe(true);
		if (!decision.reussie) return;
		expect(decision.identite.compteId).toBe('c-karim');
		expect(decision.identite.role).toBe('referent');
	});
});

describe('RG-M14-08 — « un compte désactivé perd IMMÉDIATEMENT l’accès »', () => {
	it('refuse un compte désactivé qui donne le bon mot de passe', async () => {
		const compte = { ...(await compteActif()), id: 'c-ancien', actif: false };
		expect(await authentifier(compte, MOT_DE_PASSE)).toBe(ECHEC);
	});

	it('ne produit aucune identité pour un compte désactivé', async () => {
		const compte = { ...(await compteActif()), actif: false };
		expect(identitePourCompte(compte)).toBeNull();
	});

	it('produit une identité pour un compte actif — la polarité inverse (P-5)', async () => {
		const identite = identitePourCompte(await compteActif());
		expect(identite).not.toBeNull();
		expect(identite?.type).toBe('authentifie');
	});
});

describe('l’égalité de coût entre les deux échecs — ARB-005, mesurée ici en tendance', () => {
	/**
	 * CE TEST N'EST PAS UNE PREUVE D'INDISCERNABILITÉ TEMPORELLE, et il ne
	 * prétend pas l'être : `docs/routes.md:460` interdit de déclarer `RG-ACC-04`
	 * tenue tant que la batterie 6 n'existe pas, et une mesure de temps dans un
	 * unitaire est du bruit sous charge.
	 *
	 * Il éprouve la seule chose qui soit déterministe : que le chemin « compte
	 * inconnu » CALCULE BIEN un condensat. Une régression qui court-circuiterait
	 * la vérification rendrait ce chemin des ordres de grandeur plus rapide, et le
	 * seuil ci-dessous — très lâche — le verrait.
	 */
	it('le chemin « identifiant inconnu » paie une vérification Argon2id', async () => {
		/* Le leurre est calculé au premier appel : on l'amorce hors mesure. */
		await authentifier(null, 'amorce');

		const t0 = performance.now();
		for (let i = 0; i < 5; i += 1) await authentifier(null, `essai-${String(i)}`);
		const inconnu = performance.now() - t0;

		/* Cinq vérifications Argon2id ne descendent pas sous quelques
		   millisecondes ; un court-circuit les rendrait quasi instantanées. */
		expect(inconnu).toBeGreaterThan(5);
	});
});
