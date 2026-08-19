/**
 * Batterie 17 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `verif/vocabulaire.mjs` rend un verdict à quatre natures sur 265 états et
 * deux côtés. Sa justesse tient dans quatre décisions minuscules, dont aucune
 * ne se voit dans un vert global :
 *
 *   1. LA CLÉ DE RAPPROCHEMENT, DANS LES DEUX SENS. C'est la leçon
 *      d'ÉCART-041, écrite au sang : la clé de la batterie 10 embarquait un
 *      `textContent` brut, Svelte élague les nœuds de texte blancs d'un côté
 *      et pas de l'autre (P-8), et 31 défauts de portage sur 31 étaient faux.
 *      Une jointure produit deux fautes symétriques — sur-rapprocher masque un
 *      défaut réel, sous-rapprocher en fabrique un faux. LES DEUX sont figés
 *      ici, sur les chaînes RÉELLES d'ÉCART-041 ;
 *   2. l'exonération s'applique PAR RECOUVREMENT D'INDICES, jamais « ce nœud
 *      contient quelque part un contexte exonérant ». Sans cela, un nœud qui
 *      dit « Cette page … 12 documents » verrait son « documents » absous par
 *      son « Cette page » ;
 *   3. le DÉFAUT est la violation, jamais l'inverse. Une famille sans
 *      exonération applicable compte l'occurrence, et c'est ce qui rend
 *      l'instrument conservateur : il peut crier trop fort, jamais se taire ;
 *   4. l'épreuve des familles est le SEUL moyen de savoir qu'une interdiction
 *      sans occurrence marche. « tag » n'apparaît nulle part dans le corpus :
 *      son silence est un succès ou une panne, et rien d'autre ne les sépare.
 *
 * Ils s'exécutent sans navigateur et sans serveur — c'est ce qui permet de les
 * jouer à chaque `pnpm test:unit`, et donc de les jouer vraiment.
 */
import { describe, it, expect } from 'vitest';
import {
	cleDe,
	cleLache,
	classer,
	compter,
	eprouverLesExonerations,
	eprouverLesFamilles,
	EXONERATIONS,
	normaliser,
	releverFiche,
	repliLache,
	sansBlancs,
	scanner,
	scannerIdentifiant,
	segmenter,
	separerCommentaires,
	sousRapprochement,
	surRapprochement,
	SYNONYMES,
	TERMES
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './vocabulaire.mjs';

type Occurrence = {
	famille: string;
	terme: string;
	registre: string;
	forme: string;
	champ: string;
	contexte: string;
	extrait: string;
	position: number;
	exoneration: string | null;
};

const emplois = (texte: string, champ = 'texte'): Occurrence[] =>
	(scanner(texte, champ) as Occurrence[]).filter((o) => !o.exoneration);

describe('la table elle-même', () => {
	it('couvre les douze termes contractuels dans sa table de référence', () => {
		expect(TERMES.map((t: { terme: string }) => t.terme)).toEqual([
			'Note',
			'Fiche',
			'Registre',
			'Univers',
			'Domaine',
			'Dossier',
			'Étiquette',
			'Relation',
			'Signet',
			'Fraîcheur',
			'Vérifier',
			'Console'
		]);
	});

	it('n’a aucune famille dont l’épreuve échoue — le contrôle joué avant mesure', () => {
		expect(eprouverLesFamilles()).toEqual([]);
	});

	it('porte, pour chaque famille, une trace et deux spécimens', () => {
		for (const s of SYNONYMES) {
			expect(s.trace, s.famille).toBeTruthy();
			expect(s.epreuve.positif, s.famille).toBeTruthy();
			expect(s.epreuve.negatif, s.famille).toBeTruthy();
			expect(['tracé', 'décidé'], s.famille).toContain(s.registre);
		}
	});

	it('ne déclare que des synonymes de termes contractuels', () => {
		const termes = new Set(TERMES.map((t: { terme: string }) => t.terme));
		for (const s of SYNONYMES) expect(termes.has(s.terme), s.famille).toBe(true);
	});

	it('n’a aucune exonération orpheline — chacune vise une famille déclarée', () => {
		const familles = new Set(SYNONYMES.map((s: { famille: string }) => s.famille));
		for (const e of EXONERATIONS) expect(familles.has(e.famille), e.cle).toBe(true);
	});

	it('rend inertes les exonérations qu’aucune occurrence ne déclenche', () => {
		// Le contrôle de §7 : sur un relevé vide, TOUTES sont inertes.
		expect(eprouverLesExonerations([])).toHaveLength(EXONERATIONS.length);
		// Et sur un relevé qui les déclenche toutes, aucune.
		const toutes = EXONERATIONS.map((e: { cle: string }) => ({ exoneration: e.cle }));
		expect(eprouverLesExonerations(toutes)).toEqual([]);
	});
});

describe('la normalisation', () => {
	it('replie les blancs typographiques français sans toucher aux apostrophes', () => {
		expect(normaliser('12 notes : page⁠3')).toBe('12 notes : page 3');
		expect(normaliser('page d’accueil')).toBe('page d’accueil');
	});

	it('replie les accents combinants — deux chaînes, un seul mot', () => {
		expect(normaliser('répertoire')).toBe('répertoire');
	});
});

describe('la détection, et les homographes', () => {
	it('relève « document » quand il désigne une note', () => {
		const o = emplois('Ce document a été vérifié il y a 12 jours.');
		expect(o.map((x) => x.famille)).toEqual(['document']);
	});

	it('ne relève pas « documentation » — la frontière de mot tient', () => {
		expect(emplois('La documentation de la direction technique.')).toEqual([]);
	});

	it('ne relève pas « affiche », « afficher », « affichage » pour la famille fiche', () => {
		// Le piège du cercle 2 : « fiche » est dans « affiche ». La règle
		// `RE_FICHE` a les mêmes frontières que les familles, et c'est le seul
		// motif pour lequel ce cas est figé ici.
		for (const mot of ['affiche', 'afficher', 'affichage', 'afficherContexte'])
			expect(
				segmenter(mot).some((s: string) => /^fiches?$/i.test(s)),
				mot
			).toBe(false);
	});

	it('exonère l’écran courant, la pagination, le papier, l’externe et l’idiome', () => {
		const cas: [string, string][] = [
			['Cette page n’est pas accessible.', 'page:rendu'],
			['Page introuvable', 'page:rendu'],
			['ouvre la recherche sans quitter la page.', 'page:locatif'],
			['Vous devez être connecté pour accéder à cette page', 'page:locatif'],
			['180 notes · 20 par page', 'page:pagination'],
			['réservé au titre de la note, affiché en tête de page.', 'page:papier'],
			['Page d’état de l’hébergeur', 'page:web-externe'],
			['plutôt que de repartir d’une page blanche.', 'page:vierge'],
			['la navigation au clavier repart du haut du document.', 'document:html'],
			['Articles de l’éditeur sur les erreurs de traitement', 'article:publication-externe'],
			['Guide utilisateur', 'guide:type-de-note'],
			['ANSSI — guide d’hygiène informatique', 'guide:publication-externe'],
			[
				'barman recover écrase intégralement le répertoire de données de la cible.',
				'répertoire:système-de-fichiers'
			]
		];
		for (const [texte, cle] of cas) {
			const o = scanner(texte) as Occurrence[];
			expect(o.length, texte).toBeGreaterThan(0);
			expect(
				o.map((x) => x.exoneration),
				texte
			).toContain(cle);
		}
	});

	it('N’EXONÈRE PAS par voisinage : l’exonération doit RECOUVRIR l’occurrence', () => {
		// Un nœud qui porte à la fois un emploi légitime et un emploi fautif.
		// Sans le recouvrement par indices, « documents » serait absous par
		// « Cette page », et le défaut disparaîtrait sans trace.
		const o = scanner('Depuis cette page, ranger 12 documents du domaine.') as Occurrence[];
		const parFamille = Object.fromEntries(o.map((x) => [x.famille, x.exoneration]));
		expect(parFamille.page).toBe('page:locatif');
		expect(parFamille.document).toBeNull();
	});

	it('N’EXONÈRE PAS un emploi fautif que le seul déterminant rendrait innocent', () => {
		// La première rédaction exonérait « déterminant + page », donc celle-ci.
		// L'épreuve de la famille l'a refusée : une exonération qui absout le
		// spécimen positif rend la famille inerte sans que rien ne le dise.
		expect(emplois('Ranger cette page dans un dossier du domaine.')).toHaveLength(1);
		expect(emplois('Cette page a été vérifiée il y a 12 jours.')).toHaveLength(1);
	});

	it('compte le pluriel, la majuscule et l’accent absent', () => {
		expect(emplois('Les Documents du dossier')).toHaveLength(1);
		expect(emplois('Deplacer la note dans un autre repertoire.')).toHaveLength(1);
	});

	it('relève dans les attributs de texte, et le champ est conservé', () => {
		const o = emplois('Supprimer ce document', 'aria-label');
		expect(o[0].champ).toBe('aria-label');
	});
});

describe('les identifiants — le cercle 2', () => {
	it('segmente les quatre conventions de nommage du dépôt', () => {
		expect(segmenter('page-signet__tete')).toEqual(['page', 'signet', 'tete']);
		expect(segmenter('motFiche')).toEqual(['mot', 'Fiche']);
		expect(segmenter('/guides/{identifiant}')).toEqual(['guides', 'identifiant']);
		expect(segmenter('data-vers')).toEqual(['data', 'vers']);
	});

	it('ne relève un identifiant que sur un segment ENTIER', () => {
		expect(scannerIdentifiant('page-signet', 'classe')).toHaveLength(1);
		// « documentation » n'est pas « document », même en segment.
		expect(scannerIdentifiant('documentation', 'classe')).toHaveLength(0);
		// et « paginateur » n'est pas « page ».
		expect(scannerIdentifiant('paginateur', 'classe')).toHaveLength(0);
	});

	it('ne porte AUCUNE exonération sur les identifiants — ils n’ont pas de contexte', () => {
		const o = scannerIdentifiant('page-suivante', 'classe') as Occurrence[];
		expect(o).toHaveLength(1);
		expect(o[0].exoneration).toBeNull();
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   LA CLÉ DE RAPPROCHEMENT — LES DEUX SENS, SUR LES CHAÎNES RÉELLES D'ÉCART-041

   « Toute clé de rapprochement doit être éprouvée dans les deux sens — un cas
   qui doit se rapprocher, et un cas qui ne doit pas. C'est P-5 appliqué à une
   jointure. » (ÉCART-041, « La leçon, et elle est neuve »).
   ═════════════════════════════════════════════════════════════════════════ */

describe('la clé de rapprochement', () => {
	const occ = (contexte: string): Occurrence => ({
		famille: 'document',
		terme: 'Note',
		registre: 'tracé',
		forme: 'document',
		champ: 'texte',
		contexte,
		extrait: contexte,
		position: 0,
		exoneration: null
	});

	it('SENS 1 — rapproche ce qui DOIT se rapprocher : les blancs d’ÉCART-041', () => {
		// Les trois paires mesurées dans ÉCART-041, gel contre application.
		// Chacune ne diffère QUE par des blancs élagués par le compilateur
		// Svelte (P-8). Une clé qui les sépare fabrique du faux portage.
		const paires: [string, string][] = [
			['un document RétentionÉtat 20260810T', 'un document RétentionÉtat20260810T'],
			['Date Source et scénario document Auteur', 'DateSource et scénariodocument Auteur'],
			['un document périmètreLa cartographie', 'un document périmètre La cartographie']
		];
		for (const [gel, app] of paires) {
			expect(cleDe(occ(gel)), gel).toBe(cleDe(occ(app)));
			const lignes = classer([occ(gel)], [occ(app)]);
			expect(
				lignes.map((l: { nature: string }) => l.nature),
				gel
			).toEqual(['gel']);
		}
	});

	it('SENS 2 — ne rapproche PAS ce qui ne doit pas : deux contextes réels distincts', () => {
		const a = occ('Les liens entre documents sont résolus automatiquement');
		const b = occ('Image isolée, sans document qui la référence');
		expect(cleDe(a)).not.toBe(cleDe(b));
		const lignes = classer([a], [b]);
		// Un de chaque : rien ne se confond, et les deux natures apparaissent.
		expect(new Set(lignes.map((l: { nature: string }) => l.nature))).toEqual(
			new Set(['portage', 'gel-non-reporte'])
		);
	});

	it('sépare les champs : le même texte en libellé et en `aria-label` sont deux', () => {
		const a = { ...occ('Supprimer ce document'), champ: 'texte' };
		const b = { ...occ('Supprimer ce document'), champ: 'aria-label' };
		expect(cleDe(a)).not.toBe(cleDe(b));
	});

	it('sépare une occurrence exonérée d’une occurrence qui ne l’est pas', () => {
		const a = { ...occ('haut du document'), exoneration: 'document:html' };
		const b = occ('haut du document');
		expect(cleDe(a)).not.toBe(cleDe(b));
	});

	it('CONTRÔLE DE SUR-RAPPROCHEMENT — il détecte la confusion quand elle existe', () => {
		// Deux contextes strictement distincts qui ne diffèrent que par un blanc :
		// la clé les confond DÉLIBÉRÉMENT, et le contrôle doit le dire, pour que
		// le rapport puisse en rendre compte plutôt que de le taire.
		const confus = surRapprochement([occ('un document A B'), occ('un document AB')]);
		expect(confus).toHaveLength(1);
		// Et il ne crie pas sur des contextes que la clé sépare correctement.
		expect(surRapprochement([occ('un document A'), occ('un document B')])).toEqual([]);
	});

	it('CONTRÔLE DE SOUS-RAPPROCHEMENT — il rattrape un faux portage', () => {
		// La faute exacte d'ÉCART-041, poussée d'un cran : une différence de
		// PONCTUATION que la clé stricte sépare et que le repli lâche réunit.
		// Le contrôle doit lever la main, jamais l'instrument conclure.
		const portage = occ('Les liens entre documents sont résolus.');
		const gel = occ('Les liens entre documents sont résolus');
		expect(cleDe(portage)).not.toBe(cleDe(gel));
		expect(cleLache(portage)).toBe(cleLache(gel));
		expect(sousRapprochement([portage], [gel])).toHaveLength(1);
		// Et il ne lève pas la main sur un portage réel.
		expect(sousRapprochement([portage], [occ('tout autre chose')])).toEqual([]);
	});

	it('le repli lâche efface casse, accents, blancs et ponctuation — et rien de plus', () => {
		expect(repliLache('Rép., ertoire')).toBe(repliLache('rep ertoire'));
		expect(repliLache('note')).not.toBe(repliLache('notes'));
	});

	it('sansBlancs est stable sous l’élagage de Svelte, et seulement sous lui', () => {
		expect(sansBlancs('a b c')).toBe(sansBlancs('ab c'));
		expect(sansBlancs('abc')).not.toBe(sansBlancs('abd'));
	});
});

describe('le classement en natures', () => {
	const o = (contexte: string, famille = 'document'): Occurrence => ({
		famille,
		terme: 'Note',
		registre: 'tracé',
		forme: famille,
		champ: 'texte',
		contexte,
		extrait: contexte,
		position: 0,
		exoneration: null
	});

	it('commun → gel ; surplus application → portage ; surplus gel → gel non reporté', () => {
		const lignes = classer([o('commun'), o('au gel seul')], [o('commun'), o('à l’app seule')]);
		const parNature = Object.fromEntries(
			lignes.map((l: { nature: string; contexte: string }) => [l.nature, l.contexte])
		);
		expect(parNature.gel).toBe('commun');
		expect(parNature.portage).toBe('à l’app seule');
		expect(parNature['gel-non-reporte']).toBe('au gel seul');
	});

	it('compte les multiplicités, et n’impute au portage que le SURPLUS', () => {
		const lignes = classer([o('x')], [o('x'), o('x'), o('x')]);
		const g = lignes.find((l: { nature: string }) => l.nature === 'gel');
		const p = lignes.find((l: { nature: string }) => l.nature === 'portage');
		expect(g.occurrences).toBe(1);
		expect(p.occurrences).toBe(2);
	});

	it('n’invente aucun portage quand les deux côtés disent la même chose', () => {
		const lignes = classer([o('x'), o('y')], [o('y'), o('x')]);
		expect(lignes.every((l: { nature: string }) => l.nature === 'gel')).toBe(true);
	});

	it('compter regroupe par clé et non par objet', () => {
		expect(compter([o('x'), o('x')]).size).toBe(1);
	});
});

describe('la séparation du code et des commentaires — le cercle 3', () => {
	it('retire les trois formes de commentaire du dépôt', () => {
		const src = [
			'<!-- un document en balisage -->',
			'/* un document en bloc */',
			'// un document en ligne',
			'const x = "un document en code";'
		].join('\n');
		const { code, commentaires } = separerCommentaires(src, '.svelte');
		expect(emplois(code)).toHaveLength(1);
		expect(emplois(commentaires)).toHaveLength(3);
	});

	it('préserve les numéros de ligne — le rapport cite un emplacement, pas un rang', () => {
		const src = '/* a\nb\nc */\nconst x = 1;';
		const { code } = separerCommentaires(src, '.ts');
		expect(code.split('\n')).toHaveLength(4);
		expect(code.split('\n')[3]).toBe('const x = 1;');
	});

	it('ne prend pas une adresse pour un commentaire de fin de ligne', () => {
		const { code } = separerCommentaires('const u = "https://x/document";', '.ts');
		expect(emplois(code)).toHaveLength(1);
	});

	it('laisse les `//` tranquilles dans une feuille de style', () => {
		const { commentaires } = separerCommentaires('.a { background: url(//x/document); }', '.css');
		expect(commentaires).toBe('');
	});
});

describe('le registre « fiche » — la règle inverse de M14.7', () => {
	it('sépare le mot écrit en dur de la lecture de la configuration', () => {
		const { dur, configure } = releverFiche([
			{
				chemin: 'src/vues/V-00.svelte',
				source: [
					'<h1>Fiches applicatives</h1>',
					"const mot = $derived(CONFIG.motFiche.trim() || 'Fiche');",
					'<!-- la fiche est une note typée -->',
					'<p>{mot}</p>'
				].join('\n')
			}
		]);
		// Ligne 1 : le mot en dur. Ligne 2 : un repli de défaut À CÔTÉ de la
		// lecture de configuration — c'est le motif exact de `src/vues/V-33`, et
		// il est conforme. Ligne 3 : un commentaire, hors du cercle 2.
		expect(dur.map((d: { ligne: number }) => d.ligne)).toEqual([1]);
		expect(configure.map((d: { ligne: number }) => d.ligne)).toEqual([2]);
	});

	it('ne compte PAS « affiche » — c’est le piège du mot dans le mot', () => {
		const { dur } = releverFiche([
			{ chemin: 'src/vues/V-00.svelte', source: 'const affiche = $derived(afficherContexte());' }
		]);
		expect(dur).toEqual([]);
	});

	it('cite un emplacement exact — chemin et ligne', () => {
		const { dur } = releverFiche([
			{ chemin: 'src/lib/x.svelte', source: '\n\n<span>Nouvelle fiche</span>' }
		]);
		expect(dur[0]).toMatchObject({ chemin: 'src/lib/x.svelte', ligne: 3, cercle: 'interface' });
	});

	it('SÉPARE le texte de l’identifiant — deux dettes, deux façons de les fermer', () => {
		// `TYPES_FICHE`, `.tg--fiches`, `fiches-applicatives` ne se renomment pas
		// par la configuration : M14.7 ne les vise pas, CLAUDE.md §3 si. Les
		// additionner rendrait un nombre que personne ne saurait fermer.
		const { dur, identifiants } = releverFiche([
			{
				chemin: 'src/lib/x.ts',
				source: [
					"const nom = 'Types de fiches';",
					'const t = TYPES_FICHE;',
					"expect(identifiantLisible('Fiches applicatives')).toBe('fiches-applicatives');"
				].join('\n')
			},
			{ chemin: 'src/vues/V-00.css', source: '.tg--fiches { display: none; }' }
		]);
		expect(dur.map((d: { ligne: number }) => d.ligne)).toEqual([1, 3]);
		expect(identifiants).toHaveLength(3);
		// Une feuille de style ne rend aucun texte : tout y est identifiant.
		expect(identifiants.some((d: { chemin: string }) => d.chemin.endsWith('.css'))).toBe(true);
	});
});
