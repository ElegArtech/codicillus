/**
 * LE CÂBLAGE DU CHOIX DE DÉPART — `dialog#dlg-template` de V-17. DEUX GESTES, ET ILS
 * ÉTAIENT INATTEIGNABLES PLUTÔT QU'INERTES : le dialogue n'est rendu que par l'état
 * `cas-template` de la vue, et aucune adresse ne le demandait.
 *
 * CE QU'UN GABARIT FAIT : il insère son SQUELETTE dans la zone de rédaction et
 * présélectionne le TYPE de note qu'il déclare. Il ne touche NI au titre, NI au dossier,
 * NI aux étiquettes — le référentiel n'en dit rien, et les remplir serait décider à la
 * place de qui rédige (`RG-REF-01`).
 *
 * LE DIALOGUE EST REMONTÉ EN MODALE, ET C'EST LE GEL QUI LE DEMANDE : `<dialog open>` non
 * modal reste SOUS la barre d'outils — mesuré au navigateur, le premier bouton du
 * dialogue était physiquement inatteignable au pointeur. `showModal()` et `close()` sont
 * ce que le gel appelle lui-même.
 */
import { documentDepuisHtml } from '$lib/edition/html';
import type { Document } from '$lib/contenu/document';
import type { Template } from '../../../../seeds/corpus';

export type Debranchement = () => void;

export interface OptionsDuChoixDeDepart {
	templates: readonly Template[];
	inserer: (document: Document) => void;
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
