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
 * LES SEPT PARAMÈTRES DE CETTE ROUTE SONT TOUS HONORÉS : les six facettes RÉPÉTABLES,
 * plus l'ordre `tri` — valeurs en OU dans une facette, en ET entre facettes. L'AXE
 * « ARRIVÉE » SUBSISTE À CÔTÉ : la vue s'en sert pour DÉRIVER le filtre quand aucune
 * valeur retenue ne lui est passée, `retenues` ayant la priorité. LE DOMAINE SERVI EST
 * LE DOMAINE RÉSOLU, et la liste passée n'a qu'un élément.
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
 * vaut absence : la planche n'a que trois positions, et en inventer une quatrième
 * serait un comblement.
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
		 * LES VALEURS DE FACETTE RETENUES, LUES DANS L'ADRESSE — les six clés du gel,
		 * chacune répétable. Les menus de filtre de V-12 étaient inertes : cliquer
		 * « Type » n'ouvrait rien et cocher une valeur ne filtrait rien.
		 *
		 * Une clé absente de l'adresse n'est PAS posée : la vue retombe alors sur la
		 * dérivation du gel, qui pose elle-même un filtre quand on arrive depuis un
		 * indicateur.
		 */
		retenues: retenuesDeLAdresse(url.searchParams),
		/** Les quatre ordres du gel ; une valeur inconnue s'ignore, jamais ne refuse. */
		tri: url.searchParams.get('tri') ?? undefined,
		/**
		 * L'ANCIENNETÉ DE MODIFICATION DE CHAQUE NOTE, lue sur `notes.modifie_le`.
		 * Sans elle, la vue retombait sur la table du jeu de semence, dont les clés
		 * sont des identifiants de semence : les lignes annonçaient « date de
		 * modification inconnue » alors que la colonne est renseignée. C'est aussi elle
		 * qui ordonne la liste, dont le tri par défaut est l'ancienneté.
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
