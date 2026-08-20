/**
 * LE CHARGEUR DE `/carte-mentale` — V-21, la carte mentale du corpus.
 *
 * Niveau d'accès, `docs/routes.md:156` : « connecté ». La matrice §5.5 range
 * cette adresse avec `/cartographie` : anonyme → **302 vers la connexion**
 * (`ARB-052`, rendue par `src/hooks.server.ts` sur le régime de
 * `src/lib/auth/garde.ts:114`), connecté sans droit → **périmètre rabattu**.
 *
 * AUCUNE RELATION N'EST LUE ICI, et c'est la vue qui le décide : « la carte
 * mentale ne partage RIEN avec la cartographie : ni type cartographique, ni
 * forme, ni sous-graphe. Elle dessine l'ARBORESCENCE du corpus, pas le graphe
 * des relations » (`src/lib/graphe/cartographie.ts`, en-tête). Interroger la
 * table des relations pour cette page serait une requête que rien ne consomme.
 *
 * L'ARBORESCENCE EST DÉDUITE DES NOTES LISIBLES, ET DE RIEN D'AUTRE. « Aucune
 * structure séparée : l'arborescence est celle du corpus, filtrée par ce que
 * l'utilisateur a le droit de voir » (`V-21:2185`). Le filtre est celui de
 * `resolution.ts`, injecté dans la requête (`ADR-006`) : un compte sans droit
 * reçoit zéro note, donc un arbre sans aucune note.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'AXE « DROITS » DE LA PLANCHE N'EST PAS DÉRIVÉ DES DROITS RÉELS
 *
 * Le vecteur de V-21 porte `dv` — « accès complet » contre « sans
 * Applications » —, et la vue le transcrit en retirant le domaine NOMMÉ
 * « Applications » de l'arbre et du sélecteur. C'est un cas de planche : le nom
 * du domaine y est une constante. Le rendre depuis les droits de l'appelant
 * reviendrait à retirer un domaine par son nom quel que soit le domaine
 * réellement interdit — une valeur illustrative, que `P-02` proscrit. Le vecteur
 * est donc laissé à son défaut.
 *
 * CONSÉQUENCE, ET ELLE EST DÉCLARÉE : les univers et les domaines affichés par
 * cette vue — comme par le rail de toutes les autres — viennent encore des
 * constantes du jeu de semence importées au niveau module, non des droits. Un
 * compte sans aucun droit voit donc un arbre vide de notes SOUS des domaines
 * nommés. `P-09` n'est pas tenu sur cette zone, et il ne peut pas l'être depuis
 * un chargeur : la correction est la propriété `domaines` de la vague 1b.
 * Chiffré au rapport du lot.
 */
import { basePartagee } from '$lib/base/acces';
import { lireNotesLisibles, ouvrirLAcces } from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, locals.identite, new Date());

	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);

	return {
		/* Le défaut de la planche : « Droits — accès complet », qui ne décrit pas
		   l'appelant mais le seul rendu que la vue sache produire sans propriété
		   supplémentaire. Voir l'en-tête. */
		vecteur: null,
		notes
	};
};
