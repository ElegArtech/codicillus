/**
 * La résolution des droits — L'IMPLÉMENTATION UNIQUE de `RG-DRO-01` à `05`, encadrées
 * par `RG-ACC-01` et `RG-ACC-04`. Tout ce qui décide d'un accès l'appelle : routes,
 * requêtes, indexation, exports. Deux résolutions concurrentes, et la sécurité du
 * produit devient une question d'opinion.
 *
 * LE DROIT EFFECTIF N'EST PAS UNE COLONNE. `droits_de_dossier` ne stocke que les droits
 * EXPLICITES, couple `(dossier_id, compte_id)` unique ; l'effectif se calcule par
 * remontée. À la différence d'un niveau de fraîcheur périmé, une seconde définition de
 * droit périmée est une faille.
 *
 * Ce module n'établit aucune identité, ne parle pas à la base — il reçoit des lignes et
 * rend une décision, ce qui le rend éprouvable sans base —, ne projette rien dans
 * l'index, et ne choisit aucun code HTTP.
 */

/**
 * Les QUATRE rôles de compte. `ARB-036` : le cahier en donne trois, les maquettes gelées
 * quatre (V-28) — « la maquette prime ». Les valeurs sont celles de l'énumération de
 * base, sans diacritique : convention d'encodage, pas second vocabulaire.
 */
export type RoleDeCompte = 'administrateur' | 'referent' | 'contributeur' | 'lecteur';

/**
 * Les trois droits de dossier, hérités dans l'arborescence (CDC §2.3, table
 * des droits ; `002_socle.montee.sql:36`).
 */
export type DroitDeDossier = 'lecteur' | 'redacteur' | 'gestionnaire';

/**
 * L'identité qui demande l'accès. Deux formes, et rien entre les deux : `RG-DRO-04` fait
 * de l'anonymat un régime SÉPARÉ, pas un compte sans droits. Le type porte la garantie —
 * un anonyme n'a pas de `compteId`, donc aucun code ne peut lui chercher un droit
 * explicite « par erreur ».
 */
export type Identite =
	| { readonly type: 'anonyme' }
	| { readonly type: 'authentifie'; readonly compteId: string; readonly role: RoleDeCompte };

/** L'anonyme. Valeur unique : il n'y a rien à en distinguer. */
export const ANONYME: Identite = { type: 'anonyme' };

/**
 * Une identité authentifiée. La construire est une AFFIRMATION : celle que le compte
 * existe et qu'il est ACTIF (`RG-M14-08`). Cette règle n'est PAS appliquée ici, et c'est
 * délibéré : `Identite` ne porte pas `actif`, donc ce module ne peut ni la contredire ni
 * la faire respecter. Le point d'application est l'établissement de session, seul
 * endroit où « immédiatement » a un sens.
 */
export function identiteAuthentifiee(compteId: string, role: RoleDeCompte): Identite {
	return { type: 'authentifie', compteId, role };
}

/**
 * Ce que la résolution a besoin de savoir d'un dossier : QUI EST SON PARENT. Rien
 * d'autre. Le type est STRUCTUREL — une ligne de `dossiers` le satisfait, une
 * ligne de semence aussi.
 */
export interface DossierDeLArbre {
	readonly id: string;
	/** `null` pour la racine, et pour elle seule (`002_socle.montee.sql:185`). */
	readonly parentId: string | null;
}

/** Une ligne de `droits_de_dossier` : un droit EXPLICITE, posé sur un dossier. */
export interface DroitExplicite {
	readonly dossierId: string;
	readonly compteId: string;
	readonly droit: DroitDeDossier;
}

/**
 * Ce que le périmètre anonyme a besoin de savoir d'une note. `RG-ACC-01` exige un
 * filtrage « au plus près de la donnée » : ces trois champs sont ceux que la
 * requête porte, pas ceux que l'affichage lit.
 */
export interface NotePourPerimetre {
	readonly dossierId: string;
	readonly visibilite: 'interne' | 'publique';
	readonly statut: 'brouillon' | 'publiee';
}

/**
 * L'arborescence et les droits, indexés pour la remontée. Construit UNE FOIS par
 * requête, jamais par dossier : refaire un balayage linéaire à chaque niveau
 * ferait du coût une raison de contourner la règle.
 */
export interface IndexDesDroits {
	readonly parents: ReadonlyMap<string, string | null>;
	/** `dossierId` → (`compteId` → droit). Unicité du couple : un droit au plus. */
	readonly explicites: ReadonlyMap<string, ReadonlyMap<string, DroitDeDossier>>;
}

export function indexerLesDroits(
	dossiers: readonly DossierDeLArbre[],
	droits: readonly DroitExplicite[] = []
): IndexDesDroits {
	const parents = new Map<string, string | null>();
	for (const d of dossiers) parents.set(d.id, d.parentId);

	const explicites = new Map<string, Map<string, DroitDeDossier>>();
	for (const d of droits) {
		let parDossier = explicites.get(d.dossierId);
		if (parDossier === undefined) {
			parDossier = new Map<string, DroitDeDossier>();
			explicites.set(d.dossierId, parDossier);
		}
		parDossier.set(d.compteId, d.droit);
	}
	return { parents, explicites };
}

/**
 * La chaîne d'ancêtres, du dossier lui-même jusqu'à la racine — LE PLUS PROCHE D'ABORD,
 * l'ordre de `RG-DRO-01`. `resoudreDroitDeDossier()` et `perimetreAnonyme()` la
 * partagent, de sorte que « remonter l'arborescence » n'ait qu'une seule écriture.
 *
 * Un dossier inconnu rend une chaîne VIDE, pas une exception : la fermeture par défaut
 * de `RG-DRO-02` répond d'elle-même.
 *
 * GARDE-FOU DE CYCLE : le schéma contraint la profondeur et interdit qu'un dossier soit
 * son propre parent, mais il n'exclut PAS un cycle plus long. La remontée s'arrête au
 * premier identifiant déjà vu — le doute ne se résout jamais en faveur de l'accès.
 */
export function chaineDAncetres(index: IndexDesDroits, dossierId: string): readonly string[] {
	const chaine: string[] = [];
	const vus = new Set<string>();
	let courant: string | null | undefined = dossierId;

	while (courant !== null && courant !== undefined && !vus.has(courant)) {
		if (!index.parents.has(courant)) break;
		vus.add(courant);
		chaine.push(courant);
		courant = index.parents.get(courant) ?? null;
	}
	return chaine;
}

/**
 * L'identité tient-elle sa gestion de son RÔLE ? — `RG-DRO-03`, et rien d'autre.
 * `resoudreDroitDeDossier()` appelle ce prédicat : il n'y a pas deux écritures du
 * contournement, et ce nom la rend CONSULTABLE ailleurs. Une écriture de droit a besoin
 * de la distinguer : un gestionnaire qui tient sa gestion d'une ligne de la table se
 * ferme la porte en s'abaissant lui-même, celui qui la tient de son rôle ne se ferme rien.
 */
export function contourneLesDroitsDeDossier(identite: Identite): boolean {
	return identite.type === 'authentifie' && identite.role === 'administrateur';
}

/**
 * Le point d'entrée de la résolution — le droit effectif d'une identité sur un dossier,
 * ou `null`. Les cinq règles, dans l'ordre où elles s'appliquent :
 *
 *   `RG-DRO-04` — l'anonyme sort EN PREMIER, sans consulter la table : il n'a pas de
 *     droit de dossier, il a un périmètre. Sortir en premier rend impossible qu'un droit
 *     posé sur un compte fuie vers l'anonyme par une branche oubliée.
 *
 *   `RG-DRO-03` — l'administrateur rend `gestionnaire` SANS lire la table. Seul ce rôle
 *     contourne : `referent` ne le fait pas, et l'étendre serait un comblement.
 *
 *   `RG-DRO-01` — la chaîne étant ordonnée du plus proche au plus lointain, le PREMIER
 *     droit rencontré est le bon. « Le plus spécifique gagne » n'est pas une comparaison
 *     de force entre deux droits, c'est un arrêt au premier.
 *
 *   `RG-DRO-05` — aucune ligne de code ne lui correspond : la remontée atteint la racine
 *     depuis n'importe quel descendant. C'est une CONSÉQUENCE de `RG-DRO-01`.
 *
 *   `RG-DRO-02` — le `return null` final, DÉFAUT du parcours.
 *
 * @returns le droit effectif, ou `null` — « aucun accès » (fermeture par défaut)
 */
export function resoudreDroitDeDossier(
	identite: Identite,
	dossierId: string,
	index: IndexDesDroits
): DroitDeDossier | null {
	// RG-DRO-04 — les droits de dossier ne concernent pas l'anonyme.
	if (identite.type === 'anonyme') return null;

	// RG-DRO-03 — l'administrateur contourne tous les droits de dossier.
	if (contourneLesDroitsDeDossier(identite)) return 'gestionnaire';

	// RG-DRO-01 et RG-DRO-05 — le plus proche gagne, la racine couvre l'arbre.
	for (const ancetre of chaineDAncetres(index, dossierId)) {
		const droit = index.explicites.get(ancetre)?.get(identite.compteId);
		if (droit !== undefined) return droit;
	}

	// RG-DRO-02 — fermeture par défaut.
	return null;
}

/**
 * Ce que le droit effectif autorise — transcription de la table de CDC §2.3, colonne par
 * colonne, recopiée ici plutôt que réinterprétée à chaque appel. `null` met tout à
 * `false` : c'est `RG-DRO-02` rendu en capacités, et c'est pourquoi l'absence de droit
 * n'a pas de branche à part.
 */
export interface Capacites {
	readonly lire: boolean;
	readonly ecrireDesNotes: boolean;
	readonly creerDesSousDossiers: boolean;
	readonly administrerLeDossier: boolean;
	readonly gererLesDroits: boolean;
}

const AUCUNE_CAPACITE: Capacites = {
	lire: false,
	ecrireDesNotes: false,
	creerDesSousDossiers: false,
	administrerLeDossier: false,
	gererLesDroits: false
};

/** Les capacités d'un droit effectif. CDC §2.3, ligne à ligne. */
export function capacites(droit: DroitDeDossier | null): Capacites {
	switch (droit) {
		case 'lecteur':
			return { ...AUCUNE_CAPACITE, lire: true };
		case 'redacteur':
			return { ...AUCUNE_CAPACITE, lire: true, ecrireDesNotes: true };
		case 'gestionnaire':
			return {
				lire: true,
				ecrireDesNotes: true,
				creerDesSousDossiers: true,
				administrerLeDossier: true,
				gererLesDroits: true
			};
		default:
			// RG-DRO-02 — aucun droit explicite, aucune capacité.
			return AUCUNE_CAPACITE;
	}
}

/**
 * Ce qu'une note doit être pour qu'un anonyme la voie : PUBLIQUE **et** PUBLIÉE.
 * Le « et » est du cahier des charges §2.2, et `ADR-006` en fait le filtre entier
 * du régime anonyme, « sans exception ni chemin dérogatoire ».
 */
export function noteVisibleEnAnonyme(note: NotePourPerimetre): boolean {
	return note.visibilite === 'publique' && note.statut === 'publiee';
}

/**
 * Le périmètre anonyme — `RG-DRO-04`, seconde moitié : « l'anonyme voit les dossiers qui
 * contiennent au moins une note publique, AINSI QUE LEURS ANCÊTRES, et rien d'autre ».
 * Sans les ancêtres, un dossier public serait visible mais inatteignable ; « et rien
 * d'autre » rend l'ensemble CLOS.
 *
 * ATTENTION : l'appartenance d'un dossier au périmètre NE REND PAS ses notes visibles.
 * Le périmètre gouverne les DOSSIERS, `noteVisibleEnAnonyme()` gouverne les NOTES, et
 * omettre le second publierait le corpus interne.
 */
export function perimetreAnonyme(
	index: IndexDesDroits,
	notes: readonly NotePourPerimetre[]
): ReadonlySet<string> {
	const visibles = new Set<string>();
	for (const note of notes) {
		if (!noteVisibleEnAnonyme(note)) continue;
		// Le dossier porteur ET ses ancêtres — c'est la même remontée.
		for (const ancetre of chaineDAncetres(index, note.dossierId)) visibles.add(ancetre);
	}
	return visibles;
}

/**
 * Le périmètre de lecture d'une identité, sous la forme qu'`ADR-006` injecte DANS la
 * requête. `tout` est réservé à l'administrateur (`RG-DRO-03`), et ce n'est pas une
 * commodité : matérialiser « tous les dossiers » en ensemble ferait dépendre la
 * correction d'un ensemble complet, et un ensemble incomplet est une porte.
 */
export type Perimetre =
	{ readonly tout: true } | { readonly tout: false; readonly dossiers: ReadonlySet<string> };

/** Le périmètre de l'administrateur : tout, sans filtre (`RG-DRO-03`). */
export const PERIMETRE_TOTAL: Perimetre = { tout: true };

/**
 * Le périmètre de lecture — l'ensemble des dossiers que l'identité peut lire, ce
 * qu'`ADR-006` injecte dans la requête. Elle sert à CONSTRUIRE la requête, pas à trier
 * son résultat : l'ADR interdit « toute route qui reçoit une liste puis la filtre ».
 *
 * LE RÉGIME AUTHENTIFIÉ EST FERMÉ PAR DÉFAUT, et le cahier se contredit dessus : §2.2
 * donne au contributeur « lecture : tout le corpus », `RG-DRO-02` donne « aucun accès »
 * sans droit explicite. Ce qui les départage est `docs/routes.md` §5.5, dont la colonne
 * « connecté SANS DROIT » rend **404 V-26**.
 *
 * IL EXISTE DEUX PÉRIMÈTRES, ET LA ROUTE CHOISIT LEQUEL. Celui-ci est le périmètre
 * AUTORISÉ ; le périmètre PUBLIC (`perimetreAnonyme()`) n'est pas réservé à l'anonyme —
 * `/guides/{id}` rend V-03 pour les quatre personas. Un authentifié sans droit garde
 * donc le corpus public, et confondre les deux perdrait `RG-ACC-02`.
 *
 * @param notes nécessaires au SEUL régime anonyme (`RG-DRO-04`)
 */
export function perimetreDeLecture(
	identite: Identite,
	index: IndexDesDroits,
	notes: readonly NotePourPerimetre[] = []
): Perimetre {
	// RG-DRO-03 — l'administrateur contourne tous les droits de dossier.
	if (identite.type === 'authentifie' && identite.role === 'administrateur') {
		return PERIMETRE_TOTAL;
	}

	// RG-DRO-04 — l'anonyme a un périmètre, pas des droits.
	if (identite.type === 'anonyme') {
		return { tout: false, dossiers: perimetreAnonyme(index, notes) };
	}

	// RG-DRO-01, 02 et 05 — un dossier est lisible si la résolution rend un
	// droit dont les capacités portent la lecture. On ne présuppose pas que
	// « tout droit permet de lire » : c'est la table de §2.3 qui le dit, via
	// `capacites()`, et elle reste le seul endroit où cela s'écrit.
	const dossiers = new Set<string>();
	for (const dossierId of index.parents.keys()) {
		if (capacites(resoudreDroitDeDossier(identite, dossierId, index)).lire) {
			dossiers.add(dossierId);
		}
	}
	return { tout: false, dossiers };
}

/** Un dossier est-il dans un périmètre ? La seule lecture d'un `Perimetre`. */
export function perimetreContient(perimetre: Perimetre, dossierId: string): boolean {
	return perimetre.tout || perimetre.dossiers.has(dossierId);
}

/**
 * Une note est-elle lisible ? — la composition des deux filtres en un seul appel, parce
 * que les employer séparément est le moyen le plus simple de publier le corpus interne.
 *
 * `perimetreDeLecture()` gouverne les DOSSIERS, `noteVisibleEnAnonyme()` les NOTES : un
 * dossier du périmètre anonyme contient presque toujours des notes internes, et un
 * appelant qui listerait ses notes sans réappliquer le filtre les publierait toutes.
 *
 * CE QU'ELLE NE TRANCHE PAS : la visibilité des BROUILLONS pour un authentifié n'est
 * réglée par aucune règle. Le lot qui la spécifiera ajoutera son filtre ICI.
 */
export function noteLisible(
	identite: Identite,
	note: NotePourPerimetre,
	perimetre: Perimetre
): boolean {
	// Le dossier d'abord : hors périmètre, la question ne se pose plus.
	if (!perimetreContient(perimetre, note.dossierId)) return false;

	// RG-DRO-04 et CDC §2.2 — l'anonyme ne voit que publique ET publiée.
	if (identite.type === 'anonyme') return noteVisibleEnAnonyme(note);

	return true;
}

/**
 * Le résultat d'une résolution de ressource — `RG-ACC-04` : « un accès refusé sur un
 * contenu existant et un accès sur un contenu inexistant produisent la MÊME réponse
 * visible ». Ce type est le « ou rien » d'`ADR-007`, et il n'a PAS de troisième forme :
 * ni variante `interdit`, ni champ `raison`, ni code d'erreur.
 *
 * `ARB-005` fixe la frontière avec l'état « sans droit » de `RG-M18-03` : le régime
 * indiscernable vaut pour une RESSOURCE ENTIÈRE, l'état « sans droit » pour une ZONE
 * d'une page qu'on a le droit d'ouvrir. En cas de doute, l'indiscernable l'emporte.
 */
export type Resolution<T> =
	{ readonly trouve: true; readonly ressource: T } | { readonly trouve: false };

/**
 * L'unique valeur d'échec, et son unicité est la preuve : refus et inexistence rendent
 * LE MÊME OBJET, ce qu'un test affirme par identité de référence. Deux littéraux
 * distincts laisseraient l'un porter un jour un champ que l'autre n'a pas.
 */
export const INTROUVABLE: Resolution<never> = Object.freeze({ trouve: false });

/**
 * La résolution d'une ressource entière — le point d'entrée de `RG-ACC-04` : une
 * ressource absente et une ressource hors périmètre rendent `INTROUVABLE`, le même
 * objet, par le même `return`.
 *
 * CE QU'ELLE NE SUFFIT PAS À GARANTIR : elle reçoit une ressource DÉJÀ CHARGÉE, et
 * charger puis refuser coûte une requête que l'inexistence ne coûte pas. Le chemin
 * nominal est `perimetreDeLecture()`, injecté dans la requête.
 */
export function resoudre<T>(
	ressource: T | null | undefined,
	dansLePerimetre: (ressource: T) => boolean
): Resolution<T> {
	if (ressource === null || ressource === undefined) return INTROUVABLE;
	if (!dansLePerimetre(ressource)) return INTROUVABLE;
	return { trouve: true, ressource };
}
