/**
 * LES LIENS DE CORPS DU JEU DE DÉMONSTRATION — et les arêtes qu'ils déduisent.
 *
 * CE QUI EST ÉPROUVÉ. `pnpm base:peupler` est le seul corpus complet du dépôt qu'on
 * ouvre pour MONTRER le produit ; s'il ne porte aucun lien interne, `/modelisation`
 * affiche « 0 mentions » et la couche déduite ne se démontre nulle part. Les neuf
 * liens écrits dans six fichiers valent six arêtes, pas neuf : deux registres qui
 * citent la même note n'en font qu'une, et deux paires sont déjà tenues par une
 * relation DÉCLARÉE — l'une dans le sens direct, l'autre dans le sens inverse.
 *
 * CE CONTRÔLE NE TOUCHE JAMAIS LA BASE. `peupler()` REMPLACE le contenu ; un unitaire
 * qui l'appellerait détruirait le corpus de qui le lance. Il lit les fichiers, les
 * analyse avec le parseur DU SEMEUR — `lireLaNoteDeDemonstration()` puis
 * `analyserMarkdown()` — et calcule les arêtes en mémoire.
 *
 * LE COMPTE DE SIX EST LE CONTRAT. Il se périme au prochain lien ajouté, et c'est
 * voulu : un chiffre qu'on doit remettre à jour est le seul qui reste vrai.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { lireLaNoteDeDemonstration } from '../src/lib/base/demonstration';
import { analyserMarkdown } from '../src/lib/contenu/markdown';
import { liensInternes } from '../src/lib/contenu/document';
import { LIBELLES_DE_MENTION, TYPE_DE_MENTION, aretesDeMention } from '../src/lib/graphe/mentions';
import type { RelationLisible } from '../src/lib/donnees/outils';
import type { Note } from './corpus';
import { RELATIONS } from './demonstration';

const DOSSIER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'demonstration');

/** Le périmètre du contrat : le jeu entier, comme la cartographie globale le dessine. */
const GLOBAL = { type: 'global' } as const;

/** Une note réduite à ce que `aretesDeMention()` regarde — identité et rangement. */
function note(id: string): Note {
	return {
		id,
		titre: id,
		extrait: '',
		type: 'Note',
		univers: 'U',
		domaine: 'D',
		dossier: '',
		auteur: '',
		fraicheur: 'frais',
		jours: 0,
		revise: null,
		vues: 0,
		pj: 0,
		brouillon: false,
		visibilite: 'interne',
		operationnel: false,
		etiquettes: []
	} as unknown as Note;
}

/**
 * LES RELATIONS DU JEU, DANS LA FORME QUE LA LECTURE REND. Elles sont d'origine
 * `declaree` : c'est cette origine qui fait jouer la préséance sur la mention.
 */
const DECLAREES: readonly RelationLisible[] = RELATIONS.map(
	(r) =>
		({
			id: r.source + '/' + r.type + '/' + r.cible,
			de: r.source,
			vers: r.cible,
			type: r.type,
			origine: 'declaree'
		}) as unknown as RelationLisible
);

/**
 * LES DEUX REGISTRES D'UNE NOTE FONT UNE SEULE LISTE DE CIBLES — c'est exactement ce
 * que la colonne générée `notes.liens_internes` concatène (migration `015`).
 */
let liensParNote: Map<string, readonly string[]>;
let identifiants: string[];

beforeAll(async () => {
	const fichiers = (await readdir(DOSSIER)).filter((f) => f.endsWith('.md')).sort();
	liensParNote = new Map();
	identifiants = [];
	for (const fichier of fichiers) {
		const lue = lireLaNoteDeDemonstration(await readFile(path.join(DOSSIER, fichier), 'utf8'));
		const id = lue.entete['identifiant'];
		if (id === undefined) throw new Error(fichier + ' : en-tête sans identifiant');
		identifiants.push(id);
		const cibles = [
			...liensInternes(analyserMarkdown(lue.reference)),
			...(lue.operationnel === null ? [] : liensInternes(analyserMarkdown(lue.operationnel)))
		];
		liensParNote.set(id, cibles);
	}
});

const aretes = (): readonly RelationLisible[] =>
	aretesDeMention(identifiants.map(note), liensParNote, DECLAREES, GLOBAL);

const paires = (): string[] => aretes().map((a) => a.de + ' → ' + a.vers);

describe('les liens de corps du jeu de démonstration', () => {
	it('le jeu de démonstration porte des liens de corps', () => {
		const porteuses = [...liensParNote.entries()].filter(([, cibles]) => cibles.length > 0);
		expect(porteuses.length).toBeGreaterThanOrEqual(6);
	});

	it('six arêtes déduites, pas une de plus', () => {
		expect(paires()).toHaveLength(6);
	});

	it('chaque arête déduite porte le type « mentionne »', () => {
		expect(aretes().every((a) => a.type === TYPE_DE_MENTION)).toBe(true);
		expect(LIBELLES_DE_MENTION.sortant).toBe('mentionne');
	});

	it("l'arête va de la note qui écrit vers la note citée", () => {
		expect(paires()).toContain('n-astreinte-conduite-a-tenir → n-lire-une-alerte-de-supervision');
		expect(paires()).not.toContain(
			'n-lire-une-alerte-de-supervision → n-astreinte-conduite-a-tenir'
		);
	});

	it("deux citations de la même note ne font qu'une arête", () => {
		/* La note cite la supervision dans les DEUX registres. */
		expect(
			(liensParNote.get('n-astreinte-conduite-a-tenir') ?? []).filter(
				(c) => c === 'n-lire-une-alerte-de-supervision'
			)
		).toHaveLength(2);
		expect(
			paires().filter(
				(p) => p === 'n-astreinte-conduite-a-tenir → n-lire-une-alerte-de-supervision'
			)
		).toHaveLength(1);
	});

	it('les deux sens se gardent quand les deux notes se citent', () => {
		expect(paires()).toContain(
			'n-note-de-service-commande-de-materiel → n-note-de-service-equipement-du-teletravail'
		);
		expect(paires()).toContain(
			'n-note-de-service-equipement-du-teletravail → n-note-de-service-commande-de-materiel'
		);
	});

	it('une relation déclarée efface la mention, dans le sens direct', () => {
		/* `n-restaurer-… documente n-bkp-01`, et le corps cite bkp-01. */
		expect(liensParNote.get('n-restaurer-une-sauvegarde-postgresql')).toContain('n-bkp-01');
		expect(paires()).not.toContain('n-restaurer-une-sauvegarde-postgresql → n-bkp-01');
		expect(paires()).not.toContain('n-bkp-01 → n-restaurer-une-sauvegarde-postgresql');
	});

	it('une relation déclarée efface la mention, dans le sens inverse', () => {
		/* La relation va de `n-bkp-01` vers `n-pg-prod-01` ; c'est pg-prod-01 qui cite. */
		expect(liensParNote.get('n-pg-prod-01')).toContain('n-bkp-01');
		expect(paires()).not.toContain('n-pg-prod-01 → n-bkp-01');
		expect(paires()).not.toContain('n-bkp-01 → n-pg-prod-01');
	});

	it('toute cible de lien interne désigne une note du jeu', () => {
		const connus = new Set(identifiants);
		const morts = [...liensParNote.values()].flat().filter((c) => !connus.has(c));
		expect(morts).toEqual([]);
	});
});
