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
	ETATS_DE_VIVACITE,
	ORDRE_DES_ETATS,
	SEUILS_DE_VIVACITE,
	SEUILS_PAR_DEFAUT,
	barresFraicheur,
	classeTemoin,
	libelleFraicheur,
	niveauFraicheur,
	etatDeVivacite,
	temoinFraicheur,
	vivacite,
	type CycleDeVivacite,
	type EtatDeVivacite,
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

/* ==========================================================================
   LA VIVACITÉ — CINQ ÉTATS

   Ce qui précède épingle la fabrique à trois niveaux. Ce qui suit épingle
   celle qui la remplace, et d'abord ses BORNES : c'est le seul endroit où une
   comparaison stricte se distingue d'une comparaison large, donc le seul
   endroit où une réécriture distraite change l'état affiché sur une note
   réelle sans rien casser d'autre.

   LES LIBELLÉS SONT ÉCRITS EN CLAIR ICI, contrairement à ceux du dessus.
   L'appareil qui l'interdisait a été supprimé, et la spécification les donne
   au caractère près : « Prochaine vérification : … (dans 67 jours) ». Une
   phrase que personne ne fige est une phrase que la première refonte déplace.
   ========================================================================== */

/** Le jour où le prototype a été validé, et celui de toutes ses captures. */
const AUJOURDHUI = '2026-09-05';

/** Le jour civil, en ISO, à N jours d'aujourd'hui. */
function jour(decalage: number): string {
	const d = new Date(Date.UTC(2026, 8, 5) + decalage * 86400000);
	return d.toISOString().slice(0, 10);
}

/**
 * Un cycle dont l'échéance tombe dans exactement `reste` jours. C'est la seule
 * grandeur qui compte : la date de vérification n'est qu'un moyen de l'obtenir.
 */
function cycleDeReste(reste: number, validite = 90): CycleDeVivacite {
	return { verifiee: jour(reste - validite), modifiee: jour(reste - validite), validite };
}

describe('les seuils de vivacité — ceux du prototype validé', () => {
	it('valent 10 jours, puis 14 et 90 jours de retard', () => {
		expect(SEUILS_DE_VIVACITE.bientot).toBe(10);
		expect(SEUILS_DE_VIVACITE.retardRevoir).toBe(14);
		expect(SEUILS_DE_VIVACITE.retardObsolete).toBe(90);
	});
});

describe('etatDeVivacite — les bornes, une par une', () => {
	const cas: Array<[number, EtatDeVivacite]> = [
		[400, 'ajour'],
		[11, 'ajour'], // au-dessus du seuil : encore silencieux
		[10, 'bientot'], // ÉGAL au seuil : l'échéance s'annonce déjà
		[1, 'bientot'],
		[0, 'bientot'], // l'échéance est AUJOURD'HUI, pas hier
		[-1, 'averifier'], // le premier jour de retard
		[-13, 'averifier'],
		[-14, 'arevoir'], // quatorze jours de retard : la bascule est atteinte
		[-89, 'arevoir'],
		[-90, 'obsolete'], // quatre-vingt-dix : atteinte, donc franchie
		[-400, 'obsolete']
	];
	for (const [reste, attendu] of cas) {
		it(`reste ${reste} → ${attendu}`, () => {
			expect(etatDeVivacite(reste, false)).toBe(attendu);
			expect(vivacite(cycleDeReste(reste), AUJOURDHUI).etat).toBe(attendu);
		});
	}

	it('prend les seuils en paramètre, jamais en constante locale', () => {
		const resserres = { bientot: 30, retardRevoir: 7, retardObsolete: 30 } as const;
		expect(etatDeVivacite(20, false, resserres)).toBe('bientot');
		expect(etatDeVivacite(20, false)).toBe('ajour');
		expect(etatDeVivacite(-8, false, resserres)).toBe('arevoir');
		expect(etatDeVivacite(-8, false)).toBe('averifier');
	});
});

describe('la demande de révision — un humain passe avant le calendrier', () => {
	it('force « À revoir » même à quatre-vingts jours de marge', () => {
		expect(etatDeVivacite(80, true)).toBe('arevoir');
		const v = vivacite({ ...cycleDeReste(80), revisionPar: 'Alexandre Berge' }, AUJOURDHUI);
		expect(v.etat).toBe('arevoir');
		expect(v.revision).toBe(true);
		expect(v.revisionPar).toBe('Alexandre Berge');
	});

	it('sans demande, le même cycle est à jour — la révision est bien la CAUSE', () => {
		const v = vivacite(cycleDeReste(80), AUJOURDHUI);
		expect(v.etat).toBe('ajour');
		expect(v.revision).toBe(false);
		expect(v.revisionPar).toBe('');
	});

	it('une demande levée rend la main au calendrier, sans autre geste', () => {
		const pose = { ...cycleDeReste(-2), revisionPar: 'k.belhadj' };
		expect(vivacite(pose, AUJOURDHUI).etat).toBe('arevoir');
		const leve: CycleDeVivacite = { ...pose, revisionPar: null };
		expect(vivacite(leve, AUJOURDHUI).etat).toBe('averifier');
	});
});

describe('les deux registres — deux cycles, et ils ne se touchent pas', () => {
	/* La note « claude » du prototype : sa Référence est à jour, son
	   Opérationnel est à vérifier depuis un jour. Le même écran, deux états. */
	const reference: CycleDeVivacite = {
		verifiee: '2026-08-13',
		modifiee: '2026-08-13',
		validite: 90,
		par: 'Alexandre Berge'
	};
	const operationnel: CycleDeVivacite = {
		verifiee: '2026-08-14',
		modifiee: '2026-08-14',
		validite: 21,
		par: 'Alexandre Berge'
	};

	it('la même note porte deux états différents en même temps', () => {
		expect(vivacite(reference, AUJOURDHUI).etat).toBe('ajour');
		expect(vivacite(operationnel, AUJOURDHUI).etat).toBe('averifier');
	});

	it('vérifier le registre courant ne touche pas l’autre', () => {
		/* « Marquer comme vérifiée » repose la date du SEUL registre affiché. */
		const operationnelVerifie: CycleDeVivacite = { ...operationnel, verifiee: AUJOURDHUI };
		expect(vivacite(operationnelVerifie, AUJOURDHUI).etat).toBe('ajour');
		/* La Référence, elle, n'a pas bougé d'un jour. */
		expect(vivacite(reference, AUJOURDHUI).reste).toBe(67);
	});

	it('l’Opérationnel créé à l’instant démarre un cycle neuf', () => {
		const cree: CycleDeVivacite = { verifiee: AUJOURDHUI, modifiee: AUJOURDHUI, validite: 21 };
		const v = vivacite(cree, AUJOURDHUI);
		expect(v.etat).toBe('ajour');
		expect(v.reste).toBe(21);
	});
});

describe('les libellés — la spécification, au caractère près', () => {
	const claude = vivacite(
		{ verifiee: '2026-08-13', modifiee: '2026-08-13', validite: 90, par: 'Alexandre Berge' },
		AUJOURDHUI
	);

	it('la ligne de vérification nomme la date et l’auteur', () => {
		expect(claude.ligneVerification).toBe('Vérifiée le 13 août 2026 par Alexandre Berge');
	});

	it('sans auteur, la ligne s’arrête à la date', () => {
		const sans = vivacite(
			{ verifiee: '2026-08-13', modifiee: '2026-08-13', validite: 90 },
			AUJOURDHUI
		);
		expect(sans.ligneVerification).toBe('Vérifiée le 13 août 2026');
	});

	it('l’échéance à venir se compte en jours pleins', () => {
		expect(claude.ligneEcheance).toBe('Prochaine vérification : 11 nov. 2026 (dans 67 jours)');
		expect(claude.reste).toBe(67);
	});

	it('l’échéance du jour se nomme, elle ne se compte pas', () => {
		expect(vivacite(cycleDeReste(0), AUJOURDHUI).ligneEcheance).toBe(
			"Échéance aujourd'hui : 5 sept. 2026"
		);
	});

	it('l’échéance dépassée compte le RETARD, et le nom s’accorde', () => {
		expect(vivacite(cycleDeReste(-4), AUJOURDHUI).ligneEcheance).toBe(
			'Échéance dépassée de 4 jours (1 sept. 2026)'
		);
		expect(vivacite(cycleDeReste(-1), AUJOURDHUI).ligneEcheance).toContain('de 1 jour (');
		expect(vivacite(cycleDeReste(-1), AUJOURDHUI).ligneEcheance).not.toContain('1 jours');
	});

	it('une note jamais vérifiée ne prétend pas l’avoir été', () => {
		const jamais = vivacite({ verifiee: null, modifiee: '2026-08-13', validite: 90 }, AUJOURDHUI);
		expect(jamais.ligneVerification).toBe('Jamais vérifiée');
		expect(jamais.jamaisVerifiee).toBe(true);
		expect(jamais.compact).toBe('jamais');
		/* Le NIVEAU, lui, se lit sur la modification : le calcul ne s'arrête pas. */
		expect(jamais.etat).toBe('ajour');
		expect(jamais.reste).toBe(67);
	});

	it('la forme compacte des rails et des listes', () => {
		expect(vivacite(cycleDeReste(67), AUJOURDHUI).compact).toBe('dans 67 j');
		expect(vivacite(cycleDeReste(-21), AUJOURDHUI).compact).toBe('21 j de retard');
		expect(vivacite(cycleDeReste(0), AUJOURDHUI).compact).toBe('dans 0 j');
	});

	it('la légende centrale de la frise change de signe avec le retard', () => {
		expect(vivacite(cycleDeReste(67), AUJOURDHUI).relatif).toBe('J−67');
		expect(vivacite(cycleDeReste(-21), AUJOURDHUI).relatif).toBe('J+21');
	});
});

describe('le rappel automatique — la logique dite en clair', () => {
	it('avant l’échéance, il annonce la bascule à venir', () => {
		expect(vivacite(cycleDeReste(67), AUJOURDHUI).rappel).toBe(
			'Cette note repassera automatiquement à « À vérifier » le 11 nov. 2026.'
		);
	});

	it('en retard, il nomme l’échéance manquée ET la bascule suivante', () => {
		expect(vivacite(cycleDeReste(-4), AUJOURDHUI).rappel).toBe(
			'En attente de vérification depuis le 1 sept. 2026. Passage à « À revoir » le 15 sept. 2026.'
		);
	});

	it('à revoir, la bascule annoncée est l’obsolescence', () => {
		expect(vivacite(cycleDeReste(-20), AUJOURDHUI).rappel).toContain('Passage à « Obsolète » le ');
	});

	it('obsolète, il n’annonce plus rien : il dit comment repartir', () => {
		const v = vivacite(cycleDeReste(-120), AUJOURDHUI);
		expect(v.etat).toBe('obsolete');
		expect(v.rappel).toContain('Une nouvelle vérification relancera le cycle.');
		expect(v.rappel).not.toContain('Passage à');
	});
});

describe('la frise — la position d’aujourd’hui, bornée à ses deux extrémités', () => {
	it('vaut zéro le jour de la vérification, un à l’échéance', () => {
		expect(vivacite(cycleDeReste(90), AUJOURDHUI).fraction).toBe(0);
		expect(vivacite(cycleDeReste(0), AUJOURDHUI).fraction).toBe(1);
	});

	it('tient le milieu du cycle au milieu du trait', () => {
		expect(vivacite(cycleDeReste(45), AUJOURDHUI).fraction).toBeCloseTo(0.5, 5);
	});

	it('ne déborde JAMAIS, même très en retard — le rond sortirait du cadre', () => {
		expect(vivacite(cycleDeReste(-400), AUJOURDHUI).fraction).toBe(1);
	});

	it('le rond d’échéance ne se remplit qu’une fois l’échéance passée', () => {
		expect(vivacite(cycleDeReste(0), AUJOURDHUI).echeanceEchue).toBe(false);
		expect(vivacite(cycleDeReste(-1), AUJOURDHUI).echeanceEchue).toBe(true);
	});
});

describe('les cinq états — la forme porte l’information, pas la couleur', () => {
	it('portent cinq libellés distincts, et cinq classes distinctes', () => {
		const libelles = ORDRE_DES_ETATS.map((e) => ETATS_DE_VIVACITE[e].libelle);
		const classes = ORDRE_DES_ETATS.map((e) => ETATS_DE_VIVACITE[e].classe);
		expect(new Set(libelles).size).toBe(5);
		expect(new Set(classes).size).toBe(5);
	});

	it('portent cinq FORMES distinctes — un lecteur sans couleur lit l’état', () => {
		const formes = ORDRE_DES_ETATS.map((e) => ETATS_DE_VIVACITE[e].glyphe);
		expect(new Set(formes).size).toBe(5);
		/* L'obsolète est le seul anneau nu : son vide EST sa forme. */
		expect(ETATS_DE_VIVACITE.obsolete.glyphe).toBe('');
	});

	it('montent en attention sans jamais redescendre', () => {
		const attentions = ORDRE_DES_ETATS.map((e) => ETATS_DE_VIVACITE[e].attention);
		expect(attentions).toEqual([0, 1, 2, 3, 3]);
	});

	it('la fabrique rend la description de l’état, jamais une autre', () => {
		for (const etat of ORDRE_DES_ETATS) {
			const v = vivacite(cycleDeReste(RESTES_PAR_ETAT[etat]), AUJOURDHUI);
			expect(v.etat).toBe(etat);
			expect(v.libelle).toBe(ETATS_DE_VIVACITE[etat].libelle);
			expect(v.classe).toBe(ETATS_DE_VIVACITE[etat].classe);
			expect(v.attention).toBe(ETATS_DE_VIVACITE[etat].attention);
		}
	});
});

/** Un reste qui tombe dans chacun des cinq états — la planche V-41 en vit. */
const RESTES_PAR_ETAT: Record<EtatDeVivacite, number> = {
	ajour: 67,
	bientot: 6,
	averifier: -4,
	arevoir: -21,
	obsolete: -120
};
