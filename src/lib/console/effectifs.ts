/**
 * LES COMPTEURS DE LA CONSOLE — huit pastilles, servies par la base.
 *
 * `GROUPES_DE_CONSOLE` portait un `compte` par section dérivé de `seeds/corpus.ts` :
 * sur une base migrée et VIDE, les écrans de console annonçaient « Univers (3) ·
 * Domaines (4) · Types de fiches (3) … », des nombres décrivant un corpus de
 * démonstration à quelqu'un qui regarde SON instance.
 *
 * UN CONTEXTE, ET NON UNE PROPRIÉTÉ DE PLUS : `aside.nav2` est rendu par
 * `NavigationConsole.svelte`, que six vues montent et que `CoquilleDeConsole.svelte`
 * monte pour les autres. Faire descendre huit nombres par propriété serait le même
 * passage recopié dans dix `+page.svelte` et six vues — un contrat recopié seize fois
 * diverge au premier oubli (`P-35`). `/console/+layout.svelte` le pose une fois, la
 * navigation le lit.
 *
 * HORS APPLICATION, `getContext` rend `undefined` et le catalogue nu s'applique : ses
 * huit compteurs valent ZÉRO. LA PRÉSENCE DU CONTEXTE DÉCIDE, PAS SON CONTENU — une
 * instance à zéro univers n'est pas une absence de donnée, elle affiche zéro.
 */
import { groupesDeConsole, type CleDeSection, type GroupeDeSections } from './sections';
import type { VocabulaireRendu } from '../vocabulaire';

/** La clé du contexte. Une constante, jamais une chaîne recopiée. */
export const CLE_EFFECTIFS = Symbol.for('codicillus.effectifs-de-console');

/**
 * Ce que la base porte, section par section.
 *
 * HUIT MEMBRES, ET TOUS OBLIGATOIRES. Les trois sections absentes le sont pour une
 * seule raison : Exports, Analytique et Configuration NE PORTENT PAS DE PASTILLE au
 * gel, et leur en donner une ajouterait un nœud que la maquette ne dessine pas.
 * `imports` en portait une qu'aucune table ne nourrissait, et qui se rendait donc à
 * zéro sur une instance qui avait reçu des lots ; `lots_d_import` la nourrit depuis la
 * migration `009`.
 *
 * Les huit sont obligatoires parce qu'un compteur manquant serait un compteur
 * silencieusement à zéro : un neuvième ajouté demain ne compilera pas sans sa lecture.
 */
export interface EffectifsDeConsole {
	readonly univers: number;
	readonly domaines: number;
	/** `types_de_note` — la nomenclature des notes, jamais celle des fiches. */
	readonly notes: number;
	readonly fiches: number;
	readonly relations: number;
	readonly templates: number;
	readonly comptes: number;
	/** `RG-M12-09` — les lots d'import du journal, tous conservés. */
	readonly imports: number;
}

/**
 * Le catalogue, ses compteurs remplacés par ceux de la base.
 *
 * LE VOCABULAIRE TRAVERSE, il n'est pas relu ici : `groupesDeConsole()` en a besoin
 * pour le libellé « Types de fiches », et ce module n'est pas un composant.
 *
 * UNE SECTION SANS PASTILLE N'EN REÇOIT PAS : `section.compte === undefined`
 * distingue « la maquette ne compte rien ici » de « la base compte zéro » — la
 * première n'affiche aucun `span.nav2__n`, la seconde en affiche un qui porte `0`.
 *
 * UN COMPTEUR NON FOURNI VAUT ZÉRO, il ne retombe sur rien.
 */
export function groupesAvecEffectifs(
	vocabulaire: VocabulaireRendu,
	effectifs: EffectifsDeConsole
): readonly GroupeDeSections[] {
	/* La table est indexée par clé de section pour que la boucle n'ait pas dix
	   branches. Les quatre clés absentes ressortent à `undefined`, donc à zéro —
	   et seules les trois sections sans pastille échappent à la substitution,
	   par le test qui précède. */
	const mesures: Partial<Record<CleDeSection, number>> = effectifs;

	return groupesDeConsole(vocabulaire).map((groupe) => ({
		nom: groupe.nom,
		sections: groupe.sections.map((section) =>
			section.compte === undefined ? section : { ...section, compte: mesures[section.cle] ?? 0 }
		)
	}));
}
