/**
 * Console — le catalogue des sections, et rien d'autre.
 *
 * MOTIF COMMUN DES DIX VUES DE CONSOLE (V-27 à V-36). Le relevé des 37 vues
 * restantes (`docs/releve-vues.md` §8.2) l'a mesuré : les dix vues partagent
 * **13 classes** — les dix `nav2*`, `tete-section`, `tete-section__corps` et
 * `travail` —, et `aside.nav2` est **identique à l'octet dans les dix
 * maquettes**. Ce fichier porte la donnée de cette navigation ; le balisage
 * est dans `NavigationConsole.svelte`.
 *
 * POURQUOI ICI ET PAS DANS CHAQUE VUE. Recopier le catalogue dix fois
 * créerait dix sources de vérité pour une seule, exactement ce que
 * `arborescence-abregee.ts` refuse pour le rail des 26 vues abrégées. Ce qui
 * varie d'une vue à l'autre est la SECTION COURANTE, et elle seule.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CE FICHIER EST UNE FONCTION PURE DE SES ARGUMENTS — LE DÉFAUT RÉPARÉ
 *
 * Il portait un CATALOGUE DE MODULE, `GROUPES_DE_CONSOLE`, figé à l'import, et
 * il lisait `seeds/corpus.ts` pour deux choses à la fois :
 *
 *   · SES SEPT COMPTEURS — `UNIVERS.length`, `DOMAINES.length`,
 *     `Object.keys(TYPES_FICHE).length`… Le gel les calcule de la même façon
 *     (`window.UNIVERS.length`, `V-27:3153`), et c'est juste pour une maquette
 *     qui EST son jeu. C'est faux dès qu'une adresse sert la page :
 *     `$lib/console/effectifs.ts` porte la mesure et le motif.
 *   · LE LIBELLÉ « Types de fiches » — dérivé des quatre constantes de
 *     `$lib/vocabulaire.ts`, elles-mêmes tirées de `CONFIG.motFiche`. Renommer
 *     le mot en console n'avait donc aucun effet sur la pastille.
 *
 * Ce module ne peut lire NI la base NI un contexte : il n'est pas un composant,
 * et son catalogue était évalué au chargement. La sortie est celle que
 * `effectifs.ts` avait déjà prise pour les compteurs — LA SUBSTITUTION PAR
 * FONCTION —, appliquée cette fois au catalogue entier : `groupesDeConsole()`
 * prend le vocabulaire en argument, et il n'y a plus rien à figer.
 *
 * LES SEPT COMPTEURS VALENT ZÉRO dans le catalogue nu, et zéro n'est pas un
 * repli : c'est ce qu'une instance sans univers, sans domaine et sans compte
 * porte vraiment. `compte === undefined` reste réservé aux TROIS sections que le
 * gel ne compte pas — Exports, Analytique, Configuration —, et cette distinction
 * décide de l'émission du `span.nav2__n`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA FRONTIÈRE — CE QUI EST COMMUN, CE QUI EST PROPRE. MESURÉ, PAS SUPPOSÉ.
 *
 * Produit par `node verif/inventaire-composants.mjs`, en croisant les emplois
 * en produit de chaque classe avec les dix vues de console. C'est le livrable
 * du temps 1 de P-2, et il engage P-3 (V-29 à V-32) et P-4 (V-33 à V-36) :
 * ce qui est ici ne se réécrit pas, ce qui n'y est pas ne s'y ajoute pas.
 *
 *   LES DIX VUES (V-27 à V-36) — 13 classes, et ce sont EXACTEMENT celles-ci :
 *     nav2, nav2__tete, nav2__nom, nav2__sous, nav2__selecteur, nav2__groupe,
 *     nav2__titre, nav2__lien, nav2__nomlien, nav2__n,
 *     tete-section, tete-section__corps, travail
 *   → portées par `NavigationConsole.svelte`, `TeteDeSection.svelte`, et par
 *     `classeContenu` / `idContenu` du gabarit de coquille.
 *   `aside.nav2` est IDENTIQUE À L'OCTET au balisage des dix maquettes :
 *     684 octets, empreinte SHA-256 `320407731457576a…` pour les dix. Une fois
 *     la page stabilisée, les dix rendus font 4 872 octets et ne diffèrent que
 *     par le SEUL `aria-current="page"` qui marque la section courante.
 *
 *   LES SIX REGISTRES (V-27 à V-32) — 7 classes : tiroir-form, tiroir-form__tete,
 *     tiroir-form__titre, tiroir-form__sous, tiroir-form__fermer,
 *     tiroir-form__corps, tiroir-form__pied. S'y ajoutent, mesurés sur les six
 *     et sur elles seules : `data-form` sur `div.app`, `dialog#dlg-supprimer`,
 *     le bouton `#creer` de l'en-tête, et la focalisation de `input#f-nom` à
 *     l'ouverture du panneau. P-3 les hérite ; P-4 n'en a aucun.
 *
 *   LE TABLEAU DE GESTION — 7 classes sur 7 vues (V-27 à V-32 et V-35) :
 *     tableau-gestion, tg, tg--entetes, tg--ligne, tg--masquable, tg__actions,
 *     tg__n. Le MODIFICATEUR de grille est propre à chaque vue — `tg--univers`
 *     (V-27), `tg--domaines` (V-28) —, et `tg__nom` / `tg__desc` couvrent 6 vues.
 *
 *   LE REFUS DE SUPPRESSION — 3 classes sur 5 vues (V-27, V-29 à V-32) :
 *     refus, refus__titre, refus__sortie.
 *
 *   PROPRE À V-27 — 4 classes : apercu-nav, apercu-nav__ligne,
 *     apercu-nav__sceau, tg--univers.
 *   PROPRE À V-28 — 13 classes : tg--domaines, tg__univers, tg__modules,
 *     mod-pastille, modules-form, mod, mod__corps, mod__nom, mod__oblig,
 *     mod__aide, mod__consequence, definitif, conserve.
 *   PARTAGÉES PAR V-27 ET V-28 SEULES — 2 classes : couleurs, tg__puce.
 *
 *   INTERDICTION DE FACTORISER PLUS LOIN. `docs/DESIGN.md` §2.H recense 66
 *   homonymes à définitions divergentes, et V-27 comme V-28 en emploient six
 *   chacune. Ce qui n'est pas dans les listes ci-dessus n'est pas commun.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AUCUNE RÈGLE DE STYLE, AUCUN LITTÉRAL DE STYLE. Le rendu vient de
 * `src/socle.css` et de `src/vues/V-xx.css`, portée à l'octet du gel (P-6.3).
 * Ce fichier ne vit pas sous `src/vues/`, il n'a donc AUCUNE dérogation
 * P-6.4 : il ne porte pas un seul attribut `style`, et n'en portera pas.
 */
import type { VocabulaireRendu } from '../vocabulaire';

/**
 * Les dix sections, dans l'ordre du gel. La clé est celle que la maquette
 * donne à `rendreConsole(sectionCourante)` et à `<option value>`.
 */
export type CleDeSection =
	| 'univers'
	| 'domaines'
	| 'fiches'
	| 'relations'
	| 'templates'
	| 'comptes'
	| 'imports'
	| 'exports'
	| 'analytique'
	| 'configuration';

/**
 * Un trait de pictogramme, tel que le gel l'écrit.
 *
 * Les dix pictogrammes du catalogue sont des fragments SVG littéraux dans la
 * maquette (`s.ic`, injecté par `innerHTML`). Ils sont décomposés ici en
 * primitives typées plutôt que gardés en chaîne : une chaîne de balisage
 * demanderait `{@html}`, que rien n'oblige à employer, et que le compilateur
 * ne relit pas. Les valeurs sont celles du gel, au caractère près.
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

/** Une entrée de la navigation secondaire. */
export interface SectionDeConsole {
	readonly cle: CleDeSection;
	readonly nom: string;
	readonly pictogramme: readonly TraitDePictogramme[];
	/**
	 * Le compteur affiché en pastille. Absent : la section n'en porte pas —
	 * c'est le cas d'Exports, d'Analytique et de Configuration, et le gel le
	 * veut ainsi (`s.compte` non défini).
	 */
	readonly compte?: number;
}

/** Un groupe de la navigation secondaire — trois au gel. */
export interface GroupeDeSections {
	readonly nom: string;
	readonly sections: readonly SectionDeConsole[];
}

/**
 * LE CATALOGUE, dans l'ordre exact du gel — trois groupes, dix sections.
 *
 * UNE FONCTION, PARCE QUE LE LIBELLÉ D'UNE SECTION DÉPEND DE LA CONFIGURATION.
 * « Types de fiches » porte le terme renommable de `M14.7` ; le figer à l'import
 * rendait le renommage inopérant sur la seule pastille où il se lit le plus.
 *
 * LES SEPT COMPTEURS SORTENT À ZÉRO, et `effectifs.ts` y substitue la mesure de
 * la base. Zéro est la valeur d'une instance vide, pas un repli : le compteur
 * d'imports le montre bien — le gel écrit `compte: function () { return 1; }`
 * (`V-27:3196`), et AUCUNE table ne le nourrit, donc il vaut zéro et rien
 * d'autre.
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
 * LE NOM D'UNE SECTION, POUR QUI N'A BESOIN QUE DE LUI — le fil d'Ariane des
 * quatre vues que `CoquilleDeConsole.svelte` monte. Il passe par le catalogue
 * plutôt que par une seconde table : deux listes de dix noms divergeraient au
 * premier renommage, et c'est exactement le défaut réparé ici.
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

/** Le fil d'Ariane des dix vues de console — `["Accueil", "Console", <section>]`. */
export function filDeConsole(titre: string): readonly string[] {
	return ['Accueil', 'Console', titre];
}
