/**
 * `/notes/{identifiant}/modifier` — LE CHARGEUR DE L'ÉDITEUR EN MODIFICATION (V-17).
 * « Connecté + rédacteur » : la note doit être LISIBLE et l'appelant doit avoir la
 * capacité d'ÉCRIRE sur son dossier porteur. Les deux refus sont le même objet, par
 * `resoudreLEditionDUneNote()` — rien ici ne sait laquelle des causes s'est réalisée.
 *
 * `modifications` N'EST PAS PASSÉE : une ancienneté calculée sur la date de modification
 * de la note serait une autre grandeur portant le même mot (`P-02`).
 *
 * L'ACTION ÉCRIT SA VERSION (`RG-M07-01`, `RG-M07-02`) : chaque enregistrement qui
 * modifie un corps capture titre et LES DEUX corps, et un enregistrement sans changement
 * n'en crée pas. LE FORMULAIRE GELÉ NE PEUT PAS L'ATTEINDRE, et c'est dit plutôt que
 * contourné : les champs nommés que cette action lit sont ceux qu'`ARB-063` §3.2 fait
 * poser PAR LA ROUTE, et l'action est REFUSÉE avant d'écrire pour qui n'a pas le droit —
 * l'absence de bouton n'est pas un contrôle d'accès.
 *
 * SEPT CHAMPS, TOUS FACULTATIFS, dont `corps` et `corps-markdown` (EXCLUSIFS l'un de
 * l'autre) et `domaine`/`dossier` (ensemble, jamais l'un sans l'autre) ; un champ absent
 * n'est pas modifié. LA RÉPONSE EST UNE REDIRECTION 303 sur l'identifiant de l'adresse
 * DEMANDÉE — jamais un identifiant recalculé sur le nouveau titre (`RG-M03-03`).
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { adresseApresEnregistrement } from '$lib/donnees/traitement-differe';
import { desc, eq } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import { notes as notesDuSchema, versions } from '$lib/base/schema';
import {
	enregistrerLaNote,
	lireLArborescenceDeChoix,
	lireLaModification,
	resoudreLEditionDUneNote,
	type LectureDuFormulaire
} from '$lib/donnees/edition';
import { joursEcoules, lireLesProprietesDeFiche, lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { DocumentInvalide } from '$lib/contenu/document';
import { MarkdownInvalide } from '$lib/contenu/markdown';
import { empreinteDeCompte } from '$lib/edition/brouillon';
import { EditeurIncapable } from '$lib/edition/document';
import { MOTIF_DE_PROPRIETE_OBLIGATOIRE } from '$lib/edition/gestes';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';

async function contexteDe() {
	const base = basePartagee();
	return { base, lecture: { maintenant: new Date(), seuils: await lireSeuils(base) } };
}

/**
 * L'ANCIENNETÉ DE LA DERNIÈRE VERSION, EN JOURS — ou `null` quand la note n'en a
 * aucune. La barre d'état des deux éditeurs écrivait la chaîne du gel, figée dans
 * la vue, sur n'importe quelle note (`P-02`). `null` fait dire à l'écran « Aucune
 * modification », exactement vraie d'une note sans version.
 */
async function ancienneteDeLaDerniereVersion(
	base: Base,
	identifiant: string,
	maintenant: Date
): Promise<number | null> {
	const [ligne] = await base
		.select({ le: versions.le })
		.from(versions)
		.innerJoin(notesDuSchema, eq(notesDuSchema.id, versions.noteId))
		.where(eq(notesDuSchema.identifiant, identifiant))
		.orderBy(desc(versions.numero))
		.limit(1);
	return ligne === undefined ? null : joursEcoules(ligne.le, maintenant);
}

/**
 * L'INSTANT DU DERNIER ENREGISTREMENT DE LA NOTE — celui que le brouillon local doit
 * pouvoir comparer au sien (`RG-NF-02`). `dernierEnregistrement` ne suffit pas : il
 * porte une ANCIENNETÉ EN JOURS, et deux enregistrements du même jour y sont
 * indiscernables — le brouillon d'il y a dix minutes passerait pour le plus récent.
 *
 * L'appel est sous le refus de `resoudreLEditionDUneNote()`, comme ses voisins.
 */
async function enregistreeLe(base: Base, identifiant: string): Promise<string | null> {
	const [ligne] = await base
		.select({ le: notesDuSchema.modifieLe })
		.from(notesDuSchema)
		.where(eq(notesDuSchema.identifiant, identifiant))
		.limit(1);
	return ligne === undefined ? null : ligne.le.toISOString();
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
		vecteur: { cas: 'modif' },
		/* LA MARQUE DU COMPTE ET L'INSTANT DE LA BASE — les deux que le brouillon
		   local demande : l'un pour que sa clé ne mélange pas deux personnes, l'autre
		   pour qu'un brouillon plus ancien que la note ne s'impose pas. */
		empreinteDuCompte:
			locals.identite.type === 'authentifie' ? empreinteDeCompte(locals.identite.compteId) : '',
		enregistreeLe: await enregistreeLe(base, params.identifiant),
		dernierEnregistrement: await ancienneteDeLaDerniereVersion(
			base,
			params.identifiant,
			lecture.maintenant
		),
		notes: edition.lecture.notes,
		noteModifiee: edition.lecture.note,
		typesNote: edition.referentiels.typesNote,
		typesFiche: edition.referentiels.typesFiche,
		/**
		 * CE QUE CETTE NOTE A MIS DANS LES CHAMPS DE SON TYPE. CE QUI GARDE CETTE
		 * LECTURE EST EN AMONT, PAS DANS LA REQUÊTE : `lireLesProprietesDeFiche()` ne
		 * filtre que sur les identifiants qu'on lui nomme, et le seul nommé ici est
		 * celui que `resoudreLEditionDUneNote()` vient d'accorder — l'appel est sous son
		 * refus, et l'appeler ailleurs sans cette porte lirait une note interdite.
		 */
		proprietesDeFiche:
			(await lireLesProprietesDeFiche(base, [params.identifiant]))[params.identifiant] ?? {},
		templates: edition.referentiels.templates,
		/* L'ARBORESCENCE DE CHOIX, LA MÊME LECTURE QU'À LA CRÉATION. Sans elle, la
		   liste des dossiers de l'écran sortait vide et aucun déplacement n'était
		   possible. */
		dossiersParDomaine: await lireLArborescenceDeChoix(base),
		/**
		 * LE CORPS À ÉDITER, ET CE QUE L'ÉDITEUR N'EN SAIT PAS PORTER. Le second
		 * champ n'est pas décoratif : une marque que le schéma de l'éditeur ne connaît
		 * pas serait EFFACÉE à l'ouverture et réécrite amputée à l'enregistrement.
		 */
		corps: edition.document,
		/**
		 * LE CORPS RENDU, POUR QUE L'ÉCRAN OUVRE LA BONNE NOTE — rendu par
		 * `rendreDocument` et par lui seul (`ADR-004`). La vue portait en modification
		 * un corps écrit au balisage, servi sur n'importe quelle note.
		 *
		 * LE DRAPEAU LU EST `redige`, ET `existe` SERAIT LE MAUVAIS : `existe` ne dit que
		 * « la colonne n'est pas NULL », `redige` dit « le document porte du texte ». Or
		 * `creerUneNote()` n'écrit JAMAIS NULL, donc sur `existe` la chaîne vide était
		 * INATTEIGNABLE pour toute note créée par le produit — une note vierge se
		 * rouvrait avec `<p></p>` servi et AUCUNE invite d'amorçage.
		 */
		corpsRendu: edition.lecture.corps.redige ? edition.lecture.corps.html : '',
		horsDePorteeDeLEditeur: edition.horsDePorteeDeLEditeur
	};
};

export const actions: Actions = {
	default: async ({ params, locals, request }) => {
		const { base, lecture } = await contexteDe();

		/**
		 * LE DROIT AVANT LA FORME. Une réponse qui distinguerait « champ mal formé »
		 * de « adresse inconnue » révélerait l'existence de la note à qui n'y a pas
		 * droit (`RG-ACC-04`). Cette garde précède donc TOUTE plainte sur la
		 * soumission.
		 *
		 * Elle n'est appelée que sur le chemin du refus : le chemin nominal refait la
		 * même résolution dans `enregistrerLaNote()`, par le même objet.
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
			/* UN CORPS MAL FORMÉ EST REFUSÉ, JAMAIS RÉPARÉ (ADR-003) — quelle que soit
			   la forme par laquelle il est arrivé. */
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
			   moteur est un paramètre, non une option : cette route ne peut pas écrire
			   sans le fournir. */
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
			/* Le dossier de destination est inconnu, ambigu, ou interdit — une seule
			   issue pour les quatre causes, `RG-ACC-04`. La note existe : pas un 404. */
			return fail(400, { motif: 'rangement introuvable' });
		}
		if (issue.ressource.sort === 'fiche-introuvable') {
			/* Le type de fiche soumis n'existe pas dans cette instance — un référentiel
			   a pu changer entre l'ouverture et l'enregistrement. Pas un 404. */
			return fail(400, { motif: 'type de fiche introuvable' });
		}
		/* C'EST ICI QUE L'OBLIGATION MORD SUR L'EXISTANT : une note déjà écrite n'est
		   pas invalidée par une propriété devenue obligatoire, mais sa PROCHAINE
		   MODIFICATION en demande la valeur. Rien n'a encore été écrit à cette ligne :
		   le brouillon reste entier. */
		if (issue.ressource.sort === 'proprietes-manquantes') {
			const manquantes = issue.ressource.manquantes;
			return fail(400, {
				motif: MOTIF_DE_PROPRIETE_OBLIGATOIRE,
				manquements: manquantes.map((p) => p.nom),
				proprietesManquantes: manquantes.map((p) => p.cle)
			});
		}

		/* L'ADRESSE DE DESTINATION EST CELLE DE L'ADRESSE DEMANDÉE. Un identifiant
		   recalculé sur le nouveau titre romprait `RG-M03-03` — « l'adresse d'une note
		   reste stable dans le temps ».

		   LE DRAPEAU D'ENREGISTREMENT VOYAGE AVEC ELLE — `RG-NF-03` : l'indexation de
		   recherche est SOUMISE et non attendue (`ARB-060`), et la note n'est donc pas
		   trouvable à la seconde où cette page s'affiche. La lecture, elle, l'est. */
		redirect(303, adresseApresEnregistrement('/notes/' + params.identifiant));
	}
};
