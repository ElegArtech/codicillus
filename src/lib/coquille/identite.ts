/**
 * L'IDENTITÉ QUE LA COQUILLE AFFICHE — le contrat, écrit à UN SEUL endroit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE RÉPARE
 *
 * `Coquille.svelte` exige une propriété `compte` : nom, initiales, rôle,
 * domaine. Les vues de `src/vues/` la remplissent depuis `MOI` de
 * `seeds/corpus.ts` — c'est le contenu d'exemple du gel, et c'est correct pour
 * le rendu par défaut d'une vue. Mais AUCUNE route ne passait la vraie.
 * Conséquence mesurée le 21/08/2026, sur les huit pages qui montent une
 * coquille : la barre supérieure affiche « Karim Belhadj — Référent —
 * Infrastructure » quel que soit le compte connecté.
 *
 * Le même oubli cachait la console : `socle.css:397` pose
 * `.app:not([data-role="admin"]) .si-admin { display: none !important; }`, et
 * `Coquille.svelte` retombait sur `role = 'referent'`. L'entrée « Console
 * d'administration » était donc invisible à l'administrateur lui-même.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UN CONTEXTE, ET NON UNE PROPRIÉTÉ DE PLUS
 *
 * Trente `+page.svelte` devraient recopier le même passage. Recopié trente
 * fois, un contrat diverge au premier oubli — `P-35`, et le défaut se lirait
 * comme une identité juste sur une page et fausse sur la voisine. Le gabarit
 * racine le pose une fois, la coquille le lit.
 *
 * LE RENDU PAR DÉFAUT DES VUES NE BOUGE PAS. Hors application — un rendu de
 * vue sans gabarit racine —, `getContext` rend `undefined` et la coquille
 * retombe sur sa propriété. C'est ce qui garde le gel intact.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE PORTE EN PLUS DU CONTRAT : UN LECTEUR
 *
 * `organisationRendue()` lit le contexte pour les vues qui n'ont besoin QUE du
 * nom de l'organisation — les pieds publics, l'écran de connexion. Sans lui,
 * chacune recopierait le même `getContext(...)?.nomOrganisation ?? ''`, et le
 * repli hors gabarit racine serait écrit huit fois : c'est exactement la
 * divergence que `vocabulaireRendu()` évite déjà pour le mot renommable, dans
 * `$lib/vocabulaire.ts`, et pour la même raison.
 */

import { getContext } from 'svelte';
import type { VocabulaireRendu } from '../vocabulaire';

/** La clé du contexte. Une constante, jamais une chaîne recopiée. */
export const CLE_IDENTITE = Symbol.for('codicillus.identite-de-coquille');

/** Ce que la barre supérieure affiche du compte connecté. */
export interface CompteAffiche {
	readonly nom: string;
	readonly initiales: string;
	readonly role: string;
	readonly domaine: string;
}

/** Un univers, tel que le rail de navigation le nomme. */
export interface UniversDeRail {
	readonly nom: string;
	readonly couleur: string;
	readonly glyphe: string;
	readonly ordre: number;
	readonly systeme: boolean;
	readonly description: string;
}

/** Un domaine, rattaché à son univers par le nom. */
export interface DomaineDeRail {
	readonly nom: string;
	readonly univers: string;
	readonly couleur: string;
}

/**
 * LE RATTACHEMENT DU COMPTE, ET CE QUE CHACUNE DE SES CIBLES OUVRE VRAIMENT.
 *
 * `+layout.server.ts` le rend déjà nul quand le domaine de rattachement n'est
 * pas LISIBLE. Les deux booléens répondent aux deux conditions que les cibles
 * demandent EN PLUS de cette lisibilité, et qu'un verdict unique laissait
 * ouvertes : un module éteint (`RG-STR-06`), un droit qui lit sans rédiger.
 */
export interface RangementDeCoquille {
	readonly univers: string;
	readonly domaine: string;
	/** Les notes du domaine s'ouvrent — module Notes actif. */
	readonly notes: boolean;
	/** Le formulaire de signet s'ouvre — module Signets actif, et rédaction. */
	readonly signets: boolean;
}

/**
 * Le contexte lui-même. Tous les membres sont des accesseurs : le gabarit
 * racine les câble sur `data`, et la coquille suit une navigation sans qu'on
 * réémette le contexte.
 *
 * `univers` et `domaines` réparent le MÊME défaut que `compte` : le rail de
 * navigation était bâti sur les constantes de `seeds/corpus.ts`, et aucune route
 * ne passait les vraies. Un univers créé dans la console n'apparaissait donc
 * JAMAIS dans le rail — mesuré le 21/08/2026, l'univers « Organisation » était
 * absent des quatre sections rendues alors qu'il portait quatorze notes.
 */
export interface IdentiteDeCoquille {
	readonly compte: CompteAffiche | null;
	readonly administrateur: boolean;
	readonly univers: readonly UniversDeRail[];
	readonly domaines: readonly DomaineDeRail[];
	/**
	 * LA VERSION DU PRODUIT, LUE SUR `package.json` — la vraie, pas celle du gel.
	 * Le pied du rail affichait `1.0.0`, qui vient de `INSTANCE` de
	 * `seeds/corpus.ts` : un numéro de démonstration, servi comme un fait.
	 * `null` hors gabarit racine (page d'erreur) : la propriété reprend la main.
	 */
	readonly version: string | null;
	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation`
	 * de `parametres`, servie par le gabarit racine.
	 *
	 * Huit vues écrivaient « Direction technique » en dur, dont LES CINQ PIEDS
	 * PUBLICS ET L'ÉCRAN DE CONNEXION. Ce n'était pas une donnée du jeu de
	 * démonstration : c'était le segment de marché du cadrage, soudé dans une
	 * signature de produit — « Codicillus · Direction technique » — que toute
	 * autre organisation lisait comme un fait sur SON instance.
	 *
	 * « Codicillus » n'est pas concerné : c'est le nom du LOGICIEL, et il reste
	 * en dur, comme `Rail.svelte` le fait déjà pour `Codicillus {version}`.
	 * C'est la SOUDURE entre le logiciel et l'organisation qu'on défait.
	 *
	 * LA CHAÎNE VIDE EST L'ÉTAT NORMAL D'UNE INSTALLATION NEUVE, pas une panne :
	 * `CONFIGURATION_PAR_DEFAUT.nomOrganisation` vaut `''` tant que
	 * l'administrateur n'a pas nommé son organisation, et les vues rendent alors
	 * « Codicillus » seul. Elle vaut `''` hors gabarit racine aussi — le rendu
	 * par défaut d'une vue, une planche, une page d'erreur —, et c'est le même
	 * rendu : il n'y a rien à distinguer, donc pas de `null` à porter.
	 */
	readonly nomOrganisation: string;
	/**
	 * L'INSTANT DE LA DERNIÈRE SYNCHRONISATION — IL N'EN EXISTE AUCUN.
	 *
	 * Aucune table de la base ne le porte (vérifié le 22/08/2026 sur les 23
	 * tables du schéma public). Le gel écrit « il y a 6 minutes » ; c'est du
	 * contenu d'exemple, et un utilisateur le lit comme un fait sur SON
	 * instance. Le champ vaut donc TOUJOURS `null` en application, et `null` est
	 * lu par son unique consommateur — le pied du tableau de bord,
	 * `src/vues/V-07.svelte` —, qui n'émet alors pas la ligne. On ne fabrique
	 * pas une date à partir de rien.
	 *
	 * Le type reste `string | null` : le jour où une table porte cet instant, le
	 * gabarit racine le sert et le pied se rallume sans rien changer ici.
	 */
	readonly synchro: string | null;
	/**
	 * LE RATTACHEMENT SERVI PAR LE GABARIT RACINE — il décide des DEUX entrées
	 * du menu « Créer » qui exigent un domaine.
	 *
	 * Elles étaient rendues par le serveur puis retirées par le câblage, après
	 * hydratation : servies quand même, et gardées par un navigateur sans script.
	 * `P-09` les veut ABSENTES. La coquille les émet donc, ou ne les émet pas.
	 *
	 * `undefined` hors gabarit racine — le rendu par défaut d'une vue, la page
	 * d'erreur : la coquille les émet alors toutes, et le gel ne bouge pas.
	 */
	readonly rangement: RangementDeCoquille | null | undefined;
	/**
	 * LE MOT RENOMMABLE DE `M14.7`, DÉJÀ DÉRIVÉ EN SES QUATRE FORMES.
	 *
	 * `$lib/vocabulaire.ts` en calculait quatre CONSTANTES à l'import, depuis
	 * `CONFIG.motFiche` de `seeds/corpus.ts`. La clé `mot_fiche` existe en base,
	 * la console l'écrit, `lireConfiguration()` la lit — et rien ne branchait la
	 * lecture sur l'affichage : renommer « Fiche » en console ne changeait rien
	 * aux quinze vues qui affichent le mot, ni à la pastille « Types de fiches »
	 * de la console. `RG-M14-09` (« recalcul immédiat ») était faux à la lettre.
	 *
	 * Une constante de module est figée au chargement et partagée par toutes les
	 * requêtes : elle ne peut pas suivre une configuration. Le contexte, lui, est
	 * fait d'accesseurs sur `data`, et il la suit.
	 *
	 * LES QUATRE FORMES DESCENDENT DÉRIVÉES, pas le mot brut : dix-sept
	 * composants rappelleraient sinon `pluriel()` et `initialeMinuscule()` chacun
	 * de son côté, et la dérivation aurait dix-sept sources au lieu d'une.
	 *
	 * `null` hors gabarit racine — le rendu par défaut d'une vue, une planche, la
	 * page d'erreur : `vocabulaireRendu()` retombe alors sur `Fiche`, exactement
	 * les littéraux d'avant.
	 */
	readonly vocabulaire: VocabulaireRendu | null;
}

/**
 * LE NOM DE L'ORGANISATION, TEL QU'UNE VUE LE REND — accesseur, pas chaîne.
 *
 * À appeler à l'INITIALISATION d'un composant, comme tout `getContext`. Le
 * résultat porte un ACCESSEUR et non une chaîne figée : le contexte du gabarit
 * racine est lui-même fait d'accesseurs, et une lecture sous `$derived` suit
 * donc un renommage fait en console sans que le contexte soit réémis. Une
 * chaîne capturée à l'initialisation serait périmée dès la première
 * invalidation — c'est le défaut que `vocabulaireRendu()` a déjà eu à réparer.
 *
 * Hors gabarit racine — le rendu par défaut d'une vue, une planche, une page
 * d'erreur rendue sans données —, `getContext` rend `undefined` et le nom vaut
 * la chaîne vide : le MÊME état que sur une instance qui ne s'est pas nommée.
 */
export function organisationRendue(): OrganisationRendue {
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	return {
		get nom() {
			return identite?.nomOrganisation ?? '';
		}
	};
}

/** Ce qu'une vue lit de l'organisation : son nom, ou rien. */
export interface OrganisationRendue {
	readonly nom: string;
}
