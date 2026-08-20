#!/usr/bin/env node
/**
 * `pnpm test:parcours` — BATTERIE 12 du catalogue (PLAN-DE-REALISATION.md §5,
 * ligne 347) : **les six parcours de référence, joués de bout en bout**.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL PROUVE
 *
 * Plan §5 l. 347, recopiée : « PU-01 à PU-06 joués de bout en bout, avec leurs
 * critères de réussite chiffrés ». Les six parcours sont au cahier des charges
 * l. 1456 à 1519 ; leurs phrases et leurs critères sont recopiés dans
 * `verif/parcours-regles.mjs`, avec leur numéro de ligne, et l'unitaire rouvre
 * le cahier pour exiger l'égalité (`P-21`).
 *
 * UN PARCOURS EST UNE SESSION RÉELLE, pas un test d'unité enchaîné :
 *
 *   · le produit est CONSTRUIT (`vite build`) et servi par `node build/index.js`
 *     — le même choix que la batterie 6, et pour la même raison : `vite dev`
 *     n'emprunte pas le chemin de l'exploitation (`ECART-013` É-1) ;
 *   · le compte est RÉEL et la session est OUVERTE PAR LE PRODUIT — `POST
 *     /connexion` avec un mot de passe haché par `src/lib/auth/mots-de-passe.ts`,
 *     et le cookie que le produit émet est celui que le navigateur porte. Aucun
 *     jeton n'est posé en base à la main ;
 *   · un NAVIGATEUR RÉEL joue les gestes — frappes, flèches, clics, presse-
 *     papiers. C'est la seule façon de mesurer une étape comme « il ouvre le
 *     résultat à la flèche puis Entrée » : la mesurer par `fetch` reviendrait à
 *     déclarer franchie une étape qu'on n'a pas jouée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI L'ÉCRITURE PASSE PAR L'ACTION SERVEUR, ET POURQUOI ON LE DIT
 *
 * `ARB-054` §3 : les cinq formulaires du gel — `V-05:551`, `V-06:661`,
 * `V-06:721`, `V-23:1181`, `V-25:1166` — portent `novalidate` et **ni `method`
 * ni `action`**. Une soumission native partirait donc en GET. Les étapes
 * d'écriture de ces parcours sont par conséquent jouées **contre l'action
 * serveur**, avec le corps de formulaire que le produit attend, et le rapport
 * le nomme : `saisie: action-serveur`. Ce n'est pas un raccourci de confort,
 * c'est la seule voie qui existe tant qu'aucun lot n'a relié les formulaires.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE PROUVE PAS, ET C'EST LA PARTIE QUI COMPTE
 *
 *   1. LES DEUX CRITÈRES DE DURÉE NE SE MESURENT PAS ENTIÈREMENT. « Moins de
 *      60 secondes entre l'ouverture et le premier geste technique » compte du
 *      temps humain. La batterie mesure la PART DU PRODUIT, qui est une borne
 *      inférieure, et une borne inférieure ne peut que RÉFUTER. Voir
 *      `verdictDeBudget` : le verdict est « infirmé » ou « non infirmé »,
 *      jamais « tenu ».
 *   2. TROIS PARCOURS N'ONT AUCUN CRITÈRE CHIFFRÉ AU CAHIER — PU-04, PU-05,
 *      PU-06, vérifié fichier ouvert. La batterie les compte comme tels et n'en
 *      invente aucun.
 *   3. UNE ÉTAPE NON COUVERTE N'EST PAS UNE ÉTAPE VERTE. Le compte des non
 *      couverts est un ÉCHEC, exactement comme la vacuité de la batterie 6 :
 *      sans cela la batterie serait verte sur ce qui n'existe pas (`RA-01`).
 *   4. L'ÉTANCHÉITÉ EXHAUSTIVE N'EST PAS ICI. PU-03 mesure son critère sur les
 *      réponses de SON chemin ; la matrice routes × personas est la batterie 6.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `P-28` — CHAQUE PARCOURS RÉTABLIT SON ÉTAT, ET LE PROUVE
 *
 * « Une matrice dont les cases se contaminent mesure l'ordre, pas la
 * propriété. » Un parcours ouvre des sessions, pose des droits, écrit des
 * versions, importe des notes. Avant ses préconditions, la batterie prend une
 * EMPREINTE de chaque table ; après restauration, elle la reprend et exige
 * l'égalité. Une divergence est un défaut imputé au parcours qui l'a laissée —
 * le rétablissement ne se déclare pas, il se mesure. L'index de recherche est
 * dans l'empreinte : une écriture le modifie, et la restauration le reconstruit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES — DEUX GENRES DE MUTATION, ET UN REFUS DE CONCLURE
 *
 *   --sonde=etape-brisee      l'OBSERVATION : la réponse d'une étape est
 *                             altérée dans le navigateur — un identifiant
 *                             interne est glissé dans la page publique
 *   --sonde=droit-retire      L'ÉTAT : le droit du persona n'est pas posé, et
 *                             son parcours doit cesser d'être franchissable
 *   --sonde=produit-ralenti   LA CONFIGURATION : le produit répond réellement
 *                             plus lentement, et le budget doit être infirmé.
 *                             C'est le seul cas d'épreuve SYNTHÉTIQUE de la
 *                             règle de budget (`P-26`)
 *   --sonde=temoin-inerte     LA SONDE QUI NE TOUCHE RIEN. La batterie doit
 *                             REFUSER DE CONCLURE — code 1, jamais inversé
 *
 * UNE SONDE REJOUE LE PARCOURS VISÉ DEUX FOIS, sans puis avec la mutation. La
 * morsure se lit dans le PASSAGE d'un état sain à un état fautif, jamais dans
 * la couleur de la batterie : celle-ci est rouge de toute façon tant que le
 * produit n'est pas fini, et une sonde créditée de ce rouge ne prouverait rien
 * (`P-26`, et la leçon de l'imputabilité de la batterie 6).
 *
 * Usage :
 *   node verif/parcours.mjs                     la batterie
 *   node verif/parcours.mjs --detail            + le détail étape par étape
 *   node verif/parcours.mjs --parcours=PU-01    un seul parcours
 *   node verif/parcours.mjs --sonde=<genre>     la preuve qu'elle sait dire non
 *   node verif/parcours.mjs --sans-construire   diagnostic : réemploie build/
 *
 * Codes de retour : 0 les six parcours franchis et aucun critère infirmé ·
 * 1 défaut, étape non couverte, critère infirmé ou état non rétabli · 2 refus
 * de mesurer.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import { racine } from './banc/inventaire.mjs';
import {
	CAUSES,
	GENRES_DE_SONDE,
	PARCOURS,
	blocDeVerdict,
	codeDeRetour,
	comparerEmpreintes,
	morsure,
	verdictDEtancheite,
	verdictDEtat,
	verdictDeBudget,
	verdictDeSonde
} from './parcours-regles.mjs';

const args = argv.slice(2);
const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);
const unSeul = args.find((a) => a.startsWith('--parcours='))?.slice('--parcours='.length);
const detail = args.includes('--detail');
const sansConstruire = args.includes('--sans-construire');

/** Le port de cette copie de travail (`verif/preparer-copie.sh`), à défaut 5915. */
const PORT = Number(process.env.PORT_DEV ?? 5915);
const BASE_HTTP = `http://127.0.0.1:${PORT}`;

/** Le mot de passe posé sur les comptes le temps de la mesure, puis retiré. */
const MOT_DE_PASSE = 'parcours-de-reference-T-054';

/**
 * Le retard, en millisecondes, que la sonde de configuration impose à chaque
 * document servi. Fixé — un réglage par la ligne de commande rendrait le
 * verdict de la sonde non reproductible.
 *
 * LE CHIFFRE VIENT D'UNE MESURE, PAS D'UNE INTUITION. PU-01 compte quatre
 * navigations dans la fenêtre de son budget ; à 9 000 ms la part du produit
 * montait à 36 629 ms sur 60 000 et la sonde NE MORDAIT PAS. À 18 000 ms elle
 * dépasse le budget d'environ douze secondes, marge suffisante pour que le
 * verdict ne dépende pas d'une navigation de plus ou de moins.
 */
const RETARD_DE_SONDE = 18_000;

if (sonde !== undefined && !Object.hasOwn(GENRES_DE_SONDE, sonde)) {
	console.error(
		`sonde « ${sonde} » inconnue — les genres sont : ${Object.keys(GENRES_DE_SONDE).join(', ')}`
	);
	exit(2);
}

/** Ce que chaque sonde vise, et ce qu'on attend d'elle. */
const CIBLES_DE_SONDE = {
	'etape-brisee': {
		parcours: 'PU-03',
		quoi: 'critère PU-03',
		attenduAvant: 'non-infirme',
		attenduApres: 'infirme'
	},
	'droit-retire': {
		parcours: 'PU-04',
		quoi: 'PU-04.4',
		attenduAvant: 'franchie',
		attenduApres: 'defaut'
	},
	'produit-ralenti': {
		parcours: 'PU-01',
		quoi: 'critère PU-01',
		attenduAvant: 'non-infirme',
		attenduApres: 'infirme'
	},
	'temoin-inerte': { parcours: 'PU-01', quoi: '—', attenduAvant: '—', attenduApres: '—' }
};

/** @type {string[]} */
const refusDeMesurer = [];
let touchesDeLaSonde = 0;

/* ═══════════════════════════════════════════════════════════════════════════
   1. LA BASE — LES PERSONAS S'Y FORGENT POUR DE VRAI
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

/**
 * CE QUE DIT UNE PANNE DE BASE, EN CLAIR.
 *
 * La base est partagée entre les copies de travail de la vague, et l'un des
 * lots de la vague 6 la restaure et la remigre. Mesuré en pleine sonde :
 * « relation "sessions" does not exist » — le schéma avait disparu sous la
 * batterie. Une pile d'appels n'apprend rien à qui lit le rapport ; la phrase
 * ci-dessous, si.
 */
function expliquer(cause) {
	const texte = String(cause?.message ?? cause);
	if (/does not exist|ECONNREFUSED|terminating connection|the database system/i.test(texte)) {
		return (
			`la base partagée n’a pas répondu comme attendu — « ${texte.slice(0, 120)} ». ` +
			'Une autre copie de travail la migre, la restaure ou la vide : rejouer quand elle est ' +
			'au repos. Rien n’est conclu sur le produit.'
		);
	}
	return String(cause?.stack ?? cause).slice(0, 900);
}

/**
 * LES TABLES DE L'EMPREINTE D'ÉTAT. Toutes celles du schéma : une table oubliée
 * serait une table où un parcours pourrait laisser une trace sans que rien ne
 * le voie.
 */
async function tablesDuSchema() {
	const lignes = await interroger(
		`select table_name from information_schema.tables
		  where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`
	);
	return lignes.map((l) => String(l.table_name));
}

/**
 * LES TROIS TABLES QUE LE CONTRÔLE D'ALTÉRATION NE REGARDE PAS, ET POURQUOI.
 *
 * `sessions`, `tentatives_de_connexion` et `droits_de_dossier` sont ÉCRITES EN
 * PERMANENCE par le produit et par les batteries : une session voit son
 * `derniere_activite_le` bouger à chaque requête, y compris celles d'une copie
 * de travail voisine sur la base partagée. Mesuré : trois refus de mesurer
 * consécutifs, tous sur des lignes appartenant à un autre lot.
 *
 * Elles ne sortent pas du contrôle pour autant — `P-28`, seconde moitié : « ce
 * qu'on neutralise, on le mesure ailleurs ». Ce que CE parcours y écrit est
 * mesuré par ATTRIBUTION dans `residusDuParcours`, compte du persona et fenêtre
 * de temps à l'appui. Ce que d'autres y écrivent ne le concerne pas.
 */
const TABLES_VOLATILES = new Set(['sessions', 'tentatives_de_connexion', 'droits_de_dossier']);

/** Les tables qui portent une colonne `id` — les autres se repèrent par leur
 *  texte de ligne, faute de clé simple (`etiquettes_de_note`, `parametres`…). */
async function tablesAvecId() {
	const lignes = await interroger(
		`select table_name from information_schema.columns
		  where table_schema = 'public' and column_name = 'id'`
	);
	return new Set(lignes.map((l) => String(l.table_name)));
}

/**
 * L'EMPREINTE, LIGNE PAR LIGNE — et pourquoi ce n'est pas un simple compte.
 *
 * Le premier jet comparait, par table, un compte et un condensat global. Il a
 * rendu SEPT écarts en un passage, et aucun n'était le fait de cette batterie :
 * la base est PARTAGÉE entre les copies de travail de la vague, et un lot
 * voisin y écrivait. Un compte global ne sait pas dire de qui vient une ligne.
 *
 * L'empreinte est donc un dictionnaire clé → condensat de ligne. Elle permet
 * les deux seules questions qui se répondent honnêtement :
 *
 *   « CE QUI EXISTAIT EST-IL INTACT ? »  — une ligne du corpus disparue ou
 *     modifiée est un fait, quel qu'en soit l'auteur ;
 *   « CE QUE J'AI CRÉÉ A-T-IL DISPARU ? » — mesuré par les résidus
 *     ATTRIBUABLES (voir `residusDuParcours`), jamais par une différence de
 *     comptes qui imputerait à ce lot les lignes du voisin.
 */
async function empreinteDeLEtat(tables, avecId) {
	/** @type {Record<string, Record<string, string>>} */
	const empreinte = {};
	for (const table of tables) {
		if (TABLES_VOLATILES.has(table)) continue;
		const cle = avecId.has(table) ? 'id::text' : `md5(t::text)`;
		/* `comptes` EST COMPARÉ SANS SON CONDENSAT. C'est la seule colonne qu'une
		   batterie écrit légitimement — celle-ci le fait, et les copies voisines
		   aussi, sur les mêmes personas : mesuré, la ligne de `marc.ferreira`
		   changeait pendant un parcours qui ne s'en servait pas. Le reste de la
		   ligne, lui, est du corpus et doit rester intact. */
		const somme =
			table === 'comptes' ? `md5((to_jsonb(t) - 'condensat_mot_de_passe')::text)` : 'md5(t::text)';
		const lignes = await interroger(`select ${cle} as cle, ${somme} as somme from "${table}" t`);
		/** @type {Record<string, string>} */
		const parLigne = {};
		for (const l of lignes) parLigne[String(l.cle)] = String(l.somme);
		empreinte[table] = parLigne;
	}
	empreinte['(index de recherche)'] = { entrees: await empreinteDeLIndex() };
	return empreinte;
}

async function empreinteDeLIndex() {
	const cle = process.env.CLE_MAITRE_RECHERCHE ?? process.env.CLE_RECHERCHE ?? '';
	const port = process.env.PORT_RECHERCHE ?? '19700';
	try {
		const reponse = await fetch(
			`http://127.0.0.1:${port}/indexes/notes/documents?limit=1000&fields=id`,
			{ headers: cle ? { authorization: `Bearer ${cle}` } : {} }
		);
		if (!reponse.ok) return `injoignable:${reponse.status}`;
		const charge = await reponse.json();
		const ids = (charge.results ?? []).map((d) => d.id).sort();
		return `${ids.length}:${createHash('sha256').update(ids.join('|')).digest('hex').slice(0, 32)}`;
	} catch (cause) {
		return `injoignable:${String(cause).slice(0, 40)}`;
	}
}

/**
 * LES RÉSIDUS ATTRIBUABLES — ce que CE parcours a écrit et qui devrait avoir
 * disparu. Chaque requête porte une attribution : un compte de persona, ou la
 * fenêtre de temps du parcours. Rien n'est compté sur un simple total, parce
 * qu'un total est ce qu'une autre copie de travail fait bouger.
 *
 * `P-28`, seconde moitié : « ce qu'on neutralise, on le mesure ailleurs ». Ces
 * comptes sont ce « ailleurs ».
 */
async function residusDuParcours(portee, marqueurs) {
	const comptes = portee.comptes.length > 0 ? portee.comptes : [null];
	const fenetre = [portee.debut, portee.fin];
	const mesures = [
		/* LA SESSION SE RECONNAÎT À SON JETON, ET C'EST LA SEULE ATTRIBUTION
		   EXACTE. Compter les sessions du persona a fabriqué un faux résidu :
		   une copie de travail voisine ouvre des sessions POUR LE MÊME COMPTE
		   sur la même base, et la ligne comptée n'était pas la nôtre. */
		[
			'session ouverte par la batterie',
			'select count(*)::int as n from sessions where condensat_jeton = any($1::text[])',
			[portee.jetons]
		],
		[
			'droits posés par la batterie',
			`select count(*)::int as n from droits_de_dossier
			  where compte_id = any($1::uuid[]) and cree_le between $2 and $3`,
			[comptes, ...fenetre]
		],
		[
			'tentatives de connexion de la fenêtre',
			'select count(*)::int as n from tentatives_de_connexion where le between $1 and $2',
			fenetre
		],
		[
			'mot de passe posé par la batterie',
			`select count(*)::int as n from comptes
			  where condensat_mot_de_passe = any($1::text[])`,
			[portee.condensats]
		],
		[
			'versions écrites',
			'select count(*)::int as n from versions where cree_le between $1 and $2',
			fenetre
		],
		[
			'notes créées',
			`select count(*)::int as n from notes
			  where cree_le between $1 and $2 and id <> all($3::uuid[])`,
			[...fenetre, marqueurs.notes]
		],
		[
			'dossiers créés',
			`select count(*)::int as n from dossiers
			  where cree_le between $1 and $2 and id <> all($3::uuid[])`,
			[...fenetre, marqueurs.dossiers]
		],
		[
			'étiquettes créées',
			`select count(*)::int as n from etiquettes
			  where cree_le between $1 and $2 and id <> all($3::uuid[])`,
			[...fenetre, marqueurs.etiquettes]
		],
		[
			'vérifications écrites',
			'select count(*)::int as n from verifications where id <> all($1::uuid[])',
			[marqueurs.verifications]
		]
	];
	const residus = [];
	for (const [quoi, sql, valeurs] of mesures) {
		const [ligne] = await interroger(sql, valeurs);
		if (ligne.n > 0) residus.push({ quoi, combien: ligne.n });
	}
	return residus;
}

/** Le condensat SHA-256 d'un jeton de session, comme `src/lib/auth/sessions.ts`
 *  l'écrit en base. C'est ce qui rend une session ATTRIBUABLE. */
function condensatDeJeton(jeton) {
	return createHash('sha256').update(jeton).digest('hex');
}

/** Le condensat Argon2id du mot de passe de mesure, calculé PAR LE PRODUIT. */
async function condensatDuMotDePasse() {
	const { createServer } = await import('vite');
	const vite = await createServer({
		/* `hmr: false` — sans lui, ce serveur éphémère réclame le port de la
		   surveillance et se plaint quand une autre copie de travail le tient
		   déjà (`P-22` : ce qu'un lot laisse derrière lui). */
		server: { middlewareMode: true, hmr: false },
		appType: 'custom',
		logLevel: 'error',
		root: racine
	});
	try {
		const M = await vite.ssrLoadModule('/src/lib/auth/mots-de-passe.ts');
		return await M.hacherMotDePasse(MOT_DE_PASSE);
	} finally {
		await vite.close();
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LES ANCRES DU CORPUS — LUES, JAMAIS ÉCRITES EN DUR

   `PLAN §3.6` : « les parcours PU-01 à PU-06 deviennent scriptables tels qu'ils
   sont écrits, avec les mêmes titres de notes ». Les ancres sont donc CHOISIES
   DANS LE CORPUS SEMÉ, par une requête déterministe, et leur absence fait
   REFUSER DE MESURER — jamais inventer un identifiant qui n'existe pas
   (`P-02`, et la borne 2 du contrat du lot).
   ═════════════════════════════════════════════════════════════════════════ */

async function ancresDuCorpus() {
	try {
		return await ancresLues();
	} catch (cause) {
		refusDeMesurer.push(expliquer(cause));
		return { marquesInternes: [] };
	}
}

async function ancresLues() {
	const [procedure] = await interroger(
		`select n.identifiant, n.titre, d.identifiant as domaine, u.identifiant as univers
		   from notes n
		   join domaines d on d.id = n.domaine_id
		   join univers u on u.id = d.univers_id
		  where n.corps_operationnel is not null and n.visibilite = 'interne'
		    and n.statut = 'publiee'
		  order by n.identifiant limit 1`
	);
	const [autreInterne] = await interroger(
		`select identifiant, titre from notes
		  where visibilite = 'interne' and statut = 'publiee'
		    and identifiant <> coalesce($1, '')
		  order by identifiant limit 1`,
		[procedure?.identifiant ?? null]
	);
	const [guide] = await interroger(
		`select n.identifiant, n.titre from notes n
		  where n.visibilite = 'publique' and n.statut = 'publiee'
		  order by n.identifiant limit 1`
	);
	const [aReviser] = await interroger(
		`select identifiant, titre, revision_commentaire from notes
		  where revision_demandee order by identifiant limit 1`
	);
	const [serveur] = await interroger(
		`select n.identifiant, n.titre, count(r.id) as heberge
		   from notes n
		   join relations r on r.source_id = n.id
		   join types_de_relation t on t.id = r.type_de_relation_id
		  where t.identifiant = 'heberge'
		  group by n.identifiant, n.titre
		  order by count(r.id) desc, n.identifiant limit 1`
	);
	const internes = await interroger(
		"select identifiant from notes where not (visibilite = 'publique' and statut = 'publiee') order by identifiant"
	);
	const [domaineDense] = await interroger(
		`select d.identifiant as domaine, u.identifiant as univers, d.nom, count(n.id) as notes
		   from domaines d
		   join univers u on u.id = d.univers_id
		   left join notes n on n.domaine_id = d.id
		  group by d.identifiant, u.identifiant, d.nom
		  order by count(n.id) desc, d.identifiant limit 1`
	);
	const ancres = {
		procedure,
		autreInterne,
		guide,
		aReviser,
		serveur,
		domaineDense,
		marquesInternes: internes.map((n) => String(n.identifiant))
	};
	for (const [nom, valeur] of Object.entries(ancres)) {
		if (valeur === undefined || valeur === null) {
			refusDeMesurer.push(`ancre « ${nom} » absente du corpus semé : rien à jouer`);
		}
	}
	return ancres;
}

/**
 * UN MOT PRÉSENT À LA FOIS DANS UN TITRE PUBLIC ET DANS UN TITRE INTERNE.
 *
 * C'est ce qui rend l'étape 3 de PU-03 opposable : la recherche doit rapporter
 * quelque chose ET ne rien laisser passer. Le mot est choisi par une requête
 * déterministe — le plus court des mots communs, à longueur égale le premier
 * dans l'ordre alphabétique — pour que trois exécutions rendent le même.
 */
async function termePartage() {
	const publics = await interroger(
		"select titre from notes where visibilite = 'publique' and statut = 'publiee'"
	);
	const internes = await interroger(
		"select titre from notes where not (visibilite = 'publique' and statut = 'publiee')"
	);
	const mots = (lignes) =>
		new Set(
			lignes
				.flatMap((l) =>
					String(l.titre)
						.toLowerCase()
						.split(/[^\p{L}\p{N}]+/u)
				)
				.filter((m) => m.length >= 6)
		);
	const communs = [...mots(publics)].filter((m) => mots(internes).has(m));
	communs.sort((a, b) => a.length - b.length || a.localeCompare(b, 'fr'));
	return communs[0] ?? null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. LE PRODUIT CONSTRUIT, SERVI, ET ATTENDU SUR UN MARQUEUR ÉCRIT (`P-1`)
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
	env.ORIGIN = BASE_HTTP;
	produit = spawn(process.execPath, ['build/index.js'], {
		cwd: racine,
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let journal = '';
	produit.stdout?.on('data', (d) => (journal += String(d)));
	produit.stderr?.on('data', (d) => (journal += String(d)));

	/* `P-1` — on attend un MARQUEUR ÉCRIT, jamais la disparition d'un processus.
	   Le marqueur est la première réponse HTTP : elle prouve à la fois que le
	   serveur écoute ET qu'il sert. */
	for (let essai = 0; essai < 200; essai++) {
		const vivant = await fetch(`${BASE_HTTP}/connexion`, { redirect: 'manual' }).catch(() => null);
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

function arreterLeProduit() {
	/* `P-22` — un lot qui laisse un serveur debout fait mesurer le mauvais
	   serveur au lot suivant. Celui-ci meurt avec la batterie, toujours. */
	produit?.kill('SIGTERM');
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. LA SESSION — OUVERTE PAR LE PRODUIT, PORTÉE PAR LE NAVIGATEUR
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * `POST /connexion`, avec le corps que l'action attend (`identifiant`,
 * `motdepasse`), et l'entête d'acceptation d'un navigateur — la batterie 6 a
 * mesuré que le défaut de `fetch` fait rendre 200 et un corps JSON là où un
 * navigateur reçoit 401 et la page.
 *
 * @returns {Promise<{jeton: string|null, status: number, cible: string|null}>}
 */
async function ouvrirUneSession(identifiant) {
	const reponse = await fetch(`${BASE_HTTP}/connexion`, {
		method: 'POST',
		headers: {
			accept: 'text/html,application/xhtml+xml',
			'content-type': 'application/x-www-form-urlencoded',
			origin: BASE_HTTP
		},
		body: new URLSearchParams({ identifiant, motdepasse: MOT_DE_PASSE }).toString(),
		redirect: 'manual'
	});
	const jeton =
		reponse.headers
			.getSetCookie()
			.map((c) => c.split(';')[0])
			.find((c) => c.startsWith('codicillus_session='))
			?.split('=')[1] ?? null;
	return { jeton, status: reponse.status, cible: reponse.headers.get('location') };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LE NAVIGATEUR ET L'OBSERVATION D'UNE ÉTAPE
   ═════════════════════════════════════════════════════════════════════════ */

const { chromium } = await import('@playwright/test');

/**
 * Le journal d'un parcours : ce que le produit a répondu, et ce que le produit
 * a coûté. `partDuProduitMs` n'accumule QUE des durées de réponse — jamais les
 * attentes de l'instrument, qui ne sont pas du temps de produit.
 */
function nouveauJournal() {
	return { reponses: [], partDuProduitMs: 0, requetesEcriture: 0 };
}

/**
 * Une navigation, mesurée. La durée retenue est celle de la réponse du
 * document, pas celle de la stabilisation de la page : le budget du cahier
 * porte sur ce que le produit fait attendre.
 */
async function aller(ctx, chemin, { compter = true } = {}) {
	const debut = performance.now();
	const reponse = await ctx.page.goto(`${BASE_HTTP}${chemin}`, {
		waitUntil: 'domcontentloaded',
		timeout: 120_000
	});
	const duree = performance.now() - debut;
	const corps = await ctx.page.content();
	const observation = {
		chemin,
		status: reponse?.status() ?? 0,
		corps,
		dureeMs: duree
	};
	ctx.journal.reponses.push(observation);
	if (compter) ctx.journal.partDuProduitMs += duree;
	return observation;
}

/** Une requête HTTP dans le contexte du navigateur — pour les adresses
 *  construites et pour les actions serveur. Elle porte les cookies de la
 *  session, et elle est réelle. */
async function demander(ctx, chemin, options = {}) {
	const debut = performance.now();
	const reponse = await ctx.contexte.request.fetch(`${BASE_HTTP}${chemin}`, {
		method: options.methode ?? 'GET',
		headers: { accept: 'text/html,application/xhtml+xml', ...(options.entetes ?? {}) },
		data: options.corps,
		multipart: options.multipart,
		form: options.form,
		maxRedirects: 0,
		failOnStatusCode: false,
		timeout: 120_000
	});
	const duree = performance.now() - debut;
	const corps = await reponse.text();
	const observation = { chemin, status: reponse.status(), corps, dureeMs: duree };
	ctx.journal.reponses.push(observation);
	if (options.compter !== false) ctx.journal.partDuProduitMs += duree;
	return observation;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LES MESURES — UNE PAR ÉTAPE DU CAHIER

   Chaque mesure rend `{issue, cause, preuve}` :
   `franchie` — l'étape est jouée et le produit a fait ce que la phrase annonce ;
   `defaut` — le produit a répondu, et ce qu'il rend contredit la phrase ;
   `non-couvert` — rien ne porte l'étape encore, et `cause` dit quoi ;
   `hors-produit` — la phrase ne décrit pas un geste dans le produit.
   ═════════════════════════════════════════════════════════════════════════ */

const F = (preuve) => ({ issue: 'franchie', cause: null, preuve });
const D = (preuve) => ({ issue: 'defaut', cause: null, preuve });
const N = (cause, preuve) => ({ issue: 'non-couvert', cause, preuve });
const H = (preuve) => ({ issue: 'hors-produit', cause: null, preuve });

/**
 * DEUX LECTURES DU TEXTE, ET ELLES NE DISENT PAS LA MÊME CHOSE.
 *
 * `texteVisible` est ce qu'un lecteur lit — `innerText`, donc rien de ce qui est
 * masqué. `texteDuDocument` est ce que le document PORTE — `textContent`, y
 * compris dans un dialogue fermé ou un panneau replié. La première a fabriqué un
 * faux défaut au premier jet : les quatre templates de `#templates` sont dans le
 * document et hors du flux visible, et la mesure les déclarait absents.
 */
async function texteVisible(page) {
	return (
		await page
			.locator('body')
			.innerText()
			.catch(() => '')
	)
		.replace(/\s+/g, ' ')
		.trim();
}

async function texteDuDocument(page) {
	return (
		(await page
			.locator('body')
			.textContent()
			.catch(() => '')) ?? ''
	)
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * LA NOTE AFFICHÉE EST-ELLE LA NOTE DEMANDÉE ? — mesuré une fois par parcours,
 * sur deux notes distinctes, et retenu : plusieurs étapes en dépendent, et une
 * mesure refaite serait une mesure de plus à payer sans rien apprendre.
 */
async function dependanceAuContenu(ctx) {
	if (ctx.faits.contenuDependantDeLaNote !== undefined) {
		return ctx.faits.contenuDependantDeLaNote;
	}
	await aller(ctx, `/notes/${ctx.ancres.procedure.identifiant}`, { compter: false });
	const a = await texteVisible(ctx.page);
	await aller(ctx, `/notes/${ctx.ancres.autreInterne.identifiant}`, { compter: false });
	const b = await texteVisible(ctx.page);
	ctx.faits.longueurDuTexte = a.length;
	ctx.faits.contenuDependantDeLaNote = a !== b;
	return ctx.faits.contenuDependantDeLaNote;
}

const MESURES = {
	/* ───────────────────────────── PU-01 ───────────────────────────── */

	'pu01-ouvrir': async (ctx) => {
		const o = await aller(ctx, '/');
		ctx.jalons.ouverture = o;
		if (o.status !== 200) return D(`GET / rend ${o.status} pour une session ouverte`);
		const rail = await ctx.page.locator('.app').count();
		const indicateurs = await ctx.page.locator('.ind').count();
		return rail > 0
			? F(`GET / → 200, coquille connectée rendue (${indicateurs} indicateurs)`)
			: D('GET / → 200 mais aucune coquille connectée');
	},

	'pu01-palette': async (ctx) => {
		/* Le gel ANNONCE le raccourci : la barre supérieure rend deux touches
		   « Ctrl » et « K » (`src/lib/coquille/BarreSuperieure.svelte:150`, forme
		   reprise du gel). On le joue donc, et on regarde ce qui s'ouvre. */
		const requetes = [];
		const espion = (r) => requetes.push(r.url());
		ctx.page.on('request', espion);
		await ctx.page.keyboard.press('Control+k');
		await ctx.page.waitForTimeout(400);
		ctx.page.off('request', espion);
		const dialogues = await ctx.page.locator('dialog[open]').count();
		const palette = await ctx.page.locator('#palette').count();
		if (dialogues > 0) {
			await ctx.page.keyboard.type('restaurer sauvgarde barman');
			return F(`Ctrl+K ouvre un dialogue (${dialogues}), la frappe y est portée`);
		}
		return N(
			'comportement-non-cable',
			`Ctrl+K : 0 dialogue ouvert, ${palette} élément #palette dans le document, ${requetes.length} requête réseau — aucun écouteur (ARB-011, le comportement est du temps 3)`
		);
	},

	'pu01-resultats': async (ctx) => {
		/* Deux voies, et la seconde est celle qu'un utilisateur emploierait si la
		   palette n'existait pas : le champ de la page d'accueil, puis l'adresse
		   de recherche portant la requête. Les deux sont mesurées. */
		const champ = ctx.page.locator('#recherche-accueil');
		let frappe = 0;
		if ((await champ.count()) > 0) {
			await champ.click();
			await champ.type('restaurer sauvgarde barman', { delay: 10 });
			await ctx.page.waitForTimeout(500);
			frappe = await ctx.page.locator('.carte').count();
		}
		const o = await aller(ctx, '/recherche?q=restaurer+sauvgarde+barman');
		const cartes = await ctx.page.locator('#resultats .carte').count();
		ctx.faits.resultatsConnectes = cartes;
		if (cartes > 0) {
			const badge = await ctx.page
				.locator('#resultats .carte')
				.first()
				.locator('.temoin__txt')
				.count();
			return badge > 0
				? F(`${cartes} résultats rendus, le premier porte un témoin de fraîcheur`)
				: D(`${cartes} résultats rendus, aucun témoin de fraîcheur sur le premier`);
		}
		return N(
			'gel',
			`frappe au champ d’accueil : ${frappe} résultat ; GET /recherche?q=… → ${o.status} et 0 résultat rendu. La zone de résultats de V-08 est VIDE DANS LE GEL — ARB-030 : « verif:maquette restera vert sur sa zone de résultats vide des deux côtés »`
		);
	},

	'pu01-ouvrir-resultat': async (ctx) => {
		const avant = ctx.page.url();
		await ctx.page.keyboard.press('ArrowDown');
		await ctx.page.keyboard.press('Enter');
		await ctx.page.waitForTimeout(400);
		const apres = ctx.page.url();
		if (apres !== avant) return F(`flèche puis Entrée : l’adresse passe à ${apres}`);
		return N(
			'gel',
			`flèche puis Entrée sur la page de recherche : l’adresse ne change pas (${ctx.faits.resultatsConnectes} résultat à ouvrir)`
		);
	},

	'pu01-lecture': async (ctx) => {
		const o = await aller(ctx, `/notes/${ctx.ancres.procedure.identifiant}`);
		ctx.jalons.lecture = o;
		if (o.status !== 200) return D(`GET /notes/{procédure} rend ${o.status}`);
		const cartouche = await ctx.page.locator('.cartouche').count();
		const sommaire = await ctx.page.locator('.sommaire.vue-reelle').count();
		/* LA QUESTION QUI DÉCIDE : est-ce LA NOTE DEMANDÉE qui s'affiche ? Deux
		   notes distinctes, un seul texte visible, et l'étape n'est pas franchie
		   quoi qu'affiche la page. */
		const dependant = await dependanceAuContenu(ctx);
		await aller(ctx, `/notes/${ctx.ancres.procedure.identifiant}`, { compter: false });
		if (cartouche === 0 || sommaire === 0) {
			return D(`bandeau de confiance : ${cartouche}, sommaire : ${sommaire}`);
		}
		if (!dependant) {
			return N(
				'gel',
				`bandeau et sommaire rendus, mais le TEXTE VISIBLE est identique pour deux notes distinctes — ${ctx.faits.longueurDuTexte} caractères de part et d’autre. V-14 rend la transcription gelée d’une note du corpus (src/routes/notes/[identifiant]/+page.svelte le déclare) : la note demandée n’est pas celle qui s’affiche`
			);
		}
		return F(`bandeau de confiance et sommaire rendus, texte propre à la note demandée`);
	},

	'pu01-registre': async (ctx) => {
		const onglet = ctx.page.locator('#registre [data-reg="operationnel"]');
		const present = await onglet.count();
		let bascule = false;
		if (present > 0) {
			await onglet.click();
			await ctx.page.waitForTimeout(300);
			const actif = await ctx.page
				.locator('#registre [data-reg="operationnel"]')
				.getAttribute('aria-selected');
			const corps = await ctx.page.locator('#corps-operationnel').getAttribute('hidden');
			bascule = actif === 'true' || corps === null;
		}
		/* L'ADRESSE EST LA SECONDE VOIE, et elle est attestée : `docs/routes.md:223`
		   — `?registre=` sur `/notes/{identifiant}`, écrit par `V-14:3959`. */
		const avant = await texteVisible(ctx.page);
		const o = await aller(ctx, `/notes/${ctx.ancres.procedure.identifiant}?registre=operationnel`);
		const apres = await texteVisible(ctx.page);
		if (bascule) return F('le sélecteur bascule sur le registre Opérationnel');
		return N(
			'comportement-non-cable',
			`sélecteur rendu (${present} onglet), le clic ne bascule pas ; ?registre=operationnel → ${o.status} et un texte ${avant === apres ? 'IDENTIQUE' : 'différent'} à celui de la Référence`
		);
	},

	'pu01-copie': async (ctx) => {
		const blocs = await ctx.page.locator('.bloc-code').count();
		const boutons = ctx.page.locator('.bloc-code button, .bloc-code .j-cmd');
		const nombre = await boutons.count();
		ctx.jalons.blocDeCommande = { blocs, boutons: nombre };
		if (blocs === 0) return D('aucun bloc de code dans la page de lecture');
		if (nombre === 0) {
			return N('comportement-non-cable', `${blocs} blocs de code, aucun bouton de copie`);
		}
		/* LE PRESSE-PAPIERS SE MESURE AVEC UN TÉMOIN. Sans lui, « rien n'a été
		   copié » et « l'instrument ne sait pas lire le presse-papiers » rendent la
		   même valeur vide, et la seconde serait imputée au produit. Le témoin est
		   écrit AVANT le clic : s'il est illisible, la batterie refuse de conclure
		   sur cette étape au lieu de conclure à faux. */
		const TEMOIN = 'temoin-T-054';
		let lisible = false;
		let copie = null;
		try {
			await ctx.contexte.grantPermissions(['clipboard-read', 'clipboard-write'], {
				origin: BASE_HTTP
			});
			await ctx.page.evaluate((t) => navigator.clipboard.writeText(t), TEMOIN);
			lisible = (await ctx.page.evaluate(() => navigator.clipboard.readText())) === TEMOIN;
			await boutons.first().click();
			await ctx.page.waitForTimeout(200);
			copie = await ctx.page.evaluate(() => navigator.clipboard.readText());
		} catch (cause) {
			ctx.faits.copieErreur = String(cause).slice(0, 160);
		}
		if (!lisible) {
			refusDeMesurer.push(
				`PU-01.7 : le presse-papiers du navigateur n’est pas lisible par l’instrument (${ctx.faits.copieErreur ?? 'témoin non relu'}) — la copie n’est ni prouvée ni réfutée`
			);
			return D('presse-papiers non mesurable — voir le refus de mesurer');
		}
		if (copie === TEMOIN) {
			return N(
				'comportement-non-cable',
				`${blocs} blocs de code, ${nombre} bouton(s) ; après le clic le presse-papiers porte encore le témoin de l’instrument — rien n’a été copié (ARB-011 : « ni la copie d’un bloc de code » n’est portée)`
			);
		}
		return F(`presse-papiers après le clic : ${String(copie).length} caractères, témoin remplacé`);
	},

	'pu01-alerte': async (ctx) => {
		const attention = await ctx.page.locator('.alerte--attention').count();
		if (attention === 0) return D('aucun bloc d’alerte « Attention » dans la page');
		if (!(await dependanceAuContenu(ctx))) {
			return N(
				'gel',
				`${attention} bloc d’alerte « Attention » rendu, mais il appartient à la transcription gelée, pas à la note demandée (voir PU-01.5)`
			);
		}
		return F(`${attention} bloc d’alerte « Attention » rendu`);
	},

	'pu01-verifier': async (ctx) => {
		const bouton = ctx.page.locator('#btn-verifier');
		const present = await bouton.count();
		const [avant] = await interroger('select count(*)::int as n from verifications');
		const requetes = [];
		const espion = (r) => {
			if (r.method() !== 'GET') requetes.push(`${r.method()} ${r.url()}`);
		};
		ctx.page.on('request', espion);
		if (present > 0) {
			await bouton
				.first()
				.click({ timeout: 5000 })
				.catch(() => {});
			await ctx.page.waitForTimeout(600);
		}
		ctx.page.off('request', espion);
		const [apres] = await interroger('select count(*)::int as n from verifications');
		if (apres.n > avant.n) return F(`la vérification est écrite : ${avant.n} → ${apres.n} lignes`);
		if (present === 0) return N('route-absente', 'aucun bouton « Marquer comme vérifié » rendu');
		return N(
			'action-absente',
			`bouton rendu et cliqué : ${requetes.length} requête d’écriture, table verifications inchangée (${avant.n} lignes). Aucune route ni action du produit n’écrit une vérification — recherche exhaustive : aucun fichier de src/routes ne touche la table`
		);
	},

	/* ───────────────────────────── PU-02 ───────────────────────────── */

	'pu02-nouvelle-note': async (ctx) => {
		const o = await aller(ctx, '/');
		ctx.jalons.ouverture = o;
		const creer = ctx.page.locator('button:has-text("Créer")');
		let mene = null;
		if ((await creer.count()) > 0) {
			await creer
				.first()
				.click({ timeout: 5000 })
				.catch(() => {});
			await ctx.page.waitForTimeout(300);
			const entree = ctx.page.locator(
				'button:has-text("Nouvelle note"), a:has-text("Nouvelle note")'
			);
			if ((await entree.count()) > 0) {
				const avant = ctx.page.url();
				await entree
					.first()
					.click({ timeout: 5000 })
					.catch(() => {});
				await ctx.page.waitForTimeout(400);
				mene = ctx.page.url() === avant ? 'aucune navigation' : ctx.page.url();
			}
		}
		const route = await aller(ctx, '/notes/nouvelle');
		if (route.status !== 200) {
			return N('droit-du-persona', `GET /notes/nouvelle → ${route.status} pour ce persona`);
		}
		if (mene !== null && mene !== 'aucune navigation') {
			return F(`« Nouvelle note » mène à ${mene}`);
		}
		return N(
			'comportement-non-cable',
			`GET /notes/nouvelle → 200, mais l’affordance « Nouvelle note » ne navigue pas (${mene ?? 'entrée non atteinte : le menu « Créer » ne s’ouvre pas'})`
		);
	},

	'pu02-template': async (ctx) => {
		const texte = await texteDuDocument(ctx.page);
		const templates = await interroger('select nom from templates order by nom');
		const rendus = templates.filter((t) => texte.includes(String(t.nom)));
		const selecteur = await ctx.page.locator('#templates button').count();
		const cite = 'Procédure technique';
		if (rendus.length === 0) {
			return D(`aucun des ${templates.length} templates du corpus n’est nommé dans la page`);
		}
		return F(
			`sélecteur de ${selecteur} template(s), ${rendus.length}/${templates.length} nommés depuis la base ; le cahier cite « ${cite} », que le corpus semé ne porte pas (il porte « ${templates.map((t) => t.nom).join(' · ')} ») — aucun nom n’est inventé`
		);
	},

	'pu02-squelette': async (ctx) => {
		const bouton = ctx.page.locator('#templates button').filter({ hasText: 'Procédure' });
		const redaction = ctx.page.locator('#redaction');
		const avant = (await redaction.textContent().catch(() => '')) ?? '';
		const clics = await bouton.count();
		if (clics > 0) {
			await bouton
				.first()
				.click({ timeout: 5000, force: true })
				.catch(() => {});
			await ctx.page.waitForTimeout(400);
		}
		const apres = (await redaction.textContent().catch(() => '')) ?? '';
		const sections = ['Objectif', 'Prérequis', 'Étapes', 'Vérification', 'En cas de problème'];
		const presentes = sections.filter((s) => apres.includes(s));
		if (avant !== apres && presentes.length >= 3) {
			return F(`le squelette apparaît dans la zone de rédaction : ${presentes.join(' · ')}`);
		}
		return N(
			'comportement-non-cable',
			`${clics} bouton de template cliqué ; la zone de rédaction reste à ${apres.length} caractères et ne porte ${presentes.length}/5 des intitulés du cahier`
		);
	},

	'pu02-doublon': async (ctx) => {
		const champ = ctx.page.locator('input[type="text"]').first();
		if ((await champ.count()) === 0) return D('aucun champ de titre dans l’éditeur');
		await champ.click();
		await champ.fill(String(ctx.ancres.procedure.titre));
		await ctx.page.waitForTimeout(600);
		const texte = await texteVisible(ctx.page);
		const avertit = /existe déjà|note proche|très proche|doublon/i.test(texte);
		return avertit
			? F('le produit avertit qu’une note très proche existe déjà')
			: N(
					'route-absente',
					`le titre exact d’une note existante est saisi ; aucun avertissement de proximité (aucune détection de note proche dans le produit)`
				);
	},

	'pu02-markdown': async (ctx) => {
		const zone = ctx.page.locator('.ProseMirror, [contenteditable="true"]');
		if ((await zone.count()) === 0) {
			return N('comportement-non-cable', 'aucune zone de rédaction éditable montée dans la page');
		}
		await zone.first().click();
		await ctx.page.keyboard.type('## Titre de section\n- premier point\n- second point\n');
		await ctx.page.waitForTimeout(300);
		const titres = await zone.first().locator('h2').count();
		const puces = await zone.first().locator('ul li').count();
		const recu = ((await zone.first().textContent()) ?? '').includes('Titre de section');
		if (titres > 0 && puces >= 2) {
			return F(`les listes et titres se forment à la volée : ${titres} titre, ${puces} puces`);
		}
		/* LA FRAPPE ARRIVE — la zone est un `contenteditable` du gel — mais RIEN ne
		   la transforme : aucun éditeur n'est monté dessus. La distinction compte,
		   et c'est pourquoi on vérifie que le texte est bien entré avant de
		   conclure : « la frappe est perdue » et « la frappe n'est pas interprétée »
		   ne se réparent pas au même endroit. */
		return N(
			'comportement-non-cable',
			`la frappe ${recu ? 'entre bien' : 'N’ENTRE PAS'} dans la zone ; ${titres} titre et ${puces} puces en sortent — la zone est le contenteditable du gel, aucun éditeur n’y est monté`
		);
	},

	'pu02-bloc-de-code': async (ctx) => {
		const zone = ctx.page.locator('.ProseMirror, [contenteditable="true"]');
		if ((await zone.count()) === 0) {
			return N('comportement-non-cable', 'aucune zone de rédaction éditable montée dans la page');
		}
		await zone.first().click();
		await ctx.page.keyboard.type('```bash\nbarman recover\n');
		await ctx.page.waitForTimeout(300);
		const blocs = await zone.first().locator('pre').count();
		const recu = ((await zone.first().textContent()) ?? '').includes('barman recover');
		return blocs > 0
			? F(`le caractère déclencheur insère un bloc de code (${blocs})`)
			: N(
					'comportement-non-cable',
					`la frappe ${recu ? 'entre bien' : 'N’ENTRE PAS'} dans la zone ; aucun bloc préformaté n’en sort, et aucun sélecteur de langage ne s’ouvre`
				);
	},

	'pu02-lien-interne': async (ctx) => {
		const zone = ctx.page.locator('.ProseMirror, [contenteditable="true"]');
		if ((await zone.count()) === 0) {
			return N('comportement-non-cable', 'aucune zone de rédaction éditable montée dans la page');
		}
		await zone.first().click();
		await ctx.page.keyboard.type('[[');
		await ctx.page.waitForTimeout(500);
		const suggestions = await ctx.page
			.locator('[role="listbox"], .suggestions, .autocomplete')
			.count();
		return suggestions > 0
			? F(`la séquence de lien interne ouvre une auto-complétion (${suggestions})`)
			: N(
					'comportement-non-cable',
					'la séquence de lien interne n’ouvre aucune auto-complétion de note'
				);
	},

	'pu02-etiquettes': async (ctx) => {
		const champ = ctx.page.locator(
			'input[placeholder*="tiquette" i], input[aria-label*="tiquette" i], #etiquettes input, input#etiq'
		);
		if ((await champ.count()) === 0) {
			const etiquettes = (await texteDuDocument(ctx.page)).includes('tiquette');
			const dossier = await ctx.page.locator('#dossier, [aria-label*="ossier" i]').count();
			return N(
				'comportement-non-cable',
				`aucun champ d’étiquette dans l’éditeur (le mot « étiquette » ${etiquettes ? 'apparaît' : 'n’apparaît pas'} dans le document, ${dossier} sélecteur de dossier)`
			);
		}
		await champ.first().click();
		await champ.first().type('sauve');
		await ctx.page.waitForTimeout(500);
		const propositions = await ctx.page.locator('[role="option"], .propositions li').count();
		return propositions > 0
			? F(`l’auto-complétion d’étiquettes propose ${propositions} valeurs`)
			: N('comportement-non-cable', 'le champ d’étiquette ne propose aucune valeur');
	},

	'pu02-enregistrer': async (ctx) => {
		/* L'ÉCRITURE PASSE PAR L'ACTION SERVEUR, et le rapport le dit — le
		   formulaire du gel n'a ni `method` ni `action` (`ARB-054` §3). */
		const o = await demander(ctx, '/notes/nouvelle', {
			methode: 'POST',
			entetes: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE_HTTP },
			corps: new URLSearchParams({ titre: 'Parcours T-054 — note de mesure' }).toString()
		});
		ctx.journal.requetesEcriture += 1;
		ctx.jalons.enregistrement = o;
		const [note] = await interroger(
			"select identifiant from notes where titre = 'Parcours T-054 — note de mesure'"
		);
		if (note !== undefined) {
			return F(`la note est créée : ${note.identifiant}`);
		}
		if (o.status === 501) {
			const motif = /RG-M12-11[^<"]{0,160}/.exec(o.corps)?.[0] ?? '';
			return N(
				'action-refusee',
				`POST /notes/nouvelle (action serveur) → 501, et l’action le déclare : « ${motif.slice(0, 120)}… »`
			);
		}
		return D(`POST /notes/nouvelle → ${o.status} et aucune note créée`);
	},

	/* ───────────────────────────── PU-03 ───────────────────────────── */

	'pu03-ouvrir': async (ctx) => {
		const o = await aller(ctx, '/');
		ctx.jalons.ouverture = o;
		if (o.status !== 200) return D(`GET / en anonyme rend ${o.status}`);
		const publique = await ctx.page.locator('.public').count();
		return publique > 0
			? F('GET / → 200, accueil public rendu (aucune session)')
			: D('GET / → 200 mais la coquille publique n’est pas rendue');
	},

	'pu03-champ': async (ctx) => {
		const champ = await ctx.page.locator('input[type="search"]').count();
		return champ > 0
			? F(`l’accueil public propose une recherche (${champ} champ)`)
			: D('aucun champ de recherche sur l’accueil public');
	},

	'pu03-resultats-publics': async (ctx) => {
		/* LE TERME EST CHOISI POUR QUE LA MESURE MORDE, et c'est le point délicat
		   de cette étape. Un terme sans aucun résultat public rendrait le critère
		   « les résultats ne contiennent que du contenu public » vrai par vacuité
		   — la faute `RA-01`. Le terme retenu est donc un mot présent À LA FOIS
		   dans un titre public et dans un titre interne : les résultats doivent
		   exister, et l'interne doit en être absent. S'il n'en existe aucun, la
		   batterie le dit plutôt que de mesurer à vide. */
		const requete = ctx.faits.requetePublique ?? (await termePartage());
		if (requete === null) {
			return D(
				'aucun mot n’est commun à un titre public et à un titre interne : l’étape ne peut pas être mesurée sans vacuité'
			);
		}
		ctx.faits.requetePublique = requete;
		const o = await aller(ctx, `/recherche?q=${encodeURIComponent(requete)}`);
		const cartes = await ctx.page.locator('#resultats .carte').count();
		const texte = await texteVisible(ctx.page);
		const fuites = ctx.ancres.marquesInternes.filter((m) => o.corps.includes(m));
		const titresInternes = await interroger(
			"select titre from notes where not (visibilite = 'publique' and statut = 'publiee')"
		);
		const titresFuites = titresInternes
			.map((t) => String(t.titre))
			.filter((t) => t.length > 12 && texte.includes(t));
		if (cartes === 0) {
			return D(`« ${requete} » : 0 résultat rendu sur l’écran public`);
		}
		if (fuites.length > 0 || titresFuites.length > 0) {
			return D(
				`${cartes} résultats, et ${fuites.length + titresFuites.length} marque(s) de contenu interne dans la réponse : ${[...fuites, ...titresFuites].slice(0, 3).join(' · ')}`
			);
		}
		return F(`« ${requete} » : ${cartes} résultats, aucune marque de contenu interne`);
	},

	'pu03-guide': async (ctx) => {
		/* Le clic sur la carte est joué d'abord : c'est ce que le parcours écrit. */
		const carte = ctx.page.locator('#resultats .carte').first();
		const cartes = await carte.count();
		const cible = cartes > 0 ? await carte.getAttribute('href') : null;
		const avant = ctx.page.url();
		if (cartes > 0) {
			await carte.click({ timeout: 5000 }).catch(() => {});
			await ctx.page.waitForTimeout(400);
		}
		const navigue = ctx.page.url() !== avant;
		const o = await aller(ctx, `/guides/${ctx.ancres.guide.identifiant}`);
		if (o.status !== 200) return D(`GET /guides/{guide public} → ${o.status}`);
		const temoin = await ctx.page.locator('.temoin__txt, .cartouche').count();
		const verifie = /[Vv]érifié/.test(await texteVisible(ctx.page));
		if (!navigue) {
			return N(
				'gel',
				`${cartes} carte(s) de résultat, la première porte href="${cible}" : le clic ne mène nulle part. Le guide s’ouvre par son adresse — 200, ${temoin} marque de fraîcheur, mention « vérifié » ${verifie ? 'présente' : 'absente'}. Les 681 href="#" du gel sont la dette que verif:menus tient`
			);
		}
		return verifie
			? F(`le guide s’ouvre depuis le résultat, et porte sa fraîcheur`)
			: D('le guide s’ouvre mais ne porte aucune mention de vérification');
	},

	'pu03-assistance': async (ctx) => {
		const texte = await texteVisible(ctx.page);
		const appel = ctx.page.locator('a:has-text("ticket"), button:has-text("ticket")');
		const nombre = await appel.count();
		if (nombre === 0) {
			return N(
				'route-absente',
				`aucun appel à l’action « Ouvrir un ticket d’assistance » dans la page ; le mot « ticket » ${/ticket/i.test(texte) ? 'apparaît' : 'n’apparaît pas'} dans le texte`
			);
		}
		const cible = await appel.first().getAttribute('href');
		if (cible === null || cible === '#') {
			return N(
				'gel',
				`l’appel à l’action est rendu (${nombre}) et porte href="${cible}" : il ne redirige vers aucun portail`
			);
		}
		return F(`l’appel à l’action mène à ${cible}`);
	},

	/* ───────────────────────────── PU-04 ───────────────────────────── */

	'pu04-indicateurs': async (ctx) => {
		const o = await aller(ctx, '/');
		ctx.jalons.ouverture = o;
		if (o.status !== 200) return D(`GET / rend ${o.status}`);
		const indicateurs = ctx.page.locator('.ind');
		const nombre = await indicateurs.count();
		const valeurs = [];
		for (let i = 0; i < nombre; i++) {
			valeurs.push(
				`${(await indicateurs.nth(i).locator('.ind__nom').innerText()).trim()} = ${(
					await indicateurs.nth(i).locator('.ind__val').innerText()
				).trim()}`
			);
		}
		const [aReviser] = await interroger(
			'select count(*)::int as n from notes where revision_demandee'
		);
		const revision = valeurs.find((v) => /révision/i.test(v));
		if (nombre < 4)
			return D(`${nombre} indicateurs sur l’accueil, 4 attendus : ${valeurs.join(' · ')}`);
		if (revision === undefined) {
			return D(`4 indicateurs, aucun ne porte les notes à réviser : ${valeurs.join(' · ')}`);
		}
		return F(
			`${nombre} indicateurs : ${valeurs.join(' · ')} — le corpus porte ${aReviser.n} demandes de révision (le cahier en cite 7 : une valeur d’illustration, que P-02 interdit de figer)`
		);
	},

	'pu04-corbeille': async (ctx) => {
		const panneau = ctx.page.locator('#p-revisions');
		if ((await panneau.count()) === 0) return D('aucune corbeille de révisions sur l’accueil');
		const texte = (await panneau.innerText()).replace(/\s+/g, ' ');
		const demandes = await interroger(
			'select identifiant, titre, revision_commentaire from notes where revision_demandee order by identifiant'
		);
		const citees = demandes.filter((d) => texte.includes(String(d.titre).slice(0, 24)));
		const commentaires = demandes.filter(
			(d) => d.revision_commentaire && texte.includes(String(d.revision_commentaire).slice(0, 30))
		);
		if (citees.length === 0) {
			return D(
				`la corbeille est rendue mais ne cite aucune des ${demandes.length} notes signalées`
			);
		}
		if (commentaires.length === 0) {
			return D(
				`${citees.length}/${demandes.length} notes signalées citées, mais aucun commentaire de demandeur`
			);
		}
		return F(
			`${citees.length}/${demandes.length} notes signalées, ${commentaires.length} avec le commentaire du demandeur`
		);
	},

	'pu04-corriger': async (ctx) => {
		const identifiant = String(ctx.ancres.aReviser.identifiant);
		const o = await aller(ctx, `/notes/${identifiant}`);
		const bandeau = await ctx.page.locator('.bandeau--revision:not([hidden])').count();
		/* LA CORRECTION EST JOUÉE POUR DE VRAI, par l'action serveur de l'éditeur
		   (`ARB-054` §3). Le corps soumis est celui que le chargeur vient de
		   rendre : on n'invente aucun document, on réécrit le même. */
		const commentaire = String(ctx.ancres.aReviser.revision_commentaire ?? '');
		const dansLaPage =
			commentaire.length > 20 &&
			(await texteDuDocument(ctx.page)).includes(commentaire.slice(0, 30));
		const edition = await aller(ctx, `/notes/${identifiant}/modifier`);
		let ecriture = null;
		if (edition.status === 200) {
			/* LE CORPS SOUMIS EST UN DOCUMENT MINIMAL VALIDE selon `ADR-003` : on
			   n'invente pas le contenu de la note, on écrit un paragraphe et on
			   remet ensuite la note dans son état d'origine (`P-28`). */
			const corps = JSON.stringify({
				type: 'doc',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Parcours T-054.' }] }]
			});
			ecriture = await demander(ctx, `/notes/${identifiant}/modifier`, {
				methode: 'POST',
				entetes: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE_HTTP },
				corps: new URLSearchParams({ corps }).toString()
			});
			ctx.journal.requetesEcriture += 1;
		}
		const [versions] = await interroger('select count(*)::int as n from versions');
		const [encore] = await interroger(
			'select revision_demandee from notes where identifiant = $1',
			[identifiant]
		);
		const ecrit = ecriture !== null && ecriture.status < 400 && versions.n > 0;
		if (o.status !== 200) return D(`GET /notes/{à réviser} → ${o.status}`);
		if (!dansLaPage) {
			return N(
				'gel',
				`la note signalée s’ouvre (${bandeau} bandeau de révision visible), et le commentaire du demandeur (${commentaire.length} caractères en base) n’est PAS dans la page : V-14 rend la transcription gelée. L’enregistrement par l’action serveur a répondu ${ecriture?.status ?? 'rien'} et écrit ${versions.n} version ; la demande de révision est ${encore?.revision_demandee ? 'toujours posée' : 'levée'}`
			);
		}
		if (!ecrit) {
			return D(
				`commentaire lu en bandeau ; l’enregistrement par l’action serveur rend ${ecriture?.status ?? 'aucune réponse'} et ${versions.n} version en base`
			);
		}
		if (encore?.revision_demandee !== false) {
			return N(
				'action-absente',
				`commentaire lu, enregistrement écrit (${versions.n} version), mais la demande de révision reste posée : rien dans le produit ne la lève, et « vérifie » n’a pas d’action (voir PU-01.9)`
			);
		}
		return F(`la correction est enregistrée et la demande de révision a disparu`);
	},

	'pu04-bord-domaine': async (ctx) => {
		const { univers, domaine } = ctx.ancres.domaineDense;
		const o = await aller(ctx, `/univers/${univers}/${domaine}`);
		if (o.status !== 200) return D(`GET /univers/${univers}/${domaine} → ${o.status}`);
		const texte = await texteVisible(ctx.page);
		const barre = await ctx.page.locator('.jauge, .barre, [class*="fraich"]').count();
		const pourcents = texte.match(/\d+\s?%/g) ?? [];
		if (barre === 0) return D('le tableau de bord du domaine ne porte aucune barre de fraîcheur');
		return F(
			`tableau de bord rendu : ${barre} élément de fraîcheur, ${pourcents.length} pourcentage(s) affiché(s)`
		);
	},

	'pu04-filtrer': async (ctx) => {
		const { univers, domaine } = ctx.ancres.domaineDense;
		const sans = await aller(ctx, `/univers/${univers}/${domaine}/notes`);
		if (sans.status !== 200) return D(`GET …/notes → ${sans.status}`);
		const texteSans = await texteVisible(ctx.page);
		const avec = await aller(
			ctx,
			`/univers/${univers}/${domaine}/notes?fraicheur=obsolete&tri=consultations`
		);
		const texteAvec = await texteVisible(ctx.page);
		if (texteSans !== texteAvec) {
			return F('le filtre de fraîcheur et le tri par consultations changent la liste');
		}
		return N(
			'route-absente',
			`?fraicheur=obsolete&tri=consultations → ${avec.status}, liste inchangée (${texteAvec.length} caractères identiques) : la route n’honore ni le filtre ni le tri`
		);
	},

	'pu04-trous': async (ctx) => {
		const o = await aller(ctx, '/console/analytique');
		if (o.status === 200) {
			const texte = await texteVisible(ctx.page);
			const trous = /trou|sans résultat|lacune/i.test(texte);
			return trous
				? F('les trous documentaires sont rendus')
				: D('la page de pilotage s’ouvre, aucun trou documentaire n’y est nommé');
		}
		return N(
			'droit-du-persona',
			`GET /console/analytique → ${o.status} pour le référent : le pilotage documentaire est sous rôle administrateur (docs/routes.md §3.7)`
		);
	},

	/* ───────────────────────────── PU-05 ───────────────────────────── */

	'pu05-console': async (ctx) => {
		const o = await aller(ctx, '/console/imports');
		ctx.jalons.ouverture = o;
		if (o.status !== 200) return D(`GET /console/imports → ${o.status} pour l’administrateur`);
		const texte = await texteVisible(ctx.page);
		return /import/i.test(texte)
			? F('la console s’ouvre sur l’onglet Imports')
			: D('la console s’ouvre mais ne nomme pas les imports');
	},

	'pu05-deposer': async (ctx) => {
		const o = await aller(ctx, '/importer');
		if (o.status !== 200) return D(`GET /importer → ${o.status}`);
		const champFichier = await ctx.page.locator('input[type="file"]').count();
		/* LE DÉPÔT PASSE PAR L'ACTION SERVEUR : le gel de V-24 n'a aucun champ de
		   fichier (le lot qui a écrit l'action le déclare), donc aucune
		   soumission de navigateur ne peut l'atteindre. */
		const domaine = String(ctx.ancres.domaineDense.nom);
		const avant = (await interroger('select id from notes')).map((l) => l.id);
		const reponse = await demander(ctx, '/importer?/importer', {
			methode: 'POST',
			entetes: { origin: BASE_HTTP },
			multipart: {
				'domaine-cible': domaine,
				fichiers: {
					name: 'parcours-t054/procedure-de-mesure.md',
					mimeType: 'text/markdown',
					buffer: Buffer.from('# Procédure de mesure\n\nLot T-054, parcours PU-05.\n')
				}
			}
		});
		ctx.journal.requetesEcriture += 1;
		const creees = await interroger(
			'select id, identifiant, titre from notes where id <> all($1::uuid[])',
			[avant]
		);
		ctx.faits.import = reponse;
		ctx.faits.creees = creees;
		if (reponse.status >= 400) {
			return D(`POST /importer?/importer → ${reponse.status} : ${reponse.corps.slice(0, 200)}`);
		}
		if (creees.length === 0) {
			return D(
				`POST /importer?/importer → ${reponse.status} et aucune note créée dans « ${domaine} »`
			);
		}
		return F(
			`dépôt joué par l’action serveur (${champFichier} champ de fichier dans le gel de V-24) → ${reponse.status}, ${creees.length} note(s) créée(s) dans « ${domaine} »`
		);
	},

	'pu05-apercu': async (ctx) => {
		/* L'APERÇU EST CE QUE LA PAGE MONTRE APRÈS LE DÉPÔT — pas ce que la base
		   contient. La réponse de l'action est la page réémise : on y cherche le
		   chemin du fichier déposé, qui est la seule marque que l'arborescence
		   détectée a été rendue. */
		const reponse = ctx.faits.import;
		if (reponse === undefined) return D('aucune réponse d’import à lire');
		const charge = reponse.corps;
		const chemin = /procedure-de-mesure\.md/.test(charge);
		const lot = /parcours-t054/.test(charge);
		if (!chemin && !lot) {
			return N(
				'comportement-non-cable',
				`la page réémise après le dépôt (${charge.length} octets) ne porte ni le chemin du fichier déposé ni le nom du lot : l’aperçu de V-24 n’est alimenté par aucun chemin de rendu`
			);
		}
		return F(`l’aperçu porte l’arborescence détectée (${charge.length} octets)`);
	},

	'pu05-progression': async () =>
		N(
			'comportement-non-cable',
			'la progression en temps réel est un comportement : aucun canal de progression n’existe (ARB-011, temps 3)'
		),

	'pu05-rapport': async (ctx) => {
		const reponse = ctx.faits.import;
		const creees = ctx.faits.creees ?? [];
		if (reponse === undefined) return D('aucune réponse d’import à lire');
		ctx.faits.noteImportee = creees[0]?.identifiant ?? null;
		const rendu = creees.some((n) => reponse.corps.includes(String(n.identifiant)));
		if (creees.length === 0) {
			return D(
				`la réponse d’import est ${reponse.status} et aucune note n’a été créée (${reponse.corps.length} octets)`
			);
		}
		return rendu
			? F(`le rapport nomme les ${creees.length} note(s) créée(s)`)
			: N(
					'comportement-non-cable',
					`${creees.length} note(s) créée(s) en base (${creees.map((n) => n.identifiant).join(', ')}), et la page réémise ne les nomme pas : le rapport final de V-24 n’est alimenté par aucun chemin de rendu`
				);
	},

	'pu05-domaine-cree': async (ctx) => {
		const { univers, domaine } = ctx.ancres.domaineDense;
		const o = await aller(ctx, `/univers/${univers}/${domaine}`);
		const importee = ctx.faits.noteImportee;
		if (importee === null || importee === undefined) {
			return N(
				'action-absente',
				`aucune note importée à retrouver ; et « 1 domaine créé » n’a de toute façon pas de porte : l’action d’import exige un domaine cible EXISTANT — elle refuse en 400 « domaine-inconnu » sinon`
			);
		}
		const note = await aller(ctx, `/notes/${importee}`);
		const dansLArborescence = (await texteDuDocument(ctx.page)).includes(String(importee));
		/* « LES NOTES SONT TROUVABLES » — la seule façon honnête de le mesurer est
		   de le demander au produit. L'index est interrogé par la route ; ce que
		   l'écran rend est un autre sujet (voir PU-01.3). */
		const index = await empreinteDeLIndex();
		return o.status === 200 && note.status === 200
			? N(
					'action-absente',
					`le domaine s’ouvre (${o.status}) et la note importée s’ouvre (${note.status}, citée dans l’arborescence : ${dansLArborescence}) ; l’index porte ${index.split(':')[0]} entrées. Mais « 1 DOMAINE CRÉÉ » n’a pas de porte : l’import écrit dans un domaine existant, il n’en crée aucun`
				)
			: D(`domaine ${o.status}, note importée ${note.status}`);
	},

	/* ───────────────────────────── PU-06 ───────────────────────────── */

	'pu06-incident': async () =>
		H('« un incident survient sur un serveur » ne décrit aucun geste dans le produit'),

	'pu06-cartographie': async (ctx) => {
		/* LE PARAMÈTRE EST CELUI QUE LA SOURCE ATTESTE : `docs/routes.md` §4.3 —
		   `?perimetre=` et `?noeud=` (ARB-007), pour `RG-M09-05` « l'état de
		   cartographie est une adresse partageable ». Mesurer un `?domaine=` que
		   nulle source n'écrit serait mesurer une invention de l'instrument. */
		const { domaine } = ctx.ancres.domaineDense;
		const sans = await aller(ctx, '/cartographie');
		ctx.jalons.ouverture = sans;
		if (sans.status !== 200) return D(`GET /cartographie → ${sans.status}`);
		const texteSans = await texteDuDocument(ctx.page);
		const avec = await aller(ctx, `/cartographie?perimetre=${domaine}`);
		const texteAvec = await texteDuDocument(ctx.page);
		if (texteSans !== texteAvec) return F(`?perimetre=${domaine} change la cartographie`);
		return N(
			'parametre-ignore',
			`?perimetre=${domaine} → ${avec.status}, document inchangé (${texteAvec.length} caractères identiques) : le paramètre de RG-M09-05 est ignoré, jamais refusé`
		);
	},

	'pu06-focus': async (ctx) => {
		const noeuds = ctx.page.locator('[data-noeud], .noeud, g.noeud');
		const nombre = await noeuds.count();
		if (nombre === 0) return D('aucun nœud cliquable dans la cartographie');
		const avant = await texteVisible(ctx.page);
		await noeuds
			.first()
			.click({ timeout: 5000 })
			.catch(() => {});
		await ctx.page.waitForTimeout(400);
		const apres = await texteVisible(ctx.page);
		const estompe = await ctx.page.locator('[class*="estomp"], [data-estompe]').count();
		if (avant !== apres || estompe > 0) {
			return F(`le clic pose le focus (${estompe} élément estompé)`);
		}
		return N(
			'comportement-non-cable',
			`${nombre} nœuds rendus, le clic ne change rien (${estompe} élément estompé) : le focus du graphe est un comportement (ARB-011)`
		);
	},

	'pu06-detail': async (ctx) => {
		/* LA MESURE PORTE SUR `#detail`, ET SUR RIEN D'AUTRE. Le premier jet
		   cherchait « héberge » dans la page entière et rendait un VERT FAUX : le
		   mot est dans la légende du graphe et dans la restitution textuelle des
		   nœuds. Le panneau de détail est nommé par la maquette (`aside#detail`,
		   « Détail du nœud sélectionné ») : c'est lui que l'étape décrit. */
		const o = await aller(ctx, `/cartographie?noeud=${ctx.ancres.serveur.identifiant}`);
		if (o.status !== 200) return D(`?noeud={serveur} → ${o.status}`);
		const panneau = ctx.page.locator('#detail');
		const texte = ((await panneau.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ');
		const relations = await interroger(
			`select t.identifiant as type, count(*)::int as n from relations r
			   join types_de_relation t on t.id = r.type_de_relation_id
			   join notes n on n.id = r.source_id
			  where n.identifiant = $1 group by t.identifiant order by t.identifiant`,
			[ctx.ancres.serveur.identifiant]
		);
		const nommees = relations.filter((r) => texte.toLowerCase().includes(String(r.type)));
		if (nommees.length === 0) {
			return N(
				'parametre-ignore',
				`le panneau #detail porte « ${texte.slice(0, 80)} » ; la base porte ${relations.map((r) => `${r.type} → ${r.n}`).join(', ')} pour ${ctx.ancres.serveur.identifiant}, et ?noeud= est ignoré (le chargeur le déclare)`
			);
		}
		return F(
			`le panneau #detail nomme ${nommees.length} type(s) de relation ; ${relations.map((r) => `${r.type} → ${r.n}`).join(', ')} en base`
		);
	},

	'pu06-articulation': async (ctx) => {
		const texte = await texteDuDocument(ctx.page);
		const halo = await ctx.page.locator('[class*="articul"], [data-articulation]').count();
		if (halo > 0 || /articulation/i.test(texte)) {
			return F(`le point d’articulation est signalé (${halo} marque)`);
		}
		return N(
			'gel',
			`aucun halo ni mention de point d’articulation dans la page ; le calcul EXISTE (src/lib/graphe/cartographie.ts, ensemble des points d’articulation) mais aucune vue ne le rend`
		);
	},

	'pu06-impactees': async (ctx) => {
		const impactees = await interroger(
			`select n.identifiant from relations r
			   join types_de_relation t on t.id = r.type_de_relation_id
			   join notes s on s.id = r.source_id
			   join notes n on n.id = r.cible_id
			  where t.identifiant = 'heberge' and s.identifiant = $1
			  order by n.identifiant`,
			[ctx.ancres.serveur.identifiant]
		);
		if (impactees.length === 0) return D('aucune note impactée dans la base : rien à ouvrir');
		const ouvertes = [];
		for (const note of impactees) {
			const o = await aller(ctx, `/notes/${note.identifiant}`);
			if (o.status === 200) ouvertes.push(note.identifiant);
		}
		if (ouvertes.length < impactees.length) {
			return D(`${ouvertes.length}/${impactees.length} applications impactées s’ouvrent`);
		}
		if (!(await dependanceAuContenu(ctx))) {
			return N(
				'gel',
				`les ${ouvertes.length} applications impactées s’ouvrent en 200, mais la lecture d’une note rend la transcription gelée : leurs contacts et procédures de reprise ne sont pas ceux des fiches ouvertes (voir PU-01.5)`
			);
		}
		return F(`les ${ouvertes.length} applications impactées s’ouvrent et portent leurs fiches`);
	}
};

/* ═══════════════════════════════════════════════════════════════════════════
   7. LES PRÉCONDITIONS, ET LEUR RÉTABLISSEMENT MESURÉ (`P-28`)

   Un parcours a besoin d'un état : un mot de passe pour se connecter, un droit
   pour lire. Cet état est POSÉ par la batterie, DÉCLARÉ au rapport, et RETIRÉ
   après — puis l'empreinte est reprise et comparée.

   Le corpus semé ne porte AUCUN droit explicite de dossier (mesuré : 0 ligne) :
   sans précondition, un contributeur ne lit rien, et cinq parcours sur six
   seraient « non couverts » pour une raison qui n'est pas celle du produit.
   Poser le droit est donc la seule façon de mesurer ce que le parcours
   prétend ; ne pas le poser est ce que la sonde d'état fait.
   ═════════════════════════════════════════════════════════════════════════ */

const DROITS = {
	'PU-01': 'gestionnaire',
	'PU-02': 'redacteur',
	'PU-03': null,
	'PU-04': 'gestionnaire',
	'PU-05': 'gestionnaire',
	'PU-06': 'lecteur'
};

/**
 * LE TERRAIN EST DÉBLAYÉ AVANT D'ÊTRE MESURÉ, ET LE DÉBLAIEMENT N'EST PAS DANS
 * LA MESURE.
 *
 * La base est partagée entre les copies de travail de la vague : une exécution
 * interrompue — la sienne ou celle d'une voisine — laisse des droits sur le
 * compte d'un persona, et l'insertion des préconditions échoue alors sur la clé
 * (dossier, compte). Mesuré une fois, en pleine sonde.
 *
 * Ce nettoyage a lieu AVANT l'empreinte d'état : sinon la suppression d'une
 * ligne préexistante apparaîtrait comme une altération du corpus, et la
 * batterie refuserait de mesurer à cause de son propre ménage — mesuré aussi.
 * Ce qui est retiré est COMPTÉ et remonté au rapport : un droit préexistant est
 * une contamination, il ne doit pas passer inaperçu.
 */
async function nettoyerLesRestes(parcours) {
	if (parcours.persona === 'anonyme') return { compte: null, retires: 0 };
	const [compte] = await interroger('select id from comptes where identifiant = $1', [
		parcours.persona
	]);
	if (compte === undefined) return { compte: null, retires: 0 };
	const retires = await interroger(
		'delete from droits_de_dossier where compte_id = $1 returning dossier_id',
		[compte.id]
	);
	/* LES SESSIONS D'UN VOISIN NE SONT PAS EFFACÉES ICI : elles ne gênent pas la
	   pose des préconditions, et les fermer casserait sa mesure. Seuls les droits
	   le gênent — la clé (dossier, compte) est unique. */
	return { compte: compte.id, retires: retires.length };
}

async function poserLesPreconditions(parcours, { avecDroit = true } = {}) {
	const pose = {
		persona: parcours.persona,
		droit: null,
		session: null,
		compte: null,
		restes: null,
		droitsAttendus: 0
	};
	if (parcours.persona === 'anonyme') return pose;
	const [compte] = await interroger('select id, role from comptes where identifiant = $1', [
		parcours.persona
	]);
	if (compte === undefined) {
		refusDeMesurer.push(`le compte « ${parcours.persona} » n’est pas dans la base semée`);
		return pose;
	}
	await interroger('update comptes set condensat_mot_de_passe = $1 where id = $2', [
		condensat,
		compte.id
	]);
	const droit = DROITS[parcours.id];
	if (droit !== null && avecDroit) {
		const racines = await interroger('select id from dossiers where parent_id is null order by id');
		for (const r of racines) {
			await interroger(
				'insert into droits_de_dossier (dossier_id, compte_id, droit) values ($1, $2, $3)',
				[r.id, compte.id, droit]
			);
		}
		pose.droit = `${droit} sur ${racines.length} dossiers racines`;
		pose.droitsAttendus = racines.length;
	} else if (droit !== null) {
		pose.droit = 'AUCUN — sonde d’état';
	}
	const session = await ouvrirUneSession(parcours.persona);
	if (session.jeton === null) {
		/* `429` A UNE CAUSE CONNUE ET ELLE N'EST PAS DANS LE PRODUIT : le
		   ralentissement d'`RG-M16-01` compte les tentatives PAR ORIGINE, et
		   toutes les copies de travail partagent l'origine `127.0.0.1` et la base.
		   Mesuré : 144 tentatives d'un lot voisin en un passage. La batterie le
		   dit au lieu de rendre un parcours anonyme déguisé en parcours connecté. */
		refusDeMesurer.push(
			session.status === 429
				? `POST /connexion pour « ${parcours.persona} » rend 429 : le ralentissement de RG-M16-01 est armé sur l’origine 127.0.0.1, que les copies de travail partagent avec la base. Rejouer quand la base est au repos.`
				: `POST /connexion pour « ${parcours.persona} » rend ${session.status} sans cookie de session`
		);
	}
	pose.session = session;
	pose.compte = compte.id;
	return pose;
}

/**
 * LES PRÉCONDITIONS TIENNENT-ELLES ENCORE ? — la question qu'il a fallu poser.
 *
 * Mesuré, et deux fois : un parcours a rendu trois défauts et cinq non-couverts
 * parce que ses droits et sa session avaient DISPARU en cours de route — une
 * copie de travail voisine avait vidé la base partagée. Le rapport était
 * plausible, détaillé, et faux de bout en bout.
 *
 * C'est `P-28` retourné : ce n'est pas ce parcours qui contamine le suivant,
 * c'est un tiers qui le contamine lui. La parade est la même — mesurer plutôt
 * que supposer : ce qui a été posé est RELU à la fin, et son absence est un
 * REFUS DE MESURER, jamais un défaut du produit.
 */
async function preconditionsTenues(pose, portee) {
	if (pose.compte === null) return null;
	/* CHAQUE COMPTE EST ATTRIBUÉ : les droits par la fenêtre du parcours, la
	   session par le condensat de SON jeton, le mot de passe par le sien. Une
	   copie voisine qui travaillerait sur le même persona n'entre dans aucun. */
	const [droits] = await interroger(
		'select count(*)::int as n from droits_de_dossier where compte_id = $1 and cree_le >= $2',
		[pose.compte, portee.debut]
	);
	const [sessions] = await interroger(
		`select count(*)::int as n from sessions
		  where condensat_jeton = any($1::text[]) and fermee_le is null`,
		[portee.jetons]
	);
	const [mot] = await interroger(
		'select count(*)::int as n from comptes where id = $1 and condensat_mot_de_passe = any($2::text[])',
		[pose.compte, portee.condensats]
	);
	const manques = [];
	if (droits.n !== pose.droitsAttendus) {
		manques.push(`${droits.n} droit(s) au lieu des ${pose.droitsAttendus} posés`);
	}
	if (sessions.n === 0) manques.push('la session ouverte a disparu');
	if (mot.n === 0) manques.push('le mot de passe posé a disparu');
	return manques.length === 0 ? null : manques.join(', ');
}

/**
 * LE RÉTABLISSEMENT. Il ne fait pas confiance à ce que le parcours croit avoir
 * touché : il remet la base dans l'état que le corpus semé décrit, et l'index
 * avec. La preuve du rétablissement n'est pas ici, elle est dans la comparaison
 * des empreintes.
 */
async function retablir(portee, marqueurs) {
	const comptes = portee.comptes.length > 0 ? portee.comptes : [null];
	const fenetre = [portee.debut, portee.fin];
	/* CHAQUE SUPPRESSION EST BORNÉE PAR LA FENÊTRE DU PARCOURS, et ce n'est pas
	   une précaution de style : la base est partagée par les copies de travail
	   de la vague. Un `delete from sessions` nu fermerait les sessions du lot
	   voisin en pleine mesure — la contamination que `P-28` interdit, dans
	   l'autre sens. Mesuré : 39 tentatives de connexion d'un voisin effacées par
	   la première rédaction, et un faux résidu rendu par la seconde. */
	await interroger('delete from sessions where condensat_jeton = any($1::text[])', [portee.jetons]);
	await interroger('delete from tentatives_de_connexion where le between $1 and $2', fenetre);
	await interroger(
		`delete from droits_de_dossier
		  where compte_id = any($1::uuid[]) and cree_le between $2 and $3`,
		[comptes, ...fenetre]
	);
	/* LE MOT DE PASSE N'EST RETIRÉ QUE S'IL EST ENCORE LE NÔTRE : un voisin qui
	   en aurait posé un depuis garderait le sien. */
	await interroger(
		'update comptes set condensat_mot_de_passe = null where condensat_mot_de_passe = any($1::text[])',
		[portee.condensats]
	);
	await interroger('delete from versions where cree_le between $1 and $2', fenetre);
	await interroger(
		`delete from etiquettes_de_note where note_id in
		   (select id from notes where cree_le between $1 and $2 and id <> all($3::uuid[]))`,
		[...fenetre, marqueurs.notes]
	);
	await interroger('delete from notes where cree_le between $1 and $2 and id <> all($3::uuid[])', [
		...fenetre,
		marqueurs.notes
	]);
	await interroger(
		'delete from dossiers where cree_le between $1 and $2 and id <> all($3::uuid[])',
		[...fenetre, marqueurs.dossiers]
	);
	await interroger(
		'delete from etiquettes where cree_le between $1 and $2 and id <> all($3::uuid[])',
		[...fenetre, marqueurs.etiquettes]
	);
	if (marqueurs.verifications.length > 0) {
		await interroger('delete from verifications where id <> all($1::uuid[])', [
			marqueurs.verifications
		]);
	}
	/* LES NOTES RÉÉCRITES REDEVIENNENT CELLES DU CORPUS — et SEULEMENT elles.
	   Réécrire les trente-deux lignes sans regarder écraserait le travail d'un
	   voisin ; on ne remet que celles dont la ligne a changé. */
	const actuelles = new Map(
		(await interroger('select id, md5(t::text) as somme from notes t')).map((l) => [
			String(l.id),
			String(l.somme)
		])
	);
	const remises = [];
	for (const note of marqueurs.contenus) {
		if (actuelles.get(String(note.id)) === note.somme) continue;
		remises.push(note.identifiant ?? note.id);
		await interroger(
			`update notes set corps_reference = $2, corps_operationnel = $3, modifie_le = $4,
			     corps_reference_modifie_le = $5, corps_operationnel_modifie_le = $6,
			     verifie_le = $7, revision_demandee = $8, revision_commentaire = $9,
			     revision_par_id = $10, revision_le = $11, titre = $12, statut = $13
			   where id = $1`,
			[
				note.id,
				note.corps_reference,
				note.corps_operationnel,
				note.modifie_le,
				note.corps_reference_modifie_le,
				note.corps_operationnel_modifie_le,
				note.verifie_le,
				note.revision_demandee,
				note.revision_commentaire,
				note.revision_par_id,
				note.revision_le,
				note.titre,
				note.statut
			]
		);
	}
	/* L'INDEX SE RECONSTRUIT DEPUIS LA BASE — il n'y a pas d'autre façon de le
	   rétablir, et c'est justement la propriété qu'`ADR-006` lui donne :
	   « l'index est reconstructible ». Il n'est reconstruit que si une écriture
	   a eu lieu : une réindexation gratuite coûte dix secondes par parcours. */
	if (remises.length > 0 || portee.ecritures > 0) {
		const r = spawnSync(process.execPath, ['recherche/recherche.mjs', 'reindexer'], {
			cwd: racine,
			encoding: 'utf8'
		});
		if (r.status !== 0) {
			refusDeMesurer.push(
				`la réindexation de rétablissement a échoué :\n${String(r.stderr).slice(-400)}`
			);
		}
	}
	return remises;
}

/** Ce que la base portait avant le parcours, pour pouvoir l'y remettre. */
async function marqueursDeLEtat() {
	return {
		notes: (await interroger('select id from notes')).map((l) => l.id),
		dossiers: (await interroger('select id from dossiers')).map((l) => l.id),
		etiquettes: (await interroger('select id from etiquettes')).map((l) => l.id),
		verifications: (await interroger('select id from verifications')).map((l) => l.id),
		contenus: await interroger(
			`select id, identifiant, md5(t::text) as somme, corps_reference, corps_operationnel,
			        modifie_le, corps_reference_modifie_le, corps_operationnel_modifie_le, verifie_le,
			        revision_demandee, revision_commentaire, revision_par_id, revision_le, titre,
			        statut from notes t`
		)
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. LE PILOTE
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {{parcours: string, rang: number, ligne: number, issue: string, cause: string|null, preuve: string}[]} */
let releve = [];
/** @type {{parcours: string, verdict: string, detail: string}[]} */
let criteres = [];
/** @type {{parcours: string, table: string, avant: string, apres: string}[]} */
let ecartsDEtat = [];
/** @type {string|null} */
let condensat = null;

/**
 * @param {object} parcours
 * @param {{mutation: string|null}} options
 */
async function jouer(navigateur, parcours, options = { mutation: null }) {
	const tables = await tablesDuSchema();
	const avecId = await tablesAvecId();
	const restes = await nettoyerLesRestes(parcours);
	const empreinteAvant = await empreinteDeLEtat(tables, avecId);
	const marqueurs = await marqueursDeLEtat();
	/* LA FENÊTRE OUVRE APRÈS L'EMPREINTE, ET L'ORDRE EST TOUT.
	   Prise AVANT, la fenêtre englobait les lignes qu'une copie voisine écrivait
	   pendant la lecture de l'empreinte : elles y entraient ET tombaient sous le
	   rétablissement scopé par le temps, qui les supprimait. Mesuré : 39
	   tentatives de connexion d'un voisin effacées, et une ligne « disparue »
	   imputée au corpus. Après l'empreinte, tout ce qu'elle contient est
	   antérieur à la fenêtre, donc hors de portée du rétablissement. */
	const [{ maintenant }] = await interroger('select now() as maintenant');
	const portee = {
		debut: maintenant,
		fin: maintenant,
		comptes: [],
		/* Les condensats des jetons de session que CETTE batterie a fait émettre,
		   et les condensats de mot de passe qu'elle a posés. Ce sont les deux
		   seules attributions exactes dont elle dispose sur une base partagée. */
		jetons: ['aucun'],
		condensats: ['aucun'],
		ecritures: 0
	};
	const pose = await poserLesPreconditions(parcours, {
		avecDroit: options.mutation !== 'droit-retire'
	});
	if (pose.compte !== null) portee.comptes.push(pose.compte);
	if (pose.session?.jeton) portee.jetons.push(condensatDeJeton(pose.session.jeton));
	if (condensat !== null) portee.condensats.push(condensat);
	if (restes.retires > 0) {
		pose.restes = `${restes.retires} droit(s) préexistant(s) retiré(s) AVANT l’empreinte — une autre exécution en avait laissé`;
	}
	if (options.mutation === 'droit-retire') touchesDeLaSonde += 1;

	const contexte = await navigateur.newContext({ baseURL: BASE_HTTP });
	if (pose.session?.jeton) {
		await contexte.addCookies([
			{
				name: 'codicillus_session',
				value: pose.session.jeton,
				domain: '127.0.0.1',
				path: '/',
				httpOnly: true,
				sameSite: 'Lax'
			}
		]);
	}
	const page = await contexte.newPage();
	page.setDefaultTimeout(15_000);

	if (options.mutation === 'produit-ralenti') {
		/* LA CONFIGURATION DU CANDIDAT TEL QU'IL EST OBSERVÉ : chaque document
		   servi est retenu. Le produit répond réellement plus tard, et la part du
		   produit s'en trouve réellement plus longue. */
		await page.route('**/*', async (route) => {
			if (route.request().resourceType() === 'document') {
				touchesDeLaSonde += 1;
				await new Promise((r) => setTimeout(r, RETARD_DE_SONDE));
			}
			await route.continue();
		});
	}
	if (options.mutation === 'etape-brisee') {
		/* L'OBSERVATION : un identifiant de note interne est glissé dans la page
		   publique. Le critère d'étanchéité de PU-03 DOIT le voir. */
		const marque = ancres.marquesInternes[0];
		await page.route('**/recherche*', async (route) => {
			/* SEUL LE DOCUMENT EST TOUCHÉ, et la marque est glissée DANS le corps.
			   Le premier jet ajoutait la marque après la balise fermante et
			   interceptait aussi la charge de données de la navigation cliente :
			   la mutation touchait, et rien n'en sortait — une sonde qui compte
			   une touche sans effet est exactement ce que `P-26` interdit. */
			if (route.request().resourceType() !== 'document') {
				await route.continue();
				return;
			}
			const reponse = await route.fetch();
			const corps = await reponse.text();
			const mute = corps.includes('</body>')
				? corps.replace('</body>', `<p hidden>${marque}</p></body>`)
				: `${corps}<p hidden>${marque}</p>`;
			if (mute !== corps) touchesDeLaSonde += 1;
			await route.fulfill({ response: reponse, body: mute });
		});
	}

	const ctx = {
		page,
		contexte,
		journal: nouveauJournal(),
		jalons: {},
		faits: {},
		ancres
	};

	const issues = [];
	for (const etape of parcours.etapes) {
		const mesure = MESURES[etape.mesure];
		if (mesure === undefined) {
			refusDeMesurer.push(`aucune mesure pour « ${etape.mesure} » (${parcours.id}.${etape.rang})`);
			continue;
		}
		let resultat;
		try {
			resultat = await mesure(ctx);
		} catch (cause) {
			resultat = D(`la mesure a levé : ${String(cause).slice(0, 300)}`);
		}
		if (resultat.cause !== null && !Object.hasOwn(CAUSES, resultat.cause)) {
			refusDeMesurer.push(
				`cause « ${resultat.cause} » hors de la liste close (${parcours.id}.${etape.rang})`
			);
		}
		issues.push({
			parcours: parcours.id,
			rang: etape.rang,
			ligne: etape.ligne,
			phrase: etape.phrase,
			issue: resultat.issue,
			cause: resultat.cause,
			preuve: resultat.preuve
		});
	}

	/* LE CRITÈRE. */
	let critere = null;
	if (parcours.critere?.genre === 'duree') {
		const verdict = verdictDeBudget({
			budgetMs: parcours.critere.budgetMs,
			partDuProduitMs: ctx.journal.partDuProduitMs,
			mesuree: true
		});
		critere = {
			parcours: parcours.id,
			verdict: verdict.verdict,
			detail: `part du produit ${Math.round(ctx.journal.partDuProduitMs)} ms sur un budget de ${parcours.critere.budgetMs} ms (marge ${Math.round(verdict.marge)} ms) — la part humaine n’est pas instrumentable`
		};
	} else if (parcours.critere?.genre === 'etancheite') {
		/* « À AUCUN MOMENT » — LA BORNE DU CRITÈRE EST TENUE, PAS SEULEMENT ÉCRITE.
		   Le critère de PU-03 porte sur « toute réponse reçue pendant le parcours,
		   Y COMPRIS PAR ADRESSE CONSTRUITE ». Les cinq étapes ne visitent que ce
		   que le parcours décrit ; les adresses ci-dessous sont composées à la
		   main, à partir du corpus, et demandées SANS session — c'est ce que fait
		   un lecteur externe curieux. Elles entrent au journal, donc au critère.
		   La matrice exhaustive, elle, reste la batterie 6. */
		for (const chemin of [
			`/notes/${ancres.procedure.identifiant}`,
			`/notes/${ancres.autreInterne.identifiant}`,
			`/univers/${ancres.domaineDense.univers}/${ancres.domaineDense.domaine}`,
			`/univers/${ancres.domaineDense.univers}/${ancres.domaineDense.domaine}/notes`,
			'/console/comptes'
		]) {
			await demander(ctx, chemin, { compter: false });
		}
		const verdict = verdictDEtancheite({
			reponses: ctx.journal.reponses,
			marquesInternes: ancres.marquesInternes
		});
		critere = {
			parcours: parcours.id,
			verdict: verdict.verdict,
			detail:
				verdict.fuites.length === 0
					? `${ctx.journal.reponses.length} réponses relevées, aucune marque de contenu interne (${ancres.marquesInternes.length} marques cherchées)`
					: `${verdict.fuites.length} fuite(s) : ${verdict.fuites
							.slice(0, 4)
							.map((f) => `${f.marque} dans ${f.chemin}`)
							.join(' · ')}`
		};
	}

	const perdues = await preconditionsTenues(pose, portee);
	if (perdues !== null) {
		refusDeMesurer.push(
			`${parcours.id} — les préconditions n’ont pas tenu pendant la mesure (${perdues}). ` +
				'La base est partagée entre les copies de travail : une autre l’a vidée ou remigrée. ' +
				'Les étapes de ce parcours ne sont pas opposables — rejouer quand la base est au repos.'
		);
	}
	await contexte.close();
	portee.ecritures = ctx.journal.requetesEcriture;
	/* LA FENÊTRE SE FERME ICI, avant toute lecture de résidu : ce qu'une copie
	   voisine écrira après cet instant ne sera pas compté comme nôtre. */
	const [{ fin }] = await interroger('select now() as fin');
	portee.fin = fin;
	const residus = await residusDuParcours(portee, marqueurs);
	const notesRemises = await retablir(portee, marqueurs);
	const residusApres = await residusDuParcours(portee, marqueurs);
	const empreinteApres = await empreinteDeLEtat(tables, avecId);
	/* LES LIGNES QUE LE PARCOURS A LUI-MÊME REMISES NE SONT PAS DES ALTÉRATIONS :
	   leur condensat est revenu à celui de l'empreinte, sinon elles seraient
	   comptées ici — et c'est bien ce qu'on veut. */
	const alterations = comparerEmpreintes(empreinteAvant, empreinteApres);
	const etat = verdictDEtat({ residus: residusApres, alterations, notesRemises });
	for (const r of etat.refus) refusDeMesurer.push(`${parcours.id} — ${r}`);
	const ecarts = etat.defauts.map((d) => ({
		parcours: parcours.id,
		table: d.quoi,
		avant: '0',
		apres: String(d.combien)
	}));

	return {
		issues,
		critere,
		ecarts,
		pose,
		journal: ctx.journal,
		trace: { residusAvantRetablissement: residus, notesRemises }
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. LE RAPPORT
   ═════════════════════════════════════════════════════════════════════════ */

function bilanDe(issues, criteresLus, ecarts) {
	return {
		franchies: issues.filter((i) => i.issue === 'franchie').length,
		horsProduit: issues.filter((i) => i.issue === 'hors-produit').length,
		defauts: issues.filter((i) => i.issue === 'defaut'),
		nonCouverts: issues.filter((i) => i.issue === 'non-couvert'),
		criteresInfirmes: criteresLus.filter((c) => c.verdict === 'infirme'),
		criteresAbsents: PARCOURS.filter((p) => p.critere === null).length,
		ecartsDEtat: ecarts,
		refus: refusDeMesurer
	};
}

function imprimer(lignes) {
	console.log(lignes.join('\n'));
}

const ancres = await ancresDuCorpus();
condensat = refusDeMesurer.length === 0 ? await condensatDuMotDePasse() : null;
const servi = refusDeMesurer.length === 0 ? await servirLeProduit() : false;

let code = 2;
try {
	if (servi) {
		const navigateur = await chromium.launch();
		try {
			const choisis = PARCOURS.filter((p) => unSeul === undefined || p.id === unSeul);
			if (choisis.length === 0) {
				refusDeMesurer.push(`aucun parcours ne s’appelle « ${unSeul} »`);
			}
			const cibleDeLaSonde = sonde === undefined ? null : CIBLES_DE_SONDE[sonde];
			const aJouer =
				sonde === undefined || sonde === 'temoin-inerte'
					? choisis
					: choisis.filter((p) => p.id === cibleDeLaSonde.parcours);

			/** Les deux passes sous sonde : référence puis mutée. */
			const passes =
				sonde === undefined || sonde === 'temoin-inerte' ? ['reference'] : ['reference', 'mutee'];
			/** @type {Record<string, {issues: unknown[], criteres: unknown[]}>} */
			const resultats = {};
			for (const passe of passes) {
				const issues = [];
				const lus = [];
				const ecarts = [];
				const lignes = [];
				for (const parcours of aJouer) {
					const r = await jouer(navigateur, parcours, {
						mutation: passe === 'mutee' ? sonde : null
					});
					issues.push(...r.issues);
					if (r.critere !== null) lus.push(r.critere);
					ecarts.push(...r.ecarts);
					lignes.push(
						`  ${parcours.id} — ${parcours.titre}` +
							`\n    persona ${parcours.persona}` +
							`${r.pose.droit === null ? '' : `, droit posé : ${r.pose.droit}`}` +
							`${r.pose.restes === null ? '' : `, ${r.pose.restes}`}` +
							`${r.pose.session === null ? '' : `, session ouverte par le produit (${r.pose.session.status})`}` +
							`\n    ${r.journal.reponses.length} réponses, ${Math.round(r.journal.partDuProduitMs)} ms de produit, ${r.journal.requetesEcriture} écriture(s) par action serveur` +
							`\n    état écrit puis rétabli (P-28) : ${r.trace.residusAvantRetablissement.map((x) => `${x.quoi} ${x.combien}`).join(', ') || 'rien'}` +
							`${r.trace.notesRemises.length === 0 ? '' : ` ; notes remises : ${r.trace.notesRemises.join(', ')}`}`
					);
					for (const i of r.issues) {
						const marque =
							i.issue === 'franchie'
								? '✓'
								: i.issue === 'defaut'
									? '✗'
									: i.issue === 'hors-produit'
										? '·'
										: '○';
						lignes.push(
							`    ${marque} ${i.parcours}.${i.rang} (cahier l. ${i.ligne}) ${i.issue}${i.cause === null ? '' : ` — ${i.cause}`}`
						);
						if (detail || i.issue !== 'franchie') {
							/* LA PHRASE DU CAHIER EST RÉIMPRIMÉE À CÔTÉ DE LA MESURE. Un
							   rapport qui ne dit pas ce qu'il jugeait laisse son lecteur
							   juger sur un numéro de ligne (`P-21`). */
							lignes.push(`        « ${i.phrase} »`);
							lignes.push(`        ${i.preuve}`);
						}
					}
					if (r.critere !== null) {
						lignes.push(`    critère : ${r.critere.verdict} — ${r.critere.detail}`);
					} else {
						lignes.push(
							`    critère : AUCUN CHIFFRE AU CAHIER — ${parcours.id} n’en porte pas (compté, non comblé)`
						);
					}
					for (const e of r.ecarts) {
						lignes.push(
							`    ÉTAT NON RÉTABLI — ${e.table} : ${e.apres} ligne(s) survivent au rétablissement`
						);
					}
				}
				resultats[passe] = { issues, criteres: lus, ecarts };
				if (sonde === undefined || sonde === 'temoin-inerte' || passe === 'mutee') {
					imprimer([
						'',
						`LES PARCOURS DE RÉFÉRENCE — ${sonde === undefined ? 'batterie' : `sonde ${sonde}, passe ${passe}`}`,
						'',
						...lignes
					]);
				}
				if (passes.length === 1) {
					releve = issues;
					criteres = lus;
					ecartsDEtat = ecarts;
				}
			}

			if (sonde === undefined) {
				const bilan = bilanDe(releve, criteres, ecartsDEtat);
				imprimer(['', blocDeVerdict(bilan), '']);
				code = codeDeRetour(bilan);
			} else if (sonde === 'temoin-inerte') {
				const bilan = bilanDe(
					resultats.reference.issues,
					resultats.reference.criteres,
					resultats.reference.ecarts
				);
				imprimer(['', blocDeVerdict(bilan), '']);
				const verdict = verdictDeSonde({
					genre: GENRES_DE_SONDE[sonde],
					touches: touchesDeLaSonde,
					mordu: false,
					detail: 'aucune conséquence à examiner'
				});
				imprimer([
					`  sonde ${sonde} : ${verdict.motif}`,
					`  code ${verdict.code === 2 ? 1 : verdict.code}`
				]);
				code = verdict.code === 2 ? 1 : verdict.code;
			} else {
				const cible = CIBLES_DE_SONDE[sonde];
				const lire = (passe) => {
					if (cible.quoi.startsWith('critère')) {
						return (
							resultats[passe].criteres.find((c) => c.parcours === cible.parcours)?.verdict ??
							'absent'
						);
					}
					const [, rang] = cible.quoi.split('.');
					return (
						resultats[passe].issues.find(
							(i) => i.parcours === cible.parcours && i.rang === Number(rang)
						)?.issue ?? 'absente'
					);
				};
				const consequences = [
					{
						quoi: cible.quoi,
						avant: lire('reference'),
						apres: lire('mutee'),
						attenduAvant: cible.attenduAvant,
						attenduApres: cible.attenduApres
					}
				];
				const m = morsure(consequences);
				const verdict = verdictDeSonde({
					genre: GENRES_DE_SONDE[sonde],
					touches: touchesDeLaSonde,
					mordu: m.mordu,
					detail: consequences
						.map(
							(c) =>
								`${c.quoi} : ${c.avant} → ${c.apres} (attendu ${c.attenduAvant} → ${c.attenduApres})`
						)
						.join(' ; ')
				});
				imprimer([
					'',
					`  sonde ${sonde} (${GENRES_DE_SONDE[sonde]}) — ${touchesDeLaSonde} touche(s)`,
					`  ${verdict.motif}`
				]);
				/* Le code est INVERSÉ sous sonde : une sonde qui ne fait pas rougir
				   est un échec. L'inversion s'arrête au refus de conclure. */
				code = verdict.code === 2 ? 1 : verdict.code === 1 ? 0 : 1;
				imprimer([`  code de retour ${code}`]);
			}
		} finally {
			await navigateur.close();
		}
	}
} catch (cause) {
	refusDeMesurer.push(`la batterie a levé : ${expliquer(cause)}`);
} finally {
	arreterLeProduit();
	await bassin.end();
}

if (refusDeMesurer.length > 0) {
	imprimer([
		'',
		'REFUS DE MESURER',
		...refusDeMesurer.map((r) => `  · ${r}`),
		'',
		'  Une batterie qui ne sait pas ce qu’elle mesure ne rend pas de verdict (code 2).'
	]);
	code = 2;
}

exit(code);
