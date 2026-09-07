/**
 * CE QUE LA DISPOSITION DOIT TENIR, ET QUI SE MESURE.
 *
 * Le défaut qu'on répare ne se dit pas « c'est moins joli » : il se mesure. Sur le
 * rendu d'avant — une simulation de forces —, des contours se recouvraient, des
 * libellés se chevauchaient, et deux cent quarante-cinq traits passaient dans le
 * même paquet. Les contrôles ci-dessous portent exactement ces propriétés-là, sur
 * un corpus DENSE, parce que c'est à la densité que tout se joue.
 *
 * ILS NE REGARDENT PAS UN DESSIN : ils regardent des nombres. Un contour qui en
 * recouvre un autre est deux disques dont la distance des centres est plus petite
 * que la somme des rayons ; deux libellés qui se chevauchent sont deux rectangles
 * qui s'intersectent. Rien de tout cela ne demande un navigateur.
 */
import { describe, expect, it } from 'vitest';
import type { Note, Relation } from '../../../seeds/corpus';
import { sousGraphe, type Graphe } from './cartographie';
import {
	CARACTERES_DUN_LIBELLE,
	ETIREMENT_X,
	ETIREMENT_Y,
	NOM_DES_ISOLEES,
	disposerLaCarte,
	disposerLeVoisinage,
	etiquettesDeRelation,
	largeurDeLibelle,
	libelleCourt,
	libelleDuCentre,
	type CarteDisposee,
	type MesuresDeNoeud
} from './disposition-carte';
import {
	HAUTEUR_DETIQUETTE,
	MARGE_DETIQUETTE,
	NOEUD_MAXIMUM,
	T_FAMILLE,
	T_FAMILLE_COMPTE,
	T_NOEUD
} from './jetons';

/* ── LE CORPUS D'ÉPREUVE ───────────────────────────────────────────────────
   Il est FABRIQUÉ, et c'est la seule façon de tenir les cas extrêmes : une famille
   de deux notes à côté d'une famille de quarante, une famille d'une seule note, et
   des notes qu'aucune relation ne touche. Un jeu réel n'offre pas ces trois-là
   ensemble, et ce sont eux qui cassent une disposition. */

function note(id: string, titre: string): Note {
	return {
		id,
		titre,
		extrait: '',
		type: 'Note',
		univers: 'Substack',
		domaine: 'Atelier',
		dossier: '',
		auteur: 'a.berge',
		fraicheur: 'frais',
		jours: 1,
		revise: '2026-09-01',
		vues: 0,
		pj: 0,
		brouillon: false,
		visibilite: 'interne',
		operationnel: false,
		etiquettes: []
	} as unknown as Note;
}

interface Jeu {
	readonly graphe: Graphe;
	readonly familleParNoeud: Map<string, string>;
	readonly ordre: string[];
	readonly mesures: MesuresDeNoeud;
}

/**
 * Un corpus de `familles` familles d'effectifs donnés, plus des notes isolées. Les
 * relations relient chaque membre à son premier voisin : de quoi donner un degré,
 * donc un pivot.
 */
function jeu(effectifs: readonly number[], isolees: number): Jeu {
	const notes: Note[] = [];
	const relations: Relation[] = [];
	const familleParNoeud = new Map<string, string>();
	const ordre: string[] = [];

	effectifs.forEach((effectif, f) => {
		const nom = `Famille ${String.fromCharCode(65 + f)}`;
		ordre.push(nom);
		for (let i = 0; i < effectif; i += 1) {
			const id = `n-f${f}-${i}`;
			notes.push(note(id, `Note ${f}.${i} sur un sujet assez long pour être coupée`));
			familleParNoeud.set(id, nom);
			if (i > 0) {
				relations.push({
					de: `n-f${f}-0`,
					vers: id,
					type: 'documente'
				} as unknown as Relation);
			}
		}
	});

	for (let i = 0; i < isolees; i += 1) notes.push(note(`n-seule-${i}`, `Seule ${i}`));

	const graphe = sousGraphe(notes, { type: 'global' }, relations, 'gardees');
	const degres = new Map<string, number>();
	for (const r of relations) {
		degres.set(r.de, (degres.get(r.de) ?? 0) + 1);
		degres.set(r.vers, (degres.get(r.vers) ?? 0) + 1);
	}

	const titres = new Map<string, string>(notes.map((n) => [n.id as string, n.titre] as const));
	return {
		graphe,
		familleParNoeud,
		ordre,
		mesures: {
			rayon: () => NOEUD_MAXIMUM,
			degre: (id) => degres.get(id) ?? 0,
			centralite: (id) => (degres.get(id) ?? 0) / 10,
			titre: (id) => titres.get(id) ?? id
		}
	};
}

function carte(j: Jeu): CarteDisposee {
	return disposerLaCarte(j.graphe, {
		familleParNoeud: j.familleParNoeud,
		ordreDesFamilles: j.ordre,
		mesures: j.mesures,
		perimetre: { nom: 'Substack', code: 'SUB' }
	});
}

/** Les rectangles des libellés effectivement écrits — noms de famille compris. */
function rectangles(c: CarteDisposee, mesures: MesuresDeNoeud) {
	const boites: { x1: number; y1: number; x2: number; y2: number; quoi: string }[] = [];
	for (const f of c.familles) {
		const largeur = Math.max(
			largeurDeLibelle(f.nom) * (T_FAMILLE / T_NOEUD),
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
	for (const id of c.etiquettes) {
		const place = c.places.get(id);
		if (place === undefined) continue;
		const demi = largeurDeLibelle(libelleCourt(mesures.titre(id))) / 2;
		/* LE LIBELLÉ SE POSE SOUS LA PASTILLE, OU DESSUS quand le dessous est pris —
		   `disposition-carte.ts` le dit dans `etiquettesAuDessus`. Le mesurer toujours
		   dessous ferait crier ce contrôle sur des libellés qui ne se touchent pas. */
		const haut = c.etiquettesAuDessus.has(id)
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
	return boites;
}

const CORPUS_DENSE = [14, 12, 11, 9, 8, 7, 6, 6, 5, 4, 3, 2, 2];

/**
 * L'ANGLE DU SECTEUR D'UNE FAMILLE, ET NON L'ANGLE DE SA POSITION. L'anneau est une
 * ELLIPSE — étirée dans le rapport du repère pour que le dessin remplisse sa zone —,
 * si bien qu'une famille posée à un quart de tour ne se voit pas à quarante-cinq
 * degrés. On dés-étire avant de mesurer.
 */
/** La distance du centre du dessin au centre d'une famille, dés-étirée. */
function rayonDeLAnneau(c: CarteDisposee, i: number): number {
	const f = c.familles[i];
	if (f === undefined) return 1;
	return Math.hypot(
		(f.centre.x - c.centre.x) / ETIREMENT_X,
		(f.centre.y - c.centre.y) / ETIREMENT_Y
	);
}

function angleDeSecteur(
	c: CarteDisposee,
	f: { readonly centre: { readonly x: number; readonly y: number } }
): number {
	return Math.atan2(
		(f.centre.y - c.centre.y) / ETIREMENT_Y,
		(f.centre.x - c.centre.x) / ETIREMENT_X
	);
}

describe('la disposition de la carte', () => {
	it('pose le périmètre au centre et une famille par branche', () => {
		const j = jeu([5, 4, 3], 0);
		const c = carte(j);
		expect(c.centre.libelle).toBe('Substack');
		expect(c.centre.note).toBeNull();
		expect(c.familles.map((f) => f.nom)).toEqual(['Famille A', 'Famille B', 'Famille C']);
		/* Un trait du centre vers chaque pivot, puis un du pivot vers chaque note. */
		expect(c.squelette.length).toBe(3 + (5 - 1) + (4 - 1) + (3 - 1));
	});

	it('classe les familles par taille décroissante, dans le sens horaire depuis le haut', () => {
		const j = jeu([3, 9, 6], 0);
		const c = carte(j);
		expect(c.familles.map((f) => f.effectif)).toEqual([9, 6, 3]);

		/* Le sens horaire depuis le haut : l'angle croît, et le premier pivot est au
		   nord ou juste après. Dans le repère du dessin, l'ordonnée descend. */
		const angles = c.familles.map((f) => {
			const brut = angleDeSecteur(c, f) + Math.PI / 2;
			return (brut + 2 * Math.PI) % (2 * Math.PI);
		});
		expect(angles[0]).toBeLessThan(angles[1] as number);
		expect(angles[1]).toBeLessThan(angles[2] as number);
	});

	it('partage le tour au prorata du nombre de notes, minimums déduits', () => {
		/**
		 * CE QUE LA PROPORTIONNALITÉ VEUT DIRE, EXACTEMENT. Chaque famille garde
		 * d'abord le secteur sous lequel son disque se voit depuis le centre — sans
		 * quoi deux contours se toucheraient —, et c'est le SURPLUS qui se partage au
		 * prorata des effectifs. Le contrôle porte donc sur le surplus : deux familles
		 * de même taille reçoivent le même secteur, et une famille deux fois plus
		 * grosse en reçoit strictement plus.
		 *
		 * LA PROPORTIONNALITÉ NUE A ÉTÉ ESSAYÉE, ET MESURÉE : sur cent quarante-huit
		 * notes, une famille de deux reçoit huit centièmes de radian, ce qui repousse
		 * l'anneau à mille neuf cent cinquante unités et réduit le dessin entier au
		 * cinquième de sa taille lisible.
		 */
		const c = carte(jeu([24, 12, 12], 0));
		const secteur = (i: number): number => c.familles[i]?.secteur ?? 0;
		expect(secteur(1)).toBeCloseTo(secteur(2), 6);
		expect(secteur(0)).toBeGreaterThan(secteur(1));
		expect(secteur(0) + secteur(1) + secteur(2)).toBeCloseTo(2 * Math.PI, 6);

		/* Les rayons des trois familles sont connus : le surplus se partage 2 : 1 : 1. */
		const surplus = (i: number, r: number): number =>
			secteur(i) - 2 * Math.asin((r + 7) / rayonDeLAnneau(c, i));
		expect(surplus(0, 146) / surplus(1, 111)).toBeCloseTo(2, 1);
	});

	it('ne laisse jamais deux familles se recouvrir, même sur un corpus dense', () => {
		const c = carte(jeu(CORPUS_DENSE, 9));
		for (let i = 0; i < c.familles.length; i += 1) {
			for (let k = i + 1; k < c.familles.length; k += 1) {
				const a = c.familles[i];
				const b = c.familles[k];
				if (a === undefined || b === undefined) continue;
				const distance = Math.hypot(a.centre.x - b.centre.x, a.centre.y - b.centre.y);
				expect(distance, `« ${a.nom} » et « ${b.nom} » se recouvrent`).toBeGreaterThanOrEqual(
					a.rayon + b.rayon - 1e-6
				);
			}
		}
	});

	it('ne laisse jamais deux nœuds se recouvrir', () => {
		const c = carte(jeu(CORPUS_DENSE, 9));
		const noeuds = [...c.places.values()];
		for (let i = 0; i < noeuds.length; i += 1) {
			for (let k = i + 1; k < noeuds.length; k += 1) {
				const a = noeuds[i];
				const b = noeuds[k];
				if (a === undefined || b === undefined) continue;
				const distance = Math.hypot(a.x - b.x, a.y - b.y);
				expect(distance, `${a.id} et ${b.id} se recouvrent`).toBeGreaterThan(a.r + b.r);
			}
		}
	});

	it("n'écrit jamais un libellé par-dessus un autre", () => {
		const j = jeu(CORPUS_DENSE, 9);
		const c = carte(j);
		const boites = rectangles(c, j.mesures);
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

	it('écrit le nom de CHAQUE famille, une seule fois', () => {
		const j = jeu(CORPUS_DENSE, 9);
		const c = carte(j);
		const noms = c.familles.map((f) => f.nom);
		expect(new Set(noms).size).toBe(noms.length);
		expect(noms).toContain(NOM_DES_ISOLEES);
	});

	it('range les notes sans famille et sans relation dans « Isolées », en périphérie', () => {
		const j = jeu([8, 6], 7);
		const c = carte(j);
		const isolees = c.familles.find((f) => f.nom === NOM_DES_ISOLEES);
		expect(isolees?.effectif).toBe(7);

		const distance = (f: { centre: { x: number; y: number } }): number =>
			Math.hypot(f.centre.x - c.centre.x, f.centre.y - c.centre.y);
		for (const f of c.familles) {
			if (f.nom === NOM_DES_ISOLEES) continue;
			expect(distance(isolees as never)).toBeGreaterThan(distance(f));
		}
	});

	it('rend exactement le même dessin à chaque appel', () => {
		const j = jeu(CORPUS_DENSE, 9);
		expect(JSON.stringify([...carte(j).places])).toBe(JSON.stringify([...carte(j).places]));
	});

	it("ne dépend pas de l'ordre dans lequel les notes arrivent", () => {
		const j = jeu([7, 5, 4], 3);
		const inverse: Jeu = {
			...j,
			graphe: {
				...j.graphe,
				noeuds: [...j.graphe.noeuds].reverse()
			}
		};
		const a = carte(j);
		const b = carte(inverse);
		for (const [id, place] of a.places) {
			const autre = b.places.get(id);
			expect(autre?.x).toBeCloseTo(place.x, 6);
			expect(autre?.y).toBeCloseTo(place.y, 6);
		}
	});

	it("ne nomme un trait que s'il est long et que la place est libre", () => {
		/**
		 * DEUX RAISONS DE SE TAIRE, ET ELLES SE MESURENT. Un trait plus court que son
		 * mot ne peut pas le porter ; un mot qui en heurterait un autre est tu. Sur
		 * l'instance de recette, une douzaine de milieux tombaient au même endroit et
		 * le tas se lisait « dédudéduite ».
		 */
		const ecrits = etiquettesDeRelation([
			{ cle: 'long-libre', x: 0, y: 0, texte: 'déclarée', portee: 400 },
			{ cle: 'long-heurte', x: 8, y: 4, texte: 'déclarée', portee: 400 },
			{ cle: 'court', x: 900, y: 900, texte: 'déclarée', portee: 12 },
			{ cle: 'long-ailleurs', x: 900, y: 0, texte: 'déduite', portee: 400 }
		]);
		expect([...ecrits].sort()).toEqual(['long-ailleurs', 'long-libre']);
	});

	it('coupe le titre du centre à ce que son disque porte', () => {
		/* IL Y EST ÉCRIT EN BLANC : ce qui déborde du disque tombe sur fond blanc et
		   DISPARAÎT. « 2026_05_18_Fusion DIN… » se lisait « 5_18_Fusion ». */
		const long = '2026_05_18_Fusion DINUM-DITP - la refondation introuvable';
		expect(libelleDuCentre(long, 48).length).toBeLessThan(libelleCourt(long).length);
		expect(libelleDuCentre(long, 48).endsWith('…')).toBe(true);
		expect(libelleDuCentre('Substack', 48)).toBe('Substack');
		/* Un disque deux fois plus grand en porte deux fois plus. */
		expect(libelleDuCentre(long, 96).length).toBeGreaterThan(libelleDuCentre(long, 48).length);
	});

	it('coupe un titre trop long et laisse le titre entier au survol', () => {
		const long = 'Un titre beaucoup trop long pour tenir sous une pastille';
		expect(libelleCourt(long).length).toBeLessThanOrEqual(CARACTERES_DUN_LIBELLE);
		expect(libelleCourt(long).endsWith('…')).toBe(true);
		expect(libelleCourt('Court')).toBe('Court');
	});

	it("n'écrit d'office que les libellés des pivots", () => {
		const j = jeu([9, 7, 5], 4);
		const c = carte(j);
		for (const id of c.etiquettes) expect(c.places.get(id)?.pivot).toBe(true);
	});
});

/* ── LE VOISINAGE ──────────────────────────────────────────────────────────── */

interface JeuDeVoisinage {
	readonly graphe: Graphe;
	readonly options: Parameters<typeof disposerLeVoisinage>[1];
}

function voisinageDEpreuve(): JeuDeVoisinage {
	const notes: Note[] = [note('n-centre', 'Claude Code')];
	const relations: Relation[] = [];
	const familleParNoeud = new Map<string, string>([['n-centre', 'Outils & Tech']]);
	const familles = ['Outils & Tech', 'Installation', 'Documentation'];

	/* Six voisins directs répartis sur trois familles, chacun portant deux voisins
	   de deuxième niveau : de quoi éprouver les secteurs et les couronnes. */
	for (let i = 0; i < 6; i += 1) {
		const id = `n-v${i}`;
		notes.push(note(id, `Voisin numéro ${i} au titre long`));
		familleParNoeud.set(id, familles[i % 3] as string);
		relations.push({ de: 'n-centre', vers: id, type: 'documente' } as unknown as Relation);
		for (let k = 0; k < 2; k += 1) {
			const petit = `n-v${i}-${k}`;
			notes.push(note(petit, `Petit voisin ${i}.${k}`));
			familleParNoeud.set(petit, familles[i % 3] as string);
			relations.push({ de: id, vers: petit, type: 'documente' } as unknown as Relation);
		}
	}

	const graphe = sousGraphe(notes, { type: 'global' }, relations, 'gardees');
	const voisins = new Map<string, string[]>();
	for (const r of relations) {
		(voisins.get(r.de) ?? voisins.set(r.de, []).get(r.de) ?? []).push(r.vers);
		(voisins.get(r.vers) ?? voisins.set(r.vers, []).get(r.vers) ?? []).push(r.de);
	}
	const distances = new Map<string, number>([['n-centre', 0]]);
	for (let i = 0; i < 6; i += 1) {
		distances.set(`n-v${i}`, 1);
		for (let k = 0; k < 2; k += 1) distances.set(`n-v${i}-${k}`, 2);
	}

	const titres = new Map<string, string>(notes.map((n) => [n.id as string, n.titre] as const));
	return {
		graphe,
		options: {
			centre: 'n-centre',
			familleParNoeud,
			ordreDesFamilles: familles,
			mesures: {
				rayon: () => NOEUD_MAXIMUM,
				degre: (id) => voisins.get(id)?.length ?? 0,
				centralite: () => 0,
				titre: (id) => titres.get(id) ?? id
			},
			distances,
			voisinsDe: (id) => voisins.get(id) ?? [],
			code: 'CLI'
		}
	};
}

describe('le voisinage', () => {
	it('met la note au centre, ses voisins autour, et leurs voisins au-delà', () => {
		const j = voisinageDEpreuve();
		const c = disposerLeVoisinage(j.graphe, j.options);
		expect(c.centre.note).toBe('n-centre');
		expect(c.centre.libelle).toBe('Claude Code');

		const rayon = (id: string): number => {
			const p = c.places.get(id);
			return p === undefined ? 0 : Math.hypot(p.x, p.y);
		};
		/* CHAQUE VOISIN DE PROFONDEUR 2 EST AU-DELÀ DE SON VOISIN DE PROFONDEUR 1 :
		   c'est la seule lecture que le dessin doit garantir, et le trait du
		   squelette la donne à voir. Les voisins directs ne sont PAS tous à la même
		   distance — ils sont groupés par famille en amas compacts, et un amas de
		   quatre membres est plus large qu'un amas d'un seul. */
		for (let i = 0; i < 6; i += 1) {
			for (let k = 0; k < 2; k += 1) {
				expect(rayon(`n-v${i}-${k}`)).toBeGreaterThan(rayon(`n-v${i}`));
			}
		}
	});

	it('place un voisin de profondeur 2 dans le secteur de son voisin de profondeur 1', () => {
		const j = voisinageDEpreuve();
		const c = disposerLeVoisinage(j.graphe, j.options);
		const parent = c.places.get('n-v3');
		const enfant = c.places.get('n-v3-1');
		if (parent === undefined || enfant === undefined) throw new Error('places manquantes');
		const ecart = Math.abs(Math.atan2(parent.y, parent.x) - Math.atan2(enfant.y, enfant.x));
		expect(Math.min(ecart, 2 * Math.PI - ecart)).toBeLessThan(Math.PI / 6);
	});

	it('ne laisse aucun contour en recouvrir un autre, à toute profondeur', () => {
		/**
		 * DEUX AMAS SONT DEUX CÔNES DISJOINTS ISSUS DU CENTRE, et c'est ce qui rend la
		 * propriété tenable : la descendance d'un voisin reste dans le secteur de son
		 * amas, et le contour d'une famille se borne à son amas. Le contrôle mesure la
		 * distance entre les enveloppes, sur les deux profondeurs.
		 */
		const j = voisinageDEpreuve();
		const c = disposerLeVoisinage(j.graphe, j.options);
		for (let i = 0; i < c.familles.length; i += 1) {
			for (let k = i + 1; k < c.familles.length; k += 1) {
				const a = c.familles[i];
				const b = c.familles[k];
				if (a === undefined || b === undefined) continue;
				const distance = Math.hypot(a.centre.x - b.centre.x, a.centre.y - b.centre.y);
				expect(distance, `« ${a.nom} » et « ${b.nom} » se recouvrent`).toBeGreaterThanOrEqual(
					a.rayon + b.rayon - 1e-6
				);
			}
		}
	});

	it('regroupe les voisins par famille sous un contour nommé', () => {
		const j = voisinageDEpreuve();
		const c = disposerLeVoisinage(j.graphe, j.options);
		expect(c.familles.map((f) => f.nom).sort()).toEqual([
			'Documentation',
			'Installation',
			'Outils & Tech'
		]);
		for (const f of c.familles) expect(f.effectif).toBe(6);
	});

	it("n'écrit jamais un libellé par-dessus un autre, et les écrit tous", () => {
		const j = voisinageDEpreuve();
		const c = disposerLeVoisinage(j.graphe, j.options);
		/* Tous les nœuds sauf le centre, dont le titre est écrit dans son disque. */
		expect(c.etiquettes.size).toBe(c.places.size - 1);

		const boites = rectangles(c, j.options.mesures);
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

	it('rend exactement le même dessin à chaque appel', () => {
		const j = voisinageDEpreuve();
		const a = disposerLeVoisinage(j.graphe, j.options);
		const b = disposerLeVoisinage(j.graphe, j.options);
		expect(JSON.stringify([...a.places])).toBe(JSON.stringify([...b.places]));
	});
});
