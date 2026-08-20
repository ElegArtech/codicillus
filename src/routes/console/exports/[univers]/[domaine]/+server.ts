/**
 * `/console/exports/{univers}/{domaine}` — LE TÉLÉCHARGEMENT DE L'ARCHIVE.
 *
 * `docs/routes.md:185` l'inventorie ainsi : « *(aucune vue — téléchargement de
 * l'archive)* », exigences `UC-M13-01`, `RG-M13-01`, `RG-M13-03`, et sa source
 * d'adresse est dérivée : « le périmètre d'export est un domaine (BRIEF V-36),
 * et un domaine se désigne par sa forme canonique (§2.2) ». Elle est l'une des
 * 39 routes du §3 : la monter ne fait bouger aucun décompte.
 *
 * Elle n'était pas montée, et le chargeur de `/console/exports` disait pourquoi :
 * « la monter sans l'archive reviendrait à servir une archive qui n'existe pas ».
 * L'archive existe désormais.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * RG-M13-03 — « L'EXPORT EST RÉSERVÉ AUX ADMINISTRATEURS », VÉRIFIÉ ICI
 *
 * La garde est celle des onze adresses de console, et elle n'est pas réécrite :
 * `accesALaConsole()` de `src/lib/donnees/consoles.ts` emprunte son verdict à
 * `perimetreDeLecture()`, l'unique écriture de `RG-DRO-03`. Une seconde
 * comparaison de rôle ici serait la définition concurrente que `P-01` proscrit
 * pour la fraîcheur, transposée aux droits.
 *
 * L'ANONYME NE PARVIENT PAS JUSQU'ICI : `src/lib/auth/garde.ts` redirige sur le
 * préfixe de console, avant toute résolution (`ARB-052`), et la batterie 6 le
 * mesure sur cette adresse même.
 *
 * LE CONNECTÉ SANS LE DROIT REÇOIT 404 SANS MESSAGE, exactement comme si le
 * domaine n'existait pas — `docs/routes.md:167`, `RG-ACC-04`, `ADR-007`. Les
 * deux refus sortent par le MÊME `error(404, MESSAGE_INTROUVABLE)`, et l'ordre
 * des contrôles ne les distingue pas : le droit est examiné AVANT la base, de
 * sorte qu'un non-administrateur n'apprenne pas même par la latence si le
 * domaine existe.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA RÉPONSE PORTE, ET CE QU'ELLE NE PORTE PAS
 *
 * L'archive, en pièce à télécharger, sous le nom que le gel écrit
 * (`V-36:3061` : l'identifiant du domaine, la date, le suffixe d'archive). La
 * date est celle de la requête — c'est la seule lecture d'horloge de ce chemin,
 * et elle ne décide de rien d'autre que d'un nom de fichier.
 *
 * Le rapport de conversion est DANS l'archive (`V-36:2937`), et son décompte est
 * annoncé en tête de réponse : un client qui veut savoir avant de dézipper le
 * lit là. Aucune valeur n'est simulée — `P-02` — : le décompte vient du rapport
 * réel de l'export qui vient d'être produit.
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
