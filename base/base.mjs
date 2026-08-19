#!/usr/bin/env node
/**
 * LE LANCEUR DES COMMANDES DE BASE.
 *
 * Il ne contient AUCUNE logique : tout est dans `src/lib/base/commandes.ts`,
 * qui est du TypeScript typé strictement et contrôlé par `pnpm check`. Ce
 * fichier ne fait que trois choses — charger `.env`, ouvrir un serveur Vite
 * pour exécuter le TypeScript du dépôt, et imprimer.
 *
 * POURQUOI VITE ET PAS UN EXÉCUTEUR TYPESCRIPT. C'est le chemin déjà employé
 * par le banc de comparaison (`verif/maquette.mjs`, `verif/banc/mode-demo.mjs`
 * chargent `/seeds/corpus.ts` par `ssrLoadModule`). Le réemployer évite une
 * dépendance de plus, et surtout évite un SECOND chemin de résolution de
 * modules dans le dépôt — deux chemins finissent toujours par diverger sur un
 * cas limite, et la divergence se paie au lot suivant.
 *
 * Codes de retour : 0 si la commande a prouvé ce qu'elle annonce, 1 sinon.
 * Aucune commande n'imprime de mot de passe (voir `connexionLisible`).
 */
import { argv, exit } from 'node:process';

const [, , commande, ...arguments_] = argv;

const USAGE = `
Usage : node base/base.mjs <commande>

  migrer            applique les migrations en attente
  annuler [n|tout]  annule les n dernières migrations (1 par défaut)
  etat              liste les migrations, appliquées ou non
  empreinte [--lignes]  imprime l'empreinte structurelle du schéma
  reversibilite     monte, descend, remonte, et compare les empreintes
  semer             charge seeds/corpus.ts dans la base
  unicite           joue les sondes d'unicité (refus ET acceptations)
  coherence         compare src/lib/base/schema.ts au catalogue de la base
`;

try {
	process.loadEnvFile('.env');
} catch {
	/* Pas de `.env` : l'environnement du processus fait foi. */
}

if (commande === undefined || commande === '--aide' || commande === '-h') {
	console.log(USAGE);
	exit(commande === undefined ? 1 : 0);
}

const { createServer } = await import('vite');
const vite = await createServer({
	server: { middlewareMode: true },
	appType: 'custom',
	logLevel: 'error'
});

/** @type {import('../src/lib/base/commandes.ts')} */
const B = await vite.ssrLoadModule('/src/lib/base/commandes.ts');

const session = B.ouvrir(process.env);
console.log(`base : ${session.lisible}`);

let code = 0;

/** Imprime un tableau simple, sans dépendance. */
const ligne = (gauche, droite) => console.log(`  ${gauche.padEnd(58)} ${droite}`);

try {
	switch (commande) {
		case 'migrer': {
			const posees = await B.migrer(session.pool);
			if (posees.length === 0) console.log('aucune migration en attente.');
			for (const nom of posees) ligne(nom, 'appliquée');
			break;
		}

		case 'annuler': {
			const combien =
				arguments_[0] === 'tout' || arguments_[0] === '--tout'
					? Number.MAX_SAFE_INTEGER
					: Number(arguments_[0] ?? 1);
			const annulees = await B.annuler(session.pool, combien);
			if (annulees.length === 0) console.log('aucune migration à annuler.');
			for (const nom of annulees) ligne(nom, 'annulée');
			break;
		}

		case 'etat': {
			const migrations = await B.lireLesMigrations();
			const appliquees = new Set(await B.migrationsAppliquees(session.pool));
			for (const m of migrations) ligne(m.nom, appliquees.has(m.nom) ? 'appliquée' : 'en attente');
			for (const nom of appliquees) {
				if (!migrations.some((m) => m.nom === nom)) {
					ligne(nom, 'APPLIQUÉE SANS FICHIER');
					code = 1;
				}
			}
			break;
		}

		case 'empreinte': {
			const e = await B.empreinte(session.pool);
			if (arguments_.includes('--lignes')) for (const l of e.lignes) console.log(`  ${l}`);
			console.log(`empreinte : ${e.somme}  (${e.lignes.length} lignes de catalogue)`);
			break;
		}

		case 'reversibilite': {
			console.log('AVERTISSEMENT — cette commande vide la base : elle descend tout, puis remonte.');
			await B.migrer(session.pool);
			const pleine = await B.empreinte(session.pool);
			ligne('1. montée complète', `${pleine.somme.slice(0, 16)}… (${pleine.lignes.length} lignes)`);

			const annulees = await B.annuler(session.pool, Number.MAX_SAFE_INTEGER);
			const vide = await B.empreinte(session.pool);
			ligne(
				`2. descente complète (${annulees.length} migrations)`,
				`${vide.somme.slice(0, 16)}… (${vide.lignes.length} lignes)`
			);

			const reposees = await B.migrer(session.pool);
			const rejouee = await B.empreinte(session.pool);
			ligne(
				`3. remontée (${reposees.length} migrations)`,
				`${rejouee.somme.slice(0, 16)}… (${rejouee.lignes.length} lignes)`
			);

			console.log('');
			if (vide.lignes.length !== 0) {
				console.log(`ÉCHEC — la descente laisse ${vide.lignes.length} objets derrière elle :`);
				for (const l of vide.lignes) console.log(`    ${l}`);
				code = 1;
			} else {
				console.log('la descente ne laisse aucun objet : le schéma public est vide.');
			}
			if (pleine.somme !== rejouee.somme) {
				console.log('ÉCHEC — la remontée ne redonne pas la même base.');
				const avant = new Set(pleine.lignes);
				const apres = new Set(rejouee.lignes);
				for (const l of pleine.lignes) if (!apres.has(l)) console.log(`    perdu  : ${l}`);
				for (const l of rejouee.lignes) if (!avant.has(l)) console.log(`    apparu : ${l}`);
				code = 1;
			} else {
				console.log(`monter, descendre, remonter : empreinte identique — ${pleine.somme}`);
			}
			break;
		}

		case 'semer': {
			const rapport = await B.semer(session);
			for (const [quoi, combien] of Object.entries(rapport)) ligne(quoi, String(combien));
			console.log('');
			console.log('CE QUE CE CHARGEMENT NE COUVRE PAS — exports de seeds/corpus.ts sans table :');
			for (const quoi of [
				'VERSIONS, CONTENU_VERSIONS  (M07, hors du périmètre §3)',
				'ACTIVITE, MESURES_7J, MESURES_7J_PREC, MODIFICATIONS  (M01/M15, agrégats)',
				'LOT_IMPORT, JOURNAL_IMPORTS, FORMATS_IMPORT  (M12)',
				'DISTINCTIONS, CONTRIBUTIONS, RECHERCHES  (M15/M16)',
				'MOI, INSTANCE  (état de session et d’instance)',
				'IDS_PAR_VARIANTE, VUES_PAR_VARIANTE  (outillage du banc, jamais des données)',
				'les PIÈCES JOINTES : le corpus n’en porte que le nombre, jamais un fichier'
			]) {
				console.log(`    ${quoi}`);
			}
			break;
		}

		case 'unicite': {
			const resultats = await B.verifierUnicite(session.pool);
			for (const r of resultats) {
				const verdict = r.reussi ? 'OK ' : 'ÉCHEC';
				console.log(
					`  ${verdict}  ${r.nom}\n         règle ${r.regle}\n         attendu ${r.attendu}, obtenu ${r.obtenu} — ${r.code} ${r.detail}`
				);
				if (!r.reussi) code = 1;
			}
			const refus = resultats.filter((r) => r.attendu === 'refus').length;
			const acceptations = resultats.length - refus;
			console.log(
				`\n${resultats.filter((r) => r.reussi).length}/${resultats.length} sondes conformes ` +
					`(${refus} refus attendus, ${acceptations} acceptations attendues).`
			);
			break;
		}

		case 'coherence': {
			const ecarts = await B.verifierCoherence(session.pool);
			for (const e of ecarts) {
				console.log(`  ÉCART  ${e.quoi} — ${e.detail}`);
				code = 1;
			}
			if (ecarts.length === 0) {
				console.log('src/lib/base/schema.ts décrit exactement les tables de la base migrée.');
				console.log(
					'CE CONTRÔLE NE REGARDE PAS : valeurs par défaut, corps des CHECK, actions référentielles.'
				);
			}
			break;
		}

		default:
			console.log(`commande inconnue : ${commande}`);
			console.log(USAGE);
			code = 1;
	}
} catch (erreur) {
	console.error(`ÉCHEC — ${erreur instanceof Error ? erreur.message : String(erreur)}`);
	code = 1;
} finally {
	await session.fermer();
	await vite.close();
}

exit(code);
