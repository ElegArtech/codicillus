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
	 * (DAG K-10). Un seul lot est autorisé à y revenir : T-106, pour monter la
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
		notifications?: readonly string[];
		/** La vue courante, rendue dans la zone de contenu. */
		enfants?: Snippet;
		/** Contenu présenté par le catalogue V-37 — `data-contenu` de la maquette. */
		contenu?: 'bord' | 'lecture';
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
		contenu
	}: Proprietes = $props();

	const sections = $derived(
		railRendu(sectionsDuRail(univers, domaines, notes), courant, brancheEnChargement)
	);
</script>

<a class="saut-contenu" href="#contenu">Aller au contenu</a>

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

		<main id="contenu">
			{#if enfants}{@render enfants()}{/if}
		</main>
	</div>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite">
	{#each notifications as texte, rang (rang)}<div class="notif">{texte}</div>{/each}
</div>
