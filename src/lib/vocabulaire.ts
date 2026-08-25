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
 * CE QUE CE MODULE A CESSÉ D'ÊTRE — LE DÉFAUT RÉPARÉ
 *
 * Il portait QUATRE CONSTANTES calculées À L'IMPORT depuis `CONFIG.motFiche`
 * de `seeds/corpus.ts`. La clé `mot_fiche` existe en base, la console l'écrit,
 * `lireConfiguration()` la lit — et RIEN NE BRANCHAIT LA LECTURE SUR
 * L'AFFICHAGE. Renommer « Fiche » en « Modèle » depuis `/console/configuration`
 * n'avait aucun effet sur les quinze vues qui affichent le mot, ni sur la
 * pastille « Types de fiches » de la console : elles servaient toutes le mot du
 * jeu de démonstration. `RG-M14-09` (« recalcul immédiat ») était faux à la
 * lettre.
 *
 * Une constante de module ne peut pas suivre une configuration : elle est
 * figée au chargement du module, partagée par toutes les requêtes du serveur.
 * Le mot descend donc désormais par le CONTEXTE DE COQUILLE, posé une seule
 * fois par `src/routes/+layout.svelte` à partir de la table `parametres`, et
 * lu par `vocabulaireRendu()` — le même canal que `compte`, `univers`,
 * `domaines` et `version`, pour la même raison (`$lib/coquille/identite.ts`).
 *
 * LES QUATRE FORMES DESCENDENT DÉJÀ DÉRIVÉES, et c'est délibéré : porter le
 * mot brut obligerait dix-sept composants à rappeler `pluriel()` et
 * `initialeMinuscule()` chacun de son côté, donc à recopier dix-sept fois une
 * dérivation dont ce module est la seule source.
 *
 * HORS GABARIT RACINE — le rendu par défaut d'une vue, une planche —
 * `getContext` rend `undefined` et les quatre formes valent `Fiche`, `fiche`,
 * `Fiches`, `fiches` : exactement les littéraux d'avant, au caractère près.
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

/** Les quatre formes d'un mot saisi — la dérivation du gel, faite une fois. */
export function formesDuMot(saisi: string): VocabulaireRendu {
	const fiche = motConfigure(saisi);
	const ficheMin = initialeMinuscule(fiche);
	return { fiche, ficheMin, fiches: pluriel(fiche), fichesMin: pluriel(ficheMin) };
}

/**
 * CE QUE LE MOT VAUT QUAND AUCUNE CONFIGURATION NE LE DIT — `Fiche`, et ses
 * trois autres formes. C'est le repli du gel (`V-33:3144`), et c'est aussi le
 * défaut de la base (`CONFIGURATION_PAR_DEFAUT.motFiche`) : les deux disent le
 * même mot, et ce module ne le choisit pas deux fois.
 */
export const VOCABULAIRE_PAR_DEFAUT: VocabulaireRendu = formesDuMot('');

/**
 * LE MOT DE L'INSTANCE, LU SUR LE CONTEXTE DE COQUILLE.
 *
 * À appeler à l'INITIALISATION d'un composant, comme tout `getContext`. Le
 * résultat porte des ACCESSEURS et non quatre chaînes figées : le contexte du
 * gabarit racine est lui-même fait d'accesseurs, et une lecture sous `$derived`
 * suit donc un changement de configuration sans que le contexte soit réémis.
 *
 * Hors gabarit racine — le rendu par défaut d'une vue, une planche, une page
 * d'erreur rendue sans données de gabarit — `getContext` rend `undefined` et
 * les quatre formes sont celles de `VOCABULAIRE_PAR_DEFAUT`.
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
