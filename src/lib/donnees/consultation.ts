/**
 * `RG-M04-09` — TOUTE OUVERTURE D'UNE NOTE SE COMPTE ET SE JOURNALISE.
 *
 * CDC:629, en propres termes : « Toute ouverture d'une note incrémente son
 * compteur de consultations et produit une entrée de journal (identité de
 * l'utilisateur, horodatage, durée approximative). En anonyme, l'entrée est
 * anonymisée. »
 *
 * Ce module est l'implémentation UNIQUE des deux effets. Les deux routes qui
 * ouvrent une note l'appellent — `/notes/{identifiant}` (V-14, M04) et
 * `/guides/{identifiant}` (V-03, l'espace public) — et aucune ne réécrit ni
 * l'incrément ni l'insertion. Une seconde écriture du compteur ferait diverger
 * les deux chemins sans que rien ne le dise.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE PORTE PAS, ET POURQUOI — LA DURÉE APPROXIMATIVE
 *
 * Le troisième membre de l'entrée n'est pas écrit, et il n'a pas de colonne.
 * AUCUNE SOURCE DU DÉPÔT NE DIT COMMENT ON L'OBTIENT ni ce qu'« approximative »
 * borne : le cahier n'emploie le mot qu'ici et au tableau de M15.2 (CDC:1225),
 * le brief ne le reprend pas, et les 41 maquettes gelées ne montrent aucun
 * mécanisme de fin de visite — une durée de consultation ne se connaît qu'à la
 * SORTIE de la page, et `ARB-011` range ce genre de mécanisme parmi les
 * comportements, absents du gel par construction.
 *
 * En décider ici — l'unité, la borne d'approximation, le mécanisme — serait
 * trois décisions fonctionnelles prises en exécution, donc un défaut de contrat
 * de tâche (`CLAUDE.md` §2, règle de non-comblement). LE VIDE EST DÉCLARÉ au
 * rapport de `T-078` ; il n'est pas comblé, et il n'est pas non plus dissimulé
 * derrière une colonne toujours nulle, qui aurait tranché l'unité en silence.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ANONYMISER N'EST PAS OMETTRE — `RG-M15-02`
 *
 * CDC:1227 donne la définition : « Les journaux de l'espace public sont
 * anonymisés : aucun identifiant d'utilisateur n'y est associé. » L'entrée
 * EXISTE donc, sans compte. Ne pas journaliser une lecture anonyme ne serait
 * pas anonymiser, ce serait perdre la mesure — et le compteur de la note monte
 * dans les deux cas, parce que RG-M04-09 dit « toute ouverture ».
 *
 * L'ESPACE PUBLIC EST ANONYMISÉ TOUT ENTIER, connecté compris, parce que c'est
 * ce que RG-M15-02 dit — « les journaux DE L'ESPACE PUBLIC » — et parce que
 * `ARB-007` A-05 refuse à `/guides/{identifiant}` toute dépendance à la
 * session : un journal qui distinguerait le connecté de l'anonyme sur cette
 * adresse rétablirait la dépendance que l'arbitrage a fermée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL ALLER-RETOUR, ET C'EST LE BUDGET QUI LE DÉCIDE
 *
 * `CDC:1533` borne l'ouverture d'une note à **1 s**, et `pnpm mesure:budgets`
 * la mesure au poste 3. L'incrément et l'insertion sont donc UNE SEULE
 * instruction : une écriture de données en expression commune, dont la clause
 * de retour alimente l'insertion. Deux instructions coûteraient deux allers et
 * retours au serveur pour un effet indivisible.
 *
 * `ARB-060` donne le raisonnement du cas voisin — « le budget prime, et ce
 * qu'on retire du chemin de requête doit être replacé, jamais supprimé ». Rien
 * n'est retiré ici : l'écriture est DANS la requête, et son coût est mesuré, pas
 * estimé. Le chiffre est au rapport de `T-078`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUN ÉCHEC N'EST AVALÉ
 *
 * Un rejet de la base remonte. PostgreSQL est une brique CRITIQUE de la
 * composition, jamais l'une des deux optionnelles que `RG-NF-01` protège : une
 * lecture de note qui aurait échoué à se compter a échoué tout court, et taire
 * le rejet ferait exactement ce qu'`ARB-060` refuse — « il n'autorise pas à
 * taire un échec de soumission ».
 */
import { sql } from 'drizzle-orm';
import type { Base } from '../base/acces';
import type { Identite } from '../droits/resolution';

/**
 * LE COMPTE À INSCRIRE DANS L'ENTRÉE, ou son absence.
 *
 * `null` est l'anonymisation de `RG-M15-02`, et il vient de deux causes
 * distinctes que la ligne ne distingue pas — parce que la règle ne les
 * distingue pas non plus : le lecteur est anonyme, ou la lecture a lieu dans
 * l'espace public.
 */
export type CompteJournalise = string | null;

/** Le compte d'une identité — `null` pour l'anonyme (RG-M04-09, RG-M15-02). */
export function compteDe(identite: Identite): CompteJournalise {
	return identite.type === 'authentifie' ? identite.compteId : null;
}

/**
 * L'ANONYMISATION DE L'ESPACE PUBLIC — `RG-M15-02`, et elle ne lit rien.
 *
 * La fonction ne prend pas d'identité : c'est la forme qui tient la règle. Une
 * signature qui en accepterait une laisserait la porte ouverte à une branche
 * par persona sur une adresse qu'`ARB-007` A-05 veut indépendante de la
 * session.
 */
export function compteDeLEspacePublic(): CompteJournalise {
	return null;
}

/** Ce qu'une consultation a écrit. */
export interface ConsultationJournalisee {
	/**
	 * Faux : aucune note ne porte cet identifiant, rien n'a été écrit. Les deux
	 * appelants n'appellent qu'APRÈS résolution, ce cas est donc une course —
	 * une note supprimée entre la résolution et l'écriture — et jamais un refus.
	 */
	readonly ecrite: boolean;
	/** Le compte inscrit dans l'entrée. `null` : entrée anonymisée. */
	readonly compte: CompteJournalise;
}

/** Ce qu'une ouverture de note désigne : la note, le lecteur, l'instant. */
export interface OuvertureDeNote {
	/** L'identifiant de l'adresse, jamais la clé primaire. */
	readonly identifiant: string;
	/** Le compte à inscrire. `null` : entrée anonymisée (RG-M15-02). */
	readonly compte: CompteJournalise;
	/** L'horodatage de l'entrée — l'instant de la requête, pris une fois. */
	readonly maintenant: Date;
}

/**
 * L'INSTRUCTION UNIQUE — l'incrément et l'entrée, indivisibles.
 *
 * Une écriture de données en expression commune : la mise à jour du compteur
 * rend la clé de la note, et l'insertion la consomme. Un compteur qui monterait
 * sans entrée, ou l'inverse, serait deux mesures qui divergent — et c'est le
 * défaut que M15.2 existe pour éviter. Une seule instruction, donc une seule
 * transaction implicite, et UN SEUL ALLER-RETOUR : c'est le budget de CDC:1533
 * qui le décide.
 *
 * L'INCRÉMENT EST RELATIF, jamais une valeur calculée puis réécrite : deux
 * lectures concurrentes de la même note perdraient l'une des deux.
 *
 * Elle est SÉPARÉE de son exécution pour être inspectable sans base : c'est ce
 * qui permet à `consultation.test.ts` de porter des cas SYNTHÉTIQUES, donc
 * indépendants de l'état du dépôt (`P-26`).
 */
export function instructionDeConsultation(ouverture: OuvertureDeNote) {
	return sql`
		with note_ouverte as (
			update notes
			   set compteur_de_consultations = compteur_de_consultations + 1
			 where identifiant = ${ouverture.identifiant}
			returning id
		)
		insert into consultations (note_id, compte_id, le)
		select note_ouverte.id, ${ouverture.compte}::uuid, ${ouverture.maintenant}
		  from note_ouverte
		returning note_id
	`;
}

/**
 * INCRÉMENTE LE COMPTEUR DE LA NOTE ET ÉCRIT L'ENTRÉE DE JOURNAL — `RG-M04-09`.
 *
 * @param base la connexion du produit
 * @param ouverture la note ouverte, le compte à inscrire, l'instant
 */
export async function journaliserUneConsultation(
	base: Base,
	ouverture: OuvertureDeNote
): Promise<ConsultationJournalisee> {
	const lignes = await base.execute(instructionDeConsultation(ouverture));
	return { ecrite: rangs(lignes).length > 0, compte: ouverture.compte };
}

/**
 * Les lignes d'une exécution brute — le pilote les enveloppe, la couche ne
 * promet pas laquelle des deux formes revient. Même lecture que
 * `src/lib/donnees/equivalence.ts`, et pour la même raison.
 */
function rangs(resultat: unknown): readonly unknown[] {
	const enveloppe = resultat as { rows?: readonly unknown[] };
	if (Array.isArray(enveloppe.rows)) return enveloppe.rows;
	return Array.isArray(resultat) ? resultat : [];
}
