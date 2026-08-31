/**
 * Les redirections de session — `docs/routes.md` §5.2, `RG-ACC-02`, `RG-ACC-03` :
 *
 *   Route protégée sans session  302 → /connexion?motif=page-protegee&suite={chemin}
 *   Session expirée              302 → /connexion?motif=session-expiree&suite={chemin}
 *   Après connexion              {suite} si présent, sinon /
 *   Après déconnexion            302 → / (espace public), JAMAIS une page d'erreur
 *
 * `?suite=` n'accepte qu'un chemin absolu interne : une valeur externe est IGNORÉE ET
 * REMPLACÉE PAR `/`. Ce n'est pas un refus — rien ne rend 400 ici.
 *
 * DEUX RÉGIMES DE REFUS, ET CE MODULE NE TRANCHE QUE LE PREMIER (`ARB-005`) : le régime
 * INDISCERNABLE vaut pour une RESSOURCE ENTIÈRE, l'état « sans droit » pour une ZONE d'une
 * page qu'on a le droit d'ouvrir. `ARB-052` tranche PAR LA NATURE DE L'ADRESSE : « une adresse
 * dont la réponse dépend du CORPUS est indiscernable ; une adresse dont la réponse ne dépend
 * que de la PRÉSENCE D'UNE SESSION redirige. »
 *
 * DEUX ADRESSES SOUS `/console/…` PORTENT UN IDENTIFIANT DE CORPUS, et la borne d'`ARB-052`
 * les viserait à la lettre. Ce qui les sauve est que la redirection est décidée ICI, sur le
 * PRÉFIXE, AVANT toute résolution : la réponse est la même que le lot existe ou non.
 */

/** Les valeurs de `?motif=` (`docs/routes.md:286`, `:324-325`). */
export const MOTIF = {
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
 * La table des régimes — un préfixe, un régime. L'ordre compte : le premier préfixe
 * qui recouvre l'emporte, du plus spécifique au plus général. Toute adresse hors
 * table est `resolution` : fermeture par défaut, comme `RG-DRO-02` la veut pour les
 * droits — une route inconnue ne devient pas publique par omission.
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
	/* LES SIX CHEMINS FIXES DE FONCTION — `ARB-052` : « une adresse dont la réponse ne
	   dépend que de la présence d'une session redirige. » */
	{ prefixe: '/importer', regime: 'redirection' },
	{ prefixe: '/mon-profil', regime: 'redirection' },
	{ prefixe: '/console', regime: 'redirection' },
	{ prefixe: '/cartographie', regime: 'redirection' },
	{ prefixe: '/carte-mentale', regime: 'redirection' },
	{ prefixe: '/bibliotheque', regime: 'redirection' },
	/* Régime indiscernable — §5.5, `ADR-007`. Ces deux préfixes portent un IDENTIFIANT
	   DE CORPUS : leur existence est elle-même l'information confidentielle. */
	{ prefixe: '/notes', regime: 'resolution' },
	{ prefixe: '/univers', regime: 'resolution' },
	/* La racine — V-01 sans session, V-07 avec (`docs/routes.md:98-99`). */
	{ prefixe: '/', regime: 'publique' }
];

export function regimeDe(chemin: string): RegimeDAdresse {
	for (const r of REGIMES) {
		if (chemin === r.prefixe) return r.regime;
		if (r.prefixe === '/') continue;
		if (chemin.startsWith(`${r.prefixe}/`)) return r.regime;
	}
	return chemin === '/' ? 'publique' : 'resolution';
}

/**
 * `?suite=` — « n'accepte qu'un chemin absolu interne : une valeur externe est ignorée et
 * remplacée par `/` ». Sont remplacés : l'absence de valeur, tout ce qui ne commence pas par
 * `/`, les adresses réseau `//hote`, la barre inversée que certains agents normalisent en `/`,
 * et tout caractère de contrôle. La substitution EST la réponse.
 */
export function suiteInterne(valeur: string | null | undefined): string {
	if (typeof valeur !== 'string' || valeur.length === 0) return '/';
	if (!valeur.startsWith('/')) return '/';
	if (valeur.startsWith('//')) return '/';
	if (valeur.includes('\\')) return '/';
	/* Les caractères de contrôle sont cherchés par code, non par expression
	   rationnelle : `no-control-regex` refuse la seconde forme, et une plage écrite à
	   la main s'y trompe d'un caractère sans que rien ne le dise. */
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
 * Où l'on va après connexion — « `{suite}` si présent, sinon `/` ». Cela ne contredit
 * pas V-05 : `/` rend l'accueil public sans session et l'ACCUEIL CONTRIBUTEUR avec
 * session, et les deux formulations désignent le même endroit.
 */
export function cibleApresConnexion(suite: string | null | undefined): string {
	return suiteInterne(suite);
}

/** Après déconnexion — RG-ACC-02, UC-M16-02 : l'espace public, jamais une erreur. */
export const CIBLE_APRES_DECONNEXION = '/';

/**
 * Où l'on est renvoyé tant que le mot de passe initial n'a pas été changé. L'onglet
 * est celui du formulaire de changement, seul écran du produit où un compte change
 * son propre mot de passe.
 */
export const CIBLE_DE_CHANGEMENT_DE_MOT_DE_PASSE = '/mon-profil?onglet=securite';

/**
 * Faut-il renvoyer cette adresse vers le changement de mot de passe ?
 *
 * `/console/comptes` écrit sous le mot de passe engendré : « il devra être changé à la
 * première connexion ». Rien ne le forçait — le compte gardait indéfiniment la valeur
 * transmise par un canal que ni l'un ni l'autre ne maîtrise.
 *
 * DEUX FAMILLES SONT LAISSÉES PASSER, ET AUCUNE DE PLUS : `/mon-profil`, sans quoi la
 * redirection bouclerait, et `/deconnexion`, parce que `RG-ACC-02` veut qu'un compte puisse
 * partir. LE RESTE EST RENVOYÉ, ESPACE PUBLIC COMPRIS : la règle porte sur le compte.
 */
export function versLeChangementDeMotDePasse(chemin: string): boolean {
	if (chemin === '/mon-profil' || chemin.startsWith('/mon-profil/')) return false;
	return regimeDe(chemin) !== 'deconnexion';
}
