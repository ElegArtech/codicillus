<script lang="ts">
	/**
	 * `/console` — CE COMPOSANT N'EST JAMAIS RENDU, et c'est une propriété du
	 * chargeur, pas un espoir : `+page.server.ts` sort par l'une de ses deux issues à
	 * chaque appel, redirection 308 ou `error(404, …)`.
	 *
	 * Il existe parce que le routeur exige un composant là où il voit une page, et la
	 * page est la seule forme qui fasse traverser `+error.svelte` au refus — un
	 * `+server.ts` rendait le repli de SvelteKit, 23 octets contre les 31 988 de V-26.
	 *
	 * AUCUN CONTENU N'EST INVENTÉ ICI : `docs/routes.md:173` porte un tiret dans sa
	 * colonne « vue », et un fragment vide est la seule transcription fidèle de ce
	 * silence.
	 */
</script>
