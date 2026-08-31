<script lang="ts">
	/**
	 * `/connexion` — V-05 Connexion.
	 *
	 * CE FICHIER NE CÂBLE PLUS LE FORMULAIRE, ET C'EST DÉLIBÉRÉ : la méthode et les trois
	 * noms de champ étaient posés depuis `onMount`, la parade n'existait donc pas avant le
	 * montage, et une soumission dans cette fenêtre partait en `GET` avec le mot de passe
	 * dans l'adresse. Les quatre attributs sont dans le balisage de la vue, et la connexion
	 * fonctionne sans JavaScript. `?motif=` EST LU PAR LE CHARGEUR — les trois positions de
	 * l'axe « Arrivée » de la planche viennent de la source.
	 *
	 * L'ADRESSE DU MODE DÉMO N'EST PAS CITÉE ICI, ET C'EST UN PIÈGE MESURÉ : cette route est
	 * BÂTIE, et le contrôle de non-fuite du mode démo cherche sa chaîne en texte brut dans
	 * le produit construit — COMMENTAIRES COMPRIS.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../vues/V-05.svelte';
	import '../../vues/V-05.css';
	import { cablerLaConnexion } from './cablage';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/**
	 * LE CÂBLAGE S'ACCROCHE DEPUIS LA ROUTE — `ARB-063`. La racine est cherchée dans
	 * le document plutôt que liée par `bind:this` : la lier demanderait un nœud
	 * d'enveloppe que le gel ne porte pas.
	 */
	onMount(() => {
		const racine = document.getElementById('app');
		return racine === null ? undefined : cablerLaConnexion(racine);
	});

	/**
	 * CE QUE LE SERVEUR A REFUSÉ, DIT À L'ÉCRAN — et il ne l'était pas. L'action
	 * rendait `fail(401, …)` ou `fail(429, …)`, la page se réaffichait à l'identique,
	 * les champs vidés, et rien ne le disait.
	 *
	 * Les deux messages sont ceux du gel, à la lettre. Le décompte de la seconde est
	 * du COMPORTEMENT (`ARB-011`) ; la durée annoncée est celle que le serveur a
	 * décidée, et elle est vraie sans script.
	 *
	 * `RG-ACC-04` tient : un seul message quelle que soit la cause du refus.
	 */
	const refus = $derived.by(() => {
		if (form?.issue === 'trop') {
			/* `ActionData` unifie les deux formes de refus, et `secondes` n'existe
			   que sur l'une : la lecture est gardée plutôt que forcée. */
			const s = 'secondes' in form && typeof form.secondes === 'number' ? form.secondes : 0;
			const minutes = Math.floor(s / 60);
			const reste = s % 60;
			const duree =
				minutes > 0 ? `${minutes} min ${String(reste).padStart(2, '0')} s` : `${reste} s`;
			return {
				variante: 'attente',
				marque: '⏱',
				titre: 'Trop de tentatives',
				txt: `Nouvelle tentative possible dans ${duree}.`
			};
		}
		if (form?.issue === 'echec') {
			return {
				variante: 'erreur',
				marque: '!',
				titre: 'Identifiant ou mot de passe incorrect',
				txt: 'Vérifiez votre saisie, puis réessayez.'
			};
		}
		return null;
	});
</script>

<Vue vecteur={{ arrivee: data.arrivee }} {refus} />
