/**
 * Le gabarit d'adresse du rangement — univers, domaine, dossier.
 *
 * Les recopier vue par vue créerait autant de sources de vérité que de vues, pour une forme
 * d'adresse qui n'en a qu'une. `docs/routes.md` §3.3 est l'autorité, et lui seul : les
 * maquettes ne disent rien des adresses.
 *
 * LA FORME CANONIQUE, ET ELLE SEULE (`RG-M03-02`, `ARB-001`) :
 *
 *   /univers/{univers}                                    V-10
 *   /univers/{univers}/{domaine}                          V-11
 *   /univers/{univers}/{domaine}/dossiers/{chemin…}       V-13
 *
 * La forme raccourcie `/domaines/{domaine}` N'EXISTE PAS : la clause de désambiguïsation de
 * `RG-M03-02` est SANS OBJET et ne doit jamais être implémentée. L'unicité d'un domaine
 * n'étant portée QUE par son univers (`RG-STR-02`), aucune fonction d'ici n'accepte un
 * domaine sans son univers.
 *
 * L'IDENTIFIANT LISIBLE dérivé ci-dessous n'est PAS la génération d'identifiant du produit :
 * celle-ci est stable et insensible aux renommages (`RG-M12-11`), ce qui suppose un
 * identifiant PERSISTÉ. Tant que la source n'en porte pas, l'adresse se dérive du nom.
 */

/**
 * L'identifiant lisible dérivé d'un nom — sans diacritique, en minuscules, les séquences non
 * alphanumériques réduites à un tiret unique. « Poste de travail » → `poste-de-travail`,
 * « Migration 2026 » → `migration-2026`, « Réseau » → `reseau`.
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
 * `/univers/{univers}/{domaine}/dossiers/{chemin…}` — la page d'un dossier (V-13).
 * Le `{chemin…}` est la suite des identifiants de dossiers, jusqu'à dix niveaux
 * (`RG-STR-04`). Le segment `dossiers` lève la collision avec les segments réservés
 * `notes` et `signets`.
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
 * L'adresse d'une pièce jointe — le SEUL accès à ses octets (`RG-M04-08` : « jamais en fichier
 * statique »).
 *
 * LE NOM EST ENCODÉ, ET C'EST UNE PROPRIÉTÉ, PAS UNE PRÉCAUTION : le nom d'une pièce est libre
 * et peut porter une barre oblique. Encodé, il reste UN segment d'adresse et revient identique
 * à la lecture du paramètre.
 *
 * @param identifiant l'identifiant lisible de la note porteuse
 * @param nom le nom de la pièce, tel que la base le porte
 */
export function adresseDePieceJointe(identifiant: string, nom: string): string {
	return `${adresseDeNote(identifiant)}/pieces-jointes/${encodeURIComponent(nom)}`;
}

/**
 * Le chemin de dossier d'une note, tel que le corpus le porte, découpé en segments. LE
 * DÉCOUPAGE EST TOLÉRANT, LA RECOMPOSITION NE L'EST PAS : on accepte un chemin dont le
 * séparateur n'a pas ses deux espaces, mais tout ce qui ressort d'ici se rejoint par
 * `cheminCanonique()` — sans quoi une forme approchante n'arriverait à rien cocher.
 */
export function segmentsDeDossier(chemin: string): readonly string[] {
	return chemin
		.split('›')
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Le séparateur de chemin du corpus. Il est redit ici, et non importé, parce que ce
 * module est PUR : `$lib/donnees/rangement` parle à la base, et l'importer ferait
 * descendre le connecteur dans le paquet de navigateur.
 */
const SEPARATEUR = ' › ';

export function cheminCanonique(segments: readonly string[]): string {
	return segments.join(SEPARATEUR);
}

/**
 * Un nœud d'arborescence de dossiers, réduit à ce qu'une descente par nom lit. La
 * forme complète vit en `$lib/donnees/edition` ; elle n'est pas importée, ce module
 * étant PUR.
 */
export interface NoeudDeDossier {
	readonly nom: string;
	readonly enfants: readonly NoeudDeDossier[];
}

/**
 * Le chemin affiché désigne-t-il un dossier de cette arborescence ? Rend le chemin quand il en
 * désigne un, `null` sinon. Écrit pour `?dossier=` de `/notes/nouvelle`, qui porte la forme
 * AFFICHÉE — la forme d'ADRESSE ne descend pas cette arborescence.
 *
 * POURQUOI VÉRIFIER PLUTÔT QUE FAIRE CONFIANCE : un lien mis en signet survit au dossier qu'il
 * nomme. Un chemin inconnu est alors IGNORÉ EN SILENCE par l'appelant. CE QUI SORT D'ICI EST
 * RECOMPOSÉ, JAMAIS RENDU TEL QUEL : la descente écarte les espaces, et rendre le chemin
 * d'entrée laisserait passer une forme approchante qui ne coche RIEN.
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

/* LE PROLONGEMENT DU LOT P-10 — `/notes`, `/signets`, et les deux formes du
   formulaire de signet. Les trois vues PROLONGENT l'adresse canonique de domaine :
   `adresseDeDomaine()` reste le seul point où l'univers et le domaine sont composés.

     /univers/{univers}/{domaine}/notes                       V-12
     /univers/{univers}/{domaine}/signets                     V-22
     /univers/{univers}/{domaine}/signets/nouveau             V-23 création
     /univers/{univers}/{domaine}/signets/{id}/modifier       V-23 édition

   `notes`, `dossiers` et `signets` sont des IDENTIFIANTS RÉSERVÉS sous
   `/univers/{u}/{d}/`, et `nouveau` sous `.../signets/` : c'est cette réservation
   qui rend les quatre formes non ambiguës — un domaine nommé « Notes » ne peut pas
   produire un segment qui masquerait la liste.

   L'IDENTIFIANT D'UN SIGNET EST CELUI D'UNE NOTE : un signet est une note de type
   `Signet`, pas un objet séparé. Son identifiant est pris tel quel, et n'est pas
   redérivé d'un titre. */

/**
 * `/univers/{univers}/{domaine}/notes` — la liste des notes d'un domaine (V-12).
 * Les filtres voyagent en paramètres de requête, jamais en segments de chemin : un
 * filtre n'est pas un niveau de rangement.
 */
export function adresseDesNotesDuDomaine(univers: string, domaine: string): string {
	return `${adresseDeDomaine(univers, domaine)}/notes`;
}

/** `/univers/{univers}/{domaine}/signets` — les signets d'un domaine (V-22). */
export function adresseDesSignetsDuDomaine(univers: string, domaine: string): string {
	return `${adresseDeDomaine(univers, domaine)}/signets`;
}

/**
 * `/univers/{univers}/{domaine}/signets/nouveau` — la création d'un signet.
 * `nouveau` est réservé sous `.../signets/` : sans cette réservation, un signet dont
 * l'identifiant serait `nouveau` masquerait le formulaire, comme `nouvelle` sous
 * `/notes/`.
 */
export function adresseDeCreationDeSignet(univers: string, domaine: string): string {
	return `${adresseDesSignetsDuDomaine(univers, domaine)}/nouveau`;
}

/**
 * `/univers/{univers}/{domaine}/signets/{identifiant}/modifier` — l'édition d'un signet.
 * L'ENVELOPPE N'EST PAS DANS L'ADRESSE : V-23 a deux enveloppes — page dédiée et boîte de
 * dialogue — et une seule paire d'adresses. En faire deux adresses créerait deux routes pour
 * un même écran, sans canonique désignée.
 */
export function adresseDeModificationDeSignet(
	univers: string,
	domaine: string,
	identifiant: string
): string {
	return `${adresseDesSignetsDuDomaine(univers, domaine)}/${identifiant}/modifier`;
}

/* LES DÉSIGNATIONS — le nom d'affichage n'est pas l'identifiant d'adresse.

   `univers.identifiant` et `domaines.identifiant` sont PERSISTÉS et STABLES : ils ne
   suivent pas les renommages (`RG-M12-11`). Slugifier le nom donnait donc l'adresse
   juste tant que rien n'avait été renommé, et un 404 sur TOUTES les adresses d'un
   univers ou d'un domaine dès le premier renommage.

   LA CORRESPONDANCE EST LUE EN BASE, JAMAIS DEVINÉE, et servie une fois par le
   gabarit racine : trente routes qui la recopieraient divergeraient au premier oubli.

   LE REPLI EST LA DÉRIVATION D'AVANT, et c'est un choix : un nom absent de la table
   rend l'adresse que le produit servait déjà — juste tant que l'objet n'a pas été
   renommé, et jamais pire qu'un lien mort. */

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
 * Le séparateur des deux noms dans une clé de domaine : le caractère de contrôle de
 * rang 31, impossible dans un nom saisi. Aucun couple ne peut donc produire la clé
 * d'un autre.
 */
const SEPARATEUR_DE_CLE = String.fromCharCode(31);

export function cleDeDomaine(univers: string, domaine: string): string {
	return univers + SEPARATEUR_DE_CLE + domaine;
}

export function identifiantDUnivers(designations: DesignationsDeRangement, nom: string): string {
	return designations.univers[nom] ?? identifiantLisible(nom);
}

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
 * La famille d'adresses qui part des noms d'affichage. Les vues ne connaissent que
 * des noms ; elles composent donc par ici, et le seul endroit qui traduise reste
 * `identifiantDUnivers()` et `identifiantDeDomaine()`.
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
