#!/usr/bin/env node
/**
 * Batterie 7 — « aucune action interdite dans le DOM ». `pnpm test:droits`.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni la liste des
 * axes de droit qu'il porte, ni `verif/references/droits-seuil.json`. Retirer
 * un axe, rétrécir la définition d'« action » ou requalifier une nature pour
 * obtenir du vert est le contournement nommé par PLAN §12 (RA-01). La sortie
 * légitime d'un rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE PROUVE
 *
 * `CLAUDE.md` §4, batterie 7 : « Aucune action non autorisée n'est présente
 * dans le DOM — ni grisée, ni masquée. »
 *
 * `P-09` (CDC:1650) : « Une action interdite n'est pas affichée — ni grisée,
 * ni refusée après le clic. L'utilisateur ne rencontre pas de porte fermée. »
 * `RG-M05-08` (CDC:754) : « Les actions d'écriture (Modifier, Vérifier,
 * Signaler, Supprimer) ne sont AFFICHÉES que si l'utilisateur y a droit. »
 * `docs/DESIGN.md` §2.A A-7, ligne « Sans droit » : « Pas de composant :
 * l'élément est ABSENT DU DOM. »
 *
 * « NI MASQUÉE » EST LE MOT DÉCISIF, ET C'EST CE QUI REND LA RÈGLE MESURABLE.
 * Un `display: none`, un `hidden`, un `aria-hidden` ne suffisent pas : le nœud
 * doit être ABSENT. L'absence d'un nœud se constate ; « l'utilisateur ne
 * rencontre pas de porte fermée » ne se constate pas.
 *
 * Les règles qui décident de l'autorisation sont `RG-DRO-01` à `RG-DRO-05`
 * (CDC:125-133). Cette batterie ne les RÉSOUT pas — la résolution appartient
 * aux unitaires (batterie 3) et l'inatteignabilité à la batterie 6
 * (`pnpm test:etancheite`). Elle mesure ce que le DOM porte UNE FOIS le droit
 * résolu, et rien d'autre. La frontière est imprimée à chaque exécution.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS TERMES, ET AUCUNE SOURCE NE LES ÉNUMÈRE — DONC TROIS DÉCISIONS
 *
 * Le dépôt ne dit nulle part ce qu'est « une action », ni quels axes portent
 * un « droit », ni comment on constate qu'une action est « interdite ». Chacune
 * de ces trois définitions est une DÉCISION de l'instrument, déclarée ici,
 * imprimée à chaque exécution, et jamais présentée comme une lecture.
 *
 *   ACTION            un nœud INTERACTIF — voir `SELECTEUR_ACTION`. RG-M05-08
 *                     nomme « Modifier, Vérifier, Signaler, Supprimer » sans
 *                     les rattacher à aucun marqueur : le seul substitut
 *                     mécanique est « ce sur quoi l'utilisateur peut agir ».
 *                     Un CONTENEUR masqué par un droit n'est pas une action ;
 *                     ses descendants interactifs, eux, sont comptés un par un.
 *                     C'est ainsi que le lien « Console » de V-08, qui ne porte
 *                     AUCUNE classe de droit et vit dans une section
 *                     `si-ecriture`, est compté — un crible par nom l'aurait
 *                     manqué.
 *
 *   AXE DE DROIT      un axe de la planche de revue dont la position change le
 *                     droit de l'utilisateur. Seule liste écrite à la main
 *                     dans ce fichier, ÉPROUVÉE avant toute mesure (P-5) : un
 *                     axe qu'aucun couple d'états du corpus n'exerce fait
 *                     sortir en code 2. Les axes NON retenus sont imprimés.
 *
 *   ACTION INTERDITE  une action que le CORPUS LUI-MÊME déclare interdite, par
 *                     différence : elle est rendue dans un état, et ne l'est
 *                     plus dans l'état voisin qui ne diffère que par un axe de
 *                     droit. C'est le corpus qui désigne l'interdiction, pas
 *                     l'instrument. Aucune liste d'actions sensibles n'est
 *                     écrite ici : il n'y en a pas à écrire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX CRIBLES, ET AUCUN NE DÉPEND D'UN NOM QUE J'AURAIS CHOISI
 *
 * Le heuristique par nom de la batterie 9 rendait « 0 classe non classée »
 * alors que `.palette__etat`, présent sur 30 vues, lui échappait entièrement
 * (ÉCART-040). Les deux cribles ci-dessous ne citent aucune classe.
 *
 *   R-1  LE DIFFÉRENTIEL. Deux états d'une même vue qui ne diffèrent que par
 *        un axe de droit. Une action rendue dans l'un et non dans l'autre est
 *        conditionnée par le droit — quel que soit le mécanisme : classe,
 *        style en ligne, attribut `hidden`, retrait par script. Aucun nom n'y
 *        intervient.
 *
 *   R-2  LA RÈGLE CSS. Toute règle du document qui MASQUE (`display:none`,
 *        `visibility:hidden`) ou INERTE (`cursor:not-allowed`,
 *        `pointer-events:none`) et dont le sélecteur cite un ATTRIBUT DE DROIT.
 *        Les attributs de droit ne sont pas écrits ici non plus : ils sont
 *        DÉRIVÉS de R-1 — ce sont les attributs `data-*` dont la valeur change
 *        entre les deux états d'un couple. Le SUJET de la règle — sa dernière
 *        compound — désigne les nœuds gouvernés. R-2 voit les vues qui n'ont
 *        aucun couple, donc que R-1 ne peut pas atteindre.
 *
 * R-1 est le crible OPPOSABLE : il constate une interdiction que le corpus
 * déclare. R-2 est le crible LARGE : il compte le mécanisme partout où il est
 * posé, y compris là où aucun état déclaré ne l'exerce.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX CÔTÉS, ET LA NATURE DU DÉFAUT
 *
 * Jurisprudence des batteries 9 et 10, reprise telle quelle : les deux côtés
 * sont audités par le MÊME code, dans les MÊMES conditions de capture, et la
 * nature se lit dans la comparaison. Sans ce recoupement, la batterie 10
 * aurait imputé 3 470 défauts au code au lieu de 31.
 *
 *     commun aux deux côtés   → GEL      regel, arbitrage
 *     surplus côté portage    → PORTAGE  corrigeable par un lot
 *     surplus côté gel        → voir ci-dessous — ET C'EST UNE ADAPTATION
 *     indécidable             → INSTRUMENT, non opposable
 *
 * UNE ADAPTATION DÉCLARÉE, ET ELLE EST NÉCESSAIRE. Pour les batteries 9 et 10,
 * un défaut présent au gel et absent de l'application est une DIVERGENCE à
 * signaler. Ici le défaut est « le nœud est encore là » : présent au gel et
 * absent de l'application, il signifie que L'APPLICATION TIENT P-09 LÀ OÙ LA
 * MAQUETTE NE LE TIENT PAS. Le nommer « divergence » le ferait lire comme une
 * dette alors que c'est l'inverse. Ces cas sont comptés à part, en constat
 * favorable, jamais opposés — et jamais tus.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * COMMANDES
 *   node verif/droits.mjs                     41 vues, deux côtés
 *   node verif/droits.mjs V-08 V-13           une sélection
 *   node verif/droits.mjs --json              le relevé exploitable
 *   node verif/droits.mjs --detail            chaque action nommée
 *   node verif/droits.mjs --sonde=masque      la preuve que la batterie sait
 *   node verif/droits.mjs --sonde=grise       dire non ; code retour INVERSÉ
 *   node verif/droits.mjs --sonde=offerte
 *   node verif/droits.mjs --seuil-gel=N       le manque de gel ARBITRÉ à N
 *   node verif/droits.mjs --base=http://…     un `vite dev` déjà démarré
 *   node verif/droits.mjs --concurrence=6     pages en parallèle (défaut 6)
 */

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');
const SEUIL = join(racine, 'verif', 'references', 'droits-seuil.json');

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES AXES DE DROIT — la seule liste écrite à la main, et elle est éprouvée.

   Un axe de planche est un axe de DROIT quand sa position change ce que
   l'utilisateur a le droit de faire. Aucune source ne les énumère : les 53
   axes du corpus sont extraits mécaniquement des maquettes par
   `verif/extraire-scenarios.mjs`, sans typage. Le tri est donc une décision,
   déclarée ici, tracée à la règle qui la motive, et ÉPROUVÉE avant mesure —
   un axe qu'aucun couple n'exerce fait sortir en code 2 (P-5).
   ═════════════════════════════════════════════════════════════════════════ */

export const AXES_DE_DROIT = [
	{
		axe: 'droits',
		trace: 'socle.css:396 — .app[data-droits="lecture"] .si-ecriture ; RG-M05-08'
	},
	{
		axe: 'role',
		trace: 'socle.css:397 — .app:not([data-role="admin"]) .si-admin ; RG-DRO-03'
	},
	{
		axe: 'dr',
		trace: 'V-13 — les trois droits de dossier du CDC §2.3 ; RG-DRO-01'
	},
	{
		axe: 'dv',
		trace: 'V-21 — « un dossier interdit n’apparaît pas » (BRIEF:1176) ; RG-DRO-04'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   2. CE QUE LA BATTERIE N'APPELLE PAS UN AXE DE DROIT, ET POURQUOI.

   Énoncé et CHIFFRÉ à chaque exécution : une exclusion muette est une
   couverture inventée (ARB-023). Trois axes NOMMENT une interdiction sans en
   être une au sens de RG-M05-08 — ils portent sur l'ACCÈS À UNE RESSOURCE, que
   RG-ACC-04 régit et que la batterie 6 mesure, et non sur l'affichage d'une
   action dans une page déjà ouverte. Confondre les deux est exactement ce
   qu'ARB-005 rappelle avoir été une erreur de rédaction.
   ═════════════════════════════════════════════════════════════════════════ */

export const AXES_ECARTES = [
	{
		axe: 'cas',
		motif:
			'la RÉSOLUTION D’UNE ADRESSE — V-04, V-26 : « interdite », « privée », ' +
			'« inexistante » doivent rendre la MÊME réponse (RG-ACC-04). Le régime ' +
			'indiscernable porte sur une ressource entière, et sa preuve — corps, ' +
			'en-têtes, code ET temps de réponse — appartient à la batterie 6.'
	},
	{
		axe: 'arrivee',
		motif:
			'l’état d’un JETON de réinitialisation (V-06) — RG-ACC-03. Une session, ' +
			'pas un droit de dossier.'
	},
	{
		axe: 'c-verrou',
		motif:
			'le compte « mot de passe verrouillé » de RG-CPT-01 — il conserve TOUS ses ' +
			'droits de contenu. Ce n’est pas un droit, c’est une contrainte de compte.'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   3. CE QU'EST UNE ACTION, ET CE QUI LA REND INERTE.

   Le sélecteur est volontairement LARGE : il attrape des nœuds qui ne sont pas
   des « actions d'écriture » au sens de RG-M05-08 — un onglet, une option. Le
   crible qui décide n'est pas celui-ci, c'est le DIFFÉRENTIEL : seul ce que le
   corpus retire quand le droit tombe est opposé. Un sélecteur étroit, lui,
   aurait manqué le lien « Console » de V-08, qui ne porte aucune marque.
   ═════════════════════════════════════════════════════════════════════════ */

export const SELECTEUR_ACTION = [
	'a[href]',
	'button',
	'input',
	'select',
	'textarea',
	'summary',
	'[role="button"]',
	'[role="link"]',
	'[role="menuitem"]',
	'[role="menuitemcheckbox"]',
	'[role="menuitemradio"]',
	'[role="tab"]',
	'[role="checkbox"]',
	'[role="switch"]',
	'[role="option"]',
	'[role="treeitem"]',
	'[contenteditable=""]',
	'[contenteditable="true"]',
	'[tabindex]'
].join(', ');

/** Ce qui fait qu'une action VISIBLE est une porte fermée : elle est là, elle
 *  se voit, et elle refuse. C'est la seconde moitié de P-09 — « ni grisée ». */
export const MARQUEURS_INERTES = [
	{ marque: '[disabled]', quoi: 'attribut `disabled` — le navigateur refuse le geste' },
	{ marque: '[aria-disabled="true"]', quoi: 'inertie annoncée à la technologie d’assistance' },
	{ marque: 'cursor: not-allowed', quoi: 'le curseur d’interdiction — la porte fermée visible' },
	{ marque: 'pointer-events: none', quoi: 'le geste ne parvient pas au nœud' }
];

/* ═══════════════════════════════════════════════════════════════════════════
   4. FONCTIONS PURES — donc unitaires (`verif/droits.test.ts`).
   ═════════════════════════════════════════════════════════════════════════ */

/** Les vues du dépôt, par leurs scénarios. */
export function vuesDuDepot() {
	return readdirSync(SCENARIOS)
		.filter((f) => /^V-\d\d\.json$/.test(f))
		.map((f) => f.slice(0, 4))
		.sort();
}

export function scenarioDe(vue) {
	return JSON.parse(readFileSync(join(SCENARIOS, `${vue}.json`), 'utf8'));
}

/**
 * Les COUPLES DE DROIT d'une vue : deux états dont les vecteurs s'accordent sur
 * tous les axes sauf UN, et cet axe est un axe de droit.
 *
 * L'exigence « tous les autres axes égaux » n'est pas une prudence : sans elle,
 * `V-11 dom-infrastructure` et `V-11 role-lecteur` — qui changent AUSSI de
 * domaine — feraient passer pour « retirées par le droit » toutes les actions
 * du domaine absent.
 *
 * Les états de ZONE en sont exclus : ils ne sont pas une page dans un état,
 * mais un spécimen découpé dans une planche de catalogue. Deux spécimens ne
 * sont pas deux droits.
 */
export function couplesDeDroit(scenario, axes = AXES_DE_DROIT.map((a) => a.axe)) {
	const etats = (scenario.etats ?? []).filter((e) => e.vecteur && !e.zone);
	const couples = [];
	for (let i = 0; i < etats.length; i++) {
		for (let j = i + 1; j < etats.length; j++) {
			const a = etats[i].vecteur;
			const b = etats[j].vecteur;
			const cles = new Set([...Object.keys(a), ...Object.keys(b)]);
			const differents = [...cles].filter((k) => String(a[k]) !== String(b[k]));
			if (differents.length !== 1 || !axes.includes(differents[0])) continue;
			couples.push({
				axe: differents[0],
				a: etats[i].cle,
				b: etats[j].cle,
				valeurA: String(a[differents[0]]),
				valeurB: String(b[differents[0]])
			});
		}
	}
	return couples;
}

/**
 * Le SUJET d'un sélecteur CSS — sa dernière compound, celle qui désigne les
 * nœuds que la règle gouverne. `.app[data-droits="lecture"] .si-ecriture` a
 * pour sujet `.si-ecriture`.
 *
 * Le découpage respecte crochets, parenthèses et guillemets : sans cela,
 * `.app:not([data-role="admin"]) .si-admin` se couperait à l'intérieur du
 * `:not()` et rendrait un sujet faux — donc une gouvernance faussement large.
 *
 * @param {string} selecteur @returns {string[]} un sujet par sélecteur de la liste
 */
export function sujetsDuSelecteur(selecteur) {
	const sujets = [];
	let profondeur = 0;
	let guillemet = null;
	let courant = '';
	let dernier = '';
	const finirCompound = () => {
		if (courant.trim()) dernier = courant.trim();
		courant = '';
	};
	const finirSelecteur = () => {
		finirCompound();
		if (dernier) sujets.push(dernier);
		dernier = '';
	};
	for (const c of selecteur) {
		if (guillemet) {
			courant += c;
			if (c === guillemet) guillemet = null;
			continue;
		}
		if (c === '"' || c === "'") {
			guillemet = c;
			courant += c;
			continue;
		}
		if (c === '[' || c === '(') profondeur++;
		if (c === ']' || c === ')') profondeur--;
		if (profondeur === 0) {
			if (c === ',') {
				finirSelecteur();
				continue;
			}
			if (c === ' ' || c === '>' || c === '+' || c === '~') {
				finirCompound();
				continue;
			}
		}
		courant += c;
	}
	finirSelecteur();
	return sujets;
}

/**
 * Les ATTRIBUTS DE DROIT, DÉRIVÉS et non écrits : les attributs `data-*` dont
 * la valeur change entre les deux états d'un couple de droit.
 *
 * C'est ce qui permet à R-2 de trouver `.si-ecriture`, `.si-admin`,
 * `.si-gestionnaire` et `.si-redacteur` sans que ce fichier ne cite AUCUNE de
 * ces classes — et de trouver la prochaine sans être modifié.
 *
 * @param {string[]} a paires « nom=valeur » relevées dans l'état A
 * @param {string[]} b idem dans l'état B
 */
export function attributsQuiChangent(a, b) {
	const parNom = (liste) => {
		const m = new Map();
		for (const p of liste) {
			const i = p.indexOf('=');
			const nom = p.slice(0, i);
			(m.get(nom) ?? m.set(nom, new Set()).get(nom)).add(p.slice(i + 1));
		}
		return m;
	};
	const ma = parNom(a);
	const mb = parNom(b);
	const noms = new Set([...ma.keys(), ...mb.keys()]);
	const change = [];
	for (const n of noms) {
		const va = [...(ma.get(n) ?? [])].sort().join(' ');
		const vb = [...(mb.get(n) ?? [])].sort().join(' ');
		if (va !== vb) change.push(n);
	}
	return change.sort();
}

/**
 * Apparie les actions de deux relevés par SIGNATURE et par RANG.
 *
 * La signature ne porte PAS les classes, et c'est délibéré : `.ac--interdit`
 * s'ajoute et se retire d'un état à l'autre, si bien qu'une signature qui les
 * porterait déclarerait « nœud disparu, nœud apparu » là où c'est le même nœud
 * qui a été grisé. Le rang départage les homonymes, en ordre de document.
 */
export function apparier(actionsA, actionsB) {
	const index = new Map();
	for (const n of actionsB) {
		const l = index.get(n.sig) ?? index.set(n.sig, []).get(n.sig);
		l.push(n);
	}
	const rang = new Map();
	const paires = [];
	for (const n of actionsA) {
		const k = rang.get(n.sig) ?? 0;
		rang.set(n.sig, k + 1);
		paires.push({ a: n, b: (index.get(n.sig) ?? [])[k] ?? null });
	}
	return paires;
}

/**
 * Le SORT d'une action dans l'état restreint, vu d'un seul côté.
 *
 *   'inexistant' ce côté-ci n'a PAS le nœud, même dans l'état de référence.
 *                Il ne dit donc rien de l'interdiction — mais l'AUTRE côté,
 *                lui, peut en dire quelque chose ;
 *   'hors-etat'  le nœud est là mais n'est pas rendu dans l'état de référence :
 *                le droit ne le retire pas, puisqu'il n'était pas offert ;
 *   'absent'     il n'est plus dans le DOM — P-09 TENU ;
 *   'masque'     il est dans le DOM, non rendu — P-09 VIOLÉ, « ni masquée » ;
 *   'grise'      il est dans le DOM, rendu, inerte — P-09 VIOLÉ, « ni grisée » ;
 *   'actif'      il est là, rendu, actif — le droit ne le retire pas.
 *
 * La distinction 'inexistant' / 'hors-etat' n'est pas une nuance de forme :
 * sans elle, une action que SEULE l'application porte et qu'elle masque quand
 * le droit tombe n'était comptée nulle part — la sonde `masque` l'a montré,
 * et c'est elle qui a corrigé l'instrument.
 */
export function sortDeLAction(a, b) {
	if (!a) return 'inexistant';
	if (!a.rend) return 'hors-etat';
	if (!b) return 'absent';
	if (!b.rend) return 'masque';
	if (b.inerte && !a.inerte) return 'grise';
	return 'actif';
}

/**
 * LA NATURE, les deux côtés confrontés. Rend `null` quand il n'y a rien à
 * dire — l'action n'est pas conditionnée, ou elle l'est et P-09 est tenu.
 *
 * @param {string} gel sort côté maquette gelée
 * @param {string} portage sort côté application
 * @returns {{regle: string, nature: string, quoi: string} | null}
 */
export function natureDuCouple(gel, portage) {
	const R = (regle, nature, quoi) => ({ regle, nature, quoi });
	/* Un nœud que la maquette ne rend pas dans l'état de référence n'y est pas
	   offert : elle ne déclare aucune interdiction, et il n'y a rien à lire. */
	if (gel === 'hors-etat' || portage === 'hors-etat') return null;
	if (gel === 'inexistant') {
		/* La maquette n'a pas ce nœud du tout. Si l'application le porte et le
		   CONDITIONNE au droit, le conditionnement est à elle seule — et P-09
		   vaut pour lui comme pour les autres. */
		if (portage === 'masque' || portage === 'grise') {
			return R(
				portage === 'masque' ? 'p09:action-masquee' : 'p09:action-grisee',
				'portage',
				'une action que SEULE l’application porte, conditionnée par un droit et ' +
					'MASQUÉE ou GRISÉE au lieu d’être retirée'
			);
		}
		return null;
	}
	if (portage === 'inexistant') {
		if (gel === 'actif') return null;
		return R(
			'divergence:action-absente-du-portage',
			'constat',
			'la maquette conditionne une action que l’application ne rend dans AUCUN des deux ' +
				'états — P-09 y est tenu par accident, la divergence de rendu reste'
		);
	}
	if (gel === 'actif') {
		if (portage === 'actif') return null;
		return R(
			'divergence:conditionnement-du-portage-seul',
			'constat',
			'l’application retire une action que la maquette laisse — divergence de rendu, ' +
				'jamais un défaut de P-09'
		);
	}
	if (portage === 'actif') {
		return R(
			'p09:action-offerte-sans-droit',
			'portage',
			'la maquette retire l’action quand le droit tombe, l’application la laisse ACTIVE — ' +
				'porte ouverte puis refus après le clic, ce que RG-M05-08 interdit nommément'
		);
	}
	if (gel === 'absent') {
		if (portage === 'absent') return null;
		return R(
			portage === 'masque' ? 'p09:action-masquee' : 'p09:action-grisee',
			'portage',
			'la maquette RETIRE le nœud, l’application se contente de le masquer ou de le griser'
		);
	}
	if (portage === 'absent') {
		return R(
			'constat:absence-tenue-par-le-portage-seul',
			'constat-favorable',
			'l’application tient P-09 là où la maquette ne le tient pas — compté, jamais opposé'
		);
	}
	return R(
		gel === 'masque' && portage === 'masque'
			? 'p09:action-masquee'
			: gel === 'grise' && portage === 'grise'
				? 'p09:action-grisee'
				: 'p09:action-retenue',
		'gel',
		'le nœud reste dans le DOM des DEUX côtés — la maquette masque là où DESIGN §2.A A-7 ' +
			'écrit « l’élément est absent du DOM »'
	);
}

/** Agrège des lignes en un compte par nature. */
export function agreger(lignes) {
	const t = { portage: 0, gel: 0, constat: 0, 'constat-favorable': 0, instrument: 0 };
	for (const l of lignes) t[l.nature] = (t[l.nature] ?? 0) + (l.occurrences ?? 1);
	return t;
}

/**
 * P-5 — LA TABLE ÉPROUVÉE AVANT LA MESURE.
 *
 * « Une règle qu'aucun cas n'exerce est une règle dont on ignore si elle
 * marche. » Le filtre d'ARB-013 est resté inerte huit lots durant faute de ce
 * contrôle. Ici : chaque axe de droit déclaré doit produire au moins un couple
 * dans le corpus. Sinon, code 2 — un refus d'instrument, pas un rouge de vue.
 */
export function eprouverLesAxes(vues) {
	const parAxe = new Map(AXES_DE_DROIT.map((a) => [a.axe, 0]));
	for (const v of vues) {
		for (const c of couplesDeDroit(scenarioDe(v))) parAxe.set(c.axe, (parAxe.get(c.axe) ?? 0) + 1);
	}
	return {
		parAxe: [...parAxe].map(([axe, n]) => ({ axe, couples: n })),
		inertes: [...parAxe].filter(([, n]) => n === 0).map(([axe]) => axe)
	};
}

/**
 * R-2 — les actions GOUVERNÉES par une règle de droit, à partir d'un relevé.
 *
 * `regles` porte les règles masquantes ou inertantes du document, chacune avec
 * les indices des actions que son sujet désigne. On ne garde que celles dont le
 * SÉLECTEUR cite un attribut de droit dérivé.
 */
export function gouverneesParUnDroit(releve, attributsDeDroit) {
	if (!releve) return { masquees: [], visibles: [], regles: [] };
	const retenues = releve.regles
		.map((r, i) => ({ ...r, i }))
		.filter((r) => attributsDeDroit.some((a) => r.sel.includes(a)));
	const indices = new Set(retenues.flatMap((r) => r.actions));
	const masquees = [];
	const visibles = [];
	for (const i of indices) {
		const n = releve.actions[i];
		if (!n) continue;
		(n.rend ? visibles : masquees).push(n.sig);
	}
	return { masquees, visibles, regles: retenues.map((r) => r.sel) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LA SONDE — ce qu'on relève dans la page, une fois l'état atteint.

   Un seul aller-retour par état : les règles CSS, les actions, les attributs
   de données et le contrôle d'héritage sont relevés ensemble. Ce qui coûte
   ici, ce sont les 500 chargements de page, pas le parcours du DOM.
   ═════════════════════════════════════════════════════════════════════════ */

/** Exécutée DANS la page. Ne dépend d'aucun module — Playwright la sérialise. */
const SONDE = ({ selecteurAction }) => {
	const rend = (n) => {
		const s = getComputedStyle(n);
		if (s.display === 'none' || s.visibility === 'hidden') return false;
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	/* La CAUSE de l'inertie est relevée avec elle : « 51 actions inertes » sans
	   leur cause se lirait « 51 portes fermées », alors qu'un `pointer-events:
	   none` sur une étiquette de cartographie n'est pas une porte du tout. */
	const causeInertie = (n) => {
		if (n.matches('[disabled]')) return 'disabled';
		if (n.matches('[aria-disabled="true"]')) return 'aria-disabled';
		const s = getComputedStyle(n);
		if (s.cursor === 'not-allowed') return 'cursor:not-allowed';
		if (s.pointerEvents === 'none') return 'pointer-events:none';
		return '';
	};
	const compact = (t) => (t ?? '').replace(/\s+/g, '').slice(0, 48);

	/* LA SIGNATURE NE PORTE PAS LES CLASSES — voir `apparier()`. Elle ne porte
	   pas non plus l'adresse : ARB-013 a établi que les `href` divergent entre
	   la maquette, qui pose `#`, et l'application, qui pose la route. */
	const signature = (n) =>
		[
			n.tagName.toLowerCase(),
			n.id ? '#' + n.id : '',
			compact(n.textContent),
			n.getAttribute('aria-label') ?? '',
			n.getAttribute('name') ?? '',
			n.getAttribute('type') ?? '',
			n.getAttribute('role') ?? ''
		].join('|');

	/* ── Les règles qui MASQUENT ou INERTENT ────────────────────────────────
	   PIÈGE MESURÉ, ET IL A COÛTÉ UNE PREMIÈRE RÉDACTION ENTIÈRE : depuis
	   l'imbrication CSS, `CSSStyleRule` HÉRITE de `CSSGroupingRule` et porte
	   donc un `cssRules` — vide, mais présent, donc VRAI. Un parcours écrit
	   « if (r.cssRules) { descendre ; continue } » saute ALORS TOUTES LES
	   RÈGLES du document et rend 0 sans se plaindre. Mesuré : 0 règle
	   masquante sur V-08, qui en porte 30. La règle propre est de traiter le
	   style d'abord, puis de descendre s'il y a de quoi.

	   LES DEUX POLARITÉS, ET LA SECONDE A FAILLI MANQUER. Le socle MASQUE
	   quand le droit tombe — `.app[data-droits="lecture"] .si-ecriture
	   { display: none }`. V-13 fait l'INVERSE : elle masque par défaut et
	   RÉVÈLE quand le droit est là — `.si-gestionnaire { display: none }`
	   puis `.app[data-droit="gestionnaire"] .si-gestionnaire
	   { display: inline-flex }`. Un crible qui ne retiendrait que les règles
	   MASQUANTES ne verrait RIEN de V-13 : la règle qui y cite le droit est
	   celle qui MONTRE. On retient donc toute règle qui touche à la
	   visibilité ou à l'inertie ET cite un attribut de données, PLUS toute
	   règle masquante ou inertante. */
	const regles = [];
	const parcourir = (liste) => {
		for (let i = 0; i < liste.length; i++) {
			const r = liste[i];
			if (r.selectorText && r.style) {
				const d = r.style;
				const touche =
					d.display !== '' || d.visibility !== '' || d.cursor !== '' || d.pointerEvents !== '';
				const masque = d.display === 'none' || d.visibility === 'hidden';
				const inerte = d.cursor === 'not-allowed' || d.pointerEvents === 'none';
				if (touche && (masque || inerte || r.selectorText.includes('data-')))
					regles.push({ sel: r.selectorText, masque, inerte, actions: [] });
			}
			if (r.cssRules && r.cssRules.length) parcourir(r.cssRules);
		}
	};
	let feuillesRefusees = 0;
	for (const f of document.styleSheets) {
		let rs;
		try {
			rs = f.cssRules;
		} catch {
			feuillesRefusees++;
			continue;
		}
		parcourir(rs);
	}

	/* ── Les actions ────────────────────────────────────────────────────────── */
	const noeuds = [...document.querySelectorAll(selecteurAction)];
	const actions = noeuds.map((n) => ({
		sig: signature(n),
		classes: (n.getAttribute('class') ?? '').trim(),
		rend: rend(n),
		cause: causeInertie(n),
		inerte: causeInertie(n) !== ''
	}));

	/* ── Le rattachement règle → actions, par le SUJET du sélecteur ─────────── */
	const sujetsDe = (selecteur) => {
		const sujets = [];
		let p = 0;
		let g = null;
		let c = '';
		let dernier = '';
		const finC = () => {
			if (c.trim()) dernier = c.trim();
			c = '';
		};
		const finS = () => {
			finC();
			if (dernier) sujets.push(dernier);
			dernier = '';
		};
		for (const ch of selecteur) {
			if (g) {
				c += ch;
				if (ch === g) g = null;
				continue;
			}
			if (ch === '"' || ch === "'") {
				g = ch;
				c += ch;
				continue;
			}
			if (ch === '[' || ch === '(') p++;
			if (ch === ']' || ch === ')') p--;
			if (p === 0) {
				if (ch === ',') {
					finS();
					continue;
				}
				if (ch === ' ' || ch === '>' || ch === '+' || ch === '~') {
					finC();
					continue;
				}
			}
			c += ch;
		}
		finS();
		return sujets;
	};
	let sujetsRefuses = 0;
	for (const r of regles) {
		for (const sujet of sujetsDe(r.sel)) {
			let cibles;
			try {
				cibles = document.querySelectorAll(sujet);
			} catch {
				sujetsRefuses++;
				continue;
			}
			/* LE NŒUD GOUVERNÉ, ET SES DESCENDANTS. Une section masquée par un
			   droit emporte les actions qu'elle contient : le lien « Console » de
			   V-08 ne porte aucune marque de droit, il vit dans une section qui en
			   porte une. Ne compter que les sujets EUX-MÊMES le manquerait — et
			   c'est exactement ce que le différentiel, lui, voit. */
			const ens = new Set();
			for (const e of cibles) {
				ens.add(e);
				for (const d of e.querySelectorAll(selecteurAction)) ens.add(d);
			}
			for (let i = 0; i < noeuds.length; i++) if (ens.has(noeuds[i])) r.actions.push(i);
		}
		r.actions = [...new Set(r.actions)];
	}

	/* ── Les attributs de données, pour la DÉRIVATION des attributs de droit ── */
	const attributs = new Set();
	for (const n of document.querySelectorAll('*')) {
		for (const a of n.attributes)
			if (a.name.startsWith('data-')) attributs.add(`${a.name}=${a.value}`);
	}

	/* ── C-1 : le contrôle des droits HÉRITÉS ────────────────────────────────
	   Le brief V-40 exige « droits hérités affichés en GRISÉ avec leur origine ».
	   La question que P-09 pose n'est pas « sont-ils grisés » — un droit affiché
	   est de l'INFORMATION — mais « portent-ils une ACTION que l'utilisateur ne
	   peut pas accomplir ». Le compte ci-dessous répond, et il répond en
	   comptant, pas en appréciant. */
	const heritage = { oui: { rangees: 0, actions: 0 }, non: { rangees: 0, actions: 0 } };
	for (const n of document.querySelectorAll('[data-herite]')) {
		const cle = n.getAttribute('data-herite') === 'oui' ? 'oui' : 'non';
		heritage[cle].rangees++;
		heritage[cle].actions += n.querySelectorAll(selecteurAction).length;
	}

	return {
		regles: regles.map((r) => ({
			sel: r.sel,
			masque: r.masque,
			inerte: r.inerte,
			actions: r.actions
		})),
		actions,
		attributs: [...attributs],
		heritage,
		feuillesRefusees,
		sujetsRefuses
	};
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. LE RELEVÉ D'UN ÉTAT, D'UN CÔTÉ — le chemin du banc, et rien d'autre.

   `verif/banc/serveur.mjs`, `ouvrirPage`, `reglerPlanche`, `reveler`,
   `retirerBlocsHorsProduit`, l'adresse de `mode-demo.mjs`. Le budget d'horloge
   est dépensé des DEUX côtés, dans le même ordre — c'est le protocole de
   `verif/maquette.mjs`, recopié et non réinventé. Une mesure prise dans
   d'autres conditions dirait autre chose que ce que le banc mesure.
   ═════════════════════════════════════════════════════════════════════════ */

/** Les perturbations de la preuve — posées sur le CANDIDAT seul. */
export const SONDES_CONNUES = {
	masque: {
		vue: 'V-08',
		paire: ['droits-ecriture', 'droits-lecture'],
		quoi: 'une action posée sur le candidat, rendue dans l’état privilégié et MASQUÉE dans l’état restreint',
		attendue: 'p09:action-masquee',
		poser: async (page, role) => {
			await page.evaluate((r) => {
				const b = document.createElement('button');
				b.type = 'button';
				b.id = 'sonde-p09';
				b.textContent = 'Sonde P-09';
				if (r === 'restreint') b.setAttribute('style', 'display:none');
				document.body.appendChild(b);
			}, role);
		}
	},
	grise: {
		vue: 'V-08',
		paire: ['droits-ecriture', 'droits-lecture'],
		quoi: 'une action posée sur le candidat, rendue dans les deux états et GRISÉE dans l’état restreint',
		attendue: 'p09:action-grisee',
		poser: async (page, role) => {
			await page.evaluate((r) => {
				const b = document.createElement('button');
				b.type = 'button';
				b.id = 'sonde-p09';
				b.textContent = 'Sonde P-09';
				b.setAttribute('style', 'display:inline-block;padding:4px');
				if (r === 'restreint') b.disabled = true;
				document.body.appendChild(b);
			}, role);
		}
	},
	offerte: {
		vue: 'V-08',
		paire: ['droits-ecriture', 'droits-lecture'],
		quoi:
			'le droit RETIRÉ au candidat dans l’état restreint — les actions que la maquette y ' +
			'retire restent offertes et actives',
		attendue: 'p09:action-offerte-sans-droit',
		poser: async (page, role) => {
			if (role !== 'restreint') return;
			await page.evaluate(() => {
				/* La perturbation ne retire pas une classe nommée : elle REND SON
				   DROIT au candidat, c'est-à-dire ce qu'une implémentation qui
				   oublierait d'appliquer le droit produirait exactement. */
				for (const n of document.querySelectorAll('[data-droits]'))
					n.setAttribute('data-droits', 'ecriture');
			});
		}
	}
};

async function releverEtat(navigateur, ctx, vue, scenario, etat, cote, perturbation) {
	const { ouvrirPage, reglerPlanche } = ctx.capture;
	const {
		FENETRE_PRINCIPALE,
		retirerBlocsHorsProduit,
		avancer,
		AVANCE_ETAT_MS,
		AVANCE_CHARGEMENT_MS,
		POINTEUR_AU_REPOS
	} = ctx.conditions;
	const app = cote === 'portage';
	const adresse = app
		? `${ctx.originePortage}${ctx.adresseDeLEtat(vue, etat.cle, 'app', AVANCE_CHARGEMENT_MS)}`
		: `${ctx.origineGel}/${scenario.maquette.replace(/^mockups\//, '')}`;

	const { page, contexte, statut } = await ouvrirPage(navigateur, adresse, FENETRE_PRINCIPALE);
	let erreur = null;
	let brut = null;
	try {
		if (app && statut !== null && statut >= 400)
			throw new Error(`le mode démo a répondu ${statut}`);
		const regleLaPlanche = Boolean(etat.vecteur ?? scenario.defaut);
		if (app) {
			// L'état est porté par l'adresse ; on dépense les MÊMES avances.
			if (regleLaPlanche) await avancer(page, AVANCE_ETAT_MS);
			if (etat.zone?.declencheur) await avancer(page, AVANCE_ETAT_MS);
		} else {
			if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
			else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
			if (etat.zone?.declencheur) {
				const d = etat.zone.declencheur;
				const cible =
					typeof d === 'string' ? page.locator(d).first() : page.locator(d.selecteur).nth(d.index);
				await cible.click();
				await page.evaluate(() => window.scrollTo(0, 0));
				await page.mouse.move(...POINTEUR_AU_REPOS);
				await avancer(page, AVANCE_ETAT_MS);
			}
			// PLAN §4.2 — la planche de revue n'est pas le produit. Elle porte les
			// commandes de droit elles-mêmes : la laisser ferait compter comme
			// actions les boutons radio qui règlent le droit.
			await retirerBlocsHorsProduit(page);
		}
		await ctx.reveler(page, ctx.declarationRevelation(vue), app ? 'application' : 'gel', {
			modaliteReference: etat.zone?.declencheur ? 'pointeur' : 'script'
		});
		if (perturbation && app) await perturbation(page);
		brut = await page.evaluate(SONDE, { selecteurAction: SELECTEUR_ACTION });
	} catch (e) {
		erreur = String(e?.message ?? e).slice(0, 220);
	} finally {
		await page.close().catch(() => {});
		await contexte.close().catch(() => {});
	}
	return { vue, etat: etat.cle, cote, statut, erreur, ...(brut ?? {}) };
}

/* LA REPRISE, ET L'ÉCART QU'ELLE CONTOURNE SANS LE MASQUER — piège P-14.
   `conditions.mjs` installe l'horloge puis la met en pause au MÊME instant :
   entre les deux appels le temps virtuel court, et sous charge parallèle
   Playwright refuse — « Cannot fast-forward to the past ». Le fichier est en
   écriture humaine seule ; la batterie rejoue, trois fois au plus, exactement
   comme la batterie 10 (ÉCART-039 É-1). La reprise ne fabrique pas de vert :
   un état qui échouerait encore reste un défaut d'instrument. */
async function avecReprise(travail, essais = 3) {
	let derniere = null;
	for (let n = 0; n < essais; n++) {
		try {
			return await travail();
		} catch (erreur) {
			derniere = erreur;
			if (!String(erreur?.message ?? erreur).includes('Cannot fast-forward to the past'))
				throw erreur;
			await new Promise((r) => setTimeout(r, 120 * (n + 1)));
		}
	}
	throw derniere;
}

/** Un pool de tâches à parallélisme borné — un contexte neuf par état. */
async function enParallele(taches, largeur, faire) {
	const out = new Array(taches.length);
	let i = 0;
	await Promise.all(
		Array.from({ length: Math.min(largeur, taches.length) }, async () => {
			for (;;) {
				const k = i++;
				if (k >= taches.length) return;
				out[k] = await faire(taches[k], k);
			}
		})
	);
	return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. EXÉCUTION ET RAPPORT
   ═════════════════════════════════════════════════════════════════════════ */

async function executer(args) {
	const t0 = Date.now();
	const option = (nom, defaut = null) => {
		const t = args.find((a) => a.startsWith(`--${nom}=`));
		return t ? t.slice(nom.length + 3) : defaut;
	};
	const demandees = args.filter((a) => /^V-\d\d$/.test(a));
	const enJson = args.includes('--json');
	const detail = args.includes('--detail');
	const base = option('base');
	const concurrence = Math.max(1, Number(option('concurrence', '6')));
	const nomSonde = option('sonde');
	const seuilBrut = option('seuil-gel');
	const seuilGel = seuilBrut === null ? null : Number(seuilBrut);
	if (seuilGel !== null && !Number.isInteger(seuilGel)) {
		console.error('batterie 7 — `--seuil-gel=` attend un entier.');
		process.exit(2);
	}
	if (nomSonde && !SONDES_CONNUES[nomSonde]) {
		console.error(
			`batterie 7 — sonde « ${nomSonde} » inconnue. Connues : ${Object.keys(SONDES_CONNUES).join(', ')}.`
		);
		process.exit(2);
	}
	const sonde = nomSonde ? SONDES_CONNUES[nomSonde] : null;
	const vues = sonde ? [sonde.vue] : demandees.length ? demandees : vuesDuDepot();

	/* ── LES AXES, ÉPROUVÉS AVANT TOUTE MESURE (P-5) ───────────────────────── */
	const epreuve = eprouverLesAxes(vuesDuDepot());
	if (epreuve.inertes.length) {
		console.error(
			`\nbatterie 7 — ${epreuve.inertes.length} axe(s) de droit déclaré(s) qu'AUCUN couple du` +
				` corpus n'exerce :\n    ${epreuve.inertes.join('\n    ')}\n` +
				'  Un axe inerte rend le même verdict qu’un axe qui marche : il est espéré, pas\n' +
				'  posé (CLAUDE.md §6 P-5). Refus, avant toute mesure.\n'
		);
		process.exit(2);
	}

	const { chromium } = await import('@playwright/test');
	const capture = await import('./banc/capture.mjs');
	const conditions = await import('./banc/conditions.mjs');
	const { servir } = await import('./banc/serveur.mjs');
	const { reveler } = await import('./banc/revelation.mjs');
	const { adresseDeLEtat, declarationRevelation, PREFIXE } = await import('./banc/mode-demo.mjs');

	const serveurGel = await servir(join(racine, 'mockups'));
	let serveurPortage;
	if (base) serveurPortage = { origine: base.replace(/\/$/, ''), fermer: async () => {} };
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
			console.error('batterie 7 — le serveur de développement n’a pas rendu d’adresse.');
			process.exit(2);
		}
		serveurPortage = { origine, fermer: () => vite.close() };
	}
	const essai = await fetch(`${serveurPortage.origine}${PREFIXE}/`).catch(() => null);
	if (!essai || !essai.ok) {
		console.error(
			`\nbatterie 7 — le mode démo ne répond pas sur ${serveurPortage.origine}${PREFIXE}/.\n` +
				'  Sans lui, le côté PORTAGE n’a aucun chemin (ÉCART-011 É-1), et la batterie\n' +
				'  ne mesurerait que le gel en croyant mesurer les deux.\n'
		);
		await serveurGel.fermer();
		await serveurPortage.fermer();
		process.exit(2);
	}

	const ctx = {
		capture,
		conditions,
		reveler,
		declarationRevelation,
		adresseDeLEtat,
		origineGel: serveurGel.origine,
		originePortage: serveurPortage.origine
	};

	/* ── Les tâches ─────────────────────────────────────────────────────────── */
	const couplesParVue = new Map(vues.map((v) => [v, couplesDeDroit(scenarioDe(v))]));
	const taches = [];
	for (const vue of vues) {
		const s = scenarioDe(vue);
		const etats = sonde ? s.etats.filter((e) => sonde.paire.includes(e.cle)) : s.etats;
		for (const etat of etats) {
			for (const cote of ['gel', 'portage']) {
				let perturbation = null;
				if (sonde && cote === 'portage') {
					const role = etat.cle === sonde.paire[1] ? 'restreint' : 'privilegie';
					perturbation = (page) => sonde.poser(page, role);
				}
				taches.push({ vue, scenario: s, etat, cote, perturbation });
			}
		}
	}

	console.log(
		'\n═══ pnpm test:droits — batterie 7, aucune action interdite dans le DOM ═══\n\n' +
			`  ${vues.length} vue(s) · ${taches.length / 2} état(s) déclaré(s) · deux côtés, même code\n` +
			`  gel : ${serveurGel.origine}   ·   application : ${serveurPortage.origine}${PREFIXE}/…\n` +
			`  axes de droit retenus : ${AXES_DE_DROIT.map((a) => a.axe).join(', ')}\n` +
			`  couples de droit du corpus : ${epreuve.parAxe.map((a) => `${a.axe} ×${a.couples}`).join(' · ')}\n` +
			`  parallélisme : ${concurrence} page(s)`
	);
	if (sonde) {
		console.log(
			`\n  ⚠ SONDE « ${nomSonde} » — ${sonde.quoi}.\n` +
				`    Le code retour est INVERSÉ : la batterie doit nommer « ${sonde.attendue} »\n` +
				'    en nature PORTAGE. Un banc toujours vert ne prouve rien (RA-01).'
		);
	}

	const navigateur = await chromium.launch();
	let releves;
	try {
		releves = await enParallele(taches, concurrence, (t) =>
			avecReprise(() =>
				releverEtat(navigateur, ctx, t.vue, t.scenario, t.etat, t.cote, t.perturbation)
			)
		);
	} finally {
		await navigateur.close();
		await serveurGel.fermer();
		await serveurPortage.fermer();
	}

	const index = new Map(releves.map((r) => [`${r.vue}|${r.etat}|${r.cote}`, r]));
	const echecs = releves.filter((r) => r.erreur);
	const lire = (vue, etat, cote) => index.get(`${vue}|${etat}|${cote}`) ?? null;

	/* ── LES ATTRIBUTS DE DROIT, DÉRIVÉS DU CORPUS ─────────────────────────── */
	const attributsDeDroit = new Set();
	for (const [vue, couples] of couplesParVue) {
		for (const c of couples) {
			const a = lire(vue, c.a, 'gel');
			const b = lire(vue, c.b, 'gel');
			if (!a?.attributs || !b?.attributs) continue;
			for (const n of attributsQuiChangent(a.attributs, b.attributs)) attributsDeDroit.add(n);
		}
	}
	const ATTRS = [...attributsDeDroit].sort();

	/* ── R-1 — LE DIFFÉRENTIEL ─────────────────────────────────────────────── */
	const lignes = [];
	let directions = 0;
	for (const [vue, couples] of couplesParVue) {
		for (const c of couples) {
			for (const [ref, restreint] of [
				[c.a, c.b],
				[c.b, c.a]
			]) {
				const gA = lire(vue, ref, 'gel');
				const gB = lire(vue, restreint, 'gel');
				const pA = lire(vue, ref, 'portage');
				const pB = lire(vue, restreint, 'portage');
				if (!gA?.actions || !gB?.actions || !pA?.actions || !pB?.actions) continue;
				directions++;
				const sortsGel = new Map();
				for (const { a, b } of apparier(gA.actions, gB.actions)) {
					const k = sortsGel.get(a.sig) ?? [];
					k.push({ a, b, sort: sortDeLAction(a, b) });
					sortsGel.set(a.sig, k);
				}
				const sortsPortage = new Map();
				for (const { a, b } of apparier(pA.actions, pB.actions)) {
					const k = sortsPortage.get(a.sig) ?? [];
					k.push({ a, b, sort: sortDeLAction(a, b) });
					sortsPortage.set(a.sig, k);
				}
				const sigs = new Set([...sortsGel.keys(), ...sortsPortage.keys()]);
				for (const sig of sigs) {
					const g = sortsGel.get(sig) ?? [];
					const p = sortsPortage.get(sig) ?? [];
					const n = Math.max(g.length, p.length);
					for (let i = 0; i < n; i++) {
						/* Pas de contrepartie de ce côté-ci : le nœud n'y existe pas. Ce
						   n'est PAS « hors état » — voir `sortDeLAction`. */
						const sg = g[i]?.sort ?? 'inexistant';
						const sp = p[i]?.sort ?? 'inexistant';
						const verdict = natureDuCouple(sg, sp);
						if (!verdict) continue;
						lignes.push({
							vue,
							axe: c.axe,
							couple: `${ref} → ${restreint}`,
							sig,
							rang: i,
							gel: sg,
							portage: sp,
							classes: (g[i]?.a ?? p[i]?.a)?.classes ?? '',
							...verdict,
							occurrences: 1
						});
					}
				}
			}
		}
	}

	/* Le même nœud paraît dans plusieurs couples — `V-07` en déclare cinq sur
	   quatre états. Le compte OPPOSABLE est celui des actions DISTINCTES ; le
	   compte d'occurrences est donné à côté, parce qu'il dit combien de fois le
	   corpus exerce la règle. */
	const distinctes = new Map();
	for (const l of lignes) {
		const k = `${l.vue}|${l.sig}|${l.rang}|${l.regle}`;
		const e = distinctes.get(k) ?? { ...l, occurrences: 0, couples: new Set() };
		e.occurrences++;
		e.couples.add(`${l.axe}:${l.couple}`);
		distinctes.set(k, e);
	}
	const distinctesListe = [...distinctes.values()];
	const totalDistinct = agreger(distinctesListe.map((d) => ({ ...d, occurrences: 1 })));
	const totalOccurrences = agreger(lignes);

	/* ── R-2 — LA GOUVERNANCE PAR RÈGLE DE DROIT, SUR TOUT LE CORPUS ───────── */
	const r2 = new Map();
	const reglesDeDroit = new Set();
	for (const r of releves) {
		if (!r.actions) continue;
		const g = gouverneesParUnDroit(r, ATTRS);
		for (const s of g.regles) reglesDeDroit.add(s);
		const e =
			r2.get(r.vue) ??
			r2
				.set(r.vue, {
					vue: r.vue,
					gel: new Set(),
					portage: new Set(),
					masqueesGel: new Set(),
					masqueesPortage: new Set()
				})
				.get(r.vue);
		for (const s of [...g.masquees, ...g.visibles]) e[r.cote].add(s);
		for (const s of g.masquees) e[r.cote === 'gel' ? 'masqueesGel' : 'masqueesPortage'].add(s);
	}
	const r2Liste = [...r2.values()].filter((e) => e.gel.size || e.portage.size);

	/* ── R-3 — LES INERTES HORS DROIT : le constat, jamais opposé ──────────── */
	const inertesHorsDroit = new Map();
	for (const r of releves) {
		if (!r.actions) continue;
		const gouvernees = new Set([
			...gouverneesParUnDroit(r, ATTRS).masquees,
			...gouverneesParUnDroit(r, ATTRS).visibles
		]);
		for (const a of r.actions) {
			if (!a.rend || !a.inerte || gouvernees.has(a.sig)) continue;
			const k = `${r.vue}|${a.sig}|${a.classes}`;
			const e =
				inertesHorsDroit.get(k) ??
				inertesHorsDroit
					.set(k, {
						vue: r.vue,
						sig: a.sig,
						classes: a.classes,
						causes: new Set(),
						cotes: new Set(),
						etats: new Set()
					})
					.get(k);
			e.cotes.add(r.cote);
			e.causes.add(a.cause);
			e.etats.add(r.etat);
		}
	}
	const inertesListe = [...inertesHorsDroit.values()].sort(
		(a, b) => a.vue.localeCompare(b.vue) || a.sig.localeCompare(b.sig)
	);

	/* ── C-1 — LES DROITS HÉRITÉS DE V-40 ──────────────────────────────────── */
	const heritage = {
		gel: { oui: 0, non: 0, actionsOui: 0, actionsNon: 0 },
		portage: { oui: 0, non: 0, actionsOui: 0, actionsNon: 0 }
	};
	for (const r of releves) {
		if (!r.heritage) continue;
		const h = heritage[r.cote];
		h.oui += r.heritage.oui.rangees;
		h.non += r.heritage.non.rangees;
		h.actionsOui += r.heritage.oui.actions;
		h.actionsNon += r.heritage.non.actions;
	}

	if (enJson) {
		console.log(
			JSON.stringify(
				{
					attributs_de_droit: ATTRS,
					regles_de_droit: [...reglesDeDroit],
					r1: distinctesListe.map((d) => ({ ...d, couples: [...d.couples] })),
					r2: r2Liste.map((e) => ({
						vue: e.vue,
						gel: e.gel.size,
						portage: e.portage.size,
						masquees_gel: e.masqueesGel.size,
						masquees_portage: e.masqueesPortage.size
					})),
					r3: inertesListe.map((e) => ({
						vue: e.vue,
						sig: e.sig,
						classes: e.classes,
						causes: [...e.causes],
						cotes: [...e.cotes],
						etats: e.etats.size
					})),
					heritage,
					echecs: echecs.map((e) => ({ vue: e.vue, etat: e.etat, cote: e.cote, erreur: e.erreur }))
				},
				null,
				'\t'
			)
		);
		process.exit(0);
	}
	await rapporter({
		t0,
		fenetre: conditions.FENETRE_PRINCIPALE,
		vues,
		taches,
		releves,
		echecs,
		ATTRS,
		reglesDeDroit,
		epreuve,
		couplesParVue,
		directions,
		lignes,
		distinctesListe,
		totalDistinct,
		totalOccurrences,
		r2Liste,
		inertesListe,
		heritage,
		detail,
		seuilGel,
		sonde,
		nomSonde
	});
}

async function rapporter(x) {
	const {
		t0,
		fenetre,
		vues,
		taches,
		releves,
		echecs,
		ATTRS,
		reglesDeDroit,
		epreuve,
		couplesParVue,
		directions,
		lignes,
		distinctesListe,
		totalDistinct,
		totalOccurrences,
		r2Liste,
		inertesListe,
		heritage,
		detail,
		seuilGel,
		sonde,
		nomSonde
	} = x;

	/* ── Ce que la mesure a réellement emprunté ────────────────────────────── */
	console.log(
		`\n─── Les termes, tels que CETTE batterie les définit ───\n\n` +
			`  action            ${SELECTEUR_ACTION.split(', ').length} formes interactives ; un conteneur n’en est pas une,\n` +
			`                    ses descendants sont comptés un par un\n` +
			`  inertie           ${MARQUEURS_INERTES.map((m) => m.marque).join(' · ')}\n` +
			`  axe de droit      ${AXES_DE_DROIT.map((a) => a.axe).join(', ')} — éprouvés : ` +
			`${epreuve.parAxe.map((a) => `${a.axe} ×${a.couples}`).join(' · ')}\n` +
			`  attribut de droit DÉRIVÉ du corpus, jamais écrit : ${ATTRS.join(' · ') || '(aucun)'}\n` +
			`  règle de droit    ${reglesDeDroit.size} règle(s) CSS de visibilité ou d’inertie citant l’un d’eux :\n` +
			[...reglesDeDroit]
				.sort()
				.map((r) => `                    ${r}`)
				.join('\n') +
			`\n  attributs dérivés sans effet (aucune règle ne les cite) : ` +
			`${ATTRS.filter((a) => ![...reglesDeDroit].some((r) => r.includes(a))).join(' · ') || 'aucun'}`
	);

	/* ── R-1 ───────────────────────────────────────────────────────────────── */
	const parRegle = new Map();
	for (const d of distinctesListe) {
		const e = parRegle.get(d.regle) ?? {
			regle: d.regle,
			nature: d.nature,
			quoi: d.quoi,
			n: 0,
			occ: 0,
			vues: new Set()
		};
		e.n++;
		e.occ += d.occurrences;
		e.vues.add(d.vue);
		parRegle.set(d.regle, e);
	}
	const rangees = [...parRegle.values()].sort((a, b) => b.n - a.n);

	console.log(
		`\n─── R-1 · le différentiel — ${directions} direction(s) de couple sur ` +
			`${[...couplesParVue.values()].reduce((n, c) => n + c.length, 0)} couple(s), ` +
			`${[...couplesParVue.values()].filter((c) => c.length).length} vue(s) ───\n`
	);
	console.log(
		`    PORTAGE            ${String(totalDistinct.portage).padStart(5)}  — le code livré ; corrigeable par le lot de la vue\n` +
			`    GEL                ${String(totalDistinct.gel).padStart(5)}  — la maquette ; demande un REGEL arbitré\n` +
			`    constat            ${String(totalDistinct.constat).padStart(5)}  — divergence de rendu, jamais opposée\n` +
			`    constat favorable  ${String(totalDistinct['constat-favorable']).padStart(5)}  — l’application tient P-09 là où la maquette ne le tient pas\n` +
			`    ─────────────────────────\n` +
			`    actions distinctes ${String(distinctesListe.length).padStart(5)}  · ${lignes.length} occurrence(s) « action × direction »`
	);
	if (rangees.length) {
		console.log('');
		for (const r of rangees) {
			console.log(
				`    ${String(r.n).padStart(5)} actions  ${r.regle.padEnd(46)} ${r.nature.padEnd(18)} ` +
					`${r.vues.size} vue(s), ${r.occ} occurrence(s)`
			);
		}
		console.log('');
		for (const r of rangees) console.log(`    ${r.regle}\n      ${r.quoi}`);
	}

	if (detail && distinctesListe.length) {
		console.log('\n    Le détail, action par action :');
		for (const d of [...distinctesListe].sort((a, b) => a.vue.localeCompare(b.vue))) {
			console.log(
				`      ${d.vue}  ${d.nature.padEnd(18)} ${d.regle.padEnd(40)} gel=${d.gel} portage=${d.portage}\n` +
					`             ${d.sig.slice(0, 100)}${d.classes ? `   [${d.classes}]` : ''}`
			);
		}
	} else if (distinctesListe.length) {
		const parVue = new Map();
		for (const d of distinctesListe) {
			const e = parVue.get(d.vue) ?? { portage: 0, gel: 0, constat: 0, 'constat-favorable': 0 };
			e[d.nature]++;
			parVue.set(d.vue, e);
		}
		console.log('\n    Par vue — portage / gel / constat / constat favorable :');
		for (const [vue, e] of [...parVue].sort()) {
			console.log(
				`      ${vue}   ${String(e.portage).padStart(4)} ${String(e.gel).padStart(5)} ` +
					`${String(e.constat).padStart(8)} ${String(e['constat-favorable']).padStart(9)}`
			);
		}
		console.log('    (`--detail` nomme chaque action.)');
	}

	/* ── R-2 ───────────────────────────────────────────────────────────────── */
	const r2Gel = r2Liste.reduce((n, e) => n + e.gel.size, 0);
	const r2Portage = r2Liste.reduce((n, e) => n + e.portage.size, 0);
	const r2MasqGel = r2Liste.reduce((n, e) => n + e.masqueesGel.size, 0);
	const r2MasqPortage = r2Liste.reduce((n, e) => n + e.masqueesPortage.size, 0);
	console.log(
		`\n─── R-2 · la règle CSS — le crible large, ${r2Liste.length} vue(s) concernée(s) sur ${vues.length} ───\n\n` +
			`    Une action GOUVERNÉE par une règle de droit est une action que le corpus se\n` +
			`    réserve de masquer. Elle n’est un défaut de P-09 que dans l’état où le droit\n` +
			`    tombe — mais sa seule présence dit que le mécanisme retenu est le MASQUAGE,\n` +
			`    là où DESIGN §2.A A-7 écrit « l’élément est absent du DOM ».\n\n` +
			`      actions gouvernées, côté gel      ${String(r2Gel).padStart(5)}   dont ${r2MasqGel} effectivement masquées dans un état déclaré\n` +
			`      actions gouvernées, côté portage  ${String(r2Portage).padStart(5)}   dont ${r2MasqPortage} effectivement masquées dans un état déclaré`
	);
	console.log('\n      vue     gel  portage   (masquées : gel / portage)');
	for (const e of [...r2Liste].sort((a, b) => a.vue.localeCompare(b.vue))) {
		console.log(
			`      ${e.vue}  ${String(e.gel.size).padStart(4)}  ${String(e.portage.size).padStart(7)}   ` +
				`${String(e.masqueesGel.size).padStart(9)} / ${e.masqueesPortage.size}`
		);
	}

	/* ── R-3 ───────────────────────────────────────────────────────────────── */
	console.log(
		`\n─── R-3 · les actions INERTES qu’aucun droit ne gouverne — ${inertesListe.length}, en constat ───\n\n` +
			`    P-09 dit « ni grisée » sans qualifier l’interdiction ; RG-M05-08, qui le\n` +
			`    porte, ne parle que des ACTIONS D’ÉCRITURE et de leur DROIT. Les actions\n` +
			`    ci-dessous sont visibles et refusent le geste, sans qu’aucun droit n’y soit\n` +
			`    pour rien : validité de saisie, état courant de l’objet, démonstration de\n` +
			`    composant. Les compter en défaut serait combler un vide de spécification ;\n` +
			`    les taire serait inventer une couverture. Elles sont donc COMPTÉES, NOMMÉES,\n` +
			`    et remontées comme demande d’arbitrage.`
	);
	/* LA TENSION V-40 / P-09, LA VRAIE — ET ELLE N'EST PAS CELLE QU'ON CROYAIT.
	   Le brief V-40 EXIGE, pour la suppression d'un dossier et d'un domaine,
	   « saisie du nom exact exigée · bouton INACTIF tant que la saisie ne
	   correspond pas ». C'est, à la lettre, une action affichée et refusée —
	   ce que P-09 interdit. La contradiction est entre DEUX SOURCES, pas entre
	   une source et le code : l'ordre de préséance donne la maquette gagnante,
	   mais la trancher n'appartient pas à un instrument. Elle est donc chiffrée
	   ici et remontée. */
	const inertesV40 = inertesListe.filter((e) => e.vue === 'V-40').length;
	if (inertesV40) {
		console.log(
			`\n    DONT ${inertesV40} DANS V-40, ET C'EST LÀ LA VRAIE TENSION AVEC P-09 : le brief\n` +
				`    V-40 EXIGE « saisie du nom exact exigée · BOUTON INACTIF tant que la saisie ne\n` +
				`    correspond pas ». Un bouton inactif est, à la lettre de P-09, « une action\n` +
				`    interdite affichée, grisée ». Deux SOURCES se contredisent — pas une source\n` +
				`    et le code. L'ordre de préséance donne la maquette gagnante ; le dire n'est\n` +
				`    pas le rôle d'un instrument. ARBITRAGE DEMANDÉ.`
		);
	}
	const parCause = new Map();
	for (const e of inertesListe)
		for (const c of e.causes) parCause.set(c, (parCause.get(c) ?? 0) + 1);
	if (inertesListe.length) {
		console.log(
			`\n      par CAUSE : ` +
				[...parCause]
					.sort((a, b) => b[1] - a[1])
					.map(([c, n]) => `${c} ×${n}`)
					.join(' · ')
		);
		console.log('');
		for (const e of inertesListe.slice(0, detail ? 500 : 24)) {
			console.log(
				`      ${e.vue}  ${[...e.causes].sort().join('+').padEnd(20)} ${e.etats.size} état(s)  ` +
					`${e.sig.slice(0, 52).padEnd(52)}${e.classes ? ` [${e.classes.slice(0, 34)}]` : ''}`
			);
		}
		if (!detail && inertesListe.length > 24)
			console.log(`      … ${inertesListe.length - 24} de plus (\`--detail\`)`);
	}

	/* ── C-1 ───────────────────────────────────────────────────────────────── */
	console.log(
		`\n─── C-1 · les droits HÉRITÉS, et la tension V-40 / P-09 — mesurée, pas appréciée ───\n\n` +
			`    Le brief V-40 exige « droits hérités affichés en GRISÉ avec leur origine ».\n` +
			`    P-09 interdit d’afficher une action interdite, grisée comprise. La question\n` +
			`    n’est donc pas « la rangée est-elle grisée » — un droit affiché est de\n` +
			`    l’INFORMATION, et la console des droits existe pour la montrer — mais\n` +
			`    « la rangée porte-t-elle une ACTION que l’utilisateur ne peut pas accomplir ».\n\n` +
			`      rangées de droit HÉRITÉ   gel ${heritage.gel.oui} · portage ${heritage.portage.oui}\n` +
			`        actions qu’elles portent  gel ${heritage.gel.actionsOui} · portage ${heritage.portage.actionsOui}\n` +
			`      rangées de droit EXPLICITE gel ${heritage.gel.non} · portage ${heritage.portage.non}\n` +
			`        actions qu’elles portent  gel ${heritage.gel.actionsNon} · portage ${heritage.portage.actionsNon}`
	);
	const tenu =
		heritage.gel.actionsOui === 0 && heritage.portage.actionsOui === 0 && heritage.gel.oui > 0;
	console.log(
		tenu
			? `\n    LA TENSION N’EN EST PAS UNE, ET C’EST MESURÉ : une rangée héritée ne porte\n` +
					`    AUCUNE action, une rangée explicite en porte une — le retrait. Le gel tient\n` +
					`    donc P-09 exactement là où on le croyait en défaut : il ne grise pas un\n` +
					`    bouton, il n’en met pas. Ce qui est grisé est le TEXTE du droit, qui n’est\n` +
					`    pas une action. Aucun arbitrage n’est requis sur ce point.`
			: `\n    ⚠ Une rangée de droit hérité porte ${heritage.gel.actionsOui + heritage.portage.actionsOui} action(s), ou aucune rangée n’a été\n` +
					`    rencontrée (${heritage.gel.oui} au gel). Dans le premier cas la tension V-40 / P-09 est RÉELLE\n` +
					`    et demande un arbitrage ; dans le second, ce contrôle n’a rien exercé et ne\n` +
					`    prouve rien (P-5).`
	);

	/* ── Ce que la batterie NE COUVRE PAS ──────────────────────────────────── */
	const toutesVues = vuesDuDepot();
	const sansCouple = toutesVues.filter((v) => couplesDeDroit(scenarioDe(v)).length === 0);
	const couplesTotaux = vues.reduce((n, v) => {
		const s = scenarioDe(v);
		return n + s.etats.length * s.fenetres.length;
	}, 0);
	const mesures = taches.length / 2;
	const aDeclencheur = vues.reduce(
		(n, v) => n + scenarioDe(v).etats.filter((e) => e.zone?.declencheur).length,
		0
	);
	const feuillesRefusees = releves.reduce((n, r) => n + (r.feuillesRefusees ?? 0), 0);
	const sujetsRefuses = releves.reduce((n, r) => n + (r.sujetsRefuses ?? 0), 0);
	const etatsAxesEcartes = new Map(AXES_ECARTES.map((a) => [a.axe, 0]));
	for (const v of toutesVues)
		for (const e of scenarioDe(v).etats)
			for (const a of AXES_ECARTES)
				if (e.vecteur && a.axe in e.vecteur)
					etatsAxesEcartes.set(a.axe, etatsAxesEcartes.get(a.axe) + 1);

	console.log(
		`\n─── Ce que cette batterie NE COUVRE PAS — mesuré, jamais recopié (ARB-023) ───\n\n` +
			`    · LA MOITIÉ COMPORTEMENTALE DE P-09. « Ni refusée APRÈS LE CLIC » ne se\n` +
			`      constate pas sur un rendu : il faudrait cliquer et observer un refus. Les\n` +
			`      vues de phase 1 rendent l’état et jamais la transition (ARB-011) ; il n’y a\n` +
			`      rien à cliquer. Cette batterie ne prouve QUE l’absence au DOM.\n` +
			`    · LA RÉSOLUTION DES DROITS. RG-DRO-01 à 05 — le plus spécifique gagne,\n` +
			`      fermeture par défaut, contournement administrateur, héritage de racine —\n` +
			`      se prouvent sur des DONNÉES, pas sur un DOM. Le mode démo sert un jeu de\n` +
			`      semence fixe ; aucun droit n’y est résolu. Batteries 3 et 6.\n` +
			`    · ${couplesTotaux - mesures} couple(s) sur ${couplesTotaux} : seule la fenêtre ${fenetre} est mesurée.\n` +
			`      L’absence au DOM n’est pas une propriété de largeur ; RG-M18-13 a sa propre\n` +
			`      couverture, aux quatre fenêtres, dans \`pnpm verif:maquette\`.\n` +
			`    · ${aDeclencheur} état(s) à déclencheur : le geste est joué du côté GEL, jamais du côté\n` +
			`      PORTAGE, qui rend l’état et jamais la transition (ARB-011).\n` +
			`    · ${sansCouple.length} vue(s) sur ${toutesVues.length} n’ont AUCUN couple de droit — R-1 ne les atteint pas,\n` +
			`      R-2 seul les voit. Une action interdite qu’aucun état déclaré n’exerce est\n` +
			`      invisible au différentiel, par construction :\n      ${sansCouple.join(' ')}\n` +
			`    · ${AXES_ECARTES.length} axe(s) que la batterie n’appelle PAS un droit, et ce qu’ils portent :\n` +
			AXES_ECARTES.map(
				(a) => `      · ${a.axe} — ${etatsAxesEcartes.get(a.axe)} état(s) du corpus — ${a.motif}`
			).join('\n') +
			`\n    · ${feuillesRefusees} feuille(s) de style dont les règles n’ont pas pu être lues (origine\n` +
			`      croisée) et ${sujetsRefuses} sujet(s) de sélecteur non interrogeable(s). R-2 ne voit pas ce\n` +
			`      qui s’y trouve ; le dire est le seul moyen de ne pas le compter comme couvert.\n` +
			`    · les actions qui n’existent dans AUCUN état déclaré. Le corpus ne montre que\n` +
			`      ce que ses planches montrent : une action réservée jamais maquettée n’a ni\n` +
			`      état privilégié ni état restreint, donc aucun différentiel.`
	);

	/* ── Sortie ────────────────────────────────────────────────────────────── */
	mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
	writeFileSync(
		join(DOSSIER_RAPPORTS, 'droits.json'),
		JSON.stringify(
			{
				mesure_du: new Date().toISOString(),
				duree_s: Number(((Date.now() - t0) / 1000).toFixed(1)),
				vues: vues.length,
				etats: mesures,
				attributs_de_droit: ATTRS,
				regles_de_droit: [...reglesDeDroit],
				total_distinct: totalDistinct,
				total_occurrences: totalOccurrences,
				r1: distinctesListe.map((d) => ({
					vue: d.vue,
					axe: d.axe,
					regle: d.regle,
					nature: d.nature,
					gel: d.gel,
					portage: d.portage,
					sig: d.sig,
					classes: d.classes,
					couples: [...d.couples]
				})),
				r2: r2Liste.map((e) => ({
					vue: e.vue,
					gouvernees_gel: e.gel.size,
					gouvernees_portage: e.portage.size,
					masquees_gel: e.masqueesGel.size,
					masquees_portage: e.masqueesPortage.size
				})),
				r3: inertesListe.map((e) => ({
					vue: e.vue,
					sig: e.sig,
					classes: e.classes,
					causes: [...e.causes],
					cotes: [...e.cotes]
				})),
				heritage,
				echecs: echecs.map((e) => ({ vue: e.vue, etat: e.etat, cote: e.cote, erreur: e.erreur }))
			},
			null,
			'\t'
		) + '\n'
	);
	const seuilLu = existsSync(SEUIL) ? JSON.parse(readFileSync(SEUIL, 'utf8')) : null;
	writeFileSync(
		join(DOSSIER_RAPPORTS, 'droits-seuil-propose.json'),
		JSON.stringify(
			{
				_: [
					'SEUIL DE DÉPART PROPOSÉ par `pnpm test:droits` — NON ARBITRÉ.',
					'',
					'Ce fichier est une PROPOSITION écrite dans verif/rapports/, qui est volatile.',
					'Il ne devient opposable que si un humain le recopie en',
					'verif/references/droits-seuil.json — écriture humaine seule, au même titre',
					'que les tolérances, les masques et les zones comparées.',
					'Un seuil que la mesure se donne à elle-même ne mesure rien (PLAN §12, RA-01).',
					'',
					'Le seuil ne porte QUE la nature « gel ». Les lignes « portage » ne sont',
					'jamais admissibles : elles sont corrigeables par le lot de la vue.'
				],
				mesure_du: new Date().toISOString(),
				gel: totalDistinct.gel,
				portage: totalDistinct.portage
			},
			null,
			'\t'
		) + '\n'
	);
	console.log(`\n  Rapport : verif/rapports/droits.json`);
	console.log(`  Seuil proposé : verif/rapports/droits-seuil-propose.json`);

	const duree = ((Date.now() - t0) / 1000).toFixed(0);

	if (sonde) {
		const trouve = distinctesListe.filter(
			(d) => d.regle === sonde.attendue && d.nature === 'portage'
		);
		console.log(`\n─── SONDE « ${nomSonde} » ───\n`);
		if (trouve.length) {
			console.log(
				`  ✔ la batterie a nommé « ${sonde.attendue} » en nature PORTAGE, ${trouve.length} action(s).\n` +
					`    Elle sait dire non, et elle sait dire d’où ça vient.  ${duree} s\n`
			);
			process.exit(0);
		}
		console.error(
			`  ✘ la batterie N’A PAS nommé « ${sonde.attendue} » en nature portage.\n` +
				'    Une batterie qui ne sait pas dire non ne prouve rien de ses verts (RA-01).\n'
		);
		process.exit(1);
	}

	if (echecs.length) {
		console.error(
			`\n  ${echecs.length} relevé(s) en échec — rien ne peut être conclu de leur silence :`
		);
		for (const e of echecs.slice(0, 30))
			console.error(`    ${e.vue} ${e.etat} [${e.cote}] ${e.erreur}`);
		console.error(`\n✘ batterie 7 — défaut d’INSTRUMENT.  ${duree} s\n`);
		process.exit(2);
	}

	const gel = totalDistinct.gel;
	const portage = totalDistinct.portage;
	const seuil = seuilGel ?? seuilLu?.gel ?? null;
	const gelHorsSeuil = seuil === null ? gel > 0 : gel > seuil;

	if (seuil === null && gel > 0) {
		console.log(
			`\n  LE DÉPÔT NE PEUT PAS PASSER AU VERT, ET LA CAUSE N’EST PAS LE PORTAGE.\n` +
				`    Le mécanisme retenu par le gel pour « sans droit » est le MASQUAGE :\n` +
				`    ${reglesDeDroit.size} règle(s) de droit posent \`display: none\` ou son contraire, dont deux au\n` +
				`    socle (\`socle.css:396–397\`). P-09 exige l’ABSENCE, et \`docs/DESIGN.md\` §2.A A-7 l’écrit\n` +
				`    noir sur blanc : « l’élément est absent du DOM ». Les ${gel} actions ci-dessus\n` +
				`    sont dans le DOM d’un utilisateur qui n’y a pas droit, DES DEUX CÔTÉS.\n\n` +
				`    ET CE « GEL »-LÀ N’EST PAS UNE IMPASSE, CONTRAIREMENT AUX AUTRES. Un nœud\n` +
				`    en \`display: none\` ne pèse ni dans l’instantané ARIA, ni dans l’ordre de\n` +
				`    tabulation, ni dans un pixel : le RETIRER ne fait donc pas diverger la vue\n` +
				`    de sa maquette. Mesuré, pas supposé — les trois actions propres de V-11\n` +
				`    rendues conditionnellement passent de « gel » à « constat favorable », et\n` +
				`    \`node verif/maquette.mjs V-11 --contre=app\` reste à 8 couples conformes,\n` +
				`    0 écart. Le masquage est le seul mécanisme dont une MAQUETTE dispose — elle\n` +
				`    n’a pas de serveur ; l’application, elle, en a un. Le regel n’est donc pas\n` +
				`    la seule issue : une campagne de portage la referme, sans arbitrage de gel.\n` +
				`    La nature reste « gel » parce que la règle des deux côtés le dit ; ce\n` +
				`    paragraphe dit ce que la règle, seule, ne dirait pas.\n\n` +
				`    SEUIL DE DÉPART PROPOSÉ : ${gel}. Il n’est pas écrit dans cet instrument —\n` +
				`    un seuil que la mesure se donne à elle-même ne mesure rien. Une fois\n` +
				`    arbitré : \`pnpm test:droits --seuil-gel=${gel}\`, ou ${SEUIL.replace(racine + '/', '')}.\n` +
				`    Tant qu’il ne l’est pas, ce ROUGE est le verdict, et il est le bon.`
		);
	} else if (seuil !== null && gel < seuil) {
		console.log(
			`\n  SEUIL PÉRIMÉ — arbitré à ${seuil}, mesuré à ${gel}. Le gel a gagné ${seuil - gel} action(s) :\n` +
				'    le seuil doit être redescendu, sans quoi il absoudrait par avance une\n' +
				'    régression future. Ce n’est pas un rouge ; c’est une dette d’arbitrage.'
		);
	}

	const vert = portage === 0 && !gelHorsSeuil;
	console.log(
		`\n  ${vert ? '✔ VERT' : '✘ ROUGE'} — ${portage} action(s) de PORTAGE · ${gel} action(s) de GEL` +
			(seuil === null ? ' (aucun seuil arbitré)' : ` (seuil arbitré : ${seuil})`) +
			` · ${totalDistinct.constat} constat(s) · ${totalDistinct['constat-favorable']} constat(s) favorable(s)` +
			` · ${inertesListe.length} inerte(s) hors droit.  ${duree} s\n`
	);
	process.exit(vert ? 0 : 1);
}

/* Le point d'entrée n'est exécuté que si le module est lancé directement :
   `verif/droits.test.ts` importe les fonctions pures sans démarrer de
   navigateur ni de serveur. */
if (process.argv[1] && /droits\.mjs$/.test(process.argv[1])) {
	await executer(process.argv.slice(2));
}
