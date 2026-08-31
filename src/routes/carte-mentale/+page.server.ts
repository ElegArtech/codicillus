/**
 * LE CHARGEUR DE `/carte-mentale` — V-21. « Connecté » ; anonyme → 302 vers la
 * connexion, connecté sans droit → périmètre rabattu.
 *
 * AUCUNE RELATION N'EST LUE ICI : « la carte mentale ne partage RIEN avec la
 * cartographie ; elle dessine l'ARBORESCENCE du corpus, pas le graphe des relations ».
 * L'ARBORESCENCE EST DÉDUITE DES NOTES LISIBLES, ET DE RIEN D'AUTRE — le filtre est
 * celui de `resolution.ts`, injecté dans la requête (`ADR-006`). LES QUATRE RANGS
 * VIENNENT DE LA BASE : les deux premiers restaient les CONSTANTES du jeu de semence, et
 * un compte sans aucun droit voyait un arbre vide de notes SOUS des domaines nommés.
 *
 * LE FILTRE DES DOMAINES EST CELUI DES DROITS, demandé à `domaineLisible()` : le nom
 * d'un domaine interdit ne sort pas de la base. UN UNIVERS SANS DOMAINE LISIBLE N'EST
 * PAS RETIRÉ ICI — la vue le fait déjà, et le retirer une seconde fois poserait une
 * deuxième autorité sur la même règle.
 *
 * L'AXE « DROITS » DE LA PLANCHE N'EST PAS DÉRIVÉ DES DROITS RÉELS : la vue le transcrit
 * en retirant le domaine NOMMÉ « Applications », une constante de planche (`P-02`). Le
 * rabattement passe par la LISTE de domaines servie.
 */
import { basePartagee } from '$lib/base/acces';
import { domaines, univers } from '$lib/base/schema';
import { lireUnivers } from '$lib/donnees/lecture';
import {
	domaineLisible,
	lireNotesLisibles,
	ouvrirLAcces,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import type { Base } from '$lib/base/acces';
import type { Domaine } from '../../../seeds/corpus';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * LES DOMAINES QUE L'APPELANT PEUT LIRE.
 *
 * `lireDomaines()` rend la même liste, mais SANS l'identifiant technique du
 * domaine — or `domaineLisible()` en a besoin, les droits étant portés par les
 * dossiers et les dossiers rattachés au domaine par cette clé. La requête est
 * donc écrite ici, et ne diffère de l'autre que par cette colonne de plus.
 */
async function lireDomainesLisibles(
	base: Base,
	acces: AccesAuRangement
): Promise<readonly Domaine[]> {
	const lignes = await base
		.select({
			id: domaines.id,
			nom: domaines.nom,
			universNom: univers.nom,
			couleur: domaines.couleur
		})
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.orderBy(univers.ordre, domaines.nom);

	return lignes
		.filter((d) => domaineLisible(acces, d.id))
		.map((d) => ({ nom: d.nom, univers: d.universNom, couleur: d.couleur }) as Domaine);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);
	const universDeclares = await lireUnivers(base);
	const domainesVisibles = await lireDomainesLisibles(base, acces);

	return {
		/* Le défaut de la planche : « Droits — accès complet ». L'axe ne décrit
		   pas l'appelant, et il n'a plus à le faire : le rabattement est dans la
		   liste de domaines. Voir l'en-tête. */
		vecteur: null,
		/**
		 * LE PÉRIMÈTRE, TEL QUE L'ADRESSE LE PORTE — `?perimetre=`, sous la forme même
		 * du sélecteur du gel. Il n'est pas VALIDÉ ici : la vue filtre sur l'égalité de
		 * nom, un nom qui ne désigne rien rend un arbre vide, et refuser demanderait de
		 * relire les référentiels sans rien ajouter à l'écran. Ignorer plutôt que
		 * refuser — §4.2.
		 */
		perimetreDemande: url.searchParams.get('perimetre') ?? 'tout|',
		notes,
		univers: universDeclares,
		domaines: domainesVisibles
	};
};
