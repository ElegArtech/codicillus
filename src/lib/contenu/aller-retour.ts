/**
 * LA BATTERIE 4 — « pour tout document du corpus, sérialiser puis désérialiser
 * redonne le document d'origine ».
 *
 * `RG-M13-01` (`CAHIER-DES-CHARGES-FONCTIONNEL.md` l. 1113) désigne cette
 * propriété comme « le critère de réussite principal » du produit, et
 * `ADR-004` nomme cette batterie « la batterie nominale de cet ADR ». Elle est
 * ici, en TypeScript contrôlé par `pnpm check` ; `verif/aller-retour.mjs` ne
 * fait que la lancer et imprimer — le partage qu'emploient déjà
 * `verif/contenu.mjs` (T-014) et `base/base.mjs` (T-003), et qui évite un
 * SECOND chemin de résolution de modules.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CORPUS EST PETIT, ET C'EST LE POINT DUR DE CE LOT
 *
 * `DOCUMENTS_DU_GEL` porte QUATRE corps, tous transcrits de deux maquettes
 * gelées (`documents-du-gel.ts` l. 721-746, recompté). Ces quatre corps
 * n'exercent que TREIZE des quinze constructions de M04.6 : ni l'image, ni le
 * diagramme — relevé mécanique reproduit par `pnpm contenu:constructions`, et
 * recompté ici par `releveDesConstructions()`.
 *
 * « Une règle qu'aucun cas n'exerce est une règle dont on ignore si elle
 * marche » (`CLAUDE.md` §6, `P-5`). Un aller-retour vert sur quatre documents
 * RESSEMBLERAIT à un résultat sans en être un. Les constructions, les valeurs
 * d'attributs et les formes que le corpus n'exerce pas sont donc éprouvées par
 * des CAS NOMMÉS, déclarés comme tels et comptés à part — jamais glissés dans
 * un document de démonstration, ce qui serait la valeur illustrative que
 * `P-02` interdit et que T-014 avait déjà refusée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LES TROIS VERSIONS DE `CONTENU_VERSIONS` N'APPORTENT PAS
 *
 * `seeds/corpus.ts` l. 1503-1705 porte trois versions anciennes de
 * `n-restaurer-pg`, en `BlocDeContenu` (l. 309-331) et non en `Document`.
 * Elles ont été considérées, et elles sont écartées pour la raison exacte que
 * T-014 avait donnée, vérifiée type en main : cinq informations que le format
 * EXIGE leur manquent — l'ancre d'un titre (`type: 'h2' | 'h3'` ne porte que
 * `texte`), l'état coché d'une tâche (`items: readonly string[]`), le glyphe
 * d'une alerte (`niveau`, `titre`, `texte`, et rien d'autre), la nature
 * numérique d'une cellule (`entetes` et `lignes` de chaînes), et la source
 * d'une figure (`type: 'figure'` ne porte qu'une `legende`). Les combler
 * serait DÉCIDER. Elles ne sont donc pas transposées, et l'écart reste ouvert.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE NORMALISATION AVANT COMPARAISON
 *
 * L'identité est mesurée sur la sérialisation JSON STRICTE, ordre des clés
 * compris (`identique`). Une seconde mesure, insensible à l'ordre des clés
 * (`identiqueACleTriee`), est calculée pour la seule raison de POUVOIR LE
 * DIRE : si les deux verdicts diffèrent quelque part, c'est que le
 * convertisseur ne rend pas l'ordre des clés et que la première mesure est
 * plus exigeante que l'identité du document en base. À ce jour les deux
 * verdicts concordent sur tous les cas, donc aucune tolérance n'est employée.
 *
 * ET L'EXIGENCE STRICTE EST TENABLE PARCE QUE LE SCHÉMA NORMALISE — mesuré,
 * pas supposé : `analyserDocument` rend les clés dans l'ordre du schéma, quel
 * que soit celui de l'entrée. Un document écrit
 * `{content, attrs, type}` en ressort `{type, attrs, content}`. Les deux côtés
 * de la comparaison passant par cette même entrée, l'ordre des clés n'est
 * jamais une différence — et il ne l'est pas davantage en base, `jsonb` ne
 * conservant pas l'ordre d'écriture.
 */
import { compterLesLiensDUnDocument, compterPorteur } from './commandes';
import { CONSTRUCTIONS, analyserDocument, type Document } from './document';
import { DOCUMENTS_DU_GEL, resoudreDansLeCorpus } from './documents-du-gel';
import { analyserMarkdown, serialiserEnMarkdown } from './markdown';

/* ═══════════════════════════════════════════════ Les cas de la batterie ═ */

/** Un document soumis à l'aller-retour, et d'où il vient. */
export interface CasDAllerRetour {
	readonly nom: string;
	/** La provenance, à la ligne près quand elle existe. */
	readonly provenance: string;
	/** Ce que ce cas exerce et que le corpus n'exerce pas. Vide pour le corpus. */
	readonly exerce: string;
	readonly document: Document;
}

/** LES QUATRE CORPS DU GEL — le corpus de `RG-M13-01`, et rien d'ajouté. */
export const CAS_DU_CORPUS: readonly CasDAllerRetour[] = DOCUMENTS_DU_GEL.map((d) => ({
	nom: d.note + ' / ' + d.registre,
	provenance: d.source,
	exerce: '',
	document: d.document
}));

/**
 * LES CAS NOMMÉS, et pourquoi chacun existe.
 *
 * Chacun est là parce qu'une propriété du format n'est PAS exercée par les
 * quatre corps du gel. Les deux premiers reprennent, valeur pour valeur, les
 * nœuds que `rendu.test.ts` emploie déjà : même provenance, même contenu, et
 * donc aucune invention nouvelle dans ce lot.
 */
const NOMMES: readonly {
	readonly nom: string;
	readonly provenance: string;
	readonly exerce: string;
	readonly valeur: unknown;
}[] = [
	{
		nom: 'image',
		provenance: 'valeurs de rendu.test.ts « l’image » ; enveloppe attestée V-17:3076, V-14:1586',
		exerce: 'construction 10 — aucune des 41 maquettes ne porte de balise d’image',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'image',
					attrs: {
						src: '/pj/schema.png',
						alt: 'Baie de brassage, façade',
						etiquette: 'Figure',
						legende: 'Légende'
					}
				}
			]
		}
	},
	{
		nom: 'diagramme',
		provenance: 'source attestée V-17:3078 ; valeurs de rendu.test.ts « le diagramme »',
		exerce: 'construction 12 — les deux figures du gel sont des SVG écrits à la main',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'diagramme',
					attrs: {
						source: 'A --> B\nB --> C',
						langage: 'mermaid',
						alternative: 'A précède B, qui précède C.',
						etiquette: 'Schéma 1',
						legende: 'Enchaînement.'
					}
				}
			]
		}
	},
	{
		nom: 'titre de niveau 1',
		provenance: 'écrit pour ce cas — le format admet six niveaux, le gel n’en écrit que cinq',
		exerce:
			'construction 1, niveau 1 : les 25 titres du corpus vont du niveau 2 au niveau 6, ' +
			'« le niveau 1 est réservé au titre de la note » (V-14:1524-1705, transcrit)',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 1, ancre: null },
					content: [{ type: 'text', text: 'Niveau 1' }]
				}
			]
		}
	},
	{
		nom: 'attributs nuls',
		provenance: 'écrit pour ce cas',
		exerce:
			'les valeurs nulles qu’aucun corps du gel ne porte : bloc de code sans langage, ' +
			'citation sans attribution, figure sans étiquette ni légende',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: null },
					content: [{ type: 'text', text: 'ls -l' }]
				},
				{
					type: 'blockquote',
					attrs: { attribution: null },
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sans attribution.' }] }]
				},
				{
					type: 'image',
					attrs: { src: '/pj/x.png', alt: 'Sans légende', etiquette: null, legende: null }
				},
				{
					type: 'diagramme',
					attrs: {
						source: 'A --> B',
						langage: 'mermaid',
						alternative: 'A précède B.',
						etiquette: null,
						legende: null
					}
				}
			]
		}
	},
	{
		nom: 'contenus absents',
		provenance: 'écrit pour ce cas — `content` est optionnel au format (règle 1)',
		exerce:
			'le paragraphe vide (V-17:3077 en insère un après chaque séparateur), le titre sans ' +
			'texte, et le bloc de code sans contenu : aucun corps du gel n’en porte',
		valeur: {
			type: 'doc',
			content: [
				{ type: 'paragraph' },
				{ type: 'heading', attrs: { level: 3, ancre: 's-vide' } },
				{ type: 'codeBlock', attrs: { language: 'bash' } }
			]
		}
	},
	{
		nom: 'listes adjacentes de même genre',
		provenance: 'écrit pour ce cas',
		exerce: 'la frontière de blocs : sans elle, deux listes de même genre se relisent en une',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'bulletList',
					content: [
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }]
						}
					]
				},
				{
					type: 'bulletList',
					content: [
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }]
						}
					]
				},
				{
					type: 'orderedList',
					content: [
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'c' }] }]
						}
					]
				},
				{
					type: 'orderedList',
					content: [
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'd' }] }]
						}
					]
				},
				{
					type: 'taskList',
					content: [
						{
							type: 'taskItem',
							attrs: { checked: true },
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'e' }] }]
						}
					]
				},
				{
					type: 'taskList',
					content: [
						{
							type: 'taskItem',
							attrs: { checked: false },
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'f' }] }]
						}
					]
				}
			]
		}
	},
	{
		nom: 'tableau que les barres verticales ne savent pas porter',
		provenance: 'écrit pour ce cas',
		exerce:
			'la forme en conteneurs : cellule de plusieurs blocs, cellule d’en-tête en cours de ' +
			'ligne, colonne au caractère numérique hétérogène — les deux tableaux du gel sont ' +
			'tous deux réguliers',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'table',
					content: [
						{
							type: 'tableRow',
							content: [
								{
									type: 'tableHeader',
									content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Contrôle' }] }]
								},
								{
									type: 'tableCell',
									attrs: { numerique: false },
									content: [
										{ type: 'paragraph', content: [{ type: 'text', text: 'Deux blocs :' }] },
										{
											type: 'codeBlock',
											attrs: { language: 'bash' },
											content: [{ type: 'text', text: 'barman check' }]
										}
									]
								}
							]
						},
						{
							type: 'tableRow',
							content: [
								{
									type: 'tableCell',
									attrs: { numerique: true },
									content: [{ type: 'paragraph', content: [{ type: 'text', text: '118' }] }]
								},
								{
									type: 'tableCell',
									attrs: { numerique: false },
									content: [
										{
											type: 'bulletList',
											content: [
												{
													type: 'listItem',
													content: [
														{
															type: 'paragraph',
															content: [{ type: 'text', text: 'une liste en cellule' }]
														}
													]
												}
											]
										}
									]
								}
							]
						}
					]
				}
			]
		}
	},
	{
		nom: 'marques empilées, dans l’ordre du type',
		provenance: 'écrit pour ce cas',
		exerce:
			'le piège d’identité 1 : aucun texte du gel ne porte plus d’une marque, et l’ordre ' +
			'du tableau `marks` est celui du type depuis ARB-056 — l’ordre inverse n’est plus un ' +
			'document, il est refusé, et CAS_INVALIDES l’éprouve',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'gras et italique',
							marks: [{ type: 'bold' }, { type: 'italic' }]
						},
						{ type: 'text', text: ' — ' },
						{
							type: 'text',
							text: 'souligné et surligné',
							marks: [{ type: 'underline' }, { type: 'highlight' }]
						}
					]
				},
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'lien interne en gras',
							marks: [{ type: 'bold' }, { type: 'lienInterne', attrs: { cible: 'n-restaurer-pg' } }]
						},
						{ type: 'text', text: ' / ' },
						{
							type: 'text',
							text: 'barré dans un lien externe',
							marks: [
								{ type: 'strike' },
								{ type: 'link', attrs: { href: 'https://exemple.test/a(b)c' } }
							]
						}
					]
				}
			]
		}
	},
	{
		nom: 'textes adverses',
		provenance: 'écrit pour ce cas',
		exerce:
			'l’échappement : tout délimiteur en texte littéral, les espaces de bord, un texte ' +
			'fait d’espaces, une tête de ligne qui imite un autre bloc, un span de code porteur ' +
			'd’accents graves et d’espaces de bord',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '  espaces aux deux bords  ' }]
				},
				{ type: 'paragraph', content: [{ type: 'text', text: '   ' }] },
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '# pas un titre, - pas une liste, > pas une citation' }]
				},
				{ type: 'paragraph', content: [{ type: 'text', text: '1. pas une liste numérotée' }] },
				{ type: 'paragraph', content: [{ type: 'text', text: '::: pas un conteneur' }] },
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '{attribution="pas une ligne d’attributs"}' }]
				},
				{ type: 'paragraph', content: [{ type: 'text', text: '| pas | un tableau |' }] },
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '**pas du gras** _ni de l’italique_' }]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '==pas surligné== ++ni souligné++' }]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '~~pas barré~~ &#32; ni une entité' }]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: '[[pas un lien interne]] [ni externe](x)' }]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'une contre-oblique \\ et une seule' }]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: ' du code aux bords ', marks: [{ type: 'code' }] }]
				},
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'des accents graves ``` dedans', marks: [{ type: 'code' }] }
					]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'accent grave au bord `', marks: [{ type: 'code' }] }]
				},
				{
					type: 'heading',
					attrs: { level: 2, ancre: 'une ancre avec espaces et }' },
					content: [{ type: 'text', text: 'Titre dont l’ancre ne tient pas dans le raccourci' }]
				},
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'cible à barre verticale',
							marks: [{ type: 'lienInterne', attrs: { cible: 'n-x|y]z' } }]
						}
					]
				}
			]
		}
	},
	{
		nom: 'blocs clôturés aux bords',
		provenance: 'écrit pour ce cas',
		exerce:
			'les bords d’un bloc de code : un texte qui finit par un saut de ligne, un texte qui ' +
			'commence par un saut de ligne, une clôture d’accents graves à l’intérieur, et un ' +
			'langage que la chaîne d’information ne sait pas porter',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: 'bash' },
					content: [{ type: 'text', text: 'finit par un saut\n' }]
				},
				{
					type: 'codeBlock',
					attrs: { language: 'bash' },
					content: [{ type: 'text', text: '\ncommence par un saut' }]
				},
				{
					type: 'codeBlock',
					attrs: { language: 'md' },
					content: [{ type: 'text', text: 'une clôture :\n```\nau milieu' }]
				},
				{
					type: 'codeBlock',
					attrs: { language: 'deux\nlignes' },
					content: [{ type: 'text', text: 'langage impossible en chaîne d’information' }]
				},
				{
					type: 'codeBlock',
					attrs: { language: ' espace de bord ' },
					content: [{ type: 'text', text: 'langage aux espaces de bord' }]
				}
			]
		}
	}
];

export const CAS_NOMMES: readonly CasDAllerRetour[] = NOMMES.map((n) => ({
	nom: n.nom,
	provenance: n.provenance,
	exerce: n.exerce,
	document: analyserDocument(n.valeur)
}));

/* ═══════════════════════════════════════════════════════ Les sondes ═════ */

/** Une mutation du convertisseur, pour prouver que la batterie sait dire non. */
export interface Sonde {
	readonly genre: string;
	/** Le côté perturbé — le candidat, jamais la mesure. */
	readonly cote: string;
	readonly description: string;
	/** La perte simulée à la sérialisation. */
	readonly muterMarkdown?: (markdown: string) => {
		readonly texte: string;
		readonly touches: number;
	};
	/** La perte simulée à la désérialisation. */
	readonly muterDocument?: (relu: Document) => {
		readonly valeur: unknown;
		readonly touches: number;
	};
}

/** Le nombre de nœuds dont un attribut a été remplacé, et la valeur mutée. */
function sansAncre(valeur: unknown): { readonly valeur: unknown; readonly touches: number } {
	let touches = 0;
	const muter = (v: unknown): unknown => {
		if (Array.isArray(v)) return v.map(muter);
		if (v === null || typeof v !== 'object') return v;
		const objet = { ...(v as Record<string, unknown>) };
		const attrs = objet['attrs'];
		if (objet['type'] === 'heading' && attrs !== null && typeof attrs === 'object') {
			const copie = { ...(attrs as Record<string, unknown>) };
			if (copie['ancre'] !== null) touches += 1;
			copie['ancre'] = null;
			objet['attrs'] = copie;
		}
		for (const cle of ['content', 'marks']) {
			if (objet[cle] !== undefined) objet[cle] = muter(objet[cle]);
		}
		return objet;
	};
	return { valeur: muter(valeur), touches };
}

/**
 * LES DEUX GENRES DE MUTATION exigés par le contrat de T-015 : une marque
 * perdue à la sérialisation, un attribut perdu à la désérialisation. Chacune
 * compte ce qu'elle touche — « une perturbation qui ne change rien ne teste
 * rien » —, et l'instrument refuse de conclure si le compte est nul.
 */
export const SONDES: readonly Sonde[] = [
	{
		genre: 'marque-perdue',
		cote: 'sérialisation',
		description:
			'un sérialiseur qui oublierait d’écrire la marque « surligné » : les deux ' +
			'délimiteurs sont retirés du Markdown produit',
		muterMarkdown: (markdown) => {
			const morceaux = markdown.split('==');
			return { texte: morceaux.join(''), touches: Math.floor((morceaux.length - 1) / 2) };
		}
	},
	{
		genre: 'attribut-perdu',
		cote: 'désérialisation',
		description:
			'un désérialiseur qui oublierait l’ancre d’un titre : toute ancre relue est ' +
			'remplacée par une valeur nulle',
		muterDocument: (relu) => sansAncre(relu)
	},
	{
		genre: 'temoin-inerte',
		cote: 'sérialisation',
		description:
			'LA SONDE QUI NE TOUCHE RIEN, et elle est là pour être jouée : elle retire du ' +
			'Markdown un délimiteur que ce convertisseur n’écrit jamais. La batterie doit alors ' +
			'REFUSER DE CONCLURE (code 2, jamais inversé) au lieu de rendre le vert d’une ' +
			'mutation inerte. Sans ce témoin, la garde qui protège du faux vert serait elle-même ' +
			'une règle qu’aucun cas n’exerce (P-5).',
		muterMarkdown: (markdown) => {
			const morceaux = markdown.split('§§');
			return { texte: morceaux.join(''), touches: Math.floor((morceaux.length - 1) / 2) };
		}
	}
];

/* ═══════════════════════════════════════════════════════ Le verdict ═════ */

/** Le JSON à clés triées — la seule mesure insensible à l'ordre d'écriture. */
function jsonACleTriee(valeur: unknown): string {
	if (Array.isArray(valeur)) return '[' + valeur.map(jsonACleTriee).join(',') + ']';
	if (valeur === null || typeof valeur !== 'object') return JSON.stringify(valeur) ?? 'null';
	const objet = valeur as Record<string, unknown>;
	return (
		'{' +
		Object.keys(objet)
			.sort()
			.map((c) => JSON.stringify(c) + ':' + jsonACleTriee(objet[c]))
			.join(',') +
		'}'
	);
}

/** Le premier chemin où deux valeurs diffèrent, ou `null` si elles sont égales. */
function premiereDifference(a: unknown, b: unknown, chemin: string): string | null {
	if (JSON.stringify(a) === JSON.stringify(b)) return null;
	if (Array.isArray(a) && Array.isArray(b)) {
		const n = Math.max(a.length, b.length);
		for (let i = 0; i < n; i++) {
			const trouve = premiereDifference(a[i], b[i], chemin + '[' + String(i) + ']');
			if (trouve !== null) return trouve;
		}
		return chemin + ' (longueurs : ' + String(a.length) + ' contre ' + String(b.length) + ')';
	}
	if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
		const ga = a as Record<string, unknown>;
		const gb = b as Record<string, unknown>;
		for (const cle of new Set([...Object.keys(ga), ...Object.keys(gb)])) {
			const trouve = premiereDifference(ga[cle], gb[cle], chemin + '.' + cle);
			if (trouve !== null) return trouve;
		}
		return chemin;
	}
	return chemin + ' : ' + JSON.stringify(a) + ' devient ' + JSON.stringify(b);
}

export interface VerdictDAllerRetour {
	readonly cas: CasDAllerRetour;
	/** Le Markdown produit, tel quel. */
	readonly markdown: string;
	readonly lignes: number;
	readonly identique: boolean;
	/** L'identité mesurée sans tenir compte de l'ordre des clés du JSON. */
	readonly identiqueACleTriee: boolean;
	/** Le premier écart, s'il y en a un. */
	readonly ecart: string | null;
	/** Ce que la sonde a touché, quand une sonde est posée. */
	readonly touches: number;
}

/** L'aller-retour d'un cas, éventuellement sous une sonde. */
export function jouerAllerRetour(cas: CasDAllerRetour, sonde?: Sonde): VerdictDAllerRetour {
	const markdown = serialiserEnMarkdown(cas.document);
	let touches = 0;
	let texte = markdown;
	if (sonde?.muterMarkdown !== undefined) {
		const mute = sonde.muterMarkdown(markdown);
		texte = mute.texte;
		touches += mute.touches;
	}
	let relu: unknown;
	try {
		relu = analyserMarkdown(texte);
	} catch (erreur) {
		return {
			cas,
			markdown,
			lignes: markdown.split('\n').length,
			identique: false,
			identiqueACleTriee: false,
			ecart: 'la relecture a été refusée : ' + (erreur as Error).message.split('\n')[0],
			touches
		};
	}
	if (sonde?.muterDocument !== undefined) {
		const mute = sonde.muterDocument(relu as Document);
		relu = mute.valeur;
		touches += mute.touches;
	}
	return {
		cas,
		markdown,
		lignes: markdown.split('\n').length,
		identique: JSON.stringify(relu) === JSON.stringify(cas.document),
		identiqueACleTriee: jsonACleTriee(relu) === jsonACleTriee(cas.document),
		ecart: premiereDifference(cas.document, relu, 'document'),
		touches
	};
}

/* ═══════════════════════════════════ Le relevé des quinze constructions ═ */

/** Ce que chaque construction doit à un document, et à quel titre. */
export interface ExerciceDeConstruction {
	readonly numero: number;
	readonly libelle: string;
	/** Les documents du CORPUS qui l'exercent, avec le nombre d'occurrences. */
	readonly parDocumentDuCorpus: readonly (readonly [string, number])[];
	readonly occurrencesAuCorpus: number;
	/** Les cas nommés qui l'exercent, faute de corpus. */
	readonly parCasNomme: readonly (readonly [string, number])[];
	readonly occurrencesAuxCasNommes: number;
}

function compterConstruction(
	document: Document,
	numero: number,
	porteurs: readonly string[]
): number {
	if (numero === 13) return compterLesLiensDUnDocument(document, resoudreDansLeCorpus).resolus;
	if (numero === 14) return compterLesLiensDUnDocument(document, resoudreDansLeCorpus).casses;
	return porteurs.reduce((n, p) => n + compterPorteur(document, p), 0);
}

/** Le relevé, construction par construction, document par document. */
export function releveDesConstructions(): readonly ExerciceDeConstruction[] {
	return CONSTRUCTIONS.map((c) => {
		const corpus = CAS_DU_CORPUS.map(
			(cas) => [cas.nom, compterConstruction(cas.document, c.numero, c.porteurs)] as const
		).filter(([, n]) => n > 0);
		const nommes = CAS_NOMMES.map(
			(cas) => [cas.nom, compterConstruction(cas.document, c.numero, c.porteurs)] as const
		).filter(([, n]) => n > 0);
		return {
			numero: c.numero,
			libelle: c.libelle,
			parDocumentDuCorpus: corpus,
			occurrencesAuCorpus: corpus.reduce((a, [, n]) => a + n, 0),
			parCasNomme: nommes,
			occurrencesAuxCasNommes: nommes.reduce((a, [, n]) => a + n, 0)
		};
	});
}

/* ═══════════════════════════════════════ Le relevé des vingt attributs ═ */

/** Un attribut du format, et l'endroit du Markdown qui le porte. */
interface AttributDuFormat {
	readonly noeud: string;
	readonly attribut: string;
	readonly place: string;
}

/**
 * LES VINGT ATTRIBUTS du format canonique — relevés sur `document.ts`, nœud
 * par nœud, et chacun avec l'endroit du Markdown qui le porte. `ARB-049`
 * décision 4 exige qu'ils survivent tous : la colonne « place » dit comment,
 * et le relevé dit qui l'exerce.
 */
const ATTRIBUTS: readonly AttributDuFormat[] = [
	{ noeud: 'heading', attribut: 'level', place: 'le nombre de dièses' },
	{ noeud: 'heading', attribut: 'ancre', place: 'le raccourci d’identifiant, ou la clé `ancre`' },
	{
		noeud: 'codeBlock',
		attribut: 'language',
		place: 'la chaîne d’information, ou la clé `language`'
	},
	{ noeud: 'taskItem', attribut: 'checked', place: 'la case du marqueur de tâche' },
	{ noeud: 'blockquote', attribut: 'attribution', place: 'la clé `attribution`' },
	{ noeud: 'alerte', attribut: 'niveau', place: 'la clé `niveau` du conteneur' },
	{ noeud: 'alerte', attribut: 'glyphe', place: 'la clé `glyphe` du conteneur' },
	{ noeud: 'alerte', attribut: 'titre', place: 'la clé `titre` du conteneur' },
	{
		noeud: 'tableCell',
		attribut: 'numerique',
		place: 'l’alignement de la colonne, ou la clé `numerique`'
	},
	{ noeud: 'image', attribut: 'src', place: 'la destination de la forme d’image' },
	{ noeud: 'image', attribut: 'alt', place: 'le libellé de la forme d’image' },
	{ noeud: 'image', attribut: 'etiquette', place: 'la clé `etiquette`' },
	{ noeud: 'image', attribut: 'legende', place: 'la clé `legende`' },
	{ noeud: 'diagramme', attribut: 'source', place: 'le contenu du bloc clôturé' },
	{ noeud: 'diagramme', attribut: 'langage', place: 'la chaîne d’information du bloc clôturé' },
	{ noeud: 'diagramme', attribut: 'alternative', place: 'la clé `alternative`' },
	{ noeud: 'diagramme', attribut: 'etiquette', place: 'la clé `etiquette`' },
	{ noeud: 'diagramme', attribut: 'legende', place: 'la clé `legende`' },
	{ noeud: 'link', attribut: 'href', place: 'la destination de la forme de lien' },
	{ noeud: 'lienInterne', attribut: 'cible', place: 'avant la barre, dans les doubles crochets' }
];

/** Tous les nœuds et toutes les marques d'un document, dans l'ordre. */
function* tousLesNoeuds(valeur: unknown): Generator<Record<string, unknown>> {
	if (Array.isArray(valeur)) {
		for (const v of valeur) yield* tousLesNoeuds(v);
		return;
	}
	if (valeur === null || typeof valeur !== 'object') return;
	const objet = valeur as Record<string, unknown>;
	if (typeof objet['type'] === 'string') yield objet;
	yield* tousLesNoeuds(objet['content']);
	yield* tousLesNoeuds(objet['marks']);
}

/** Les valeurs observées pour un attribut, sur un jeu de documents. */
export interface ValeursObservees {
	readonly occurrences: number;
	readonly nulles: number;
	readonly distinctes: number;
}

function observer(
	documents: readonly CasDAllerRetour[],
	noeud: string,
	attribut: string
): ValeursObservees {
	let occurrences = 0;
	let nulles = 0;
	const vues = new Set<string>();
	for (const cas of documents) {
		for (const n of tousLesNoeuds(cas.document)) {
			if (n['type'] !== noeud) continue;
			const attrs = n['attrs'];
			if (attrs === null || typeof attrs !== 'object') continue;
			if (!(attribut in (attrs as Record<string, unknown>))) continue;
			const valeur = (attrs as Record<string, unknown>)[attribut];
			occurrences += 1;
			if (valeur === null) nulles += 1;
			vues.add(JSON.stringify(valeur));
		}
	}
	return { occurrences, nulles, distinctes: vues.size };
}

export interface ReleveDAttribut extends AttributDuFormat {
	readonly corpus: ValeursObservees;
	readonly casNommes: ValeursObservees;
}

export function releveDesAttributs(): readonly ReleveDAttribut[] {
	return ATTRIBUTS.map((a) => ({
		...a,
		corpus: observer(CAS_DU_CORPUS, a.noeud, a.attribut),
		casNommes: observer(CAS_NOMMES, a.noeud, a.attribut)
	}));
}

/* ═══════════════════════════════════════════════════════ Le rapport ═════ */

function colonne(valeur: string, largeur: number): string {
	return valeur.length >= largeur ? valeur : valeur + ' '.repeat(largeur - valeur.length);
}

function lignesDUnVerdict(v: VerdictDAllerRetour, sonde: Sonde | undefined): string[] {
	const etat = v.identique ? 'identique' : 'ÉCART';
	const entete =
		'  ' +
		colonne(etat, 11) +
		colonne(v.cas.nom, 46) +
		String(v.lignes) +
		' lignes de Markdown' +
		(sonde === undefined ? '' : ' · ' + String(v.touches) + ' touché(s) par la sonde');
	const lignes = [entete, '      ' + v.cas.provenance];
	if (v.cas.exerce !== '') lignes.push('      exerce : ' + v.cas.exerce);
	if (!v.identique) lignes.push('      premier écart : ' + (v.ecart ?? '—'));
	if (v.identique !== v.identiqueACleTriee) {
		lignes.push(
			'      ATTENTION : le verdict change selon que l’ordre des clés compte ou non — ' +
				'le convertisseur ne rend pas l’ordre d’écriture du JSON'
		);
	}
	return lignes;
}

/**
 * Le verdict de la batterie. TROIS codes, et le troisième est celui qui évite
 * un faux vert : sous sonde, le lanceur inverse `1` en `0`, mais il n'inverse
 * PAS `2` — un instrument qui refuse de conclure ne doit jamais se lire comme
 * une preuve (RA-01).
 */
export interface RapportDAllerRetour {
	readonly texte: string;
	readonly code: 0 | 1 | 2;
}

/**
 * `pnpm test:aller-retour`, et `pnpm test:aller-retour:sonde` pour la preuve
 * que la batterie sait dire non.
 *
 * Sous sonde, le verdict est INVERSÉ par le lanceur : c'est le rouge qui est
 * attendu. Et une sonde qui n'a rien touché ne prouve rien : l'instrument
 * refuse alors de conclure, code 2.
 */
export function rapportDAllerRetour(genreDeSonde?: string): RapportDAllerRetour {
	const sonde =
		genreDeSonde === undefined ? undefined : SONDES.find((s) => s.genre === genreDeSonde);
	if (genreDeSonde !== undefined && sonde === undefined) {
		return {
			texte:
				'sonde inconnue : « ' +
				genreDeSonde +
				' ». Les sondes posées sont : ' +
				SONDES.map((s) => s.genre).join(', '),
			code: 1
		};
	}
	const lignes: string[] = [
		'test:aller-retour — batterie 4 « aller-retour Markdown » (RG-M13-01, C-04, ADR-004)',
		'  « pour tout document du corpus, sérialiser puis désérialiser redonne le document',
		'  d’origine. C’est ce test, et non une inspection visuelle, qui atteste RG-M13-01. »',
		''
	];
	if (sonde !== undefined) {
		lignes.push(
			'  SONDE POSÉE : ' + sonde.genre + ' — côté ' + sonde.cote,
			'    ' + sonde.description,
			'    Le rouge est ATTENDU : le lanceur inverse le code de retour.',
			''
		);
	}

	const verdictsCorpus = CAS_DU_CORPUS.map((c) => jouerAllerRetour(c, sonde));
	const verdictsNommes = CAS_NOMMES.map((c) => jouerAllerRetour(c, sonde));

	lignes.push(
		'  LE CORPUS — ' +
			String(CAS_DU_CORPUS.length) +
			' corps transcrits du gel (documents-du-gel.ts:721-746)'
	);
	for (const v of verdictsCorpus) lignes.push(...lignesDUnVerdict(v, sonde));
	lignes.push(
		'',
		'  LES CAS NOMMÉS — ' +
			String(CAS_NOMMES.length) +
			' cas, chacun pour une propriété que le corpus n’exerce pas (P-5).',
		'  Ils ne sont PAS des documents de démonstration : aucun n’entre dans le corpus (P-02).'
	);
	for (const v of verdictsNommes) lignes.push(...lignesDUnVerdict(v, sonde));

	const tous = [...verdictsCorpus, ...verdictsNommes];
	const ecarts = tous.filter((v) => !v.identique);
	const desaccords = tous.filter((v) => v.identique !== v.identiqueACleTriee);

	lignes.push('', '  LE RELEVÉ DES QUINZE CONSTRUCTIONS — qui exerce quoi, et compté');
	for (const e of releveDesConstructions()) {
		const corpus =
			e.parDocumentDuCorpus.length === 0
				? 'AUCUN document du corpus'
				: e.parDocumentDuCorpus.map(([nom, n]) => nom + ' ' + String(n)).join(' · ');
		lignes.push('  ' + colonne(String(e.numero), 3) + colonne(e.libelle, 56) + corpus);
		if (e.parDocumentDuCorpus.length === 0) {
			lignes.push(
				'      cas nommé : ' +
					(e.parCasNomme.map(([nom, n]) => nom + ' ' + String(n)).join(' · ') ||
						'AUCUN — non couvert')
			);
		}
	}
	const exercees = releveDesConstructions().filter((e) => e.occurrencesAuCorpus > 0).length;
	const couvertes = releveDesConstructions().filter(
		(e) => e.occurrencesAuCorpus + e.occurrencesAuxCasNommes > 0
	).length;
	lignes.push(
		'  ' +
			String(exercees) +
			' constructions sur 15 exercées par le corpus, ' +
			String(couvertes) +
			' sur 15 couvertes par l’aller-retour en comptant les cas nommés.'
	);

	lignes.push('', '  LE RELEVÉ DES ATTRIBUTS — où chacun survit, et qui l’exerce');
	for (const a of releveDesAttributs()) {
		const total = a.corpus.occurrences + a.casNommes.occurrences;
		lignes.push(
			'  ' +
				colonne(a.noeud + '.' + a.attribut, 24) +
				colonne(a.place, 48) +
				'corpus ' +
				String(a.corpus.occurrences) +
				' (' +
				String(a.corpus.nulles) +
				' nulle·s) · cas nommés ' +
				String(a.casNommes.occurrences) +
				' (' +
				String(a.casNommes.nulles) +
				' nulle·s)' +
				(total === 0 ? '  NON EXERCÉ' : '')
		);
	}

	let code: 0 | 1 | 2 = 0;
	if (sonde === undefined) {
		if (ecarts.length > 0) code = 1;
		lignes.push(
			'',
			ecarts.length === 0
				? '  ' +
						String(tous.length) +
						' cas · ' +
						String(tous.length) +
						' identiques · 0 écart. Aucune normalisation employée : l’identité est mesurée' +
						'\n  sur la sérialisation JSON stricte, ordre des clés compris.'
				: '  ÉCHEC : ' +
						String(ecarts.length) +
						' cas sur ' +
						String(tous.length) +
						' ne reviennent pas à l’identique.'
		);
		if (desaccords.length > 0) {
			code = 1;
			lignes.push(
				'  ÉCHEC : ' +
					String(desaccords.length) +
					' cas où le verdict dépend de l’ordre des clés du JSON.'
			);
		}
	} else {
		const touches = tous.reduce((n, v) => n + v.touches, 0);
		lignes.push(
			'',
			'  la sonde a touché ' +
				String(touches) +
				' fois, et ' +
				String(ecarts.length) +
				' cas sur ' +
				String(tous.length) +
				' rougissent.'
		);
		if (touches === 0) {
			code = 2;
			lignes.push(
				'  REFUS DE CONCLURE : la mutation est INERTE — elle n’a rien touché, donc elle ne',
				'  teste rien. C’est le mode de défaillance RA-01, et il ne se lit pas comme une panne.'
			);
		} else if (ecarts.length === 0) {
			code = 1;
			lignes.push('  ÉCHEC DE LA SONDE : la mutation passe inaperçue. La batterie ne mesure rien.');
		} else {
			code = 1;
			lignes.push('  la batterie sait dire non : le lanceur inversera ce code.');
		}
	}
	lignes.push('');
	return { texte: lignes.join('\n'), code };
}

/** Le Markdown de tous les cas, pour la lecture humaine du rapport. */
export function markdownDesCas(): string {
	return [...CAS_DU_CORPUS, ...CAS_NOMMES]
		.map((c) => '════ ' + c.nom + ' ════\n' + serialiserEnMarkdown(c.document))
		.join('\n');
}
