/**
 * `/console/exports` — LE CHARGEUR de V-36.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts` ; le seul
 * `error(404, MESSAGE_INTROUVABLE)` du fichier est SANS MESSAGE (`ADR-007`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN, PAS LE TRAITEMENT — L'ARCHIVE N'EST PAS PRODUITE
 *
 * `T-045` porte la production de l'archive, et il n'est pas livré. Aucune table
 * n'enregistre d'export passé. L'écran présente le PÉRIMÈTRE exportable — les
 * domaines et ce qu'ils contiennent —, jamais un export accompli, et rien n'est
 * simulé : la lacune est recensée dans `MESURES_DE_CONSOLE_SANS_CONTREPARTIE`.
 *
 * CE QUE LA VUE REÇOIT, ET POURQUOI LE NOM D'ARCHIVE EN FAIT PARTIE.
 * `notes`, `univers`, `domaines` et `compte` viennent de la base depuis la
 * réparation de la coquille de console. Restait `DATE_REFERENCE`, importée au
 * niveau du module de `V-36` : l'écran annonçait le nom de l'archive comme
 * `{ardoise du nom}-2026-08-13.zip`, quand le fichier obtenu porte
 * l'IDENTIFIANT du domaine et la date du jour. Un nom de fichier annoncé que
 * l'utilisateur n'obtenait jamais.
 *
 * LE NOM ANNONCÉ EST DÉSORMAIS PRODUIT PAR SA SOURCE — `nomDArchive()` de
 * `$lib/export/archive.ts`, la fabrique que le point de téléchargement appelle
 * lui-même. Le recomposer ici, fût-ce à l'identique, laisserait les deux
 * définitions diverger sans que rien ne le dise.
 *
 * LA DATE EST CELLE DE LA REQUÊTE DE PAGE, celle du fichier sera celle de la
 * requête de téléchargement : une page laissée ouverte d'un jour sur l'autre
 * annoncerait la veille. C'est la seule marge qui reste, et elle est bornée à
 * la journée.
 *
 * `/console/exports/{univers}/{domaine}` EST MONTÉE DEPUIS `T-053`, et le motif
 * qui la retenait est levé : la monter sans l'archive « reviendrait à servir une
 * archive qui n'existe pas », or l'archive existe — `src/lib/export/archive.ts`,
 * et son aller-retour est éprouvé sur le domaine entier. `docs/routes.md` §3.6 la
 * déclare comme « aucune vue — téléchargement de l'archive » : c'est un
 * `+server.ts`, et cette vue-ci n'y renvoie toujours pas — le bouton du gel est
 * une minuterie, et `ARB-011` interdit de rendre une transition. La redirection de l'anonyme sur
 * cette adresse est, elle, déjà décidée sur le préfixe par `src/lib/auth/garde.ts`
 * (`ARB-052`, `ARB-057`), et la batterie 6 la mesure comme un couple indiscernable
 * prouvé — l'un des deux seuls du dépôt.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	contexteDeRequete,
	lireLesDesignationsDeDomaine,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import { nomDArchive } from '$lib/export/archive';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	const designations = await lireLesDesignationsDeDomaine(base);
	const maintenant = new Date().toISOString();

	return {
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		designations,
		/* Le nom du fichier tel que le point de téléchargement le nommera — la
		   même fabrique, les mêmes deux valeurs, aucune recomposition. */
		nomsDArchive: Object.fromEntries(
			Object.entries(designations).map(([nom, canonique]) => [
				nom,
				nomDArchive(canonique.domaine, maintenant)
			])
		)
	};
};
