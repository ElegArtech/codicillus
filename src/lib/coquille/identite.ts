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

/**
 * Le contexte lui-même. Les deux membres sont des accesseurs : le gabarit
 * racine les câble sur `data`, et la coquille suit une navigation sans qu'on
 * réémette le contexte.
 */
export interface IdentiteDeCoquille {
	readonly compte: CompteAffiche | null;
	readonly administrateur: boolean;
}
