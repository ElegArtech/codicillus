<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/dossiers/{chemin…}` — V-13 Page d'un dossier.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur et les notes viennent de `+page.server.ts`, qui porte la
	 * traduction du chemin, l'exigence du module `dossiers` (RG-STR-06), le
	 * périmètre et le droit effectif.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../../../vues/V-13.svelte';
	import '../../../../../../vues/V-13.css';
	import { soumettreVers } from '$lib/cablage/formulaires';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let formulaire: HTMLFormElement;
	let champNom: HTMLInputElement;

	/**
	 * « NOUVEAU SOUS-DOSSIER » — le geste que le gel dessine et que rien
	 * n'atteignait.
	 *
	 * `mockups/V-13-page-dossier.html:1161` pose le bouton, `:1209` son dialogue :
	 * un champ, « Nom du dossier », obligatoire, et le parent rappelé en toutes
	 * lettres. `src/vues/V-13.svelte` transcrit le bouton et PAS le dialogue — un
	 * `dialog` fermé ne portant aucune boîte de rendu, la transcription l'a
	 * déclaré non rendu.
	 *
	 * La demande passe donc par l'invite du navigateur, comme la confirmation de
	 * suppression : c'est le même écart, déjà déclaré, et non une nouvelle
	 * famille. Le fond est tenu — aucun dossier n'est créé sans nom, et le parent
	 * est nommé —, la forme ne l'est pas. Elle attend un regel.
	 *
	 * `P-09` est servie par la vue : le bouton n'est rendu qu'au gestionnaire.
	 */
	onMount(() => {
		for (const bouton of Array.from(formulaire.querySelectorAll('button'))) {
			if (!bouton.hasAttribute('type')) bouton.type = 'button';
		}
		const bouton = formulaire.querySelector<HTMLButtonElement>('#a-sousdossier');
		if (bouton === null) return;
		const creer = (): void => {
			const parent = data.vecteur.dos;
			const nom = window.prompt(`Nom du sous-dossier à créer dans ${parent}`);
			if (nom === null || nom.trim() === '') return;
			/* Le champ est DÉCLARÉ dans le balisage plutôt que créé à la volée :
			   `svelte/no-dom-manipulating` refuse, à juste titre, qu'on insère un
			   nœud sous un arbre que le compilateur croit connaître. */
			champNom.value = nom.trim();
			soumettreVers(formulaire, '?/creerSousDossier');
		};
		bouton.addEventListener('click', creer);
		return () => bouton.removeEventListener('click', creer);
	});
</script>

<form method="POST" bind:this={formulaire} style="display:contents">
	<input type="hidden" name="nom" bind:this={champNom} />
	<Vue vecteur={data.vecteur} notes={data.notes} />
</form>
