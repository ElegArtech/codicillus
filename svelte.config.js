import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// Inclure les styles des vues dès la réponse HTML évite un rendu sans mise en forme.
		inlineStyleThreshold: 40000,
		alias: { $lib: 'src/lib' },
		// Aucun script hors de l'application : un corps de note piégé ne s'exécute pas.
		// Les images d'une note peuvent venir du web ; les styles en ligne restent admis.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				'media-src': ['self', 'blob:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self'],
				'frame-src': ['self'],
				'frame-ancestors': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
	}
};

export default config;
