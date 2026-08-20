/**
 * LES UNITAIRES DES DEUX BRANCHES DE `/` — la décision d'accès, sans base.
 *
 * Ce qui exige une base est `pnpm verif:donnees` et la batterie 6 ; les mêler
 * ici rendrait `pnpm test:unit` dépendant de Docker, et une batterie qui ne
 * s'exécute pas ne prouve rien (`lecture.test.ts` pose la règle, celui-ci la
 * suit).
 *
 * CE QUE CE FICHIER ÉPROUVE, ET POURQUOI IL EXISTE. `resolution.test.ts` prouve
 * déjà la résolution des droits ; ce fichier prouve que **le chemin de
 * l'accueil l'emprunte**, et il porte le cas que le corpus livré n'a pas :
 * une note **publique en brouillon**. Mesuré en base le 20 août 2026 :
 * 6 notes publique+publiée, 25 interne+publiée, 1 interne+brouillon, **0
 * publique+brouillon**. La seconde moitié du filtre anonyme — le statut — n'est
 * donc exercée par aucune donnée réelle, et une règle qu'aucun cas ne solli-
 * cite est une règle qu'on espère (`P-5`). Le cas est ici SYNTHÉTIQUE, donc
 * indépendant de l'état du dépôt : une semence future qui ajouterait la note
 * manquante ne rendrait pas ce contrôle inerte, et une semence qui la
 * retirerait ne l'effacerait pas non plus (`P-26`).
 */
import { describe, expect, it } from 'vitest';
import { ANONYME, identiteAuthentifiee } from '../droits/resolution';
import { notesPubliques, type Note } from '../../../seeds/corpus';
import { SANS_CONTREPARTIE_EN_BASE, identifiantsRetenus, type NoteDuPerimetre } from './accueil';

/* ═══════════════════════════════════════ Le décor ══════════════════════ */

/**
 * Une arborescence à trois étages, la plus petite qui exerce l'héritage ET la
 * remontée d'ancêtres : `racine → intermediaire → feuille`.
 */
const ARBRE = [
	{ id: 'racine', parentId: null },
	{ id: 'intermediaire', parentId: 'racine' },
	{ id: 'feuille', parentId: 'intermediaire' },
	/* Un second sous-arbre, pour qu'un droit posé sur le premier ne suffise
	   jamais à rendre le second lisible. */
	{ id: 'ailleurs', parentId: null }
];

/**
 * Quatre notes dans le même dossier, une par couple (visibilité × statut). Le
 * dossier unique est délibéré : il rend impossible de confondre le filtre de
 * DOSSIER avec le filtre de NOTE, puisque les quatre partagent le premier.
 */
const NOTES: readonly NoteDuPerimetre[] = [
	{ identifiant: 'pub-publiee', dossierId: 'feuille', visibilite: 'publique', statut: 'publiee' },
	{
		identifiant: 'pub-brouillon',
		dossierId: 'feuille',
		visibilite: 'publique',
		statut: 'brouillon'
	},
	{ identifiant: 'int-publiee', dossierId: 'feuille', visibilite: 'interne', statut: 'publiee' },
	{
		identifiant: 'int-brouillon',
		dossierId: 'feuille',
		visibilite: 'interne',
		statut: 'brouillon'
	},
	/* Hors du sous-arbre, et hors de tout droit accordé plus bas. */
	{
		identifiant: 'ailleurs-publiee',
		dossierId: 'ailleurs',
		visibilite: 'interne',
		statut: 'publiee'
	}
];

const COMPTE = 'compte-a';

/* ═══════════════════════════════════════ Le régime anonyme ═════════════ */

describe('le périmètre anonyme — publique ET publiée, les deux', () => {
	it('ne retient que la note publique et publiée', () => {
		const retenus = identifiantsRetenus(ANONYME, ARBRE, [], NOTES);
		expect([...retenus]).toEqual(['pub-publiee']);
	});

	it('REJETTE la note publique en BROUILLON — la moitié que le corpus n’exerce pas', () => {
		/* LE CAS QUI FERME LA DEMI-RÈGLE. Sans le `statut === 'publiee'` de
		   `resolution.ts`, cette note passerait : elle est publique, elle est dans
		   un dossier du périmètre anonyme — le dossier `feuille` y entre bien,
		   puisque `pub-publiee` l'y fait entrer avec ses ancêtres. Seul le statut
		   l'écarte. */
		const retenus = identifiantsRetenus(ANONYME, ARBRE, [], NOTES);
		expect(retenus.has('pub-brouillon')).toBe(false);
	});

	it('diverge de `notesPubliques()` du jeu de semence, et c’est le défaut fermé', () => {
		/* `seeds/corpus.ts:2452-2454` filtre sur la SEULE visibilité. Sur le même
		   jeu, les deux définitions ne rendent pas le même ensemble : la preuve par
		   différence que le chargeur n'emploie pas la mauvaise (ÉCART-047).
		   La forme du jeu de semence est celle des vues — `visibilite: 'Publique'`
		   avec une capitale, `brouillon` en booléen —, celle de la base est celle
		   de l'énumération SQL. Le décor est donc traduit, sans quoi la comparaison
		   porterait sur deux vocabulaires et non sur deux règles. */
		const commeLeJeu = NOTES.map(
			(n) =>
				({
					id: n.identifiant,
					visibilite: n.visibilite === 'publique' ? 'Publique' : 'Interne',
					brouillon: n.statut === 'brouillon'
				}) as unknown as Note
		);
		const parLeJeu = notesPubliques(commeLeJeu).map((n) => n.id);
		const parLaResolution = [...identifiantsRetenus(ANONYME, ARBRE, [], NOTES)];

		expect(parLeJeu).toEqual(['pub-publiee', 'pub-brouillon']);
		expect(parLaResolution).toEqual(['pub-publiee']);
		expect(parLeJeu).not.toEqual(parLaResolution);
	});

	it('l’appartenance du dossier au périmètre ne publie pas ses notes internes', () => {
		/* Le piège que `perimetreAnonyme()` documente : `feuille` est dans le
		   périmètre anonyme À CAUSE de `pub-publiee`, et il porte trois autres
		   notes. Les composer est la seule façon de ne pas publier le corpus
		   interne. */
		const retenus = identifiantsRetenus(ANONYME, ARBRE, [], NOTES);
		expect(retenus.has('int-publiee')).toBe(false);
		expect(retenus.has('int-brouillon')).toBe(false);
	});

	it('ne retient rien quand aucune note n’est publique et publiée', () => {
		const sansPublique = NOTES.filter((n) => n.identifiant !== 'pub-publiee');
		expect([...identifiantsRetenus(ANONYME, ARBRE, [], sansPublique)]).toEqual([]);
	});
});

/* ═══════════════════════════════════════ Le régime authentifié ═════════ */

describe('le périmètre autorisé — fermeture par défaut, puis héritage', () => {
	it('ne retient RIEN pour un contributeur sans droit explicite (RG-DRO-02)', () => {
		/* C'est l'état du corpus livré : `droits_de_dossier` est vide. Le zéro
		   n'est pas une valeur illustrative, c'est le compte exact de ce que ce
		   compte peut lire. */
		const identite = identiteAuthentifiee(COMPTE, 'contributeur');
		expect([...identifiantsRetenus(identite, ARBRE, [], NOTES)]).toEqual([]);
	});

	it('hérite d’un droit posé sur un ancêtre, et sur ce sous-arbre seulement', () => {
		const identite = identiteAuthentifiee(COMPTE, 'contributeur');
		const droits = [{ dossierId: 'racine', compteId: COMPTE, droit: 'lecteur' as const }];
		const retenus = identifiantsRetenus(identite, ARBRE, droits, NOTES);
		/* Les quatre notes de `feuille`, brouillons compris : `noteLisible()` ne
		   filtre le statut qu'en anonyme, et le brouillon d'un authentifié n'est
		   réglé par aucune règle de ce lot — ne pas l'inventer est un refus de
		   comblement. */
		expect([...retenus].sort()).toEqual([
			'int-brouillon',
			'int-publiee',
			'pub-brouillon',
			'pub-publiee'
		]);
		/* Et le second sous-arbre reste fermé. */
		expect(retenus.has('ailleurs-publiee')).toBe(false);
	});

	it('l’administrateur lit tout, sans droit explicite (RG-DRO-03)', () => {
		const identite = identiteAuthentifiee(COMPTE, 'administrateur');
		const retenus = identifiantsRetenus(identite, ARBRE, [], NOTES);
		expect(retenus.size).toBe(NOTES.length);
	});

	it('un compte n’hérite pas du droit d’un autre compte', () => {
		const identite = identiteAuthentifiee(COMPTE, 'contributeur');
		const droits = [{ dossierId: 'racine', compteId: 'compte-b', droit: 'lecteur' as const }];
		expect([...identifiantsRetenus(identite, ARBRE, droits, NOTES)]).toEqual([]);
	});

	it('un dossier inconnu de l’arbre ne rend aucune note lisible', () => {
		/* La fermeture par défaut répond d'elle-même : une note rattachée à un
		   dossier absent de l'arborescence n'est lisible par personne, pas même
		   par le porteur d'un droit sur la racine. */
		const identite = identiteAuthentifiee(COMPTE, 'contributeur');
		const droits = [{ dossierId: 'racine', compteId: COMPTE, droit: 'gestionnaire' as const }];
		const orpheline: readonly NoteDuPerimetre[] = [
			{ identifiant: 'orpheline', dossierId: 'disparu', visibilite: 'interne', statut: 'publiee' }
		];
		expect([...identifiantsRetenus(identite, ARBRE, droits, orpheline)]).toEqual([]);
		/* Et en anonyme non davantage, même publique et publiée. */
		const orphelinePublique: readonly NoteDuPerimetre[] = [
			{ identifiant: 'orpheline', dossierId: 'disparu', visibilite: 'publique', statut: 'publiee' }
		];
		expect([...identifiantsRetenus(ANONYME, ARBRE, [], orphelinePublique)]).toEqual([]);
	});
});

/* ═══════════════════════════════════════ P-02, les lacunes ═════════════ */

describe('ce que la base ne porte pas — nommé, compté, jamais comblé', () => {
	it('déclare cinq données d’accueil sans contrepartie, toutes sur V-07', () => {
		expect(SANS_CONTREPARTIE_EN_BASE).toHaveLength(5);
		for (const lacune of SANS_CONTREPARTIE_EN_BASE) {
			expect(lacune.vue).toBe('V-07');
			expect(lacune.affichage.length).toBeGreaterThan(0);
			expect(lacune.motif.length).toBeGreaterThan(0);
		}
	});

	it('ne compte aucune donnée deux fois', () => {
		const noms = SANS_CONTREPARTIE_EN_BASE.map((l) => l.donnee);
		expect(new Set(noms).size).toBe(noms.length);
	});
});
