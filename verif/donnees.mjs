#!/usr/bin/env node
/**
 * verif:donnees — LA BATTERIE D'ÉQUIVALENCE « base ↔ seeds/corpus.ts ».
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
 * CE QU'ELLE PROUVE, ET CE QU'ELLE NE PROUVE PAS
 *
 * Elle prouve que la COUCHE DE LECTURE rend les formes de `seeds/corpus.ts`
 * telles que le fichier les exporte — la base ayant été semée depuis ce même
 * fichier. C'est la prémisse dont dépendent les huit lots de câblage : sans
 * elle, chacun devrait prouver sa fidélité écran par écran.
 *
 * Elle ne prouve RIEN sur le rendu. La conformité aux maquettes gelées reste
 * l'affaire de `pnpm verif:maquette`, et un vert ici n'en dit pas un mot.
 *
 * Elle ne prouve rien non plus sur les formes que la base NE PORTE PAS : elle
 * les compte et les nomme, et c'est tout ce qu'un instrument peut en faire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES, ET POURQUOI LEUR CODE EST INVERSÉ
 *
 * Un banc toujours vert ne prouve rien (RA-01). `--sonde=<genre>` perturbe le
 * CANDIDAT — ce que la couche de lecture rend —, jamais la référence.
 *
 *   --sonde=date-decalee    une date lue en heure locale au lieu d'UTC
 *   --sonde=optionnel-pose  un champ optionnel posé au lieu d'être omis
 *   --sonde=temoin-inerte   LA MUTATION QUI NE TOUCHE RIEN — refus de conclure
 *
 * L'inversion s'arrête au code 2 : quand la mutation n'a RIEN TOUCHÉ, elle ne
 * teste rien, et l'instrument refuse de conclure.
 *
 * Aucune logique n'est ici : tout est dans `src/lib/donnees/equivalence.ts`, du
 * TypeScript typé strictement et contrôlé par `pnpm check`. Ce fichier ouvre un
 * serveur Vite pour exécuter le TypeScript du dépôt, imprime, et rend le code —
 * exactement le partage de `verif/aller-retour.mjs` et de `base/base.mjs`, pour
 * éviter un SECOND chemin de résolution de modules.
 *
 * LA CONNEXION EST CELLE DE L'APPLICATION. `basePartagee()` de
 * `src/lib/base/acces.ts` est le seul groupe ouvert : mesurer sur une autre
 * connexion que celle du produit mesurerait autre chose.
 *
 * Usage :
 *   node verif/donnees.mjs                  la batterie
 *   node verif/donnees.mjs --sonde=<genre>  la preuve qu'elle sait dire non
 */
import { argv, exit } from 'node:process';

const args = argv.slice(2);
const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);

/* L'ENVIRONNEMENT EST LU AVANT TOUT LE RESTE, ET LES DEUX FICHIERS COMPTENT.
   `.env` porte les secrets de la composition ; `.env.local` porte le PORT de la
   copie de travail, et c'est `verif/preparer-copie.sh` qui l'y écrit. Ne lire
   que le premier fait mesurer le port d'une AUTRE copie — `T-076` É-2 l'a payé :
   sa batterie 6 est partie sur le port par défaut, occupé par le serveur du lot
   voisin et adossé à la base PARTAGÉE, et a rendu 140 défauts dont AUCUN
   n'existait. C'est `ECART-017` É-8, que `P-22` remesure à chaque lot. */
for (const fichier of ['.env', '.env.local']) {
	try {
		process.loadEnvFile(fichier);
	} catch {
		/* Absent : l'environnement du processus fait foi (`base/base.mjs`). */
	}
}

const { createServer } = await import('vite');
const vite = await createServer({
	server: { middlewareMode: true },
	appType: 'custom',
	logLevel: 'error'
});

/** @type {0 | 1} */
let code;
let acces;
try {
	/** @type {import('../src/lib/base/acces.ts')} */
	acces = await vite.ssrLoadModule('/src/lib/base/acces.ts');
	/** @type {import('../src/lib/donnees/equivalence.ts')} */
	const E = await vite.ssrLoadModule('/src/lib/donnees/equivalence.ts');

	const rapport = await E.rapportDEquivalence(acces.basePartagee(), sonde);
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
				? `  sonde ${sonde} : la batterie a dit non — code de retour inversé, 0.`
				: `  sonde ${sonde} : la batterie n’a rien vu — 1.`
		);
	}
} finally {
	if (acces !== undefined) await acces.fermerLaBasePartagee();
	await vite.close();
}

exit(code);
