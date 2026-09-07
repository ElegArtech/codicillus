/**
 * LA CAPTURE DE RÉFÉRENCE DE LA CARTOGRAPHIE, sur l'univers Substack du jeu de
 * démonstration — et le contrôle qui échoue si un rendu ultérieur s'en écarte.
 *
 * POURQUOI UNE CAPTURE TEXTUELLE, ET NON UNE IMAGE. Une image de référence se
 * compare au pixel : elle rougit au changement de version du navigateur, au
 * rendu des polices, à l'anticrénelage. Ce qu'on veut geler ici n'est pas
 * l'image, c'est LE DESSIN — la place de chaque nœud, l'ordre et l'étendue de
 * chaque famille, le repère. La capture ci-dessous porte exactement cela, à
 * l'unité près, et elle se lit dans une revue de code.
 *
 * ELLE SE RECALCULE SANS BASE ET SANS NAVIGATEUR : les fichiers du jeu sont lus
 * par le parseur DU SEMEUR — `lireLaNoteDeDemonstration()` —, les familles par
 * `calculerLesFamilles()`, les arêtes déduites par `aretesDeMention()`, et la
 * disposition par `disposerLaCarte()`. Toute la chaîne qui produit le dessin est
 * donc éprouvée, sauf le balisage lui-même.
 *
 * QUAND ELLE ROUGIT LÉGITIMEMENT — une note ajoutée au jeu, une relation
 * changée, un jeton de disposition remesuré —, la capture se refait :
 *
 *     CAPTURE_A_REECRIRE=1 pnpm test:unit seeds/cartographie-de-demonstration
 *
 * et le fichier produit se relit AVANT d'être commité. C'est le seul geste
 * admis : une capture qu'on réécrit sans la lire ne prouve plus rien.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lireLaNoteDeDemonstration } from '../src/lib/base/demonstration';
import { calculerLesFamilles } from '../src/lib/graphe/familles';
import {
	centralites,
	codeCourt,
	degres,
	rayonDeNoeud,
	sousGraphe
} from '../src/lib/graphe/cartographie';
import {
	disposerLaCarte,
	largeurDeLibelle,
	libelleCourt,
	type CarteDisposee
} from '../src/lib/graphe/disposition-carte';
import {
	HAUTEUR_DETIQUETTE,
	MARGE_DETIQUETTE,
	T_FAMILLE,
	T_FAMILLE_COMPTE
} from '../src/lib/graphe/jetons';
import { aretesDeMention } from '../src/lib/graphe/mentions';
import { liensInternes } from '../src/lib/contenu/document';
import { analyserMarkdown } from '../src/lib/contenu/markdown';
import type { RelationLisible } from '../src/lib/donnees/outils';
import { DOMAINES, RELATIONS } from './demonstration';
import type { Note } from './corpus';

const RACINE = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.join(RACINE, 'demonstration');
const CAPTURE = path.join(RACINE, 'cartographie-de-demonstration.capture.txt');

/** Le périmètre de la capture — l'univers qui fait voir la carte. */
const PERIMETRE = { type: 'univers', nom: 'Substack' } as const;

/* ── LE CORPUS, LU COMME LE SEMEUR LE LIT ─────────────────────────────────── */

interface Lue {
	readonly note: Note;
	readonly liens: readonly string[];
}

function lireLeJeu(): Lue[] {
	const universParDomaine = new Map(DOMAINES.map((d) => [d.nom, d.univers] as const));
	return readdirSync(DOSSIER)
		.filter((f) => f.endsWith('.md'))
		.sort()
		.map((f) => lireLaNoteDeDemonstration(readFileSync(path.join(DOSSIER, f), 'utf8')))
		.map((brut) => {
			const entete = brut.entete;
			const domaine = entete['domaine'] ?? '';
			const note = {
				id: entete['identifiant'] ?? '',
				titre: entete['titre'] ?? '',
				extrait: '',
				type: entete['type'] ?? 'Note',
				univers: universParDomaine.get(domaine) ?? '',
				domaine,
				dossier: entete['dossier'] ?? '',
				auteur: entete['auteur'] ?? '',
				fraicheur: 'frais',
				jours: Number(entete['verifie-il-y-a-jours'] ?? 0),
				revise: '2026-01-01',
				vues: 0,
				pj: 0,
				brouillon: false,
				visibilite: 'interne',
				operationnel: false,
				etiquettes: (entete['etiquettes'] ?? '')
					.split(',')
					.map((e) => e.trim())
					.filter((e) => e !== '')
			} as unknown as Note;
			return { note, liens: liensInternes(analyserMarkdown(brut.reference)) };
		});
}

/** Les relations DÉCLARÉES du jeu, dans la forme que la lecture rend. */
function declarees(): RelationLisible[] {
	return RELATIONS.map((r) => ({
		de: r.source,
		vers: r.cible,
		type: r.type,
		origine: 'declaree'
	})) as unknown as RelationLisible[];
}

/**
 * LE DESSIN DE L'UNIVERS SUBSTACK — la même chaîne que le chargeur de
 * `/cartographie`, aux lectures de base près.
 */
function carteDeDemonstration(): CarteDisposee {
	const lues = lireLeJeu();
	const notes = lues.map((l) => l.note);
	const liensParNote = new Map(lues.map((l) => [l.note.id as string, l.liens] as const));

	const aretes = [...declarees(), ...aretesDeMention(notes, liensParNote, declarees(), PERIMETRE)];
	const graphe = sousGraphe(notes, PERIMETRE, aretes, 'gardees');

	const familles = calculerLesFamilles(
		notes.filter((n) => n.univers === PERIMETRE.nom),
		new Date('2026-09-07T00:00:00.000Z')
	);
	const familleParNoeud = new Map<string, string>(
		familles.familles.flatMap((f) => f.membres.map((m) => [m, f.nom] as const))
	);

	const deg = degres(graphe);
	const centralite = centralites(graphe);
	let maximum = 0;
	for (const n of graphe.noeuds) maximum = Math.max(maximum, centralite.get(n.id) ?? 0);
	const titres = new Map<string, string>(notes.map((n) => [n.id as string, n.titre] as const));

	return disposerLaCarte(graphe, {
		familleParNoeud,
		ordreDesFamilles: familles.familles.map((f) => f.nom),
		mesures: {
			rayon: (id) => rayonDeNoeud('centralite', centralite.get(id) ?? 0, maximum),
			degre: (id) => deg.get(id) ?? 0,
			centralite: (id) => centralite.get(id) ?? 0,
			titre: (id) => titres.get(id) ?? id
		},
		perimetre: { nom: PERIMETRE.nom, code: codeCourt(PERIMETRE.nom) }
	});
}

/** La capture : ce que le dessin est, en clair, à l'unité près. */
function capturer(c: CarteDisposee): string {
	const n = (v: number): string => v.toFixed(1);
	const lignes: string[] = [
		'# Cartographie du jeu de démonstration — univers Substack',
		'',
		`repère ${n(c.repere.x)} ${n(c.repere.y)} ${n(c.repere.largeur)} ${n(c.repere.hauteur)}`,
		`centre ${c.centre.libelle} (${c.centre.code}) r=${n(c.centre.r)}`,
		`nœuds ${c.noeuds.length} · familles ${c.familles.length} · traits de squelette ${c.squelette.length}`,
		'',
		'## Familles'
	];
	for (const f of c.familles) {
		lignes.push(
			`${f.nom} · ${f.effectif} notes · teinte ${f.teinte} · pivot ${f.pivot} · ` +
				`centre ${n(f.centre.x)} ${n(f.centre.y)} · rayon ${n(f.rayon)} · ` +
				`titre ${n(f.tete.x)} ${n(f.tete.y)}`
		);
	}
	lignes.push('', '## Nœuds');
	for (const p of [...c.places.values()].sort((a, b) => a.id.localeCompare(b.id))) {
		lignes.push(
			`${p.id} ${n(p.x)} ${n(p.y)} r=${n(p.r)}` +
				(p.pivot ? ' pivot' : '') +
				(c.etiquettes.has(p.id) ? (c.etiquettesAuDessus.has(p.id) ? ' nommé↑' : ' nommé') : '')
		);
	}
	return lignes.join('\n') + '\n';
}

/* ── LES CONTRÔLES ────────────────────────────────────────────────────────── */

const carte = carteDeDemonstration();

describe('la cartographie du jeu de démonstration', () => {
	it("dessine les neuf familles nommées de l'univers, plus les isolées", () => {
		expect(carte.familles.map((f) => `${f.nom} (${f.effectif})`)).toEqual([
			'Développement (12)',
			'Installation (11)',
			'IA & Productivité (10)',
			'Outils & Tech (9)',
			'Business & Stratégie (8)',
			'Marketing (7)',
			'Contenu (6)',
			'Méthode (6)',
			'Veille (5)',
			'Isolées (8)'
		]);
	});

	it('place « Claude Code » dans la famille « Outils & Tech »', () => {
		expect(carte.places.get('n-sub-claude-code')?.famille).toBe('Outils & Tech');
	});

	it('ne laisse aucun contour en recouvrir un autre', () => {
		for (let i = 0; i < carte.familles.length; i += 1) {
			for (let k = i + 1; k < carte.familles.length; k += 1) {
				const a = carte.familles[i];
				const b = carte.familles[k];
				if (a === undefined || b === undefined) continue;
				const distance = Math.hypot(a.centre.x - b.centre.x, a.centre.y - b.centre.y);
				expect(distance, `« ${a.nom} » et « ${b.nom} » se recouvrent`).toBeGreaterThanOrEqual(
					a.rayon + b.rayon - 1e-6
				);
			}
		}
	});

	it('ne laisse aucun nœud en recouvrir un autre', () => {
		const noeuds = [...carte.places.values()];
		for (let i = 0; i < noeuds.length; i += 1) {
			for (let k = i + 1; k < noeuds.length; k += 1) {
				const a = noeuds[i];
				const b = noeuds[k];
				if (a === undefined || b === undefined) continue;
				expect(
					Math.hypot(a.x - b.x, a.y - b.y),
					`${a.id} et ${b.id} se recouvrent`
				).toBeGreaterThan(a.r + b.r);
			}
		}
	});

	it("n'écrit aucun libellé par-dessus un autre, et le nom de chaque famille est écrit", () => {
		const boites: { x1: number; y1: number; x2: number; y2: number; quoi: string }[] = [];
		for (const f of carte.familles) {
			const largeur = Math.max(
				largeurDeLibelle(f.nom) * (T_FAMILLE / 9.5),
				largeurDeLibelle(`${f.effectif} notes`)
			);
			boites.push({
				x1: f.tete.x,
				y1: f.tete.y - T_FAMILLE,
				x2: f.tete.x + largeur,
				y2: f.tete.y + T_FAMILLE + T_FAMILLE_COMPTE + MARGE_DETIQUETTE * 2,
				quoi: `famille ${f.nom}`
			});
		}
		expect(boites).toHaveLength(carte.familles.length);

		for (const id of carte.etiquettes) {
			const place = carte.places.get(id);
			if (place === undefined) continue;
			const titre = libelleCourt(place.id);
			const demi = largeurDeLibelle(titre) / 2;
			const haut = carte.etiquettesAuDessus.has(id)
				? place.y - place.r - MARGE_DETIQUETTE - HAUTEUR_DETIQUETTE
				: place.y + place.r + MARGE_DETIQUETTE;
			boites.push({
				x1: place.x - demi,
				y1: haut,
				x2: place.x + demi,
				y2: haut + HAUTEUR_DETIQUETTE,
				quoi: `nœud ${id}`
			});
		}

		for (let i = 0; i < boites.length; i += 1) {
			for (let k = i + 1; k < boites.length; k += 1) {
				const a = boites[i];
				const b = boites[k];
				if (a === undefined || b === undefined) continue;
				const heurte = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
				expect(heurte, `${a.quoi} recouvre ${b.quoi}`).toBe(false);
			}
		}
	});

	it('rend le même dessin à chaque ouverture', () => {
		expect(capturer(carteDeDemonstration())).toBe(capturer(carteDeDemonstration()));
	});

	/**
	 * LE CONTRÔLE DE RÉFÉRENCE. Il échoue dès qu'un nœud bouge d'un dixième d'unité,
	 * et c'est ce qu'on lui demande : un dessin qui change sans qu'on l'ait voulu est
	 * exactement ce qu'un rendu de graphe fait quand rien ne le tient.
	 */
	it('est identique à la capture de référence', () => {
		const obtenue = capturer(carte);
		if (process.env['CAPTURE_A_REECRIRE'] === '1' || !existsSync(CAPTURE)) {
			writeFileSync(CAPTURE, obtenue, 'utf8');
		}
		expect(obtenue).toBe(readFileSync(CAPTURE, 'utf8'));
	});
});
