/**
 * Batterie 15 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * La batterie 15 rend un chiffre PAR NATURE et PAR EXIGENCE. Ce chiffre décide
 * de qui doit agir : un lot de vue pour un portage, le commanditaire par un
 * regel pour un gel. Une erreur silencieuse du classement produirait un rapport
 * bien formé, chiffré, et faux — le mode de défaillance RA-01 (PLAN §12).
 *
 * Quatre familles d'unitaires, dans l'ordre de ce qu'elles protègent.
 *
 *   1. LA CLÉ DE RAPPROCHEMENT, DANS LES DEUX SENS. C'est la leçon
 *      d'ÉCART-041, et c'est la plus importante : une jointure produit deux
 *      fautes symétriques, et il faut prouver qu'elle ne commet ni l'une ni
 *      l'autre. Un cas qui DOIT se rapprocher malgré un texte différent ; un
 *      cas qui NE DOIT PAS se rapprocher malgré une règle identique.
 *   2. LA MESURE DES ADRESSES. `attr(href)` dans `content` ne se lit pas dans
 *      `textContent` : la décision « le lien porte-t-il une adresse » et la
 *      décision « l'adresse est-elle restituée » sont figées ici.
 *   3. LA DÉRIVATION DES RÈGLES depuis un relevé — la fonction qui transforme
 *      des faits de page en constats, sans navigateur.
 *   4. LA NON-DIVERGENCE DU CATALOGUE ET DU CODE. Une règle que le catalogue
 *      ignore est une règle dont personne ne saura qu'elle a parlé, et le
 *      rapport annoncerait une couverture qu'il n'a pas.
 *
 * Ce que ces unitaires NE font PAS : éprouver les sondes ni le relevé de page.
 * Ils s'exécutent dans un navigateur, et `vitest.config.ts` est en
 * environnement `node`. Ils sont éprouvés de bout en bout par
 * `node verif/impression.mjs --sonde=…`, six genres, code retour inversé.
 */
import { describe, it, expect } from 'vitest';
import {
	CATALOGUE_CONSTATS,
	CATALOGUE_DEFAUTS,
	CATALOGUE_INSTRUMENT,
	FAMILLES,
	HORS_REGLE,
	NON_COUVERTURE,
	PERIMETRE,
	VUES_MESUREES,
	VUES_OPPOSABLES,
	adresseRestituee,
	agreger,
	classer,
	cleDe,
	eprouverLesFamilles,
	estConstat,
	estDefaut,
	estInstrument,
	famillesHorsGelDe,
	famillesPour,
	jumelages,
	porteUneAdresse,
	verdictDuCouple,
	constatsDuReleve
} from './impression-regles.mjs';

/* Un constat de navigation, paramétré — le modèle de ce que la page rend. */
const nav = (ordinal: number, signature: string) => ({
	regle: 'impression:navigation-imprimee',
	exigence: 'navigation',
	famille: '.rail',
	ordinal,
	signature,
	detail: ''
});

describe('la clé de rapprochement — ÉCART-041, dans les deux sens', () => {
	it('RAPPROCHE deux constats que seul le texte distingue — P-8, le faux portage', () => {
		/* Le compilateur Svelte élague les nœuds de texte blancs : la signature
		   diffère d'un côté à l'autre sans qu'aucun défaut ne diffère. Une clé
		   qui embarquerait du texte rendrait ici 1 portage + 1 gel-non-reporté ;
		   c'est exactement ce qui a produit les 31 faux défauts. */
		const gel = [nav(0, 'aside.rail')];
		const app = [nav(0, 'aside.rail')];
		app[0].signature = 'aside.rail'; // même nœud, texte intérieur différent
		gel[0].detail = 'Production ›Infrastructure›';
		app[0].detail = 'Production › Infrastructure ›';
		expect(cleDe(gel[0])).toBe(cleDe(app[0]));
		const lignes = classer(gel, app);
		expect(lignes).toHaveLength(1);
		expect(lignes[0].nature).toBe('gel');
		expect(agreger(lignes)).toMatchObject({ gel: 1, portage: 0, 'gel-non-reporte': 0 });
	});

	it('DISTINGUE deux constats de même règle sur des ordinaux différents', () => {
		/* L'autre faute symétrique : sur-rapprocher masque un défaut réel. Deux
		   nœuds différents de la même famille ne sont pas le même défaut. */
		const lignes = classer([nav(0, 'aside.rail')], [nav(1, 'aside.rail')]);
		expect(agreger(lignes)).toMatchObject({ gel: 0, portage: 1, 'gel-non-reporte': 1 });
	});

	it('DISTINGUE deux familles de même exigence sur le même ordinal', () => {
		const g = { ...nav(0, 'aside.rail'), famille: '.rail' };
		const a = { ...nav(0, 'nav.fil'), famille: 'rôle « navigation »' };
		expect(cleDe(g)).not.toBe(cleDe(a));
		expect(agreger(classer([g], [a]))).toMatchObject({ gel: 0, portage: 1, 'gel-non-reporte': 1 });
	});

	it('n’embarque AUCUN texte : ni signature, ni détail', () => {
		const a = { ...nav(0, 'aside.rail'), detail: 'ceci est un texte' };
		const b = { ...nav(0, 'section.autre'), detail: 'cela en est un autre' };
		expect(cleDe(a)).toBe(cleDe(b));
	});

	it('DISTINGUE deux adresses, et deux occurrences de la même adresse', () => {
		const lien = (href: string, ordinal: number) => ({
			regle: 'impression:adresse-non-restituee',
			exigence: 'adresses',
			href,
			ordinal,
			signature: 'a.lien-ext',
			detail: ''
		});
		expect(cleDe(lien('https://a.fr', 0))).not.toBe(cleDe(lien('https://b.fr', 0)));
		expect(cleDe(lien('https://a.fr', 0))).not.toBe(cleDe(lien('https://a.fr', 1)));
		expect(cleDe(lien('https://a.fr', 0))).toBe(cleDe(lien('https://a.fr', 0)));
	});

	it('compte en MULTI-ENSEMBLE : trois d’un côté, un de l’autre', () => {
		const g = [nav(0, 'a'), nav(0, 'a'), nav(0, 'a')];
		const a = [nav(0, 'a')];
		expect(agreger(classer(g, a))).toMatchObject({ gel: 1, 'gel-non-reporte': 2, portage: 0 });
	});
});

describe('le témoin d’ÉCART-041 — le jumelage', () => {
	it('nomme un portage systématiquement jumelé d’un gel-non-reporté', () => {
		const lignes = classer([nav(0, 'a')], [nav(1, 'a')]);
		const j = jumelages(lignes);
		expect(j).toMatchObject({ portage: 1, jumeles: 1 });
	});

	it('ne jumelle pas un portage isolé', () => {
		const lignes = classer([], [nav(0, 'a')]);
		expect(jumelages(lignes)).toMatchObject({ portage: 1, jumeles: 0 });
	});
});

describe('les adresses — le piège de mesure de RG-M18-17', () => {
	it('« # » et une ancre interne ne portent pas d’adresse', () => {
		expect(porteUneAdresse('#')).toBe(false);
		expect(porteUneAdresse('#article')).toBe(false);
		expect(porteUneAdresse('')).toBe(false);
		expect(porteUneAdresse('   ')).toBe(false);
		expect(porteUneAdresse(null as unknown as string)).toBe(false);
	});

	it('une adresse absolue et un chemin en portent une', () => {
		expect(porteUneAdresse('https://docs.pgbarman.org')).toBe(true);
		expect(porteUneAdresse('/notes/n-restaurer-pg')).toBe(true);
	});

	it('l’adresse est restituée quand le CONTENU ENGENDRÉ la contient', () => {
		expect(adresseRestituee('https://docs.pgbarman.org', ' (https://docs.pgbarman.org)')).toBe(
			true
		);
	});

	it('le contenu d’écran ne restitue PAS l’adresse — c’est le défaut visé', () => {
		expect(adresseRestituee('https://docs.pgbarman.org', ' ↗')).toBe(false);
		expect(adresseRestituee('https://docs.pgbarman.org', '')).toBe(false);
	});

	it('un lien sans adresse n’a rien à restituer : jamais un défaut', () => {
		expect(adresseRestituee('#', '')).toBe(true);
		expect(adresseRestituee('#', ' [note interne]')).toBe(true);
	});
});

describe('la dérivation des règles depuis un relevé', () => {
	const releveNu = (patch: Record<string, unknown> = {}) => ({
		familles: [],
		horsRegle: [],
		articles: 1,
		titres: 1,
		lecture: true,
		liens: [],
		liensExamines: 0,
		ajustementJauge: 'exact',
		reglesPage: 0,
		blocsMediaPrint: 1,
		...patch
	});

	it('un élément de navigation imprimé fait un défaut par ordinal', () => {
		const c = constatsDuReleve(
			releveNu({
				familles: [
					{
						famille: '.rail',
						exigence: 'navigation',
						partie: null,
						sens: 'absent',
						total: 2,
						rendus: [0, 1],
						signatures: { 0: 'aside.rail', 1: 'aside.rail' }
					}
				]
			}),
			'V-14'
		);
		expect(c.filter((x) => x.regle === 'impression:navigation-imprimee')).toHaveLength(2);
		expect(c[0].ordinal).toBe(0);
	});

	it('un panneau imprimé porte la règle des PANNEAUX, pas celle de la navigation', () => {
		const c = constatsDuReleve(
			releveNu({
				familles: [
					{
						famille: '.panneaux',
						exigence: 'panneaux',
						partie: null,
						sens: 'absent',
						total: 1,
						rendus: [0],
						signatures: { 0: 'aside.panneaux' }
					}
				]
			}),
			'V-14'
		);
		expect(c.map((x) => x.regle)).toContain('impression:panneau-imprime');
		expect(c.map((x) => x.regle)).not.toContain('impression:navigation-imprimee');
	});

	it('une métadonnée absente n’est un défaut QUE si la lecture est imprimée', () => {
		const famille = {
			famille: 'date de vérification',
			exigence: 'metadonnees',
			partie: 'date',
			sens: 'present',
			total: 1,
			rendus: [],
			signatures: {}
		};
		const lue = constatsDuReleve(releveNu({ familles: [famille], lecture: true }), 'V-14');
		expect(lue.map((x) => x.regle)).toContain('impression:metadonnee-absente');

		const nonLue = constatsDuReleve(
			releveNu({ familles: [famille], lecture: false, articles: 1, titres: 0 }),
			'V-14'
		);
		expect(nonLue.map((x) => x.regle)).not.toContain('impression:metadonnee-absente');
		expect(nonLue.map((x) => x.regle)).toContain('constat:lecture-non-imprimee');
	});

	it('un lien sans adresse rend un CONSTAT, jamais un défaut', () => {
		const c = constatsDuReleve(
			releveNu({ liens: [{ href: '#', genere: ' [note interne]', signature: 'a.lien-int' }] }),
			'V-14'
		);
		expect(c.map((x) => x.regle)).toEqual(['constat:lien-sans-adresse']);
	});

	it('un lien dont l’adresse n’est pas restituée rend un DÉFAUT', () => {
		const c = constatsDuReleve(
			releveNu({ liens: [{ href: 'https://x.fr', genere: ' ↗', signature: 'a.lien-ext' }] }),
			'V-14'
		);
		expect(c.map((x) => x.regle)).toEqual(['impression:adresse-non-restituee']);
	});

	it('deux liens de même adresse reçoivent des rangs distincts', () => {
		const l = { href: 'https://x.fr', genere: ' ↗', signature: 'a.lien-ext' };
		const c = constatsDuReleve(releveNu({ liens: [l, { ...l }] }), 'V-14');
		expect(c.map((x) => x.ordinal)).toEqual([0, 1]);
		expect(cleDe(c[0])).not.toBe(cleDe(c[1]));
	});

	it('V-03 reçoit le constat « métadonnée non portée », V-14 non', () => {
		const v03 = constatsDuReleve(releveNu(), 'V-03').map((x) => x.regle);
		const v14 = constatsDuReleve(releveNu(), 'V-14').map((x) => x.regle);
		expect(v03).toContain('constat:metadonnee-non-portee');
		expect(v14).not.toContain('constat:metadonnee-non-portee');
	});

	it('une jauge sans `print-color-adjust: exact` rend un constat', () => {
		expect(
			constatsDuReleve(releveNu({ ajustementJauge: 'economy' }), 'V-14').map((x) => x.regle)
		).toContain('constat:jauge-sans-adjustement-couleur');
		expect(
			constatsDuReleve(releveNu({ ajustementJauge: 'exact' }), 'V-14').map((x) => x.regle)
		).not.toContain('constat:jauge-sans-adjustement-couleur');
		/* Aucune jauge dans le document : rien à relever, et surtout pas un
		   constat qui laisserait croire qu'on a regardé. */
		expect(
			constatsDuReleve(releveNu({ ajustementJauge: null }), 'V-14').map((x) => x.regle)
		).not.toContain('constat:jauge-sans-adjustement-couleur');
	});
});

describe('le verdict et l’agrégation', () => {
	it('un instrument prime sur tout, un portage sur un gel', () => {
		expect(verdictDuCouple({ instrument: 1, portage: 9, gel: 9 })).toBe('instrument');
		expect(verdictDuCouple({ instrument: 0, portage: 1, gel: 9 })).toBe('portage');
		expect(verdictDuCouple({ instrument: 0, portage: 0, gel: 1 })).toBe('gel');
		expect(verdictDuCouple({ instrument: 0, portage: 0, gel: 0 })).toBe('conforme');
	});

	it('un constat ne compte JAMAIS dans une nature opposable', () => {
		const t = agreger([
			{ regle: 'constat:lien-sans-adresse', nature: 'gel', occurrences: 40 },
			{ regle: 'impression:navigation-imprimee', nature: 'gel', occurrences: 1 }
		]);
		expect(t).toMatchObject({ constat: 40, gel: 1 });
	});

	it('un défaut d’instrument ne compte pas non plus', () => {
		expect(
			agreger([{ regle: 'instrument:etat-inatteignable', nature: 'instrument', occurrences: 3 }])
		).toMatchObject({ instrument: 3, portage: 0, gel: 0 });
	});
});

describe('le périmètre — dérivé de docs/routes.md, jamais deviné', () => {
	it('deux vues sont opposables, une est mesurée sans l’être', () => {
		expect(VUES_OPPOSABLES).toEqual(['V-03', 'V-14']);
		expect(VUES_MESUREES).toEqual(['V-03', 'V-14', 'V-18']);
		expect(PERIMETRE.find((p) => p.vue === 'V-18')?.opposable).toBe(false);
	});

	it('chaque entrée du périmètre porte sa trace', () => {
		for (const p of PERIMETRE) expect(p.trace).toMatch(/docs\/routes\.md:\d+/);
	});

	it('la part « auteur » n’est pas opposée à V-03 — le proxy y est faux', () => {
		expect(famillesPour('V-03').map((f) => f.partie)).not.toContain('auteur');
		expect(famillesPour('V-14').map((f) => f.partie)).toContain('auteur');
		expect(famillesHorsGelDe('V-03').map((f) => f.partie)).toEqual(['auteur']);
		expect(famillesHorsGelDe('V-14')).toEqual([]);
	});
});

describe('les tables — ce qu’elles déclarent, et ce qu’elles taisent', () => {
	it('chaque famille porte une trace et un sens', () => {
		for (const f of FAMILLES) {
			expect(f.trace, f.famille).toBeTruthy();
			expect(['absent', 'present'], f.famille).toContain(f.sens);
			expect(f.selecteur, f.famille).toBeTruthy();
		}
	});

	it('les quatre exigences sont toutes représentées', () => {
		const e = new Set(FAMILLES.map((f) => f.exigence));
		expect([...e].sort()).toEqual(['metadonnees', 'navigation', 'panneaux']);
		/* La quatrième — les adresses — n'a pas de famille : elle se mesure sur
		   les LIENS, pas sur des classes. Le catalogue la porte tout de même,
		   sans quoi elle serait absente du rapport de couverture. */
		expect(CATALOGUE_DEFAUTS.map((c) => c.exigence)).toContain('adresses');
	});

	it('chaque famille écartée porte un motif circonstancié', () => {
		for (const h of HORS_REGLE) {
			expect(h.motif.length, h.famille).toBeGreaterThan(60);
			expect(h.selecteur, h.famille).toBeTruthy();
		}
	});

	it('deux filets structurels au moins, un par exigence d’absence', () => {
		const s = FAMILLES.filter((f) => f.structurel);
		expect(s.map((f) => f.exigence).sort()).toEqual(['navigation', 'panneaux']);
	});

	it('`eprouverLesFamilles` REFUSE une table qu’aucune classe ne satisfait', () => {
		expect(eprouverLesFamilles([])).not.toHaveLength(0);
	});

	it('`eprouverLesFamilles` accepte la table sur les classes qu’elle nomme', () => {
		const classes = [
			'rail',
			'barre',
			'fil',
			'fil-pub',
			'chapeau',
			'pied-public',
			'sommaire',
			'saut-contenu',
			'panneaux',
			'panneau',
			'aparte',
			'ref-panneau',
			'meta-panneau',
			'cartouche__valeur',
			'temoin__jauge',
			'cartouche__detail'
		];
		expect(eprouverLesFamilles(classes)).toEqual([]);
	});

	it('une famille structurelle est exemptée du contrôle statique', () => {
		/* Elle ne nomme aucune classe : son épreuve est le compte d'éléments
		   rencontrés à l'exécution, imprimé par le pilote. */
		for (const f of FAMILLES.filter((x) => x.structurel)) expect(f.classes).toBeUndefined();
	});
});

describe('la non-divergence du catalogue et du code', () => {
	const source = [
		...CATALOGUE_DEFAUTS.map((c) => c.regle),
		...CATALOGUE_CONSTATS.map((c) => c.regle),
		...CATALOGUE_INSTRUMENT.map((c) => c.regle)
	];

	it('aucune règle n’est déclarée deux fois', () => {
		expect(new Set(source).size).toBe(source.length);
	});

	it('les trois prédicats partitionnent le catalogue', () => {
		for (const r of CATALOGUE_DEFAUTS) {
			expect(estDefaut(r.regle)).toBe(true);
			expect(estConstat(r.regle)).toBe(false);
			expect(estInstrument(r.regle)).toBe(false);
		}
		for (const r of CATALOGUE_CONSTATS) expect(estConstat(r.regle)).toBe(true);
		for (const r of CATALOGUE_INSTRUMENT) expect(estInstrument(r.regle)).toBe(true);
	});

	it('un défaut porte l’exigence qu’il sert', () => {
		expect(CATALOGUE_DEFAUTS.map((c) => c.exigence).sort()).toEqual([
			'adresses',
			'metadonnees',
			'navigation',
			'panneaux'
		]);
	});

	it('la non-couverture est énoncée ET chiffrable', () => {
		expect(NON_COUVERTURE.length).toBeGreaterThanOrEqual(6);
		for (const nc of NON_COUVERTURE) {
			expect(nc.sujet.length).toBeGreaterThan(60);
			expect(nc.mesure).toBeTruthy();
		}
	});
});
