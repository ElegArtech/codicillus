/**
 * L'AUTHENTIFICATION — la décision, et elle n'a qu'une sortie d'échec.
 *
 * `UC-M16-01` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:1272-1277`) :
 * « L'utilisateur se connecte avec un compte local. Identifiant et mot de
 * passe. […] Message d'erreur GÉNÉRIQUE en cas d'échec : ni le fait que
 * l'identifiant existe, ni celui que le mot de passe est faux ne sont
 * révélés. »
 *
 * Le gel est plus strict encore (`mockups/V-05-connexion.html:691-696`) :
 * « Un seul et même message quel que soit ce qui a échoué, et AUCUN MARQUAGE
 * SUR L'UN DES DEUX CHAMPS PLUTÔT QUE SUR L'AUTRE. »
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UNE SEULE VALEUR D'ÉCHEC, ET SON UNICITÉ EST LA PREUVE
 *
 * `ECHEC` est un objet GELÉ ET UNIQUE, exactement comme `INTROUVABLE` de
 * `src/lib/droits/resolution.ts` : identifiant inconnu, compte désactivé, mot de
 * passe faux et condensat absent ne rendent pas quatre objets égaux, ils
 * rendent LE MÊME OBJET. Un test peut l'affirmer par identité de référence, et
 * une divergence future — un champ `raison`, un code — casserait immédiatement.
 * Il n'y a rien à quoi un appelant puisse se raccrocher pour distinguer les cas.
 *
 * ET LE COÛT EST LE MÊME : `motDePasseCorrespond()` accepte `null` et vérifie
 * alors un condensat leurre (`mots-de-passe.ts`). Un identifiant inconnu paie
 * donc la même vérification Argon2id qu'un mot de passe faux — `ARB-005` compte
 * l'écart de latence comme une fuite, et « en cas de doute, l'indiscernable
 * l'emporte ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * RG-M14-08 A ENFIN UN POINT D'APPLICATION
 *
 * `RG-M14-08` (`:1186`) : « un compte désactivé perd IMMÉDIATEMENT l'accès mais
 * reste attaché à ses contributions passées. » `T-011` avait déclaré la règle
 * sans point d'application — `Identite` ne porte pas `actif`, donc la résolution
 * des droits ne pouvait ni la contredire ni la faire respecter — et avait nommé
 * l'endroit : « l'établissement de session, seul endroit où IMMÉDIATEMENT a un
 * sens ».
 *
 * C'est `identitePourCompte()`, ci-dessous, et elle est appelée DEUX FOIS : à la
 * connexion et à la reprise de chaque requête. La seconde est ce qui donne son
 * sens à « immédiatement » : une session ouverte avant la désactivation cesse de
 * porter une identité au prochain accès, sans qu'aucune purge n'ait à courir.
 *
 * Le corpus porte le cas : `c-ancien` (Pierre Dubois, rôle Lecteur) est
 * `actif: false` (`seeds/corpus.ts`).
 */
import { type Identite, type RoleDeCompte, identiteAuthentifiee } from '../droits/resolution';
import { motDePasseCorrespond } from './mots-de-passe';

/** Ce que l'authentification a besoin de savoir d'un compte, et rien de plus. */
export interface CompteAAuthentifier {
	readonly id: string;
	readonly role: RoleDeCompte;
	readonly actif: boolean;
	/** `null` quand aucun mot de passe n'a encore été posé (M14.6). */
	readonly condensatMotDePasse: string | null;
}

/**
 * L'identité d'un compte authentifié — la branche `authentifie` d'`Identite`.
 * Le type rétréci évite à l'appelant de retraverser l'union pour lire un
 * `compteId` dont il sait déjà qu'il existe.
 */
export type IdentiteAuthentifiee = Extract<Identite, { readonly type: 'authentifie' }>;

/**
 * Le résultat, et il n'a pas de troisième forme : ni variante « inconnu », ni
 * champ « raison », ni code d'erreur.
 */
export type Authentification =
	{ readonly reussie: true; readonly identite: IdentiteAuthentifiee } | { readonly reussie: false };

/** L'UNIQUE valeur d'échec. Gelée : deux échecs sont le même objet. */
export const ECHEC: Authentification = Object.freeze({ reussie: false });

/**
 * L'identité d'un compte, ou `null` s'il n'en porte pas.
 *
 * RG-M14-08 est ici, et ici seulement : un compte désactivé ne produit aucune
 * identité. C'est aussi le SEUL appelant de `identiteAuthentifiee()` du produit
 * — construire une identité est une affirmation, et elle se fait à un seul
 * endroit.
 */
export function identitePourCompte(compte: CompteAAuthentifier): IdentiteAuthentifiee | null {
	if (!compte.actif) return null;
	const identite = identiteAuthentifiee(compte.id, compte.role);
	/* La fabrique de `T-011` rend le type large `Identite`. Le rétrécissement se
	   fait par un contrôle réel et non par une assertion : la garantie tient même
	   si la fabrique change. */
	return identite.type === 'authentifie' ? identite : null;
}

/**
 * LA DÉCISION. Un compte (ou rien) et un mot de passe entrent, une identité ou
 * `ECHEC` sort — par le même `return`, au même coût.
 *
 * @param compte le compte trouvé pour l'identifiant saisi, ou `null`
 * @param motDePasse le mot de passe saisi
 */
export async function authentifier(
	compte: CompteAAuthentifier | null | undefined,
	motDePasse: string
): Promise<Authentification> {
	/* Le condensat est vérifié DANS TOUS LES CAS, y compris quand il n'y a pas
	   de compte : c'est ce qui égalise le temps de réponse. */
	const correspond = await motDePasseCorrespond(compte?.condensatMotDePasse ?? null, motDePasse);
	const identite = compte ? identitePourCompte(compte) : null;
	if (!correspond || identite === null) return ECHEC;
	return { reussie: true, identite };
}
