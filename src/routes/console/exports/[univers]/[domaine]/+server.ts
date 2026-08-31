/**
 * `/console/exports/{univers}/{domaine}` — LE TÉLÉCHARGEMENT DE L'ARCHIVE. « Aucune
 * vue » ; un domaine se désigne par sa forme canonique (§2.2).
 *
 * RG-M13-03 — « L'EXPORT EST RÉSERVÉ AUX ADMINISTRATEURS », VÉRIFIÉ ICI, et la garde
 * n'est pas réécrite : `accesALaConsole()` emprunte son verdict à `perimetreDeLecture()`,
 * l'unique écriture de `RG-DRO-03`. L'ANONYME NE PARVIENT PAS JUSQU'ICI, `garde.ts`
 * redirigeant sur le préfixe de console avant toute résolution (`ARB-052`).
 *
 * LE CONNECTÉ SANS LE DROIT REÇOIT 404 SANS MESSAGE, exactement comme si le domaine
 * n'existait pas, et L'ORDRE DES CONTRÔLES NE LES DISTINGUE PAS : le droit est examiné
 * AVANT la base, de sorte qu'un non-administrateur n'apprenne pas même par la latence si
 * le domaine existe.
 *
 * La réponse porte l'archive sous le nom que le gel écrit ; le rapport de conversion est
 * DANS l'archive, son décompte annoncé en tête de réponse, et aucune valeur n'est
 * simulée (`P-02`).
 */
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { basePartagee } from '$lib/base/acces';
import { accesALaConsole } from '$lib/donnees/consoles';
import { lireLeDomaineAExporter } from '$lib/donnees/export';
import { MESSAGE_INTROUVABLE, lireDomaineParIdentifiants } from '$lib/donnees/rangement';
import { exporterLeDomaine, nomDArchive } from '$lib/export/archive';
import { racineDesFichiers } from '$lib/fichiers/entrepot';
import { TYPE_MEDIA_DE_ZIP } from '$lib/export/zip';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	/* RG-M13-03, avant toute lecture : le droit d'abord, la ressource ensuite. */
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);

	const base = basePartagee();
	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	if (domaine === null) error(404, MESSAGE_INTROUVABLE);

	/* Les deux identifiants viennent de l'ADRESSE, et c'est exact : la requête
	   ci-dessus a joint les deux tables sur eux. `DomaineResolu` ne les porte pas,
	   et il n'y a pas lieu de les relire. */
	const lu = await lireLeDomaineAExporter(
		base,
		{ identifiant: params.univers, nom: domaine.universNom },
		{ id: domaine.id, identifiant: params.domaine, nom: domaine.nom },
		/* Les octets des pièces jointes viennent de l'entrepôt (`T-026`) : le gel
		   promet « les images et pièces jointes inclus dans un dossier voisin »
		   (`V-36:2932`), et l'archive les y met désormais pour de bon. */
		() => racineDesFichiers(env)
	);
	const produit = exporterLeDomaine(lu.domaine, lu.avertissements);
	const nom = nomDArchive(params.domaine, new Date().toISOString());

	return new Response(produit.octets, {
		status: 200,
		headers: new Headers({
			'content-type': TYPE_MEDIA_DE_ZIP,
			'content-length': String(produit.octets.length),
			'content-disposition': 'attachment; filename="' + nom + '"',
			/* Une archive n'est jamais servie depuis un cache partagé : elle porte
			   tout le contenu interne d'un domaine. */
			'cache-control': 'no-store',
			'x-notes-exportees': String(produit.rapport.notesExportees),
			'x-notes-ignorees': String(produit.rapport.notesIgnorees),
			'x-avertissements': String(produit.rapport.avertissements.length)
		})
	});
};
