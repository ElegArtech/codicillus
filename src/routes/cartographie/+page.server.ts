/**
 * LE CHARGEUR DE `/cartographie` — V-19. « Connecté ; périmètre global : administrateur
 * ou profil habilité » ; anonyme → 302 vers la connexion, connecté sans droit →
 * PÉRIMÈTRE RABATTU (`RG-M09-02`), jamais un refus. LA REDIRECTION DE L'ANONYME N'EST
 * PAS ÉCRITE ICI : `garde.ts` la rend avant ce chargeur, et la reposer ici en ferait une
 * seconde autorité sur le régime des adresses.
 *
 * LE PÉRIMÈTRE RABATTU EST CELUI DES DROITS : un compte sans aucun droit reçoit zéro
 * note et zéro relation — l'état de zone « Aucune relation dans ce périmètre », la forme
 * que `RG-M18-03` donne au rabattement. Il ne reçoit PAS un refus.
 *
 * LE GRAPHE SERVI EST CELUI DE LA TABLE `relations`, et les TROIS listes descendent
 * ensemble : les relations lisibles, les six types avec leurs DEUX libellés, et ceux qui
 * portent une dépendance technique. `TYPES_RELATION` décide du libellé lu dans le nom
 * accessible d'une arête, et deux listes lues en base avec une troisième restée
 * constante feraient un graphe dont le vocabulaire vient d'un jeu d'exemple.
 *
 * `?noeud=` EST IGNORÉ, ET DÉCLARÉ. `RG-STR-06` N'EST PAS APPLIQUÉE ICI : le module
 * `cartographie` est un module DE DOMAINE, et cette route est un outil global.
 */
import { basePartagee } from '$lib/base/acces';
import {
	PERIMETRE_DE_V19,
	etatDeCartographie,
	grapheReel,
	perimetreDeLAdresse,
	valeurDeSelecteur
} from '$lib/donnees/outils';
import { famillesDuPerimetre } from '$lib/graphe/familles';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import { lireLeGraphe } from './lecture-du-graphe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const { notes, relations, typesRelation, relationsTechniques } = await lireLeGraphe(base, acces);

	/**
	 * LE PÉRIMÈTRE VIENT DE L'ADRESSE — `RG-M09-05`. `?perimetre=` porte la valeur
	 * même du sélecteur du gel, `type|nom` ; absente ou illisible, c'est celui de la
	 * planche.
	 *
	 * C'est le chargeur qui le lit, seul à voir `url`, et c'est le MÊME périmètre
	 * qui décide de l'état de zone et que la vue dessine : décider « vide » sur un
	 * jeu et dessiner l'autre afficherait le voile au-dessus d'un graphe peuplé.
	 */
	const perimetre = perimetreDeLAdresse(url.searchParams.get('perimetre'), PERIMETRE_DE_V19);
	const graphe = grapheReel(notes, relations, perimetre);

	return {
		/* Deux positions, et deux seulement : `chargement` est un moment du
		   client, `dense` attend le seuil de RG-M09-04 que rien ne donne. */
		vecteur: { etat: etatDeCartographie(graphe) },
		/** La valeur que le sélecteur du gel doit montrer, et l'adresse porter. */
		perimetreDemande: valeurDeSelecteur(perimetre),
		/**
		 * LE PREMIER NŒUD DU PÉRIMÈTRE — la destination de « Comment déclarer une
		 * relation ». Ce bouton n'apparaît QUE dans le voile « Aucune relation dans ce
		 * périmètre » : il n'y a donc, par construction, aucun nœud du graphe à
		 * désigner, et c'est une note du périmètre qu'il faut ouvrir. Faute de note, le
		 * bouton est rendu inopérant plutôt que menteur.
		 */
		premiereNote: notes[0]?.id ?? null,
		notes,
		/**
		 * LES ARÊTES DU GRAPHE, AVEC LEUR ORIGINE (`P-08`). Elles descendent jusqu'à la
		 * vue, qui les fait descendre au socle commun : le dessin, les degrés, les
		 * points de défaillance unique et l'alternative textuelle en dérivent tous,
		 * sans qu'aucun d'eux ne reçoive une seconde source.
		 */
		relations,
		/** Les six types de relation et leurs deux libellés — RG-M08-06. */
		typesRelation,
		/** Ceux d'entre eux qui portent une dépendance technique. */
		relationsTechniques,
		/**
		 * LES FAMILLES SÉMANTIQUES DU PÉRIMÈTRE, AVEC LA DATE DE LEUR CALCUL —
		 * `RG-M09-06`. Elles se calculent sur les NOTES LISIBLES, jamais sur les
		 * arêtes : « regroupement par proximité de sens, indépendamment des
		 * relations déclarées » (M09.6). Une note qu'aucune relation ne touche —
		 * donc absente du dessin — a sa place dans une famille, et c'est le seul
		 * endroit de l'écran où elle apparaît.
		 *
		 * LE PÉRIMÈTRE DE DROIT EST DÉJÀ FAIT : `notes` sort de
		 * `lireNotesLisibles()`, et rien d'autre n'entre dans le calcul — ni un
		 * compteur, ni un nom de famille ne peut donc naître d'une note interdite.
		 */
		familles: famillesDuPerimetre(notes, perimetre, maintenant)
	};
};
