/**
 * LES RELATIONS D'UNE NOTE — les lire avec leur ORIGINE, en déclarer une, en
 * retirer une.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI MANQUAIT, ET QUI N'ÉTAIT PAS UNE LACUNE D'AFFICHAGE
 *
 * La table `relations` existe depuis `T-010`, `lireRelations()` la lit depuis
 * `T-030`, `lireRelationsLisibles()` en porte l'origine jusqu'aux
 * cartographies depuis `T-037`. **Aucune route n'en écrivait une.** Le corpus
 * ne pouvait donc porter que les vingt-deux arêtes de la semence : le graphe
 * était en lecture seule, et `UC-M08-02` — « l'utilisateur déclare qu'une
 * application est hébergée sur un serveur » — n'avait aucun chemin.
 *
 * Ce module est ce chemin. Il ne lit ni n'écrit un seul libellé de relation :
 * les six types vivent dans `types_de_relation`, ils sont administrables par
 * `/console/types-de-relations`, et les recopier ici ferait dire au produit les
 * mots d'un référentiel qu'un administrateur aurait renommés.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES RÈGLES PORTÉES, ET LEUR LIEU EXACT
 *
 *   `RG-M08-03` — unicité (source, cible, type). Elle est portée par la
 *     CONTRAINTE `relations_unicite` du schéma ; la vérification faite ici la
 *     précède pour rendre un refus lisible, elle ne la remplace pas. Une course
 *     entre deux requêtes se solde par la contrainte, pas par ce code.
 *   `RG-M08-04` — écrire une relation exige le droit d'écriture sur les DEUX
 *     extrémités. Aucune comparaison de droit n'est écrite ici :
 *     `peutEcrireSurLeDossier()` appelle `resoudreDroitDeDossier()` puis
 *     `capacites()`, qui sont l'implémentation unique (`T-011`).
 *   `RG-M08-06` — le libellé rendu est celui du SENS de lecture : sortant quand
 *     la note lue est la source, entrant quand elle est la cible. Les deux
 *     viennent de la même ligne de `types_de_relation`.
 *   `P-08` — l'origine est SÉLECTIONNÉE, jamais déduite. Une relation saisie
 *     par un humain vaut `declaree`, ce qui est la définition du cahier :
 *     « déclarée (saisie humaine) » (`CDC:901`). Rien d'autre n'écrit cette
 *     colonne à ce jour : `deduite` et `ambigue` attendent l'inférence, que
 *     M08.3 nomme sans la spécifier — le produit n'en fabrique aucune, et le
 *     vide est remonté plutôt que comblé.
 *   `RG-M08-05` — supprimer une note supprime ses relations : c'est la cascade
 *     du schéma, aucune ligne d'ici n'y touche.
 *   `RG-M08-07` — un type utilisé ne se supprime pas sans réaffectation : c'est
 *     la console, et ce module ne la connaît pas. La référence `RESTRICT` de
 *     `type_de_relation_id` reste sa garantie de dernier ressort.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * « DOMAINE » AU CAHIER, DOSSIER À LA BASE — ET CE N'EST PAS UN CHOIX D'ICI
 *
 * `RG-M08-04` parle du « domaine de la source et de la cible ». Le modèle de
 * droits du produit ne pose aucun droit sur un domaine : `droits_de_dossier`
 * ne référence que des dossiers, et `RG-DRO-01` fait descendre un droit posé
 * haut sur toute la branche. Un droit d'écriture « sur le domaine » se lit donc
 * en résolvant le dossier PORTEUR de la note, exactement comme le fait déjà
 * `/notes/{identifiant}/modifier`. Aucune règle nouvelle n'est écrite ; la
 * même autorité répond.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE REFUS EST UN SEUL OCTET — `RG-ACC-04`, `ADR-007`
 *
 * Une cible qui n'existe pas, une cible qu'on n'a pas le droit de lire, une
 * cible sur laquelle on n'a pas le droit d'écrire et un type inconnu rendent le
 * MÊME résultat : `INTROUVABLE`. Il n'existe pas de motif « interdit » à
 * remonter, et le type de retour n'en offre pas la place. Les deux seuls échecs
 * NOMMÉS — le doublon et la relation réflexive — ne révèlent rien : ils portent
 * sur une note que l'appelant lit déjà et sur des relations qu'il voit déjà.
 */
import { and, eq, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Base } from '../base/acces';
import { domaines, notes, relations, typesDeNote, typesDeRelation } from '../base/schema';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { peutEcrireSurLeDossier } from './edition';
import type { OrigineDeRelation } from './outils';

/* ═══════════════════════════════════════════ Le mot de l'origine ═══════ */

/**
 * LES TROIS MOTS DE `M08.3`, RECOPIÉS DU CAHIER ET DE LUI SEUL — `CDC:901` :
 * « déclarée (saisie humaine), déduite (inférée par le produit), ambiguë (à
 * confirmer) ».
 *
 * C'est la SEULE traduction de l'énuméré `origine_de_relation` du produit. Une
 * seconde table de mots quelque part ailleurs ferait de `P-08` deux signaux
 * concurrents, exactement ce que `P-01` interdit à la fraîcheur.
 */
export const MOT_DE_L_ORIGINE: Readonly<Record<OrigineDeRelation, string>> = Object.freeze({
	declaree: 'déclarée',
	deduite: 'déduite',
	ambigue: 'ambiguë'
});

/** La glose du cahier, mot pour mot — ce que chaque origine veut dire. */
export const GLOSE_DE_L_ORIGINE: Readonly<Record<OrigineDeRelation, string>> = Object.freeze({
	declaree: 'saisie humaine',
	deduite: 'inférée par le produit',
	ambigue: 'à confirmer'
});

/**
 * Le mot d'une origine. Passer par une fonction plutôt que par la table permet
 * de refuser une valeur que la base n'aurait pas dû rendre — la colonne est un
 * énuméré `notNull`, donc ce refus ne peut venir que d'un schéma désaccordé.
 */
export function libelleDOrigine(origine: OrigineDeRelation): string {
	const mot = MOT_DE_L_ORIGINE[origine];
	if (mot === undefined) throw new Error(`origine de relation inconnue : ${String(origine)}`);
	return mot;
}

/* ═══════════════════════════════════════════ Ce qu'une relation rend ═══ */

/** La note à l'autre bout — son titre, son type, son domaine. */
export interface NoteAuBout {
	readonly identifiant: string;
	readonly titre: string;
	/** Le type de la note — « Serveur », « Application ». */
	readonly type: string;
	readonly domaine: string;
}

/**
 * UNE RELATION, LUE DEPUIS UNE NOTE.
 *
 * `sens` n'est pas décoratif : c'est lui qui a décidé du `libelle`, et le
 * conserver permet à l'écran de dire de quel côté la relation a été déclarée
 * sans recalculer quoi que ce soit.
 */
export interface RelationDeLaNote {
	/** La clé de la ligne — ce que le retrait vise, et rien d'autre. */
	readonly id: string;
	readonly sens: 'sortante' | 'entrante';
	/** L'identifiant du type — `heberge`, `depend`… */
	readonly type: string;
	/** Le libellé ADAPTÉ AU SENS DE LECTURE — `RG-M08-06`. */
	readonly libelle: string;
	/** `P-08` — la colonne, jamais une déduction. */
	readonly origine: OrigineDeRelation;
	readonly autre: NoteAuBout;
}

/** Un groupe d'affichage : un libellé, et les relations qu'il porte. */
export interface GroupeDeRelationsDeLaNote {
	readonly libelle: string;
	readonly relations: readonly RelationDeLaNote[];
}

/**
 * LE GROUPEMENT PAR LIBELLÉ — « les relations sont groupées par type dans
 * l'affichage » (`M08.3`).
 *
 * L'ordre des groupes est celui de la première relation rencontrée, et celui
 * des relations est celui reçu : la requête trie par `types_de_relation.ordre`
 * puis par titre, et ce sont les deux seuls ordres que la base porte. Aucun
 * classement n'est inventé ici. Fonction PURE, éprouvée sans base.
 */
export function grouperLesRelations(
	lues: readonly RelationDeLaNote[]
): readonly GroupeDeRelationsDeLaNote[] {
	const groupes = new Map<string, RelationDeLaNote[]>();
	for (const r of lues) {
		const deja = groupes.get(r.libelle);
		if (deja === undefined) groupes.set(r.libelle, [r]);
		else deja.push(r);
	}
	return [...groupes].map(([libelle, relationsDuGroupe]) => ({
		libelle,
		relations: relationsDuGroupe
	}));
}

/* ═══════════════════════════════════════════ La lecture ════════════════ */

/**
 * LES RELATIONS D'UNE NOTE, DANS LES DEUX SENS, BORNÉES AU PÉRIMÈTRE.
 *
 * `lisibles` est la liste des identifiants que l'appelant a le droit de lire —
 * `lireLaNote()` l'a déjà calculée. Elle entre DANS la requête (`ADR-006`) :
 * une relation vers une note interdite n'apparaît pas, faute de quoi le panneau
 * publierait l'existence, et le titre, d'une note qu'on refuse par ailleurs.
 *
 * `notes` est jointe DEUX FOIS — la note lue d'un côté, l'autre bout de
 * l'autre —, ce qui exige un alias : sans lui, la seconde jointure écrase la
 * première. C'est la raison que `lireRelations()` donne, et cette requête en
 * reprend la forme.
 */
export async function lireLesRelationsDeLaNote(
	base: Base,
	cleDeLaNote: string,
	lisibles: readonly string[]
): Promise<readonly RelationDeLaNote[]> {
	if (lisibles.length === 0) return [];
	const autre = alias(notes, 'note_autre');

	const sortantes = await base
		.select({
			id: relations.id,
			type: typesDeRelation.identifiant,
			libelle: typesDeRelation.libelleSortant,
			origine: relations.origine,
			identifiant: autre.identifiant,
			titre: autre.titre,
			typeDeNote: typesDeNote.nom,
			domaine: domaines.nom
		})
		.from(relations)
		.innerJoin(typesDeRelation, eq(relations.typeDeRelationId, typesDeRelation.id))
		.innerJoin(autre, eq(relations.cibleId, autre.id))
		.innerJoin(typesDeNote, eq(autre.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(autre.domaineId, domaines.id))
		.where(and(eq(relations.sourceId, cleDeLaNote), inArray(autre.identifiant, [...lisibles])))
		.orderBy(typesDeRelation.ordre, autre.titre);

	const entrantes = await base
		.select({
			id: relations.id,
			type: typesDeRelation.identifiant,
			libelle: typesDeRelation.libelleEntrant,
			origine: relations.origine,
			identifiant: autre.identifiant,
			titre: autre.titre,
			typeDeNote: typesDeNote.nom,
			domaine: domaines.nom
		})
		.from(relations)
		.innerJoin(typesDeRelation, eq(relations.typeDeRelationId, typesDeRelation.id))
		.innerJoin(autre, eq(relations.sourceId, autre.id))
		.innerJoin(typesDeNote, eq(autre.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(autre.domaineId, domaines.id))
		.where(and(eq(relations.cibleId, cleDeLaNote), inArray(autre.identifiant, [...lisibles])))
		.orderBy(typesDeRelation.ordre, autre.titre);

	const composer = (
		ligne: (typeof sortantes)[number],
		sens: 'sortante' | 'entrante'
	): RelationDeLaNote => ({
		id: ligne.id,
		sens,
		type: ligne.type,
		libelle: ligne.libelle,
		origine: ligne.origine,
		autre: {
			identifiant: ligne.identifiant,
			titre: ligne.titre,
			type: ligne.typeDeNote,
			domaine: ligne.domaine
		}
	});

	return [
		...sortantes.map((l) => composer(l, 'sortante')),
		...entrantes.map((l) => composer(l, 'entrante'))
	];
}

/** Un type de relation offert au choix — ses deux libellés, `RG-M08-06`. */
export interface TypeDeRelationOffert {
	readonly identifiant: string;
	readonly sortant: string;
	readonly entrant: string;
}

/** Les types de relation du référentiel, dans leur ordre d'administration. */
export async function lireLesTypesOfferts(base: Base): Promise<readonly TypeDeRelationOffert[]> {
	return await base
		.select({
			identifiant: typesDeRelation.identifiant,
			sortant: typesDeRelation.libelleSortant,
			entrant: typesDeRelation.libelleEntrant
		})
		.from(typesDeRelation)
		.orderBy(typesDeRelation.ordre);
}

/**
 * LES NOTES QUE L'APPELANT PEUT VISER — celles qu'il lit ET sur lesquelles il
 * peut écrire, la note courante exclue.
 *
 * `P-09` est la raison de ce filtre : une note qu'on ne peut pas relier ne doit
 * pas être proposée, sous peine d'offrir une action refusée après le clic. La
 * capacité est résolue par `peutEcrireSurLeDossier()`, l'implémentation unique,
 * sur le dossier PORTEUR — voir l'en-tête, « domaine au cahier, dossier à la
 * base ».
 */
export async function lireLesCiblesPossibles(
	base: Base,
	identite: Identite,
	/** L'identifiant lisible de la note courante — elle s'exclut elle-même. */
	identifiantDeLaNote: string,
	lisibles: readonly string[]
): Promise<readonly NoteAuBout[]> {
	/* La note courante sort du jeu AVANT la résolution des droits : une note ne
	   se relie pas à elle-même (`relations_pas_reflexives`), et la garder
	   coûterait une résolution pour un candidat que le schéma refuse. */
	const visables = lisibles.filter((i) => i !== identifiantDeLaNote);
	if (visables.length === 0) return [];

	const candidates = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			dossierId: notes.dossierId,
			typeDeNote: typesDeNote.nom,
			domaine: domaines.nom
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.where(inArray(notes.identifiant, visables))
		.orderBy(notes.titre);

	const retenues: NoteAuBout[] = [];
	for (const c of candidates) {
		if (c.dossierId === null) continue;
		if (!(await peutEcrireSurLeDossier(base, identite, c.dossierId))) continue;
		retenues.push({
			identifiant: c.identifiant,
			titre: c.titre,
			type: c.typeDeNote,
			domaine: c.domaine
		});
	}
	return retenues;
}

/* ═══════════════════════════════════════════ La saisie ═════════════════ */

/** Ce qu'une déclaration de relation demande : un type, une note visée. */
export interface SaisieDeRelation {
	readonly type: string;
	readonly cible: string;
}

/** Ce qu'une lecture de saisie rend : la saisie, ou le motif du refus. */
export type LectureDeSaisie =
	| { readonly ok: true; readonly saisie: SaisieDeRelation }
	| { readonly ok: false; readonly motif: string };

/**
 * LA SAISIE, LUE DU FORMULAIRE ET DE RIEN D'AUTRE. Fonction PURE au sens qui
 * compte : elle ne touche ni la base, ni l'horloge, ni les droits — elle
 * s'éprouve sans aucun des trois.
 */
export function lireLaSaisieDeRelation(donnees: FormData): LectureDeSaisie {
	const type = (donnees.get('type') ?? '').toString().trim();
	const cible = (donnees.get('cible') ?? '').toString().trim();
	if (type === '') return { ok: false, motif: 'aucun type de relation choisi' };
	if (cible === '') return { ok: false, motif: 'aucune note visée' };
	return { ok: true, saisie: { type, cible } };
}

/* ═══════════════════════════════════════════ L'écriture ════════════════ */

/**
 * LES DEUX SEULS ÉCHECS QU'ON PEUT NOMMER SANS RIEN RÉVÉLER.
 *
 * Tout le reste — cible absente, cible illisible, cible interdite en écriture,
 * type inconnu — rend `INTROUVABLE`, par le même chemin et sans nuance.
 */
export type MotifDeRefus = 'doublon' | 'reflexive';

/**
 * LA FORME D'UNE CLÉ, VÉRIFIÉE AVANT LA REQUÊTE — et ce n'est pas une coquetterie.
 *
 * `relations.id` est un `uuid` : comparer la colonne à une chaîne qui n'en est
 * pas un fait sortir PostgreSQL en erreur de syntaxe, laquelle remonte en 500.
 * Une valeur soumise depuis un formulaire n'est jamais présumée bien formée ;
 * mal formée, elle ne désigne rien, et « ne désigne rien » est déjà un refus
 * que ce module sait rendre.
 */
const FORME_DE_CLE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EcritureDeRelation =
	{ readonly ok: true; readonly id: string } | { readonly ok: false; readonly motif: MotifDeRefus };

/** Ce qu'une relation écrite rend à l'appelant. */
export type ResultatDAjout = Resolution<EcritureDeRelation>;

/**
 * DÉCLARER UNE RELATION — `UC-M08-02`.
 *
 * L'ORDRE DES PORTES N'EST PAS INDIFFÉRENT. La source est résolue d'abord, avec
 * son droit ; rien de la saisie n'a encore servi. Puis la cible, puis le type.
 * Un appelant sans droit sur la source ne fait donc pas payer une requête de
 * plus au produit, et ne peut pas sonder l'existence d'une cible.
 */
export async function ajouterUneRelation(
	base: Base,
	demande: {
		readonly identite: Identite;
		/** L'identifiant lisible de la note SOURCE, déjà résolue par la route. */
		readonly source: string;
		readonly saisie: SaisieDeRelation;
	}
): Promise<ResultatDAjout> {
	const [source] = await base
		.select({ cle: notes.id, dossierId: notes.dossierId })
		.from(notes)
		.where(eq(notes.identifiant, demande.source))
		.limit(1);
	if (source === undefined || source.dossierId === null) return INTROUVABLE;
	if (!(await peutEcrireSurLeDossier(base, demande.identite, source.dossierId))) {
		return INTROUVABLE;
	}

	const [cible] = await base
		.select({ cle: notes.id, dossierId: notes.dossierId })
		.from(notes)
		.where(eq(notes.identifiant, demande.saisie.cible))
		.limit(1);
	if (cible === undefined || cible.dossierId === null) return INTROUVABLE;
	/* `RG-M08-04` — les DEUX extrémités, jamais une seule. */
	if (!(await peutEcrireSurLeDossier(base, demande.identite, cible.dossierId))) {
		return INTROUVABLE;
	}

	/* Une note ne se relie pas à elle-même : `relations_pas_reflexives` le
	   refuse au schéma, et le refuser ici rend un message plutôt qu'une
	   violation de contrainte. */
	if (source.cle === cible.cle)
		return { trouve: true, ressource: { ok: false, motif: 'reflexive' } };

	const [type] = await base
		.select({ cle: typesDeRelation.id })
		.from(typesDeRelation)
		.where(eq(typesDeRelation.identifiant, demande.saisie.type))
		.limit(1);
	if (type === undefined) return INTROUVABLE;

	/* `RG-M08-03` — une même relation ne peut exister qu'une fois. La contrainte
	   `relations_unicite` en reste la garantie ; cette lecture ne fait que
	   rendre le refus lisible. */
	const [deja] = await base
		.select({ cle: relations.id })
		.from(relations)
		.where(
			and(
				eq(relations.sourceId, source.cle),
				eq(relations.cibleId, cible.cle),
				eq(relations.typeDeRelationId, type.cle)
			)
		)
		.limit(1);
	if (deja !== undefined) return { trouve: true, ressource: { ok: false, motif: 'doublon' } };

	const [ecrite] = await base
		.insert(relations)
		.values({
			sourceId: source.cle,
			cibleId: cible.cle,
			typeDeRelationId: type.cle,
			/* `P-08` — saisie humaine, donc `declaree` (`CDC:901`). La colonne a
			   ce défaut au schéma ; l'écrire ici dit l'intention plutôt que de la
			   laisser à une valeur par défaut qu'un autre chemin pourrait changer. */
			origine: 'declaree'
		})
		.returning({ cle: relations.id });

	if (ecrite === undefined) return INTROUVABLE;
	return { trouve: true, ressource: { ok: true, id: ecrite.cle } };
}

/**
 * RETIRER UNE RELATION — « chaque relation est supprimable » (`M08.3`).
 *
 * TROIS CONDITIONS, ET LA TROISIÈME EST CELLE QU'ON OUBLIE : la ligne visée
 * doit avoir la note courante à L'UNE de ses deux extrémités. Sans elle,
 * l'identifiant d'une relation quelconque, soumis depuis n'importe quelle note,
 * suffirait à la détruire — le droit serait vérifié sur les bonnes notes, mais
 * pas sur celles que l'appelant regarde.
 *
 * Le droit exigé est celui de `RG-M08-04` : écriture sur les deux extrémités.
 * La règle ne distingue pas la création de la suppression, et ce module non
 * plus.
 */
export async function retirerUneRelation(
	base: Base,
	demande: {
		readonly identite: Identite;
		/** L'identifiant lisible de la note depuis laquelle on retire. */
		readonly depuis: string;
		/** La clé de la relation visée. */
		readonly relation: string;
	}
): Promise<Resolution<{ readonly retiree: true }>> {
	if (!FORME_DE_CLE.test(demande.relation)) return INTROUVABLE;

	const [note] = await base
		.select({ cle: notes.id })
		.from(notes)
		.where(eq(notes.identifiant, demande.depuis))
		.limit(1);
	if (note === undefined) return INTROUVABLE;

	const source = alias(notes, 'note_source');
	const cible = alias(notes, 'note_cible');
	const [ligne] = await base
		.select({
			cle: relations.id,
			sourceDossier: source.dossierId,
			cibleDossier: cible.dossierId
		})
		.from(relations)
		.innerJoin(source, eq(relations.sourceId, source.id))
		.innerJoin(cible, eq(relations.cibleId, cible.id))
		.where(
			and(
				eq(relations.id, demande.relation),
				or(eq(relations.sourceId, note.cle), eq(relations.cibleId, note.cle))
			)
		)
		.limit(1);
	if (ligne === undefined) return INTROUVABLE;
	if (ligne.sourceDossier === null || ligne.cibleDossier === null) return INTROUVABLE;

	if (!(await peutEcrireSurLeDossier(base, demande.identite, ligne.sourceDossier))) {
		return INTROUVABLE;
	}
	if (!(await peutEcrireSurLeDossier(base, demande.identite, ligne.cibleDossier))) {
		return INTROUVABLE;
	}

	await base.delete(relations).where(eq(relations.id, ligne.cle));
	return { trouve: true, ressource: { retiree: true } };
}
