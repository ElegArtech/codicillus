/**
 * LE CONTRAT DE SAISIE DES QUATRE CONSOLES DE STRUCTURE — univers, domaines,
 * types de fiche, types de relation.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE : `P-35`, ET IL A DÉJÀ MORDU
 *
 * « Deux lots parallèles qui se parlent par un contrat de données — noms de
 * champs, codes de retour — doivent le lire au même endroit. Recopié dans deux
 * contrats, il diverge en silence : une note s'est créée avec un corps vide, en
 * 303, sans que rien ne s'en plaigne. » (`CLAUDE.md` §6.)
 *
 * Ici les trois couches se parlent : la VUE émet une saisie, la PAGE la
 * transforme en champs de formulaire, l'ACTION la relit. Les noms de champ sont
 * donc déclarés UNE FOIS, et les trois les lisent ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES NOMS SONT CEUX DU GEL, JAMAIS DES NOMS CHOISIS
 *
 * `f-nom`, `f-desc`, `f-univers`, `f-couleurs`, `f-icones`, `f-position`,
 * `f-modules`, `f-direct`, `f-inverse`, `f-technique`, `f-props` sont les
 * identifiants que les maquettes portent sur leurs champs. C'est le régime déjà
 * établi par `sup-saisie` (`V-28:1421`) et par les sept `c-…` de la
 * configuration (`V-33`) : rien ne sera à renommer le jour où ces panneaux
 * soumettront un vrai formulaire.
 *
 * LES DEUX PREMIERS NOMS N'EN SONT PAS. `univers` et `domaine` désignent la
 * CIBLE du geste par sa forme canonique — c'est ce que `?/supprimer` attend
 * déjà sur les deux routes (`docs/routes.md` §2.2), et une seconde convention
 * pour la même chose serait exactement la divergence que `P-35` décrit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN CHAMP ABSENT N'EST PAS UN CHAMP VIDE
 *
 * Les actions `enregistrer` sont PARTIELLES : elles ne touchent que ce qui est
 * transmis. C'est ce qui permet aux flèches « Monter » et « Descendre » de
 * `V-27` de n'envoyer qu'un rang, sans recopier tout l'écran dans la base à
 * chaque clic. Les fabriques ci-dessous n'émettent donc jamais de clé vide par
 * commodité.
 */
import type { CleDeModule } from '../../../seeds/corpus';

/* ═══════════════════════════ Ce qu'un refus dit ═════════════════════════ */

/**
 * UNE ERREUR DE SAISIE, RATTACHÉE AU CHAMP DU GEL.
 *
 * `champ` porte la clé du bloc `.champ__erreur` que l'écran révèle :
 * `nom` pour V-27, V-28 et V-29 — `erreur-nom` / `erreur-nom-txt` —, `direct`
 * et `inverse` pour V-30. La forme est celle que `administration.ts` rend ; elle
 * est redite ici parce qu'une vue ne peut pas importer ce module-là — il tire le
 * schéma, le connecteur et le moteur de recherche.
 */
export interface RefusDeSaisie {
	readonly champ: string;
	readonly message: string;
}

/* ═══════════════════════════ Les quatre saisies ═════════════════════════ */

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
	/** Le NOM d'affichage de l'univers de rattachement. */
	readonly univers: string;
	readonly couleur: string;
	readonly modules: readonly CleDeModule[];
}

/** Une propriété du schéma, telle que le constructeur de `V-29` la porte. */
export interface SaisieDePropriete {
	readonly cle: string;
	readonly nom: string;
	readonly type: string;
	readonly valeurs: readonly string[];
}

/** Ce que le panneau de `V-29` rend quand on valide. */
export interface SaisieDeTypeDeFiche {
	readonly nom: string;
	readonly proprietes: readonly SaisieDePropriete[];
}

/** Ce que le panneau de `V-30` rend quand on valide. */
export interface SaisieDeTypeDeRelation {
	readonly direct: string;
	readonly inverse: string;
	readonly technique: boolean;
}

/* ═══════════════════════════ Les noms de champ ══════════════════════════ */

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
 * `f-modules` PORTE UNE LISTE, ET LE SÉPARATEUR EST L'ESPACE.
 *
 * Les six clés de module sont `[a-zA-Z]` sans exception (`CleDeModule`), aucune
 * ne peut donc porter le séparateur. Un tableau de valeurs répétées serait plus
 * naturel en HTML, mais `envoyerAUneAction()` prend un `Record<string, string>`
 * — une clé, une valeur — et ce module ne change pas ce contrat-là pour un cas.
 */
export const SEPARATEUR_DE_MODULES = ' ';

/* ═══════════════════════════ Les fabriques de champs ════════════════════ */

/** Les champs d'une création d'univers. */
export function champsDUnivers(saisie: SaisieDUnivers): Record<string, string> {
	return {
		[CHAMP_NOM]: saisie.nom,
		[CHAMP_DESCRIPTION]: saisie.description,
		[CHAMP_COULEUR]: saisie.couleur,
		[CHAMP_GLYPHE]: saisie.glyphe,
		[CHAMP_POSITION]: String(saisie.ordre)
	};
}

/** Les champs d'une création de domaine. */
export function champsDeDomaine(saisie: SaisieDeDomaine): Record<string, string> {
	return {
		[CHAMP_NOM]: saisie.nom,
		[CHAMP_DESCRIPTION]: saisie.description,
		[CHAMP_UNIVERS_DE_RATTACHEMENT]: saisie.univers,
		[CHAMP_COULEUR]: saisie.couleur,
		[CHAMP_MODULES]: saisie.modules.join(SEPARATEUR_DE_MODULES)
	};
}

/** Les champs d'une création de type de fiche. */
export function champsDeTypeDeFiche(saisie: SaisieDeTypeDeFiche): Record<string, string> {
	return {
		[CHAMP_NOM]: saisie.nom,
		[CHAMP_PROPRIETES]: JSON.stringify(saisie.proprietes)
	};
}

/** Les champs d'une création de type de relation. */
export function champsDeTypeDeRelation(saisie: SaisieDeTypeDeRelation): Record<string, string> {
	return {
		[CHAMP_DIRECT]: saisie.direct,
		[CHAMP_INVERSE]: saisie.inverse,
		[CHAMP_TECHNIQUE]: saisie.technique ? 'oui' : 'non'
	};
}

/* ═══════════════════════════ La relecture, côté action ══════════════════ */

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

/** La liste de modules d'un champ — `undefined` s'il n'a pas été transmis. */
export function modulesDuChamp(champs: FormData, nom: string): readonly CleDeModule[] | undefined {
	const texte = texteDuChamp(champs, nom);
	if (texte === undefined) return undefined;
	return texte
		.split(SEPARATEUR_DE_MODULES)
		.filter((m) => m !== '')
		.map((m) => m as CleDeModule);
}

/**
 * LES PROPRIÉTÉS D'UN TYPE DE FICHE, RELUES DU TRANSPORT.
 *
 * UN TEXTE VENU D'UN FORMULAIRE N'EST JAMAIS DE CONFIANCE, et la sortie de
 * cette fonction entre dans une écriture : chaque champ est donc éprouvé un par
 * un, et une entrée mal formée est ÉCARTÉE plutôt que devinée. Un contenu
 * illisible rend `undefined`, ce que l'action traite comme un champ absent —
 * elle ne touche alors pas au schéma, plutôt que de le vider.
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
		rendues.push({ cle: p['cle'], nom: p['nom'], type: p['type'], valeurs });
	}
	return rendues;
}
