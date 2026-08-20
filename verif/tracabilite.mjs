#!/usr/bin/env node
/**
 * `pnpm verif:tracabilite` — AUCUNE RÉFÉRENCE SANS PIÈCE PORTEUSE.
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
 * Le dépôt renvoie à ses propres décisions par des numéros — un arbitrage, un
 * dossier d'écart, un écart nommé à l'intérieur d'un dossier, un piège. Ces
 * numéros sont la seule mémoire externalisée du projet : la question de
 * clôture du plan §9 — « le dépôt suffirait-il à réexpliquer ce lot sans le
 * rouvrir ? » — se répond en les suivant.
 *
 * `ECART-043` a mesuré ce que personne n'avait compté : SIX numéros cités
 * depuis DIX endroits n'ont aucune pièce derrière eux. Deux de ces citations
 * sont dans `verif/references/`, en écriture humaine seule, et l'une justifie
 * DEUX LIGNES VOLONTAIREMENT ABSENTES d'un seuil : le fichier existe pour
 * qu'un tiers contrôle la décision, et il ne le peut pas. Une autre est
 * IMPRIMÉE À L'EXÉCUTION par la batterie 9, comme l'autorisation d'une
 * correction d'instrument — le geste que ce dépôt surveille le plus.
 *
 * La cause est structurelle et `ECART-043` la nomme : un numéro s'attribue en
 * écrivant la phrase qui le cite, la pièce est un SECOND geste, et rien ne
 * l'exige. Une consigne de rigueur documentaire est le régime le plus faible
 * de ce dépôt — la hiérarchie est *bloquant > vérifiable > déclaratif*. Cet
 * instrument fait passer la règle du troisième régime au premier.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE PROUVE PAS, ET IL FAUT LE LIRE AVANT DE CONCLURE D'UN VERT
 *
 * 1. IL LIT DES NUMÉROS, PAS DU SENS. Une citation qui renvoie au MAUVAIS
 *    numéro existant est verte ici. Seule l'absence de pièce est mesurée.
 *
 * 2. LA FORME `P-n` EST HOMOGRAPHE SUR TROIS REGISTRES — les pièges de
 *    `CLAUDE.md` §6, les dix principes de `CLAUDE.md` §5 (`P-0n`), et les
 *    amendements du gabarit de `docs/releve-vues.md` §4. L'instrument accepte
 *    la pièce de n'importe lequel : il ne sait donc pas dire qu'une citation
 *    vise le mauvais registre. Le compte des homographes est imprimé.
 *
 * 3. UN `É-n` NU N'EST PAS TRAÇABLE, et c'est la limite la plus large. La
 *    très grande majorité des `É-n` du dépôt sont locaux au document qui les
 *    porte — un dossier qui numérote ses propres écarts. Seuls les `É-n`
 *    QUALIFIÉS par un porteur sont jugés. Les nus sont comptés et déclarés.
 *
 * 4. `T-xxx É-n` N'A AUCUN REGISTRE. Les rapports de lot ne sont pas des
 *    fichiers du dépôt : `docs/taches/contrats/` porte les contrats, pas les
 *    rapports. Ces citations ne sont donc ni vertes ni rouges — elles sont
 *    `sans-registre`, comptées à part, et le registre absent est nommé. Les
 *    déclarer rouges reprocherait au dépôt une pièce qu'aucun lot ne peut
 *    écrire ; les taire cacherait un trou de mémoire de la même famille.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TRACES D'ABSENCE — POURQUOI UNE EXEMPTION, ET POURQUOI CELLE-CI SEULE
 *
 * Un dossier qui SIGNALE qu'un numéro n'a pas de pièce doit nommer ce numéro.
 * Compter ces citations rendrait la dette inclosable : `ECART-043` serait à
 * lui seul un défaut permanent, et le seul moyen de le refermer serait de
 * cesser de documenter le manque.
 *
 * L'exemption est donc posée par COUPLE (fichier, numéro), jamais par
 * fichier : un registre d'absence ne blanchit que les numéros qu'il déclare
 * absents, et reste jugé sur tous les autres. Elle n'efface rien — les
 * citations exemptées sont IMPRIMÉES, nommées et comptées, sous leur propre
 * rubrique. Et toute exemption qu'aucune citation n'exerce est signalée
 * PÉRIMÉE : une exemption inerte est une porte laissée ouverte (`P-5`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE SEUIL — L'INSTRUMENT LE PROPOSE, IL NE SE LE DONNE PAS
 *
 * `docs/orchestration.md` §4 : *« ne te donne pas ton seuil »*. Aucun seuil
 * n'est écrit ici. Sans `--seuil-<genre>=`, tout pointeur mort est ROUGE, et
 * l'instrument imprime le seuil qu'il PROPOSE, par genre — jamais un compte
 * global, qui absorberait une dette nouvelle en silence (§4, règle 1).
 *
 * Un seuil arbitré au-dessus du mesuré est signalé PÉRIMÉ : il doit
 * redescendre, sans quoi il absoudrait par avance une régression future.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES, ET POURQUOI LEUR CODE EST INVERSÉ
 *
 * Un banc toujours vert ne prouve rien (RA-01). `--sonde=<genre>` perturbe le
 * corpus lu EN MÉMOIRE — jamais un octet sur le disque, `git status` reste
 * propre par construction.
 *
 *   --sonde=pointeur-invente  une citation d'un numéro qui n'existe pas
 *   --sonde=piece-retiree     une pièce réelle soustraite du registre
 *   --sonde=temoin-inerte     LA MUTATION QUI NE TOUCHE RIEN — refus de conclure
 *
 * L'inversion s'arrête au code 2 : quand la mutation n'a RIEN CHANGÉ au
 * verdict, elle ne teste rien, et l'instrument refuse de conclure.
 *
 * Usage :
 *   node verif/tracabilite.mjs                    la batterie
 *   node verif/tracabilite.mjs --seuil-ecart=N    la dette de départ arbitrée
 *   node verif/tracabilite.mjs --details          chaque citation, ligne à ligne
 *   node verif/tracabilite.mjs --sonde=<genre>    la preuve qu'elle sait dire non
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ══ CE QUE L'INSTRUMENT LIT ══════════════════════════════════════════════
   `ECART-043` insiste sur le point, et c'est ce qui distingue ce contrôle
   d'un contrôle documentaire : SIX des huit citations du numéro d'arbitrage
   qui autorise une correction d'instrument sont dans `verif/`, et l'une est
   dans une chaîne imprimée à l'exécution. Lire `docs/` seul aurait manqué la
   plus grave. */
export const PERIMETRE = ['verif', 'src', 'base', 'seeds', 'docs', 'CLAUDE.md'];

/* Sorties volatiles et dépendances : elles ne sont pas le dépôt. */
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
	'.yml'
]);

/* ══ LES REGISTRES ════════════════════════════════════════════════════════ */

export const SOURCES_DE_REGISTRE = {
	ecarts: 'docs/ecarts',
	arbitrages: 'docs/arbitrages.md',
	claude: 'CLAUDE.md',
	amendements: 'docs/releve-vues.md'
};

/* AUCUN NUMÉRO SANS PIÈCE N'EST ÉCRIT EN CLAIR DANS CE FICHIER, ET C'EST UNE
   NÉCESSITÉ, PAS UNE COQUETTERIE. L'instrument se lit lui-même — il doit, ses
   propres tables étant du dépôt. Écrire ici la forme complète d'un numéro mort
   ferait de chaque déclaration une citation morte de plus, et le contrôle
   compterait son propre outillage. C'est `P-20` et `P-23` mot pour mot :
   *décrire une forme, ne jamais la citer.* Les numéros sont donc composés à
   l'exécution depuis leur genre et leur rang. */

/** @param {string} genre @param {string} rang */
const numeroDe = (genre, rang) => `${genre}-${rang}`;
const GENRE_ECART = 'ECART';
const GENRE_ARB = 'ARB';

/**
 * Les rangs que les registres d'absence nomment comme absents. Un dossier qui
 * SIGNALE qu'un numéro n'a pas de pièce doit le nommer : compter ces citations
 * rendrait la dette inclosable.
 *
 * LA LISTE A DÉJÀ MAIGRI DE DEUX RANGS, ET C'EST L'INSTRUMENT QUI L'A DIT.
 * Les deux arbitrages qu'elle portait au départ ont été réparés au lot T-048 —
 * l'un renuméroté sur ses huit citations, l'autre réinscrit au registre et
 * marqué révoqué. Leurs exemptions sont aussitôt passées PÉRIMÉES au rapport,
 * et elles ont été retirées. C'est la propriété qu'on attend d'un seuil : il
 * descend, il ne monte pas.
 */
const RANGS_DECLARES_ABSENTS = [
	numeroDe(GENRE_ECART, '029'),
	numeroDe(GENRE_ECART, '030'),
	numeroDe(GENRE_ECART, '034'),
	numeroDe(GENRE_ECART, '042'),
	numeroDe(GENRE_ARB, '045')
];

/** @type {{fichier: string, numeros: string[], motif: string}[]} */
export const TRACES_D_ABSENCE = [
	{
		fichier: 'docs/ecarts/ECART-043.md',
		numeros: RANGS_DECLARES_ABSENTS,
		motif: 'le dossier qui SIGNALE ces absences ; les compter rendrait la dette inclosable'
	},
	{
		/* Ce registre-ci n'en nomme que DEUX en toutes lettres, et la liste a été
		   taillée à cette mesure : les autres n'y figuraient que par un rang abrégé,
		   qui n'est pas une référence, ou n'y figurent plus. Aucune de ces coupes
		   n'a été devinée — l'instrument signale PÉRIMÉE toute exemption qu'aucune
		   citation n'exerce, et c'est lui qui a nommé les trois à retirer. */
		fichier: 'docs/reprise.md',
		numeros: [numeroDe(GENRE_ECART, '042'), numeroDe(GENRE_ARB, '045')],
		motif: 'la section « ce qui reste ouvert » les énumère comme manquants'
	},
	{
		fichier: 'docs/taches/contrats/T-048.md',
		numeros: RANGS_DECLARES_ABSENTS,
		motif: 'le contrat du lot qui pose ce contrôle : il nomme la dette qu’il borne'
	}
];

/* ══ EXTRACTION DES RÉFÉRENCES ════════════════════════════════════════════
   Quatre genres, quatre formes. Les expressions sont écrites une fois et
   exportées : les unitaires les éprouvent sur un corpus SYNTHÉTIQUE, jamais
   sur l'état du dépôt — un contrôle dont le seul cas d'épreuve est le défaut
   qu'il trouve devient inerte en réussissant (`P-26`). */

/** Le E accentué des titres — `# ÉCART-043` — et le E nu des chemins. */
export const RE_ECART = /[EÉ]CART-(\d{3})/g;
export const RE_ARB = /ARB-(\d{3})/g;

/* Un `É-n` n'est jugé que QUALIFIÉ par son porteur. Les ornements de balisage
   qui s'intercalent — accents graves, astérisques, guillemets — sont retirés
   de la ligne avant la reconnaissance, sans quoi la forme la plus courante du
   dépôt échapperait au crible. */
export const RE_E_QUALIFIE = /([EÉ]CART-\d{3}|T-\d{2,3}[a-z]?)\s{0,3}É-(\d+)/g;
export const RE_E_NU = /É-(\d+)/g;
export const RE_ORNEMENTS = /[`*_«»"'‘’“”]/g;

/* `P-6.3` et `P-1.7` sont des niveaux de protocole du plan, pas des pièges :
   le chiffre suivi d'un point est exclu. */
export const RE_P = /(?<![\w.-])P-(\d{1,2})(?![\d.])/g;

/**
 * Les références d'une ligne, avec leur genre et leur forme brute.
 * @param {string} ligne
 * @returns {{genre: string, numero: string, brut: string}[]}
 */
export function referencesDUneLigne(ligne) {
	/** @type {{genre: string, numero: string, brut: string}[]} */
	const trouvees = [];
	const propre = ligne.replace(RE_ORNEMENTS, '');

	/* LES `É-n` QUALIFIÉS D'ABORD, ET LEUR EMPREINTE EST EFFACÉE DE LA LIGNE.
	   Sans cela, une citation d'un écart nommé compterait DEUX FOIS — une fois
	   comme écart nommé, une fois comme dossier porteur —, et le même défaut
	   serait imputé deux fois au même endroit. La référence est une, et c'est
	   la plus précise des deux. */
	let restant = propre;
	for (const m of propre.matchAll(RE_E_QUALIFIE)) {
		const porteur = (m[1] ?? '').replace('É', 'E');
		trouvees.push({
			genre: porteur.startsWith('T-') ? 'e-de-lot' : 'e-decart',
			numero: `${porteur} É-${m[2]}`,
			brut: m[0]
		});
		restant = restant.replace(m[0], ' '.repeat(m[0].length));
	}

	for (const m of restant.matchAll(RE_ECART)) {
		trouvees.push({ genre: 'ecart', numero: `ECART-${m[1]}`, brut: m[0] });
	}
	for (const m of restant.matchAll(RE_ARB)) {
		trouvees.push({ genre: 'arb', numero: `ARB-${m[1]}`, brut: m[0] });
	}
	for (const m of restant.matchAll(RE_P)) {
		trouvees.push({ genre: 'piege', numero: `P-${m[1]}`, brut: m[0] });
	}
	for (const m of restant.matchAll(RE_E_NU)) {
		trouvees.push({ genre: 'e-nu', numero: `É-${m[1]}`, brut: m[0] });
	}
	return trouvees;
}

/* ══ LECTURE DU DÉPÔT ═════════════════════════════════════════════════════ */

/**
 * Les fichiers du périmètre, chemins relatifs à la racine, triés.
 * @param {string} [base]
 * @returns {string[]}
 */
export function fichiersDuPerimetre(base = racine) {
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
	for (const entree of PERIMETRE) {
		const chemin = join(base, entree);
		if (!existsSync(chemin)) continue;
		if (statSync(chemin).isDirectory()) descendre(chemin);
		else trouves.push(entree);
	}
	return trouves.sort();
}

/**
 * Toutes les citations du corpus.
 *
 * `src/lib/base/commandes.ts` porte deux octets NUL — `grep` y répond
 * silencieusement rien, code 1, sans message (`P-18` du contrat de lot). La
 * lecture est faite ici en UTF-8 par Node, que les octets NUL ne troublent
 * pas : le fichier est lu comme les autres, et ses citations sont vues.
 *
 * @param {string[]} fichiers
 * @param {string} [base]
 * @returns {{fichier: string, ligne: number, genre: string, numero: string, brut: string}[]}
 */
export function citationsDuCorpus(fichiers, base = racine) {
	/** @type {{fichier: string, ligne: number, genre: string, numero: string, brut: string}[]} */
	const citations = [];
	for (const fichier of fichiers) {
		const texte = readFileSync(join(base, fichier), 'utf8');
		const lignes = texte.split('\n');
		for (let i = 0; i < lignes.length; i++) {
			for (const ref of referencesDUneLigne(lignes[i] ?? '')) {
				citations.push({ fichier, ligne: i + 1, ...ref });
			}
		}
	}
	return citations;
}

/**
 * Les pièces que le dépôt porte réellement.
 * @param {string} [base]
 */
export function registresDuDepot(base = racine) {
	const lire = (/** @type {string} */ chemin) => {
		const complet = join(base, chemin);
		return existsSync(complet) ? readFileSync(complet, 'utf8') : '';
	};

	/** @type {Set<string>} */
	const ecarts = new Set();
	/** @type {Map<string, Set<string>>} */
	const ecartsE = new Map();
	const dossierEcarts = join(base, SOURCES_DE_REGISTRE.ecarts);
	if (existsSync(dossierEcarts)) {
		for (const entree of readdirSync(dossierEcarts).sort()) {
			const m = /^([EÉ]CART-\d{3})\.md$/.exec(entree);
			if (!m) continue;
			const numero = (m[1] ?? '').replace('É', 'E');
			ecarts.add(numero);
			/* Deux conventions d'écriture coexistent dans les dossiers, et les
			   deux sont des définitions : le titre de section, et le chapeau en
			   gras d'un paragraphe. Aucune n'est privilégiée. */
			const texte = readFileSync(join(dossierEcarts, entree), 'utf8');
			/** @type {Set<string>} */
			const numerotes = new Set();
			for (const e of texte.matchAll(/^(?:#{2,4}\s*|\*\*)É-(\d+)/gm)) numerotes.add(`É-${e[1]}`);
			ecartsE.set(numero, numerotes);
		}
	}

	/** @type {Set<string>} */
	const arbitrages = new Set();
	for (const m of lire(SOURCES_DE_REGISTRE.arbitrages).matchAll(/^##\s+ARB-(\d{3})\b/gm)) {
		arbitrages.add(`ARB-${m[1]}`);
	}

	const claude = lire(SOURCES_DE_REGISTRE.claude);
	/** @type {Set<string>} */
	const pieges = new Set();
	for (const m of claude.matchAll(/^###\s+P-(\d{1,2})\s/gm)) pieges.add(`P-${m[1]}`);
	/** @type {Set<string>} */
	const principes = new Set();
	for (const m of claude.matchAll(/^\|\s*P-(0\d)\s*\|/gm)) principes.add(`P-${m[1]}`);
	/** @type {Set<string>} */
	const amendements = new Set();
	for (const m of lire(SOURCES_DE_REGISTRE.amendements).matchAll(
		/^\|\s*\*\*P-(\d{1,2})\*\*\s*\|/gm
	)) {
		amendements.add(`P-${m[1]}`);
	}

	return { ecarts, ecartsE, arbitrages, pieges, principes, amendements };
}

/* ══ LE VERDICT ═══════════════════════════════════════════════════════════ */

/**
 * @typedef {ReturnType<typeof registresDuDepot>} Registres
 * @typedef {{fichier: string, ligne: number, genre: string, numero: string, brut: string}} Citation
 */

/**
 * Le sort d'une citation. Quatre issues, et une seule est rouge.
 *
 *   resolue        la pièce existe ;
 *   documente      un registre d'absence la nomme comme absente — comptée à
 *                  part, jamais effacée ;
 *   sans-registre  aucun registre n'existe pour ce genre de porteur ;
 *   pointeur-mort  le registre existe, la pièce n'y est pas. LE ROUGE.
 *
 * @param {Citation} c
 * @param {Registres} reg
 * @param {typeof TRACES_D_ABSENCE} [traces]
 * @returns {{sort: string, motif: string}}
 */
export function sortDeLaCitation(c, reg, traces = TRACES_D_ABSENCE) {
	if (c.genre === 'e-nu') {
		return { sort: 'sans-registre', motif: 'É-n sans porteur : local au document, non traçable' };
	}
	if (c.genre === 'e-de-lot') {
		return {
			sort: 'sans-registre',
			motif: 'les rapports de lot ne sont pas des fichiers du dépôt'
		};
	}

	/* Un `É-n` qualifié est jugé par son PORTEUR : le registre d'absence qui
	   déclare le dossier manquant couvre aussi les écarts qu'on y nomme. */
	const porteurDe = (/** @type {string} */ n) => n.split(' ')[0] ?? n;
	const trace = traces.find(
		(t) => t.fichier === c.fichier && t.numeros.includes(porteurDe(c.numero))
	);

	if (c.genre === 'ecart') {
		if (reg.ecarts.has(c.numero)) return { sort: 'resolue', motif: 'docs/ecarts/' };
		if (trace) return { sort: 'documente', motif: trace.motif };
		return { sort: 'pointeur-mort', motif: `aucun docs/ecarts/${c.numero}.md` };
	}
	if (c.genre === 'arb') {
		if (reg.arbitrages.has(c.numero)) return { sort: 'resolue', motif: 'docs/arbitrages.md' };
		if (trace) return { sort: 'documente', motif: trace.motif };
		return { sort: 'pointeur-mort', motif: `aucune entrée « ${c.numero} » au registre` };
	}
	if (c.genre === 'piege') {
		if (reg.pieges.has(c.numero)) return { sort: 'resolue', motif: 'CLAUDE.md §6' };
		if (reg.principes.has(c.numero)) return { sort: 'resolue', motif: 'CLAUDE.md §5' };
		if (reg.amendements.has(c.numero)) return { sort: 'resolue', motif: 'docs/releve-vues.md §4' };
		return { sort: 'pointeur-mort', motif: 'aucun des trois registres de la forme P-n' };
	}
	/* e-decart : le porteur doit exister ET numéroter l'écart cité. */
	const [porteur, numeroE] = c.numero.split(' ');
	if (!reg.ecarts.has(porteur ?? '')) {
		if (trace) return { sort: 'documente', motif: trace.motif };
		return { sort: 'pointeur-mort', motif: `aucun docs/ecarts/${porteur}.md` };
	}
	const numerotes = reg.ecartsE.get(porteur ?? '');
	if (numerotes && numerotes.has(numeroE ?? '')) {
		return { sort: 'resolue', motif: `${porteur}.md` };
	}
	return { sort: 'pointeur-mort', motif: `${porteur}.md ne numérote pas ${numeroE}` };
}

/**
 * Le verdict complet.
 * @param {Citation[]} citations
 * @param {Registres} reg
 * @param {typeof TRACES_D_ABSENCE} [traces]
 */
export function confronter(citations, reg, traces = TRACES_D_ABSENCE) {
	const juges = citations.map((c) => ({ ...c, ...sortDeLaCitation(c, reg, traces) }));
	const morts = juges.filter((j) => j.sort === 'pointeur-mort');

	/** @type {Map<string, {genre: string, citations: typeof morts}>} */
	const parNumero = new Map();
	for (const m of morts) {
		const entree = parNumero.get(m.numero) ?? { genre: m.genre, citations: [] };
		entree.citations.push(m);
		parNumero.set(m.numero, entree);
	}

	/** @type {Record<string, number>} */
	const numerosParGenre = {};
	for (const [, v] of parNumero) numerosParGenre[v.genre] = (numerosParGenre[v.genre] ?? 0) + 1;

	const exercees = new Set(
		juges
			.filter((j) => j.sort === 'documente')
			.map((j) => `${j.fichier} ${j.numero.split(' ')[0] ?? j.numero}`)
	);
	/** @type {{fichier: string, numero: string}[]} */
	const exemptionsPerimees = [];
	for (const t of traces) {
		for (const n of t.numeros) {
			if (!exercees.has(`${t.fichier} ${n}`))
				exemptionsPerimees.push({ fichier: t.fichier, numero: n });
		}
	}

	return {
		juges,
		morts,
		parNumero,
		numerosParGenre,
		exemptionsPerimees,
		comptes: {
			total: juges.length,
			resolue: juges.filter((j) => j.sort === 'resolue').length,
			documente: juges.filter((j) => j.sort === 'documente').length,
			sansRegistre: juges.filter((j) => j.sort === 'sans-registre').length,
			pointeurMort: morts.length
		}
	};
}

/* ══ LES SONDES ═══════════════════════════════════════════════════════════
   Elles perturbent le CANDIDAT en mémoire — le corpus lu, ou le registre lu.
   Aucune n'écrit sur le disque : `git status` reste propre par construction,
   ce qu'aucune restauration n'a besoin de rétablir. */

/**
 * La citation que pose une sonde. Elle vit en mémoire et porte un chemin qui
 * n'existe pas : rien n'est écrit, rien n'est à restaurer.
 * @param {string} genre @param {string} numero @returns {Citation}
 */
const citationDeSonde = (genre, numero) => ({
	fichier: 'verif/(sonde en mémoire)',
	ligne: 1,
	genre,
	numero,
	brut: numero
});

/** @type {Record<string, {quoi: string, corpus?: (c: Citation[]) => Citation[], registres?: (r: Registres) => Registres}>} */
export const SONDES = {
	'pointeur-invente': {
		quoi: 'une citation d’un numéro d’arbitrage qui n’a jamais existé',
		corpus: (citations) => [...citations, citationDeSonde('arb', numeroDe(GENRE_ARB, '993'))]
	},
	'piece-retiree': {
		quoi: 'une pièce réelle soustraite du registre des écarts',
		registres: (reg) => {
			const ecarts = new Set(reg.ecarts);
			ecarts.delete(numeroDe(GENRE_ECART, '011'));
			return { ...reg, ecarts };
		}
	},
	'temoin-inerte': {
		quoi: 'une citation d’un numéro qui EXISTE — la mutation qui ne touche rien',
		corpus: (citations) => [...citations, citationDeSonde('arb', numeroDe(GENRE_ARB, '001'))]
	}
};

/* ══ EXÉCUTION ════════════════════════════════════════════════════════════ */

/** @param {string[]} args */
export function principal(args) {
	const t0 = Date.now();
	const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);
	const details = args.includes('--details');
	/** @type {Record<string, number>} */
	const seuils = {};
	for (const a of args) {
		const m = /^--seuil-(ecart|arb|piege|e-decart)=(\d+)$/.exec(a);
		if (m) seuils[m[1] ?? ''] = Number(m[2]);
	}
	if (sonde !== undefined && !(sonde in SONDES)) {
		console.error(
			`verif:tracabilite — sonde inconnue « ${sonde} ». Connues : ${Object.keys(SONDES).join(', ')}.`
		);
		return 1;
	}

	const fichiers = fichiersDuPerimetre();
	const citationsReelles = citationsDuCorpus(fichiers);
	const registresReels = registresDuDepot();
	const reference = confronter(citationsReelles, registresReels);

	const mutation = sonde === undefined ? null : SONDES[sonde];
	const citations = mutation?.corpus ? mutation.corpus(citationsReelles) : citationsReelles;
	const reg = mutation?.registres ? mutation.registres(registresReels) : registresReels;
	const r = sonde === undefined ? reference : confronter(citations, reg);

	/* ── Le rapport ────────────────────────────────────────────────────── */
	console.log('\nverif:tracabilite — aucune référence sans pièce porteuse');
	console.log(`  fichiers lus : ${fichiers.length}   ·   citations relevées : ${r.comptes.total}`);
	console.log(
		`  registres : ${reg.ecarts.size} dossiers d’écart · ${reg.arbitrages.size} arbitrages · ` +
			`${reg.pieges.size} pièges · ${reg.principes.size} principes · ${reg.amendements.size} amendements`
	);
	console.log(
		`  résolues ${r.comptes.resolue} · documentées comme absentes ${r.comptes.documente} · ` +
			`sans registre ${r.comptes.sansRegistre} · POINTEURS MORTS ${r.comptes.pointeurMort}`
	);

	if (r.comptes.pointeurMort > 0) {
		console.log('\n  LES NUMÉROS SANS PIÈCE, ET D’OÙ ILS SONT CITÉS');
		for (const [numero, v] of [...r.parNumero].sort()) {
			console.log(`    ${numero.padEnd(18)} ${String(v.citations.length).padStart(3)} citation(s)`);
			for (const c of v.citations) {
				console.log(`        ${c.fichier}:${c.ligne}   ${c.motif}`);
			}
		}
	}

	if (r.comptes.documente > 0) {
		console.log('\n  NOMMÉS COMME ABSENTS PAR UN REGISTRE D’ABSENCE — comptés, jamais effacés');
		/** @type {Map<string, number>} */
		const parNum = new Map();
		for (const j of r.juges.filter((x) => x.sort === 'documente')) {
			parNum.set(j.numero, (parNum.get(j.numero) ?? 0) + 1);
		}
		for (const [n, k] of [...parNum].sort()) console.log(`    ${n.padEnd(18)} ${k} citation(s)`);
	}

	if (r.exemptionsPerimees.length > 0) {
		console.log('\n  EXEMPTIONS PÉRIMÉES — plus exercées par aucune citation, à retirer (P-5)');
		for (const e of r.exemptionsPerimees) console.log(`    ${e.fichier}  ${e.numero}`);
	}

	console.log('\n  CE QUE CE COMPTE NE COUVRE PAS — mesuré, pas supposé');
	const nus = r.juges.filter((j) => j.genre === 'e-nu').length;
	const deLot = r.juges.filter((j) => j.genre === 'e-de-lot').length;
	const homographes = r.juges.filter(
		(j) => j.genre === 'piege' && j.sort === 'resolue' && j.motif !== 'CLAUDE.md §6'
	).length;
	console.log(`    ${nus} « É-n » nus — locaux à leur document, aucun porteur à interroger`);
	console.log(`    ${deLot} « T-xxx É-n » — les rapports de lot ne sont pas des fichiers du dépôt`);
	console.log(`    ${homographes} « P-n » résolus hors des pièges du §6 — la forme est homographe`);

	if (details) {
		console.log('\n  TOUTES LES CITATIONS');
		for (const j of r.juges) {
			console.log(`    ${`${j.fichier}:${j.ligne}`.padEnd(52)} ${j.numero.padEnd(18)} ${j.sort}`);
		}
	}

	/* ── Le seuil : proposé, jamais appliqué d'office ───────────────────── */
	const genresRouges = Object.keys(r.numerosParGenre).sort();
	let horsSeuil = false;
	for (const genre of genresRouges) {
		const mesure = r.numerosParGenre[genre] ?? 0;
		const seuil = seuils[genre];
		if (seuil === undefined) {
			if (mesure > 0) horsSeuil = true;
		} else if (mesure > seuil) {
			horsSeuil = true;
		}
	}
	for (const genre of Object.keys(seuils)) {
		const mesure = r.numerosParGenre[genre] ?? 0;
		const seuil = seuils[genre] ?? 0;
		if (mesure < seuil) {
			console.log(
				`\n  SEUIL PÉRIMÉ — genre « ${genre} » arbitré à ${seuil}, mesuré à ${mesure}. Il doit\n` +
					'    redescendre, sans quoi il absoudrait par avance une régression future.'
			);
		}
	}

	if (r.comptes.pointeurMort > 0 && Object.keys(seuils).length === 0) {
		console.log(
			'\n  SEUILS DE DÉPART PROPOSÉS, PAR GENRE — jamais un compte global (orchestration §4)'
		);
		for (const genre of genresRouges) {
			console.log(`    --seuil-${genre}=${r.numerosParGenre[genre]}`);
		}
		console.log(
			'    Ils ne sont PAS écrits dans cet instrument : un seuil que la mesure se donne à\n' +
				'    elle-même ne mesure rien (orchestration §4, « ne te donne pas ton seuil »).\n' +
				'    Tant qu’ils ne sont pas arbitrés, ce ROUGE est le verdict.'
		);
	}

	const duree = ((Date.now() - t0) / 1000).toFixed(1);
	const DOSSIER = join(racine, 'verif', 'rapports');
	mkdirSync(DOSSIER, { recursive: true });
	writeFileSync(
		join(DOSSIER, 'tracabilite.json'),
		JSON.stringify(
			{
				regle: 'aucune référence sans pièce porteuse',
				source: 'ECART-043',
				sonde: sonde ?? null,
				fichiers: fichiers.length,
				comptes: r.comptes,
				numeros_sans_piece: [...r.parNumero].map(([numero, v]) => ({
					numero,
					genre: v.genre,
					citations: v.citations.map((c) => `${c.fichier}:${c.ligne}`)
				})),
				seuils_proposes: r.numerosParGenre,
				seuils_arbitres: seuils,
				exemptions_perimees: r.exemptionsPerimees,
				duree_s: Number(duree)
			},
			null,
			'\t'
		) + '\n'
	);

	if (sonde === undefined) {
		if (!horsSeuil) {
			console.log(`\n  Toute référence a sa pièce. ${duree} s\n`);
			return 0;
		}
		console.error(
			`\n  ÉCHEC : ${r.comptes.pointeurMort} citation(s) renvoient à ${r.parNumero.size} numéro(s)\n` +
				'  dont la pièce n’existe pas. Un seuil dont la justification est un pointeur mort\n' +
				`  n’est pas auditable (ECART-043). ${duree} s\n`
		);
		return 1;
	}

	/* La sonde : le verdict doit avoir CHANGÉ, sans quoi elle ne teste rien. */
	const bouge =
		r.comptes.pointeurMort !== reference.comptes.pointeurMort ||
		r.parNumero.size !== reference.parNumero.size;
	if (!bouge) {
		console.error(
			`\n  sonde ${sonde} : LA MUTATION N’A RIEN CHANGÉ AU VERDICT — ${reference.comptes.pointeurMort}\n` +
				'  pointeurs morts avant comme après. Une perturbation qui ne change rien ne teste\n' +
				'  rien : refus de conclure, code 2 non inversé.\n'
		);
		return 2;
	}
	console.log(
		`\n  sonde ${sonde} — ${mutation?.quoi}\n` +
			`    pointeurs morts : ${reference.comptes.pointeurMort} → ${r.comptes.pointeurMort}\n` +
			'    la batterie a dit non — code de retour inversé, 0.\n'
	);
	return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	process.exit(principal(process.argv.slice(2)));
}
