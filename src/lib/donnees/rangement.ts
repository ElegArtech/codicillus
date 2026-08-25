/**
 * LE RANGEMENT, LU DEPUIS LA BASE — univers, domaine, dossiers, notes lisibles.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE EST, ET CE QU'IL N'EST PAS
 *
 * `T-030` a livré `./lecture.ts` : la couche qui rend les formes de
 * `seeds/corpus.ts` depuis la base, SANS AUCUN FILTRE — c'est ce que sa batterie
 * d'équivalence mesure, et c'est ce qu'elle doit mesurer. Ce module est bâti SUR
 * le sien : il n'en redéfinit aucun type, ne recopie aucune de ses conversions,
 * et lui délègue tout ce qui ne dépend pas de l'appelant (les dates, l'extrait,
 * les chemins de dossier, les seuils).
 *
 * CE QU'IL AJOUTE, ET C'EST TOUT : le PÉRIMÈTRE. `ADR-006` interdit « toute
 * route qui reçoit une liste puis la filtre — le filtre est dans la requête,
 * pas après elle ». Les quatre routes du rangement ne peuvent donc pas appeler
 * `lireNotes()` puis retirer ce qu'elles n'ont pas le droit de montrer : elles
 * appellent `lireNotesLisibles()`, qui porte l'ensemble des dossiers lisibles
 * DANS son `where`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI — `src/lib/droits/resolution.ts`
 *
 * L'implémentation est unique, et ce module en est un APPELANT : il lui passe
 * l'identité que `src/hooks.server.ts` a établie, l'arborescence et les droits
 * explicites, et il reçoit un périmètre ou un droit effectif. Aucune ligne
 * ci-dessous ne compare un rôle, ne remonte une arborescence de droits, ni ne
 * décide qu'un droit en vaut un autre. Le contraire serait une seconde
 * définition, et `resolution.ts` le dit de lui-même : « deux résolutions
 * concurrentes, et la sécurité du produit devient une question d'opinion ».
 *
 * `T-011` avait livré cette résolution le 19 août ; AUCUNE ROUTE NE L'APPELAIT
 * avant le 20 (`ECART-047` É-1). Ce module est son premier appelant côté
 * rangement.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE SÉPARATEUR DE CHEMIN EST UNE DONNÉE DU GEL, PAS UNE COMMODITÉ
 *
 * `Note.dossier` du jeu de semence et l'axe « Dossier » de la planche de V-13
 * portent le même séparateur, et il tient en trois caractères : espace, chevron
 * simple droit (U+203A), espace. Relevé sur pièce, jamais supposé — les octets
 * de `verif/scenarios/V-13.json`, entre « Exploitation » et « Sauvegardes »,
 * sont `20 e2 80 ba 20`, et les deux espaces en font partie.
 * `lireCheminsDeDossier()` de `T-030` joint avec exactement cette chaîne ;
 * `SEPARATEUR_DE_CHEMIN` la nomme pour que personne ne la retape.
 *
 * L'ADRESSE, ELLE, N'EMPLOIE PAS CE SÉPARATEUR : `{chemin…}` est une suite de
 * segments d'adresse séparés par des barres obliques, chacun étant
 * l'identifiant lisible du nom du dossier (`$lib/rangement/adresses`). Les deux
 * représentations ne se confondent jamais : l'une est affichée, l'autre est
 * demandée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA RACINE N'EST PAS DANS LE CHEMIN, ET TROIS SOURCES LE DISENT
 *
 * `dossiers` porte un dossier de profondeur 1 par domaine, dont le nom est celui
 * du domaine (`RG-STR-03`, décision de `lignesDeDossier()`). Il n'apparaît ni
 * dans `Note.dossier`, ni dans l'axe « Dossier » de la planche de V-13
 * (`Exploitation`, `Exploitation › Sauvegardes`), ni dans l'adresse que la
 * batterie 6 construit — `verif/etancheite.mjs:386` écarte explicitement le
 * premier maillon de la chaîne remontée. Les fonctions de chemin de ce module
 * l'écartent donc aussi, et le chemin AFFICHÉ d'une racine est la suite vide.
 *
 * MAIS LA RACINE A UNE PAGE, ET CE MODULE NE LA DÉCIDE PAS. Le chargeur de
 * V-13 lui donne une adresse depuis le 22/08/2026 — celle qui porte son seul
 * nom, `viseLaRacine` — parce qu'un domaine neuf n'a que sa racine et que le
 * premier dossier ne pouvait sans cela être créé de nulle part. Ce module
 * disait auparavant « la page du dossier racine est la page du domaine, V-11 » :
 * c'est révoqué, et `resoudreLeChemin()` reste néanmoins ce qu'elle était —
 * elle descend depuis la racine sans la consommer, donc elle ne désigne que des
 * descendants, et la racine s'adresse hors d'elle.
 */
import { error } from '@sveltejs/kit';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Base } from '../base/acces';
import {
	comptes,
	domaines,
	dossiers,
	droitsDeDossier,
	etiquettes,
	etiquettesDeNote,
	modulesDeDomaine,
	notes,
	piecesJointes,
	typesDeFiche,
	typesDeNote,
	univers
} from '../base/schema';
import {
	capacites,
	indexerLesDroits,
	perimetreDeLecture,
	resoudreDroitDeDossier,
	type DroitDeDossier,
	type Identite,
	type IndexDesDroits,
	type Perimetre
} from '../droits/resolution';
import { niveauFraicheur } from '../fraicheur';
import { identifiantLisible } from '../rangement/adresses';
import {
	dateCourteDInstant,
	dateCourteDIso,
	extraitDuCorps,
	joursEcoules,
	lireCheminsDeDossier,
	lireSeuils,
	type ContexteDeLecture
} from './lecture';
import type { CleDeModule, Note, TypeDeFiche, TypeDeNote } from '../../../seeds/corpus';

/* ═══════════════════════════════════════════ Le chemin de dossier ══════ */

/**
 * Le séparateur AFFICHÉ d'un chemin de dossier — espace, U+203A, espace.
 * Voir l'en-tête : c'est un relevé du gel, à trois caractères et cinq octets.
 */
export const SEPARATEUR_DE_CHEMIN = ' › ';

/**
 * Le plafond de `RG-STR-04`, que la contrainte `dossiers_profondeur_plafonnee`
 * porte déjà en base. Il est relu ici pour REFUSER une adresse trop profonde
 * sans interroger la base : une adresse de plus de dix maillons ne peut désigner
 * aucun dossier, et le dire coûte une comparaison plutôt qu'une requête.
 */
export const PROFONDEUR_MAX = 10;

/** Ce que la résolution d'un chemin a besoin de savoir d'un dossier. */
export interface LigneDeDossier {
	readonly id: string;
	readonly parentId: string | null;
	readonly domaineId: string;
	readonly nom: string;
	readonly profondeur: number;
	/**
	 * LE RANG DANS LA FRATRIE — `dossiers.position`, et c'est la SEULE règle
	 * d'ordre que le produit connaisse entre frères. Ni le nom, ni la date de
	 * création : la colonne existe pour cela, et la semence la renseigne de sorte
	 * que l'ordre affiché soit celui des maquettes.
	 *
	 * OPTIONNELLE, et c'est délibéré : ce type est STRUCTUREL — une ligne de base
	 * le satisfait, une ligne écrite à la main dans un cas d'épreuve aussi. Le
	 * rendre obligatoire forcerait tout cas synthétique à renseigner un rang dont
	 * il n'a que faire, et un cas qu'on alourdit est un cas qu'on n'écrit pas.
	 * Absente, elle vaut `0` chez l'appelant qui trie.
	 */
	readonly position?: number;
}

/** Le chemin affiché d'une suite de segments — la forme de `Note.dossier`. */
export function cheminAffiche(segments: readonly string[]): string {
	return segments.join(SEPARATEUR_DE_CHEMIN);
}

/**
 * LE DOSSIER QU'UNE ADRESSE DÉSIGNE, ou `null`.
 *
 * Fonction PURE : elle reçoit les lignes d'un domaine et les segments
 * d'adresse, et descend l'arborescence maillon par maillon depuis la racine.
 * Trois refus, et aucun n'est une exception :
 *
 *   · un chemin VIDE — la racine n'est pas une page de dossier (en-tête) ;
 *   · un chemin qui mènerait au-delà de `PROFONDEUR_MAX` — `RG-STR-04` ;
 *   · un segment qui ne correspond à aucun ENFANT du maillon courant.
 *
 * La descente est faite par PARENT, jamais par nom global : deux domaines
 * portent tous deux un dossier « Applications » (relevé en base), et un
 * appariement par nom seul rendrait le mauvais. `RG-STR-05` interdit d'ailleurs
 * qu'un dossier ait un parent d'un autre domaine, ce que la clé étrangère
 * composite du schéma rend inécrivable — la descente s'appuie sur cette
 * garantie plutôt que de la revérifier.
 */
export function resoudreLeChemin(
	lignes: readonly LigneDeDossier[],
	segments: readonly string[]
): LigneDeDossier | null {
	if (segments.length === 0 || segments.length > PROFONDEUR_MAX - 1) return null;
	const racine = lignes.find((d) => d.parentId === null);
	if (racine === undefined) return null;

	let courant = racine;
	for (const segment of segments) {
		const enfant = lignes.find(
			(d) => d.parentId === courant.id && identifiantLisible(d.nom) === segment
		);
		if (enfant === undefined) return null;
		courant = enfant;
	}
	return courant;
}

/**
 * LES SEGMENTS AFFICHÉS d'un dossier — la racine exclue, du plus haut au
 * dossier lui-même. Fonction PURE, et l'inverse exact de `resoudreLeChemin()`.
 *
 * Le garde-fou de cycle est celui de `chaineDAncetres()` de `resolution.ts`, et
 * pour la même raison : le schéma plafonne la profondeur et interdit qu'un
 * dossier soit son propre parent, mais il n'exclut pas un cycle plus long. La
 * remontée s'arrête au premier identifiant déjà vu, et rend donc un chemin
 * tronqué plutôt qu'une boucle infinie. L'effet est une FERMETURE — un chemin
 * tronqué ne désigne pas le dossier demandé —, jamais une ouverture.
 */
export function segmentsAffiches(
	lignes: readonly LigneDeDossier[],
	dossierId: string
): readonly string[] {
	const parId = new Map(lignes.map((d) => [d.id, d]));
	const remontee: string[] = [];
	const vus = new Set<string>();
	let courant = parId.get(dossierId);
	while (courant !== undefined && !vus.has(courant.id) && courant.parentId !== null) {
		vus.add(courant.id);
		remontee.push(courant.nom);
		courant = parId.get(courant.parentId);
	}
	return remontee.reverse();
}

/* ═══════════════════════════════════════════ RG-STR-06, P-04 ═══════════ */

/**
 * `moduleDeDomaine` de la base vers la clé des maquettes — l'inverse de
 * `MODULE_EN_ENUM` de la semence. `lireModulesParDomaine()` de `T-030` porte la
 * même table, indexée par NOM de domaine ; ce module a besoin de la lecture par
 * IDENTIFIANT de ligne, qui seule est indépendante du nom affiché.
 */
const MODULE_DEPUIS_ENUM: Record<string, CleDeModule> = {
	notes: 'notes',
	dossiers: 'dossiers',
	fiches: 'fiches',
	cartographie: 'cartographie',
	signets: 'signets',
	carte_mentale: 'carteMentale'
};

/**
 * `RG-STR-06` — « un module non activé n'apparaît ni dans la navigation du
 * domaine, ni dans ses tableaux de bord », et `P-04` : « l'activation n'est pas
 * décorative ».
 *
 * Fonction PURE, et c'est ce qui la rend éprouvable dans les DEUX POLARITÉS sans
 * base (`P-5`, `P-26`) : un module activé passe, un module non activé est
 * refusé, et l'épreuve ne dépend pas de l'état du dépôt.
 *
 * LA CONSÉQUENCE POUR UNE ROUTE, et c'est elle que ce lot livre : l'adresse d'un
 * module non activé ne rend rien. Ce n'est pas une nuance d'affichage — une
 * entrée de navigation qui disparaît mais dont l'adresse répond encore laisse le
 * module atteignable, et le module ne serait « décoratif » qu'à moitié. Le refus
 * prend la forme du régime indiscernable, comme tout refus de ressource
 * (`ARB-005`) : la route ne dit pas « module désactivé », elle ne rend rien.
 */
export function moduleActif(actifs: ReadonlySet<CleDeModule>, module: CleDeModule): boolean {
	return actifs.has(module);
}

/** Les modules activés d'un domaine, par son identifiant de ligne. */
export async function lireModulesDuDomaine(
	base: Base,
	domaineId: string
): Promise<ReadonlySet<CleDeModule>> {
	const lignes = await base
		.select({ module: modulesDeDomaine.module })
		.from(modulesDeDomaine)
		.where(eq(modulesDeDomaine.domaineId, domaineId));

	const actifs = new Set<CleDeModule>();
	for (const ligne of lignes) {
		const cle = MODULE_DEPUIS_ENUM[ligne.module];
		if (cle === undefined) throw new Error(`module inconnu en base : ${ligne.module}`);
		actifs.add(cle);
	}
	return actifs;
}

/* ═══════════════════════════════════════════ L'accès d'une requête ═════ */

/**
 * CE QU'UNE REQUÊTE DE RANGEMENT SAIT DE SON APPELANT — établi une fois, jamais
 * par dossier.
 *
 * `resolution.ts` l'exige en propres termes : l'index est « construit UNE FOIS
 * par requête, jamais par dossier », sans quoi « refaire un balayage linéaire à
 * chaque niveau ferait du coût une raison de contourner la règle ».
 */
export interface AccesAuRangement {
	readonly identite: Identite;
	readonly index: IndexDesDroits;
	readonly perimetre: Perimetre;
	readonly contexte: ContexteDeLecture;
	readonly dossiers: readonly LigneDeDossier[];
}

/**
 * L'ACCÈS D'UNE REQUÊTE, et le seul endroit où le périmètre est calculé.
 *
 * DEUX CHOSES SE LISENT ICI, ET PAS UNE DE PLUS. L'arborescence entière — la
 * remontée d'ancêtres de `RG-DRO-01` en a besoin, et un dossier hors périmètre
 * peut être l'ancêtre d'un dossier dans le périmètre. Et les droits explicites
 * DU SEUL COMPTE APPELANT : le filtre est dans la requête, jamais après elle
 * (`ADR-006`), et les droits des autres comptes ne concernent pas cette réponse.
 *
 * POURQUOI LE PÉRIMÈTRE ANONYME EST VIDE ICI, ET CE N'EST PAS UN RACCOURCI.
 * `perimetreDeLecture()` prend les notes en dernier paramètre, « nécessaires au
 * SEUL régime anonyme », et son commentaire tranche l'emploi : « il existe deux
 * périmètres, et LA ROUTE CHOISIT LEQUEL. Celui-ci est le périmètre AUTORISÉ,
 * celui de `/notes/{id}` et de `/univers/…` ». Le périmètre PUBLIC est celui de
 * `/guides/{identifiant}`, servi aux quatre personas (`ARB-007` A-05). Les
 * quatre routes du rangement relèvent du premier : `docs/routes.md:365`, ligne
 * `/univers/…` de la matrice §5.5, colonne « Anonyme », rend **404 V-04** — sans
 * condition, et quel que soit le contenu public du domaine. Ne passer aucune
 * note est donc la transcription de cette ligne, non une omission ; `RG-DRO-04`
 * fait le reste, l'anonyme n'ayant aucun droit de dossier.
 */
export async function ouvrirLAcces(
	base: Base,
	identite: Identite,
	maintenant: Date
): Promise<AccesAuRangement> {
	const lignes = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			domaineId: dossiers.domaineId,
			nom: dossiers.nom,
			profondeur: dossiers.profondeur,
			position: dossiers.position
		})
		.from(dossiers);

	const explicites =
		identite.type === 'authentifie'
			? await base
					.select({
						dossierId: droitsDeDossier.dossierId,
						compteId: droitsDeDossier.compteId,
						droit: droitsDeDossier.droit
					})
					.from(droitsDeDossier)
					.where(eq(droitsDeDossier.compteId, identite.compteId))
			: [];

	const index = indexerLesDroits(lignes, explicites);
	return {
		identite,
		index,
		perimetre: perimetreDeLecture(identite, index),
		contexte: { maintenant, seuils: await lireSeuils(base) },
		dossiers: lignes
	};
}

/**
 * Le droit effectif de l'appelant sur un dossier, ou `null`. Un seul appel, vers
 * l'implémentation unique — c'est la seule porte par laquelle un droit entre
 * dans ce module.
 */
export function droitEffectif(acces: AccesAuRangement, dossierId: string): DroitDeDossier | null {
	return resoudreDroitDeDossier(acces.identite, dossierId, acces.index);
}

/**
 * L'appelant peut-il écrire des notes dans l'un de ces dossiers ? C'est la table
 * de capacités de CDC §2.3 qui répond, par `capacites()` — aucune comparaison de
 * droit n'est écrite ici, et aucune n'a à l'être.
 */
export function peutEcrireDansLUn(
	acces: AccesAuRangement,
	dossiersVises: readonly string[]
): boolean {
	return dossiersVises.some((id) => capacites(droitEffectif(acces, id)).ecrireDesNotes);
}

/** Les dossiers d'un domaine, parmi ceux que `ouvrirLAcces()` a déjà lus. */
export function dossiersDuDomaine(
	acces: AccesAuRangement,
	domaineId: string
): readonly LigneDeDossier[] {
	return acces.dossiers.filter((d) => d.domaineId === domaineId);
}

/**
 * LE DOMAINE EST-IL LISIBLE ? — un dossier au moins dont les capacités portent
 * la lecture. `capacites()` est la seule autorité : on ne présuppose pas que
 * « tout droit permet de lire », c'est la table de CDC §2.3 qui le dit.
 */
export function domaineLisible(acces: AccesAuRangement, domaineId: string): boolean {
	return dossiersDuDomaine(acces, domaineId).some(
		(d) => capacites(droitEffectif(acces, d.id)).lire
	);
}

/** Un domaine que l'appelant peut ouvrir, dans l'ordre d'affichage du rail. */
export interface DomaineLisible {
	readonly id: string;
	readonly nom: string;
	readonly univers: string;
	readonly couleur: string;
}

/**
 * LES DOMAINES QUE L'APPELANT PEUT OUVRIR — une seule décision pour tous ceux
 * qui les NOMMENT.
 *
 * Le rail était filtré ici, et le tableau de bord de l'accueil lisait la table
 * entière : la MÊME réponse portait donc un rail vide et des cartes de domaines
 * cliquables dont chacune menait en 404. `RG-ACC-01` — la structure de
 * l'instance est une information qu'un compte sans droit n'a pas à lire — et
 * `P-03` — une entrée visible est une entrée qui fonctionne.
 *
 * La fonction est ici, et non recopiée dans chaque chargeur, précisément pour
 * que deux écrans de la même réponse ne PUISSENT plus se contredire.
 */
export async function lireLesDomainesLisibles(
	base: Base,
	acces: AccesAuRangement
): Promise<readonly DomaineLisible[]> {
	const lignes = await base
		.select({
			id: domaines.id,
			nom: domaines.nom,
			univers: univers.nom,
			couleur: domaines.couleur
		})
		.from(domaines)
		.innerJoin(univers, eq(univers.id, domaines.universId))
		.orderBy(univers.ordre, domaines.nom);
	return lignes.filter((d) => domaineLisible(acces, d.id));
}

/* ═══════════════════════════════════════════ Le refus ══════════════════ */

/**
 * LE SEUL POINT DE SORTIE EN REFUS DES QUATRE ROUTES DU RANGEMENT — `ADR-007`,
 * « une réponse unique, produite par le même chemin de code, sert les deux
 * cas ».
 *
 * Son unique entrée est le chemin demandé, et c'est la même garantie que porte
 * `adresseNonResolue()` : la fonction n'a RIEN à quoi se raccrocher pour
 * distinguer « n'existe pas » de « vous n'y avez pas droit ». Il n'existe ni
 * paramètre de cas, ni drapeau d'interdiction, ni exception typée — et le type
 * de retour `never` interdit qu'un appelant reprenne la main pour nuancer.
 *
 * CE QU'IL NE FAIT PAS, ET IL FAUT LE DIRE : il ne rend NI V-04 NI V-26. La
 * résolution unique des adresses non résolues et le rendu de ces deux vues sont
 * assignés à `T-116` (`docs/dag-phase-1.md:119`, collision K-3 : « réunies dans
 * le même lot […] deux lots parallèles y écrivant chacun leur branche est la
 * manière la plus sûre de faire apparaître la branche “interdit” que l'ADR
 * interdit »). Écrire ici un rendu d'erreur serait exactement cette faute. La
 * réponse est donc le 404 du cadre, identique pour les deux cas — corps,
 * en-têtes et code —, et le jour où `T-116` posera la page d'erreur, elle
 * recevra `adresseNonResolue(chemin)` sans que ce module change.
 *
 * `RG-ACC-04` N'EST PAS DÉCLARÉE TENUE PAR CE LOT : l'indiscernabilité de temps
 * de réponse n'est mesurée par rien à ce jour, et `CLAUDE.md` §4 la range parmi
 * les interdictions de conclure.
 */
export function refuserLAdresse(chemin: string): never {
	/* Le chemin n'est pas transmis au cadre : le message d'une erreur voyage
	   jusqu'au client, et `masquerLAdresse()` de la batterie 6 masque le chemin
	   AVANT comparaison précisément parce qu'il est licite de l'afficher — mais
	   rien n'exige de le faire, et le taire réduit d'autant la surface. Il reste
	   dans la signature parce que `T-116` en aura besoin, et parce qu'une
	   signature qui ne prend rien ne dit pas qu'elle ne prend QUE cela. */
	void chemin;
	error(404, MESSAGE_INTROUVABLE);
}

/* ═══════════════════════════════════════════ Univers et domaines ═══════ */

/** Un univers, tel que l'adresse le désigne. */
export interface UniversResolu {
	readonly id: string;
	readonly nom: string;
}

/** Un domaine, tel que l'adresse le désigne. */
export interface DomaineResolu {
	readonly id: string;
	readonly nom: string;
	readonly universId: string;
	readonly universNom: string;
	/** La teinte du domaine — les vues la portent en variable de style. */
	readonly couleur: string;
}

/** L'univers d'un identifiant d'adresse, ou `null`. */
export async function lireUniversParIdentifiant(
	base: Base,
	identifiant: string
): Promise<UniversResolu | null> {
	const [ligne] = await base
		.select({ id: univers.id, nom: univers.nom })
		.from(univers)
		.where(eq(univers.identifiant, identifiant));
	return ligne ?? null;
}

/**
 * Le domaine d'un couple d'identifiants d'adresse, ou `null`.
 *
 * `RG-STR-02` — l'unicité d'un domaine n'est portée QUE par son univers, et le
 * schéma la porte sur le couple. La requête joint donc les deux, et il n'existe
 * dans ce module aucune lecture d'un domaine par son seul identifiant :
 * `ARB-001` a supprimé la forme raccourcie qui l'aurait demandée.
 */
export async function lireDomaineParIdentifiants(
	base: Base,
	identifiantUnivers: string,
	identifiantDomaine: string
): Promise<DomaineResolu | null> {
	const [ligne] = await base
		.select({
			id: domaines.id,
			nom: domaines.nom,
			couleur: domaines.couleur,
			universId: univers.id,
			universNom: univers.nom
		})
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.where(
			and(eq(univers.identifiant, identifiantUnivers), eq(domaines.identifiant, identifiantDomaine))
		);
	return ligne ?? null;
}

/**
 * Les domaines d'un univers, sans considération de droit — la liste que
 * `domaineLisible()` rabat ensuite, domaine par domaine.
 */
export async function lireDomainesDeLUnivers(
	base: Base,
	universId: string
): Promise<readonly { id: string; nom: string }[]> {
	return base
		.select({ id: domaines.id, nom: domaines.nom })
		.from(domaines)
		.where(eq(domaines.universId, universId))
		.orderBy(domaines.nom);
}

/* ═══════════════════════════════════════════ Les notes lisibles ════════ */

/**
 * La ligne brute d'une note, telle que la requête la rend. Le type est nommé
 * pour que la projection ci-dessous soit une fonction PURE, donc éprouvable
 * sans base.
 */
export interface LigneDeNote {
	readonly identifiant: string;
	readonly titre: string;
	readonly corpsReference: unknown;
	readonly corpsOperationnel: unknown;
	readonly typeNom: string;
	readonly typeFicheNom: string | null;
	readonly universNom: string;
	readonly domaineNom: string;
	readonly dossierId: string;
	readonly auteurNom: string;
	readonly visibilite: string;
	readonly statut: string;
	readonly modifieLe: Date;
	readonly verifieLe: Date | null;
	readonly consultations: number;
	readonly signetAdresse: string | null;
	readonly signetAjouteLe: string | null;
}

/** Ce que la projection a besoin de savoir des tables voisines. */
export interface VoisinesDeNote {
	readonly chemins: ReadonlyMap<string, string>;
	readonly etiquettes: ReadonlyMap<string, readonly string[]>;
	readonly piecesJointes: ReadonlyMap<string, number>;
}

/**
 * UNE LIGNE VERS UNE `Note` — la projection, et elle est PURE.
 *
 * Elle porte les mêmes décisions que `lireNotes()` de `T-030`, et il faut dire
 * pourquoi elle existe malgré ce doublon : `lireNotes()` ne prend AUCUN filtre,
 * et `ADR-006` interdit de filtrer sa sortie. Le doublon est donc dans la
 * PROJECTION, jamais dans les CONVERSIONS — `extraitDuCorps`,
 * `dateCourteDInstant`, `dateCourteDIso`, `joursEcoules` et `niveauFraicheur`
 * sont APPELÉES, pas réécrites. C'est ce qui borne le risque, et
 * `rangement.test.ts` le referme : la projection est éprouvée sur les 32 notes
 * du corpus avec les fabriques de la semence, SANS base — donc indépendamment
 * de l'état du dépôt (`P-26`). Si les deux projections divergeaient, ce test
 * rougirait sans attendre un conteneur.
 *
 * LES DEUX LACUNES DÉCLARÉES DE `T-030` SONT REPRISES TELLES QUELLES, et ce
 * module n'en comble aucune : le nombre de pièces jointes est le compte RÉEL de
 * la table, et l'ordre des étiquettes n'est pas représentable faute de colonne
 * de rang — elles sont donc triées en français, ce qui est déterministe et
 * déclaré. Rendre autrement serait la valeur illustrative que `P-02` proscrit.
 */
export function noteDepuisLigne(
	ligne: LigneDeNote,
	voisines: VoisinesDeNote,
	contexte: ContexteDeLecture
): Note {
	/* RG-M06-01 — la fraîcheur se lit sur la dernière vérification, et à défaut
	   sur la dernière modification. La comparaison au seuil, elle, n'est pas
	   écrite ici : `niveauFraicheur()` est l'implémentation unique (P-01). */
	const reference = ligne.verifieLe ?? ligne.modifieLe;
	const rendu: Record<string, unknown> = {
		id: ligne.identifiant,
		titre: ligne.titre,
		extrait: extraitDuCorps(ligne.corpsReference),
		type: ligne.typeNom as TypeDeNote,
		univers: ligne.universNom,
		domaine: ligne.domaineNom,
		dossier: voisines.chemins.get(ligne.dossierId) ?? '',
		auteur: ligne.auteurNom,
		fraicheur: niveauFraicheur(joursEcoules(reference, contexte.maintenant), contexte.seuils),
		/* L'ÂGE DE LA VÉRIFICATION — même correction, même raison qu'à
		   `./lecture.ts` : `fraicheur` et `jours` se calculent sur le MÊME
		   instant de référence, sans quoi le libellé contredit la jauge. */
		jours: joursEcoules(reference, contexte.maintenant),
		revise: ligne.verifieLe === null ? null : dateCourteDInstant(ligne.verifieLe),
		vues: ligne.consultations,
		pj: voisines.piecesJointes.get(ligne.identifiant) ?? 0,
		brouillon: ligne.statut === 'brouillon',
		visibilite: ligne.visibilite === 'publique' ? 'Publique' : 'Interne',
		operationnel: ligne.corpsOperationnel !== null,
		etiquettes: voisines.etiquettes.get(ligne.identifiant) ?? []
	};
	/* Trois clés OPTIONNELLES : omises quand la colonne est nulle, jamais posées
	   à la valeur indéfinie. Une clé présente et vide n'est pas la même valeur
	   qu'une clé absente pour une comparaison profonde — la raison est celle de
	   `T-030`, et c'est cette comparaison qui garde les lots suivants. */
	if (ligne.typeFicheNom !== null) rendu['typeFiche'] = ligne.typeFicheNom as TypeDeFiche;
	if (ligne.signetAdresse !== null) rendu['url'] = ligne.signetAdresse;
	if (ligne.signetAjouteLe !== null) rendu['ajoute'] = dateCourteDIso(ligne.signetAjouteLe);
	return rendu as unknown as Note;
}

/**
 * LES NOTES QUE L'APPELANT PEUT LIRE — le filtre est DANS la requête.
 *
 * `ADR-006`, recopié : « le serveur calcule l'ensemble des dossiers
 * effectivement lisibles par l'appelant […] et l'injecte comme filtre. La
 * requête envoyée au moteur NE PEUT PAS rapporter un document interdit. » Le
 * `where` ci-dessous est cette injection, et l'ensemble vient de
 * `perimetreDeLecture()`.
 *
 * UN PÉRIMÈTRE VIDE N'INTERROGE PAS LA BASE, et ce n'est pas une optimisation :
 * un ensemble vide passé à une clause d'appartenance est une expression que
 * chaque dialecte rend à sa façon, et le doute ne se résout jamais en faveur de
 * l'accès. Rendre la liste vide sans requête est la seule forme dont la
 * correction ne dépende d'aucun dialecte.
 *
 * LE STATUT N'EST PAS FILTRÉ ICI, et c'est un refus de comblement repris de
 * `resolution.ts` : « la visibilité des BROUILLONS pour un utilisateur
 * authentifié n'est réglée par aucune des règles de ce lot […] Le lot qui
 * spécifiera le brouillon ajoutera son filtre ICI, et nulle part ailleurs » —
 * c'est-à-dire dans `noteLisible()`, jamais dans ce module. Les vues du
 * rangement affichent d'ailleurs le brouillon COMME TEL : V-12 en fait une
 * facette, V-11 et V-10 en comptent le nombre.
 */
export async function lireNotesLisibles(
	base: Base,
	perimetre: Perimetre,
	contexte: ContexteDeLecture
): Promise<readonly Note[]> {
	const autorises = perimetre.tout ? null : [...perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];

	const filtre = autorises === null ? undefined : inArray(notes.dossierId, autorises);

	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel,
			typeNom: typesDeNote.nom,
			typeFicheNom: typesDeFiche.nom,
			universNom: univers.nom,
			domaineNom: domaines.nom,
			dossierId: notes.dossierId,
			auteurNom: comptes.nom,
			visibilite: notes.visibilite,
			statut: notes.statut,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			consultations: notes.compteurDeConsultations,
			signetAdresse: notes.signetAdresse,
			signetAjouteLe: notes.signetAjouteLe
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.leftJoin(typesDeFiche, eq(notes.typeDeFicheId, typesDeFiche.id))
		.where(filtre)
		.orderBy(notes.identifiant);

	const voisines: VoisinesDeNote = {
		chemins: await lireCheminsDeDossier(base),
		etiquettes: await lireEtiquettesLisibles(base, autorises),
		piecesJointes: await lirePiecesJointesLisibles(base, autorises)
	};
	return lignes.map((ligne) => noteDepuisLigne(ligne, voisines, contexte));
}

/**
 * Les étiquettes des notes du périmètre, triées en français.
 *
 * LE TRI EST FAIT EN TYPESCRIPT, ET SURTOUT PAS PAR ORDRE SQL : la raison est
 * celle de `lireEtiquettesParNote()` de `T-030`, et elle est mesurée par lui —
 * la collation du serveur classe sur les octets de l'encodage, où le e accentué
 * suit le f, là où la collation française le place avant. Déléguer le tri au
 * serveur ferait dépendre l'ordre affiché d'un réglage d'exploitation. Le
 * comparateur est celui de la semence.
 */
async function lireEtiquettesLisibles(
	base: Base,
	autorises: readonly string[] | null
): Promise<ReadonlyMap<string, readonly string[]>> {
	const lignes = await base
		.select({ noteIdentifiant: notes.identifiant, libelle: etiquettes.libelle })
		.from(etiquettesDeNote)
		.innerJoin(notes, eq(etiquettesDeNote.noteId, notes.id))
		.innerJoin(etiquettes, eq(etiquettesDeNote.etiquetteId, etiquettes.id))
		.where(autorises === null ? undefined : inArray(notes.dossierId, autorises));

	const par = new Map<string, string[]>();
	for (const ligne of lignes) {
		const deja = par.get(ligne.noteIdentifiant);
		if (deja === undefined) par.set(ligne.noteIdentifiant, [ligne.libelle]);
		else deja.push(ligne.libelle);
	}
	for (const libelles of par.values()) libelles.sort((a, b) => a.localeCompare(b, 'fr'));
	return par;
}

/**
 * Le nombre de pièces jointes des notes du périmètre — le compte RÉEL de la
 * table, donc zéro partout tant que la semence n'en écrit aucune. C'est un fait
 * que `T-030` a déclaré et que `pnpm verif:donnees` compte ; le rendre autrement
 * serait la valeur illustrative que `P-02` proscrit.
 */
async function lirePiecesJointesLisibles(
	base: Base,
	autorises: readonly string[] | null
): Promise<ReadonlyMap<string, number>> {
	/* LE FILTRE EST CONSTRUIT PAR LE BÂTISSEUR, PAS ÉCRIT EN SQL, et c'est un
	   défaut mesuré qui l'impose : un tableau interpolé dans un modèle `sql` est
	   développé en TUPLE — `any(($1, $2, …))` —, que PostgreSQL refuse. Le
	   symptôme est un 500 à la première adresse servie, et il n'apparaît qu'avec
	   un périmètre non total : le chemin de l'administrateur, lui, n'a pas de
	   filtre et passait. `inArray()` rend un seul paramètre de tableau, donc une
	   requête que le dialecte accepte. */
	const filtre = autorises === null ? undefined : inArray(notes.dossierId, autorises);

	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			nombre: sql<number>`count(${piecesJointes.id})::int`
		})
		.from(notes)
		.leftJoin(piecesJointes, eq(piecesJointes.noteId, notes.id))
		.where(filtre)
		.groupBy(notes.identifiant);

	return new Map(lignes.map((l) => [l.identifiant, l.nombre]));
}

/**
 * LE MESSAGE DU REFUS, ET POURQUOI IL EST CELUI DU CADRE.
 *
 * `error(404)` sans message fait porter à la charge sérialisée `« Error: 404 »`,
 * là où une adresse qu'AUCUNE route ne dessert porte `« Not Found »` — le défaut
 * de SvelteKit (`respond.js:716`). Un octet, et il distingue « cette adresse
 * existe et t'est refusée » de « cette adresse n'existe pas ». C'est exactement
 * ce que `RG-ACC-04` interdit, et la batterie 6 ne le voit pas : ses couples ne
 * portent que sur des adresses de ressource, dont les deux côtés passent par le
 * MÊME chargeur et rendent donc le même message.
 *
 * Mesuré par `T-040` sur deux familles indépendantes — `/importer` contre une
 * adresse inconnue, `/univers/aaa/bbb/signets` contre `/aaa/bbb/ccc/ddd` — et
 * porté par les trente routes montées.
 *
 * Le produit adopte donc le message du cadre, partout. Aucun refus n'a de texte
 * propre, et il n'y a rien à tenir à jour : le jour où SvelteKit changerait le
 * sien, le contrôle qui l'exige rougirait.
 */
export const MESSAGE_INTROUVABLE = 'Not Found';
