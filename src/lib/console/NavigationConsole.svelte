<script lang="ts">
	/**
	 * Console — la navigation secondaire, `aside.nav2`.
	 *
	 * MOTIF COMMUN AUX DIX VUES DE CONSOLE. Mesuré, pas supposé : `aside.nav2`
	 * est IDENTIQUE À L'OCTET dans les dix maquettes gelées
	 * (`node verif/inventaire-composants.mjs --classe=nav2`,
	 * `docs/releve-vues.md` §8.2). Seul l'argument de `rendreConsole()` change
	 * — la section courante —, et le gel en fait un paramètre, pas un balisage.
	 *
	 * CE QUI EST RENDU, ET DANS QUEL ORDRE. Le gel construit ce bloc par script
	 * (`rendreConsole()`, `V-27:3141`) : l'en-tête au balisage, puis, pour
	 * chaque groupe, un `div.nav2__groupe` dans `#nav2-groupes` ET un
	 * `<optgroup>` dans `#nav2-selecteur`. Les deux listes portent les mêmes
	 * entrées dans le même ordre : le sélecteur est la forme petite écran de
	 * la même navigation (`.nav2__selecteur { display: none }` au-dessus de
	 * 1040 px, `.nav2__groupe { display: none }` en dessous).
	 *
	 * AUCUN COMPORTEMENT (ARB-011). Le gel attache un `click` sur chaque lien
	 * et un `change` sur le sélecteur ; tous deux n'appellent que
	 * `window.notifier(...)`. Le squelette rend l'ÉTAT, jamais la transition :
	 * rien n'est écrit ici.
	 *
	 * AUCUNE RÈGLE DE STYLE, AUCUN ATTRIBUT `style`. Ce composant ne vit pas
	 * sous `src/vues/`, il n'a donc pas la dérogation P-6.4 d'ARB-016 : le
	 * moindre littéral de style y retomberait sous P-1 en entier (ADR-002).
	 * Il n'en porte aucun, et `aside.nav2` du gel n'en porte aucun non plus.
	 */
	import {
		GROUPES_DE_CONSOLE,
		libelleDOption,
		type CleDeSection,
		type TraitDePictogramme
	} from './sections';

	interface Proprietes {
		/** La section que la vue rend — elle porte `aria-current="page"`. */
		courante: CleDeSection;
	}

	const { courante }: Proprietes = $props();
</script>

<!-- Les traits d'un pictogramme, tels que `sections.ts` les porte. -->
{#snippet trait(t: TraitDePictogramme)}{#if t.forme === 'path'}<path
			d={t.d}
		/>{:else if t.forme === 'rect'}<rect
			x={t.x}
			y={t.y}
			width={t.largeur}
			height={t.hauteur}
			rx={t.rx}
		/>{:else}<circle cx={t.cx} cy={t.cy} r={t.r} />{/if}{/snippet}

<aside class="nav2" aria-label="Sections de la console">
	<div class="nav2__tete">
		<div class="nav2__nom">
			<svg
				width="17"
				height="17"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				><path
					d="M6.5 1.8h3l.3 1.7 1.5.9 1.6-.7 1.5 2.6-1.2 1.2v1.7l1.2 1.2-1.5 2.6-1.6-.7-1.5.9-.3 1.7h-3l-.3-1.7-1.5-.9-1.6.7L.6 12.4l1.2-1.2V9.5L.6 8.3l1.5-2.6 1.6.7 1.5-.9z"
				/><circle cx="8" cy="8" r="2" /></svg
			>
			Console
		</div>
		<div class="nav2__sous">Administration de l'instance</div>
		<select class="nav2__selecteur" id="nav2-selecteur" aria-label="Section de la console"
			>{#each GROUPES_DE_CONSOLE as groupe (groupe.nom)}<optgroup label={groupe.nom}
					>{#each groupe.sections as section (section.cle)}<option
							value={section.cle}
							selected={section.cle === courante}>{libelleDOption(section)}</option
						>{/each}</optgroup
				>{/each}</select
		>
	</div>
	<div id="nav2-groupes">
		{#each GROUPES_DE_CONSOLE as groupe (groupe.nom)}<div class="nav2__groupe">
				<div class="nav2__titre etiq">{groupe.nom}</div>
				{#each groupe.sections as section (section.cle)}<button
						class="nav2__lien"
						type="button"
						aria-current={section.cle === courante ? 'page' : undefined}
						><span
							><svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								>{#each section.pictogramme as t, rang (rang)}{@render trait(t)}{/each}</svg
							></span
						><span class="nav2__nomlien">{section.nom}</span>{#if section.compte !== undefined}<span
								class="nav2__n">{section.compte}</span
							>{/if}</button
					>{/each}
			</div>{/each}
	</div>
</aside>
