/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}/notes` — V-12, liste des notes.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE SEGMENT `notes` EST RÉSERVÉ, ET C'EST CE QUI REND L'ADRESSE NON AMBIGUË
 *
 * `docs/routes.md` §5.4 réserve `notes`, `dossiers` et `signets` sous
 * `/univers/{u}/{d}/` : sans cette réservation, un domaine nommé « Notes »
 * produirait un segment qui masquerait cette liste. Le préfixe pluriel vient de
 * la convention R1.
 *
 * Niveau d'accès, `docs/routes.md:126` : « connecté + lecteur ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * RG-STR-06 — UN MODULE NON ACTIVÉ N'EST PAS ATTEIGNABLE
 *
 * « Un module non activé n'apparaît ni dans la navigation du domaine, ni dans
 * ses tableaux de bord » (`RG-STR-06`), et `P-04` : « l'activation n'est pas
 * décorative ». Une entrée de navigation qui disparaît mais dont l'adresse
 * répond encore laisserait le module atteignable par adresse construite — le
 * contraire exact de ce que `RG-ACC-01` exige du filtrage. Le module `notes` est
 * donc EXIGÉ ici, lu dans `modules_de_domaine`, et son absence rend la même
 * réponse que l'inexistence.
 *
 * CE CONTRÔLE N'EST PAS EXERCÉ PAR LE CORPUS, ET C'EST DIT : les quatre domaines
 * du jeu activent tous `notes` (`DETAIL_DOMAINES` de `seeds/corpus.ts`). Le
 * même contrôle sur `dossiers` l'est, lui, par deux domaines — voir la route
 * voisine. La fonction qui décide est pure et éprouvée dans ses deux polarités
 * par `src/lib/donnees/rangement.test.ts`, précisément pour que la règle ne
 * repose pas sur un cas que le corpus ne présente pas (`P-5`, `P-26`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX POINTS D'ENTRÉE FILTRÉS, ET EUX SEULS
 *
 * `docs/routes.md` §4.2 nomme sept paramètres pour cette route et donne les deux
 * qui ouvrent la liste DÉJÀ FILTRÉE : « depuis la barre de fraîcheur ·
 * obsolètes » vaut `?fraicheur=Obsolète probable`, « depuis l'accueil ·
 * brouillons » vaut `?statut=Brouillon`. Ce sont exactement les deux positions
 * de l'axe « Arrivée » de la planche, et les seules que la vue sache recevoir :
 * `src/vues/V-12.svelte:89` ne lit qu'`arr`, et le gel calcule lui-même les
 * valeurs retenues à partir de cette unique clé (`V-12:2303`, « la liste s'ouvre
 * déjà filtrée, et le filtre est visible et retirable comme n'importe quel
 * autre »). Les cinq autres paramètres — `type`, `dossier`, `auteur`,
 * `etiquette`, `tri` — n'ont aucun chemin jusqu'à la vue sans lui ajouter une
 * propriété, ce que le contrat de ce lot interdit : ils sont IGNORÉS, jamais
 * refusés, et l'écart est déclaré au rapport. Ignorer plutôt que refuser est
 * d'ailleurs la règle de §4.2 pour tout paramètre non honoré.
 */
import { basePartagee } from '$lib/base/acces';
import { resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	lireDomaineParIdentifiants,
	lireModulesDuDomaine,
	lireNotesLisibles,
	moduleActif,
	ouvrirLAcces,
	refuserLAdresse
} from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

/** Les deux valeurs de facette que §4.2 nomme, recopiées telles quelles. */
const FRAICHEUR_OBSOLETE = 'Obsolète probable';
const STATUT_BROUILLON = 'Brouillon';

/**
 * La position de l'axe « Arrivée » que l'adresse demande. Une valeur inconnue
 * vaut absence : la planche n'a que trois positions, et en inventer une
 * quatrième serait un comblement — c'est la même règle qu'`arriveeDepuisMotif()`
 * applique à `?motif=` de `/connexion`.
 */
function arriveeDepuisLAdresse(parametres: URLSearchParams): 'tout' | 'obsolete' | 'brouillon' {
	if (parametres.get('fraicheur') === FRAICHEUR_OBSOLETE) return 'obsolete';
	if (parametres.get('statut') === STATUT_BROUILLON) return 'brouillon';
	return 'tout';
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	const modules =
		domaine === null ? new Set<never>() : await lireModulesDuDomaine(base, domaine.id);

	const resolution = resoudre(
		domaine,
		(trouve) => domaineLisible(acces, trouve.id) && moduleActif(modules, 'notes')
	);
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);
	const aDesNotes = notes.some((n) => n.domaine === resolution.ressource.nom);

	return {
		vecteur: {
			dom: resolution.ressource.nom,
			arr: arriveeDepuisLAdresse(url.searchParams),
			/* Les deux positions de l'axe « État » de la planche. `vide` est l'état
			   vide de `RG-M18-03`, décidé sur les notes réellement lisibles. */
			etat: aDesNotes ? 'nominal' : 'vide'
		},
		notes,
		/**
		 * LES VALEURS DE FACETTE RETENUES, LUES DANS L'ADRESSE — les six clés du
		 * gel, chacune répétable.
		 *
		 * Les menus de filtre de V-12 étaient inertes : cliquer « Type » n'ouvrait
		 * rien et cocher une valeur ne filtrait rien. Ils sont désormais gouvernés
		 * par l'adresse, comme `/recherche` : à l'intérieur d'une facette les
		 * valeurs sont en OU, entre facettes en ET, et l'état se partage en
		 * envoyant le lien.
		 *
		 * Une clé absente de l'adresse n'est PAS posée : la vue retombe alors sur
		 * la dérivation du gel, qui pose elle-même un filtre quand on arrive
		 * depuis un indicateur.
		 */
		retenues: retenuesDeLAdresse(url.searchParams),
		/** Les quatre ordres du gel ; une valeur inconnue s'ignore, jamais ne refuse. */
		tri: url.searchParams.get('tri') ?? undefined
	};
};

/** Les six clés de facette que V-12 déclare, dans son ordre. */
const CLES_DE_FACETTE = ['type', 'fraicheur', 'statut', 'dossier', 'auteur', 'etiquette'] as const;

function retenuesDeLAdresse(
	parametres: URLSearchParams
): Record<string, readonly string[]> | undefined {
	const retenues: Record<string, readonly string[]> = {};
	for (const cle of CLES_DE_FACETTE) {
		const valeurs = parametres.getAll(cle).filter((v) => v !== '');
		if (valeurs.length > 0) retenues[cle] = valeurs;
	}
	return Object.keys(retenues).length === 0 ? undefined : retenues;
}
