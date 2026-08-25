/**
 * LE CHARGEUR DE `/cartographie/par-type` — V-20, la cartographie par type
 * maître.
 *
 * LA ROUTE N'EXISTAIT PAS AVANT CE LOT. `docs/routes.md:155` la déclare depuis
 * l'inventaire — « idem V-19 » pour le niveau d'accès —, et `T-070` n'avait posé
 * que les deux entrées visées par une entrée de rail. Celle-ci n'en a pas : on y
 * arrive par la bascule « Par type maître » de V-19. La batterie 6 comptait donc
 * ses cases en VACUITÉ, c'est-à-dire en échec.
 *
 * LE SEGMENT `par-type` PORTE LE MODE D'AFFICHAGE, et c'est une exigence :
 * `RG-M09-05` veut l'état de cartographie partageable, et `docs/routes.md:267`
 * assigne le mode d'affichage AU CHEMIN — vue complète contre vue par type
 * maître. Ce n'est pas un paramètre d'adresse, c'est une route.
 *
 * LES DROITS SONT CEUX DE `/cartographie`, PAR LE MÊME CHEMIN DE CODE :
 * `ouvrirLAcces()` puis `resolution.ts`, sans une seule règle réécrite. Le régime
 * de l'anonyme est également le même, et pour une raison de fait :
 * `src/lib/auth/garde.ts:113` range le PRÉFIXE `/cartographie`, donc cette route
 * avec.
 *
 * LE GRAPHE EST CELUI DE LA TABLE `relations`, ET C'EST LE MÊME QU'À
 * `/cartographie`. Les deux routes appellent `lireLeGraphe()` : nœuds, arêtes
 * et vocabulaire des relations sortent du même chemin de code, ce que le socle
 * commun des deux gels exige — « un nœud doit se reconnaître à l'identique d'un
 * mode à l'autre, sinon la bascule fait perdre le fil » (`V-20:2437`).
 *
 * CE QUE LA BASCULE CHANGE ICI, ET IL FAUT LE DIRE. Le périmètre d'affichage de
 * V-20 est « Tous les domaines » là où celui de V-19 est « Univers
 * Production » : les deux vues ne montrent donc pas le même sous-graphe, mais
 * elles le tirent du même jeu d'arêtes. Les effectifs par type de la barre
 * « Type maître » sont comptés sur ce sous-graphe, jamais saisis (`P-02`).
 *
 * LES TROIS AXES SONT DÉSORMAIS DÉRIVÉS DE L'ADRESSE — `?perimetre=`, `?type=`,
 * `?centre=`. Cette section disait l'inverse, et elle avait raison tant que la
 * doctrine du squelette valait : « la sélection d'un nœud est un COMPORTEMENT,
 * qu'ARB-011 met hors du squelette ». `ARB-011` ne s'applique plus, et
 * `RG-M09-05` — « état de cartographie partageable » — reprend la main : une
 * carte explorée doit s'envoyer à un collègue, et le rechargement doit la
 * rendre telle quelle.
 *
 * LES TROIS SONT PASSÉS À LA VUE, MÊME NULS, et c'est ce qui fait la bascule :
 * `typeMaitreDemande` posé — fût-ce à `null` — dit à V-20 qu'elle est branchée
 * sur une adresse, et ses trois moments de planche cessent alors de décider.
 * Le mode de conception, lui, ne pose rien : les cinq états déclarés ne bougent
 * pas d'un pixel.
 *
 * AUCUNE VALEUR N'EST VALIDÉE CONTRE LE GRAPHE, et c'est le régime de §4.2 : un
 * type qui n'existe pas rend un anneau vide, un centre qui ne désigne rien rend
 * le voile « Choisissez une famille d'objets ». Ignorer plutôt que refuser.
 *
 * AUCUN ÉTAT DE ZONE N'EST DÉCIDÉ ICI, contrairement à V-19 : les cinq états de
 * `verif/scenarios/V-20.json` sont des moments d'interaction, aucun n'est un
 * état de données. Décider `vide` sur cette vue reviendrait à inventer une
 * position que la planche ne porte pas.
 */
import { basePartagee } from '$lib/base/acces';
import { lireLesProprietesDeFiche, lireTypesDeFiche } from '$lib/donnees/lecture';
import { PERIMETRE_DE_V20, perimetreDeLAdresse, valeurDeSelecteur } from '$lib/donnees/outils';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import { lireLeGraphe } from '../lecture-du-graphe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const { notes, relations, typesRelation, relationsTechniques } = await lireLeGraphe(base, acces);

	const perimetre = perimetreDeLAdresse(url.searchParams.get('perimetre'), PERIMETRE_DE_V20);

	/**
	 * LE PANNEAU DE DÉTAIL EST BRANCHÉ SUR LA BASE, ET IL LEVAIT.
	 *
	 * V-20 lisait `TYPES_FICHE` du jeu de semence au niveau de son module —
	 * aucune propriété, donc aucun chargeur ne pouvait la corriger. Deux
	 * conséquences, mesurées : les champs annoncés étaient ceux du jeu, avec
	 * leurs valeurs d'exemple présentées comme celles de la note choisie ; et un
	 * type de fiche absent de la constante — « Équipement réseau », que
	 * `base:peupler` pose, comme en pose la console — rendait la lecture
	 * indéfinie et faisait LEVER `.slice()` au clic sur le nœud.
	 *
	 * LES PROPRIÉTÉS NE SONT LUES QUE POUR LES FICHES DU PÉRIMÈTRE. `notes` sort
	 * déjà de `lireNotesLisibles()` : la restriction de droit est faite, et la
	 * requête ne demande que les identifiants qui la portent.
	 */
	const fiches = notes.filter((n) => n.typeFiche !== undefined).map((n) => n.id);

	return {
		/* Le défaut de la planche : « Moment — aucun type choisi ». */
		vecteur: null,
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
		proprietesDeFiche: await lireLesProprietesDeFiche(base, fiches)
	};
};
