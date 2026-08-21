/**
 * LE LOT DÉPOSÉ AILLEURS, ET REPRIS ICI — le chaînon qui manquait entre V-35 et
 * V-24.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE GEL DEMANDE, ET POURQUOI IL FALLAIT CE MODULE
 *
 * `mockups/V-35-console-imports.html:3000` — la zone de dépôt de la console
 * notifie, mot pour mot :
 *
 *     « Lot reçu — parcours d'import à l'étape du choix de scénario, vue V-24 »
 *
 * TROIS FAITS SONT DANS CETTE PHRASE. Le lot est REÇU — donc les fichiers sont
 * pris, pas seulement comptés. La destination est V-24. Et l'étape d'arrivée est
 * celle du CHOIX DE SCÉNARIO, c'est-à-dire l'étape 1 — pas l'étape 2, où V-24
 * pose sa propre zone de dépôt.
 *
 * Le parcours de V-24 ne retenait des fichiers qu'à l'étape 2 : un lot qui
 * arrive à l'étape 1 n'avait donc nulle part où attendre le scénario, et les
 * octets restaient en route. `src/routes/console/imports/+page.svelte` le
 * disait de lui-même — « LES OCTETS NE TRAVERSENT PAS ». C'est ce que ce module
 * ferme, et il le ferme du côté que le gel désigne : le lot attend, le scénario
 * se choisit ensuite.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UNE VARIABLE DE MODULE, ET RIEN D'AUTRE
 *
 * `goto()` est une navigation CLIENT : le graphe de modules survit, et un
 * `File` avec lui. Rien n'est sérialisé, rien ne transite par le réseau, rien
 * n'est écrit sur le disque — les octets ne quittent le navigateur qu'au moment
 * où l'étape 2 les envoie à l'action `analyser`, comme n'importe quel dépôt.
 *
 * L'ADRESSE NE PORTE RIEN, et c'est déjà tranché : `docs/routes.md:297` —
 * « un parcours qui porte des fichiers déposés n'est pas restaurable depuis une
 * adresse ». Un rechargement de `/importer` perd donc le lot, et rend l'étape 1
 * vierge. C'est la propriété que la source décrit, pas une limite qu'on subit.
 *
 * LE LOT SE REPREND UNE FOIS. `reprendreLotEnAttente()` vide la réserve : un lot
 * déposé est remis au parcours qui s'ouvre, et à lui seul. Sans quoi un retour
 * ultérieur sur `/importer` ressusciterait des fichiers que l'utilisateur
 * croyait consommés.
 *
 * RIEN N'EST ÉCRIT AU SERVEUR. Le rendu serveur charge ce module comme tout
 * autre, et la garde de `browser` interdit qu'une réserve s'y installe : une
 * variable de module y serait PARTAGÉE entre les requêtes de tous les
 * appelants, ce qui ferait voyager le lot d'un compte vers un autre. Aucun
 * chemin n'appelle `deposerLotEnAttente()` hors du navigateur, mais une fuite de
 * cette nature ne se laisse pas à la discipline.
 */
import { browser } from '$app/environment';

/** Le lot en attente. Vide quand rien n'attend, ce qui est le cas ordinaire. */
let enAttente: readonly File[] = [];

/** Confie un lot au parcours d'import qui va s'ouvrir. */
export function deposerLotEnAttente(fichiers: readonly File[]): void {
	if (!browser) return;
	enAttente = fichiers;
}

/** Reprend le lot confié, et vide la réserve. Rend un tableau vide s'il n'y en a pas. */
export function reprendreLotEnAttente(): readonly File[] {
	const pris = enAttente;
	enAttente = [];
	return pris;
}
