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
 * LES TROIS NIVEAUX HAUTS VIENNENT DE LA BASE, PLUS DU JEU DE SEMENCE
 *
 * L'arbre a quatre rangs — `Univers › Domaine › Dossier › Note`. Les notes
 * étaient lues en base depuis `T-037` ; les deux premiers rangs, eux, restaient
 * les CONSTANTES du jeu de semence importées au niveau module de la vue, et le
 * chargeur le déclarait en propres termes : « un compte sans aucun droit voit
 * donc un arbre vide de notes SOUS des domaines nommés. `P-09` n'est pas tenu
 * sur cette zone ». Il l'est désormais, et par le seul geste licite : les deux
 * propriétés `univers` et `domaines` de la vue existaient déjà, optionnelles ;
 * ce chargeur les nourrit.
 *
 * LE FILTRE DES DOMAINES EST CELUI DES DROITS, ET IL EST DEMANDÉ À
 * `domaineLisible()`. Un domaine est retenu si l'un au moins de ses dossiers
 * porte des capacités de lecture — c'est la table de CDC §2.3 qui répond, par
 * `capacites()`. Aucune comparaison de droit n'est écrite ici, et le nom d'un
 * domaine interdit ne sort pas de la base : « un domaine interdit n'apparaît
 * pas — il n'est pas grisé, il n'existe pas pour cette vue » (`V-21:1698`).
 *
 * UN UNIVERS SANS DOMAINE LISIBLE N'EST PAS RETIRÉ ICI, et ce n'est pas un
 * oubli : la vue le fait déjà, et mieux. `racine` saute tout univers dont la
 * liste de domaines est vide (`V-21` : « if (!doms.length) continue »), si bien
 * qu'un univers vidé par les droits ne rend aucune branche. Le retirer une
 * seconde fois dans ce fichier poserait une deuxième autorité sur la même
 * règle. Le sélecteur de périmètre, lui, propose les univers déclarés moins
 * l'univers SYSTÈME — le filtre du gel, que la vue porte.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'AXE « DROITS » DE LA PLANCHE N'EST TOUJOURS PAS DÉRIVÉ DES DROITS RÉELS
 *
 * Le vecteur de V-21 porte `dv` — « accès complet » contre « sans
 * Applications » —, et la vue le transcrit en retirant le domaine NOMMÉ
 * « Applications » de l'arbre et du sélecteur. C'est un cas de planche : le nom
 * du domaine y est une constante. Le rendre depuis les droits de l'appelant
 * reviendrait à retirer un domaine par son nom quel que soit le domaine
 * réellement interdit — une valeur illustrative, que `P-02` proscrit. Le
 * vecteur reste donc à son défaut : le rabattement passe par la LISTE de
 * domaines servie ci-dessous, jamais par l'axe de la planche.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-STR-06` N'EST PAS APPLIQUÉE ICI, ET C'EST LE MÊME VIDE QU'À
 * `/cartographie`
 *
 * `carteMentale` est un module DE DOMAINE : « un module non activé n'apparaît
 * ni dans la navigation du domaine, ni dans ses tableaux de bord ». Cette route
 * n'est ni l'une ni l'autre — c'est un outil global. Aucune source ne dit si
 * les notes d'un domaine qui a désactivé son module doivent sortir de l'arbre
 * global. Le vide est remonté, il n'est pas comblé — et il est comblé de la
 * même façon nulle part, ce qui est la seule cohérence disponible.
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
 * `lireDomaines()` de `$lib/donnees/lecture` rend la même liste, mais SANS
 * l'identifiant technique du domaine — or `domaineLisible()` en a besoin, les
 * droits étant portés par les dossiers et les dossiers rattachés au domaine par
 * cette clé. La requête est donc écrite ici, dans le chargeur de la route qui
 * en a l'usage, et elle ne diffère de l'autre que par cette colonne de plus :
 * mêmes jointure et même ordre — celui du rail, univers puis nom.
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
		 * LE PÉRIMÈTRE, TEL QUE L'ADRESSE LE PORTE — `?perimetre=`, sous la forme
		 * même du sélecteur du gel. Il n'est pas VALIDÉ ici : la vue filtre sur
		 * l'égalité de nom, un nom qui ne désigne rien rend un arbre vide, et
		 * refuser demanderait de relire les référentiels pour n'ajouter aucune
		 * information à l'écran. Ignorer plutôt que refuser — §4.2.
		 */
		perimetreDemande: url.searchParams.get('perimetre') ?? 'tout|',
		notes,
		univers: universDeclares,
		domaines: domainesVisibles
	};
};
