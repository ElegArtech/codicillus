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
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import Vue from '../../../../../vues/V-22.svelte';
	import '../../../../../vues/V-22.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { soumettreVers } from '$lib/cablage/formulaires';
	import { cablerLesFacettes } from '$lib/cablage/facettes';
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

	/**
	 * LES DEUX FACETTES DU GEL, DANS SON ORDRE. Le menu rendu porte lui-même
	 * l'identifiant de sa facette, et c'est par lui que le câblage la retrouve :
	 * le libellé ne peut pas servir — le bouton porte le nom SUIVI de son
	 * compteur —, et le rang mentait dès qu'une facette sans valeur n'était pas
	 * rendue, ce qui arrive au premier signet sans étiquette.
	 *
	 * La liste est déclarée une fois et servie au câblage commun, celui-là même
	 * qui porte les menus de la liste des notes et de la recherche. Recopier le
	 * moteur ici l'aurait fait diverger au premier oubli.
	 */
	const FACETTES = [
		{ id: 'etiquette', nom: 'Étiquette', prefixe: '#' },
		{ id: 'auteur', nom: 'Auteur' }
	] as const;

	onMount(() => {
		for (const bouton of Array.from(formulaire.querySelectorAll('button'))) {
			if (!bouton.hasAttribute('type')) bouton.type = 'button';
		}
		/* LES MENUS DE FACETTE, LES PASTILLES ET « TOUT EFFACER » — le module
		   commun, celui de la liste des notes et de la recherche. Ce fichier ne
		   portait que l'OUVERTURE d'un menu, faute d'un chargeur qui lise les
		   paramètres ; il en lit deux désormais, et cocher une valeur réécrit
		   l'adresse. */
		const defaireLesFacettes = cablerLesFacettes(formulaire, { facettes: FACETTES });
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

			/* 3. RÉINITIALISER LES FILTRES — la sortie de l'état « aucun signet ne
			   correspond à ces filtres ». La même adresse, ses deux facettes
			   retirées. Le gel ne donne pas d'identifiant à ce bouton : il se
			   reconnaît à son libellé, dans le bloc qui n'accueille que lui.
			   Les menus eux-mêmes, les pastilles et « Tout effacer » sont portés
			   par le câblage commun des facettes, monté plus haut. */
			if ((amorce?.textContent ?? '').trim() === 'Réinitialiser les filtres') {
				const adresse = new URL(location.href);
				for (const f of FACETTES) adresse.searchParams.delete(f.id);
				evenement.preventDefault();
				location.assign(adresse.toString());
				return;
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
		return () => {
			formulaire.removeEventListener('click', auClic);
			defaireLesFacettes();
		};
	});
</script>

<form method="POST" bind:this={formulaire} style="display:contents">
	<input type="hidden" name="signet" bind:this={champSignet} />
	<!-- `exactOptionalPropertyTypes` : une propriété OPTIONNELLE n'accepte pas
	     `undefined` comme valeur — elle accepte d'être ABSENTE. Les deux ne se
	     confondent pas, et c'est la garantie qui fait que la vue rend, sans
	     paramètre, exactement ce qu'elle rendait. -->
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		domaines={data.domaines}
		{...data.retenues === undefined ? {} : { retenues: data.retenues }}
		{...data.tri === undefined ? {} : { tri: data.tri }}
		onModifier={(identifiant) =>
			goto(
				resolve('/univers/[univers]/[domaine]/signets/[identifiant]/modifier', {
					univers: page.params.univers ?? '',
					domaine: page.params.domaine ?? '',
					identifiant
				})
			)}
	/>
</form>
