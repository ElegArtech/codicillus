/**
 * `/notes/{identifiant}/relations` — DÉCLARER ET RETIRER LES RELATIONS D'UNE
 * NOTE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CETTE ADRESSE EXISTE, ALORS QUE LE GEL PLACE LE GESTE AILLEURS
 *
 * Le gel dessine ce geste, et il le dessine dans V-14 : le panneau
 * « Relations » y porte un bouton « + Ajouter »
 * (`mockups/V-14-lecture-note.html:1848`), et ce bouton ouvre le dialogue
 * `d-relation` du catalogue V-40 — « Ajouter une relation », type, note visée,
 * aperçu de la phrase produite dans les deux sens
 * (`mockups/V-40-dialogues.html:1227-1260`). `docs/routes.md:211` le dit sans
 * ambiguïté : V-40 n'a aucune adresse propre, « chaque dialogue s'exécute dans
 * la vue qui le déclenche », et cette vue est V-14 — `V-40:3252` porte
 * `ou: "V-14"` en toutes lettres.
 *
 * CETTE ADRESSE N'EST DONC PAS LE LIEU QUE LE GEL PRÉVOIT. Elle existe parce
 * que le geste n'avait aucun lieu du tout : aucune route du produit n'écrivait
 * une ligne dans `relations`, et le graphe ne pouvait porter que les
 * vingt-deux arêtes de la semence. Entre un geste absent et un geste posé sur
 * une adresse annexe, le second se déclare et se corrige ; le premier ne se
 * voit pas.
 *
 * CE QUI MANQUE, ET QUI EST LA VRAIE RÉPARATION : monter `d-relation` dans
 * V-14, à l'ouverture du bouton « + Ajouter », et faire pointer ce bouton
 * ici — ou vers le dialogue. Les deux demandent de toucher `src/vues/V-14.svelte`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX ACTIONS NOMMÉES, AUCUNE ACTION PAR DÉFAUT
 *
 * SvelteKit REFUSE qu'une action par défaut cohabite avec une action nommée sur
 * la même page — il rend 500. Les deux gestes de cet écran sont donc nommés,
 * `ajouter` et `retirer`, et chacun a son propre `<form>` : rien n'est soumis
 * par JavaScript, aucun attribut d'action n'est réécrit, et la page fonctionne
 * sans hydratation.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE REFUS EST CELUI DE LA LECTURE, ET IL VIENT DU MÊME APPEL
 *
 * `lireLaNote()` décide de l'accès pour le chargeur ET pour les deux actions :
 * il n'existe pas une règle de droit pour lire et une autre pour écrire. Le
 * droit d'ÉCRIRE une relation, lui, est celui de `RG-M08-04` — les deux
 * extrémités —, et il est porté par `$lib/donnees/relations.ts`, pas ici.
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
import { INSTANCE } from '../../../../../seeds/corpus';
import type { Actions, PageServerLoad } from './$types';

/**
 * LA NOTE, RÉSOLUE PAR L'AUTORITÉ DE LECTURE, PUIS SA CLÉ.
 *
 * `lireLaNote()` rend l'identifiant lisible et les capacités ; la clé technique
 * — celle que les jointures de relation emploient — se relit ensuite, sur une
 * note dont l'accès est DÉJÀ tranché. L'ordre n'est pas indifférent : lire la
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
		 * LE CHEMIN DE RANGEMENT — le fil d'Ariane et la branche dépliée du rail
		 * en dérivent, exactement comme V-14 le fait (`rangementDe`). Il est
		 * composé ICI parce que `SEPARATEUR_DE_CHEMIN` est une constante du
		 * corpus : la vue qui la réécrirait en ferait une seconde définition.
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
		/**
		 * LA VERSION DU PRODUIT N'EST PAS UNE DONNÉE DE BASE, et le fait est déjà
		 * relevé : `SANS_CONTREPARTIE_EN_BASE` de `$lib/donnees/accueil.ts` la
		 * porte en première ligne — « aucune colonne, et aucune des sept clés de
		 * `parametres` ». La constante du jeu de semence est ce que toutes les
		 * vues emploient, et cette page ne fait pas exception ; la lacune est
		 * celle du schéma, pas de ce chargeur.
		 */
		version: INSTANCE.version,
		droits: ecriture ? ('ecriture' as const) : ('lecture' as const),
		/**
		 * `P-08` — L'ORIGINE EST RENDUE ICI, ET C'EST LE SEUL ÉCRAN DU PRODUIT
		 * QUI LA RENDE. Le mot est celui du cahier, traduit par
		 * `libelleDOrigine()`, implémentation unique. La colonne voyage jusqu'aux
		 * cartographies depuis `T-037` ; aucune maquette ne porte de nœud pour
		 * l'écrire, et le fait est remonté au rapport plutôt que comblé dans un
		 * gel.
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
