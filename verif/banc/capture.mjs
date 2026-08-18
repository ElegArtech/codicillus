/**
 * Banc de comparaison visuelle — la capture d'un état.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier. Élargir une
 * condition de capture pour obtenir du vert est le contournement nommé par
 * PLAN §12.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LE POINT DÉCISIF : UN SEUL CHEMIN DE CAPTURE
 *
 * PLAN §4.2 exige des conditions « identiques des deux côtés ». La seule
 * manière de le garantir n'est pas de régler deux harnais à l'identique —
 * deux réglages jumeaux divergent au premier oubli — c'est de n'en avoir
 * qu'un. `mesurer()` sert la maquette gelée ET, le jour venu, l'application.
 * Ce qui change entre les deux côtés est l'ADRESSE et le moyen d'atteindre
 * l'état ; rien d'autre.
 *
 * COROLLAIRE : PAS DE BASELINE EN PNG. La référence n'est pas une image
 * archivée, c'est la maquette gelée elle-même, re-rendue à chaque exécution
 * dans le même navigateur que le candidat. Une baseline archivée vieillit :
 * elle porte la fonderie, le moteur de rendu et les arrondis du jour où elle a
 * été prise, et la première montée de version du navigateur fait rougir tout
 * le corpus sans qu'aucune vue n'ait bougé. L'intégrité de la référence est
 * assurée autrement, et mieux : par `pnpm verif:gel`.
 */
import {
	preparerAvantNavigation,
	stabiliser,
	avancer,
	AVANCE_ETAT_MS,
	optionsContexte
} from './conditions.mjs';

/**
 * Ouvre une page prête à capturer, à une adresse donnée.
 *
 * UN CONTEXTE NEUF PAR ÉTAT, et non une page réutilisée d'un état à l'autre.
 * C'est plus cher, et c'est la seule façon d'avoir un banc qui ne mente pas :
 * les maquettes gardent de la mémoire — pile de notifications, stockage local
 * du rail (`codicillus.rail.deplies`, V-37:3110), aide de première visite
 * (`codicillus.aide.recherche`, V-07:3882). Sur une page réutilisée, l'écran
 * d'un état dépendrait de l'état capturé juste avant, donc de l'ordre de
 * parcours. Un état doit être atteignable depuis un chargement propre, sans
 * quoi l'application n'a aucun moyen de le reproduire.
 */
export async function ouvrirPage(navigateur, adresse, fenetre) {
	const contexte = await navigateur.newContext(optionsContexte(fenetre));
	const page = await contexte.newPage();
	await preparerAvantNavigation(page);
	await page.goto(adresse, { waitUntil: 'load' });
	await stabiliser(page);
	return { page, contexte };
}

/**
 * Règle la planche de revue sur le vecteur complet d'un état.
 *
 * Le vecteur est appliqué EN ENTIER, jamais en delta : un état est un réglage
 * complet de la planche, sinon l'ordre de parcours des états déterminerait le
 * rendu, et deux exécutions du même état donneraient deux écrans.
 */
export async function reglerPlanche(page, vecteur) {
	await page.evaluate((v) => {
		for (const [nom, valeur] of Object.entries(v)) {
			if (typeof valeur === 'boolean') {
				const c = document.getElementById(nom);
				if (!c) throw new Error(`planche : case « ${nom} » introuvable`);
				if (c.checked !== valeur) {
					c.checked = valeur;
					c.dispatchEvent(new Event('change', { bubbles: true }));
				}
			} else {
				const r = document.querySelector(`.planche input[name="${nom}"][value="${valeur}"]`);
				if (!r) throw new Error(`planche : position « ${nom}=${valeur} » introuvable`);
				if (!r.checked) {
					r.checked = true;
					r.dispatchEvent(new Event('change', { bubbles: true }));
				}
			}
		}
	}, vecteur);
	await avancer(page, AVANCE_ETAT_MS);
}

/** Referme toute superposition ouverte, pour repartir d'un état propre. */
export async function refermerSuperpositions(page) {
	await page.evaluate(() => {
		document.querySelectorAll('dialog[open]').forEach((d) => d.close());
	});
}

/**
 * Mesure un état : le relevé de structure du niveau 1 et la capture du
 * niveau 2, pris sur le MÊME état du DOM, en une seule fois.
 *
 * La planche est retirée du DOM le temps de la mesure, puis remise en place :
 * retirée comme l'exige PLAN §4.2 — et pas seulement masquée, car une planche
 * masquée resterait dans l'arbre d'accessibilité que compare le niveau 1 —
 * sans interdire au passage de capturer l'état suivant sur la même page.
 */
export async function mesurer(page, { zone, masques }) {
	const planchesRetirees = await page.evaluate(() => {
		const gardees = [];
		document.querySelectorAll('.planche').forEach((n) => {
			gardees.push({ n, parent: n.parentNode, suivant: n.nextSibling });
			n.remove();
		});
		window.__planchesRetirees = gardees;
		return gardees.length;
	});

	const racine = zone ? page.locator(zone.selecteur).nth(zone.index) : page.locator('body');
	const aria = await racine.ariaSnapshot();
	const tabulation = await ordreDeTabulation(page, zone);

	const options = {
		animations: 'disabled',
		caret: 'hide',
		scale: 'css',
		mask: (masques ?? []).map((s) => page.locator(s)),
		maskColor: '#ff00ff'
	};
	const png = zone
		? await racine.screenshot(options)
		: await page.screenshot({ ...options, fullPage: true });

	await page.evaluate(() => {
		for (const { n, parent, suivant } of window.__planchesRetirees ?? []) {
			parent.insertBefore(n, suivant);
		}
		window.__planchesRetirees = [];
	});

	return { aria, tabulation, png, planchesRetirees };
}

/* ═══════════════════════════════════════════════════════════════════════════
   NIVEAU 1 — LA STRUCTURE

   Deux relevés. L'instantané ARIA est produit par le moteur d'accessibilité du
   navigateur lui-même : il porte les repères, les rôles, les noms accessibles,
   la hiérarchie des titres et l'ordre des blocs nommés. L'ordre de tabulation
   ne s'y trouve pas ; il est reconstitué ici, selon la règle du HTML — les
   `tabindex` positifs d'abord, par ordre croissant, puis l'ordre du document.
   ═══════════════════════════════════════════════════════════════════════ */
async function ordreDeTabulation(page, zone) {
	return page.evaluate((z) => {
		const hote = z
			? document.querySelectorAll(z.selecteur)[z.index]
			: (document.querySelector('dialog[open]') ?? document.body);
		if (!hote) return [];
		const SELECTEUR = [
			'a[href]',
			'button',
			'input',
			'select',
			'textarea',
			'summary',
			'[tabindex]',
			'[contenteditable="true"]'
		].join(',');
		const candidats = [...hote.querySelectorAll(SELECTEUR)].filter((e) => {
			if (e.disabled || e.hidden) return false;
			if (e.getAttribute('tabindex') === '-1') return false;
			if (e.type === 'hidden') return false;
			if (e.closest('[inert]') || e.closest('[aria-hidden="true"]')) return false;
			const style = getComputedStyle(e);
			if (style.display === 'none' || style.visibility === 'hidden') return false;
			return e.offsetParent !== null || style.position === 'fixed';
		});
		const positif = candidats
			.filter((e) => Number(e.getAttribute('tabindex')) > 0)
			.sort((a, b) => Number(a.getAttribute('tabindex')) - Number(b.getAttribute('tabindex')));
		const naturel = candidats.filter((e) => !(Number(e.getAttribute('tabindex')) > 0));
		const nom = (e) =>
			(
				e.getAttribute('aria-label') ??
				(e.getAttribute('aria-labelledby')
					? (document.getElementById(e.getAttribute('aria-labelledby'))?.textContent ?? '')
					: null) ??
				e.textContent ??
				e.getAttribute('placeholder') ??
				e.getAttribute('title') ??
				''
			)
				.replace(/\s+/g, ' ')
				.trim()
				.slice(0, 60);
		return [...positif, ...naturel].map(
			(e) => `${e.tagName.toLowerCase()}${e.type ? `[${e.type}]` : ''} « ${nom(e)} »`
		);
	}, zone ?? null);
}
