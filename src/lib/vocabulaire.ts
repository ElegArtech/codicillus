/**
 * Le mot du concept renommable, et ses quatre formes rendues.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE
 *
 * `M14.7` rend UN SEUL des douze termes contractuels renommable, et il l'est
 * GLOBALEMENT, par la configuration (`CLAUDE.md` §3 ; `P-07`). Tout site qui
 * écrit le mot en dur rend ce renommage inopérant : changer le réglage ne
 * changerait rien à l'écran. `ARB-043` §4 tranche le registre — « une maquette
 * statique ne lit aucune configuration ; qu'elle écrive "Fiche" en dur
 * n'autorise rien » — et en fait une dette de PORTAGE, que le gel ne peut pas
 * arbitrer.
 *
 * Ce module est la seule source des formes rendues, comme `fraicheur.ts` est
 * la seule source du calcul de fraîcheur (`P-01`, `ADR-005`). Une seconde
 * dérivation écrite dans une vue divergerait au premier mot exotique.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA DÉRIVATION N'EST PAS INVENTÉE — ELLE EST CELLE DU GEL
 *
 * Le mot est saisi au singulier, capitalisé, dans un champ libre de la console
 * de configuration ; il se rend au singulier ET au pluriel, capitalisé ET non
 * capitalisé. Aucune source du cadrage ne dit comment passer de l'un à
 * l'autre. Le GEL, lui, le dit, et il fait autorité (ordre de préséance) :
 * `mockups/V-33-console-configuration.html:3136-3141` porte `pluriel()`, et
 * `rendreVocabulaire()` (`…:3143-3146`) porte les deux autres gestes —
 * `mot = champ("mot").value.trim() || "Fiche"` et
 * `min = mot.charAt(0).toLowerCase() + mot.slice(1)`.
 *
 * Les trois fonctions ci-dessous en sont le calque, au caractère près. Le
 * repli sur `Fiche` quand le champ est vide est du gel lui aussi : la
 * configuration ne peut pas effacer le concept.
 *
 * CE QUE LA DÉRIVATION COUVRE, ET CE QU'ELLE NE COUVRE PAS. `pluriel()` traite
 * les invariables en -s/-x/-z, les -au/-eu et les -al ; il ne traite ni les
 * mots composés, ni l'article qui les précède — « un objet », « une fiche ».
 * C'est la limite du gel, reprise telle quelle : l'élargir serait combler un
 * vide que le gel a déjà rempli à sa façon (règle de non-comblement).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LE RENDU PAR DÉFAUT EST INCHANGÉ, À L'OCTET
 *
 * `CONFIG.motFiche` vaut `'Fiche'` (`seeds/corpus.ts`). Les quatre formes
 * valent donc `Fiche`, `fiche`, `Fiches`, `fiches` — exactement les littéraux
 * qu'elles remplacent. Le banc en est le juge, et il ne bouge pas.
 */

import { CONFIG } from '../../seeds/corpus';

/** `pluriel()` du gel (`V-33:3136`), au caractère près. */
export function pluriel(mot: string): string {
	if (/[sxz]$/i.test(mot)) return mot;
	if (/(au|eu)$/i.test(mot)) return `${mot}x`;
	if (/al$/i.test(mot)) return `${mot.slice(0, -2)}aux`;
	return `${mot}s`;
}

/** Le repli du gel sur un champ vide (`V-33:3144`). */
export function motConfigure(saisi: string): string {
	return saisi.trim() || 'Fiche';
}

/** `min` de `rendreVocabulaire()` (`V-33:3145`) — l'initiale seule descend. */
export function initialeMinuscule(mot: string): string {
	return mot.charAt(0).toLowerCase() + mot.slice(1);
}

/** Singulier capitalisé — « Fiche Serveur », l'en-tête d'une section. */
export const motFiche: string = motConfigure(CONFIG.motFiche);

/** Singulier non capitalisé — « Type de fiche », au fil d'une phrase. */
export const motFicheMinuscule: string = initialeMinuscule(motFiche);

/** Pluriel capitalisé — la colonne « Fiches » d'un tableau. */
export const motFichePluriel: string = pluriel(motFiche);

/** Pluriel non capitalisé — « Types de fiches », au fil d'une phrase. */
export const motFichePlurielMinuscule: string = pluriel(motFicheMinuscule);
