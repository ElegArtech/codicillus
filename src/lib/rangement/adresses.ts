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
 * L'adresse d'une pièce jointe — `docs/routes.md:146`, et le SEUL accès à ses
 * octets (`RG-M04-08` : « jamais en fichier statique »).
 *
 * LE NOM EST ENCODÉ, ET C'EST UNE PROPRIÉTÉ, PAS UNE PRÉCAUTION. Le nom d'une
 * pièce est libre : il peut porter une espace, un accent, une barre oblique.
 * Encodé, il reste UN segment d'adresse — la route en attend un seul —, et il
 * revient identique à la lecture du paramètre. C'est ce qui permet au nom d'être
 * l'adresse sans jamais devenir un chemin : le chemin des octets, lui, est
 * dérivé d'identifiants en base et ne voit jamais ce nom
 * (`src/lib/fichiers/entrepot.ts`).
 *
 * @param identifiant l'identifiant lisible de la note porteuse
 * @param nom le nom de la pièce, tel que la base le porte
 */
export function adresseDePieceJointe(identifiant: string, nom: string): string {
	return `${adresseDeNote(identifiant)}/pieces-jointes/${encodeURIComponent(nom)}`;
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

/* ═════════════════════════════════════════════════════════════════════════
   LE PROLONGEMENT DU LOT P-10 — `/notes`, `/signets`, ET LES DEUX FORMES DU
   FORMULAIRE DE SIGNET

   Trois vues de plus émettent des adresses de rangement — V-12 la liste des
   notes d'un domaine, V-22 ses signets, V-23 le formulaire de signet — et
   toutes les trois PROLONGENT l'adresse canonique de domaine ci-dessus. Elles
   ne créent aucune forme nouvelle : `adresseDeDomaine()` reste le seul point
   où l'univers et le domaine sont composés, et il le reste pour la raison qui
   a fait ce fichier — une forme d'adresse recopiée dans trois vues est trois
   sources de vérité.

   L'AUTORITÉ RESTE `docs/routes.md` §3.3 :

     /univers/{univers}/{domaine}/notes                       V-12
     /univers/{univers}/{domaine}/signets                     V-22
     /univers/{univers}/{domaine}/signets/nouveau             V-23 création
     /univers/{univers}/{domaine}/signets/{id}/modifier       V-23 édition

   `notes`, `dossiers` et `signets` sont des IDENTIFIANTS RÉSERVÉS sous
   `/univers/{u}/{d}/`, et `nouveau` sous `.../signets/` (`docs/routes.md`
   §5.4). C'est cette réservation qui rend les quatre formes non ambiguës : un
   domaine nommé « Notes » ne peut pas produire un segment qui masquerait la
   liste. Le préfixe pluriel français vient de la convention R1, la même qui a
   donné `dossiers` à V-13.

   CE QUI N'EST TOUJOURS PAS ÉMIS, ET NE DOIT PAS L'ÊTRE : `/domaines/…`
   (ARB-001). Aucune des fonctions ci-dessous ne peut en produire, puisqu'elles
   passent toutes par `adresseDeDomaine()`. La clause de désambiguïsation de
   `RG-M03-02` reste **sans objet** (E-09) : rien n'est à y ajouter, et surtout
   pas un écran de choix.

   L'IDENTIFIANT D'UN SIGNET EST CELUI D'UNE NOTE. Un signet est une note de
   type `Signet` (`seeds/corpus.ts`, `TypeDeNote`), pas un objet séparé — le
   vocabulaire contractuel du §2.3 ne connaît pas de « lien ». Son identifiant
   est donc pris tel quel, comme `adresseDeNote()` prend le sien, et n'est pas
   redérivé d'un titre.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * `/univers/{univers}/{domaine}/notes` — la liste des notes d'un domaine
 * (V-12).
 *
 * C'est la cible des accès qui ouvrent la liste déjà filtrée : un segment de
 * la barre de fraîcheur, un indicateur d'accueil. Les filtres eux-mêmes
 * voyagent en paramètres de requête (`docs/routes.md` §4.2), jamais en
 * segments de chemin — un filtre n'est pas un niveau de rangement.
 */
export function adresseDesNotesDuDomaine(univers: string, domaine: string): string {
	return `${adresseDeDomaine(univers, domaine)}/notes`;
}

/** `/univers/{univers}/{domaine}/signets` — les signets d'un domaine (V-22). */
export function adresseDesSignetsDuDomaine(univers: string, domaine: string): string {
	return `${adresseDeDomaine(univers, domaine)}/signets`;
}

/**
 * `/univers/{univers}/{domaine}/signets/nouveau` — la création d'un signet
 * (V-23, mode « création »).
 *
 * `nouveau` est réservé sous `.../signets/` (`docs/routes.md` §5.4) : sans
 * cette réservation, un signet dont l'identifiant serait `nouveau` masquerait
 * le formulaire de création, exactement comme `nouvelle` sous `/notes/`.
 */
export function adresseDeCreationDeSignet(univers: string, domaine: string): string {
	return `${adresseDesSignetsDuDomaine(univers, domaine)}/nouveau`;
}

/**
 * `/univers/{univers}/{domaine}/signets/{identifiant}/modifier` — l'édition
 * d'un signet (V-23, mode « édition »).
 *
 * Le suffixe `/modifier` est celui de `/notes/{identifiant}/modifier`, par
 * uniformité déclarée (`docs/routes.md` §3.3).
 *
 * L'ENVELOPPE N'EST PAS DANS L'ADRESSE. V-23 a deux enveloppes — page dédiée
 * et boîte de dialogue — et une seule paire d'adresses : le formulaire est le
 * même, seul son entourage change selon l'endroit d'où on l'ouvre. En faire
 * deux adresses créerait deux routes pour un même écran, sans canonique
 * désignée.
 */
export function adresseDeModificationDeSignet(
	univers: string,
	domaine: string,
	identifiant: string
): string {
	return `${adresseDesSignetsDuDomaine(univers, domaine)}/${identifiant}/modifier`;
}
