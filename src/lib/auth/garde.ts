/**
 * LES REDIRECTIONS DE SESSION — `docs/routes.md` §5.2, RG-ACC-02, RG-ACC-03.
 *
 * La table de §5.2 (`:322-327`), recopiée :
 *
 *   Route protégée sans session  302 → /connexion?motif=page-protegee&suite={chemin}
 *   Session expirée              302 → /connexion?motif=session-expiree&suite={chemin}
 *                                puis restauration de {suite} après reconnexion
 *   Après connexion              {suite} si présent, sinon /
 *   Après déconnexion            302 → / (espace public), JAMAIS une page d'erreur
 *
 * Et `:329` : « `?suite=` n'accepte qu'un chemin absolu interne : une valeur
 * externe est IGNORÉE ET REMPLACÉE PAR `/` ». Ce n'est pas un refus : rien ne
 * rend 400 ici.
 *
 * `:286` relie les valeurs de `?motif=` aux trois positions de la planche V-05 —
 * `page-protegee` / `session-expiree` / (absent) → `protegee` / `expiree` /
 * `directe`. La correspondance existe : elle n'est pas inventée ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX RÉGIMES DE REFUS, ET CE MODULE NE TRANCHE QUE LE PREMIER
 *
 * `ARB-005` et `docs/routes.md` §6 : le régime INDISCERNABLE vaut pour « la
 * résolution d'une RESSOURCE ENTIÈRE — une adresse » ; l'état « sans droit »
 * vaut pour « une ZONE dans une page que l'utilisateur a le droit d'ouvrir ».
 *
 * Une adresse qui désigne une ressource — `/notes/{identifiant}`,
 * `/univers/{univers}/…`, `/guides/{identifiant}` — ne peut donc PAS être
 * redirigée sur absence de session : la matrice de §5.5 lui impose 404, et
 * rediriger reviendrait à répondre autre chose selon la nature de l'adresse. Ce
 * module les classe en `resolution` et ne les touche pas : leur réponse est
 * produite par le chemin unique de `src/lib/public/adresse-non-resolue.ts`
 * (ADR-007), au lot qui portera ces routes.
 *
 * `/cartographie`, `/cartographie/par-type`, `/carte-mentale` et
 * `/bibliotheque` sont classées `resolution` elles aussi, et par ARBITRAGE :
 * `ARB-007` (A-04) — « pas de cartographie publique […] l'implémenter serait un
 * comblement » — et `ARB-002` (A-02) — la bibliothèque n'apparaît « pour aucun
 * autre rôle (P-09, ADR-011) ». Un arbitrage prime sur la table de §5.2.
 *
 * LA TENSION QUI RESTE EST DÉCLARÉE, PAS COMBLÉE. Pour `/importer`,
 * `/mon-profil` et `/console/…`, §5.2 impose la redirection et la matrice de
 * §5.5 impose 404 V-04 : les deux sections de `docs/routes.md` se contredisent,
 * et aucun arbitrage ne tranche. `ARB-005` fixe l'ordre — « le contrat de tâche
 * décide ; à défaut, le régime indiscernable l'emporte » —, et le contrat de
 * `T-012` décide : sa table de §3.5 et son critère de sortie exigent la
 * redirection. Elle est donc appliquée à ces trois familles, et à elles seules.
 * L'écart est remonté au rapport du lot ; un arbitrage déplacera une ligne de la
 * table ci-dessous, jamais une ligne de logique.
 */

/** Les valeurs de `?motif=` (`docs/routes.md:286`, `:324-325`). */
export const MOTIF = {
	/** Route protégée atteinte sans session. */
	protegee: 'page-protegee',
	/** Session fermée par le délai d'inactivité (RG-ACC-03). */
	expiree: 'session-expiree'
} as const;

/** Les trois positions de l'axe « Arrivée » de la planche V-05. */
export type Arrivee = 'protegee' | 'expiree' | 'directe';

/**
 * Le régime d'une adresse face à l'absence de session.
 *
 * `publique`   — servie sans session (`docs/routes.md` §3, niveau « anonyme »)
 * `redirection` — §5.2 : 302 vers `/connexion`
 * `resolution` — régime indiscernable : la route résout et rend 404 (ADR-007)
 * `deconnexion` — RG-ACC-02 : 302 vers `/`, jamais une page d'erreur
 */
export type RegimeDAdresse = 'publique' | 'redirection' | 'resolution' | 'deconnexion';

/**
 * LA TABLE DES RÉGIMES — un préfixe, un régime, et la source qui le fixe.
 *
 * L'ordre compte : le premier préfixe qui recouvre l'emporte, du plus
 * spécifique au plus général. Toute adresse hors table est `resolution` :
 * fermeture par défaut, comme `RG-DRO-02` la veut pour les droits — une route
 * inconnue ne devient pas publique par omission.
 */
export const REGIMES: readonly { readonly prefixe: string; readonly regime: RegimeDAdresse }[] = [
	/* L'espace public et les quatre adresses anonymes de §3.1 et §3.2. */
	{ prefixe: '/connexion', regime: 'publique' },
	{ prefixe: '/mot-de-passe-oublie', regime: 'publique' },
	{ prefixe: '/deconnexion', regime: 'deconnexion' },
	{ prefixe: '/recherche', regime: 'publique' },
	/* ARB-007 A-05 — servie telle quelle, anonyme comme connecté. La note non
	   publique y rend 404 V-04, par la résolution de la route, non par ici. */
	{ prefixe: '/guides', regime: 'resolution' },
	/* §5.2, et le contrat de T-012 : les trois familles fixes qui redirigent. */
	{ prefixe: '/importer', regime: 'redirection' },
	{ prefixe: '/mon-profil', regime: 'redirection' },
	{ prefixe: '/console', regime: 'redirection' },
	/* Régime indiscernable — §5.5, ADR-007, ARB-007, ARB-002. */
	{ prefixe: '/notes', regime: 'resolution' },
	{ prefixe: '/univers', regime: 'resolution' },
	{ prefixe: '/cartographie', regime: 'resolution' },
	{ prefixe: '/carte-mentale', regime: 'resolution' },
	{ prefixe: '/bibliotheque', regime: 'resolution' },
	/* La racine — V-01 sans session, V-07 avec (`docs/routes.md:98-99`). */
	{ prefixe: '/', regime: 'publique' }
];

/** Le régime d'un chemin. */
export function regimeDe(chemin: string): RegimeDAdresse {
	for (const r of REGIMES) {
		if (chemin === r.prefixe) return r.regime;
		if (r.prefixe === '/') continue;
		if (chemin.startsWith(`${r.prefixe}/`)) return r.regime;
	}
	return chemin === '/' ? 'publique' : 'resolution';
}

/**
 * `?suite=` — « n'accepte qu'un chemin absolu interne : une valeur externe est
 * ignorée et remplacée par `/` » (`docs/routes.md:329`).
 *
 * Sont remplacés : l'absence de valeur, tout ce qui ne commence pas par `/`,
 * les adresses réseau `//hote` — qu'un navigateur résout comme externes —, la
 * barre inversée que certains agents normalisent en `/`, et tout caractère de
 * contrôle. Aucun de ces cas ne produit d'erreur : la substitution EST la
 * réponse.
 */
export function suiteInterne(valeur: string | null | undefined): string {
	if (typeof valeur !== 'string' || valeur.length === 0) return '/';
	if (!valeur.startsWith('/')) return '/';
	if (valeur.startsWith('//')) return '/';
	if (valeur.includes('\\')) return '/';
	/* Les caractères de contrôle sont cherchés par code, non par expression
	   rationnelle : `no-control-regex` refuse la seconde forme, et une plage
	   écrite à la main s'y trompe d'un caractère sans que rien ne le dise. */
	for (let i = 0; i < valeur.length; i += 1) {
		const code = valeur.charCodeAt(i);
		if (code <= 0x1f || code === 0x7f) return '/';
	}
	return valeur;
}

/**
 * L'adresse de connexion à servir pour une arrivée redirigée — §5.2.
 *
 * Le chemin demandé est porté en `?suite=`, encodé : c'est lui que
 * `cibleApresConnexion()` restaure (RG-ACC-03, UC-M16-01).
 */
export function adresseDeConnexion(
	motif: (typeof MOTIF)[keyof typeof MOTIF],
	chemin: string
): string {
	const suite = suiteInterne(chemin);
	return `/connexion?motif=${motif}&suite=${encodeURIComponent(suite)}`;
}

/**
 * La position de l'axe « Arrivée » que `?motif=` demande (`docs/routes.md:286`).
 * Une valeur inconnue vaut absence : la planche n'a que trois positions, et
 * refuser serait inventer un quatrième comportement.
 */
export function arriveeDepuisMotif(motif: string | null | undefined): Arrivee {
	if (motif === MOTIF.protegee) return 'protegee';
	if (motif === MOTIF.expiree) return 'expiree';
	return 'directe';
}

/**
 * Où l'on va après connexion — §5.2 : « `{suite}` si présent, sinon `/` ».
 *
 * « Sinon `/` » ne contredit pas V-05 : `docs/routes.md:98-99` fait rendre à
 * `/` l'accueil public sans session et l'ACCUEIL CONTRIBUTEUR (V-07) avec
 * session. La notification du gel — « accueil contributeur, vue V-07 »
 * (`V-05:774`) — et « sinon `/` » désignent le même endroit.
 */
export function cibleApresConnexion(suite: string | null | undefined): string {
	return suiteInterne(suite);
}

/** Après déconnexion — RG-ACC-02, UC-M16-02 : l'espace public, jamais une erreur. */
export const CIBLE_APRES_DECONNEXION = '/';
