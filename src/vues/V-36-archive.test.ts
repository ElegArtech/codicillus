/**
 * L'ARBORESCENCE ANNONCÉE PAR V-36 CONTRE L'ARCHIVE RÉELLEMENT PRODUITE.
 *
 * CE QUE CE FICHIER PROUVE. Chaque ligne de l'arborescence que
 * `/console/exports` affiche NOMME UNE ENTRÉE DE L'ARCHIVE — ou un dossier qui
 * en contient une. Rien d'autre, et c'est exactement le contrôle qui manquait :
 * l'écran annonçait `rapport-de-conversion.md` quand l'archive écrit du texte
 * nu, un fichier d'index que la fabrique n'a jamais produit, un nom de note mis
 * en ardoise là où le fichier reprend le titre au caractère près, un dossier de
 * pièces jointes sans le dossier par note qu'il interpose, et pas de racine là
 * où l'archive range tout sous le dossier racine du domaine. Cinq écarts sur
 * six lignes, et aucun contrôle ne pouvait les voir.
 *
 * LES DEUX CÔTÉS SONT PRODUITS PAR LEUR SOURCE, JAMAIS ÉCRITS ICI.
 * L'attendu n'est pas une liste de noms recopiée : c'est le tableau des entrées
 * que `construireLArchive()` rend — la fabrique que le point de téléchargement
 * appelle. Le constaté est le corps rendu par `render()` de la vue, dans le
 * graphe SSR de Vite. Un contrôle qui aurait écrit les noms des deux côtés
 * serait resté vert pendant que les deux divergeaient : c'est précisément la
 * faute que ce lot répare.
 *
 * LE DOMAINE ÉPROUVÉ EST CELUI DU JEU DE SEMENCE, des deux côtés — les mêmes
 * notes, les mêmes dossiers, le même rangement. `seeds/corpus.ts` sert la vue,
 * `src/lib/base/semence.ts` sert la fabrique, et les deux dérivent du même
 * corpus figé sans qu'aucune correspondance ne soit écrite à la main.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CORPUS, DOMAINES, type Note } from '../../seeds/corpus';
import { lignesDeDossier, lignesDeNote } from '../lib/base/semence';
import { identifiantLisible } from '../lib/rangement/adresses';
import {
	construireLArchive,
	type DomaineAExporter,
	type NoteAExporter,
	type PieceJointeAExporter
} from '../lib/export/archive';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let serveur: ViteDevServer;
let rendreComposant: (composant: unknown, options: { props: object }) => { body: string };

beforeAll(async () => {
	serveur = await createServer({
		configFile: join(racine, 'vite.config.ts'),
		root: racine,
		server: { middlewareMode: true },
		appType: 'custom',
		logLevel: 'error'
	});
	rendreComposant = (await serveur.ssrLoadModule('svelte/server')).render;
}, 120_000);

afterAll(async () => {
	await serveur?.close();
});

/** Le corps rendu de V-36, par le graphe SSR de Vite — jamais autrement. */
async function rendreV36(proprietes: object): Promise<string> {
	const module = await serveur.ssrLoadModule('/src/vues/V-36.svelte');
	return rendreComposant(module.default, { props: { vecteur: null, ...proprietes } }).body;
}

/* ═══════════════════════════ Le domaine, tel que la base le porterait ══ */

/**
 * Le domaine du corpus figé, dans la forme que l'export lit en base.
 *
 * `piecesJointes` est VIDE, et ce n'est pas un raccourci : `semence.ts` n'écrit
 * AUCUNE ligne de pièce jointe. Le compteur `pj` de `seeds/corpus.ts` est une
 * valeur d'affichage du jeu de maquette, sans contrepartie en base — d'où le
 * second cas, qui pose une pièce des DEUX côtés pour éprouver le dossier par
 * note que l'archive interpose.
 */
function domaineDuJeu(nomDeDomaine: string): DomaineAExporter {
	const domaine = DOMAINES.find((d) => d.nom === nomDeDomaine);
	if (domaine === undefined) throw new Error('domaine absent du corpus : ' + nomDeDomaine);
	return {
		universIdentifiant: identifiantLisible(domaine.univers),
		universNom: domaine.univers,
		identifiant: identifiantLisible(domaine.nom),
		nom: domaine.nom,
		dossiers: lignesDeDossier()
			.filter((d) => d.domaineNom === nomDeDomaine)
			.map((d) => ({ chemin: d.chemin })),
		notes: lignesDeNote()
			.filter((n) => n.domaineNom === nomDeDomaine)
			.map((n): NoteAExporter => ({
				identifiant: n.identifiant,
				titre: n.titre,
				typeDeNote: n.typeDeNoteNom,
				typeDeFiche: n.typeDeFicheNom,
				proprietesDeFiche: null,
				cheminDeDossier: n.cheminDeDossier,
				auteur: n.auteurNom,
				etiquettes: n.etiquettes,
				visibilite: n.visibilite,
				statut: n.statut,
				creeLe: n.creeLe.toISOString(),
				modifieLe: n.modifieLe.toISOString(),
				corpsReferenceModifieLe: n.modifieLe.toISOString(),
				corpsOperationnelModifieLe: n.corpsOperationnelModifieLe?.toISOString() ?? null,
				verifieLe: n.verifieLe?.toISOString() ?? null,
				consultations: n.compteurDeConsultations,
				signetAdresse: n.signetAdresse,
				signetAjouteLe: n.signetAjouteLe,
				revisionDemandee: n.revisionDemandee,
				revisionCommentaire: n.revisionCommentaire,
				revisionPar: n.revisionParNom,
				revisionLe: n.revisionLe?.toISOString() ?? null,
				relations: [],
				corpsReference: n.corpsReference,
				corpsOperationnel: n.corpsOperationnel,
				piecesJointes: []
			}))
	};
}

/** Les notes du corpus, servies à la vue, sans le compteur de pièces sans contrepartie. */
function notesDuJeuSansPieces(): readonly Note[] {
	return CORPUS.map((n) => ({ ...n, pj: 0 }));
}

/* ═══════════════════════════════════ La lecture de l'arborescence ══════ */

/**
 * Les chemins que l'écran ANNONCE, reconstitués depuis les branches rendues.
 *
 * Le tirage est celui de la vue : une entrée de racine ouvre par une équerre,
 * un enfant est décalé d'un cran par niveau. La profondeur se lit donc sur le
 * décalage, et le chemin se referme sur la pile des dossiers ouverts.
 */
function cheminsAnnonces(rendu: string): readonly string[] {
	const bloc = /<div class="arbo-archive"><b>[^<]*<\/b>([\s\S]*?)<\/div>/.exec(rendu);
	if (bloc === null) throw new Error('aucune arborescence d’archive rendue');
	const pile: string[] = [];
	const chemins: string[] = [];
	for (const ligne of (bloc[1] ?? '').split('\n')) {
		const branche = /^((?:│ {3}| {4})*)(?:├── |└── )(.*)$/.exec(ligne);
		if (branche === null) continue;
		const profondeur = (branche[1] ?? '').length / 4;
		const nom = branche[2] ?? '';
		pile.length = profondeur;
		const dossier = nom.endsWith('/');
		if (dossier) pile.push(nom.slice(0, -1));
		chemins.push(
			[...pile.slice(0, profondeur), dossier ? nom.slice(0, -1) : nom].join('/') +
				(dossier ? '/' : '')
		);
	}
	if (chemins.length === 0) throw new Error('arborescence d’archive vide');
	return chemins;
}

/**
 * Le constat, et il est SANS EXCEPTION : un nom affiché est une entrée de
 * l'archive, ou un dossier qui en contient une. L'archive n'écrit pas d'entrée
 * pour le dossier voisin des pièces — elle n'écrit que les fichiers qu'il
 * porte —, et un dossier annoncé qui ne contiendrait rien serait tout autant un
 * mensonge : c'est pourquoi le préfixe doit être celui d'une entrée existante.
 */
function chaqueLigneEstUneEntree(rendu: string, entrees: readonly string[]): void {
	const jeu = new Set(entrees);
	for (const chemin of cheminsAnnonces(rendu)) {
		const present =
			jeu.has(chemin) || (chemin.endsWith('/') && entrees.some((e) => e.startsWith(chemin)));
		expect(present, 'ligne annoncée absente de l’archive : ' + chemin).toBe(true);
	}
}

/* ═══════════════════════════════════════════════════════ Les deux cas ══ */

describe('V-36 — l’arborescence annoncée est celle de l’archive produite', () => {
	const NOM_DE_DOMAINE = DOMAINES[0]?.nom ?? '';

	test('chaque ligne annoncée nomme une entrée que la fabrique écrit', async () => {
		const archive = construireLArchive(domaineDuJeu(NOM_DE_DOMAINE));
		const entrees = archive.entrees.map((e) => e.chemin);

		const rendu = await rendreV36({
			notes: notesDuJeuSansPieces(),
			nomsDArchive: { [NOM_DE_DOMAINE]: 'archive.zip' }
		});
		chaqueLigneEstUneEntree(rendu, entrees);
	});

	/**
	 * LE NOMBRE DE DOSSIERS ANNONCÉ EST CELUI QUE L'ARCHIVE RANGE.
	 *
	 * L'écran le tirait du rangement des NOTES : un dossier vide, que l'archive
	 * porte pourtant, n'était compté nulle part. Le constat croise les deux —
	 * l'archive écrit une entrée par dossier, racine comprise, quand l'écran
	 * compte les dossiers racine EXCLUE, comme partout ailleurs dans le produit.
	 * Le décompte annoncé plus un doit donc être le nombre d'entrées de dossier.
	 */
	test('le nombre de dossiers annoncé est celui des entrées de dossier de l’archive', async () => {
		const domaine = domaineDuJeu(NOM_DE_DOMAINE);
		const archive = construireLArchive(domaine);
		const entreesDeDossier = archive.entrees.filter((e) => e.chemin.endsWith('/')).length;

		/* Le décompte servi vient de la base ; ici, du même rangement que la
		   fabrique lit, et compté selon la même convention (racine exclue). */
		const compteServi = domaine.dossiers.filter((d) => d.chemin.length > 1).length;
		const rendu = await rendreV36({
			notes: notesDuJeuSansPieces(),
			nomsDArchive: { [NOM_DE_DOMAINE]: 'archive.zip' },
			dossiersParDomaine: { [NOM_DE_DOMAINE]: compteServi }
		});
		expect(compteServi + 1).toBe(entreesDeDossier);
		expect(rendu).toContain('Les ' + String(compteServi) + ' dossiers du domaine');
	});

	/**
	 * LES DEUX NOMS QUE L'ÉCRAN AVAIT INVENTÉS, NOMMÉMENT REFUSÉS.
	 *
	 * Le contrôle ci-dessus les prendrait déjà ; ces deux constats les nomment,
	 * pour que la régression se lise sans dérouler un chemin.
	 */
	test('ni fichier d’index, ni rapport en Markdown', async () => {
		const rendu = await rendreV36({
			notes: notesDuJeuSansPieces(),
			nomsDArchive: { [NOM_DE_DOMAINE]: 'archive.zip' }
		});
		expect(rendu).not.toContain('domaine.json');
		expect(rendu).not.toContain('rapport-de-conversion.md');
	});

	/**
	 * LE DOSSIER PAR NOTE QUE L'ARCHIVE INTERPOSE.
	 *
	 * La pièce est posée DES DEUX CÔTÉS — dans le domaine que la fabrique lit,
	 * et dans le compteur que la vue lit —, sans quoi la branche des pièces
	 * jointes ne serait rendue par aucun des deux et ne prouverait rien.
	 */
	test('le dossier des pièces jointes est celui de la note, pas un dossier commun', async () => {
		const domaine = domaineDuJeu(NOM_DE_DOMAINE);
		const premiere = domaine.notes[0];
		if (premiere === undefined) throw new Error('le domaine du jeu n’a aucune note');
		const piece: PieceJointeAExporter = {
			nom: 'schema.txt',
			typeMedia: 'text/plain',
			deposeeLe: premiere.modifieLe,
			octets: new Uint8Array([0x6f, 0x6b])
		};
		const archive = construireLArchive({
			...domaine,
			notes: domaine.notes.map((n) =>
				n.identifiant === premiere.identifiant ? { ...n, piecesJointes: [piece] } : n
			)
		});
		const entrees = archive.entrees.map((e) => e.chemin);

		const rendu = await rendreV36({
			notes: notesDuJeuSansPieces().map((n) =>
				n.id === premiere.identifiant ? { ...n, pj: 1 } : n
			),
			nomsDArchive: { [NOM_DE_DOMAINE]: 'archive.zip' }
		});
		chaqueLigneEstUneEntree(rendu, entrees);
		expect(cheminsAnnonces(rendu)).toContain('pieces-jointes/' + premiere.identifiant + '/');
	});
});

/**
 * LA PROMESSE DE RÉIMPORTATION A ÉTÉ RETIRÉE, ET ELLE DOIT LE RESTER.
 *
 * Aucun chemin d'import d'archive n'existe : l'import écarte le format
 * d'archive, et la relecture d'archive n'est appelée que par ses propres
 * contrôles. L'écran affirmait pourtant que « réimporter l'archive reconstitue
 * le domaine à l'identique ». Tant qu'aucun lot ne livre la réimportation,
 * l'écran ne la nomme que pour dire qu'elle n'est pas disponible.
 */
describe('V-36 — le chemin à zéro donnée', () => {
	/**
	 * UNE INSTANCE NEUVE N'A AUCUN DOMAINE — et le bouton « Préparer l'archive »
	 * restait actif sur un clic qui ne faisait rien, faute de domaine à nommer.
	 */
	test('sans aucun domaine, le bouton de préparation est inerte et le dit', async () => {
		const neuve = await rendreV36({ domaines: [], notes: [], nomsDArchive: {} });
		expect(/<button[^>]*id="exporter"[^>]*disabled/.test(neuve)).toBe(true);
		const servie = await rendreV36({ notes: notesDuJeuSansPieces() });
		expect(/<button[^>]*id="exporter"[^>]*disabled/.test(servie)).toBe(false);
	});
});

describe('V-36 — la réimportation n’est plus promise', () => {
	test('l’écran ne promet aucune reconstitution du domaine', async () => {
		const rendu = await rendreV36({ notes: notesDuJeuSansPieces() });
		expect(rendu).not.toContain('Cet export est réimportable');
		expect(rendu).not.toContain('reconstitue le domaine');
		expect(rendu).not.toContain("rend l'archive réimportable");
		expect(rendu).toContain("n'est pas encore possible");
	});
});
