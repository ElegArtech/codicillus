import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

// LE JEU DE DÉMONSTRATION NE DESCEND PAS DANS LE PRODUIT — les deux motifs
// interdits. Ils sont déclarés ici, une seule fois, parce que deux portées les
// emploient : une recopie divergerait sans qu'aucun outil ne le voie.
//
// LES TYPES RESTENT AUTORISÉS. `seeds/corpus.ts` porte 46 types du domaine ;
// c'est sa valeur qui est de la démonstration, pas sa forme. `allowTypeImports`
// est natif à la règle CŒUR d'ESLint 10 et n'exige aucune information de type —
// elle marche donc aussi sous `projectService: false`. La sémantique est en
// bloc : une déclaration qui mêle une valeur et un type est refusée
// ENTIÈREMENT, il faut la scinder en deux lignes. C'est voulu.
//
// `regex`, PAS `group` : le matcher de `group` est un glob de type gitignore,
// qui se comporte mal sur les spécificateurs relatifs remontant
// l'arborescence. `regex` teste la chaîne source telle qu'elle est écrite.

const IMPORT_DU_JEU = {
	regex: '(^|/)seeds/',
	allowTypeImports: true,
	message:
		'Le jeu de démonstration ne descend pas dans le produit : une propriété dont le défaut est une constante de seeds/ fait servir la démonstration à toute route qui oublie la donnée, sans que rien ne proteste. Rendre la propriété requise, ou lui donner un état vide explicite — tableau vide, null, chaîne vide. Les types restent autorisés : les importer avec le mot-clé type, sur une ligne à eux.'
};

// LA MÊME DESCENTE, PAR UN NOM QUI NE DIT PAS `seeds`. `src/lib/base/semence.ts`
// est exempté ci-dessous parce que charger le jeu en base est son travail — mais
// il importe CORPUS EN VALEUR (`:69`) et six de ses fonctions le prennent en
// ARGUMENT PAR DÉFAUT : `lignesDeDossier` (`:418`), `lignesDEtiquette` (`:624`),
// `lignesDeNote` (`:629`), `lignesDeVersion` (`:698`), `verifierFraicheur`
// (`:777`), `verifierUniversDesNotes` (`:801`). Lui emprunter une fonction, c'est
// le motif de la campagne intact, sous un autre nom.
const IMPORT_DE_LA_SEMENCE = {
	regex: '(^|/)semence$',
	allowTypeImports: true,
	message:
		"Le module de semence importe le jeu de démonstration en valeur, et six de ses fonctions le prennent en argument par défaut : lui emprunter une fonction fait descendre le jeu dans le produit sans qu'aucun import ne nomme seeds. Prendre la fonction ailleurs, ou la déplacer hors de la semence."
};

// Style et conventions — batterie 1 (`pnpm check`).
export default ts.config(
	{
		ignores: [
			'.svelte-kit/',
			'build/',
			'dist/',
			'node_modules/',
			/* `.claude/` PORTE LES COPIES DE TRAVAIL DE L'OUTILLAGE AGENTIQUE, et
			   `.gitignore` les exclut déjà — mais eslint ne lit pas `.gitignore`.
			   Sans cette ligne, un agent doté d'une copie interne fait rendre à
			   `pnpm check` des centaines d'erreurs « No tsconfigRootDir was set, and
			   multiple candidate TSConfigRootDirs are present » : le dépôt entier relu
			   une seconde fois sous une racine ambiguë. FAUX ROUGE, intermittent, et
			   sans rapport avec le moindre livrable. Voir P-25. */
			'.claude/',
			'cadrage/',
			'mockups/',
			/* LE PAQUET DE REFONTE — un prototype de conception livré en HTML et
			   ses scripts d'exécution, lus comme référence visuelle et jamais
			   exécutés par le produit. Les relire aux règles du dépôt rend
			   vingt-deux erreurs sur du code qui n'est pas le nôtre, et qu'on ne
			   corrigera pas : c'est la source gelée, comme `mockups/`. */
			'design_handoff_refonte_codicillus/',
			'règles/',
			'guide/'
		]
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	// Les composants d'INSTRUMENT — `verif/banc/CorpsEtalon.svelte`, qui fait
	// traverser `render()` au corps de la maquette gelée pour étalonner le régime
	// `app` par son chemin réel (ÉCART-013 É-1). Ils vivent dans `verif/`, donc
	// hors du graphe applicatif et hors de l'`include` que SvelteKit produit :
	// le service de projet n'a pas de programme TypeScript où les ranger. Ils
	// restent lintés, sans les règles typées — dont aucune n'est active ici.
	{
		languageOptions: {
			parserOptions: {
				projectService: false,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	// LE JEU DE DÉMONSTRATION NE DESCEND PAS DANS LE PRODUIT.
	//
	// Le motif que cette règle supprime : une propriété optionnelle dont la
	// valeur par défaut est une constante de seeds/. Une route qui oublie de
	// passer la donnée sert alors la démonstration — « Restaurer une sauvegarde
	// PostgreSQL », « Infrastructure », « Karim Belhadj » — et rien ne proteste :
	// ni le compilateur, ni un test, ni l'écran. Seule l'ouverture d'une page sur
	// une base vide le révèle. Quatre campagnes ont couru après ses symptômes.
	//
	// Le remède est en deux temps, et cette règle est le second : une propriété
	// que toutes les routes passent déjà devient REQUISE (strict et
	// exactOptionalPropertyTypes sont actifs, svelte-check est dans `pnpm check`
	// — une route qui l'oublierait ne compilerait plus) ; une propriété qui peut
	// légitimement manquer reçoit un état vide explicite, jamais une donnée. La
	// règle rend le retour en arrière impossible.
	//
	// LA PORTÉE COMPTE AUTANT QUE LA RÈGLE. `src/lib/**` est là parce que six
	// modules de bibliothèque faisaient descendre le jeu jusque dans les vues
	// sans qu'une seule ligne de `src/vues/**` ne soit fautive. Sans ce troisième
	// chemin, la règle ne verrait que le symptôme.
	{
		files: ['src/vues/**', 'src/routes/**', 'src/lib/**'],
		ignores: [
			// Les unitaires ÉPROUVENT le jeu, ou s'en servent comme d'un échantillon
			// de forme réelle. C'est son emploi légitime.
			'src/**/*.test.ts',
			'src/**/*.test-utils.ts',
			// LES PLANCHES QUE NULLE ROUTE NE MONTE. V-37, V-38 et V-39 ne sont
			// atteintes par aucun chemin de produit : leur contenu ne part dans
			// aucun paquet servi.
			//
			// V-41 N'EST PLUS DE CELLES-LÀ, et son exemption est retirée. Elle est
			// montée par `/bibliotheque` — une page RÉELLE, et c'est délibéré
			// (`STACK-TECHNIQUE.md` §4.1, risque `R-06`) —, si bien que son import
			// du corpus EN VALEUR faisait partir les trente-deux notes du jeu dans
			// un chunk de 57 Ko servi comme fichier statique. L'exemption couvrait
			// le seul fichier où le motif coûtait vraiment quelque chose. Ses sept
			// sources sont désormais exigées et servies par le chargeur ; il ne
			// reste que des imports de type, que la règle autorise partout.
			'src/vues/V-37.svelte',
			'src/vues/V-38.svelte',
			'src/vues/V-39.svelte',
			// LA SEMENCE ET SES OUTILS — charger le jeu en base est leur travail.
			//
			// `commandes.ts` et `demonstration.ts` ne sont chargés que par les
			// commandes en ligne (`base/base.mjs:70` et `:263`,
			// `recherche/recherche.mjs:55`, par `ssrLoadModule`) : aucune route ne les
			// atteint. `semence-organisation.ts` n'importe rien de `seeds/` — son
			// exemption est inerte, elle est gardée telle que l'inventaire la pose.
			//
			// `semence.ts` n'est plus atteinte par aucune route : `corpsVide()` en est
			// sortie pour `src/lib/contenu/corps-vide.ts`, et avec elle les 85 Ko du
			// jeu que dix nœuds du paquet serveur portaient.
			'src/lib/base/semence.ts',
			'src/lib/base/semence-organisation.ts',
			'src/lib/base/commandes.ts',
			'src/lib/base/demonstration.ts',
			// `conformite.ts` est le troisième chargeur, et le même argument le couvre :
			// seule la commande `base/base.mjs conformite` le charge, par `ssrLoadModule`.
			// Aucune route ne l'atteint, donc le jeu du prototype ne part dans aucun paquet.
			'src/lib/base/conformite.ts',
			// LA SONDE ET LA BATTERIE. `documents-du-gel.ts` et `equivalence.ts`
			// comparent le produit au jeu. `equivalence.ts` n'est importé que par
			// `equivalence.test.ts` ; `documents-du-gel.ts` ne l'est que par
			// `contenu/commandes.ts` et `contenu/aller-retour.ts`, dont les seuls
			// consommateurs sont eux-mêmes des unitaires. Aucune route ne les atteint.
			'src/lib/contenu/documents-du-gel.ts',
			'src/lib/donnees/equivalence.ts'
		],
		rules: {
			'no-restricted-imports': ['error', { patterns: [IMPORT_DU_JEU, IMPORT_DE_LA_SEMENCE] }]
		}
	}
);
