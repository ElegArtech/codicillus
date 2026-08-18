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

	let { children } = $props();
</script>

{@render children()}
