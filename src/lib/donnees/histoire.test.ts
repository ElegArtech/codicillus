/**
 * LES UNITAIRES DE L'HISTORIQUE ET DE LA COMPARAISON — ce qui se contrôle SANS
 * base.
 *
 * Même règle que `note.test.ts` et `lecture.test.ts` : ce qui exige le
 * conteneur de base est mesuré par les batteries qui l'ouvrent, pas par
 * `pnpm test:unit`. Ce qui est contrôlé ici est donc tout ce qui est PUR — le
 * rendu d'une version, les deux paramètres d'adresse, la linéarisation, la
 * plus longue sous-séquence commune, et les deux modes de comparaison.
 *
 * TOUS CES CAS SONT SYNTHÉTIQUES, ET C'EST UNE EXIGENCE, PAS UNE COMMODITÉ
 * (P-5, P-26). La table `versions` porte ZÉRO ligne : un contrôle qui
 * s'appuierait sur l'état du dépôt ne serait exercé par AUCUNE donnée
 * aujourd'hui, et le deviendrait sans qu'on l'ait voulu le jour où le lot
 * d'écriture des versions arrivera. Les documents de ces cas sont donc écrits
 * ici, à la main, et ils restent vrais quel que soit l'état de la base.
 */
import { describe, expect, it } from 'vitest';
import {
	alignement,
	bornesDemandees,
	comparerEnTexte,
	comparerEnVisuel,
	empreinteDeNoeud,
	heureCourteDInstant,
	lignesDeComparaison,
	versionDemandee,
	versionRendue,
	type LigneDeVersion
} from './histoire';
import type { Bloc } from '../contenu/document';

/* ═══════════════════════════════════ Les versions ═══════════════════════ */

const LIGNE: LigneDeVersion = {
	numero: 14,
	le: new Date('2026-07-22T16:47:00.000Z'),
	auteurNom: 'Sophie Nguyen',
	resume: "Précision sur la fenêtre d'intervention",
	ajout: 6,
	retrait: 2,
	titre: 'Restaurer une base PostgreSQL',
	corpsReference: { type: 'doc', content: [{ type: 'paragraph' }] },
	corpsOperationnel: null
};

describe('l’heure d’affichage d’une version', () => {
	it('se lit en UTC, comme la date — les deux champs sont un seul instant', () => {
		expect(heureCourteDInstant(new Date('2026-07-22T16:47:00.000Z'))).toBe('16:47');
	});

	it('complète les deux positions', () => {
		expect(heureCourteDInstant(new Date('2026-01-02T03:04:00.000Z'))).toBe('03:04');
	});

	it('ne bascule pas de jour à minuit UTC', () => {
		/* Le défaut que `dateCourteDInstant()` se garde de commettre : relire un
		   instant UTC en heure locale déplace la date d'un jour à l'ouest de
		   Greenwich, et l'heure avec elle. */
		expect(heureCourteDInstant(new Date('2026-07-18T00:00:00.000Z'))).toBe('00:00');
	});
});

describe('une version rendue dans la forme du jeu de semence', () => {
	const maintenant = new Date('2026-08-13T16:47:00.000Z');
	const rendueAvec = (instant: Date) => versionRendue(LIGNE, instant);

	it('porte les huit champs de `Version`, et pas un de plus', () => {
		const rendue = versionRendue(LIGNE, maintenant);
		expect(Object.keys(rendue).sort()).toEqual(
			['ajout', 'auteur', 'date', 'heure', 'jours', 'n', 'resume', 'retrait'].sort()
		);
	});

	it('rend le numéro, les deux quantités et le résumé tels que la base les porte', () => {
		const rendue = versionRendue(LIGNE, maintenant);
		expect(rendue.n).toBe(14);
		expect(rendue.ajout).toBe(6);
		expect(rendue.retrait).toBe(2);
		expect(rendue.resume).toBe("Précision sur la fenêtre d'intervention");
		expect(rendue.auteur).toBe('Sophie Nguyen');
	});

	it('compte l’ancienneté en jours entiers depuis l’instant de lecture', () => {
		expect(versionRendue(LIGNE, maintenant).jours).toBe(22);
		expect(rendueAvec(new Date('2026-07-22T16:47:00.000Z')).jours).toBe(0);
	});

	it('rend la date et l’heure du même instant, sans les désaccorder', () => {
		const rendue = versionRendue(LIGNE, maintenant);
		expect(rendue.date).toBe('22/07/2026');
		expect(rendue.heure).toBe('16:47');
	});
});

/* ═══════════════════════════════════ Les paramètres d’adresse ═══════════ */

describe('le numéro de version demandé par l’adresse — routes.md:224', () => {
	it('rend l’entier que le paramètre porte', () => {
		expect(versionDemandee('11')).toBe(11);
		expect(versionDemandee('1')).toBe(1);
	});

	it('rend `null` sans paramètre — c’est « la version courante »', () => {
		expect(versionDemandee(null)).toBeNull();
		expect(versionDemandee('')).toBeNull();
	});

	it('rend `null` sur toute valeur qui n’est pas un entier positif', () => {
		/* Une adresse forgée ne fabrique pas un troisième état. */
		for (const valeur of ['0', '-3', '1.5', '11a', ' 11', 'courante', '1e3']) {
			expect(versionDemandee(valeur)).toBeNull();
		}
	});
});

describe('le couple de bornes demandé par l’adresse — routes.md:284', () => {
	it('rend les deux bornes de la forme que §4 décrit', () => {
		expect(bornesDemandees('13-14')).toEqual({ a: 13, b: 14 });
		expect(bornesDemandees('11-14')).toEqual({ a: 11, b: 14 });
	});

	it('accepte deux bornes égales — le gel en fait un état à part entière', () => {
		expect(bornesDemandees('14-14')).toEqual({ a: 14, b: 14 });
	});

	it('rend `null` sans paramètre : aucune source ne nomme de couple par défaut', () => {
		expect(bornesDemandees(null)).toBeNull();
	});

	it('rend `null` sur toute forme que §4 ne décrit pas', () => {
		for (const valeur of ['', '13', '13-', '-14', '13-14-15', '13—14', 'a-b', '0-14', '13 - 14']) {
			expect(bornesDemandees(valeur)).toBeNull();
		}
	});
});

/* ═══════════════════════════════════ Le quatrième rendu ═════════════════ */

/** Un document canonique d'un paragraphe par texte donné. */
const documentDe = (...textes: readonly string[]) => ({
	type: 'doc',
	content: textes.map((t) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] }))
});

describe('les lignes de comparaison d’une version', () => {
	it('rend une ligne par nœud de premier niveau, sans ligne vide finale', () => {
		expect(lignesDeComparaison(documentDe('Une', 'Deux'))).toEqual(['Une', '', 'Deux']);
	});

	it('rend l’ensemble vide sur un registre que la version ne porte pas', () => {
		expect(lignesDeComparaison(null)).toEqual([]);
		expect(lignesDeComparaison(undefined)).toEqual([]);
	});

	it('distingue le corps ABSENT du corps VIDE — deux faits, deux résultats', () => {
		/* Un document sans aucun nœud n'existe pas : le schéma canonique refuse un
		   contenu vide. Le corps vide du produit est celui de `corpsVide()` — un
		   paragraphe sans texte —, et il rend UNE ligne vide, là où l'absence de
		   corps rend l'ensemble vide. Les confondre ferait compter un ajout ou un
		   retrait de trop au premier registre Opérationnel créé.

		   La ligne rendue n'est pas vide : l'implémentation unique MARQUE le
		   paragraphe vide, sans quoi l'aller-retour de RG-M13-01 le perdrait. Ce
		   cas ne fixe donc pas la forme du marqueur — elle appartient à
		   `markdown.ts` —, seulement le fait qu'une ligne existe. */
		const lignes = lignesDeComparaison({ type: 'doc', content: [{ type: 'paragraph' }] });
		expect(lignes).toHaveLength(1);
		expect(lignes[0]).not.toBe('');
	});

	it('passe par l’implémentation unique, donc porte les natures que le gel ignore', () => {
		/* CE CAS EST LA RAISON D'ÊTRE DU CHOIX D'ARB-055 EXPLIQUÉ À L'EN-TÊTE DU
		   MODULE : la linéarisation du gel n'a AUCUNE forme pour un séparateur,
		   et son cas par défaut rendrait la ligne vide — le bloc disparaîtrait de
		   la comparaison sans que rien ne le signale. Le rendu Markdown, lui, le
		   porte. La règle est donc exercée par un cas qui la sollicite (P-5). */
		const lignes = lignesDeComparaison({
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'Avant' }] },
				{ type: 'horizontalRule' },
				{ type: 'paragraph', content: [{ type: 'text', text: 'Après' }] }
			]
		});
		expect(lignes).toHaveLength(5);
		expect(lignes[0]).toBe('Avant');
		expect(lignes[2]).not.toBe('');
		expect(lignes[4]).toBe('Après');
	});
});

/* ═══════════════════════════════════ L’empreinte ════════════════════════ */

describe('l’empreinte d’un nœud — ADR-003, « contenu normalisé »', () => {
	it('est indifférente à l’ordre de sérialisation des clés', () => {
		const a = { type: 'heading', attrs: { level: 2, ancre: 's-avant' } };
		const b = { attrs: { ancre: 's-avant', level: 2 }, type: 'heading' };
		expect(empreinteDeNoeud(a as unknown as Bloc)).toBe(empreinteDeNoeud(b as unknown as Bloc));
	});

	it('distingue deux nœuds dont le contenu diffère', () => {
		const un = { type: 'paragraph', content: [{ type: 'text', text: 'Une' }] };
		const deux = { type: 'paragraph', content: [{ type: 'text', text: 'Deux' }] };
		expect(empreinteDeNoeud(un as unknown as Bloc)).not.toBe(
			empreinteDeNoeud(deux as unknown as Bloc)
		);
	});

	it('distingue deux nœuds qui ne diffèrent que par une marque', () => {
		/* La normalisation s'arrête à l'ordre des clés : une marque est du
		   contenu, et deux contenus différents sont deux nœuds différents. */
		const nu = { type: 'paragraph', content: [{ type: 'text', text: 'Une' }] };
		const gras = {
			type: 'paragraph',
			content: [{ type: 'text', text: 'Une', marks: [{ type: 'strong' }] }]
		};
		expect(empreinteDeNoeud(nu as unknown as Bloc)).not.toBe(
			empreinteDeNoeud(gras as unknown as Bloc)
		);
	});

	it('conserve l’ordre d’un tableau : deux listes permutées sont deux nœuds', () => {
		const un = { type: 'bulletList', content: ['a', 'b'] };
		const deux = { type: 'bulletList', content: ['b', 'a'] };
		expect(empreinteDeNoeud(un as unknown as Bloc)).not.toBe(
			empreinteDeNoeud(deux as unknown as Bloc)
		);
	});
});

/* ═══════════════════════════════════ L’alignement ═══════════════════════ */

describe('la plus longue sous-séquence commune — l’algorithme du gel', () => {
	it('rend tout commun quand les deux suites sont égales', () => {
		expect(alignement(['a', 'b'], ['a', 'b']).map((p) => p.etat)).toEqual(['commun', 'commun']);
	});

	it('rend l’ajout seul quand la suite de départ est vide', () => {
		const paires = alignement([], ['a', 'b']);
		expect(paires.map((p) => p.etat)).toEqual(['ajoute', 'ajoute']);
		expect(paires.map((p) => p.a)).toEqual([undefined, undefined]);
	});

	it('rend le retrait seul quand la suite d’arrivée est vide', () => {
		const paires = alignement(['a', 'b'], []);
		expect(paires.map((p) => p.etat)).toEqual(['retire', 'retire']);
		expect(paires.map((p) => p.b)).toEqual([undefined, undefined]);
	});

	it('départage une égalité par le RETRAIT AVANT L’AJOUT — c’est l’ordre du gel', () => {
		/* Le départage décide de l'ordre des lignes affichées. Sur une
		   substitution pure, les deux ordres sont de même longueur : c'est la
		   comparaison du gel qui tranche, et elle place le retrait d'abord. */
		expect(alignement(['x'], ['y']).map((p) => p.etat)).toEqual(['retire', 'ajoute']);
	});

	it('apparie par la clé, et rend les éléments d’origine', () => {
		const a = [{ id: 1, texte: 'un' }];
		const b = [{ id: 1, texte: 'UN' }];
		const paires = alignement(a, b, (x) => x.id);
		expect(paires).toHaveLength(1);
		expect(paires[0]!.etat).toBe('commun');
		expect(paires[0]!.a).toBe(a[0]);
		expect(paires[0]!.b).toBe(b[0]);
	});
});

/* ═══════════════════════════════════ Les deux modes ═════════════════════ */

describe('le mode Texte — STACK §4.5, différences ligne à ligne sur le rendu', () => {
	it('compte les lignes ajoutées et retirées séparément, jamais en solde', () => {
		const compare = comparerEnTexte(documentDe('Une', 'Deux'), documentDe('Une', 'Trois'));
		expect(compare.ajouts).toBe(1);
		expect(compare.retraits).toBe(1);
	});

	it('ne compte rien entre deux contenus identiques', () => {
		const compare = comparerEnTexte(documentDe('Une'), documentDe('Une'));
		expect(compare.ajouts).toBe(0);
		expect(compare.retraits).toBe(0);
		expect(compare.lignes.every((l) => l.etat === 'commun')).toBe(true);
	});

	it('compte l’intégralité en ajout quand la version de départ n’a pas de corps', () => {
		const compare = comparerEnTexte(null, documentDe('Une'));
		expect(compare.retraits).toBe(0);
		expect(compare.ajouts).toBe(1);
	});
});

describe('le mode Visuel — C-05, les blocs identiques alignés', () => {
	it('aligne les blocs communs et n’en compte que les touchés', () => {
		const compare = comparerEnVisuel(
			documentDe('Une', 'Deux', 'Trois'),
			documentDe('Une', 'Deux bis', 'Trois')
		);
		expect(compare.blocs).toBe(3);
		expect(compare.touches).toBe(2);
		const communs = compare.rangees.filter((r) => r.etat === 'commun');
		expect(communs).toHaveLength(2);
		/* « Alignés horizontalement » : une rangée commune porte SES DEUX côtés. */
		expect(communs.every((r) => r.a !== undefined && r.b !== undefined)).toBe(true);
	});

	it('travaille sur les nœuds de PREMIER NIVEAU, un par rangée', () => {
		const compare = comparerEnVisuel(documentDe('Une'), documentDe('Une', 'Deux'));
		expect(compare.rangees).toHaveLength(2);
		expect(compare.rangees.map((r) => r.etat)).toEqual(['commun', 'ajoute']);
	});

	it('rend un bloc réécrit en retiré puis ajouté, faute d’identité de bloc', () => {
		/* Le format canonique ne porte AUCUNE identité de bloc, là où le gel
		   apparie par `b.cle` : la nuance « réécrit » du gel n'a pas de porteur.
		   Ce cas l'épingle plutôt que de la laisser se découvrir plus tard. */
		expect(
			comparerEnVisuel(documentDe('Une'), documentDe('Autre')).rangees.map((r) => r.etat)
		).toEqual(['retire', 'ajoute']);
	});

	it('rend l’ensemble vide quand aucune des deux versions n’a de corps', () => {
		const compare = comparerEnVisuel(null, null);
		expect(compare.rangees).toEqual([]);
		expect(compare.touches).toBe(0);
		expect(compare.blocs).toBe(0);
	});
});
