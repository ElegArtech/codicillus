/**
 * L'ENVELOPPE DE L'ARCHIVE — écriture et lecture d'un fichier ZIP.
 *
 * `mockups/V-36-console-exports.html:3061` nomme le fichier téléchargé, et son
 * suffixe est celui d'un ZIP : c'est le gel qui fixe le format d'enveloppe,
 * pas ce module. Ce module ne fait que l'écrire — et le relire, parce que
 * `RG-M13-01` demande que « réimporter l'archive produite reconstitue le
 * domaine à l'identique » : une écriture qu'aucune lecture ne rouvre ne prouve
 * rien.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ÉCRIT ICI, ET NON PAR UNE BIBLIOTHÈQUE
 *
 * `cadrage/STACK-TECHNIQUE.md` §3 épingle les dépendances, et aucune n'écrit
 * d'archive. Le contrat du lot interdit d'en installer une (`P-16`, `P-24` :
 * `node_modules` est un lien vers l'arbre voisin, et un `pnpm add` dans une
 * copie de travail écrit chez le lot d'à côté). L'enveloppe est donc écrite
 * avec `node:zlib`, qui est du runtime imposé — pas une dépendance de plus.
 *
 * Ce module NE CONVERTIT RIEN : il ne connaît ni le format canonique, ni le
 * Markdown. Il transporte des octets nommés. `ADR-004` n'est donc pas en cause
 * ici, et `verif:convertisseur` n'a rien à y voir.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DÉTERMINISME EST UNE EXIGENCE, PAS UN CONFORT
 *
 * `STACK-TECHNIQUE.md` l. 461 (`R-05`) : « un aller-retour non idempotent fait
 * échouer la construction ». La propriété éprouvée par le lot est plus forte
 * que la simple relecture : exporter, réimporter, réexporter rend LES MÊMES
 * OCTETS. Or l'horodatage d'une entrée ZIP suffirait à la casser.
 *
 * Les entrées portent donc toutes le MÊME instant, et c'est le plus ancien que
 * le format sache écrire — le format MS-DOS ne descend pas sous le 1er janvier
 * 1980. Ce n'est pas une valeur illustrative au sens de `P-02` : ce n'est pas
 * une donnée du produit affichée à un utilisateur, c'est un champ d'enveloppe
 * que rien ne lit. Les dates du produit — création, modification, dernière
 * vérification — sont dans l'en-tête de métadonnées de chaque note, où elles
 * viennent de la base et de nulle part ailleurs.
 *
 * L'ORDRE DES ENTRÉES EST CELUI QU'ON DONNE, et il est conservé à la relecture.
 * C'est lui qui porte l'ordre des dossiers frères — voir `archive.ts`.
 */
import { deflateRawSync, inflateRawSync } from 'node:zlib';

/** Une entrée d'archive : un nom de chemin, et des octets. */
export interface EntreeDeZip {
	/** Le chemin dans l'archive, séparé par des barres obliques. */
	readonly chemin: string;
	/** Les octets. Un dossier en porte zéro et son chemin finit par le séparateur. */
	readonly octets: Uint8Array;
}

/** Le séparateur de chemin du format ZIP — il n'y en a qu'un, et c'est le sien. */
export const SEPARATEUR_DE_CHEMIN_DE_ZIP = '/';

/** Le type de média du fichier produit, pour l'en-tête de la réponse. */
export const TYPE_MEDIA_DE_ZIP = 'application/zip';

/* ═════════════════════════════════════════════════ Les constantes ═══════ */

const SIGNATURE_LOCALE = 0x04034b50;
const SIGNATURE_CENTRALE = 0x02014b50;
const SIGNATURE_DE_FIN = 0x06054b50;

/** Version minimale du lecteur : 2.0, celle qui sait dégonfler. */
const VERSION_REQUISE = 20;

/** Bit 11 du drapeau général : les noms sont en UTF-8. */
const DRAPEAU_UTF8 = 0x800;

const METHODE_BRUTE = 0;
const METHODE_DEGONFLEE = 8;

/** Le 1er janvier 1980, en date et heure MS-DOS. Voir le déterminisme, plus haut. */
const DATE_DOS = 0x0021;
const HEURE_DOS = 0x0000;

const TAILLE_ENTETE_LOCAL = 30;
const TAILLE_ENTREE_CENTRALE = 46;
const TAILLE_FIN = 22;

/* ═════════════════════════════════════════════════════ La somme ═════════ */

/** La table de la somme de contrôle cyclique, calculée une fois. */
const TABLE_CRC = ((): Uint32Array => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

/** La somme de contrôle cyclique d'un bloc d'octets, telle que le format l'exige. */
export function sommeDeControle(octets: Uint8Array): number {
	let c = 0xffffffff;
	for (const o of octets) c = (TABLE_CRC[(c ^ o) & 0xff] as number) ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

/* ═════════════════════════════════════════════════════ L'écriture ═══════ */

/** Un défaut d'enveloppe. La lecture ne devine jamais. */
export class ZipInvalide extends Error {
	constructor(message: string) {
		super('archive illisible : ' + message);
		this.name = 'ZipInvalide';
	}
}

interface EntreePreparee {
	readonly nom: Uint8Array;
	readonly methode: number;
	readonly somme: number;
	readonly comprime: Uint8Array;
	readonly brut: number;
	readonly decalage: number;
}

/**
 * Écrit l'archive. Les entrées sortent dans l'ordre reçu, et un dossier est une
 * entrée vide dont le chemin finit par le séparateur.
 */
export function ecrireZip(entrees: readonly EntreeDeZip[]): Uint8Array<ArrayBuffer> {
	const preparees: EntreePreparee[] = [];
	const morceaux: Uint8Array[] = [];
	let decalage = 0;

	for (const entree of entrees) {
		const nom = Buffer.from(entree.chemin, 'utf8');
		const brut = entree.octets;
		/* Un dossier et un fichier vide n'ont rien à dégonfler ; le dégonflage
		   d'un bloc vide produirait deux octets pour zéro information. */
		const degonfle = brut.length === 0 ? null : new Uint8Array(deflateRawSync(brut, { level: 9 }));
		const gagne = degonfle !== null && degonfle.length < brut.length;
		const comprime = gagne && degonfle !== null ? degonfle : brut;
		const methode = gagne ? METHODE_DEGONFLEE : METHODE_BRUTE;
		const somme = sommeDeControle(brut);

		const entete = Buffer.alloc(TAILLE_ENTETE_LOCAL);
		entete.writeUInt32LE(SIGNATURE_LOCALE, 0);
		entete.writeUInt16LE(VERSION_REQUISE, 4);
		entete.writeUInt16LE(DRAPEAU_UTF8, 6);
		entete.writeUInt16LE(methode, 8);
		entete.writeUInt16LE(HEURE_DOS, 10);
		entete.writeUInt16LE(DATE_DOS, 12);
		entete.writeUInt32LE(somme, 14);
		entete.writeUInt32LE(comprime.length, 18);
		entete.writeUInt32LE(brut.length, 22);
		entete.writeUInt16LE(nom.length, 26);
		entete.writeUInt16LE(0, 28);

		morceaux.push(entete, nom, comprime);
		preparees.push({ nom, methode, somme, comprime, brut: brut.length, decalage });
		decalage += entete.length + nom.length + comprime.length;
	}

	const debutDuCentral = decalage;
	let tailleDuCentral = 0;
	for (const p of preparees) {
		const central = Buffer.alloc(TAILLE_ENTREE_CENTRALE);
		central.writeUInt32LE(SIGNATURE_CENTRALE, 0);
		central.writeUInt16LE(VERSION_REQUISE, 4);
		central.writeUInt16LE(VERSION_REQUISE, 6);
		central.writeUInt16LE(DRAPEAU_UTF8, 8);
		central.writeUInt16LE(p.methode, 10);
		central.writeUInt16LE(HEURE_DOS, 12);
		central.writeUInt16LE(DATE_DOS, 14);
		central.writeUInt32LE(p.somme, 16);
		central.writeUInt32LE(p.comprime.length, 20);
		central.writeUInt32LE(p.brut, 24);
		central.writeUInt16LE(p.nom.length, 28);
		central.writeUInt16LE(0, 30);
		central.writeUInt16LE(0, 32);
		central.writeUInt16LE(0, 34);
		central.writeUInt16LE(0, 36);
		central.writeUInt32LE(0, 38);
		central.writeUInt32LE(p.decalage, 42);
		morceaux.push(central, p.nom);
		tailleDuCentral += central.length + p.nom.length;
	}

	const fin = Buffer.alloc(TAILLE_FIN);
	fin.writeUInt32LE(SIGNATURE_DE_FIN, 0);
	fin.writeUInt16LE(0, 4);
	fin.writeUInt16LE(0, 6);
	fin.writeUInt16LE(preparees.length, 8);
	fin.writeUInt16LE(preparees.length, 10);
	fin.writeUInt32LE(tailleDuCentral, 12);
	fin.writeUInt32LE(debutDuCentral, 16);
	fin.writeUInt16LE(0, 20);
	morceaux.push(fin);

	/* Le tampon est recopié dans un tableau au tampon NON PARTAGEABLE : c'est ce
	   que `BodyInit` exige d'une réponse HTTP, et l'exiger ici évite une
	   assertion de type au point de service. */
	const tout = Buffer.concat(morceaux);
	const sortie = new Uint8Array(tout.length);
	sortie.set(tout);
	return sortie;
}

/* ═════════════════════════════════════════════════════ La lecture ═══════ */

/**
 * Relit l'archive par son répertoire central — jamais en devinant sur les
 * en-têtes locaux. L'ordre rendu est celui du répertoire, c'est-à-dire l'ordre
 * d'écriture.
 */
export function lireZip(octets: Uint8Array): readonly EntreeDeZip[] {
	const vue = Buffer.from(octets.buffer, octets.byteOffset, octets.byteLength);
	const finTrouvee = chercherLaFin(vue);
	const nombre = vue.readUInt16LE(finTrouvee + 10);
	let position = vue.readUInt32LE(finTrouvee + 16);

	const entrees: EntreeDeZip[] = [];
	for (let i = 0; i < nombre; i += 1) {
		if (vue.readUInt32LE(position) !== SIGNATURE_CENTRALE) {
			throw new ZipInvalide('entrée centrale ' + String(i) + ' sans signature');
		}
		const methode = vue.readUInt16LE(position + 10);
		const somme = vue.readUInt32LE(position + 16);
		const tailleComprimee = vue.readUInt32LE(position + 20);
		const tailleBrute = vue.readUInt32LE(position + 24);
		const tailleDuNom = vue.readUInt16LE(position + 28);
		const tailleDesExtras = vue.readUInt16LE(position + 30);
		const tailleDuCommentaire = vue.readUInt16LE(position + 32);
		const decalage = vue.readUInt32LE(position + 42);
		const chemin = vue.toString('utf8', position + 46, position + 46 + tailleDuNom);

		if (vue.readUInt32LE(decalage) !== SIGNATURE_LOCALE) {
			throw new ZipInvalide('entrée locale de « ' + chemin + ' » sans signature');
		}
		const nomLocal = vue.readUInt16LE(decalage + 26);
		const extrasLocaux = vue.readUInt16LE(decalage + 28);
		const debut = decalage + TAILLE_ENTETE_LOCAL + nomLocal + extrasLocaux;
		const charge = vue.subarray(debut, debut + tailleComprimee);
		const brut =
			methode === METHODE_BRUTE ? new Uint8Array(charge) : new Uint8Array(inflateRawSync(charge));

		if (brut.length !== tailleBrute) {
			throw new ZipInvalide('taille annoncée non tenue sur « ' + chemin + ' »');
		}
		if (sommeDeControle(brut) !== somme) {
			throw new ZipInvalide('somme de contrôle non tenue sur « ' + chemin + ' »');
		}

		entrees.push({ chemin, octets: brut });
		position += TAILLE_ENTREE_CENTRALE + tailleDuNom + tailleDesExtras + tailleDuCommentaire;
	}
	return entrees;
}

/** Le bloc de fin, cherché depuis la queue : c'est la seule façon de le trouver. */
function chercherLaFin(vue: Buffer): number {
	for (let i = vue.length - TAILLE_FIN; i >= 0; i -= 1) {
		if (vue.readUInt32LE(i) === SIGNATURE_DE_FIN) return i;
	}
	throw new ZipInvalide('bloc de fin absent');
}
