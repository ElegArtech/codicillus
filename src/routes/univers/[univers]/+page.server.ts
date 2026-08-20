/**
 * LE CHARGEUR DE `/univers/{univers}` — V-10, page d'un univers.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CETTE ROUTE DÉCIDE, ET AVEC QUOI
 *
 * `docs/routes.md:124` fixe son niveau d'accès : « connecté (AU MOINS UN
 * DOMAINE LISIBLE) ». Les deux moitiés sont appliquées, et aucune n'est écrite
 * ici : la session vient de `src/hooks.server.ts` (`locals.identite`), et
 * « lisible » vient de `src/lib/droits/resolution.ts` par `capacites()`.
 * Ce chargeur ne compare aucun rôle et ne remonte aucune arborescence.
 *
 * `docs/routes.md:365`, matrice §5.5, ligne `/univers/…` : **404 V-04** en
 * anonyme, **404 V-26** en connecté sans droit, la page pour les deux autres
 * colonnes. Les deux refus passent par le même point de sortie, `ADR-007`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA VUE ACCEPTE, ET CE QUI RESTE DONC AU JEU DE SEMENCE
 *
 * `src/vues/V-10.svelte:81-84` ne déclare que deux propriétés — `vecteur` et
 * `notes` —, et le contrat de ce lot interdit de toucher `src/vues/`. Tout ce
 * que la vue lit ailleurs, elle le lit STATIQUEMENT dans `seeds/corpus.ts` :
 * `UNIVERS`, `DOMAINES`, `DETAIL_DOMAINES`, `MODULES`, `ACTIVITE`, `MOI`,
 * `INSTANCE`. Les cartes de domaine et leurs pastilles de module en font
 * partie. Ce chargeur branche donc ce qu'il peut brancher — l'univers demandé,
 * les droits d'écriture, et les notes du périmètre — et l'écart est déclaré au
 * rapport du lot plutôt que comblé par une modification de la vue.
 */
import { basePartagee } from '$lib/base/acces';
import { resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	dossiersDuDomaine,
	lireDomainesDeLUnivers,
	lireNotesLisibles,
	lireUniversParIdentifiant,
	ouvrirLAcces,
	peutEcrireDansLUn,
	refuserLAdresse
} from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const univers = await lireUniversParIdentifiant(base, params.univers);
	const domainesDeLUnivers = univers === null ? [] : await lireDomainesDeLUnivers(base, univers.id);
	const lisibles = domainesDeLUnivers.filter((d) => domaineLisible(acces, d.id));

	/* `resoudre()` rapporte « une ressource ou rien » : l'univers absent et
	   l'univers sans aucun domaine lisible rendent le MÊME objet, `INTROUVABLE`,
	   par le même retour. C'est la moitié de `RG-ACC-04` que le type garantit. */
	const resolution = resoudre(univers, () => lisibles.length > 0);
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	/* Les dossiers des seuls domaines lisibles : c'est sur eux que se lit la
	   capacité d'écriture, jamais sur l'univers entier. */
	const dossiersLisibles = lisibles.flatMap((d) =>
		dossiersDuDomaine(acces, d.id).map((ligne) => ligne.id)
	);

	return {
		/* `uni` porte le NOM, non l'identifiant d'adresse : c'est ce que l'axe
		   « Univers » de la planche emploie (`verif/scenarios/V-10.json`, valeurs
		   `Production` et `Projets`), et ce que la vue cherche dans `UNIVERS`.

		   `etat` n'est pas posé, et c'est un fait à déclarer plutôt qu'un oubli :
		   la position « sans domaine » de la planche ne peut pas être atteinte par
		   cette route, puisque zéro domaine lisible rend 404 par la ligne de §3
		   ci-dessus. Poser `etat` à `vide` serait affirmer un état que la vue
		   calculerait ensuite sur `DOMAINES` du jeu de semence, donc un affichage
		   faux. Absent, il vaut « nominal ». */
		vecteur: {
			uni: resolution.ressource.nom,
			droits: peutEcrireDansLUn(acces, dossiersLisibles) ? 'ecriture' : 'lecture'
		},
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte)
	};
};
