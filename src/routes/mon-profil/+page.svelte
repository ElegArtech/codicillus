<script lang="ts">
	/**
	 * `/mon-profil` — V-25, les quatre onglets, et les quatre gestes qui écrivent.
	 *
	 * L'onglet est dans l'adresse (`?onglet=`, `docs/routes.md:283`) et le
	 * vecteur est composé par `vecteurDeV25()`, à un seul endroit. Aucune
	 * décision n'est prise ici : la garde de session est aux hooks, le verrou de
	 * `RG-M16-02` vient de la base, et le périmètre de lecture de
	 * `resolution.ts`.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * POURQUOI LE CÂBLAGE EST ICI ET NON DANS LA VUE — `ARB-063`
	 *
	 * Le gel de V-25 ne porte NI `method`, NI `action`, NI un seul attribut de
	 * nom : ses cinq formulaires n'ont que des identifiants. La vue en est la
	 * transcription fidèle et le reste ; c'est la ROUTE qui pose ce qui manque,
	 * après le montage, exactement comme `$lib/cablage/formulaires.ts` le fait
	 * pour l'éditeur, la connexion et le signet.
	 *
	 * AUCUN NŒUD N'EST AJOUTÉ NI DÉPLACÉ. Les valeurs sont RELEVÉES sur les nœuds
	 * du gel, par leur identifiant, et envoyées dans un corps composé à la volée.
	 * Envelopper les champs dans un formulaire soumissible après coup les
	 * déplacerait ; le rendu ne le tolère pas, et rien ne l'exige.
	 *
	 * QUATRE ACTIONS, TOUTES NOMMÉES. SvelteKit rend 500 si une action par défaut
	 * cohabite avec une action nommée : une page qui en porte plusieurs les nomme
	 * toutes. Chaque geste vise donc `?/…` explicitement.
	 *
	 * LES NOMS DE CHAMP SONT LES IDENTIFIANTS DU GEL — `p-affiche`,
	 * `p-session`, `actuel`, `nouveau`, `confirmation`. Rien n'est traduit : le
	 * nom est repris de l'identifiant, convention posée par `cablerLaConnexion()`
	 * et `cablerLeSignet()`.
	 *
	 * L'interrupteur de notification par courriel du gel n'est PLUS ÉMIS par
	 * V-25 : aucune colonne ne le porterait, et le produit n'a aucun expéditeur
	 * de courriel. Aucun geste ne le vise donc ici.
	 *
	 * SANS JAVASCRIPT, CET ÉCRAN NE SOUMET PAS. `ARB-063` §4 le déclare pour les
	 * sept formulaires du produit, et dit ce qu'il faudrait pour le combler.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Vue from '../../vues/V-25.svelte';
	import '../../vues/V-25.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * UN GESTE QUI ÉCRIT — soumis, puis relu depuis la base.
	 *
	 * `invalidateAll()` rejoue le chargeur : ce qui s'affiche après le geste vient
	 * de la base, jamais de ce qu'on croit avoir écrit. C'est ce qui rend la
	 * préférence visible à la relecture sans qu'aucun état ne soit tenu ici.
	 */
	async function soumettre(action: string, champs: Record<string, string>): Promise<boolean> {
		const corps = new FormData();
		for (const [nom, valeur] of Object.entries(champs)) corps.append(nom, valeur);
		const reponse = await fetch(`?/${action}`, { method: 'POST', body: corps });
		const charge = (await reponse.json()) as { type?: string };
		await invalidateAll();
		return charge.type === 'success';
	}

	/** La valeur d'un champ du gel, par son identifiant. */
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
-->
<Vue
	domaines={page.data.domaines}
	rangementDuProfil={page.data.rangement}
	vecteur={data.vecteur}
	notes={data.notes}
	profilDuCompte={data.profilDuCompte}
	preferenceDeSession={data.preferenceDeSession}
	contributions={data.contributions}
	relations={data.relations}
	activite={data.activite}
	compte={data.compte}
/>
