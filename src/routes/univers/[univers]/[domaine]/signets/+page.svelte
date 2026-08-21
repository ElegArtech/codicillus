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
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { soumettreVers } from '$lib/cablage/formulaires';
	import {
		adresseDeCreationDeSignet,
		adresseDeModificationDeSignet
	} from '$lib/rangement/adresses';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let formulaire: HTMLFormElement;
	let champSignet: HTMLInputElement;

	/**
	 * LES DEUX BOUTONS DE CHAQUE CARTE — « Modifier » et « Supprimer » — ne
	 * faisaient rien.
	 *
	 * Le gel ne pose sur la carte ni identifiant ni adresse d'action, et lui en
	 * ajouter un serait toucher `src/vues/`. La carte porte en revanche le TITRE
	 * et l'ADRESSE curatée : le couple des deux désigne le signet sans ambiguïté
	 * dans un domaine, et le chargeur sert la table de correspondance.
	 *
	 * `P-09` est servie par la vue : les deux boutons ne sont rendus qu'en
	 * écriture.
	 */
	/**
	 * LES DEUX SEGMENTS DE L'ADRESSE, TELS QUE LA ROUTE LES A REÇUS.
	 *
	 * Ce sont déjà des identifiants lisibles ; `identifiantLisible()` est
	 * idempotente sur eux, et les passer à la fabrique d'adresses coûte donc
	 * exactement rien — tandis qu'écrire le gabarit à la main, ce que ce fichier
	 * faisait, crée une seconde source de vérité pour une forme qui n'en a
	 * qu'une (`$lib/rangement/adresses`, en-tête).
	 */
	const segments = $derived({
		univers: String(page.params['univers'] ?? ''),
		domaine: String(page.params['domaine'] ?? '')
	});

	onMount(() => {
		for (const bouton of Array.from(formulaire.querySelectorAll('button'))) {
			if (!bouton.hasAttribute('type')) bouton.type = 'button';
		}
		const identifiantDeLaCarte = (carte: Element): string | null => {
			const titre = (carte.querySelector('.sig__titre')?.textContent ?? '').trim();
			const url = carte.querySelector('.sig__titre')?.getAttribute('href') ?? '';
			const trouve =
				data.signets.find((s) => s.titre === titre && s.url === url) ??
				data.signets.find((s) => s.titre === titre);
			return trouve?.identifiant ?? null;
		};
		const auClic = (evenement: Event): void => {
			const vise = evenement.target as Element | null;
			if (vise === null) return;

			/* 1. NOUVEAU SIGNET — l'action de la barre de titre, et sa jumelle de
			   l'état vide. Le gel ne donne pas d'identifiant à la seconde : elle se
			   reconnaît à son libellé, dans le bloc qui n'accueille qu'elle. */
			const amorce = vise.closest('.vide-signets .btn');
			if (
				vise.closest('#nouveau') !== null ||
				(amorce?.textContent ?? '').trim() === 'Ajouter le premier signet'
			) {
				evenement.preventDefault();
				location.assign(adresseDeCreationDeSignet(segments.univers, segments.domaine));
				return;
			}

			/* 2. LE RAPPEL DE SORTIE — « Ne plus afficher ce rappel ». Le gel pose
			   déjà l'attribut sur le bandeau (`V-22:353`) ; le fermer, c'est le
			   poser. Aucun style n'est écrit. */
			if (vise.closest('#fermer-rappel') !== null) {
				formulaire.querySelector('#sortie-rappel')?.setAttribute('hidden', '');
				evenement.preventDefault();
				return;
			}

			/* 3. UN MENU DE FACETTE — OUVERTURE SEULE, et c'est un fait mesuré, non
			   une paresse : V-22 n'a AUCUNE propriété de valeurs retenues (voir
			   `src/vues/V-22.svelte`, « aucun état de V-22 ne retient de valeur »),
			   et son chargeur ne lit aucun paramètre de facette. Cocher une valeur
			   ne pourrait donc rien filtrer ; poser le paramètre dans l'adresse
			   ferait recharger la page sans le moindre effet, ce qui est pire qu'un
			   menu qui s'ouvre. L'ouverture est l'attribut du gel
			   (`.fac-menu[data-ouvert="oui"]`), et rien d'autre. */
			const menuBouton = vise.closest('.fac-menu__bouton');
			if (menuBouton !== null) {
				const menu = menuBouton.closest('.fac-menu');
				const ouvert = menu?.getAttribute('data-ouvert') === 'oui';
				for (const autre of Array.from(formulaire.querySelectorAll('.fac-menu'))) {
					autre.removeAttribute('data-ouvert');
					autre.querySelector('.fac-menu__bouton')?.setAttribute('aria-expanded', 'false');
				}
				if (!ouvert && menu !== null && menu !== undefined) {
					menu.setAttribute('data-ouvert', 'oui');
					menuBouton.setAttribute('aria-expanded', 'true');
				}
				evenement.preventDefault();
				return;
			}
			if (vise.closest('.fac-menu') === null) {
				for (const menu of Array.from(formulaire.querySelectorAll('.fac-menu[data-ouvert]'))) {
					menu.removeAttribute('data-ouvert');
					menu.querySelector('.fac-menu__bouton')?.setAttribute('aria-expanded', 'false');
				}
			}

			/* 4. LES DEUX BOUTONS D'UNE CARTE — modifier, supprimer. */
			const bouton = vise.closest('.sig__actions button');
			if (bouton === null || bouton === undefined) return;
			const carte = bouton.closest('.sig');
			if (carte === null) return;
			const identifiant = identifiantDeLaCarte(carte);
			if (identifiant === null) return;
			evenement.preventDefault();
			const titre = (carte.querySelector('.sig__titre')?.textContent ?? '').trim();
			if ((bouton.textContent ?? '').trim() === 'Modifier') {
				location.assign(
					adresseDeModificationDeSignet(segments.univers, segments.domaine, identifiant)
				);
				return;
			}
			/* `RG-M18-05` — l'action irréversible rappelle ce qui sera détruit. */
			if (!confirm(`Supprimer le signet « ${titre} » ?\n\nLa suppression est définitive.`)) return;
			champSignet.value = identifiant;
			soumettreVers(formulaire, '?/supprimer');
		};
		formulaire.addEventListener('click', auClic);
		return () => formulaire.removeEventListener('click', auClic);
	});
</script>

<form method="POST" bind:this={formulaire} style="display:contents">
	<input type="hidden" name="signet" bind:this={champSignet} />
	<Vue vecteur={data.vecteur} notes={data.notes} />
</form>
