/**
 * `/notes/{identifiant}/operationnel` — LE CHARGEUR ET LES TROIS ACTIONS DE L'ÉDITEUR DU
 * REGISTRE OPÉRATIONNEL (V-18). « Connecté + rédacteur ». Cette adresse existe plutôt
 * qu'un paramètre sur `/modifier` parce que « le fil de V-18 ajoute un segment ; le
 * paramètre `?registre=` reste réservé à la LECTURE ». Le refus est celui de la famille
 * `/notes/…` — `INTROUVABLE`, un seul chemin (`RG-ACC-04`, `ADR-007`).
 *
 * LES DEUX REGISTRES SONT SERVIS, tous deux RENDUS par `rendreDocument` (`ADR-004`).
 * `null` QUAND LE REGISTRE N'EXISTE PAS, et jamais un corps de remplacement.
 *
 * TROIS ACTIONS, TOUTES NOMMÉES : SvelteKit REFUSE qu'une action par défaut cohabite
 * avec une action nommée et rend 500. Le client soumet vers `?/enregistrer` par
 * l'attribut du formulaire, et vers les deux autres par le `formaction` d'un soumetteur
 * — jamais en réécrivant `action`, ce qui est une course.
 *
 * `RG-M06-08` À `RG-M06-10` : la détection est `operationnelDesynchronise()`, unique
 * définition, et les deux levées sont ici. « Comparer les deux registres » reste inerte,
 * `docs/routes.md` ne portant aucune adresse de comparaison de deux REGISTRES.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	attesterLaResynchronisation,
	enregistrerLeCorps,
	resoudreLEditionDeLOperationnel,
	supprimerLeRegistreOperationnel
} from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { DocumentInvalide } from '$lib/contenu/document';
import { EditeurIncapable } from '$lib/edition/document';
import { formaterDateFr } from '$lib/dates';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';

async function contexteDe() {
	const base = basePartagee();
	return { base, lecture: { maintenant: new Date(), seuils: await lireSeuils(base) } };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { base, lecture } = await contexteDe();
	const acces = await resoudreLEditionDeLOperationnel(base, {
		identifiant: params.identifiant,
		identite: locals.identite,
		contexte: lecture
	});
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
	const { edition, affichee, synchronisation } = acces.ressource;

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-18 — deux leviers, et un seul est VRAI de cette
		 * requête.
		 *
		 * `cas` a trois positions, et la base répond des trois. `vierge` : la colonne
		 * ne porte rien. `desync` : elle porte un corps, et `RG-M06-08` le dit en
		 * retard sur la Référence. `existant` : un corps à jour. L'ordre compte — un
		 * registre qui n'existe pas ne peut pas être désynchronisé.
		 *
		 * `ref` est la place du panneau de Référence, une préférence d'affichage
		 * qu'aucun paramètre d'adresse ne porte : elle reste à sa position du gel.
		 */
		vecteur: {
			cas: !edition.lecture.corps.existe
				? 'vierge'
				: synchronisation.desynchronise
					? 'desync'
					: 'existant'
		},
		notes: edition.lecture.notes,
		affichee,
		/** Ce que le bandeau de `RG-M06-08` nomme : la date, et qui l'a écrite. */
		desynchronisation: {
			quand: formaterDateFr(synchronisation.referenceModifieLe),
			par: synchronisation.referenceModifieePar
		},
		/** Le document à éditer, et ce que l'éditeur n'en sait pas porter. */
		corps: edition.document,
		horsDePorteeDeLEditeur: edition.horsDePorteeDeLEditeur
	};
};

export const actions: Actions = {
	/**
	 * ENREGISTRER LE CORPS OPÉRATIONNEL — et lever le signal par la même écriture,
	 * jamais par un geste ajouté.
	 *
	 * `M05.9` : « enregistrer l'Opérationnel lève automatiquement le signal de
	 * désynchronisation ». Aucune ligne de cette action ne s'en occupe, et c'est la
	 * preuve que la règle est structurelle : le signal se LIT sur la date de corps
	 * que `enregistrerLeCorps()` vient d'écrire.
	 */
	enregistrer: async ({ params, locals, request }) => {
		const { base, lecture } = await contexteDe();
		const formulaire = await request.formData();
		const saisi = formulaire.get('corps');
		if (typeof saisi !== 'string') {
			const acces = await resoudreLEditionDeLOperationnel(base, {
				identifiant: params.identifiant,
				identite: locals.identite,
				contexte: lecture
			});
			if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
			return fail(400, { motif: 'aucun corps soumis' });
		}

		try {
			/* L'INDEX EST ENTRETENU PAR L'ENREGISTREMENT — `RG-M05-06`, et le
			   registre Opérationnel n'y fait pas exception : les deux registres
			   passent par le même `enregistrerLeCorps()`. */
			const fait = await enregistrerLeCorps(base, moteurPartage(), {
				identifiant: params.identifiant,
				registre: 'operationnel',
				identite: locals.identite,
				contexte: lecture,
				corpsSaisi: JSON.parse(saisi),
				maintenant: lecture.maintenant
			});
			if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
			return { version: fait.ressource.version?.numero ?? null };
		} catch (cause) {
			if (cause instanceof DocumentInvalide) {
				return fail(422, {
					motif: 'document refusé',
					manquements: cause.manquements.map((m) => `${m.chemin} : ${m.message}`)
				});
			}
			if (cause instanceof EditeurIncapable) {
				return fail(422, { motif: 'éditeur incapable', manque: cause.manque });
			}
			if (cause instanceof SyntaxError) return fail(400, { motif: 'corps illisible' });
			throw cause;
		}
	},

	/**
	 * « MARQUER COMME RESYNCHRONISÉ » — `RG-M06-10`, seconde levée. Aucun corps
	 * n'est lu : l'attestation ne dépend de RIEN de ce que le client envoie, et
	 * c'est ce qui la rend sûre. Le seul écrit est la date de dernière mise à jour
	 * du corps Opérationnel.
	 */
	resynchroniser: async ({ params, locals }) => {
		const { base, lecture } = await contexteDe();
		const fait = await attesterLaResynchronisation(base, {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte: lecture,
			maintenant: lecture.maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return { resynchronise: true, etaitDesynchronise: fait.ressource.etaitDesynchronise };
	},

	/**
	 * « SUPPRIMER LA VERSION OPÉRATIONNELLE » — `M05.9`, action destructive.
	 *
	 * LA PAGE NE REDIRIGE PAS : le chargeur rejoue, ne trouve plus de corps
	 * Opérationnel, et l'écran revient à son cas `vierge` — ce que le gel annonce
	 * dans son dialogue, « l'invitation « Ajouter une version opérationnelle »
	 * reviendra ». Choisir une autre destination serait décider d'une navigation
	 * qu'aucune source ne porte.
	 *
	 * LA CONFIRMATION EST CÔTÉ CLIENT, et elle est chiffrée. Le serveur ne la
	 * redemande pas : `RG-M18-05` demande un rappel à l'utilisateur, pas un second
	 * aller-retour.
	 */
	supprimer: async ({ params, locals }) => {
		const { base, lecture } = await contexteDe();
		const fait = await supprimerLeRegistreOperationnel(base, moteurPartage(), {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte: lecture,
			maintenant: lecture.maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return { supprime: true, version: fait.ressource.version?.numero ?? null };
	}
};
