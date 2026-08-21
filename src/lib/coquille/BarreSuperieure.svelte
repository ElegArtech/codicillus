<script lang="ts">
	/**
	 * Coquille applicative (V-37) — la barre supérieure.
	 *
	 * Fil d'Ariane, champ de recherche avec rappel du raccourci, menu de création
	 * et menu utilisateur. Le balisage reproduit `mockups/V-37-coquille.html` ; la
	 * mise en forme vient de `src/socle.css` et de `src/vues/V-37.css`. AUCUNE
	 * RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002).
	 *
	 * C'est la seule zone de la coquille qui subsiste sous 1240 px, le rail y étant
	 * escamoté sans contre-règle (ARB-010). Sous 640 px elle lâche ses rappels
	 * clavier et ne garde du fil que le segment courant : la maquette gelée le
	 * règle en CSS, il n'y a rien à décider ici.
	 *
	 * Les deux menus sont rendus FERMÉS. Les ouvrir est du comportement, donc du
	 * temps 3 : aucun des huit états de `verif/scenarios/V-37.json` ne les montre
	 * ouverts, et le squelette ne rend que l'état.
	 *
	 * ─────────────────────────────────────────────────────────────────────────
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040) — lot T-072
	 *
	 * Le gel POSE les actions d'écriture puis les cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }` (socle.css:396).
	 * Une maquette statique n'a pas de serveur ; le produit, lui, peut ne pas les
	 * ÉMETTRE — et P-09 l'exige, « ni grisée, NI MASQUÉE ». DEUX NŒUDS sont
	 * conditionnés ici, et seul leur RENDU l'est ; la classe `si-ecriture` reste
	 * intacte sur le nœud émis, parce qu'elle porte aussi la mise en forme :
	 *
	 *   forme ABRÉGÉE   `button.btn.si-ecriture` « Créer »          (7 vues)
	 *   forme COMPLÈTE  `div.menu-barre.si-ecriture#menu-creer`     (V-07, V-14)
	 *
	 * `si-admin` SUR L'ENTRÉE « Console d'administration » N'EST PAS CONDITIONNÉE,
	 * et il faut dire pourquoi plutôt que de le taire. Elle vit dans
	 * `.menu-barre__liste`, que le gel rend `display: none` tant que le menu est
	 * fermé — et aucun des huit états déclarés ne l'ouvre. `pnpm test:droits` la
	 * classe donc « hors état » DES DEUX CÔTÉS et ne la compte nulle part : elle
	 * ne fait pas partie des 26 actions que le lot T-072 avait à fermer. La
	 * fermer quand même serait une décision fonctionnelle prise en exécution ;
	 * elle est REMONTÉE, pas prise. Voir T-072 É-4.
	 *
	 * ─────────────────────────────────────────────────────────────────────────
	 * DEUX FORMES — ARB-021, A-1a et A-1g
	 *
	 * Forme COMPLÈTE — 8 vues : les deux menus déroulants, et `id` sur le champ
	 * de recherche. Forme ABRÉGÉE — 26 vues : `button.btn.si-ecriture` NU et
	 * `button.avatar` NU, et `.recherche` SANS `id` (`V-25:1084-1094`).
	 *
	 * La différence n'est pas décorative, et le CSS le prouve : les six classes
	 * `.menu-barre*` ne sont déclarées par AUCUNE des deux feuilles des 26 vues
	 * abrégées. `.menu-barre__liste { display: none }` n'y existant pas, la liste
	 * de menu s'y afficherait DÉPLIÉE dans la barre supérieure.
	 *
	 * ─────────────────────────────────────────────────────────────────────────
	 * L'ENVELOPPE DE PICTOGRAMME DE MENU — CONVERGENCE ARB-022, TOUJOURS NON
	 * PORTÉE, ET POUR UNE RAISON DE DISPOSITIF
	 *
	 * Le gel enveloppe chaque pictogramme d'entrée de menu d'un `<span>` porteur
	 * d'une hauteur de ligne nulle (`V-37:3308`, `i.style.lineHeight = "0"`).
	 * Mesurée gratuite par le lot précédent — géométries identiques au centième
	 * de pixel, 45 états identiques à l'octet —, la convergence a été REFUSÉE
	 * faute de portée (`ECART-021`) : P-6.4 / ARB-016 n'accorde la preuve par le
	 * gel qu'aux composants `src/vues/V-xx.svelte`.
	 *
	 * ARB-022 étend cette preuve aux ressources partagées — MAIS À UNE CONDITION
	 * QU'IL POSE LUI-MÊME : « le rattachement ressource → maquette est déclaré
	 * dans un fichier en écriture humaine seule ». Ce fichier N'EXISTE PAS
	 * ENCORE, et `verif/styles-en-ligne.mjs` ne connaît toujours que
	 * `RE_COMPOSANT = /^(V-\d\d)\.svelte$/`. Mesuré : porter les sept
	 * enveloppes fait sortir `pnpm verif:jetons` avec SEPT constats P-1.7, tous
	 * de cette seule cause.
	 *
	 * L'exécutant de P-0 a donc fait le même geste que celui d'`ECART-021`, et
	 * pour la même raison : il n'étend pas l'instrument pour verdir sa propre
	 * tâche. La convergence attend le fichier de rattachement, pas un arbitrage
	 * de plus.
	 */
	interface Compte {
		/** Nom complet, affiché en tête du menu utilisateur. */
		readonly nom: string;
		/** Deux initiales, portées par l'avatar. */
		readonly initiales: string;
		readonly role: string;
		readonly domaine: string;
	}

	interface Proprietes {
		/** Le chemin de la page, du premier segment au titre courant. */
		fil: readonly string[];
		/**
		 * L'ADRESSE DE CHAQUE SEGMENT DU FIL, dans l'ordre du fil.
		 *
		 * Le gel ne déclare AUCUNE destination pour le fil d'Ariane : son script
		 * pose `href="#"` et notifie « Retour vers « X » » (`V-37:3410`). Les
		 * adresses ne se lisent donc pas sur la maquette — elles se composent, et
		 * `Coquille.svelte` les compose, parce qu'elle est la seule à connaître le
		 * chemin de rangement courant qui donne son sens à chaque segment.
		 *
		 * Une case absente laisse le segment à `href="#"` : mieux vaut un lien
		 * sans destination qu'une destination inventée.
		 */
		cibles?: readonly (string | undefined)[];
		/** L'état du rail : le bouton de bascule annonce l'action opposée. */
		rail: 'ouvert' | 'ferme';
		compte: Compte;
		/** La forme portée par la vue (ARB-021, A-1). */
		forme?: 'complete' | 'abregee';
		/**
		 * DROITS EFFECTIFS — P-09. En lecture seule, le menu de création n'est pas
		 * ÉMIS. Absente, la propriété vaut « aucune restriction » : c'est ce que
		 * fait le socle, dont la règle ne se déclenche que sur
		 * `data-droits="lecture"`.
		 */
		droits?: 'ecriture' | 'lecture' | undefined;
	}

	const { fil, cibles = [], rail, compte, forme = 'complete', droits }: Proprietes = $props();

	/* La TRANSCRIPTION de la règle du socle, pas une interprétation. */
	const ecriture = $derived(droits !== 'lecture');

	const designation = $derived(`${compte.nom} — menu utilisateur`);
	const sousTitre = $derived(compte.domaine ? `${compte.role} · ${compte.domaine}` : compte.role);
</script>

<header class="barre">
	<button
		class="btn btn--discret"
		id="bascule-rail"
		aria-label={rail === 'ferme' ? 'Déplier la navigation' : 'Replier la navigation'}
		title="Mode concentration"
	>
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.4"
			><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path d="M6 2.5v11" /></svg
		>
	</button>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- l'adresse d'un segment
		du fil est COMPOSÉE par `Coquille.svelte`, seule à savoir lequel est un univers,
		un domaine ou un dossier, et elle la compose par `$lib/rangement/adresses.ts`.
		La règle inspecte l'EXPRESSION du `href` : elle ne peut pas la suivre jusque
		là, et elle ne peut pas non plus la vérifier ici. Même geste qu'en V-03, V-22
		et V-24. -->
	<nav class="fil" id="fil" aria-label="Fil d'Ariane">
		{#each fil as segment, rang (rang)}{#if rang}<span>›</span
				>{/if}{#if rang === fil.length - 1}<span class="fil__courant">{segment}</span>{:else}<a
					href={cibles[rang] ?? '#'}>{segment}</a
				>{/if}{/each}
	</nav>
	<div
		class="recherche"
		id={forme === 'abregee' ? undefined : 'ouvrir-recherche'}
		role="button"
		tabindex="0"
	>
		<svg
			width="14"
			height="14"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
		>
		<span class="recherche__txt" style="flex:1">Rechercher…</span>
		<kbd class="touche">Ctrl</kbd><kbd class="touche">K</kbd>
	</div>
	{#if forme === 'abregee'}
		{#if ecriture}<button class="btn si-ecriture" title="Créer">
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
				>
				Créer
			</button>{/if}
		<button class="avatar" title={designation}>{compte.initiales}</button>
	{:else}
		{#if ecriture}<div class="menu-barre si-ecriture" id="menu-creer">
				<button
					class="btn"
					id="ouvrir-creer"
					aria-haspopup="true"
					aria-expanded="false"
					title="Créer"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
					>
					Créer
				</button>
				<div class="menu-barre__liste" role="menu" aria-label="Créer">
					<button type="button" role="menuitem"
						><svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><path
								d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"
							/></svg
						>Nouvelle note</button
					><button type="button" role="menuitem"
						><svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><path
								d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
							/><path d="M8 7.5v4M6 9.5h4" /></svg
						>Nouveau dossier</button
					><button type="button" role="menuitem"
						><svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"><path d="M4 2.5h8v11l-4-3-4 3v-11z" /></svg
						>Nouveau signet</button
					>
					<div class="menu-barre__sep"></div>
					<button type="button" role="menuitem"
						><svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"><path d="M8 10.5V2M4.8 6.2L8 2.8l3.2 3.4M2.5 13.5h11" /></svg
						>Importer des fichiers</button
					>
				</div>
			</div>{/if}

		<div class="menu-barre" id="menu-compte">
			<button
				class="avatar"
				id="ouvrir-compte"
				aria-haspopup="true"
				aria-expanded="false"
				title={designation}
				aria-label={designation}>{compte.initiales}</button
			>
			<div
				class="menu-barre__liste menu-barre__liste--droite"
				role="menu"
				aria-label="Menu utilisateur"
			>
				<div class="menu-barre__entete">
					<div class="menu-barre__nom">{compte.nom}</div>
					<div class="menu-barre__role">{sousTitre}</div>
				</div>
				<button type="button" role="menuitem"
					><svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><circle cx="8" cy="5.5" r="2.6" /><path d="M2.8 13.5a5.2 5.2 0 0 1 10.4 0" /></svg
					>Mon profil</button
				><button type="button" role="menuitem" class="si-admin"
					><svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><circle cx="8" cy="8" r="2" /><path
							d="M6.5 1.8h3l.3 1.7 1.5.9 1.6-.7 1.5 2.6-1.2 1.2v1.7l1.2 1.2-1.5 2.6-1.6-.7-1.5.9-.3 1.7h-3l-.3-1.7-1.5-.9-1.6.7L.6 12.4l1.2-1.2V9.5L.6 8.3l1.5-2.6 1.6.7 1.5-.9z"
						/></svg
					>Console d'administration</button
				>
				<div class="menu-barre__sep"></div>
				<button type="button" role="menuitem"
					><svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><path
							d="M6 14H3.5a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1H6M10.5 11L14 8l-3.5-3M14 8H6"
						/></svg
					>Se déconnecter</button
				>
			</div>
		</div>
	{/if}
</header>
