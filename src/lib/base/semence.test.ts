/**
 * LES UNITAIRES DE LA SEMENCE — ce qui se contrôle SANS base de données.
 *
 * Ce qui exige une base — réversibilité, unicités, cohérence du catalogue —
 * n'est pas ici : c'est `pnpm verif:base`, qui a besoin du conteneur `db`.
 * Mélanger les deux rendrait `pnpm test:unit` dépendant de Docker, et une
 * batterie qui ne s'exécute pas est une batterie qui ne prouve rien.
 *
 * Ce que ces tests regardent : la DÉRIVATION du corpus vers les lignes. C'est
 * la seule partie où une erreur silencieuse est possible — un chemin de
 * dossier mal découpé, une date qui décale la fraîcheur, une traduction
 * d'énumération oubliée.
 */
import { describe, expect, it } from 'vitest';
import {
	CORPUS,
	DOMAINES,
	RELATIONS,
	REVISIONS,
	TYPES_RELATION,
	UNIVERS
} from '../../../seeds/corpus';
import { SEUILS_PAR_DEFAUT, niveauFraicheur } from '../fraicheur';
import {
	MODULE_EN_ENUM,
	ROLE_EN_ENUM,
	TYPE_DE_CHAMP_EN_ENUM,
	anciennete,
	dateCourteEnIso,
	lignesDEtiquette,
	lignesDUnivers,
	lignesDeChamp,
	lignesDeCompte,
	lignesDeDomaine,
	lignesDeDossier,
	lignesDeNote,
	lignesDeParametre,
	lignesDeRelation,
	lignesDeTypeDeRelation,
	verifierFraicheur,
	verifierUniversDesNotes
} from './semence';

describe('les dates', () => {
	it('lit le format d’affichage des maquettes', () => {
		expect(dateCourteEnIso('01/08/2026')).toBe('2026-08-01');
	});

	it('refuse ce qui n’est pas une date courte', () => {
		expect(() => dateCourteEnIso('2026-08-01')).toThrow();
	});
});

describe('la fraîcheur du corpus chargé', () => {
	/**
	 * LE TEST QUI COMPTE. Les dates écrites en base doivent redonner, par
	 * l'implémentation unique de P-01, le niveau que le corpus porte. S'il
	 * échoue, la base ment sur la fraîcheur — le mécanisme central du produit.
	 */
	it('redonne le niveau que le corpus porte, pour les 32 notes', () => {
		expect(verifierFraicheur()).toEqual([]);
	});

	it('n’invente pas de vérification pour la note jamais vérifiée', () => {
		const lignes = lignesDeNote();
		const jamais = lignes.filter((l) => l.verifieLe === null);
		expect(jamais).toHaveLength(1);
		expect(jamais[0]?.identifiant).toBe('n-tester-pra');
	});

	it('fait retomber la note jamais vérifiée sur sa date de modification', () => {
		const ligne = lignesDeNote().find((l) => l.identifiant === 'n-tester-pra');
		expect(ligne).toBeDefined();
		if (ligne === undefined) return;
		expect(anciennete(ligne.modifieLe)).toBe(141);
		expect(niveauFraicheur(141, SEUILS_PAR_DEFAUT)).toBe('vieil');
	});
});

describe('le rangement', () => {
	it('ne stocke l’univers que par le domaine, et le corpus s’y prête', () => {
		expect(verifierUniversDesNotes()).toEqual([]);
	});

	it('donne un dossier racine par domaine, et un seul', () => {
		const racines = lignesDeDossier().filter((d) => d.profondeur === 1);
		expect(racines).toHaveLength(DOMAINES.length);
		expect(new Set(racines.map((r) => r.domaineNom)).size).toBe(DOMAINES.length);
	});

	it('reste sous le plafond de dix niveaux (RG-STR-04)', () => {
		for (const dossier of lignesDeDossier()) {
			expect(dossier.profondeur).toBeGreaterThanOrEqual(1);
			expect(dossier.profondeur).toBeLessThanOrEqual(10);
		}
	});

	it('range chaque note sous un dossier qui existe', () => {
		const chemins = new Set(lignesDeDossier().map((d) => `${d.domaineNom} ${d.chemin.join(' ')}`));
		for (const note of lignesDeNote()) {
			expect(chemins.has(`${note.domaineNom} ${note.cheminDeDossier.join(' ')}`)).toBe(true);
		}
	});

	it('rattache tout dossier non racine à un parent du même domaine', () => {
		const chemins = new Set(lignesDeDossier().map((d) => `${d.domaineNom} ${d.chemin.join(' ')}`));
		for (const dossier of lignesDeDossier()) {
			if (dossier.profondeur === 1) continue;
			const parent = dossier.chemin.slice(0, -1);
			expect(chemins.has(`${dossier.domaineNom} ${parent.join(' ')}`)).toBe(true);
		}
	});
});

describe('les traductions d’énumération', () => {
	it('couvre les quatre rôles des maquettes', () => {
		expect(Object.keys(ROLE_EN_ENUM)).toHaveLength(4);
		expect(Object.values(ROLE_EN_ENUM)).toEqual([
			'administrateur',
			'referent',
			'contributeur',
			'lecteur'
		]);
	});

	it('couvre les six modules des maquettes', () => {
		expect(Object.keys(MODULE_EN_ENUM)).toHaveLength(6);
		expect(MODULE_EN_ENUM.carteMentale).toBe('carte_mentale');
	});

	it('traduit « interrupteur » en « booleen », le type de CDC §3.5', () => {
		expect(TYPE_DE_CHAMP_EN_ENUM.interrupteur).toBe('booleen');
	});

	it('n’émet que des valeurs d’énumération connues pour les champs de fiche', () => {
		const admis = new Set(['texte', 'nombre', 'date', 'liste', 'lien', 'booleen']);
		for (const champ of lignesDeChamp()) expect(admis.has(champ.type)).toBe(true);
	});

	it('réserve les valeurs de liste aux champs de type liste', () => {
		for (const champ of lignesDeChamp()) {
			if (champ.valeurs !== null) expect(champ.type).toBe('liste');
		}
	});
});

describe('les volumes dérivés du corpus', () => {
	it('porte les trois univers, dont un système', () => {
		const lignes = lignesDUnivers();
		expect(lignes).toHaveLength(UNIVERS.length);
		expect(lignes.filter((u) => u.systeme)).toHaveLength(1);
		expect(lignes.find((u) => u.systeme)?.nom).toBe('Non classé');
	});

	it('donne un identifiant lisible distinct à chaque univers et domaine', () => {
		expect(new Set(lignesDUnivers().map((u) => u.identifiant)).size).toBe(UNIVERS.length);
		const parUnivers = lignesDeDomaine().map((d) => `${d.universNom}/${d.identifiant}`);
		expect(new Set(parUnivers).size).toBe(DOMAINES.length);
	});

	it('porte les 32 notes, sans identifiant en double', () => {
		const lignes = lignesDeNote();
		expect(lignes).toHaveLength(CORPUS.length);
		expect(new Set(lignes.map((n) => n.identifiant)).size).toBe(CORPUS.length);
	});

	it('n’écrit un corps Opérationnel que pour les notes qui le déclarent', () => {
		const attendu = CORPUS.filter((n) => n.operationnel).length;
		expect(lignesDeNote().filter((n) => n.corpsOperationnel !== null)).toHaveLength(attendu);
	});

	it('rattache chaque demande de révision à sa note', () => {
		const demandees = lignesDeNote().filter((n) => n.revisionDemandee);
		expect(demandees).toHaveLength(REVISIONS.length);
		for (const ligne of demandees) {
			expect(ligne.revisionParNom).not.toBeNull();
			expect(ligne.revisionLe).not.toBeNull();
		}
	});

	it('ne porte de commentaire de révision que sur une note qui en demande une', () => {
		for (const ligne of lignesDeNote()) {
			if (!ligne.revisionDemandee) {
				expect(ligne.revisionCommentaire).toBeNull();
				expect(ligne.revisionParNom).toBeNull();
				expect(ligne.revisionLe).toBeNull();
			}
		}
	});

	it('porte l’adresse et la date d’ajout ensemble, ou aucune des deux', () => {
		for (const ligne of lignesDeNote()) {
			expect(ligne.signetAdresse === null).toBe(ligne.signetAjouteLe === null);
		}
	});

	it('déduplique les étiquettes partagées à l’échelle du produit', () => {
		const libelles = lignesDEtiquette();
		expect(new Set(libelles).size).toBe(libelles.length);
		expect(libelles.length).toBeLessThan(CORPUS.flatMap((n) => n.etiquettes).length);
	});

	it('porte les cinq comptes de la console', () => {
		expect(lignesDeCompte()).toHaveLength(5);
	});

	it('porte les 22 relations, chacune vers une note du corpus', () => {
		const identifiants = new Set(CORPUS.map((n) => n.id));
		const lignes = lignesDeRelation();
		expect(lignes).toHaveLength(RELATIONS.length);
		for (const r of lignes) {
			expect(identifiants.has(r.sourceIdentifiant as never)).toBe(true);
			expect(identifiants.has(r.cibleIdentifiant as never)).toBe(true);
			expect(r.sourceIdentifiant).not.toBe(r.cibleIdentifiant);
		}
	});

	it('marque comme techniques les quatre types de relation qui le sont', () => {
		const lignes = lignesDeTypeDeRelation();
		expect(lignes).toHaveLength(Object.keys(TYPES_RELATION).length);
		expect(lignes.filter((t) => t.technique).map((t) => t.identifiant)).toEqual([
			'heberge',
			'depend',
			'replique',
			'sauvegarde'
		]);
	});

	it('porte les seuils de fraîcheur en paramètres, sans les réécrire', () => {
		const parametres = new Map(lignesDeParametre().map((p) => [p.cle, p.valeur]));
		expect(parametres.get('seuil_frais')).toBe(SEUILS_PAR_DEFAUT.frais);
		expect(parametres.get('seuil_vieillissant')).toBe(SEUILS_PAR_DEFAUT.vieillissant);
	});
});
