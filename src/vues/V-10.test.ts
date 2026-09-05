/**
 * V-10 — LA PAGE D'UN UNIVERS, ÉPROUVÉE SUR SES TROIS VIDES ET SES COMPTEURS.
 *
 * CE QUE CE FICHIER TIENT, ET POURQUOI IL EXISTE. La refonte donne à cette vue des
 * propriétés REQUISES et déjà agrégées : le compilateur garde la porte du côté des
 * routes, mais il ne dit rien de ce que l'écran RÉPOND quand la donnée est vide. Le
 * produit commence vide, et ces cas-là sont ceux qui vivent en production le premier
 * jour :
 *
 *   1. un univers sans domaine — l'écran nomme le geste, et l'ouvre ;
 *   2. un univers avec des domaines mais sans note — la bande des compteurs ne rend
 *      pas cinq zéros, elle dit ce qui manque ;
 *   3. un domaine sans note — sa ligne rend le tiret PARTOUT, jamais des zéros.
 *
 * ET UNE PROPRIÉTÉ DE FOND : la troisième colonne d'une ligne de domaine réunit tout
 * le retard et prend la teinte du PIRE état présent. C'est le cas de la capture de
 * référence — cinq à jour, deux bientôt, deux en retard dont une à revoir — et la
 * couleur y est celle d'« À revoir ».
 *
 * AUCUNE LIGNE DU JEU DE DÉMONSTRATION N'ENTRE ICI : les propriétés sont construites
 * en toutes lettres, ce qui est exactement ce qu'un chargeur sert.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import { ORDRE_DES_ETATS, type EtatDeVivacite } from '../lib/fraicheur';

afterAll(fermerLeHarnais);

/** Le texte rendu, balisage retiré — ce que l'œil lit, et rien d'autre. */
function texteDe(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Le contenu de `main`, sans le rail : celui-ci ne vient pas des propriétés. */
function contenuDe(html: string): string {
	return /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
}

/** Les trois colonnes d'état de la première ligne de domaine, balisage compris. */
function colonnesDe(html: string): string {
	return (
		/<span class="ligne-dom__etats">([\s\S]*?)<span class="ligne-dom__quand"/.exec(html)?.[1] ?? ''
	);
}

/** Les cinq compteurs, dans l'ordre de la fabrique — la forme que le chargeur sert. */
function repartition(valeurs: Partial<Record<EtatDeVivacite, number>>) {
	return ORDRE_DES_ETATS.map((etat) => ({ etat, n: valeurs[etat] ?? 0 }));
}

const ADRESSES = {
	cartographie: '/cartographie?perimetre=univers%7CClaude',
	surveillance: '/recherche?univers=Claude',
	creationDeDomaine: '/console/domaines',
	creationDeNote: '/notes/nouvelle',
	profil: '/mon-profil'
};

/** Le strict nécessaire pour rendre l'écran — un univers neuf, et rien dedans. */
const NEUF = {
	univers: { nom: 'Claude', description: 'Notes techniques.', glyphe: 'boussole' },
	repartition: repartition({}),
	domaines: [],
	contributeurs: 0,
	heuresDepuisLActivite: null,
	activite: [],
	seuilBientot: 10,
	adresses: ADRESSES
};

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-10', { ...NEUF, ...proprietes });
}

describe('V-10 — un univers sans domaine', () => {
	it('nomme le geste qui débloque, et l’ouvre', async () => {
		const html = await rendu({});
		const texte = texteDe(contenuDe(html));
		expect(texte).toContain('Cet univers ne contient aucun domaine');
		expect(texte).toContain('Créer un domaine dans Claude');
		expect(html).toContain(`href="${ADRESSES.creationDeDomaine}"`);
	});

	/* `P-09` — en lecture seule, l'action n'est pas ÉMISE. Ni grisée, ni masquée. */
	it('en lecture seule, l’action de création n’est pas rendue', async () => {
		const texte = texteDe(contenuDe(await rendu({ droits: 'lecture' })));
		expect(texte).toContain('Cet univers ne contient aucun domaine');
		expect(texte).not.toContain('Créer un domaine dans Claude');
	});

	it('annonce zéro domaine sans faire mine d’en trier', async () => {
		const html = await rendu({});
		expect(texteDe(contenuDe(html))).toContain('aucun domaine');
		expect(html).not.toContain('tri__select');
	});
});

describe('V-10 — un univers sans note', () => {
	const DOMAINE_VIDE = {
		nom: 'audit_code',
		description: 'Audits, incidents et procédures.',
		adresse: '/univers/claude/audit_code',
		repartition: repartition({}),
		heures: null
	};

	it('la bande des compteurs dit ce qui manque au lieu d’aligner cinq zéros', async () => {
		const texte = texteDe(contenuDe(await rendu({ domaines: [DOMAINE_VIDE] })));
		expect(texte).toContain('Cet univers ne porte encore aucune note');
		expect(texte).not.toContain('notes au total');
	});

	it('la carte « À surveiller » ne se déclare pas calme quand il n’y a rien', async () => {
		const texte = texteDe(contenuDe(await rendu({ domaines: [DOMAINE_VIDE] })));
		expect(texte).toContain('Aucune note à surveiller : cet univers n’en porte encore aucune.');
		expect(texte).not.toContain('toutes les notes de cet univers sont à jour');
	});

	/* UN DOMAINE VIDE REND LE TIRET PARTOUT. Un zéro compté et un ensemble vide ne
	   disent pas la même chose, et la ligne ne doit pas les confondre. */
	it('la ligne d’un domaine vide ne rend aucun zéro', async () => {
		const html = await rendu({ domaines: [DOMAINE_VIDE] });
		const ligne = /<a class="ligne-dom"[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
		expect(ligne).not.toBe('');
		expect(texteDe(ligne)).not.toContain('0');
		/* Quatre tirets : le nombre de notes, les trois compteurs. Plus celui de la
		   dernière activité, qui n'a jamais eu lieu. */
		expect((texteDe(ligne).match(/—/g) ?? []).length).toBe(5);
		expect(html).toContain('href="/univers/claude/audit_code"');
	});

	it('le fil d’activité dit la semaine vide plutôt que de rester blanc', async () => {
		expect(texteDe(contenuDe(await rendu({ domaines: [DOMAINE_VIDE] })))).toContain(
			'Rien de neuf cette semaine'
		);
	});
});

describe('V-10 — les compteurs de la référence', () => {
	/** L'univers de la capture : 20 à jour, 2 bientôt, 1 à vérifier, 1 à revoir. */
	const CLAUDE = {
		repartition: repartition({ ajour: 20, bientot: 2, averifier: 1, arevoir: 1 }),
		contributeurs: 1,
		heuresDepuisLActivite: 2,
		domaines: [
			{
				nom: 'audit_code',
				description: 'Audits, incidents et procédures autour de Claude Code.',
				adresse: '/univers/claude/audit_code',
				repartition: repartition({ ajour: 5, bientot: 2, averifier: 1, arevoir: 1 }),
				heures: 2
			}
		]
	};

	it('n’affiche que les états présents, et le total à côté', async () => {
		const texte = texteDe(contenuDe(await rendu(CLAUDE)));
		expect(texte).toContain('20 à jour');
		expect(texte).toContain('2 bientôt à vérifier');
		expect(texte).toContain('1 à vérifier');
		expect(texte).toContain('1 à revoir');
		expect(texte).not.toContain('obsolète');
		expect(texte).toContain('24 notes au total');
	});

	it('la ligne de statistiques accorde ses quatre libellés', async () => {
		const texte = texteDe(contenuDe(await rendu(CLAUDE)));
		expect(texte).toContain('24 notes');
		expect(texte).toContain('1 domaine ');
		expect(texte).toContain('1 contributeur ');
		expect(texte).toContain('il y a 2 h dernière activité');
	});

	/**
	 * LES TROIS COLONNES : cinq à jour, deux bientôt, puis DEUX en retard — la somme
	 * d'« À vérifier » et d'« À revoir » —, et la teinte est celle du pire.
	 */
	it('réunit le retard en une colonne, à la couleur du pire état présent', async () => {
		const html = await rendu(CLAUDE);
		const ligne = colonnesDe(html);
		expect(texteDe(ligne)).toBe('5 À jour 2 Bientôt à vérifier 2 À revoir');
		expect(ligne).toContain('ligne-dom__nb--arevoir');
		expect(ligne).not.toContain('ligne-dom__nb--averifier');
	});

	/** Un compte nul garde son glyphe et son libellé, mais pas la teinte de l'état. */
	it('un compteur à zéro reste gris', async () => {
		const html = await rendu({
			...CLAUDE,
			domaines: [
				{
					...CLAUDE.domaines[0],
					repartition: repartition({ ajour: 11 })
				}
			]
		});
		const ligne = colonnesDe(html);
		expect(texteDe(ligne)).toBe('11 À jour 0 Bientôt à vérifier 0 À vérifier');
		expect(ligne).not.toContain('ligne-dom__nb--bientot');
	});

	it('les deux alertes nomment le seuil et mènent à une liste réelle', async () => {
		const html = await rendu(CLAUDE);
		const texte = texteDe(contenuDe(html));
		expect(texte).toContain('2 notes nécessitent votre attention');
		expect(texte).toContain('Leur période de validité est dépassée');
		expect(texte).toContain('2 notes arrivent bientôt à échéance');
		expect(texte).toContain('Vérification prévue dans les 10 prochains jours');
		expect(texte).toContain('Voir toutes les notes à surveiller');
		expect(html).toContain(`href="${ADRESSES.surveillance}"`);
	});

	it('sans retard ni échéance proche, la carte se déclare calme', async () => {
		const texte = texteDe(
			contenuDe(await rendu({ ...CLAUDE, repartition: repartition({ ajour: 24 }) }))
		);
		expect(texte).toContain('Rien à surveiller : toutes les notes de cet univers sont à jour.');
		expect(texte).not.toContain('nécessitent votre attention');
	});
});

describe('V-10 — le fil d’activité', () => {
	const EVENEMENTS = [
		{
			type: 'verification' as const,
			qui: 'Alexandre Berge',
			objet: 'Note technique',
			adresse: '/notes/n-1',
			heures: 2
		},
		{
			type: 'edition' as const,
			qui: 'Alexandre Berge',
			objet: 'Incident — PATH Linux',
			adresse: '/notes/n-2',
			heures: 12
		},
		{
			type: 'publication' as const,
			qui: 'Alexandre Berge',
			objet: 'Mode autonome',
			adresse: '/notes/n-3',
			heures: 25
		},
		{
			type: 'revision' as const,
			qui: 'Alexandre Berge',
			objet: 'Workflow — Analyse IA',
			adresse: '/notes/n-4',
			heures: 48
		},
		{
			type: 'import' as const,
			qui: 'Alexandre Berge',
			objet: '12 notes reprises depuis Fichiers déposés',
			adresse: '',
			heures: 96
		}
	];

	it('nomme les cinq types, leur badge et leur ancienneté', async () => {
		const texte = texteDe(contenuDe(await rendu({ activite: EVENEMENTS })));
		expect(texte).toContain('Note vérifiée — Note technique');
		expect(texte).toContain('Note modifiée — Incident — PATH Linux');
		expect(texte).toContain('Nouvelle note — Mode autonome');
		expect(texte).toContain('Révision demandée — Workflow — Analyse IA');
		expect(texte).toContain('Import terminé — 12 notes reprises depuis Fichiers déposés');
		expect(texte).toContain('par Alexandre Berge · il y a 2 h');
		expect(texte).toContain('par Alexandre Berge · il y a 4 j');
		expect(texte).toContain('Vérification');
		expect(texte).toContain('Vivacité');
		expect(texte).toContain('Import');
	});

	/* L'objet d'un événement OUVRE la note ; un lot d'import n'en vise aucune, et sa
	   ligne n'est donc pas un lien mort. */
	it('l’objet mène à sa note, sauf pour un lot qui n’en vise aucune', async () => {
		const html = await rendu({ activite: EVENEMENTS });
		expect(html).toContain('href="/notes/n-1"');
		expect(html).not.toContain('href=""');
	});
});
