<script lang="ts">
	/**
	 * Console — un pictogramme SVG, tel que le gel l'écrit.
	 *
	 * Les maquettes de console injectent leurs pictogrammes par `innerHTML`, à
	 * partir de fragments SVG littéraux : les dix de la navigation secondaire
	 * (`SECTIONS[].ic`), les six glyphes d'univers de V-27 (`GLYPHES`). Tous
	 * ont la même enveloppe — `fill="none" stroke="currentColor"` — et ne
	 * varient que par la taille, la boîte de vue et l'épaisseur de trait.
	 *
	 * Les traits sont reçus DÉCOMPOSÉS (`TraitDePictogramme`) plutôt qu'en
	 * chaîne de balisage : une chaîne demanderait `{@html}`, que le
	 * compilateur ne relit pas, et qu'aucune contrainte n'oblige à employer.
	 *
	 * Aucune règle de style, aucun attribut `style` : ce composant ne vit pas
	 * sous `src/vues/` et n'a pas la dérogation P-6.4 (ARB-016). Les
	 * dimensions sont des ATTRIBUTS SVG — `width`, `height`, `viewBox` —, pas
	 * des déclarations CSS : P-1 ne s'y applique pas, et le gel les écrit
	 * ainsi.
	 */
	import type { TraitDePictogramme } from './sections';

	interface Proprietes {
		/** Les traits, dans l'ordre du gel. */
		traits: readonly TraitDePictogramme[];
		/** `width` et `height`, toujours égaux au gel. */
		taille: string;
		/** `viewBox` — « 0 0 16 16 » pour la navigation, « 0 0 24 24 » pour les glyphes. */
		boite: string;
		/** `stroke-width`. */
		epaisseur: string;
	}

	const { traits, taille, boite, epaisseur }: Proprietes = $props();
</script>

<svg
	width={taille}
	height={taille}
	viewBox={boite}
	fill="none"
	stroke="currentColor"
	stroke-width={epaisseur}
	>{#each traits as t, rang (rang)}{#if t.forme === 'path'}<path
				d={t.d}
			/>{:else if t.forme === 'rect'}<rect
				x={t.x}
				y={t.y}
				width={t.largeur}
				height={t.hauteur}
				rx={t.rx}
			/>{:else}<circle cx={t.cx} cy={t.cy} r={t.r} />{/if}{/each}</svg
>
