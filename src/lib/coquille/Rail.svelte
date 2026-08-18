<script lang="ts">
	/**
	 * Coquille applicative (V-37) — la navigation latérale.
	 *
	 * Portée par les 35 vues de l'espace de travail et de la console. Le balisage
	 * reproduit `mockups/V-37-coquille.html` ; la mise en forme vient de
	 * `src/socle.css` et de `src/vues/V-37.css`, tous deux identiques à l'octet à
	 * leur source gelée. AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002).
	 *
	 * Le contenu de l'arborescence est dérivé du corpus, jamais écrit en dur :
	 * réordonner les univers dans la console réordonne cette navigation.
	 *
	 * Le rail est `display: none` sous 1240 px, sans contre-règle : sur petit
	 * écran l'arborescence est inatteignable. C'est la maquette gelée qui en
	 * décide, et ARB-010 qui l'assume — RG-M18-12 et RG-M18-13 restent, sur cet
	 * axe, NON TENUES. Aucun tiroir n'est ajouté ici : ce serait un comblement.
	 *
	 * Le chevron déplie, le nom navigue : deux cibles distinctes. Les adresses
	 * sont celles de la maquette gelée — `href="#"` — ; leur câblage relève des
	 * lots de routage, pas de la coquille.
	 */
	import type { NoeudRendu, SectionRendue } from './arborescence';

	interface Proprietes {
		/** Les univers porteurs d'au moins un domaine accessible, et leurs arbres. */
		sections: readonly SectionRendue[];
		/** La version de l'instance, affichée au pied du rail. */
		version: string;
	}

	const { sections, version }: Proprietes = $props();
</script>

{#snippet branche(n: NoeudRendu)}
	<li data-cle={n.cle} data-ouvert={n.ouvert ? 'oui' : 'non'}>
		<div class="noeud" class:noeud--courant={n.courant} data-ouvert={n.ouvert ? 'oui' : undefined}>
			{#if n.enfants.length}<button
					class="noeud__chevron"
					type="button"
					aria-expanded={n.ouvert}
					aria-label="Déplier {n.nom}"
					><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
						><path d="M3 1l4 4-4 4z" /></svg
					></button
				>{:else}<span style="width: 20px; flex: 0 0 auto;"></span>{/if}<a
				class="noeud__nom"
				href="#"
				aria-current={n.page ? 'page' : undefined}>{n.nom}</a
			>{#if n.chargement}<span class="noeud__rouet" aria-label="Chargement"></span>{/if}
		</div>
		{#if n.enfants.length}
			<ul>
				{#each n.enfants as enfant (enfant.cle)}{@render branche(enfant)}{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<aside class="rail" aria-label="Navigation principale">
	<div class="rail__marque">
		<div class="rail__sceau" aria-hidden="true">C</div>
		<div class="rail__nom">Codicillus</div>
	</div>

	<div class="rail__section">
		<a class="rail__lien" href="#" data-vers="Accueil contributeur — vue V-07">
			<svg
				width="15"
				height="15"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"><path d="M2 7l6-4.5L14 7v6.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z" /></svg
			>
			Accueil
		</a>
	</div>

	<div id="rail-univers">
		{#if sections.length === 0}<div class="rail__vide">
				Aucun domaine ne vous est accessible pour l'instant. Demandez à un administrateur de vous
				rattacher à un domaine — votre compte existe, il n'a simplement pas encore de périmètre.
			</div>{:else}{#each sections as section (section.nom)}<div class="rail__section">
					<div class="rail__titre etiq">{section.nom}</div>
					<ul class="arbre">
						{#each section.domaines as domaine (domaine.cle)}{@render branche(domaine)}{/each}
					</ul>
				</div>{/each}{/if}
	</div>

	<div class="rail__section">
		<div class="rail__titre etiq">Outils</div>
		<a class="rail__lien" href="#" data-vers="Cartographie — vue V-19">
			<svg
				width="15"
				height="15"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				><circle cx="4" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><path
					d="M5.6 5.6l4.8 4.8"
				/></svg
			>
			Cartographie
		</a>
		<a class="rail__lien" href="#" data-vers="Carte mentale — vue V-21">
			<svg
				width="15"
				height="15"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				><rect x="1.5" y="6" width="5" height="4" rx="1" /><rect
					x="9.5"
					y="2"
					width="5"
					height="4"
					rx="1"
				/><rect x="9.5" y="10" width="5" height="4" rx="1" /><path
					d="M6.5 8h1.5v-4h1.5M8 8v4h1.5"
				/></svg
			>
			Carte mentale
		</a>
		<a class="rail__lien" href="#" data-vers="Signets — vue V-22">
			<svg
				width="15"
				height="15"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"><path d="M4 2.5h8v11l-4-3-4 3v-11z" /></svg
			>
			Signets
		</a>
		<a class="rail__lien si-ecriture" href="#" data-vers="Import — vue V-24">
			<svg
				width="15"
				height="15"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"><path d="M8 10.5V2M4.8 6.2L8 2.8l3.2 3.4M2.5 13.5h11" /></svg
			>
			Import
		</a>
	</div>

	<div class="rail__section si-admin">
		<div class="rail__titre etiq">Gestion</div>
		<a class="rail__lien" href="#" data-vers="Console — vue V-27">
			<svg
				width="15"
				height="15"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				><path
					d="M6.5 1.8h3l.3 1.7 1.5.9 1.6-.7 1.5 2.6-1.2 1.2v1.7l1.2 1.2-1.5 2.6-1.6-.7-1.5.9-.3 1.7h-3l-.3-1.7-1.5-.9-1.6.7L.6 12.4l1.2-1.2V9.5L.6 8.3l1.5-2.6 1.6.7 1.5-.9z"
				/><circle cx="8" cy="8" r="2" /></svg
			>
			Console
		</a>
	</div>

	<div class="rail__pied">
		<span class="etiq">Codicillus {version}</span>
	</div>
</aside>
