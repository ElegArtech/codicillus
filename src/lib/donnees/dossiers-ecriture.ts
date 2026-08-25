/**
 * L'ÉCRITURE DU RANGEMENT — renommer, déplacer, supprimer un dossier.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE COMPOSE, IL NE REDÉFINIT NI DROIT NI CHEMIN
 *
 *   `../droits/resolution.ts`   `capacites()` et `chaineDAncetres()`. Aucune
 *                               comparaison de rôle, aucune remontée d'arbre de
 *                               droits n'est réécrite ici : deux résolutions
 *                               concurrentes, et la sécurité du produit devient
 *                               une question d'opinion.
 *   `./rangement.ts`            `LigneDeDossier`, `PROFONDEUR_MAX` et
 *                               `segmentsAffiches()` — la lecture du rangement,
 *                               dont l'écriture est le pendant. Aucune remontée
 *                               d'arborescence n'est réécrite non plus.
 *   `../rangement/adresses.ts`  `identifiantLisible()`, seule dérivation d'un
 *                               segment d'adresse à partir d'un nom.
 *   `../recherche/entretien.ts` l'entretien unique de l'index à l'écriture.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS RÈGLES QUE CE MODULE PORTE
 *
 * `RG-STR-04` — dix niveaux, plafond. La contrainte
 * `dossiers_profondeur_plafonnee` le porte déjà en base ; il est refusé ICI,
 * AVANT l'écriture, parce que la règle exige « un message explicite » et qu'une
 * violation de contrainte n'en est pas un.
 *
 * `RG-STR-05` — « un dossier ne peut pas être déplacé dans l'un de ses propres
 * descendants, ni dans un autre domaine ». La première moitié est ici ; la
 * seconde est portée par le SCHÉMA, dont la clé étrangère composite
 * `dossiers_parent_meme_domaine` rend un parent d'un autre domaine
 * INÉCRIVABLE — et par l'appelant, qui ne passe jamais que les lignes d'un seul
 * domaine. Ne pas la réécrire ici est délibéré : un contrôle qui double une
 * garantie structurelle finit par la remplacer dans les esprits.
 *
 * `RG-M03-04` — « la suppression d'un dossier affiche le décompte des
 * sous-dossiers et des notes qui seront détruits, et exige la SAISIE DU NOM
 * EXACT du dossier pour être confirmée. L'opération est atomique : soit tout est
 * supprimé, soit rien ne l'est. » Le décompte est un fait d'écran, porté par
 * `#dlg-supprimer` ; la saisie et l'atomicité sont ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'UN RENOMMAGE FAIT À UNE ADRESSE, ET IL FAUT LE DIRE
 *
 * `RG-M03-03` — « l'adresse d'une NOTE reste stable dans le temps, même si la
 * note change de dossier ou de domaine ». Elle l'est, et rien ici ne peut la
 * casser : `/notes/{identifiant}` est PLATE, et aucune ligne de ce module ne
 * touche à `notes.identifiant` ni à `notes.dossier_id`. Un renommage de dossier
 * ne casse aucun lien vers une note.
 *
 * L'ADRESSE D'UN DOSSIER, ELLE, N'EST PAS STABLE — et aucune règle ne prétend
 * qu'elle le soit. `adresseDeDossier()` dérive chaque segment du NOM par
 * `identifiantLisible()` (`../rangement/adresses.ts` : « tant que le corpus ne
 * porte pas l'identifiant, l'adresse se dérive du nom »). Renommer
 * « Sauvegardes » en « Sauvegardes et restauration » fait donc passer la page de
 * `…/dossiers/exploitation/sauvegardes` à
 * `…/dossiers/exploitation/sauvegardes-et-restauration`, et l'ancienne adresse
 * cesse de résoudre — comme celles de TOUS ses descendants, dont le chemin porte
 * le segment renommé en préfixe. Déplacer produit le même effet, par le préfixe
 * lui aussi.
 *
 * Le produit ne pose ni redirection ni alias : `RG-M12-11` veut un identifiant
 * PERSISTÉ, que la table `dossiers` ne porte pas — elle n'a qu'un `nom`
 * (`../base/schema.ts:234`). Le jour où elle le portera, `identifiantLisible()`
 * cessera d'être la dérivation et ce défaut tombera de lui-même. D'ici là, c'est
 * un fait connu du renommage, déclaré plutôt que tu.
 */
import { and, eq, inArray } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { comptes, dossiers, droitsDeDossier, notes } from '../base/schema';
import {
	capacites,
	chaineDAncetres,
	indexerLesDroits,
	type DroitDeDossier,
	type IndexDesDroits
} from '../droits/resolution';
import { initialesDuNom } from './accueil';
import { identifiantLisible } from '../rangement/adresses';
import { entretenirLIndex } from '../recherche/entretien';
import { PROFONDEUR_MAX, segmentsAffiches, type LigneDeDossier } from './rangement';

/* ═══════════════════════════════════ L'arborescence, en pur ═════════════ */

/**
 * LE SOUS-ARBRE d'un dossier — lui-même d'abord, puis ses descendants, dans
 * l'ordre où on les rencontre.
 *
 * Fonction PURE. Son garde-fou de cycle est celui de `chaineDAncetres()` pris à
 * l'envers : un ensemble de vus, et l'arrêt au premier déjà rencontré. Le
 * schéma plafonne la profondeur et interdit qu'un dossier soit son propre
 * parent, mais il n'exclut pas un cycle plus long
 * (`base/migrations/002_socle.montee.sql:18`) : l'effet est une TRONCATURE,
 * jamais une boucle infinie — c'est-à-dire une suppression qui emporte MOINS,
 * jamais plus.
 */
export function sousArbre(
	lignes: readonly LigneDeDossier[],
	dossierId: string
): readonly LigneDeDossier[] {
	const parId = new Map(lignes.map((d) => [d.id, d]));
	const racine = parId.get(dossierId);
	if (racine === undefined) return [];

	const retenus: LigneDeDossier[] = [racine];
	const vus = new Set<string>([racine.id]);
	for (let rang = 0; rang < retenus.length; rang++) {
		const courant = retenus[rang];
		if (courant === undefined) continue;
		for (const ligne of lignes) {
			if (ligne.parentId !== courant.id || vus.has(ligne.id)) continue;
			vus.add(ligne.id);
			retenus.push(ligne);
		}
	}
	return retenus;
}

/**
 * LA HAUTEUR d'un sous-arbre — le nombre de niveaux SOUS le dossier, `0` s'il
 * n'a aucun enfant. C'est `profondeurSous()` du gel
 * (`mockups/V-13-page-dossier.html:2001`-`2009`), calculé sur les lignes de la
 * base plutôt que sur l'arborescence déduite des notes : un dossier vide compte
 * dans le plafond, et le gel, qui ne connaît que les notes, ne pouvait pas le
 * voir.
 */
export function hauteurDuSousArbre(lignes: readonly LigneDeDossier[], dossierId: string): number {
	const branche = sousArbre(lignes, dossierId);
	const depart = branche.find((d) => d.id === dossierId)?.profondeur ?? 0;
	let hauteur = 0;
	for (const d of branche) hauteur = Math.max(hauteur, d.profondeur - depart);
	return hauteur;
}

/* ═══════════════════════════════════ Les refus, dans les mots du gel ════ */

/**
 * LES MESSAGES SONT CEUX DU GEL, RELEVÉS LIGNE À LIGNE — et ils vivent ici pour
 * que le contrôle de la page et celui du serveur n'en aient qu'une écriture. Un
 * message de page et un message de serveur qui divergent, c'est un utilisateur
 * à qui l'on dit deux choses du même refus.
 *
 *   `V-13:2211`  « Donnez un nom au dossier. »
 *   `V-13:2217`  « … existe déjà dans ce dossier. Choisissez un autre nom. »
 *   `V-13:2223`  « Le rangement est limité à N niveaux. Ce dossier serait au
 *                niveau M. »
 *   `V-13:2318`  « Le nom ne peut pas être vide. »
 *   `V-13:2319`  « Choisissez une destination. »
 *   `V-13:2241`  « Un dossier ne peut pas être déplacé dans lui-même. »
 *   `V-13:2242`  « Destination contenue dans le dossier déplacé. »
 *   `V-13:2246`  « Dépasserait N niveaux : ce dossier en compte M en dessous de
 *                lui. »
 */
export const NOM_MANQUANT = 'Donnez un nom au dossier.';
export const NOM_VIDE = 'Le nom ne peut pas être vide.';
export const DESTINATION_MANQUANTE = 'Choisissez une destination.';
export const DEPLACE_DANS_LUI_MEME = 'Un dossier ne peut pas être déplacé dans lui-même.';
export const DESTINATION_INTERIEURE = 'Destination contenue dans le dossier déplacé.';

/** « … existe déjà dans ce dossier. Choisissez un autre nom. » — `V-13:2217`. */
export function nomDejaPris(nom: string): string {
	return `« ${nom} » existe déjà dans ce dossier. Choisissez un autre nom.`;
}

/** « Le rangement est limité à N niveaux. Ce dossier serait au niveau M. » */
export function tropProfond(niveau: number): string {
	return `Le rangement est limité à ${String(PROFONDEUR_MAX)} niveaux. Ce dossier serait au niveau ${String(niveau)}.`;
}

/** « Dépasserait N niveaux : ce dossier en compte M en dessous de lui. » */
export function depasseLePlafond(hauteur: number): string {
	return `Dépasserait ${String(PROFONDEUR_MAX)} niveaux : ce dossier en compte ${String(hauteur)} en dessous de lui.`;
}

/**
 * LE MOTIF DE REFUS D'UNE DESTINATION, ou `null` si elle est recevable.
 *
 * `V-13:2236`-`2250`, et le gel dit pourquoi il l'AFFICHE plutôt que de le
 * taire : « les destinations impossibles sont montrées avec leur motif :
 * refuser après le clic serait une porte fermée » (`V-13:2231`). C'est `P-09`
 * appliqué à une destination.
 *
 * LE PARENT ACTUEL EST TOUJOURS RECEVABLE, et c'est la première ligne du gel :
 * un simple renommage ne déplace rien, donc rien ne peut le refuser.
 *
 * LE PLAFOND EST COMPTÉ EN PROFONDEUR DE BASE, non dans la numérotation
 * d'écran. Le gel compte les niveaux à partir du premier dossier SOUS la racine
 * du domaine ; la table `dossiers` compte la racine, et sa contrainte
 * `dossiers_profondeur_plafonnee` porte sur cette numérotation-là. Les deux
 * diffèrent d'une unité, et la PLUS STRICTE est retenue : un refus de plus n'a
 * jamais ouvert un accès, tandis qu'une acceptation de plus se paierait en
 * violation de contrainte, c'est-à-dire en `500` — quand `RG-STR-04` veut « un
 * message explicite ».
 *
 * @param lignes les dossiers du SEUL domaine concerné — voir l'en-tête,
 *   `RG-STR-05` seconde moitié
 */
export function motifDeRefusDeDestination(
	lignes: readonly LigneDeDossier[],
	dossierId: string,
	destinationId: string
): string | null {
	const parId = new Map(lignes.map((d) => [d.id, d]));
	const dossier = parId.get(dossierId);
	const destination = parId.get(destinationId);
	if (dossier === undefined || destination === undefined) return DESTINATION_MANQUANTE;

	/* Le parent actuel — rien ne bouge, rien ne peut être refusé. */
	if (dossier.parentId === destination.id) return null;

	if (destination.id === dossier.id) return DEPLACE_DANS_LUI_MEME;
	if (sousArbre(lignes, dossierId).some((d) => d.id === destination.id)) {
		return DESTINATION_INTERIEURE;
	}

	const hauteur = hauteurDuSousArbre(lignes, dossierId);
	if (destination.profondeur + 1 + hauteur > PROFONDEUR_MAX) return depasseLePlafond(hauteur);
	return null;
}

/* ═══════════════════════════════════ L'origine d'un droit, RG-DRO-01 ════ */

/** D'où vient le droit effectif d'un compte sur un dossier. */
export interface OrigineDeDroit {
	/** Le dossier qui porte le droit explicite — le plus proche en remontant. */
	readonly dossierId: string;
	/** Le droit est-il posé sur le dossier consulté lui-même ? */
	readonly propre: boolean;
	/** Le dossier d'origine est-il la racine du domaine ? */
	readonly racine: boolean;
	/** Le nom du dossier d'origine — celui du domaine quand c'est la racine. */
	readonly nom: string;
}

/**
 * L'ORIGINE D'UN DROIT — le dossier d'où il vient, jamais le droit lui-même.
 *
 * `RG-DRO-01` ordonne la chaîne d'ancêtres du plus proche au plus lointain et
 * s'arrête au premier droit rencontré. Cette fonction emprunte la MÊME chaîne,
 * par la MÊME fonction exportée — `chaineDAncetres()` —, et s'arrête au même
 * endroit : elle ne rend donc pas un second verdict, elle rend la POSITION de
 * celui que `resoudreDroitDeDossier()` a rendu.
 *
 * La distinction n'est pas rhétorique. La VALEUR du droit reste lue à
 * l'implémentation unique, et aucune ligne d'ici ne la recalcule ; si l'ordre de
 * la remontée changeait un jour, les deux changeraient ensemble, puisqu'elles
 * lisent la même chaîne. Un contrôle unitaire l'atteste sur les deux polarités
 * (`./dossiers-ecriture.test.ts`), et il est SYNTHÉTIQUE : `P-26` interdit qu'un
 * contrôle n'ait pour cas d'épreuve que l'état du dépôt.
 *
 * `null` quand aucun ancêtre ne porte de droit explicite pour ce compte —
 * `RG-DRO-02`, fermeture par défaut —, ET pour un administrateur sans ligne dans
 * la table : son droit vient de son RÔLE (`RG-DRO-03`), donc d'aucun dossier.
 * Nommer un dossier d'origine serait alors faux.
 */
export function origineDUnDroit(
	index: IndexDesDroits,
	lignes: readonly LigneDeDossier[],
	dossierId: string,
	compteId: string,
	nomDuDomaine: string
): OrigineDeDroit | null {
	const parId = new Map(lignes.map((d) => [d.id, d]));
	for (const ancetre of chaineDAncetres(index, dossierId)) {
		if (index.explicites.get(ancetre)?.get(compteId) === undefined) continue;
		const ligne = parId.get(ancetre);
		const racine = ligne !== undefined && ligne.parentId === null;
		return {
			dossierId: ancetre,
			propre: ancetre === dossierId,
			racine,
			nom: racine ? nomDuDomaine : (ligne?.nom ?? nomDuDomaine)
		};
	}
	return null;
}

/**
 * LE LIBELLÉ DE `#droit-source`, dans les formes du gel et dans elles seules.
 *
 * `V-13:1146` porte « — hérité du domaine Infrastructure » ; la planche de la
 * même vue rend « — accordé sur ce dossier » pour un droit posé sur place. La
 * troisième forme — « hérité du dossier X » — est celle de `V-40:3343`, qui
 * nomme l'origine d'un droit hérité d'un dossier intermédiaire. Aucune tournure
 * n'est composée ici : les trois sont relevées.
 *
 * VIDE quand l'origine n'est pas un dossier. Un administrateur tient son droit
 * de `RG-DRO-03`, pas d'un dossier : la source reste muette plutôt que de nommer
 * un dossier qui n'a rien accordé. C'est `P-02` — une donnée qu'on n'a pas ne
 * s'invente pas.
 */
export function libelleDOrigine(origine: OrigineDeDroit | null): string {
	if (origine === null) return '';
	if (origine.propre) return '— accordé sur ce dossier';
	if (origine.racine) return `— hérité du domaine ${origine.nom}`;
	return `— hérité du dossier ${origine.nom}`;
}

/* ═══════════════════════════════════ Les droits d'un dossier, tous comptes ═ */

/**
 * UN COMPTE, TEL QUE LE DIALOGUE DES DROITS LE NOMME.
 *
 * `identifiant` est l'identifiant de CONNEXION, et c'est lui qui désigne le
 * compte dans les trois écritures ci-dessous — le même choix que
 * `changerLeRoleDUnCompte()` (`./administration.ts`), et pour le même motif :
 * il est « définitif après création » (`V-32:3109`), là où le nom ne l'est pas.
 * L'identifiant interne ne voyage jamais jusqu'au navigateur.
 */
export interface CompteDeDroit {
	readonly identifiant: string;
	readonly nom: string;
	/** Deux initiales au plus — `.dr__avatar` (`V-40:1200`). */
	readonly initiales: string;
}

/** Une ligne de `.droits` : un droit effectif sur ce dossier, et son origine. */
export interface DroitAffiche extends CompteDeDroit {
	readonly niveau: DroitDeDossier;
	/** Le droit vient d'un ancêtre — le dossier n'est pas celui qui l'a accordé. */
	readonly herite: boolean;
	/** La tournure de `libelleDOrigine()`, jamais une composée sur place. */
	readonly origine: string;
	/**
	 * CETTE LIGNE EST CELLE DE L'APPELANT — `P-09` / `ARB-040`.
	 *
	 * Un gestionnaire ne peut ni retirer ni abaisser son propre droit de gestion
	 * sur ce dossier, et le serveur le refuse. Un geste refusé ne doit pas être
	 * OFFERT : la vue omet le retrait sur cette ligne, plutôt que de le griser.
	 */
	readonly soiMeme: boolean;
}

/** Ce que le dialogue des droits d'un dossier montre. */
export interface DroitsDUnDossier {
	/** Les droits en vigueur sur ce dossier, propres d'abord, puis hérités. */
	readonly accordes: readonly DroitAffiche[];
	/** Les comptes actifs qui n'en ont aucun — la liste d'« Ajouter un accès ». */
	readonly candidats: readonly CompteDeDroit[];
}

/** Ce qu'une ligne de compte doit porter pour entrer dans la composition. */
interface LigneDeCompte {
	readonly id: string;
	readonly identifiant: string;
	readonly nom: string;
	readonly actif: boolean;
}

/**
 * LES DROITS EN VIGUEUR SUR UN DOSSIER, COMPTE PAR COMPTE — fonction PURE.
 *
 * `ouvrirLAcces()` (`./rangement.ts`) ne lit que les droits DU COMPTE APPELANT,
 * et c'est justifié là-bas : « les droits des autres comptes ne concernent pas
 * cette réponse ». Le dialogue des droits est la seule réponse du produit à qui
 * ils concernent, et cette fonction est le seul endroit où ils se composent.
 *
 * ELLE NE REND AUCUN SECOND VERDICT. L'origine sort d'`origineDUnDroit()`, qui
 * remonte la chaîne de `RG-DRO-01` ; le NIVEAU est relu dans l'index AU DOSSIER
 * D'ORIGINE, donc à l'endroit même où la remontée s'est arrêtée. Aucune
 * comparaison de force entre deux droits n'est écrite ici, et il ne faut pas
 * qu'il y en ait une : deux résolutions concurrentes, et la sécurité du produit
 * devient une question d'opinion (en-tête de ce module).
 *
 * `RG-DRO-03` N'A PAS DE LIGNE ICI, ET C'EST VOULU. Un administrateur contourne
 * tous les droits de dossier PAR SON RÔLE, sans ligne dans la table : il ne
 * tient son droit d'aucun dossier, `libelleDOrigine()` le dit déjà en restant
 * muet, et l'afficher comme un droit du dossier laisserait croire qu'on peut le
 * lui retirer ici. Ce dialogue montre les droits DE CE DOSSIER, pas la liste des
 * comptes capables de l'ouvrir.
 */
export function droitsResolusDUnDossier(
	index: IndexDesDroits,
	lignes: readonly LigneDeDossier[],
	dossierId: string,
	comptesConnus: readonly LigneDeCompte[],
	nomDuDomaine: string,
	appelantId: string | null = null
): readonly DroitAffiche[] {
	const rendus: DroitAffiche[] = [];
	for (const compte of comptesConnus) {
		const origine = origineDUnDroit(index, lignes, dossierId, compte.id, nomDuDomaine);
		if (origine === null) continue;
		const niveau = index.explicites.get(origine.dossierId)?.get(compte.id);
		if (niveau === undefined) continue;
		rendus.push({
			identifiant: compte.identifiant,
			nom: compte.nom,
			initiales: initialesDuNom(compte.nom),
			niveau,
			herite: !origine.propre,
			origine: libelleDOrigine(origine),
			soiMeme: compte.id === appelantId
		});
	}
	/* Les droits PROPRES d'abord : ce sont les seuls sur lesquels le dialogue
	   offre un geste, et les faire chercher au milieu des hérités les rendrait
	   introuvables sur un dossier profond. À égalité, l'ordre est celui des noms. */
	return rendus.sort(
		(a, b) => Number(a.herite) - Number(b.herite) || a.nom.localeCompare(b.nom, 'fr')
	);
}

/**
 * LES DROITS D'UN DOSSIER, LUS EN BASE — la requête que le produit n'avait pas.
 *
 * DEUX LECTURES, ET LE FILTRE EST DANS LA REQUÊTE (`ADR-006`) : les lignes de
 * `droits_de_dossier` posées sur la CHAÎNE D'ANCÊTRES du dossier — aucune autre
 * ne peut le gouverner, `RG-DRO-01` ne regardant que celle-là —, et les comptes.
 *
 * LES COMPTES SONT LUS EN ENTIER, ACTIFS COMME INACTIFS, et c'est nécessaire :
 * `RG-M14-08` conserve un compte désactivé et ses contributions, donc sa ligne
 * de droit lui survit. La masquer laisserait en base un droit que personne ne
 * verrait plus, ni ne pourrait retirer.
 *
 * LES CANDIDATS, EUX, SONT LES SEULS COMPTES ACTIFS SANS AUCUN DROIT ICI —
 * c'est le crible du gel lui-même (`V-40:3399`, `c.actif` et aucun droit).
 */
export async function lireLesDroitsDUnDossier(
	base: Base,
	demande: {
		readonly dossierId: string;
		/** L'arborescence ENTIÈRE — la remontée passe par des ancêtres hors périmètre. */
		readonly lignes: readonly LigneDeDossier[];
		readonly nomDuDomaine: string;
		/** Le compte qui consulte — la ligne qui le concerne n'offre aucun geste. */
		readonly appelantId: string | null;
	}
): Promise<DroitsDUnDossier> {
	const ancetres = chaineDAncetres(indexerLesDroits(demande.lignes), demande.dossierId);
	const lignesDeDroit =
		ancetres.length === 0
			? []
			: await base
					.select({
						dossierId: droitsDeDossier.dossierId,
						compteId: droitsDeDossier.compteId,
						droit: droitsDeDossier.droit
					})
					.from(droitsDeDossier)
					.where(inArray(droitsDeDossier.dossierId, [...ancetres]));

	const comptesConnus = await base
		.select({
			id: comptes.id,
			identifiant: comptes.identifiant,
			nom: comptes.nom,
			actif: comptes.actif
		})
		.from(comptes);

	const index = indexerLesDroits(demande.lignes, lignesDeDroit);
	const accordes = droitsResolusDUnDossier(
		index,
		demande.lignes,
		demande.dossierId,
		comptesConnus,
		demande.nomDuDomaine,
		demande.appelantId
	);
	const dotes = new Set(accordes.map((d) => d.identifiant));
	const candidats = comptesConnus
		.filter((c) => c.actif && !dotes.has(c.identifiant))
		.map((c) => ({ identifiant: c.identifiant, nom: c.nom, initiales: initialesDuNom(c.nom) }))
		.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

	return { accordes, candidats };
}

/* ═══════════════════════════════════ Ce qu'une écriture rend ════════════ */

/** Ce qu'un refus rend : un message à afficher, ou rien. */
export interface RefusDEcriture {
	readonly fait: false;
	readonly message: string;
}

/**
 * LE REFUS SANS MESSAGE — un droit qui manque ne se raconte pas.
 *
 * `RG-ACC-04` veut qu'un refus et une inexistence soient indiscernables : la
 * route traduit cette valeur en `404`, le même que pour un chemin faux, et le
 * message ne voyage pas. Il est VIDE plutôt qu'explicatif, et c'est là toute la
 * différence avec les refus de FORME ci-dessus, qui sont, eux, des messages à
 * afficher dans le dialogue.
 *
 * Valeur UNIQUE et gelée, pour la raison qui fait d'`INTROUVABLE` un objet
 * unique (`../droits/resolution.ts`) : deux littéraux de forme identique
 * laisseraient la porte ouverte à ce que l'un porte un jour un champ que l'autre
 * n'a pas.
 */
export const REFUS_MUET: RefusDEcriture = Object.freeze({ fait: false, message: '' });

/** Ce qu'un déplacement réussi rend : le chemin d'arrivée, segments affichés. */
export interface DeplacementFait {
	readonly fait: true;
	readonly segments: readonly string[];
}

/* ═══════════════════════════════════ Renommer ou déplacer ═══════════════ */

/** Ce qu'un renommage ou un déplacement demande. */
export interface DemandeDeDeplacement {
	readonly dossierId: string;
	readonly destinationId: string;
	readonly nom: string;
	/** Les lignes du SEUL domaine concerné — la descente et la remontée s'y font. */
	readonly lignes: readonly LigneDeDossier[];
	/** Le droit effectif de l'appelant, dossier par dossier. */
	readonly droit: (dossierId: string) => DroitDeDossier | null;
}

/**
 * RENOMME ET DÉPLACE — un seul geste, parce que le gel n'en fait qu'un :
 * `#dlg-deplacer`, « Renommer ou déplacer », un champ de nom et une destination,
 * un seul bouton « Enregistrer ».
 *
 * QUATRE PORTES, DANS CET ORDRE, ET AUCUNE N'EST FACULTATIVE.
 *
 *  1. LE DROIT SUR LE DOSSIER DÉPLACÉ — `administrerLeDossier`, troisième
 *     colonne de `CDC` §2.3, « renommer / déplacer / supprimer le dossier ».
 *  2. LE DROIT SUR LA DESTINATION — `creerDesSousDossiers`. `RG-M05-09` pose le
 *     principe pour une note : « exige le droit […] sur le dossier d'origine ET
 *     sur le dossier de destination ». Un dossier qui arrive dans un autre y
 *     devient un sous-dossier : la capacité demandée est celle qui gouverne
 *     l'apparition d'un sous-dossier. Des deux lectures possibles, c'est la plus
 *     FERMÉE — et exiger davantage n'a jamais ouvert un accès. Les deux valent
 *     `gestionnaire` dans la table de `CDC` §2.3 ; les distinguer n'est pas une
 *     subtilité inutile, c'est ce qui restera juste le jour où la table changera.
 *  3. LA FORME — un nom non vide, une destination recevable (`RG-STR-04`,
 *     `RG-STR-05`), aucun frère de même adresse. Deux frères dont les noms
 *     donnent le même `identifiantLisible()` rendraient deux adresses
 *     identiques : le refus porte sur l'ADRESSE, pas sur le nom.
 *  4. L'ÉCRITURE, EN UNE TRANSACTION. Le dossier change de parent et de
 *     profondeur ; SES DESCENDANTS CHANGENT DE PROFONDEUR AVEC LUI, et c'est le
 *     point où l'on se trompe : `dossiers_profondeur_plafonnee` porte sur chaque
 *     ligne, non sur la seule qu'on déplace.
 *
 * LA RACINE NE SE DÉPLACE PAS ET NE SE RENOMME PAS ICI : elle porte le nom du
 * domaine, `RG-STR-03` en fait le dossier par défaut du domaine, et cette page
 * n'existe pas pour elle — `resoudreLeChemin()` refuse un chemin vide. Son
 * renommage relève de l'administration du domaine.
 */
export async function renommerOuDeplacerUnDossier(
	base: Base,
	demande: DemandeDeDeplacement
): Promise<DeplacementFait | RefusDEcriture> {
	const parId = new Map(demande.lignes.map((d) => [d.id, d]));
	const dossier = parId.get(demande.dossierId);
	const destination = parId.get(demande.destinationId);
	if (dossier === undefined || dossier.parentId === null) return REFUS_MUET;

	/* LE DROIT SUR LE DOSSIER PASSE AVANT TOUTE LECTURE DE FORMULAIRE, et l'ordre
	   n'est pas cosmétique : un appelant sans droit qui posterait un formulaire
	   VIDE recevrait sinon « Choisissez une destination » — c'est-à-dire la
	   confirmation que le dossier existe et que seule la forme manque. `RG-ACC-04`
	   veut que rien ne distingue le refus de l'inexistence ; un message de forme
	   rendu avant le contrôle de droit est exactement cette distinction. Mesuré :
	   un rédacteur recevait 200 là où il doit recevoir 404. */
	if (!capacites(demande.droit(dossier.id)).administrerLeDossier) return REFUS_MUET;

	if (destination === undefined) return { fait: false, message: DESTINATION_MANQUANTE };
	if (!capacites(demande.droit(destination.id)).creerDesSousDossiers) return REFUS_MUET;

	const nom = demande.nom.trim();
	if (nom === '') return { fait: false, message: NOM_VIDE };

	const motif = motifDeRefusDeDestination(demande.lignes, dossier.id, destination.id);
	if (motif !== null) return { fait: false, message: motif };

	const segment = identifiantLisible(nom);
	if (segment === '') return { fait: false, message: NOM_VIDE };
	const collision = demande.lignes.some(
		(d) =>
			d.parentId === destination.id && d.id !== dossier.id && identifiantLisible(d.nom) === segment
	);
	if (collision) return { fait: false, message: nomDejaPris(nom) };

	const nouvelleProfondeur = destination.profondeur + 1;
	const ecart = nouvelleProfondeur - dossier.profondeur;
	const descendants = sousArbre(demande.lignes, dossier.id).filter((d) => d.id !== dossier.id);
	const freres = demande.lignes.filter((d) => d.parentId === destination.id && d.id !== dossier.id);
	const maintenant = new Date();

	await base.transaction(async (tx) => {
		await tx
			.update(dossiers)
			.set({
				nom,
				parentId: destination.id,
				profondeur: nouvelleProfondeur,
				/* Le rang ne bouge que si le parent bouge : un renommage sur place ne
				   doit pas renvoyer le dossier en fin de fratrie. */
				...(dossier.parentId === destination.id ? {} : { position: freres.length }),
				modifieLe: maintenant
			})
			.where(eq(dossiers.id, dossier.id));

		/* Les descendants suivent. L'écart a déjà été refusé plus haut s'il devait
		   violer le plafond : aucune ligne intermédiaire ne sort de 1..10. */
		if (ecart !== 0) {
			for (const d of descendants) {
				await tx
					.update(dossiers)
					.set({ profondeur: d.profondeur + ecart, modifieLe: maintenant })
					.where(eq(dossiers.id, d.id));
			}
		}
	});

	/* Le chemin d'arrivée est recomposé sur les lignes TELLES QU'ELLES SONT
	   DÉSORMAIS, par la remontée de `rangement.ts` — jamais par une seconde. */
	const apres = demande.lignes.map((d) =>
		d.id === dossier.id ? { ...d, nom, parentId: destination.id } : d
	);
	return { fait: true, segments: segmentsAffiches(apres, dossier.id) };
}

/* ═══════════════════════════════════ Supprimer — RG-M03-04 ══════════════ */

/**
 * LE NOM SAISI NE CORRESPOND PAS — `RG-M03-04`.
 *
 * Le message n'est pas du gel, et le gel n'en a pas : il DÉSACTIVE le bouton
 * tant que la saisie diffère (`V-13:2366`-`2368`), de sorte que le cas ne se
 * présente jamais à l'écran. Le contrôle serveur est le filet — la page
 * désactive, le serveur refuse —, et un filet muet ne dirait pas à l'appelant
 * pourquoi rien ne s'est passé.
 */
export const SAISIE_NON_CONFORME = 'Le nom saisi ne correspond pas à celui du dossier.';

/** Ce qu'une suppression de dossier demande. */
export interface DemandeDeSuppressionDeDossier {
	readonly dossierId: string;
	/** Le nom saisi par l'utilisateur — `RG-M03-04`, « le nom exact ». */
	readonly saisie: string;
	readonly lignes: readonly LigneDeDossier[];
	readonly droit: (dossierId: string) => DroitDeDossier | null;
}

/** Ce qu'une suppression réussie rend — de quoi le dire, et où revenir. */
export interface SuppressionDeDossierFaite {
	readonly fait: true;
	readonly nom: string;
	readonly dossiersDetruits: number;
	readonly notesDetruites: number;
	/** Les segments affichés du dossier PARENT — la cible du `303`. */
	readonly segmentsDuParent: readonly string[];
}

/**
 * DÉTRUIT UN DOSSIER, SON SOUS-ARBRE ET LEURS NOTES — `RG-M03-04`.
 *
 * QUATRE PORTES, DANS CET ORDRE.
 *
 *  1. LE DROIT — `administrerLeDossier`, `CDC` §2.3. Le refus est MUET
 *     (`RG-ACC-04`) : la route en fait le `404` de partout ailleurs.
 *  2. LE NOM EXACT — comparaison stricte, sans rognage ni pliage de casse. « Le
 *     nom exact » ne souffre pas d'à-peu-près : c'est le point même de la règle,
 *     qui veut que la main hésite avant de détruire.
 *  3. CE QUI VA DISPARAÎTRE EST LU AVANT, jamais après : la transaction passée,
 *     plus rien n'est lisible pour le dire.
 *  4. L'ATOMICITÉ, PAR UNE TRANSACTION ET PAR LA CASCADE. Deux ordres, et
 *     l'ordre entre eux compte : `notes.dossier_id` est en `ON DELETE RESTRICT`
 *     (`../base/schema.ts:479`), donc les notes partent d'abord ; les
 *     sous-dossiers, eux, partent SEULS, la clé étrangère composite
 *     `dossiers_parent_meme_domaine` étant en `ON DELETE CASCADE`, et
 *     `droits_de_dossier.dossier_id` avec eux. « Soit tout est supprimé, soit
 *     rien ne l'est » est tenu par la transaction, non par la discipline des
 *     deux ordres.
 *
 * LA RACINE D'UN DOMAINE NE SE SUPPRIME PAS ICI — `RG-STR-03` en fait le dossier
 * par défaut du domaine, et sa disparition emporterait le domaine entier. Le
 * refus est muet : rien ne distingue « on ne supprime pas la racine » de « vous
 * n'avez pas ce droit », et `RG-ACC-04` veut qu'on ne les distingue pas.
 *
 * L'INDEX SUIT LA TRANSACTION, JAMAIS DEDANS : `RG-M14-05` veut la disparition
 * immédiate de la recherche, et `entretenirLIndex()` DÉDUIT de la base ce qui a
 * disparu — « un identifiant demandé que la projection ne rend pas est un
 * identifiant qui n'existe plus ». Rien ici ne lui dit quoi oublier ; ce serait
 * un second chemin d'indexation.
 *
 * CE QUE CETTE FONCTION NE FAIT PAS, ET C'EST DÉCLARÉ : les OCTETS des pièces
 * jointes des notes détruites restent sur le disque. C'est le défaut que
 * `supprimerUneNote()` porte déjà (`./suppression.ts`, `ECART-048` É-1) : la
 * cascade emporte les lignes, elle ne peut pas emporter les fichiers.
 */
export async function supprimerUnDossier(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeSuppressionDeDossier
): Promise<SuppressionDeDossierFaite | RefusDEcriture> {
	const parId = new Map(demande.lignes.map((d) => [d.id, d]));
	const dossier = parId.get(demande.dossierId);
	if (dossier === undefined || dossier.parentId === null) return REFUS_MUET;
	if (!capacites(demande.droit(dossier.id)).administrerLeDossier) return REFUS_MUET;
	if (demande.saisie !== dossier.nom) return { fait: false, message: SAISIE_NON_CONFORME };

	const branche = sousArbre(demande.lignes, dossier.id);
	const identifiantsDeDossier = branche.map((d) => d.id);
	const detruites = await base
		.select({ identifiant: notes.identifiant })
		.from(notes)
		.where(inArray(notes.dossierId, identifiantsDeDossier));

	await base.transaction(async (tx) => {
		await tx.delete(notes).where(inArray(notes.dossierId, identifiantsDeDossier));
		await tx.delete(dossiers).where(eq(dossiers.id, dossier.id));
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
	if (detruites.length > 0) {
		await entretenirLIndex(
			base,
			client,
			detruites.map((n) => n.identifiant)
		);
	}

	return {
		fait: true,
		nom: dossier.nom,
		dossiersDetruits: branche.length - 1,
		notesDetruites: detruites.length,
		segmentsDuParent: segmentsAffiches(demande.lignes, dossier.parentId)
	};
}

/* ═══════════════════════════════════ Écrire un droit de dossier ═════════ */

/**
 * LES TROIS NIVEAUX, ET RIEN D'AUTRE — l'énumération de base
 * (`002_socle.montee.sql:36`), reprise ici sous la forme d'un crible.
 *
 * `null` SUR TOUT LE RESTE, jamais un niveau par défaut : se tromper de défaut,
 * ici, c'est accorder un droit. C'est la règle de `roleDepuisLeLibelle()`
 * (`./administration.ts`), et pour une raison plus forte encore — celui-là
 * gouverne un rôle de compte, celui-ci gouverne l'accès à un contenu.
 */
export function niveauDeDroitDepuisLaSaisie(brut: unknown): DroitDeDossier | null {
	if (brut === 'lecteur' || brut === 'redacteur' || brut === 'gestionnaire') return brut;
	return null;
}

/** Le niveau reçu n'est aucun des trois. */
export const NIVEAU_INCONNU = 'Choisissez un niveau de droit.';

/** L'identifiant de connexion ne désigne aucun compte. */
export const COMPTE_INTROUVABLE = 'Aucun compte ne porte cet identifiant de connexion.';

/**
 * `RG-M14-08` — « un compte désactivé perd IMMÉDIATEMENT l'accès ». Lui accorder
 * un droit ne lui ouvrirait rien et ferait croire le contraire à qui l'accorde.
 * Le gel écarte déjà ces comptes de sa liste d'ajout (`V-40:3399`) ; le refuser
 * ici est le filet, une liste d'écran n'étant pas un contrôle.
 */
export const COMPTE_DESACTIVE = 'Ce compte est désactivé : il ne peut recevoir aucun droit.';

/**
 * LE DROIT VISÉ N'EST PAS POSÉ SUR CE DOSSIER — il est hérité, ou il n'existe
 * pas. Le dialogue du gel le dit déjà en toutes lettres : « Retirer un droit
 * explicite ne retire pas un droit hérité […] il faut la retirer là où elle a
 * été accordée » (`V-40:1220`). Un succès silencieux qui ne retirerait rien
 * serait la pire réponse : l'appelant croirait l'accès fermé.
 */
export const DROIT_NON_PROPRE =
	"Ce droit n'est pas posé sur ce dossier : il est hérité. Il se change là où il a été accordé.";

/**
 * UN GESTIONNAIRE NE SE FERME PAS LA PORTE — et rien dans le schéma ne l'en
 * empêche. Retirer, ou abaisser, son propre droit de gestion sur ce dossier le
 * laisserait sans aucun recours DANS LE PRODUIT : plus de dialogue, plus
 * d'action, et aucun écran de console ne touche `droits_de_dossier`. Le message
 * dit pourquoi, parce qu'un refus muet ferait chercher un défaut.
 */
export const AUTO_RETRAIT_DE_GESTION =
	'Vous ne pouvez pas retirer ni abaisser votre propre droit de gestion sur ce dossier : plus aucun écran ne vous le rendrait.';

/** Ce qu'une écriture de droit réussie rend — de quoi le dire à l'écran. */
export interface DroitEcrit {
	readonly fait: true;
	/** Le nom du compte visé, tel que la base le porte. */
	readonly nom: string;
	/** Le niveau désormais posé, `null` après un retrait. */
	readonly niveau: DroitDeDossier | null;
}

/** Ce qu'une écriture de droit demande. */
export interface DemandeDeDroit {
	readonly dossierId: string;
	/** L'identifiant de CONNEXION du compte visé — jamais son identifiant interne. */
	readonly identifiantDuCompte: string;
	/** Le niveau demandé. Non lu au retrait. */
	readonly niveau: DroitDeDossier | null;
	/** Le droit effectif de l'appelant, dossier par dossier. */
	readonly droit: (dossierId: string) => DroitDeDossier | null;
	/** Le compte de l'appelant, `null` en anonyme — le refus d'auto-retrait le lit. */
	readonly appelantId: string | null;
}

/** Le compte visé, ou `null`. Une seule requête, une seule forme. */
async function compteVise(
	base: Base,
	identifiant: string
): Promise<{ id: string; nom: string; actif: boolean } | null> {
	if (identifiant === '') return null;
	const lignes = await base
		.select({ id: comptes.id, nom: comptes.nom, actif: comptes.actif })
		.from(comptes)
		.where(eq(comptes.identifiant, identifiant))
		.limit(1);
	return lignes[0] ?? null;
}

/** Le droit EXPLICITE posé sur ce dossier même, ou `null` s'il n'y en a pas. */
async function droitPropre(
	base: Base,
	dossierId: string,
	compteId: string
): Promise<DroitDeDossier | null> {
	const lignes = await base
		.select({ droit: droitsDeDossier.droit })
		.from(droitsDeDossier)
		.where(and(eq(droitsDeDossier.dossierId, dossierId), eq(droitsDeDossier.compteId, compteId)))
		.limit(1);
	return lignes[0]?.droit ?? null;
}

/**
 * ACCORDER UN DROIT — la première écriture de droits du produit.
 *
 * QUATRE PORTES, DANS CET ORDRE, ET LA PREMIÈRE EST LE DROIT.
 *
 *  1. `capacites().gererLesDroits` — quatrième colonne de `CDC` §2.3, et le
 *     garde était écrit depuis `T-011` sans être lu nulle part. Le refus est
 *     MUET (`RG-ACC-04`) : la route en fait le `404` de partout ailleurs, et
 *     l'ordre n'est pas cosmétique — un message de forme rendu avant le contrôle
 *     de droit dirait à un rédacteur que le dossier existe.
 *  2. LE NIVEAU — l'un des trois, ou refus. Jamais de défaut.
 *  3. LE COMPTE — il existe, et il est actif (`RG-M14-08`).
 *  4. L'AUTO-ABAISSEMENT — refusé, voir `AUTO_RETRAIT_DE_GESTION`.
 *
 * L'ÉCRITURE EST UNE REPRISE SUR LA CLÉ PRIMAIRE, non un « insérer sinon mettre
 * à jour » écrit à la main : `droits_de_dossier_pk` porte le couple
 * `(dossier_id, compte_id)` (`002_socle.montee.sql:197`-`208`), et c'est cette
 * unicité qui donne son sens à `RG-DRO-01` — un droit AU PLUS par couple, donc
 * une remontée qui ne peut pas trouver deux réponses au même niveau. Lire puis
 * écrire laisserait une fenêtre où deux gestionnaires simultanés violeraient la
 * clé ; la reprise la referme dans la base.
 */
export async function accorderUnDroitDeDossier(
	base: Base,
	demande: DemandeDeDroit
): Promise<DroitEcrit | RefusDEcriture> {
	if (!capacites(demande.droit(demande.dossierId)).gererLesDroits) return REFUS_MUET;
	if (demande.niveau === null) return { fait: false, message: NIVEAU_INCONNU };

	const compte = await compteVise(base, demande.identifiantDuCompte);
	if (compte === null) return { fait: false, message: COMPTE_INTROUVABLE };
	if (!compte.actif) return { fait: false, message: COMPTE_DESACTIVE };
	if (compte.id === demande.appelantId && demande.niveau !== 'gestionnaire') {
		return { fait: false, message: AUTO_RETRAIT_DE_GESTION };
	}

	await base
		.insert(droitsDeDossier)
		.values({ dossierId: demande.dossierId, compteId: compte.id, droit: demande.niveau })
		.onConflictDoUpdate({
			target: [droitsDeDossier.dossierId, droitsDeDossier.compteId],
			set: { droit: demande.niveau }
		});

	return { fait: true, nom: compte.nom, niveau: demande.niveau };
}

/**
 * CHANGER LE NIVEAU D'UN DROIT DÉJÀ POSÉ SUR CE DOSSIER.
 *
 * LA DIFFÉRENCE AVEC `accorderUnDroitDeDossier()` TIENT EN UNE PORTE, et elle
 * compte : le droit doit être PROPRE. Le geste est offert sur la ligne d'un
 * droit hérité par erreur d'écran, ou composé à la main par un client, et
 * l'accepter écrirait sur ce dossier un droit que personne n'y a accordé —
 * l'inverse de ce que la ligne montrait. C'est le même refus qu'au retrait, et
 * pour la même raison.
 */
export async function changerUnDroitDeDossier(
	base: Base,
	demande: DemandeDeDroit
): Promise<DroitEcrit | RefusDEcriture> {
	if (!capacites(demande.droit(demande.dossierId)).gererLesDroits) return REFUS_MUET;
	if (demande.niveau === null) return { fait: false, message: NIVEAU_INCONNU };

	const compte = await compteVise(base, demande.identifiantDuCompte);
	if (compte === null) return { fait: false, message: COMPTE_INTROUVABLE };

	const propre = await droitPropre(base, demande.dossierId, compte.id);
	if (propre === null) return { fait: false, message: DROIT_NON_PROPRE };
	if (compte.id === demande.appelantId && demande.niveau !== 'gestionnaire') {
		return { fait: false, message: AUTO_RETRAIT_DE_GESTION };
	}

	await base
		.update(droitsDeDossier)
		.set({ droit: demande.niveau })
		.where(
			and(eq(droitsDeDossier.dossierId, demande.dossierId), eq(droitsDeDossier.compteId, compte.id))
		);

	return { fait: true, nom: compte.nom, niveau: demande.niveau };
}

/**
 * RETIRER UN DROIT POSÉ SUR CE DOSSIER.
 *
 * UN DROIT HÉRITÉ N'A RIEN À SUPPRIMER ICI, et le dire est tout l'enjeu :
 * `DELETE` sans ligne correspondante réussit, la base ne s'en émeut pas, et
 * l'appelant repartirait convaincu d'avoir fermé un accès qui reste grand
 * ouvert. Le refus est explicite, et il nomme où le droit se retire vraiment.
 *
 * ET UN GESTIONNAIRE NE SE RETIRE PAS SA PROPRE GESTION — `AUTO_RETRAIT_DE_
 * GESTION`. Le contrôle porte sur le droit PROPRE effectivement lu, non sur le
 * droit effectif : c'est bien la ligne de ce dossier qu'on s'apprête à détruire.
 */
export async function retirerUnDroitDeDossier(
	base: Base,
	demande: DemandeDeDroit
): Promise<DroitEcrit | RefusDEcriture> {
	if (!capacites(demande.droit(demande.dossierId)).gererLesDroits) return REFUS_MUET;

	const compte = await compteVise(base, demande.identifiantDuCompte);
	if (compte === null) return { fait: false, message: COMPTE_INTROUVABLE };

	const propre = await droitPropre(base, demande.dossierId, compte.id);
	if (propre === null) return { fait: false, message: DROIT_NON_PROPRE };
	if (compte.id === demande.appelantId && propre === 'gestionnaire') {
		return { fait: false, message: AUTO_RETRAIT_DE_GESTION };
	}

	await base
		.delete(droitsDeDossier)
		.where(
			and(eq(droitsDeDossier.dossierId, demande.dossierId), eq(droitsDeDossier.compteId, compte.id))
		);

	return { fait: true, nom: compte.nom, niveau: null };
}
