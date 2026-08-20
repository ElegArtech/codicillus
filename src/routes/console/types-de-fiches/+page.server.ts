/**
 * `/console/types-de-fiches` — LE CHARGEUR de V-29.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; aucune règle de droit
 * n'est écrite ici, et le seul `error(404, MESSAGE_INTROUVABLE)` du fichier est SANS MESSAGE
 * (`ADR-007`).
 *
 * LE SEGMENT D'ADRESSE EST CELUI DE `docs/routes.md` §3.6, non le vocabulaire
 * de la vue : le concept « fiche » est renommable globalement par la
 * configuration (`CDC M14.7`, `P-07`), et la vue lit ce nom par
 * `$lib/vocabulaire`. L'ADRESSE, elle, ne se renomme pas — la déduire du
 * réglage rendrait un chemin instable.
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-29.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence : `TYPES_FICHE`
 * et ses champs y sont importés au niveau du module (`V-29:72`), alors que la
 * base porte `types_de_fiche` et `champs_de_type_de_fiche` et que
 * `lireTypesDeFiche()` de `T-030` les rend. La donnée existe des deux côtés et
 * n'a AUCUN chemin jusqu'à l'écran. Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos — formulaire fermé, aucun refus de
 * suppression ouvert.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { supprimerUnTypeDeFiche } from '$lib/donnees/administration';
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
	 * SUPPRIMER UN TYPE DE FICHE — `RG-M14-06`.
	 *
	 * `type-de-fiche` porte l'IDENTIFIANT LISIBLE du type, celui que
	 * `identifiantLisible(nom)` pose à la semence (`src/lib/base/semence.ts`) et
	 * que la colonne `types_de_fiche.identifiant` rend unique. Le gel désigne le
	 * type par son nom dans une fermeture et n'expose aucun nom de champ ; la clé
	 * retenue est celle par laquelle le schéma le désigne, jamais son libellé —
	 * un libellé se renomme, un identifiant lisible est stable.
	 *
	 * LE REFUS PORTE LE NOMBRE ET LA SORTIE, les deux que la règle exige en plus
	 * du refus lui-même.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await supprimerUnTypeDeFiche(
			basePartagee(),
			String(champs.get('type-de-fiche') ?? '')
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
