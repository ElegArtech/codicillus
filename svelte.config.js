import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Configuration SvelteKit — lot T-002.
 * Adaptateur Node : le service « app » de la composition d'exploitation
 * (STACK-TECHNIQUE.md §8) est une image construite qui exécute Node 24.
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// Rendu serveur avec hydratation ciblée (STACK-TECHNIQUE.md §4.1).
		alias: {
			$lib: 'src/lib'
		}
	}
};

export default config;
