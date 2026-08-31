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
 *
 * LE DÉCOUPAGE EST TOLÉRANT, LA RECOMPOSITION NE L'EST PAS : on accepte un
 * chemin dont le séparateur n'a pas ses deux espaces — une adresse tapée à la
 * main, un lien recopié —, mais tout ce qui ressort d'ici se rejoint par
 * `cheminCanonique()`. Sans quoi une forme approchante traverserait la
 * vérification et n'arriverait à rien cocher.
 */
export function segmentsDeDossier(chemin: string): readonly string[] {
	return chemin
		.split('›')
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Le séparateur de chemin du corpus — `SEPARATEUR_DE_CHEMIN`,
 * `$lib/donnees/rangement`. Il est redit ici, et non importé, parce que ce
 * module est PUR : `$lib/donnees/rangement` parle à la base, et l'importer
 * ferait descendre le connecteur dans le paquet de navigateur. C'est le même
 * arrangement qu'en `$lib/cablage/formulaires`, pour la même raison.
 */
const SEPARATEUR = ' › ';

/** La forme canonique d'un chemin affiché, recomposée depuis ses segments. */
export function cheminCanonique(segments: readonly string[]): string {
	return segments.join(SEPARATEUR);
}

/**
 * Un nœud d'arborescence de dossiers, réduit à ce qu'une descente par nom lit.
 *
 * La forme complète — avec son décompte de notes — vit en `$lib/donnees/edition`
 * sous le nom `DossierDeChoix`. Elle n'est pas importée ici : ce module est PUR
 * et ne connaît rien de la base.
 */
export interface NoeudDeDossier {
	readonly nom: string;
	readonly enfants: readonly NoeudDeDossier[];
}

/**
 * LE CHEMIN AFFICHÉ DÉSIGNE-T-IL UN DOSSIER DE CETTE ARBORESCENCE ?
 *
 * Rend le chemin quand il en désigne un, `null` sinon. Écrit pour `?dossier=`
 * de `/notes/nouvelle`, qui porte la forme AFFICHÉE du chemin — celle que
 * `Note.dossier` porte, celle que V-17 compare pour cocher son bouton radio,
 * celle que la soumission renvoie. La forme d'ADRESSE, en segments slugifiés
 * séparés par des barres obliques, ne descend pas cette arborescence : les deux
 * représentations ne se confondent jamais, et c'est tout l'objet de ce fichier.
 *
 * POURQUOI VÉRIFIER PLUTÔT QUE FAIRE CONFIANCE. Un lien mis en signet survit au
 * dossier qu'il nomme : renommé, déplacé, supprimé, le chemin ne désigne plus
 * rien. Un chemin inconnu est alors IGNORÉ EN SILENCE par l'appelant — le
 * formulaire s'ouvre, rien n'est coché, aucune erreur n'est levée. Un lien
 * périmé ne doit pas empêcher d'écrire une note.
 *
 * CE QUI SORT D'ICI EST RECOMPOSÉ, JAMAIS RENDU TEL QUEL. La descente découpe
 * sur le seul chevron et écarte les espaces ; rendre le chemin d'entrée
 * laisserait donc passer une forme approchante — le séparateur sans ses
 * espaces, par exemple — que le destinataire compare caractère pour caractère
 * et qui ne coche RIEN. Le verdict serait « ce dossier existe » et l'effet
 * celui d'un lien périmé : indiscernables, pour deux causes opposées. La forme
 * canonique lève l'ambiguïté à la source.
 */
export function dossierDeLArborescence(
	arbre: readonly NoeudDeDossier[] | undefined,
	chemin: string | null
): string | null {
	if (arbre === undefined || chemin === null || chemin === '') return null;
	const segments = segmentsDeDossier(chemin);
	if (segments.length === 0) return null;
	let niveau: readonly NoeudDeDossier[] = arbre;
	for (const segment of segments) {
		const branche = niveau.find((n) => n.nom === segment);
		if (branche === undefined) return null;
		niveau = branche.enfants;
	}
	return cheminCanonique(segments);
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

/* =========================================================================
   LES DÉSIGNATIONS — LE NOM D'AFFICHAGE N'EST PAS L'IDENTIFIANT D'ADRESSE

   Tout ce qui précède compose sur des IDENTIFIANTS, et `identifiantLisible()`
   est idempotente sur eux : passer un identifiant déjà persisté ne le change
   pas. Le défaut n'a jamais été là — il était chez les APPELANTS, qui
   passaient le nom d'affichage.

   `univers.identifiant` et `domaines.identifiant` sont PERSISTÉS et STABLES :
   dérivés à la création, ils ne suivent pas les renommages ultérieurs
   (`RG-M12-11`). Slugifier le nom donnait donc l'adresse juste tant que rien
   n'avait été renommé, et un 404 sur TOUTES les adresses d'un univers ou d'un
   domaine dès le premier renommage — mesuré sur les deux.

   LA CORRESPONDANCE EST LUE EN BASE, JAMAIS DEVINÉE. Elle est servie une fois
   par le gabarit racine et descend par le contexte de coquille, comme
   l'identité et l'arborescence du rail : trente routes qui la recopieraient
   divergeraient au premier oubli.

   LE REPLI EST LA DÉRIVATION D'AVANT, et c'est un choix. Un nom absent de la
   table — le rendu par défaut d'une vue, une planche, un objet hors du
   périmètre lisible — rend l'adresse que le produit servait déjà : juste tant
   que l'objet n'a pas été renommé, et jamais pire qu'un lien mort.
   ========================================================================= */

/**
 * Les identifiants d'adresse des univers et des domaines, indexés par leur nom
 * d'affichage. Les domaines sont indexés par le COUPLE, parce que `RG-STR-02`
 * ne rend un nom de domaine unique qu'au sein de son univers.
 */
export interface DesignationsDeRangement {
	readonly univers: Readonly<Record<string, string>>;
	readonly domaines: Readonly<Record<string, string>>;
}

/** Aucune correspondance connue — tout se replie sur `identifiantLisible()`. */
export const SANS_DESIGNATION: DesignationsDeRangement = { univers: {}, domaines: {} };

/**
 * Le séparateur des deux noms dans une clé de domaine : le caractère de
 * contrôle de rang 31, impossible dans un nom saisi. Aucun couple de noms ne
 * peut donc produire la clé d'un autre couple.
 */
const SEPARATEUR_DE_CLE = String.fromCharCode(31);

/** La clé d'un domaine dans la table des désignations — son univers, puis lui. */
export function cleDeDomaine(univers: string, domaine: string): string {
	return univers + SEPARATEUR_DE_CLE + domaine;
}

/** L'identifiant d'adresse d'un univers nommé, ou la dérivation de son nom. */
export function identifiantDUnivers(designations: DesignationsDeRangement, nom: string): string {
	return designations.univers[nom] ?? identifiantLisible(nom);
}

/** L'identifiant d'adresse d'un domaine nommé, ou la dérivation de son nom. */
export function identifiantDeDomaine(
	designations: DesignationsDeRangement,
	universNom: string,
	domaineNom: string
): string {
	return (
		designations.domaines[cleDeDomaine(universNom, domaineNom)] ?? identifiantLisible(domaineNom)
	);
}

/**
 * LA FAMILLE D'ADRESSES QUI PART DES NOMS D'AFFICHAGE.
 *
 * Les vues ne connaissent que des noms — c'est ce que les chargeurs leur
 * passent, et c'est ce que le gel affiche. Elles composent donc par ici, et le
 * seul endroit qui traduise reste `identifiantDUnivers()` et
 * `identifiantDeDomaine()`.
 */
export function adressesParLesNoms(designations: DesignationsDeRangement): {
	univers: (universNom: string) => string;
	domaine: (universNom: string, domaineNom: string) => string;
	dossier: (universNom: string, domaineNom: string, chemin: readonly string[]) => string;
	notes: (universNom: string, domaineNom: string) => string;
	signets: (universNom: string, domaineNom: string) => string;
	creationDeSignet: (universNom: string, domaineNom: string) => string;
	modificationDeSignet: (universNom: string, domaineNom: string, identifiant: string) => string;
} {
	const u = (nom: string): string => identifiantDUnivers(designations, nom);
	const d = (universNom: string, domaineNom: string): string =>
		identifiantDeDomaine(designations, universNom, domaineNom);
	return {
		univers: (universNom) => adresseDUnivers(u(universNom)),
		domaine: (universNom, domaineNom) => adresseDeDomaine(u(universNom), d(universNom, domaineNom)),
		dossier: (universNom, domaineNom, chemin) =>
			adresseDeDossier(u(universNom), d(universNom, domaineNom), chemin),
		notes: (universNom, domaineNom) =>
			adresseDesNotesDuDomaine(u(universNom), d(universNom, domaineNom)),
		signets: (universNom, domaineNom) =>
			adresseDesSignetsDuDomaine(u(universNom), d(universNom, domaineNom)),
		creationDeSignet: (universNom, domaineNom) =>
			adresseDeCreationDeSignet(u(universNom), d(universNom, domaineNom)),
		modificationDeSignet: (universNom, domaineNom, identifiant) =>
			adresseDeModificationDeSignet(u(universNom), d(universNom, domaineNom), identifiant)
	};
}
