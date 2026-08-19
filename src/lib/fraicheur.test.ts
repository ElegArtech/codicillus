/**
 * Batterie 3 — l'implémentation unique du calcul de fraîcheur (P-01, ADR-005).
 *
 * ÉCART-027 É-1 : P-0b a livré `src/lib/fraicheur.ts` sans ce fichier, son
 * périmètre d'écriture ne l'ouvrant pas — et il a préféré le déclarer plutôt
 * qu'élargir son périmètre en silence. C'était le bon geste ; voici la dette.
 *
 * Il avait joint une preuve de substitution de 83 cas, exécutée contre les
 * `window.*` du gel dans un navigateur réel. Ce fichier en fige la part
 * rejouable sans navigateur : **les bornes**, seul endroit où une comparaison
 * stricte se distingue d'une comparaison large — et donc seul endroit où une
 * réécriture distraite changerait le niveau affiché sur une note réelle.
 *
 * P-01 : il n'existe qu'UNE définition de ce calcul. Un second calcul, fût-il
 * exact aujourd'hui, est un point de divergence pour demain.
 */
import { describe, expect, it } from 'vitest';
import {
	BARRES_DE_JAUGE,
	SEUILS_PAR_DEFAUT,
	barresFraicheur,
	classeTemoin,
	niveauFraicheur,
	temoinFraicheur,
	type NiveauFraicheur
} from './fraicheur';

describe('les seuils — ceux du gel, et rien d’autre', () => {
	it('valent 90 et 180, comme les treize maquettes qui les déclarent', () => {
		expect(SEUILS_PAR_DEFAUT.frais).toBe(90);
		expect(SEUILS_PAR_DEFAUT.vieillissant).toBe(180);
	});
	it('respecte RG-M06-02 : le seuil jaune est strictement supérieur au vert', () => {
		expect(SEUILS_PAR_DEFAUT.vieillissant).toBeGreaterThan(SEUILS_PAR_DEFAUT.frais);
	});
});

describe('niveauFraicheur — les bornes, où le strict se distingue du large', () => {
	const cas: Array<[number, NiveauFraicheur]> = [
		[0, 'frais'],
		[89, 'frais'],
		[90, 'vieil'], // strict : 90 n’est PAS frais
		[91, 'vieil'],
		[179, 'vieil'],
		[180, 'obs'], // strict : 180 n’est PAS vieillissant
		[181, 'obs'],
		[400, 'obs']
	];
	for (const [jours, attendu] of cas) {
		it(`${jours} jours → ${attendu}`, () => {
			expect(niveauFraicheur(jours)).toBe(attendu);
		});
	}

	it('prend les seuils en paramètre, jamais en constante locale (ADR-005)', () => {
		const resserres = { frais: 30, vieillissant: 60 } as const;
		expect(niveauFraicheur(45, resserres)).toBe('vieil');
		expect(niveauFraicheur(45)).toBe('frais');
	});
});

describe('la jauge — la forme porte l’information, la couleur la répète', () => {
	it('compte toujours trois barres (RG-M18-09, RG-DA-03)', () => {
		expect(BARRES_DE_JAUGE).toBe(3);
	});
	it('remplit 3, 2 puis 1 barre — jamais zéro, sans quoi la forme disparaît', () => {
		expect(barresFraicheur('frais')).toBe(3);
		expect(barresFraicheur('vieil')).toBe(2);
		expect(barresFraicheur('obs')).toBe(1);
	});
	it('donne une classe distincte par niveau — la teinte vient de là seule', () => {
		const classes = (['frais', 'vieil', 'obs'] as const).map(classeTemoin);
		expect(new Set(classes).size).toBe(3);
	});
});

describe('temoinFraicheur — la fabrique unique', () => {
	it('rend une description cohérente avec chacune de ses composantes', () => {
		for (const [fraicheur, jours] of [
			['frais', 12],
			['vieil', 120],
			['obs', 300]
		] as Array<[NiveauFraicheur, number]>) {
			const t = temoinFraicheur({ fraicheur, jours });
			expect(t.niveau).toBe(fraicheur);
			expect(t.barres).toBe(barresFraicheur(fraicheur));
			expect(t.classe).toBe(classeTemoin(fraicheur));
			expect(t.libelle.length).toBeGreaterThan(0);
		}
	});
});
