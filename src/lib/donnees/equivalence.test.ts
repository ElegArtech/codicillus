/**
 * LES UNITAIRES DE LA BATTERIE D'ÉQUIVALENCE — l'instrument, sans base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LES SONDES SONT ÉPROUVÉES ICI, SUR DES NOTES SYNTHÉTIQUES
 *
 * P-26 énonce la règle, et le dépôt l'a payée trois fois : « un contrôle dont
 * le seul cas d'épreuve est le défaut qu'il trouve devient inerte en
 * réussissant ». Les trois sondes de `verif:donnees` ne sont exercées, en
 * service, que par l'état de la base — et le jour où une migration referme une
 * lacune, ou change une valeur, une sonde peut cesser de mordre sans que rien ne
 * le dise.
 *
 * Les cas ci-dessous sont donc SYNTHÉTIQUES et indépendants du dépôt : ils ne
 * lisent ni la base, ni `seeds/corpus.ts`. C'est ce que `verif/fraicheur.test.ts`
 * fait pour le contrôle B3 de la batterie 5, et c'est pourquoi ce contrôle-là est
 * resté éprouvé après sa propre correction.
 */
import { describe, expect, it } from 'vitest';
import type { Note } from '../../../seeds/corpus';
import { SONDES, lacunes, premiereDifference } from './equivalence';

/** Une note de forme complète, sans aucun champ optionnel. */
const NOTE_NUE = {
	id: 'n-epreuve',
	titre: 'Une note d’épreuve',
	extrait: 'Un extrait.',
	type: 'Note',
	univers: 'Production',
	domaine: 'Infrastructure',
	dossier: 'Exploitation',
	auteur: 'Karim Belhadj',
	fraicheur: 'frais',
	jours: 3,
	revise: '10/08/2026',
	vues: 1,
	pj: 0,
	brouillon: false,
	visibilite: 'Interne',
	operationnel: false,
	etiquettes: ['une']
} as unknown as Note;

/** La même, jamais vérifiée : `revise` nul, que la sonde de date doit ignorer. */
const NOTE_SANS_REVISION = { ...NOTE_NUE, id: 'n-jamais', revise: null } as unknown as Note;

describe('la comparaison profonde', () => {
	it('ne voit aucune différence entre deux objets identiques', () => {
		expect(premiereDifference({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toBeNull();
	});

	it('voit une clé POSÉE À `undefined` là où l’autre l’OMET', () => {
		/* LA PROPRIÉTÉ QU'AUCUNE SÉRIALISATION NE VOIT, et c'est pour elle que la
		   comparaison n'est pas écrite sur `JSON.stringify` : les deux objets ci-
		   dessous s'y sérialisent à l'identique. `interface Note` déclare trois
		   champs optionnels ; une couche qui les poserait au lieu de les omettre
		   rendrait des objets de forme différente, et rien ne le signalerait. */
		const omis: Record<string, unknown> = { a: 1 };
		const pose: Record<string, unknown> = { a: 1, b: undefined };
		expect(JSON.stringify(omis)).toBe(JSON.stringify(pose));
		expect(premiereDifference(omis, pose)).toMatch(/clés différentes/);
	});

	it('nomme le chemin de la première différence', () => {
		expect(premiereDifference({ a: { b: [0, 7] } }, { a: { b: [0, 8] } })).toMatch(/a\.b\[1\]/);
	});

	it('distingue un tableau plus court d’un tableau différent', () => {
		expect(premiereDifference([1, 2], [1])).toMatch(/2 élément\(s\) \/ 1/);
	});
});

describe('les sondes — chacune sur un cas qui la sollicite (P-5)', () => {
	const sonde = (genre: string) => {
		const trouvee = SONDES.find((s) => s.genre === genre);
		if (trouvee === undefined) throw new Error(`sonde absente : ${genre}`);
		return trouvee;
	};

	it('`date-decalee` recule d’un jour toute date de vérification', () => {
		const { notes, touches } = sonde('date-decalee').muter([NOTE_NUE]);
		expect(touches).toBe(1);
		expect(notes[0]?.revise).toBe('09/08/2026');
		/* Et la mutation doit se VOIR de la comparaison : une sonde qui touche
		   sans que la mesure bouge est une sonde inerte déguisée. */
		expect(premiereDifference(NOTE_NUE, notes[0])).toMatch(/revise/);
	});

	it('`date-decalee` recule correctement par-dessus un début de mois', () => {
		const premier = { ...NOTE_NUE, revise: '01/08/2026' } as unknown as Note;
		expect(sonde('date-decalee').muter([premier]).notes[0]?.revise).toBe('31/07/2026');
	});

	it('`date-decalee` ne touche pas une note jamais vérifiée', () => {
		const { notes, touches } = sonde('date-decalee').muter([NOTE_SANS_REVISION]);
		expect(touches).toBe(0);
		expect(notes[0]?.revise).toBeNull();
	});

	it('`optionnel-pose` pose les champs optionnels sans changer une valeur', () => {
		const { notes, touches } = sonde('optionnel-pose').muter([NOTE_NUE]);
		expect(touches).toBe(1);
		const mutee = notes[0] as unknown as Record<string, unknown>;
		expect('typeFiche' in mutee).toBe(true);
		expect(mutee['typeFiche']).toBeUndefined();
		/* Aucune valeur ne change — seule la forme. C'est exactement ce que la
		   comparaison des ensembles de clés existe pour attraper. */
		expect(JSON.stringify(mutee)).toBe(JSON.stringify(NOTE_NUE));
		expect(premiereDifference(NOTE_NUE, notes[0])).toMatch(/clés différentes/);
	});

	it('`temoin-inerte` ne touche RIEN, et c’est sa raison d’être', () => {
		const { notes, touches } = sonde('temoin-inerte').muter([NOTE_NUE, NOTE_SANS_REVISION]);
		expect(touches).toBe(0);
		/* Le témoin doit être vraiment inerte : si la comparaison voyait quelque
		   chose, le refus de conclure ne serait jamais atteint et la garde qui
		   protège du faux vert serait, elle, une règle qu'aucun cas n'exerce. */
		expect(premiereDifference(NOTE_NUE, notes[0])).toBeNull();
		expect(premiereDifference(NOTE_SANS_REVISION, notes[1])).toBeNull();
	});

	it('les trois sondes sont posées, et le témoin inerte en fait partie', () => {
		expect(SONDES.map((s) => s.genre)).toEqual(['date-decalee', 'optionnel-pose', 'temoin-inerte']);
	});
});

describe('les lacunes', () => {
	it('chacune nomme sa forme, son chiffre, sa cause et ce qui la fermerait', () => {
		const lesLacunes = lacunes();
		expect(lesLacunes.length).toBeGreaterThan(0);
		for (const lacune of lesLacunes) {
			expect(lacune.forme).not.toBe('');
			expect(lacune.champ).not.toBe('');
			/* Le chiffre est RECALCULÉ, jamais recopié : une lacune qu'une
			   migration referme doit se voir maigrir, pas rester à son décompte
			   d'origine (P-21). */
			expect(lacune.combien).toMatch(/\d/);
			expect(lacune.pourquoi.length).toBeGreaterThan(40);
			expect(lacune.ceQuiLaFermerait).not.toBe('');
		}
	});
});
