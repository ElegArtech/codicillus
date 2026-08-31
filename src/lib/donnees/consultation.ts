/**
 * `RG-M04-09` — TOUTE OUVERTURE D'UNE NOTE SE COMPTE ET SE JOURNALISE : « incrémente son
 * compteur de consultations et produit une entrée de journal (identité de l'utilisateur,
 * horodatage, durée approximative). En anonyme, l'entrée est anonymisée. » (`CDC:629`)
 *
 * Ce module est l'implémentation UNIQUE des deux effets, appelée par les deux routes qui
 * ouvrent une note. Une seconde écriture du compteur ferait diverger les deux chemins.
 *
 * LA DURÉE APPROXIMATIVE N'EST PAS ÉCRITE et n'a pas de colonne : aucune source du dépôt ne
 * dit comment on l'obtient, et une durée de consultation ne se connaît qu'à la SORTIE de la
 * page. Le vide est déclaré plutôt que dissimulé derrière une colonne toujours nulle.
 *
 * ANONYMISER N'EST PAS OMETTRE (`RG-M15-02`) : l'entrée EXISTE, sans compte, et le compteur
 * monte dans les deux cas. L'ESPACE PUBLIC EST ANONYMISÉ TOUT ENTIER, connecté compris :
 * `ARB-007` A-05 refuse à `/guides/{identifiant}` toute dépendance à la session.
 *
 * UN SEUL ALLER-RETOUR : `CDC:1533` borne l'ouverture d'une note à 1 s. AUCUN ÉCHEC N'EST
 * AVALÉ : PostgreSQL est une brique CRITIQUE, jamais l'une des deux optionnelles.
 */
import { sql } from 'drizzle-orm';
import type { Base } from '../base/acces';
import type { Identite } from '../droits/resolution';

/**
 * LE COMPTE À INSCRIRE DANS L'ENTRÉE, ou son absence. `null` est l'anonymisation de
 * `RG-M15-02`, et il vient de deux causes que la ligne ne distingue pas — parce que
 * la règle ne les distingue pas non plus.
 */
export type CompteJournalise = string | null;

/** Le compte d'une identité — `null` pour l'anonyme (RG-M04-09, RG-M15-02). */
export function compteDe(identite: Identite): CompteJournalise {
	return identite.type === 'authentifie' ? identite.compteId : null;
}

/**
 * L'ANONYMISATION DE L'ESPACE PUBLIC — `RG-M15-02`. La fonction ne prend pas
 * d'identité : c'est la forme qui tient la règle. Une signature qui en accepterait
 * une ouvrirait la porte à une branche par persona sur une adresse qu'`ARB-007` A-05
 * veut indépendante de la session.
 */
export function compteDeLEspacePublic(): CompteJournalise {
	return null;
}

export interface ConsultationJournalisee {
	/**
	 * Faux : aucune note ne porte cet identifiant, rien n'a été écrit. Les appelants
	 * n'appellent qu'APRÈS résolution — ce cas est une course, jamais un refus.
	 */
	readonly ecrite: boolean;
	/** Le compte inscrit dans l'entrée. `null` : entrée anonymisée. */
	readonly compte: CompteJournalise;
}

export interface OuvertureDeNote {
	readonly identifiant: string;
	/** Le compte à inscrire. `null` : entrée anonymisée (RG-M15-02). */
	readonly compte: CompteJournalise;
	readonly maintenant: Date;
}

/**
 * L'INSTRUCTION UNIQUE — l'incrément et l'entrée, indivisibles. La mise à jour du compteur
 * rend la clé de la note, et l'insertion la consomme : un compteur qui monterait sans entrée,
 * ou l'inverse, serait deux mesures qui divergent. L'INCRÉMENT EST RELATIF, jamais une valeur
 * calculée puis réécrite : deux lectures concurrentes en perdraient une. Elle est SÉPARÉE de
 * son exécution pour être inspectable sans base (`P-26`).
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
 * Les lignes d'une exécution brute — le pilote les enveloppe, la couche ne promet pas
 * laquelle des deux formes revient. Même lecture que `donnees/equivalence.ts`.
 */
function rangs(resultat: unknown): readonly unknown[] {
	const enveloppe = resultat as { rows?: readonly unknown[] };
	if (Array.isArray(enveloppe.rows)) return enveloppe.rows;
	return Array.isArray(resultat) ? resultat : [];
}
