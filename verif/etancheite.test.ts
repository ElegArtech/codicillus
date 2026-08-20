/**
 * Batterie 6 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `verif/etancheite.mjs` rend un verdict sur 378 cases et 91 couples. Sa
 * justesse tient dans cinq décisions minuscules, et chacune a déjà produit une
 * faute mesurée pendant l'écriture du lot :
 *
 *   1. LA CLÉ DE RAPPROCHEMENT DES DEUX CÔTÉS D'UN REFUS, éprouvée dans les
 *      DEUX SENS. Un cas qui DOIT se rapprocher — deux 404 dont seule l'adresse
 *      demandée diffère, ce que `docs/routes.md:163` autorise nommément : « les
 *      cas inexistante et hors de vos droits sont rigoureusement identiques, À
 *      LA CHAÎNE DEMANDÉE PRÈS ». Un cas qui NE DOIT PAS — un octet de plus
 *      ailleurs dans le corps, ou un code différent.
 *   2. LA PROFONDEUR DE L'ADRESSE EST DANS LA FORME, PAS DANS LA CLÉ. La page
 *      d'erreur lie ses ressources en chemin relatif : une adresse plus
 *      profonde d'un cran rend un corps plus long d'un `../`. Sept faux
 *      « couples discernables » ont été fabriqués ainsi, et la parade est de
 *      construire le côté inexistant à la MÊME profondeur — jamais d'affaiblir
 *      la clé. C'est `ECART-041` évité : une clé mal choisie y avait fabriqué
 *      31 faux défauts sur 31.
 *   3. L'ATTENDU NE VIENT PAS DU CANDIDAT. Les deux tables sont extraites de
 *      `docs/routes.md` ; aucune n'est lue dans `src/lib/auth/garde.ts`, qui est
 *      l'objet de la mesure. Un test l'affirme sur le texte réel du dépôt.
 *   4. LA TABLE REFUSE PLUTÔT QUE DE DEVINER. Une cellule qu'aucune règle ne
 *      classe, une famille qu'aucune route ne satisfait, un niveau qu'aucune
 *      route n'exige : `code 2`, jamais vert.
 *   5. LE PLANCHER DE BRUIT SE MESURE SUR LE TÉMOIN. Le prendre sur les séries
 *      mesurées le fait enfler avec l'effet qu'il devrait détecter : mesuré,
 *      11,125 ms de plancher pour 11,157 ms d'écart, un verdict à 32 µs.
 */
import { describe, expect, it } from 'vitest';
import {
	HORS_MATRICE,
	NIVEAUX,
	PERSONAS,
	attenduDe,
	cleDeRapprochement,
	ecartInterquartile,
	famillesDuRefus,
	formeDeCellule,
	masquerLAdresse,
	mediane,
	niveauDeCellule,
	niveauxParRoute,
	prefixeLitteral,
	quantile,
	rapprocher,
	recouper,
	satisfait,
	texteDesRoutes,
	verdictTemporel
} from './etancheite-attendu.mjs';
import { routesDuDepot } from './menus.mjs';

const texte = texteDesRoutes();
const routes = routesDuDepot(texte);
const { familles, refus: refusFamilles } = famillesDuRefus(texte);
const { niveaux, refus: refusNiveaux } = niveauxParRoute(texte);
const rapprochement = rapprocher(routes, familles);

/** Une réponse minimale, pour éprouver la clé. */
function reponse(status: number, corps: string, entetes: Record<string, string> = {}) {
	return { status, corps, entetes };
}

describe('les deux tables sont lues à la source, et la source est reconnue', () => {
	it('extrait les 39 routes du §3 et leur niveau d’accès à chacune', () => {
		expect(routes).toHaveLength(39);
		expect(niveaux.size).toBe(39);
		expect(refusNiveaux).toEqual([]);
	});

	it('extrait les 11 familles du §5.5, quatre colonnes classées chacune', () => {
		expect(familles).toHaveLength(11);
		expect(refusFamilles).toEqual([]);
		for (const f of familles) {
			for (const colonne of ['anonyme', 'sansDroit', 'avecDroit', 'administrateur']) {
				expect(f.formes[colonne]).not.toBeNull();
			}
		}
	});

	it('rapproche chaque route d’une famille ou d’une déclaration hors matrice', () => {
		expect(rapprochement.refus).toEqual([]);
		for (const route of routes) {
			const couverte =
				rapprochement.parRoute.has(route) || HORS_MATRICE.some((h) => h.route === route);
			expect(couverte, route).toBe(true);
		}
	});

	it('recoupe §3 et §5.5 sans divergence — la console à l’administrateur seul', () => {
		expect(recouper(familles, niveaux)).toEqual([]);
	});

	it('porte ARB-052 : les six chemins fixes redirigent en anonyme', () => {
		const fixes = ['/importer', '/mon-profil', '/console', '/bibliotheque', '/cartographie'];
		for (const prefixe of fixes) {
			const f = familles.find((x) => x.prefixes.includes(prefixe));
			expect(f?.formes['anonyme'], prefixe).toBe('redirection');
		}
	});
});

describe('la table refuse plutôt que de deviner', () => {
	it('ne classe pas une cellule de niveau inconnue', () => {
		expect(niveauDeCellule('sur invitation du service juridique')).toBeNull();
		expect(niveauDeCellule('connecté + lecteur')).toBe('lecteur');
		expect(niveauDeCellule('connecté + rédacteur')).toBe('redacteur');
		/* Le cas de V-19, et il ne doit PAS devenir « administrateur » : §5.5 sert
		   la cartographie au connecté sans droit, en périmètre rabattu. */
		expect(niveauDeCellule('connecté ; périmètre global : administrateur ou profil habilité')).toBe(
			'connecte'
		);
	});

	it('ne classe pas une cellule de matrice qui ne nomme rien', () => {
		expect(formeDeCellule('à voir plus tard')).toBeNull();
		expect(formeDeCellule('**404 V-04**')).toBe('refus-404');
		expect(formeDeCellule('**302 → `/connexion?motif=page-protegee`**')).toBe('redirection');
		expect(formeDeCellule('V-14…')).toBe('servi');
		expect(formeDeCellule('périmètre rabattu (RG-M09-02)')).toBe('servi');
		expect(formeDeCellule('idem')).toBe('idem');
	});

	it('refuse une famille qu’aucune route ne satisfait, et une route sans famille', () => {
		const inventee = [
			{
				motifs: ['/tresorerie/…'],
				prefixes: ['/tresorerie'],
				libelle: '`/tresorerie/…`',
				cellules: {},
				formes: {
					anonyme: 'refus-404',
					sansDroit: 'refus-404',
					avecDroit: 'servi',
					administrateur: 'servi'
				}
			}
		];
		expect(rapprocher(['/notes/{identifiant}'], inventee).refus.join(' ')).toMatch(/tresorerie/);
		expect(rapprocher(['/notes/{identifiant}'], inventee).refus.join(' ')).toMatch(
			/aucune famille/
		);
	});

	it('refuse une redirection dans une colonne connectée — la règle de combinaison tomberait', () => {
		const abimee = familles.map((f) =>
			f.prefixes.includes('/notes')
				? { ...f, formes: { ...f.formes, sansDroit: 'redirection' } }
				: f
		);
		expect(recouper(abimee, niveaux).join(' ')).toMatch(/colonne connectée/);
	});

	it('refuse un niveau qu’aucune route n’exige — P-5, la règle inerte', () => {
		const sansRedacteur = new Map(
			[...niveaux].map(([r, n]) => [r, n === 'redacteur' ? 'lecteur' : n])
		);
		expect(recouper(familles, sansRedacteur).join(' ')).toMatch(/redacteur.*inerte/);
	});

	it('n’admet que les cinq niveaux nommés', () => {
		expect([...new Set(niveaux.values())].every((n) => NIVEAUX.includes(n))).toBe(true);
	});
});

describe('la clé de rapprochement, éprouvée dans les deux sens', () => {
	const bref = '<h1>Page introuvable</h1><p>Adresse demandée : ';

	it('RAPPROCHE deux refus qui ne diffèrent que par la chaîne demandée', () => {
		/* `docs/routes.md:163` : « rigoureusement identiques, à la chaîne demandée
		   près (V-26:2628) ». C'est le cas qui DOIT se rapprocher. */
		const a = cleDeRapprochement(
			reponse(404, `${bref}/notes/restaurer-une-sauvegarde</p>`),
			'/notes/restaurer-une-sauvegarde'
		);
		const b = cleDeRapprochement(
			reponse(404, `${bref}/notes/ceci-nexiste-pas</p>`),
			'/notes/ceci-nexiste-pas'
		);
		expect(a).toBe(b);
	});

	it('RAPPROCHE deux refus dont l’adresse revient encodée dans un en-tête', () => {
		const a = cleDeRapprochement(
			reponse(302, '', { location: '/connexion?motif=page-protegee&suite=%2Fconsole%2Fexports' }),
			'/console/exports'
		);
		const b = cleDeRapprochement(
			reponse(302, '', { location: '/connexion?motif=page-protegee&suite=%2Fconsole%2Fimports' }),
			'/console/imports'
		);
		expect(a).toBe(b);
	});

	it('NE RAPPROCHE PAS un octet de plus ailleurs dans le corps', () => {
		const a = cleDeRapprochement(reponse(404, `${bref}/notes/aaa</p>`), '/notes/aaa');
		const b = cleDeRapprochement(reponse(404, `${bref}/notes/bbb</p> `), '/notes/bbb');
		expect(a).not.toBe(b);
	});

	it('NE RAPPROCHE PAS deux codes différents', () => {
		const a = cleDeRapprochement(reponse(404, `${bref}/notes/aaa</p>`), '/notes/aaa');
		const b = cleDeRapprochement(reponse(403, `${bref}/notes/aaa</p>`), '/notes/aaa');
		expect(a).not.toBe(b);
	});

	it('NE RAPPROCHE PAS un en-tête qui révèle la nature du refus', () => {
		const a = cleDeRapprochement(reponse(404, 'vide', {}), '/notes/aaa');
		const b = cleDeRapprochement(reponse(404, 'vide', { 'x-raison': 'interdit' }), '/notes/aaa');
		expect(a).not.toBe(b);
	});

	it('ignore les en-têtes volatils, qui ne portent rien du corpus', () => {
		const a = cleDeRapprochement(reponse(404, 'vide', { date: 'lundi' }), '/x');
		const b = cleDeRapprochement(reponse(404, 'vide', { date: 'mardi' }), '/x');
		expect(a).toBe(b);
	});

	it('NE MASQUE PAS un mot du corpus qui n’est pas dans l’adresse demandée', () => {
		/* Le masquage ne doit pas devenir un aveuglement : seul ce que le client a
		   lui-même envoyé est masqué. Une fuite de titre reste visible. */
		const masque = masquerLAdresse('note : Restaurer une sauvegarde', '/notes/autre-chose');
		expect(masque).toContain('Restaurer une sauvegarde');
	});

	it('masque l’adresse sous ses trois formes — brute, encodée, et par segment', () => {
		const masque = masquerLAdresse(
			'/univers/production a %2Funivers%2Fproduction et production',
			'/univers/production'
		);
		expect(masque).not.toContain('production');
	});
});

describe('le niveau exigé et le persona qui le satisfait', () => {
	const par = (nom: string) => {
		const p = PERSONAS.find((x) => x.nom === nom);
		if (p === undefined) throw new Error(nom);
		return p;
	};

	it('l’administrateur satisfait tout — RG-DRO-03', () => {
		for (const niveau of NIVEAUX) expect(satisfait(par('administrateur'), niveau)).toBe(true);
	});

	it('l’anonyme ne satisfait que le niveau public', () => {
		expect(satisfait(par('anonyme'), 'publique')).toBe(true);
		for (const niveau of ['connecte', 'lecteur', 'redacteur', 'administrateur']) {
			expect(satisfait(par('anonyme'), niveau)).toBe(false);
		}
	});

	it('les droits s’emboîtent — lecteur ⊂ rédacteur ⊂ gestionnaire (CDC §2.3)', () => {
		expect(satisfait(par('lecteur'), 'lecteur')).toBe(true);
		expect(satisfait(par('lecteur'), 'redacteur')).toBe(false);
		expect(satisfait(par('redacteur'), 'lecteur')).toBe(true);
		expect(satisfait(par('gestionnaire'), 'redacteur')).toBe(true);
		expect(satisfait(par('gestionnaire'), 'administrateur')).toBe(false);
	});

	it('le compte désactivé est traité comme un anonyme — RG-M14-08', () => {
		expect(par('compte-desactive').colonne).toBe('anonyme');
		expect(satisfait(par('compte-desactive'), 'connecte')).toBe(false);
	});

	it('un lecteur n’entre pas dans /importer, qui exige la rédaction', () => {
		const attendu = attenduDe('/importer', par('lecteur'), rapprochement, familles, niveaux);
		expect(attendu.forme).toBe('refus-404');
		const rédacteur = attenduDe('/importer', par('redacteur'), rapprochement, familles, niveaux);
		expect(rédacteur.forme).toBe('servi');
	});

	it('la console n’est servie qu’à l’administrateur, et redirige l’anonyme', () => {
		expect(
			attenduDe('/console/comptes', par('anonyme'), rapprochement, familles, niveaux).forme
		).toBe('redirection');
		expect(
			attenduDe('/console/comptes', par('gestionnaire'), rapprochement, familles, niveaux).forme
		).toBe('refus-404');
		expect(
			attenduDe('/console/comptes', par('administrateur'), rapprochement, familles, niveaux).forme
		).toBe('servi');
	});

	it('une adresse de ressource ne redirige JAMAIS, pour aucun persona — ARB-052', () => {
		for (const route of routes.filter((r) => r.startsWith('/notes') || r.startsWith('/univers'))) {
			for (const persona of PERSONAS) {
				const attendu = attenduDe(route, persona, rapprochement, familles, niveaux);
				expect(attendu.forme, `${route} · ${persona.nom}`).not.toBe('redirection');
			}
		}
	});

	it('le préfixe littéral d’un motif s’arrête au premier paramètre', () => {
		expect(prefixeLitteral('/notes/{identifiant}')).toBe('/notes');
		expect(prefixeLitteral('/console/…')).toBe('/console');
		expect(prefixeLitteral('/')).toBe('/');
		expect(prefixeLitteral('/mon-profil')).toBe('/mon-profil');
	});
});

describe('la mesure temporelle, et ses trois issues', () => {
	/** Une série régulière, dispersion connue. */
	const serie = (centre: number, n = 40) =>
		Array.from({ length: n }, (_, i) => centre + ((i % 8) - 4) * 0.1);

	it('rend « dans le bruit » quand l’écart est sous le plancher du témoin', () => {
		const v = verdictTemporel(serie(10), serie(10.05), serie(10), serie(10));
		expect(v.issue).toBe('dans-le-bruit');
		expect(Math.abs(v.ecart)).toBeLessThan(v.plancher);
	});

	it('rend « hors du bruit » sur les deux chemins de coûts du dépôt — 11 ms', () => {
		const v = verdictTemporel(serie(14), serie(2.5), serie(2.5), serie(2.5));
		expect(v.issue).toBe('hors-du-bruit');
	});

	it('REFUSE DE CONCLURE quand le témoin lui-même dépasse le plancher', () => {
		/* Le témoin est fait de deux séries du même côté : son écart vrai est nul.
		   S'il dépasse sa propre dispersion, la méthode est instable, et rendre
		   « dans le bruit » serait un faux vert. */
		const temoinA = Array.from({ length: 40 }, () => 10);
		const temoinB = Array.from({ length: 40 }, () => 30);
		const v = verdictTemporel(serie(10), serie(10), temoinA, temoinB);
		expect(v.issue).toBe('refus-de-conclure');
	});

	it('le plancher est celui du TÉMOIN, non celui des séries mesurées', () => {
		/* La faute évitée : deux populations écartées enflent leur dispersion
		   commune, et le plancher grandit avec l'effet qu'il doit détecter. */
		const v = verdictTemporel(serie(14), serie(2.5), serie(2.5), serie(2.5));
		expect(v.plancher).toBeLessThan(1);
		expect(v.dispersionMesuree).toBeGreaterThan(10);
	});

	it('la médiane résiste au tirage aberrant, la moyenne non — T-012', () => {
		const propre = [...serie(3, 39), 28.98];
		expect(mediane(propre)).toBeLessThan(3.5);
		const moyenne = propre.reduce((s, x) => s + x, 0) / propre.length;
		expect(moyenne).toBeGreaterThan(3.5);
	});

	it('quantile et écart interquartile sur un échantillon connu', () => {
		const e = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		expect(quantile(e, 0.5)).toBe(5);
		expect(ecartInterquartile(e)).toBe(4);
	});
});
