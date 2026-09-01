/**
 * LE CÂBLAGE DES TROIS ACTIONS DE V-18. `ARB-063` : les vues sont des transcriptions du
 * gel, sans `method`, sans `action`, sans attribut de nom.
 *
 * 1. IL NOMME L'ACTION DU FORMULAIRE. La page porte trois actions ; SvelteKit refuse
 *    qu'une action par défaut cohabite avec une action nommée et rend 500.
 *    `cablerLEditeur()` soumet par `requestSubmit()` sans soumetteur, donc par l'action
 *    DU FORMULAIRE : elle est posée une fois, au montage.
 * 2. IL DONNE SON GESTE À « MARQUER COMME RESYNCHRONISÉ » : le gel place la même action
 *    à deux endroits et fait passer la seconde par la première.
 * 3. IL DONNE SON GESTE À LA SUPPRESSION, sous confirmation CHIFFRÉE. La forme est un
 *    écart déclaré — le gel porte un dialogue que `src/vues/V-18.svelte` ne transcrit
 *    pas, un `<dialog>` fermé ne portant aucune boîte de rendu ; `RG-M18-05` est tenue
 *    quant au FOND, non quant à la FORME. LE DÉCOMPTE est relevé sur le DOM vivant.
 */
import { soumettreVers } from '$lib/cablage/formulaires';
import { adresseDeModificationDeNote } from '$lib/edition/gestes';
import type { Bloc, Document, Titre } from '$lib/contenu/document';
import { accord } from '$lib/vocabulaire';
import { boutonDuGeste, type GesteCable } from '$lib/cablage/libelles';

export type Debranchement = () => void;

/**
 * LE PLAN DE LA RÉFÉRENCE, RELEVÉ SUR CE QUE L'ÉCRAN MONTRE DÉJÀ : le panneau de
 * droite porte la Référence RENDUE, ses titres sont à portée du client, et il n'y a
 * rien à demander au serveur — un second chemin de données pour la même matière
 * divergerait, et la divergence ne se verrait qu'ici.
 *
 * CE QUI EST REPRIS EST LE PLAN, PAS LE CONTENU : chaque titre est suivi d'un
 * paragraphe vide. Les titres sont repris À LEUR NIVEAU — un plan aplati n'est plus
 * un plan.
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

/**
 * Le bouton du bandeau qui redouble `#a-resync`, repéré par son LIBELLÉ — le gel ne lui
 * donne rien d'autre. Le libellé vient de `$lib/cablage/libelles` : `RG-M18-16`, une
 * traduction qui le changerait ici sans le changer là débrancherait le geste en silence.
 */
function boutonDuBandeau(formulaire: ParentNode, geste: GesteCable): HTMLButtonElement | null {
	const avis = formulaire.querySelector('#avis');
	return avis === null ? null : boutonDuGeste(avis, geste);
}

/**
 * LE RAPPEL DE CE QUI SERA DÉTRUIT — `RG-M18-05`, chiffré sur le contenu réel. Les
 * deux quantités, leurs accords et les deux phrases sont ceux du gel.
 *
 * L'ACCORD VIENT DE `$lib/vocabulaire`, ET PAS D'UN HOMONYME LOCAL : `V-41` en
 * porte un autre du même nom AUX PARAMÈTRES INVERSÉS, et une recopie d'un fichier à
 * l'autre inversait silencieusement les deux formes. Celui de `$lib` rend LE NOM
 * SEUL — le nombre reste écrit ici.
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
		const redouble = boutonDuBandeau(formulaire, 'marquerResynchronise');
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
	 * 4. « MODIFIER LA RÉFÉRENCE » — une navigation, pas une écriture, vers
	 * l'éditeur de l'AUTRE registre de la MÊME note. L'adresse est bâtie par
	 * `adresseDeModificationDeNote()`, jamais écrite à la main.
	 */
	const versLaReference = formulaire.querySelector<HTMLButtonElement>('#vers-reference');
	if (versLaReference !== null) {
		versLaReference.type = 'button';
		ecouter(versLaReference, 'click', () => {
			document.location.assign(adresseDeModificationDeNote(options.adresseDeLaNote));
		});
	}

	/**
	 * 5. LES TROIS POSITIONS DU PANNEAU DE RÉFÉRENCE — `data-reference` :
	 * `ouvert`, `ferme`, `cote`, et exactement celles-là.
	 *
	 * Le libellé de `#cote-a-cote` est un texte que la VUE calcule sur la position
	 * reçue du serveur ; la position changeant ici sans nouveau chargement, il est
	 * réécrit — la même chaîne, à la position près.
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
		 * LA SORTIE DE LA POSITION `cote` PASSE PAR ÉCHAP, ET IL FAUT DIRE POURQUOI.
		 * `V-18.css:978` écrit `.app[data-reference="cote"] .meta-panneau { display:
		 * none }`, et les deux boutons de position VIVENT dans ce `.meta-panneau` : en
		 * position côte à côte, ils disparaissent avec lui. La feuille est gelée, et
		 * `src/vues/V-18.svelte` refuse de la réparer.
		 *
		 * La conséquence n'est pas une question d'apparence : le bouton devient
		 * inatteignable au pointeur et la position ne se quitte plus.
		 */
		ecouter(document, 'keydown', (evenement) => {
			if ((evenement as KeyboardEvent).key !== 'Escape') return;
			if (app.dataset['reference'] !== 'cote') return;
			positionner('ouvert');
		});
	}

	/**
	 * 6. « COMPARER LES DEUX REGISTRES » — et pourquoi ce n'est PAS une navigation :
	 * `docs/routes.md` ne porte aucune adresse de comparaison de deux REGISTRES,
	 * `/notes/{identifiant}/comparaison` comparant deux VERSIONS. Mais l'écran SAIT
	 * montrer les deux registres côte à côte — c'est la position `cote` de son propre
	 * panneau. Un seul chemin, deux déclencheurs, comme au geste 2.
	 */
	const comparer = boutonDuBandeau(formulaire, 'comparerLesRegistres');
	if (comparer !== null) {
		comparer.type = 'button';
		ecouter(comparer, 'click', () => positionner('cote'));
	}

	/**
	 * 7. « REPRENDRE LE PLAN DE LA RÉFÉRENCE » — deux déclencheurs, un chemin : le
	 * gel place ce geste à l'entrée `#reprendre-ref` du menu étendu et à l'action
	 * de l'avis de première rédaction.
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
		const redouble = boutonDuBandeau(formulaire, 'reprendreLePlan');
		if (redouble !== null) {
			redouble.type = 'button';
			ecouter(redouble, 'click', reprendre);
		}
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
