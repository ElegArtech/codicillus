<script lang="ts">
	/**
	 * `/cartographie` — V-19 Cartographie.
	 *
	 * LOT T-070, « la liaison ». Cette route existe parce qu'une entrée de
	 * navigation la nomme : le gel déclare sa destination en `data-vers`
	 * (« Cartographie — vue V-19 », rail de la coquille), et `docs/routes.md` §3 — qui fait foi sur les chemins — la
	 * résout en `/cartographie` → V-19.
	 *
	 * ELLE NE FAIT QUE RENDRE LA VUE, et c'est le périmètre exact du lot : pas
	 * de chargeur, pas de garde de droit, pas d'authentification, aucune lecture
	 * des paramètres d'adresse. L'étanchéité (batterie 6) et la résolution des
	 * droits appartiennent à T-011 et T-012 ; les anticiper ici serait un
	 * débordement (`docs/dag-phase-1.md` §6).
	 *
	 * `vecteur={null}` demande l'état par défaut de la vue. LE BANC NE PASSE
	 * JAMAIS PAR ICI : il atteint la vue par le mode démo
	 * (la route de conception du banc), qui rend le composant directement. Rien de ce
	 * fichier n'entre dans son verdict.
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
	import Vue from '../../vues/V-19.svelte';
	import '../../vues/V-19.css';
	import { corpusPourVue } from '../../../seeds/corpus';
</script>

<Vue vecteur={null} notes={corpusPourVue('V-19')} />
