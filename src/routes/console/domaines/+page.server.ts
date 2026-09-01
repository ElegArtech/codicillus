/**
 * `/console/domaines` — LE CHARGEUR de V-28. LA GARDE EST CELLE DES ONZE ADRESSES DE
 * CONSOLE : `resoudreLaConsole()` la prend, une fois pour toutes, et un non-administrateur
 * reçoit 404 V-26 — pas un refus (`P-09`, `RG-ACC-04`). Le seul `error(404, …)` est SANS
 * MESSAGE (`ADR-007`).
 *
 * `univers`, `domaines`, `detailDomaines` et `compte` SONT PASSÉES : la vue les déclare
 * facultatives, l'import du jeu de démonstration n'en étant que le DÉFAUT. `modules` EST
 * SERVI, ET CE N'EST PAS LA MÊME CHOSE : c'est le catalogue des LIBELLÉS des six modules,
 * qu'aucune table ne porte, quand ce qui varie par domaine entre par `detailDomaines`, lu
 * dans `modules_de_domaine` (`P-04`).
 *
 * `vecteur: null` demande l'état au repos : les positions des axes « Formulaire » et
 * « Suppression » sont des états d'INTERACTION.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { creerUnDomaine, modifierUnDomaine, supprimerUnDomaine } from '$lib/donnees/administration';
import {
	CHAMP_COULEUR,
	CHAMP_DESCRIPTION,
	CHAMP_DOMAINE_CIBLE,
	CHAMP_MODULES,
	CHAMP_NOM,
	CHAMP_UNIVERS_CIBLE,
	CHAMP_UNIVERS_DE_RATTACHEMENT,
	modulesDuChamp,
	refusDeModuleInconnu,
	texteDuChamp
} from '$lib/console/structure';
import {
	accesALaConsole,
	contexteDeRequete,
	lireLeDetailDesDomaines,
	lireLesDesignationsDeDomaine,
	lireLesDesignationsDUnivers,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { CATALOGUE_DE_MODULES } from '$lib/rangement/modules';

/**
 * LE CATALOGUE DES SIX MODULES ACTIVABLES SUR UN DOMAINE — LU, JAMAIS RECOPIÉ.
 *
 * Il était déclaré ici, mot pour mot identique à celui de
 * `$lib/rangement/modules.ts` : deux copies d'un même référentiel divergent en
 * silence (`P-35`). Et la divergence coûterait, depuis que la relecture de
 * `f-modules` CONFRONTE chaque clé au catalogue — une clé présente dans la copie
 * qui alimente les cases et absente de celle que la relecture consulte ferait
 * refuser un module que l'écran propose.
 */

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		vecteur: null,
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		detailDomaines: await lireLeDetailDesDomaines(base),
		modules: CATALOGUE_DE_MODULES,
		designations: await lireLesDesignationsDeDomaine(base),
		/* L'IDENTIFIANT D'UN UNIVERS PAR SON NOM D'AFFICHAGE — la même table que
		   `/console/univers` emploie déjà, et pour la même raison : le `<select>`
		   de rattachement porte le nom, les deux gestes exigent l'identifiant, et
		   la correspondance est LUE, jamais dérivée du nom. */
		designationsUnivers: await lireLesDesignationsDUnivers(base)
	};
};

/** La garde des onze adresses, appliquée à l'action — voir `/console/univers`. */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN DOMAINE ET TOUT SON CONTENU — `RG-M14-02` à `05`.
	 *
	 * `sup-saisie` EST LE NOM DU GEL, pas un nom choisi : `V-28:1421` porte
	 * `input#sup-saisie`, le champ où le nom du domaine se retape.
	 *
	 * Les deux segments désignent le domaine par sa forme CANONIQUE — univers puis
	 * domaine — parce que `RG-STR-02` rend son identifiant unique au sein de son
	 * univers seulement : deux univers peuvent en porter un homonyme.
	 *
	 * LE REFUS PORTE LE DÉCOMPTE. C'est ce qui distingue `RG-M14-02` d'une simple
	 * confirmation : l'écran doit dire ce qui sera détruit AVANT que le nom ne soit
	 * retapé, et le décompte accompagne donc les deux issues.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await supprimerUnDomaine(basePartagee(), moteurPartage(), {
			univers: String(champs.get('univers') ?? ''),
			domaine: String(champs.get('domaine') ?? ''),
			saisie: champs.get('sup-saisie'),
			/* `RG-NF-05` — l'auteur de la destruction, jusque dans la transaction. */
			identite: locals.identite
		});
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * CRÉER UN DOMAINE — `RG-STR-02`, `RG-STR-03`, `RG-STR-06`.
	 *
	 * C'EST LE GESTE QUI MANQUAIT AU PRODUIT : aucun domaine ne pouvait naître, et
	 * sans domaine il n'y a ni dossier, ni note. `creerUnDomaine()` écrit les trois
	 * choses que la règle exige — le domaine, son dossier racine et ses modules —
	 * dans une seule transaction.
	 *
	 * L'UNIVERS EST DÉSIGNÉ PAR SON IDENTIFIANT, comme partout ailleurs dans la
	 * console. `#f-univers` porte le NOM d'affichage au gel ; la traduction est
	 * faite par la page, sur la table du chargeur.
	 *
	 * UNE CLÉ DE MODULE HORS CATALOGUE FAIT REFUSER LE GESTE, ET LE REFUS LA NOMME.
	 * `modulesRetenus()` filtrait l'inconnue en silence : la création rendait 200,
	 * l'écran confirmait une écriture qu'il n'avait pas faite, et un domaine né sans
	 * `dossiers` faisait ensuite rendre 404 à `…/dossiers/{domaine}` sans dire
	 * pourquoi.
	 */
	creer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const modules = modulesDuChamp(champs, CHAMP_MODULES);
		if (modules.etat === 'cle-inconnue') return fail(400, refusDeModuleInconnu(modules.cle));

		const resultat = await creerUnDomaine(basePartagee(), {
			nom: texteDuChamp(champs, CHAMP_NOM) ?? '',
			description: texteDuChamp(champs, CHAMP_DESCRIPTION) ?? '',
			univers: texteDuChamp(champs, CHAMP_UNIVERS_DE_RATTACHEMENT) ?? '',
			couleur: texteDuChamp(champs, CHAMP_COULEUR) ?? '',
			modules: modules.etat === 'lue' ? modules.modules : []
		});
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * ENREGISTRER UN DOMAINE — `RG-STR-02`, `RG-STR-06`.
	 *
	 * LA CIBLE EST DÉSIGNÉE PAR SA FORME CANONIQUE — les deux mêmes segments que
	 * `?/supprimer` : `RG-STR-02` ne rend l'identifiant unique qu'au sein de son
	 * univers.
	 *
	 * LA LISTE DE MODULES EST ÉPROUVÉE ICI AUSSI : une clé inconnue refusée à la
	 * création et acceptée à l'enregistrement serait la même perte silencieuse, un
	 * geste plus loin.
	 */
	enregistrer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const nom = texteDuChamp(champs, CHAMP_NOM);
		const description = texteDuChamp(champs, CHAMP_DESCRIPTION);
		const rattachement = texteDuChamp(champs, CHAMP_UNIVERS_DE_RATTACHEMENT);
		const couleur = texteDuChamp(champs, CHAMP_COULEUR);
		const modules = modulesDuChamp(champs, CHAMP_MODULES);
		if (modules.etat === 'cle-inconnue') return fail(400, refusDeModuleInconnu(modules.cle));

		const resultat = await modifierUnDomaine(
			basePartagee(),
			{
				univers: texteDuChamp(champs, CHAMP_UNIVERS_CIBLE) ?? '',
				domaine: texteDuChamp(champs, CHAMP_DOMAINE_CIBLE) ?? ''
			},
			{
				...(nom === undefined ? {} : { nom }),
				...(description === undefined ? {} : { description }),
				...(rattachement === undefined ? {} : { univers: rattachement }),
				...(couleur === undefined ? {} : { couleur }),
				...(modules.etat === 'lue' ? { modules: modules.modules } : {})
			}
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
