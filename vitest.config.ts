import { defineConfig } from 'vitest/config';

// Batterie 3 du catalogue (PLAN-DE-REALISATION.md §5) : les unitaires.
// Configuration autonome : à ce stade les unitaires ne portent que sur des
// modules TypeScript. Le harnais de composants Svelte viendra avec les lots
// qui en écrivent.
export default defineConfig({
	test: {
		environment: 'node',
		// `seeds/` porte la preuve d'emboîtement du jeu de semence (T-005, §3.6).
		include: ['src/**/*.test.ts', 'seeds/**/*.test.ts'],
		reporters: ['default']
	}
});
