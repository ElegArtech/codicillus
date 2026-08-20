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
 * La conséquence est nommée plus bas : `soumettreVers()` y est privé, et il est
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

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que le voisin. */
export type Debranchement = () => void;

/**
 * SOUMETTRE VERS UNE ACTION NOMMÉE — par le SOUMETTEUR, jamais en réécrivant
 * l'attribut du formulaire.
 *
 * RECOPIE de `soumettreVers()` (`$lib/cablage/formulaires.ts`), qui est privé.
 * Le corps est identique, et la raison d'être l'est aussi : poser
 * `formulaire.action`, soumettre, puis remettre l'ancienne valeur est une
 * COURSE, et elle a mordu — le panneau d'historique a fait partir une
 * restauration vers l'action de SUPPRESSION, parce que le navigateur lit
 * l'attribut après le retour de `requestSubmit()`.
 *
 * `formaction` sur le bouton soumetteur l'emporte sur l'action du formulaire, et
 * `requestSubmit(soumetteur)` le désigne explicitement. Rien n'est réécrit, rien
 * n'est à remettre, il n'y a plus de fenêtre pendant laquelle le formulaire vise
 * autre chose que ce qu'il vise d'ordinaire.
 */
function soumettreVers(formulaire: HTMLFormElement, action: string): void {
	const document = formulaire.ownerDocument;
	const existant = formulaire.querySelector<HTMLButtonElement>('button[data-cable-action]');
	const soumetteur = existant ?? document.createElement('button');
	soumetteur.type = 'submit';
	soumetteur.hidden = true;
	soumetteur.dataset['cableAction'] = action;
	soumetteur.formAction = action;
	if (existant === null) formulaire.appendChild(soumetteur);
	formulaire.requestSubmit(soumetteur);
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
 */
export function rappelDeSuppression(zone: Element | null): string {
	const texte = (zone?.textContent ?? '').trim();
	const mots = texte === '' ? 0 : texte.split(/\s+/).filter(Boolean).length;
	const blocs = zone?.children.length ?? 0;
	const accord = (n: number, un: string, plusieurs: string): string =>
		`${String(n)} ${n > 1 ? plusieurs : un}`;
	return [
		'Supprimer la version opérationnelle ?',
		'',
		'Seul le registre Opérationnel est supprimé :',
		`— ${accord(blocs, 'bloc de contenu opérationnel', 'blocs de contenu opérationnel')}`,
		`— ${accord(mots, 'mot rédigé', 'mots rédigés')}`,
		'',
		"La Référence, les métadonnées, l'historique et les liens de la note sont intacts.",
		"Cette suppression est définitive : le contenu opérationnel n'est pas conservé dans l'historique de la Référence."
	].join('\n');
}

/**
 * LE CÂBLAGE DES TROIS ACTIONS — appelé depuis `onMount` de la route, après
 * `cablerLEditeur()`, et jamais ailleurs.
 */
export function cablerLOperationnel(formulaire: HTMLFormElement): Debranchement {
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

	return () => {
		for (const defaire of jetables) defaire();
	};
}
