/**
 * `/mot-de-passe-oublie` — LE CHARGEUR de V-06, étapes 1 et 2.
 *
 * `docs/routes.md:114` : niveau « anonyme », et la batterie 6 le range hors
 * matrice avec la forme **servi** pour les sept personas — une adresse de
 * récupération qui refuserait un connecté serait une porte fermée de plus.
 * `src/lib/auth/garde.ts` la classe `publique` : rien ne la redirige.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ÉTAT RENDU EST L'ÉTAPE 1, ET LES DEUX AUTRES AXES SONT VERROUILLÉS
 *
 * `vecteurDeV06Etape1()` porte le raisonnement, et il tient en une phrase :
 * la position « Identifiant inconnu » de la planche EMPILE UNE NOTIFICATION,
 * donc elle révèle qu'un compte n'existe pas. `RG-ACC-04` l'interdit, et le gel
 * l'écrit de lui-même. Aucun chemin de ce lot ne la pose.
 *
 * L'ÉTAPE 2 — « Demande envoyée » — n'est pas atteignable par l'adresse : elle
 * suit une soumission, et le formulaire gelé ne poste pas (`ARB-054` §3).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA DEMANDE N'ABOUTIT PAS, ET LA CAUSE EST UNE TABLE QUI N'EXISTE PAS
 *
 * `SANS_CONTREPARTIE_EN_BASE` de `$lib/donnees/profil` le compte : le schéma
 * porte `sessions` et `tentatives_de_connexion`, et **aucune table de jeton de
 * réinitialisation**, aucune colonne de jeton sur `comptes`. `base/**` n'est
 * pas le périmètre de ce lot : la lacune est DÉCLARÉE, pas migrée — c'est la
 * borne 4 du contrat de `T-038`.
 *
 * L'action rend donc **501**, la réponse qui dit « pas implémenté » sans rien
 * inventer, et elle la rend À TOUT LE MONDE : même code, même corps, quel que
 * soit l'identifiant saisi. Un envoi simulé, lui, aurait affiché « demande
 * envoyée » pour un courriel que personne n'a écrit — une valeur illustrative,
 * ce que `P-02` interdit.
 */
import { error } from '@sveltejs/kit';
import { vecteurDeV06Etape1 } from '$lib/donnees/profil';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ vecteur: vecteurDeV06Etape1() });

export const actions: Actions = {
	default: () => {
		/* Aucune lecture n'est faite avant de refuser, et c'est la forme la plus
		   sûre au regard de `RG-ACC-04` : sans requête, il n'y a pas d'écart de
		   temps entre un identifiant connu et un inconnu. */
		error(501, "la demande de réinitialisation n'est pas implémentée");
	}
};
