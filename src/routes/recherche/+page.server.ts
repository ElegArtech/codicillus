/**
 * LE CHARGEUR DE `/recherche` — une adresse, deux écrans, UN SEUL MOTEUR : V-02 sans
 * session, V-08 avec.
 *
 * CE FICHIER NE DÉCIDE AUCUN DROIT : il appelle `chercherLesNotes()` — le seul chemin de
 * recherche du dépôt, qui CALCULE son filtre depuis `resolution.ts` — puis lit en base
 * les seules notes que le moteur a consenti à rendre. L'INSTANT DE RÉFÉRENCE EST PRIS
 * ICI, et LES SEUILS VIENNENT DE LA BASE (`P-01`).
 *
 * LES FACETTES NE SONT PAS DANS LA REQUÊTE AU MOTEUR, ET C'EST LE GEL QUI LE VEUT : « le
 * nombre affiché en regard d'une valeur indique le nombre de résultats obtenus SI CETTE
 * VALEUR ÉTAIT RETENUE ». Deux conséquences, et aucune n'est un relâchement : le
 * PÉRIMÈTRE reste dans la requête au moteur (`ADR-006` — une facette n'est pas une
 * garantie d'accès), et la facette « fraîcheur », sans champ dans l'index, se lit sur la
 * note lue en base.
 *
 * `/recherche` NE REFUSE JAMAIS : un paramètre non honoré est IGNORÉ — « un refus
 * révélerait l'existence du filtre ». LE MODE « SENS » SE DÉCLARE INDISPONIBLE : `?mode=`
 * reste HONORÉ, mais tant que `SENS_DISPONIBLE` est faux le mode EFFECTIF reste
 * « mots-clés » et l'écran se déclare dégradé. `?tri=` EST HONORÉ, et l'ordre est
 * appliqué PAR LE MOTEUR.
 */
import { basePartagee } from '$lib/base/acces';
import {
	type ContexteDeLecture,
	lireConfiguration,
	lireEtiquettesParNote,
	lireNotes
} from '$lib/donnees/lecture';
import {
	SENS_DISPONIBLE,
	capaciteDEcriture,
	parametresHonores,
	requeteDemandee
} from '$lib/donnees/public';
import { instanceSansUnivers } from '$lib/donnees/amorcage';
import { compteDe } from '$lib/donnees/consultation';
import { journaliserUneRecherche } from '$lib/donnees/recherches';
import { moteurPartage } from '$lib/recherche/acces';
import {
	ORDRE_PAR_DEFAUT,
	chercherLesNotes,
	ordreDeTriDemande,
	perimetreDeLIdentite,
	type OrdreDeTri
} from '$lib/recherche/moteur';
import type { Base } from '$lib/base/acces';
import type { Identite } from '$lib/droits/resolution';
import type { Meilisearch } from 'meilisearch';
import type { Note } from '../../../seeds/corpus';
import type { PageServerLoad } from './$types';

/**
 * LES SEPT FACETTES DE `docs/routes.md` §4.2, DANS SON ORDRE — les identifiants
 * du gel. La liste est CLOSE, et sa clôture est le propos : un paramètre hors
 * liste n'a aucun chemin jusqu'à la réponse.
 *
 * ELLE N'EST PAS EXPORTÉE, et ce n'est pas un choix de style : SvelteKit REFUSE
 * tout export d'un `+page.server.ts` hors `load`, `actions`, `prerender`, `csr`,
 * `ssr`, `trailingSlash`, `config`, `entries` ou préfixé d'un souligné — la route
 * entière rend alors 500, et `pnpm check` ne le voit pas.
 */
const FACETTES_DE_LA_RECHERCHE: readonly string[] = [
	'univers',
	'domaine',
	'type',
	'statut',
	'fraicheur',
	'etiquette',
	'visibilite'
];

/**
 * LES FACETTES QUE L'ANONYME VOIT HONORER, DÉRIVÉES DU CRIBLE ET JAMAIS
 * RECOPIÉES : `parametresHonores()` reste l'unique juge, et cette constante lui
 * pose la question facette par facette. Une liste recopiée aurait pu diverger de
 * lui sans que rien ne le dise.
 */
const FACETTES_HONOREES_EN_ANONYME: readonly string[] = FACETTES_DE_LA_RECHERCHE.filter((f) =>
	parametresHonores(new URLSearchParams([[f, 'x']]), false).has(f)
);

/**
 * LE CRIBLE — les paramètres réellement lus, en amont de toute lecture.
 * IGNORER N'EST PAS « NE PAS SE SERVIR DE » : c'est ne pas pouvoir s'en servir.
 * En anonyme, le crible est celui de `$lib/donnees/public`, mot pour mot.
 */
function honores(parametres: URLSearchParams, session: boolean): URLSearchParams {
	if (!session) return parametresHonores(parametres, false);
	const retenus = new URLSearchParams();
	for (const cle of ['q', 'tri', 'mode', ...FACETTES_DE_LA_RECHERCHE]) {
		for (const valeur of parametres.getAll(cle)) retenus.append(cle, valeur);
	}
	return retenus;
}

/**
 * LES TROIS MODES DE `docs/routes.md:242` — les valeurs de `data-mode` du gel,
 * et rien d'autre. `hybride` EST LE DÉFAUT : `V-08:1004` le pose sur `div.app`,
 * et le bouton « Hybride » est le seul à naître `aria-pressed="true"`.
 */
const MODES = ['motscles', 'sens', 'hybride'] as const;
type ModeDeRecherche = (typeof MODES)[number];
const MODE_PAR_DEFAUT: ModeDeRecherche = 'hybride';

/** Le mode demandé, ou le défaut. Une valeur hors liste est IGNORÉE, pas refusée. */
function modeDemande(demande: URLSearchParams): ModeDeRecherche {
	return MODES.find((m) => m === demande.get('mode')) ?? MODE_PAR_DEFAUT;
}

/**
 * LES VALEURS DE FACETTE RETENUES — `{facette: [valeur, …]}`. À l'intérieur
 * d'une facette les valeurs sont en OU (paramètre RÉPÉTÉ), entre facettes en ET ;
 * c'est la vue, qui porte l'arithmétique du gel, qui les combine.
 *
 * Une facette sans valeur retenue est ABSENTE de l'objet, jamais présente et
 * vide : `nbFiltres()` du gel compte les valeurs des clés, et une clé vide y
 * pèserait un filtre qui n'existe pas.
 */
function facettesRetenues(
	demande: URLSearchParams,
	facettes: readonly string[]
): Record<string, readonly string[]> {
	const retenues: Record<string, readonly string[]> = {};
	for (const facette of facettes) {
		const valeurs = demande.getAll(facette);
		if (valeurs.length > 0) retenues[facette] = valeurs;
	}
	return retenues;
}

/**
 * LES NOTES DANS L'ORDRE DU MOTEUR — la pertinence, ordre de tri par défaut de
 * V-08. `lireNotes()` classe par identifiant, une lecture en base n'ayant pas de
 * raison de connaître la pertinence. Une note absente de la lecture — retirée
 * entre la requête à l'index et la requête en base — disparaît simplement, sans
 * trou ni exception.
 */
function dansLOrdreDuMoteur(lues: readonly Note[], ordre: readonly string[]): readonly Note[] {
	const parIdentifiant = new Map<string, Note>(lues.map((n) => [n.id, n]));
	const rangees: Note[] = [];
	for (const identifiant of ordre) {
		const note = parIdentifiant.get(identifiant);
		if (note !== undefined) rangees.push(note);
	}
	return rangees;
}

/**
 * LE PLAFOND DES PISTES — celui des valeurs de facette de V-08 (`max: 8`). Les
 * pistes comptent les mêmes étiquettes que la facette « Étiquette ».
 */
const MAX_PISTES = 8;

/**
 * LES PISTES DE REFORMULATION — LES ÉTIQUETTES RÉELLES DU PÉRIMÈTRE, OU RIEN.
 *
 * LA SOURCE EST LE PÉRIMÈTRE LISIBLE, ET NON LE JEU DE RÉSULTATS : le bloc ne se
 * rend QUE lorsque la recherche n'a rien rendu, donc compter sur les résultats ne
 * pourrait rendre qu'une liste vide. LA REQUÊTE COURANTE EST ÉCARTÉE — proposer le
 * mot qu'on vient de taper n'est pas une reformulation. Ordre : la plus employée
 * d'abord, puis l'alphabet français.
 */
function pistesDeReformulation(
	identifiants: readonly string[],
	etiquettesParNote: ReadonlyMap<string, readonly string[]>,
	requete: string
): readonly string[] {
	const ecartee = requete.trim().toLowerCase();
	const comptes = new Map<string, number>();
	for (const identifiant of identifiants) {
		for (const etiquette of etiquettesParNote.get(identifiant) ?? []) {
			if (etiquette.toLowerCase() === ecartee) continue;
			comptes.set(etiquette, (comptes.get(etiquette) ?? 0) + 1);
		}
	}
	return [...comptes.keys()]
		.sort((a, b) => (comptes.get(b) ?? 0) - (comptes.get(a) ?? 0) || a.localeCompare(b, 'fr'))
		.slice(0, MAX_PISTES);
}

interface DonneesDeRecherche {
	/** `false` en anonyme — V-02 ; `true` avec une session — V-08. */
	readonly session: boolean;
	/** Le vecteur d'état de la vue servie, dans la forme que le gel déclare. */
	readonly vecteur: Record<string, string | boolean>;
	/** Le résultat du moteur pour `q` seul, périmètre compris, dans son ordre. */
	readonly notes: readonly Note[];
	/**
	 * POURQUOI IL N'Y A RIEN À CHERCHER — `null` dès que le périmètre porte une
	 * note. V-08 en tire un écran qui NOMME ce qui manque et le geste qui débloque,
	 * au lieu de composer « Aucun résultat pour “” ».
	 */
	readonly motif: MotifDuVide | null;
	/** La requête demandée, telle quelle — `RG-M02-06`. */
	readonly requete: string;
	/** Les valeurs de facette retenues par l'adresse — `RG-M02-06`, `RG-M02-07`. */
	readonly retenues: Record<string, readonly string[]>;
	/** Le nombre de notes que l'identité peut lire, toutes requêtes confondues. */
	readonly perimetre: number;
	/**
	 * LA DURÉE DE LA RECHERCHE, MESURÉE — `processingTimeMs` du moteur, ET CELLE DE
	 * LA PREMIÈRE REQUÊTE SEULE : la seconde ne sert qu'à compter le périmètre, et
	 * additionner les deux annoncerait un temps que la recherche n'a pas pris.
	 *
	 * `null` quand aucune requête n'est partie — périmètre fermé. La vue rend alors
	 * le compte SANS durée : une durée qui n'existe pas ne vaut pas zéro.
	 */
	readonly dureeMs: number | null;
	/**
	 * LES PISTES DE REFORMULATION — les étiquettes les plus employées du PÉRIMÈTRE
	 * LISIBLE, jamais celles du jeu de résultats : dans l'état où le bloc se rend,
	 * ce jeu est vide par définition.
	 */
	readonly pistes: readonly string[];
	/**
	 * L'ADRESSE DU PORTAIL D'ASSISTANCE — clé `portail_assistance` de `parametres`.
	 * V-02 l'emploie pour ses deux appels à l'assistance ; V-08 ne les a pas, et ne
	 * la reçoit donc pas.
	 */
	readonly portail: string;
	/** Les notes reçues SONT le résultat du moteur : la vue ne cherche plus. */
	readonly recherchees: true;
	/** L'ordre demandé par l'adresse — celui dans lequel les notes arrivent. */
	readonly tri: OrdreDeTri;
	/**
	 * LE MODE DEMANDÉ, jamais le mode effectif. La bascule en mots-clés est un ÉTAT
	 * DE L'ÉCRAN, que la vue dérive de `c-degrade` ; envoyer ici le mode déjà rabattu
	 * ferait perdre ce que l'utilisateur a demandé, donc l'aveu que sa demande n'a
	 * pas été servie.
	 */
	readonly mode: ModeDeRecherche;
}

/**
 * POURQUOI LE PÉRIMÈTRE EST VIDE — ET LA RECHERCHE NE LE DEVINE PAS. Une
 * recherche sans requête n'est pas une recherche sans résultat : le motif est
 * décidé ICI, où la base et le moteur sont lisibles, et il nomme le geste que la
 * vue peut proposer. QUATRE MOTIFS, ET AUCUN N'EST DEVINÉ — le dernier n'est pas
 * le troisième : un rédacteur qui a des dossiers ouverts sur une instance sans
 * note ne doit pas lire « demandez l'accès ».
 */
type MotifDuVide = 'sans-index' | 'sans-univers' | 'perimetre-ferme' | 'corpus-vide';

/** Le résultat que le moteur ne peut pas rendre : aucun index, aucune mesure. */
const AUCUN_RESULTAT = {
	identifiants: [] as readonly string[],
	total: 0,
	tronque: false,
	filtre: null,
	dureeMs: null
} as const;

/**
 * L'INDEX N'EXISTE PAS ENCORE — ET CE N'EST PAS UNE PANNE, C'EST UNE INSTALLATION
 * NEUVE : `base:migrer` monte le schéma, l'index n'est posé que par la première
 * réindexation, et entre les deux `/recherche` sortait en 500. Le code est celui
 * du corps de réponse du moteur, jamais un texte comparé.
 */
function indexAbsent(erreur: unknown): boolean {
	const cause: unknown = (erreur as { cause?: unknown } | null)?.cause;
	return (
		typeof cause === 'object' &&
		cause !== null &&
		(cause as { code?: unknown }).code === 'index_not_found'
	);
}

/**
 * LE MOTIF D'UN PÉRIMÈTRE VIDE. Il n'est demandé QUE lorsque le périmètre est
 * effectivement vide : une recherche ordinaire ne touche pas ces tables.
 */
async function motifDuPerimetreVide(base: Base, identite: Identite): Promise<MotifDuVide> {
	if (identite.type !== 'authentifie') return 'corpus-vide';
	if (identite.role === 'administrateur') {
		return (await instanceSansUnivers(base)) ? 'sans-univers' : 'corpus-vide';
	}
	const perimetre = await perimetreDeLIdentite(base, identite);
	if (perimetre.tout) return 'corpus-vide';
	return perimetre.dossiers.size > 0 ? 'corpus-vide' : 'perimetre-ferme';
}

/**
 * LA LECTURE — deux requêtes au moteur, et la seconde n'est pas un luxe : la
 * requête VIDE rapporte la taille du périmètre lisible, dénominateur de la règle
 * d'affluence du gel, qui ne se déduit pas du premier compte. Elle ne lit AUCUNE
 * note, et le moteur n'est pas interrogé quand le périmètre est fermé
 * (`RG-DRO-02`).
 */
async function lireLaRecherche(
	base: Base,
	client: Meilisearch,
	identite: Identite,
	url: URL,
	contexte: ContexteDeLecture,
	portail: string
): Promise<DonneesDeRecherche> {
	const session = identite.type === 'authentifie';
	const demande = honores(url.searchParams, session);
	const requete = requeteDemandee(demande);
	/* Un `tri=` inconnu retombe sur la pertinence : ignoré, jamais refusé —
	   `docs/routes.md:248`, « un refus révélerait l'existence du filtre ». En
	   anonyme, le crible a déjà retiré le paramètre : V-02 n'a pas de sélecteur. */
	const tri = ordreDeTriDemande(demande.get('tri')) ?? ORDRE_PAR_DEFAUT;
	const mode = modeDemande(demande);

	/* L'INDEX PEUT NE PAS EXISTER — voir `indexAbsent()`. Les deux requêtes
	   partent ensemble et se rattrapent ensemble : la page se rend alors sans
	   résultat ET en disant pourquoi, plutôt qu'en 500. Toute autre panne du
	   moteur remonte telle quelle : elle n'est pas un état de l'installation. */
	const interrogation = await Promise.all([
		chercherLesNotes(base, client, identite, { requete, tri }),
		/* AUCUN TRI SUR LA SECONDE : elle ne lit aucune note et seul son TOTAL est
		   employé — le dénominateur de la règle d'affluence. Trier un compte n'a
		   pas de sens, et le demander au moteur coûterait sans rien rendre. */
		chercherLesNotes(base, client, identite, { requete: '' })
	]).catch((erreur: unknown) => {
		if (indexAbsent(erreur)) return null;
		throw erreur;
	});
	const [trouvees, toutLeLisible] = interrogation ?? [AUCUN_RESULTAT, AUCUN_RESULTAT];
	const notes = dansLOrdreDuMoteur(
		await lireNotes(base, contexte, trouvees.identifiants),
		trouvees.identifiants
	);
	const retenues = facettesRetenues(
		demande,
		session ? FACETTES_DE_LA_RECHERCHE : FACETTES_HONOREES_EN_ANONYME
	);

	/* LES PISTES NE SE CALCULENT QUE DANS L'ÉTAT OÙ ELLES SE RENDENT, et les deux
	   vues n'y arrivent que de deux façons : le moteur n'a rien rapporté, ou les
	   facettes retenues excluent tout ce qu'il a rapporté — l'arithmétique du gel
	   s'appliquant dans la vue, ce chargeur ne peut que la prévoir. Hors de ces
	   deux cas, la requête d'étiquettes ne part pas. */
	const facettesEmployees = Object.values(retenues).some((v) => v.length > 0);
	const pistes =
		trouvees.total === 0 || facettesEmployees
			? pistesDeReformulation(
					toutLeLisible.identifiants,
					await lireEtiquettesParNote(base),
					requete
				)
			: [];

	/* LE MOTIF N'EST DEMANDÉ QUE LORSQUE LE PÉRIMÈTRE EST VIDE : une recherche
	   ordinaire ne touche ni la table des univers ni celle des droits. */
	const motif =
		toutLeLisible.total > 0
			? null
			: interrogation === null
				? ('sans-index' as const)
				: await motifDuPerimetreVide(base, identite);

	const commun = {
		notes,
		motif,
		portail,
		requete,
		retenues,
		perimetre: toutLeLisible.total,
		dureeMs: trouvees.dureeMs,
		pistes,
		recherchees: true as const,
		tri,
		mode
	};

	if (!session) {
		/* V-02 porte l'axe `req` : `?q=` y est honoré tel quel. Absent, la vue
		   rend le champ vide — le premier état de la planche de V-01/V-02. */
		return { session, vecteur: { etat: 'nominal', req: requete }, ...commun };
	}

	return {
		session,
		vecteur: {
			/* P-09 — la capacité vient de `capacites()`, jamais d'un rôle lu à la
			   main. Elle décide de l'émission des actions d'écriture de V-08. */
			droits: (await capaciteDEcriture(base, identite)) ? 'ecriture' : 'lecture',
			/* L'ÉTAT « VIDE » EST CELUI DU PÉRIMÈTRE, PAS CELUI DE LA REQUÊTE. Une
			   requête sans résultat se rend dans la zone de résultats, par la
			   condition du gel (`V-08:1969`) que la vue porte ; un périmètre vide,
			   lui, n'a rien à chercher et rien à afficher, quelle que soit `q`. */
			etat: toutLeLisible.total === 0 ? 'vide' : 'nominal',
			/* Le mode « Sens » se DÉCLARE indisponible — voir `SENS_DISPONIBLE`. */
			'c-degrade': !SENS_DISPONIBLE
		},
		...commun
	};
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	/* UNE SEULE LECTURE DE `parametres` : les seuils et l'adresse du portail en
	   sortent ensemble. `lireSeuils()` faisait déjà cette requête et jetait le
	   reste ; `P-01` reste tenue — les seuils viennent toujours du même endroit. */
	const config = await lireConfiguration(base);
	const contexte = {
		maintenant: new Date(),
		seuils: { frais: config.seuilFrais, vieillissant: config.seuilVieillissant }
	};
	const recherche = await lireLaRecherche(
		base,
		moteurPartage(),
		locals.identite,
		url,
		contexte,
		config.portailAssistance
	);

	/* LA RECHERCHE SE JOURNALISE — `RG-M02-03`, « toute recherche est journalisée :
	   requête, horodatage, nombre de résultats, ouverture éventuelle ». C'est le
	   signal de trou documentaire que `/console/analytique` exploite, et il n'existe
	   qu'ici : aucun autre chemin du dépôt n'interroge le moteur pour un lecteur.

	   APRÈS LA LECTURE, jamais avant : le nombre inscrit est celui des notes
	   SERVIES, donc ce que l'appelant a vu — le total de l'index compterait des
	   notes hors périmètre. Une requête vide n'écrit rien (voir le module).

	   EN ANONYME, `compteDe()` rend `null` : l'entrée existe, sans identifiant
	   d'utilisateur (`RG-M15-02`). Et c'est une écriture sur une requête de
	   lecture, comme la consultation d'une note — la règle désigne cette
	   requête-ci. */
	await journaliserUneRecherche(base, {
		terme: recherche.requete,
		compte: compteDe(locals.identite),
		resultats: recherche.notes.length,
		maintenant: contexte.maintenant
	});

	return recherche;
};
