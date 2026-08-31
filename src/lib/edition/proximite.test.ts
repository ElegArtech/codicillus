/**
 * LA MESURE DE PROXIMITÉ, ET LE SEUIL QUI EN DÉCOULE.
 *
 * Ce contrôle est le RELEVÉ qui a fixé `SEUIL_DE_PROXIMITE` : trois paires proches, trois
 * paires éloignées, et le cas limite qui a tranché entre les deux. Il échoue si quelqu'un
 * déplace le seuil sans refaire la mesure — c'est tout ce qu'on lui demande.
 */
import { describe, expect, it } from 'vitest';
import { SEUIL_DE_PROXIMITE, notesProches, proximiteDeTitres, trigrammes } from './proximite';

const CIBLE = 'Restaurer une sauvegarde PostgreSQL';

describe('la mesure', () => {
	it('rend 0 sur un titre sans lettre ni chiffre', () => {
		expect(trigrammes('   —  ').size).toBe(0);
		expect(proximiteDeTitres('', CIBLE)).toBe(0);
		expect(proximiteDeTitres(' « » ', CIBLE)).toBe(0);
	});

	it('est symétrique', () => {
		expect(proximiteDeTitres(CIBLE, 'Sauvegarde PostgreSQL')).toBeCloseTo(
			proximiteDeTitres('Sauvegarde PostgreSQL', CIBLE),
			10
		);
	});

	it('ignore la casse, les accents et la ponctuation', () => {
		expect(proximiteDeTitres('Procédure d’astreinte', "PROCEDURE D'ASTREINTE !")).toBe(1);
	});
});

describe('les trois paires proches', () => {
	const proches = [
		'restaurer une sauvegarde postgres',
		'Restauration d’une sauvegarde PostgreSQL',
		'Sauvegarde PostgreSQL : restauration'
	];
	for (const titre of proches) {
		it(`« ${titre} » dépasse le seuil`, () => {
			expect(proximiteDeTitres(CIBLE, titre)).toBeGreaterThanOrEqual(SEUIL_DE_PROXIMITE);
		});
	}
});

describe('les trois paires éloignées', () => {
	const eloignees = [
		'Configurer le VPN du siège',
		'Renouveler le certificat TLS',
		'Sauvegarde des machines virtuelles'
	];
	for (const titre of eloignees) {
		it(`« ${titre} » reste sous le seuil`, () => {
			expect(proximiteDeTitres(CIBLE, titre)).toBeLessThan(SEUIL_DE_PROXIMITE);
		});
	}

	/**
	 * LE CAS QUI A FIXÉ LE SEUIL. Deux procédures symétriques partagent tout leur
	 * squelette et ne sont pas des doublons : un seuil plus bas les aurait signalées
	 * l'une à l'autre à chaque création.
	 */
	it('deux procédures qui s’opposent par un seul mot ne sont pas des doublons', () => {
		expect(
			proximiteDeTitres('Créer un compte utilisateur', 'Supprimer un compte utilisateur')
		).toBeLessThan(SEUIL_DE_PROXIMITE);
	});
});

describe('les notes proches', () => {
	const corpus = [
		{ id: 'n-1', titre: 'Restaurer une sauvegarde PostgreSQL' },
		{ id: 'n-2', titre: 'Restauration d’une sauvegarde PostgreSQL' },
		{ id: 'n-3', titre: 'Configurer le VPN du siège' }
	];

	/** L'INSTANCE NEUVE : aucune note, donc aucun avertissement, donc aucun bloc. */
	it('ne rend rien sur un corpus vide', () => {
		expect(notesProches(CIBLE, [])).toEqual([]);
	});

	it('ne rend rien tant que le titre est vide', () => {
		expect(notesProches('   ', corpus)).toEqual([]);
	});

	it('rend les proches, de la plus proche à la moins proche', () => {
		const trouvees = notesProches('restaurer une sauvegarde postgres', corpus);
		expect(trouvees.map((p) => p.note.id)).toEqual(['n-1', 'n-2']);
		expect(trouvees[0]?.proximite).toBeGreaterThan(trouvees[1]?.proximite ?? 1);
	});

	it('n’en rend jamais plus que le maximum demandé', () => {
		expect(notesProches('restaurer une sauvegarde postgres', corpus, { maximum: 1 })).toHaveLength(
			1
		);
	});

	/** LA NOTE QU'ON MODIFIE NE SE RESSEMBLE PAS À ELLE-MÊME. */
	it('écarte la note exclue', () => {
		const trouvees = notesProches(CIBLE, corpus, { exclure: (n) => n.id === 'n-1' });
		expect(trouvees.map((p) => p.note.id)).toEqual(['n-2']);
	});
});
