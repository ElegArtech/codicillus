<script lang="ts">
	/**
	 * `/console/exports` — V-36 Console · Exports.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * TOUT CE QUE CET ÉCRAN AFFICHE VIENT DE LA BASE, Y COMPRIS LE NOM DE
	 * L'ARCHIVE. Il l'annonçait à la date où le jeu de semence est figé, et sous
	 * une ardoise du nom d'affichage là où le fichier porte l'identifiant du
	 * domaine : un nom que l'utilisateur n'obtenait jamais. Le chargeur le fait
	 * désormais produire par la fabrique qui nomme l'archive pour de bon.
	 *
	 * ET SUR UNE INSTANCE NEUVE, IL N'EN AFFICHE AUCUN. Une installation réelle
	 * n'a aucun domaine : la table est alors vide, aucun domaine n'est choisi, et
	 * la vue ne rend pas l'arborescence d'archive plutôt que d'en nommer une.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-36.svelte';
	import '../../../vues/V-36.css';
	import { adresseDeLArchive } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LE BOUTON « PRÉPARER L'ARCHIVE » MÈNE À LA ROUTE QUI PRODUIT L'ARCHIVE.

	`P-03` — « une entrée visible est une entrée qui fonctionne. Pas de "bientôt
	disponible", pas de lien mort. » Le bouton était au gel, la route
	`/console/exports/{univers}/{domaine}` existait et produisait un ZIP : il ne
	manquait que le fil entre les deux.

	CE QUE CET ÉCRAN NE MONTRE TOUJOURS PAS : l'issue d'un export passé —
	avertissements, volume réel de l'archive. Aucune table ne l'enregistre
	(`MESURES_DE_CONSOLE_SANS_CONTREPARTIE`). L'écran présente le PÉRIMÈTRE
	exportable, jamais un export accompli, et les chiffres qu'il affiche sont
	comptés sur les notes du domaine.
-->
<Vue
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	nomsDArchive={data.nomsDArchive}
	dossiersParDomaine={data.dossiersParDomaine}
	onExporter={(domaine) => {
		/* LA DÉSIGNATION EST CANONIQUE, comme partout ailleurs : le sélecteur rend
		   un NOM de domaine, l'adresse attend deux identifiants lisibles
		   (`docs/routes.md` §2.2). La table vient du chargeur, lue en base. */
		const canonique = data.designations[domaine];
		if (canonique === undefined) return;
		/* UNE NAVIGATION DU DOCUMENT, PAS UNE NAVIGATION D'APPLICATION : la réponse
		   est une archive avec `content-disposition: attachment`, pas une page.
		   `goto()` de SvelteKit attend une page et ne saurait qu'en faire.

		   L'ADRESSE SORT D'UNE FABRIQUE, jamais d'un gabarit écrit ici — voir
		   `./cablage.ts`, qui dit pourquoi elle n'est pas dans la fabrique partagée. */
		document.location.assign(adresseDeLArchive(canonique));
	}}
/>
