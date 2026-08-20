/**
 * `/notes/{identifiant}/operationnel` — LE CHARGEUR DE L'ÉDITEUR DU REGISTRE
 * OPÉRATIONNEL (V-18).
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
 * implémentation (`ADR-004`). C'est la seule des trois routes d'éditeur dont la
 * vue accepte réellement le contenu ; les deux autres portent l'écart déclaré.
 *
 * `null` QUAND LE REGISTRE N'EXISTE PAS, et jamais un corps de remplacement :
 * `RG-NOT-02` autorise une note à n'avoir pas d'Opérationnel, et cinq notes sur
 * trente-deux en portent un — les cinq VIDES (mesuré, `note.ts` en tête). La
 * vue retombe alors sur sa transcription gelée, ce qui est son défaut déclaré
 * de `T-042` ; le chargeur, lui, ne fabrique rien.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-M06-08` À `RG-M06-10` NE SONT PAS DÉCLARÉES TENUES
 *
 * La désynchronisation des deux registres — sa détection, son bandeau, son
 * attestation « Marquer comme resynchronisé » — est le troisième cas de la
 * planche (`cas-desync`). Sa détection demanderait de comparer les deux dates
 * de modification de corps, que la table porte
 * (`corps_reference_modifie_le`, `corps_operationnel_modifie_le`) ; mais AUCUNE
 * source ne dit à partir de quel écart un registre est désynchronisé, ni ce que
 * l'attestation écrit, ni où elle se range. Le vecteur reste donc au cas
 * nominal, et l'écart est déclaré plutôt que comblé (`CLAUDE.md` §2).
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { enregistrerLeCorps, resoudreLEditionDeLOperationnel } from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { DocumentInvalide } from '$lib/contenu/document';
import { EditeurIncapable } from '$lib/edition/document';
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
	const { edition, affichee } = acces.ressource;

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-18 — deux leviers, et un seul est VRAI de cette
		 * requête.
		 *
		 * `cas` distingue un Opérationnel existant d'une première rédaction : la
		 * base répond, par la présence du corps. `ref` est la place du panneau de
		 * Référence, une préférence d'affichage qu'aucun paramètre d'adresse ne
		 * porte (`docs/routes.md` §4.5) : elle reste à sa position du gel.
		 */
		vecteur: { cas: edition.lecture.corps.existe ? 'existant' : 'vierge' },
		notes: edition.lecture.notes,
		affichee,
		/** Le document à éditer, et ce que l'éditeur n'en sait pas porter. */
		corps: edition.document,
		horsDePorteeDeLEditeur: edition.horsDePorteeDeLEditeur
	};
};

export const actions: Actions = {
	default: async ({ params, locals, request }) => {
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
			const fait = await enregistrerLeCorps(base, {
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
	}
};
