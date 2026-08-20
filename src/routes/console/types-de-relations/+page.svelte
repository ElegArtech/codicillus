<script lang="ts">
	/**
	 * `/console/types-de-relations` — V-30 Console · Types de relations.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. Les notes
	 * viennent de la base. LE BANC NE PASSE JAMAIS PAR ICI : il atteint la vue
	 * par le mode de conception, qui rend le composant directement.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-30.svelte';
	import '../../../vues/V-30.css';
	import { envoyerAUneAction } from '../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU — voir
	`/console/domaines` pour le motif.

	AUCUNE TABLE DE TRADUCTION ICI, et c'est une propriété du corpus : les clés
	de `TYPES_RELATION` SONT les identifiants lisibles de `types_de_relation`
	(`heberge`, `depend`, `documente`…), et `lireTypesDeRelation()` les rend telles
	quelles. La vue les porte déjà ; rien n'est à retrouver en base.

	LES DEUX SORTIES SONT CELLES DU GEL — « Réaffecter à un autre type » et
	« Supprimer aussi ces N relations » (`V-30:536`, `:549`). Ce qu'elles écrivent
	est dans `supprimerUnTypeDeRelation()`, avec le cas d'unicité qu'une
	réaffectation peut rencontrer.
-->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	typesRelation={data.typesRelation}
	relations={data.relations}
	relationsTechniques={data.relationsTechniques}
	onSupprimer={(demande) => {
		void envoyerAUneAction(document, '?/supprimer', {
			'type-de-relation': demande.type,
			sortie: demande.sortie,
			vers: demande.vers
		});
	}}
/>
