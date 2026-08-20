/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}/dossiers/{chemin…}` — V-13.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DOSSIERS NE SONT PAS UNE TABLE PLATE
 *
 * `seeds/corpus.ts` porte le rangement d'une note en CHAÎNE — « Exploitation ›
 * Sauvegardes » — et l'arborescence s'en déduit. La base, elle, porte une table
 * `dossiers` avec un parent et une profondeur plafonnée à 10 (`RG-STR-04`,
 * contrainte `dossiers_profondeur_plafonnee`). Les deux représentations se
 * traduisent l'une dans l'autre, et c'est `src/lib/donnees/rangement.ts` qui le
 * fait, par deux fonctions pures et réciproques : `resoudreLeChemin()` descend
 * l'arborescence depuis la racine, `segmentsAffiches()` la remonte.
 *
 * TROIS REPRÉSENTATIONS DU MÊME CHEMIN, ET IL NE FAUT PAS LES CONFONDRE :
 *
 *   en base       une ligne, son parent, sa profondeur ;
 *   dans l'adresse `exploitation/sauvegardes` — identifiants lisibles, barres
 *                 obliques (`$lib/rangement/adresses`) ;
 *   à l'écran     `Exploitation › Sauvegardes` — noms, séparateur du gel, dont
 *                 les deux espaces font partie (`SEPARATEUR_DE_CHEMIN`).
 *
 * LA RACINE N'EST DANS AUCUNE DES DEUX DERNIÈRES. Un `{chemin…}` vide ne
 * désigne donc rien, et cette route rend alors le même refus que pour un chemin
 * faux : la page du dossier racine est celle du domaine, V-11. Les trois sources
 * sont citées dans l'en-tête de `rangement.ts`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DROIT EFFECTIF EST CELUI DE LA RÉSOLUTION UNIQUE
 *
 * `docs/routes.md:127` : « connecté + lecteur (écriture selon droit effectif) ».
 * L'axe « Droit effectif » de la planche a exactement les trois valeurs de
 * `DroitDeDossier` — gestionnaire, rédacteur, lecteur — et ce chargeur les
 * transmet TELLES QUELLES depuis `resoudreDroitDeDossier()`. C'est le seul
 * endroit du lot où une valeur de la maquette et une valeur du modèle de droits
 * coïncident sans traduction, et c'est pourquoi cette vue est celle dont le
 * câblage des droits est le plus complet.
 *
 * `RG-DRO-01` et `RG-DRO-05` sont donc à l'œuvre sans qu'une ligne d'ici les
 * exprime : un droit posé sur la racine d'un domaine gouverne tout son
 * sous-arbre, parce que la remontée de `resolution.ts` l'atteint depuis
 * n'importe quel descendant.
 *
 * RG-STR-06 — le module `dossiers` est EXIGÉ. Deux domaines du corpus ne
 * l'activent pas alors que la base leur donne des dossiers : « Applications »
 * (trois dossiers sous la racine) et « Migration 2026 » (un). Leurs adresses de
 * dossier ne rendent donc rien, et c'est ce qui rend cette règle éprouvée sur un
 * cas réel plutôt qu'espérée (`P-5`).
 */
import { basePartagee } from '$lib/base/acces';
import { capacites, resoudre } from '$lib/droits/resolution';
import {
	cheminAffiche,
	dossiersDuDomaine,
	droitEffectif,
	lireDomaineParIdentifiants,
	lireModulesDuDomaine,
	lireNotesLisibles,
	moduleActif,
	ouvrirLAcces,
	refuserLAdresse,
	resoudreLeChemin,
	segmentsAffiches
} from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	const modules =
		domaine === null ? new Set<never>() : await lireModulesDuDomaine(base, domaine.id);

	/* Les segments vides sont écartés : `/dossiers/` et `/dossiers//a` ne sont pas
	   des chemins plus profonds, ce sont les mêmes chemins écrits autrement. */
	const segments = params.chemin.split('/').filter((s) => s !== '');
	const dossier =
		domaine === null ? null : resoudreLeChemin(dossiersDuDomaine(acces, domaine.id), segments);

	/* Le droit est résolu AVANT le verdict, et par l'implémentation unique. La
	   fermeture par défaut de `RG-DRO-02` répond d'elle-même quand le dossier est
	   introuvable : `droitEffectif()` rend alors `null`, et `capacites(null)` met
	   toutes les capacités à faux. */
	const droit = dossier === null ? null : droitEffectif(acces, dossier.id);

	const resolution = resoudre(
		dossier,
		() => moduleActif(modules, 'dossiers') && capacites(droit).lire
	);
	if (!resolution.trouve || droit === null) refuserLAdresse(url.pathname);

	return {
		vecteur: {
			/* `dos` porte le chemin AFFICHÉ, séparateur du gel compris : c'est ce que
			   l'axe « Dossier » de la planche emploie, et ce que `segmentsDeDossier()`
			   de `$lib/rangement/adresses` sait relire. La remontée se fait sur
			   l'arborescence entière, non sur les seuls dossiers du domaine : le
			   chemin d'un dossier passe par ses ancêtres, qu'ils soient ou non dans le
			   périmètre — c'est le chemin de la ressource, pas un droit. */
			dos: cheminAffiche(segmentsAffiches(acces.dossiers, resolution.ressource.id)),
			dr: droit
		},
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte)
	};
};
