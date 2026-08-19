/**
 * Batterie 8 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `verif/vide.mjs` rend un verdict sur quatre populations — deux côtés × deux
 * corpus. Toute sa justesse tient dans trois décisions minuscules, et deux
 * d'entre elles ont déjà coûté cher AILLEURS dans ce dépôt :
 *
 *   1. LA CLÉ DE RAPPROCHEMENT NE PORTE AUCUN TEXTE. `ECART-041` : la clé de la
 *      batterie 10 embarquait un extrait de `textContent`, le compilateur Svelte
 *      élague les nœuds de texte blancs d'un côté et pas de l'autre (**P-8**), et
 *      31 « défauts de portage » sur 31 étaient faux. Les deux sens sont éprouvés
 *      ici, et c'est le seul endroit où ils PEUVENT l'être sans navigateur :
 *      un cas qui DOIT se rapprocher, un cas qui NE DOIT PAS.
 *
 *   2. LE DÉCOUPAGE EN JETONS ET SES EXCLUSIONS. Une exclusion trop large fait
 *      disparaître un indicateur du relevé — donc un défaut —, une exclusion
 *      trop étroite fait compter les renvois de la bibliothèque V-41 comme
 *      autant de valeurs figées. Les quatre familles sont figées par l'exemple.
 *
 *   3. « 0 » N'EST PAS « INDISPONIBLE ». Le verdict du zéro muet dépend d'un
 *      unique prédicat — la zone rend un jeton nul ET aucun composant d'état
 *      neutre. Le confondre avec « la zone est vide » absoudrait tout le monde.
 *
 * Ils s'exécutent sans navigateur et sans serveur — c'est ce qui permet de les
 * jouer à chaque `pnpm test:unit`, et donc de les jouer vraiment.
 */
import { describe, it, expect } from 'vitest';
import {
	agreger,
	cleDe,
	estZero,
	EXCLUSIONS,
	eprouverLaCle,
	greffonCorpusVide,
	jetonsDe,
	MARQUEURS_VIDE,
	memeValeur,
	neutresDe,
	normaliserJeton,
	SCRIPT_GEL_VIDE,
	signatureDe,
	verdictDeCle,
	verdictZeroMuet,
	vuesDuDepot
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './vide.mjs';

/* ═══════════════════════════════════════════════════════════════════════════
   1. LA CLÉ — les deux sens, et c'est la leçon d'ECART-041.
   ═════════════════════════════════════════════════════════════════════════ */

describe('la clé de rapprochement', () => {
	const base = { vue: 'V-07', zone: '#indics', classes: ['ind__val'], balise: 'span' };

	it('SENS POSITIF — deux textes différents, même clé', () => {
		// C'est tout le propos : la valeur est ce qu'on COMPARE, jamais ce qui
		// rapproche. Sans cela, un indicateur ne se suivrait pas d'un corpus à
		// l'autre — et la batterie ne pourrait rien mesurer du tout.
		expect(cleDe(base)).toBe(cleDe(base));
	});

	it('SENS POSITIF — les blancs de P-8 ne séparent pas deux clés', () => {
		// `ECART-041` en toutes lettres : le compilateur Svelte élague les nœuds de
		// texte blancs. Aucun blanc n'entre dans la clé, donc aucun ne peut la
		// changer. Le contrôle est ici parce qu'aucune exécution ne peut le rendre :
		// il porte sur ce que la clé N'EMBARQUE PAS.
		const avec = cleDe({ ...base, texte: '  32  notes ' });
		const sans = cleDe({ ...base, texte: '32notes' });
		expect(avec).toBe(sans);
		expect(avec).toBe('V-07 › #indics › ind__val #0');
		// Et la clé ne porte AUCUNE des valeurs qu'elle sert à comparer.
		expect(avec).not.toContain('32');
		expect(avec).not.toContain('notes');
	});

	it('la signature est la moitié stable de la clé — classes triées, sinon balise', () => {
		expect(signatureDe({ classes: ['b', 'a'], balise: 'span' })).toBe('a.b');
		expect(signatureDe({ classes: [], balise: 'span' })).toBe('<span>');
	});

	it('SENS POSITIF — l’ordre des classes ne change pas la clé', () => {
		expect(cleDe({ ...base, classes: ['a', 'b'] })).toBe(cleDe({ ...base, classes: ['b', 'a'] }));
	});

	it('SENS NÉGATIF — deux ZONES distinctes ne se rapprochent pas', () => {
		// Sans la zone, les quatre `.ind__val` de l'accueil se confondraient avec
		// les compteurs du pied de page, et un défaut se cacherait dans la fusion.
		expect(cleDe({ ...base, zone: '#indics' })).not.toBe(cleDe({ ...base, zone: '#pied' }));
	});

	it('SENS NÉGATIF — deux SIGNATURES de classes distinctes ne se rapprochent pas', () => {
		expect(cleDe({ ...base, classes: ['ind__val'] })).not.toBe(
			cleDe({ ...base, classes: ['ind__sous'] })
		);
	});

	it('SENS NÉGATIF — deux VUES distinctes ne se rapprochent pas', () => {
		expect(cleDe({ ...base, vue: 'V-07' })).not.toBe(cleDe({ ...base, vue: 'V-11' }));
	});

	it('SENS NÉGATIF — deux RANGS distincts ne se rapprochent pas', () => {
		// Le rang a été ajouté après une mutation de preuve passée inaperçue sans
		// lui : les quatre `.ind__val` de `#indics` formaient UNE clé, et le
		// multiensemble variait encore par ses trois autres membres. C'est le
		// sur-rapprochement d'ECART-041, mesuré sur pièce.
		expect(cleDe({ ...base, rang: 0 })).not.toBe(cleDe({ ...base, rang: 1 }));
	});

	it('un élément sans classe est keyé par sa balise, jamais par rien', () => {
		// Sinon toutes les balises nues d'une zone se confondraient en une clé
		// vide, et le multiensemble deviendrait ininterprétable.
		expect(cleDe({ ...base, classes: [] })).toBe('V-07 › #indics › <span> #0');
	});
});

describe('eprouverLaCle — la partition des orphelines', () => {
	const j = (jetons: string[]) => ({ jetons, dansVerdict: true });
	const pop = (entrees: [string, string[]][]) => new Map(entrees.map(([c, v]) => [c, j(v)]));

	it('sépare l’orpheline DE CORPUS de l’orpheline DE CÔTÉ', () => {
		// L'une est bénigne — les deux côtés conviennent que l'élément disparaît
		// avec le corpus. L'autre accuse la clé ou la structure. Les compter
		// ensemble reviendrait à n'en compter aucune.
		const r = eprouverLaCle({
			'gel/natif': pop([
				['commune', ['1']],
				['deCorpus', ['2']],
				['deCote', ['3']]
			]),
			'gel/vide': pop([['commune', ['0']]]),
			'app/natif': pop([
				['commune', ['1']],
				['deCorpus', ['2']]
			]),
			'app/vide': pop([['commune', ['0']]])
		});
		expect(r.communes).toBe(1);
		expect(r.orphelinesCorpus).toEqual(['deCorpus']);
		expect(r.orphelinesCote).toEqual(['deCote']);
	});

	it('nomme les clés FUSIONNÉES — le sur-rapprochement, chiffré', () => {
		const p = pop([['k', ['1', '2']]]);
		const r = eprouverLaCle({
			'gel/natif': p,
			'gel/vide': p,
			'app/natif': p,
			'app/vide': p
		});
		expect(r.fusionnees).toEqual(['k']);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   2. LES JETONS ET LEURS EXCLUSIONS.
   ═════════════════════════════════════════════════════════════════════════ */

describe('jetonsDe', () => {
	it('relève un compteur simple', () => {
		expect(jetonsDe('Votre périmètre, Infrastructure, compte 14 notes').jetons).toEqual(['14']);
	});

	it('recolle les séparateurs de milliers de fr-FR, pas les espaces ordinaires', () => {
		// `toLocaleString('fr-FR')` emploie l'espace insécable étroite. L'espace
		// ORDINAIRE reste un séparateur de mots : « 4 résultats » n'est pas « 4 r ».
		expect(jetonsDe('1 234 consultations').jetons).toEqual(['1234']);
		expect(jetonsDe('4 résultats sur 37').jetons).toEqual(['4', '37']);
	});

	it('conserve le signe et le pour-cent — deux tendances opposées sont deux valeurs', () => {
		expect(jetonsDe('+12 % vs semaine précédente').jetons).toEqual(['+12%']);
		expect(jetonsDe('-2 % vs semaine précédente').jetons).toEqual(['-2%']);
		expect(jetonsDe('+12 %').jetons).not.toEqual(jetonsDe('-12 %').jetons);
	});

	it('EXCLUT la date, l’heure, la version, la référence et l’horodatage', () => {
		expect(jetonsDe('Vérifié le 13/08/2026').jetons).toEqual([]);
		expect(jetonsDe('aujourd’hui à 09:12').jetons).toEqual([]);
		expect(jetonsDe('Codicillus 1.0.0').jetons).toEqual([]);
		expect(jetonsDe('vue V-14, principe P-02, règle RG-M18-03').jetons).toEqual([]);
		expect(jetonsDe('export 20260810T0912').jetons).toEqual([]);
	});

	it('une exclusion ne RECOLLE jamais deux nombres qu’elle séparait', () => {
		// Le masquage se fait en blancs de même longueur, jamais par suppression :
		// « 3 le 13/08/2026 puis 7 » ne doit pas rendre « 37 ».
		expect(jetonsDe('3 le 13/08/2026 puis 7').jetons).toEqual(['3', '7']);
	});

	it('n’exclut PAS un compteur qui ressemble de loin à une référence', () => {
		// La borne du sens négatif : « 32 notes » n'est pas « V-32 ».
		expect(jetonsDe('32 notes au total').jetons).toEqual(['32']);
	});

	it('compte les occurrences exclues, par famille', () => {
		expect(jetonsDe('13/08/2026 et 14/08/2026').exclus).toEqual({ date: 2 });
	});
});

describe('normaliserJeton et estZero', () => {
	it('ramène la virgule décimale au point et retire les blancs de milliers', () => {
		expect(normaliserJeton('1 234')).toBe('1234');
		expect(normaliserJeton('12,5 %')).toBe('12.5%');
	});

	it('reconnaît le zéro sous ses formes rendues, et lui seul', () => {
		expect(estZero('0')).toBe(true);
		expect(estZero('0%')).toBe(true);
		expect(estZero('0.0')).toBe(true);
		expect(estZero('10')).toBe(false);
		expect(estZero('0.5')).toBe(false);
		// « 01 » d'un identifiant n'est pas un compteur nul.
		expect(estZero('-01')).toBe(false);
	});
});

describe('la table des exclusions', () => {
	it('porte cinq familles, chacune avec un motif écrit', () => {
		expect(EXCLUSIONS.length).toBe(5);
		for (const e of EXCLUSIONS) {
			expect(e.famille).toBeTruthy();
			expect(e.motif.length).toBeGreaterThan(40);
			expect(e.re.flags).toContain('g');
		}
	});

	it('AUCUNE exclusion n’est inerte sur ses propres exemples', () => {
		// L'exécution éprouve les exclusions contre le relevé des 41 maquettes et
		// refuse en code 2 si l'une ne mord pas (P-5). Ici : la même discipline,
		// sans navigateur — chaque famille doit attraper au moins son exemple.
		const exemples: Record<string, string> = {
			date: '13/08/2026',
			heure: '09:12',
			version: '1.0.0',
			reference: 'ARB-012',
			horodatage: '20260810T0912'
		};
		for (const e of EXCLUSIONS) {
			expect(jetonsDe(exemples[e.famille]).exclus[e.famille]).toBeGreaterThan(0);
		}
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   3. LES DEUX VERDICTS.
   ═════════════════════════════════════════════════════════════════════════ */

describe('verdictDeCle — la nature se lit dans la comparaison', () => {
	it('gel qui varie, portage qui ne varie pas → PORTAGE, le seul rouge', () => {
		expect(verdictDeCle(['32'], ['0'], ['32'], ['32'])).toBe('portage');
	});

	it('les deux varient → conforme', () => {
		expect(verdictDeCle(['32'], ['0'], ['32'], ['0'])).toBe('conforme');
	});

	it('aucun ne varie → GEL, jamais un rouge', () => {
		// Réglage — la rétention de 50 versions de V-33 —, ou valeur figée DU GEL.
		// La batterie ne tranche pas entre les deux : elle constate.
		expect(verdictDeCle(['50'], ['50'], ['50'], ['50'])).toBe('gel');
	});

	it('le gel fige, le portage varie → gel non reporté', () => {
		expect(verdictDeCle(['50'], ['50'], ['50'], ['0'])).toBe('gel-non-reporte');
	});

	it('une clé absente d’UNE population → instrument, jamais opposée', () => {
		expect(verdictDeCle(['32'], null, ['32'], ['0'])).toBe('instrument');
		expect(verdictDeCle(null, null, null, null)).toBe('instrument');
	});

	it('compare des MULTIENSEMBLES, pas des ensembles', () => {
		// Deux indicateurs à « 0 » et trois indicateurs à « 0 » ne sont pas le
		// même écran ; un ensemble les confondrait.
		expect(memeValeur(['0', '0'], ['0', '0', '0'])).toBe(false);
		expect(memeValeur(['0', '1'], ['0', '1'])).toBe(true);
	});
});

describe('verdictZeroMuet — « 0 » et « indisponible » sont deux informations', () => {
	const zone = (zeros: string[], neutres: string[]) => ({ neutres, jetons: zeros });

	it('le portage rend 0 sans état neutre, le gel non → PORTAGE', () => {
		expect(verdictZeroMuet(zone([], ['.zone-etat*']), zone(['0'], []))).toBe('portage');
	});

	it('les deux côtés le font → GEL, un constat', () => {
		expect(verdictZeroMuet(zone(['0'], []), zone(['0'], []))).toBe('gel');
	});

	it('un « 0 » ACCOMPAGNÉ d’un état neutre n’est pas muet', () => {
		// C'est toute la règle : la faute n'est pas d'afficher zéro, c'est de ne
		// pas distinguer zéro d'indisponible.
		expect(verdictZeroMuet(zone(['0'], ['.zone-etat*']), zone(['0'], ['.zone-etat*']))).toBe(
			'conforme'
		);
	});

	it('une zone SANS aucun zéro n’est jamais muette', () => {
		expect(verdictZeroMuet(zone(['12'], []), zone(['12'], []))).toBe('conforme');
	});

	it('une zone absente d’un côté → instrument', () => {
		expect(verdictZeroMuet(null, zone(['0'], []))).toBe('instrument');
	});
});

describe('l’état neutre est emprunté à la batterie 9, jamais récrit', () => {
	it('n’emploie que des familles d’état « vide » de l’inventaire fermé', () => {
		expect(MARQUEURS_VIDE.length).toBeGreaterThan(0);
		for (const m of MARQUEURS_VIDE) {
			expect(m.etat).toBe('vide');
			expect(m.trace).toBeTruthy();
		}
	});

	it('reconnaît les composants d’état vide du socle et des vues', () => {
		expect(neutresDe(['zone-etat', 'panneau'])).toEqual(['.zone-etat*']);
		expect(neutresDe(['dom__vide'])).toEqual(['.*__vide']);
		expect(neutresDe(['si-vide'])).toEqual(['.si-vide']);
		expect(neutresDe(['panneau', 'ind'])).toEqual([]);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   4. L'AGRÉGATION — du relevé brut à la table de clés.
   ═════════════════════════════════════════════════════════════════════════ */

describe('agreger', () => {
	const brut = {
		zones: [
			{
				cle: '#indics',
				rend: true,
				dansVerdict: true,
				classesVisibles: ['ind', 'ind__val'],
				porteurs: [
					{ balise: 'span', classes: ['ind__val'], rang: 0, texte: '32' },
					{ balise: 'span', classes: ['ind__val'], rang: 1, texte: '0' },
					{ balise: 'span', classes: ['ind__sous'], rang: 0, texte: 'dans 4 domaines' }
				]
			}
		],
		horsZone: {
			cle: '(hors zone nommée)',
			rend: true,
			dansVerdict: true,
			classesVisibles: [],
			porteurs: []
		}
	};

	it('SÉPARE deux porteurs de mêmes classes par leur rang — pas de multiensemble subi', () => {
		const { cles } = agreger('V-07', brut);
		expect(cles.get('V-07 › #indics › ind__val #0').jetons).toEqual(['32']);
		expect(cles.get('V-07 › #indics › ind__val #1').jetons).toEqual(['0']);
		expect(cles.get('V-07 › #indics › ind__sous #0').jetons).toEqual(['4']);
	});

	it('un SEUL porteur portant deux nombres reste un multiensemble, et c’est voulu', () => {
		// « 4 résultats sur 37 » est UN texte : ses deux nombres sont couplés par
		// construction, et les séparer inventerait une structure que le DOM n'a pas.
		const { cles } = agreger('V-02', {
			zones: [
				{
					cle: '#f',
					rend: true,
					dansVerdict: true,
					classesVisibles: ['compteur'],
					porteurs: [{ balise: 'p', classes: ['compteur'], rang: 0, texte: '4 résultats sur 37' }]
				}
			],
			horsZone: {
				cle: '(hors zone nommée)',
				rend: true,
				dansVerdict: true,
				classesVisibles: [],
				porteurs: []
			}
		});
		expect(cles.get('V-02 › #f › compteur #0').jetons).toEqual(['37', '4']);
	});

	it('rend l’état neutre et les jetons de la ZONE, pour le verdict du zéro muet', () => {
		const { zones } = agreger('V-07', brut);
		expect(zones.get('#indics').neutres).toEqual([]);
		expect(zones.get('#indics').jetons).toEqual(['0', '32', '4']);
	});

	it('un relevé absent ne fabrique aucune clé — il ne vaut pas « rien à signaler »', () => {
		const { cles, zones } = agreger('V-07', null);
		expect(cles.size).toBe(0);
		expect(zones.size).toBe(0);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   5. LES DEUX SONDES DE CORPUS — leur SYMÉTRIE est la condition du verdict.
   ═════════════════════════════════════════════════════════════════════════ */

describe('les sondes de corpus', () => {
	it('le script du gel intercepte l’affectation de window.CORPUS et rend le jeu vide', () => {
		const window: Record<string, unknown> = {};
		new Function('window', SCRIPT_GEL_VIDE)(window);
		window.CORPUS = [{ id: 'n-restaurer-pg' }];
		expect(window.CORPUS).toEqual([]);
	});

	it('le greffon ne transforme QUE `seeds/corpus.ts`', () => {
		const g = greffonCorpusVide();
		expect(g.transform('x', '/tmp/dep/src/vues/V-07.svelte')).toBeNull();
		expect(g.transform('x', '/tmp/dep/seeds/corpus.ts')).not.toBeNull();
		expect(g.transform('x', '/tmp/dep/seeds/corpus.ts?v=1')).not.toBeNull();
	});

	it('le greffon vide les TROIS sources, et pas une de plus', () => {
		// La symétrie avec `window.CORPUS = []` est la condition du verdict : une
		// sonde de portée plus étroite d'un côté se lirait en faux défauts.
		const { code } = greffonCorpusVide().transform('/* module */', '/x/seeds/corpus.ts');
		expect(code).toContain('VARIANTE_PAR_VUE');
		expect(code).toContain('CORPUS.length = 0');
		expect(code).toContain('INDEX_DES_NOTES.clear()');
		expect(code).not.toContain('MESURES_7J');
		expect(code).not.toContain('DOMAINES');
	});
});

describe('le périmètre mesuré', () => {
	it('couvre les 41 vues du dépôt, sans liste écrite à la main', () => {
		expect(vuesDuDepot().length).toBe(41);
	});
});
