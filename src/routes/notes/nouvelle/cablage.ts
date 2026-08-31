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
 * ET IL LAISSE UNE TRACE DANS LA SOUMISSION — `input[name=template]`, posé ici et nulle
 * part ailleurs. Le choix de départ ne quittait jamais l'écran : la note s'écrivait sans
 * qu'aucune colonne ne sache d'où elle partait, et « Utilisations » de V-31 n'avait
 * aucune source. Le champ est CACHÉ et COMPOSÉ PAR LA ROUTE (`ARB-063`) : V-17 ne porte
 * aucun attribut de nom, et lui en ajouter un ferait porter la soumission par le gel.
 *
 * LE DIALOGUE EST REMONTÉ EN MODALE, ET C'EST LE GEL QUI LE DEMANDE : `<dialog open>` non
 * modal reste SOUS la barre d'outils — mesuré au navigateur, le premier bouton du
 * dialogue était physiquement inatteignable au pointeur. `showModal()` et `close()` sont
 * ce que le gel appelle lui-même. C'est la ROUTE qui décide du moment : elle seule sait
 * si la question a déjà une réponse — un brouillon repris en porte une.
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
 * CE QUE LA ROUTE TIENT DU CHOIX DE DÉPART. Le dialogue ne s'ouvre plus de lui-même :
 * la route seule sait s'il y a lieu de demander par quoi commencer — un brouillon
 * repris répond déjà à la question, et la modale posée par-dessus le texte restauré
 * était un obstacle, pas un choix.
 */
export interface ChoixDeDepart {
	/** Demande par quoi commencer. Sans dialogue à l'écran, ne fait rien. */
	ouvrir(): void;
	/** Le gabarit courant — son identifiant, chaîne vide quand il n'y en a pas. */
	gabarit(): string;
	/**
	 * Repose un gabarit sans toucher au corps — la reprise d'un brouillon, dont le
	 * squelette est déjà dans le texte restauré.
	 */
	poser(gabarit: string): void;
	defaire(): void;
}

/**
 * LE CÂBLAGE — appelé depuis `onMount` de la route, après le montage de
 * l'éditeur, et jamais ailleurs.
 */
export function cablerLeChoixDeDepart(
	formulaire: HTMLFormElement,
	options: OptionsDuChoixDeDepart
): ChoixDeDepart {
	/**
	 * LE CHAMP CACHÉ DE PROVENANCE — créé une fois, réemployé ensuite. Il vit DANS le
	 * formulaire pour que la soumission le porte, et il est vide tant qu'aucun gabarit
	 * n'est pris : `lireLaSaisie()` lit alors « pas de provenance ».
	 *
	 * IL EST POSÉ AVANT TOUTE AUTRE CHOSE, DIALOGUE OU PAS. Le dialogue n'est rendu
	 * que par `?template=` ; après un changement de domaine, l'adresse rechargée n'a
	 * plus ce paramètre, et le champ n'existait alors nulle part où reposer la
	 * provenance du brouillon repris : la note s'enregistrait comme née de rien.
	 */
	const NOM_DU_CHAMP = 'template';
	const provenance =
		formulaire.querySelector<HTMLInputElement>(`input[name="${NOM_DU_CHAMP}"]`) ??
		formulaire.appendChild(formulaire.ownerDocument.createElement('input'));
	provenance.type = 'hidden';
	provenance.name = NOM_DU_CHAMP;

	const jetables: Debranchement[] = [];
	const inerte: ChoixDeDepart = {
		ouvrir: () => undefined,
		gabarit: () => provenance.value,
		poser: (gabarit) => {
			provenance.value = gabarit;
		},
		defaire: () => undefined
	};

	const dialogue = formulaire.querySelector<HTMLDialogElement>('#dlg-template');
	if (dialogue === null) return inerte;

	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => cible.removeEventListener(type, reaction));
	};

	/* LE GEL REND LE DIALOGUE OUVERT, ET IL EST REFERMÉ D'EMBLÉE : c'est `ouvrir()`
	   qui le remonte, en MODALE — `V-17:3576`, un `<dialog open>` non modal reste SOUS
	   la barre d'outils. `showModal()` REFUSE un dialogue déjà ouvert : la fermeture
	   d'abord, et l'ordre n'est pas interchangeable. */
	if (dialogue.hasAttribute('open')) dialogue.close();

	const fermer = (): void => {
		dialogue.close();
	};

	const prendre = (gabarit: Template): void => {
		options.inserer(documentDepuisHtml(gabarit.contenu, formulaire.ownerDocument));
		/* LA TRACE D'ORIGINE — l'identifiant du gabarit, celui que `lireTemplates()`
		   rend et que la base résout. Le contenu, lui, est déjà copié dans la zone de
		   rédaction : la note ne dépend plus du gabarit, elle se souvient d'en être
		   partie. */
		provenance.value = gabarit.id;
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
		ecouter(vierge, 'click', () => {
			/* Partir d'une page vierge, c'est n'avoir aucune provenance — y compris
			   après avoir pris un gabarit puis rouvert le choix. */
			provenance.value = '';
			fermer();
		});
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

	return {
		ouvrir: () => {
			/* UN GABARIT DÉJÀ PRIS RÉPOND À LA QUESTION : `?template=<id>` la tranche
			   avant qu'elle ne soit posée, et rouvrir le choix par-dessus le squelette
			   inséré ferait reculer l'utilisateur d'un pas. */
			if (dialogue.open || provenance.value !== '') return;
			dialogue.showModal();
		},
		gabarit: () => provenance.value,
		poser: (gabarit) => {
			provenance.value = gabarit;
		},
		defaire: () => {
			for (const defaire of jetables) defaire();
		}
	};
}
