/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}/notes` — V-12, liste des notes.
 * « Connecté + lecteur ». LE SEGMENT `notes` EST RÉSERVÉ, ET C'EST CE QUI REND L'ADRESSE
 * NON AMBIGUË (§5.4, avec `dossiers` et `signets`).
 *
 * RG-STR-06 — UN MODULE NON ACTIVÉ N'EST PAS ATTEIGNABLE : une entrée de navigation qui
 * disparaît mais dont l'adresse répond encore laisserait le module atteignable par
 * adresse construite. Le module `notes` est EXIGÉ ici, et son absence rend la même
 * réponse que l'inexistence — aucun domaine du jeu de démonstration n'exerçant ce refus,
 * la fonction qui décide est pure et éprouvée dans ses deux polarités.
 *
 * LES SEPT PARAMÈTRES DE CETTE ROUTE SONT TOUS HONORÉS, ET ILS LE SONT EN SQL : les six
 * facettes RÉPÉTABLES — valeurs en OU dans une facette, en ET entre facettes —, plus
 * l'ordre `tri`. `?page=` s'y ajoute. L'AXE « ARRIVÉE » SUBSISTE À CÔTÉ : il DÉRIVE les
 * valeurs retenues quand l'adresse n'en porte aucune, `retenues` ayant la priorité.
 *
 * CE CHARGEUR NE SERT PLUS UN CORPUS À FILTRER. Il appelait `lireNotesLisibles()`, qui
 * ne prend aucun identifiant de domaine : la vue recevait toutes les notes lisibles de
 * L'INSTANCE, corps `jsonb` compris, et faisait le domaine, les facettes, le tri et le
 * compteur dans le navigateur. Tout cela est descendu dans `lireLaListeDeNotes()`.
 */
import { basePartagee } from '$lib/base/acces';
import { lireLaListeDeNotes } from '$lib/donnees/liste-de-notes';
import {
	CLES_DE_FACETTE,
	LIBELLE_DE_FRAICHEUR,
	LIBELLE_DE_STATUT,
	NOTES_PAR_PAGE,
	ordreDeListe,
	pageDemandee,
	type CleDeFacette,
	type RetenuesDeFacette
} from '$lib/liste/facettes';
import { resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	dossiersDuDomaine,
	lireDomaineParIdentifiants,
	lireModulesDuDomaine,
	moduleActif,
	ouvrirLAcces,
	refuserLAdresse
} from '$lib/donnees/rangement';
import type { Domaine } from '../../../../../../seeds/corpus';
import type { PageServerLoad } from './$types';

/**
 * La position de l'axe « Arrivée » que l'adresse demande. Une valeur inconnue
 * vaut absence : la planche n'a que trois positions, et en inventer une quatrième
 * serait un comblement.
 */
function arriveeDepuisLAdresse(parametres: URLSearchParams): 'tout' | 'obsolete' | 'brouillon' {
	if (parametres.get('fraicheur') === LIBELLE_DE_FRAICHEUR.obs) return 'obsolete';
	if (parametres.get('statut') === LIBELLE_DE_STATUT.brouillon) return 'brouillon';
	return 'tout';
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	const modules =
		domaine === null ? new Set<never>() : await lireModulesDuDomaine(base, domaine.id);

	const resolution = resoudre(
		domaine,
		(trouve) => domaineLisible(acces, trouve.id) && moduleActif(modules, 'notes')
	);
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	const arrivee = arriveeDepuisLAdresse(url.searchParams);
	/**
	 * LES VALEURS DE FACETTE EFFECTIVES — celles de l'adresse, et à défaut celles que
	 * l'ARRIVÉE pose elle-même : « arrivée depuis un segment de barre de fraîcheur ou
	 * un indicateur de l'accueil : la liste s'ouvre déjà filtrée, et le filtre est
	 * visible et retirable comme n'importe quel autre » (`V-12:2303`). La dérivation
	 * était dans la vue ; elle est ici, parce que c'est ici qu'on filtre désormais.
	 */
	const retenues = retenuesDeLAdresse(url.searchParams) ?? retenuesDeLArrivee(arrivee);

	const liste = await lireLaListeDeNotes(base, {
		domaineId: resolution.ressource.id,
		perimetre: acces.perimetre,
		dossiersDuDomaine: dossiersDuDomaine(acces, resolution.ressource.id),
		contexte: acces.contexte,
		retenues,
		ordre: ordreDeListe(url.searchParams.get('tri')),
		page: pageDemandee(url.searchParams.get('page')),
		parPage: NOTES_PAR_PAGE
	});

	return {
		/**
		 * LE DOMAINE RÉSOLU, ET LUI SEUL — voir l'en-tête. Sans lui, la vue
		 * retombe sur le premier domaine du jeu de semence.
		 */
		domaines: [
			{
				nom: resolution.ressource.nom,
				univers: resolution.ressource.universNom,
				couleur: resolution.ressource.couleur
			} as Domaine
		],
		vecteur: {
			dom: resolution.ressource.nom,
			arr: arrivee,
			/* Les deux positions de l'axe « État » de la planche. `vide` est l'état
			   vide de `RG-M18-03`, décidé sur les notes réellement lisibles. */
			etat: liste.total > 0 ? 'nominal' : 'vide'
		},
		notes: liste.notes,
		total: liste.total,
		nombre: liste.nombre,
		facettes: liste.facettes,
		retenues,
		/** Les quatre ordres du gel ; une valeur inconnue s'ignore, jamais ne refuse. */
		tri: url.searchParams.get('tri') ?? undefined,
		/**
		 * L'ANCIENNETÉ DE MODIFICATION DE CHAQUE NOTE SERVIE, lue sur `notes.modifie_le`.
		 * Elle sortait d'un SECOND aller-retour, portant tous les identifiants lisibles
		 * de l'instance ; la colonne était déjà rapportée par la requête de la liste.
		 */
		modifications: liste.modifications,
		/**
		 * LA PAGINATION, ADRESSES COMPRISES. La vue ne connaît pas l'adresse courante,
		 * et la deviner à partir du domaine perdrait les facettes et l'ordre : les deux
		 * adresses sont composées ici, sur l'adresse réellement demandée.
		 */
		pagination: {
			page: liste.page,
			pages: liste.pages,
			precedente: liste.page > 1 ? adresseDePage(url, liste.page - 1) : null,
			suivante: liste.page < liste.pages ? adresseDePage(url, liste.page + 1) : null
		}
	};
};

/** L'adresse courante, sa page changée — tout le reste est conservé tel quel. */
function adresseDePage(url: URL, page: number): string {
	const adresse = new URL(url);
	if (page <= 1) adresse.searchParams.delete('page');
	else adresse.searchParams.set('page', String(page));
	return adresse.pathname + adresse.search;
}

function retenuesDeLAdresse(parametres: URLSearchParams): RetenuesDeFacette | undefined {
	const retenues: Partial<Record<CleDeFacette, readonly string[]>> = {};
	for (const cle of CLES_DE_FACETTE) {
		const valeurs = parametres.getAll(cle).filter((v) => v !== '');
		if (valeurs.length > 0) retenues[cle] = valeurs;
	}
	return Object.keys(retenues).length === 0 ? undefined : retenues;
}

/** Le filtre que l'arrivée pose d'elle-même, quand l'adresse n'en porte aucun. */
function retenuesDeLArrivee(arrivee: 'tout' | 'obsolete' | 'brouillon'): RetenuesDeFacette {
	if (arrivee === 'obsolete') return { fraicheur: [LIBELLE_DE_FRAICHEUR.obs] };
	if (arrivee === 'brouillon') return { statut: [LIBELLE_DE_STATUT.brouillon] };
	return {};
}
