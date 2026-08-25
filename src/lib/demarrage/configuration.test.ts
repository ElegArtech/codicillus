/**
 * LA PORTE DE DÉMARRAGE — ce qui s'en éprouve sans base ni moteur.
 *
 * Deux polarités, et la seconde est celle qui compte : une configuration
 * complète NE DOIT PAS retenir le démarrage. Une porte qui refuserait à tort
 * serait pire que le défaut qu'elle ferme, puisqu'elle abattrait le produit
 * entier là où il ne manquait qu'un écran.
 *
 * Les messages ne sont pas cités mot pour mot : ils appartiennent aux deux
 * modules de configuration, et les figer ici en ferait une seconde définition.
 * Ce qui est éprouvé, c'est que chaque panne NOMME sa variable — c'est tout
 * l'intérêt de dire l'erreur au démarrage.
 */
import { describe, expect, it } from 'vitest';
import {
	ConfigurationIncompleteErreur,
	pannesDeConfiguration,
	verifierLaConfiguration
} from './configuration';

/** Un déploiement complet, tel que la composition d'exploitation le passe. */
const COMPLET = {
	HOTE_BASE: 'base',
	PORT_BASE: '5432',
	UTILISATEUR_BASE: 'codicillus',
	MDP_BASE: 'mot/de+passe#et?tout',
	NOM_BASE: 'codicillus',
	URL_RECHERCHE: 'http://recherche:7700',
	CLE_RECHERCHE: 'une-clé'
};

describe('la configuration complète laisse le produit démarrer', () => {
	it('ne relève aucune panne, et ne lève pas', () => {
		expect(pannesDeConfiguration(COMPLET)).toEqual([]);
		expect(() => verifierLaConfiguration(COMPLET)).not.toThrow();
	});

	it('accepte aussi le jeu SERVEUR, employé hors composition', () => {
		expect(
			pannesDeConfiguration({
				MDP_POSTGRES: 'secret',
				BASE_POSTGRES: 'codicillus',
				CLE_MAITRE_RECHERCHE: 'une-clé-maîtresse'
			})
		).toEqual([]);
	});
});

describe('la configuration incomplète interrompt le démarrage en NOMMANT ce qui manque', () => {
	it('la clé du moteur absente est constatée AU DÉMARRAGE, pas à l’écran de recherche', () => {
		/* Le défaut d'origine, exactement : les cinq variables de la base et rien
		   d'autre. Le produit servait dix-huit écrans et rendait 500 sur le seul
		   écran de recherche, à la première requête qui l'atteignait. */
		const pannes = pannesDeConfiguration({ ...COMPLET, URL_RECHERCHE: '', CLE_RECHERCHE: '' });
		expect(pannes).toHaveLength(1);
		expect(pannes[0]).toContain('CLE_RECHERCHE');
		expect(pannes[0]).toContain('CLE_MAITRE_RECHERCHE');
	});

	it('le mot de passe de la base absent est constaté de même', () => {
		const pannes = pannesDeConfiguration({ ...COMPLET, MDP_BASE: '' });
		expect(pannes).toHaveLength(1);
		expect(pannes[0]).toContain('MDP_BASE');
		expect(pannes[0]).toContain('MDP_POSTGRES');
	});

	it('DEUX pannes sont dites ENSEMBLE, pas l’une après l’autre', () => {
		/* Sortir à la première ferait deux démarrages, deux lectures de journal et
		   deux corrections là où une suffit. */
		expect(pannesDeConfiguration({})).toHaveLength(2);
	});

	it('l’erreur levée porte les pannes et les nomme dans son message', () => {
		let leve: unknown = null;
		try {
			verifierLaConfiguration({});
		} catch (cause) {
			leve = cause;
		}
		expect(leve).toBeInstanceOf(ConfigurationIncompleteErreur);
		const erreur = leve as ConfigurationIncompleteErreur;
		expect(erreur.pannes).toHaveLength(2);
		expect(erreur.message).toContain('MDP_BASE');
		expect(erreur.message).toContain('CLE_RECHERCHE');
	});

	it('un port qui n’en est pas un est une panne, et il est cité', () => {
		const pannes = pannesDeConfiguration({ ...COMPLET, PORT_BASE: 'quatre-mille' });
		expect(pannes).toHaveLength(1);
		expect(pannes[0]).toContain('quatre-mille');
	});

	it('AUCUN mot de passe ni AUCUNE clé n’entre dans un message', () => {
		/* Un message de démarrage part au journal de l'exploitant : il nomme les
		   variables, jamais leurs valeurs. */
		const pannes = pannesDeConfiguration({ ...COMPLET, PORT_BASE: 'quatre-mille' });
		for (const panne of pannes) {
			expect(panne).not.toContain(COMPLET.MDP_BASE);
			expect(panne).not.toContain(COMPLET.CLE_RECHERCHE);
		}
	});
});
