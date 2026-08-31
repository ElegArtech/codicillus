/**
 * LE CHARGEUR DE `/cartographie/par-type` — V-20. On y arrive par la bascule de V-19. LE
 * SEGMENT `par-type` PORTE LE MODE D'AFFICHAGE, et c'est une exigence : `RG-M09-05` veut
 * l'état de cartographie partageable, et `docs/routes.md:267` assigne le mode AU CHEMIN.
 *
 * LES DROITS SONT CEUX DE `/cartographie`, PAR LE MÊME CHEMIN DE CODE, et le régime de
 * l'anonyme aussi. LE GRAPHE EST LE MÊME : les deux routes appellent `lireLeGraphe()`, ce
 * que le socle commun des deux gels exige — « un nœud doit se reconnaître à l'identique
 * d'un mode à l'autre ». Les effectifs par type sont comptés sur le sous-graphe (`P-02`).
 *
 * LES TROIS AXES SONT DÉRIVÉS DE L'ADRESSE et PASSÉS À LA VUE, MÊME NULS, parce qu'elle
 * les EXIGE : facultatifs, leur absence rendait la main à trois « moments » de planche qui
 * posaient eux-mêmes le type maître et le nœud au centre. AUCUNE VALEUR N'EST VALIDÉE
 * CONTRE LE GRAPHE (§4.2) : un type inexistant rend un anneau vide.
 */
import { basePartagee } from '$lib/base/acces';
import { lireLesProprietesDeFiche, lireTypesDeFiche } from '$lib/donnees/lecture';
import { PERIMETRE_DE_V20, perimetreDeLAdresse, valeurDeSelecteur } from '$lib/donnees/outils';
import { famillesDuPerimetre } from '$lib/graphe/familles';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import { lireLeGraphe } from '../lecture-du-graphe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const { notes, relations, typesRelation, relationsTechniques } = await lireLeGraphe(base, acces);

	const perimetre = perimetreDeLAdresse(url.searchParams.get('perimetre'), PERIMETRE_DE_V20);

	/**
	 * LE PANNEAU DE DÉTAIL EST BRANCHÉ SUR LA BASE, ET IL LEVAIT. V-20 lisait
	 * `TYPES_FICHE` du jeu de semence au niveau de son module — aucune propriété,
	 * donc aucun chargeur ne pouvait la corriger. Deux conséquences : les champs
	 * annoncés étaient ceux du jeu, avec leurs valeurs d'exemple présentées comme
	 * celles de la note choisie ; et un type de fiche absent de la constante — que
	 * `base:peupler` pose, comme en pose la console — faisait LEVER `.slice()` au
	 * clic sur le nœud.
	 *
	 * LES PROPRIÉTÉS NE SONT LUES QUE POUR LES FICHES DU PÉRIMÈTRE : `notes` sort
	 * déjà de `lireNotesLisibles()`, la restriction de droit est faite, et la requête
	 * ne demande que les identifiants qui la portent.
	 */
	const fiches = notes.filter((n) => n.typeFiche !== undefined).map((n) => n.id);

	return {
		/** Les trois axes de `RG-M09-05`, tels que l'adresse les porte. */
		perimetreDemande: valeurDeSelecteur(perimetre),
		typeMaitreDemande: url.searchParams.get('type'),
		centreDemande: url.searchParams.get('centre'),
		notes,
		/* Les arêtes et leur origine (`P-08`) — mêmes réserves qu'à
		   `/cartographie` : aucun nœud des deux gels ne sait écrire l'origine. */
		relations,
		typesRelation,
		relationsTechniques,
		/* Le référentiel des types de fiche, tel que la table le porte. */
		typesFiche: await lireTypesDeFiche(base),
		/* Ce que CHAQUE fiche a mis dans ses champs — `notes.proprietes_typees`. */
		proprietesDeFiche: await lireLesProprietesDeFiche(base, fiches),
		/* LES FAMILLES SÉMANTIQUES ET LEUR DATE DE CALCUL — `RG-M09-06`, par le
		   MÊME chemin qu'à `/cartographie` et sur le même périmètre : un nœud doit
		   se reconnaître à l'identique d'un mode à l'autre, sa famille comprise. */
		familles: famillesDuPerimetre(notes, perimetre, maintenant)
	};
};
