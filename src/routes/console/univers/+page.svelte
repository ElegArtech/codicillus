<script lang="ts">
	/**
	 * `/console/univers` — V-27 Console · Univers.
	 *
	 * Montée par `T-070` (« la liaison »), qui s'interdisait explicitement le
	 * chargeur et la garde de droit — c'était son périmètre, et c'était écrit.
	 * `ECART-047` É-1 en a mesuré la conséquence : l'adresse servait 30 315
	 * octets à n'importe quel connecté. `T-036` pose la garde et le chargeur :
	 * `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT PLUS QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. Les notes,
	 * les univers, les domaines et l'utilisateur courant viennent de la base ;
	 * `seeds/corpus.ts` n'est plus lu ici. Il reste la référence du mode de
	 * conception, qui atteint la vue par son propre chemin et ne passe pas par
	 * cette route : rien de ce fichier n'entre dans le verdict du banc.
	 *
	 * `compte` EST TOUJOURS PRÉSENT : `resoudreLaConsole()` refuse une session
	 * dont la ligne de compte a disparu, plutôt que de rendre un administrateur
	 * sans nom (voir `AccesALaConsole.compte`). Aucune branche de repli ici : une
	 * branche que rien n'exerce est une branche dont on ignore si elle marche.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : `+layout.svelte` ne porte que le socle. Elle est identique à
	 * l'octet à sa source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les `<title>` des maquettes sont ceux des planches de revue, et en
	 * inventer un serait un comblement.
	 */
	import Vue from '../../../vues/V-27.svelte';
	import '../../../vues/V-27.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
/>
