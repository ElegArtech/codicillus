<script lang="ts">
	/**
	 * LE SOMMAIRE DE LA NOTE — V-14 et V-15, même balisage, même contenu.
	 *
	 * Le chargeur relève tous les titres du corps affiché. Les niveaux 1 et 2
	 * restent visibles au premier affichage ; H3 à H6 sont le détail que le
	 * lecteur peut révéler sans retirer leurs liens du DOM, afin que le suivi de
	 * lecture et le défilement doux restent branchés.
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
		/**
		 * LES TITRES DU CORPS AFFICHÉ — REQUISE, et c'est ce qui ferme le défaut.
		 *
		 * Elle était optionnelle et retombait sur les ONZE TITRES DE LA NOTE DE
		 * DÉMONSTRATION : une vue qui oubliait de la passer affichait le sommaire
		 * de « Restaurer une sauvegarde PostgreSQL » au-dessus d'un tout autre
		 * article, sans que rien ne proteste. Les deux vues qui montent ce
		 * composant la passent ; le compilateur garde désormais la porte.
		 *
		 * VIDE, LE SOMMAIRE LE DIT — « Aucun titre dans cette note ».
		 */
		entrees: readonly EntreeDeSommaire[];
	}

	const { classe = 'sommaire', entrees }: Proprietes = $props();

	const lignes = $derived(sommaireRendu(entrees));
	const porteDuDetail = $derived(lignes.some((ligne) => ligne.niveau > 2));
	let detailVisible = $state(false);
</script>

<nav class={classe} aria-label="Sommaire de la note" data-detail={detailVisible ? 'oui' : 'non'}>
	<div class="etiq">Sommaire</div>
	<!-- prettier-ignore -->
	<ul class="sommaire__liste" id="sommaire">{#each lignes as ligne (ligne.ancre)}<li
			class="n{ligne.profondeur}"
			class:sommaire__detail={ligne.niveau > 2}
		><a href="#{ligne.ancre}"
			>{#if ligne.numero}<span class="sommaire__num">{ligne.numero}</span>{/if}<span
				>{ligne.libelle}</span
			></a
		></li>{:else}<li class="n1"><span>Aucun titre dans cette note</span></li>{/each}</ul>
	{#if porteDuDetail}
		<button
			class="sommaire__detail-bascule"
			type="button"
			aria-controls="sommaire"
			aria-expanded={detailVisible}
			onclick={() => (detailVisible = !detailVisible)}
		>
			{detailVisible ? 'Masquer le détail' : 'Afficher le détail'}
		</button>
	{/if}
</nav>
