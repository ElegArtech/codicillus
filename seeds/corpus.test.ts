/* ==========================================================================
   PREUVE D'EMBOÎTEMENT DU JEU DE SEMENCE
   ==========================================================================
   Ce test ne compare pas `corpus.ts` à lui-même : il relit les maquettes
   gelées de `mockups/`, en extrait les objets globaux de données, et vérifie
   trois choses.

     1. Les cinq jeux de notes portés par les quarante et une vues sont
        strictement emboîtés : 32 ⊃ 27 ⊃ 19 ⊃ 14 ⊃ ∅.
     2. Une note commune à plusieurs variantes y porte partout les mêmes
        valeurs — à deux écarts près, déclarés et vérifiés nommément.
     3. `corpus.ts` reproduit fidèlement la maquette de référence, et
        `corpusPourVue()` rend à chaque vue exactement le jeu que sa maquette
        utilise. C'est la condition de la comparaison visuelle.

   Les maquettes sont lues, jamais écrites.
   ========================================================================== */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

import {
	ACTIVITE,
	COMPTES,
	CONFIG,
	CONTENU_VERSIONS,
	CONTRIBUTIONS,
	CORPUS,
	DATE_REFERENCE,
	DETAIL_DOMAINES,
	DISTINCTIONS,
	DOMAINES,
	FORMATS_IMPORT,
	IDS_PAR_VARIANTE,
	INSTANCE,
	JOURNAL_IMPORTS,
	LOT_IMPORT,
	MESURES_7J,
	MESURES_7J_PREC,
	MODIFICATIONS,
	MODULES,
	MOI,
	RECHERCHES,
	RELATIONS,
	RELATIONS_TECHNIQUES,
	RETENTION_VERSIONS,
	REVISIONS,
	TEMPLATES,
	TYPES_FICHE,
	TYPES_NOTE,
	TYPES_RELATION,
	UNIVERS,
	VARIANTE_PAR_VUE,
	VERSIONS,
	VUES_PAR_VARIANTE,
	corpusDeVariante,
	corpusPourVue,
	type IdentifiantDeVue,
	type Variante
} from './corpus.js';
import { niveauFraicheur } from '../src/lib/fraicheur.js';

/* ── Lecture des maquettes ────────────────────────────────────────────────── */

const DOSSIER_MAQUETTES = fileURLToPath(new URL('../mockups/', import.meta.url));

/** Le bloc de données d'une vue : le premier `<script>` qui déclare au moins
 *  une globale en majuscules. Les blocs suivants sont du code de rendu — ils
 *  peuvent restreindre `window.CORPUS` au périmètre public, ce qui relève de la
 *  vue et non du jeu de semence. */
function blocDeDonnees(html: string): string | null {
	const motif = /<script>([\s\S]*?)<\/script>/g;
	let m: RegExpExecArray | null;
	while ((m = motif.exec(html)) !== null) {
		const contenu = m[1] ?? '';
		if (/window\.[A-Z_][A-Z0-9_]*\s*=/.test(contenu)) return contenu;
	}
	return null;
}

type GlobalesDeVue = Record<string, unknown>;

function globalesDe(fichier: string): GlobalesDeVue {
	const bloc = blocDeDonnees(readFileSync(DOSSIER_MAQUETTES + fichier, 'utf8'));
	const bac: { window: Record<string, unknown> } = { window: {} };
	createContext(bac);
	if (bloc) runInContext(bloc, bac, { filename: fichier });
	const donnees: GlobalesDeVue = {};
	for (const [nom, valeur] of Object.entries(bac.window)) {
		if (typeof valeur === 'function') continue;
		if (!/^[A-Z_][A-Z0-9_]*$/.test(nom)) continue;
		donnees[nom] = valeur;
	}
	return donnees;
}

const FICHIERS = readdirSync(DOSSIER_MAQUETTES)
	.filter((f) => /^V-\d{2}-.*\.html$/.test(f))
	.sort();

const VUE_DU_FICHIER = new Map<string, IdentifiantDeVue>(
	FICHIERS.map((f) => [f, f.slice(0, 4) as IdentifiantDeVue])
);

const MAQUETTES = new Map<IdentifiantDeVue, GlobalesDeVue>(
	FICHIERS.map((f) => [VUE_DU_FICHIER.get(f)!, globalesDe(f)])
);

/** La vue qui porte le sur-ensemble : source de référence de `corpus.ts`. */
const VUE_DE_REFERENCE: IdentifiantDeVue = 'V-14';

type NoteDeMaquette = Record<string, unknown> & { id: string };

function corpusDeLaMaquette(vue: IdentifiantDeVue): NoteDeMaquette[] {
	return (MAQUETTES.get(vue)!.CORPUS as NoteDeMaquette[] | undefined) ?? [];
}

/* ── Écarts connus entre variantes ────────────────────────────────────────────
   Deux divergences de valeur sur un même identifiant, relevées lors de la
   réconciliation. Le jeu complet fait foi ; `corpus.ts` retient ses valeurs.
   La liste est vérifiée à l'identique : ni écart supplémentaire toléré, ni
   écart disparu en silence. */
const ECARTS_CONNUS: readonly string[] = [
	/* 1. L'hôte nu au lieu de l'adresse entière, dans les quatre variantes
        réduites. La forme complète est retenue : elle permet de dériver
        l'hôte, l'inverse est impossible. */
	...[
		'V-01',
		'V-02',
		'V-03',
		'V-08',
		'V-09',
		'V-10',
		'V-11',
		'V-12',
		'V-13',
		'V-15',
		'V-16',
		'V-17',
		'V-18',
		'V-19',
		'V-21'
	].map((vue) => `${vue}|n-doc-barman|url`),
	/* 2. Une note interne donnée pour publique dans la seule V-09. Contredit
        RG-NOT-04 et le périmètre public ; « Interne » est retenu. */
	'V-09|n-doc-barman|visibilite'
];

/** Champs présents dans le jeu complet et absents des variantes réduites. Ce
 *  sont des enrichissements, pas des divergences : la valeur commune reste
 *  identique là où le champ existe des deux côtés. */
const ENRICHISSEMENTS_CONNUS: readonly string[] = [
	'CORPUS|n-doc-barman|ajoute',
	...['procedure', 'fiche-appli', 'retour', 'guide'].flatMap((t) => [
		`TEMPLATES|${t}|utilisations`,
		`TEMPLATES|${t}|defaut`
	]),
	'UNIVERS|Production|ordre',
	'UNIVERS|Projets|ordre'
];

/* ── 1. Emboîtement des jeux de notes ─────────────────────────────────────── */

describe('les variantes de corpus sont strictement emboîtées', () => {
	const idsComplets = corpusDeLaMaquette(VUE_DE_REFERENCE).map((n) => n.id);

	it('la vue de référence porte bien trente-deux notes', () => {
		expect(idsComplets).toHaveLength(32);
		expect(new Set(idsComplets).size).toBe(32);
	});

	it('les quarante et une vues ne portent que cinq jeux distincts', () => {
		const jeux = new Set(
			[...MAQUETTES.keys()].map((vue) =>
				corpusDeLaMaquette(vue)
					.map((n) => n.id)
					.join(',')
			)
		);
		expect(
			[...jeux].map((j) => (j === '' ? 0 : j.split(',').length)).sort((a, b) => b - a)
		).toEqual([32, 27, 19, 14, 0]);
	});

	for (const taille of [27, 19, 14] as const) {
		it(`le jeu de ${taille} notes est un sous-ensemble strict du jeu de 32`, () => {
			const vues = [...MAQUETTES.keys()].filter((v) => corpusDeLaMaquette(v).length === taille);
			expect(vues.length).toBeGreaterThan(0);
			for (const vue of vues) {
				const ids = corpusDeLaMaquette(vue).map((n) => n.id);
				expect(ids).toHaveLength(taille);
				expect(ids.every((id) => idsComplets.includes(id))).toBe(true);
				expect(ids.length).toBeLessThan(idsComplets.length);
				/* L'ordre des maquettes est préservé : le sous-jeu est une sous-suite. */
				const rangs = ids.map((id) => idsComplets.indexOf(id));
				expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
			}
		});
	}

	it("les jeux réduits s'emboîtent aussi entre eux : 27 ⊃ 19 ⊃ 14", () => {
		const jeu = (taille: number) => {
			const vue = [...MAQUETTES.keys()].find((v) => corpusDeLaMaquette(v).length === taille)!;
			return corpusDeLaMaquette(vue).map((n) => n.id);
		};
		const j27 = jeu(27),
			j19 = jeu(19),
			j14 = jeu(14);
		expect(j19.every((id) => j27.includes(id))).toBe(true);
		expect(j14.every((id) => j19.includes(id))).toBe(true);
	});

	it("aucun identifiant n'existe hors du jeu de trente-deux", () => {
		for (const vue of MAQUETTES.keys()) {
			for (const note of corpusDeLaMaquette(vue)) {
				expect(idsComplets, `${vue} porte ${note.id}`).toContain(note.id);
			}
		}
	});
});

/* ── 2. Identité des valeurs d'une variante à l'autre ─────────────────────── */

describe('une note commune porte partout les mêmes valeurs', () => {
	const parId = new Map(corpusDeLaMaquette(VUE_DE_REFERENCE).map((n) => [n.id, n]));

	const divergences: string[] = [];
	const absences: string[] = [];
	for (const vue of MAQUETTES.keys()) {
		if (vue === VUE_DE_REFERENCE) continue;
		for (const note of corpusDeLaMaquette(vue)) {
			const reference = parId.get(note.id)!;
			for (const champ of Object.keys(note)) {
				if (JSON.stringify(note[champ]) !== JSON.stringify(reference[champ])) {
					divergences.push(`${vue}|${note.id}|${champ}`);
				}
			}
			for (const champ of Object.keys(reference)) {
				if (!(champ in note)) absences.push(`CORPUS|${note.id}|${champ}`);
			}
		}
	}

	it('ne diverge que sur les deux écarts déclarés', () => {
		expect([...new Set(divergences)].sort()).toEqual([...ECARTS_CONNUS].sort());
	});

	it('les écarts déclarés portent bien les valeurs attendues', () => {
		const doc = (vue: IdentifiantDeVue) =>
			corpusDeLaMaquette(vue).find((n) => n.id === 'n-doc-barman')!;
		expect(doc('V-08').url).toBe('docs.pgbarman.org');
		expect(doc(VUE_DE_REFERENCE).url).toBe('https://docs.pgbarman.org/release/3.11/');
		expect(doc('V-09').visibilite).toBe('Publique');
		expect(doc(VUE_DE_REFERENCE).visibilite).toBe('Interne');
		/* corpus.ts retient les valeurs du jeu complet. */
		const retenue = CORPUS.find((n) => n.id === 'n-doc-barman')!;
		expect(retenue.url).toBe('https://docs.pgbarman.org/release/3.11/');
		expect(retenue.visibilite).toBe('Interne');
	});

	it('les champs absents des variantes réduites sont les enrichissements connus', () => {
		expect([...new Set(absences)].sort()).toEqual(
			[...new Set(ENRICHISSEMENTS_CONNUS.filter((e) => e.startsWith('CORPUS|')))].sort()
		);
	});
});

/* ── 3. Les autres objets de données suivent le même emboîtement ──────────── */

describe('les globales de données des quarante et une vues sont incluses dans la référence', () => {
	const reference = MAQUETTES.get(VUE_DE_REFERENCE)!;

	it('la vue de référence porte le sur-ensemble des noms de globales', () => {
		for (const [vue, globales] of MAQUETTES) {
			for (const nom of Object.keys(globales)) {
				expect(Object.keys(reference), `${vue} porte ${nom}`).toContain(nom);
			}
		}
	});

	it('aucune valeur ne diverge de la référence, hors écarts et enrichissements connus', () => {
		const cle = (o: unknown): string | null => {
			if (typeof o !== 'object' || o === null) return null;
			const e = o as Record<string, unknown>;
			for (const c of ['id', 'nom', 'terme', 'cle']) {
				if (typeof e[c] === 'string') return e[c] as string;
			}
			return null;
		};
		const divergences: string[] = [];
		const absences: string[] = [];
		for (const [vue, globales] of MAQUETTES) {
			if (vue === VUE_DE_REFERENCE) continue;
			for (const [nom, valeur] of Object.entries(globales)) {
				const attendue = reference[nom];
				if (JSON.stringify(valeur) === JSON.stringify(attendue)) continue;
				if (Array.isArray(valeur) && Array.isArray(attendue)) {
					const index = new Map(attendue.map((o) => [cle(o), o]));
					valeur.forEach((element, rang) => {
						const c = cle(element);
						const cible = (c !== null && index.get(c)) || attendue[rang];
						expect(
							cible,
							`${vue}.${nom}[${c ?? rang}] introuvable dans la référence`
						).toBeDefined();
						const a = element as Record<string, unknown>;
						const b = cible as Record<string, unknown>;
						for (const champ of Object.keys(a)) {
							if (JSON.stringify(a[champ]) !== JSON.stringify(b[champ])) {
								divergences.push(`${vue}|${nom}|${c ?? rang}|${champ}`);
							}
						}
						for (const champ of Object.keys(b)) {
							if (!(champ in a)) absences.push(`${nom}|${c ?? rang}|${champ}`);
						}
					});
				} else if (
					valeur !== null &&
					typeof valeur === 'object' &&
					attendue !== null &&
					typeof attendue === 'object'
				) {
					for (const [champ, v] of Object.entries(valeur as Record<string, unknown>)) {
						const w = (attendue as Record<string, unknown>)[champ];
						if (JSON.stringify(v) !== JSON.stringify(w)) divergences.push(`${vue}|${nom}|${champ}`);
					}
				} else {
					divergences.push(`${vue}|${nom}`);
				}
			}
		}
		/* Les seules divergences de valeur admises sont celles du corpus, déjà
       déclarées ; elles apparaissent ici avec le nom de la globale en tête. */
		const attenduesIci = ECARTS_CONNUS.map((e) => {
			const [vue, id, champ] = e.split('|');
			return `${vue}|CORPUS|${id}|${champ}`;
		});
		expect([...new Set(divergences)].sort()).toEqual([...attenduesIci].sort());
		expect([...new Set(absences)].sort()).toEqual([...new Set(ENRICHISSEMENTS_CONNUS)].sort());
	});
});

/* ── 4. corpus.ts est fidèle à la maquette de référence ───────────────────── */

/**
 * LE SEUL CHAMP QUE `corpus.ts` PORTE ET QUE LE GEL N'A JAMAIS EU.
 *
 * `CONFIG` transcrit le `window.CONFIG` du gel ; `Configuration` type le
 * RÉGLAGE D'INSTANCE du produit. Les deux ont partagé une forme tant que le
 * produit n'a eu que les sept réglages dessinés. `nomOrganisation` est le
 * huitième, et il n'est pas dessiné : huit vues écrivaient le nom de
 * l'organisation en dur, et aucune maquette n'offre le champ qui le règle.
 *
 * CE N'EST PAS UN MÉCANISME D'EXEMPTION, ET C'EST DÉLIBÉRÉ : une constante,
 * un champ, une globale nommée en clair dans le seul cas qui la lit. Une table
 * d'exemptions par globale se remplirait toute seule au lot suivant, et le
 * contrôle de fidélité au gel n'aurait plus rien à tenir.
 *
 * L'ÉCART NE REND PAS LE CONTRÔLE INOPÉRANT : le champ est vérifié ABSENT du
 * gel et PRÉSENT dans `corpus.ts` avant d'être écarté. Un champ que le gel
 * porterait, ou que `corpus.ts` aurait perdu, fait tomber le contrôle.
 */
const CHAMP_DE_CONFIG_HORS_GEL = 'nomOrganisation';

describe('corpus.ts reproduit la maquette de référence', () => {
	const reference = MAQUETTES.get(VUE_DE_REFERENCE)!;
	const semence: Record<string, unknown> = {
		ACTIVITE,
		COMPTES,
		CONFIG,
		CONTENU_VERSIONS,
		CONTRIBUTIONS,
		CORPUS,
		DETAIL_DOMAINES,
		DISTINCTIONS,
		DOMAINES,
		FORMATS_IMPORT,
		INSTANCE,
		JOURNAL_IMPORTS,
		LOT_IMPORT,
		MESURES_7J,
		MESURES_7J_PREC,
		MODIFICATIONS,
		MODULES,
		MOI,
		RECHERCHES,
		RELATIONS,
		RELATIONS_TECHNIQUES,
		RETENTION_VERSIONS,
		REVISIONS,
		TEMPLATES,
		TYPES_FICHE,
		TYPES_NOTE,
		TYPES_RELATION,
		UNIVERS,
		VERSIONS
	};

	it('exporte exactement les globales de données de la référence', () => {
		expect(Object.keys(semence).sort()).toEqual(Object.keys(reference).sort());
	});

	for (const nom of Object.keys({
		ACTIVITE,
		COMPTES,
		CONFIG,
		CONTENU_VERSIONS,
		CONTRIBUTIONS,
		CORPUS,
		DETAIL_DOMAINES,
		DISTINCTIONS,
		DOMAINES,
		FORMATS_IMPORT,
		INSTANCE,
		JOURNAL_IMPORTS,
		LOT_IMPORT,
		MESURES_7J,
		MESURES_7J_PREC,
		MODIFICATIONS,
		MODULES,
		MOI,
		RECHERCHES,
		RELATIONS,
		RELATIONS_TECHNIQUES,
		RETENTION_VERSIONS,
		REVISIONS,
		TEMPLATES,
		TYPES_FICHE,
		TYPES_NOTE,
		TYPES_RELATION,
		UNIVERS,
		VERSIONS
	})) {
		it(`${nom} est identique, valeur par valeur`, () => {
			const obtenu: unknown = JSON.parse(JSON.stringify(semence[nom]));
			if (nom === 'CONFIG') {
				expect(reference[nom]).not.toHaveProperty(CHAMP_DE_CONFIG_HORS_GEL);
				expect(obtenu).toHaveProperty(CHAMP_DE_CONFIG_HORS_GEL);
				delete (obtenu as Record<string, unknown>)[CHAMP_DE_CONFIG_HORS_GEL];
			}
			expect(obtenu).toEqual(reference[nom]);
		});
	}

	it("n'invente aucune note : les identifiants sont ceux de la maquette", () => {
		expect(CORPUS.map((n) => n.id)).toEqual(corpusDeLaMaquette(VUE_DE_REFERENCE).map((n) => n.id));
	});
});

/* ── 5. Chaque vue reçoit le jeu exact de sa maquette ─────────────────────── */

describe('corpusPourVue rend le jeu de semence de la maquette', () => {
	it('couvre les quarante et une vues, et elles seules', () => {
		expect(Object.keys(VARIANTE_PAR_VUE).sort()).toEqual([...MAQUETTES.keys()].sort());
		expect(FICHIERS).toHaveLength(41);
	});

	for (const fichier of FICHIERS) {
		const vue = VUE_DU_FICHIER.get(fichier)!;
		it(`${vue} — mêmes notes des deux côtés`, () => {
			const attendu = corpusDeLaMaquette(vue).map((n) => n.id);
			expect(corpusPourVue(vue).map((n) => n.id)).toEqual(attendu);
		});
	}

	it('les tables de variantes sont cohérentes entre elles', () => {
		for (const [variante, vues] of Object.entries(VUES_PAR_VARIANTE) as [
			Variante,
			IdentifiantDeVue[]
		][]) {
			for (const vue of vues) expect(VARIANTE_PAR_VUE[vue]).toBe(variante);
			expect(corpusDeVariante(variante).map((n) => n.id)).toEqual([...IDS_PAR_VARIANTE[variante]]);
		}
		expect(IDS_PAR_VARIANTE.vide).toEqual([]);
		expect(VUES_PAR_VARIANTE.vide).toEqual(['V-05', 'V-06']);
	});
});

/* ── 6. La date de référence est celle que les maquettes imposent ─────────── */

describe('la date de référence est déduite des maquettes', () => {
	const enJour = (date: string, jours: number): string => {
		const [j = 0, m = 0, a = 0] = date.split('/').map(Number);
		return new Date(Date.UTC(a, m - 1, j) + jours * 86_400_000).toISOString().slice(0, 10);
	};

	it('le corpus, les révisions et les versions convergent sur DATE_REFERENCE', () => {
		const dates: string[] = [];
		for (const note of CORPUS) if (note.revise) dates.push(enJour(note.revise, note.jours));
		for (const demande of REVISIONS) dates.push(enJour(demande.le, demande.jours));
		for (const versions of Object.values(VERSIONS)) {
			for (const v of versions ?? []) dates.push(enJour(v.date, v.jours));
		}
		const majoritaire = dates.filter((d) => d === DATE_REFERENCE).length;
		expect(majoritaire).toBe(dates.length - 2);
		expect(majoritaire / dates.length).toBeGreaterThan(0.95);
	});

	it('les deux seules dérivations discordantes sont les notes obsolètes connues', () => {
		const discordantes = CORPUS.filter(
			(n) => n.revise && enJour(n.revise, n.jours) !== DATE_REFERENCE
		).map((n) => n.id);
		expect(discordantes.sort()).toEqual(['n-sig-facturation', 'n-srv-app-01']);
		for (const id of discordantes) {
			/* Écart d'un jour sur des notes obsolètes depuis plus de sept mois : le
         libellé est arrondi au mois, l'écart y est invisible. */
			expect(CORPUS.find((n) => n.id === id)!.fraicheur).toBe('obs');
		}
	});

	/* Le niveau attendu est CALCULÉ PAR L'IMPLÉMENTATION UNIQUE, jamais rejoué
	   ici. ADR-005 interdit « tout recalcul local de la fraîcheur : dans un
	   composant de vue, dans une requête SQL, […] ou DANS UN TEST ». Un test qui
	   réécrit le calcul ne prouve plus que le corpus est cohérent avec le
	   produit : il prouve qu'il est cohérent avec lui-même. */
	it('est cohérente avec les seuils de fraîcheur déclarés', () => {
		const seuils = { frais: CONFIG.seuilFrais, vieillissant: CONFIG.seuilVieillissant };
		for (const note of CORPUS) {
			expect(note.fraicheur, note.id).toBe(niveauFraicheur(note.jours, seuils));
		}
	});
});
