/**
 * LES REDIRECTIONS DE SESSION — `docs/routes.md` §5.2, éprouvées ligne par
 * ligne, plus la substitution de `?suite=` de `:329`.
 *
 * `P-5` : chaque régime de la table de `garde.ts` doit être EXERCÉ, sans quoi
 * une ligne pourrait être fausse sans que rien ne le dise. Le dernier `it` de la
 * première section joue les quatorze préfixes et échoue si l'un n'est atteint
 * par aucun cas.
 */
import { describe, expect, it } from 'vitest';
import {
	CIBLE_APRES_DECONNEXION,
	CIBLE_DE_CHANGEMENT_DE_MOT_DE_PASSE,
	MOTIF,
	REGIMES,
	adresseDeConnexion,
	arriveeDepuisMotif,
	cibleApresConnexion,
	regimeDe,
	suiteInterne,
	versLeChangementDeMotDePasse
} from './garde';

const CAS_DE_REGIME: readonly { readonly chemin: string; readonly attendu: string }[] = [
	{ chemin: '/', attendu: 'publique' },
	{ chemin: '/recherche', attendu: 'publique' },
	{ chemin: '/recherche?q=barman', attendu: 'publique' },
	{ chemin: '/connexion', attendu: 'publique' },
	{ chemin: '/mot-de-passe-oublie', attendu: 'publique' },
	{ chemin: '/mot-de-passe-oublie/un-jeton', attendu: 'publique' },
	/* `RG-NF-10` — la page d'indisponibilité programmée est servie à tout le monde,
	   sans quoi la redirection qui y renvoie boucherait sur une redirection vers la
	   connexion. */
	{ chemin: '/indisponibilite', attendu: 'publique' },
	{ chemin: '/deconnexion', attendu: 'deconnexion' },
	{ chemin: '/guides/plan-de-reprise-volet-bases', attendu: 'resolution' },
	{ chemin: '/importer', attendu: 'redirection' },
	{ chemin: '/mon-profil', attendu: 'redirection' },
	{ chemin: '/console', attendu: 'redirection' },
	{ chemin: '/console/comptes', attendu: 'redirection' },
	{ chemin: '/notes/restaurer-une-sauvegarde-postgresql', attendu: 'resolution' },
	{ chemin: '/univers/production/infrastructure', attendu: 'resolution' },
	/* ARB-052 — ces quatre cas attendaient `resolution` jusqu'au 20 août : les
	   trois familles étaient laissées là faute d'arbitrage. `ARB-052` les range
	   en `redirection` pour l'ANONYME, au motif qu'`ARB-002` et `ARB-007` ne
	   parlent que du connecté, et que ces chemins ne révèlent aucun contenu.
	   `pnpm test:etancheite` mesurait, avant la correction, une fuite de
	   35 778 octets sur `/cartographie` et de 26 846 sur `/carte-mentale`
	   servis à un anonyme. */
	{ chemin: '/cartographie', attendu: 'redirection' },
	{ chemin: '/cartographie/par-type', attendu: 'redirection' },
	{ chemin: '/carte-mentale', attendu: 'redirection' },
	{ chemin: '/bibliotheque', attendu: 'redirection' }
];

describe('le régime d’une adresse — docs/routes.md §3, §5.5, ARB-052', () => {
	for (const cas of CAS_DE_REGIME) {
		it(`${cas.chemin} → ${cas.attendu}`, () => {
			/* Le régime se lit sur le chemin seul : la partie interrogative n'en
			   fait pas partie, et un appelant qui la passerait ne doit pas changer
			   le verdict. */
			const chemin = cas.chemin.split('?')[0] ?? '';
			expect(regimeDe(chemin)).toBe(cas.attendu);
		});
	}

	it('ferme par défaut : une adresse inconnue relève de la résolution', () => {
		expect(regimeDe('/quelque-chose-qui-nexiste-pas')).toBe('resolution');
		expect(regimeDe('/consolette')).toBe('resolution');
	});

	it('n’a pas de préfixe inerte — chaque ligne de la table est exercée (P-5)', () => {
		const atteints = new Set(CAS_DE_REGIME.map((c) => regimeDe(c.chemin.split('?')[0] ?? '')));
		for (const r of REGIMES) {
			expect(atteints.has(r.regime)).toBe(true);
		}
		/* Et chaque préfixe est atteint par au moins un cas : sans cela, une ligne
		   pourrait viser un chemin que rien n'emprunte. */
		for (const r of REGIMES) {
			const exerce = CAS_DE_REGIME.some(
				(c) => c.chemin === r.prefixe || c.chemin.startsWith(`${r.prefixe}/`)
			);
			expect(exerce, `préfixe non exercé : ${r.prefixe}`).toBe(true);
		}
	});
});

describe('?suite= — « une valeur externe est ignorée et remplacée par / » (:329)', () => {
	it('garde un chemin absolu interne', () => {
		expect(suiteInterne('/notes/une-note')).toBe('/notes/une-note');
		expect(suiteInterne('/console/comptes?onglet=identite')).toBe(
			'/console/comptes?onglet=identite'
		);
	});

	it('remplace une adresse externe, sans jamais refuser', () => {
		expect(suiteInterne('https://exemple.fr/piege')).toBe('/');
		expect(suiteInterne('//exemple.fr/piege')).toBe('/');
		expect(suiteInterne('http://127.0.0.1/interne')).toBe('/');
	});

	it('remplace les formes qu’un agent normaliserait', () => {
		expect(suiteInterne('/\\exemple.fr')).toBe('/');
		expect(suiteInterne('/notes/\0nul')).toBe('/');
		expect(suiteInterne('/notes/\nsaut')).toBe('/');
	});

	it('remplace l’absence de valeur', () => {
		expect(suiteInterne(null)).toBe('/');
		expect(suiteInterne(undefined)).toBe('/');
		expect(suiteInterne('')).toBe('/');
		expect(suiteInterne('notes/relative')).toBe('/');
	});
});

describe('les quatre lignes de la table de §5.2', () => {
	it('route protégée sans session → 302 vers ?motif=page-protegee&suite={chemin}', () => {
		expect(adresseDeConnexion(MOTIF.protegee, '/console/comptes')).toBe(
			'/connexion?motif=page-protegee&suite=%2Fconsole%2Fcomptes'
		);
	});

	it('session expirée → 302 vers ?motif=session-expiree&suite={chemin}', () => {
		expect(adresseDeConnexion(MOTIF.expiree, '/importer')).toBe(
			'/connexion?motif=session-expiree&suite=%2Fimporter'
		);
	});

	it('un chemin externe glissé dans la redirection est remplacé par /', () => {
		expect(adresseDeConnexion(MOTIF.protegee, '//exemple.fr')).toBe(
			'/connexion?motif=page-protegee&suite=%2F'
		);
	});

	it('après connexion → {suite} si présent, sinon /', () => {
		expect(cibleApresConnexion('/notes/une-note')).toBe('/notes/une-note');
		expect(cibleApresConnexion(null)).toBe('/');
		expect(cibleApresConnexion('https://exemple.fr')).toBe('/');
	});

	it('après déconnexion → / , jamais une page d’erreur (RG-ACC-02)', () => {
		expect(CIBLE_APRES_DECONNEXION).toBe('/');
	});
});

describe('?motif= → les trois positions de la planche V-05 (:286)', () => {
	it('les trois valeurs déclarées', () => {
		expect(arriveeDepuisMotif('page-protegee')).toBe('protegee');
		expect(arriveeDepuisMotif('session-expiree')).toBe('expiree');
		expect(arriveeDepuisMotif(null)).toBe('directe');
	});

	it('une valeur inconnue vaut absence — la planche n’a que trois positions', () => {
		expect(arriveeDepuisMotif('autre-chose')).toBe('directe');
		expect(arriveeDepuisMotif('')).toBe('directe');
	});
});

/**
 * LA GARDE DU MOT DE PASSE POSÉ PAR L'ADMINISTRATION.
 *
 * LES CHEMINS SONT PRODUITS PAR UNE `URL`, JAMAIS ÉCRITS À LA MAIN. C'est ce que
 * `src/hooks.server.ts` passe à la fonction — la propriété de chemin de
 * `event.url` —, et un chemin recopié à la main partagerait avec la fonction
 * l'hypothèse qu'on veut justement éprouver : que la requête arrive sans sa
 * chaîne de recherche, et déjà normalisée.
 */
function cheminServi(adresse: string): string {
	return new URL(adresse, 'https://interne.test').pathname;
}

describe('versLeChangementDeMotDePasse — ce qui passe, et ce qui est renvoyé', () => {
	it('laisse passer le profil, ses actions et ses données', () => {
		expect(versLeChangementDeMotDePasse(cheminServi('/mon-profil'))).toBe(false);
		expect(versLeChangementDeMotDePasse(cheminServi('/mon-profil?onglet=securite'))).toBe(false);
		expect(versLeChangementDeMotDePasse(cheminServi('/mon-profil/donnees.json'))).toBe(false);
	});

	it('laisse toujours partir — RG-ACC-02', () => {
		expect(versLeChangementDeMotDePasse(cheminServi('/deconnexion'))).toBe(false);
	});

	it("renvoie tout le reste, l'espace public compris", () => {
		for (const adresse of [
			'/',
			'/recherche?q=serveur',
			'/console/comptes',
			'/notes/restaurer-une-sauvegarde-postgresql',
			'/univers/production/infrastructure',
			'/importer'
		]) {
			expect(versLeChangementDeMotDePasse(cheminServi(adresse))).toBe(true);
		}
	});

	it('mène à un chemin que la garde laisse passer — aucune boucle', () => {
		expect(versLeChangementDeMotDePasse(cheminServi(CIBLE_DE_CHANGEMENT_DE_MOT_DE_PASSE))).toBe(
			false
		);
	});
});
