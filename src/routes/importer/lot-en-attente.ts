/**
 * LE LOT DÉPOSÉ AILLEURS, ET REPRIS ICI — le chaînon entre V-35 et V-24. Le gel de V-35
 * notifie « Lot reçu — parcours d'import à l'étape du choix de scénario, vue V-24 » : le
 * lot est REÇU, la destination est V-24, et l'étape d'arrivée est celle du CHOIX DE
 * SCÉNARIO — l'étape 1, pas l'étape 2 où V-24 pose sa propre zone de dépôt.
 *
 * POURQUOI UNE VARIABLE DE MODULE, ET RIEN D'AUTRE : `goto()` est une navigation CLIENT,
 * le graphe de modules survit, et un `File` avec lui. L'ADRESSE NE PORTE RIEN, et c'est
 * déjà tranché — « un parcours qui porte des fichiers déposés n'est pas restaurable depuis
 * une adresse ». LE LOT SE REPREND UNE FOIS : `reprendreLotEnAttente()` vide la réserve.
 *
 * RIEN N'EST ÉCRIT AU SERVEUR. La garde de `browser` interdit qu'une réserve s'y installe :
 * une variable de module y serait PARTAGÉE entre les requêtes de tous les appelants, ce
 * qui ferait voyager le lot d'un compte vers un autre.
 */
import { browser } from '$app/environment';

let enAttente: readonly File[] = [];

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
