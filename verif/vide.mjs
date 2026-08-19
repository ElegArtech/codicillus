#!/usr/bin/env node
/**
 * Batterie 8 — « sur une base vierge, aucune valeur illustrative ». `pnpm test:vide`.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni la table
 * d'exclusions qu'il porte. Élargir une exclusion pour qu'un nombre cesse de
 * compter est le contournement de vérification nommé par PLAN §12. La sortie
 * légitime d'un rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE PROUVE
 *
 * `P-02`, deuxième des dix principes non négociables : « Aucune valeur
 * illustrative. Aucun indicateur, aucune tendance, aucun compteur ne peut être
 * figé ou simulé. Une donnée indisponible s'affiche comme telle » (`RG-M01-01`).
 *
 * Le catalogue de `CLAUDE.md` §4 en donne la formulation opérationnelle : « sur
 * une base vierge, aucun indicateur n'affiche de valeur ; tous affichent un
 * état neutre explicite ».
 *
 * DEUX FAUTES, ET ELLES NE SONT PAS DE MÊME NATURE :
 *
 *   VALEUR FIGÉE  un nombre écrit en dur dans la vue, qui ne bougera jamais
 *                 quel que soit le corpus. C'est la faute de P-02.
 *   ZÉRO MUET     un compteur qui rend `0` là où la donnée est INDISPONIBLE,
 *                 sans état neutre explicite. C'est la faute de RG-M01-01, et
 *                 c'est la plus traître : « 0 » et « indisponible » sont deux
 *                 informations différentes, et une base vierge les rend
 *                 indistinguables quand la vue n'a pas d'état neutre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA MÉTHODE — DEUX CORPUS, ET LE VERDICT SE LIT DANS LA COMPARAISON
 *
 * La même vue est rendue sous DEUX CORPUS, des DEUX CÔTÉS, par le même code et
 * dans les mêmes conditions de capture (`verif/banc/conditions.mjs`) :
 *
 *   NATIF  la variante que la maquette de la vue porte réellement. `E-04` de
 *          `docs/errata-cadrage.md` : cinq variantes STRICTEMENT EMBOÎTÉES —
 *          32 notes (24 vues), 27 (2), 19 (12), 14 (V-09), vide (V-05, V-06).
 *          Servir le jeu de 32 à une vue qui en porte 19 ferait diverger la
 *          comparaison pour une raison étrangère à P-02 ; le côté peuplé est
 *          donc la variante native, celle que `corpusPourVue()` sélectionne et
 *          que `window.CORPUS` porte au gel.
 *   VIDE   la cinquième variante d'E-04, `IDS_PAR_VARIANTE.vide = []`. Elle
 *          EXISTE dans `seeds/corpus.ts` ; elle n'est pas fabriquée ici.
 *
 * « Une valeur identique sous deux corpus différents est figée. » Encore
 * faut-il savoir à QUI l'imputer, et c'est le recoupement à deux côtés qui le
 * dit — jurisprudence du banc, reprise de la batterie 10 :
 *
 *   · le gel VARIE, le portage NON        → PORTAGE. Le seul qui rougit.
 *   · aucun des deux ne varie             → GEL. La maquette elle-même fige ce
 *     nombre : soit c'est un réglage, soit c'est une valeur figée du gel.
 *     `mockups/` est en lecture seule et la règle de non-comblement interdit de
 *     l'inventer autrement : CONSTAT chiffré, jamais un rouge.
 *   · le gel fige, le portage varie       → GEL NON REPORTÉ. Divergence, pas
 *     défaut : signalée, mise au crédit de personne.
 *   · la clé manque d'un côté             → INSTRUMENT. Non opposable, et
 *     nommée plutôt que passée en pertes.
 *
 * C'EST AUSSI CE QUI DISTINGUE V-33 ET V-34 SANS LISTE DE NOMS. La console de
 * configuration porte des RÉGLAGES (rétention de versions, seuils de fraîcheur)
 * et la console analytique des planches de démonstration : ces nombres ne
 * varient pas avec le corpus DANS LE GEL, donc la batterie ne les rend jamais
 * opposables. La séparation est faite par la maquette elle-même, pas par une
 * liste de vues écrite ici — une liste qu'aucun cas n'éprouverait serait une
 * liste d'espoirs (`CLAUDE.md` §6 P-5).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA SONDE DE CORPUS — LE MÊME GESTE DES DEUX CÔTÉS, ET RIEN D'AUTRE
 *
 * Aucun chemin du dépôt ne sert la variante vide à une vue qui porte un
 * indicateur : `servirApp()` appelle `corpusPourVue(vue)`, et la variante d'une
 * vue est FIXE (`VARIANTE_PAR_VUE`). Le mode démo n'a pas de paramètre de
 * corpus. C'est un écart, déclaré au rapport de lot — et la parade retenue ne
 * touche ni la vue, ni la maquette, ni le mode démo :
 *
 *   CÔTÉ GEL      un script d'initialisation Playwright intercepte l'affectation
 *                 `window.CORPUS = [...]` des maquettes et lui substitue `[]`.
 *                 Le document servi reste le fichier gelé, octet pour octet.
 *   CÔTÉ PORTAGE  un greffon Vite ajoute, EN FIN de `seeds/corpus.ts`, les trois
 *                 lignes qui vident le corpus à sa source : la variante de
 *                 chaque vue passe à `'vide'`, `CORPUS` est vidé et son index
 *                 avec. Le composant, le mode démo et le gabarit de document
 *                 sont ceux de tous les jours.
 *
 * Les deux gestes sont SYMÉTRIQUES et minimaux : ils vident le corpus, et rien
 * d'autre. Les tables qui ne sont pas le corpus — `DOMAINES`, `UNIVERS`,
 * `MESURES_7J`, `MOI`, `INSTANCE` — restent en place des deux côtés, comme
 * `window.DOMAINES` reste en place au gel. Toute asymétrie de portée ferait
 * mesurer la sonde et non la vue.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CLÉ DE RAPPROCHEMENT, ET POURQUOI ELLE NE PORTE AUCUN TEXTE
 *
 * `ECART-041`, 19 août 2026 : la clé de la batterie 10 embarquait
 * `textContent.slice(0,48)`, le compilateur Svelte élague les nœuds de texte
 * blancs d'un côté et pas de l'autre (**P-8**), et 31 « défauts de portage » sur
 * 31 étaient faux. La leçon est écrite en toutes lettres : *un instrument qui
 * compare deux populations produit deux fautes symétriques — sur-rapprocher et
 * masquer un défaut réel, sous-rapprocher et en fabriquer un faux.*
 *
 * Cette batterie compare QUATRE populations (deux côtés × deux corpus). Sa clé
 * est donc réduite à ce qui ne peut varier ni avec le corpus, ni avec le
 * compilateur :
 *
 *     clé = vue › zone › signature de classes de l'élément porteur › rang
 *
 * Aucun texte, aucune valeur. La VALEUR est comparée, elle n'entre jamais dans
 * la clé. Le RANG a été ajouté APRÈS une mutation de preuve qui est passée
 * inaperçue sans lui — quatre `.ind__val` dans une même zone formaient une clé
 * unique, et le multiensemble variait encore par ses autres membres : le
 * sur-rapprochement d'ECART-041, mesuré sur pièce. Les deux sens sont éprouvés :
 *
 *   · positif — deux relevés de textes différents et de classes identiques dans
 *     la même zone DOIVENT se rapprocher (`verif/vide.test.ts`), et la mesure
 *     imprime à chaque exécution le taux de jonction des quatre populations ;
 *   · négatif — deux zones distinctes, ou deux signatures de classes distinctes,
 *     NE DOIVENT PAS se rapprocher (`verif/vide.test.ts`), et la mesure imprime
 *     le nombre de clés ORPHELINES, celles qu'une population porte et qu'une
 *     autre n'a pas.
 *
 * Une clé qu'une seule des quatre populations manque n'est pas opposable : elle
 * est comptée « instrument », nommée, et retirée du verdict.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE NE PRÉTEND PAS
 *
 * Elle mesure des NOMBRES RENDUS, pas des intentions. Aucune source du dépôt
 * n'énumère les indicateurs des 41 vues : les nommer par leurs classes serait
 * une liste d'espoirs. Ce qui est déclaré ici, et qui est une DÉCISION :
 *
 *   D-1  un « indicateur » est une valeur NUMÉRIQUE RENDUE dans le produit,
 *        blocs hors produit retirés (`BLOCS_HORS_PRODUIT`) ;
 *   D-2  cinq familles de jetons portent des chiffres sans être des valeurs de
 *        corpus — date, heure, version, référence du dépôt (« V-14 », « P-02 »),
 *        horodatage compact. Elles sont exclues, et chacune est ÉPROUVÉE contre
 *        le relevé : une exclusion qu'aucun texte du gel ne satisfait est
 *        REFUSÉE, code 2 (P-5) ;
 *   D-3  un « état neutre explicite » est un composant de la famille « vide »
 *        de l'inventaire fermé. La table n'est pas récrite ici : ce sont les
 *        `MARQUEURS` de `verif/etats.mjs` d'état `vide`, que la batterie 9
 *        éprouve déjà contre les 41 maquettes. Deux tables jumelles auraient
 *        divergé au premier ajout ;
 *   D-4  le côté peuplé est la variante NATIVE de la vue (E-04), pas le jeu de
 *        32 servi uniformément.
 *
 * COMMANDES
 *   node verif/vide.mjs                     les 41 vues, verdict chiffré
 *   node verif/vide.mjs V-07 V-11           une sélection
 *   node verif/vide.mjs --cles              le détail clé par clé
 *   node verif/vide.mjs --json              le relevé exploitable
 *   node verif/vide.mjs --seuil-gel=N       le manque de gel ARBITRÉ à N
 *   node verif/vide.mjs --sonde=figee       prouve que la batterie sait dire non
 *   node verif/vide.mjs --sonde=zero        idem, sur l'autre faute
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — instrument JavaScript, hors périmètre de tsc
import { MARQUEURS, SELECTEUR_REGION } from './etats.mjs';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS = join(racine, 'verif', 'scenarios');

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES JETONS NUMÉRIQUES — ce qui compte comme valeur, et ce qui n'en est
   pas une.

   Un relevé qui prendrait tout ce qui porte un chiffre compterait les dates de
   révision, l'heure de la dernière synchronisation, le numéro de version du
   produit et les identifiants horodatés des exports. Aucun n'est un indicateur
   de corpus, et les compter gonflerait le relevé d'un bruit qui masquerait le
   signal.

   Chaque exclusion est ÉPROUVÉE contre le relevé du gel à chaque exécution :
   une exclusion que rien ne satisfait est une exclusion dont on ignore si elle
   marche, et elle rend le même verdict qu'une exclusion qui marche (P-5). Code
   2, avant toute mesure.
   ═════════════════════════════════════════════════════════════════════════ */

export const EXCLUSIONS = [
	{
		famille: 'date',
		re: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g,
		motif:
			'une DATE — « 13/08/2026 », « 2026-08-13 ». Elle situe dans le temps, elle ' +
			'ne compte rien. Les dates du corpus disparaissent avec lui ; les autres sont ' +
			'des repères.'
	},
	{
		famille: 'heure',
		re: /\b\d{1,2}:\d{2}(?::\d{2})?\b/g,
		motif:
			'une HEURE — « aujourd’hui à 09:12 ». Même motif que la date, et le jeu de ' +
			'semence déclare son heure de référence indéterminable (seeds/corpus.ts).'
	},
	{
		famille: 'version',
		re: /\b\d+\.\d+\.\d+\b/g,
		motif:
			'un NUMÉRO DE VERSION — « Codicillus 1.0.0 », porté par la coquille des 35 ' +
			'vues qui l’enveloppent. C’est un fait d’instance, pas une mesure de corpus.'
	},
	{
		famille: 'reference',
		re: /\b[A-Z][A-Za-z]*(?:-[A-Z0-9]+)*-\d+(?:-\d+)?\b/g,
		motif:
			'une RÉFÉRENCE du dépôt — « V-14 », « P-02 », « ARB-012 », « RG-M18-03 », ' +
			'« ECART-041 ». La bibliothèque de composants V-41 en est pavée. C’est un ' +
			'identifiant, jamais une mesure : le compter ferait de chaque renvoi une ' +
			'valeur figée.'
	},
	{
		famille: 'horodatage',
		re: /\b\d{8}T\d{4,6}\b/g,
		motif:
			'un HORODATAGE COMPACT — l’identifiant d’un export ou d’une sauvegarde, ' +
			'« 20260810T0912 ». Un identifiant n’est pas un compteur.'
	}
];

/* Le jeton lui-même : un nombre, éventuellement signé, éventuellement suivi
   d'un pour-cent, avec les séparateurs de milliers que `toLocaleString('fr-FR')`
   produit — espace insécable étroite U+202F, insécable U+00A0, fine U+2009.
   L'espace ORDINAIRE en est exclu : « 4 résultats » ne doit pas se lire « 4 r ».
   Le SIGNE est retenu : une tendance « −2 % » et une tendance « +2 % » sont deux
   valeurs, et les confondre masquerait une variation. */
const RE_JETON = /[+\-\u2212]?\d[\d\u00a0\u202f\u2009]*(?:[.,]\d+)?\s*%?/g;

/**
 * Les jetons numériques d'un texte, exclusions appliquées.
 *
 * PURE, donc unitaire. Le texte transite depuis la page pour être découpé ICI —
 * il n'entre JAMAIS dans la clé de rapprochement (ECART-041, P-8).
 *
 * @param {string} texte
 * @returns {{ jetons: string[], exclus: Record<string, number> }}
 */
export function jetonsDe(texte) {
	const exclus = {};
	let reste = texte;
	for (const e of EXCLUSIONS) {
		const re = new RegExp(e.re.source, 'g');
		let n = 0;
		reste = reste.replace(re, (m) => {
			n++;
			// Remplacé par des blancs de MÊME LONGUEUR : le découpage suivant ne
			// doit pas recoller deux nombres que l'exclusion séparait.
			return ' '.repeat(m.length);
		});
		if (n) exclus[e.famille] = n;
	}
	const jetons = [];
	for (const m of reste.matchAll(RE_JETON)) jetons.push(normaliserJeton(m[0]));
	return { jetons, exclus };
}

/**
 * Forme canonique d'un jeton : séparateurs de milliers retirés, virgule
 * décimale ramenée au point, pour-cent collé, signe conservé et unifié.
 * @param {string} brut
 */
export function normaliserJeton(brut) {
	return brut
		.replace(/[\u00a0\u202f\u2009]/g, '')
		.replace(/\s+/g, '')
		.replace(/−/g, '-')
		.replace(',', '.')
		.replace(/^\+/, '+');
}

/** Un jeton qui vaut zéro — « 0 », « 0 % », « 0.0 ». Le cœur du zéro muet. */
export function estZero(jeton) {
	return /^[+-]?0(?:\.0+)?%?$/.test(jeton);
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. LA CLÉ DE RAPPROCHEMENT — ce qu'elle porte, et surtout ce qu'elle ne
   porte pas. Voir l'en-tête : ECART-041.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * La signature d'un porteur : ses classes propres, triées. Sans classe, sa
 * balise. C'est la moitié de la clé qui ne bouge ni avec le corpus, ni avec le
 * compilateur.
 * @param {{ classes: string[], balise: string }} porteur
 */
export function signatureDe({ classes, balise }) {
	return classes.length ? [...classes].sort().join('.') : `<${balise}>`;
}

/**
 * `vue › zone › signature de classes › rang`. Ni texte, ni valeur.
 *
 * LE RANG EST LÀ PARCE QU'IL A MANQUÉ, ET C'EST MESURÉ. Sans lui, les quatre
 * `.ind__val` de `#indics` (V-07) formaient UNE clé et un multiensemble de
 * quatre valeurs. Une mutation de preuve — `nb(toutesLesNotes.length)` remplacé
 * par `nb(32)` dans `src/vues/V-07.svelte` — est passée INAPERÇUE : le
 * multiensemble variait encore, par ses trois autres membres. C'est exactement
 * le SUR-RAPPROCHEMENT d'`ECART-041`, du côté qui masque un défaut réel.
 *
 * LE RANG COMPTE TOUS LES ÉLÉMENTS DE MÊME SIGNATURE DANS LA ZONE, porteurs de
 * chiffres ou non : un indicateur qui passe de « 12 » à « — » cesserait sinon
 * d'être compté et décalerait tous ses voisins.
 *
 * ET LA CLÉ SOUS-RAPPROCHE PLUTÔT QUE DE SUR-RAPPROCHER, DÉLIBÉRÉMENT. Les deux
 * fautes d'`ECART-041` ne coûtent pas la même chose : sous-rapprocher rend une
 * clé ORPHELINE, donc « instrument », donc non opposable — et le rapport le dit
 * en chiffres. Sur-rapprocher masque un défaut réel et ne le dit jamais. Entre
 * les deux, une batterie qui garde P-02 choisit celle qui parle.
 *
 * @param {{ vue: string, zone: string, classes: string[], balise: string, rang?: number }} porteur
 */
export function cleDe({ vue, zone, classes, balise, rang = 0 }) {
	return `${vue} › ${zone} › ${signatureDe({ classes, balise })} #${rang}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. L'ÉTAT NEUTRE EXPLICITE — la table n'est pas récrite, elle est empruntée.

   `MARQUEURS` de `verif/etats.mjs`, familles d'état `vide` : `.zone-etat*`,
   `.vide*`, `.zone-vide*`, `.vide-*`, `.*__vide`, `.palette__etat*`, `.si-vide`.
   Chacune est tracée à `docs/DESIGN.md` §2 et déjà éprouvée contre les 41
   maquettes par la batterie 9 — une seconde table jumelle aurait divergé au
   premier ajout.
   ═════════════════════════════════════════════════════════════════════════ */

export const MARQUEURS_VIDE = MARQUEURS.filter((m) => m.etat === 'vide');

/** Les familles d'état neutre que rend cette zone. */
export function neutresDe(classesVisibles) {
	return [
		...new Set(
			classesVisibles
				.map((c) => MARQUEURS_VIDE.find((m) => m.re.test(c))?.famille ?? null)
				.filter(Boolean)
		)
	].sort();
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. LA SONDE — exécutée DANS la page. Ne dépend d'aucun module.

   ZONE, définition mécanique et IDENTIQUE à celle de la batterie 9 : le
   sélecteur de région lui est IMPORTÉ, jamais recopié. Une région qui porte une
   identité stable — `id`, sinon `aria-label`, sinon la balise `main`, qui est
   unique — est suivable d'un corpus à l'autre et d'un côté à l'autre. C'est la
   condition même du rapprochement.

   PORTEUR : tout élément qui rend et dont les NŒUDS DE TEXTE DIRECTS portent au
   moins un chiffre. Les nœuds directs, et non `textContent` : sans cela, chaque
   ancêtre reprendrait à son compte les nombres de ses descendants et le même
   nombre serait compté autant de fois qu'il a d'ancêtres.
   ═════════════════════════════════════════════════════════════════════════ */

const SONDE = ({ selecteurRegion, zonesComparees }) => {
	const rend = (n) => {
		const s = getComputedStyle(n);
		if (s.display === 'none' || s.visibility === 'hidden') return false;
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	const classesDe = (n) => {
		const c = n.getAttribute('class');
		return c ? c.trim().split(/\s+/).filter(Boolean) : [];
	};
	const nomDe = (n) => {
		const l = n.getAttribute('aria-label');
		if (l) return l.trim();
		const id = n.getAttribute('aria-labelledby');
		if (id) return (document.getElementById(id)?.textContent ?? '').trim().slice(0, 60);
		return '';
	};

	const regions = [...document.querySelectorAll(selecteurRegion)].filter(
		(n) => n.id || n.getAttribute('aria-label') || n.tagName === 'MAIN'
	);
	const cleDeRegion = (n) =>
		n.id
			? '#' + n.id
			: n.getAttribute('aria-label')
				? n.tagName.toLowerCase() + '[' + nomDe(n) + ']'
				: 'main';
	const index = new Map(regions.map((n) => [n, cleDeRegion(n)]));
	/* ARB-012 — une vue peut déclarer les zones qui font l'objet du verdict.
	   Le banc y restreint le sien ; cette batterie ne peut pas juger plus large
	   que lui sans se substituer à une décision arbitrée. */
	const dans = (n, sels) => sels.some((sel) => n.matches(sel) || n.closest(sel));

	const zones = new Map();
	for (const n of regions) {
		zones.set(index.get(n), {
			cle: index.get(n),
			rend: rend(n),
			dansVerdict: zonesComparees.length === 0 || dans(n, zonesComparees),
			classesVisibles: [],
			porteurs: []
		});
	}
	const horsZone = {
		cle: '(hors zone nommée)',
		rend: true,
		dansVerdict: zonesComparees.length === 0,
		classesVisibles: [],
		porteurs: []
	};

	const zoneDe = (n) => {
		let p = n;
		while (p) {
			if (index.has(p)) return zones.get(index.get(p));
			p = p.parentElement;
		}
		return horsZone;
	};

	/* LE RANG, calculé sur TOUS les éléments de même signature d'une zone — pas
	   seulement sur ceux qui portent un chiffre. Un indicateur qui passe de « 12 »
	   à « — » sortirait sinon du décompte et décalerait tous ses voisins, ce qui
	   ferait diverger la clé pour une raison qui n'est pas celle qu'on mesure.
	   La règle de signature est la même qu'à `signatureDe()` — classes triées,
	   sinon la balise. */
	const rangs = new Map();
	for (const n of document.querySelectorAll('*')) {
		if (!rend(n)) continue;
		const seau = zoneDe(n);
		const classes = classesDe(n);
		const balise = n.tagName.toLowerCase();
		for (const c of classes) seau.classesVisibles.push(c);
		const signature =
			seau.cle + ' › ' + (classes.length ? [...classes].sort().join('.') : '<' + balise + '>');
		const rang = rangs.get(signature) ?? 0;
		rangs.set(signature, rang + 1);
		let direct = '';
		for (const enfant of n.childNodes) {
			if (enfant.nodeType === 3) direct += enfant.nodeValue;
		}
		if (!/\d/.test(direct)) continue;
		seau.porteurs.push({
			balise,
			classes,
			rang,
			// Le texte transite pour être DÉCOUPÉ côté Node ; il n'entre jamais
			// dans la clé (ECART-041).
			texte: direct.replace(/\s+/g, ' ').trim()
		});
	}

	const compacter = (z) => ({ ...z, classesVisibles: [...new Set(z.classesVisibles)] });
	return {
		zones: [...zones.values()].map(compacter),
		horsZone: compacter(horsZone)
	};
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. AGRÉGATION ET VERDICT — pures, donc unitaires (verif/vide.test.ts).
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Un relevé brut de page → une table `clé → { jetons (multiensemble trié) }`,
 * plus l'état neutre de chaque zone.
 *
 * @param {string} vue
 * @param {{ zones: any[], horsZone: any }} brut
 */
export function agreger(vue, brut) {
	const cles = new Map();
	const zones = new Map();
	const exclus = {};
	if (!brut) return { cles, zones, exclus };
	for (const z of [...brut.zones, brut.horsZone]) {
		const neutres = neutresDe(z.classesVisibles);
		const dansVerdict = z.dansVerdict !== false;
		const jetonsDeLaZone = [];
		for (const p of z.porteurs) {
			const { jetons, exclus: ex } = jetonsDe(p.texte);
			for (const [f, n] of Object.entries(ex)) exclus[f] = (exclus[f] ?? 0) + n;
			if (!jetons.length) continue;
			const cle = cleDe({
				vue,
				zone: z.cle,
				classes: p.classes,
				balise: p.balise,
				rang: p.rang ?? 0
			});
			const entree = cles.get(cle) ?? { cle, zone: z.cle, dansVerdict, jetons: [] };
			entree.jetons.push(...jetons);
			cles.set(cle, entree);
			jetonsDeLaZone.push(...jetons);
		}
		zones.set(z.cle, { cle: z.cle, dansVerdict, neutres, jetons: jetonsDeLaZone.sort() });
	}
	for (const e of cles.values()) e.jetons.sort();
	return { cles, zones, exclus };
}

/** Deux multiensembles de jetons sont-ils identiques ? */
export function memeValeur(a, b) {
	return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * LE VERDICT D'UNE CLÉ. Quatre populations entrent, une nature sort.
 *
 * @param {string[]|null} gelNatif
 * @param {string[]|null} gelVide
 * @param {string[]|null} appNatif
 * @param {string[]|null} appVide
 */
export function verdictDeCle(gelNatif, gelVide, appNatif, appVide) {
	if (!gelNatif || !gelVide || !appNatif || !appVide) return 'instrument';
	const gelVarie = !memeValeur(gelNatif, gelVide);
	const appVarie = !memeValeur(appNatif, appVide);
	if (gelVarie && appVarie) return 'conforme';
	if (gelVarie && !appVarie) return 'portage';
	if (!gelVarie && appVarie) return 'gel-non-reporte';
	return 'gel';
}

/**
 * LE ZÉRO MUET, zone par zone. Une zone qui, sous corpus VIDE, rend un jeton
 * nul SANS rendre aucun composant de la famille « vide » ne distingue pas
 * « zéro » d'« indisponible ».
 *
 * Le verdict se lit dans la comparaison, comme pour la valeur figée : présent
 * des deux côtés → gel ; côté portage seul → PORTAGE ; côté gel seul → gel non
 * reporté ; zone absente d'un côté → instrument.
 *
 * @param {{neutres: string[], jetons: string[]}|null} gelVide
 * @param {{neutres: string[], jetons: string[]}|null} appVide
 */
export function verdictZeroMuet(gelVide, appVide) {
	if (!gelVide || !appVide) return 'instrument';
	const muet = (z) => z.jetons.some(estZero) && z.neutres.length === 0;
	const g = muet(gelVide);
	const a = muet(appVide);
	if (g && a) return 'gel';
	if (!g && a) return 'portage';
	if (g && !a) return 'gel-non-reporte';
	return 'conforme';
}

/**
 * LE CONTRÔLE DE LA CLÉ, DANS LES DEUX SENS — mesuré, à chaque exécution.
 *
 * `ECART-041` : une jointure produit deux fautes symétriques, et les compter
 * ensemble reviendrait à n'en compter aucune. Ce relevé les sépare, et il sépare
 * en outre les deux CAUSES d'une clé manquante — ce que le rapprochement de la
 * batterie 10 ne faisait pas :
 *
 *   fusionnees        SUR-RAPPROCHEMENT possible : une clé dont le multiensemble
 *                     porte plus d'un jeton. Plusieurs porteurs de mêmes classes
 *                     dans la même zone y sont comparés ensemble, et un défaut
 *                     isolé peut s'y cacher derrière la variation d'un voisin.
 *   orphelinesCorpus  la clé manque d'un CÔTÉ ET DE L'AUTRE sous le même corpus :
 *                     c'est le corpus qui a retiré l'élément, et les deux côtés
 *                     en conviennent. Attendu, bénin, non opposable.
 *   orphelinesCote    la clé est portée par UN CÔTÉ ET PAS PAR L'AUTRE à corpus
 *                     égal. C'EST LE SEUL CHIFFRE QUI ACCUSE LA CLÉ : soit elle
 *                     sous-rapproche — la faute exacte d'ECART-041 —, soit le gel
 *                     et le portage divergent réellement de structure. La batterie
 *                     ne tranche pas et NOMME.
 *
 * @param {Record<string, Map<string, any>>} pop
 */
export function eprouverLaCle(pop) {
	const noms = Object.keys(pop);
	const toutes = [...new Set(noms.flatMap((n) => [...pop[n].keys()]))].sort();
	const communes = toutes.filter((c) => noms.every((n) => pop[n].has(c)));
	const orphelinesCote = [];
	const orphelinesCorpus = [];
	for (const c of toutes) {
		if (noms.every((n) => pop[n].has(c))) continue;
		const accord = ['natif', 'vide'].every(
			(corpus) => pop[`gel/${corpus}`].has(c) === pop[`app/${corpus}`].has(c)
		);
		(accord ? orphelinesCorpus : orphelinesCote).push(c);
	}
	const fusionnees = communes.filter((c) => noms.some((n) => pop[n].get(c).jetons.length > 1));
	return {
		total: toutes.length,
		communes: communes.length,
		orphelinesCote,
		orphelinesCorpus,
		fusionnees
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LES DEUX SONDES DE CORPUS — le même geste des deux côtés.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * CÔTÉ GEL. Les 41 maquettes affectent leur corpus par `window.CORPUS = [...]`
 * dans leur premier bloc de script. Ce script d'initialisation, posé AVANT tout
 * script de la page, remplace la propriété par un accesseur qui accepte
 * l'affectation et rend le jeu vide. Le fichier gelé est servi tel quel : rien
 * n'est écrit dans `mockups/`, et `pnpm verif:gel` reste indifférent.
 */
export const SCRIPT_GEL_VIDE = `(() => {
  let jeu = [];
  Object.defineProperty(window, 'CORPUS', {
    configurable: true,
    get() { return jeu; },
    set() { jeu = []; }
  });
})();`;

/**
 * CÔTÉ PORTAGE. Le greffon Vite qui vide le corpus à SA SOURCE, en fin de
 * module. Trois lignes, et elles se lisent comme la sonde du gel :
 *
 *   · `VARIANTE_PAR_VUE` → `'vide'` partout : `corpusPourVue()` sert alors la
 *     cinquième variante d'E-04, celle qui EXISTE déjà. C'est le geste demandé.
 *   · `CORPUS.length = 0` et l'index vidé : deux vues — V-33 et V-36 — importent
 *     `CORPUS` directement plutôt que de recevoir leurs notes en propriété.
 *     Sans ces deux lignes, la sonde du portage aurait une portée PLUS ÉTROITE
 *     que celle du gel, où `window.CORPUS` est la seule source, et l'asymétrie
 *     se lirait en faux défauts de portage.
 *
 * `enforce: 'post'` : le module est alors du JavaScript, les types effacés.
 */
export function greffonCorpusVide() {
	return {
		name: 'codicillus:batterie8-corpus-vide',
		enforce: /** @type {'post'} */ ('post'),
		/** @param {string} code @param {string} id */
		transform(code, id) {
			if (!/\/seeds\/corpus\.ts(\?|$)/.test(id)) return null;
			return {
				code:
					code +
					'\n;/* batterie 8 — variante « vide » d’E-04, appliquée à la source */\n' +
					'for (const __v in VARIANTE_PAR_VUE) VARIANTE_PAR_VUE[__v] = "vide";\n' +
					'CORPUS.length = 0;\nINDEX_DES_NOTES.clear();\n',
				map: null
			};
		}
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. LES SONDES DE PREUVE — « prouver que la batterie sait dire non ».

   Un instrument toujours vert ne prouve rien : c'est le mode de défaillance
   RA-01 du plan (§12). Chaque sonde introduit une perturbation connue du SEUL
   côté portage et EXIGE que la batterie la voie. Le code retour est INVERSÉ :
   0 quand elle a rougi nommément, 1 quand elle est restée verte.

   Elles perturbent la PAGE, jamais un fichier : aucune vue n'est modifiée,
   `git status` reste propre par construction, et la restauration est l'exécution
   suivante — dont l'identité au relevé de départ est ce que les trois exécutions
   du rapport établissent.

     figee  tout nombre rendu est remplacé par une constante, sous LES DEUX
            corpus. Toute clé que le gel fait varier devient invariante côté
            portage : c'est exactement la valeur figée.
     zero   sous le SEUL corpus vide, tout nombre rendu est ramené à « 0 » et
            tout composant d'état neutre est retiré. La clé varie encore — ce
            n'est donc pas une valeur figée —, mais la zone rend « 0 » sans
            distinguer l'indisponible : c'est exactement le zéro muet.
   ═════════════════════════════════════════════════════════════════════════ */

export const SONDES = ['figee', 'zero'];

const PERTURBATION = ({ genre, familles }) => {
	const remplacer = (valeur) => {
		for (const n of document.querySelectorAll('*')) {
			for (const enfant of n.childNodes) {
				if (enfant.nodeType === 3 && /\d/.test(enfant.nodeValue)) {
					enfant.nodeValue = enfant.nodeValue.replace(/\d[\d\s.,]*/g, valeur);
				}
			}
		}
	};
	if (genre === 'figee') remplacer('4242');
	if (genre === 'zero') {
		remplacer('0');
		for (const source of familles) {
			const re = new RegExp(source);
			for (const n of [...document.querySelectorAll('[class]')]) {
				const classes = (n.getAttribute('class') ?? '').trim().split(/\s+/);
				if (classes.some((c) => re.test(c))) n.remove();
			}
		}
	}
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. EXÉCUTION
   ═════════════════════════════════════════════════════════════════════════ */

export function vuesDuDepot() {
	return readdirSync(SCENARIOS)
		.filter((f) => /^V-\d\d\.json$/.test(f))
		.map((f) => f.slice(0, 4))
		.sort();
}

export function scenarioDe(vue) {
	return JSON.parse(readFileSync(join(SCENARIOS, `${vue}.json`), 'utf8'));
}

/** L'état MESURÉ d'une vue : celui que sa planche donne par défaut. */
export function etatDeDefaut(scenario) {
	return scenario.etats.find((/** @type {{defaut: boolean}} */ e) => e.defaut) ?? scenario.etats[0];
}

/**
 * Un relevé, d'un côté, sous un corpus.
 *
 * Le chemin est celui du banc — `optionsContexte`, `preparerAvantNavigation`,
 * `stabiliser`, `retirerBlocsHorsProduit` —, à UNE LIGNE PRÈS : le script
 * d'initialisation de la sonde de corpus, qui doit être posé avant la
 * navigation. `ouvrirPage()` ne rend la main qu'après ; cette fonction est donc
 * son décalque, et elle est employée IDENTIQUEMENT pour les quatre populations,
 * corpus natif compris, pour qu'aucune ne soit mesurée par un autre code.
 */
async function relever(navigateur, ctx, vue, scenario, population) {
	const { conditions } = ctx;
	const etat = etatDeDefaut(scenario);
	const adresse =
		population.cote === 'gel'
			? `${ctx.origineGel}/${scenario.maquette.replace(/^mockups\//, '')}`
			: `${population.origine}${ctx.adresseDeLEtat(vue, etat.cle, 'app')}`;

	const contexte = await navigateur.newContext(
		conditions.optionsContexte(conditions.FENETRE_PRINCIPALE)
	);
	if (population.corpus === 'vide' && population.cote === 'gel') {
		await contexte.addInitScript(SCRIPT_GEL_VIDE);
	}
	const page = await contexte.newPage();
	/* LES ERREURS DE SCRIPT SONT RELEVÉES, ET ELLES DÉCIDENT.
	   Vider le corpus d'une maquette peut faire TOMBER son script — plusieurs
	   construisent leur écran à partir d'une note précise, et le rapport dit
	   lesquelles, avec le message que la page a jeté. Aucun nombre n'est écrit
	   ici : il serait faux au premier changement de source. Une
	   page dont le script a jeté n'est pas une page « qui n'affiche rien » : c'est
	   une page qu'on n'a pas mesurée. Sans ce relevé, l'absence d'un nombre s'y
	   lirait comme un état neutre, et la batterie certifierait le contraire de
	   ce qu'elle a vu. */
	const erreursPage = [];
	page.on('pageerror', (e) => erreursPage.push(String(e?.message ?? e).slice(0, 160)));
	let erreur = null;
	let brut = null;
	let statut = null;
	try {
		await conditions.preparerAvantNavigation(page);
		const reponse = await page.goto(adresse, { waitUntil: 'load' });
		statut = reponse?.status() ?? null;
		await conditions.stabiliser(page);
		if (population.cote === 'gel') {
			if (etat.vecteur) await ctx.capture.reglerPlanche(page, etat.vecteur);
			else if (scenario.defaut && scenario.planche)
				await ctx.capture.reglerPlanche(page, scenario.defaut);
		} else if (etat.vecteur || (scenario.defaut && scenario.planche)) {
			// Le budget d'horloge est dépensé des deux côtés, dans le même ordre.
			await conditions.avancer(page, conditions.AVANCE_ETAT_MS);
		}
		await conditions.retirerBlocsHorsProduit(page);
		if (ctx.sonde && population.cote === 'portage') {
			const applicable = ctx.sonde === 'figee' || population.corpus === 'vide';
			if (applicable) {
				await page.evaluate(PERTURBATION, {
					genre: ctx.sonde,
					familles: MARQUEURS_VIDE.map((m) => m.re.source)
				});
			}
		}
		brut = await page.evaluate(SONDE, {
			selecteurRegion: SELECTEUR_REGION,
			zonesComparees: conditions.zonesDe(vue)
		});
	} catch (e) {
		erreur = String(e?.message ?? e).slice(0, 220);
	} finally {
		await contexte.close();
	}
	return {
		vue,
		population: population.nom,
		statut,
		erreur,
		erreursPage: [...new Set(erreursPage)],
		brut
	};
}

/** Un pool de tâches à parallélisme borné, avec reprise — P-14. */
async function enParallele(taches, largeur, faire) {
	const out = new Array(taches.length);
	let i = 0;
	await Promise.all(
		Array.from({ length: Math.min(largeur, taches.length) }, async () => {
			for (;;) {
				const k = i++;
				if (k >= taches.length) return;
				/* P-14 — `conditions.preparerAvantNavigation` pose l'horloge en deux
				   appels, et le temps virtuel court entre les deux. À plusieurs pages
				   de front, `pauseAt` peut viser un instant déjà passé et Playwright
				   rejette. Le défaut est dans le banc, pas ici : on rejoue plutôt que
				   d'y toucher, comme la batterie 10. */
				let r = null;
				for (let essai = 0; essai < 3; essai++) {
					r = await faire(taches[k], k);
					if (!r.erreur) break;
				}
				out[k] = r;
			}
		})
	);
	return out;
}

async function executer(args) {
	const t0 = Date.now();
	const demandees = args.filter((a) => /^V-\d\d$/.test(a));
	const vues = demandees.length ? demandees : vuesDuDepot();
	const enJson = args.includes('--json');
	const detail = args.includes('--cles');
	const sonde = args.find((a) => a.startsWith('--sonde='))?.slice(8) ?? null;
	if (sonde && !SONDES.includes(sonde)) {
		console.error(`batterie 8 — --sonde=${sonde} inconnue (${SONDES.join(' | ')}).`);
		process.exit(2);
	}
	const seuilBrut = args.find((a) => a.startsWith('--seuil-gel='))?.slice(12) ?? null;
	const seuilGel = seuilBrut === null ? null : Number(seuilBrut);
	if (seuilGel !== null && !Number.isInteger(seuilGel)) {
		console.error('batterie 8 — `--seuil-gel=` attend un entier.');
		process.exit(2);
	}

	const { chromium } = await import('@playwright/test');
	const capture = await import('./banc/capture.mjs');
	const conditions = await import('./banc/conditions.mjs');
	const { servir } = await import('./banc/serveur.mjs');
	const { adresseDeLEtat, PREFIXE } = await import('./banc/mode-demo.mjs');
	const { createServer } = await import('vite');

	const serveurGel = await servir(join(racine, 'mockups'));
	/** Deux serveurs de développement : l'un sert le corpus natif de chaque vue,
	 *  l'autre le même produit avec le corpus vidé à sa source. Le greffon ne
	 *  peut pas se régler par requête — il transforme un module au chargement —,
	 *  et deux serveurs sont le seul moyen honnête d'avoir les deux. */
	const demarrer = async (greffons, niveau) => {
		const vite = await createServer({
			configFile: join(racine, 'vite.config.ts'),
			root: racine,
			plugins: greffons,
			server: { port: 0, strictPort: false },
			logLevel: niveau
		});
		await vite.listen();
		const origine = vite.resolvedUrls?.local?.[0]?.replace(/\/$/, '');
		if (!origine) {
			console.error('batterie 8 — le serveur de développement n’a pas rendu d’adresse.');
			process.exit(2);
		}
		return { origine, vite, fermer: () => vite.close() };
	};
	const appNatif = await demarrer([], 'warn');
	/* SILENCIEUX, ET C'EST DÉLIBÉRÉ. Vider le corpus fait légitimement échouer le
	   rendu de quelques vues — celles qui LISENT une note précise. Vite en
	   déverserait la pile à chaque requête et noierait le rapport. Le fait n'est
	   pas perdu pour autant : il est relevé par le code de réponse et par les
	   erreurs de page, et il ressort au chapitre « vues non mesurables ». */
	const appVide = await demarrer([greffonCorpusVide()], 'silent');

	for (const s of [appNatif, appVide]) {
		const essai = await fetch(`${s.origine}${PREFIXE}/`).catch(() => null);
		if (!essai || !essai.ok) {
			console.error(
				`\nbatterie 8 — le mode démo ne répond pas sur ${s.origine}${PREFIXE}/.\n` +
					'  Sans lui, le côté PORTAGE n’a aucun chemin (ÉCART-011 É-1), et la batterie\n' +
					'  ne mesurerait que le gel en croyant mesurer les deux.\n'
			);
			process.exit(2);
		}
	}

	/* LA SONDE DU PORTAGE DOIT MORDRE, ET C'EST MESURÉ AVANT TOUTE PAGE.
	   Si le greffon ne vidait rien, les deux serveurs serviraient le même corpus
	   et toute la batterie deviendrait une tautologie verte (RA-01). Le contrôle
	   interroge les DEUX serveurs par le chemin qu'emprunte le mode démo lui-même
	   — `ssrLoadModule('/seeds/corpus.ts')` —, et non par une lecture de fichier
	   qui ne dirait rien de ce que la vue reçoit. */
	const controleGreffon = await (async () => {
		const mesurer = async (s) => {
			const m = await s.vite.ssrLoadModule('/seeds/corpus.ts');
			return {
				notes: vues.reduce((n, v) => n + m.corpusPourVue(v).length, 0),
				corpus: m.CORPUS.length
			};
		};
		return { natif: await mesurer(appNatif), vide: await mesurer(appVide) };
	})();
	if (controleGreffon.natif.notes === 0 || controleGreffon.vide.notes > 0) {
		console.error(
			'\nbatterie 8 — la sonde de corpus du portage ne mord pas.\n' +
				`  natif : ${controleGreffon.natif.notes} note(s) servie(s) sur la sélection, ` +
				`CORPUS = ${controleGreffon.natif.corpus}\n` +
				`  vide  : ${controleGreffon.vide.notes} note(s) servie(s), ` +
				`CORPUS = ${controleGreffon.vide.corpus}\n` +
				'  Les deux serveurs serviraient le même corpus, et la comparaison « deux corpus »\n' +
				'  serait une tautologie verte (RA-01). Refus, avant mesure.\n'
		);
		process.exit(2);
	}

	const POPULATIONS = [
		{ nom: 'gel/natif', cote: 'gel', corpus: 'natif', origine: null },
		{ nom: 'gel/vide', cote: 'gel', corpus: 'vide', origine: null },
		{ nom: 'app/natif', cote: 'portage', corpus: 'natif', origine: appNatif.origine },
		{ nom: 'app/vide', cote: 'portage', corpus: 'vide', origine: appVide.origine }
	];

	const ctx = {
		capture,
		conditions,
		adresseDeLEtat,
		sonde,
		origineGel: serveurGel.origine
	};

	const taches = [];
	for (const vue of vues) {
		const s = scenarioDe(vue);
		for (const p of POPULATIONS) taches.push({ vue, scenario: s, population: p });
	}

	const navigateur = await chromium.launch();
	let releves;
	try {
		releves = await enParallele(taches, 4, (t) =>
			relever(navigateur, ctx, t.vue, t.scenario, t.population)
		);
	} finally {
		await navigateur.close();
		await serveurGel.fermer();
		await appNatif.fermer();
		await appVide.fermer();
	}

	/* ── Agrégation ────────────────────────────────────────────────────────── */
	const exclusTotal = {};
	const parVue = [];
	/* LA LIGNE DE BASE — corpus NATIF — doit rendre, sinon il n'y a rien à
	   comparer. Une vue qui ne rend pas déjà sous son corpus natif rendrait la
	   batterie muette sur elle ET la ferait passer pour « sans défaut » : c'est le
	   vert par disparition du sujet, mode de défaillance RA-01. Refus en code 2. */
	const baseRompue = [];
	const releveDe = (vue, p) => releves.find((x) => x.vue === vue && x.population === p) ?? null;

	for (const vue of vues) {
		const r = Object.fromEntries(
			POPULATIONS.map((p) => [p.nom, agreger(vue, releveDe(vue, p.nom)?.brut ?? null)])
		);
		for (const p of POPULATIONS)
			for (const [f, n] of Object.entries(r[p.nom].exclus))
				exclusTotal[f] = (exclusTotal[f] ?? 0) + n;

		/* UNE VUE QUI NE REND PAS SOUS CORPUS VIDE N'EST PAS UNE VUE VIDE.
		   C'est une vue qu'on N'A PAS MESURÉE, et la différence décide de tout :
		   l'absence d'un nombre s'y lirait comme un état neutre, et la batterie
		   certifierait le contraire de ce qu'elle a vu. Trois causes, toutes
		   relevées et jamais devinées : un code de réponse hors 200, une
		   exception du relevé, ou un script de page qui a jeté sous corpus vide
		   là où il tenait sous corpus natif. */
		const motifs = [];
		const motifsDeBase = [];
		for (const p of POPULATIONS) {
			const x = releveDe(vue, p.nom);
			const ou = p.corpus === 'natif' ? motifsDeBase : motifs;
			if (!x) ou.push(`${p.nom} : aucun relevé`);
			else if (x.erreur) ou.push(`${p.nom} : ${x.erreur}`);
			else if (x.statut !== 200) ou.push(`${p.nom} : statut ${x.statut}`);
		}
		for (const cote of ['gel', 'app']) {
			const natif = releveDe(vue, `${cote}/natif`)?.erreursPage ?? [];
			const vide = releveDe(vue, `${cote}/vide`)?.erreursPage ?? [];
			/* UN SCRIPT QUI JETTE SOUS CORPUS NATIF EST UN FAIT DU GEL, PAS UNE PANNE
			   DE MESURE. `mockups/V-08` appelle `trier()`, qu'aucune ligne ne définit :
			   la page rend, incomplètement, depuis le gel du 18 août. Refuser en
			   code 2 rendrait l'instrument inutilisable pour un défaut qu'il n'a pas
			   causé ; la vue est déclarée NON MESURABLE et la cause est nommée. Seule
			   une panne de TRANSPORT — pas de relevé, statut hors 200 — refuse. */
			if (natif.length) motifs.push(`${cote}/natif : le script a jeté — ${natif[0]}`);
			const nouvelles = vide.filter((e) => !natif.includes(e));
			if (nouvelles.length)
				motifs.push(`${cote}/vide : le script de la page a jeté — ${nouvelles[0]}`);
		}
		const nonMesurable = motifs.length || motifsDeBase.length ? [...motifsDeBase, ...motifs] : null;
		if (motifsDeBase.length) baseRompue.push({ vue, motifs: motifsDeBase });

		const controle = nonMesurable
			? { total: 0, communes: 0, orphelinesCote: [], orphelinesCorpus: [], fusionnees: [] }
			: eprouverLaCle(
					Object.fromEntries(
						POPULATIONS.map((p) => [
							p.nom,
							new Map([...r[p.nom].cles].filter(([, e]) => e.dansVerdict))
						])
					)
				);

		const toutes = new Set(POPULATIONS.flatMap((p) => [...r[p.nom].cles.keys()]));
		const cles = [];
		for (const cle of [...toutes].sort()) {
			const j = (p) => r[p].cles.get(cle)?.jetons ?? null;
			/* ARB-012 — une zone que sa vue ne fait pas juger ne reçoit pas de
			   verdict. Le banc y restreint le sien ; cette batterie ne peut pas
			   juger plus large sans se substituer à une décision arbitrée. */
			const dansVerdict = POPULATIONS.some((p) => r[p.nom].cles.get(cle)?.dansVerdict);
			cles.push({
				cle,
				nature: nonMesurable
					? 'non-mesurable'
					: !dansVerdict
						? 'hors-verdict'
						: verdictDeCle(j('gel/natif'), j('gel/vide'), j('app/natif'), j('app/vide')),
				valeurs: Object.fromEntries(POPULATIONS.map((p) => [p.nom, j(p.nom)]))
			});
		}

		const zonesToutes = new Set(POPULATIONS.flatMap((p) => [...r[p.nom].zones.keys()]));
		const zones = [];
		for (const z of [...zonesToutes].sort()) {
			const gv = r['gel/vide'].zones.get(z) ?? null;
			const av = r['app/vide'].zones.get(z) ?? null;
			const dansVerdict = (gv ?? av)?.dansVerdict !== false;
			const nature = nonMesurable
				? 'non-mesurable'
				: !dansVerdict
					? 'hors-verdict'
					: verdictZeroMuet(gv, av);
			if (nature === 'conforme') continue;
			zones.push({
				zone: z,
				nature,
				gel: gv ? { neutres: gv.neutres, zeros: gv.jetons.filter(estZero) } : null,
				portage: av ? { neutres: av.neutres, zeros: av.jetons.filter(estZero) } : null
			});
		}

		parVue.push({ vue, nonMesurable, cles, zones, controle });
	}

	const nonMesurables = parVue.filter((v) => v.nonMesurable);
	const echecs = releves.filter((r) => r.erreur || r.statut !== 200);

	if (baseRompue.length) {
		console.error(
			`\nbatterie 8 — ${baseRompue.length} vue(s) ne rendent pas sous leur corpus NATIF :\n` +
				baseRompue.map((b) => `    ${b.vue}  ${b.motifs.join(' · ')}`).join('\n') +
				'\n  La ligne de base est la moitié de la comparaison. Sans elle, ces vues\n' +
				'  sortiraient « sans défaut » faute de sujet — le vert par disparition du sujet\n' +
				'  (RA-01). Refus, avant tout verdict.\n'
		);
		process.exit(2);
	}

	/* ── La table des exclusions, ÉPROUVÉE — P-5 ───────────────────────────── */
	const inertes = EXCLUSIONS.filter((e) => !exclusTotal[e.famille]).map((e) => e.famille);
	if (inertes.length && !demandees.length) {
		console.error(
			`\nbatterie 8 — ${inertes.length} exclusion(s) qu’AUCUN texte du relevé ne satisfait :\n` +
				`    ${inertes.join('\n    ')}\n` +
				'  Une exclusion inerte rend le même verdict qu’une exclusion qui marche : elle\n' +
				'  est espérée, pas posée (CLAUDE.md §6 P-5). Refus.\n'
		);
		process.exit(2);
	}

	if (enJson) {
		console.log(JSON.stringify({ vues: parVue, echecs, exclus: exclusTotal }, null, '\t'));
		process.exit(0);
	}

	/* ── Rapport ───────────────────────────────────────────────────────────── */
	const NATURES = [
		'conforme',
		'portage',
		'gel',
		'gel-non-reporte',
		'instrument',
		'hors-verdict',
		'non-mesurable'
	];
	const compte = Object.fromEntries(NATURES.map((n) => [n, 0]));
	const compteZ = Object.fromEntries(NATURES.map((n) => [n, 0]));
	for (const v of parVue) {
		for (const c of v.cles) compte[c.nature]++;
		for (const z of v.zones) compteZ[z.nature]++;
	}

	console.log(
		'\nbatterie 8 — sur une base vierge, aucune valeur illustrative (P-02, RG-M01-01)\n' +
			`  ${vues.length} vue(s) × 4 populations : gel/natif · gel/vide · app/natif · app/vide\n` +
			`  état mesuré : celui que la planche donne par DÉFAUT` +
			(sonde ? `  ·  SONDE « ${sonde} » ACTIVE — code retour inversé` : '')
	);

	const portageFigee = parVue.flatMap((v) => v.cles.filter((c) => c.nature === 'portage'));
	const portageZero = parVue.flatMap((v) => v.zones.filter((z) => z.nature === 'portage'));

	console.log(
		`\n  A · VALEUR FIGÉE — ${Object.values(compte).reduce((a, b) => a + b, 0)} clé(s) relevée(s)\n` +
			`    conforme          ${String(compte.conforme).padStart(5)}   le gel varie avec le corpus, le portage aussi\n` +
			`    VALEUR FIGÉE      ${String(compte.portage).padStart(5)}   le gel varie, le portage NON — la faute de P-02\n` +
			`    gel               ${String(compte.gel).padStart(5)}   aucun des deux ne varie : réglage, ou valeur figée DU GEL\n` +
			`    gel non reporté   ${String(compte['gel-non-reporte']).padStart(5)}   le gel fige, le portage varie — divergence, pas défaut\n` +
			`    instrument        ${String(compte.instrument).padStart(5)}   clé absente d’au moins une population — NON OPPOSABLE\n` +
			`    hors verdict      ${String(compte['hors-verdict']).padStart(5)}   zone que sa vue ne fait pas juger (ARB-012)\n` +
			`    non mesurable     ${String(compte['non-mesurable']).padStart(5)}   vue qui ne rend pas sous corpus vide — voir plus bas`
	);

	console.log(
		`\n  B · ZÉRO MUET — zones rendant « 0 » sans état neutre, sous corpus VIDE\n` +
			`    ZÉRO MUET         ${String(compteZ.portage).padStart(5)}   le portage seul — la faute de RG-M01-01\n` +
			`    gel               ${String(compteZ.gel).padStart(5)}   les deux côtés : la MAQUETTE ne distingue pas 0 d’indisponible\n` +
			`    gel non reporté   ${String(compteZ['gel-non-reporte']).padStart(5)}   le gel seul\n` +
			`    instrument        ${String(compteZ.instrument).padStart(5)}   zone absente d’un côté — NON OPPOSABLE\n` +
			`    hors verdict      ${String(compteZ['hors-verdict']).padStart(5)}   zone que sa vue ne fait pas juger (ARB-012)\n` +
			`    non mesurable     ${String(compteZ['non-mesurable']).padStart(5)}   vue qui ne rend pas sous corpus vide`
	);

	if (nonMesurables.length) {
		console.log(
			`\n  ${nonMesurables.length} VUE(S) NON MESURABLE(S) SOUS CORPUS VIDE — et ce n’est PAS un rouge :\n` +
				'    une vue qui ne rend pas n’est pas une vue qui n’affiche aucune valeur. La\n' +
				'    cause est RELEVÉE, jamais supposée, et elle décide de l’imputation :'
		);
		for (const v of nonMesurables)
			for (const m of v.nonMesurable) console.log(`    ${v.vue}  ${m}`);
	}

	/* LE PÉRIMÈTRE, RELEVÉ ET NON SUPPOSÉ.
	   Le contrat de lot nomme M01, les tableaux de bord de domaine et d'univers,
	   et M15. Aucune source n'énumère pourtant les indicateurs des 41 vues, et une
	   liste écrite ici serait une liste d'espoirs (P-5). Le relevé la remplace :
	   PORTE UN INDICATEUR DE CORPUS toute vue dont au moins une clé VARIE avec le
	   corpus DANS LE GEL. C'est la maquette qui décide, pas l'instrument — et
	   c'est ce qui écarte mécaniquement les réglages de V-33 et les planches de
	   démonstration de V-34, sans qu'aucun nom de vue soit écrit nulle part. */
	const avecIndicateur = parVue
		.filter((v) => v.cles.some((c) => c.nature === 'conforme' || c.nature === 'portage'))
		.map((v) => v.vue);
	const sansIndicateur = parVue
		.filter((v) => !v.nonMesurable && !avecIndicateur.includes(v.vue))
		.map((v) => v.vue);
	console.log(
		`\n  LES VUES QUI PORTENT UN INDICATEUR DE CORPUS — relevées, jamais supposées :\n` +
			`    ${avecIndicateur.length} vue(s) portent au moins une valeur que le GEL fait varier avec le corpus :\n` +
			`      ${avecIndicateur.join(' ') || 'aucune'}\n` +
			`    ${sansIndicateur.length} vue(s) mesurées n’en portent aucune :\n` +
			`      ${sansIndicateur.join(' ') || 'aucune'}\n` +
			`    ${nonMesurables.length} vue(s) non mesurables sous corpus vide (voir plus haut).\n` +
			'    Un nombre qu’aucun corpus ne fait bouger dans la maquette n’est pas un\n' +
			'    indicateur : c’est un réglage — la rétention de 50 versions de V-33 — ou une\n' +
			'    planche de démonstration — les échantillons de V-34 et V-41. La séparation\n' +
			'    est faite par le gel, jamais par une liste de vues écrite dans l’instrument.'
	);

	/* LA RÈGLE EST-ELLE SEULEMENT ÉPROUVÉE ? Un « 0 valeur figée » ne vaut rien si
	   aucune clé ne varie avec le corpus au gel : la batterie dirait alors qu'elle
	   n'a rien trouvé là où elle n'a rien cherché (CLAUDE.md §6 P-5). Le nombre de
	   clés RÉELLEMENT variables est donc imprimé à chaque exécution, vert ou rouge. */
	const variablesAuGel = compte.conforme + compte.portage;
	console.log(
		variablesAuGel === 0
			? '\n  AUCUNE CLÉ NE VARIE AVEC LE CORPUS DANS LE GEL sur la sélection mesurée.\n' +
					'    La règle « une valeur identique sous deux corpus est figée » n’est donc\n' +
					'    éprouvée par aucun cas, et ce verdict-là ne vaut rien (P-5). Il est dit.'
			: `\n  RÈGLE ÉPROUVÉE — ${variablesAuGel} clé(s) varient RÉELLEMENT avec le corpus dans le gel :\n` +
					`    ${compte.conforme} que le portage suit, ${compte.portage} qu’il ne suit pas. Le « ${compte.portage} » ci-dessus\n` +
					'    n’est pas un silence de la mesure, c’est un résultat.'
	);

	if (portageFigee.length) {
		console.log(`\n  VALEURS FIGÉES IMPUTABLES AU PORTAGE — ${portageFigee.length} :`);
		for (const c of portageFigee.slice(0, 40))
			console.log(
				`    ${c.cle}\n` +
					`        gel  ${JSON.stringify(c.valeurs['gel/natif'])} → ${JSON.stringify(c.valeurs['gel/vide'])}` +
					`   app  ${JSON.stringify(c.valeurs['app/natif'])} → ${JSON.stringify(c.valeurs['app/vide'])}`
			);
		if (portageFigee.length > 40) console.log(`    … ${portageFigee.length - 40} autre(s).`);
	}
	if (portageZero.length) {
		console.log(`\n  ZÉROS MUETS IMPUTABLES AU PORTAGE — ${portageZero.length} :`);
		for (const v of parVue)
			for (const z of v.zones.filter((x) => x.nature === 'portage'))
				console.log(
					`    ${v.vue}  ${z.zone.padEnd(30)} le portage rend ${JSON.stringify(z.portage?.zeros ?? [])} ` +
						`sans état neutre ;\n` +
						`          la maquette, elle, rend ${z.gel?.neutres.join(' ') || '(rien)'} — ` +
						'la vue ne reporte pas la branche « aucune donnée » du gel.'
				);
	}

	const zeroGel = parVue.flatMap((v) =>
		v.zones.filter((z) => z.nature === 'gel').map((z) => ({ vue: v.vue, ...z }))
	);
	if (zeroGel.length) {
		console.log(
			`\n  ZÉROS MUETS DU GEL — ${zeroGel.length} zone(s), et ce n’est PAS un défaut de portage :\n` +
				'    la maquette elle-même rend « 0 » sur un corpus vide, sans état neutre. Les\n' +
				'    41 maquettes modèlent la base vierge comme un ÉTAT de planche, jamais comme\n' +
				'    un corpus : `data-etat="vide"` masque `.si-peuple` et révèle `.si-vide`, mais\n' +
				'    l’état NOMINAL sous corpus vide continue de compter et affiche des zéros.\n' +
				'    `mockups/` est en lecture seule : CONSTAT chiffré, à remonter, jamais un rouge.'
		);
		for (const z of zeroGel.slice(0, 40))
			console.log(
				`    ${z.vue}  ${z.zone.padEnd(34)} zéros : ${JSON.stringify(z.gel?.zeros ?? [])}`
			);
		if (zeroGel.length > 40) console.log(`    … ${zeroGel.length - 40} autre(s).`);
	}

	if (detail) {
		console.log('\n  DÉTAIL CLÉ PAR CLÉ :');
		for (const v of parVue)
			for (const c of v.cles)
				console.log(
					`    [${c.nature.padEnd(15)}] ${c.cle}\n` +
						`        ${POPULATIONS.map((p) => `${p.nom}=${JSON.stringify(c.valeurs[p.nom])}`).join(' ')}`
				);
	}

	/* ── Le contrôle de la clé, dans les deux sens — ECART-041 ─────────────── */
	const ctrl = parVue.reduce(
		(a, v) => ({
			total: a.total + v.controle.total,
			communes: a.communes + v.controle.communes,
			cote: a.cote + v.controle.orphelinesCote.length,
			corpus: a.corpus + v.controle.orphelinesCorpus.length,
			fusionnees: a.fusionnees + v.controle.fusionnees.length
		}),
		{ total: 0, communes: 0, cote: 0, corpus: 0, fusionnees: 0 }
	);
	console.log(
		`\n  LA CLÉ DE RAPPROCHEMENT, ÉPROUVÉE DANS LES DEUX SENS (ECART-041) :\n` +
			`    clé = vue › zone › signature de classes › rang. AUCUN texte, AUCUNE valeur.\n` +
			`    · ${ctrl.communes} clé(s) sur ${ctrl.total} portées par LES QUATRE populations — les seules opposables.\n` +
			`    · ${ctrl.corpus} orpheline(s) DE CORPUS : les deux côtés conviennent que l’élément\n` +
			`      disparaît avec le corpus. Attendu, bénin, non opposable.\n` +
			`    · ${ctrl.cote} orpheline(s) DE CÔTÉ : à corpus égal, un côté porte la clé et l’autre\n` +
			`      non. C’EST LE SEUL CHIFFRE QUI ACCUSE LA CLÉ — sous-rapprochement (la faute\n` +
			`      d’ECART-041) ou divergence réelle de structure. La batterie ne tranche pas.\n` +
			`    · ${ctrl.fusionnees} clé(s) FUSIONNÉE(S) : plusieurs porteurs de mêmes classes dans la même\n` +
			`      zone, comparés en multiensemble — sur-rapprochement possible, l’autre moitié\n` +
			`      de la faute d’ECART-041. Chiffrée plutôt que tue.`
	);
	const fusion = parVue.flatMap((v) => v.controle.fusionnees);
	if (fusion.length) {
		console.log(`\n    Les fusionnées, nommées — ${fusion.length} :`);
		for (const c of fusion.slice(0, 20)) console.log(`      ${c}`);
		if (fusion.length > 20) console.log(`      … ${fusion.length - 20} autre(s).`);
	}
	const cotes = parVue.flatMap((v) => v.controle.orphelinesCote);
	if (cotes.length) {
		console.log(`\n    Les orphelines de côté, nommées — ${cotes.length} :`);
		for (const c of cotes.slice(0, 30)) console.log(`      ${c}`);
		if (cotes.length > 30) console.log(`      … ${cotes.length - 30} autre(s).`);
	}

	/* ── Ce que la batterie NE COUVRE PAS — mesuré, à chaque exécution ─────── */
	const etatsTotaux = vues.reduce((n, v) => n + scenarioDe(v).etats.length, 0);
	const couplesTotaux = vues.reduce((n, v) => {
		const s = scenarioDe(v);
		return n + s.etats.length * s.fenetres.length;
	}, 0);
	const vuesDejaVides = vues.filter((v) => {
		const cles = parVue.find((x) => x.vue === v)?.cles ?? [];
		return cles.length === 0;
	});
	console.log(
		'\n  CE QUE CETTE BATTERIE NE COUVRE PAS — mesuré, jamais recopié (ARB-023) :\n' +
			`    · ${etatsTotaux - vues.length} état(s) sur ${etatsTotaux} : SEUL l’état par défaut de chaque vue est mesuré.\n` +
			'      P-02 porte sur le corpus, pas sur la position de planche ; mesurer les 265\n' +
			'      états quadruplerait un budget déjà tenu par quatre populations.\n' +
			`    · ${couplesTotaux - etatsTotaux} couple(s) de fenêtre : seule ${conditions.FENETRE_PRINCIPALE} est mesurée.\n` +
			'      Une valeur figée ne l’est pas davantage à 360 px.\n' +
			`    · ${echecs.length} relevé(s) en échec ou hors 200 : la vue n’y est pas jugée du tout.\n` +
			`    · ${vuesDejaVides.length} vue(s) sans aucune clé — ${vuesDejaVides.join(', ') || 'aucune'} :\n` +
			'      soit elles ne rendent aucun nombre, soit leur variante native est DÉJÀ la\n' +
			'      variante vide (V-05, V-06 par E-04) et les deux corpus y sont le même.\n' +
			'    · les nombres portés par un ATTRIBUT — `aria-label`, `title`, `alt` — et ceux\n' +
			'      peints dans un `<svg>` ou un `<canvas>`. La sonde lit les nœuds de texte\n' +
			'      rendus, et rien d’autre. L’alternative textuelle de P-06 a sa batterie, la 10.\n' +
			'    · la question de savoir si un nombre qui VARIE est le BON nombre. Cette\n' +
			'      batterie prouve qu’il n’est pas figé, jamais qu’il est juste : c’est\n' +
			'      `pnpm verif:fraicheur` et `pnpm test:unit` qui en répondent.'
	);

	console.log('\n  CE QUE LA TABLE EXCLUT DES VALEURS, ET POURQUOI :');
	for (const e of EXCLUSIONS)
		console.log(
			`    ${e.famille.padEnd(12)} ${String(exclusTotal[e.famille] ?? 0).padStart(5)} occurrence(s) — ${e.motif}`
		);

	if (echecs.length) {
		console.log(`\n  ${echecs.length} relevé(s) en échec :`);
		for (const e of echecs.slice(0, 30))
			console.log(`    ${e.vue} [${e.population}] statut=${e.statut} ${e.erreur ?? ''}`);
	}

	/* ── Sortie ────────────────────────────────────────────────────────────── */
	/* LES ÉCHECS DE RELEVÉ NE SONT PAS COMPTÉS ROUGES, ET C'EST UNE DÉCISION.
	   Chacun rend sa vue NON MESURABLE, et une vue non mesurée n'a pas de défaut
	   à son passif : lui en imputer un serait exactement la faute d'ECART-041,
	   accuser le portage de ce que la mesure n'a pas vu. Le fait est chiffré, ses
	   causes sont nommées, et la ligne de base est contrôlée à part — c'est elle,
	   et non ce compteur, qui empêche le vert par disparition du sujet. */
	const rouges = compte.portage + compteZ.portage;
	const manqueGel = compte.gel + compteZ.gel;
	const gelHorsSeuil = seuilGel === null ? manqueGel > 0 : manqueGel > seuilGel;

	if (seuilGel === null && manqueGel > 0) {
		console.log(
			`\n  LE DÉPÔT NE PEUT PAS PASSER AU VERT, ET CE N'EST PAS UN DÉFAUT DE PORTAGE.\n` +
				`    ${compte.gel} clé(s) ne varient d’aucun côté et ${compteZ.gel} zone(s) rendent « 0 » des deux\n` +
				`    côtés sans état neutre. Le gel les porte ; \`mockups/\` est en lecture seule, et\n` +
				`    inventer l’état neutre qui manque est le comblement que le contrat interdit.\n` +
				`    SEUIL DE DÉPART PROPOSÉ : ${manqueGel}. Il n’est PAS écrit dans cet instrument —\n` +
				`    un seuil que la mesure se donne à elle-même ne mesure rien. Une fois arbitré :\n` +
				`    \`pnpm test:vide --seuil-gel=${manqueGel}\`. Tant qu’il ne l’est pas, ce ROUGE est le verdict.`
		);
	} else if (seuilGel !== null && manqueGel < seuilGel) {
		console.log(
			`\n  SEUIL PÉRIMÉ — arbitré à ${seuilGel}, mesuré à ${manqueGel}. Il doit redescendre,\n` +
				'    sans quoi il absoudrait par avance une régression future.'
		);
	}

	const vert = rouges === 0 && !gelHorsSeuil;
	const duree = ((Date.now() - t0) / 1000).toFixed(0);

	/* LE RAPPORT MACHINE — même convention que le banc (`verif/rapports/` est en
	   sortie volatile, versionnée nulle part). Il porte ce qu'un lecteur pressé ne
	   lira pas dans la console : le seuil PROPOSÉ, les défauts nommés, et ce que
	   la batterie ne couvre pas. Le seuil y est proposé, jamais appliqué : c'est
	   `--seuil-gel=` qui l'applique, et c'est une décision de commanditaire. */
	const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');
	mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
	writeFileSync(
		join(DOSSIER_RAPPORTS, 'vide.json'),
		JSON.stringify(
			{
				batterie: 8,
				regles: ['P-02', 'RG-M01-01'],
				vues: vues.length,
				populations: POPULATIONS.map((p) => p.nom),
				etat_mesure: 'défaut de planche',
				sonde: sonde ?? null,
				verdict: vert ? 'vert' : 'rouge',
				secondes: Number(duree),
				valeur_figee: compte,
				zero_muet: compteZ,
				defauts_de_portage: {
					valeurs_figees: portageFigee,
					zeros_muets: parVue.flatMap((v) =>
						v.zones.filter((z) => z.nature === 'portage').map((z) => ({ vue: v.vue, ...z }))
					)
				},
				vues_non_mesurables: nonMesurables.map((v) => ({ vue: v.vue, motifs: v.nonMesurable })),
				vues_a_indicateur: avecIndicateur,
				vues_sans_indicateur: sansIndicateur,
				cle: { ...ctrl, definition: 'vue › zone › signature de classes › rang' },
				exclusions: exclusTotal,
				seuil_gel: { propose: manqueGel, arbitre: seuilGel },
				non_couvert: {
					etats_non_mesures: etatsTotaux - vues.length,
					etats_declares: etatsTotaux,
					couples_de_fenetre_non_mesures: couplesTotaux - etatsTotaux,
					releves_en_echec: echecs.length,
					vues_sans_cle: vuesDejaVides
				},
				parVue
			},
			null,
			'\t'
		)
	);
	console.log('  rapport machine : verif/rapports/vide.json');

	if (sonde) {
		const vu = compte.portage + compteZ.portage;
		console.log(
			vu > 0
				? `\n  SONDE « ${sonde} » — la batterie a vu la perturbation : ` +
						`${compte.portage} valeur(s) figée(s), ${compteZ.portage} zéro(s) muet(s). ${duree} s.\n`
				: `\n  SONDE « ${sonde} » — ÉCHEC : la batterie est restée VERTE malgré la perturbation.\n` +
						'    Un instrument qui ne sait pas dire non ne prouve rien (RA-01).\n'
		);
		process.exit(vu > 0 ? 0 : 1);
	}

	console.log(
		`\n  ${vert ? 'VERT' : 'ROUGE'} — ${rouges} défaut(s) imputable(s) au PORTAGE` +
			` (${compte.portage} valeur(s) figée(s), ${compteZ.portage} zéro(s) muet(s))` +
			` · ${nonMesurables.length} vue(s) non mesurable(s), dont ${echecs.length} relevé(s) en échec — non imputés` +
			` · ${manqueGel} au GEL` +
			(seuilGel === null ? ' (aucun seuil arbitré)' : ` (seuil arbitré : ${seuilGel})`) +
			` · ${compte.instrument + compteZ.instrument} non opposable(s).  ${duree} s.\n`
	);
	process.exit(vert ? 0 : 1);
}

/* Le point d'entrée n'est exécuté que si le module est lancé directement :
   `verif/vide.test.ts` importe les fonctions pures sans démarrer de navigateur
   ni de serveur. */
if (process.argv[1] && /vide\.mjs$/.test(process.argv[1])) {
	await executer(process.argv.slice(2));
}
