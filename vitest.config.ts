import { defineConfig } from 'vitest/config';

// Batterie 3 du catalogue (PLAN-DE-REALISATION.md §5) : les unitaires.
// Configuration autonome : à ce stade les unitaires ne portent que sur des
// modules TypeScript. Le harnais de composants Svelte viendra avec les lots
// qui en écrivent.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		reporters: ['default']
	}
});
