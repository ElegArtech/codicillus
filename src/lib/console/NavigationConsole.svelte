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
	 * LES DIX ENTRÉES MÈNENT ENFIN QUELQUE PART. La rédaction précédente disait
	 * « AUCUN COMPORTEMENT (ARB-011) […] rien n'est écrit ici » : le gel
	 * n'attachait au clic et au `change` qu'un `window.notifier(...)`, parce
	 * qu'il tient ses dix écrans dans une seule page. `ARB-011` ne s'applique
	 * plus (`docs/plan-remediation.md` §2) et le produit, lui, a DIX ADRESSES
	 * (`docs/routes.md` §3.6) : une entrée dessinée qui ne mène nulle part est
	 * un défaut, pas une fidélité.
	 *
	 * LE NŒUD NE BOUGE PAS POUR AUTANT. Le gel rend des `<button>`, pas des
	 * `<a>` ; ils le restent, et la navigation passe par `goto()`. Un `<a>`
	 * changerait le rôle, le nom accessible et l'ordre de tabulation.
	 *
	 * AUCUNE RÈGLE DE STYLE, AUCUN ATTRIBUT `style`. Ce composant ne vit pas
	 * sous `src/vues/`, il n'a donc pas la dérogation P-6.4 d'ARB-016 : le
	 * moindre littéral de style y retomberait sous P-1 en entier (ADR-002).
	 * Il n'en porte aucun, et `aside.nav2` du gel n'en porte aucun non plus.
	 */
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		GROUPES_DE_CONSOLE,
		libelleDOption,
		type CleDeSection,
		type TraitDePictogramme
	} from './sections';
	import { CLE_EFFECTIFS, groupesAvecEffectifs, type EffectifsDeConsole } from './effectifs';

	interface Proprietes {
		/** La section que la vue rend — elle porte `aria-current="page"`. */
		courante: CleDeSection;
	}

	const { courante }: Proprietes = $props();

	/**
	 * LES SEPT COMPTEURS VIENNENT DE LA BASE DÈS QU'IL Y EN A UNE.
	 *
	 * `GROUPES_DE_CONSOLE` dérive ses `compte` de `seeds/corpus.ts` : c'est le
	 * contenu d'exemple du gel, juste pour le rendu d'une planche, faux pour une
	 * instance. `$lib/console/effectifs.ts` porte le motif complet et la mesure.
	 *
	 * LA PRÉSENCE DU CONTEXTE DÉCIDE, PAS SON CONTENU — même leçon que le rail de
	 * `Coquille.svelte` : une base à zéro univers n'est pas une base absente, et
	 * elle annonce zéro. Hors application — le rendu par défaut d'une vue —,
	 * `getContext` rend `undefined`, le catalogue s'applique tel quel, et le gel
	 * garde ses sept nombres au pixel.
	 */
	const effectifs = getContext<EffectifsDeConsole | undefined>(CLE_EFFECTIFS);
	const groupes = $derived(
		effectifs === undefined ? GROUPES_DE_CONSOLE : groupesAvecEffectifs(effectifs)
	);

	/**
	 * LA SECTION VISÉE DEVIENT UNE NAVIGATION — la section courante, rien : le
	 * gel la marque `aria-current="page"`, et y renvoyer serait un rechargement
	 * sans effet.
	 *
	 * LES DIX CHEMINS SONT ÉCRITS EN TOUTES LETTRES, ET C'EST LE COMPILATEUR QUI
	 * L'EXIGE. Une table `Record<CleDeSection, Pathname>` serait plus courte,
	 * mais `resolve()` est SURCHARGÉ route par route — il prend un chemin
	 * LITTÉRAL, jamais une union de dix, et refuse de compiler autrement. La
	 * seule autre sortie était un `goto()` sans `resolve()`, que
	 * `svelte/no-navigation-without-resolve` interdit à juste titre.
	 *
	 * L'EXHAUSTIVITÉ N'EST PAS UNE PROMESSE, ELLE EST TENUE : `CleDeSection` est
	 * une union fermée de dix clés, et un `case` manquant laisse un chemin sans
	 * `return` que `tsc` voit. `docs/routes.md` §3.6 est la source des adresses.
	 */
	function allerA(cle: CleDeSection): void {
		if (cle === courante) return;
		switch (cle) {
			case 'univers':
				void goto(resolve('/console/univers'));
				return;
			case 'domaines':
				void goto(resolve('/console/domaines'));
				return;
			case 'fiches':
				void goto(resolve('/console/types-de-fiches'));
				return;
			case 'relations':
				void goto(resolve('/console/types-de-relations'));
				return;
			case 'templates':
				void goto(resolve('/console/templates'));
				return;
			case 'comptes':
				void goto(resolve('/console/comptes'));
				return;
			case 'imports':
				void goto(resolve('/console/imports'));
				return;
			case 'exports':
				void goto(resolve('/console/exports'));
				return;
			case 'analytique':
				void goto(resolve('/console/analytique'));
				return;
			case 'configuration':
				void goto(resolve('/console/configuration'));
				return;
		}
	}
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
		<select
			class="nav2__selecteur"
			id="nav2-selecteur"
			aria-label="Section de la console"
			onchange={(e) => allerA(e.currentTarget.value as CleDeSection)}
			>{#each groupes as groupe (groupe.nom)}<optgroup label={groupe.nom}
					>{#each groupe.sections as section (section.cle)}<option
							value={section.cle}
							selected={section.cle === courante}>{libelleDOption(section)}</option
						>{/each}</optgroup
				>{/each}</select
		>
	</div>
	<div id="nav2-groupes">
		{#each groupes as groupe (groupe.nom)}<div class="nav2__groupe">
				<div class="nav2__titre etiq">{groupe.nom}</div>
				{#each groupe.sections as section (section.cle)}<button
						class="nav2__lien"
						type="button"
						aria-current={section.cle === courante ? 'page' : undefined}
						onclick={() => allerA(section.cle)}
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
