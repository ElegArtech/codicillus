<script lang="ts">
	/**
	 * `/notes/{identifiant}/comparaison` — V-16 Comparaison de deux versions.
	 *
	 * LA VUE NE CHANGE PAS DE FORME : elle reçoit ses propriétés, et toutes
	 * viennent désormais de la BASE — `notes` est le corpus lisible par
	 * l'appelant, `note` est la note comparée, `versions` sont les lignes de la
	 * table des versions, `comparaison` porte les deux alignements calculés par
	 * `$lib/donnees/histoire.ts` sur les documents canoniques.
	 *
	 * `contenuVersions` EST PASSÉ VIDE, ET IL DOIT L'ÊTRE : la propriété porte le
	 * contenu d'exemple des maquettes, et l'omettre le servirait au produit —
	 * exactement la « valeur illustrative » que P-02 proscrit.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3) et n'est pas
	 * modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les titres des maquettes sont ceux des planches de revue, et en inventer un
	 * serait un comblement.
	 */
	import { onMount } from 'svelte';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import Vue from '../../../../vues/V-16.svelte';
	import '../../../../vues/V-16.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE CÂBLAGE DES DEUX GESTES DE L'ÉCRAN — `ARB-063` : il vit dans la route,
	 * jamais dans la vue. Rien n'est ajouté au document : les nœuds visés sont
	 * ceux du gel, atteints par leurs identifiants et leurs rôles.
	 *
	 *  1. LA BASCULE TEXTE / VISUEL. Les deux modes sont CALCULÉS et RENDUS tous
	 *     les deux ; la feuille de la vue n'en montre qu'un, selon `data-mode` sur
	 *     `div.app` (`V-16.css:487-488`). Sans cet écouteur, l'onglet « Visuel »
	 *     serait une commande visible qui ne commande rien — `P-03`. La valeur de
	 *     départ est celle du gel, « texte », et elle n'est pas dans l'adresse :
	 *     aucune source ne l'y met.
	 *  2. LES DEUX RETOURS. `docs/routes.md` §3.8 range V-15 en SUPERPOSITION de
	 *     `/notes/{identifiant}` : l'historique n'a pas de chemin propre, et
	 *     « retour à l'historique » comme « retour à la note » désignent donc la
	 *     MÊME adresse. Ce n'est pas un raccourci, c'est ce que la table dit.
	 *
	 * `aria-selected` suit l'onglet actif : le rôle `tab` le demande, et le gel le
	 * pose déjà sur les deux boutons.
	 */
	onMount(() => {
		const app = document.getElementById('app');
		const onglets = Array.from(
			document.querySelectorAll<HTMLButtonElement>('.modes [role="tab"][data-mode]')
		);
		const retours = Array.from(
			document.querySelectorAll<HTMLButtonElement>(
				'#retour-historique, #retour-note, .etat-compare .btn'
			)
		);

		const defaire: (() => void)[] = [];
		for (const onglet of onglets) {
			const mode = onglet.dataset['mode'];
			if (mode === undefined) continue;
			const geste = () => {
				app?.setAttribute('data-mode', mode);
				for (const autre of onglets) {
					autre.setAttribute('aria-selected', String(autre.dataset['mode'] === mode));
				}
			};
			onglet.addEventListener('click', geste);
			defaire.push(() => {
				onglet.removeEventListener('click', geste);
			});
		}
		for (const bouton of retours) {
			/* NAVIGATION PAR LE NAVIGATEUR, non par le routeur : l'adresse vient de
			   `adresseDeNote()`, seule forme publiée (`ARB-001`), et la passer au
			   routeur demanderait de la retaper en identifiant de route — deux
			   écritures d'une même adresse. */
			const geste = () => {
				window.location.assign(adresseDeNote(data.note.id));
			};
			bouton.addEventListener('click', geste);
			defaire.push(() => {
				bouton.removeEventListener('click', geste);
			});
		}
		return () => {
			for (const f of defaire) f();
		};
	});
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	note={data.note}
	versions={data.versions}
	contenuVersions={data.contenuVersions}
	comparaison={data.comparaison}
/>
