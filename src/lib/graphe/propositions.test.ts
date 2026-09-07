/**
 * LA RÈGLE DE PROPOSITION — ce qu'elle avance, et surtout ce qu'elle TAIT.
 *
 * LE PREMIER CAS EST LE PLUS IMPORTANT : sur un corpus sans relation déclarée, la
 * règle ne propose RIEN. Une version antérieure nommait six types en dur — ceux du jeu
 * de démonstration — et ne proposait donc rien du tout sur une instance dont le
 * référentiel porte d'autres identifiants, sans qu'aucun message ne le dise. Le test
 * ci-dessous fixe le remède : les types sortent des relations déclarées, jamais du
 * code.
 */
import { describe, expect, it } from 'vitest';
import { propositionsDeMention, usagesParCouple } from './propositions';
import { cleDeTriplet } from '../donnees/relations';
import type { RelationLisible } from '../donnees/outils';
import type { Note } from '../../../seeds/corpus';

function note(id: string, typeFiche?: string): Note {
	return {
		id,
		titre: id,
		extrait: '',
		type: 'Fiche',
		typeFiche,
		univers: 'U',
		domaine: 'D',
		dossier: '',
		auteur: '',
		fraicheur: 'frais',
		jours: 0,
		revise: null,
		vues: 0,
		pj: 0,
		brouillon: false,
		visibilite: 'interne',
		operationnel: false,
		etiquettes: []
	} as unknown as Note;
}

function lien(de: string, vers: string, type: string, origine: string): RelationLisible {
	return { id: 'r', de, vers, type, origine } as unknown as RelationLisible;
}

const SERVEURS = ['s1', 's2', 's3'].map((i) => note(i, 'Serveur'));
const APPLICATIONS = ['a1', 'a2', 'a3'].map((i) => note(i, 'Application'));
const NOTES = [...SERVEURS, ...APPLICATIONS];

/** L'ensemble vide des refus — le cas de toute instance qui n'a rien refusé. */
const AUCUN_REFUS: ReadonlySet<string> = new Set();

describe('la règle de proposition', () => {
	it('ne propose RIEN quand aucune relation nest déclarée', () => {
		const mentions = [lien('s1', 'a1', 'mentionne', 'deduite')];
		expect(propositionsDeMention(NOTES, [], mentions, AUCUN_REFUS)).toEqual([]);
	});

	it('nomme le type que le corpus emploie déjà entre ces deux types de notes', () => {
		const declarees = [
			lien('s1', 'a1', 'depend-de', 'declaree'),
			lien('s2', 'a2', 'depend-de', 'declaree')
		];
		const mentions = [lien('s3', 'a3', 'mentionne', 'deduite')];
		const proposees = propositionsDeMention(NOTES, declarees, mentions, AUCUN_REFUS);
		expect(proposees).toHaveLength(1);
		expect(proposees[0]?.type).toBe('depend-de');
		expect(proposees[0]?.de).toBe('s3');
		expect(proposees[0]?.vers).toBe('a3');
		expect(proposees[0]?.motif).toContain('2 relations');
	});

	it('exige plus dun exemple — une relation isolée est une anecdote', () => {
		const declarees = [lien('s1', 'a1', 'depend-de', 'declaree')];
		const mentions = [lien('s3', 'a3', 'mentionne', 'deduite')];
		expect(propositionsDeMention(NOTES, declarees, mentions, AUCUN_REFUS)).toEqual([]);
	});

	it('se tait quand deux types sont à égalité sur le même couple', () => {
		const declarees = [
			lien('s1', 'a1', 'depend-de', 'declaree'),
			lien('s2', 'a2', 'depend-de', 'declaree'),
			lien('s1', 'a2', 'documente', 'declaree'),
			lien('s2', 'a1', 'documente', 'declaree')
		];
		const mentions = [lien('s3', 'a3', 'mentionne', 'deduite')];
		expect(propositionsDeMention(NOTES, declarees, mentions, AUCUN_REFUS)).toEqual([]);
	});

	it('respecte le SENS du couple — Serveur vers Application nest pas linverse', () => {
		const declarees = [
			lien('s1', 'a1', 'depend-de', 'declaree'),
			lien('s2', 'a2', 'depend-de', 'declaree')
		];
		const mentions = [lien('a3', 's3', 'mentionne', 'deduite')];
		expect(propositionsDeMention(NOTES, declarees, mentions, AUCUN_REFUS)).toEqual([]);
	});

	it('ne sappuie jamais sur une proposition pour en produire une autre', () => {
		/* Sans cette règle, la première proposition posée par erreur se répandrait sur
		   tout le corpus au clic suivant. */
		const declarees = [
			lien('s1', 'a1', 'depend-de', 'ambigue'),
			lien('s2', 'a2', 'depend-de', 'ambigue')
		];
		const mentions = [lien('s3', 'a3', 'mentionne', 'deduite')];
		expect(propositionsDeMention(NOTES, declarees, mentions, AUCUN_REFUS)).toEqual([]);
	});

	it('relève un usage dominant par couple, et le compte', () => {
		const usages = usagesParCouple(NOTES, [
			lien('s1', 'a1', 'depend-de', 'declaree'),
			lien('s2', 'a2', 'depend-de', 'declaree'),
			lien('s3', 'a3', 'documente', 'declaree')
		]);
		expect(usages.get('Serveur → Application')).toEqual({ type: 'depend-de', exemples: 2 });
	});
});

describe('la mémoire des refus', () => {
	/** L'usage qui décide : deux Serveur → Application déclarés, donc `depend-de`. */
	const DECLAREES = [
		lien('s1', 'a1', 'depend-de', 'declaree'),
		lien('s2', 'a2', 'depend-de', 'declaree')
	];
	const MENTION = [lien('s3', 'a3', 'mentionne', 'deduite')];

	it('un triplet refusé nest plus proposé', () => {
		const refuses = new Set([cleDeTriplet('s3', 'a3', 'depend-de')]);
		expect(propositionsDeMention(NOTES, DECLAREES, MENTION, refuses)).toEqual([]);
	});

	it('le refus porte sur le TRIPLET, pas sur la paire', () => {
		/* Refuser « s3 dépend de a3 » ne dit rien de « s3 documente a3 » : si l'usage
		   du corpus bascule sur `documente`, la proposition revient — sous l'autre
		   type, qui est un autre fait. */
		const refuses = new Set([cleDeTriplet('s3', 'a3', 'documente')]);
		const proposees = propositionsDeMention(NOTES, DECLAREES, MENTION, refuses);
		expect(proposees).toHaveLength(1);
		expect(proposees[0]?.type).toBe('depend-de');
	});

	it('le refus porte sur le SENS', () => {
		const refuses = new Set([cleDeTriplet('a3', 's3', 'depend-de')]);
		expect(propositionsDeMention(NOTES, DECLAREES, MENTION, refuses)).toHaveLength(1);
	});

	it('un refus sur un couple sans mention ne fait rien', () => {
		const refuses = new Set([cleDeTriplet('s1', 'a2', 'depend-de')]);
		expect(propositionsDeMention(NOTES, DECLAREES, MENTION, refuses)).toHaveLength(1);
	});
});

/**
 * LA CITATION MUTUELLE — le défaut relevé au rejeu : le bouton disait « Proposer 3 »,
 * le clic en posait 2, et rien ne le disait. Deux notes qui se citent l'une l'autre
 * produisaient DEUX propositions sur la même paire non orientée ; l'écriture en
 * écartait une sur la règle « la paire est déjà reliée ».
 *
 * LE REMÈDE N'EST PAS UNE DÉDUPLICATION. Garder le premier sens dans l'ordre lexical
 * serait un tirage au sort porté par un écran qui dit « à confirmer ». Le corpus dit
 * que ces deux notes se citent, il ne dit pas laquelle dépend de l'autre : le produit
 * n'a rien à proposer.
 */
describe('la citation mutuelle', () => {
	/** L'usage qui décide, bien établi : deux Serveur → Application déclarés. */
	const DECLAREES = [
		lien('s1', 'a1', 'depend-de', 'declaree'),
		lien('s2', 'a2', 'depend-de', 'declaree')
	];

	/**
	 * LE MÊME USAGE, ÉTABLI DANS LES DEUX SENS. Sans les deux, l'absence de
	 * proposition sur le sens retour s'expliquerait par le manque de matière, et le
	 * silence qu'on éprouve ici ne prouverait rien de la règle qu'on répare.
	 */
	const DECLAREES_DEUX_SENS = [
		...DECLAREES,
		lien('a1', 's2', 'documente', 'declaree'),
		lien('a2', 's1', 'documente', 'declaree')
	];

	it('deux notes qui se citent mutuellement ne donnent aucune proposition', () => {
		const mentions = [
			lien('s3', 'a3', 'mentionne', 'deduite'),
			lien('a3', 's3', 'mentionne', 'deduite')
		];
		expect(propositionsDeMention(NOTES, DECLAREES_DEUX_SENS, mentions, AUCUN_REFUS)).toEqual([]);
	});

	it('une citation dans un seul sens donne toujours sa proposition', () => {
		const mentions = [lien('s3', 'a3', 'mentionne', 'deduite')];
		const proposees = propositionsDeMention(NOTES, DECLAREES, mentions, AUCUN_REFUS);
		expect(proposees).toHaveLength(1);
		expect(proposees[0]?.de).toBe('s3');
		expect(proposees[0]?.vers).toBe('a3');
	});

	it('la paire mutuelle se tait sans emporter les citations voisines', () => {
		const mentions = [
			lien('s3', 'a3', 'mentionne', 'deduite'),
			lien('a3', 's3', 'mentionne', 'deduite'),
			lien('s1', 'a3', 'mentionne', 'deduite')
		];
		const proposees = propositionsDeMention(NOTES, DECLAREES, mentions, AUCUN_REFUS);
		expect(proposees).toHaveLength(1);
		expect(proposees[0]?.de).toBe('s1');
		expect(proposees[0]?.vers).toBe('a3');
	});

	/**
	 * LA PROPRIÉTÉ QUI A MANQUÉ. Ce que `propositionsDeMention()` rend est ce que
	 * `proposerLesRelations()` peut poser. Cette dernière parle à PostgreSQL ; ce
	 * qu'on rejoue ici est sa seule règle purement combinatoire — une paire NON
	 * ORIENTÉE ne reçoit qu'une écriture —, sur un jeu où aucun droit ne manque,
	 * aucun type n'est absent et aucun refus n'est posé.
	 */
	it('le compte annoncé est celui que lécriture pose', () => {
		const mentions = [
			lien('s1', 'a1', 'mentionne', 'deduite'),
			lien('a1', 's1', 'mentionne', 'deduite'),
			lien('s2', 'a2', 'mentionne', 'deduite'),
			lien('s3', 'a3', 'mentionne', 'deduite'),
			lien('a3', 's3', 'mentionne', 'deduite')
		];
		const annonce = propositionsDeMention(NOTES, DECLAREES_DEUX_SENS, mentions, AUCUN_REFUS);
		expect(annonce).toHaveLength(1);

		const pairesEcrites = new Set<string>();
		let posees = 0;
		for (const p of annonce) {
			const paire = p.de < p.vers ? p.de + ' ' + p.vers : p.vers + ' ' + p.de;
			if (pairesEcrites.has(paire)) continue;
			pairesEcrites.add(paire);
			posees += 1;
		}
		expect(posees).toBe(annonce.length);
	});
});
