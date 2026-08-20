/**
 * `/console/univers` — LE CHARGEUR de V-27, et celui qui ferme la seconde fuite.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE FICHIER FERME UNE FUITE MESURÉE, ET IL FAUT DIRE LAQUELLE
 *
 * `ECART-047` É-1, reproduit à la main sur le produit construit le 20 août :
 * cette adresse rendait **200 et 30 315 octets à n'importe quel connecté** —
 * contributeur sans droit, lecteur, rédacteur, gestionnaire. La route existait
 * sans chargeur ni garde, montée par un lot de liaison dont le périmètre les
 * excluait explicitement et le disait. Aucun contrat n'héritait de la garde :
 * c'était un trou du DAG, pas la faute d'un lot livré.
 *
 * `docs/routes.md:167` fixe l'attendu, et il est deux fois motivé : « Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus », parce que la
 * console « n'apparaît pas dans la navigation des autres profils » (`P-09`) et
 * que `RG-ACC-04` interdit que l'accès direct l'apprenne davantage.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL CHEMIN DE SORTIE — ADR-007, RG-ACC-04
 *
 * Il n'y a qu'un `error(404, MESSAGE_INTROUVABLE)` dans ce fichier, SANS MESSAGE, et c'est délibéré :
 * un message entrerait dans le corps rendu et suffirait à rendre le refus
 * discernable de l'inexistence. La décision, elle, est prise une seule fois pour
 * les onze adresses, dans `src/lib/donnees/consoles.ts`, qui rend `INTROUVABLE`
 * — l'objet unique de `resolution.ts`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI
 *
 * `event.locals.identite` est posée par `src/hooks.server.ts` — jamais absente,
 * `ANONYME` à défaut. Le rôle est éprouvé par `resolution.ts` (`T-011`), appelé
 * par `consoles.ts` : voir son en-tête pour le motif du détour par
 * `perimetreDeLecture()` plutôt qu'une comparaison de rôle recopiée ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE CHARGEUR NE FAISAIT PAS, ET POURQUOI IL LE FAIT DÉSORMAIS
 *
 * La rédaction précédente affirmait : « il ne peut pas corriger ce que la vue
 * lit du jeu de semence : les univers, les domaines, le compte de l'utilisateur
 * et la version de l'instance y sont importés au niveau du module (`V-27:71`).
 * Seules les NOTES entrent par propriété. »
 *
 * C'ÉTAIT FAUX, et la ligne citée le dit elle-même : `V-27:71` est un `import`
 * qui sert de VALEUR PAR DÉFAUT, et `V-27:96-101` déclare `univers?`,
 * `domaines?`, `compte?`, `instance?` en propriétés facultatives. Il n'y avait
 * rien à corriger dans la vue : il fallait passer les propriétés. La liste des
 * univers affichée par cet écran vient donc de `univers`, celle des domaines de
 * `domaines`, et l'utilisateur de la coquille du compte connecté.
 *
 * `instance` RESTE AU DÉFAUT, et c'est la seule des quatre : la version du
 * produit n'est portée par aucune des vingt et une tables du schéma. La lacune
 * est déclarée au rapport, pas comblée.
 *
 * `vecteur: null` demande l'état au repos : panneau de formulaire fermé, aucun
 * dialogue de suppression ouvert. Les trois positions de l'axe « Formulaire » et
 * les trois de l'axe « Suppression » sont des états d'INTERACTION, qu'aucune
 * donnée ne détermine ; les faire dépendre de la base serait un comblement.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { supprimerUnUnivers } from '$lib/donnees/administration';
import {
	accesALaConsole,
	contexteDeRequete,
	lireLesDesignationsDUnivers,
	resoudreLaConsole
} from '$lib/donnees/consoles';
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
		designations: await lireLesDesignationsDUnivers(base)
	};
};

/**
 * LA GARDE DES ACTIONS, ET ELLE N'EST PAS CELLE DU CHARGEUR PAR HASARD.
 *
 * `accesALaConsole()` est le prédicat unique des onze adresses — celui que
 * `resoudreLaConsole()` interroge lui-même. L'action ne passe pas par la
 * résolution complète parce qu'elle n'a pas besoin des notes ; elle passe par le
 * MÊME prédicat, et rend le MÊME `error(404, MESSAGE_INTROUVABLE)` sans message
 * (`ADR-007`, `RG-ACC-04`). `P-09` demande que l'action interdite ne soit pas
 * rendue ; cela ne dispense jamais de la refuser ici.
 */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN UNIVERS — `RG-M14-01`.
	 *
	 * Le champ `univers` porte l'IDENTIFIANT LISIBLE, celui du segment d'adresse
	 * `/univers/{univers}` (`docs/routes.md` §2.2). Le gel désigne l'univers par
	 * son nom dans une fermeture, et n'expose donc aucun nom de champ : celui-ci
	 * est DÉRIVÉ de l'adressage du produit, pas inventé — c'est la clé par
	 * laquelle toutes les autres routes désignent un univers.
	 *
	 * LES DEUX REFUS NE SONT PAS DES ERREURS DE CLIENT, ce sont les états que le
	 * dialogue de `V-27` rend. Ils sortent en `fail`, donc avec leur décompte et
	 * leur sortie proposée, jamais en exception : c'est ce contenu-là que la
	 * règle exige d'afficher.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await supprimerUnUnivers(basePartagee(), String(champs.get('univers') ?? ''));
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	}
};
