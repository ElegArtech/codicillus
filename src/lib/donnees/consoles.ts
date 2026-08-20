/**
 * LA CONSOLE — LA RÉSOLUTION D'UNE ADRESSE D'ADMINISTRATION, DROITS COMPRIS.
 *
 * Ce module est le seul point où les onze adresses réservées à
 * l'administrateur deviennent une ressource, ou rien :
 *
 *   /console/univers              V-27      /console/configuration   V-33
 *   /console/domaines             V-28      /console/analytique      V-34
 *   /console/types-de-fiches      V-29      /console/imports         V-35
 *   /console/types-de-relations   V-30      /console/exports         V-36
 *   /console/templates            V-31      /bibliotheque            V-41
 *   /console/comptes              V-32
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE LOT FERME LA SECONDE FUITE MESURÉE, ET IL FAUT DIRE LAQUELLE
 *
 * `ECART-047` É-1, reproduit par l'orchestrateur sur le produit construit le
 * 20 août : `/console/univers` servait **30 315 octets à n'importe quel
 * connecté** — contributeur sans droit, lecteur, rédacteur, gestionnaire. La
 * route avait été montée par un lot de LIAISON, dont le périmètre excluait
 * explicitement le chargeur et la garde (`T-070` : « pas de chargeur, pas de
 * garde de droit, pas d'authentification »). Personne n'héritait de la garde.
 *
 * `docs/routes.md:167` en donne le motif, et il est double : « Toutes ces
 * routes exigent le rôle administrateur. Un utilisateur non administrateur
 * reçoit 404 V-26, pas un refus : le motif commun du brief impose que la
 * console n'apparaisse pas dans la navigation des autres profils, et RG-ACC-04
 * impose que l'accès direct ne l'apprenne pas davantage. » L'entrée n'est pas
 * rendue (`P-09`) ET l'adresse construite ne l'apprend pas (`RG-ACC-04`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE SECONDE RÈGLE DE DROIT N'EST ÉCRITE ICI — ET SURTOUT PAS RG-DRO-03
 *
 * La tentation était d'écrire, sur chacune des onze routes, une comparaison du
 * rôle porté par `Identite`. Elle est refusée : `RG-DRO-03` — « l'administrateur
 * contourne tous les droits » — est déjà écrite, une fois, dans
 * `src/lib/droits/resolution.ts`, et une seconde écriture aurait toutes les
 * propriétés d'une définition concurrente. C'est la faute que `P-01` nomme pour
 * la fraîcheur, transposée aux droits.
 *
 * `accesALaConsole()` appelle donc `perimetreDeLecture()` et lit son verdict :
 * `resolution.ts` déclare en propres termes que « `tout` est réservé à
 * l'administrateur (`RG-DRO-03`) », et `PERIMETRE_TOTAL` en est la valeur
 * unique. Le prédicat « cet appelant est-il administrateur ? » est donc
 * EMPRUNTÉ, jamais redit — si `RG-DRO-03` changeait, il changerait ici sans
 * qu'on y touche.
 *
 * L'index passé est VIDE, et c'est exact : la question ne porte sur aucun
 * dossier. Un index vide rend un périmètre vide pour tout le monde SAUF pour
 * l'administrateur, dont le périmètre est total sans lire la table — c'est la
 * première branche de `perimetreDeLecture()`. `consoles.test.ts` éprouve les
 * quatre rôles ET l'anonyme sur ce point, dans les deux polarités (`P-5`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * REFUS ET INEXISTENCE SORTENT PAR LE MÊME `return` — ADR-007
 *
 * L'unique issue d'échec de ce module rend `INTROUVABLE`, LE MÊME OBJET gelé de
 * `resolution.ts`. Il n'existe ici ni variante « interdit », ni champ
 * « raison », ni code d'erreur : l'appelant n'a RIEN à quoi se raccrocher pour
 * distinguer un refus d'une inexistence, et le chargeur qui l'appelle n'a qu'un
 * `error(404, MESSAGE_INTROUVABLE)` sans message.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ET LA FRAÎCHEUR NON PLUS (P-01)
 *
 * Les seuils entrent par `contexteDeRequete()` — `lireSeuils()` de `T-030` —,
 * et le niveau est calculé par `lireNotes()`, qui appelle `niveauFraicheur()`.
 * Aucun seuil, aucun barème, aucun libellé n'est écrit ici.
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
import { eq } from 'drizzle-orm';
import { comptes, domaines, univers } from '../base/schema';
import type {
	Compte,
	DetailDeDomaine,
	Domaine,
	Note,
	Univers,
	UtilisateurCourant
} from '../../../seeds/corpus';

/**
 * L'INSTANT ET LES SEUILS D'UNE REQUÊTE, réémis tels quels.
 *
 * `contexteDeRequete()` est écrit une fois, dans `src/lib/donnees/signets.ts`,
 * et rien n'y est propre aux signets : il lit l'horloge UNE FOIS par requête —
 * pour que deux notes de la même page ne soient pas datées de deux instants —
 * et les seuils de fraîcheur par `lireSeuils()` de `T-030` (`P-01`). Le
 * réémettre évite aux onze chargeurs de console d'importer un module dont le
 * nom ne dit rien de ce qu'ils lui demandent ; en écrire un second serait une
 * seconde lecture de l'horloge et une seconde source de seuils.
 */
export { contexteDeRequete };

/* ═══════════════════════════════════════════════════ L'accès ═══════════ */

/**
 * L'index vide — aucun dossier, aucun droit explicite.
 *
 * Il est construit une fois : `indexerLesDroits([], [])` rend deux tables vides
 * et n'a aucun état. La question posée à `perimetreDeLecture()` ne porte sur
 * aucun dossier, et un index peuplé changerait le périmètre d'un NON-
 * administrateur sans jamais changer celui d'un administrateur — donc sans
 * jamais changer la réponse. Le lire vide est le moyen le plus court de ne pas
 * dépendre de l'arborescence pour une décision qui n'en dépend pas.
 */
const SANS_DOSSIER: IndexDesDroits = indexerLesDroits([], []);

/**
 * L'appelant a-t-il accès à la console ?
 *
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. »
 * Le prédicat est emprunté à `resolution.ts` — voir l'en-tête : `tout` est
 * réservé à l'administrateur par `RG-DRO-03`, et c'est cette propriété qu'on
 * lit, non le rôle porté par l'identité.
 *
 * L'anonyme rend `false` lui aussi, et ce n'est pas redondant avec la
 * redirection de `src/lib/auth/garde.ts` : cette fonction ne sait pas d'où
 * l'appel vient, et une garde qui ne tiendrait que par une autre garde n'est
 * pas une garde. `ARB-052` fait rediriger l'anonyme AVANT d'arriver ici ; si un
 * jour cette redirection tombait, la console resterait fermée.
 */
export function accesALaConsole(identite: Identite): boolean {
	return perimetreDeLecture(identite, SANS_DOSSIER).tout;
}

/* ═══════════════════════════════ Ce que la base ne porte pas — P-02 ════ */

/**
 * Une donnée qu'un écran de console affiche et que la base ne porte pas.
 *
 * Le type est celui de `DonneeSansContrepartie` d'`accueil.ts`, et c'est
 * délibéré : `T-030` a posé le motif — la lacune est **comptée et éprouvable**,
 * jamais seulement racontée. Il n'est pas réutilisé par import parce que
 * `accueil.ts` appartient à `T-030` et que sa liste est celle de l'accueil ;
 * deux listes distinctes valent mieux qu'une liste qu'on élargit et dont plus
 * personne ne sait ce qu'elle recense.
 */
export interface MesureSansContrepartie {
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
 * LES DONNÉES DE CONSOLE QUE LA BASE NE PORTE PAS — relevées sur les vingt et
 * une tables de `src/lib/base/schema.ts`, jamais supposées.
 *
 * Elles ne recoupent pas les lacunes de `pnpm verif:donnees` : celles-là
 * portent sur les treize formes que la couche de lecture rend, celles-ci sur
 * des tables de MESURE et de JOURNAL du jeu de semence qui n'ont aucune table
 * en face. Aucune n'est comblable par une ligne de code — seule une migration
 * les refermerait, et elle appartient aux lots qui portent ces modules.
 *
 * `consoles.test.ts` en fait une assertion, de sorte qu'une lacune refermée par
 * une migration future fasse rougir le test au lieu de laisser un commentaire
 * périmé derrière elle.
 */
export const MESURES_DE_CONSOLE_SANS_CONTREPARTIE: readonly MesureSansContrepartie[] = [
	{
		donnee: 'RECHERCHES',
		vue: 'V-34',
		affichage: 'l’indicateur nord « taux de recherche aboutie » et les trous documentaires',
		motif:
			'aucune table de journal de recherche. Le taux se calcule sur des requêtes horodatées avec leur nombre de résultats et d’ouvertures ; rien n’enregistre une recherche.'
	},
	{
		donnee: 'MESURES_7J',
		vue: 'V-34',
		affichage: 'les volumes de consultation de la période',
		motif:
			'`notes.compteur_de_consultations` est un cumul de toute la vie de la note, pas une série datée : aucune table ne porte de consultation horodatée.'
	},
	{
		donnee: 'MESURES_7J_PREC',
		vue: 'V-34',
		affichage: 'la comparaison à la période précédente',
		motif: 'même absence, décalée d’une semaine : il n’y a pas de série à comparer.'
	},
	{
		donnee: 'REVISIONS',
		vue: 'V-34',
		affichage: 'les notes en attente de révision',
		motif:
			'aucune table de demande de révision. Le signalement « à réviser » n’est enregistré nulle part.'
	},
	{
		donnee: 'MODIFICATIONS',
		vue: 'V-34',
		affichage: 'le volume de modifications de la période',
		motif:
			'`notes.modifie_le` porte l’instant de la dernière modification, jamais un compte par période : une note modifiée trois fois cette semaine n’en laisse qu’une trace.'
	},
	{
		donnee: 'JOURNAL_IMPORTS',
		vue: 'V-35',
		affichage: 'le journal transverse des imports de l’instance',
		motif:
			'aucune table d’imports. Le service de conversion n’existe pas (`T-042`) et rien n’écrit de lot ; le journal est structurellement vide.'
	},
	{
		donnee: 'LOT_IMPORT',
		vue: 'V-35',
		affichage: 'le rapport détaillé d’un lot — fichiers, ignorés, échecs',
		motif:
			'même absence : sans table de lot, il n’y a ni lot à ouvrir ni fichier à lister. C’est ce qui laisse `/console/imports/{lot}` non montée — voir le rapport du lot.'
	},
	{
		donnee: 'Template.utilisations',
		vue: 'V-31',
		affichage: 'le nombre de notes créées à partir de chaque template, et leur total',
		motif:
			'aucune colonne. `templates` n’en porte pas, et `notes` ne rattache aucune note au template qui l’a amorcée : le lien est rompu dès la création — « un squelette est copié au moment de la création », dit l’écran lui-même. Le compteur est donc rendu « — » plutôt que zéro (`P-02`).'
	},
	{
		donnee: 'Compte.derniere',
		vue: 'V-32',
		affichage: 'la dernière connexion, sous la forme relative du gel',
		motif:
			'`comptes.derniere_connexion_le` porte l’INSTANT, et `src/lib/base/schema.ts` dit que « le gel ne donne aucune règle de passage de l’instant vers le libellé ». La date est rendue au format court du dépôt ; le libellé relatif attend un arbitrage.'
	},
	{
		donnee: '(l’archive d’export)',
		vue: 'V-36',
		affichage: 'l’issue d’un export — avertissements, volume de l’archive',
		motif:
			'l’archive n’est pas produite (`T-045`) et aucune table n’enregistre d’export passé. L’écran présente le périmètre exportable, jamais un export accompli.'
	}
];

/* ═══════════════════════════ L'état des données de l'analytique ════════ */

/** Les deux positions de l'axe « Données » de la planche V-34. */
export type EtatDesDonnees = 'completes' | 'insuffisantes';

/**
 * L'ÉTAT DES DONNÉES DE V-34 — et c'est ici que `P-02` se joue.
 *
 * V-34 porte DEUX états, et le gel les nomme : « Suffisantes » et
 * « Insuffisantes » (`verif/scenarios/V-34.json`). Le second n'est pas une page
 * d'erreur, c'est l'ÉTAT NEUTRE EXPLICITE que `RG-M01-01` exige : « Pas encore
 * assez d'usage pour conclure », suivi de la raison. Les deux blocs sont
 * toujours dans le document et la feuille en masque un (`V-34:1092-1093`) :
 * choisir la position, c'est choisir lequel s'affiche.
 *
 * Le produit n'a AUCUNE des cinq mesures que la section « Suffisantes »
 * calcule — le recensement ci-dessus le dit, table par table. Servir cette
 * section reviendrait à afficher des chiffres tirés du jeu de semence : la
 * valeur illustrative que `P-02` proscrit sans exception. Servir des zéros
 * serait pire — « 0 » et « indisponible » sont deux informations différentes,
 * et c'est le zéro muet que `RG-M01-01` vise.
 *
 * LA DÉCISION N'EST DONC PAS UNE INVENTION, C'EST UNE LECTURE : des deux
 * positions que le gel offre, le produit est dans celle qui ne dit rien de
 * faux. La même règle a servi à choisir un libellé de session dans
 * `src/hooks.server.ts`.
 *
 * LE PARAMÈTRE EXISTE POUR QUE LE CONTRÔLE AIT UN CAS D'ÉPREUVE — `P-26`.
 * Un prédicat qui rendrait toujours la même valeur serait inerte, et rien ne le
 * dirait : la fonction lit un recensement qu'on lui passe, et `consoles.test.ts`
 * l'exerce dans les DEUX polarités — recensement vide contre recensement réel.
 * Le jour où une migration porterait les cinq mesures, retirer leurs entrées du
 * recensement suffirait à faire basculer l'écran, et le test le verrait.
 */
export function etatDesDonnees(
	manquantes: readonly MesureSansContrepartie[] = MESURES_DE_CONSOLE_SANS_CONTREPARTIE,
	vue = 'V-34'
): EtatDesDonnees {
	return manquantes.some((m) => m.vue === vue) ? 'insuffisantes' : 'completes';
}

/**
 * LE VECTEUR DE V-34 — un seul réglage, `don`, et c'est celui de sa planche.
 *
 * Le nom est celui de `verif/scenarios/V-34.json`. Aucun autre réglage n'est
 * posé : la planche n'en a pas d'autre, et en inventer un serait un
 * comblement.
 */
export function vecteurDeV34(
	manquantes: readonly MesureSansContrepartie[] = MESURES_DE_CONSOLE_SANS_CONTREPARTIE
): Record<string, string | boolean> {
	return { don: etatDesDonnees(manquantes) };
}

/* ══════════════════════════════════════ Le catalogue de la console ═════ */

/**
 * L'UTILISATEUR COURANT, LU EN BASE — et ce qu'il remplace.
 *
 * Les onze vues passaient `MOI` du jeu de semence à leur coquille : Karim
 * Belhadj, Référent, Infrastructure, quel que soit le compte connecté. Une
 * console d'administration qui affiche le nom de quelqu'un d'autre est une
 * valeur illustrative au sens de `P-02`, et sur la donnée la plus visible de la
 * page.
 *
 * TROIS CHAMPS SONT LUS, DEUX SONT DÉRIVÉS, ET LA DISTINCTION IMPORTE :
 *
 *   `nom` `role` `domaine`  LUS. `comptes.nom`, `comptes.role` traduit par
 *                           `ROLE_DEPUIS_ENUM` — la table de `lecture.ts`,
 *                           empruntée et jamais redite —, et le nom du domaine
 *                           joint par `comptes.domaine_id`.
 *   `prenom` `initiales`    DÉRIVÉS du nom, et il n'y a pas de colonne pour eux.
 *                           La dérivation est MÉCANIQUE — premier mot, puis
 *                           première lettre de chaque mot — et c'est exactement
 *                           ce que le jeu de semence porte pour Karim Belhadj :
 *                           `prenom: 'Karim'`, `initiales: 'KB'`. On retrouve la
 *                           valeur du gel en l'appliquant à sa donnée ; ce n'est
 *                           donc pas une règle inventée, c'est la règle que la
 *                           semence applique déjà, écrite là où elle manquait.
 *
 * LE RATTACHEMENT VIDE — `RG-M14-04`, `ON DELETE SET NULL` : un compte dont le
 * domaine a été supprimé n'en a plus. `UtilisateurCourant.domaine` est déclaré
 * requis par `seeds/corpus.ts` ; la chaîne vide est ici le seul rendu possible,
 * et la coquille n'affiche alors aucun rattachement. Fabriquer un nom de
 * domaine serait pire.
 *
 * `null` QUAND L'IDENTITÉ EST ANONYME OU QUE LE COMPTE A DISPARU. L'appelant
 * retombe alors sur le défaut de la vue ; mais aucun appelant de ce module n'est
 * dans ce cas — `resoudreLaConsole()` a déjà refusé l'anonyme.
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
	/* Les quatre types du jeu — `NomDAuteur`, `NomDeDomaine`, `RoleDeCompte` —
	   sont des unions de littéraux tirées des maquettes. Une valeur venue de la
	   base ne s'y range pas par inférence : c'est la même conversion que
	   `lireDomaines()` et `lireComptes()` pratiquent, pour la même raison. */
	return {
		prenom: mots[0] ?? ligne.nom,
		nom: ligne.nom,
		initiales: mots.map((m) => m.charAt(0).toLocaleUpperCase('fr-FR')).join(''),
		domaine: ligne.domaineNom ?? '',
		role
	} as unknown as UtilisateurCourant;
}

/**
 * LE DÉTAIL DE CHAQUE DOMAINE — description et modules activés, par nom.
 *
 * C'est la forme que `V-28` attend (`DETAIL_DOMAINES` du jeu), et elle est
 * COMPOSÉE de deux lectures que `lecture.ts` porte déjà, jamais réécrite :
 * `lireDescriptionsDeDomaine()` et `lireModulesParDomaine()`.
 *
 * `P-04` SE JOUE ICI, ET IL EST DÉJÀ ÉPROUVÉ PAR LA DONNÉE. « Un module
 * désactivé disparaît de la navigation et des tableaux de bord du domaine » :
 * la liste rendue est celle des lignes de `modules_de_domaine`, donc des modules
 * RÉELLEMENT activés. Un domaine sans aucune ligne rend une liste vide, ce que
 * la vue sait montrer — c'est la polarité que `V-28` et `V-11` portent au gel
 * sur sept ensembles distincts.
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
 * LES COMPTES DE `V-32`, complétés de leur dernière connexion.
 *
 * `lireComptes()` de `lecture.ts` rend huit champs sur dix et dit pourquoi il
 * en omet deux. `id` reste omis — la vue ne s'en sert pas, et `identifiant` est
 * la clé par laquelle les actions désignent un compte.
 *
 * `derniere` EST COMPLÉTÉ ICI, ET SOUS UNE FORME QUI N'INVENTE AUCUN SEUIL.
 * `src/lib/base/schema.ts` est explicite : la colonne porte l'INSTANT, « le gel
 * ne donne donc aucune règle de passage de l'instant vers le libellé », et
 * « l'inventer serait un comblement ». Le libellé relatif du gel — « aujourd'hui
 * à 08:41 » — n'est donc PAS reproduit.
 *
 * Restaient deux issues, et la case vide n'en est pas une : `P-02` exige qu'une
 * donnée indisponible s'affiche « comme telle », pas qu'elle s'efface. La date
 * est donc rendue au format court du dépôt — `dateCourteDInstant()`, celui-là
 * même qui rend `arrivee` —, et l'absence de connexion se dit par un mot.
 * Écart de FORME au gel, déclaré au rapport du lot : le fond est exact, la
 * forme relative attend l'arbitrage que le schéma appelle.
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
 * LA DÉSIGNATION CANONIQUE D'UN DOMAINE, par son NOM D'AFFICHAGE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CETTE TABLE EXISTE, ET CE QU'ELLE A COÛTÉ DE NE PAS EXISTER
 *
 * Les gestes d'administration désignent un domaine par sa forme CANONIQUE —
 * identifiant lisible d'univers, puis identifiant lisible de domaine
 * (`docs/routes.md` §2.2) — parce que `RG-STR-02` ne rend son identifiant unique
 * qu'au sein de son univers. `mesurerUnDomaine()` interroge donc
 * `univers.identifiant` et `domaines.identifiant`.
 *
 * Les VUES, elles, ne connaissent que des noms d'affichage : `interface Domaine`
 * du jeu de semence porte `{ nom, univers, couleur }` et pas un identifiant.
 * Envoyer « Projets » là où le geste attend « projets » fait rendre `introuvable`
 * à la mesure, donc `404` à l'action — mesuré sur la première tentative, et le
 * 404 ne dit rien de sa cause puisqu'il est le refus indiscernable d'`ADR-007`.
 *
 * LA TRADUCTION VIT ICI, ET NON DANS LA VUE. Une vue qui porterait les
 * identifiants de base cesserait d'être la transcription du gel ; une page qui
 * les devinerait par abaissement de casse inventerait une règle que rien ne
 * garantit — « Poste de travail » ne donne pas « poste-de-travail » par
 * mécanique évidente, et c'est la base qui sait.
 */
export interface DesignationDeDomaine {
	/** L'identifiant lisible de l'univers — premier segment de la forme canonique. */
	readonly univers: string;
	/** L'identifiant lisible du domaine — second segment. */
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
 * L'IDENTIFIANT LISIBLE D'UN UNIVERS, par son NOM D'AFFICHAGE.
 *
 * Même besoin que pour les domaines, et même cause : `supprimerUnUnivers()`
 * désigne par `univers.identifiant` — c'est la clé du segment d'adresse
 * `/univers/{univers}` (`docs/routes.md` §2.2) —, tandis que `interface Univers`
 * du jeu de semence ne porte que le nom. La correspondance est LUE, jamais
 * dérivée du nom.
 */
export async function lireLesDesignationsDUnivers(base: Base): Promise<Record<string, string>> {
	const lignes = await base
		.select({ nom: univers.nom, identifiant: univers.identifiant })
		.from(univers);
	const rendu: Record<string, string> = {};
	for (const l of lignes) rendu[l.nom] = l.identifiant;
	return rendu;
}

/** Les univers et les domaines, dans la forme que la coquille attend. */
export interface RangementDeConsole {
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
}

/**
 * LE RANGEMENT, lu une fois par requête.
 *
 * Les onze écrans le passent à leur coquille — c'est le rail de gauche —, et
 * trois d'entre eux s'en servent aussi pour leur contenu : `V-27` liste les
 * univers, `V-28` les domaines, `V-36` les domaines exportables. Une seule
 * lecture les sert tous, et les deux fonctions appelées sont celles de
 * `lecture.ts`.
 */
export async function lireLeRangement(base: Base): Promise<RangementDeConsole> {
	const [tousLesUnivers, tousLesDomaines] = await Promise.all([
		lireUnivers(base),
		lireDomaines(base)
	]);
	return { univers: tousLesUnivers, domaines: tousLesDomaines };
}

/* ═══════════════════════════════════════════════════ La résolution ═════ */

/** Ce qu'une adresse de console rapporte quand elle rapporte quelque chose. */
export interface AccesALaConsole {
	/**
	 * LES NOTES, dans la forme que les onze vues déclarent en propriété.
	 *
	 * Le périmètre est TOTAL : l'appelant est administrateur, sans quoi il n'y a
	 * pas de ressource. `lireNotes()` de `T-030` lit donc la table entière, et
	 * c'est le seul cas du dépôt où cela n'entre pas en conflit avec `ADR-006` —
	 * le filtre de périmètre d'un administrateur ne retire rien.
	 */
	readonly notes: readonly Note[];
	/**
	 * LE RANGEMENT ET L'UTILISATEUR — ce que les onze écrans passent tous à leur
	 * coquille, et que trois d'entre eux affichent aussi dans leur contenu.
	 *
	 * LA RÉDACTION PRÉCÉDENTE DE CE COMMENTAIRE DISAIT L'INVERSE, ET ELLE ÉTAIT
	 * FAUSSE. Elle affirmait que « les onze vues lisent leur catalogue au niveau
	 * du MODULE `seeds/corpus.ts` » et qu'« aucun chargeur ne peut donc y
	 * substituer la base sans toucher `src/vues/` ». Vérifié ligne à ligne :
	 * `V-27:96-101`, `V-28`, `V-29`, `V-30`, `V-31`, `V-32`, `V-33`, `V-34` et
	 * `CoquilleDeConsole.svelte:70-75` déclarent TOUS `univers?`, `domaines?`,
	 * `compte?` et `instance?` en propriétés FACULTATIVES, dont le défaut — et le
	 * défaut seulement — est la constante du jeu. L'import de module sert de
	 * valeur par défaut, pas de source. Il n'y avait donc rien à toucher dans les
	 * vues pour que la base entre : il fallait passer les propriétés.
	 *
	 * C'est `P-21` : la propriété du gel était affirmée, pas lue.
	 */
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
	/**
	 * L'utilisateur connecté. JAMAIS `null` ici, et c'est la résolution qui
	 * l'établit : une identité authentifiée dont la ligne de compte a disparu
	 * n'est pas un administrateur sans nom, c'est une session caduque — elle
	 * ressort par le même `INTROUVABLE` que le refus de droit, sans que rien ne
	 * distingue les deux (`ADR-007`).
	 *
	 * Le type non nul n'est pas une commodité : il évite aux onze pages une
	 * branche de rendu que rien n'exercerait, donc onze branches dont personne ne
	 * saurait si elles marchent (`P-5`).
	 */
	readonly compte: UtilisateurCourant;
}

/**
 * LE CHEMIN UNIQUE — `ADR-007`. Une raison de ne rien rapporter, un seul
 * `INTROUVABLE`, aucune trace de la raison dans la valeur rendue : l'appelant
 * n'est pas administrateur.
 *
 * Il n'y en a pas d'autre, et c'est une propriété des onze adresses : ce sont
 * des chemins FIXES, sans paramètre, qui ne désignent aucune ressource du
 * corpus. Rien n'y est à résoudre au-delà du droit — d'où la redirection de
 * l'anonyme décidée sur le préfixe par `garde.ts` (`ARB-052`), et d'où l'absence
 * ici de toute lecture d'identifiant.
 */
export async function resoudreLaConsole(
	base: Base,
	contexte: ContexteDeLecture,
	identite: Identite
): Promise<Resolution<AccesALaConsole>> {
	if (!accesALaConsole(identite)) return INTROUVABLE;

	/* Les quatre lectures sont indépendantes : elles partent ensemble plutôt
	   qu'en file, et l'instant de `contexte` est commun aux quatre — c'est ce
	   que `contexteDeRequete()` garantit, une horloge lue une seule fois. */
	const [notes, rangement, compte] = await Promise.all([
		lireNotes(base, contexte),
		lireLeRangement(base),
		lireLUtilisateurCourant(base, identite)
	]);

	/* La session porte un identifiant de compte que la base ne connaît plus :
	   même issue que le refus de droit, et pour la même raison. */
	if (compte === null) return INTROUVABLE;

	return {
		trouve: true,
		ressource: { notes, univers: rangement.univers, domaines: rangement.domaines, compte }
	};
}
