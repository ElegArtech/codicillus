<script lang="ts">
	/**
	 * `/guides/{identifiant}` — V-03 Lecture publique d'un guide.
	 *
	 * Ce fichier ne fait que rendre la vue. La résolution — 200 ou 404, sur la
	 * note réellement demandée — est dans `+page.server.ts`, qui porte le
	 * périmètre public et le point de sortie unique du refus.
	 *
	 * `vecteur={null}` demande à la vue son état par défaut : ses deux axes
	 * décrivent la note affichée, et l'article de V-03 est celui du gel. Voir
	 * l'en-tête du chargeur, et `LACUNES_DU_CHEMIN_PUBLIC`.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3). Cette route ne rend
	 * qu'une vue : l'import direct suffit, et aucun croisement de feuille n'est à
	 * mesurer.
	 */
	import Vue from '../../../vues/V-03.svelte';
	import '../../../vues/V-03.css';

	/* `data` n'est pas lue : la vue n'a pas d'axe qui reçoive la note résolue. */
</script>

<Vue vecteur={null} />
