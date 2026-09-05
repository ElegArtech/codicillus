/**
 * LE RENDU GRAPHIQUE DES DIAGRAMMES — LA MOITIÉ CLIENT DE `rendu.ts`.
 *
 * Le serveur émet `<pre class="mermaid">` avec la source dedans (`rendreDiagramme`,
 * `rendu.ts`), et l'éditeur en émet un identique dans sa vue de nœud
 * (`vueDeDiagramme`, `edition/editeur-client.ts`). PERSONNE NE LE RENDAIT : `mermaid`
 * était en dépendance depuis le début et n'était importé nulle part. Une note qui
 * décrivait un schéma affichait sa source en texte brut, et « Agrandir » ouvrait une
 * boîte vide — la loupe cherche un `svg` (`notes/[identifiant]/cablage.ts`) qu'aucun
 * code ne produisait. Les quatre feuilles de vue qui portent déjà
 * `.loupe__boite svg { width: 100% }` disent que le graphique était attendu là.
 *
 * LE MOTEUR EST CHARGÉ À LA DEMANDE, ET SEULEMENT S'IL Y A UN DIAGRAMME À L'ÉCRAN :
 * mermaid pèse près d'un mégaoctet, et la grande majorité des notes n'en porte pas.
 *
 * LA SOURCE N'EST JAMAIS PERDUE. Le `<pre>` reste dans le document, masqué quand le
 * dessin a pris sa place, VISIBLE quand la source est invalide : une syntaxe fautive
 * doit se lire pour se corriger, elle ne doit pas effacer ce que l'auteur a écrit.
 */

/** Ce qu'un appel de câblage rend pour se défaire. */
export type Debranchement = () => void;

/** Le témoin posé sur un `<pre>` déjà traité — `rendu` ou `erreur`, jamais deux fois. */
const TEMOIN = 'data-diagramme';

/** Les conteneurs que le serveur et l'éditeur émettent, et qui attendent leur dessin. */
const SELECTEUR = `pre.mermaid:not([${TEMOIN}])`;

/**
 * LE MOTEUR, CHARGÉ UNE FOIS. La promesse elle-même est le verrou : deux appels
 * concurrents (la page monte, l'éditeur insère) partagent le même chargement.
 */
let moteur: Promise<typeof import('mermaid').default> | null = null;

/** Le numéro de dessin — mermaid exige un identifiant unique par rendu. */
let numero = 0;

/**
 * LA CHAÎNE DE RENDU. `mermaid.render` pose un élément de mesure dans le document le
 * temps de son calcul ; deux rendus simultanés se marchent dessus. Les appels
 * s'enfilent donc les uns derrière les autres.
 */
let file: Promise<void> = Promise.resolve();

/**
 * LES COULEURS DU DESSIN VIENNENT DE LA FEUILLE, PAS D'UNE PALETTE DE MERMAID. Les
 * jetons sont ceux de `src/socle.css` ; s'ils manquent — page d'erreur, feuille non
 * montée — le repli est la valeur nominale du socle, jamais le thème par défaut de
 * mermaid, qui est lilas sur blanc et n'appartient à aucun écran du produit.
 */
function jetons(fenetre: Window): Record<string, string> {
	const feuille = fenetre.getComputedStyle(fenetre.document.documentElement);
	const jeton = (nom: string, repli: string): string => {
		const valeur = feuille.getPropertyValue(nom).trim();
		return valeur === '' ? repli : valeur;
	};
	const encre = jeton('--c-encre', '#16222b');
	const trait = jeton('--c-trait-fort', '#9aa7a3');
	const accent = jeton('--c-accent', '#453ba0');
	const papier = jeton('--c-papier', '#fcfbf8');
	return {
		background: jeton('--c-papier-2', '#f5f4ef'),
		primaryColor: jeton('--c-accent-voile', '#edecf8'),
		primaryTextColor: encre,
		primaryBorderColor: jeton('--c-accent-trait', '#c9c5e8'),
		secondaryColor: papier,
		secondaryTextColor: encre,
		secondaryBorderColor: trait,
		tertiaryColor: jeton('--c-fond-creux', '#d3d9d6'),
		tertiaryTextColor: encre,
		tertiaryBorderColor: trait,
		lineColor: jeton('--c-encre-2', '#46585f'),
		textColor: encre,
		mainBkg: jeton('--c-accent-voile', '#edecf8'),
		nodeBorder: jeton('--c-accent-trait', '#c9c5e8'),
		clusterBkg: papier,
		clusterBorder: trait,
		titleColor: encre,
		edgeLabelBackground: papier,
		noteBkgColor: jeton('--c-alerte-voile', '#f6eedd'),
		noteTextColor: encre,
		noteBorderColor: jeton('--c-alerte', '#8f5c00'),
		actorBkg: jeton('--c-accent-voile', '#edecf8'),
		actorBorder: jeton('--c-accent-trait', '#c9c5e8'),
		actorTextColor: encre,
		signalColor: encre,
		signalTextColor: encre,
		labelBoxBkgColor: papier,
		labelBoxBorderColor: trait,
		labelTextColor: encre,
		loopTextColor: encre,
		activationBorderColor: accent,
		activationBkgColor: papier,
		sequenceNumberColor: papier
	};
}

/**
 * LE MOTEUR ET SA CONFIGURATION.
 *
 * `startOnLoad: false` — RIEN n'est rendu dans le dos de ce module ; mermaid balaierait
 * sinon le document entier au chargement de son propre script, y compris le `<pre>` que
 * l'éditeur reconstruit à chaque frappe.
 *
 * `securityLevel: 'strict'` — une source de diagramme est du texte d'auteur, et un
 * libellé peut contenir du balisage. En `strict`, mermaid échappe le HTML des libellés
 * et passe sa sortie à DOMPurify ; en `loose`, un libellé serait exécuté.
 */
async function charger(fenetre: Window): Promise<typeof import('mermaid').default> {
	moteur ??= import('mermaid').then((module) => {
		const mermaid = module.default;
		mermaid.initialize({
			startOnLoad: false,
			/* MERMAID DESSINE SA PROPRE BOMBE QUAND UNE SOURCE EST FAUTIVE, et il la
			   pose DANS LE CORPS DU DOCUMENT, hors de la note : une syntaxe erronée
			   affichait « Syntax error in text » en pied de page, à un mètre du
			   diagramme concerné, sans lien avec lui. L'erreur se dit là où elle est —
			   la source reste visible à sa place, et `marquerEnErreur` la signale. */
			suppressErrorRendering: true,
			securityLevel: 'strict',
			theme: 'base',
			themeVariables: jetons(fenetre),
			fontFamily: fenetre
				.getComputedStyle(fenetre.document.documentElement)
				.getPropertyValue('--f-ui')
				.trim(),
			flowchart: { htmlLabels: false, useMaxWidth: true },
			sequence: { useMaxWidth: true },
			gantt: { useMaxWidth: true }
		});
		return mermaid;
	});
	return moteur;
}

/**
 * LE DESSIN PREND LA PLACE DE LA SOURCE — en frère, non en remplacement : le `<pre>`
 * porte le texte que l'export et la copie relisent, et le masquer suffit.
 *
 * L'ALTERNATIVE TEXTUELLE SUIT LE DESSIN (`P-06`) : `role="img"` et `aria-label`
 * passent du `<pre>` au conteneur du graphique, sans quoi le lecteur d'écran
 * annoncerait un dessin muet.
 *
 * LA LARGEUR MAXIMALE QUE MERMAID ÉCRIT EN LIGNE SUR LE `<svg>` MONTE SUR LE
 * CONTENEUR. Laissée sur le dessin, elle bat toute règle de feuille — un style en
 * ligne n'a pas de rival —, et la loupe, qui CLONE le `<svg>` seul, rouvrait le
 * diagramme à sa taille d'origine : « Agrandir » n'agrandissait rien.
 */
function poser(pre: HTMLElement, balisage: string): HTMLElement {
	const document = pre.ownerDocument;
	const dessin = document.createElement('div');
	dessin.className = 'diagramme';
	dessin.setAttribute('role', 'img');
	dessin.setAttribute('aria-label', pre.getAttribute('aria-label') ?? '');
	dessin.innerHTML = balisage;
	const svg = dessin.querySelector('svg');
	if (svg !== null) {
		const plafond = svg.style.maxWidth;
		if (plafond !== '') dessin.style.maxWidth = plafond;
		svg.style.maxWidth = '';
		/* AUCUNE LARGEUR N'EST ÉCRITE EN LIGNE SUR LE DESSIN — c'est `src/diagramme.css`
		   qui la donne, en place comme dans la loupe. Un style en ligne n'a pas de
		   rival : `width: 100%` posé ici battait la règle de la loupe, et le dessin
		   agrandi se résolvait à la largeur d'une boîte qui se dimensionne sur lui. */
		svg.removeAttribute('role');
		svg.setAttribute('aria-hidden', 'true');
		/* LE TÉMOIN VOYAGE AVEC LE DESSIN. La loupe CLONE le `<svg>` seul, sans son
		   conteneur : c'est la seule marque qui survive au clonage, et la feuille s'en
		   sert pour donner au dessin agrandi une largeur qu'il puisse remplir. Sans
		   elle, le `width: 100%` du dessin se résolvait contre une boîte qui se
		   dimensionne sur son contenu, et « Agrandir » RAPETISSAIT le diagramme. */
		svg.setAttribute('data-diagramme', 'oui');
	}
	pre.hidden = true;
	pre.removeAttribute('role');
	pre.removeAttribute('aria-label');
	pre.after(dessin);
	return dessin;
}

/** Le `<pre>` d'un diagramme dont la source ne s'analyse pas : il reste lisible. */
function marquerEnErreur(pre: HTMLElement, cause: unknown): void {
	pre.setAttribute(TEMOIN, 'erreur');
	pre.hidden = false;
	pre.dataset.diagrammeCause = cause instanceof Error ? cause.message : String(cause);
}

/**
 * REND TOUS LES DIAGRAMMES ENCORE EN TEXTE SOUS `racine`.
 *
 * Idempotent : un conteneur déjà traité porte son témoin et n'est plus vu. Sans
 * diagramme à l'écran, la fonction sort AVANT de charger le moteur.
 */
export async function rendreLesDiagrammes(racine: ParentNode): Promise<void> {
	const attente = Array.from(racine.querySelectorAll<HTMLElement>(SELECTEUR));
	if (attente.length === 0) return;
	const fenetre = attente[0]?.ownerDocument.defaultView ?? null;
	if (fenetre === null) return;

	/* Le témoin est posé AVANT le premier `await` : deux balayages qui se croisent —
	   l'observateur voit la mutation que ce rendu vient d'écrire — dessineraient
	   sinon deux fois le même diagramme. */
	for (const pre of attente) pre.setAttribute(TEMOIN, 'rendu');

	const travail = file.then(async () => {
		let mermaid: typeof import('mermaid').default;
		try {
			mermaid = await charger(fenetre);
		} catch (cause) {
			/* Le moteur n'a pas pu être chargé — hors ligne, ressource bloquée. Les
			   sources redeviennent des sources, et l'écran reste lisible. */
			for (const pre of attente) marquerEnErreur(pre, cause);
			return;
		}
		for (const pre of attente) {
			/* Le conteneur a pu quitter le document pendant l'attente : l'éditeur
			   reconstruit ses vues de nœud, une navigation démonte la page. */
			if (!pre.isConnected) continue;
			const source = (pre.textContent ?? '').trim();
			if (source === '') {
				marquerEnErreur(pre, 'source vide');
				continue;
			}
			try {
				numero += 1;
				const { svg, bindFunctions } = await mermaid.render(`diagramme-${String(numero)}`, source);
				if (!pre.isConnected) continue;
				const dessin = poser(pre, svg);
				bindFunctions?.(dessin);
			} catch (cause) {
				marquerEnErreur(pre, cause);
			}
		}
	});
	file = travail.catch(() => {});
	return travail;
}

/**
 * SUIT LE DOCUMENT ET REND CE QUI APPARAÎT.
 *
 * Un seul point de câblage, dans la mise en page racine, plutôt qu'un appel dans
 * chacune des six routes qui affichent un corps rédigé — V-03, V-14, V-15, V-17,
 * V-18, V-31 : celle qu'on oublierait n'aurait pas de dessin, et la septième à venir
 * non plus. Le motif est celui de `cablerLaCoquille`, délégué sur le document.
 *
 * L'ÉDITEUR EST LA RAISON DE L'OBSERVATEUR, pas la navigation : ProseMirror
 * reconstruit la vue de nœud d'un diagramme à chaque changement de sa source, et le
 * `<pre>` neuf n'a pas de témoin.
 *
 * LE RENDU EST LUI-MÊME UNE MUTATION, et il ne boucle pas : le témoin est posé avant
 * que le dessin n'entre dans le document, le balayage suivant ne trouve donc rien.
 * Un cadre d'animation regroupe les rafales de frappe.
 */
export function observerLesDiagrammes(document: Document): Debranchement {
	const fenetre = document.defaultView;
	if (fenetre === null) return () => {};
	let demande: number | null = null;
	let vivant = true;

	const balayer = (): void => {
		demande = null;
		if (!vivant) return;
		void rendreLesDiagrammes(document);
	};
	const programmer = (): void => {
		if (demande !== null || !vivant) return;
		demande = fenetre.requestAnimationFrame(balayer);
	};

	const observateur = new fenetre.MutationObserver(programmer);
	observateur.observe(document.body, { childList: true, subtree: true });
	programmer();

	return () => {
		vivant = false;
		if (demande !== null) fenetre.cancelAnimationFrame(demande);
		observateur.disconnect();
	};
}
