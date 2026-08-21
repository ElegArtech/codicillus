/**
 * LE CHARGEUR DU GABARIT RACINE — et il n'existe QUE pour la page non résolue.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NULLE PART AILLEURS
 *
 * `docs/routes.md` §3.1 et §3.5 : l'adresse non résolue **n'a pas de route
 * propre** — « réponse 404 rendue à l'adresse demandée ». Dans SvelteKit, cela
 * désigne exactement un fichier : le composant d'erreur de la racine. Or ce
 * composant n'a qu'UN canal de donnée, et c'est ce chargeur : il est le seul
 * qui s'exécute aussi bien quand aucune route ne correspond — vérifié dans le
 * cadre, `respond_with_error()` charge le gabarit racine avant de rendre — que
 * quand un chargeur de page a refusé.
 *
 * C'est ce qui donne à `RG-ACC-04` sa forme la plus forte : **la page non
 * résolue est rigoureusement la même quelle que soit la route qui a refusé**,
 * parce qu'elle ne reçoit rien de cette route. Aucune donnée de la ressource
 * demandée n'a de chemin jusqu'à elle.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX BOOLÉENS, ET PAS UN CHAMP DE PLUS
 *
 * Ce chargeur s'exécute à CHAQUE requête du produit : tout ce qu'il lit est
 * payé par toutes les pages. Il ne porte donc que ce que la page non résolue ne
 * peut obtenir d'ailleurs, et rien de ce qui se lit sur la page elle-même.
 *
 *   `session` — quel écran rendre, V-04 ou V-26 (`docs/routes.md:90`).
 *               Gratuit : `locals.identite` est déjà posée par le crochet.
 *   `ecriture` — `P-09` / `ARB-040` : V-26 pose des actions d'écriture et les
 *               cache par attribut ; l'attribut se décide sur les CAPACITÉS de
 *               l'appelant, jamais sur son rôle. Deux projections, et
 *               seulement pour un authentifié — `RG-DRO-02` répond seule pour
 *               l'anonyme, sans aucune requête.
 *
 * NI ROLE, NI IDENTIFIANT DE COMPTE, NI PÉRIMÈTRE ne sortent d'ici : `ADR-006`
 * interdit « toute exposition des droits au navigateur pour qu'il compose
 * l'interface ». Le client reçoit deux booléens d'écran.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE PORTE PAS, ET C'EST UNE LACUNE DÉCLARÉE
 *
 * V-04 et V-26 affichent des guides suggérés et, pour V-04, les quatre guides
 * les plus consultés — « la sortie de secours ». Les leur passer demanderait de
 * lire le corpus ENTIER à chaque requête du produit, pour une page qui n'est
 * servie qu'en cas d'échec. Le corpus n'est donc pas passé, et les listes sont
 * **vides plutôt que fausses** (`P-02`). Compté à `LACUNES_DU_CHEMIN_PUBLIC`,
 * remonté au rapport du lot, non comblé.
 */
import { basePartagee } from '$lib/base/acces';
import { eq } from 'drizzle-orm';
import { comptes, domaines, univers } from '$lib/base/schema';
import { capaciteDEcriture } from '$lib/donnees/public';
import type { Base } from '$lib/base/acces';

/** Les deux identifiants d'adresse du domaine de rattachement, ou `null`. */
async function rangementDuCompte(
	base: Base,
	compteId: string
): Promise<{ univers: string; domaine: string } | null> {
	const [ligne] = await base
		.select({ univers: univers.identifiant, domaine: domaines.identifiant })
		.from(comptes)
		.innerJoin(domaines, eq(domaines.id, comptes.domaineId))
		.innerJoin(univers, eq(univers.id, domaines.universId))
		.where(eq(comptes.id, compteId))
		.limit(1);
	return ligne ?? null;
}
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (locals.identite.type !== 'authentifie') {
		return { session: false, ecriture: false, administrateur: false, rangement: null };
	}
	const base = basePartagee();
	return {
		session: true,
		ecriture: await capaciteDEcriture(base, locals.identite),
		/**
		 * `RG-DRO-03` — l'administrateur contourne tous les droits de dossier, et
		 * lui seul voit l'entrée « Console d'administration ». Une entrée de
		 * navigation visible est une entrée qui fonctionne (`P-03`), et une action
		 * interdite n'est pas affichée (`P-09`) : les deux se rejoignent ici.
		 */
		administrateur: locals.identite.role === 'administrateur',
		/**
		 * LE RANGEMENT DE RATTACHEMENT DU COMPTE — les identifiants d'univers et de
		 * domaine, sous la forme que les adresses emploient.
		 *
		 * Le menu « Créer » de la barre supérieure offre « Nouveau signet » et
		 * « Nouveau dossier », et les deux adresses exigent un domaine. Le seul que
		 * le produit puisse choisir sans décider à la place de l'utilisateur est
		 * celui auquel son compte est rattaché (migration `005`). Sans
		 * rattachement, les deux entrées ne sont pas émises — une entrée qui ne
		 * mène nulle part est un lien mort, et `P-03` n'en admet aucun.
		 */
		rangement: await rangementDuCompte(base, locals.identite.compteId)
	};
};
