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
 * IL N'ÉCRIT AUCUN STYLE POUR LE TIROIR, ET IL LE REND POURTANT ATTEIGNABLE.
 * Le panneau `.tiroir-form` des consoles ne glissait jamais : la seule règle qui
 * l'ouvre vise `.app[data-form="ouvert"] .tiroir-form`, or le panneau vit hors
 * de `div.app` (`CLAUDE.md` §6, `P-3`). `cablerLeTiroirDeFormulaire()`, en bas
 * de ce fichier, le rend DESCENDANT de `.app` pour que la règle GELÉE puisse
 * enfin s'appliquer — le geste de `cablerLHistorique()` pour V-15, et rien de
 * plus : aucune transformation n'est écrite ici, et `data-form` reste posé par
 * la vue.
 *
 * Sans JavaScript, ces écrans ne soumettent pas — même régime que `ARB-063` §4.
 */

import { deserialize } from '$app/forms';

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

/** Ce qu'une action de route rend à l'appelant. */
export interface RetourDAction {
	readonly succes: boolean;
	/** Ce que l'action a renvoyé — la valeur de `fail()` ou celle du succès. */
	readonly donnees: unknown;
}

/** Ce qui module l'envoi. */
export interface OptionsDEnvoi {
	/**
	 * RECHARGER LA PAGE AU SUCCÈS — vrai par défaut, parce que c'est ce dont ces
	 * écrans ont besoin : la liste rendue vient du serveur, et un geste qui
	 * l'a modifiée doit la faire relire.
	 *
	 * FAUX QUAND L'ÉCRAN A ENCORE QUELQUE CHOSE À MONTRER. La création d'un
	 * compte est le seul cas à ce jour : le gel ouvre `#dlg-mdp` sur le mot de
	 * passe initial, « affiché une seule fois » (`V-32:1427`). Recharger
	 * l'emporterait avec la page, et la valeur n'existe nulle part ailleurs —
	 * seul le condensat est en base. Le rechargement est alors différé jusqu'à
	 * la fermeture de la boîte, que le gel commande par `#mdp-fermer`.
	 */
	readonly rechargerAuSucces?: boolean;
}

/**
 * L'ENVOI À UNE ACTION DE ROUTE, et le rechargement qui suit.
 *
 * SvelteKit répond aux actions par une enveloppe dont `type` vaut `success`,
 * `failure`, `redirect` ou `error`. Le rechargement n'est demandé qu'au succès :
 * un refus doit rester à l'écran, avec le dialogue ouvert et la saisie en place,
 * puisque c'est un ÉTAT de l'écran et non une panne — les planches de V-27, V-28
 * et V-29 nomment ces refus et les montrent.
 *
 * `x-sveltekit-action` est l'en-tête que SvelteKit attend d'une soumission
 * programmée ; sans lui, il répond par une redirection destinée à un formulaire
 * natif, et la réponse n'est pas lisible ici.
 *
 * LE CORPS N'EST PAS DU JSON ORDINAIRE, ET LE LIRE COMME TEL PERDAIT LES
 * DONNÉES. `data` est une CHAÎNE produite par `devalue`, pas un objet : la
 * première rédaction rendait donc `donnees` sous la forme d'un texte
 * inexploitable, ce qui n'avait aucune conséquence tant qu'aucun appelant ne
 * s'en servait — `P-5` exactement. `deserialize()` de `$app/forms` est la porte
 * officielle, elle vient de SvelteKit lui-même, et elle n'ajoute aucune
 * dépendance (`P-24`).
 */
export async function envoyerAUneAction(
	document: Document,
	action: string,
	champs: Record<string, string>,
	options: OptionsDEnvoi = {}
): Promise<RetourDAction> {
	const corps = new FormData();
	for (const [nom, valeur] of Object.entries(champs)) corps.append(nom, valeur);

	const reponse = await fetch(action, {
		method: 'POST',
		headers: { 'x-sveltekit-action': 'true' },
		body: corps
	});
	const resultat = deserialize(await reponse.text());
	const succes = resultat.type === 'success';
	if (succes && options.rechargerAuSucces !== false) document.location.reload();
	return {
		succes,
		donnees: resultat.type === 'success' || resultat.type === 'failure' ? resultat.data : undefined
	};
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

/* ═══════════════════════════════ Le tiroir de formulaire ════════════════ */

/**
 * LE PANNEAU `tiroir-form` DES CONSOLES — LE MÊME GESTE QU'EN V-15.
 *
 * L'EN-TÊTE DE CE FICHIER DISAIT « IL NE RÉPARE PAS LE TIROIR », ET IL LE DIT
 * ENCORE POUR LE STYLE : aucune ligne d'ici n'écrit de règle. Le constat qu'il
 * portait reste exact au mot près — `V-32.css:401` ouvre le panneau par
 * `.app[data-form="ouvert"] .tiroir-form { transform: none; }`, et
 * `Coquille.svelte:444` rend la superposition HORS de `div.app` (ARB-021, A-4) :
 * le sélecteur ne peut pas s'appliquer, le panneau reste à `translateX(100%)` et
 * ne pèse aucun pixel (`CLAUDE.md` §6, P-3).
 *
 * CE QUI CHANGE N'EST PAS LE CONSTAT, C'EST CE QU'IL COÛTE. Tant qu'aucun écran
 * ne demandait à ouvrir ce panneau, le laisser hors fenêtre ne coûtait rien.
 * `RG-M14-07` — changer le rôle d'un compte — a son déclencheur DEDANS, et son
 * action de route est écrite et juste : le panneau inatteignable était la seule
 * chose qui séparait l'administrateur du geste.
 *
 * `cablerLHistorique()` de `$lib/cablage/formulaires.ts` a tranché le cas
 * identique de V-15, et sa rédaction vaut ici mot pour mot :
 *
 *     « DEUX GESTES, ET AUCUN N'INVENTE UN STYLE. On pose l'attribut que la
 *       règle attend, et on rend le panneau DESCENDANT de `.app` pour que la
 *       règle du gel puisse enfin le trouver. Aucune déclaration n'est écrite,
 *       aucune feuille n'est touchée : c'est la règle GELÉE qui ouvre le
 *       panneau, elle en devient seulement applicable. »
 *
 * ICI, UN SEUL DES DEUX GESTES EST NÉCESSAIRE, et c'est la différence avec
 * V-15. L'attribut `data-form` est déjà posé par la vue, qui le tient de son
 * état (`V-32:301`) : rendre le panneau DESCENDANT de `.app` suffit, et
 * l'ouverture reste commandée par la vue. Rien ici ne décide qu'un panneau
 * s'ouvre ; ce module rend seulement possible que la règle gelée le voie.
 *
 * C'EST UNE DIVERGENCE DE STRUCTURE AVEC LA MAQUETTE, ET ELLE EST ASSUMÉE — la
 * même qu'en V-15, avec la même justification : un panneau que l'utilisateur ne
 * peut pas atteindre n'est pas un panneau. Elle appelle un regel des vues de
 * console concernées, pas une seconde rustine.
 *
 * LE DÉPLACEMENT EST IDEMPOTENT et n'a lieu qu'une fois par montage : Svelte
 * garde des RÉFÉRENCES aux nœuds qu'il met à jour, jamais leur chemin dans
 * l'arbre, et le contenu du panneau reste donc réactif après le déplacement.
 */
export function cablerLeTiroirDeFormulaire(racine: ParentNode): Debranchement {
	const app = noeud<HTMLElement>(racine, '.app');
	const tiroir = noeud<HTMLElement>(racine, '.tiroir-form');
	if (app !== null && tiroir !== null && !app.contains(tiroir)) app.appendChild(tiroir);
	return () => {
		/* Rien à défaire : aucun écouteur n'est posé, et remettre le panneau à sa
		   place d'origine au démontage n'aurait aucun observateur — la page entière
		   disparaît avec lui. */
	};
}

/* ═══════════════════════════════ La zone de dépôt — V-35 ════════════════ */

/** Ce que le câblage du dépôt fait d'un lot reçu. */
export interface OptionsDuDepot {
	/** Appelé dès qu'au moins un fichier est reçu, par dépôt ou par sélection. */
	readonly surLot: (fichiers: readonly File[]) => void;
}

/**
 * LA ZONE DE DÉPÔT ET « PARCOURIR » DE V-35 — les quatre écouteurs du gel, et
 * le champ de fichiers que le gel n'a pas.
 *
 * CE QUE LE GEL ÉCRIT, RECOPIÉ SANS RIEN Y AJOUTER
 * (`mockups/V-35-console-imports.html:2990-3001`) :
 *
 *     dragenter, dragover → `data-survol="oui"` ; dragleave, drop → `"non"`,
 *     et `drop` comme `#parcourir` appellent `lancer()`, qui notifie
 *     « Lot reçu — parcours d'import à l'étape du choix de scénario, vue V-24 ».
 *
 * `data-survol` EST L'ATTRIBUT DU GEL, et la feuille le lit déjà
 * (`V-35.css` : `.depot[data-survol="oui"]`). Aucune règle n'est écrite ici,
 * aucun nœud du gel n'est créé ni retiré.
 *
 * LE CHAMP DE FICHIERS N'EXISTE PAS AU GEL — `#parcourir` y est un bouton nu.
 * Il est donc créé ici, DÉTACHÉ DU DOCUMENT : un `<input type="file">` qui n'a
 * jamais été inséré ouvre le sélecteur du navigateur exactement de la même
 * façon, et le document servi reste au nœud près celui de la maquette. C'est le
 * même constat qu'en `V-24`, qui pose le sien caché faute de pouvoir faire
 * autrement dans un balisage de vue.
 *
 * LES FICHIERS SONT PRIS PLATS, ET C'EST DÉLIBÉRÉ. `V-24` descend
 * l'arborescence des entrées du transfert parce qu'elle en a besoin : c'est
 * elle qui l'envoie au serveur, et le scénario promet une arborescence
 * conservée « à l'identique ». Ici, rien n'est envoyé (voir la route) : refaire
 * cette descente ferait une SECONDE implémentation du même parcours, qui
 * finirait par diverger de celle qui compte.
 */
export function cablerLeDepot(racine: ParentNode, options: OptionsDuDepot): Debranchement {
	const attaches = new Attaches();
	const zone = noeud<HTMLElement>(racine, '#depot');
	if (zone === null) return attaches.debranchement();

	const marquer =
		(etat: string) =>
		(evenement: Event): void => {
			evenement.preventDefault();
			zone.setAttribute('data-survol', etat);
		};
	const entree = marquer('oui');
	const sortie = marquer('non');
	attaches.ecouter(zone, 'dragenter', entree);
	attaches.ecouter(zone, 'dragover', entree);
	attaches.ecouter(zone, 'dragleave', sortie);
	attaches.ecouter(zone, 'drop', (evenement) => {
		sortie(evenement);
		const transfert = (evenement as DragEvent).dataTransfer;
		const recus = transfert === null ? [] : Array.from(transfert.files);
		if (recus.length > 0) options.surLot(recus);
	});

	const parcourir = noeud<HTMLButtonElement>(racine, '#parcourir');
	if (parcourir !== null) {
		const champ = zone.ownerDocument.createElement('input');
		champ.type = 'file';
		champ.multiple = true;
		attaches.ecouter(champ, 'change', () => {
			const recus = Array.from(champ.files ?? []);
			if (recus.length > 0) options.surLot(recus);
		});
		attaches.ecouter(parcourir, 'click', () => champ.click());
	}

	return attaches.debranchement();
}
