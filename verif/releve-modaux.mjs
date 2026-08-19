#!/usr/bin/env node
/**
 * releve-modaux — quels états mettent un `dialog` ouvert à l'écran, mesuré.
 *
 * INSTRUMENT DE MESURE, écrit par le lot T-007e. Il relève du périmètre
 * d'écriture humain / orchestrateur, jamais d'un agent d'exécution : le
 * contournement le plus économique d'une vérification est de modifier la
 * vérification. Cf. `règles/workflow_agentic.md` §4.10 et §6,
 * `PLAN-DE-REALISATION.md` §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI IL EXISTE
 *
 * ARB-017 a tranché que **le banc révèle la modalité d'un `dialog`, des deux
 * côtés, par un code unique** (`verif/banc/revelation.mjs`), et que la
 * déclaration vit dans `verif/references/protocole-app.json`, bloc
 * `revelations`, en **écriture humaine seule**. UNE VUE SANS DÉCLARATION N'EST
 * JAMAIS RÉVÉLÉE : ne rien écrire n'ouvre rien.
 *
 * Ce garde-fou a un revers, et il a mordu : `ECART-015` É-4 puis T-102 ont
 * découvert le manque **une vue à la fois**, au pixel près, chacun à son tour —
 * `open` n'est pas `showModal()`, la zone fait 1440×901 au lieu de 1440×900, le
 * voile n'existe pas, verdict « dimensions divergentes ». Le fichier étant en
 * écriture humaine seule, **aucun lot de vue ne peut se débloquer lui-même**.
 *
 * Cet instrument pose la question aux 41 maquettes d'un coup, et il se rejoue :
 * la déclaration cesse d'être une liste transmise de rapport en rapport —
 * **quatre chiffres ainsi transmis se sont déjà révélés faux au recomptage**
 * (`ECART-010` É-3, `ECART-016` É-1, `ECART-018` É-2, `ECART-021`) — pour
 * devenir une liste **régénérable**, dont la divergence se constate.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * IL EMPRUNTE LE CHEMIN DU BANC, ET RIEN D'AUTRE
 *
 * `verif/banc/serveur.mjs`, `ouvrirPage`, `reglerPlanche`, le clic des
 * déclencheurs et le retrait des blocs hors produit — dans le même ordre que
 * `verif/maquette.mjs` du côté référence. Un relevé pris dans d'autres
 * conditions dirait autre chose que ce que le banc mesure, et ce serait un
 * second dispositif à réconcilier, pas un instrument.
 *
 * DEUX PRÉCAUTIONS QUI DÉCIDENT DU RÉSULTAT, et sans lesquelles il mentirait :
 *
 *   • LES BLOCS HORS PRODUIT SONT RETIRÉS AVANT LA SONDE. `mesurer()` retire
 *     `.planche` et `section.regles` le temps de la mesure. Un `dialog` qui ne
 *     vivrait que dans la planche de revue n'est pas dans la surface jugée : le
 *     compter serait un faux positif, et la déclaration qui en découlerait
 *     n'aurait aucun objet.
 *   • LE DÉCLENCHEUR EST ACTIONNÉ. Onze des cinquante-cinq états de zone ne
 *     sont pas simplement présents dans la page, ils y sont révélés par un clic
 *     (`verif/scenarios/V-xx.json`, `zone.declencheur`) — les dix boîtes de
 *     V-40 en sont. Un relevé qui ne joue pas le geste ne voit pas ces
 *     dix-là et conclurait que V-40 n'a rien à déclarer.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL N'ÉPROUVE PAS, et il faut le dire (RA-01)
 *
 *   • IL NE MESURE RIEN DE L'APPLICATION. Il relève ce que la MAQUETTE met à
 *     l'écran. Que le côté application rende bien ce même `dialog` avec
 *     l'attribut `open` est le propos du régime `--contre=app`, pas du sien.
 *   • IL NE CAPTURE AUCUN PIXEL et ne compare aucune surface. Il ne dit donc
 *     pas de combien un état divergerait sans sa révélation : il dit qu'il y a
 *     là un `dialog`, donc que la question se pose.
 *   • IL N'ÉCRIT PAS LA DÉCLARATION. `protocole-app.json` est en écriture
 *     humaine seule, et le rester est tout l'intérêt du garde-fou : un agent
 *     bloqué sur un rouge ne s'y débloque pas lui-même. Cet instrument produit
 *     le relevé ; l'inscription reste un geste humain.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * COMMANDES
 *
 *   node verif/releve-modaux.mjs               les 41 vues, le tableau
 *   node verif/releve-modaux.mjs V-27 V-32     une sélection
 *   node verif/releve-modaux.mjs --json        le relevé exploitable
 *   node verif/releve-modaux.mjs --verifier    sort en 1 sur divergence entre
 *                                              le relevé et la déclaration
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { servir } from './banc/serveur.mjs';
import { ouvrirPage, reglerPlanche } from './banc/capture.mjs';
import {
	FENETRE_PRINCIPALE,
	AVANCE_ETAT_MS,
	avancer,
	retirerBlocsHorsProduit,
	POINTEUR_AU_REPOS
} from './banc/conditions.mjs';
import { declarationRevelation } from './banc/mode-demo.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS = join(RACINE, 'verif', 'scenarios');

/**
 * La sonde, exécutée dans la page une fois l'état réglé et les blocs hors
 * produit retirés. Elle ne relève QUE ce dont la révélation `modalite-dialogue`
 * décide : les `dialog[open]` et leur modalité.
 */
const SONDE = () =>
	[...document.querySelectorAll('dialog[open]')].map((d) => {
		const r = d.getBoundingClientRect();
		return {
			element: 'dialog' + (d.id ? '#' + d.id : '') + (d.className ? '.' + d.className : ''),
			modal: d.matches(':modal'),
			position: getComputedStyle(d).position,
			largeur: Math.round(r.width),
			hauteur: Math.round(r.height)
		};
	});

/** Le geste du banc, à l'identique de `verif/maquette.mjs` côté référence. */
async function actionnerDeclencheur(page, declencheur) {
	const cible =
		typeof declencheur === 'string'
			? page.locator(declencheur).first()
			: page.locator(declencheur.selecteur).nth(declencheur.index);
	await cible.click();
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.mouse.move(...POINTEUR_AU_REPOS);
	await avancer(page, AVANCE_ETAT_MS);
}

/** @param {string[]} vues */
async function relever(vues) {
	const { origine, fermer } = await servir(join(RACINE, 'mockups'));
	const navigateur = await chromium.launch();
	const releve = [];
	try {
		for (const vue of vues) {
			const scenario = JSON.parse(readFileSync(join(SCENARIOS, `${vue}.json`), 'utf8'));
			const fichier = scenario.maquette.replace(/^mockups\//, '');
			for (const etat of scenario.etats) {
				const { page, contexte } = await ouvrirPage(
					navigateur,
					`${origine}/${fichier}`,
					FENETRE_PRINCIPALE
				);
				let dialogues = [];
				let erreur = null;
				try {
					if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
					else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
					if (etat.zone?.declencheur) await actionnerDeclencheur(page, etat.zone.declencheur);
					// Le retrait vient APRÈS le réglage : une planche retirée trop tôt
					// n'aurait plus de contrôle à régler.
					await retirerBlocsHorsProduit(page);
					dialogues = await page.evaluate(SONDE);
				} catch (e) {
					erreur = String(e.message ?? e).slice(0, 200);
				}
				await contexte.close();
				releve.push({
					vue,
					etat: etat.cle,
					zone: etat.zone ? (etat.zone.selecteur ?? etat.zone) : null,
					declencheur: Boolean(etat.zone?.declencheur),
					erreur,
					dialogues
				});
			}
		}
	} finally {
		await navigateur.close();
		await fermer();
	}
	return releve;
}

/**
 * Confronte le relevé à la déclaration de `protocole-app.json`, bloc
 * `revelations`. Deux divergences, et elles ne se valent pas :
 *
 *   • MANQUE — une vue dont un état ouvre un `dialog` sans déclaration. C'est
 *     le blocage que ce lot existe pour lever : quatre lots de vue buteraient
 *     dessus, et aucun ne pourrait se débloquer.
 *   • SANS OBJET — une vue déclarée dont aucun état n'ouvre de `dialog`. La
 *     déclaration ne ferait alors rien (`reveler()` ne trouve rien à établir),
 *     mais elle mentirait sur ce que la vue exige, et RA-01 refuse un
 *     document qui affirme plus que ce qui est mesuré.
 */
function confronter(releve, vues) {
	const avecDialogue = new Map();
	for (const e of releve) {
		if (!e.dialogues.length) continue;
		const acc = avecDialogue.get(e.vue) ?? { vue: e.vue, etats: [], elements: new Set() };
		acc.etats.push(e.etat);
		for (const d of e.dialogues) acc.elements.add(d.element);
		avecDialogue.set(e.vue, acc);
	}
	const manques = [];
	const sansObjet = [];
	for (const vue of vues) {
		const declare = Boolean(declarationRevelation(vue));
		const mesure = avecDialogue.get(vue);
		if (mesure && !declare) manques.push(mesure);
		if (!mesure && declare) sansObjet.push(vue);
	}
	return { avecDialogue, manques, sansObjet };
}

/* ── Exécution ─────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const demandees = args.filter((a) => /^V-\d\d$/.test(a));
const vues = (
	demandees.length
		? demandees
		: readdirSync(SCENARIOS)
				.filter((f) => /^V-\d\d\.json$/.test(f))
				.map((f) => f.slice(0, 4))
).sort();

const releve = await relever(vues);
const { avecDialogue, manques, sansObjet } = confronter(releve, vues);

if (args.includes('--json')) {
	console.log(
		JSON.stringify(
			{
				fenetre: FENETRE_PRINCIPALE,
				vues: vues.length,
				etats: releve.length,
				etats_modaux: releve.filter((e) => e.dialogues.length).length,
				releve: releve.filter((e) => e.dialogues.length || e.erreur),
				manques: manques.map((m) => ({ vue: m.vue, etats: m.etats, elements: [...m.elements] })),
				sans_objet: sansObjet
			},
			null,
			'\t'
		)
	);
} else {
	const erreurs = releve.filter((e) => e.erreur);
	console.log(
		`  ${vues.length} vue(s), ${releve.length} état(s) relevé(s), fenêtre ${FENETRE_PRINCIPALE}.\n` +
			'  blocs hors produit retirés avant sonde · déclencheurs actionnés\n'
	);
	console.log('  vue    état                                dialogue(s) ouvert(s)');
	for (const e of releve) {
		if (!e.dialogues.length && !e.erreur) continue;
		const dit = e.erreur
			? 'ERREUR ' + e.erreur
			: e.dialogues
					.map(
						(d) =>
							`${d.element} ${d.modal ? ':modal' : '(non modal)'} ${d.largeur}×${d.hauteur} ${d.position}`
					)
					.join(' · ');
		console.log(`  ${e.vue.padEnd(6)} ${e.etat.padEnd(35)} ${dit}`);
	}

	const total = releve.filter((e) => e.dialogues.length).length;
	console.log(
		`\n  ${total} ÉTAT(S) MODAL(AUX) sur ${avecDialogue.size} vue(s) : ` +
			[...avecDialogue.values()].map((m) => `${m.vue} (${m.etats.length})`).join(', ')
	);

	console.log('\n  Confrontation à protocole-app.json, bloc `revelations` :');
	if (!manques.length && !sansObjet.length) {
		console.log('    la déclaration couvre exactement le relevé.');
	}
	for (const m of manques) {
		console.log(
			`    MANQUE — ${m.vue} ouvre un dialogue sur ${m.etats.length} état(s) sans déclaration :\n` +
				`      ${m.etats.join(', ')}\n` +
				`      éléments : ${[...m.elements].join(', ')}`
		);
	}
	for (const v of sansObjet) {
		console.log(`    SANS OBJET — ${v} est déclarée, aucun de ses états n'ouvre de dialogue.`);
	}
	if (manques.length || sansObjet.length) {
		console.log(
			'\n    `verif/references/protocole-app.json` est en ÉCRITURE HUMAINE SEULE.\n' +
				"    Un agent d'exécution n'y écrit jamais, et n'y ajoute jamais une vue pour\n" +
				'    faire taire un rouge — PLAN §12. Cet instrument constate ; il ne corrige pas.'
		);
	}
	if (erreurs.length) {
		console.log(`\n  ${erreurs.length} état(s) en erreur de relevé — voir ci-dessus.`);
	}
}

if (args.includes('--verifier') && (manques.length || sansObjet.length)) process.exit(1);
