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
	optionsContexte,
	BLOCS_HORS_PRODUIT
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
	// Le code de réponse est rendu à l'appelant : côté application, une page
	// d'erreur se compare aussi bien qu'une vue, et le banc rougirait alors
	// pour une raison qui n'a rien à voir avec le rendu. C'est au banc de
	// refuser, en citant ce que le serveur a répondu.
	const reponse = await page.goto(adresse, { waitUntil: 'load' });
	await stabiliser(page);
	return { page, contexte, statut: reponse?.status() ?? null };
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
 * Les blocs que la maquette DÉCLARE hors produit sont retirés du DOM le temps
 * de la mesure, puis remis en place : retirés comme l'exige PLAN §4.2 — et pas
 * seulement masqués, car un bloc masqué resterait dans l'arbre
 * d'accessibilité que compare le niveau 1 — sans interdire au passage de
 * capturer l'état suivant sur la même page. La liste et son recensement sur
 * les 41 maquettes sont dans `conditions.mjs`, `BLOCS_HORS_PRODUIT`.
 *
 * TROIS SURFACES POSSIBLES, ET UNE SEULE PAR ÉTAT.
 *
 *   • `zones` non vide — les ZONES COMPARÉES déclarées par la vue (ARB-012).
 *     Un relevé par zone, tous rendus. Les deux niveaux jugent alors le même
 *     objet, parce qu'ils lisent la même liste.
 *   • `zone` — la zone d'un état présenté CÔTE À CÔTE dans la page (V-09,
 *     V-35, V-38…). C'est un état, pas une restriction de verdict.
 *   • ni l'un ni l'autre — la page entière. C'est le défaut, et c'est le plus
 *     strict.
 *
 * @returns {{ releves: {nom: string, aria: string, tabulation: string[], png: Buffer}[],
 *             blocsRetires: number }}
 */
export async function mesurer(page, { zone = null, zones = [], masques = [] }) {
	if (zone && zones.length) {
		throw new Error(
			'banc : un état ne peut pas être à la fois une zone côte à côte et une vue à ' +
				'zones comparées — la surface jugée serait ambiguë.'
		);
	}

	const blocsRetires = await page.evaluate((selecteurs) => {
		const gardes = [];
		for (const s of selecteurs) {
			document.querySelectorAll(s).forEach((n) => {
				gardes.push({ n, parent: n.parentNode, suivant: n.nextSibling });
				n.remove();
			});
		}
		window.__blocsHorsProduit = gardes;
		return gardes.length;
	}, BLOCS_HORS_PRODUIT);

	const cibles = zones.length
		? zones.map((selecteur) => ({ nom: selecteur, selecteur, index: 0 }))
		: [zone ? { nom: `${zone.selecteur}#${zone.index}`, ...zone } : { nom: 'page' }];

	const options = {
		animations: 'disabled',
		caret: 'hide',
		scale: 'css',
		mask: (masques ?? []).map((s) => page.locator(s)),
		maskColor: '#ff00ff'
	};

	const releves = [];
	for (const cible of cibles) {
		if (cible.selecteur) {
			// Une zone déclarée qui n'existe pas dans le DOM ferait comparer du
			// vide à du vide, et le banc sortirait en vert sans avoir rien
			// regardé. On refuse bruyamment (PLAN §12, RA-01).
			const combien = await page.locator(cible.selecteur).count();
			if (combien <= cible.index) {
				throw new Error(
					`banc : la zone « ${cible.selecteur} » (rang ${cible.index}) est absente du DOM — ` +
						`${combien} élément(s) trouvé(s). Comparer une zone inexistante sortirait en vert ` +
						'sans rien mesurer.'
				);
			}
		}
		const racine = cible.selecteur
			? page.locator(cible.selecteur).nth(cible.index)
			: page.locator('body');

		// UNE ZONE PEUT NE PAS ÊTRE RENDUE, ET C'EST UN FAIT À COMPARER.
		// `aside.rail` de V-37 est en `display: none` sous 1240 px, sans
		// contre-règle (ARB-010) : la zone existe dans le document et n'occupe
		// aucune surface. La capturer échouerait ; l'ignorer serait pire — le
		// banc laisserait passer une application qui, elle, l'afficherait. On
		// relève donc la NON-RESTITUTION comme une propriété du côté mesuré, et
		// c'est la comparaison qui exige que les deux côtés soient d'accord.
		const rendu = cible.selecteur ? await racine.isVisible() : true;
		releves.push({
			nom: cible.nom,
			rendu,
			aria: await sansZonesMasquees(page, sansAdresses(await racine.ariaSnapshot()), masques),
			tabulation: await ordreDeTabulation(page, cible.selecteur ? cible : null),
			png: !rendu
				? null
				: cible.selecteur
					? await racine.screenshot(options)
					: await page.screenshot({ ...options, fullPage: true })
		});
	}

	await page.evaluate(() => {
		for (const { n, parent, suivant } of window.__blocsHorsProduit ?? []) {
			parent.insertBefore(n, suivant);
		}
		window.__blocsHorsProduit = [];
	});

	return { releves, blocsRetires };
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
		/* ÉCART-028 — un CONTRÔLE DE FORMULAIRE ne se nomme jamais par son
		   `textContent`. C'était un défaut de l'instrument, et il rendait le
		   niveau 1 INSATISFIABLE par un squelette sans script :

		   la maquette pose la valeur d'un `<textarea>` par propriété
		   (`f-desc.value = …`), donc son `textContent` reste VIDE ; une
		   application statique n'a que le contenu du nœud pour porter cette
		   valeur — et l'instantané ARIA du niveau 1 l'EXIGE. Les deux relevés
		   du même niveau se contredisaient : valeur ⇒ `textContent` non vide.

		   L'asymétrie était dans l'instrument, pas dans les vues : un
		   `<input value="…">` ne posait pas la question, son contenu étant vide.
		   Cinq vues sont concernées — V-27 à V-31, état `form-edition` —, et
		   TROIS LOTS INDÉPENDANTS l'ont diagnostiqué sans emprunter le
		   contournement qu'ils avaient pourtant identifié (poser `aria-label=""`,
		   qui aurait fait taire le relevé sans rien changer au rendu). */
		const CONTROLES = ['input', 'textarea', 'select'];
		const nom = (e) =>
			(
				e.getAttribute('aria-label') ??
				(e.getAttribute('aria-labelledby')
					? (document.getElementById(e.getAttribute('aria-labelledby'))?.textContent ?? '')
					: null) ??
				(CONTROLES.includes(e.tagName.toLowerCase()) ? null : e.textContent) ??
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

/* ─────────────────────────────────────────────────────────────────────────────
   ARB-013 — les adresses sont retirées de l'instantané ARIA avant comparaison.

   Motif, et il est de fait, pas de confort : les 41 maquettes gelées ne portent
   AUCUNE liaison. Sur 681 attributs href des fichiers de vue, 681 valent « # » —
   zéro lien inter-vue. C'est un artefact du régime assisté, où chaque vue a été
   produite isolément, jamais une décision de conception (ECART-003).

   Comparer /url reviendrait donc à exiger de l'application qu'elle porte des
   liens morts pour rester conforme : la référence imposerait au produit un
   défaut qu'elle ne tient elle-même que par accident de fabrication.

   L'autorité sur les adresses est `docs/routes.md`, dérivation tracée et
   arbitrée (ARB-001, ARB-002, ARB-003, ARB-007). C'est elle qui les vérifie,
   pas le banc.

   Portée strictement bornée : SEULES les lignes « /url: … » sont retirées. Rôles,
   repères, noms accessibles, hiérarchie des titres et ordre des blocs restent
   comparés sans tolérance — le niveau 1 demeure un échec sec.
   ───────────────────────────────────────────────────────────────────────────── */
function sansAdresses(instantane) {
	return (
		instantane
			.split('\n')
			/* ÉCART-025 É-1 — le motif d'origine, /^\s*\/url:/, N'A JAMAIS RETIRÉ UNE LIGNE.
		   Playwright imprime l'instantané en liste : « - /url: /reel », avec un tiret
		   que le motif ne prévoyait pas. ARB-013 était donc INERTE depuis sa pose, et
		   personne ne l'a vu parce que les quatre vues livrées portent toutes des
		   href="#", comme le gel : la ligne comparée était identique des deux côtés.
		   Le premier lot à câbler une adresse réelle l'a découvert — 6 des 7 états de
		   V-10 échouaient au niveau 1 sur cette seule ligne.
		   Une règle qu'aucun cas n'exerce est une règle dont on ignore si elle marche. */
			.filter((ligne) => !/^\s*-?\s*\/url:/.test(ligne))
			.join('\n')
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   ÉCART-028 — un masque doit valoir pour les DEUX niveaux.

   `verif/masques.json` déclare les zones qu'aucune implémentation ne peut
   reproduire — le mot de passe temporaire de V-32, tiré par `Math.random()`.
   Le masque était passé à `page.screenshot({ mask })` : il ne couvrait donc
   QUE le niveau 2. Le niveau 1 compare les instantanés ARIA caractère par
   caractère, et la valeur y figurait — deux états de V-32 échouaient sur elle.

   Un masque qui ne vaut qu'à moitié est pire qu'un masque absent : il donne
   l'illusion que la zone est neutralisée, et le lot cherche la cause ailleurs.

   Le texte des zones masquées est remplacé par un jeton constant, IDENTIQUE
   des deux côtés — jamais retiré, sans quoi la présence du nœud cesserait
   d'être comparée.
   ───────────────────────────────────────────────────────────────────────────── */
async function sansZonesMasquees(page, instantane, masques) {
	if (!masques?.length) return instantane;
	const textes = await page.evaluate(
		(sels) =>
			sels
				.flatMap((s) => [...document.querySelectorAll(s)])
				/* Un contrôle de formulaire porte sa valeur dans `value`, jamais dans
				   son contenu — c'est la même asymétrie que celle qui rendait le
				   niveau 1 insatisfiable (voir `nom()` ci-dessus). */
				.map((e) =>
					(
						(e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement
							? e.value
							: e.textContent) ?? ''
					)
						.replace(/\s+/g, ' ')
						.trim()
				)
				.filter((x) => x.length > 2),
		masques
	);
	let sortie = instantane;
	for (const texte of textes) {
		sortie = sortie.split(texte).join('‹masqué›');
	}
	return sortie;
}
