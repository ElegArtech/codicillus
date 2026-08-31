/**
 * LE CHEMIN PUBLIC — `/recherche`, `/guides/{identifiant}`, et la réponse à
 * toute adresse non résolue.
 *
 * Trois adresses, une seule propriété à tenir : **rien de ce qui n'est pas
 * public ne doit pouvoir en sortir, et l'existence d'une ressource ne doit pas
 * se lire dans la réponse.** Ce module est le point où cette propriété se
 * décide ; les trois chargeurs qui l'appellent n'écrivent aucune règle.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI — `src/lib/droits/resolution.ts` LES
 * PORTE, ET LUI SEUL
 *
 * `ECART-047` É-1 a nommé la cause des trois fuites du 20 août : « aucune route
 * de page n'appelle `src/lib/droits/resolution.ts` ». Ce module l'appelle, et
 * n'écrit aucune comparaison de visibilité, de statut, de rôle ni de droit :
 *
 *   · `noteVisibleEnAnonyme()` décide de ce qui est PUBLIC — publique **et**
 *     publiée, les deux ;
 *   · `perimetreDeLecture()` + `noteLisible()` décident du périmètre AUTORISÉ,
 *     par `identifiantsLisibles()` de `./accueil` ;
 *   · `resoudreDroitDeDossier()` + `capacites()` décident de la capacité
 *     d'écriture, par la table de CDC §2.3 et jamais par une comparaison écrite
 *     à la main.
 *
 * LA DEMI-RÈGLE D'`ECART-047` EST FERMÉE ICI AUSSI. `seeds/corpus.ts:2452`
 * définit `notesPubliques()` par la seule visibilité ; `resolution.ts:328` exige
 * **publique ET publiée**, et `ADR-006` en fait « le filtre entier du régime
 * anonyme, sans exception ni chemin dérogatoire ». Ce module n'emploie jamais
 * `notesPubliques()`. La moitié manquante — le statut — n'est exercée par aucune
 * donnée du corpus livré (`accueil.ts` l'a mesuré : 0 note publique+brouillon) :
 * `public.test.ts` porte le cas SYNTHÉTIQUE qui l'exerce, indépendamment de
 * l'état du dépôt (`P-5`, `P-26`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE POINT DUR — `V-04:2219`, « LA VÉRIFICATION LA PLUS IMPORTANTE DE CETTE VUE »
 *
 * « Une adresse inexistante et une note existante non publique doivent produire
 * un rendu strictement identique. » `resoudreLeGuide()` est le seul point où
 * cela se joue, et la garantie n'est pas une intention :
 *
 *   1. la requête est la MÊME dans les deux cas — une projection par
 *      identifiant, sans contenu. Une note interne coûte la même requête qu'une
 *      note absente : le grief de latence d'`ARB-005` ne trouve pas de prise ;
 *   2. la décision passe par `resoudre()`, dont le type de retour n'a PAS de
 *      troisième forme — ni variante `interdit`, ni champ `raison` ;
 *   3. le refus sort par `refuserLAdresse()`, l'unique point de sortie du
 *      dépôt, dont le type de retour `never` interdit qu'un appelant reprenne
 *      la main pour nuancer.
 *
 * Rien, en aval, n'a de quoi distinguer les deux cas. `ADR-007` : « il n'existe
 * pas de branche “interdit” ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE PROUVE PAS
 *
 * L'indiscernabilité de `RG-ACC-04` se mesure par `pnpm test:etancheite`, pas
 * ici. `P-09` n'est pas davantage déclarée tenue : les vues gelées POSENT les
 * actions d'écriture puis les cachent par attribut, et aucun lot de câblage ne
 * les rouvre (`docs/omissions-p09.md`).
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

/* ═══════════════════════════════════ Les lacunes déclarées ═════════════ */

/**
 * Une donnée qu'un écran du chemin public affiche et que ce lot ne peut pas
 * lui faire porter.
 *
 * Le type existe pour que la lacune soit **comptée et éprouvable**, jamais
 * seulement racontée : `public.test.ts` en fait une assertion, de sorte qu'une
 * lacune refermée par un lot futur fasse rougir le test plutôt que de laisser
 * un commentaire périmé derrière elle. Même forme que
 * `SANS_CONTREPARTIE_EN_BASE` de `./accueil`.
 */
export interface LacuneDuCheminPublic {
	/** Ce que l'écran montre. */
	readonly donnee: string;
	/** L'écran qui la montre. */
	readonly vue: string;
	/** Ce que le produit affiche à la place. */
	readonly affichage: string;
	/** Pourquoi ce lot ne peut pas la porter. */
	readonly motif: string;
}

/**
 * LES SIX LACUNES DU CHEMIN PUBLIC — relevées sur les signatures des cinq vues
 * concernées, jamais supposées.
 *
 * Elles ont toutes la MÊME cause, et elle est de contrat : « tu ne touches
 * aucun fichier de `src/vues/` ». Les cinq écrans sont conformes au pixel et le
 * restent ; ce qu'ils ne savent pas recevoir, ils ne le reçoivent pas. Rien
 * n'est comblé, aucune valeur n'est inventée (`P-02`).
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

/* ═══════════════════════════════════ Le mode de recherche ══════════════ */

/**
 * LES TROIS MODES DE `RG-M02-01`, ET CELUI QUI EXISTE.
 *
 * `STACK-TECHNIQUE.md` §4.2 veut Meilisearch pour les trois, et **l'index est
 * désormais alimenté** (`T-051`) : les mots-clés viennent du moteur. Le mode
 * « Sens », lui, a besoin de VECTEURS, et il n'en existe aucun — le service
 * d'embeddings est optionnel, le modèle n'est pas fixé par `compose.yaml`, et
 * aucun lot ne les calcule. Deux principes se rejoignent ici :
 *
 *   · `P-02` — aucune valeur illustrative. Un mode « Sens » qui rendrait en
 *     réalité des résultats de mots-clés serait une simulation, et la pire :
 *     indétectable par l'utilisateur ;
 *   · `P-10` — dégradation, jamais panne. La brique indisponible dégrade la
 *     fonctionnalité concernée « avec un message clair, sans jamais empêcher
 *     l'usage du reste ».
 *
 * Le gel porte déjà cet état, et il porte sa phrase : V-08 pose son mode en
 * mots-clés, se déclare dégradée, désactive le bouton « Sens » et affiche
 * « Recherche par sens momentanément indisponible — les résultats sont établis
 * en mots-clés » (`V-08.svelte`, position de planche `c-degrade`).
 * `RG-M02-01` exige que la bascule soit ANNONCÉE, pas silencieuse : c'est
 * exactement ce que cette position rend.
 *
 * LE CONSTAT N'EST PLUS ÉCRIT ICI, IL EST DÉRIVÉ. `SENS_DISPONIBLE` vient
 * désormais des RÉGLAGES DE L'INDEX, où l'absence d'embedder est la condition
 * mécanique de l'indisponibilité du mode. Un booléen écrit à la main aurait
 * demandé qu'on se souvienne de le changer ; celui-ci suit le réglage.
 *
 * `docs/routes.md:242` admet `?mode=motscles`, `sens` et `hybride`. Les deux
 * derniers ont besoin de vecteurs : le paramètre n'est pas dans la liste close
 * des honorés, donc il n'est pas lu — ni pour être servi, ni pour être refusé.
 */
export { SENS_DISPONIBLE };

/* ═══════════════════════════════════ Les paramètres d'adresse ══════════ */

/**
 * LES PARAMÈTRES QUE L'ANONYME VOIT HONORER — `docs/routes.md:248`, recopiée :
 *
 *   « En anonyme (V-02), seuls `q`, `domaine` et `type` sont honorés […] Un
 *     paramètre `statut=` ou `visibilite=` présenté par un anonyme est IGNORÉ,
 *     jamais refusé — un refus révélerait l'existence du filtre. »
 *
 * La liste est CLOSE, et sa clôture est le propos.
 */
export const PARAMETRES_HONORES_EN_ANONYME: readonly string[] = ['q', 'domaine', 'type'];

/**
 * LES PARAMÈTRES RÉELLEMENT LUS — un crible, en amont de toute lecture.
 *
 * IGNORER N'EST PAS « NE PAS SE SERVIR DE » : c'est ne pas pouvoir s'en servir.
 * Le chargeur ne consulte JAMAIS `url.searchParams` ; il consulte ce que cette
 * fonction en a laissé passer. Un paramètre hors liste n'a donc aucun chemin
 * jusqu'à la réponse — ni pour la changer, ni pour être renvoyé au client, ni
 * pour être refusé. `docs/routes.md:248` : « un refus révélerait l'existence du
 * filtre ».
 *
 * MESURÉ SUR LE PRODUIT CONSTRUIT, et la première rédaction ne tenait pas : le
 * chargeur rendait la LISTE des paramètres ignorés, que le cadre sérialise dans
 * la charge d'hydratation. `/recherche?q=…` et
 * `/recherche?q=…&statut=…&visibilite=…` rendaient alors deux corps distincts —
 * 9 700 et 9 721 octets — pour un écran identique. Ignorer, c'était encore
 * répondre quelque chose. Depuis ce crible, les deux corps sont identiques à
 * l'octet.
 *
 * En session, la liste des honorés est VIDE : V-08 n'a d'axe pour aucun
 * paramètre, `q` compris (lacune n° 3 ci-dessus). Ce n'est pas un durcissement,
 * c'est le constat de ce que l'écran sait recevoir.
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
 * La requête demandée par l'adresse. `?q=` est du texte libre : il n'est ni
 * validé, ni refusé, ni tronqué — `chercher()` le découpe en termes, et
 * `segmenter()` rend des segments que Svelte échappe, de sorte qu'aucune saisie
 * ne devient du balisage.
 */
export function requeteDemandee(parametres: URLSearchParams): string {
	return parametres.get('q') ?? '';
}

/* ═══════════════════════════════════ La capacité d'écriture ═══════════ */

/**
 * L'APPELANT PEUT-IL ÉCRIRE DES NOTES QUELQUE PART ?
 *
 * Aucune comparaison de droit n'est écrite ici : `resoudreDroitDeDossier()`
 * remonte l'arborescence (`RG-DRO-01`), `capacites()` répond par la table de
 * CDC §2.3. C'est la composition exacte que `peutEcrireDansLUn()` de
 * `./rangement` fait sur un domaine ; celle-ci porte sur l'arbre entier, parce
 * que l'écran qui la lit — la barre de recherche, la page non résolue — n'est
 * rattaché à aucun domaine.
 *
 * `RG-DRO-02` répond seule pour l'anonyme : aucun droit explicite, aucune
 * capacité. La boucle n'est même pas parcourue.
 */
export function peutEcrireQuelquePart(identite: Identite, index: IndexDesDroits): boolean {
	if (identite.type === 'anonyme') return false;
	for (const dossierId of index.parents.keys()) {
		if (capacites(resoudreDroitDeDossier(identite, dossierId, index)).ecrireDesNotes) return true;
	}
	return false;
}

/** Les deux projections lues, puis la décision. */
export async function capaciteDEcriture(base: Base, identite: Identite): Promise<boolean> {
	if (identite.type === 'anonyme') return false;
	return peutEcrireQuelquePart(identite, await lireIndexDesDroits(base, identite));
}

/* ═══════════════════════════════════ `/recherche` ══════════════════════ */

/** Ce que le chargeur de `/recherche` rend à la page. */
export interface DonneesDeRecherche {
	/** `false` en anonyme — V-02 ; `true` avec une session — V-08. */
	readonly session: boolean;
	/** Le vecteur d'état de la vue servie, dans la forme que le gel déclare. */
	readonly vecteur: Record<string, string | boolean>;
	/** Les notes que l'identité peut lire, dans la forme de `seeds/corpus.ts`. */
	readonly notes: readonly Note[];
}

/**
 * LE CHARGEUR DE `/recherche`, CÔTÉ DONNÉE — une adresse, deux écrans.
 *
 * `docs/routes.md` §5.5, ligne « `/`, `/recherche` » : **V-02 en anonyme,
 * périmètre public ; V-08 en session, périmètre autorisé**, et la même colonne
 * pour tous les rôles connectés.
 *
 * LE PÉRIMÈTRE EST DANS LA REQUÊTE AU MOTEUR, ET C'EST LA MÊME DÉFINITION QUE
 * CELLE DE `/`. Le chargeur de `/` appelle `identifiantsLisibles()`, qui compose
 * `perimetreDeLecture()` et `noteLisible()` ; celui-ci passe par
 * `chercherLesNotes()`, qui appelle `perimetreDeLecture()` et TRADUIT ce qu'elle
 * rend en filtre d'index. Une seule résolution, deux expressions — et la seconde
 * n'est pas une réécriture : elle transporte le résultat de la première.
 *
 * Une seule différence de forme subsiste, celle qu'`ADR-006` prescrit : en
 * anonyme, le filtre est réduit à `visibilite = publique AND statut = publiee`.
 * Cette réduction est EXACTE et non approchée, et elle est éprouvée sur des
 * corpus synthétiques par `src/lib/recherche/perimetre.test.ts` — le dossier
 * porteur d'une note publique et publiée est toujours dans le périmètre anonyme,
 * par construction de `perimetreAnonyme()`.
 *
 * LES QUATRE ÉTATS DE `RG-M18-03`. L'état VIDE de V-08 est décidé sur ce que
 * l'identité peut RÉELLEMENT lire : un périmètre vide n'affiche pas « 0
 * résultat sur 32 », il affiche l'état vide de la planche. Trois des cinq
 * comptes semés sont dans ce cas — le corpus ne porte aucune ligne de
 * `droits_de_dossier` —, et ce zéro n'est pas inventé : c'est le nombre exact
 * de ce qu'ils peuvent lire. V-02 n'a pas cet axe : sa planche ne déclare que
 * `nominal` et `chargement`, et son absence de résultat se rend dans la zone de
 * résultats elle-même.
 *
 * L'ÉTAT DE CHARGEMENT n'est jamais demandé : une réponse de serveur est rendue
 * quand la donnée est là. Il appartient au rendu client, et `ARB-011` le range
 * hors du squelette.
 */
export async function lireLaRecherche(
	base: Base,
	client: Meilisearch,
	identite: Identite,
	url: URL,
	contexte: ContexteDeLecture
): Promise<DonneesDeRecherche> {
	const session = identite.type === 'authentifie';
	/* LE CRIBLE VIENT D'ABORD, ET `url.searchParams` N'EST PLUS LU ENSUITE :
	   ce qui n'est pas honoré n'a aucun chemin jusqu'à la réponse. */
	const demande = parametresHonores(url.searchParams, session);

	/* LE PÉRIMÈTRE EST DANS LA REQUÊTE — `ADR-006`. Ce chargeur ne reçoit pas une
	   liste qu'il filtrerait ensuite : il reçoit ce que le moteur a consenti à
	   rendre sous le filtre que `chercherLesNotes()` a calculé de l'identité.
	   Les identifiants gouvernent ensuite la LECTURE en base, qui ne remonte donc
	   que les notes retenues — `RG-ACC-01`, « au plus près de la donnée ». */
	const trouvees = await chercherLesNotes(base, client, identite, {
		requete: requeteDemandee(demande),
		facettes: demande
	});
	const lisibles = await lireNotes(base, contexte, trouvees.identifiants);

	if (!session) {
		return {
			session,
			/* V-02 porte l'axe `req` : `?q=` y est honoré tel quel. Absent, la vue
			   rend le champ vide — le premier état de la planche de V-01/V-02. */
			vecteur: { etat: 'nominal', req: requeteDemandee(demande) },
			notes: lisibles
		};
	}

	return {
		session,
		vecteur: {
			/* P-09 — la capacité vient de `capacites()`, jamais d'un rôle lu à la
			   main. Elle décide de l'émission des actions d'écriture de V-08. */
			droits: (await capaciteDEcriture(base, identite)) ? 'ecriture' : 'lecture',
			etat: lisibles.length === 0 ? 'vide' : 'nominal',
			/* Le mode « Sens » se DÉCLARE indisponible — voir `SENS_DISPONIBLE`. */
			'c-degrade': !SENS_DISPONIBLE
		},
		notes: lisibles
	};
}

/* ═══════════════════════════════════ `/guides/{identifiant}` ═══════════ */

/**
 * LA PROJECTION D'UNE NOTE POUR LA DÉCISION D'ACCÈS — trois champs, et le
 * contenu n'en fait pas partie.
 *
 * `ADR-006` interdit de « charger une ressource pour la refuser ensuite ».
 * Le titre, le corps et l'auteur ne sont pas ici : une décision d'accès n'en a
 * pas besoin, et les lire ferait payer au refus un coût que l'inexistence ne
 * paie pas — la fuite de latence d'`ARB-005`.
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
 * `/guides/{identifiant}` — LA RÉSOLUTION, ET ELLE NE DÉPEND D'AUCUNE IDENTITÉ.
 *
 * `docs/routes.md` §5.5 donne la même réponse dans les quatre colonnes :
 * **V-03** si la note est publique et publiée, **404 V-04** sinon — pour
 * l'anonyme, le connecté sans droit, le connecté avec droit ET
 * l'administrateur. `ARB-007` A-05 en donne le motif : « une seule adresse, un
 * seul rendu : la session ne change ni la route, ni la vue, ni les états ».
 *
 * La signature le PORTE : aucune identité n'entre ici. Une branche par persona
 * ne peut donc pas s'y glisser, et l'administrateur ne lit pas par cette
 * adresse ce qu'un anonyme n'y lit pas — ce qui est aussi ce qui rend la
 * réponse indépendante du cookie, donc non révélatrice.
 *
 * `perimetreDeLecture()` n'est PAS appelé, et c'est délibéré : son propre
 * commentaire tranche l'emploi — « il existe deux périmètres, et LA ROUTE
 * CHOISIT LEQUEL […] le périmètre PUBLIC est celui de `/guides/{identifiant}`,
 * servi aux quatre personas ». Le filtre entier est
 * `noteVisibleEnAnonyme()`.
 */
export async function resoudreLeGuide(
	base: Base,
	identifiant: string
): Promise<Resolution<ProjectionDeGuide>> {
	return resoudre(await projeterLeGuide(base, identifiant), noteVisibleEnAnonyme);
}

/* ═══════════════════════════════════ L'adresse non résolue ═════════════ */

/** Les deux écrans que `docs/routes.md` §5.5 fait rendre à une adresse non résolue. */
export type VueNonResolue = 'V-04' | 'V-26';

/**
 * L'ESPACE PUBLIC — les préfixes où la réponse ne dépend PAS de la session.
 *
 * `/guides/…` y est parce que §5.5 l'y met : sa ligne « note interne ou
 * brouillon » rend **404 V-04** dans les QUATRE colonnes, administrateur
 * compris. C'est la conséquence directe d'`ARB-007` A-05 — un seul rendu, quelle
 * que soit la session : si la page servie ne change pas avec le cookie, la page
 * d'échec ne le peut pas davantage.
 *
 * `/` et `/recherche` n'échouent jamais en 404 (elles sont servies à tous), et
 * `/connexion` et `/mot-de-passe-oublie` sont du même espace : les y ranger ne
 * change rien de mesurable et évite qu'une adresse voisine mal formée réponde
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
 * QUEL ÉCRAN POUR UNE ADRESSE NON RÉSOLUE — `docs/routes.md` §3.1 et §5.5.
 *
 * La règle générale est « **404 + V-04** en anonyme, **404 + V-26** en
 * connecté » (`docs/routes.md:90`). L'espace public y fait exception, et §5.5
 * l'écrit ligne par ligne : `/guides/{id}` non public rend V-04 aux quatre
 * personas.
 *
 * CE QUE CETTE FONCTION NE REGARDE PAS, ET C'EST LE POINT : elle ne reçoit ni
 * ressource, ni raison, ni code. Elle ne sait pas POURQUOI l'adresse n'a rien
 * rapporté, et elle ne peut donc pas rendre deux écrans différents pour deux
 * causes différentes. Le chemin et la session sont l'un et l'autre connus de
 * l'appelant AVANT toute résolution.
 */
export function vueDeLAdresseNonResolue(chemin: string, session: boolean): VueNonResolue {
	if (dansLEspacePublic(chemin)) return 'V-04';
	return session ? 'V-26' : 'V-04';
}

/**
 * LA POSITION DE PLANCHE DE V-26, ET IL N'Y EN A QU'UNE.
 *
 * La planche en déclare trois — `supprimee`, `inexistante`, `interdite`.
 *
 *   · `supprimee` est **la seule dérogation admise à `RG-ACC-04`**
 *     (`docs/routes.md:163`) : la pierre tombale nomme qui a supprimé la note,
 *     quand et pourquoi, et « n'est possible que parce que l'utilisateur a des
 *     droits sur le domaine concerné ». Le produit ne la sert JAMAIS : la base
 *     ne porte aucune table de suppression, et les valeurs de la vue sont
 *     celles du gel. La rendre serait affirmer une disparition qui n'a pas eu
 *     lieu, avec un auteur et un motif inventés — `P-02` au carré.
 *     **C'est aussi la position PAR DÉFAUT de la vue** : ne rien passer la
 *     servirait, ce qui rend ce choix obligatoire et non décoratif.
 *   · `inexistante` et `interdite` doivent être rigoureusement identiques
 *     (`V-26:2628`), et elles ne le sont PAS dans le gel : les deux positions
 *     portent deux adresses distinctes, donc deux requêtes de suggestion
 *     distinctes. Le produit en sert **une seule**, toujours la même, et
 *     l'identité des deux cas est alors une propriété du code, non un espoir.
 */
export function casDeV26(): 'inexistante' {
	return 'inexistante';
}
