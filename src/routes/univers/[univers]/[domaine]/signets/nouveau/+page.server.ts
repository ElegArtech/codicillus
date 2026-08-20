/**
 * `/univers/{univers}/{domaine}/signets/nouveau` — LE CHARGEUR de V-23, création.
 *
 * `docs/routes.md:129` : niveau d'accès « connecté + rédacteur ». Le chargeur
 * l'exige donc, et il l'exige PAR LE MÊME CHEMIN que l'inexistence
 * (`resoudreLAccesAuxSignets(…, exigeEcriture)`) : un lecteur reçoit exactement
 * ce que reçoit une adresse qui ne désigne rien — 404, sans message, au même
 * octet. C'est `ADR-007` et `RG-ACC-04` ; ce n'est pas un régime « sans droit »,
 * qui est réservé aux ZONES d'une page qu'on a le droit d'ouvrir (`ARB-005`).
 *
 * `nouveau` est un identifiant RÉSERVÉ sous `…/signets/` (`docs/routes.md`
 * §5.4) : aucune note ne peut porter cet identifiant lisible, donc cette
 * adresse ne peut pas entrer en collision avec `…/signets/{identifiant}/…`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ACTION EXISTE, ET ELLE REFUSE AVANT D'ÉCRIRE
 *
 * `P-09` dit que l'action interdite n'est pas RENDUE. Cela ne dispense pas de
 * la REFUSER : un client peut composer la requête lui-même, et l'absence de
 * bouton n'est pas un contrôle d'accès. Le droit de rédaction est donc vérifié
 * ici, côté serveur, par `resolution.ts`, avant toute écriture.
 *
 * ET L'ÉCRITURE ELLE-MÊME N'EST PAS DE CE LOT — elle est DÉCLARÉE, non comblée.
 * Trois valeurs qu'aucune source ne donne l'en empêchent, et les inventer
 * serait le défaut de contrat que `CLAUDE.md` §2 nomme :
 *
 *   1. LE DOSSIER D'ACCUEIL. `RG-STR-03` — « toute note appartient à un
 *      dossier » — et le schéma l'impose (`notes.dossier_id`, non nul). Le
 *      formulaire gelé n'a PAS de champ dossier : il n'offre qu'un choix de
 *      domaine (`mockups/V-23-signet-formulaire.html`, formulaire unique).
 *   2. LE CORPS. `notes.corps_reference` est non nul et canonique (`ADR-003`).
 *      Le formulaire porte une description de 240 caractères ; qu'elle DEVIENNE
 *      le corps Référence est une hypothèse, pas une lecture.
 *   3. L'IDENTIFIANT LISIBLE. `RG-M12-11` le veut dérivé du titre, unique et
 *      STABLE ; la règle de désambiguïsation d'un doublon n'est écrite nulle
 *      part, et `src/lib/rangement/adresses.ts` le dit de lui-même : il n'est
 *      pas la génération d'identifiant du produit.
 *
 * S'y ajoute que le formulaire gelé ne porte NI `method` NI `action`
 * (`ARB-057` §3, cinq formulaires vérifiés) : aucune soumission ne l'atteint
 * aujourd'hui. Le poser demanderait de toucher `src/vues/V-23.svelte`, que le
 * contrat de ce lot interdit. C'est exactement la situation de `POST /connexion`
 * en `T-012` : l'action existe, elle est juste, et elle attend le lot qui
 * reliera le formulaire.
 *
 * L'appelant qui a le droit reçoit donc **501** — la réponse qui dit « pas
 * implémenté » sans rien inventer. Celui qui ne l'a pas reçoit **404**, comme
 * une adresse qui n'existe pas. La différence entre les deux est légitime : à
 * qui a le droit, la ressource n'est pas cachée.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLAccesAuxSignets, vecteurDeV23 } from '$lib/donnees/signets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const base = basePartagee();
	const acces = await resoudreLAccesAuxSignets(
		base,
		await contexteDeRequete(base),
		locals.identite,
		{ univers: params.univers, domaine: params.domaine },
		true
	);
	if (!acces.trouve) error(404);

	return { vecteur: vecteurDeV23('creation'), notes: acces.ressource.notes };
};

export const actions: Actions = {
	default: async ({ params, locals }) => {
		const base = basePartagee();
		const acces = await resoudreLAccesAuxSignets(
			base,
			await contexteDeRequete(base),
			locals.identite,
			{ univers: params.univers, domaine: params.domaine },
			true
		);
		/* Le refus est le MÊME que celui du chargeur, et il vient du même appel :
		   il n'existe pas une règle de droit pour lire et une autre pour écrire. */
		if (!acces.trouve) error(404);

		error(501, "la création d'un signet n'est pas implémentée");
	}
};
