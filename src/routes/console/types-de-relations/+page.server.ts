/**
 * `/console/types-de-relations` — LE CHARGEUR de V-30.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-30.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence :
 * `TYPES_RELATION`, `RELATIONS` et `RELATIONS_TECHNIQUES` y sont importés au
 * niveau du module (`V-30:54`), alors que la base porte `types_de_relation` et
 * `relations` et que `lireTypesDeRelation()`, `lireRelations()` et
 * `lireRelationsTechniques()` de `T-030` les rendent. La donnée existe des deux
 * côtés et n'a AUCUN chemin jusqu'à l'écran — c'est le compte d'emploi de
 * chaque type qui en dépend, celui-là même qui décide si une suppression est
 * refusée. Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { accesALaConsole, contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import {
	creerUnTypeDeRelation,
	modifierUnTypeDeRelation,
	supprimerUnTypeDeRelation
} from '$lib/donnees/administration';
import {
	CHAMP_DIRECT,
	CHAMP_INVERSE,
	CHAMP_TECHNIQUE,
	CHAMP_TYPE_DE_RELATION_CIBLE,
	texteDuChamp
} from '$lib/console/structure';
import { lireRelations, lireRelationsTechniques, lireTypesDeRelation } from '$lib/donnees/lecture';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	const [typesRelation, relations, relationsTechniques] = await Promise.all([
		lireTypesDeRelation(base),
		lireRelations(base),
		lireRelationsTechniques(base)
	]);

	return {
		vecteur: null,
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		typesRelation,
		relations,
		relationsTechniques
	};
};

/** La garde des onze adresses, appliquée à l'action — voir `/console/univers`. */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN TYPE DE RELATION — `RG-M08-06`, `RG-M08-07`.
	 *
	 * `sortie` PORTE LE NOM DU GROUPE DE BOUTONS RADIO DU GEL, et ses deux valeurs
	 * sont celles qu'il écrit : `reaffecter` et `supprimer` (`V-30:536`, `:549`).
	 * Rien n'est traduit — le jour où le dialogue soumettrait nativement, aucun
	 * nom ne serait à changer.
	 *
	 * `vers` N'A DE SENS QUE POUR LA RÉAFFECTATION, et son absence n'est pas un
	 * défaut : le geste ne le lit que dans cette branche, et refuse une cible
	 * inconnue plutôt que de se rabattre sur un type quelconque — se tromper de
	 * type d'accueil réécrirait tout un pan du graphe.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const sortie = champs.get('sortie') === 'supprimer' ? 'supprimer' : 'reaffecter';
		const vers = champs.get('vers');
		const resultat = await supprimerUnTypeDeRelation(basePartagee(), {
			type: String(champs.get('type-de-relation') ?? ''),
			sortie,
			...(typeof vers === 'string' ? { vers } : {})
		});
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * CRÉER UN TYPE DE RELATION — `RG-M08-06`, `RG-M08-07`.
	 *
	 * LES TROIS REFUS SONT CEUX DU GEL, et ils sortent rattachés à leur champ :
	 * `erreur-direct` et `erreur-inverse` existent au balisage (`V-30:1331`,
	 * `:1341`) et n'attendaient qu'un message.
	 *
	 * L'USAGE ATTENDU N'EST PAS PERSISTÉ, ET C'EST DÉCLARÉ. `#f-desc` du panneau
	 * n'a aucune colonne : `types_de_relation` porte l'identifiant, les deux
	 * libellés, le caractère technique et le rang, rien d'autre. `V-30.svelte` le
	 * tient d'une table écrite à la main (`USAGES`) et le dit déjà.
	 * `$lib/base/schema.ts` est en lecture seule pour ce lot.
	 */
	creer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await creerUnTypeDeRelation(basePartagee(), {
			direct: texteDuChamp(champs, CHAMP_DIRECT) ?? '',
			inverse: texteDuChamp(champs, CHAMP_INVERSE) ?? '',
			technique: texteDuChamp(champs, CHAMP_TECHNIQUE) === 'oui'
		});
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/** ENREGISTRER UN TYPE DE RELATION — les libellés changent, les liens non. */
	enregistrer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const direct = texteDuChamp(champs, CHAMP_DIRECT);
		const inverse = texteDuChamp(champs, CHAMP_INVERSE);
		const technique = texteDuChamp(champs, CHAMP_TECHNIQUE);

		const resultat = await modifierUnTypeDeRelation(
			basePartagee(),
			texteDuChamp(champs, CHAMP_TYPE_DE_RELATION_CIBLE) ?? '',
			{
				...(direct === undefined ? {} : { direct }),
				...(inverse === undefined ? {} : { inverse }),
				...(technique === undefined ? {} : { technique: technique === 'oui' })
			}
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
