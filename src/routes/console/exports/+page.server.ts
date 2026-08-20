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
 * V-36 NE LIT QU'UNE PROPRIÉTÉ, ET C'EST `notes`. Sa propre déclaration le dit :
 * « c'est la SEULE propriété que cette vue lit : ses quatre états rendent le
 * même écran, et `etat` comme `vecteur` ne lui apprendraient rien ». Les
 * domaines et la date de référence sont importés au niveau du module
 * (`V-36:82`) : le décompte par domaine affiché reste celui du jeu de semence.
 * Écart déclaré au rapport du lot.
 *
 * `/console/exports/{univers}/{domaine}` N'EST PAS MONTÉE, ET C'EST DÉLIBÉRÉ.
 * `docs/routes.md` §3.6 la déclare comme « aucune vue — téléchargement de
 * l'archive » : la monter sans `T-045` reviendrait à servir une archive qui
 * n'existe pas, ou à inventer un refus que la source ne prévoit pas. Le choix
 * est déclaré au rapport plutôt que tranché ici. La redirection de l'anonyme sur
 * cette adresse est, elle, déjà décidée sur le préfixe par `src/lib/auth/garde.ts`
 * (`ARB-052`, `ARB-057`), et la batterie 6 la mesure comme un couple indiscernable
 * prouvé — l'un des deux seuls du dépôt.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return { notes: acces.ressource.notes };
};
