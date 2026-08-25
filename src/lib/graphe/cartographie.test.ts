/**
 * L'ENCODAGE DES TYPES CARTOGRAPHIQUES — le libellé, la forme et le code.
 *
 * CE QUE CES CONTRÔLES NE FONT PAS : fabriquer eux-mêmes les noms de types
 * qu'ils éprouvent. Un contrôle qui construit son entrée ne prouve rien de la
 * forme réelle de cette entrée. Les noms viennent donc de LEURS SOURCES, celles
 * qui écrivent réellement les lignes de `types_de_fiche` et de `types_de_note` :
 *
 *   • `lignesDeTypeDeFiche()` et `typesDeFicheDOrganisation()` — les deux
 *     moitiés de ce que `base:semer` insère (`commandes.ts:491-494`) ; la
 *     seconde porte « Processus » et « Prestataire », hors de la table du gel ;
 *   • `TYPES_DE_FICHE` de `seeds/demonstration.ts` — ce que `base:peupler`
 *     insère (`demonstration.ts:292-294`) ; il porte « Équipement réseau »,
 *     hors de la table du gel lui aussi ;
 *   • `TypeDeNote` de `seeds/corpus.ts`, les cinq noms de la migration
 *     `007_types_de_note` — dont « Fiche », que la table du gel ignore.
 *
 * Le reste — un nom saisi en console — n'a d'autre contrainte que d'être non
 * vide après élagage (`administration.ts:2103`) : c'est cette liberté-là que la
 * dérivation doit tenir.
 */
import { describe, expect, it } from 'vitest';
import { typesDeFicheDOrganisation } from '../base/semence-organisation';
import { lignesDeTypeDeFiche } from '../base/semence';
import { TYPES, encodageDuType, sousGraphe, typeDe, typesPresents } from './cartographie';
import {
	CORPUS,
	RELATIONS,
	type Note,
	type TypeDeFiche,
	type TypeDeNote
} from '../../../seeds/corpus';
import { TYPES_DE_FICHE } from '../../../seeds/demonstration';

/** Les cinq noms de type de note de `007_types_de_note.montee.sql`, par le type. */
const TYPES_DE_NOTE: readonly TypeDeNote[] = ['Procédure', 'Guide', 'Note', 'Fiche', 'Signet'];

/** Tous les noms de type de fiche que les deux chargements écrivent en base. */
const NOMS_CHARGES: readonly string[] = [
	...lignesDeTypeDeFiche().map((t) => t.nom),
	...typesDeFicheDOrganisation().map((t) => t.nom),
	...TYPES_DE_FICHE.map((t) => t.nom)
];

/** Ceux d'entre eux que la table du gel ignore — les seuls à passer par la dérivation. */
const NOMS_HORS_GEL: readonly string[] = [...new Set(NOMS_CHARGES)].filter(
	(nom) => !TYPES.has(nom)
);

/**
 * Un graphe de deux nœuds portant les deux premiers noms hors gel.
 *
 * L'arête vient de `RELATIONS` : `sousGraphe()` retire tout nœud que rien ne
 * relie, un graphe de deux notes prises au hasard serait donc VIDE. Le
 * transtypage du nom en type de fiche est celui que le produit fait lui-même à
 * la lecture (`lecture.ts:467`) : la colonne porte un texte libre.
 */
function grapheDeDeuxTypesHorsGel(): ReturnType<typeof sousGraphe> {
	const arete = RELATIONS[0];
	if (arete === undefined) throw new Error('le corpus ne porte aucune relation');
	const retypee = (n: Note, rang: number): Note => ({
		...n,
		type: 'Fiche',
		typeFiche: NOMS_HORS_GEL[rang] as TypeDeFiche
	});
	const notes = CORPUS.map((n) => {
		if (n.id === arete.de) return retypee(n, 0);
		if (n.id === arete.vers) return retypee(n, 1);
		return n;
	});
	return sousGraphe(notes, { type: 'global' }, [arete]);
}

describe('l’encodage d’un type que la table du gel ne porte pas', () => {
	it('a bien de quoi être éprouvé : les chargements posent des noms hors du gel', () => {
		/* Si cette liste se vidait, tous les contrôles qui suivent deviendraient
		   vacuement verts. Elle porte aujourd'hui « Processus », « Prestataire » et
		   « Équipement réseau ». */
		expect(NOMS_HORS_GEL.length).toBeGreaterThanOrEqual(3);
	});

	it('rend le VRAI nom, plus jamais « Note »', () => {
		for (const nom of NOMS_HORS_GEL) {
			expect(encodageDuType(nom).nom).toBe(nom);
		}
	});

	it('ne reprend aucun des sept codes du gel', () => {
		const codesDuGel = new Set([...TYPES.values()].map((t) => t.code));
		for (const nom of NOMS_HORS_GEL) {
			expect(codesDuGel.has(encodageDuType(nom).code)).toBe(false);
		}
	});

	it('distingue « Processus » de « Procédure », que trois lettres confondaient', () => {
		/* Le cas est produit par la source, non inventé : « Procédure » vient de la
		   migration des types de note, « Processus » du peuplement. */
		const processus = NOMS_HORS_GEL.find((nom) => nom.startsWith('Proc'));
		expect(processus).toBeDefined();
		if (processus === undefined) return;
		expect(encodageDuType(processus).code).not.toBe(encodageDuType('Procédure').code);
		expect(encodageDuType(processus).nom).not.toBe(encodageDuType('Procédure').nom);
	});

	it('donne à chacun un encodage propre — nom, code, forme et teinte confondus', () => {
		const vus = new Set<string>();
		for (const nom of NOMS_HORS_GEL) {
			const t = encodageDuType(nom);
			const empreinte = [t.nom, t.code, t.forme, t.couleur].join('|');
			expect(vus.has(empreinte)).toBe(false);
			vus.add(empreinte);
		}
	});

	it('choisit une forme et une teinte du gel, jamais une valeur inventée', () => {
		const formes = new Set([...TYPES.values()].map((t) => t.forme));
		const teintes = new Set([...TYPES.values()].map((t) => t.couleur));
		for (const nom of NOMS_HORS_GEL) {
			expect(formes.has(encodageDuType(nom).forme)).toBe(true);
			expect(teintes.has(encodageDuType(nom).couleur)).toBe(true);
		}
	});

	it('ne reprend aucun couple forme-teinte du gel', () => {
		/* Sans quoi « Fiche » se présenterait en carré teal comme « Serveur » :
		   même forme, même couleur, un code pour toute différence. */
		const prises = new Set([...TYPES.values()].map((t) => `${t.forme}|${t.couleur}`));
		for (const nom of NOMS_HORS_GEL) {
			const t = encodageDuType(nom);
			expect(prises.has(`${t.forme}|${t.couleur}`)).toBe(false);
		}
	});

	it('est stable : deux appels rendent le même encodage', () => {
		for (const nom of NOMS_HORS_GEL) {
			expect(encodageDuType(nom)).toEqual(encodageDuType(nom));
		}
	});

	it('nomme « Fiche », le cinquième type de note que la table du gel omet', () => {
		/* Une note de type Fiche sans type de fiche s'étiquetait « Note ». */
		expect(TYPES.has('Fiche')).toBe(false);
		expect(encodageDuType('Fiche').nom).toBe('Fiche');
	});

	it('rend trois caractères même pour un nom d’une seule lettre', () => {
		expect(encodageDuType('X').code).toHaveLength(3);
	});

	it('ne retombe sur le repli du gel que pour un nom vide', () => {
		expect(encodageDuType('   ').nom).toBe('Note');
	});
});

describe('les sept clés du gel — le rendu ne bouge pas d’un pixel', () => {
	it('rend l’objet du gel lui-même pour chacune de ses clés', () => {
		for (const [cle, encodage] of TYPES) {
			expect(encodageDuType(cle)).toBe(encodage);
		}
	});

	it('rend l’objet du gel pour les trois types de fiche du corpus de démonstration', () => {
		/* Ces trois-là sont dans la table : le banc ne passe jamais par la
		   dérivation, et son rendu ne bouge donc pas d'un pixel. */
		for (const ligne of lignesDeTypeDeFiche()) {
			expect(TYPES.has(ligne.nom)).toBe(true);
			expect(encodageDuType(ligne.nom).nom).toBe(ligne.nom);
		}
	});

	it('nomme chaque type de fiche que les deux chargements écrivent', () => {
		for (const nom of NOMS_CHARGES) {
			expect(encodageDuType(nom).nom).toBe(nom);
		}
	});

	it('encode chaque note du corpus de démonstration sous son propre nom', () => {
		for (const note of CORPUS) {
			expect(typeDe(note).nom).toBe(note.typeFiche ?? note.type);
		}
	});
});

describe('la barre des types présents — deux pastilles ne se confondent plus', () => {
	it('nomme distinctement deux types que le graphe porte côte à côte', () => {
		const presents = typesPresents(grapheDeDeuxTypesHorsGel());
		expect(presents).toHaveLength(2);
		expect(presents.map((p) => p.type.nom).sort()).toEqual([...NOMS_HORS_GEL].slice(0, 2).sort());
		expect(new Set(presents.map((p) => p.type.code)).size).toBe(2);
	});

	it('garde la clé de filtre égale au nom affiché', () => {
		/* C'est ce que le libellé fautif rompait : la pastille filtrait sur un type
		   et en nommait un autre. */
		const presents = typesPresents(grapheDeDeuxTypesHorsGel());
		expect(presents.length).toBeGreaterThan(0);
		for (const present of presents) {
			expect(present.type.nom).toBe(present.cle);
		}
	});
});

describe('les cinq types de note de la migration', () => {
	it('sont tous nommés par leur nom, dérivation comprise', () => {
		for (const nom of TYPES_DE_NOTE) {
			expect(encodageDuType(nom).nom).toBe(nom);
		}
	});

	it('portent cinq codes deux à deux distincts', () => {
		const codes = TYPES_DE_NOTE.map((nom) => encodageDuType(nom).code);
		expect(new Set(codes).size).toBe(TYPES_DE_NOTE.length);
	});
});
