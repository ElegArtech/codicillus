/**
 * Les deux branches de `/` — la donnée que l'accueil affiche, lue depuis la base et bornée
 * par la résolution des droits. `/` rend V-01 sans session (périmètre public) et V-07 avec
 * session (périmètre autorisé) ; ce module est ce périmètre, et rien d'autre.
 *
 * IL N'ÉCRIT AUCUNE RÈGLE DE DROIT : `noteVisibleEnAnonyme()` décide de la note en régime
 * anonyme, `perimetreDeLecture()` des dossiers, et `noteLisible()` compose les deux — la
 * composition est nécessaire, un dossier du périmètre anonyme contenant presque toujours
 * des notes internes. `notesPubliques()` du jeu de semence n'est JAMAIS employée : elle ne
 * filtre que la visibilité, quand `ADR-006` exige « publique ET publiée ».
 *
 * LE PÉRIMÈTRE EST DANS LA REQUÊTE : `lireNotes()` reçoit les identifiants en `inArray`
 * DANS la clause `where`, et toutes les autres lectures portent la même clause — un
 * compteur ou un titre lu dans un flux d'activité renseignent sur une note tout autant
 * qu'elle-même. Rien n'est comblé : les sources que la base ne porte pas sont nommées par
 * `SANS_CONTREPARTIE_EN_BASE`.
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

/**
 * Une donnée qu'un écran de l'accueil affiche et que la base ne porte pas. Le type existe
 * pour que la lacune soit COMPTÉE et ÉPROUVABLE : `accueil.test.ts` en fait une assertion,
 * de sorte qu'une lacune refermée fasse rougir le test.
 */
export interface DonneeSansContrepartie {
	readonly donnee: string;
	readonly vue: string;
	readonly affichage: string;
	readonly motif: string;
}

/**
 * Les données de l'accueil que la base ne porte pas — relevées sur le schéma,
 * jamais supposées. Chaque entrée a été vérifiée table par table.
 */
export const SANS_CONTREPARTIE_EN_BASE: readonly DonneeSansContrepartie[] = [
	{
		donnee: 'INSTANCE.version',
		vue: 'V-07',
		affichage: 'la version, au pied du tableau de bord et au pied du rail — « Codicillus 1.0.0 »',
		motif:
			'aucune colonne, et aucune des huit clés de `parametres` (`CLES_DE_PARAMETRE`) : la version du produit n’est pas une donnée d’instance en base.'
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
 * La projection de note dont la décision d'accès a besoin — et rien de plus. Le
 * titre, le corps et l'auteur n'y sont pas : charger le contenu pour le refuser
 * ensuite est le motif qu'`ADR-006` interdit.
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
 * Les identifiants des notes que cette identité peut lire — la décision, SANS BASE. Un
 * index, un périmètre, puis `noteLisible()` note par note : les trois appels sont ceux de
 * `resolution.ts`, dans l'ordre que son commentaire impose. LA FONCTION EST PURE, ET C'EST
 * CE QUI LA REND ÉPROUVABLE : `pnpm test:unit` ne dispose d'aucun conteneur, et le cas qui
 * manque au corpus — une note publique en brouillon — n'aurait aucun moyen d'être joué.
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

/**
 * Le prénom est dérivé du nom, et la base n'en porte aucun : `comptes` porte `nom` et rien
 * d'autre, quand `UtilisateurCourant` réclame prénom et initiales. La dérivation ne
 * fabrique aucune information, elle découpe celle qui existe.
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
 * L'utilisateur connecté, tel que la salutation et la barre supérieure le nomment. LE
 * RATTACHEMENT VIDE EST RENDU VIDE, ET LA VUE SAIT LE DIRE : `comptes.domaine_id` est
 * nullable PAR EXIGENCE (`RG-M14-04`), et le compte d'amorçage d'une instance neuve n'en a
 * jamais eu. V-07 bascule alors sur « Votre base compte … ».
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

	/* Les unions du jeu de semence sont FERMÉES — trois noms d'auteur, quatre noms
	   de domaine — quand le produit admet n'importe quel compte : la conversion est
	   la même que celle de `lireNotes()`. */
	return {
		prenom: prenomDuNom(ligne.nom),
		nom: ligne.nom,
		initiales: initialesDuNom(ligne.nom),
		domaine: ligne.domaineNom ?? '',
		role
	} as unknown as UtilisateurCourant;
}

const MILLISECONDES_PAR_HEURE = 3_600_000;
const MILLISECONDES_PAR_JOUR = 86_400_000;

/**
 * La fenêtre de l'accueil est de sept jours, et c'est le gel qui le dit : « Consultations ·
 * 7 jours », comparées à « la semaine précédente », et le panneau d'activité porte « 7
 * derniers jours ». Aucune de ces durées n'est choisie ici.
 */
const JOURS_DE_LA_FENETRE = 7;

/** L'instant qui ouvre une fenêtre de N jours s'achevant à `maintenant`. */
function debutDeFenetre(maintenant: Date, jours: number): Date {
	return new Date(maintenant.getTime() - jours * MILLISECONDES_PAR_JOUR);
}

/**
 * Les consultations d'une fenêtre, par note — `RG-M04-09`. CE N'EST PAS
 * `notes.compteur_de_consultations`, et la différence est le tout de l'indicateur : le
 * compteur est un cumul de toute la vie de la note, la table est une SÉRIE DATÉE. Un cumul
 * ne se compare pas à une semaine précédente.
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
 * L'ancienneté de modification de chaque note, en jours — `notes.modifie_le`. Le
 * comptage passe par `joursEcoules()` : il n'y a pas deux façons de compter un
 * jour dans ce produit.
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

/**
 * Les demandes de révision ouvertes — `RG-M01-02`, source unique. L'indicateur « En attente
 * de révision » et la corbeille lisent LA MÊME LISTE : deux comptages concurrents finiraient
 * par se contredire à l'écran.
 *
 * LA JOINTURE INTERNE SUR `comptes` PORTE UNE RÈGLE : `revision_par_id` est `SET NULL` à la
 * suppression du demandeur, et la corbeille affiche « Signalée par X ». Une demande dont le
 * demandeur a disparu est écartée plutôt que dotée d'un nom inventé.
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

interface Trace {
	readonly type: TypeDEvenement;
	readonly qui: string;
	readonly cible: string;
	readonly instant: Date;
}

/**
 * Le flux d'activité — quatre traces réelles, et aucune déduction. Chaque type n'est
 * rapporté que s'il existe une LIGNE DATÉE qui l'atteste :
 *
 *   `verification`  `verifications` — la note, le compte, l'instant (M06.2).
 *   `edition`       `versions`, avec son auteur et son instant (`RG-M07-02`).
 *   `publication`   `notes.cree_le` d'une note dont `statut = 'publiee'`.
 *   `revision`      `notes.revision_le` — la même source que la corbeille.
 *   `import`        AUCUNE. Voir `SANS_CONTREPARTIE_EN_BASE`.
 *
 * `RG-M01-03` demande de dédoublonner « un même objet publié puis édité dans une fenêtre
 * courte » : aucune règle ne dit ce qu'est une fenêtre courte, et elle N'EST PAS tenue.
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
 * Le flux, chronologique et décroissant. L'ancienneté est en HEURES ENTIÈRES,
 * parce que `EvenementDActivite.heures` l'est et que la vue en tire « à
 * l'instant », « il y a N h » puis « hier ». Le plancher est le bon arrondi.
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

/**
 * Ce que le chargeur de `/` rend à la page. `session` dit quel écran rendre, et ne porte
 * aucun détail de l'identité — ni rôle de décision, ni identifiant de compte (`ADR-006`
 * interdit « toute exposition des droits au navigateur »). Les neuf sources de V-07 sont
 * OPTIONNELLES parce qu'elles le sont là-bas. `role` n'est pas une exposition de droit :
 * c'est le libellé que la barre supérieure AFFICHE, et aucune décision d'interface n'en est
 * tirée côté navigateur.
 */
export interface DonneesDAccueil {
	/** `false` en anonyme — V-01 ; `true` avec une session — V-07. */
	readonly session: boolean;
	/**
	 * Les notes que l'identité peut lire, dans la forme que les deux vues
	 * déclarent en propriété (`readonly Note[]`, `seeds/corpus.ts`).
	 */
	readonly notes: readonly Note[];
	readonly compte?: UtilisateurCourant;
	readonly univers?: readonly Univers[];
	readonly domaines?: readonly Domaine[];
	readonly mesures7j?: Partial<Record<IdentifiantNote, number>>;
	readonly mesures7jPrec?: Partial<Record<IdentifiantNote, number>>;
	readonly modifications?: Partial<Record<IdentifiantNote, number>>;
	readonly activite?: readonly EvenementDActivite[];
	/** Les demandes de révision ouvertes du périmètre (RG-M01-02). */
	readonly revisions?: readonly DemandeDeRevision[];
}

/**
 * Le chargeur de `/`, côté donnée.
 *
 * En anonyme, `notes` ne contient que des notes publiques ET publiées. V-01 réapplique son
 * propre `notesPubliques()` (`RG-M17-01`) ; sur une liste déjà bornée, ce second filtre ne
 * retire rien — il reste la garde de la vue, et ce module la garde du produit.
 *
 * En session, `notes` est le périmètre autorisé, fermé par défaut (`RG-DRO-02`), et les
 * huit autres sources sont bornées au MÊME ensemble d'identifiants.
 */
export async function lireAccueil(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<DonneesDAccueil> {
	const retenus = await identifiantsLisibles(base, identite);
	const identifiants = [...retenus];

	/* L'ANONYME S'ARRÊTE ICI : V-01 ne lit que `notes`, et calculer les huit autres
	   sources pour un visiteur qui ne les verra jamais serait payer huit requêtes
	   par requête publique. */
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
		/* LE TABLEAU DE BORD NE NOMME QUE LES DOMAINES QUE L'APPELANT PEUT OUVRIR. Il
		   lisait la table entière pendant que le gabarit racine servait le rail
		   filtré : la MÊME réponse portait un rail vide et des cartes cliquables
		   menant chacune vers un 404. C'est LA MÊME FONCTION que le rail, et non une
		   seconde écriture du même filtre. */
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

	/* LA SALUTATION NE NOMME PAS UN DOMAINE QUE L'APPELANT NE PEUT PAS LIRE : elle
	   porte sur le seul RATTACHEMENT du compte, qui n'est pas un titre d'accès
	   (`RG-DRO-02`). La chaîne vide est un cas que V-07 traite déjà — celui d'un
	   compte d'amorçage —, et la salutation bascule sur « Votre base compte … ». */
	const lisible = domainesLisibles.some((d) => d.nom === compte.domaine);
	const ajuste = lisible ? compte : { ...compte, domaine: '' as typeof compte.domaine };
	return { ...rendu, compte: ajuste };
}
