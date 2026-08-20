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
 * `error(404)` sans message.
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
import { lireNotes, type ContexteDeLecture } from './lecture';
import { contexteDeRequete } from './signets';
import type { Note } from '../../../seeds/corpus';

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

/* ═══════════════════════════════════════════════════ La résolution ═════ */

/** Ce qu'une adresse de console rapporte quand elle rapporte quelque chose. */
export interface AccesALaConsole {
	/**
	 * LES NOTES, dans la forme que les onze vues déclarent en propriété.
	 *
	 * C'est la SEULE donnée qui entre par propriété dans ces écrans, et il faut
	 * le dire nettement : les onze vues lisent leur catalogue — univers,
	 * domaines, types, templates, comptes, configuration — au niveau du MODULE
	 * `seeds/corpus.ts` (`V-27:71`, `V-28:68`, `V-29:72`, `V-30:54`, `V-31:59`,
	 * `V-32:65`, `V-33:93`, `V-34:89`, `V-35:80`, `V-36:82`, `V-41:93`), et
	 * `CoquilleDeConsole.svelte:44` fait de même pour la coquille. Aucun
	 * chargeur ne peut donc y substituer la base sans toucher `src/vues/`, ce
	 * que ce lot s'interdit. Écart déclaré au rapport.
	 *
	 * Le périmètre est TOTAL : l'appelant est administrateur, sans quoi il n'y a
	 * pas de ressource. `lireNotes()` de `T-030` lit donc la table entière, et
	 * c'est le seul cas du dépôt où cela n'entre pas en conflit avec `ADR-006` —
	 * le filtre de périmètre d'un administrateur ne retire rien.
	 */
	readonly notes: readonly Note[];
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
	return { trouve: true, ressource: { notes: await lireNotes(base, contexte) } };
}
