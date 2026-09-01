<script lang="ts">
	/**
	 * LA BARRE D'ÉTAT DES DEUX ÉDITEURS — `div.barre-etat`, le nœud que V-17 et
	 * V-18 rendent APRÈS `<main>`.
	 *
	 * CE SONT LES DEUX SEULES MAQUETTES DU DÉPÔT DANS CE CAS. `ECART-027` É-2 l'a
	 * mesuré sur les 41 maquettes : `div.cadre` a deux enfants partout — la barre
	 * supérieure, puis `<main>` ou son enveloppe — sauf V-17 et V-18, qui en ont
	 * trois. C'est ce constat qui a valu au gabarit son cinquième passage et sa
	 * propriété `apresContenu` ; ce composant est le nœud qu'elle reçoit.
	 *
	 * IDENTIQUE À L'OCTET D'UNE VUE À L'AUTRE, sauf deux libellés — vérifié par
	 * `diff` entre `V-17:1679-1694` et `V-18:1970-1984` : le bouton de bascule des
	 * panneaux dit « Métadonnées » chez l'un et « Référence » chez l'autre, et le
	 * bouton principal « Enregistrer » contre « Enregistrer l'Opérationnel ». La
	 * boîte est la même aux douze états et aux quatre fenêtres du banc :
	 * `248, 837, 1192, 63`.
	 *
	 * POURQUOI LE BOUTON PRINCIPAL EST UN SNIPPET, ET PAS UNE CHAÎNE. Son contenu
	 * porte, sur son premier `kbd`, une marge gauche EN LIGNE — et `margin-left`
	 * est une propriété CONTRAINTE par P-1.2. Un style en ligne n'est prouvé que
	 * par la maquette RATTACHÉE au fichier : par le nommage pour
	 * `src/vues/V-xx.svelte` (ARB-016, P-6.4), par déclaration pour une ressource
	 * partagée (ARB-022). `src/lib/edition/` n'a ni l'un ni l'autre, et un agent
	 * d'exécution n'écrit jamais dans ce fichier de rattachement (PLAN §12). Le
	 * fragment vient donc des deux vues, qui, elles, sont rattachées par leur nom.
	 * C'est exactement la jurisprudence du séparateur `›` de V-14.
	 *
	 * LE `display:none` DU BOUTON DE BASCULE reste ici : `display` n'est pas une
	 * propriété contrainte par P-1, et la règle qui le relève est
	 * `.bouton-meta { display: inline-flex !important }` sous 980 px
	 * (`V-17.css:746`).

	 * ATTENTION, PIÈGE D'INSTRUMENT : ne jamais citer un attribut de style sous sa
	 * forme exacte dans un commentaire : décris-la. Une citation se lit comme une
	 * déclaration de style, dans un fichier qui n'a aucune maquette pour en répondre.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT ICI (ARB-011). Le composant REND l'état
	 * de sauvegarde, il ne l'atteint pas : ce sont les câblages de `src/lib/edition/`
	 * qui le déplacent, sur le nœud `#sauvegarde` et son texte `#sauvegarde-txt` —
	 * `poserLeTemoin()` pour l'enregistrement et le refus, `poserLeTemoinDeBrouillon()`
	 * pour la sauvegarde automatique locale de `RG-NF-02`. Les propriétés donnent
	 * l'état de DÉPART, celui du rendu au serveur, et rien d'autre.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-17.css` / `src/vues/V-18.css`. Les deux feuilles
	 * portent les mêmes règles pour ce bloc — c'est ce qui permet au composant
	 * d'être unique.
	 */
	import type { Snippet } from 'svelte';

	/** Les cinq positions de `#sauvegarde[data-etat]` — `V-17:2644-2650`. */
	export type EtatDeSauvegarde = 'vierge' | 'modifie' | 'encours' | 'enregistre' | 'erreur';

	interface Proprietes {
		/** La position du témoin de sauvegarde, telle que le gel la pose. */
		etat: EtatDeSauvegarde;
		/** Le libellé en clair, suffixe compris — « Enregistré · dernière version… ». */
		texte: string;
		/** Le bouton qui déplie les panneaux sous 980 px : « Métadonnées » ou « Référence ». */
		libelleMeta: string;
		/** Le contenu du bouton principal, fourni par la vue (styles en ligne). */
		enregistrer: Snippet;
	}

	const { etat, texte, libelleMeta, enregistrer }: Proprietes = $props();
</script>

<div class="barre-etat">
	<span class="sauvegarde" id="sauvegarde" data-etat={etat} role="status">
		<span class="sauvegarde__pastille"></span>
		<span id="sauvegarde-txt">{texte}</span>
	</span>
	<div class="barre-etat__actions">
		<button class="btn bouton-meta" id="ouvrir-meta" style="display:none">{libelleMeta}</button>
		<button class="btn" id="annuler">Annuler</button>
		<button class="btn si-redaction" id="previsualiser">Prévisualiser</button>
		<button class="btn btn--principal" id="enregistrer">{@render enregistrer()}</button>
	</div>
</div>
