/**
 * `/univers/{univers}/{domaine}/signets/nouveau` — LE CHARGEUR de V-23, création.
 *
 * « Connecté + rédacteur », exigé PAR LE MÊME CHEMIN que l'inexistence : un lecteur reçoit
 * exactement ce que reçoit une adresse qui ne désigne rien — 404, sans message, au même
 * octet (`ADR-007`, `RG-ACC-04`). `nouveau` est un identifiant RÉSERVÉ sous `…/signets/`.
 *
 * `ARB-062` a tranché l'identifiant lisible, `ARB-064` le reste : le signet est rangé à la
 * RACINE de son domaine, et la description saisie devient le corps Référence.
 *
 * L'ORDRE DES PORTES : le droit d'abord, par le MÊME appel que le chargeur — rien du corps
 * soumis n'est lu avant ; puis la forme ; puis l'écriture ; puis l'index ; puis `303` vers
 * la note créée. LE DOMAINE SOUMIS N'EST PAS CRU SUR PAROLE : le droit résolu est celui du
 * domaine de L'ADRESSE, et une divergence est refusée.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { DocumentInvalide } from '$lib/contenu/document';
import { MarkdownInvalide } from '$lib/contenu/markdown';
import {
	contexteDeRequete,
	lireLeRangement,
	resoudreLAccesAuxSignets,
	vecteurDeV23
} from '$lib/donnees/signets';
import { creerUnSignet, lireLaSaisieDeSignet } from '$lib/donnees/signets-ecriture';
import { adresseDeNote } from '$lib/rangement/adresses';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ params, locals }) => {
	const base = basePartagee();
	const acces = await resoudreLAccesAuxSignets(
		base,
		await contexteDeRequete(base),
		locals.identite,
		{ univers: params.univers, domaine: params.domaine },
		true
	);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	/* LE DOMAINE DE L'ADRESSE, celui dont le droit vient d'être résolu, et le seul
	   que l'action accepte à la soumission. La vue en fait le domaine pré-choisi
	   du sélecteur : sans lui, elle retombait sur le domaine du jeu de semence. */
	return {
		vecteur: vecteurDeV23('creation'),
		notes: acces.ressource.notes,
		domaine: acces.ressource.domaine
	};
};

export const actions: Actions = {
	default: async ({ params, locals, request }) => {
		const base = basePartagee();
		const segments = { univers: params.univers, domaine: params.domaine };
		/* Le refus est le MÊME que celui du chargeur, et il vient du même appel :
		   il n'existe pas une règle de droit pour lire et une autre pour écrire. */
		const acces = await resoudreLAccesAuxSignets(
			base,
			await contexteDeRequete(base),
			locals.identite,
			segments,
			true
		);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		const lue = lireLaSaisieDeSignet(await request.formData());
		if (!lue.ok) return fail(400, { motif: lue.motif });

		/* Le domaine du formulaire n'est pas cru sur parole : le signet est créé
		   dans le domaine de l'ADRESSE, celui dont le droit vient d'être résolu.
		   Un domaine soumis différent est refusé, jamais suivi. */
		const rangement = await lireLeRangement(base, segments);
		if (rangement === null) error(404, MESSAGE_INTROUVABLE);
		if (lue.saisie.domaine !== rangement.domaine.nom) {
			return fail(400, { motif: 'domaine hors de l’adresse' });
		}

		let identifiant: string;
		try {
			const fait = await creerUnSignet(base, moteurPartage(), {
				saisie: lue.saisie,
				domaineId: rangement.domaineId,
				identite: locals.identite,
				maintenant: new Date()
			});
			if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
			identifiant = fait.ressource.identifiant;
		} catch (cause) {
			/* Une description mal formée est REFUSÉE, jamais réparée (`ADR-003`). */
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

		/* Hors du `try` : `redirect()` lève, et une redirection avalée par le filet
		   ci-dessus rendrait un 422 sur un signet pourtant écrit. */
		redirect(303, adresseDeNote(identifiant));
	}
};
