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
			'guide/',
			'verif/references/'
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
		files: ['verif/**/*.svelte'],
		languageOptions: {
			parserOptions: {
				projectService: false,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
