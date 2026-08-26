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
	import { onMount } from 'svelte';
	import VuePublique from '../../vues/V-02.svelte';
	import VueConnectee from '../../vues/V-08.svelte';
	import feuillePublique from '../../vues/V-02.css?url';
	import feuilleConnectee from '../../vues/V-08.css?url';
	import { cablerLesFacettes } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE CÂBLAGE S'ACCROCHE DEPUIS LA ROUTE — `ARB-063` —, et SEULEMENT SUR LA
	 * BRANCHE ANONYME : `#ouvrir-facettes` est le bouton de V-02, et V-08 porte
	 * sa propre commande. La racine est cherchée dans le document plutôt que liée
	 * par `bind:this` : la lier demanderait un nœud d'enveloppe que le gel ne
	 * porte pas.
	 */
	onMount(() => {
		if (data.session) return undefined;
		const racine = document.getElementById('app');
		return racine === null ? undefined : cablerLesFacettes(racine);
	});
</script>

<svelte:head>
	<link rel="stylesheet" href={data.session ? feuilleConnectee : feuillePublique} />
</svelte:head>

{#if data.session}
	<!--
		`tri` et `mode` ne vont QU'À LA VUE CONNECTÉE, et c'est le gel qui le
		décide : V-02 n'a ni sélecteur de tri, ni bascule de mode — le brief lui
		« supprime la bascule de mode » (`docs/routes.md:248`). Les lui passer
		reviendrait à lui donner un état qu'elle n'a aucun moyen de montrer.
	-->
	<!--
		`pistes` — LES PISTES DE REFORMULATION, ET ELLES VIENNENT DU CHARGEUR.
		Les deux vues en portaient d'écrites dans leurs maquettes, chacune ouvrant
		`/recherche?q=…` à zéro résultat. Le chargeur les compte sur le PÉRIMÈTRE
		LISIBLE — jamais sur le jeu de résultats, qui est vide dans l'état même où
		le bloc se rend. Aucune étiquette dans le périmètre : liste vide, et le
		bloc n'est pas rendu.
	-->
	<VueConnectee
		vecteur={data.vecteur}
		notes={data.notes}
		recherchees={data.recherchees}
		requete={data.requete}
		retenues={data.retenues}
		perimetre={data.perimetre}
		dureeMs={data.dureeMs}
		pistes={data.pistes}
		tri={data.tri}
		modeDemande={data.mode}
	/>
{:else}
	<!--
		`portail` est une donnée d'INSTANCE — la clé `portail_assistance` de la
		table `parametres`. V-08 ne porte aucun appel à l'assistance : elle ne va
		qu'à la vue publique.
	-->
	<!--
		`pistes` — LA MÊME SOURCE QUE POUR V-08, et le même chargeur la sert. V-02
		en portait cinq écrites dans sa maquette — « mot de passe », « accès »,
		« salle de réunion », « réseau », « support ». Le périmètre d'un anonyme
		étant celui des notes publiques, les étiquettes proposées ici sont celles
		que le visiteur peut effectivement atteindre.
	-->
	<!--
		`dureeMs` ATTEND V-02, ET LE CHARGEUR LA SERT DÉJÀ. V-02 affiche une durée
		FABRIQUÉE — `Math.max(0.06, 0 / 1000 + 0.18)`, dont le terme mesuré est nul
		par construction —, exactement comme V-08 le faisait. La mesure du moteur
		descend maintenant jusqu'ici par `data.dureeMs` ; il ne manque que la
		propriété du côté de la vue publique, et la ligne `dureeMs={data.dureeMs}`
		ci-dessous. La vue n'appartient pas à ce lot ; la donnée, elle, est prête.
	-->
	<VuePublique
		vecteur={data.vecteur}
		notes={data.notes}
		recherchees={data.recherchees}
		retenues={data.retenues}
		portail={data.portail}
		pistes={data.pistes}
	/>
{/if}
