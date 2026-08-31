/**
 * LE CHARGEUR DE `/` — une adresse, deux branches : V-01 Accueil public sans
 * session, V-07 Accueil contributeur avec. La route est une, donc le chargeur est un.
 *
 * CE FICHIER NE DÉCIDE RIEN : il lit l'identité que `src/hooks.server.ts` a posée,
 * appelle `$lib/donnees/accueil`, et rend ce qu'il en reçoit. Aucune comparaison de
 * visibilité, de statut, de rôle ou de droit ne s'écrit ici.
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, ET NULLE PART AILLEURS : la couche de lecture
 * le reçoit en paramètre pour rester reproductible. LES SEUILS VIENNENT DE LA BASE,
 * jamais d'une constante — `P-01` veut une seule définition de la fraîcheur.
 *
 * AUCUN `<svelte:head>`, aucun titre, aucune redirection : `/` est une adresse
 * publique au sens de `src/lib/auth/garde.ts` ; sans session elle sert l'espace
 * public, ce qui est exactement `RG-ACC-02`.
 */
import { basePartagee } from '$lib/base/acces';
import { lireAccueil } from '$lib/donnees/accueil';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE, PAS D'UNE CONSTANTE : c'est
 * la clé `portail_assistance` de la table `parametres` (M14.7), « adresse externe
 * configurée en console », lue par `lireConfiguration()`.
 *
 * ELLE NE COÛTE AUCUNE REQUÊTE DE PLUS : `lireSeuils()` appelait déjà
 * `lireConfiguration()` et n'en gardait que deux nombres. Une requête au lieu de
 * deux, et `P-01` reste tenue — les seuils sortent toujours du même endroit.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const config = await lireConfiguration(base);
	const seuils = { frais: config.seuilFrais, vieillissant: config.seuilVieillissant };
	const accueil = await lireAccueil(base, locals.identite, { maintenant: new Date(), seuils });

	/* L'ÉTAT « BASE VIDE » — POUR L'ADMINISTRATEUR SEUL, ET C'EST CE QUI LE REND
	 * VRAI. Un périmètre vide n'est pas une base vide : un lecteur au périmètre
	 * étroit lit zéro note sur une base qui en porte trente-deux. L'argument ne
	 * couvre pas l'administrateur — `RG-DRO-03` lui rend le périmètre TOTAL, donc
	 * zéro note lue EST une base vide, et l'affirmation gelée « Votre base ne
	 * contient encore aucune note » devient exacte pour lui.
	 *
	 * Sans ce partage, le bloc d'amorçage et ses deux boutons ne s'affichaient
	 * JAMAIS, pas même sur l'instance neuve pour laquelle ils sont dessinés. */
	const administrateur =
		locals.identite.type === 'authentifie' && locals.identite.role === 'administrateur';
	const baseVide = administrateur && accueil.session && accueil.notes.length === 0;

	/* ET LE PANNEAU REÇOIT AUSSI LE FAIT, PAS SEULEMENT L'ÉTAT. Les deux gestes de
	 * l'écran d'amorçage sont gardés par la capacité d'écriture, qui vaut faux sur
	 * une instance neuve : le bloc d'actions sortait vide sous un texte qui conseille
	 * de rapatrier. La suite vraie, à zéro univers, est la console, et V-07 ne peut
	 * la proposer qu'à l'administrateur. */
	return {
		...accueil,
		...(baseVide ? { vecteur: { etat: 'vide', administrateur } } : {}),
		portail: config.portailAssistance
	};
};
