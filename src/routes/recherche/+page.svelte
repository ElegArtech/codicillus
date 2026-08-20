<script lang="ts">
	/**
	 * `/recherche` — **V-02 Recherche publique** sans session, **V-08 Recherche**
	 * avec session (`docs/routes.md` §3.1, matrice §5.5 ligne « `/`,
	 * `/recherche` »).
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur et les notes viennent de `+page.server.ts`, qui porte le
	 * périmètre, les droits et la déclaration d'indisponibilité du mode « Sens ».
	 *
	 * `recherchees` EST CE QUI DISTINGUE LE PRODUIT DE LA PLANCHE, et c'est ici
	 * qu'il se pose. Les deux vues savent rendre un état de maquette — elles
	 * cherchent alors elles-mêmes dans le jeu de semence, comme le gel — et le
	 * PRODUIT — le jeu reçu est le résultat de l'index, dans l'ordre du moteur,
	 * et la vue ne fait plus que le rendre. Aucune autre source ne pose cette
	 * propriété : le rendu direct d'un composant, lui, ne la passe pas.
	 *
	 * `requete`, `retenues` et `perimetre` complètent le branchement :
	 * `RG-M02-06` veut l'état de la recherche porté par l'adresse, et c'est le
	 * chargeur — seul lecteur de `url` — qui l'en extrait. V-02 n'en reçoit que
	 * `retenues` : sa requête lui vient de l'axe `req` de son vecteur, comme sa
	 * planche le déclare, et son affluence n'est pas une notion de sa maquette.
	 *
	 * `data.session` vient du chargeur, jamais du navigateur : `ADR-006` interdit
	 * « toute exposition des droits au navigateur pour qu'il compose
	 * l'interface ». Le client reçoit un booléen d'écran, pas un rôle.
	 *
	 * LE BANC NE PASSE JAMAIS PAR CE FICHIER : il atteint les vues par le mode de
	 * conception, qui rend le composant directement et compose lui-même son
	 * document. Les 409 couples sont mesurés hors de cette route.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * POURQUOI UNE SEULE FEUILLE EST LIÉE, ET POURQUOI PAR LA TÊTE DU DOCUMENT
	 *
	 * Le chargeur de `/` importe SES DEUX feuilles ensemble et documente le seul
	 * croisement mesuré. **Ici, le croisement est massif**, et il a été mesuré
	 * avant d'écrire une ligne, sélecteur par sélecteur, entre chaque feuille et
	 * le balisage de l'autre vue :
	 *
	 *   `V-02.css` atteint **47 règles** du balisage de V-08 ;
	 *   `V-08.css` atteint **51 règles** du balisage de V-02, dont `.app`,
	 *   `.facettes`, `.carte`, `.resultats` et `.app[data-etat="chargement"]
	 *   .si-nominal` — V-02 pose bien `data-etat` sur sa racine `div.public.app`.
	 *
	 * Les deux vues partagent leurs noms de classe parce que **V-02 est V-08
	 * amputée** (`V-02:1125`), et 131 sélecteurs de `V-08.css` n'existent pas
	 * dans `V-02.css`. Lier les deux feuilles ferait donc peindre l'écran public
	 * par la feuille de l'écran connecté, sans qu'aucune batterie ne le voie —
	 * le banc n'attaque pas les routes.
	 *
	 * La feuille est donc liée **conditionnellement**, par l'adresse que Vite
	 * émet pour elle, dans `<svelte:head>`. C'est le canal que `P-19` désigne :
	 * « le canal qui atteint le document est `<svelte:head>` ». Aucune valeur de
	 * style n'est écrite ici, et les deux feuilles restent identiques à l'octet à
	 * leur source gelée (P-6.3) — elles ne sont pas éditées, seulement liées.
	 */
	import VuePublique from '../../vues/V-02.svelte';
	import VueConnectee from '../../vues/V-08.svelte';
	import feuillePublique from '../../vues/V-02.css?url';
	import feuilleConnectee from '../../vues/V-08.css?url';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<link rel="stylesheet" href={data.session ? feuilleConnectee : feuillePublique} />
</svelte:head>

{#if data.session}
	<VueConnectee
		vecteur={data.vecteur}
		notes={data.notes}
		recherchees={data.recherchees}
		requete={data.requete}
		retenues={data.retenues}
		perimetre={data.perimetre}
	/>
{:else}
	<VuePublique
		vecteur={data.vecteur}
		notes={data.notes}
		recherchees={data.recherchees}
		retenues={data.retenues}
	/>
{/if}
