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
 * LES SEPT PARAMÈTRES DE CETTE ROUTE SONT TOUS HONORÉS
 *
 * `docs/routes.md` §4.2 en nomme sept, et ce chargeur les lit tous : les six
 * facettes RÉPÉTABLES — `type`, `fraicheur`, `statut`, `dossier`, `auteur`,
 * `etiquette` — par `retenuesDeLAdresse()`, plus l'ordre `tri`. À l'intérieur
 * d'une facette les valeurs sont en OU, entre facettes en ET.
 *
 * L'AXE « ARRIVÉE » DE LA PLANCHE SUBSISTE À CÔTÉ, et ce n'est pas une
 * contradiction : `arriveeDepuisLAdresse()` reconnaît les deux points d'entrée
 * que §4.2 nomme — « depuis la barre de fraîcheur · obsolètes » vaut
 * `?fraicheur=Obsolète probable`, « depuis l'accueil · brouillons » vaut
 * `?statut=Brouillon` — et la vue s'en sert pour DÉRIVER elle-même le filtre
 * quand aucune valeur retenue ne lui est passée. `retenues` a la priorité
 * (`V-12.svelte`, `choisis`), et les deux mêmes couples d'adresse produisent
 * donc le même résultat par les deux chemins. Redondance, pas contradiction.
 *
 * Un paramètre inconnu s'IGNORE, jamais ne refuse : c'est la règle de §4.2 pour
 * tout paramètre non honoré, et elle vaut aussi pour une valeur d'ordre
 * inconnue, qui retombe sur l'ordre du gel.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DOMAINE SERVI EST LE DOMAINE RÉSOLU, ET IL FAUT DIRE CE QUE ÇA RÉPARE
 *
 * `src/vues/V-12.svelte` retrouve son domaine courant par son NOM, dans la
 * liste `domaines` qu'on lui passe — à défaut, celle du jeu de semence, qui
 * n'en porte que quatre. Ce chargeur ne la passait pas : sur un domaine que le
 * jeu ne nomme pas, la vue retombait sur le PREMIER de la liste de semence et
 * l'écran titrait « Notes de Infrastructure » en servant les notes
 * d'Infrastructure — sur l'adresse d'un autre domaine. Mesuré le 25/08/2026 sur
 * `/univers/gouvernance/doctrine/notes`.
 *
 * La liste passée n'a qu'un élément, et c'est exact : cet écran est la liste
 * d'UN domaine, il n'en montre jamais un autre.
 */
import { basePartagee } from '$lib/base/acces';
import type { Base } from '$lib/base/acces';
import { notes as tableDesNotes } from '$lib/base/schema';
import { joursEcoules } from '$lib/donnees/lecture';
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
import { inArray } from 'drizzle-orm';
import type { Domaine, IdentifiantNote, Note } from '../../../../../../seeds/corpus';
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

	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);
	const aDesNotes = notes.some((n) => n.domaine === resolution.ressource.nom);

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
		tri: url.searchParams.get('tri') ?? undefined,
		/**
		 * L'ANCIENNETÉ DE MODIFICATION DE CHAQUE NOTE, lue sur `notes.modifie_le`.
		 *
		 * Sans elle, la vue retombait sur la table du jeu de semence, dont les
		 * clés sont des identifiants de semence : aucune note réelle n'y figure,
		 * et les trois lignes annonçaient « date de modification inconnue » alors
		 * que la colonne est renseignée. C'est aussi elle qui ordonne la liste,
		 * dont le tri par défaut est l'ancienneté de modification.
		 */
		modifications: await ancienneteDeModification(base, notes, maintenant)
	};
};

/**
 * L'ancienneté de la dernière modification, en jours — `notes.modifie_le`.
 *
 * CE N'EST PAS `Note.jours`, qui porte l'âge de la VÉRIFICATION : une note
 * vérifiée hier n'a pas été modifiée hier. Le comptage passe par
 * `joursEcoules()`, la seule façon de compter un jour dans ce produit.
 */
async function ancienneteDeModification(
	base: Base,
	lisibles: readonly Note[],
	maintenant: Date
): Promise<Partial<Record<IdentifiantNote, number>>> {
	const identifiants = lisibles.map((n) => n.id as string);
	if (identifiants.length === 0) return {};
	const lignes = await base
		.select({ identifiant: tableDesNotes.identifiant, modifieLe: tableDesNotes.modifieLe })
		.from(tableDesNotes)
		.where(inArray(tableDesNotes.identifiant, identifiants));
	const table: Record<string, number> = {};
	for (const ligne of lignes) table[ligne.identifiant] = joursEcoules(ligne.modifieLe, maintenant);
	return table as Partial<Record<IdentifiantNote, number>>;
}

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
