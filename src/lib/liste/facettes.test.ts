/**
 * LES FACETTES DE LA LISTE DE NOTES — la mise en forme, éprouvée SANS BASE.
 *
 * Ces règles vivaient dans `V-12.svelte`, appliquées à toutes les notes lisibles de
 * l'instance. Le compte se fait désormais en SQL ; ce qui reste ici est la MISE EN
 * FORME, et c'est elle qui décide de ce que l'écran montre. Les trois cas d'ordre
 * ci-dessous sont exactement ceux que la planche impose, et le troisième — la valeur
 * retenue à compte nul — est celui qu'une réécriture perd en silence.
 */
import { describe, expect, it } from 'vitest';
import {
	assemblerLaFacette,
	CLES_DE_FACETTE,
	FACETTES_DE_NOTE,
	nombreDePages,
	NOTES_PAR_PAGE,
	ordreDeListe,
	pageDemandee
} from './facettes';

const TYPE = FACETTES_DE_NOTE[0];
const ETIQUETTE = FACETTES_DE_NOTE[5];
if (TYPE === undefined || ETIQUETTE === undefined) throw new Error('facettes : déclaration vide');

describe('les six facettes déclarées', () => {
	it('portent les six clés d’adresse, dans l’ordre des menus', () => {
		expect(FACETTES_DE_NOTE.map((f) => f.id)).toEqual([...CLES_DE_FACETTE]);
		expect(CLES_DE_FACETTE).toEqual([
			'type',
			'fraicheur',
			'statut',
			'dossier',
			'auteur',
			'etiquette'
		]);
	});

	it('ne préfixent que les étiquettes', () => {
		expect(ETIQUETTE.prefixe).toBe('#');
		expect(FACETTES_DE_NOTE.filter((f) => f.prefixe !== '')).toEqual([ETIQUETTE]);
	});
});

describe('l’ordre des valeurs d’une facette', () => {
	it('range par compte décroissant, puis en français', () => {
		const facette = assemblerLaFacette(
			TYPE,
			new Map([
				['Note', 3],
				['Élan', 5],
				['Fiche', 5]
			]),
			[]
		);
		/* « Élan » avant « Fiche » à compte égal : la collation française place le E
		   accentué avant le F, là où l'ordre des octets le place après. */
		expect(facette.valeurs.map((v) => v.valeur)).toEqual(['Élan', 'Fiche', 'Note']);
	});

	it('ajoute en queue, à zéro, une valeur retenue que le compte ignore', () => {
		const facette = assemblerLaFacette(TYPE, new Map([['Note', 2]]), ['Introuvable']);
		expect(facette.valeurs).toEqual([
			{ valeur: 'Note', compte: 2, retenue: false },
			{ valeur: 'Introuvable', compte: 0, retenue: true }
		]);
		expect(facette.retenues).toBe(1);
	});

	/* UNE NOTE RANGÉE À LA RACINE D'UN DOMAINE N'A PAS DE CHEMIN DE DOSSIER : sa
	   valeur est la chaîne vide, et un menu ne propose pas de filtrer sur rien. */
	it('n’offre jamais la valeur vide', () => {
		const facette = assemblerLaFacette(
			TYPE,
			new Map([
				['', 9],
				['Note', 1]
			]),
			[]
		);
		expect(facette.valeurs.map((v) => v.valeur)).toEqual(['Note']);
	});

	it('marque comme retenue la valeur que l’adresse porte', () => {
		const facette = assemblerLaFacette(ETIQUETTE, new Map([['reseau', 4]]), ['reseau']);
		expect(facette.valeurs).toEqual([{ valeur: 'reseau', compte: 4, retenue: true }]);
	});
});

describe('l’ordre demandé', () => {
	it('reconnaît les trois ordres explicites', () => {
		expect(ordreDeListe('alpha')).toBe('alpha');
		expect(ordreDeListe('verification')).toBe('verification');
		expect(ordreDeListe('consultations')).toBe('consultations');
	});

	/* UN PARAMÈTRE D'ADRESSE N'EST PAS UNE SAISIE : il s'ignore, il ne refuse pas. */
	it('retombe sur l’ancienneté de modification pour tout le reste', () => {
		expect(ordreDeListe('modification')).toBe('modification');
		expect(ordreDeListe('au petit bonheur')).toBe('modification');
		expect(ordreDeListe(null)).toBe('modification');
		expect(ordreDeListe(undefined)).toBe('modification');
	});
});

describe('la pagination', () => {
	it('compte au moins une page, même sans résultat', () => {
		expect(nombreDePages(0)).toBe(1);
		expect(nombreDePages(1)).toBe(1);
		expect(nombreDePages(NOTES_PAR_PAGE)).toBe(1);
		expect(nombreDePages(NOTES_PAR_PAGE + 1)).toBe(2);
		expect(nombreDePages(2000, 50)).toBe(40);
	});

	it('lit la page demandée, et ne refuse aucune valeur', () => {
		expect(pageDemandee('3')).toBe(3);
		expect(pageDemandee('1')).toBe(1);
		expect(pageDemandee('0')).toBe(1);
		expect(pageDemandee('-7')).toBe(1);
		expect(pageDemandee('deux')).toBe(1);
		expect(pageDemandee(null)).toBe(1);
	});
});
