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
 * changement n'en crée pas. `enregistrerLaNote()` fait toutes les écritures dans
 * une seule transaction : la note, sa version, ses étiquettes.
 *
 * LE FORMULAIRE GELÉ NE PEUT PAS L'ATTEINDRE, et c'est dit plutôt que contourné :
 * V-17 ne porte ni `method` ni `action`, et aucun de ses champs ne porte
 * d'attribut de nom (relevé champ par champ, V-17:1596-1665). Les champs nommés
 * que cette action lit sont ceux qu'`ARB-063` §3.2 fait poser PAR LA ROUTE, en
 * champs cachés remplis depuis les nœuds du gel — jamais par `src/vues/`, que le
 * §5 du même arbitrage ferme pour cette campagne. L'action est néanmoins REFUSÉE
 * avant d'écrire pour qui n'a pas le droit : l'absence de bouton n'est pas un
 * contrôle d'accès.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA SOUMISSION PORTE, ET CE QU'ELLE NE PORTE PAS
 *
 * Sept champs, tous FACULTATIFS : `corps` (le document sérialisé de l'éditeur),
 * `corps-markdown` (le Markdown, converti par la porte unique d'`ADR-004`, et
 * EXCLUSIF du premier), `titre`, `domaine` et `dossier` (ensemble, jamais l'un
 * sans l'autre), `visibilite`, `statut`, `etiquettes`. Un champ absent n'est pas
 * modifié — une soumission qui ne porte qu'un titre ne touche pas au corps, et
 * n'écrit donc aucune version.
 *
 * DEUX CHAMPS DE CORPS PLUTÔT QU'UN, et la raison est le navigateur : aucun
 * client ne compose le document sérialisé de l'éditeur depuis une zone de saisie
 * riche sans embarquer l'éditeur lui-même. Le champ Markdown est le chemin d'un
 * client qui ne l'embarque pas ; le premier reste, parce qu'il est celui du
 * client qui l'embarque. Ils ne peuvent pas arriver ensemble.
 *
 * LA RÉPONSE EST UNE REDIRECTION 303 vers la lecture de la note. L'identifiant
 * de destination est celui de l'adresse demandée, jamais un identifiant
 * recalculé sur le nouveau titre : `RG-M03-03` (`CDC:484`) et `ARB-062` §2.6.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	enregistrerLaNote,
	lireLaModification,
	resoudreLEditionDUneNote,
	type LectureDuFormulaire
} from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { DocumentInvalide } from '$lib/contenu/document';
import { MarkdownInvalide } from '$lib/contenu/markdown';
import { EditeurIncapable } from '$lib/edition/document';
import { moteurPartage } from '$lib/recherche/acces';
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

		/**
		 * LE DROIT AVANT LA FORME. Une réponse qui distinguerait « champ mal
		 * formé » de « adresse inconnue » révélerait l'existence de la note à qui
		 * n'y a pas droit — `RG-ACC-04`, régime indiscernable de `docs/routes.md`
		 * §5.5. Cette garde précède donc TOUTE plainte sur la soumission.
		 *
		 * Elle n'est appelée que sur le chemin du refus : le chemin nominal refait
		 * la même résolution dans `enregistrerLaNote()`, par le même objet et le
		 * même filtre.
		 */
		const garderLeDroit = async (): Promise<void> => {
			const acces = await resoudreLEditionDUneNote(base, {
				identifiant: params.identifiant,
				registre: 'reference',
				identite: locals.identite,
				contexte: lecture
			});
			if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
		};

		const formulaire = await request.formData();
		let lue: LectureDuFormulaire;
		try {
			lue = lireLaModification(formulaire);
		} catch (cause) {
			/* UN CORPS MAL FORMÉ EST REFUSÉ, JAMAIS RÉPARÉ (ADR-003) — quelle que
			   soit la forme par laquelle il est arrivé. Le refus porte ce que la
			   levée transporte : les manquements chemin par chemin pour un
			   document, la ligne fautive pour du Markdown. */
			await garderLeDroit();
			if (cause instanceof DocumentInvalide) {
				return fail(422, {
					motif: 'document refusé',
					manquements: cause.manquements.map((m) => `${m.chemin} : ${m.message}`)
				});
			}
			if (cause instanceof MarkdownInvalide) {
				return fail(422, { motif: 'markdown refusé', ligne: cause.ligne });
			}
			if (cause instanceof SyntaxError) {
				return fail(400, { motif: 'corps illisible' });
			}
			throw cause;
		}
		if (!lue.recu) {
			await garderLeDroit();
			return fail(400, { motif: lue.refus.motif });
		}

		let issue;
		try {
			/* L'INDEX EST ENTRETENU PAR L'ENREGISTREMENT — `RG-M05-06`. Le client du
			   moteur est un paramètre, non une option : cette route ne peut pas
			   écrire sans le fournir. */
			issue = await enregistrerLaNote(base, moteurPartage(), {
				identifiant: params.identifiant,
				registre: 'reference',
				identite: locals.identite,
				contexte: lecture,
				maintenant: lecture.maintenant,
				modification: lue.modification
			});
		} catch (cause) {
			/* Ici, le droit est DÉJÀ acquis : ces deux levées viennent d'après la
			   résolution, à l'intérieur de l'enregistrement. */
			if (cause instanceof DocumentInvalide) {
				return fail(422, {
					motif: 'document refusé',
					manquements: cause.manquements.map((m) => `${m.chemin} : ${m.message}`)
				});
			}
			if (cause instanceof EditeurIncapable) {
				return fail(422, { motif: 'éditeur incapable', manque: cause.manque });
			}
			throw cause;
		}
		if (!issue.trouve) error(404, MESSAGE_INTROUVABLE);
		if (issue.ressource.sort === 'rangement-introuvable') {
			/* Le dossier de destination est inconnu, ambigu, ou interdit — une
			   seule issue pour les quatre causes, `RG-ACC-04`. La note, elle,
			   existe : ce n'est donc pas un 404. */
			return fail(400, { motif: 'rangement introuvable' });
		}

		/* L'ADRESSE DE DESTINATION EST CELLE DE L'ADRESSE DEMANDÉE. Un identifiant
		   recalculé sur le nouveau titre romprait `RG-M03-03` — « l'adresse d'une
		   note reste stable dans le temps » — et `ARB-062` §2.6. */
		redirect(303, '/notes/' + params.identifiant);
	}
};
