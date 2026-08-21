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
import {
	identiteAuthentifiee,
	indexerLesDroits,
	resoudreDroitDeDossier,
	type DroitExplicite
} from '../droits/resolution';
import { PROFONDEUR_MAX, type LigneDeDossier } from './rangement';
import {
	depasseLePlafond,
	hauteurDuSousArbre,
	libelleDOrigine,
	motifDeRefusDeDestination,
	origineDUnDroit,
	sousArbre,
	DEPLACE_DANS_LUI_MEME,
	DESTINATION_INTERIEURE,
	DESTINATION_MANQUANTE
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
