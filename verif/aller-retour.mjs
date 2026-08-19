#!/usr/bin/env node
/**
 * test:aller-retour — BATTERIE 4 du catalogue (PLAN-DE-REALISATION.md §5).
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie NI ce script, NI la règle qu'il
 * applique. La seule sortie légitime d'un rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL PROUVE, ET CE QU'IL NE PROUVE PAS
 *
 * Il prouve l'IDENTITÉ de l'aller-retour : pour tout document du corpus,
 * sérialiser puis désérialiser redonne le document d'origine. C'est la
 * propriété que RG-M13-01 (CDC l. 1113) appelle « le critère de réussite
 * principal », et qu'ADR-004 nomme « la batterie nominale de cet ADR ».
 *
 * Il ne prouve RIEN sur l'UNICITÉ du convertisseur — ADR-004 le dit lui-même :
 * la batterie 4 « prouve la propriété, pas l'unicité ». L'unicité est mesurée
 * par `pnpm verif:convertisseur` (ARB-051), batterie propre et distincte.
 *
 * Aucune logique n'est ici : tout est dans `src/lib/contenu/aller-retour.ts`,
 * du TypeScript typé strictement et contrôlé par `pnpm check`. Ce fichier ouvre
 * un serveur Vite pour exécuter le TypeScript du dépôt, imprime, et rend le
 * code — exactement le partage de `verif/contenu.mjs` (T-014) et de
 * `base/base.mjs` (T-003), pour éviter un SECOND chemin de résolution de
 * modules.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX SONDES, ET POURQUOI LEUR CODE EST INVERSÉ
 *
 * Un banc toujours vert ne prouve rien (RA-01). `--sonde=<genre>` perturbe le
 * CANDIDAT — le convertisseur —, jamais la mesure, et exige que la batterie
 * rougisse : le code de retour est alors inversé.
 *
 *   --sonde=marque-perdue    une marque perdue à la SÉRIALISATION
 *   --sonde=attribut-perdu   un attribut perdu à la DÉSÉRIALISATION
 *
 * L'inversion s'arrête au code 2 : quand la mutation n'a RIEN TOUCHÉ, elle ne
 * teste rien, et l'instrument refuse de conclure. Inverser ce cas fabriquerait
 * un vert à partir d'une sonde inerte — le défaut même qu'ARB-013 a laissé
 * courir huit lots.
 *
 * Usage :
 *   node verif/aller-retour.mjs                 la batterie
 *   node verif/aller-retour.mjs --sonde=<genre> la preuve qu'elle sait dire non
 *   node verif/aller-retour.mjs --markdown      le Markdown produit, à lire
 */
import { argv, exit } from 'node:process';

const args = argv.slice(2);
const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);
const montrer = args.includes('--markdown');

const { createServer } = await import('vite');
const vite = await createServer({
	server: { middlewareMode: true },
	appType: 'custom',
	logLevel: 'error'
});

/** @type {0 | 1} */
let code;
try {
	/** @type {import('../src/lib/contenu/aller-retour.ts')} */
	const A = await vite.ssrLoadModule('/src/lib/contenu/aller-retour.ts');
	if (montrer) {
		console.log(A.markdownDesCas());
		code = 0;
	} else {
		const rapport = A.rapportDAllerRetour(sonde);
		console.log(rapport.texte);
		if (sonde === undefined) {
			code = rapport.code === 0 ? 0 : 1;
		} else if (rapport.code === 2) {
			/* Refus de conclure : jamais inversé. */
			code = 1;
		} else {
			code = rapport.code === 1 ? 0 : 1;
			console.log(
				rapport.code === 1
					? '  sonde ' + sonde + ' : la batterie a dit non — code de retour inversé, 0.'
					: '  sonde ' + sonde + ' : la batterie n’a rien vu — 1.'
			);
		}
	}
} finally {
	await vite.close();
}

exit(code);
