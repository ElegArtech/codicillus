/**
 * `/notes/nouvelle` — LE CHARGEUR DE L'ÉDITEUR EN CRÉATION (V-17).
 *
 * `docs/routes.md:143` : niveau d'accès « connecté + rédacteur ». Le chargeur
 * l'exige, et il l'exige PAR LE MÊME CHEMIN que l'inexistence — un lecteur
 * reçoit exactement ce que reçoit une adresse qui ne désigne rien : 404, au
 * même octet. C'est `ADR-007` et `RG-ACC-04`, et ce n'est pas un régime « sans
 * droit », réservé aux ZONES d'une page qu'on a le droit d'ouvrir (`ARB-005`).
 *
 * `nouvelle` est un identifiant RÉSERVÉ sous `/notes/` (`docs/routes.md` §5.4,
 * `:348`) : aucune note ne peut porter cet identifiant lisible, et l'adresse ne
 * peut donc pas entrer en collision avec `/notes/{identifiant}`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES PARAMÈTRES DE PRÉ-REMPLISSAGE SONT LUS — ET PAS TOUS ICI
 *
 * `docs/routes.md:287-288` prévoit cinq paramètres sur cette adresse : titre,
 * domaine, dossier, template, et la requête d'origine venue de V-34. Chacun est
 * lu là où il commande quelque chose, et nulle part ailleurs.
 *
 * ICI : `template`, plus bas dans ce fichier, parce qu'il pilote `vecteur.cas`
 * — le vecteur d'état est composé par le chargeur, jamais par la vue.
 *
 * DANS `+page.svelte` : `domaine`, `dossier` et `titre`, parce qu'ils ne
 * commandent rien du chargement et tout de l'écran. `domaine` est porté par
 * `compte.domaine`, `dossier` par `dossierDeDepart` — la propriété que V-17
 * déclare pour cela —, `titre` posé sur son champ au montage.
 *
 * Ce partage n'est pas un demi-parcours : un paramètre retenu côté serveur et
 * invisible côté écran serait pire que pas de paramètre du tout, et c'est
 * exactement ce que la répartition ci-dessus évite. `dossier` est d'ailleurs
 * VÉRIFIÉ avant d'être servi, contre l'arborescence de choix que ce chargeur
 * rend : un chemin qui ne désigne plus rien s'ignore en silence.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ACTION ÉCRIT — LE 501 EST LEVÉ, ET C'EST `ARB-062` QUI L'A LEVÉ
 *
 * Cette section a longtemps dit pourquoi l'action ne pouvait PAS écrire : la
 * création d'une note butait sur `RG-M12-11`, qui impose des identifiants
 * lisibles « rendus uniques automatiquement en cas de collision » et n'en donne
 * AUCUNE forme — ni suffixe, ni compteur, ni séparateur. L'identifiant étant
 * dans l'ADRESSE (`RG-M03-03`, stable dans le temps), en choisir la forme en
 * cours d'exécution aurait été décider à la place du commanditaire d'une chaîne
 * que l'utilisateur voit, partage, et qu'on ne peut plus changer.
 *
 * `ARB-062` a tranché la forme — `n-` + le slug du titre tronqué à 48, `-2`,
 * `-3` en cas de collision, unicité arbitrée par la contrainte de base — et le
 * vide n'existe plus. C'est le guichet du protocole d'écart qui a fonctionné,
 * pas un implémenteur qui a comblé.
 *
 * L'ORDRE DES PORTES EST CELUI DE `T-079` §5, ET IL N'EST PAS NÉGOCIABLE :
 *
 *   1. le DROIT d'écrire quelque part — `resoudreLaCreationDeNote()`, la même
 *      résolution que le chargeur, AVANT toute lecture du corps soumis ;
 *   2. la CIBLE, puis le DROIT SUR CE DOSSIER — `peutEcrireSurLeDossier()`. Un
 *      rédacteur d'un domaine ne crée pas dans un autre, et le refus est le
 *      MÊME OCTET que celui de la porte 1 : `404 MESSAGE_INTROUVABLE` ;
 *   3. la FORME — champs manquants en `400`, Markdown illisible en `422`
 *      portant ses manquements, comme le fait déjà `/notes/{id}/modifier` ;
 *   4. l'ÉCRITURE, une transaction par essai d'identifiant ;
 *   5. l'INDEX après la transaction, jamais dedans (`ARB-060`) ;
 *   6. `303` vers `/notes/{identifiant}` — un POST ne rend pas une page.
 *
 * POURQUOI LA CIBLE SE RÉSOUT AVANT QUE LA FORME SOIT JUGÉE. Il faut connaître
 * le dossier pour savoir si l'appelant a le droit d'y écrire, donc le lire du
 * formulaire — mais rien de plus n'est lu : le CORPS n'est ni analysé ni même
 * regardé tant que les deux portes de droit ne sont pas franchies. Un appelant
 * sans droit ne fait donc rien travailler d'autre qu'une résolution de nom.
 *
 * CE QUE LE FORMULAIRE GELÉ N'ATTEINT TOUJOURS PAS. V-17 ne porte ni `method`,
 * ni `action`, ni attribut de nom sur ses champs (V-17:1596-1665) : la
 * soumission est composée par la ROUTE, jamais par la vue — `ARB-063`, et c'est
 * un autre lot qui l'écrit dans `+page.svelte`. L'action, elle, est atteignable
 * par un `POST` en `application/x-www-form-urlencoded` dès aujourd'hui.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { DocumentInvalide } from '$lib/contenu/document';
import { MarkdownInvalide } from '$lib/contenu/markdown';
import { creerUneNote, lireLaSaisie, resoudreLaCible } from '$lib/donnees/creation';
import {
	lireLArborescenceDeChoix,
	peutEcrireSurLeDossier,
	resoudreLaCreationDeNote
} from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { adresseDeNote } from '$lib/rangement/adresses';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';

/** L'instant de référence est pris ICI, une fois : voir `/notes/{identifiant}`. */
async function contexte() {
	const base = basePartagee();
	return { base, contexte: { maintenant: new Date(), seuils: await lireSeuils(base) } };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { base, contexte: lecture } = await contexte();
	const acces = await resoudreLaCreationDeNote(base, locals.identite, lecture);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
	const creation = acces.ressource;

	/**
	 * `?template=` — LE PARAMÈTRE DE `docs/routes.md:287`, ENFIN LU.
	 *
	 * Il était déclaré non lu, et la conséquence n'était pas cosmétique : le
	 * dialogue « Par quoi commencer ? » du gel n'est rendu que par l'état
	 * `cas-template` de la vue, et aucune adresse ne le demandait. Ses deux
	 * gestes — « Partir d'une page vierge », et le choix d'un gabarit —
	 * n'étaient donc pas seulement inertes : ils étaient INATTEIGNABLES.
	 *
	 * Le paramètre PRÉSENT ouvre le choix. C'est la lecture que `RG-REF-01`
	 * autorise — « template subsidiaire, donc paramètre facultatif » —, et c'est
	 * la seule qui n'invente rien : la vue ne sait rendre que deux états ici,
	 * avec ou sans le dialogue. Sa VALEUR, quand elle nomme un gabarit connu,
	 * est rendue à l'écran pour qu'il soit présélectionné ; le câblage s'en sert,
	 * le chargeur ne décide rien de plus.
	 */
	const templateDemande = url.searchParams.get('template');

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-17, et il ne porte que ce qui est VRAI de cette
		 * adresse : l'entrée est une création vierge (`cas`, `V-17:3537`).
		 *
		 * Les deux autres leviers de la planche — `sv` et `c-doublon` — décrivent
		 * ce qui arrive PENDANT la rédaction, pas l'état de départ : la vue le
		 * mesure elle-même (« quatre des six états rendent le même écran »). Les
		 * poser depuis le serveur peindrait un enregistrement en échec sur un
		 * écran qui n'a rien enregistré — la valeur illustrative que `P-02`
		 * proscrit.
		 */
		vecteur: { cas: templateDemande === null ? 'vierge' : 'template' },
		/** Le gabarit nommé par l'adresse, quand elle en nomme un. */
		templateDemande,
		notes: creation.notes,
		typesNote: creation.referentiels.typesNote,
		typesFiche: creation.referentiels.typesFiche,
		templates: creation.referentiels.templates,
		dossiersParDomaine: await lireLArborescenceDeChoix(base)
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { base, contexte: lecture } = await contexte();
		/* PORTE 1 — le refus est le MÊME que celui du chargeur, et il vient du même
		   appel : il n'existe pas une règle de droit pour lire et une autre pour
		   écrire. Rien du corps soumis n'a encore été lu. */
		const acces = await resoudreLaCreationDeNote(base, locals.identite, lecture);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		const lue = lireLaSaisie(await request.formData());
		if (!lue.ok) return fail(400, { motif: lue.motif });

		/* PORTE 2 — la cible, puis le droit SUR ELLE. Les deux refus sont un seul
		   octet : une cible qui n'existe pas et une cible interdite ne se
		   distinguent pas (`RG-ACC-04`, `ADR-007`).

		   LE TYPE DE FICHE NE PASSE PAS PAR CETTE PORTE, et c'est délibéré : ce
		   n'est pas un rangement, aucun droit ne le protège, et le référentiel
		   est administrable. Le rendre en 404 nommait une note introuvable là où
		   c'est un type qui manque, et faisait perdre le brouillon entier. Le
		   refus est celui que `/notes/{id}/modifier` rend déjà pour le même
		   geste — un 400 nommé, l'écran reste. */
		const resolution = await resoudreLaCible(base, lue.saisie);
		if (resolution.sort === 'fiche-introuvable') {
			return fail(400, { motif: 'type de fiche introuvable' });
		}
		if (resolution.sort === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		const cible = resolution.cible;
		if (!(await peutEcrireSurLeDossier(base, locals.identite, cible.dossierId))) {
			error(404, MESSAGE_INTROUVABLE);
		}

		let identifiant: string;
		try {
			const fait = await creerUneNote(base, moteurPartage(), {
				saisie: lue.saisie,
				cible,
				identite: locals.identite,
				maintenant: lecture.maintenant
			});
			if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
			identifiant = fait.ressource.identifiant;
		} catch (cause) {
			/* PORTE 3 — un corps mal formé est REFUSÉ, jamais réparé (`ADR-003`), et
			   le refus porte ses manquements : c'est ce que l'écran d'erreur de V-17
			   a vocation à montrer, et c'est la forme que `/notes/{id}/modifier`
			   emploie déjà. */
			if (cause instanceof DocumentInvalide) {
				return fail(422, {
					motif: 'document refusé',
					manquements: cause.manquements.map((m) => `${m.chemin} : ${m.message}`)
				});
			}
			if (cause instanceof MarkdownInvalide) {
				return fail(422, { motif: 'markdown refusé', manquements: [cause.message] });
			}
			throw cause;
		}

		/* La redirection est HORS du `try` : `redirect()` lève, et une redirection
		   avalée par le filet à erreurs ci-dessus rendrait un 422 sur une note
		   pourtant écrite. */
		redirect(303, adresseDeNote(identifiant));
	}
};
