/**
 * `/univers/{univers}/{domaine}/signets` — LE CHARGEUR de V-22.
 *
 * UN SEUL CHEMIN DE SORTIE — ADR-007, RG-ACC-04. Il n'y a qu'un `error(404,
 * MESSAGE_INTROUVABLE)` dans ce fichier, SANS message : quatre raisons de refuser —
 * segments inconnus, module Signets éteint, domaine hors périmètre, absence de droit de
 * rédaction — passent toutes par `resoudreLAccesAuxSignets()`. AUCUNE RÈGLE DE DROIT
 * N'EST ÉCRITE ICI, et ce chargeur ne touche ni le rail, ni les univers et domaines, ni
 * le compte : `src/vues/V-22.svelte` les importe au niveau du module.
 *
 * LES DEUX FACETTES DE L'ADRESSE — `etiquette` et `auteur` — SONT LUES, au régime de la
 * liste des notes : valeurs en OU dans une facette, en ET entre facettes, valeur vide
 * écartée, et une clé ABSENTE n'est pas posée — `exactOptionalPropertyTypes` distingue
 * l'absence de `undefined`. LE DOMAINE SERVI EST LE DOMAINE RÉSOLU, et la liste passée
 * n'a qu'un élément.
 */
import { error, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	contexteDeRequete,
	lireLeRangement,
	resoudreLAccesAuxSignets,
	resoudreUnSignet,
	vecteurDeV22
} from '$lib/donnees/signets';
import { supprimerUnSignet } from '$lib/donnees/signets-ecriture';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const acces = await resoudreLAccesAuxSignets(
		base,
		await contexteDeRequete(base),
		locals.identite,
		{ univers: params.univers, domaine: params.domaine }
	);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		vecteur: vecteurDeV22(acces.ressource.domaine, acces.ressource.ecriture),
		domaines: [acces.ressource.domaine],
		notes: acces.ressource.notes,
		retenues: retenuesDeLAdresse(url.searchParams),
		tri: ordreDeLAdresse(url.searchParams),
		/**
		 * DE QUOI RETROUVER UN SIGNET DEPUIS SA CARTE. Les deux boutons — « Modifier »,
		 * « Supprimer » — ne faisaient rien : le gel ne pose sur la carte ni
		 * identifiant ni adresse d'action, et lui en ajouter un serait toucher
		 * `src/vues/`. La carte porte en revanche le TITRE et l'ADRESSE curatée, et le
		 * couple des deux désigne le signet sans ambiguïté dans un domaine.
		 */
		signets: acces.ressource.notes
			.filter((n) => n.type === 'Signet')
			.map((n) => ({ identifiant: n.id, titre: n.titre, url: n.url ?? '' }))
	};
};

/**
 * Les deux clés de facette que V-22 déclare, dans son ordre. La liste est courte
 * et le gel n'en promet pas d'autre : inventer une troisième serait promettre un
 * filtre que la vue ne sait pas appliquer.
 */
const CLES_DE_FACETTE = ['etiquette', 'auteur'] as const;

function retenuesDeLAdresse(
	parametres: URLSearchParams
): Record<string, readonly string[]> | undefined {
	const retenues: Record<string, readonly string[]> = {};
	for (const cle of CLES_DE_FACETTE) {
		const valeurs = parametres.getAll(cle).filter((v) => v !== '');
		if (valeurs.length > 0) retenues[cle] = valeurs;
	}
	return Object.keys(retenues).length === 0 ? undefined : retenues;
}

/**
 * LES QUATRE ORDRES, ceux de la liste des notes et pas un de plus — deux listes
 * du même produit ne nomment pas leur ordre de deux façons.
 *
 * Rien n'est DESSINÉ ici : la maquette n'a `.tri` qu'en règle de feuille morte,
 * et §4.2 ne déclare pour cette route que `etiquette` et `auteur`. La clé n'est
 * atteignable que par l'adresse, et aucun balisage n'est ajouté pour la proposer.
 *
 * Une valeur inconnue est IGNORÉE, jamais refusée, et l'absence laisse la vue sur
 * l'ordre du gel.
 */
const ORDRES = ['modification', 'verification', 'consultations', 'alpha'] as const;

function ordreDeLAdresse(parametres: URLSearchParams): string | undefined {
	const demande = parametres.get('tri');
	return ORDRES.find((o) => o === demande);
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN SIGNET depuis sa carte. Le droit est celui de la lecture
	 * prolongée — `resoudreUnSignet()` exige déjà l'écriture —, et le refus est le
	 * même `404` que partout dans cette famille.
	 */
	supprimer: async ({ params, locals, request }) => {
		const base = basePartagee();
		const segments = { univers: params.univers, domaine: params.domaine };
		const brut = (await request.formData()).get('signet');
		const identifiant = typeof brut === 'string' ? brut : '';
		const acces = await resoudreUnSignet(
			base,
			await contexteDeRequete(base),
			locals.identite,
			segments,
			identifiant
		);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		const rangement = await lireLeRangement(base, segments);
		if (rangement === null) error(404, MESSAGE_INTROUVABLE);
		const fait = await supprimerUnSignet(base, moteurPartage(), identifiant, rangement.domaineId);
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, `/univers/${params.univers}/${params.domaine}/signets`);
	}
};
