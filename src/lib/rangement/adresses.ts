/**
 * Le gabarit d'adresse du rangement — univers, domaine, dossier.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE, ET POURQUOI ICI
 *
 * Trois vues du lot P-9 émettent les mêmes adresses — V-10 renvoie vers ses
 * domaines, V-11 vers ses modules, V-13 vers ses sous-dossiers — et P-10
 * (V-12, V-22, V-23) les PROLONGERA en `/notes`, `/signets` et
 * `/signets/nouveau`. Les recopier vue par vue créerait autant de sources de
 * vérité que de vues, pour une forme d'adresse qui n'en a qu'une.
 *
 * `docs/routes.md` §3.3 est l'autorité, et lui seul : ARB-013 retire les
 * lignes `/url:` de la comparaison de structure précisément pour que le
 * produit porte SES adresses et non les `href="#"` du gel. Les maquettes ne
 * disent donc rien des adresses, et il ne faut pas les leur faire dire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA FORME CANONIQUE, ET ELLE SEULE — RG-M03-02, ARB-001
 *
 *   /univers/{univers}                                    V-10
 *   /univers/{univers}/{domaine}                          V-11
 *   /univers/{univers}/{domaine}/dossiers/{chemin…}       V-13
 *
 * La forme raccourcie `/domaines/{domaine}` N'EXISTE PAS (ARB-001) : elle
 * n'est pas implémentée, aucune fonction de ce fichier ne l'émet, et
 * `/domaines/…` tombe dans le cas commun de l'adresse non résolue. La clause
 * de désambiguïsation de `RG-M03-02` est **sans objet** (E-09,
 * `docs/routes.md` §5.3) : elle ne pouvait se déclencher que sur la forme
 * raccourcie, et **elle ne doit jamais être implémentée**. Aucun écran de
 * choix n'est donc à écrire, et il n'en manque aucun.
 *
 * L'unicité d'un domaine n'est portée QUE par son univers (RG-STR-02) : c'est
 * ce qui rend le segment d'univers obligatoire, et c'est pourquoi aucune
 * fonction d'ici n'accepte un domaine sans son univers.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'IDENTIFIANT LISIBLE — CE QU'IL EST, ET CE QU'IL N'EST PAS ICI
 *
 * `cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md` §3.2, repris par
 * `docs/routes.md` §2.1 : « Identifiant lisible — DÉRIVÉ DU TITRE, unique,
 * stable, utilisé dans l'adresse ». La dérivation ci-dessous est celle-là, et
 * rien de plus.
 *
 * CE QU'ELLE N'EST PAS : la génération d'identifiant du produit. Celle-ci est
 * **stable** — dérivée à la création, elle ne suit pas les renommages
 * ultérieurs (RG-M12-11) —, ce qui suppose un identifiant PERSISTÉ que
 * `seeds/corpus.ts` ne porte pas : univers, domaines et dossiers n'y ont
 * qu'un nom. Tant que le corpus ne porte pas l'identifiant, l'adresse se
 * dérive du nom ; le jour où il le portera, c'est lui qui sera lu, et ces
 * fonctions seront le seul endroit à changer. C'est l'autre raison d'un
 * fichier unique.
 *
 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : ce module ne fait que
 * composer des chaînes.
 */

/**
 * L'identifiant lisible dérivé d'un nom — sans diacritique, en minuscules,
 * les séquences non alphanumériques réduites à un tiret unique.
 *
 * « Poste de travail » → `poste-de-travail`, « Migration 2026 » →
 * `migration-2026`, « Réseau » → `reseau`.
 */
export function identifiantLisible(nom: string): string {
	return nom
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** `/univers/{univers}` — la page d'un univers (V-10). */
export function adresseDUnivers(univers: string): string {
	return `/univers/${identifiantLisible(univers)}`;
}

/**
 * `/univers/{univers}/{domaine}` — la page d'un domaine (V-11).
 * **Forme canonique au sens de RG-M03-02, et seule forme publiée** (ARB-001).
 */
export function adresseDeDomaine(univers: string, domaine: string): string {
	return `${adresseDUnivers(univers)}/${identifiantLisible(domaine)}`;
}

/**
 * `/univers/{univers}/{domaine}/dossiers/{chemin…}` — la page d'un dossier
 * (V-13). Le `{chemin…}` est la suite des identifiants de dossiers, du dossier
 * racine au dossier courant, jusqu'à dix niveaux (RG-STR-04).
 *
 * Le segment `dossiers` vient de la convention de préfixe R1 et lève la
 * collision avec les segments réservés `notes` et `signets`
 * (`docs/routes.md` §5.4).
 */
export function adresseDeDossier(
	univers: string,
	domaine: string,
	chemin: readonly string[]
): string {
	const segments = chemin.map(identifiantLisible).join('/');
	return `${adresseDeDomaine(univers, domaine)}/dossiers${segments ? `/${segments}` : ''}`;
}

/** `/notes/{identifiant}` — l'adresse PLATE d'une note (RG-M03-03, §2.1). */
export function adresseDeNote(identifiant: string): string {
	return `/notes/${identifiant}`;
}

/**
 * Le chemin de dossier d'une note, tel que le corpus le porte
 * (« Exploitation › Sauvegardes »), découpé en segments.
 */
export function segmentsDeDossier(chemin: string): readonly string[] {
	return chemin
		.split('›')
		.map((s) => s.trim())
		.filter(Boolean);
}
