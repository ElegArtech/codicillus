/**
 * LES MOTS DE PASSE — Argon2id, et l'égalité de coût entre les deux échecs. `STACK
 * §4.7` nomme la bibliothèque et l'algorithme : ils ne se substituent pas.
 *
 * LES PARAMÈTRES DE COÛT NE SONT PAS CHOISIS ICI : aucune source du dépôt n'énonce de
 * mémoire, d'itérations ni de parallélisme, et les inventer serait une décision
 * fonctionnelle prise en exécution. Ceux de la bibliothèque s'appliquent
 * (`$argon2id$v=19$m=19456,t=2,p=1$…`). Le condensat PORTE ses paramètres : le jour
 * où un arbitrage fixera un coût, les condensats déjà écrits resteront vérifiables.
 *
 * LE COÛT EST LE MÊME QUAND L'IDENTIFIANT EST INCONNU — `ARB-005` : « refus et
 * inexistence produisent une réponse identique : corps, en-têtes, code, ET TEMPS DE
 * RÉPONSE. […] En cas de doute, l'indiscernable l'emporte. » Or un identifiant
 * inconnu n'a aucun condensat à vérifier, et répondre en microsecondes serait un
 * canal mesurable depuis l'extérieur.
 *
 * LA PARADE EST DANS LA SIGNATURE : `motDePasseCorrespond()` accepte `null` et
 * vérifie alors un CONDENSAT LEURRE, produit par le même algorithme. Un appelant n'a
 * pas de branche où l'oublier — la garantie est portée par le type, comme
 * `Resolution<T>`.
 *
 * CE QUE CE MODULE NE PROUVE PAS : l'égalité de coût est RENDUE POSSIBLE, elle n'est
 * pas MESURÉE. Aucune batterie du dépôt ne mesure l'indiscernabilité temporelle, et
 * `RG-ACC-04` ne peut pas être déclarée tenue tant que la batterie 6 n'existe pas.
 */
import { hash, verify } from '@node-rs/argon2';

/**
 * Le condensat leurre — vérifié quand aucun condensat réel n'existe, pour que l'échec
 * coûte le même temps. Produit UNE FOIS, au premier besoin, à partir d'un tirage
 * aléatoire : aucun condensat n'est écrit en dur, et aucun mot de passe ne peut donc
 * y correspondre. Le calcul paresseux évite une vérification Argon2id à chaque
 * démarrage.
 */
let leurre: Promise<string> | null = null;

function condensatLeurre(): Promise<string> {
	leurre ??= hash(`leurre-${String(Math.random())}-${String(Date.now())}`);
	return leurre;
}

/**
 * Le condensat Argon2id d'un mot de passe en clair. Seul ce résultat est
 * stocké (`comptes.condensat_mot_de_passe`) ; le clair n'est jamais écrit.
 */
export async function hacherMotDePasse(clair: string): Promise<string> {
	return hash(clair);
}

/**
 * La vérification, et le SEUL chemin par lequel un mot de passe est comparé.
 *
 * `condensat` vaut `null` quand l'identifiant est inconnu ou quand le compte n'a pas
 * encore de mot de passe (M14.6). Le leurre est alors vérifié, le coût est le même,
 * et le résultat sort par le même `return` — il n'existe pas deux sorties d'échec. Un
 * condensat illisible est un échec, jamais une exception : la distinction serait un
 * canal de plus.
 */
export async function motDePasseCorrespond(
	condensat: string | null | undefined,
	clair: string
): Promise<boolean> {
	const aVerifier = condensat ?? (await condensatLeurre());
	try {
		const correspond = await verify(aVerifier, clair);
		/* Le leurre ne correspond à rien : le `&&` rend l'assertion explicite
		   plutôt que de reposer sur l'improbabilité du tirage. */
		return correspond && condensat !== null && condensat !== undefined;
	} catch {
		return false;
	}
}
