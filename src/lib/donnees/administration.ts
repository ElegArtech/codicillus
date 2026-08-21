/**
 * LES GESTES D'ADMINISTRATION — M14, et les huit règles que pas une ligne de
 * code ne citait.
 *
 * `pnpm verif:couverture` comptait M14 à **10 règles, 2 portées** : `RG-M14-04`
 * (le rattachement rendu vide, porté par le schéma) et `RG-M14-08` (le compte
 * désactivé, porté par l'authentification). Les huit autres n'avaient aucun
 * point d'application, et pour une raison unique et mesurable : **la console
 * n'avait aucun chemin d'écriture**. Les onze adresses de `/console/…` ne
 * portaient qu'un `load` et une garde (`T-036`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE N'INVENTE NI ÉCRAN, NI MESSAGE, NI DÉCOMPTE
 *
 * Chaque refus, chaque libellé, chaque sortie proposée est TRANSCRIT du gel, et
 * la ligne est citée à l'endroit où il est écrit. Là où le gel se tait, ce
 * module se tait aussi : il rend une donnée structurée — un motif et des
 * nombres — et laisse le rendu à la vue. C'est ce qui permet de tenir les huit
 * règles sans toucher `src/vues/`, dont la conformité au pixel est la loi du
 * projet.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA FORME : UN VERDICT PUR, PUIS UN EXÉCUTANT
 *
 * Chaque geste se lit en deux temps, et c'est le motif de `verification.ts` :
 *
 *   1. UN VERDICT — fonction PURE, sans base, sans horloge. Elle reçoit l'état
 *      mesuré et rend `possible` ou un refus motivé. C'est là que vivent les
 *      règles, et c'est là qu'elles s'éprouvent : `administration.test.ts`
 *      exerce chaque verdict dans SES DEUX POLARITÉS, sur des cas SYNTHÉTIQUES
 *      qui ne dépendent ni de la base ni du jeu de semence (`P-26`).
 *   2. UN EXÉCUTANT — il mesure l'état, appelle le verdict, et n'écrit que si
 *      le verdict est `possible`. Aucun exécutant ne réécrit une condition.
 *
 * `P-09` GOUVERNE LES QUATRE GARDES, et il est cité tel que le contrat de
 * `T-077` le formule : « une action interdite n'est pas affichée » — ce qui ne
 * dispense JAMAIS de la refuser côté serveur. Un client compose la requête
 * qu'il veut ; les verdicts sont donc éprouvés ici, en plus de ce que le gel
 * montre ou cache.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE PEUT PAS FAIRE, ET QUI EST DÉCLARÉ
 *
 * AUCUNE SOUMISSION N'ATTEINT ENCORE CES GESTES. Les onze vues de console sont
 * des transcriptions STATIQUES du gel : leurs panneaux et leurs dialogues n'ont
 * ni `method` ni `action` (`ARB-054` §3, qui l'a arbitré pour les cinq
 * formulaires du gel), et `src/vues/` est hors du périmètre de ce lot. C'est
 * exactement la situation des trois actions de `/mon-profil` (`T-049`) et des
 * trois gestes de `/notes/{identifiant}` (`T-050`) : les actions existent, elles
 * portent les noms de champ du gel, et elles attendent le lot qui reliera le
 * formulaire. Rien ne sera à renommer.
 */
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import {
	champsDeTypeDeFiche,
	CLES_DE_PARAMETRE,
	comptes,
	domaines,
	dossiers,
	notes,
	parametres,
	relations,
	templates,
	typesDeFiche,
	typesDeNote,
	typesDeRelation,
	univers
} from '../base/schema';
import { hacherMotDePasse } from '../auth/mots-de-passe';
import type { RoleDeCompte } from '../droits/resolution';
import { entretenirLIndex } from '../recherche/entretien';
import { ROLE_DEPUIS_ENUM } from './lecture';
import type { Configuration } from '../../../seeds/corpus';

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES DÉCOMPTES — ce que la base mesure, jamais ce qu'on suppose

   `P-02` sans exception : aucun de ces nombres n'est illustratif. Ils sont tous
   comptés en base au moment du geste, et un décompte qu'on ne saurait pas
   compter serait une absence déclarée, jamais un zéro.
   ═════════════════════════════════════════════════════════════════════════ */

/** Ce qu'un univers retient — `RG-M14-01`, et la liste est celle de `V-27:3555-3556`. */
export interface DecompteDUnUnivers {
	/** Les domaines rattachés à cet univers. */
	readonly domaines: number;
	/** Les notes que ces domaines contiennent. */
	readonly notes: number;
}

/**
 * Ce qu'une suppression de domaine détruit — `RG-M14-02`, « le décompte exact
 * de ce qui sera détruit (notes, fiches, signets, dossiers) ».
 *
 * LES QUATRE NOMBRES SONT CEUX DU GEL, ET DANS SON ORDRE
 * (`mockups/V-28-console-domaines.html:3209-3212`). Les deux du milieu sont des
 * SOUS-ENSEMBLES du premier — le gel les compte ainsi
 * (`:2949-2951` : `notes.length`, puis deux filtres sur ces mêmes notes) —, et
 * les additionner serait compter deux fois.
 */
export interface DecompteDUnDomaine {
	readonly notes: number;
	/** Les notes portant le type de note « Fiche » — sous-ensemble de `notes`. */
	readonly fichesTypees: number;
	/** Les notes portant le type de note « Signet » — sous-ensemble de `notes`. */
	readonly signets: number;
	/**
	 * Les dossiers, RACINE EXCLUE.
	 *
	 * La racine est une exigence de schéma — « un dossier racine par domaine, et
	 * un seul » (`base/migrations/002_socle.montee.sql:191-193`) —, elle n'a pas
	 * de parent (`:184-186`) et l'adresse ne la porte pas
	 * (`src/lib/rangement/adresses.ts`). Aucun écran ne la montre : le gel compte
	 * les segments des chemins de note (`V-28:2122-2126`), donc les dossiers tels
	 * que l'utilisateur les connaît. Compter la racine ferait dire au décompte un
	 * dossier de plus que ce que l'écran a jamais montré.
	 */
	readonly dossiers: number;
	/**
	 * Les comptes rattachés — `RG-M14-04`. Ils ne sont PAS détruits ; le gel le
	 * dit sur place (`V-28:3229-3230`), et le nombre sert à l'écrire.
	 */
	readonly comptesRattaches: number;
}

/** Ce qu'un type de fiche retient — `RG-M14-06`, décompte de `V-29:3429-3438`. */
export interface DecompteDUnTypeDeFiche {
	/** Les notes qui portent ce type. */
	readonly notes: number;
	/** Les propriétés dont les valeurs seraient perdues. */
	readonly proprietes: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LES MOTIFS — transcrits du gel, jamais rédigés ici

   Une règle qui exige un message explicite exige LE message du gel, pas un
   message de plus. Chaque constante porte sa ligne de maquette.
   ═════════════════════════════════════════════════════════════════════════ */

/** `V-27:3541` — l'univers de repli, que `RG-STR-01` rend indestructible. */
export const MOTIF_UNIVERS_SYSTEME =
	'C’est l’univers de repli du produit : quand un domaine perd son rattachement, il atterrit ici plutôt que de disparaître de la navigation. Sans lui, un domaine orphelin deviendrait invisible sans être supprimé. Vous pouvez en revanche changer sa couleur et son rang.';

/**
 * `V-27:3566` — LA SORTIE PROPOSÉE, et c'est la seconde moitié de `RG-M14-01` :
 * « le produit propose de rattacher ses domaines ailleurs ». Le refus seul ne
 * tiendrait pas la règle.
 */
export const SORTIE_RATTACHER_LES_DOMAINES =
	'Un univers ne se supprime que vide, pour qu’aucun contenu ne disparaisse par ricochet. Rattachez d’abord ses domaines ailleurs — « Non classé » convient si aucune destination ne s’impose.';

/** `V-28:1406` — `RG-M14-03`, « définitive : il n'y a pas de corbeille ». */
export const AVERTISSEMENT_DEFINITIF =
	'La suppression est définitive. Il n’y a pas de corbeille : rien de ce qui précède ne pourra être récupéré, ni par vous, ni par un administrateur.';

/**
 * `V-29:3443` — LA SORTIE PROPOSÉE de `RG-M14-06` : « propose de les
 * délester ». Comme pour l'univers, le refus sans la sortie serait une moitié
 * de règle.
 */
export const SORTIE_DELESTER_LES_NOTES =
	'Délestez d’abord ces notes : elles resteront des notes ordinaires, avec leur contenu rédigé intact, mais perdront leurs propriétés structurées et sortiront de la cartographie.';

/** `V-32:3096` — `RG-M14-07`, et il explique la sortie autant que le refus. */
export const MOTIF_DERNIER_ADMINISTRATEUR =
	'est le seul administrateur actif de l’instance. Le retirer fermerait définitivement l’accès à la console — plus personne ne pourrait créer de domaine, gérer les comptes, ni rendre ce rôle à quiconque. Nommez d’abord un second administrateur : le sélecteur se déverrouillera aussitôt.';

/**
 * `mockups/V-32-console-comptes.html:3278` — LE MOTIF DE LA DÉSACTIVATION, ET
 * IL N'EST PAS CELUI DU CHANGEMENT DE RÔLE.
 *
 * Les deux gestes retirent le dernier administrateur et se jugent par le MÊME
 * prédicat, mais le gel leur écrit deux phrases DIFFÉRENTES : celle du rôle
 * parle du sélecteur qui se déverrouillera, celle-ci d'un retour à cet écran.
 * Réutiliser l'une pour l'autre aurait donné un texte qui ne décrit pas le geste
 * qu'on refuse.
 */
export const MOTIF_DERNIER_ADMINISTRATEUR_DESACTIVATION =
	'est le seul administrateur actif. Désactiver ce compte rendrait la console inaccessible et sans recours. Nommez un second administrateur avant de revenir ici.';

/* ═══════════════════════════════════════════════════════════════════════════
   3. `RG-M14-01` — UN UNIVERS QUI CONTIENT DES DOMAINES NE SE SUPPRIME PAS
   ═════════════════════════════════════════════════════════════════════════ */

/** L'état d'un univers au moment où sa suppression est demandée. */
export interface EtatDUnUnivers {
	/** `RG-STR-01` — « Non classé » existe par défaut et ne se supprime pas. */
	readonly systeme: boolean;
	readonly decompte: DecompteDUnUnivers;
}

/** Le verdict d'une suppression d'univers — trois issues, celles de `V-27`. */
export type VerdictDUnUnivers =
	| { readonly issue: 'univers-systeme'; readonly motif: string }
	| {
			readonly issue: 'univers-non-vide';
			readonly decompte: DecompteDUnUnivers;
			readonly sortie: string;
	  }
	| { readonly issue: 'possible' };

/**
 * `RG-M14-01` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:1131`) — « Un univers
 * contenant des domaines ne peut être supprimé. Le produit propose de rattacher
 * ses domaines ailleurs. »
 *
 * LA BASE PORTAIT DÉJÀ LA MOITIÉ DE LA RÈGLE, ET CE N'ÉTAIT PAS SUFFISANT.
 * `domaines.univers_id … ON DELETE RESTRICT`
 * (`base/migrations/002_socle.montee.sql:127`) refuse la suppression — mais il
 * la refuse par une erreur de contrainte, sans décompte et sans sortie. La
 * règle demande les trois : le refus, ce qui le motive, et par où sortir.
 *
 * L'ORDRE DES DEUX REFUS EST CELUI DU GEL (`V-27:3532` puis `:3546`) : un
 * univers système peuplé se voit refuser POUR CE MOTIF-LÀ, et l'écran n'affiche
 * alors ni décompte ni sortie.
 */
export function verdictDeSuppressionDUnUnivers(etat: EtatDUnUnivers): VerdictDUnUnivers {
	if (etat.systeme) return { issue: 'univers-systeme', motif: MOTIF_UNIVERS_SYSTEME };
	if (etat.decompte.domaines > 0) {
		return {
			issue: 'univers-non-vide',
			decompte: etat.decompte,
			sortie: SORTIE_RATTACHER_LES_DOMAINES
		};
	}
	return { issue: 'possible' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. `RG-M14-02` — LE DÉCOMPTE EXACT, ET LA SAISIE DU NOM EXACT
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * LA CONFIRMATION PAR LE NOM — `RG-M14-02`, seconde moitié.
 *
 * « exige la saisie du nom exact du domaine. Le bouton reste inactif tant que la
 * saisie ne correspond pas. »
 *
 * EXACT VEUT DIRE EXACT, et le gel le commente en propres termes :
 * « Correspondance exacte, SANS TOLÉRANCE DE CASSE : le geste doit être
 * délibéré » (`V-28:3239-3240`). Aucun `trim()`, aucune normalisation
 * d'accents, aucune comparaison insensible à la casse : la moindre indulgence
 * ici ferait passer un geste que la règle veut délibéré.
 *
 * `saisie` est `unknown` parce qu'elle vient d'un formulaire : une valeur
 * absente ou multiple n'est pas une chaîne, et ne correspond donc à rien.
 */
export function nomConfirme(nom: string, saisie: unknown): boolean {
	return typeof saisie === 'string' && saisie === nom;
}

/** L'état d'un domaine au moment où sa suppression est demandée. */
export interface EtatDUnDomaine {
	readonly nom: string;
	readonly decompte: DecompteDUnDomaine;
}

/** Le verdict d'une suppression de domaine — deux issues. */
export type VerdictDUnDomaine =
	| {
			readonly issue: 'nom-non-confirme';
			readonly decompte: DecompteDUnDomaine;
			readonly avertissement: string;
	  }
	| { readonly issue: 'possible'; readonly decompte: DecompteDUnDomaine };

/**
 * `RG-M14-02` (`CDC:1145`) — le décompte exact, et le nom retapé.
 *
 * LE DÉCOMPTE EST RENDU DANS LES DEUX ISSUES, et ce n'est pas une commodité :
 * c'est lui qu'on affiche AVANT de demander la confirmation, et le gel le rend
 * même quand le domaine est vide — « le décompte reste affiché même à zéro :
 * c'est lui qui prouve que le domaine est bien vide » (`V-28:3222-3223`). Un
 * verdict qui ne le porterait que dans le refus obligerait l'appelant à le
 * recalculer, donc à en écrire une seconde définition.
 *
 * L'AVERTISSEMENT DE `RG-M14-03` ACCOMPAGNE LE REFUS parce que c'est là qu'il
 * est lu : le gel le pose dans le dialogue, au-dessus du champ de confirmation
 * (`V-28:1404-1408`).
 */
export function verdictDeSuppressionDUnDomaine(
	etat: EtatDUnDomaine,
	saisie: unknown
): VerdictDUnDomaine {
	if (!nomConfirme(etat.nom, saisie)) {
		return {
			issue: 'nom-non-confirme',
			decompte: etat.decompte,
			avertissement: AVERTISSEMENT_DEFINITIF
		};
	}
	return { issue: 'possible', decompte: etat.decompte };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. `RG-M14-06` — SUPPRIMER UN TYPE DE FICHE UTILISÉ EST REFUSÉ
   ═════════════════════════════════════════════════════════════════════════ */

/** Le verdict d'une suppression de type de fiche — deux issues, celles de `V-29`. */
export type VerdictDUnTypeDeFiche =
	| {
			readonly issue: 'type-utilise';
			readonly decompte: DecompteDUnTypeDeFiche;
			readonly sortie: string;
	  }
	| { readonly issue: 'possible'; readonly decompte: DecompteDUnTypeDeFiche };

/**
 * `RG-M14-06` (`CDC:1163`) — « Supprimer un type de fiche utilisé est refusé. Le
 * produit indique combien de notes l'utilisent et propose de les délester. »
 *
 * TROIS OBLIGATIONS, ET LE VERDICT LES PORTE TOUTES LES TROIS : le refus, le
 * nombre, la sortie. `type_de_fiche_id … ON DELETE RESTRICT`
 * (`base/migrations/002_socle.montee.sql:364`) ne porte que la première.
 */
export function verdictDeSuppressionDUnTypeDeFiche(
	decompte: DecompteDUnTypeDeFiche
): VerdictDUnTypeDeFiche {
	if (decompte.notes > 0) {
		return { issue: 'type-utilise', decompte, sortie: SORTIE_DELESTER_LES_NOTES };
	}
	return { issue: 'possible', decompte };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. `RG-M14-07` — LE DERNIER ADMINISTRATEUR
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * LES RÔLES SONT CEUX DE LA RÉSOLUTION DES DROITS, ET IL N'Y EN A PAS D'AUTRES.
 * `RoleDeCompte` (`../droits/resolution.ts`) est la seule énumération du dépôt ;
 * en écrire une seconde ici ferait deux vocabulaires de rôle, dont l'un
 * finirait par diverger de l'énuméré de la base.
 */

/**
 * LE LIBELLÉ DU GEL VERS L'ÉNUMÉRÉ DE LA BASE — l'inverse de la table que la
 * lecture emploie déjà (`ROLE_DEPUIS_ENUM`, `./lecture.ts`).
 *
 * Le sélecteur de `V-32:2947-2952` porte les quatre libellés français
 * (« Administrateur », « Référent »…), et la colonne `comptes.role` porte
 * l'énuméré. La correspondance existait dans un sens ; elle est ici RETOURNÉE,
 * jamais recopiée — deux tables de libellés finiraient par ne plus dire la même
 * chose. `administration.test.ts` éprouve l'aller-retour sur les quatre.
 *
 * Rend `null` pour tout ce qui n'est pas l'un des quatre : un formulaire peut
 * porter n'importe quoi, et un rôle inconnu n'est pas un rôle par défaut.
 */
export function roleDepuisLeLibelle(saisie: unknown): RoleDeCompte | null {
	if (typeof saisie !== 'string') return null;
	return ROLES_CONNUS.find((role) => ROLE_DEPUIS_ENUM[role] === saisie) ?? null;
}

const ROLES_CONNUS = [
	'administrateur',
	'referent',
	'contributeur',
	'lecteur'
] as const satisfies readonly RoleDeCompte[];

/** L'état d'un compte au moment où son rôle est modifié. */
export interface EtatDUnCompte {
	readonly nom: string;
	readonly role: RoleDeCompte;
	readonly actif: boolean;
	/** Le nombre d'administrateurs ACTIFS de l'instance, celui-ci compris. */
	readonly administrateursActifs: number;
}

/**
 * EST-CE LE DERNIER ADMINISTRATEUR ? — le prédicat de `V-32:2967-2969`,
 * transcrit sans y ajouter ni en retirer.
 *
 * `administrateurs()` du gel filtre sur « rôle administrateur ET actif », et le
 * dernier est celui-là quand ils sont un. Le compte DÉSACTIVÉ n'entre donc pas
 * dans le compte, ce qui est cohérent avec `RG-M14-08` : un compte qui a perdu
 * l'accès ne garde pas la console ouverte pour l'instance.
 *
 * `RG-M14-07` dit « ne peut pas SE retirer LUI-MÊME le rôle s'il est le
 * dernier », et le gel refuse le retrait sur le dernier administrateur QUEL QUE
 * SOIT le demandeur. Les deux formulations coïncident : s'il n'existe qu'un
 * administrateur actif et que la console exige ce rôle, le demandeur EST ce
 * compte. Le prédicat du gel est retenu parce qu'il est le plus étroit à
 * l'usage et qu'il ne dépend pas de l'identité de l'appelant — une règle qui
 * dépendrait de qui demande laisserait passer le cas où deux administrateurs
 * existent et où l'un se retire : celui-là est permis, et il le reste.
 */
export function estLeDernierAdministrateur(etat: EtatDUnCompte): boolean {
	return etat.role === 'administrateur' && etat.actif && etat.administrateursActifs === 1;
}

/** Le verdict d'un changement de rôle — deux issues. */
export type VerdictDUnChangementDeRole =
	| { readonly issue: 'dernier-administrateur'; readonly motif: string }
	| { readonly issue: 'possible'; readonly role: RoleDeCompte };

/**
 * `RG-M14-07` (`CDC:1183`) — « Un administrateur ne peut pas se retirer lui-même
 * le rôle d'administrateur s'il est le dernier. »
 *
 * LE REFUS PORTE SUR LE RETRAIT, PAS SUR L'ÉDITION. Poser à nouveau le rôle
 * d'administrateur sur le dernier administrateur ne retire rien et n'est donc
 * pas refusé : la règle protège l'existence d'un administrateur, pas
 * l'immobilité du formulaire. C'est la polarité que `P-5` demande d'éprouver, et
 * `administration.test.ts` la joue.
 */
export function verdictDuChangementDeRole(
	etat: EtatDUnCompte,
	nouveauRole: RoleDeCompte
): VerdictDUnChangementDeRole {
	if (nouveauRole !== 'administrateur' && estLeDernierAdministrateur(etat)) {
		return {
			issue: 'dernier-administrateur',
			motif: `« ${etat.nom} » ${MOTIF_DERNIER_ADMINISTRATEUR}`
		};
	}
	return { issue: 'possible', role: nouveauRole };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. `RG-M14-09` ET `RG-M14-10` — LES SEUILS, LEUR VALIDATION, LEUR EFFET

   `RG-M14-09` — « Toute modification de seuil provoque un recalcul immédiat et
   visible de tous les badges concernés. »

   ELLE EST TENUE PAR L'ABSENCE DE CACHE, ET C'EST STRUCTUREL, PAS DÉCLARATIF.
   La fraîcheur n'est pas une colonne (`ADR-005`) : `niveauFraicheur()` la
   calcule à CHAQUE lecture, sur les seuils que `lireSeuils()` vient de lire dans
   `parametres` (`./lecture.ts`). Écrire les deux lignes suffit donc à faire
   changer tous les badges au prochain rendu — badge de note, agrégats de
   domaine, d'univers et indicateurs d'accueil, qui passent tous par la même
   implémentation (`P-01`).

   ET `CLES_DE_PARAMETRE` EST CE QUI EMPÊCHE L'ÉCRITURE DE MANQUER LA LECTURE.
   La table des sept clés vit avec la table `parametres` elle-même
   (`../base/schema.ts`), typée `Record<keyof Configuration, string>` : le
   compilateur refuse qu'un champ de la configuration n'ait pas de clé.
   `lireConfiguration()` la lit, cet écrivain aussi — il n'y a qu'une définition,
   et un seuil écrit sous un nom que la lecture ignorerait est INÉCRIVABLE.
   ═════════════════════════════════════════════════════════════════════════ */

/** Une erreur de validation, rattachée AU CHAMP concerné — `V-33:2992-3001`. */
export interface ErreurDeConfiguration {
	/** Le champ du gel, par son identifiant de bloc (`champ-frais`, `V-33:2993`). */
	readonly champ: 'frais' | 'vieil' | 'portail' | 'mot';
	/** Le message, transcrit du gel. */
	readonly message: string;
}

/** Le verdict d'une validation de configuration — `RG-M14-10`. */
export type VerdictDeConfiguration =
	| { readonly issue: 'valeurs-refusees'; readonly erreurs: readonly ErreurDeConfiguration[] }
	| { readonly issue: 'possible'; readonly valeurs: Configuration };

/** `V-33:3008` et `:3014` — un seuil est un nombre de jours, au moins un. */
export const MESSAGE_SEUIL_MINIMAL = 'Le seuil doit être d’au moins 1 jour.';
/** `V-33:3021` — l'adresse du portail d'assistance. */
export const MESSAGE_ADRESSE_INVALIDE =
	'Adresse invalide. Elle doit commencer par http:// ou https://.';
/** `V-33:3024` — le libellé du concept renommable de M14.7. */
export const MESSAGE_LIBELLE_VIDE =
	'Ce mot apparaît dans toute l’interface : il ne peut pas être vide.';

/**
 * `V-33:3016` — le second seuil doit DÉPASSER le premier, et le gel dit
 * pourquoi : « en l'état, aucune note ne serait jamais vieillissante ».
 *
 * Le message porte le seuil frais saisi ; il est donc composé, comme le gel le
 * compose.
 */
export function messageSeuilNonCroissant(seuilFrais: number): string {
	return `Doit dépasser le seuil frais (${seuilFrais} jours). En l’état, aucune note ne serait jamais vieillissante : le témoin passerait directement du vert au rouge.`;
}

/**
 * LES SEPT CHAMPS DE `V-33`, PAR LEUR NOM DE GEL.
 *
 * `V-33:2965` lit ses champs par `document.getElementById("c-" + id)` : le
 * préfixe fait partie du nom, et les sept identifiants sont ceux des `input` et
 * `select` de `:1247` à `:1360`. Typée `Record<keyof Configuration, string>`,
 * comme la table des clés de base : un huitième paramètre ne se compile pas tant
 * qu'il n'a pas son champ.
 */
export const CHAMPS_DE_CONFIGURATION: Readonly<Record<keyof Configuration, string>> = Object.freeze(
	{
		seuilFrais: 'c-frais',
		seuilVieillissant: 'c-vieil',
		versionsMax: 'c-versions',
		portailAssistance: 'c-portail',
		motFiche: 'c-mot',
		tailleMaxPieceJointe: 'c-taille',
		dureeSession: 'c-session'
	}
);

/**
 * CE QUE LE FORMULAIRE PORTE, LU COMME `V-33:2968-2976` LE LIT.
 *
 * `Number()` sur les cinq nombres, `trim()` sur les deux textes — la même
 * lecture que `lire()` du gel, y compris ses conséquences : un champ vide devient
 * `0`, une saisie non numérique devient `NaN`, et c'est `validerLaConfiguration()`
 * qui refuse les deux. Nettoyer ici ce que la validation doit voir reviendrait à
 * lui cacher la faute.
 *
 * La fonction ne connaît pas `FormData` : elle reçoit un LECTEUR. C'est ce qui
 * la rend éprouvable sans requête, et ce qui l'empêche de dépendre de la forme
 * du transport.
 */
export function valeursDeConfigurationSaisies(lire: (champ: string) => unknown): Configuration {
	const texte = (champ: keyof Configuration): string => {
		const brut = lire(CHAMPS_DE_CONFIGURATION[champ]);
		return typeof brut === 'string' ? brut : '';
	};
	const nombre = (champ: keyof Configuration): number => Number(texte(champ));

	return {
		seuilFrais: nombre('seuilFrais'),
		seuilVieillissant: nombre('seuilVieillissant'),
		versionsMax: nombre('versionsMax'),
		portailAssistance: texte('portailAssistance').trim(),
		motFiche: texte('motFiche').trim(),
		tailleMaxPieceJointe: nombre('tailleMaxPieceJointe'),
		dureeSession: nombre('dureeSession')
	};
}

/** `V-33:3020` — l'expression du gel, transcrite sans y toucher. */
const ADRESSE_DE_PORTAIL = /^https?:\/\/[\w-]+(\.[\w-]+)+/;

/**
 * `RG-M14-10` (`CDC:1202`) — « La validation refuse les combinaisons
 * incohérentes (seuil jaune inférieur ou égal au seuil vert, plafond
 * négatif…) avec un message explicite. »
 *
 * LES QUATRE CONTRÔLES SONT CEUX DE `valider()` (`V-33:3003-3027`), DANS SON
 * ORDRE, et aucun de plus. Le cahier cite « plafond négatif » parmi ses
 * exemples ; le gel ne valide PAS le plafond de versions — son champ n'a pas de
 * bloc d'erreur, et `marquer()` rend vrai pour un champ qu'il ne trouve pas
 * (`V-33:2995`). Écrire ce contrôle serait combler un vide que la maquette a
 * laissé, et la maquette prime : il est déclaré au rapport du lot, jamais ajouté
 * ici.
 *
 * TOUTES LES ERREURS SONT RENDUES, jamais la première : le gel marque les quatre
 * champs en un seul passage (`ok = marquer(…) && ok`, quatre fois), et un
 * formulaire qui ne signalerait qu'une erreur à la fois obligerait à autant
 * d'aller-retours qu'il y a de fautes.
 */
export function validerLaConfiguration(valeurs: Configuration): VerdictDeConfiguration {
	const erreurs: ErreurDeConfiguration[] = [];

	if (!Number.isFinite(valeurs.seuilFrais) || valeurs.seuilFrais < 1) {
		erreurs.push({ champ: 'frais', message: MESSAGE_SEUIL_MINIMAL });
	}
	if (!Number.isFinite(valeurs.seuilVieillissant) || valeurs.seuilVieillissant < 1) {
		erreurs.push({ champ: 'vieil', message: MESSAGE_SEUIL_MINIMAL });
	} else if (valeurs.seuilVieillissant <= valeurs.seuilFrais) {
		erreurs.push({ champ: 'vieil', message: messageSeuilNonCroissant(valeurs.seuilFrais) });
	}
	if (valeurs.portailAssistance !== '' && !ADRESSE_DE_PORTAIL.test(valeurs.portailAssistance)) {
		erreurs.push({ champ: 'portail', message: MESSAGE_ADRESSE_INVALIDE });
	}
	if (valeurs.motFiche === '') {
		erreurs.push({ champ: 'mot', message: MESSAGE_LIBELLE_VIDE });
	}

	if (erreurs.length > 0) return { issue: 'valeurs-refusees', erreurs };
	return { issue: 'possible', valeurs };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. LES MESURES EN BASE — ce que les exécutants lisent avant de décider
   ═════════════════════════════════════════════════════════════════════════ */

/** Un univers, tel que le geste le désigne : par son identifiant lisible. */
interface UniversEnBase extends EtatDUnUnivers {
	readonly id: string;
}

/**
 * L'état d'un univers, mesuré. `null` si l'identifiant ne désigne rien — et
 * l'appelant en fait un `INTROUVABLE`, jamais un message (`ADR-007`).
 */
export async function mesurerUnUnivers(
	base: Base,
	identifiant: string
): Promise<UniversEnBase | null> {
	const [ligne] = await base
		.select({ id: univers.id, nom: univers.nom, systeme: univers.systeme })
		.from(univers)
		.where(eq(univers.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined) return null;

	const [mesure] = await base
		.select({
			domaines: sql<number>`count(distinct ${domaines.id})::int`,
			notes: sql<number>`count(${notes.id})::int`
		})
		.from(domaines)
		.leftJoin(notes, eq(notes.domaineId, domaines.id))
		.where(eq(domaines.universId, ligne.id));

	return {
		id: ligne.id,
		systeme: ligne.systeme,
		decompte: { domaines: mesure?.domaines ?? 0, notes: mesure?.notes ?? 0 }
	};
}

/**
 * LES DEUX TYPES DE NOTE QUE LE DÉCOMPTE ISOLE — `V-28:2950-2951`, qui filtre
 * `n.type === "Fiche"` et `n.type === "Signet"`.
 *
 * Ce sont des TYPES DE NOTE (`seeds/corpus.ts`, `TYPES_NOTE`), portés par
 * `types_de_note.nom` en base. Ils ne se confondent pas avec `estFiche()` du
 * jeu de semence, qui lit `typeFiche` — donc `notes.type_de_fiche_id`. Le gel
 * compte par le type de note, et il prime ; l'écart entre les deux définitions
 * est mesuré et déclaré au rapport du lot, jamais tranché ici.
 */
const NOM_DU_TYPE_FICHE = 'Fiche';
const NOM_DU_TYPE_SIGNET = 'Signet';

/** Un domaine, tel que le geste le désigne : par son univers et son identifiant. */
interface DomaineEnBase extends EtatDUnDomaine {
	readonly id: string;
	/** Les identifiants lisibles des notes à retirer de l'index — `RG-M14-05`. */
	readonly notesAOublier: readonly string[];
}

/**
 * L'état d'un domaine, mesuré, ET la liste des notes qu'il porte.
 *
 * LES IDENTIFIANTS SONT LUS AVANT LA SUPPRESSION, et c'est la seule façon de les
 * avoir : `entretenirLIndex()` déduit la disparition de la base — « un
 * identifiant demandé que la projection ne rend pas est un identifiant qui
 * n'existe plus » (`../recherche/entretien.ts`) — mais encore faut-il pouvoir
 * les lui demander. Après la transaction, plus rien ne les nomme.
 */
export async function mesurerUnDomaine(
	base: Base,
	universIdentifiant: string,
	identifiant: string
): Promise<DomaineEnBase | null> {
	const [ligne] = await base
		.select({ id: domaines.id, nom: domaines.nom })
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.where(and(eq(univers.identifiant, universIdentifiant), eq(domaines.identifiant, identifiant)))
		.limit(1);
	if (ligne === undefined) return null;

	const portees = await base
		.select({ identifiant: notes.identifiant, typeDeNote: typesDeNote.nom })
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.where(eq(notes.domaineId, ligne.id));

	const [rangement] = await base
		.select({ dossiers: sql<number>`count(*)::int` })
		.from(dossiers)
		.where(and(eq(dossiers.domaineId, ligne.id), isNotNull(dossiers.parentId)));

	const [rattaches] = await base
		.select({ comptesRattaches: sql<number>`count(*)::int` })
		.from(comptes)
		.where(eq(comptes.domaineId, ligne.id));

	return {
		id: ligne.id,
		nom: ligne.nom,
		notesAOublier: portees.map((n) => n.identifiant),
		decompte: {
			notes: portees.length,
			fichesTypees: portees.filter((n) => n.typeDeNote === NOM_DU_TYPE_FICHE).length,
			signets: portees.filter((n) => n.typeDeNote === NOM_DU_TYPE_SIGNET).length,
			dossiers: rangement?.dossiers ?? 0,
			comptesRattaches: rattaches?.comptesRattaches ?? 0
		}
	};
}

/** Un type de fiche, tel que le geste le désigne : par son identifiant lisible. */
interface TypeDeFicheEnBase {
	readonly id: string;
	readonly decompte: DecompteDUnTypeDeFiche;
}

/** L'état d'un type de fiche, mesuré. */
export async function mesurerUnTypeDeFiche(
	base: Base,
	identifiant: string
): Promise<TypeDeFicheEnBase | null> {
	const [ligne] = await base
		.select({ id: typesDeFiche.id })
		.from(typesDeFiche)
		.where(eq(typesDeFiche.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined) return null;

	const [portees] = await base
		.select({ notes: sql<number>`count(*)::int` })
		.from(notes)
		.where(eq(notes.typeDeFicheId, ligne.id));

	const [champs] = await base
		.select({ proprietes: sql<number>`count(*)::int` })
		.from(champsDeTypeDeFiche)
		.where(eq(champsDeTypeDeFiche.typeDeFicheId, ligne.id));

	return {
		id: ligne.id,
		decompte: { notes: portees?.notes ?? 0, proprietes: champs?.proprietes ?? 0 }
	};
}

/** Un compte, tel que le geste le désigne : par son identifiant de connexion. */
interface CompteEnBase extends EtatDUnCompte {
	readonly id: string;
}

/** L'état d'un compte, et le nombre d'administrateurs actifs de l'instance. */
export async function mesurerUnCompte(
	base: Base,
	identifiant: string
): Promise<CompteEnBase | null> {
	const [ligne] = await base
		.select({
			id: comptes.id,
			nom: comptes.nom,
			role: comptes.role,
			actif: comptes.actif
		})
		.from(comptes)
		.where(eq(comptes.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined) return null;

	const [mesure] = await base
		.select({ administrateurs: sql<number>`count(*)::int` })
		.from(comptes)
		.where(and(eq(comptes.role, 'administrateur'), eq(comptes.actif, true)));

	return {
		id: ligne.id,
		nom: ligne.nom,
		role: ligne.role,
		actif: ligne.actif,
		administrateursActifs: mesure?.administrateurs ?? 0
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. LES EXÉCUTANTS
   ═════════════════════════════════════════════════════════════════════════ */

/** Ce qu'un geste d'administration rend : son issue, et ce qu'il a mesuré. */
export type IssueDUnGeste<T> = { readonly issue: 'introuvable' } | T;

/**
 * SUPPRIMER UN UNIVERS — `RG-M14-01`.
 *
 * Une seule écriture, aucune transaction : `ON DELETE RESTRICT` sur
 * `domaines.univers_id` fait de cette suppression un geste atomique par nature —
 * elle n'emporte rien, ou elle est refusée. Le verdict la refuse d'ailleurs
 * avant d'y arriver ; la contrainte de base reste le dernier mot, et c'est bien
 * ainsi : deux gardes valent mieux qu'une quand l'une des deux est une course.
 */
export async function supprimerUnUnivers(
	base: Base,
	identifiant: string
): Promise<IssueDUnGeste<VerdictDUnUnivers>> {
	const etat = await mesurerUnUnivers(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDeSuppressionDUnUnivers(etat);
	if (verdict.issue !== 'possible') return verdict;

	await base.delete(univers).where(eq(univers.id, etat.id));
	return verdict;
}

/**
 * SUPPRIMER UN DOMAINE ET TOUT SON CONTENU — `RG-M14-02`, `03`, `04`, `05`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-M14-03` — « ATOMIQUE ET DÉFINITIVE : SOIT TOUT, SOIT RIEN »
 *
 * C'est une exigence de TRANSACTION, pas une intention, et l'ordre des deux
 * suppressions n'est pas libre : `notes.domaine_id` est en `ON DELETE RESTRICT`
 * (`base/migrations/002_socle.montee.sql:336`). Supprimer le domaine d'abord
 * échouerait ; les notes partent donc les premières, et tout ce qui pend à
 * elles suit en cascade — relations DANS LES DEUX SENS (`RG-M08-05`), pièces
 * jointes, vérifications, étiquettes de note, versions.
 *
 * Le domaine emporte ensuite ses dossiers et ses modules, en cascade eux aussi,
 * et REND VIDE le rattachement des comptes sans les détruire — `RG-M14-04`,
 * `ON DELETE SET NULL` (`005_rattachement.montee.sql:31-34`).
 *
 * SI LA SECONDE ÉCHOUE, LA PREMIÈRE EST ANNULÉE : c'est ce que la transaction
 * garantit, et c'est la polarité qu'`administration.test.ts` joue — une
 * suppression qui échoue EN COURS, pas seulement une qui réussit (`P-5`).
 *
 * « Il n'y a pas de corbeille » est tenu par l'absence : aucune des vingt et une
 * tables du schéma n'en est une, et rien ici n'écrit ailleurs qu'en supprimant.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-M14-05` — « DISPARAÎT IMMÉDIATEMENT DE LA RECHERCHE »
 *
 * L'ENTRETIEN EST APPELÉ, JAMAIS RÉÉCRIT. `entretenirLIndex()` est
 * l'implémentation unique de l'entretien de l'index à l'écriture (`T-075`), et
 * `ARB-060` en fixe le régime : la requête SOUMET au moteur et n'attend pas la
 * tâche. Un second chemin d'indexation serait `P-01` bafoué sur l'index.
 *
 * L'APPEL SUIT LA VALIDATION DE LA TRANSACTION, JAMAIS AVANT — « de sorte
 * qu'une transaction annulée ne puisse pas laisser un index amputé ». Et il
 * suffit de LUI DEMANDER les identifiants : il relit la base, ne les trouve
 * plus, et les retire. Aucune ligne ici ne dit à l'index ce qu'il doit oublier.
 *
 * L'index est la barrière de `/recherche` — la route lit en base les
 * identifiants QUE L'INDEX A RENDUS —, et une entrée périmée y serait donc une
 * note détruite encore trouvable. C'est cela que `RG-M14-05` interdit.
 *
 * @throws l'erreur de la tâche du moteur si l'index n'a pas pu être entretenu.
 */
export async function supprimerUnDomaine(
	base: Base,
	client: Meilisearch,
	demande: {
		readonly univers: string;
		readonly domaine: string;
		readonly saisie: unknown;
	}
): Promise<IssueDUnGeste<VerdictDUnDomaine>> {
	const etat = await mesurerUnDomaine(base, demande.univers, demande.domaine);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDeSuppressionDUnDomaine(etat, demande.saisie);
	if (verdict.issue !== 'possible') return verdict;

	await base.transaction(async (tx) => {
		await tx.delete(notes).where(eq(notes.domaineId, etat.id));
		await tx.delete(domaines).where(eq(domaines.id, etat.id));
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
	await entretenirLIndex(base, client, etat.notesAOublier);

	return verdict;
}

/**
 * SUPPRIMER UN TYPE DE FICHE — `RG-M14-06`.
 *
 * Les propriétés du type partent en cascade (`champs_de_type_de_fiche`,
 * `ON DELETE CASCADE`), et c'est précisément ce que le décompte annonce :
 * « propriétés dont les valeurs seraient perdues ». Aucune note n'est touchée —
 * le verdict a déjà refusé s'il y en avait.
 */
export async function supprimerUnTypeDeFiche(
	base: Base,
	identifiant: string
): Promise<IssueDUnGeste<VerdictDUnTypeDeFiche>> {
	const etat = await mesurerUnTypeDeFiche(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDeSuppressionDUnTypeDeFiche(etat.decompte);
	if (verdict.issue !== 'possible') return verdict;

	await base.delete(typesDeFiche).where(eq(typesDeFiche.id, etat.id));
	return verdict;
}

/**
 * DÉLESTER LES NOTES D'UN TYPE DE FICHE — la sortie que `RG-M14-06` propose.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE GESTE N'EST PAS INVENTÉ : IL EST LU AU GEL
 *
 * `mockups/V-29-console-types-fiches.html:3464-3468` : le refus de suppression
 * offre un bouton « Délester ces N notes du type "X" », et la notification qui
 * suit dit exactement ce qu'il fait — « les notes conservent leur contenu, sans
 * propriétés structurées ». `RG-M14-06` exige que le refus porte une sortie ;
 * c'est celle-là, et la maquette fait loi.
 *
 * `P-03` LE REND OBLIGATOIRE, pas facultatif : « une entrée visible est une
 * entrée qui fonctionne. Pas de "bientôt disponible", pas de lien mort. » Le
 * bouton est au gel ; le laisser inerte serait le défaut que ce principe nomme.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX COLONNES, ET LES DEUX ENSEMBLE
 *
 * `notes.type_de_fiche_id` porte le type, `notes.proprietes_typees` porte les
 * valeurs de son schéma. Retirer l'un sans l'autre laisserait des propriétés
 * orphelines, dont plus aucun schéma ne dirait le sens — « sans propriétés
 * structurées » se lit sur les deux. Une seule instruction, donc atomique par
 * nature : aucune transaction n'est nécessaire là où il n'y a qu'une écriture.
 *
 * LE CORPS DES NOTES N'EST PAS TOUCHÉ, et c'est tout ce que la notification
 * promet : « les notes conservent leur contenu ». Rien ici ne lit ni n'écrit
 * `corps_reference` ou `corps_operationnel`.
 *
 * L'INDEX N'EST PAS ENTRETENU, et il faut le dire. Aucune note ne disparaît —
 * `RG-M14-05` vise la disparition —, mais leur type de fiche change. Si la
 * projection de recherche portait ce type, elle serait périmée jusqu'à la
 * prochaine écriture de la note. Lacune déclarée plutôt que geste ajouté sans
 * l'avoir mesuré.
 *
 * @returns le nombre de notes délestées, ou `introuvable` si le type n'existe pas.
 */
export async function delesterUnTypeDeFiche(
	base: Base,
	identifiant: string
): Promise<IssueDUnGeste<{ readonly issue: 'possible'; readonly notes: number }>> {
	const etat = await mesurerUnTypeDeFiche(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	const delestees = await base
		.update(notes)
		.set({ typeDeFicheId: null, proprietesTypees: null })
		.where(eq(notes.typeDeFicheId, etat.id))
		.returning({ identifiant: notes.identifiant });

	return { issue: 'possible', notes: delestees.length };
}

/**
 * CHANGER LE RÔLE D'UN COMPTE — `RG-M14-07`.
 *
 * Le refus est prononcé AVANT l'écriture, sur une mesure prise dans la même
 * requête. Aucune contrainte de base ne porte cette règle : `comptes.role` est
 * un énuméré, et rien n'y interdit de descendre le dernier administrateur. Elle
 * n'existe donc que si elle est écrite, et c'est ici.
 */
export async function changerLeRoleDUnCompte(
	base: Base,
	identifiant: string,
	nouveauRole: RoleDeCompte,
	maintenant: Date
): Promise<IssueDUnGeste<VerdictDUnChangementDeRole>> {
	const etat = await mesurerUnCompte(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDuChangementDeRole(etat, nouveauRole);
	if (verdict.issue !== 'possible') return verdict;

	await base
		.update(comptes)
		.set({ role: verdict.role, modifieLe: maintenant })
		.where(eq(comptes.id, etat.id));
	return verdict;
}

/** Le verdict d'un geste sur un template — une seule issue possible. */
export type VerdictDUnTemplate = { readonly issue: 'possible'; readonly template: string };

/**
 * SUPPRIMER UN TEMPLATE — `RG-REF-01`, et une suppression qui ne se refuse pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUN REFUS, ET C'EST LE GEL QUI LE DIT
 *
 * `V-31:202` : « Modifier ou supprimer un template n'affecte AUCUNE note
 * existante. Un squelette est copié au moment de la création : la note devient
 * aussitôt indépendante. » Aucune colonne ne rattache une note à son template —
 * le lien est rompu dès la création —, et il n'y a donc rien à décompter, rien à
 * délester, rien à confirmer par un nom retapé.
 *
 * Le dialogue porte un AVERTISSEMENT, non un refus, quand le template visé est
 * celui par défaut : « la création de note s'ouvrira sur la page vierge tant
 * qu'un autre n'aura pas été marqué par défaut. Ce n'est pas bloquant, mais
 * autant le savoir » (`V-31:615-622`). Le geste ne le contredit pas : il ne
 * promeut aucun remplaçant, parce que la maquette n'en désigne aucun, et en
 * choisir un serait décider à la place de l'administrateur.
 */
export async function supprimerUnTemplate(
	base: Base,
	identifiant: string
): Promise<IssueDUnGeste<VerdictDUnTemplate>> {
	const [ligne] = await base
		.select({ id: templates.id, nom: templates.nom })
		.from(templates)
		.where(eq(templates.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined) return { issue: 'introuvable' };

	await base.delete(templates).where(eq(templates.id, ligne.id));
	return { issue: 'possible', template: ligne.nom };
}

/**
 * MARQUER UN TEMPLATE PAR DÉFAUT — `RG-REF-02`, et l'unicité est le geste.
 *
 * `V-31:380-381` écrit la règle depuis l'écran : « Proposé en premier dans le
 * sélecteur. Cocher décochera "X", qui l'est actuellement. » Il n'y a donc pas
 * un marquage suivi d'un démarquage à ne pas oublier : il y a UN geste, qui
 * laisse exactement un template par défaut.
 *
 * LES DEUX ÉCRITURES SONT DANS UNE TRANSACTION, et ce n'est pas une précaution
 * de style : entre les deux, la base porterait DEUX templates par défaut, ou
 * ZÉRO selon l'ordre. Aucune contrainte ne l'interdit — `templates.defaut` est
 * un booléen ordinaire —, donc la règle n'existe que si elle est écrite, et elle
 * ne tient que si les deux écritures tiennent ensemble.
 *
 * L'ORDRE EST : démarquer tout, puis marquer celui-ci. L'inverse démarquerait ce
 * qu'on vient de marquer.
 */
export async function marquerLeTemplateParDefaut(
	base: Base,
	identifiant: string,
	maintenant: Date
): Promise<IssueDUnGeste<VerdictDUnTemplate>> {
	const [ligne] = await base
		.select({ id: templates.id, nom: templates.nom })
		.from(templates)
		.where(eq(templates.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined) return { issue: 'introuvable' };

	await base.transaction(async (tx) => {
		await tx.update(templates).set({ defaut: false, modifieLe: maintenant });
		await tx
			.update(templates)
			.set({ defaut: true, modifieLe: maintenant })
			.where(eq(templates.id, ligne.id));
	});

	return { issue: 'possible', template: ligne.nom };
}

/**
 * CE QU'IL ADVIENT DES RELATIONS D'UN TYPE SUPPRIMÉ — les deux sorties que le
 * dialogue de `V-30` offre, et il n'y en a pas d'autres.
 *
 * `V-30:534-556` : « Choisissez ce qu'il advient de ces relations. Aucune fiche
 * n'est supprimée dans les deux cas : seul le lien entre elles est concerné. »
 */
export type SortieDUnTypeDeRelation = 'reaffecter' | 'supprimer';

/** Le verdict d'une suppression de type de relation. */
export type VerdictDUnTypeDeRelation =
	| { readonly issue: 'cible-invalide' }
	| {
			readonly issue: 'possible';
			/** Le nombre de relations réaffectées ou détruites — jamais un chiffre supposé. */
			readonly relations: number;
			readonly sortie: SortieDUnTypeDeRelation;
	  };

/**
 * SUPPRIMER UN TYPE DE RELATION — `RG-M08-06`, `RG-M08-07`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS CAS, ET LES TROIS SONT AU GEL
 *
 * `V-30:513-556`, lu :
 *
 *   AUCUNE RELATION   « n'est utilisé par aucune relation. Sa suppression retire
 *                     seulement ce couple de libellés du vocabulaire proposé. »
 *                     Le type part, rien d'autre n'est touché.
 *   RÉAFFECTER        « Les N relations sont conservées et changent d'étiquette.
 *                     Le graphe garde sa structure. »
 *   SUPPRIMER AUSSI   « Les liens disparaissent du graphe et des panneaux
 *                     Relations. Les fiches restent intactes. Cette perte est
 *                     définitive. »
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UNE TRANSACTION, ALORS QUE `V-28` EN AVAIT UNE POUR LA MÊME RAISON
 *
 * `type_de_relation_id` est en `ON DELETE RESTRICT` : le type ne peut pas partir
 * tant qu'une relation le porte. Les deux écritures sont donc ORDONNÉES et
 * indissociables — traiter les relations, puis retirer le type. Si la seconde
 * échoue, la première doit être annulée, sans quoi des relations auraient changé
 * d'étiquette ou disparu pour un type qui, lui, existe toujours.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA RÉAFFECTATION PEUT SE HEURTER À L'UNICITÉ, ET CE N'EST PAS UNE ERREUR
 *
 * `relations_unicite` porte sur (source, cible, type). Réaffecter vers un type
 * que le même couple porte DÉJÀ produirait un doublon : ces relations-là sont
 * retirées plutôt que réécrites — le lien existe déjà sous l'étiquette visée, et
 * « le graphe garde sa structure » reste vrai. Rien n'est perdu, rien n'est
 * dupliqué.
 *
 * L'INDEX DE RECHERCHE N'EST PAS ENTRETENU : aucune note ne disparaît, et la
 * projection ne porte pas les relations. Lacune nommée plutôt que geste supposé.
 */
export async function supprimerUnTypeDeRelation(
	base: Base,
	demande: {
		readonly type: string;
		readonly sortie: SortieDUnTypeDeRelation;
		/** L'identifiant du type d'accueil, quand la sortie est la réaffectation. */
		readonly vers?: string;
	}
): Promise<IssueDUnGeste<VerdictDUnTypeDeRelation>> {
	const [type] = await base
		.select({ id: typesDeRelation.id })
		.from(typesDeRelation)
		.where(eq(typesDeRelation.identifiant, demande.type))
		.limit(1);
	if (type === undefined) return { issue: 'introuvable' };

	const portees = await base
		.select({ id: relations.id, sourceId: relations.sourceId, cibleId: relations.cibleId })
		.from(relations)
		.where(eq(relations.typeDeRelationId, type.id));

	let accueil: { readonly id: string } | undefined;
	if (portees.length > 0 && demande.sortie === 'reaffecter') {
		[accueil] = await base
			.select({ id: typesDeRelation.id })
			.from(typesDeRelation)
			.where(eq(typesDeRelation.identifiant, demande.vers ?? ''))
			.limit(1);
		/* Un type d'accueil inconnu, ou le type qu'on retire : ni l'un ni l'autre
		   ne conserve les relations. Refus, jamais un repli silencieux. */
		if (accueil === undefined || accueil.id === type.id) return { issue: 'cible-invalide' };
	}

	await base.transaction(async (tx) => {
		if (portees.length > 0) {
			if (accueil === undefined) {
				await tx.delete(relations).where(eq(relations.typeDeRelationId, type.id));
			} else {
				/* Les couples que le type d'accueil porte déjà — voir l'en-tête. */
				const deja = await tx
					.select({ sourceId: relations.sourceId, cibleId: relations.cibleId })
					.from(relations)
					.where(eq(relations.typeDeRelationId, accueil.id));
				const occupes = new Set(deja.map((r) => `${r.sourceId}→${r.cibleId}`));

				for (const relation of portees) {
					if (occupes.has(`${relation.sourceId}→${relation.cibleId}`)) {
						await tx.delete(relations).where(eq(relations.id, relation.id));
						continue;
					}
					await tx
						.update(relations)
						.set({ typeDeRelationId: accueil.id })
						.where(eq(relations.id, relation.id));
				}
			}
		}
		await tx.delete(typesDeRelation).where(eq(typesDeRelation.id, type.id));
	});

	return { issue: 'possible', relations: portees.length, sortie: demande.sortie };
}

/** Le verdict d'une désactivation — deux issues, celles du dialogue de `V-32`. */
export type VerdictDeDesactivation =
	| { readonly issue: 'refus-dernier-administrateur'; readonly motif: string }
	| { readonly issue: 'possible'; readonly actif: boolean };

/**
 * ACTIVER OU DÉSACTIVER UN COMPTE — `RG-M14-08`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA RÈGLE DIT, ET QUI LA TIENT DÉJÀ
 *
 * `CAHIER-DES-CHARGES-FONCTIONNEL.md:1186` : « un compte désactivé perd
 * IMMÉDIATEMENT l'accès mais reste attaché à ses contributions passées. »
 *
 * LA MOITIÉ « IMMÉDIATEMENT » EST DÉJÀ ÉCRITE, ET AILLEURS : `src/hooks.server.ts`
 * ferme la session au premier accès d'un compte devenu inactif — « la session est
 * fermée au premier accès, sans purge à faire courir ». Rien n'est donc à purger
 * ici, et surtout rien n'est à réécrire : une seconde application de la règle
 * serait une définition concurrente.
 *
 * LA MOITIÉ « RESTE ATTACHÉ » EST TENUE PAR L'ABSENCE : aucune ligne ci-dessous
 * ne touche `notes.auteur_id`, ni `verifications`, ni `versions`. C'est ce que
 * le dialogue promet — « les notes écrites par X restent à son nom, et
 * l'historique des vérifications n'est pas réécrit » (`V-32:3306`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE REFUS DU DERNIER ADMINISTRATEUR EST LU AU GEL, PAS DÉDUIT
 *
 * `mockups/V-32-console-comptes.html:3270-3284` : si le compte visé est le seul
 * administrateur actif, la désactivation est REFUSÉE, avec son motif —
 * « désactiver ce compte rendrait la console inaccessible et sans recours ».
 *
 * Le prédicat est `estLeDernierAdministrateur()`, celui-là même que
 * `RG-M14-07` emploie pour le changement de rôle : ce sont deux façons de
 * retirer le dernier administrateur, et il n'y a aucune raison qu'elles se
 * jugent différemment. Une seconde définition aurait divergé.
 *
 * LE MOTIF, LUI, EST PROPRE AU GESTE : le gel écrit deux phrases distinctes —
 * voir `MOTIF_DERNIER_ADMINISTRATEUR_DESACTIVATION`.
 *
 * LA RÉACTIVATION N'EST JAMAIS REFUSÉE : elle ne peut pas retirer d'accès.
 */
export async function changerLActivationDUnCompte(
	base: Base,
	identifiant: string,
	actif: boolean,
	maintenant: Date
): Promise<IssueDUnGeste<VerdictDeDesactivation>> {
	const etat = await mesurerUnCompte(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	if (!actif && estLeDernierAdministrateur(etat)) {
		return {
			issue: 'refus-dernier-administrateur',
			motif: `« ${etat.nom} » ${MOTIF_DERNIER_ADMINISTRATEUR_DESACTIVATION}`
		};
	}

	await base.update(comptes).set({ actif, modifieLe: maintenant }).where(eq(comptes.id, etat.id));
	return { issue: 'possible', actif };
}

/**
 * ENREGISTRER LA CONFIGURATION — `RG-M14-09` et `RG-M14-10`.
 *
 * LES SEPT LIGNES SONT ÉCRITES DANS UNE SEULE TRANSACTION. Deux seuils écrits à
 * moitié seraient une combinaison que `RG-M14-10` refuse — un `seuil_vieillissant`
 * posé sans son `seuil_frais` peut très bien lui être inférieur — et la
 * validation n'y pourrait rien : elle a déjà rendu son verdict.
 *
 * LE RECALCUL N'EST PAS DÉCLENCHÉ, IL EST INÉVITABLE. Rien n'est à invalider :
 * il n'existe aucun cache de fraîcheur, aucune colonne de niveau, aucun agrégat
 * stocké. La prochaine lecture relit `parametres` et recalcule
 * (`./lecture.ts`, `lireSeuils()` puis `niveauFraicheur()`). C'est `P-01` qui
 * rend `RG-M14-09` vraie pour TOUS les badges à la fois : ils n'ont qu'une
 * implémentation à suivre.
 */
export async function enregistrerLaConfiguration(
	base: Base,
	valeurs: Configuration,
	maintenant: Date
): Promise<VerdictDeConfiguration> {
	const verdict = validerLaConfiguration(valeurs);
	if (verdict.issue !== 'possible') return verdict;

	const champs = Object.keys(CLES_DE_PARAMETRE) as readonly (keyof Configuration)[];
	const lignes = champs.map((champ) => ({
		cle: CLES_DE_PARAMETRE[champ],
		valeur: valeurs[champ],
		modifieLe: maintenant
	}));

	await base.transaction(async (tx) => {
		for (const ligne of lignes) {
			await tx
				.update(parametres)
				.set({ valeur: ligne.valeur, modifieLe: ligne.modifieLe })
				.where(eq(parametres.cle, ligne.cle));
		}
	});

	return verdict;
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. CRÉER UN COMPTE — `UC-M14-07`, `RG-CPT-01`, `RG-CPT-02`

   ═════════════════════════════════════════════════════════════════════════
   LA RÈGLE N'EST PAS CELLE QUE `docs/reprise.md` NOMME

   `docs/reprise.md:73` rattache « créer un compte » à `RG-M14-06`. Ce numéro est
   déjà pris, et par une tout autre règle : `CDC:1159` — « supprimer un type de
   fiche utilisé est refusé ». La création de compte n'a AUCUNE règle numérotée ;
   elle est un cas d'usage, `UC-M14-07` (`CDC:1174-1181`) :

       « Créer un compte : identifiant, mot de passe initial, rôle, domaine
         principal. »

   Deux règles numérotées l'encadrent, et ce sont elles qui contraignent ici :
   `RG-CPT-01` (`CDC:137`) et `RG-CPT-02` (`CDC:139`).

   ═════════════════════════════════════════════════════════════════════════
   `RG-CPT-02` — CE QUE LA SOURCE DIT, ET CE QU'ELLE NE DIT PAS

   « L'accès administrateur ne peut pas être AUTO-attribué. La création du
     PREMIER compte administrateur est une opération d'exploitation, hors
     interface. »

   Elle interdit deux choses, et deux seulement : qu'un compte s'attribue à
   LUI-MÊME le rôle d'administrateur, et que le PREMIER administrateur naisse de
   l'interface. Elle n'interdit pas qu'un administrateur en nomme un autre — le
   mot « premier » serait vide de sens s'il l'interdisait.

   LE GEL TRANCHE DANS LE MÊME SENS, ET IL PRIME. `V-32:2947-2952` met les quatre
   rôles dans le sélecteur, « Administrateur » compris, et `V-32:3134` ne
   verrouille ce sélecteur QUE hors création (`sr.disabled = !nouveau && …`) : à
   la création, les quatre rôles sont offerts sans exception.

   LES DEUX INTERDITS SONT TENUS SANS QU'UNE LIGNE NE LES RÉÉCRIVE :

     1. L'AUTO-ATTRIBUTION EST IMPOSSIBLE PAR CONSTRUCTION. Ce geste crée un
        compte NOUVEAU ; son identifiant est libre, donc différent de celui de
        l'appelant, que le refus de doublon ci-dessous garantit. Nul ne peut se
        créer soi-même.
     2. LE PREMIER ADMINISTRATEUR NE PEUT PAS NAÎTRE ICI. La route exige déjà le
        rôle administrateur (`resoudreLaConsole()`, `docs/routes.md:167`) : sur
        une instance qui n'en a aucun, personne n'atteint cet écran. La règle est
        portée par la GARDE, pas par une seconde condition — en écrire une ici
        ferait la définition concurrente que `P-01` nomme pour la fraîcheur.

   ═════════════════════════════════════════════════════════════════════════
   CE QUE LE GEL N'OFFRE PAS, ET QUI EST OBLIGATOIRE EN BASE

   Deux colonnes de `comptes` sont `NOT NULL` sans qu'un nœud du gel les
   renseigne, et ce module ne les comble pas en silence :

     • `arrive_le` (`002_socle.montee.sql:68`, sans valeur par défaut) — AUCUN
       nœud du formulaire ne la porte. La valeur posée est la DATE DU GESTE, qui
       est la seule que la requête connaisse ; c'est une décision, elle est
       déclarée au rapport de lot, et elle attend un arbitrage.
     • `courriel` — `NOT NULL` ET `UNIQUE` (`comptes_courriel_unique`), quand
       `V-32:1366` l'offre SANS l'étoile d'obligation et que `CDC:1178`
       n'énumère pas l'adresse parmi les champs de création. Une seconde
       création sans adresse violerait donc la contrainte. Le verdict la refuse
       AVANT l'écriture — voir `courriel-indisponible` —, et ce refus n'a AUCUN
       nœud au gel pour se dire : le panneau reste ouvert, rien n'est écrit, et
       rien n'est affiché. Inventer un message serait combler.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * LA DÉSIGNATION CANONIQUE D'UN DOMAINE — la même forme que
 * `mesurerUnDomaine()` attend, et pour la même raison : `RG-STR-02` ne rend
 * l'identifiant d'un domaine unique qu'au sein de son univers.
 *
 * Elle est REDÉCLARÉE ici plutôt qu'importée de `./consoles.ts`, qui importe
 * déjà ce module : l'importer en retour ferait un cycle. La forme est celle de
 * `DesignationDeDomaine` de `./consoles.ts`, et les deux se satisfont l'une
 * l'autre par structure.
 */
export interface DomaineCanonique {
	readonly univers: string;
	readonly domaine: string;
}

/**
 * Ce qu'une création de compte demande — les sept nœuds du formulaire de
 * `V-32:1344-1401`, et pas un de plus.
 */
export interface DemandeDeCompte {
	/** `#f-ident` — l'identifiant de connexion, « définitif après création ». */
	readonly identifiant: string;
	/** `#f-nom` — le nom affiché. */
	readonly nom: string;
	/** `#f-courriel` — l'adresse électronique. Vide est permis au gel. */
	readonly courriel: string;
	/** `#f-mdp` — le mot de passe initial, en clair. Jamais écrit tel quel. */
	readonly motDePasse: string;
	/** `#f-role` — déjà converti par `roleDepuisLeLibelle()`. */
	readonly role: RoleDeCompte;
	/**
	 * `#f-domaine` — le rattachement, sous sa forme CANONIQUE. `null` quand
	 * aucun domaine n'est choisi : la colonne est nullable par exigence
	 * (`RG-M14-04`).
	 */
	readonly domaine: DomaineCanonique | null;
	/** `#f-verrou` — `RG-CPT-01`, « mot de passe verrouillé ». */
	readonly motDePasseVerrouille: boolean;
}

/**
 * UNE ERREUR DE SAISIE, RATTACHÉE AU BLOC DU GEL QUI SAIT LA DIRE.
 *
 * `champ` nomme le suffixe des identifiants du gel — `champ-ident` et
 * `erreur-ident` pour `'ident'` —, exactement comme `ErreurDeConfiguration` le
 * fait pour `V-33`. Il n'existe que DEUX blocs d'erreur au gel (`V-32:1352` et
 * `V-32:1362`) : aucun troisième champ ne peut donc porter un message, et le
 * verdict n'en fabrique pas.
 */
export interface ErreurDeSaisieDeCompte {
	readonly champ: 'ident' | 'nom';
	/** Le message, TRANSCRIT du gel — `V-32:3179-3186`. */
	readonly message: string;
}

/* Les trois messages fixes du gel, à la lettre — `V-32:3179-3186`. */
export const MESSAGE_IDENTIFIANT_VIDE = 'Saisissez un identifiant.';
export const MESSAGE_IDENTIFIANT_MAL_FORME = 'Lettres, chiffres, points et tirets uniquement.';
export const MESSAGE_NOM_VIDE = 'Donnez un nom affiché.';

/** « … est déjà pris. » — `V-32:3181`, guillemets du gel compris. */
export function messageIdentifiantPris(identifiant: string): string {
	return `« ${identifiant} » est déjà pris.`;
}

/**
 * LA FORME D'UN IDENTIFIANT DE CONNEXION — l'expression du gel, recopiée
 * caractère par caractère depuis `V-32:3183`.
 */
const FORME_DE_LIDENTIFIANT = /^[a-z0-9]+([._-][a-z0-9]+)*$/;

/**
 * LA NORMALISATION QUE LE GEL APPLIQUE AVANT DE JUGER — `V-32:3175` :
 * `.value.trim().toLowerCase()`. Elle est faite ICI et une seule fois : le
 * doublon se cherche sur la forme normalisée, et c'est elle qui est écrite.
 */
export function identifiantNormalise(saisie: unknown): string {
	return typeof saisie === 'string' ? saisie.trim().toLowerCase() : '';
}

/** L'état mesuré au moment où un compte est créé. */
export interface EtatDeCreationDeCompte {
	readonly identifiantPris: boolean;
	readonly courrielPris: boolean;
}

/** Le verdict d'une création — quatre issues, dont trois refus. */
export type VerdictDeCreationDeCompte =
	/** Des saisies refusées, chacune rattachée à son bloc du gel. */
	| { readonly issue: 'saisie-refusee'; readonly erreurs: readonly ErreurDeSaisieDeCompte[] }
	/** `#f-mdp` vide — obligatoire au gel (`V-32:1372`), sans bloc d'erreur. */
	| { readonly issue: 'mot-de-passe-vide' }
	/** L'adresse est déjà portée par un autre compte. Aucun bloc d'erreur au gel. */
	| { readonly issue: 'courriel-indisponible'; readonly courriel: string }
	| { readonly issue: 'possible'; readonly identifiant: string; readonly nom: string };

/**
 * LE VERDICT D'UNE CRÉATION — fonction PURE, sans base et sans horloge.
 *
 * L'ORDRE DES TROIS CONTRÔLES D'IDENTIFIANT EST CELUI DU GEL, et il n'est pas
 * indifférent : vide, puis doublon, puis forme (`V-32:3179-3183`). Un
 * identifiant vide n'est pas « mal formé », il est absent — et le juger dans
 * l'autre ordre changerait le message que l'écran affiche.
 *
 * LES DEUX CHAMPS SONT JUGÉS ENSEMBLE, jamais l'un après l'autre : le gel
 * marque les deux blocs dans la même passe — `marquer()` est appelé deux fois
 * avant le `if (faute) return` — et un formulaire qui ne dirait qu'une faute à
 * la fois ferait retaper l'utilisateur deux fois.
 */
export function verdictDeCreationDeCompte(
	demande: DemandeDeCompte,
	etat: EtatDeCreationDeCompte
): VerdictDeCreationDeCompte {
	const identifiant = demande.identifiant;
	const nom = demande.nom.trim();
	const erreurs: ErreurDeSaisieDeCompte[] = [];

	if (identifiant === '') {
		erreurs.push({ champ: 'ident', message: MESSAGE_IDENTIFIANT_VIDE });
	} else if (etat.identifiantPris) {
		erreurs.push({ champ: 'ident', message: messageIdentifiantPris(identifiant) });
	} else if (!FORME_DE_LIDENTIFIANT.test(identifiant)) {
		erreurs.push({ champ: 'ident', message: MESSAGE_IDENTIFIANT_MAL_FORME });
	}
	if (nom === '') erreurs.push({ champ: 'nom', message: MESSAGE_NOM_VIDE });
	if (erreurs.length > 0) return { issue: 'saisie-refusee', erreurs };

	/* `#f-mdp` PORTE L'ÉTOILE D'OBLIGATION (`V-32:1372`) mais aucun bloc
	   d'erreur : le refus est prononcé, il ne peut pas être affiché. Déclaré. */
	if (demande.motDePasse === '') return { issue: 'mot-de-passe-vide' };

	/* L'ADRESSE EST `NOT NULL UNIQUE` EN BASE ET FACULTATIVE AU GEL — voir
	   l'en-tête de section. Le refus vient AVANT l'écriture parce que la
	   contrainte, elle, sortirait en erreur de serveur. */
	if (etat.courrielPris) {
		return { issue: 'courriel-indisponible', courriel: demande.courriel };
	}

	return { issue: 'possible', identifiant, nom };
}

/**
 * CRÉER UN COMPTE — l'exécutant. Il mesure, appelle le verdict, et n'écrit que
 * si le verdict est `possible`.
 *
 * LE MOT DE PASSE EN CLAIR NE SORT PAS DE CETTE FONCTION. Il y entre, il est
 * condensé par `hacherMotDePasse()` — le seul chemin du dépôt vers Argon2id
 * (`../auth/mots-de-passe.ts`, `STACK §4.7`) — et seul le condensat est écrit.
 * Aucune valeur rendue ne le porte : c'est l'ÉCRAN qui l'affiche une fois, à
 * partir de la valeur qu'il a lui-même engendrée, jamais depuis une réponse du
 * serveur.
 *
 * LA COURSE ENTRE LA MESURE ET L'ÉCRITURE RESTE POSSIBLE, et la base a le
 * dernier mot : `comptes_identifiant_unique` et `comptes_courriel_unique`
 * refuseront un doublon glissé entre les deux. Deux gardes valent mieux qu'une
 * quand l'une des deux est une course — la rédaction est celle de
 * `supprimerUnUnivers()`, et pour le même motif.
 */
export async function creerUnCompte(
	base: Base,
	demande: DemandeDeCompte,
	maintenant: Date
): Promise<IssueDUnGeste<VerdictDeCreationDeCompte>> {
	const identifiant = demande.identifiant;
	const courriel = demande.courriel.trim();

	const [prisParIdentifiant] = await base
		.select({ identifiant: comptes.identifiant })
		.from(comptes)
		.where(eq(comptes.identifiant, identifiant))
		.limit(1);
	const [prisParCourriel] = await base
		.select({ courriel: comptes.courriel })
		.from(comptes)
		.where(eq(comptes.courriel, courriel))
		.limit(1);

	const verdict = verdictDeCreationDeCompte(
		{ ...demande, courriel },
		{
			identifiantPris: prisParIdentifiant !== undefined,
			courrielPris: prisParCourriel !== undefined
		}
	);
	if (verdict.issue !== 'possible') return verdict;

	/* LE RATTACHEMENT EST RÉSOLU, JAMAIS DEVINÉ. Une désignation qui ne
	   correspond à aucun domaine rend `introuvable` plutôt que d'écrire un
	   compte sans rattachement : l'administrateur a choisi un domaine, et le
	   rattacher ailleurs — ou nulle part — serait un geste qu'il n'a pas
	   demandé. `null` demandé reste `null` écrit, ce que `RG-M14-04` exige. */
	let domaineId: string | null = null;
	if (demande.domaine !== null) {
		const [ligne] = await base
			.select({ id: domaines.id })
			.from(domaines)
			.innerJoin(univers, eq(domaines.universId, univers.id))
			.where(
				and(
					eq(univers.identifiant, demande.domaine.univers),
					eq(domaines.identifiant, demande.domaine.domaine)
				)
			)
			.limit(1);
		if (ligne === undefined) return { issue: 'introuvable' };
		domaineId = ligne.id;
	}

	await base.insert(comptes).values({
		identifiant,
		nom: verdict.nom,
		courriel,
		role: demande.role,
		actif: true,
		motDePasseVerrouille: demande.motDePasseVerrouille,
		condensatMotDePasse: await hacherMotDePasse(demande.motDePasse),
		/* Voir l'en-tête de section : aucun nœud du gel ne porte cette date. */
		arriveLe: maintenant.toISOString().slice(0, 10),
		creeLe: maintenant,
		modifieLe: maintenant,
		domaineId
	});

	return verdict;
}
