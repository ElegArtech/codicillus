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
	typesDeFiche,
	typesDeNote,
	univers
} from '../base/schema';
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
