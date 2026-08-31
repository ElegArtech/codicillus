<script lang="ts">
	/**
	 * `/carte-mentale` — V-21 Carte mentale. Les notes viennent de
	 * `+page.server.ts`, qui porte le périmètre de droits.
	 *
	 * LES QUATRE RANGS DE L'ARBRE VIENNENT DE LA BASE. Les deux propriétés d'univers
	 * et de domaines existaient déjà, optionnelles, et retombaient sur les constantes
	 * du jeu de semence : un domaine qui n'est lisible que par son gestionnaire ne
	 * sort donc plus de la base pour les autres comptes — ni dans l'arbre, ni dans le
	 * sélecteur de périmètre, ni dans le rail que la coquille en tire.
	 */
	import Vue from '../../vues/V-21.svelte';
	import '../../vues/V-21.css';
	import { onMount } from 'svelte';
	import { Attaches, cablerLaVue } from '$lib/graphe/commandes';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LA BASCULE « ARBRE / LISTE » — et c'est `P-06` qu'elle sert : « alternative
	 * textuelle sur tout contenu graphique » est un principe non négociable. Le gel
	 * rend la restitution en permanence et la révèle par cette bascule
	 * (`.app[data-affichage="liste"] .liste-arbre { display: block }`), et la bascule
	 * ne faisait rien : la restitution existait, et personne ne pouvait l'atteindre.
	 *
	 * On pose l'attribut que la règle GELÉE attend, et rien d'autre. Les deux boutons
	 * portent déjà `aria-pressed`.
	 */
	onMount(() => {
		/**
		 * LES TROIS OUTILS DE `div.outils-graphe` — les mêmes qu'aux deux cartographies,
		 * et par le même code : `cablerLaVue()` écrit la transformation de `g#racine`,
		 * l'attribut que le gel y pose déjà.
		 */
		const attaches = new Attaches();
		cablerLaVue(enveloppe, attaches);

		/* Le sélecteur montre ce que l'adresse porte. Le gel n'écrit aucun
		   `selected` : le poser au balisage ferait diverger le document servi de
		   la référence pour un effet que cette ligne obtient sans y toucher. */
		const perimetre = enveloppe.querySelector<HTMLSelectElement>('#perimetre');
		if (perimetre !== null) perimetre.value = data.perimetreDemande;

		const app = enveloppe.querySelector('.app');
		const boutons = Array.from(
			enveloppe.querySelectorAll<HTMLButtonElement>('button[data-affichage]')
		);
		if (app === null || boutons.length === 0) return attaches.debranchement();
		const basculer = (evenement: Event): void => {
			const bouton = (evenement.target as Element | null)?.closest<HTMLButtonElement>(
				'button[data-affichage]'
			);
			if (bouton === null || bouton === undefined) return;
			evenement.preventDefault();
			const choisi = bouton.dataset['affichage'] ?? 'arbre';
			app.setAttribute('data-affichage', choisi);
			for (const autre of boutons) {
				autre.setAttribute('aria-pressed', autre === bouton ? 'true' : 'false');
			}
		};
		enveloppe.addEventListener('click', basculer);
		return () => {
			enveloppe.removeEventListener('click', basculer);
			attaches.debranchement()();
		};
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		univers={data.univers}
		domaines={data.domaines}
		perimetreDemande={data.perimetreDemande}
	/>
</div>
