<script lang="ts">
	/**
	 * Coquille applicative — l'en-tête, 64 px, collant.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002).
	 *
	 * TROIS ZONES : le bouton ☰ — rendu toujours, visible sous 1024 px seulement, où
	 * le rail devient un tiroir ; le fil d'Ariane ; et LA PARTIE DROITE, QUI
	 * APPARTIENT À LA VUE. Elle change à chaque écran — « + Créer » et l'avatar sur
	 * l'accueil, « Modifier » et le menu ⋮ sur une note, « ← Retour à la note » sur
	 * l'historique —, et la coquille n'a aucun moyen de la deviner : elle la reçoit
	 * en `Snippet`.
	 *
	 * LE MENU DE COMPTE ET LE MENU « CRÉER » ONT DÉMÉNAGÉ dans la carte de compte du
	 * rail. Aucune adresse n'est devenue inatteignable : `Rail.svelte` porte les
	 * mêmes entrées, plus Cartographie, Carte mentale, Signets, Import et Console.
	 */
	import type { Snippet } from 'svelte';

	interface Proprietes {
		/** Le chemin de la page, du premier segment au titre courant. */
		fil: readonly string[];
		/**
		 * L'ADRESSE DE CHAQUE SEGMENT DU FIL, dans l'ordre du fil.
		 *
		 * Les adresses se composent, et c'est `Coquille.svelte` qui les compose, seule
		 * à connaître le chemin de rangement courant qui donne son sens à chaque
		 * segment.
		 *
		 * Une case absente ne rend PAS un lien : le segment est alors du texte, parce
		 * qu'un lien qui ne mène nulle part est un geste promis et mort.
		 */
		cibles?: readonly (string | undefined)[];
		/** L'adresse de l'accueil — la maison en tête de fil. */
		accueil: string;
		/** Ce que la vue pose à droite de l'en-tête. Absent : rien à droite. */
		actions?: Snippet | undefined;
	}

	const { fil, cibles = [], accueil, actions }: Proprietes = $props();

	/**
	 * LA MAISON REMPLACE LE PREMIER SEGMENT quand il s'appelle « Accueil » : la
	 * référence dessine une maison, et répéter le mot à côté d'elle est un doublon.
	 * Les autres segments suivent, inchangés.
	 */
	const segments = $derived(fil[0] === 'Accueil' ? fil.slice(1) : fil);
	const ciblesDesSegments = $derived(fil[0] === 'Accueil' ? cibles.slice(1) : cibles);
	/** L'accueil EST la page courante quand le fil s'y arrête. */
	const surLAccueil = $derived(segments.length === 0);
</script>

<header class="barre">
	<!--
		☰ — LE RAIL EN TIROIR. Le bouton est rendu TOUJOURS et masqué au-dessus de
		1024 px par une requête de média : mesurer la largeur en JavaScript rendrait
		le premier affichage faux jusqu'au montage.
	-->
	<button class="barre__menu" type="button" data-ouvrir-tiroir="rail" aria-label="Navigation">
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"><path d="M2 4h12M2 8h12M2 12h12" /></svg
		>
	</button>

	<!-- eslint-disable svelte/no-navigation-without-resolve -- l'adresse d'un segment
		du fil est COMPOSÉE par `Coquille.svelte`, seule à savoir lequel est un univers,
		un domaine ou un dossier, et elle la compose par `$lib/rangement/adresses.ts`.
		La règle inspecte l'EXPRESSION du `href` : elle ne peut pas la suivre jusque là,
		et elle ne peut pas non plus la vérifier ici. -->
	<nav class="fil" id="fil" aria-label="Fil d'Ariane">
		{#if surLAccueil}<span class="fil__maison fil__courant" aria-current="page"
				><svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"><path d="M2.5 8L8 3l5.5 5M4 7v6h8V7" /></svg
				>Accueil</span
			>{:else}<a class="fil__maison" href={accueil} title="Accueil" aria-label="Accueil"
				><svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"><path d="M2.5 8L8 3l5.5 5M4 7v6h8V7" /></svg
				></a
			>{/if}{#each segments as segment, rang (rang)}<span class="fil__sep" aria-hidden="true"
				>›</span
			>{#if rang === segments.length - 1}<span class="fil__courant">{segment}</span
				>{:else if ciblesDesSegments[rang] === undefined}<span>{segment}</span>{:else}<a
					href={ciblesDesSegments[rang]}>{segment}</a
				>{/if}{/each}
	</nav>

	{#if actions}<div class="barre__actions">{@render actions()}</div>{/if}
</header>
