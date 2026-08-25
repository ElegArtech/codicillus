/**
 * `/univers/{univers}/{domaine}/signets` — LE CHARGEUR de V-22.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE FICHIER FERME UNE FUITE MESURÉE, ET IL FAUT DIRE LAQUELLE
 *
 * `ECART-047` É-1, reproduit à la main sur le produit construit le 20 août :
 * cette adresse rendait **200 et 18 528 octets à un anonyme, sans aucun
 * cookie** — signets curatés, noms d'auteurs, arborescence complète des univers
 * et domaines, et les actions d'écriture. Et le symptôme qui nommait la cause :
 * la même adresse avec un identifiant inexistant rendait exactement les mêmes
 * octets. La route N'AVAIT PAS DE CHARGEUR, donc ne lisait pas ses paramètres,
 * donc rendait un état de maquette quoi qu'on lui demande.
 *
 * `RG-ACC-01` était en défaut — « l'anonyme ne voit jamais un contenu non
 * public : ni en navigation, ni en recherche, ni via un lien direct » — et
 * `P-09` par-dessus.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL CHEMIN DE SORTIE — ADR-007, RG-ACC-04
 *
 * Il n'y a qu'un `error(404, MESSAGE_INTROUVABLE)` dans ce fichier, sans message, et c'est délibéré.
 * Quatre raisons de refuser — segments inconnus, module Signets éteint, domaine
 * hors périmètre, et pour les deux autres adresses l'absence de droit de
 * rédaction — passent toutes par `resoudreLAccesAuxSignets()`, qui rend
 * `INTROUVABLE`, l'objet unique de `resolution.ts`. Le chargeur n'a RIEN à quoi
 * se raccrocher pour distinguer un refus d'une inexistence : la réponse est
 * identique au code, aux en-têtes et à l'octet.
 *
 * Un message passé à `error()` suffirait à casser cette propriété, puisqu'il
 * entrerait dans le corps rendu. Il n'y en a pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI
 *
 * `event.locals.identite` est posée par `src/hooks.server.ts` — jamais absente,
 * `ANONYME` à défaut. La résolution appartient à `src/lib/droits/resolution.ts`
 * (`T-011`), appelée par `src/lib/donnees/signets.ts`. Jusqu'au 20 août, AUCUNE
 * route de page ne l'appelait : c'est ce que ce lot corrige.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE CHARGEUR NE FAIT PAS
 *
 * Il ne touche pas le rail, la liste des univers et des domaines, le compte de
 * l'utilisateur ni la version de l'instance : `src/vues/V-22.svelte` les importe
 * au niveau du module. Les NOTES entrent par propriété, et c'est par là que la
 * base entre. Écart déclaré au rapport du lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX FACETTES DE L'ADRESSE, ET ELLES SONT DÉSORMAIS LUES
 *
 * `docs/routes.md` §4.2 déclare `etiquette` et `auteur` pour cette route, et
 * ce chargeur ne lisait AUCUN paramètre : les deux menus de la vue étaient
 * décoratifs, et cet écran était le dernier écran de liste que son adresse ne
 * gouvernait pas. Le régime est celui de la liste des notes, à la lettre : à
 * l'intérieur d'une facette les valeurs sont en OU (paramètre répété), entre
 * facettes en ET, une valeur vide s'écarte, et une clé ABSENTE n'est pas posée
 * — `exactOptionalPropertyTypes` distingue l'absence de `undefined`, et c'est
 * elle qui laisse la vue rendre exactement ce qu'elle rendait.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DOMAINE SERVI EST LE DOMAINE RÉSOLU, ET IL FAUT DIRE CE QUE ÇA RÉPARE
 *
 * `src/vues/V-22.svelte` retrouve son domaine courant par son NOM, dans la
 * liste `domaines` qu'on lui passe — à défaut, celle du jeu de semence, qui
 * n'en porte que quatre. Ce chargeur ne la passait pas : sur un domaine que le
 * jeu ne nomme pas, la vue retombait sur le PREMIER de la liste de semence,
 * l'écran titrait « Signets de Infrastructure » et sa liste était VIDE — aucun
 * signet servi ne portait ce domaine-là. Mesuré le 25/08/2026 sur
 * `/univers/gouvernance/doctrine/signets`, qui porte pourtant deux signets.
 *
 * La liste passée n'a qu'un élément, et c'est exact : cet écran est la liste
 * d'UN domaine, il n'en montre jamais un autre.
 */
import { error, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	contexteDeRequete,
	lireLeRangement,
	resoudreLAccesAuxSignets,
	resoudreUnSignet,
	vecteurDeV22
} from '$lib/donnees/signets';
import { supprimerUnSignet } from '$lib/donnees/signets-ecriture';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const acces = await resoudreLAccesAuxSignets(
		base,
		await contexteDeRequete(base),
		locals.identite,
		{ univers: params.univers, domaine: params.domaine }
	);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		vecteur: vecteurDeV22(acces.ressource.domaine, acces.ressource.ecriture),
		/** Le domaine résolu, et lui seul — voir l'en-tête. */
		domaines: [acces.ressource.domaine],
		notes: acces.ressource.notes,
		/** Les valeurs de facette retenues, lues dans l'adresse. */
		retenues: retenuesDeLAdresse(url.searchParams),
		/**
		 * DE QUOI RETROUVER UN SIGNET DEPUIS SA CARTE.
		 *
		 * Les deux boutons de chaque carte — « Modifier », « Supprimer » — ne
		 * faisaient rien : le gel ne pose sur la carte ni identifiant ni adresse
		 * d'action, et lui en ajouter un serait toucher `src/vues/`. La carte
		 * porte en revanche le TITRE et l'ADRESSE curatée, et le couple des deux
		 * désigne le signet sans ambiguïté dans un domaine.
		 */
		signets: acces.ressource.notes
			.filter((n) => n.type === 'Signet')
			.map((n) => ({ identifiant: n.id, titre: n.titre, url: n.url ?? '' }))
	};
};

/**
 * Les deux clés de facette que V-22 déclare, dans son ordre — `V-22.svelte`,
 * table `FACETTES`. La liste est courte et le gel n'en promet pas d'autre :
 * inventer une troisième serait promettre un filtre que la vue ne sait pas
 * appliquer.
 */
const CLES_DE_FACETTE = ['etiquette', 'auteur'] as const;

function retenuesDeLAdresse(
	parametres: URLSearchParams
): Record<string, readonly string[]> | undefined {
	const retenues: Record<string, readonly string[]> = {};
	for (const cle of CLES_DE_FACETTE) {
		const valeurs = parametres.getAll(cle).filter((v) => v !== '');
		if (valeurs.length > 0) retenues[cle] = valeurs;
	}
	return Object.keys(retenues).length === 0 ? undefined : retenues;
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN SIGNET depuis sa carte. Le droit est celui de la lecture
	 * prolongée — `resoudreUnSignet()` exige déjà l'écriture —, et le refus est
	 * le même `404` que partout dans cette famille.
	 */
	supprimer: async ({ params, locals, request }) => {
		const base = basePartagee();
		const segments = { univers: params.univers, domaine: params.domaine };
		const brut = (await request.formData()).get('signet');
		const identifiant = typeof brut === 'string' ? brut : '';
		const acces = await resoudreUnSignet(
			base,
			await contexteDeRequete(base),
			locals.identite,
			segments,
			identifiant
		);
		if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

		const rangement = await lireLeRangement(base, segments);
		if (rangement === null) error(404, MESSAGE_INTROUVABLE);
		const fait = await supprimerUnSignet(base, moteurPartage(), identifiant, rangement.domaineId);
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, `/univers/${params.univers}/${params.domaine}/signets`);
	}
};
