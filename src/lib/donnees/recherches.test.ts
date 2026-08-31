/**
 * LES UNITAIRES DU JOURNAL DE RECHERCHE — `RG-M02-03`, et le quatrième de ses membres :
 * l'ouverture éventuelle d'un résultat.
 *
 * `termeDeProvenance()` DÉCIDE À QUI UNE OUVERTURE EST ATTRIBUÉE, et c'est la seule pièce
 * de ce module qui se juge sans base. Les deux polarités sont jouées (`P-5`) : ce qu'une
 * provenance légitime rend, ET ce qu'une provenance étrangère ne rend pas — sans le second,
 * une fonction qui lirait `?q=` de n'importe quelle adresse passerait pour juste, et un site
 * tiers pourrait alors gonfler le taux de recherche aboutie d'une instance.
 *
 * Aucun cas ne lit la base ni le jeu de démonstration (`P-26`).
 */
import { describe, expect, it } from 'vitest';
import { termeDeProvenance } from './recherches';

const ICI = new URL('http://interne.exemple.fr/notes/n-restaurer-pg');

describe('termeDeProvenance — l’ouverture éventuelle de RG-M02-03', () => {
	it('rend le terme quand la provenance est la recherche de l’instance', () => {
		expect(termeDeProvenance('http://interne.exemple.fr/recherche?q=barman', ICI)).toBe('barman');
	});

	it('accepte une provenance relative, telle qu’un client peut l’envoyer', () => {
		expect(termeDeProvenance('/recherche?q=bascule%20voip', ICI)).toBe('bascule voip');
	});

	it('IGNORE une provenance d’une AUTRE origine', () => {
		/* Le contre-exemple qui donne son sens à la fonction : une adresse étrangère qui
		   porterait `?q=` attacherait une ouverture à une recherche qui n'a pas eu lieu. */
		expect(termeDeProvenance('http://ailleurs.exemple.net/recherche?q=barman', ICI)).toBeNull();
	});

	it('ignore une provenance qui n’est pas la recherche', () => {
		expect(
			termeDeProvenance('http://interne.exemple.fr/console/analytique?q=barman', ICI)
		).toBeNull();
	});

	it('ignore une recherche sans requête, et une requête blanche', () => {
		/* Ouvrir `/recherche` sans `q` n'interroge rien : il n'y a pas de recherche à
		   laquelle attacher quoi que ce soit. */
		expect(termeDeProvenance('/recherche', ICI)).toBeNull();
		expect(termeDeProvenance('/recherche?q=%20%20', ICI)).toBeNull();
	});

	it('rend `null` sans provenance, et sur une provenance illisible', () => {
		expect(termeDeProvenance(null, ICI)).toBeNull();
		expect(termeDeProvenance('://pas une adresse', ICI)).toBeNull();
	});

	it('rogne les blancs, comme le fait l’écriture de l’entrée', () => {
		/* Les deux bouts doivent s'accorder : l'entrée est écrite sur le terme rogné, et
		   l'attribution la cherche par égalité stricte. */
		expect(termeDeProvenance('/recherche?q=%20barman%20', ICI)).toBe('barman');
	});
});
