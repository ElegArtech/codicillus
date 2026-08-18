/**
 * Mode démo de l'implémentation — la route `/__design/V-xx?etat=…`.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier. Détourner
 * l'adresse d'un état vers un écran qui passe est le contournement de
 * vérification nommé par PLAN §12 : le banc certifierait alors autre chose que
 * ce qu'il croit mesurer. La sortie légitime d'un rouge est le protocole
 * d'écart. C'est aussi pourquoi le mode démo est écrit ICI, dans `verif/`, et
 * non par le lot qui portera la vue : un implémenteur qui écrit le chemin par
 * lequel il sera mesuré écrit sa propre note (ÉCART-011 É-1).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CETTE ROUTE EXISTE
 *
 * `règles/workflow_agentic.md` annexe F la spécifie depuis le début : un
 * « mode démo de l'implémentation rendant chaque état avec les fixtures —
 * route /__design/V-xx?state=…, builds de développement uniquement ».
 *
 * Elle est le SEUL moyen pour le banc d'atteindre un état côté application.
 * La maquette gelée a une planche de revue : le banc coche une position et
 * l'écran change. L'application n'en a pas, n'en aura pas, et ne doit pas en
 * avoir — une planche de revue dans le produit serait un contrôle de maquette
 * livré à l'utilisateur. Sans cette route, `--contre=app` n'a pas de chemin :
 * c'est le constat exact d'`ECART-011` É-1.
 *
 * Le paramètre est nommé `etat` et non `state` : le dépôt est en français
 * jusque dans les clés de ses scénarios (`cle`, `libelle`, `vecteur`), et
 * `verif/scenarios/V-xx.json` nomme les états en français. Une route qui
 * traduirait ses clés en anglais imposerait une table de correspondance de
 * plus, donc une occasion de plus de se tromper. La divergence avec la lettre
 * de l'annexe F est déclarée, pas subie.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DÉVELOPPEMENT UNIQUEMENT — ET STRUCTURELLEMENT, PAS PAR POLITESSE
 *
 * Le mode démo n'est pas une route SvelteKit gardée par un `if (dev)`. Une
 * telle route existerait dans le build de production, y répondrait 404 et y
 * embarquerait son code : la garde serait une convention, révocable d'une
 * ligne. Ici, c'est un greffon Vite en `apply: 'serve'` — il n'est monté que
 * par le serveur de développement. `pnpm build` ne le traverse jamais, aucun
 * module de `verif/` n'entre dans le graphe applicatif, et le produit servi
 * par `node build/index.js` ne connaît pas l'adresse.
 *
 * Vérifiable en deux commandes, et c'est le critère de sortie du lot :
 *   pnpm build && grep -r "__design" build/     → aucune occurrence
 *   node build/index.js & curl -o /dev/null -w '%{http_code}' …/__design/V-37
 *                                               → 404
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX SOURCES, ET UNE SEULE PROUVE UNE CONFORMITÉ
 *
 *   source=app     — l'implémentation de la vue par l'application, nourrie de
 *                    `seeds/corpus.ts`. C'est le régime de conformité. Aucune
 *                    vue n'existe : la route REFUSE bruyamment, en 501, plutôt
 *                    que de rendre une page vide qui sortirait en vert sans
 *                    rien prouver (mode de défaillance RA-01, PLAN §12).
 *
 *   source=etalon  — la maquette gelée elle-même, servie par le mode démo et
 *                    pilotée par le paramètre `etat`. ELLE NE PROUVE AUCUNE
 *                    CONFORMITÉ. Elle prouve la PLOMBERIE : deux serveurs,
 *                    deux adresses, deux protocoles d'état — la planche d'un
 *                    côté, l'adresse de l'autre —, un seul verdict. C'est
 *                    l'étalonnage du régime `app` : un candidat connu
 *                    identique, dont on exige zéro pixel divergent. Sans lui,
 *                    le premier rouge d'une vraie vue serait indiscernable
 *                    d'un défaut de harnais.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA ROUTE NE FAIT PAS
 *
 * Elle ne règle NI l'horloge, NI le fuseau, NI les animations, NI la densité
 * de pixels : ce sont les conditions de capture, elles appartiennent à
 * `verif/banc/conditions.mjs` et sont appliquées par le banc, à l'identique
 * des deux côtés, par le même code. Une route qui les réglerait elle-même
 * ferait exister un second jeu de conditions, jumeau du premier — donc
 * divergent au premier oubli (PLAN §4.2).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Le préfixe d'adresse du mode démo — annexe F. */
export const PREFIXE = '/__design';

/** Le paramètre d'état, en français comme le reste du dépôt. */
export const PARAMETRE_ETAT = 'etat';

/** Le répertoire où une vue implémentée est attendue. */
export const DOSSIER_VUES = 'src/vues';

const PROTOCOLE = JSON.parse(
	readFileSync(join(racine, 'verif', 'references', 'protocole-app.json'), 'utf8')
);

/**
 * L'adresse du mode démo pour un état, telle que le banc doit la construire.
 * Elle est lue du protocole en écriture humaine seule, jamais recomposée à la
 * main dans deux endroits.
 *
 * @param {string} vue
 * @param {string} etat
 * @param {string} [source]
 * @param {number} [differeMs] délai d'application de l'état, en millisecondes
 *   d'horloge — celle du banc quand il en installe une. Le banc y passe son
 *   propre budget de stabilisation, pour que l'état soit atteint des deux
 *   côtés au même instant. Sans lui : immédiatement.
 * @returns {string} chemin relatif, à concaténer à la base du candidat
 */
export function adresseDeLEtat(vue, etat, source = 'app', differeMs = 0) {
	const particulier = PROTOCOLE.vues?.[vue];
	const gabarit = particulier?.etats?.[etat] ?? particulier?.route ?? PROTOCOLE.route;
	let chemin = String(gabarit)
		.replace('{vue}', encodeURIComponent(vue))
		.replace('{etat}', encodeURIComponent(etat));
	const ajouter = (/** @type {string} */ parametre) => {
		chemin += `${chemin.includes('?') ? '&' : '?'}${parametre}`;
	};
	if (source !== 'app') ajouter(`source=${encodeURIComponent(source)}`);
	if (differeMs > 0) ajouter(`differe=${differeMs}`);
	return chemin;
}

/* ── Lecture des scénarios ──────────────────────────────────────────────────
   Le mode démo ne connaît pas les états : il les LIT dans le scénario produit
   mécaniquement depuis la maquette gelée. Une route qui porterait sa propre
   liste d'états divergerait de la maquette au premier regel, sans que rien ne
   le dise. */
/** @param {string} vue */
function scenarioDe(vue) {
	const chemin = join(racine, 'verif', 'scenarios', `${vue}.json`);
	if (!existsSync(chemin)) return null;
	return JSON.parse(readFileSync(chemin, 'utf8'));
}

/** @param {string} vue */
function maquetteDe(vue) {
	const trouve = readdirSync(join(racine, 'mockups')).filter(
		(f) => f.startsWith(`${vue}-`) && f.endsWith('.html')
	);
	return trouve.length === 1 ? trouve[0] : null;
}

/* ── Réponses ─────────────────────────────────────────────────────────────── */

/**
 * @param {import('node:http').ServerResponse} reponse
 * @param {number} code
 * @param {string} corps
 * @param {string} [type]
 */
function repondre(reponse, code, corps, type = 'text/html; charset=utf-8') {
	reponse.statusCode = code;
	reponse.setHeader('content-type', type);
	// Aucun cache : deux captures successives doivent parcourir le même chemin
	// de chargement, exactement comme du côté de la maquette gelée.
	reponse.setHeader('cache-control', 'no-store');
	reponse.end(corps);
}

/** @param {string} texte */
function echapper(texte) {
	return texte
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Page de refus — elle NOMME ce qui manque et où l'écrire. Un 501 muet
 * enverrait l'exécutant chercher la cause dans le banc.
 * @param {import('node:http').ServerResponse} reponse
 * @param {number} code
 * @param {string} titre
 * @param {string[]} lignes
 */
function refuser(reponse, code, titre, lignes) {
	repondre(
		reponse,
		code,
		`<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
			`<title>${echapper(titre)}</title></head><body>` +
			`<h1>${echapper(titre)}</h1>` +
			lignes.map((l) => `<p>${l}</p>`).join('') +
			`</body></html>`
	);
}

/* ── source=etalon — la maquette gelée, pilotée par l'adresse ────────────────
   Le document servi est celui du gel, à deux insertions près, toutes deux
   invisibles au rendu comme à l'arbre d'accessibilité :

     • `<base href="/">` — la maquette charge ses polices par un chemin
       relatif (`polices/polices.css`). Servie sous `/__design/V-37`, elle les
       résoudrait en `/__design/polices/…`. La base les renvoie sur
       `/polices/…`, que l'application sert depuis `static/polices/` — les
       mêmes fichiers, installés du même gel par `pnpm socle:extraire`, et dont
       `pnpm verif:jetons` prouve l'identité. Le candidat charge donc les
       polices du produit, pas celles de la maquette : c'est une propriété
       vérifiée en plus, pas une commodité.

     • un script d'application d'état, inséré APRÈS les scripts de la maquette
       — donc après que celle-ci a posé ses écouteurs `change`. Il lit
       `?etat=` et applique le VECTEUR COMPLET de cet état, jamais un delta :
       un état est un réglage complet, sinon l'ordre de parcours déterminerait
       le rendu.

   LE VECTEUR EST APPLIQUÉ AU MÊME INSTANT VIRTUEL QUE DU CÔTÉ RÉFÉRENCE, et
   c'est l'étalonnage qui l'a exigé. Le banc ouvre la page, stabilise en
   avançant l'horloge d'`AVANCE_CHARGEMENT_MS`, PUIS règle la planche. Une
   première version appliquait le vecteur au chargement, à t = 0 : DOUZE ÉTATS
   SUR 333 DIVERGEAIENT — dialogues de suppression, états de chargement,
   notifications —, tous parce que le basculement précédait des minuteries de
   chargement qu'il aurait dû suivre. C'est exactement ce que l'étalonnage
   existe pour trouver, et ce qu'aucune vue implémentée n'aurait permis de
   distinguer d'un défaut d'implémentation.

   Le délai n'est pas décidé ici : il est passé par le banc, en `&differe=`,
   parce que c'est le banc qui connaît son propre budget d'horloge. Une route
   qui porterait sa copie de la constante en ferait un second réglage jumeau du
   premier — donc divergent au premier oubli (PLAN §4.2). Par défaut, sans
   paramètre, l'état est appliqué immédiatement : c'est l'usage humain.

   Cette temporisation ne concerne QUE la source `etalon`, qui rejoue la
   maquette et sa planche. Une vue applicative, elle, reçoit son état par
   l'adresse, avant son premier rendu : il n'y a rien à rejouer, donc rien à
   différer.

   Ce que cette source prouve, et ce qu'elle ne prouve pas, est écrit en tête
   de fichier. Le banc le réimprime à chaque exécution : personne ne doit
   pouvoir lire « conforme » sans lire « candidat = maquette gelée ». */
/**
 * @param {import('node:http').ServerResponse} reponse
 * @param {string} vue
 * @param {string} cleEtat
 * @param {number} differeMs
 */
function servirEtalon(reponse, vue, cleEtat, differeMs) {
	const fichier = maquetteDe(vue);
	const scenario = scenarioDe(vue);
	if (!fichier || !scenario) {
		refuser(reponse, 404, `Vue ${echapper(vue)} inconnue`, [
			`Aucune maquette ni scénario pour <code>${echapper(vue)}</code>.`
		]);
		return;
	}
	const etat = scenario.etats.find((/** @type {{cle: string}} */ e) => e.cle === cleEtat);
	if (!etat) {
		refuser(reponse, 400, `État « ${echapper(cleEtat)} » inconnu de ${echapper(vue)}`, [
			'États déclarés : ' +
				scenario.etats
					.map((/** @type {{cle: string}} */ e) => `<code>${echapper(e.cle)}</code>`)
					.join(', '),
			'Les états sont ceux de <code>verif/scenarios/' +
				echapper(vue) +
				'.json</code>, extraits de la maquette gelée.'
		]);
		return;
	}

	const html = readFileSync(join(racine, 'mockups', fichier), 'utf8');
	const vecteur = etat.vecteur ?? scenario.defaut ?? {};
	const script =
		`<script>/* mode démo — application de l'état « ${etat.cle} », vecteur complet */\n` +
		`(function () {\n` +
		`  var v = ${JSON.stringify(vecteur)};\n` +
		`  if (${differeMs} > 0) setTimeout(appliquer, ${differeMs}); else appliquer();\n` +
		`  function appliquer() {\n` +
		`  for (var nom in v) {\n` +
		`    var valeur = v[nom];\n` +
		`    if (typeof valeur === 'boolean') {\n` +
		`      var c = document.getElementById(nom);\n` +
		`      if (!c) throw new Error('mode démo : case « ' + nom + ' » introuvable');\n` +
		`      if (c.checked !== valeur) { c.checked = valeur; c.dispatchEvent(new Event('change', { bubbles: true })); }\n` +
		`    } else {\n` +
		`      var r = document.querySelector('.planche input[name="' + nom + '"][value="' + valeur + '"]');\n` +
		`      if (!r) throw new Error('mode démo : position « ' + nom + '=' + valeur + ' » introuvable');\n` +
		`      if (!r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }\n` +
		`    }\n` +
		`  }\n` +
		`  }\n` +
		`})();</script>\n`;

	const avecBase = html.replace(/<head>/i, '<head>\n<base href="/">');
	const servi = avecBase.replace(/<\/body>/i, `${script}</body>`);
	repondre(reponse, 200, servi);
}

/* ── source=app — l'implémentation de la vue ─────────────────────────────────
   Convention : `src/vues/V-xx.svelte`, la même famille de noms que la feuille
   portée `src/vues/V-xx.css` que contrôle P-6.3. Le composant reçoit l'état
   demandé et le corpus de sa variante — `corpusPourVue()` de `seeds/corpus.ts`,
   qui rend le sous-ensemble EXACT que la maquette utilise. Le nourrir du
   corpus complet ferait diverger la comparaison pour une raison qui n'a rien
   à voir avec la vue.

   Le rendu est un rendu SERVEUR, sans hydratation : ARB-011 a tranché que le
   squelette rend l'ÉTAT, jamais la transition. Une capture est un instant. */
/**
 * @param {{ ssrLoadModule: (id: string) => Promise<any> }} serveur
 * @param {import('node:http').ServerResponse} reponse
 * @param {string} vue
 * @param {string} cleEtat
 */
async function servirApp(serveur, reponse, vue, cleEtat) {
	const scenario = scenarioDe(vue);
	if (!scenario) {
		refuser(reponse, 404, `Vue ${echapper(vue)} inconnue`, [
			`Aucun scénario pour <code>${echapper(vue)}</code>.`
		]);
		return;
	}
	const etat = scenario.etats.find((/** @type {{cle: string}} */ e) => e.cle === cleEtat);
	if (!etat) {
		refuser(reponse, 400, `État « ${echapper(cleEtat)} » inconnu de ${echapper(vue)}`, [
			'États déclarés : ' +
				scenario.etats
					.map((/** @type {{cle: string}} */ e) => `<code>${echapper(e.cle)}</code>`)
					.join(', ')
		]);
		return;
	}

	const composant = `${DOSSIER_VUES}/${vue}.svelte`;
	if (!existsSync(join(racine, composant))) {
		refuser(reponse, 501, `${echapper(vue)} n’est pas implémentée`, [
			`Le mode démo attend <code>${echapper(composant)}</code> ; ce fichier n’existe pas.`,
			`Aucun écran n’est rendu, et c’est délibéré : servir une page vide ferait sortir ` +
				`le banc en vert sans rien prouver — le mode de défaillance RA-01 du plan (§12).`,
			`Le lot qui portera ${echapper(vue)} écrit ce composant ; le mode démo, lui, ` +
				`n’est pas à écrire : il est déjà là.`,
			`Pour étalonner la plomberie sans implémentation, ajouter ` +
				`<code>&amp;source=etalon</code> — la maquette gelée devient le candidat, et ` +
				`l’exigence est zéro pixel divergent.`
		]);
		return;
	}

	/* ÉCART-013 É-1 — `render` DOIT venir du graphe de modules de Vite, jamais de
	   l'exemplaire ESM de Node. Le composant est chargé par ssrLoadModule() ; deux
	   exemplaires de `svelte/internal/server` coexisteraient, `ssr_context` serait nul
	   dans push_element, et TOUT composant rendrait 500 — y compris `<p>essai</p>`.
	   L'étalonnage `--source=etalon` ne l'a jamais rencontré : il sert la maquette
	   gelée sans passer par render(). C'est le trou de cet étalonnage, et il est
	   comblé par le contrôle `--source=composant` (verif/mode-demo-rend.mjs). */
	const { render } = await serveur.ssrLoadModule('svelte/server');
	const module = await serveur.ssrLoadModule(`/${composant}`);
	const semence = await serveur.ssrLoadModule('/seeds/corpus.ts');
	const rendu = render(module.default, {
		props: { etat: etat.cle, vecteur: etat.vecteur ?? null, notes: semence.corpusPourVue(vue) }
	});

	const feuilleDeVue = existsSync(join(racine, DOSSIER_VUES, `${vue}.css`))
		? `<link rel="stylesheet" href="/${DOSSIER_VUES}/${vue}.css?direct">`
		: '';
	repondre(
		reponse,
		200,
		`<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
			`<meta name="viewport" content="width=device-width, initial-scale=1">` +
			`<title>${echapper(scenario.titre ?? vue)} — mode démo</title>` +
			`<link rel="stylesheet" href="/polices/polices.css">` +
			`<link rel="stylesheet" href="/src/socle.css?direct">` +
			feuilleDeVue +
			rendu.head +
			`</head><body>${rendu.body}</body></html>`
	);
}

/* ── L'index, pour l'usage humain ─────────────────────────────────────────── */
/** @param {import('node:http').ServerResponse} reponse */
function servirIndex(reponse) {
	const vues = readdirSync(join(racine, 'verif', 'scenarios'))
		.filter((f) => /^V-\d\d\.json$/.test(f))
		.sort()
		.map((f) => f.slice(0, 4));
	const lignes = vues.map((vue) => {
		const s = scenarioDe(vue);
		const etats = (s?.etats ?? []).map(
			(/** @type {{cle: string, libelle: string}} */ e) =>
				`<li><a href="${PREFIXE}/${vue}?${PARAMETRE_ETAT}=${encodeURIComponent(e.cle)}">${echapper(e.cle)}</a> ` +
				`— ${echapper(e.libelle ?? '')} ` +
				`(<a href="${PREFIXE}/${vue}?${PARAMETRE_ETAT}=${encodeURIComponent(e.cle)}&source=etalon">étalon</a>)</li>`
		);
		return `<h2>${echapper(vue)} — ${echapper(s?.titre ?? '')}</h2><ul>${etats.join('')}</ul>`;
	});
	repondre(
		reponse,
		200,
		`<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
			`<title>Mode démo — Codicillus</title></head><body>` +
			`<h1>Mode démo de l’implémentation</h1>` +
			`<p>Développement uniquement. Chaque état de chaque vue, nourri de ` +
			`<code>seeds/corpus.ts</code>. <code>source=etalon</code> sert la maquette gelée ` +
			`à la place de l’implémentation : c’est l’étalonnage du régime <code>app</code> ` +
			`du banc, jamais une preuve de conformité.</p>` +
			lignes.join('') +
			`</body></html>`
	);
}

/**
 * Le greffon Vite. `apply: 'serve'` : il n'est monté que par le serveur de
 * développement, et n'existe donc pas dans un build de production.
 */
export function modeDemo() {
	return {
		name: 'codicillus:mode-demo',
		apply: /** @type {'serve'} */ ('serve'),
		/** @param {{ middlewares: { use: (gestionnaire: Function) => void }, ssrLoadModule: (id: string) => Promise<any> }} serveur */
		configureServer(serveur) {
			serveur.middlewares.use(
				/**
				 * @param {import('node:http').IncomingMessage} requete
				 * @param {import('node:http').ServerResponse} reponse
				 * @param {(erreur?: unknown) => void} suite
				 */
				async (requete, reponse, suite) => {
					const adresse = new URL(requete.url ?? '/', 'http://127.0.0.1');
					if (!adresse.pathname.startsWith(PREFIXE)) {
						suite();
						return;
					}
					try {
						if (adresse.pathname === PREFIXE || adresse.pathname === `${PREFIXE}/`) {
							servirIndex(reponse);
							return;
						}
						const m = /^\/__design\/(V-\d\d)\/?$/.exec(adresse.pathname);
						if (!m) {
							refuser(reponse, 404, 'Adresse inconnue du mode démo', [
								`Forme attendue : <code>${PREFIXE}/V-xx?${PARAMETRE_ETAT}=cle</code>.`,
								`<a href="${PREFIXE}/">Index des vues et des états</a>`
							]);
							return;
						}
						const vue = m[1] ?? '';
						const scenario = scenarioDe(vue);
						const parDefaut =
							scenario?.etats?.find((/** @type {{defaut: boolean}} */ e) => e.defaut)?.cle ??
							scenario?.etats?.[0]?.cle ??
							'';
						const cleEtat = adresse.searchParams.get(PARAMETRE_ETAT) ?? parDefaut;
						const source = adresse.searchParams.get('source') ?? 'app';
						const differe = Number(adresse.searchParams.get('differe') ?? '0');
						if (source === 'etalon') servirEtalon(reponse, vue, cleEtat, differe);
						else if (source === 'app') await servirApp(serveur, reponse, vue, cleEtat);
						else {
							refuser(reponse, 400, `Source « ${echapper(source)} » inconnue`, [
								'Sources : <code>app</code> (l’implémentation) ou <code>etalon</code> ' +
									'(la maquette gelée, pour étalonner le régime <code>app</code> du banc).'
							]);
						}
					} catch (erreur) {
						suite(erreur);
					}
				}
			);
		}
	};
}
