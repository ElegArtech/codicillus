/**
 * LE CÂBLAGE DU CHOIX DE DÉPART — `dialog#dlg-template` de V-17, « Par quoi
 * commencer ? ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX GESTES, ET ILS ÉTAIENT INATTEIGNABLES PLUTÔT QU'INERTES
 *
 * Le dialogue n'est rendu que par l'état `cas-template` de la vue, et aucune
 * adresse ne le demandait : ses deux gestes — « Partir d'une page vierge » et le
 * choix d'un gabarit — ne pouvaient pas même être cliqués. `?template=` les
 * ouvre désormais (`docs/routes.md:287`, `+page.server.ts`), et ce module leur
 * donne leur effet.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'UN GABARIT FAIT, ET CE QU'IL NE FAIT PAS
 *
 * Il insère son SQUELETTE dans la zone de rédaction — le champ `contenu` du
 * référentiel, converti par `documentDepuisHtml()` — et il présélectionne le
 * TYPE de note qu'il déclare, parce que le gabarit le porte
 * (`Template.type`) et que le sélecteur du gel l'accepte.
 *
 * Il ne touche NI au titre, NI au dossier, NI aux étiquettes : le référentiel
 * n'en dit rien, et les remplir serait décider à la place de qui rédige.
 * `RG-REF-01` — « le template est subsidiaire, jamais imposé » — est la même
 * phrase que celle que le dialogue affiche au-dessus de la page vierge.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DIALOGUE EST REMONTÉ EN MODALE, ET C'EST LE GEL QUI LE DEMANDE
 *
 * `src/vues/V-17.svelte` rend `<dialog open>` et rien d'autre — délibérément :
 * `ARB-017` confie la modalité au banc, et l'en-tête de la vue le dit, « `open`
 * n'est pas `showModal()` ; la couche supérieure ne s'atteint pas
 * déclarativement ». Le PRODUIT, lui, en a besoin, et ce n'est pas une opinion :
 * mesuré au navigateur, un `<dialog open>` non modal reste SOUS la barre
 * d'outils, et `elementFromPoint` au centre de « Partir d'une page vierge »
 * rend le bouton « Code en ligne ». Le premier bouton du dialogue était donc
 * physiquement inatteignable au pointeur.
 *
 * `showModal()` est ce que le gel appelle lui-même — `V-17:3576` — et
 * `close()` ce qu'il appelle pour les deux sorties — `V-17:3521` et `:3530`.
 * Ce module fait les deux mêmes appels, aux deux mêmes moments. Rien n'est
 * inventé, et rien n'est écrit dans `src/vues/`.
 */
import { documentDepuisHtml } from '$lib/edition/html';
import type { Document } from '$lib/contenu/document';
import type { Template } from '../../../../seeds/corpus';

/** Ce qu'un câblage rend : de quoi le défaire. */
export type Debranchement = () => void;

/** Ce que le câblage du choix de départ a besoin de savoir de sa route. */
export interface OptionsDuChoixDeDepart {
	/** Les gabarits servis par le chargeur, dans l'ordre où la vue les rend. */
	templates: readonly Template[];
	/** Ce que le gabarit choisi insère dans la zone de rédaction. */
	inserer: (document: Document) => void;
	/** Le gabarit nommé par `?template=`, quand l'adresse en nomme un. */
	demande?: string | null;
}

/**
 * LE CÂBLAGE — appelé depuis `onMount` de la route, après le montage de
 * l'éditeur, et jamais ailleurs.
 */
export function cablerLeChoixDeDepart(
	formulaire: HTMLFormElement,
	options: OptionsDuChoixDeDepart
): Debranchement {
	const dialogue = formulaire.querySelector<HTMLDialogElement>('#dlg-template');
	if (dialogue === null) return () => undefined;

	const jetables: Debranchement[] = [];
	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => cible.removeEventListener(type, reaction));
	};

	/* La remontée en modale — `V-17:3576`. `showModal()` REFUSE un dialogue déjà
	   ouvert : il faut donc le refermer d'abord, et l'ordre n'est pas
	   interchangeable. */
	if (dialogue.hasAttribute('open')) dialogue.close();
	dialogue.showModal();

	const fermer = (): void => {
		dialogue.close();
	};

	/** Le geste d'un gabarit : son squelette, son type, puis on referme. */
	const prendre = (gabarit: Template): void => {
		options.inserer(documentDepuisHtml(gabarit.contenu, formulaire.ownerDocument));
		const type = formulaire.querySelector<HTMLSelectElement>('#m-type');
		if (type !== null && Array.from(type.options).some((o) => o.value === gabarit.type)) {
			type.value = gabarit.type;
		}
		fermer();
	};

	/* 1. « Partir d'une page vierge » — on referme, et c'est tout ce que le gel
	      promet : la zone est déjà vide, il n'y a rien à y poser. */
	const vierge = formulaire.querySelector<HTMLButtonElement>('#tpl-vierge');
	if (vierge !== null) {
		vierge.type = 'button';
		ecouter(vierge, 'click', fermer);
	}

	/* 2. LES GABARITS — repérés par leur RANG dans `#templates`, qui est celui de
	      la liste servie : la vue les rend par `{#each templates}`, dans l'ordre
	      reçu, et aucun de ses boutons ne porte d'identifiant (`ARB-063` ferme
	      `src/vues/`). Le rang est donc la seule clé disponible, et il est SÛR
	      parce que les deux listes sont la même. */
	const boite = formulaire.querySelector<HTMLElement>('#templates');
	const boutons = boite === null ? [] : Array.from(boite.querySelectorAll('button'));
	boutons.forEach((bouton, rang) => {
		const gabarit = options.templates[rang];
		if (gabarit === undefined) return;
		bouton.type = 'button';
		ecouter(bouton, 'click', () => prendre(gabarit));
	});

	/* 3. `?template=<id>` NOMME UN GABARIT — il est alors pris d'emblée, et le
	      dialogue ne s'ouvre pas : c'est le « pré-remplissage » que
	      `docs/routes.md:287` demande. Une valeur qui ne nomme aucun gabarit
	      laisse le choix ouvert, plutôt que de refuser l'adresse. */
	const demande = options.demande;
	if (typeof demande === 'string' && demande !== '') {
		const gabarit = options.templates.find((t) => t.id === demande);
		if (gabarit !== undefined) prendre(gabarit);
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
