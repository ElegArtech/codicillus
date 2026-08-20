/**
 * Le jeu de volumétrie haute — unitaires du GÉNÉRATEUR, sans base.
 *
 * Ce fichier est un INSTRUMENT DE MESURE : il relève du périmètre d'écriture
 * humain / orchestrateur (`règles/workflow_agentic.md` §4.10).
 *
 * CE QU'IL FIGE, ET POURQUOI CHAQUE POINT A COÛTÉ QUELQUE CHOSE.
 *
 *   1. LA REPRODUCTIBILITÉ. Un jeu qui change d'une exécution à l'autre rend
 *      deux mesures incomparables — et c'est la première condition qu'un
 *      rapport de performance doit déclarer. Éprouvée dans les deux sens : même
 *      graine, même jeu ; graine différente, jeu différent. Sans le second, un
 *      générateur qui rendrait une constante passerait le premier.
 *   2. LES VOLUMES SONT CEUX DU CAHIER, PAS CEUX QUI ARRANGENT. 200 comptes,
 *      6 univers, 30 domaines, profondeur 10.
 *   3. LA PROFONDEUR PLAFONNÉE À 10. Le schéma porte un CHECK ; un jeu qui le
 *      viole ne se charge pas, et l'erreur remonte à cent lignes de sa cause.
 *      Mesuré : la première rédaction engendrait des chaînes de profondeur 11.
 *   4. LE PRÉFIXE NE PEUT PAS EMPORTER LE CORPUS GELÉ. C'est le cas d'épreuve
 *      SYNTHÉTIQUE de `P-26` : il ne dépend d'aucun état du dépôt, et il reste
 *      exercé même quand le retrait fonctionne. Un `delete` mal cadré emporterait
 *      la référence du banc.
 */
import { describe, it, expect } from 'vitest';
import {
	GRAINE,
	PREFIXE,
	VOLUMETRIE_HAUTE,
	corpsDeNote,
	engendrer,
	lignesDeRetrait,
	tirage,
	type Existant
} from './volumetrie';

/** L'existant du corpus gelé, tel que la base semée le porte (mesuré T-055). */
const CORPUS_GELE: Existant = {
	universExistants: ['Production', 'Projets', 'Non classé'],
	domainesExistants: new Map([
		['Production', ['Infrastructure', 'Applications', 'Poste de travail']],
		['Projets', ['Migration 2026']]
	]),
	universDuGraphe: 'Production',
	notesDejaDansLeGraphe: 31,
	notesExistantes: 32,
	comptesExistants: 5
};

describe('le tirage', () => {
	it('rend la même suite pour une même graine', () => {
		const a = Array.from({ length: 8 }, tirage(42));
		const b = Array.from({ length: 8 }, tirage(42));
		expect(a).toEqual(b);
	});

	it('rend une autre suite pour une autre graine', () => {
		const a = Array.from({ length: 8 }, tirage(42));
		const b = Array.from({ length: 8 }, tirage(43));
		expect(a).not.toEqual(b);
	});

	it('reste dans [0, 1[', () => {
		const de = tirage(GRAINE);
		for (let i = 0; i < 500; i++) {
			const v = de();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

describe('le jeu engendré', () => {
	const jeu = engendrer(VOLUMETRIE_HAUTE, CORPUS_GELE);

	it('est reproductible à la graine près', () => {
		expect(engendrer(VOLUMETRIE_HAUTE, CORPUS_GELE)).toEqual(jeu);
		expect(engendrer(VOLUMETRIE_HAUTE, CORPUS_GELE, GRAINE + 1)).not.toEqual(jeu);
	});

	it('complète les volumes du cahier sans les dépasser', () => {
		expect(jeu.comptes.length + CORPUS_GELE.comptesExistants).toBe(VOLUMETRIE_HAUTE.comptes);
		expect(jeu.univers.length + CORPUS_GELE.universExistants.length).toBe(VOLUMETRIE_HAUTE.univers);
		expect(jeu.domaines.length + 4).toBe(VOLUMETRIE_HAUTE.domaines);
		expect(jeu.dossiers.length).toBe(VOLUMETRIE_HAUTE.dossiers);
	});

	it('pose au palier 0 le nombre de notes annoncé, corpus gelé compris', () => {
		const palier0 = jeu.notes.filter((n) => n.palier === 0);
		expect(palier0.length + CORPUS_GELE.notesExistantes).toBe(VOLUMETRIE_HAUTE.notes);
	});

	it('atteint chaque palier de graphe, cumulativement', () => {
		let cumul = CORPUS_GELE.notesDejaDansLeGraphe;
		const dossiersDuGraphe = new Set(
			jeu.dossiers
				.filter((f) => {
					const engendre = jeu.domaines.find((d) => d.nom === f.domaineNom);
					const gele = CORPUS_GELE.domainesExistants.get('Production')?.includes(f.domaineNom);
					return engendre?.universNom === 'Production' || gele === true;
				})
				.map((f) => f.cle)
		);
		for (const [indice, vise] of VOLUMETRIE_HAUTE.paliersDeGraphe.entries()) {
			const duPalier = jeu.notes.filter(
				(n) => n.palier === indice && dossiersDuGraphe.has(n.dossierCle)
			);
			cumul += duPalier.length;
			expect(cumul).toBe(vise);
		}
	});

	it('ne dépasse jamais la profondeur que le schéma plafonne', () => {
		for (const dossier of jeu.dossiers) {
			expect(dossier.profondeur).toBeGreaterThanOrEqual(2);
			expect(dossier.profondeur).toBeLessThanOrEqual(VOLUMETRIE_HAUTE.profondeurMax);
		}
	});

	it('chaîne les dossiers sur un parent qui existe, ou sur la racine du domaine', () => {
		const cles = new Set(jeu.dossiers.map((f) => f.cle));
		for (const dossier of jeu.dossiers) {
			if (dossier.parentCle !== null) expect(cles.has(dossier.parentCle)).toBe(true);
		}
	});

	it('n’engendre ni relation réflexive, ni doublon', () => {
		const vues = new Set<string>();
		for (const relation of jeu.relations) {
			expect(relation.sourceIdentifiant).not.toBe(relation.cibleIdentifiant);
			const cle = `${relation.sourceIdentifiant} ${relation.cibleIdentifiant} ${relation.indiceType}`;
			expect(vues.has(cle)).toBe(false);
			vues.add(cle);
		}
		expect(jeu.relations.length).toBe(VOLUMETRIE_HAUTE.relations);
	});

	it('donne à chaque objet un identifiant unique et préfixé', () => {
		const tous = [
			...jeu.comptes.map((c) => c.identifiant),
			...jeu.univers.map((u) => u.identifiant),
			...jeu.domaines.map((d) => d.identifiant),
			...jeu.notes.map((n) => n.identifiant)
		];
		for (const identifiant of tous) expect(identifiant.startsWith(PREFIXE)).toBe(true);
		expect(new Set(tous).size).toBe(tous.length);
	});

	it('rend un corps que le schéma accepte, et dont l’extrait se dérive', () => {
		const corps = corpsDeNote('un texte');
		expect(corps.type).toBe('doc');
		expect(corps.content[0]?.content[0]?.text).toBe('un texte');
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   LE CAS D'ÉPREUVE SYNTHÉTIQUE DE `P-26` — il ne dépend d'aucun état du dépôt,
   et il reste exercé APRÈS que le retrait a été jugé correct.
   ═════════════════════════════════════════════════════════════════════════ */

describe('le retrait', () => {
	it('ne vise que le préfixe, sur les cinq tables qu’il touche', () => {
		const lignes = lignesDeRetrait();
		expect(lignes).toHaveLength(5);
		for (const ligne of lignes) expect(ligne).toContain(`like '${PREFIXE}%'`);
	});

	it('ne peut pas atteindre un identifiant du corpus gelé', () => {
		/* Les quatre formes que le corpus gelé porte réellement. Aucune ne
		   commence par le préfixe ; si un jour l'une d'elles le faisait, ce cas
		   rougirait AVANT que le retrait n'emporte la référence du banc. */
		const duGel = ['n-astreinte', 'n-bkp-01', 'infrastructure', 'sophie.nguyen'];
		const motif = new RegExp(`^${PREFIXE}`);
		for (const identifiant of duGel) expect(motif.test(identifiant)).toBe(false);
	});
});
