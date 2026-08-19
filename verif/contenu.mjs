#!/usr/bin/env node
/**
 * LE LANCEUR DES COMMANDES DU FORMAT DE CONTENU (T-014).
 *
 * Il ne contient AUCUNE logique : tout est dans `src/lib/contenu/commandes.ts`,
 * du TypeScript typé strictement et contrôlé par `pnpm check`. Ce fichier ouvre
 * un serveur Vite pour exécuter le TypeScript du dépôt, imprime, et rend le
 * code de la commande — exactement le partage de `base/base.mjs` (T-003), pour
 * éviter un SECOND chemin de résolution de modules.
 *
 *   constructions   les quinze constructions de M04.6, ce que le gel en exerce
 *                   et ce que le rendu en produit
 *   invalide        les documents mal formés, et le refus que le schéma oppose
 *
 * Codes de retour : 0 si la commande prouve ce qu'elle annonce, 1 sinon.
 */
import { argv, exit } from 'node:process';

const [, , commande] = argv;

const USAGE = `
Usage : node verif/contenu.mjs <commande>

  constructions   les quinze constructions de M04.6 : exercice du gel et rendu
  invalide        les documents mal formés, et le refus opposé
`;

if (commande !== 'constructions' && commande !== 'invalide') {
	console.log(USAGE);
	exit(commande === undefined ? 1 : 0);
}

const { createServer } = await import('vite');
const vite = await createServer({
	server: { middlewareMode: true },
	appType: 'custom',
	logLevel: 'error'
});

/** @type {0 | 1} */
let code;
try {
	/** @type {import('../src/lib/contenu/commandes.ts')} */
	const C = await vite.ssrLoadModule('/src/lib/contenu/commandes.ts');
	const rapport = commande === 'constructions' ? C.rapportDesConstructions() : C.rapportDesRefus();
	console.log(rapport.texte);
	code = rapport.code;
} finally {
	await vite.close();
}

exit(code);
