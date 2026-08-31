/**
 * `RG-M02-03` (`CDC:457`) — TOUTE RECHERCHE EST JOURNALISÉE : « requête, horodatage, nombre
 * de résultats, ouverture éventuelle d'un résultat. Ce journal est le signal de trou
 * documentaire exploité en M15. » Ce module est l'unique écriture et l'unique lecture de ce
 * journal ; la table est montée par `base/migrations/010_recherches.montee.sql`.
 *
 * ANONYMISER N'EST PAS OMETTRE (`RG-M15-02`) : une recherche anonyme laisse une ligne SANS
 * compte, jamais aucune ligne. Le patron est celui de `consultation.ts`, mot pour mot.
 */
import { and, count, gte, lt, sql } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { recherches } from '../base/schema';
import type { CompteJournalise } from './consultation';
import type { RequeteDeRecherche } from '../../../seeds/corpus';

export interface RechercheJournalisee {
	readonly terme: string;
	/** Le compte à inscrire. `null` : entrée anonymisée (`RG-M15-02`). */
	readonly compte: CompteJournalise;
	/** Le nombre de notes SERVIES — ce que l'appelant a vu, jamais le total de l'index. */
	readonly resultats: number;
	readonly maintenant: Date;
}

/**
 * Écrit l'entrée de journal d'une recherche. UNE REQUÊTE VIDE N'EST PAS UNE RECHERCHE :
 * ouvrir `/recherche` sans `q` n'interroge rien, et compter cette visite ferait tomber le
 * taux de recherche aboutie sur des recherches qui n'ont pas eu lieu.
 */
export async function journaliserUneRecherche(
	base: Base,
	recherche: RechercheJournalisee
): Promise<boolean> {
	const terme = recherche.terme.trim();
	if (terme === '') return false;
	await base.insert(recherches).values({
		terme,
		compteId: recherche.compte,
		resultats: recherche.resultats,
		le: recherche.maintenant
	});
	return true;
}

/**
 * LE TERME QUI A MENÉ ICI, ou `null`. L'« ouverture éventuelle » de `RG-M02-03` se constate
 * à l'ouverture de la note, où la recherche n'est plus qu'une provenance : c'est l'adresse
 * d'où vient la requête qui la porte. UNE PROVENANCE ÉTRANGÈRE EST IGNORÉE — l'origine est
 * comparée, et une adresse d'un autre site ne peut donc rien attacher au journal.
 */
export function termeDeProvenance(provenance: string | null, ici: URL): string | null {
	if (provenance === null) return null;
	let venue: URL;
	try {
		venue = new URL(provenance, ici);
	} catch {
		return null;
	}
	if (venue.origin !== ici.origin || venue.pathname !== '/recherche') return null;
	const terme = venue.searchParams.get('q')?.trim();
	return terme === undefined || terme === '' ? null : terme;
}

/**
 * La fenêtre au-delà de laquelle une ouverture n'est plus rattachée à sa recherche : une
 * note ouverte le lendemain depuis un onglet resté ouvert n'est pas la réponse à la requête.
 */
const FENETRE_DOUVERTURE_MS = 30 * 60 * 1000;

export interface OuvertureDepuisLaRecherche {
	readonly terme: string;
	readonly compte: CompteJournalise;
	/** L'identifiant lisible de la note ouverte. */
	readonly identifiant: string;
	readonly maintenant: Date;
}

/**
 * ATTACHE LA NOTE OUVERTE À LA RECHERCHE QUI L'A PRÉCÉDÉE — le quatrième membre de
 * `RG-M02-03`. La ligne visée est la DERNIÈRE entrée du même terme, de la même identité,
 * encore sans ouverture, dans la fenêtre : deux ouvertures depuis la même page de résultats
 * ne comptent donc qu'une recherche aboutie, ce qui est la définition de l'indicateur.
 *
 * `is not distinct from` ET NON `=` : l'entrée anonyme porte `compte_id` NULL des deux
 * côtés, et l'égalité SQL ne rapproche pas deux NULL.
 */
export async function attacherLOuverture(
	base: Base,
	ouverture: OuvertureDepuisLaRecherche
): Promise<void> {
	const depuis = new Date(ouverture.maintenant.getTime() - FENETRE_DOUVERTURE_MS);
	await base.execute(sql`
		update recherches
		   set ouverture_note_id = ouverte.id
		  from notes as ouverte
		 where ouverte.identifiant = ${ouverture.identifiant}
		   and recherches.id = (
			   select precedente.id
				 from recherches as precedente
				where precedente.terme = ${ouverture.terme}
				  and precedente.compte_id is not distinct from ${ouverture.compte}::uuid
				  and precedente.ouverture_note_id is null
				  and precedente.le >= ${depuis}
				order by precedente.le desc
				limit 1)
	`);
}

/** La période sur laquelle V-34 conclut — l'étiquette « 30 derniers jours » de son en-tête. */
export const JOURS_DE_LA_PERIODE = 30;
const PERIODE_MS = JOURS_DE_LA_PERIODE * 24 * 60 * 60 * 1000;

interface AgregatDeTerme {
	readonly terme: string;
	readonly n: number;
	readonly resultats: number;
	readonly ouvertures: number;
}

async function agregerParTerme(
	base: Base,
	depuis: Date,
	avant: Date
): Promise<readonly AgregatDeTerme[]> {
	const lignes = await base
		.select({
			terme: recherches.terme,
			n: count(),
			ouvertures: sql<string>`count(${recherches.ouvertureNoteId})`,
			/* LE NOMBRE DE RÉSULTATS EST CELUI DE LA DERNIÈRE RECHERCHE DU TERME, jamais une
			   moyenne : le corpus bouge, et « aucun résultat » est un fait d'aujourd'hui. */
			resultats: sql<number>`(array_agg(${recherches.resultats} order by ${recherches.le} desc))[1]`
		})
		.from(recherches)
		.where(and(gte(recherches.le, depuis), lt(recherches.le, avant)))
		.groupBy(recherches.terme);

	return lignes.map((l) => ({
		terme: l.terme,
		n: Number(l.n),
		ouvertures: Number(l.ouvertures),
		resultats: Number(l.resultats)
	}));
}

/**
 * LE JOURNAL DE LA PÉRIODE, PAR TERME — la forme que V-34 attend. L'évolution est comparée à
 * la période PRÉCÉDENTE de même durée ; sans terme de comparaison elle vaut `null`, et
 * l'écran ne rend alors aucune tendance : une variation de 0 % affirmerait une stabilité que
 * rien n'a mesurée.
 */
export async function lireLesRecherches(
	base: Base,
	maintenant: Date
): Promise<readonly RequeteDeRecherche[]> {
	const instant = maintenant.getTime();
	const [periode, precedente] = await Promise.all([
		agregerParTerme(base, new Date(instant - PERIODE_MS), maintenant),
		agregerParTerme(base, new Date(instant - 2 * PERIODE_MS), new Date(instant - PERIODE_MS))
	]);

	const avant = new Map(precedente.map((a) => [a.terme, a.n]));
	return periode
		.map((a) => {
			const reference = avant.get(a.terme) ?? 0;
			return {
				terme: a.terme,
				n: a.n,
				resultats: a.resultats,
				ouvertures: a.ouvertures,
				evolution: reference === 0 ? null : Math.round(((a.n - reference) / reference) * 100)
			};
		})
		.sort((x, y) => y.n - x.n || x.terme.localeCompare(y.terme, 'fr'));
}
