/**
 * LES DEUX BRANCHES DE `/` — la donnée que l'accueil affiche, lue depuis la base
 * et bornée par la résolution des droits.
 *
 * `docs/routes.md:98-99` donne une adresse et deux écrans : `/` rend **V-01
 * Accueil public** sans session et **V-07 Accueil contributeur** avec session.
 * La matrice du §5.5 précise le périmètre de chacun — *« V-01 / V-02 (périmètre
 * public) »* en anonyme, *« V-07 / V-08 (périmètre autorisé) »* en connecté, et
 * la même colonne pour tous les rôles connectés. Ce module est ce périmètre, et
 * rien d'autre : il ne rend aucune vue et ne choisit aucun code HTTP.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * IL N'ÉCRIT AUCUNE RÈGLE DE DROIT — `src/lib/droits/resolution.ts` LES PORTE
 *
 * `T-011` a livré la résolution des droits le 19 août 2026 ; **aucune route ne
 * l'appelait le 20 août au matin**, et c'est la cause nommée des trois fuites
 * mesurées par la batterie 6 (`ECART-047` É-1). Ce module l'appelle, et il
 * n'écrit aucune comparaison de visibilité, de statut ou de droit :
 *
 *   · `noteVisibleEnAnonyme()` décide de la note en régime anonyme ;
 *   · `perimetreDeLecture()` décide des dossiers, par rôle et par droit
 *     explicite, avec la fermeture par défaut de `RG-DRO-02` ;
 *   · `noteLisible()` compose les deux — et il faut la composition, parce qu'un
 *     dossier du périmètre anonyme contient presque toujours des notes internes.
 *
 * LA DEMI-RÈGLE QUE CE MODULE FERME. `seeds/corpus.ts:2452-2454` définit
 * `notesPubliques()` par la seule visibilité ; `resolution.ts:328-330` exige
 * **publique ET publiée**, et `ADR-006` en fait « le filtre entier du régime
 * anonyme, sans exception ni chemin dérogatoire ». Ce module n'emploie donc
 * jamais `notesPubliques()`. La moitié manquante — le statut — n'est exercée
 * par aucune donnée du corpus livré (mesuré en base : 6 notes publique+publiée,
 * **0** publique+brouillon), et une règle qu'aucun cas n'exerce est une règle
 * qu'on espère (`P-5`) : `accueil.test.ts` porte le cas synthétique qui
 * l'exerce, indépendamment de l'état du dépôt (`P-26`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE FILTRE ATTEINT, ET CE QU'IL N'ATTEINT PAS — `ADR-006`, DÉCLARÉ
 *
 * `ADR-006` veut le filtre **dans la requête** et interdit « toute route qui
 * reçoit une liste puis la filtre ». Ce module en tient la première moitié et
 * pas la seconde, et il vaut mieux l'écrire que de le laisser croire :
 *
 *   · TENU — l'autorisation est calculée côté serveur AVANT toute production de
 *     HTML, sur une PROJECTION qui ne porte aucun contenu : `identifiant`,
 *     `dossier_id`, `visibilite`, `statut`. C'est mot pour mot ce que
 *     `NotePourPerimetre` documente — « les champs que la requête porte, pas
 *     ceux que l'affichage lit ». Aucune note hors périmètre ne quitte ce
 *     module, donc aucune n'atteint la vue.
 *   · NON TENU — la lecture du CONTENU passe par `lireNotes()` de `T-030`, qui
 *     n'a pas de paramètre de périmètre : elle rapporte le corpus entier, et la
 *     restriction s'applique après elle. La forme forte demande
 *     `lireNotes(base, contexte, perimetre)` — un `inArray` sur les
 *     identifiants retenus —, et cette signature appartient au module de
 *     `T-030`, hors du périmètre de ce lot. Écart déclaré au rapport.
 *
 * La conséquence est bornée et connue : le coût de lecture ne dépend pas du
 * périmètre, ce qui est le grief de latence d'`ARB-005` — mais `/` n'est pas
 * une adresse de ressource, son existence n'est l'information de personne, et
 * la matrice du §5.5 la déclare servie à tous les personas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * P-02 — CE QUE LA BASE NE PORTE PAS, ET QUI S'AFFICHE POURTANT
 *
 * V-07 attend ses données en propriété pour les NOTES seules : sa signature
 * déclare `vecteur` et `notes`, et elle importe tout le reste de
 * `seeds/corpus.ts` au chargement du module. Les indicateurs de consultation,
 * l'activité récente et la corbeille de révisions ne sont donc **pas
 * branchables sans rouvrir la vue**, ce qu'aucun lot de câblage ne fait.
 * `SANS_CONTREPARTIE_EN_BASE` les nomme et les compte, la vue qui les montre à
 * l'appui ; le rapport du lot les remonte. Rien n'est comblé ici : ni valeur
 * inventée, ni zéro posé à la place d'une donnée absente.
 */
import type { Base } from '../base/acces';
import { dossiers, droitsDeDossier, notes } from '../base/schema';
import {
	type DossierDeLArbre,
	type DroitExplicite,
	type Identite,
	type NotePourPerimetre,
	indexerLesDroits,
	noteLisible,
	perimetreDeLecture
} from '../droits/resolution';
import { type ContexteDeLecture, lireNotes } from './lecture';
import type { Note } from '../../../seeds/corpus';

/* ═══════════════════════════════════════ Les lacunes déclarées ═════════ */

/**
 * Une donnée qu'un écran de l'accueil affiche et que la base ne porte pas.
 *
 * Le type existe pour que la lacune soit **comptée et éprouvable**, jamais
 * seulement racontée : `accueil.test.ts` en fait une assertion, de sorte qu'une
 * lacune refermée par une migration future fasse rougir le test au lieu de
 * laisser un commentaire périmé derrière elle.
 */
export interface DonneeSansContrepartie {
	/** Le nom de la donnée, tel que le jeu de semence l'expose. */
	readonly donnee: string;
	/** L'écran qui la montre. */
	readonly vue: string;
	/** Ce qu'on y lit à l'écran. */
	readonly affichage: string;
	/** Pourquoi la base ne peut pas la rendre. */
	readonly motif: string;
}

/**
 * LES CINQ DONNÉES DE L'ACCUEIL QUE LA BASE NE PORTE PAS — relevées sur le
 * schéma de `src/lib/base/schema.ts`, jamais supposées.
 *
 * Elles ne recoupent pas les six lacunes de `pnpm verif:donnees` : celles-là
 * portent sur les treize formes que la couche de lecture rend, celles-ci sur
 * des tables de mesure du jeu de semence qui n'ont **aucune** table en face.
 * Deux d'entre elles gouvernent une exigence nommée — `RG-M01-02` pour la
 * corbeille de révisions, `RG-M01-01` pour les indicateurs.
 */
export const SANS_CONTREPARTIE_EN_BASE: readonly DonneeSansContrepartie[] = [
	{
		donnee: 'MESURES_7J',
		vue: 'V-07',
		affichage: 'indicateur « consultations sur 7 jours »',
		motif:
			'`notes.compteur_de_consultations` est un cumul de toute la vie de la note, pas une série datée : aucune table ne porte de consultation horodatée.'
	},
	{
		donnee: 'MESURES_7J_PREC',
		vue: 'V-07',
		affichage: 'tendance « vs semaine précédente » du même indicateur',
		motif: 'même absence, décalée d’une semaine : il n’y a pas de série à comparer.'
	},
	{
		donnee: 'ACTIVITE',
		vue: 'V-07',
		affichage: 'zone « activité récente »',
		motif:
			'aucune table d’événements. `versions` et `verifications` portent deux des cinq types du jeu ; les trois autres — publication, révision, import — n’ont aucune trace, et déduire un flux des deux premières inventerait les trois autres.'
	},
	{
		donnee: 'REVISIONS',
		vue: 'V-07',
		affichage: 'indicateur « en attente de révision » et corbeille de révisions (RG-M01-02)',
		motif:
			'aucune table de demande de révision. Le signalement « à réviser » n’est enregistré nulle part.'
	},
	{
		donnee: 'MODIFICATIONS',
		vue: 'V-07',
		affichage: 'la salutation — « dont N mises à jour cette semaine »',
		motif:
			'`notes.modifie_le` porte bien l’instant, mais la vue lit la table du jeu de semence par identifiant de note, sans passer par une propriété : la donnée existe en base et n’a aucun chemin jusqu’à l’écran.'
	}
];

/* ═══════════════════════════════════════ La lecture du périmètre ═══════ */

/** L'arborescence, réduite à ce que `RG-DRO-01` a besoin de remonter. */
async function lireArbreDesDossiers(base: Base): Promise<readonly DossierDeLArbre[]> {
	const lignes = await base.select({ id: dossiers.id, parentId: dossiers.parentId }).from(dossiers);
	return lignes;
}

/**
 * Les droits EXPLICITES, et eux seuls. Le droit effectif n'est pas une colonne
 * — il se calcule par remontée, dans `resolution.ts` (RG-DRO-01).
 */
async function lireDroitsExplicites(base: Base): Promise<readonly DroitExplicite[]> {
	const lignes = await base
		.select({
			dossierId: droitsDeDossier.dossierId,
			compteId: droitsDeDossier.compteId,
			droit: droitsDeDossier.droit
		})
		.from(droitsDeDossier);
	return lignes;
}

/**
 * La projection de note dont la décision d'accès a besoin — et rien de plus.
 * Le titre, le corps et l'auteur n'y sont pas : une décision d'accès n'a pas
 * besoin du contenu, et le charger pour le refuser ensuite est le motif qu'
 * `ADR-006` interdit.
 */
export interface NoteDuPerimetre extends NotePourPerimetre {
	readonly identifiant: string;
}

async function lireNotesDuPerimetre(base: Base): Promise<readonly NoteDuPerimetre[]> {
	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			dossierId: notes.dossierId,
			visibilite: notes.visibilite,
			statut: notes.statut
		})
		.from(notes);
	return lignes;
}

/**
 * LES IDENTIFIANTS DES NOTES QUE CETTE IDENTITÉ PEUT LIRE — LA DÉCISION, SANS
 * BASE.
 *
 * Un index, un périmètre, puis `noteLisible()` note par note. Aucune décision
 * n'est prise ici : les trois appels sont ceux de `resolution.ts`, dans l'ordre
 * que son propre commentaire impose — les dossiers d'abord, la note ensuite, et
 * jamais l'un sans l'autre.
 *
 * LA FONCTION EST PURE, ET C'EST CE QUI LA REND ÉPROUVABLE. `pnpm test:unit` ne
 * dispose d'aucun conteneur ; une décision d'accès qui n'aurait de forme
 * qu'imbriquée dans trois requêtes ne serait mesurée par aucune batterie
 * unitaire, et le cas qui manque au corpus — une note publique en brouillon —
 * n'aurait aucun moyen d'être joué (`P-5`, `P-26`).
 */
export function identifiantsRetenus(
	identite: Identite,
	arbre: readonly DossierDeLArbre[],
	droits: readonly DroitExplicite[],
	projection: readonly NoteDuPerimetre[]
): ReadonlySet<string> {
	const index = indexerLesDroits(arbre, droits);
	const perimetre = perimetreDeLecture(identite, index, projection);

	const retenus = new Set<string>();
	for (const note of projection) {
		if (noteLisible(identite, note, perimetre)) retenus.add(note.identifiant);
	}
	return retenus;
}

/** Les trois projections lues, puis la décision. */
export async function identifiantsLisibles(
	base: Base,
	identite: Identite
): Promise<ReadonlySet<string>> {
	const [arbre, droits, projection] = await Promise.all([
		lireArbreDesDossiers(base),
		lireDroitsExplicites(base),
		lireNotesDuPerimetre(base)
	]);
	return identifiantsRetenus(identite, arbre, droits, projection);
}

/* ═══════════════════════════════════════ Les données de l'accueil ══════ */

/**
 * Ce que le chargeur de `/` rend à la page. `session` dit quel écran rendre —
 * c'est la seule information que `+page.svelte` a besoin de dériver, et elle ne
 * porte aucun détail de l'identité : ni rôle, ni identifiant de compte
 * (`ADR-006` interdit « toute exposition des droits au navigateur »).
 */
export interface DonneesDAccueil {
	/** `false` en anonyme — V-01 ; `true` avec une session — V-07. */
	readonly session: boolean;
	/**
	 * Les notes que l'identité peut lire, dans la forme que les deux vues
	 * déclarent en propriété (`readonly Note[]`, `seeds/corpus.ts`).
	 */
	readonly notes: readonly Note[];
}

/**
 * LE CHARGEUR DE `/`, côté donnée.
 *
 * En anonyme, `notes` ne contient que des notes publiques ET publiées : c'est
 * `noteVisibleEnAnonyme()` qui l'a décidé, à travers `noteLisible()`. V-01
 * réapplique son propre `notesPubliques()` au point d'entrée de la vue
 * (`RG-M17-01`) ; sur une liste déjà bornée, ce second filtre ne retire rien —
 * il reste la garde de la vue, et ce module reste la garde du produit.
 *
 * En session, `notes` est le périmètre autorisé de l'identité, fermé par défaut
 * (`RG-DRO-02`). **Le corpus livré ne porte aucune ligne de
 * `droits_de_dossier`** — mesuré en base : zéro. Aucun des cinq comptes semés
 * n'a donc de droit explicite : seule `sophie.nguyen`, administratrice, lit le
 * corpus, et par `RG-DRO-03` seulement ; `karim.belhadj`, `lea.marchand` et
 * `marc.ferreira` comptent zéro note, et `pierre.dubois` (`actif: false`)
 * n'ouvre aucune session (`RG-M14-08`). Ce zéro n'est pas inventé : c'est le
 * nombre exact de ce que ces comptes peuvent lire. La lacune de semence qui le
 * produit est remontée au rapport du lot plutôt que comblée ici.
 */
export async function lireAccueil(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<DonneesDAccueil> {
	const retenus = await identifiantsLisibles(base, identite);

	/* Aucun identifiant retenu : rien à lire, et surtout aucune requête de
	   contenu à émettre. C'est le seul endroit où la forme faible d'`ADR-006`
	   coïncide avec la forte — quand le périmètre est vide, le contenu n'est pas
	   lu du tout. */
	if (retenus.size === 0) return { session: identite.type === 'authentifie', notes: [] };

	const corpus = await lireNotes(base, contexte);
	return {
		session: identite.type === 'authentifie',
		notes: corpus.filter((n) => retenus.has(n.id))
	};
}
