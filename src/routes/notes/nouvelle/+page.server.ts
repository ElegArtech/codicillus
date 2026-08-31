/**
 * `/notes/nouvelle` — LE CHARGEUR DE L'ÉDITEUR EN CRÉATION (V-17). « Connecté +
 * rédacteur », exigé PAR LE MÊME CHEMIN que l'inexistence : un lecteur reçoit 404, au
 * même octet (`ADR-007`, `RG-ACC-04`). `nouvelle` est un identifiant RÉSERVÉ sous
 * `/notes/` (§5.4).
 *
 * `template` est lu ICI parce qu'il pilote `vecteur.cas` ; `domaine`, `dossier` et
 * `titre` le sont dans `+page.svelte`, et `dossier` est VÉRIFIÉ contre l'arborescence
 * de choix.
 *
 * L'ORDRE DES PORTES N'EST PAS NÉGOCIABLE : le DROIT d'écrire quelque part
 * (`resoudreLaCreationDeNote()`, AVANT toute lecture du corps soumis), puis la CIBLE et
 * le DROIT SUR CE DOSSIER — au MÊME OCTET de refus —, puis la FORME (400 ou 422), puis
 * l'ÉCRITURE, puis l'INDEX après la transaction (`ARB-060`), puis `303`. Il faut
 * connaître le dossier pour savoir si l'appelant a le droit d'y écrire : rien de plus
 * n'est lu tant que les deux portes ne sont pas franchies.
 *
 * L'IDENTIFIANT LISIBLE PREND LA FORME D'`ARB-062`, et il est dans l'ADRESSE, stable
 * (`RG-M03-03`). V-17 ne porte ni `method`, ni `action`, ni attribut de nom — la
 * soumission est composée par la ROUTE (`ARB-063`).
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { DocumentInvalide } from '$lib/contenu/document';
import { MarkdownInvalide } from '$lib/contenu/markdown';
import { refusDEcriture } from '$lib/donnees/amorcage';
import { creerUneNote, lireLaSaisie, resoudreLaCible } from '$lib/donnees/creation';
import {
	lireLArborescenceDeChoix,
	peutEcrireSurLeDossier,
	resoudreLaCreationDeNote
} from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { MOTIF_DE_PROPRIETE_OBLIGATOIRE } from '$lib/edition/gestes';
import { adresseDeNote } from '$lib/rangement/adresses';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';

/** L'instant de référence est pris ICI, une fois : voir `/notes/{identifiant}`. */
async function contexte() {
	const base = basePartagee();
	return { base, contexte: { maintenant: new Date(), seuils: await lireSeuils(base) } };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { base, contexte: lecture } = await contexte();
	const acces = await resoudreLaCreationDeNote(base, locals.identite, lecture);
	/* LE CODE RESTE 404 — SEULE LA PHRASE CHANGE, ET POUR UN SEUL CAS. Sur une
	   instance à zéro univers, l'administrateur recevait ici un 404 nu : rien à
	   ranger, aucune issue nommée, alors que le produit sait ce qui manque. Le
	   message le lui dit et nomme la console. Tout autre compte, toute autre
	   cause : `MESSAGE_INTROUVABLE`, au même octet (`$lib/donnees/amorcage`). */
	if (!acces.trouve) error(404, await refusDEcriture(base, locals.identite));
	const creation = acces.ressource;

	/**
	 * `?template=` — LE PARAMÈTRE DE `docs/routes.md:287`.
	 *
	 * Le dialogue « Par quoi commencer ? » du gel n'est rendu que par l'état
	 * `cas-template` de la vue, et aucune adresse ne le demandait : ses deux gestes
	 * n'étaient pas seulement inertes, ils étaient INATTEIGNABLES.
	 *
	 * Le paramètre PRÉSENT ouvre le choix — la lecture que `RG-REF-01` autorise, et
	 * la seule qui n'invente rien : la vue ne sait rendre que deux états ici. Sa
	 * VALEUR, quand elle nomme un gabarit connu, est rendue pour qu'il soit
	 * présélectionné.
	 */
	const templateDemande = url.searchParams.get('template');

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-17, et il ne porte que ce qui est VRAI de cette
		 * adresse : l'entrée est une création vierge.
		 *
		 * Les deux autres leviers — `sv` et `c-doublon` — décrivent ce qui arrive
		 * PENDANT la rédaction : les poser depuis le serveur peindrait un
		 * enregistrement en échec sur un écran qui n'a rien enregistré (`P-02`).
		 */
		vecteur: { cas: templateDemande === null ? 'vierge' : 'template' },
		templateDemande,
		notes: creation.notes,
		typesNote: creation.referentiels.typesNote,
		typesFiche: creation.referentiels.typesFiche,
		templates: creation.referentiels.templates,
		dossiersParDomaine: await lireLArborescenceDeChoix(base)
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { base, contexte: lecture } = await contexte();
		/* PORTE 1 — le refus est le MÊME que celui du chargeur, et il vient du même
		   appel : il n'existe pas une règle de droit pour lire et une autre pour
		   écrire. Rien du corps soumis n'a encore été lu. */
		const acces = await resoudreLaCreationDeNote(base, locals.identite, lecture);
		if (!acces.trouve) error(404, await refusDEcriture(base, locals.identite));

		const lue = lireLaSaisie(await request.formData());
		if (!lue.ok) return fail(400, { motif: lue.motif });

		/* PORTE 2 — la cible, puis le droit SUR ELLE. Les deux refus sont un seul
		   octet : une cible qui n'existe pas et une cible interdite ne se
		   distinguent pas (`RG-ACC-04`, `ADR-007`).

		   LE TYPE DE FICHE NE PASSE PAS PAR CETTE PORTE, et c'est délibéré : ce
		   n'est pas un rangement, aucun droit ne le protège, et le référentiel
		   est administrable. Le rendre en 404 nommait une note introuvable là où
		   c'est un type qui manque, et faisait perdre le brouillon entier. Le
		   refus est celui que `/notes/{id}/modifier` rend déjà pour le même
		   geste — un 400 nommé, l'écran reste. */
		const resolution = await resoudreLaCible(base, lue.saisie);
		if (resolution.sort === 'fiche-introuvable') {
			return fail(400, { motif: 'type de fiche introuvable' });
		}
		/* UNE PROPRIÉTÉ OBLIGATOIRE SANS VALEUR PASSE PAR LA MÊME PORTE, et pour
		   les mêmes raisons : la note n'est pas en cause, le brouillon reste, et
		   le rédacteur peut corriger sur place. Le refus NOMME ce qui manque —
		   `manquements` pour la phrase, les clés pour le foyer, `BRIEF-VUES.md:973`
		   demandant le signalement à l'endroit du champ. */
		if (resolution.sort === 'proprietes-manquantes') {
			return fail(400, {
				motif: MOTIF_DE_PROPRIETE_OBLIGATOIRE,
				manquements: resolution.manquantes.map((p) => p.nom),
				proprietesManquantes: resolution.manquantes.map((p) => p.cle)
			});
		}
		if (resolution.sort === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		const cible = resolution.cible;
		if (!(await peutEcrireSurLeDossier(base, locals.identite, cible.dossierId))) {
			error(404, MESSAGE_INTROUVABLE);
		}

		let identifiant: string;
		try {
			const fait = await creerUneNote(base, moteurPartage(), {
				saisie: lue.saisie,
				cible,
				identite: locals.identite,
				maintenant: lecture.maintenant
			});
			if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
			identifiant = fait.ressource.identifiant;
		} catch (cause) {
			/* PORTE 3 — un corps mal formé est REFUSÉ, jamais réparé (`ADR-003`), et
			   le refus porte ses manquements : c'est ce que l'écran d'erreur de V-17
			   a vocation à montrer, et c'est la forme que `/notes/{id}/modifier`
			   emploie déjà. */
			if (cause instanceof DocumentInvalide) {
				return fail(422, {
					motif: 'document refusé',
					manquements: cause.manquements.map((m) => `${m.chemin} : ${m.message}`)
				});
			}
			if (cause instanceof MarkdownInvalide) {
				return fail(422, { motif: 'markdown refusé', manquements: [cause.message] });
			}
			throw cause;
		}

		/* La redirection est HORS du `try` : `redirect()` lève, et une redirection
		   avalée par le filet à erreurs ci-dessus rendrait un 422 sur une note
		   pourtant écrite. */
		redirect(303, adresseDeNote(identifiant));
	}
};
