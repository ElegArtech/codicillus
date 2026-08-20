/**
 * `/univers/{univers}/{domaine}/signets` — LE CHARGEUR de V-22.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE FICHIER FERME UNE FUITE MESURÉE, ET IL FAUT DIRE LAQUELLE
 *
 * `ECART-047` É-1, reproduit à la main sur le produit construit le 20 août :
 * cette adresse rendait **200 et 18 528 octets à un anonyme, sans aucun
 * cookie** — signets curatés, noms d'auteurs, arborescence complète des univers
 * et domaines, et les actions d'écriture. Et le symptôme qui nommait la cause :
 * la même adresse avec un identifiant inexistant rendait exactement les mêmes
 * octets. La route N'AVAIT PAS DE CHARGEUR, donc ne lisait pas ses paramètres,
 * donc rendait un état de maquette quoi qu'on lui demande.
 *
 * `RG-ACC-01` était en défaut — « l'anonyme ne voit jamais un contenu non
 * public : ni en navigation, ni en recherche, ni via un lien direct » — et
 * `P-09` par-dessus.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL CHEMIN DE SORTIE — ADR-007, RG-ACC-04
 *
 * Il n'y a qu'un `error(404)` dans ce fichier, sans message, et c'est délibéré.
 * Quatre raisons de refuser — segments inconnus, module Signets éteint, domaine
 * hors périmètre, et pour les deux autres adresses l'absence de droit de
 * rédaction — passent toutes par `resoudreLAccesAuxSignets()`, qui rend
 * `INTROUVABLE`, l'objet unique de `resolution.ts`. Le chargeur n'a RIEN à quoi
 * se raccrocher pour distinguer un refus d'une inexistence : la réponse est
 * identique au code, aux en-têtes et à l'octet.
 *
 * Un message passé à `error()` suffirait à casser cette propriété, puisqu'il
 * entrerait dans le corps rendu. Il n'y en a pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI
 *
 * `event.locals.identite` est posée par `src/hooks.server.ts` — jamais absente,
 * `ANONYME` à défaut. La résolution appartient à `src/lib/droits/resolution.ts`
 * (`T-011`), appelée par `src/lib/donnees/signets.ts`. Jusqu'au 20 août, AUCUNE
 * route de page ne l'appelait : c'est ce que ce lot corrige.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE CHARGEUR NE FAIT PAS
 *
 * Il ne touche pas `src/vues/V-22.svelte`, et il ne peut donc pas corriger ce
 * que la vue lit du jeu de semence : le rail, la liste des univers et des
 * domaines, le compte de l'utilisateur et la version de l'instance y sont
 * importés au niveau du module (`V-22.svelte:57`). Seules les NOTES entrent par
 * propriété, et c'est par là que la base entre. Écart déclaré au rapport du lot.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLAccesAuxSignets, vecteurDeV22 } from '$lib/donnees/signets';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const base = basePartagee();
	const acces = await resoudreLAccesAuxSignets(
		base,
		await contexteDeRequete(base),
		locals.identite,
		{ univers: params.univers, domaine: params.domaine }
	);
	if (!acces.trouve) error(404);

	return {
		vecteur: vecteurDeV22(acces.ressource.domaine, acces.ressource.ecriture),
		notes: acces.ressource.notes
	};
};
