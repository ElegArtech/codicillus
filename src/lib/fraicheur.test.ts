/**
 * Batterie 3 — l'implémentation unique du calcul de fraîcheur (P-01, ADR-005).
 *
 * ÉCART-027 É-1 : P-0b a livré `src/lib/fraicheur.ts` sans ce fichier, son
 * périmètre d'écriture ne l'ouvrant pas — et il a préféré le déclarer plutôt
 * qu'élargir son périmètre en silence. C'était le bon geste ; voici la dette.
 *
 * Il avait joint une preuve de substitution de 83 cas, exécutée contre les
 * `window.*` du gel dans un navigateur réel. Ce fichier en fige la part
 * rejouable sans navigateur : **les bornes**, seul endroit où une comparaison
 * stricte se distingue d'une comparaison large — et donc seul endroit où une
 * réécriture distraite changerait le niveau affiché sur une note réelle.
 *
 * P-01 : il n'existe qu'UNE définition de ce calcul. Un second calcul, fût-il
 * exact aujourd'hui, est un point de divergence pour demain.
 */
import { describe, expect, it } from 'vitest';
import {
	BARRES_DE_JAUGE,
	SEUILS_PAR_DEFAUT,
	barresFraicheur,
	classeTemoin,
	libelleFraicheur,
	niveauFraicheur,
	temoinFraicheur,
	type NiveauFraicheur
} from './fraicheur';

describe('les seuils — ceux du gel, et rien d’autre', () => {
	it('valent 90 et 180, comme les treize maquettes qui les déclarent', () => {
		expect(SEUILS_PAR_DEFAUT.frais).toBe(90);
		expect(SEUILS_PAR_DEFAUT.vieillissant).toBe(180);
	});
	it('respecte RG-M06-02 : le seuil jaune est strictement supérieur au vert', () => {
		expect(SEUILS_PAR_DEFAUT.vieillissant).toBeGreaterThan(SEUILS_PAR_DEFAUT.frais);
	});
});

describe('niveauFraicheur — les bornes, où le strict se distingue du large', () => {
	const cas: Array<[number, NiveauFraicheur]> = [
		[0, 'frais'],
		[89, 'frais'],
		[90, 'vieil'], // strict : 90 n’est PAS frais
		[91, 'vieil'],
		[179, 'vieil'],
		[180, 'obs'], // strict : 180 n’est PAS vieillissant
		[181, 'obs'],
		[400, 'obs']
	];
	for (const [jours, attendu] of cas) {
		it(`${jours} jours → ${attendu}`, () => {
			expect(niveauFraicheur(jours)).toBe(attendu);
		});
	}

	it('prend les seuils en paramètre, jamais en constante locale (ADR-005)', () => {
		const resserres = { frais: 30, vieillissant: 60 } as const;
		expect(niveauFraicheur(45, resserres)).toBe('vieil');
		expect(niveauFraicheur(45)).toBe('frais');
	});
});

describe('la jauge — la forme porte l’information, la couleur la répète', () => {
	it('compte toujours trois barres (RG-M18-09, RG-DA-03)', () => {
		expect(BARRES_DE_JAUGE).toBe(3);
	});
	it('remplit 3, 2 puis 1 barre — jamais zéro, sans quoi la forme disparaît', () => {
		expect(barresFraicheur('frais')).toBe(3);
		expect(barresFraicheur('vieil')).toBe(2);
		expect(barresFraicheur('obs')).toBe(1);
	});
	it('donne une classe distincte par niveau — la teinte vient de là seule', () => {
		const classes = (['frais', 'vieil', 'obs'] as const).map(classeTemoin);
		expect(new Set(classes).size).toBe(3);
	});
});

/**
 * LE LIBELLÉ NE S'ÉCRIT PAS EN CLAIR ICI, et ce n'est pas une commodité.
 *
 * La batterie 5, contrôle A2.3, refuse « tout libellé de fraîcheur construit
 * localement » (ADR-005) : elle relève TOUTE chaîne littérale portant l'un des
 * deux verbes du libellé, hors de l'implémentation — et l'exemption dont ce
 * fichier bénéficie ne couvre que les seuils (A3), pas les libellés. Écrire la
 * forme longue attendue ferait rougir la batterie qui tient P-01 : neuf
 * constats, mesurés.
 *
 * Les octets exacts de la forme LONGUE sont donc épinglés ailleurs, et mieux :
 * par le banc, à chacun des 409 couples — 39 maquettes portent
 * `window.libelleFraicheur` et le rendent. Ce qui se prouve ici, c'est la
 * BRANCHE prise, l'unité employée, et la dérivation de la forme compacte.
 */
describe('libelleFraicheur — la forme longue, les quatre branches du gel', () => {
	it('frais sous 31 jours : le compte en JOURS, unité en entier', () => {
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 6 })).toContain('6 jours');
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 30 })).toContain('30 jours');
	});

	it('frais à UN jour : le nom s’accorde — « il y a 1 jour », pas « 1 jours »', () => {
		/* La garde qui précède les quatre branches n'attrape que `jours <= 0` :
		   toute note vérifiée LA VEILLE passe par ici. Le gel écrit « jours »
		   sans l'accorder — son jeu ne descend jamais à 1 —, et ce libellé long
		   est la source unique du signal de fraîcheur. */
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 1, revise: '2026-08-25' })).toBe(
			'Vérifié il y a 1 jour'
		);
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 1, revise: '2026-08-25' })).not.toContain(
			'1 jours'
		);
		/* Deux jours reprennent le pluriel : l'accord porte sur le compte, pas
		   sur une borne. */
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 2, revise: '2026-08-24' })).toBe(
			'Vérifié il y a 2 jours'
		);
		/* La forme COMPACTE ne bouge pas : « j » est un symbole d'unité. */
		expect(
			libelleFraicheur({ fraicheur: 'frais', jours: 1, revise: '2026-08-25' }, 'compacte')
		).toBe('il y a 1 j');
	});

	it('frais à 31 jours ou plus : « 1 mois », sans arrondi et sans compte de jours', () => {
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 31 })).toContain('1 mois');
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 89 })).toContain('1 mois');
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 89 })).not.toContain('jours');
	});

	it('vieil : le compte en mois, arrondi — 126 / 30 donne 4', () => {
		expect(libelleFraicheur({ fraicheur: 'vieil', jours: 126 })).toContain('4 mois');
	});

	it('obs : le verbe CHANGE, et c’est l’information portée hors couleur', () => {
		const obs = libelleFraicheur({ fraicheur: 'obs', jours: 240 });
		expect(obs).toContain('8 mois');
		/* Même ancienneté, même nombre de mois : SEUL LE VERBE distingue les deux
		   niveaux. C'est ce que RG-M18-09 (CDC l. 1403) interdit de laisser à la
		   couleur. */
		expect(obs).not.toBe(libelleFraicheur({ fraicheur: 'vieil', jours: 240 }));
		expect(obs).not.toContain('il y a');
	});

	it('est la forme par DÉFAUT : les appelants d’aujourd’hui ne changent pas', () => {
		for (const cas of CAS_DES_QUATRE_BRANCHES) {
			expect(libelleFraicheur(cas)).toBe(libelleFraicheur(cas, 'longue'));
		}
	});
});

/**
 * LA FORME COMPACTE — ARB-029, et ses quatre branches une par une.
 *
 * DEUX SEULEMENT SONT EXERCÉES PAR LE GEL. Mesuré : les deux seuls contenus
 * littéraux de `.temoin__txt` des 41 maquettes sont « il y a 6 j »
 * (V-14:1817) et « il y a 4 mois » (V-14:1822) ; partout ailleurs le témoin
 * est construit par `window.temoinFraicheur`. Les deux autres branches sont
 * tranchées ICI, et nulle part ailleurs — P-5 : une règle qu'aucun cas
 * n'exerce est une règle dont on ignore si elle marche.
 */
describe('libelleFraicheur — la forme compacte, branche par branche', () => {
	it('frais, 6 jours → « il y a 6 j » — V-14:1817, et n-planifier-sauv du corpus', () => {
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 6 }, 'compacte')).toBe('il y a 6 j');
	});

	it('vieil, 126 jours → « il y a 4 mois » — V-14:1822, et n-purge-sauv du corpus', () => {
		expect(libelleFraicheur({ fraicheur: 'vieil', jours: 126 }, 'compacte')).toBe('il y a 4 mois');
	});

	it('BRANCHE NON EXERCÉE PAR LE GEL — frais à 31 jours ou plus → « il y a 1 mois »', () => {
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 31 }, 'compacte')).toBe('il y a 1 mois');
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 89 }, 'compacte')).toBe('il y a 1 mois');
	});

	it('BRANCHE NON EXERCÉE PAR LE GEL — obs : le verbe RESTE, RG-M18-09 l’exige', () => {
		const etat = { fraicheur: 'obs', jours: 240 } as const;
		/* La compacte de l'obsolète EST sa longue : rien ne s'y abrège. */
		expect(libelleFraicheur(etat, 'compacte')).toBe(libelleFraicheur(etat));
		/* Et surtout, elle n'est PAS le retrait mécanique du verbe : celui-ci est
		   « une part de l'information portée hors couleur ». */
		expect(libelleFraicheur(etat, 'compacte')).not.toBe('il y a 8 mois');
		expect(libelleFraicheur(etat, 'compacte')).toContain('8 mois');
	});

	it('ne dit jamais « Vérifié » là où le gel ne l’écrit pas', () => {
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 6 }, 'compacte')).not.toContain('Vérifié');
		expect(libelleFraicheur({ fraicheur: 'vieil', jours: 126 }, 'compacte')).not.toContain(
			'Vérifié'
		);
	});

	it('la dérivation : le verbe d’attestation tombe, l’unité « jours » s’abrège', () => {
		/* Écrite sans citer le verbe, pour la raison dite plus haut : la longue
		   FINIT par la compacte, une fois l'unité rétablie. */
		for (const cas of CAS_DES_QUATRE_BRANCHES.filter((c) => c.fraicheur !== 'obs')) {
			const longue = libelleFraicheur(cas);
			const compacte = libelleFraicheur(cas, 'compacte');
			expect(longue.endsWith(compacte.replace(/ j$/, ' jours'))).toBe(true);
			expect(longue.length).toBeGreaterThan(compacte.length);
		}
	});

	it('sort du MÊME niveau et de la MÊME ancienneté que la longue (ARB-029)', () => {
		/* « Ce n'est pas un second calcul, c'est un second rendu du même
		   calcul » : les nombres affichés sont les mêmes des deux côtés. */
		const chiffres = (t: string) => t.replace(/\D+/g, ' ').trim();
		for (const cas of CAS_DES_QUATRE_BRANCHES) {
			expect(chiffres(libelleFraicheur(cas, 'compacte'))).toBe(chiffres(libelleFraicheur(cas)));
		}
	});
});

describe('temoinFraicheur — la fabrique unique', () => {
	it('rend une description cohérente avec chacune de ses composantes', () => {
		for (const [fraicheur, jours] of [
			['frais', 12],
			['vieil', 120],
			['obs', 300]
		] as Array<[NiveauFraicheur, number]>) {
			const t = temoinFraicheur({ fraicheur, jours });
			expect(t.niveau).toBe(fraicheur);
			expect(t.barres).toBe(barresFraicheur(fraicheur));
			expect(t.classe).toBe(classeTemoin(fraicheur));
			expect(t.libelle.length).toBeGreaterThan(0);
		}
	});

	it('rend la forme LONGUE, jamais la compacte — 39 maquettes en dépendent', () => {
		for (const cas of CAS_DES_QUATRE_BRANCHES) {
			expect(temoinFraicheur(cas).libelle).toBe(libelleFraicheur(cas, 'longue'));
		}
		/* Les trois branches où les deux formes DIFFÈRENT : si la fabrique du
		   témoin basculait en compacte, ces trois-là rougiraient. */
		for (const cas of CAS_DES_QUATRE_BRANCHES.filter((c) => c.fraicheur !== 'obs')) {
			expect(temoinFraicheur(cas).libelle).not.toBe(libelleFraicheur(cas, 'compacte'));
		}
	});
});

/**
 * LES QUATRE BRANCHES DU LIBELLÉ, une note par branche. Les deux premières
 * sont celles du gel de V-14 ; les deux autres ne sont exercées que par ce
 * fichier, et c'est dit à chaque cas qui les emploie.
 */
const CAS_DES_QUATRE_BRANCHES = [
	{ fraicheur: 'frais', jours: 6 },
	{ fraicheur: 'frais', jours: 31 },
	{ fraicheur: 'vieil', jours: 126 },
	{ fraicheur: 'obs', jours: 240 }
] as const satisfies readonly { fraicheur: NiveauFraicheur; jours: number }[];

/**
 * LES DEUX GARDES DU LIBELLÉ — ET ELLES N'ÉTAIENT EXERCÉES NULLE PART.
 *
 * `libelleFraicheur` ouvre sur deux branches qui précèdent les quatre du gel :
 * `revise === null` (« Jamais vérifiée ») et `jours <= 0` (« Vérifié à
 * l'instant »). Les campagnes qui les ont écrites les ont commentées
 * longuement, et le module affirmait qu'elles étaient couvertes ici — ce
 * fichier ne contenait pas une seule occurrence de `revise`, de « Jamais
 * vérifiée » ni de « à l'instant ». Seul un rendu de V-14 touchait la
 * première, par ricochet.
 *
 * C'EST CETTE LACUNE QUI A LAISSÉ PASSER LES DEUX DÉFAUTS JUMEAUX : `revise`
 * est OPTIONNEL dans `EtatDeFraicheur` et sa garde est STRICTE, donc un
 * appelant qui l'omet ne déclenche rien et le compilateur ne dit rien. Les deux
 * seuls sites du dépôt qui construisaient un objet littéral l'omettaient tous
 * les deux.
 */
describe('libelleFraicheur — les deux gardes, avant les quatre branches du gel', () => {
	it('une note JAMAIS vérifiée ne peut pas être « vérifiée il y a N jours »', () => {
		/* Le niveau, lui, ne change pas : `RG-M06-01` fait retomber la fraîcheur
		   sur la date de modification, et c'est juste. Seul le libellé cesse
		   d'affirmer un geste qui n'a pas eu lieu. */
		expect(libelleFraicheur({ fraicheur: 'vieil', jours: 92, revise: null })).toBe(
			'Jamais vérifiée'
		);
		expect(libelleFraicheur({ fraicheur: 'vieil', jours: 92, revise: null }, 'compacte')).toBe(
			'jamais'
		);
		/* Elle passe AVANT toutes les autres, y compris avant « à l'instant » :
		   une note créée à l'instant portait « Vérifié il y a 0 jours » à côté de
		   « Jamais vérifiée », sur le même écran. */
		expect(libelleFraicheur({ fraicheur: 'frais', jours: 0, revise: null })).toBe(
			'Jamais vérifiée'
		);
	});

	it('OMISE, la garde ne se déclenche pas — et c’est ce qui rendait les défauts muets', () => {
		/* `revise` est optionnel et le test est strict. Le fait est ÉPINGLÉ ici
		   plutôt que découvert à l'écran : un appelant qui ne porte pas
		   l'information rend exactement ce qu'il rendait, et un appelant qui la
		   porte mais l'oublie ment sans que rien ne proteste. */
		expect(libelleFraicheur({ fraicheur: 'vieil', jours: 92 })).toBe('Vérifié il y a 3 mois');
		/* `exactOptionalPropertyTypes` interdit d'écrire la clé à `undefined` : la
		   seule forme de l'omission est l'ABSENCE de la clé, et c'est
		   exactement celle que les deux sites fautifs avaient. */
	});

	it('une note vérifiée AUJOURD’HUI ne dit pas « il y a 0 jours »', () => {
		const cas = { fraicheur: 'frais' as const, jours: 0, revise: '2026-08-26' };
		expect(libelleFraicheur(cas)).toBe("Vérifié à l'instant");
		expect(libelleFraicheur(cas, 'compacte')).toBe("à l'instant");
		expect(libelleFraicheur(cas)).not.toContain('0 jours');
	});

	it('la fabrique unique porte les deux gardes, comme les quatre branches', () => {
		expect(temoinFraicheur({ fraicheur: 'vieil', jours: 92, revise: null }).libelle).toBe(
			'Jamais vérifiée'
		);
		expect(temoinFraicheur({ fraicheur: 'frais', jours: 0, revise: '2026-08-26' }).libelle).toBe(
			"Vérifié à l'instant"
		);
		/* Le NIVEAU et la JAUGE ne bougent pas : seul le libellé change. */
		const jamais = temoinFraicheur({ fraicheur: 'vieil', jours: 92, revise: null });
		expect(jamais.niveau).toBe('vieil');
		expect(jamais.barres).toBe(barresFraicheur('vieil'));
	});
});
