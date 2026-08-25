import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts', 'seeds/**/*.test.ts'],
		reporters: ['default'],
		/* LE BUDGET PAR TEST N'EST PAS CELUI D'UN UNITAIRE ORDINAIRE. Les contrôles
		   de `src/vues/` montent chacun leur propre serveur Vite en mode intergiciel
		   (`harnais.test-utils.ts`) : le premier rendu d'un fichier paie ce démarrage
		   à froid. Seul, il coûte deux secondes ; les soixante et un fichiers lancés
		   de front, il dépasse les 5 000 ms que vitest accorde par défaut, et la
		   série sort rouge sur des tests qui passent tous en isolation. Le défaut
		   mesuré était la CHARGE, jamais la vue : on élargit le budget, on ne touche
		   à aucune assertion. */
		testTimeout: 30000,
		hookTimeout: 30000
	}
});
