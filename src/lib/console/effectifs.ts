/**
 * LES COMPTEURS DE LA CONSOLE — sept pastilles, et elles disaient le gel.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE RÉPARE
 *
 * `GROUPES_DE_CONSOLE` (`sections.ts`) porte un `compte` par section, et ces
 * sept nombres sont dérivés de `seeds/corpus.ts` — `UNIVERS.length`,
 * `DOMAINES.length`, `Object.keys(TYPES_FICHE).length`… C'est correct pour le
 * rendu par défaut d'une vue : le banc de comparaison doit retrouver le gel au
 * pixel. Ce ne l'est plus dès qu'une adresse sert la page.
 *
 * Mesuré le 22/08/2026, sur une base MIGRÉE ET VIDE — zéro univers, zéro
 * domaine, zéro note, l'état d'une installation neuve : les dix écrans de
 * console annonçaient « Univers (3) · Domaines (4) · Types de fiches (3) ·
 * Types de relations (6) · Templates (4) · Comptes (4) · Imports (1) ». Sept
 * nombres, tous faux, et faux de la manière la plus coûteuse : ils décrivent
 * un corpus de démonstration à quelqu'un qui regarde SON instance.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UN CONTEXTE, ET NON UNE PROPRIÉTÉ DE PLUS
 *
 * Même motif que `$lib/coquille/identite.ts`, et il n'est pas recopié ici par
 * commodité : `aside.nav2` est rendu par `NavigationConsole.svelte`, que six
 * vues montent et que `CoquilleDeConsole.svelte` monte pour les autres. Faire
 * descendre sept nombres par propriété, c'est le même passage recopié dans dix
 * `+page.svelte` et six vues — un contrat recopié seize fois diverge au premier
 * oubli (`P-35`), et le défaut se lirait comme un compteur juste sur un écran
 * et faux sur le voisin.
 *
 * `/console/+layout.svelte` le pose une fois, la navigation le lit.
 *
 * LE RENDU PAR DÉFAUT DES VUES NE BOUGE PAS. Hors application — une vue rendue
 * sans gabarit —, `getContext` rend `undefined`, `GROUPES_DE_CONSOLE`
 * s'applique tel quel, et le gel garde ses sept nombres.
 *
 * LA PRÉSENCE DU CONTEXTE DÉCIDE, PAS SON CONTENU — la leçon que
 * `Coquille.svelte` a déjà payée sur le rail. Une instance à zéro univers n'est
 * pas une absence de donnée : elle affiche zéro.
 */
import { GROUPES_DE_CONSOLE, type CleDeSection, type GroupeDeSections } from './sections';

/** La clé du contexte. Une constante, jamais une chaîne recopiée. */
export const CLE_EFFECTIFS = Symbol.for('codicillus.effectifs-de-console');

/**
 * Ce que la base porte, section par section.
 *
 * SIX MEMBRES, ET TOUS OBLIGATOIRES. Les quatre sections absentes le sont pour
 * deux raisons distinctes, et il faut les tenir distinctes :
 *
 *   · Exports, Analytique et Configuration NE PORTENT PAS DE PASTILLE au gel
 *     (`section.compte` non défini dans `GROUPES_DE_CONSOLE`) ; leur en donner
 *     une ajouterait un nœud que la maquette ne dessine pas ;
 *   · Imports en porte une, mais AUCUNE TABLE ne la nourrit — le journal
 *     d'imports du gel n'a pas de nœud en base. Elle se rend donc à zéro, ce
 *     qui est la seule valeur vraie d'une instance qui n'a rien importé.
 *
 * Les six membres sont obligatoires parce qu'un compteur manquant serait un
 * compteur silencieusement à zéro : le typage force le chargeur à les fournir
 * tous les six, et un septième ajouté demain ne compilera pas sans sa lecture.
 */
export interface EffectifsDeConsole {
	readonly univers: number;
	readonly domaines: number;
	readonly fiches: number;
	readonly relations: number;
	readonly templates: number;
	readonly comptes: number;
}

/**
 * Le catalogue du gel, ses compteurs remplacés par ceux de la base.
 *
 * UNE SECTION SANS PASTILLE N'EN REÇOIT PAS. `section.compte === undefined`
 * distingue « la maquette ne compte rien ici » de « la base compte zéro », et
 * les deux ne se rendent pas pareil : la première n'affiche aucun `span.nav2__n`,
 * la seconde en affiche un qui porte `0`.
 *
 * UN COMPTEUR NON FOURNI VAUT ZÉRO, il ne retombe pas sur le gel. C'est le
 * point de tout le module : servir le nombre des maquettes à une instance
 * réelle est précisément le défaut réparé.
 */
export function groupesAvecEffectifs(effectifs: EffectifsDeConsole): readonly GroupeDeSections[] {
	/* La table est indexée par clé de section pour que la boucle n'ait pas dix
	   branches. Les quatre clés absentes ressortent à `undefined`, donc à zéro —
	   et seules les trois sections sans pastille échappent à la substitution,
	   par le test qui précède. */
	const mesures: Partial<Record<CleDeSection, number>> = effectifs;

	return GROUPES_DE_CONSOLE.map((groupe) => ({
		nom: groupe.nom,
		sections: groupe.sections.map((section) =>
			section.compte === undefined ? section : { ...section, compte: mesures[section.cle] ?? 0 }
		)
	}));
}
