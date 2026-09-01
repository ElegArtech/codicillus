/**
 * `RG-M18-16` — LES LIBELLÉS DONT UN COMPORTEMENT DÉPEND, ÉCRITS UNE SEULE FOIS.
 *
 * « L'architecture des textes n'interdit pas une internationalisation ultérieure, mais
 * aucune autre langue n'est livrée. » Rien n'est traduit ici, et rien ne doit l'être : ce
 * module existe pour que la traduction reste POSSIBLE.
 *
 * LE MOTIF QUI LA CONDAMNAIT. Onze gestes du produit sont câblés en RETROUVANT LEUR BOUTON
 * PAR LE TEXTE QU'IL AFFICHE — le gel ne donne à ces boutons ni identifiant, ni classe
 * propre, et le texte est la seule chose qui les distingue. Ces onze chaînes vivaient dans
 * six modules, mêlées au code du comportement. Traduire une vue aurait DÉBRANCHÉ le geste
 * qu'elle porte, en silence : « Supprimer » devenu « Delete », le bouton n'est plus trouvé,
 * `cablerLaSuppression()` rend un débranchement vide, et le bouton de suppression d'une
 * note ne fait plus rien — sans erreur, sans avertissement, sans que rien ne compile mal.
 *
 * CE QUE CE MODULE CHANGE, ET CE QU'IL NE CHANGE PAS. Il ne rend pas le produit
 * multilingue et n'introduit aucun catalogue de messages : ce n'est pas ce que la règle
 * demande. Il rassemble en UN endroit les seules chaînes dont dépend un COMPORTEMENT, de
 * sorte qu'une traduction future ait une liste finie à tenir à jour au lieu d'onze
 * littéraux à retrouver. Les milliers d'autres textes du produit, eux, ne portent aucun
 * comportement : les traduire ne casse rien, et ils restent où ils sont.
 *
 * LA LISTE EST CLOSE. Un geste ajouté sans entrée ici ne compile pas ; une entrée sans
 * geste se voit. C'est la clôture qui fait la garantie, pas la centralisation seule.
 */

/**
 * LE LIBELLÉ FRANÇAIS DE CHAQUE GESTE CÂBLÉ PAR SON TEXTE. La clé est le geste, la valeur
 * est ce que la vue AFFICHE — les deux doivent bouger ensemble, et c'est tout le propos.
 */
export const LIBELLE_DU_GESTE = {
	supprimer: 'Supprimer',
	modifier: 'Modifier',
	imprimer: 'Imprimer',
	reessayer: 'Réessayer',
	historiqueDesVersions: 'Historique des versions',
	ajouterLePremierSignet: 'Ajouter le premier signet',
	reinitialiserLesFiltres: 'Réinitialiser les filtres',
	marquerResynchronise: 'Marquer comme resynchronisé',
	comparerLesRegistres: 'Comparer les deux registres',
	reprendreLePlan: 'Reprendre le plan de la Référence'
} as const;

export type GesteCable = keyof typeof LIBELLE_DU_GESTE;

/** Le texte d'un nœud, rogné. Les pictogrammes en `svg` n'y comptent pas. */
function texte(noeud: Element | null | undefined): string {
	return (noeud?.textContent ?? '').trim();
}

/**
 * LE NŒUD PORTE-T-IL EXACTEMENT CE GESTE ? Égalité stricte, et elle est nécessaire :
 * « Modifier » et « Modifier la référence » sont deux gestes distincts du même écran, et
 * un test par préfixe les confondrait.
 */
export function porteLeGeste(noeud: Element | null | undefined, geste: GesteCable): boolean {
	return texte(noeud) === LIBELLE_DU_GESTE[geste];
}

/**
 * LE NŒUD COMMENCE-T-IL PAR CE GESTE ? Pour les boutons dont le gel fait suivre le libellé
 * d'un complément — un raccourci, un compte. À n'employer que là où aucun autre geste du
 * même écran n'a ce préfixe.
 */
export function commencePar(noeud: Element | null | undefined, geste: GesteCable): boolean {
	return texte(noeud).startsWith(LIBELLE_DU_GESTE[geste]);
}

/**
 * LE BOUTON D'UN GESTE, cherché parmi ceux que `selecteur` désigne. `null` quand l'écran
 * ne le porte pas — un état où le geste n'est pas offert, jamais une erreur.
 */
export function boutonDuGeste(
	racine: ParentNode,
	geste: GesteCable,
	selecteur = 'button'
): HTMLButtonElement | null {
	return (
		Array.from(racine.querySelectorAll<HTMLButtonElement>(selecteur)).find((b) =>
			porteLeGeste(b, geste)
		) ?? null
	);
}

/** Le même, par préfixe — voir `commencePar()`. */
export function boutonCommencantPar(
	racine: ParentNode,
	geste: GesteCable,
	selecteur = 'button'
): HTMLButtonElement | null {
	return (
		Array.from(racine.querySelectorAll<HTMLButtonElement>(selecteur)).find((b) =>
			commencePar(b, geste)
		) ?? null
	);
}
