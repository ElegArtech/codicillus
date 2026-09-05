/**
 * L'IDENTITÉ QUE LA COQUILLE AFFICHE — le contrat, écrit à UN SEUL endroit.
 *
 * POURQUOI UN CONTEXTE, ET NON UNE PROPRIÉTÉ DE PLUS : trente `+page.svelte`
 * devraient recopier le même passage, et un contrat recopié trente fois diverge
 * au premier oubli (`P-35`). Sans lui, les vues remplissaient `compte` depuis
 * `MOI` de `seeds/corpus.ts`, et `socle.css` cachant `.si-admin` hors de
 * `data-role="admin"`, la console était invisible à l'administrateur lui-même.
 *
 * LE RENDU PAR DÉFAUT DES VUES NE BOUGE PAS : hors application, `getContext` rend
 * `undefined` et la coquille retombe sur sa propriété.
 */

import { getContext } from 'svelte';
import type { VocabulaireRendu } from '../vocabulaire';
import { SANS_DESIGNATION, type DesignationsDeRangement } from '../rangement/adresses';
import type { NoteDuRail as NoteDuRailPourContexte } from './arborescence';

/** La clé du contexte. Une constante, jamais une chaîne recopiée. */
export const CLE_IDENTITE = Symbol.for('codicillus.identite-de-coquille');

export interface CompteAffiche {
	readonly nom: string;
	readonly initiales: string;
	readonly role: string;
	readonly domaine: string;
	/**
	 * LE COURRIEL, SOUS LE NOM DANS LA CARTE DE COMPTE du rail. La colonne existe
	 * (`comptes.courriel`, non nulle) et n'était servie nulle part : la carte
	 * affichait un nom sans adresse, ou pire l'adresse de démonstration du gel.
	 * Chaîne vide hors gabarit racine — la carte n'émet alors pas la ligne.
	 *
	 * OPTIONNEL, ET IL DOIT L'ÊTRE : quinze vues construisent un `CompteAffiche` de
	 * rendu par défaut et ne connaissent pas de courriel. Le gabarit racine, lui, le
	 * sert toujours.
	 */
	readonly courriel?: string;
}

export interface UniversDeRail {
	readonly nom: string;
	readonly couleur: string;
	readonly glyphe: string;
	readonly ordre: number;
	readonly systeme: boolean;
	readonly description: string;
}

export interface DomaineDeRail {
	readonly nom: string;
	readonly univers: string;
	readonly couleur: string;
}

/**
 * UNE NOTE DU RAIL — le strict nécessaire pour la poser en feuille de
 * l'arborescence et pour compter. La forme est celle qu'`arborescence.ts` demande ;
 * elle n'est pas recopiée ici, elle en vient.
 */
export type { NoteDuRail } from './arborescence';

/**
 * UNE NOTE RÉCEMMENT CONSULTÉE — la section « RÉCENTS » du rail, cinq lignes.
 *
 * ELLES VIENNENT DE LA TABLE `consultations`, filtrée sur le compte connecté : le
 * gel en écrit cinq en dur, et les servir aurait annoncé à chacun les lectures d'un
 * autre. AUCUN COMPTE, AUCUNE CONSULTATION : la liste est vide et la section n'est
 * pas rendue — une zone vide n'apprend rien.
 */
export interface NoteRecente {
	/** L'identifiant lisible — `/notes/{identifiant}`. */
	readonly identifiant: string;
	readonly titre: string;
}

/**
 * LE RATTACHEMENT DU COMPTE, ET CE QUE CHACUNE DE SES CIBLES OUVRE VRAIMENT.
 * `+layout.server.ts` le rend déjà nul quand le domaine n'est pas LISIBLE ; les
 * deux booléens répondent aux conditions que les cibles demandent EN PLUS, et
 * qu'un verdict unique laissait ouvertes : un module éteint (`RG-STR-06`), un
 * droit qui lit sans rédiger.
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
 * Le contexte lui-même. Tous les membres sont des ACCESSEURS : le gabarit racine
 * les câble sur `data`, et la coquille suit une navigation sans qu'on réémette le
 * contexte. `univers` et `domaines` réparent le MÊME défaut que `compte` — le rail
 * était bâti sur les constantes de `seeds/corpus.ts`.
 */
export interface IdentiteDeCoquille {
	readonly compte: CompteAffiche | null;
	readonly administrateur: boolean;
	readonly univers: readonly UniversDeRail[];
	readonly domaines: readonly DomaineDeRail[];
	/**
	 * LES NOTES QUE LE RAIL POSE EN FEUILLES, et sur lesquelles il compte. Elles
	 * descendent d'ICI et non de la propriété `notes` des vues : chaque route y
	 * passait SON corpus — celui de la page —, et l'arbre du rail changeait donc de
	 * contenu d'un écran à l'autre. Vide hors gabarit racine.
	 */
	readonly notes?: readonly NoteDuRailPourContexte[] | undefined;
	/** Les cinq dernières notes consultées PAR CE COMPTE. Vide : pas de section. */
	readonly recents?: readonly NoteRecente[] | undefined;
	/**
	 * LA VERSION DU PRODUIT, LUE SUR `package.json` — la vraie, pas le `1.0.0` de
	 * `INSTANCE`. `null` hors gabarit racine (page d'erreur) : la propriété reprend
	 * la main.
	 */
	readonly version: string | null;
	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation`. Huit
	 * vues l'écrivaient en dur, dont les cinq pieds publics et l'écran de connexion.
	 * « Codicillus » n'est pas concerné : c'est le nom du LOGICIEL.
	 *
	 * LA CHAÎNE VIDE EST L'ÉTAT NORMAL D'UNE INSTALLATION NEUVE, pas une panne : les
	 * vues rendent alors « Codicillus » seul. Elle vaut `''` hors gabarit racine
	 * aussi — même rendu, donc pas de `null` à porter.
	 */
	readonly nomOrganisation: string;
	/**
	 * L'INSTANT DE LA DERNIÈRE SYNCHRONISATION — IL N'EN EXISTE AUCUN : aucune table
	 * ne le porte, et le « il y a 6 minutes » du gel est un contenu d'exemple qu'un
	 * utilisateur lit comme un fait sur SON instance. Le champ vaut TOUJOURS `null`
	 * en application, et le pied du tableau de bord n'émet alors pas la ligne.
	 *
	 * Le type reste `string | null` : le jour où une table le porte, le pied se
	 * rallume sans rien changer ici.
	 */
	readonly synchro: string | null;
	/**
	 * LE RATTACHEMENT SERVI PAR LE GABARIT RACINE — il décide des DEUX entrées du
	 * menu « Créer » qui exigent un domaine. Elles étaient rendues par le serveur puis
	 * retirées par le câblage après hydratation : servies quand même, et gardées par
	 * un navigateur sans script. `P-09` les veut ABSENTES. `undefined` hors gabarit
	 * racine : la coquille les émet alors toutes.
	 */
	readonly rangement: RangementDeCoquille | null | undefined;
	/**
	 * LE MOT RENOMMABLE DE `M14.7`, DÉJÀ DÉRIVÉ EN SES QUATRE FORMES.
	 *
	 * `$lib/vocabulaire.ts` en calculait quatre CONSTANTES à l'import : une constante
	 * de module est figée au chargement et partagée par toutes les requêtes, elle ne
	 * peut pas suivre une configuration, et `RG-M14-09` (« recalcul immédiat ») était
	 * faux à la lettre. Le contexte est fait d'accesseurs sur `data`.
	 *
	 * LES QUATRE FORMES DESCENDENT DÉRIVÉES, pas le mot brut : dix-sept composants
	 * rappelleraient sinon `pluriel()` chacun de son côté. `null` hors gabarit
	 * racine, où `vocabulaireRendu()` retombe sur `Fiche`.
	 */
	readonly vocabulaire: VocabulaireRendu | null;
	/**
	 * LES IDENTIFIANTS D'ADRESSE DES UNIVERS ET DES DOMAINES, PAR LEUR NOM.
	 *
	 * `univers.identifiant` et `domaines.identifiant` sont PERSISTÉS et STABLES sous
	 * les renommages (`RG-M12-11`) ; les chargeurs passent aux vues le NOM
	 * D'AFFICHAGE, que les vues slugifiaient — renommer en console rendait 404 toutes
	 * les adresses. La correspondance est LUE par le gabarit racine, dans les
	 * requêtes qu'il émettait déjà pour le rail (`P-35`).
	 *
	 * ELLE NE PORTE QUE CE QUE L'APPELANT VOIT DÉJÀ — les domaines lisibles et leurs
	 * univers, plus, pour l'administrateur seul, les univers sans domaine
	 * (`RG-ACC-01`). `undefined` hors gabarit racine : la composition retombe sur
	 * `identifiantLisible()`.
	 */
	readonly designations?: DesignationsDeRangement | undefined;
}

/**
 * LES DÉSIGNATIONS TELLES QU'UN COMPOSANT LES LIT — à appeler à l'INITIALISATION,
 * comme tout `getContext`. Le résultat porte des ACCESSEURS et non deux tables
 * figées : une lecture sous `$derived` suit donc une navigation sans que le
 * contexte soit réémis. Hors gabarit racine, les deux tables sont vides et la
 * composition retombe sur la dérivation du nom.
 */
export function designationsDeCoquille(): DesignationsDeRangement {
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	return {
		get univers() {
			return identite?.designations?.univers ?? SANS_DESIGNATION.univers;
		},
		get domaines() {
			return identite?.designations?.domaines ?? SANS_DESIGNATION.domaines;
		}
	};
}
