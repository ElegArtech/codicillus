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
		/**
		 * LES FEUILLES DE STYLE ENTRENT DANS LE DOCUMENT, ELLES NE SE DEMANDENT PLUS.
		 *
		 * Chaque vue porte sa feuille (`V-11.css` et les quarante-trois autres), et
		 * SvelteKit la servait en `<link>` séparé : le navigateur ne la découvre qu'en
		 * analysant l'en-tête, puis attend un aller-retour de plus avant de pouvoir
		 * peindre. Mesuré sur l'instance, sur la page d'un domaine : pendant
		 * soixante-cinq millisecondes le document existe SANS la feuille de la vue —
		 * `.stat` n'est pas encore en `inline-flex`, ses chiffres tombent au gras par
		 * défaut du navigateur, et tout se recale ensuite. Chromium ne peint pas cette
		 * fenêtre sur un cache chaud ; elle est peinte dès que le réseau est plus lent.
		 *
		 * LE SEUIL COUVRE LA PLUS GROSSE FEUILLE DU PAQUET — 38 Ko. Une page en porte
		 * deux, celle du socle et celle de sa vue : soixante-dix kilo-octets de style
		 * dans le document au pire, une douzaine une fois compressés par le frontal.
		 * C'est le prix d'une page qui n'a jamais d'état intermédiaire.
		 *
		 * CE QUE ÇA COÛTE, ET IL FAUT LE SAVOIR : le style n'est plus mis en cache
		 * d'une page à l'autre, il repart à chaque chargement complet. Les navigations
		 * de client, elles, ne rechargent pas le document et n'y perdent rien.
		 */
		inlineStyleThreshold: 40000,
		// Rendu serveur avec hydratation ciblée (STACK-TECHNIQUE.md §4.1).
		alias: {
			$lib: 'src/lib'
		}
	}
};

export default config;
