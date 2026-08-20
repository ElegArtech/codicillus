/**
 * `/notes/{identifiant}/modifier` — LE CHARGEUR DE L'ÉDITEUR EN MODIFICATION
 * (V-17).
 *
 * `docs/routes.md:144` : niveau d'accès « connecté + rédacteur ». Deux
 * conditions, une seule sortie — la note doit être LISIBLE et l'appelant doit
 * avoir la capacité d'ÉCRIRE sur son dossier porteur. Les deux refus sont le
 * même objet, par `resoudreLEditionDUneNote()` : rien ici ne sait laquelle des
 * causes s'est réalisée (`RG-ACC-04`, `ADR-007`).
 *
 * `RG-M05-08` et `P-09` sont servies par cette route sans qu'elle ait à les
 * invoquer : une action interdite n'est pas affichée, et une adresse interdite
 * n'existe pas du point de vue de l'utilisateur (`docs/routes.md` §5.5,
 * principe 3).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE CHARGEUR REND, ET CE QUE L'ÉCRAN N'EN MONTRE PAS ENCORE
 *
 * `src/vues/V-17.svelte` accepte la note reprise en modification — propriété
 * `noteModifiee`, ajoutée par `T-042` — et tout ce qu'elle en montre sort du
 * type `Note` : titre, type, domaine, dossier, étiquettes. La vue le dit
 * elle-même : « aucun corps rendu n'est nécessaire ici, à la différence de V-14
 * et de V-18 ».
 *
 * Le corps RÉDIGÉ est donc chargé et validé — c'est lui que l'éditeur ouvrira —
 * et AUCUN nœud de V-17 ne peut le recevoir aujourd'hui : la zone de rédaction
 * est rendue vide, ce qui est exactement l'état que le gel montre à cette
 * adresse. Écart déclaré, chiffré au rapport ; `src/vues/` est interdit à ce
 * lot.
 *
 * L'ANCIENNETÉ DE LA DERNIÈRE VERSION — `modifications`, la table que la vue
 * lit pour écrire « dernière version il y a N jours » — n'est PAS passée : la
 * table `versions` porte ZÉRO ligne pour 32 notes (mesuré le 20/08/2026), et
 * une ancienneté calculée sur la date de modification de la note serait une
 * autre grandeur portant le même mot. Le défaut de la vue reste donc en place
 * et l'écart est déclaré, plutôt qu'une valeur juste-en-apparence (`P-02`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ACTION ÉCRIT, ELLE, ET ELLE ÉCRIT SA VERSION
 *
 * `RG-M07-01` et `RG-M07-02` : chaque enregistrement qui modifie un corps
 * capture une version — titre et LES DEUX corps —, et un enregistrement sans
 * changement n'en crée pas. `enregistrerLeCorps()` fait les deux écritures dans
 * une seule transaction.
 *
 * LE FORMULAIRE GELÉ NE PEUT PAS L'ATTEINDRE, et c'est dit plutôt que contourné :
 * V-17 ne porte ni `method` ni `action`, et aucun de ses champs ne porte
 * d'attribut de nom (relevé champ par champ, V-17:1596-1665). Le corps saisi
 * arrive donc d'un champ nommé que seul un client construit — celui que le lot
 * de câblage de l'éditeur posera, en touchant `src/vues/`. L'action est
 * néanmoins REFUSÉE avant d'écrire pour qui n'a pas le droit : l'absence de
 * bouton n'est pas un contrôle d'accès.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { enregistrerLeCorps, resoudreLEditionDUneNote } from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { DocumentInvalide } from '$lib/contenu/document';
import { EditeurIncapable } from '$lib/edition/document';
import type { Actions, PageServerLoad } from './$types';

async function contexteDe() {
	const base = basePartagee();
	return { base, lecture: { maintenant: new Date(), seuils: await lireSeuils(base) } };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { base, lecture } = await contexteDe();
	const acces = await resoudreLEditionDUneNote(base, {
		identifiant: params.identifiant,
		registre: 'reference',
		identite: locals.identite,
		contexte: lecture
	});
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
	const edition = acces.ressource;

	return {
		/** L'entrée est une modification — `charger()`, `V-17:3549`. */
		vecteur: { cas: 'modif' },
		notes: edition.lecture.notes,
		noteModifiee: edition.lecture.note,
		typesNote: edition.referentiels.typesNote,
		typesFiche: edition.referentiels.typesFiche,
		templates: edition.referentiels.templates,
		/**
		 * LE CORPS À ÉDITER, ET CE QUE L'ÉDITEUR N'EN SAIT PAS PORTER. Le second
		 * champ n'est pas décoratif : une marque que le schéma de l'éditeur ne
		 * connaît pas serait EFFACÉE à l'ouverture et réécrite amputée à
		 * l'enregistrement suivant. La liste est vide quand la note s'ouvre
		 * entière ; elle est non vide, nommée et comptée sinon.
		 */
		corps: edition.document,
		horsDePorteeDeLEditeur: edition.horsDePorteeDeLEditeur
	};
};

export const actions: Actions = {
	default: async ({ params, locals, request }) => {
		const { base, lecture } = await contexteDe();
		const formulaire = await request.formData();
		const saisi = formulaire.get('corps');
		if (typeof saisi !== 'string') {
			/* Le droit est vérifié AVANT de se plaindre de la forme : une réponse
			   qui distinguerait « champ manquant » de « adresse inconnue »
			   révélerait l'existence de la note à qui n'y a pas droit. */
			const acces = await resoudreLEditionDUneNote(base, {
				identifiant: params.identifiant,
				registre: 'reference',
				identite: locals.identite,
				contexte: lecture
			});
			if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
			return fail(400, { motif: 'aucun corps soumis' });
		}

		try {
			const fait = await enregistrerLeCorps(base, {
				identifiant: params.identifiant,
				registre: 'reference',
				identite: locals.identite,
				contexte: lecture,
				corpsSaisi: JSON.parse(saisi),
				maintenant: lecture.maintenant
			});
			if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
			return { version: fait.ressource.version?.numero ?? null };
		} catch (cause) {
			/* UN DOCUMENT MAL FORMÉ EST REFUSÉ, JAMAIS RÉPARÉ (ADR-003). Le refus
			   porte ses manquements, chemin par chemin : c'est ce que
			   `DocumentInvalide` transporte, et c'est ce que l'écran d'erreur de
			   V-17 a vocation à montrer. */
			if (cause instanceof DocumentInvalide) {
				return fail(422, {
					motif: 'document refusé',
					manquements: cause.manquements.map((m) => `${m.chemin} : ${m.message}`)
				});
			}
			if (cause instanceof EditeurIncapable) {
				return fail(422, { motif: 'éditeur incapable', manque: cause.manque });
			}
			if (cause instanceof SyntaxError) {
				return fail(400, { motif: 'corps illisible' });
			}
			throw cause;
		}
	}
};
