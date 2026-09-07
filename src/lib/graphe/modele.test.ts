/**
 * LE MODÈLE, TEL QUE LE CHARGEUR DE `/modelisation` L'ENCHAÎNE — `sousGraphe()`,
 * `aretesDeMention()`, `pointsArticulation()`, `disposerEnCouches()` et `cleDArete()`,
 * montés en mémoire sur des notes et des relations littérales.
 *
 * POURQUOI CE FICHIER EXISTE. `/modelisation` n'était couvert que par une ligne de
 * `src/lib/auth/garde.test.ts` — celle qui vérifie qu'il redirige l'anonyme. Rien ne
 * disait ce que l'écran GARANTIT : que les points de défaillance unique se taisent
 * quand personne n'a dit ce qui porte une dépendance, qu'une citation n'en fabrique
 * jamais un, qu'une note que rien ne relie sort du dessin sans sortir des sélecteurs,
 * et qu'une arête servie porte des titres, pas des identifiants.
 *
 * RIEN ICI NE PARLE À POSTGRESQL — la règle de `src/lib/donnees/relations.test.ts:1-8`.
 */
import { describe, expect, it } from 'vitest';
import {
	dansLePerimetre,
	pointsArticulation,
	sousGraphe,
	titreDe,
	type Perimetre
} from './cartographie';
import { cleDArete, disposerEnCouches } from './couches';
import { TYPE_DE_MENTION, aretesDeMention } from './mentions';
import type { RelationLisible } from '../donnees/outils';
import type { Note, Relation } from '../../../seeds/corpus';

/** Une note réduite à ce que le modèle regarde — identité, titre et rangement. */
function note(id: string, titre: string, univers = 'U', domaine = 'D'): Note {
	return {
		id,
		titre,
		extrait: '',
		type: 'Note',
		univers,
		domaine,
		dossier: '',
		auteur: '',
		fraicheur: 'frais',
		jours: 0,
		revise: null,
		vues: 0,
		pj: 0,
		brouillon: false,
		visibilite: 'interne',
		operationnel: false,
		etiquettes: []
	} as unknown as Note;
}

function declaree(de: string, vers: string, type: string): RelationLisible {
	return {
		id: de + '>' + vers + '>' + type,
		de,
		vers,
		type,
		origine: 'declaree'
	} as unknown as RelationLisible;
}

const GLOBAL: Perimetre = { type: 'global' };

/**
 * LE GRAPHE EN CHAÎNE — trois notes, deux arêtes, et le milieu porte tout. Retirer
 * `bastion` couperait le graphe en deux : c'est un point de défaillance unique, et le
 * seul de ce graphe. Le type des deux arêtes est le paramètre des trois premiers
 * contrôles.
 */
function chaine(type: string, origine: 'declaree' | 'deduite' = 'declaree') {
	const notes = [
		note('applicatif', 'Applicatif de paie'),
		note('bastion', 'Bastion'),
		note('sauvegarde', 'Serveur de sauvegarde')
	];
	const aretes: readonly Relation[] = [
		{ ...declaree('applicatif', 'bastion', type), origine },
		{ ...declaree('bastion', 'sauvegarde', type), origine }
	] as unknown as readonly Relation[];
	return sousGraphe(notes, GLOBAL, aretes, 'retirees');
}

describe('pointsArticulation', () => {
	it("aucun type porteur : aucun point de rupture, et ce n'est pas une bonne nouvelle", () => {
		const g = chaine('depend-de');

		/* CE QUE REND UNE INSTANCE NEUVE : la colonne `technique` vaut `false` par
		   défaut depuis la migration `002`, donc `lireRelationsTechniques()` rend une
		   liste vide, donc le calcul ne trouve rien. Le silence ne dit PAS « aucun
		   point de défaillance unique », il dit « personne n'a dit ce qui porte une
		   dépendance » — et c'est l'écran qui doit faire la différence. */
		expect([...pointsArticulation(g, [])]).toEqual([]);

		/* LE MÊME GRAPHE, une fois le type marqué en console : le point apparaît. */
		expect([...pointsArticulation(g, ['depend-de'] as unknown as Relation['type'][])]).toEqual([
			'bastion'
		]);
	});

	it('une arête déduite ne fabrique jamais un point de rupture', () => {
		/* Les mentions sortent de `aretesDeMention()`, jamais d'une saisie : c'est
		   par là qu'on les monte, pour éprouver le type qu'elle pose réellement. */
		const notes = [
			note('applicatif', 'Applicatif de paie'),
			note('bastion', 'Bastion'),
			note('sauvegarde', 'Serveur de sauvegarde')
		];
		const mentions = aretesDeMention(
			notes,
			new Map([
				['applicatif', ['bastion']],
				['bastion', ['sauvegarde']]
			]),
			[],
			GLOBAL
		);
		expect(mentions.map((r) => r.type)).toEqual([TYPE_DE_MENTION, TYPE_DE_MENTION]);

		const g = sousGraphe(notes, GLOBAL, mentions as unknown as readonly Relation[], 'retirees');
		/* La seule arête coupante est une citation. Aucune liste de types porteurs ne
		   peut la faire compter : `mentionne` n'est pas au référentiel, et rien ne l'y
		   met. */
		for (const porteurs of [[], ['depend-de'], ['heberge', 'depend-de', 'sauvegarde']]) {
			expect([...pointsArticulation(g, porteurs as unknown as Relation['type'][])]).toEqual([]);
		}
	});

	it("un type porteur créé en console est pris en compte sans qu'aucun nom soit écrit", () => {
		/* AUCUNE CLÉ DE TYPE N'EST ÉCRITE DANS LE PRODUIT : `estTechnique()` compare à
		   la liste que la table rend. Un type qu'un administrateur invente aujourd'hui
		   compte donc exactement comme `depend-de`. */
		const invente = 'un-type-que-personne-n-a-prevu';
		const g = chaine(invente);

		expect([...pointsArticulation(g, [invente] as unknown as Relation['type'][])]).toEqual([
			'bastion'
		]);
		/* Et il ne compte QUE parce que la table le marque : non marqué, rien. */
		expect([...pointsArticulation(g, ['depend-de'] as unknown as Relation['type'][])]).toEqual([]);
	});
});

describe('les arêtes servies par la modélisation', () => {
	it('les notes isolées sortent du dessin et restent dans les sélecteurs', () => {
		const notes = [
			note('applicatif', 'Applicatif de paie'),
			note('bastion', 'Bastion'),
			note('orpheline', 'Note que rien ne relie')
		];
		const relations = [
			declaree('applicatif', 'bastion', 'depend-de')
		] as unknown as readonly Relation[];

		/* `retirees` : la question de cet écran est « qu'est-ce qui dépend de quoi »,
		   et une note que rien ne touche n'y répond pas. */
		const graphe = sousGraphe(notes, GLOBAL, relations, 'retirees');
		expect(graphe.noeuds.map((n) => n.id).sort()).toEqual(['applicatif', 'bastion']);
		expect(graphe.index.has('orpheline')).toBe(false);

		/* La disposition ne place donc rien pour elle. */
		const disposition = disposerEnCouches(graphe, 'tout');
		expect(disposition.places.has('orpheline')).toBe(false);
		expect(disposition.places.has('applicatif')).toBe(true);

		/* MAIS LES DEUX SÉLECTEURS LA GARDENT, et c'est ce qui rend possible le
		   PREMIER lien d'une note : n'offrir que les nœuds dessinés rendrait ce lien
		   indéclarable depuis l'écran qui sert à déclarer les liens. */
		const notesDuPerimetre = notes
			.filter((n) => dansLePerimetre(n, GLOBAL))
			.map((n) => n.id)
			.sort();
		expect(notesDuPerimetre).toEqual(['applicatif', 'bastion', 'orpheline']);
	});

	it("l'arête servie porte le titre de ses deux extrémités, jamais l'identifiant", () => {
		const notes = [note('applicatif', 'Applicatif de paie'), note('bastion', 'Bastion')];
		/* La seconde arête vise une note ABSENTE de la table des titres — le cas d'une
		   extrémité qu'on ne connaît pas, et le repli doit être visible, pas vide. */
		const relations = [
			declaree('applicatif', 'bastion', 'depend-de'),
			declaree('bastion', 'inconnue', 'depend-de')
		] as unknown as readonly Relation[];
		const graphe = sousGraphe(notes, GLOBAL, relations, 'retirees');

		const servies = graphe.aretes.map((r) => ({
			titreDe: titreDe(graphe, notes, r.de),
			titreVers: titreDe(graphe, notes, r.vers)
		}));

		expect(servies[0]).toEqual({ titreDe: 'Applicatif de paie', titreVers: 'Bastion' });
		expect(servies[1]).toEqual({ titreDe: 'Bastion', titreVers: 'inconnue' });
	});

	it("la clé d'une arête distingue deux relations de types différents sur la même paire", () => {
		const paire = { de: 'applicatif', vers: 'bastion' };
		const heberge = { ...paire, type: 'heberge' } as unknown as Relation;
		const dependDe = { ...paire, type: 'depend-de' } as unknown as Relation;

		expect(cleDArete(heberge)).not.toBe(cleDArete(dependDe));
		expect(cleDArete(heberge)).toBe('applicatif>bastion>heberge');
		expect(cleDArete(dependDe)).toBe('applicatif>bastion>depend-de');

		/* LA MÊME RELATION REND LA MÊME CLÉ : c'est ce qui permet à l'adresse de
		   désigner une arête, et à l'étagement de nommer celle qui remonte. */
		expect(cleDArete({ ...paire, type: 'heberge' } as unknown as Relation)).toBe(
			cleDArete(heberge)
		);
	});
});
