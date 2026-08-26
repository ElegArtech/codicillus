/**
 * LE CÂBLAGE DES TROIS ACTIONS DE V-18 — ce qui relie les boutons du gel aux
 * actions nommées de cette route.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NON DANS `$lib/cablage/formulaires.ts`
 *
 * Ce module est le voisin de `cablerLEditeur()`, et il en partage la doctrine —
 * `ARB-063` : les vues de `src/vues/` sont des transcriptions du gel, sans
 * `method`, sans `action`, sans attribut de nom, et le comportement vit dans la
 * route. `verif:maquette:app` ne traverse jamais ce fichier : le mode de
 * conception rend les composants, pas les routes.
 *
 * Il n'est pas ÉCRIT dans `$lib/cablage/formulaires.ts` parce que ce fichier
 * appartient à un lot concurrent de cette campagne, et qu'un même fichier
 * touché par deux copies de travail ne se rapatrie pas (`P-24`, corollaire).
 * `soumettreVers()` est désormais EXPORTÉ par `$lib/cablage/formulaires.ts` et
 * importé ici : la recopie que ce lot avait dû faire — le module partagé lui
 * étant fermé en écriture — est supprimée. Une parade recopiée est une parade
 * qui divergera.
 *
 * Ce qui suit décrivait la conséquence de cette fermeture : `soumettreVers()` y était privé, et il est
 * donc RECOPIÉ ici. C'est une duplication, elle est déclarée, et elle appelle sa
 * réunion — l'export de la fonction d'origine — au premier lot qui possède ce
 * fichier.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL FAIT, ET POURQUOI CHAQUE GESTE
 *
 * 1. IL NOMME L'ACTION DU FORMULAIRE. La page porte trois actions ; SvelteKit
 *    refuse qu'une action par défaut cohabite avec une action nommée et rend
 *    500. `cablerLEditeur()` soumet par `requestSubmit()` sans soumetteur, donc
 *    par l'action DU FORMULAIRE : elle est posée une fois, au montage, et n'est
 *    jamais réécrite ensuite. C'est le geste de `cablerLeSignet()` en
 *    modification, pour la même raison.
 *
 * 2. IL DONNE SON GESTE À « MARQUER COMME RESYNCHRONISÉ ». Le gel place la même
 *    action à deux endroits — le bouton `#a-resync` du panneau, et la seconde
 *    action du bandeau de désynchronisation — et son propre script fait passer
 *    la seconde par la première (`V-18:3289` : le bouton du bandeau CLIQUE
 *    `#a-resync`). Le produit fait de même : un seul chemin, deux déclencheurs.
 *
 * 3. IL DONNE SON GESTE À LA SUPPRESSION, sous confirmation CHIFFRÉE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CONFIRMATION EST NATIVE, ET C'EST UN ÉCART DÉCLARÉ — MÊME QUE V-14
 *
 * Le gel porte un dialogue pour ce geste — `dialog#dlg-supprimer`,
 * `mockups/V-18-editeur-operationnel.html:1992-2018` —, et `src/vues/V-18.svelte`
 * ne le transcrit pas : son en-tête le déclare non rendu, parce qu'un `<dialog>`
 * fermé ne porte aucune boîte de rendu et n'entre pas dans l'instantané ARIA.
 * Le monter demanderait de changer la structure de la vue, ce que cette campagne
 * ferme. `RG-M18-05` est donc tenue quant au FOND — rien n'est détruit sans un
 * rappel qui chiffre ce qui sera perdu — et non quant à la FORME. C'est mot pour
 * mot la jurisprudence de `cablerLaSuppression()` pour V-14.
 *
 * LE DÉCOMPTE EST CELUI DU GEL, à la ligne près : `V-18:3189-3191` compte les
 * mots du texte de la zone de rédaction et ses blocs de premier niveau. Il est
 * relevé sur le DOM vivant, donc sur ce que l'éditeur montre à l'instant du
 * clic — jamais sur un état serveur qui pourrait avoir vieilli.
 */
import { soumettreVers } from '$lib/cablage/formulaires';
import { adresseDeModificationDeNote } from '$lib/edition/gestes';
import type { Bloc, Document, Titre } from '$lib/contenu/document';
import { accord } from '$lib/vocabulaire';

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que le voisin. */
export type Debranchement = () => void;

/**
 * LE PLAN DE LA RÉFÉRENCE, RELEVÉ SUR CE QUE L'ÉCRAN MONTRE DÉJÀ.
 *
 * Le panneau de droite porte la Référence RENDUE (`#corps-reference`, rendue par
 * l'implémentation unique d'`ADR-004`, servie par le chargeur). Ses titres sont
 * donc à portée du client, et il n'y a rien à demander au serveur : un second
 * chemin de données pour la même matière divergerait, et la divergence ne se
 * verrait qu'ici.
 *
 * CE QUI EST REPRIS EST LE PLAN, PAS LE CONTENU. Le gel le dit dans son propre
 * avis de première rédaction : « le menu étendu permet d'en reprendre le plan
 * pour ne pas repartir d'une page blanche » (`V-18`, avis `depart`). Chaque
 * titre est suivi d'un paragraphe vide — la place où écrire le pas-à-pas.
 *
 * Les titres de la Référence sont de niveau 2 et 3 ; ils sont repris À LEUR
 * NIVEAU, jamais aplatis : un plan aplati n'est plus un plan.
 */
const NIVEAUX: Readonly<Record<string, Titre['attrs']['level']>> = { H2: 2, H3: 3, H4: 4 };

export function planDeLaReference(corps: Element | null): Document | null {
	if (corps === null) return null;
	const blocs: Bloc[] = [];
	for (const titre of Array.from(corps.querySelectorAll('h2, h3, h4'))) {
		const texte = (titre.textContent ?? '').trim();
		const level = NIVEAUX[titre.tagName];
		if (texte === '' || level === undefined) continue;
		blocs.push({
			type: 'heading',
			attrs: { level, ancre: null },
			content: [{ type: 'text', text: texte }]
		});
		blocs.push({ type: 'paragraph' });
	}
	if (blocs.length === 0) return null;
	return { type: 'doc', content: blocs };
}

/** Le bouton du bandeau qui redouble `#a-resync`, repéré par son libellé. */
function boutonDuBandeau(formulaire: ParentNode, libelle: string): HTMLButtonElement | null {
	const avis = formulaire.querySelector('#avis');
	if (avis === null) return null;
	return (
		Array.from(avis.querySelectorAll('button')).find(
			(b) => (b.textContent ?? '').trim() === libelle
		) ?? null
	);
}

/**
 * LE RAPPEL DE CE QUI SERA DÉTRUIT — `RG-M18-05`, chiffré sur le contenu réel.
 *
 * Les deux quantités et leurs accords sont ceux du gel (`V-18:3189-3196`) ; les
 * deux phrases sont celles de son dialogue (`V-18:2007-2013`), reprises mot pour
 * mot plutôt que reformulées.
 *
 * L'ACCORD VENAIT D'UN HOMONYME LOCAL — `accord(n, un, plusieurs)`, écrit ici,
 * quand `V-41` en portait un autre du même nom AUX PARAMÈTRES INVERSÉS
 * (`accord(compteur, pluriel, singulier)`). Deux fonctions de même nom et de
 * signatures incompatibles dans un même dépôt : la première recopie faite d'un
 * fichier à l'autre inversait silencieusement les deux formes. Celui-ci a cédé
 * la place à `accord()` de `$lib/vocabulaire`, qui rend LE NOM SEUL — le nombre
 * reste écrit ici, comme partout ailleurs. Celui de `V-41` reste dans sa
 * planche, qui ne prend aucune donnée du produit.
 */
export function rappelDeSuppression(zone: Element | null): string {
	const texte = (zone?.textContent ?? '').trim();
	const mots = texte === '' ? 0 : texte.split(/\s+/).filter(Boolean).length;
	const blocs = zone?.children.length ?? 0;
	return [
		'Supprimer la version opérationnelle ?',
		'',
		'Seul le registre Opérationnel est supprimé :',
		`— ${String(blocs)} ${accord(blocs, 'bloc de contenu opérationnel', 'blocs de contenu opérationnel')}`,
		`— ${String(mots)} ${accord(mots, 'mot rédigé', 'mots rédigés')}`,
		'',
		"La Référence, les métadonnées, l'historique et les liens de la note sont intacts.",
		"Cette suppression est définitive : le contenu opérationnel n'est pas conservé dans l'historique de la Référence."
	].join('\n');
}

/**
 * LE CÂBLAGE DES TROIS ACTIONS — appelé depuis `onMount` de la route, après
 * `cablerLEditeur()`, et jamais ailleurs.
 */
export interface OptionsDeLOperationnel {
	/** L'adresse de lecture de la note éditée — d'où les deux navigations dérivent. */
	adresseDeLaNote: string;
	/** Ce que « Reprendre le plan de la Référence » insère dans la rédaction. */
	inserer?: (document: Document) => void;
}

export function cablerLOperationnel(
	formulaire: HTMLFormElement,
	options: OptionsDeLOperationnel
): Debranchement {
	const document = formulaire.ownerDocument;
	const jetables: Debranchement[] = [];
	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => cible.removeEventListener(type, reaction));
	};

	/* 1. L'action du formulaire est NOMMÉE, une fois pour toutes — geste 1. */
	formulaire.action = '?/enregistrer';

	/* 2. L'attestation — un seul chemin, deux déclencheurs, comme au gel. */
	const resynchroniser = formulaire.querySelector<HTMLButtonElement>('#a-resync');
	if (resynchroniser !== null) {
		resynchroniser.type = 'button';
		ecouter(resynchroniser, 'click', () => soumettreVers(formulaire, '?/resynchroniser'));
		const redouble = boutonDuBandeau(formulaire, 'Marquer comme resynchronisé');
		if (redouble !== null) {
			redouble.type = 'button';
			ecouter(redouble, 'click', () => resynchroniser.click());
		}
	}

	/* 3. La suppression — irréversible, donc rappel chiffré avant l'envoi. */
	const supprimer = formulaire.querySelector<HTMLButtonElement>('#a-supprimer');
	if (supprimer !== null) {
		supprimer.type = 'button';
		ecouter(supprimer, 'click', () => {
			const zone = formulaire.querySelector('#redaction');
			if (document.defaultView?.confirm(rappelDeSuppression(zone)) !== true) return;
			soumettreVers(formulaire, '?/supprimer');
		});
	}

	/**
	 * 4. « MODIFIER LA RÉFÉRENCE » — une navigation, pas une écriture.
	 *
	 * Le bouton `#vers-reference` du bandeau de registre mène à l'éditeur de
	 * l'AUTRE registre de la MÊME note : `docs/routes.md:144`. L'adresse est
	 * bâtie sur `adresseDeNote()` par `adresseDeModificationDeNote()`, jamais
	 * écrite à la main.
	 */
	const versLaReference = formulaire.querySelector<HTMLButtonElement>('#vers-reference');
	if (versLaReference !== null) {
		versLaReference.type = 'button';
		ecouter(versLaReference, 'click', () => {
			document.location.assign(adresseDeModificationDeNote(options.adresseDeLaNote));
		});
	}

	/**
	 * 5. LES TROIS POSITIONS DU PANNEAU DE RÉFÉRENCE — `data-reference`, et
	 * elles sont exactement trois : `ouvert`, `ferme`, `cote`
	 * (`V-18.css:961-979`).
	 *
	 * `#bascule-ref` ouvre et referme ; `#cote-a-cote` fait passer de la colonne
	 * de droite à la mise côte à côte, et retour. Le libellé du second est un
	 * texte que la VUE calcule sur la position reçue du serveur ; la position
	 * changeant ici sans nouveau chargement, il est réécrit — c'est la même
	 * chaîne, à la position près, et il n'y en a pas d'autre au gel.
	 */
	const app = formulaire.querySelector<HTMLElement>('.app');
	const positionner = (position: 'ouvert' | 'ferme' | 'cote'): void => {
		if (app === null) return;
		app.dataset['reference'] = position;
		const bascule = formulaire.querySelector<HTMLButtonElement>('#bascule-ref');
		bascule?.setAttribute('aria-expanded', position === 'ferme' ? 'false' : 'true');
		const cote = formulaire.querySelector<HTMLButtonElement>('#cote-a-cote');
		if (cote !== null) cote.textContent = position === 'cote' ? 'En panneau' : 'Côte à côte';
	};
	const bascule = formulaire.querySelector<HTMLButtonElement>('#bascule-ref');
	if (bascule !== null && app !== null) {
		bascule.type = 'button';
		ecouter(bascule, 'click', () => {
			positionner(app.dataset['reference'] === 'ferme' ? 'ouvert' : 'ferme');
		});
	}
	const coteACote = formulaire.querySelector<HTMLButtonElement>('#cote-a-cote');
	if (coteACote !== null && app !== null) {
		coteACote.type = 'button';
		ecouter(coteACote, 'click', () => {
			positionner(app.dataset['reference'] === 'cote' ? 'ouvert' : 'cote');
		});
		/**
		 * LA SORTIE DE LA POSITION `cote` PASSE PAR ÉCHAP, ET IL FAUT DIRE
		 * POURQUOI.
		 *
		 * `V-18.css:978` écrit `.app[data-reference="cote"] .meta-panneau {
		 * display: none }`, et les deux boutons de position VIVENT dans ce
		 * `.meta-panneau` : en position côte à côte, ils disparaissent avec lui.
		 * `src/vues/V-18.svelte` relève déjà ce trait du gel et refuse de le
		 * réparer — la feuille est gelée, et « un implémenteur qui répare le gel
		 * fait rougir des vues ».
		 *
		 * La conséquence, elle, n'est pas une question d'apparence : mesuré au
		 * navigateur, le bouton devient inatteignable au pointeur et la position
		 * ne se quitte plus. Échap la quitte. Aucune règle n'est écrite, aucun
		 * nœud n'ajouté, aucun pixel ne bouge — c'est une sortie de secours au
		 * clavier pour un état dont le gel n'a pas prévu la sortie.
		 */
		ecouter(document, 'keydown', (evenement) => {
			if ((evenement as KeyboardEvent).key !== 'Escape') return;
			if (app.dataset['reference'] !== 'cote') return;
			positionner('ouvert');
		});
	}

	/**
	 * 6. « COMPARER LES DEUX REGISTRES » — et la raison pour laquelle ce n'est
	 * PAS une navigation.
	 *
	 * `docs/routes.md` ne porte aucune adresse de comparaison de deux REGISTRES :
	 * `/notes/{identifiant}/comparaison` compare deux VERSIONS. Lui en inventer
	 * une serait combler. Mais l'écran, lui, SAIT montrer les deux registres l'un
	 * à côté de l'autre — c'est la position `cote` de son propre panneau, que le
	 * gel dessine et nomme « Côte à côte ». Le bouton du bandeau y mène donc :
	 * un seul chemin, deux déclencheurs, exactement comme « Marquer comme
	 * resynchronisé » et son doublon du panneau (geste 2).
	 */
	const comparer = boutonDuBandeau(formulaire, 'Comparer les deux registres');
	if (comparer !== null) {
		comparer.type = 'button';
		ecouter(comparer, 'click', () => positionner('cote'));
	}

	/**
	 * 7. « REPRENDRE LE PLAN DE LA RÉFÉRENCE » — deux déclencheurs, un chemin.
	 *
	 * Le gel place ce geste à deux endroits : l'entrée `#reprendre-ref` du menu
	 * étendu, et l'action de l'avis de première rédaction. Le plan est relevé sur
	 * le panneau de Référence que l'écran montre déjà — voir
	 * `planDeLaReference()`.
	 */
	const inserer = options.inserer;
	if (inserer !== undefined) {
		const reprendre = (): void => {
			const plan = planDeLaReference(formulaire.querySelector('#corps-reference'));
			if (plan === null) return;
			inserer(plan);
		};
		const entree = formulaire.querySelector<HTMLButtonElement>('#reprendre-ref');
		if (entree !== null) {
			entree.type = 'button';
			ecouter(entree, 'click', reprendre);
		}
		const redouble = boutonDuBandeau(formulaire, 'Reprendre le plan de la Référence');
		if (redouble !== null) {
			redouble.type = 'button';
			ecouter(redouble, 'click', reprendre);
		}
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
