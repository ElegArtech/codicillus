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
 * `STACK-TECHNIQUE.md:103-105` range les pièces jointes dans un volume local,
 * « servies DERRIÈRE UN CONTRÔLE D'ACCÈS ». Un fichier servi par le frontal ne
 * rejouerait aucun droit : une note passée d'interne à publique — ou l'inverse —
 * changerait la visibilité de ses pièces sans que rien ne le sache, et une
 * adresse devinée rapporterait un contenu interdit, ce que `RG-ACC-01` refuse.
 *
 * La visibilité est donc RÉSOLUE À CHAQUE REQUÊTE, par la même composition que
 * la lecture d'une note : périmètre injecté dans le `where` (`ADR-006`), puis
 * `noteLisible()` en garde-fou, puis sortie unique par `INTROUVABLE`
 * (`RG-ACC-04`). Aucune règle de droit n'est écrite ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA BASE PORTE, ET CE QU'ELLE NE PORTE PAS — COMPTÉ, JAMAIS COMBLÉ
 *
 * Mesuré le 20 août 2026 sur la base semée : `pieces_jointes` compte **zéro
 * ligne**. `pnpm verif:donnees` le dit sous un autre angle et le chiffre :
 * « `Note.pj` — 7 notes sur 32 en déclarent, **13 pièces déclarées**, 2 nommées
 * au gel dont **0 chiffrables en octets**, **0 portées en base** ». Le corpus ne
 * porte que des COMPTES de pièces.
 *
 * ET LE CONTENU N'EXISTE NULLE PART DANS LE PRODUIT. La table porte le nom, la
 * taille et le type de média ; elle ne porte **ni octets ni chemin**. La
 * variable d'environnement qui nomme la racine des fichiers (compose.yaml:136)
 * n'est lue par **aucune ligne** du dépôt — relevé mécanique sur `src/`,
 * `base/` et `verif/`. Le dépôt de fichier, sa nomenclature sur disque et sa
 * sauvegarde (`RG-NF-09`) sont l'affaire du lot qui les spécifiera.
 *
 * Conséquence, et elle est honnête plutôt que commode :
 *
 *   · une pièce NON RÉSOLUE — inexistante, ou portée par une note que
 *     l'appelant ne peut pas lire — rend **404**, le même octet dans les deux
 *     cas. C'est le seul comportement que ce dépôt peut prouver aujourd'hui, et
 *     c'est celui que la matrice de §5.5 exige ;
 *   · une pièce RÉSOLUE rend **501** en nommant ce qui manque. Cette branche
 *     n'est exercée par AUCUN état du dépôt : elle l'est par un cas SYNTHÉTIQUE
 *     en unitaire (`P-5`, `P-26`), sur `resoudreUnePieceJointe()`.
 *
 * La différence entre 404 et 501 est légitime, et elle est la même que pour la
 * création : à qui a le droit, la ressource n'est pas cachée.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { resoudreUnePieceJointe } from '$lib/donnees/edition';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const resolue = await resoudreUnePieceJointe(basePartagee(), {
		identifiant: params.identifiant,
		fichier: params.fichier,
		identite: locals.identite
	});
	if (!resolue.trouve) error(404, MESSAGE_INTROUVABLE);

	error(
		501,
		'le contenu des pièces jointes n’est pas servi : la table porte le nom, la taille et ' +
			'le type de média, jamais les octets ni un chemin, et la racine des fichiers déclarée ' +
			'à la composition n’est lue par aucune ligne du dépôt'
	);
};
