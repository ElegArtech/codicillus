/**
 * LE CHARGEUR DE `/` — une adresse, deux branches.
 *
 * `docs/routes.md:98-99` : `/` rend **V-01 Accueil public** sans session et
 * **V-07 Accueil contributeur** avec session. La route est une, donc le
 * chargeur est un — c'est la raison pour laquelle les deux écrans sont câblés
 * dans le même lot.
 *
 * CE FICHIER NE DÉCIDE RIEN. Il lit l'identité que `src/hooks.server.ts` a
 * posée, appelle `$lib/donnees/accueil`, et rend ce qu'il en reçoit. Aucune
 * comparaison de visibilité, de statut, de rôle ou de droit ne s'écrit ici :
 * `src/lib/droits/resolution.ts` est l'implémentation unique, et le premier
 * défaut de la batterie 6 vient précisément de ce qu'aucune route ne l'appelait
 * (`ECART-047` É-1).
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, ET NULLE PART AILLEURS. La couche de
 * lecture le reçoit en paramètre pour rester reproductible — donc mesurable —
 * et c'est au chargeur, seul point où « maintenant » a un sens, de le fournir.
 * En service, la fraîcheur d'une note est vraie maintenant ; dans le jeu de
 * semence, elle est vraie à `DATE_REFERENCE`. Les deux affirmations sont justes
 * et ne se recouvrent pas.
 *
 * LES SEUILS VIENNENT DE LA BASE, jamais d'une constante : `seuil_frais` et
 * `seuil_vieillissant` sont des paramètres d'instance (M14), et `P-01` veut une
 * seule définition de la fraîcheur — donc aussi un seul jeu de seuils.
 *
 * AUCUN `<svelte:head>`, aucun titre, aucune redirection : `/` est une adresse
 * publique au sens de `src/lib/auth/garde.ts` ; sans session elle sert l'espace
 * public, ce qui est exactement `RG-ACC-02`.
 */
import { basePartagee } from '$lib/base/acces';
import { lireAccueil } from '$lib/donnees/accueil';
import { lireSeuils } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const seuils = await lireSeuils(base);
	return await lireAccueil(base, locals.identite, { maintenant: new Date(), seuils });
};
