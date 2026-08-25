/**
 * LE CHEMIN « COCHER → CLÉ D'ADRESSE », et lui seul.
 *
 * Ce que les unitaires de vue ne prouvent pas : ils passent `retenues`
 * DIRECTEMENT à la vue et n'établissent donc que le moteur de filtrage. Le
 * défaut vivait en amont — dans la façon dont le câblage retrouve QUELLE
 * facette un menu porte. Il l'identifiait par son RANG, alors qu'une vue ne
 * rend pas les facettes sans valeur : sur un domaine dont aucun signet ne
 * porte d'étiquette, le seul menu rendu est « Auteur », au rang 0, et cocher
 * un auteur écrivait `?etiquette={nom de l'auteur}`.
 *
 * POURQUOI UN DOCUMENT FEINT. La configuration de vitest monte l'environnement
 * `node` — elle est partagée par tous les lots, et la gréer d'un document
 * complet pour deux cas serait un coût porté par tout le dépôt. Le module ne
 * touche que quatre gestes du document : remonter au plus proche ancêtre, lire
 * un attribut, lire un libellé, et changer d'adresse. Ce sont les quatre qui
 * sont feints, et le module éprouvé est le vrai.
 */
import { describe, it, expect } from 'vitest';
import { ATTRIBUT_DE_FACETTE, cablerLesFacettes, facetteDuMenu } from './facettes';

/** Les deux facettes que `docs/routes.md` §4.2 déclare pour la liste des signets. */
const FACETTES = [
	{ id: 'etiquette', nom: 'Étiquette', prefixe: '#' },
	{ id: 'auteur', nom: 'Auteur' }
] as const;

/* ── Le document feint ──────────────────────────────────────────────────── */

interface NoeudFeint {
	readonly classes: readonly string[];
	readonly attributs: Record<string, string>;
	readonly enfants: NoeudFeint[];
	parent: NoeudFeint | null;
	texte: string;
	coche: boolean;
	closest(selecteur: string): NoeudFeint | null;
	querySelector(selecteur: string): NoeudFeint | null;
	querySelectorAll(selecteur: string): NoeudFeint[];
	getAttribute(nom: string): string | null;
	readonly textContent: string;
	readonly checked: boolean;
}

/** Les classes d'un sélecteur de descendance, de l'ancêtre au nœud visé. */
function etages(selecteur: string): string[] {
	return selecteur
		.trim()
		.split(/\s+/)
		.map((c) => c.replace(/^\./, ''));
}

function noeud(classes: string, attributs: Record<string, string> = {}): NoeudFeint {
	const lui: NoeudFeint = {
		classes: classes.split(/\s+/).filter((c) => c !== ''),
		attributs,
		enfants: [],
		parent: null,
		texte: '',
		coche: false,
		get textContent(): string {
			return lui.texte + lui.enfants.map((e) => e.textContent).join('');
		},
		get checked(): boolean {
			return lui.coche;
		},
		getAttribute: (nom) => lui.attributs[nom] ?? null,
		closest: (selecteur) => {
			const chemin = etages(selecteur);
			const vise = chemin[chemin.length - 1] ?? '';
			const ancetres = chemin.slice(0, -1);
			for (let n: NoeudFeint | null = lui; n !== null; n = n.parent) {
				if (!n.classes.includes(vise)) continue;
				if (ancetres.every((a) => remonteVers(n, a))) return n;
			}
			return null;
		},
		querySelector: (selecteur) => lui.querySelectorAll(selecteur)[0] ?? null,
		querySelectorAll: (selecteur) => {
			const vise = etages(selecteur)[0] ?? '';
			const trouves: NoeudFeint[] = [];
			const descendre = (n: NoeudFeint): void => {
				for (const e of n.enfants) {
					if (e.classes.includes(vise)) trouves.push(e);
					descendre(e);
				}
			};
			descendre(lui);
			return trouves;
		}
	};
	return lui;
}

/** Vrai si un ancêtre STRICT du nœud porte la classe. */
function remonteVers(depuis: NoeudFeint, classe: string): boolean {
	for (let n = depuis.parent; n !== null; n = n.parent) if (n.classes.includes(classe)) return true;
	return false;
}

function greffer(pere: NoeudFeint, fils: NoeudFeint): NoeudFeint {
	fils.parent = pere;
	pere.enfants.push(fils);
	return fils;
}

interface Planche {
	readonly racine: NoeudFeint;
	readonly boites: Record<string, NoeudFeint>;
	readonly allees: string[];
	changer(boite: NoeudFeint, coche: boolean): void;
	defaire(): void;
}

/**
 * Une barre de facettes telle que la vue la rend : un menu par facette
 * DÉCLARÉE ET NON VIDE, chacun portant son identifiant et une valeur cochable.
 */
function planche(
	adresse: string,
	menus: readonly { readonly id: string; readonly nom: string; readonly valeur: string }[],
	options: { readonly identifiants: boolean } = { identifiants: true }
): Planche {
	const racine = noeud('barre-outils');
	const boites: Record<string, NoeudFeint> = {};
	for (const m of menus) {
		const menu = greffer(
			racine,
			noeud('fac-menu', options.identifiants ? { [ATTRIBUT_DE_FACETTE]: m.id } : {})
		);
		const boite = greffer(menu, noeud('val'));
		const nom = greffer(boite, noeud('val__nom'));
		nom.texte = m.valeur;
		boites[m.id] = boite;
	}

	const allees: string[] = [];
	let courante = adresse;
	const document = {
		location: {
			get href(): string {
				return courante;
			},
			assign: (ou: string): void => {
				allees.push(ou);
				courante = ou;
			}
		},
		defaultView: {}
	};
	Object.defineProperty(racine, 'ownerDocument', { value: document });

	const ecouteurs: Record<string, ((e: unknown) => void)[]> = {};
	Object.defineProperty(racine, 'addEventListener', {
		value: (type: string, f: (e: unknown) => void) => (ecouteurs[type] ??= []).push(f)
	});
	Object.defineProperty(racine, 'removeEventListener', { value: () => {} });

	const defaire = cablerLesFacettes(racine as unknown as ParentNode, { facettes: FACETTES });

	return {
		racine,
		boites,
		allees,
		changer: (boite, coche) => {
			const entree = greffer(boite, noeud('coche'));
			entree.coche = coche;
			for (const f of ecouteurs['change'] ?? []) f({ target: entree });
			boite.enfants.pop();
		},
		defaire
	};
}

/* ── Les cas ────────────────────────────────────────────────────────────── */

describe('la facette qu’un menu rendu désigne', () => {
	it('se lit sur l’identifiant que le menu porte, et le rang ne décide pas', () => {
		expect(facetteDuMenu(FACETTES, 'auteur', 0)?.id).toBe('auteur');
		expect(facetteDuMenu(FACETTES, 'etiquette', 1)?.id).toBe('etiquette');
	});

	it('retombe sur le rang quand le balisage ne porte pas d’identifiant', () => {
		expect(facetteDuMenu(FACETTES, null, 0)?.id).toBe('etiquette');
		expect(facetteDuMenu(FACETTES, '', 1)?.id).toBe('auteur');
		expect(facetteDuMenu(FACETTES, null, -1)).toBeUndefined();
	});

	it('ne rend rien pour un identifiant que la page ne déclare pas', () => {
		expect(facetteDuMenu(FACETTES, 'dossier', 0)).toBeUndefined();
	});
});

describe('cocher une valeur écrit la clé d’adresse de SA facette', () => {
	const ADRESSE = 'https://exemple.test/univers/gouvernance/doctrine/signets';

	it('les deux menus rendus — chaque facette écrit sa propre clé', () => {
		const p = planche(ADRESSE, [
			{ id: 'etiquette', nom: 'Étiquette', valeur: '#postgresql' },
			{ id: 'auteur', nom: 'Auteur', valeur: 'Karim Belhadj' }
		]);
		p.changer(p.boites['auteur'] as NoeudFeint, true);
		expect(p.allees[0]).toBe(`${ADRESSE}?auteur=Karim+Belhadj`);
		p.defaire();
	});

	it('LE DÉFAUT — un seul menu rendu, parce qu’aucun signet ne porte d’étiquette', () => {
		const p = planche(ADRESSE, [{ id: 'auteur', nom: 'Auteur', valeur: 'Karim Belhadj' }]);
		p.changer(p.boites['auteur'] as NoeudFeint, true);
		expect(p.allees[0]).toBe(`${ADRESSE}?auteur=Karim+Belhadj`);
		expect(p.allees[0]).not.toContain('etiquette=');
		p.defaire();
	});

	it('le rang seul, lui, écrivait la clé de la facette voisine', () => {
		const p = planche(ADRESSE, [{ id: 'auteur', nom: 'Auteur', valeur: 'Karim Belhadj' }], {
			identifiants: false
		});
		p.changer(p.boites['auteur'] as NoeudFeint, true);
		expect(p.allees[0]).toBe(`${ADRESSE}?etiquette=Karim+Belhadj`);
		p.defaire();
	});

	it('le préfixe d’affichage est retiré de la valeur portée par l’adresse', () => {
		const p = planche(ADRESSE, [{ id: 'etiquette', nom: 'Étiquette', valeur: '#postgresql' }]);
		p.changer(p.boites['etiquette'] as NoeudFeint, true);
		expect(p.allees[0]).toBe(`${ADRESSE}?etiquette=postgresql`);
		p.defaire();
	});

	it('décocher retire la valeur, et elle seule', () => {
		const p = planche(`${ADRESSE}?auteur=Karim+Belhadj&auteur=Sophie+Nguyen`, [
			{ id: 'auteur', nom: 'Auteur', valeur: 'Karim Belhadj' }
		]);
		p.changer(p.boites['auteur'] as NoeudFeint, false);
		expect(p.allees[0]).toBe(`${ADRESSE}?auteur=Sophie+Nguyen`);
		p.defaire();
	});
});
