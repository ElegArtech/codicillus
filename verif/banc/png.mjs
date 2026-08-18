/**
 * Banc de comparaison visuelle — codec PNG minimal.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * POURQUOI PAS UNE BIBLIOTHÈQUE. Le banc mesure la conformité ; une dépendance
 * de plus dans la chaîne de mesure est une surface d'écart de plus, et une
 * mise à jour transitive peut déplacer un verdict sans qu'aucun code du dépôt
 * n'ait changé. Le sous-ensemble de PNG produit par Chromium — profondeur 8,
 * non entrelacé, type de couleur 2 ou 6 — tient en cent lignes de `zlib`.
 * Tout ce qui sort de ce sous-ensemble échoue bruyamment plutôt que d'être
 * deviné.
 */
import { inflateSync, deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Table CRC-32 du PNG (ISO 3309), calculée une fois. */
const TABLE_CRC = (() => {
	const table = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c;
	}
	return table;
})();

function crc32(buffer) {
	let c = -1;
	for (let i = 0; i < buffer.length; i++) c = TABLE_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
	return (c ^ -1) >>> 0;
}

/** Reconstruction d'une ligne filtrée — RFC 2083 §6. */
function defiltrer(type, ligne, precedente, octetsParPixel) {
	switch (type) {
		case 0:
			break;
		case 1:
			for (let i = octetsParPixel; i < ligne.length; i++)
				ligne[i] = (ligne[i] + ligne[i - octetsParPixel]) & 0xff;
			break;
		case 2:
			for (let i = 0; i < ligne.length; i++) ligne[i] = (ligne[i] + precedente[i]) & 0xff;
			break;
		case 3:
			for (let i = 0; i < ligne.length; i++) {
				const a = i >= octetsParPixel ? ligne[i - octetsParPixel] : 0;
				ligne[i] = (ligne[i] + ((a + precedente[i]) >> 1)) & 0xff;
			}
			break;
		case 4:
			for (let i = 0; i < ligne.length; i++) {
				const a = i >= octetsParPixel ? ligne[i - octetsParPixel] : 0;
				const b = precedente[i];
				const c = i >= octetsParPixel ? precedente[i - octetsParPixel] : 0;
				const p = a + b - c;
				const pa = Math.abs(p - a);
				const pb = Math.abs(p - b);
				const pc = Math.abs(p - c);
				const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
				ligne[i] = (ligne[i] + pred) & 0xff;
			}
			break;
		default:
			throw new Error(`PNG : type de filtre ${type} inconnu.`);
	}
}

/**
 * Décode un PNG en une image RGBA 8 bits.
 * @returns {{ largeur: number, hauteur: number, donnees: Buffer }} `donnees` fait
 *   `largeur * hauteur * 4` octets, dans l'ordre R, G, B, A.
 */
export function decoder(fichier) {
	if (!fichier.subarray(0, 8).equals(SIGNATURE)) throw new Error('PNG : signature absente.');

	let largeur = 0;
	let hauteur = 0;
	let profondeur = 0;
	let typeCouleur = 0;
	let entrelacement = 0;
	const morceaux = [];

	let position = 8;
	while (position < fichier.length) {
		const taille = fichier.readUInt32BE(position);
		const type = fichier.toString('ascii', position + 4, position + 8);
		const corps = fichier.subarray(position + 8, position + 8 + taille);
		if (type === 'IHDR') {
			largeur = corps.readUInt32BE(0);
			hauteur = corps.readUInt32BE(4);
			profondeur = corps[8];
			typeCouleur = corps[9];
			entrelacement = corps[12];
		} else if (type === 'IDAT') {
			morceaux.push(corps);
		} else if (type === 'IEND') {
			break;
		}
		position += 12 + taille;
	}

	if (profondeur !== 8)
		throw new Error(`PNG : profondeur ${profondeur} non gérée — le banc n'accepte que 8 bits.`);
	if (entrelacement !== 0) throw new Error('PNG : entrelacement Adam7 non géré.');
	const canaux = { 0: 1, 2: 3, 4: 2, 6: 4 }[typeCouleur];
	if (!canaux) throw new Error(`PNG : type de couleur ${typeCouleur} non géré.`);

	const brut = inflateSync(Buffer.concat(morceaux));
	const octetsParPixel = canaux;
	const octetsParLigne = largeur * octetsParPixel;
	const donnees = Buffer.alloc(largeur * hauteur * 4);
	let precedente = Buffer.alloc(octetsParLigne);

	for (let y = 0; y < hauteur; y++) {
		const debut = y * (octetsParLigne + 1);
		const type = brut[debut];
		const ligne = Buffer.from(brut.subarray(debut + 1, debut + 1 + octetsParLigne));
		defiltrer(type, ligne, precedente, octetsParPixel);
		for (let x = 0; x < largeur; x++) {
			const s = x * octetsParPixel;
			const d = (y * largeur + x) * 4;
			if (canaux === 1) {
				donnees[d] = donnees[d + 1] = donnees[d + 2] = ligne[s];
				donnees[d + 3] = 255;
			} else if (canaux === 2) {
				donnees[d] = donnees[d + 1] = donnees[d + 2] = ligne[s];
				donnees[d + 3] = ligne[s + 1];
			} else if (canaux === 3) {
				donnees[d] = ligne[s];
				donnees[d + 1] = ligne[s + 1];
				donnees[d + 2] = ligne[s + 2];
				donnees[d + 3] = 255;
			} else {
				ligne.copy(donnees, d, s, s + 4);
			}
		}
		precedente = ligne;
	}

	return { largeur, hauteur, donnees };
}

function morceau(type, corps) {
	const entete = Buffer.alloc(8);
	entete.writeUInt32BE(corps.length, 0);
	entete.write(type, 4, 'ascii');
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([entete.subarray(4), corps])), 0);
	return Buffer.concat([entete, corps, crc]);
}

/** Encode une image RGBA 8 bits en PNG, filtre 0 sur toutes les lignes. */
export function encoder({ largeur, hauteur, donnees }) {
	const brut = Buffer.alloc(hauteur * (largeur * 4 + 1));
	for (let y = 0; y < hauteur; y++) {
		brut[y * (largeur * 4 + 1)] = 0;
		donnees.copy(brut, y * (largeur * 4 + 1) + 1, y * largeur * 4, (y + 1) * largeur * 4);
	}
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(largeur, 0);
	ihdr.writeUInt32BE(hauteur, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	return Buffer.concat([
		SIGNATURE,
		morceau('IHDR', ihdr),
		morceau('IDAT', deflateSync(brut, { level: 6 })),
		morceau('IEND', Buffer.alloc(0))
	]);
}

/** Image RGBA uniforme, aux dimensions données. */
export function image(largeur, hauteur, [r, v, b, a] = [255, 255, 255, 255]) {
	const donnees = Buffer.alloc(largeur * hauteur * 4);
	for (let i = 0; i < donnees.length; i += 4) {
		donnees[i] = r;
		donnees[i + 1] = v;
		donnees[i + 2] = b;
		donnees[i + 3] = a;
	}
	return { largeur, hauteur, donnees };
}

/** Recopie `source` dans `cible` à la position (x, y). */
export function coller(cible, source, x, y) {
	for (let l = 0; l < source.hauteur; l++) {
		const dy = y + l;
		if (dy < 0 || dy >= cible.hauteur) continue;
		const largeurUtile = Math.min(source.largeur, cible.largeur - x);
		if (largeurUtile <= 0) continue;
		source.donnees.copy(
			cible.donnees,
			(dy * cible.largeur + x) * 4,
			l * source.largeur * 4,
			(l * source.largeur + largeurUtile) * 4
		);
	}
	return cible;
}
