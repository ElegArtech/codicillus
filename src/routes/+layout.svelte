<script lang="ts">
	// Enveloppe provisoire — lot T-002.
	// La coquille applicative réelle (navigation, en-tête, panneaux) est le lot
	// T-016, adossée à la maquette V-37. Rien n'est anticipé ici.

	// Le socle — lot T-004. Importé ici, et ici seulement : la mise en page
	// racine est le point d'entrée global de SvelteKit, et un import de feuille
	// depuis un `<script>` n'est pas encapsulé par le compilateur Svelte. La
	// feuille s'applique donc à toutes les routes, sans être portée par un
	// composant. `src/socle.css` est extrait mécaniquement du premier bloc
	// `<style>` de `mockups/V-07-accueil-contributeur.html` par
	// `pnpm socle:extraire` ; sa non-divergence est prouvée par
	// `pnpm verif:jetons` (batterie 2, ADR-002, ÉCART-007). Il ne s'édite pas.
	import '../socle.css';
	import { onMount } from 'svelte';
	import { cablerLaCoquille } from '$lib/cablage/coquille';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	/**
	 * LA COQUILLE EST CÂBLÉE ICI, ET UNE SEULE FOIS.
	 *
	 * Sa barre supérieure est rendue par trente-quatre vues, et ses boutons —
	 * menu « Créer », menu de l'utilisateur, boîte de recherche — portent des
	 * comportements que `ARB-011` retire des transcriptions. Aucun n'était
	 * câblé : la façon la plus évidente de créer une note ne créait rien, et se
	 * déconnecter demandait de taper l'adresse à la main.
	 *
	 * La mise en page racine est le seul endroit qui les voit tous. Le câblage y
	 * est délégué sur le document, donc insensible au changement de page.
	 */
	onMount(() =>
		cablerLaCoquille(document, {
			rangement: data.rangement,
			administrateur: data.administrateur
		})
	);
</script>

{@render children()}
