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
export async function envoyerAUneAction(
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
			void envoyerAUneAction(enregistrer.ownerDocument, '?/enregistrer', charge);
		});
	}

	return attaches.debranchement();
}

/* ═══════════════════════════════ Les suppressions ═══════════════════════ */

/*
 * IL N'Y A PAS DE CÂBLAGE DE SUPPRESSION ICI, ET C'EST UNE DÉCISION MESURÉE.
 *
 * Une première rédaction en portait un : il ouvrait le dialogue depuis le
 * document, relisait la saisie et envoyait l'action. Il a été retiré, parce que
 * le DÉCOMPTE de `RG-M14-02` ne se compose pas depuis le DOM — il faut les notes
 * du domaine, leurs types et leurs dossiers, c'est-à-dire précisément ce que le
 * chargeur a servi à la VUE et à elle seule.
 *
 * Le partage retenu est donc celui-ci, et il vaut pour V-27, V-28 et V-29 :
 *
 *   la VUE   tient l'état de son dialogue — quel objet est visé, ce qui a été
 *            retapé, le décompte, la modalité —, comme le script du gel le
 *            tenait ; elle ne connaît ni route, ni action, ni réseau ;
 *   la PAGE  traduit la désignation et appelle l'action, par `envoyerAUneAction`
 *            ci-dessus ; elle ne connaît rien du contenu du dialogue.
 *
 * Laisser ici un câblage qu'aucune page n'appelle aurait fait une règle que rien
 * n'exerce, et dont personne ne saurait si elle marche (`P-5`).
 */
