/**
 * Le chemin public — `/recherche`, `/guides/{identifiant}`, et la réponse à toute adresse
 * non résolue. Une seule propriété à tenir : rien de ce qui n'est pas public ne doit
 * pouvoir en sortir, et l'existence d'une ressource ne doit pas se lire dans la réponse.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI : `noteVisibleEnAnonyme()` décide de ce qui est
 * PUBLIC — publique ET publiée —, `perimetreDeLecture()` et `noteLisible()` du périmètre
 * autorisé. `notesPubliques()` du jeu de semence n'est jamais employée.
 *
 * LE POINT DUR — `V-04:2219` : « une adresse inexistante et une note existante non publique
 * doivent produire un rendu strictement identique ». La garantie n'est pas une intention :
 * la requête est la MÊME dans les deux cas — une projection par identifiant, sans contenu,
 * donc pas de prise pour le grief de latence d'`ARB-005` — ; la décision passe par
 * `resoudre()`, sans troisième forme ; et le refus sort par `refuserLAdresse()`, dont le
 * type `never` interdit qu'un appelant reprenne la main. L'indiscernabilité de `RG-ACC-04`
 * se mesure par `pnpm test:etancheite`, pas ici.
 */
import { eq } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { notes } from '../base/schema';
import {
	type Identite,
	type IndexDesDroits,
	type NotePourPerimetre,
	type Resolution,
	capacites,
	noteVisibleEnAnonyme,
	resoudre,
	resoudreDroitDeDossier
} from '../droits/resolution';
import { lireIndexDesDroits } from './note';
import { type ContexteDeLecture, lireNotes } from './lecture';
import { chercherLesNotes } from '../recherche/moteur';
import { SENS_DISPONIBLE } from '../recherche/notes-indexees';
import type { Note } from '../../../seeds/corpus';

/**
 * Une donnée qu'un écran du chemin public affiche et que ce lot ne peut pas lui faire
 * porter. Le type existe pour que la lacune soit COMPTÉE et ÉPROUVABLE : `public.test.ts`
 * en fait une assertion, de sorte qu'une lacune refermée fasse rougir le test.
 */
export interface LacuneDuCheminPublic {
	readonly donnee: string;
	readonly vue: string;
	readonly affichage: string;
	readonly motif: string;
}

/**
 * Les lacunes du chemin public — relevées sur les signatures des vues concernées.
 * Elles ont toutes la même cause : les écrans sont conformes au pixel et le
 * restent, et ce qu'ils ne savent pas recevoir, ils ne le reçoivent pas.
 */
export const LACUNES_DU_CHEMIN_PUBLIC: readonly LacuneDuCheminPublic[] = [
	{
		donnee: 'le corps du guide demandé',
		vue: 'V-03',
		affichage: 'le guide écrit dans la maquette gelée',
		motif:
			"V-03 ne déclare qu'une propriété, `vecteur` : son texte, son schéma et son tableau " +
			'sont dans le gel et nulle part ailleurs. La résolution de `/guides/{identifiant}` ' +
			"décide bien du 200 ou du 404 sur la note demandée, mais l'écran ne sait pas la rendre."
	},
	{
		donnee: 'la fraîcheur et le registre du guide demandé',
		vue: 'V-03',
		affichage: 'les valeurs du gel — cartouche « frais », registre « En bref » présent',
		motif:
			"Les deux axes de la planche décrivent LA NOTE AFFICHÉE ; or l'article de V-03 est " +
			"celui du gel. Les piloter depuis une AUTRE note peindrait les attributs d'une note " +
			"sur le corps d'une autre — la « valeur illustrative » que P-02 proscrit. Même refus " +
			'que le chargeur de `/notes/{identifiant}` (T-032) pour les six axes de V-14.'
	},
	{
		donnee: 'la requête de recherche, en session',
		vue: 'V-08',
		affichage: 'la requête du gel, « restauration base »',
		motif:
			'V-08 ne déclare aucun axe de requête : le gel écrit la valeur au balisage et son ' +
			"gestionnaire de planche ne l'atteint jamais (voir l'en-tête de `V-08.svelte`). " +
			'`?q=` est donc lu, mesuré et IGNORÉ en session, jamais refusé. En anonyme, V-02 ' +
			"porte l'axe `req` : `?q=` y est honoré."
	},
	{
		donnee: 'les facettes retenues et le tri',
		vue: 'V-02, V-08',
		affichage: 'aucune facette retenue, tri par pertinence',
		motif:
			'`docs/routes.md:248` nomme `domaine`, `type`, `univers`, `statut`, `fraicheur`, ' +
			"`etiquette`, `visibilite` et `tri` ; aucune des deux vues n'a d'axe pour les " +
			'recevoir. Ils sont IGNORÉS, jamais refusés — la règle de §4.2 pour tout paramètre ' +
			'non honoré.'
	},
	{
		donnee: "l'adresse demandée",
		vue: 'V-04, V-26',
		affichage: "l'une des trois adresses de la planche de revue",
		motif:
			"Les deux vues tirent leur adresse d'une table indexée par la position de planche " +
			"(`V-04:2223`, `V-26:2583`) et n'ont aucun axe qui reçoive une chaîne. " +
			'`docs/routes.md:163` AUTORISE la chaîne demandée comme seule différence entre les ' +
			"deux cas ; elle ne l'exige pas. Ne pas l'afficher rend les deux cas identiques a " +
			"fortiori — mais c'est une perte d'information pour l'utilisateur, et elle est " +
			'déclarée comme telle.'
	},
	{
		donnee: 'les guides suggérés et la sortie de secours',
		vue: 'V-04, V-26',
		affichage: 'aucune suggestion, aucun guide populaire',
		motif:
			"La page non résolue est rendue par le composant d'erreur de la racine, dont l'unique " +
			"canal de donnée est le chargeur du gabarit racine — qui s'exécuterait alors sur " +
			"CHAQUE requête du produit pour lire le corpus entier. Le corpus n'est donc pas " +
			'passé, et la liste est VIDE plutôt que fausse. La contrepartie est une propriété : ' +
			'la réponse est rigoureusement la même quelle que soit la route qui a refusé.'
	}
];

/**
 * Les trois modes de `RG-M02-01`, et celui qui existe.
 *
 * Les mots-clés viennent du moteur. Le mode « Sens » a besoin de VECTEURS, et il n'en
 * existe aucun : le service d'embeddings est optionnel, le modèle n'est pas fixé, aucun lot
 * ne les calcule. Un mode « Sens » qui rendrait des résultats de mots-clés serait une
 * simulation indétectable (`P-02`) ; la brique indisponible dégrade avec un message clair
 * (`P-10`). LE CONSTAT N'EST PAS ÉCRIT ICI, IL EST DÉRIVÉ : `SENS_DISPONIBLE` vient des
 * RÉGLAGES DE L'INDEX, où l'absence d'embedder est la condition mécanique de
 * l'indisponibilité. `?mode=sens` et `?mode=hybride` ne sont pas dans la liste close des
 * paramètres honorés : ils ne sont ni servis, ni refusés.
 */
export { SENS_DISPONIBLE };

/**
 * Les paramètres que l'anonyme voit honorer — `docs/routes.md:248` : « en anonyme (V-02),
 * seuls `q`, `domaine` et `type` sont honorés […] un paramètre `statut=` ou `visibilite=`
 * présenté par un anonyme est IGNORÉ, jamais refusé — un refus révélerait l'existence du
 * filtre. » La liste est CLOSE, et sa clôture est le propos.
 */
export const PARAMETRES_HONORES_EN_ANONYME: readonly string[] = ['q', 'domaine', 'type'];

/**
 * Les paramètres réellement lus — un crible, en amont de toute lecture.
 *
 * IGNORER N'EST PAS « NE PAS SE SERVIR DE » : c'est ne pas pouvoir s'en servir. Le chargeur
 * ne consulte JAMAIS `url.searchParams`, il consulte ce que cette fonction en a laissé
 * passer. Une première rédaction rendait la LISTE des paramètres ignorés, que le cadre
 * sérialise dans la charge d'hydratation : deux adresses rendaient alors deux corps
 * distincts pour un écran identique.
 *
 * En session, la liste des honorés est VIDE : V-08 n'a d'axe pour aucun paramètre, `q`
 * compris. Ce n'est pas un durcissement, c'est le constat de ce que l'écran sait recevoir.
 */
export function parametresHonores(parametres: URLSearchParams, session: boolean): URLSearchParams {
	const retenus = new URLSearchParams();
	if (session) return retenus;
	for (const cle of PARAMETRES_HONORES_EN_ANONYME) {
		for (const valeur of parametres.getAll(cle)) retenus.append(cle, valeur);
	}
	return retenus;
}

/**
 * La requête demandée par l'adresse. `?q=` est du texte libre : ni validé, ni
 * refusé, ni tronqué — `segmenter()` rend des segments que Svelte échappe, de
 * sorte qu'aucune saisie ne devient du balisage.
 */
export function requeteDemandee(parametres: URLSearchParams): string {
	return parametres.get('q') ?? '';
}

/**
 * L'appelant peut-il écrire des notes quelque part ? Aucune comparaison de droit n'est
 * écrite ici : c'est la composition exacte que `peutEcrireDansLUn()` fait sur un domaine,
 * celle-ci portant sur l'arbre entier parce que l'écran qui la lit n'est rattaché à aucun
 * domaine. `RG-DRO-02` répond seule pour l'anonyme : la boucle n'est pas parcourue.
 */
export function peutEcrireQuelquePart(identite: Identite, index: IndexDesDroits): boolean {
	if (identite.type === 'anonyme') return false;
	for (const dossierId of index.parents.keys()) {
		if (capacites(resoudreDroitDeDossier(identite, dossierId, index)).ecrireDesNotes) return true;
	}
	return false;
}

export async function capaciteDEcriture(base: Base, identite: Identite): Promise<boolean> {
	if (identite.type === 'anonyme') return false;
	return peutEcrireQuelquePart(identite, await lireIndexDesDroits(base, identite));
}

/** Ce que le chargeur de `/recherche` rend à la page. */
export interface DonneesDeRecherche {
	/** `false` en anonyme — V-02 ; `true` avec une session — V-08. */
	readonly session: boolean;
	readonly vecteur: Record<string, string | boolean>;
	/** Les notes que l'identité peut lire, dans la forme de `seeds/corpus.ts`. */
	readonly notes: readonly Note[];
}

/**
 * Le chargeur de `/recherche`, côté donnée — une adresse, deux écrans : V-02 en anonyme
 * (périmètre public), V-08 en session (périmètre autorisé), et la même colonne pour tous
 * les rôles connectés.
 *
 * LE PÉRIMÈTRE EST DANS LA REQUÊTE AU MOTEUR, ET C'EST LA MÊME DÉFINITION QUE CELLE DE
 * `/` : `chercherLesNotes()` appelle `perimetreDeLecture()` et TRADUIT ce qu'elle rend en
 * filtre d'index. Une seule différence de forme subsiste, celle qu'`ADR-006` prescrit : en
 * anonyme le filtre est réduit à `visibilite = publique AND statut = publiee`.
 *
 * LES QUATRE ÉTATS DE `RG-M18-03` : l'état VIDE de V-08 est décidé sur ce que l'identité
 * peut RÉELLEMENT lire — un périmètre vide n'affiche pas « 0 résultat sur 32 ». L'état de
 * CHARGEMENT n'est jamais demandé.
 */
export async function lireLaRecherche(
	base: Base,
	client: Meilisearch,
	identite: Identite,
	url: URL,
	contexte: ContexteDeLecture
): Promise<DonneesDeRecherche> {
	const session = identite.type === 'authentifie';
	/* LE CRIBLE VIENT D'ABORD, ET `url.searchParams` N'EST PLUS LU ENSUITE. */
	const demande = parametresHonores(url.searchParams, session);

	/* LE PÉRIMÈTRE EST DANS LA REQUÊTE (`ADR-006`) : ce chargeur ne reçoit pas une
	   liste qu'il filtrerait ensuite. Les identifiants gouvernent ensuite la LECTURE
	   en base, qui ne remonte que les notes retenues. */
	const trouvees = await chercherLesNotes(base, client, identite, {
		requete: requeteDemandee(demande),
		facettes: demande
	});
	const lisibles = await lireNotes(base, contexte, trouvees.identifiants);

	if (!session) {
		return {
			session,
			/* V-02 porte l'axe `req` : `?q=` y est honoré tel quel. */
			vecteur: { etat: 'nominal', req: requeteDemandee(demande) },
			notes: lisibles
		};
	}

	return {
		session,
		vecteur: {
			/* `P-09` — la capacité vient de `capacites()`, jamais d'un rôle lu à la main. */
			droits: (await capaciteDEcriture(base, identite)) ? 'ecriture' : 'lecture',
			etat: lisibles.length === 0 ? 'vide' : 'nominal',
			/* Le mode « Sens » se DÉCLARE indisponible — voir `SENS_DISPONIBLE`. */
			'c-degrade': !SENS_DISPONIBLE
		},
		notes: lisibles
	};
}

/**
 * La projection d'une note pour la décision d'accès — trois champs, et le contenu n'en fait
 * pas partie. `ADR-006` interdit de « charger une ressource pour la refuser ensuite » :
 * lire le titre ou le corps ferait payer au refus un coût que l'inexistence ne paie pas.
 */
type ProjectionDeGuide = NotePourPerimetre;

async function projeterLeGuide(
	base: Base,
	identifiant: string
): Promise<ProjectionDeGuide | undefined> {
	const lignes = await base
		.select({
			dossierId: notes.dossierId,
			visibilite: notes.visibilite,
			statut: notes.statut
		})
		.from(notes)
		.where(eq(notes.identifiant, identifiant))
		.limit(1);
	return lignes[0];
}

/**
 * `/guides/{identifiant}` — la résolution, et elle ne dépend d'AUCUNE identité.
 * `docs/routes.md` §5.5 donne la même réponse dans les quatre colonnes : V-03 si la note
 * est publique et publiée, 404 V-04 sinon. `ARB-007` A-05 : « une seule adresse, un seul
 * rendu : la session ne change ni la route, ni la vue, ni les états ». La signature le
 * PORTE : aucune identité n'entre ici. `perimetreDeLecture()` n'est PAS appelé, et c'est
 * délibéré : le filtre entier est `noteVisibleEnAnonyme()`.
 */
export async function resoudreLeGuide(
	base: Base,
	identifiant: string
): Promise<Resolution<ProjectionDeGuide>> {
	return resoudre(await projeterLeGuide(base, identifiant), noteVisibleEnAnonyme);
}

/** Les deux écrans que `docs/routes.md` §5.5 fait rendre à une adresse non résolue. */
export type VueNonResolue = 'V-04' | 'V-26';

/**
 * L'espace public — les préfixes où la réponse ne dépend PAS de la session.
 *
 * `/guides/…` y est parce que §5.5 l'y met : sa ligne « note interne ou brouillon » rend
 * 404 V-04 dans les QUATRE colonnes. `/`, `/recherche`, `/connexion` et
 * `/mot-de-passe-oublie` y sont pour éviter qu'une adresse voisine mal formée réponde
 * différemment selon le cookie.
 */
const ESPACE_PUBLIC: readonly string[] = [
	'/guides',
	'/recherche',
	'/connexion',
	'/mot-de-passe-oublie'
];

function dansLEspacePublic(chemin: string): boolean {
	return ESPACE_PUBLIC.some((p) => chemin === p || chemin.startsWith(`${p}/`));
}

/**
 * Quel écran pour une adresse non résolue — « 404 + V-04 en anonyme, 404 + V-26 en
 * connecté », l'espace public faisant exception. CE QUE CETTE FONCTION NE REGARDE PAS, ET
 * C'EST LE POINT : elle ne reçoit ni ressource, ni raison, ni code, et ne peut donc pas
 * rendre deux écrans pour deux causes.
 */
export function vueDeLAdresseNonResolue(chemin: string, session: boolean): VueNonResolue {
	if (dansLEspacePublic(chemin)) return 'V-04';
	return session ? 'V-26' : 'V-04';
}

/**
 * La position de planche de V-26, et il n'y en a qu'une. La planche en déclare trois —
 * `supprimee`, `inexistante`, `interdite`.
 *
 * `supprimee` est la seule dérogation admise à `RG-ACC-04` : la pierre tombale nomme qui a
 * supprimé la note, quand et pourquoi. Le produit ne la sert JAMAIS — la base ne porte
 * aucune table de suppression. C'est aussi la position PAR DÉFAUT de la vue, ce qui rend
 * ce choix obligatoire. `inexistante` et `interdite` doivent être rigoureusement identiques
 * (`V-26:2628`) et ne le sont PAS dans le gel : le produit en sert UNE SEULE.
 */
export function casDeV26(): 'inexistante' {
	return 'inexistante';
}
