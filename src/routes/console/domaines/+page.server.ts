/**
 * `/console/domaines` — LE CHARGEUR de V-28.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; aucune règle de droit
 * n'est écrite ici, et le seul `error(404, MESSAGE_INTROUVABLE)` du fichier est SANS MESSAGE — un
 * message entrerait dans le corps et rendrait le refus discernable (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAISAIT PAS. La rédaction précédente affirmait qu'il ne
 * pouvait « pas corriger ce que la vue lit du jeu de semence : les univers, les
 * domaines et leur détail y sont importés au niveau du module (`V-28:68`) ».
 * `V-28:98` et `:107-110` déclarent `univers?`, `domaines?`, `detailDomaines?`,
 * `compte?` en propriétés facultatives dont l'import n'est que le DÉFAUT :
 * l'affirmation était fausse, et elle coûtait un écran entier de données
 * illustratives. Les quatre sont passées.
 *
 * `modules` EST SERVI, LUI AUSSI, ET CE N'EST PAS LA MÊME CHOSE QUE LES QUATRE
 * AUTRES. C'est le catalogue des LIBELLÉS des six modules — « Notes »,
 * « Dossiers »… —, pas la liste des modules d'un domaine : aucune table ne le
 * porte, et il n'en existe qu'un. C'est un référentiel d'interface du produit,
 * pas une donnée de démonstration. Il était lu sur `seeds/corpus.ts` PAR LA VUE
 * ELLE-MÊME, en valeur par défaut d'une propriété facultative ; il est déclaré
 * ici et passé, pour que plus rien du jeu de démonstration ne descende dans
 * l'écran. Ce qui varie par domaine — quels modules sont ACTIVÉS — entre par
 * `detailDomaines`, lu dans `modules_de_domaine` (`P-04`).
 *
 * `vecteur: null` demande l'état au repos : les trois positions de l'axe
 * « Formulaire » et les deux de l'axe « Suppression » sont des états
 * d'INTERACTION, qu'aucune donnée ne détermine.
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
 * `$lib/rangement/modules.ts`. C'est le motif de `P-35` : deux copies d'un même
 * référentiel divergent en silence. Et la divergence coûterait vraiment quelque
 * chose depuis que la relecture de `f-modules` CONFRONTE chaque clé au catalogue
 * — une clé présente dans la copie qui alimente les cases et absente de celle
 * que la relecture consulte ferait refuser un module que l'écran propose.
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
	 * SUPPRIMER UN DOMAINE ET TOUT SON CONTENU — `RG-M14-02`, `03`, `04`, `05`.
	 *
	 * `sup-saisie` EST LE NOM DU GEL, pas un nom choisi : `V-28:1421` porte
	 * `input#sup-saisie`, le champ où le nom du domaine se retape. Rien ne sera à
	 * renommer le jour où le dialogue soumettra.
	 *
	 * Les deux segments désignent le domaine par sa forme CANONIQUE — univers
	 * puis domaine (`docs/routes.md` §2.2) —, parce que `RG-STR-02` rend son
	 * identifiant unique au sein de son univers seulement : un domaine ne se
	 * désigne pas par son seul nom, et deux univers peuvent en porter un
	 * homonyme.
	 *
	 * LE REFUS PORTE LE DÉCOMPTE. C'est ce qui distingue `RG-M14-02` d'une simple
	 * confirmation : l'écran doit dire ce qui sera détruit AVANT que le nom ne
	 * soit retapé, et le décompte accompagne donc les deux issues.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await supprimerUnDomaine(basePartagee(), moteurPartage(), {
			univers: String(champs.get('univers') ?? ''),
			domaine: String(champs.get('domaine') ?? ''),
			saisie: champs.get('sup-saisie')
		});
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * CRÉER UN DOMAINE — `RG-STR-02`, `RG-STR-03`, `RG-STR-06`.
	 *
	 * C'EST LE GESTE QUI MANQUAIT AU PRODUIT : aucun domaine ne pouvait naître,
	 * et sans domaine il n'y a ni dossier, ni note. `creerUnDomaine()` écrit les
	 * trois choses que la règle exige — le domaine, son dossier racine
	 * (`RG-STR-03`) et ses modules (`RG-STR-06`) — dans une seule transaction.
	 *
	 * L'UNIVERS EST DÉSIGNÉ PAR SON IDENTIFIANT, comme partout ailleurs dans la
	 * console. `#f-univers` porte le NOM d'affichage au gel (`V-28:565`, dont les
	 * options valent `u.nom`) ; la traduction est faite par la page, sur la table
	 * du chargeur. Elle l'était auparavant par l'exécutant, qui résolvait sur
	 * `univers.nom` — le seul geste de la console à ne pas employer la clé, et
	 * une requête d'enregistrement portait donc deux champs d'univers de régimes
	 * différents.
	 *
	 * UNE CLÉ DE MODULE HORS CATALOGUE FAIT REFUSER LE GESTE, ET LE REFUS LA NOMME.
	 * `modulesRetenus()` filtrait l'inconnue en silence : la création rendait 200
	 * « possible » et l'écran confirmait une écriture qu'il n'avait pas faite —
	 * un domaine né sans `dossiers` faisait ensuite rendre 404 à
	 * `…/dossiers/{domaine}` sans dire pourquoi. Le refus emprunte la forme que ce
	 * geste rend déjà pour un nom vide ou déjà pris : `fail(400)` sur un verdict
	 * `saisie-refusee`, une erreur rattachée à son champ.
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
	 * `?/supprimer`, pour la raison que ce voisin écrit : `RG-STR-02` ne rend
	 * l'identifiant unique qu'au sein de son univers.
	 *
	 * LA LISTE DE MODULES EST ÉPROUVÉE ICI AUSSI. Les deux gestes lisent le même
	 * champ ; une clé inconnue refusée à la création et acceptée à
	 * l'enregistrement serait la même perte silencieuse, un geste plus loin.
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
