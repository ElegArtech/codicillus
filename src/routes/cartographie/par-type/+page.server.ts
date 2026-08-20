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
 * LES MOMENTS DE LA PLANCHE NE SONT PAS DÉRIVÉS DE L'ADRESSE. Le type maître et
 * le nœud centré sont, dans le gel, des constantes de la maquette — un
 * identifiant de note du jeu de semence. Les honorer depuis `?noeud=` exigerait
 * une propriété que `src/vues/V-20.svelte` n'a pas, et que ce lot n'a pas le
 * droit de lui ajouter. Le vecteur est donc laissé à son défaut, la vue rend
 * « aucun type choisi », et le paramètre est IGNORÉ — jamais refusé, §4.2.
 * Écart déclaré au rapport du lot.
 *
 * AUCUN ÉTAT DE ZONE N'EST DÉCIDÉ ICI, contrairement à V-19 : les cinq états de
 * `verif/scenarios/V-20.json` sont des moments d'interaction, aucun n'est un
 * état de données. Décider `vide` sur cette vue reviendrait à inventer une
 * position que la planche ne porte pas.
 */
import { basePartagee } from '$lib/base/acces';
import { lireRelationsLisibles } from '$lib/donnees/outils';
import { lireNotesLisibles, ouvrirLAcces } from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);
	const relations = await lireRelationsLisibles(base, acces.perimetre);

	return {
		/* Le défaut de la planche : « Moment — aucun type choisi ». */
		vecteur: null,
		notes,
		/* Les relations et leur origine (`P-08`) — mêmes réserves qu'à
		   `/cartographie` : la vue n'a aucune propriété qui les reçoive. */
		relations
	};
};
