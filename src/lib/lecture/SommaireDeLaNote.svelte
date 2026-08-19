<script lang="ts">
	/**
	 * LE SOMMAIRE DE LA NOTE — V-14 et V-15, même balisage, même contenu.
	 *
	 * `construireSommaire()` (`V-14:3901`, `V-15:2625`) relève les titres de
	 * niveau 2 et 3 du corps affiché et en construit une liste : classe `n1`
	 * pour un `h2`, `n2` pour un `h3`, numéro sur deux chiffres devant les
	 * seuls niveaux 2, lien vers l'ancre du titre.
	 *
	 * LE SUIVI DE LECTURE N'EST PAS RENDU. Le gel pose `aria-current="true"`
	 * sur l'entrée du titre traversé, par un `IntersectionObserver` dont la
	 * bande d'observation va de 70 px à 28 % de la hauteur de fenêtre. C'est un
	 * COMPORTEMENT (ARB-011) : il n'a lieu qu'au défilement, et à l'instant de
	 * la capture — page en haut, l'en-tête de la note occupant toute la bande —
	 * aucun titre du corps n'y est entré. LE GEL NE POSE DONC L'ATTRIBUT SUR
	 * AUCUNE ENTRÉE, et ce composant non plus. Ce n'est pas une supposition :
	 * la règle `.sommaire a[aria-current="true"]` change la teinte du libellé,
	 * du numéro et de la bordure ; les 51 couples sortent à zéro pixel, sur les
	 * quatre fenêtres de V-14 comprises.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002) : `.sommaire`,
	 * `.sommaire__liste` et `.sommaire__num` viennent de la feuille de la vue.
	 */
	import { sommaireRendu, type EntreeDeSommaire } from './note-de-demonstration';

	interface Proprietes {
		/**
		 * La classe portée par le `<nav>`. V-14 y ajoute `vue-reelle`, parce
		 * qu'elle a un état de chargement et que son esquisse prend la place ;
		 * V-15 n'en a pas et porte `sommaire` seule.
		 */
		classe?: string;
		/** Les titres du corps affiché. Par défaut, ceux du registre Référence. */
		entrees?: readonly EntreeDeSommaire[];
	}

	const { classe = 'sommaire', entrees }: Proprietes = $props();

	const lignes = $derived(sommaireRendu(entrees));
</script>

<nav class={classe} aria-label="Sommaire de la note">
	<div class="etiq">Sommaire</div>
	<!-- prettier-ignore -->
	<ul class="sommaire__liste" id="sommaire">{#each lignes as ligne (ligne.ancre)}<li
			class={ligne.niveau === 2 ? 'n1' : 'n2'}
		><a href="#{ligne.ancre}"
			>{#if ligne.numero}<span class="sommaire__num">{ligne.numero}</span>{/if}<span
				>{ligne.libelle}</span
			></a
		></li>{/each}</ul>
</nav>
