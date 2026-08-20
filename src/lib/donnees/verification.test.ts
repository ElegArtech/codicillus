/**
 * LES UNITAIRES DE LA VÉRIFICATION — les trois négations de `RG-M06-05`, les
 * deux polarités de `RG-M06-06` et de `RG-M06-07`.
 *
 * Même règle que `edition.test.ts` et `note.test.ts` : ce qui exige le
 * conteneur de base est mesuré par les batteries qui l'ouvrent. Ce qui est
 * contrôlé ici est le PLAN D'ÉCRITURE — la donnée que `verifierLaNote()`
 * exécute et rien d'autre —, et il s'inspecte sans base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CES CAS SONT SYNTHÉTIQUES, ET C'EST UNE EXIGENCE — `P-5`, `P-26`
 *
 * `P-26` : « un contrôle dont le seul cas d'épreuve est le défaut qu'il trouve
 * devient inerte en réussissant ». Le corpus ne porte que TROIS demandes de
 * révision (`src/lib/base/semence.ts`, table `REVISIONS`) et ce lot est
 * précisément celui qui les modifie : un contrôle appuyé sur l'état du dépôt
 * cesserait d'être exercé à la première exécution du geste. Les cas ci-dessous
 * ne lisent ni la base, ni le jeu de semence — ils restent vrais quel que soit
 * l'état des deux.
 *
 * `P-5` : « une règle éprouvée sur un seul mécanisme n'est éprouvée qu'à
 * moitié ». Les deux polarités sont donc jouées à chaque fois : ce que le geste
 * écrit, ET ce qu'il n'écrit pas ; ce que la vérification efface, ET ce que la
 * levée n'atteste pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CES CAS NE PROUVENT PAS
 *
 * Ils prouvent que le PLAN ne porte pas de version, pas de contenu et pas de
 * désynchronisation. Ils ne prouvent pas que la base a reçu ce plan : cela se
 * mesure EN BASE, et le rapport du lot en porte le relevé. Un vert ici avec un
 * `INSERT` clandestin dans `verifierLaNote()` resterait vert — la parade est que
 * la fonction n'importe pas `versions` et n'exécute que les deux membres du
 * plan, ce que `pnpm check` et une relecture voient, pas ce fichier.
 */
import { describe, expect, it } from 'vitest';
import {
	colonnesDUneDemandeDeRevision,
	commentaireDeRevision,
	LEVEE_DE_LA_DEMANDE,
	planDUneVerification
} from './verification';

/* ═══════════════════════════════════ Le décor synthétique ═══════════════ */

const NOTE = 'a0000000-0000-4000-8000-00000000000e';
const KARIM = 'c0000000-0000-4000-8000-000000000001';
const SOPHIE = 'c0000000-0000-4000-8000-000000000002';
const INSTANT = new Date('2026-08-20T09:14:00.000Z');
const PLUS_TARD = new Date('2026-08-21T11:02:00.000Z');

/** Les clés triées d'un objet — la forme comparable d'un jeu de colonnes. */
function colonnesDe(objet: object): readonly string[] {
	return Object.keys(objet).sort();
}

/**
 * Les colonnes de `notes` qu'une écriture de contenu toucherait. Aucune ne doit
 * apparaître dans le plan d'une vérification. La liste vient du schéma —
 * `002_socle.montee.sql:332-352` — et non d'une intuition.
 */
const COLONNES_DE_CONTENU = ['corpsReference', 'corpsOperationnel', 'titre'];
const COLONNES_DE_DATE_DE_MODIFICATION = [
	'modifieLe',
	'corpsReferenceModifieLe',
	'corpsOperationnelModifieLe'
];

/* ═══════════════════════════════════ RG-M06-05 ══════════════════════════ */

describe('RG-M06-05 — vérifier est une action DISTINCTE de la modification', () => {
	it('le plan ne porte que deux écritures : la note, et son journal — donc AUCUNE VERSION', () => {
		const plan = planDUneVerification(NOTE, KARIM, INSTANT);
		/* `RG-M07-01` capture une version « à chaque enregistrement qui modifie le
		   corps ». Il n'y a ici aucun membre où une version pourrait se poser : le
		   plan est clos à deux, et la fonction n'exécute que ce qu'il porte. */
		expect(colonnesDe(plan)).toEqual(['colonnes', 'journal']);
		expect(colonnesDe(plan)).not.toContain('version');
		expect(colonnesDe(plan)).not.toContain('versions');
	});

	it('ne MODIFIE PAS le contenu : aucune colonne de corps ni de titre', () => {
		const { colonnes } = planDUneVerification(NOTE, KARIM, INSTANT);
		for (const interdite of COLONNES_DE_CONTENU) {
			expect(colonnesDe(colonnes)).not.toContain(interdite);
		}
	});

	it('ne DÉCLENCHE PAS la désynchronisation : aucune date de modification de corps', () => {
		/* `RG-M06-08` — le signal naît de `corps_reference_modifie_le` comparé à
		   `corps_operationnel_modifie_le`. `RG-M06-09` le dit nommément :
		   « vérifier la note ne déclenche PAS ce signal ». Ne pas écrire ces deux
		   colonnes est la seule manière de le garantir. Et `modifieLe` est de la
		   liste pour une raison de vocabulaire : vérifier n'est pas modifier
		   (`CLAUDE.md` §3), et `RG-M06-01` retombe sur la date de modification à
		   défaut de vérification — la bouger ouvrirait un SECOND chemin au vert. */
		const { colonnes } = planDUneVerification(NOTE, KARIM, INSTANT);
		for (const interdite of COLONNES_DE_DATE_DE_MODIFICATION) {
			expect(colonnesDe(colonnes)).not.toContain(interdite);
		}
	});

	it('écrit EXACTEMENT cinq colonnes, et l’ensemble est clos', () => {
		/* La polarité inverse des trois cas ci-dessus : sans elle, un plan VIDE
		   les passerait tous les trois (`P-5`). */
		const { colonnes } = planDUneVerification(NOTE, KARIM, INSTANT);
		expect(colonnesDe(colonnes)).toEqual([
			'revisionCommentaire',
			'revisionDemandee',
			'revisionLe',
			'revisionParId',
			'verifieLe'
		]);
		expect(colonnes.verifieLe).toBe(INSTANT);
	});

	it('la date de la note et celle du journal sont UN SEUL instant', () => {
		/* `002_socle.montee.sql:449-451` — « `notes.verifie_le` est la dernière
		   ligne de cette table, dénormalisée ». Deux lectures d'horloge feraient
		   diverger la dénormalisation de sa source, d'une milliseconde d'abord. */
		const plan = planDUneVerification(NOTE, KARIM, INSTANT);
		expect(plan.colonnes.verifieLe).toBe(plan.journal.le);
		expect(plan.journal).toEqual({ noteId: NOTE, compteId: KARIM, le: INSTANT });
	});
});

/* ═══════════════════════════════════ RG-M06-07 ══════════════════════════ */

describe('RG-M06-07 — vérifier EFFACE la demande de révision et son commentaire', () => {
	it('les quatre colonnes de la demande sont remises à leur état neutre', () => {
		const { colonnes } = planDUneVerification(NOTE, KARIM, INSTANT);
		expect(colonnes.revisionDemandee).toBe(false);
		expect(colonnes.revisionCommentaire).toBeNull();
		expect(colonnes.revisionParId).toBeNull();
		expect(colonnes.revisionLe).toBeNull();
	});

	it('l’effacement est LE MÊME que celui de la levée — pas une seconde écriture', () => {
		/* La composition est la garantie : si un jour la levée effaçait une colonne
		   de plus, la vérification l'effacerait aussi, sans qu'on ait à y penser.
		   Ce cas échouerait si l'une des deux se mettait à recopier l'autre. */
		const { colonnes } = planDUneVerification(NOTE, KARIM, INSTANT);
		for (const clef of colonnesDe(LEVEE_DE_LA_DEMANDE)) {
			expect(colonnes[clef as keyof typeof LEVEE_DE_LA_DEMANDE]).toBe(
				LEVEE_DE_LA_DEMANDE[clef as keyof typeof LEVEE_DE_LA_DEMANDE]
			);
		}
	});

	it('POLARITÉ INVERSE — la levée seule n’ATTESTE rien : pas de date de vérification', () => {
		/* Lever, c'est dire « cette demande n'a plus lieu d'être » ; vérifier,
		   c'est attester le contenu. Une levée qui poserait `verifieLe` remettrait
		   au vert une note dont personne n'a rien attesté. */
		expect(colonnesDe(LEVEE_DE_LA_DEMANDE)).toEqual([
			'revisionCommentaire',
			'revisionDemandee',
			'revisionLe',
			'revisionParId'
		]);
		expect(colonnesDe(LEVEE_DE_LA_DEMANDE)).not.toContain('verifieLe');
	});

	it('POLARITÉ INVERSE — signaler n’EFFACE PAS la vérification acquise', () => {
		const colonnes = colonnesDUneDemandeDeRevision('la syntaxe a changé', KARIM, INSTANT);
		expect(colonnesDe(colonnes)).not.toContain('verifieLe');
	});

	it('l’état neutre est gelé : personne ne peut le muter d’ailleurs', () => {
		expect(Object.isFrozen(LEVEE_DE_LA_DEMANDE)).toBe(true);
	});
});

/* ═══════════════════════════════════ RG-M06-06 ══════════════════════════ */

describe('RG-M06-06 — une SEULE demande courante, la nouvelle REMPLACE la précédente', () => {
	it('une demande écrit les QUATRE colonnes, donc n’en laisse aucune de la précédente', () => {
		/* Le remplacement est tenu par le schéma : la demande vit dans quatre
		   colonnes de la note (`002_socle.montee.sql:358-361`), pas dans une table.
		   Mais un `UPDATE` PARTIEL laisserait le demandeur ou la date de la demande
		   précédente en place, sous le commentaire de la nouvelle — un bandeau
		   attribué au mauvais collègue. L'ensemble clos est ce qui l'interdit. */
		const colonnes = colonnesDUneDemandeDeRevision('le paragraphe 3.2 est faux', SOPHIE, INSTANT);
		expect(colonnesDe(colonnes)).toEqual([
			'revisionCommentaire',
			'revisionDemandee',
			'revisionLe',
			'revisionParId'
		]);
	});

	it('la seconde demande ne partage AUCUNE valeur avec la première', () => {
		const premiere = colonnesDUneDemandeDeRevision('la syntaxe a changé', SOPHIE, INSTANT);
		const seconde = colonnesDUneDemandeDeRevision('le lien est mort', KARIM, PLUS_TARD);
		expect(seconde.revisionCommentaire).not.toBe(premiere.revisionCommentaire);
		expect(seconde.revisionParId).not.toBe(premiere.revisionParId);
		expect(seconde.revisionLe).not.toBe(premiere.revisionLe);
		expect(seconde.revisionDemandee).toBe(true);
	});

	it('la configuration écrite est l’une des DEUX que la contrainte admet', () => {
		/* `notes_revision_coherente` (`002_socle.montee.sql:382-388`) : tout nul,
		   ou drapeau levé AVEC demandeur ET date. Une demande sans demandeur serait
		   refusée par la base — le type l'interdit avant. */
		const colonnes = colonnesDUneDemandeDeRevision('à revoir', SOPHIE, INSTANT);
		expect(colonnes.revisionDemandee).toBe(true);
		expect(colonnes.revisionParId).toBe(SOPHIE);
		expect(colonnes.revisionLe).toBe(INSTANT);
	});
});

/* ═══════════════════════════════════ UC-M06-03 ══════════════════════════ */

describe('UC-M06-03 — signaler EN EXPLIQUANT POURQUOI : le commentaire est exigé', () => {
	it('accepte une explication, ébarbée de ses blancs de bord', () => {
		expect(commentaireDeRevision('  la commande a changé avec Barman 3.11  ')).toBe(
			'la commande a changé avec Barman 3.11'
		);
	});

	it('refuse l’absence, la chaîne vide, et les blancs seuls', () => {
		expect(commentaireDeRevision(undefined)).toBeNull();
		expect(commentaireDeRevision(null)).toBeNull();
		expect(commentaireDeRevision('')).toBeNull();
		expect(commentaireDeRevision('   \n\t  ')).toBeNull();
	});

	it('refuse ce qui n’est pas un texte — un client compose ce qu’il veut', () => {
		expect(commentaireDeRevision(42)).toBeNull();
		expect(commentaireDeRevision({ commentaire: 'contourné' })).toBeNull();
		expect(commentaireDeRevision(['contourné'])).toBeNull();
		expect(commentaireDeRevision(true)).toBeNull();
	});

	it('n’impose AUCUNE longueur maximale — aucune source n’en fixe une', () => {
		/* Ni `UC-M06-03`, ni `RG-M06-06`, ni le `textarea` du gel
		   (`V-14:1484`, sans attribut de longueur) n'en donnent. En poser une
		   serait combler ; l'écart est déclaré au rapport du lot. Ce cas est là pour
		   que le jour où une source la fixe, il rougisse. */
		const long = 'a'.repeat(20_000);
		expect(commentaireDeRevision(long)).toBe(long);
	});
});
