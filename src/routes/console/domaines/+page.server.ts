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
 * `modules` RESTE AU DÉFAUT, ET CE N'EST PAS LA MÊME CHOSE. `MODULES` est le
 * catalogue des LIBELLÉS des six modules — « Notes », « Arborescence de
 * dossiers »… —, pas la liste des modules d'un domaine. Aucune table ne le
 * porte, et il n'en existe qu'un : c'est un référentiel d'interface, pas une
 * donnée. Ce qui varie par domaine — quels modules sont ACTIVÉS — entre par
 * `detailDomaines`, lu dans `modules_de_domaine` (`P-04`).
 *
 * `vecteur: null` demande l'état au repos : les trois positions de l'axe
 * « Formulaire » et les deux de l'axe « Suppression » sont des états
 * d'INTERACTION, qu'aucune donnée ne détermine.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { supprimerUnDomaine } from '$lib/donnees/administration';
import {
	accesALaConsole,
	contexteDeRequete,
	lireLeDetailDesDomaines,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

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
		detailDomaines: await lireLeDetailDesDomaines(base)
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
	}
};
