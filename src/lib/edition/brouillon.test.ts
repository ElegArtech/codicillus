/**
 * LE BROUILLON LOCAL — sa clé, son aller-retour, et ce qu'il refuse.
 *
 * Le câblage, lui, se voit au navigateur : ce contrôle tient ce qui décide — la clé qui
 * sépare deux comptes et deux notes, la lecture qui écarte un brouillon illisible, et la
 * comparaison qui dit à l'écran de PROPOSER plutôt que d'imposer.
 */
import { describe, expect, it } from 'vitest';
import {
	CIBLE_DE_CREATION,
	brouillonDoubleParLaBase,
	cleDeBrouillon,
	ecrireLeBrouillon,
	effacerLeBrouillon,
	empreinteDeCompte,
	lireLeBrouillon,
	type Brouillon,
	type StockageLocal
} from './brouillon';
import type { Document } from '../contenu/document';

/** Un stockage de contrôle — les trois méthodes, et rien de plus. */
function stockageFeint(): StockageLocal & { readonly contenu: Map<string, string> } {
	const contenu = new Map<string, string>();
	return {
		contenu,
		getItem: (cle) => contenu.get(cle) ?? null,
		setItem: (cle, valeur) => {
			contenu.set(cle, valeur);
		},
		removeItem: (cle) => {
			contenu.delete(cle);
		}
	};
}

const CORPS: Document = {
	type: 'doc',
	content: [{ type: 'paragraph', content: [{ type: 'text', text: 'On restaure depuis le dump.' }] }]
};

const COMPTE_A = '0d5c3b3e-1111-4a4a-9b9b-000000000001';
const COMPTE_B = '0d5c3b3e-2222-4a4a-9b9b-000000000002';

describe('la clé', () => {
	it('sépare deux comptes sur la même cible', () => {
		expect(cleDeBrouillon(empreinteDeCompte(COMPTE_A), CIBLE_DE_CREATION)).not.toBe(
			cleDeBrouillon(empreinteDeCompte(COMPTE_B), CIBLE_DE_CREATION)
		);
	});

	it('sépare deux notes du même compte', () => {
		const compte = empreinteDeCompte(COMPTE_A);
		expect(cleDeBrouillon(compte, 'n-une')).not.toBe(cleDeBrouillon(compte, 'n-autre'));
		expect(cleDeBrouillon(compte, CIBLE_DE_CREATION)).not.toBe(cleDeBrouillon(compte, 'n-une'));
	});

	it('est stable d’une ouverture à l’autre', () => {
		expect(empreinteDeCompte(COMPTE_A)).toBe(empreinteDeCompte(COMPTE_A));
	});

	/** LE STOCKAGE EST LU PAR LA PERSONNE SUIVANTE : il ne porte pas l'identifiant. */
	it('ne laisse pas l’identifiant du compte dans la clé', () => {
		expect(cleDeBrouillon(empreinteDeCompte(COMPTE_A), CIBLE_DE_CREATION)).not.toContain(COMPTE_A);
	});
});

describe('l’aller-retour', () => {
	it('rend le titre, le corps et l’instant', () => {
		const stockage = stockageFeint();
		const cle = cleDeBrouillon(empreinteDeCompte(COMPTE_A), CIBLE_DE_CREATION);
		const brouillon: Brouillon = {
			titre: 'Restaurer une sauvegarde PostgreSQL',
			corps: CORPS,
			le: '2026-08-31T12:00:00.000Z'
		};
		expect(ecrireLeBrouillon(stockage, cle, brouillon)).toBe(true);
		expect(lireLeBrouillon(stockage, cle)).toEqual(brouillon);
	});

	it('rend null quand rien n’a été écrit', () => {
		const stockage = stockageFeint();
		expect(lireLeBrouillon(stockage, 'codicillus:brouillon:x:y')).toBeNull();
	});

	it('efface', () => {
		const stockage = stockageFeint();
		const cle = cleDeBrouillon(empreinteDeCompte(COMPTE_A), 'n-une');
		ecrireLeBrouillon(stockage, cle, { titre: 't', corps: CORPS, le: '2026-08-31T12:00:00.000Z' });
		effacerLeBrouillon(stockage, cle);
		expect(lireLeBrouillon(stockage, cle)).toBeNull();
	});

	it('rend false plutôt que de lever quand le stockage refuse', () => {
		const refusant: StockageLocal = {
			getItem: () => null,
			setItem: () => {
				throw new Error('quota');
			},
			removeItem: () => undefined
		};
		expect(
			ecrireLeBrouillon(refusant, 'cle', { titre: '', corps: CORPS, le: new Date().toISOString() })
		).toBe(false);
	});
});

describe('ce que la lecture écarte', () => {
	const cle = 'codicillus:brouillon:abc:nouvelle';
	const cas: Record<string, string> = {
		'un texte qui n’est pas du JSON': 'ceci n’est pas un brouillon',
		'un JSON qui n’est pas un objet': '"chaîne"',
		'un brouillon sans instant': JSON.stringify({ titre: 't', corps: CORPS }),
		'un instant illisible': JSON.stringify({ titre: 't', corps: CORPS, le: 'hier' }),
		'un corps absent': JSON.stringify({ titre: 't', le: '2026-08-31T12:00:00.000Z' }),
		'un corps que le format refuse': JSON.stringify({
			titre: 't',
			corps: { type: 'doc', content: [{ type: 'inconnu' }] },
			le: '2026-08-31T12:00:00.000Z'
		})
	};
	for (const [nom, brut] of Object.entries(cas)) {
		it(`écarte ${nom}`, () => {
			const stockage = stockageFeint();
			stockage.contenu.set(cle, brut);
			expect(lireLeBrouillon(stockage, cle)).toBeNull();
		});
	}
});

describe('le brouillon doublé par la base', () => {
	const brouillon: Brouillon = { titre: 't', corps: CORPS, le: '2026-08-31T12:00:00.000Z' };

	/** LA CRÉATION N'A RIEN À ÉCRASER. */
	it('ne l’est jamais en création', () => {
		expect(brouillonDoubleParLaBase(brouillon, null)).toBe(false);
	});

	it('l’est quand la note a été enregistrée après lui', () => {
		expect(brouillonDoubleParLaBase(brouillon, '2026-08-31T12:30:00.000Z')).toBe(true);
	});

	it('ne l’est pas quand la note est plus ancienne que lui', () => {
		expect(brouillonDoubleParLaBase(brouillon, '2026-08-31T11:30:00.000Z')).toBe(false);
	});
});
