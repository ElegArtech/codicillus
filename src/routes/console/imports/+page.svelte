<script lang="ts">
	/**
	 * `/console/imports` — V-35 Console · Imports.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * `etat` N'EST PAS PASSÉ. La propriété nomme la zone que le banc découpe
	 * (protocole des états de zone) et ne change rien au rendu de trois des
	 * quatre états ; le banc n'atteint jamais cette route. Ne rien passer rend la
	 * page entière au repos, ce qui est l'état du produit.
	 *
	 * Les notes viennent de la base ; le journal des imports, non — aucune table
	 * ne le porte, voir le chargeur.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-35.svelte';
	import '../../../vues/V-35.css';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { adresseDeDomaine } from '$lib/rangement/adresses';
	import { cablerLeDepot } from '../cablage';
	import { deposerLotEnAttente } from '../../importer/lot-en-attente';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LA ZONE DE DÉPÔT ET « PARCOURIR » — ET LES OCTETS TRAVERSENT.
	 *
	 * Les quatre écouteurs du gel sont posés (`cablerLeDepot()`), `data-survol`
	 * répond au survol, le dépôt et le sélecteur de fichiers rendent un lot
	 * RÉEL — des `File`, pas un décompte —, et le parcours d'import s'ouvre AVEC
	 * ce lot. C'est mot pour mot ce que le gel annonce :
	 * « Lot reçu — parcours d'import à l'étape du choix de scénario, vue V-24 »
	 * (`mockups/V-35-console-imports.html:3000`). La destination est nommée par la
	 * maquette, donc l'adresse l'est aussi : `/importer`.
	 *
	 * CE QUI MANQUAIT N'ÉTAIT PAS ICI, ET LA RÉPARATION NON PLUS. Le parcours de
	 * V-24 ne retenait des fichiers qu'à son étape 2, une fois un scénario
	 * choisi ; le gel de V-35, lui, fait atterrir le lot à l'étape du CHOIX DE
	 * SCÉNARIO. C'est donc le PARCOURS qui a reçu de quoi tenir un lot avant ce
	 * choix — propriété `lotRecu` de `src/vues/V-24.svelte` —, et cet écran ne
	 * fait que le lui remettre. Le scénario reste choisi par l'utilisateur : le
	 * décider à sa place pour pouvoir lui rendre ses fichiers aurait été un
	 * comblement, pas un service.
	 *
	 * LE LOT NE PASSE PAS PAR LE RÉSEAU EN CHEMIN. `deposerLotEnAttente()` le
	 * confie à une variable de module que la navigation client traverse ; il
	 * n'est envoyé au serveur qu'à l'étape 2 du parcours, par l'action
	 * `analyser`, comme n'importe quel dépôt. Une analyse lancée d'ici aurait
	 * demandé un `domaine-cible` que cet écran ne propose nulle part.
	 *
	 * L'ARBORESCENCE D'UN DOSSIER DÉPOSÉ EST DESCENDUE, et c'est la MÊME descente
	 * qu'en V-24 : `cablerLeDepot()` passe par `$lib/cablage/depot-de-fichiers.ts`,
	 * que les deux écrans importent. Elle ne l'était pas ici, et le dépôt d'un
	 * dossier arrivait plat — toutes ses notes à la racine du domaine, et
	 * l'idempotence de l'import cassée avec, puisque son discriminant compte le
	 * chemin de dossier. Des fichiers déposés un à un arrivent, comme avant,
	 * entiers et à la racine du lot, ce qui est leur place.
	 */
	onMount(() =>
		cablerLeDepot(document, {
			surLot: (fichiers) => {
				deposerLotEnAttente(fichiers);
				void goto(resolve('/importer'));
			}
		})
	);
</script>

<!--
	NI RAIL, NI IDENTITÉ, NI VERSION : LA COQUILLE LES LIT AU CONTEXTE. Les
	quatre propriétés ne servaient qu'à traverser la vue jusqu'à
	`CoquilleDeConsole`, qui retombait sur `seeds/corpus.ts`.
-->
<Vue
	notes={data.notes}
	journalImports={[]}
	journalEnregistre={data.journalEnregistre}
	onOuvrirLeDomaine={(domaine) => {
		/* « OUVRIR LE DOMAINE » DU RAPPORT — la désignation est canonique, comme
		   partout ailleurs en console : le rapport porte un nom d'affichage,
		   l'adresse attend deux identifiants lisibles. La table vient du chargeur.

		   CE GESTE N'EST ATTEIGNABLE PAR PERSONNE AUJOURD'HUI : le journal est
		   vide — aucune table n'enregistre d'import —, donc aucun rapport ne
		   s'ouvre. Il est câblé pour le jour où un lot y entrera, pas maquillé. */
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
	onScenario={() => {
		/* LE GEL ANNONCE LA DESTINATION, PAS LE FILTRE. Il notifie « Parcours
		   d'import, scénario "X" — vue V-24 » : la vue cible est nommée, donc
		   l'adresse l'est aussi — `/importer`. Le SCÉNARIO, lui, n'a aucun
		   paramètre d'adresse déclaré (`docs/routes.md`), et en inventer un serait
		   combler. La navigation va donc à l'écran annoncé, sans son scénario.
		   Même arbitrage qu'en `/console/univers` pour le filtre par univers. */
		void goto(resolve('/importer'));
	}}
/>

<!--
	`journalImports={[]}` — ET C'EST UNE DÉCISION, PAS UN OUBLI.

	Aucune des vingt et une tables du schéma n'enregistre d'import : le service de
	conversion n'existe pas et rien n'écrit de lot (`MESURES_DE_CONSOLE_SANS_CONTREPARTIE`,
	entrée `JOURNAL_IMPORTS`). La vue retombait sur `JOURNAL_IMPORTS` du jeu de
	démonstration — quatre lots datés, avec leurs auteurs et leurs décomptes —,
	c'est-à-dire un journal d'imports qui n'ont jamais eu lieu : la valeur
	illustrative que `P-02` proscrit, sur un écran de traçabilité. La propriété
	est désormais EXIGÉE : ce `[]` n'est plus ce qui écarte le jeu, c'est la seule
	valeur que cette route puisse servir, et une route qui l'oublierait ne
	compilerait plus.

	ET IL ANNONCE DÉSORMAIS SON VIDE — `journalEnregistre`, dérivé du recensement
	par le chargeur. Le tableau ne se contente plus d'être vide : l'écran DIT que
	rien n'est conservé. Une table vide n'affirme rien de faux toute seule ; sous
	« les rapports restent consultables indéfiniment », elle affirmait qu'aucun
	import n'avait eu lieu. Le nœud ajouté n'est dans aucune planche du gel — le
	gel de V-35 ne porte aucun état vide pour ce tableau —, et c'est la seule
	façon de cesser de le contredire sans inventer un journal.
-->
