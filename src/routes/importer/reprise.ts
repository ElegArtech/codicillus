/**
 * LE VERDICT DE L'APERÇU SUR CHAQUE LIGNE — création ou mise à jour.
 *
 * `classerLeLot()` consulte déjà la carte de la cible : `identifiantDuFichier()`
 * REPREND l'identifiant lisible quand la cible porte déjà une note de ce nom,
 * RANGÉE À LA MÊME PLACE — exactement la décision qui fera de l'écriture une mise
 * à jour plutôt qu'une création.
 *
 * Mais `LigneDePlan` ne garde pas ce verdict : seul `LigneDeRapport` en porte un,
 * et il naît APRÈS l'écriture. L'étape 3 — « rien n'a encore été écrit » — n'avait
 * donc rien à montrer, et l'écran annonçait des créations que l'import n'allait
 * pas faire.
 *
 * Le verdict est RELU sur le plan, avec la même carte et la même comparaison : ce
 * n'est pas une seconde règle, c'est la même appliquée aux champs publics de la
 * ligne, sans toucher au classement ni à l'exécution.
 */

export interface LigneRelue {
	readonly identifiant: string | null;
	readonly segments: readonly string[];
}

/**
 * LA CIBLE PORTE-T-ELLE DÉJÀ CETTE NOTE, À CETTE PLACE ? La comparaison est celle
 * de `identifiantDuFichier()` : l'identifiant retenu doit figurer dans la carte de
 * la cible ET y désigner le chemin où ce fichier se range. Un homonyme rangé
 * ailleurs n'est pas une reprise — `RG-M12-11` lui donnera un identifiant suffixé.
 */
export function estUneMiseAJour(
	ligne: LigneRelue,
	notesDeLaCible: ReadonlyMap<string, string>
): boolean {
	if (ligne.identifiant === null) return false;
	return notesDeLaCible.get(ligne.identifiant) === ligne.segments.join('/');
}
