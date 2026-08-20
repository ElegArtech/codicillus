/**
 * `/console/imports` — LE CHARGEUR de V-35.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. Le niveau est ici
 * doublement fixé : `ARB-003` rappelle que V-35 « est et reste le journal
 * transverse des imports de l'instance, de périmètre administrateur », et
 * qu'aucune route de rapport d'import n'est exposée hors console. La décision
 * est prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts` ; le seul
 * `error(404, MESSAGE_INTROUVABLE)` du fichier est SANS MESSAGE (`ADR-007`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN, PAS LE TRAITEMENT — ET LE JOURNAL EST STRUCTURELLEMENT VIDE
 *
 * Aucune table d'imports n'existe : les vingt et une tables de
 * `src/lib/base/schema.ts` n'en portent pas, et le service de conversion
 * n'existe pas (`T-042`). Il n'y a donc ni lot passé, ni rapport à ouvrir. La
 * lacune est recensée — `JOURNAL_IMPORTS` et `LOT_IMPORT` dans
 * `MESURES_DE_CONSOLE_SANS_CONTREPARTIE` — et rien n'est simulé.
 *
 * ET LA VUE N'A AUCUNE PRISE POUR LE DIRE. `src/vues/V-35.svelte` importe le
 * journal au niveau du module (`V-35:80`) : la seule propriété que ce chargeur
 * pourrait porter est `etat`, qui NOMME la zone que le banc découpe et ne change
 * rien au rendu de trois de ses quatre états. Elle n'est donc pas passée — poser
 * une clé d'état pour un banc qui ne passe pas par ici n'aurait aucun effet, et
 * l'écran reste celui du jeu de semence. Écart déclaré au rapport du lot.
 *
 * `/console/imports/{lot}` N'EST PAS MONTÉE, ET C'EST DÉLIBÉRÉ. Elle est
 * déclarée par `docs/routes.md` §3.6, mais aucun lot n'existe en base : la
 * monter n'aurait qu'un comportement possible — 404 pour tout le monde, y
 * compris l'administrateur —, là où la source lui fait servir le rapport. Le
 * choix est déclaré au rapport plutôt que tranché ici.
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

	return {
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte
	};
};
