/**
 * `/console/templates` — LE CHARGEUR de V-31.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-31.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence : `TEMPLATES`
 * et `TYPES_NOTE` y sont importés au niveau du module (`V-31:59`). Et même s'ils
 * entraient par propriété, une colonne manquerait : `pnpm verif:donnees` compte
 * `Template.utilisations` parmi ses LACUNES — « c'est un compteur d'EMPLOI, qui
 * se calcule sur les notes créées depuis un template, et rien n'enregistre cette
 * provenance ». Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { accesALaConsole, contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import { marquerLeTemplateParDefaut, supprimerUnTemplate } from '$lib/donnees/administration';
import { lireTemplates, lireTypesDeNote } from '$lib/donnees/lecture';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	const [templates, typesNote] = await Promise.all([lireTemplates(base), lireTypesDeNote(base)]);

	return {
		vecteur: null,
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		templates,
		typesNote
	};
};

/** La garde des onze adresses, appliquée aux actions — voir `/console/univers`. */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN TEMPLATE — `RG-REF-01`.
	 *
	 * `template` porte l'IDENTIFIANT LISIBLE, celui de `templates.identifiant` que
	 * `lireTemplates()` rend en `id` : la vue le porte déjà, aucune table de
	 * traduction n'est nécessaire.
	 *
	 * AUCUNE ISSUE DE REFUS : la suppression d'un template n'affecte aucune note,
	 * et le dialogue du gel n'avertit que d'une chose — la création s'ouvrira sur
	 * la page vierge si c'était le template par défaut.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await supprimerUnTemplate(
			basePartagee(),
			String(champs.get('template') ?? '')
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		return resultat;
	},

	/**
	 * MARQUER UN TEMPLATE PAR DÉFAUT — `RG-REF-02`.
	 *
	 * Le geste est UNIQUE et laisse exactement un template par défaut : c'est ce
	 * que le gel écrit depuis l'écran — « Cocher décochera "X", qui l'est
	 * actuellement » (`V-31:380`). Voir `marquerLeTemplateParDefaut()` pour le
	 * motif de la transaction.
	 */
	marquerParDefaut: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await marquerLeTemplateParDefaut(
			basePartagee(),
			String(champs.get('template') ?? ''),
			new Date()
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		return resultat;
	}
};
