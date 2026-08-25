/**
 * LE HARNAIS DE RENDU DES VUES — T-042, aligné sur T-041.
 *
 * POURQUOI IL NE SUFFIT PAS D'IMPORTER LE COMPOSANT. `vitest.config.ts` ne
 * monte AUCUN greffon Svelte, et c'est délibéré : la batterie 3 est la
 * batterie des unitaires, pas celle du rendu, et huit lots de la vague 1b
 * portent des contrôles de propriétés — chacun ajoutant le greffon à la
 * configuration commune la ferait diverger huit fois (le corollaire de P-24,
 * transposé aux fichiers de configuration partagés).
 *
 * LA PARADE EST UN SERVEUR VITE EN MODE INTERGICIEL : aucun port n'est ouvert,
 * aucun serveur de développement n'est laissé derrière (P-22), et la
 * compilation Svelte est celle du projet — le même chemin que le banc emprunte
 * par son mode de conception, jamais un second.
 *
 * LE COMPOSANT ET `render` VIENNENT DU MÊME GRAPHE, et c'est la condition sans
 * laquelle tout composant rend 500 : un `render` importé par vitest et un
 * composant chargé par le serveur appartiendraient à deux instances distinctes
 * du moteur de rendu. C'est le défaut qu'`ECART-013` É-1 a nommé, sous une
 * autre forme.
 *
 * CE FICHIER N'EST PAS UN TEST — son nom ne se termine pas par la marque que
 * `include` retient —, et il n'entre dans aucun produit : rien de `src/` ne
 * l'importe.
 */
import { createServer, type ViteDevServer } from 'vite';

let serveur: ViteDevServer | null = null;

/** Le serveur du harnais — un seul par fichier de test, arrêté à la fin. */
async function harnais(): Promise<ViteDevServer> {
	if (serveur === null) {
		serveur = await createServer({
			// LE SURVEILLANT NE DOIT PAS DESCENDRE DANS LES COPIES DE TRAVAIL. Il
			// parcourt toute la racine ; sous .claude/worktrees/ vivent des cases
			// complètes du dépôt, et les veilleurs de fichiers du système s'épuisent :
			// la série sort alors en ENOSPC, ses 1481 tests verts compris. Le
			// surveillant attend un prédicat, pas un motif : les jokers y sont inertes.
			server: {
				middlewareMode: true,
				watch: { ignored: (chemin: string) => chemin.includes('/.claude') }
			},
			appType: 'custom',
			logLevel: 'silent'
		});
	}
	return serveur;
}

/** À appeler en fin de fichier de test : sans quoi le processus ne rend pas la main. */
export async function fermerLeHarnais(): Promise<void> {
	if (serveur !== null) {
		await serveur.close();
		serveur = null;
	}
}

/**
 * Le rendu serveur d'une vue, propriétés comprises.
 *
 * @param vue L'identifiant de la vue — `V-14`, et rien d'autre.
 * @param proprietes Ce que le chargeur de route lui passerait.
 */
export async function rendreLaVue(
	vue: string,
	proprietes: Record<string, unknown>
): Promise<string> {
	const s = await harnais();
	const module = await s.ssrLoadModule(`/src/vues/${vue}.svelte`);
	const moteur = await s.ssrLoadModule('svelte/server');
	const rendu = (moteur as { render: (c: unknown, o: unknown) => { body: string } }).render(
		(module as { default: unknown }).default,
		{ props: proprietes }
	);
	return rendu.body;
}
