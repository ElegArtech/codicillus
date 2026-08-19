#!/usr/bin/env node
/**
 * `pnpm verif:menus` — batterie 16 du catalogue (PLAN-DE-REALISATION.md §5) :
 * « Aucune entrée de navigation inerte ; un module désactivé disparaît de la
 * navigation et des tableaux de bord » — P-03, P-04, RG-STR-06.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni ses tables, ni
 * `verif/references/`. Retirer une famille, élargir la définition d'une entrée
 * ou requalifier une nature pour obtenir du vert est le contournement nommé par
 * PLAN §12 (RA-01). La sortie légitime d'un rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'OBSTACLE CENTRAL, ET IL DICTE LA FORME DE LA BATTERIE
 *
 * Les 41 maquettes gelées ne portent AUCUNE liaison : sur 766 attributs `href`,
 * 681 valent `"#"` (`docs/routes.md` §0, `ARB-013`). Un lien mort est
 * exactement ce que `P-03` interdit — et le gel n'en porte pratiquement que.
 *
 * Cela ne rend pas la batterie inutile ; cela lui interdit une définition
 * naïve. `ARB-013` a déjà tranché le point pour le banc : les lignes `/url:`
 * sont retirées de l'instantané de structure, précisément pour que le produit
 * puisse porter les adresses de `docs/routes.md` SANS échouer la comparaison
 * visuelle. Le chemin est donc ouvert pour l'application, et fermé pour la
 * maquette — qui, elle, ne sera jamais recâblée.
 *
 *   LE GEL A LE DROIT D'ÊTRE INERTE. LE PRODUIT NON.
 *
 * D'où la définition opposable, et elle est étroite exprès :
 *
 *   Est un DÉFAUT DE PORTAGE une entrée que l'APPLICATION rend, qui ne mène
 *   nulle part, ET DONT LA DESTINATION EST DÉCLARÉE PAR LA MAQUETTE
 *   ELLE-MÊME — `data-vers` — alors qu'une route existe pour cette
 *   destination dans `docs/routes.md`.
 *
 * Tout le reste est CONSTATÉ et chiffré, jamais opposé :
 *   · une entrée inerte dont aucune source ne déclare la destination : la
 *     deviner serait un comblement (`CLAUDE.md` §2, règle de non-comblement) ;
 *   · l'inertie du gel : `ARB-013` la couvre, et aucun lot ne peut la corriger.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SIX GENRES D'INERTIE, ET CE QUI LES ÉPROUVE
 *
 * `P-03` en nomme trois : « pas de "bientôt disponible", pas de lien mort,
 * pas d'onglet grisé ». Trois de plus sont mécaniquement observables et
 * relèvent de la même phrase — « une entrée visible est une entrée qui
 * fonctionne ». Chacun est déclaré dans `GENRES`, avec sa trace et ce qui
 * l'éprouve. Un genre qu'aucun cas du corpus n'exerce est NOMMÉ à chaque
 * exécution : « une règle qu'aucun cas n'exerce est une règle dont on ignore
 * si elle marche » (`CLAUDE.md` §6 P-5, `ARB-013` resté inerte huit lots).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX CÔTÉS, UN SEUL CODE — ET UNE CLÉ ÉPROUVÉE DANS LES DEUX SENS
 *
 * La batterie relève le gel ET l'application, dans les mêmes conditions de
 * capture (`verif/banc/conditions.mjs`), par le même code : la planche de revue
 * côté maquette, le mode démo côté application. C'est la jurisprudence du banc.
 *
 * `ECART-041` dit ce qu'il en coûte de bâcler la jointure : la clé de la
 * batterie 10 embarquait un extrait de `textContent`, le compilateur Svelte
 * élague les nœuds de texte blancs d'un côté et pas de l'autre (P-8), et
 * 31 « défauts de portage » sur 31 étaient faux. La leçon est générale : une
 * jointure produit DEUX fautes symétriques — sur-rapprocher masque un défaut
 * réel, sous-rapprocher en fabrique un faux.
 *
 * D'où la clé de cette batterie :
 *
 *     conteneur │ balise+rôle │ NOM SANS AUCUN BLANC │ n° d'occurrence
 *
 * Aucun blanc n'y survit — `nomCompact()` retire `\s` en entier, et pas
 * seulement `\s+ → ' '`. Et le rang N'EST PAS dans la clé : une entrée en
 * plus ou en moins décalerait tous les rangs suivants et fabriquerait une
 * cascade de faux défauts. Le rang sert de TÉMOIN, pas de clé — voir
 * `controleDeCle()`, qui compte à chaque exécution les deux fautes possibles :
 *
 *   · SUR-RAPPROCHEMENT possible — clé identique, rang très différent ;
 *   · SOUS-RAPPROCHEMENT possible — même rang des deux côtés, clés différentes
 *     alors que les noms coïncident une fois les blancs retirés.
 *
 * Les deux sont imprimés, et les deux sont figés par `verif/menus.test.ts`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * P-04 — ET IL N'EST PAS ÉPROUVABLE PAR LE GEL AUTANT QU'ON LE CROIT
 *
 * `RG-STR-06` : « un domaine active 1 à N modules parmi Notes, Fiches,
 * Cartographie, Signets, Carte mentale. Un module non activé n'apparaît ni
 * dans la navigation du domaine, ni dans ses tableaux de bord. »
 *
 * CE QUE LE GEL MONTRE, et c'est plus que ce qu'un contrat de tâche supposait :
 * `V-11` a trois positions de planche qui sont trois domaines aux modules
 * DIFFÉRENTS — Infrastructure (6), Poste de travail (2), Migration 2026 (1).
 * Le tableau de bord du domaine est donc réellement éprouvable, des deux côtés.
 *
 * CE QUE LE GEL NE MONTRE PAS : aucune maquette ne fait varier une NAVIGATION
 * avec l'activation d'un module. Le rail de `V-37` offre Cartographie, Carte
 * mentale et Signets quel que soit le domaine courant. La moitié « ni dans la
 * navigation du domaine » de `RG-STR-06` n'a donc AUCUN cas dans le gel : elle
 * est déclarée non couverte, chiffrée, et ce qu'il faudrait pour la couvrir est
 * imprimé à chaque exécution.
 *
 * Quatre obligations mesurées, et la quatrième est celle qui fait la différence
 * entre une activation effective et une activation décorative :
 *
 *   M-1 cohérence — le nombre d'entrées de module rendues égale le nombre que
 *       la vue annonce elle-même (`#n-modules`, « N modules activés ») ;
 *   M-2 ABSENCE, pas masquage — un module non activé n'a aucun nœud dans la
 *       zone, ni rendu ni caché. C'est l'exigence de P-04, la même que P-09 ;
 *   M-3 fidélité — l'application rend le même ensemble de modules que le gel,
 *       état par état ;
 *   M-4 effectivité — sur l'ensemble des états d'une vue, les ensembles de
 *       modules DIFFÈRENT. Un rendu identique partout prouverait que
 *       l'activation ne pilote rien.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'USAGE
 *
 *   node verif/menus.mjs                     les 41 vues, 265 états, deux côtés
 *   node verif/menus.mjs V-11 V-37           une sélection
 *   node verif/menus.mjs --cote=gel          le gel seul — AUCUN verdict
 *   node verif/menus.mjs --json              le relevé exploitable
 *   node verif/menus.mjs --entrees           le détail entrée par entrée
 *   node verif/menus.mjs --etats=cle,cle     une sélection d'états
 *   node verif/menus.mjs V-07 --sonde=lien-mort  la preuve que la batterie sait
 *                                            dire non ; code retour INVERSÉ.
 *                                            `pnpm verif:menus:sonde` joue les
 *                                            sept, chacune sur une vue qui la
 *                                            fait juger — V-37 restreint son
 *                                            verdict au rail et à la barre
 *                                            (ARB-012), et n'y conviendrait pas
 *                                            pour le lien d'évitement
 *   node verif/menus.mjs --seuil-gel=N       l'inertie de gel ARBITRÉE à N
 *   node verif/menus.mjs --concurrence=8     pages en parallèle (défaut 6)
 *   node verif/menus.mjs --base=http://…     un `vite dev` déjà démarré
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	racine,
	RACINE_MAQUETTES,
	vues as vuesDuGel,
	declareParRoutes
} from './banc/inventaire.mjs';

const DOSSIER_SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');
const SEUIL = join(racine, 'verif', 'references', 'menus-seuil.json');

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES ROUTES — lues à la source, jamais recopiées

   `docs/routes.md` est l'autorité sur l'adressage (`ARB-013` : « le banc
   vérifie le rendu ; il n'a jamais eu à vérifier le routage »). La table
   maîtresse du §3 en est la forme opposable. On l'extrait mécaniquement — une
   seconde table écrite ici serait une seconde vérité, donc une occasion de
   divergence — et on VÉRIFIE le décompte contre le §9 du même document.
   ═════════════════════════════════════════════════════════════════════════ */

/** Le §3 de `docs/routes.md`, et lui seul : le §5.5 cite des NON-routes. */
export function routesDuDepot(texte = readFileSync(join(racine, 'docs', 'routes.md'), 'utf8')) {
	const lignes = texte.split('\n');
	const debut = lignes.findIndex((l) => /^## 3\. Table maîtresse/.test(l));
	const fin = lignes.findIndex((l) => /^## 4\. /.test(l));
	if (debut < 0 || fin < 0 || fin <= debut) throw new Error('routes.md : §3 introuvable');
	const routes = [];
	for (const ligne of lignes.slice(debut, fin)) {
		if (!ligne.startsWith('| `')) continue;
		const cellule = ligne.split('|')[1].trim();
		// Une cellule peut porter deux accents graves — `/notes/{id}` `?version={n}` :
		// le paramètre d'état n'est pas une route, seul le chemin en est une.
		for (const m of cellule.matchAll(/`([^`]+)`/g)) {
			const r = m[1];
			if (r.startsWith('/') && !routes.includes(r)) routes.push(r);
		}
	}
	return routes;
}

/**
 * Un gabarit de route en expression régulière.
 *
 * `{chemin…}` est la seule forme à plusieurs segments (RG-STR-04, 10 niveaux
 * de dossiers) ; tout autre `{x}` vaut exactement un segment.
 */
export function motifDeRoute(route) {
	const echappe = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const corps = echappe.replace(/\\\{chemin…\\\}/g, '.+').replace(/\\\{[^}]*\\\}/g, '[^/]+');
	return new RegExp('^' + corps + '$');
}

/** Le chemin d'une adresse résout-il vers une route déclarée ? */
export function routeDe(chemin, routes) {
	return routes.find((r) => motifDeRoute(r).test(chemin)) ?? null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LA DESTINATION DÉCLARÉE — deux règles, et pas une de plus

   `data-vers` est la seule déclaration de destination que les maquettes
   portent dans le DOM. Deux formes existent dans le corpus, et les deux sont
   exercées ; toute autre valeur est comptée « non résolue », jamais devinée.
   ═════════════════════════════════════════════════════════════════════════ */

export const REGLES_DE_DESTINATION = [
	{
		nom: 'vue V-xx',
		trace: 'V-37:1207 `data-vers="Accueil contributeur — vue V-07"` — rail, menus, fils',
		resoudre: (valeur) => {
			const m = /vue (V-\d\d)/.exec(valeur);
			return m ? { vue: m[1] } : null;
		}
	},
	{
		nom: 'connexion',
		trace:
			'V-06:676 `data-vers="connexion"` — « Revenir à la connexion ». ' +
			'`docs/routes.md` §3.2 : `/connexion` → V-05',
		resoudre: (valeur) => (valeur.trim() === 'connexion' ? { vue: 'V-05' } : null)
	}
];

/**
 * `data-vers` → la ou les routes de `docs/routes.md`.
 * @returns {{regle: string, vue: string, routes: string[]} | null}
 */
export function destinationDe(valeur, routesParVue) {
	if (!valeur) return null;
	for (const r of REGLES_DE_DESTINATION) {
		const t = r.resoudre(valeur);
		if (t) return { regle: r.nom, vue: t.vue, routes: routesParVue.get(t.vue) ?? [] };
	}
	return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. LES SIX GENRES D'INERTIE

   `attendu_au_gel` dit si le corpus DOIT exercer le genre. Un genre attendu et
   jamais rencontré est un refus d'instrument (code 2) : la règle serait
   espérée, pas posée. Un genre que seule une sonde éprouve est déclaré comme
   tel — et la sonde correspondante est son unique preuve.
   ═════════════════════════════════════════════════════════════════════════ */

export const GENRES = [
	{
		genre: 'lien-mort',
		quoi: 'un lien sans destination : pas de `href`, `href=""` ou `href="#"`',
		trace: 'P-03 « pas de lien mort » ; 681 `href="#"` au gel (ARB-013)',
		eprouve_par: 'corpus'
	},
	{
		genre: 'ancre-morte',
		quoi: 'une ancre intra-page dont aucun élément ne porte l’identifiant',
		trace: 'P-03 ; 34 liens d’évitement au gel (`.saut-contenu`, `#contenu`), tous résolus',
		eprouve_par: 'sonde'
	},
	{
		genre: 'hors-routes',
		quoi: 'une adresse absolue qui ne résout vers aucune route de `docs/routes.md`',
		trace: 'P-03 « une entrée visible est une entrée qui fonctionne » ; docs/routes.md §3',
		eprouve_par: 'sonde'
	},
	{
		genre: 'inactivee',
		quoi: 'une entrée rendue mais désactivée — `disabled` ou `aria-disabled="true"`',
		trace: 'P-03 « pas d’onglet grisé »',
		eprouve_par: 'sonde'
	},
	{
		genre: 'promesse',
		quoi: 'une entrée qui annonce son indisponibilité — « bientôt », « à venir »…',
		trace: 'P-03 « pas de "bientôt disponible" ». Aucun cas au gel : ÉPROUVÉ PAR SONDE',
		eprouve_par: 'sonde'
	},
	{
		genre: 'sans-nom',
		quoi: 'une entrée sans nom accessible : rien ne dit où elle mène',
		trace:
			'P-03 ; une entrée dont l’utilisateur ne peut pas lire la destination ne ' +
			'« fonctionne » pas au sens du principe. Recoupe RG-M18-09, batterie 10',
		eprouve_par: 'sonde'
	}
];

export const GENRE_INERTES = GENRES.map((g) => g.genre);

/* ═══════════════════════════════════════════════════════════════════════════
   4. LES ZONES DE MODULES — P-04, et elles sont DÉCLARÉES, pas devinées

   Chaque entrée est tracée à la maquette qui la porte. Une zone que le corpus
   ne satisfait jamais est nommée à l'exécution : sans quoi P-04 rendrait vert
   sur un cas qu'aucune vue ne joue.
   ═════════════════════════════════════════════════════════════════════════ */

export const ZONES_DE_MODULES = [
	{
		vue: 'V-11',
		zone: '#modules',
		entree: '.module',
		nomDepuis: 'module__nom',
		compteur: '#n-modules',
		obligation: 'tableau-de-bord',
		trace: 'V-11:1134-1136 et :2020-2060 — « N modules activés » puis une tuile par module'
	},
	{
		vue: 'V-28',
		zone: '.tg__modules',
		entree: '.mod-pastille',
		nomDepuis: 'title',
		compteur: null,
		obligation: 'liste-des-domaines',
		trace:
			'V-28:3002-3011 — une pastille par module activé, par ligne de domaine. ' +
			'La vue l’écrit elle-même (V-28:1372) : « un module désactivé n’apparaît nulle ' +
			'part pour ce domaine : ni onglet grisé, ni entrée morte »'
	}
];

/** Les cinq modules que `RG-STR-06` nomme. Comparés au vocabulaire MESURÉ. */
export const MODULES_RG_STR_06 = ['Notes', 'Fiches', 'Cartographie', 'Signets', 'Carte mentale'];

/* ═══════════════════════════════════════════════════════════════════════════
   5. LES FONCTIONS PURES — donc unitaires (`verif/menus.test.ts`)
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Le nom d'une entrée, SANS AUCUN BLANC.
 *
 * `ECART-041` : `\s+ → ' '` NE SUFFIT PAS. Le compilateur Svelte élague les
 * nœuds de texte blancs (P-8) ; le gel rend « Rétention État », l'application
 * « RétentionÉtat ». Une normalisation qui conserve un espace conserve la
 * divergence. On les retire tous — un nom n'est plus qu'une suite de
 * caractères non blancs, identique des deux côtés par construction.
 */
export function nomCompact(brut) {
	return String(brut ?? '')
		.replace(/\s+/gu, '')
		.normalize('NFC');
}

/**
 * La clé de rapprochement. LE RANG N'Y EST PAS — voir l'en-tête.
 * `occurrence` distingue deux entrées homonymes du même conteneur.
 */
export function cleDe(e) {
	return `${e.conteneur}│${e.balise}${e.role ? '[' + e.role + ']' : ''}│${e.nom}│${e.occurrence}`;
}

/** Pose `occurrence` sur une liste d'entrées relevées dans l'ordre du document. */
export function numeroter(entrees) {
	const vus = new Map();
	return entrees.map((e) => {
		const socle = `${e.conteneur}│${e.balise}${e.role ? '[' + e.role + ']' : ''}│${e.nom}`;
		const n = (vus.get(socle) ?? 0) + 1;
		vus.set(socle, n);
		return { ...e, occurrence: n, cle: cleDe({ ...e, occurrence: n }) };
	});
}

/**
 * Le genre d'inertie d'une entrée, ou `null`.
 *
 * L'ordre compte : une entrée sans destination est un lien mort avant d'être
 * quoi que ce soit d'autre. `href` est l'attribut BRUT — c'est lui que
 * l'utilisateur active, et c'est lui que `ARB-013` retire de l'instantané.
 */
export const RE_PROMESSE =
	/bient[oô]t|[àa]\s*venir|prochainement|en\s+cours\s+de\s+d[ée]veloppement/i;

export function genreDInertie(e) {
	if (e.disabled) return 'inactivee';
	if (RE_PROMESSE.test(e.nomBrut ?? '')) return 'promesse';
	if (e.estLien) {
		const h = e.href;
		if (h === null || h === undefined || h === '' || h === '#') return 'lien-mort';
		if (typeof h === 'string' && h.startsWith('#') && e.ancre === 'absente') return 'ancre-morte';
		if (e.cheminAbsolu && !e.route) return 'hors-routes';
	}
	if (!e.nom) return 'sans-nom';
	return null;
}

/**
 * Rapproche les entrées des deux côtés par leur clé, et rend le verdict.
 *
 * CINQ NATURES, et une seule rougit :
 *
 *   portage            l'application rend une entrée INERTE dont la maquette
 *                      DÉCLARE la destination et dont la route EXISTE. C'est
 *                      le seul défaut qu'un lot puisse fermer, et ARB-013 lui
 *                      a ouvert le chemin ;
 *   inerte-au-gel      inerte des deux côtés, aucune destination déclarée. Le
 *                      gel a le droit de l'être ; le deviner serait un
 *                      comblement. CONSTAT, jamais opposé ;
 *   gel-non-reporte    entrée du gel absente de l'application ;
 *   surplus-portage    entrée de l'application absente du gel ;
 *   instrument         la batterie ne tranche pas.
 */
export function confronter(gel, app, { routesParVue }) {
	const parCleGel = new Map(gel.map((e) => [e.cle, e]));
	const parCleApp = new Map(app.map((e) => [e.cle, e]));
	const lignes = [];

	for (const e of app) {
		const jumeau = parCleGel.get(e.cle) ?? null;
		const genre = genreDInertie(e);
		if (!genre) continue;
		const dest = destinationDe(e.vers, routesParVue);
		/* L'ORDRE DES CAS EST LE VERDICT, ET IL SE LIT DE HAUT EN BAS.
		   1. destination déclarée sans route : la batterie ne tranche pas — ni le
		      gel ni le portage ne peuvent y répondre, c'est `docs/routes.md` qui
		      manquerait ;
		   2. destination déclarée ET route existante : le produit avait de quoi
		      câbler, et il ne l'a pas fait. ARB-013 lui en a ouvert le chemin ;
		   3. aucune destination, aucune entrée jumelle au gel : l'application a
		      inventé une entrée — c'est le banc qui en juge, pas cette batterie ;
		   4. même inertie des deux côtés, aucune destination : le gel a le droit
		      d'être inerte (ARB-013), la deviner serait un comblement ;
		   5. une inertie que le gel n'a PAS : le portage l'a introduite. Rouge,
		      quelle que soit la destination — c'est une régression, pas un vide. */
		let nature;
		if (dest && !dest.routes.length) nature = 'instrument';
		else if (dest) nature = 'portage';
		else if (!jumeau) nature = 'surplus-portage';
		else if (genreDInertie(jumeau) === genre) nature = 'inerte-au-gel';
		else nature = 'portage';
		if (e.dansVerdict === false && nature !== 'inerte-au-gel') nature = 'hors-verdict';
		lignes.push({
			cle: e.cle,
			conteneur: e.conteneur,
			nom: e.nom,
			nomBrut: e.nomBrut ?? '',
			genre,
			nature,
			vers: e.vers ?? null,
			destination: dest ? `${dest.vue} → ${dest.routes.join(', ') || '(aucune route)'}` : null,
			href: e.href ?? null,
			rangGel: jumeau ? jumeau.rang : null,
			rangApp: e.rang
		});
	}

	for (const e of gel) {
		if (parCleApp.has(e.cle)) continue;
		lignes.push({
			cle: e.cle,
			conteneur: e.conteneur,
			nom: e.nom,
			nomBrut: e.nomBrut ?? '',
			genre: genreDInertie(e) ?? 'conforme',
			nature: e.dansVerdict === false ? 'hors-verdict' : 'gel-non-reporte',
			vers: e.vers ?? null,
			destination: null,
			href: e.href ?? null,
			rangGel: e.rang,
			rangApp: null
		});
	}
	for (const e of app) {
		if (parCleGel.has(e.cle)) continue;
		if (genreDInertie(e)) continue; // déjà porté ci-dessus en surplus-portage
		lignes.push({
			cle: e.cle,
			conteneur: e.conteneur,
			nom: e.nom,
			nomBrut: e.nomBrut ?? '',
			genre: 'conforme',
			nature: e.dansVerdict === false ? 'hors-verdict' : 'surplus-portage',
			vers: e.vers ?? null,
			destination: null,
			href: e.href ?? null,
			rangGel: null,
			rangApp: e.rang
		});
	}
	return lignes;
}

/**
 * LE CONTRÔLE DE LA CLÉ, DANS LES DEUX SENS — la leçon d'`ECART-041`.
 *
 * Une jointure produit deux fautes symétriques, et une batterie qui n'en
 * mesure qu'une croit tenir ce qu'elle ne tient pas :
 *
 *   sur-rapprochement — deux entrées différentes reçoivent la même clé. Témoin
 *     retenu : un écart de rang supérieur à `ECART_DE_RANG` entre les deux
 *     côtés. Le rang n'est PAS dans la clé, exprès ; il sert ici de juge ;
 *   sous-rapprochement — deux entrées identiques reçoivent des clés
 *     différentes. Témoin retenu : même rang des deux côtés, clés différentes,
 *     ET noms compacts égaux — c'est exactement le cas qu'`ECART-041` a
 *     fabriqué 31 fois.
 */
export const ECART_DE_RANG = 8;

export function controleDeCle(gel, app) {
	const parCleGel = new Map(gel.map((e) => [e.cle, e]));
	const parRangGel = new Map(gel.map((e) => [e.rang, e]));
	const surRapproches = [];
	const sousRapproches = [];
	for (const e of app) {
		const j = parCleGel.get(e.cle);
		if (j) {
			if (Math.abs(j.rang - e.rang) > ECART_DE_RANG)
				surRapproches.push({ cle: e.cle, rangGel: j.rang, rangApp: e.rang });
			continue;
		}
		const memeRang = parRangGel.get(e.rang);
		if (memeRang && memeRang.nom === e.nom)
			sousRapproches.push({ rang: e.rang, gel: memeRang.cle, app: e.cle });
	}
	return { surRapproches, sousRapproches };
}

/* ── P-04 ──────────────────────────────────────────────────────────────── */

/**
 * Le verdict d'une zone de modules, un état, les deux côtés.
 *
 * Une zone peut avoir PLUSIEURS instances — `V-28` en rend une par ligne de
 * domaine. Chacune est jugée pour elle-même : agréger les lignes ferait
 * disparaître exactement ce que P-04 exige de voir, la différence d'un domaine
 * à l'autre.
 *
 * `vocabulaire` est l'union des noms de module observés sur TOUS les états de
 * la vue, des deux côtés. Il n'est pas écrit : il est mesuré. Un module du
 * vocabulaire absent de l'instance doit être absent du DOM — pas caché (M-2).
 *
 * UNE INSTANCE NON RENDUE N'EST PAS JUGÉE, et c'est un refus délibéré : une
 * zone que l'état n'affiche pas ne dit rien de l'activation d'un module. La
 * planche de `V-11` en donne le cas — l'état « sans note » masque la zone en
 * laissant les six tuiles au DOM. Les compter serait imputer à P-04 ce qui
 * relève de l'état vide de RG-M18-03, mesuré par la batterie 9.
 */
export function verdictModules(gel, app, vocabulaire) {
	const defauts = [];
	if (!gel) return defauts;
	const paires = Math.max(gel.instances.length, app ? app.instances.length : 0);
	if (app && gel.instances.length !== app.instances.length)
		defauts.push({
			obligation: 'M-3',
			cote: 'portage',
			detail: `${gel.instances.length} instance(s) au gel, ${app.instances.length} au portage`
		});
	for (let i = 0; i < paires; i++) {
		const g = gel.instances[i] ?? null;
		const a = app ? (app.instances[i] ?? null) : null;
		for (const [nom, c] of [
			['gel', g],
			['portage', a]
		]) {
			if (!c || !c.rendue) continue;
			// M-1 — le compte annoncé par la vue et le compte rendu.
			if (c.annonce !== null && c.annonce !== c.rendus.length)
				defauts.push({
					obligation: 'M-1',
					cote: nom,
					detail: `instance ${i} : annonce ${c.annonce}, rend ${c.rendus.length}`
				});
			// M-2 — absence, pas masquage.
			const rendus = new Set(c.rendus);
			const fantomes = c.presents.filter((m) => !rendus.has(m));
			if (fantomes.length)
				defauts.push({
					obligation: 'M-2',
					cote: nom,
					detail: `instance ${i} : au DOM sans être rendu(s) — ${fantomes.join(', ')}`
				});
			const inconnus = c.presents.filter((m) => !vocabulaire.includes(m));
			if (inconnus.length)
				defauts.push({
					obligation: 'M-2',
					cote: nom,
					detail: `instance ${i} : hors vocabulaire — ${inconnus.join(', ')}`
				});
		}
		// M-3 — l'application rend le même ensemble que le gel.
		if (g && g.rendue && a) {
			const eg = [...g.rendus].sort().join('|');
			const ea = [...a.rendus].sort().join('|');
			if (eg !== ea)
				defauts.push({
					obligation: 'M-3',
					cote: 'portage',
					detail: `instance ${i} : gel [${eg}] ≠ portage [${ea}]`
				});
		}
	}
	return defauts;
}

/** M-4 — l'activation pilote-t-elle réellement le rendu ? */
export function effectivite(ensembles) {
	const distincts = new Set(ensembles.map((e) => [...e].sort().join('|')));
	return { etats: ensembles.length, distincts: distincts.size, effectif: distincts.size > 1 };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LA SONDE — exécutée DANS la page, sérialisée par Playwright.

   DÉFINITION MÉCANIQUE D'UNE ENTRÉE DE NAVIGATION, et elle ne s'invente pas.
   Aucune source du dépôt n'énumère les entrées de navigation des 41 vues ;
   trois critères, chacun tracé :

     a) elle est INTERACTIVE — `a`, `button`, `summary`, ou un rôle de la liste
        ARIA des commandes de navigation ;
     b) elle est RENDUE — boîte non nulle, ni `display:none` ni
        `visibility:hidden`. Une entrée qui ne s'affiche pas n'est pas « une
        entrée visible » au sens de P-03 ;
     c) et elle est SOIT dans un conteneur de navigation — `nav`,
        `[role=navigation|menu|menubar|tablist|tree|toolbar]`, un `aside` ou un
        `header` nommé —, SOIT porteuse d'une destination déclarée
        (`data-vers`), SOIT un lien d'évitement (`.saut-contenu`, V-37:1193).

   Tout autre lien est relevé au REGISTRE B — les liens de contenu. Ils sont
   chiffrés, jamais opposés à P-03 : le principe nomme les entrées de MENU.
   ═════════════════════════════════════════════════════════════════════════ */

const CONTENEURS =
	'nav,[role="navigation"],[role="menu"],[role="menubar"],[role="tablist"],[role="tree"],[role="toolbar"],aside[aria-label],header[aria-label],header';
const INTERACTIFS =
	'a,button,summary,[role="link"],[role="button"],[role="menuitem"],[role="menuitemradio"],' +
	'[role="menuitemcheckbox"],[role="tab"],[role="treeitem"],[role="option"]';

const SONDE = ({ conteneurs, interactifs, zonesModules, zonesComparees }) => {
	const rend = (n) => {
		const s = getComputedStyle(n);
		if (s.display === 'none' || s.visibility === 'hidden') return false;
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	const compact = (t) =>
		String(t ?? '')
			.replace(/\s+/gu, '')
			.normalize('NFC');
	const nomDe = (n) => {
		const l = n.getAttribute('aria-label');
		if (l) return l;
		const by = n.getAttribute('aria-labelledby');
		if (by) return document.getElementById(by)?.textContent ?? '';
		const t = n.getAttribute('title');
		return n.textContent || t || '';
	};
	const cleConteneur = (c) =>
		c
			? c.tagName.toLowerCase() +
				(c.id ? '#' + c.id : '') +
				(c.getAttribute('aria-label') ? '[' + compact(c.getAttribute('aria-label')) + ']' : '')
			: '(hors conteneur)';

	/* ARB-012 — une vue qui déclare des ZONES COMPARÉES ne fait juger que
	   celles-là. V-37 déclare `aside.rail` et `header.barre` : son `<main>` est
	   « le contenu de V-07, la note de démonstration celle de V-14, chacun
	   couvert par son propre lot ». Le banc ne le juge pas ; cette batterie non
	   plus. Le CONSTAT est conservé, le verdict de portage est retiré. */
	const dansVerdict = (n) =>
		zonesComparees.length === 0 || zonesComparees.some((z) => n.matches(z) || n.closest(z));

	const entrees = [];
	const contenu = [];
	let rang = 0;
	for (const n of document.querySelectorAll(interactifs)) {
		if (!rend(n)) continue;
		const conteneur = n.closest(conteneurs);
		const vers = n.getAttribute('data-vers');
		const saut = n.classList.contains('saut-contenu');
		const estLien = n.tagName === 'A' || n.getAttribute('role') === 'link';
		const href = n.hasAttribute('href') ? n.getAttribute('href') : null;
		let ancre = null;
		let cheminAbsolu = null;
		if (typeof href === 'string') {
			if (href.startsWith('#') && href !== '#') {
				const id = decodeURIComponent(href.slice(1));
				ancre =
					document.getElementById(id) || document.getElementsByName(id).length
						? 'presente'
						: 'absente';
			} else if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
				cheminAbsolu = null; // adresse externe : hors de portée, voir la non-couverture
			} else if (href.startsWith('/')) {
				cheminAbsolu = href.split('?')[0].split('#')[0];
			}
		}
		const brut = nomDe(n);
		const fiche = {
			rang: rang++,
			conteneur: cleConteneur(conteneur),
			balise: n.tagName.toLowerCase(),
			role: n.getAttribute('role') ?? '',
			nom: compact(brut),
			nomBrut: String(brut).replace(/\s+/gu, ' ').trim().slice(0, 60),
			href,
			estLien,
			ancre,
			cheminAbsolu,
			externe: typeof href === 'string' && /^[a-z][a-z0-9+.-]*:/i.test(href),
			vers: vers ?? null,
			disabled: n.hasAttribute('disabled') || n.getAttribute('aria-disabled') === 'true',
			dansVerdict: dansVerdict(n),
			classes: n.getAttribute('class') ?? ''
		};
		if (conteneur || vers || saut) entrees.push(fiche);
		else if (estLien) contenu.push(fiche);
	}

	/* ── P-04 — les zones de modules déclarées ────────────────────────────── */
	const modules = {};
	for (const z of zonesModules) {
		const zones = [...document.querySelectorAll(z.zone)];
		const nomDuModule = (e) => {
			if (z.nomDepuis === 'title') return String(e.getAttribute('title') ?? '').trim();
			if (z.nomDepuis === 'module__nom') {
				const t = e.querySelector('.module__nom');
				return String(t ? (t.childNodes[0]?.textContent ?? '') : nomDe(e))
					.replace(/\s+/gu, ' ')
					.trim();
			}
			return String(nomDe(e)).replace(/\s+/gu, ' ').trim();
		};
		modules[z.vue + z.zone] = {
			vue: z.vue,
			zone: z.zone,
			instances: zones.map((zone) => {
				const noeuds = [...zone.querySelectorAll(z.entree)];
				const compteur = z.compteur ? document.querySelector(z.compteur) : null;
				const annonce = compteur ? Number((compteur.textContent.match(/\d+/) ?? [null])[0]) : null;
				return {
					rendue: rend(zone),
					annonce: Number.isFinite(annonce) ? annonce : null,
					rendus: noeuds.filter(rend).map(nomDuModule).filter(Boolean),
					presents: noeuds.map(nomDuModule).filter(Boolean)
				};
			})
		};
	}

	return {
		entrees,
		contenu,
		zonesModulesAbsentes: zonesModules
			.filter((z) => !document.querySelector(z.zone))
			.map((z) => z.zone),
		modules
	};
};

/* ═══════════════════════════════════════════════════════════════════════════
   7. LES SONDES — la preuve que la batterie sait dire non (RA-01)

   Chacune perturbe LE SEUL CÔTÉ CANDIDAT, et le code retour est INVERSÉ : la
   batterie doit nommer le genre attendu en nature `portage`. Une batterie
   qu'on n'a jamais vue rougir ne prouve rien de ses verts.
   ═════════════════════════════════════════════════════════════════════════ */

export const SONDES = {
	/* LA PERTURBATION DOIT PRODUIRE UN SIGNAL QUE LA MESURE NORMALE NE PRODUIT
	   PAS. `lien-mort` visait d'abord une entrée du rail — or celles-là sont
	   DÉJÀ en `portage` sans aucune perturbation : la sonde rendait le même
	   chiffre que la mesure, et ne prouvait donc rien (RA-01). Elle vise
	   maintenant le lien d'évitement, qui est conforme au repos. `site_attendu`
	   exige en outre que la ligne trouvée soit CELLE DU SITE PERTURBÉ : sans
	   quoi une sonde pourrait se déclarer satisfaite d'un défaut préexistant. */
	'lien-mort': {
		quoi: 'le lien d’évitement du candidat privé de son `href` — conforme au repos',
		vue_conseillee: 'V-07 — V-37 ne ferait PAS juger le lien d’évitement (ARB-012)',
		genre_attendu: 'lien-mort',
		nature_attendue: 'portage',
		site_attendu: /Aller au contenu/i,
		poser: (page) =>
			page.evaluate(() => {
				const a = document.querySelector('a.saut-contenu');
				if (!a) return false;
				a.removeAttribute('href');
				return true;
			})
	},
	'ancre-morte': {
		quoi: 'la cible du lien d’évitement retirée du candidat',
		vue_conseillee: 'V-07 — même motif',
		genre_attendu: 'ancre-morte',
		nature_attendue: 'portage',
		site_attendu: /Aller au contenu/i,
		poser: (page) =>
			page.evaluate(() => {
				const a = document.querySelector('a[href^="#"]:not([href="#"])');
				if (!a) return false;
				const cible = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
				if (!cible) return false;
				cible.removeAttribute('id');
				return true;
			})
	},
	promesse: {
		quoi: 'une entrée du rail qui annonce « bientôt disponible »',
		genre_attendu: 'promesse',
		nature_attendue: 'portage',
		site_attendu: /bient/i,
		poser: (page) =>
			page.evaluate(() => {
				const a = document.querySelector('a[data-vers]');
				if (!a) return false;
				a.setAttribute('aria-label', 'Cartographie — bientôt disponible');
				return true;
			})
	},
	'hors-routes': {
		quoi: 'une entrée du rail câblée sur une adresse qu’aucune route ne sert',
		genre_attendu: 'hors-routes',
		nature_attendue: 'portage',
		site_attendu: /./,
		poser: (page) =>
			page.evaluate(() => {
				const a = document.querySelector('a[data-vers]');
				if (!a) return false;
				a.setAttribute('href', '/domaines/infrastructure');
				return true;
			})
	},
	inactivee: {
		quoi: 'une entrée du rail grisée — `aria-disabled="true"`',
		genre_attendu: 'inactivee',
		nature_attendue: 'portage',
		site_attendu: /./,
		poser: (page) =>
			page.evaluate(() => {
				const a = document.querySelector('a[data-vers]');
				if (!a) return false;
				a.setAttribute('aria-disabled', 'true');
				return true;
			})
	},
	'sans-nom': {
		quoi: 'une entrée du rail câblée sur une vraie route mais privée de son nom',
		genre_attendu: 'sans-nom',
		nature_attendue: 'portage',
		site_attendu: /^$/,
		poser: (page) =>
			page.evaluate(() => {
				const a = document.querySelector('a[data-vers]');
				if (!a) return false;
				// L'adresse doit être VALIDE, sinon `lien-mort` prend le pas sur
				// `sans-nom` : l'ordre des genres est celui de `genreDInertie()`.
				a.setAttribute('href', '/cartographie');
				a.removeAttribute('aria-label');
				a.removeAttribute('title');
				a.textContent = '';
				return true;
			})
	},
	'module-fantome': {
		quoi: 'un module désactivé remis au DOM, masqué — le « ni onglet grisé » de P-04',
		genre_attendu: 'M-2',
		nature_attendue: 'p-04',
		site_attendu: /./,
		poser: (page) =>
			page.evaluate(() => {
				const zone = document.querySelector('#modules');
				if (!zone) return false;
				const modele = zone.querySelector('.module');
				if (!modele) return false;
				const copie = modele.cloneNode(true);
				const nom = copie.querySelector('.module__nom');
				if (nom && nom.childNodes[0]) nom.childNodes[0].textContent = 'Cartographie';
				copie.setAttribute('style', 'display:none');
				zone.appendChild(copie);
				return true;
			})
	}
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. EXÉCUTION
   ═════════════════════════════════════════════════════════════════════════ */

export function scenarioDe(vue) {
	return JSON.parse(readFileSync(join(DOSSIER_SCENARIOS, `${vue}.json`), 'utf8'));
}

async function executer(args) {
	const t0 = Date.now();
	const option = (nom, defaut = null) => {
		const t = args.find((a) => a.startsWith(`--${nom}=`));
		return t ? t.slice(nom.length + 3) : defaut;
	};
	const demandees = args.filter((a) => /^V-\d\d$/.test(a));
	const filtreEtats = option('etats') ? option('etats').split(',') : null;
	const cote = option('cote', 'deux');
	const nomSonde = option('sonde');
	const enJson = args.includes('--json');
	const detail = args.includes('--entrees');
	const base = option('base');
	const concurrence = Math.max(1, Number(option('concurrence', '6')));
	const seuilBrut = option('seuil-gel');
	const seuilGel = seuilBrut === null ? null : Number(seuilBrut);

	if (!['deux', 'gel', 'app'].includes(cote)) {
		console.error(`verif:menus — côté « ${cote} » inconnu. Attendus : deux, gel, app.`);
		process.exit(2);
	}
	if (seuilGel !== null && !Number.isInteger(seuilGel)) {
		console.error('verif:menus — `--seuil-gel=` attend un entier.');
		process.exit(2);
	}
	if (nomSonde && !SONDES[nomSonde]) {
		console.error(
			`verif:menus — sonde « ${nomSonde} » inconnue. Connues : ${Object.keys(SONDES).join(', ')}.`
		);
		process.exit(2);
	}

	/* ── Les routes, et leur contrôle d'intégrité ────────────────────────── */
	const routes = routesDuDepot();
	const declare = declareParRoutes();
	const routesParVue = new Map([...declare.values()].map((d) => [d.vue, d.routes]));
	/* `docs/routes.md` §9 arrête le total à 40 : 39 CHEMINS distincts, plus la
	   capture des adresses non résolues, qui n'est pas un chemin (« pas de route
	   propre : réponse 404 rendue à l'adresse demandée »). Si l'extraction cesse
	   d'accorder les deux, c'est que la source a bougé — et un instrument qui
	   mesure contre une source qu'il ne reconnaît plus mesure autre chose. */
	const ATTENDU_ROUTES = 39;
	if (routes.length !== ATTENDU_ROUTES) {
		console.error(
			`\nverif:menus — ${routes.length} route(s) extraites du §3 de docs/routes.md, ` +
				`${ATTENDU_ROUTES} attendues (§9 : 40 routes, dont la capture 404 qui n'est pas un chemin).\n` +
				'  La source a bougé, ou l’extraction est fausse. Refus avant toute mesure.\n'
		);
		process.exit(2);
	}

	const toutes = vuesDuGel().map((v) => v.vue);
	const vues = demandees.length ? demandees : toutes;
	for (const v of vues)
		if (!toutes.includes(v)) {
			console.error(`verif:menus — vue inconnue : ${v}`);
			process.exit(2);
		}

	const { chromium } = await import('@playwright/test');
	const { ouvrirPage, reglerPlanche } = await import('./banc/capture.mjs');
	const conditions = await import('./banc/conditions.mjs');
	const { servir } = await import('./banc/serveur.mjs');
	const { adresseDeLEtat, declarationEtatDeZone, PREFIXE } = await import('./banc/mode-demo.mjs');
	const {
		FENETRE_PRINCIPALE,
		retirerBlocsHorsProduit,
		avancer,
		AVANCE_ETAT_MS,
		AVANCE_CHARGEMENT_MS,
		POINTEUR_AU_REPOS
	} = conditions;

	console.log('\n═══ pnpm verif:menus — batterie 16, menu vivant (P-03, P-04, RG-STR-06) ═══\n');
	console.log(`  ${vues.length} vue(s) · fenêtre ${FENETRE_PRINCIPALE} · côtés : ${cote}`);
	console.log(`  routes lues dans docs/routes.md §3 : ${routes.length} chemins distincts`);
	console.log(`  genres d'inertie déclarés : ${GENRES.map((g) => g.genre).join(', ')}`);
	console.log(
		`  zones de modules déclarées : ${ZONES_DE_MODULES.map((z) => z.vue + z.zone).join(', ')}`
	);
	if (cote !== 'deux')
		console.log(
			`\n  ⚠ --cote=${cote} : un seul côté relevé, le CLASSEMENT EN NATURES est suspendu.\n` +
				'    Régime de diagnostic — sans les deux côtés, rien ne distingue un défaut du\n' +
				'    portage d’une inertie que le gel porte déjà.'
		);
	if (nomSonde)
		console.log(
			`\n  ⚠ SONDE « ${nomSonde} » — ${SONDES[nomSonde].quoi}.\n` +
				`    Code retour INVERSÉ : la batterie doit nommer « ${SONDES[nomSonde].genre_attendu} »\n` +
				`    en nature « ${SONDES[nomSonde].nature_attendue} ». Un banc toujours vert ne prouve rien.`
		);

	/* ── Les serveurs ────────────────────────────────────────────────────── */
	const serveurGel = await servir(RACINE_MAQUETTES);
	let serveurApp = null;
	if (cote !== 'gel') {
		if (base) serveurApp = { origine: base.replace(/\/$/, ''), fermer: async () => {} };
		else {
			const { createServer } = await import('vite');
			const vite = await createServer({
				configFile: join(racine, 'vite.config.ts'),
				root: racine,
				server: { port: 0, strictPort: false },
				logLevel: 'warn'
			});
			await vite.listen();
			const origine = vite.resolvedUrls?.local?.[0]?.replace(/\/$/, '');
			if (!origine) {
				console.error('verif:menus — le serveur de développement n’a pas rendu d’adresse.');
				process.exit(2);
			}
			serveurApp = { origine, fermer: () => vite.close() };
		}
		const s = await fetch(`${serveurApp.origine}${PREFIXE}/`).catch(() => null);
		if (!s || !s.ok) {
			console.error(
				`\nverif:menus — le mode démo ne répond pas sur ${serveurApp.origine}${PREFIXE}/.\n` +
					'  Sans lui, le côté PORTAGE n’a aucun chemin (ÉCART-011 É-1) : la batterie\n' +
					'  mesurerait le gel en croyant mesurer les deux. Refus.\n'
			);
			await serveurGel.fermer();
			await serveurApp.fermer();
			process.exit(2);
		}
		console.log(`  application : ${serveurApp.origine}`);
	}
	console.log(`  gel : ${serveurGel.origine}\n`);

	/* ── Le relevé d'un côté ─────────────────────────────────────────────── */
	async function relever(navigateur, vue, scenario, etat, quel) {
		const app = quel === 'app';
		const adresse = app
			? `${serveurApp.origine}${adresseDeLEtat(vue, etat.cle, 'app', AVANCE_CHARGEMENT_MS)}`
			: `${serveurGel.origine}/${scenario.maquette.replace(/^mockups\//, '')}`;
		const { page, contexte, statut } = await ouvrirPage(navigateur, adresse, FENETRE_PRINCIPALE);
		try {
			if (app && statut !== null && statut >= 400)
				return { echec: `le mode démo a répondu ${statut}` };
			if (!app) {
				if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
				else if (scenario.defaut && scenario.planche) await reglerPlanche(page, scenario.defaut);
				if (etat.zone?.declencheur) {
					const d = etat.zone.declencheur;
					const cible =
						typeof d === 'string'
							? page.locator(d).first()
							: page.locator(d.selecteur).nth(d.index);
					await cible.click();
					await page.evaluate(() => window.scrollTo(0, 0));
					await page.mouse.move(...POINTEUR_AU_REPOS);
					await avancer(page, AVANCE_ETAT_MS);
				}
				// PLAN §4.2 — la planche de revue n'est pas le produit.
				await retirerBlocsHorsProduit(page);
			} else {
				// Le même budget d'horloge des deux côtés, dans le même ordre.
				if (etat.vecteur || (scenario.defaut && scenario.planche))
					await avancer(page, AVANCE_ETAT_MS);
				if (etat.zone?.declencheur) await avancer(page, AVANCE_ETAT_MS);
				/* LA PERTURBATION DOIT ÊTRE CONSTATÉE, PAS ESPÉRÉE. Une sonde dont
				   le sélecteur ne trouve rien ne perturbe rien, et la batterie
				   sortirait alors en 1 en accusant l'instrument de ne pas savoir
				   dire non — alors que personne ne lui a rien dit. Mesuré : la
				   sonde `hors-routes` a rendu ce faux négatif une fois sur deux. */
				if (nomSonde) {
					const posee = await SONDES[nomSonde].poser(page);
					if (!posee)
						return { echec: `sonde « ${nomSonde} » non posée : cible absente de la page` };
				}
			}
			const brut = await page.evaluate(SONDE, {
				conteneurs: CONTENEURS,
				interactifs: INTERACTIFS,
				zonesModules: ZONES_DE_MODULES.filter((z) => z.vue === vue),
				zonesComparees: conditions.zonesDe(vue)
			});
			return {
				statut,
				entrees: numeroter(
					brut.entrees.map((e) => ({
						...e,
						route: e.cheminAbsolu ? routeDe(e.cheminAbsolu, routes) : null
					}))
				),
				contenu: numeroter(
					brut.contenu.map((e) => ({
						...e,
						route: e.cheminAbsolu ? routeDe(e.cheminAbsolu, routes) : null
					}))
				),
				modules: brut.modules,
				zonesModulesAbsentes: brut.zonesModulesAbsentes
			};
		} catch (e) {
			return { echec: String(e?.message ?? e).slice(0, 200) };
		} finally {
			await page.close().catch(() => {});
			await contexte.close().catch(() => {});
		}
	}

	/* P-14 — l'horloge du banc ne survit pas au parallélisme : `install({time:T})`
	   la laisse courir jusqu'à `pauseAt(T)`. `conditions.mjs` est en écriture
	   humaine seule ; on rejoue, on ne le répare pas ici. */
	async function avecReprise(travail, essais = 3) {
		let derniere = null;
		for (let n = 0; n < essais; n++) {
			try {
				return await travail();
			} catch (e) {
				derniere = e;
				if (!String(e?.message ?? e).includes('Cannot fast-forward to the past')) throw e;
				await new Promise((r) => setTimeout(r, 120 * (n + 1)));
			}
		}
		throw derniere;
	}

	const taches = [];
	for (const vue of vues) {
		const s = scenarioDe(vue);
		for (const etat of s.etats)
			if (!filtreEtats || filtreEtats.includes(etat.cle)) taches.push({ vue, scenario: s, etat });
	}

	const navigateur = await chromium.launch();
	const resultats = [];
	let faits = 0;
	const file = [...taches];
	await Promise.all(
		Array.from({ length: Math.min(concurrence, file.length) }, async () => {
			for (let t = file.shift(); t; t = file.shift()) {
				const ligne = { vue: t.vue, etat: t.etat.cle, libelle: t.etat.libelle, echec: null };
				try {
					if (t.etat.zone && cote !== 'gel' && !declarationEtatDeZone(t.vue))
						throw new Error('état de zone sans protocole déclaré');
					ligne.gel =
						cote === 'app'
							? null
							: await avecReprise(() => relever(navigateur, t.vue, t.scenario, t.etat, 'gel'));
					ligne.app =
						cote === 'gel'
							? null
							: await avecReprise(() => relever(navigateur, t.vue, t.scenario, t.etat, 'app'));
					if (ligne.gel?.echec || ligne.app?.echec)
						throw new Error(ligne.gel?.echec ?? ligne.app?.echec);
				} catch (e) {
					ligne.echec = String(e?.message ?? e).slice(0, 200);
				}
				resultats.push(ligne);
				faits++;
				if (faits % 40 === 0) process.stdout.write(`  … ${faits}/${taches.length} états\n`);
			}
		})
	);
	await navigateur.close();
	await serveurGel.fermer();
	if (serveurApp) await serveurApp.fermer();

	resultats.sort((a, b) =>
		a.vue === b.vue ? a.etat.localeCompare(b.etat) : a.vue.localeCompare(b.vue)
	);

	/* ── Confrontation ───────────────────────────────────────────────────── */
	const echecs = resultats.filter((r) => r.echec);
	const toutesLignes = [];
	const controles = { surRapproches: [], sousRapproches: [] };
	const genresVus = { gel: new Map(), portage: new Map() };
	let entreesGel = 0;
	let entreesApp = 0;
	let contenuGel = 0;

	for (const r of resultats) {
		if (r.echec) continue;
		const gel = r.gel?.entrees ?? [];
		const app = r.app?.entrees ?? [];
		entreesGel += gel.length;
		entreesApp += app.length;
		contenuGel += r.gel?.contenu?.length ?? 0;
		for (const e of gel) {
			const g = genreDInertie(e);
			if (g) genresVus.gel.set(g, (genresVus.gel.get(g) ?? 0) + 1);
		}
		for (const e of app) {
			const g = genreDInertie(e);
			if (g) genresVus.portage.set(g, (genresVus.portage.get(g) ?? 0) + 1);
		}
		if (cote !== 'deux') continue;
		const c = controleDeCle(gel, app);
		for (const x of c.surRapproches)
			controles.surRapproches.push({ ...x, vue: r.vue, etat: r.etat });
		for (const x of c.sousRapproches)
			controles.sousRapproches.push({ ...x, vue: r.vue, etat: r.etat });
		for (const l of confronter(gel, app, { routesParVue }))
			toutesLignes.push({ ...l, vue: r.vue, etat: r.etat });
	}

	/* ── LA TABLE ÉPROUVÉE — piège P-5 ───────────────────────────────────── */
	const genresInertes = GENRES.filter(
		(g) =>
			g.eprouve_par === 'corpus' && !genresVus.gel.get(g.genre) && !genresVus.portage.get(g.genre)
	);
	if (genresInertes.length && !nomSonde && !demandees.length) {
		console.error(
			`\nverif:menus — ${genresInertes.length} genre(s) déclaré(s) attendu(s) au gel et ` +
				`qu'AUCUNE entrée du corpus n'exerce :\n    ${genresInertes.map((g) => g.genre).join('\n    ')}\n` +
				'  Une règle qu’aucun cas n’exerce rend le même verdict qu’une règle qui marche :\n' +
				'  elle est espérée, pas posée (CLAUDE.md §6 P-5). Refus d’instrument.\n'
		);
		process.exit(2);
	}

	/* ── P-04 ────────────────────────────────────────────────────────────── */
	const p04 = [];
	for (const z of ZONES_DE_MODULES) {
		const lignes = resultats.filter((r) => r.vue === z.vue && !r.echec);
		const cle = z.vue + z.zone;
		const observes = lignes
			.map((r) => ({
				etat: r.etat,
				gel: r.gel?.modules?.[cle] ?? null,
				app: r.app?.modules?.[cle] ?? null
			}))
			.filter((x) => x.gel || x.app);
		const instances = observes.flatMap((x) => [
			...(x.gel?.instances ?? []),
			...(x.app?.instances ?? [])
		]);
		const rendues = instances.filter((i) => i.rendue);
		const vocabulaire = [...new Set(instances.flatMap((i) => i.presents))].sort();
		const defauts = [];
		for (const x of observes)
			for (const d of verdictModules(x.gel, x.app, vocabulaire))
				defauts.push({ ...d, vue: z.vue, zone: z.zone, etat: x.etat });
		const eff = effectivite(
			observes.flatMap((x) => (x.gel?.instances ?? []).filter((i) => i.rendue).map((i) => i.rendus))
		);
		p04.push({
			...z,
			presente: instances.length > 0,
			rendue: rendues.length > 0,
			etats: observes.length,
			instances: instances.length,
			instancesRendues: rendues.length,
			vocabulaire,
			defauts,
			effectivite: eff,
			observes: observes.map((x) => ({
				etat: x.etat,
				gel: (x.gel?.instances ?? []).filter((i) => i.rendue).map((i) => i.rendus),
				app: (x.app?.instances ?? []).filter((i) => i.rendue).map((i) => i.rendus)
			}))
		});
	}

	/* ── Les routes qu'aucune entrée ne nomme ────────────────────────────── */
	const destinationsVues = new Map();
	for (const r of resultats) {
		for (const cote2 of ['gel', 'app']) {
			for (const e of r[cote2]?.entrees ?? []) {
				const d = destinationDe(e.vers, routesParVue);
				if (!d) continue;
				for (const route of d.routes)
					destinationsVues.set(route, (destinationsVues.get(route) ?? 0) + 1);
			}
		}
	}
	const routesOrphelines = routes.filter((r) => !destinationsVues.has(r));
	const versNonResolus = [
		...new Set(
			resultats.flatMap((r) =>
				['gel', 'app'].flatMap((c) =>
					(r[c]?.entrees ?? [])
						.filter((e) => e.vers && !destinationDe(e.vers, routesParVue))
						.map((e) => e.vers)
				)
			)
		)
	].sort();

	/* ── Le décompte ─────────────────────────────────────────────────────── */
	const NATURES = [
		'portage',
		'inerte-au-gel',
		'gel-non-reporte',
		'surplus-portage',
		'hors-verdict',
		'instrument'
	];
	const compte = Object.fromEntries(NATURES.map((n) => [n, 0]));
	for (const l of toutesLignes) compte[l.nature] = (compte[l.nature] ?? 0) + 1;
	/* Les entrées de la COQUILLE se répètent à l'identique dans les 35 vues
	   qu'elle enveloppe : le décompte brut les dirait 35 fois et un lecteur y
	   lirait 35 défauts. Les deux chiffres sont donnés — le brut parce que
	   c'est ce que le dépôt rend, le dédupliqué parce que c'est ce qu'il y a à
	   corriger. */
	const siteDe = (l) => `${l.conteneur}│${l.nom}│${l.genre}`;
	const dedup = (nature) =>
		new Set(toutesLignes.filter((l) => l.nature === nature).map(siteDe)).size;

	if (enJson) {
		console.log(
			JSON.stringify(
				{ routes, compte, lignes: toutesLignes, p04, controles, routesOrphelines, echecs },
				null,
				'\t'
			)
		);
		process.exit(0);
	}

	/* ═══ RAPPORT ═══════════════════════════════════════════════════════ */
	console.log('─── Ce que la batterie a parcouru ───\n');
	console.log(
		`  ${resultats.length} état(s) sur ${vues.length} vue(s)` +
			(cote === 'deux' ? `, deux côtés — ${resultats.length * 2} pages chargées` : '')
	);
	console.log(
		`  entrées de navigation rendues : ${entreesGel} au gel` +
			(cote === 'deux' ? `, ${entreesApp} au portage` : '')
	);
	console.log(`  liens de contenu relevés (registre B, non opposables) : ${contenuGel}`);

	console.log('\n─── Les genres d’inertie, et ce qui les exerce ───\n');
	for (const g of GENRES) {
		const ng = genresVus.gel.get(g.genre) ?? 0;
		const np = genresVus.portage.get(g.genre) ?? 0;
		const etat =
			ng + np > 0
				? 'exercé par le corpus'
				: g.eprouve_par === 'corpus'
					? 'INERTE — refus d’instrument'
					: `aucun cas au corpus — éprouvé par \`--sonde=${g.genre}\``;
		console.log(
			`  ${g.genre.padEnd(14)} gel ${String(ng).padStart(5)}  portage ${String(np).padStart(5)}  ${etat}`
		);
		console.log(`    ${g.quoi}\n      trace : ${g.trace}`);
	}

	if (cote === 'deux') {
		console.log('\n─── Le verdict, par nature ───\n');
		console.log(
			`    PORTAGE           ${String(compte.portage).padStart(6)}  (${dedup('portage')} site(s) distinct(s))\n` +
				'      — l’application rend une entrée INERTE dont la maquette déclare la\n' +
				'        destination et dont la route existe. ARB-013 a ouvert ce chemin :\n' +
				'        le produit peut porter l’adresse sans échouer au banc. LE SEUL ROUGE.\n' +
				`    inerte au gel     ${String(compte['inerte-au-gel']).padStart(6)}  (${dedup('inerte-au-gel')} site(s) distinct(s))\n` +
				'      — inerte des deux côtés, AUCUNE destination déclarée. Le gel a le droit\n' +
				'        de l’être (ARB-013) et la deviner serait un comblement. CONSTAT.\n' +
				`    gel non reporté   ${String(compte['gel-non-reporte']).padStart(6)}  entrée du gel absente de l’application\n` +
				`    surplus portage   ${String(compte['surplus-portage']).padStart(6)}  entrée de l’application absente du gel\n` +
				`    hors verdict      ${String(compte['hors-verdict']).padStart(6)}  entrée que sa vue ne fait pas juger (ARB-012)\n` +
				`    instrument        ${String(compte.instrument).padStart(6)}  la batterie ne tranche pas — non opposable`
		);

		const parGenre = new Map();
		for (const l of toutesLignes) {
			const k = `${l.nature} ${l.genre}`;
			const e = parGenre.get(k) ?? {
				nature: l.nature,
				genre: l.genre,
				n: 0,
				sites: new Set(),
				vues: new Set()
			};
			e.n++;
			e.sites.add(siteDe(l));
			e.vues.add(l.vue);
			parGenre.set(k, e);
		}
		for (const nature of NATURES) {
			const lot = [...parGenre.values()]
				.filter((x) => x.nature === nature)
				.sort((a, b) => b.n - a.n);
			if (!lot.length) continue;
			console.log(`\n  ${nature} — par genre :`);
			for (const x of lot)
				console.log(
					`    ${String(x.n).padStart(6)}  ${x.genre.padEnd(16)} ${String(x.sites.size).padStart(4)} site(s), ${String(x.vues.size).padStart(2)} vue(s)`
				);
		}

		const portage = toutesLignes.filter((l) => l.nature === 'portage');
		if (portage.length) {
			const parSite = new Map();
			for (const l of portage) {
				const e = parSite.get(siteDe(l)) ?? { ...l, n: 0, vues: new Set() };
				e.n++;
				e.vues.add(l.vue);
				parSite.set(siteDe(l), e);
			}
			console.log(
				`\n  LES ENTRÉES MORTES DU PRODUIT — ${parSite.size} site(s), ${portage.length} occurrence(s) :`
			);
			for (const s of [...parSite.values()].sort((a, b) => b.n - a.n)) {
				console.log(
					`    ${String(s.n).padStart(4)}×  ${s.conteneur} › « ${s.nomBrut ?? s.nom} »  [${s.genre}]\n` +
						`          déclare : ${s.vers}  →  ${s.destination}   rendu : href=${JSON.stringify(s.href)}\n` +
						`          vues : ${[...s.vues].sort().join(' ')}`
				);
			}
		}
	}

	/* ── P-04 ────────────────────────────────────────────────────────────── */
	/* ── Le détail entrée par entrée, sur demande ────────────────────────── */
	if (detail && cote === 'deux') {
		const parSite = new Map();
		for (const l of toutesLignes) {
			const k = `${l.nature}│${l.conteneur}│${l.nomBrut}│${l.genre}`;
			const e = parSite.get(k) ?? { ...l, n: 0, vues: new Set() };
			e.n++;
			e.vues.add(l.vue);
			parSite.set(k, e);
		}
		console.log(`\n─── LE DÉTAIL — ${parSite.size} site(s) d’entrée, toutes natures ───\n`);
		for (const x of [...parSite.values()].sort(
			(a, b) => a.nature.localeCompare(b.nature) || b.n - a.n
		))
			console.log(
				`  ${x.nature.padEnd(16)} ${String(x.n).padStart(5)}×  ${x.genre.padEnd(12)} ` +
					`${x.conteneur} › « ${x.nomBrut} »  [${[...x.vues].sort().join(' ')}]`
			);
	}

	/* ── Les routes qu'aucune entrée n'atteint ───────────────────────────── */
	console.log('\n─── Les routes qu’AUCUNE entrée de navigation ne nomme ───\n');
	console.log(
		`  ${routesOrphelines.length} route(s) sur ${routes.length}. Le contraire d'une entrée morte, et le\n` +
			'  même défaut vu de l’autre bout : une page que le produit sert et vers laquelle\n' +
			'  aucun menu ne mène est aussi inatteignable qu’un lien qui ne mène nulle part.\n' +
			'  CE DÉCOMPTE N’EST PAS OPPOSÉ, et il faut dire pourquoi : il est calculé sur les\n' +
			'  seules destinations DÉCLARÉES (`data-vers`), or les maquettes n’en portent que\n' +
			`  ${destinationsVues.size} distinctes. Il mesure donc ce que le GEL déclare, pas ce que le produit\n` +
			'  atteindra une fois routé. Il vaut comme repère de départ pour les lots de\n' +
			'  routage, et il devra retomber à mesure qu’ils câbleront.'
	);
	for (let i = 0; i < routesOrphelines.length; i += 2)
		console.log(
			'    ' +
				routesOrphelines
					.slice(i, i + 2)
					.map((r) => r.padEnd(60))
					.join('')
					.trimEnd()
		);
	if (destinationsVues.size)
		console.log(
			`\n  Les ${destinationsVues.size} route(s) qu’une entrée nomme :\n` +
				[...destinationsVues]
					.sort((a, b) => b[1] - a[1])
					.map(([r, n]) => `    ${String(n).padStart(5)}× ${r}`)
					.join('\n')
		);

	/* ── Les entrées grisées — la troisième clause de P-03 ────────────────── */
	const grisees = new Map();
	for (const l of toutesLignes.filter((x) => x.genre === 'inactivee')) {
		const k = `${l.vue}│${l.conteneur}│${l.nomBrut}`;
		const e = grisees.get(k) ?? { ...l, n: 0 };
		e.n++;
		grisees.set(k, e);
	}
	console.log('\n─── « Pas d’onglet grisé » — la troisième clause de P-03 ───\n');
	if (!grisees.size) {
		console.log(
			'  Aucune entrée rendue et désactivée. La clause est éprouvée par `--sonde=inactivee`.'
		);
	} else {
		console.log(
			`  ${grisees.size} site(s), ${[...grisees.values()].reduce((n, x) => n + x.n, 0)} occurrence(s) — toutes présentes des DEUX côtés :`
		);
		for (const g of [...grisees.values()].sort((a, b) => b.n - a.n))
			console.log(
				`    ${String(g.n).padStart(4)}×  ${g.vue}  ${g.conteneur} › « ${g.nomBrut} »  [${g.nature}]`
			);
		console.log(
			'    LECTURE, et elle est étroite : ce sont des COMMANDES conditionnées par une\n' +
				'    sélection — « Comparer » sans deux versions cochées, « Monter » sur le premier\n' +
				'    champ d’une liste —, non des entrées de menu. Le crible de conteneur les\n' +
				'    attrape parce qu’elles vivent dans un `aside` nommé. Elles sont NOMMÉES et\n' +
				'    NON OPPOSÉES : P-03 vise l’entrée de navigation grisée, et la frontière entre\n' +
				'    une commande indisponible et une porte fermée n’est tranchée par aucune source\n' +
				'    du dépôt. Un arbitrage la trancherait ; l’inventer ici serait un comblement.'
		);
	}

	console.log('\n─── P-04 — les modules de domaine sont-ils réellement effectifs ? ───\n');
	let defautsP04 = 0;
	for (const z of p04) {
		if (!z.presente) {
			console.log(
				`  ${z.vue} ${z.zone.padEnd(14)} ZONE ABSENTE DU DOM sur tous les états relevés.\n` +
					`      ${z.trace}\n` +
					'      P-04 n’est pas éprouvé ici : la déclaration est INERTE (CLAUDE.md §6 P-5).'
			);
			continue;
		}
		if (!z.rendue) {
			console.log(
				`  ${z.vue} ${z.zone.padEnd(14)} présente au DOM (${z.instances} instance(s)) mais JAMAIS RENDUE.\n` +
					`      ${z.trace}\n` +
					'      Cause connue et gelée : le panneau `tiroir-form` des consoles ne glisse\n' +
					'      jamais — la seule règle qui l’ouvre vise `.app[data-form="ouvert"]` alors\n' +
					'      que le panneau vit hors de `div.app` (CLAUDE.md §6 P-3). Aucune position\n' +
					'      de planche ne l’atteint, et le « réparer » rendrait six vues rouges.\n' +
					'      P-04 n’est donc PAS éprouvé sur cette zone.'
			);
			continue;
		}
		defautsP04 += z.defauts.length;
		console.log(
			`  ${z.vue} ${z.zone.padEnd(14)} ${z.etats} état(s) · ${z.instancesRendues}/${z.instances} instance(s) rendue(s)\n` +
				`      vocabulaire mesuré : ${z.vocabulaire.join(', ') || '(vide)'}\n` +
				`      trace : ${z.trace}`
		);
		console.log(
			`      M-4 effectivité : ${z.effectivite.distincts} ensemble(s) distinct(s) sur ${z.effectivite.etats} instance(s) rendue(s) — ` +
				(z.effectivite.effectif
					? 'l’activation pilote RÉELLEMENT le rendu'
					: 'AUCUNE VARIATION : rien ne prouve que l’activation soit effective')
		);
		for (const x of z.observes.filter((o) => o.gel.length || o.app.length))
			console.log(
				`        ${x.etat.padEnd(24)} gel ${x.gel.map((e) => '[' + e.join(', ') + ']').join(' ')}` +
					(cote === 'deux'
						? `  portage ${x.app.map((e) => '[' + e.join(', ') + ']').join(' ')}`
						: '')
			);
		for (const d of z.defauts)
			console.log(`      DÉFAUT ${d.obligation} [${d.cote}] ${d.etat} — ${d.detail}`);
	}

	const vocabulaireMesure = [...new Set(p04.flatMap((z) => z.vocabulaire))].sort();
	const horsRgStr06 = vocabulaireMesure.filter((m) => !MODULES_RG_STR_06.includes(m));
	const absentsDuGel = MODULES_RG_STR_06.filter((m) => !vocabulaireMesure.includes(m));
	console.log(
		`\n  RG-STR-06 nomme ${MODULES_RG_STR_06.length} modules : ${MODULES_RG_STR_06.join(', ')}.\n` +
			`  Le gel en rend ${vocabulaireMesure.length} : ${vocabulaireMesure.join(', ') || '(aucun)'}.` +
			(horsRgStr06.length
				? `\n  ÉCART — ${horsRgStr06.length} module(s) que RG-STR-06 ne nomme pas : ${horsRgStr06.join(', ')}.\n` +
					'    La maquette l’emporte (ordre de préséance), et l’écart est REMONTÉ, pas comblé.'
				: '') +
			(absentsDuGel.length
				? `\n  ${absentsDuGel.length} module(s) de RG-STR-06 qu’aucun état mesuré ne rend : ${absentsDuGel.join(', ')}.`
				: '')
	);

	/* ── Le contrôle de la clé — ECART-041 ───────────────────────────────── */
	if (cote === 'deux') {
		console.log(
			'\n─── Le contrôle de la clé de rapprochement, dans les DEUX sens (ECART-041) ───\n'
		);
		console.log(
			`  sur-rapprochement possible : ${controles.surRapproches.length} couple(s) — même clé, rang\n` +
				`    divergent de plus de ${ECART_DE_RANG}. Une clé qui sur-rapproche MASQUE un défaut réel.\n` +
				`  sous-rapprochement possible : ${controles.sousRapproches.length} couple(s) — même rang, noms compacts\n` +
				'    égaux, clés différentes. C’est la faute qui a fabriqué 31 faux défauts en T-060.'
		);
		for (const x of controles.surRapproches.slice(0, 10))
			console.log(
				`    sur   ${x.vue}/${x.etat} ${x.cle} — gel ${x.rangGel} ≠ portage ${x.rangApp}`
			);
		for (const x of controles.sousRapproches.slice(0, 10))
			console.log(`    sous  ${x.vue}/${x.etat} rang ${x.rang} — gel ${x.gel} ≠ app ${x.app}`);
	}

	/* ── Ce qui n'est pas couvert, mesuré ────────────────────────────────── */
	const externes = new Set();
	const sansDestination = new Set();
	const boutonsSansHref = new Set();
	for (const r of resultats)
		for (const e of r.gel?.entrees ?? []) {
			if (e.externe) externes.add(e.href);
			if (!e.vers && e.estLien)
				sansDestination.add(siteDe({ conteneur: e.conteneur, nom: e.nom, genre: 'lien' }));
			if (!e.estLien)
				boutonsSansHref.add(siteDe({ conteneur: e.conteneur, nom: e.nom, genre: e.balise }));
		}
	const couplesTotaux = vues.reduce(
		(n, v) => n + scenarioDe(v).etats.length * scenarioDe(v).fenetres.length,
		0
	);

	console.log('\n─── CE QUE CETTE BATTERIE NE COUVRE PAS — mesuré, jamais recopié (ARB-023) ───\n');
	console.log(
		`  · ${couplesTotaux - resultats.length} couple(s) sur ${couplesTotaux} : seule la fenêtre ${FENETRE_PRINCIPALE} est relevée.\n` +
			'    L’inertie d’une entrée n’est pas une propriété de largeur. Mais ARB-010 le\n' +
			'    rappelle : sous 1240 px le rail est `display:none` SANS contre-règle, donc\n' +
			'    ses entrées ne sont pas « visibles » et cette batterie ne les verrait pas.\n' +
			`  · ${sansDestination.size} site(s) de lien dont AUCUNE source ne déclare la destination.\n` +
			'    Ils sont inertes, et ils ne sont pas opposés : deviner où mène « Infrastructure »\n' +
			'    dans l’arbre du rail serait un comblement (CLAUDE.md §2). C’est la borne la\n' +
			'    plus lourde de cette batterie, et elle ne se lèvera que par un lot de routage.\n' +
			`  · ${boutonsSansHref.size} site(s) d’entrée SANS href — boutons, éléments de menu, onglets.\n` +
			'    Leur activation n’est pas observable sans les cliquer, et cliquer changerait\n' +
			'    l’état mesuré. Une entrée de menu qui n’ouvre rien passerait ici inaperçue.\n' +
			`  · ${externes.size} adresse(s) externe(s) — ${[...externes].join(' ') || 'aucune'} : aucune requête\n` +
			'    n’est émise vers le web, et le verdict d’un lien externe dépendrait d’un tiers.\n' +
			`  · ${contenuGel} lien(s) de contenu (registre B) : P-03 nomme les entrées de MENU. Un lien\n` +
			'    mort dans le corps d’une note est la même maladie, et il n’est PAS opposé ici.\n' +
			`  · ${versNonResolus.length} valeur(s) de \`data-vers\` qu’aucune règle de destination ne résout` +
			(versNonResolus.length
				? ` :\n    ${versNonResolus.map((v) => JSON.stringify(v)).join(' · ')}`
				: '.') +
			'\n  · le RENOMMAGE d’une entrée : le nom compact est dans la clé, donc une entrée\n' +
			'    renommée n’a plus de jumelle et retombe en « surplus portage », qui ne rougit\n' +
			'    pas. C’est délibéré et c’est le partage des rôles : les noms accessibles sont\n' +
			'    comparés SANS TOLÉRANCE par le niveau 1 du banc (`pnpm verif:maquette`), et un\n' +
			'    second juge du même fait ne ferait que deux verdicts à réconcilier.\n' +
			'  · la moitié « ni dans la NAVIGATION du domaine » de RG-STR-06 : AUCUNE maquette ne\n' +
			'    fait varier une navigation avec l’activation d’un module. Le rail de V-37 offre\n' +
			'    Cartographie, Carte mentale et Signets quel que soit le domaine courant — y\n' +
			'    compris « Migration 2026 », dont un seul module est activé. Pour l’éprouver il\n' +
			'    faudrait une maquette de rail dépendant du domaine, donc un REGEL arbitré ;\n' +
			'    l’inventer serait un comblement. Ce qui est éprouvé ici est le TABLEAU DE BORD.\n' +
			'  · les entrées que P-09 fait DISPARAÎTRE selon le droit : le socle les MASQUE\n' +
			'    (socle.css:396-397, `.si-ecriture`, `.si-admin`) au lieu de les retirer. Ce\n' +
			'    verdict appartient à la batterie 7 (`pnpm test:droits`), qui lit le DOM et non\n' +
			'    l’écran. Cette batterie ne relève que ce qui est RENDU.'
	);

	/* ── Rapport écrit et seuil proposé ──────────────────────────────────── */
	mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
	const duree = (Date.now() - t0) / 1000;
	/* UN RELEVÉ PARTIEL N'ÉCRASE PAS LE RELEVÉ COMPLET, ET NE PROPOSE AUCUN
	   SEUIL. Une sonde ou une sélection de vues mesure quelques états ; le
	   chiffre qu'elle rendrait, écrit sous le même nom, ferait passer pour le
	   seuil du dépôt le compte d'une seule page. Mesuré : la suite de sondes
	   laissait `inerte_au_gel: 19` là où le dépôt en porte 3 589. */
	const complet = !nomSonde && !demandees.length && !filtreEtats && cote === 'deux';
	writeFileSync(
		join(DOSSIER_RAPPORTS, complet ? 'menus.json' : 'menus-partiel.json'),
		JSON.stringify(
			{
				mesure_du: new Date().toISOString(),
				duree_s: Number(duree.toFixed(1)),
				cote,
				sonde: nomSonde,
				vues: vues.length,
				etats: resultats.length,
				routes,
				genres: GENRES,
				zones_de_modules: ZONES_DE_MODULES,
				compte,
				sites_distincts: Object.fromEntries(NATURES.map((n) => [n, dedup(n)])),
				lignes: toutesLignes,
				p04,
				controle_de_cle: controles,
				routes_orphelines: routesOrphelines,
				vers_non_resolus: versNonResolus,
				echecs: echecs.map((e) => ({ vue: e.vue, etat: e.etat, echec: e.echec }))
			},
			null,
			'\t'
		) + '\n'
	);
	if (complet)
		writeFileSync(
			join(DOSSIER_RAPPORTS, 'menus-seuil-propose.json'),
			JSON.stringify(
				{
					_: [
						'SEUIL DE DÉPART PROPOSÉ par `pnpm verif:menus` — NON ARBITRÉ.',
						'',
						'Ce fichier est une PROPOSITION écrite dans verif/rapports/, qui est volatile.',
						'Il ne devient opposable que si un humain le recopie en',
						'verif/references/menus-seuil.json — écriture humaine seule. Un agent qui se',
						'donnerait son propre seuil fabriquerait son verdict (PLAN §12, RA-01).',
						'',
						'`portage` ne devrait JAMAIS être admis : chaque unité est une entrée morte du',
						'produit, et ARB-013 a ouvert le chemin de sa correction.',
						'`inerte_au_gel` est la seule ligne qu’un arbitrage a lieu d’admettre : aucun',
						'lot ne peut la faire baisser sans recâbler des maquettes en lecture seule.'
					],
					mesure_du: new Date().toISOString(),
					etats: resultats.length,
					admis: {
						portage: 0,
						inerte_au_gel: compte['inerte-au-gel'],
						inerte_au_gel_sites: dedup('inerte-au-gel')
					}
				},
				null,
				'\t'
			) + '\n'
		);
	console.log(
		`\n  Rapport : verif/rapports/${complet ? 'menus.json' : 'menus-partiel.json'}` +
			(complet
				? '\n  Seuil proposé : verif/rapports/menus-seuil-propose.json'
				: '\n  Relevé PARTIEL — aucun seuil proposé, et le relevé complet n’est pas écrasé.')
	);

	/* ═══ CODE RETOUR ═══════════════════════════════════════════════════ */
	if (nomSonde) {
		const s = SONDES[nomSonde];
		const trouve =
			s.nature_attendue === 'p-04'
				? p04
						.flatMap((z) => z.defauts)
						.filter((d) => d.obligation === s.genre_attendu && d.cote === 'portage')
				: toutesLignes.filter(
						(l) =>
							l.genre === s.genre_attendu &&
							l.nature === s.nature_attendue &&
							s.site_attendu.test(l.nomBrut ?? '')
					);
		console.log(`\n─── SONDE « ${nomSonde} » ───\n`);
		if (trouve.length) {
			console.log(
				`  ✔ la batterie a nommé « ${s.genre_attendu} » en « ${s.nature_attendue} », ${trouve.length} fois.\n` +
					'    Elle sait dire non, et elle sait dire d’où ça vient.\n'
			);
			process.exit(0);
		}
		console.error(
			`  ✘ la batterie N'A PAS nommé « ${s.genre_attendu} » en « ${s.nature_attendue} ».\n` +
				'    Une batterie qui ne sait pas dire non ne prouve rien de ses verts (RA-01).\n'
		);
		process.exit(1);
	}

	if (echecs.length) {
		console.error(`\n  ${echecs.length} état(s) non relevé(s) — défaut d’instrument :`);
		for (const e of echecs.slice(0, 20)) console.error(`    ${e.vue} ${e.etat} — ${e.echec}`);
		console.error('  Rien ne peut être conclu de leur silence.\n');
		process.exit(2);
	}

	if (cote !== 'deux') {
		console.log(
			`\n  Régime --cote=${cote} : aucun verdict rendu, par construction. ` +
				`Code retour 0 ne vaut pas conformité.  ${duree.toFixed(0)} s.\n`
		);
		process.exit(0);
	}

	const seuil = existsSync(SEUIL) ? JSON.parse(readFileSync(SEUIL, 'utf8')) : null;
	const inerteGel = compte['inerte-au-gel'];
	const seuilRetenu = seuilGel ?? seuil?.admis?.inerte_au_gel ?? null;
	const gelHorsSeuil = seuilRetenu === null ? inerteGel > 0 : inerteGel > seuilRetenu;
	const rouges = compte.portage + defautsP04 + controles.sousRapproches.length;

	if (seuilRetenu === null && inerteGel > 0) {
		console.log(
			`\n  LE DÉPÔT NE PEUT PAS PASSER AU VERT, ET CE N'EST PAS QU'UN DÉFAUT DE PORTAGE.\n` +
				`    ${inerteGel} entrée(s) rendue(s) sont inertes des deux côtés sans qu'aucune source ne\n` +
				`    déclare leur destination — ${dedup('inerte-au-gel')} site(s) distinct(s). Les maquettes ne portent\n` +
				'    AUCUNE liaison (ARB-013) : aucun lot ne peut les recâbler sans inventer les\n' +
				'    adresses, ce que la règle de non-comblement interdit. Elles se lèveront par\n' +
				'    les lots de routage, qui donneront une destination à chaque entrée.\n' +
				`    SEUIL DE DÉPART PROPOSÉ : ${inerteGel}. Il n’est pas écrit dans cet instrument — un\n` +
				`    seuil que la mesure se donne à elle-même ne mesure rien. Une fois arbitré :\n` +
				`    \`pnpm verif:menus --seuil-gel=${inerteGel}\`.`
		);
	} else if (seuilRetenu !== null && inerteGel < seuilRetenu) {
		console.log(
			`\n  SEUIL PÉRIMÉ — arbitré à ${seuilRetenu}, mesuré à ${inerteGel}. À resserrer, sans quoi il\n` +
				'    absoudrait par avance une régression future. Dette d’arbitrage, pas un rouge.'
		);
	}

	const vert = rouges === 0 && !gelHorsSeuil;
	console.log(
		`\n  ${vert ? '✔ VERT' : '✘ ROUGE'} — ${compte.portage} entrée(s) morte(s) du PRODUIT` +
			` · ${defautsP04} défaut(s) P-04 · ${controles.sousRapproches.length} sous-rapprochement(s)` +
			` · ${inerteGel} inerte(s) au gel` +
			(seuilRetenu === null ? ' (aucun seuil arbitré)' : ` (seuil arbitré : ${seuilRetenu})`) +
			`.  ${duree.toFixed(0)} s.\n`
	);
	process.exit(vert ? 0 : 1);
}

if (process.argv[1] && /menus\.mjs$/.test(process.argv[1])) {
	await executer(process.argv.slice(2));
}
