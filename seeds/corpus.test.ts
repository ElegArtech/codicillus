import { describe, expect, it } from 'vitest';
import {
	CORPUS,
	DATE_REFERENCE,
	REVISIONS,
	VERSIONS,
	CONFIG,
	IDS_PAR_VARIANTE,
	VUES_PAR_VARIANTE,
	VARIANTE_PAR_VUE,
	corpusDeVariante,
	corpusPourVue,
	type IdentifiantDeVue,
	type Variante
} from './corpus';
import { niveauFraicheur } from '../src/lib/fraicheur';

describe('les variantes de démonstration', () => {
	it('référencent uniquement des notes existantes et sans doublon', () => {
		const ids = new Set(CORPUS.map((n) => n.id));
		expect(ids.size).toBe(CORPUS.length);
		for (const variante of Object.values(IDS_PAR_VARIANTE)) {
			expect(new Set(variante).size).toBe(variante.length);
			for (const id of variante) expect(ids.has(id)).toBe(true);
		}
	});
	it('les tables de variantes sont cohérentes entre elles', () => {
		for (const [variante, vues] of Object.entries(VUES_PAR_VARIANTE) as [
			Variante,
			IdentifiantDeVue[]
		][]) {
			for (const vue of vues) {
				expect(VARIANTE_PAR_VUE[vue]).toBe(variante);
				expect(corpusPourVue(vue).map((n) => n.id)).toEqual([...IDS_PAR_VARIANTE[variante]]);
			}
			expect(corpusDeVariante(variante).map((n) => n.id)).toEqual([...IDS_PAR_VARIANTE[variante]]);
		}
		expect(IDS_PAR_VARIANTE.vide).toEqual([]);
	});
});

describe('les dates et les états du jeu de démonstration sont cohérents', () => {
	const enJour = (date: string, jours: number): string => {
		const [j = 0, m = 0, a = 0] = date.split('/').map(Number);
		return new Date(Date.UTC(a, m - 1, j) + jours * 86_400_000).toISOString().slice(0, 10);
	};

	it('le corpus, les révisions et les versions convergent sur DATE_REFERENCE', () => {
		const dates: string[] = [];
		for (const note of CORPUS) if (note.revise) dates.push(enJour(note.revise, note.jours));
		for (const demande of REVISIONS) dates.push(enJour(demande.le, demande.jours));
		for (const versions of Object.values(VERSIONS)) {
			for (const v of versions ?? []) dates.push(enJour(v.date, v.jours));
		}
		const majoritaire = dates.filter((d) => d === DATE_REFERENCE).length;
		expect(majoritaire).toBe(dates.length - 2);
		expect(majoritaire / dates.length).toBeGreaterThan(0.95);
	});

	it('les deux seules dérivations discordantes sont les notes obsolètes connues', () => {
		const discordantes = CORPUS.filter(
			(n) => n.revise && enJour(n.revise, n.jours) !== DATE_REFERENCE
		).map((n) => n.id);
		expect(discordantes.sort()).toEqual(['n-sig-facturation', 'n-srv-app-01']);
		for (const id of discordantes) {
			expect(CORPUS.find((n) => n.id === id)!.fraicheur).toBe('obs');
		}
	});

	it('est cohérente avec les seuils de fraîcheur déclarés', () => {
		const seuils = { frais: CONFIG.seuilFrais, vieillissant: CONFIG.seuilVieillissant };
		for (const note of CORPUS) {
			expect(note.fraicheur, note.id).toBe(niveauFraicheur(note.jours, seuils));
		}
	});
});
