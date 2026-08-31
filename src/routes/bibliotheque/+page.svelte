<script lang="ts">
	/**
	 * `/bibliotheque` — V-41 Bibliothèque de composants. Le rôle administrateur est
	 * éprouvé côté serveur par `+page.server.ts` (`ARB-002`).
	 *
	 * ELLE EST UNE PAGE RÉELLE DE L'APPLICATION, jamais une maquette morte
	 * (`STACK-TECHNIQUE.md` §4.1) : c'est là que toute dérive du système visuel
	 * devient visible immédiatement. Les notes viennent donc de la base.
	 */
	import Vue from '../../vues/V-41.svelte';
	import '../../vues/V-41.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LES SEPT SOURCES SONT PASSÉES, ET AUCUNE N'EST FACULTATIVE.

	`instance` NE VIENT PAS DU CHARGEUR DE CETTE PAGE : la version du produit est
	celle du paquet, servie une fois par le gabarit racine — en servir une seconde
	depuis ici serait une seconde source pour une seule vérité. La synchronisation
	est VIDE : aucune table ne porte cet instant.
-->
<Vue
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	instance={{ version: data.version, synchro: '' }}
	activite={data.activite}
	typesNote={data.typesNote}
/>
