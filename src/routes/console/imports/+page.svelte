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
	import { cablerLeDepot } from '../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LA ZONE DE DÉPÔT ET « PARCOURIR » — CE QU'ELLES FONT, ET CE QU'ELLES NE
	 * PEUVENT PAS FAIRE.
	 *
	 * CE QU'ELLES FONT. Les quatre écouteurs du gel sont posés
	 * (`cablerLeDepot()`), `data-survol` répond au survol, le dépôt et le
	 * sélecteur de fichiers rendent un lot RÉEL — des `File`, pas un décompte —,
	 * et le parcours d'import s'ouvre. C'est mot pour mot ce que le gel annonce :
	 * « Lot reçu — parcours d'import à l'étape du choix de scénario, vue V-24 »
	 * (`mockups/V-35-console-imports.html:3000`). La destination est nommée par la
	 * maquette, donc l'adresse l'est aussi : `/importer`.
	 *
	 * CE QU'ELLES NE FONT PAS, ET IL FAUT LE DIRE PLUTÔT QUE DE LE MASQUER : LES
	 * OCTETS NE TRAVERSENT PAS. Le lot reçu ici ne peut pas être remis à V-24 en
	 * l'état actuel du parcours, et la raison est dans V-24, pas ici :
	 *
	 *   · sa zone de dépôt n'existe qu'à l'ÉTAPE 2, une fois un scénario choisi
	 *     (`V-24.svelte` : les écouteurs ne sont posés que si le parcours est
	 *     vivant) — or le gel de V-35 fait atterrir le lot à l'étape du CHOIX DE
	 *     SCÉNARIO, où le parcours n'a aucun état pour retenir des fichiers ;
	 *   · lui en donner un demanderait d'ouvrir `src/vues/V-24.svelte` et
	 *     `src/routes/importer/`, hors du périmètre de ce lot.
	 *
	 * L'utilisateur redépose donc son lot à l'étape 2. Choisir un scénario à sa
	 * place pour pouvoir lui remettre ses fichiers serait décider pour lui du
	 * traitement de son import : un comblement, pas un service.
	 *
	 * LE RAPPEL NE SE SERT DONC PAS DE SON ARGUMENT, ET C'EST VISIBLE EN TROIS
	 * LIGNES. C'est préférable à un envoi qui traverserait le réseau pour rien :
	 * une analyse lancée d'ici demanderait un `domaine-cible` que cet écran ne
	 * propose nulle part, donc un domaine choisi à la place de l'utilisateur.
	 */
	onMount(() =>
		cablerLeDepot(document, {
			surLot: () => {
				void goto(resolve('/importer'));
			}
		})
	);
</script>

<Vue
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	journalImports={[]}
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
	entrée `JOURNAL_IMPORTS`). Le défaut de la vue est `JOURNAL_IMPORTS` du jeu de
	semence — quatre lots datés, avec leurs auteurs et leurs décomptes. Servi ici,
	c'est un journal d'imports qui n'ont jamais eu lieu : la valeur illustrative
	que `P-02` proscrit, sur un écran de traçabilité.

	LE TABLEAU RESTE DONC VIDE, ET IL N'ANNONCE PAS SON VIDE : le gel de V-35 ne
	porte aucun état vide pour ce tableau — aucune planche n'en montre —, et en
	écrire un serait combler. Une table vide n'affirme rien de faux ; un journal
	fictif, si. Le vide de maquette est remonté au rapport du lot.
-->
