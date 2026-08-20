#!/usr/bin/env node
/**
 * `pnpm test:degradation` — BATTERIE 14 du catalogue (PLAN-DE-REALISATION.md
 * §5) : **les deux conteneurs optionnels arrêtés**.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE PROUVE
 *
 * Plan §5, recopiée : « les deux conteneurs optionnels arrêtés, le produit
 * reste PLEINEMENT UTILISABLE et SE SIGNALE DÉGRADÉ ». C'est `P-10` —
 * « dégradation, jamais panne » —, `RG-NF-01`, et la batterie nominale
 * d'`ADR-009`.
 *
 * L'énoncé a DEUX MOITIÉS, et la seconde est celle qu'on oublie. Une brique
 * arrêtée dont le produit continue de fonctionner n'est qu'une moitié de
 * P-10 : l'autre exige un MESSAGE CLAIR. Un état calculé côté serveur
 * qu'aucun nœud ne rend n'est pas un message, c'est un silence bien informé.
 * Les deux moitiés sont donc comptées séparément, pour chacune des deux
 * briques — quatre cases, et une case non atteinte est un ÉCHEC, jamais une
 * omission.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS NIVEAUX DE PREUVE, ET ILS NE PROUVENT PAS LA MÊME CHOSE
 *
 *   §1 LA STRUCTURE — `compose.yaml` est LU. « app ne les déclare pas en
 *      depends_on, ne les attend pas au démarrage, et aucun de ses contrôles
 *      de santé ne les traverse » : la composition l'écrit d'elle-même, et
 *      l'écrire n'est pas le prouver. Le fichier est analysé, pas cru.
 *
 *   §2 LE COMPORTEMENT — le service de conversion est réellement ARRÊTÉ puis
 *      réellement DÉMARRÉ, sur LE MÊME lot de dix fichiers. `T-052` a mesuré
 *      6 notes / 4 échecs motivés d'un côté, 2 notes / 8 échecs injoignables
 *      de l'autre ; cette batterie reprend la mesure au lieu de la citer.
 *
 *   §3 L'ÉCRAN — le produit est CONSTRUIT et SERVI, les deux briques
 *      arrêtées, et chaque route montée est demandée. Le signalement est
 *      cherché dans le DOCUMENT, jamais dans une valeur de chargeur.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE NE PROUVE PAS, ET IL FAUT LE DIRE
 *
 *   · LE CÔTÉ « DÉMARRÉ » DE LA BRIQUE D'EMBEDDINGS N'EST PAS MESURABLE. Le
 *     mode « Sens » est dérivé de l'absence d'embedder dans les réglages de
 *     l'index (`src/lib/recherche/notes-indexees.ts`), et aucun lot n'en
 *     déclare. Démarrer le conteneur ne rendrait donc pas le mode disponible :
 *     la brique est arrêtée ET sa fonction est indisponible par une seconde
 *     cause. La batterie le COMPTE comme non couvert plutôt que de laisser
 *     croire à une mesure des deux côtés.
 *
 *   · LE CHARGEMENT INFINI qu'`ADR-009` interdit au même titre que l'erreur et
 *     l'écran vide n'est pas mesuré : une requête unique ne le distingue pas
 *     d'une réponse lente. C'est la batterie 13 qui le porte.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES — la preuve qu'elle sait dire non
 *
 * `docs/orchestration.md` §1.2 règle 4 : mutation d'au moins deux genres, et
 * la preuve que la mutation n'est pas inerte. Le compte de touches y répond à
 * moitié seulement : la batterie porte des non-couvertures de fond, donc
 * `rougit` est vrai QUOI QU'UNE SONDE FASSE. On exige donc des sondes
 * d'observation un défaut QUI LEUR SOIT IMPUTABLE.
 *
 *   --sonde=depend-au-demarrage   CONFIGURATION : `conversion` entre dans le
 *                                 `depends_on` d'`app`. C'est LA sonde que le
 *                                 contrat demande — « mettre une brique
 *                                 optionnelle dans le chemin critique doit
 *                                 faire rougir la batterie »
 *   --sonde=sante-traversante     CONFIGURATION : le contrôle de santé d'`app`
 *                                 interroge le port de l'optionnel — le chemin
 *                                 critique par l'autre porte que `depends_on`
 *   --sonde=lot-interrompu        OBSERVATION : le lot s'arrête au premier
 *                                 échec, comme le ferait un appel qui lève
 *                                 (`RG-M12-04`, `C-07`)
 *   --sonde=sens-simule           OBSERVATION : la page de recherche est servie
 *                                 sans son signalement — la moitié « message
 *                                 clair » disparaît
 *   --sonde=panne-au-lieu-de-degrade  OBSERVATION : une route rend une trace
 *                                 technique au lieu d'un état dégradé
 *   --sonde=temoin-inerte         INERTE : elle ne touche rien. La batterie
 *                                 doit REFUSER DE CONCLURE — code 1, jamais
 *                                 inversé
 *
 * Usage :
 *   node verif/degradation.mjs                  la batterie
 *   node verif/degradation.mjs --sonde=<genre>  la preuve qu'elle sait dire non
 *   node verif/degradation.mjs --sans-construire  diagnostic : réemploie build/
 *   node verif/degradation.mjs --sans-ecran     diagnostic : §1 et §2 seuls
 *   node verif/degradation.mjs --eprouver-la-garde  joue le voisin qui purge la
 *                                 base partagée, et exige que la garde de
 *                                 session morde (`P-5`, `P-28`)
 *
 * Codes de retour : 0 dégradé et prouvé · 1 défaut ou moitié non couverte ·
 * 2 refus de mesurer (docker absent, image absente, base absente).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import { racine } from './banc/inventaire.mjs';
import {
	MARQUES_DU_SENS,
	OPTIONNELS_DE_L_ADR,
	analyserLaComposition,
	defautsDeComposition,
	pannesDeLaReponse,
	signalementDansLeDocument,
	verdictDuLot
} from './degradation-attendu.mjs';

const args = argv.slice(2);
const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);
const sansConstruire = args.includes('--sans-construire');
const sansEcran = args.includes('--sans-ecran');
/** Joue le voisin qui purge la base partagée, pour éprouver la garde (`P-5`). */
const eprouverLaGarde = args.includes('--eprouver-la-garde');

/* L'ENVIRONNEMENT EST LU AVANT TOUT LE RESTE, ET LES DEUX FICHIERS COMPTENT.
   `.env` porte les secrets de la composition ; `.env.local` porte le PORT de la
   copie de travail, et c'est `verif/preparer-copie.sh` qui l'y écrit. Ne lire
   que le premier ferait mesurer le port d'une AUTRE copie — le symptôme
   qu'`ECART-017` É-8 a nommé, et que `P-22` remesure à chaque lot. */
for (const fichier of ['.env', '.env.local']) {
	try {
		process.loadEnvFile(join(racine, fichier));
	} catch {
		/* Absent : l'environnement du processus fait foi (`base/base.mjs`). */
	}
}

/** Le port de cette copie de travail (`verif/preparer-copie.sh`), à défaut 5913. */
const PORT = Number(process.env.PORT_DEV ?? 5913);
/** Le port du conteneur de conversion — dérivé, pour que deux copies coexistent. */
const PORT_CONVERSION = PORT + 40;
/** Le conteneur que CETTE batterie crée, et qu'elle retire (`P-22`). */
const CONTENEUR = `codicillus-batterie14-conversion-${String(PORT)}`;
/** L'image du service optionnel, bâtie de `services/conversion/`. */
const IMAGE = 'codicillus-batterie14-conversion';

/** Le mot de passe d'aucun compte : la session est posée en base, pas ouverte. */
const JETON_DE_SESSION = `batterie14-${String(PORT)}`;

/** @see GENRES_DE_SONDE d'`etancheite.mjs` — même doctrine, mêmes noms. */
const GENRES_DE_SONDE = {
	'depend-au-demarrage': 'configuration',
	'sante-traversante': 'configuration',
	'lot-interrompu': 'observation',
	'sens-simule': 'observation',
	'panne-au-lieu-de-degrade': 'observation',
	'temoin-inerte': 'inerte'
};

if (sonde !== undefined && !Object.hasOwn(GENRES_DE_SONDE, sonde)) {
	console.error(
		`sonde « ${sonde} » inconnue — les genres sont : ${Object.keys(GENRES_DE_SONDE).join(', ')}`
	);
	exit(2);
}

/** @type {{genre: string, quoi: string, detail: string, imputable?: boolean}[]} */
const defauts = [];
/** @type {{quoi: string, detail: string}[]} */
const nonCouvertes = [];
/** @type {string[]} */
const refusDeMesurer = [];
let touchesDeLaSonde = 0;

/* ═══════════════════════════════════════════════════════════════════════════
   1. LA PROPRIÉTÉ STRUCTURELLE — lue dans `compose.yaml`

   Le contrat de ce lot est explicite : « vérifie-la dans le fichier, ne la
   crois pas ». La composition affirme d'elle-même que les deux optionnels ne
   sont pas dans le chemin critique ; une affirmation n'est pas une preuve, et
   `P-21` du dépôt tient à cette distinction depuis sept chiffres faux.
   ═════════════════════════════════════════════════════════════════════════ */

let texteComposition = readFileSync(join(racine, 'compose.yaml'), 'utf8');

if (sonde === 'depend-au-demarrage') {
	/* LA SONDE DU CONTRAT. Une brique optionnelle entre dans le chemin de
	   démarrage d'`app` : la batterie doit rougir. La mutation porte sur le
	   TEXTE LU, jamais sur le fichier — un instrument qui écrirait dans la
	   composition laisserait un dépôt modifié derrière lui.

	   LA MUTATION VISE `app`, ET PAS LE PREMIER `depends_on` DU FICHIER. Le
	   premier est celui du frontal, et le premier jet l'a touché : la sonde
	   rougissait, mais sur une autre phrase que celle du contrat — « app ne
	   déclare pas les deux optionnels en dépendance de démarrage ». L'ancre est
	   donc la dernière ligne du `depends_on` d'`app`, qui n'apparaît qu'une fois. */
	const ancre = '      recherche:\n        condition: service_healthy\n';
	const avant = texteComposition;
	if (texteComposition.split(ancre).length === 2) {
		texteComposition = texteComposition.replace(
			ancre,
			ancre + '      conversion:\n        condition: service_healthy\n'
		);
	}
	if (texteComposition !== avant) touchesDeLaSonde += 1;
}
if (sonde === 'sante-traversante') {
	/* Le chemin critique par l'autre porte : `app` se déclare malsaine quand
	   l'optionnel ne répond pas. Aucun `depends_on` n'a bougé, et pourtant
	   l'orchestrateur redémarrerait `app` en boucle, brique arrêtée. */
	const avant = texteComposition;
	texteComposition = texteComposition.replace(
		"\"fetch('http://127.0.0.1:3000/')",
		"\"fetch('http://embeddings:11434/')"
	);
	if (texteComposition !== avant) touchesDeLaSonde += 1;
}

const composition = analyserLaComposition(texteComposition);
refusDeMesurer.push(...composition.refus);

/* La table est éprouvée AVANT de mesurer (`docs/orchestration.md` §1.2 règle
   3) : deux sources nomment les optionnels — l'ADR et la composition —, et si
   elles divergeaient, la batterie mesurerait autre chose que ce qu'elle croit. */
const optionnelsDeLaComposition = [...composition.services.entries()]
	.filter(([, s]) => s.optionnel)
	.map(([n]) => n)
	.sort();
if (
	composition.services.size > 0 &&
	optionnelsDeLaComposition.join(',') !== [...OPTIONNELS_DE_L_ADR].sort().join(',')
) {
	refusDeMesurer.push(
		`compose.yaml qualifie « ${optionnelsDeLaComposition.join(', ') || '(aucun)'} » d’optionnels, ` +
			`ADR-009 en nomme « ${OPTIONNELS_DE_L_ADR.join(', ')} » : les deux sources divergent`
	);
}

for (const d of defautsDeComposition(composition.services)) {
	defauts.push({ genre: 'structure', quoi: d.quoi, detail: d.detail });
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. DOCKER — nommer ce qu'on touche, et rendre l'état de départ (`P-22`)
   ═════════════════════════════════════════════════════════════════════════ */

/** @param {string[]} arguments_ */
function docker(arguments_, delai = 120_000) {
	return spawnSync('docker', arguments_, { encoding: 'utf8', timeout: delai });
}

/** Les conteneurs EN MARCHE bâtis sur une image donnée, par nom. */
function conteneursEnMarche(motifDImage) {
	const sortie = docker(['ps', '--format', '{{.Names}}\t{{.Image}}']);
	if (sortie.status !== 0) return [];
	return sortie.stdout
		.split('\n')
		.filter((l) => l.trim() !== '')
		.map((l) => l.split('\t'))
		.filter(([, image]) => image.includes(motifDImage))
		.map(([nom]) => nom);
}

if (docker(['version', '--format', '{{.Server.Version}}'], 20_000).status !== 0) {
	refusDeMesurer.push('docker ne répond pas : les deux briques optionnelles sont hors de portée');
}

/**
 * L'IMAGE DU SERVICE OPTIONNEL. Bâtie si elle manque, réemployée sinon.
 *
 * La bâtir est un choix, et il se justifie : mesurer contre une image trouvée
 * dans le démon mesurerait un service dont RIEN ne dit qu'il est celui de
 * `services/conversion/`. C'est la faute d'`ECART-014` — un candidat qui
 * possédait ce dont l'implémentation était démunie.
 */
function imagePosee() {
	if (docker(['image', 'inspect', IMAGE], 30_000).status === 0) return true;
	const bati = docker(['build', '--tag', IMAGE, join(racine, 'services', 'conversion')], 900_000);
	if (bati.status !== 0) {
		refusDeMesurer.push(
			`l’image « ${IMAGE} » n’existe pas et sa construction a échoué :\n` +
				String(bati.stderr ?? '').slice(-600)
		);
		return false;
	}
	return true;
}

/** Démarre le conteneur de conversion, et attend un MARQUEUR ÉCRIT (`P-1`). */
async function demarrerLaConversion() {
	docker(['rm', '--force', '--volumes', CONTENEUR], 60_000);
	const lance = docker([
		'run',
		'--detach',
		'--name',
		CONTENEUR,
		'--publish',
		`127.0.0.1:${String(PORT_CONVERSION)}:8000`,
		'--env',
		'DELAI_MAX_CONVERSION=120',
		IMAGE
	]);
	if (lance.status !== 0) {
		refusDeMesurer.push(`« docker run » a échoué :\n${String(lance.stderr ?? '').slice(-400)}`);
		return false;
	}
	/* Le marqueur est la réponse du contrôle de santé DU SERVICE, pas l'état du
	   conteneur : un conteneur « running » dont le serveur n'écoute pas encore
	   ferait mesurer un service arrêté sous le nom d'un service démarré. */
	for (let essai = 0; essai < 120; essai++) {
		const vu = await fetch(`http://127.0.0.1:${String(PORT_CONVERSION)}/sante`).catch(() => null);
		if (vu !== null && vu.ok) return true;
		await new Promise((r) => setTimeout(r, 250));
	}
	refusDeMesurer.push(`le conteneur « ${CONTENEUR} » n’a pas répondu sur /sante`);
	return false;
}

/** Arrête le conteneur, et attend le MARQUEUR ÉCRIT du refus de connexion. */
async function arreterLaConversion() {
	docker(['stop', '--timeout', '5', CONTENEUR], 60_000);
	for (let essai = 0; essai < 60; essai++) {
		const vu = await fetch(`http://127.0.0.1:${String(PORT_CONVERSION)}/sante`).catch(() => null);
		if (vu === null) return true;
		await new Promise((r) => setTimeout(r, 200));
	}
	refusDeMesurer.push(`le conteneur « ${CONTENEUR} » répond encore après « docker stop »`);
	return false;
}

/** Le geste de clôture, et il n'est jamais facultatif (`P-22`). */
function retirerLeConteneur() {
	docker(['rm', '--force', '--volumes', CONTENEUR], 60_000);
}

/* LA BRIQUE D'EMBEDDINGS EST ARRÊTÉE, ET C'EST CONSTATÉ. Si un conteneur
   Ollama tournait, la mesure « arrêté » serait fausse — et la batterie
   préfère refuser de mesurer plutôt que d'arrêter le conteneur d'autrui. */
const ollamaEnMarche = conteneursEnMarche('ollama/ollama');
if (ollamaEnMarche.length > 0) {
	refusDeMesurer.push(
		`un conteneur d’embeddings est EN MARCHE — ${ollamaEnMarche.join(', ')} : la mesure ` +
			'« brique arrêtée » serait fausse. Ce n’est pas à cette batterie de l’arrêter.'
	);
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. LE LOT DE DIX FICHIERS — fabriqué, jamais trouvé

   `P-26` : « tout contrôle doit avoir un cas d'épreuve SYNTHÉTIQUE, indépendant
   de l'état du dépôt ». Le lot n'est donc pas lu quelque part : il est
   FABRIQUÉ, octet par octet, à chaque exécution. Les mêmes octets servent aux
   deux côtés de la mesure — sans quoi la différence mesurée serait celle des
   fichiers, pas celle de la brique.

   L'ORDRE EST UNE DONNÉE DE LA MESURE, pas une commodité de rédaction. Les
   quatre malformés sont AU MILIEU, et deux fichiers valides derrière eux :
   `RG-M12-04` et la contrainte `C-07` veulent qu'« un échec unitaire
   n'interrompe jamais un lot », et un lot dont les valides seraient tous en
   tête rendrait le même compte qu'un lot interrompu au premier échec.
   ═════════════════════════════════════════════════════════════════════════ */

/** Un PDF minimal, avec un objet de texte — pdfplumber le lit. */
function pdfAvecTexte(texte) {
	const objets = [
		'<</Type/Catalog/Pages 2 0 R>>',
		'<</Type/Pages/Kids[3 0 R]/Count 1>>',
		'<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
		'<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'
	];
	const flux = `BT /F1 12 Tf 72 720 Td (${texte}) Tj ET`;
	objets.push(`<</Length ${String(flux.length)}>>\nstream\n${flux}\nendstream`);
	return assemblerLePdf(objets, '<</Size N/Root 1 0 R>>');
}

/** Un PDF dont le dictionnaire de chiffrement est greffé — le cas « protégé ». */
function pdfChiffre() {
	const objets = [
		'<</Type/Catalog/Pages 2 0 R>>',
		'<</Type/Pages/Kids[3 0 R]/Count 1>>',
		'<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>',
		'<</Length 0>>\nstream\n\nendstream',
		'<</Filter/Standard/V 9/R 9/Length 256/P -4/O(0123456789abcdef0123456789abcdef)' +
			'/U(0123456789abcdef0123456789abcdef)>>'
	];
	return assemblerLePdf(objets, '<</Size N/Root 1 0 R/Encrypt 5 0 R/ID[<00><00>]>>');
}

/** La table de références croisées, calculée sur les décalages réels. */
function assemblerLePdf(objets, bandeau) {
	let sortie = '%PDF-1.7\n';
	const decalages = [];
	objets.forEach((corps, i) => {
		decalages.push(sortie.length);
		sortie += `${String(i + 1)} 0 obj\n${corps}\nendobj\n`;
	});
	const debutXref = sortie.length;
	sortie += `xref\n0 ${String(objets.length + 1)}\n0000000000 65535 f \n`;
	for (const o of decalages) sortie += `${String(o).padStart(10, '0')} 00000 n \n`;
	sortie += `trailer\n${bandeau.replace('N', String(objets.length + 1))}\n`;
	sortie += `startxref\n${String(debutXref)}\n%%EOF\n`;
	return Buffer.from(sortie, 'latin1');
}

/**
 * Un document bureautique VALIDE, écrit par le pandoc DU CONTENEUR lui-même.
 *
 * Le fabriquer à la main serait un pari sur la tolérance d'un lecteur ; le
 * demander à l'outil que le service emploie garantit qu'un échec de conversion
 * viendra de la brique arrêtée, et de rien d'autre. Le contenu passe par
 * l'entrée standard, le document sort en binaire sur la sortie standard.
 */
function bureautiqueValide(markdown, format) {
	const fait = spawnSync(
		'docker',
		[
			'exec',
			'--interactive',
			CONTENEUR,
			'pandoc',
			'--from=markdown',
			`--to=${format}`,
			'--output=-'
		],
		{ input: markdown, maxBuffer: 32 * 1024 * 1024, timeout: 60_000 }
	);
	if (fait.status !== 0 || fait.stdout.length === 0) {
		refusDeMesurer.push(
			`le lot n’a pas pu être fabriqué : pandoc ${format} a rendu ${String(fait.status)}`
		);
		return Buffer.alloc(0);
	}
	return fait.stdout;
}

/**
 * LE LOT, DANS SON ORDRE. Dix fichiers, deux voies, quatre genres de malformé.
 *
 * Les octets bureautiques valides sont produits par le conteneur DÉMARRÉ : le
 * lot est donc fabriqué une seule fois, puis les deux côtés de la mesure
 * reçoivent exactement les mêmes octets.
 */
function fabriquerLeLot() {
	const utf8 = (s) => Buffer.from(s, 'utf8');
	return [
		{
			chemin: 'Exploitation/Sauvegardes/Restauration PostgreSQL.docx',
			octets: bureautiqueValide('# Restauration PostgreSQL\n\nArrêter le service.\n', 'docx')
		},
		{
			chemin: 'Exploitation/Astreinte/Consignes de nuit.docx',
			octets: bureautiqueValide('# Consignes de nuit\n\n- appeler le référent\n', 'docx')
		},
		{
			chemin: "Supervision/Alertes/Politique d'escalade.md",
			octets: utf8('# Politique d’escalade\n\nNiveau 1 puis niveau 2.\n')
		},
		/* Les quatre malformés — quatre GENRES de fichier, deux motifs. */
		{ chemin: 'Réseau/VPN/Certificats.pdf', octets: pdfChiffre() },
		{ chemin: 'Serveurs/Inventaire.docx', octets: utf8('ceci n’est pas une archive') },
		{ chemin: 'Supervision/Tableau tronqué.pptx', octets: Buffer.from('PK' + 'x'.repeat(60)) },
		{ chemin: 'Exploitation/Ordonnancement/Calendrier.pdf', octets: utf8('%PDF-1.4\nrien\n') },
		/* LE FICHIER D'APRÈS LES ERREURS — celui de la mesure de `T-052`. */
		{
			chemin: 'Supervision/Tableau de bord.pptx',
			octets: bureautiqueValide('# Tableau de bord\n\n- sondes\n', 'pptx')
		},
		{
			chemin: 'Exploitation/Astreinte/Rotation 2025.pdf',
			octets: pdfAvecTexte('Rotation d astreinte 2025 - semaines 1 a 52')
		},
		{ chemin: 'Réseau/Configuration coeur.txt', octets: utf8('vlan 10 : bureautique\n') }
	];
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. LA MESURE DU LOT — le produit, appelé comme la route l'appelle

   Le chemin mesuré est celui de `src/routes/importer/+page.server.ts` :
   `sonderLeServiceDeConversion`, puis `convertirLeLot`, puis `classerLeLot`.
   Il s'arrête AVANT `executerLImport`, et c'est délibéré : l'écriture en base
   ne dit rien de plus sur la dégradation, et la base est PARTAGÉE par les
   copies de travail — une batterie qui y écrirait des notes ferait rougir la
   suivante.
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {import('vite').ViteDevServer|null} */
let vite = null;
async function moduleDImport() {
	if (vite === null) {
		const { createServer } = await import('vite');
		vite = await createServer({
			server: { middlewareMode: true },
			appType: 'custom',
			logLevel: 'error'
		});
	}
	return await vite.ssrLoadModule('/src/lib/donnees/import.ts');
}

/**
 * Le plan d'import d'un lot, pour un état donné du service.
 *
 * @param {'demarre'|'arrete'} cote
 */
async function planDuLot(M, lot, cote) {
	const adresse = `http://127.0.0.1:${String(PORT_CONVERSION)}`;
	const deposes = lot.map((f) => ({
		chemin: f.chemin,
		octets: f.octets.length,
		texte: /\.(md|txt)$/i.test(f.chemin) ? f.octets.toString('utf8') : null,
		binaire: /\.(docx|pptx|pdf)$/i.test(f.chemin) ? new Uint8Array(f.octets) : null
	}));
	const service = await M.sonderLeServiceDeConversion(fetch, adresse);
	const conversions = await M.convertirLeLot(fetch, adresse, deposes, service);
	let plan = M.classerLeLot(`Batterie 14 — ${cote}`, deposes, {
		service,
		conversions,
		identifiantsPris: new Set(),
		profondeurDeDepart: 1
	});
	if (sonde === 'lot-interrompu' && cote === 'arrete') {
		/* LA SONDE D'OBSERVATION : le lot s'arrête au premier échec, comme le
		   ferait un appel qui lève au lieu de rendre un motif. `RG-M12-04` et
		   `C-07` doivent alors rougir — et si elles ne rougissent pas, c'est
		   qu'aucun cas ne les exerce (`P-5`). */
		const rang = plan.lignes.findIndex((l) => l.sort === 'echec');
		if (rang >= 0) {
			touchesDeLaSonde += 1;
			const lignes = plan.lignes.slice(0, rang + 1);
			plan = {
				...plan,
				lignes,
				notes: lignes.filter((l) => l.sort === 'note').length,
				ignores: lignes.filter((l) => l.sort === 'ignore').length,
				echecs: lignes.filter((l) => l.sort === 'echec').length
			};
		}
	}
	return { service, plan, verdict: verdictDuLot(plan) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LA BASE — une session, un droit, et rien d'autre

   La base est PARTAGÉE par les copies de travail. Cette batterie y pose ce
   qu'il lui faut pour incarner un rédacteur — une session et un droit — et
   retire EXACTEMENT ces deux lignes. Aucune purge : `delete from sessions`
   emporterait celles des batteries voisines.
   ═════════════════════════════════════════════════════════════════════════ */

const pg = (await import('pg')).default;
const bassin = new pg.Pool({
	host: process.env.HOTE_BASE ?? process.env.HOTE_POSTGRES ?? '127.0.0.1',
	port: Number(process.env.PORT_BASE ?? process.env.PORT_DB ?? 19432),
	user: process.env.UTILISATEUR_BASE ?? process.env.UTILISATEUR_POSTGRES ?? 'codicillus',
	password: process.env.MDP_BASE ?? process.env.MDP_POSTGRES,
	database: process.env.NOM_BASE ?? process.env.BASE_POSTGRES ?? 'codicillus',
	max: 2
});

async function interroger(sql, valeurs = []) {
	const r = await bassin.query(sql, valeurs);
	return r.rows;
}

const condensatDeSession = createHash('sha256').update(JETON_DE_SESSION).digest('hex');
const JETON_DADMIN = `${JETON_DE_SESSION}-admin`;
const condensatDAdmin = createHash('sha256').update(JETON_DADMIN).digest('hex');
let compteRedacteur = null;
let compteAdministrateur = null;
let dossierRacine = null;

/** Pose la session et le droit du rédacteur. Rejouable : la batterie la rappelle. */
async function poserLeRedacteur() {
	const [compte] = await interroger(
		"select id from comptes where identifiant = 'marc.ferreira' and actif"
	);
	if (compte === undefined) {
		refusDeMesurer.push(
			'aucun compte « marc.ferreira » actif : le persona rédacteur est inposable'
		);
		return false;
	}
	compteRedacteur = compte.id;
	const [racineDuDomaine] = await interroger(
		`select d.id from dossiers d join domaines dom on dom.id = d.domaine_id
		  where d.parent_id is null order by dom.identifiant limit 1`
	);
	if (racineDuDomaine === undefined) {
		refusDeMesurer.push('aucun dossier racine en base : le droit de rédaction est inposable');
		return false;
	}
	dossierRacine = racineDuDomaine.id;
	await interroger('delete from sessions where condensat_jeton = $1', [condensatDeSession]);
	await interroger(
		'insert into sessions (compte_id, condensat_jeton, souvenir) values ($1, $2, true)',
		[compteRedacteur, condensatDeSession]
	);
	await interroger(
		`insert into droits_de_dossier (dossier_id, compte_id, droit) values ($1, $2, 'redacteur')
		   on conflict do nothing`,
		[dossierRacine, compteRedacteur]
	);
	/* L'ADMINISTRATEUR EST POSÉ AVEC LE RÉDACTEUR, ET IL A UNE RAISON PRÉCISE.
	   `/console/imports` rend 404 à un rédacteur : conclure de ce 404 que le
	   second écran d'import ne signale rien serait conclure d'une page qu'on n'a
	   jamais vue. Le seul persona qui l'atteint est l'administrateur, et il
	   contourne les droits de dossier (`RG-DRO-03`) : aucun droit à lui poser. */
	const [admin] = await interroger(
		"select id from comptes where identifiant = 'sophie.nguyen' and actif"
	);
	if (admin === undefined) {
		refusDeMesurer.push('aucun compte « sophie.nguyen » actif : la console est inatteignable');
		return false;
	}
	compteAdministrateur = admin.id;
	await interroger('delete from sessions where condensat_jeton = $1', [condensatDAdmin]);
	await interroger(
		'insert into sessions (compte_id, condensat_jeton, souvenir) values ($1, $2, true)',
		[compteAdministrateur, condensatDAdmin]
	);
	return true;
}

/** Retire exactement ce que la batterie a posé, et rien de plus. */
async function rendreLaBase() {
	if (compteRedacteur === null) return null;
	await interroger('delete from sessions where condensat_jeton = any($1)', [
		[condensatDeSession, condensatDAdmin]
	]);
	await interroger('delete from droits_de_dossier where dossier_id = $1 and compte_id = $2', [
		dossierRacine,
		compteRedacteur
	]);
	const [reste] = await interroger(
		`select (select count(*)::int from sessions where condensat_jeton = any($1)) sessions,
		        (select count(*)::int from droits_de_dossier where compte_id = $2) droits`,
		[[condensatDeSession, condensatDAdmin], compteRedacteur]
	);
	return reste;
}

/** Les valeurs de substitution des routes paramétrées, tirées de la base semée. */
async function valeursDuCorpus() {
	const [domaine] = await interroger(
		`select d.identifiant as domaine, u.identifiant as univers
		   from domaines d join univers u on u.id = d.univers_id
		   join dossiers f on f.domaine_id = d.id
		  group by d.identifiant, u.identifiant
		  order by count(f.id) desc, d.identifiant limit 1`
	);
	const [note] = await interroger('select identifiant from notes order by identifiant limit 1');
	return {
		univers: domaine?.univers ?? null,
		domaine: domaine?.domaine ?? null,
		note: note?.identifiant ?? null
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LE PRODUIT CONSTRUIT, SERVI, ET LES ROUTES DEMANDÉES

   Le produit est CONSTRUIT et servi par `node build/index.js`, comme la
   batterie 6 : `vite dev` n'est pas ce que l'exploitation emprunte, et un vert
   sur un chemin que les vues n'empruntent pas ne prouve rien (`ECART-013` É-1).
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {import('node:child_process').ChildProcess|null} */
let produit = null;

async function servirLeProduit() {
	if (!sansConstruire) {
		const bati = spawnSync('pnpm', ['run', 'build'], { cwd: racine, encoding: 'utf8' });
		if (bati.status !== 0) {
			refusDeMesurer.push(`la construction a échoué :\n${String(bati.stderr).slice(-800)}`);
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
	env.ORIGIN = `http://127.0.0.1:${String(PORT)}`;
	/* LES DEUX ADRESSES SONT POSÉES, ET C'EST CE QUI REND LA MESURE HONNÊTE.
	   Sans `URL_CONVERSION`, le produit tient le service pour injoignable quoi
	   qu'il arrive, et la différence mesurée entre les deux passes ne serait pas
	   celle du conteneur : elle serait celle d'une variable absente. */
	env.URL_CONVERSION = `http://127.0.0.1:${String(PORT_CONVERSION)}`;
	env.URL_EMBEDDINGS = `http://127.0.0.1:${String(PORT + 41)}`;
	produit = spawn(process.execPath, ['build/index.js'], {
		cwd: racine,
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let journal = '';
	produit.stdout?.on('data', (d) => (journal += String(d)));
	produit.stderr?.on('data', (d) => (journal += String(d)));

	/* `P-1` — un MARQUEUR ÉCRIT, jamais la disparition d'un processus. Ici la
	   première réponse HTTP : elle prouve que le serveur écoute ET qu'il sert. */
	for (let essai = 0; essai < 160; essai++) {
		const vivant = await fetch(`http://127.0.0.1:${String(PORT)}/connexion`, {
			redirect: 'manual'
		}).catch(() => null);
		if (vivant !== null) return true;
		if (produit.exitCode !== null) {
			refusDeMesurer.push(
				`node build/index.js s’est arrêté en ${String(produit.exitCode)} :\n${journal.slice(-600)}`
			);
			return false;
		}
		await new Promise((r) => setTimeout(r, 150));
	}
	refusDeMesurer.push(`le produit n’a pas répondu sur le port ${String(PORT)}`);
	return false;
}

/**
 * LES ROUTES MONTÉES, lues dans `src/routes` — jamais déclarées ici.
 *
 * `/deconnexion` EST ÉCARTÉE, et il faut dire pourquoi : c'est la seule action
 * d'écriture en GET du produit (`ARB-054`), et la demander fermerait la session
 * du persona pour toutes les demandes suivantes. C'est `P-28` mot pour mot —
 * « une matrice dont les cases se contaminent mesure l'ordre, pas la
 * propriété ». Sa propre étanchéité est mesurée par la batterie 6, à part.
 */
function routesMontees(chemin = join(racine, 'src', 'routes'), prefixe = '') {
	/** @type {string[]} */
	const sorties = [];
	const entrees = readdirSync(chemin, { withFileTypes: true });
	if (
		entrees.some((e) => e.isFile() && /^\+(page\.(svelte|server\.ts)|server\.ts)$/.test(e.name))
	) {
		sorties.push(prefixe === '' ? '/' : prefixe);
	}
	for (const e of entrees) {
		if (!e.isDirectory()) continue;
		if (e.name.startsWith('.')) continue;
		const segment = e.name.startsWith('(') && e.name.endsWith(')') ? '' : `/${e.name}`;
		sorties.push(...routesMontees(join(chemin, e.name), prefixe + segment));
	}
	return [...new Set(sorties)].sort();
}

/** L'adresse réellement demandée : les paramètres reçoivent des valeurs du corpus. */
function adresseDe(route, corpus) {
	if (route === '/deconnexion') return null;
	let chemin = route;
	for (const m of route.matchAll(/\[(\.\.\.)?([^\]]+)\]/g)) {
		const brut = m[0];
		const cle = m[2];
		const valeur =
			cle === 'univers'
				? corpus.univers
				: cle === 'domaine'
					? corpus.domaine
					: cle === 'identifiant'
						? corpus.note
						: null;
		/* `[...chemin]`, `[jeton]` et `[fichier]` n'ont AUCUNE valeur que la base
		   semée fournisse sans un travail d'appariement propre à la batterie 6 :
		   la route est écartée et COMPTÉE, jamais servie d'une valeur inventée. */
		if (valeur === null) return null;
		chemin = chemin.replace(brut, encodeURIComponent(valeur));
	}
	return chemin;
}

/** Une requête, et l'observation qu'on en tire. */
async function observer(chemin, cookie) {
	const entetes = { accept: 'text/html,application/xhtml+xml' };
	if (cookie !== null) entetes.cookie = cookie;
	const debut = performance.now();
	let reponse;
	try {
		reponse = await fetch(`http://127.0.0.1:${String(PORT)}${chemin}`, {
			headers: entetes,
			redirect: 'manual'
		});
	} catch (erreur) {
		return { code: 0, corps: String(erreur), type: '', millisecondes: performance.now() - debut };
	}
	const corps = await reponse.text();
	return {
		code: reponse.status,
		corps,
		type: reponse.headers.get('content-type') ?? '',
		destination: reponse.headers.get('location') ?? '',
		millisecondes: performance.now() - debut
	};
}

/** Le nombre de fois où la session du rédacteur a dû être reposée. */
let sessionsReposees = 0;

/**
 * LA MÊME OBSERVATION, MAIS SOUS GARDE DE SESSION — et la garde a une cause
 * mesurée, pas une prudence de principe.
 *
 * LA BASE EST PARTAGÉE par toutes les copies de travail, et la batterie 6 y
 * fait `delete from sessions` à son entrée comme à sa sortie. Une exécution
 * concurrente EFFACE donc la session de ce persona en plein balayage : toutes
 * les demandes suivantes repartent en anonyme, `/importer` rend 302, et la
 * batterie relèverait un signalement absent d'une page qu'elle n'a jamais vue.
 * Mesuré le 20 août 2026 : 17 routes sur 33 basculées en 302 entre deux
 * exécutions, sans qu'une ligne du produit ait changé.
 *
 * C'est `P-28` : « une matrice dont les cases se contaminent mesure l'ordre,
 * pas la propriété » — ici la contamination vient d'un voisin, et la parade est
 * la même : CHAQUE CASE RÉTABLIT SON ÉTAT AVANT DE MESURER. La reprise est
 * comptée et imprimée : une interférence tue doublerait la mesure d'un doute.
 *
 * LA GARDE NE PEUT PAS SE FONDER SUR LA RÉPONSE, ET C'EST LE POINT DÉLICAT. Un
 * premier jet ne reprenait que sur un 302 vers la connexion. Or `/recherche` NE
 * REFUSE JAMAIS (`docs/routes.md:248`) : session perdue, elle rend 200 — V-02,
 * la recherche publique, qui ne porte aucun signalement de dégradation. La
 * batterie relevait alors « le mode Sens ne se signale pas » sur une page où il
 * n'a rien à faire. La garde interroge donc LA BASE après chaque demande, et
 * non le code de retour : c'est la seule source qui distingue « le produit a
 * refusé » de « la session n'existait plus ».
 */
async function sessionVivante() {
	const [reste] = await interroger(
		'select count(*)::int n from sessions where condensat_jeton = $1',
		[condensatDeSession]
	);
	return (reste?.n ?? 0) > 0;
}

/** L'épreuve de la garde a-t-elle déjà été jouée ? Une fois suffit. */
let gardeEprouvee = false;

async function observerEnRedacteur(chemin, cookie) {
	if (eprouverLaGarde && !gardeEprouvee) {
		/* `P-5` — « une règle qu'aucun cas n'exerce est une règle dont on ignore
		   si elle marche ». La garde de session ne s'exerce que lorsqu'une copie
		   voisine purge la base, c'est-à-dire jamais quand le dépôt est calme :
		   ce drapeau JOUE le voisin, une fois, et la batterie exige ensuite que
		   la garde ait mordu. Sans lui, la parade de `P-28` serait espérée. */
		gardeEprouvee = true;
		await interroger('delete from sessions where condensat_jeton = $1', [condensatDeSession]);
	}
	const vue = await observer(chemin, cookie);
	if (await sessionVivante()) return vue;
	sessionsReposees += 1;
	await poserLeRedacteur();
	return await observer(chemin, cookie);
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. LA MESURE
   ═════════════════════════════════════════════════════════════════════════ */

/** @type {Record<string, unknown>} */
const releve = { composition: {}, conversion: {}, sens: {}, ecran: {} };

async function mesurer() {
	if (refusDeMesurer.length > 0) return;

	/* ── §2 · LE SERVICE DE CONVERSION, LES DEUX CÔTÉS ─────────────────── */
	if (!imagePosee()) return;
	if (!(await demarrerLaConversion())) return;

	const lot = fabriquerLeLot();
	if (refusDeMesurer.length > 0) return;
	const M = await moduleDImport();

	const demarre = await planDuLot(M, lot, 'demarre');
	if (!(await arreterLaConversion())) return;
	const arrete = await planDuLot(M, lot, 'arrete');

	releve.conversion = {
		conteneur: CONTENEUR,
		demarre: demarre.verdict,
		arrete: arrete.verdict,
		outils: demarre.service.outils,
		joignableDemarre: demarre.service.joignable,
		joignableArrete: arrete.service.joignable
	};

	/* Le service DOIT être vu joignable d'un côté et injoignable de l'autre —
	   sans quoi les deux colonnes mesureraient le même état, et l'égalité de
	   leurs chiffres passerait pour une propriété. */
	if (!demarre.service.joignable) {
		refusDeMesurer.push('le service démarré n’est pas vu joignable : les deux côtés se confondent');
		return;
	}
	if (arrete.service.joignable) {
		refusDeMesurer.push('le service arrêté est encore vu joignable : les deux côtés se confondent');
		return;
	}

	/* MOITIÉ 1 — LE PRODUIT RESTE PLEINEMENT UTILISABLE. La voie
	   « application » ne sort jamais du produit (`ADR-004`) : elle doit rendre
	   EXACTEMENT le même résultat des deux côtés. */
	if (arrete.verdict.notesDeLApplication !== demarre.verdict.notesDeLApplication) {
		defauts.push({
			genre: 'utilisable',
			quoi: 'la voie « application » ne rend plus la même chose, service arrêté',
			detail:
				`service démarré : ${String(demarre.verdict.notesDeLApplication)} note(s) ; arrêté : ` +
				`${String(arrete.verdict.notesDeLApplication)}. ADR-009 : l’import Markdown ne sort ` +
				'jamais de l’application, son arrêt ne peut donc rien lui faire',
			imputable: true
		});
	}
	const memeVoieApplication = comparerLesLignes(demarre.plan, arrete.plan);
	if (memeVoieApplication.length > 0) {
		defauts.push({
			genre: 'utilisable',
			quoi: 'une ligne de la voie « application » diffère entre les deux côtés',
			detail: memeVoieApplication.join(' · '),
			imputable: true
		});
	}
	if (arrete.verdict.notes === 0) {
		defauts.push({
			genre: 'utilisable',
			quoi: 'service de conversion arrêté, AUCUN fichier ne devient une note',
			detail:
				'P-10 : l’usage du reste ne doit jamais être empêché. L’import Markdown est ' +
				'le reste, et il est empêché',
			imputable: true
		});
	}

	/* MOITIÉ 2 — LE PRODUIT SE SIGNALE DÉGRADÉ. Côté modèle : chaque échec
	   porte un motif, et le motif NOMME la brique. */
	if (arrete.verdict.sansMotif.length > 0) {
		defauts.push({
			genre: 'degrade',
			quoi: `${String(arrete.verdict.sansMotif.length)} échec(s) sans motif, service arrêté`,
			detail: arrete.verdict.sansMotif.join(' · '),
			imputable: true
		});
	}
	const injoignables = arrete.verdict.motifs.get('service-de-conversion-injoignable') ?? 0;
	if (injoignables !== arrete.verdict.echecs) {
		defauts.push({
			genre: 'degrade',
			quoi: 'un échec ne nomme pas la brique arrêtée',
			detail:
				`${String(injoignables)} échec(s) « service-de-conversion-injoignable » sur ` +
				`${String(arrete.verdict.echecs)} ; motifs : ${[...arrete.verdict.motifs].map(([m, n]) => `${m}×${String(n)}`).join(', ')}`,
			imputable: true
		});
	}

	/* JAMAIS UNE PANNE — le lot va jusqu'au bout, des deux côtés (`RG-M12-04`,
	   `C-07`). Le compte total est le premier témoin, l'ordre est le second. */
	for (const [cote, mesure] of [
		['démarré', demarre.verdict],
		['arrêté', arrete.verdict]
	]) {
		if (mesure.total !== lot.length) {
			defauts.push({
				genre: 'panne',
				quoi: `service ${cote} : le lot n’a pas été traité en entier`,
				detail: `${String(mesure.total)} ligne(s) de plan pour ${String(lot.length)} fichiers`,
				imputable: true
			});
		}
		if (!mesure.continueApresLErreur) {
			defauts.push({
				genre: 'panne',
				quoi: `service ${cote} : aucun fichier retenu APRÈS le premier échec`,
				detail:
					`premier échec « ${String(mesure.premierEchec)} », dernière retenue ` +
					`« ${String(mesure.derniereRetenue)} ». RG-M12-04 et C-07 veulent qu’un échec ` +
					'unitaire n’interrompe jamais le lot',
				imputable: true
			});
		}
	}

	/* ── §3 · LE MODE « SENS » ─────────────────────────────────────────── */
	const M2 = await vite.ssrLoadModule('/src/lib/recherche/notes-indexees.ts');
	const M3 = await vite.ssrLoadModule('/src/lib/recherche/moteur.ts');
	/** @type {readonly string[]} */
	let embeddersDuMoteur;
	try {
		/* LE MOTEUR RÉEL, ET NON LE SEUL CODE. `SENS_DISPONIBLE` est dérivé des
		   réglages que le PRODUIT projette ; ce que l'INDEX porte réellement est
		   une autre question, et c'est la seule qui vaille pour un utilisateur. */
		const client = M3.moteurDeRecherche(process.env);
		embeddersDuMoteur = (await M3.etatDeLIndex(client)).embedders;
	} catch (erreur) {
		refusDeMesurer.push(`le moteur de recherche n’a pas répondu : ${String(erreur)}`);
		return;
	}
	releve.sens = {
		conteneurEnMarche: ollamaEnMarche,
		sensDisponible: M2.SENS_DISPONIBLE,
		embeddersDesReglages: Object.keys(M2.REGLAGES_DE_L_INDEX.embedders ?? {}),
		embeddersDuMoteur
	};
	/* LE CONSTAT EST RECOUPÉ SUR LE MOTEUR RÉEL, jamais lu dans le seul code.
	   Si l'index déclarait un embedder que le produit ignore — ou l'inverse —,
	   le mode « Sens » mentirait dans un sens ou dans l'autre. */
	if (M2.SENS_DISPONIBLE !== embeddersDuMoteur.length > 0) {
		defauts.push({
			genre: 'degrade',
			quoi: 'le produit et le moteur ne disent pas la même chose du mode « Sens »',
			detail:
				`SENS_DISPONIBLE vaut ${String(M2.SENS_DISPONIBLE)}, l’index déclare ` +
				`${String(embeddersDuMoteur.length)} embedder(s) : le signal est faux d’un côté`,
			imputable: true
		});
	}
	/* LE CÔTÉ « DÉMARRÉ » DE CETTE BRIQUE N'EST PAS MESURABLE — compté, pas tu. */
	nonCouvertes.push({
		quoi: 'brique « embeddings » : le côté DÉMARRÉ n’est pas mesurable',
		detail:
			'le mode « Sens » est dérivé de l’absence d’embedder dans les réglages de l’index ' +
			'(src/lib/recherche/notes-indexees.ts) ; aucun lot n’en déclare, et aucun vecteur ' +
			'n’existe. Démarrer le conteneur ne rendrait donc pas le mode disponible : la ' +
			'dégradation a DEUX causes et la batterie n’en lève qu’une.'
	});

	if (sansEcran) return;

	/* ── §4 · L'ÉCRAN, LES DEUX BRIQUES ARRÊTÉES ───────────────────────── */
	if (!(await poserLeRedacteur())) return;
	if (!(await servirLeProduit())) return;

	const corpus = await valeursDuCorpus();
	const routes = routesMontees();
	const cookie = `codicillus_session=${JETON_DE_SESSION}`;

	/** @type {Map<string, {anonyme: object, redacteur: object}>} */
	const passeArretee = new Map();
	const ecartees = [];
	for (const route of routes) {
		const chemin = adresseDe(route, corpus);
		if (chemin === null) {
			ecartees.push(route);
			continue;
		}
		passeArretee.set(route, {
			anonyme: await observer(chemin, null),
			redacteur: await observerEnRedacteur(chemin, cookie)
		});
	}
	/* UNE INTERFÉRENCE MASSIVE N'EST PAS UNE MESURE. Quelques reprises sont le
	   bruit d'un dépôt à huit copies ; au-delà, la batterie ne mesure plus le
	   produit, elle mesure le voisinage — et elle refuse de conclure. */
	if (eprouverLaGarde && sessionsReposees === 0) {
		refusDeMesurer.push(
			'--eprouver-la-garde a effacé la session et la garde n’a pas mordu : la parade de ' +
				'P-28 est INERTE, et le balayage a mesuré des pages qu’il n’a pas vues.'
		);
		return;
	}
	if (sessionsReposees > 8) {
		refusDeMesurer.push(
			`la session du rédacteur a été effacée ${String(sessionsReposees)} fois pendant le ` +
				'balayage : une autre copie de travail purge la base partagée. La mesure n’est pas ' +
				'reproductible dans ces conditions — rejouer quand le dépôt est calme.'
		);
		return;
	}

	/* MOITIÉ 1 — PLEINEMENT UTILISABLE : aucune panne, sur aucune route, pour
	   aucun des deux personas. « Dégradé » n'est pas « en panne ». */
	for (const [route, mesures] of passeArretee) {
		for (const [persona, m] of Object.entries(mesures)) {
			let observee = m;
			if (
				sonde === 'panne-au-lieu-de-degrade' &&
				route === '/recherche' &&
				persona === 'redacteur'
			) {
				touchesDeLaSonde += 1;
				observee = {
					...m,
					code: 500,
					corps: 'TypeError: fetch failed\n    at node:internal/deps/undici\n'
				};
			}
			for (const panne of pannesDeLaReponse(observee)) {
				defauts.push({
					genre: 'panne',
					quoi: `${route} · ${persona} : ${panne}`,
					detail:
						'P-10 — dégradation, jamais panne. Les deux briques optionnelles sont ' +
						'arrêtées, et cette réponse est une panne, pas un état dégradé',
					imputable: true
				});
			}
		}
	}

	/* MOITIÉ 2 — LE SIGNALEMENT, CHERCHÉ DANS LE DOCUMENT SERVI. */
	const recherche = passeArretee.get('/recherche');
	if (recherche === undefined) {
		refusDeMesurer.push('/recherche n’a pas été demandée : le signalement n’est pas mesurable');
		return;
	}
	let documentDeRecherche = recherche.redacteur.corps;
	if (sonde === 'sens-simule') {
		/* L'OBSERVATION EST ALTÉRÉE : la page arrive sans son signalement. La
		   moitié « message clair » doit rougir — sinon elle n'est pas mesurée. */
		const avant = documentDeRecherche;
		documentDeRecherche = documentDeRecherche
			.replace(MARQUES_DU_SENS.attribut, 'data-degrade="non"')
			.replace(MARQUES_DU_SENS.phrase, 'les résultats sont là');
		if (documentDeRecherche !== avant) touchesDeLaSonde += 1;
	}
	const signalementSens = signalementDansLeDocument(documentDeRecherche, MARQUES_DU_SENS);
	releve.ecran = {
		routes: routes.length,
		demandees: passeArretee.size,
		sessionsReposees,
		ecartees,
		signalementSens,
		codeRecherche: recherche.redacteur.code
	};
	if (!signalementSens.atteintLEcran) {
		defauts.push({
			genre: 'degrade',
			quoi: 'le mode « Sens » indisponible ne se signale pas à l’écran',
			detail:
				`/recherche · rédacteur : attribut ${String(signalementSens.attribut)}, phrase ` +
				`${String(signalementSens.phrase)}. RG-M02-01 veut la bascule ANNONCÉE, et le gel ` +
				'de V-08 porte la phrase',
			imputable: true
		});
	}

	/* LE SIGNALEMENT DE LA CONVERSION — CHERCHÉ SUR LES DEUX ÉCRANS D'IMPORT,
	   et non trouvé. Les vues qui manquent de prise sont NOMMÉES, et l'absence
	   est COMPTÉE, jamais simulée côté serveur pour obtenir un vert.

	   DEUX FAMILLES, ET IL FAUT UNE MARQUE DE CHACUNE. Nommer la fonction ne
	   suffit pas — les deux pages nomment forcément l'import —, et dire
	   « indisponible » sans dire de quoi n'est pas un message clair. Le
	   signalement n'est compté ATTEINT que si le document nomme LA BRIQUE et son
	   INDISPONIBILITÉ. */
	const familles = {
		brique: ['service-de-conversion', 'service de conversion', 'import bureautique'],
		indisponibilite: ['injoignable', 'indisponible', 'momentanément', 'dégradé']
	};
	/* LES DEUX ADRESSES où le produit aurait à dire que la brique est arrêtée, et
	   CHACUNE AVEC LE PERSONA QUI L'ATTEINT : `/importer` est de niveau
	   « connecté + rédacteur », `/console/imports` de niveau « administrateur ».
	   Interroger les deux avec le même persona ferait conclure d'un 404. */
	const ecransDImport = [
		['/importer', cookie],
		['/console/imports', `codicillus_session=${JETON_DADMIN}`]
	];
	/** @type {Record<string, unknown>} */
	const parEcran = {};
	let atteint = false;
	for (const [route, biscuit] of ecransDImport) {
		const chemin = adresseDe(route, corpus);
		/* La même garde qu'au balayage, et pour la même raison : ces deux écrans
		   sont ceux dont l'ABSENCE de signalement est comptée. Les mesurer sur
		   une session effacée par une copie voisine reviendrait à compter un
		   manque sur une page qu'on n'a pas vue. */
		if (!(await sessionVivante())) {
			sessionsReposees += 1;
			await poserLeRedacteur();
		}
		const vue = chemin === null ? null : await observer(chemin, biscuit);
		const corps = vue?.corps ?? '';
		const brique = familles.brique.filter((m) => corps.includes(m));
		const indisponibilite = familles.indisponibilite.filter((m) => corps.includes(m));
		if (brique.length > 0 && indisponibilite.length > 0) atteint = true;
		parEcran[route] = {
			persona: biscuit === cookie ? 'rédacteur' : 'administrateur',
			code: vue?.code ?? null,
			octets: corps.length,
			marquesDeLaBrique: brique,
			marquesDIndisponibilite: indisponibilite
		};
	}
	releve.ecran.signalementConversion = { parEcran, atteint };
	if (!atteint) {
		nonCouvertes.push({
			quoi: 'brique « conversion » : la moitié « se signale dégradé » N’ATTEINT PAS L’ÉCRAN',
			detail:
				'V-24 et V-35 sont les vues concernées, et le manque n’est pas au même endroit ' +
				'dans les deux. V-35 PORTE une prise — le panneau « Fichiers en échec » de son ' +
				'dialogue de rapport rend une phrase française par fichier ' +
				'(mockups/V-35-console-imports.html:3117-3140) —, mais les trois phrases que le ' +
				'gel y met nomment le défaut DU FICHIER : protégé par mot de passe, format ' +
				'antérieur à 2007, structure endommagée (:2494, :2502, :2510). AUCUNE ne nomme ' +
				'une brique indisponible, et le mot « indisponible » n’apparaît dans V-24 comme ' +
				'dans V-35 que dans la palette de recherche du socle (:1381 et :1390), pour le ' +
				'mode « Sens ». V-24, elle, n’a pas de prise du tout : son nœud de rapport est ' +
				'vide et caché dans les sept états gelés, l’étape 4 n’est atteignable par aucune ' +
				'adresse (docs/routes.md:297), et la route rend toujours l’étape 1. Enfin les ' +
				'motifs sont des CODES : le « catalogue de messages en français » de STACK §4.7 ' +
				'n’existe pas au dépôt. Le motif est donc calculé, exact, et invisible. ' +
				'ADR-009 nomme la suite : « l’absence d’un tel état est un vide de spécification ' +
				'à remonter, pas à combler ».'
		});
	}

	/* ── LA SECONDE PASSE, SERVICE DÉMARRÉ : « comme avant », à l'octet ──
	   Aucune route de lecture n'appelle la brique optionnelle ; l'identité des
	   octets est donc la forme la plus forte de « pleinement utilisable ». */
	if (!(await demarrerLaConversion())) return;
	let compares = 0;
	const divergentes = [];
	const horsComparaison = [];
	for (const [route, mesures] of passeArretee) {
		const chemin = adresseDe(route, corpus);
		if (chemin === null) continue;
		const apres = await observerEnRedacteur(chemin, cookie);
		/* SEULES LES RÉPONSES DE DOCUMENT SE COMPARENT À L'OCTET. Une archive
		   porte des horodatages d'entrée : deux exports identiques n'ont pas les
		   mêmes octets, et l'exiger fabriquerait un défaut qui n'en est pas un.
		   Ce qui en sort est COMPTÉ, jamais tu. */
		if (!mesures.redacteur.type.includes('text/html')) {
			horsComparaison.push(`${route} (${mesures.redacteur.type || 'sans type'})`);
			continue;
		}
		compares += 1;
		if (apres.code !== mesures.redacteur.code || apres.corps !== mesures.redacteur.corps) {
			divergentes.push(
				`${route} (${String(mesures.redacteur.code)}/${String(mesures.redacteur.corps.length)} o ` +
					`contre ${String(apres.code)}/${String(apres.corps.length)} o)`
			);
		}
	}
	releve.ecran.aLOctet = { compares, divergentes, horsComparaison };
	if (divergentes.length > 0) {
		defauts.push({
			genre: 'utilisable',
			quoi: `${String(divergentes.length)} route(s) ne répondent pas « comme avant »`,
			detail:
				'la seule différence entre les deux passes est l’état du conteneur optionnel : ' +
				divergentes.join(' · '),
			imputable: true
		});
	}
}

/** Les lignes de la voie « application », comparées champ à champ. */
function comparerLesLignes(planA, planB) {
	const ecarts = [];
	const cleDe = (l) =>
		JSON.stringify([l.chemin, l.sort, l.identifiant, l.titre, l.segments, l.etiquettes, l.motif]);
	const parChemin = new Map(planB.lignes.map((l) => [l.chemin, l]));
	for (const a of planA.lignes) {
		if (a.voie !== 'application') continue;
		const b = parChemin.get(a.chemin);
		if (b === undefined) {
			ecarts.push(`${a.chemin} absente du second plan`);
			continue;
		}
		if (cleDe(a) !== cleDe(b)) ecarts.push(`${a.chemin} : ${cleDe(a)} contre ${cleDe(b)}`);
	}
	return ecarts;
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. LE RAPPORT, PUIS LA REMISE EN ÉTAT — dans cet ordre, et toujours
   ═════════════════════════════════════════════════════════════════════════ */

let etatRendu = null;
try {
	await mesurer();
} catch (erreur) {
	refusDeMesurer.push(`la batterie s’est interrompue : ${String(erreur?.stack ?? erreur)}`);
} finally {
	produit?.kill('SIGTERM');
	retirerLeConteneur();
	try {
		etatRendu = await rendreLaBase();
	} catch (erreur) {
		refusDeMesurer.push(`la base n’a pas pu être rendue : ${String(erreur)}`);
	}
	await bassin.end().catch(() => {});
	await vite?.close().catch(() => {});
}

console.log('\n  BATTERIE 14 — LES DEUX BRIQUES OPTIONNELLES ARRÊTÉES (P-10, ADR-009)\n');

console.log('  §1 · LA PROPRIÉTÉ DE COMPOSITION — lue dans compose.yaml, pas supposée');
for (const [nom, s] of composition.services) {
	console.log(
		`    ${nom.padEnd(11)} ${(s.optionnel ? 'OPTIONNEL' : 'critique ').padEnd(10)} ` +
			`depends_on: ${s.dependsOn.join(', ') || '(aucun)'}`
	);
}
console.log(
	`    santé d’app : ${
		(composition.services.get('app')?.sante ?? '').includes('127.0.0.1:3000')
			? 'elle-même, aucune brique optionnelle traversée'
			: 'AUTRE CHOSE — voir les défauts'
	}`
);

if (releve.conversion.demarre !== undefined) {
	const d = releve.conversion.demarre;
	const a = releve.conversion.arrete;
	console.log(`\n  §2 · LE SERVICE DE CONVERSION — conteneur « ${CONTENEUR} »`);
	console.log(
		`    outils            ${Object.entries(releve.conversion.outils)
			.map(([o, v]) => `${o} ${String(v)}`)
			.join(' · ')}`
	);
	console.log('                      démarré      arrêté');
	console.log(
		`    notes             ${String(d.notes).padStart(7)}      ${String(a.notes).padStart(6)}`
	);
	console.log(
		`    dont voie appli   ${String(d.notesDeLApplication).padStart(7)}      ${String(a.notesDeLApplication).padStart(6)}`
	);
	console.log(
		`    échecs            ${String(d.echecs).padStart(7)}      ${String(a.echecs).padStart(6)}`
	);
	console.log(
		`    écartés           ${String(d.ignores).padStart(7)}      ${String(a.ignores).padStart(6)}`
	);
	console.log(
		`    motifs démarré    ${[...d.motifs].map(([m, n]) => `${m}×${String(n)}`).join(' · ') || '(aucun)'}`
	);
	console.log(
		`    motifs arrêté     ${[...a.motifs].map(([m, n]) => `${m}×${String(n)}`).join(' · ') || '(aucun)'}`
	);
	console.log(
		`    le lot continue   démarré ${String(d.continueApresLErreur)} · arrêté ${String(a.continueApresLErreur)}\n` +
			`                      dernière retenue arrêté : ${String(a.derniereRetenue)}`
	);
}

if (releve.sens.sensDisponible !== undefined) {
	console.log('\n  §3 · LE MODE « SENS » — dérivé, jamais codé en dur');
	console.log(
		`    conteneur ollama  ${releve.sens.conteneurEnMarche.length === 0 ? 'ARRÊTÉ (aucun en marche)' : releve.sens.conteneurEnMarche.join(', ')}`
	);
	console.log(`    SENS_DISPONIBLE   ${String(releve.sens.sensDisponible)}`);
	console.log(
		`    embedders         réglages du produit : ${releve.sens.embeddersDesReglages.length} · ` +
			`index réel du moteur : ${releve.sens.embeddersDuMoteur.length}`
	);
}

if (releve.ecran.routes !== undefined) {
	console.log('\n  §4 · L’ÉCRAN — le produit construit et servi, les deux briques arrêtées');
	console.log(
		`    routes            ${String(releve.ecran.demandees)} demandées sur ${String(releve.ecran.routes)} montées ` +
			`· écartées : ${releve.ecran.ecartees.join(', ') || '(aucune)'}\n` +
			`                      session du rédacteur reposée ${String(releve.ecran.sessionsReposees)} fois ` +
			'(une autre copie purge la base partagée — P-28)'
	);
	console.log(
		`    /recherche        code ${String(releve.ecran.codeRecherche)} · attribut ` +
			`${String(releve.ecran.signalementSens.attribut)} · phrase ${String(releve.ecran.signalementSens.phrase)} ` +
			`→ ${releve.ecran.signalementSens.atteintLEcran ? 'LE SIGNALEMENT ATTEINT L’ÉCRAN' : 'NON ATTEINT'}`
	);
	for (const [route, c] of Object.entries(releve.ecran.signalementConversion.parEcran)) {
		console.log(
			`    ${route.padEnd(17)} ${c.persona} · code ${String(c.code)} · ${String(c.octets)} o · ` +
				`nomme la brique : ${c.marquesDeLaBrique.join(', ') || 'NON'} · nomme ` +
				`l’indisponibilité : ${c.marquesDIndisponibilite.join(', ') || 'NON'}`
		);
	}
	if (releve.ecran.aLOctet !== undefined) {
		console.log(
			`    à l’octet         ${String(releve.ecran.aLOctet.compares)} route(s) comparées entre les deux ` +
				`états du conteneur · ${String(releve.ecran.aLOctet.divergentes.length)} divergence(s)\n` +
				`                      hors comparaison (réponse non-document) : ` +
				`${releve.ecran.aLOctet.horsComparaison.join(', ') || '(aucune)'}`
		);
	}
}

if (etatRendu !== null) {
	console.log(`\n  base rendue propre : ${JSON.stringify(etatRendu)}`);
}
console.log(`  conteneur retiré   : ${CONTENEUR}`);

if (defauts.length > 0) {
	console.error(`\n  ÉCHEC — ${String(defauts.length)} défaut(s) mesuré(s) :`);
	for (const d of defauts) console.error(`    [${d.genre}] ${d.quoi}\n        ${d.detail}`);
}
if (nonCouvertes.length > 0) {
	console.error(
		`\n  ÉCHEC PAR NON-COUVERTURE — ${String(nonCouvertes.length)} moitié(s) de P-10 que`
	);
	console.error(
		'  cette batterie ne peut PAS établir. Ce n’est pas une réussite : c’est le mode de'
	);
	console.error(
		'  défaillance RA-01, et le chiffre doit descendre par un lot, jamais par un seuil.'
	);
	for (const n of nonCouvertes) console.error(`    ${n.quoi}\n        ${n.detail}`);
}

console.log(
	`\n  EMPREINTE ${String(defauts.length)} défaut(s) · ${String(nonCouvertes.length)} non-couverture(s) · ` +
		`${String(refusDeMesurer.length)} refus\n`
);

if (refusDeMesurer.length > 0) {
	console.error('  REFUS DE MESURER :');
	for (const r of refusDeMesurer) console.error(`    ${r}`);
	console.error('');
}

const rougit = refusDeMesurer.length > 0 || defauts.length > 0 || nonCouvertes.length > 0;

if (sonde === undefined) {
	if (!rougit) {
		console.log(
			'  Les deux briques optionnelles arrêtées, le produit reste pleinement utilisable\n' +
				'  et se signale dégradé — sur les deux moitiés, et pour les deux briques.\n'
		);
	}
	exit(refusDeMesurer.length > 0 ? 2 : rougit ? 1 : 0);
}

const genreDeLaSonde = GENRES_DE_SONDE[sonde] ?? 'inconnu';
const imputables = defauts.filter((d) => d.imputable === true).length;
console.log(
	`  sonde ${sonde} (${genreDeLaSonde}) : ${String(touchesDeLaSonde)} touche(s), ` +
		`${String(imputables)} défaut(s) imputable(s) sur ${String(defauts.length)}.`
);
if (touchesDeLaSonde === 0) {
	console.error(
		'  REFUS DE CONCLURE : la mutation est INERTE — elle n’a rien touché, donc elle ne\n' +
			'  teste rien. C’est le mode de défaillance RA-01, et il ne se lit pas comme une panne.\n'
	);
	exit(1);
}
/* La batterie porte des NON-COUVERTURES de fond : `rougit` est vrai quoi qu'une
   sonde fasse. Une sonde d'observation serait donc verte par les manques
   d'autrui. On exige d'elle un défaut QUI LUI SOIT IMPUTABLE. */
if (genreDeLaSonde === 'observation' && imputables === 0) {
	console.error(
		`  REFUS DE CONCLURE : la mutation a touché ${String(touchesDeLaSonde)} observation(s), et\n` +
			'  AUCUN des défauts mesurés ne lui est imputable. Elle serait verte par les manques\n' +
			'  des autres, pas par ce qu’elle éprouve — RA-01, sous la forme la moins visible.\n'
	);
	exit(1);
}
/* Une sonde de CONFIGURATION ne peut pas être imputée observation par
   observation : elle change la structure lue, et le défaut est structurel. On
   exige alors qu'un défaut de STRUCTURE ait été levé. */
if (genreDeLaSonde === 'configuration' && !defauts.some((d) => d.genre === 'structure')) {
	console.error(
		'  REFUS DE CONCLURE : la mutation a changé la composition et AUCUN défaut de structure\n' +
			'  n’a été levé. La sonde serait verte par les manques des autres — RA-01.\n'
	);
	exit(1);
}
console.log(
	rougit
		? '  la batterie a dit non — code de retour inversé, 0.\n'
		: '  la batterie n’a rien vu — 1.\n'
);
exit(rougit ? 0 : 1);
