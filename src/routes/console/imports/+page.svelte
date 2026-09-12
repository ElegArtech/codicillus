<script lang="ts">
	/**
	 * `/console/imports` — V-35 Console · Imports. Le rôle administrateur est éprouvé
	 * côté serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * `etat` N'EST PAS PASSÉ : la propriété nomme la zone que le banc découpe et ne
	 * change rien au rendu de trois des quatre états ; le banc n'atteint jamais cette
	 * route. Ne rien passer rend la page entière au repos, ce qui est l'état du
	 * produit.
	 *
	 * Les notes ET le journal des imports viennent de la base — `lots_d_import`,
	 * migration `009`. Le rapport détaillé d'un lot est une ADRESSE, pas un état
	 * local : `/console/imports/{lot}`.
	 */
	import Vue from '../../../vues/V-35.svelte';
	import '../../../vues/V-35.css';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { adresseDeDomaine } from '$lib/rangement/adresses';
	import type { PageData } from './$types';
	import type { ScenarioDImport } from '$lib/donnees/scenarios-d-import';

	const { data }: { data: PageData } = $props();
</script>

<!--
	NI RAIL, NI IDENTITÉ, NI VERSION : LA COQUILLE LES LIT AU CONTEXTE. Les
	quatre propriétés ne servaient qu'à traverser la vue jusqu'à
	`CoquilleDeConsole`, qui retombait sur `seeds/corpus.ts`.
-->
<Vue
	notes={data.notes}
	journalImports={data.journalImports}
	journalEnregistre={data.journalEnregistre}
	aDesUnivers={data.aDesUnivers}
	aDesDomaines={data.aDesDomaines}
	onOuvrirLeRapport={(lot) => {
		/* LE RAPPORT D'UN LOT EST UNE ADRESSE — `/console/imports/{lot}`
		   (`docs/routes.md`) : « un objet identifié et consultable indéfiniment est
		   un objet adressable ». Le détail vit dans `lignes_de_lot`, et il n'est pas
		   dans la charge utile de cette page. */
		void goto(resolve('/console/imports/[lot]', { lot }));
	}}
	onOuvrirLeDomaine={(domaine) => {
		/* « OUVRIR LE DOMAINE » DU RAPPORT — la désignation est canonique, comme
		   partout ailleurs en console : le rapport porte un nom d'affichage,
		   l'adresse attend deux identifiants lisibles. La table vient du chargeur.

		   CE GESTE S'ATTEINT DEPUIS LE RAPPORT D'UN LOT, à
		   `/console/imports/{lot}` : le journal de cette page mène au rapport, et
		   c'est le rapport qui ouvre le domaine. */
		const canonique = data.designations[domaine];
		if (canonique === undefined) return;
		/* LA RÈGLE EST DÉSARMÉE, ET LE PRÉCÉDENT EST CELUI DU DÉPÔT.
		   `svelte/no-navigation-without-resolve` veut voir `resolve()` au point
		   d'appel. L'adresse vient ici de `$lib/rangement/adresses.ts`, que le plan
		   de remédiation §3.3 rend OBLIGATOIRE — « les adresses sortent de la
		   fabrique, jamais un gabarit écrit à la main » — et la fabrique rend une
		   chaîne déjà composée : la règle ne sait pas la reconnaître. Passer par
		   `resolve()` ici reviendrait à recomposer le chemin à côté de la fabrique,
		   c'est-à-dire à faire exactement ce que le plan interdit. Même désarmement
		   qu'en `V-03`, `V-13`, `V-22` et `V-24`. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresseDeDomaine(canonique.univers, canonique.domaine));
	}}
	onScenario={(scenario: ScenarioDImport) => {
		/* La console est l'unique choix du scénario. Le parcours s'ouvre donc
		   directement au dépôt, avec le geste choisi dans son adresse. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${resolve('/importer')}?scenario=${encodeURIComponent(scenario)}`);
	}}
/>

<!--
	`journalImports` VIENT DE LA BASE, ET C'EST LA SECONDE MOITIÉ DE `RG-M12-09`.

	La vue retombait sur `JOURNAL_IMPORTS` du jeu de démonstration — quatre lots
	datés, avec leurs auteurs et leurs décomptes —, c'est-à-dire un journal
	d'imports qui n'ont jamais eu lieu : la valeur illustrative que `P-02`
	proscrit, sur un écran de traçabilité. La propriété est devenue EXIGÉE, servie
	VIDE faute de table, et l'écran DISAIT son vide plutôt que de le laisser passer
	pour « aucun import n'a eu lieu ».

	La table existe depuis la migration `009`, et le drapeau `journalEnregistre` a
	basculé tout seul : il est dérivé du recensement des mesures sans contrepartie,
	d'où les entrées `JOURNAL_IMPORTS` et `LOT_IMPORT` ont disparu. L'état vide
	explicite reste en place, et c'est voulu — une instance neuve n'a aucun lot, et
	il n'a plus alors à parler de conservation, seulement de l'absence de lots.
-->
