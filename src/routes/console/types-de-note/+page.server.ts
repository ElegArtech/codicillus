/**
 * `/console/types-de-note` — LA NOMENCLATURE DES NOTES, ADMINISTRABLE. `RG-REF-03` :
 * « un type de note ne peut être supprimé s'il est utilisé ; une réaffectation est
 * proposée. »
 *
 * ELLE NE L'ÉTAIT NULLE PART. Les cinq types venaient d'un `INSERT` de
 * `base/migrations/007_types_de_note.montee.sql`, et aucune adresse ne les gérait : ni
 * ajout, ni renommage, ni retrait. Une règle qui n'a pas d'écran où se tenir n'est pas
 * tenue.
 *
 * CE N'EST PAS `/console/types-de-fiches`. Deux nomenclatures, deux tables — `types_de_note`
 * ici, `types_de_fiche` là-bas —, et le vocabulaire ne se croise à aucune ligne : ni à
 * l'écran, ni dans le nom du fichier, ni dans l'adresse.
 *
 * LA GARDE EST CELLE DES AUTRES ADRESSES DE CONSOLE : `resoudreLaConsole()` la prend, et un
 * non-administrateur reçoit 404 — pas un refus (`P-09`, `RG-ACC-04`). Les `error(404, …)`
 * sont SANS MESSAGE (`ADR-007`).
 *
 * `typesDeNote` est une propriété REQUISE de la page : elle vient de la base, avec son
 * décompte d'emploi — celui-là même qui décide si une suppression est refusée.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { moteurPartage } from '$lib/recherche/acces';
import { accesALaConsole, contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import {
	creerUnTypeDeNote,
	modifierUnTypeDeNote,
	supprimerUnTypeDeNote
} from '$lib/donnees/administration';
import {
	CHAMP_NOM,
	CHAMP_TYPE_DE_NOTE_CIBLE,
	CHAMP_TYPE_DE_NOTE_DACCUEIL,
	texteDuChamp
} from '$lib/console/structure';
import { lireLesTypesDeNoteAdministrables } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		notes: acces.ressource.notes,
		typesDeNote: await lireLesTypesDeNoteAdministrables(base)
	};
};

/** La garde des adresses de console, appliquée à l'action — voir `/console/univers`. */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	creer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await creerUnTypeDeNote(basePartagee(), {
			nom: texteDuChamp(champs, CHAMP_NOM) ?? ''
		});
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	enregistrer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await modifierUnTypeDeNote(
			basePartagee(),
			moteurPartage(),
			texteDuChamp(champs, CHAMP_TYPE_DE_NOTE_CIBLE) ?? '',
			{ nom: texteDuChamp(champs, CHAMP_NOM) ?? '' }
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * SUPPRIMER UN TYPE DE NOTE — `RG-REF-03`.
	 *
	 * `vers` N'EST PAS FACULTATIF QUAND LE TYPE EST EMPLOYÉ : sans lui, le geste rend
	 * `refus-employe` avec ses deux nombres, et l'écran l'affiche. Il n'y a pas de
	 * seconde sortie — la règle ne propose que la réaffectation, et rien ici ne
	 * supprime une note.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const vers = texteDuChamp(champs, CHAMP_TYPE_DE_NOTE_DACCUEIL);
		const resultat = await supprimerUnTypeDeNote(basePartagee(), moteurPartage(), {
			type: texteDuChamp(champs, CHAMP_TYPE_DE_NOTE_CIBLE) ?? '',
			...(vers === undefined ? {} : { vers })
		});
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
