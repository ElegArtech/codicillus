/**
 * `ARB-062` OPPOSABLE — la forme de l'identifiant lisible d'une note.
 *
 * CE FICHIER EST SYNTHÉTIQUE PAR CONSTRUCTION, et c'est `P-26` qui l'exige :
 * « tout contrôle doit avoir un cas d'épreuve synthétique, indépendant de l'état
 * du dépôt ». Aucun cas ci-dessous ne lit la base, aucun ne lit le corpus autre
 * qu'en RELEVÉ de forme, et aucun ne cessera d'être exercé quand le produit
 * créera sa première note. La règle qu'ils portent — six lignes d'`ARB-062` §2 —
 * reste donc éprouvée après le lot qui l'implémente.
 *
 * CE QU'ILS NE PROUVENT PAS : l'unicité. Elle est arbitrée par la contrainte
 * `notes_identifiant_unique` (`ARB-062` §2.5), et une fonction pure n'en sait
 * rien. C'est `estUneCollisionDIdentifiant()` de `../donnees/creation.ts` qui en
 * porte la moitié éprouvable sans base.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS } from '../../../seeds/corpus';
import {
	CORPS_PAR_DEFAUT,
	identifiantDeNote,
	identifiantSuivant,
	LONGUEUR_MAX_DU_CORPS,
	PREFIXE_DE_NOTE
} from './identifiants';

describe('ARB-062 §2.1 — le préfixe `n-`', () => {
	it('est porté par tout identifiant produit, quel que soit le titre', () => {
		for (const titre of ['Astreinte', '', '   ', '???', '汉字', '-', 'n-deja-prefixe']) {
			expect(identifiantDeNote(titre).startsWith(PREFIXE_DE_NOTE)).toBe(true);
		}
	});

	it('est la forme que le corpus gelé porte — 32 identifiants sur 32', () => {
		/* RELEVÉ, non dérivé : les identifiants de `seeds/corpus.ts` sont ceux que
		   onze maquettes affichent dans leurs adresses. C'est cette forme-là
		   qu'`ARB-062` §2.1 reconduit, et rien d'autre. */
		expect(CORPUS.every((n) => n.id.startsWith(PREFIXE_DE_NOTE))).toBe(true);
	});

	it('rend impossible la production du segment réservé `nouvelle` (docs/routes.md §5.4)', () => {
		expect(identifiantDeNote('Nouvelle')).toBe('n-nouvelle');
		expect(identifiantDeNote('Nouvelle')).not.toBe('nouvelle');
	});
});

describe('ARB-062 §2.2 — le corps est le slug du titre', () => {
	it('reprend `identifiantLisible()` : diacritiques retirés, minuscules, tirets', () => {
		expect(identifiantDeNote('Restaurer PostgreSQL')).toBe('n-restaurer-postgresql');
		expect(identifiantDeNote('Procédure d’astreinte')).toBe('n-procedure-d-astreinte');
		expect(identifiantDeNote('Migration 2026')).toBe('n-migration-2026');
	});

	it('ne laisse jamais de tiret en tête ni en queue du corps', () => {
		expect(identifiantDeNote('— Astreinte —')).toBe('n-astreinte');
		expect(identifiantDeNote('  Sauvegardes  ')).toBe('n-sauvegardes');
	});
});

describe('ARB-062 §2.2 — la troncature à 48, sur frontière de tiret', () => {
	it('laisse intact un corps qui tient dans la borne', () => {
		const court = 'a'.repeat(LONGUEUR_MAX_DU_CORPS);
		expect(identifiantDeNote(court)).toBe(PREFIXE_DE_NOTE + court);
	});

	it('ne coupe jamais au milieu d’un mot', () => {
		/* 44 caractères, puis un mot de 10 : la coupe à 48 tomberait au milieu du
		   dernier mot. Elle recule donc jusqu'à la frontière précédente. */
		const titre = 'a'.repeat(44) + ' bbbbbbbbbb';
		const corps = identifiantDeNote(titre).slice(PREFIXE_DE_NOTE.length);
		expect(corps).toBe('a'.repeat(44));
		expect(corps.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_CORPS);
	});

	it('garde le mot entier quand la frontière tombe pile sur la borne', () => {
		/* 48 caractères, puis un séparateur : le mot est entier à la borne, rien
		   n'est à reprendre. */
		const titre = 'a'.repeat(LONGUEUR_MAX_DU_CORPS) + ' suite';
		expect(identifiantDeNote(titre)).toBe(PREFIXE_DE_NOTE + 'a'.repeat(LONGUEUR_MAX_DU_CORPS));
	});

	it('ne rend jamais un corps plus long que la borne', () => {
		const titres = [
			'a'.repeat(200),
			('mot '.repeat(40) + 'fin').trim(),
			'Procédure de restauration complète du parc applicatif et de ses dépendances'
		];
		for (const titre of titres) {
			const corps = identifiantDeNote(titre).slice(PREFIXE_DE_NOTE.length);
			expect(corps.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_CORPS);
		}
	});

	it('rend le corps par défaut quand aucune frontière ne précède la borne', () => {
		/* LE CAS DÉCLARÉ — `ECART-048` É-2. Un premier mot plus long que la borne
		   n'offre AUCUNE frontière avant elle : « tronqué à 48 » et « jamais au
		   milieu d'un mot » ne peuvent pas être tenues ensemble. La borne l'emporte,
		   la troncature rend le vide, et §2.3 prend le relais. */
		expect(identifiantDeNote('a'.repeat(LONGUEUR_MAX_DU_CORPS + 1))).toBe(
			PREFIXE_DE_NOTE + CORPS_PAR_DEFAUT
		);
	});
});

describe('ARB-062 §2.3 — le slug vide donne le corps `note`', () => {
	it('vaut pour un titre vide, blanc, ponctué ou idéographique', () => {
		for (const titre of ['', '   ', '???', '— — —', '汉字']) {
			expect(identifiantDeNote(titre)).toBe(PREFIXE_DE_NOTE + CORPS_PAR_DEFAUT);
		}
	});

	it('est une fonction TOTALE : aucun titre ne fait lever', () => {
		/* « Il n'y a pas de note sans identifiant, et il n'y a pas de refus
		   d'enregistrer pour cette cause » — `ARB-062` §2.3. Le titre vide est
		   refusé ailleurs, et pour une autre raison. */
		expect(() => identifiantDeNote('')).not.toThrow();
	});
});

describe('ARB-062 §2.4 — la levée de collision', () => {
	it('le premier essai rend le candidat NU', () => {
		expect(identifiantSuivant('n-astreinte', 1)).toBe('n-astreinte');
	});

	it('les suivants suffixent leur rang : -2, puis -3', () => {
		expect(identifiantSuivant('n-astreinte', 2)).toBe('n-astreinte-2');
		expect(identifiantSuivant('n-astreinte', 3)).toBe('n-astreinte-3');
		expect(identifiantSuivant('n-astreinte', 12)).toBe('n-astreinte-12');
	});

	it('ne peut JAMAIS produire un suffixe `-1`', () => {
		/* « Un `-1` qui n'aurait pas de `-0` serait un compteur qui ment sur son
		   origine ». La propriété est portée par la FORME : les rangs invalides
		   sont refusés, le rang 1 ne suffixe pas. */
		const produits = [1, 2, 3, 4, 5, 10, 100].map((n) => identifiantSuivant('n-x', n));
		expect(produits.some((p) => p.endsWith('-1'))).toBe(false);
	});

	it('refuse un rang qui n’est pas un entier supérieur ou égal à 1', () => {
		for (const rang of [0, -1, -2, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(() => identifiantSuivant('n-x', rang)).toThrow(RangeError);
		}
	});

	it('produit une suite de candidats deux à deux distincts', () => {
		/* C'est cette propriété qui fait TERMINER la boucle d'essai de
		   `creerUneNote()` : une table finie ne peut pas couvrir une suite infinie
		   de candidats distincts. */
		const suite = Array.from({ length: 50 }, (_, i) => identifiantSuivant('n-x', i + 1));
		expect(new Set(suite).size).toBe(suite.length);
	});
});
