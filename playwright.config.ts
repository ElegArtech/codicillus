import { defineConfig, devices } from '@playwright/test';

// Bout en bout — batteries 6 à 16 du catalogue (PLAN-DE-REALISATION.md §5).
// Le répertoire des scénarios est déclaré ici ; il est vide au lot T-002 et se
// remplit lot par lot. Chaque batterie reste rouge tant qu'elle n'est pas
// réellement outillée (voir `verif/jalon.mjs`).
export default defineConfig({
	testDir: 'verif/scenarios',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: process.env.CI ? 'list' : 'html',
	use: {
		// `URL_BASE` a été retiré de la configuration de base par ARB-050 : le nom est
		// libre, mais le réemployer ici pour une base HTTP recréerait l'homonymie
		// que T-012 É-13 signalait — deux sens pour un nom, dont l'un vient d'être aboli.
		baseURL: process.env.URL_BANC ?? 'http://localhost:4173',
		trace: 'on-first-retry',
		locale: 'fr-FR',
		timezoneId: 'Europe/Paris'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	}
});
