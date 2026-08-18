<script module lang="ts">
	/** Les quatre types de notification du catalogue V-38, et rien d'autre. */
	export type TypeNotification = 'succes' | 'erreur' | 'info' | 'encours';

	/**
	 * Une notification visible à l'instant rendu.
	 *
	 * La forme est celle de `window.notifier()` de la maquette gelée
	 * (`V-38-notifications.html:2263`) : titre, détail facultatif, actions
	 * facultatives, avancement facultatif pour le seul type « en cours ».
	 * `duree` n'y figure PAS : l'effacement automatique est du comportement,
	 * pas un état (ARB-011, RG-M18-02, à reprendre par T-017).
	 */
	export interface Notification {
		readonly type: TypeNotification;
		readonly titre: string;
		readonly detail?: string;
		/** Les libellés des boutons d'action. Leur effet relève de T-017. */
		readonly actions?: readonly string[];
		/** Avancement figé, en pourcentage — un instant, jamais un film (ARB-011). */
		readonly progres?: number;
	}
</script>

<script lang="ts">
	/**
	 * Coquille applicative — le gabarit permanent de l'espace de travail (V-37).
	 *
	 * Trente-cinq vues sur quarante et une l'enveloppent : toutes celles de
	 * l'espace de travail et de la console. En sont exclues les quatre vues de
	 * l'espace public (V-01 à V-04) et les deux d'authentification (V-05, V-06)
	 * — `cadrage/BRIEF-VUES.md` §3.3.
	 *
	 * CE FICHIER EST LA RESSOURCE EXCLUSIVE DU LOT T-101, gelée à sa clôture
	 * (DAG K-10), puis ROUVERTE UNE FOIS par ARB-015 pour l'amendement borné du
	 * lot T-101b — et regelée à sa clôture. L'amendement porte sur deux points,
	 * et rien d'autre :
	 *   1. la classe et l'identifiant de `<main>`, que 32 maquettes sur les 34
	 *      à coquille dotées d'un `<main>` portent (`doc`, `travail`, `lecture`,
	 *      `editeur`, `carto`, `tdb`, … / `contenu`, `travail`, `corps`) ;
	 *   2. le jeu de notifications TYPÉ du catalogue V-38, en lieu et place des
	 *      notifications texte de T-101.
	 * Un seul lot est encore autorisé à y revenir : T-106, pour monter la
	 * palette V-09 sur le champ de recherche de la barre. Tout autre lot qui
	 * croit devoir y écrire déclare un écart.
	 *
	 * Rendu SERVEUR, sans hydratation (ADR-001) : la navigation, le fil d'Ariane
	 * et les droits sont résolus avant production du HTML. Aucune minuterie n'est
	 * écrite : le squelette rend l'ÉTAT, jamais la transition (ARB-011).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (identique à l'octet au socle gelé, P-6.1) et de `src/vues/V-37.css`
	 * (identique à l'octet au second bloc `<style>` de la maquette gelée, P-6.3).
	 * Toute déclaration ajoutée ici retomberait sous P-1 en entier (ADR-002).
	 */
	import type { Snippet } from 'svelte';
	import type { Domaine, Note, Univers } from '../../../seeds/corpus';
	import { railRendu, sectionsDuRail } from './arborescence';
	import BarreSuperieure from './BarreSuperieure.svelte';
	import Rail from './Rail.svelte';

	interface Compte {
		readonly nom: string;
		readonly initiales: string;
		readonly role: string;
		readonly domaine: string;
	}

	interface Proprietes {
		/** Le chemin de la page, du premier segment au titre courant. */
		fil: readonly string[];
		/** Le chemin de rangement mis en évidence dans le rail, du domaine au dernier dossier. */
		courant?: readonly string[];
		/** Les univers déclarés, dans l'ordre défini par l'administrateur. */
		univers: readonly Univers[];
		/** Les domaines accessibles à l'utilisateur. Vide : aucun périmètre. */
		domaines: readonly Domaine[];
		/** Les notes dont se déduit l'arborescence des dossiers. */
		notes: readonly Note[];
		compte: Compte;
		/** La version de l'instance, affichée au pied du rail. */
		version: string;
		/** Navigation ouverte, ou escamotée en mode concentration. */
		rail?: 'ouvert' | 'ferme';
		/** Profil : la section Gestion n'apparaît que pour l'administrateur. */
		role?: 'referent' | 'admin';
		/** Droits effectifs : en lecture seule, les actions d'écriture disparaissent. */
		droits?: 'ecriture' | 'lecture';
		/** Identité de la branche dont l'arborescence est en cours de chargement. */
		brancheEnChargement?: string | null;
		/** Notifications visibles à l'instant rendu — un état, jamais une minuterie. */
		notifications?: readonly Notification[];
		/** La vue courante, rendue dans la zone de contenu. */
		enfants?: Snippet;
		/** Contenu présenté par le catalogue V-37 — `data-contenu` de la maquette. */
		contenu?: 'bord' | 'lecture';
		/**
		 * La classe de `<main>`, propre à chaque vue (ARB-015). Absente, `<main>`
		 * est rendu sans attribut `class` — c'est le cas de V-23 et V-37, les deux
		 * seules maquettes à coquille qui n'en portent pas.
		 */
		classeContenu?: string;
		/**
		 * L'identifiant de `<main>`, et la cible du lien d'évitement. `contenu`
		 * pour vingt-trois maquettes, `travail` pour les dix vues de console,
		 * `corps` pour V-41 (ARB-015).
		 *
		 * LIMITE CONNUE, DÉCLARÉE, HORS DU PÉRIMÈTRE D'ARB-015. Le lien
		 * d'évitement ne vise `<main>` que dans 22 des 34 maquettes à coquille
		 * dotées d'un `<main>` ; les 12 autres visent une ancre INTÉRIEURE
		 * (`#resultats` en V-08, `#article` en V-14 et V-15, `#redaction` en
		 * V-17 et V-18, `#liste-noeuds` en V-19, …) et 11 portent un libellé
		 * autre que « Aller au contenu » (« Aller à la bibliothèque » en V-41).
		 * Servir ces vues demandera deux propriétés de plus — cible et libellé
		 * du lien d'évitement —, donc un arbitrage : ce lot ne les invente pas.
		 */
		idContenu?: string;
	}

	const {
		fil,
		courant = [],
		univers,
		domaines,
		notes,
		compte,
		version,
		rail = 'ouvert',
		role = 'referent',
		droits,
		brancheEnChargement = null,
		notifications = [],
		enfants,
		contenu,
		classeContenu,
		idContenu = 'contenu'
	}: Proprietes = $props();

	const sections = $derived(
		railRendu(sectionsDuRail(univers, domaines, notes), courant, brancheEnChargement)
	);
</script>

<!--
	La marque d'une notification. Les trois glyphes sont ceux de `GLYPHES_NOTIF`
	de la maquette gelée ; « en cours » n'en a pas et porte le rouet.
-->
{#snippet marque(type: TypeNotification)}
	<span class="notif__marque" aria-hidden="true"
		>{#if type === 'encours'}<span class="notif__rouet"></span>{:else}<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.9"
				>{#if type === 'succes'}<path
						d="M3 8.5l3.5 3.5L13 4.5"
					/>{:else if type === 'erreur'}<circle cx="8" cy="8" r="6.2" /><path
						d="M8 4.5v4M8 11.2v.3"
					/>{:else}<circle cx="8" cy="8" r="6.2" /><path d="M8 7.2v4M8 4.7v.3" />{/if}</svg
			>{/if}</span
	>
{/snippet}

<a class="saut-contenu" href="#{idContenu}">Aller au contenu</a>

<div
	class="app"
	id="app"
	data-rail={rail}
	data-role={role}
	data-droits={droits}
	data-contenu={contenu}
>
	<Rail {sections} {version} />

	<div class="cadre">
		<BarreSuperieure {fil} {rail} {compte} />

		<main class={classeContenu} id={idContenu}>
			{#if enfants}{@render enfants()}{/if}
		</main>
	</div>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite">
	{#each notifications as n, rang (rang)}<div
			class="notif notif--{n.type}"
			role={n.type === 'erreur' ? 'alert' : 'status'}
			aria-live={n.type === 'erreur' ? 'assertive' : 'polite'}
		>
			{@render marque(n.type)}
			<div class="notif__corps">
				<div class="notif__titre">{n.titre}</div>
				{#if n.detail}<div class="notif__detail">{n.detail}</div>{/if}
			</div>
			<button class="notif__fermer" type="button" aria-label="Fermer cette notification"
				><svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
				></button
			>{#if n.progres !== undefined}<div class="notif__progres">
					<i style="width:{n.progres}%"></i>
				</div>{/if}{#if n.actions}<div class="notif__actions">
					{#each n.actions as action (action)}<button type="button">{action}</button>{/each}
				</div>{/if}
		</div>{/each}
</div>
