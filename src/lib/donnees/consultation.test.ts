/**
 * LES UNITAIRES DE `RG-M04-09` — l'incrément, l'entrée, et l'anonymisation.
 *
 * Même règle que `verification.test.ts` : ce qui exige le conteneur de base est
 * mesuré par les batteries qui l'ouvrent. Ce qui est contrôlé ici est
 * l'INSTRUCTION — le texte envoyé au serveur et les valeurs qu'il porte —, et
 * elle s'inspecte sans base, par le dialecte du connecteur.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CES CAS SONT SYNTHÉTIQUES, ET C'EST UNE EXIGENCE — `P-26`
 *
 * « Un contrôle dont le seul cas d'épreuve est le défaut qu'il trouve devient
 * inerte en réussissant. » Un contrôle appuyé sur l'état du dépôt cesserait
 * d'être exercé dès la première ouverture de note : le compteur du corpus bouge
 * précisément parce que ce lot le fait bouger. Aucun cas ci-dessous ne lit la
 * base ni le jeu de semence.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX POLARITÉS SONT JOUÉES — `P-5`
 *
 * « Une règle éprouvée sur un seul mécanisme n'est éprouvée qu'à moitié. »
 * L'anonymisation est donc éprouvée dans les deux sens : ce que l'entrée porte
 * quand le lecteur est authentifié, ET ce qu'elle ne porte pas quand il ne
 * l'est pas. Sans le premier, un module qui écrirait `null` pour tout le monde
 * passerait pour conforme.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CES CAS NE PROUVENT PAS
 *
 * Ils prouvent que l'instruction incrémente, insère, et porte les trois valeurs
 * attendues. Ils ne prouvent pas que la base l'exécute : cela se mesure EN
 * BASE, et le rapport du lot en porte le relevé. Ils ne disent rien non plus de
 * la DURÉE APPROXIMATIVE que `RG-M04-09` énumère : elle n'a pas de colonne,
 * c'est un vide déclaré au rapport de `T-078`, et un cas qui l'attendrait ici
 * l'aurait inventée.
 */
import { describe, expect, it } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import {
	compteDe,
	compteDeLEspacePublic,
	instructionDeConsultation,
	type OuvertureDeNote
} from './consultation';
import { ANONYME, identiteAuthentifiee } from '../droits/resolution';

/* ═══════════════════════════════════ Le décor synthétique ═══════════════ */

const KARIM = 'c0000000-0000-4000-8000-000000000001';
const INSTANT = new Date('2026-08-21T09:14:00.000Z');
const IDENTIFIANT = 'n-une-note-quelconque';

const dialecte = new PgDialect();

/** Le texte et les valeurs que le connecteur enverrait, sans base ouverte. */
function requeteDe(ouverture: OuvertureDeNote): { texte: string; valeurs: unknown[] } {
	const requete = dialecte.sqlToQuery(instructionDeConsultation(ouverture));
	return { texte: requete.sql.replace(/\s+/g, ' ').trim(), valeurs: [...requete.params] };
}

const ouverture = (compte: string | null): OuvertureDeNote => ({
	identifiant: IDENTIFIANT,
	compte,
	maintenant: INSTANT
});

/* ═══════════════════════════════════ Le compte inscrit ══════════════════ */

describe('RG-M04-09 — le compte inscrit dans l’entrée, dans les deux polarités', () => {
	it('une identité authentifiée porte son compte', () => {
		expect(compteDe(identiteAuthentifiee(KARIM, 'contributeur'))).toBe(KARIM);
	});

	it('l’anonyme n’en porte aucun — l’absence EST l’anonymisation (RG-M15-02)', () => {
		expect(compteDe(ANONYME)).toBeNull();
	});

	it('l’espace public anonymise sans rien lire — ARB-007 A-05', () => {
		expect(compteDeLEspacePublic()).toBeNull();
		/* La signature ne prend aucune identité : une branche par persona ne peut
		   pas s’y glisser. Ce cas mesure la forme, et c’est la forme qui tient. */
		expect(compteDeLEspacePublic.length).toBe(0);
	});
});

/* ═══════════════════════════════════ L'instruction ══════════════════════ */

describe('RG-M04-09 — une seule instruction pour les deux effets', () => {
	it('incrémente le compteur de la note, de façon RELATIVE', () => {
		const { texte } = requeteDe(ouverture(KARIM));
		expect(texte).toContain('update notes');
		expect(texte).toContain('compteur_de_consultations = compteur_de_consultations + 1');
		/* La polarité inverse : aucune valeur calculée puis réécrite. Deux
		   lectures concurrentes de la même note en perdraient une. */
		expect(texte).not.toMatch(/set compteur_de_consultations = \$/);
	});

	it('écrit l’entrée de journal dans la MÊME instruction', () => {
		const { texte } = requeteDe(ouverture(KARIM));
		expect(texte).toContain('insert into consultations');
		/* Une écriture de données en expression commune : l’insertion consomme
		   ce que la mise à jour rend. Deux instructions séparées coûteraient deux
		   allers et retours, et pourraient diverger. */
		expect(texte.indexOf('update notes')).toBeLessThan(texte.indexOf('insert into consultations'));
		expect(texte.split(';').length).toBe(1);
	});

	it('la note est désignée par son identifiant d’adresse, l’instant est celui donné', () => {
		const { valeurs } = requeteDe(ouverture(KARIM));
		expect(valeurs[0]).toBe(IDENTIFIANT);
		expect(valeurs[2]).toBe(INSTANT);
	});

	it('authentifié : le compte est dans les valeurs envoyées', () => {
		expect(requeteDe(ouverture(KARIM)).valeurs[1]).toBe(KARIM);
	});

	it('anonymisé : l’entrée est ÉCRITE, et sa valeur de compte est vide', () => {
		const { texte, valeurs } = requeteDe(ouverture(null));
		/* Anonymiser n’est pas omettre : l’insertion est la même. */
		expect(texte).toContain('insert into consultations');
		expect(valeurs[1]).toBeNull();
	});

	it('aucune colonne de durée — le vide est déclaré, jamais comblé', () => {
		const { texte } = requeteDe(ouverture(KARIM));
		expect(texte).not.toMatch(/dur[ée]e/i);
	});
});
