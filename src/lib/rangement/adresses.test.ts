/**
 * Le gabarit d'adresse du rangement — ce que le contrat de route exige.
 *
 * Ce fichier prouve la FORME des adresses de `docs/routes.md` §3.3, et
 * l'absence de la forme raccourcie qu'ARB-001 supprime. Il ne prouve aucun
 * routage : aucune route SvelteKit n'existe encore, et le banc de comparaison
 * ne vérifie pas les adresses (ARB-013). C'est ici, et ici seulement, que la
 * forme canonique est opposable tant que le câblage n'est pas fait.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS, DOMAINES, UNIVERS } from '../../../seeds/corpus';
import {
	adresseDeCreationDeSignet,
	adresseDeDomaine,
	adresseDeDossier,
	adresseDeModificationDeSignet,
	adresseDeNote,
	adresseDesNotesDuDomaine,
	adresseDesSignetsDuDomaine,
	adresseDUnivers,
	identifiantLisible,
	segmentsDeDossier
} from './adresses';

describe('identifiantLisible', () => {
	it('retire les diacritiques et met en minuscules', () => {
		expect(identifiantLisible('Réseau')).toBe('reseau');
		expect(identifiantLisible('Supervision')).toBe('supervision');
	});

	it('réduit toute séquence non alphanumérique à un tiret unique', () => {
		expect(identifiantLisible('Poste de travail')).toBe('poste-de-travail');
		expect(identifiantLisible('Migration 2026')).toBe('migration-2026');
		expect(identifiantLisible('Fiches applicatives')).toBe('fiches-applicatives');
	});

	it('ne laisse jamais de tiret en tête ni en queue', () => {
		expect(identifiantLisible(' Exploitation ')).toBe('exploitation');
		expect(identifiantLisible('— Astreinte —')).toBe('astreinte');
	});
});

describe("l'adresse canonique — RG-M03-02, ARB-001", () => {
	it("V-10 : la page d'un univers est /univers/{univers}", () => {
		expect(adresseDUnivers('Production')).toBe('/univers/production');
		expect(adresseDUnivers('Projets')).toBe('/univers/projets');
	});

	it("V-11 : la page d'un domaine inclut son univers", () => {
		expect(adresseDeDomaine('Production', 'Infrastructure')).toBe(
			'/univers/production/infrastructure'
		);
		expect(adresseDeDomaine('Projets', 'Migration 2026')).toBe('/univers/projets/migration-2026');
	});

	it("l'univers est ce qui distingue deux domaines homonymes (RG-STR-02)", () => {
		expect(adresseDeDomaine('Production', 'Support')).not.toBe(
			adresseDeDomaine('Projets', 'Support')
		);
	});

	it("aucune fonction n'émet la forme raccourcie /domaines/… (ARB-001)", () => {
		for (const d of DOMAINES) {
			expect(adresseDeDomaine(d.univers, d.nom).startsWith('/univers/')).toBe(true);
			expect(adresseDeDomaine(d.univers, d.nom)).not.toContain('/domaines/');
		}
	});

	it('chaque univers du corpus a une adresse, et elles sont toutes distinctes', () => {
		const adresses = UNIVERS.map((u) => adresseDUnivers(u.nom));
		expect(new Set(adresses).size).toBe(UNIVERS.length);
	});
});

describe("l'adresse d'un dossier — V-13", () => {
	it('prolonge celle du domaine par le segment réservé « dossiers »', () => {
		expect(adresseDeDossier('Production', 'Infrastructure', ['Exploitation'])).toBe(
			'/univers/production/infrastructure/dossiers/exploitation'
		);
	});

	it('porte le chemin entier, du dossier racine au dossier courant', () => {
		expect(adresseDeDossier('Production', 'Infrastructure', ['Exploitation', 'Sauvegardes'])).toBe(
			'/univers/production/infrastructure/dossiers/exploitation/sauvegardes'
		);
	});

	it('rend la racine des dossiers quand le chemin est vide', () => {
		expect(adresseDeDossier('Production', 'Infrastructure', [])).toBe(
			'/univers/production/infrastructure/dossiers'
		);
	});
});

describe("l'adresse d'une note est plate — RG-M03-03", () => {
	it('ne porte aucun segment de rangement', () => {
		const adresse = adresseDeNote('restaurer-une-sauvegarde-mariadb');
		expect(adresse).toBe('/notes/restaurer-une-sauvegarde-mariadb');
		expect(adresse).not.toContain('/univers/');
		expect(adresse).not.toContain('/dossiers/');
	});
});

describe('segmentsDeDossier', () => {
	it('découpe le chemin que le corpus porte', () => {
		expect(segmentsDeDossier('Exploitation › Sauvegardes')).toEqual([
			'Exploitation',
			'Sauvegardes'
		]);
		expect(segmentsDeDossier('Exploitation')).toEqual(['Exploitation']);
		expect(segmentsDeDossier('')).toEqual([]);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   LE PROLONGEMENT DU LOT P-10 — V-12, V-22, V-23
   ═══════════════════════════════════════════════════════════════════════ */

describe("l'adresse de la liste des notes d'un domaine — V-12", () => {
	it("prolonge l'adresse canonique du domaine par le segment réservé « notes »", () => {
		expect(adresseDesNotesDuDomaine('Production', 'Infrastructure')).toBe(
			'/univers/production/infrastructure/notes'
		);
		expect(adresseDesNotesDuDomaine('Production', 'Poste de travail')).toBe(
			'/univers/production/poste-de-travail/notes'
		);
	});

	it('ne porte aucun filtre : les facettes voyagent en requête, pas en chemin', () => {
		expect(adresseDesNotesDuDomaine('Production', 'Infrastructure')).not.toContain('?');
	});
});

describe("l'adresse des signets d'un domaine — V-22", () => {
	it("prolonge l'adresse canonique du domaine par le segment réservé « signets »", () => {
		expect(adresseDesSignetsDuDomaine('Production', 'Infrastructure')).toBe(
			'/univers/production/infrastructure/signets'
		);
		expect(adresseDesSignetsDuDomaine('Production', 'Applications')).toBe(
			'/univers/production/applications/signets'
		);
	});
});

describe('les deux adresses du formulaire de signet — V-23', () => {
	it('la création est `…/signets/nouveau`', () => {
		expect(adresseDeCreationDeSignet('Production', 'Infrastructure')).toBe(
			'/univers/production/infrastructure/signets/nouveau'
		);
	});

	it("l'édition est `…/signets/{identifiant}/modifier`", () => {
		expect(adresseDeModificationDeSignet('Production', 'Infrastructure', 'n-sig-statut')).toBe(
			'/univers/production/infrastructure/signets/n-sig-statut/modifier'
		);
	});

	it("l'identifiant d'un signet est pris tel quel — c'est celui d'une note", () => {
		const signet = CORPUS.find((n) => n.type === 'Signet');
		expect(signet).toBeDefined();
		expect(adresseDeModificationDeSignet('Production', 'Infrastructure', signet!.id)).toContain(
			`/signets/${signet!.id}/modifier`
		);
	});

	it("les deux enveloppes de V-23 partagent la même paire d'adresses", () => {
		// Aucune fonction ne prend l'enveloppe en argument : le formulaire est
		// le même écran, la boîte de dialogue n'est pas une seconde route.
		expect(adresseDeCreationDeSignet('Production', 'Infrastructure')).toBe(
			adresseDeCreationDeSignet('Production', 'Infrastructure')
		);
	});
});

describe("les trois prolongements n'échappent pas à la forme canonique — ARB-001", () => {
	it('aucun ne peut émettre /domaines/…, sur aucun domaine du corpus', () => {
		for (const d of DOMAINES) {
			for (const adresse of [
				adresseDesNotesDuDomaine(d.univers, d.nom),
				adresseDesSignetsDuDomaine(d.univers, d.nom),
				adresseDeCreationDeSignet(d.univers, d.nom),
				adresseDeModificationDeSignet(d.univers, d.nom, 'n-sig-statut')
			]) {
				expect(adresse.startsWith('/univers/')).toBe(true);
				expect(adresse).not.toContain('/domaines/');
			}
		}
	});

	it("chacun commence par l'adresse du domaine, sans exception", () => {
		for (const d of DOMAINES) {
			const base = adresseDeDomaine(d.univers, d.nom);
			expect(adresseDesNotesDuDomaine(d.univers, d.nom)).toBe(`${base}/notes`);
			expect(adresseDesSignetsDuDomaine(d.univers, d.nom)).toBe(`${base}/signets`);
		}
	});

	it('les segments réservés ne se recouvrent pas — `notes`, `dossiers`, `signets`', () => {
		const u = 'Production';
		const d = 'Infrastructure';
		const adresses = [
			adresseDesNotesDuDomaine(u, d),
			adresseDeDossier(u, d, []),
			adresseDesSignetsDuDomaine(u, d)
		];
		expect(new Set(adresses).size).toBe(3);
	});
});
