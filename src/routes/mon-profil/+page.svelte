<script lang="ts">
	/**
	 * `/mon-profil` — V-25, les quatre onglets, et les quatre gestes qui écrivent.
	 * L'onglet est dans l'adresse et le vecteur est composé par `vecteurDeV25()`, à un seul
	 * endroit. Aucune décision n'est prise ici : la garde de session est aux hooks, le
	 * verrou de `RG-M16-02` vient de la base, le périmètre de `resolution.ts`.
	 *
	 * POURQUOI LE CÂBLAGE EST ICI ET NON DANS LA VUE — `ARB-063` : le gel de V-25 ne porte
	 * NI `method`, NI `action`, NI un seul attribut de nom. AUCUN NŒUD N'EST AJOUTÉ NI
	 * DÉPLACÉ : les valeurs sont RELEVÉES sur les nœuds du gel, par leur identifiant, et
	 * envoyées dans un corps composé à la volée — envelopper les champs dans un formulaire
	 * soumissible après coup les déplacerait.
	 *
	 * QUATRE ACTIONS, TOUTES NOMMÉES : SvelteKit rend 500 si une action par défaut cohabite
	 * avec une action nommée. L'interrupteur de notification par courriel n'est PLUS ÉMIS
	 * par V-25 — aucune colonne ne le porterait. SANS JAVASCRIPT, CET ÉCRAN NE SOUMET PAS.
	 */
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Vue from '../../vues/V-25.svelte';
	import '../../vues/V-25.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * UN GESTE QUI ÉCRIT — soumis, puis relu depuis la base. `invalidateAll()` rejoue
	 * le chargeur : ce qui s'affiche après le geste vient de la base, jamais de ce
	 * qu'on croit avoir écrit.
	 */
	async function soumettre(action: string, champs: Record<string, string>): Promise<boolean> {
		const corps = new FormData();
		for (const [nom, valeur] of Object.entries(champs)) corps.append(nom, valeur);
		const reponse = await fetch(`?/${action}`, { method: 'POST', body: corps });
		const charge = (await reponse.json()) as { type?: string };
		await invalidateAll();
		return charge.type === 'success';
	}

	function valeur(id: string): string {
		return document.querySelector<HTMLInputElement>(`#${id}`)?.value ?? '';
	}

	/**
	 * LE MESSAGE — `div.notifs#notifs` et `.notif` sont du gel (`V-25`, pile de
	 * notifications de la coquille). Aucune classe n'est inventée ici.
	 */
	function notifier(texte: string): void {
		const pile = document.querySelector('#notifs');
		if (pile === null) return;
		const ligne = document.createElement('div');
		ligne.className = 'notif';
		ligne.textContent = texte;
		pile.appendChild(ligne);
		setTimeout(() => ligne.remove(), 4000);
	}

	onMount(() => {
		const jetables: (() => void)[] = [];
		const ecouter = (cible: EventTarget | null, type: string, geste: (e: Event) => void): void => {
			if (cible === null) return;
			cible.addEventListener(type, geste);
			jetables.push(() => cible.removeEventListener(type, geste));
		};

		/* ── Les onglets. `?onglet=` porte l'état ; le chargeur le relit. ───── */
		for (const bouton of Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'))) {
			ecouter(bouton, 'click', () => {
				const nom = bouton.dataset['onglet'];
				if (nom !== undefined) location.assign(`?onglet=${nom}`);
			});
		}

		/* ── Se déconnecter. `/deconnexion` est la seule écriture en GET. ───── */
		ecouter(document.querySelector('#deconnexion'), 'click', () => location.assign('/deconnexion'));

		/* ── Le nom affiché et l'adresse électronique. ──────────────────────── */
		ecouter(document.querySelector('#enregistrer-identite'), 'click', () => {
			void soumettre('enregistrerLIdentite', {
				'p-affiche': valeur('p-affiche'),
				'p-courriel': valeur('p-courriel')
			}).then((fait) =>
				notifier(
					fait
						? 'Vos informations ont été enregistrées'
						: "Ces informations n'ont pas pu être enregistrées"
				)
			);
		});

		/* ── « Rester connecté sur cet appareil ». La PRÉSENCE du champ vaut
		      vrai — même lecture qu'à `POST /connexion` (`ARB-054` §2). ─────── */
		const session = document.querySelector<HTMLInputElement>('#p-session');
		ecouter(session, 'change', () => {
			const retenu = session !== null && session.checked;
			void soumettre('preferenceDeSession', retenu ? { 'p-session': 'oui' } : {}).then((fait) =>
				notifier(
					!fait
						? "La préférence n'a pas pu être enregistrée"
						: retenu
							? 'Vous resterez connecté sur cet appareil'
							: 'La session se fermera après deux heures sans activité'
				)
			);
		});

		/* ── Fermer toutes les autres sessions. Le nombre rendu est celui qui a
		      été fermé, jamais un nombre annoncé (`P-02`). ──────────────────── */
		ecouter(document.querySelector('#fermer-sessions'), 'click', () => {
			void soumettre('fermerLesAutresSessions', {}).then((fait) =>
				notifier(
					fait
						? 'Vos autres sessions ont été fermées'
						: "Les autres sessions n'ont pas pu être fermées"
				)
			);
		});

		/* ── Le changement de mot de passe. Le bouton du gel est de type
		      `submit` dans un `form` sans action : la soumission est interceptée,
		      jamais laissée partir. ─────────────────────────────────────────── */
		ecouter(document.querySelector('#form-securite'), 'submit', (evenement) => {
			evenement.preventDefault();
			void soumettre('changerLeMotDePasse', {
				actuel: valeur('actuel'),
				nouveau: valeur('nouveau'),
				confirmation: valeur('confirmation')
			}).then((fait) => {
				if (fait) {
					for (const id of ['actuel', 'nouveau', 'confirmation']) {
						const champ = document.querySelector<HTMLInputElement>(`#${id}`);
						if (champ !== null) champ.value = '';
					}
					notifier('Mot de passe changé, vos autres sessions ont été fermées');
					return;
				}
				notifier("Le mot de passe n'a pas été changé");
			});
		});

		return () => {
			for (const defaire of jetables) defaire();
		};
	});
</script>

<!--
	`domaines` VIENT DU GABARIT RACINE, QUI LES LIT EN BASE : c'est le rail de la
	coquille, et il portait sinon les domaines du jeu de semence.

	`rangementDuProfil` EST L'ADRESSE DU BOUTON « VOIR LES NOTES DE … », ET ELLE
	EST LUE, JAMAIS DÉRIVÉE. `page.data.rangement` vient de `rangementDuCompte()`
	du gabarit racine, qui joint comptes → domaines → univers et rend les deux
	IDENTIFIANTS du domaine de rattachement du titulaire — exactement ce que
	l'adresse demande.

	POURQUOI LA LISTE DE DOMAINES NE SUFFISAIT PAS. Elle ne porte que des NOMS, et
	V-25 y retrouvait le domaine du titulaire par son nom d'affichage avant de
	composer l'adresse. Or `RG-M12-11` fige l'identifiant à la création et le
	laisse stable : après le seul renommage que la console permet, l'adresse
	composée du nouveau nom rend 404. Deux univers portant un même nom de domaine
	produisaient, eux, l'adresse de l'homonyme. Le rattachement lu ferme les deux.

	LA CIBLE DU BOUTON EST LA LISTE DES NOTES DU DOMAINE, ET ELLE DEMANDE UN
	MODULE. `[domaine]/notes/+page.server.ts` compose `domaineLisible` ET
	`moduleActif(modules, 'notes')` : le rattachement lisible ne suffit pas, et le
	bouton menait encore en 404 sur un domaine dont le module Notes est éteint
	(`RG-STR-06` — l'activation est un geste de console). Le gabarit racine rend ce
	second verdict avec le rangement ; sans lui, l'adresse n'est pas passée, et
	V-25 n'émet pas le bouton.
-->
<Vue
	domaines={page.data.domaines}
	rangementDuProfil={page.data.rangement?.notes === true ? page.data.rangement : null}
	vecteur={data.vecteur}
	notes={data.notes}
	profilDuCompte={data.profilDuCompte}
	preferenceDeSession={data.preferenceDeSession}
	contributions={data.contributions}
	relations={data.relations}
	activite={data.activite}
	compte={data.compte}
/>
