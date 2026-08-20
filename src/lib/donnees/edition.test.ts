/**
 * LES UNITAIRES DE L'ÉDITION — ce qui se contrôle SANS base.
 *
 * Même règle que `note.test.ts` : ce qui exige le conteneur est mesuré par les
 * batteries qui l'ouvrent. Ici, la seule DÉCISION extractible est celle de la
 * pièce jointe, et elle est éprouvée sur une pièce SYNTHÉTIQUE — parce qu'elle
 * ne peut pas l'être autrement.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE CAS DOIT ÊTRE SYNTHÉTIQUE — `P-5` ET `P-26`
 *
 * `pieces_jointes` compte ZÉRO ligne (mesuré le 20/08/2026), et
 * `pnpm verif:donnees` le chiffre autrement : « 7 notes sur 32 en déclarent,
 * 13 pièces déclarées, 2 nommées au gel dont 0 chiffrables en octets, 0 portées
 * en base ». La branche « pièce résolue » de `resoudreUnePieceJointe()` n'est
 * donc exercée par AUCUN état du dépôt : sans les lignes fabriquées ci-dessous,
 * le contrôle de visibilité de `RG-M04-08` serait une règle qu'on espère.
 *
 * ET LES DEUX POLARITÉS SONT JOUÉES. `P-5` le demande explicitement : « une
 * règle éprouvée sur un seul mécanisme n'est éprouvée qu'à moitié ». La même
 * pièce est donc demandée sur une note lisible ET sur une note qui ne l'est pas,
 * et le refus est comparé PAR IDENTITÉ à celui de la pièce inexistante.
 */
import { describe, expect, it } from 'vitest';
import { ANONYME, identiteAuthentifiee, INTROUVABLE } from '../droits/resolution';
import { pieceJointeResolue, type LigneDePieceJointe } from './edition';

/* ═══════════════════════════════════ Le décor synthétique ═══════════════ */

const DOSSIER_LISIBLE = 'd0000000-0000-4000-8000-000000000001';
const DOSSIER_INTERDIT = 'd0000000-0000-4000-8000-000000000002';

const PERIMETRE = { tout: false as const, dossiers: new Set([DOSSIER_LISIBLE]) };
const PERIMETRE_TOTAL = { tout: true as const };

/** Une pièce jointe, jointe à sa note porteuse. Rien de tout cela n'est en base. */
function piece(surcharge: Partial<LigneDePieceJointe> = {}): LigneDePieceJointe {
	return {
		nom: 'procedure-de-restauration.pdf',
		tailleOctets: 184_320,
		typeMedia: 'application/pdf',
		identifiant: 'n-restaurer-pg',
		dossierId: DOSSIER_LISIBLE,
		visibilite: 'interne',
		statut: 'publiee',
		...surcharge
	};
}

const REDACTEUR = identiteAuthentifiee('c0000000-0000-4000-8000-000000000001', 'contributeur');
const ADMINISTRATEUR = identiteAuthentifiee(
	'c0000000-0000-4000-8000-000000000002',
	'administrateur'
);

/* ═══════════════════════════════════ RG-M04-08 ══════════════════════════ */

describe('RG-M04-08 — la visibilité de la NOTE PORTEUSE décide, pas le fichier', () => {
	it('la pièce d’une note lisible est résolue, et rend ce que la base porte', () => {
		const resolue = pieceJointeResolue(REDACTEUR, piece(), PERIMETRE);
		expect(resolue.trouve).toBe(true);
		if (!resolue.trouve) return;
		expect(resolue.ressource).toEqual({
			nom: 'procedure-de-restauration.pdf',
			tailleOctets: 184_320,
			typeMedia: 'application/pdf',
			note: 'n-restaurer-pg'
		});
	});

	it('LA MÊME PIÈCE, sur une note hors périmètre, n’est pas résolue', () => {
		/* La polarité inverse. Sans ce cas, le premier ne prouverait que la
		   résolution, pas le contrôle. */
		const refusee = pieceJointeResolue(
			REDACTEUR,
			piece({ dossierId: DOSSIER_INTERDIT }),
			PERIMETRE
		);
		expect(refusee.trouve).toBe(false);
	});

	it('une pièce d’une note INTERNE n’est jamais servie en anonyme — la règle, à la lettre', () => {
		expect(pieceJointeResolue(ANONYME, piece(), PERIMETRE_TOTAL).trouve).toBe(false);
	});

	it('et une pièce d’une note publique ET publiée l’est', () => {
		/* « Publique ET publiée », les deux : c'est le « et » du cahier des charges
		   §2.2, porté par `noteVisibleEnAnonyme()`. */
		const publique = piece({ visibilite: 'publique', statut: 'publiee' });
		expect(pieceJointeResolue(ANONYME, publique, PERIMETRE_TOTAL).trouve).toBe(true);
	});

	it('une note publique mais BROUILLON ne sert pas sa pièce en anonyme', () => {
		const brouillon = piece({ visibilite: 'publique', statut: 'brouillon' });
		expect(pieceJointeResolue(ANONYME, brouillon, PERIMETRE_TOTAL).trouve).toBe(false);
	});

	it('l’administrateur contourne les droits de dossier — RG-DRO-03, son périmètre est total', () => {
		expect(pieceJointeResolue(ADMINISTRATEUR, piece(), PERIMETRE_TOTAL).trouve).toBe(true);
	});
});

/* ═══════════════════════════════════ RG-ACC-04 ══════════════════════════ */

describe('RG-ACC-04 — refus et inexistence rendent le MÊME OBJET, pas deux égaux', () => {
	it('la pièce inexistante et la pièce interdite sont identiques par référence', () => {
		const inexistante = pieceJointeResolue(REDACTEUR, undefined, PERIMETRE);
		const interdite = pieceJointeResolue(
			REDACTEUR,
			piece({ dossierId: DOSSIER_INTERDIT }),
			PERIMETRE
		);
		expect(inexistante).toBe(INTROUVABLE);
		expect(interdite).toBe(INTROUVABLE);
		expect(inexistante).toBe(interdite);
	});

	it('l’anonyme reçoit le même objet que le rédacteur sans droit', () => {
		expect(pieceJointeResolue(ANONYME, piece(), PERIMETRE_TOTAL)).toBe(
			pieceJointeResolue(REDACTEUR, piece({ dossierId: DOSSIER_INTERDIT }), PERIMETRE)
		);
	});
});
