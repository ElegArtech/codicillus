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
 * CE QUE LE CHARGEUR REND, ET CE QUE L'ÉCRAN EN MONTRE
 *
 * `src/vues/V-17.svelte` accepte la note reprise en modification — propriété
 * `noteModifiee` — et ce qu'elle en montre hors du corps sort du type `Note` :
 * titre, type, domaine, dossier, étiquettes.
 *
 * Le corps RÉDIGÉ est chargé et validé — c'est lui que l'éditeur ouvrira — et
 * la vue le REÇOIT désormais, par la propriété requise `corps` : `corpsRendu`
 * ci-dessous. Elle portait auparavant un corps de démonstration écrit au
 * balisage, servi sur n'importe quelle note.
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
 * aucune.
 *
 * La barre d'état des deux éditeurs écrivait « dernière version il y a
 * 3 semaines » sur n'importe quelle note : la chaîne du gel, figée dans la vue,
 * donc une valeur illustrative sur une note réelle (`P-02`). Elle est désormais
 * LUE, et `null` fait dire à l'écran l'autre phrase du gel — « Aucune
 * modification » —, qui est exactement vraie d'une note sans version.
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
		 * CE QUE CETTE NOTE A MIS DANS LES CHAMPS DE SON TYPE.
		 *
		 * `noteModifiee` porte le NOM du type de fiche, jamais ses valeurs : la
		 * colonne `proprietes_typees` a sa propre lecture.
		 *
		 * CE QUI GARDE CETTE LECTURE EST EN AMONT, PAS DANS LA REQUÊTE.
		 * `lireLesProprietesDeFiche()` ne filtre que sur les identifiants qu'on
		 * lui nomme ; le seul nommé ici est celui que `resoudreLEditionDUneNote()`
		 * vient d'accorder à l'identité — l'appel est sous son refus, et l'appeler
		 * ailleurs sans cette porte lirait une note interdite.
		 *
		 * Sans les deux, l'éditeur rouvrait une fiche « Serveur » sur « Aucun —
		 * note simple », panneau vide : l'écran mentait sur l'état de la note, et
		 * un enregistrement l'aurait dépouillée.
		 */
		proprietesDeFiche:
			(await lireLesProprietesDeFiche(base, [params.identifiant]))[params.identifiant] ?? {},
		templates: edition.referentiels.templates,
		/* L'ARBORESCENCE DE CHOIX, LA MÊME LECTURE QU'À LA CRÉATION. Sans elle, la
		   liste des dossiers de l'écran sortait vide et aucun déplacement n'était
		   possible — mesuré le 22/08/2026. */
		dossiersParDomaine: await lireLArborescenceDeChoix(base),
		/**
		 * LE CORPS À ÉDITER, ET CE QUE L'ÉDITEUR N'EN SAIT PAS PORTER. Le second
		 * champ n'est pas décoratif : une marque que le schéma de l'éditeur ne
		 * connaît pas serait EFFACÉE à l'ouverture et réécrite amputée à
		 * l'enregistrement suivant. La liste est vide quand la note s'ouvre
		 * entière ; elle est non vide, nommée et comptée sinon.
		 */
		corps: edition.document,
		/**
		 * LE CORPS RENDU, POUR QUE L'ÉCRAN OUVRE LA BONNE NOTE — le défaut le
		 * plus visible de cette adresse, et il était SERVI.
		 *
		 * `src/vues/V-17.svelte` portait, en modification, un corps écrit au
		 * balisage : l'extrait de la note suivi des sections d'une procédure de
		 * démonstration. Le vecteur `cas: 'modif'` étant posé ci-dessus sur
		 * TOUTE modification, ouvrir n'importe quelle note affichait ce
		 * corps-là — remplacé au montage par `monterLEditeur()`, donc un flash
		 * avec JavaScript et un contenu PERMANENT sans lui.
		 *
		 * La vue déclare désormais une propriété `corps`, et c'est ce HTML
		 * qu'elle reçoit : le même document que l'éditeur ouvrira, rendu par
		 * `rendreDocument` et par lui seul (`ADR-004`).
		 *
		 * LE DRAPEAU LU EST `redige`, ET `existe` SERAIT LE MAUVAIS. `existe`
		 * ne dit que « la colonne n'est pas NULL » ; `redige` dit « le document
		 * porte du texte » (`$lib/donnees/note.ts`, `CorpsDeNote`). Or
		 * `creerUneNote()` n'écrit JAMAIS NULL : `corpsDeLaSaisie('')` rend
		 * `corpsVide()`, un paragraphe sans texte. Sur `existe`, la chaîne vide
		 * était donc INATTEIGNABLE pour toute note créée par le produit — une
		 * note vierge se rouvrait avec `<p></p>` servi, donc `data-vide="non"`
		 * et AUCUNE invite d'amorçage (`V-17.css:517`, seul rendu visible du
		 * vide). `editeur-client.ts:508` recalculait l'attribut au montage : le
		 * défaut était invisible avec JavaScript et permanent sans lui.
		 *
		 * CHAÎNE VIDE, DONC, DANS LES DEUX CAS OÙ IL N'Y A RIEN À ÉDITER : la
		 * note ne porte aucun registre Référence, ou elle en porte un qui est
		 * vide. La zone de rédaction est alors vide et rend son invite.
		 */
		corpsRendu: edition.lecture.corps.redige ? edition.lecture.corps.html : '',
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
		if (issue.ressource.sort === 'fiche-introuvable') {
			/* Le type de fiche soumis n'existe pas dans cette instance — un
			   référentiel administrable a pu changer entre l'ouverture de l'écran
			   et l'enregistrement. La note existe : ce n'est pas un 404. */
			return fail(400, { motif: 'type de fiche introuvable' });
		}
		/* C'EST ICI QUE L'OBLIGATION MORD SUR L'EXISTANT — `mockups/V-29:3308` :
		   une note déjà écrite n'est pas invalidée par une propriété devenue
		   obligatoire, mais sa PROCHAINE MODIFICATION en demande la valeur. Rien
		   n'a encore été écrit à cette ligne : le brouillon reste entier. */
		if (issue.ressource.sort === 'proprietes-manquantes') {
			const manquantes = issue.ressource.manquantes;
			return fail(400, {
				motif: MOTIF_DE_PROPRIETE_OBLIGATOIRE,
				manquements: manquantes.map((p) => p.nom),
				proprietesManquantes: manquantes.map((p) => p.cle)
			});
		}

		/* L'ADRESSE DE DESTINATION EST CELLE DE L'ADRESSE DEMANDÉE. Un identifiant
		   recalculé sur le nouveau titre romprait `RG-M03-03` — « l'adresse d'une
		   note reste stable dans le temps » — et `ARB-062` §2.6. */
		redirect(303, '/notes/' + params.identifiant);
	}
};
