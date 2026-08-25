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
 * par aucune donnée du corpus livré, et une règle qu'aucun cas n'exerce est une
 * règle qu'on espère (`P-5`) : `accueil.test.ts` porte le cas synthétique qui
 * l'exerce, indépendamment de l'état du dépôt (`P-26`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE PÉRIMÈTRE EST DANS LA REQUÊTE — `ADR-006`, FORME FORTE, DEPUIS CE LOT
 *
 * `ADR-006` veut le filtre **dans la requête** et interdit « toute route qui
 * reçoit une liste puis la filtre ». La première rédaction de ce module tenait
 * la première moitié et pas la seconde : l'autorisation était calculée sur une
 * projection sans contenu, mais `lireNotes()` rapportait ensuite le corpus
 * ENTIER, et la restriction s'appliquait après elle. `T-030` a depuis donné à
 * `lireNotes()` son troisième paramètre — `identifiants`, posé en `inArray`
 * DANS la clause `where`. Ce module le passe : aucune ligne hors périmètre ne
 * quitte la base.
 *
 * ET TOUTES LES AUTRES LECTURES DE CE MODULE SONT BORNÉES DE LA MÊME FAÇON.
 * Les consultations, les anciennetés de modification, les demandes de révision
 * et les quatre familles d'évènements d'activité portent la même clause : un
 * compteur, un commentaire de révision ou un titre de note lu dans un flux
 * d'activité renseignent sur une note tout autant qu'elle-même. Ce qui sort
 * d'ici est ce que l'identité a le droit de lire, et rien de plus.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * P-01 — LA FRAÎCHEUR N'EST PAS RECALCULÉE ICI, NI NULLE PART AILLEURS
 *
 * `src/lib/fraicheur.ts` est l'implémentation unique. Le niveau de chaque note
 * arrive par `lireNotes()`, qui appelle `niveauFraicheur()` avec les seuils lus
 * en base ; la répartition par domaine de V-07 COMPTE ces niveaux, elle ne les
 * dérive pas ; le témoin d'une note passe par `temoinFraicheur()`. Ce module
 * n'écrit aucune comparaison de date à un seuil, et n'a aucune raison d'en
 * écrire une.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * P-02 — CE QUE LA BASE PORTE, ET CE QU'ELLE NE PORTE PAS
 *
 * V-07 attend ses sources en PROPRIÉTÉS OPTIONNELLES depuis `T-041`, et le
 * défaut de chacune est la constante du jeu de semence. Tant qu'aucun chargeur
 * ne les passait, l'écran affichait donc le jeu : « En attente de révision = 3 »
 * pour un compte qui n'a rien à réviser, « Bonjour Karim. » pour Sophie Nguyen,
 * et une activité récente entièrement figée. Ce module les passe toutes, sauf
 * celles que la base ne porte pas — `SANS_CONTREPARTIE_EN_BASE` les nomme, les
 * compte et dit pourquoi. Rien n'est comblé : ni valeur inventée, ni zéro posé
 * à la place d'une donnée absente.
 */
import { and, count, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { Base } from '../base/acces';
import {
	comptes,
	consultations,
	domaines,
	dossiers,
	droitsDeDossier,
	notes,
	verifications,
	versions
} from '../base/schema';
import {
	type DossierDeLArbre,
	type DroitExplicite,
	type Identite,
	type NotePourPerimetre,
	indexerLesDroits,
	noteLisible,
	perimetreDeLecture
} from '../droits/resolution';
import {
	ROLE_DEPUIS_ENUM,
	type ContexteDeLecture,
	dateCourteDInstant,
	joursEcoules,
	lireNotes,
	lireUnivers
} from './lecture';
import { lireLesDomainesLisibles, ouvrirLAcces } from './rangement';
import type {
	DemandeDeRevision,
	Domaine,
	EvenementDActivite,
	IdentifiantNote,
	Note,
	TypeDEvenement,
	Univers,
	UtilisateurCourant
} from '../../../seeds/corpus';

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
 * LA LISTE A ENTIÈREMENT CHANGÉ D'IDENTITÉ À CE LOT, et il faut le dire plutôt
 * que de laisser croire à une stagnation. Les cinq entrées précédentes —
 * `MESURES_7J`, `MESURES_7J_PREC`, `ACTIVITE`, `REVISIONS`, `MODIFICATIONS` —
 * sont **refermées** : `consultations` (migration `006`) porte le journal daté
 * que les deux premières réclamaient, `notes.revision_*` porte la demande de
 * révision et son commentaire, `notes.modifie_le` porte l'ancienneté, et trois
 * des cinq types d'évènement ont désormais une trace réelle. Ce qui reste est
 * ce qui n'en a toujours aucune. Le compte est resté à cinq par coïncidence, et
 * non par ajustement : chaque entrée ci-dessous a été relevée sur le schéma.
 */
export const SANS_CONTREPARTIE_EN_BASE: readonly DonneeSansContrepartie[] = [
	{
		donnee: 'INSTANCE.version',
		vue: 'V-07',
		affichage: 'la version, au pied du tableau de bord et au pied du rail — « Codicillus 1.0.0 »',
		motif:
			'aucune colonne, et aucune des sept clés de `parametres` (`CLES_DE_PARAMETRE`) : la version du produit n’est pas une donnée d’instance en base.'
	},
	{
		donnee: 'INSTANCE.synchro',
		vue: 'V-07',
		affichage: 'le pied — « Dernière synchronisation il y a 6 minutes »',
		motif:
			'aucune table ne porte l’instant de la dernière synchronisation de l’index, et le gel écrit un libellé RELATIF sans donner la règle qui le fabrique.'
	},
	{
		donnee: 'ACTIVITE (import)',
		vue: 'V-07',
		affichage: 'l’évènement « a terminé un import » et son détail, dans l’activité récente',
		motif:
			'aucune table d’imports terminés. Le type existe au jeu de semence, aucune ligne ne peut le produire — l’évènement est donc absent, jamais simulé.'
	},
	{
		donnee: 'ACTIVITE (publication différée)',
		vue: 'V-07',
		affichage: 'l’évènement « a publié » pour une note passée de brouillon à publiée',
		motif:
			'`notes.statut` porte l’état, jamais la TRANSITION : rien n’enregistre quand ni par qui une note a été publiée. Seule la création d’une note déjà publiée laisse une trace datée (`cree_le`), et c’est la seule publication que ce module rapporte.'
	},
	{
		donnee: 'ACTIVITE (vérification anonymisée)',
		vue: 'V-07',
		affichage: 'l’évènement « a vérifié » d’une vérification dont l’auteur a été anonymisé',
		motif:
			'`verifications.compte_id` est `SET NULL` à la suppression du compte, et `RG-M15-02` en fait une anonymisation voulue. La phrase du flux exige un sujet ; aucune source ne dit ce qu’elle devient sans lui. L’évènement est écarté plutôt que doté d’un auteur inventé.'
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

/* ═══════════════════════════════════════ Le compte connecté ════════════ */

/**
 * LE PRÉNOM EST DÉRIVÉ DU NOM, ET LA BASE N'EN PORTE AUCUN.
 *
 * `comptes` porte `nom` — « Karim Belhadj » — et rien d'autre : ni prénom, ni
 * initiales. `UtilisateurCourant` réclame les trois, parce que la salutation dit
 * « Bonjour Karim. » et que l'avatar de la barre porte « KB ».
 *
 * La dérivation n'est PAS un comblement : elle ne fabrique aucune information,
 * elle découpe celle qui existe. Éprouvée sur les cinq comptes semés — Karim
 * Belhadj → `Karim` / `KB`, Léa Marchand → `Léa` / `LM` — et sur `MOI` du jeu
 * de semence, qu'elle reproduit à l'octet.
 */
export function prenomDuNom(nom: string): string {
	return nom.trim().split(/\s+/)[0] ?? nom;
}

/** Deux initiales au plus, portées par l'avatar (`BarreSuperieure.svelte:81`). */
export function initialesDuNom(nom: string): string {
	return nom
		.trim()
		.split(/\s+/)
		.filter((mot) => mot.length > 0)
		.map((mot) => [...mot][0]?.toLocaleUpperCase('fr') ?? '')
		.join('')
		.slice(0, 2);
}

/**
 * L'utilisateur connecté, tel que la salutation et la barre supérieure le
 * nomment.
 *
 * LE RATTACHEMENT VIDE EST RENDU VIDE, ET LA VUE SAIT LE DIRE.
 * `comptes.domaine_id` est nullable PAR EXIGENCE — `RG-M14-04` (CDC:1149) veut
 * qu'un compte survive à la suppression de son domaine, rattachement vidé ; et
 * le compte d'amorçage d'une instance neuve n'en a jamais eu. Le nom rendu est
 * alors la chaîne vide, ce qui est exact. V-07 ne la coule PAS dans « Votre
 * périmètre, …, compte » : sans rattachement, sa salutation porte sur le corpus
 * entier (« Votre base compte … »).
 */
export async function lireCompteCourant(
	base: Base,
	compteId: string
): Promise<UtilisateurCourant | undefined> {
	const lignes = await base
		.select({ nom: comptes.nom, role: comptes.role, domaineNom: domaines.nom })
		.from(comptes)
		.leftJoin(domaines, eq(comptes.domaineId, domaines.id))
		.where(eq(comptes.id, compteId));

	const ligne = lignes[0];
	if (ligne === undefined) return undefined;

	const role = ROLE_DEPUIS_ENUM[ligne.role];
	if (role === undefined) throw new Error(`rôle inconnu en base : ${ligne.role}`);

	/* `NomDAuteur`, `NomDeDomaine` et `RoleDeCompte` sont des unions FERMÉES au
	   jeu de semence — trois noms d'auteur, quatre noms de domaine. Le produit,
	   lui, admet n'importe quel compte et n'importe quel domaine : la conversion
	   est la même que celle de `lireNotes()`, et pour la même raison. */
	return {
		prenom: prenomDuNom(ligne.nom),
		nom: ligne.nom,
		initiales: initialesDuNom(ligne.nom),
		domaine: ligne.domaineNom ?? '',
		role
	} as unknown as UtilisateurCourant;
}

/* ═══════════════════════════════════════ Les mesures datées ════════════ */

const MILLISECONDES_PAR_HEURE = 3_600_000;
const MILLISECONDES_PAR_JOUR = 86_400_000;

/**
 * LA FENÊTRE DE L'ACCUEIL EST DE SEPT JOURS, ET C'EST LE GEL QUI LE DIT.
 *
 * L'indicateur s'intitule « Consultations · 7 jours » et sa tendance se compare
 * à « la semaine précédente » (`BRIEF-VUES.md` §V-07, tableau des indicateurs) ;
 * le panneau d'activité porte en propre l'étiquette « 7 derniers jours »
 * (`mockups/V-07-accueil-contributeur.html:1289`). Aucune de ces trois durées
 * n'est choisie ici : elles sont lues.
 */
const JOURS_DE_LA_FENETRE = 7;

/** L'instant qui ouvre une fenêtre de N jours s'achevant à `maintenant`. */
function debutDeFenetre(maintenant: Date, jours: number): Date {
	return new Date(maintenant.getTime() - jours * MILLISECONDES_PAR_JOUR);
}

/**
 * Les consultations d'une fenêtre, par note — `RG-M04-09`, journal de la
 * migration `006`.
 *
 * CE N'EST PAS `notes.compteur_de_consultations`, et la différence est le tout
 * de l'indicateur : le compteur est un cumul de toute la vie de la note, la
 * table est une SÉRIE DATÉE. Un cumul ne se compare pas à une semaine
 * précédente ; la tendance de V-07 n'existe que grâce à la seconde.
 */
async function compterLesConsultations(
	base: Base,
	identifiants: readonly string[],
	depuis: Date,
	jusqua: Date
): Promise<Partial<Record<IdentifiantNote, number>>> {
	if (identifiants.length === 0) return {};
	const lignes = await base
		.select({ identifiant: notes.identifiant, combien: count() })
		.from(consultations)
		.innerJoin(notes, eq(consultations.noteId, notes.id))
		.where(
			and(
				inArray(notes.identifiant, [...identifiants]),
				gte(consultations.le, depuis),
				lt(consultations.le, jusqua)
			)
		)
		.groupBy(notes.identifiant);

	return Object.fromEntries(lignes.map((l) => [l.identifiant, l.combien])) as Partial<
		Record<IdentifiantNote, number>
	>;
}

/**
 * L'ancienneté de modification de chaque note, en jours — `notes.modifie_le`.
 *
 * La salutation en tire son chiffre marquant : « dont N mises à jour cette
 * semaine ». Le comptage des jours passe par `joursEcoules()` de la couche de
 * lecture, la même fonction qui donne son ancienneté à chaque note ; il n'y a
 * pas deux façons de compter un jour dans ce produit.
 */
async function lireLesAnciennetesDeModification(
	base: Base,
	identifiants: readonly string[],
	maintenant: Date
): Promise<Partial<Record<IdentifiantNote, number>>> {
	if (identifiants.length === 0) return {};
	const lignes = await base
		.select({ identifiant: notes.identifiant, modifieLe: notes.modifieLe })
		.from(notes)
		.where(inArray(notes.identifiant, [...identifiants]));

	return Object.fromEntries(
		lignes.map((l) => [l.identifiant, joursEcoules(l.modifieLe, maintenant)])
	) as Partial<Record<IdentifiantNote, number>>;
}

/* ═══════════════════════════════════════ La corbeille de révisions ═════ */

/**
 * LES DEMANDES DE RÉVISION OUVERTES — `RG-M01-02`, source unique.
 *
 * L'indicateur « En attente de révision » et la corbeille lisent LA MÊME LISTE :
 * V-07 la reçoit une fois, sous `revisions`, et son `revisionsCourantes` est le
 * seul endroit où elle est consommée. Deux comptages concurrents finiraient par
 * se contredire à l'écran, et le gel l'écrit en toutes lettres (`V-07:3479`).
 *
 * LA JOINTURE INTERNE SUR `comptes` PORTE UNE RÈGLE, pas une commodité :
 * `revision_par_id` est `SET NULL` à la suppression du demandeur, et la
 * corbeille affiche « Signalée par X ». Une demande dont le demandeur a disparu
 * n'a pas de forme d'affichage définie ; elle est écartée plutôt que dotée d'un
 * nom inventé. La contrainte `notes_revision_coherente` garantit par ailleurs
 * que `revision_le` accompagne toujours `revision_demandee`.
 */
async function lireLesDemandesDeRevision(
	base: Base,
	identifiants: readonly string[],
	maintenant: Date
): Promise<readonly DemandeDeRevision[]> {
	if (identifiants.length === 0) return [];
	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			par: comptes.nom,
			le: notes.revisionLe,
			commentaire: notes.revisionCommentaire
		})
		.from(notes)
		.innerJoin(comptes, eq(notes.revisionParId, comptes.id))
		.where(and(eq(notes.revisionDemandee, true), inArray(notes.identifiant, [...identifiants])))
		.orderBy(desc(notes.revisionLe));

	return lignes.flatMap((l) =>
		l.le === null
			? []
			: [
					{
						id: l.identifiant,
						par: l.par,
						le: dateCourteDInstant(l.le),
						jours: joursEcoules(l.le, maintenant),
						/* La contrainte de base autorise une demande SANS commentaire ; le
						   gel n'en montre aucune. La chaîne vide dit l'absence sans rien
						   fabriquer — remonté au rapport du lot. */
						commentaire: l.commentaire ?? ''
					} as unknown as DemandeDeRevision
				]
	);
}

/* ═══════════════════════════════════════ L'activité récente ════════════ */

/** Un évènement avant mise en forme : l'instant y est encore un instant. */
interface Trace {
	readonly type: TypeDEvenement;
	readonly qui: string;
	readonly cible: string;
	readonly instant: Date;
}

/**
 * LE FLUX D'ACTIVITÉ — QUATRE TRACES RÉELLES, ET AUCUNE DÉDUCTION.
 *
 * `BRIEF-VUES.md` §V-07 attend « vérifications, publications, éditions, imports
 * terminés ». Chacun de ces types n'est rapporté ici que s'il existe une LIGNE
 * DATÉE qui l'atteste, et la liste ci-dessous dit laquelle :
 *
 *   `verification`  `verifications` — la note, le compte, l'instant (M06.2).
 *   `edition`       `versions` — « une version capture titre et les deux corps »
 *                   (`RG-M07-02`), avec son auteur et son instant.
 *   `publication`   `notes.cree_le` d'une note dont `statut = 'publiee'` : la
 *                   création d'une note déjà publiée EST sa publication, et
 *                   c'est la seule publication qui laisse une trace datée.
 *   `revision`      `notes.revision_le` — le signalement, son auteur, son
 *                   instant. La même source que la corbeille, jamais une autre.
 *   `import`        AUCUNE. Le type n'est pas produit — voir
 *                   `SANS_CONTREPARTIE_EN_BASE`.
 *
 * CE QUI N'EST PAS FAIT, ET QUI EST DÉCLARÉ. `RG-M01-03` demande de dédoublonner
 * « un même objet publié puis édité dans une fenêtre courte ». Le gel ne le fait
 * pas — `rendreActivite` rend `window.ACTIVITE` tel quel — et aucune règle ne
 * dit ce qu'est une « fenêtre courte ». La déduplication n'est donc pas écrite,
 * et ce lot NE DÉCLARE PAS `RG-M01-03` tenue.
 *
 * `versions` NE PORTE AUCUNE LIGNE À CE JOUR — mesuré : zéro. La branche
 * `edition` est donc écrite et non exercée (`P-5`) : elle prendra effet au
 * premier lot qui écrira une version, sans qu'on ait à revenir ici.
 */
async function lireLesTraces(
	base: Base,
	identifiants: readonly string[],
	depuis: Date
): Promise<readonly Trace[]> {
	if (identifiants.length === 0) return [];
	const perimetre = inArray(notes.identifiant, [...identifiants]);

	const [verifiees, editees, publiees, signalees] = await Promise.all([
		base
			.select({ cible: notes.identifiant, qui: comptes.nom, instant: verifications.le })
			.from(verifications)
			.innerJoin(notes, eq(verifications.noteId, notes.id))
			.innerJoin(comptes, eq(verifications.compteId, comptes.id))
			.where(and(perimetre, gte(verifications.le, depuis))),
		base
			.select({ cible: notes.identifiant, qui: comptes.nom, instant: versions.le })
			.from(versions)
			.innerJoin(notes, eq(versions.noteId, notes.id))
			.innerJoin(comptes, eq(versions.auteurId, comptes.id))
			.where(and(perimetre, gte(versions.le, depuis))),
		base
			.select({ cible: notes.identifiant, qui: comptes.nom, instant: notes.creeLe })
			.from(notes)
			.innerJoin(comptes, eq(notes.auteurId, comptes.id))
			.where(and(perimetre, eq(notes.statut, 'publiee'), gte(notes.creeLe, depuis))),
		base
			.select({ cible: notes.identifiant, qui: comptes.nom, instant: notes.revisionLe })
			.from(notes)
			.innerJoin(comptes, eq(notes.revisionParId, comptes.id))
			.where(and(perimetre, eq(notes.revisionDemandee, true), gte(notes.revisionLe, depuis)))
	]);

	return [
		...verifiees.map((l) => ({ type: 'verification' as const, ...l })),
		...editees.map((l) => ({ type: 'edition' as const, ...l })),
		...publiees.map((l) => ({ type: 'publication' as const, ...l })),
		...signalees.flatMap((l) =>
			l.instant === null ? [] : [{ type: 'revision' as const, ...l, instant: l.instant }]
		)
	];
}

/**
 * Le flux, chronologique et décroissant — le plus récent d'abord, comme le gel
 * l'ordonne (`ACTIVITE` du jeu va de 3 h à 151 h).
 *
 * L'ANCIENNETÉ EST EN HEURES ENTIÈRES, parce que `EvenementDActivite.heures`
 * l'est, et que `relatif()` de la vue en tire « à l'instant », « il y a N h »
 * puis « hier » / « il y a N j ». Le plancher est le bon arrondi : une note
 * créée il y a quarante minutes vaut zéro heure, donc « à l'instant ».
 */
export async function lireLActivite(
	base: Base,
	identifiants: readonly string[],
	maintenant: Date
): Promise<readonly EvenementDActivite[]> {
	const traces = await lireLesTraces(
		base,
		identifiants,
		debutDeFenetre(maintenant, JOURS_DE_LA_FENETRE)
	);

	return [...traces]
		.sort((a, b) => b.instant.getTime() - a.instant.getTime())
		.map(
			(t) =>
				({
					type: t.type,
					qui: t.qui,
					cible: t.cible,
					heures: Math.max(
						0,
						Math.floor((maintenant.getTime() - t.instant.getTime()) / MILLISECONDES_PAR_HEURE)
					)
				}) as unknown as EvenementDActivite
		);
}

/* ═══════════════════════════════════════ Les données de l'accueil ══════ */

/**
 * Ce que le chargeur de `/` rend à la page. `session` dit quel écran rendre —
 * c'est la seule information que `+page.svelte` a besoin de dériver, et elle ne
 * porte aucun détail de l'identité : ni rôle de décision, ni identifiant de
 * compte (`ADR-006` interdit « toute exposition des droits au navigateur »).
 *
 * LES NEUF SOURCES DE V-07 SONT OPTIONNELLES ICI PARCE QU'ELLES LE SONT LÀ-BAS,
 * et parce qu'elles n'ont aucun sens en anonyme : V-01 ne les lit pas, et les
 * calculer pour un visiteur qui ne les verra jamais serait payer le tableau de
 * bord interne à chaque requête publique.
 *
 * `role` DE `compte` N'EST PAS UNE EXPOSITION DE DROIT au sens d'`ADR-006` :
 * c'est le libellé que la barre supérieure AFFICHE sous le nom de l'utilisateur
 * (« Référent · Infrastructure »), déjà écrit à l'écran. Aucune décision
 * d'interface n'en est tirée côté navigateur ; la capacité d'écriture, elle,
 * arrive par le booléen `ecriture` du chargeur de gabarit, calculé en base.
 */
export interface DonneesDAccueil {
	/** `false` en anonyme — V-01 ; `true` avec une session — V-07. */
	readonly session: boolean;
	/**
	 * Les notes que l'identité peut lire, dans la forme que les deux vues
	 * déclarent en propriété (`readonly Note[]`, `seeds/corpus.ts`).
	 */
	readonly notes: readonly Note[];
	/** Le compte connecté. Absent en anonyme. */
	readonly compte?: UtilisateurCourant;
	/** Les univers, dans l'ordre que l'administrateur leur a donné (RG-STR-01). */
	readonly univers?: readonly Univers[];
	/** Les domaines, groupés par univers. */
	readonly domaines?: readonly Domaine[];
	/** Consultations des sept derniers jours, par note. */
	readonly mesures7j?: Partial<Record<IdentifiantNote, number>>;
	/** Consultations de la semaine précédente, par note. */
	readonly mesures7jPrec?: Partial<Record<IdentifiantNote, number>>;
	/** Ancienneté de modification, en jours, par note. */
	readonly modifications?: Partial<Record<IdentifiantNote, number>>;
	/** L'activité des sept derniers jours, du plus récent au plus ancien. */
	readonly activite?: readonly EvenementDActivite[];
	/** Les demandes de révision ouvertes du périmètre (RG-M01-02). */
	readonly revisions?: readonly DemandeDeRevision[];
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
 * (`RG-DRO-02`), et les huit autres sources sont bornées au MÊME ensemble
 * d'identifiants. Un compte sans droit explicite et sans rôle d'administrateur
 * lit zéro note : ce zéro n'est pas inventé, c'est le nombre exact de ce qu'il
 * peut lire, et tout le tableau de bord vaut alors zéro par la même vérité.
 */
export async function lireAccueil(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<DonneesDAccueil> {
	const retenus = await identifiantsLisibles(base, identite);
	const identifiants = [...retenus];

	/* L'ANONYME S'ARRÊTE ICI. V-01 ne lit que `notes` ; les huit autres sources
	   sont celles du tableau de bord interne, et les calculer pour un visiteur
	   qui ne les verra jamais serait payer huit requêtes par requête publique. */
	if (identite.type !== 'authentifie') {
		return { session: false, notes: await lireNotes(base, contexte, identifiants) };
	}

	const { maintenant } = contexte;
	const semaine = debutDeFenetre(maintenant, JOURS_DE_LA_FENETRE);
	const semainePrecedente = debutDeFenetre(maintenant, 2 * JOURS_DE_LA_FENETRE);

	const [
		notesLisibles,
		compte,
		tousLesUnivers,
		domainesLisibles,
		mesures7j,
		mesures7jPrec,
		modifications,
		activite,
		revisions
	] = await Promise.all([
		lireNotes(base, contexte, identifiants),
		lireCompteCourant(base, identite.compteId),
		lireUnivers(base),
		/*
		 * LE TABLEAU DE BORD NE NOMME QUE LES DOMAINES QUE L'APPELANT PEUT OUVRIR.
		 *
		 * Il lisait la table ENTIÈRE, sans aucun accès ni filtre, pendant que le
		 * gabarit racine servait le rail filtré : la MÊME réponse portait donc un
		 * rail vide et des cartes « Infrastructure », « Projets » — cliquables, et
		 * chacune vers un 404. `RG-ACC-01`, `P-03`, et c'est le défaut que le rail
		 * a refermé de son côté sans que l'accueil en reçoive la nouvelle.
		 *
		 * LA MÊME FONCTION QUE LE RAIL, pas une seconde écriture du même filtre :
		 * `lireLesDomainesLisibles()` est appelée par les deux, et deux écrans de
		 * la même réponse ne peuvent plus diverger.
		 */
		ouvrirLAcces(base, identite, maintenant).then((acces) => lireLesDomainesLisibles(base, acces)),
		compterLesConsultations(base, identifiants, semaine, maintenant),
		compterLesConsultations(base, identifiants, semainePrecedente, semaine),
		lireLesAnciennetesDeModification(base, identifiants, maintenant),
		lireLActivite(base, identifiants, maintenant),
		lireLesDemandesDeRevision(base, identifiants, maintenant)
	]);

	/* Un univers ne se montre que par les domaines lisibles qu'il porte — le
	   geste du rail, à la lettre. Sans domaine lisible, il n'est pas nommé. */
	const porteurs = new Set(domainesLisibles.map((d) => d.univers));
	const rendu: DonneesDAccueil = {
		session: true,
		notes: notesLisibles,
		univers: tousLesUnivers.filter((u) => porteurs.has(u.nom)),
		domaines: domainesLisibles.map(
			(d) => ({ nom: d.nom, univers: d.univers, couleur: d.couleur }) as Domaine
		),
		mesures7j,
		mesures7jPrec,
		modifications,
		activite,
		revisions
	};

	/* Le compte introuvable ne se remplace pas par celui du jeu de semence : la
	   clé est OMISE, et la vue rend son défaut. Le cas n'existe que si la session
	   survit à la suppression de son compte. */
	if (compte === undefined) return rendu;

	/*
	 * LA SALUTATION NE NOMME PAS NON PLUS UN DOMAINE QUE L'APPELANT NE PEUT PAS
	 * LIRE. Elle dit « Votre périmètre, {domaine}, compte N notes » sur le seul
	 * RATTACHEMENT du compte — qui n'est pas un titre d'accès (`RG-DRO-02`) —, et
	 * elle le nommait donc dans la même réponse qui ne portait aucun domaine.
	 *
	 * LA CHAÎNE VIDE EST UN CAS QUE `V-07` TRAITE DÉJÀ, et qu'elle documente :
	 * c'est celui de tout compte d'amorçage, dont le rattachement est nul. La
	 * salutation bascule alors sur « Votre base compte … », sans nommer personne.
	 */
	const lisible = domainesLisibles.some((d) => d.nom === compte.domaine);
	const ajuste = lisible ? compte : { ...compte, domaine: '' as typeof compte.domaine };
	return { ...rendu, compte: ajuste };
}
