/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}` — V-11, page d'un domaine.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA FORME CANONIQUE, ET ELLE SEULE
 *
 * `docs/routes.md:125` : « **Forme canonique** au sens de RG-M03-02, et **seule
 * forme** publiée depuis ARB-001 ». La forme raccourcie n'existe pas, et la
 * clause de désambiguïsation de `RG-M03-02` est sans objet (`E-09`) : rien ici
 * ne peut la déclencher, et rien n'a à l'implémenter.
 *
 * `RG-STR-02` — l'unicité d'un domaine n'est portée QUE par son univers. Le
 * couple est donc résolu ENSEMBLE, par une seule requête jointe : chercher le
 * domaine d'abord puis vérifier son univers rendrait la mauvaise ligne dans le
 * cas même que la règle prévoit — deux univers ayant chacun un domaine de même
 * identifiant.
 *
 * Niveau d'accès, `docs/routes.md:125` : « connecté + lecteur ». Le droit vient
 * de `src/lib/droits/resolution.ts`, par `capacites()` ; aucune règle de droit
 * n'est écrite ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS POSITIONS DE L'AXE « PROFIL », ET D'OÙ ELLES VIENNENT
 *
 * La planche a trois positions — `referent`, `admin`, `lecteur`
 * (`verif/scenarios/V-11.json`) — là où le produit a quatre rôles (`ARB-036`) et
 * trois droits de dossier. La correspondance n'est pas devinée : elle est lue
 * dans ce que la VUE fait de cette valeur (`src/vues/V-11.svelte:98-99`), et
 * elle ne fait que deux choses — `ecriture = profil !== 'lecteur'` et
 * `admin = profil === 'admin'`. Les deux questions ont déjà une réponse
 * autorisée dans le dépôt :
 *
 *   `admin`    — `perimetreDeLecture()` rend le périmètre TOTAL au seul
 *                administrateur (`RG-DRO-03`, et `resolution.ts` l'écrit :
 *                « `tout` est réservé à l'administrateur »). La route lit donc
 *                le périmètre, et ne compare aucun rôle elle-même.
 *   `ecriture` — la colonne « créer et modifier des notes » de la table de
 *                CDC §2.3, c'est-à-dire `capacites(droit).ecrireDesNotes`.
 *
 * C'est une DÉDUCTION à partir de deux sources citées, non une décision
 * fonctionnelle : la planche n'invente pas un quatrième rôle, elle présente
 * trois combinaisons de ces deux réponses.
 */
import { basePartagee } from '$lib/base/acces';
import { resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	dossiersDuDomaine,
	lireDomaineParIdentifiants,
	lireNotesLisibles,
	ouvrirLAcces,
	peutEcrireDansLUn,
	refuserLAdresse
} from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	const resolution = resoudre(domaine, (trouve) => domaineLisible(acces, trouve.id));
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	const siens = dossiersDuDomaine(acces, resolution.ressource.id).map((ligne) => ligne.id);
	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);

	/* L'état « sans note » de la planche, décidé sur les notes RÉELLEMENT
	   lisibles de ce domaine — c'est l'état vide de `RG-M18-03`, et il n'est pas
	   simulé. La vue refait le même filtre sur la propriété `notes` qu'elle
	   reçoit (`src/vues/V-11.svelte`), de sorte que les deux ne peuvent pas se
	   contredire : elles lisent la même liste. */
	const aDesNotes = notes.some((n) => n.domaine === resolution.ressource.nom);

	return {
		vecteur: {
			/* `dom` porte le NOM : c'est ce que l'axe « Domaine » de la planche
			   emploie, et ce que la vue cherche dans `DOMAINES`. */
			dom: resolution.ressource.nom,
			role: acces.perimetre.tout
				? 'admin'
				: peutEcrireDansLUn(acces, siens)
					? 'referent'
					: 'lecteur',
			etat: aDesNotes ? 'peuple' : 'vide'
		},
		notes
	};
};
