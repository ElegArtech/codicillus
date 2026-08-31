<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/dossiers/{chemin…}` — V-13 Page d'un dossier. Ce fichier
	 * rend la vue et CÂBLE les gestes du gel : `ARB-063` autorise à nommer ici les champs du
	 * gel, qu'aucune vue ne porte. `#a-sousdossier` → `?/creerSousDossier`, `#a-renommer` →
	 * `?/renommerOuDeplacer`, `#a-supprimer` → `?/supprimer`, `#a-droits` → les trois
	 * actions de droits ; `#a-note` est une navigation. DEUX DE CES GESTES N'EXISTENT PAS
	 * SUR LA RACINE D'UN DOMAINE : la vue les omet quand le chemin est vide, le module de
	 * données refusant muettement tout dossier sans parent.
	 *
	 * TROIS PIÈGES SONT ÉVITÉS ICI, ET CHACUN A COÛTÉ : un `button` sans attribut `type`
	 * dans un formulaire SOUMET — le gel en porte huit dans ces dialogues, tous passés en
	 * `type="button"` à l'installation ; `formulaire.action` ne se réécrit JAMAIS avant
	 * `requestSubmit()`, `soumettreVers()` posant un soumetteur caché ;
	 * `svelte/no-dom-manipulating` refuse qu'on insère un nœud sous un arbre que le
	 * compilateur croit connaître, et aucun champ n'est créé à la volée — poser un `name`
	 * sur un nœud existant, en revanche, n'insère rien.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Vue from '../../../../../../vues/V-13.svelte';
	import '../../../../../../vues/V-13.css';
	import { soumettreVers } from '$lib/cablage/formulaires';
	import { NOM_DU_COMPTE_VISE, nomDuNiveau } from './champs-de-droits';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/**
	 * LES TROIS REFUS, LUS SANS DÉTOUR. `fail()` rend un objet par action ; les
	 * trois formes sont disjointes, et une lecture par champ optionnel les distingue
	 * sans avoir à deviner laquelle est arrivée.
	 */
	interface Refus {
		readonly creation?: string;
		readonly deplacement?: string;
		readonly suppression?: string;
		readonly droits?: string;
	}
	const refus = $derived((form ?? null) as Refus | null);

	let formulaire: HTMLFormElement;

	/**
	 * LES NOMS DES CHAMPS DU GEL — posés ici, jamais dans la vue (`ARB-063`). Le gel
	 * ne nomme aucun de ses champs : soumis tels quels, ils n'enverraient rien.
	 * Chaque nom est distinct des autres parce que TOUS les champs du formulaire
	 * voyagent à CHAQUE soumission — les dialogues vivent dans le même formulaire,
	 * fermés. Deux champs de même nom, et l'action lirait celui de l'autre dialogue.
	 */
	const NOMS: Record<string, string> = {
		'creer-nom': 'nom',
		'dep-nom': 'nouveauNom',
		'sup-saisie': 'confirmation'
	};

	function dialogue(racine: HTMLFormElement, id: string): HTMLDialogElement | null {
		return racine.querySelector<HTMLDialogElement>(`#${id}`);
	}

	onMount(() => {
		const debranchements: (() => void)[] = [];
		function surClic(cible: Element | null, faire: () => void): void {
			if (cible === null) return;
			const ecoute = (): void => {
				faire();
			};
			cible.addEventListener('click', ecoute);
			debranchements.push(() => {
				cible.removeEventListener('click', ecoute);
			});
		}

		/* 1. Aucun bouton du gel ne soumet par accident. */
		for (const bouton of Array.from(formulaire.querySelectorAll('button'))) {
			if (!bouton.hasAttribute('type')) bouton.type = 'button';
		}

		/* 2. Les champs du gel reçoivent leur nom. */
		for (const [id, nom] of Object.entries(NOMS)) {
			const champ = formulaire.querySelector<HTMLInputElement>(`#${id}`);
			if (champ !== null) champ.name = nom;
		}

		/* 3. Toute croix et tout « Annuler » ferme son dialogue — `V-13:2183`. */
		for (const bouton of Array.from(formulaire.querySelectorAll('[data-fermer]'))) {
			surClic(bouton, () => bouton.closest('dialog')?.close());
		}

		const dlgCreer = dialogue(formulaire, 'dlg-creer');
		const dlgDeplacer = dialogue(formulaire, 'dlg-deplacer');
		const dlgSupprimer = dialogue(formulaire, 'dlg-supprimer');
		const champCreer = formulaire.querySelector<HTMLInputElement>('#creer-nom');
		const champDep = formulaire.querySelector<HTMLInputElement>('#dep-nom');
		const champSup = formulaire.querySelector<HTMLInputElement>('#sup-saisie');
		const validerSup = formulaire.querySelector<HTMLButtonElement>('#sup-valider');

		/* 4. NOUVELLE NOTE — une NAVIGATION, pas une action : rien n'est écrit ici,
		   et le droit qui la gouverne est celui de la route d'arrivée.

		   `docs/routes.md:287-288` prévoit quatre paramètres de pré-remplissage sur
		   `/notes/nouvelle` — `titre`, `domaine`, `dossier`, `template`. Les deux
		   qui font sens ici sont émis, et tous deux sont honorés LÀ-BAS :
		   `notes/nouvelle/+page.svelte` lit `domaine` et le porte à la vue par
		   `compte.domaine`, dont l'arborescence du choix se déduit ; il lit
		   `dossier` et le porte par `dossierDeDepart`, qui coche le bouton radio.

		   `dossier` PORTE LA FORME AFFICHÉE DU CHEMIN — celle que `Note.dossier`
		   porte, celle que V-17 compare pour cocher, celle que la soumission
		   renvoie. `data.vecteur.dos` la tient déjà, remontée par le chargeur. La
		   forme d'adresse, en segments slugifiés, ne conviendrait pas : rien à
		   l'arrivée ne saurait la relire contre l'arborescence de choix.

		   LA RACINE D'UN DOMAINE A UNE PAGE, ET C'EST LÀ QUE `dos` EST VIDE.
		   `+page.server.ts` l'ouvre depuis le 22/08/2026 — « LA RACINE A UNE
		   ADRESSE : celle qui porte son seul nom » — et la tuile « Dossiers » de
		   V-11 y mène. Or `segmentsAffiches()` remonte les ancêtres SANS
		   consommer la racine : le chemin affiché d'une racine est la suite vide,
		   donc la chaîne vide. Ce n'est pas une absence de dossier, c'est le
		   dossier qui n'a pas de segment sous lui.

		   L'ARBORESCENCE DE CHOIX, ELLE, OFFRE CETTE RACINE SOUS LE NOM DU
		   DOMAINE — `lireLArborescenceDeChoix()` la pose en premier choix, à côté
		   de ses enfants et non au-dessus. C'est donc le nom du domaine qu'il
		   faut émettre là, et non rien : sans quoi le seul écran où un domaine
		   NEUF offre ces deux gestes — il n'a que sa racine, et c'est `v-note`
		   qui s'y affiche — serait précisément celui qui ne tiendrait pas la
		   promesse. Si les deux noms venaient à diverger, la vérification faite à
		   l'arrivée n'y reconnaît aucun dossier et ignore le paramètre en
		   silence : la dégradation est celle d'un lien périmé, pas une erreur. */
		for (const id of ['a-note', 'v-note']) {
			surClic(formulaire.querySelector(`#${id}`), () => {
				/* L'adresse est composée en OBJET plutôt qu'en chaîne : `resolve()` rend
				   le chemin de la route, et le paramètre est posé par `searchParams`,
				   qui l'encode. Rien n'est concaténé, donc rien n'est à échapper —
				   c'est la forme d'`ARB-038` appliquée à une adresse.

				   LA RÈGLE EST DÉSARMÉE ICI, ET SUR UNE LIGNE. `ResolvedPathname` est
				   un type de CHEMIN — `.svelte-kit/non-ambient.d.ts:104` : préfixe de
				   base suivi d'un `Pathname` de route. Une chaîne de requête n'en fait
				   pas partie, donc aucune adresse portant `?…` ne peut satisfaire la
				   règle, quelle que soit la façon de l'écrire. Le chemin, lui, PASSE
				   bien par `resolve()` — ce que la règle protège est tenu ; ce qu'elle
				   ne sait pas exprimer est le paramètre. Même désarmement qu'en
				   `V-03`, `V-22` et `V-24`. */
				const cible = new URL(resolve('/notes/nouvelle'), window.location.origin);
				cible.searchParams.set('domaine', data.domaine);
				cible.searchParams.set(
					'dossier',
					data.vecteur.dos === '' ? data.domaine : data.vecteur.dos
				);
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				void goto(cible);
			});
		}

		/* 5. Nouveau sous-dossier — `V-13:2189`-`2202`. */
		for (const id of ['a-sousdossier', 'v-sousdossier']) {
			surClic(formulaire.querySelector(`#${id}`), () => {
				if (champCreer !== null) champCreer.value = '';
				dlgCreer?.showModal();
				champCreer?.focus();
			});
		}
		surClic(formulaire.querySelector('#creer-valider'), () => {
			soumettreVers(formulaire, '?/creerSousDossier');
		});

		/* 6. Renommer ou déplacer — `V-13:2308`-`2313`. Le nom est resélectionné,
		   comme au gel : on renomme plus souvent qu'on ne déplace. */
		surClic(formulaire.querySelector('#a-renommer'), () => {
			dlgDeplacer?.showModal();
			champDep?.focus();
			champDep?.select();
		});
		surClic(formulaire.querySelector('#dep-valider'), () => {
			soumettreVers(formulaire, '?/renommerOuDeplacer');
		});

		/* 7. Supprimer — `RG-M03-04`. Le bouton reste inactif tant que la saisie ne
		   correspond pas au nom exact (`V-13:2360`-`2368`). Le serveur refuse de
		   toute façon : une désactivation d'écran n'est pas un contrôle.

		   LE NOM COMPARÉ EST CELUI QUE LE DIALOGUE AFFICHE — `#sup-cible` —, et non
		   une seconde copie tirée de l'adresse : comparer à autre chose que ce qui
		   est montré serait demander un mot qu'on n'a pas donné. */
		const cible = formulaire.querySelector('#sup-cible')?.textContent ?? '';
		surClic(formulaire.querySelector('#a-supprimer'), () => {
			if (champSup !== null) champSup.value = '';
			if (validerSup !== null) validerSup.disabled = true;
			dlgSupprimer?.showModal();
			champSup?.focus();
		});
		if (champSup !== null && validerSup !== null) {
			const surSaisie = (): void => {
				validerSup.disabled = champSup.value !== cible;
			};
			champSup.addEventListener('input', surSaisie);
			debranchements.push(() => {
				champSup.removeEventListener('input', surSaisie);
			});
		}
		surClic(validerSup, () => {
			soumettreVers(formulaire, '?/supprimer');
		});

		/* 8. GÉRER LES DROITS — `#a-droits`, le geste que le gel dessinait sans lui
		   donner d'écran. Trois actions, et le COMPTE VISÉ voyage par le
		   SOUMETTEUR : un formulaire n'envoie que celui qui l'a déclenché, ce qui
		   est la seule façon de désigner une ligne parmi plusieurs sans que deux
		   champs de même nom se marchent dessus (`./champs-de-droits.ts`).

		   LE NIVEAU, LUI, EST UN CHAMP ORDINAIRE, donc il voyage TOUJOURS — comme
		   les trois champs du gel. Son nom porte l'identifiant du compte de sa
		   ligne, ce qui rend la collision impossible par construction. Poser un
		   `name` sur un nœud existant n'insère rien dans l'arbre : c'est le même
		   geste qu'au point 2, et `svelte/no-dom-manipulating` n'y voit rien. */
		const dlgDroits = dialogue(formulaire, 'dlg-droits');
		surClic(formulaire.querySelector('#a-droits'), () => {
			dlgDroits?.showModal();
		});

		for (const selecteur of Array.from(
			formulaire.querySelectorAll<HTMLSelectElement>('#liste-droits select[data-compte]')
		)) {
			const compte = selecteur.dataset['compte'] ?? '';
			selecteur.name = nomDuNiveau(compte);
			const surChangement = (): void => {
				soumettreVers(formulaire, '?/changerLeDroit', {
					nom: NOM_DU_COMPTE_VISE,
					valeur: compte
				});
			};
			selecteur.addEventListener('change', surChangement);
			debranchements.push(() => {
				selecteur.removeEventListener('change', surChangement);
			});
		}

		for (const croix of Array.from(
			formulaire.querySelectorAll<HTMLButtonElement>('#liste-droits button[data-compte]')
		)) {
			surClic(croix, () => {
				soumettreVers(formulaire, '?/retirerLeDroit', {
					nom: NOM_DU_COMPTE_VISE,
					valeur: croix.dataset['compte'] ?? ''
				});
			});
		}

		/* LE NIVEAU DE LA LIGNE D'AJOUT REÇOIT SON NOM AU DERNIER MOMENT, parce
		   qu'il dépend du compte choisi juste au-dessus — et que ce choix change
		   jusqu'au clic. Le nommer au montage figerait le premier candidat. */
		const quiDoter = formulaire.querySelector<HTMLSelectElement>('#droit-qui');
		const niveauADoter = formulaire.querySelector<HTMLSelectElement>('#droit-role');
		surClic(formulaire.querySelector('#droit-ajouter'), () => {
			const compte = quiDoter?.value ?? '';
			if (niveauADoter !== null) niveauADoter.name = nomDuNiveau(compte);
			soumettreVers(formulaire, '?/accorderLeDroit', {
				nom: NOM_DU_COMPTE_VISE,
				valeur: compte
			});
		});

		/* 9. Un refus rouvre SON dialogue, jamais un autre : le message est déjà
		   rendu par la vue, mais un dialogue fermé ne montre rien. */
		if (refus?.creation !== undefined) dlgCreer?.showModal();
		if (refus?.deplacement !== undefined) dlgDeplacer?.showModal();
		if (refus?.suppression !== undefined) dlgSupprimer?.showModal();
		if (refus?.droits !== undefined) dlgDroits?.showModal();

		return () => {
			for (const defaire of debranchements) defaire();
		};
	});
</script>

<form method="POST" bind:this={formulaire} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		domaine={data.domaine}
		universDuDomaine={data.universDuDomaine}
		modifications={data.modifications}
		rangement={data.rangement}
		origineDuDroit={data.origineDuDroit}
		erreurDeCreation={refus?.creation ?? null}
		erreurDeDeplacement={refus?.deplacement ?? null}
		droits={data.droits}
		erreurDeDroits={refus?.droits ?? null}
	/>
</form>
