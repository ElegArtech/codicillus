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
	 * `si-admin` sur l'entrée « Console d'administration » reproduit la maquette,
	 * qui la retire en CSS. Ce n'est PAS P-09 : une action interdite doit être
	 * absente du DOM (ADR-011), ce que ce squelette ne prétend pas tenir — la
	 * frontière de droits relève de T-011 et T-016, en lentille adversariale.
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
		/** L'état du rail : le bouton de bascule annonce l'action opposée. */
		rail: 'ouvert' | 'ferme';
		compte: Compte;
	}

	const { fil, rail, compte }: Proprietes = $props();

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
	<nav class="fil" id="fil" aria-label="Fil d'Ariane">
		{#each fil as segment, rang (rang)}{#if rang}<span>›</span
				>{/if}{#if rang === fil.length - 1}<span class="fil__courant">{segment}</span>{:else}<a
					href="#">{segment}</a
				>{/if}{/each}
	</nav>
	<div class="recherche" id="ouvrir-recherche" role="button" tabindex="0">
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

	<div class="menu-barre si-ecriture" id="menu-creer">
		<button class="btn" id="ouvrir-creer" aria-haspopup="true" aria-expanded="false" title="Créer">
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
	</div>

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
					><path d="M6 14H3.5a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1H6M10.5 11L14 8l-3.5-3M14 8H6" /></svg
				>Se déconnecter</button
			>
		</div>
	</div>
</header>
