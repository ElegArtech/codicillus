/**
 * `/notes/{identifiant}/pieces-jointes/{fichier}` — LA PIÈCE JOINTE, SERVIE
 * DERRIÈRE UN CONTRÔLE D'ACCÈS.
 *
 * `docs/routes.md:146` : « connecté + lecteur DE LA NOTE PORTEUSE », et la
 * colonne des sources renvoie à `RG-M04-08` — « une pièce jointe d'une note
 * interne n'est jamais servie en anonyme » —, avec cette précision qui décide
 * de tout : « le contrôle porte sur la NOTE, pas sur le fichier ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI C'EST UNE ROUTE, ET JAMAIS UN FICHIER STATIQUE
 *
 * `STACK-TECHNIQUE.md` §4.7 range les pièces jointes parmi les ressources
 * « servies par une route qui revérifie la visibilité de la note porteuse —
 * jamais en fichier statique ». Un fichier servi par le frontal ne rejouerait
 * aucun droit : une note passée d'interne à publique — ou l'inverse — changerait
 * la visibilité de ses pièces sans que rien ne le sache, et une adresse devinée
 * rapporterait un contenu interdit, ce que `RG-ACC-01` refuse.
 *
 * La visibilité est donc RÉSOLUE À CHAQUE REQUÊTE, par la même composition que
 * la lecture d'une note : périmètre injecté dans le `where` (`ADR-006`), puis
 * `noteLisible()` en garde-fou, puis sortie unique par `INTROUVABLE`
 * (`RG-ACC-04`). Aucune règle de droit n'est écrite ici.
 *
 * ET LE CHEMIN DES OCTETS N'EST FORMABLE QU'APRÈS. L'entrepôt ne stocke aucun
 * chemin : il le dérive des deux clés que la résolution rapporte
 * (`src/lib/fichiers/entrepot.ts`). Un appelant qui n'a pas franchi la
 * résolution n'a donc pas de chemin — la garantie n'est pas un contrôle de plus,
 * c'est la forme du code.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS SORTIES, ET CE QUE CHACUNE DIT
 *
 *   404 — la pièce n'existe pas, OU la note porteuse n'est pas lisible par
 *         l'appelant. Le même octet dans les deux cas, par le même chemin de
 *         code : c'est `ADR-007`, et c'est ce que la matrice de la batterie 6
 *         mesure. Aucune branche ne les distingue ici, et il n'y en a pas
 *         ailleurs — `pieceJointeResolue()` rend `INTROUVABLE` pour les deux.
 *
 *   200 — les octets, avec leur type de média, leur longueur et leur nom
 *         d'origine. Cette sortie est celle que `T-050` avait laissée en 501
 *         « faute d'octets » : le produit ne stockait aucun fichier. `T-026` a
 *         posé l'entrepôt ; la branche est ici PROLONGÉE, pas réécrite.
 *
 *   500 — la ligne est en base, l'appelant y a droit, et l'entrepôt ne porte pas
 *         les octets. CE N'EST PAS UN CAS D'`ADR-007` : l'appelant a déjà
 *         franchi la résolution, il SAIT que la pièce existe, et lui rendre 404
 *         cacherait une panne d'exploitation derrière un « rien à voir ». La
 *         distinction ne fuit rien — elle n'est atteignable que par quelqu'un
 *         qui a le droit. Elle est le symptôme d'une restauration désaccordée
 *         (base rendue sans son volume, `RG-NF-09`), et `verifierLesPiecesJointes()`
 *         la relève en masse.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX EN-TÊTES QUI SONT DES DÉCISIONS, ET LEUR SOURCE
 *
 * LA DISPOSITION. `M04.7` (CDC:611) décrit le panneau des pièces d'une note
 * comme « liste des fichiers, taille, type, TÉLÉCHARGEMENT » : une pièce se
 * télécharge, donc `attachment`, avec son nom d'origine. Mais `M04.6` compte
 * l'IMAGE parmi les quinze constructions d'un corps, et une image de corps
 * s'affiche à sa place — son adresse est cette même route. Les images sont donc
 * servies `inline`, tout le reste `attachment`. Les deux moitiés de la règle
 * sortent de la CDC ; aucune n'est un goût d'implémenteur.
 *
 * LE TYPE DE MÉDIA N'EST JAMAIS DEVINÉ, et il n'est jamais renégocié : c'est
 * celui que la base porte. Le refus de reniflement l'accompagne — un fichier
 * dont le type annoncé serait faux ne doit pas être réinterprété par le
 * navigateur, sans quoi le type déclaré en base cesserait d'être la vérité.
 *
 * PAS DE CACHE PARTAGÉ. Une pièce de note interne est du contenu interne, et sa
 * visibilité est revérifiée à chaque requête : la mettre en cache partagé
 * annulerait la revérification pour tous les appelants suivants — c'est-à-dire
 * rendrait `RG-M04-08` inopérante par un en-tête. Même raison, mot pour mot, que
 * l'archive d'export (`/console/exports/…`).
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
