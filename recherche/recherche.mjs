#!/usr/bin/env node
/**
 * LE LANCEUR DES COMMANDES DE L'INDEX DE RECHERCHE.
 *
 * Il ne contient AUCUNE logique : tout est dans `src/lib/recherche/commandes.ts`,
 * qui est du TypeScript typé strictement et contrôlé par `pnpm check`. Ce
 * fichier ne fait que trois choses — charger l'environnement, ouvrir un serveur
 * Vite pour exécuter le TypeScript du dépôt, et imprimer.
 *
 * C'est le jumeau de `base/base.mjs`, et délibérément : deux chemins de
 * résolution de modules dans un même dépôt finissent toujours par diverger sur
 * un cas limite, et la divergence se paie au lot suivant.
 *
 * POURQUOI UN LANCEUR SÉPARÉ DE CELUI DE LA BASE. L'index n'est pas la base : il
 * n'entre pas dans la sauvegarde (`RG-NF-09`), il se reconstruit depuis elle, et
 * le perdre n'a aucun effet sur le contenu. Le ranger parmi les commandes de
 * base laisserait croire l'inverse.
 *
 * Codes de retour : 0 si la commande a prouvé ce qu'elle annonce, 1 sinon.
 * Aucune commande n'imprime de clé.
 */
import { argv, exit } from 'node:process';

const [, , commande] = argv;

const USAGE = `
Usage : node recherche/recherche.mjs <commande>

  reindexer     reconstruit l'index depuis la base — l'index n'entre pas dans
                la sauvegarde (RG-NF-09), il se reconstruit
  etat          ce que l'index porte : entrées, champs réglés, embedders
  epreuve       les sept personas contre l'index : aucune entrée interdite
                n'en sort, et le filtre n'est pas inerte
`;

try {
	process.loadEnvFile('.env');
} catch {
	/* Pas de fichier d'environnement : l'environnement du processus fait foi. */
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
/** @type {import('../src/lib/recherche/commandes.ts')} */
const R = await vite.ssrLoadModule('/src/lib/recherche/commandes.ts');

const session = B.ouvrir(process.env);
console.log(`base     : ${session.lisible}`);

let code = 0;

/** Imprime un tableau simple, sans dépendance. */
const ligne = (gauche, droite) => console.log(`  ${gauche.padEnd(58)} ${droite}`);

try {
	const client = R.moteurDeRecherche(process.env);

	switch (commande) {
		case 'reindexer': {
			const rapport = await R.reindexerLeCorpus(session.db, process.env);
			ligne('notes projetées depuis la base', String(rapport.projetees));
			ligne('entrées portées par l’index après échange', String(rapport.indexees));
			ligne('entrées que l’index portait avant', String(rapport.precedentes));
			console.log('');
			if (rapport.projetees !== rapport.indexees) {
				console.log(
					'ÉCHEC — la reconstruction ne redonne pas le corpus : ' +
						`${rapport.projetees} projetées, ${rapport.indexees} indexées.`
				);
				code = 1;
			} else {
				console.log(
					`l’index porte exactement le corpus de la base — ${rapport.indexees} notes, ` +
						'chacune avec son chemin d’ancêtres (ADR-006).'
				);
			}
			break;
		}

		case 'etat': {
			const etat = await R.etatDeLIndex(client);
			ligne('index posé', etat.existe ? 'oui' : 'NON');
			ligne('entrées', String(etat.entrees));
			ligne('champs cherchables', etat.champsCherchables.join(', ') || '—');
			ligne('champs filtrables', etat.champsFiltrables.join(', ') || '—');
			ligne('champs triables', etat.champsTriables.join(', ') || '—');
			ligne('embedders déclarés', etat.embedders.join(', ') || 'AUCUN');
			console.log('');
			console.log(
				etat.embedders.length === 0
					? 'MODE « SENS » INDISPONIBLE — aucun embedder n’est déclaré, donc aucun vecteur\n' +
							'  n’existe. Le mode se DÉCLARE indisponible (P-10) ; il n’est pas simulé (P-02).'
					: 'des embedders sont déclarés : le mode « Sens » ne peut plus se dire indisponible.'
			);
			console.log('');
			console.log('CE QUE CET INDEX NE PORTE PAS, ET POURQUOI :');
			for (const quoi of [
				'la FRAÎCHEUR — une seconde définition, gelée à l’indexation (P-01, ADR-005)',
				'le CORPS des deux registres — les champs cherchables sont ceux de la maquette',
				'les VECTEURS — aucun n’est calculé ; le service d’embeddings est optionnel'
			]) {
				console.log(`    ${quoi}`);
			}
			if (!etat.existe) code = 1;
			break;
		}

		case 'epreuve': {
			const rapport = await R.eprouverLePerimetre(session.db, process.env);

			console.log('');
			console.log('  LA RÉINDEXATION');
			ligne(
				'notes projetées / entrées indexées',
				`${rapport.reindexation.projetees} / ${rapport.reindexation.indexees}`
			);

			console.log('');
			console.log('  LES SEPT PERSONAS — l’index contre resolution.ts');
			for (const cas of rapport.personas) {
				console.log(`    ${cas.persona}  (${cas.incarnation})`);
				console.log(
					`        filtre    ${cas.filtre ?? 'AUCUNE REQUÊTE — périmètre vide (RG-DRO-02)'}`
				);
				console.log(
					`        attendu ${cas.attendu} · obtenu ${cas.obtenu} · fuites ${cas.fuites.length} · pertes ${cas.pertes.length}`
				);
				console.log(
					`        ${cas.termes} termes essayés · ${cas.termesMordants} mordants · ` +
						`${cas.ecartees} entrée(s) interdite(s) écartée(s) par le filtre · ` +
						`${cas.fuitesParTerme.length} fuite(s) par terme`
				);
			}

			console.log('');
			console.log('  LES SONDES SYNTHÉTIQUES — six entrées qu’aucune base ne porte');
			for (const sonde of rapport.sondes) {
				console.log(
					`    ${sonde.conforme ? 'OK   ' : 'ÉCHEC'} ${sonde.persona.padEnd(24)} ` +
						`attendu [${sonde.attendues.join(' ')}] obtenu [${sonde.obtenues.join(' ')}]`
				);
			}

			console.log('');
			console.log('  RG-M02-04 — en anonyme, statut= et visibilite= ignorés, jamais refusés');
			ligne('filtre sans les paramètres', rapport.parametresIgnores.filtreSans ?? '—');
			ligne('filtre avec les paramètres', rapport.parametresIgnores.filtreAvec ?? '—');
			ligne('même réponse', String(rapport.parametresIgnores.memeResultat));
			ligne('refus levé', String(rapport.parametresIgnores.refus));
			ligne(
				'contrôle positif — une facette honorée change le filtre',
				String(rapport.parametresIgnores.facetteHonoree)
			);

			console.log('');
			if (rapport.defauts.length === 0) {
				console.log(
					'AUCUN DÉFAUT — aucune entrée interdite ne sort de l’index, pour aucun des sept\n' +
						'  personas, et le filtre a effectivement écarté ce qu’il devait écarter.'
				);
			} else {
				console.log(`ÉCHEC — ${rapport.defauts.length} défaut(s) :`);
				for (const defaut of rapport.defauts) console.log(`    ${defaut}`);
				code = 1;
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
