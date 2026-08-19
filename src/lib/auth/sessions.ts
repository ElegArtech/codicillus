/**
 * LES SESSIONS — jetons opaques, cookie, et le délai d'inactivité.
 *
 * `cadrage/STACK-TECHNIQUE.md` §4.7 (`:322`) : « Sessions — jetons opaques en
 * base, cookie `HttpOnly`, `SameSite=Lax`, `Secure` », servant « la durée
 * configurable (M14.7) » et « la restauration de la page visée après
 * reconnexion (RG-ACC-03) ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA DURÉE EST UN DÉLAI D'INACTIVITÉ, ET LE GEL EST PLUS PRÉCIS QUE LE CAHIER
 *
 * `mockups/V-33-console-configuration.html:1361` : « Durée de session — DÉLAI
 * D'INACTIVITÉ au bout duquel la session se ferme, SAUF SI L'UTILISATEUR A
 * CHOISI DE RESTER CONNECTÉ. » Et `V-25:1223`, qui le dit une seconde fois avec
 * la valeur par défaut : « Sans cette option, la session se ferme après deux
 * heures d'inactivité. »
 *
 * Trois conséquences, et aucune n'est une décision de ce lot :
 *
 *   · l'inactivité se mesure depuis la DERNIÈRE REQUÊTE SERVIE, non depuis
 *     l'ouverture — d'où `derniere_activite_le` en base ;
 *   · la durée est LUE EN BASE (`parametres.duree_session`, semée par
 *     `src/lib/base/semence.ts:484`, réglée par la console V-33) et jamais
 *     codée en dur : les cinq choix `[30, 60, 120, 240, 480]` (`V-33:2963`) et
 *     le défaut 120 (`V-33:2663`) sont des données, pas des constantes ;
 *   · « se souvenir de moi » EXEMPTE du délai ; il ne le prolonge pas. C'est ce
 *     que « option se souvenir de moi PROLONGEANT la session » (`CDC:1275`) veut
 *     dire, et le gel le dit mieux que le cahier.
 *
 * CE QUE AUCUNE SOURCE NE DONNE : la durée de vie du cookie « se souvenir de
 * moi ». Le cookie posé ici est donc un cookie de session au sens du
 * navigateur — sans `Max-Age`. L'exemption d'inactivité, elle, est tenue côté
 * serveur. Écart déclaré au rapport du lot : la promesse « rester connecté SUR
 * CET APPAREIL » (`V-25:1222`) ne survit pas à la fermeture du navigateur, et
 * lui donner une durée serait inventer un nombre que rien ne fixe.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE JETON EST OPAQUE, ET LA BASE N'EN GARDE QUE LE CONDENSAT
 *
 * 256 bits tirés du générateur cryptographique du système, encodés en base64url.
 * Aucune structure : ni identifiant de compte, ni date, ni signature — rien à
 * lire, rien à falsifier. La base ne stocke que son condensat SHA-256 : une
 * copie de la base ne rend aucune session utilisable.
 *
 * POURQUOI SHA-256 ET NON ARGON2ID ICI, alors que les mots de passe exigent
 * l'inverse : un mot de passe est deviné parce qu'il est court et choisi par un
 * humain ; un jeton de 256 bits tiré au hasard ne s'énumère pas. Un condensat
 * lent n'y ajouterait rien, et il coûterait sa durée À CHAQUE REQUÊTE.
 */
import { createHash, randomBytes } from 'node:crypto';

/**
 * Le nom du cookie. Aucune source ne le fixe ; il est nommé du produit et du
 * concept, sur le modèle des clés de stockage local du gel
 * (`codicillus.rail.deplies`, `V-37:3110`). Il ne porte aucune information.
 */
export const NOM_DU_COOKIE = 'codicillus_session';

/**
 * Les attributs du cookie, tels que `STACK-TECHNIQUE.md:322` les énumère —
 * `HttpOnly`, `SameSite=Lax`, `Secure` — plus le chemin, sans lequel le cookie
 * ne serait posé que sur la route qui l'écrit.
 *
 * `Secure` est posé sans condition d'environnement : la source l'exige, et les
 * navigateurs traitent `localhost` comme une origine sûre, de sorte que le
 * développement n'a rien à assouplir.
 */
export const ATTRIBUTS_DU_COOKIE = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: true
} as const;

/** Un jeton opaque de 256 bits, en base64url. */
export function tirerUnJeton(): string {
	return randomBytes(32).toString('base64url');
}

/** Le condensat stocké en base pour un jeton — jamais le jeton lui-même. */
export function condensatDeJeton(jeton: string): string {
	return createHash('sha256').update(jeton, 'utf8').digest('hex');
}

/** Levée quand `parametres.duree_session` manque ou n'est pas exploitable. */
export class DureeDeSessionIllisibleErreur extends Error {
	constructor(valeur: unknown) {
		super(
			'parametres.duree_session est absent ou illisible : ' +
				`${JSON.stringify(valeur) ?? 'undefined'}. La durée de session est une valeur de ` +
				'configuration (M14.7, V-33), semée par src/lib/base/semence.ts et réglée en ' +
				'console. Aucune valeur de repli n’est écrite ici : ce serait une seconde ' +
				'définition de la durée, et elle survivrait au réglage.'
		);
		this.name = 'DureeDeSessionIllisibleErreur';
	}
}

/**
 * La durée d'inactivité, en minutes, telle que `parametres` la porte.
 *
 * ELLE ÉCHOUE PLUTÔT QUE DE SE DONNER UN DÉFAUT. Un repli codé en dur serait
 * une seconde définition — le défaut du gel est 120 (`V-33:2663`), et il vit
 * déjà dans le jeu de semence qui alimente la table. Une base sans ce paramètre
 * est une base non semée : un échec nommé le dit, là où un repli silencieux
 * ferait vivre le produit sur une valeur que personne n'a réglée.
 */
export function dureeDInactiviteEnMinutes(valeur: unknown): number {
	const nombre = typeof valeur === 'number' ? valeur : Number(valeur);
	if (!Number.isFinite(nombre) || nombre <= 0) throw new DureeDeSessionIllisibleErreur(valeur);
	return nombre;
}

/** Ce que la règle d'inactivité a besoin de savoir d'une session. */
export interface SessionPourInactivite {
	readonly souvenir: boolean;
	readonly derniereActiviteLe: Date;
}

/**
 * LA RÈGLE D'INACTIVITÉ — une seule définition, et elle se joue sans base.
 *
 * `souvenir` exempte : la session ne se ferme alors jamais d'elle-même
 * (`V-33:1361`, « sauf si l'utilisateur a choisi de rester connecté »).
 */
export function sessionExpiree(
	session: SessionPourInactivite,
	dureeEnMinutes: number,
	maintenant: Date
): boolean {
	if (session.souvenir) return false;
	const ecoule = maintenant.getTime() - session.derniereActiviteLe.getTime();
	return ecoule > dureeEnMinutes * 60 * 1000;
}
