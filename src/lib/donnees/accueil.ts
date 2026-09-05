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
import { and, count, desc, eq, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import type { Base } from '../base/acces';
import {
	comptes,
	consultations,
	domaines,
	dossiers,
	droitsDeDossier,
	lotsDImport,
	notes,
	typesDeNote,
	univers,
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
import { cycleDuRegistre } from './vivacite';
import {
	SEUILS_DE_VIVACITE,
	vivacite,
	type EtatDeVivacite,
	type SeuilsDeVivacite
} from '../fraicheur';
import { accord } from '../vocabulaire';
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
	/** `null` pour un lot d'import : il ne vise pas une note, il en écrit douze. */
	readonly cible: string | null;
	readonly instant: Date;
	/** Ce que le gel affiche à droite de la ligne — un lot en a un, une note non. */
	readonly detail?: string;
}

/**
 * Le flux d'activité — quatre traces réelles, et aucune déduction. Chaque type n'est
 * rapporté que s'il existe une LIGNE DATÉE qui l'atteste :
 *
 *   `verification`  `verifications` — la note, le compte, l'instant (M06.2).
 *   `edition`       `versions`, avec son auteur et son instant (`RG-M07-02`).
 *   `publication`   `notes.cree_le` d'une note dont `statut = 'publiee'`.
 *   `revision`      `notes.revision_le` — la même source que la corbeille.
 *   `import`        `lots_d_import` — la seconde moitié de `RG-M12-09`, « ce journal
 *                   alimente LE FLUX D'ACTIVITÉ DE L'ACCUEIL et l'écran
 *                   d'administration ».
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

	/* ══ LES LOTS D'IMPORT — `RG-M12-09` ══
	   LE PÉRIMÈTRE D'UN LOT EST CELUI DE SON DOMAINE, et le périmètre lisible est ici
	   une liste de NOTES : un domaine dont l'appelant ne lit aucune note ne le
	   regarde pas. La liste des domaines se déduit donc des notes retenues, en une
	   requête, plutôt que de rouvrir l'arbre des droits une seconde fois.

	   DEUX FILTRES QUI DISENT LA MÊME CHOSE — « quelque chose a été écrit » : une
	   simulation n'écrit rien (`RG-M12-02`), un lot refusé en bloc non plus
	   (`RG-M12-03`), et son journal compte alors zéro note. */
	const domainesLisibles = await base
		.selectDistinct({ id: notes.domaineId })
		.from(notes)
		.where(perimetre);

	const lots =
		domainesLisibles.length === 0
			? []
			: await base
					.select({
						qui: comptes.nom,
						instant: lotsDImport.le,
						source: lotsDImport.source,
						notesCreees: lotsDImport.notesCreees,
						notesMisesAJour: lotsDImport.notesMisesAJour
					})
					.from(lotsDImport)
					.innerJoin(comptes, eq(lotsDImport.auteurId, comptes.id))
					.where(
						and(
							gte(lotsDImport.le, depuis),
							eq(lotsDImport.simulation, false),
							inArray(
								lotsDImport.domaineId,
								domainesLisibles.map((d) => d.id)
							)
						)
					);

	return [
		...verifiees.map((l) => ({ type: 'verification' as const, ...l })),
		...editees.map((l) => ({ type: 'edition' as const, ...l })),
		...publiees.map((l) => ({ type: 'publication' as const, ...l })),
		...signalees.flatMap((l) =>
			l.instant === null ? [] : [{ type: 'revision' as const, ...l, instant: l.instant }]
		),
		...lots.flatMap((l) => {
			const ecrites = l.notesCreees + l.notesMisesAJour;
			return ecrites === 0
				? []
				: [
						{
							type: 'import' as const,
							qui: l.qui,
							cible: null,
							instant: l.instant,
							/* LE DÉTAIL EST MESURÉ, PAS ILLUSTRÉ : le nombre vient du
							   journal du lot, la source du dossier déposé. */
							detail: `${String(ecrites)} ${accord(ecrites, 'note reprise', 'notes reprises')} depuis ${l.source}`
						}
					];
		})
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
					),
					/* ABSENT ⇒ NON POSÉ : `EvenementDActivite.detail` est optionnel, et
					   une clé posée à `undefined` se verrait dans toute comparaison
					   profonde — c'est le régime de `lireUnivers()` pour `systeme`. */
					...(t.detail === undefined ? {} : { detail: t.detail })
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

/* ==========================================================================
   LE TABLEAU DE VIVACITÉ DE L'ACCUEIL — ce que V-07 met sous les yeux.

   Cinq blocs le lisent : la salutation (« N notes, dont M à jour »), la carte
   « À surveiller » (deux alertes, cinq compteurs, un bilan), les deux listes de
   consultation, et le tableau des univers. Ils comptent TOUS LA MÊME CHOSE —
   l'état de vivacité du registre Référence de chaque note lisible — et c'est
   pourquoi il n'y a ici qu'une lecture : deux comptages concurrents finiraient
   par se contredire à l'écran, comme `RG-M01-02` le dit déjà des révisions.

   AUCUN ÉTAT N'EST CALCULÉ ICI. Le cycle sort de `cycleDuRegistre()`, l'état et
   ses libellés de `vivacite()` — la fabrique unique (`P-01`, `ADR-005`). Ce
   module ne fait que projeter les colonnes et rassembler.
   ========================================================================== */

/**
 * L'ÉTAT DE VIVACITÉ D'UNE NOTE, tel que l'accueil le montre. Le registre est la
 * RÉFÉRENCE : c'est le registre canonique (`RG-NOT-02`), le seul que toute note
 * possède, et compter une note deux fois — une par registre — ferait un total
 * qui ne serait celui d'aucune bibliothèque.
 */
export interface EtatDeNoteALAccueil {
	/** L'identifiant lisible — `/notes/{identifiant}`. */
	readonly identifiant: string;
	readonly titre: string;
	/** Le nom de l'univers, la clé du tableau « Vos univers ». */
	readonly univers: string;
	readonly etat: EtatDeVivacite;
	/** Le libellé de l'état — il accompagne TOUJOURS le glyphe (`RG-M18-09`). */
	readonly libelle: string;
	/** « dans 67 j », « 21 j de retard », « jamais ». */
	readonly compact: string;
	/** Le reste avant échéance, en jours. Négatif : l'échéance est passée. */
	readonly reste: number;
}

/** Une note de la liste « Récemment consultées » — les sept derniers jours. */
export interface NoteRecemmentConsultee {
	readonly identifiant: string;
	readonly titre: string;
	/** L'ancienneté de la dernière ouverture, en minutes entières. */
	readonly minutes: number;
}

/** Une note de la liste « Les plus consultées » — les trente derniers jours. */
export interface NoteLaPlusConsultee {
	readonly identifiant: string;
	readonly titre: string;
	/** Les consultations tombées DANS la fenêtre — jamais le cumul de toute la vie. */
	readonly consultations: number;
}

/** Ce que le chargeur de `/` ajoute pour V-07. */
export interface TableauDeVivacite {
	/** Toutes les notes lisibles, une ligne par note. Les signets n'en sont pas. */
	readonly notes: readonly EtatDeNoteALAccueil[];
	readonly recemment: readonly NoteRecemmentConsultee[];
	readonly plusConsultees: readonly NoteLaPlusConsultee[];
}

/** La fenêtre de « Récemment consultées », en jours — le libellé de la carte. */
const JOURS_RECEMMENT = 7;
/** La fenêtre de « Les plus consultées », en jours — le libellé de la carte. */
const JOURS_PLUS_CONSULTEES = 30;
/** Cinq lignes par carte, comme le rail en porte cinq dans « Récents ». */
const LIGNES_PAR_CARTE = 5;

/**
 * L'ÉTAT DE CHAQUE NOTE LISIBLE, RÉFÉRENCE.
 *
 * LES SIGNETS N'EN SONT PAS : « un signet n'est pas une note ; le vocabulaire est
 * contractuel, et les compteurs le suivent ». Le crible porte sur
 * `types_de_note.identifiant`, PERSISTÉ et stable, jamais sur le nom affiché —
 * renommer le type en console ferait sinon entrer trois signets dans la
 * bibliothèque sans que rien ne le dise.
 *
 * LE NOM DU DEMANDEUR DE RÉVISION EST JOINT parce que la fabrique en dépend : une
 * demande sans compte nommé ne force pas « À revoir » (`vivacite()`), et
 * `revision_par_id` est `SET NULL` à la suppression du compte (`RG-M15-02`).
 */
async function lireLesEtatsDeVivacite(
	base: Base,
	identifiants: readonly string[],
	maintenant: Date,
	seuils: SeuilsDeVivacite
): Promise<readonly EtatDeNoteALAccueil[]> {
	if (identifiants.length === 0) return [];
	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			universNom: univers.nom,
			modifieLe: notes.modifieLe,
			corpsOperationnelModifieLe: notes.corpsOperationnelModifieLe,
			verifieLe: notes.verifieLe,
			verifieLeOperationnel: notes.verifieLeOperationnel,
			validiteReference: notes.validiteReference,
			validiteOperationnel: notes.validiteOperationnel,
			revisionDemandee: notes.revisionDemandee,
			revisionRegistre: notes.revisionRegistre,
			revisionPar: comptes.nom
		})
		.from(notes)
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.leftJoin(comptes, eq(notes.revisionParId, comptes.id))
		.where(
			and(inArray(notes.identifiant, [...identifiants]), ne(typesDeNote.identifiant, 'signet'))
		);

	return lignes.flatMap((l) => {
		const cycle = cycleDuRegistre(
			{
				modifieLe: l.modifieLe,
				corpsOperationnelModifieLe: l.corpsOperationnelModifieLe,
				verifieLe: l.verifieLe,
				verifieLeOperationnel: l.verifieLeOperationnel,
				validiteReference: l.validiteReference,
				validiteOperationnel: l.validiteOperationnel,
				revisionDemandee: l.revisionDemandee,
				revisionRegistre: l.revisionRegistre,
				revisionPar: l.revisionPar,
				verifieParReference: null,
				verifieParOperationnel: null
			},
			'reference'
		);
		/* La Référence existe toujours (`RG-NOT-02`) ; `cycleDuRegistre` ne rend
		   `null` que pour l'Opérationnel. La garde est celle du type, pas une
		   supposition sur la donnée. */
		if (cycle === null) return [];
		const etat = vivacite(cycle, maintenant, seuils);
		return [
			{
				identifiant: l.identifiant,
				titre: l.titre,
				univers: l.universNom,
				etat: etat.etat,
				libelle: etat.libelle,
				compact: etat.compact,
				reste: etat.reste
			}
		];
	});
}

/**
 * LES NOTES QUE CE COMPTE A ROUVERTES CETTE SEMAINE — jamais celles des autres.
 * Servir les lectures de tout le monde annoncerait à chacun ce que ses collègues
 * consultent ; `recentsDuCompte()` du gabarit racine filtre déjà de même.
 */
async function lireLesNotesRecemmentConsultees(
	base: Base,
	identifiants: readonly string[],
	compteId: string,
	maintenant: Date
): Promise<readonly NoteRecemmentConsultee[]> {
	if (identifiants.length === 0) return [];
	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			derniere: sql<Date>`max(${consultations.le})`
		})
		.from(consultations)
		.innerJoin(notes, eq(notes.id, consultations.noteId))
		.where(
			and(
				inArray(notes.identifiant, [...identifiants]),
				eq(consultations.compteId, compteId),
				gte(consultations.le, debutDeFenetre(maintenant, JOURS_RECEMMENT))
			)
		)
		.groupBy(notes.identifiant, notes.titre)
		.orderBy(desc(sql`max(${consultations.le})`))
		.limit(LIGNES_PAR_CARTE);

	return lignes.map((l) => ({
		identifiant: l.identifiant,
		titre: l.titre,
		minutes: Math.max(
			0,
			Math.floor((maintenant.getTime() - new Date(l.derniere).getTime()) / 60_000)
		)
	}));
}

/**
 * LES NOTES LES PLUS OUVERTES DE LA FENÊTRE — celles de TOUT LE MONDE, et c'est
 * la différence avec la carte d'à côté : « les plus consultées » est un fait du
 * corpus, « récemment consultées » un fait de la personne.
 *
 * LE NOMBRE AFFICHÉ EST CELUI DE LA FENÊTRE, PAS LE CUMUL DE
 * `notes.compteur_de_consultations` : la carte annonce « 30 derniers jours », et
 * un chiffre qui contredit son propre libellé est un défaut. Le classement est
 * donc le même que le chiffre — il n'y a pas deux mesures à l'écran.
 */
async function lireLesNotesLesPlusConsultees(
	base: Base,
	identifiants: readonly string[],
	maintenant: Date
): Promise<readonly NoteLaPlusConsultee[]> {
	if (identifiants.length === 0) return [];
	const lignes = await base
		.select({ identifiant: notes.identifiant, titre: notes.titre, combien: count() })
		.from(consultations)
		.innerJoin(notes, eq(notes.id, consultations.noteId))
		.where(
			and(
				inArray(notes.identifiant, [...identifiants]),
				gte(consultations.le, debutDeFenetre(maintenant, JOURS_PLUS_CONSULTEES))
			)
		)
		.groupBy(notes.identifiant, notes.titre)
		.orderBy(desc(count()))
		.limit(LIGNES_PAR_CARTE);

	return lignes.map((l) => ({
		identifiant: l.identifiant,
		titre: l.titre,
		consultations: l.combien
	}));
}

/**
 * LE TABLEAU DE VIVACITÉ, EN UNE FOIS. Il est SÉPARÉ de `lireAccueil()` à
 * dessein : `/bibliotheque/vivacite` appelle celle-ci pour son rail, et n'a que
 * faire de trois requêtes de plus.
 *
 * `identifiants` est le périmètre DÉJÀ RÉSOLU — celui que `lireAccueil()` vient
 * de rendre. Le recalculer ici rouvrirait la porte à deux périmètres divergents
 * dans une même réponse.
 */
export async function lireLeTableauDeVivacite(
	base: Base,
	identifiants: readonly string[],
	compteId: string,
	maintenant: Date,
	seuils: SeuilsDeVivacite = SEUILS_DE_VIVACITE
): Promise<TableauDeVivacite> {
	const [notesEvaluees, recemment, plusConsultees] = await Promise.all([
		lireLesEtatsDeVivacite(base, identifiants, maintenant, seuils),
		lireLesNotesRecemmentConsultees(base, identifiants, compteId, maintenant),
		lireLesNotesLesPlusConsultees(base, identifiants, maintenant)
	]);
	return { notes: notesEvaluees, recemment, plusConsultees };
}
