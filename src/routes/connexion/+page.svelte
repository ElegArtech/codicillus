<script lang="ts">
	/**
	 * `/connexion` — V-05 Connexion.
	 *
	 * LOT T-070, « la liaison », a posé cette route parce qu'une entrée de
	 * navigation la nomme : le gel déclare sa destination en `data-vers`
	 * (« connexion », les quatre liens de retour de V-06), et `docs/routes.md` §3 — qui fait foi sur les chemins — la
	 * résout en `/connexion` → V-05.
	 *
	 * LOT T-012 y a ajouté le CHARGEUR ET L'ACTION — `+page.server.ts`, qui porte
	 * l'authentification, le barème de ralentissement et l'ouverture de session.
	 * Ce fichier POSE EN OUTRE, depuis `ARB-063`, la méthode et les trois noms de
	 * champ que le gel n'écrit pas — `$lib/cablage/formulaires.ts`, qui dit
	 * pourquoi ce geste vit dans une route et nulle part ailleurs. Il LIT aussi
	 * `?motif=` par son chargeur, comme
	 * `docs/routes.md:286` le prescrit — `page-protegee` / `session-expiree` /
	 * (absent) → `protegee` / `expiree` / `directe`, les trois positions de l'axe
	 * « Arrivée » de la planche V-05. La correspondance vient de la source ; elle
	 * n'est pas inventée ici.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il atteint la vue par la route de
	 * conception du mode démo, qui rend le composant directement. Rien de ce
	 * fichier n'entre dans son verdict, et le vecteur qu'il passe n'est pas
	 * celui-ci.
	 *
	 * SON ADRESSE N'EST PAS CITÉE ICI, ET C'EST UN PIÈGE MESURÉ. Depuis T-070,
	 * cette route est BÂTIE, et `verif:demo:hors-production` cherche la chaîne du
	 * mode démo en texte brut dans le produit construit — COMMENTAIRES COMPRIS.
	 * Écrire l'adresse dans ce fichier a fait rougir la batterie sur trois
	 * fichiers produits (T-012). Le fait n'était pas hypothétique : l'en-tête de
	 * `src/vues/V-05.svelte` le déclarait déjà (écart É-2 de T-070), et les autres
	 * routes bâties y échappent seulement parce que leur commentaire ne précède
	 * aucune instruction conservée — un `$props()` de plus, et la trace revient.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : le mode démo pose lui-même son `<link>`, `+layout.svelte` ne porte
	 * que le socle. Elle est identique à l'octet à sa source gelée (P-6.3) et
	 * n'est pas modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les `<title>` des maquettes sont ceux des planches de revue — celui de
	 * V-07 porte même son numéro de vue —, et en inventer un serait un
	 * comblement.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../vues/V-05.svelte';
	import '../../vues/V-05.css';
	import { cablerLaConnexion } from '$lib/cablage/formulaires';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	onMount(() => cablerLaConnexion(enveloppe));
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue vecteur={{ arrivee: data.arrivee }} />
</div>
