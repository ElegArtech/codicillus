import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Chaîne de construction de l'application — lot T-002.
export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173
	}
});
