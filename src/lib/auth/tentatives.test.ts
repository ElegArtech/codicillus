/**
 * LE BARÈME DE RALENTISSEMENT — RG-M16-01, RG-NF-07.
 *
 * Les six cas qui comptent, et le septième qu'on oublie : la REMISE À ZÉRO
 * après un blocage échu. Sans elle, une origine bloquée une fois resterait
 * bloquée à vie, et le gel dit l'inverse — `verrouiller()` réactive le
 * formulaire au terme du décompte (`V-05:729-735`).
 *
 * Aucun test ne dort : `attendre()` est isolée, et c'est `etatDesTentatives()`
 * qui décide.
 */
import { describe, expect, it } from 'vitest';
import {
	ATTENTES_MAX_PAR_ORIGINE,
	BAREME,
	type LigneDeTentative,
	aSonTour,
	etatDesTentatives,
	finDuBlocage
} from './tentatives';

const T0 = new Date('2026-08-20T09:00:00.000Z');

/** Un échec, `secondes` avant `T0`. */
function echec(secondesAvant: number): LigneDeTentative {
	return { reussie: false, le: new Date(T0.getTime() - secondesAvant * 1000), blocageJusquA: null };
}

/** Un succès, `secondes` avant `T0`. */
function succes(secondesAvant: number): LigneDeTentative {
	return { reussie: true, le: new Date(T0.getTime() - secondesAvant * 1000), blocageJusquA: null };
}

describe('le ralentissement progressif — « ralenti PUIS bloqué »', () => {
	it('n’impose rien à la première tentative d’une origine inconnue', () => {
		const etat = etatDesTentatives([], T0);
		expect(etat.bloquee).toBe(false);
		if (etat.bloquee) return;
		expect(etat.echecs).toBe(0);
		expect(etat.attenteSecondes).toBe(0);
		expect(etat.ouvreLeBlocage).toBe(false);
	});

	it('applique le barème déclaré, échec par échec', () => {
		for (let n = 0; n < BAREME.attentesEnSecondes.length; n += 1) {
			const lignes = Array.from({ length: n }, (_, i) => echec(n - i));
			const etat = etatDesTentatives(lignes, T0);
			expect(etat.bloquee).toBe(false);
			if (etat.bloquee) return;
			expect(etat.echecs).toBe(n);
			expect(etat.attenteSecondes).toBe(BAREME.attentesEnSecondes[n]);
			expect(etat.ouvreLeBlocage).toBe(false);
		}
	});

	it('il existe au moins une tentative RALENTIE avant tout blocage', () => {
		/* La première moitié de RG-M16-01 serait inerte si le barème passait de
		   zéro au blocage : au moins un délai non nul doit précéder. */
		const ralentis = BAREME.attentesEnSecondes.filter((s) => s > 0);
		expect(ralentis.length).toBeGreaterThan(0);
	});

	it('ouvre le blocage à la tentative qui suit les tentatives tolérées', () => {
		const n = BAREME.attentesEnSecondes.length;
		const lignes = Array.from({ length: n }, (_, i) => echec(n - i));
		const etat = etatDesTentatives(lignes, T0);
		expect(etat.bloquee).toBe(false);
		if (etat.bloquee) return;
		expect(etat.echecs).toBe(n);
		expect(etat.ouvreLeBlocage).toBe(true);
		/* Rien n'est ralenti en plus du blocage : la durée transmise est celle du
		   blocage, pas une somme. */
		expect(etat.attenteSecondes).toBe(0);
	});
});

describe('le blocage temporaire — 90 s, la valeur du gel (V-05:777)', () => {
	it('refuse et transmet la durée restante', () => {
		const lignes: LigneDeTentative[] = [
			{
				reussie: false,
				le: new Date(T0.getTime() - 30_000),
				blocageJusquA: new Date(T0.getTime() + 60_000)
			}
		];
		const etat = etatDesTentatives(lignes, T0);
		expect(etat.bloquee).toBe(true);
		if (!etat.bloquee) return;
		expect(etat.secondesRestantes).toBe(60);
	});

	it('la durée transmise est celle du barème, et elle est celle du gel', () => {
		const debut = new Date(T0);
		expect(finDuBlocage(debut).getTime() - debut.getTime()).toBe(90_000);
		expect(BAREME.blocageEnSecondes).toBe(90);
	});

	it('REMET LE COMPTEUR À ZÉRO quand le blocage est échu', () => {
		const lignes: LigneDeTentative[] = [
			echec(400),
			echec(390),
			echec(380),
			echec(370),
			echec(360),
			echec(350),
			{
				reussie: false,
				le: new Date(T0.getTime() - 340_000),
				blocageJusquA: new Date(T0.getTime() - 250_000)
			}
		];
		const etat = etatDesTentatives(lignes, T0);
		expect(etat.bloquee).toBe(false);
		if (etat.bloquee) return;
		expect(etat.echecs).toBe(0);
		expect(etat.attenteSecondes).toBe(0);
	});

	it('recompte les échecs postérieurs au blocage échu, et pas les précédents', () => {
		const lignes: LigneDeTentative[] = [
			echec(400),
			echec(390),
			{
				reussie: false,
				le: new Date(T0.getTime() - 380_000),
				blocageJusquA: new Date(T0.getTime() - 290_000)
			},
			echec(200),
			echec(100)
		];
		const etat = etatDesTentatives(lignes, T0);
		expect(etat.bloquee).toBe(false);
		if (etat.bloquee) return;
		expect(etat.echecs).toBe(2);
	});
});

describe('la remise à zéro par le succès', () => {
	it('un succès efface les échecs qui le précèdent', () => {
		const etat = etatDesTentatives([echec(300), echec(200), succes(100), echec(50)], T0);
		expect(etat.bloquee).toBe(false);
		if (etat.bloquee) return;
		expect(etat.echecs).toBe(1);
	});

	it('un succès ancien n’efface pas les échecs qui le suivent', () => {
		const etat = etatDesTentatives([succes(300), echec(200), echec(100)], T0);
		expect(etat.bloquee).toBe(false);
		if (etat.bloquee) return;
		expect(etat.echecs).toBe(2);
	});
});

describe('l’ordre des lignes n’a aucune influence', () => {
	it('rend le même verdict sur une liste inversée', () => {
		const lignes = [echec(300), succes(200), echec(100), echec(50)];
		const droit = etatDesTentatives(lignes, T0);
		const inverse = etatDesTentatives([...lignes].reverse(), T0);
		expect(inverse).toEqual(droit);
	});
});

describe('une tentative à la fois par origine', () => {
	it('les tentatives simultanées d’une origine passent l’une après l’autre', async () => {
		const journal: string[] = [];
		const tentative = (nom: string) =>
			aSonTour('198.51.100.1', async () => {
				journal.push(`début ${nom}`);
				await new Promise((tenir) => setTimeout(tenir, 5));
				journal.push(`fin ${nom}`);
				return nom;
			});
		const tours = await Promise.all([tentative('a'), tentative('b'), tentative('c')]);
		expect(tours.every((t) => t.servie)).toBe(true);
		expect(journal).toEqual(['début a', 'fin a', 'début b', 'fin b', 'début c', 'fin c']);
	});

	it('au-delà de la file, la tentative est refusée sans attendre', async () => {
		const tours = await Promise.all(
			Array.from({ length: ATTENTES_MAX_PAR_ORIGINE + 3 }, () =>
				aSonTour('198.51.100.2', async () => {
					await new Promise((tenir) => setTimeout(tenir, 5));
					return true;
				})
			)
		);
		expect(tours.filter((t) => t.servie)).toHaveLength(ATTENTES_MAX_PAR_ORIGINE);
	});

	it('deux origines ne s’attendent pas, et une erreur libère la file', async () => {
		await expect(
			aSonTour('198.51.100.3', async () => {
				throw new Error('échec');
			})
		).rejects.toThrow('échec');
		const tour = await aSonTour('198.51.100.3', async () => 'suite');
		expect(tour).toEqual({ servie: true, valeur: 'suite' });
	});
});
