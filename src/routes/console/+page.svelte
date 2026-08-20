<script lang="ts">
	/**
	 * `/console` — CE COMPOSANT N'EST JAMAIS RENDU, et c'est une propriété du
	 * chargeur, pas un espoir.
	 *
	 * `+page.server.ts` sort par l'une de ses deux issues à chaque appel : une
	 * redirection 308 vers `/console/univers` pour l'administrateur
	 * (`docs/routes.md:173`), un `error(404, …)` pour tout autre appelant
	 * (`docs/routes.md:372`). Aucun chemin ne mène à un rendu.
	 *
	 * Il existe parce que le routeur exige un composant là où il voit une page,
	 * et la page est la seule forme qui fasse traverser `+error.svelte` au refus :
	 * un `+server.ts` rendait le repli de SvelteKit — 23 octets — contre les
	 * 31 988 de V-26, écart mesuré et refermé (voir l'en-tête du chargeur).
	 *
	 * AUCUN CONTENU N'EST INVENTÉ ICI. Le gel ne décrit aucune vue pour cette
	 * adresse : `docs/routes.md:173` porte un tiret dans sa colonne « vue ». Un
	 * fragment vide est donc la seule transcription fidèle du silence de la
	 * source, et le seul rendu qui ne comble rien.
	 */
</script>
