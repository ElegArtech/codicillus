/**
 * LE CONVERTISSEUR UNIQUE — LES FORMES ÉCRITES, ET CE QUI EST REFUSÉ.
 *
 * Ce fichier ÉPINGLE les conventions d'ARB-049 : chaque forme y est écrite en
 * clair, de sorte qu'une convention ne puisse pas changer sans qu'un test le
 * dise. C'est pour cela qu'il est exempté du seul contrôle A2 de
 * le contrôle du convertisseur — et il reste soumis aux autres, dont A2b, qui
 * exige qu'il importe l'implémentation unique plutôt que d'en refaire une.
 *
 * L'aller-retour, lui, n'est pas ici : il est la batterie 4, et il vit dans
 * `aller-retour.test.ts` et `pnpm test:aller-retour`.
 */
import { describe, expect, it } from 'vitest';
import { DocumentInvalide } from './document';
import {
	MarkdownInvalide,
	MarkdownNonRepresentable,
	analyserMarkdown,
	markdownDeFormulaire,
	markdownImporte,
	serialiserEnMarkdown
} from './markdown';

/** Le document minimal qui porte un bloc, pour n'épingler qu'une forme. */
const doc = (...blocs: unknown[]) => ({ type: 'doc', content: blocs });
const p = (...contenu: unknown[]) => ({ type: 'paragraph', content: contenu });
const t = (text: string, ...marks: unknown[]) =>
	marks.length === 0 ? { type: 'text', text } : { type: 'text', text, marks };

/** Trois accents graves, jamais écrits dans un modèle littéral (P-17). */
const CLOTURE = '```';

describe('les deux entrées valident, et il n’y en a pas d’autre', () => {
	it('la sérialisation refuse un document mal formé, plutôt que d’en écrire un faux', () => {
		expect(() => serialiserEnMarkdown({ type: 'doc', content: [{ type: 'iframe' }] })).toThrow(
			DocumentInvalide
		);
	});

	it('la désérialisation passe par le schéma : un Markdown vide ne fait pas un document vide', () => {
		/* Le format exige au moins un bloc (règle 1) : rien n'est réparé ici, le
		   schéma refuse. */
		expect(() => analyserMarkdown('')).toThrow(DocumentInvalide);
	});
});

describe('les formes écrites — ARB-049, et ce qui est épinglé ne bougera pas en silence', () => {
	it('les titres portent leur ancre dans une liste d’attributs', () => {
		expect(
			serialiserEnMarkdown(
				doc({ type: 'heading', attrs: { level: 2, ancre: 's-avant' }, content: [t('Avant')] })
			)
		).toBe('## Avant {#s-avant}\n');
	});

	it('un titre sans ancre n’écrit aucune liste d’attributs', () => {
		expect(
			serialiserEnMarkdown(
				doc({ type: 'heading', attrs: { level: 4, ancre: null }, content: [t('Niveau 4')] })
			)
		).toBe('#### Niveau 4\n');
	});

	it('les six marques d’emphase, chacune dans sa forme', () => {
		expect(
			serialiserEnMarkdown(
				doc(
					p(
						t('gras', { type: 'bold' }),
						t(' '),
						t('italique', { type: 'italic' }),
						t(' '),
						t('souligné', { type: 'underline' }),
						t(' '),
						t('barré', { type: 'strike' }),
						t(' '),
						t('surligné', { type: 'highlight' }),
						t(' '),
						t('code', { type: 'code' })
					)
				)
			)
		).toBe('**gras** _italique_ ++souligné++ ~~barré~~ ==surligné== `code`\n');
	});

	it('le lien interne porte l’identifiant de la cible, avant le libellé', () => {
		expect(
			serialiserEnMarkdown(
				doc(p(t('Diagnostiquer', { type: 'lienInterne', attrs: { cible: 'n-diag-barman' } })))
			)
		).toBe('[[n-diag-barman|Diagnostiquer]]\n');
	});

	it('le lien externe garde la forme de référence', () => {
		expect(
			serialiserEnMarkdown(
				doc(p(t('ANSSI', { type: 'link', attrs: { href: 'https://cyber.gouv.fr' } })))
			)
		).toBe('[ANSSI](https://cyber.gouv.fr)\n');
	});

	it('l’ordre des marques est l’ordre d’imbrication, et il se relit', () => {
		const gras_italique = doc(p(t('x', { type: 'bold' }, { type: 'italic' })));
		expect(serialiserEnMarkdown(gras_italique)).toBe('**_x_**\n');
		expect(analyserMarkdown('**_x_**')).toEqual(gras_italique);
	});

	it('l’ordre INVERSE est REFUSÉ À L’ÉCRITURE, et NORMALISÉ À LA LECTURE — règle 7, ARB-056', () => {
		/* `ARB-056` a fait de l'ordre des marques une règle de forme canonique :
		   « le schéma refuse tout autre ordre, il ne réordonne pas ». Elle tient
		   pour ce que LE PRODUIT ÉCRIT — deux ordres y seraient deux écritures
		   d'une seule chose —, et le sérialiseur la fait respecter.

		   ELLE NE TIENT PAS POUR CE QUE LE PRODUIT LIT, et c'est ce que ce cas a
		   changé le 4 septembre 2026. `_**x**_` est du Markdown ordinaire, écrit
		   par tous les éditeurs ; l'ordre d'emboîtement n'y porte aucun sens que
		   l'ensemble de marques d'un nœud ProseMirror puisse perdre. Le refus à la
		   lecture faisait rejeter LA NOTE ENTIÈRE à l'import, sous « contenu
		   illisible » — onze fichiers d'un corpus réel. Le lecteur normalise donc,
		   et les deux emboîtements rendent le même document. */
		const canonique = doc(p(t('x', { type: 'bold' }, { type: 'italic' })));
		expect(analyserMarkdown('_**x**_')).toEqual(canonique);
		expect(analyserMarkdown('**_x_**')).toEqual(canonique);
		expect(() =>
			serialiserEnMarkdown(doc(p(t('x', { type: 'italic' }, { type: 'bold' }))))
		).toThrow(DocumentInvalide);
	});

	it('le bloc de code est clôturé, et sa chaîne d’information nomme le langage', () => {
		expect(
			serialiserEnMarkdown(
				doc({
					type: 'codeBlock',
					attrs: { language: 'bash' },
					content: [t('barman list-backup pg-prod-01')]
				})
			)
		).toBe(CLOTURE + 'bash\nbarman list-backup pg-prod-01\n' + CLOTURE + '\n');
	});

	it('le diagramme est un bloc clôturé — V-36:3044 — et son alternative survit', () => {
		expect(
			serialiserEnMarkdown(
				doc({
					type: 'diagramme',
					attrs: {
						source: 'A --> B\nB --> C',
						langage: 'mermaid',
						alternative: 'A précède B, qui précède C.',
						etiquette: 'Schéma 1',
						legende: null
					}
				})
			)
		).toBe(
			CLOTURE +
				'mermaid\nA --> B\nB --> C\n' +
				CLOTURE +
				'\n{alternative="A précède B, qui précède C." etiquette="Schéma 1"}\n'
		);
	});

	it('l’alerte est un conteneur, et ses trois attributs y sont', () => {
		expect(
			serialiserEnMarkdown(
				doc({
					type: 'alerte',
					attrs: { niveau: 'danger', glyphe: 'DANGER', titre: 'Opération destructive' },
					content: [p(t('Elle ne s’annule pas.'))]
				})
			)
		).toBe(
			':::alerte{niveau="danger" glyphe="DANGER" titre="Opération destructive"}\n' +
				'Elle ne s’annule pas.\n' +
				':::\n'
		);
	});

	it('la citation porte son attribution sous elle', () => {
		expect(
			serialiserEnMarkdown(
				doc({
					type: 'blockquote',
					attrs: { attribution: '— Revue trimestrielle' },
					content: [p(t('Presque toujours un prérequis non vérifié.'))]
				})
			)
		).toBe('> Presque toujours un prérequis non vérifié.\n{attribution="— Revue trimestrielle"}\n');
	});

	it('les tâches portent leur case, cochée ou non', () => {
		expect(
			serialiserEnMarkdown(
				doc({
					type: 'taskList',
					content: [
						{ type: 'taskItem', attrs: { checked: true }, content: [p(t('fait'))] },
						{ type: 'taskItem', attrs: { checked: false }, content: [p(t('à faire'))] }
					]
				})
			)
		).toBe('- [x] fait\n- [ ] à faire\n');
	});

	it('le tableau régulier s’écrit en barres, et le caractère numérique en alignement', () => {
		const entete = (texte: string) => ({ type: 'tableHeader', content: [p(t(texte))] });
		const cellule = (texte: string, numerique: boolean) => ({
			type: 'tableCell',
			attrs: { numerique },
			content: [p(t(texte))]
		});
		expect(
			serialiserEnMarkdown(
				doc({
					type: 'table',
					content: [
						{ type: 'tableRow', content: [entete('Identifiant'), entete('Type')] },
						{ type: 'tableRow', content: [cellule('118', true), cellule('Complète', false)] }
					]
				})
			)
		).toBe('| Identifiant | Type |\n| ---: | --- |\n| 118 | Complète |\n');
	});

	it('le séparateur s’écrit en astérisques : le corps ne commence jamais par un bloc de métadonnées', () => {
		const ecrit = serialiserEnMarkdown(doc({ type: 'horizontalRule' }));
		expect(ecrit).toBe('***\n');
		expect(ecrit.startsWith('---')).toBe(false);
	});

	it('l’image garde la forme de référence, étiquette et légende sous elle', () => {
		expect(
			serialiserEnMarkdown(
				doc({
					type: 'image',
					attrs: {
						src: '/pj/schema.png',
						alt: 'Baie de brassage',
						etiquette: 'Figure',
						legende: 'Légende'
					}
				})
			)
		).toBe('![Baie de brassage](/pj/schema.png)\n{etiquette="Figure" legende="Légende"}\n');
	});
});

describe('ce que le gel impose à la LECTURE — V-17:3147 et V-18:3120', () => {
	it('trois tirets seuls sur leur ligne sont un séparateur, comme en frappe', () => {
		expect(analyserMarkdown('---')).toEqual(doc({ type: 'horizontalRule' }));
	});

	it('et l’écriture n’en produit jamais : la collision avec l’en-tête est impossible', () => {
		const ecrit = serialiserEnMarkdown(doc({ type: 'horizontalRule' }, p(t('après'))));
		expect(ecrit.split('\n').some((l) => l === '---')).toBe(false);
	});
});

describe('l’échappement — aucun texte ne devient une construction', () => {
	const aller = (texte: string) => serialiserEnMarkdown(doc(p(t(texte))));
	const retour = (texte: string) => analyserMarkdown(aller(texte));

	for (const texte of [
		'# pas un titre',
		'- pas une puce',
		'1. pas un numéro',
		'> pas une citation',
		'::: pas un conteneur',
		'*pas du gras*',
		'_pas d’italique_',
		'==pas surligné==',
		'++pas souligné++',
		'~~pas barré~~',
		'[[pas un lien]]',
		'[pas un lien](x)',
		'| pas | un tableau |',
		'{attribution="pas des attributs"}',
		'&#32; pas une entité',
		'une contre-oblique \\ seule',
		'  espaces aux bords  ',
		'   '
	]) {
		it('rend le texte littéral : ' + JSON.stringify(texte), () => {
			expect(retour(texte)).toEqual(doc(p(t(texte))));
		});
	}

	it('une espace de bord s’écrit en entité, sans quoi elle disparaîtrait', () => {
		expect(aller(' x ')).toBe('&#32;x&#32;\n');
	});
});

describe('ce qui est REFUSÉ, et jamais réparé', () => {
	it('un retour chariot dans un bloc de code — RG-M04-05, tenue par refus à l’entrée', () => {
		const markdown = CLOTURE + 'bash\nls\r\n-l\n' + CLOTURE;
		let message = '';
		try {
			analyserMarkdown(markdown);
		} catch (erreur) {
			message = (erreur as Error).message;
		}
		expect(message).toContain('retour chariot');
		expect(() => analyserMarkdown(markdown)).toThrow(DocumentInvalide);
	});

	it('une clé d’attribut que le format ne connaît pas — transmise au schéma, pas filtrée', () => {
		expect(() =>
			analyserMarkdown(':::alerte{niveau="astuce" glyphe="A" titre="T" couleur="rouge"}\nx\n:::')
		).toThrow(DocumentInvalide);
	});

	it('une alerte sans glyphe — P-7.2 : la couleur ne porte jamais seule l’information', () => {
		expect(() => analyserMarkdown(':::alerte{niveau="astuce" titre="T"}\nx\n:::')).toThrow(
			DocumentInvalide
		);
	});

	it('un conteneur inconnu', () => {
		expect(() => analyserMarkdown(':::encart\nx\n:::')).toThrow(MarkdownInvalide);
	});

	it('un conteneur non refermé', () => {
		expect(() => analyserMarkdown(':::alerte{niveau="astuce" glyphe="A" titre="T"}\nx')).toThrow(
			MarkdownInvalide
		);
	});

	/* CE CAS A CHANGÉ DE CAMP, ET IL N'EST PLUS ICI : voir « la fin du document
	   referme le bloc » plus bas. Un fichier réel dont la clôture manquait faisait
	   refuser la note ENTIÈRE à l'import, sous « contenu illisible ». */

	it('la fin du document referme le bloc clôturé — CommonMark, et un fichier réel', () => {
		/* « The fenced code block ends... at the end of the containing block. » Le
		   contenu déjà lu est GARDÉ : c'est ce que l'auteur a écrit. */
		expect(analyserMarkdown(CLOTURE + 'bash\nls')).toEqual(
			doc({ type: 'codeBlock', attrs: { language: 'bash' }, content: [t('ls')] })
		);
	});

	it('LA SEULE LIMITE DE REPRÉSENTATION : un span de code fait d’espaces, levée bruyamment', () => {
		expect(() => serialiserEnMarkdown(doc(p(t('  ', { type: 'code' }))))).toThrow(
			MarkdownNonRepresentable
		);
	});
});

describe('la frontière d’import — ce qu’un fichier écrit ailleurs apporte', () => {
	it('donne au fichier son nom pour alternative, plutôt que de perdre la note', () => {
		/* `P-06` veut l'alternative non vide, et le schéma la refuse absente. Un
		   fichier écrit ailleurs en porte : refuser le document entier ne rend
		   l'image accessible à personne, il fait perdre la note. */
		expect(markdownImporte('![](media/schema-reseau.png)')).toBe(
			'![schema-reseau.png](media/schema-reseau.png)'
		);
		expect(() => analyserMarkdown('![](media/schema-reseau.png)')).toThrow(DocumentInvalide);
		expect(() => analyserMarkdown(markdownImporte('![](media/schema-reseau.png)'))).not.toThrow();
	});

	it('ne touche pas une image qui porte déjà son alternative', () => {
		const posee = '![Le schéma du réseau](media/schema-reseau.png)';
		expect(markdownImporte(posee)).toBe(posee);
	});

	it('laisse au schéma une source qui ne donne aucun nom', () => {
		expect(markdownImporte('![](media/)')).toBe('![](media/)');
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   LA FRONTIÈRE DE TRANSPORT — `P-26`, ET LE CAS EST SYNTHÉTIQUE

   Cette parade est née d'un défaut mesuré : le sérialiseur de formulaire d'un
   navigateur normalise les fins de ligne en couple, et la création d'une note
   par l'écran rendait 422 là où le même texte passait par appel direct. Le seul
   cas qui l'exerçait était donc ce défaut-là — et une parade dont l'unique cas
   d'épreuve est le défaut qu'elle ferme devient inerte en réussissant.

   Les cas ci-dessous ne dépendent d'aucun état du dépôt, d'aucun navigateur, et
   d'aucune route. Ils jouent les DEUX polarités (`P-5`) : ce que la parade doit
   défaire, et ce qu'elle ne doit PAS toucher — sans quoi elle desserrerait le
   refus de `RG-M04-05`, qui est justement la raison pour laquelle elle ne vit
   pas dans l'analyseur.
   ═══════════════════════════════════════════════════════════════════════════ */

describe('markdownDeFormulaire — la frontière de transport', () => {
	it('défait le couple que le sérialiseur de formulaire a posé', () => {
		expect(markdownDeFormulaire('## Pourquoi\r\n\r\nUn texte.')).toBe('## Pourquoi\n\nUn texte.');
	});

	it('rend un texte déjà propre inchangé — la parade est idempotente', () => {
		const propre = '## Pourquoi\n\nUn texte.';
		expect(markdownDeFormulaire(propre)).toBe(propre);
		expect(markdownDeFormulaire(markdownDeFormulaire('a\r\nb'))).toBe('a\nb');
	});

	it('ne touche PAS un retour chariot SEUL : lui n’est pas une fin de ligne de transport', () => {
		expect(markdownDeFormulaire('ls\r-l')).toBe('ls\r-l');
	});

	it('laisse donc intact le refus de RG-M04-05 sur un retour chariot seul', () => {
		const markdown = CLOTURE + 'bash\nls\r-l\n' + CLOTURE;
		expect(() => analyserMarkdown(markdownDeFormulaire(markdown))).toThrow(DocumentInvalide);
	});

	it('un texte sans aucune fin de ligne traverse sans changer', () => {
		expect(markdownDeFormulaire('')).toBe('');
		expect(markdownDeFormulaire('une ligne')).toBe('une ligne');
	});
});
