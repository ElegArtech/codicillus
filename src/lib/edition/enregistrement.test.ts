/**
 * LES UNITAIRES DE L'ENREGISTREMENT — `RG-M07-01` et `RG-M07-02`, sans base.
 *
 * Ce qui exige le conteneur est mesuré par les batteries qui l'ouvrent ; ce
 * fichier ne contrôle que ce qui est PUR — la décision d'écrire une version, sa
 * composition, ses quantités. C'est la même règle que `note.test.ts` et
 * `lecture.test.ts`, et elle vaut doublement ici : la base est PARTAGÉE par les
 * copies de travail, et une épreuve qui y écrirait des versions changerait
 * l'état mesuré par les lots voisins.
 *
 * DEUX CAS SONT SYNTHÉTIQUES PAR NÉCESSITÉ (`P-5`, `P-26`) : la table
 * `versions` porte ZÉRO ligne pour 32 notes, et les corps de la base sont tous
 * d'un seul paragraphe. Aucun état du dépôt n'exerce donc une version, ni un
 * corps rédigé modifié. Les documents de ces cas sont écrits ici, à la main.
 */
import { describe, expect, it } from 'vitest';
import { analyserDocument, type Document } from '../contenu/document';
import { documentDuGel } from '../contenu/documents-du-gel';
import {
	contenuModifie,
	empreinteDuCorps,
	quantitesTouchees,
	RESUME_NON_SAISI,
	versionDUnEnregistrement,
	type CorpsDeLaNote,
	type EtatEnBase
} from './enregistrement';

/* ═══════════════════════════════════ Les documents d'épreuve ═══════════ */

const corps = (...textes: readonly string[]): Document =>
	analyserDocument({
		type: 'doc',
		content: textes.map((t) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] }))
	});

const REFERENCE = corps('Première ligne.', 'Deuxième ligne.');
const REFERENCE_ALLONGEE = corps('Première ligne.', 'Deuxième ligne.', 'Troisième ligne.');
const OPERATIONNEL = corps('Étape 1.');

const AVANT: EtatEnBase = {
	titre: 'Restaurer une base PostgreSQL',
	reference: REFERENCE,
	operationnel: OPERATIONNEL
};

const MAINTENANT = new Date('2026-08-20T14:30:00.000Z');
const AUTEUR = '00000000-0000-4000-8000-000000000001';

/* ═══════════════════════════════════ L'empreinte ════════════════════════ */

describe('l’empreinte d’un corps ignore l’ordre des clés — le piège de `jsonb`', () => {
	it('deux écritures du même document rendent la même empreinte', () => {
		/* PostgreSQL trie les clés d'une valeur `jsonb`. Sans normalisation, chaque
		   enregistrement écrirait une version, ce que RG-M07-01 interdit. Ce cas
		   est la sonde de ce piège, et il est synthétique : il reproduit l'ordre
		   que la base rend, sans la base. */
		const ordreDeclaration = {
			type: 'doc',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }]
		};
		const ordreTrie = {
			content: [{ content: [{ text: 'a', type: 'text' }], type: 'paragraph' }],
			type: 'doc'
		};
		expect(JSON.stringify(ordreDeclaration)).not.toBe(JSON.stringify(ordreTrie));
		expect(empreinteDuCorps(ordreDeclaration)).toBe(empreinteDuCorps(ordreTrie));
	});

	it('l’absence de corps a son empreinte propre — un Opérationnel retiré est un changement', () => {
		expect(empreinteDuCorps(null)).toBe('absent');
		expect(empreinteDuCorps(undefined)).toBe('absent');
		expect(empreinteDuCorps(OPERATIONNEL)).not.toBe('absent');
	});
});

/* ═══════════════════════════════════ RG-M07-01 ══════════════════════════ */

describe('RG-M07-01 — une version par enregistrement qui MODIFIE un corps', () => {
	it('aucun changement de contenu : aucune version', () => {
		const inchange: CorpsDeLaNote = { reference: REFERENCE, operationnel: OPERATIONNEL };
		expect(contenuModifie(AVANT, inchange)).toBe(false);
		expect(
			versionDUnEnregistrement({
				dernierNumero: 14,
				auteurId: AUTEUR,
				maintenant: MAINTENANT,
				titre: AVANT.titre,
				corps: inchange,
				avant: AVANT
			})
		).toBeNull();
	});

	it('la Référence change : une version', () => {
		const apres: CorpsDeLaNote = { reference: REFERENCE_ALLONGEE, operationnel: OPERATIONNEL };
		expect(contenuModifie(AVANT, apres)).toBe(true);
	});

	it('SEUL l’Opérationnel change : une version quand même', () => {
		/* La règle nomme les deux corps. Un historique qui n'enregistrerait que la
		   Référence perdrait la moitié de ce que RG-M07-02 fait capturer. */
		const apres: CorpsDeLaNote = { reference: REFERENCE, operationnel: corps('Étape 1 bis.') };
		expect(contenuModifie(AVANT, apres)).toBe(true);
	});

	it('l’Opérationnel est retiré : une version', () => {
		const apres: CorpsDeLaNote = { reference: REFERENCE, operationnel: null };
		expect(contenuModifie(AVANT, apres)).toBe(true);
	});

	it('le seul TITRE change : aucune version — la règle ne nomme que les corps', () => {
		const inchange: CorpsDeLaNote = { reference: REFERENCE, operationnel: OPERATIONNEL };
		expect(contenuModifie({ ...AVANT, titre: 'Un autre titre' }, inchange)).toBe(false);
	});
});

/* ═══════════════════════════════════ RG-M07-02 ══════════════════════════ */

describe('RG-M07-02 — une version capture le titre et LES DEUX corps', () => {
	const version = versionDUnEnregistrement({
		dernierNumero: 14,
		auteurId: AUTEUR,
		maintenant: MAINTENANT,
		titre: 'Restaurer une base PostgreSQL',
		corps: { reference: REFERENCE_ALLONGEE, operationnel: OPERATIONNEL },
		avant: AVANT
	});

	it('elle existe, et elle porte le titre', () => {
		expect(version).not.toBeNull();
		expect(version?.titre).toBe('Restaurer une base PostgreSQL');
	});

	it('elle porte les DEUX corps, et ceux d’APRÈS l’enregistrement', () => {
		/* Le gel tranche : la version de plus haut numéro EST l'état courant
		   (V-15:2796, :2826, :2934). Une capture d'avant produirait un historique
		   dont la dernière entrée ne serait jamais la note affichée. */
		expect(version?.corpsReference).toEqual(REFERENCE_ALLONGEE);
		expect(version?.corpsOperationnel).toEqual(OPERATIONNEL);
	});

	it('elle porte l’auteur et la date de la modification', () => {
		expect(version?.auteurId).toBe(AUTEUR);
		expect(version?.le).toBe(MAINTENANT);
	});

	it('son numéro suit le plus grand écrit, jamais le nombre de lignes', () => {
		/* La purge de RG-M07-03 retire les plus anciennes : compter les lignes
		   ferait réémettre un numéro déjà employé, que la contrainte d'unicité par
		   note refuserait. */
		expect(version?.numero).toBe(15);
		expect(
			versionDUnEnregistrement({
				dernierNumero: 0,
				auteurId: AUTEUR,
				maintenant: MAINTENANT,
				titre: 'x',
				corps: { reference: REFERENCE_ALLONGEE, operationnel: null },
				avant: { titre: 'x', reference: REFERENCE, operationnel: null }
			})?.numero
		).toBe(1);
	});

	it('son résumé est VIDE, et la constante dit que c’est une lacune connue', () => {
		/* Ni V-17 ni V-18 n’ont de champ de résumé : une phrase fabriquée serait la
		   valeur illustrative que P-02 proscrit. */
		expect(version?.resume).toBe(RESUME_NON_SAISI);
		expect(RESUME_NON_SAISI).toBe('');
	});

	it('un Opérationnel absent reste absent — RG-NOT-02, jamais un corps de repli', () => {
		const sansOperationnel = versionDUnEnregistrement({
			dernierNumero: 3,
			auteurId: AUTEUR,
			maintenant: MAINTENANT,
			titre: 'x',
			corps: { reference: REFERENCE_ALLONGEE, operationnel: null },
			avant: { titre: 'x', reference: REFERENCE, operationnel: null }
		});
		expect(sansOperationnel?.corpsOperationnel).toBeNull();
	});
});

/* ═══════════════════════════════════ Les quantités ══════════════════════ */

describe('les quantités touchées comptent les DEUX registres, et ne sont pas un solde', () => {
	it('une ligne ajoutée à la Référence se compte en ajout, et rien en retrait', () => {
		const q = quantitesTouchees(AVANT, {
			reference: REFERENCE_ALLONGEE,
			operationnel: OPERATIONNEL
		});
		expect(q.ajout).toBeGreaterThan(0);
		expect(q.retrait).toBe(0);
	});

	it('une modification du seul Opérationnel ne rend pas « zéro ligne touchée »', () => {
		const q = quantitesTouchees(AVANT, {
			reference: REFERENCE,
			operationnel: corps('Étape 1 revue de fond en comble.')
		});
		expect(q.ajout + q.retrait).toBeGreaterThan(0);
	});

	it('sur un corps réel du gel, les quantités sont non nulles et positives', () => {
		/* Un corps rédigé complet, avec titres, alertes, tableaux et listes : le
		   comptage passe par le rendu Markdown de l'implémentation unique, et ce cas
		   est le seul qui l'exerce sur autre chose que des paragraphes. */
		const gel = documentDuGel('n-restaurer-pg', 'operationnel');
		const q = quantitesTouchees(
			{ titre: 'x', reference: REFERENCE, operationnel: null },
			{ reference: REFERENCE, operationnel: gel }
		);
		expect(q.ajout).toBeGreaterThan(0);
		expect(q.retrait).toBe(0);
	});
});
