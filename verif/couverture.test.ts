/**
 * Les unitaires de la batterie de couverture.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UN CORPUS SYNTHÉTIQUE, ET PAS LE DÉPÔT
 *
 * `P-26` — « un contrôle dont le seul cas d'épreuve est le défaut qu'il
 * trouve devient inerte en réussissant ». Cette batterie-ci naît rouge, avec
 * soixante-quatre règles que rien ne porte : le jour où elles seront portées,
 * un unitaire adossé au dépôt cesserait d'exercer quoi que ce soit SANS QUE
 * RIEN NE LE SIGNALE. Chaque cas ci-dessous construit donc son propre petit
 * dépôt dans un dossier temporaire — cahier et errata compris — et n'observe
 * jamais le vrai.
 *
 * UNE SEULE EXCEPTION, ET ELLE EST DÉLIBÉRÉE : le cas d'auto-mesure lit le
 * dépôt réel, parce que la propriété qu'il éprouve — « l'instrument ne cite
 * aucun numéro » — porte précisément sur les fichiers du dépôt réel. Il ne
 * peut pas devenir inerte : il redevient rouge dès qu'un numéro est écrit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUN NUMÉRO N'EST ÉCRIT ICI EN TOUTES LETTRES
 *
 * L'instrument lit `verif/`, donc il lit ce fichier, donc tout numéro écrit
 * ici passerait « contrôlé » sans qu'aucun contrôle n'existe. Les numéros
 * sont composés depuis leur famille et leur rang — `P-20`, `P-9`, `P-17`,
 * `P-23`, `P-27` : décrire une forme, ne jamais la citer.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS MÉCANISMES DE `P-5`
 *
 * Un crible qui lit des numéros dans du texte les rencontre sous trois
 * formes, et n'en compte que deux. Les trois sont éprouvées ici — y compris
 * celle qu'il NE compte PAS, sans quoi la limite serait une affirmation
 * d'en-tête et rien d'autre.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	numeroDeRegle,
	familleDe,
	numerosDUneLigne,
	nomsPortantUnNumero,
	referentielDesRegles,
	perimetres,
	citationsDe,
	fusionner,
	confronter,
	lireLaMorsure,
	autoCitations,
	SONDES,
	ORDRE_DES_MODULES,
	MES_FICHIERS,
	racine,
	principal,
	estUnTest,
	type Corpus
} from './couverture.mjs';

/* Des familles et des rangs qui n'existent nulle part au cahier : le corpus
   de laboratoire est clos sur lui-même, et rien de ce qu'il affirme ne dépend
   de l'état du vrai dépôt. */
const LAB = 'LAB';
const rg = (rang: string) => numeroDeRegle(LAB, rang);

const PORTEE = rg('01'); // définie, citée par du code
const ORPHELINE = rg('02'); // définie, citée nulle part
const CONTROLEE_SEULE = rg('03'); // définie, citée par un test seulement
const DE_L_ERRATA = rg('04'); // définie par l'errata, pas par le cahier
const INVENTEE = rg('05'); // citée par du code, définie nulle part
const EXEMPTEE = rg('06'); // citée par du code ET par un registre d'absence
const DANS_UN_NOM = rg('07'); // portée par le NOM d'un fichier, et rien d'autre

let labo: string;

beforeAll(() => {
	labo = mkdtempSync(join(tmpdir(), 'couverture-'));
	const ecrire = (chemin: string, texte: string) => {
		const complet = join(labo, chemin);
		mkdirSync(join(complet, '..'), { recursive: true });
		writeFileSync(complet, texte);
	};

	/* LE CAHIER — quatre définitions en chapeau de ligne, et une CITATION en
	   milieu de phrase qui ne doit RIEN définir. Sans cette dernière, le cas
	   qui distingue définition et citation n'existerait pas, et le crible
	   compterait au dépôt réel 162 règles au lieu de 153. */
	ecrire(
		'cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md',
		[
			`**${PORTEE}** — la règle que du code cite.`,
			'',
			`**${ORPHELINE}** — la règle que personne ne nomme.`,
			'',
			`**${CONTROLEE_SEULE}** — la règle qu'un seul unitaire nomme.`,
			'',
			`**${EXEMPTEE}** — définie ici, pour que le cas d'exemption porte sur autre chose.`,
			'',
			`| P-01 | un principe qui CITE ${PORTEE} sans le définir |`,
			`Une phrase quelconque qui cite ${ORPHELINE} au fil du texte.`,
			''
		].join('\n')
	);

	/* L'ERRATA — une ligne de tableau DÉFINIT, la prose CITE. */
	ecrire(
		'docs/errata-cadrage.md',
		[
			`## E-99 — \`${DE_L_ERRATA}\` n'existait pas : numérotation créée`,
			'',
			`Le plan cite \`${DE_L_ERRATA}\` ; le cahier ne le définit pas.`,
			'',
			'| Référence | Exigence |',
			'|---|---|',
			`| **${DE_L_ERRATA}** | l'exigence restée une puce non numérotée. |`,
			`| **${PORTEE}** | déjà définie au cahier — l'errata ne la redéfinit pas. |`,
			'',
			`Une phrase de prose qui cite ${INVENTEE} sans rien définir.`,
			''
		].join('\n')
	);

	/* LE PORTAGE — un numéro DANS UN COMMENTAIRE et un numéro DANS UNE CHAÎNE :
	   les deux mécanismes que le crible compte, éprouvés séparément. */
	ecrire(
		'src/lib/porteur.ts',
		[
			`// ${PORTEE} — le numéro dans un COMMENTAIRE, mécanisme du défaut fondateur.`,
			`export const message = "le numéro dans une CHAÎNE : ${DE_L_ERRATA}";`,
			''
		].join('\n')
	);
	ecrire(
		'base/migrations/001_lab.sql',
		`-- un choix justifié par un numéro qui n'existe pas : ${INVENTEE}\n`
	);
	/* Deux citations du MÊME numéro inventé : l'une dans un fichier exempté,
	   l'autre non. L'exemption est par COUPLE, jamais par fichier. */
	ecrire('seeds/lab.ts', `export const note = '${EXEMPTEE}';\n`);
	ecrire('docs/registre-d-absence.md', `Ce document SIGNALE que ${EXEMPTEE} a été inventé.\n`);

	/* LE CONTRÔLE — un fichier de test qui vit SOUS `src/`. Le partage est par
	   RÔLE, pas par dossier : ce fichier contrôle, il ne porte pas. */
	ecrire('src/lib/porteur.test.ts', `// éprouve ${CONTROLEE_SEULE} et ${PORTEE}\n`);
	ecrire('verif/lab.mjs', `/* l'instrument qui nomme ${PORTEE} */\n`);

	/* LE TROISIÈME MÉCANISME — un numéro dans le NOM d'un fichier, et rien
	   dans son contenu. Le crible ne le compte pas : le cas existe pour que la
	   limite soit éprouvée, pas seulement déclarée. */
	ecrire(`src/lib/${DANS_UN_NOM}.ts`, 'export const rien = 1;\n');
});

afterAll(() => rmSync(labo, { recursive: true, force: true }));

/* ══════════════════════════════════════════════════════════════════════ */

describe('l’extraction — les trois mécanismes de P-5, et lequel compte', () => {
	it('compte un numéro écrit DANS UN COMMENTAIRE', () => {
		expect(numerosDUneLigne(`// justifié par ${PORTEE}, voir plus bas`)).toEqual([PORTEE]);
		expect(numerosDUneLigne(`-- SQL : ${PORTEE} autorise la cascade`)).toEqual([PORTEE]);
	});

	it('compte un numéro écrit DANS UNE CHAÎNE DE CARACTÈRES', () => {
		expect(numerosDUneLigne(`console.log('  ${PORTEE} — en anonyme, rien')`)).toEqual([PORTEE]);
	});

	it('NE compte PAS un numéro porté par le seul NOM d’un fichier', () => {
		expect(citationsDe([`src/lib/${DANS_UN_NOM}.ts`], labo).size).toBe(0);
	});

	it('relève à part les noms de fichiers numérotés, pour que le trou ne soit pas muet', () => {
		expect(nomsPortantUnNumero(perimetres(labo).portage)).toEqual([`src/lib/${DANS_UN_NOM}.ts`]);
		expect(nomsPortantUnNumero(['src/lib/porteur.ts'])).toEqual([]);
	});

	it('relève plusieurs numéros sur une même ligne, dans l’ordre', () => {
		expect(numerosDUneLigne(`${PORTEE} puis ${ORPHELINE}`)).toEqual([PORTEE, ORPHELINE]);
	});

	it('n’attrape pas un préfixe sans rang, ni un rang sans préfixe', () => {
		expect(numerosDUneLigne('la famille RG-LAB, sans rang')).toEqual([]);
		expect(numerosDUneLigne('un rang nu : LAB-01')).toEqual([]);
	});

	it('lit la famille d’un numéro, chiffrée comme littérale', () => {
		expect(familleDe(numeroDeRegle('M18', '17'))).toBe('M18');
		expect(familleDe(numeroDeRegle('NF', '09'))).toBe('NF');
	});
});

describe('le référentiel — une définition n’est pas une citation', () => {
	it('retient les quatre définitions du cahier, et AUCUNE de ses citations', () => {
		const regles = referentielDesRegles(labo);
		expect(regles.get(PORTEE)).toBe('cahier');
		expect(regles.get(ORPHELINE)).toBe('cahier');
		expect(regles.get(CONTROLEE_SEULE)).toBe('cahier');
		expect(regles.get(EXEMPTEE)).toBe('cahier');
	});

	/* LE CAS QUI VAUT NEUF RÈGLES AU DÉPÔT RÉEL. Le cahier cite ses propres
	   numéros dans son tableau de principes ; un crible qui relèverait toute
	   occurrence en compterait 162 au lieu de 153. */
	it('ne définit rien depuis une citation en milieu de phrase ou de tableau', () => {
		const labo2 = mkdtempSync(join(tmpdir(), 'couverture-cit-'));
		mkdirSync(join(labo2, 'cadrage'), { recursive: true });
		writeFileSync(
			join(labo2, 'cadrage', 'CAHIER-DES-CHARGES-FONCTIONNEL.md'),
			`| P-01 | un principe qui cite ${ORPHELINE} |\nune phrase citant ${PORTEE}.\n`
		);
		expect(referentielDesRegles(labo2).size).toBe(0);
		rmSync(labo2, { recursive: true, force: true });
	});

	it('retient la LIGNE DE TABLEAU de l’errata comme définition', () => {
		expect(referentielDesRegles(labo).get(DE_L_ERRATA)).toBe('errata');
	});

	it('ne retient PAS la prose de l’errata, qui cite sans définir', () => {
		expect(referentielDesRegles(labo).has(INVENTEE)).toBe(false);
	});

	it('laisse au cahier la primauté sur l’errata pour un numéro que les deux portent', () => {
		expect(referentielDesRegles(labo).get(PORTEE)).toBe('cahier');
	});

	it('compte cinq règles au total, et pas une de plus', () => {
		expect([...referentielDesRegles(labo).keys()].sort()).toEqual(
			[PORTEE, ORPHELINE, CONTROLEE_SEULE, EXEMPTEE, DE_L_ERRATA].sort()
		);
	});
});

describe('les périmètres — le partage est par RÔLE, jamais par dossier', () => {
	it('classe un fichier de test comme CONTRÔLE, où qu’il vive', () => {
		expect(estUnTest('src/lib/porteur.test.ts')).toBe(true);
		expect(estUnTest('verif/couverture.test.ts')).toBe(true);
		expect(estUnTest('src/lib/porteur.ts')).toBe(false);
	});

	it('exclut du portage les tests qui vivent sous src, base ou seeds', () => {
		const p = perimetres(labo);
		expect(p.portage).not.toContain('src/lib/porteur.test.ts');
		expect(p.controle).toContain('src/lib/porteur.test.ts');
		expect(p.controle).toContain('verif/lab.mjs');
	});
});

describe('A et B — deux questions, deux chiffres, jamais un seul', () => {
	const lire = (): Corpus => {
		const f = perimetres(labo);
		return {
			regles: referentielDesRegles(labo),
			portage: citationsDe(f.portage, labo),
			controle: citationsDe(f.controle, labo),
			hors: new Map(),
			docs: citationsDe(f.docs, labo)
		};
	};

	it('déclare orpheline de A la règle définie que rien ne cite', () => {
		const r = confronter(lire(), []);
		expect(r.orphelinesA.map((j) => j.numero)).toContain(ORPHELINE);
	});

	/* LE CAS QUI SÉPARE LES DEUX QUESTIONS. Une règle que seul un unitaire
	   nomme est CONTRÔLÉE et NON PORTÉE : le contrôle mesure du vide. */
	it('déclare contrôlée mais NON portée la règle que seul un test nomme', () => {
		const r = confronter(lire(), []);
		const j = r.jugees.find((x) => x.numero === CONTROLEE_SEULE);
		expect(j?.portee).toBe(false);
		expect(j?.controlee).toBe(true);
	});

	it('déclare portée mais NON contrôlée la règle que seul du code nomme', () => {
		const r = confronter(lire(), []);
		const j = r.jugees.find((x) => x.numero === DE_L_ERRATA);
		expect(j?.portee).toBe(true);
		expect(j?.controlee).toBe(false);
	});

	it('compte le numéro d’un commentaire comme portage, au même titre qu’un autre', () => {
		const r = confronter(lire(), []);
		expect(r.jugees.find((x) => x.numero === PORTEE)?.portee).toBe(true);
	});

	it('regroupe par module, et range à la fin toute famille hors de l’ordre connu', () => {
		const r = confronter(lire(), []);
		expect(r.modules).toEqual([LAB]);
		expect(r.parModule.get(LAB)?.connue).toBe(false);
		expect(ORDRE_DES_MODULES).toContain('M18');
		expect(ORDRE_DES_MODULES).not.toContain(LAB);
	});

	it('nomme les orphelines module par module — c’est le livrable', () => {
		const e = confronter(lire(), []).parModule.get(LAB);
		expect(e?.orphelinesA).toContain(ORPHELINE);
		expect(e?.orphelinesA).toContain(CONTROLEE_SEULE);
		expect(e?.orphelinesA).not.toContain(PORTEE);
	});
});

describe('C — la citation d’un numéro que rien ne définit', () => {
	const lire = (): Corpus => {
		const f = perimetres(labo);
		return {
			regles: referentielDesRegles(labo),
			portage: citationsDe(f.portage, labo),
			controle: citationsDe(f.controle, labo),
			hors: new Map(),
			docs: citationsDe(f.docs, labo)
		};
	};

	it('relève un numéro que du code cite et que rien ne définit', () => {
		const r = confronter(lire(), []);
		expect(r.cCode.inventees.map((i) => i.numero)).toContain(INVENTEE);
		expect(r.cCode.inventees.find((i) => i.numero === INVENTEE)?.ou).toEqual([
			'base/migrations/001_lab.sql:1'
		]);
	});

	it('ne relève JAMAIS un numéro que le cahier ou l’errata définissent', () => {
		const r = confronter(lire(), []);
		const noms = r.cCode.inventees.map((i) => i.numero);
		expect(noms).not.toContain(PORTEE);
		expect(noms).not.toContain(DE_L_ERRATA);
	});

	/* L'EXEMPTION EST PAR COUPLE, JAMAIS PAR FICHIER. Le même numéro, cité
	   dans le fichier exempté ET ailleurs, reste rouge ailleurs. */
	it('blanchit le couple exempté, et lui seul', () => {
		const traces = [
			{ fichier: 'seeds/lab.ts', numeros: [EXEMPTEE], motif: 'registre d’absence de laboratoire' }
		];
		const corpus = lire();
		corpus.regles.delete(EXEMPTEE); // le numéro devient inventé
		corpus.portage.set(EXEMPTEE, ['seeds/lab.ts:1', 'src/lib/porteur.ts:9']);
		const r = confronter(corpus, traces);
		expect(r.cCode.documentees.find((d) => d.numero === EXEMPTEE)?.ou).toEqual(['seeds/lab.ts:1']);
		expect(r.cCode.inventees.find((i) => i.numero === EXEMPTEE)?.ou).toEqual([
			'src/lib/porteur.ts:9'
		]);
	});

	it('signale PÉRIMÉE une exemption qu’aucune citation n’exerce (P-5)', () => {
		const traces = [{ fichier: 'seeds/inexistant.ts', numeros: [EXEMPTEE], motif: 'plus exercée' }];
		const r = confronter(lire(), traces);
		expect(r.exemptionsPerimees).toEqual([{ fichier: 'seeds/inexistant.ts', numero: EXEMPTEE }]);
	});
});

describe('la fusion de deux relevés — les places s’ajoutent, elles ne s’écrasent pas', () => {
	/* Un `new Map([...a, ...b])` perdrait les places de `a` : la même citation
	   inventée ne serait signalée qu'à un seul de ses deux endroits. */
	it('concatène les places d’un numéro présent des deux côtés', () => {
		const a = new Map([[PORTEE, ['src/a.ts:1']]]);
		const b = new Map([[PORTEE, ['verif/b.mjs:2']]]);
		expect(fusionner(a, b).get(PORTEE)).toEqual(['src/a.ts:1', 'verif/b.mjs:2']);
	});
});

describe('les sondes — la morsure se lit dans le PASSAGE, jamais dans le verdict', () => {
	const corpus = (): Corpus => ({
		regles: new Map([[PORTEE, 'cahier']]),
		portage: new Map([[PORTEE, ['src/a.ts:1']]]),
		controle: new Map([[PORTEE, ['verif/b.mjs:1']]]),
		hors: new Map(),
		docs: new Map()
	});

	for (const [genre, sonde] of Object.entries(SONDES)) {
		it(`« ${genre} » produit exactement le passage qu’elle annonce`, () => {
			const avant = confronter(corpus(), []).comptes;
			const apres = confronter(sonde.muter(corpus()), []).comptes;
			expect(lireLaMorsure(avant, apres, genre).mord).toBe(true);
		});
	}

	/* LA POLARITÉ INVERSE, ET C'EST ELLE QUI PROUVE QUE LA LECTURE MORD.
	   Sans ce cas, `lireLaMorsure` pourrait rendre `true` en toutes
	   circonstances et les quatre cas ci-dessus resteraient verts (`P-5`). */
	it('refuse de conclure quand une sonde ne produit PAS son passage', () => {
		const avant = confronter(corpus(), []).comptes;
		const inerte = confronter(SONDES['temoin-inerte'].muter(corpus()), []).comptes;
		expect(lireLaMorsure(avant, inerte, 'regle-orpheline').mord).toBe(false);
		expect(lireLaMorsure(avant, inerte, 'citation-inventee').mord).toBe(false);
		expect(lireLaMorsure(avant, inerte, 'regle-non-controlee').mord).toBe(false);
	});

	it('refuse de conclure quand le témoin inerte, lui, fait bouger un compte', () => {
		const avant = confronter(corpus(), []).comptes;
		const bouge = confronter(SONDES['regle-orpheline'].muter(corpus()), []).comptes;
		expect(lireLaMorsure(avant, bouge, 'temoin-inerte').mord).toBe(false);
	});

	/* Une sonde qui ferait monter DEUX chiffres au lieu d'un ne prouverait pas
	   que les deux questions sont disjointes. Le passage est vérifié à
	   l'unité près, jamais « quelque chose a bougé ». */
	it('n’accepte pas un passage approximatif : le delta est exact', () => {
		const avant = confronter(corpus(), []).comptes;
		const deux = confronter(
			SONDES['regle-orpheline'].muter(SONDES['citation-inventee'].muter(corpus())),
			[]
		).comptes;
		expect(lireLaMorsure(avant, deux, 'regle-orpheline').mord).toBe(false);
		expect(lireLaMorsure(avant, deux, 'citation-inventee').mord).toBe(false);
	});
});

describe('l’auto-mesure — l’instrument ne s’exclut pas, il prouve qu’il ne se cite pas', () => {
	/* LE SEUL CAS ADOSSÉ AU VRAI DÉPÔT, ET C'EST VOULU. La propriété porte sur
	   les fichiers réels de l'instrument. Il ne peut pas devenir inerte : il
	   redevient rouge à la première citation écrite en toutes lettres. */
	it('ne relève aucune citation dans ses deux fichiers, sur le dépôt réel', () => {
		const f = perimetres(racine);
		const miennes = autoCitations(citationsDe(f.controle, racine));
		expect(miennes).toEqual([]);
	});

	it('lit bien ses deux fichiers — l’absence de citation n’est pas une absence de lecture', () => {
		const f = perimetres(racine);
		for (const mien of MES_FICHIERS) expect(f.controle).toContain(mien);
	});

	/* Et la polarité inverse : si un numéro y était écrit, le relevé le
	   dirait. Sans ce cas, le précédent serait vert par construction. */
	it('dénoncerait une citation posée dans l’un de ses fichiers', () => {
		const miennes = autoCitations(new Map([[PORTEE, [`${MES_FICHIERS[0]}:42`]]]));
		expect(miennes).toEqual([{ numero: PORTEE, place: `${MES_FICHIERS[0]}:42` }]);
	});

	/* LA VARIANTE VICIEUSE : l'instrument écrit sous `verif/` un rapport qui
	   NOMME les 157 règles. Lu, il ferait passer contrôlées toutes les règles
	   du référentiel dès la deuxième exécution — la batterie se rendrait verte
	   en tournant, sans qu'aucun numéro n'ait été écrit à la main. */
	it('ne lit jamais son propre rapport, qui nomme pourtant toutes les règles', () => {
		const f = perimetres(racine);
		const rapport = 'verif/rapports/couverture.json';
		for (const liste of [f.portage, f.controle, f.hors, f.docs]) {
			expect(liste).not.toContain(rapport);
			expect(liste.filter((x) => x.startsWith('verif/rapports/'))).toEqual([]);
		}
	});

	/* Le rapport doit EXISTER pour que le cas précédent exerce quelque chose :
	   une exclusion qui porte sur un fichier absent est une règle qu'aucun cas
	   ne sollicite (`P-5`). La batterie est donc jouée avant d'être crue. */
	it('a bien un rapport à ne pas lire — sinon l’exclusion serait inerte', () => {
		const log = console.log;
		const err = console.error;
		console.log = () => {};
		console.error = () => {};
		try {
			principal([]);
		} finally {
			console.log = log;
			console.error = err;
		}
		expect(existsSync(join(racine, 'verif', 'rapports', 'couverture.json'))).toBe(true);
	});
});
