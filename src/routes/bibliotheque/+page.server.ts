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
 * LES SEPT SOURCES SONT SERVIES, ET C'EST CE QUI SORT LE CORPUS DU PAQUET
 *
 * Il n'en servait que quatre. Les trois autres — l'état de l'instance, le flux
 * d'activité, les types de note — restaient à leur défaut, et ce défaut était
 * une constante de `seeds/corpus.ts` IMPORTÉE EN VALEUR : les trente-deux notes
 * du jeu partaient dans le chunk de cette page, 57 Ko servis comme fichier
 * statique, atteignables même par qui reçoit 404 sur l'adresse. Les sept
 * propriétés de `V-41` sont désormais EXIGÉES ; l'import en valeur a disparu, et
 * le chargeur qui en oublierait une ne compilerait plus.
 *
 * CE QUI RESTE UN ÉCART, ET IL FAUT LE DIRE PRÉCISÉMENT. La vue choisit ses
 * trois notes-échantillons du témoin de fraîcheur par `notes.find(…)` — LA
 * PREMIÈRE note de chaque niveau DANS L'ORDRE REÇU. Or `lireNotes()` ordonne par
 * identifiant, quand le jeu de semence portait l'ordre de la maquette : l'ordre
 * du jeu n'a aucune contrepartie en base — aucune colonne de rang sur `notes` —
 * et les trois échantillons affichés ici ne sont donc pas ceux du gel. Ce n'est
 * PAS une valeur illustrative : ce sont trois vraies notes de la base, à chaque
 * fois la première de son niveau.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireLActivite } from '$lib/donnees/accueil';
import { contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import { lireTypesDeNote } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		/* LA CHRONOLOGIE MONTRE LE FLUX RÉEL DU PÉRIMÈTRE. Elle affichait
		   « Karim Belhadj — verification » et « Sophie Nguyen — edition », les
		   quatre premiers événements du jeu de démonstration, sur toute instance.
		   Sans trace, elle est vide — et une chronologie vide dit la vérité. */
		activite: await lireLActivite(
			base,
			acces.ressource.notes.map((n) => n.id),
			new Date()
		),
		/* LE SÉLECTEUR D'EXEMPLE LISTE LES TYPES DU RÉFÉRENTIEL, pas les cinq du
		   jeu : c'est un composant de démonstration typographique, mais ses
		   options sont de vraies valeurs, et une instance qui a renommé ses types
		   doit les voir ici. */
		typesNote: await lireTypesDeNote(base)
	};
};
