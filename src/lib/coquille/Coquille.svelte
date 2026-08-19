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
	 * (DAG K-10), puis ROUVERTE DEUX FOIS, chaque fois pour un amendement borné,
	 * chaque fois REGELÉE à la clôture du lot qui l'a portée.
	 *
	 * PREMIER AMENDEMENT — ARB-015, lot T-101b. Deux points, et rien d'autre :
	 *   1. la classe et l'identifiant de `<main>`, que 32 maquettes sur les 34
	 *      à coquille dotées d'un `<main>` portent (`doc`, `travail`, `lecture`,
	 *      `editeur`, `carto`, `tdb`, … / `contenu`, `travail`, `corps`) ;
	 *   2. le jeu de notifications TYPÉ du catalogue V-38, en lieu et place des
	 *      notifications texte de T-101.
	 *
	 * SECOND AMENDEMENT — ARB-019, lot T-101c. Deux propriétés, et rien
	 * d'autre : la CIBLE du lien d'évitement (`cibleEvitement`) et son LIBELLÉ
	 * (`libelleEvitement`). Défauts inchangés — `#{idContenu}` et « Aller au
	 * contenu » —, donc aucun changement de rendu pour les vues déjà livrées.
	 * Motif : le lien d'évitement ne vise `<main>` que dans 22 des 34 maquettes
	 * à coquille, et 11 portent un libellé propre ; c'est le premier nœud
	 * focalisable de la page et une exigence d'accessibilité réelle
	 * (RG-M18-08, P-06), pas une décoration.
	 *
	 * LE GABARIT EST REGELÉ. Un seul lot est encore autorisé à y revenir :
	 * T-106, pour monter la palette V-09 sur le champ de recherche de la barre.
	 * Tout autre lot qui croit devoir y écrire déclare un écart.
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
		 * L'identifiant de `<main>`, et la cible du lien d'évitement PAR DÉFAUT.
		 * `contenu` pour vingt-trois maquettes, `travail` pour les dix vues de
		 * console, `corps` pour V-41 (ARB-015).
		 */
		idContenu?: string;
		/**
		 * La cible du lien d'évitement, SANS le croisillon — `resultats`,
		 * `article`, `redaction`… Absente, la cible est `idContenu` : c'est le
		 * cas des 22 maquettes à coquille où le lien vise bien `<main>`, dont
		 * les quatre livrées et les dix vues de console (ARB-019).
		 *
		 * Les douze autres visent une ancre INTÉRIEURE au contenu, relevée sur
		 * le gel : `resultats` (V-08), `liste` (V-12, V-21, V-22), `article`
		 * (V-14, V-15), `zone` (V-16), `redaction` (V-17, V-18), `liste-noeuds`
		 * (V-19), `adresse` (V-23), `rech` (V-26). V-41 n'en fait PAS partie :
		 * son `#corps` est l'identifiant de son propre `<main>`, elle n'amende
		 * donc que le libellé.
		 */
		cibleEvitement?: string;
		/**
		 * Le libellé du lien d'évitement. Absent, « Aller au contenu » — le
		 * texte de 23 des 34 maquettes à coquille (ARB-019).
		 *
		 * Les onze autres, relevées sur le gel : « Aller aux résultats »
		 * (V-08), « Aller à la liste » (V-12, V-22), « Aller à la comparaison »
		 * (V-16), « Aller à la rédaction » (V-17, V-18), « Aller à la liste des
		 * nœuds » (V-19), « Aller à l'arborescence » (V-21), « Aller au
		 * formulaire » (V-23), « Aller à la recherche » (V-26), « Aller à la
		 * bibliothèque » (V-41). V-14 et V-15 gardent le libellé par défaut
		 * tout en visant `article` : cible et libellé sont indépendants.
		 */
		libelleEvitement?: string;
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
		idContenu = 'contenu',
		cibleEvitement,
		libelleEvitement = 'Aller au contenu'
	}: Proprietes = $props();

	const sections = $derived(
		railRendu(sectionsDuRail(univers, domaines, notes), courant, brancheEnChargement)
	);

	/**
	 * La cible effective du lien d'évitement : l'ancre déclarée par la vue, à
	 * défaut l'identifiant de `<main>` — le comportement de T-101b, préservé à
	 * l'octet pour les 22 vues concordantes.
	 */
	const cible = $derived(cibleEvitement ?? idContenu);
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

<a class="saut-contenu" href="#{cible}">{libelleEvitement}</a>

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
