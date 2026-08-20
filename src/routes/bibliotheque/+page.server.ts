/**
 * `/bibliotheque` — LE CHARGEUR de V-41, la bibliothèque de composants.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ELLE N'EST PAS DANS LA CONSOLE, ET ELLE EN PARTAGE LE RÔLE
 *
 * `ARB-002`, transcrit par `docs/routes.md` §3.7 : « la console y RENVOIE, elle
 * ne la CONTIENT pas ». L'adresse est au premier niveau, et le constat de
 * maquette tranche — les vues de console rendent un fil en trois segments
 * commençant par « Console », les quatre vues de bibliothèque en rendent deux
 * (`V-41:5069`). Y ajouter un segment n'aurait rien protégé de plus et aurait
 * contredit quatre maquettes gelées.
 *
 * LE RÔLE, LUI, EST BIEN L'ADMINISTRATEUR : « 404 V-26 pour tout non-
 * administrateur (RG-ACC-04, ADR-007) », et l'entrée n'apparaît pour aucun autre
 * rôle (`P-09`). La garde est donc la même que celle des dix adresses de
 * console, prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts` ; le
 * seul `error(404, MESSAGE_INTROUVABLE)` du fichier est SANS MESSAGE (`ADR-007`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * C'EST UNE PAGE RÉELLE, ET C'EST LE POINT
 *
 * `STACK-TECHNIQUE.md` §4.1 en fait une page de l'application pour parer le
 * risque `R-06` : c'est là que toute dérive du système visuel devient visible
 * immédiatement. Une maquette morte n'aurait pas cette propriété — d'où le
 * chargeur, qui la nourrit des notes de la base comme n'importe quelle page.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE CHARGEUR NE FAIT PAS, ET IL FAUT LE DIRE PRÉCISÉMENT
 *
 * Il ne touche pas `src/vues/V-41.svelte`, qui importe `ACTIVITE`, `UNIVERS`,
 * `DOMAINES`, `MOI` et `INSTANCE` au niveau du module (`V-41:93`). Et la vue
 * choisit ses trois notes-échantillons du témoin de fraîcheur par
 * `notes.find(…)` (`V-41:141`) — LA PREMIÈRE note de chaque niveau DANS L'ORDRE
 * REÇU. Or `lireNotes()` de `T-030` ordonne par identifiant, quand le jeu de
 * semence porte l'ordre de la maquette : l'ordre du jeu n'a aucune contrepartie
 * en base — aucune colonne de rang sur `notes` — et les trois échantillons
 * affichés ici ne sont donc pas ceux du gel. Ce n'est PAS une valeur
 * illustrative : ce sont trois vraies notes de la base, à chaque fois la
 * première de son niveau. Le banc n'atteint pas cette route et ne le voit pas ;
 * écart déclaré au rapport du lot.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return { notes: acces.ressource.notes };
};
