/**
 * `/console/types-de-relations` — LE CHARGEUR de V-30.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES DE CONSOLE : `resoudreLaConsole()` la
 * prend, une fois pour toutes, et un non-administrateur reçoit 404 V-26 — pas un
 * refus (`P-09`, `RG-ACC-04`). Le seul `error(404, …)` du fichier est SANS
 * MESSAGE (`ADR-007`).
 *
 * `typesRelation`, `relations` et `relationsTechniques` sont des propriétés
 * REQUISES de V-30, servies depuis `types_de_relation` et `relations` — le compte
 * d'emploi de chaque type, celui-là même qui décide si une suppression est
 * refusée, se compte donc sur les liens réels. Sans elles, la vue ajoutait un
 * type `remplace` dès qu'une page oubliait de passer le catalogue.
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
	 * sont celles qu'il écrit — `reaffecter` et `supprimer`. Rien n'est traduit.
	 *
	 * `vers` N'A DE SENS QUE POUR LA RÉAFFECTATION : le geste refuse une cible
	 * inconnue plutôt que de se rabattre sur un type quelconque — se tromper de type
	 * d'accueil réécrirait tout un pan du graphe.
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
	 * CRÉER UN TYPE DE RELATION — `RG-M08-06`, `RG-M08-07`. LES TROIS REFUS SONT CEUX
	 * DU GEL, rattachés à leur champ : `erreur-direct` et `erreur-inverse` existent au
	 * balisage et n'attendaient qu'un message.
	 *
	 * L'USAGE ATTENDU N'EST PAS PERSISTÉ, ET C'EST DÉCLARÉ : `#f-desc` n'a aucune
	 * colonne — `types_de_relation` porte l'identifiant, les deux libellés, le
	 * caractère technique et le rang, rien d'autre.
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
