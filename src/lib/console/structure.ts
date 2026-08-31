/**
 * Le contrat de saisie des quatre consoles de structure — univers, domaines, types de fiche,
 * types de relation.
 *
 * Trois couches se parlent ici : la VUE émet une saisie, la PAGE la transforme en champs,
 * l'ACTION la relit. Les noms de champ sont donc déclarés UNE FOIS (`P-35`). LES NOMS SONT
 * CEUX DU GEL : `f-nom`, `f-desc`, `f-univers`… sont les identifiants que les maquettes
 * portent. `univers` et `domaine` n'en sont pas : ils désignent la CIBLE du geste par sa forme
 * canonique.
 *
 * UN CHAMP ABSENT N'EST PAS UN CHAMP VIDE : les actions `enregistrer` sont PARTIELLES, ce qui
 * permet aux flèches « Monter » et « Descendre » de n'envoyer qu'un rang.
 */
import type { CleDeModule } from '../../../seeds/corpus';
import { CATALOGUE_DE_MODULES } from '../rangement/modules';

/**
 * Une erreur de saisie, rattachée au champ du gel : `champ` porte la clé du bloc
 * `.champ__erreur` que l'écran révèle. La forme est celle qu'`administration.ts`
 * rend ; elle est redite ici parce qu'une vue ne peut pas importer ce module-là — il
 * tire le schéma, le connecteur et le moteur de recherche.
 */
export interface RefusDeSaisie {
	readonly champ: string;
	readonly message: string;
}

/** Ce que le panneau de `V-27` rend quand on valide. */
export interface SaisieDUnivers {
	readonly nom: string;
	readonly description: string;
	readonly couleur: string;
	readonly glyphe: string;
	/** La place demandée dans la navigation — `#f-position`, à partir de 1. */
	readonly ordre: number;
}

/** Ce que le panneau de `V-28` rend quand on valide. */
export interface SaisieDeDomaine {
	readonly nom: string;
	readonly description: string;
	readonly univers: string;
	readonly couleur: string;
	readonly modules: readonly CleDeModule[];
}

/** Une propriété du schéma, telle que le constructeur de `V-29` la porte. */
export interface SaisieDePropriete {
	readonly cle: string;
	readonly nom: string;
	readonly type: string;
	/** « Aide à la saisie » — le texte que l'administrateur écrit sous le champ. */
	readonly aide: string;
	/** « Valeur par défaut » — vide quand aucune n'est proposée. */
	readonly defaut: string;
	/** « Propriété obligatoire » — la case du constructeur. */
	readonly obligatoire: boolean;
	readonly valeurs: readonly string[];
}

/** Ce que le panneau de `V-29` rend quand on valide. */
export interface SaisieDeTypeDeFiche {
	readonly nom: string;
	/** `#f-desc` — « ce que ce type décrit, et quand l'employer ». */
	readonly description: string;
	/** `#f-icones` — la clé de l'icône choisie parmi les six du panneau. */
	readonly glyphe: string;
	readonly proprietes: readonly SaisieDePropriete[];
}

/** Ce que le panneau de `V-30` rend quand on valide. */
export interface SaisieDeTypeDeRelation {
	readonly direct: string;
	readonly inverse: string;
	readonly technique: boolean;
}

export const CHAMP_UNIVERS_CIBLE = 'univers';
export const CHAMP_DOMAINE_CIBLE = 'domaine';
export const CHAMP_TYPE_DE_FICHE_CIBLE = 'type-de-fiche';
export const CHAMP_TYPE_DE_RELATION_CIBLE = 'type-de-relation';

export const CHAMP_NOM = 'f-nom';
export const CHAMP_DESCRIPTION = 'f-desc';
export const CHAMP_COULEUR = 'f-couleurs';
export const CHAMP_GLYPHE = 'f-icones';
export const CHAMP_POSITION = 'f-position';
export const CHAMP_UNIVERS_DE_RATTACHEMENT = 'f-univers';
export const CHAMP_MODULES = 'f-modules';
export const CHAMP_DIRECT = 'f-direct';
export const CHAMP_INVERSE = 'f-inverse';
export const CHAMP_TECHNIQUE = 'f-technique';
export const CHAMP_PROPRIETES = 'f-props';

/**
 * `f-modules` porte une LISTE, et le séparateur est l'espace : les six clés de module
 * sont `[a-zA-Z]` sans exception, aucune ne peut donc le porter. Un tableau de valeurs
 * répétées serait plus naturel en HTML, mais `envoyerAUneAction()` prend une clé et
 * une valeur, et ce module ne change pas ce contrat pour un cas.
 */
export const SEPARATEUR_DE_MODULES = ' ';

export function champsDUnivers(saisie: SaisieDUnivers): Record<string, string> {
	return {
		[CHAMP_NOM]: saisie.nom,
		[CHAMP_DESCRIPTION]: saisie.description,
		[CHAMP_COULEUR]: saisie.couleur,
		[CHAMP_GLYPHE]: saisie.glyphe,
		[CHAMP_POSITION]: String(saisie.ordre)
	};
}

export function champsDeDomaine(saisie: SaisieDeDomaine): Record<string, string> {
	return {
		[CHAMP_NOM]: saisie.nom,
		[CHAMP_DESCRIPTION]: saisie.description,
		[CHAMP_UNIVERS_DE_RATTACHEMENT]: saisie.univers,
		[CHAMP_COULEUR]: saisie.couleur,
		[CHAMP_MODULES]: saisie.modules.join(SEPARATEUR_DE_MODULES)
	};
}

/**
 * Les champs d'une création de type de fiche. `f-desc` et `f-icones` sont émis depuis
 * que la base les porte : le panneau les demandait déjà, et cette fabrique ne les
 * transmettait pas — l'enregistrement les perdait sans un mot.
 */
export function champsDeTypeDeFiche(saisie: SaisieDeTypeDeFiche): Record<string, string> {
	return {
		[CHAMP_NOM]: saisie.nom,
		[CHAMP_DESCRIPTION]: saisie.description,
		[CHAMP_GLYPHE]: saisie.glyphe,
		[CHAMP_PROPRIETES]: JSON.stringify(saisie.proprietes)
	};
}

export function champsDeTypeDeRelation(saisie: SaisieDeTypeDeRelation): Record<string, string> {
	return {
		[CHAMP_DIRECT]: saisie.direct,
		[CHAMP_INVERSE]: saisie.inverse,
		[CHAMP_TECHNIQUE]: saisie.technique ? 'oui' : 'non'
	};
}

/** Le texte d'un champ, ou `undefined` s'il n'a pas été transmis. */
export function texteDuChamp(champs: FormData, nom: string): string | undefined {
	const valeur = champs.get(nom);
	return typeof valeur === 'string' ? valeur : undefined;
}

/** Le rang d'un champ de position — `undefined` s'il n'a pas été transmis. */
export function rangDuChamp(champs: FormData, nom: string): number | undefined {
	const texte = texteDuChamp(champs, nom);
	if (texte === undefined) return undefined;
	const rang = Number.parseInt(texte, 10);
	return Number.isNaN(rang) ? undefined : rang;
}

/**
 * Ce que la relecture de `f-modules` rend — trois issues, jamais deux. `absent` est
 * le champ NON TRANSMIS, `lue` porte la liste, et `cle-inconnue` NOMME LA CLÉ
 * FAUTIVE : une liste dont un membre est hors catalogue ne se ramène pas à une liste
 * plus courte.
 */
export type LectureDeModules =
	| { readonly etat: 'absent' }
	| { readonly etat: 'lue'; readonly modules: readonly CleDeModule[] }
	| { readonly etat: 'cle-inconnue'; readonly cle: string };

/**
 * La clé du bloc `.champ__erreur` d'une liste de modules refusée — le nom du champ du
 * gel débarrassé de son préfixe, jamais un nom choisi.
 */
export const CHAMP_ERREUR_MODULES = 'modules';

export function messageDeModuleInconnu(cle: string): string {
	return `« ${cle} » n'est pas un module.`;
}

/**
 * La forme qu'une action de structure rend quand elle refuse une saisie. C'est celle
 * qu'`administration.ts` rend déjà, redite ici parce que ce module ne peut pas tirer
 * le schéma, le connecteur et le moteur de recherche avec lui.
 */
export type SaisieRefusee = {
	readonly issue: 'saisie-refusee';
	readonly erreurs: readonly RefusDeSaisie[];
};

export function refusDeModuleInconnu(cle: string): SaisieRefusee {
	return {
		issue: 'saisie-refusee',
		erreurs: [{ champ: CHAMP_ERREUR_MODULES, message: messageDeModuleInconnu(cle) }]
	};
}

/**
 * La liste de modules d'un champ, confrontée au catalogue.
 *
 * ÉCARTER EST JUSTE POUR UN CHAMP ILLISIBLE ; C'EST FAUX POUR UNE LISTE CONNUE DONT UN MEMBRE
 * EST INCONNU. Sans consultation du catalogue, `modulesRetenus()` jetait en silence ce que
 * l'énumération ne portait pas : une soumission de six modules rendait 200 « possible » avec
 * TROIS CLÉS PERDUES, et le domaine né sans `dossiers` faisait rendre 404 sans dire pourquoi.
 *
 * `Object.hasOwn` plutôt que `in` : `in` remonte la chaîne de prototypes, et `constructor` ou
 * `toString` passeraient pour des modules.
 */
export function modulesDuChamp(champs: FormData, nom: string): LectureDeModules {
	const texte = texteDuChamp(champs, nom);
	if (texte === undefined) return { etat: 'absent' };

	const modules: CleDeModule[] = [];
	for (const cle of texte.split(SEPARATEUR_DE_MODULES)) {
		if (cle === '') continue;
		if (!Object.hasOwn(CATALOGUE_DE_MODULES, cle)) return { etat: 'cle-inconnue', cle };
		modules.push(cle as CleDeModule);
	}
	return { etat: 'lue', modules };
}

/**
 * Les propriétés d'un type de fiche, relues du transport. Un texte venu d'un
 * formulaire n'est jamais de confiance et la sortie entre dans une écriture : chaque
 * champ est éprouvé un par un, et une entrée mal formée est ÉCARTÉE plutôt que
 * devinée. Un contenu illisible rend `undefined`, que l'action traite comme un champ
 * absent — elle ne touche alors pas au schéma, plutôt que de le vider.
 */
export function proprietesDuChamp(
	champs: FormData,
	nom: string
): readonly SaisieDePropriete[] | undefined {
	const texte = texteDuChamp(champs, nom);
	if (texte === undefined) return undefined;
	let brut: unknown;
	try {
		brut = JSON.parse(texte);
	} catch {
		return undefined;
	}
	if (!Array.isArray(brut)) return undefined;

	const rendues: SaisieDePropriete[] = [];
	for (const entree of brut) {
		if (typeof entree !== 'object' || entree === null) continue;
		const p = entree as Record<string, unknown>;
		if (typeof p['cle'] !== 'string' || typeof p['nom'] !== 'string') continue;
		if (typeof p['type'] !== 'string') continue;
		const valeurs = Array.isArray(p['valeurs'])
			? p['valeurs'].filter((v): v is string => typeof v === 'string')
			: [];
		/* LES TROIS DERNIERS CHAMPS SONT FACULTATIFS AU TRANSPORT, et absents ils valent
		   « rien saisi ». Une entrée mal formée est ramenée au neutre, jamais devinée. */
		rendues.push({
			cle: p['cle'],
			nom: p['nom'],
			type: p['type'],
			aide: typeof p['aide'] === 'string' ? p['aide'] : '',
			defaut: typeof p['defaut'] === 'string' ? p['defaut'] : '',
			obligatoire: p['obligatoire'] === true,
			valeurs
		});
	}
	return rendues;
}
