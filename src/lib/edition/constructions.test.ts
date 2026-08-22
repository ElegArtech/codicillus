/**
 * LES UNITAIRES DES QUINZE CONSTRUCTIONS, VUES DEPUIS L'ÉDITEUR.
 *
 * Le critère de sortie du contrat de `T-050` : « les quinze constructions →
 * produites par l'éditeur, ou NOMMÉES et comptées si une manque ». Ce fichier
 * établit les deux moitiés :
 *
 *   · pour chaque construction, un document est ASSEMBLÉ à partir des gabarits
 *     que le gel donne, il traverse les deux portes de l'éditeur, et chacun de
 *     ses PORTEURS — ceux que `CONSTRUCTIONS` de `document.ts` déclare — est
 *     compté par `compterPorteur`, l'unique comptage du dépôt ;
 *   · les trois lacunes sont énumérées, comptées, et une construction hors liste
 *     dont un porteur tomberait à zéro fait rougir. C'est la forme opposable
 *     qu'emploie déjà `CONSTRUCTIONS_SANS_CONTENU_DU_GEL`.
 *
 * AUCUN COMPTAGE N'EST ÉCRIT ICI. `compterPorteur` et
 * `compterLesLiensDUnDocument` viennent de `src/lib/contenu/commandes.ts` : deux
 * comptages divergeraient au premier cas limite, et le rapport
 * `pnpm contenu:constructions` cesserait de dire la même chose que cette
 * épreuve.
 */
import { describe, expect, it } from 'vitest';
import { compterLesLiensDUnDocument, compterPorteur } from '../contenu/commandes';
import { analyserDocument, CONSTRUCTIONS, type Bloc, type Document } from '../contenu/document';
import { documentDepuisNoeud, noeudDepuisDocument } from './document';
import {
	compteDesConstructions,
	CONSTRUCTIONS_DE_LEDITEUR,
	GABARITS,
	gabaritDeDiagramme,
	gabaritDeLienInterne,
	gabaritDeMarque,
	gabaritDImage,
	LACUNES,
	MARQUES_DE_LA_BARRE,
	SOURCE_DE_DIAGRAMME_DU_GEL
} from './constructions';

/* ═══════════════════════════════════ Les gabarits du gel ════════════════ */

const document = (blocs: readonly Bloc[]): Document => ({ type: 'doc', content: blocs });

describe('chaque gabarit d’insertion du gel est un document canonique que l’éditeur porte', () => {
	for (const gabarit of GABARITS) {
		it(`« ${gabarit.libelle} » (${gabarit.cle}) — validé, porté, et rendu identique`, () => {
			const attendu = analyserDocument(document(gabarit.blocs));
			const retour = documentDepuisNoeud(noeudDepuisDocument(attendu));
			expect(JSON.stringify(retour)).toBe(JSON.stringify(attendu));
		});
	}

	it('les quatorze gabarits de la barre gelée sont tous éprouvés', () => {
		expect(GABARITS).toHaveLength(14);
	});
});

/* Les six sont portées depuis que `schema.ts` écrit le surligné en propre. Le
   septième cas ci-dessous le vérifie NOMMÉMENT, pour que sa disparition rougisse. */
describe('les six marques de caractère de la barre gelée', () => {
	for (const bouton of MARQUES_DE_LA_BARRE) {
		it(`« ${bouton.libelle} » — portée par l’éditeur`, () => {
			const gabarit = analyserDocument(gabaritDeMarque(bouton.marque, bouton.libelle));
			expect(compterPorteur(gabarit, bouton.marque)).toBe(1);
			expect(JSON.stringify(documentDepuisNoeud(noeudDepuisDocument(gabarit)))).toBe(
				JSON.stringify(gabarit)
			);
		});
	}

	it('le surligné est du lot — c’était la seule marque hors de portée', () => {
		const surligne = MARQUES_DE_LA_BARRE.find((b) => b.marque === 'highlight');
		expect(surligne, 'le bouton « Surligné » du gel (V-17:1526)').toBeDefined();
		const gabarit = analyserDocument(gabaritDeMarque('highlight', 'Surligné'));
		expect(compterPorteur(documentDepuisNoeud(noeudDepuisDocument(gabarit)), 'highlight')).toBe(1);
	});
});

/* ═══════════════════════════════════ Les porteurs, un par un ════════════ */

/**
 * TOUT CE QUE L'ÉDITEUR SAIT INSÉRER, en un seul document — les gabarits du gel,
 * les six marques de la barre, les trois fabriques paramétrées, et les niveaux de
 * titre que le schéma admet et que la barre n'offre pas.
 *
 * Les valeurs des fabriques sont celles du gel là où il en donne
 * (`SOURCE_DE_DIAGRAMME_DU_GEL`) et des valeurs D'ÉPREUVE là où il n'en donne
 * pas — la source d'une image, l'alternative d'un diagramme, la cible d'un lien
 * interne. Elles ne sortent pas de ce fichier : ce sont les paramètres que
 * l'écran devra fournir, et les lacunes 10 et 12 disent qu'aucun écran ne les
 * fournit encore.
 */
function toutCeQueLEditeurInsere(): Document {
	const blocs: Bloc[] = [];
	for (const gabarit of GABARITS) blocs.push(...gabarit.blocs);
	for (const bouton of MARQUES_DE_LA_BARRE) {
		blocs.push(...gabaritDeMarque(bouton.marque, bouton.libelle).content);
	}
	blocs.push(...gabaritDeLienInterne('n-restaurer-pg', 'Restaurer une base PostgreSQL').content);
	blocs.push(...gabaritDeLienInterne('n-inexistante-au-corpus', 'Une cible disparue').content);
	blocs.push(
		...gabaritDImage('pieces-jointes/schema.png', 'Le schéma d’enchaînement', 'Figure', 'Légende')
			.content
	);
	blocs.push(
		...gabaritDeDiagramme(
			SOURCE_DE_DIAGRAMME_DU_GEL,
			'A précède B, qui précède C — la restitution exploitable sans le graphique'
		).content
	);
	/* Les niveaux 1, 5 et 6 : le schéma les porte, la barre gelée n'offre que
	   H2, H3 et H4 (V-17:1516-1518). Le fait est du gel, il est déclaré au
	   rapport, et il est ÉPROUVÉ ici plutôt que supposé. */
	for (const level of [1, 5, 6] as const) {
		blocs.push({
			type: 'heading',
			attrs: { level, ancre: null },
			content: [{ type: 'text', text: `Titre de niveau ${level}` }]
		});
	}
	return analyserDocument(document(blocs));
}

/** Tout ce que la BARRE GELÉE commande — le surligné compris, et l'éditeur le porte. */
const TOUT = toutCeQueLEditeurInsere();

describe('les quinze constructions de M04.6, porteur par porteur', () => {
	for (const construction of CONSTRUCTIONS) {
		const lacune = LACUNES[construction.numero] ?? null;
		const attendues = construction.porteurs;

		it(`n° ${construction.numero} « ${construction.libelle} » — ${lacune === null ? 'produite' : 'lacune nommée'}`, () => {
			if (construction.numero === 13 || construction.numero === 14) {
				/* Les deux constructions de lien interne partagent un porteur : seule
				   la RÉSOLUTION de la cible les distingue, exactement comme
				   `releveDesConstructions()` le fait pour le gel. */
				const compte = compterLesLiensDUnDocument(TOUT, (cible) =>
					cible === 'n-restaurer-pg'
						? { id: cible, titre: 'Restaurer', adresse: `/notes/${cible}`, publique: false }
						: null
				);
				expect(construction.numero === 13 ? compte.resolus : compte.casses).toBeGreaterThan(0);
				return;
			}
			for (const porteur of attendues) {
				expect(compterPorteur(TOUT, porteur), `porteur « ${porteur} »`).toBeGreaterThan(0);
			}
		});
	}

	it('les six niveaux de titre sont produits, alors que la barre n’en offre que trois', () => {
		const niveaux = new Set(
			TOUT.content.filter((b) => b.type === 'heading').map((b) => b.attrs.level)
		);
		expect([...niveaux].sort()).toEqual([1, 2, 3, 4, 5, 6]);
		expect(GABARITS.filter((g) => g.cle.startsWith('h'))).toHaveLength(3);
	});

	it('tout ce que la barre gelée commande traverse les deux portes sans perte', () => {
		expect(JSON.stringify(documentDepuisNoeud(noeudDepuisDocument(TOUT)))).toBe(
			JSON.stringify(TOUT)
		);
	});

	it('le surligné y est, et il ressort — plus rien n’est retiré du document d’épreuve', () => {
		/* Ce cas portait la lacune n° 2 : le document devait être amputé du bouton
		   « Surligné » (V-17:1526) pour entrer. La marque est écrite en propre au
		   schéma, l'amputation n'a plus lieu d'être. */
		expect(compterPorteur(TOUT, 'highlight')).toBe(1);
		expect(compterPorteur(documentDepuisNoeud(noeudDepuisDocument(TOUT)), 'highlight')).toBe(1);
	});
});

/* ═══════════════════════════════════ Les lacunes, opposables ════════════ */

describe('les lacunes sont nommées, comptées, et la liste est opposable', () => {
	it('trois constructions sur quinze portent une lacune, et ce sont les n° 2, 10 et 12', () => {
		const compte = compteDesConstructions();
		expect(compte.total).toBe(15);
		expect(compte.avecLacune).toBe(3);
		expect(compte.produites).toBe(12);
		expect(
			Object.keys(LACUNES)
				.map(Number)
				.sort((a, b) => a - b)
		).toEqual([2, 10, 12]);
	});

	it('chaque lacune dit ce qui manque, et non qu’elle manque', () => {
		for (const [numero, texte] of Object.entries(LACUNES)) {
			expect(texte.length, `lacune n° ${numero}`).toBeGreaterThan(200);
		}
	});

	it('aucune marque du format n’est sans porteur — le surligné était la dernière', () => {
		/* La liste est calculée par `schema.ts` ; le surligné y figurait, il est
		   désormais écrit en propre. Une marque nouvelle au format sans porteur au
		   schéma ferait rougir ce cas. */
		expect(compteDesConstructions().marquesSansExtension).toEqual([]);
	});

	it('les quinze entrées du relevé nomment une origine et au moins une commande', () => {
		expect(CONSTRUCTIONS_DE_LEDITEUR).toHaveLength(15);
		for (const c of CONSTRUCTIONS_DE_LEDITEUR) {
			expect(c.origine.length, `n° ${c.numero}`).toBeGreaterThan(0);
			expect(c.commandes.length, `n° ${c.numero}`).toBeGreaterThan(0);
		}
	});

	it('les trois nœuds écrits en propre d’ADR-003 sont les seuls sans paquet', () => {
		const enPropre = CONSTRUCTIONS_DE_LEDITEUR.filter((c) =>
			c.origine.some((o) => !o.startsWith('@tiptap/'))
		);
		/* Quatre entrées, trois porteurs : les liens internes et les liens cassés
		   partagent la marque `lienInterne`. */
		expect(enPropre.map((c) => c.numero)).toEqual([8, 12, 13, 14]);
	});
});
