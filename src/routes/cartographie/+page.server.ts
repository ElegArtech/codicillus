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
 * LES PARAMÈTRES D'ADRESSE DE §4.3 SONT IGNORÉS, ET DÉCLARÉS
 *
 * `RG-M09-05` fait de l'état de cartographie une adresse partageable :
 * `?perimetre=`, `?noeud=` (ARB-007), le mode d'affichage étant porté par le
 * chemin. Aucun des trois n'a de chemin jusqu'à la vue : `src/vues/V-19.svelte`
 * ne reçoit que `vecteur` et `notes`, et son périmètre d'affichage est une
 * constante du gel. Les honorer exigerait une propriété de plus, ce que le
 * contrat de ce lot interdit — `src/vues/` appartient à cinq lots parallèles.
 * Ils sont donc IGNORÉS, jamais refusés, ce qui est d'ailleurs la règle de §4.2
 * pour tout paramètre non honoré. Écart déclaré au rapport du lot.
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
	lireRelationsLisibles
} from '$lib/donnees/outils';
import { lireNotesLisibles, ouvrirLAcces } from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);
	const relations = await lireRelationsLisibles(base, acces.perimetre);

	/* L'état de zone se décide sur LE graphe que la vue dessinera : même
	   fabrique, même périmètre d'affichage. Voir `PERIMETRE_DE_V19`. */
	const graphe = grapheReel(notes, relations, PERIMETRE_DE_V19);

	return {
		/* Deux positions, et deux seulement : `chargement` est un moment du
		   client, `dense` attend le seuil de RG-M09-04 que rien ne donne. */
		vecteur: { etat: etatDeCartographie(graphe) },
		notes,
		/**
		 * LES RELATIONS, AVEC LEUR ORIGINE (`P-08`). Elles vont jusqu'ici et pas
		 * plus loin : `src/vues/V-19.svelte` ne porte aucune propriété qui les
		 * reçoive, et ce lot n'a pas le droit de lui en ajouter une. La vue
		 * dessine donc encore les arêtes de la constante du jeu de semence.
		 * L'écart est chiffré et déclaré au rapport du lot — il ne se voit sur
		 * aucune batterie, ce qui est exactement pourquoi il est écrit.
		 */
		relations
	};
};
