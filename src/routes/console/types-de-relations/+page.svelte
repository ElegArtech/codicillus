<script lang="ts">
	/**
	 * `/console/types-de-relations` — V-30 Console · Types de relations. Le rôle
	 * administrateur est éprouvé côté serveur par `+page.server.ts`.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. LE BANC NE PASSE
	 * JAMAIS PAR ICI : il atteint la vue par le mode de conception.
	 */
	import Vue from '../../../vues/V-30.svelte';
	import '../../../vues/V-30.css';
	import { envoyerAUneAction } from '../cablage';
	import {
		CHAMP_TYPE_DE_RELATION_CIBLE,
		champsDeTypeDeRelation,
		type RefusDeSaisie,
		type SaisieDeTypeDeRelation
	} from '$lib/console/structure';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE REFUS RENDU PAR L'ACTION, REMIS À LA VUE — voir `/console/univers`, qui
	 * porte le motif au long. `V-30` en attend DEUX possibles, `direct` et
	 * `inverse` ; l'action n'en rend jamais qu'un à la fois, dans l'ordre du gel.
	 */
	let refus = $state<RefusDeSaisie | null>(null);

	function premierRefus(donnees: unknown): RefusDeSaisie | null {
		if (typeof donnees !== 'object' || donnees === null) return null;
		const erreurs = (donnees as { erreurs?: unknown }).erreurs;
		if (!Array.isArray(erreurs)) return null;
		const [premiere] = erreurs as RefusDeSaisie[];
		return premiere ?? null;
	}

	async function envoyer(action: string, champs: Record<string, string>): Promise<void> {
		refus = null;
		const retour = await envoyerAUneAction(document, action, champs);
		if (!retour.succes) refus = premierRefus(retour.donnees);
	}
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU — voir
	`/console/domaines` pour le motif.

	AUCUNE TABLE DE TRADUCTION ICI, et c'est une propriété du corpus : les clés de
	`TYPES_RELATION` SONT les identifiants lisibles de `types_de_relation`, et
	`lireTypesDeRelation()` les rend telles quelles.

	LES DEUX SORTIES SONT CELLES DU GEL — « Réaffecter à un autre type » et
	« Supprimer aussi ces N relations ». Ce qu'elles écrivent est dans
	`supprimerUnTypeDeRelation()`, avec le cas d'unicité qu'une réaffectation peut
	rencontrer.
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
	{refus}
	onCreer={(saisie: SaisieDeTypeDeRelation) => {
		void envoyer('?/creer', champsDeTypeDeRelation(saisie));
	}}
	onEnregistrer={(cle: string, saisie: SaisieDeTypeDeRelation) => {
		/* AUCUNE TABLE DE TRADUCTION : la clé de `TYPES_RELATION` EST
		   l'identifiant lisible de `types_de_relation`, ce que le chargeur rend
		   tel quel. Le commentaire de la suppression le dit déjà. */
		void envoyer('?/enregistrer', {
			[CHAMP_TYPE_DE_RELATION_CIBLE]: cle,
			...champsDeTypeDeRelation(saisie)
		});
	}}
/>
