/**
 * LE CÂBLAGE DES ÉCRANS DE CONSOLE — ce qui relie les nœuds du gel aux actions
 * des routes, et pourquoi il vit ICI plutôt que dans `src/vues/`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE MOTIF EST CELUI DE `$lib/cablage/formulaires.ts`, ET LA RAISON AUSSI
 *
 * Ce module-là l'énonce, et elle vaut mot pour mot ici : « aucune vue de
 * `src/vues/` ne porte `method`, ni `action`, ni un seul attribut de nom utile.
 * Ce n'est pas un oubli d'implémenteur : c'est le gel, et les vues en sont la
 * transcription fidèle. » Les dix écrans de console sont dans ce cas — pas un
 * `<form>`, pas un `name`, et des boutons que le script de la maquette
 * commandait.
 *
 * Ce module est appelé depuis `onMount` d'un `+page.svelte`, et de nulle part
 * ailleurs : il n'est donc jamais rendu au serveur, jamais importé par une vue.
 * La conformité au gel n'est pas défendue ici par une relecture — elle l'est par
 * le fait qu'aucune vue ne traverse ce code.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * IL EST SOUS `src/routes/console/`, ET C'EST DÉLIBÉRÉ
 *
 * `$lib/cablage/formulaires.ts` porte l'éditeur, la suppression d'une note et
 * la connexion — trois écrans qui n'appartiennent pas à la console. Y ajouter
 * dix branches de console ferait un module que plus personne ne lit en entier,
 * et que deux lots parallèles se disputeraient. Le câblage d'un écran vit à côté
 * de la route qui l'emploie.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL FAIT SUR LE DOCUMENT VIVANT, ET CE QU'IL NE FAIT PAS
 *
 * Il pose des écouteurs, bascule des attributs que le gel bascule déjà —
 * `disabled`, `hidden`, `open`, `aria-pressed` —, et envoie des requêtes aux
 * actions des routes. Il n'écrit AUCUNE règle de style, ne pose aucune classe
 * qui n'existe pas au gel, ne crée aucun nœud, ne retire aucun nœud et ne change
 * aucun ordre.
 *
 * IL NE « RÉPARE » PAS LE TIROIR. Le panneau `.tiroir-form` des consoles ne
 * glisse jamais : la seule règle qui l'ouvre vise `.app[data-form="ouvert"]
 * .tiroir-form`, or le panneau vit hors de `div.app` (`CLAUDE.md` §6, `P-3`).
 * C'est le gel, et le corriger rendrait six vues fausses. Aucune ligne d'ici ne
 * touche à `data-form` ni à une transformation.
 *
 * Sans JavaScript, ces écrans ne soumettent pas — même régime que `ARB-063` §4.
 */

/** Ce qu'un câblage rend : de quoi le défaire. */
export type Debranchement = () => void;

/** Le petit collecteur d'écouteurs que chaque câblage rend à Svelte. */
class Attaches {
	private readonly defaire: Debranchement[] = [];

	ecouter<K extends keyof HTMLElementEventMap>(
		cible: EventTarget,
		type: K,
		reaction: (evenement: HTMLElementEventMap[K]) => void
	): void {
		const enveloppe = (e: Event): void => reaction(e as HTMLElementEventMap[K]);
		cible.addEventListener(type, enveloppe);
		this.defaire.push(() => cible.removeEventListener(type, enveloppe));
	}

	debranchement(): Debranchement {
		return () => {
			for (const d of this.defaire) d();
		};
	}
}

function noeud<T extends Element>(racine: ParentNode, selecteur: string): T | null {
	return racine.querySelector<T>(selecteur);
}

/**
 * L'ENVOI À UNE ACTION DE ROUTE, et le rechargement qui suit.
 *
 * SvelteKit répond aux actions par une enveloppe JSON dont `type` vaut
 * `success`, `failure` ou `error`. Le rechargement n'est demandé qu'au succès :
 * un refus doit rester à l'écran, avec le dialogue ouvert et la saisie en place,
 * puisque c'est un ÉTAT de l'écran et non une panne — les planches de V-27, V-28
 * et V-29 nomment ces refus et les montrent.
 *
 * `x-sveltekit-action` est l'en-tête que SvelteKit attend d'une soumission
 * programmée ; sans lui, il répond par une redirection destinée à un formulaire
 * natif, et la réponse n'est pas lisible ici.
 */
async function envoyer(
	document: Document,
	action: string,
	champs: Record<string, string>
): Promise<{ readonly succes: boolean; readonly donnees: unknown }> {
	const corps = new FormData();
	for (const [nom, valeur] of Object.entries(champs)) corps.append(nom, valeur);

	const reponse = await fetch(action, {
		method: 'POST',
		headers: { 'x-sveltekit-action': 'true' },
		body: corps
	});
	const enveloppe = (await reponse.json()) as { type?: string; data?: unknown };
	const succes = enveloppe.type === 'success';
	if (succes) document.location.reload();
	return { succes, donnees: enveloppe.data };
}

/* ═══════════════════════════════ La configuration — V-33 ════════════════ */

/** Les sept champs de `V-33`, par leur identifiant de gel (`V-33:1247-1360`). */
const CHAMPS_DE_CONFIGURATION = [
	'c-frais',
	'c-vieil',
	'c-versions',
	'c-portail',
	'c-mot',
	'c-taille',
	'c-session'
] as const;

/**
 * LE CÂBLAGE DE LA CONFIGURATION — `RG-M14-09`, `RG-M14-10`.
 *
 * TROIS GESTES, ET AUCUN DE PLUS.
 *
 * 1. LE BOUTON SUIT LA MODIFICATION. `#enregistrer` est rendu `disabled` et
 *    `#annuler` `hidden` tant que rien n'a changé : c'est l'état « en vigueur »
 *    de la planche, et le gel le commande par un script. Les valeurs initiales
 *    sont relevées AU MONTAGE — donc celles que le chargeur a servies —, et le
 *    bouton s'active dès qu'une seule en diffère. Revenir à la valeur de départ
 *    le redésactive : c'est la même comparaison, dans les deux sens (`P-5`).
 *
 * 2. « RÉTABLIR LES VALEURS ENREGISTRÉES » REPOSE CES VALEURS-LÀ. Il ne recharge
 *    pas la page — le gel le nomme « rétablir », pas « annuler l'écran » — et il
 *    repasse par la même comparaison, qui redésactive le bouton.
 *
 * 3. « ENREGISTRER LES RÉGLAGES » APPELLE L'ACTION. Les sept noms envoyés sont
 *    les identifiants du gel, parce que c'est ce que l'action attend :
 *    `CHAMPS_DE_CONFIGURATION` d'`administration.ts` les tient, et `V-33:2965`
 *    les lit par `document.getElementById("c-" + id)`. Rien n'est traduit.
 *
 * LE REFUS N'EST PAS TRAITÉ ICI, ET C'EST UNE LACUNE DÉCLARÉE. `RG-M14-10` fait
 * refuser une combinaison de seuils non croissante, et la route rend ce refus
 * avec ses messages rattachés à leur champ. Les afficher demanderait de révéler
 * les blocs `.champ__erreur` du gel — un geste que ce lot n'a pas éprouvé, et
 * qu'il vaut mieux ne pas poser à moitié. En attendant, une valeur refusée
 * laisse l'écran inchangé plutôt que de mentir sur un enregistrement.
 */
export function cablerLaConfiguration(racine: ParentNode): Debranchement {
	const attaches = new Attaches();
	const champs = CHAMPS_DE_CONFIGURATION.map((id) =>
		noeud<HTMLInputElement | HTMLSelectElement>(racine, `#${id}`)
	).filter((n): n is HTMLInputElement | HTMLSelectElement => n !== null);
	if (champs.length === 0) return attaches.debranchement();

	const enregistrer = noeud<HTMLButtonElement>(racine, '#enregistrer');
	const retablir = noeud<HTMLButtonElement>(racine, '#annuler');
	const initiales = new Map(champs.map((c) => [c.id, c.value]));

	const relire = (): void => {
		const modifie = champs.some((c) => c.value !== initiales.get(c.id));
		if (enregistrer !== null) enregistrer.disabled = !modifie;
		if (retablir !== null) retablir.hidden = !modifie;
	};
	relire();

	for (const champ of champs) {
		attaches.ecouter(champ, 'input', relire);
		attaches.ecouter(champ, 'change', relire);
	}

	if (retablir !== null) {
		attaches.ecouter(retablir, 'click', () => {
			for (const champ of champs) champ.value = initiales.get(champ.id) ?? champ.value;
			relire();
		});
	}

	if (enregistrer !== null) {
		attaches.ecouter(enregistrer, 'click', () => {
			const charge: Record<string, string> = {};
			for (const champ of champs) charge[champ.id] = champ.value;
			void envoyer(enregistrer.ownerDocument, '?/enregistrer', charge);
		});
	}

	return attaches.debranchement();
}

/* ═══════════════════════════════ Les suppressions — V-27, V-28, V-29 ════ */

/** Ce qu'un écran de suppression a besoin de savoir de sa propre page. */
export interface OptionsDeSuppression {
	/**
	 * Comment reconnaître le bouton destructif d'une ligne, et ce qu'il désigne.
	 *
	 * Le gel ne pose aucun attribut de donnée sur ces boutons : ils se
	 * reconnaissent par leur `aria-label`, que la vue compose avec le nom de
	 * l'objet — « Supprimer l'univers Production », « Supprimer le domaine
	 * Infrastructure ». La fonction rend le NOM, ou `null` si le bouton n'est pas
	 * un bouton de suppression.
	 */
	readonly designer: (bouton: HTMLElement) => string | null;
	/**
	 * Le nom de l'action, et les champs qu'elle attend pour l'objet désigné.
	 * Rendre `null` refuse l'envoi — c'est ce qui tient la confirmation par le
	 * nom exact de `RG-M14-02`.
	 */
	readonly requete: (nom: string, racine: ParentNode) => Record<string, string> | null;
	/**
	 * Le contrôle de saisie, quand l'écran en porte un. Appelé à chaque frappe :
	 * il rend `true` quand le geste est permis. Absent, le bouton de validation
	 * est actif dès l'ouverture — c'est le cas de V-27 et V-29, dont les
	 * dialogues ne demandent aucune saisie.
	 */
	readonly saisieConforme?: (nom: string, racine: ParentNode) => boolean;
}

/**
 * LE CÂBLAGE D'UN DIALOGUE DE SUPPRESSION — le motif commun de V-27, V-28, V-29.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `showModal()` PLUTÔT QUE L'ATTRIBUT `open`, ET LE GEL LE DEMANDE
 *
 * Les trois vues rendent `<dialog open={…}>` parce qu'un squelette sans
 * hydratation ne peut pas appeler `showModal()`. Sur le document VIVANT, c'est
 * `showModal()` qu'il faut : lui seul pose le fond de superposition, prend le
 * focus, rend le reste de la page inerte et ferme sur `Échap`. L'attribut seul
 * afficherait une boîte sans modalité, au milieu d'une page encore cliquable.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DIALOGUE EST OUVERT PAR LA PAGE, ET SON CONTENU EST CELUI DE LA VUE
 *
 * Ce module N'ÉCRIT PAS le décompte : il ne connaît ni les notes, ni les
 * dossiers, ni ce que la suppression détruira. Le décompte est composé par la
 * VUE, à partir des notes que le chargeur lui a servies — c'est ce qui le rend
 * exact au sens de `RG-M14-02`, et c'est pourquoi l'ouverture demande à la page
 * de recharger l'état du dialogue plutôt que d'en fabriquer un ici. Le rappel du
 * geste est donné par `onDemande`.
 */
export interface OuvertureDeDialogue {
	/** Ce que la page doit faire quand une ligne demande sa suppression. */
	readonly onDemande: (nom: string) => void;
}

export function cablerLaSuppression(
	racine: ParentNode,
	options: OptionsDeSuppression & OuvertureDeDialogue
): Debranchement {
	const attaches = new Attaches();
	const dialogue = noeud<HTMLDialogElement>(racine, '#dlg-supprimer');
	const valider = noeud<HTMLButtonElement>(racine, '#sup-valider');
	const saisie = noeud<HTMLInputElement>(racine, '#sup-saisie');

	/** Le nom de l'objet dont la suppression est en cours d'examen. */
	let vise: string | null = null;

	const relireLaSaisie = (): void => {
		if (valider === null) return;
		const permis =
			vise !== null && (options.saisieConforme?.(vise, racine) ?? true) && !valider.hidden;
		valider.disabled = !permis;
	};

	/* L'ouverture — un clic sur le bouton destructif d'une ligne. */
	attaches.ecouter(racine as unknown as EventTarget, 'click', (evenement) => {
		const cible = (evenement.target as Element | null)?.closest('button');
		if (cible === null || cible === undefined) return;
		const nom = options.designer(cible);
		if (nom === null) return;
		evenement.preventDefault();
		vise = nom;
		options.onDemande(nom);
	});

	/* La fermeture — les deux nœuds que le gel marque `data-fermer`. */
	for (const fermer of Array.from(
		racine.querySelectorAll<HTMLElement>('#dlg-supprimer [data-fermer]')
	)) {
		attaches.ecouter(fermer, 'click', () => {
			vise = null;
			dialogue?.close();
		});
	}

	if (saisie !== null) attaches.ecouter(saisie, 'input', relireLaSaisie);

	if (valider !== null) {
		attaches.ecouter(valider, 'click', () => {
			if (vise === null) return;
			const charge = options.requete(vise, racine);
			if (charge === null) return;
			void envoyer(valider.ownerDocument, '?/supprimer', charge);
		});
	}

	return attaches.debranchement();
}

/**
 * LA RÉVÉLATION MODALE D'UN DIALOGUE DÉJÀ RENDU OUVERT PAR LA VUE.
 *
 * Appelée par la page après que la vue a recomposé son dialogue : l'attribut
 * `open` est là, la modalité ne l'est pas. `showModal()` refuse un dialogue déjà
 * ouvert — d'où la fermeture préalable, qui ne se voit pas puisqu'elle précède
 * la révélation dans la même tâche.
 */
export function revelerLeDialogue(dialogue: HTMLDialogElement | null): void {
	if (dialogue === null) return;
	if (dialogue.open) dialogue.close();
	dialogue.showModal();
}
