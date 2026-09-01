/**
 * La suppression d'une note — `RG-M04-10`, `RG-M07-04`, `RG-M14-03`, `RG-M14-05`.
 *
 * Aucune règle de droit n'est écrite ici : `resoudreLEditionDUneNote()` porte la DÉCISION
 * d'accès et le refus. `RG-M14-03` — « atomique et définitive : soit tout, soit rien. Il n'y a
 * pas de corbeille » : aucune colonne ne porte de date d'effacement.
 *
 * L'ATOMICITÉ EST CELLE DU SCHÉMA : les sept clés étrangères qui référencent `notes.id` sont
 * en `ON DELETE CASCADE`, `relations` y figurant DEUX FOIS — ce qui rend `RG-M08-05`
 * structurel. Aucune ligne de ce module ne les énumère : les énumérer serait une seconde
 * définition de ce que « tout son historique » emporte, fausse le jour où une table s'ajoute.
 *
 * `RG-M14-05` — l'entretien est APPELÉ, jamais réécrit, et il SUIT la validation de la
 * transaction. `entretenirLIndex()` DÉDUIT la disparition de la base ; `retirerDesNotes()`
 * n'est pas appelé directement — ce serait un second chemin d'indexation.
 *
 * `RG-M04-10` — la confirmation est un fait d'ÉCRAN, et l'action n'exige AUCUNE saisie du nom
 * exact. Le gel annonce un décompte de plus que la règle — les pièces jointes
 * (`V-40:3295-3297`) — et les maquettes priment.
 *
 * LE NOMBRE DE RÉTROLIENS ANNONCÉ EST CELUI QUE L'APPELANT PEUT VOIR (`RG-ACC-01`) : annoncer
 * un total plus élevé révélerait l'existence de notes rangées dans des dossiers interdits.
 */
import { eq, sql } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { domaines, notes, univers, versions } from '../base/schema';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { adresseDeDomaine, identifiantLisible } from '../rangement/adresses';
import { entretenirLIndex } from '../recherche/entretien';
import { auteurDeLaSuppression, tracerUneSuppression } from './traces';
import { accord } from '../vocabulaire';
import { resoudreLEditionDUneNote } from './edition';
import type { ContexteDeLecture } from './lecture';
import type { Retrolien } from './note';

/**
 * L'état d'une note à l'instant où sa destruction est demandée, réduit à ce que
 * `RG-M04-10` fait annoncer. C'est la SEULE entrée du résumé : la fonction qui
 * le compose ne lit ni base, ni horloge, ni identité.
 */
export interface EtatAvantSuppression {
	readonly titre: string;
	/** Les rétroliens VISIBLES PAR L'APPELANT — voir l'en-tête, `RG-ACC-01`. */
	readonly retroliens: readonly Retrolien[];
	/** Le nombre de lignes que `versions` porte pour cette note. */
	readonly versions: number;
	/**
	 * Le nombre de pièces jointes — le compte RÉEL de la table. Il vaut 0 partout
	 * tant que rien n'écrit de pièce : c'est un fait, et le rendre autrement serait
	 * `P-02`.
	 */
	readonly piecesJointes: number;
}

/**
 * Ce que la boîte de dialogue annonce — et elle en annonce QUATRE, pas trois.
 * `RG-M04-10` nomme le titre, les rétroliens et les versions ; le gel en nomme un
 * de plus, les pièces jointes (`V-40:3297`), et les maquettes priment. L'écart
 * entre les deux sources est déclaré plutôt que tu.
 */
export interface ResumeDeSuppression {
	readonly titre: string;
	/**
	 * Le nombre de NOTES CITANTES, jamais le nombre de liens : une note qui cite
	 * deux fois celle qu'on détruit ne portera qu'un rétrolien cassé, ce que
	 * `retroliensVers()` décide en dédupliquant. Rien ici ne recompte.
	 */
	readonly retroliensCasses: number;
	readonly versionsPerdues: number;
	/** La troisième puce du gel — `V-40:3297`. Voir l'en-tête de l'interface. */
	readonly piecesJointesPerdues: number;
}

/**
 * Le résumé, extrait de la résolution — extrait pour la raison que `P-26` nomme : un contrôle
 * dont le seul cas d'épreuve est l'état de la base est un contrôle qu'on espère. Cette
 * fonction est PURE. LE REFUS TRAVERSE SANS ÊTRE RÉÉCRIT : `INTROUVABLE` est un objet gelé
 * unique, rendu TEL QUEL — un refus recomposé ici serait un second refus, égal mais distinct.
 */
export function resumeDeSuppression(
	etat: Resolution<EtatAvantSuppression>
): Resolution<ResumeDeSuppression> {
	if (!etat.trouve) return INTROUVABLE;
	return {
		trouve: true,
		ressource: {
			titre: etat.ressource.titre,
			retroliensCasses: etat.ressource.retroliens.length,
			versionsPerdues: etat.ressource.versions,
			piecesJointesPerdues: etat.ressource.piecesJointes
		}
	};
}

/**
 * CE QUI EST PARTI AVEC LA NOTE, EN CLAIR — la trace de `RG-NF-05` reprend le décompte que
 * l'écran de confirmation a DÉJÀ montré, jamais un second calculé autrement. Les postes à
 * zéro sont TUS : « 0 version perdue » est du bruit dans un journal qu'on relit.
 */
function detailDeLaNote(resume: ResumeDeSuppression): string {
	const postes: string[] = [];
	if (resume.retroliensCasses > 0) {
		postes.push(
			`${String(resume.retroliensCasses)} ${accord(resume.retroliensCasses, 'rétrolien cassé', 'rétroliens cassés')}`
		);
	}
	if (resume.versionsPerdues > 0) {
		postes.push(
			`${String(resume.versionsPerdues)} ${accord(resume.versionsPerdues, 'version', 'versions')}`
		);
	}
	if (resume.piecesJointesPerdues > 0) {
		postes.push(
			`${String(resume.piecesJointesPerdues)} ${accord(resume.piecesJointesPerdues, 'pièce jointe', 'pièces jointes')}`
		);
	}
	return postes.join(', ');
}

export interface DemandeDeSuppression {
	readonly identifiant: string;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
}

export interface SuppressionFaite {
	/** Ce qui a été détruit, dans les termes de `RG-M04-10`. */
	readonly resume: ResumeDeSuppression;
	/**
	 * L'adresse du domaine de la note détruite — la cible du `303`. Elle est
	 * CALCULÉE AVANT la destruction, parce qu'après il n'y a plus de note d'où la
	 * tirer. Sa forme est celle d'`adresseDeDomaine()`, seule forme publiée.
	 */
	readonly adresseDeRetour: string;
}

/** Le nombre de versions d'une note — `RG-M04-10`, « versions perdues ». */
async function compterLesVersions(base: Base, identifiant: string): Promise<number> {
	const [ligne] = await base
		.select({ nombre: sql<number>`count(*)::int` })
		.from(versions)
		.innerJoin(notes, eq(versions.noteId, notes.id))
		.where(eq(notes.identifiant, identifiant));
	return ligne?.nombre ?? 0;
}

/**
 * Détruit une note — quatre portes, dans cet ordre, et aucune n'est facultative.
 *
 *  1. LE DROIT, par le chemin qui existe : `resoudreLEditionDUneNote()` est appelée, jamais
 *     recopiée. Un anonyme ne peut pas la franchir (`RG-DRO-04`). Le registre demandé est
 *     `reference`, toujours présent ; seul le VERDICT de la résolution est employé.
 *  2. CE QUI VA DISPARAÎTRE EST MESURÉ AVANT : après la transaction, aucun des trois décomptes
 *     n'est plus lisible.
 *  3. LA DESTRUCTION, en une transaction, PAR LA CASCADE — un seul `delete`.
 *  4. L'INDEX APRÈS LA TRANSACTION, JAMAIS DEDANS.
 *
 * CE QU'ELLE NE FAIT PAS : les OCTETS des pièces jointes vivent hors de la base, et la cascade
 * emporte les LIGNES, pas les fichiers. Ils deviennent inatteignables mais restent sur le
 * disque.
 *
 * @throws `DocumentInvalide` — la résolution analyse le corps du registre.
 * @throws l'erreur de SOUMISSION au moteur : la note est alors DÉTRUITE et son entrée d'index
 *   survit ; l'appelant reçoit l'échec plutôt qu'un silence.
 */
export async function supprimerUneNote(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeSuppression
): Promise<Resolution<SuppressionFaite>> {
	const acces = await resoudreLEditionDUneNote(base, {
		identifiant: demande.identifiant,
		registre: 'reference',
		identite: demande.identite,
		contexte: demande.contexte
	});
	if (!acces.trouve) return INTROUVABLE;
	const lecture = acces.ressource.lecture;

	const resume = resumeDeSuppression({
		trouve: true,
		ressource: {
			titre: lecture.note.titre,
			retroliens: lecture.retroliens,
			versions: await compterLesVersions(base, demande.identifiant),
			/* Le compte réel de la table, déjà porté par la note résolue — aucune
			   seconde requête, et surtout aucun chiffre inventé (`P-02`). */
			piecesJointes: lecture.note.pj
		}
	});
	/* La résolution vient d'être composée `trouve: true` : cette branche est
	   inatteignable, et elle n'est pas une garde — c'est le type qui refuse de lire
	   une ressource sans avoir lu son verdict. */
	if (!resume.trouve) return INTROUVABLE;

	/**
	 * L'adresse de retour se compose sur les identifiants PERSISTÉS. Composée sur les NOMS
	 * d'affichage slugifiés, détruire une note d'un domaine renommé renvoyait en 404 juste après
	 * une destruction réussie (`RG-M12-11`). Les deux sont LUS avant la destruction — après, la
	 * note n'est plus là pour les donner.
	 */
	const [rangement] = await base
		.select({ univers: univers.identifiant, domaine: domaines.identifiant })
		.from(notes)
		.innerJoin(domaines, eq(domaines.id, notes.domaineId))
		.innerJoin(univers, eq(univers.id, domaines.universId))
		.where(eq(notes.identifiant, demande.identifiant))
		.limit(1);
	const adresseDeRetour = adresseDeDomaine(
		rangement?.univers ?? identifiantLisible(lecture.note.univers),
		rangement?.domaine ?? identifiantLisible(lecture.note.domaine)
	);

	/* `RG-NF-05` — L'AUTEUR EST EXIGÉ AVANT LA TRANSACTION : un refus doit tomber
	   avant toute destruction, jamais au milieu. */
	const auteur = auteurDeLaSuppression(demande.identite);

	await base.transaction(async (tx) => {
		await tx.delete(notes).where(eq(notes.identifiant, demande.identifiant));
		/* LA TRACE EST DANS LA MÊME TRANSACTION QUE LA DESTRUCTION — écrite à côté,
		   elle mentirait dès la première annulation. */
		await tracerUneSuppression(tx, {
			objet: 'note',
			reference: demande.identifiant,
			designation: resume.ressource.titre,
			detail: detailDeLaNote(resume.ressource),
			auteur
		});
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
	await entretenirLIndex(base, client, [demande.identifiant]);

	return { trouve: true, ressource: { resume: resume.ressource, adresseDeRetour } };
}
