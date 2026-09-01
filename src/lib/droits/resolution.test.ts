/**
 * Batterie 3 — la résolution des droits (`RG-DRO-01` à `05`, `RG-ACC-01`,
 * `RG-ACC-04`). Lot `T-011`.
 *
 * CE FICHIER EST LA PREUVE QUE LES RÈGLES SONT EXERCÉES, et il distingue
 * scrupuleusement deux choses que `P-5` interdit de confondre : *« une règle
 * qu'aucun cas n'exerce est une règle dont on ignore si elle marche »*.
 *
 *   — Les cas marqués **CORPUS RÉEL** sont joués sur `seeds/corpus.ts` tel
 *     qu'il est livré : 19 dossiers, 5 comptes, 32 notes. Rien n'est ajouté.
 *
 *   — Les cas marqués **GABARIT DÉCLARÉ** ne peuvent PAS l'être : le corpus ne
 *     porte AUCUN droit explicite de dossier. `droits_de_dossier` est créée par
 *     `002_socle.montee.sql:202` et déclarée par `src/lib/base/schema.ts:227`,
 *     mais aucune semence ne l'alimente et rien ne la lit. Les trois cas qui
 *     exigent un droit explicite — la remontée, le plus spécifique, la racine —
 *     sont donc joués sur l'ARBORESCENCE RÉELLE du corpus et les COMPTES RÉELS
 *     du corpus, avec des droits posés ICI, dans le test, et nulle part
 *     ailleurs. Le contrat de ce lot demande de le dire plutôt que d'inventer
 *     une donnée de semence : c'est dit, et `seeds/corpus.ts` n'est pas touché.
 */
import { describe, expect, it } from 'vitest';
import { COMPTES } from '../../../seeds/corpus';
import { lignesDeDossier, lignesDeNote } from '../base/semence';
import {
	ANONYME,
	INTROUVABLE,
	capacites,
	chaineDAncetres,
	identiteAuthentifiee,
	indexerLesDroits,
	noteLisible,
	noteVisibleEnAnonyme,
	perimetreAnonyme,
	perimetreContient,
	perimetreDeLecture,
	resoudre,
	resoudreDroitDeDossier,
	type DossierDeLArbre,
	type DroitExplicite,
	type Identite,
	type NotePourPerimetre
} from './resolution';

/* ── L'arborescence RÉELLE du corpus, telle que la semence la déduit ───── */

/** Identifiant de dossier : son chemin complet. Unique — le chemin commence
 *  par le nom du domaine (`semence.ts:284`). */
const idDe = (chemin: readonly string[]): string => chemin.join(' › ');

const DOSSIERS_DU_CORPUS: readonly DossierDeLArbre[] = lignesDeDossier().map((l) => ({
	id: idDe(l.chemin),
	parentId: l.chemin.length > 1 ? idDe(l.chemin.slice(0, -1)) : null
}));

const NOTES_DU_CORPUS: readonly NotePourPerimetre[] = lignesDeNote().map((n) => ({
	dossierId: idDe(n.cheminDeDossier),
	visibilite: n.visibilite,
	statut: n.statut
}));

/** Les comptes réels, par leur identifiant de corpus. */
const compte = (id: string): string => {
	const c = COMPTES.find((x) => x.id === id);
	if (c === undefined) throw new Error(`compte absent du corpus : ${id}`);
	return c.id;
};

const SOPHIE = compte('c-sophie'); // Administrateur
const KARIM = compte('c-karim'); // Référent
const MARC = compte('c-marc'); // Contributeur
const PIERRE = compte('c-ancien'); // Lecteur

const ADMIN = identiteAuthentifiee(SOPHIE, 'administrateur');
const REFERENT = identiteAuthentifiee(KARIM, 'referent');
const CONTRIBUTEUR = identiteAuthentifiee(MARC, 'contributeur');
const LECTEUR = identiteAuthentifiee(PIERRE, 'lecteur');

/** Quelques dossiers réels, nommés une fois. */
const RACINE_INFRA = 'Infrastructure';
const SAUVEGARDES = 'Infrastructure › Exploitation › Sauvegardes';
const EXPLOITATION = 'Infrastructure › Exploitation';
const SONDES = 'Infrastructure › Supervision › Sondes';
/**
 * Les deux dossiers du domaine « Applications » qui portent une note publique,
 * et leur parent — DÉRIVÉS du corpus par les identifiants de note, jamais
 * écrits en clair. Deux raisons, et la seconde n'est pas cosmétique :
 *
 *  1. le test se lie à la donnée réelle plutôt qu'à une copie de son libellé ;
 *  2. le libellé de ce parent contient le concept « fiche », que M14.7 rend
 *     RENOMMABLE globalement et que le vocabulaire contractuel fige.
 *     L'écrire six fois ici déplaçait le compteur de la batterie 17 — mesuré :
 *     77 avant, 83 après. Un lot qui ne touche aucune vue n'a pas à bouger le
 *     décompte d'une batterie de vocabulaire.
 */
const dossierDeLaNote = (identifiant: string): string => {
	const note = lignesDeNote().find((n) => n.identifiant === identifiant);
	if (note === undefined) throw new Error(`note absente du corpus : ${identifiant}`);
	return idDe(note.cheminDeDossier);
};

const ACCES = dossierDeLaNote('n-demander-acces');
const SUPPORT = dossierDeLaNote('n-signaler-incident');
/** Le parent commun des deux : il ne porte lui-même aucune note publique. */
const FICHES_APPLICATIVES = ACCES.slice(0, ACCES.lastIndexOf(' › '));

/** L'index du corpus livré : arborescence réelle, AUCUN droit explicite. */
const INDEX_CORPUS = indexerLesDroits(DOSSIERS_DU_CORPUS, []);

/** Le même arbre, avec des droits posés pour le test seulement. */
const avecDroits = (...droits: readonly DroitExplicite[]) =>
	indexerLesDroits(DOSSIERS_DU_CORPUS, droits);

/* ═══════════════════════════════════════════════════════════════════════ */

describe('le corpus livré — ce qu il offre, et ce qu il n offre pas', () => {
	it('porte bien 19 dossiers et 5 comptes', () => {
		expect(DOSSIERS_DU_CORPUS).toHaveLength(19);
		expect(COMPTES).toHaveLength(5);
	});

	it('exactement un dossier racine par domaine, sans parent (RG-STR-03)', () => {
		const racines = DOSSIERS_DU_CORPUS.filter((d) => d.parentId === null);
		expect(racines.map((d) => d.id).sort()).toEqual([
			'Applications',
			'Infrastructure',
			'Migration 2026',
			'Poste de travail'
		]);
	});

	it('ne porte AUCUN droit explicite de dossier — le fait qui gouverne ce lot', () => {
		// La table existe (002_socle.montee.sql:202) ; rien ne l'alimente. Les
		// cas 1, 2 et 6 du contrat sont donc injouables sur le corpus seul, et
		// ce test fige ce constat : le jour où la semence porterait des droits,
		// il rougit et les gabarits déclarés ci-dessous devront être revus.
		expect(INDEX_CORPUS.explicites.size).toBe(0);
	});

	it('porte un compte DÉSACTIVÉ — la donnée qui éprouvera RG-M14-08 en T-012', () => {
		// RG-M14-08 (CDC:1186) : « un compte désactivé perd IMMÉDIATEMENT
		// l'accès ». La règle n'est pas de ce lot et n'a aucun point
		// d'application aujourd'hui — écart déclaré. Ce test épingle la donnée
		// pour qu'elle ne se perde pas : si la semence rendait un jour tous les
		// comptes actifs, le cas disparaîtrait sans témoin (`P-5`).
		const inactifs = COMPTES.filter((c) => !c.actif);
		expect(inactifs.map((c) => c.id)).toEqual(['c-ancien']);
	});

	it('porte 6 notes publiques et publiées, dans 6 dossiers distincts', () => {
		const publiques = NOTES_DU_CORPUS.filter(noteVisibleEnAnonyme);
		expect(publiques).toHaveLength(6);
		expect(new Set(publiques.map((n) => n.dossierId)).size).toBe(6);
	});
});

describe('CAS 3 · aucun droit nulle part sur la chaîne — RG-DRO-02 · CORPUS RÉEL', () => {
	// « En l'absence de tout droit explicite sur le dossier ou l'un de ses
	// ancêtres, l'utilisateur n'a AUCUN accès. » Le corpus livré est
	// intégralement dans ce cas : 19 dossiers, 0 droit.
	it('un contributeur réel n a aucun droit sur un dossier réel', () => {
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SAUVEGARDES, INDEX_CORPUS)).toBeNull();
	});

	it('la fermeture par défaut vaut pour les 19 dossiers et les 3 comptes non administrateurs', () => {
		for (const identite of [REFERENT, CONTRIBUTEUR, LECTEUR]) {
			for (const dossier of DOSSIERS_DU_CORPUS) {
				expect(resoudreDroitDeDossier(identite, dossier.id, INDEX_CORPUS)).toBeNull();
			}
		}
	});

	it('le référent ne contourne rien : RG-DRO-03 ne nomme que l administrateur', () => {
		// Le rôle « Référent » existe (ARB-036, 4 rôles) et n'est PAS cité par
		// RG-DRO-03. L'étendre serait un comblement.
		expect(resoudreDroitDeDossier(REFERENT, RACINE_INFRA, INDEX_CORPUS)).toBeNull();
	});

	it('un dossier inconnu ferme aussi — et sans se distinguer d un dossier interdit', () => {
		expect(
			resoudreDroitDeDossier(CONTRIBUTEUR, 'dossier-qui-n-existe-pas', INDEX_CORPUS)
		).toBeNull();
	});

	it('aucune capacité ne découle de l absence de droit', () => {
		expect(capacites(null)).toEqual({
			lire: false,
			ecrireDesNotes: false,
			creerDesSousDossiers: false,
			administrerLeDossier: false,
			gererLesDroits: false
		});
	});
});

describe('CAS 4 · administrateur sur un dossier qu aucun droit ne lui ouvre — RG-DRO-03 · CORPUS RÉEL', () => {
	// Sophie Nguyen est « Administrateur » au corpus, et le corpus ne porte
	// aucun droit : la condition « qu'aucun droit ne lui ouvre » est
	// littéralement vraie pour les 19 dossiers.
	it('Sophie Nguyen obtient gestionnaire sur un dossier sans aucun droit posé', () => {
		expect(resoudreDroitDeDossier(ADMIN, SAUVEGARDES, INDEX_CORPUS)).toBe('gestionnaire');
	});

	it('sur les 19 dossiers du corpus, sans exception', () => {
		for (const dossier of DOSSIERS_DU_CORPUS) {
			expect(resoudreDroitDeDossier(ADMIN, dossier.id, INDEX_CORPUS)).toBe('gestionnaire');
		}
	});

	it('son périmètre de lecture est « tout », jamais un ensemble énuméré', () => {
		const perimetre = perimetreDeLecture(ADMIN, INDEX_CORPUS, NOTES_DU_CORPUS);
		expect(perimetre.tout).toBe(true);
		expect(perimetreContient(perimetre, SAUVEGARDES)).toBe(true);
		// Y compris pour un dossier dont il n'a jamais été question.
		expect(perimetreContient(perimetre, 'dossier-inconnu')).toBe(true);
	});

	it('le contournement ne dépend pas de la table : il ne la consulte pas', () => {
		// Même avec un droit FAIBLE explicitement posé sur lui, l'administrateur
		// reste gestionnaire — RG-DRO-03 contourne, il ne compare pas.
		const index = avecDroits({ dossierId: SAUVEGARDES, compteId: SOPHIE, droit: 'lecteur' });
		expect(resoudreDroitDeDossier(ADMIN, SAUVEGARDES, index)).toBe('gestionnaire');
	});
});

describe('CAS 5 · anonyme — RG-DRO-04, les deux moitiés · CORPUS RÉEL', () => {
	const perimetre = perimetreAnonyme(INDEX_CORPUS, NOTES_DU_CORPUS);

	it('les droits de dossier ne s appliquent pas à l anonyme, même s il en existe un', () => {
		// Première moitié de RG-DRO-04. Un droit posé sur un compte ne peut pas
		// fuir vers l'anonyme : l'anonyme n'a pas de compte.
		const index = avecDroits({ dossierId: SAUVEGARDES, compteId: MARC, droit: 'gestionnaire' });
		expect(resoudreDroitDeDossier(ANONYME, SAUVEGARDES, index)).toBeNull();
	});

	it('ADVERSARIAL — une identité anonyme FORGÉE portant un compte et un rôle est refusée quand même', () => {
		// Ce test existe parce qu'une sonde de mutation l'a exigé : neutraliser
		// le court-circuit anonyme de `resoudreDroitDeDossier` ne faisait rougir
		// AUCUN test, la recherche par `compteId` échouant de toute façon. Le
		// garde-fou était donc espéré, pas éprouvé (`P-5`).
		//
		// La forme ci-dessous est impossible À LA COMPILATION — c'est tout
		// l'objet du type `Identite`. Elle reste possible À L'EXÉCUTION : une
		// désérialisation de session laxiste, un objet reconstruit depuis un
		// cookie ou un JSON d'API suffisent. `ADR-006` interdit « tout chemin
		// dérogatoire en anonyme » ; ce test vérifie qu'il n'y en a pas, même
		// pour un objet malformé.
		const forgee = {
			type: 'anonyme',
			compteId: MARC,
			role: 'administrateur'
		} as unknown as Identite;
		const index = avecDroits({ dossierId: SAUVEGARDES, compteId: MARC, droit: 'gestionnaire' });

		// Le droit existe bel et bien pour ce compte, par l'identité légitime.
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SAUVEGARDES, index)).toBe('gestionnaire');
		// Il reste inatteignable en anonyme : le court-circuit précède la
		// lecture de la table ET le contournement administrateur de RG-DRO-03.
		expect(resoudreDroitDeDossier(forgee, SAUVEGARDES, index)).toBeNull();
		// Et le périmètre de lecture ne bascule pas davantage sur « tout ».
		expect(perimetreDeLecture(forgee, index, NOTES_DU_CORPUS).tout).toBe(false);
	});

	it('voit exactement 9 dossiers sur 19 — l ensemble est CLOS (« et rien d autre »)', () => {
		expect([...perimetre].sort()).toEqual(
			[
				'Applications',
				FICHES_APPLICATIVES,
				ACCES,
				SUPPORT,
				'Poste de travail',
				'Poste de travail › Déploiement',
				'Poste de travail › Déploiement › Comptes',
				'Poste de travail › Déploiement › Réseau',
				'Poste de travail › Déploiement › Salles'
			].sort()
		);
	});

	it('MOITIÉ A — un dossier sans note publique est invisible, et tout son domaine avec', () => {
		// Aucune note publique dans Infrastructure ni dans Migration 2026.
		for (const dossier of DOSSIERS_DU_CORPUS) {
			if (dossier.id.startsWith('Infrastructure') || dossier.id.startsWith('Migration 2026')) {
				expect(perimetre.has(dossier.id)).toBe(false);
			}
		}
		expect(perimetre.has(SAUVEGARDES)).toBe(false);
		expect(perimetre.has(SONDES)).toBe(false);
	});

	it('MOITIÉ B — « ainsi que leurs ancêtres » : le parent des deux dossiers publics ne porte AUCUNE note publique et est pourtant visible', () => {
		// C'est LE datum du corpus qui éprouve la seconde moitié. Les deux notes
		// publiques du domaine sont dans « Accès » et « Support » ; leur parent
		// « Fiches applicatives » n'en porte aucune, et la racine
		// « Applications » non plus. Sans les ancêtres, le dossier public serait
		// visible mais inatteignable.
		const publiquesDirectes = NOTES_DU_CORPUS.filter(
			(n) => noteVisibleEnAnonyme(n) && n.dossierId === FICHES_APPLICATIVES
		);
		expect(publiquesDirectes).toHaveLength(0);
		expect(perimetre.has(FICHES_APPLICATIVES)).toBe(true);
		expect(perimetre.has(ACCES)).toBe(true);
		// La racine du domaine, elle aussi ancêtre et sans note publique.
		expect(perimetre.has('Applications')).toBe(true);
	});

	it('une note publique mais NON PUBLIÉE n ouvre aucun dossier (publique ET publiée)', () => {
		const brouillonPublic: NotePourPerimetre = {
			dossierId: SAUVEGARDES,
			visibilite: 'publique',
			statut: 'brouillon'
		};
		expect(noteVisibleEnAnonyme(brouillonPublic)).toBe(false);
		expect(perimetreAnonyme(INDEX_CORPUS, [brouillonPublic]).size).toBe(0);
	});

	it('PIÈGE — appartenir au périmètre ne rend pas les notes internes du dossier visibles', () => {
		// Le périmètre gouverne les DOSSIERS ; noteVisibleEnAnonyme gouverne les
		// NOTES. Omettre le second publierait le corpus interne (RG-ACC-01).
		const internesDansUnDossierVisible = NOTES_DU_CORPUS.filter(
			(n) => perimetre.has(n.dossierId) && !noteVisibleEnAnonyme(n)
		);
		expect(internesDansUnDossierVisible.length).toBeGreaterThan(0);
		for (const note of internesDansUnDossierVisible) {
			expect(noteVisibleEnAnonyme(note)).toBe(false);
		}
	});

	it('le périmètre de lecture anonyme est celui-là, et il n est pas « tout »', () => {
		const p = perimetreDeLecture(ANONYME, INDEX_CORPUS, NOTES_DU_CORPUS);
		expect(p.tout).toBe(false);
		expect(perimetreContient(p, ACCES)).toBe(true);
		expect(perimetreContient(p, SAUVEGARDES)).toBe(false);
	});
});

describe('CAS 1 · droit sur un ancêtre lointain — RG-DRO-01, la remontée · GABARIT DÉCLARÉ', () => {
	// Le corpus ne porte aucun droit : le droit ci-dessous est posé par le test,
	// sur l'arborescence RÉELLE et un compte RÉEL.
	const index = avecDroits({ dossierId: EXPLOITATION, compteId: MARC, droit: 'redacteur' });

	it('un droit sur Exploitation vaut sur Exploitation › Sauvegardes, deux niveaux plus bas', () => {
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SAUVEGARDES, index)).toBe('redacteur');
	});

	it('il ne déborde pas sur une autre branche du même domaine', () => {
		// Supervision › Sondes n'est pas sous Exploitation.
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SONDES, index)).toBeNull();
	});

	it('il ne remonte pas : le parent de l ancêtre porteur reste fermé', () => {
		// L'héritage descend. Un droit sur Exploitation n'ouvre pas Infrastructure.
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, RACINE_INFRA, index)).toBeNull();
	});

	it('il ne vaut que pour le compte qui le porte', () => {
		expect(resoudreDroitDeDossier(LECTEUR, SAUVEGARDES, index)).toBeNull();
	});

	it('la chaîne d ancêtres va du plus proche à la racine, dans cet ordre', () => {
		expect(chaineDAncetres(index, SAUVEGARDES)).toEqual([SAUVEGARDES, EXPLOITATION, RACINE_INFRA]);
	});
});

describe('CAS 2 · un droit plus proche contredit un droit d ancêtre — RG-DRO-01 · GABARIT DÉCLARÉ', () => {
	it('LE PLUS SPÉCIFIQUE GAGNE, même quand il est plus FAIBLE', () => {
		// C'est le cœur de RG-DRO-01, et le piège : « le plus spécifique gagne »
		// n'est pas « le plus fort gagne ». Un lecteur posé près l'emporte sur un
		// gestionnaire posé loin.
		const index = avecDroits(
			{ dossierId: RACINE_INFRA, compteId: MARC, droit: 'gestionnaire' },
			{ dossierId: SAUVEGARDES, compteId: MARC, droit: 'lecteur' }
		);
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SAUVEGARDES, index)).toBe('lecteur');
		// Le frère non redéfini garde, lui, le droit de la racine.
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SONDES, index)).toBe('gestionnaire');
	});

	it('et l emporte aussi quand il est plus FORT', () => {
		const index = avecDroits(
			{ dossierId: RACINE_INFRA, compteId: MARC, droit: 'lecteur' },
			{ dossierId: SAUVEGARDES, compteId: MARC, droit: 'gestionnaire' }
		);
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SAUVEGARDES, index)).toBe('gestionnaire');
	});

	it('le niveau INTERMÉDIAIRE l emporte sur la racine, et cède au plus proche', () => {
		const index = avecDroits(
			{ dossierId: RACINE_INFRA, compteId: MARC, droit: 'gestionnaire' },
			{ dossierId: EXPLOITATION, compteId: MARC, droit: 'redacteur' },
			{ dossierId: SAUVEGARDES, compteId: MARC, droit: 'lecteur' }
		);
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, SAUVEGARDES, index)).toBe('lecteur');
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, EXPLOITATION, index)).toBe('redacteur');
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, RACINE_INFRA, index)).toBe('gestionnaire');
	});
});

describe('CAS 6 · droit sur la racine — RG-DRO-05, tout le sous-arbre · GABARIT DÉCLARÉ', () => {
	const index = avecDroits({ dossierId: RACINE_INFRA, compteId: KARIM, droit: 'gestionnaire' });

	it('couvre les 8 dossiers du domaine Infrastructure, à toute profondeur', () => {
		const duDomaine = DOSSIERS_DU_CORPUS.filter((d) => d.id.startsWith('Infrastructure'));
		expect(duDomaine).toHaveLength(8);
		for (const dossier of duDomaine) {
			expect(resoudreDroitDeDossier(REFERENT, dossier.id, index)).toBe('gestionnaire');
		}
	});

	it('et ne franchit AUCUN autre domaine — le sous-arbre, pas le corpus', () => {
		const horsDomaine = DOSSIERS_DU_CORPUS.filter((d) => !d.id.startsWith('Infrastructure'));
		expect(horsDomaine).toHaveLength(11);
		for (const dossier of horsDomaine) {
			expect(resoudreDroitDeDossier(REFERENT, dossier.id, index)).toBeNull();
		}
	});

	it('le périmètre de lecture qui en découle est exactement ce sous-arbre', () => {
		const perimetre = perimetreDeLecture(REFERENT, index, NOTES_DU_CORPUS);
		expect(perimetre.tout).toBe(false);
		if (perimetre.tout) return;
		expect(perimetre.dossiers.size).toBe(8);
		expect(perimetreContient(perimetre, SONDES)).toBe(true);
		expect(perimetreContient(perimetre, ACCES)).toBe(false);
	});
});

describe('les capacités — CDC §2.3, table des droits, ligne à ligne', () => {
	it('lecteur : lire seulement', () => {
		expect(capacites('lecteur')).toEqual({
			lire: true,
			ecrireDesNotes: false,
			creerDesSousDossiers: false,
			administrerLeDossier: false,
			gererLesDroits: false
		});
	});

	it('rédacteur : lire et écrire des notes, rien de plus', () => {
		expect(capacites('redacteur')).toEqual({
			lire: true,
			ecrireDesNotes: true,
			creerDesSousDossiers: false,
			administrerLeDossier: false,
			gererLesDroits: false
		});
	});

	it('gestionnaire : les cinq colonnes', () => {
		expect(capacites('gestionnaire')).toEqual({
			lire: true,
			ecrireDesNotes: true,
			creerDesSousDossiers: true,
			administrerLeDossier: true,
			gererLesDroits: true
		});
	});

	it('les trois droits permettent de lire — c est la première colonne de la table', () => {
		for (const droit of ['lecteur', 'redacteur', 'gestionnaire'] as const) {
			expect(capacites(droit).lire).toBe(true);
		}
	});

	it('seul le gestionnaire gère les droits (P-09 en dépend)', () => {
		expect(capacites('lecteur').gererLesDroits).toBe(false);
		expect(capacites('redacteur').gererLesDroits).toBe(false);
		expect(capacites('gestionnaire').gererLesDroits).toBe(true);
	});
});

describe('RG-ACC-04 — refus et inexistence indiscernables', () => {
	const existante = { id: ACCES };

	it('une ressource inexistante et une ressource interdite rendent LE MÊME OBJET', () => {
		// Pas « deux objets égaux » : le MÊME. L'identité de référence est ce
		// qu'un champ ajouté plus tard à l'un des deux casserait aussitôt.
		const inexistante = resoudre(null, () => true);
		const interdite = resoudre(existante, () => false);
		expect(inexistante).toBe(interdite);
		expect(inexistante).toBe(INTROUVABLE);
	});

	it('undefined et null passent par la même sortie', () => {
		expect(resoudre(undefined, () => true)).toBe(INTROUVABLE);
		expect(resoudre(null, () => true)).toBe(INTROUVABLE);
	});

	it('l échec ne porte AUCUN motif : il n y a rien à lire dessus', () => {
		const echec = resoudre(existante, () => false);
		expect(echec.trouve).toBe(false);
		// La seule clé de l'objet est `trouve`. Un `raison`, un `code` ou un
		// `interdit` ajouté un jour serait un oracle : ce test l'interdit.
		expect(Object.keys(echec)).toEqual(['trouve']);
	});

	it('la valeur d échec est GELÉE — un appelant ne peut pas la doter d un motif', () => {
		// INTROUVABLE est un singleton PARTAGÉ : sans gel, un seul appelant
		// distrait qui y écrirait un champ le donnerait à tous les autres, et
		// l'oracle que RG-ACC-04 ferme se rouvrirait globalement.
		expect(Object.isFrozen(INTROUVABLE)).toBe(true);
		const echec = resoudre(existante, () => false) as Record<string, unknown>;
		expect(() => {
			'use strict';
			echec.raison = 'interdit';
		}).toThrow();
		expect(Object.keys(INTROUVABLE)).toEqual(['trouve']);
	});

	it('une ressource dans le périmètre est rendue, elle', () => {
		const ok = resoudre(existante, () => true);
		expect(ok.trouve).toBe(true);
		if (!ok.trouve) return;
		expect(ok.ressource).toBe(existante);
	});

	it('composé au périmètre anonyme : un dossier interne est INTROUVABLE, comme un dossier absent', () => {
		const p = perimetreDeLecture(ANONYME, INDEX_CORPUS, NOTES_DU_CORPUS);
		const interne = resoudre({ id: SAUVEGARDES }, (d) => perimetreContient(p, d.id));
		const absent = resoudre(null, () => true);
		expect(interne).toBe(absent);
	});
});

describe('noteLisible — la composition des deux filtres · CORPUS RÉEL', () => {
	const pAnon = perimetreDeLecture(ANONYME, INDEX_CORPUS, NOTES_DU_CORPUS);

	it('l anonyme ne lit AUCUNE note interne, y compris dans un dossier de son périmètre', () => {
		// Le cas qui compte : le dossier est visible, la note ne l'est pas.
		const internesDansPerimetre = NOTES_DU_CORPUS.filter(
			(n) => perimetreContient(pAnon, n.dossierId) && n.visibilite === 'interne'
		);
		expect(internesDansPerimetre.length).toBeGreaterThan(0);
		for (const note of internesDansPerimetre) {
			expect(noteLisible(ANONYME, note, pAnon)).toBe(false);
		}
	});

	it('l anonyme lit les 6 notes publiques et publiées du corpus, et exactement elles', () => {
		const lisibles = NOTES_DU_CORPUS.filter((n) => noteLisible(ANONYME, n, pAnon));
		expect(lisibles).toHaveLength(6);
		for (const note of lisibles) expect(noteVisibleEnAnonyme(note)).toBe(true);
	});

	it('sur les 32 notes du corpus, l anonyme en lit 6 et en refuse 26', () => {
		expect(NOTES_DU_CORPUS).toHaveLength(32);
		const refusees = NOTES_DU_CORPUS.filter((n) => !noteLisible(ANONYME, n, pAnon));
		expect(refusees).toHaveLength(26);
	});

	it('un authentifié sans droit ne lit rien — le périmètre est vide (RG-DRO-02)', () => {
		const pMarc = perimetreDeLecture(CONTRIBUTEUR, INDEX_CORPUS, NOTES_DU_CORPUS);
		expect(pMarc.tout).toBe(false);
		if (pMarc.tout) return;
		expect(pMarc.dossiers.size).toBe(0);
		for (const note of NOTES_DU_CORPUS) {
			expect(noteLisible(CONTRIBUTEUR, note, pMarc)).toBe(false);
		}
	});

	it('l administrateur lit les 32 notes du corpus (RG-DRO-03)', () => {
		const pAdmin = perimetreDeLecture(ADMIN, INDEX_CORPUS, NOTES_DU_CORPUS);
		const lisibles = NOTES_DU_CORPUS.filter((n) => noteLisible(ADMIN, n, pAdmin));
		expect(lisibles).toHaveLength(32);
	});
});

describe('le garde-fou de cycle — un déni de service n est pas une règle métier', () => {
	it('une arborescence cyclique ne boucle pas, et FERME', () => {
		// Le schéma interdit qu'un dossier soit son propre parent, mais pas un
		// cycle plus long (002_socle.montee.sql:18). La remontée doit s'arrêter.
		const cyclique = indexerLesDroits(
			[
				{ id: 'a', parentId: 'b' },
				{ id: 'b', parentId: 'a' }
			],
			[]
		);
		expect(chaineDAncetres(cyclique, 'a')).toEqual(['a', 'b']);
		expect(resoudreDroitDeDossier(CONTRIBUTEUR, 'a', cyclique)).toBeNull();
	});

	it('un parent qui n existe pas arrête la remontée sans exception', () => {
		const orphelin = indexerLesDroits([{ id: 'seul', parentId: 'disparu' }], []);
		expect(chaineDAncetres(orphelin, 'seul')).toEqual(['seul']);
	});

	it('un dossier inconnu rend une chaîne vide', () => {
		expect(chaineDAncetres(INDEX_CORPUS, 'inexistant')).toEqual([]);
	});
});
