/**
 * LES UNITAIRES DE LA BATTERIE D'ÉQUIVALENCE — l'instrument, sans base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LES SONDES SONT ÉPROUVÉES ICI, SUR DES NOTES SYNTHÉTIQUES
 *
 * P-26 énonce la règle, et le dépôt l'a payée trois fois : « un contrôle dont
 * le seul cas d'épreuve est le défaut qu'il trouve devient inerte en
 * réussissant ». Les quatre sondes de `verif:donnees` ne sont exercées, en
 * service, que par l'état de la base — et le jour où une migration referme une
 * lacune, ou change une valeur, une sonde peut cesser de mordre sans que rien ne
 * le dise.
 *
 * Les cas ci-dessous sont donc SYNTHÉTIQUES et indépendants du dépôt : ils ne
 * lisent ni la base, ni `seeds/corpus.ts`. C'est ce que le contrôle de fraîcheur
 * fait pour le contrôle B3 de la batterie 5, et c'est pourquoi ce contrôle-là est
 * resté éprouvé après sa propre correction.
 *
 * `T-049` A DOUBLÉ CE FICHIER, et pour une raison qui est le sujet même du lot :
 * `chiffrerLesLacunes()` remplace un tableau de littéraux par une MESURE, donc
 * par du code qui décide seul de ce qui figure au rapport. Un tel code se trompe
 * dans les deux sens — en gardant une lacune refermée, et en effaçant une lacune
 * ouverte. Le second est silencieux : il ressemble à un progrès. Les épreuves de
 * la seconde moitié n'existent que pour lui.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS, type Note } from '../../../seeds/corpus';
import type { Base } from '../base/acces';
import {
	CANDIDATS_DE_LACUNE,
	SONDES,
	champsDeCompteEnLacune,
	chiffrerLesLacunes,
	normalisationDesNotes,
	premiereDifference,
	type CandidatDeLacune
} from './equivalence';

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

	it('`ordre-etiquettes` trie ce que le jeu ordonne, et la comparaison le voit', () => {
		/* LA SONDE QUE `T-049` A DÛ AJOUTER. Refermer la lacune d'ordre a rendu
		   l'ordre mesurable ; sans une mutation qui le dérange, personne ne saurait
		   si la mesure retrouvée MORD. La note d'épreuve porte donc deux étiquettes
		   dont l'ordre du jeu n'est PAS l'ordre alphabétique. */
		const desordre = { ...NOTE_NUE, etiquettes: ['sauvegarde', 'bases'] } as unknown as Note;
		const { notes, touches } = sonde('ordre-etiquettes').muter([desordre]);
		expect(touches).toBe(1);
		expect(notes[0]?.etiquettes).toEqual(['bases', 'sauvegarde']);
		expect(premiereDifference(desordre, notes[0])).toMatch(/etiquettes/);
	});

	it('`ordre-etiquettes` ne touche pas une note déjà dans l’ordre alphabétique', () => {
		/* La polarité inverse : une sonde qui toucherait TOUT ne distinguerait plus
		   un ordre juste d'un ordre faux, et son décompte de `touches` mentirait. */
		const range = { ...NOTE_NUE, etiquettes: ['bases', 'sauvegarde'] } as unknown as Note;
		expect(sonde('ordre-etiquettes').muter([range]).touches).toBe(0);
	});

	it('les quatre sondes sont posées, et le témoin inerte en fait partie', () => {
		expect(SONDES.map((s) => s.genre)).toEqual([
			'date-decalee',
			'optionnel-pose',
			'ordre-etiquettes',
			'temoin-inerte'
		]);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   LES LACUNES, ET LA PREUVE QUE L'INSTRUMENT RÉPARÉ SAIT ENCORE DIRE NON

   `chiffrerLesLacunes()` a remplacé un tableau de six littéraux. Le gain est
   qu'une lacune refermée disparaît d'elle-même ; le RISQUE est exactement
   symétrique, et il faut le nommer : une fonction qui décide seule de ce qui
   disparaît du rapport peut tout faire disparaître. Un instrument qui ne rend
   plus jamais de lacune serait vert, silencieux, et faux.

   Les cas ci-dessous sont donc SYNTHÉTIQUES au sens de P-26 : ils n'interrogent
   ni la base réelle, ni l'état du dépôt. Ils fabriquent des candidats dont la
   mesure est connue d'avance et exigent le verdict. Le jour où les quatre
   lacunes qui restent seront refermées, ces épreuves seront TOUJOURS exercées —
   c'est précisément ce que la sonde de restitution de focus n'avait pas, et ce
   qui l'a rendue inerte en réussissant.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Un candidat dont la mesure est dictée par l'épreuve, jamais par la base. */
const candidat = (
	champ: string,
	attendu: number,
	restituables: number,
	forme = 'Épreuve'
): CandidatDeLacune => ({
	forme,
	champ,
	pourquoi: 'un motif d’épreuve, assez long pour satisfaire les exigences de forme du rapport.',
	ceQuiLaFermerait: 'rien — ce candidat n’existe que pour cette épreuve',
	mesurer: () =>
		Promise.resolve({
			attendu,
			restituables,
			combien: `${String(restituables)}/${String(attendu)}`
		})
});

/** La mesure n'a besoin d'aucune base : aucun candidat d'épreuve ne l'interroge. */
const SANS_BASE = { base: null as unknown as Base, comptesRendus: [] };

describe('les lacunes — mesurées, et non plus déclarées', () => {
	it('UNE LACUNE INVENTÉE FAIT ROUGIR : le rapport la porte et la compte', async () => {
		/* LE CAS QUI PROTÈGE DU FAUX VERT. Un candidat que la base ne sert pas doit
		   apparaître, quoi qu'il arrive — sans quoi `chiffrerLesLacunes()` pourrait
		   se contenter de rendre le tableau vide et la batterie serait verte. */
		const ouvertes = await chiffrerLesLacunes(SANS_BASE, [candidat('inventee', 5, 0)]);
		expect(ouvertes).toHaveLength(1);
		expect(ouvertes[0]?.champ).toBe('inventee');
		expect(ouvertes[0]?.combien).toBe('0/5');
	});

	it('une lacune SERVIE À MOITIÉ reste ouverte — l’égalité seule la referme', async () => {
		const ouvertes = await chiffrerLesLacunes(SANS_BASE, [candidat('partielle', 5, 4)]);
		expect(ouvertes).toHaveLength(1);
	});

	it('une lacune SERVIE disparaît d’elle-même, sans qu’on la retire', async () => {
		/* LA PROMESSE QUE L'ANCIEN ENTÊTE FAISAIT SANS L'ÉCRIRE. C'est le seul
		   chemin par lequel une entrée peut quitter le rapport. */
		const ouvertes = await chiffrerLesLacunes(SANS_BASE, [candidat('servie', 5, 5)]);
		expect(ouvertes).toHaveLength(0);
	});

	it('ne referme PAS sur un compte négatif ou aberrant — elle exige `>=`', async () => {
		const ouvertes = await chiffrerLesLacunes(SANS_BASE, [candidat('aberrante', 5, -1)]);
		expect(ouvertes).toHaveLength(1);
	});

	it('mesure CHAQUE candidat, sans s’arrêter au premier refermé', async () => {
		/* Une boucle qui sortirait au premier `continue` mal placé masquerait les
		   lacunes suivantes — un faux vert qui ressemble à un résultat (P-18). */
		const ouvertes = await chiffrerLesLacunes(SANS_BASE, [
			candidat('a', 1, 1),
			candidat('b', 1, 0),
			candidat('c', 1, 1),
			candidat('d', 2, 0)
		]);
		expect(ouvertes.map((l) => l.champ)).toEqual(['b', 'd']);
	});

	it('chaque candidat POSÉ nomme sa forme, sa cause et ce qui la fermerait', () => {
		/* Le chiffre, lui, n'est plus contrôlé ici : il n'existe qu'une fois
		   MESURÉ. C'est le changement que ce lot introduit — l'ancienne épreuve
		   vérifiait qu'un littéral contenait un chiffre, ce qui était vrai même
		   quand le chiffre était périmé depuis deux migrations. */
		expect(CANDIDATS_DE_LACUNE.length).toBeGreaterThan(0);
		for (const c of CANDIDATS_DE_LACUNE) {
			expect(c.forme).not.toBe('');
			expect(c.champ).not.toBe('');
			expect(c.pourquoi.length).toBeGreaterThan(40);
			expect(c.ceQuiLaFermerait).not.toBe('');
		}
	});
});

describe('la normalisation — elle suit la mesure, et ne survit pas à la lacune', () => {
	const lacuneDe = (forme: string, champ: string) => ({
		forme,
		champ,
		combien: '—',
		pourquoi: 'un motif d’épreuve, assez long pour satisfaire les exigences de forme.',
		ceQuiLaFermerait: 'rien'
	});

	/** Une note du jeu dont l'ordre des étiquettes n'est PAS l'ordre alphabétique. */
	const desordonnee = CORPUS.find((n) => {
		const trie = [...n.etiquettes].sort((a, b) => a.localeCompare(b, 'fr'));
		return trie.join(' ') !== n.etiquettes.join(' ');
	});

	it('le jeu porte bien un cas qui sollicite la règle (P-5)', () => {
		/* SANS CE CAS, LES DEUX ÉPREUVES SUIVANTES SERAIENT VRAIES POUR RIEN :
		   elles compareraient un tableau trié à lui-même. */
		expect(desordonnee).toBeDefined();
	});

	it('lacune d’ORDRE ouverte → la référence est triée, l’ordre cesse d’être mesuré', () => {
		const reference = normalisationDesNotes(
			[lacuneDe('Note', 'etiquettes (leur ORDRE)')],
			new Map()
		);
		const note = reference.find((n) => n.id === desordonnee?.id);
		expect(note?.etiquettes).toEqual(
			[...(desordonnee?.etiquettes ?? [])].sort((a, b) => a.localeCompare(b, 'fr'))
		);
	});

	it('lacune d’ORDRE refermée → la référence porte l’ORDRE DU JEU, et il est exigé', () => {
		/* LE CŒUR DU GESTE ATOMIQUE. Tant que la référence triait, rendre l'ordre
		   juste faisait rougir la batterie POUR AVOIR EU RAISON. */
		const reference = normalisationDesNotes([], new Map());
		const note = reference.find((n) => n.id === desordonnee?.id);
		expect(note?.etiquettes).toEqual(desordonnee?.etiquettes);
		expect(note?.etiquettes).not.toEqual(
			[...(desordonnee?.etiquettes ?? [])].sort((a, b) => a.localeCompare(b, 'fr'))
		);
	});

	it('lacune `pj` ouverte → la référence prend le décompte RÉEL, jamais celui du jeu', () => {
		/* ET SURTOUT PAS ZÉRO EN DUR. La référence suit ce que la table porte : le
		   jour où une pièce est semée, la couche doit la compter. */
		const declarante = CORPUS.find((n) => n.pj > 0);
		const reelles = new Map([[declarante?.id ?? '', 1]]);
		const reference = normalisationDesNotes([lacuneDe('Note', 'pj')], reelles);
		expect(reference.find((n) => n.id === declarante?.id)?.pj).toBe(1);
	});

	it('lacune `pj` refermée → la référence exige le décompte DU JEU', () => {
		const declarante = CORPUS.find((n) => n.pj > 0);
		const reference = normalisationDesNotes([], new Map());
		expect(reference.find((n) => n.id === declarante?.id)?.pj).toBe(declarante?.pj);
	});

	it('les champs de compte écartés sont EXACTEMENT ceux qu’une lacune ouverte nomme', () => {
		expect([...champsDeCompteEnLacune([lacuneDe('Compte', 'id')])]).toEqual(['id']);
		/* Une lacune d'une AUTRE forme n'écarte aucun champ de compte : c'est la
		   polarité inverse, et sans elle la règle ne serait éprouvée qu'à moitié. */
		expect([...champsDeCompteEnLacune([lacuneDe('Note', 'pj')])]).toEqual([]);
		expect([...champsDeCompteEnLacune([])]).toEqual([]);
	});
});
