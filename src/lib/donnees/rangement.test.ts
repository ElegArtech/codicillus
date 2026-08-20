/**
 * LES UNITAIRES DU RANGEMENT — ce qui se contrôle SANS base.
 *
 * La règle est celle que `semence.test.ts` a posée et que `lecture.test.ts`
 * suit : ce qui exige un conteneur n'est pas ici. « Mélanger les deux rendrait
 * `pnpm test:unit` dépendant de Docker, et une batterie qui ne s'exécute pas est
 * une batterie qui ne prouve rien. »
 *
 * Ce que ces tests regardent, et pourquoi ce sont ceux-là :
 *
 *   1. LA TRADUCTION DE CHEMIN, dans les deux sens. C'est le point où l'on se
 *      trompe : le jeu porte le chemin en chaîne, la base porte un parent. Une
 *      erreur y est silencieuse — un dossier voisin rendu à la place du bon.
 *   2. LE SÉPARATEUR, aux octets. Il tient en trois caractères dont deux
 *      espaces, et un séparateur retapé sans ses espaces ne lève pas : il
 *      affiche un chemin faux.
 *   3. RG-STR-06 DANS SES DEUX POLARITÉS. Un contrôle dont le seul cas
 *      d'épreuve est l'état du dépôt devient inerte le jour où le dépôt change
 *      (`P-26`). Celui-ci est synthétique.
 *   4. LA PROJECTION D'UNE NOTE, sur les 32 notes du corpus. C'est ce qui
 *      referme le doublon de projection avec `lireNotes()` de `T-030` : les deux
 *      doivent rendre le corpus, et celle-ci le prouve sans conteneur.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS, DETAIL_DOMAINES, DOMAINES, type Note } from '../../../seeds/corpus';
import {
	corpsDepuisTexte,
	corpsVide,
	dateCourteEnIso,
	instantAvantReference,
	instantDeDateCourte,
	instantDeReference
} from '../base/semence';
import { SEUILS_PAR_DEFAUT } from '../fraicheur';
import { identifiantLisible, segmentsDeDossier } from '../rangement/adresses';
import type { ContexteDeLecture } from './lecture';
import {
	PROFONDEUR_MAX,
	SEPARATEUR_DE_CHEMIN,
	cheminAffiche,
	moduleActif,
	noteDepuisLigne,
	resoudreLeChemin,
	segmentsAffiches,
	type LigneDeDossier,
	type LigneDeNote,
	type VoisinesDeNote
} from './rangement';

/* ═══════════════════════════════════════════ Le séparateur ═════════════ */

describe('le séparateur de chemin — un relevé du gel, pas une commodité', () => {
	it('vaut espace, U+203A, espace — et les deux espaces en font partie', () => {
		/* Le relevé est celui de `verif/scenarios/V-13.json` : entre les deux noms
		   de dossier, cinq octets `20 e2 80 ba 20`. Les comparer par code de point
		   plutôt que par un littéral recopié est ce qui rend l'épreuve utile : un
		   littéral faux serait faux des deux côtés. */
		expect([...SEPARATEUR_DE_CHEMIN].map((c) => c.codePointAt(0))).toEqual([0x20, 0x203a, 0x20]);
		expect(Buffer.from(SEPARATEUR_DE_CHEMIN, 'utf8').toString('hex')).toBe('20e280ba20');
	});

	it('est celui que le corpus emploie dans `Note.dossier`', () => {
		const composes = CORPUS.filter((n) => segmentsDeDossier(n.dossier).length > 1);
		expect(composes.length).toBeGreaterThan(0);
		for (const note of composes) {
			expect(note.dossier).toBe(cheminAffiche(segmentsDeDossier(note.dossier)));
			expect(note.dossier).toContain(SEPARATEUR_DE_CHEMIN);
		}
	});

	it('recompose exactement ce que `segmentsDeDossier` a découpé, pour tout le corpus', () => {
		for (const note of CORPUS) {
			expect(cheminAffiche(segmentsDeDossier(note.dossier))).toBe(note.dossier);
		}
	});
});

/* ═══════════════════════════════════════════ L'arborescence ════════════ */

/**
 * Une arborescence synthétique, et elle porte les deux pièges réels du corpus :
 * un même nom de dossier dans deux domaines (« Applications »), et deux frères
 * de même profondeur qui ne forment PAS un chemin (« Sauvegardes » et
 * « Astreinte »).
 */
const ARBRE: readonly LigneDeDossier[] = [
	{ id: 'r-infra', parentId: null, domaineId: 'd-infra', nom: 'Infrastructure', profondeur: 1 },
	{ id: 'expl', parentId: 'r-infra', domaineId: 'd-infra', nom: 'Exploitation', profondeur: 2 },
	{ id: 'sauv', parentId: 'expl', domaineId: 'd-infra', nom: 'Sauvegardes', profondeur: 3 },
	{ id: 'astr', parentId: 'expl', domaineId: 'd-infra', nom: 'Astreinte', profondeur: 3 },
	{ id: 'appl', parentId: 'r-infra', domaineId: 'd-infra', nom: 'Applications', profondeur: 2 }
];

describe('la résolution d’un chemin d’adresse', () => {
	it('descend l’arborescence par PARENT, et rend le dossier demandé', () => {
		expect(resoudreLeChemin(ARBRE, ['exploitation'])?.id).toBe('expl');
		expect(resoudreLeChemin(ARBRE, ['exploitation', 'sauvegardes'])?.id).toBe('sauv');
		expect(resoudreLeChemin(ARBRE, ['exploitation', 'astreinte'])?.id).toBe('astr');
		expect(resoudreLeChemin(ARBRE, ['applications'])?.id).toBe('appl');
	});

	it('refuse deux FRÈRES pris pour un chemin — le piège d’`ECART-041` en miniature', () => {
		/* « Sauvegardes » et « Astreinte » ont la même profondeur : elles sont des
		   frères, jamais un chemin. Une résolution par nom global les enchaînerait
		   et fabriquerait une adresse qui n'existe pas. */
		expect(resoudreLeChemin(ARBRE, ['exploitation', 'sauvegardes', 'astreinte'])).toBeNull();
		expect(resoudreLeChemin(ARBRE, ['sauvegardes'])).toBeNull();
	});

	it('refuse un chemin VIDE — la racine n’est pas une page de dossier', () => {
		expect(resoudreLeChemin(ARBRE, [])).toBeNull();
	});

	it('refuse la racine désignée par son nom : elle n’est pas dans le chemin', () => {
		expect(resoudreLeChemin(ARBRE, ['infrastructure'])).toBeNull();
	});

	it('refuse au-delà du plafond de RG-STR-04 sans interroger quoi que ce soit', () => {
		const trop = new Array(PROFONDEUR_MAX).fill('exploitation');
		expect(trop.length).toBe(10);
		expect(resoudreLeChemin(ARBRE, trop)).toBeNull();
	});

	it('refuse un segment inconnu plutôt que d’approcher', () => {
		expect(resoudreLeChemin(ARBRE, ['exploitation', 'ceci-n-existe-pas'])).toBeNull();
	});

	it('rend `null` quand l’ensemble n’a pas de racine — fermeture, pas exception', () => {
		expect(
			resoudreLeChemin(
				ARBRE.filter((d) => d.parentId !== null),
				['exploitation']
			)
		).toBeNull();
	});
});

describe('les segments affichés — l’inverse exact', () => {
	it('excluent la racine et rendent les noms, du plus haut au dossier', () => {
		expect(segmentsAffiches(ARBRE, 'sauv')).toEqual(['Exploitation', 'Sauvegardes']);
		expect(segmentsAffiches(ARBRE, 'expl')).toEqual(['Exploitation']);
		expect(segmentsAffiches(ARBRE, 'r-infra')).toEqual([]);
	});

	it('se composent avec la résolution en l’identité, pour tout dossier de l’arbre', () => {
		for (const dossier of ARBRE) {
			const segments = segmentsAffiches(ARBRE, dossier.id);
			const adresse = segments.map(identifiantLisible);
			if (segments.length === 0) {
				expect(resoudreLeChemin(ARBRE, adresse)).toBeNull();
				continue;
			}
			expect(resoudreLeChemin(ARBRE, adresse)?.id).toBe(dossier.id);
		}
	});

	it('rend le chemin affiché que le gel montre, séparateur compris', () => {
		expect(cheminAffiche(segmentsAffiches(ARBRE, 'sauv'))).toBe('Exploitation › Sauvegardes');
	});

	it('ne boucle pas sur une arborescence cyclique — elle tronque, donc elle ferme', () => {
		/* Le schéma plafonne la profondeur et interdit qu'un dossier soit son propre
		   parent, mais il n'exclut pas un cycle plus long : le cas est écrit ici,
		   parce qu'une donnée cyclique ferait un déni de service. */
		const cycle: readonly LigneDeDossier[] = [
			{ id: 'a', parentId: 'b', domaineId: 'd', nom: 'A', profondeur: 2 },
			{ id: 'b', parentId: 'a', domaineId: 'd', nom: 'B', profondeur: 2 }
		];
		expect(segmentsAffiches(cycle, 'a')).toEqual(['B', 'A']);
	});
});

/* ═══════════════════════════════════════════ RG-STR-06 ════════════════ */

describe('RG-STR-06 — l’activation d’un module, dans les DEUX polarités', () => {
	it('laisse passer un module activé', () => {
		expect(moduleActif(new Set(['notes', 'dossiers']), 'notes')).toBe(true);
		expect(moduleActif(new Set(['notes', 'dossiers']), 'dossiers')).toBe(true);
	});

	it('refuse un module non activé — c’est P-04, « l’activation n’est pas décorative »', () => {
		expect(moduleActif(new Set(['notes']), 'dossiers')).toBe(false);
		expect(moduleActif(new Set(['notes']), 'signets')).toBe(false);
		expect(moduleActif(new Set(), 'notes')).toBe(false);
	});

	it('le corpus exerce réellement le refus sur `dossiers` — deux domaines sur quatre', () => {
		/* La règle serait « espérée » et non posée si aucun domaine du jeu ne
		   présentait le cas (`P-5`). Il en présente deux, et la semence leur écrit
		   pourtant des dossiers en base (`lignesDeDossier()` les dérive de
		   `Note.dossier`, sans regarder les modules) : leurs adresses de dossier
		   doivent donc être refusées. Le compte est ici pour rougir si le jeu
		   changeait — auquel cas la route perdrait son cas d'épreuve réel. */
		const sans = DOMAINES.map((d) => d.nom).filter(
			(nom) => !moduleActif(new Set(DETAIL_DOMAINES[nom].modules), 'dossiers')
		);
		expect(sans).toEqual(['Applications', 'Migration 2026']);
		expect(DOMAINES.length).toBe(4);
	});

	it('et le refus sur `notes` n’est exercé par AUCUN domaine — dit, non caché', () => {
		/* Les quatre domaines activent `notes`. Le contrôle de la route V-12 n'a
		   donc aucun cas réel, et c'est exactement ce que `P-5` demande de dire
		   plutôt que de laisser croire. Son épreuve est celle, synthétique, des deux
		   cas ci-dessus. */
		const sans = DOMAINES.map((d) => d.nom).filter(
			(nom) => !moduleActif(new Set(DETAIL_DOMAINES[nom].modules), 'notes')
		);
		expect(sans).toEqual([]);
	});
});

/* ═══════════════════════════════════════════ La projection ════════════ */

/**
 * La ligne que la base rendrait pour une note du corpus — l'inverse de la
 * semence, écrit avec les fabriques de la semence elle-même. C'est ce qui rend
 * l'épreuve indépendante de tout conteneur.
 */
function ligneDepuisNote(note: Note): LigneDeNote {
	return {
		identifiant: note.id,
		titre: note.titre,
		corpsReference: corpsDepuisTexte(note.extrait),
		corpsOperationnel: note.operationnel ? corpsVide() : null,
		typeNom: note.type,
		typeFicheNom: note.typeFiche ?? null,
		universNom: note.univers,
		domaineNom: note.domaine,
		dossierId: `dossier-de-${note.id}`,
		auteurNom: note.auteur,
		visibilite: note.visibilite === 'Publique' ? 'publique' : 'interne',
		statut: note.brouillon ? 'brouillon' : 'publiee',
		modifieLe: instantAvantReference(note.jours),
		verifieLe: note.revise === null ? null : instantDeDateCourte(note.revise),
		consultations: note.vues,
		signetAdresse: note.url ?? null,
		signetAjouteLe: note.ajoute === undefined ? null : dateCourteEnIso(note.ajoute)
	};
}

describe('la projection d’une ligne vers une `Note` — les 32 notes du corpus', () => {
	const contexte: ContexteDeLecture = {
		maintenant: instantDeReference(),
		seuils: SEUILS_PAR_DEFAUT
	};

	it('rend chaque note du corpus, champ pour champ, clés optionnelles comprises', () => {
		expect(CORPUS.length).toBe(32);
		for (const attendue of CORPUS) {
			const voisines: VoisinesDeNote = {
				chemins: new Map([[`dossier-de-${attendue.id}`, attendue.dossier]]),
				etiquettes: new Map([[attendue.id, attendue.etiquettes]]),
				/* Le compte RÉEL de la table est zéro tant que la semence n'écrit aucune
				   pièce jointe : la lacune de `T-030` est reprise, non comblée. La note
				   attendue est donc comparée avec `pj` remis à sa valeur de corpus, et
				   l'écart est mesuré à part juste en dessous. */
				piecesJointes: new Map([[attendue.id, attendue.pj]])
			};
			expect(noteDepuisLigne(ligneDepuisNote(attendue), voisines, contexte)).toEqual(attendue);
		}
	});

	it('omet les trois clés optionnelles quand la colonne est nulle, jamais ne les pose vides', () => {
		const sansSignet = CORPUS.find((n) => n.url === undefined && n.typeFiche === undefined);
		expect(sansSignet).toBeDefined();
		if (sansSignet === undefined) return;
		const rendue = noteDepuisLigne(
			ligneDepuisNote(sansSignet),
			{
				chemins: new Map([[`dossier-de-${sansSignet.id}`, sansSignet.dossier]]),
				etiquettes: new Map([[sansSignet.id, sansSignet.etiquettes]]),
				piecesJointes: new Map([[sansSignet.id, sansSignet.pj]])
			},
			contexte
		);
		expect(Object.keys(rendue)).not.toContain('typeFiche');
		expect(Object.keys(rendue)).not.toContain('url');
		expect(Object.keys(rendue)).not.toContain('ajoute');
	});

	it('rend zéro pièce jointe quand la table n’en porte aucune — P-02, jamais le chiffre du jeu', () => {
		const avecPJ = CORPUS.find((n) => n.pj > 0);
		expect(avecPJ).toBeDefined();
		if (avecPJ === undefined) return;
		const rendue = noteDepuisLigne(
			ligneDepuisNote(avecPJ),
			{
				chemins: new Map([[`dossier-de-${avecPJ.id}`, avecPJ.dossier]]),
				etiquettes: new Map([[avecPJ.id, avecPJ.etiquettes]]),
				piecesJointes: new Map()
			},
			contexte
		);
		expect(rendue.pj).toBe(0);
	});
});
