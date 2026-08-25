/**
 * LE DÉPÔT DE L'AUTHENTIFICATION — les requêtes, et rien que les requêtes.
 *
 * Toute la DÉCISION vit ailleurs, dans des modules qui ne parlent pas à la base
 * et qui s'éprouvent donc sans base : `authentification.ts` (la décision),
 * `tentatives.ts` (le barème), `sessions.ts` (l'inactivité), `garde.ts` (les
 * redirections). Ce fichier ne fait que lire et écrire.
 *
 * C'est la répartition que `T-011` a posée pour les droits — « il ne parle pas
 * à la base ; il reçoit des lignes et rend une décision, ce qui le rend
 * éprouvable sans base » — et elle est reprise telle quelle : une règle qu'on ne
 * peut éprouver qu'avec un serveur debout est une règle qu'on éprouve rarement.
 */
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { comptes, parametres, sessions, tentativesDeConnexion } from '../base/schema';
import type { RoleDeCompte } from '../droits/resolution';
import type { CompteAAuthentifier } from './authentification';
import { BAREME, type LigneDeTentative } from './tentatives';

/**
 * Le compte portant cet identifiant, ou `null`.
 *
 * UNE SEULE REQUÊTE, ET LA MÊME DANS LES DEUX CAS : l'identifiant porte une
 * contrainte d'unicité (`comptes_identifiant_unique`, 002), donc un index, donc
 * un coût de recherche qui ne dépend pas de l'existence de la ligne. C'est ce
 * qui permet à `authentifier()` d'égaliser le reste du temps de réponse.
 */
export async function compteParIdentifiant(
	base: Base,
	identifiant: string
): Promise<CompteAAuthentifier | null> {
	const lignes = await base
		.select({
			id: comptes.id,
			role: comptes.role,
			actif: comptes.actif,
			condensatMotDePasse: comptes.condensatMotDePasse
		})
		.from(comptes)
		.where(eq(comptes.identifiant, identifiant))
		.limit(1);
	const ligne = lignes[0];
	if (ligne === undefined) return null;
	return {
		id: ligne.id,
		role: ligne.role as RoleDeCompte,
		actif: ligne.actif,
		condensatMotDePasse: ligne.condensatMotDePasse
	};
}

/** Ce qu'une reprise de session rapporte : la session, et le compte qui la porte. */
export interface SessionEtCompte {
	readonly sessionId: string;
	readonly souvenir: boolean;
	readonly derniereActiviteLe: Date;
	readonly compte: CompteAAuthentifier;
	/**
	 * LE COMPTE DOIT-IL CHANGER SON MOT DE PASSE AVANT D'ALLER PLUS LOIN ?
	 *
	 * LES DEUX COLONNES SONT LUES ENSEMBLE, ET LE VERROU L'EMPORTE. `RG-CPT-01`
	 * interdit à un compte à mot de passe verrouillé de changer le sien : lui
	 * imposer le changement l'enfermerait dehors, sur un écran qui refuserait
	 * précisément le geste exigé.
	 */
	readonly motDePasseAChanger: boolean;
}

/**
 * La session ouverte portant ce condensat de jeton, ou `null`.
 *
 * Une session fermée (`fermee_le` non nul) est traitée comme absente : la
 * fermeture est définitive, et la ligne n'est gardée que pour la trace.
 */
export async function sessionParCondensat(
	base: Base,
	condensatJeton: string
): Promise<SessionEtCompte | null> {
	const lignes = await base
		.select({
			sessionId: sessions.id,
			souvenir: sessions.souvenir,
			derniereActiviteLe: sessions.derniereActiviteLe,
			compteId: comptes.id,
			role: comptes.role,
			actif: comptes.actif,
			condensatMotDePasse: comptes.condensatMotDePasse,
			motDePasseAChanger: comptes.motDePasseAChanger,
			motDePasseVerrouille: comptes.motDePasseVerrouille
		})
		.from(sessions)
		.innerJoin(comptes, eq(comptes.id, sessions.compteId))
		.where(and(eq(sessions.condensatJeton, condensatJeton), isNull(sessions.fermeeLe)))
		.limit(1);
	const l = lignes[0];
	if (l === undefined) return null;
	return {
		sessionId: l.sessionId,
		souvenir: l.souvenir,
		derniereActiviteLe: l.derniereActiviteLe,
		compte: {
			id: l.compteId,
			role: l.role as RoleDeCompte,
			actif: l.actif,
			condensatMotDePasse: l.condensatMotDePasse
		},
		motDePasseAChanger: l.motDePasseAChanger && !l.motDePasseVerrouille
	};
}

/** Ouvre une session pour un compte, et rend son identifiant. */
export async function ouvrirUneSession(
	base: Base,
	compteId: string,
	condensatJeton: string,
	souvenir: boolean
): Promise<string> {
	const [ligne] = await base
		.insert(sessions)
		.values({ compteId, condensatJeton, souvenir })
		.returning({ id: sessions.id });
	if (ligne === undefined) throw new Error('session : insertion sans ligne rendue');
	return ligne.id;
}

/**
 * Repousse le délai d'inactivité — `derniere_activite_le` à maintenant.
 *
 * Écrite à CHAQUE requête servie, et non toutes les N secondes : un seuil de
 * regroupement serait un nombre que rien ne fixe, et il rendrait la durée
 * effective différente de la durée réglée en console.
 */
export async function toucherLaSession(base: Base, sessionId: string): Promise<void> {
	await base
		.update(sessions)
		.set({ derniereActiviteLe: new Date() })
		.where(eq(sessions.id, sessionId));
}

/** Ferme une session — déconnexion, inactivité échue, compte désactivé. */
export async function fermerLaSession(base: Base, sessionId: string): Promise<void> {
	await base.update(sessions).set({ fermeeLe: new Date() }).where(eq(sessions.id, sessionId));
}

/** La valeur brute de `parametres.duree_session`, telle que la table la porte. */
export async function valeurDeDureeDeSession(base: Base): Promise<unknown> {
	const lignes = await base
		.select({ valeur: parametres.valeur })
		.from(parametres)
		.where(eq(parametres.cle, 'duree_session'))
		.limit(1);
	return lignes[0]?.valeur;
}

/**
 * Le nombre de lignes de tentative à relever pour une origine.
 *
 * Il est DÉRIVÉ du barème, non choisi : entre deux remises à zéro, une origine
 * ne peut produire que les tentatives tolérées plus celle qui ouvre le blocage.
 * La marge couvre les succès intercalés. Si le barème s'allonge, la limite suit
 * — un nombre écrit à la main deviendrait faux en silence.
 */
export const LIMITE_DE_RELEVE = BAREME.attentesEnSecondes.length + 4;

/** Les dernières tentatives de cette origine, les plus récentes d'abord. */
export async function tentativesDeLOrigine(
	base: Base,
	origine: string
): Promise<readonly LigneDeTentative[]> {
	const lignes = await base
		.select({
			reussie: tentativesDeConnexion.reussie,
			le: tentativesDeConnexion.le,
			blocageJusquA: tentativesDeConnexion.blocageJusquA
		})
		.from(tentativesDeConnexion)
		.where(eq(tentativesDeConnexion.origine, origine))
		.orderBy(desc(tentativesDeConnexion.le))
		.limit(LIMITE_DE_RELEVE);
	return lignes;
}

/** Le compteur en base de `STACK §4.7` : une ligne par tentative. */
export async function enregistrerLaTentative(
	base: Base,
	tentative: {
		readonly origine: string;
		readonly reussie: boolean;
		readonly attenteSecondes: number;
		readonly blocageJusquA: Date | null;
	}
): Promise<void> {
	await base.insert(tentativesDeConnexion).values({
		origine: tentative.origine,
		reussie: tentative.reussie,
		attenteSecondes: tentative.attenteSecondes,
		blocageJusquA: tentative.blocageJusquA
	});
}
