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
	COMPTES,
	CORPUS,
	DATE_REFERENCE,
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
	instantDeDerniereConnexion,
	instantMoisAvantReference,
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

/* ═══════════════════════════════════════════════════════════════════════════
   MIGRATION 005 — LES TROIS DONNÉES QUE LE SCHÉMA N'ACCUEILLAIT PAS

   `pnpm verif:donnees` relevait six lacunes ; 005 en referme trois, et ces
   unitaires sont les cas qui les exercent. Sans eux la migration serait posée et
   sa dérivation seulement espérée (`P-5`).

   CE QUI N'EST PAS ICI, ET IL FAUT LE SAVOIR. `ON DELETE SET NULL` sur
   `comptes.domaine_id` — la transcription littérale de RG-M14-04 — n'est éprouvé
   par AUCUNE batterie : `base:coherence` déclare ne pas regarder les actions
   référentielles, les sondes de `base:unicite` n'attendent qu'un refus ou une
   acceptation, et `pnpm test:unit` n'ouvre pas de base par choix assumé
   (entête de ce fichier). C'est une dette nommée au rapport de lot.
   ═══════════════════════════════════════════════════════════════════════════ */

describe('005 — la dernière connexion : du libellé du jeu vers l’instant', () => {
	/** L'instant que `DATE_REFERENCE` désigne, à l'heure de convention. */
	const jourDeReference = `${DATE_REFERENCE}T00:00:00.000Z`;

	it('lit « aujourd’hui à HH:MM » comme la date de référence à cette heure', () => {
		expect(instantDeDerniereConnexion("aujourd'hui à 08:41").toISOString()).toBe(
			`${DATE_REFERENCE}T08:41:00.000Z`
		);
		expect(instantDeDerniereConnexion("aujourd'hui à 09:12").toISOString()).toBe(
			`${DATE_REFERENCE}T09:12:00.000Z`
		);
	});

	it('lit « hier à HH:MM » comme la veille de la référence à cette heure', () => {
		expect(instantDeDerniereConnexion('hier à 17:58').toISOString()).toBe(
			'2026-08-12T17:58:00.000Z'
		);
	});

	it('lit « il y a N jours » à l’heure de convention, pas à une heure inventée', () => {
		const instant = instantDeDerniereConnexion('il y a 3 jours');
		expect(instant.toISOString()).toBe('2026-08-10T00:00:00.000Z');
		expect(anciennete(instant)).toBe(3);
	});

	it('lit « il y a N mois » en mois de calendrier, jamais en tranches de trente jours', () => {
		/* 2026-08-13 moins huit mois est le 13 décembre 2025. Une soustraction de
		   8 × 30 jours donnerait le 15 décembre : le mois de calendrier n'est pas
		   une approximation du mois moyen. */
		expect(instantDeDerniereConnexion('il y a 8 mois').toISOString()).toBe(
			'2025-12-13T00:00:00.000Z'
		);
	});

	it('refuse un libellé d’une autre forme au lieu de rendre `null`', () => {
		expect(() => instantDeDerniereConnexion('la semaine dernière')).toThrow();
		expect(() => instantDeDerniereConnexion('il y a 2 semaines')).toThrow();
		expect(() => instantDeDerniereConnexion('')).toThrow();
	});

	it('accepte l’apostrophe typographique comme la droite', () => {
		expect(instantDeDerniereConnexion('aujourd’hui à 08:41').toISOString()).toBe(
			instantDeDerniereConnexion("aujourd'hui à 08:41").toISOString()
		);
	});

	/**
	 * LE CAS QU'AUCUNE VALEUR DU JEU NE PEUT ATTEINDRE, et c'est pourquoi il est
	 * écrit : `DATE_REFERENCE` tombe un 13, donc le ramenage au dernier jour du
	 * mois ne joue jamais en production de semence. Une branche que rien
	 * n'exerce n'est pas posée, elle est espérée (`P-5`).
	 */
	it('ramène au dernier jour du mois quand le jour n’y existe pas', () => {
		const marsTrenteEtUn = new Date('2026-03-31T00:00:00.000Z');
		expect(instantMoisAvantReference(1, marsTrenteEtUn).toISOString()).toBe(
			'2026-02-28T00:00:00.000Z'
		);
		/* 2024 est bissextile : le 29 existe, et il est retenu. */
		const marsBissextile = new Date('2024-03-31T00:00:00.000Z');
		expect(instantMoisAvantReference(1, marsBissextile).toISOString()).toBe(
			'2024-02-29T00:00:00.000Z'
		);
	});

	it('donne aux cinq comptes un instant antérieur ou égal à la référence', () => {
		const lignes = lignesDeCompte();
		expect(lignes).toHaveLength(COMPTES.length);
		for (const ligne of lignes) {
			expect(ligne.derniereConnexionLe).not.toBeNull();
			if (ligne.derniereConnexionLe === null) continue;
			expect(ligne.derniereConnexionLe.getTime()).toBeLessThanOrEqual(
				new Date(jourDeReference).getTime() + 86_400_000
			);
			expect(Number.isNaN(ligne.derniereConnexionLe.getTime())).toBe(false);
		}
	});
});

describe('005 — le rattachement d’un compte à son domaine principal', () => {
	it('rattache les cinq comptes à un domaine que le corpus connaît', () => {
		const noms = new Set(DOMAINES.map((d) => d.nom));
		const lignes = lignesDeCompte();
		expect(lignes).toHaveLength(COMPTES.length);
		for (const ligne of lignes) {
			expect(ligne.domaineNom).not.toBeNull();
			if (ligne.domaineNom === null) continue;
			expect(noms.has(ligne.domaineNom as never)).toBe(true);
		}
	});

	it('reprend le rattachement du jeu compte par compte, sans le déduire du rôle', () => {
		const par = new Map(lignesDeCompte().map((c) => [c.identifiant, c.domaineNom]));
		expect(par.get('karim.belhadj')).toBe('Infrastructure');
		expect(par.get('sophie.nguyen')).toBe('Applications');
		expect(par.get('marc.ferreira')).toBe('Poste de travail');
	});

	/**
	 * `Compte.id` — `c-karim` — RESTE SANS PLACE, et le vérifier ici évite qu'un
	 * lot le glisse dans `identifiant` par commodité : `identifiant` est
	 * l'identifiant de CONNEXION de CDC:1178, et rien d'autre.
	 */
	it('n’écrit jamais l’identifiant de jeu à la place de l’identifiant de connexion', () => {
		for (const ligne of lignesDeCompte()) {
			expect(ligne.identifiant.startsWith('c-')).toBe(false);
			expect(ligne.identifiant).toContain('.');
		}
	});
});

describe('005 — le rang d’une étiquette sur sa note', () => {
	const trie = (libelles: readonly string[]): readonly string[] =>
		[...libelles].sort((a, b) => a.localeCompare(b, 'fr'));

	it('conserve l’ordre du jeu, sans retri', () => {
		const par = new Map(lignesDeNote().map((n) => [n.identifiant, n.etiquettes]));
		for (const note of CORPUS) {
			expect(par.get(note.id)).toEqual(note.etiquettes);
		}
	});

	/**
	 * LE TEST QUI DONNE UN SENS AU RANG. Si l'ordre du jeu était l'ordre
	 * alphabétique, la colonne `ordre` ne porterait aucune information et 005
	 * serait du poids mort. Le chiffre est celui que `pnpm verif:donnees` imprime
	 * pour cette lacune : 25 notes sur 32.
	 */
	it('porte une information que le tri alphabétique perdrait — 25 notes sur 32', () => {
		const desordonnees = CORPUS.filter(
			(n) => trie(n.etiquettes).join(' ') !== [...n.etiquettes].join(' ')
		);
		expect(desordonnees).toHaveLength(25);
		expect(CORPUS).toHaveLength(32);
	});

	it('donne à chaque étiquette d’une note un rang distinct, de 0 à n−1', () => {
		for (const ligne of lignesDeNote()) {
			const rangs = ligne.etiquettes.map((_, rang) => rang);
			expect(new Set(rangs).size).toBe(ligne.etiquettes.length);
			expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
			if (rangs.length > 0) expect(rangs[0]).toBe(0);
		}
	});
});
