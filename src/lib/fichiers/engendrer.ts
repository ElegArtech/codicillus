/**
 * ENGENDRER DES OCTETS RÉELS — pour les épreuves, et pour elles seules.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE MODULE EXISTE, ET POURQUOI IL N'EST PAS UNE VALEUR ILLUSTRATIVE
 *
 * `T-049` a mesuré le vrai blocage des pièces jointes du gel, et il est plus
 * étroit qu'un manque de noms : le gel écrit « 1,2 Mo » et « 18 Ko »
 * (`V-14:1836`, `:1840`), or `taille_octets` veut un NOMBRE. « 1,2 Mo » n'en
 * désigne pas un, il en désigne un intervalle. Recopier 1 258 291 depuis ce
 * libellé serait la valeur illustrative que `P-02` proscrit — et c'est le geste
 * que `T-030b` puis `T-049` ont refusé, à raison.
 *
 * Ce module fait l'inverse exact. Il ENGENDRE un contenu, et la taille n'est
 * plus une valeur écrite : c'est le nombre d'octets réellement produits, mesuré
 * sur le tableau rendu. Aucun chiffre du gel n'y entre, aucun chiffre n'en sort
 * qu'on n'ait pas compté.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL SERT, ET CE QU'IL NE SERT PAS
 *
 * Il sert les ÉPREUVES : les unitaires de l'entrepôt, et la commande de base qui
 * dépose une pièce puis la ressert par le chemin de `RG-M04-08`. Une règle
 * qu'aucun cas n'exerce est une règle qu'on espère (`P-5`), et la branche
 * « pièce servie » n'est exercée par AUCUN état du dépôt : la table compte zéro
 * ligne, et elle en comptera zéro tant que le gel ne donnera pas ses treize
 * pièces en données.
 *
 * Il ne sert PAS la semence, et il ne doit pas. Semer une pièce engendrée
 * porterait en base une taille qui contredit celle que la maquette affiche à
 * côté : le corpus cesserait d'être le corpus du gel. Ce module produit des
 * octets pour un ESSAI qui se retire après lui, jamais pour le jeu de
 * démonstration.
 */
import { crc32, deflateSync } from 'node:zlib';

/* ═══════════════════════════════════ Des octets quelconques ═════════════ */

/**
 * Une suite d'octets déterministe de longueur exacte. Le générateur est un
 * congruentiel linéaire trivial : ce qu'on veut de lui, c'est d'être reproductible
 * d'une exécution à l'autre — un tirage aléatoire ferait varier le contenu sans
 * rien apporter, et une comparaison d'octets ne pourrait plus être rejouée.
 *
 * @param combien le nombre d'octets voulu
 * @param graine la graine du générateur
 */
export function engendrerDesOctets(combien: number, graine = 1): Uint8Array {
	if (!Number.isInteger(combien) || combien < 0) {
		throw new RangeError(`nombre d’octets non exploitable : ${String(combien)}`);
	}
	const octets = new Uint8Array(combien);
	let etat = graine >>> 0 || 1;
	for (let i = 0; i < combien; i += 1) {
		etat = (etat * 1_103_515_245 + 12_345) >>> 0;
		octets[i] = (etat >>> 16) & 0xff;
	}
	return octets;
}

/* ═══════════════════════════════════ Une image réelle ═══════════════════ */

/** La signature de tête d'un fichier PNG — huit octets, invariables. */
const SIGNATURE_PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function entierSurQuatreOctets(valeur: number): Uint8Array {
	const quatre = new Uint8Array(4);
	new DataView(quatre.buffer).setUint32(0, valeur >>> 0, false);
	return quatre;
}

function concatener(morceaux: readonly Uint8Array[]): Uint8Array {
	const total = morceaux.reduce((s, m) => s + m.length, 0);
	const tout = new Uint8Array(total);
	let curseur = 0;
	for (const m of morceaux) {
		tout.set(m, curseur);
		curseur += m.length;
	}
	return tout;
}

/**
 * Un fragment PNG : longueur, type, données, et somme de contrôle. La somme est
 * CALCULÉE (`node:zlib`), pas recopiée : une image dont le CRC serait faux
 * serait refusée par tout décodeur, et l'épreuve prouverait alors le contraire
 * de ce qu'elle annonce.
 */
function fragment(type: string, donnees: Uint8Array): Uint8Array {
	const nom = new TextEncoder().encode(type);
	const corps = concatener([nom, donnees]);
	return concatener([
		entierSurQuatreOctets(donnees.length),
		corps,
		entierSurQuatreOctets(crc32(corps))
	]);
}

/**
 * Une image PNG VALIDE, en niveaux de gris, engendrée pixel par pixel.
 *
 * Le contenu est un dégradé calculé sur les coordonnées : il n'illustre rien, il
 * remplit. Ce qui compte est que le fichier soit une image réelle — signature,
 * en-tête, données compressées, fin de fichier, sommes de contrôle justes —,
 * pour que la construction n° 10 de `M04.6` soit productible de bout en bout sur
 * une source qui existe vraiment.
 *
 * @param largeur en pixels
 * @param hauteur en pixels
 */
export function engendrerUneImagePng(largeur: number, hauteur: number): Uint8Array {
	if (!Number.isInteger(largeur) || !Number.isInteger(hauteur) || largeur < 1 || hauteur < 1) {
		throw new RangeError(`dimensions non exploitables : ${String(largeur)}×${String(hauteur)}`);
	}

	/* Largeur, hauteur, 8 bits par échantillon, type 0 (niveaux de gris),
	   compression 0, filtre 0, entrelacement 0 — les seules valeurs que la
	   spécification autorise pour cette combinaison. */
	const enTete = concatener([
		entierSurQuatreOctets(largeur),
		entierSurQuatreOctets(hauteur),
		Uint8Array.from([8, 0, 0, 0, 0])
	]);

	/* Chaque ligne de pixels est précédée de son octet de filtre, à zéro. */
	const brut = new Uint8Array(hauteur * (1 + largeur));
	for (let y = 0; y < hauteur; y += 1) {
		const debut = y * (1 + largeur);
		brut[debut] = 0;
		for (let x = 0; x < largeur; x += 1) {
			brut[debut + 1 + x] = (x * 7 + y * 11) & 0xff;
		}
	}

	return concatener([
		SIGNATURE_PNG,
		fragment('IHDR', enTete),
		fragment('IDAT', new Uint8Array(deflateSync(brut))),
		fragment('IEND', new Uint8Array(0))
	]);
}

/** Le type de média d'un PNG, tel que la route le rendra en tête de réponse. */
export const TYPE_MEDIA_PNG = 'image/png';
