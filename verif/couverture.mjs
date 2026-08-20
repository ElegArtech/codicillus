#!/usr/bin/env node
/**
 * `pnpm verif:couverture` — QUELLE RÈGLE DU CAHIER N'EXISTE NULLE PART.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie NI ce script, NI la règle qu'il
 * applique. La seule sortie légitime d'un rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL PROUVE
 *
 * Dix-neuf batteries mesurent CE QUE LE CODE FAIT. Aucune ne mesurait ce que
 * le cahier demande et que personne n'a écrit. La conséquence est celle qu'un
 * dépôt ne voit jamais tout seul : six vagues à rendre vert ce qui existait,
 * sans qu'aucun instrument ne compte ce qui manquait. Deux lots entiers — les
 * pièces jointes, et le geste de vérification que `CLAUDE.md` §1 nomme « le
 * mécanisme central du produit » — ont été sautés SANS QU'AUCUN ROUGE NE
 * S'ALLUME. On ne peut pas rougir sur une absence qu'on n'a pas énumérée.
 *
 * Cet instrument énumère. Il pose TROIS questions, séparément, et n'en
 * confond aucune :
 *
 *   A — LA RÈGLE EST-ELLE PORTÉE ?    citée par au moins un fichier de
 *                                     `src/`, `base/` ou `seeds/`
 *   B — LA RÈGLE EST-ELLE CONTRÔLÉE ? citée par au moins un fichier de
 *                                     `verif/` ou un fichier de test
 *   C — LA CITATION EXISTE-T-ELLE ?   tout numéro cité par du code est-il
 *                                     DÉFINI quelque part
 *
 * A ET B NE SE REMPLACENT PAS, ET DEUX CHIFFRES SONT RENDUS, JAMAIS UN SEUL.
 * Une règle portée mais non contrôlée est une règle dont personne ne saura
 * qu'elle s'est cassée ; une règle contrôlée mais non portée est un contrôle
 * qui mesure du vide.
 *
 * C EST LA QUESTION QUI MORD LE PLUS VITE. `base/migrations/004` justifie un
 * choix de conception par une règle de la famille des notes, au rang six —
 * qui N'A JAMAIS EXISTÉ, cette famille s'arrêtant au rang quatre
 * (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:198-204`, lues). `verif:tracabilite`
 * ne l'a pas vue : elle relève les arbitrages, les dossiers d'écart et les
 * pièges, pas les règles de gestion.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE PROUVE PAS, ET IL FAUT LE LIRE AVANT DE CONCLURE D'UN VERT
 *
 * 1. IL MESURE LA TRAÇABILITÉ, PAS LA CONFORMITÉ. Une citation n'est pas une
 *    implémentation. Un fichier qui écrit un numéro de règle en commentaire
 *    SANS RIEN EN FAIRE est vert ici. Un vert de cette batterie ne dit JAMAIS
 *    que la règle est tenue — il dit que quelqu'un a pris la peine de la
 *    nommer. C'est un PLANCHER, pas un plafond.
 *
 * 2. IL LIT DES NUMÉROS, PAS DU SENS. Une citation qui renvoie au MAUVAIS
 *    numéro existant est verte ici, comme chez `verif:tracabilite`.
 *
 * 3. TROIS MÉCANISMES PORTENT UN NUMÉRO, ET IL N'EN COMPTE QUE DEUX (`P-5`,
 *    polarité inverse : une règle éprouvée sur un seul mécanisme n'est
 *    éprouvée qu'à moitié) :
 *
 *      — dans un COMMENTAIRE : COMPTÉ. C'est le mécanisme du défaut fondateur,
 *        et c'est aussi la forme la plus fréquente du dépôt ;
 *      — dans une CHAÎNE DE CARACTÈRES : COMPTÉ. `ECART-043` a montré qu'une
 *        référence imprimée à l'exécution est une référence comme une autre ;
 *      — dans un NOM DE FICHIER : NON COMPTÉ. Le crible lit des CONTENUS. Un
 *        fichier nommé d'après une règle mais muet à l'intérieur serait
 *        invisible. La rubrique « noms de fichiers » du rapport les relève
 *        donc à part, comptés et nommés, pour que le trou ne soit pas
 *        silencieux. Mesuré au 20/08/2026 : ZÉRO fichier du périmètre porte
 *        un numéro dans son nom — la lacune est latente, pas actuelle.
 *
 * 4. LE PÉRIMÈTRE DE PORTAGE EST CELUI DU CONTRAT, ET IL EST PLUS ÉTROIT QUE
 *    LE PRODUIT. `frontal/`, `services/`, `recherche/`, `static/`, `Dockerfile`
 *    et `compose.yaml` sont des pièces réelles du produit et portent des
 *    règles. Ils ne comptent pas pour A. Trois orphelines de A sont en fait
 *    portées là — l'instrument les NOMME sous la rubrique « portées hors du
 *    périmètre jugé », et ne les blanchit pas de son propre chef : élargir le
 *    périmètre est un arbitrage, pas une initiative d'instrument.
 *
 * 5. `cadrage/`, `mockups/` et `règles/` NE SONT PAS LUS comme porteurs. Le
 *    cahier est le RÉFÉRENTIEL : l'y compter rendrait toute règle portée par
 *    construction, et l'instrument serait vert le jour de sa naissance.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * COMMENT IL S'EXCLUT DE SA PROPRE MESURE — ET COMMENT IL LE PROUVE
 *
 * `P-20`, `P-9`, `P-17`, `P-23`, `P-27` disent la même chose cinq fois :
 * DÉCRIRE UNE FORME, NE JAMAIS LA CITER. Cet instrument cherche des numéros
 * de règle ; il vit dans `verif/`, donc dans le périmètre de CONTRÔLE : un
 * numéro écrit ici en toutes lettres rendrait cette règle « contrôlée » sans
 * qu'aucun contrôle n'existe. Ce serait exactement la fraude que la batterie
 * existe pour rendre impossible.
 *
 * IL NE S'EXCLUT PAS DU BALAYAGE — il se lit comme les autres. Il ne CITE
 * aucun numéro : tous sont composés à l'exécution depuis une famille et un
 * rang. Et la propriété n'est pas affirmée, elle est MESURÉE : le rapport
 * imprime le nombre de citations relevées dans ses propres fichiers, et un
 * compte non nul est un ROUGE à part entière. Une exclusion déclarée se
 * contredit en silence ; une exclusion mesurée se dénonce elle-même.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TRACES D'ABSENCE — POURQUOI UNE EXEMPTION, ET PAR COUPLE
 *
 * Un document qui SIGNALE qu'un numéro a été inventé doit nommer ce numéro.
 * Le compter rendrait la dette inclosable. L'exemption est posée par COUPLE
 * (fichier, numéro), jamais par fichier : un registre d'absence ne blanchit
 * que les numéros qu'il déclare absents, et reste jugé sur tous les autres.
 * Les citations exemptées sont IMPRIMÉES et comptées sous leur propre
 * rubrique, et toute exemption qu'aucune citation n'exerce est signalée
 * PÉRIMÉE — une exemption inerte est une porte laissée ouverte (`P-5`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE SEUIL — L'INSTRUMENT LE PROPOSE, IL NE SE LE DONNE PAS
 *
 * `docs/orchestration.md` §4 : *« par règle et par nature, jamais un compte
 * global »*, et *« ne te donne pas ton seuil »*. Aucun seuil n'est écrit ici.
 * Sans seuil, toute orpheline et toute citation inventée sont ROUGES, et
 * l'instrument imprime le seuil qu'il PROPOSE, par module et par question —
 * un compte global absorberait une dette nouvelle en silence.
 *
 * Un seuil arbitré au-dessus du mesuré est signalé PÉRIMÉ : il doit
 * redescendre, sans quoi il absoudrait par avance une régression future.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES, ET POURQUOI ELLES SE LISENT EN DEUX PASSES
 *
 * `P-26` vise cette batterie en plein : un contrôle dont le seul cas
 * d'épreuve est le défaut qu'il trouve devient inerte en réussissant. Le jour
 * où les orphelines seront portées, rien ne prouverait plus que le crible
 * mord. Les sondes perturbent donc un corpus SYNTHÉTIQUE, en mémoire — jamais
 * un octet sur le disque, `git status` reste propre par construction — et le
 * verdict se lit dans le PASSAGE sain → fautif, jamais dans le verdict seul.
 *
 * C'est `P-28` : la batterie porte des rouges de fond, elle rougirait quoi
 * qu'une sonde fasse, et « elle a rougi » ne prouverait rien.
 *
 *   --sonde=regle-orpheline      une règle définie que rien ne cite ; A monte
 *   --sonde=citation-inventee    un numéro cité qui n'existe pas ; C mord
 *   --sonde=regle-non-controlee  une règle portée que rien ne contrôle ; B
 *                                monte et A NE BOUGE PAS — les deux questions
 *                                sont bien indépendantes
 *   --sonde=temoin-inerte        LA MUTATION QUI NE TOUCHE RIEN
 *
 * LE TÉMOIN INERTE N'EST PAS INVERSÉ, ET C'EST UNE DIFFÉRENCE ASSUMÉE AVEC
 * `verif:tracabilite`. Là-bas le témoin sort en 2 et `package.json` le
 * retourne ; ici il sort en 0 quand les comptes sont IDENTIQUES — ce qu'on
 * lui demande de prouver — et en 1 s'ils bougent, parce qu'alors la mesure
 * dépend de quelque chose qu'aucune sonde n'a touché. Aucune inversion à
 * écrire dans `package.json`, donc aucune inversion à oublier.
 *
 * Usage :
 *   node verif/couverture.mjs                        la batterie
 *   node verif/couverture.mjs --details              chaque citation relevée
 *   node verif/couverture.mjs --seuil-a-M04=8        un seuil arbitré
 *   node verif/couverture.mjs --seuils=<chemin.json> les seuils en fichier
 *   node verif/couverture.mjs --sonde=<genre>        la preuve qu'elle mord
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ══ LA FORME D'UN NUMÉRO — DÉCRITE, JAMAIS CITÉE ═════════════════════════
   Le préfixe et le corps sont assemblés à l'exécution. Écrite d'un seul
   tenant, l'expression ci-dessous ne se reconnaîtrait pas elle-même — le
   crochet ouvrant qui suit le préfixe n'appartient pas à la classe attendue —
   mais la propriété tiendrait à un accident de syntaxe. Elle est donc
   composée, et le rapport MESURE que ce fichier ne cite aucun numéro. */
const PREFIXE = 'RG-';
const CORPS = '[A-Z0-9]+-[0-9]+';

/** L'expression qui relève un numéro de règle dans une ligne de texte. */
export const expressionDeNumero = () => new RegExp(`\\b${PREFIXE}(${CORPS})\\b`, 'g');

/**
 * Un numéro, composé depuis sa famille et son rang.
 * @param {string} famille @param {string} rang
 */
export const numeroDeRegle = (famille, rang) => `${PREFIXE}${famille}-${rang}`;

/** La famille d'un numéro — `M04`, `NF`, `DRO`… @param {string} numero */
export const familleDe = (numero) => numero.slice(PREFIXE.length).replace(/-\d+$/, '');

/* ══ CE QUE L'INSTRUMENT LIT ══════════════════════════════════════════════
   Quatre périmètres, deux jugés et deux relevés. Le partage n'est pas par
   dossier mais PAR RÔLE : un fichier de test qui vit sous `src/` est un
   CONTRÔLE, pas un porteur. Le confondre gonflerait A de tout ce que les
   unitaires nomment — mesuré : 94 numéros contre 93, et `DA` passait de 0 à 1
   règle portée sur la seule foi d'un unitaire. */

/* `ARB-058` : le portage est le PRODUIT ENTIER, non les trois dossiers du
   contrat d'origine. Trois règles étaient déclarées orphelines alors qu'elles
   sont portées hors de `src` — dont celle de l'indisponibilité programmée,
   portée SEPT fois par le frontal et la composition, et que ce commentaire ne
   NOMME pas : citer un numéro ici ferait rougir l'auto-mesure de cet
   instrument, ce qu'elle a fait à la première rédaction. C'est `P-20`, et il
   vaut aussi pour qui répare. Un produit n'est pas `src/` : il est ce que
   l'image embarque et ce que la composition monte. */
export const PORTAGE = [
	'src',
	'base',
	'seeds',
	'recherche',
	'frontal',
	'services',
	'static',
	'Dockerfile',
	'compose.yaml'
];
export const CONTROLE = ['verif'];
/** Plus aucune pièce du produit n'est hors du périmètre jugé (`ARB-058`). */
export const HORS_PERIMETRE = [];
export const DOCUMENTAIRE = ['docs', 'CLAUDE.md', 'README.md'];

/* Sorties volatiles et dépendances : elles ne sont pas le dépôt.

   `rapports` N'EST PAS UNE COMMODITÉ ICI, C'EST UNE NÉCESSITÉ. Cet instrument
   écrit `verif/rapports/couverture.json`, qui NOMME les 157 règles — dont les
   orphelines. Ce fichier vit sous `verif/`, donc dans le périmètre de
   CONTRÔLE : lu, il ferait passer contrôlées TOUTES les règles du référentiel,
   dès la deuxième exécution, et la batterie se rendrait verte à elle-même en
   tournant. C'est la variante la plus vicieuse de `P-20` — l'instrument ne se
   citerait pas, il se citerait par sa propre sortie. Le cas est éprouvé :
   l'unitaire vérifie que le rapport n'entre dans aucun périmètre. */
export const DOSSIERS_IGNORES = new Set(['node_modules', 'rapports', 'captures', '.svelte-kit']);

export const EXTENSIONS = new Set([
	'.md',
	'.mjs',
	'.js',
	'.ts',
	'.svelte',
	'.json',
	'.css',
	'.html',
	'.sh',
	'.sql',
	'.yaml',
	'.yml',
	'.py',
	''
]);

/** Un fichier de test — un CONTRÔLE, où qu'il vive. @param {string} chemin */
export const estUnTest = (chemin) => /\.(test|spec)\.[cm]?[jt]s$/.test(chemin);

/* ══ LE RÉFÉRENTIEL — LE CAHIER, ET L'ERRATA QUI CRÉE DES NUMÉROS ═════════
   `docs/errata-cadrage.md` E-05 CRÉE quatre numéros de la famille de la
   recherche, absents du cahier et pourtant légitimes : les exigences étaient
   réelles, restées des puces non numérotées. Une règle définie par l'errata
   est définie. Les lire n'est pas une commodité, c'est la seule façon de ne
   pas déclarer orphelines quatre règles qui ont un porteur.

   ET LA DISTINCTION DÉFINITION / CITATION EST LE CŒUR DU CRIBLE. Le cahier
   CITE neuf de ses propres règles dans son tableau de principes et son hors-
   périmètre ; l'errata en cite trois dans sa prose. Un crible qui relèverait
   toute occurrence compterait 162 règles au lieu de 153, et les neuf en trop
   seraient des doublons invisibles. Seules les formes de DÉFINITION comptent :
   le chapeau en gras en tête de ligne au cahier, la ligne de tableau à
   l'errata. */

export const SOURCES_DU_REFERENTIEL = {
	cahier: 'cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md',
	errata: 'docs/errata-cadrage.md'
};

/**
 * Les règles définies, et par qui.
 * @param {string} [base]
 * @returns {Map<string, string>} numéro → source
 */
export function referentielDesRegles(base = racine) {
	/** @type {Map<string, string>} */
	const regles = new Map();
	const lire = (/** @type {string} */ chemin) => {
		const complet = join(base, chemin);
		return existsSync(complet) ? readFileSync(complet, 'utf8') : '';
	};

	/* Le cahier définit par un chapeau en gras EN TÊTE DE LIGNE, suivi d'un
	   tiret cadratin. Une occurrence en milieu de phrase est une citation. */
	const cahier = lire(SOURCES_DU_REFERENTIEL.cahier);
	for (const m of cahier.matchAll(new RegExp(`^\\*\\*${PREFIXE}(${CORPS})\\*\\*`, 'gm'))) {
		regles.set(`${PREFIXE}${m[1]}`, 'cahier');
	}

	/* L'errata définit par une LIGNE DE TABLEAU dont la première cellule est
	   le numéro en gras. Sa prose cite les mêmes numéros et n'en définit
	   aucun : c'est la forme, pas le fichier, qui fait la définition. */
	const errata = lire(SOURCES_DU_REFERENTIEL.errata);
	for (const m of errata.matchAll(
		new RegExp(`^\\|\\s*\\*\\*${PREFIXE}(${CORPS})\\*\\*\\s*\\|`, 'gm')
	)) {
		const numero = `${PREFIXE}${m[1]}`;
		if (!regles.has(numero)) regles.set(numero, 'errata');
	}
	return regles;
}

/* ══ LES TRACES D'ABSENCE ═════════════════════════════════════════════════
   Le numéro exempté est composé, jamais écrit : l'inscrire en toutes lettres
   ferait de cette table une citation inventée de plus, et l'instrument
   compterait son propre outillage au passif du dépôt (`P-20`). */

const FAMILLE_NOTES = 'NOT';

/** @type {{fichier: string, numeros: string[], motif: string}[]} */
export const TRACES_D_ABSENCE = [
	{
		fichier: 'docs/taches/contrats/T-074.md',
		numeros: [numeroDeRegle(FAMILLE_NOTES, '06')],
		motif:
			'le contrat qui SIGNALE ce numéro comme inventé ; le compter rendrait la dette inclosable'
	}
];

/* ══ LECTURE DU DÉPÔT ═════════════════════════════════════════════════════ */

/**
 * Les fichiers d'une liste d'entrées, chemins relatifs à la racine, triés.
 * @param {string[]} entrees
 * @param {string} [base]
 * @returns {string[]}
 */
export function fichiersDe(entrees, base = racine) {
	/** @type {string[]} */
	const trouves = [];
	/** @param {string} dossier */
	const descendre = (dossier) => {
		for (const entree of readdirSync(dossier).sort()) {
			if (DOSSIERS_IGNORES.has(entree)) continue;
			const chemin = join(dossier, entree);
			if (statSync(chemin).isDirectory()) {
				descendre(chemin);
				continue;
			}
			if (EXTENSIONS.has(extname(entree)))
				trouves.push(relative(base, chemin).split(sep).join('/'));
		}
	};
	for (const entree of entrees) {
		const chemin = join(base, entree);
		if (!existsSync(chemin)) continue;
		if (statSync(chemin).isDirectory()) descendre(chemin);
		else trouves.push(entree);
	}
	return trouves.sort();
}

/**
 * Les quatre périmètres, partagés PAR RÔLE et non par dossier.
 * @param {string} [base]
 * @returns {{portage: string[], controle: string[], hors: string[], docs: string[]}}
 */
export function perimetres(base = racine) {
	const bruts = fichiersDe(PORTAGE, base);
	return {
		portage: bruts.filter((f) => !estUnTest(f)),
		controle: [...fichiersDe(CONTROLE, base), ...bruts.filter(estUnTest)].sort(),
		hors: fichiersDe(HORS_PERIMETRE, base),
		docs: fichiersDe(DOCUMENTAIRE, base)
	};
}

/**
 * Les numéros d'une ligne. Un numéro dans un commentaire et un numéro dans
 * une chaîne sont relevés à l'identique : le crible lit du TEXTE, il ne sait
 * pas — et n'a pas à savoir — ce que le langage hôte en fait.
 * @param {string} ligne
 * @returns {string[]}
 */
export function numerosDUneLigne(ligne) {
	/** @type {string[]} */
	const trouves = [];
	for (const m of ligne.matchAll(expressionDeNumero())) trouves.push(`${PREFIXE}${m[1]}`);
	return trouves;
}

/**
 * Les citations d'un périmètre : numéro → liste de `fichier:ligne`.
 * @param {string[]} fichiers
 * @param {string} [base]
 * @returns {Map<string, string[]>}
 */
export function citationsDe(fichiers, base = racine) {
	/** @type {Map<string, string[]>} */
	const citations = new Map();
	for (const fichier of fichiers) {
		const lignes = readFileSync(join(base, fichier), 'utf8').split('\n');
		for (let i = 0; i < lignes.length; i++) {
			for (const numero of numerosDUneLigne(lignes[i] ?? '')) {
				const ou = citations.get(numero) ?? [];
				ou.push(`${fichier}:${i + 1}`);
				citations.set(numero, ou);
			}
		}
	}
	return citations;
}

/**
 * Les fichiers dont le NOM porte un numéro — relevés, jamais comptés comme
 * citation. Le crible lit des contenus ; ce que le nom porte lui échappe, et
 * il vaut mieux l'imprimer que le taire (`P-5`).
 * @param {string[]} fichiers
 * @returns {string[]}
 */
export function nomsPortantUnNumero(fichiers) {
	return fichiers.filter((f) => numerosDUneLigne(basename(f)).length > 0);
}

/* ══ LE VERDICT ═══════════════════════════════════════════════════════════ */

/**
 * L'ordre des modules, tel qu'un plan de vague se commande. Une famille
 * inconnue de cette liste n'est PAS écartée : elle est rangée à la fin et
 * signalée — un référentiel qui gagne une famille doit se voir.
 */
export const ORDRE_DES_MODULES = [
	...Array.from({ length: 18 }, (_, i) => `M${String(i + 1).padStart(2, '0')}`),
	'NF',
	'DA',
	'DRO',
	'ACC',
	'NOT',
	'STR',
	'REF',
	'CPT'
];

/**
 * @typedef {Map<string, string[]>} Citations
 * @typedef {{regles: Map<string, string>, portage: Citations, controle: Citations,
 *            hors: Citations, docs: Citations}} Corpus
 */

/**
 * Deux relevés en un seul, LES PLACES CONCATÉNÉES et non écrasées. Un
 * `new Map([...a, ...b])` perdrait les places de `a` pour tout numéro que `b`
 * porte aussi : la même citation inventée serait signalée à un seul de ses
 * deux endroits, et la moitié du défaut resterait invisible.
 * @param {Citations} a @param {Citations} b @returns {Citations}
 */
export function fusionner(a, b) {
	/** @type {Citations} */
	const tout = new Map();
	for (const source of [a, b]) {
		for (const [numero, ou] of source) tout.set(numero, [...(tout.get(numero) ?? []), ...ou]);
	}
	return tout;
}

/**
 * Le verdict complet, sur un corpus déjà lu.
 * @param {Corpus} corpus
 * @param {typeof TRACES_D_ABSENCE} [traces]
 */
export function confronter(corpus, traces = TRACES_D_ABSENCE) {
	const { regles, portage, controle, hors, docs } = corpus;

	/* ── A et B ────────────────────────────────────────────────────────── */
	/** @type {{numero: string, source: string, portee: boolean, controlee: boolean, horsPerimetre: string[]}[]} */
	const jugees = [];
	for (const [numero, source] of regles) {
		jugees.push({
			numero,
			source,
			portee: portage.has(numero),
			controlee: controle.has(numero),
			horsPerimetre: portage.has(numero) ? [] : (hors.get(numero) ?? [])
		});
	}
	jugees.sort((a, b) => a.numero.localeCompare(b.numero));

	/* ── Par module ────────────────────────────────────────────────────── */
	/** @type {Map<string, {total: number, portees: number, controlees: number, orphelinesA: string[], orphelinesB: string[], connue: boolean}>} */
	const parModule = new Map();
	for (const j of jugees) {
		const famille = familleDe(j.numero);
		const e = parModule.get(famille) ?? {
			total: 0,
			portees: 0,
			controlees: 0,
			orphelinesA: [],
			orphelinesB: [],
			connue: ORDRE_DES_MODULES.includes(famille)
		};
		e.total++;
		if (j.portee) e.portees++;
		else e.orphelinesA.push(j.numero);
		if (j.controlee) e.controlees++;
		else e.orphelinesB.push(j.numero);
		parModule.set(famille, e);
	}
	const modules = [...parModule.keys()].sort((a, b) => {
		const ia = ORDRE_DES_MODULES.indexOf(a);
		const ib = ORDRE_DES_MODULES.indexOf(b);
		if (ia === -1 && ib === -1) return a.localeCompare(b);
		if (ia === -1) return 1;
		if (ib === -1) return -1;
		return ia - ib;
	});

	/* ── C ─────────────────────────────────────────────────────────────── */
	/** @param {string} fichier @param {string} numero */
	const exemptee = (fichier, numero) =>
		traces.find((t) => t.fichier === fichier && t.numeros.includes(numero));

	/**
	 * @param {Citations} citations
	 * @returns {{inventees: {numero: string, ou: string[]}[], documentees: {numero: string, ou: string[], motif: string}[]}}
	 */
	const inventoriser = (citations) => {
		/** @type {{numero: string, ou: string[]}[]} */
		const inventees = [];
		/** @type {{numero: string, ou: string[], motif: string}[]} */
		const documentees = [];
		for (const [numero, ou] of [...citations].sort()) {
			if (regles.has(numero)) continue;
			/** @type {string[]} */
			const rouges = [];
			/** @type {string[]} */
			const blanches = [];
			/** @type {string} */
			let motif = '';
			for (const place of ou) {
				const fichier = place.slice(0, place.lastIndexOf(':'));
				const t = exemptee(fichier, numero);
				if (t) {
					blanches.push(place);
					motif = t.motif;
				} else rouges.push(place);
			}
			if (rouges.length > 0) inventees.push({ numero, ou: rouges });
			if (blanches.length > 0) documentees.push({ numero, ou: blanches, motif });
		}
		return { inventees, documentees };
	};

	const cCode = inventoriser(fusionner(portage, controle));
	const cAilleurs = inventoriser(fusionner(docs, hors));

	/* ── Exemptions périmées ───────────────────────────────────────────── */
	const exercees = new Set(
		[...cCode.documentees, ...cAilleurs.documentees].flatMap((d) =>
			d.ou.map((place) => `${place.slice(0, place.lastIndexOf(':'))} ${d.numero}`)
		)
	);
	/** @type {{fichier: string, numero: string}[]} */
	const exemptionsPerimees = [];
	for (const t of traces) {
		for (const n of t.numeros) {
			if (!exercees.has(`${t.fichier} ${n}`))
				exemptionsPerimees.push({ fichier: t.fichier, numero: n });
		}
	}

	const orphelinesA = jugees.filter((j) => !j.portee);
	const orphelinesB = jugees.filter((j) => !j.controlee);

	return {
		jugees,
		modules,
		parModule,
		orphelinesA,
		orphelinesB,
		niNi: jugees.filter((j) => !j.portee && !j.controlee),
		rattrapeesHorsPerimetre: orphelinesA.filter((j) => j.horsPerimetre.length > 0),
		cCode,
		cAilleurs,
		exemptionsPerimees,
		comptes: {
			regles: regles.size,
			portees: jugees.length - orphelinesA.length,
			controlees: jugees.length - orphelinesB.length,
			orphelinesA: orphelinesA.length,
			orphelinesB: orphelinesB.length,
			citationsInventees: cCode.inventees.reduce((n, i) => n + i.ou.length, 0),
			numerosInventes: cCode.inventees.length,
			citationsInventeesAilleurs: cAilleurs.inventees.reduce((n, i) => n + i.ou.length, 0)
		}
	};
}

/**
 * Le corpus réel, lu sur le disque.
 * @param {string} [base]
 * @returns {{corpus: Corpus, fichiers: ReturnType<typeof perimetres>}}
 */
export function lireLeCorpus(base = racine) {
	const fichiers = perimetres(base);
	return {
		fichiers,
		corpus: {
			regles: referentielDesRegles(base),
			portage: citationsDe(fichiers.portage, base),
			controle: citationsDe(fichiers.controle, base),
			hors: citationsDe(fichiers.hors, base),
			docs: citationsDe(fichiers.docs, base)
		}
	};
}

/* ══ L'AUTO-MESURE ════════════════════════════════════════════════════════
   L'instrument se lit lui-même. La preuve qu'il ne se compte pas n'est pas
   une phrase de l'en-tête, c'est ce chiffre. */

export const MES_FICHIERS = ['verif/couverture.mjs', 'verif/couverture.test.ts'];

/**
 * Les citations que les fichiers de l'instrument portent — attendu : aucune.
 * @param {Citations} controle
 * @returns {{numero: string, place: string}[]}
 */
export function autoCitations(controle) {
	/** @type {{numero: string, place: string}[]} */
	const miennes = [];
	for (const [numero, ou] of controle) {
		for (const place of ou) {
			const fichier = place.slice(0, place.lastIndexOf(':'));
			if (MES_FICHIERS.includes(fichier)) miennes.push({ numero, place });
		}
	}
	return miennes;
}

/* ══ LES SONDES ═══════════════════════════════════════════════════════════
   Elles perturbent le corpus EN MÉMOIRE. Aucune n'écrit sur le disque : rien
   n'est à restaurer, et `git status` reste propre par construction.

   Les familles et les rangs de sonde sont choisis hors de tout ce que le
   cahier définit — ils ne peuvent donc pas entrer en collision avec une règle
   réelle, présente ou future : le cahier ne numérote pas au-delà de 99, et
   aucune de ses familles ne s'écrit sur cinq lettres. */

const FAMILLE_DE_SONDE = 'SONDE';
const PLACE_DE_SONDE = 'verif/(sonde en mémoire):1';

/** @type {Record<string, {quoi: string, muter: (c: Corpus) => Corpus, attendu: string}>} */
export const SONDES = {
	'regle-orpheline': {
		quoi: 'une règle DÉFINIE que rien ne cite',
		attendu: 'orphelines de A + 1, orphelines de B + 1, citations inventées inchangées',
		muter: (c) => ({
			...c,
			regles: new Map([...c.regles, [numeroDeRegle(FAMILLE_DE_SONDE, '01'), 'cahier']])
		})
	},
	'citation-inventee': {
		quoi: 'un numéro cité par du code et défini nulle part',
		attendu: 'citations inventées + 1, A et B inchangées',
		muter: (c) => ({
			...c,
			portage: new Map([...c.portage, [numeroDeRegle(FAMILLE_DE_SONDE, '02'), [PLACE_DE_SONDE]]])
		})
	},
	'regle-non-controlee': {
		quoi: 'une règle définie et PORTÉE que rien ne contrôle',
		attendu: 'orphelines de B + 1, orphelines de A INCHANGÉES — les deux questions sont disjointes',
		muter: (c) => ({
			...c,
			regles: new Map([...c.regles, [numeroDeRegle(FAMILLE_DE_SONDE, '03'), 'cahier']]),
			portage: new Map([...c.portage, [numeroDeRegle(FAMILLE_DE_SONDE, '03'), [PLACE_DE_SONDE]]])
		})
	},
	'temoin-inerte': {
		quoi: 'LA MUTATION QUI NE TOUCHE RIEN — les comptes doivent être identiques',
		attendu: 'tous les comptes strictement inchangés',
		muter: (c) => ({ ...c, regles: new Map(c.regles) })
	}
};

/**
 * Ce qu'une sonde doit avoir fait bouger, et rien d'autre.
 * @param {ReturnType<typeof confronter>['comptes']} avant
 * @param {ReturnType<typeof confronter>['comptes']} apres
 * @param {string} genre
 * @returns {{mord: boolean, dit: string}}
 */
export function lireLaMorsure(avant, apres, genre) {
	const dA = apres.orphelinesA - avant.orphelinesA;
	const dB = apres.orphelinesB - avant.orphelinesB;
	const dC = apres.citationsInventees - avant.citationsInventees;
	const dit = `A ${avant.orphelinesA} → ${apres.orphelinesA} · B ${avant.orphelinesB} → ${apres.orphelinesB} · C ${avant.citationsInventees} → ${apres.citationsInventees}`;
	if (genre === 'regle-orpheline') return { mord: dA === 1 && dB === 1 && dC === 0, dit };
	if (genre === 'citation-inventee') return { mord: dC === 1 && dA === 0 && dB === 0, dit };
	if (genre === 'regle-non-controlee') return { mord: dB === 1 && dA === 0 && dC === 0, dit };
	return { mord: dA === 0 && dB === 0 && dC === 0, dit };
}

/* ══ LES SEUILS ═══════════════════════════════════════════════════════════ */

/**
 * Les seuils passés en arguments, et ceux d'un fichier arbitré.
 * @param {string[]} args
 * @returns {{a: Record<string, number>, b: Record<string, number>, c: number | undefined, source: string}}
 */
export function seuilsDe(args) {
	/** @type {Record<string, number>} */
	const a = {};
	/** @type {Record<string, number>} */
	const b = {};
	/** @type {number | undefined} */
	let c = undefined;
	let source = 'aucun — les arguments seuls';

	const chemin = args.find((x) => x.startsWith('--seuils='))?.slice('--seuils='.length);
	if (chemin !== undefined) {
		const complet = join(racine, chemin);
		if (!existsSync(complet)) {
			source = `${chemin} — ABSENT, aucun seuil arbitré`;
		} else {
			source = chemin;
			const lu = JSON.parse(readFileSync(complet, 'utf8'));
			for (const [k, v] of Object.entries(lu.a ?? {})) a[k] = Number(v);
			for (const [k, v] of Object.entries(lu.b ?? {})) b[k] = Number(v);
			if (lu.c !== undefined) c = Number(lu.c);
		}
	}
	for (const arg of args) {
		const m = /^--seuil-([ab])-([A-Z0-9]+)=(\d+)$/.exec(arg);
		if (m) {
			const table = m[1] === 'a' ? a : b;
			table[m[2] ?? ''] = Number(m[3]);
			continue;
		}
		const mc = /^--seuil-c=(\d+)$/.exec(arg);
		if (mc) c = Number(mc[1]);
	}
	return { a, b, c, source };
}

/* ══ EXÉCUTION ════════════════════════════════════════════════════════════ */

/** @param {string[]} args */
export function principal(args) {
	const t0 = Date.now();
	const sonde = args.find((x) => x.startsWith('--sonde='))?.slice('--sonde='.length);
	const details = args.includes('--details');
	if (sonde !== undefined && !(sonde in SONDES)) {
		console.error(
			`verif:couverture — sonde inconnue « ${sonde} ». Connues : ${Object.keys(SONDES).join(', ')}.`
		);
		return 1;
	}

	const { corpus, fichiers } = lireLeCorpus();
	const reference = confronter(corpus);

	if (sonde !== undefined) {
		const mutation = SONDES[sonde];
		const mutee = confronter(mutation?.muter(corpus) ?? corpus);
		const { mord, dit } = lireLaMorsure(reference.comptes, mutee.comptes, sonde);
		console.log(`\nverif:couverture — sonde ${sonde}`);
		console.log(`  ce qu'elle injecte : ${mutation?.quoi}`);
		console.log(`  ce qu'on en attend : ${mutation?.attendu}`);
		console.log(`  deux passes        : ${dit}`);
		if (sonde === 'temoin-inerte') {
			if (mord) {
				console.log(
					'\n  Le témoin n’a rien fait bouger : la mesure ne dépend que de ce qu’on lui\n' +
						'  donne. Code 0, sans inversion.\n'
				);
				return 0;
			}
			console.error(
				'\n  REFUS DE CONCLURE : le témoin inerte a fait bouger un compte. La batterie\n' +
					'  dépend de quelque chose qu’aucune sonde n’a touché, et aucune autre sonde ne\n' +
					'  prouverait quoi que ce soit tant que celle-ci ment (P-28). Code 1.\n'
			);
			return 1;
		}
		if (mord) {
			console.log('\n  La batterie a dit non, et exactement où on l’attendait. Code 0.\n');
			return 0;
		}
		console.error(
			'\n  ÉCHEC DE SONDE : la mutation n’a pas produit le passage attendu. Une sonde qui\n' +
				'  ne mord pas ne prouve rien — le crible est inerte sur ce mécanisme (P-5).\n'
		);
		return 1;
	}

	const r = reference;
	const seuils = seuilsDe(args);
	const miennes = autoCitations(corpus.controle);
	const nomsNumerotes = nomsPortantUnNumero([
		...fichiers.portage,
		...fichiers.controle,
		...fichiers.hors
	]);

	/* ── Le rapport ────────────────────────────────────────────────────── */
	console.log('\nverif:couverture — quelle règle du cahier n’existe nulle part');
	console.log(
		`  référentiel : ${r.comptes.regles} règles ` +
			`(${[...corpus.regles.values()].filter((s) => s === 'cahier').length} au cahier, ` +
			`${[...corpus.regles.values()].filter((s) => s === 'errata').length} créées par l’errata)`
	);
	console.log(
		`  fichiers lus : portage ${fichiers.portage.length} · contrôle ${fichiers.controle.length} · ` +
			`hors périmètre ${fichiers.hors.length} · documentaire ${fichiers.docs.length}`
	);
	console.log(
		`\n  A — PORTÉES     ${r.comptes.portees}/${r.comptes.regles}   →   NON PORTÉES ${r.comptes.orphelinesA}`
	);
	console.log(
		`  B — CONTRÔLÉES  ${r.comptes.controlees}/${r.comptes.regles}   →   NON CONTRÔLÉES ${r.comptes.orphelinesB}`
	);
	console.log(`  ni portée ni contrôlée : ${r.niNi.length}`);
	console.log(
		`  C — CITATIONS INVENTÉES ${r.comptes.citationsInventees} ` +
			`sur ${r.comptes.numerosInventes} numéro(s) qui n’existent pas`
	);

	console.log('\n  LE RELEVÉ PAR MODULE — à recopier tel quel dans un plan de vague');
	console.log('    module   règles   portées   contrôlées   non portées   non contrôlées');
	for (const m of r.modules) {
		const e = r.parModule.get(m);
		if (!e) continue;
		console.log(
			`    ${(m + (e.connue ? '' : ' (?)')).padEnd(9)}${String(e.total).padStart(5)}` +
				`${String(e.portees).padStart(10)}${String(e.controlees).padStart(13)}` +
				`${String(e.orphelinesA.length).padStart(14)}${String(e.orphelinesB.length).padStart(17)}`
		);
	}
	if (r.modules.some((m) => !(r.parModule.get(m)?.connue ?? true))) {
		console.log('    (?) famille absente de l’ordre des modules — le référentiel en a gagné une.');
	}

	console.log('\n  A — LES ORPHELINES NOMMÉES, PAR MODULE — aucune n’est portée par du code');
	for (const m of r.modules) {
		const e = r.parModule.get(m);
		if (!e || e.orphelinesA.length === 0) continue;
		console.log(`    ${m.padEnd(5)} ${e.orphelinesA.join(' ')}`);
	}

	console.log('\n  B — LES NON CONTRÔLÉES NOMMÉES, PAR MODULE — aucun contrôle ne les cite');
	for (const m of r.modules) {
		const e = r.parModule.get(m);
		if (!e || e.orphelinesB.length === 0) continue;
		console.log(`    ${m.padEnd(5)} ${e.orphelinesB.join(' ')}`);
	}

	if (r.cCode.inventees.length > 0) {
		console.log('\n  C — LES NUMÉROS QUE DU CODE CITE ET QUE RIEN NE DÉFINIT');
		for (const i of r.cCode.inventees) {
			console.log(`    ${i.numero.padEnd(14)} ${i.ou.join(', ')}`);
		}
	}

	const documentees = [...r.cCode.documentees, ...r.cAilleurs.documentees];
	if (documentees.length > 0) {
		console.log('\n  NOMMÉS COMME INVENTÉS PAR UN REGISTRE D’ABSENCE — comptés, jamais effacés');
		for (const d of documentees) {
			console.log(`    ${d.numero.padEnd(14)} ${d.ou.join(', ')}   ${d.motif}`);
		}
	}
	if (r.exemptionsPerimees.length > 0) {
		console.log('\n  EXEMPTIONS PÉRIMÉES — plus exercées par aucune citation, à retirer (P-5)');
		for (const e of r.exemptionsPerimees) console.log(`    ${e.fichier}  ${e.numero}`);
	}

	console.log('\n  CE QUE CE COMPTE NE COUVRE PAS — mesuré, pas supposé');
	console.log(
		`    ${r.rattrapeesHorsPerimetre.length} orpheline(s) de A sont PORTÉES HORS du périmètre jugé —\n` +
			'      pièces réelles du produit que le contrat n’a pas mises dans A. Élargir le\n' +
			'      périmètre est un arbitrage, pas une initiative d’instrument :'
	);
	for (const j of r.rattrapeesHorsPerimetre) {
		console.log(`        ${j.numero.padEnd(14)} ${j.horsPerimetre.join(', ')}`);
	}
	console.log(
		`    ${r.comptes.citationsInventeesAilleurs} citation(s) de numéros inexistants HORS du code —\n` +
			'      relevées, non jugées : le contrat borne C au code.'
	);
	for (const i of r.cAilleurs.inventees) {
		console.log(`        ${i.numero.padEnd(14)} ${i.ou.join(', ')}`);
	}
	console.log(
		`    ${nomsNumerotes.length} fichier(s) portent un numéro dans leur NOM — le crible lit des\n` +
			'      contenus, pas des chemins. Ils ne comptent ni pour A ni pour B :'
	);
	for (const f of nomsNumerotes) console.log(`        ${f}`);
	console.log(
		`    ${miennes.length} citation(s) relevée(s) dans les fichiers de CET instrument —\n` +
			'      il se lit lui-même, et cette ligne est la preuve qu’il ne se compte pas (P-20).'
	);
	for (const m of miennes) console.log(`        ${m.numero.padEnd(14)} ${m.place}`);
	console.log(
		'    UNE CITATION N’EST PAS UNE IMPLÉMENTATION. Cette batterie mesure la\n' +
			'      traçabilité, jamais la conformité : un fichier qui nomme une règle sans\n' +
			'      rien en faire est vert ici. C’est un plancher, pas un plafond.'
	);

	if (details) {
		console.log('\n  TOUTES LES RÈGLES, ET OÙ ELLES SONT CITÉES');
		for (const j of r.jugees) {
			const p = corpus.portage.get(j.numero) ?? [];
			const c = corpus.controle.get(j.numero) ?? [];
			console.log(
				`    ${j.numero.padEnd(14)} ${j.source.padEnd(7)} ` +
					`A:${j.portee ? 'oui' : 'NON'} (${p.length}) · B:${j.controlee ? 'oui' : 'NON'} (${c.length})`
			);
			if (p.length > 0) console.log(`        porté   ${p.join(', ')}`);
			if (c.length > 0) console.log(`        contrôlé ${c.join(', ')}`);
		}
	}

	/* ── Les seuils : proposés, jamais appliqués d'office ───────────────── */
	let horsSeuil = false;
	for (const m of r.modules) {
		const e = r.parModule.get(m);
		if (!e) continue;
		const sa = seuils.a[m];
		const sb = seuils.b[m];
		if (sa === undefined ? e.orphelinesA.length > 0 : e.orphelinesA.length > sa) horsSeuil = true;
		if (sb === undefined ? e.orphelinesB.length > 0 : e.orphelinesB.length > sb) horsSeuil = true;
	}
	if (
		seuils.c === undefined
			? r.comptes.citationsInventees > 0
			: r.comptes.citationsInventees > seuils.c
	)
		horsSeuil = true;
	if (miennes.length > 0) horsSeuil = true;

	/** @type {string[]} */
	const perimes = [];
	for (const [m, s] of Object.entries(seuils.a)) {
		const e = r.parModule.get(m);
		if (e && e.orphelinesA.length < s)
			perimes.push(`--seuil-a-${m} arbitré à ${s}, mesuré à ${e.orphelinesA.length}`);
	}
	for (const [m, s] of Object.entries(seuils.b)) {
		const e = r.parModule.get(m);
		if (e && e.orphelinesB.length < s)
			perimes.push(`--seuil-b-${m} arbitré à ${s}, mesuré à ${e.orphelinesB.length}`);
	}
	if (seuils.c !== undefined && r.comptes.citationsInventees < seuils.c)
		perimes.push(`--seuil-c arbitré à ${seuils.c}, mesuré à ${r.comptes.citationsInventees}`);
	if (perimes.length > 0) {
		console.log('\n  SEUILS PÉRIMÉS — ils doivent redescendre, sans quoi ils absoudraient par');
		console.log('    avance une régression future (orchestration §4, règle 3)');
		for (const p of perimes) console.log(`    ${p}`);
	}

	if (miennes.length > 0) {
		console.error(
			'\n  ÉCHEC D’AUTO-MESURE : cet instrument CITE des numéros de règle. Il vit dans le\n' +
				'  périmètre de contrôle : chacun de ces numéros passerait « contrôlé » sans\n' +
				'  qu’aucun contrôle n’existe. Composer le numéro, jamais l’écrire (P-20).'
		);
	}

	if (horsSeuil) {
		console.log(
			'\n  SEUILS DE DÉPART PROPOSÉS, PAR MODULE ET PAR QUESTION — jamais un compte\n' +
				'    global, qui absorberait une dette nouvelle en silence (orchestration §4) :'
		);
		/** @type {string[]} */
		const propositions = [];
		for (const m of r.modules) {
			const e = r.parModule.get(m);
			if (!e) continue;
			if (e.orphelinesA.length > 0) propositions.push(`--seuil-a-${m}=${e.orphelinesA.length}`);
			if (e.orphelinesB.length > 0) propositions.push(`--seuil-b-${m}=${e.orphelinesB.length}`);
		}
		if (r.comptes.citationsInventees > 0)
			propositions.push(`--seuil-c=${r.comptes.citationsInventees}`);
		for (let i = 0; i < propositions.length; i += 4) {
			console.log(`      ${propositions.slice(i, i + 4).join('  ')}`);
		}
		console.log(
			'    Ils ne sont PAS écrits dans cet instrument, et il ne les écrit nulle part :\n' +
				'    `verif/references/` est en écriture humaine seule. Un seuil que la mesure se\n' +
				'    donne à elle-même ne mesure plus rien. Tant qu’ils ne sont pas arbitrés, ce\n' +
				'    ROUGE est le verdict.'
		);
	}

	const duree = ((Date.now() - t0) / 1000).toFixed(1);
	const DOSSIER = join(racine, 'verif', 'rapports');
	mkdirSync(DOSSIER, { recursive: true });
	writeFileSync(
		join(DOSSIER, 'couverture.json'),
		JSON.stringify(
			{
				regle: 'toute règle du cahier est portée, contrôlée, et toute citation existe',
				source: 'T-074',
				comptes: r.comptes,
				seuils_source: seuils.source,
				seuils_arbitres: { a: seuils.a, b: seuils.b, c: seuils.c ?? null },
				seuils_perimes: perimes,
				par_module: r.modules.map((m) => {
					const e = r.parModule.get(m);
					return {
						module: m,
						regles: e?.total ?? 0,
						portees: e?.portees ?? 0,
						controlees: e?.controlees ?? 0,
						non_portees: e?.orphelinesA ?? [],
						non_controlees: e?.orphelinesB ?? []
					};
				}),
				citations_inventees: r.cCode.inventees,
				citations_inventees_hors_code: r.cAilleurs.inventees,
				documentees_comme_inventees: documentees,
				exemptions_perimees: r.exemptionsPerimees,
				portees_hors_perimetre: r.rattrapeesHorsPerimetre.map((j) => ({
					numero: j.numero,
					ou: j.horsPerimetre
				})),
				noms_de_fichiers_numerotes: nomsNumerotes,
				auto_citations: miennes,
				duree_s: Number(duree)
			},
			null,
			'\t'
		) + '\n'
	);

	/* UN VERT SOUS SEUIL N'EST PAS UN VERT SANS DETTE, et le dire autrement
	   serait le mensonge le plus commode de cette batterie : elle existe parce
	   qu'un dépôt avait passé six vagues à ne pas voir ce qui manquait. La
	   dette est donc RÉPÉTÉE au verdict, jamais absorbée par lui. */
	if (!horsSeuil) {
		const dette =
			r.comptes.orphelinesA + r.comptes.orphelinesB + r.comptes.citationsInventees === 0;
		console.log(
			dette
				? `\n  Toute règle est portée, toute règle est contrôlée, toute citation existe. ${duree} s\n`
				: `\n  Sous les seuils arbitrés — et la dette reste entière : ${r.comptes.orphelinesA} règle(s) que\n` +
						`  rien ne porte, ${r.comptes.orphelinesB} que rien ne contrôle, ${r.comptes.citationsInventees} citation(s) inventée(s).\n` +
						`  Un seuil rend une dette opposable ; il ne la referme pas. ${duree} s\n`
		);
		return 0;
	}
	console.error(
		`\n  ÉCHEC : ${r.comptes.orphelinesA} règle(s) que rien ne porte, ` +
			`${r.comptes.orphelinesB} que rien ne contrôle,\n` +
			`  ${r.comptes.citationsInventees} citation(s) d’un numéro qui n’existe pas. ${duree} s\n`
	);
	return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	process.exit(principal(process.argv.slice(2)));
}
