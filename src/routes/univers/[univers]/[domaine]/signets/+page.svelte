<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/signets` — V-22 Signets.
	 *
	 * Montée par `T-070` (« la liaison »), qui s'interdisait explicitement le
	 * chargeur et la garde de droit : « pas de chargeur, pas de garde de droit,
	 * pas d'authentification, aucune lecture des paramètres d'adresse ». C'était
	 * son périmètre, et c'était écrit. `ECART-047` É-1 en a mesuré la
	 * conséquence — l'adresse servait 18 528 octets à un anonyme —, et `T-034`
	 * pose le chargeur : `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT PLUS QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. Les notes
	 * viennent de la base, filtrées par le périmètre de l'appelant dans la
	 * requête elle-même (`ADR-006`) ; le vecteur porte le domaine réel et le
	 * droit effectif — `droits: 'lecture'` efface les actions d'écriture, ce que
	 * `P-09` exige et que le serveur seul peut décider.
	 *
	 * `seeds/corpus.ts` n'est plus lu ici. Il reste la référence du mode de
	 * conception, qui atteint la vue par son propre chemin et ne passe pas par
	 * cette route : rien de ce fichier n'entre dans le verdict du banc.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : `+layout.svelte` ne porte que le socle. Elle est identique à
	 * l'octet à sa source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les `<title>` des maquettes sont ceux des planches de revue, et en
	 * inventer un serait un comblement.
	 */
	import Vue from '../../../../../vues/V-22.svelte';
	import '../../../../../vues/V-22.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
