/**
 * LES DISTINCTIONS — le barème du produit, et la décision d'obtention.
 *
 * Ce qui se mesure en base ne s'éprouve pas ici : `mesurerLesContributions()` et
 * `obtentionsDuCompte()` parlent à PostgreSQL, et leur preuve est l'écran. Ce qui
 * s'éprouve, c'est la DÉCISION — pure, et la seule du chemin d'écriture.
 */
import { describe, expect, it } from 'vitest';
import {
	BAREME_DES_DISTINCTIONS,
	distinctionsAConsigner,
	type MesuresDeContribution
} from './distinctions';

const RIEN: MesuresDeContribution = { publiees: 0, verifiees: 0, liens: 0, citations: 0 };

describe('BAREME_DES_DISTINCTIONS — six paliers, et ils sont du produit', () => {
	it('porte les six du gel, dans l’ordre du gel', () => {
		expect(BAREME_DES_DISTINCTIONS.map((d) => d.id)).toEqual([
			'premier',
			'veilleur',
			'redacteur',
			'biblio',
			'tisseur',
			'referent'
		]);
	});

	it('ne mesure que ce que la base sait compter', () => {
		/* Les quatre noms de mesure sont les quatre clés de `MesuresDeContribution` :
		   un palier qui en nommerait une cinquième ne compilerait pas, et celui-ci le
		   vérifie côté valeur — un barème lu d'ailleurs passerait par la même porte. */
		for (const d of BAREME_DES_DISTINCTIONS) {
			expect(Object.keys(RIEN)).toContain(d.mesure);
			expect(d.seuil).toBeGreaterThan(0);
		}
	});
});

describe('distinctionsAConsigner — ce qui vient d’être franchi, et rien d’autre', () => {
	it('ne consigne rien pour un compte sans contribution', () => {
		expect(distinctionsAConsigner(RIEN, new Set())).toEqual([]);
	});

	it('consigne « Premier pas » dès la première note publiée', () => {
		expect(distinctionsAConsigner({ ...RIEN, publiees: 1 }, new Set())).toEqual(['premier']);
	});

	it('consigne les trois paliers de publication d’un seul coup', () => {
		/* Un compte qui atteint 50 notes sans que l'écran ait été ouvert entre-temps
		   franchit trois seuils au même instant : les trois se consignent. */
		expect(distinctionsAConsigner({ ...RIEN, publiees: 50 }, new Set())).toEqual([
			'premier',
			'redacteur',
			'biblio'
		]);
	});

	it('NE RECONSIGNE JAMAIS une distinction déjà connue — tout l’objet de la table', () => {
		expect(distinctionsAConsigner({ ...RIEN, publiees: 1 }, new Set(['premier']))).toEqual([]);
	});

	it('sépare les quatre mesures : une vérification n’ouvre pas un palier de publication', () => {
		expect(distinctionsAConsigner({ ...RIEN, verifiees: 10 }, new Set())).toEqual(['veilleur']);
		expect(distinctionsAConsigner({ ...RIEN, liens: 100 }, new Set())).toEqual(['tisseur']);
		expect(distinctionsAConsigner({ ...RIEN, citations: 20 }, new Set())).toEqual(['referent']);
	});

	it('n’ouvre pas un palier à un point du seuil', () => {
		expect(distinctionsAConsigner({ ...RIEN, verifiees: 9 }, new Set())).toEqual([]);
	});
});
