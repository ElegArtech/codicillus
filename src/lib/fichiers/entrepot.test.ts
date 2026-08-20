/**
 * LES UNITAIRES DE L'ENTREPÔT — ce qui se contrôle SANS base.
 *
 * Ils portent sur un VRAI répertoire temporaire, jamais sur un système de
 * fichiers simulé : ce qu'on veut prouver est qu'un fichier écrit revient
 * IDENTIQUE, et un double de `node:fs` ne prouverait que le double.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CHAQUE FAMILLE ÉPROUVE, ET POURQUOI ELLE EXISTE
 *
 *   la dérivation du chemin — `P-5` : la garantie centrale de `RG-M04-08` est
 *     qu'aucune chaîne fournie par un utilisateur n'entre dans un chemin. Une
 *     garantie qu'aucun cas ne SOLLICITE est une garantie qu'on espère : les cas
 *     ci-dessous tentent la traversée de répertoire, le chemin absolu et le nom
 *     de fichier ordinaire, et exigent le refus des trois.
 *
 *   l'aller-retour des octets — un fichier engendré, écrit, relu, comparé octet
 *     par octet, sur une image PNG réelle ET sur des octets quelconques.
 *
 *   les deux polarités de l'absence — `P-5` encore : lire une pièce absente rend
 *     `null`, lire une pièce présente rend ses octets. Un contrôle qui ne
 *     jouerait que le second ne distinguerait pas `null` d'une panne.
 *
 *   le plafond — la conversion depuis le réglage de la console, y compris ses
 *     refus. La valeur du mégaoctet est celle du gel (`V-36:2878`), et le cas le
 *     rappelle pour qu'un changement de convention rougisse ici.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rendreDocument } from '../contenu/rendu';
import { gabaritDImage } from '../edition/constructions';
import { adresseDePieceJointe } from '../rangement/adresses';
import { engendrerDesOctets, engendrerUneImagePng, TYPE_MEDIA_PNG } from './engendrer';
import {
	CheminNonDerivableErreur,
	cheminDUnePiece,
	dossierDUneNote,
	ecrireLesOctets,
	effacerLesOctets,
	EntrepotNonConfigureErreur,
	lireLesOctets,
	OCTETS_PAR_MO,
	plafondEnOctets,
	racineDesFichiers,
	tailleSurDisque
} from './entrepot';

const NOTE = 'a0000000-0000-4000-8000-00000000000a';
const PIECE = 'b0000000-0000-4000-8000-00000000000b';
const AUTRE_PIECE = 'c0000000-0000-4000-8000-00000000000c';

let racine = '';

beforeAll(async () => {
	racine = await mkdtemp(join(tmpdir(), 'codicillus-entrepot-'));
});

afterAll(async () => {
	if (racine !== '') await rm(racine, { recursive: true, force: true });
});

/* ═══════════════════════════════════ La racine ══════════════════════════ */

describe('la racine de l’entrepôt est lue, jamais devinée', () => {
	it('l’environnement de la composition la donne', () => {
		expect(racineDesFichiers({ RACINE_FICHIERS: '/var/lib/codicillus/fichiers' })).toBe(
			'/var/lib/codicillus/fichiers'
		);
	});

	it('absente, elle LÈVE — aucun défaut n’est inventé', () => {
		/* Un défaut deviné écrirait les fichiers d'exploitation hors du volume
		   sauvegardé, et `RG-NF-09` perdrait la moitié de son objet sans signal. */
		expect(() => racineDesFichiers({})).toThrow(EntrepotNonConfigureErreur);
		expect(() => racineDesFichiers({ RACINE_FICHIERS: '   ' })).toThrow(EntrepotNonConfigureErreur);
	});
});

/* ═══════════════════════════════════ Le chemin ══════════════════════════ */

describe('le chemin est DÉRIVÉ de deux identifiants, et de rien d’autre', () => {
	it('la forme est la racine, la note, puis la pièce', () => {
		expect(cheminDUnePiece('/entrepot', NOTE, PIECE)).toBe(`/entrepot/${NOTE}/${PIECE}`);
		expect(dossierDUneNote('/entrepot', NOTE)).toBe(`/entrepot/${NOTE}`);
	});

	/* LA POLARITÉ QUI COMPTE. Ces quatre chaînes sont celles qu'un appelant
	   distrait — ou un attaquant — passerait en croyant nommer un fichier. Aucune
	   n'a la forme d'un UUID, donc aucune ne produit de chemin. Sans ces cas, la
	   garantie de l'en-tête du module serait une phrase (`P-5`). */
	for (const tentative of [
		'..',
		'../../etc/passwd',
		'/etc/passwd',
		'plan-de-reprise.pdf',
		'',
		`${NOTE}/../${NOTE}`
	]) {
		it(`« ${tentative} » ne produit AUCUN chemin`, () => {
			expect(() => cheminDUnePiece('/entrepot', tentative, PIECE)).toThrow(
				CheminNonDerivableErreur
			);
			expect(() => cheminDUnePiece('/entrepot', NOTE, tentative)).toThrow(CheminNonDerivableErreur);
		});
	}
});

/* ═══════════════════════════════════ Les octets ═════════════════════════ */

describe('les octets font l’aller-retour sans perte', () => {
	it('une image PNG réelle revient identique, octet par octet', async () => {
		const image = engendrerUneImagePng(24, 16);
		/* Le fichier est une image VALIDE : signature de tête, en-tête de
		   dimensions, données compressées, fin de fichier. La taille n'est pas
		   choisie, elle est comptée sur ce qui a été produit. */
		expect(image.length).toBeGreaterThan(60);
		expect([...image.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
		expect(TYPE_MEDIA_PNG).toBe('image/png');

		await ecrireLesOctets(racine, NOTE, PIECE, image);
		const relus = await lireLesOctets(racine, NOTE, PIECE);
		expect(relus).not.toBeNull();
		expect(relus === null ? [] : [...relus]).toEqual([...image]);
		expect(await tailleSurDisque(racine, NOTE, PIECE)).toBe(image.length);
	});

	it('des octets quelconques aussi, et l’engendrement est reproductible', async () => {
		const octets = engendrerDesOctets(5_000, 7);
		expect([...engendrerDesOctets(5_000, 7)]).toEqual([...octets]);
		expect([...engendrerDesOctets(5_000, 8)]).not.toEqual([...octets]);

		await ecrireLesOctets(racine, NOTE, AUTRE_PIECE, octets);
		const relus = await lireLesOctets(racine, NOTE, AUTRE_PIECE);
		expect(relus === null ? [] : [...relus]).toEqual([...octets]);
	});

	it('une pièce absente rend `null`, et une pièce présente rend ses octets', async () => {
		const jamaisEcrite = 'd0000000-0000-4000-8000-00000000000d';
		expect(await lireLesOctets(racine, NOTE, jamaisEcrite)).toBeNull();
		expect(await tailleSurDisque(racine, NOTE, jamaisEcrite)).toBeNull();
		expect(await lireLesOctets(racine, NOTE, PIECE)).not.toBeNull();
	});

	it('l’effacement rend vrai une fois, faux ensuite', async () => {
		const ephemere = 'e0000000-0000-4000-8000-00000000000e';
		await ecrireLesOctets(racine, NOTE, ephemere, engendrerDesOctets(32));
		expect(await effacerLesOctets(racine, NOTE, ephemere)).toBe(true);
		expect(await effacerLesOctets(racine, NOTE, ephemere)).toBe(false);
		expect(await lireLesOctets(racine, NOTE, ephemere)).toBeNull();
	});

	it('l’écriture ne laisse aucun fichier d’attente derrière elle', async () => {
		/* L'écriture passe par un nom voisin puis un renommage. Si le renommage
		   n'avait pas lieu, la place définitive serait vide ET le voisin resterait :
		   ce cas éprouve que le second n'existe plus. */
		const chemin = cheminDUnePiece(racine, NOTE, PIECE);
		const { stat } = await import('node:fs/promises');
		await expect(stat(`${chemin}.entrant`)).rejects.toThrow();
		await expect(stat(chemin)).resolves.toBeDefined();
	});

	it('un fichier TRONQUÉ se voit à sa taille — le cas que l’intégrité relève', async () => {
		/* Le cas SYNTHÉTIQUE de la divergence de taille (`P-26`) : il est fabriqué
		   ici, il ne dépend d'aucun état du dépôt, et il survit à toute correction
		   du produit. */
		const tronquee = 'f0000000-0000-4000-8000-00000000000f';
		const entier = engendrerDesOctets(1_000, 3);
		await ecrireLesOctets(racine, NOTE, tronquee, entier);
		await writeFile(cheminDUnePiece(racine, NOTE, tronquee), entier.subarray(0, 400));
		expect(await tailleSurDisque(racine, NOTE, tronquee)).toBe(400);
		expect(await tailleSurDisque(racine, NOTE, tronquee)).not.toBe(entier.length);
	});
});

/* ═══════════════════════════════════ La construction n° 10 ═════════════ */

describe('la construction n° 10 a désormais une SOURCE — M04.6', () => {
	it('une image engendrée, écrite, adressée par la route, et rendue dans un corps', async () => {
		/* Le cas est SYNTHÉTIQUE de bout en bout (`P-26`) : il ne lit ni base ni
		   corpus, et il survit à toute évolution du dépôt. Ce qu'il ne peut pas
		   prouver seul est la JONCTION entre l'adresse (identifiant lisible + nom)
		   et le chemin (deux UUID) : c'est une ligne en base qui la porte, et
		   l'essai `node base/base.mjs pieces` la mesure sur la base réelle. */
		const image = engendrerUneImagePng(12, 8);
		const piece = '10000000-0000-4000-8000-000000000010';
		await ecrireLesOctets(racine, NOTE, piece, image);

		const adresse = adresseDePieceJointe('n-restaurer-pg', 'schéma d’enchaînement.png');
		/* Le nom est encodé : il reste UN segment, ce que la route attend. */
		expect(adresse.split('/')).toHaveLength(5);
		expect(decodeURIComponent(adresse.split('/')[4] ?? '')).toBe('schéma d’enchaînement.png');

		const html = rendreDocument(gabaritDImage(adresse, 'Le schéma', 'Figure', null), {
			resoudre: () => null,
			contexte: 'interne'
		});
		expect(html).toContain(`src="${adresse}"`);

		const relus = await lireLesOctets(racine, NOTE, piece);
		expect(relus === null ? [] : [...relus]).toEqual([...image]);
	});
});

/* ═══════════════════════════════════ Le plafond ═════════════════════════ */

describe('le plafond de la console se convertit en octets, et refuse l’absurde', () => {
	it('le mégaoctet du produit est celui que le gel calcule', () => {
		/* `V-36:2878` divise par 1024 pour passer des Ko aux Mo. La valeur n'est
		   pas un choix d'implémenteur : si un regel adoptait le multiple SI, ce cas
		   rougirait, et c'est ce qu'on veut de lui. */
		expect(OCTETS_PAR_MO).toBe(1024 * 1024);
		expect(plafondEnOctets(1)).toBe(1_048_576);
		expect(plafondEnOctets(25)).toBe(26_214_400);
	});

	it('la borne haute de la maquette se convertit aussi', () => {
		/* `V-33:1353` borne la saisie à 500. */
		expect(plafondEnOctets(500)).toBe(500 * OCTETS_PAR_MO);
	});

	for (const absurde of [0, -1, 1.5, Number.NaN]) {
		it(`${String(absurde)} Mo n’est pas un plafond`, () => {
			expect(() => plafondEnOctets(absurde)).toThrow(RangeError);
		});
	}
});
