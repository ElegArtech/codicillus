/**
 * LE CHARGEUR DE `/cartographie` — la cartographie, en explorateur de graphe.
 *
 * « Connecté ; périmètre global : administrateur ou profil habilité » ; anonyme →
 * 302 vers la connexion, connecté sans droit → PÉRIMÈTRE RABATTU (`RG-M09-02`),
 * jamais un refus. LA REDIRECTION DE L'ANONYME N'EST PAS ÉCRITE ICI : `garde.ts` la
 * rend avant ce chargeur, et la reposer ici en ferait une seconde autorité sur le
 * régime des adresses.
 *
 * LE PÉRIMÈTRE RABATTU EST CELUI DES DROITS : un compte sans aucun droit reçoit zéro
 * note et zéro relation — l'état de zone vide, la forme que `RG-M18-03` donne au
 * rabattement. Il ne reçoit PAS un refus.
 *
 * LES NOTES ISOLÉES SONT GARDÉES, ET C'EST LA DÉCISION DE FOND DE CET ÉCRAN. Sur le
 * corpus de démonstration, seize notes sur trente-deux ne portent aucune relation
 * déclarée : la carte les faisait disparaître, si bien que la question « qu'est-ce
 * qui n'est relié à rien ? » était la seule à laquelle elle ne pouvait pas répondre.
 * Elles sont là, placées par leur famille sémantique — ce n'est pas un défaut de
 * dessin, c'est une mesure de la structuration du corpus.
 *
 * TROIS MESURES DESCENDENT AVEC LE GRAPHE, ET AUCUNE N'EST REFAITE AILLEURS :
 * la vivacité de chaque note — que la COULEUR d'un nœud porte —, la centralité de
 * passage — que sa TAILLE porte — et les familles sémantiques — qui le PLACENT.
 * Trois canaux, trois informations, une source chacune.
 *
 * `RG-STR-06` N'EST PAS APPLIQUÉE ICI : le module `cartographie` est un module DE
 * DOMAINE, et cette route est un outil global.
 */
import { basePartagee } from '$lib/base/acces';
import {
	PERIMETRE_DE_V19,
	etatDeCartographie,
	grapheReel,
	lireLaVivaciteDesNotes,
	perimetreDeLAdresse,
	valeurDeSelecteur
} from '$lib/donnees/outils';
import { lireSeuilsDeVivacite } from '$lib/donnees/lecture';
import { centralites } from '$lib/graphe/cartographie';
import { famillesDuPerimetre } from '$lib/graphe/familles';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import { explorationDeLAdresse } from './etat-dexploration';
import { lireLeGraphe } from './lecture-du-graphe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	/**
	 * LE PÉRIMÈTRE VIENT DE L'ADRESSE — `RG-M09-05`. `?perimetre=` porte la valeur
	 * même du sélecteur, `type|nom` ; absente ou illisible, c'est tout le corpus.
	 *
	 * C'est le chargeur qui le lit, seul à voir `url`, et c'est le MÊME périmètre
	 * qui décide de l'état de zone et que la vue dessine : décider « vide » sur un
	 * jeu et dessiner l'autre afficherait le voile au-dessus d'un graphe peuplé.
	 *
	 * IL EST LU AVANT LA LECTURE, ET IL DOIT L'ÊTRE : les arêtes DÉDUITES se bornent
	 * à ses deux extrémités, et `lireLeGraphe()` ne peut pas les fabriquer sans lui.
	 */
	const perimetre = perimetreDeLAdresse(url.searchParams.get('perimetre'), PERIMETRE_DE_V19);

	const { notes, relations, typesRelation, relationsTechniques } = await lireLeGraphe(
		base,
		acces,
		perimetre
	);

	const graphe = grapheReel(notes, relations, perimetre, 'gardees');

	/**
	 * LES FAMILLES SÉMANTIQUES DU PÉRIMÈTRE, AVEC LA DATE DE LEUR CALCUL —
	 * `RG-M09-06`. Elles se calculent sur les NOTES LISIBLES, jamais sur les
	 * arêtes : « regroupement par proximité de sens, indépendamment des relations
	 * déclarées » (M09.6).
	 *
	 * ELLES NE SONT PLUS SEULEMENT UNE LÉGENDE. Elles PLACENT les nœuds — c'est le
	 * rappel au barycentre de `disposer()` — et les ENTOURENT — c'est
	 * `contourDeGroupe()`. Une appartenance commune se rend par la géographie et par
	 * un contour, jamais par des arêtes : sur ce corpus, les traits d'affinité
	 * seraient six fois plus nombreux que les relations déclarées, et chacun,
	 * pris seul, affirmerait un rapport que personne n'a déclaré.
	 */
	const familles = famillesDuPerimetre(notes, perimetre, maintenant);

	/**
	 * LA CENTRALITÉ DE PASSAGE — `CDC M09.5`. Elle N'EXISTAIT PAS : le réglage
	 * « Taille des nœuds » et le chiffre du panneau la promettaient tous deux, et
	 * le degré en tenait lieu. Ce n'est pas la même mesure — une note peut avoir
	 * vingt voisins tous rangés dans le même coin, et ne relier rien à rien.
	 *
	 * ELLE EST CALCULÉE SUR LE GRAPHE DU PÉRIMÈTRE, DONC ICI. La vue ne la refait
	 * pas : c'est un parcours par nœud, et le refaire à chaque rendu le paierait
	 * deux fois — au serveur puis à l'hydratation.
	 */
	const centralite = Object.fromEntries(centralites(graphe));

	return {
		/* Deux positions, et deux seulement : `chargement` est un moment du
		   client, `dense` attend le seuil de RG-M09-04 que rien ne donne. */
		vecteur: { etat: etatDeCartographie(graphe) },
		/** La valeur que le sélecteur doit montrer, et l'adresse porter. */
		perimetreDemande: valeurDeSelecteur(perimetre),
		/**
		 * LE PREMIER NŒUD DU PÉRIMÈTRE — la destination de « Comment déclarer une
		 * relation ». Faute de note, le geste est rendu inopérant plutôt que menteur.
		 */
		premiereNote: notes[0]?.id ?? null,
		notes,
		/**
		 * LES ARÊTES DU GRAPHE, AVEC LEUR ORIGINE (`P-08`). Elle ne voyageait pas
		 * plus loin que la charge de page ; elle est désormais LUE À L'ÉCRAN — c'est
		 * elle qui sépare la relation déclarée de la relation déduite, et le trait
		 * plein du trait fin.
		 */
		relations,
		/** Les types de relation et leurs deux libellés — RG-M08-06. */
		typesRelation,
		/** Ceux d'entre eux qui portent une dépendance technique. */
		relationsTechniques,
		familles,
		centralite,
		/**
		 * LA VIVACITÉ DE CHAQUE NOTE — le pire de ses deux registres. C'est ce que
		 * la couleur d'un nœud porte, depuis que la forme et le code de trois lettres
		 * suffisent à dire le type.
		 */
		vivaciteParNote: await lireLaVivaciteDesNotes(
			base,
			acces.perimetre,
			maintenant,
			await lireSeuilsDeVivacite(base)
		),
		/** L'état d'exploration d'ouverture — ensuite, le client le fait vivre sans recharger. */
		exploration: explorationDeLAdresse(url.searchParams)
	};
};
