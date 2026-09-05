/**
 * Les gestes d'administration — M14. Chaque refus, chaque libellé, chaque sortie proposée est
 * TRANSCRIT du gel, et la ligne est citée là où il est écrit ; là où le gel se tait, ce module
 * se tait aussi. Chaque geste se lit en deux temps : un VERDICT pur — sans base, sans
 * horloge — puis un EXÉCUTANT qui mesure, appelle le verdict et n'écrit que si l'issue est
 * `possible`. `P-09` : « une action interdite n'est pas affichée » ne dispense JAMAIS de la
 * refuser côté serveur.
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
	modulesDeDomaine,
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
import type { CleDeModule, Configuration } from '../../../seeds/corpus';
import { identifiantLisible } from '../rangement/adresses';
import { accord } from '../vocabulaire';
import { auteurDeLaSuppression, tracerUneSuppression } from './traces';
import type { Identite } from '../droits/resolution';

/* 1. Les décomptes — comptés en base au moment du geste, jamais supposés. */

/** Ce qu'un univers retient — `RG-M14-01`, et la liste est celle de `V-27:3555-3556`. */
export interface DecompteDUnUnivers {
	readonly domaines: number;
	readonly notes: number;
}

/**
 * Ce qu'une suppression de domaine détruit — `RG-M14-02`. Les quatre nombres sont
 * ceux du gel, dans son ordre ; les deux du milieu sont des SOUS-ENSEMBLES du
 * premier, et les additionner serait compter deux fois.
 */
export interface DecompteDUnDomaine {
	readonly notes: number;
	/** Les notes portant le type de note « Fiche » — sous-ensemble de `notes`. */
	readonly fichesTypees: number;
	/** Les notes portant le type de note « Signet » — sous-ensemble de `notes`. */
	readonly signets: number;
	/**
	 * Les dossiers, RACINE EXCLUE : elle est une exigence de schéma, sans parent,
	 * l'adresse ne la porte pas et aucun écran ne la montre. La compter dirait un
	 * dossier de plus que ce que l'écran a montré.
	 */
	readonly dossiers: number;
	/**
	 * Les comptes rattachés — `RG-M14-04`. Ils ne sont PAS détruits ; le nombre sert
	 * à l'écrire (`V-28:3229-3230`).
	 */
	readonly comptesRattaches: number;
}

/** Ce qu'un type de fiche retient — `RG-M14-06`, décompte de `V-29:3429-3438`. */
export interface DecompteDUnTypeDeFiche {
	readonly notes: number;
	readonly proprietes: number;
}

/* 2. Les motifs — transcrits du gel, jamais rédigés ici ; chacun porte sa ligne
   de maquette. */

/** `V-27:3541` — l'univers de repli, que `RG-STR-01` rend indestructible. */
export const MOTIF_UNIVERS_SYSTEME =
	'C’est l’univers de repli du produit : quand un domaine perd son rattachement, il atterrit ici plutôt que de disparaître de la navigation. Sans lui, un domaine orphelin deviendrait invisible sans être supprimé. Vous pouvez en revanche changer sa couleur et son rang.';

/**
 * `V-27:3566` — la sortie proposée, seconde moitié de `RG-M14-01`. Le refus seul
 * ne tiendrait pas la règle.
 */
export const SORTIE_RATTACHER_LES_DOMAINES =
	'Un univers ne se supprime que vide, pour qu’aucun contenu ne disparaisse par ricochet. Rattachez d’abord ses domaines ailleurs — « Non classé » convient si aucune destination ne s’impose.';

/** `V-28:1406` — `RG-M14-03`, « définitive : il n'y a pas de corbeille ». */
export const AVERTISSEMENT_DEFINITIF =
	'La suppression est définitive. Il n’y a pas de corbeille : rien de ce qui précède ne pourra être récupéré, ni par vous, ni par un administrateur.';

/**
 * `V-29:3443` — la sortie proposée de `RG-M14-06`. Le refus sans la sortie serait
 * une moitié de règle.
 */
export const SORTIE_DELESTER_LES_NOTES =
	'Délestez d’abord ces notes : elles resteront des notes ordinaires, avec leur contenu rédigé intact, mais perdront leurs propriétés structurées et sortiront de la cartographie.';

/** `V-32:3096` — `RG-M14-07`, et il explique la sortie autant que le refus. */
export const MOTIF_DERNIER_ADMINISTRATEUR =
	'est le seul administrateur actif de l’instance. Le retirer fermerait définitivement l’accès à la console — plus personne ne pourrait créer de domaine, gérer les comptes, ni rendre ce rôle à quiconque. Nommez d’abord un second administrateur : le sélecteur se déverrouillera aussitôt.';

/**
 * `V-32:3278` — le motif de la DÉSACTIVATION, et il n'est pas celui du changement
 * de rôle : les deux gestes se jugent par le même prédicat, mais le gel leur écrit
 * deux phrases différentes. Réutiliser l'une pour l'autre décrirait un autre geste.
 */
export const MOTIF_DERNIER_ADMINISTRATEUR_DESACTIVATION =
	'est le seul administrateur actif. Désactiver ce compte rendrait la console inaccessible et sans recours. Nommez un second administrateur avant de revenir ici.';

/* 3. `RG-M14-01` — un univers qui contient des domaines ne se supprime pas. */

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
 * `RG-M14-01` (`CDC:1131`) — « un univers contenant des domaines ne peut être supprimé. Le
 * produit propose de rattacher ses domaines ailleurs. » `ON DELETE RESTRICT` ne porte que la
 * moitié de la règle : il refuse par une erreur de contrainte, sans décompte et sans sortie.
 * L'ORDRE DES DEUX REFUS EST CELUI DU GEL : un univers système peuplé se voit refuser pour CE
 * motif-là.
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

/* 4. `RG-M14-02` — le décompte exact, et la saisie du nom exact. */

/**
 * La confirmation par le nom — `RG-M14-02`. EXACT VEUT DIRE EXACT : « correspondance exacte,
 * sans tolérance de casse : le geste doit être délibéré » (`V-28:3239-3240`). Aucun `trim()`,
 * aucune normalisation d'accents. `saisie` est `unknown` parce qu'elle vient d'un formulaire :
 * une valeur absente ou multiple n'est pas une chaîne, et ne correspond donc à rien.
 */
export function nomConfirme(nom: string, saisie: unknown): boolean {
	return typeof saisie === 'string' && saisie === nom;
}

export interface EtatDUnDomaine {
	readonly nom: string;
	readonly decompte: DecompteDUnDomaine;
}

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
 * LE DÉCOMPTE EST RENDU DANS LES DEUX ISSUES : c'est lui qu'on affiche AVANT la confirmation,
 * et le gel le rend même à zéro — « c'est lui qui prouve que le domaine est bien vide ». Ne le
 * porter que dans le refus obligerait à le recalculer. L'avertissement de `RG-M14-03`
 * accompagne le refus parce que c'est là qu'il est lu.
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

/* 5. `RG-M14-06` — supprimer un type de fiche utilisé est refusé. */

/** Le verdict d'une suppression de type de fiche — deux issues, celles de `V-29`. */
export type VerdictDUnTypeDeFiche =
	| {
			readonly issue: 'type-utilise';
			readonly decompte: DecompteDUnTypeDeFiche;
			readonly sortie: string;
	  }
	| { readonly issue: 'possible'; readonly decompte: DecompteDUnTypeDeFiche };

/**
 * `RG-M14-06` (`CDC:1163`) — trois obligations, et le verdict les porte toutes :
 * le refus, le nombre, la sortie. `ON DELETE RESTRICT` ne porte que la première.
 */
export function verdictDeSuppressionDUnTypeDeFiche(
	decompte: DecompteDUnTypeDeFiche
): VerdictDUnTypeDeFiche {
	if (decompte.notes > 0) {
		return { issue: 'type-utilise', decompte, sortie: SORTIE_DELESTER_LES_NOTES };
	}
	return { issue: 'possible', decompte };
}

/* 6. `RG-M14-07` — le dernier administrateur. */

/**
 * Le libellé du gel vers l'énuméré de la base — l'inverse de `ROLE_DEPUIS_ENUM`, RETOURNÉE et
 * jamais recopiée : deux tables de libellés finiraient par diverger. Rend `null` pour tout ce
 * qui n'est pas l'un des quatre : un formulaire peut porter n'importe quoi, et un rôle inconnu
 * n'est pas un rôle par défaut.
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

export interface EtatDUnCompte {
	readonly nom: string;
	readonly role: RoleDeCompte;
	readonly actif: boolean;
	readonly administrateursActifs: number;
}

/**
 * Est-ce le dernier administrateur ? — le prédicat de `V-32:2967-2969` : « administrateur ET
 * actif ». Le compte DÉSACTIVÉ n'entre pas dans le compte, cohérent avec `RG-M14-08`.
 *
 * `RG-M14-07` dit « ne peut pas SE retirer LUI-MÊME » ; le prédicat du gel ne dépend pas de
 * l'identité du demandeur, et les deux coïncident — s'il n'existe qu'un administrateur actif
 * et que la console exige ce rôle, le demandeur EST ce compte.
 */
export function estLeDernierAdministrateur(etat: EtatDUnCompte): boolean {
	return etat.role === 'administrateur' && etat.actif && etat.administrateursActifs === 1;
}

export type VerdictDUnChangementDeRole =
	| { readonly issue: 'dernier-administrateur'; readonly motif: string }
	| { readonly issue: 'possible'; readonly role: RoleDeCompte };

/**
 * `RG-M14-07` (`CDC:1183`). LE REFUS PORTE SUR LE RETRAIT, PAS SUR L'ÉDITION : reposer le rôle
 * d'administrateur sur le dernier administrateur ne retire rien. La règle protège l'existence
 * d'un administrateur, pas l'immobilité du formulaire.
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

/* 7. `RG-M14-09` et `RG-M14-10` — les seuils, leur validation, leur effet.

   `RG-M14-09` est tenue par l'ABSENCE DE CACHE, et c'est structurel : la fraîcheur
   n'est pas une colonne (`ADR-005`), elle est calculée à chaque lecture sur les
   seuils que `lireSeuils()` vient de lire.

   `CLES_DE_PARAMETRE`, typée `Record<keyof Configuration, string>`, empêche
   l'écriture de manquer la lecture : un seuil écrit sous un nom que la lecture
   ignorerait est INÉCRIVABLE. */

/** Une erreur de validation, rattachée AU CHAMP concerné — `V-33:2992-3001`. */
export interface ErreurDeConfiguration {
	/** Le champ du gel, par son identifiant de bloc (`champ-frais`, `V-33:2993`). */
	readonly champ:
		| 'frais'
		| 'vieil'
		| 'portail'
		| 'mot'
		| 'versions'
		| 'taille'
		| 'session'
		/* `RG-NF-10` — le message de la page d'indisponibilité. Le champ nommé est
		   celui du TEXTE et non du drapeau : c'est là que le refus se lit. */
		| 'message-indisponibilite';
	readonly message: string;
}

/** Le verdict d'une validation de configuration — `RG-M14-10`. */
export type VerdictDeConfiguration =
	| { readonly issue: 'valeurs-refusees'; readonly erreurs: readonly ErreurDeConfiguration[] }
	| { readonly issue: 'possible'; readonly valeurs: ConfigurationReglableEnConsole };

/** `V-33:3008` et `:3014` — un seuil est un nombre de jours, au moins un. */
export const MESSAGE_SEUIL_MINIMAL = 'Le seuil doit être d’au moins 1 jour.';
/** `V-33:3021` — l'adresse du portail d'assistance. */
export const MESSAGE_ADRESSE_INVALIDE =
	'Adresse invalide. Elle doit commencer par http:// ou https://.';
/** `V-33:3024` — le libellé du concept renommable de M14.7. */
export const MESSAGE_LIBELLE_VIDE =
	'Ce mot apparaît dans toute l’interface : il ne peut pas être vide.';

/**
 * `RG-M07-03` (`CDC:834`) — plafond de versions configurable. Le domaine est
 * celui qu'annonce le champ lui-même (`V-33:434`, de 5 à 500).
 */
export const MESSAGE_PLAFOND_HORS_DOMAINE =
	'Le nombre de versions conservées doit être un entier compris entre 5 et 500.';
/**
 * `V-33:503` — le champ va de 1 à 500 Mo. Un plafond nul refuserait TOUTE pièce
 * jointe (`fichiers/epreuve.ts`, qui en fait des octets).
 */
export const MESSAGE_TAILLE_HORS_DOMAINE =
	'La taille maximale d’une pièce jointe doit être un entier de 1 à 500 Mo.';
/**
 * `sessions.ts` refuse déjà une durée nulle ou négative, et il la refuse en
 * LEVANT depuis `hooks.server.ts` : toute requête authentifiée sortirait en 500.
 */
/** `RG-NF-10` — activer sans message. Le champ nommé est celui du texte, pas du drapeau. */
export const MESSAGE_INDISPONIBILITE_VIDE =
	'Écrivez ce que la page annoncera : sans message, les comptes renvoyés n’apprendraient rien.';

export const MESSAGE_SESSION_HORS_DOMAINE =
	'La durée de session doit être un nombre de minutes strictement positif.';

/**
 * `V-33:3016` — le second seuil doit DÉPASSER le premier, et le gel dit pourquoi : « en
 * l'état, aucune note ne serait jamais vieillissante ». Le message porte le seuil frais saisi,
 * il est donc composé comme le gel le compose. Il a un jumeau qui écrit dans le MÊME nœud,
 * pour l'aperçu immédiat : une divergence se lirait au même endroit.
 */
export function messageSeuilNonCroissant(seuilFrais: number): string {
	return `Doit dépasser le seuil frais (${seuilFrais} ${accord(seuilFrais, 'jour')}). En l’état, aucune note ne serait jamais vieillissante : le témoin passerait directement du vert au rouge.`;
}

/**
 * Les dix paramètres que `V-33` règle AUJOURD'HUI — et le fait qu'ils ne soient plus la
 * configuration entière est ÉCRIT, non subi. `Record<ChampReglableEnConsole, string>` reste le
 * garde-fou : un paramètre nommé ici ne compile pas tant qu'il n'a pas son champ dans la table
 * du câblage et dans la lecture.
 *
 * Un champ déclaré ici sans `input` correspondant est un piège : le formulaire n'envoie rien,
 * `texte()` rend la chaîne vide et l'enregistrement écrase la valeur réglée à chaque clic. Le
 * préfixe `c-` fait partie du nom. C'EST POURQUOI LES CINQ RÉGLAGES DU CYCLE DE VIVACITÉ EN
 * SONT EXCLUS : la migration `014` les a posés en base et la lecture leur donne leur défaut,
 * mais `V-33` ne porte pas encore leurs champs. Les nommer ici les remettrait à zéro à chaque
 * enregistrement de la console. Ils y entreront avec les champs qui les règlent.
 */
export type ChampReglableEnConsole = Exclude<
	keyof Configuration,
	'validiteReference' | 'validiteOperationnel' | 'seuilBientot' | 'retardRevoir' | 'retardObsolete'
>;

/** Les dix réglages que `V-33` porte. */
export type ConfigurationReglableEnConsole = Pick<Configuration, ChampReglableEnConsole>;

export const CHAMPS_DE_CONFIGURATION: Readonly<Record<ChampReglableEnConsole, string>> =
	Object.freeze({
		seuilFrais: 'c-frais',
		seuilVieillissant: 'c-vieil',
		versionsMax: 'c-versions',
		portailAssistance: 'c-portail',
		nomOrganisation: 'c-organisation',
		motFiche: 'c-mot',
		tailleMaxPieceJointe: 'c-taille',
		dureeSession: 'c-session',
		indisponibiliteActive: 'c-indisponibilite',
		messageDIndisponibilite: 'c-message-indisponibilite'
	});

/**
 * Ce que le formulaire porte, lu comme `V-33:2968-2976` le lit — y compris les conséquences :
 * un champ vide devient `0`, une saisie non numérique `NaN`. C'est `validerLaConfiguration()`
 * qui refuse les deux ; nettoyer ici lui cacherait la faute. La fonction reçoit un LECTEUR et
 * non `FormData`, ce qui la rend éprouvable sans requête.
 */
export function valeursDeConfigurationSaisies(
	lire: (champ: string) => unknown
): ConfigurationReglableEnConsole {
	const texte = (champ: ChampReglableEnConsole): string => {
		const brut = lire(CHAMPS_DE_CONFIGURATION[champ]);
		return typeof brut === 'string' ? brut : '';
	};
	const nombre = (champ: ChampReglableEnConsole): number => Number(texte(champ));
	/* `oui` ET RIEN D'AUTRE ACTIVE — le sélecteur de `V-33` n'écrit que `oui` ou
	   `non`, et toute autre valeur est une soumission qui n'en vient pas : elle
	   laisse l'instance DISPONIBLE. Un drapeau se ferme par défaut. */
	const drapeau = (champ: ChampReglableEnConsole): boolean => texte(champ) === 'oui';

	return {
		seuilFrais: nombre('seuilFrais'),
		seuilVieillissant: nombre('seuilVieillissant'),
		versionsMax: nombre('versionsMax'),
		portailAssistance: texte('portailAssistance').trim(),
		nomOrganisation: texte('nomOrganisation').trim(),
		motFiche: texte('motFiche').trim(),
		tailleMaxPieceJointe: nombre('tailleMaxPieceJointe'),
		dureeSession: nombre('dureeSession'),
		indisponibiliteActive: drapeau('indisponibiliteActive'),
		messageDIndisponibilite: texte('messageDIndisponibilite').trim()
	};
}

/** `V-33:3020` — l'expression du gel, transcrite sans y toucher. */
const ADRESSE_DE_PORTAIL = /^https?:\/\/[\w-]+(\.[\w-]+)+/;

/**
 * `RG-M14-10` (`CDC:1202`) — « la validation refuse les combinaisons incohérentes […] avec un
 * message explicite ».
 *
 * Les quatre premiers contrôles sont ceux de `valider()` (`V-33:3003-3027`), dans son ordre.
 * Les trois derniers sont ceux que le cahier nomme et que le gel n'a pas dessinés ; s'arrêter
 * aux quatre du gel laisse trois portes ouvertes — un plafond de versions à zéro, un plafond
 * de pièce jointe à zéro octet, et une durée de session nulle qui fait sortir TOUTE requête
 * authentifiée en 500. Le `min` des champs ne garde rien : le câblage écoute un `click` et
 * compose la charge depuis `champ.value`, sans `checkValidity()`.
 *
 * TOUTES LES ERREURS SONT RENDUES, jamais la première : le gel marque les quatre champs en un
 * seul passage.
 */
export function validerLaConfiguration(
	valeurs: ConfigurationReglableEnConsole
): VerdictDeConfiguration {
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
	if (
		!Number.isSafeInteger(valeurs.versionsMax) ||
		valeurs.versionsMax < 5 ||
		valeurs.versionsMax > 500
	) {
		erreurs.push({ champ: 'versions', message: MESSAGE_PLAFOND_HORS_DOMAINE });
	}
	if (
		!Number.isSafeInteger(valeurs.tailleMaxPieceJointe) ||
		valeurs.tailleMaxPieceJointe < 1 ||
		valeurs.tailleMaxPieceJointe > 500
	) {
		erreurs.push({ champ: 'taille', message: MESSAGE_TAILLE_HORS_DOMAINE });
	}
	if (!Number.isFinite(valeurs.dureeSession) || valeurs.dureeSession < 1) {
		erreurs.push({ champ: 'session', message: MESSAGE_SESSION_HORS_DOMAINE });
	}
	/* `RG-NF-10` — UNE PAGE D'INDISPONIBILITÉ QUI N'ANNONCE RIEN NE VAUT PAS MIEUX
	   QU'UNE PANNE : l'activation exige son message. La désactivation ne l'exige pas,
	   et le message conservé reste disponible pour la fois suivante. */
	if (valeurs.indisponibiliteActive && valeurs.messageDIndisponibilite === '') {
		erreurs.push({ champ: 'message-indisponibilite', message: MESSAGE_INDISPONIBILITE_VIDE });
	}

	if (erreurs.length > 0) return { issue: 'valeurs-refusees', erreurs };
	return { issue: 'possible', valeurs };
}

/* 8. Les mesures en base — ce que les exécutants lisent avant de décider. */

interface UniversEnBase extends EtatDUnUnivers {
	readonly id: string;
	/** Le nom d'affichage — ce que la trace de `RG-NF-05` inscrit en désignation. */
	readonly nom: string;
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
		nom: ligne.nom,
		systeme: ligne.systeme,
		decompte: { domaines: mesure?.domaines ?? 0, notes: mesure?.notes ?? 0 }
	};
}

/**
 * Les deux types de note que le décompte isole — `V-28:2950-2951`. Ce sont des
 * TYPES DE NOTE (`types_de_note.nom`), à ne pas confondre avec `estFiche()` du jeu
 * de semence, qui lit `notes.type_de_fiche_id`. Le gel compte par le type de note.
 */
const NOM_DU_TYPE_FICHE = 'Fiche';
const NOM_DU_TYPE_SIGNET = 'Signet';

interface DomaineEnBase extends EtatDUnDomaine {
	readonly id: string;
	/** Les identifiants lisibles des notes à retirer de l'index — `RG-M14-05`. */
	readonly notesAOublier: readonly string[];
}

/**
 * L'état d'un domaine, mesuré, ET la liste des notes qu'il porte. LES IDENTIFIANTS SONT LUS
 * AVANT LA SUPPRESSION : `entretenirLIndex()` déduit la disparition en relisant la base, mais
 * encore faut-il pouvoir les lui demander — après la transaction, plus rien ne les nomme.
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

interface TypeDeFicheEnBase {
	readonly id: string;
	/** Le nom d'affichage — la désignation que la trace de `RG-NF-05` inscrit. */
	readonly nom: string;
	readonly decompte: DecompteDUnTypeDeFiche;
}

export async function mesurerUnTypeDeFiche(
	base: Base,
	identifiant: string
): Promise<TypeDeFicheEnBase | null> {
	const [ligne] = await base
		.select({ id: typesDeFiche.id, nom: typesDeFiche.nom })
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
		nom: ligne.nom,
		decompte: { notes: portees?.notes ?? 0, proprietes: champs?.proprietes ?? 0 }
	};
}

interface CompteEnBase extends EtatDUnCompte {
	readonly id: string;
}

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

/* 9. Les exécutants. */

export type IssueDUnGeste<T> = { readonly issue: 'introuvable' } | T;

/* ─────────────────────────── Le détail des traces — `RG-NF-05` ───────────────────
   CE QUI EST PARTI AVEC L'OBJET DÉTRUIT, EN CLAIR. La trace reprend le décompte que
   l'écran de confirmation a DÉJÀ montré : un second compte, calculé autrement, ferait
   deux vérités sur le même geste. Les postes à zéro sont TUS — « 0 dossier » est du
   bruit dans un journal qu'on relit. */

function detailDuDomaine(decompte: DecompteDUnDomaine): string {
	const postes: string[] = [];
	if (decompte.notes > 0) {
		postes.push(`${String(decompte.notes)} ${accord(decompte.notes, 'note')}`);
	}
	if (decompte.dossiers > 0) {
		postes.push(`${String(decompte.dossiers)} ${accord(decompte.dossiers, 'dossier')}`);
	}
	if (decompte.signets > 0) {
		postes.push(`${String(decompte.signets)} ${accord(decompte.signets, 'signet')}`);
	}
	if (decompte.comptesRattaches > 0) {
		postes.push(
			`${String(decompte.comptesRattaches)} ${accord(decompte.comptesRattaches, 'compte détaché', 'comptes détachés')}`
		);
	}
	return postes.join(', ');
}

/**
 * LE DÉTAIL DIT LA SORTIE, ET IL LE DOIT : « 3 relations » ne distingue pas des relations
 * DÉTRUITES de relations RÉAFFECTÉES, et les deux ne se relisent pas de la même façon.
 */
function detailDuTypeDeRelation(portees: number, sortie: SortieDUnTypeDeRelation): string {
	if (portees === 0) return '';
	const nombre = `${String(portees)} ${accord(portees, 'relation')}`;
	return sortie === 'reaffecter' ? `${nombre} réaffectées` : `${nombre} détruites`;
}

/**
 * AUCUNE NOTE N'EST DÉTRUITE AVEC UN TYPE DE NOTE — elles changent de type. Compter sans
 * dire ce qui leur est arrivé ferait lire une destruction là où il n'y a qu'un déplacement.
 */
function detailDuTypeDeNote(notesPortees: number, templatesPortes: number): string {
	const postes: string[] = [];
	if (notesPortees > 0) {
		postes.push(`${String(notesPortees)} ${accord(notesPortees, 'note')}`);
	}
	if (templatesPortes > 0) {
		postes.push(`${String(templatesPortes)} ${accord(templatesPortes, 'template')}`);
	}
	return postes.length === 0 ? '' : `${postes.join(' et ')} réaffectés, aucun détruit`;
}

/**
 * Supprimer un univers — `RG-M14-01`. Une seule écriture, aucune transaction : `ON DELETE
 * RESTRICT` fait de cette suppression un geste atomique par nature. Le verdict la refuse
 * avant, la contrainte reste le dernier mot — l'une des deux gardes est une course.
 */
export async function supprimerUnUnivers(
	base: Base,
	identifiant: string,
	identite: Identite
): Promise<IssueDUnGeste<VerdictDUnUnivers>> {
	const etat = await mesurerUnUnivers(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDeSuppressionDUnUnivers(etat);
	if (verdict.issue !== 'possible') return verdict;

	/* `RG-NF-05` — l'auteur est exigé AVANT la transaction : un refus tombe avant
	   toute destruction, jamais au milieu. */
	const auteur = auteurDeLaSuppression(identite);

	/* LES RANGS RESTENT CONTIGUS APRÈS LA SUPPRESSION (`V-27:3513`). Sans cette
	   renumérotation, un trou survit au geste et le rang « Position 3 » du
	   sélecteur ne désigne plus le troisième univers. */
	await base.transaction(async (tx) => {
		await tx.delete(univers).where(eq(univers.id, etat.id));
		/* La trace partage la transaction de la destruction — `RG-NF-05`. Un univers
		   ne se supprime que VIDE : il n'y a rien à détailler. */
		await tracerUneSuppression(tx, {
			objet: 'univers',
			reference: identifiant,
			designation: etat.nom,
			auteur
		});
		const restants = await tx.select({ id: univers.id }).from(univers).orderBy(univers.ordre);
		await renumeroterLesUnivers(
			tx,
			restants.map((u) => u.id)
		);
	});
	return verdict;
}

/**
 * Supprimer un domaine et tout son contenu — `RG-M14-02`, `03`, `04`, `05`.
 *
 * `RG-M14-03` exige une TRANSACTION, et l'ORDRE DES DEUX SUPPRESSIONS N'EST PAS LIBRE :
 * `notes.domaine_id` est en `ON DELETE RESTRICT`, supprimer le domaine d'abord échouerait. Les
 * notes partent les premières, et tout ce qui pend à elles suit en cascade — relations DANS
 * LES DEUX SENS (`RG-M08-05`), pièces jointes, vérifications, étiquettes, versions. Le domaine
 * emporte ensuite ses dossiers et ses modules, et REND VIDE le rattachement des comptes.
 *
 * `RG-M14-05` — l'entretien est APPELÉ, jamais réécrit, et il SUIT la validation de la
 * transaction : il suffit de lui DEMANDER les identifiants.
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
		readonly identite: Identite;
	}
): Promise<IssueDUnGeste<VerdictDUnDomaine>> {
	const etat = await mesurerUnDomaine(base, demande.univers, demande.domaine);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDeSuppressionDUnDomaine(etat, demande.saisie);
	if (verdict.issue !== 'possible') return verdict;

	/* `RG-NF-05` — l'auteur est exigé avant la transaction. */
	const auteur = auteurDeLaSuppression(demande.identite);

	await base.transaction(async (tx) => {
		await tx.delete(notes).where(eq(notes.domaineId, etat.id));
		await tx.delete(domaines).where(eq(domaines.id, etat.id));
		/* CE QUI EST PARTI AVEC, EN CLAIR — le décompte que l'écran de confirmation a
		   déjà montré, jamais un second calculé autrement. */
		await tracerUneSuppression(tx, {
			objet: 'domaine',
			reference: `${demande.univers}/${demande.domaine}`,
			designation: etat.nom,
			detail: detailDuDomaine(etat.decompte),
			auteur
		});
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
	await entretenirLIndex(base, client, etat.notesAOublier);

	return verdict;
}

/**
 * Supprimer un type de fiche — `RG-M14-06`. Les propriétés du type partent en
 * cascade, ce que le décompte annonce ; aucune note n'est touchée — le verdict a
 * déjà refusé s'il y en avait.
 */
export async function supprimerUnTypeDeFiche(
	base: Base,
	identifiant: string,
	identite: Identite
): Promise<IssueDUnGeste<VerdictDUnTypeDeFiche>> {
	const etat = await mesurerUnTypeDeFiche(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDeSuppressionDUnTypeDeFiche(etat.decompte);
	if (verdict.issue !== 'possible') return verdict;

	const auteur = auteurDeLaSuppression(identite);
	/* UNE TRANSACTION LÀ OÙ IL N'Y EN AVAIT PAS : la destruction seule était atomique
	   par nature, la trace de `RG-NF-05` ne l'est plus — écrite hors transaction, elle
	   survivrait à un `delete` refusé, ou manquerait à un `delete` réussi. */
	await base.transaction(async (tx) => {
		await tx.delete(typesDeFiche).where(eq(typesDeFiche.id, etat.id));
		await tracerUneSuppression(tx, {
			objet: 'type de fiche',
			reference: identifiant,
			designation: etat.nom,
			auteur
		});
	});
	return verdict;
}

/**
 * Délester les notes d'un type de fiche — la sortie que `RG-M14-06` propose, lue au gel
 * (`V-29:3464-3468`, « les notes conservent leur contenu, sans propriétés structurées »).
 *
 * LES DEUX COLONNES PARTENT ENSEMBLE : retirer le type sans les propriétés laisserait des
 * valeurs orphelines dont plus aucun schéma ne dirait le sens. Une seule instruction, donc
 * atomique par nature.
 *
 * L'INDEX N'EST PAS ENTRETENU, et il faut le dire : aucune note ne disparaît, mais leur type
 * de fiche change — une projection qui le porterait serait périmée jusqu'à la prochaine
 * écriture.
 *
 * @returns le nombre de notes délestées, ou `introuvable`.
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
 * Changer le rôle d'un compte — `RG-M14-07`. Le refus est prononcé AVANT
 * l'écriture, sur une mesure prise dans la même requête : aucune contrainte de base
 * ne porte cette règle, `comptes.role` étant un énuméré ordinaire.
 *
 * LE RATTACHEMENT PART DANS LA MÊME ÉCRITURE, ET C'ÉTAIT LE DÉFAUT : `#f-domaine` est
 * rendu, modifiable, et « Enregistrer » ne l'envoyait pas — changer le domaine d'un
 * compte existant ne faisait rien du tout. Les deux colonnes sont réglées par le même
 * panneau, elles partent par le même geste.
 *
 * TROIS ÉTATS, ET PAS DEUX : `undefined` ne touche pas la colonne — l'appelant qui ne
 * parle pas du rattachement ne le défait pas —, `null` la vide, un couple la pose. Un
 * couple qui ne désigne aucun domaine rend `introuvable` : le rattachement est résolu,
 * jamais deviné.
 */
export async function changerLeRoleDUnCompte(
	base: Base,
	identifiant: string,
	nouveauRole: RoleDeCompte,
	maintenant: Date,
	rattachement?: { readonly univers: string; readonly domaine: string } | null
): Promise<IssueDUnGeste<VerdictDUnChangementDeRole>> {
	const etat = await mesurerUnCompte(base, identifiant);
	if (etat === null) return { issue: 'introuvable' };

	const verdict = verdictDuChangementDeRole(etat, nouveauRole);
	if (verdict.issue !== 'possible') return verdict;

	let domaineId: string | null = null;
	if (rattachement !== undefined && rattachement !== null) {
		const [ligne] = await base
			.select({ id: domaines.id })
			.from(domaines)
			.innerJoin(univers, eq(domaines.universId, univers.id))
			.where(
				and(
					eq(univers.identifiant, rattachement.univers),
					eq(domaines.identifiant, rattachement.domaine)
				)
			)
			.limit(1);
		if (ligne === undefined) return { issue: 'introuvable' };
		domaineId = ligne.id;
	}

	await base
		.update(comptes)
		.set({
			role: verdict.role,
			modifieLe: maintenant,
			...(rattachement === undefined ? {} : { domaineId })
		})
		.where(eq(comptes.id, etat.id));
	return verdict;
}

export type VerdictDUnTemplate = { readonly issue: 'possible'; readonly template: string };

/**
 * Supprimer un template — `RG-REF-01`, et une suppression qui ne se refuse pas. `V-31:202` :
 * « modifier ou supprimer un template n'affecte AUCUNE note existante. Un squelette est copié
 * au moment de la création. » Rien à décompter, rien à délester, rien à confirmer.
 *
 * Le dialogue porte un AVERTISSEMENT, non un refus, quand le template visé est celui par
 * défaut. Le geste ne promeut aucun remplaçant : la maquette n'en désigne aucun.
 */
export async function supprimerUnTemplate(
	base: Base,
	identifiant: string,
	identite: Identite
): Promise<IssueDUnGeste<VerdictDUnTemplate>> {
	const [ligne] = await base
		.select({ id: templates.id, nom: templates.nom })
		.from(templates)
		.where(eq(templates.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined) return { issue: 'introuvable' };

	const auteur = auteurDeLaSuppression(identite);
	await base.transaction(async (tx) => {
		await tx.delete(templates).where(eq(templates.id, ligne.id));
		await tracerUneSuppression(tx, {
			objet: 'template',
			reference: identifiant,
			designation: ligne.nom,
			auteur
		});
	});
	return { issue: 'possible', template: ligne.nom };
}

/**
 * Marquer un template par défaut — `RG-REF-02`, et l'unicité EST le geste : « cocher décochera
 * "X", qui l'est actuellement ». LES DEUX ÉCRITURES SONT DANS UNE TRANSACTION : entre les
 * deux, la base porterait deux templates par défaut, ou zéro selon l'ordre, et aucune
 * contrainte ne l'interdit. L'ordre est : démarquer tout, puis marquer celui-ci.
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
 * Ce qu'il advient des relations d'un type supprimé — les deux sorties de `V-30`,
 * et il n'y en a pas d'autres : « aucune fiche n'est supprimée dans les deux cas,
 * seul le lien entre elles est concerné ».
 */
export type SortieDUnTypeDeRelation = 'reaffecter' | 'supprimer';

export type VerdictDUnTypeDeRelation =
	| { readonly issue: 'cible-invalide' }
	| {
			readonly issue: 'possible';
			readonly relations: number;
			readonly sortie: SortieDUnTypeDeRelation;
	  };

/**
 * Supprimer un type de relation — `RG-M08-06`, `RG-M08-07`. Trois cas, tous au gel
 * (`V-30:513-556`) : aucune relation, réaffecter, supprimer aussi.
 *
 * UNE TRANSACTION, PARCE QUE `type_de_relation_id` EST EN `ON DELETE RESTRICT` : les deux
 * écritures sont ordonnées et indissociables — traiter les relations, puis retirer le type.
 *
 * LA RÉAFFECTATION PEUT SE HEURTER À L'UNICITÉ, ET CE N'EST PAS UNE ERREUR : réaffecter vers
 * un type que le même couple porte DÉJÀ produirait un doublon. Ces relations-là sont retirées
 * plutôt que réécrites. L'index n'est pas entretenu : la projection ne porte pas les relations.
 */
export async function supprimerUnTypeDeRelation(
	base: Base,
	demande: {
		readonly type: string;
		readonly sortie: SortieDUnTypeDeRelation;
		readonly vers?: string;
		readonly identite: Identite;
	}
): Promise<IssueDUnGeste<VerdictDUnTypeDeRelation>> {
	const [type] = await base
		/* `types_de_relation` n'a pas de colonne `nom` : le LIBELLÉ SORTANT est ce que
		   les écrans affichent, et c'est donc la désignation de la trace. */
		.select({ id: typesDeRelation.id, nom: typesDeRelation.libelleSortant })
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

	const auteur = auteurDeLaSuppression(demande.identite);

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
		/* `RG-NF-05`. LE DÉTAIL DIT LA SORTIE, et il le doit : « 3 relations » ne
		   distingue pas des relations DÉTRUITES de relations RÉAFFECTÉES, et les deux
		   ne se relisent pas de la même façon six mois plus tard. */
		await tracerUneSuppression(tx, {
			objet: 'type de relation',
			reference: demande.type,
			designation: type.nom,
			detail: detailDuTypeDeRelation(portees.length, demande.sortie),
			auteur
		});
	});

	return { issue: 'possible', relations: portees.length, sortie: demande.sortie };
}

/** Le verdict d'une désactivation — deux issues, celles du dialogue de `V-32`. */
export type VerdictDeDesactivation =
	| { readonly issue: 'refus-dernier-administrateur'; readonly motif: string }
	| { readonly issue: 'possible'; readonly actif: boolean };

/**
 * Activer ou désactiver un compte — `RG-M14-08` : « un compte désactivé perd IMMÉDIATEMENT
 * l'accès mais reste attaché à ses contributions passées ».
 *
 * LA MOITIÉ « IMMÉDIATEMENT » EST DÉJÀ ÉCRITE AILLEURS : `src/hooks.server.ts` ferme la session
 * au premier accès. LA MOITIÉ « RESTE ATTACHÉ » EST TENUE PAR L'ABSENCE : aucune ligne
 * ci-dessous ne touche `notes.auteur_id`, ni `verifications`, ni `versions`. LE REFUS DU
 * DERNIER ADMINISTRATEUR emploie `estLeDernierAdministrateur()`, le prédicat du changement de
 * rôle ; le MOTIF est propre au geste, et la réactivation n'est jamais refusée.
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
 * Enregistrer la configuration — `RG-M14-09` et `RG-M14-10`.
 *
 * LES LIGNES SONT ÉCRITES DANS UNE SEULE TRANSACTION : deux seuils écrits à moitié seraient
 * une combinaison que `RG-M14-10` refuse. LE RECALCUL N'EST PAS DÉCLENCHÉ, IL EST INÉVITABLE :
 * aucun cache, aucune colonne de niveau, aucun agrégat stocké.
 *
 * CHAQUE LIGNE EST POSÉE, PAS SEULEMENT MISE À JOUR : sur une instance neuve, `parametres` est
 * VIDE, un `update` nu y touche zéro ligne et ne lève pas — les sept réglages étaient alors
 * inertes. `parametres.cle` étant la clé primaire, il n'y a pas de second discriminant.
 */
export async function enregistrerLaConfiguration(
	base: Base,
	valeurs: ConfigurationReglableEnConsole,
	maintenant: Date
): Promise<VerdictDeConfiguration> {
	const verdict = validerLaConfiguration(valeurs);
	if (verdict.issue !== 'possible') return verdict;

	/* LES CLÉS ÉCRITES SONT CELLES QUE L'ÉCRAN RÈGLE : la boucle parcourt les CHAMPS
	   DU FORMULAIRE, non les clés de base. Le jour où un paramètre de base n'aura pas
	   d'écran, parcourir `CLES_DE_PARAMETRE` le poserait à sa valeur vide à chaque
	   enregistrement. */
	const champs = Object.keys(CHAMPS_DE_CONFIGURATION) as readonly ChampReglableEnConsole[];
	const lignes = champs.map((champ) => ({
		cle: CLES_DE_PARAMETRE[champ],
		valeur: valeurs[champ],
		modifieLe: maintenant
	}));

	await base.transaction(async (tx) => {
		for (const ligne of lignes) {
			await tx
				.insert(parametres)
				.values(ligne)
				.onConflictDoUpdate({
					target: parametres.cle,
					set: { valeur: ligne.valeur, modifieLe: ligne.modifieLe }
				});
		}
	});

	return verdict;
}

/* 11. Créer un compte — `UC-M14-07`, `RG-CPT-01`, `RG-CPT-02`.

   `RG-CPT-02` interdit deux choses, et deux seulement : qu'un compte s'attribue à
   LUI-MÊME le rôle d'administrateur, et que le PREMIER administrateur naisse de
   l'interface. Le gel tranche dans le même sens — `V-32:3134` ne verrouille le
   sélecteur de rôle QUE hors création.

   Les deux interdits sont tenus sans qu'une ligne ne les réécrive : le geste crée un
   compte NOUVEAU, dont l'identifiant diffère de celui de l'appelant ; et la route
   exige déjà le rôle administrateur. La règle est portée par la GARDE.

   Deux colonnes de `comptes` sont `NOT NULL` sans qu'un nœud du gel les renseigne :
   `arrive_le`, qui reçoit la DATE DU GESTE, seule que la requête connaisse ; et
   `courriel`, `NOT NULL` ET `UNIQUE` quand le gel l'offre sans étoile d'obligation —
   le verdict refuse AVANT l'écriture, et ce refus n'a aucun nœud au gel. */

/**
 * La désignation canonique d'un domaine : `RG-STR-02` ne rend l'identifiant unique
 * qu'au sein de son univers. REDÉCLARÉE ici plutôt qu'importée de `./consoles.ts`,
 * qui importe déjà ce module — l'importer en retour ferait un cycle.
 */
export interface DomaineCanonique {
	readonly univers: string;
	readonly domaine: string;
}

/** Les sept nœuds du formulaire de `V-32:1344-1401`, et pas un de plus. */
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
 * Une erreur de saisie, rattachée au bloc du gel qui sait la dire. Il n'existe que
 * DEUX blocs d'erreur au gel : aucun troisième champ ne peut porter un message, et
 * le verdict n'en fabrique pas.
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

/** La forme d'un identifiant de connexion — l'expression du gel, `V-32:3183`. */
const FORME_DE_LIDENTIFIANT = /^[a-z0-9]+([._-][a-z0-9]+)*$/;

/**
 * La normalisation que le gel applique avant de juger (`V-32:3175`), faite ICI et
 * une seule fois : le doublon se cherche sur la forme normalisée, et c'est elle qui
 * est écrite.
 */
export function identifiantNormalise(saisie: unknown): string {
	return typeof saisie === 'string' ? saisie.trim().toLowerCase() : '';
}

export interface EtatDeCreationDeCompte {
	readonly identifiantPris: boolean;
	readonly courrielPris: boolean;
}

export type VerdictDeCreationDeCompte =
	| { readonly issue: 'saisie-refusee'; readonly erreurs: readonly ErreurDeSaisieDeCompte[] }
	/** `#f-mdp` vide — obligatoire au gel (`V-32:1372`), sans bloc d'erreur. */
	| { readonly issue: 'mot-de-passe-vide' }
	| { readonly issue: 'courriel-indisponible'; readonly courriel: string }
	| { readonly issue: 'possible'; readonly identifiant: string; readonly nom: string };

/**
 * Le verdict d'une création — fonction pure, sans base et sans horloge. L'ORDRE DES TROIS
 * CONTRÔLES D'IDENTIFIANT EST CELUI DU GEL : vide, doublon, forme. Un identifiant vide n'est
 * pas « mal formé », il est absent. LES DEUX CHAMPS SONT JUGÉS ENSEMBLE : un formulaire qui ne
 * dirait qu'une faute à la fois ferait retaper l'utilisateur deux fois.
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
 * Créer un compte — l'exécutant.
 *
 * LE MOT DE PASSE EN CLAIR NE SORT PAS DE CETTE FONCTION : il est condensé par
 * `hacherMotDePasse()`, seul chemin du dépôt vers Argon2id, et seul le condensat est écrit.
 * La course entre la mesure et l'écriture reste possible, et la base a le dernier mot : les
 * deux contraintes d'unicité refuseront un doublon glissé entre les deux.
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

	/* LE RATTACHEMENT EST RÉSOLU, JAMAIS DEVINÉ : une désignation qui ne correspond à
	   aucun domaine rend `introuvable`. `null` demandé reste `null` écrit. */
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
		/* « Il devra être changé à la première connexion » (`V-32:913`) : la garde de
		   `src/hooks.server.ts` renvoie le compte vers son profil. SAUF SI LE MOT DE PASSE
		   EST VERROUILLÉ — `RG-CPT-01` lui interdit de le changer, et le lui imposer
		   l'enfermerait dehors. */
		motDePasseAChanger: !demande.motDePasseVerrouille,
		condensatMotDePasse: await hacherMotDePasse(demande.motDePasse),
		/* Voir l'en-tête de section : aucun nœud du gel ne porte cette date. */
		arriveLe: maintenant.toISOString().slice(0, 10),
		creeLe: maintenant,
		modifieLe: maintenant,
		domaineId
	});

	return verdict;
}

/* 10. La structure — créer et modifier, sur le motif des précédents. Les messages
   de refus sont ceux du gel, rien n'est reformulé.

   LES CONTRAINTES DE BASE RESTENT LE DERNIER MOT : les quatre unicités refuseront un
   doublon glissé entre la mesure et l'écriture. */

/** `V-27:3488` — le nom manquant, mot pour mot. */
export const MESSAGE_NOM_DUNIVERS_VIDE = "Donnez un nom à l'univers.";
/** `V-28:3167`. */
export const MESSAGE_NOM_DE_DOMAINE_VIDE = 'Donnez un nom au domaine.';
/** `V-29:3393`. */
export const MESSAGE_NOM_DE_TYPE_VIDE = 'Donnez un nom au type.';
/** `V-30:3087`. */
export const MESSAGE_LIBELLE_DIRECT_VIDE = 'Saisissez le libellé direct.';
/** `V-30:3090`. */
export const MESSAGE_LIBELLE_INVERSE_VIDE = 'Saisissez le libellé inverse.';
/**
 * `V-30:3092` — « deux libellés identiques signalent presque toujours un oubli :
 * sans inverse distinct, le panneau Relations de la cible devient illisible. »
 */
export const MESSAGE_LIBELLES_IDENTIQUES =
	"Le libellé inverse est identique au direct. Relisez l'aperçu : la seconde phrase doit se lire naturellement.";

/** « … existe déjà. » — `V-27:3493`, guillemets du gel compris. */
export function messageDejaPris(nom: string): string {
	return `« ${nom} » existe déjà.`;
}

/**
 * Une erreur de saisie, rattachée au champ du gel : `champ` porte la clé du bloc
 * `.champ__erreur` — `nom` pour V-27 à V-29, `direct` et `inverse` pour V-30.
 */
export interface RefusDeSaisie {
	readonly champ: string;
	readonly message: string;
}

export type VerdictDeStructure =
	| { readonly issue: 'saisie-refusee'; readonly erreurs: readonly RefusDeSaisie[] }
	| { readonly issue: 'possible'; readonly identifiant: string; readonly nom: string };

function refuser(champ: string, message: string): VerdictDeStructure {
	return { issue: 'saisie-refusee', erreurs: [{ champ, message }] };
}

/**
 * L'identifiant lisible, dérivé du nom puis rendu libre. `identifiantLisible()` est la seule
 * dérivation du dépôt. Deux noms distincts peuvent donner le même identifiant, or la colonne
 * est unique : le suffixe numéroté est la sortie, et il est déterministe. Un nom sans
 * caractère alphanumérique retombe sur `element`.
 */
function identifiantLibre(nom: string, pris: readonly string[]): string {
	const racine = identifiantLisible(nom) || 'element';
	const occupes = new Set(pris);
	if (!occupes.has(racine)) return racine;
	for (let suffixe = 2; ; suffixe += 1) {
		const candidat = `${racine}-${suffixe}`;
		if (!occupes.has(candidat)) return candidat;
	}
}

function memeNom(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase();
}

/**
 * La place demandée, ramenée dans ses bornes. Le rang du gel est un ENTIER À PARTIR
 * DE 1 ; une valeur hors bornes ne fait pas échouer le geste, elle est ramenée.
 */
function placeDemandee(rang: number, combien: number): number {
	if (!Number.isFinite(rang)) return combien;
	return Math.min(Math.max(Math.trunc(rang), 1), combien);
}

/**
 * Renuméroter `ordre` de 1 à N — la dernière ligne du geste de validation du gel.
 * Les rangs restent contigus, et aucun trou ne survit à un enregistrement.
 */
async function renumeroterLesUnivers(
	executeur: Base | Parameters<Parameters<Base['transaction']>[0]>[0],
	idsEnOrdre: readonly string[]
): Promise<void> {
	let rang = 1;
	for (const id of idsEnOrdre) {
		await executeur.update(univers).set({ ordre: rang }).where(eq(univers.id, id));
		rang += 1;
	}
}

/** Ce que le panneau de `V-27` porte, champ pour champ. */
export interface SaisieDUnUnivers {
	readonly nom: string;
	readonly description: string;
	readonly couleur: string;
	readonly glyphe: string;
	/** La place demandée dans la navigation — `#f-position`, à partir de 1. */
	readonly ordre: number;
}

/**
 * Créer un univers — `RG-STR-01`. L'INSERTION ET LA RENUMÉROTATION SONT
 * INDISSOCIABLES : un univers inséré sans que les suivants aient reculé porterait
 * le rang d'un autre.
 */
export async function creerUnUnivers(
	base: Base,
	saisie: SaisieDUnUnivers
): Promise<VerdictDeStructure> {
	const nom = saisie.nom.trim();
	if (nom === '') return refuser('nom', MESSAGE_NOM_DUNIVERS_VIDE);

	const existants = await base
		.select({ id: univers.id, nom: univers.nom, identifiant: univers.identifiant })
		.from(univers)
		.orderBy(univers.ordre);
	if (existants.some((u) => memeNom(u.nom, nom))) return refuser('nom', messageDejaPris(nom));

	const identifiant = identifiantLibre(
		nom,
		existants.map((u) => u.identifiant)
	);
	const place = placeDemandee(saisie.ordre, existants.length + 1);

	await base.transaction(async (tx) => {
		const [insere] = await tx
			.insert(univers)
			.values({
				identifiant,
				nom,
				description: saisie.description.trim(),
				couleur: saisie.couleur,
				glyphe: saisie.glyphe,
				ordre: existants.length + 1,
				systeme: false
			})
			.returning({ id: univers.id });
		if (insere === undefined) throw new Error("l'univers créé n'a pas été rendu");

		const ids = existants.map((u) => u.id);
		ids.splice(place - 1, 0, insere.id);
		await renumeroterLesUnivers(tx, ids);
	});

	return { issue: 'possible', identifiant, nom };
}

/**
 * Enregistrer un univers — les champs ABSENTS ne sont pas touchés. LA PARTIALITÉ EST LE GESTE
 * DES FLÈCHES : « Monter » et « Descendre » ne changent QUE le rang, et leur envoyer un nom
 * relu dans le document recopierait l'écran dans la base à chaque clic.
 *
 * `RG-STR-01` — l'univers système garde son nom : le nom et la description proposés sont
 * IGNORÉS, sans que le geste échoue.
 */
export async function modifierUnUnivers(
	base: Base,
	identifiant: string,
	changements: Partial<SaisieDUnUnivers>
): Promise<IssueDUnGeste<VerdictDeStructure>> {
	const existants = await base
		.select({
			id: univers.id,
			nom: univers.nom,
			identifiant: univers.identifiant,
			systeme: univers.systeme
		})
		.from(univers)
		.orderBy(univers.ordre);
	const cible = existants.find((u) => u.identifiant === identifiant);
	if (cible === undefined) return { issue: 'introuvable' };

	const modifie: Record<string, unknown> = {};
	let nomRetenu = cible.nom;

	if (changements.nom !== undefined && !cible.systeme) {
		const nom = changements.nom.trim();
		if (nom === '') return refuser('nom', MESSAGE_NOM_DUNIVERS_VIDE);
		if (existants.some((u) => u.id !== cible.id && memeNom(u.nom, nom))) {
			return refuser('nom', messageDejaPris(nom));
		}
		modifie['nom'] = nom;
		nomRetenu = nom;
	}
	if (changements.description !== undefined && !cible.systeme) {
		modifie['description'] = changements.description.trim();
	}
	if (changements.couleur !== undefined) modifie['couleur'] = changements.couleur;
	if (changements.glyphe !== undefined) modifie['glyphe'] = changements.glyphe;

	await base.transaction(async (tx) => {
		if (Object.keys(modifie).length > 0) {
			modifie['modifieLe'] = new Date();
			await tx.update(univers).set(modifie).where(eq(univers.id, cible.id));
		}
		if (changements.ordre !== undefined) {
			const autres = existants.filter((u) => u.id !== cible.id).map((u) => u.id);
			const place = placeDemandee(changements.ordre, autres.length + 1);
			autres.splice(place - 1, 0, cible.id);
			await renumeroterLesUnivers(tx, autres);
		}
	});

	return { issue: 'possible', identifiant, nom: nomRetenu };
}

/** Les six modules, de la clé du gel vers la valeur de l'énumération de base. */
const MODULE_VERS_ENUM: Record<
	CleDeModule,
	'notes' | 'dossiers' | 'fiches' | 'cartographie' | 'signets' | 'carte_mentale'
> = {
	notes: 'notes',
	dossiers: 'dossiers',
	fiches: 'fiches',
	cartographie: 'cartographie',
	signets: 'signets',
	carteMentale: 'carte_mentale'
};

/**
 * `RG-STR-06` — « un domaine active 1 à N modules ». `notes` est le module que le
 * gel verrouille, et c'est lui qui garantit le plancher de 1.
 */
function modulesRetenus(demandes: readonly CleDeModule[]): readonly CleDeModule[] {
	const retenus = demandes.filter((m) => m in MODULE_VERS_ENUM);
	return retenus.includes('notes') ? retenus : ['notes', ...retenus];
}

/** Ce que le panneau de `V-28` porte, champ pour champ. */
export interface SaisieDUnDomaine {
	readonly nom: string;
	readonly description: string;
	/**
	 * L'IDENTIFIANT de l'univers de rattachement — jamais son nom d'affichage : le nom se
	 * renomme, l'identifiant ne bouge pas (`RG-M12-11`). Résoudre par le nom ne tenait que par la
	 * chance de schéma d'`univers_nom_unique`.
	 */
	readonly univers: string;
	readonly couleur: string;
	readonly modules: readonly CleDeModule[];
}

/**
 * Créer un domaine — `RG-STR-02`, `RG-STR-03`, `RG-STR-06`.
 *
 * TROIS ÉCRITURES, ET AUCUNE NE VA SANS LES DEUX AUTRES : le domaine, son DOSSIER RACINE et
 * ses modules. Sans racine, aucune note ne peut naître dans le domaine ; la racine porte le
 * nom du domaine, de profondeur 1 et sans parent.
 *
 * L'UNICITÉ EST CHERCHÉE SUR LE NOM, ET GLOBALEMENT — alors que la base ne l'exige que sur
 * `(univers, identifiant)` : deux lectures de console INDEXENT PAR LE NOM D'AFFICHAGE, et deux
 * homonymes en feraient disparaître un sans que rien ne s'en plaigne.
 */
export async function creerUnDomaine(
	base: Base,
	saisie: SaisieDUnDomaine
): Promise<IssueDUnGeste<VerdictDeStructure>> {
	const nom = saisie.nom.trim();
	if (nom === '') return refuser('nom', MESSAGE_NOM_DE_DOMAINE_VIDE);

	const [accueil] = await base
		.select({ id: univers.id })
		.from(univers)
		.where(eq(univers.identifiant, saisie.univers))
		.limit(1);
	if (accueil === undefined) return { issue: 'introuvable' };

	const existants = await base
		.select({ nom: domaines.nom, identifiant: domaines.identifiant, universId: domaines.universId })
		.from(domaines);
	if (existants.some((d) => memeNom(d.nom, nom))) return refuser('nom', messageDejaPris(nom));

	const identifiant = identifiantLibre(
		nom,
		existants.filter((d) => d.universId === accueil.id).map((d) => d.identifiant)
	);
	const modules = modulesRetenus(saisie.modules);

	await base.transaction(async (tx) => {
		const [insere] = await tx
			.insert(domaines)
			.values({
				universId: accueil.id,
				identifiant,
				nom,
				description: saisie.description.trim(),
				couleur: saisie.couleur
			})
			.returning({ id: domaines.id });
		if (insere === undefined) throw new Error("le domaine créé n'a pas été rendu");

		await tx.insert(dossiers).values({ domaineId: insere.id, nom, profondeur: 1, position: 0 });
		await tx
			.insert(modulesDeDomaine)
			.values(modules.map((m) => ({ domaineId: insere.id, module: MODULE_VERS_ENUM[m] })));
	});

	return { issue: 'possible', identifiant, nom };
}

/**
 * Enregistrer un domaine — `RG-STR-02`, `RG-STR-06`.
 *
 * LE RATTACHEMENT PEUT CHANGER, ET L'IDENTIFIANT NE SUIT PAS : « le rattachement change la
 * place du domaine dans la navigation, jamais son contenu ». Le domaine garde son identifiant,
 * sauf si un homonyme l'occupe déjà dans le nouvel univers. LES MODULES SONT RÉÉCRITS EN BLOC :
 * la table n'est qu'un ensemble de couples sans donnée propre.
 */
export async function modifierUnDomaine(
	base: Base,
	designation: DomaineCanonique,
	changements: Partial<SaisieDUnDomaine>
): Promise<IssueDUnGeste<VerdictDeStructure>> {
	const [cible] = await base
		.select({ id: domaines.id, nom: domaines.nom, universId: domaines.universId })
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.where(
			and(
				eq(univers.identifiant, designation.univers),
				eq(domaines.identifiant, designation.domaine)
			)
		)
		.limit(1);
	if (cible === undefined) return { issue: 'introuvable' };

	const existants = await base
		.select({
			id: domaines.id,
			nom: domaines.nom,
			identifiant: domaines.identifiant,
			universId: domaines.universId
		})
		.from(domaines);

	const modifie: Record<string, unknown> = {};
	let nomRetenu = cible.nom;

	if (changements.nom !== undefined) {
		const nom = changements.nom.trim();
		if (nom === '') return refuser('nom', MESSAGE_NOM_DE_DOMAINE_VIDE);
		if (existants.some((d) => d.id !== cible.id && memeNom(d.nom, nom))) {
			return refuser('nom', messageDejaPris(nom));
		}
		modifie['nom'] = nom;
		nomRetenu = nom;
	}
	if (changements.description !== undefined) {
		modifie['description'] = changements.description.trim();
	}
	if (changements.couleur !== undefined) modifie['couleur'] = changements.couleur;

	if (changements.univers !== undefined) {
		const [accueil] = await base
			.select({ id: univers.id })
			.from(univers)
			.where(eq(univers.identifiant, changements.univers))
			.limit(1);
		if (accueil === undefined) return { issue: 'introuvable' };
		if (accueil.id !== cible.universId) {
			modifie['universId'] = accueil.id;
			/* L'IDENTIFIANT NE SUIT NI LE NOM NI L'UNIVERS (`RG-M12-11`) : dérivé à la
			   création, puis stable. Il n'est reforgé que si un homonyme occupe déjà la
			   place dans l'univers d'accueil. */
			const occupes = existants
				.filter((d) => d.id !== cible.id && d.universId === accueil.id)
				.map((d) => d.identifiant);
			if (occupes.includes(designation.domaine)) {
				modifie['identifiant'] = identifiantLibre(nomRetenu, occupes);
			}
		}
	}

	await base.transaction(async (tx) => {
		if (Object.keys(modifie).length > 0) {
			modifie['modifieLe'] = new Date();
			await tx.update(domaines).set(modifie).where(eq(domaines.id, cible.id));
		}
		if (changements.modules !== undefined) {
			await tx.delete(modulesDeDomaine).where(eq(modulesDeDomaine.domaineId, cible.id));
			await tx.insert(modulesDeDomaine).values(
				modulesRetenus(changements.modules).map((m) => ({
					domaineId: cible.id,
					module: MODULE_VERS_ENUM[m]
				}))
			);
		}
	});

	const identifiantRetenu =
		typeof modifie['identifiant'] === 'string' ? modifie['identifiant'] : designation.domaine;
	return { issue: 'possible', identifiant: identifiantRetenu, nom: nomRetenu };
}

/**
 * Les quatre types de valeur qui font l'aller-retour — une borne mesurée, pas un choix
 * d'ergonomie. L'énumération en porte SIX et le panneau en propose HUIT, mais
 * `lireTypesDeFiche()` ne sait relire que quatre valeurs et LÈVE sur les autres : écrire `date`
 * rendrait la console, l'éditeur et la lecture de fiche inaccessibles. Les autres sont ramenés
 * à `texte`.
 */
export type TypeDePropriete = 'texte' | 'nombre' | 'liste' | 'booleen';

function typeDeProprieteRetenu(demande: string): TypeDePropriete {
	if (demande === 'nombre' || demande === 'liste' || demande === 'booleen') return demande;
	return 'texte';
}

/** Une propriété du schéma, telle que le constructeur de `V-29` la porte. */
export interface SaisieDeProprieteDeFiche {
	readonly cle: string;
	readonly nom: string;
	readonly type: string;
	/** « Aide à la saisie ». Absente, la colonne passe à `null`. */
	readonly aide?: string;
	/** « Valeur par défaut ». Absente, la colonne passe à `null`. */
	readonly defaut?: string;
	/** « Propriété obligatoire ». Absente, la propriété ne l'est pas. */
	readonly obligatoire?: boolean;
	readonly valeurs: readonly string[];
}

/** Ce que le panneau de `V-29` porte, champ pour champ. */
export interface SaisieDUnTypeDeFiche {
	readonly nom: string;
	/** `#f-desc`. Absente du changement, la colonne n'est pas touchée. */
	readonly description?: string;
	/** `#f-icones`. Absente du changement, la colonne n'est pas touchée. */
	readonly glyphe?: string;
	readonly proprietes: readonly SaisieDeProprieteDeFiche[];
}

/**
 * Un texte de panneau, tel qu'il va en colonne. VIDE VAUT `null` : la colonne est
 * nullable pour distinguer « l'administrateur n'a rien écrit » d'une valeur.
 */
function texteOuRien(saisi: string | undefined): string | null {
	if (saisi === undefined) return null;
	const propre = saisi.trim();
	return propre === '' ? null : propre;
}

/**
 * Les propriétés d'un type, écrites en bloc. `champs_cle_par_type_unique` porte sur
 * `(type, clé)` et le constructeur n'interdit pas deux « Nouvelle propriété » : les doublons
 * sont écartés ici, en gardant le PREMIER, plutôt que de faire échouer l'enregistrement entier.
 * `champs_valeurs_reservees_a_la_liste` interdit `valeurs` hors du type `liste`.
 */
async function ecrireLesProprietes(
	executeur: Parameters<Parameters<Base['transaction']>[0]>[0],
	typeDeFicheId: string,
	proprietes: readonly SaisieDeProprieteDeFiche[]
): Promise<void> {
	await executeur
		.delete(champsDeTypeDeFiche)
		.where(eq(champsDeTypeDeFiche.typeDeFicheId, typeDeFicheId));

	const vues = new Set<string>();
	const lignes: {
		typeDeFicheId: string;
		cle: string;
		nom: string;
		type: TypeDePropriete;
		ordre: number;
		aide: string | null;
		defaut: string | null;
		obligatoire: boolean;
		valeurs: string[] | null;
	}[] = [];
	for (const p of proprietes) {
		const cle = identifiantLisible(p.cle.trim()).replace(/-/g, '_') || `propriete_${vues.size + 1}`;
		if (vues.has(cle)) continue;
		vues.add(cle);
		const type = typeDeProprieteRetenu(p.type);
		lignes.push({
			typeDeFicheId,
			cle,
			nom: p.nom.trim() === '' ? cle : p.nom.trim(),
			type,
			ordre: lignes.length,
			aide: texteOuRien(p.aide),
			defaut: texteOuRien(p.defaut),
			obligatoire: p.obligatoire === true,
			valeurs: type === 'liste' ? p.valeurs.map((v) => v.trim()).filter((v) => v !== '') : null
		});
	}
	if (lignes.length > 0) await executeur.insert(champsDeTypeDeFiche).values(lignes);
}

/** CRÉER UN TYPE DE FICHE — `RG-M14-06` en négatif : ce qui se supprime se crée. */
export async function creerUnTypeDeFiche(
	base: Base,
	saisie: SaisieDUnTypeDeFiche
): Promise<VerdictDeStructure> {
	const nom = saisie.nom.trim();
	if (nom === '') return refuser('nom', MESSAGE_NOM_DE_TYPE_VIDE);

	const existants = await base
		.select({
			nom: typesDeFiche.nom,
			identifiant: typesDeFiche.identifiant,
			ordre: typesDeFiche.ordre
		})
		.from(typesDeFiche);
	if (existants.some((t) => memeNom(t.nom, nom))) return refuser('nom', messageDejaPris(nom));

	const identifiant = identifiantLibre(
		nom,
		existants.map((t) => t.identifiant)
	);
	const rang = existants.reduce((haut, t) => Math.max(haut, t.ordre + 1), 0);

	await base.transaction(async (tx) => {
		const [insere] = await tx
			.insert(typesDeFiche)
			.values({
				identifiant,
				nom,
				ordre: rang,
				description: texteOuRien(saisie.description),
				glyphe: texteOuRien(saisie.glyphe)
			})
			.returning({ id: typesDeFiche.id });
		if (insere === undefined) throw new Error("le type créé n'a pas été rendu");
		await ecrireLesProprietes(tx, insere.id, saisie.proprietes);
	});

	return { issue: 'possible', identifiant, nom };
}

/**
 * Enregistrer un type de fiche. LES NOTES NE SONT PAS TOUCHÉES (`V-29:469`) : une
 * propriété retirée du schéma laisse la valeur qu'une note portait — c'est le
 * schéma qui cesse de la demander, pas la note qui la perd.
 */
export async function modifierUnTypeDeFiche(
	base: Base,
	identifiant: string,
	changements: Partial<SaisieDUnTypeDeFiche>
): Promise<IssueDUnGeste<VerdictDeStructure>> {
	const existants = await base
		.select({ id: typesDeFiche.id, nom: typesDeFiche.nom, identifiant: typesDeFiche.identifiant })
		.from(typesDeFiche);
	const cible = existants.find((t) => t.identifiant === identifiant);
	if (cible === undefined) return { issue: 'introuvable' };

	let nomRetenu = cible.nom;
	if (changements.nom !== undefined) {
		const nom = changements.nom.trim();
		if (nom === '') return refuser('nom', MESSAGE_NOM_DE_TYPE_VIDE);
		if (existants.some((t) => t.id !== cible.id && memeNom(t.nom, nom))) {
			return refuser('nom', messageDejaPris(nom));
		}
		nomRetenu = nom;
	}

	await base.transaction(async (tx) => {
		/* UN CHAMP ABSENT N'EST PAS UN CHAMP VIDE : l'enregistrement est PARTIEL et ne
		   touche que ce qui est transmis. `null` reste possible quand le panneau a envoyé
		   un champ vide. */
		const changes: { nom?: string; description?: string | null; glyphe?: string | null } = {};
		if (nomRetenu !== cible.nom) changes.nom = nomRetenu;
		if (changements.description !== undefined) {
			changes.description = texteOuRien(changements.description);
		}
		if (changements.glyphe !== undefined) changes.glyphe = texteOuRien(changements.glyphe);
		if (Object.keys(changes).length > 0) {
			await tx.update(typesDeFiche).set(changes).where(eq(typesDeFiche.id, cible.id));
		}
		if (changements.proprietes !== undefined) {
			await ecrireLesProprietes(tx, cible.id, changements.proprietes);
		}
	});

	return { issue: 'possible', identifiant, nom: nomRetenu };
}

/** Ce que le panneau de `V-30` porte, champ pour champ. */
export interface SaisieDUnTypeDeRelation {
	readonly direct: string;
	readonly inverse: string;
	/** `RG-M08-07` — entre-t-il dans le calcul des points de rupture ? */
	readonly technique: boolean;
}

/**
 * Les trois refus de `V-30`, dans l'ordre du gel : libellé direct manquant, libellé
 * inverse manquant ou identique au direct, puis doublon de libellé direct. Le
 * doublon n'est cherché qu'une fois les deux premiers passés.
 */
function verdictDesLibelles(
	direct: string,
	inverse: string,
	pris: readonly string[]
): readonly RefusDeSaisie[] {
	const erreurs: RefusDeSaisie[] = [];
	if (direct === '') erreurs.push({ champ: 'direct', message: MESSAGE_LIBELLE_DIRECT_VIDE });
	if (inverse === '') erreurs.push({ champ: 'inverse', message: MESSAGE_LIBELLE_INVERSE_VIDE });
	else if (memeNom(inverse, direct)) {
		erreurs.push({ champ: 'inverse', message: MESSAGE_LIBELLES_IDENTIQUES });
	}
	if (erreurs.length > 0) return erreurs;
	if (pris.some((p) => memeNom(p, direct))) {
		return [{ champ: 'direct', message: messageDejaPris(direct) }];
	}
	return [];
}

/** CRÉER UN TYPE DE RELATION — `RG-M08-06`. */
export async function creerUnTypeDeRelation(
	base: Base,
	saisie: SaisieDUnTypeDeRelation
): Promise<VerdictDeStructure> {
	const direct = saisie.direct.trim();
	const inverse = saisie.inverse.trim();

	const existants = await base
		.select({
			identifiant: typesDeRelation.identifiant,
			sortant: typesDeRelation.libelleSortant,
			ordre: typesDeRelation.ordre
		})
		.from(typesDeRelation);

	const erreurs = verdictDesLibelles(
		direct,
		inverse,
		existants.map((t) => t.sortant)
	);
	if (erreurs.length > 0) return { issue: 'saisie-refusee', erreurs };

	const identifiant = identifiantLibre(
		direct,
		existants.map((t) => t.identifiant)
	);
	const rang = existants.reduce((haut, t) => Math.max(haut, t.ordre + 1), 0);

	await base.insert(typesDeRelation).values({
		identifiant,
		libelleSortant: direct,
		libelleEntrant: inverse,
		technique: saisie.technique,
		ordre: rang
	});

	return { issue: 'possible', identifiant, nom: direct };
}

/**
 * Enregistrer un type de relation. L'IDENTIFIANT NE SUIT PAS LE LIBELLÉ (`RG-M12-11`
 * transposé) : les relations déclarées le portent, et le reforger ferait changer
 * d'étiquette des liens que personne n'a touchés.
 */
export async function modifierUnTypeDeRelation(
	base: Base,
	identifiant: string,
	changements: Partial<SaisieDUnTypeDeRelation>
): Promise<IssueDUnGeste<VerdictDeStructure>> {
	const existants = await base
		.select({
			id: typesDeRelation.id,
			identifiant: typesDeRelation.identifiant,
			sortant: typesDeRelation.libelleSortant,
			entrant: typesDeRelation.libelleEntrant
		})
		.from(typesDeRelation);
	const cible = existants.find((t) => t.identifiant === identifiant);
	if (cible === undefined) return { issue: 'introuvable' };

	const direct = (changements.direct ?? cible.sortant).trim();
	const inverse = (changements.inverse ?? cible.entrant).trim();
	const erreurs = verdictDesLibelles(
		direct,
		inverse,
		existants.filter((t) => t.id !== cible.id).map((t) => t.sortant)
	);
	if (erreurs.length > 0) return { issue: 'saisie-refusee', erreurs };

	await base
		.update(typesDeRelation)
		.set({
			libelleSortant: direct,
			libelleEntrant: inverse,
			...(changements.technique === undefined ? {} : { technique: changements.technique })
		})
		.where(eq(typesDeRelation.id, cible.id));

	return { issue: 'possible', identifiant, nom: direct };
}

/* ═══════════════════════ Les types de note — `RG-REF-03` ═════════════════
 *
 * « Un type de note ne peut être supprimé s'il est utilisé ; une réaffectation est
 * proposée. » La règle n'était tenue NULLE PART : les cinq types venaient d'un
 * `INSERT` de migration et aucune adresse ne les gérait — un administrateur ne
 * pouvait ni en ajouter, ni en renommer, ni en retirer un.
 *
 * UN TYPE DE NOTE N'EST PAS UN TYPE DE FICHE. Deux nomenclatures, deux tables
 * (`types_de_note`, `types_de_fiche`), deux consoles. Rien n'est partagé entre elles
 * ici, et le vocabulaire ne se croise à aucune ligne.
 *
 * L'INDEX SUIT, PARCE QU'IL PORTE LE NOM DU TYPE : `projeterLeCorpus()` joint
 * `types_de_note.nom` dans chaque document. Renommer un type ou réaffecter ses notes
 * sans entretenir l'index laisserait `/recherche` filtrer sur un nom que la base
 * n'écrit plus.
 */

/** Ce que le panneau de `/console/types-de-note` porte — un nom, et rien d'autre :
 *  `types_de_note` n'a que l'identifiant, le nom et le rang. */
export interface SaisieDUnTypeDeNote {
	readonly nom: string;
}

/** Le nom manquant — même forme que les trois autres nomenclatures. */
export const MESSAGE_NOM_DE_TYPE_DE_NOTE_VIDE = 'Donnez un nom au type de note.';

/** Les identifiants lisibles des notes qui portent ce type — pour l'index. */
async function notesDUnTypeDeNote(base: Base, typeId: string): Promise<readonly string[]> {
	const lignes = await base
		.select({ identifiant: notes.identifiant })
		.from(notes)
		.where(eq(notes.typeDeNoteId, typeId));
	return lignes.map((n) => n.identifiant);
}

/** CRÉER UN TYPE DE NOTE. Le rang suit la nomenclature : le nouveau vient en queue. */
export async function creerUnTypeDeNote(
	base: Base,
	saisie: SaisieDUnTypeDeNote
): Promise<VerdictDeStructure> {
	const nom = saisie.nom.trim();
	if (nom === '') return refuser('nom', MESSAGE_NOM_DE_TYPE_DE_NOTE_VIDE);

	const existants = await base
		.select({
			identifiant: typesDeNote.identifiant,
			nom: typesDeNote.nom,
			ordre: typesDeNote.ordre
		})
		.from(typesDeNote);
	if (existants.some((t) => memeNom(t.nom, nom))) return refuser('nom', messageDejaPris(nom));

	const identifiant = identifiantLibre(
		nom,
		existants.map((t) => t.identifiant)
	);
	const rang = existants.reduce((haut, t) => Math.max(haut, t.ordre + 1), 0);

	await base.insert(typesDeNote).values({ identifiant, nom, ordre: rang });

	return { issue: 'possible', identifiant, nom };
}

/**
 * RENOMMER UN TYPE DE NOTE. L'IDENTIFIANT NE SUIT PAS LE NOM (`RG-M12-11` transposé) :
 * les notes le portent par sa clé, et le reforger n'aurait aucun effet sur elles tout
 * en changeant l'adresse par laquelle la console le désigne.
 */
export async function modifierUnTypeDeNote(
	base: Base,
	client: Meilisearch,
	identifiant: string,
	changements: SaisieDUnTypeDeNote
): Promise<IssueDUnGeste<VerdictDeStructure>> {
	const existants = await base
		.select({ id: typesDeNote.id, identifiant: typesDeNote.identifiant, nom: typesDeNote.nom })
		.from(typesDeNote);
	const cible = existants.find((t) => t.identifiant === identifiant);
	if (cible === undefined) return { issue: 'introuvable' };

	const nom = changements.nom.trim();
	if (nom === '') return refuser('nom', MESSAGE_NOM_DE_TYPE_DE_NOTE_VIDE);
	if (existants.some((t) => t.id !== cible.id && memeNom(t.nom, nom))) {
		return refuser('nom', messageDejaPris(nom));
	}

	const touchees = await notesDUnTypeDeNote(base, cible.id);
	await base.update(typesDeNote).set({ nom }).where(eq(typesDeNote.id, cible.id));
	/* L'ÉCRITURE EST VALIDÉE — l'index peut suivre, jamais avant. */
	await entretenirLIndex(base, client, touchees);

	return { issue: 'possible', identifiant, nom };
}

/**
 * Le verdict d'une suppression de type de note — les trois issues de `RG-REF-03`.
 *
 * `refus-employe` PORTE LES DEUX NOMBRES, parce que le refus doit dire ce qui retient :
 * les notes rédigées sous ce type, et les templates qui le déclarent. LA SORTIE EST LA
 * RÉAFFECTATION, ET C'EST LA SEULE — la règle ne propose pas de supprimer les notes,
 * et rien ici ne le fera jamais.
 */
export type VerdictDUnTypeDeNote =
	| {
			readonly issue: 'refus-employe';
			readonly notes: number;
			readonly templates: number;
			readonly motif: string;
	  }
	| { readonly issue: 'cible-invalide' }
	| {
			readonly issue: 'possible';
			readonly notes: number;
			readonly templates: number;
			readonly reaffectees: boolean;
	  };

/** `RG-REF-03` — la sortie proposée, seconde moitié de la règle. */
export const SORTIE_REAFFECTER_LES_NOTES =
	'Choisissez le type qui les accueille : les notes et les templates concernés changeront de type, leur contenu rédigé restant intact. Aucune note n’est supprimée.';

/**
 * SUPPRIMER UN TYPE DE NOTE — `RG-REF-03`.
 *
 * UNE TRANSACTION, PARCE QUE LES DEUX CLÉS ÉTRANGÈRES SONT EN `ON DELETE RESTRICT` :
 * les notes et les templates changent de type, puis le type disparaît — les trois
 * écritures sont indissociables.
 *
 * SANS CIBLE D'ACCUEIL, UN TYPE EMPLOYÉ N'EST PAS SUPPRIMÉ : le geste rend
 * `refus-employe` avec ses deux nombres, jamais un `delete` que la base refuserait
 * ensuite sans nommer la cause. Une cible inconnue, ou le type qu'on retire, est
 * `cible-invalide` — se rabattre sur un type quelconque réécrirait le corpus.
 */
export async function supprimerUnTypeDeNote(
	base: Base,
	client: Meilisearch,
	demande: { readonly type: string; readonly vers?: string; readonly identite: Identite }
): Promise<IssueDUnGeste<VerdictDUnTypeDeNote>> {
	const [type] = await base
		.select({ id: typesDeNote.id, nom: typesDeNote.nom })
		.from(typesDeNote)
		.where(eq(typesDeNote.identifiant, demande.type))
		.limit(1);
	if (type === undefined) return { issue: 'introuvable' };

	const portees = await notesDUnTypeDeNote(base, type.id);
	const gabarits = await base
		.select({ id: templates.id })
		.from(templates)
		.where(eq(templates.typeDeNoteId, type.id));
	const employe = portees.length > 0 || gabarits.length > 0;

	const vers = (demande.vers ?? '').trim();
	if (employe && vers === '') {
		return {
			issue: 'refus-employe',
			notes: portees.length,
			templates: gabarits.length,
			motif: SORTIE_REAFFECTER_LES_NOTES
		};
	}

	let accueil: { readonly id: string } | undefined;
	if (employe) {
		[accueil] = await base
			.select({ id: typesDeNote.id })
			.from(typesDeNote)
			.where(eq(typesDeNote.identifiant, vers))
			.limit(1);
		if (accueil === undefined || accueil.id === type.id) return { issue: 'cible-invalide' };
	}

	const auteur = auteurDeLaSuppression(demande.identite);

	const destination = accueil;
	await base.transaction(async (tx) => {
		if (destination !== undefined) {
			await tx
				.update(notes)
				.set({ typeDeNoteId: destination.id })
				.where(eq(notes.typeDeNoteId, type.id));
			await tx
				.update(templates)
				.set({ typeDeNoteId: destination.id })
				.where(eq(templates.typeDeNoteId, type.id));
		}
		await tx.delete(typesDeNote).where(eq(typesDeNote.id, type.id));
		/* `RG-NF-05`. AUCUNE NOTE N'EST DÉTRUITE ICI — elles changent de type —, et le
		   détail le dit : compter des notes sans dire ce qui leur est arrivé ferait
		   lire une destruction là où il n'y a qu'une réaffectation. */
		await tracerUneSuppression(tx, {
			objet: 'type de note',
			reference: demande.type,
			designation: type.nom,
			detail: detailDuTypeDeNote(portees.length, gabarits.length),
			auteur
		});
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
	await entretenirLIndex(base, client, portees);

	return {
		issue: 'possible',
		notes: portees.length,
		templates: gabarits.length,
		reaffectees: destination !== undefined
	};
}
