<script lang="ts">
	/**
	 * `/notes/{identifiant}/comparaison` — V-16 Comparaison de deux versions.
	 *
	 * Toutes les propriétés viennent de la BASE : `notes` est le corpus lisible,
	 * `note` la note comparée, `versions` les lignes de la table, `comparaison` les
	 * deux alignements calculés sur les documents canoniques.
	 *
	 * `contenuVersions` EST PASSÉ VIDE, ET IL DOIT L'ÊTRE : la propriété porte le
	 * contenu d'exemple des maquettes, et l'omettre le servirait au produit (`P-02`).
	 *
	 * AUCUN `<svelte:head>` : les titres des maquettes sont ceux des planches de
	 * revue, et en inventer un serait un comblement.
	 */
	import { onMount } from 'svelte';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import Vue from '../../../../vues/V-16.svelte';
	import '../../../../vues/V-16.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * « TOUT AFFICHER » — le levier `c-tout` du vecteur de V-16, tenu par la route
	 * parce que la vue ne porte aucun état propre.
	 *
	 * Il ne va PAS dans l'adresse : §4.3 ne connaît de cette page que le couple
	 * `versions`, et le repli du journal est une commodité de lecture, pas un état
	 * partageable. Une fois levé il ne se rabaisse pas — le gel ne dessine aucun
	 * bouton pour replier de nouveau.
	 */
	let toutAffiche = $state(false);
	const vecteur = $derived({ ...(data.vecteur ?? {}), 'c-tout': toutAffiche });

	/**
	 * LE CÂBLAGE DES DEUX GESTES DE L'ÉCRAN — `ARB-063` : il vit dans la route, jamais
	 * dans la vue, et rien n'est ajouté au document.
	 *
	 *  1. LA BASCULE TEXTE / VISUEL. Les deux modes sont CALCULÉS et RENDUS tous les
	 *     deux ; la feuille n'en montre qu'un, selon `data-mode` sur `div.app`. Sans cet
	 *     écouteur, l'onglet « Visuel » serait une commande qui ne commande rien
	 *     (`P-03`). La valeur de départ est celle du gel, et n'est pas dans l'adresse.
	 *  2. LES DEUX RETOURS, ET ILS NE SONT PLUS CONFONDUS : V-15 est une SUPERPOSITION
	 *     de `/notes/{identifiant}`, sans chemin propre mais avec un ÉTAT ADRESSABLE,
	 *     `?version`. Les envoyer tous deux à l'adresse nue fermait le panneau que le
	 *     premier promet de rouvrir.
	 *  3. LE DÉPLIAGE DU JOURNAL, inerte au gel : la seule façon de LIRE le contexte
	 *     d'un écart est de le déplier. La vue lit ce repli du levier `c-tout` de son
	 *     vecteur, que la route lui passe.
	 *
	 * `aria-selected` suit l'onglet actif : le rôle `tab` le demande.
	 */
	onMount(() => {
		const app = document.getElementById('app');
		const onglets = Array.from(
			document.querySelectorAll<HTMLButtonElement>('.modes [role="tab"][data-mode]')
		);
		/* L'historique est l'état `?version` de la note ; la note nue est l'adresse
		   sans lui. Le bouton de l'état « rien à comparer » dit « Retour à
		   l'historique » : il va donc où son libellé promet. */
		const note = adresseDeNote(data.note.id);
		const cibles: readonly (readonly [string, string])[] = [
			['#retour-historique', `${note}?version`],
			['#retour-note', note],
			['.etat-compare .btn', `${note}?version`]
		];

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
		for (const [selecteur, cible] of cibles) {
			/* NAVIGATION PAR LE NAVIGATEUR, non par le routeur : l'adresse vient de
			   `adresseDeNote()`, seule forme publiée (`ARB-001`), et la passer au
			   routeur demanderait de la retaper en identifiant de route — deux
			   écritures d'une même adresse. */
			const bouton = document.querySelector<HTMLButtonElement>(selecteur);
			if (bouton === null) continue;
			const geste = () => {
				window.location.assign(cible);
			};
			bouton.addEventListener('click', geste);
			defaire.push(() => {
				bouton.removeEventListener('click', geste);
			});
		}

		/* LE DÉPLIAGE EST DÉLÉGUÉ : les boutons de repli sont recomposés à chaque
		   changement de mode ou de couple, et les recenser au montage manquerait
		   ceux qui naissent ensuite. */
		const deplier = (evenement: Event): void => {
			const cible = evenement.target;
			if (!(cible instanceof Element)) return;
			if (cible.closest('.repli-journal') === null) return;
			toutAffiche = true;
		};
		document.addEventListener('click', deplier);
		defaire.push(() => {
			document.removeEventListener('click', deplier);
		});
		return () => {
			for (const f of defaire) f();
		};
	});
</script>

<Vue
	{vecteur}
	notes={data.notes}
	note={data.note}
	versions={data.versions}
	contenuVersions={data.contenuVersions}
	comparaison={data.comparaison}
/>
