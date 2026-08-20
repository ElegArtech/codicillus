/**
 * `/console/configuration` — LE CHARGEUR de V-33.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS, ET `P-01` EN DÉPEND. Il ne touche pas
 * `src/vues/V-33.svelte`, qui importe `CONFIG` et `CORPUS` au niveau du module
 * (`V-33:93`) : les seuils de fraîcheur AFFICHÉS sont ceux du jeu de semence.
 * La base les porte — table `parametres`, lus par `lireSeuils()` de `T-030` —
 * et ce sont eux que le PRODUIT applique, puisque `contexteDeRequete()` les
 * passe à `lireNotes()`. Les deux coïncident aujourd'hui parce que la base a été
 * semée depuis le jeu ; le jour où un administrateur les changerait, l'écran qui
 * les règle afficherait autre chose que ce que le produit applique. C'est le
 * plus contrariant des écarts de ce lot, et il est déclaré au rapport.
 *
 * `vecteur: null` demande l'état au repos — les quatre positions de l'axe
 * « Seuils » sont des états de SAISIE, que la vue lit de son propre réglage.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	enregistrerLaConfiguration,
	valeursDeConfigurationSaisies
} from '$lib/donnees/administration';
import { accesALaConsole, contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return { vecteur: null, notes: acces.ressource.notes };
};

/** La garde des onze adresses, appliquée à l'action — voir `/console/univers`. */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	/**
	 * ENREGISTRER LA CONFIGURATION GLOBALE — `RG-M14-09` et `RG-M14-10`.
	 *
	 * LES SEPT NOMS DE CHAMP SONT CEUX DU GEL, préfixe compris : `V-33:2965`
	 * lit ses champs par `document.getElementById("c-" + id)`, et les sept
	 * `input` et `select` portent `c-frais`, `c-vieil`, `c-versions`,
	 * `c-portail`, `c-mot`, `c-taille`, `c-session` (`V-33:1247-1360`).
	 *
	 * LE REFUS EST UN ÉTAT DE L'ÉCRAN, pas une panne : la planche de `V-33`
	 * l'appelle « Valeurs refusées » et c'est l'une de ses quatre positions
	 * (`docs/routes.md` §3.6). Il sort donc en `fail` avec SES messages, rattachés
	 * à leur champ, comme `marquer()` les rattache au bloc du champ concerné.
	 */
	enregistrer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await enregistrerLaConfiguration(
			basePartagee(),
			valeursDeConfigurationSaisies((nom) => champs.get(nom)),
			new Date()
		);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
