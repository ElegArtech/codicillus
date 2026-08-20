/**
 * LES UNITAIRES DU PÉRIMÈTRE D'INDEX — les décisions, sans moteur et sans base.
 *
 * Ce qui exige le moteur est la commande d'épreuve (`recherche/recherche.mjs
 * epreuve`, sept personas contre l'index réel) ; les mêler ici rendrait
 * `pnpm test:unit` dépendant de Docker, et une batterie qui ne s'exécute pas ne
 * prouve rien.
 *
 * QUATRE PROPRIÉTÉS Y SONT ÉPROUVÉES, ET CHACUNE A UN CAS QUI LA SOLLICITE —
 * `P-5` et `P-26` : un contrôle dont l'unique cas est l'état du dépôt devient
 * inerte le jour où le dépôt change.
 *
 *   1. **la réduction anonyme d'`ADR-006` est EXACTE.** Le filtre envoyé au
 *      moteur pour un anonyme ne mentionne aucun dossier ; l'ensemble qu'il
 *      décrit doit être RIGOUREUSEMENT celui que `resolution.ts` rend en
 *      composant `perimetreAnonyme()` et `noteVisibleEnAnonyme()`. Les corpus
 *      sont SYNTHÉTIQUES, et l'un d'eux porte le cas que le corpus livré n'a
 *      pas : une note publique en BROUILLON ;
 *   2. **aucun chemin dérogatoire en anonyme.** Même avec un périmètre total en
 *      main, l'anonyme reçoit le filtre réduit ;
 *   3. **une facette ne peut pas élargir un périmètre**, ni en rouvrir un fermé ;
 *   4. **le mode « Sens » est indisponible parce qu'aucun embedder n'est
 *      déclaré** — le constat est dérivé des réglages, pas écrit.
 */
import { describe, expect, it } from 'vitest';
import {
	ANONYME,
	type DossierDeLArbre,
	type NotePourPerimetre,
	identiteAuthentifiee,
	indexerLesDroits,
	noteLisible,
	noteVisibleEnAnonyme,
	perimetreDeLecture
} from '../droits/resolution';
import {
	FILTRE_ANONYME,
	FILTRE_TOTAL,
	clausesDeFacette,
	filtreComplet,
	filtreDuPerimetre,
	valeurDeFiltre
} from './perimetre';
import { REGLAGES_DE_L_INDEX, SENS_DISPONIBLE } from './notes-indexees';

/* ═══════════════════════════════════════ Le décor ══════════════════════ */

/** Trois étages et deux sous-arbres : un droit sur l'un n'ouvre jamais l'autre. */
const ARBRE: readonly DossierDeLArbre[] = [
	{ id: 'racine', parentId: null },
	{ id: 'intermediaire', parentId: 'racine' },
	{ id: 'feuille', parentId: 'intermediaire' },
	{ id: 'ailleurs', parentId: null }
];

interface NoteDEpreuve extends NotePourPerimetre {
	readonly cle: string;
}

function note(
	cle: string,
	dossierId: string,
	visibilite: 'interne' | 'publique',
	statut: 'brouillon' | 'publiee'
): NoteDEpreuve {
	return { cle, dossierId, visibilite, statut };
}

/** L'ensemble que `resolution.ts` rend — les DEUX filtres composés. */
function parLaResolution(notes: readonly NoteDEpreuve[]): ReadonlySet<string> {
	const index = indexerLesDroits(ARBRE);
	const perimetre = perimetreDeLecture(ANONYME, index, notes);
	return new Set(notes.filter((n) => noteLisible(ANONYME, n, perimetre)).map((n) => n.cle));
}

/**
 * L'ensemble que décrit le filtre réduit d'`ADR-006` — publique ET publiée, et
 * rien sur le dossier. La condition est celle de `resolution.ts` elle-même :
 * ce test compare deux LECTURES du même module, jamais une réécriture.
 */
function parLeFiltreReduit(notes: readonly NoteDEpreuve[]): ReadonlySet<string> {
	return new Set(notes.filter(noteVisibleEnAnonyme).map((n) => n.cle));
}

/* ═══════════════════════════════════════ 1. La réduction ═══════════════ */

describe('la réduction anonyme d’ADR-006 est exacte, pas approchée', () => {
	const corpus: readonly { nom: string; notes: readonly NoteDEpreuve[] }[] = [
		{
			nom: 'une note publique profonde, et ses voisines internes',
			notes: [
				note('publique-profonde', 'feuille', 'publique', 'publiee'),
				note('interne-voisine', 'feuille', 'interne', 'publiee'),
				note('interne-au-dessus', 'intermediaire', 'interne', 'publiee'),
				note('interne-a-la-racine', 'racine', 'interne', 'publiee')
			]
		},
		{
			nom: 'le cas que le corpus livré n’a pas — publique en BROUILLON',
			notes: [
				note('publique-brouillon', 'feuille', 'publique', 'brouillon'),
				note('publique-publiee', 'racine', 'publique', 'publiee')
			]
		},
		{
			nom: 'un second sous-arbre, entièrement interne',
			notes: [
				note('publique-ici', 'racine', 'publique', 'publiee'),
				note('interne-ailleurs', 'ailleurs', 'interne', 'publiee')
			]
		},
		{
			nom: 'aucune note publique — le périmètre est vide des deux côtés',
			notes: [
				note('interne-1', 'feuille', 'interne', 'publiee'),
				note('interne-2', 'ailleurs', 'interne', 'brouillon')
			]
		}
	];

	for (const cas of corpus) {
		it(`rend le même ensemble que resolution.ts — ${cas.nom}`, () => {
			expect([...parLeFiltreReduit(cas.notes)].sort()).toEqual(
				[...parLaResolution(cas.notes)].sort()
			);
		});
	}

	it('n’est pas inerte : le brouillon public sort d’un côté comme de l’autre', () => {
		/* Le contrôle positif de la comparaison ci-dessus. Sans lui, deux
		   ensembles vides seraient déclarés égaux et le test ne prouverait rien. */
		const notes = [
			note('publique-brouillon', 'feuille', 'publique', 'brouillon'),
			note('publique-publiee', 'feuille', 'publique', 'publiee')
		];
		expect([...parLaResolution(notes)]).toEqual(['publique-publiee']);
		expect(parLaResolution(notes).has('publique-brouillon')).toBe(false);
	});

	it('DIVERGE sur une note dont le dossier n’est pas dans l’arbre — et voici les deux gardes', () => {
		/* LE SEUL CAS OÙ LA RÉDUCTION N'EST PAS EXACTE, mesuré et non supposé.
		   `resolution.ts` FERME : la chaîne d'ancêtres d'un dossier inconnu est
		   vide, le dossier n'entre donc pas dans le périmètre anonyme, et
		   `noteLisible()` refuse. Le filtre réduit, lui, OUVRE : la note est
		   publique et publiée, et c'est tout ce qu'il regarde.

		   CE CAS EST INATTEIGNABLE PAR LE PRODUIT, et par DEUX chemins
		   indépendants — ce qui est la seule raison acceptable de le laisser
		   diverger plutôt que de refermer le filtre :

		     1. le schéma l'interdit — `notes.dossier_id` est tenu par une clé
		        étrangère composée vers `dossiers` (`notes_dossier_du_meme_domaine`) :
		        une note ne peut pas désigner un dossier qui n'existe pas ;
		     2. la projection le REFUSE — `projeterLeCorpus()` lève quand la chaîne
		        d'ancêtres est vide, au nom de la dernière interdiction d'`ADR-006` :
		        « un document indexé sans périmètre est un document public ».

		   Sans ce test, la divergence resterait une propriété que personne n'a
		   mesurée. Elle est ici, chiffrée, avec ce qui la rend inoffensive. */
		const notes = [note('hors-arbre', 'dossier-fantome', 'publique', 'publiee')];
		expect([...parLaResolution(notes)]).toEqual([]);
		expect([...parLeFiltreReduit(notes)]).toEqual(['hors-arbre']);
	});

	it('le dossier d’une note publique et publiée est toujours dans le périmètre anonyme', () => {
		/* La raison POUR LAQUELLE la réduction est exacte, éprouvée directement :
		   `perimetreAnonyme()` est construit à partir de ces notes-là. */
		const notes = [note('publique-profonde', 'feuille', 'publique', 'publiee')];
		const perimetre = perimetreDeLecture(ANONYME, indexerLesDroits(ARBRE), notes);
		expect(perimetre.tout).toBe(false);
		if (!perimetre.tout) {
			expect([...perimetre.dossiers].sort()).toEqual(['feuille', 'intermediaire', 'racine']);
		}
	});
});

/* ═══════════════════════════════════════ 2. Les trois régimes ══════════ */

describe('le filtre de périmètre — trois régimes, aucun chemin dérogatoire', () => {
	it('rend le filtre réduit à l’anonyme, MÊME muni d’un périmètre total', () => {
		/* `ADR-006` : « tout chemin dérogatoire en anonyme » est interdit. Le
		   régime anonyme sort en premier, donc aucun périmètre présenté ne peut
		   l’élargir — pas même celui de l’administrateur. */
		const filtre = filtreDuPerimetre(ANONYME, { tout: true });
		expect(filtre).toEqual({ interroger: true, filtre: FILTRE_ANONYME });
	});

	it('rend le filtre réduit à l’anonyme muni d’un périmètre de dossiers', () => {
		const filtre = filtreDuPerimetre(ANONYME, {
			tout: false,
			dossiers: new Set(['racine', 'feuille'])
		});
		expect(filtre).toEqual({ interroger: true, filtre: FILTRE_ANONYME });
	});

	it('exige les DEUX moitiés du périmètre public', () => {
		expect(FILTRE_ANONYME).toContain('visibilite = "publique"');
		expect(FILTRE_ANONYME).toContain('statut = "publiee"');
		expect(FILTRE_ANONYME).toContain(' AND ');
	});

	it('rend un filtre TOTAL à l’administrateur, jamais l’absence de filtre', () => {
		const filtre = filtreDuPerimetre(identiteAuthentifiee('c-admin', 'administrateur'), {
			tout: true
		});
		expect(filtre).toEqual({ interroger: true, filtre: FILTRE_TOTAL });
		/* Il reste un filtre, et il exige un périmètre : `ADR-006` — « un document
		   indexé sans périmètre est un document public ». */
		expect(FILTRE_TOTAL).toContain('dossier');
	});

	it('n’interroge PAS le moteur quand le périmètre est vide (RG-DRO-02)', () => {
		const filtre = filtreDuPerimetre(identiteAuthentifiee('c-1', 'contributeur'), {
			tout: false,
			dossiers: new Set()
		});
		expect(filtre.interroger).toBe(false);
	});

	it('interroge sur le DOSSIER PORTEUR, jamais sur la chaîne d’ancêtres', () => {
		const filtre = filtreDuPerimetre(identiteAuthentifiee('c-1', 'contributeur'), {
			tout: false,
			dossiers: new Set(['feuille', 'racine'])
		});
		expect(filtre).toEqual({
			interroger: true,
			filtre: 'dossier IN ["feuille", "racine"]'
		});
		if (filtre.interroger) expect(filtre.filtre).not.toContain('ancetres');
	});

	it('rend la même chaîne pour le même ensemble, quel que soit l’ordre d’insertion', () => {
		const a = filtreDuPerimetre(identiteAuthentifiee('c-1', 'contributeur'), {
			tout: false,
			dossiers: new Set(['b', 'a', 'c'])
		});
		const b = filtreDuPerimetre(identiteAuthentifiee('c-1', 'contributeur'), {
			tout: false,
			dossiers: new Set(['c', 'b', 'a'])
		});
		expect(a).toEqual(b);
	});
});

/* ═══════════════════════════════════════ L'échappement ═════════════════ */

describe('les valeurs de filtre — rien n’est composé sans être échappé', () => {
	it('entoure de guillemets et échappe le guillemet', () => {
		expect(valeurDeFiltre('un "mot"')).toBe('"un \\"mot\\""');
	});

	it('échappe la contre-oblique avant le guillemet', () => {
		expect(valeurDeFiltre('a\\b')).toBe('"a\\\\b"');
	});

	it('ne laisse pas une valeur fermer la clause et en ouvrir une autre', () => {
		const valeur = '" OR visibilite = "interne';
		const echappee = valeurDeFiltre(valeur);
		/* La seule façon de le prouver sans réimplémenter l'analyseur du moteur :
		   aucun guillemet non échappé ne subsiste à l'intérieur. */
		expect(echappee.slice(1, -1)).not.toMatch(/(^|[^\\])"/);
	});
});

/* ═══════════════════════════════════════ 3. Les facettes ═══════════════ */

describe('les facettes — elles restreignent, elles n’élargissent jamais', () => {
	it('ne traduit que les facettes qui ont un champ dans l’index', () => {
		const clauses = clausesDeFacette(
			new URLSearchParams('domaine=Infra&type=Proc%C3%A9dure&fraicheur=Obsol%C3%A8te&q=mot')
		);
		expect(clauses).toEqual(['domaine IN ["Infra"]', 'type IN ["Procédure"]']);
	});

	it('met les valeurs d’une même facette en OU, par une seule clause', () => {
		expect(clausesDeFacette(new URLSearchParams('domaine=A&domaine=B'))).toEqual([
			'domaine IN ["A", "B"]'
		]);
	});

	it('joint les facettes au périmètre par ET, le périmètre en premier', () => {
		const complet = filtreComplet({ interroger: true, filtre: FILTRE_ANONYME }, [
			'domaine IN ["A"]'
		]);
		expect(complet).toEqual({
			interroger: true,
			filtre: `(${FILTRE_ANONYME}) AND (domaine IN ["A"])`
		});
	});

	it('ne rouvre JAMAIS un périmètre fermé, quelles que soient les facettes', () => {
		const ferme = { interroger: false, motif: 'essai' } as const;
		expect(filtreComplet(ferme, ['domaine IN ["A"]', 'statut IN ["Publiee"]'])).toEqual(ferme);
	});

	it('laisse le périmètre intact quand aucune facette n’est demandée', () => {
		const perimetre = { interroger: true, filtre: FILTRE_TOTAL } as const;
		expect(filtreComplet(perimetre, [])).toEqual(perimetre);
	});
});

/* ═══════════════════════════════════════ 4. Le mode « Sens » ═══════════ */

describe('le mode « Sens » — déclaré indisponible, jamais simulé', () => {
	it('n’est pas disponible', () => {
		expect(SENS_DISPONIBLE).toBe(false);
	});

	it('ne l’est pas par constat : aucun embedder n’est déclaré dans les réglages', () => {
		expect(REGLAGES_DE_L_INDEX.embedders).toBeUndefined();
	});

	it('déclare filtrables les quatre champs du périmètre', () => {
		for (const champ of ['dossier', 'ancetres', 'visibilite', 'statut']) {
			expect(REGLAGES_DE_L_INDEX.filterableAttributes).toContain(champ);
		}
	});

	it('ne rend PAS la fraîcheur filtrable ni triable — P-01, une seule définition', () => {
		expect(REGLAGES_DE_L_INDEX.filterableAttributes).not.toContain('fraicheur');
		expect(REGLAGES_DE_L_INDEX.sortableAttributes).not.toContain('fraicheur');
	});
});
