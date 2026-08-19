/**
 * Batterie 5 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `pnpm verif:fraicheur` a été un JALON pendant vingt lots : il sortait en 1
 * sans rien mesurer, pendant que deux vues redéfinissaient `classeTemoin` et
 * `libelleFraicheur` sous le nez du dispositif. Le remplacer par un analyseur
 * ne suffit pas : un analyseur a DEUX façons de mentir, et les deux se sont
 * produites sur les instruments de ce dépôt (`ECART-011` É-2 et É-3).
 *
 *   IL PEUT NE RIEN VOIR — et une règle qu'aucun cas n'exerce est une règle
 *   dont on ignore si elle marche (CLAUDE.md §6, P-5). Chaque contrôle est
 *   donc éprouvé sur un cas qui le SOLLICITE.
 *
 *   IL PEUT VOIR CE QUI N'EXISTE PAS — et un instrument qui crie faux cesse
 *   d'être lu. Chaque contrôle est donc éprouvé sur les formes VOISINES et
 *   LÉGITIMES que le dépôt porte réellement : la prose datée du cartouche de
 *   V-03, la table de parts de V-33, la lecture de vecteur de V-14.
 *
 * Ils s'exécutent sans navigateur et sans réseau : c'est ce qui permet de les
 * jouer à chaque `pnpm test:unit`, et donc de les jouer vraiment.
 */
import { describe, it, expect } from 'vitest';
import {
	analyserFichier,
	denuder,
	denuderJs,
	receveursDeTemoin,
	relaisDe,
	perimetre,
	IMPLEMENTATION,
	NIVEAUX,
	SEUILS
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './fraicheur.mjs';

type Constat = { controle: string; fichier: string; ligne: number; quoi: string; comment: string };
type Releve = { constats: Constat[]; receveurs: string[]; temoin: boolean };

const analyse = (nom: string, source: string): Releve => analyserFichier(nom, source) as Releve;
const controles = (nom: string, source: string): string[] =>
	analyse(nom, source).constats.map((c) => c.controle);

/* ═══ Le dénudement — sans lui, l'analyse ment ═══════════════════════════ */

describe('denuder — les commentaires ne sont pas du code', () => {
	it('blanchit un commentaire de ligne sans déplacer les numéros de ligne', () => {
		const src = "const a = 1;\n// jours < 90 ? 'frais' : 'obs'\nconst b = 2;\n";
		const nu = denuderJs(src);
		expect(nu.length).toBe(src.length);
		expect(nu.split('\n').length).toBe(src.split('\n').length);
		expect(nu).not.toContain('frais');
	});

	it('blanchit un bloc /* */ multiligne', () => {
		const src = "/*\n * si (jours > 180) est l'écart type d'ADR-005\n */\nconst a = 1;\n";
		expect(denuderJs(src)).not.toContain('180');
	});

	it('ne prend pas une apostrophe française pour une chaîne ouverte', () => {
		/* Le cas réel : un commentaire français, puis un second commentaire qui
		   doit être blanchi lui aussi. Une apostrophe non refermée aurait fait
		   dérailler le scanner jusqu'à la fin du fichier. */
		const src = "const a = 1; // l'écart\nconst b = 2; // temoin--frais\nconst c = 3;\n";
		const nu = denuderJs(src);
		expect(nu).not.toContain('temoin--frais');
		expect(nu).toContain('const c = 3;');
	});

	it('ne blanchit pas une chaîne qui contient //', () => {
		const src = "const u = 'https://exemple.fr'; const v = 2;\n";
		expect(denuderJs(src)).toContain("'https://exemple.fr'");
	});

	it('traverse un gabarit et ses ${…}', () => {
		const src = 'const s = `a ${x ? `b` : `c`} d`; // temoin--obs\n';
		const nu = denuderJs(src);
		expect(nu).toContain('${x ? `b` : `c`}');
		expect(nu).not.toContain('temoin--obs');
	});

	it('retire les blocs <style> et les commentaires de balisage d’une vue', () => {
		const src =
			'<style>.temoin--frais { color: red }</style>\n' +
			"<!-- le gel écrit niveau === 'frais' ? 3 : 1 -->\n" +
			'<p>texte</p>\n';
		const nu = denuder(src, '.svelte');
		expect(nu).not.toContain('temoin--frais');
		expect(nu).not.toContain('? 3 :');
		expect(nu).toContain('<p>texte</p>');
		expect(nu.length).toBe(src.length);
	});

	it('ne retire pas les commentaires JS du BALISAGE — la prose française y vit', () => {
		/* Un `//` de balisage n'est pas un commentaire : c'est un chemin. */
		const src = '<a href="https://cyber.gouv.fr">Guide</a>\n';
		expect(denuder(src, '.svelte')).toContain('cyber.gouv.fr');
	});
});

/* ═══ A1 — la seconde déclaration nominale ══════════════════════════════ */

describe('A1 — une seconde déclaration sous un nom de la fabrique', () => {
	it('relève une fonction homonyme', () => {
		expect(controles('src/vues/V-XX.svelte', 'function classeTemoin(n) { return n; }')).toContain(
			'A1'
		);
	});

	it('relève une transposition de `window.niveauPour` du gel', () => {
		expect(controles('src/lib/x.ts', 'window.niveauPour = function (j) { return j; };')).toContain(
			'A1'
		);
	});

	it('n’accuse PAS un import de la fabrique', () => {
		expect(
			controles('src/vues/V-XX.svelte', "import { classeTemoin } from '$lib/fraicheur';")
		).not.toContain('A1');
	});

	it('n’accuse PAS un CONSOMMATEUR du calcul portant un nom du gel', () => {
		/* `window.impactSeuils` et `window.repartitionPour` du gel sont des
		   consommateurs : V-33 les réimplémente en APPELANT `niveauFraicheur`.
		   Les avoir comptés comme des calculs rendait la vue la plus exemplaire
		   du dépôt rouge — le faux positif a été mesuré, puis retiré. */
		const src =
			"import { niveauFraicheur } from '$lib/fraicheur';\n" +
			'function impactSeuils(f, v) { return niveauFraicheur(3, { frais: f, vieillissant: v }); }';
		expect(controles('src/vues/V-33.svelte', src)).toEqual([]);
	});
});

/* ═══ A2.1 — la réécriture déguisée, sur le niveau ══════════════════════ */

describe('A2.1 — une chaîne de décision sur le niveau', () => {
	it('relève `barresFraicheur` réécrit sans son nom', () => {
		const src = "const b = niveau === 'frais' ? 3 : niveau === 'vieil' ? 2 : 1;";
		const r = analyse('src/vues/V-XX.svelte', src);
		expect(r.constats.map((c) => c.controle)).toEqual(['A2.1']);
		expect(r.constats[0].quoi).toBe('un nombre de barres');
	});

	it('relève `classeTemoin` réécrit sans son nom', () => {
		const src = "const c = n === 'frais' ? 'temoin--frais' : 'temoin--obs';";
		expect(analyse('src/vues/V-XX.svelte', src).constats[0].quoi).toBe('une classe de témoin');
	});

	it('relève un libellé de fraîcheur choisi par niveau', () => {
		const src = "const v = n === 'frais' ? 'Vérifié il y a 11 jours' : 'Pas revu depuis 9 mois';";
		expect(analyse('src/vues/V-XX.svelte', src).constats[0].quoi).toBe('un libellé de fraîcheur');
	});

	it('relève la forme `if` autant que la forme ternaire', () => {
		expect(controles('src/lib/x.ts', "if (n === 'obs') return 1;")).toContain('A2.1');
	});

	it('ne compte QU’UNE FOIS une chaîne à deux comparaisons', () => {
		/* Deux `===` et un seul défaut : compter deux fois enflerait le décompte
		   sans qu'un second défaut existe. */
		const src = "const b = f === 'frais' ? 3 : f === 'vieil' ? 2 : 1;";
		expect(controles('src/vues/V-XX.svelte', src)).toEqual(['A2.1']);
	});

	it('compte DEUX FOIS deux sorties différentes, même voisines', () => {
		const src =
			"\tconst barres = niveau === 'frais' ? 3 : niveau === 'vieil' ? 2 : 1;\n" +
			"\tconst valeur = niveau === 'frais' ? 'Vérifié il y a 11 jours' : 'Pas revu depuis 9 mois';\n";
		const r = analyse('src/vues/V-XX.svelte', src);
		expect(r.constats.map((c) => c.quoi).sort()).toEqual([
			'un libellé de fraîcheur',
			'un nombre de barres'
		]);
	});

	it('n’accuse PAS une lecture de niveau qui rend un niveau', () => {
		/* V-14 : lire le levier de la planche n'est pas calculer la fraîcheur. */
		const src = "const n = r['fr'] === 'vieil' ? 'vieil' : r['fr'] === 'obs' ? 'obs' : 'frais';";
		expect(controles('src/vues/V-14.svelte', src)).toEqual([]);
	});

	it('n’accuse PAS un aiguillage vers une clé de regroupement', () => {
		/* V-33 : `apres` sert à ranger un mouvement, pas à peindre un témoin. */
		const src =
			"const cible = apres === 'frais' ? 'versFrais' : apres === 'vieil' ? 'versVieil' : 'versObs';";
		expect(controles('src/vues/V-33.svelte', src)).toEqual([]);
	});

	it('n’accuse PAS un décompte par niveau', () => {
		const src = "const f = liste.filter((n) => n.fraicheur === 'frais').length;";
		expect(controles('src/vues/V-XX.svelte', src)).toEqual([]);
	});

	it('n’accuse PAS la prose datée du cartouche, qui porte des chiffres', () => {
		/* Le cas qui a fait resserrer la règle : `{#if niveau === 'frais'}Ce guide
		   a été contrôlé le 2 août 2026…` contient des « 2 » isolés. Exiger que
		   la BRANCHE ENTIÈRE soit la sortie est ce qui sépare la prose du calcul. */
		const src =
			'{#if niveau === \'frais\'}Ce guide a été contrôlé le <time datetime="2026-08-02">2 août 2026</time>.{/if}';
		expect(controles('src/vues/V-03.svelte', src)).toEqual([]);
	});
});

/* ═══ A2.2 — l'écart type nommé par ADR-005 ═════════════════════════════ */

describe('A2.2 — une chaîne de décision sur l’ancienneté ou sur un seuil', () => {
	it('relève « si (jours > 180) dans une vue », l’écart type d’ADR-005', () => {
		const src = "const n = jours < 90 ? 'frais' : jours < 180 ? 'vieil' : 'obs';";
		const r = analyse('src/vues/V-XX.svelte', src);
		expect(r.constats.map((c) => c.controle)).toEqual(['A2.2']);
		expect(r.constats[0].quoi).toBe('un niveau de fraîcheur');
	});

	it('relève la même décision écrite contre une configuration', () => {
		const src = "const a = note.jours < CONFIG.seuilFrais ? 'frais' : 'obs';";
		expect(controles('seeds/corpus.test.ts', src)).toContain('A2.2');
	});

	it('n’accuse PAS une ancienneté qui rend une tournure de date', () => {
		/* V-07 : « Signalée par X · il y a 3 jours » n'est pas de la fraîcheur. */
		const src = "const q = r.jours <= 1 ? 'hier' : 'il y a ' + r.jours + ' jours';";
		expect(controles('src/vues/V-07.svelte', src)).toEqual([]);
	});
});

/* ═══ A2.3 et A3 — le libellé en clair, les seuils recopiés ═════════════ */

describe('A2.3 — un libellé de fraîcheur écrit en clair', () => {
	it('relève « Pas revu depuis » hors de la fabrique', () => {
		expect(controles('src/vues/V-XX.svelte', "const s = 'Pas revu depuis 9 mois';")).toEqual([
			'A2.3'
		]);
	});

	it('ne redit pas ce qu’A2.1 a déjà nommé sur la même chaîne', () => {
		const src = "const v = n === 'frais' ? 'Vérifié il y a 3 jours' : 'Pas revu depuis 9 mois';";
		expect(controles('src/vues/V-XX.svelte', src)).toEqual(['A2.1']);
	});
});

describe('A3 — la duplication littérale des seuils', () => {
	it('relève un seuil recopié en constante', () => {
		expect(controles('seeds/corpus.ts', `const C = { seuilFrais: ${SEUILS[0]} };`)).toEqual(['A3']);
	});

	it('relève le couple par défaut retranscrit', () => {
		expect(
			controles('src/vues/V-33.svelte', `const J = { actuel: [${SEUILS.join(', ')}] };`)
		).toEqual(['A3']);
	});

	it('n’accuse PAS un jeu de seuils qui n’est pas celui par défaut', () => {
		expect(controles('src/vues/V-33.svelte', 'const J = { severe: [30, 60] };')).toEqual([]);
	});

	it('exempte l’unitaire de l’implémentation, et lui seul', () => {
		const src = `expect(SEUILS_PAR_DEFAUT.frais).toBe(${SEUILS[0]});`;
		expect(controles('src/lib/fraicheur.test.ts', src)).toEqual([]);
		expect(controles('src/lib/autre.test.ts', `const s = { seuilFrais: ${SEUILS[0]} };`)).toEqual([
			'A3'
		]);
	});
});

/* ═══ La fabrique : receveurs et relais ═════════════════════════════════ */

describe('receveursDeTemoin — ce qui PROUVE qu’un identifiant porte un Temoin', () => {
	it('reconnaît une liaison à la fabrique, sous ses trois formes', () => {
		const nu =
			'const a = temoinFraicheur(n);\n' +
			'{@const b = temoinFraicheur(n)}\n' +
			'const c = $derived(temoinFraicheur(n));\n';
		expect([...(receveursDeTemoin(nu) as Set<string>)].sort()).toEqual(['a', 'b', 'c']);
	});

	it('reconnaît une annotation `: Temoin` — le type est celui de la fabrique', () => {
		const nu = '{#snippet temoin(t: Temoin)}{/snippet}\nfunction jauge(u: Temoin) {}';
		expect([...(receveursDeTemoin(nu) as Set<string>)].sort()).toEqual(['t', 'u']);
	});

	it('ne prend pas un objet quelconque pour un receveur', () => {
		expect([
			...(receveursDeTemoin('const voisine = { libelle: "il y a 6 j" };') as Set<string>)
		]).toEqual([]);
	});
});

describe('relaisDe — un niveau d’indirection, et un seul', () => {
	it('admet une fonction dont le corps lit la fabrique', () => {
		const nu =
			'function jauge(t: Temoin) {\n\treturn Array.from({ length: 3 }, (_, k) => k < t.barres);\n}\n';
		const rec = receveursDeTemoin(nu);
		expect([...(relaisDe(nu, 'barres', rec) as Set<string>)]).toContain('jauge');
	});

	it('REFUSE une fonction qui recalcule — c’est toute la différence', () => {
		const nu = "function barres(niveau) {\n\treturn niveau === 'frais' ? 3 : 1;\n}\n";
		expect([...(relaisDe(nu, 'barres', receveursDeTemoin(nu)) as Set<string>)]).not.toContain(
			'barres'
		);
	});
});

/* ═══ B — tous les affichages appellent la fabrique ═════════════════════ */

const TEMOIN_CONFORME =
	"import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';\n" +
	'{#snippet temoin(n)}<span class="temoin {classeTemoin(n.fraicheur)}">' +
	'<span class="temoin__jauge" aria-hidden="true">' +
	"{#each [0, 1, 2] as r (r)}<i class={r < barresFraicheur(n.fraicheur) ? 'plein' : undefined}></i>{/each}" +
	'</span><span class="temoin__txt">{libelleFraicheur(n)}</span></span>{/snippet}\n';

describe('B — la fabrique alimente chaque facette du témoin', () => {
	it('ne dit rien d’un témoin entièrement conforme', () => {
		expect(controles('src/vues/V-XX.svelte', TEMOIN_CONFORME)).toEqual([]);
	});

	it('accepte la forme par description — `temoinFraicheur` et son receveur', () => {
		const src =
			"import { temoinFraicheur } from '$lib/fraicheur';\n" +
			'{#snippet temoin(n)}{@const t = temoinFraicheur(n)}<span class="temoin {t.classe}">' +
			'<span class="temoin__jauge">{#each R as r (r)}<i class={r < t.barres ? \'plein\' : undefined}></i>{/each}</span>' +
			'<span class="temoin__txt">{t.libelle}</span></span>{/snippet}\n';
		expect(controles('src/vues/V-07.svelte', src)).toEqual([]);
	});

	it('accepte un relais typé `Temoin` — la jauge de V-41', () => {
		const src =
			"import { BARRES_DE_JAUGE, temoinFraicheur } from '$lib/fraicheur';\n" +
			'function jauge(t: Temoin) { return Array.from({ length: BARRES_DE_JAUGE }, (_, k) => k < t.barres); }\n' +
			'{#snippet temoin(t: Temoin)}<span class="temoin {t.classe}">' +
			'<span class="temoin__jauge">{#each jauge(t) as p, k (k)}<i class={p ? \'plein\' : undefined}></i>{/each}</span>' +
			'<span class="temoin__txt">{t.libelle}</span></span>{/snippet}\n';
		expect(controles('src/vues/V-41.svelte', src)).toEqual([]);
	});

	it('B0 — relève un témoin rendu sans importer la fabrique', () => {
		const src = '<span class="temoin__jauge">x</span>';
		expect(controles('src/vues/V-03.svelte', src)).toContain('B0');
	});

	it('B1 — relève un modificateur de niveau écrit à la main', () => {
		const src =
			"import { libelleFraicheur } from '$lib/fraicheur';\n" +
			'<span class="temoin temoin--frais"><span class="temoin__txt">{libelleFraicheur(n)}</span></span>';
		expect(controles('src/vues/V-XX.svelte', src)).toContain('B1');
	});

	it('B2 — relève une jauge remplie par un second calcul', () => {
		const src =
			"import { classeTemoin, libelleFraicheur } from '$lib/fraicheur';\n" +
			'{#snippet temoin(n)}<span class="temoin {classeTemoin(n.fraicheur)}">' +
			'<span class="temoin__jauge">{#each R as r (r)}<i class={r < barres(n.fraicheur) ? \'plein\' : undefined}></i>{/each}</span>' +
			'<span class="temoin__txt">{libelleFraicheur(n)}</span></span>{/snippet}';
		expect(controles('src/vues/V-11.svelte', src)).toContain('B2');
	});

	it('B3 — relève un libellé pris dans une table écrite à la main', () => {
		/* LE CAS QUI FAIT TOUT L'INTÉRÊT DU GARDE-FOU : `voisine.libelle` porte
		   bien le champ `.libelle`, mais `voisine` n'est pas un receveur. Sans la
		   condition de receveur, ce contrôle serait inerte. */
		const src =
			"import { classeTemoin } from '$lib/fraicheur';\n" +
			'const VOISINES = [{ libelle: "il y a 6 j" }];\n' +
			'<span class="temoin {classeTemoin(n)}"><span class="temoin__txt">{voisine.libelle}</span></span>';
		expect(controles('src/vues/V-14.svelte', src)).toContain('B3');
	});

	it('B4 — relève un cartouche dont la valeur ne sort pas de la fabrique', () => {
		const src =
			"import { libelleFraicheur } from '$lib/fraicheur';\n" +
			'<div class="cartouche__valeur">{valeur}</div>';
		expect(controles('src/vues/V-03.svelte', src)).toContain('B4');
	});

	it('n’exige rien d’un fichier qui ne rend aucun témoin', () => {
		expect(analyse('src/lib/dates.ts', 'export const x = 1;').temoin).toBe(false);
	});
});

/* ═══ Le périmètre, et l'auto-contrôle ═════════════════════════════════ */

describe('le périmètre — ce que la batterie regarde, et ce qu’elle ne regarde pas', () => {
	const p = perimetre() as string[];

	it('couvre src/** et seeds/**, et exclut l’implémentation elle-même', () => {
		expect(p.length).toBeGreaterThan(0);
		expect(p).not.toContain(IMPLEMENTATION);
		expect(p.some((f) => f.startsWith('src/vues/'))).toBe(true);
		expect(p.some((f) => f.startsWith('seeds/'))).toBe(true);
	});

	it('n’analyse ni le harnais ni le gel — l’un mesure, l’autre est la source', () => {
		expect(p.some((f) => f.startsWith('verif/'))).toBe(false);
		expect(p.some((f) => f.startsWith('mockups/'))).toBe(false);
	});

	it('relève au moins un site de témoin — un relevé inerte serait un faux vert', () => {
		const porteurs = (p as string[]).filter((f) => f.endsWith('.svelte'));
		expect(porteurs.length).toBeGreaterThan(0);
	});

	it('connaît trois niveaux et deux seuils, ceux du gel', () => {
		expect(NIVEAUX).toEqual(['frais', 'vieil', 'obs']);
		expect(SEUILS).toEqual([90, 180]);
	});
});
