/**
 * LA SUPPRESSION D'UNE NOTE — `RG-M04-10`, `RG-M07-04`, `RG-M14-03`,
 * `RG-M14-05`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE COMPOSE, IL NE REDÉFINIT RIEN
 *
 *   `./edition.ts`                 `resoudreLEditionDUneNote()` — la DÉCISION
 *                                  d'accès. Aucune règle de droit n'est écrite
 *                                  ici : « la note doit être lisible ET
 *                                  l'appelant doit avoir la capacité d'écrire
 *                                  des notes sur le dossier porteur » est la
 *                                  sienne, et le refus est le sien.
 *   `../recherche/entretien.ts`    `entretenirLIndex()` — l'entretien unique de
 *                                  l'index à l'écriture (`T-075`, `ARB-060`).
 *   `../rangement/adresses.ts`     la forme canonique d'une adresse de domaine
 *                                  (`ARB-001`), jamais composée à la main.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-M14-03` — « ATOMIQUE ET DÉFINITIVE : SOIT TOUT, SOIT RIEN. IL N'Y A PAS
 * DE CORBEILLE » (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:1147`)
 *
 * CE N'EST PAS UNE SUPPRESSION LOGIQUE. Aucune colonne de `notes` ne porte de
 * date d'effacement — `src/lib/base/schema.ts:430` et suivantes n'en déclarent
 * aucune —, et rien ici n'écrit ailleurs qu'en supprimant. « Il n'y a pas de
 * corbeille » est tenu par l'absence, pas par une intention.
 *
 * L'ATOMICITÉ EST CELLE DU SCHÉMA, ET ELLE SE LIT. Sept clés étrangères
 * référencent `notes.id` dans le dépôt ; les sept sont en `ON DELETE CASCADE`,
 * et il n'en existe aucune autre — relevé le 21/08/2026 sur les deux sources,
 * la description Drizzle et les migrations qui construisent réellement la base :
 *
 *   `etiquettes_de_note.note_id`  schema.ts:514   002_socle.montee.sql:407
 *   `relations.source_id`         schema.ts:548   002_socle.montee.sql:419
 *   `relations.cible_id`          schema.ts:551   002_socle.montee.sql:420
 *   `pieces_jointes.note_id`      schema.ts:572   002_socle.montee.sql:438
 *   `verifications.note_id`       schema.ts:592   002_socle.montee.sql:454
 *   `versions.note_id`            schema.ts:653   004_versions.montee.sql:48
 *   `consultations.note_id`       schema.ts:624   006_consultations.montee.sql:72
 *
 * `relations` y figure DEUX FOIS, et c'est ce qui rend `RG-M08-05` structurel :
 * la note part avec les relations dont elle est la source ET celles dont elle
 * est la cible. Aucune ligne de ce module ne les énumère — les énumérer serait
 * une seconde définition de ce que « tout son historique » emporte, et la
 * première serait fausse le jour où une table s'ajoute.
 *
 * `RG-M07-04` (`CDC:836`) — « la suppression d'une note supprime tout son
 * historique » — est donc tenue par `versions.note_id`, ligne 653, et non par
 * un effacement écrit ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-M14-05` — « DISPARAÎT IMMÉDIATEMENT DE LA RECHERCHE » (`CDC:1151`)
 *
 * L'ENTRETIEN EST APPELÉ, JAMAIS RÉÉCRIT, ET IL SUIT LA VALIDATION DE LA
 * TRANSACTION. `entretenirLIndex()` DÉDUIT la disparition de la base — son
 * en-tête le dit : « un identifiant demandé que la projection ne rend pas est un
 * identifiant qui n'existe plus, et il est retiré ». Rien ici ne lui dit ce
 * qu'il doit oublier, et `retirerDesNotes()` n'est donc pas appelé directement :
 * ce serait un second chemin d'indexation.
 *
 * L'index est la barrière de `/recherche` — la route lit en base les
 * identifiants QUE L'INDEX A RENDUS (`./public.ts`) —, et une entrée périmée y
 * serait une note détruite encore trouvable. C'est cela que `RG-M14-05`
 * interdit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-M04-10` — CE QUE LA CONFIRMATION ANNONCE, ET CE QU'ELLE NE PEUT PAS DIRE
 *
 * « La suppression est confirmée par une boîte de dialogue rappelant le titre,
 * le nombre de rétroliens qui deviendront cassés, et le nombre de versions
 * perdues » (`CDC:635`). La confirmation est un fait d'ÉCRAN — V-40 porte le
 * dialogue « Supprimer cette note » —, et l'action n'exige AUCUNE saisie du nom
 * exact : celle-ci est réservée aux dossiers (`RG-M03-04`) et aux domaines
 * (`RG-M14-02`). Aucun champ de confirmation n'est donc lu ici.
 *
 * ET LE GEL ANNONCE UN DÉCOMPTE DE PLUS QUE LA RÈGLE — les pièces jointes.
 * `mockups/V-40-dialogues.html:3295-3297` construit trois puces là où `RG-M04-10`
 * en nomme deux. *Maquettes > Cahier des charges* : le quatrième champ est
 * porté, et l'écart est déclaré (`ECART-048` É-5). Voir `ResumeDeSuppression`.
 *
 * LE NOMBRE DE RÉTROLIENS ANNONCÉ EST CELUI QUE L'APPELANT PEUT VOIR, et c'est
 * `RG-ACC-01` qui l'impose, non une commodité. Les rétroliens d'une lecture
 * résolue sont déduits des seuls corps que le périmètre de l'appelant rapporte
 * (`./note.ts`, `conditionDePerimetre()` posé dans le `where`) : annoncer un
 * total plus élevé révélerait l'existence de notes rangées dans des dossiers
 * interdits, c'est-à-dire exactement ce que « le filtrage est appliqué au plus
 * près de la donnée » refuse. Le chiffre est donc VRAI DU POINT DE VUE DE
 * L'APPELANT, et la lecture est déclarée plutôt que tue (`ECART-048` É-3).
 */
import { eq, sql } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { domaines, notes, univers, versions } from '../base/schema';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { adresseDeDomaine, identifiantLisible } from '../rangement/adresses';
import { entretenirLIndex } from '../recherche/entretien';
import { resoudreLEditionDUneNote } from './edition';
import type { ContexteDeLecture } from './lecture';
import type { Retrolien } from './note';

/* ═══════════════════════════════════ Ce que la confirmation annonce ═════ */

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
	 * Le nombre de pièces jointes — le compte RÉEL de la table, tel que
	 * `lirePiecesJointesParNote()` le rapporte (`./lecture.ts`). Il vaut 0
	 * partout tant que la semence n'écrit pas de pièce : « c'est un fait, pas un
	 * défaut de ce module », et le rendre autrement serait `P-02`.
	 */
	readonly piecesJointes: number;
}

/**
 * CE QUE LA BOÎTE DE DIALOGUE ANNONCE — et elle en annonce QUATRE, pas trois.
 *
 * `RG-M04-10` (`CDC:635`) nomme le titre, les rétroliens et les versions. LE GEL
 * EN NOMME UN DE PLUS, et le gel prime : `mockups/V-40-dialogues.html:3295-3297`
 * construit la liste « Ce qui disparaît avec elle » à partir de TROIS couples —
 *
 *   :3295   versions   « versions de son historique »
 *   :3296   retroliens « notes qui pointent vers elle »
 *   :3297   n.pj       « pièces jointes »
 *
 * — et la troisième puce n'a aucun équivalent dans la règle. L'ordre de
 * préséance ne laisse pas le choix : *Maquettes > Cahier des charges*. Le champ
 * est donc porté ici, et l'écart entre les deux sources est déclaré à
 * `ECART-048` É-5 plutôt que tu.
 */
export interface ResumeDeSuppression {
	readonly titre: string;
	/**
	 * Le nombre de NOTES CITANTES, jamais le nombre de liens. Une note qui cite
	 * deux fois celle qu'on détruit ne portera qu'un rétrolien cassé — c'est
	 * `retroliensVers()` qui le décide (`./note.ts`), en dédupliquant par note
	 * citante, et rien ici ne recompte.
	 */
	readonly retroliensCasses: number;
	readonly versionsPerdues: number;
	/** La troisième puce du gel — `V-40:3297`. Voir l'en-tête de l'interface. */
	readonly piecesJointesPerdues: number;
}

/**
 * LE RÉSUMÉ, EXTRAIT DE LA RÉSOLUTION — et il est extrait pour la raison que
 * `P-26` nomme : un contrôle dont le seul cas d'épreuve est l'état de la base
 * est un contrôle qu'on espère.
 *
 * Cette fonction est PURE — elle prend une résolution et rend une résolution —,
 * donc éprouvable SANS base, et sur les DEUX polarités que `P-5` exige : la note
 * résolue, et la note qui ne l'est pas. C'est la forme de `pieceJointeResolue()`
 * (`./edition.ts`), pour le même motif.
 *
 * LE REFUS TRAVERSE SANS ÊTRE RÉÉCRIT : `INTROUVABLE` est un objet gelé unique
 * (`../droits/resolution.ts:517`), rendu TEL QUEL. Un refus recomposé ici serait
 * un second refus, égal mais distinct, et `RG-ACC-04` demande qu'il n'y en ait
 * qu'un.
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

/* ═══════════════════════════════════ La destruction ═════════════════════ */

/** Ce qu'une suppression demande : l'adresse, et qui demande. */
export interface DemandeDeSuppression {
	readonly identifiant: string;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
}

/** Ce qu'une suppression rend quand elle a détruit. */
export interface SuppressionFaite {
	/** Ce qui a été détruit, dans les termes de `RG-M04-10`. */
	readonly resume: ResumeDeSuppression;
	/**
	 * L'adresse du domaine de la note détruite — la cible du `303`.
	 *
	 * Elle est CALCULÉE AVANT la destruction, parce qu'après il n'y a plus de
	 * note d'où la tirer. Sa forme est celle d'`adresseDeDomaine()`, seule forme
	 * publiée (`ARB-001`) : la forme raccourcie n'existe pas.
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
 * DÉTRUIT UNE NOTE — quatre portes, dans cet ordre, et aucune n'est facultative.
 *
 *  1. LE DROIT, par le chemin qui existe. `resoudreLEditionDUneNote()` est
 *     appelée, jamais recopiée : elle compose la lisibilité de la note (filtre
 *     de périmètre dans la requête, `ADR-006`) et la capacité `ecrireDesNotes`
 *     sur le dossier porteur. Un anonyme ne peut pas la franchir — `RG-DRO-04`,
 *     « les droits de dossier ne concernent pas l'anonyme », donc un droit nul
 *     et `ecrireDesNotes` à `false` : aucune branche d'identité n'est écrite
 *     ici, elle serait une seconde règle de droit.
 *
 *     Le registre demandé est `reference`. Il est TOUJOURS présent — `RG-NOT-02`
 *     fait de l'Opérationnel le registre facultatif —, et la destruction emporte
 *     les deux : le registre n'est ici qu'un paramètre d'une résolution dont
 *     seul le VERDICT est employé.
 *
 *  2. CE QUI VA DISPARAÎTRE EST MESURÉ AVANT, jamais après : le titre et les
 *     rétroliens viennent de la lecture déjà résolue, les versions d'un décompte
 *     sur la table. Après la transaction, aucun des trois n'est plus lisible.
 *
 *  3. LA DESTRUCTION, en une transaction, PAR LA CASCADE — un seul `delete`, et
 *     les sept clés étrangères de l'en-tête font le reste. La transaction est
 *     écrite parce que `RG-M14-03` l'exige en propres termes, et non parce que
 *     l'ordre en compterait deux.
 *
 *  4. L'INDEX APRÈS LA TRANSACTION, JAMAIS DEDANS — « de sorte qu'une
 *     transaction annulée ne puisse pas laisser un index amputé »
 *     (`../recherche/moteur.ts`).
 *
 * CE QUE CETTE FONCTION NE FAIT PAS, ET QUI EST DÉCLARÉ. Les OCTETS des pièces
 * jointes vivent hors de la base (`../fichiers/entrepot.ts`, chemin dérivé de
 * l'identifiant de la note et de celui de la pièce) : la cascade emporte les
 * LIGNES de `pieces_jointes`, elle ne peut pas emporter les fichiers. Ils
 * deviennent inatteignables — leur chemin n'est formable qu'à partir d'une ligne
 * résolue — mais ils restent sur le disque. `ECART-048` É-1 le déclare ;
 * `supprimerUnDomaine()` (`./administration.ts`) porte le même défaut.
 *
 * @throws `DocumentInvalide` — `resoudreLEditionDUneNote()` analyse le corps du
 *   registre résolu. Une note dont le corps ne serait pas analysable ne peut
 *   donc pas être détruite par ce chemin (`ECART-048` É-2).
 * @throws l'erreur de SOUMISSION au moteur — arrêté, injoignable ou refusant.
 *   La note est alors DÉTRUITE et son entrée d'index survit ; l'appelant reçoit
 *   l'échec plutôt qu'un silence. `ARB-060` retire l'attente de la tâche, jamais
 *   la remontée de cet échec-là.
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
	   inatteignable, et elle n'est pas une garde — c'est le type qui refuse de
	   lire une ressource sans avoir lu son verdict. */
	if (!resume.trouve) return INTROUVABLE;

	/**
	 * L'ADRESSE DE RETOUR SE COMPOSE SUR LES IDENTIFIANTS PERSISTÉS.
	 *
	 * Elle se composait sur les NOMS d'affichage que la note porte, slugifiés.
	 * `univers.identifiant` et `domaines.identifiant` sont fixés à la création et
	 * ne suivent PAS les renommages (`RG-M12-11`) : détruire une note d'un domaine
	 * renommé renvoyait donc en 404, juste après une destruction réussie. Les deux
	 * identifiants sont LUS, dans la même requête, et avant la destruction — après,
	 * la note n'est plus là pour les donner.
	 *
	 * Une note sans ligne de rangement lisible ne peut pas exister — la colonne est
	 * requise et référencée —, mais le type l'admet : le repli est la dérivation du
	 * nom, celle d'avant.
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

	await base.transaction(async (tx) => {
		await tx.delete(notes).where(eq(notes.identifiant, demande.identifiant));
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
	await entretenirLIndex(base, client, [demande.identifiant]);

	return { trouve: true, ressource: { resume: resume.ressource, adresseDeRetour } };
}
