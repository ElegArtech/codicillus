/**
 * LES MOTS DE PASSE — Argon2id, et l'égalité de coût entre les deux échecs.
 *
 * `cadrage/STACK-TECHNIQUE.md` §4.7 (`:321`) : « Mots de passe —
 * `@node-rs/argon2` 2.1.0, Argon2id ». La bibliothèque et l'algorithme sont
 * nommés par la source : ils ne se substituent pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES PARAMÈTRES DE COÛT NE SONT PAS CHOISIS ICI, ET C'EST DÉLIBÉRÉ
 *
 * Aucune source du dépôt n'énonce de mémoire, d'itérations ni de parallélisme.
 * Les inventer serait une décision fonctionnelle prise en exécution. Les
 * valeurs employées sont donc celles de la bibliothèque nommée par la source,
 * relevées à l'exécution et non recopiées de mémoire :
 *
 *     $argon2id$v=19$m=19456,t=2,p=1$…
 *
 * Le condensat PORTE ses paramètres : le jour où un arbitrage fixera un coût,
 * les condensats déjà écrits resteront vérifiables, et la migration se fera au
 * prochain succès de vérification. Rien n'est à figer aujourd'hui.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE COÛT EST LE MÊME QUAND L'IDENTIFIANT EST INCONNU — ARB-005
 *
 * Le gel l'écrit en propres termes (`V-05:691-696`) : « message strictement
 * générique. Ni l'existence de l'identifiant, ni la validité du mot de passe ne
 * sont révélées. » Et `ARB-005` étend l'exigence au TEMPS : « refus et
 * inexistence produisent une réponse identique : corps, en-têtes, code, ET TEMPS
 * DE RÉPONSE. […] En cas de doute, l'indiscernable l'emporte. »
 *
 * Or un identifiant inconnu n'a aucun condensat à vérifier : rendre `false`
 * sans calculer répond en microsecondes là où un mot de passe faux coûte une
 * vérification Argon2id complète. L'écart est un canal, et il est mesurable
 * depuis l'extérieur.
 *
 * LA PARADE EST DANS LA SIGNATURE : `motDePasseCorrespond()` accepte `null` et
 * vérifie alors contre un CONDENSAT LEURRE, produit par le même algorithme et
 * les mêmes paramètres. Un appelant n'a donc pas à se souvenir de le faire —
 * il n'a même pas de branche où l'oublier. C'est la même construction que
 * `Resolution<T>` de `src/lib/droits/resolution.ts` : la garantie est portée
 * par le type, pas par une discipline d'écriture.
 *
 * CE QUE CE MODULE NE PROUVE PAS. L'égalité de coût est ici RENDUE POSSIBLE ;
 * elle n'est pas MESURÉE. Aucune batterie du dépôt ne mesure l'indiscernabilité
 * temporelle (`docs/routes.md` §8.2, `ARB-005`), et `docs/routes.md:460`
 * interdit à tout lot de déclarer `RG-ACC-04` tenue tant que la batterie 6
 * n'existe pas. Le lot mesure l'écart et le rapporte ; il ne le déclare pas
 * fermé.
 */
import { hash, verify } from '@node-rs/argon2';

/**
 * Le condensat leurre — vérifié quand aucun condensat réel n'existe, pour que
 * l'échec coûte le même temps.
 *
 * Il est produit UNE FOIS, au premier besoin, à partir d'un tirage aléatoire :
 * aucun condensat n'est écrit en dur, et aucun mot de passe ne peut donc
 * correspondre à celui-là. Le calcul paresseux évite d'imposer une
 * vérification Argon2id au chargement du module — donc à chaque démarrage,
 * même sans tentative de connexion.
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
 * `condensat` vaut `null` quand l'identifiant est inconnu ou quand le compte
 * n'a pas encore de mot de passe (M14.6 : la console en pose un). Le leurre est
 * alors vérifié, le coût est le même, et le résultat est `false` par le même
 * `return` que le mot de passe faux — il n'existe pas deux sorties d'échec.
 *
 * Un condensat illisible — écrit par une version antérieure, tronqué en base —
 * est un échec, jamais une exception qui remonterait à l'appelant : la
 * distinction serait un canal de plus.
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
