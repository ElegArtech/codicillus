/**
 * Banc de comparaison visuelle — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS PROUVENT, ET POURQUOI ILS EXISTENT.
 *
 * L'étalonnage à blanc prouve que le banc sait dire OUI de façon reproductible.
 * Il ne prouve pas qu'il sait dire NON : un comparateur qui renverrait
 * « conforme » quoi qu'il arrive passerait l'à-blanc avec les honneurs. C'est
 * exactement le mode de défaillance RA-01 du plan (§12) — la vérification qui
 * ne vérifie rien.
 *
 * Ces unitaires ferment cet angle mort au niveau du comparateur ; la sonde de
 * bout en bout (`pnpm verif:maquette V-xx --sonde=…`) le ferme au niveau de la
 * chaîne complète, capture comprise.
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
import { encoder, decoder, image } from './png.mjs';
// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
import { comparerPixels, comparerStructure, comparerZone, TOLERANCES } from './comparer.mjs';
// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
import { BLOCS_HORS_PRODUIT, zonesDe, declarationZones } from './conditions.mjs';
import {
	adresseDeLEtat,
	declarationEtatDeZone,
	declarationRevelation,
	limitesDeLaSource,
	SOURCES,
	PREFIXE
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './mode-demo.mjs';
// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
import { REVELATIONS, reveler } from './revelation.mjs';

type Image = { largeur: number; hauteur: number; donnees: Buffer };

/** Une image unie, dans laquelle on peut altérer un pixel précis. */
function unie(largeur: number, hauteur: number, teinte = 128): Image {
	return image(largeur, hauteur, [teinte, teinte, teinte, 255]) as Image;
}

function altererPixels(img: Image, combien: number, delta: number): Image {
	for (let i = 0; i < combien; i++) {
		const p = i * 4;
		img.donnees[p] = Math.min(255, (img.donnees[p] ?? 0) + delta);
	}
	return img;
}

describe('codec PNG', () => {
	it('rend à la lecture exactement ce qui a été écrit', () => {
		const source = unie(37, 11, 200);
		altererPixels(source, 5, 30);
		const relu = decoder(encoder(source)) as Image;
		expect(relu.largeur).toBe(37);
		expect(relu.hauteur).toBe(11);
		expect(Buffer.compare(relu.donnees, source.donnees)).toBe(0);
	});

	it('refuse bruyamment ce qui n’est pas un PNG', () => {
		expect(() => decoder(Buffer.from('pas un png'))).toThrow(/signature/i);
	});
});

describe('niveau 2 — pixels', () => {
	it('déclare zéro pixel différent entre deux captures identiques', () => {
		const png = encoder(unie(100, 100));
		const r = comparerPixels(png, png);
		expect(r.pixelsDifferents).toBe(0);
		expect(r.proportion).toBe(0);
		expect(r.verdict).toBe('conforme');
	});

	it('compte le pixel altéré — l’instrument sait dire non', () => {
		const a = unie(100, 100);
		const b = altererPixels(unie(100, 100), 1, 40);
		const r = comparerPixels(encoder(a), encoder(b));
		expect(r.pixelsDifferents).toBe(1);
		expect(r.ecartCanalMax).toBe(40);
	});

	it('ignore ce qui reste sous le seuil de canal de 3 %', () => {
		// 3 % de 255 = 7,65, arrondi à 8 : un écart de 7 ne compte pas, 9 compte.
		const sous = comparerPixels(encoder(unie(50, 50)), encoder(altererPixels(unie(50, 50), 10, 7)));
		const sur = comparerPixels(encoder(unie(50, 50)), encoder(altererPixels(unie(50, 50), 10, 9)));
		expect(sous.pixelsDifferents).toBe(0);
		expect(sur.pixelsDifferents).toBe(10);
	});

	it('rend les trois verdicts aux frontières écrites par le plan', () => {
		const total = 100 * 100;
		const verdictPour = (combien: number) =>
			comparerPixels(encoder(unie(100, 100)), encoder(altererPixels(unie(100, 100), combien, 40)))
				.verdict;
		// ARB-018 — le seuil de conformité est ZÉRO, non plus 0,5 %.
		// Zéro pixel : conforme · au-delà et jusqu'à 3 % : recours au niveau 3,
		// arbitré et compté · > 3 % : échec sec.
		expect(verdictPour(0)).toBe('conforme');
		expect(verdictPour(1)).toBe('niveau3'); // un seul pixel ne passe plus
		expect(verdictPour(Math.floor(total * 0.004))).toBe('niveau3');
		expect(verdictPour(Math.floor(total * 0.02))).toBe('niveau3');
		expect(verdictPour(Math.floor(total * 0.05))).toBe('echec');
	});

	it('refuse de comparer deux captures de tailles différentes', () => {
		const r = comparerPixels(encoder(unie(100, 100)), encoder(unie(100, 101)));
		expect(r.verdict).toBe('echec');
		expect(r.motif).toBe('dimensions divergentes');
	});

	it('lit ses seuils dans la baseline, jamais en dur', () => {
		expect(TOLERANCES.niveau2.seuil_canal).toBe(0.03);
		expect(TOLERANCES.niveau2.conforme_au_plus).toBe(0); // ARB-018
		expect(TOLERANCES.niveau2.echec_au_dela).toBe(0.03);
		expect(TOLERANCES.a_blanc.tolerance_pixels).toBe(0);
	});
});

describe('niveau 1 — structure', () => {
	const reference = {
		aria: '- banner:\n  - link "Codicillus"\n- main:\n  - heading "Titre" [level=1]',
		tabulation: ['a « Codicillus »', 'button « Créer »']
	};

	it('accepte deux relevés identiques', () => {
		expect(comparerStructure(reference, reference).conforme).toBe(true);
	});

	it('refuse sans tolérance un titre de niveau différent', () => {
		const candidat = { ...reference, aria: reference.aria.replace('level=1', 'level=2') };
		const r = comparerStructure(reference, candidat);
		expect(r.conforme).toBe(false);
		expect(r.ecarts[0].quoi).toBe('instantané ARIA');
		expect(r.ecarts[0].detail.ligne).toBe(4);
	});

	it('refuse un ordre de tabulation permuté, à contenu identique', () => {
		const candidat = { ...reference, tabulation: [...reference.tabulation].reverse() };
		const r = comparerStructure(reference, candidat);
		expect(r.conforme).toBe(false);
		expect(r.ecarts[0].quoi).toBe('ordre de tabulation');
	});

	it('refuse un repère ARIA manquant', () => {
		const candidat = { ...reference, aria: reference.aria.replace('- banner:\n', '') };
		expect(comparerStructure(reference, candidat).conforme).toBe(false);
	});
});

describe('zones comparées — ARB-012, ÉCART-011 É-5', () => {
	it('ne restreint la surface que là où un arbitrage l’autorise', () => {
		expect(zonesDe('V-37')).toEqual(['aside.rail', 'header.barre']);
		expect((declarationZones('V-37') as { arbitrage: string }).arbitrage).toMatch(/ARB-012/);
	});

	it('compare page entière toute vue qui n’en déclare pas — le défaut est le plus strict', () => {
		for (const vue of ['V-01', 'V-07', 'V-14', 'V-41']) expect(zonesDe(vue)).toEqual([]);
		expect(declarationZones('V-14')).toBeNull();
	});

	it('retire les blocs que la maquette DÉCLARE hors produit, et eux seuls', () => {
		expect(BLOCS_HORS_PRODUIT).toEqual(['.planche', 'section.regles']);
		// `ul.regles` de V-06 et V-25 est la liste « Ce qui est demandé » des
		// règles de mot de passe : elle EST du produit. Un sélecteur de classe
		// seule l'aurait retirée du DOM en croyant retirer une note de maquette.
		expect(BLOCS_HORS_PRODUIT).not.toContain('.regles');
	});
});

describe('zone non rendue — une restitution est un fait comparable', () => {
	const rendue = { png: Buffer.from([1]) };
	const absente = { png: null };

	it('accepte une zone absente des DEUX côtés, sans prétendre l’avoir comparée', () => {
		const r = comparerZone(absente, absente);
		expect(r.verdict).toBe('conforme');
		expect(r.nonRendue).toBe(true);
		expect(r.pixelsTotal).toBe(0);
		expect(r.dimensions.reference).toBe('non rendue');
	});

	it('refuse sans seuil une zone rendue d’un seul côté', () => {
		// C'est le cas qu'aucun pixel ne peut signaler : une application qui
		// afficherait le rail sous 1240 px là où la maquette l'escamote.
		expect(comparerZone(rendue, absente).verdict).toBe('echec');
		expect(comparerZone(absente, rendue).verdict).toBe('echec');
		expect(comparerZone(absente, rendue).motif).toMatch(/rendue par le candidat/);
	});
});

describe('protocole d’état côté application — annexe F, ÉCART-011 É-1 et É-9', () => {
	it('construit l’adresse du mode démo, paramètre en français', () => {
		expect(PREFIXE).toBe('/__design');
		expect(adresseDeLEtat('V-37', 'cont-bord')).toBe('/__design/V-37?etat=cont-bord');
	});

	it('n’ajoute la source que lorsqu’elle n’est pas l’application', () => {
		expect(adresseDeLEtat('V-37', 'vide', 'app')).not.toContain('source=');
		expect(adresseDeLEtat('V-37', 'vide', 'etalon')).toContain('&source=etalon');
	});

	it('porte le budget d’horloge du banc, jamais sa propre copie', () => {
		expect(adresseDeLEtat('V-37', 'vide', 'etalon', 1000)).toBe(
			'/__design/V-37?etat=vide&source=etalon&differe=1000'
		);
		expect(adresseDeLEtat('V-37', 'vide', 'etalon', 0)).not.toContain('differe');
	});

	it('connaît trois sources, dont deux d’étalonnage', () => {
		// `composant` est la réponse à ÉCART-013 É-1 : `etalon` sert le gel sans
		// jamais passer par `render()`, donc sans éprouver le chemin d'une vue.
		expect(SOURCES).toEqual(['app', 'etalon', 'composant']);
	});
});

describe('protocole d’état de zone — ÉCART-012 point 6', () => {
	it('déclare les six vues qui présentent leurs états côte à côte', () => {
		for (const vue of ['V-09', 'V-35', 'V-38', 'V-39', 'V-40', 'V-41']) {
			const declaration = declarationEtatDeZone(vue) as { protocole: string; etats: number };
			expect(declaration, vue).not.toBeNull();
			expect(declaration.protocole, vue).toBe('page-entiere-zone-isolee');
		}
	});

	it('déclare les cinquante-cinq états de zone, et pas un de plus', () => {
		const total = ['V-09', 'V-35', 'V-38', 'V-39', 'V-40', 'V-41'].reduce(
			(n, vue) => n + ((declarationEtatDeZone(vue) as { etats: number } | null)?.etats ?? 0),
			0
		);
		expect(total).toBe(55);
	});

	it('ne déclare rien pour une vue à planche — le refus reste le défaut', () => {
		// Ne rien écrire n'ouvre rien : une vue non déclarée reste refusée en code
		// 2 pour ses états de zone. C'est la position la plus stricte (PLAN §12).
		for (const vue of ['V-01', 'V-07', 'V-14', 'V-37']) {
			expect(declarationEtatDeZone(vue), vue).toBeNull();
		}
	});

	it('n’ajoute rien à l’adresse : un état de zone se demande comme un autre', () => {
		// La voie retenue est la ZONE COMME SÉLECTEUR : l'application sert la page
		// entière, le banc y isole la zone. Il n'y a donc rien de particulier à
		// mettre dans l'adresse — ce qui change est ce que le banc DÉCOUPE.
		expect(adresseDeLEtat('V-40', 'd-deplacer')).toBe('/__design/V-40?etat=d-deplacer');
		expect(adresseDeLEtat('V-39', 'vide-dossier-vide')).toBe(
			'/__design/V-39?etat=vide-dossier-vide'
		);
	});
});

/* ═════════════════════════════════════════════════════════════════════════
   RÉVÉLATIONS — ARB-017, `ECART-015` É-4

   Une révélation change ce que le banc mesure. Elle doit donc prouver quatre
   choses, et ces unitaires les figent :

     1. le catalogue est CLOS — une déclaration qui nomme une révélation
        inexistante est REFUSÉE, jamais ignorée ;
     2. une vue sans déclaration n'est JAMAIS révélée — et la page n'est même
        pas touchée ;
     3. la déclaration cite son arbitrage, pour que le rapport puisse le nommer ;
     4. la règle d'étalonnage d'`ECART-015` É-5 est LISIBLE PAR LE CODE, donc
        réimprimable à chaque exécution.
   ═════════════════════════════════════════════════════════════════════════ */

/** Une page qui hurle si on la touche — pour prouver le « ne touche à rien ». */
const pageIntouchable = new Proxy(
	{},
	{
		get(_, propriete) {
			throw new Error(`la page a été touchée : ${String(propriete)}`);
		}
	}
);

describe('révélations — le catalogue est clos et la déclaration est humaine', () => {
	it('connaît « modalite-dialogue », et énonce la propriété qu’elle établit', () => {
		const catalogue = REVELATIONS as Record<string, { propriete: string }>;
		expect(Object.keys(catalogue)).toContain('modalite-dialogue');
		expect(catalogue['modalite-dialogue'].propriete).toMatch(/dialog\[open\].*:modal/);
	});

	it('V-40 déclare la révélation, et cite l’arbitrage qui l’autorise', () => {
		const d = (declarationRevelation as (v: string) => Record<string, string> | null)('V-40');
		expect(d).not.toBeNull();
		expect(d?.revelation).toBe('modalite-dialogue');
		expect(d?.arbitrage).toMatch(/ARB-017/);
		expect(d?.motif).toBeTruthy();
	});

	it('UNE VUE SANS DÉCLARATION N’EST JAMAIS RÉVÉLÉE — ni même touchée', async () => {
		const de = declarationRevelation as (v: string) => unknown;
		for (const vue of ['V-37', 'V-38', 'V-39', 'V-41', 'V-01']) expect(de(vue)).toBeNull();
		// `reveler` rend null sans rien demander à la page : ne rien déclarer
		// n'ouvre rien, et n'exécute rien non plus.
		await expect(
			(reveler as (p: unknown, d: unknown, c: string) => Promise<unknown>)(
				pageIntouchable,
				null,
				'candidat'
			)
		).resolves.toBeNull();
	});

	it('REFUSE une déclaration qui nomme une révélation inexistante', async () => {
		await expect(
			(reveler as (p: unknown, d: unknown, c: string) => Promise<unknown>)(
				pageIntouchable,
				{ revelation: 'faire-passer-le-rouge' },
				'candidat'
			)
		).rejects.toThrow(/inconnue du catalogue/i);
	});
});

describe('la règle d’étalonnage — `ECART-015` É-5, lisible par le code', () => {
	it('chaque source d’étalon énumère ce qu’elle n’éprouve pas', () => {
		const limites = limitesDeLaSource as (
			s: string
		) => { prouve: string; n_eprouve_pas: string[] } | null;
		for (const source of SOURCES as string[]) {
			expect(limites(source)?.n_eprouve_pas.length).toBeGreaterThan(0);
		}
	});

	it('les deux étalons nomment la propriété que le candidat possède DÉJÀ', () => {
		const limites = limitesDeLaSource as (s: string) => { n_eprouve_pas: string[] } | null;
		for (const source of ['etalon', 'composant']) {
			const dit = (limites(source)?.n_eprouve_pas ?? []).join(' ');
			// C'est la seconde moitié de la règle, et la plus contre-intuitive :
			// un étalon trop capable est aveugle là où le candidat est démuni.
			expect(dit).toMatch(/JAVASCRIPT/);
		}
	});

	it('`composant` nomme encore ce qu’il n’EMPRUNTE pas — la première moitié', () => {
		const dit = (limitesDeLaSource as (s: string) => { n_eprouve_pas: string[] } | null)(
			'composant'
		)?.n_eprouve_pas.join(' ');
		expect(dit).toMatch(/V-xx\.svelte/);
		expect(dit).toMatch(/socle\.css/);
	});
});
