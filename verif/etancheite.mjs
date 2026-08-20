#!/usr/bin/env node
/**
 * `pnpm test:etancheite` — BATTERIE 6 du catalogue (PLAN-DE-REALISATION.md §5,
 * ligne 341) : **l'étanchéité du périmètre**.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL PROUVE
 *
 * Plan §5 l. 341, recopiée : « Matrice TOUTES ROUTES × TOUS PERSONAS —
 * anonyme, contributeur sans droit, lecteur, rédacteur, gestionnaire,
 * administrateur. Aucun contenu interne n'est atteignable en anonyme, PAR
 * AUCUN CHEMIN, y compris par adresse construite ; refus et inexistence sont
 * INDISCERNABLES. » — `RG-ACC-01`, `RG-ACC-04`, `RG-M02-04`, `RG-M17-01`,
 * `RG-M04-08`, `PU-03`.
 *
 * Indiscernable veut dire QUATRE choses (`docs/routes.md:399`, `ARB-005`) :
 * corps, en-têtes, code, ET TEMPS DE RÉPONSE. Les quatre sont mesurées, la
 * quatrième avec son plancher de bruit mesuré sur couple témoin entrelacé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE PROUVE PAS, ET C'EST LA PARTIE QUI COMPTE
 *
 * SEPT ROUTES SUR TRENTE-NEUF EXISTENT au 20 août 2026. Sur les trente-deux
 * autres, une adresse rend le 404 générique de SvelteKit — et ce 404 est
 * ÉGAL à celui qu'un refus devrait produire. La matrice serait donc verte sur
 * ces cases SANS QUE RIEN NE SOIT PROUVÉ : c'est le mode de défaillance
 * `RA-01` du plan (§12), « un banc toujours vert ne prouve rien ».
 *
 * La batterie les compte donc à part, sous le nom de VACUITÉ, et le nombre de
 * cases vacantes est un ÉCHEC, pas une réussite. Trois conséquences, assumées :
 *
 *   1. `pnpm test:etancheite` ne peut pas être verte avant que la dernière
 *      route du produit n'existe. C'est la propriété recherchée.
 *   2. Le compte de vacuités DOIT DESCENDRE à chaque lot de route. Il est le
 *      seul chiffre qui dise ce qui reste à prouver.
 *   3. Aucun seuil n'est posé ici — `verif/references/` est en écriture humaine
 *      seule, et `docs/orchestration.md` §1.2 règle 6 : « ne te donne pas ton
 *      seuil ». La batterie rend le chiffre ; l'arbitrage en fait ce qu'il veut.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LE PRODUIT CONSTRUIT, ET NON LE SERVEUR DE DÉVELOPPEMENT
 *
 * `ARB-053` fait dépendre l'origine de `RG-M16-01` de deux variables
 * d'environnement — `ADDRESS_HEADER` et `XFF_DEPTH` — que `@sveltejs/adapter-node`
 * lit À L'EXÉCUTION, dans son propre serveur. `vite dev` ne les honore pas :
 * son `getClientAddress()` rend l'adresse de la prise. Une batterie qui
 * mesurerait le serveur de développement mesurerait donc un chemin que
 * l'exploitation n'emprunte pas — exactement la faute d'`ECART-013` É-1, où un
 * étalonnage vert ne traversait pas `render()`.
 *
 * Le produit est donc CONSTRUIT (3 s) et servi par `node build/index.js`, avec
 * la configuration LUE DANS `compose.yaml` — pas passée par cette batterie.
 * C'est ce qui rend le contrôle d'`ARB-053` opposable : si les deux variables
 * disparaissaient de la composition, la batterie rougirait.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES QUATRE SONDES, ET CELLE QUI REFUSE DE CONCLURE
 *
 * `docs/orchestration.md` §1.2 règle 4 : « mutation d'au moins deux genres […]
 * et prouve que la mutation n'est pas inerte ». Deux genres sont ici :
 *
 *   --sonde=fuite-de-regime          l'OBSERVATION : un refus devient un 200
 *   --sonde=refus-discernable        l'OBSERVATION : un côté du couple bouge
 *   --sonde=latence-discernable      l'OBSERVATION : le couple temporel change
 *                                    de côté — 401 (Argon2id) contre 429 (sans),
 *                                    les deux chemins de coûts opposés que le
 *                                    dépôt porte déjà (T-012, 11,55 ms)
 *   --sonde=confiance-trop-profonde  LA CONFIGURATION du candidat : `XFF_DEPTH`
 *                                    à 2, et l'origine forgée par le client
 *                                    passe
 *   --sonde=temoin-inerte            LA SONDE QUI NE TOUCHE RIEN, et elle est là
 *                                    pour être jouée. La batterie doit REFUSER
 *                                    DE CONCLURE — code 1, jamais inversé.
 *
 * Le code de retour est inversé sous sonde : une sonde qui ne fait pas rougir
 * est un échec. L'inversion s'arrête au refus de conclure — inverser une
 * mutation inerte fabriquerait un vert à partir de rien.
 *
 * Usage :
 *   node verif/etancheite.mjs                    la batterie
 *   node verif/etancheite.mjs --matrice          + la matrice complète, case à case
 *   node verif/etancheite.mjs --sonde=<genre>    la preuve qu'elle sait dire non
 *   node verif/etancheite.mjs --sans-construire  diagnostic : réemploie build/
 *
 * Codes de retour : 0 étanche et prouvé · 1 défaut ou vacuité · 2 refus de
 * mesurer (table incohérente, base absente, méthode instable).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import { racine } from './banc/inventaire.mjs';
import { routesDuDepot } from './menus.mjs';
import {
	ADRESSES_CONSTRUITES,
	PERSONAS,
	attenduDe,
	cleDeRapprochement,
	famillesDuRefus,
	niveauxParRoute,
	rapprocher,
	recouper,
	texteDesRoutes,
	verdictTemporel
} from './etancheite-attendu.mjs';

const args = argv.slice(2);
const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);
const montrerLaMatrice = args.includes('--matrice');
const sansConstruire = args.includes('--sans-construire');

/** Le port de cette copie de travail (`verif/preparer-copie.sh`), à défaut 5913. */
const PORT = Number(process.env.PORT_DEV ?? 5913);

/** Le nombre de tirages par série de la mesure temporelle. Fixé : un nombre
 *  réglable par la ligne de commande rendrait le verdict non reproductible. */
const TIRAGES = 40;

/** Les deux origines feintes de la mesure et du contrôle d'`ARB-053`. */
const ORIGINE_A = '203.0.113.7';
const ORIGINE_B = '203.0.113.8';
/** Une valeur que le CLIENT prétendrait être — `ARB-053` cas 2. */
const ORIGINE_FORGEE = '9.9.9.9';

/** Les valeurs que le corpus ne porte pas, et dont l'absence est vérifiée. */
const ABSENT = 'ceci-n-existe-pas-dans-le-corpus';

/** @type {{genre: string, quoi: string, detail: string}[]} */
const defauts = [];
/** @type {string[]} */
const refusDeMesurer = [];
let touchesDeLaSonde = 0;

/* ═══════════════════════════════════════════════════════════════════════════
   1. LA TABLE, ÉPROUVÉE AVANT TOUTE MESURE

   `docs/orchestration.md` §1.2 règle 3 : « Éprouve ta table avant de mesurer.
   Un régime qu'aucune route ne satisfait, un persona qu'aucun compte
   n'incarne : code 2, jamais vert. »
   ═════════════════════════════════════════════════════════════════════════ */

const texte = texteDesRoutes();
const routes = routesDuDepot(texte);
const { familles, refus: refusFamilles } = famillesDuRefus(texte);
const { niveaux, refus: refusNiveaux } = niveauxParRoute(texte);
const rapprochement = rapprocher(routes, familles);

/* Le même garde-fou que `verif/menus.mjs:923`, et pour la même raison : un
   instrument qui mesure contre une source qu'il ne reconnaît plus mesure autre
   chose. Le nombre n'est pas recopié d'ici — il est celui du §9 de la source,
   dont `menus.mjs` porte déjà la vérification. */
const ATTENDU_ROUTES = 39;
if (routes.length !== ATTENDU_ROUTES) {
	refusDeMesurer.push(
		`§3 de docs/routes.md rend ${routes.length} routes, ${ATTENDU_ROUTES} attendues — la source a bougé`
	);
}
refusDeMesurer.push(...refusFamilles, ...refusNiveaux, ...rapprochement.refus);
refusDeMesurer.push(...recouper(familles, niveaux));

/* Une seule route est décrite par DEUX lignes de §5.5 — `/guides/{identifiant}`,
   selon que la note est publique et publiée ou non (`routes.md:364-365`). Si
   une seconde apparaissait, la règle de choix ci-dessous serait muette pour
   elle : mieux vaut refuser de mesurer que choisir au hasard. */
const aPlusieursFamilles = [...rapprochement.parRoute.entries()].filter(([, i]) => i.length > 1);
for (const [route] of aPlusieursFamilles) {
	if (route !== '/guides/{identifiant}') {
		refusDeMesurer.push(
			`route « ${route} » : deux lignes de §5.5 la décrivent, et aucune règle ne les départage`
		);
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LES ROUTES QUE `src/routes` PORTE RÉELLEMENT

   Lues dans l'arborescence, jamais déclarées : c'est ce qui distingue une case
   PROUVÉE d'une case VACANTE.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Les motifs de route que `src/routes` monte réellement, en forme
 * `docs/routes.md` : `[param]` devient `{param}`, un groupe `(x)` ne produit
 * pas de segment, et seul un fichier de point d'entrée fait une route.
 */
function routesImplementees() {
	/** @type {Set<string>} */
	const trouvees = new Set();
	/** @param {string} dossier @param {string} chemin */
	const descendre = (dossier, chemin) => {
		for (const entree of readdirSync(dossier, { withFileTypes: true })) {
			const complet = join(dossier, entree.name);
			if (entree.isDirectory()) {
				if (entree.name.startsWith('(')) {
					descendre(complet, chemin);
					continue;
				}
				const segment = entree.name.replace(/^\[(?:\.\.\.)?/, '{').replace(/\]$/, '}');
				descendre(complet, `${chemin}/${segment}`);
				continue;
			}
			if (/^\+(page\.svelte|page\.server\.ts|server\.ts)$/.test(entree.name)) {
				trouvees.add(chemin === '' ? '/' : chemin);
			}
		}
	};
	descendre(join(racine, 'src', 'routes'), '');
	return trouvees;
}

const implementees = routesImplementees();

/**
 * Le motif de `docs/routes.md` que `src/routes` monte, ou `null`.
 *
 * Les noms de paramètres diffèrent des deux côtés — `{identifiant}` contre
 * `[id]` — et c'est normal : la source nomme le concept, le code nomme la
 * variable. Le rapprochement se fait donc sur la FORME du chemin, paramètres
 * réduits à un jeton unique. La clé est éprouvée dans les deux sens par
 * `verif/etancheite.test.ts`.
 * @param {string} motif
 */
function estImplementee(motif) {
	const forme = (m) => m.replace(/\{chemin…\}/g, '{*}').replace(/\{[^}]*\}/g, '{p}');
	const cible = forme(motif);
	for (const m of implementees) if (forme(m) === cible) return true;
	return false;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. LA CONFIGURATION D'EXPLOITATION, LUE DANS `compose.yaml`

   `ARB-053` : « Deux variables d'environnement posées dans `compose.yaml` sont
   DE LA FORME : elles voyagent avec la composition. » La batterie les lit donc
   là, et non dans son propre code : c'est ce qui fait qu'un retrait de la
   composition la fait rougir.
   ═════════════════════════════════════════════════════════════════════════ */

const compose = readFileSync(join(racine, 'compose.yaml'), 'utf8');

/** @param {string} nom */
function variableDeComposition(nom) {
	const trouvee = compose.match(new RegExp(`^\\s*${nom}:\\s*'?([^'\n#]+)'?`, 'm'));
	return trouvee === null ? null : trouvee[1].trim();
}

const configuration = {
	adresseEntete: variableDeComposition('ADDRESS_HEADER'),
	profondeur: variableDeComposition('XFF_DEPTH')
};

/**
 * LA PRÉMISSE D'`ARB-053`, ET ELLE EST VÉRIFIÉE ICI À CHAQUE EXÉCUTION.
 *
 * « Ma confiance en `X-Forwarded-For` repose ENTIÈREMENT sur la publication de
 * port du service `app`, et si cette ligne ne dit pas ce que je crois, la
 * décision tombe » (ARB-053, où elle était citée à `compose.yaml:117` — la
 * correction de ce lot l'a déplacée, et c'est pourquoi ce contrôle relit le
 * FICHIER et non un numéro de ligne). Ce que la ligne doit dire : le service `app` n'est publié que sur la boucle locale.
 * Sans cela, un client atteindrait l'application sans passer par le frontal et
 * forgerait l'en-tête à volonté.
 */
function premisseDArb053() {
	/** @type {string[]} */
	const constats = [];
	const publications = [...compose.matchAll(/^\s*- '([^']*:\d+|\d+:\d+)'/gm)].map((m) => m[1]);
	const ouvertes = publications.filter((p) => !p.startsWith('127.0.0.1:'));
	/* Le frontal DOIT être ouvert : c'est le seul chemin d'entrée voulu. */
	const attenduesOuvertes = ['${PORT_HTTP:-19080}:80', '${PORT_HTTPS:-19443}:443'];
	for (const p of ouvertes) {
		if (!attenduesOuvertes.includes(p)) {
			constats.push(`compose.yaml publie « ${p} » hors de la boucle locale`);
		}
	}
	if (
		!/reverse_proxy\s+app:3000/.test(readFileSync(join(racine, 'frontal', 'Caddyfile'), 'utf8'))
	) {
		constats.push('frontal/Caddyfile ne proxifie plus app:3000 — le chemin d’entrée a changé');
	}
	return { constats, publications, ouvertes };
}

const premisse = premisseDArb053();

/* ═══════════════════════════════════════════════════════════════════════════
   4. LA BASE — LES PERSONAS S'Y FORGENT POUR DE VRAI
   ═════════════════════════════════════════════════════════════════════════ */

const pg = (await import('pg')).default;
try {
	process.loadEnvFile(join(racine, '.env'));
} catch {
	/* Pas de `.env` : l'environnement du processus fait foi (`base/base.mjs`). */
}

const bassin = new pg.Pool({
	host: process.env.HOTE_BASE ?? process.env.HOTE_POSTGRES ?? '127.0.0.1',
	port: Number(process.env.PORT_BASE ?? process.env.PORT_DB ?? 19432),
	user: process.env.UTILISATEUR_BASE ?? process.env.UTILISATEUR_POSTGRES ?? 'codicillus',
	password: process.env.MDP_BASE ?? process.env.MDP_POSTGRES,
	database: process.env.NOM_BASE ?? process.env.BASE_POSTGRES ?? 'codicillus'
});

/** @param {string} sql @param {unknown[]} [valeurs] */
async function interroger(sql, valeurs = []) {
	const r = await bassin.query(sql, valeurs);
	return r.rows;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LE JEU D'ADRESSES — CONSTRUITES DEPUIS LES MOTIFS DE LA SOURCE

   « Y COMPRIS PAR ADRESSE CONSTRUITE » est dans l'énoncé de la batterie. Les
   adresses sont donc composées en substituant les paramètres des 39 motifs de
   `docs/routes.md` §3 — jamais en appelant `src/lib/rangement/adresses.ts`,
   qui est du candidat : un défaut de forme y serait hérité par la mesure.

   Chaque paramètre reçoit DEUX valeurs quand le corpus le permet : une qui
   existe, une qui n'existe pas. C'est le couple de la règle 1 —
   `existe-mais-interdit` contre `n'existe-pas`, sur la MÊME forme d'adresse.
   ═════════════════════════════════════════════════════════════════════════ */

/** @typedef {{route: string, chemin: string, variante: string, famille: number,
 *   raisonSansValeur: string|null}} Instance */

/** Les valeurs de substitution, tirées de la base semée. */
async function valeursDuCorpus() {
	/* Le couple (univers, domaine) est tiré ENSEMBLE, et c'est le domaine le plus
	   profond du corpus qui est retenu : c'est le seul qui garantisse une chaîne
	   de dossiers pour `{chemin…}`. Un univers choisi seul peut n'avoir aucun
	   domaine — `non-classe` n'en a pas, et la première rédaction s'y est prise. */
	const [domaine] = await interroger(
		`select d.identifiant as domaine, u.identifiant as univers, count(f.id) as dossiers
		   from domaines d
		   join univers u on u.id = d.univers_id
		   left join dossiers f on f.domaine_id = d.id
		  group by d.identifiant, u.identifiant
		  order by count(f.id) desc, d.identifiant limit 1`
	);
	const univers = { identifiant: domaine?.univers ?? null };
	const [notePublique] = await interroger(
		"select identifiant from notes where visibilite = 'publique' and statut = 'publiee' order by identifiant limit 1"
	);
	const [noteInterne] = await interroger(
		"select identifiant from notes where not (visibilite = 'publique' and statut = 'publiee') order by identifiant limit 1"
	);
	const [signet] = await interroger(
		`select n.identifiant from notes n join types_de_note t on t.id = n.type_de_note_id
		  where t.identifiant = 'signet' order by n.identifiant limit 1`
	).catch(() => [undefined]);
	/* LA CHAÎNE DE DOSSIERS EST UNE VRAIE CHAÎNE, remontée par les liens de
	   parenté depuis le dossier le plus profond du domaine. Deux dossiers de même
	   profondeur sont des FRÈRES, jamais un chemin : la première rédaction les
	   concaténait, et fabriquait une adresse qui n'existe pas — le côté
	   « existante » du couple aurait été un second inexistant. */
	const dossiers = await interroger(
		`with recursive plus_profond as (
		   select d.id, d.parent_id, d.nom, d.profondeur
		     from dossiers d join domaines dom on dom.id = d.domaine_id
		    where dom.identifiant = $1
		    order by d.profondeur desc, d.nom limit 1
		 ), chaine as (
		   select id, parent_id, nom, profondeur from plus_profond
		   union all
		   select d.id, d.parent_id, d.nom, d.profondeur
		     from dossiers d join chaine c on c.parent_id = d.id
		 )
		 select nom, profondeur from chaine order by profondeur`,
		[domaine?.domaine ?? 'infrastructure']
	);
	const pieces = await interroger('select nom from pieces_jointes limit 1').catch(() => []);
	return {
		univers: univers?.identifiant ?? null,
		domaine: domaine?.domaine ?? null,
		notePublique: notePublique?.identifiant ?? null,
		noteInterne: noteInterne?.identifiant ?? null,
		signet: signet?.identifiant ?? null,
		dossier:
			dossiers.length > 1
				? dossiers
						.slice(1)
						.map((d) => segmentLisible(d.nom))
						.join('/')
				: null,
		piece: pieces[0]?.nom ?? null,
		lot: null
	};
}

/** L'identifiant lisible d'un nom — même règle que `identifiantLisible()`,
 *  écrite ici pour ne pas dépendre du candidat. */
function segmentLisible(nom) {
	return String(nom)
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

const corpus = await valeursDuCorpus();

/**
 * Les instances d'une route : le chemin réellement demandé, et sa variante.
 * @param {string} route
 * @returns {Instance[]}
 */
function instancesDe(route) {
	const familleDe = (variante) => {
		const index = rapprochement.parRoute.get(route) ?? [0];
		if (route !== '/guides/{identifiant}') return index[0] ?? 0;
		/* `routes.md:364` sert la note publique et publiée ; `:365` refuse la note
		   interne ou brouillon. La variante dit laquelle des deux lignes gouverne. */
		return variante === 'existante' ? (index[0] ?? 0) : (index[1] ?? index[0] ?? 0);
	};

	/** @type {{cle: string, valeur: string|null, motif: string}[]} */
	const parametres = [];
	for (const m of route.matchAll(/\{([^}]*)\}/g)) {
		const cle = m[1];
		if (cle === 'univers')
			parametres.push({ cle, valeur: corpus.univers, motif: 'univers du corpus' });
		else if (cle === 'domaine')
			parametres.push({ cle, valeur: corpus.domaine, motif: 'domaine du corpus' });
		else if (cle === 'chemin…')
			parametres.push({ cle, valeur: corpus.dossier, motif: 'chaîne de dossiers du corpus' });
		else if (cle === 'jeton')
			parametres.push({ cle, valeur: null, motif: 'aucun jeton de réinitialisation en base' });
		else if (cle === 'fichier')
			parametres.push({
				cle,
				valeur: corpus.piece,
				motif: 'la semence n’écrit aucune pièce jointe (seeds, manque 6)'
			});
		else if (cle === 'lot')
			parametres.push({ cle, valeur: null, motif: 'aucune table d’imports en base' });
		else if (route.startsWith('/guides'))
			parametres.push({ cle, valeur: corpus.notePublique, motif: 'note publique et publiée' });
		else if (route.includes('/signets/'))
			parametres.push({ cle, valeur: corpus.signet, motif: 'note de type Signet' });
		else parametres.push({ cle, valeur: corpus.noteInterne, motif: 'note du corpus' });
	}

	if (parametres.length === 0) {
		return [
			{
				route,
				chemin: route,
				variante: 'fixe',
				famille: familleDe('existante'),
				raisonSansValeur: null
			}
		];
	}
	const manquant = parametres.find((p) => p.valeur === null);
	/**
	 * Substitue les paramètres dans l'ordre où le motif les porte.
	 *
	 * LE CÔTÉ INEXISTANT GARDE LE MÊME NOMBRE DE SEGMENTS que le côté existant,
	 * et c'est indispensable. `{chemin…}` en porte plusieurs, et la page d'erreur
	 * de SvelteKit lie ses ressources en chemin RELATIF : une adresse plus
	 * profonde d'un cran rend un corps plus long d'un `../`. Mesuré : 15 octets
	 * d'écart, sept faux « couples discernables » — la faute d'`ECART-041`, où
	 * une clé mal choisie a fabriqué 31 faux défauts sur 31. Le couple doit
	 * porter la MÊME FORME d'adresse, profondeur comprise, sinon il mesure la
	 * profondeur et non l'existence.
	 */
	const substituer = (existante) => {
		let i = 0;
		return route.replace(/\{[^}]*\}/g, () => {
			const p = parametres[i++];
			if (existante) return p?.valeur ?? ABSENT;
			const segments = (p?.valeur ?? '').split('/').length;
			return new Array(Math.max(1, segments)).fill(ABSENT).join('/');
		});
	};
	const cheminExistant = substituer(true);
	const cheminInexistant = substituer(false);

	/** @type {Instance[]} */
	const instances = [];
	if (manquant === undefined) {
		instances.push({
			route,
			chemin: cheminExistant,
			variante: 'existante',
			famille: familleDe('existante'),
			raisonSansValeur: null
		});
	}
	instances.push({
		route,
		chemin: cheminInexistant,
		variante: 'inexistante',
		famille: familleDe('inexistante'),
		raisonSansValeur: manquant === undefined ? null : `${manquant.cle} — ${manquant.motif}`
	});
	/* `/guides/{identifiant}` a une troisième instance, et c'est le POINT DUR de
	   V-04 (`routes.md:107`) : la note QUI EXISTE mais n'est pas publique doit
	   rendre exactement ce que rend l'adresse inexistante. */
	if (route === '/guides/{identifiant}' && corpus.noteInterne !== null) {
		instances.push({
			route,
			chemin: `/guides/${corpus.noteInterne}`,
			variante: 'interne',
			famille: familleDe('interne'),
			raisonSansValeur: null
		});
	}
	return instances;
}

/** @type {Instance[]} */
const instances = [];
for (const route of routes) instances.push(...instancesDe(route));
for (const a of ADRESSES_CONSTRUITES) {
	instances.push({
		route: `${a.famille}/…`,
		chemin: a.chemin,
		variante: 'construite',
		famille: familles.findIndex((f) => f.prefixes.includes(a.famille)),
		raisonSansValeur: null
	});
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LES PERSONAS, POSÉS EN BASE
   ═════════════════════════════════════════════════════════════════════════ */

const MOT_DE_PASSE = 'un-mot-de-passe-de-batterie-6';
/** @type {Map<string, {cookie: string|null, compte: string|null, condensat: string|null}>} */
const incarnations = new Map();
/** @type {string|null} */
let dossierRacine = null;
/** @type {string|null} */
let condensatPose = null;

/** Le condensat SHA-256 d'un jeton, comme `src/lib/auth/sessions.ts` l'écrit. */
async function condensatDeJeton(jeton) {
	const { createHash } = await import('node:crypto');
	return createHash('sha256').update(jeton).digest('hex');
}

async function poserLesPersonas() {
	const comptes = await interroger('select id, identifiant, role, actif from comptes');
	if (comptes.length !== 5) {
		refusDeMesurer.push(
			`la base porte ${comptes.length} comptes, 5 attendus — la semence n’est pas celle du corpus`
		);
		return;
	}
	const parIdentifiant = new Map(comptes.map((c) => [c.identifiant, c]));
	const attribution = {
		'contributeur-sans-droit': 'marc.ferreira',
		lecteur: 'marc.ferreira',
		redacteur: 'marc.ferreira',
		gestionnaire: 'marc.ferreira',
		administrateur: 'sophie.nguyen',
		'compte-desactive': 'pierre.dubois'
	};
	const [racineDuDomaine] = await interroger(
		`select d.id from dossiers d join domaines dom on dom.id = d.domaine_id
		  where dom.identifiant = $1 and d.parent_id is null`,
		[corpus.domaine]
	);
	dossierRacine = racineDuDomaine?.id ?? null;
	if (dossierRacine === null) {
		refusDeMesurer.push(
			'aucun dossier racine dans le domaine du corpus : les droits sont inposables'
		);
	}

	for (const persona of PERSONAS) {
		if (!persona.session) {
			incarnations.set(persona.nom, { cookie: null, compte: null, condensat: null });
			continue;
		}
		const identifiant = attribution[persona.nom];
		const compte = parIdentifiant.get(identifiant);
		if (compte === undefined) {
			refusDeMesurer.push(`persona « ${persona.nom} » : aucun compte « ${identifiant} » en base`);
			continue;
		}
		const jeton = `batterie6-${persona.nom}`;
		const condensat = await condensatDeJeton(jeton);
		await interroger(
			'insert into sessions (compte_id, condensat_jeton, souvenir) values ($1, $2, true)',
			[compte.id, condensat]
		);
		incarnations.set(persona.nom, {
			cookie: `codicillus_session=${jeton}`,
			compte: compte.id,
			condensat
		});
	}

	/* Le condensat que la console M14.6 posera. La semence n'en pose aucun, et
	   c'est voulu : sans condensat, le couple temporel n'aurait qu'un côté. */
	const marc = parIdentifiant.get('marc.ferreira');
	if (marc !== undefined) {
		const { createServer } = await import('vite');
		const vite = await createServer({
			server: { middlewareMode: true },
			appType: 'custom',
			logLevel: 'error'
		});
		try {
			const M = await vite.ssrLoadModule('/src/lib/auth/mots-de-passe.ts');
			condensatPose = await M.hacherMotDePasse(MOT_DE_PASSE);
			await interroger('update comptes set condensat_mot_de_passe = $1 where id = $2', [
				condensatPose,
				marc.id
			]);
		} finally {
			await vite.close();
		}
	}
}

/** Rouvre la session d'un persona — voir le commentaire de la matrice. */
async function reouvrirLaSession(condensat) {
	if (condensat === null) return;
	await interroger('update sessions set fermee_le = null where condensat_jeton = $1', [condensat]);
}

/** @param {'lecteur'|'redacteur'|'gestionnaire'|null} droit */
async function poserLeDroit(droit, compteId) {
	if (compteId === null || dossierRacine === null) return;
	await interroger('delete from droits_de_dossier where compte_id = $1', [compteId]);
	if (droit === null) return;
	await interroger(
		'insert into droits_de_dossier (dossier_id, compte_id, droit) values ($1, $2, $3)',
		[dossierRacine, compteId, droit]
	);
}

async function nettoyerLaBase() {
	await interroger('delete from sessions');
	await interroger('delete from droits_de_dossier');
	await interroger('delete from tentatives_de_connexion');
	await interroger('update comptes set condensat_mot_de_passe = null');
	return interroger(
		`select (select count(*) from sessions) sessions,
		        (select count(*) from droits_de_dossier) droits,
		        (select count(*) from tentatives_de_connexion) tentatives,
		        (select count(*) from comptes where condensat_mot_de_passe is not null) condensats`
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. LE PRODUIT CONSTRUIT, SERVI, ET ATTENDU SUR UN MARQUEUR ÉCRIT (`P-1`)
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {import('node:child_process').ChildProcess|null} */
let produit = null;

async function servirLeProduit() {
	if (!sansConstruire) {
		const build = spawnSync('pnpm', ['run', 'build'], { cwd: racine, encoding: 'utf8' });
		if (build.status !== 0) {
			refusDeMesurer.push(`la construction a échoué :\n${String(build.stderr).slice(-800)}`);
			return false;
		}
	}
	if (!existsSync(join(racine, 'build', 'index.js'))) {
		refusDeMesurer.push('aucun build/index.js : rien à mesurer');
		return false;
	}
	/** @type {Record<string,string>} */
	const env = {};
	for (const [c, v] of Object.entries(process.env)) if (v !== undefined) env[c] = v;
	env.PORT = String(PORT);
	env.HOST = '127.0.0.1';
	env.ORIGIN = `http://127.0.0.1:${PORT}`;
	if (configuration.adresseEntete !== null) env.ADDRESS_HEADER = configuration.adresseEntete;
	if (configuration.profondeur !== null) env.XFF_DEPTH = configuration.profondeur;
	if (sonde === 'confiance-trop-profonde') {
		touchesDeLaSonde += 1;
		env.XFF_DEPTH = '2';
	}
	produit = spawn(process.execPath, ['build/index.js'], {
		cwd: racine,
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let journal = '';
	produit.stdout?.on('data', (d) => (journal += String(d)));
	produit.stderr?.on('data', (d) => (journal += String(d)));

	/* `P-1` — on attend un MARQUEUR ÉCRIT, jamais la disparition d'un processus.
	   Ici le marqueur est la première réponse HTTP : elle prouve à la fois que le
	   serveur écoute ET qu'il sert, ce qu'une ligne de journal ne dit pas. */
	for (let essai = 0; essai < 120; essai++) {
		const vivant = await fetch(`http://127.0.0.1:${PORT}/connexion`, { redirect: 'manual' }).catch(
			() => null
		);
		if (vivant !== null) return true;
		if (produit.exitCode !== null) {
			refusDeMesurer.push(
				`node build/index.js s’est arrêté en ${String(produit.exitCode)} :\n${journal.slice(-600)}`
			);
			return false;
		}
		await new Promise((r) => setTimeout(r, 150));
	}
	refusDeMesurer.push(`le produit n’a pas répondu sur le port ${PORT} :\n${journal.slice(-600)}`);
	return false;
}

/**
 * Une requête, et l'observation qu'on en tire.
 * @param {string} chemin
 * @param {{cookie?: string|null, origine?: string, methode?: string, corps?: string}} [options]
 */
async function observer(chemin, options = {}) {
	/** @type {Record<string,string>} */
	const entetes = {
		/* UN NAVIGATEUR, ET C'EST DÉCISIF. Mesuré : `POST /connexion` avec
		   l'entête d'acceptation par défaut de `fetch` — le joker de type, celui
		   qu'on ne peut pas citer dans un commentaire de bloc sans le fermer —
		   rend **200**, et porte l'échec dans un corps JSON de 66 octets : la
		   forme que la soumission enrichie de SvelteKit consomme. Avec
		   `accept: text/html`, la MÊME requête rend **401** et la page entière.
		   Une batterie qui aurait gardé le défaut de `fetch` aurait donc mesuré
		   des codes que l'utilisateur ne reçoit jamais. */
		accept: 'text/html,application/xhtml+xml'
	};
	if (options.cookie) entetes.cookie = options.cookie;
	if (configuration.adresseEntete !== null && options.origine !== undefined) {
		entetes[configuration.adresseEntete] = options.origine;
	}
	if (options.corps !== undefined) {
		entetes['content-type'] = 'application/x-www-form-urlencoded';
		entetes.origin = `http://127.0.0.1:${PORT}`;
	}
	const debut = performance.now();
	const reponse = await fetch(`http://127.0.0.1:${PORT}${chemin}`, {
		method: options.methode ?? 'GET',
		headers: entetes,
		body: options.corps,
		redirect: 'manual'
	});
	const corps = await reponse.text();
	const duree = performance.now() - debut;
	/** @type {Record<string,string>} */
	const recus = {};
	for (const [n, v] of reponse.headers.entries()) recus[n] = v;
	return perturber({ status: reponse.status, entetes: recus, corps, duree, chemin });
}

/**
 * LES SONDES D'OBSERVATION. Elles perturbent le CANDIDAT tel qu'il est observé,
 * jamais la règle qui juge — et chacune COMPTE ce qu'elle touche, faute de quoi
 * une sonde inerte rendrait le vert d'une mutation qui ne teste rien.
 * @param {{status: number, entetes: Record<string,string>, corps: string, duree: number, chemin: string}} o
 */
function perturber(o) {
	if (sonde === 'fuite-de-regime' && o.status === 404 && o.chemin.startsWith('/univers/')) {
		touchesDeLaSonde += 1;
		return { ...o, status: 200, corps: `${o.corps}<article>contenu interne</article>` };
	}
	if (sonde === 'refus-discernable' && o.chemin.includes(ABSENT)) {
		touchesDeLaSonde += 1;
		return { ...o, corps: `${o.corps} ` };
	}
	if (sonde === 'temoin-inerte' && o.status === 418) {
		/* 418 : aucun chemin du produit ne le rend. La sonde ne touche donc RIEN,
		   et c'est exactement ce qu'elle est là pour prouver. */
		touchesDeLaSonde += 1;
		return { ...o, status: 200 };
	}
	return o;
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. LA MATRICE
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {{instance: Instance, persona: string, attendu: string, observe: string,
 *   status: number, verdict: string, motif: string, cle: string}[]} */
const cases = [];

/** La forme observée d'une réponse, dans le vocabulaire de la source. */
function formeObservee(o) {
	if (o.status === 302 || o.status === 303 || o.status === 307 || o.status === 308) {
		return 'redirection';
	}
	if (o.status === 404) return 'refus-404';
	if (o.status >= 200 && o.status < 300) return 'servi';
	return `inattendue-${String(o.status)}`;
}

async function mesurerLaMatrice() {
	for (const persona of PERSONAS) {
		const incarnation = incarnations.get(persona.nom);
		if (incarnation === undefined) continue;
		await poserLeDroit(persona.droit, incarnation.compte);
		for (const instance of instances) {
			const attendu =
				instance.variante === 'construite'
					? { forme: 'refus-404', niveau: 'hors-§3', source: '§5.5 « /domaines/… » — ARB-001' }
					: attenduDe(instance.route, persona, rapprochement, familles, niveaux);
			/* `/guides/{identifiant}` : la ligne de §5.5 dépend de la note, non du
			   persona. La variante porte donc sa propre famille. */
			const forme =
				instance.route === '/guides/{identifiant}'
					? (familles[instance.famille]?.formes[
							persona.colonne === 'avecDroit' ? 'avecDroit' : persona.colonne
						] ?? attendu.forme)
					: attendu.forme;

			/* UNE MATRICE DONT LES CASES SE CONTAMINENT MESURE L'ORDRE, PAS LES
			   DROITS. `/deconnexion` est la seule action d'écriture en GET du
			   produit (`T-012` É-9, ratifié par `ARB-054`) : la case qui la demande
			   FERMAIT la session, et les 40 cases suivantes du même persona étaient
			   mesurées en anonyme. Mesuré : 76 défauts dont 62 étaient cet
			   artefact. La session est donc rouverte avant chaque case, ce qui rend
			   la matrice indépendante de l'ordre de ses cases. */
			await reouvrirLaSession(incarnation.condensat);
			const o = await observer(instance.chemin, {
				cookie: incarnation.cookie,
				origine: ORIGINE_A
			});
			const observe = formeObservee(o);
			const montee = estImplementee(instance.route) || instance.variante === 'construite';
			/* CE QUI EST MESURABLE, ET CE QUI NE L'EST PAS — l'ordre de ces trois
			   questions est tout l'honnêteté de la batterie.

			   1. Une REDIRECTION est décidée par le point d'entrée, avant toute
			      résolution : elle est mesurable que la route existe ou non. C'est
			      pourquoi `/bibliotheque` — qu'aucun fichier ne monte — a tout de
			      même un verdict opposable.
			   2. Un REFUS 404 sur une route qui n'existe pas est indiscernable du
			      404 de l'absence : la case est VACANTE, jamais conforme.
			   3. Un SERVI sur une route qui n'existe pas n'est pas un défaut de ce
			      lot-ci : c'est le lot de la route qui le doit. NON COUVERTE. */
			let verdict;
			let motif = attendu.source;
			if (!montee && forme === 'servi') {
				verdict = 'non-couverte';
				motif = `attendu servi ; la route n'est pas montée par src/routes — au lot de la route`;
			} else if (instance.raisonSansValeur !== null && forme === 'servi') {
				verdict = 'non-couverte';
				motif = `le corpus ne porte aucune valeur : ${instance.raisonSansValeur}`;
			} else if (observe !== forme) {
				verdict = 'defaut';
				motif = `attendu ${forme}, obtenu ${observe} (${String(o.status)}, ${String(o.corps.length)} o) — ${attendu.source}`;
			} else if (!montee && forme === 'refus-404') {
				verdict = 'vacuite';
				motif = `la route n'est pas montée : le 404 observé est une ABSENCE, pas une décision de refus`;
			} else {
				verdict = 'conforme';
			}
			cases.push({
				instance,
				persona: persona.nom,
				attendu: forme,
				observe,
				status: o.status,
				verdict,
				motif,
				cle: cleDeRapprochement(o, instance.chemin)
			});
			if (verdict === 'defaut') {
				defauts.push({
					genre: 'matrice',
					quoi: `${instance.chemin} · ${persona.nom}`,
					detail: motif
				});
			}
		}
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. REFUS ≡ INEXISTENCE — LE COUPLE, ET SES TROIS ISSUES

   Un couple n'est CONFORME que si les deux côtés sont un refus ET que leurs
   clés sont égales. Deux 200 identiques ne sont pas un couple conforme : ils
   sont indiscernables ET FUYANTS, et c'est pire qu'un couple discernable.
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {{route: string, persona: string, issue: string, detail: string}[]} */
const couples = [];

function mesurerLesCouples() {
	for (const persona of PERSONAS) {
		for (const route of routes) {
			/* LE CÔTÉ « EXISTE MAIS EST REFUSÉ » DU COUPLE, et pour `/guides` ce
			   n'est PAS la note publique. `docs/routes.md:107` nomme le point dur :
			   « les deux premiers cas de la planche de V-04 — adresse inexistante et
			   NOTE EXISTANTE NON PUBLIQUE — doivent produire un rendu strictement
			   identique ; le commentaire de la maquette (V-04:2219) le désigne comme
			   la vérification la plus importante de cette vue ». La variante
			   `interne` l'emporte donc quand elle existe : comparer la note publique
			   à l'inexistante mesurerait un refus contre un service, ce qui n'est pas
			   le couple de `RG-ACC-04`. */
			const dansLaRoute = (v) =>
				cases.find(
					(c) =>
						c.persona === persona.nom && c.instance.route === route && c.instance.variante === v
				);
			const existante = dansLaRoute('interne') ?? dansLaRoute('existante');
			const inexistante = cases.find(
				(c) =>
					c.persona === persona.nom &&
					c.instance.route === route &&
					c.instance.variante === 'inexistante'
			);
			if (existante === undefined || inexistante === undefined) continue;
			const refusDesDeux = existante.observe !== 'servi' && inexistante.observe !== 'servi';
			const memeCle = existante.cle === inexistante.cle;
			/* Une REDIRECTION est décidée par le point d'entrée, sur le préfixe,
			   avant toute résolution : le couple est donc mesurable même si la route
			   n'existe pas. C'est ce qui rend opposable la borne d'`ARB-052` sur
			   `/console/imports/{lot}` et `/console/exports/{univers}/{domaine}`, les
			   deux seules adresses de chemin fixe qui portent un identifiant de
			   corpus. Un 404, lui, ne prouve rien quand aucune route ne répond. */
			const decideAvantResolution =
				existante.observe === 'redirection' && inexistante.observe === 'redirection';
			const portee = estImplementee(route) || decideAvantResolution;
			let issue;
			if (!refusDesDeux) {
				issue =
					existante.observe === 'servi' && inexistante.observe === 'servi'
						? 'fuyant'
						: 'asymetrique';
			} else if (!memeCle) {
				issue = 'discernable';
			} else if (!portee) {
				issue = 'vacueux';
			} else {
				issue = 'indiscernable';
			}
			couples.push({
				route,
				persona: persona.nom,
				issue,
				detail: `${existante.instance.chemin} (${String(existante.status)}) contre ${inexistante.instance.chemin} (${String(inexistante.status)})`
			});
			if (issue === 'discernable' || issue === 'fuyant' || issue === 'asymetrique') {
				defauts.push({
					genre: 'couple',
					quoi: `${route} · ${persona.nom}`,
					detail: `couple ${issue} — ${existante.instance.chemin} rend ${String(existante.status)} et ${inexistante.instance.chemin} rend ${String(inexistante.status)}`
				});
			}
		}
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. LE TEMPS — LE SEUL COUPLE NON VACANT DU DÉPÔT CE JOUR

   Aucune route ne consulte le corpus aujourd'hui : les deux côtés d'un couple
   d'ADRESSES empruntent le même code, et leur égalité de temps est acquise par
   construction, donc vacante. Le SEUL couple du produit dont les deux côtés
   dépendent réellement de la donnée est celui de `/connexion` :
   un identifiant QUI EXISTE avec un mot de passe faux, contre un identifiant
   QUI N'EXISTE PAS. `V-05:691-696` exige le même écran ; `ARB-005` étend
   l'exigence au temps.

   L'origine est DIFFÉRENTE À CHAQUE TIRAGE : sans cela, le barème de
   `RG-M16-01` entrerait au troisième essai et la batterie mesurerait son propre
   ralentissement — l'enseignement n° 1 de `T-012`, payé par lui.
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {ReturnType<typeof verdictTemporel>|null} */
let temporel = null;
/** @type {{corps: boolean, entetes: boolean, code: boolean, codes: number[],
 *   longueurs: number[], homogene: boolean}|null} */
let identiteDeReponse = null;

async function mesurerLeTemps() {
	if (condensatPose === null) {
		refusDeMesurer.push('aucun condensat posé : le couple temporel n’aurait qu’un côté');
		return;
	}
	const corpsDe = (identifiant, origine) =>
		observer('/connexion', {
			methode: 'POST',
			corps: new URLSearchParams({ identifiant, motdepasse: 'mauvais-mot-de-passe' }).toString(),
			origine
		});

	/** @type {number[][]} */
	const series = [[], [], [], []];
	/** @type {{status: number, entetes: Record<string,string>, corps: string}[][]} */
	const echantillons = [[], []];
	/* `T-012` enseignement 3 : pas besoin d'un délai artificiel. Le dépôt porte
	   deux chemins de coûts OPPOSÉS — 401 avec Argon2id, 429 sans —, et la sonde
	   substitue le second au premier côté du couple : 11,55 ms mesurés par lui. */
	const bloquerLePremier = sonde === 'latence-discernable';
	/* Entrelacement : les quatre séries alternent dans le même ordre à chaque
	   tour, mesure et témoin subissant donc exactement le même bruit. */
	const tours = [
		{ serie: 0, identifiant: 'marc.ferreira' },
		{ serie: 1, identifiant: ABSENT },
		{ serie: 2, identifiant: ABSENT },
		{ serie: 3, identifiant: ABSENT }
	];
	let compteur = 0;
	for (let i = 0; i < TIRAGES; i++) {
		for (const t of tours) {
			const origine = `198.51.100.${String(compteur % 250)}.${String(compteur)}`;
			compteur += 1;
			if (t.serie === 0 && bloquerLePremier) {
				touchesDeLaSonde += 1;
				await interroger(
					`insert into tentatives_de_connexion (origine, reussie, attente_secondes, blocage_jusqu_a)
					 values ($1, false, 0, now() + interval '90 seconds')`,
					[origine]
				);
			}
			const o = await corpsDe(t.identifiant, origine);
			series[t.serie]?.push(o.duree);
			if (t.serie < 2) echantillons[t.serie]?.push(o);
		}
	}
	const [a, b, t1, t2] = series;
	temporel = verdictTemporel(a ?? [], b ?? [], t1 ?? [], t2 ?? []);

	/* L'IDENTITÉ SE VÉRIFIE SUR LES 40 TIRAGES, PAS SUR LE PREMIER — et la
	   première rédaction ne regardait que le premier. La faute était mesurable :
	   sans `ADDRESS_HEADER`, les 160 requêtes partagent l'origine du frontal, le
	   barème de `RG-M16-01` entre au septième essai, et le rapport imprimait
	   « codes 401 / 401 » — les codes du PREMIER tirage — pour une série dont la
	   médiane de 2,26 ms ne peut contenir aucune vérification Argon2id. Un
	   instrument qui caractérise une série par son premier élément ne mesure pas
	   la série. */
	const cotes = [echantillons[0] ?? [], echantillons[1] ?? []];
	const codesDe = (c) => [...new Set(c.map((o) => o.status))].sort((x, y) => x - y);
	const codesA = codesDe(cotes[0] ?? []);
	const codesB = codesDe(cotes[1] ?? []);
	let memeCode = true;
	let memeCorps = true;
	let memesEntetes = true;
	for (let i = 0; i < Math.max(cotes[0]?.length ?? 0, cotes[1]?.length ?? 0); i++) {
		const x = cotes[0]?.[i];
		const y = cotes[1]?.[i];
		if (x === undefined || y === undefined) {
			memeCode = false;
			continue;
		}
		if (x.status !== y.status) memeCode = false;
		if (x.corps !== y.corps) memeCorps = false;
		const cle = (o) =>
			cleDeRapprochement({ status: 0, entetes: o.entetes, corps: '' }, '/connexion');
		if (cle(x) !== cle(y)) memesEntetes = false;
	}
	identiteDeReponse = {
		codes: [...codesA, ...codesB],
		code: memeCode,
		corps: memeCorps,
		entetes: memesEntetes,
		longueurs: [...new Set(cotes.flat().map((o) => o.corps.length))],
		homogene: codesA.length === 1 && codesB.length === 1
	};

	/* LE GARDE-FOU DE L'ENSEIGNEMENT N° 1 DE `T-012`, RENDU EXÉCUTABLE.
	   « Le compteur de tentatives pollue toute mesure de latence : sans
	   neutralisation ou isolement de l'origine, ta batterie mesurera son propre
	   barème. » Si une série mélange deux codes de statut, elle mélange deux
	   chemins de coût, et sa médiane ne caractérise plus rien. La batterie REFUSE
	   alors de conclure sur le temps, au lieu de rendre « dans le bruit » sur deux
	   populations de 429. C'est ce qui arrive dès que la composition ne porte pas
	   `ADDRESS_HEADER` : la neutralisation par origine distincte n'opère plus. */
	if (!identiteDeReponse.homogene) {
		refusDeMesurer.push(
			`séries temporelles hétérogènes — côté mesuré ${codesA.join('+')} et côté témoin ${codesB.join('+')} : ` +
				'la médiane mélange deux chemins de coût. Le barème de RG-M16-01 est entré dans la ' +
				'mesure, donc l’origine n’est pas isolée (T-012, enseignement n° 1).'
		);
	}
	if (temporel.issue === 'hors-du-bruit') {
		defauts.push({
			genre: 'temps',
			quoi: 'POST /connexion — identifiant existant contre inconnu',
			detail: `écart des médianes ${temporel.ecart.toFixed(3)} ms, plancher mesuré ${temporel.plancher.toFixed(3)} ms`
		});
	}
	if (temporel.issue === 'refus-de-conclure') {
		refusDeMesurer.push(
			`couple témoin instable : écart ${temporel.ecartTemoin.toFixed(3)} ms pour un plancher de ${temporel.plancherTemoin.toFixed(3)} ms`
		);
	}
	if (identiteDeReponse.code !== true || identiteDeReponse.corps !== true) {
		defauts.push({
			genre: 'temps',
			quoi: 'POST /connexion — la réponse n’est pas identique',
			detail: `code identique : ${String(identiteDeReponse.code)} · corps identique : ${String(identiteDeReponse.corps)} · longueurs ${identiteDeReponse.longueurs.join(' / ')}`
		});
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. `ARB-053` — LES DEUX CAS QUE L'ARBITRAGE EXIGE
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {{nom: string, tenu: boolean, detail: string}[]} */
const arb053 = [];

async function mesurerArb053() {
	await interroger('delete from tentatives_de_connexion');
	const tenter = (origine) =>
		observer('/connexion', {
			methode: 'POST',
			corps: new URLSearchParams({ identifiant: ABSENT, motdepasse: 'x' }).toString(),
			origine
		});

	/* CAS 1 — deux origines distinctes ne se bloquent pas l'une l'autre.
	   Premier temps : l'origine que le produit ENREGISTRE doit différer. */
	await tenter(ORIGINE_A);
	const apresA = await interroger(
		'select origine from tentatives_de_connexion order by le desc limit 1'
	);
	await tenter(ORIGINE_B);
	const apresB = await interroger(
		'select origine from tentatives_de_connexion order by le desc limit 1'
	);
	const vueA = apresA[0]?.origine ?? '(aucune)';
	const vueB = apresB[0]?.origine ?? '(aucune)';
	arb053.push({
		nom: 'cas 1a — deux clients, deux clés de comptage',
		tenu: vueA !== vueB,
		detail: `${ORIGINE_A} enregistrée « ${vueA} » · ${ORIGINE_B} enregistrée « ${vueB} »`
	});

	/* Second temps, le comportemental : un blocage posé sur la clé du premier ne
	   doit pas refuser le second. Le blocage est écrit par la même voie que le
	   produit l'écrit — la table de `RG-M16-01` —, pas par sept requêtes et
	   quinze secondes de barème. */
	await interroger('delete from tentatives_de_connexion');
	await interroger(
		`insert into tentatives_de_connexion (origine, reussie, attente_secondes, blocage_jusqu_a)
		 values ($1, false, 0, now() + interval '90 seconds')`,
		[vueA]
	);
	const bloque = await tenter(ORIGINE_A);
	const voisin = await tenter(ORIGINE_B);
	arb053.push({
		nom: 'cas 1b — le blocage d’une origine ne bloque pas l’autre',
		tenu: bloque.status === 429 && voisin.status !== 429,
		detail: `${ORIGINE_A} rend ${String(bloque.status)} (429 attendu) · ${ORIGINE_B} rend ${String(voisin.status)} (429 interdit)`
	});

	/* CAS 2 — une origine forgée par le client ne passe pas. Ce que le frontal
	   produit quand le client a menti : sa valeur, PUIS l'adresse réelle qu'il
	   ajoute. Un seul saut de confiance doit retenir la seconde. */
	await interroger('delete from tentatives_de_connexion');
	await tenter(`${ORIGINE_FORGEE}, ${ORIGINE_B}`);
	const apresForge = await interroger(
		'select origine from tentatives_de_connexion order by le desc limit 1'
	);
	const vueForgee = apresForge[0]?.origine ?? '(aucune)';
	/* Et il faut dire COMMENT il ne passe pas : tant que la composition ne lit
	   aucun en-tête, il ne passe pas parce que RIEN n'est lu — le cas est tenu
	   par vacuité, et ne prouve pas la profondeur de confiance. C'est la sonde
	   `confiance-trop-profonde` qui le prouve, en portant `XFF_DEPTH` à 2. */
	const parVacuite = configuration.adresseEntete === null;
	arb053.push({
		nom: `cas 2 — l’en-tête forgé par le client ne devient pas l’origine${parVacuite ? ' (TENU PAR VACUITÉ : aucun en-tête n’est lu)' : ''}`,
		tenu: vueForgee !== ORIGINE_FORGEE && !vueForgee.includes(ORIGINE_FORGEE),
		detail: `« ${ORIGINE_FORGEE}, ${ORIGINE_B} » enregistrée « ${vueForgee} » — forgée retenue : ${String(vueForgee.includes(ORIGINE_FORGEE))}`
	});

	/* La prémisse, et la configuration elle-même. */
	arb053.push({
		nom: 'prémisse — app publiée sur la boucle locale seule (section `ports` du service `app`)',
		tenu: premisse.constats.length === 0,
		detail:
			premisse.constats.length === 0
				? `${String(premisse.publications.length)} publications, ${String(premisse.ouvertes.length)} ouvertes et attendues (frontal)`
				: premisse.constats.join(' ; ')
	});
	arb053.push({
		nom: 'la composition porte ADDRESS_HEADER et XFF_DEPTH',
		tenu: configuration.adresseEntete === 'X-Forwarded-For' && configuration.profondeur === '1',
		detail: `ADDRESS_HEADER=${String(configuration.adresseEntete)} · XFF_DEPTH=${String(configuration.profondeur)}`
	});

	for (const c of arb053) {
		if (!c.tenu) defauts.push({ genre: 'ARB-053', quoi: c.nom, detail: c.detail });
	}
	await interroger('delete from tentatives_de_connexion');
}

/* ═══════════════════════════════════════════════════════════════════════════
   12. LE COMPTE DÉSACTIVÉ — RG-M14-08, ET SON COOKIE
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {{tenu: boolean, detail: string}|null} */
let compteDesactive = null;

async function mesurerLeCompteDesactive() {
	const incarnation = incarnations.get('compte-desactive');
	if (incarnation === undefined || incarnation.cookie === null) return;
	const o = await observer('/importer', { cookie: incarnation.cookie, origine: ORIGINE_A });
	const efface = (o.entetes['set-cookie'] ?? '').includes('codicillus_session=');
	const [restante] = await interroger(
		'select count(*)::int as ouvertes from sessions where compte_id = $1 and fermee_le is null',
		[incarnation.compte]
	);
	compteDesactive = {
		tenu: o.status === 302 && efface && (restante?.ouvertes ?? 1) === 0,
		detail: `GET /importer rend ${String(o.status)} · cookie effacé : ${String(efface)} · sessions encore ouvertes : ${String(restante?.ouvertes)}`
	};
	if (!compteDesactive.tenu) {
		defauts.push({
			genre: 'RG-M14-08',
			quoi: 'compte désactivé porteur d’une session',
			detail: compteDesactive.detail
		});
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   12 bis. RG-ACC-02 — LA DÉCONNEXION FERME LA SESSION, ET REND `/`

   La matrice rouvre les sessions entre ses cases : la propriété que
   `/deconnexion` FERME doit donc être mesurée à part, sinon la neutralisation
   d'un effet de bord ferait disparaître la preuve de cet effet de bord.
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {{tenu: boolean, detail: string}|null} */
let deconnexion = null;

async function mesurerLaDeconnexion() {
	const incarnation = incarnations.get('administrateur');
	if (incarnation === undefined || incarnation.condensat === null) return;
	await reouvrirLaSession(incarnation.condensat);
	const o = await observer('/deconnexion', { cookie: incarnation.cookie, origine: ORIGINE_A });
	const [apres] = await interroger(
		'select fermee_le is not null as fermee from sessions where condensat_jeton = $1',
		[incarnation.condensat]
	);
	const versLaRacine = (o.entetes['location'] ?? '') === '/';
	deconnexion = {
		tenu: o.status === 302 && versLaRacine && apres?.fermee === true,
		detail: `rend ${String(o.status)} vers « ${o.entetes['location'] ?? '—'} » · session fermée : ${String(apres?.fermee)}`
	};
	if (!deconnexion.tenu) {
		defauts.push({
			genre: 'RG-ACC-02',
			quoi: 'GET /deconnexion',
			detail: deconnexion.detail
		});
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   13. EXÉCUTION
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {Record<string, unknown>[]|null} */
let etatFinal;
try {
	if (refusDeMesurer.length === 0) await poserLesPersonas();
	if (refusDeMesurer.length === 0 && (await servirLeProduit())) {
		await mesurerLaMatrice();
		mesurerLesCouples();
		await mesurerLeCompteDesactive();
		await mesurerLaDeconnexion();
		await mesurerLeTemps();
		await mesurerArb053();
	}
} finally {
	etatFinal = await nettoyerLaBase().catch(() => null);
	produit?.kill('SIGTERM');
	await bassin.end().catch(() => undefined);
}

/* ═══════════════════════════════════════════════════════════════════════════
   14. LE RAPPORT
   ═════════════════════════════════════════════════════════════════════════ */

const compte = (v) => cases.filter((c) => c.verdict === v).length;
const comptes = {
	conformes: compte('conforme'),
	defauts: compte('defaut'),
	vacuites: compte('vacuite'),
	nonCouvertes: compte('non-couverte')
};
const comptesCouples = {
	indiscernables: couples.filter((c) => c.issue === 'indiscernable').length,
	vacueux: couples.filter((c) => c.issue === 'vacueux').length,
	fuyants: couples.filter((c) => c.issue === 'fuyant').length,
	discernables: couples.filter((c) => c.issue === 'discernable').length,
	asymetriques: couples.filter((c) => c.issue === 'asymetrique').length
};

console.log('\ntest:etancheite — batterie 6, étanchéité du périmètre');
console.log(
	`  sources : ${String(routes.length)} routes (§3) · ${String(familles.length)} familles (§5.5) · ` +
		`${String(PERSONAS.length)} personas · ${String(instances.length)} adresses construites`
);
console.log(
	`  routes montées par src/routes : ${String(routes.filter((r) => estImplementee(r)).length)} / ${String(routes.length)}`
);
console.log(
	`  configuration lue dans compose.yaml : ADDRESS_HEADER=${String(configuration.adresseEntete)} · XFF_DEPTH=${String(configuration.profondeur)}`
);

if (refusDeMesurer.length > 0) {
	console.error(`\n  REFUS DE MESURER — ${String(refusDeMesurer.length)} constat(s) :`);
	for (const r of refusDeMesurer) console.error(`    ${r}`);
	console.error(
		'\n  Une table incohérente ou une base absente ne produit pas un verdict, elle produit\n' +
			'  un refus. `docs/orchestration.md` §1.2 règle 3 : code 2, jamais vert.\n'
	);
	/* UN REFUS TARDIF NE DOIT PAS EMPORTER LE RAPPORT. Si rien n'a été mesuré, il
	   n'y a rien à imprimer et on sort. Mais une méthode déclarée instable APRÈS
	   la matrice — le couple témoin qui dépasse son plancher, par exemple — laisse
	   derrière elle 378 cases parfaitement lisibles : les taire rendrait
	   l'instrument indiagnosticable au moment où on en a le plus besoin. Le
	   rapport est donc imprimé, et le code 2 est rendu à la fin. */
	if (cases.length === 0) exit(2);
}

console.log('\n  LA MATRICE — routes × personas');
for (const persona of PERSONAS) {
	const siennes = cases.filter((c) => c.persona === persona.nom);
	const d = siennes.filter((c) => c.verdict === 'defaut').length;
	console.log(
		`    ${persona.nom.padEnd(26)} ${String(siennes.filter((c) => c.verdict === 'conforme').length).padStart(3)} conformes · ` +
			`${String(siennes.filter((c) => c.verdict === 'vacuite').length).padStart(3)} vacantes · ` +
			`${String(siennes.filter((c) => c.verdict === 'non-couverte').length).padStart(3)} non couvertes · ` +
			`${String(d).padStart(3)} défauts   [${persona.incarnation}]`
	);
}
console.log(
	`    ${'TOTAL'.padEnd(26)} ${String(comptes.conformes).padStart(3)} conformes · ${String(comptes.vacuites).padStart(3)} vacantes · ` +
		`${String(comptes.nonCouvertes).padStart(3)} non couvertes · ${String(comptes.defauts).padStart(3)} défauts`
);

if (montrerLaMatrice) {
	console.log('\n  CASE À CASE');
	for (const c of cases) {
		console.log(
			`    ${c.verdict.padEnd(13)} ${c.persona.padEnd(24)} ${c.instance.chemin.padEnd(64)} ` +
				`attendu ${c.attendu.padEnd(11)} obtenu ${c.observe.padEnd(11)} ${String(c.status)}`
		);
	}
}

console.log('\n  REFUS ≡ INEXISTENCE — les couples, sur la même forme d’adresse');
console.log(
	`    ${String(comptesCouples.indiscernables).padStart(3)} indiscernables PROUVÉS (la route existe, le refus est une décision)`
);
console.log(
	`    ${String(comptesCouples.vacueux).padStart(3)} indiscernables PAR VACUITÉ (aucune route : les deux côtés sont une absence)`
);
console.log(
	`    ${String(comptesCouples.fuyants).padStart(3)} FUYANTS — les deux côtés servent le contenu`
);
console.log(
	`    ${String(comptesCouples.discernables).padStart(3)} DISCERNABLES — l’existence se lit dans la réponse`
);
console.log(
	`    ${String(comptesCouples.asymetriques).padStart(3)} ASYMÉTRIQUES — un côté sert, l’autre refuse`
);

if (temporel !== null) {
	console.log('\n  LE TEMPS — POST /connexion, identifiant existant contre inconnu');
	console.log(`    ${String(temporel.tirages)} tirages par série, quatre séries entrelacées`);
	console.log(
		`    médianes            ${temporel.medianes.map((m) => `${m.toFixed(3)} ms`).join('  contre  ')}`
	);
	console.log(`    écart mesuré        ${temporel.ecart.toFixed(3)} ms`);
	console.log(`    écart du témoin     ${temporel.ecartTemoin.toFixed(3)} ms  (vrai écart nul)`);
	console.log(
		`    plancher de bruit   ${temporel.plancher.toFixed(3)} ms  (le plus grand des deux écarts interquartiles du témoin)`
	);
	console.log(
		`    dispersion mesurée  ${temporel.dispersionMesuree.toFixed(3)} ms  (écart interquartile des deux séries mesurées)`
	);
	console.log(`    issue               ${temporel.issue}`);
	if (identiteDeReponse !== null) {
		console.log(
			`    codes observés      ${identiteDeReponse.codes.join(' + ')} sur les ${String(temporel.tirages)} tirages` +
				`   (401 : le chemin Argon2id ; 429 : le barème, sans vérification)`
		);
		console.log(
			`    réponse identique   code ${String(identiteDeReponse.code)} · en-têtes ${String(identiteDeReponse.entetes)} · ` +
				`corps ${String(identiteDeReponse.corps)} (${identiteDeReponse.longueurs.join(' / ')} octets) · ` +
				`séries homogènes ${String(identiteDeReponse.homogene)}`
		);
	}
}

if (compteDesactive !== null) {
	console.log('\n  RG-M14-08 — le compte désactivé');
	console.log(`    ${compteDesactive.tenu ? 'tenu' : 'NON TENU'} — ${compteDesactive.detail}`);
}

if (deconnexion !== null) {
	console.log('\n  RG-ACC-02 — la déconnexion');
	console.log(`    ${deconnexion.tenu ? 'tenu' : 'NON TENU'} — ${deconnexion.detail}`);
}

if (arb053.length > 0) {
	console.log('\n  ARB-053 — l’origine derrière le frontal');
	for (const c of arb053)
		console.log(`    ${c.tenu ? 'tenu    ' : 'NON TENU'} ${c.nom}\n              ${c.detail}`);
}

if (etatFinal !== null && etatFinal !== undefined) {
	console.log(`\n  base rendue propre : ${JSON.stringify(etatFinal[0])}`);
}

console.log(
	`\n  EMPREINTE ${comptes.conformes}/${comptes.vacuites}/${comptes.nonCouvertes}/${comptes.defauts} · ` +
		`couples ${comptesCouples.indiscernables}/${comptesCouples.vacueux}/${comptesCouples.fuyants}/${comptesCouples.discernables}/${comptesCouples.asymetriques} · ` +
		`temps ${temporel?.issue ?? 'non mesuré'}`
);

if (defauts.length > 0) {
	console.error(`\n  ÉCHEC — ${String(defauts.length)} défaut(s) mesuré(s) :`);
	for (const d of defauts) console.error(`    [${d.genre}] ${d.quoi}\n        ${d.detail}`);
}
if (comptes.vacuites > 0 || comptesCouples.vacueux > 0) {
	console.error(
		`\n  ÉCHEC PAR VACUITÉ — ${String(comptes.vacuites)} case(s) et ${String(comptesCouples.vacueux)} couple(s) dont la conformité\n` +
			'  n’est qu’une absence de route. Ce n’est pas une réussite : c’est le mode de défaillance\n' +
			'  RA-01, et le chiffre doit descendre à chaque lot de route.\n'
	);
}

const rougit =
	refusDeMesurer.length > 0 ||
	defauts.length > 0 ||
	comptes.vacuites > 0 ||
	comptesCouples.vacueux > 0 ||
	comptes.nonCouvertes > 0;

if (sonde === undefined) {
	if (!rougit) {
		console.log('\n  Le périmètre est étanche, et prouvé sur toutes les routes montées.\n');
	}
	exit(refusDeMesurer.length > 0 ? 2 : rougit ? 1 : 0);
}

console.log(`\n  sonde ${sonde} : ${String(touchesDeLaSonde)} touche(s).`);
if (touchesDeLaSonde === 0) {
	console.error(
		'  REFUS DE CONCLURE : la mutation est INERTE — elle n’a rien touché, donc elle ne\n' +
			'  teste rien. C’est le mode de défaillance RA-01, et il ne se lit pas comme une panne.\n'
	);
	exit(1);
}
console.log(
	rougit
		? `  la batterie a dit non — code de retour inversé, 0.\n`
		: `  la batterie n’a rien vu — 1.\n`
);
exit(rougit ? 0 : 1);
