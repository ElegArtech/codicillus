/**
 * LE CATALOGUE DES SIX MODULES — un référentiel du PRODUIT, pas du jeu.
 *
 * Les CLÉS actives d'un domaine viennent de la base : `modules_de_domaine` (`RG-STR-06`).
 * Leurs LIBELLÉS, eux, ne sont dans aucune table — ce sont les noms que le produit donne à ses
 * propres fonctions. Ils vivaient dans `seeds/corpus.ts`, et les vues les prenaient en DÉFAUT
 * DE PROPRIÉTÉ : une route qui oubliait de les passer servait le catalogue du jeu de
 * démonstration sans que rien ne proteste.
 *
 * LE TYPE EST CELUI DE L'ORIGINE, jamais recopié : `CleDeModule` gouverne l'énumération
 * `module_de_domaine` de `$lib/base/schema.ts`. Une clé ajoutée là-bas rend ce catalogue
 * incomplet, et le compilateur le dit.
 */
import type { CleDeModule, Module } from '../../../seeds/corpus';

/** Les six modules activables sur un domaine, dans l'ordre de `RG-STR-06`. */
export const CATALOGUE_DE_MODULES: Record<CleDeModule, Module> = {
	notes: { nom: 'Notes', sous: 'Toutes les notes du domaine' },
	dossiers: { nom: 'Dossiers', sous: 'Rangement arborescent' },
	fiches: { nom: 'Fiches', sous: 'Objets typés et leurs relations' },
	cartographie: { nom: 'Cartographie', sous: 'Graphe des dépendances' },
	signets: { nom: 'Signets', sous: 'Liens web curatés' },
	carteMentale: { nom: 'Carte mentale', sous: 'Arbre dépliable du domaine' }
};

/**
 * LE LIBELLÉ D'UNE CLÉ, SANS DÉRÉFÉRENCEMENT AVEUGLE. `modules[m].nom` mettait le rendu en
 * erreur sur une clé stockée que le catalogue ne porte pas — une énumération élargie en base
 * avant que le catalogue ne suive. Une clé inconnue se nomme alors par elle-même plutôt que de
 * faire sortir l'écran en 500.
 */
export function libelleDeModule(catalogue: Record<CleDeModule, Module>, cle: string): Module {
	return catalogue[cle as CleDeModule] ?? { nom: cle, sous: '' };
}
