import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const IMPORT_DU_JEU = {
	regex: '(^|/)seeds/',
	allowTypeImports: true,
	message:
		'Le jeu de démonstration ne descend pas dans le produit : une propriété dont le défaut est une constante de seeds/ fait servir la démonstration à toute route qui oublie la donnée, sans que rien ne proteste. Rendre la propriété requise, ou lui donner un état vide explicite — tableau vide, null, chaîne vide. Les types restent autorisés : les importer avec le mot-clé type, sur une ligne à eux.'
};
const IMPORT_DE_LA_SEMENCE = {
	regex: '(^|/)semence$',
	allowTypeImports: true,
	message:
		"Le module de semence importe le jeu de démonstration en valeur, et six de ses fonctions le prennent en argument par défaut : lui emprunter une fonction fait descendre le jeu dans le produit sans qu'aucun import ne nomme seeds. Prendre la fonction ailleurs, ou la déplacer hors de la semence."
};
export default ts.config(
	{
		ignores: ['.svelte-kit/', 'build/', 'dist/', 'node_modules/', '.local/', '.codex/']
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
	{
		files: ['src/vues/**', 'src/routes/**', 'src/lib/**'],
		ignores: [
			'src/**/*.test.ts',
			'src/**/*.test-utils.ts',
			'src/vues/V-37.svelte',
			'src/vues/V-38.svelte',
			'src/vues/V-39.svelte',
			'src/lib/base/semence.ts',
			'src/lib/base/semence-organisation.ts',
			'src/lib/base/commandes.ts',
			'src/lib/base/demonstration.ts',
			'src/lib/base/conformite.ts',
			'src/lib/contenu/documents-du-gel.ts',
			'src/lib/donnees/equivalence.ts'
		],
		rules: {
			'no-restricted-imports': ['error', { patterns: [IMPORT_DU_JEU, IMPORT_DE_LA_SEMENCE] }]
		}
	}
);
