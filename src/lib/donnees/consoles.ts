/**
 * La console — la résolution d'une adresse d'administration, droits compris. C'est le seul
 * point où les onze adresses de `/console/…` et `/bibliotheque` deviennent une ressource,
 * ou rien. `docs/routes.md:167` : « toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus. »
 *
 * AUCUNE SECONDE RÈGLE DE DROIT N'EST ÉCRITE ICI, ET SURTOUT PAS `RG-DRO-03` :
 * `accesALaConsole()` appelle `perimetreDeLecture()` et lit son verdict, `tout` étant
 * réservé à l'administrateur. Le prédicat est EMPRUNTÉ, jamais redit.
 *
 * L'unique issue d'échec rend `INTROUVABLE`, LE MÊME OBJET gelé de `resolution.ts`
 * (`ADR-007`). Les seuils entrent par `contexteDeRequete()` et le niveau est calculé par
 * `lireNotes()` : aucun barème, aucun libellé n'est écrit ici (`P-01`).
 */
import type { Base } from '../base/acces';
import {
	INTROUVABLE,
	indexerLesDroits,
	perimetreDeLecture,
	type Identite,
	type IndexDesDroits,
	type Resolution
} from '../droits/resolution';
import {
	dateCourteDInstant,
	lireComptes,
	lireDescriptionsDeDomaine,
	lireDomaines,
	lireModulesParDomaine,
	lireNotes,
	lireUnivers,
	ROLE_DEPUIS_ENUM,
	type ContexteDeLecture
} from './lecture';
import { contexteDeRequete } from './signets';
import type { EffectifsDeConsole } from '../console/effectifs';
import { count, desc, eq } from 'drizzle-orm';
import {
	comptes,
	domaines,
	lignesDeLot,
	lotsDImport,
	templates,
	typesDeFiche,
	typesDeRelation,
	univers
} from '../base/schema';
import { libelleDeScenario } from './scenarios-d-import';
import type {
	Compte,
	DetailDeDomaine,
	Domaine,
	EntreeDeJournalDImport,
	NomDAuteur,
	Note,
	SortDeFichier,
	Univers,
	UtilisateurCourant
} from '../../../seeds/corpus';

/**
 * L'instant et les seuils d'une requête, réémis tels quels. `contexteDeRequete()` lit
 * l'horloge UNE FOIS par requête — pour que deux notes de la même page ne soient pas
 * datées de deux instants — et les seuils par `lireSeuils()`.
 */
export { contexteDeRequete };

/**
 * L'index vide — aucun dossier, aucun droit explicite. La question posée à
 * `perimetreDeLecture()` ne porte sur aucun dossier, et un index peuplé
 * changerait le périmètre d'un NON-administrateur sans jamais changer la réponse.
 */
const SANS_DOSSIER: IndexDesDroits = indexerLesDroits([], []);

/**
 * L'appelant a-t-il accès à la console ? Le prédicat est emprunté à `resolution.ts` :
 * `tout` est réservé à l'administrateur par `RG-DRO-03`, et c'est cette propriété qu'on
 * lit, non le rôle porté par l'identité. L'anonyme rend `false` lui aussi, et ce n'est pas
 * redondant avec la redirection de `../auth/garde.ts` : une garde qui ne tiendrait que par
 * une autre garde n'en est pas une.
 */
export function accesALaConsole(identite: Identite): boolean {
	return perimetreDeLecture(identite, SANS_DOSSIER).tout;
}

/**
 * Une donnée qu'un écran de console affiche et que la base ne porte pas. Même forme que
 * `DonneeSansContrepartie` d'`accueil.ts`, sans être importée : deux listes distinctes
 * valent mieux qu'une liste qu'on élargit et dont plus personne ne sait ce qu'elle recense.
 */
export interface MesureSansContrepartie {
	readonly donnee: string;
	readonly vue: string;
	readonly affichage: string;
	readonly motif: string;
}

/**
 * Les données de console que la base ne porte pas — relevées table par table, jamais
 * supposées. Aucune n'est comblable par une ligne de code : seule une migration les
 * refermerait. `consoles.test.ts` en fait une assertion, de sorte qu'une lacune refermée
 * par une migration future fasse rougir le test au lieu de laisser un commentaire périmé.
 *
 * TROIS ENTRÉES V-34 EN SONT SORTIES, ET DEUX D'ENTRE ELLES ÉTAIENT FAUSSES.
 * `REVISIONS` disait « aucune table de demande de révision » : `002_socle` porte
 * `notes.revision_demandee`, `revision_commentaire`, `revision_par_id` et `revision_le`
 * depuis l'origine, lues en quatre endroits du produit. `MODIFICATIONS` disait qu'aucune
 * table ne compte les modifications par période : la maquette ne demande pas un compte mais
 * une ANCIENNETÉ en jours, que `notes.modifie_le` donne. `RECHERCHES`, elle, était vraie —
 * la table est montée par `010_recherches`.
 */
export const MESURES_DE_CONSOLE_SANS_CONTREPARTIE: readonly MesureSansContrepartie[] = [
	{
		donnee: 'Compte.derniere',
		vue: 'V-32',
		affichage: 'la dernière connexion, sous la forme relative du gel',
		motif:
			'`comptes.derniere_connexion_le` porte l’INSTANT, et `src/lib/base/schema.ts` dit que « le gel ne donne aucune règle de passage de l’instant vers le libellé ». La date est rendue au format court du dépôt ; le libellé relatif attend un arbitrage.'
	},
	{
		donnee: '(l’issue d’un export)',
		vue: 'V-36',
		affichage: 'l’issue d’un export — avertissements, volume de l’archive',
		motif:
			'aucune table n’enregistre d’export passé. L’ARCHIVE, ELLE, EST BIEN PRODUITE et servie par sa route depuis `T-045` : cette entrée l’a nié plus longtemps que de raison, et un recensement qui ment dans l’autre sens dispense d’aller voir — c’est ce qui a couvert l’arborescence fausse annoncée par l’écran. Ce qui manque est le passé : l’écran présente le périmètre exportable, jamais un export accompli.'
	}
];

/**
 * Le journal des imports est-il enregistré quelque part ? V-35 affirme que « les rapports
 * restent consultables indéfiniment » ; il l'est depuis la migration `009` —
 * `lots_d_import` et `lignes_de_lot` reçoivent chaque lot, et rien ne les purge.
 *
 * LE DRAPEAU RESTE DÉRIVÉ DU RECENSEMENT, JAMAIS ÉCRIT À LA MAIN : c'est la disparition
 * des entrées `JOURNAL_IMPORTS` et `LOT_IMPORT` qui l'a fait basculer, et il rebasculerait
 * de lui-même si l'une revenait. La fonction ne dit pas qu'il y a des lots ; elle dit que
 * ceux qui ont lieu sont gardés.
 */
export function journalDImportsEnregistre(
	manquantes: readonly MesureSansContrepartie[] = MESURES_DE_CONSOLE_SANS_CONTREPARTIE
): boolean {
	return !manquantes.some((m) => m.donnee === 'JOURNAL_IMPORTS');
}

/* ════════════════════════════════════════════════════════════════════════════
   LE JOURNAL DES IMPORTS — `RG-M12-09`, seconde moitié

   « Ce journal alimente le flux d'activité de l'accueil ET L'ÉCRAN
   D'ADMINISTRATION. » Voici l'écran d'administration ; la moitié « accueil » est
   lue par `/univers/[univers]`, sur la même table.

   AUCUN PLAFOND DE LECTURE, et c'est le brief de V-35 qui le veut : « les
   rapports restent consultables indéfiniment ». Une limite silencieuse ferait
   disparaître les lots anciens de l'écran qui promet de les garder.
   ════════════════════════════════════════════════════════════════════════════ */

/** `14:22` — l'heure d'un lot, lue en UTC comme `dateCourteDInstant()`. */
function heureDInstant(instant: Date): string {
	const heures = String(instant.getUTCHours()).padStart(2, '0');
	const minutes = String(instant.getUTCMinutes()).padStart(2, '0');
	return `${heures}:${minutes}`;
}

/**
 * `4 min 12 s` — la durée mesurée d'un lot, dans la forme du gel (`V-35:2736`). Sous la
 * seconde, elle s'arrondit à la seconde plutôt que d'afficher zéro : un lot a duré.
 */
export function dureeLisible(millisecondes: number): string {
	const secondes = Math.max(1, Math.round(millisecondes / 1000));
	const minutes = Math.floor(secondes / 60);
	const reste = secondes % 60;
	return minutes === 0 ? `${String(reste)} s` : `${String(minutes)} min ${String(reste)} s`;
}

/**
 * LE JOURNAL DE L'INSTANCE, du plus récent au plus ancien. `auteur` vient de `comptes`,
 * `domaine` de la COLONNE du lot — pas d'une jointure : un domaine supprimé ne doit pas
 * effacer l'endroit où un lot a atterri.
 *
 * `notes` COMPTE LES NOTES ÉCRITES, créées ET mises à jour : un réimport qui n'aurait rien
 * créé afficherait sinon zéro sur un lot qui a bel et bien travaillé.
 */
export async function lireLeJournalDImports(
	base: Base
): Promise<readonly EntreeDeJournalDImport[]> {
	const lignes = await base
		.select({
			id: lotsDImport.id,
			le: lotsDImport.le,
			auteur: comptes.nom,
			source: lotsDImport.source,
			scenario: lotsDImport.scenario,
			simulation: lotsDImport.simulation,
			domaine: lotsDImport.domaine,
			dureeMs: lotsDImport.dureeMs,
			total: lotsDImport.total,
			notesCreees: lotsDImport.notesCreees,
			notesMisesAJour: lotsDImport.notesMisesAJour,
			ignores: lotsDImport.ignores,
			echecs: lotsDImport.echecs
		})
		.from(lotsDImport)
		.innerJoin(comptes, eq(lotsDImport.auteurId, comptes.id))
		.orderBy(desc(lotsDImport.le));

	return lignes.map((l) => ({
		id: l.id,
		date: dateCourteDInstant(l.le),
		heure: heureDInstant(l.le),
		/* `NomDAuteur` est une UNION FERMÉE des trois noms du jeu de démonstration : un
		   nom lu en base n'y appartient pas, et ne peut y entrer que par une
		   conversion. Elle est faite ici, une fois, au bord — comme `lireNotes()`. */
		auteur: l.auteur as NomDAuteur,
		source: l.source,
		/* LA SIMULATION EST DITE, ET AU MÊME ENDROIT QUE LE SCÉNARIO : une entrée qui
		   ne la dirait pas ferait passer un lot annulé pour un lot écrit. */
		scenario: libelleDeScenario(l.scenario) + (l.simulation ? ' (simulation)' : ''),
		domaine: l.domaine,
		fichiers: l.total,
		notes: l.notesCreees + l.notesMisesAJour,
		ignores: l.ignores,
		echecs: l.echecs,
		duree: dureeLisible(l.dureeMs)
	}));
}

/**
 * LE RAPPORT DÉTAILLÉ D'UN LOT — `/console/imports/{lot}`. Les lignes sont rendues dans
 * l'ordre de RÉCEPTION, celui que le rang porte : sans lui, l'ordre serait celui du plan
 * de requête. `null` quand l'identifiant ne désigne aucun lot — la route en fait un 404.
 */
export async function lireUnLotDImport(
	base: Base,
	identifiant: string
): Promise<{ readonly source: string; readonly fichiers: readonly LigneDeLotAffichee[] } | null> {
	/* Un identifiant qui n'est pas un UUID ferait échouer la requête au lieu de rendre
	   « introuvable » : la forme est éprouvée avant la base. */
	if (!/^[0-9a-f-]{36}$/i.test(identifiant)) return null;
	const [lot] = await base
		.select({ id: lotsDImport.id, source: lotsDImport.source })
		.from(lotsDImport)
		.where(eq(lotsDImport.id, identifiant))
		.limit(1);
	if (lot === undefined) return null;

	const lignes = await base
		.select({
			chemin: lignesDeLot.chemin,
			sort: lignesDeLot.sort,
			motif: lignesDeLot.motif
		})
		.from(lignesDeLot)
		.where(eq(lignesDeLot.lotId, lot.id))
		.orderBy(lignesDeLot.rang);

	return {
		source: lot.source,
		fichiers: lignes.map((l) => ({ c: l.chemin, s: l.sort, m: l.motif ?? '' }))
	};
}

/** Une ligne de lot telle que le rapport de V-35 la nomme. */
export interface LigneDeLotAffichee {
	readonly c: string;
	readonly s: SortDeFichier;
	readonly m: string;
}

/** Les deux positions de l'axe « Données » de la planche V-34. */
export type EtatDesDonnees = 'completes' | 'insuffisantes';

/**
 * L'état des données de V-34 — et c'est ici que `P-02` se joue.
 *
 * V-34 porte DEUX états que le gel nomme, « Suffisantes » et « Insuffisantes ». Le second
 * n'est pas une page d'erreur, c'est l'ÉTAT NEUTRE EXPLICITE que `RG-M01-01` exige. Les
 * deux blocs sont toujours dans le document et la feuille en masque un.
 *
 * LE VERDICT EST DÉRIVÉ DU RECENSEMENT, JAMAIS ÉCRIT À LA MAIN, et c'est cette propriété
 * qui compte : le produit porte aujourd'hui les cinq mesures de l'écran, donc plus aucune
 * entrée V-34, donc `completes` — et le jour où une mesure disparaîtrait, son entrée
 * reviendrait ici et l'écran se tairait sans qu'une ligne de la route change.
 * LE PARAMÈTRE EXISTE POUR QUE LE CONTRÔLE AIT SES DEUX CAS D'ÉPREUVE (`P-26`).
 */
export function etatDesDonnees(
	manquantes: readonly MesureSansContrepartie[] = MESURES_DE_CONSOLE_SANS_CONTREPARTIE,
	vue = 'V-34'
): EtatDesDonnees {
	return manquantes.some((m) => m.vue === vue) ? 'insuffisantes' : 'completes';
}

/**
 * Le vecteur de V-34 — un seul réglage, `don`, celui de sa planche. En inventer
 * un second serait un comblement.
 */
export function vecteurDeV34(
	manquantes: readonly MesureSansContrepartie[] = MESURES_DE_CONSOLE_SANS_CONTREPARTIE
): Record<string, string | boolean> {
	return { don: etatDesDonnees(manquantes) };
}

/**
 * L'utilisateur courant, lu en base. Les onze vues passaient `MOI` du jeu de semence à
 * leur coquille : une console qui affiche le nom de quelqu'un d'autre est une valeur
 * illustrative au sens de `P-02`, sur la donnée la plus visible.
 *
 * TROIS CHAMPS SONT LUS — `nom`, `role` (traduit par `ROLE_DEPUIS_ENUM`, empruntée et
 * jamais redite) et `domaine`. DEUX SONT DÉRIVÉS du nom, faute de colonne : premier mot,
 * puis première lettre de chaque mot. LE RATTACHEMENT VIDE — `RG-M14-04`, `ON DELETE SET
 * NULL` : la chaîne vide est le seul rendu possible, fabriquer un nom serait pire. `null`
 * quand l'identité est anonyme ou que le compte a disparu.
 */
export async function lireLUtilisateurCourant(
	base: Base,
	identite: Identite
): Promise<UtilisateurCourant | null> {
	if (identite.type !== 'authentifie') return null;

	const lignes = await base
		.select({ nom: comptes.nom, role: comptes.role, domaineNom: domaines.nom })
		.from(comptes)
		.leftJoin(domaines, eq(comptes.domaineId, domaines.id))
		.where(eq(comptes.id, identite.compteId));

	const ligne = lignes[0];
	if (ligne === undefined) return null;

	const role = ROLE_DEPUIS_ENUM[ligne.role];
	if (role === undefined) throw new Error(`rôle inconnu en base : ${ligne.role}`);

	const mots = ligne.nom.split(/\s+/).filter((m) => m !== '');
	/* Les types du jeu sont des unions de littéraux tirées des maquettes : une
	   valeur venue de la base ne s'y range pas par inférence. Même conversion que
	   `lireDomaines()` et `lireComptes()`. */
	return {
		prenom: mots[0] ?? ligne.nom,
		nom: ligne.nom,
		initiales: mots.map((m) => m.charAt(0).toLocaleUpperCase('fr-FR')).join(''),
		domaine: ligne.domaineNom ?? '',
		role
	} as unknown as UtilisateurCourant;
}

/**
 * Le détail de chaque domaine — description et modules activés, par nom. Forme attendue
 * par `V-28`, COMPOSÉE de deux lectures de `lecture.ts` et jamais réécrite. `P-04` se joue
 * ici : la liste rendue est celle des lignes de `modules_de_domaine`, donc des modules
 * RÉELLEMENT activés, et un domaine sans ligne rend une liste vide.
 */
export async function lireLeDetailDesDomaines(
	base: Base
): Promise<Record<string, DetailDeDomaine>> {
	const [descriptions, modules] = await Promise.all([
		lireDescriptionsDeDomaine(base),
		lireModulesParDomaine(base)
	]);

	const rendu: Record<string, DetailDeDomaine> = {};
	for (const [nom, description] of descriptions) {
		rendu[nom] = { description, modules: modules.get(nom) ?? [] };
	}
	return rendu;
}

/**
 * Les comptes de `V-32`, complétés de leur dernière connexion. `derniere` est complété ici
 * sous une forme qui n'invente aucun seuil : la colonne porte l'INSTANT, et « le gel ne
 * donne aucune règle de passage de l'instant vers le libellé ». La case vide n'est pas une
 * issue : `P-02` exige qu'une donnée indisponible s'affiche comme telle. La date est rendue
 * au format court du dépôt. Écart de FORME au gel.
 */
export const JAMAIS_CONNECTE = 'Jamais';

export async function lireLesComptesDeConsole(base: Base): Promise<readonly Compte[]> {
	const [rendus, instants] = await Promise.all([
		lireComptes(base),
		base
			.select({ identifiant: comptes.identifiant, derniere: comptes.derniereConnexionLe })
			.from(comptes)
	]);

	const par = new Map(instants.map((i) => [i.identifiant, i.derniere]));
	return rendus.map((c) => {
		const instant = par.get(String(c.identifiant));
		return {
			...c,
			derniere:
				instant === null || instant === undefined ? JAMAIS_CONNECTE : dateCourteDInstant(instant)
		} as unknown as Compte;
	});
}

/**
 * La désignation canonique d'un domaine, par son NOM D'AFFICHAGE.
 *
 * Les gestes d'administration désignent un domaine par sa forme CANONIQUE — identifiant
 * d'univers, puis identifiant de domaine — parce que `RG-STR-02` ne rend l'identifiant
 * unique qu'au sein de son univers. Les VUES ne connaissent que des noms d'affichage :
 * envoyer « Projets » là où le geste attend « projets » fait rendre `introuvable`.
 *
 * LA TRADUCTION VIT ICI, ET NON DANS LA VUE : une vue qui porterait les identifiants de
 * base cesserait d'être la transcription du gel, et les deviner par abaissement de casse
 * inventerait une règle que rien ne garantit.
 */
export interface DesignationDeDomaine {
	readonly univers: string;
	readonly domaine: string;
}

export async function lireLesDesignationsDeDomaine(
	base: Base
): Promise<Record<string, DesignationDeDomaine>> {
	const lignes = await base
		.select({
			nom: domaines.nom,
			domaineIdentifiant: domaines.identifiant,
			universIdentifiant: univers.identifiant
		})
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id));

	const rendu: Record<string, DesignationDeDomaine> = {};
	for (const l of lignes) {
		rendu[l.nom] = { univers: l.universIdentifiant, domaine: l.domaineIdentifiant };
	}
	return rendu;
}

/**
 * L'identifiant lisible d'un univers, par son NOM D'AFFICHAGE. Même besoin et
 * même cause que pour les domaines ; la correspondance est LUE, jamais dérivée du
 * nom.
 */
export async function lireLesDesignationsDUnivers(base: Base): Promise<Record<string, string>> {
	const lignes = await base
		.select({ nom: univers.nom, identifiant: univers.identifiant })
		.from(univers);
	const rendu: Record<string, string> = {};
	for (const l of lignes) rendu[l.nom] = l.identifiant;
	return rendu;
}

/**
 * L'identifiant lisible d'un type de fiche, par son NOM D'AFFICHAGE — « un
 * libellé se renomme, un identifiant lisible est stable ». La correspondance est
 * lue.
 */
export async function lireLesDesignationsDeTypeDeFiche(
	base: Base
): Promise<Record<string, string>> {
	const lignes = await base
		.select({ nom: typesDeFiche.nom, identifiant: typesDeFiche.identifiant })
		.from(typesDeFiche);
	const rendu: Record<string, string> = {};
	for (const l of lignes) rendu[l.nom] = l.identifiant;
	return rendu;
}

export interface RangementDeConsole {
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
}

/**
 * Le rangement, lu une fois par requête : c'est le rail de gauche des onze
 * écrans, et trois d'entre eux s'en servent aussi pour leur contenu.
 */
export async function lireLeRangement(base: Base): Promise<RangementDeConsole> {
	const [tousLesUnivers, tousLesDomaines] = await Promise.all([
		lireUnivers(base),
		lireDomaines(base)
	]);
	return { univers: tousLesUnivers, domaines: tousLesDomaines };
}

export interface AccesALaConsole {
	/**
	 * Les notes, dans la forme que les onze vues déclarent. Le périmètre est TOTAL —
	 * l'appelant est administrateur, sans quoi il n'y a pas de ressource — et c'est le seul
	 * cas du dépôt où lire la table entière n'entre pas en conflit avec `ADR-006`.
	 */
	readonly notes: readonly Note[];
	/**
	 * Le rangement, que les onze écrans passent à leur coquille. Les vues le déclarent en
	 * propriété FACULTATIVE dont le défaut est la constante du jeu : l'import de module sert
	 * de valeur par défaut, pas de source.
	 */
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
	/**
	 * L'utilisateur connecté. JAMAIS `null` ici : une identité authentifiée dont la ligne de
	 * compte a disparu est une session caduque, qui ressort par le même `INTROUVABLE` que le
	 * refus de droit (`ADR-007`). Le type non nul évite aux onze pages une branche de rendu
	 * que rien n'exercerait.
	 */
	readonly compte: UtilisateurCourant;
	/**
	 * Les sept compteurs de `aside.nav2`, lus en base : ils venaient du jeu de
	 * semence et annonçaient « Univers (3) · Domaines (4) » à une instance vide.
	 */
	readonly effectifs: EffectifsDeConsole;
}

/**
 * Les sept compteurs de la navigation secondaire — SIX REQUÊTES, PAS SEPT. `imports` n'a
 * aucune table, et recopier le `1` du gel annoncerait un import à une instance qui n'en a
 * jamais reçu : la section est laissée hors de la table, et `groupesAvecEffectifs()` la
 * rend à zéro. LES COMPTES SONT COMPTÉS ACTIFS, comme au gel. Les six lectures partent
 * ensemble : six `count(*)` sur des tables indexées.
 */
export async function lireLesEffectifsDeConsole(base: Base): Promise<EffectifsDeConsole> {
	const [u, d, f, r, t, c] = await Promise.all([
		base.select({ combien: count() }).from(univers),
		base.select({ combien: count() }).from(domaines),
		base.select({ combien: count() }).from(typesDeFiche),
		base.select({ combien: count() }).from(typesDeRelation),
		base.select({ combien: count() }).from(templates),
		base.select({ combien: count() }).from(comptes).where(eq(comptes.actif, true))
	]);

	return {
		univers: u[0]?.combien ?? 0,
		domaines: d[0]?.combien ?? 0,
		fiches: f[0]?.combien ?? 0,
		relations: r[0]?.combien ?? 0,
		templates: t[0]?.combien ?? 0,
		comptes: c[0]?.combien ?? 0
	};
}

export async function resoudreLaConsole(
	base: Base,
	contexte: ContexteDeLecture,
	identite: Identite
): Promise<Resolution<AccesALaConsole>> {
	if (!accesALaConsole(identite)) return INTROUVABLE;

	/* Les quatre lectures sont indépendantes et partent ensemble ; l'instant de
	   `contexte` leur est commun — une horloge lue une seule fois. */
	const [notes, rangement, compte, effectifs] = await Promise.all([
		lireNotes(base, contexte),
		lireLeRangement(base),
		lireLUtilisateurCourant(base, identite),
		lireLesEffectifsDeConsole(base)
	]);

	/* La session porte un identifiant de compte que la base ne connaît plus :
	   même issue que le refus de droit, et pour la même raison. */
	if (compte === null) return INTROUVABLE;

	return {
		trouve: true,
		ressource: {
			notes,
			univers: rangement.univers,
			domaines: rangement.domaines,
			compte,
			effectifs
		}
	};
}
