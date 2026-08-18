#!/usr/bin/env node
/**
 * Banc de comparaison visuelle — production mécanique des scénarios.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QUE FAIT CE SCRIPT
 *
 * Il produit `verif/scenarios/V-xx.json`, un fichier par vue, à partir de la
 * MAQUETTE GELÉE et d'elle seule. Aucune entrée n'est rédigée à la main :
 * chaque état sort d'un contrôle réellement présent dans la planche de revue,
 * ou d'une zone réellement présente dans la page.
 *
 * DEUX RÉGIMES, PARCE QUE LES MAQUETTES EN PORTENT DEUX.
 *
 *   • 37 vues portent une planche de revue (`errata E-03`). Leurs états sont
 *     des POSITIONS DE CONTRÔLE : un jeu de `fieldset` / `legend` / `input`
 *     qui pilote la vue. Le script les recense et en dérive un état par
 *     position atteignable.
 *   • V-09, V-35, V-38, V-39, V-40 et V-41 présentent des états CÔTE À CÔTE
 *     dans la page. Ce sont des ZONES, pas des variantes : on ne les atteint
 *     pas en réglant un contrôle, on les capture là où elles sont.
 *     `PLAN §4.1` n'en nomme que quatre — V-09, V-35, V-40, V-41. V-38 et
 *     V-39 en portent aussi, ET une planche : `docs/routes.md` §3.7 les compte
 *     bien ainsi. La divergence est signalée par ce script, pas arbitrée.
 *
 * LA COMBINATOIRE N'EST PAS LE PRODUIT CARTÉSIEN. Croiser tous les contrôles
 * de V-14 donnerait 192 écrans, dont personne n'a jamais déclaré qu'ils sont
 * des états du produit : ce serait combler. La règle retenue est celle que
 * `docs/routes.md` applique déjà, position par position — l'état est le
 * réglage par défaut de la planche, DÉVIÉ D'UN SEUL CONTRÔLE. C'est ce que
 * la planche elle-même donne à voir : un relecteur bascule un contrôle et
 * regarde. Les combinaisons multiples ne sont pas interdites, elles ne sont
 * simplement pas déclarées ; les ajouter relèverait de l'arbitrage.
 *
 * LE VOLET `app` RESTE `null`, ET CE N'EST PLUS UN MANQUE — lot T-007b,
 * réponse à `ECART-011` É-9.
 *
 * Ces fichiers ne contiennent RIEN que la maquette ne dise, et c'est
 * exactement ce que `--verifier` prouve en les régénérant. Un volet rédigé à
 * la main y serait donc soit écrasé à la première extraction, soit un obstacle
 * permanent au contrôle de non-dérive : l'instruction « renseigne le volet
 * app » n'avait, littéralement, aucun destinataire dans le code.
 *
 * Le protocole d'état côté application vit désormais dans
 * `verif/references/protocole-app.json`, en écriture humaine seule, aux côtés
 * des tolérances, des masques et des zones comparées — c'est-à-dire au même
 * endroit et sous le même régime que tout ce qui décide d'un verdict sans être
 * dérivé du gel. Le champ `app` de ces scénarios garde sa valeur `null`, qui
 * dit une chose vraie et utile : LA MAQUETTE, ELLE, NE DÉCLARE RIEN DE
 * L'APPLICATION.
 *
 * Usage : node verif/extraire-scenarios.mjs [--verifier]
 *   --verifier  ne réécrit rien ; échoue si les fichiers produits diffèrent
 *               de ceux du dépôt (contrôle de non-dérive de l'extraction).
 */
import { chromium } from '@playwright/test';
import { format, resolveConfig } from 'prettier';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { servir } from './banc/serveur.mjs';
import { racine, RACINE_MAQUETTES, vues, empreinte, declareParRoutes } from './banc/inventaire.mjs';
import { fenetresDe, optionsContexte, FENETRE_PRINCIPALE } from './banc/conditions.mjs';

const DOSSIER_SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');

/* ═══════════════════════════════════════════════════════════════════════════
   LES ZONES CÔTE À CÔTE
   Relevé sur le DOM rendu des six maquettes concernées. Chaque descripteur
   porte le sélecteur qui a été observé, et rien de plus : les libellés sont
   lus dans la page, jamais recopiés d'un document tiers.
   ═══════════════════════════════════════════════════════════════════════ */
const ZONES = {
	'V-09': {
		source: 'les six sections « ÉTAT 01 » à « ÉTAT 06 » de la grille #etats',
		collections: [
			{
				items: '#etats section.cas',
				cleAttribut: { selecteur: '[data-cas]', attribut: 'data-cas' },
				libelleSelecteur: '.cas__nom'
			}
		]
	},
	'V-35': {
		source: 'les trois blocs du travail, plus le rapport de lot en superposition',
		explicites: [
			{ cle: 'depot-au-repos', selecteur: '#depot', libelleSelecteur: 'h2' },
			{
				cle: 'scenarios-directs',
				selecteur: '#scenarios',
				libelleSelecteur: null,
				libelle: 'Accès direct aux trois scénarios'
			},
			{
				cle: 'journal-peuple',
				selecteur: '.tableau-gestion',
				libelleSelecteur: null,
				libelle: 'Journal des imports'
			},
			{
				cle: 'rapport-de-lot',
				selecteur: '#dlg-rapport',
				libelleSelecteur: '#dlg-rap-titre',
				declencheur: '#journal .tg__actions button'
			}
		]
	},
	'V-38': {
		source: 'les quatre types de notification présentés dans #types',
		collections: [
			{ items: '#types > section.type-bloc', libelleSelecteur: '.type-bloc__tete', prefixe: 'type' }
		]
	},
	'V-39': {
		source: 'les trois grilles de vignettes — vides, esquisses de chargement, erreurs',
		collections: [
			{ items: '#vides .vignette', libelleSelecteur: '.etiq', prefixe: 'vide' },
			{ items: '#squelettes .vignette', libelleSelecteur: '.etiq', prefixe: 'chargement' },
			{ items: '#erreurs .vignette', libelleSelecteur: '.etiq', prefixe: 'erreur' }
		]
	},
	'V-40': {
		source: 'les dix boîtes de dialogue, ouvertes par leur entrée de catalogue',
		collections: [
			{
				items: 'dialog.dlg',
				cleAttribut: { selecteur: null, attribut: 'id' },
				libelleSelecteur: '.dlg__titre',
				declencheurs: '.catalogue article button'
			}
		]
	},
	'V-41': {
		source: 'les onze familles de composants',
		collections: [
			{
				items: 'section.famille',
				cleAttribut: { selecteur: null, attribut: 'id' },
				libelleSelecteur: 'h2'
			}
		]
	}
};

/** Réduit un libellé à une clé stable : sans accent, sans ponctuation. */
function cleDepuisLibelle(libelle) {
	return libelle
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 48);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LECTURE DE LA PLANCHE
   ═══════════════════════════════════════════════════════════════════════ */
async function lirePlanche(page) {
	return page.evaluate(() => {
		const planche = document.querySelector('.planche');
		if (!planche) return null;
		const texte = (n) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
		return [...planche.querySelectorAll('fieldset')].map((f) => {
			const legende = texte(f.querySelector('legend'));
			const entrees = [...f.querySelectorAll('input')];
			const radios = entrees.filter((e) => e.type === 'radio');
			const cases = entrees.filter((e) => e.type === 'checkbox');
			return {
				legende,
				groupes: [...new Set(radios.map((r) => r.name))].map((nom) => ({
					nom,
					options: radios
						.filter((r) => r.name === nom)
						.map((r) => ({
							valeur: r.value,
							libelle: texte(r.closest('label')),
							defaut: r.defaultChecked
						}))
				})),
				cases: cases.map((c) => ({
					id: c.id,
					libelle: texte(c.closest('label')),
					defaut: c.defaultChecked
				}))
			};
		});
	});
}

/** Le réglage complet de la planche à l'ouverture de la maquette. */
function vecteurParDefaut(fieldsets) {
	const vecteur = {};
	for (const f of fieldsets) {
		for (const g of f.groupes) {
			const d = g.options.find((o) => o.defaut) ?? g.options[0];
			vecteur[g.nom] = d.valeur;
		}
		for (const c of f.cases) vecteur[c.id] = c.defaut;
	}
	return vecteur;
}

/** Un état par position de contrôle — cf. le bandeau, « la combinatoire ». */
function etatsDePlanche(fieldsets) {
	const defaut = vecteurParDefaut(fieldsets);
	const etats = [];
	for (const f of fieldsets) {
		for (const g of f.groupes) {
			for (const o of g.options) {
				etats.push({
					cle: `${g.nom}-${cleDepuisLibelle(o.valeur)}`,
					libelle: `${f.legende} — ${o.libelle}`,
					controle: { fieldset: f.legende, nom: g.nom, position: o.valeur },
					planche: { [g.nom]: o.valeur },
					vecteur: { ...defaut, [g.nom]: o.valeur },
					defaut: o.defaut === true,
					app: null
				});
			}
		}
		for (const c of f.cases) {
			etats.push({
				cle: cleDepuisLibelle(c.id.replace(/^c-/, '')) || cleDepuisLibelle(c.id),
				libelle: `${f.legende} — ${c.libelle}`,
				controle: { fieldset: f.legende, nom: c.id, position: !c.defaut },
				planche: { [c.id]: !c.defaut },
				vecteur: { ...defaut, [c.id]: !c.defaut },
				defaut: false,
				app: null
			});
		}
	}
	// Deux positions par défaut de deux groupes différents produisent le même
	// écran. On les garde toutes — la traçabilité avec `docs/routes.md` est à
	// ce prix — mais on marque l'équivalence pour que la capture ne soit faite
	// qu'une fois.
	const vues = new Map();
	for (const e of etats) {
		const signature = JSON.stringify(e.vecteur);
		if (vues.has(signature)) e.identiqueA = vues.get(signature);
		else vues.set(signature, e.cle);
	}
	return etats;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LECTURE DES ZONES
   ═══════════════════════════════════════════════════════════════════════ */
async function lireZones(page, descripteur) {
	const etats = [];

	for (const explicite of descripteur.explicites ?? []) {
		const libelle = await page.evaluate(
			({ selecteur, libelleSelecteur }) => {
				const n = document.querySelector(selecteur);
				if (!n) return null;
				if (!libelleSelecteur) return null;
				const l = n.querySelector(libelleSelecteur) ?? document.querySelector(libelleSelecteur);
				return (l?.textContent ?? '').replace(/\s+/g, ' ').trim();
			},
			{ selecteur: explicite.selecteur, libelleSelecteur: explicite.libelleSelecteur }
		);
		etats.push({
			cle: explicite.cle,
			libelle: libelle ?? explicite.libelle,
			zone: {
				selecteur: explicite.selecteur,
				index: 0,
				declencheur: explicite.declencheur ?? null
			},
			app: null
		});
	}

	for (const collection of descripteur.collections ?? []) {
		const lus = await page.evaluate(
			({ items, cleAttribut, libelleSelecteur }) => {
				const texte = (n) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
				return [...document.querySelectorAll(items)].map((n) => {
					let cle = null;
					if (cleAttribut) {
						const porteur = cleAttribut.selecteur ? n.querySelector(cleAttribut.selecteur) : n;
						cle = porteur?.getAttribute(cleAttribut.attribut) ?? null;
					}
					return { cle, libelle: texte(n.querySelector(libelleSelecteur)) };
				});
			},
			{
				items: collection.items,
				cleAttribut: collection.cleAttribut ?? null,
				libelleSelecteur: collection.libelleSelecteur
			}
		);
		lus.forEach((lu, index) => {
			const base = lu.cle ?? cleDepuisLibelle(lu.libelle);
			etats.push({
				cle: collection.prefixe ? `${collection.prefixe}-${base}` : base,
				libelle: lu.libelle,
				zone: {
					selecteur: collection.items,
					index,
					declencheur: collection.declencheurs
						? { selecteur: collection.declencheurs, index }
						: null
				},
				app: null
			});
		});
	}

	return etats;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCTION
   ═══════════════════════════════════════════════════════════════════════ */
async function produire() {
	const verifier = process.argv.includes('--verifier');
	mkdirSync(DOSSIER_SCENARIOS, { recursive: true });
	mkdirSync(DOSSIER_RAPPORTS, { recursive: true });

	const serveur = await servir(RACINE_MAQUETTES);
	const navigateur = await chromium.launch();
	const contexte = await navigateur.newContext(optionsContexte(FENETRE_PRINCIPALE));
	const page = await contexte.newPage();

	const declare = declareParRoutes();
	const divergences = [];
	const resume = [];
	let ecrits = 0;
	let differents = 0;

	for (const { vue, fichier, chemin } of vues()) {
		await page.goto(`${serveur.origine}/${fichier}`, { waitUntil: 'load' });
		await page.waitForTimeout(400);

		const titre = await page.title();
		const fieldsets = await lirePlanche(page);
		const etatsPlanche = fieldsets ? etatsDePlanche(fieldsets) : [];
		const etatsZone = ZONES[vue] ? await lireZones(page, ZONES[vue]) : [];
		const etats = [...etatsPlanche, ...etatsZone];

		const attendu = declare.get(vue);
		if (!attendu) {
			divergences.push({ vue, motif: '`docs/routes.md` ne déclare pas cette vue' });
		} else if (attendu.etats !== etats.length) {
			divergences.push({
				vue,
				motif: 'décompte d’états',
				routes_md: attendu.etats,
				extraction: etats.length,
				detail: `${etatsPlanche.length} de planche + ${etatsZone.length} de zone`
			});
		}

		const contenu = {
			vue,
			titre,
			maquette: `mockups/${fichier}`,
			empreinte: empreinte(chemin),
			planche: fieldsets !== null,
			zones: ZONES[vue] ? ZONES[vue].source : null,
			routes: attendu?.routes ?? [],
			fenetres: fenetresDe(vue),
			extraction: {
				produit_par: 'verif/extraire-scenarios.mjs',
				regle:
					'un état par position de contrôle de la planche (réglage par défaut dévié d’un seul contrôle), plus une entrée par zone présentée côte à côte dans la page',
				volet_app:
					'`app` reste null, et par construction : ce fichier est dérivé mécaniquement de la maquette gelée, et `pnpm scenarios:verifier` le prouve en le régénérant — la maquette ne déclare rien de l’application. Le protocole d’état côté application vit dans `verif/references/protocole-app.json`, en écriture humaine seule : route `/__design/{vue}?etat={cle}` du mode démo (règles/workflow_agentic.md annexe F, verif/banc/mode-demo.mjs). Voir ECART-011 É-1 et É-9.'
			},
			controles: fieldsets ?? null,
			defaut: fieldsets ? vecteurParDefaut(fieldsets) : null,
			etats
		};

		const cible = join(DOSSIER_SCENARIOS, `${vue}.json`);
		// Mis en forme par Prettier, comme tout le dépôt : un livrable que
		// `pnpm check` refuserait ne serait pas un livrable.
		const rendu = await format(JSON.stringify(contenu), {
			...(await resolveConfig(cible)),
			filepath: cible
		});
		const ancien = existsSync(cible) ? readFileSync(cible, 'utf8') : null;
		if (verifier) {
			if (ancien !== rendu) {
				differents++;
				console.error(`  ${vue} — le scénario du dépôt diverge de l’extraction`);
			}
		} else if (ancien !== rendu) {
			writeFileSync(cible, rendu);
			ecrits++;
		}

		resume.push({
			vue,
			planche: fieldsets !== null,
			planche_etats: etatsPlanche.length,
			zone_etats: etatsZone.length,
			total: etats.length,
			routes_md: attendu?.etats ?? null,
			fenetres: fenetresDe(vue).length
		});
	}

	await navigateur.close();
	await serveur.fermer();

	const total = resume.reduce((s, r) => s + r.total, 0);
	const totalPlanche = resume.reduce((s, r) => s + r.planche_etats, 0);
	const totalZone = resume.reduce((s, r) => s + r.zone_etats, 0);
	const totalRoutes = [...declare.values()].reduce((s, e) => s + e.etats, 0);

	console.log('\nExtraction des scénarios — maquettes gelées\n');
	console.log('  vue     planche  zone  total  routes.md  fenêtres');
	for (const r of resume) {
		const marque = r.routes_md !== null && r.routes_md !== r.total ? ' ⚠' : '';
		console.log(
			`  ${r.vue}   ${String(r.planche_etats).padStart(6)}  ${String(r.zone_etats).padStart(4)}  ` +
				`${String(r.total).padStart(5)}  ${String(r.routes_md ?? '—').padStart(9)}  ${String(r.fenetres).padStart(8)}${marque}`
		);
	}
	console.log(
		`\n  Total : ${total} états (${totalPlanche} de planche, ${totalZone} de zone). ` +
			`docs/routes.md : ${totalRoutes}.`
	);

	if (divergences.length) {
		console.log(
			`\n  ${divergences.length} divergence(s) avec docs/routes.md — signalées, non tranchées :`
		);
		for (const d of divergences) {
			console.log(
				`    ${d.vue} — ${d.motif}` +
					(d.routes_md !== undefined
						? ` : routes.md ${d.routes_md}, extraction ${d.extraction} (${d.detail})`
						: '')
			);
		}
	}

	writeFileSync(
		join(DOSSIER_RAPPORTS, 'inventaire-etats.json'),
		JSON.stringify(
			{ resume, divergences, total, totalPlanche, totalZone, totalRoutes },
			null,
			'\t'
		) + '\n'
	);

	if (verifier) {
		if (differents > 0) {
			console.error(
				`\nextraire-scenarios --verifier — ÉCHEC : ${differents} scénario(s) divergent.\n`
			);
			process.exit(1);
		}
		console.log(
			'\nextraire-scenarios --verifier — les scénarios du dépôt sont ceux de la maquette.\n'
		);
	} else {
		console.log(`\n  ${ecrits} fichier(s) de scénario écrits dans verif/scenarios/.\n`);
	}
}

await produire();
