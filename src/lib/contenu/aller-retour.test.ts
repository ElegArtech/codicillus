/**
 * LA BATTERIE 4, JOUÉE AUSSI EN UNITAIRE — même liste, deux lecteurs.
 *
 * `pnpm test:aller-retour` imprime le rapport ; ici, chaque cas est un test
 * nommé, de sorte qu'un écart soit attribué à SON cas et non au lot. Le
 * partage est celui de T-014 entre `pnpm contenu:invalide` et
 * `document.test.ts`.
 *
 * Les trois sondes sont jouées ici aussi, et la troisième est celle qui
 * compte : elle prouve que la garde contre le faux vert n'est pas une règle
 * qu'aucun cas n'exerce (P-5).
 */
import { describe, expect, it } from 'vitest';
import {
	CAS_DU_CORPUS,
	CAS_NOMMES,
	SONDES,
	jouerAllerRetour,
	rapportDAllerRetour,
	releveDesAttributs,
	releveDesConstructions
} from './aller-retour';

describe('le corpus — les quatre corps du gel (RG-M13-01)', () => {
	it('en porte quatre, et pas un de plus', () => {
		expect(CAS_DU_CORPUS.length).toBe(4);
	});

	for (const cas of CAS_DU_CORPUS) {
		it('revient à l’identique : ' + cas.nom, () => {
			const verdict = jouerAllerRetour(cas);
			expect(verdict.ecart).toBe(null);
			expect(verdict.identique).toBe(true);
		});
	}
});

describe('les cas nommés — ce que le corpus n’exerce pas (P-5)', () => {
	for (const cas of CAS_NOMMES) {
		it('revient à l’identique : ' + cas.nom, () => {
			const verdict = jouerAllerRetour(cas);
			expect(verdict.ecart).toBe(null);
			expect(verdict.identique).toBe(true);
		});
	}

	it('chacun déclare ce qu’il exerce — un cas muet serait un document de démonstration', () => {
		for (const cas of CAS_NOMMES) expect(cas.exerce.length).toBeGreaterThan(20);
	});
});

describe('aucune normalisation n’est employée', () => {
	it('l’identité stricte et l’identité à clés triées donnent le même verdict partout', () => {
		for (const cas of [...CAS_DU_CORPUS, ...CAS_NOMMES]) {
			const v = jouerAllerRetour(cas);
			expect(v.identique).toBe(v.identiqueACleTriee);
		}
	});
});

describe('le relevé des quinze constructions', () => {
	const releve = releveDesConstructions();

	it('en compte quinze', () => {
		expect(releve.length).toBe(15);
	});

	it('treize sont exercées par le corpus, et les deux autres sont l’image et le diagramme', () => {
		const sansCorpus = releve.filter((e) => e.occurrencesAuCorpus === 0).map((e) => e.numero);
		expect(sansCorpus).toEqual([10, 12]);
	});

	for (const e of releve) {
		it('est couverte par l’aller-retour : ' + String(e.numero) + ' · ' + e.libelle, () => {
			expect(e.occurrencesAuCorpus + e.occurrencesAuxCasNommes).toBeGreaterThan(0);
		});
	}
});

describe('le relevé des attributs — ARB-049 décision 4 : tous survivent', () => {
	const releve = releveDesAttributs();

	it('en compte vingt — le nombre d’attributs que `document.ts` déclare', () => {
		expect(releve.length).toBe(20);
	});

	for (const a of releve) {
		it('est exercé au moins une fois : ' + a.noeud + '.' + a.attribut, () => {
			expect(a.corpus.occurrences + a.casNommes.occurrences).toBeGreaterThan(0);
		});
	}

	it('les attributs annulables sont exercés à null au moins une fois', () => {
		const annulables = ['ancre', 'language', 'attribution', 'etiquette', 'legende'];
		for (const a of releve.filter((x) => annulables.includes(x.attribut))) {
			expect(a.corpus.nulles + a.casNommes.nulles).toBeGreaterThan(0);
		}
	});
});

describe('la batterie sait dire non — les trois sondes', () => {
	it('sans sonde, elle est verte', () => {
		expect(rapportDAllerRetour().code).toBe(0);
	});

	for (const sonde of SONDES.filter((s) => s.genre !== 'temoin-inerte')) {
		it('rougit sous la sonde « ' + sonde.genre + ' », et la mutation n’est pas inerte', () => {
			const touches = [...CAS_DU_CORPUS, ...CAS_NOMMES]
				.map((c) => jouerAllerRetour(c, sonde))
				.reduce((n, v) => n + v.touches, 0);
			expect(touches).toBeGreaterThan(0);
			expect(rapportDAllerRetour(sonde.genre).code).toBe(1);
		});
	}

	it('refuse de conclure sous une sonde INERTE, au lieu de rendre un vert', () => {
		expect(rapportDAllerRetour('temoin-inerte').code).toBe(2);
	});

	it('refuse une sonde inconnue plutôt que de l’ignorer', () => {
		expect(rapportDAllerRetour('celle-qui-n-existe-pas').code).toBe(1);
	});
});
