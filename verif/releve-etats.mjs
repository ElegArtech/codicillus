#!/usr/bin/env node
/**
 * releve-etats — ce que chaque état déclaré met à l'écran, mesuré.
 *
 * INSTRUMENT DE LECTURE, écrit par le lot T-100. Il ne rend aucun verdict, ne
 * sort jamais en 1, n'est branché sur aucune chaîne, et ne touche à rien : il
 * ouvre les 41 maquettes gelées dans les conditions de capture du banc, règle
 * chaque état comme le banc le règle, et RELÈVE ce qu'il trouve.
 *
 * POURQUOI IL EXISTE. « Ce qui exigera un traitement particulier » — dialogue
 * modal, focalisation à l'ouverture, notification visible, animation en cours,
 * superposition — n'est PAS lisible dans le balisage : ce sont des propriétés
 * du DOM APRÈS que le script de la maquette a réglé la planche. Trois lots
 * s'en sont aperçus au pixel près, après coup :
 *
 *   • `ECART-014` É-3 — le clic ne se livre pas par script : 33 % de pixels
 *     divergents sur un dialogue, découverts à l'étalonnage ;
 *   • `ECART-017` É-3 — le pointeur au repos, cinq boîtes sur dix en `:hover` ;
 *   • `ECART-020` É-1 — la focalisation à l'ouverture, quatre états de V-40 en
 *     écart, dont trois par un anneau de focus.
 *
 * Chacun a été trouvé sur la vue du moment. Ce script pose la question aux
 * 265 états d'un coup.
 *
 * IL EMPRUNTE LE CHEMIN DU BANC, ET RIEN D'AUTRE : `verif/banc/serveur.mjs`,
 * `ouvrirPage`, `reglerPlanche`, les conditions de `conditions.mjs`. Un relevé
 * pris dans d'autres conditions dirait autre chose que ce que le banc mesure —
 * et ce serait un troisième dispositif à réconcilier, pas un instrument.
 *
 * CE QU'IL N'ÉPROUVE PAS, et il faut le dire (RA-01, `protocole-app.json`) :
 *   • il ne mesure RIEN de l'application — aucune vue n'est implémentée ;
 *   • il ne joue PAS les déclencheurs des états de zone (V-40 et les onze
 *     états à déclencheur) : il relève l'état de la page réglée, pas celui
 *     obtenu après le geste du banc. La colonne `declencheur` du relevé de
 *     `verif/scenarios/` reste la source pour ceux-là ;
 *   • il ne capture aucun pixel et ne compare rien.
 *
 * COMMANDES
 *   node verif/releve-etats.mjs                 les 41 vues
 *   node verif/releve-etats.mjs V-27 V-32       une sélection
 *   node verif/releve-etats.mjs --json          le relevé exploitable
 *   node verif/releve-etats.mjs --particuliers  seulement ce qui sort de l'ordinaire
 *   node verif/releve-etats.mjs --incidence     ce que coûterait, MESURÉ, chaque
 *                                               nœud que le gabarit ne sait pas placer
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { servir } from './banc/serveur.mjs';
import { ouvrirPage, reglerPlanche } from './banc/capture.mjs';
import { FENETRE_PRINCIPALE } from './banc/conditions.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS = join(RACINE, 'verif', 'scenarios');

/** Ce que l'on relève sur la page, une fois l'état réglé. */
const SONDE = () => {
	const desc = (n) => {
		if (!n) return null;
		const c = n.getAttribute?.('class');
		return (
			n.tagName.toLowerCase() +
			(n.id ? '#' + n.id : '') +
			(c ? '.' + c.trim().split(/\s+/).join('.') : '')
		);
	};
	const visible = (n) => {
		const s = getComputedStyle(n);
		if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	const dialogues = [...document.querySelectorAll('dialog[open]')].map((d) => ({
		element: desc(d),
		modal: d.matches(':modal')
	}));
	const notifs = [...document.querySelectorAll('#notifs > *')].map(desc);
	const anim = [...document.querySelectorAll('*')]
		.filter((n) => {
			const a = getComputedStyle(n).animationName;
			return a && a !== 'none';
		})
		.map((n) => getComputedStyle(n).animationName);
	const actif =
		document.activeElement && document.activeElement !== document.body
			? desc(document.activeElement)
			: null;
	const superpositions = [
		...document.querySelectorAll(
			'aside, .voile, .tiroir, .tiroir-form, .commandes, .liens-auto, .menu-ctx'
		)
	]
		.filter((n) => !n.classList.contains('rail') && visible(n))
		.map(desc);
	return {
		dialogues,
		notifs,
		animations: [...new Set(anim)],
		actif,
		superpositions,
		debordement: document.documentElement.scrollWidth > document.documentElement.clientWidth,
		hauteur: document.documentElement.scrollHeight,
		mainClasse: document.querySelector('main')?.getAttribute('class') ?? null,
		mainId: document.querySelector('main')?.getAttribute('id') ?? null,
		appAttributs: (() => {
			const a = document.getElementById('app');
			if (!a) return null;
			return [...a.attributes].map((x) => `${x.name}="${x.value}"`);
		})(),
		zonesVides: document.querySelectorAll('.zone-etat, .vide').length,
		esquisses: document.querySelectorAll('.esquisse, [class^="sq"], [class*=" sq"]').length,
		rouets: document.querySelectorAll('.rouet, .noeud__rouet, .notif__rouet').length
	};
};

async function relever(vues) {
	const { origine, fermer } = await servir(join(RACINE, 'mockups'));
	const navigateur = await chromium.launch();
	const out = [];
	try {
		for (const vue of vues) {
			const s = JSON.parse(readFileSync(join(SCENARIOS, `${vue}.json`), 'utf8'));
			const fichier = s.maquette.replace(/^mockups\//, '');
			for (const etat of s.etats) {
				const { page, contexte } = await ouvrirPage(
					navigateur,
					`${origine}/${fichier}`,
					FENETRE_PRINCIPALE
				);
				let sonde = null;
				let erreur = null;
				try {
					if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
					sonde = await page.evaluate(SONDE);
				} catch (e) {
					erreur = String(e.message ?? e).slice(0, 200);
				}
				await contexte.close();
				out.push({ vue, etat: etat.cle, zone: etat.zone ?? null, erreur, ...sonde });
			}
		}
	} finally {
		await navigateur.close();
		await fermer();
	}
	return out;
}

/**
 * L'INCIDENCE MESURÉE d'un nœud que le gabarit ne sait pas rendre.
 *
 * Le relevé de `verif/releve-vues.mjs --hors-app` dit ce que les maquettes
 * placent hors de `div.app` ; il ne dit pas si cela SE VOIT. La différence
 * décide de tout : un nœud sans incidence est une divergence de balisage
 * mesurée nulle — la famille d'`ECART-013` É-3 et d'`ECART-016` É-4, qu'on
 * déclare et qu'on ne rouvre pas ; un nœud avec incidence est un amendement
 * de gabarit, donc un lot et un arbitrage.
 *
 * La mesure est celle du banc : instantané ARIA (niveau 1, échec sec) et
 * capture (niveau 2), avant et après retrait du nœud, dans les conditions de
 * capture. Le bloc `.planche` est retiré d'abord, comme le banc le fait.
 */
async function incidence(vues) {
	const { origine, fermer } = await servir(join(RACINE, 'mockups'));
	const navigateur = await chromium.launch();
	const out = [];
	/* Les nœuds que le gabarit rend déjà : ils ne sont pas en question. */
	const DU_GABARIT = (n) =>
		n.tagName === 'SCRIPT' ||
		n.id === 'app' ||
		n.id === 'notifs' ||
		n.classList.contains('saut-contenu');

	const ouvrir = async () => {
		const r = await ouvrirPage(navigateur, adresse, FENETRE_PRINCIPALE);
		await r.page.evaluate(() =>
			document.querySelectorAll('.planche, section.regles').forEach((n) => n.remove())
		);
		return r;
	};
	let adresse = '';
	try {
		for (const vue of vues) {
			const s = JSON.parse(readFileSync(join(SCENARIOS, `${vue}.json`), 'utf8'));
			adresse = `${origine}/${s.maquette.replace(/^mockups\//, '')}`;

			const base = await ouvrir();
			const cibles = await base.page.evaluate((src) => {
				const estDuGabarit = new Function('n', `return (${src})(n)`);
				return [...document.body.children]
					.map((n, rang) => ({ n, rang }))
					.filter(({ n }) => !estDuGabarit(n))
					.map(({ n, rang }) => ({
						rang,
						/* LE CRITÈRE PHYSIQUE, et il est déterministe : un nœud sans
							   boîte de rendu ne peut pas déplacer un pixel. `<template>`,
							   `<dialog>` fermé et bloc `display:none` sont dans ce cas.
							   Les verdicts ARIA et pixel le corroborent ; c'est celui-ci
							   qui tranche, parce qu'il ne dépend d'aucune capture. */
						rendu: (() => {
							const s = getComputedStyle(n);
							if (n.tagName === 'TEMPLATE') return false;
							if (s.display === 'none' || s.visibility === 'hidden') return false;
							const r = n.getBoundingClientRect();
							return r.width > 0 && r.height > 0;
						})(),
						nom:
							n.tagName.toLowerCase() +
							(n.id ? '#' + n.id : '') +
							(typeof n.className === 'string' && n.className.trim()
								? '.' + n.className.trim().split(/\s+/).join('.')
								: '')
					}));
			}, DU_GABARIT.toString());
			const ariaRef = await base.page.locator('body').ariaSnapshot();
			const pngRef = await base.page.screenshot();
			await base.contexte.close();

			/* CONTRÔLE DE BRUIT, sans lequel la mesure ne vaut rien. Ce protocole
			   n'est pas celui du banc — il ne pose ni masque, ni pointeur au
			   repos, ni le retrait-remise des blocs de `mesurer()` — et il lui
			   arrive de rendre quelques pixels de plus d'un chargement à
			   l'autre. Une SECONDE référence est donc prise sur une page neuve :
			   si les deux réferences diffèrent, le verdict pixel de cette vue
			   est déclaré « bruité » plutôt que lu. Un instrument qui ne mesure
			   pas son propre bruit fabrique des écarts. */
			const temoin = await ouvrir();
			const pngTemoin = await temoin.page.screenshot();
			await temoin.contexte.close();
			const stable = pngRef.equals(pngTemoin);

			/* Une page NEUVE par nœud : retirer puis remettre déplacerait le nœud
			   en fin de document et fausserait la mesure suivante. */
			for (const cible of cibles) {
				const { page, contexte } = await ouvrir();
				await page.evaluate((r) => document.body.children[r].remove(), cible.rang);
				const aria = await page.locator('body').ariaSnapshot();
				const png = await page.screenshot();
				await contexte.close();
				out.push({
					vue,
					noeud: cible.nom,
					rendu: cible.rendu,
					aria: aria === ariaRef ? 'identique' : 'DIVERGE',
					pixels: !stable ? 'bruité' : png.equals(pngRef) ? 'identiques' : 'DIVERGENT'
				});
			}
		}
	} finally {
		await navigateur.close();
		await fermer();
	}
	return out;
}

const args = process.argv.slice(2);
const demandees = args.filter((a) => /^V-\d\d$/.test(a));
const vues = (
	demandees.length
		? demandees
		: readdirSync(SCENARIOS)
				.filter((f) => /^V-\d\d\.json$/.test(f))
				.map((f) => f.slice(0, 4))
).sort();

if (args.includes('--incidence')) {
	const r = await incidence(vues);
	console.log('  vue    nœud hors du gabarit                       rendu   ARIA        pixels');
	for (const e of r)
		console.log(
			`  ${e.vue.padEnd(6)} ${e.noeud.slice(0, 42).padEnd(43)} ${(e.rendu ? 'OUI' : 'non').padEnd(7)} ${e.aria.padEnd(11)} ${e.pixels}`
		);
	const avec = r.filter((e) => e.rendu);
	console.log(
		`\n  ${r.length} nœud(s) mesuré(s), ${avec.length} PORTEUR(S) D'UNE BOÎTE DE RENDU :\n    ` +
			(avec.map((e) => e.vue + ' ' + e.noeud).join('\n    ') || 'aucun')
	);
	console.log(
		`\n  Les ${r.length - avec.length} autres n'ont aucune boîte de rendu — ` +
			`\`<template>\`, \`<dialog>\` fermé, bloc masqué. Ils ne peuvent pas déplacer un pixel :\n` +
			'  les rares « DIVERGENT » qui les accompagnent sont le bruit résiduel de CE protocole,\n' +
			"  qui n'est pas celui du banc (ni masque, ni pointeur au repos, ni retrait-remise de\n" +
			'  `mesurer()`). Le verdict qui fait foi est la colonne « rendu ».'
	);
	process.exit(0);
}

const releve = await relever(vues);

if (args.includes('--json')) {
	console.log(JSON.stringify(releve, null, '\t'));
} else {
	const particuliers = args.includes('--particuliers');
	let n = 0;
	for (const e of releve) {
		const remarquable =
			e.erreur ||
			e.dialogues?.length ||
			e.notifs?.length ||
			e.animations?.length ||
			e.actif ||
			e.superpositions?.length ||
			e.debordement;
		if (particuliers && !remarquable) continue;
		n++;
		const bouts = [];
		if (e.erreur) bouts.push('ERREUR ' + e.erreur);
		if (e.dialogues?.length)
			bouts.push(
				'dialogue ' +
					e.dialogues.map((d) => d.element + (d.modal ? ' :modal' : ' (non modal)')).join(' ')
			);
		if (e.notifs?.length) bouts.push('notif ' + e.notifs.join(' '));
		if (e.actif) bouts.push('focus ' + e.actif);
		if (e.animations?.length) bouts.push('anim ' + e.animations.join(' '));
		if (e.superpositions?.length) bouts.push('superp ' + e.superpositions.join(' '));
		if (e.debordement) bouts.push('DÉBORDEMENT HORIZONTAL');
		if (e.zonesVides) bouts.push(`zone-etat/vide ×${e.zonesVides}`);
		if (e.esquisses) bouts.push(`esquisses ×${e.esquisses}`);
		if (e.rouets) bouts.push(`rouets ×${e.rouets}`);
		console.log(`${e.vue} ${e.etat.padEnd(34)} ${bouts.join(' · ') || '—'}`);
	}
	console.log(
		`\n  ${n} état(s) listé(s) sur ${releve.length} relevés, fenêtre ${FENETRE_PRINCIPALE}.`
	);
}
