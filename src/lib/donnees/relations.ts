/**
 * Les relations d'une note — les lire avec leur ORIGINE, en déclarer une, en retirer une.
 *
 * La table existe depuis longtemps et les cartographies la lisent, mais AUCUNE ROUTE n'en
 * écrivait une : le graphe était en lecture seule, et `UC-M08-02` n'avait aucun chemin. Ce
 * module ne lit ni n'écrit un seul libellé de relation : les six types vivent dans
 * `types_de_relation`, administrables par la console.
 *
 * LES RÈGLES PORTÉES, ET LEUR LIEU EXACT :
 *
 *   `RG-M08-03` — unicité (source, cible, type), portée par la CONTRAINTE
 *     `relations_unicite` ; la vérification faite ici la précède pour rendre un refus lisible,
 *     elle ne la remplace pas.
 *   `RG-M08-04` — le droit d'écriture sur les DEUX extrémités.
 *   `RG-M08-06` — le libellé rendu est celui du SENS de lecture.
 *   `P-08` — l'origine est SÉLECTIONNÉE, jamais déduite : une saisie humaine vaut `declaree`.
 *     `deduite` et `ambigue` attendent l'inférence, que M08.3 nomme sans la spécifier.
 *   `RG-M08-05` — la cascade du schéma, aucune ligne d'ici n'y touche.
 *   `RG-M08-07` — la console ; la référence `RESTRICT` reste la garantie de dernier ressort.
 *
 * « DOMAINE » AU CAHIER, DOSSIER À LA BASE : `RG-M08-04` parle du « domaine », mais
 * `droits_de_dossier` ne référence que des dossiers et `RG-DRO-01` fait descendre un droit
 * posé haut. Un droit « sur le domaine » se lit donc en résolvant le dossier PORTEUR.
 *
 * LE REFUS EST UN SEUL OCTET : cible absente, illisible, interdite en écriture ou type inconnu
 * rendent le MÊME `INTROUVABLE`. Les deux seuls échecs NOMMÉS — doublon et relation réflexive
 * — portent sur une note que l'appelant lit déjà.
 */
import { and, eq, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { auteurDeLaSuppression, tracerUneSuppression } from './traces';
import type { Base } from '../base/acces';
import { domaines, notes, relations, typesDeNote, typesDeRelation } from '../base/schema';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { peutEcrireSurLeDossier } from './edition';
import type { OrigineDeRelation } from './outils';

/**
 * Les trois mots de `M08.3`, recopiés du cahier et de lui seul (`CDC:901`). C'est la
 * SEULE traduction de l'énuméré `origine_de_relation` : une seconde table de mots
 * ferait de `P-08` deux signaux concurrents.
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
 * Le mot d'une origine. Passer par une fonction plutôt que par la table permet de
 * refuser une valeur que la base n'aurait pas dû rendre — la colonne est un énuméré
 * `notNull`, donc ce refus ne peut venir que d'un schéma désaccordé.
 */
export function libelleDOrigine(origine: OrigineDeRelation): string {
	const mot = MOT_DE_L_ORIGINE[origine];
	if (mot === undefined) throw new Error(`origine de relation inconnue : ${String(origine)}`);
	return mot;
}

export interface NoteAuBout {
	readonly identifiant: string;
	readonly titre: string;
	/** Le type de la note — « Serveur », « Application ». */
	readonly type: string;
	readonly domaine: string;
}

/**
 * Une relation, lue depuis une note. `sens` n'est pas décoratif : c'est lui qui a
 * décidé du `libelle`, et le conserver permet à l'écran de dire de quel côté la
 * relation a été déclarée sans rien recalculer.
 */
export interface RelationDeLaNote {
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

export interface GroupeDeRelationsDeLaNote {
	readonly libelle: string;
	readonly relations: readonly RelationDeLaNote[];
}

/**
 * Le groupement par libellé — « les relations sont groupées par type dans
 * l'affichage » (`M08.3`). L'ordre des groupes est celui de la première relation
 * rencontrée, et celui des relations est celui reçu : la requête trie par
 * `types_de_relation.ordre` puis par titre, seuls ordres que la base porte.
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

/**
 * Les relations d'une note, dans les deux sens, bornées au périmètre. `lisibles` entre DANS la
 * requête (`ADR-006`) : une relation vers une note interdite n'apparaît pas, faute de quoi le
 * panneau publierait l'existence, et le titre, d'une note qu'on refuse par ailleurs. `notes`
 * est jointe DEUX FOIS, ce qui exige un alias.
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
 * Les notes que l'appelant peut viser — celles qu'il lit ET sur lesquelles il peut écrire, la
 * note courante exclue. `P-09` est la raison de ce filtre : une note qu'on ne peut pas relier
 * ne doit pas être proposée.
 */
export async function lireLesCiblesPossibles(
	base: Base,
	identite: Identite,
	identifiantDeLaNote: string,
	lisibles: readonly string[]
): Promise<readonly NoteAuBout[]> {
	/* La note courante sort du jeu AVANT la résolution des droits : une note ne se
	   relie pas à elle-même (`relations_pas_reflexives`), et la garder coûterait une
	   résolution pour un candidat que le schéma refuse. */
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

export interface SaisieDeRelation {
	readonly type: string;
	readonly cible: string;
}

export type LectureDeSaisie =
	| { readonly ok: true; readonly saisie: SaisieDeRelation }
	| { readonly ok: false; readonly motif: string };

/**
 * La saisie, lue du formulaire et de rien d'autre. Fonction PURE au sens qui compte :
 * elle ne touche ni la base, ni l'horloge, ni les droits.
 */
export function lireLaSaisieDeRelation(donnees: FormData): LectureDeSaisie {
	const type = (donnees.get('type') ?? '').toString().trim();
	const cible = (donnees.get('cible') ?? '').toString().trim();
	if (type === '') return { ok: false, motif: 'aucun type de relation choisi' };
	if (cible === '') return { ok: false, motif: 'aucune note visée' };
	return { ok: true, saisie: { type, cible } };
}

/**
 * Les deux seuls échecs qu'on peut nommer sans rien révéler. Tout le reste — cible
 * absente, illisible, interdite en écriture, type inconnu — rend `INTROUVABLE`, par
 * le même chemin et sans nuance.
 */
export type MotifDeRefus = 'doublon' | 'reflexive';

/**
 * La forme d'une clé, vérifiée AVANT la requête : `relations.id` est un `uuid`, et
 * comparer la colonne à une chaîne qui n'en est pas un fait sortir PostgreSQL en
 * erreur de syntaxe, laquelle remonte en 500. Mal formée, la valeur ne désigne rien,
 * et « ne désigne rien » est déjà un refus que ce module sait rendre.
 */
const FORME_DE_CLE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EcritureDeRelation =
	{ readonly ok: true; readonly id: string } | { readonly ok: false; readonly motif: MotifDeRefus };

export type ResultatDAjout = Resolution<EcritureDeRelation>;

/**
 * Déclarer une relation — `UC-M08-02`. L'ORDRE DES PORTES N'EST PAS INDIFFÉRENT : la source
 * est résolue d'abord, avec son droit, avant que rien de la saisie n'ait servi. Un appelant
 * sans droit sur la source ne peut donc pas sonder l'existence d'une cible.
 */
export async function ajouterUneRelation(
	base: Base,
	demande: {
		readonly identite: Identite;
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

	/* Une note ne se relie pas à elle-même : le schéma le refuse, et le refuser ici
	   rend un message plutôt qu'une violation de contrainte. */
	if (source.cle === cible.cle)
		return { trouve: true, ressource: { ok: false, motif: 'reflexive' } };

	const [type] = await base
		.select({ cle: typesDeRelation.id })
		.from(typesDeRelation)
		.where(eq(typesDeRelation.identifiant, demande.saisie.type))
		.limit(1);
	if (type === undefined) return INTROUVABLE;

	/* `RG-M08-03` — la contrainte `relations_unicite` reste la garantie ; cette
	   lecture ne fait que rendre le refus lisible. */
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
			/* `P-08` — saisie humaine, donc `declaree`. L'écrire ici dit l'intention
			   plutôt que de la laisser à une valeur par défaut. */
			origine: 'declaree'
		})
		.returning({ cle: relations.id });

	if (ecrite === undefined) return INTROUVABLE;
	return { trouve: true, ressource: { ok: true, id: ecrite.cle } };
}

/**
 * Retirer une relation — « chaque relation est supprimable » (`M08.3`).
 *
 * TROIS CONDITIONS, ET LA TROISIÈME EST CELLE QU'ON OUBLIE : la ligne visée doit avoir la note
 * courante à L'UNE de ses deux extrémités. Sans elle, l'identifiant d'une relation quelconque,
 * soumis depuis n'importe quelle note, suffirait à la détruire. Le droit exigé est celui de
 * `RG-M08-04` : la règle ne distingue pas la création de la suppression.
 */
export async function retirerUneRelation(
	base: Base,
	demande: {
		readonly identite: Identite;
		readonly depuis: string;
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
			cibleDossier: cible.dossierId,
			/* Les deux titres ne servent QU'À LA TRACE de `RG-NF-05` : après le retrait,
			   plus rien ne dirait quel lien a disparu. */
			sourceTitre: source.titre,
			cibleTitre: cible.titre
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

	/* `RG-NF-05` — l'auteur est exigé avant la destruction. */
	const auteur = auteurDeLaSuppression(demande.identite);

	/* UNE TRANSACTION LÀ OÙ IL N'Y EN AVAIT PAS : le retrait seul était atomique par
	   nature, la trace ne l'est plus — écrite hors transaction, elle survivrait à un
	   retrait refusé, ou manquerait à un retrait réussi. */
	await base.transaction(async (tx) => {
		await tx.delete(relations).where(eq(relations.id, ligne.cle));
		/* LA DÉSIGNATION EST LE LIEN, PAS LA RELATION : une relation n'a pas de nom, et
		   « source → cible » est la seule chose qui se relise. */
		await tracerUneSuppression(tx, {
			objet: 'relation',
			reference: ligne.cle,
			designation: `${ligne.sourceTitre} → ${ligne.cibleTitre}`,
			auteur
		});
	});
	return { trouve: true, ressource: { retiree: true } };
}
