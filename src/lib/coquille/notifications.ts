/**
 * Le vocabulaire de la famille des notifications — A-8 de l'inventaire fermé
 * (`docs/DESIGN.md` §2.A).
 *
 * CE FICHIER N'EXISTE QUE PARCE QUE LA FAMILLE A DEUX ÉTATS GELÉS, ET NON UN.
 * Les types vivaient dans `Coquille.svelte`, qui était le seul à rendre la
 * pile. V-06 la rend aussi, sans coquille : le vocabulaire commun ne peut plus
 * appartenir au gabarit. `Coquille.svelte` le réexporte, de sorte que les
 * imports de V-37 et de V-38 sont inchangés.
 *
 * ARB-028 — voir `PileDeNotifications.svelte` pour la divergence elle-même.
 */

/** Les quatre types de notification du catalogue V-38, et rien d'autre. */
export type TypeNotification = 'succes' | 'erreur' | 'info' | 'encours';

/**
 * Une notification visible à l'instant rendu.
 *
 * La forme est celle de `window.notifier()` de la maquette gelée
 * (`V-38-notifications.html:2263`) : titre, détail facultatif, actions
 * facultatives, avancement facultatif pour le seul type « en cours ».
 * `duree` n'y figure PAS : l'effacement automatique est du comportement,
 * pas un état (ARB-011, RG-M18-02, à reprendre par T-017).
 */
export interface Notification {
	readonly type: TypeNotification;
	readonly titre: string;
	readonly detail?: string;
	/** Les libellés des boutons d'action. Leur effet relève de T-017. */
	readonly actions?: readonly string[];
	/** Avancement figé, en pourcentage — un instant, jamais un film (ARB-011). */
	readonly progres?: number;
}

/**
 * LA VARIANTE DÉCLARÉE D'ARB-028 — les deux états gelés de la famille.
 *
 *   `catalogue` — l'état gelé de `mockups/V-38-notifications.html`, celui que
 *                 le socle applicatif porte (`src/socle.css` §9, extrait de
 *                 V-07). Bulle en grille, plafonnée à 400 px, glyphe de type,
 *                 titre, détail, fermeture, actions, avancement.
 *
 *   `texte`     — l'état gelé de `mockups/V-06-reinitialisation.html` §9. Bulle
 *                 en `flex`, NON BORNÉE, sans aucun enfant : le `notifier()` de
 *                 V-06 (`V-06:830`) pose `n.textContent = txt` et rien d'autre.
 *
 * Une variante n'est pas un goût : c'est un gel. Aucune troisième valeur ne
 * s'ajoute ici sans une maquette qui la montre.
 */
export type VarianteDeNotification = 'catalogue' | 'texte';
