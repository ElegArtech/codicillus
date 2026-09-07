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
 *   4. LA MÉMOIRE DES REFUS, pour ce qu'elle a de contrôlable sans base : la clé
 *      d'un triplet, qui est pure, et les trois comptes du relevé, lus sur le
 *      chemin qui n'interroge RIEN. Le cinquième contrôle emploie une base
 *      feinte locale — l'atomicité d'une transaction ne s'extrait pas.
 */
import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
	GLOSE_DE_L_ORIGINE,
	MOT_DE_L_ORIGINE,
	cleDeTriplet,
	grouperLesRelations,
	libelleDOrigine,
	lireLaSaisieDeRelation,
	proposerLesRelations,
	rejeterUneRelation,
	type RelationDeLaNote
} from './relations';
import type { Base } from '../base/acces';
import { identiteAuthentifiee } from '../droits/resolution';
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

/* ═══════════════════════ LA MÉMOIRE DES REFUS — C9 ═══════════════════════ */

describe('la clé d’un triplet', () => {
	it('ne dépend pas de l’ordre des colonnes, et distingue le sens', () => {
		expect(cleDeTriplet('a', 'b', 'depend-de')).toBe(cleDeTriplet('a', 'b', 'depend-de'));
		/* LE TYPE EN FAIT PARTIE : refuser « a dépend de b » ne dit rien de
		   « a documente b ». */
		expect(cleDeTriplet('a', 'b', 'depend-de')).not.toBe(cleDeTriplet('a', 'b', 'documente'));
		/* LE SENS EN FAIT PARTIE : refuser « a → b » ne dit rien de « b → a ». */
		expect(cleDeTriplet('a', 'b', 'depend-de')).not.toBe(cleDeTriplet('b', 'a', 'depend-de'));
	});
});

describe('le relevé des propositions', () => {
	/**
	 * AUCUNE REQUÊTE N'EST FAITE SUR UN LOT VIDE, et cette base le prouve : elle
	 * lève au premier appel. Le contrôle porte donc sur le seul chemin du relevé
	 * qui ne parle pas à PostgreSQL, et il y lit les trois comptes séparément.
	 */
	const BASE_QUI_LEVE = new Proxy(
		{},
		{
			get() {
				throw new Error('aucune requête ne doit partir sur un lot vide');
			}
		}
	) as unknown as Base;

	it('distingue les écartées des refusées, et les trois comptes se lisent à part', async () => {
		const releve = await proposerLesRelations(BASE_QUI_LEVE, {
			identite: identiteAuthentifiee('compte-1', 'administrateur'),
			propositions: []
		});
		expect(releve.posees).toBe(0);
		expect(releve.ecartees).toBe(0);
		expect(releve.refusees).toBe(0);
		/* Les trois clés, et rien d'autre : un relevé qui gagnerait un compte sans
		   que la vue l'apprenne dirait moins que ce qu'il sait. */
		expect(Object.keys(releve).sort()).toEqual(['ecartees', 'posees', 'refusees']);
	});
});

/** Une clé de la forme que `FORME_DE_CLE` exige — sinon la porte refuse avant tout. */
const RELATION = '11111111-2222-4333-8444-555555555555';

/**
 * UNE BASE FEINTE, TRANSACTIONNELLE, ET QUI SAIT ÉCHOUER EN COURS — le motif
 * d'`administration.test.ts`. Elle n'imite pas PostgreSQL et ne prétend pas le
 * faire : ce qu'elle établit, c'est que les DEUX écritures du rejet partent DANS
 * le corps de la transaction, la suppression d'abord, et que la première est
 * annulée quand la seconde échoue.
 */
function baseFeinte(options: { readonly echouerALInsertion?: boolean } = {}) {
	const journal: string[] = [];
	let dansLaTransaction = false;

	/* Ce que les lectures rendent, dans l'ordre où elles partent : la relation
	   visée, puis l'arbre des dossiers et les droits explicites — deux fois, une
	   par extrémité (`lireIndexDesDroits()`). */
	const files: unknown[][] = [
		[
			{
				cle: RELATION,
				origine: 'ambigue',
				sourceDossier: 'dossier-a',
				cibleDossier: 'dossier-b',
				sourceTitre: 'A',
				cibleTitre: 'B',
				sourceId: 'note-a',
				cibleId: 'note-b',
				typeDeRelationId: 'type-1'
			}
		],
		[],
		[],
		[],
		[]
	];
	let rang = 0;

	const base = {
		select: () => base,
		from: () => base,
		innerJoin: () => base,
		where: () => base,
		limit: () => base,
		then: (suite: (valeur: unknown) => void) => {
			suite(files[rang++] ?? []);
		},
		delete: (table: Parameters<typeof getTableName>[0]) => ({
			where: async () => {
				journal.push(`${dansLaTransaction ? 'tx' : 'hors-tx'}:delete ${getTableName(table)}`);
				return [];
			}
		}),
		insert: (table: Parameters<typeof getTableName>[0]) => ({
			values: () => ({
				onConflictDoNothing: async () => {
					journal.push(`${dansLaTransaction ? 'tx' : 'hors-tx'}:insert ${getTableName(table)}`);
					if (options.echouerALInsertion) throw new Error('échec simulé sur le refus');
					return [];
				}
			})
		}),
		async transaction(corps: (tx: unknown) => Promise<void>) {
			dansLaTransaction = true;
			try {
				await corps(base);
			} finally {
				dansLaTransaction = false;
			}
		}
	};

	return { base: base as unknown as Base, journal };
}

describe('le rejet écrit le refus dans la MÊME transaction', () => {
	it('émet la suppression puis l’insertion, les deux dans la transaction', async () => {
		const feinte = baseFeinte();

		const resultat = await rejeterUneRelation(feinte.base, {
			identite: identiteAuthentifiee('compte-1', 'administrateur'),
			relation: RELATION
		});

		expect(resultat.trouve).toBe(true);
		/* L'ORDRE N'EST PAS UNE PRÉFÉRENCE : la ligne disparaît, puis le refus la
		   remplace. Écrit hors transaction, l'un des deux survivrait à l'autre. */
		expect(feinte.journal).toEqual(['tx:delete relations', 'tx:insert propositions_refusees']);
	});

	it('ANNULE la suppression quand l’écriture du refus échoue', async () => {
		const feinte = baseFeinte({ echouerALInsertion: true });

		await expect(
			rejeterUneRelation(feinte.base, {
				identite: identiteAuthentifiee('compte-1', 'administrateur'),
				relation: RELATION
			})
		).rejects.toThrow('échec simulé');

		/* LE CŒUR DE LA POLARITÉ INVERSE : la suppression est partie, et c'est la
		   transaction qui la reprend. Une relation supprimée sans refus écrit ferait
		   revenir la proposition au clic suivant, sans que rien ne le dise. */
		expect(feinte.journal).toEqual(['tx:delete relations', 'tx:insert propositions_refusees']);
	});
});
