<script lang="ts">
	/**
	 * `/notes/{identifiant}/operationnel` — V-18 Éditeur du registre Opérationnel.
	 *
	 * La vue ne change pas, et c'est la seule des trois routes d'éditeur dont la
	 * vue accepte réellement son contenu : `affichee` porte la note lue et ses
	 * deux corps rendus par l'implémentation unique de `rendreDocument`
	 * (`ADR-004`). La transcription gelée de `n-restaurer-pg` n'est plus servie
	 * qu'en l'absence de note — c'est-à-dire jamais, à cette adresse.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict.
	 *
	 * `data.corps` porte le DOCUMENT canonique du registre édité — la matière de
	 * l'éditeur, distincte du HTML rendu que porte `affichee`. Aucun nœud de la
	 * vue ne le reçoit : la zone de rédaction affiche le corps RENDU, l'édition
	 * étant un comportement (ARB-011) que le gel place hors de la vue. Écart
	 * déclaré au rapport.
	 */
	import Vue from '../../../../vues/V-18.svelte';
	import '../../../../vues/V-18.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} affichee={data.affichee} />
