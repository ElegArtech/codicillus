#!/usr/bin/env node
/**
 * `pnpm verif:maquette` — batterie 11 du catalogue (PLAN-DE-REALISATION.md §5).
 * La conformité de rendu à la maquette gelée, par le protocole en trois
 * niveaux du §4.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie NI ce script, NI
 * `verif/banc/conditions.mjs`, NI `verif/references/tolerances.json`, NI
 * `verif/masques.json`. Élargir une tolérance ou masquer une zone pour obtenir
 * du vert est le contournement de vérification nommé par PLAN §12. La seule
 * sortie légitime d'un rouge est le protocole d'écart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DEUX RÉGIMES
 *
 *   --contre=maquette  (défaut au lot T-007) — ÉTALONNAGE À BLANC.
 *       La maquette gelée est comparée à elle-même, état par état, fenêtre par
 *       fenêtre, capturée deux fois dans deux contextes de navigateur
 *       indépendants. L'exigence y est ZÉRO écart, sans seuil : c'est la seule
 *       preuve que le harnais est déterministe et que ses conditions de
 *       capture tiennent. Tout écart non nul en à blanc est un DÉFAUT DE BANC,
 *       jamais un défaut de maquette.
 *
 *   --contre=app --base=http://…  — CONFORMITÉ D'UNE VUE.
 *       Le côté candidat devient l'application. Il exige que le volet `app` du
 *       scénario soit renseigné. Aucune vue n'existe au lot T-007 : ce régime
 *       échoue bruyamment plutôt que de sortir en 0 sans rien prouver — c'est
 *       le mode de défaillance RA-01 du plan (§12).
 *
 * Usage :
 *   pnpm verif:maquette [V-xx …] [--etats=cle,cle] [--fenetres=1440x900,…]
 *                       [--contre=maquette|app] [--base=URL]
 *                       [--archiver=ecarts|complet] [--silencieux]
 *
 * Sans argument de vue : les 41 vues.
 * Code retour : 0 conforme, 1 non conforme ou recours au niveau 3 en attente.
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { servir } from './banc/serveur.mjs';
import { racine, RACINE_MAQUETTES, vues } from './banc/inventaire.mjs';
import { fenetresDe, FENETRES, avancer, AVANCE_ETAT_MS } from './banc/conditions.mjs';
import { ouvrirPage, reglerPlanche, mesurer } from './banc/capture.mjs';
import { comparerStructure, comparerPixels, coteACote, TOLERANCES } from './banc/comparer.mjs';
import { decoder } from './banc/png.mjs';

const DOSSIER_SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_CAPTURES = join(racine, 'verif', 'captures');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');
const EMPREINTES = join(racine, 'verif', 'references', 'empreintes.json');

/* ── Arguments ─────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const option = (nom, defaut = null) => {
	const trouve = args.find((a) => a.startsWith(`--${nom}=`));
	return trouve ? trouve.slice(nom.length + 3) : defaut;
};
const demandees = args.filter((a) => /^V-\d\d$/.test(a));
const filtreEtats = option('etats') ? option('etats').split(',') : null;
const filtreFenetres = option('fenetres') ? option('fenetres').split(',') : null;
const contre = option('contre', 'maquette');
const base = option('base');
const archiver = option('archiver', 'ecarts');
const silencieux = args.includes('--silencieux');
const sonde = option('sonde');
const etalonner = args.includes('--etalonner');

if (sonde && !['pixels', 'structure'].includes(sonde)) {
	console.error(`verif:maquette — --sonde=${sonde} inconnue (pixels | structure).`);
	process.exit(2);
}

if (!['maquette', 'app'].includes(contre)) {
	console.error(`verif:maquette — --contre=${contre} inconnu (maquette | app).`);
	process.exit(2);
}
if (contre === 'app') {
	console.error(
		`
verif:maquette --contre=app — non outillé au lot T-007, et c'est délibéré.

Le côté candidat serait l'application ; aucune vue applicative n'existe, et le
volet « app » des scénarios de verif/scenarios/ est vide par règle de
non-comblement. Un banc qui sortirait en 0 dans cet état déclarerait conforme
une vue inexistante : c'est le mode de défaillance RA-01 du plan (§12).

Le lot qui portera une vue renseigne d'abord le volet « app » de son scénario,
puis lève ce garde-fou. Base demandée : ${base ?? '(aucune)'}
`
	);
	process.exit(1);
}
if (filtreFenetres?.some((f) => !FENETRES[f])) {
	console.error(`verif:maquette — fenêtre inconnue. Connues : ${Object.keys(FENETRES).join(', ')}`);
	process.exit(2);
}

const masques = JSON.parse(readFileSync(join(racine, 'verif', 'masques.json'), 'utf8'));
const toutes = vues();
const cibles = demandees.length ? toutes.filter((v) => demandees.includes(v.vue)) : toutes;
if (demandees.length && cibles.length !== demandees.length) {
	console.error(`verif:maquette — vue inconnue parmi : ${demandees.join(', ')}`);
	process.exit(2);
}

/* ── La dérive du banc, rendue visible ────────────────────────────────────
   `verif/references/empreintes.json` fige la SIGNATURE que le banc relève du
   côté maquette : empreinte de l'instantané ARIA, empreinte de l'ordre de
   tabulation, dimensions de la capture, pour chaque état et chaque fenêtre.

   Ce n'est pas une baseline en images — il n'y en a pas, et c'est délibéré
   (verif/banc/capture.mjs). C'est le témoin d'une question que rien d'autre ne
   pose : *le banc lit-il encore la maquette gelée comme il la lisait ?* Une
   montée de version de Chromium, un réglage de contexte modifié, une avance de
   temps virtuel raccourcie déplacent cette signature sans qu'aucune source
   n'ait bougé — et déplaceraient donc silencieusement tous les verdicts
   rendus ensuite. `pnpm verif:gel` garde la maquette ; ce fichier garde
   l'instrument qui la lit.

   Il est en ÉCRITURE HUMAINE SEULE, comme le reste de `verif/references/`. Un
   agent bloqué sur une dérive ne le régénère pas : il la déclare. */
function signature(mesure, png) {
	const somme = (v) => createHash('sha256').update(v).digest('hex').slice(0, 16);
	const image = png ? decoder(png) : null;
	return {
		aria: somme(mesure.aria),
		tabulation: somme(mesure.tabulation.join('\n')),
		focalisables: mesure.tabulation.length,
		dimensions: image ? `${image.largeur}×${image.hauteur}` : null
	};
}

/* ── La sonde : prouver que l'instrument sait dire non ─────────────────────
   Un banc toujours vert ne prouve rien — c'est le mode de défaillance RA-01 du
   plan (§12). `--sonde` introduit une perturbation connue du seul côté
   candidat et EXIGE que la comparaison la voie. Le code retour est inversé :
   0 quand le banc a bien rougi, 1 quand il est resté vert malgré la
   perturbation, ce qui est alors le vrai défaut.

     pixels     — un assombrissement global de 4 %, sans effet sur la mise en
                  page. Le niveau 1 reste vert, seul le niveau 2 doit rougir.
     structure  — un caractère ajouté au premier titre. Le niveau 1 doit
                  rougir, avant même que les pixels ne soient comparés.
   ─────────────────────────────────────────────────────────────────────── */
async function perturber(page, genre) {
	if (genre === 'pixels') {
		await page.addStyleTag({ content: 'html { filter: brightness(0.96) !important; }' });
	} else {
		await page.evaluate(() => {
			const titre = document.querySelector('h1, h2, h3');
			if (titre) titre.textContent = `${titre.textContent} ⟂`;
		});
	}
}

/* ── Exécution ─────────────────────────────────────────────────────────── */
const debut = Date.now();
mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
if (existsSync(DOSSIER_CAPTURES)) rmSync(DOSSIER_CAPTURES, { recursive: true, force: true });
mkdirSync(DOSSIER_CAPTURES, { recursive: true });

const serveur = await servir(RACINE_MAQUETTES);
const navigateur = await chromium.launch();
const resultats = [];
const defauts = [];
const derives = [];
const signatures = {};
const empreintesConnues =
	existsSync(EMPREINTES) && !etalonner ? JSON.parse(readFileSync(EMPREINTES, 'utf8')) : null;

for (const { vue, fichier } of cibles) {
	const scenario = JSON.parse(readFileSync(join(DOSSIER_SCENARIOS, `${vue}.json`), 'utf8'));
	const masquesVue = (masques.vues[vue] ?? []).map((m) => m.selecteur);
	const fenetres = (filtreFenetres ?? fenetresDe(vue)).filter((f) => fenetresDe(vue).includes(f));
	const etats = scenario.etats.filter((e) => !filtreEtats || filtreEtats.includes(e.cle));
	if (filtreEtats) {
		// Un filtre qui laisse tomber silencieusement une clé inconnue est un
		// piège : il fait croire qu'un état a été vérifié alors qu'il n'a même
		// pas été tenté.
		const connues = new Set(scenario.etats.map((e) => e.cle));
		const inconnues = filtreEtats.filter((c) => !connues.has(c));
		if (inconnues.length && cibles.length === 1) {
			console.error(
				`verif:maquette — état(s) inconnu(s) de ${vue} : ${inconnues.join(', ')}\n` +
					`  états déclarés : ${[...connues].join(', ')}`
			);
			process.exit(2);
		}
		if (etats.length === 0) continue;
	}

	for (const fenetre of fenetres) {
		const adresse = `${serveur.origine}/${fichier}`;

		for (const etat of etats) {
			const mesures = {};
			// Deux chargements indépendants, dans deux contextes distincts :
			// c'est ce qui rend l'à-blanc probant. Deux captures prises sur la
			// même page seraient identiques par construction et ne
			// prouveraient rien du déterminisme du harnais.
			for (const nom of ['reference', 'candidat']) {
				const { page, contexte } = await ouvrirPage(navigateur, adresse, fenetre);
				if (sonde && nom === 'candidat') await perturber(page, sonde);
				if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
				else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
				if (etat.zone?.declencheur) {
					const d = etat.zone.declencheur;
					const cible =
						typeof d === 'string'
							? page.locator(d).first()
							: page.locator(d.selecteur).nth(d.index);
					await cible.click();
					await avancer(page, AVANCE_ETAT_MS);
				}
				mesures[nom] = await mesurer(page, { zone: etat.zone ?? null, masques: masquesVue });
				await page.close();
				await contexte.close();
			}

			const cle = `${vue}/${etat.cle}@${fenetre}`;
			const empreinte = signature(mesures.reference, mesures.reference.png);
			signatures[cle] = empreinte;
			const attendue = empreintesConnues?.signatures?.[cle];
			if (attendue && JSON.stringify(attendue) !== JSON.stringify(empreinte)) {
				derives.push({ cle, attendue, obtenue: empreinte });
			}

			const niveau1 = comparerStructure(mesures.reference, mesures.candidat);
			const niveau2 = niveau1.conforme
				? comparerPixels(mesures.reference.png, mesures.candidat.png)
				: null;

			// EN À BLANC, LES TOLÉRANCES NE S'APPLIQUENT PAS. La maquette est
			// comparée à elle-même : l'exigence est zéro pixel différent, sans
			// seuil. Laisser passer 0,5 % ici reviendrait à étalonner
			// l'instrument avec l'instrument, et à masquer précisément le genre
			// de dérive — sous-pixel, fonderie, minuterie — que l'à-blanc
			// existe pour débusquer (verif/references/tolerances.json, « a_blanc »).
			const aBlanc = contre === 'maquette';
			const verdict = !niveau1.conforme
				? 'echec-structure'
				: aBlanc
					? niveau2.pixelsDifferents === 0 && niveau2.motif === null
						? 'conforme'
						: 'echec-a-blanc'
					: niveau2.verdict === 'conforme'
						? 'conforme'
						: niveau2.verdict === 'niveau3'
							? 'recours-niveau3'
							: 'echec-pixels';

			const resultat = {
				vue,
				etat: etat.cle,
				libelle: etat.libelle,
				fenetre,
				verdict,
				niveau1: { conforme: niveau1.conforme, ecarts: niveau1.ecarts },
				niveau2: niveau2
					? {
							verdict: niveau2.verdict,
							motif: niveau2.motif,
							pixelsDifferents: niveau2.pixelsDifferents,
							pixelsTotal: niveau2.pixelsTotal,
							proportion: niveau2.proportion,
							ecartCanalMax: niveau2.ecartCanalMax,
							dimensions: niveau2.dimensions
						}
					: null,
				captures: null
			};

			const aArchiver = archiver === 'complet' || verdict !== 'conforme';
			if (aArchiver) {
				const dossier = join(DOSSIER_CAPTURES, vue);
				mkdirSync(dossier, { recursive: true });
				const prefixe = join(dossier, `${etat.cle}@${fenetre}`);
				writeFileSync(`${prefixe}-reference.png`, mesures.reference.png);
				writeFileSync(`${prefixe}-candidat.png`, mesures.candidat.png);
				if (niveau2?.ecart) writeFileSync(`${prefixe}-ecart.png`, niveau2.ecart);
				writeFileSync(
					`${prefixe}-cote-a-cote.png`,
					coteACote(mesures.reference.png, mesures.candidat.png)
				);
				resultat.captures = {
					reference: `verif/captures/${vue}/${etat.cle}@${fenetre}-reference.png`,
					candidat: `verif/captures/${vue}/${etat.cle}@${fenetre}-candidat.png`,
					ecart: niveau2?.ecart ? `verif/captures/${vue}/${etat.cle}@${fenetre}-ecart.png` : null,
					coteACote: `verif/captures/${vue}/${etat.cle}@${fenetre}-cote-a-cote.png`
				};
			}

			resultats.push(resultat);
			if (verdict !== 'conforme') defauts.push(resultat);
			if (!silencieux) {
				process.stdout.write(
					`  ${vue} ${etat.cle.padEnd(34)} ${fenetre.padEnd(9)} ` +
						`${verdict === 'conforme' ? 'conforme' : verdict.toUpperCase()}` +
						(niveau2?.pixelsDifferents
							? `  ${niveau2.pixelsDifferents} px (${(niveau2.proportion * 100).toFixed(4)} %)`
							: '') +
						'\n'
				);
			}
		}
	}
}

await navigateur.close();
await serveur.fermer();

/* ── Étalonnage de la signature, ou contrôle de non-dérive ─────────────── */
if (etalonner) {
	if (contre !== 'maquette' || demandees.length || filtreEtats || filtreFenetres || sonde) {
		console.error(
			'verif:maquette --etalonner — la signature de référence se produit sur la\n' +
				'  totalité des vues, en régime « maquette », sans filtre ni sonde.'
		);
		process.exit(2);
	}
	writeFileSync(
		EMPREINTES,
		JSON.stringify(
			{
				_: [
					'BASELINE DU BANC — ÉCRITURE HUMAINE SEULE.',
					'Signature que le banc relève du côté maquette gelée : empreinte de',
					"l'instantané ARIA, empreinte de l'ordre de tabulation, nombre",
					"d'éléments focalisables, dimensions de la capture. Produite par",
					'`pnpm verif:maquette --etalonner`, à la production initiale.',
					'',
					"Elle répond à une question que rien d'autre ne pose : le banc lit-il",
					'encore la maquette gelée comme il la lisait ? `pnpm verif:gel` garde',
					"la maquette ; ce fichier garde l'instrument qui la lit.",
					'',
					"Un agent d'exécution ne le régénère JAMAIS pour faire passer un",
					'contrôle de dérive : il déclare la dérive (PLAN §12).'
				],
				navigateur: `chromium ${navigateur.version()}`,
				le: new Date().toISOString(),
				etats: Object.keys(signatures).length,
				signatures
			},
			null,
			'\t'
		) + '\n'
	);
	console.log(
		`\n  Signature de référence écrite : ${Object.keys(signatures).length} états — verif/references/empreintes.json\n`
	);
}

/* ── Rapport ───────────────────────────────────────────────────────────── */
const duree = ((Date.now() - debut) / 1000).toFixed(1);
const recours = resultats.filter((r) => r.verdict === 'recours-niveau3');
const parVue = new Map();
for (const r of resultats) {
	const e = parVue.get(r.vue) ?? { vue: r.vue, total: 0, conformes: 0, defauts: 0, recours: 0 };
	e.total++;
	if (r.verdict === 'conforme') e.conformes++;
	else e.defauts++;
	if (r.verdict === 'recours-niveau3') e.recours++;
	parVue.set(r.vue, e);
}

const rapport = {
	batterie: '11 « conformité de maquette »',
	lot: 'T-007',
	regime: contre === 'maquette' ? 'étalonnage à blanc — maquette contre elle-même' : contre,
	le: new Date().toISOString(),
	duree_s: Number(duree),
	tolerances: TOLERANCES,
	comptes: {
		vues: parVue.size,
		etats: resultats.length,
		conformes: resultats.length - defauts.length,
		defauts: defauts.length,
		recours_niveau3: recours.length,
		taux_recours: resultats.length ? recours.length / resultats.length : 0
	},
	derives,
	parVue: [...parVue.values()],
	resultats
};
writeFileSync(join(DOSSIER_RAPPORTS, 'maquette.json'), JSON.stringify(rapport, null, '\t') + '\n');

console.log('\n─────────────────────────────────────────────────────────────────────');
console.log(`verif:maquette — ${rapport.regime}`);
console.log(
	`  ${parVue.size} vue(s) · ${resultats.length} couple(s) de captures · ${duree} s\n` +
		`  conformes : ${rapport.comptes.conformes}` +
		`  ·  écarts : ${defauts.length}` +
		`  ·  recours au niveau 3 : ${recours.length} (${(rapport.comptes.taux_recours * 100).toFixed(2)} %)`
);
console.log(`  rapport machine : verif/rapports/maquette.json`);

if (derives.length) {
	console.error(
		`\n  ${derives.length} DÉRIVE(S) DE BANC — la signature relevée sur la maquette gelée\n` +
			`  ne correspond plus à verif/references/empreintes.json (${empreintesConnues.navigateur},\n` +
			`  étalonnée le ${empreintesConnues.le}). Aucune source n'a bougé : c'est l'instrument\n` +
			`  qui a changé, ou son environnement. À déclarer, jamais à ré-étalonner en silence.\n`
	);
	for (const d of derives.slice(0, 20)) {
		console.error(
			`    ${d.cle}\n      attendue : ${JSON.stringify(d.attendue)}\n      obtenue  : ${JSON.stringify(d.obtenue)}`
		);
	}
	process.exit(1);
}

if (sonde) {
	if (defauts.length === resultats.length && resultats.length > 0) {
		console.log(
			`  SONDE « ${sonde} » — le banc a vu la perturbation sur ${defauts.length} état(s) sur ${resultats.length}.\n`
		);
		process.exit(0);
	}
	console.error(
		`\n  SONDE « ${sonde} » — ÉCHEC : ${resultats.length - defauts.length} état(s) sont restés\n` +
			`  conformes malgré une perturbation délibérée. Un banc qui ne sait pas dire non\n` +
			`  ne prouve rien (PLAN §12, RA-01).\n`
	);
	process.exit(1);
}

if (defauts.length) {
	console.error(`\n  ${defauts.length} état(s) non conforme(s) :`);
	for (const d of defauts.slice(0, 40)) {
		console.error(`    ${d.vue} · ${d.etat} @ ${d.fenetre} — ${d.verdict}`);
		if (!d.niveau1.conforme) {
			for (const e of d.niveau1.ecarts) {
				console.error(
					`        niveau 1 · ${e.quoi} · ligne ${e.detail?.ligne}\n` +
						`          référence : ${e.detail?.reference}\n` +
						`          candidat  : ${e.detail?.candidat}`
				);
			}
		}
		if (d.niveau2) {
			console.error(
				`        niveau 2 · ${
					d.niveau2.motif ??
					`${d.niveau2.pixelsDifferents} px sur ${d.niveau2.pixelsTotal}` +
						` (${(d.niveau2.proportion * 100).toFixed(4)} %), écart de canal max ${d.niveau2.ecartCanalMax}`
				}` + `  ${d.niveau2.dimensions.reference} / ${d.niveau2.dimensions.candidat}`
			);
		}
		if (d.captures) console.error(`        captures : ${d.captures.coteACote}`);
	}
	if (defauts.length > 40)
		console.error(`    … et ${defauts.length - 40} autre(s), voir le rapport.`);

	if (contre === 'maquette') {
		console.error(`
En étalonnage à blanc, la maquette est comparée à elle-même : un écart n'est
JAMAIS un défaut de maquette, toujours un DÉFAUT DE BANC — polices chargées en
retard, animation résiduelle, horloge non gelée, barre de défilement, arrondi
sous-pixel, tirage au sort. Il se chasse jusqu'à zéro, ou il se déclare.

Il ne s'absorbe pas en élargissant une tolérance : c'est le contournement de
vérification nommé par PLAN §12.
`);
	}
	process.exit(1);
}

if (recours.length) {
	console.error(`\n  ${recours.length} état(s) en attente d'arbitrage au niveau 3.`);
	process.exit(1);
}

console.log('  Aucun écart.\n');
process.exit(0);
