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
 * LE RÉFÉRENTIEL AFFICHÉ EST CELUI DE LA BASE — l'écart est refermé. Ce
 * commentaire disait : « la vue lit `TYPES_FICHE` du jeu de semence, la donnée
 * existe des deux côtés et n'a AUCUN chemin jusqu'à l'écran ». Le chemin
 * existe : `typesFiche` est une propriété REQUISE de `V-29`, que ce chargeur
 * sert par `lireTypesDeFiche()` depuis `types_de_fiche` et
 * `champs_de_type_de_fiche`. Elle n'a plus de valeur par défaut : la vue
 * dérivait la sienne du jeu de démonstration, et une page qui oubliait de la
 * passer servait donc trois types qui n'existaient nulle part.
 *
 * `vecteur: null` demande l'état au repos — formulaire fermé, aucun refus de
 * suppression ouvert.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	creerUnTypeDeFiche,
	delesterUnTypeDeFiche,
	modifierUnTypeDeFiche,
	supprimerUnTypeDeFiche
} from '$lib/donnees/administration';
import {
	CHAMP_DESCRIPTION,
	CHAMP_GLYPHE,
	CHAMP_NOM,
	CHAMP_PROPRIETES,
	CHAMP_TYPE_DE_FICHE_CIBLE,
	proprietesDuChamp,
	texteDuChamp
} from '$lib/console/structure';
import { accesALaConsole, contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import { lirePresentationsDeTypeDeFiche, lireTypesDeFiche } from '$lib/donnees/lecture';
import { lireLesDesignationsDeTypeDeFiche } from '$lib/donnees/consoles';
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
		typesFiche: await lireTypesDeFiche(base),
		presentations: await lirePresentationsDeTypeDeFiche(base),
		designations: await lireLesDesignationsDeTypeDeFiche(base)
	};
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
	},
	/**
	 * DÉLESTER LES NOTES D'UN TYPE — la sortie que le refus propose.
	 *
	 * `mockups/V-29-console-types-fiches.html:3464` porte le bouton, et `P-03`
	 * interdit qu'il soit inerte : « une entrée visible est une entrée qui
	 * fonctionne ». Le geste est celui de `delesterUnTypeDeFiche()`, dont l'en-tête
	 * dit ce qu'il touche et ce qu'il ne touche pas.
	 *
	 * Le type est désigné par le MÊME champ que la suppression — `type-de-fiche`,
	 * l'identifiant lisible — parce que c'est le même objet. Deux noms de champ
	 * pour une même clé finiraient par diverger.
	 */
	delester: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await delesterUnTypeDeFiche(
			basePartagee(),
			String(champs.get('type-de-fiche') ?? '')
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		return resultat;
	},

	/**
	 * CRÉER UN TYPE DE FICHE, ET SON SCHÉMA DE PROPRIÉTÉS.
	 *
	 * DEUX TABLES, UNE TRANSACTION : `types_de_fiche` et
	 * `champs_de_type_de_fiche`. Un type créé sans ses propriétés serait un
	 * schéma vide que l'administrateur croirait avoir défini.
	 *
	 * LES CINQ ATTRIBUTS QUE CE PANNEAU JETAIT SONT ÉCRITS. La description,
	 * l'icône, et par propriété l'aide à la saisie, la valeur par défaut et le
	 * caractère obligatoire n'avaient AUCUNE colonne : l'administrateur les
	 * saisissait, l'écran les affichait comme acquises, et l'enregistrement les
	 * perdait sans un mot. `008_saisies_de_console` les pose, et ce chargeur les
	 * relit — `V-29.svelte` ne tient plus de table écrite à la main que pour le
	 * jeu de démonstration, où elle est le défaut de sa propriété.
	 */
	creer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await creerUnTypeDeFiche(basePartagee(), {
			nom: texteDuChamp(champs, CHAMP_NOM) ?? '',
			description: texteDuChamp(champs, CHAMP_DESCRIPTION) ?? '',
			glyphe: texteDuChamp(champs, CHAMP_GLYPHE) ?? '',
			proprietes: proprietesDuChamp(champs, CHAMP_PROPRIETES) ?? []
		});
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/** ENREGISTRER UN TYPE DE FICHE — le nom, et le schéma en bloc. */
	enregistrer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const nom = texteDuChamp(champs, CHAMP_NOM);
		const description = texteDuChamp(champs, CHAMP_DESCRIPTION);
		const glyphe = texteDuChamp(champs, CHAMP_GLYPHE);
		const proprietes = proprietesDuChamp(champs, CHAMP_PROPRIETES);

		const resultat = await modifierUnTypeDeFiche(
			basePartagee(),
			texteDuChamp(champs, CHAMP_TYPE_DE_FICHE_CIBLE) ?? '',
			{
				...(nom === undefined ? {} : { nom }),
				...(description === undefined ? {} : { description }),
				...(glyphe === undefined ? {} : { glyphe }),
				...(proprietes === undefined ? {} : { proprietes })
			}
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
