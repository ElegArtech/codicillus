/**
 * `/notes/{identifiant}/relations` — DÉCLARER ET RETIRER LES RELATIONS D'UNE NOTE.
 *
 * CETTE ADRESSE N'EST PAS LE LIEU QUE LE GEL PRÉVOIT : il place le geste dans V-14, dont
 * le panneau « Relations » ouvre le dialogue `d-relation` de V-40 — « chaque dialogue
 * s'exécute dans la vue qui le déclenche ». Elle existe parce que le geste n'avait aucun
 * lieu du tout : aucune route n'écrivait une ligne dans `relations`.
 *
 * DEUX ACTIONS NOMMÉES, AUCUNE ACTION PAR DÉFAUT : SvelteKit REFUSE qu'une action par
 * défaut cohabite avec une action nommée et rend 500. Chacune a son propre `<form>`, et
 * la page fonctionne sans hydratation.
 *
 * LE REFUS EST CELUI DE LA LECTURE, ET IL VIENT DU MÊME APPEL : `lireLaNote()` décide de
 * l'accès pour le chargeur ET pour les deux actions. Le droit d'ÉCRIRE une relation est
 * celui de `RG-M08-04` (les deux extrémités), porté par `$lib/donnees/relations.ts`.
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireCompteCourant } from '$lib/donnees/accueil';
import { lireDomaines, lireSeuils, lireUnivers } from '$lib/donnees/lecture';
import { lireLaNote } from '$lib/donnees/note';
import { rangementDe } from '$lib/lecture/note-de-demonstration';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import {
	ajouterUneRelation,
	grouperLesRelations,
	libelleDOrigine,
	lireLaSaisieDeRelation,
	lireLesCiblesPossibles,
	lireLesRelationsDeLaNote,
	lireLesTypesOfferts,
	retirerUneRelation
} from '$lib/donnees/relations';
import { notes as tableDesNotes } from '$lib/base/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

/**
 * LA NOTE, RÉSOLUE PAR L'AUTORITÉ DE LECTURE, PUIS SA CLÉ. `lireLaNote()` rend
 * l'identifiant lisible et les capacités ; la clé technique se relit ensuite, sur
 * une note dont l'accès est DÉJÀ tranché. L'ordre n'est pas indifférent : lire la
 * clé d'abord ferait payer au refus une requête que l'inexistence ne paie pas.
 */
async function resoudre(identifiant: string, identite: App.Locals['identite']) {
	const base = basePartagee();
	const maintenant = new Date();
	const resolution = await lireLaNote(base, {
		identifiant,
		registre: 'reference',
		identite,
		contexte: { maintenant, seuils: await lireSeuils(base) }
	});
	if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);

	const [ligne] = await base
		.select({ cle: tableDesNotes.id })
		.from(tableDesNotes)
		.where(eq(tableDesNotes.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined) error(404, MESSAGE_INTROUVABLE);

	return { base, lecture: resolution.ressource, cle: ligne.cle };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { base, lecture, cle } = await resoudre(params.identifiant, locals.identite);

	const lisibles = lecture.notes.map((n) => n.id);
	const lues = await lireLesRelationsDeLaNote(base, cle, lisibles);

	/* `P-09` — les moyens d'écrire ne sont préparés que pour qui peut écrire.
	   Un lecteur ne reçoit ni les types offerts, ni les cibles : les deux
	   listes sont vides, et la vue n'a donc rien à rendre. */
	const ecriture = lecture.capacites.ecrireDesNotes;

	const compte = await lireCompteCourant(
		base,
		locals.identite.type === 'authentifie' ? locals.identite.compteId : ''
	);
	if (compte === undefined) error(404, MESSAGE_INTROUVABLE);

	return {
		note: lecture.note,
		/**
		 * LE CHEMIN DE RANGEMENT — le fil d'Ariane et la branche dépliée du rail en
		 * dérivent. Il est composé ICI parce que `SEPARATEUR_DE_CHEMIN` est une
		 * constante du corpus : la vue qui la réécrirait en ferait une seconde
		 * définition.
		 */
		rangement: rangementDe(lecture.note),
		notes: lecture.notes,
		univers: await lireUnivers(base),
		domaines: await lireDomaines(base),
		compte: {
			nom: compte.nom,
			initiales: compte.initiales,
			role: compte.role,
			domaine: compte.domaine
		},
		droits: ecriture ? ('ecriture' as const) : ('lecture' as const),
		/**
		 * `P-08` — L'ORIGINE EST RENDUE ICI, ET C'EST LE SEUL ÉCRAN DU PRODUIT QUI LA
		 * RENDE. Le mot est celui du cahier, traduit par `libelleDOrigine()`,
		 * implémentation unique. Aucune maquette ne porte de nœud pour l'écrire.
		 */
		groupes: grouperLesRelations(lues).map((g) => ({
			libelle: g.libelle,
			relations: g.relations.map((r) => ({
				id: r.id,
				sens: r.sens,
				origine: libelleDOrigine(r.origine),
				autre: r.autre
			}))
		})),
		typesOfferts: ecriture ? await lireLesTypesOfferts(base) : [],
		cibles: ecriture
			? await lireLesCiblesPossibles(base, locals.identite, params.identifiant, lisibles)
			: []
	};
};

export const actions: Actions = {
	/** `UC-M08-02` — déclarer une relation. */
	ajouter: async ({ params, locals, request }) => {
		/* PORTE 1 — le même refus que le chargeur, et il vient du même appel.
		   Rien du corps soumis n'a encore été lu. */
		await resoudre(params.identifiant, locals.identite);

		const lue = lireLaSaisieDeRelation(await request.formData());
		if (!lue.ok) return fail(400, { motif: lue.motif });

		/* PORTE 2 — le droit sur LES DEUX extrémités (`RG-M08-04`), et la
		   résolution de la cible et du type. Un refus y est indiscernable d'une
		   inexistence : `INTROUVABLE`, sans nuance. */
		const faite = await ajouterUneRelation(basePartagee(), {
			identite: locals.identite,
			source: params.identifiant,
			saisie: lue.saisie
		});
		if (!faite.trouve) error(404, MESSAGE_INTROUVABLE);

		if (!faite.ressource.ok) {
			return fail(422, {
				motif:
					faite.ressource.motif === 'doublon'
						? 'cette relation existe déjà entre ces deux notes (RG-M08-03)'
						: 'une note ne peut pas être reliée à elle-même'
			});
		}
		return { declaree: true };
	},

	/** `M08.3` — « chaque relation est supprimable ». */
	retirer: async ({ params, locals, request }) => {
		await resoudre(params.identifiant, locals.identite);

		const relation = ((await request.formData()).get('relation') ?? '').toString().trim();
		if (relation === '') return fail(400, { motif: 'aucune relation désignée' });

		const faite = await retirerUneRelation(basePartagee(), {
			identite: locals.identite,
			depuis: params.identifiant,
			relation
		});
		if (!faite.trouve) error(404, MESSAGE_INTROUVABLE);
		return { retiree: true };
	}
};
