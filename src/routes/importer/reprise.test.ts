/**
 * LE VERDICT DE L'APERÇU, ÉPROUVÉ SUR UN PLAN QUE `classerLeLot()` A PRODUIT.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LE PLAN N'EST PAS ÉCRIT À LA MAIN
 *
 * Un contrôle qui fabrique lui-même l'entrée qu'il éprouve ne prouve rien de la
 * forme réelle de cette entrée : le dépôt en porte le précédent, un cas de
 * collision d'identifiant resté vert pendant que le produit rendait 500, parce
 * qu'il simulait l'erreur au lieu de la provoquer. Ici, les lignes viennent donc
 * du CLASSEMENT LUI-MÊME — identifiants, segments et sorts compris —, et le
 * verdict est confronté à ce que le classement a réellement décidé : un
 * identifiant REPRIS tel quel est une mise à jour, un identifiant SUFFIXÉ est
 * une création. C'est la conséquence observable de la même règle, lue à sa
 * source plutôt que réaffirmée.
 */
import { describe, expect, it } from 'vitest';
import {
	classerLeLot,
	clePlaceEtTitre,
	SERVICE_INJOIGNABLE,
	type ResultatDeConversion
} from '../../lib/donnees/import';
import { estUneMiseAJour } from './reprise';

/** Ce que la cible porte déjà : identifiant de note, et chemin sous la cible. */
const DANS_LA_CIBLE = new Map<string, string>([
	/* Redéposée AU MÊME ENDROIT — l'écriture sera une mise à jour. */
	['consignes', 'Exploitation'],
	/* Un homonyme, mais rangé AILLEURS — `RG-M12-11` en fera une création. */
	['adressage', 'Archives/2024']
]);

const plan = classerLeLot(
	'épreuve',
	[
		{ chemin: 'Exploitation/Consignes.md', octets: 42, texte: 'De nuit.', binaire: null },
		{ chemin: 'Reseau/Adressage.txt', octets: 42, texte: 'Plan.', binaire: null },
		{ chemin: 'Reseau/Fibres.txt', octets: 42, texte: 'Liens.', binaire: null }
	],
	{
		service: SERVICE_INJOIGNABLE,
		conversions: new Map<string, ResultatDeConversion>(),
		/* Ce que la base porte déjà, comme `identifiantsPris()` le rend : les deux
		   identifiants de la cible en font partie. */
		identifiantsPris: new Set(DANS_LA_CIBLE.keys()),
		notesDeLaCible: DANS_LA_CIBLE,
		profondeurDeDepart: 1
	}
);

function ligne(chemin: string) {
	const trouvee = plan.lignes.find((l) => l.chemin === chemin);
	if (trouvee === undefined) throw new Error(`ligne absente du plan : ${chemin}`);
	return trouvee;
}

describe('le verdict de l’aperçu — création ou mise à jour', () => {
	it('suit la reprise d’identifiant que le classement a décidée', () => {
		/* La preuve que le classement a bien REPRIS : l'identifiant n'est pas
		   suffixé, alors qu'il était déjà pris. */
		expect(ligne('Exploitation/Consignes.md').identifiant).toBe('consignes');
		expect(estUneMiseAJour(ligne('Exploitation/Consignes.md'), DANS_LA_CIBLE)).toBe(true);
	});

	it('ne prend pas un homonyme rangé ailleurs pour une reprise', () => {
		/* La preuve que le classement a bien REFUSÉ la reprise : il a suffixé. */
		expect(ligne('Reseau/Adressage.txt').identifiant).toBe('adressage-2');
		expect(estUneMiseAJour(ligne('Reseau/Adressage.txt'), DANS_LA_CIBLE)).toBe(false);
	});

	it('tient une note qu’aucune ligne de la cible ne connaît pour une création', () => {
		expect(estUneMiseAJour(ligne('Reseau/Fibres.txt'), DANS_LA_CIBLE)).toBe(false);
	});

	it('ne dit rien d’une ligne sans identifiant — un fichier écarté n’est pas une note', () => {
		expect(estUneMiseAJour({ identifiant: null, segments: ['Exploitation'] }, DANS_LA_CIBLE)).toBe(
			false
		);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   LE LOT REJOUÉ — `RG-M12-01`, ET LE CAS QUE L'IDENTIFIANT SEUL NE VOYAIT PAS

   Deux fichiers homonymes rangés à deux endroits : le second reçoit un
   identifiant SUFFIXÉ, que son titre ne redonne pas. Au réimport, il ne se
   reconnaissait dans aucune ligne de la cible et repartait en création — le lot
   rejoué doublait ses notes homonymes. La reconnaissance passe donc aussi par la
   PLACE ET LE TITRE, et c'est ce que ce cas épingle.
   ═══════════════════════════════════════════════════════════════════════════ */

const LOT_HOMONYME = [
	{ chemin: 'Hermes/Offre.md', octets: 42, texte: 'Un.', binaire: null },
	{ chemin: 'Olifan/Offre.md', octets: 42, texte: 'Deux.', binaire: null }
];

const premier = classerLeLot('épreuve', LOT_HOMONYME, {
	service: SERVICE_INJOIGNABLE,
	conversions: new Map<string, ResultatDeConversion>(),
	identifiantsPris: new Set<string>(),
	profondeurDeDepart: 1
});

/* Ce que la base porte APRÈS ce premier lot, dans les deux formes que le
   chargeur en tire — identifiant vers place, place et titre vers identifiant. */
const apresLePremier = new Map<string, string>();
const apresLePremierParPlace = new Map<string, string>();
for (const l of premier.lignes) {
	if (l.identifiant === null) continue;
	apresLePremier.set(l.identifiant, l.segments.join('/'));
	apresLePremierParPlace.set(clePlaceEtTitre(l.segments, l.titre ?? ''), l.identifiant);
}

const second = classerLeLot('épreuve', LOT_HOMONYME, {
	service: SERVICE_INJOIGNABLE,
	conversions: new Map<string, ResultatDeConversion>(),
	identifiantsPris: new Set(apresLePremier.keys()),
	notesDeLaCible: apresLePremier,
	notesParPlaceEtTitre: apresLePremierParPlace,
	profondeurDeDepart: 1
});

describe('le même lot rejoué ne crée pas une seconde fois', () => {
	it('le premier lot suffixe l’homonyme rangé ailleurs', () => {
		expect(premier.lignes.map((l) => l.identifiant)).toEqual(['offre', 'offre-2']);
	});

	it('le second lot REPREND les deux, suffixe compris', () => {
		expect(second.lignes.map((l) => l.identifiant)).toEqual(['offre', 'offre-2']);
		for (const l of second.lignes) expect(estUneMiseAJour(l, apresLePremier)).toBe(true);
	});
});
