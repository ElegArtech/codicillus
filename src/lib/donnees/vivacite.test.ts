/**
 * LES UNITAIRES DU CYCLE PAR REGISTRE — le pont entre une ligne de `notes` et la
 * fabrique à cinq états.
 *
 * Même règle que `verification.test.ts` : ce qui exige le conteneur de base est
 * mesuré ailleurs. Ce qui est contrôlé ici est PUR — une ligne synthétique
 * entre, un cycle sort, et les bascules se dérivent de ce cycle. Aucun cas ne
 * lit la base ni le jeu de semence : ils restent vrais quel que soit l'état des
 * deux, et le jour du calendrier ne les fait pas changer d'avis, `aujourdhui`
 * étant un paramètre.
 *
 * CE QU'ILS ÉPINGLENT, ET C'EST LE POINT DU LOT : les deux registres d'une même
 * note peuvent être dans deux états différents, une demande de révision ne pèse
 * que sur le registre qu'elle vise, et les bascules automatiques tombent aux
 * dates que la spécification donne — sans qu'une seule ligne soit stockée.
 */
import { describe, expect, it } from 'vitest';
import { etatDeVivacite, vivacite, SEUILS_DE_VIVACITE } from '../fraicheur';
import {
	basculesDUnCycle,
	basculesDUneNote,
	cycleDuRegistre,
	type LigneDeCycles
} from './vivacite';

/* ═══════════════════════════════════ Le décor synthétique ═══════════════ */

const AUJOURDHUI = new Date('2026-09-04T10:00:00.000Z');

/** Le même instant, décalé de `jours` jours vers le passé. */
function ilYA(jours: number): Date {
	return new Date(AUJOURDHUI.getTime() - jours * 86_400_000);
}

/**
 * Une ligne de note complète, dont chaque cas ne change que ce qu'il éprouve.
 * L'état de départ : les deux registres vérifiés du jour, aucune demande.
 */
function ligne(remplacements: Partial<LigneDeCycles> = {}): LigneDeCycles {
	return {
		modifieLe: ilYA(200),
		corpsOperationnelModifieLe: ilYA(150),
		verifieLe: ilYA(0),
		verifieLeOperationnel: ilYA(0),
		validiteReference: 90,
		validiteOperationnel: 21,
		revisionDemandee: false,
		revisionRegistre: null,
		revisionPar: null,
		verifieParReference: 'Alexandre Berge',
		verifieParOperationnel: 'Karim Belhadj',
		...remplacements
	};
}

/* ═══════════════════ Deux registres, deux cycles indépendants ═══════════ */

describe('un cycle par registre — les deux ne se touchent jamais', () => {
	it('chaque registre prend SA date, SA validité et SON vérificateur', () => {
		const l = ligne({ verifieLe: ilYA(11), verifieLeOperationnel: ilYA(24) });
		expect(cycleDuRegistre(l, 'reference')).toEqual({
			verifiee: ilYA(11),
			modifiee: l.modifieLe,
			validite: 90,
			par: 'Alexandre Berge',
			revisionPar: null
		});
		expect(cycleDuRegistre(l, 'operationnel')).toEqual({
			verifiee: ilYA(24),
			modifiee: l.corpsOperationnelModifieLe,
			validite: 21,
			par: 'Karim Belhadj',
			revisionPar: null
		});
	});

	it('LES DEUX REGISTRES PEUVENT ÊTRE DANS DEUX ÉTATS DIFFÉRENTS', () => {
		/* Le cas de la capture `06-historique.png` : la Référence vérifiée il y a
		   onze jours tient encore (90 jours de validité), l'Opérationnel vérifié il y
		   a vingt-quatre jours a dépassé la sienne (21 jours). Avec une seule date de
		   vérification, ce cas était INEXPRIMABLE. */
		const l = ligne({ verifieLe: ilYA(11), verifieLeOperationnel: ilYA(24) });
		const reference = cycleDuRegistre(l, 'reference');
		const operationnel = cycleDuRegistre(l, 'operationnel');
		expect(reference).not.toBeNull();
		expect(operationnel).not.toBeNull();
		if (reference === null || operationnel === null) return;

		expect(vivacite(reference, AUJOURDHUI).etat).toBe('ajour');
		expect(vivacite(operationnel, AUJOURDHUI).etat).toBe('averifier');
	});

	it('SANS CORPS OPÉRATIONNEL, il n’y a pas de cycle — et c’est `null`', () => {
		/* L'état vide EXPLICITE : inventer un cycle afficherait un état pour un
		   contenu que personne n'a écrit. L'écran répond par « Créer la version
		   opérationnelle », pas par un badge. */
		const l = ligne({ corpsOperationnelModifieLe: null, verifieLeOperationnel: null });
		expect(cycleDuRegistre(l, 'operationnel')).toBeNull();
		/* La Référence, elle, existe toujours (`RG-NOT-02`). */
		expect(cycleDuRegistre(l, 'reference')).not.toBeNull();
	});

	it('jamais vérifié : le cycle retombe sur la modification DE SON registre', () => {
		/* `RG-M06-01`, registre par registre. L'Opérationnel qui retomberait sur
		   `modifie_le` vieillirait au rythme des renommages de la note. */
		const l = ligne({ verifieLe: null, verifieLeOperationnel: null });
		expect(cycleDuRegistre(l, 'reference')?.verifiee).toBeNull();
		expect(cycleDuRegistre(l, 'reference')?.modifiee).toBe(l.modifieLe);
		expect(cycleDuRegistre(l, 'operationnel')?.modifiee).toBe(l.corpsOperationnelModifieLe);
	});
});

/* ═══════════════════ La demande de révision vise UN registre ════════════ */

describe('une demande de révision ne pèse que sur le registre qu’elle vise', () => {
	const demandee = {
		revisionDemandee: true,
		revisionPar: 'Sophie Nguyen'
	} satisfies Partial<LigneDeCycles>;

	it('sur l’Opérationnel, elle force « À revoir » — et l’Opérationnel SEUL', () => {
		const l = ligne({ ...demandee, revisionRegistre: 'operationnel' });
		const reference = cycleDuRegistre(l, 'reference');
		const operationnel = cycleDuRegistre(l, 'operationnel');
		expect(reference?.revisionPar).toBeNull();
		expect(operationnel?.revisionPar).toBe('Sophie Nguyen');
		if (reference === null || operationnel === null) return;
		expect(vivacite(reference, AUJOURDHUI).etat).toBe('ajour');
		expect(vivacite(operationnel, AUJOURDHUI).etat).toBe('arevoir');
	});

	it('sur la Référence, la symétrie exacte — POLARITÉ INVERSE', () => {
		const l = ligne({ ...demandee, revisionRegistre: 'reference' });
		expect(cycleDuRegistre(l, 'reference')?.revisionPar).toBe('Sophie Nguyen');
		expect(cycleDuRegistre(l, 'operationnel')?.revisionPar).toBeNull();
	});

	it('drapeau baissé, le registre visé ne pèse plus rien', () => {
		/* `notes_revision_coherente` interdit cet état en base ; le producteur ne s'y
		   fie pas — une ligne relue d'une base d'avant `014` porterait le cas. */
		const l = ligne({ revisionDemandee: false, revisionRegistre: 'reference', revisionPar: 'X' });
		expect(cycleDuRegistre(l, 'reference')?.revisionPar).toBeNull();
	});
});

/* ═══════════════════ Les bascules automatiques, DÉRIVÉES ════════════════ */

describe('les bascules automatiques tombent aux bonnes dates, sans rien stocker', () => {
	/** Un cycle vérifié il y a `jours` jours, valide `validite` jours. */
	const cycle = (jours: number, validite = 21) => ({
		verifiee: ilYA(jours),
		modifiee: ilYA(300),
		validite
	});

	it('avant l’échéance, AUCUNE bascule n’a eu lieu', () => {
		expect(basculesDUnCycle(cycle(10), 'operationnel', AUJOURDHUI)).toEqual([]);
	});

	it('À L’ÉCHÉANCE JOUR POUR JOUR, rien n’a encore basculé — reste nul est « Bientôt »', () => {
		/* La borne de la spécification, à la lettre : « reste = 0 → bientot ». Une
		   bascule annoncée ce jour-là aurait contredit le badge de la même page. */
		expect(basculesDUnCycle(cycle(21), 'operationnel', AUJOURDHUI)).toEqual([]);
	});

	it('AU LENDEMAIN, elle est survenue — et elle est datée DU JOUR DE L’ÉCHÉANCE', () => {
		const bascules = basculesDUnCycle(cycle(22), 'operationnel', AUJOURDHUI);
		expect(bascules).toHaveLength(1);
		expect(bascules[0]?.etat).toBe('averifier');
		expect(bascules[0]?.registre).toBe('operationnel');
		expect(bascules[0]?.le).toEqual(ilYA(1));
	});

	it('le libellé est celui de la capture — l’état nommé, la validité citée', () => {
		const bascules = basculesDUnCycle(cycle(24), 'operationnel', AUJOURDHUI);
		expect(bascules[0]?.le).toEqual(ilYA(3));
		expect(bascules[0]?.titre).toBe('Passage automatique à « À vérifier »');
		expect(bascules[0]?.detail).toBe(
			'Échéance de la vérification du 11 août 2026 atteinte (validité : 21 jours).'
		);
	});

	it('à J+14 de l’échéance, la seconde ; à J+90, la troisième', () => {
		const aJ14 = basculesDUnCycle(
			cycle(21 + SEUILS_DE_VIVACITE.retardRevoir),
			'reference',
			AUJOURDHUI
		);
		expect(aJ14.map((b) => b.etat)).toEqual(['averifier', 'arevoir']);

		const aJ90 = basculesDUnCycle(
			cycle(21 + SEUILS_DE_VIVACITE.retardObsolete),
			'reference',
			AUJOURDHUI
		);
		expect(aJ90.map((b) => b.etat)).toEqual(['averifier', 'arevoir', 'obsolete']);
	});

	it('LA VEILLE d’une bascule, elle n’est pas encore là — la borne est stricte', () => {
		const veille = basculesDUnCycle(
			cycle(21 + SEUILS_DE_VIVACITE.retardRevoir - 1),
			'reference',
			AUJOURDHUI
		);
		expect(veille.map((b) => b.etat)).toEqual(['averifier']);
	});

	it('l’état dérivé et l’état calculé DISENT LA MÊME CHOSE', () => {
		/* La polarité qui compte : une bascule survenue sans que la fabrique soit
		   dans cet état-là serait un historique qui contredit le badge. Les deux
		   partagent les mêmes seuils, et ce cas le mesure aux trois paliers — c'est
		   lui qui a imposé le décalage d'un jour de la première bascule. */
		for (const retard of [1, SEUILS_DE_VIVACITE.retardRevoir, SEUILS_DE_VIVACITE.retardObsolete]) {
			const c = cycle(21 + retard);
			const derniere = basculesDUnCycle(c, 'reference', AUJOURDHUI).at(-1);
			expect(derniere?.etat).toBe(etatDeVivacite(-retard, false));
		}
	});

	it('les deux registres versent dans le MÊME fil, du plus récent au plus ancien', () => {
		const l = ligne({ verifieLe: ilYA(200), verifieLeOperationnel: ilYA(30) });
		const fil = basculesDUneNote(l, AUJOURDHUI);
		/* Référence : 200 − 90 = 110 jours de retard → les trois. Opérationnel :
		   30 − 21 = 9 jours de retard → « À vérifier » seule. */
		expect(fil.map((b) => `${b.registre}:${b.etat}`)).toEqual([
			'operationnel:averifier',
			'reference:obsolete',
			'reference:arevoir',
			'reference:averifier'
		]);
	});

	it('sans registre Opérationnel, le fil ne porte que la Référence', () => {
		const l = ligne({
			corpsOperationnelModifieLe: null,
			verifieLeOperationnel: null,
			verifieLe: ilYA(200)
		});
		expect(basculesDUneNote(l, AUJOURDHUI).every((b) => b.registre === 'reference')).toBe(true);
	});
});
