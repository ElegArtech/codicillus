/**
 * `/univers/{univers}/{domaine}/signets/{identifiant}/modifier` — LE CHARGEUR
 * de V-23, édition.
 *
 * `docs/routes.md:130` : « connecté + rédacteur », suffixe `/modifier` par
 * uniformité avec `/notes/{identifiant}/modifier`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CINQ RAISONS DE REFUSER, UN SEUL 404 — ADR-007, RG-ACC-04
 *
 * `resoudreUnSignet()` rend `INTROUVABLE` — l'objet unique et gelé de
 * `resolution.ts` — quand les segments ne désignent aucun domaine, quand le
 * module Signets y est éteint (`RG-STR-06`, `routes.md:134`), quand le domaine
 * est hors périmètre, quand le droit de rédaction manque, et quand
 * l'identifiant ne désigne aucun signet LISIBLE de ce domaine. Aucune de ces
 * cinq issues n'est distinguable des quatre autres, ni de l'inexistence : c'est
 * l'exigence, pas une commodité.
 *
 * LE SIGNET EST CHERCHÉ DANS L'ENSEMBLE DÉJÀ FILTRÉ PAR LE PÉRIMÈTRE, filtre
 * porté par la clause `where` de la requête (`ADR-006`) : une note interdite
 * n'est pas écartée après coup, elle ne remonte pas. `resoudre()` double le
 * filtre en sortie, comme son propre en-tête le demande.
 *
 * UNE NOTE QUI N'EST PAS DE TYPE « SIGNET » N'EST PAS UN SIGNET. Cette adresse
 * rend donc 404 sur une note ordinaire, sans révéler qu'elle existe — `RG-NOT-01`
 * fait du signet une note qui porte une adresse web, pas un objet séparé, mais
 * l'éditeur de signet n'édite que des signets.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA VUE AFFICHE
 *
 * Le signet résolu descend en `data.signet` et la vue le lit par cette
 * propriété : titre, adresse, description, domaine et étiquettes de l'écran en
 * sortent tous. Le sélecteur de domaine, lui, est peuplé par `page.data.domaines`
 * — les domaines RÉELS, servis par le gabarit racine.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ACTION — voir l'en-tête de `…/signets/nouveau/+page.server.ts`
 *
 * Elle refuse par le même appel que le chargeur, avant toute écriture. La
 * modification elle-même bute sur deux des trois vides énumérés là-bas — le
 * corps Référence, et le dossier d'accueil dès qu'un changement de domaine est
 * demandé, le schéma exigeant que le dossier soit du même domaine
 * (`notes_dossier_du_meme_domaine`).
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { DocumentInvalide } from '$lib/contenu/document';
import { MarkdownInvalide } from '$lib/contenu/markdown';
import {
	enregistrerUnSignet,
	lireLaSaisieDeSignet,
	supprimerUnSignet
} from '$lib/donnees/signets-ecriture';
import { moteurPartage } from '$lib/recherche/acces';
import {
	contexteDeRequete,
	lireLeRangement,
	resoudreUnSignet,
	vecteurDeV23
} from '$lib/donnees/signets';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ params, locals }) => {
	const base = basePartagee();
	const acces = await resoudreUnSignet(
		base,
		await contexteDeRequete(base),
		locals.identite,
		{ univers: params.univers, domaine: params.domaine },
		params.identifiant
	);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		vecteur: vecteurDeV23('edition'),
		notes: acces.ressource.notes,
		/* LE SIGNET RÉSOLU — celui que l'ADRESSE désigne, et non plus celui que le
		   gel nommait en dur. La vue le lit désormais par sa propriété `signet` :
		   titre, adresse curatée, description, domaine et étiquettes de l'écran
		   sortent tous de là. */
		signet: acces.ressource.signet
	};
};

export const actions: Actions = {
	/**
	 * ENREGISTRER — le titre, l'adresse curatée, la description et les
	 * étiquettes. `RG-M03-03` et `ARB-062` §2.6 : l'IDENTIFIANT NE BOUGE PAS,
	 * quoi qu'il advienne du titre.
	 *
	 * ELLE EST NOMMÉE, ET PAS PAR GOÛT : SvelteKit refuse qu'une action par
	 * défaut cohabite avec une action nommée sur la même page, et cet écran en
	 * porte deux. Le formulaire vise donc `?/enregistrer`, posé par le câblage.
	 */
	enregistrer: async ({ params, locals, request }) => {
		const base = basePartagee();
		const segments = { univers: params.univers, domaine: params.domaine };
		const acces = await resoudreUnSignet(
			base,
			await contexteDeRequete(base),
			locals.identite,
			segments,
			params.identifiant
		);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		const lue = lireLaSaisieDeSignet(await request.formData());
		if (!lue.ok) return fail(400, { motif: lue.motif });

		const rangement = await lireLeRangement(base, segments);
		if (rangement === null) error(404, MESSAGE_INTROUVABLE);

		try {
			const fait = await enregistrerUnSignet(base, moteurPartage(), {
				identifiant: params.identifiant,
				saisie: lue.saisie,
				domaineId: rangement.domaineId,
				identite: locals.identite,
				maintenant: new Date()
			});
			if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		} catch (cause) {
			if (cause instanceof DocumentInvalide) {
				return fail(422, {
					motif: 'description refusée',
					manquements: cause.manquements.map((m) => `${m.chemin} : ${m.message}`)
				});
			}
			if (cause instanceof MarkdownInvalide) {
				return fail(422, { motif: 'description refusée', manquements: [cause.message] });
			}
			throw cause;
		}
		redirect(303, `/univers/${params.univers}/${params.domaine}/signets`);
	},

	/**
	 * SUPPRIMER — atomique et définitive, il n'y a pas de corbeille
	 * (`RG-M14-03`). Le retour se fait sur la liste des signets du domaine : le
	 * signet n'existe plus, rediriger vers lui rendrait un 404.
	 */
	supprimer: async ({ params, locals }) => {
		const base = basePartagee();
		const segments = { univers: params.univers, domaine: params.domaine };
		const acces = await resoudreUnSignet(
			base,
			await contexteDeRequete(base),
			locals.identite,
			segments,
			params.identifiant
		);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		const rangement = await lireLeRangement(base, segments);
		if (rangement === null) error(404, MESSAGE_INTROUVABLE);

		const fait = await supprimerUnSignet(
			base,
			moteurPartage(),
			params.identifiant,
			rangement.domaineId
		);
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, `/univers/${params.univers}/${params.domaine}/signets`);
	}
};
