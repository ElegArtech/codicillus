/**
 * Les formes du français que le produit rend — le mot du concept renommable et ses quatre
 * formes, et L'ACCORD EN NOMBRE des noms qui suivent un compte.
 *
 * L'ACCORD EST ICI parce que `accord()` appelle `pluriel()` : les mettre dans deux modules
 * aurait fait dépendre l'un de l'autre sans que rien ne le dise. Six helpers d'accord vivaient
 * dans six vues, dont DEUX HOMONYMES DE SIGNATURES INVERSES.
 *
 * `M14.7` rend UN SEUL des douze termes contractuels renommable, et il l'est GLOBALEMENT :
 * tout site qui écrit le mot en dur rend ce renommage inopérant.
 *
 * UNE CONSTANTE DE MODULE NE PEUT PAS SUIVRE UNE CONFIGURATION : elle est figée au chargement,
 * partagée par toutes les requêtes du serveur. C'était le défaut — quatre constantes calculées
 * à l'import depuis le jeu de démonstration. Le mot descend désormais par le CONTEXTE DE
 * COQUILLE, et LES QUATRE FORMES DESCENDENT DÉJÀ DÉRIVÉES : porter le mot brut obligerait
 * dix-sept composants à rappeler `pluriel()` chacun de son côté. Hors gabarit racine,
 * `getContext` rend `undefined` et les quatre formes valent les littéraux d'avant.
 *
 * LA DÉRIVATION EST CELLE DU GEL : `V-33:3136-3146` porte `pluriel()`, le repli sur `Fiche`
 * quand le champ est vide, et l'initiale minuscule. `pluriel()` traite les invariables en
 * -s/-x/-z, les -au/-eu et les -al ; il ne traite ni les mots composés ni l'article.
 */

import { getContext } from 'svelte';
import { CLE_IDENTITE, type IdentiteDeCoquille } from './coquille/identite';

/** `pluriel()` du gel (`V-33:3136`), au caractère près. */
export function pluriel(mot: string): string {
	if (/[sxz]$/i.test(mot)) return mot;
	if (/(au|eu)$/i.test(mot)) return `${mot}x`;
	if (/al$/i.test(mot)) return `${mot.slice(0, -2)}aux`;
	return `${mot}s`;
}

/**
 * L'accord en nombre d'un nom qui suit un compte — « 1 note », « 12 notes ».
 *
 * ELLE REND LE NOM SEUL, PAS `n nom` : le formatage du NOMBRE est un autre métier, déjà fait
 * par neuf `nombreFr()` en `fr-FR`. LE ZÉRO REND LE SINGULIER, et ce n'est pas une invention :
 * tous les ternaires d'accord du dépôt emploient `> 1`, et `V-13.test.ts` gèle déjà
 * « 0 sous-dossier ».
 *
 * LE PLURIEL EXPLICITE est un mécanisme, pas un confort. Omis, il vaut `pluriel(singulier)`.
 * Il existe pour deux cas que la dérivation ne peut PAS servir : les SYNTAGMES — « note qu'ils
 * contiennent » pluralisé par `+s` donnerait « contiennents » — et LE MOT RENOMMABLE, qui a
 * DÉJÀ traversé `pluriel()` dans `formesDuMot()`.
 *
 * Le paramètre ne s'appelle pas `pluriel` : il masquerait la fonction du même nom.
 */
export function accord(n: number, singulier: string, plurielExplicite?: string): string {
	return n > 1 ? (plurielExplicite ?? pluriel(singulier)) : singulier;
}

/** Le repli du gel sur un champ vide (`V-33:3144`). */
export function motConfigure(saisi: string): string {
	return saisi.trim() || 'Fiche';
}

/** `min` de `rendreVocabulaire()` (`V-33:3145`) — l'initiale seule descend. */
export function initialeMinuscule(mot: string): string {
	return mot.charAt(0).toLowerCase() + mot.slice(1);
}

/**
 * LES QUATRE FORMES RENDUES DU MOT, telles que l'écran les emploie.
 *
 *   `fiche`     Singulier capitalisé — « Fiche Serveur », l'en-tête d'une section
 *   `ficheMin`  Singulier non capitalisé — « Type de fiche », au fil d'une phrase
 *   `fiches`    Pluriel capitalisé — la colonne « Fiches » d'un tableau
 *   `fichesMin` Pluriel non capitalisé — « Types de fiches », au fil d'une phrase
 */
export interface VocabulaireRendu {
	readonly fiche: string;
	readonly ficheMin: string;
	readonly fiches: string;
	readonly fichesMin: string;
}

export function formesDuMot(saisi: string): VocabulaireRendu {
	const fiche = motConfigure(saisi);
	const ficheMin = initialeMinuscule(fiche);
	return { fiche, ficheMin, fiches: pluriel(fiche), fichesMin: pluriel(ficheMin) };
}

/**
 * Ce que le mot vaut quand aucune configuration ne le dit — `Fiche`. C'est le repli
 * du gel et le défaut de la base : les deux disent le même mot, et ce module ne le
 * choisit pas deux fois.
 */
export const VOCABULAIRE_PAR_DEFAUT: VocabulaireRendu = formesDuMot('');

/**
 * Le mot de l'instance, lu sur le contexte de coquille. À appeler à l'INITIALISATION d'un
 * composant, comme tout `getContext`. Le résultat porte des ACCESSEURS et non quatre chaînes
 * figées : le contexte du gabarit racine est lui-même fait d'accesseurs, et une lecture sous
 * `$derived` suit donc un changement de configuration sans que le contexte soit réémis.
 */
export function vocabulaireRendu(): VocabulaireRendu {
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const formes = (): VocabulaireRendu => identite?.vocabulaire ?? VOCABULAIRE_PAR_DEFAUT;
	return {
		get fiche() {
			return formes().fiche;
		},
		get ficheMin() {
			return formes().ficheMin;
		},
		get fiches() {
			return formes().fiches;
		},
		get fichesMin() {
			return formes().fichesMin;
		}
	};
}
