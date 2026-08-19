/**
 * ARB-050 — LES DEUX CAS QUI EXERCENT LA CORRECTION.
 *
 * L'arbitrage l'exige en propres termes : « le défaut ne se referme pas par une
 * correction seule : il se referme par un cas qui l'exerce. Un unitaire doit
 * échouer si `URL_BASE` redevient un chemin accepté, et un autre doit prouver
 * que les cinq `*_BASE` produisent bien un OBJET — `connectionString` absent du
 * résultat. Sans quoi la correction est espérée, non posée. »
 *
 * C'est `P-5`, et c'est pourquoi le défaut a survécu à une batterie verte :
 * rien n'exerçait le chemin de l'application conteneurisée.
 */
import { describe, expect, it } from 'vitest';
import {
	BASE_PAR_DEFAUT,
	ConnexionNonConfigureeErreur,
	HOTE_PAR_DEFAUT,
	PORT_PAR_DEFAUT,
	UTILISATEUR_PAR_DEFAUT,
	configurationDeConnexion,
	connexionLisible
} from './connexion';

/** Ce que `compose.yaml` passe au service `app` (ARB-038). */
const CINQ_BASE = {
	HOTE_BASE: 'db',
	PORT_BASE: '5432',
	UTILISATEUR_BASE: 'codicillus',
	MDP_BASE: 'mot/de+passe#avec?tout',
	NOM_BASE: 'codicillus'
};

describe('ARB-050 — les cinq *_BASE sont lues, et elles produisent un objet', () => {
	it('lit les cinq variables du service `app` de compose.yaml', () => {
		const config = configurationDeConnexion(CINQ_BASE);
		expect(config.host).toBe('db');
		expect(config.port).toBe(5432);
		expect(config.user).toBe('codicillus');
		expect(config.password).toBe('mot/de+passe#avec?tout');
		expect(config.database).toBe('codicillus');
	});

	it('ne produit JAMAIS de connectionString — P-13 est fermé par la forme', () => {
		const config = configurationDeConnexion(CINQ_BASE);
		expect('connectionString' in config).toBe(false);
		expect(config.connectionString).toBeUndefined();
		/* Le mot de passe le plus hostile que T-010 ait mesuré traverse intact :
		   rien n'est concaténé, donc rien n'est à échapper. */
		expect(config.password).toContain('/');
		expect(config.password).toContain('#');
		expect(config.password).toContain('?');
	});

	it('refuse de reconnaître `URL_BASE` — le chemin est retiré, pas toléré', () => {
		/* Le type n'a plus de champ `URL_BASE` : le cas ne peut être écrit qu'en
		   forçant, ce qui est exactement ce qu'un retour en arrière ferait. Si le
		   champ redevenait lu, cette configuration cesserait de lever, et ce test
		   échouerait. */
		const environnement = {
			URL_BASE: 'postgres://codicillus:secret@db:5432/codicillus'
		} as Record<string, string>;
		expect(() => configurationDeConnexion(environnement)).toThrow(ConnexionNonConfigureeErreur);
	});

	it('n’emprunte rien à `URL_BASE` même quand les *_BASE sont là', () => {
		const config = configurationDeConnexion({
			...CINQ_BASE,
			URL_BASE: 'postgres://intrus:intrus@intrus:1/intrus'
		} as Record<string, string>);
		expect(config.host).toBe('db');
		expect('connectionString' in config).toBe(false);
	});
});

describe('les deux jeux de variables ne se confondent pas (ARB-038)', () => {
	it('emploie les *_POSTGRES hors conteneur, quand aucun *_BASE n’est posé', () => {
		const config = configurationDeConnexion({
			UTILISATEUR_POSTGRES: 'codicillus',
			MDP_POSTGRES: 'secret',
			BASE_POSTGRES: 'codicillus',
			HOTE_POSTGRES: '127.0.0.1',
			PORT_DB: '19432'
		});
		expect(config.host).toBe('127.0.0.1');
		expect(config.port).toBe(19432);
		expect(config.password).toBe('secret');
	});

	it('donne la priorité au CLIENT quand les deux jeux sont présents', () => {
		const config = configurationDeConnexion({
			HOTE_BASE: 'db',
			MDP_BASE: 'client',
			HOTE_POSTGRES: '127.0.0.1',
			MDP_POSTGRES: 'serveur',
			PORT_DB: '19432',
			PORT_BASE: '5432'
		});
		expect(config.host).toBe('db');
		expect(config.port).toBe(5432);
		expect(config.password).toBe('client');
	});

	it('retombe sur les valeurs par défaut documentées', () => {
		const config = configurationDeConnexion({ MDP_BASE: 'secret' });
		expect(config.host).toBe(HOTE_PAR_DEFAUT);
		expect(config.port).toBe(PORT_PAR_DEFAUT);
		expect(config.user).toBe(UTILISATEUR_PAR_DEFAUT);
		expect(config.database).toBe(BASE_PAR_DEFAUT);
	});

	it('refuse un environnement sans aucun mot de passe, en nommant les deux noms', () => {
		expect(() => configurationDeConnexion({})).toThrow(/MDP_BASE/);
		expect(() => configurationDeConnexion({})).toThrow(/MDP_POSTGRES/);
	});

	it('refuse un port qui n’est pas un port', () => {
		expect(() => configurationDeConnexion({ MDP_BASE: 'x', PORT_BASE: 'cinq' })).toThrow(
			ConnexionNonConfigureeErreur
		);
		expect(() => configurationDeConnexion({ MDP_BASE: 'x', PORT_BASE: '70000' })).toThrow(
			ConnexionNonConfigureeErreur
		);
	});
});

describe('connexionLisible — aucun mot de passe n’est imprimable', () => {
	it('n’imprime jamais le mot de passe', () => {
		const lisible = connexionLisible(configurationDeConnexion(CINQ_BASE));
		expect(lisible).toBe('postgres://codicillus@db:5432/codicillus');
		expect(lisible).not.toContain('mot/de+passe');
	});
});
