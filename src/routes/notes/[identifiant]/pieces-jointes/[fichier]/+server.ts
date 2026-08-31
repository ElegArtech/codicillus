/**
 * `/notes/{identifiant}/pieces-jointes/{fichier}` — LA PIÈCE JOINTE, SERVIE DERRIÈRE UN
 * CONTRÔLE D'ACCÈS. « Connecté + lecteur DE LA NOTE PORTEUSE », et `RG-M04-08` — « une
 * pièce jointe d'une note interne n'est jamais servie en anonyme » —, avec cette
 * précision qui décide de tout : LE CONTRÔLE PORTE SUR LA NOTE, PAS SUR LE FICHIER.
 *
 * POURQUOI C'EST UNE ROUTE, ET JAMAIS UN FICHIER STATIQUE : un fichier servi par le
 * frontal ne rejouerait aucun droit, et une note passée d'interne à publique changerait
 * la visibilité de ses pièces sans que rien ne le sache (`RG-ACC-01`). La visibilité est
 * RÉSOLUE À CHAQUE REQUÊTE — périmètre injecté dans le `where` (`ADR-006`),
 * `noteLisible()` en garde-fou, sortie unique par `INTROUVABLE` —, et LE CHEMIN DES
 * OCTETS N'EST FORMABLE QU'APRÈS : l'entrepôt le dérive des deux clés que la résolution
 * rapporte, de sorte que la garantie est la forme du code.
 *
 * TROIS SORTIES : 404 pour une pièce absente COMME pour une note illisible — le même
 * octet ; 200 pour les octets ; 500 quand la ligne est en base, l'appelant y a droit, et
 * l'entrepôt ne porte pas les octets — CE N'EST PAS UN CAS D'`ADR-007`.
 *
 * LES IMAGES SONT SERVIES `inline`, TOUT LE RESTE `attachment` : `M04.7` décrit un
 * panneau de TÉLÉCHARGEMENT, mais `M04.6` compte l'IMAGE parmi les constructions d'un
 * corps. LE TYPE DE MÉDIA N'EST JAMAIS DEVINÉ, et le refus de reniflement l'accompagne.
 * PAS DE CACHE PARTAGÉ : il rendrait `RG-M04-08` inopérante par un en-tête.
 */
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { basePartagee } from '$lib/base/acces';
import { resoudreUnePieceJointe } from '$lib/donnees/edition';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { lireLesOctets, racineDesFichiers } from '$lib/fichiers/entrepot';
import type { RequestHandler } from './$types';

/** Le groupe de types de média qui s'affichent à leur place dans un corps. */
const PREFIXE_DES_IMAGES = 'image/';

export const GET: RequestHandler = async ({ params, locals }) => {
	const resolue = await resoudreUnePieceJointe(basePartagee(), {
		identifiant: params.identifiant,
		fichier: params.fichier,
		identite: locals.identite
	});
	if (!resolue.trouve) error(404, MESSAGE_INTROUVABLE);
	const piece = resolue.ressource;

	const octets = await lireLesOctets(racineDesFichiers(env), piece.noteId, piece.id);
	if (octets === null) {
		error(
			500,
			'les octets de cette pièce jointe ne sont pas dans l’entrepôt : sa ligne existe ' +
				'en base, son fichier non. La base et le volume des fichiers sont les deux ' +
				'éléments de la sauvegarde (RG-NF-09) et ils sont ici désaccordés.'
		);
	}

	const enLigne = piece.typeMedia.startsWith(PREFIXE_DES_IMAGES);
	return new Response(octets, {
		status: 200,
		headers: new Headers({
			'content-type': piece.typeMedia,
			'content-length': String(octets.length),
			/* Le nom est porté par la forme étendue de l'en-tête, celle qui déclare
			   son encodage : un nom accentué ou espacé y voyage sans perte, là où
			   la forme simple ne porte que de l'ASCII. */
			'content-disposition':
				(enLigne ? 'inline' : 'attachment') + "; filename*=UTF-8''" + encodeURIComponent(piece.nom),
			'x-content-type-options': 'nosniff',
			'cache-control': 'no-store'
		})
	});
};
