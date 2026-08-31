/**
 * `/bibliotheque` — LE CHARGEUR de V-41, la bibliothèque de composants.
 *
 * ELLE N'EST PAS DANS LA CONSOLE, ET ELLE EN PARTAGE LE RÔLE. `ARB-002` : « la console y
 * RENVOIE, elle ne la CONTIENT pas ». Le rôle est bien l'ADMINISTRATEUR : 404 V-26 pour
 * tout autre (`RG-ACC-04`, `ADR-007`, `P-09`), garde prise par `resoudreLaConsole()`.
 *
 * C'EST UNE PAGE RÉELLE, ET C'EST LE POINT : `STACK-TECHNIQUE.md` §4.1 en fait une page
 * de l'application pour parer `R-06`, et les notes viennent donc de la base.
 *
 * LES SEPT PROPRIÉTÉS DE V-41 SONT EXIGÉES : trois restaient à leur défaut, une constante
 * de `seeds/corpus.ts` IMPORTÉE EN VALEUR — les trente-deux notes du jeu partaient dans
 * le chunk de cette page, atteignables même par qui reçoit 404. ÉCART DÉCLARÉ : la vue
 * choisit ses trois notes-échantillons par `notes.find(…)`, LA PREMIÈRE de chaque niveau
 * DANS L'ORDRE REÇU, et `lireNotes()` ordonne par identifiant.
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
