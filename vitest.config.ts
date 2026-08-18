import { defineConfig } from 'vitest/config';

// Batterie 3 du catalogue (PLAN-DE-REALISATION.md §5) : les unitaires.
// Configuration autonome : à ce stade les unitaires ne portent que sur des
// modules TypeScript. Le harnais de composants Svelte viendra avec les lots
// qui en écrivent.
export default defineConfig({
	test: {
		environment: 'node',
		// `seeds/` porte la preuve d'emboîtement du jeu de semence (T-005, §3.6).
		// `verif/` porte les unitaires des instruments de mesure eux-mêmes : le
		// banc de comparaison visuelle doit prouver qu'il sait dire non (T-007).
		include: ['src/**/*.test.ts', 'seeds/**/*.test.ts', 'verif/**/*.test.ts'],
		reporters: ['default']
	}
});
