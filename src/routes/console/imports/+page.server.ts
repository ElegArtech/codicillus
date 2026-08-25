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
 * ET LA VUE A DÉSORMAIS UNE PRISE POUR LE DIRE. Elle n'en avait aucune, et
 * l'écran servait donc un tableau vide sous deux phrases du gel qui affirment le
 * contraire — « les rapports restent consultables indéfiniment », « chaque lot
 * conserve son rapport ». Un tableau vide n'affirme rien de faux ; SOUS CES DEUX
 * PHRASES, il dit « aucun import n'a eu lieu » là où la vérité est « rien n'est
 * conservé ». Ce chargeur passe `journalEnregistre`, DÉRIVÉ du recensement par
 * `journalDImportsEnregistre()` — jamais décidé ici —, et l'écran dit ce qui est
 * vrai. C'est le geste qu'`etatDesDonnees()` fait déjà pour V-34.
 *
 * `RG-M12-09` N'EST PAS TENUE POUR AUTANT, et il faut le dire net : ni le
 * stockage de l'entrée de journal, ni sa reprise par le flux d'activité de
 * l'accueil. La table reste un lot à mandater, avec son écran de lot et son
 * plafond d'erreurs PAR LOT — la règle interdisant toute purge dans le temps.
 *
 * `/console/imports/{lot}` N'EST PAS MONTÉE, ET C'EST DÉLIBÉRÉ. Elle est
 * déclarée par `docs/routes.md` §3.6, mais aucun lot n'existe en base : la
 * monter n'aurait qu'un comportement possible — 404 pour tout le monde, y
 * compris l'administrateur —, là où la source lui fait servir le rapport. Le
 * choix est déclaré au rapport plutôt que tranché ici.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	contexteDeRequete,
	journalDImportsEnregistre,
	lireLesDesignationsDeDomaine,
	resoudreLaConsole
} from '$lib/donnees/consoles';
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
		compte: acces.ressource.compte,
		/* Le journal est-il enregistré ? Le recensement le sait ; l'écran le dit. */
		journalEnregistre: journalDImportsEnregistre(),
		/* La correspondance nom d'affichage → forme canonique, pour « Ouvrir le
		   domaine » du rapport de lot — la même table qu'à `/console/exports`. */
		designations: await lireLesDesignationsDeDomaine(base)
	};
};
