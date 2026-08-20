/**
 * `/notes/{identifiant}/operationnel` — LE CHARGEUR ET LES TROIS ACTIONS DE
 * L'ÉDITEUR DU REGISTRE OPÉRATIONNEL (V-18).
 *
 * `docs/routes.md:145` : niveau d'accès « connecté + rédacteur », et `:148` dit
 * pourquoi cette adresse existe plutôt qu'un paramètre sur `/modifier` — « le
 * fil de V-18 ajoute un segment ; le paramètre `?registre=` reste réservé à la
 * LECTURE ». Ce n'est donc pas une variante de V-17 : c'est une route.
 *
 * Le refus est celui de la famille `/notes/…` — `INTROUVABLE`, un seul chemin,
 * aucune branche « interdit » (`RG-ACC-04`, `ADR-007`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX REGISTRES SONT SERVIS, ET V-18 SAIT LES RECEVOIR
 *
 * V-18 déclare `affichee` depuis `T-042` : la note lue, son corps Référence et
 * son corps Opérationnel, tous deux RENDUS par `rendreDocument` — l'unique
 * implémentation (`ADR-004`).
 *
 * `null` QUAND LE REGISTRE N'EXISTE PAS, et jamais un corps de remplacement :
 * `RG-NOT-02` autorise une note à n'avoir pas d'Opérationnel, et cinq notes sur
 * trente-deux en portent un. La vue retombe alors sur son cas `vierge`, celui
 * de la première rédaction ; le chargeur, lui, ne fabrique rien.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS ACTIONS, ET ELLES SONT TOUTES LES TROIS NOMMÉES
 *
 * `M05.9` (`CDC:747-748`) donne à cet écran une action d'enregistrement et deux
 * actions dédiées — « Marquer comme resynchronisé » et « Supprimer la version
 * opérationnelle ». Aucune n'est l'action PAR DÉFAUT, et ce n'est pas un choix
 * de style : SvelteKit REFUSE qu'une action par défaut cohabite avec une action
 * nommée sur une même page, et rend 500. Une page qui porte plusieurs actions
 * les nomme donc toutes. Le client soumet vers `?/enregistrer` par l'attribut du
 * formulaire, et vers les deux autres par le `formaction` d'un soumetteur —
 * jamais en réécrivant `action`, ce qui est une course (voir le câblage).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-M06-08` À `RG-M06-10` — LE SIGNAL, SES DEUX LEVÉES, ET CE QUI RESTE
 *
 * La détection est `operationnelDesynchronise()`, unique définition
 * (`$lib/donnees/edition.ts`) : le corps Référence a-t-il été modifié APRÈS la
 * dernière mise à jour du corps Opérationnel. Elle décide à elle seule du cas
 * `desync` du vecteur, donc du bandeau et de la révélation de l'attestation.
 *
 * Les deux levées de `RG-M06-10` sont ici : enregistrer une nouvelle version du
 * corps Opérationnel — la date de corps suit l'écriture d'une version, et rien
 * d'autre —, ou attester sans rééditer.
 *
 * CE QUI RESTE NON TENU, ET DÉCLARÉ : le bouton « Comparer les deux registres »
 * du bandeau reste inerte. `docs/routes.md` ne porte aucune adresse de
 * comparaison de deux REGISTRES — `/notes/{identifiant}/comparaison` compare
 * deux VERSIONS, et son propre en-tête le dit : « il n'existe pas d'adresse de
 * comparaison qui [porte un registre propre] ». Lui en inventer une serait
 * combler (`CLAUDE.md` §2).
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
		 * `cas` a trois positions, et la base répond des trois. `vierge` : la
		 * colonne ne porte rien, c'est une première rédaction. `desync` : elle
		 * porte un corps, et `RG-M06-08` le dit en retard sur la Référence.
		 * `existant` : elle porte un corps à jour. L'ordre compte — un registre
		 * qui n'existe pas ne peut pas être désynchronisé, et
		 * `operationnelDesynchronise()` le rend déjà faux dans ce cas.
		 *
		 * `ref` est la place du panneau de Référence, une préférence d'affichage
		 * qu'aucun paramètre d'adresse ne porte (`docs/routes.md` §4.5) : elle
		 * reste à sa position du gel.
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
	 * ENREGISTRER LE CORPS OPÉRATIONNEL — et lever le signal par la même
	 * écriture, jamais par un geste ajouté.
	 *
	 * `M05.9` : « enregistrer l'Opérationnel lève automatiquement le signal de
	 * désynchronisation ». Aucune ligne de cette action ne s'en occupe, et c'est
	 * la preuve que la règle est structurelle : le signal se LIT sur la date de
	 * corps que `enregistrerLeCorps()` vient d'écrire. Une action qui « lèverait
	 * le signal » en plus serait un second état à tenir d'accord avec le premier.
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
	 * « MARQUER COMME RESYNCHRONISÉ » — `RG-M06-10`, seconde levée.
	 *
	 * Aucun corps n'est lu : l'attestation ne dépend de RIEN de ce que le client
	 * envoie, et c'est ce qui la rend sûre. Le seul écrit est la date de dernière
	 * mise à jour du corps Opérationnel, et le type de
	 * `attesterLaResynchronisation()` n'en autorise pas un second.
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
	 * LA PAGE NE REDIRIGE PAS, et c'est le moins inventé des comportements : le
	 * chargeur rejoue, ne trouve plus de corps Opérationnel, et l'écran revient à
	 * son cas `vierge` — « Première rédaction de l'Opérationnel ». C'est
	 * exactement ce que le gel annonce dans son dialogue de confirmation :
	 * « l'invitation « Ajouter une version opérationnelle » reviendra »
	 * (`mockups/V-18-editeur-operationnel.html:2009`). Choisir une destination
	 * autre serait décider d'une navigation qu'aucune source ne porte.
	 *
	 * LA CONFIRMATION EST CÔTÉ CLIENT, et elle est chiffrée — voir le câblage de
	 * la vue. Le serveur ne la redemande pas : il n'a rien pour la porter, et
	 * `RG-M18-05` demande un rappel à l'utilisateur, pas un second aller-retour.
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
