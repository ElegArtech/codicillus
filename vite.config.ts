import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	/**
	 * LES CARTES DE SOURCE, À LA DEMANDE ET JAMAIS AUTREMENT.
	 *
	 * `aiguilles-dans-le-paquet.mjs` doit savoir QUI a mis un mot dans un morceau du
	 * paquet client : le produit, ou une bibliothèque tierce. Seule une carte de source
	 * le dit. Elle ne peut pas être posée en permanence — une carte livrée publie le
	 * code source —, et `'hidden'` est le seul mode qui l'émette SANS ajouter le
	 * commentaire qui la référence : le JavaScript rendu est alors identique à l'octet
	 * près, donc les empreintes de nom de fichier aussi, et le contrôle peut rapporter
	 * ce qu'il a appris sur la construction instrumentée AU paquet qui part vraiment.
	 */
	build: {
		sourcemap: process.env.AIGUILLES_CARTES === 'oui' ? 'hidden' : false
	},
	server: {
		port: Number(process.env.PORT_DEV ?? 5173),
		// Les captures et vidéos ne participent pas au rechargement du produit.
		watch: { ignored: ['**/docs/traces/**'] }
	}
});
