/**
 * LES SESSIONS — jetons opaques, cookie, et le délai d'inactivité. `STACK §4.7` :
 * « jetons opaques en base, cookie `HttpOnly`, `SameSite=Lax`, `Secure` ».
 *
 * LA DURÉE EST UN DÉLAI D'INACTIVITÉ (`V-33:1361`), non une durée de vie :
 *
 *   · l'inactivité se mesure depuis la DERNIÈRE REQUÊTE SERVIE, d'où
 *     `derniere_activite_le` en base ;
 *   · la durée est LUE EN BASE (`parametres.duree_session`, réglée par V-33) et
 *     jamais codée en dur : les cinq choix `[30, 60, 120, 240, 480]` et le défaut
 *     120 sont des données ;
 *   · « se souvenir de moi » EXEMPTE du délai ; il ne le prolonge pas.
 *
 * CE QU'AUCUNE SOURCE NE DONNE : la durée de vie du cookie « se souvenir de moi ».
 * Le cookie posé ici est donc un cookie de session au sens du navigateur — sans
 * `Max-Age` —, et l'exemption d'inactivité est tenue côté serveur.
 *
 * LE JETON EST OPAQUE : 256 bits du générateur cryptographique du système, en
 * base64url, sans structure. La base n'en garde que le condensat SHA-256 — une copie
 * de la base ne rend aucune session utilisable. SHA-256 ET NON ARGON2ID ICI, à
 * l'inverse des mots de passe : un jeton de 256 bits tiré au hasard ne s'énumère
 * pas, et un condensat lent coûterait sa durée À CHAQUE REQUÊTE.
 */
import { createHash, randomBytes } from 'node:crypto';
import { CONFIGURATION_PAR_DEFAUT } from '../base/schema';

/**
 * Le nom du cookie. Aucune source ne le fixe ; il ne porte aucune information.
 */
export const NOM_DU_COOKIE = 'codicillus_session';

/**
 * Les attributs du cookie (`STACK §4.7`) — plus le chemin, sans lequel le cookie ne
 * serait posé que sur la route qui l'écrit. `Secure` est posé sans condition
 * d'environnement : les navigateurs traitent `localhost` comme une origine sûre.
 */
export const ATTRIBUTS_DU_COOKIE = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: true
} as const;

export function tirerUnJeton(): string {
	return randomBytes(32).toString('base64url');
}

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
 * UN PARAMÈTRE ABSENT PREND LE DÉFAUT DU PRODUIT ; UN PARAMÈTRE ILLISIBLE LÈVE. Sur
 * une base migrée et non semée — une INSTALLATION NEUVE — `parametres` est vide :
 * lever là faisait sortir dix-huit pages en 500.
 *
 * LE DÉFAUT N'EST PAS ÉCRIT ICI, il est lu de `CONFIGURATION_PAR_DEFAUT`
 * (`$lib/base/schema`), au même endroit que les six autres.
 *
 * UNE VALEUR PRÉSENTE MAIS ILLISIBLE LÈVE ENCORE — chaîne, nombre négatif, zéro : ce
 * n'est plus une base neuve, c'est une base corrompue.
 */
export function dureeDInactiviteEnMinutes(valeur: unknown): number {
	if (valeur === undefined || valeur === null) return CONFIGURATION_PAR_DEFAUT.dureeSession;
	const nombre = typeof valeur === 'number' ? valeur : Number(valeur);
	if (!Number.isFinite(nombre) || nombre <= 0) throw new DureeDeSessionIllisibleErreur(valeur);
	return nombre;
}

export interface SessionPourInactivite {
	readonly souvenir: boolean;
	readonly derniereActiviteLe: Date;
}

/**
 * LA RÈGLE D'INACTIVITÉ — une seule définition, et elle se joue sans base.
 * `souvenir` exempte : la session ne se ferme alors jamais d'elle-même
 * (`V-33:1361`).
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
