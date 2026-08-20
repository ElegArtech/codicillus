<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}` — V-11 Page d'un domaine.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur, les notes, le rangement lisible, les deux tables de mesure et
	 * les demandes de révision viennent de `+page.server.ts`, qui porte la
	 * résolution du couple univers × domaine, le périmètre et les droits.
	 *
	 * SEPT PROPRIÉTÉS DE PLUS QUE LE PREMIER CÂBLAGE, et six d'entre elles sont
	 * celles que `T-041` avait rendues passables sans que rien ne les passe. La
	 * septième — `nombreDeDossiers` — est nouvelle : le compteur du module
	 * « Dossiers » se déduisait du rangement des notes, et un dossier vide n'y
	 * comptait pas. Toutes sont OPTIONNELLES sur la vue, dont le défaut reste
	 * `seeds/corpus.ts` pour le mode démo du banc, qui n'en passe aucune.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../../../vues/V-11.svelte';
	import '../../../../vues/V-11.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	detailDomaines={data.detailDomaines}
	nombreDeDossiers={data.nombreDeDossiers}
	mesures7j={data.mesures7j}
	modifications={data.modifications}
	revisions={data.revisions}
/>
