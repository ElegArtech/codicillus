<script lang="ts">
	/**
	 * `/` — deux écrans pour une adresse : **V-01 Accueil public** sans session,
	 * **V-07 Accueil contributeur** avec session (`docs/routes.md:98-99`, matrice
	 * §5.5 « `/`, `/recherche` »).
	 *
	 * LOT T-031, « le câblage ». Avant lui, ce fichier rendait V-07 à tout le
	 * monde et lisait `seeds/corpus.ts` : mesuré sur le produit construit, `/`
	 * servait à un visiteur **anonyme** 28 974 octets portant le tableau de bord
	 * interne, trois des cinq noms de comptes semés — Karim Belhadj, Marc
	 * Ferreira, Sophie Nguyen — et **cinq titres de notes internes sur les
	 * vingt-six du corpus**, dont « Consignes d'astreinte — nuit et week-end ».
	 * Le même document, aujourd'hui, en porte zéro. La batterie 6 ne
	 * le voyait pas : elle compare des codes de statut, et §5.5 attend bien
	 * **200** sur `/` pour tous les personas. C'est le quatrième cas de la même
	 * famille qu'`ECART-047` É-1, et le seul que le chiffre de la batterie ne
	 * dénonce pas.
	 *
	 * `data.session` vient du chargeur, jamais du navigateur : `ADR-006` interdit
	 * « toute exposition des droits au navigateur pour qu'il compose
	 * l'interface ». Le client reçoit un booléen d'écran, pas un rôle.
	 *
	 * `vecteur={null}` demande à chaque vue son état par défaut, comme avant ce
	 * lot. LES ÉTATS DE PLANCHE NE SONT PAS PILOTÉS PAR LA DONNÉE, et ce n'est
	 * pas un oubli : « aucune note » est un état de vecteur de V-07, dont la
	 * phrase gelée affirme « Votre base ne contient encore aucune note »
	 * (`mockups/V-07-accueil-contributeur.html:3381`). Or un périmètre vide n'est
	 * pas une base vide — un compte sans droit explicite et sans rôle
	 * d'administrateur lit zéro note sur une base qui en porte trente-deux.
	 * Choisir cet état afficherait une affirmation fausse ; choisir l'état
	 * nominal affiche des comptes justes. Aucune planche ne montre « votre
	 * périmètre est vide » : le vide est remonté au rapport, pas comblé ici.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES NEUF SOURCES DE V-07, PASSÉES — et la dixième qui ne l'est pas
	 *
	 * `T-041` avait rendu les sources de V-07 OPTIONNELLES sans que rien ne les
	 * passe : l'écran affichait donc le jeu de semence. Elles arrivent
	 * désormais du chargeur, toutes bornées au périmètre autorisé. `instance` —
	 * la version et la dernière synchronisation du pied — reste la constante du
	 * jeu : la base n'en porte AUCUNE des deux, et
	 * `SANS_CONTREPARTIE_EN_BASE` le dit plutôt que ce fichier ne le taise.
	 *
	 * `ecriture` VIENT DU GABARIT, PAS DE LA VUE. `+layout.server.ts` calcule la
	 * capacité d'écriture EN BASE (`capaciteDEcriture`, deux projections sur les
	 * droits) ; V-07 la recevait jusqu'ici de son seul vecteur de planche, donc
	 * toujours vraie. `P-09` veut qu'une action interdite ne soit pas affichée
	 * — « ni grisée, ni masquée » —, et c'est ce booléen qui la retire.
	 *
	 * LE BANC NE PASSE JAMAIS PAR CE FICHIER : il atteint les vues par le mode de
	 * conception, qui rend le composant directement et compose lui-même son
	 * document. Les 409 couples sont mesurés hors de cette route.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES DEUX FEUILLES DE VUE, ET LA SEULE RÈGLE QUI SE CROISE
	 *
	 * Une route SvelteKit n'a qu'un fichier de page : les deux feuilles portées
	 * sont donc importées ensemble, et le document en reçoit les deux quelle que
	 * soit la branche. Le croisement a été MESURÉ, classe par classe, entre le
	 * balisage de chaque vue et les sélecteurs de l'autre feuille — pas supposé.
	 * Il tient en une déclaration :
	 *
	 *   `V-07.css:3` pose `.app { display: grid; grid-template-columns: … }`, et
	 *   la racine de V-01 est `div.public.app`. Les cinq autres sélecteurs de
	 *   `V-07.css` qui citent `.app` ne l'atteignent pas : trois exigent un
	 *   descendant que V-01 ne porte pas (`.rail`, `.si-peuple`, `.si-vide`), un
	 *   exige un attribut de rail que V-01 ne pose pas, et le sixième — celui du
	 *   `@media` de `V-07.css:437` — ne redéclare que la colonne de grille.
	 *   Dans l'autre sens, `V-01.css` ne croise le balisage de V-07 que par
	 *   `.chapeau .btn` et par `.app[data-etat="chargement"]` suivi de deux
	 *   classes d'état : `.chapeau`, et ces deux classes, sont absentes de V-07.
	 *   Son `body { background }` reprend la valeur du socle.
	 *
	 * L'ORDRE DES DEUX IMPORTS EST DONC PORTEUR, et c'est pourquoi il est écrit
	 * ici plutôt que laissé au hasard alphabétique : `V-01.css` vient EN SECOND,
	 * de sorte que son `.public { display: flex; flex-direction: column;
	 * min-height: 100vh }` — même spécificité, source postérieure — l'emporte sur
	 * le `.app` de V-07. Ne subsiste que `grid-template-columns`, inerte sur un
	 * conteneur en flux flexible. Aucune valeur de style n'est écrite ni modifiée
	 * ici : les deux feuilles restent identiques à l'octet à leur source gelée
	 * (P-6.3).
	 *
	 * L'alternative — un `<link>` conditionnel par branche — demande une adresse
	 * servie pour chaque feuille ; le suffixe de Vite qui la donne au mode de
	 * conception n'existe pas dans le produit construit, et celui qui existe dans
	 * le produit ne se sert pas en développement. Constat remonté au rapport du
	 * lot ; la mesure ci-dessus vaut pour les deux branches en l'état.
	 */
	import VuePublique from '../vues/V-01.svelte';
	import VueContributeur from '../vues/V-07.svelte';
	/* L'ordre compte — voir l'en-tête. V-07 d'abord, V-01 ensuite. */
	import '../vues/V-07.css';
	import '../vues/V-01.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

{#if data.session}
	<VueContributeur
		vecteur={null}
		notes={data.notes}
		compte={data.compte}
		univers={data.univers}
		domaines={data.domaines}
		mesures7j={data.mesures7j}
		mesures7jPrec={data.mesures7jPrec}
		modifications={data.modifications}
		activite={data.activite}
		revisions={data.revisions}
		ecriture={data.ecriture}
	/>
{:else}
	<VuePublique vecteur={null} notes={data.notes} />
{/if}
