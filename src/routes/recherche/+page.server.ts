/**
 * LE CHARGEUR DE `/recherche` — une adresse, deux écrans, UN SEUL MOTEUR.
 *
 * `docs/routes.md` §3.1 et §5.5 : **V-02 Recherche publique** sans session,
 * **V-08 Recherche** avec session, et la même colonne pour tous les rôles
 * connectés. La route est une, donc le chargeur est un.
 *
 * CE FICHIER NE DÉCIDE AUCUN DROIT. Il lit l'identité que `src/hooks.server.ts`
 * a posée, appelle `chercherLesNotes()` — le seul chemin de recherche du dépôt,
 * qui CALCULE son filtre depuis `src/lib/droits/resolution.ts` — puis lit en
 * base les seules notes que le moteur a consenti à rendre. Aucune comparaison de
 * visibilité, de statut, de rôle ou de droit ne s'écrit ici.
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, ET NULLE PART AILLEURS, comme au
 * chargeur de `/` : la couche de lecture le reçoit en paramètre pour rester
 * reproductible, donc mesurable. LES SEUILS VIENNENT DE LA BASE — `P-01` veut
 * une seule définition de la fraîcheur, donc un seul jeu de seuils.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI CHANGE — LES DEUX ÉCRANS CESSENT DE CHERCHER EUX-MÊMES
 *
 * Jusqu'ici les deux vues portaient leur propre correspondance : V-02 rejouait
 * `chercher()` — le port de la fabrique de maquette — sur les notes reçues, et
 * V-08 cherchait « restauration base », valeur écrite au gel, quelle que soit
 * l'adresse demandée. Une note créée à l'instant et cherchée par son titre exact
 * ne sortait donc nulle part en session, et ne sortait en anonyme que si une
 * SECONDE implémentation de la recherche — celle de la maquette, qui n'inspecte
 * ni le corps ni le rangement — voulait bien la reconnaître.
 *
 * Désormais : **le moteur cherche, les vues rendent.** Les notes passées aux
 * deux écrans SONT le résultat de l'index, dans l'ordre du moteur, et les vues
 * le savent — c'est ce que dit la propriété `recherchees`. `RG-M02-01` mots-clés
 * a donc une seule implémentation, et c'est `chercherLesNotes()`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES FACETTES NE SONT PAS DANS LA REQUÊTE AU MOTEUR, ET C'EST LE GEL QUI LE
 * VEUT
 *
 * `docs/routes.md` §4.2 renvoie à `creerFacettes.passe()` (`V-08:1813-1821`)
 * pour la sémantique de combinaison, et la règle de comptage de `V-08:1782` est
 * inséparable de la façon dont le gel calcule : *« le nombre affiché en regard
 * d'une valeur indique le nombre de résultats obtenus SI CETTE VALEUR ÉTAIT
 * RETENUE, les autres facettes restant appliquées »*. Le gel obtient ce compte
 * en cherchant SANS facette — `fac.rendre(base)` où `base = chercher(q)`,
 * `V-08:1959-1963` — puis en éprouvant chaque facette sur cette base.
 *
 * Ce chargeur fait donc exactement cela : une requête au moteur pour `q` seul,
 * PÉRIMÈTRE COMPRIS, et les valeurs de facette retenues sont passées à la vue,
 * qui rejoue l'arithmétique du gel. Deux conséquences, et aucune n'est un
 * relâchement :
 *
 *   · le PÉRIMÈTRE reste dans la requête au moteur (`ADR-006` : « la requête
 *     envoyée au moteur NE PEUT PAS rapporter un document interdit »). Une
 *     facette n'est pas une garantie d'accès : c'est un affinage, et elle ne
 *     peut que restreindre ce que le périmètre a déjà consenti ;
 *   · la facette « fraîcheur » de §4.2, qui n'a **aucun champ dans l'index**
 *     (`notes-indexees.ts` : `P-01` interdit un second calcul), redevient
 *     honorable comme les six autres, puisqu'elle se lit sur la note lue en
 *     base — là où la fraîcheur est calculée une fois pour toutes.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `/recherche` NE REFUSE JAMAIS — ET C'EST UNE EXIGENCE, PAS UNE COMMODITÉ
 *
 * `docs/routes.md:248` : « Un paramètre `statut=` ou `visibilite=` présenté par
 * un anonyme est IGNORÉ, jamais refusé — un refus révélerait l'existence du
 * filtre. » Ce chargeur ne porte donc AUCUN `error()`, aucune redirection et
 * aucune validation de paramètre. Le crible vient en premier et
 * `url.searchParams` n'est plus lu ensuite : ce qui n'est pas honoré n'a aucun
 * chemin jusqu'à la réponse — ni pour la changer, ni pour être renvoyé au
 * client, ni pour être refusé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE MODE « SENS » SE DÉCLARE INDISPONIBLE
 *
 * L'index sert les mots-clés. Le mode « Sens » a besoin de VECTEURS, et aucun
 * n'existe : le service d'embeddings est optionnel et le modèle n'est pas fixé.
 * `SENS_DISPONIBLE` porte le constat — dérivé des réglages de l'index —, et
 * V-08 porte la phrase du gel : « Recherche par sens momentanément
 * indisponible ». `P-10` — dégradation, jamais panne ; `P-02` — jamais de
 * simulation. `?mode=` et `?tri=` ne sont donc PAS dans la liste close des
 * paramètres honorés : les quatre ordres de tri autres que « pertinence » ne
 * sont écrits dans AUCUNE source gelée (voir `trier()` en V-08), et les
 * inventer serait le comblement que `CLAUDE.md` §2 interdit.
 */
import { basePartagee } from '$lib/base/acces';
import { type ContexteDeLecture, lireNotes, lireSeuils } from '$lib/donnees/lecture';
import {
	SENS_DISPONIBLE,
	capaciteDEcriture,
	parametresHonores,
	requeteDemandee
} from '$lib/donnees/public';
import { moteurPartage } from '$lib/recherche/acces';
import { chercherLesNotes } from '$lib/recherche/moteur';
import type { Base } from '$lib/base/acces';
import type { Identite } from '$lib/droits/resolution';
import type { Meilisearch } from 'meilisearch';
import type { Note } from '../../../seeds/corpus';
import type { PageServerLoad } from './$types';

/**
 * LES SEPT FACETTES DE `docs/routes.md` §4.2, DANS SON ORDRE — et ce sont les
 * identifiants de `V-08:1938-1946`, jamais des noms inventés.
 *
 * La liste est CLOSE, et sa clôture est le propos : un paramètre hors liste n'a
 * aucun chemin jusqu'à la réponse.
 *
 * ELLE N'EST PAS EXPORTÉE, et ce n'est pas un choix de style : SvelteKit REFUSE
 * tout export d'un `+page.server.ts` qui ne soit pas `load`, `actions`,
 * `prerender`, `csr`, `ssr`, `trailingSlash`, `config`, `entries` ou préfixé
 * d'un souligné — la route entière rend alors 500, et `pnpm check` ne le voit
 * pas. Mesuré sur cette copie avant correction.
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
 * LES FACETTES QUE L'ANONYME VOIT HONORER — `docs/routes.md:248`, recopiée :
 * « seuls `q`, `domaine` et `type` sont honorés ». Le brief V-02 réduit ses
 * facettes à « domaine, type de note. **Pas de statut, pas de visibilité, pas
 * d'étiquette interne** », et V-02 n'en affiche pas d'autres.
 *
 * ELLE EST DÉRIVÉE DU CRIBLE, JAMAIS RECOPIÉE. `parametresHonores()` de
 * `$lib/donnees/public` reste l'unique juge de ce qu'un anonyme voit honorer :
 * cette constante lui pose la question facette par facette. Une liste recopiée
 * aurait pu diverger de lui sans que rien ne le dise.
 */
const FACETTES_HONOREES_EN_ANONYME: readonly string[] = FACETTES_DE_LA_RECHERCHE.filter((f) =>
	parametresHonores(new URLSearchParams([[f, 'x']]), false).has(f)
);

/**
 * LE CRIBLE — les paramètres réellement lus, en amont de toute lecture.
 *
 * IGNORER N'EST PAS « NE PAS SE SERVIR DE » : c'est ne pas pouvoir s'en servir.
 * En anonyme, le crible est celui de `$lib/donnees/public`, mot pour mot. En
 * session, les sept facettes de §4.2 s'ajoutent à `q` — V-08 les affiche toutes
 * les sept, et c'est ce que l'écran sait recevoir qui décide.
 */
function honores(parametres: URLSearchParams, session: boolean): URLSearchParams {
	if (!session) return parametresHonores(parametres, false);
	const retenus = new URLSearchParams();
	for (const cle of ['q', ...FACETTES_DE_LA_RECHERCHE]) {
		for (const valeur of parametres.getAll(cle)) retenus.append(cle, valeur);
	}
	return retenus;
}

/**
 * LES VALEURS DE FACETTE RETENUES — `{facette: [valeur, …]}`.
 *
 * `docs/routes.md` §4.2 : à l'intérieur d'une facette les valeurs sont en OU
 * (paramètre RÉPÉTÉ), entre facettes en ET. Un paramètre répété rend donc
 * plusieurs valeurs pour la même facette, et c'est la vue — qui porte
 * l'arithmétique du gel — qui les combine.
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
 * LES NOTES DANS L'ORDRE DU MOTEUR — la pertinence, qui est l'ordre de tri par
 * défaut de V-08 (`V-08:1191-1195`, aucune `<option>` marquée `selected`).
 *
 * `lireNotes()` classe par identifiant, parce qu'une lecture en base n'a pas de
 * raison de connaître la pertinence. Le classement est donc RESTITUÉ ici, depuis
 * la liste que le moteur a rendue : une note absente de la lecture — retirée
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

/** Ce que le chargeur de `/recherche` rend à la page. */
interface DonneesDeRecherche {
	/** `false` en anonyme — V-02 ; `true` avec une session — V-08. */
	readonly session: boolean;
	/** Le vecteur d'état de la vue servie, dans la forme que le gel déclare. */
	readonly vecteur: Record<string, string | boolean>;
	/** Le résultat du moteur pour `q` seul, périmètre compris, dans son ordre. */
	readonly notes: readonly Note[];
	/** La requête demandée, telle quelle — `RG-M02-06`. */
	readonly requete: string;
	/** Les valeurs de facette retenues par l'adresse — `RG-M02-06`, `RG-M02-07`. */
	readonly retenues: Record<string, readonly string[]>;
	/** Le nombre de notes que l'identité peut lire, toutes requêtes confondues. */
	readonly perimetre: number;
	/** Les notes reçues SONT le résultat du moteur : la vue ne cherche plus. */
	readonly recherchees: true;
}

/**
 * LA LECTURE — deux requêtes au moteur, et la seconde n'est pas un luxe.
 *
 * La première rapporte le résultat de `q`. La seconde, requête VIDE, rapporte la
 * taille du périmètre lisible : c'est le dénominateur de la règle d'affluence du
 * gel (`V-08:2021` — « le seuil porte sur la part du corpus atteinte, pas sur un
 * nombre absolu »), et il ne se déduit pas du premier compte. Elle ne lit AUCUNE
 * note : seul son total est employé, et le moteur n'est même pas interrogé quand
 * le périmètre est fermé (`RG-DRO-02`).
 */
async function lireLaRecherche(
	base: Base,
	client: Meilisearch,
	identite: Identite,
	url: URL,
	contexte: ContexteDeLecture
): Promise<DonneesDeRecherche> {
	const session = identite.type === 'authentifie';
	const demande = honores(url.searchParams, session);
	const requete = requeteDemandee(demande);

	const [trouvees, toutLeLisible] = await Promise.all([
		chercherLesNotes(base, client, identite, { requete }),
		chercherLesNotes(base, client, identite, { requete: '' })
	]);
	const notes = dansLOrdreDuMoteur(
		await lireNotes(base, contexte, trouvees.identifiants),
		trouvees.identifiants
	);
	const commun = {
		notes,
		requete,
		retenues: facettesRetenues(
			demande,
			session ? FACETTES_DE_LA_RECHERCHE : FACETTES_HONOREES_EN_ANONYME
		),
		perimetre: toutLeLisible.total,
		recherchees: true as const
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
	const contexte = { maintenant: new Date(), seuils: await lireSeuils(base) };
	return await lireLaRecherche(base, moteurPartage(), locals.identite, url, contexte);
};
