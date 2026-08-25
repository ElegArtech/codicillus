import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

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
	// LES TYPES RESTENT AUTORISÉS. seeds/corpus.ts porte le vocabulaire de types
	// du domaine ; c'est sa valeur qui est de la démonstration, pas sa forme.
	// allowTypeImports est natif à la règle CŒUR d'ESLint 10 et n'exige aucune
	// information de type — elle marche donc aussi sous projectService: false.
	// La sémantique est en bloc : une déclaration qui mêle une valeur et un type
	// est refusée ENTIÈREMENT, il faut la scinder en deux lignes. C'est voulu.
	//
	// regex, PAS group : le matcher de group est un glob de type gitignore, qui
	// se comporte mal sur les spécificateurs relatifs remontant l'arborescence.
	// regex teste la chaîne source telle qu'elle est écrite.
	//
	// LA PORTÉE COMPTE AUTANT QUE LA RÈGLE. src/lib/** est là parce que six
	// modules de bibliothèque faisaient descendre le jeu jusque dans les vues
	// sans qu'une seule ligne de src/vues/** ne soit fautive. Sans ce troisième
	// chemin, la règle ne verrait que le symptôme.
	{
		files: ['src/vues/**', 'src/routes/**', 'src/lib/**'],
		ignores: [
			// Les unitaires ÉPROUVENT le jeu, ou s'en servent comme d'un échantillon
			// de forme réelle. C'est son emploi légitime.
			'src/**/*.test.ts',
			'src/**/*.test-utils.ts',
			// LES PLANCHES. V-41 est montée par /bibliotheque, dont les échantillons
			// SONT l'objet de la page ; V-37, V-38 et V-39 ne sont montées par aucune
			// route. Aucune des quatre n'est atteinte par un chemin de produit.
			'src/vues/V-37.svelte',
			'src/vues/V-38.svelte',
			'src/vues/V-39.svelte',
			'src/vues/V-41.svelte',
			// LA SEMENCE ET SES OUTILS. Charger le jeu en base est précisément leur
			// travail ; ils sont atteints par les commandes base:semer et
			// base:peupler, par aucune route.
			'src/lib/base/semence.ts',
			'src/lib/base/semence-organisation.ts',
			'src/lib/base/commandes.ts',
			'src/lib/base/demonstration.ts',
			// LA SONDE ET LA BATTERIE. documents-du-gel.ts et equivalence.ts
			// comparent le produit au jeu ; leurs seuls consommateurs sont des
			// unitaires.
			'src/lib/contenu/documents-du-gel.ts',
			'src/lib/donnees/equivalence.ts'
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '(^|/)seeds/',
							allowTypeImports: true,
							message:
								'Le jeu de démonstration ne descend pas dans le produit : une propriété dont le défaut est une constante de seeds/ fait servir la démonstration à toute route qui oublie la donnée, sans que rien ne proteste. Rendre la propriété requise, ou lui donner un état vide explicite — tableau vide, null, chaîne vide. Les types restent autorisés : les importer avec le mot-clé type, sur une ligne à eux.'
						}
					]
				}
			],
			// LA PORTE DE DERRIÈRE. Mesuré dans la règle installée : elle ne visite
			// que ImportDeclaration, ExportNamedDeclaration et ExportAllDeclaration.
			// Un import différé passerait donc au travers. Il ne peut pas être un
			// import de type, d'où l'absence d'exemption ici.
			'no-restricted-syntax': [
				'error',
				{
					selector: 'ImportExpression[source.type="Literal"][source.value=/(^|\\/)seeds\\//]',
					message:
						'Le jeu de démonstration ne descend pas dans le produit, pas même par un import différé. Rendre la propriété requise, ou lui donner un état vide explicite.'
				}
			]
		}
	}
);
