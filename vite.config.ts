import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { modeDemo } from './verif/banc/mode-demo.mjs';

// Chaîne de construction de l'application — lot T-002.
//
// `modeDemo()` monte la route `/__design/V-xx?etat=…` de l'annexe F du
// workflow : le mode démo de l'implémentation, seul moyen pour le banc de
// comparaison d'atteindre un état côté application (ÉCART-011 É-1).
//
// IL EST EN `apply: 'serve'`, ET C'EST LA GARANTIE. Le greffon n'est monté que
// par le serveur de développement : `vite build` ne le traverse jamais, aucun
// module de `verif/` n'entre dans le graphe applicatif, et le produit servi
// par `node build/index.js` ne connaît pas l'adresse. Une route SvelteKit
// gardée par un `if (dev)` existerait, elle, dans le build — la garde serait
// une convention, révocable d'une ligne. Ici, il n'y a rien à révoquer.
export default defineConfig({
	plugins: [sveltekit(), modeDemo()],
	server: {
		port: 5173
	}
});
