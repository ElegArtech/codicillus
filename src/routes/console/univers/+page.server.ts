/**
 * `/console/univers` — LE CHARGEUR de V-27.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES DE CONSOLE : `resoudreLaConsole()` la prend, une
 * fois pour toutes, et un non-administrateur reçoit 404 V-26 — pas un refus, parce que
 * la console n'apparaît pas dans la navigation des autres profils (`P-09`) et que
 * `RG-ACC-04` interdit que l'accès direct l'apprenne davantage. Le seul `error(404, …)`
 * est SANS MESSAGE : un message entrerait dans le corps rendu (`ADR-007`).
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI : le rôle est éprouvé par `resolution.ts`,
 * appelé par `consoles.ts` — voir son en-tête pour le motif du détour par
 * `perimetreDeLecture()` plutôt qu'une comparaison de rôle recopiée.
 *
 * `univers`, `domaines` et `compte` SONT REQUISES : `svelte-check` refuse une rédaction
 * qui en oublierait une. `instance` RESTE AU DÉFAUT, la version du produit n'étant
 * portée par aucune table du schéma. `vecteur: null` demande l'état au repos : les
 * positions des axes « Formulaire » et « Suppression » sont des états d'INTERACTION.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { creerUnUnivers, modifierUnUnivers, supprimerUnUnivers } from '$lib/donnees/administration';
import {
	CHAMP_COULEUR,
	CHAMP_DESCRIPTION,
	CHAMP_GLYPHE,
	CHAMP_NOM,
	CHAMP_POSITION,
	CHAMP_UNIVERS_CIBLE,
	rangDuChamp,
	texteDuChamp
} from '$lib/console/structure';
import {
	accesALaConsole,
	contexteDeRequete,
	lireLesDesignationsDUnivers,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		vecteur: null,
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		designations: await lireLesDesignationsDUnivers(base)
	};
};

/**
 * LA GARDE DES ACTIONS, ET ELLE N'EST PAS CELLE DU CHARGEUR PAR HASARD.
 *
 * `accesALaConsole()` est le prédicat unique des onze adresses — celui que
 * `resoudreLaConsole()` interroge lui-même. L'action ne passe pas par la
 * résolution complète parce qu'elle n'a pas besoin des notes ; elle passe par le
 * MÊME prédicat, et rend le MÊME `error(404, MESSAGE_INTROUVABLE)` sans message.
 * `P-09` demande que l'action interdite ne soit pas rendue ; cela ne dispense
 * jamais de la refuser ici.
 */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN UNIVERS — `RG-M14-01`.
	 *
	 * Le champ `univers` porte l'IDENTIFIANT LISIBLE, celui du segment d'adresse
	 * `/univers/{univers}`. Le gel désigne l'univers par son nom dans une fermeture
	 * et n'expose aucun nom de champ : celui-ci est DÉRIVÉ de l'adressage du
	 * produit, pas inventé.
	 *
	 * LES DEUX REFUS NE SONT PAS DES ERREURS DE CLIENT, ce sont les états que le
	 * dialogue de V-27 rend. Ils sortent en `fail`, donc avec leur décompte et leur
	 * sortie proposée, jamais en exception.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		/* `RG-NF-05` — L'IDENTITÉ DESCEND JUSQU'À LA TRANSACTION QUI DÉTRUIT. Elle
		   s'arrêtait ici : `supprimerUnUnivers(base, identifiant)` n'avait pas de
		   paramètre où la mettre, et aucune ligne de la base ne disait qui avait
		   détruit quoi. `consoleOuverte()` a déjà refusé tout appelant sans droit. */
		const resultat = await supprimerUnUnivers(
			basePartagee(),
			String(champs.get('univers') ?? ''),
			locals.identite
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * CRÉER UN UNIVERS — `RG-STR-01`.
	 *
	 * LES CINQ CHAMPS SONT CEUX DU PANNEAU, et leurs noms viennent de
	 * `$lib/console/structure.ts` — le contrat que la vue, cette page et cette
	 * action lisent au même endroit (`P-35`).
	 *
	 * LE REFUS N'EST PAS UNE PANNE, c'est un ÉTAT de l'écran : le bloc `#erreur-nom`
	 * est révélé sur un nom vide ou déjà pris. Il sort en `fail(400, …)` avec son
	 * message rattaché au champ.
	 */
	creer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await creerUnUnivers(basePartagee(), {
			nom: texteDuChamp(champs, CHAMP_NOM) ?? '',
			description: texteDuChamp(champs, CHAMP_DESCRIPTION) ?? '',
			couleur: texteDuChamp(champs, CHAMP_COULEUR) ?? '',
			glyphe: texteDuChamp(champs, CHAMP_GLYPHE) ?? '',
			ordre: rangDuChamp(champs, CHAMP_POSITION) ?? Number.POSITIVE_INFINITY
		});
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * ENREGISTRER UN UNIVERS — et il porte DEUX gestes de l'écran, pas un.
	 *
	 * « Enregistrer » transmet les cinq champs du panneau ; « Monter » et
	 * « Descendre » ne transmettent QUE `f-position`. D'où la lecture facultative
	 * champ par champ : un champ absent n'est pas un champ vide, et
	 * `modifierUnUnivers()` ne touche que ce qui lui est transmis. Deux actions pour
	 * un même verbe auraient fait deux définitions du même geste.
	 */
	enregistrer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const nom = texteDuChamp(champs, CHAMP_NOM);
		const description = texteDuChamp(champs, CHAMP_DESCRIPTION);
		const couleur = texteDuChamp(champs, CHAMP_COULEUR);
		const glyphe = texteDuChamp(champs, CHAMP_GLYPHE);
		const ordre = rangDuChamp(champs, CHAMP_POSITION);

		const resultat = await modifierUnUnivers(
			basePartagee(),
			texteDuChamp(champs, CHAMP_UNIVERS_CIBLE) ?? '',
			{
				...(nom === undefined ? {} : { nom }),
				...(description === undefined ? {} : { description }),
				...(couleur === undefined ? {} : { couleur }),
				...(glyphe === undefined ? {} : { glyphe }),
				...(ordre === undefined ? {} : { ordre })
			}
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
