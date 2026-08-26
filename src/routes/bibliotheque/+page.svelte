<script lang="ts">
	/**
	 * `/bibliotheque` — V-41 Bibliothèque de composants.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.7 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES —
	 * seule sa redirection d'anonyme, décidée sur le préfixe, avait un verdict
	 * opposable. `T-036` la monte avec sa garde : le rôle administrateur est
	 * éprouvé côté serveur par `+page.server.ts`, à côté de ce fichier
	 * (`ARB-002`).
	 *
	 * ELLE EST UNE PAGE RÉELLE DE L'APPLICATION, jamais une maquette morte
	 * (`STACK-TECHNIQUE.md` §4.1) : c'est là que toute dérive du système visuel
	 * devient visible immédiatement. Les notes viennent donc de la base, comme
	 * pour n'importe quelle page — voir le chargeur pour ce que cela change des
	 * trois notes-échantillons du témoin de fraîcheur.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../vues/V-41.svelte';
	import '../../vues/V-41.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LES SEPT SOURCES SONT PASSÉES, ET AUCUNE N'EST FACULTATIVE.

	`instance` NE VIENT PAS DU CHARGEUR DE CETTE PAGE : la version du produit est
	celle du paquet, servie une fois par le gabarit racine — c'est la même que le
	pied du rail affiche partout ailleurs, et en servir une seconde depuis ici
	serait une seconde source pour une seule vérité. La synchronisation est VIDE :
	aucune table ne porte cet instant, et la vue ne lit que la version.
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
