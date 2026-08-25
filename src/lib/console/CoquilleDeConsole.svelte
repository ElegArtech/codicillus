<script lang="ts">
	/**
	 * Console — l'enveloppe des pages de console, telle que le gel la pose.
	 *
	 * CE QUE CE FICHIER EST, ET CE QU'IL N'EST PAS. Il ne porte AUCUNE classe :
	 * les treize du motif commun sont déjà portées par `NavigationConsole.svelte`,
	 * `TeteDeSection.svelte` et les propriétés `classeEnveloppe` / `classeContenu`
	 * / `idContenu` du gabarit de coquille. Il porte l'APPEL — c'est-à-dire les
	 * seize propriétés que les dix maquettes de console passent à `Coquille`,
	 * identiques dans les dix, et dont une seule varie : la section courante.
	 *
	 * POURQUOI IL EXISTE. Le lot P-4 rend quatre vues (V-33 à V-36). Recopier
	 * quatre fois le même appel de vingt lignes créerait quatre sources de
	 * vérité pour une seule — exactement ce que `sections.ts` refuse pour le
	 * catalogue des sections, et `arborescence-abregee.ts` pour le rail des
	 * vingt-six vues abrégées.
	 *
	 * CE QUI EST MESURÉ, ET D'OÙ VIENT CHAQUE VALEUR :
	 *   `forme="abregee"`      — `node verif/releve-vues.mjs --formes` : V-28 à
	 *                            V-36 sont de la forme abrégée ; V-27 non.
	 *   `classeEnveloppe`      — `div.console`, les dix vues (ARB-023,
	 *                            `ECART-024`).
	 *   `avantContenu`         — `aside.nav2[aria-label="Sections de la console"]`,
	 *                            IDENTIQUE À L'OCTET dans les dix maquettes.
	 *   `classeContenu` / `idContenu` — `main.travail#travail`, les dix.
	 *   `cibleEvitement` / `libelleEvitement` — `#travail`, « Aller au contenu » :
	 *                            ce sont les défauts du gabarit, donc non passés.
	 *   `fil`                  — `["Accueil", "Console", <nom de la section>]`,
	 *                            par `filDeConsole()` de `sections.ts`.
	 *   `rail="ouvert"` `role="admin"` — `div.app[data-rail][data-role]` des dix.
	 *   `droits`               — ABSENT du gel des dix : le gabarit n'écrit alors
	 *                            pas `data-droits`, et c'est ce que la maquette
	 *                            montre. Rien n'est passé.
	 *
	 * LE NOM DE LA SECTION N'EST PAS RECOPIÉ : il est lu au catalogue de
	 * `sections.ts`, seule source. Le fil du gel — « Configuration »,
	 * « Analytique », « Imports », « Exports » — est exactement `section.nom`.
	 *
	 * AUCUN COMPORTEMENT, AUCUNE MINUTERIE (ARB-011). AUCUNE RÈGLE DE STYLE,
	 * AUCUN ATTRIBUT `style` : ce composant ne vit pas sous `src/vues/` et n'a
	 * donc pas la dérogation P-6.4 d'ARB-016.
	 */
	import type { Snippet } from 'svelte';
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../../seeds/corpus';
	import Coquille from '../coquille/Coquille.svelte';
	import NavigationConsole from './NavigationConsole.svelte';
	import { filDeConsole, nomDeSection, type CleDeSection } from './sections';
	import { vocabulaireRendu } from '$lib/vocabulaire';

	interface Proprietes {
		/** La section rendue — elle porte `aria-current="page"` et clôt le fil. */
		section: CleDeSection;
		/** Le jeu de semence de la vue — `corpusPourVue('V-xx')`. */
		notes: readonly Note[];
		/**
		 * LES QUATRE SOURCES DE LA COQUILLE, TOUTES FACULTATIVES. Absentes, la
		 * constante du jeu de semence s'applique — c'est ce défaut qui garantit
		 * que les vues qui ne les passent pas rendent exactement ce qu'elles
		 * rendaient. Une vue branchée sur la base les passe, et rien d'autre ne
		 * change (T-044).
		 */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: UtilisateurCourant;
		instance?: EtatDInstance;
		/** Les attributs de données que la vue pose sur `div.app` (ARB-021, A-2). */
		donnees?: Record<string, string | undefined>;
		/**
		 * Un nœud rendu hors de `div.app`, entre elle et `div.notifs` (A-4).
		 * Une seule des quatre pages en porte un : `dialog#dlg-rapport` de V-35.
		 * Il est réémis dans un fragment TOUJOURS fourni au gabarit — passer
		 * `undefined` à une propriété facultative est refusé par
		 * `exactOptionalPropertyTypes`, et un fragment vide ne rend aucun nœud.
		 */
		superposition?: Snippet;
		/** Le corps de `main.travail#travail`. Aucune des dix vues n'en manque. */
		enfants: Snippet;
	}

	const {
		section,
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		donnees,
		superposition: superpositionDeVue,
		enfants
	}: Proprietes = $props();

	/**
	 * Le nom de la section, au catalogue — jamais recopié dans la vue.
	 *
	 * Le catalogue est devenu une FONCTION DE SON VOCABULAIRE : « Types de
	 * fiches » porte le terme renommable de `M14.7`, et le figer à l'import
	 * rendait le renommage inopérant. Le mot descend par le contexte de coquille.
	 */
	const mots = vocabulaireRendu();
	const nom = $derived(nomDeSection(section, mots));
</script>

<Coquille
	fil={filDeConsole(nom)}
	courant={[]}
	{univers}
	{domaines}
	{notes}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
	rail="ouvert"
	role="admin"
	forme="abregee"
	donnees={donnees ?? {}}
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	{enfants}
>
	{#snippet avantContenu()}<NavigationConsole
			courante={section}
		/>{/snippet}{#snippet superposition()}{#if superpositionDeVue}{@render superpositionDeVue()}{/if}{/snippet}
</Coquille>
