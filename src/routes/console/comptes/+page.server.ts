/**
 * `/console/comptes` — LE CHARGEUR de V-32.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS, ET C'EST L'ÉCRAN OÙ CELA PÈSE LE PLUS. Il ne
 * touche pas `src/vues/V-32.svelte`, qui importe `COMPTES` au niveau du module
 * (`V-32:65`) : la liste des comptes affichée est celle du JEU DE SEMENCE, non
 * celle de la table. `lireComptes()` de `T-030` existe et rend les comptes de la
 * base, mais aucune propriété ne les porte jusqu'à l'écran. Un administrateur
 * qui créerait un compte ne le verrait donc pas apparaître — écran de gestion
 * dont la gestion n'est pas branchée. Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos : les quatre positions de l'axe
 * « Formulaire » et les deux de l'axe « Cas » sont des états d'INTERACTION.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { changerLeRoleDUnCompte, roleDepuisLeLibelle } from '$lib/donnees/administration';
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
	 * CHANGER LE RÔLE D'UN COMPTE — `RG-M14-07`.
	 *
	 * `f-ident` ET `f-role` SONT LES NOMS DU GEL : `V-32:1384` porte
	 * `select#f-role`, et le champ d'identifiant de connexion est `f-ident`
	 * (`V-32:3109`), définitif après création — « le modifier casserait
	 * l'attribution de ses contributions passées ». Le compte se désigne donc par
	 * lui.
	 *
	 * LE SÉLECTEUR REND UN LIBELLÉ, PAS UN ÉNUMÉRÉ. `roleDepuisLeLibelle()` fait
	 * la conversion, et rend `null` sur tout le reste : un rôle non reconnu est
	 * un refus, jamais un rôle par défaut — se tromper de défaut ici, ce serait
	 * accorder un droit.
	 *
	 * LE REFUS DU DERNIER ADMINISTRATEUR SORT EN `fail` AVEC SON MOTIF. `P-09`
	 * veut que le geste ne soit pas offert — le gel verrouille le sélecteur et
	 * écrit le motif au-dessus (`V-32:3081-3099`) —, ce qui ne dispense pas de le
	 * refuser ici : un client compose la requête qu'il veut.
	 */
	changerLeRole: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const role = roleDepuisLeLibelle(champs.get('f-role'));
		if (role === null) return fail(400, { issue: 'role-inconnu' });

		const resultat = await changerLeRoleDUnCompte(
			basePartagee(),
			String(champs.get('f-ident') ?? ''),
			role,
			new Date()
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
