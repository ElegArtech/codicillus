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
 *
 * CE QUE CE CHARGEUR REND A CHANGÉ DE VOLUME, PAS DE NATURE. Il rendait
 * `session` et `notes` ; il rend en outre, pour la branche connectée, le compte,
 * les univers, les domaines, les consultations des sept derniers jours et de la
 * semaine précédente, les anciennetés de modification, l'activité et les
 * demandes de révision — tout ce que V-07 attendait en propriété depuis `T-041`
 * sans que rien ne le lui passe. Ce fichier n'en calcule aucune : `lireAccueil`
 * les lit, bornées au périmètre autorisé, et ce chargeur les transmet.
 */
import { basePartagee } from '$lib/base/acces';
import { lireAccueil } from '$lib/donnees/accueil';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE, PAS D'UNE CONSTANTE.
 *
 * V-01 pose trois fois « Ouvrir un ticket d'assistance », et le gel dit d'où
 * l'adresse sort : « adresse externe configurée en console » (`V-04:2205`).
 * C'est la clé `portail_assistance` de la table `parametres` (M14.7), lue par
 * `lireConfiguration()` — l'unique lecture de cette table.
 *
 * ELLE NE COÛTE AUCUNE REQUÊTE DE PLUS. `lireSeuils()` appelait déjà
 * `lireConfiguration()` et n'en gardait que deux nombres ; la configuration
 * entière est désormais lue une fois, et les seuils en sont dérivés ici. Une
 * requête au lieu de deux, et `P-01` reste tenue — les seuils sortent toujours
 * du même endroit.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const config = await lireConfiguration(base);
	const seuils = { frais: config.seuilFrais, vieillissant: config.seuilVieillissant };
	return {
		...(await lireAccueil(base, locals.identite, { maintenant: new Date(), seuils })),
		portail: config.portailAssistance
	};
};
