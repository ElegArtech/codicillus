/**
 * LES FAMILLES SÉMANTIQUES — `RG-M09-06` et M09.6.
 *
 * CE QUE CES CONTRÔLES ÉPROUVENT, ET POURQUOI ILS SONT ÉCRITS AINSI. Les notes ne sont
 * pas fabriquées de toutes pièces : elles sont prises dans `seeds/corpus.ts`, dont la
 * forme est celle que `lireNotesLisibles()` rend, et seuls les TROIS champs dont le
 * regroupement dépend — titre, dossier, étiquettes — sont posés par le cas. Un objet
 * inventé de bout en bout prouverait la forme du cas, pas celle du produit.
 *
 * QUATRE PROPRIÉTÉS SONT EN JEU :
 *   • le regroupement se fait SANS RELATION — c'est la lettre de M09.6 ;
 *   • il est DÉTERMINISTE — sans quoi la date afficherait un découpage qui bouge seul ;
 *   • il ne franchit JAMAIS le périmètre — ni par un membre, ni par un compteur, ni par
 *     un nom de famille, qui est un trait relevé sur les notes reçues ;
 *   • il n'est PAS REFAIT à chaque consultation, et la date le dit.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { CORPUS, type Note } from '../../../seeds/corpus';
import {
	PERIODE_DE_RECALCUL_MS,
	calculerLesFamilles,
	empreinteDuCorpus,
	famillesDuPerimetre,
	oublierLesFamilles
} from './familles';

/** L'instant du calcul. Fixe : une date affichée ne dépend pas de l'heure d'exécution. */
const INSTANT = new Date('2026-08-18T14:03:00Z');

/**
 * Une note du corpus, dont on repose le sujet. Le reste — type, auteur, fraîcheur,
 * visibilité — est celui d'une note réelle, et il ne doit RIEN changer au regroupement.
 */
function sujet(rang: number, titre: string, dossier: string, etiquettes: readonly string[]): Note {
	const base = CORPUS[rang];
	if (base === undefined) throw new Error(`le corpus n'a pas de note de rang ${rang}`);
	return { ...base, titre, dossier, etiquettes };
}

/**
 * LE CORPUS D'ÉPREUVE — douze notes, deux grappes nettes et deux solitaires. AUCUNE
 * RELATION N'EST DÉCLARÉE NULLE PART : c'est exactement le cas que M09.6 vise, « les
 * notes qui parlent du même sujet sans être liées ».
 */
function douzeNotes(): readonly Note[] {
	const sauvegardes = [0, 1, 2, 3, 4, 5].map((i) =>
		sujet(i, `Alpha${i}`, 'Sauvegardes', ['sauvegarde'])
	);
	const annuaire = [6, 7, 8, 9].map((i) => sujet(i, `Beta${i}`, 'Annuaire', ['annuaire']));
	const solitaires = [
		sujet(10, 'Gamma', 'Divers', ['licence']),
		sujet(11, 'Delta', 'Archives', ['inventaire'])
	];
	return [...sauvegardes, ...annuaire, ...solitaires];
}

const GLOBAL = { type: 'global' } as const;

beforeEach(() => {
	oublierLesFamilles();
});

describe('le regroupement, sans une seule relation déclarée', () => {
	it('rend deux familles nommées de ce que leurs notes partagent, et compte les solitaires', () => {
		const resultat = calculerLesFamilles(douzeNotes(), INSTANT);

		expect(resultat.familles).toHaveLength(2);
		expect(resultat.familles.map((f) => f.nom).sort()).toEqual(['annuaire', 'sauvegarde']);
		expect(resultat.familles.map((f) => f.membres.length).sort()).toEqual([4, 6]);
		expect(resultat.sansFamille).toBe(2);
		expect(resultat.notesExaminees).toBe(12);
	});

	it("le nom vient d'un trait des notes de la famille, et il est dit en toutes lettres", () => {
		const resultat = calculerLesFamilles(douzeNotes(), INSTANT);
		for (const famille of resultat.familles) {
			expect(famille.nature).toBe('etiquette');
			expect(famille.origine).toBe("d'après l'étiquette");
		}
	});

	it('deux calculs du même corpus rendent le même découpage — aucun tirage', () => {
		const premier = calculerLesFamilles(douzeNotes(), INSTANT);
		const second = calculerLesFamilles(douzeNotes(), INSTANT);
		expect(second.familles).toEqual(premier.familles);
	});

	it('un trait porté par tout le périmètre rend UNE famille, jamais « aucune »', () => {
		/* Douze notes dans le MÊME dossier, sans étiquette et sans mot de titre
		   partagé. Le regroupement juste est « une seule famille » : répondre
		   « aucune famille » ferait dire à l'écran que ces notes ne partagent rien. */
		const uniformes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => ({
			...sujet(i, `Mot${i}`, 'Racine', []),
			univers: 'Production',
			domaine: 'Infrastructure'
		}));
		const resultat = calculerLesFamilles(uniformes, INSTANT);
		expect(resultat.familles).toHaveLength(1);
		expect(resultat.familles[0]?.nom).toBe('Racine');
		expect(resultat.familles[0]?.nature).toBe('dossier');
		expect(resultat.sansFamille).toBe(0);
	});

	it('un périmètre sans aucun trait partagé rend zéro famille, et le dit', () => {
		const etrangeres = [0, 1, 2].map((i) => sujet(i, `Mot${i}`, `Dossier${i}`, [`etiquette${i}`]));
		const resultat = calculerLesFamilles(etrangeres, INSTANT);
		expect(resultat.familles).toHaveLength(0);
		expect(resultat.sansFamille).toBe(3);
	});
});

describe("le produit commence vide, et l'écran ne doit pas s'en apercevoir par une exception", () => {
	it('zéro note rend zéro famille, et une date quand même', () => {
		const resultat = calculerLesFamilles([], INSTANT);
		expect(resultat.familles).toHaveLength(0);
		expect(resultat.sansFamille).toBe(0);
		expect(resultat.notesExaminees).toBe(0);
		expect(resultat.calculeLe).toBe(INSTANT.toISOString());
	});

	it('une seule note ne fait pas une famille', () => {
		const resultat = calculerLesFamilles([sujet(0, 'Seule', 'Racine', ['unique'])], INSTANT);
		expect(resultat.familles).toHaveLength(0);
		expect(resultat.sansFamille).toBe(1);
	});
});

describe('le périmètre — `ADR-006` : rien ne franchit le bord, pas même un nom', () => {
	/** Six notes de deux domaines : trois d'un côté, trois de l'autre. */
	function deuxDomaines(): readonly Note[] {
		const ici = [0, 1, 2].map((i) => ({
			...sujet(i, `Ici${i}`, 'Exploitation', ['exploitation']),
			univers: 'Production',
			domaine: 'Infrastructure'
		}));
		const ailleurs = [3, 4, 5].map((i) => ({
			...sujet(i, `Secret${i}`, 'Confidentiel', ['confidentiel']),
			univers: 'Direction',
			domaine: 'Ressources humaines'
		}));
		return [...ici, ...ailleurs];
	}

	it('un domaine ne voit ni les membres, ni le compte, ni le nom des familles voisines', () => {
		const resultat = famillesDuPerimetre(
			deuxDomaines(),
			{ type: 'domaine', nom: 'Infrastructure' },
			INSTANT
		);
		expect(resultat.notesExaminees).toBe(3);
		expect(resultat.familles.map((f) => f.nom)).toEqual(['exploitation']);
		const texte = JSON.stringify(resultat);
		expect(texte).not.toContain('confidentiel');
		expect(texte).not.toContain('Secret');
	});

	it('une note absente de la liste reçue est absente de tout le résultat', () => {
		/* Le contrôle du droit LUI-MÊME est dans la requête (`lireNotesLisibles`) :
		   ce qui est éprouvé ici est que le calcul n'ajoute rien à ce qu'il reçoit. */
		const toutes = douzeNotes();
		const restreint = toutes.slice(0, 6);
		const resultat = calculerLesFamilles(restreint, INSTANT);
		const vus = new Set(resultat.familles.flatMap((f) => [...f.membres]));
		for (const note of toutes.slice(6)) expect(vus.has(note.id)).toBe(false);
		expect(resultat.notesExaminees).toBe(6);
	});
});

describe('la date de calcul — `RG-M09-06`, « pas à chaque consultation »', () => {
	it('deux consultations rapprochées du même corpus rendent la MÊME date', () => {
		const notes = douzeNotes();
		const premiere = famillesDuPerimetre(notes, GLOBAL, INSTANT);
		const seconde = famillesDuPerimetre(notes, GLOBAL, new Date(INSTANT.getTime() + 60_000));
		expect(seconde.calculeLe).toBe(premiere.calculeLe);
		expect(seconde.calculeLe).toBe(INSTANT.toISOString());
	});

	it('un corpus qui a bougé est recalculé, et la date le dit', () => {
		const notes = douzeNotes();
		famillesDuPerimetre(notes, GLOBAL, INSTANT);

		const plusTard = new Date(INSTANT.getTime() + 60_000);
		const bouge = [...notes, sujet(12, 'Epsilon', 'Sauvegardes', ['sauvegarde'])];
		const apres = famillesDuPerimetre(bouge, GLOBAL, plusTard);
		expect(apres.calculeLe).toBe(plusTard.toISOString());
		expect(apres.notesExaminees).toBe(13);
	});

	it('une étiquette posée sur une note suffit à faire bouger le corpus', () => {
		const notes = douzeNotes();
		const premiere = notes[11];
		if (premiere === undefined) throw new Error('corpus incomplet');
		expect(empreinteDuCorpus(notes)).not.toBe(
			empreinteDuCorpus([...notes.slice(0, 11), { ...premiere, etiquettes: ['sauvegarde'] }])
		);
	});

	it('un corpus inchangé est refait au bout de la période, et pas avant', () => {
		const notes = douzeNotes();
		famillesDuPerimetre(notes, GLOBAL, INSTANT);

		const avant = new Date(INSTANT.getTime() + PERIODE_DE_RECALCUL_MS - 1000);
		expect(famillesDuPerimetre(notes, GLOBAL, avant).calculeLe).toBe(INSTANT.toISOString());

		const apres = new Date(INSTANT.getTime() + PERIODE_DE_RECALCUL_MS + 1000);
		expect(famillesDuPerimetre(notes, GLOBAL, apres).calculeLe).toBe(apres.toISOString());
	});

	it('deux périmètres du même corpus ont chacun leur découpage, et leur date', () => {
		const notes = douzeNotes();
		const global = famillesDuPerimetre(notes, GLOBAL, INSTANT);
		const plusTard = new Date(INSTANT.getTime() + 60_000);
		const domaine = famillesDuPerimetre(
			notes,
			{ type: 'domaine', nom: notes[0]?.domaine ?? '' },
			plusTard
		);
		expect(global.calculeLe).toBe(INSTANT.toISOString());
		expect(domaine.calculeLe).toBe(plusTard.toISOString());
	});
});
