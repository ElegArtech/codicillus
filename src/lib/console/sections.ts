/**
 * Console — le catalogue des sections, et rien d'autre. Les dix vues de console partagent
 * treize classes, et `aside.nav2` est IDENTIQUE À L'OCTET dans les dix maquettes : ce fichier
 * porte la donnée de cette navigation, le balisage est dans `NavigationConsole.svelte`.
 *
 * CE FICHIER EST UNE FONCTION PURE DE SES ARGUMENTS. Il portait un CATALOGUE DE MODULE figé à
 * l'import, qui lisait le jeu de démonstration pour ses sept compteurs et pour le libellé
 * « Types de fiches » — renommer le mot en console n'avait donc aucun effet. Ce module ne peut
 * lire ni la base ni un contexte : la sortie est la SUBSTITUTION PAR FONCTION.
 *
 * LES HUIT COMPTEURS VALENT ZÉRO dans le catalogue nu, et zéro n'est pas un repli : c'est ce
 * qu'une instance sans univers porte vraiment. `compte === undefined` reste réservé aux TROIS
 * sections que le gel ne compte pas, et cette distinction décide de l'émission du
 * `span.nav2__n`.
 */
import type { VocabulaireRendu } from '../vocabulaire';

/**
 * Les onze sections. Les dix premières sont celles du gel, dans son ordre ; la
 * onzième — `notes` — n'y est pas dessinée, et c'est le défaut que `RG-REF-03`
 * paie. La clé est celle que la maquette donne à `rendreConsole(sectionCourante)`
 * et à `<option value>`.
 */
export type CleDeSection =
	| 'univers'
	| 'domaines'
	/** `types_de_note` — la nomenclature des notes, à ne pas confondre avec `fiches`. */
	| 'notes'
	| 'fiches'
	| 'relations'
	| 'templates'
	| 'comptes'
	| 'imports'
	| 'exports'
	| 'analytique'
	| 'configuration';

/**
 * Un trait de pictogramme, tel que le gel l'écrit. Les dix pictogrammes sont des
 * fragments SVG littéraux dans la maquette ; ils sont décomposés ici en primitives
 * typées plutôt que gardés en chaîne — une chaîne de balisage demanderait `{@html}`,
 * que rien n'oblige à employer et que le compilateur ne relit pas.
 */
export type TraitDePictogramme =
	| { readonly forme: 'path'; readonly d: string }
	| {
			readonly forme: 'rect';
			readonly x: string;
			readonly y: string;
			readonly largeur: string;
			readonly hauteur: string;
			readonly rx: string;
	  }
	| { readonly forme: 'circle'; readonly cx: string; readonly cy: string; readonly r: string };

export interface SectionDeConsole {
	readonly cle: CleDeSection;
	readonly nom: string;
	readonly pictogramme: readonly TraitDePictogramme[];
	/**
	 * Le compteur affiché en pastille. Absent : la section n'en porte pas — Exports,
	 * Analytique et Configuration, et le gel le veut ainsi.
	 */
	readonly compte?: number;
}

export interface GroupeDeSections {
	readonly nom: string;
	readonly sections: readonly SectionDeConsole[];
}

/**
 * Le catalogue — trois groupes, onze sections. Les dix du gel sont dans son ordre ;
 * « Types de note » s'insère entre « Domaines » et « Types de fiches », parce que la
 * nomenclature des notes précède celle de leurs formes structurées.
 *
 * UNE FONCTION, PARCE QUE LE LIBELLÉ D'UNE SECTION DÉPEND DE LA CONFIGURATION : « Types de
 * fiches » porte le terme renommable de `M14.7`, et le figer à l'import rendait le renommage
 * inopérant. Les huit compteurs sortent à zéro, et `effectifs.ts` y substitue la mesure de la
 * base — les huit, imports compris depuis que `lots_d_import` existe (migration `009`). Le
 * gel écrit `compte: () => 1` ; c'est un nombre de maquette, jamais une valeur du produit.
 */
export function groupesDeConsole(vocabulaire: VocabulaireRendu): readonly GroupeDeSections[] {
	return [
		{
			nom: 'Contenus',
			sections: [
				{
					cle: 'univers',
					nom: 'Univers',
					compte: 0,
					pictogramme: [
						{ forme: 'rect', x: '2', y: '2.5', largeur: '12', hauteur: '11', rx: '1.4' },
						{ forme: 'path', d: 'M2 6h12' }
					]
				},
				{
					cle: 'domaines',
					nom: 'Domaines',
					compte: 0,
					pictogramme: [
						{
							forme: 'path',
							d: 'M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z'
						}
					]
				},
				{
					/* LES TYPES DE NOTE — `RG-REF-03`. Ils venaient d'un `INSERT` de migration
					   et AUCUNE adresse ne les gérait : la règle « un type de note ne peut
					   être supprimé s'il est utilisé ; une réaffectation est proposée » ne
					   pouvait être tenue faute d'écran où la tenir. Le libellé n'est PAS
					   renommable — « Note » est un mot du produit, `M14.7` ne renomme que
					   le concept de fiche. */
					cle: 'notes',
					nom: 'Types de note',
					compte: 0,
					pictogramme: [
						{ forme: 'path', d: 'M3.5 2.2h5.2L12.5 6v7.8H3.5z' },
						{ forme: 'path', d: 'M8.7 2.2V6h3.8' },
						{ forme: 'path', d: 'M5.8 8.8h4.4M5.8 11.2h3' }
					]
				},
				{
					cle: 'fiches',
					nom: `Types de ${vocabulaire.fichesMin}`,
					compte: 0,
					pictogramme: [
						{ forme: 'rect', x: '2', y: '3', largeur: '12', hauteur: '10', rx: '1.4' },
						{ forme: 'path', d: 'M2 6h12M5.5 9h5' }
					]
				},
				{
					cle: 'relations',
					nom: 'Types de relations',
					compte: 0,
					pictogramme: [
						{ forme: 'circle', cx: '4', cy: '4', r: '2' },
						{ forme: 'circle', cx: '12', cy: '12', r: '2' },
						{ forme: 'path', d: 'M5.6 5.6l4.8 4.8' }
					]
				},
				{
					cle: 'templates',
					nom: 'Templates',
					compte: 0,
					pictogramme: [
						{ forme: 'rect', x: '2', y: '2.5', largeur: '12', hauteur: '11', rx: '1.4' },
						{ forme: 'path', d: 'M2 6h12M6 6v7.5' }
					]
				}
			]
		},
		{
			nom: 'Utilisateurs',
			sections: [
				{
					cle: 'comptes',
					nom: 'Comptes',
					compte: 0,
					pictogramme: [
						{ forme: 'circle', cx: '8', cy: '5.5', r: '2.6' },
						{ forme: 'path', d: 'M2.8 13.5a5.2 5.2 0 0 1 10.4 0' }
					]
				}
			]
		},
		{
			nom: 'Système',
			sections: [
				{
					cle: 'imports',
					nom: 'Imports',
					compte: 0,
					pictogramme: [{ forme: 'path', d: 'M8 10.5V2M4.8 6.2L8 2.8l3.2 3.4M2.5 13.5h11' }]
				},
				{
					cle: 'exports',
					nom: 'Exports',
					pictogramme: [{ forme: 'path', d: 'M8 2v8.5M4.8 7.3L8 10.7l3.2-3.4M2.5 13.5h11' }]
				},
				{
					cle: 'analytique',
					nom: 'Analytique',
					pictogramme: [{ forme: 'path', d: 'M2.5 13.5V9M6.5 13.5V4M10.5 13.5v-6M14 13.5V2.5' }]
				},
				{
					cle: 'configuration',
					nom: 'Configuration',
					pictogramme: [
						{
							forme: 'path',
							d: 'M6.5 1.8h3l.3 1.7 1.5.9 1.6-.7 1.5 2.6-1.2 1.2v1.7l1.2 1.2-1.5 2.6-1.6-.7-1.5.9-.3 1.7h-3l-.3-1.7-1.5-.9-1.6.7L.6 12.4l1.2-1.2V9.5L.6 8.3l1.5-2.6 1.6.7 1.5-.9z'
						},
						{ forme: 'circle', cx: '8', cy: '8', r: '2' }
					]
				}
			]
		}
	];
}

/**
 * Le nom d'une section, pour qui n'a besoin que de lui. Il passe par le catalogue
 * plutôt que par une seconde table : deux listes de dix noms divergeraient au premier
 * renommage.
 */
export function nomDeSection(cle: CleDeSection, vocabulaire: VocabulaireRendu): string {
	return (
		groupesDeConsole(vocabulaire)
			.flatMap((g) => g.sections)
			.find((s) => s.cle === cle)?.nom ?? cle
	);
}

/**
 * Le libellé d'une option du sélecteur de petit écran : le nom, suivi du
 * compteur entre parenthèses quand la section en porte un (`V-27:3223`).
 */
export function libelleDOption(section: SectionDeConsole): string {
	return section.compte === undefined ? section.nom : `${section.nom} (${section.compte})`;
}

/** Le fil d'Ariane des vues de console — `["Accueil", "Console", <section>]`. */
export function filDeConsole(titre: string): readonly string[] {
	return ['Accueil', 'Console', titre];
}
