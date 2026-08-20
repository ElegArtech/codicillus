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
 * LES QUATRE PARAMÈTRES DE PRÉ-REMPLISSAGE NE SONT PAS LUS, ET C'EST DÉCLARÉ
 *
 * `docs/routes.md:287-288` prévoit cinq paramètres sur cette adresse — titre,
 * domaine, dossier, template, requête d'origine. Les lire demanderait de les
 * porter jusqu'à la vue, or `src/vues/V-17.svelte` ne déclare AUCUNE propriété
 * qui les recevrait : ses onze propriétés sont le vecteur, le corpus, quatre de
 * contexte, trois référentiels, les anciennetés et la note reprise. Les faire
 * entrer demanderait de toucher `src/vues/`, que le contrat de ce lot interdit.
 * Rien n'est donc lu de l'adresse : un paramètre honoré à moitié — retenu côté
 * serveur, invisible côté écran — serait pire que pas de paramètre du tout.
 * Écart déclaré, chiffré au rapport.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ACTION EXISTE, ELLE REFUSE AVANT D'ÉCRIRE, ET ELLE N'ÉCRIT PAS
 *
 * La création d'une note bute sur la même valeur manquante que la création d'un
 * signet, et le lot qui l'a rencontrée l'a déjà déclarée
 * (`…/signets/nouveau/+page.server.ts`) : L'IDENTIFIANT LISIBLE.
 * `RG-M12-11` — « les identifiants lisibles sont rendus uniques automatiquement
 * en cas de collision, sans écraser de note existante » — impose le RÉSULTAT et
 * ne donne AUCUNE forme : ni suffixe, ni compteur, ni séparateur. Or
 * l'identifiant est dans l'ADRESSE (`RG-M03-03`, stable dans le temps) : en
 * choisir la forme ici serait décider à la place du commanditaire d'une chaîne
 * que l'utilisateur verra, qu'il partagera, et qu'on ne pourra plus changer.
 * `src/lib/rangement/adresses.ts` le dit de lui-même : sa dérivation « n'est
 * pas la génération d'identifiant du produit ».
 *
 * S'y ajoute que le formulaire gelé ne porte NI `method`, NI `action`, NI le
 * moindre attribut de nom sur ses sept champs (V-17:1596-1665, relevé champ par
 * champ) : aucune soumission ne peut l'atteindre. C'est la situation qu'ont
 * connue `POST /connexion` en `T-012` et la création de signet — l'action
 * existe, son refus est juste, et elle attend le lot qui reliera le formulaire.
 *
 * L'appelant qui a le droit reçoit donc **501**, qui dit « pas implémenté » sans
 * rien inventer ; celui qui ne l'a pas reçoit **404**, comme une adresse qui
 * n'existe pas. La différence est légitime : à qui a le droit, la ressource
 * n'est pas cachée.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { resoudreLaCreationDeNote } from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { Actions, PageServerLoad } from './$types';

/** L'instant de référence est pris ICI, une fois : voir `/notes/{identifiant}`. */
async function contexte() {
	const base = basePartagee();
	return { base, contexte: { maintenant: new Date(), seuils: await lireSeuils(base) } };
}

export const load: PageServerLoad = async ({ locals }) => {
	const { base, contexte: lecture } = await contexte();
	const acces = await resoudreLaCreationDeNote(base, locals.identite, lecture);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
	const creation = acces.ressource;

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
		vecteur: { cas: 'vierge' },
		notes: creation.notes,
		typesNote: creation.referentiels.typesNote,
		typesFiche: creation.referentiels.typesFiche,
		templates: creation.referentiels.templates
	};
};

export const actions: Actions = {
	default: async ({ locals }) => {
		const { base, contexte: lecture } = await contexte();
		/* Le refus est le MÊME que celui du chargeur, et il vient du même appel :
		   il n'existe pas une règle de droit pour lire et une autre pour écrire. */
		const acces = await resoudreLaCreationDeNote(base, locals.identite, lecture);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		error(
			501,
			"la création d'une note n'est pas implémentée : RG-M12-11 impose un identifiant " +
				'lisible rendu unique automatiquement et n’en donne aucune forme, et cet identifiant ' +
				'est dans l’adresse (RG-M03-03)'
		);
	}
};
