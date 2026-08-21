<script lang="ts">
	/**
	 * `/carte-mentale` — V-21 Carte mentale.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Les notes viennent de `+page.server.ts`, qui porte le périmètre de droits.
	 * `T-070` l'avait posé sans chargeur, et il servait le jeu de semence — vingt-
	 * sept notes, titres compris — à tout connecté, sans le moindre droit.
	 *
	 * LES QUATRE RANGS DE L'ARBRE VIENNENT DÉSORMAIS DE LA BASE. Les univers et
	 * les domaines s'ajoutent aux notes : les deux propriétés existaient déjà sur
	 * la vue, optionnelles, et retombaient sur les constantes du jeu de semence.
	 * Un domaine qui n'est lisible par personne d'autre que son gestionnaire ne
	 * sort donc plus de la base pour les autres comptes — ni dans l'arbre, ni
	 * dans le sélecteur de périmètre, ni dans le rail que la coquille en tire.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import Vue from '../../vues/V-21.svelte';
	import '../../vues/V-21.css';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LA BASCULE « ARBRE / LISTE » — et c'est `P-06` qu'elle sert.
	 *
	 * « Alternative textuelle sur tout contenu graphique » est un principe non
	 * négociable : la carte mentale doit disposer d'une restitution exploitable
	 * SANS le rendu graphique. Le gel la rend en permanence et la révèle par
	 * cette bascule — `V-21.css:388`, `.app[data-affichage="liste"] .liste-arbre
	 * { display: block }` — et la bascule ne faisait rien. La restitution
	 * existait donc, et personne ne pouvait l'atteindre.
	 *
	 * On pose l'attribut que la règle GELÉE attend, et rien d'autre. Les deux
	 * boutons portent déjà `aria-pressed` : l'état est dit aux techniques
	 * d'assistance par le gel lui-même.
	 */
	onMount(() => {
		const app = enveloppe.querySelector('.app');
		const boutons = Array.from(
			enveloppe.querySelectorAll<HTMLButtonElement>('button[data-affichage]')
		);
		if (app === null || boutons.length === 0) return;
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
		return () => enveloppe.removeEventListener('click', basculer);
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue vecteur={data.vecteur} notes={data.notes} univers={data.univers} domaines={data.domaines} />
</div>
