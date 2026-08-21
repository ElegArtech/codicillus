/**
 * L'IDENTITÉ QUE LA COQUILLE AFFICHE — le contrat, écrit à UN SEUL endroit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE RÉPARE
 *
 * `Coquille.svelte` exige une propriété `compte` : nom, initiales, rôle,
 * domaine. Les vues de `src/vues/` la remplissent depuis `MOI` de
 * `seeds/corpus.ts` — c'est le contenu d'exemple du gel, et c'est correct pour
 * le rendu par défaut d'une vue. Mais AUCUNE route ne passait la vraie.
 * Conséquence mesurée le 21/08/2026, sur les huit pages qui montent une
 * coquille : la barre supérieure affiche « Karim Belhadj — Référent —
 * Infrastructure » quel que soit le compte connecté.
 *
 * Le même oubli cachait la console : `socle.css:397` pose
 * `.app:not([data-role="admin"]) .si-admin { display: none !important; }`, et
 * `Coquille.svelte` retombait sur `role = 'referent'`. L'entrée « Console
 * d'administration » était donc invisible à l'administrateur lui-même.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UN CONTEXTE, ET NON UNE PROPRIÉTÉ DE PLUS
 *
 * Trente `+page.svelte` devraient recopier le même passage. Recopié trente
 * fois, un contrat diverge au premier oubli — `P-35`, et le défaut se lirait
 * comme une identité juste sur une page et fausse sur la voisine. Le gabarit
 * racine le pose une fois, la coquille le lit.
 *
 * LE RENDU PAR DÉFAUT DES VUES NE BOUGE PAS. Hors application — un rendu de
 * vue sans gabarit racine —, `getContext` rend `undefined` et la coquille
 * retombe sur sa propriété. C'est ce qui garde le gel intact.
 */

/** La clé du contexte. Une constante, jamais une chaîne recopiée. */
export const CLE_IDENTITE = Symbol.for('codicillus.identite-de-coquille');

/** Ce que la barre supérieure affiche du compte connecté. */
export interface CompteAffiche {
	readonly nom: string;
	readonly initiales: string;
	readonly role: string;
	readonly domaine: string;
}

/** Un univers, tel que le rail de navigation le nomme. */
export interface UniversDeRail {
	readonly nom: string;
	readonly couleur: string;
	readonly glyphe: string;
	readonly ordre: number;
	readonly systeme: boolean;
	readonly description: string;
}

/** Un domaine, rattaché à son univers par le nom. */
export interface DomaineDeRail {
	readonly nom: string;
	readonly univers: string;
	readonly couleur: string;
}

/**
 * Le contexte lui-même. Tous les membres sont des accesseurs : le gabarit
 * racine les câble sur `data`, et la coquille suit une navigation sans qu'on
 * réémette le contexte.
 *
 * `univers` et `domaines` réparent le MÊME défaut que `compte` : le rail de
 * navigation était bâti sur les constantes de `seeds/corpus.ts`, et aucune route
 * ne passait les vraies. Un univers créé dans la console n'apparaissait donc
 * JAMAIS dans le rail — mesuré le 21/08/2026, l'univers « Organisation » était
 * absent des quatre sections rendues alors qu'il portait quatorze notes.
 */
export interface IdentiteDeCoquille {
	readonly compte: CompteAffiche | null;
	readonly administrateur: boolean;
	readonly univers: readonly UniversDeRail[];
	readonly domaines: readonly DomaineDeRail[];
}
