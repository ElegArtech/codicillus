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
 * CE QUE CE CHARGEUR RÉSOUT JUSTE ET QUE LA VUE NE PEUT PAS AFFICHER
 *
 * `src/vues/V-23.svelte` lit le signet édité PAR SON IDENTIFIANT LITTÉRAL :
 * `corpus.find((n) => n.id === 'n-sig-statut')`, avec repli sur le jeu de
 * semence. C'est le port fidèle du gel, qui nomme lui-même cette note
 * (`V-23:2723`). La conséquence est que le formulaire affiche les champs de
 * `n-sig-statut` quel que soit le signet demandé, et le contrat de ce lot
 * interdit de toucher `src/vues/**`.
 *
 * Ce chargeur ne comble pas : il résout, il refuse ce qu'il doit refuser, il
 * passe les notes RÉELLES du périmètre — et l'écart d'affichage est déclaré,
 * chiffré, au rapport du lot. Il se ferme par un lot de vue, jamais par ici.
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
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreUnSignet, vecteurDeV23 } from '$lib/donnees/signets';
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
		/* L'identifiant RÉSOLU, celui que la base porte. La vue gelée ne le lit
		   pas encore — voir l'en-tête —, et le passer plutôt que de le taire est
		   ce qui rend l'écart mesurable au lieu de le rendre invisible. */
		signet: acces.ressource.signet.id
	};
};

export const actions: Actions = {
	default: async ({ params, locals }) => {
		const base = basePartagee();
		const acces = await resoudreUnSignet(
			base,
			await contexteDeRequete(base),
			locals.identite,
			{ univers: params.univers, domaine: params.domaine },
			params.identifiant
		);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		error(501, "la modification d'un signet n'est pas implémentée");
	}
};
