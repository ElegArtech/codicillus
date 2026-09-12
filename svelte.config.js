import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// Inclure les styles des vues dès la réponse HTML évite un rendu sans mise en forme.
		inlineStyleThreshold: 40000,
		alias: { $lib: 'src/lib' }
	}
};

export default config;
