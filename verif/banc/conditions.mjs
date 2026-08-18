/**
 * Banc de comparaison visuelle — les conditions de capture.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni
 * `verif/references/tolerances.json`. Élargir une condition pour obtenir du
 * vert est le contournement de vérification nommé par PLAN §12 (RA-01) : le
 * dispositif certifierait alors le défaut, ce qui est pire que l'absence de
 * dispositif. La sortie légitime est le protocole d'écart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER FIXE, ET POURQUOI
 *
 * PLAN-DE-REALISATION.md §4.2 : « Ce sont [les conditions de capture] qui font
 * la différence entre un critère d'acceptation et un générateur de faux
 * positifs. » Elles sont donc écrites ici une fois, et appliquées à
 * l'identique aux deux côtés de la comparaison — maquette gelée et
 * application — par le même code, jamais par deux réglages jumeaux.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ── Horloge ───────────────────────────────────────────────────────────────
   La date est `DATE_REFERENCE` de `seeds/corpus.ts` : 2026-08-13, dérivée de
   43 marqueurs concordants du corpus, et gelée.

   L'HEURE EST UN CHOIX DE HARNAIS, PAS UNE DONNÉE. `seeds/corpus.ts` le dit :
   « L'heure de référence n'est pas déductible […]. Les captures et tests qui
   ont besoin d'un instant doivent choisir explicitement leur convention. »
   Elle doit pourtant être fixée, parce qu'elle est VISIBLE au rendu : la
   coquille V-37 calcule sa salutation sur `new Date().getHours()`
   (`mockups/V-37-coquille.html:3523`) — « Bonjour » avant 12 h, « Bon
   après-midi » avant 18 h, « Bonsoir » ensuite. Une horloge non fixée ferait
   donc échouer la même vue selon le moment de la journée.

   VALEUR RETENUE : 2026-08-13 T 09:12:00 +02:00 (Europe/Paris).

   Trois raisons, dans cet ordre.
   1. C'est la BORNE INFÉRIEURE que le corpus porte, et rien de plus. Le seul
      marqueur horaire absolu du jeu de semence est « aujourd'hui à 09:12 »
      (dernière connexion du compte `c-lea`, `seeds/corpus.ts:1389` et :2034).
      Prendre la borne elle-même n'ajoute aucune information au corpus ;
      n'importe quelle autre heure en inventerait.
   2. Elle tombe au milieu d'une branche du seul rendu horo-dépendant du
      dépôt, et loin de ses deux frontières (12:00 et 18:00). Une dérive de
      quelques minutes — arrondi, fuseau — ne peut pas faire basculer un
      verdict.
   3. Le fuseau est Europe/Paris, celui déjà retenu par `playwright.config.ts`.

   Cette convention est déclarée, pas déduite : elle se révise par arbitrage,
   jamais par une session d'exécution. */
export const DATE_REFERENCE = '2026-08-13';
export const HEURE_REFERENCE = '09:12:00';
export const FUSEAU = 'Europe/Paris';
/** 2026-08-13 T 09:12:00 +02:00 — Paris est à UTC+2 le 13 août. */
export const INSTANT_REFERENCE = '2026-08-13T07:12:00.000Z';

/* ── Fenêtres ──────────────────────────────────────────────────────────────
   PLAN §4.2 : « 1440 × 900, 1024 × 768, 768 × 1024, 360 × 780 — les quatre
   pour les vues concernées par RG-M18-13, la première seule sinon. » */
export const FENETRES = {
	'1440x900': { largeur: 1440, hauteur: 900 },
	'1024x768': { largeur: 1024, hauteur: 768 },
	'768x1024': { largeur: 768, hauteur: 1024 },
	'360x780': { largeur: 360, hauteur: 780 }
};

export const FENETRE_PRINCIPALE = '1440x900';

/* RG-M18-13 : « Les cas d'usage prioritaires sur mobile sont chercher et
   lire. » La règle nomme deux CAS D'USAGE ; aucune source du dépôt n'en donne
   la liste de vues. Elle est donc DÉRIVÉE de la table maîtresse de
   `docs/routes.md` §3, qui nomme la fonction de chaque vue :

     chercher — V-02 « Recherche publique », V-08 « Recherche »,
                V-09 « Palette de recherche rapide »
     lire     — V-03 « Lecture publique », V-14 « Lecture d'une note »

   V-09 est la seule maquette du dépôt à porter explicitement un état
   « Petit écran — 360 px » (`mockups/V-09-palette.html:740`) : c'est
   l'attestation la plus directe de la règle.

   Cette dérivation a été remontée comme écart (ECART-010 É-1) et ARBITRÉE
   le 18 août 2026 (ARB-009) : deux vues sont AJOUTÉES aux cinq dérivées.

     V-37 « Coquille applicative » — portée par 35 vues sur 41, elle porte le
           rail escamotable, mécanisme central de RG-M18-12, et elle est le
           siège des deux défauts E-01/E-02 relevés au PLAN §11, qui portaient
           précisément sur le comportement en petite largeur. Ne pas la
           contrôler aux quatre fenêtres laisserait sans preuve la seule règle
           dont le cadrage documente qu'elle avait été enfreinte.
     V-01 « Accueil public » — porte un champ de recherche, donc le cas d'usage
           « chercher » au sens de la règle.

   Toute modification de cette liste relève de l'arbitrage humain : elle décide
   quelles vues sont vérifiées sur quatre fenêtres au lieu d'une. Un agent
   bloqué sur un rouge en petite largeur ne retire jamais une vue d'ici. */
export const VUES_RG_M18_13 = ['V-01', 'V-02', 'V-03', 'V-08', 'V-09', 'V-14', 'V-37'];

export function fenetresDe(vue) {
	return VUES_RG_M18_13.includes(vue) ? Object.keys(FENETRES) : [FENETRE_PRINCIPALE];
}

/* ── Densité de pixels ─────────────────────────────────────────────────────
   Fixée à 1. Une densité 2 doublerait la surface mesurée sans rien ajouter au
   verdict, et exposerait le banc aux arrondis sous-pixel du compositeur. */
export const DENSITE = 1;

/* ── Stabilisation : du temps VIRTUEL, pas de l'attente ───────────────────
   L'horloge étant arrêtée, on ne PATIENTE plus, on AVANCE. La différence est
   celle qui sépare un banc déterministe d'un banc à peu près stable : une
   attente réelle mesure ce que la machine a eu le temps de faire, une avance
   de temps virtuel déclenche exactement les minuteries dues, dans le même
   ordre, à chaque exécution et des deux côtés.

   Les deux avances couvrent les rendus différés des maquettes — `setTimeout`
   de 140 ms à 900 ms au chargement, empilement de notifications échelonné sur
   780 ms après un changement de position. Elles ne servent JAMAIS de
   rattrapage : une capture instable après ces avances est un défaut de banc à
   déclarer, pas une avance à rallonger.

   `PEINTURE_MS` est la seule attente réelle qui subsiste. Le compositeur de
   Chromium, lui, n'est pas virtualisable : il faut lui laisser peindre ce que
   le temps virtuel vient de produire. */
export const AVANCE_CHARGEMENT_MS = 1000;
export const AVANCE_ETAT_MS = 1000;
export const PEINTURE_MS = 80;

/* ── Le pointeur au repos ──────────────────────────────────────────────────
   Playwright ouvre chaque page avec son curseur en (0, 0), et l'y laisse tant
   qu'aucun geste ne le déplace : c'est donc la position du pointeur dans la
   quasi-totalité des captures du banc, et le survol qu'elles portent.

   Les seules captures où il en va autrement sont celles des onze états à
   déclencheur : le clic laisse le curseur sur la cible, et la boîte s'ouvre
   ensuite au centre de la fenêtre, si bien que le curseur s'y retrouve — par
   accident de géométrie — sur son bouton principal. Le banc mesure alors un
   `:hover` qui n'appartient pas à l'état mais au moyen de livraison du clic
   (`ECART-014` É-3, même famille que le défilement).

   Le pointeur est donc REMIS AU REPOS après un geste, des deux côtés, par le
   même code. Cette constante est en écriture humaine seule, comme le reste de
   ce fichier : la déplacer changerait le survol de toutes les captures. */
export const POINTEUR_AU_REPOS = [0, 0];

/* ── Inhibition du mouvement, des barres et du curseur ─────────────────────
   Chaque règle neutralise une source de faux positif identifiée à
   l'étalonnage à blanc. Aucune ne touche la mise en page ni les couleurs :
   une règle qui changerait le rendu ferait mentir la mesure. */
export const CSS_INHIBITION = `
/* Animation — PLAN §4.2. Durées et délais à zéro, des deux côtés. */
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}
/* Curseur de saisie — il clignote, donc il diverge d'une capture à l'autre. */
* { caret-color: transparent !important; }
/* Barres de défilement — masquées, largeur neutralisée. */
html { scrollbar-width: none !important; scrollbar-gutter: auto !important; }
*::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
`;

/* ── Déterminisme du hasard ────────────────────────────────────────────────
   `mockups/V-32-console-comptes.html:2975-2981` fabrique un mot de passe
   temporaire par `Math.random()`, et l'affiche (état « Réinitialisation »).
   Deux captures successives de la même maquette y divergeraient. Le générateur
   est donc remplacé, des deux côtés, par une suite déterministe.

   Ce n'est pas un masque : le masque cache une zone, ce remplacement rend la
   zone reproductible. Les deux sont posés — le remplacement pour l'à-blanc,
   le masque de `verif/masques.json` pour la comparaison application ↔
   maquette, où les deux générateurs ne peuvent pas coïncider. */
export const SCRIPT_DETERMINISME = `(() => {
  let graine = 0x2026_08_13 >>> 0;
  Math.random = () => {
    graine = (graine * 1664525 + 1013904223) >>> 0;
    return graine / 4294967296;
  };
})();`;

/**
 * Applique à un contexte les conditions qui se règlent à sa création.
 * @returns les options de `browser.newContext()`.
 */
export function optionsContexte(nomFenetre) {
	const { largeur, hauteur } = FENETRES[nomFenetre];
	return {
		viewport: { width: largeur, height: hauteur },
		deviceScaleFactor: DENSITE,
		locale: 'fr-FR',
		timezoneId: FUSEAU,
		reducedMotion: 'reduce',
		colorScheme: 'light',
		forcedColors: 'none',
		hasTouch: false,
		isMobile: false
	};
}

/**
 * Applique à une page les conditions qui se règlent avant navigation.
 *
 * L'HORLOGE EST ARRÊTÉE, PAS SEULEMENT DATÉE. `setFixedTime` figerait `Date`
 * en laissant courir `setTimeout` : les maquettes empilent, escamotent et
 * retirent des éléments sur minuterie — une notification de succès disparaît
 * au bout de 3 200 ms (`mockups/V-38-notifications.html:2248`) — si bien que
 * deux captures du même état prises à quelques centaines de millisecondes
 * d'intervalle ne montrent pas le même écran. C'est le premier faux positif
 * qu'a révélé l'étalonnage à blanc.
 *
 * `install()` + `pauseAt()` remplace toute la base de temps du document —
 * `Date`, `performance`, `setTimeout`, `setInterval`,
 * `requestAnimationFrame` — par une horloge qui n'avance que sur ordre. Le
 * banc décide alors, à la milliseconde près et identiquement des deux côtés,
 * de combien le temps a passé. Aucune des 41 maquettes n'emploie
 * `requestAnimationFrame` : la virtualiser est sans effet de bord.
 */
export async function preparerAvantNavigation(page) {
	await page.clock.install({ time: new Date(INSTANT_REFERENCE) });
	await page.clock.pauseAt(new Date(INSTANT_REFERENCE));
	await page.addInitScript(SCRIPT_DETERMINISME);
}

/** Avance l'horloge virtuelle, puis laisse le compositeur peindre. */
export async function avancer(page, ms) {
	await page.clock.runFor(ms);
	await page.waitForTimeout(PEINTURE_MS);
}

/**
 * Applique à une page les conditions qui se règlent après navigation, et rend
 * la main quand le rendu est réputé stable.
 *
 * L'ordre compte : les polices d'abord — `polices.css` déclare
 * `font-display: swap`, donc une capture prise avant `document.fonts.ready`
 * mesure la fonderie de repli et non celle du produit.
 */
export async function stabiliser(page) {
	await page.addStyleTag({ content: CSS_INHIBITION });
	await chargerPolices(page);
	await page.evaluate(() => {
		// Le focus initial du navigateur peut poser un anneau sur le premier
		// élément focalisable ; il n'appartient pas au rendu de l'état.
		if (document.activeElement && document.activeElement !== document.body) {
			document.activeElement.blur();
		}
		window.scrollTo(0, 0);
	});
	await avancer(page, AVANCE_CHARGEMENT_MS);
}

/* ── Les polices : chargées de force, puis vérifiées ───────────────────────
   Deux pièges, tous deux découverts à l'étalonnage à blanc.

   1. CHARGEMENT PARESSEUX. `document.fonts.ready` n'attend que les fontes que
      la page utilise DÉJÀ. Neuf maquettes sur quarante et une n'emploient pas
      Literata à l'ouverture (V-05, V-06, V-08, V-13, V-16, V-19, V-21, V-23,
      V-25) ; la famille n'y est donc pas chargée. Qu'un changement de position
      de planche fasse apparaître un bloc qui l'emploie, et la fonte se charge
      APRÈS coup : `font-display: swap` peint alors la fonderie de repli, puis
      la vraie. Deux captures du même état, prises à quelques centaines de
      millisecondes d'écart, ne montrent pas la même typographie.

   2. HORLOGE ARRÊTÉE. Le gel de la base de temps déplace, en plus, le moment
      où le moteur de fontes considère son travail terminé.

   La parade ne consiste pas à attendre plus longtemps — une attente ne prouve
   rien —, mais à CHARGER les onze fontes déclarées par `polices.css` avant
   toute capture, des deux côtés, puis à vérifier qu'elles sont là. Charger une
   fonte ne l'applique pas : le rendu est inchangé, seule la course l'est.

   Le garde-fou ferme au passage l'angle mort de l'à-blanc : les deux côtés
   empruntant le même chemin, une police qui ne chargerait JAMAIS passerait
   inaperçue — les deux captures montreraient la même fonderie de repli, et le
   banc les déclarerait identiques. Il aurait mesuré Arial contre Arial en
   croyant mesurer Archivo. */
export const FACES = [
	['Archivo', 'normal', 400],
	['Archivo', 'normal', 500],
	['Archivo', 'normal', 600],
	['Archivo', 'normal', 700],
	['Literata', 'normal', 400],
	['Literata', 'italic', 400],
	['Literata', 'normal', 500],
	['Literata', 'normal', 600],
	['JetBrains Mono', 'normal', 400],
	['JetBrains Mono', 'normal', 500],
	['JetBrains Mono', 'normal', 700]
];

async function chargerPolices(page) {
	const manquantes = await page.evaluate(async (faces) => {
		const specification = ([famille, style, graisse]) => `${style} ${graisse} 16px "${famille}"`;
		// Un échec réseau sur une fonte ne doit pas se propager comme une erreur
		// opaque : on l'absorbe ici pour que le contrôle qui suit le nomme.
		await Promise.all(faces.map((f) => document.fonts.load(specification(f)).catch(() => null)));
		await document.fonts.ready;
		return faces.filter((f) => !document.fonts.check(specification(f))).map((f) => f.join(' '));
	}, FACES);
	if (manquantes.length) {
		throw new Error(
			`banc : police(s) non chargée(s) — ${manquantes.join(', ')}. ` +
				'La comparaison mesurerait une fonderie de repli, pas la vue. ' +
				'PLAN §4.2 : « Polices servies localement. »'
		);
	}
}

/* ── Les blocs que la maquette déclare hors produit ────────────────────────
   PLAN §4.2 : « Retirée du DOM avant capture. » Retirée, pas masquée : un bloc
   en `display: none` continue de participer au calcul de mise en page de ses
   ancêtres dans certains contextes, et surtout il resterait dans l'arbre
   d'accessibilité que compare le niveau 1.

   LE CRITÈRE N'EST PAS « CE QUI GÊNE », C'EST « CE QUE LA MAQUETTE DIT ». Un
   bloc n'entre dans cette liste que si la maquette gelée déclare elle-même
   qu'il n'appartient pas au produit. Le retirer n'est alors pas dévier de la
   maquette : c'est obéir à ce qu'elle écrit. Retirer un bloc qu'elle ne
   déclare pas serait l'inverse — le contournement de vérification de PLAN §12.

   RECENSEMENT SUR LES 41 MAQUETTES GELÉES, à ce lot :

     `.planche`        — la planche de revue. 37 maquettes sur 41 en portent
                         une ; toutes la marquent « hors produit », dans le
                         commentaire qui l'ouvre, dans le commentaire de son
                         style et dans son `aria-label` (« Contrôles de
                         maquette, hors produit »). Les quatre sans planche :
                         V-09, V-35, V-40, V-41.
     `section.regles`  — les notes de conception de V-37, six pavés dont la
                         maquette dit d'elle-même : « Ce bloc n'appartient pas
                         au produit. Il récapitule les comportements que ce
                         fragment garantit aux trente et une vues de l'espace
                         de travail. » (V-37:1638, commentaire de balisage
                         V-37:1635 et commentaire de style V-37:1108).
                         AUCUNE AUTRE MAQUETTE n'en porte : le relevé sur les
                         41 fichiers ne trouve la mention nulle part ailleurs,
                         et aucun autre bloc ne se déclare hors produit.

   PIÈGE ÉCARTÉ, ET C'EST POURQUOI LE SÉLECTEUR EST `section.regles` ET NON
   `.regles` : V-06 et V-25 portent une `ul.regles` — la liste « Ce qui est
   demandé » des règles de mot de passe (V-06:713, V-25:1159). Celle-là EST du
   produit. Un sélecteur de classe seule aurait retiré du DOM une exigence
   fonctionnelle en croyant retirer une note de maquette.

   Cette liste est en ÉCRITURE HUMAINE SEULE, au même titre que les tolérances,
   les masques et les zones comparées. */
export const BLOCS_HORS_PRODUIT = ['.planche', 'section.regles'];

export async function retirerBlocsHorsProduit(page) {
	return page.evaluate((selecteurs) => {
		let retires = 0;
		for (const s of selecteurs) {
			document.querySelectorAll(s).forEach((n) => {
				n.remove();
				retires++;
			});
		}
		return retires;
	}, BLOCS_HORS_PRODUIT);
}

/* ── Zones comparées ───────────────────────────────────────────────────────
   ARB-012, ÉCART-011 É-5. Une vue peut déclarer les zones de son rendu qui
   font l'objet du verdict ; une vue sans déclaration est comparée PAGE
   ENTIÈRE, par défaut. La liste vit dans `verif/references/zones.json`, en
   écriture humaine seule, avec l'arbitrage qui l'autorise et le motif qui la
   justifie — et le rapport la nomme à chaque exécution.

   Le banc restreint les DEUX niveaux aux mêmes zones. Restreindre le niveau 2
   sans le niveau 1 ferait juger deux objets différents par les deux moitiés du
   même verdict. */
export const ZONES = JSON.parse(
	readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '..', 'references', 'zones.json'),
		'utf8'
	)
);

/**
 * Les zones comparées d'une vue, ou `[]` quand elle est comparée page entière.
 * @returns {string[]}
 */
export function zonesDe(vue) {
	return ZONES.vues?.[vue]?.zones ?? [];
}

/** L'arbitrage et le motif qui autorisent la restriction — pour le rapport. */
export function declarationZones(vue) {
	return ZONES.vues?.[vue] ?? null;
}
