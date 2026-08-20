/**
 * LES UNITAIRES DE LA CONNEXION AU MOTEUR.
 *
 * Ils portent une seule propriété, et c'est celle de `P-13` : **la clé n'entre
 * jamais dans une adresse**. Le piège a été mesuré sur PostgreSQL — un `/`, un
 * `#` ou un `?` dans un mot de passe tuait le service au démarrage — et
 * `ARB-038` en a tiré une parade de FORME, pas une consigne. Ces cas exercent la
 * forme : un secret qui contient tout ce qui casse une adresse, et la garantie
 * que l'adresse n'en porte rien.
 *
 * `P-5` : la règle est éprouvée sur un cas qui la sollicite, pas sur un secret
 * sage.
 */
import { describe, expect, it } from 'vitest';
import {
	RechercheNonConfigureeErreur,
	configurationDeRecherche,
	rechercheLisible
} from './connexion';

/** Un secret qui porte tout ce qui casse une adresse composée à la main. */
const CLE_HOSTILE = 'cle/avec#tout?ce+qui:casse@une&adresse';

describe('la configuration du moteur — deux jeux, un ordre', () => {
	it('préfère les variables du CLIENT quand elles existent', () => {
		const config = configurationDeRecherche({
			URL_RECHERCHE: 'http://recherche:7700',
			CLE_RECHERCHE: 'cle-du-client',
			PORT_RECHERCHE: '19700',
			CLE_MAITRE_RECHERCHE: 'cle-du-serveur'
		});
		expect(config).toEqual({ host: 'http://recherche:7700', apiKey: 'cle-du-client' });
	});

	it('retombe sur le port publié quand seules les variables du SERVEUR existent', () => {
		const config = configurationDeRecherche({
			PORT_RECHERCHE: '19700',
			CLE_MAITRE_RECHERCHE: 'cle-du-serveur'
		});
		expect(config).toEqual({ host: 'http://127.0.0.1:19700', apiKey: 'cle-du-serveur' });
	});

	it('emploie le port par défaut quand il n’est pas donné', () => {
		const config = configurationDeRecherche({ CLE_MAITRE_RECHERCHE: 'k' });
		expect(config.host).toBe('http://127.0.0.1:19700');
	});

	it('traite une variable vide ou blanche comme absente', () => {
		const config = configurationDeRecherche({
			URL_RECHERCHE: '   ',
			CLE_RECHERCHE: '',
			CLE_MAITRE_RECHERCHE: 'k'
		});
		expect(config.host).toBe('http://127.0.0.1:19700');
		expect(config.apiKey).toBe('k');
	});
});

describe('P-13 — la clé n’entre jamais dans l’adresse', () => {
	it('ne compose aucune adresse portant la clé, même hostile', () => {
		const config = configurationDeRecherche({
			PORT_RECHERCHE: '19700',
			CLE_MAITRE_RECHERCHE: CLE_HOSTILE
		});
		expect(config.apiKey).toBe(CLE_HOSTILE);
		expect(config.host).toBe('http://127.0.0.1:19700');
		for (const morceau of CLE_HOSTILE.split(/[/#?+:@&]/)) {
			if (morceau.length > 0) expect(config.host).not.toContain(morceau);
		}
	});

	it('rend une adresse imprimable qui ne porte rien à masquer', () => {
		const config = configurationDeRecherche({
			URL_RECHERCHE: 'http://recherche:7700',
			CLE_RECHERCHE: CLE_HOSTILE
		});
		expect(rechercheLisible(config)).toBe('http://recherche:7700');
		expect(rechercheLisible(config)).not.toContain('cle');
	});
});

describe('les refus de configuration — dire, jamais deviner', () => {
	it('refuse l’absence des deux clés', () => {
		expect(() => configurationDeRecherche({})).toThrow(RechercheNonConfigureeErreur);
	});

	it('nomme les deux variables dans le message', () => {
		try {
			configurationDeRecherche({});
			expect.unreachable('la configuration vide devait être refusée');
		} catch (erreur) {
			expect(String(erreur)).toContain('CLE_RECHERCHE');
			expect(String(erreur)).toContain('CLE_MAITRE_RECHERCHE');
		}
	});

	it('refuse un port qui n’est pas un port, plutôt que de l’insérer', () => {
		expect(() =>
			configurationDeRecherche({ PORT_RECHERCHE: '7700/../autre', CLE_MAITRE_RECHERCHE: 'k' })
		).toThrow(RechercheNonConfigureeErreur);
	});
});
