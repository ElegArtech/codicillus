<script lang="ts">
	/**
	 * `/console/exports` — V-36 Console · Exports. Le rôle administrateur est éprouvé
	 * côté serveur par `+page.server.ts`.
	 *
	 * TOUT CE QUE CET ÉCRAN AFFICHE VIENT DE LA BASE, Y COMPRIS LE NOM DE L'ARCHIVE.
	 * Il l'annonçait à la date où le jeu de semence est figé, et sous une ardoise du
	 * nom d'affichage là où le fichier porte l'identifiant du domaine : un nom que
	 * l'utilisateur n'obtenait jamais. Le chargeur le fait produire par la fabrique
	 * qui nomme l'archive pour de bon.
	 *
	 * ET SUR UNE INSTANCE NEUVE, IL N'EN AFFICHE AUCUN : la table est vide, aucun
	 * domaine n'est choisi, et la vue ne rend pas l'arborescence d'archive.
	 */
	import Vue from '../../../vues/V-36.svelte';
	import '../../../vues/V-36.css';
	import { adresseDeLArchive } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LE BOUTON « PRÉPARER L'ARCHIVE » MÈNE À LA ROUTE QUI PRODUIT L'ARCHIVE. `P-03` :
	« une entrée visible est une entrée qui fonctionne. Pas de "bientôt disponible",
	pas de lien mort. »

	CE QUE CET ÉCRAN NE MONTRE TOUJOURS PAS : l'issue d'un export passé —
	avertissements, volume réel de l'archive. Aucune table ne l'enregistre. L'écran
	présente le PÉRIMÈTRE exportable, jamais un export accompli, et les chiffres
	qu'il affiche sont comptés sur les notes du domaine.
-->
<Vue
	notes={data.notes}
	domaines={data.domaines}
	nomsDArchive={data.nomsDArchive}
	onExporter={(domaine) => {
		/* LA DÉSIGNATION EST CANONIQUE, comme partout ailleurs : le sélecteur rend
		   un NOM de domaine, l'adresse attend deux identifiants lisibles
		   (`docs/routes.md` §2.2). La table vient du chargeur, lue en base. */
		const canonique = data.designations[domaine];
		if (canonique === undefined) return;
		/* UNE NAVIGATION DU DOCUMENT, PAS UNE NAVIGATION D'APPLICATION : la réponse est
		   une archive avec `content-disposition: attachment`, pas une page, et `goto()`
		   de SvelteKit attend une page. L'ADRESSE SORT D'UNE FABRIQUE — voir
		   `./cablage.ts`. */
		document.location.assign(adresseDeLArchive(canonique));
	}}
/>
