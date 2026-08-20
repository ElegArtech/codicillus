/**
 * LES UNITAIRES DES OUTILS — ce qui se contrôle SANS base.
 *
 * La règle est celle de `rangement.test.ts` : ce qui exige un conteneur n'est
 * pas ici. Une batterie qui ne s'exécute pas ne prouve rien.
 *
 * Ce que ces tests regardent, et pourquoi ce sont ceux-là :
 *
 *   1. L'INJECTION DES ARÊTES. Le troisième paramètre de `sousGraphe()` est
 *      arrivé avec ce lot ; un paramètre qu'aucun cas n'exerce est un paramètre
 *      dont on ignore s'il marche (`P-5`). Il est donc éprouvé sur un jeu qui
 *      donne un graphe DIFFÉRENT du défaut — sinon le test passerait aussi bien
 *      si l'argument était ignoré.
 *   2. L'ÉTAT DE ZONE DANS SES DEUX POLARITÉS, sur des cas SYNTHÉTIQUES,
 *      indépendants de l'état du dépôt (`P-26`). Le cas qui compte est le plus
 *      contre-intuitif : des notes sans aucune relation, qui est un périmètre
 *      VIDE au sens de la cartographie.
 *   3. LE PÉRIMÈTRE RECOPIÉ DE LA VUE. Ce lot n'a pas le droit d'écrire dans
 *      `src/vues/`, et il a dû recopier une constante qui y vit. La recopie est
 *      gardée par une relecture du fichier : le jour où la vue changera de
 *      périmètre, ce test rougira au lieu d'afficher un état de zone faux.
 *   4. L'ORIGINE (`P-08`) N'EST NI DEVINÉE NI RÉÉCRITE. La forme rendue est
 *      exactement celle qu'une relation doit avoir pour traverser `sousGraphe()`
 *      sans conversion.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CORPUS, RELATIONS, type Note, type Relation } from '../../../seeds/corpus';
import { sousGraphe } from '../graphe/cartographie';
import {
	PERIMETRE_DE_V19,
	PERIMETRE_DE_V20,
	etatDeCartographie,
	grapheReel,
	type RelationLisible
} from './outils';

/** Une note du corpus, par son identifiant — les tests n'inventent aucune note. */
function note(id: string): Note {
	const trouvee = CORPUS.find((n) => n.id === id);
	if (trouvee === undefined) throw new Error(`le corpus ne porte pas ${id}`);
	return trouvee;
}

/** Le fichier d'une vue, lu tel quel. */
function sourceDeVue(vue: string): string {
	return readFileSync(fileURLToPath(new URL(`../../vues/${vue}.svelte`, import.meta.url)), 'utf8');
}

/* ═══════════════════════════════════════════ L'injection des arêtes ════ */

describe('sousGraphe — les arêtes injectées', () => {
	/* Deux notes du corpus qu'AUCUNE relation du jeu ne relie : le graphe par
	   défaut ne peut donc pas les contenir, et un argument ignoré se verrait. */
	const A = 'n-restaurer-maria';
	const B = 'n-tester-pra';

	it('ne relie pas ces deux notes sans arête injectée', () => {
		const parDefaut = sousGraphe(CORPUS, { type: 'global' });
		expect(parDefaut.index.has(A)).toBe(false);
		expect(parDefaut.index.has(B)).toBe(false);
	});

	it('emploie les arêtes reçues, et elles seules', () => {
		const arete: Relation = { de: A, vers: B, type: 'documente' };
		const graphe = sousGraphe(CORPUS, { type: 'global' }, [arete]);

		expect(graphe.aretes).toEqual([arete]);
		expect(graphe.noeuds.map((n) => n.id).sort()).toEqual([A, B].sort());
		/* Aucune des vingt-deux arêtes du jeu ne subsiste. */
		expect(graphe.aretes.length).toBe(1);
	});

	it('rend le graphe du jeu de semence quand on ne lui passe rien', () => {
		const implicite = sousGraphe(CORPUS, { type: 'global' });
		const explicite = sousGraphe(CORPUS, { type: 'global' }, RELATIONS);
		expect(implicite.aretes).toEqual(explicite.aretes);
		expect(implicite.noeuds.map((n) => n.id)).toEqual(explicite.noeuds.map((n) => n.id));
	});

	it("conserve l'ordre des arêtes reçues, qui décide de l'ordre du balisage", () => {
		const notes = [note('n-srv-app-01'), note('n-facturation'), note('n-referentiel')];
		const ordreA: Relation[] = [
			{ de: 'n-srv-app-01', vers: 'n-facturation', type: 'heberge' },
			{ de: 'n-srv-app-01', vers: 'n-referentiel', type: 'heberge' }
		];
		const ordreB: Relation[] = [...ordreA].reverse();

		expect(sousGraphe(notes, { type: 'global' }, ordreA).aretes).toEqual(ordreA);
		expect(sousGraphe(notes, { type: 'global' }, ordreB).aretes).toEqual(ordreB);
	});

	it("décide aussi de l'ordre des nœuds FANTÔMES, et de rien d'autre", () => {
		/* MESURÉ, PAS SUPPOSÉ : l'ordre des nœuds du périmètre est celui du jeu de
		   notes, jamais celui des arêtes. Seuls les nœuds hors périmètre — les
		   fantômes — entrent dans l'ordre où les arêtes les amènent. C'est là, et
		   là seulement, que l'ordre des relations se lit dans le balisage rendu. */
		const notes = [note('n-srv-app-01'), note('n-facturation'), note('n-referentiel')];
		const dedansSeul = { type: 'domaine', nom: note('n-srv-app-01').domaine };
		const ordreA: Relation[] = [
			{ de: 'n-srv-app-01', vers: 'n-facturation', type: 'heberge' },
			{ de: 'n-srv-app-01', vers: 'n-referentiel', type: 'heberge' }
		];
		const ordreB: Relation[] = [...ordreA].reverse();

		const a = sousGraphe(notes, dedansSeul, ordreA).noeuds;
		const b = sousGraphe(notes, dedansSeul, ordreB).noeuds;
		expect(a.filter((n) => n.fantome).length).toBe(2);
		expect(a.map((n) => n.id)).not.toEqual(b.map((n) => n.id));
	});
});

/* ═══════════════════════════════════════════ L'état de zone ════════════ */

describe('etatDeCartographie', () => {
	it('rend « vide » quand le périmètre ne porte aucune relation', () => {
		const notes = [note('n-restaurer-maria'), note('n-tester-pra')];
		expect(etatDeCartographie(grapheReel(notes, [], { type: 'global' }))).toBe('vide');
	});

	it('rend « vide » sur un périmètre sans aucune note', () => {
		expect(etatDeCartographie(grapheReel([], [], { type: 'global' }))).toBe('vide');
	});

	it('rend « nominal » dès qu’une relation touche le périmètre', () => {
		const notes = [note('n-srv-app-01'), note('n-facturation')];
		const aretes: Relation[] = [{ de: 'n-srv-app-01', vers: 'n-facturation', type: 'heberge' }];
		expect(etatDeCartographie(grapheReel(notes, aretes, { type: 'global' }))).toBe('nominal');
	});

	it('se décide sur les arêtes, pas sur les notes du périmètre', () => {
		/* Trente-deux notes, zéro relation : la carte est vide, la liste ne l'est
		   pas. C'est ce que dit le voile du gel — « elle se nourrit des relations
		   déclarées sur les notes ». */
		expect(etatDeCartographie(grapheReel(CORPUS, [], { type: 'global' }))).toBe('vide');
	});

	it('ne rend jamais « dense » : le seuil de RG-M09-04 n’existe pas', () => {
		/* Le corpus entier et ses vingt-deux relations restent « nominal ». Le
		   jour où le seuil sera arbitré, ce test devra être rouvert. */
		expect(etatDeCartographie(grapheReel(CORPUS, RELATIONS, { type: 'global' }))).toBe('nominal');
	});
});

/* ═══════════════════════════════════════════ Les périmètres recopiés ═══ */

describe('les périmètres d’affichage recopiés des vues', () => {
	it('V-19 dessine bien l’univers Production', () => {
		expect(PERIMETRE_DE_V19).toEqual({ type: 'univers', nom: 'Production' });
		expect(sourceDeVue('V-19')).toContain(
			/* T-043 a ajouté le troisième argument `relations` à l'appel de la vue : le
			   littéral a bougé, l'intention du contrôle non. On épingle le PÉRIMÈTRE,
			   pas la signature — sinon ce test rougirait à chaque paramètre ajouté. */
			"sousGraphe(corpus, { type: 'univers', nom: 'Production' }"
		);
	});

	it('V-20 dessine bien le périmètre global', () => {
		expect(PERIMETRE_DE_V20).toEqual({ type: 'global' });
		expect(sourceDeVue('V-20')).toContain("sousGraphe(corpus, { type: 'global' }");
	});

	it('le périmètre de V-19 discrimine réellement, et son effet est mesuré', () => {
		/* Sans quoi le contrôle précédent garderait une constante sans effet.
		   MESURE DU LOT, ET ELLE SURPREND : les vingt-deux relations du jeu
		   touchent toutes l'univers Production, si bien que le périmètre de V-19
		   rend EXACTEMENT le graphe global. La constante n'est donc pas inerte —
		   un autre univers rend zéro arête —, mais elle ne se distingue pas du
		   périmètre global SUR CE CORPUS. C'est un fait du jeu de semence, pas une
		   propriété du produit : un corpus dont les relations traverseraient les
		   univers les distinguerait aussitôt. */
		const production = grapheReel(CORPUS, RELATIONS, PERIMETRE_DE_V19);
		const global = grapheReel(CORPUS, RELATIONS, PERIMETRE_DE_V20);
		const projets = grapheReel(CORPUS, RELATIONS, { type: 'univers', nom: 'Projets' });

		expect(production.aretes.length).toBe(22);
		expect(global.aretes.length).toBe(22);
		expect(projets.aretes.length).toBe(0);
	});
});

/* ═══════════════════════════════════════════ L'origine, P-08 ══════════ */

describe('l’origine d’une relation', () => {
	it('traverse le sous-graphe sans conversion ni perte', () => {
		const lue: RelationLisible = {
			de: 'n-srv-app-01',
			vers: 'n-facturation',
			type: 'heberge',
			origine: 'deduite'
		};
		const graphe = grapheReel([note(lue.de), note(lue.vers)], [lue], { type: 'global' });
		expect(graphe.aretes[0]).toBe(lue);
		expect((graphe.aretes[0] as RelationLisible).origine).toBe('deduite');
	});

	it('n’est jamais réécrite en « declaree » par le chemin de lecture', () => {
		const lues: readonly RelationLisible[] = [
			{ de: 'n-srv-app-01', vers: 'n-facturation', type: 'heberge', origine: 'ambigue' },
			{ de: 'n-srv-app-01', vers: 'n-referentiel', type: 'heberge', origine: 'deduite' }
		];
		const notes = [note('n-srv-app-01'), note('n-facturation'), note('n-referentiel')];
		const graphe = grapheReel(notes, lues, { type: 'global' });
		expect(graphe.aretes.map((r) => (r as RelationLisible).origine)).toEqual([
			'ambigue',
			'deduite'
		]);
	});
});
