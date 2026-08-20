/**
 * LES UNITAIRES DES SIGNETS — ce qui se contrôle SANS base.
 *
 * Même partage que `lecture.test.ts` : ce qui exige le conteneur `db` est
 * mesuré par `pnpm test:etancheite`, sur le produit construit et sur sept
 * personas réels. Ici, les DÉCISIONS pures — celles où une erreur est
 * silencieuse parce qu'elle rend un booléen plausible au lieu de lever.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX CHOSES SONT ÉPROUVÉES ICI QUE LA BATTERIE 6 NE PEUT PAS ÉPROUVER
 *
 *   1. LA POLARITÉ INVERSE. `P-5`, second paragraphe : « une règle éprouvée sur
 *      un seul mécanisme n'est éprouvée qu'à moitié ». La batterie 6 pose un
 *      droit sur la RACINE du domaine et rien d'autre ; elle ne peut donc pas
 *      dire ce qui se passe quand le droit est posé sur un SEUL sous-dossier
 *      profond, ni quand il est posé sur un dossier d'un AUTRE domaine. Les
 *      deux cas sont ici.
 *
 *   2. L'UNICITÉ DE L'ÉCHEC, SUR UN CAS SYNTHÉTIQUE. `P-26` : « tout contrôle
 *      doit avoir un cas d'épreuve synthétique, indépendant de l'état du
 *      dépôt ». Que deux causes de refus rendent LE MÊME OBJET (`ADR-007`) est
 *      vérifié ici par identité de référence, sans base et sans corpus : le
 *      contrôle survit donc à toute correction du dépôt.
 */
import { describe, expect, it } from 'vitest';
import type { Base } from '../base/acces';
import {
	ANONYME,
	INTROUVABLE,
	identiteAuthentifiee,
	indexerLesDroits,
	type DossierDeLArbre,
	type DroitExplicite,
	type Perimetre
} from '../droits/resolution';
import { SEUILS_PAR_DEFAUT } from '../fraicheur';
import {
	domaineLisible,
	ecritureDansLeDomaine,
	noteDepuisLaLigne,
	resoudreLAccesAuxSignets,
	vecteurDeV22,
	vecteurDeV23
} from './signets';
import type { Domaine } from '../../../seeds/corpus';

/* ═══════════════════════════════════════════════ Un domaine d'épreuve ══ */

/**
 * Trois niveaux, comme le corpus en porte : la racine du domaine, un dossier,
 * un sous-dossier. Plus un dossier d'un AUTRE domaine, qui ne doit jamais
 * peser — c'est la contrainte `dossiers_parent_meme_domaine` en négatif.
 */
const RACINE = 'd-racine';
const INTERMEDIAIRE = 'd-exploitation';
const PROFOND = 'd-sauvegardes';

const ARBRE: readonly DossierDeLArbre[] = [
	{ id: RACINE, parentId: null },
	{ id: INTERMEDIAIRE, parentId: RACINE },
	{ id: PROFOND, parentId: INTERMEDIAIRE }
];

const MOI = identiteAuthentifiee('c-moi', 'contributeur');
const ADMIN = identiteAuthentifiee('c-admin', 'administrateur');

/** Un droit posé sur un dossier, pour le compte d'épreuve. */
function droitSur(dossierId: string, droit: DroitExplicite['droit']): DroitExplicite {
	return { dossierId, compteId: 'c-moi', droit };
}

describe('domaineLisible — RG-DRO-02 en fermeture, RG-DRO-05 en ouverture', () => {
	it('refuse le domaine quand aucun dossier n’est dans le périmètre', () => {
		const perimetre: Perimetre = { tout: false, dossiers: new Set() };
		expect(domaineLisible(perimetre, ARBRE)).toBe(false);
	});

	it('ouvre le domaine sur un droit posé au SEUL dossier le plus profond', () => {
		/* LA POLARITÉ INVERSE de ce que la batterie 6 pose. Exiger la racine
		   fermerait une porte que les droits ouvrent : un droit sur un
		   sous-dossier donne bien accès au domaine, même si le reste est fermé. */
		const perimetre: Perimetre = { tout: false, dossiers: new Set([PROFOND]) };
		expect(domaineLisible(perimetre, ARBRE)).toBe(true);
	});

	it('ne se laisse pas ouvrir par un dossier d’un AUTRE domaine', () => {
		const perimetre: Perimetre = { tout: false, dossiers: new Set(['d-ailleurs']) };
		expect(domaineLisible(perimetre, ARBRE)).toBe(false);
	});

	it('refuse un domaine SANS dossier, même à l’administrateur', () => {
		/* `RG-STR-03` — toute note appartient à un dossier : un domaine sans
		   dossier n'a pas de note, donc pas de signet. `tout: true` ne fabrique
		   pas une ressource là où il n'y en a aucune. */
		expect(domaineLisible({ tout: true }, [])).toBe(false);
		expect(domaineLisible({ tout: true }, ARBRE)).toBe(true);
	});
});

describe('ecritureDansLeDomaine — la table de CDC §2.3, jamais réécrite', () => {
	it('ferme par défaut : aucun droit explicite, aucune écriture', () => {
		expect(ecritureDansLeDomaine(MOI, indexerLesDroits(ARBRE), ARBRE)).toBe(false);
	});

	it('refuse l’écriture au lecteur, l’accorde au rédacteur et au gestionnaire', () => {
		const index = (droit: DroitExplicite['droit']) =>
			indexerLesDroits(ARBRE, [droitSur(RACINE, droit)]);
		expect(ecritureDansLeDomaine(MOI, index('lecteur'), ARBRE)).toBe(false);
		expect(ecritureDansLeDomaine(MOI, index('redacteur'), ARBRE)).toBe(true);
		expect(ecritureDansLeDomaine(MOI, index('gestionnaire'), ARBRE)).toBe(true);
	});

	it('accorde l’écriture sur un droit posé au seul sous-dossier profond', () => {
		const index = indexerLesDroits(ARBRE, [droitSur(PROFOND, 'redacteur')]);
		expect(ecritureDansLeDomaine(MOI, index, ARBRE)).toBe(true);
	});

	it('n’accorde rien à l’anonyme, quel que soit le droit posé', () => {
		/* `RG-DRO-04` — les droits de dossier ne concernent pas l'anonyme. Le
		   droit est posé sur le compte `c-moi` ; l'anonyme ne peut pas en hériter. */
		const index = indexerLesDroits(ARBRE, [droitSur(RACINE, 'gestionnaire')]);
		expect(ecritureDansLeDomaine(ANONYME, index, ARBRE)).toBe(false);
	});

	it('accorde l’écriture à l’administrateur sans aucun droit explicite', () => {
		/* `RG-DRO-03` — « le rôle administrateur voit tout, sans filtre ». */
		expect(ecritureDansLeDomaine(ADMIN, indexerLesDroits(ARBRE), ARBRE)).toBe(true);
	});

	it('le droit LE PLUS PROCHE l’emporte, y compris pour fermer l’écriture', () => {
		/* `RG-DRO-01`. Rédacteur à la racine, lecteur sur le sous-dossier : le
		   sous-dossier n'autorise plus l'écriture, mais le domaine oui — par ses
		   autres dossiers. Le contrôle porte donc sur l'arbre restreint. */
		const index = indexerLesDroits(ARBRE, [
			droitSur(RACINE, 'redacteur'),
			droitSur(PROFOND, 'lecteur')
		]);
		expect(ecritureDansLeDomaine(MOI, index, [{ id: PROFOND, parentId: INTERMEDIAIRE }])).toBe(
			false
		);
		expect(ecritureDansLeDomaine(MOI, index, ARBRE)).toBe(true);
	});
});

describe('les vecteurs — les noms de réglage des planches gelées', () => {
	const domaine = { nom: 'Infrastructure', univers: 'Production', couleur: '#453ba0' } as Domaine;

	it('V-22 porte `dom`, `droits` et `c-rappel`, et rien d’autre', () => {
		expect(vecteurDeV22(domaine, true)).toEqual({
			dom: 'Infrastructure',
			droits: 'ecriture',
			'c-rappel': true
		});
	});

	it('V-22 passe en lecture seule dès que l’écriture tombe — P-09', () => {
		expect(vecteurDeV22(domaine, false)['droits']).toBe('lecture');
	});

	it('V-23 rend l’enveloppe « page dédiée » et le mode demandé', () => {
		expect(vecteurDeV23('creation')).toEqual({ env: 'page', mode: 'creation' });
		expect(vecteurDeV23('edition')).toEqual({ env: 'page', mode: 'edition' });
	});

	it('V-23 ne pose PAS `recup` — l’axe ne rend rien et il est temporisé', () => {
		expect(Object.keys(vecteurDeV23('creation'))).not.toContain('recup');
	});
});

describe('noteDepuisLaLigne — la forme de `interface Note`, clés optionnelles comprises', () => {
	const contexte = {
		maintenant: new Date('2026-08-13T00:00:00.000Z'),
		seuils: SEUILS_PAR_DEFAUT
	};
	const ligne = {
		identifiant: 'n-sig-statut',
		titre: "Page d'état de l'hébergeur",
		corpsReference: {
			type: 'doc',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Incidents.' }] }]
		},
		corpsOperationnel: null,
		typeNom: 'Signet',
		typeFicheNom: null,
		universNom: 'Production',
		domaineNom: 'Infrastructure',
		dossierId: PROFOND,
		auteurNom: 'Marc Ferreira',
		visibilite: 'interne' as const,
		statut: 'publiee' as const,
		modifieLe: new Date('2026-07-21T00:00:00.000Z'),
		verifieLe: new Date('2026-07-21T00:00:00.000Z'),
		consultations: 312,
		signetAdresse: 'https://status.exemple-hebergeur.net',
		signetAjouteLe: '2026-07-21'
	};
	const chemins = new Map([[PROFOND, 'Supervision']]);
	const etiquettes = new Map([['n-sig-statut', ['incident', 'supervision']]]);
	const pieces = new Map([['n-sig-statut', 0]]);

	it('rend l’adresse web et la date d’ajout du signet', () => {
		const note = noteDepuisLaLigne(ligne, contexte, chemins, etiquettes, pieces);
		expect(note.type).toBe('Signet');
		expect(note.url).toBe('https://status.exemple-hebergeur.net');
		expect(note.ajoute).toBe('21/07/2026');
		expect(note.dossier).toBe('Supervision');
		expect(note.jours).toBe(23);
		expect(note.fraicheur).toBe('frais');
	});

	it('OMET les clés optionnelles quand la colonne est nulle', () => {
		/* Une clé présente et vide n'est pas la même valeur qu'une clé absente
		   pour une comparaison profonde : c'est la règle que `lireNotes()` de
		   `T-030` s'impose, et la couche des signets ne s'en écarte pas. */
		const nue = noteDepuisLaLigne(
			{ ...ligne, signetAdresse: null, signetAjouteLe: null, typeFicheNom: null },
			contexte,
			chemins,
			etiquettes,
			pieces
		);
		expect('url' in nue).toBe(false);
		expect('ajoute' in nue).toBe(false);
		expect('typeFiche' in nue).toBe(false);
	});

	it('n’invente aucune pièce jointe — le compte réel, jamais celui du jeu', () => {
		/* `P-02`. Le corpus déclare des pièces jointes que la semence n'écrit
		   pas ; rendre le chiffre du jeu serait la valeur illustrative proscrite. */
		const note = noteDepuisLaLigne(ligne, contexte, chemins, etiquettes, new Map());
		expect(note.pj).toBe(0);
	});

	it('lit la fraîcheur sur la dernière VÉRIFICATION, et à défaut sur la modification', () => {
		/* `RG-M06-01`. Une note modifiée hier mais vérifiée il y a un an est
		   obsolète : c'est tout le signal du produit. */
		const vieille = noteDepuisLaLigne(
			{
				...ligne,
				modifieLe: new Date('2026-08-12T00:00:00.000Z'),
				verifieLe: new Date('2025-08-12T00:00:00.000Z')
			},
			contexte,
			chemins,
			etiquettes,
			pieces
		);
		expect(vieille.fraicheur).toBe('obs');
		expect(vieille.jours).toBe(1);

		const jamais = noteDepuisLaLigne(
			{ ...ligne, modifieLe: new Date('2025-08-12T00:00:00.000Z'), verifieLe: null },
			contexte,
			chemins,
			etiquettes,
			pieces
		);
		expect(jamais.revise).toBe(null);
		expect(jamais.fraicheur).toBe('obs');
	});
});

/* ═══════════════════════════ L'unicité de l'échec — ADR-007, RG-ACC-04 ══ */

/**
 * UNE BASE FEINTE, ET C'EST TOUT CE QU'IL FAUT POUR ÉPROUVER `ADR-007`.
 *
 * Elle rend une file de résultats, un par requête, et se laisse enchaîner comme
 * le constructeur de drizzle. Elle ne prouve RIEN sur le SQL — c'est
 * `pnpm test:etancheite` qui mesure le produit construit — et elle n'est pas là
 * pour cela : elle est là pour que la propriété « refus et inexistence rendent
 * LE MÊME OBJET » ait un cas d'épreuve qui ne dépende pas de l'état du dépôt.
 */
function basefeinte(files: readonly unknown[][]): Base {
	let rang = 0;
	const chaine: Record<string, unknown> = {};
	const rendre = () => chaine;
	for (const methode of ['select', 'from', 'innerJoin', 'leftJoin', 'where', 'orderBy', 'limit']) {
		chaine[methode] = rendre;
	}
	chaine['then'] = (suite: (valeur: unknown) => void) => {
		suite(files[rang++] ?? []);
	};
	chaine['execute'] = () => Promise.resolve({ rows: [] });
	return chaine as unknown as Base;
}

describe('resoudreLAccesAuxSignets — un seul objet d’échec, quelle qu’en soit la cause', () => {
	const contexte = {
		maintenant: new Date('2026-08-13T00:00:00.000Z'),
		seuils: SEUILS_PAR_DEFAUT
	};
	const segments = { univers: 'production', domaine: 'infrastructure' };

	it('rend INTROUVABLE quand les segments ne désignent aucun domaine', async () => {
		const acces = await resoudreLAccesAuxSignets(basefeinte([[]]), contexte, ANONYME, segments);
		expect(acces).toBe(INTROUVABLE);
	});

	it('rend LE MÊME OBJET quand le module Signets est éteint sur le domaine', async () => {
		/* `RG-STR-06`, `docs/routes.md:134`. Le domaine EXISTE ici : la première
		   requête le rend. C'est donc une cause de refus DIFFÉRENTE de la
		   précédente — et la valeur rendue est la même, par identité de
		   référence. Un champ « raison » ajouté un jour ferait rougir ce test. */
		const domaineTrouve = [
			{ domaineId: 'dom-1', nom: 'Infrastructure', universNom: 'Production', couleur: '#453ba0' }
		];
		const absent = await resoudreLAccesAuxSignets(basefeinte([[]]), contexte, ANONYME, segments);
		const eteint = await resoudreLAccesAuxSignets(
			basefeinte([domaineTrouve, []]),
			contexte,
			ANONYME,
			segments
		);
		expect(eteint).toBe(absent);
		expect(eteint).toBe(INTROUVABLE);
	});

	it('rend LE MÊME OBJET quand le domaine est hors du périmètre de l’appelant', async () => {
		/* Troisième cause : le domaine existe, le module est activé, et l'appelant
		   n'a aucun dossier lisible — un domaine sans dossier suffit à l'établir
		   sans écrire une règle de droit ici. */
		const domaineTrouve = [
			{ domaineId: 'dom-1', nom: 'Infrastructure', universNom: 'Production', couleur: '#453ba0' }
		];
		const horsPerimetre = await resoudreLAccesAuxSignets(
			basefeinte([domaineTrouve, [{ module: 'signets' }], [], []]),
			contexte,
			ANONYME,
			segments
		);
		expect(horsPerimetre).toBe(INTROUVABLE);
	});
});
