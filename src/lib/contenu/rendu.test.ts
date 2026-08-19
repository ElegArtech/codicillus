/**
 * LE RENDU SERVEUR — les quinze constructions, et ce que le gel n'exerce pas.
 *
 * Treize constructions sont éprouvées SUR LE CONTENU DU GEL, par le relevé que
 * `pnpm contenu:constructions` imprime. Les deux dernières — l'image et le
 * diagramme — ne sont exercées par aucun contenu du gel : elles sont éprouvées
 * ici sur un nœud ÉCRIT POUR LE TEST, ce qui est dit à voix haute plutôt que
 * caché dans un document de démonstration (P-02, P-5).
 */
import { describe, expect, it } from 'vitest';
import {
	CONSTRUCTIONS_SANS_CONTENU_DU_GEL,
	releveDesConstructions,
	rendusDuGel
} from './commandes';
import { DocumentInvalide } from './document';
import { documentDuGel, resoudreDansLeCorpus } from './documents-du-gel';
import { rendreDocument, type OptionsDeRendu } from './rendu';

const INTERNE: OptionsDeRendu = { resoudre: resoudreDansLeCorpus, contexte: 'interne' };
const PUBLIC: OptionsDeRendu = { resoudre: resoudreDansLeCorpus, contexte: 'public' };

describe('les quinze constructions', () => {
	const releve = releveDesConstructions();
	for (const r of releve) {
		const declaree = r.construction.numero in CONSTRUCTIONS_SANS_CONTENU_DU_GEL;
		if (declaree) {
			it(`${r.construction.numero} · ${r.construction.libelle} — n’est exercée par AUCUN contenu du gel`, () => {
				expect(r.occurrences).toBe(0);
			});
			continue;
		}
		it(`${r.construction.numero} · ${r.construction.libelle} — exercée par le gel et rendue`, () => {
			expect(r.occurrences, 'aucune occurrence dans le contenu du gel').toBeGreaterThan(0);
			expect(r.signaturesManquantes).toEqual([]);
		});
	}
});

describe('les deux constructions qu’aucun contenu du gel n’exerce', () => {
	it('l’image — nœud écrit pour le test, faute d’une seule image dans les 41 maquettes', () => {
		const html = rendreDocument(
			{
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
			},
			INTERNE
		);
		expect(html).toContain('<figure class="figure">');
		expect(html).toContain('class="figure__cadre"');
		expect(html).toContain('<img src="/pj/schema.png" alt="Baie de brassage, façade">');
		/* `V-17:3076` — la légende d'une figure est en deux parties. */
		expect(html).toContain('<figcaption><b>Figure</b><span>Légende</span></figcaption>');
	});

	it('le diagramme — nœud écrit pour le test, le gel ne portant que des SVG écrits à la main', () => {
		const html = rendreDocument(
			{
				type: 'doc',
				content: [
					{
						type: 'diagramme',
						attrs: {
							/* `V-17:3078` — la seule source de diagramme du gel. */
							source: 'A --> B\nB --> C',
							langage: 'mermaid',
							alternative: 'A précède B, qui précède C.',
							etiquette: 'Schéma 1',
							legende: 'Enchaînement.'
						}
					}
				]
			},
			INTERNE
		);
		expect(html).toContain(
			'<pre class="mermaid" role="img" aria-label="A précède B, qui précède C.">'
		);
		expect(html).toContain('A --&gt; B\nB --&gt; C');
		expect(html).toContain('<figcaption><b>Schéma 1</b><span>Enchaînement.</span></figcaption>');
	});

	it('refuse un diagramme dans un langage qu’aucun moteur de la pile ne rend', () => {
		expect(() =>
			rendreDocument(
				{
					type: 'doc',
					content: [
						{
							type: 'diagramme',
							attrs: {
								source: 'digraph {}',
								langage: 'graphviz',
								alternative: 'x',
								etiquette: null,
								legende: null
							}
						}
					]
				},
				INTERNE
			)
		).toThrow(DocumentInvalide);
	});
});

describe('les trois sorts d’un lien interne', () => {
	const doc = (cible: string) => ({
		type: 'doc',
		content: [
			{
				type: 'paragraph',
				content: [
					{ type: 'text', text: 'la note', marks: [{ type: 'lienInterne', attrs: { cible } }] }
				]
			}
		]
	});

	it('résolu — `a.lien-int`, avec l’adresse rendue par le rangement', () => {
		const html = rendreDocument(doc('n-diag-barman'), INTERNE);
		expect(html).toMatch(/<a class="lien-int" href="\/[^"]+">la note<\/a>/);
	});

	it('cassé — `a.lien-casse`, et SANS href : la cible n’existe pas', () => {
		const html = rendreDocument(doc('n-cette-note-nexiste-pas'), INTERNE);
		expect(html).toBe('<p><a class="lien-casse">la note</a></p>');
	});

	it('privé — en lecture publique, une note interne ne devient pas un chemin (RG-ACC-01)', () => {
		const html = rendreDocument(doc('n-diag-barman'), PUBLIC);
		expect(html).toContain('<span class="lien-prive"');
		expect(html).not.toContain('<a ');
	});

	it('la même note publique reste un lien en lecture publique', () => {
		const html = rendreDocument(doc('n-mot-de-passe'), PUBLIC);
		expect(html).toContain('class="lien-int"');
	});
});

describe('le rendu du gel', () => {
	const html = rendusDuGel();

	it('rend le paragraphe selon son enveloppe — cinq formes, toutes du gel', () => {
		/* alerte : `V-14:1546` — un `div` nu ; tâche : `V-14:1673` — un `span` ;
		   citation, élément de liste et cellule : aucune enveloppe. */
		expect(html).toContain('<div class="alerte__tete">');
		expect(html).toContain(
			'</div><div>Comptez 40 minutes pour une base de 120 Go sur disque local.'
		);
		expect(html).toContain('<li><input type="checkbox" checked disabled><span>Le service démarre');
		expect(html).toContain('<blockquote class="prose-cit">Une restauration qui échoue');
		expect(html).toContain('<td class="num">20260810T020112</td>');
	});

	it('rend l’attribution d’une citation en pied, telle que le gel l’écrit', () => {
		expect(html).toContain(
			"<footer>— Retour d'expérience de l'astreinte, revue trimestrielle du 12 mars 2026</footer>"
		);
	});

	it('rend le glyphe de chaque alerte — jamais la couleur seule (P-7.2, RG-M18-09)', () => {
		const alertes = html.match(/<div class="alerte alerte--[a-z]+">/g) ?? [];
		const glyphes = html.match(/<span class="alerte__glyphe">/g) ?? [];
		expect(alertes.length).toBe(8);
		expect(glyphes.length).toBe(alertes.length);
	});

	it('rend les tâches en lecture seule, cochées ou non (M04.6)', () => {
		expect(html).toContain('<input type="checkbox" checked disabled>');
		expect(html).toContain('<input type="checkbox" disabled>');
	});

	it('RG-M04-05 — le `pre > code` ne contient que le texte stocké', () => {
		const bloc = /<pre><code>([\s\S]*?)<\/code><\/pre>/.exec(html);
		expect(bloc).not.toBeNull();
		const texte = (bloc?.[1] ?? '')
			.replaceAll('&lt;', '<')
			.replaceAll('&gt;', '>')
			.replaceAll('&quot;', '"')
			.replaceAll('&amp;', '&');
		expect(texte).toBe(
			'# depuis bkp-01.prod, sous le compte barman\n' +
				'barman list-backup pg-prod-01\n' +
				'barman show-backup pg-prod-01 20260810T020112'
		);
	});

	it('rend l’ancre des titres, et n’en invente pas là où le gel n’en pose pas', () => {
		expect(html).toContain('<h2 id="s-avant">Avant de commencer</h2>');
		expect(html).toContain('<h4>Niveau 4 — regroupement</h4>');
	});

	it('ouvre les liens externes dans un nouvel onglet, avec le `rel` qui va avec', () => {
		expect(html).toContain(
			'<a class="lien-ext" href="https://docs.pgbarman.org" target="_blank" rel="noopener">'
		);
	});
});

describe('le rendu ne fait jamais confiance à ce qu’on lui donne', () => {
	it('échappe le texte : un document ne devient jamais du balisage', () => {
		const html = rendreDocument(
			{
				type: 'doc',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: '<script>a & "b"' }] }]
			},
			INTERNE
		);
		expect(html).toBe('<p>&lt;script&gt;a &amp; &quot;b&quot;</p>');
	});

	it('refuse de rendre un document non validé, plutôt que d’en rendre une part', () => {
		expect(() =>
			rendreDocument({ type: 'doc', content: [{ type: 'paragraph' }, { type: 'iframe' }] }, INTERNE)
		).toThrow(DocumentInvalide);
	});

	it('ne rend rien du tout d’un document invalide', () => {
		let html = 'non rendu';
		try {
			html = rendreDocument({ type: 'doc', content: [{ type: 'iframe' }] }, INTERNE);
		} catch {
			/* attendu */
		}
		expect(html).toBe('non rendu');
	});
});

describe('le rendu du registre Opérationnel du gel', () => {
	it('rend les quatre tâches non cochées de V-14, dans l’ordre', () => {
		const html = rendreDocument(documentDuGel('n-restaurer-pg', 'operationnel'), INTERNE);
		expect((html.match(/<input type="checkbox" disabled>/g) ?? []).length).toBe(4);
		expect(html).not.toContain('checked');
	});
});
