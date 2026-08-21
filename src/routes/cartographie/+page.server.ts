/**
 * LE CHARGEUR DE `/cartographie` — V-19, la cartographie du corpus.
 *
 * Niveau d'accès, `docs/routes.md:154` : « connecté ; périmètre global :
 * administrateur ou profil habilité ». La ligne de la matrice §5.5 le complète
 * et tranche le reste : anonyme → **302 vers la connexion** (`ARB-052`),
 * connecté sans droit → **périmètre rabattu** (`RG-M09-02`), jamais un refus.
 *
 * LA REDIRECTION DE L'ANONYME N'EST PAS ÉCRITE ICI, et c'est voulu :
 * `src/lib/auth/garde.ts:113` range `/cartographie` en régime `redirection`, et
 * `src/hooks.server.ts` la rend avant que ce chargeur ne s'exécute. La reposer
 * ici en ferait une seconde autorité sur le régime des adresses.
 *
 * LE PÉRIMÈTRE RABATTU EST CELUI DES DROITS, ET C'EST TOUT CE QU'IL EST. Aucune
 * règle de droit n'est écrite dans ce fichier : `ouvrirLAcces()` appelle
 * `resolution.ts` (`T-011`), qui est l'implémentation unique. Un compte sans
 * aucun droit de dossier reçoit zéro note et zéro relation — donc l'état de zone
 * « Aucune relation dans ce périmètre », qui est la forme que `RG-M18-03` donne
 * au rabattement. Il ne reçoit PAS un refus : la matrice §5.5 sert cette page à
 * tout connecté.
 *
 * CE QUE CE CHARGEUR CHANGE, ET IL FAUT LE MESURER POUR LE CROIRE. Avant lui, la
 * route rendait `corpusPourVue('V-19')` : vingt-sept notes du jeu de semence,
 * titres compris, servies à N'IMPORTE QUEL connecté, sans le moindre droit. La
 * batterie 6 ne le voyait pas — elle attend « servi » sur cette case, et elle
 * l'obtenait. Le contenu, lui, n'était pas celui de l'appelant.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE GRAPHE SERVI EST CELUI DE LA TABLE `relations`, PLUS AUCUN AUTRE
 *
 * Trois listes descendent désormais jusqu'à la vue : les relations lisibles,
 * les six types de relation avec leurs DEUX libellés, et ceux d'entre eux qui
 * portent une dépendance technique. Les trois propriétés de V-19 existaient
 * déjà et retombaient sur les constantes du jeu de semence ; les nourrir est
 * tout ce qu'il reste à faire, et le rendu par défaut du mode de conception ne
 * change pas d'un pixel puisque rien ne lui est passé.
 *
 * POURQUOI LES TROIS, ET PAS LES SEULES RELATIONS. `RELATIONS_TECHNIQUES`
 * décide des points de défaillance unique, `TYPES_RELATION` décide du libellé
 * lu dans le nom accessible d'une arête et dans l'alternative textuelle. Deux
 * listes lues en base et une troisième restée constante fabriqueraient un
 * graphe dont les arêtes viennent du corpus réel et le vocabulaire d'un jeu
 * d'exemple : la première relation d'un type que le référentiel aurait renommé
 * s'afficherait sous l'ancien mot, sans que rien ne le signale.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES PARAMÈTRES D'ADRESSE DE §4.3 SONT IGNORÉS, ET DÉCLARÉS
 *
 * `RG-M09-05` fait de l'état de cartographie une adresse partageable :
 * `?perimetre=`, `?noeud=` (ARB-007), le mode d'affichage étant porté par le
 * chemin. Aucun des deux paramètres n'a de chemin jusqu'à la vue : le périmètre
 * d'affichage de `src/vues/V-19.svelte` est une constante du gel, et le nœud
 * centré n'existe pas dans cette vue. Les honorer exigerait une propriété de
 * plus, dont aucun nœud du gel ne dépendrait tant que la sélection reste un
 * comportement (ARB-011). Ils sont donc IGNORÉS, jamais refusés, ce qui est la
 * règle de §4.2 pour tout paramètre non honoré.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `P-08` — L'ORIGINE VOYAGE, ET AUCUN NŒUD DU GEL NE SAIT L'ÉCRIRE
 *
 * `lireRelationsLisibles()` sélectionne la colonne `origine` et la fait
 * descendre jusqu'à la vue. Aucune des deux maquettes de cartographie ne
 * l'affiche : le mot n'y figure pas, et le seul « déduite » de leur source est
 * le commentaire d'une fabrique d'arborescence de dossiers
 * (`mockups/V-19-cartographie.html:1806`). Rendre l'origine ici exigerait un
 * nœud d'interface que le gel ne porte pas, donc un comblement. La donnée est
 * portée, elle n'est pas montrée ; le fait est remonté au rapport du lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-STR-06` N'EST PAS APPLIQUÉE ICI, ET CE N'EST PAS UN OUBLI
 *
 * Le module `cartographie` est un module DE DOMAINE : « un module non activé
 * n'apparaît ni dans la navigation du domaine, ni dans ses tableaux de bord ».
 * Cette route n'est ni l'une ni l'autre — c'est un outil global, dont §3 ne fait
 * dépendre l'accès que de la session. Aucune source ne dit si les notes d'un
 * domaine qui a désactivé son module doivent sortir du graphe global ; deux des
 * quatre domaines du jeu sont dans ce cas. Le vide est remonté au rapport, il
 * n'est pas comblé.
 */
import { basePartagee } from '$lib/base/acces';
import {
	PERIMETRE_DE_V19,
	etatDeCartographie,
	grapheReel,
	perimetreDeLAdresse,
	valeurDeSelecteur
} from '$lib/donnees/outils';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import { lireLeGraphe } from './lecture-du-graphe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const { notes, relations, typesRelation, relationsTechniques } = await lireLeGraphe(base, acces);

	/**
	 * LE PÉRIMÈTRE VIENT DE L'ADRESSE — `RG-M09-05`, « état de cartographie
	 * partageable ». `?perimetre=` porte la valeur même du sélecteur du gel,
	 * `type|nom` ; absente ou illisible, c'est celui de la planche.
	 *
	 * C'est le chargeur qui le lit, parce qu'il est le seul à voir `url`, et
	 * c'est le MÊME périmètre qui décide de l'état de zone et que la vue
	 * dessine : décider « vide » sur un jeu et dessiner l'autre afficherait le
	 * voile au-dessus d'un graphe peuplé, ou l'inverse.
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
		 * relation », que le gel annonce « Panneau Relations d'une note — vue V-14 »
		 * (`V-19:3038`). Ce bouton n'apparaît QUE dans le voile « Aucune relation
		 * dans ce périmètre » : il n'y a donc, par construction, aucun nœud du
		 * graphe à désigner, et c'est une note du périmètre qu'il faut ouvrir pour
		 * lui en ajouter une. La première de la liste lisible est prise ; faute de
		 * note, le bouton est rendu inopérant plutôt que menteur.
		 */
		premiereNote: notes[0]?.id ?? null,
		notes,
		/**
		 * LES ARÊTES DU GRAPHE, AVEC LEUR ORIGINE (`P-08`). Elles descendent
		 * jusqu'à la vue, qui les fait descendre au socle commun : le dessin, les
		 * degrés, les points de défaillance unique et l'alternative textuelle en
		 * dérivent tous, sans qu'aucun d'eux ne reçoive une seconde source.
		 */
		relations,
		/** Les six types de relation et leurs deux libellés — RG-M08-06. */
		typesRelation,
		/** Ceux d'entre eux qui portent une dépendance technique. */
		relationsTechniques
	};
};
