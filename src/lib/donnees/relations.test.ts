/**
 * LES UNITAIRES DES RELATIONS — ce qui se contrôle SANS base.
 *
 * La règle est celle d'`outils.test.ts` : ce qui exige un conteneur n'est pas
 * ici. Les trois écritures (`ajouterUneRelation`, `retirerUneRelation`,
 * `lireLesRelationsDeLaNote`) parlent à PostgreSQL ; elles sont éprouvées au
 * navigateur, contre la base réelle, et le relevé est joint au rapport du lot.
 *
 * CE QUI EST ÉPROUVÉ ICI, ET POURQUOI CE SONT CES TROIS-LÀ :
 *
 *   1. LE MOT DE L'ORIGINE (`P-08`). C'est la seule traduction de l'énuméré
 *      `origine_de_relation` du produit, et les trois mots sont ceux du cahier
 *      (`CDC:901`). Un cas SYNTHÉTIQUE couvre les trois valeurs et la polarité
 *      inverse — une valeur que la base n'aurait pas dû rendre doit LEVER, non
 *      pas rendre une chaîne vide : un signal muet est pire qu'un signal absent
 *      (`P-26` : le contrôle garde un cas après la correction du défaut).
 *   2. LE GROUPEMENT PAR LIBELLÉ. « Les relations sont groupées par type dans
 *      l'affichage » (`M08.3`), et l'ordre rendu doit être celui reçu — la
 *      requête trie, ce module ne retrie pas. Le cas qui compte est celui où
 *      deux relations du MÊME libellé sont séparées par une troisième d'un
 *      autre libellé : un groupement qui ne les réunirait pas passerait
 *      inaperçu sur un jeu déjà trié.
 *   3. LA LECTURE DE LA SAISIE. Les deux champs sont obligatoires, et le refus
 *      porte un motif. Les deux polarités sont jouées.
 */
import { describe, expect, it } from 'vitest';
import {
	GLOSE_DE_L_ORIGINE,
	MOT_DE_L_ORIGINE,
	grouperLesRelations,
	libelleDOrigine,
	lireLaSaisieDeRelation,
	type RelationDeLaNote
} from './relations';
import type { OrigineDeRelation } from './outils';

/** Une relation de forme minimale — seul le libellé décide du groupement. */
function relation(id: string, libelle: string, titre: string): RelationDeLaNote {
	return {
		id,
		sens: 'sortante',
		type: 'heberge',
		libelle,
		origine: 'declaree',
		autre: { identifiant: titre, titre, type: 'Serveur', domaine: 'Infrastructure' }
	};
}

describe("le mot de l'origine — P-08", () => {
	it('rend les trois mots du cahier, et rien qu’eux', () => {
		expect(libelleDOrigine('declaree')).toBe('déclarée');
		expect(libelleDOrigine('deduite')).toBe('déduite');
		expect(libelleDOrigine('ambigue')).toBe('ambiguë');
	});

	it('couvre exactement les trois valeurs de l’énuméré du schéma', () => {
		expect(Object.keys(MOT_DE_L_ORIGINE).sort()).toEqual(['ambigue', 'declaree', 'deduite']);
		expect(Object.keys(GLOSE_DE_L_ORIGINE).sort()).toEqual(['ambigue', 'declaree', 'deduite']);
	});

	it('porte la glose du cahier, mot pour mot', () => {
		expect(GLOSE_DE_L_ORIGINE.declaree).toBe('saisie humaine');
		expect(GLOSE_DE_L_ORIGINE.deduite).toBe('inférée par le produit');
		expect(GLOSE_DE_L_ORIGINE.ambigue).toBe('à confirmer');
	});

	/**
	 * LA POLARITÉ INVERSE. Une origine hors énuméré ne peut venir que d'un
	 * schéma désaccordé ; le signal doit alors s'ARRÊTER, pas s'effacer. Sans ce
	 * cas, la fonction pourrait rendre `undefined` sans que rien ne le dise, et
	 * `P-08` deviendrait un libellé vide à l'écran.
	 */
	it('refuse une origine que le schéma ne connaît pas', () => {
		expect(() => libelleDOrigine('inventee' as OrigineDeRelation)).toThrow(/origine de relation/);
	});
});

describe('le groupement par libellé — M08.3', () => {
	it('réunit deux relations du même libellé séparées par une troisième', () => {
		const groupes = grouperLesRelations([
			relation('r1', 'héberge', 'pg-prod-01'),
			relation('r2', 'dépend de', 'bkp-01'),
			relation('r3', 'héberge', 'pg-prod-02')
		]);

		expect(groupes.map((g) => g.libelle)).toEqual(['héberge', 'dépend de']);
		expect(groupes[0]?.relations.map((r) => r.id)).toEqual(['r1', 'r3']);
		expect(groupes[1]?.relations.map((r) => r.id)).toEqual(['r2']);
	});

	it('conserve l’ordre reçu, et n’en invente aucun', () => {
		const groupes = grouperLesRelations([
			relation('r1', 'zêta', 'z'),
			relation('r2', 'alpha', 'a')
		]);
		expect(groupes.map((g) => g.libelle)).toEqual(['zêta', 'alpha']);
	});

	it('rend zéro groupe sur zéro relation — l’état vide, jamais un groupe vide', () => {
		expect(grouperLesRelations([])).toEqual([]);
	});
});

describe('la lecture de la saisie', () => {
	function formulaire(champs: Record<string, string>): FormData {
		const donnees = new FormData();
		for (const [nom, valeur] of Object.entries(champs)) donnees.set(nom, valeur);
		return donnees;
	}

	it('accepte un type et une note visée', () => {
		const lue = lireLaSaisieDeRelation(formulaire({ type: 'heberge', cible: 'n-facturation' }));
		expect(lue).toEqual({ ok: true, saisie: { type: 'heberge', cible: 'n-facturation' } });
	});

	it('rogne les blancs de part et d’autre', () => {
		const lue = lireLaSaisieDeRelation(formulaire({ type: '  heberge ', cible: ' n-f ' }));
		expect(lue).toEqual({ ok: true, saisie: { type: 'heberge', cible: 'n-f' } });
	});

	it('refuse une saisie sans type, avec son motif', () => {
		const lue = lireLaSaisieDeRelation(formulaire({ cible: 'n-facturation' }));
		expect(lue.ok).toBe(false);
		expect(lue.ok ? '' : lue.motif).toMatch(/type/);
	});

	it('refuse une saisie sans note visée, avec son motif', () => {
		const lue = lireLaSaisieDeRelation(formulaire({ type: 'heberge' }));
		expect(lue.ok).toBe(false);
		expect(lue.ok ? '' : lue.motif).toMatch(/note/);
	});
});
