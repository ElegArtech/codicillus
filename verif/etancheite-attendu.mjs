/**
 * BATTERIE 6 — LA PART PURE : ce que le dépôt ATTEND, lu à la source.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA RÈGLE QUI GOUVERNE TOUT CE FICHIER : L'ATTENDU NE VIENT JAMAIS DU CANDIDAT
 *
 * `src/lib/auth/garde.ts` porte une table de régimes par préfixe. Elle est
 * exactement ce que cette batterie MESURE : la lire pour en tirer l'attendu
 * rendrait la batterie tautologique — elle serait verte quoi qu'on écrive dans
 * la table, y compris une fuite. Aucune ligne de ce module n'importe
 * `src/lib/auth/**`.
 *
 * L'attendu vient de `docs/routes.md`, extrait MÉCANIQUEMENT :
 *
 *   §3   « Table maîtresse » — la colonne « Niveau d'accès », route par route.
 *        C'est elle qui distingue « connecté + lecteur » de « connecté +
 *        rédacteur », distinction que §5.5 ne fait pas.
 *   §5.5 « Matrice d'accès et comportement en cas de refus » — la FORME de la
 *        réponse par famille et par persona : servi, 404, ou 302. Elle porte
 *        déjà `ARB-052` (`:369-373`), donc les six chemins fixes y redirigent
 *        en anonyme.
 *
 * `docs/routes.md` n'est pas une source de préséance — `ARB-052` le dit :
 * « c'est un INVENTAIRE, opposable comme relevé, jamais comme décision ». Mais
 * c'est le seul relevé exhaustif des 39 routes, et il est tenu à jour par
 * arbitrage. Là où il se tait, ce module DÉCLARE, et cite la ligne : rien n'est
 * deviné en silence.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SIX PERSONAS, ET CE QUE LE CORPUS PERMET D'EN INCARNER
 *
 * `PLAN-DE-REALISATION.md:341` : « anonyme, contributeur sans droit, lecteur,
 * rédacteur, gestionnaire, administrateur ». Le corpus porte CINQ comptes et
 * AUCUN droit explicite de dossier (`seeds/corpus.ts`, mesuré). Les trois
 * personas de droit sont donc posés en GABARIT DÉCLARÉ par la batterie —
 * `T-011` avait choisi la même voie —, sur le même compte, le droit étant
 * réécrit entre les passes. Un compte fabriqué serait une semence inventée.
 *
 * Un SEPTIÈME persona s'ajoute, et il est réel : le COMPTE DÉSACTIVÉ
 * (`pierre.dubois`, `actif: false`). `RG-M14-08` — « perd IMMÉDIATEMENT
 * l'accès » — n'a qu'un point d'application, la reprise de session, et rien ne
 * l'éprouvait jusqu'ici.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { racine } from './banc/inventaire.mjs';

/** `docs/routes.md`, la source de l'attendu. */
export function texteDesRoutes() {
	return readFileSync(join(racine, 'docs', 'routes.md'), 'utf8');
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES PERSONAS

   L'ordre est celui du plan §5 l. 341. La colonne `colonne` dit laquelle des
   quatre colonnes de §5.5 gouverne le persona : la source n'en offre que
   quatre, et rassembler lecteur / rédacteur / gestionnaire est SA décision,
   pas la nôtre. La distinction fine revient à §3, par `droit`.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Les capacités croissantes d'un droit de dossier — CDC §2.3, transcrite par
 * `src/lib/droits/resolution.ts` (`capacites()`). Un rang plus élevé satisfait
 * toute exigence d'un rang plus bas : c'est l'inclusion des capacités, pas une
 * préférence.
 */
export const RANG_DE_DROIT = { lecteur: 1, redacteur: 2, gestionnaire: 3 };

/**
 * @typedef {object} Persona
 * @property {string} nom
 * @property {'anonyme'|'sansDroit'|'avecDroit'|'administrateur'} colonne colonne de §5.5
 * @property {null|'lecteur'|'redacteur'|'gestionnaire'} droit droit effectif posé
 * @property {boolean} session le persona porte-t-il un cookie de session ?
 * @property {string} incarnation ce que le corpus fournit, ou ce que la batterie pose
 */

/** @type {readonly Persona[]} */
export const PERSONAS = [
	{
		nom: 'anonyme',
		colonne: 'anonyme',
		droit: null,
		session: false,
		incarnation: 'aucun cookie — réel'
	},
	{
		nom: 'contributeur-sans-droit',
		colonne: 'sansDroit',
		droit: null,
		session: true,
		incarnation: 'marc.ferreira (contributeur, actif, aucun droit explicite) — réel'
	},
	{
		nom: 'lecteur',
		colonne: 'avecDroit',
		droit: 'lecteur',
		session: true,
		incarnation: 'marc.ferreira + droit « lecteur » sur la racine d’Infrastructure — GABARIT'
	},
	{
		nom: 'redacteur',
		colonne: 'avecDroit',
		droit: 'redacteur',
		session: true,
		incarnation: 'marc.ferreira + droit « rédacteur » sur la racine d’Infrastructure — GABARIT'
	},
	{
		nom: 'gestionnaire',
		colonne: 'avecDroit',
		droit: 'gestionnaire',
		session: true,
		incarnation: 'marc.ferreira + droit « gestionnaire » sur la racine d’Infrastructure — GABARIT'
	},
	{
		nom: 'administrateur',
		colonne: 'administrateur',
		droit: null,
		session: true,
		incarnation: 'sophie.nguyen (administrateur) — réel'
	},
	{
		nom: 'compte-desactive',
		colonne: 'anonyme',
		droit: null,
		session: true,
		incarnation: 'pierre.dubois (actif: false) — réel, RG-M14-08'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   2. §3 — LE NIVEAU D'ACCÈS EXIGÉ, ROUTE PAR ROUTE

   Six formes de cellule existent dans la source, et six règles les classent.
   TOUTE cellule non classée fait sortir en code 2 : une famille qu'aucune
   règle ne satisfait est une règle qu'on espère (`P-5`).
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Les niveaux d'accès reconnus.
 *
 * `publique`     — servi sans session (« anonyme », « anonyme et connecté »)
 * `connecte`     — une session suffit, quel que soit le droit
 * `lecteur`      — « connecté + lecteur »
 * `redacteur`    — « connecté + rédacteur »
 * `administrateur` — le rôle, non un droit de dossier
 */
export const NIVEAUX = ['publique', 'connecte', 'lecteur', 'redacteur', 'administrateur'];

/**
 * Classe une cellule « Niveau d'accès » de §3.
 * @param {string} cellule le texte de la cellule, balisage compris
 * @returns {string|null} le niveau, ou `null` si aucune règle ne s'applique
 */
export function niveauDeCellule(cellule) {
	const t = cellule.toLowerCase();
	/* L'ordre compte : « connecté ; périmètre global : administrateur ou profil
	   habilité » (V-19) est un niveau CONNECTÉ — §5.5 sert d'ailleurs la
	   cartographie au connecté sans droit, « périmètre rabattu ». */
	if (/\+\s*rédacteur/.test(t)) return 'redacteur';
	if (/\+\s*lecteur/.test(t)) return 'lecteur';
	if (t.startsWith('anonyme')) return 'publique';
	if (t.startsWith('connecté')) return 'connecte';
	if (t.startsWith('administrateur')) return 'administrateur';
	if (/^idem\b/.test(t)) return 'idem';
	return null;
}

/**
 * Le niveau d'accès de chaque route du §3, par extraction de la colonne.
 *
 * DEUX PARTICULARITÉS DE LA SOURCE, ET ELLES SONT DÉCLARÉES ICI :
 *
 *  1. §3.6 (console) et §3.7 n'ont PAS la même largeur de tableau — la console
 *     n'a pas de colonne « Niveau d'accès », son niveau est en prose :
 *     `docs/routes.md:167` « Toutes ces routes exigent le rôle administrateur.
 *     Un utilisateur non administrateur reçoit 404 V-26 ». Le niveau est donc
 *     déclaré `administrateur` pour la famille `/console`, et RECOUPÉ contre
 *     §5.5 par `controlerLaTable()` : si la matrice servait la console à un
 *     autre persona, le recoupement échoue et la batterie refuse de mesurer.
 *  2. « idem V-19 » (`/cartographie/par-type`) reprend le niveau de la ligne
 *     précédente — R2 de la source, appliquée à la lecture.
 *
 * @param {string} texte le contenu de `docs/routes.md`
 * @returns {{niveaux: Map<string,string>, refus: string[]}}
 */
export function niveauxParRoute(texte) {
	const lignes = texte.split('\n');
	const debut = lignes.findIndex((l) => /^## 3\. Table maîtresse/.test(l));
	const fin = lignes.findIndex((l) => /^## 4\. /.test(l));
	if (debut < 0 || fin < 0) throw new Error('routes.md : §3 introuvable');

	/** @type {Map<string,string>} */
	const niveaux = new Map();
	/** @type {string[]} */
	const refus = [];
	/** @type {number|null} */
	let colonne = null;
	let dernier = '';

	for (const ligne of lignes.slice(debut, fin)) {
		if (/^\|\s*Route\s*\|/.test(ligne)) {
			const entetes = ligne.split('|').map((c) => c.trim());
			const i = entetes.findIndex((c) => /^Niveau d.acc/.test(c));
			colonne = i < 0 ? null : i;
			continue;
		}
		if (!ligne.startsWith('| `')) continue;
		const cellules = ligne.split('|').map((c) => c.trim());
		const chemins = [...cellules[1].matchAll(/`([^`]+)`/g)]
			.map((m) => m[1])
			.filter((r) => r.startsWith('/'));
		if (chemins.length === 0) continue;

		/* §3.6 : aucune colonne de niveau. Le niveau est en prose (`:167`), et il
		   est déclaré ici avec sa ligne — jamais deviné. */
		let brut =
			colonne === null ? 'administrateur (docs/routes.md:167, en prose)' : cellules[colonne];
		if (brut === undefined) brut = '';
		let niveau = niveauDeCellule(brut);
		if (niveau === 'idem') niveau = dernier;
		if (niveau === null) {
			refus.push(`${chemins[0]} — cellule « ${brut} » qu'aucune règle de niveau ne classe`);
			continue;
		}
		dernier = niveau;
		/* Le premier chemin de la cellule est la route ; les suivants sont des
		   paramètres d'état (`/notes/{id}` `?version={n}`), non des routes. */
		for (const c of chemins) if (!niveaux.has(c)) niveaux.set(c, niveau);
	}
	return { niveaux, refus };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. §5.5 — LA FORME DE LA RÉPONSE, FAMILLE PAR FAMILLE

   Quatre colonnes, quatre formes possibles. « idem » recopie la colonne
   précédente de la même ligne, ce que la source emploie deux fois.
   ═════════════════════════════════════════════════════════════════════════ */

/** Les trois formes de réponse que la matrice distingue. */
export const FORMES = ['servi', 'refus-404', 'redirection'];

/**
 * Classe une cellule de §5.5.
 * @param {string} cellule
 * @returns {string|null} `servi`, `refus-404`, `redirection`, `idem`, ou `null`
 */
export function formeDeCellule(cellule) {
	const t = cellule.trim();
	if (/^\**idem\**$/i.test(t)) return 'idem';
	if (/\b302\b/.test(t)) return 'redirection';
	if (/\b404\b/.test(t)) return 'refus-404';
	/* Tout ce qui reste doit NOMMER une vue ou un périmètre : c'est ainsi que la
	   source écrit « servi ». Une cellule qui ne nomme rien n'est pas classée. */
	if (/V-\d\d/.test(t) || /périmètre/i.test(t)) return 'servi';
	return null;
}

/**
 * Le préfixe littéral d'un motif de famille — la partie qui précède le premier
 * paramètre. `/notes/{id}` → `/notes` ; `/console/…` → `/console`.
 * @param {string} motif
 */
export function prefixeLitteral(motif) {
	const coupe = motif.search(/[{…]/);
	const brut = coupe < 0 ? motif : motif.slice(0, coupe);
	return brut.length > 1 ? brut.replace(/\/+$/, '') : brut;
}

/**
 * Les familles de §5.5, dans l'ordre du tableau.
 * @param {string} texte
 * @returns {{familles: {motifs: string[], prefixes: string[], libelle: string,
 *   cellules: Record<string,string>, formes: Record<string,string|null>}[], refus: string[]}}
 */
export function famillesDuRefus(texte) {
	const lignes = texte.split('\n');
	const debut = lignes.findIndex((l) => /^### 5\.5 /.test(l));
	const fin = lignes.findIndex((l, i) => i > debut && /^Quatre principes/.test(l));
	if (debut < 0 || fin < 0) throw new Error('routes.md : §5.5 introuvable');

	const colonnes = ['anonyme', 'sansDroit', 'avecDroit', 'administrateur'];
	/** @type {{motifs: string[], prefixes: string[], libelle: string,
	 *   cellules: Record<string,string>, formes: Record<string,string|null>}[]} */
	const familles = [];
	/** @type {string[]} */
	const refus = [];

	for (const ligne of lignes.slice(debut, fin)) {
		if (!ligne.startsWith('| `')) continue;
		const cellules = ligne.split('|').map((c) => c.trim());
		const motifs = [...cellules[1].matchAll(/`([^`]+)`/g)]
			.map((m) => m[1])
			.filter((r) => r.startsWith('/'));
		if (motifs.length === 0) continue;
		/** @type {Record<string,string>} */
		const brut = {};
		/** @type {Record<string,string|null>} */
		const formes = {};
		let precedente = null;
		for (const [i, nom] of colonnes.entries()) {
			const cellule = cellules[2 + i] ?? '';
			brut[nom] = cellule;
			let forme = formeDeCellule(cellule);
			if (forme === 'idem') forme = precedente;
			if (forme === null) {
				refus.push(`${motifs[0]} · ${nom} — cellule « ${cellule} » qu'aucune règle ne classe`);
			}
			formes[nom] = forme;
			precedente = forme;
		}
		familles.push({
			motifs,
			prefixes: motifs.map(prefixeLitteral),
			libelle: cellules[1],
			cellules: brut,
			formes
		});
	}
	return { familles, refus };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. CE QUE LA SOURCE NE DIT PAS, DÉCLARÉ AVEC SA LIGNE

   Quatre routes d'authentification n'ont aucune ligne au §5.5, et une famille
   du §5.5 n'est pas une route. Les deux manques sont nommés ici plutôt que
   comblés en silence, et `controlerLaTable()` refuse tout AUTRE manque.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Les routes que §5.5 ne couvre pas, et la forme qu'elles rendent pour TOUT
 * persona. La source est citée par route.
 */
export const HORS_MATRICE = [
	{
		route: '/connexion',
		forme: 'servi',
		source: 'routes.md:113 §3.2 — niveau « anonyme » ; aucune restriction de session'
	},
	{
		route: '/mot-de-passe-oublie',
		forme: 'servi',
		source: 'routes.md:114 §3.2 — niveau « anonyme »'
	},
	{
		route: '/mot-de-passe-oublie/{jeton}',
		forme: 'servi',
		source: 'routes.md:115 §3.2 — niveau « anonyme (porteur du jeton) »'
	},
	{
		route: '/deconnexion',
		forme: 'redirection',
		source:
			'routes.md:327 §5.2 — « Après déconnexion : 302 → / (espace public), JAMAIS une page ' +
			'd’erreur » (RG-ACC-02). Une adresse qui ne peut pas rendre d’erreur ne peut pas rendre ' +
			'404 : elle redirige, avec ou sans session'
	}
];

/**
 * Les familles de §5.5 dont l'absence de route est ARBITRÉE, non fautive.
 * `ARB-001` supprime la forme raccourcie ; §5.5 garde la ligne pour dire ce
 * qu'elle rend. L'adresse est tout de même MESURÉE (§6 ci-dessous).
 */
export const FAMILLES_SANS_ROUTE = ['/domaines'];

/**
 * Les adresses hors des 39 routes que la batterie mesure tout de même, parce
 * qu'un client peut les construire et que la source dit ce qu'elles rendent.
 */
export const ADRESSES_CONSTRUITES = [
	{
		famille: '/domaines',
		chemin: '/domaines/infrastructure',
		motif: 'ARB-001 — forme raccourcie non implémentée ; §5.5:368 en dit la réponse'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   5. LE CONTRÔLE DE LA TABLE — AVANT TOUTE MESURE

   Règle 3 de `docs/orchestration.md` §1.2 : « Éprouve ta table avant de
   mesurer. Un régime qu'aucune route ne satisfait, un persona qu'aucun compte
   n'incarne : code 2, jamais vert. »
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Rapproche chaque route de sa famille, et refuse si le rapprochement laisse
 * un trou d'un côté ou de l'autre.
 *
 * @param {readonly string[]} routes les 39 routes du §3
 * @param {ReturnType<typeof famillesDuRefus>['familles']} familles
 * @returns {{parRoute: Map<string, number[]>, refus: string[]}}
 */
export function rapprocher(routes, familles) {
	/** @type {Map<string, number[]>} */
	const parRoute = new Map();
	/** @type {string[]} */
	const refus = [];

	for (const route of routes) {
		/** @type {number[]} */
		const trouvees = [];
		let meilleur = -1;
		for (const [i, f] of familles.entries()) {
			for (const p of f.prefixes) {
				/* La famille « / » ne recouvre que la racine exacte : par préfixe elle
				   recouvrirait tout, et la matrice n'aurait plus qu'une ligne. */
				const touche = p === '/' ? route === '/' : route === p || route.startsWith(`${p}/`);
				if (!touche) continue;
				if (p.length > meilleur) {
					meilleur = p.length;
					trouvees.length = 0;
				}
				if (p.length === meilleur && !trouvees.includes(i)) trouvees.push(i);
			}
		}
		if (trouvees.length > 0) parRoute.set(route, trouvees);
	}

	for (const route of routes) {
		if (parRoute.has(route)) continue;
		if (HORS_MATRICE.some((h) => h.route === route)) continue;
		refus.push(`route « ${route} » : aucune famille de §5.5, aucune déclaration hors matrice`);
	}
	for (const f of familles) {
		const servie = f.prefixes.some((p) =>
			[...parRoute.keys()].some((r) => (p === '/' ? r === '/' : r === p || r.startsWith(`${p}/`)))
		);
		if (servie) continue;
		if (f.prefixes.every((p) => FAMILLES_SANS_ROUTE.includes(p))) continue;
		refus.push(`famille « ${f.motifs.join(' ')} » de §5.5 : aucune des 39 routes ne la satisfait`);
	}
	return { parRoute, refus };
}

/**
 * Les recoupements qui doivent tenir pour que la combinaison §3 × §5.5 ait un
 * sens. Chacun vient d'une faute possible, et non d'un principe.
 *
 * @param {ReturnType<typeof famillesDuRefus>['familles']} familles
 * @param {Map<string,string>} niveaux
 * @returns {string[]} les refus ; vide si tout tient
 */
export function recouper(familles, niveaux) {
	/** @type {string[]} */
	const refus = [];

	/* 1. AUCUNE REDIRECTION DANS LES COLONNES CONNECTÉES. Toute la combinaison
	      repose là-dessus : pour un connecté, la forme du refus est 404, et la
	      redirection est le seul régime réservé à l'absence de session
	      (`ARB-052`). Si la source cessait de le dire, la règle de combinaison
	      ci-dessous serait fausse sans que rien ne le signale. */
	for (const f of familles) {
		for (const colonne of ['sansDroit', 'avecDroit', 'administrateur']) {
			if (f.formes[colonne] === 'redirection') {
				refus.push(
					`§5.5 « ${f.motifs.join(' ')} » · ${colonne} : une redirection dans une colonne ` +
						'connectée — la règle de combinaison de ce module ne tient plus'
				);
			}
		}
	}

	/* 2. LA CONSOLE N'EST SERVIE QU'À L'ADMINISTRATEUR. Le niveau de §3.6 est
	      déclaré en prose (`:167`) ; ce recoupement est ce qui empêche la
	      déclaration d'être une croyance. */
	const console_ = familles.find((f) => f.prefixes.includes('/console'));
	if (console_ === undefined) {
		refus.push('§5.5 : aucune ligne « /console/… » — la déclaration de §3.6 n’est plus recoupée');
	} else if (
		console_.formes['administrateur'] !== 'servi' ||
		console_.formes['avecDroit'] === 'servi' ||
		console_.formes['sansDroit'] === 'servi'
	) {
		refus.push(
			'§5.5 « /console/… » ne sert plus l’administrateur seul : le niveau déclaré de §3.6 ' +
				'(routes.md:167) est contredit par la matrice'
		);
	}

	/* 3. TOUTE ROUTE DU §3 A UN NIVEAU, ET IL EST CONNU. */
	for (const [route, niveau] of niveaux) {
		if (!NIVEAUX.includes(niveau)) refus.push(`route « ${route} » : niveau « ${niveau} » inconnu`);
	}

	/* 4. CHAQUE NIVEAU EST EXERCÉ PAR AU MOINS UNE ROUTE, ET CHAQUE PERSONA PAR
	      AU MOINS UN CAS. Un niveau que rien n'exerce est `P-5` : on ignore s'il
	      marche. */
	for (const niveau of NIVEAUX) {
		if (![...niveaux.values()].includes(niveau)) {
			refus.push(`niveau « ${niveau} » : aucune des 39 routes ne l’exige — règle inerte (P-5)`);
		}
	}
	return refus;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. L'ATTENDU D'UN COUPLE (ROUTE, PERSONA)

   Une seule règle de combinaison, et elle est écrite ici en clair parce
   qu'elle est le seul endroit du module qui ne soit pas une lecture.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Le persona satisfait-il le niveau exigé par la route ?
 *
 * `administrateur` satisfait tout — `RG-DRO-03`, « le rôle administrateur voit
 * tout, sans filtre ». Les droits de dossier sont ordonnés par inclusion de
 * capacités (CDC §2.3), non par préférence.
 *
 * @param {Persona} persona
 * @param {string} niveau
 */
export function satisfait(persona, niveau) {
	if (niveau === 'publique') return true;
	if (persona.colonne === 'anonyme') return false;
	if (persona.colonne === 'administrateur') return true;
	if (niveau === 'administrateur') return false;
	if (niveau === 'connecte') return true;
	const exige = RANG_DE_DROIT[/** @type {keyof typeof RANG_DE_DROIT} */ (niveau)];
	const porte = persona.droit === null ? 0 : RANG_DE_DROIT[persona.droit];
	return porte >= exige;
}

/**
 * La forme de réponse attendue pour un couple (route, persona).
 *
 * LA RÈGLE, EN TROIS LIGNES :
 *   1. la route est hors matrice → la forme déclarée, source citée ;
 *   2. le persona satisfait le niveau de §3 → la colonne « servie » de §5.5 ;
 *   3. sinon → la colonne de refus de §5.5 qui correspond au persona.
 *
 * Le point 3 est ce qui donne la redirection aux six chemins fixes en anonyme
 * et le 404 partout ailleurs : la forme n'est pas choisie ici, elle est LUE.
 *
 * @param {string} route
 * @param {Persona} persona
 * @param {{parRoute: Map<string, number[]>}} rapprochement
 * @param {ReturnType<typeof famillesDuRefus>['familles']} familles
 * @param {Map<string,string>} niveaux
 * @returns {{forme: string, source: string, niveau: string}}
 */
export function attenduDe(route, persona, rapprochement, familles, niveaux) {
	const hors = HORS_MATRICE.find((h) => h.route === route);
	if (hors !== undefined) {
		return { forme: hors.forme, source: hors.source, niveau: 'hors-matrice' };
	}
	const niveau = niveaux.get(route) ?? 'connecte';
	const index = rapprochement.parRoute.get(route) ?? [];
	const famille = familles[index[0] ?? 0];
	if (famille === undefined) throw new Error(`attendu : aucune famille pour « ${route} »`);

	/* §5.5 est déjà écrite persona par persona : la colonne du persona porte la
	   forme, servie ou refusée. Le niveau de §3 n'intervient QUE là où la
	   colonne « connecté avec droit » est trop grossière — un droit de lecture
	   ne suffit pas à `/importer`, qui exige la rédaction (§3.5, et la cellule
	   « 404 V-26 (sans droit de rédaction) » le dit elle-même). */
	const rabattue = persona.colonne === 'avecDroit' && !satisfait(persona, niveau);
	const colonne = rabattue ? 'sansDroit' : persona.colonne;
	const forme = famille.formes[colonne];
	if (forme === undefined || forme === null) {
		throw new Error(`attendu : forme absente pour « ${route} » · ${persona.nom}`);
	}
	const motif = rabattue
		? `le droit « ${String(persona.droit)} » ne satisfait pas le niveau « ${niveau} » de §3`
		: `niveau §3 « ${niveau} »`;
	return {
		forme,
		niveau,
		source: `§5.5 « ${famille.motifs.join(' ')} » colonne « ${colonne} » ; ${motif}`
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 bis. LA VARIANTE D'ADRESSE — CE QUE §5.5 NE DIT PAS DE SES COLONNES

   §5.5 est une matrice d'ACCÈS, non de RÉSOLUTION : ses colonnes disent ce
   qu'un persona obtient d'une adresse QUI RÉSOUT. Lue sans la variante, la
   colonne « Connecté avec droit » de `/univers/…` fait attendre « V-10… » —
   donc SERVI — d'une adresse dont AUCUN segment paramétré n'est dans le
   corpus. Aucune implémentation correcte ne peut le satisfaire, et trois lots
   l'ont relevé indépendamment : `T-032` (16 cases + 16 couples), `T-034`
   (10 + 10), `T-039` (8).

   CE QUE LA SOURCE DIT, ET QUI TRANCHE.

   §5.5 principe 4, `docs/routes.md:399`, amendé par `ARB-052` : « cette
   matrice relève du régime indiscernable POUR LES ADRESSES DE RESSOURCE :
   celles qui portent un identifiant de corpus, et dont l'existence est
   elle-même l'information confidentielle ».

   Et la source le MONTRE déjà sur une de ses lignes, `docs/routes.md:365` :
   « `/guides/{id}` — note interne ou brouillon » rend **404 V-04 dans les
   QUATRE colonnes**, celle de l'administrateur comprise. Le régime
   indiscernable ne connaît pas les personas : il connaît la résolution. C'est
   d'ailleurs le traitement par variante que `verif/etancheite.mjs` applique
   déjà à cette seule route, et que cette fonction généralise.

   LA BORNE QUI EMPÊCHE LA RÈGLE DE TROP COUVRIR est `ARB-057` §1 : « une
   adresse qui porte un identifiant mais dont le régime est décidé sur le
   préfixe, avant toute résolution, redirige — et cela SE MESURE ». Une forme
   lue « redirection » n'est donc jamais touchée : c'est ce qui laisse
   `/console/imports/{lot}` et `/console/exports/{univers}/{domaine}` rediriger
   sur leurs DEUX variantes en anonyme, les deux seuls couples indiscernables
   PROUVÉS du dépôt. Le critère opérationnel d'`ARB-052` est respecté à la
   lettre : « une adresse dont la réponse dépend du corpus est indiscernable ;
   une adresse dont la réponse ne dépend que de la présence d'une session
   redirige ».

   TROIS EXCLUSIONS, ET CHACUNE A SA RAISON :

     · LES ROUTES HORS MATRICE. Leur forme vient d'une déclaration citée
       (`HORS_MATRICE` ci-dessus), et la source ne dit RIEN de leur variante.
       Mesuré : `/mot-de-passe-oublie/{jeton}` sert 200 sur un jeton inconnu,
       pour les sept personas. Lui attendre 404 fabriquerait sept faux défauts
       là où il y a un VIDE DE SPÉCIFICATION — à déclarer, jamais à combler.
     · LES FORMES DÉJÀ REFUSANTES. La règle n'aurait rien à y changer.
     · TOUTE VARIANTE AUTRE QU'`inexistante`. `existante` et `interne`
       résolvent ; `fixe` ne porte aucun paramètre ; `construite` tient son
       attendu d'`ARB-001`.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Les variantes d'adresse que la batterie construit. Une variante inconnue
 * fait sortir `formeSelonLaVariante` en erreur : `P-5`, une règle qu'aucun cas
 * n'exerce est une règle dont on ignore si elle marche, et une variante qu'on
 * n'a pas prévue est une règle qui ne s'applique pas sans le dire.
 */
export const VARIANTES = ['fixe', 'existante', 'inexistante', 'interne', 'construite'];

/**
 * La forme attendue, une fois la VARIANTE d'adresse prise en compte.
 *
 * @param {string} formeLue la forme que §5.5 donne au persona
 * @param {string} variante l'une de `VARIANTES`
 * @param {boolean} horsMatrice la route tient sa forme d'une déclaration citée
 * @returns {{forme: string, motif: string|null}} `motif` non nul si et
 *   seulement si la variante a décidé — le rapport le cite alors case par case
 */
export function formeSelonLaVariante(formeLue, variante, horsMatrice) {
	if (!VARIANTES.includes(variante)) {
		throw new Error(`variante « ${variante} » inconnue : aucune règle ne la gouverne`);
	}
	if (variante !== 'inexistante' || horsMatrice || formeLue !== 'servi') {
		return { forme: formeLue, motif: null };
	}
	return {
		forme: 'refus-404',
		motif:
			'variante inexistante : §5.5 dit ce qu’une adresse QUI RÉSOUT rend à ce persona, et ' +
			'aucun segment de celle-ci n’est dans le corpus. Régime indiscernable — §5.5 principe 4 ' +
			'(docs/routes.md:399, ARB-052), et docs/routes.md:365 où une ressource non résolue rend ' +
			'404 dans les quatre colonnes, celle de l’administrateur comprise'
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 ter. LE COUPLE DE `RG-ACC-04` EXIGE UN REFUS DU CÔTÉ EXISTANT

   `CDC:113`, recopiée : « Un accès REFUSÉ sur un contenu existant et un accès
   sur un contenu inexistant produisent la même réponse visible, pour ne pas
   révéler l'existence d'un contenu confidentiel. »

   La règle NOMME son côté gauche : un accès refusé. Elle ne dit rien — et n'a
   rien à dire — du cas où le persona a le droit et où le contenu lui est
   LÉGITIMEMENT SERVI : il n'y a alors aucune existence à dissimuler, puisque
   celle-ci lui est ouverte. Comparer un service légitime à une absence mesure
   la résolution, pas l'étanchéité. C'est ce que faisaient les 34 couples
   `asymetrique` du 20 août 2026.

   DEUX GARDES, ET LE SECOND EST CELUI QUI COMPTE.

     1. La clause est décidée sur l'ATTENDU, jamais sur l'observé. Décidée sur
        l'observé, elle ABSORBERAIT une fuite : un côté existant servi là où la
        source le refuse deviendrait « sans objet » au lieu de rougir. La sonde
        `couple-servi-sans-droit` éprouve exactement cette inversion.
     2. « Fuyant » passe AVANT « sans objet ». Deux côtés servis restent un
        défaut quel que soit l'attendu : une adresse dont aucun segment n'est
        dans le corpus ne peut pas être servie.

   ET CE QUE LA CLAUSE NE CACHE PAS. Un côté existant dont l'attendu est
   « servi » mais que le produit refuse — parce que la route n'est pas montée —
   ne devient PAS sans objet : il reste `vacueux`, et sa case reste
   `non-couverte`. Aucune vacuité ne disparaît par cette règle, ce que
   `docs/orchestration.md` §4 interdirait.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * L'issue d'un couple « existe mais est refusé » contre « n'existe pas ».
 *
 * @param {object} c
 * @param {string} c.attenduExistante la forme attendue du côté existant
 * @param {string} c.observeExistante la forme observée du côté existant
 * @param {string} c.observeInexistante la forme observée du côté inexistant
 * @param {boolean} c.memeCle les deux clés de rapprochement sont-elles égales ?
 * @param {boolean} c.portee la route est-elle montée, ou le régime décidé
 *   avant toute résolution ?
 * @returns {'fuyant'|'sans-objet'|'asymetrique'|'discernable'|'vacueux'|'indiscernable'}
 */
export function issueDuCouple({
	attenduExistante,
	observeExistante,
	observeInexistante,
	memeCle,
	portee
}) {
	if (observeExistante === 'servi' && observeInexistante === 'servi') return 'fuyant';
	if (attenduExistante === 'servi' && observeExistante === 'servi') return 'sans-objet';
	if (observeExistante === 'servi' || observeInexistante === 'servi') return 'asymetrique';
	if (!memeCle) return 'discernable';
	if (!portee) return 'vacueux';
	return 'indiscernable';
}
/* ═══════════════════════════════════════════════════════════════════════════
   7. LA CLÉ DE RAPPROCHEMENT DES DEUX CÔTÉS D'UN REFUS

   `RG-ACC-04` : refus et inexistence rendent la MÊME chose. La comparaison
   porte sur le code, les en-têtes et le corps — mais l'adresse demandée est
   AFFICHÉE par V-04 et V-26 (`V-04:715`, `V-26:1067`), et portée par le
   `?suite=` d'une redirection. Deux adresses différentes rendent donc deux
   corps différents SANS qu'aucune information sur le corpus ne fuie.

   `docs/routes.md:163` le dit de la source elle-même : « Les cas inexistante
   et hors de vos droits sont rigoureusement identiques, À LA CHAÎNE DEMANDÉE
   PRÈS (`V-26:2628`) ». La chaîne demandée est donc masquée avant comparaison,
   et rien d'autre.
   ═════════════════════════════════════════════════════════════════════════ */

/** Les en-têtes dont la valeur varie sans porter d'information de corpus. */
export const ENTETES_VOLATILES = ['date', 'age', 'etag', 'last-modified', 'content-length'];

/**
 * Masque, dans un texte, toutes les formes sous lesquelles le chemin demandé
 * peut y apparaître : brut, encodé, et par segments.
 * @param {string} texte
 * @param {string} chemin
 */
export function masquerLAdresse(texte, chemin) {
	const formes = new Set([chemin, encodeURIComponent(chemin), chemin.replace(/\//g, '%2F')]);
	for (const segment of chemin.split('/')) {
		if (segment.length < 3) continue;
		formes.add(segment);
		/* V-04 et V-26 tirent une requête de recherche du dernier segment, tirets
		   rendus aux espaces (`adresse-non-resolue.ts`, port de `V-04:2117`). */
		formes.add(segment.replace(/[-_]+/g, ' '));
	}
	let masque = texte;
	for (const forme of [...formes].sort((a, b) => b.length - a.length)) {
		masque = masque.split(forme).join('⟨adresse⟩');
	}
	return masque;
}

/**
 * La clé de rapprochement d'une réponse : ce qui doit être identique entre un
 * refus et une inexistence.
 *
 * @param {{status: number, entetes: Record<string,string>, corps: string}} reponse
 * @param {string} chemin le chemin demandé, à masquer
 */
export function cleDeRapprochement(reponse, chemin) {
	const entetes = Object.entries(reponse.entetes)
		.filter(([n]) => !ENTETES_VOLATILES.includes(n.toLowerCase()))
		.map(([n, v]) => `${n.toLowerCase()}: ${masquerLAdresse(v, chemin)}`)
		.sort()
		.join('\n');
	return `${reponse.status}\n${entetes}\n${masquerLAdresse(reponse.corps, chemin)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. LA MESURE TEMPORELLE — MÉDIANE, ÉCART INTERQUARTILE, PLANCHER MESURÉ

   `ARB-005` : « un écart de latence entre un refus et une inexistence est une
   fuite, au même titre qu'un code de statut distinct ».

   `T-012` a payé quatre enseignements, et trois sont ici :
     · médiane et écart interquartile, jamais la moyenne — un tirage à 28,98 ms
       sur 40 déplace la moyenne, pas la médiane ;
     · le couple témoin est ENTRELACÉ exactement comme le couple mesuré ;
     · le plancher de bruit se MESURE. Un seuil absolu aurait conclu à tort :
       son témoin a rendu −1,165 ms, PLUS que l'écart mesuré de 0,408 ms.

   Le plancher retenu est l'ÉCART INTERQUARTILE des deux séries mesurées, mis
   en commun. C'est une dispersion observée, de la même unité que l'écart
   qu'elle borne, et elle ne se choisit pas. Ce que ce plancher NE dit PAS est
   au rapport : un écart plus petit n'est pas prouvé absent, il est prouvé
   indistinguable au régime employé.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Le quantile d'un échantillon, par interpolation linéaire.
 * @param {readonly number[]} echantillon
 * @param {number} q entre 0 et 1
 */
export function quantile(echantillon, q) {
	if (echantillon.length === 0) return Number.NaN;
	const trie = [...echantillon].sort((a, b) => a - b);
	const rang = (trie.length - 1) * q;
	const bas = Math.floor(rang);
	const haut = Math.ceil(rang);
	const a = trie[bas] ?? Number.NaN;
	const b = trie[haut] ?? Number.NaN;
	return a + (b - a) * (rang - bas);
}

/** La médiane. */
export function mediane(echantillon) {
	return quantile(echantillon, 0.5);
}

/** L'écart interquartile — la dispersion qui sert de plancher de bruit. */
export function ecartInterquartile(echantillon) {
	return quantile(echantillon, 0.75) - quantile(echantillon, 0.25);
}

/**
 * Le verdict temporel d'un couple, et il a TROIS issues, pas deux.
 *
 * `refus-de-conclure` est la troisième, et elle est indispensable : si le
 * couple TÉMOIN — deux tirages du même côté, dont l'écart vrai est nul —
 * dépasse le plancher, la méthode est instable et rien ne peut être conclu du
 * couple mesuré. Rendre « dans le bruit » dans ce cas serait un faux vert.
 *
 * @param {readonly number[]} a série du premier côté (ms)
 * @param {readonly number[]} b série du second côté (ms)
 * @param {readonly number[]} temoinA série témoin, même côté que `temoinB`
 * @param {readonly number[]} temoinB série témoin, entrelacée comme `a` et `b`
 */
export function verdictTemporel(a, b, temoinA, temoinB) {
	const ecart = mediane(a) - mediane(b);
	const ecartTemoin = mediane(temoinA) - mediane(temoinB);
	const plancher = Math.max(ecartInterquartile(temoinA), ecartInterquartile(temoinB));
	const dispersionMesuree = ecartInterquartile([...a, ...b]);
	const issue =
		Math.abs(ecartTemoin) > plancher
			? 'refus-de-conclure'
			: Math.abs(ecart) > plancher
				? 'hors-du-bruit'
				: 'dans-le-bruit';
	return {
		issue,
		ecart,
		ecartTemoin,
		plancher,
		dispersionMesuree,
		medianes: [mediane(a), mediane(b)],
		tirages: a.length
	};
}
