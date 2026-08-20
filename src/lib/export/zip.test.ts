/**
 * L'ENVELOPPE DE L'ARCHIVE — les unitaires.
 *
 * Une enveloppe écrite à la main sans être relue est un pari. Ces cas prouvent
 * les quatre propriétés dont l'archive dépend, et une cinquième dont dépend la
 * confiance qu'on peut lui accorder : la lecture SAIT DIRE NON.
 */
import { describe, expect, it } from 'vitest';
import { ZipInvalide, ecrireZip, lireZip, sommeDeControle } from './zip';

const octetsDe = (texte: string) => new Uint8Array(Buffer.from(texte, 'utf8'));

describe('l’enveloppe ZIP — écrite, puis relue', () => {
	it('les entrées reviennent avec leur chemin et leurs octets', () => {
		const entrees = [
			{ chemin: 'Racine/', octets: new Uint8Array(0) },
			{ chemin: 'Racine/note.md', octets: octetsDe('du contenu') },
			{ chemin: 'pieces-jointes/n-un/schema.png', octets: new Uint8Array([0, 1, 2, 255]) }
		];
		expect(lireZip(ecrireZip(entrees))).toEqual(entrees);
	});

	it('L’ORDRE DES ENTRÉES EST CONSERVÉ — c’est lui qui porte l’ordre des dossiers frères', () => {
		const noms = ['b/', 'a/', 'c/', 'a/a/'];
		const entrees = noms.map((chemin) => ({ chemin, octets: new Uint8Array(0) }));
		expect(lireZip(ecrireZip(entrees)).map((e) => e.chemin)).toEqual(noms);
	});

	it('un contenu répétitif est bien dégonflé, et revient intact', () => {
		const gros = octetsDe('la même ligne, mille fois\n'.repeat(1000));
		const ecrite = ecrireZip([{ chemin: 'gros.md', octets: gros }]);
		expect(ecrite.length).toBeLessThan(gros.length / 10);
		expect(lireZip(ecrite)[0]?.octets).toEqual(gros);
	});

	it('un nom accentué survit — le drapeau d’encodage est posé', () => {
		const chemin = 'Réseau/Équipements/Passerelle — nº 2.md';
		expect(lireZip(ecrireZip([{ chemin, octets: octetsDe('x') }]))[0]?.chemin).toBe(chemin);
	});

	it('DEUX ÉCRITURES DU MÊME CONTENU RENDENT LES MÊMES OCTETS — R-05', () => {
		const entrees = [{ chemin: 'a.md', octets: octetsDe('contenu') }];
		expect(Buffer.from(ecrireZip(entrees)).equals(Buffer.from(ecrireZip(entrees)))).toBe(true);
	});
});

describe('la lecture sait dire non — sans quoi elle ne prouverait rien', () => {
	it('un bloc de fin absent est refusé', () => {
		expect(() => lireZip(octetsDe('ceci n’est pas une archive'))).toThrow(ZipInvalide);
	});

	it('UN OCTET CHANGÉ DANS LE CONTENU est vu par la somme de contrôle', () => {
		/* Le cas qui rend la somme utile : sans elle, une archive corrompue
		   rendrait un corps faux, et l'aller-retour échouerait à cent lignes de
		   la cause. Le contenu est écrit BRUT — un contenu court ne se dégonfle
		   pas —, donc l'octet touché est bien celui du corps. */
		const ecrite = ecrireZip([{ chemin: 'a.md', octets: octetsDe('abc') }]);
		const position = Buffer.from(ecrite).indexOf('abc', 30);
		expect(position).toBeGreaterThan(0);
		const abimee = new Uint8Array(ecrite);
		abimee[position] = 0x62;
		expect(() => lireZip(abimee)).toThrow(ZipInvalide);
	});

	it('la somme de contrôle est celle du format, sur le vecteur d’épreuve connu', () => {
		/* La valeur de référence du CRC-32 pour la chaîne des neuf caractères
		   d'épreuve, publiée avec l'algorithme. Sans ce cas, une somme
		   auto-cohérente mais fausse passerait — deux fois la même erreur ne
		   fait pas une preuve. */
		expect(sommeDeControle(octetsDe('123456789'))).toBe(0xcbf43926);
	});
});
