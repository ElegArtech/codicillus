/**
 * LA RÉSOLUTION DES DROITS — L'IMPLÉMENTATION UNIQUE.
 *
 * `RG-DRO-01` à `RG-DRO-05` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:125`
 * à `:133`, plage vérifiée), encadrées par `RG-ACC-01` (`:107`) et `RG-ACC-04`
 * (`:113`).
 *
 * CE MODULE EST CETTE DÉFINITION. Tout ce qui décide d'un accès l'appelle :
 * les routes, les requêtes, l'indexation, les exports. Aucun appelant ne
 * remonte l'arborescence lui-même, aucun ne réécrit la fermeture par défaut.
 * C'est la même exigence structurelle que `P-01` pour la fraîcheur, et pour la
 * même raison, écrite au contrat de ce lot : *deux résolutions concurrentes, et
 * la sécurité du produit devient une question d'opinion.* `src/lib/fraicheur.ts`
 * est le précédent ; ce module en reprend le régime.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LE DROIT EFFECTIF N'EST PAS UNE COLONNE
 *
 * `base/migrations/002_socle.montee.sql:313` écrit, de la fraîcheur : « LA
 * FRAÎCHEUR N'EST PAS UNE COLONNE (P-01, ADR-005) […] une colonne `fraicheur`
 * serait une seconde définition ». La même logique vaut ici, et le schéma l'a
 * déjà appliquée : `droits_de_dossier` (`:202`) ne stocke que les droits
 * EXPLICITES — couple `(dossier_id, compte_id)` unique, `droit` non nul. Le
 * droit EFFECTIF, lui, n'est stocké nulle part : il se calcule, ici, par
 * remontée de l'arborescence. Une colonne `droit_effectif` serait une seconde
 * définition — et, à la différence d'un niveau de fraîcheur périmé, une
 * seconde définition de droit périmée est une faille.
 *
 * Le schéma le dit déjà en commentaire (`:197`) : « "Le plus proche" n'a de
 * sens que si un compte n'a qu'un droit explicite par dossier : d'où l'unicité
 * du couple. […] l'absence de ligne vaut absence d'accès, ce qui est
 * exactement ce que dit une table sans ligne. »
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE FAIT PAS
 *
 *  - Il n'ÉTABLIT aucune identité. Il en REÇOIT une. Les sessions sont `T-012`.
 *  - Il ne parle pas à la base. Il reçoit des lignes et rend une décision, ce
 *    qui le rend éprouvable sans base — `ADR-006` veut le filtre DANS la
 *    requête, et `perimetreDeLecture()` est ce qui s'y injecte.
 *  - Il ne projette rien dans l'index de recherche. C'est `T-027`.
 *  - Il ne rend aucune vue, et ne choisit aucun code HTTP. Il rend « une
 *    ressource ou rien » (`resoudre()`), et l'absence de ressource produit
 *    V-04 ou V-26 par le chemin unique de `src/lib/public/adresse-non-resolue.ts`.
 */

/* ═══════════════════════════════════════════════ Les identités ═════════ */

/**
 * Les QUATRE rôles de compte. `ARB-036` : le cahier des charges §2.2 en donne
 * trois (niveaux d'accès), les maquettes gelées en donnent quatre (V-28) —
 * « **4 rôles** — la maquette prime ». Les valeurs sont celles de
 * l'énumération livrée par `T-010` (`002_socle.montee.sql:27`), sans
 * diacritique : c'est une convention d'encodage, pas un second vocabulaire.
 */
export type RoleDeCompte = 'administrateur' | 'referent' | 'contributeur' | 'lecteur';

/**
 * Les trois droits de dossier, hérités dans l'arborescence (CDC §2.3, table
 * des droits ; `002_socle.montee.sql:36`).
 */
export type DroitDeDossier = 'lecteur' | 'redacteur' | 'gestionnaire';

/**
 * L'identité qui demande l'accès. Deux formes, et rien entre les deux :
 * `RG-DRO-04` fait de l'anonymat un régime SÉPARÉ, pas un compte sans droits.
 *
 * Le type porte la garantie : un anonyme n'a pas de `compteId`, donc aucun
 * code ne peut lui chercher un droit explicite « par erreur ».
 */
export type Identite =
	| { readonly type: 'anonyme' }
	| { readonly type: 'authentifie'; readonly compteId: string; readonly role: RoleDeCompte };

/** L'anonyme. Valeur unique : il n'y a rien à en distinguer. */
export const ANONYME: Identite = { type: 'anonyme' };

/**
 * Une identité authentifiée. Ce module ne l'ÉTABLIT pas — `T-012` le fera.
 *
 * CONSTRUIRE UNE IDENTITÉ EST UNE AFFIRMATION : celle que le compte existe et
 * qu'il est ACTIF. `RG-M14-08`
 * (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:1186`) : « un compte désactivé
 * perd IMMÉDIATEMENT l'accès mais reste attaché à ses contributions passées ».
 *
 * Cette règle n'est PAS appliquée ici, et c'est délibéré : `Identite` ne porte
 * pas `actif`, donc ce module ne peut pas la contredire — mais il ne peut pas
 * la faire respecter non plus. Le point d'application est l'établissement de
 * session (`T-012`), seul endroit où « immédiatement » a un sens : un droit
 * résolu pour un compte désactivé serait exact au regard de `RG-DRO-01` et faux
 * au regard de `RG-M14-08`.
 *
 * Le corpus porte le cas : `c-ancien` (Pierre Dubois, rôle Lecteur) est
 * `actif: false` (`seeds/corpus.ts`). `T-012` a donc de quoi l'éprouver sur
 * donnée réelle, et n'a pas à inventer un compte pour cela.
 *
 * Écart déclaré au rapport de `T-011` : la règle est hors de la liste du
 * contrat (`RG-DRO-01` à `05`, `RG-ACC-01`, `RG-ACC-04`), elle gouverne
 * pourtant l'accès, et elle n'a aujourd'hui aucun point d'application.
 */
export function identiteAuthentifiee(compteId: string, role: RoleDeCompte): Identite {
	return { type: 'authentifie', compteId, role };
}

/* ═══════════════════════════════════════════════ Les entrées ═══════════ */

/**
 * Ce que la résolution a besoin de savoir d'un dossier : QUI EST SON PARENT.
 * Rien d'autre — ni nom, ni domaine, ni position. Le type est STRUCTUREL :
 * une ligne de `dossiers` le satisfait, une ligne de semence aussi.
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
 * Ce que le périmètre anonyme a besoin de savoir d'une note. `RG-ACC-01` exige
 * que le filtrage soit « au plus près de la donnée » : ces trois champs sont
 * ceux que la requête porte, pas ceux que l'affichage lit.
 */
export interface NotePourPerimetre {
	readonly dossierId: string;
	readonly visibilite: 'interne' | 'publique';
	readonly statut: 'brouillon' | 'publiee';
}

/* ═══════════════════════════════════════════════ L'index ═══════════════ */

/**
 * L'arborescence et les droits, indexés pour la remontée.
 *
 * Construit UNE FOIS par requête, jamais par dossier : `RG-DRO-01` remonte la
 * chaîne d'ancêtres, et refaire un balayage linéaire à chaque niveau ferait du
 * coût une raison de contourner la règle.
 */
export interface IndexDesDroits {
	readonly parents: ReadonlyMap<string, string | null>;
	/** `dossierId` → (`compteId` → droit). Unicité du couple : un droit au plus. */
	readonly explicites: ReadonlyMap<string, ReadonlyMap<string, DroitDeDossier>>;
}

/** Indexe l'arborescence et les droits explicites. */
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
 * LA CHAÎNE D'ANCÊTRES, du dossier lui-même jusqu'à la racine — LE PLUS PROCHE
 * D'ABORD. C'est l'ordre de `RG-DRO-01`, et c'est pour cela que la fonction
 * existe : `resoudreDroitDeDossier()` et `perimetreAnonyme()` la partagent,
 * de sorte que « remonter l'arborescence » n'ait qu'une seule écriture.
 *
 * Un dossier inconnu rend une chaîne VIDE — pas une exception. La fermeture
 * par défaut de `RG-DRO-02` répond alors d'elle-même, et l'appelant n'a pas à
 * distinguer « dossier absent » de « dossier interdit » : c'est aussi ce que
 * `RG-ACC-04` demande.
 *
 * GARDE-FOU DE CYCLE, et ce n'en est pas une règle métier. Le schéma contraint
 * la profondeur (`dossiers_profondeur_plafonnee`, 1 à 10) et interdit qu'un
 * dossier soit son propre parent, mais il n'exclut PAS un cycle plus long —
 * `002_socle.montee.sql:18` le dit en toutes lettres, « ce qui ne l'est pas
 * (cycles de dossiers…) est énoncé en commentaire ». Une donnée cyclique ferait
 * ici une boucle infinie, c'est-à-dire un déni de service ; la remontée
 * s'arrête donc au premier identifiant déjà vu. L'effet est une FERMETURE, pas
 * une ouverture : le doute ne se résout jamais en faveur de l'accès.
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

/* ═══════════════════════════════════ La résolution, RG-DRO-01 à 05 ═════ */

/**
 * L'IDENTITÉ TIENT-ELLE SA GESTION DE SON RÔLE ? — `RG-DRO-03`, et rien d'autre.
 *
 * La règle est déjà appliquée par `resoudreDroitDeDossier()` ci-dessous, qui
 * appelle ce prédicat : il n'y a donc pas deux écritures du contournement, il y
 * en a une, et ce nom la rend CONSULTABLE ailleurs.
 *
 * Elle est consultable parce qu'une écriture de droit a besoin de la distinguer.
 * Un gestionnaire qui tient sa gestion d'une ligne de `droits_de_dossier` se
 * ferme la porte en s'abaissant lui-même — `RG-DRO-01`, le plus spécifique
 * gagne, et l'écran qui lui rendrait le geste ne s'ouvrirait plus. Celui qui la
 * tient de son RÔLE ne se ferme rien : la table n'est pas lue pour lui. Refuser
 * les deux au même titre serait refuser par un motif qui ne s'applique pas.
 */
export function contourneLesDroitsDeDossier(identite: Identite): boolean {
	return identite.type === 'authentifie' && identite.role === 'administrateur';
}

/**
 * LE POINT D'ENTRÉE DE LA RÉSOLUTION — le droit effectif d'une identité sur un
 * dossier, ou `null` si elle n'en a aucun.
 *
 * Les cinq règles, dans l'ordre où elles s'appliquent :
 *
 *   `RG-DRO-04` — « les droits de dossier ne s'appliquent qu'aux utilisateurs
 *     authentifiés ». L'anonyme sort EN PREMIER, et sans consulter la table :
 *     il n'a pas de droit de dossier, il a un périmètre — `perimetreAnonyme()`.
 *     Sortir en premier est ce qui rend impossible qu'un droit posé sur un
 *     compte fuie vers l'anonyme par une branche oubliée.
 *
 *   `RG-DRO-03` — « l'administrateur contourne tous les droits de dossier ».
 *     Il rend donc `gestionnaire`, le droit le plus fort, SANS lire la table.
 *     Seul le rôle `administrateur` contourne : `referent` ne le fait pas —
 *     `RG-DRO-03` ne le nomme pas, et étendre le contournement à un rôle que la
 *     règle ne cite pas serait un comblement (`CLAUDE.md` §2).
 *
 *   `RG-DRO-01` — « le droit explicite LE PLUS PROCHE en remontant
 *     l'arborescence. Le plus spécifique gagne. » La chaîne étant ordonnée du
 *     plus proche au plus lointain, le PREMIER droit rencontré est le bon, et
 *     la remontée s'arrête là. Un droit plus lointain qui le contredit n'est
 *     jamais lu — c'est cela, « le plus spécifique gagne » : il ne s'agit pas
 *     de comparer deux droits en force, mais de s'arrêter au premier.
 *
 *   `RG-DRO-05` — « un droit posé sur un dossier racine vaut pour tout le
 *     sous-arbre ». Aucune ligne de code ne lui correspond, et c'est normal :
 *     la remontée atteint la racine depuis n'importe quel descendant, donc un
 *     droit racinaire est trouvé par tout le sous-arbre. `RG-DRO-05` est une
 *     CONSÉQUENCE de `RG-DRO-01`, pas une règle supplémentaire.
 *
 *   `RG-DRO-02` — « en l'absence de tout droit explicite sur le dossier ou l'un
 *     de ses ancêtres, aucun accès ». C'est le `return null` final, et c'est le
 *     DÉFAUT du parcours : on ne rend un droit que si on en a trouvé un.
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

/* ═══════════════════════════════════ Ce qu'un droit permet, CDC §2.3 ═══ */

/**
 * Ce que le droit effectif autorise. Transcription de la table de CDC §2.3
 * (`:119` à `:123`), colonne par colonne — c'est la table qui décide, et elle
 * est recopiée ici plutôt que réinterprétée à chaque appel.
 *
 * `null` — aucun droit — met tout à `false` : c'est `RG-DRO-02` rendu en
 * capacités, et c'est pourquoi l'absence de droit n'a pas de branche à part.
 */
export interface Capacites {
	/** Lire le dossier et ses notes. */
	readonly lire: boolean;
	/** Créer et modifier des notes. */
	readonly ecrireDesNotes: boolean;
	/** Créer des sous-dossiers. */
	readonly creerDesSousDossiers: boolean;
	/** Renommer, déplacer, supprimer le dossier. */
	readonly administrerLeDossier: boolean;
	/** Gérer les droits. */
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

/* ═══════════════════════════════════ Le périmètre anonyme, RG-DRO-04 ═══ */

/**
 * Ce qu'une note doit être pour qu'un anonyme la voie : PUBLIQUE **et**
 * PUBLIÉE. Les deux, et le « et » est du cahier des charges — §2.2, ligne de
 * l'anonyme : « Notes marquées *publiques* **et** publiées uniquement ».
 *
 * `ADR-006` en fait le filtre entier du régime anonyme : « en anonyme, le
 * filtre est réduit à `visibilite = publique AND statut = publiee`, **sans
 * exception ni chemin dérogatoire** ».
 */
export function noteVisibleEnAnonyme(note: NotePourPerimetre): boolean {
	return note.visibilite === 'publique' && note.statut === 'publiee';
}

/**
 * LE PÉRIMÈTRE ANONYME — `RG-DRO-04`, seconde moitié : « l'anonyme voit les
 * dossiers qui contiennent au moins une note publique, AINSI QUE LEURS
 * ANCÊTRES, et rien d'autre ».
 *
 * Les deux moitiés sont ici, et la seconde n'est pas décorative : sans les
 * ancêtres, un dossier public serait visible mais inatteignable — on ne
 * pourrait pas y descendre. Elle est la raison d'être de la remontée.
 *
 * « ET RIEN D'AUTRE » est le mot le plus important de la règle : l'ensemble
 * rendu est CLOS. Un dossier qui n'y figure pas n'existe pas pour l'anonyme —
 * ni en navigation, ni en recherche, ni par adresse construite (`RG-ACC-01`).
 *
 * ATTENTION, ET C'EST LE PIÈGE DE CETTE FONCTION. L'appartenance d'un dossier
 * au périmètre NE REND PAS ses notes visibles : un dossier qui contient une
 * note publique en contient souvent d'autres qui sont internes. Le périmètre
 * gouverne les DOSSIERS ; `noteVisibleEnAnonyme()` gouverne les NOTES. Les deux
 * se composent, et omettre le second publierait le corpus interne.
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

/* ═══════════════════════════════════ Le filtre d'ADR-006 ═══════════════ */

/**
 * Le périmètre de lecture d'une identité, sous la forme que `ADR-006` veut
 * injecter DANS la requête — « le serveur calcule l'ensemble des dossiers
 * effectivement lisibles par l'appelant […] et l'injecte comme filtre. La
 * requête envoyée au moteur NE PEUT PAS rapporter un document interdit. »
 *
 * `tout` est réservé à l'administrateur (`RG-DRO-03`). Ce n'est pas une
 * commodité : matérialiser « tous les dossiers » en ensemble ferait dépendre
 * la correction d'un ensemble complet, et un ensemble incomplet est une porte.
 */
export type Perimetre =
	{ readonly tout: true } | { readonly tout: false; readonly dossiers: ReadonlySet<string> };

/** Le périmètre de l'administrateur : tout, sans filtre (`RG-DRO-03`). */
export const PERIMETRE_TOTAL: Perimetre = { tout: true };

/**
 * LE PÉRIMÈTRE DE LECTURE — l'ensemble des dossiers que l'identité peut lire.
 *
 * C'est ce que `ADR-006` injecte dans la requête, et c'est le point d'entrée
 * que toute liste, toute recherche et toute suggestion doit appeler. `ADR-006`
 * interdit explicitement « toute route qui reçoit une liste puis la filtre » :
 * cette fonction sert à construire la requête, pas à trier son résultat.
 *
 * LE RÉGIME AUTHENTIFIÉ EST FERMÉ PAR DÉFAUT, et ce point mérite d'être écrit
 * parce que le cahier des charges se contredit dessus. §2.2 donne au
 * contributeur « Lecture : tout le corpus » ; `RG-DRO-02` (`:127`) donne
 * « aucun accès » sans droit explicite, et la table de §2.3 fait de « lire le
 * dossier et ses notes » la première colonne du droit de lecteur. Les deux
 * énoncés sont dans la MÊME source : l'ordre de préséance ne les départage
 * pas. Ce qui les départage est `docs/routes.md` §5.5, dont la colonne
 * « Connecté SANS DROIT » rend **404 V-26** sur `/notes/{id}` et sur
 * `/univers/…` — la lecture est donc bien gouvernée par les droits de dossier.
 * `ADR-006` lit la même chose. Écart déclaré au rapport ; aucune décision n'est
 * prise ici, une lecture déjà arbitrée est appliquée.
 *
 * IL EXISTE DEUX PÉRIMÈTRES, ET LA ROUTE CHOISIT LEQUEL. Celui-ci est le
 * périmètre AUTORISÉ, celui de `/notes/{id}` et de `/univers/…`. Le périmètre
 * PUBLIC — `perimetreAnonyme()` — n'est pas réservé à l'anonyme : `/guides/{id}`
 * rend **V-03 pour les quatre personas** quand la note est publique et publiée
 * (`docs/routes.md` §5.5), y compris pour un connecté SANS DROIT. Un
 * authentifié sans droit n'a donc pas « aucun accès au produit » : il n'a aucun
 * accès au corpus INTERNE, et garde le corpus public comme tout le monde.
 * Ne pas confondre les deux perdrait `RG-ACC-02` (« après déconnexion,
 * l'utilisateur atterrit sur l'espace public, jamais sur une page d'erreur »).
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
 * UNE NOTE EST-ELLE LISIBLE ? — la composition des deux filtres, en un seul
 * appel, parce que les employer séparément est le moyen le plus simple de
 * publier le corpus interne.
 *
 * `perimetreDeLecture()` gouverne les DOSSIERS ; `noteVisibleEnAnonyme()`
 * gouverne les NOTES. Un dossier du périmètre anonyme contient presque toujours
 * des notes internes — le corpus livré en fournit l'exemple : « Poste de
 * travail › Déploiement » porte une note publique ET des notes internes.
 * Un appelant qui listerait les notes d'un dossier du périmètre sans
 * réappliquer le filtre de note les publierait toutes. C'est exactement la
 * faute que `RG-ACC-01` nomme : « le filtrage est appliqué au plus près de la
 * donnée, pas seulement dans l'affichage ».
 *
 * CE QUE CETTE FONCTION NE TRANCHE PAS. Elle applique les deux filtres
 * SPÉCIFIÉS, et rien de plus. La visibilité des BROUILLONS pour un utilisateur
 * authentifié n'est réglée par aucune des règles de ce lot : `RG-DRO-01` à `05`
 * ne parlent que de dossiers, et le statut n'apparaît que dans la ligne
 * ANONYME de CDC §2.2 (« publiques ET publiées uniquement »). Le lot qui
 * spécifiera le brouillon ajoutera son filtre ICI, et nulle part ailleurs.
 * Ne pas l'inventer aujourd'hui est un refus de comblement, pas un oubli.
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

/* ═══════════════════════════════════ RG-ACC-04 ═════════════════════════ */

/**
 * LE RÉSULTAT D'UNE RÉSOLUTION DE RESSOURCE — `RG-ACC-04` (`:113`) : « un accès
 * refusé sur un contenu existant et un accès sur un contenu inexistant
 * produisent la MÊME réponse visible ».
 *
 * `ADR-007`, cité par `src/lib/public/adresse-non-resolue.ts` : « la résolution
 * d'accès rapporte une ressource ou rien ». Ce type est ce « ou rien », et il
 * n'a PAS de troisième forme : il n'existe ni variante `interdit`, ni champ
 * `raison`, ni code d'erreur. Un appelant n'a rien à quoi se raccrocher pour
 * distinguer les deux cas — la garantie est portée par le TYPE, pas par une
 * discipline d'écriture, exactement comme `adresseNonResolue()` la porte par sa
 * signature.
 *
 * `ARB-005` fixe la frontière avec l'état « sans droit » de `RG-M18-03` : le
 * régime indiscernable vaut pour « la résolution d'une RESSOURCE ENTIÈRE — une
 * adresse » ; l'état « sans droit » vaut pour « une ZONE dans une page que
 * l'utilisateur a le droit d'ouvrir ». Ce type sert le premier cas. En cas de
 * doute, `ARB-005` tranche : « le régime indiscernable l'emporte. Le doute ne
 * se résout jamais en faveur de l'information révélée. »
 */
export type Resolution<T> =
	{ readonly trouve: true; readonly ressource: T } | { readonly trouve: false };

/**
 * L'UNIQUE VALEUR D'ÉCHEC, et son unicité est la preuve.
 *
 * Refus et inexistence ne rendent pas deux objets égaux : ils rendent LE MÊME
 * OBJET. `resoudre(rien) === resoudre(interdit)` est vrai par IDENTITÉ de
 * référence, ce qu'un test peut affirmer et qu'une divergence future casserait
 * immédiatement. Deux littéraux distincts, même de forme identique, laisseraient
 * la porte ouverte à ce que l'un porte un jour un champ que l'autre n'a pas.
 */
export const INTROUVABLE: Resolution<never> = Object.freeze({ trouve: false });

/**
 * LA RÉSOLUTION D'UNE RESSOURCE ENTIÈRE — le point d'entrée de `RG-ACC-04`.
 *
 * Une ressource absente et une ressource présente mais hors périmètre rendent
 * `INTROUVABLE`, le même objet, par le même `return`. Il n'existe pas deux
 * chemins de sortie à distinguer.
 *
 * CE QUE CETTE FONCTION NE SUFFIT PAS À GARANTIR, et il faut le dire. Elle
 * reçoit une ressource DÉJÀ CHARGÉE : le temps mis à la charger, lui, n'est pas
 * indiscernable — charger puis refuser coûte une requête que l'inexistence ne
 * coûte pas, et `ARB-005` compte l'écart de latence comme une fuite. Le chemin
 * NOMINAL n'est donc pas celui-ci : c'est `perimetreDeLecture()`, injecté dans
 * la requête (`ADR-006`), qui fait qu'une ressource interdite ne remonte pas
 * plus vite ni plus lentement qu'une ressource absente — elle ne remonte pas,
 * et pour la même raison, au même endroit, dans le même plan de requête.
 * `resoudre()` est le garde-fou du cas où une ressource a malgré tout été
 * chargée hors périmètre ; il ne remplace pas le filtre.
 */
export function resoudre<T>(
	ressource: T | null | undefined,
	dansLePerimetre: (ressource: T) => boolean
): Resolution<T> {
	if (ressource === null || ressource === undefined) return INTROUVABLE;
	if (!dansLePerimetre(ressource)) return INTROUVABLE;
	return { trouve: true, ressource };
}
