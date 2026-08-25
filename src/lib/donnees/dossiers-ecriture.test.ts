/**
 * LES UNITAIRES DE L'ÉCRITURE DU RANGEMENT — ce qui se contrôle SANS base.
 *
 * Même règle que `suppression.test.ts` et `rangement.test.ts` : ce qui exige le
 * conteneur est mesuré par les batteries qui l'ouvrent. Aucune ligne de ce
 * fichier n'ouvre de connexion, et aucune n'écrit — une suppression DÉTRUIT, et
 * la base est PARTAGÉE entre copies de travail (`P-30`) : un cas qui
 * supprimerait pour vérifier ferait mesurer le voisin.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CES CAS SONT SYNTHÉTIQUES — `P-5` ET `P-26`
 *
 * `P-26` : « un contrôle dont le seul cas d'épreuve est le défaut qu'il trouve
 * devient inerte en réussissant ». L'arborescence ci-dessous est écrite à la
 * main, indépendante du corpus de semence, et elle porte volontairement ce que
 * le corpus n'a pas : une branche PROFONDE, qui seule sollicite le plafond de
 * `RG-STR-04`. Le corpus livré ne dépasse pas trois niveaux ; un contrôle qui
 * s'appuierait sur lui n'exercerait jamais le refus de profondeur.
 *
 * `P-5` : chaque règle est éprouvée dans SES DEUX POLARITÉS — la destination
 * recevable ET la destination refusée, le droit propre ET le droit hérité, le
 * compte qui en a un ET celui qui n'en a pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CAS QUI COMPTE LE PLUS : L'ORIGINE CONTRE LA RÉSOLUTION
 *
 * `origineDUnDroit()` remonte la même chaîne que `resoudreDroitDeDossier()` et
 * s'arrête au même endroit. C'est une affirmation, et une affirmation se
 * mesure : le dernier bloc compare, pour chaque compte et chaque dossier de
 * l'arborescence d'épreuve, le droit posé à l'origine trouvée et le droit rendu
 * par l'implémentation unique. Sans ce bloc, « les deux lisent la même chaîne »
 * serait une intention.
 */
import { describe, expect, it } from 'vitest';
import type { Base } from '../base/acces';
import {
	identiteAuthentifiee,
	indexerLesDroits,
	resoudreDroitDeDossier,
	type DroitDeDossier,
	type DroitExplicite
} from '../droits/resolution';
import { PROFONDEUR_MAX, type LigneDeDossier } from './rangement';
import {
	accorderUnDroitDeDossier,
	changerUnDroitDeDossier,
	depasseLePlafond,
	droitsResolusDUnDossier,
	hauteurDuSousArbre,
	libelleDOrigine,
	lireLesDroitsDUnDossier,
	motifDeRefusDeDestination,
	niveauDeDroitDepuisLaSaisie,
	origineDUnDroit,
	retirerUnDroitDeDossier,
	sousArbre,
	AUTO_RETRAIT_DE_GESTION,
	COMPTE_DESACTIVE,
	COMPTE_INTROUVABLE,
	DEPLACE_DANS_LUI_MEME,
	DESTINATION_INTERIEURE,
	DESTINATION_MANQUANTE,
	DROIT_NON_PROPRE,
	NIVEAU_INCONNU,
	REFUS_MUET
} from './dossiers-ecriture';

/* ═══════════════════════════════════ L'arborescence d'épreuve ═══════════ */

/**
 * UN DOMAINE, ET UNE BRANCHE QUI TOUCHE LE PLAFOND.
 *
 *   racine (1)
 *     ├─ a (2)
 *     │    └─ a1 (3)
 *     │         └─ a2 (4)
 *     ├─ b (2)
 *     └─ p2 (2) … p9 (9)     — la branche profonde, huit niveaux sous la racine
 *
 * `a` porte donc DEUX niveaux sous lui : le poser sous `p9` (profondeur 9)
 * mettrait `a2` à 12, ce que la contrainte refuse. Le poser sous `b`
 * (profondeur 2) met `a2` à 5, ce qu'elle accepte.
 */
const DOMAINE = 'dom';

function ligne(id: string, parentId: string | null, profondeur: number, nom = id): LigneDeDossier {
	return { id, parentId, domaineId: DOMAINE, nom, profondeur };
}

const ARBRE: readonly LigneDeDossier[] = [
	ligne('racine', null, 1, 'Domaine'),
	ligne('a', 'racine', 2, 'Alpha'),
	ligne('a1', 'a', 3, 'Alpha un'),
	ligne('a2', 'a1', 4, 'Alpha deux'),
	ligne('b', 'racine', 2, 'Bêta'),
	ligne('p2', 'racine', 2, 'P2'),
	ligne('p3', 'p2', 3, 'P3'),
	ligne('p4', 'p3', 4, 'P4'),
	ligne('p5', 'p4', 5, 'P5'),
	ligne('p6', 'p5', 6, 'P6'),
	ligne('p7', 'p6', 7, 'P7'),
	ligne('p8', 'p7', 8, 'P8'),
	ligne('p9', 'p8', 9, 'P9')
];

describe('le sous-arbre — ce qu’une suppression emporte', () => {
	it('rend le dossier lui-même en premier, puis ses descendants', () => {
		expect(sousArbre(ARBRE, 'a').map((d) => d.id)).toEqual(['a', 'a1', 'a2']);
	});

	it('rend une feuille seule — le cas où il n’y a rien sous le dossier', () => {
		expect(sousArbre(ARBRE, 'a2').map((d) => d.id)).toEqual(['a2']);
	});

	it('rend un ensemble VIDE pour un dossier inconnu, jamais une exception', () => {
		expect(sousArbre(ARBRE, 'nulle-part')).toEqual([]);
	});

	it('ne boucle pas sur une arborescence cyclique — il tronque', () => {
		/* Le schéma ne peut pas exclure un cycle long : la troncature est une
		   FERMETURE, jamais une boucle infinie. */
		const cycle: readonly LigneDeDossier[] = [ligne('x', 'y', 2), ligne('y', 'x', 3)];
		expect(sousArbre(cycle, 'x').map((d) => d.id)).toEqual(['x', 'y']);
	});

	it('mesure la hauteur, zéro pour une feuille', () => {
		expect(hauteurDuSousArbre(ARBRE, 'a')).toBe(2);
		expect(hauteurDuSousArbre(ARBRE, 'a2')).toBe(0);
		expect(hauteurDuSousArbre(ARBRE, 'p2')).toBe(7);
	});
});

/* ═══════════════════════════════════ RG-STR-04 et RG-STR-05 ════════════ */

describe('le motif de refus d’une destination — les deux polarités', () => {
	it('accepte le parent actuel : un renommage ne déplace rien', () => {
		expect(motifDeRefusDeDestination(ARBRE, 'a', 'racine')).toBeNull();
	});

	it('accepte un frère qui laisse la branche sous le plafond', () => {
		expect(motifDeRefusDeDestination(ARBRE, 'a', 'b')).toBeNull();
	});

	it('RG-STR-05 — refuse le dossier lui-même', () => {
		expect(motifDeRefusDeDestination(ARBRE, 'a', 'a')).toBe(DEPLACE_DANS_LUI_MEME);
	});

	it('RG-STR-05 — refuse un de ses propres descendants', () => {
		expect(motifDeRefusDeDestination(ARBRE, 'a', 'a2')).toBe(DESTINATION_INTERIEURE);
	});

	it('RG-STR-04 — refuse ce qui dépasserait le plafond, et le dit', () => {
		/* `p9` est à 9 ; `a` y serait à 10, et `a2` à 12. */
		expect(motifDeRefusDeDestination(ARBRE, 'a', 'p9')).toBe(depasseLePlafond(2));
		expect(depasseLePlafond(2)).toContain(String(PROFONDEUR_MAX));
	});

	it('RG-STR-04 — accepte au ras du plafond, jamais un cran au-dessus', () => {
		/* `a2` n’a rien sous lui : sous `p9`, il est à 10, la dernière place. */
		expect(motifDeRefusDeDestination(ARBRE, 'a2', 'p9')).toBeNull();
		/* `a1` en porte un : sous `p9`, `a2` serait à 11. */
		expect(motifDeRefusDeDestination(ARBRE, 'a1', 'p9')).toBe(depasseLePlafond(1));
	});

	it('refuse une destination inconnue sans prétendre savoir pourquoi', () => {
		expect(motifDeRefusDeDestination(ARBRE, 'a', 'nulle-part')).toBe(DESTINATION_MANQUANTE);
	});
});

/* ═══════════════════════════════════ RG-DRO-01 — l’origine ═════════════ */

const DROITS: readonly DroitExplicite[] = [
	{ dossierId: 'racine', compteId: 'karim', droit: 'gestionnaire' },
	{ dossierId: 'a', compteId: 'marc', droit: 'redacteur' },
	{ dossierId: 'a1', compteId: 'marc', droit: 'lecteur' },
	{ dossierId: 'b', compteId: 'lea', droit: 'lecteur' }
];
const INDEX = indexerLesDroits(ARBRE, DROITS);

describe('l’origine d’un droit — RG-DRO-01, le plus proche gagne', () => {
	it('nomme le dossier lui-même quand le droit y est posé', () => {
		const origine = origineDUnDroit(INDEX, ARBRE, 'a', 'marc', 'Infrastructure');
		expect(origine).toEqual({ dossierId: 'a', propre: true, racine: false, nom: 'Alpha' });
		expect(libelleDOrigine(origine)).toBe('— accordé sur ce dossier');
	});

	it('nomme le DOMAINE quand le droit vient de la racine', () => {
		const origine = origineDUnDroit(INDEX, ARBRE, 'a2', 'karim', 'Infrastructure');
		expect(origine?.racine).toBe(true);
		expect(libelleDOrigine(origine)).toBe('— hérité du domaine Infrastructure');
	});

	it('nomme le DOSSIER quand le droit vient d’un ancêtre intermédiaire', () => {
		const origine = origineDUnDroit(INDEX, ARBRE, 'a2', 'marc', 'Infrastructure');
		/* `a1` est plus proche que `a` : c’est lui, et pas l’autre. */
		expect(origine?.dossierId).toBe('a1');
		expect(libelleDOrigine(origine)).toBe('— hérité du dossier Alpha un');
	});

	it('RG-DRO-02 — rend `null` quand aucun ancêtre ne porte de droit, et se tait', () => {
		expect(origineDUnDroit(INDEX, ARBRE, 'a2', 'lea', 'Infrastructure')).toBeNull();
		expect(libelleDOrigine(null)).toBe('');
	});

	it('RG-DRO-03 — un administrateur sans ligne n’a pas de dossier d’origine', () => {
		/* Son droit vient de son RÔLE. Nommer un dossier serait faux, et `P-02`
		   interdit d’afficher une valeur qu’on n’a pas. */
		const sophie = identiteAuthentifiee('sophie', 'administrateur');
		expect(resoudreDroitDeDossier(sophie, 'a2', INDEX)).toBe('gestionnaire');
		expect(origineDUnDroit(INDEX, ARBRE, 'a2', 'sophie', 'Infrastructure')).toBeNull();
	});
});

describe('l’origine et la résolution lisent la MÊME chaîne — P-26', () => {
	/**
	 * Le contrôle qui empêche `origineDUnDroit()` de devenir une seconde
	 * définition de `RG-DRO-01`. Il ne compare pas deux implémentations d’un même
	 * calcul : il vérifie que le droit POSÉ à l’origine trouvée est exactement
	 * celui que l’implémentation unique rend. Une divergence d’ordre de remontée
	 * le casserait immédiatement.
	 */
	it('le droit posé à l’origine est celui que la résolution rend, partout', () => {
		let compares = 0;
		for (const compteId of ['karim', 'marc', 'lea', 'inconnu']) {
			const identite = identiteAuthentifiee(compteId, 'contributeur');
			for (const d of ARBRE) {
				const attendu = resoudreDroitDeDossier(identite, d.id, INDEX);
				const origine = origineDUnDroit(INDEX, ARBRE, d.id, compteId, 'Infrastructure');
				if (attendu === null) {
					expect(origine).toBeNull();
				} else {
					expect(origine).not.toBeNull();
					expect(INDEX.explicites.get(origine?.dossierId ?? '')?.get(compteId)).toBe(attendu);
				}
				compares++;
			}
		}
		/* Quatre comptes × treize dossiers : le cas est exercé, pas espéré. */
		expect(compares).toBe(4 * ARBRE.length);
	});
});

/* ═══════════════════════════════════ Le dialogue des droits ════════════ */

/**
 * LES COMPTES D'ÉPREUVE — trois qui portent un droit quelque part sur la
 * branche `a`, un actif qui n'en a aucun, un DÉSACTIVÉ qui en a un.
 *
 * Le dernier n'est pas décoratif : `RG-M14-08` conserve un compte désactivé et
 * ses contributions, donc sa ligne de droit lui survit. Un dialogue qui ne la
 * montrerait pas laisserait en base un accès que personne ne pourrait retirer.
 */
const COMPTES = [
	{ id: 'karim', identifiant: 'karim.belhadj', nom: 'Karim Belhadj', actif: true },
	{ id: 'marc', identifiant: 'marc.ferreira', nom: 'Marc Ferreira', actif: true },
	{ id: 'lea', identifiant: 'lea.marchand', nom: 'Léa Marchand', actif: true },
	{ id: 'sophie', identifiant: 'sophie.nguyen', nom: 'Sophie Nguyen', actif: true },
	{ id: 'pierre', identifiant: 'pierre.dubois', nom: 'Pierre Dubois', actif: false }
];

describe('les droits d’un dossier, tous comptes — la lecture qui n’existait pas', () => {
	it('distingue le droit PROPRE du droit HÉRITÉ, et nomme l’origine de chacun', () => {
		/* Sur `a1` : Marc y a un droit posé, Karim l’hérite de la racine. */
		const rendus = droitsResolusDUnDossier(INDEX, ARBRE, 'a1', COMPTES, 'Infrastructure');
		const parCompte = new Map(rendus.map((d) => [d.identifiant, d]));

		expect(parCompte.get('marc.ferreira')).toMatchObject({
			niveau: 'lecteur',
			herite: false,
			origine: '— accordé sur ce dossier'
		});
		expect(parCompte.get('karim.belhadj')).toMatchObject({
			niveau: 'gestionnaire',
			herite: true,
			origine: '— hérité du domaine Infrastructure'
		});
	});

	it('nomme le DOSSIER intermédiaire quand le droit vient de lui', () => {
		/* Sur `a2`, le droit de Marc vient de `a1` — le plus proche, RG-DRO-01. */
		const rendus = droitsResolusDUnDossier(INDEX, ARBRE, 'a2', COMPTES, 'Infrastructure');
		expect(rendus.find((d) => d.identifiant === 'marc.ferreira')).toMatchObject({
			niveau: 'lecteur',
			herite: true,
			origine: '— hérité du dossier Alpha un'
		});
	});

	it('RG-DRO-02 — n’invente aucune ligne pour un compte qui n’a rien sur la chaîne', () => {
		const rendus = droitsResolusDUnDossier(INDEX, ARBRE, 'a1', COMPTES, 'Infrastructure');
		expect(rendus.map((d) => d.identifiant)).not.toContain('sophie.nguyen');
		/* Léa n’a un droit que sur `b` : la branche `a` ne le voit pas. */
		expect(rendus.map((d) => d.identifiant)).not.toContain('lea.marchand');
	});

	it('met les droits PROPRES en tête, les hérités ensuite', () => {
		const rendus = droitsResolusDUnDossier(INDEX, ARBRE, 'a1', COMPTES, 'Infrastructure');
		expect(rendus.map((d) => d.herite)).toEqual([...rendus.map((d) => d.herite)].sort());
		expect(rendus[0]?.herite).toBe(false);
	});

	it('marque la ligne de l’appelant, et elle seule — P-09', () => {
		const rendus = droitsResolusDUnDossier(INDEX, ARBRE, 'a1', COMPTES, 'Infrastructure', 'marc');
		expect(rendus.filter((d) => d.soiMeme).map((d) => d.identifiant)).toEqual(['marc.ferreira']);
		/* Sans appelant, aucune ligne n’est la sienne. */
		const anonymes = droitsResolusDUnDossier(INDEX, ARBRE, 'a1', COMPTES, 'Infrastructure');
		expect(anonymes.some((d) => d.soiMeme)).toBe(false);
	});
});

/* ═══════════════════════════════════ L’écriture d’un droit ═════════════ */

describe('le niveau reçu — trois valeurs, et rien d’autre', () => {
	it('accepte les trois de l’énumération', () => {
		expect(niveauDeDroitDepuisLaSaisie('lecteur')).toBe('lecteur');
		expect(niveauDeDroitDepuisLaSaisie('redacteur')).toBe('redacteur');
		expect(niveauDeDroitDepuisLaSaisie('gestionnaire')).toBe('gestionnaire');
	});

	it('refuse tout le reste, et ne retombe sur AUCUN défaut', () => {
		/* Se tromper de défaut ici, c’est accorder un droit. */
		for (const brut of [null, undefined, '', 'Gestion', 'GESTIONNAIRE', 'admin', 42, {}]) {
			expect(niveauDeDroitDepuisLaSaisie(brut)).toBeNull();
		}
	});
});

/**
 * UNE BASE DE PAILLE — elle ne comprend AUCUNE condition, et c’est voulu.
 *
 * Ce qui se mesure ici n’est pas le SQL, que la base seule sait exécuter, mais
 * l’ORDRE DES PORTES et ce qui atteint la base. Le cas le plus important est
 * celui où RIEN ne doit l’atteindre : un appelant sans `gererLesDroits` ne doit
 * déclencher aucune requête, pas même une lecture de compte — c’est ce que
 * `journal` atteste, et aucune assertion sur une valeur de retour ne le dirait.
 *
 * Les lignes rendues sont programmées cas par cas, ce qui rend chaque épreuve
 * indépendante de l’état du dépôt (`P-26`).
 */
interface BaseDePaille {
	readonly journal: string[];
	select: (colonnes: unknown) => {
		from: (table: unknown) => {
			where: (condition: unknown) => { limit: (n: number) => Promise<unknown[]> };
		};
	};
	insert: (table: unknown) => {
		values: (valeurs: unknown) => { onConflictDoUpdate: (options: unknown) => Promise<void> };
	};
	update: (table: unknown) => {
		set: (valeurs: unknown) => { where: (condition: unknown) => Promise<void> };
	};
	delete: (table: unknown) => { where: (condition: unknown) => Promise<void> };
}

function baseDePaille(reponses: {
	compte?: { id: string; nom: string; actif: boolean } | null;
	droitPropre?: DroitDeDossier | null;
}): BaseDePaille {
	const journal: string[] = [];
	let lecture = 0;
	return {
		journal,
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => {
						/* La première lecture est celle du compte, la seconde celle du
						   droit propre — l’ordre est celui du module, et il est fixe. */
						lecture += 1;
						if (lecture === 1) {
							journal.push('lire-compte');
							return Promise.resolve(reponses.compte ? [reponses.compte] : []);
						}
						journal.push('lire-droit-propre');
						return Promise.resolve(reponses.droitPropre ? [{ droit: reponses.droitPropre }] : []);
					}
				})
			})
		}),
		insert: () => ({
			values: () => ({
				onConflictDoUpdate: (options) => {
					/* La cible de la reprise est faite de COLONNES Drizzle, qui se
					   référencent l'une l'autre : seuls leurs noms sont relevés. */
					const cible = (options as { target?: readonly { name?: string }[] }).target ?? [];
					journal.push(`inserer-avec-reprise:${cible.map((c) => c.name ?? '?').join(',')}`);
					return Promise.resolve();
				}
			})
		}),
		update: () => ({
			set: () => ({
				where: () => {
					journal.push('mettre-a-jour');
					return Promise.resolve();
				}
			})
		}),
		delete: () => ({
			where: () => {
				journal.push('supprimer');
				return Promise.resolve();
			}
		})
	};
}

/** Le droit effectif d’un appelant, tel que les trois écritures le reçoivent. */
function droitDe(niveau: DroitDeDossier | null): (dossierId: string) => DroitDeDossier | null {
	return () => niveau;
}

describe('accorder, changer, retirer — la porte du droit passe AVANT tout', () => {
	it('un non-gestionnaire n’atteint AUCUNE des trois actions, et n’ouvre aucune requête', async () => {
		for (const niveau of [null, 'lecteur', 'redacteur'] as const) {
			for (const ecrire of [
				accorderUnDroitDeDossier,
				changerUnDroitDeDossier,
				retirerUnDroitDeDossier
			]) {
				const base = baseDePaille({ compte: { id: 'marc', nom: 'M', actif: true } });
				const refus = await ecrire(base as unknown as Base, {
					dossierId: 'a1',
					identifiantDuCompte: 'marc.ferreira',
					niveau: 'gestionnaire',
					droit: droitDe(niveau),
					appelantId: 'karim',
					appelantContourne: false,
					annuaireLisible: true
				});
				expect(refus).toEqual(REFUS_MUET);
				/* Le refus est MUET — RG-ACC-04 — et la base n’a rien vu. */
				expect(base.journal).toEqual([]);
			}
		}
	});

	it('un gestionnaire accorde, et l’écriture est une REPRISE SUR LA CLÉ PRIMAIRE', async () => {
		const base = baseDePaille({ compte: { id: 'lea', nom: 'Léa Marchand', actif: true } });
		const fait = await accorderUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'lea.marchand',
			niveau: 'redacteur',
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(fait).toEqual({ fait: true, nom: 'Léa Marchand', niveau: 'redacteur' });
		/* Le couple `(dossier_id, compte_id)` est la cible de la reprise : c’est
		   l’unicité qui donne son sens à RG-DRO-01, un droit AU PLUS par couple. */
		const reprise = base.journal.find((l) => l.startsWith('inserer-avec-reprise'));
		expect(reprise).toBeDefined();
		expect(reprise).toContain('dossier_id');
		expect(reprise).toContain('compte_id');
	});

	it('refuse un niveau que l’énumération ne connaît pas, sans rien écrire', async () => {
		const base = baseDePaille({ compte: { id: 'lea', nom: 'Léa', actif: true } });
		const refus = await accorderUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'lea.marchand',
			niveau: null,
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(refus).toEqual({ fait: false, message: NIVEAU_INCONNU });
		expect(base.journal).toEqual([]);
	});

	it('refuse un identifiant de connexion que personne ne porte', async () => {
		const base = baseDePaille({ compte: null });
		const refus = await accorderUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'fantome',
			niveau: 'lecteur',
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(refus).toEqual({ fait: false, message: COMPTE_INTROUVABLE });
		expect(base.journal).toEqual(['lire-compte']);
	});

	it('RG-M14-08 — refuse d’accorder à un compte désactivé, mais laisse RETIRER le sien', async () => {
		const pierre = { id: 'pierre', nom: 'Pierre Dubois', actif: false };

		const refus = await accorderUnDroitDeDossier(
			baseDePaille({ compte: pierre }) as unknown as Base,
			{
				dossierId: 'a1',
				identifiantDuCompte: 'pierre.dubois',
				niveau: 'lecteur',
				droit: droitDe('gestionnaire'),
				appelantId: 'karim',
				appelantContourne: false,
				annuaireLisible: true
			}
		);
		expect(refus).toEqual({ fait: false, message: COMPTE_DESACTIVE });

		/* Le droit d’un compte désactivé reste RETIRABLE : sans quoi il resterait
		   en base sans qu’aucun écran ne puisse le défaire. */
		const retire = await retirerUnDroitDeDossier(
			baseDePaille({ compte: pierre, droitPropre: 'lecteur' }) as unknown as Base,
			{
				dossierId: 'a1',
				identifiantDuCompte: 'pierre.dubois',
				niveau: null,
				droit: droitDe('gestionnaire'),
				appelantId: 'karim',
				appelantContourne: false,
				annuaireLisible: true
			}
		);
		expect(retire).toEqual({ fait: true, nom: 'Pierre Dubois', niveau: null });
	});
});

describe('un droit HÉRITÉ ne se change ni ne se retire ici', () => {
	it('refuse le retrait d’un droit qui n’est pas posé sur ce dossier', async () => {
		/* `DELETE` sans ligne réussit en silence : l’appelant repartirait
		   convaincu d’avoir fermé un accès resté grand ouvert. */
		const base = baseDePaille({
			compte: { id: 'karim', nom: 'Karim Belhadj', actif: true },
			droitPropre: null
		});
		const refus = await retirerUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'karim.belhadj',
			niveau: null,
			droit: droitDe('gestionnaire'),
			appelantId: 'marc',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(refus).toEqual({ fait: false, message: DROIT_NON_PROPRE });
		expect(base.journal).toEqual(['lire-compte', 'lire-droit-propre']);
	});

	it('refuse d’en changer le niveau, pour la même raison', async () => {
		const base = baseDePaille({
			compte: { id: 'karim', nom: 'Karim Belhadj', actif: true },
			droitPropre: null
		});
		const refus = await changerUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'karim.belhadj',
			niveau: 'lecteur',
			droit: droitDe('gestionnaire'),
			appelantId: 'marc',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(refus).toEqual({ fait: false, message: DROIT_NON_PROPRE });
		expect(base.journal).not.toContain('mettre-a-jour');
	});

	it('change bien un droit PROPRE — l’autre polarité, P-5', async () => {
		const base = baseDePaille({
			compte: { id: 'marc', nom: 'Marc Ferreira', actif: true },
			droitPropre: 'lecteur'
		});
		const fait = await changerUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'marc.ferreira',
			niveau: 'gestionnaire',
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(fait).toEqual({ fait: true, nom: 'Marc Ferreira', niveau: 'gestionnaire' });
		expect(base.journal).toContain('mettre-a-jour');
	});
});

describe('un gestionnaire ne se ferme pas la porte', () => {
	it('refuse qu’il retire son PROPRE droit de gestion sur ce dossier', async () => {
		const base = baseDePaille({
			compte: { id: 'karim', nom: 'Karim Belhadj', actif: true },
			droitPropre: 'gestionnaire'
		});
		const refus = await retirerUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'karim.belhadj',
			niveau: null,
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(refus).toEqual({ fait: false, message: AUTO_RETRAIT_DE_GESTION });
		expect(base.journal).not.toContain('supprimer');
	});

	it('refuse aussi qu’il l’ABAISSE — la porte se ferme pareil', async () => {
		for (const niveau of ['lecteur', 'redacteur'] as const) {
			const base = baseDePaille({
				compte: { id: 'karim', nom: 'Karim Belhadj', actif: true },
				droitPropre: 'gestionnaire'
			});
			const refus = await changerUnDroitDeDossier(base as unknown as Base, {
				dossierId: 'a1',
				identifiantDuCompte: 'karim.belhadj',
				niveau,
				droit: droitDe('gestionnaire'),
				appelantId: 'karim',
				appelantContourne: false,
				annuaireLisible: true
			});
			expect(refus).toEqual({ fait: false, message: AUTO_RETRAIT_DE_GESTION });
			expect(base.journal).not.toContain('mettre-a-jour');
		}
	});

	it('mais le laisse RETIRER le droit d’un AUTRE gestionnaire — l’autre polarité', async () => {
		const base = baseDePaille({
			compte: { id: 'marc', nom: 'Marc Ferreira', actif: true },
			droitPropre: 'gestionnaire'
		});
		const fait = await retirerUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'marc.ferreira',
			niveau: null,
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(fait).toEqual({ fait: true, nom: 'Marc Ferreira', niveau: null });
		expect(base.journal).toContain('supprimer');
	});

	it('et le laisse SE MAINTENIR gestionnaire — un réaccord sans abaissement passe', async () => {
		const base = baseDePaille({ compte: { id: 'karim', nom: 'Karim Belhadj', actif: true } });
		const fait = await accorderUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'karim.belhadj',
			niveau: 'gestionnaire',
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(fait).toEqual({ fait: true, nom: 'Karim Belhadj', niveau: 'gestionnaire' });
	});
});

/* ═══════════════════════════════════ RG-DRO-03 contre l'auto-abaissement ═ */

/**
 * L'APPELANT QUI TIENT SA GESTION DE SON RÔLE NE SE FERME RIEN.
 *
 * `RG-DRO-03` accorde `gestionnaire` à l'administrateur SANS ligne dans
 * `droits_de_dossier`. Aucune écriture d'ici ne peut donc la lui reprendre —
 * `resolution.ts` sort avant de lire la table. Lui opposer
 * `AUTO_RETRAIT_DE_GESTION` refusait par un motif qui ne s'applique pas, et sur
 * une INSTANCE NEUVE — table vide, un seul compte, qui est donc son propre
 * unique candidat — c'était DEUX des trois niveaux offerts par le dialogue.
 *
 * `P-5`, les deux polarités : le même geste, au même niveau, sur le même compte,
 * refusé quand la gestion vient de la table et accepté quand elle vient du rôle.
 */
describe('RG-DRO-03 — celui qui tient sa gestion de son RÔLE ne se ferme rien', () => {
	it('s’accorde à lui-même un niveau INFÉRIEUR, sur une table vide', async () => {
		for (const niveau of ['lecteur', 'redacteur'] as const) {
			const base = baseDePaille({ compte: { id: 'admin', nom: 'Alex Berge', actif: true } });
			const fait = await accorderUnDroitDeDossier(base as unknown as Base, {
				dossierId: 'a1',
				identifiantDuCompte: 'admin',
				niveau,
				droit: droitDe('gestionnaire'),
				appelantId: 'admin',
				appelantContourne: true,
				annuaireLisible: true
			});
			expect(fait).toEqual({ fait: true, nom: 'Alex Berge', niveau });
		}
	});

	it('abaisse et retire sa PROPRE ligne, que le motif du refus ne concerne pas', async () => {
		const abaisse = await changerUnDroitDeDossier(
			baseDePaille({
				compte: { id: 'admin', nom: 'Alex Berge', actif: true },
				droitPropre: 'gestionnaire'
			}) as unknown as Base,
			{
				dossierId: 'a1',
				identifiantDuCompte: 'admin',
				niveau: 'lecteur',
				droit: droitDe('gestionnaire'),
				appelantId: 'admin',
				appelantContourne: true,
				annuaireLisible: true
			}
		);
		expect(abaisse).toEqual({ fait: true, nom: 'Alex Berge', niveau: 'lecteur' });

		const retire = await retirerUnDroitDeDossier(
			baseDePaille({
				compte: { id: 'admin', nom: 'Alex Berge', actif: true },
				droitPropre: 'gestionnaire'
			}) as unknown as Base,
			{
				dossierId: 'a1',
				identifiantDuCompte: 'admin',
				niveau: null,
				droit: droitDe('gestionnaire'),
				appelantId: 'admin',
				appelantContourne: true,
				annuaireLisible: true
			}
		);
		expect(retire).toEqual({ fait: true, nom: 'Alex Berge', niveau: null });
	});

	it('mais celui qui tient sa gestion d’un ANCÊTRE se la retirerait — refus', async () => {
		/* `RG-DRO-01` s’arrête au droit le PLUS PROCHE : une ligne propre plus
		   faible bat la gestion héritée, et l’écran ne se rouvrirait plus. Le
		   droit propre est ici ABSENT — le refus ne peut donc pas venir de sa
		   lecture, il vient du régime de l’appelant. */
		const base = baseDePaille({
			compte: { id: 'karim', nom: 'Karim Belhadj', actif: true },
			droitPropre: null
		});
		const refus = await accorderUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'karim.belhadj',
			niveau: 'redacteur',
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(refus).toEqual({ fait: false, message: AUTO_RETRAIT_DE_GESTION });
		expect(base.journal).not.toContain('inserer-avec-reprise');
	});
});

/* ═══════════════════════════════════ La lecture, et son périmètre ═══════ */

/** Une ligne de compte, telle que la lecture des droits la reçoit. */
interface LigneDAnnuaire {
	readonly id: string;
	readonly identifiant: string;
	readonly nom: string;
	readonly actif: boolean;
}

/**
 * LA BASE DE PAILLE DE LA LECTURE — elle relève QUELLE requête part.
 *
 * C'est le seul point mesurable ici, et c'est celui qui compte : `RG-ACC-01`
 * veut le filtre DANS la requête (`ADR-006`), pas après elle. Une assertion sur
 * la valeur rendue ne distinguerait pas une table entière lue puis triée d'une
 * table rabattue par la base — or c'est exactement cette différence qui met, ou
 * non, l'annuaire des comptes de l'instance dans la charge utile.
 *
 * La seconde lecture est donc DEUX chemins distincts dans le journal :
 * `comptes-en-entier` quand rien ne la borne — l'objet rendu est alors attendu
 * tel quel —, `comptes-rabattus` quand une condition l'accompagne.
 */
function baseDeLecture(reponses: {
	lignesDeDroit: readonly { dossierId: string; compteId: string; droit: DroitDeDossier }[];
	annuaire: readonly LigneDAnnuaire[];
	rabattus: readonly LigneDAnnuaire[];
}): { readonly journal: string[]; readonly base: unknown } {
	const journal: string[] = [];
	let requete = 0;
	const base = {
		select: () => ({
			from: () => {
				requete += 1;
				if (requete === 1) {
					return {
						where: () => {
							journal.push('droits-de-la-chaine');
							return Promise.resolve([...reponses.lignesDeDroit]);
						}
					};
				}
				return {
					where: () => {
						journal.push('comptes-rabattus');
						return Promise.resolve([...reponses.rabattus]);
					},
					then: (suite: (lignes: readonly LigneDAnnuaire[]) => unknown) => {
						journal.push('comptes-en-entier');
						return Promise.resolve([...reponses.annuaire]).then(suite);
					}
				};
			}
		})
	};
	return { journal, base };
}

/** Trois dossiers en ligne : la racine du domaine, un dossier, son enfant. */
const CHAINE: readonly LigneDeDossier[] = [
	{
		id: 'r',
		parentId: null,
		domaineId: 'dom',
		nom: 'Infrastructure',
		profondeur: 1
	},
	{
		id: 'd1',
		parentId: 'r',
		domaineId: 'dom',
		nom: 'Exploitation',
		profondeur: 2
	},
	{
		id: 'd2',
		parentId: 'd1',
		domaineId: 'dom',
		nom: 'Sauvegardes',
		profondeur: 3
	}
];

const ANNUAIRE: readonly LigneDAnnuaire[] = [
	{ id: 'karim', identifiant: 'k.belhadj', nom: 'Karim Belhadj', actif: true },
	{ id: 'marc', identifiant: 'm.ferreira', nom: 'Marc Ferreira', actif: true },
	{ id: 'claire', identifiant: 'c.marchand', nom: 'Claire Marchand', actif: true },
	{ id: 'sophie', identifiant: 's.nguyen', nom: 'Sophie Nguyen', actif: true }
];

describe('lireLesDroitsDUnDossier — ce que la requête rapporte, et à qui', () => {
	it('SANS l’annuaire : la requête est rabattue, et aucun candidat n’est rendu', async () => {
		/* Le cas relevé à la contre-lecture : un rédacteur d’un seul domaine
		   reçoit `gestionnaire` sur un dossier, et le dialogue lui servait les
		   identifiants de connexion des deux administrateurs de l’instance — soit
		   l’énumération que la page de connexion interdit par ailleurs en rendant
		   un refus unique (`ARB-005`). */
		const { journal, base } = baseDeLecture({
			lignesDeDroit: [{ dossierId: 'd2', compteId: 'marc', droit: 'gestionnaire' }],
			annuaire: ANNUAIRE,
			rabattus: ANNUAIRE.filter((c) => c.id === 'marc')
		});
		const droits = await lireLesDroitsDUnDossier(base as unknown as Base, {
			dossierId: 'd2',
			lignes: CHAINE,
			nomDuDomaine: 'Infrastructure',
			appelantId: 'marc',
			annuaireLisible: false,
			appelantContourne: false
		});
		expect(journal).toEqual(['droits-de-la-chaine', 'comptes-rabattus']);
		expect(droits.candidats).toEqual([]);
		expect(droits.accordes.map((d) => d.identifiant)).toEqual(['m.ferreira']);
	});

	it('AVEC l’annuaire : la table entière est lue, et les non-dotés sont candidats', async () => {
		const { journal, base } = baseDeLecture({
			lignesDeDroit: [{ dossierId: 'r', compteId: 'karim', droit: 'gestionnaire' }],
			annuaire: ANNUAIRE,
			rabattus: []
		});
		const droits = await lireLesDroitsDUnDossier(base as unknown as Base, {
			dossierId: 'd2',
			lignes: CHAINE,
			nomDuDomaine: 'Infrastructure',
			appelantId: 'karim',
			annuaireLisible: true,
			appelantContourne: false
		});
		expect(journal).toEqual(['droits-de-la-chaine', 'comptes-en-entier']);
		expect(droits.accordes.map((d) => d.origine)).toEqual(['— hérité du domaine Infrastructure']);
		expect(droits.candidats.map((c) => c.identifiant)).toEqual([
			'c.marchand',
			'm.ferreira',
			's.nguyen'
		]);
	});

	it('`soiMeme` marque la ligne que le SERVEUR refusera, pas celle de l’appelant', async () => {
		/* Sa gestion vient de la table : le geste lui est refusé, donc omis. */
		const parLaTable = await lireLesDroitsDUnDossier(
			baseDeLecture({
				lignesDeDroit: [{ dossierId: 'd2', compteId: 'karim', droit: 'gestionnaire' }],
				annuaire: ANNUAIRE,
				rabattus: ANNUAIRE.filter((c) => c.id === 'karim')
			}).base as unknown as Base,
			{
				dossierId: 'd2',
				lignes: CHAINE,
				nomDuDomaine: 'Infrastructure',
				appelantId: 'karim',
				annuaireLisible: false,
				appelantContourne: false
			}
		);
		expect(parLaTable.accordes.map((d) => d.soiMeme)).toEqual([true]);

		/* Elle vient de son rôle : le serveur accepte, donc la vue offre. */
		const parLeRole = await lireLesDroitsDUnDossier(
			baseDeLecture({
				lignesDeDroit: [{ dossierId: 'd2', compteId: 'karim', droit: 'gestionnaire' }],
				annuaire: ANNUAIRE,
				rabattus: ANNUAIRE.filter((c) => c.id === 'karim')
			}).base as unknown as Base,
			{
				dossierId: 'd2',
				lignes: CHAINE,
				nomDuDomaine: 'Infrastructure',
				appelantId: 'karim',
				annuaireLisible: false,
				appelantContourne: true
			}
		);
		expect(parLeRole.accordes.map((d) => d.soiMeme)).toEqual([false]);
	});
});

/* ═══════════════════════════════════ L'annuaire gouverne aussi l'écriture ═ */

/**
 * CE QUE L'ÉCRAN N'OFFRE PAS, L'ACTION NE LE TIENT PAS NON PLUS.
 *
 * Le dialogue omet « Ajouter un accès » à qui ne voit pas l'annuaire des comptes
 * — il n'aurait personne à nommer. Une garde d'écran que l'action ne tient pas
 * n'est pas une garde : l'adresse se construit à la main, et le couple
 * `303` / `422 compte introuvable` rendrait à l'unité l'énumération qu'on vient
 * de refuser en bloc. Le refus est MUET, comme celui du droit, et il vient AVANT
 * toute requête — c'est `journal` qui l'atteste.
 */
describe('l’annuaire gouverne l’écriture autant que la lecture', () => {
	it('ACCORDER est fermé à qui ne voit pas l’annuaire, sans ouvrir de requête', async () => {
		const base = baseDePaille({ compte: { id: 'sophie', nom: 'Sophie Nguyen', actif: true } });
		const refus = await accorderUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 's.nguyen',
			niveau: 'lecteur',
			droit: droitDe('gestionnaire'),
			appelantId: 'marc',
			appelantContourne: false,
			annuaireLisible: false
		});
		expect(refus).toEqual(REFUS_MUET);
		expect(base.journal).toEqual([]);
	});

	it('et ouvert à qui le voit — l’autre polarité, même geste, même compte', async () => {
		const base = baseDePaille({ compte: { id: 'sophie', nom: 'Sophie Nguyen', actif: true } });
		const fait = await accorderUnDroitDeDossier(base as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 's.nguyen',
			niveau: 'lecteur',
			droit: droitDe('gestionnaire'),
			appelantId: 'marc',
			appelantContourne: false,
			annuaireLisible: true
		});
		expect(fait).toEqual({ fait: true, nom: 'Sophie Nguyen', niveau: 'lecteur' });
	});

	it('ARB-005 — un identifiant inconnu et un droit hérité rendent le MÊME refus', async () => {
		/* Deux causes, un seul message : sans quoi le refus répondrait « ce compte
		   existe » à qui essaie des identifiants au hasard. */
		for (const ecrire of [changerUnDroitDeDossier, retirerUnDroitDeDossier]) {
			const inconnu = await ecrire(baseDePaille({ compte: null }) as unknown as Base, {
				dossierId: 'a1',
				identifiantDuCompte: 'fantome',
				niveau: 'lecteur',
				droit: droitDe('gestionnaire'),
				appelantId: 'marc',
				appelantContourne: false,
				annuaireLisible: false
			});
			const herite = await ecrire(
				baseDePaille({
					compte: { id: 'sophie', nom: 'Sophie Nguyen', actif: true },
					droitPropre: null
				}) as unknown as Base,
				{
					dossierId: 'a1',
					identifiantDuCompte: 's.nguyen',
					niveau: 'lecteur',
					droit: droitDe('gestionnaire'),
					appelantId: 'marc',
					appelantContourne: false,
					annuaireLisible: false
				}
			);
			expect(inconnu).toEqual({ fait: false, message: DROIT_NON_PROPRE });
			expect(inconnu).toEqual(herite);
		}
	});

	it('mais l’administrateur, lui, apprend que l’identifiant n’existe pas', async () => {
		const refus = await retirerUnDroitDeDossier(baseDePaille({ compte: null }) as unknown as Base, {
			dossierId: 'a1',
			identifiantDuCompte: 'fantome',
			niveau: null,
			droit: droitDe('gestionnaire'),
			appelantId: 'karim',
			appelantContourne: true,
			annuaireLisible: true
		});
		expect(refus).toEqual({ fait: false, message: COMPTE_INTROUVABLE });
	});
});
