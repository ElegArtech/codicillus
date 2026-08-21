/**
 * LES SESSIONS — le jeton, le cookie, et le délai d'inactivité.
 *
 * La règle éprouvée ici est celle du gel : `V-33:1361` « DÉLAI D'INACTIVITÉ au
 * bout duquel la session se ferme, SAUF SI l'utilisateur a choisi de rester
 * connecté », et `V-25:1223` qui en donne le défaut — « sans cette option, la
 * session se ferme après deux heures d'inactivité ».
 *
 * LES DEUX POLARITÉS SONT JOUÉES (`P-5`, second paragraphe) : la session
 * ordinaire QUI SE FERME, et la session « se souvenir de moi » QUI NE SE FERME
 * PAS. Une épreuve qui n'aurait que la première laisserait l'exemption
 * inéprouvée — c'est-à-dire espérée.
 */
import { CONFIGURATION_PAR_DEFAUT } from '../base/schema';
import { describe, expect, it } from 'vitest';
import {
	ATTRIBUTS_DU_COOKIE,
	DureeDeSessionIllisibleErreur,
	NOM_DU_COOKIE,
	condensatDeJeton,
	dureeDInactiviteEnMinutes,
	sessionExpiree,
	tirerUnJeton
} from './sessions';

describe('le jeton est opaque, et la base n’en garde que le condensat', () => {
	it('tire 256 bits, encodés en base64url', () => {
		const jeton = tirerUnJeton();
		expect(jeton).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(Buffer.from(jeton, 'base64url').length).toBe(32);
	});

	it('ne tire jamais deux fois le même', () => {
		const tirages = new Set(Array.from({ length: 200 }, () => tirerUnJeton()));
		expect(tirages.size).toBe(200);
	});

	it('ne porte aucune structure : rien ne s’en déduit', () => {
		const jeton = tirerUnJeton();
		expect(jeton).not.toContain('.');
		expect(jeton).not.toContain(':');
	});

	it('condense de façon stable, et le condensat n’est pas le jeton', () => {
		const jeton = tirerUnJeton();
		const condensat = condensatDeJeton(jeton);
		expect(condensat).toMatch(/^[0-9a-f]{64}$/);
		expect(condensat).toBe(condensatDeJeton(jeton));
		expect(condensat).not.toContain(jeton);
		expect(condensatDeJeton(tirerUnJeton())).not.toBe(condensat);
	});
});

describe('le cookie porte les trois attributs de STACK §4.7', () => {
	it('HttpOnly, SameSite=Lax, Secure, et un chemin', () => {
		expect(ATTRIBUTS_DU_COOKIE.httpOnly).toBe(true);
		expect(ATTRIBUTS_DU_COOKIE.sameSite).toBe('lax');
		expect(ATTRIBUTS_DU_COOKIE.secure).toBe(true);
		expect(ATTRIBUTS_DU_COOKIE.path).toBe('/');
	});

	it('ne nomme rien de ce qu’il transporte', () => {
		expect(NOM_DU_COOKIE).not.toMatch(/jeton|token|compte|identifiant/i);
	});
});

describe('la durée est LUE, jamais codée en dur (RG-M14-08 lu avec M14.7)', () => {
	it('accepte les cinq choix de la console (V-33:2963)', () => {
		for (const minutes of [30, 60, 120, 240, 480]) {
			expect(dureeDInactiviteEnMinutes(minutes)).toBe(minutes);
		}
	});

	it('accepte la forme textuelle que `jsonb` peut rendre', () => {
		expect(dureeDInactiviteEnMinutes('120')).toBe(120);
	});

	/* CE TEST DISAIT L'INVERSE — « ÉCHOUE plutôt que de se donner un défaut ». Il
	   gravait une doctrine qui rendait le produit inutilisable au premier
	   démarrage : sur une base migrée et NON SEMÉE — l'état normal d'une
	   installation neuve —, `parametres` est vide et les dix-huit pages essayées
	   sortaient en 500 (mesuré le 21/08/2026). Un défaut n'est pas une seconde
	   définition : c'est la valeur avant tout réglage, et la valeur réglée
	   l'emporte dès qu'elle existe. */
	it('rend le défaut du produit quand le paramètre est ABSENT', () => {
		expect(dureeDInactiviteEnMinutes(undefined)).toBe(CONFIGURATION_PAR_DEFAUT.dureeSession);
		expect(dureeDInactiviteEnMinutes(null)).toBe(CONFIGURATION_PAR_DEFAUT.dureeSession);
	});

	it('ÉCHOUE encore sur une valeur PRÉSENTE mais illisible', () => {
		/* Ce n'est plus une base neuve, c'est une base corrompue : la faire vivre
		   sur un défaut masquerait le défaut. */
		for (const valeur of [0, -1, 'deux heures', {}]) {
			expect(() => dureeDInactiviteEnMinutes(valeur)).toThrow(DureeDeSessionIllisibleErreur);
		}
	});

	it('nomme la cause et l’endroit du réglage', () => {
		expect(() => dureeDInactiviteEnMinutes('deux heures')).toThrow(/duree_session/);
		expect(() => dureeDInactiviteEnMinutes('deux heures')).toThrow(/console/);
	});
});

describe('le délai d’inactivité — et son exemption', () => {
	const maintenant = new Date('2026-08-20T12:00:00.000Z');
	const ilYA = (minutes: number) => new Date(maintenant.getTime() - minutes * 60_000);

	it('ne ferme pas une session active', () => {
		expect(
			sessionExpiree({ souvenir: false, derniereActiviteLe: ilYA(119) }, 120, maintenant)
		).toBe(false);
	});

	it('ferme une session inactive au-delà du délai', () => {
		expect(
			sessionExpiree({ souvenir: false, derniereActiviteLe: ilYA(121) }, 120, maintenant)
		).toBe(true);
	});

	it('mesure depuis la DERNIÈRE ACTIVITÉ, pas depuis l’ouverture', () => {
		/* Une session ouverte il y a huit heures mais active il y a une minute
		   n'est pas inactive : c'est toute la différence entre les deux dates. */
		expect(sessionExpiree({ souvenir: false, derniereActiviteLe: ilYA(1) }, 120, maintenant)).toBe(
			false
		);
	});

	it('suit le réglage : un délai resserré ferme ce qu’un délai large gardait', () => {
		const session = { souvenir: false, derniereActiviteLe: ilYA(45) };
		expect(sessionExpiree(session, 30, maintenant)).toBe(true);
		expect(sessionExpiree(session, 60, maintenant)).toBe(false);
	});

	it('EXEMPTE « se souvenir de moi », quelle que soit l’inactivité', () => {
		expect(
			sessionExpiree({ souvenir: true, derniereActiviteLe: ilYA(100_000) }, 30, maintenant)
		).toBe(false);
	});
});
