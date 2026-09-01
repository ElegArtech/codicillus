/**
 * L'écriture du rangement — renommer, déplacer, supprimer un dossier.
 *
 * Ce module COMPOSE : `capacites()` et `chaineDAncetres()` viennent de
 * `../droits/resolution.ts`, la remontée d'arborescence de `./rangement.ts`, la
 * dérivation d'un segment d'adresse de `../rangement/adresses.ts`, l'entretien de
 * l'index de `../recherche/entretien.ts`. Aucune résolution n'est réécrite ici : deux
 * résolutions concurrentes, et la sécurité devient une question d'opinion.
 *
 * `RG-STR-04` (dix niveaux) est refusé ICI, avant l'écriture, parce que la règle exige
 * « un message explicite » et qu'une violation de contrainte n'en est pas un.
 * `RG-STR-05` : la première moitié est ici, la seconde est portée par la clé étrangère
 * `dossiers_parent_meme_domaine`.
 *
 * CE QU'UN RENOMMAGE FAIT À UNE ADRESSE. `RG-M03-03` protège l'adresse d'une NOTE, qui
 * est PLATE et qu'aucune ligne d'ici ne touche. L'adresse d'un DOSSIER n'est pas
 * stable : `adresseDeDossier()` dérive chaque segment du NOM, de sorte qu'un renommage
 * fait cesser de résoudre l'ancienne adresse — et celles de tous les descendants. Le
 * produit ne pose ni redirection ni alias.
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
	type Identite,
	type IndexDesDroits
} from '../droits/resolution';
import { auteurDeLaSuppression, tracerUneSuppression } from './traces';
import { accord } from '../vocabulaire';
import { initialesDuNom } from './accueil';
import { identifiantLisible } from '../rangement/adresses';
import { entretenirLIndex } from '../recherche/entretien';
import { PROFONDEUR_MAX, segmentsAffiches, type LigneDeDossier } from './rangement';

/**
 * Le sous-arbre d'un dossier — lui-même d'abord, puis ses descendants. Fonction PURE.
 * Son garde-fou de cycle est celui de `chaineDAncetres()` pris à l'envers : le schéma
 * plafonne la profondeur et interdit qu'un dossier soit son propre parent, mais il
 * n'exclut pas un cycle plus long. L'effet est une TRONCATURE, jamais une boucle —
 * une suppression qui emporte MOINS, jamais plus.
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
 * La hauteur d'un sous-arbre — le nombre de niveaux SOUS le dossier, `0` sans enfant.
 * C'est `profondeurSous()` du gel (`V-13:2001-2009`), calculé sur les lignes de la
 * base plutôt que sur l'arborescence déduite des notes : un dossier vide compte dans
 * le plafond, et le gel ne pouvait pas le voir.
 */
export function hauteurDuSousArbre(lignes: readonly LigneDeDossier[], dossierId: string): number {
	const branche = sousArbre(lignes, dossierId);
	const depart = branche.find((d) => d.id === dossierId)?.profondeur ?? 0;
	let hauteur = 0;
	for (const d of branche) hauteur = Math.max(hauteur, d.profondeur - depart);
	return hauteur;
}

/**
 * Les messages sont ceux du gel (`V-13:2211`, `:2217`, `:2223`, `:2241`, `:2242`,
 * `:2246`, `:2318`, `:2319`), et ils vivent ici pour que le contrôle de la page et
 * celui du serveur n'en aient qu'une écriture.
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
 * Le motif de refus d'une destination, ou `null` si elle est recevable.
 *
 * `V-13:2236-2250`, et le gel dit pourquoi il l'AFFICHE : « les destinations
 * impossibles sont montrées avec leur motif : refuser après le clic serait une porte
 * fermée ». Le parent actuel est toujours recevable — un renommage ne déplace rien.
 *
 * LE PLAFOND EST COMPTÉ EN PROFONDEUR DE BASE, non dans la numérotation d'écran : le
 * gel compte à partir du premier dossier SOUS la racine, la table compte la racine.
 * La PLUS STRICTE est retenue — une acceptation de trop se paierait en `500` quand
 * `RG-STR-04` veut un message explicite.
 *
 * @param lignes les dossiers du SEUL domaine concerné — voir l'en-tête
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

export interface OrigineDeDroit {
	readonly dossierId: string;
	readonly propre: boolean;
	readonly racine: boolean;
	readonly nom: string;
}

/**
 * L'origine d'un droit — le dossier d'où il vient, jamais le droit lui-même. Elle
 * emprunte la MÊME chaîne que `RG-DRO-01`, par la même fonction exportée, et s'arrête
 * au même endroit : elle rend la POSITION du verdict de `resoudreDroitDeDossier()`,
 * pas un second verdict.
 *
 * `null` quand aucun ancêtre ne porte de droit explicite (`RG-DRO-02`), ET pour un
 * administrateur sans ligne dans la table : son droit vient de son RÔLE (`RG-DRO-03`).
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
 * Le libellé de `#droit-source`, dans les formes du gel et dans elles seules :
 * `V-13:1146`, la planche de la même vue et `V-40:3343`. VIDE quand l'origine n'est
 * pas un dossier : un administrateur tient son droit de `RG-DRO-03`, et nommer un
 * dossier qui n'a rien accordé serait faux.
 */
export function libelleDOrigine(origine: OrigineDeDroit | null): string {
	if (origine === null) return '';
	if (origine.propre) return '— accordé sur ce dossier';
	if (origine.racine) return `— hérité du domaine ${origine.nom}`;
	return `— hérité du dossier ${origine.nom}`;
}

/**
 * Un compte, tel que le dialogue des droits le nomme. `identifiant` est celui de
 * CONNEXION, et c'est lui qui désigne le compte dans les trois écritures ci-dessous :
 * il est « définitif après création » là où le nom ne l'est pas, et l'identifiant
 * interne ne voyage jamais jusqu'au navigateur.
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
	readonly herite: boolean;
	/** La tournure de `libelleDOrigine()`, jamais une composée sur place. */
	readonly origine: string;
	/**
	 * Cette ligne est celle sur laquelle LE SERVEUR REFUSERA (`P-09`, `ARB-040`) : celle
	 * de l'appelant quand il tient sa gestion de la TABLE. FAUX quand sa gestion vient
	 * de son RÔLE : le serveur accepte alors les deux gestes, et les omettre serait
	 * omettre un geste possible.
	 */
	readonly soiMeme: boolean;
}

export interface DroitsDUnDossier {
	readonly accordes: readonly DroitAffiche[];
	/** Les comptes actifs qui n'en ont aucun — la liste d'« Ajouter un accès ». */
	readonly candidats: readonly CompteDeDroit[];
	/**
	 * L'APPELANT VOIT-IL L'ANNUAIRE DES COMPTES ? — le rôle `administrateur`, et lui
	 * seul (`ADR-006`). C'est un fait sur L'APPELANT, jamais sur les autres comptes :
	 * le servir ne révèle l'existence de personne, et il permet à l'écran de dire
	 * POURQUOI la liste est vide plutôt que d'escamoter le panneau. « Aucun candidat »
	 * et « pas d'annuaire » ne se disent pas de la même façon.
	 */
	readonly annuaire: boolean;
}

interface LigneDeCompte {
	readonly id: string;
	readonly identifiant: string;
	readonly nom: string;
	readonly actif: boolean;
}

/**
 * Les droits en vigueur sur un dossier, compte par compte — fonction PURE.
 *
 * ELLE NE REND AUCUN SECOND VERDICT : l'origine sort d'`origineDUnDroit()`, et le
 * NIVEAU est relu dans l'index AU DOSSIER D'ORIGINE, là où la remontée s'est arrêtée.
 *
 * `RG-DRO-03` N'A PAS DE LIGNE ICI : un administrateur contourne les droits de dossier
 * par son RÔLE. L'afficher comme un droit du dossier laisserait croire qu'on peut le
 * lui retirer ici.
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
	/* Les droits PROPRES d'abord : ce sont les seuls sur lesquels le dialogue offre
	   un geste. À égalité, l'ordre est celui des noms. */
	return rendus.sort(
		(a, b) => Number(a.herite) - Number(b.herite) || a.nom.localeCompare(b.nom, 'fr')
	);
}

/**
 * Les droits d'un dossier, lus en base.
 *
 * DEUX LECTURES, ET LE FILTRE EST DANS LA REQUÊTE (`ADR-006`) : les lignes de
 * `droits_de_dossier` posées sur la CHAÎNE D'ANCÊTRES — aucune autre ne peut gouverner
 * —, et les comptes.
 *
 * LA SECONDE LECTURE EST RABATTUE SUR CE QUE L'APPELANT A LE DROIT DE VOIR.
 * `gererLesDroits` est une capacité LOCALE ; l'annuaire des comptes est une donnée
 * GLOBALE réservée au rôle administrateur. Servir la table entière à quiconque gère un
 * dossier mettrait les identifiants de connexion de toute l'instance dans le DOM,
 * quand la connexion rend un refus unique PRÉCISÉMENT pour interdire cette
 * énumération (`ARB-005`).
 *
 * Deux périmètres, le second par défaut : avec l'annuaire, la table entière, ACTIFS
 * COMME INACTIFS — `RG-M14-08` conserve un compte désactivé et sa ligne de droit lui
 * survit, la masquer laisserait en base un droit que personne ne pourrait retirer ;
 * sans lui, les SEULS comptes déjà portés par une ligne de la chaîne. LES CANDIDATS
 * suivent le même partage : sans annuaire, la liste est VIDE plutôt qu'approchante, et
 * la vue omet « Ajouter un accès » (`P-09`).
 */
export async function lireLesDroitsDUnDossier(
	base: Base,
	demande: {
		readonly dossierId: string;
		readonly lignes: readonly LigneDeDossier[];
		readonly nomDuDomaine: string;
		readonly appelantId: string | null;
		/**
		 * L'appelant peut-il voir l'annuaire des comptes de l'instance ? Le rôle
		 * `administrateur`, et lui seul. Le champ est OBLIGATOIRE : un défaut permissif se
		 * serait oublié à l'appel, un défaut restrictif aurait masqué l'oubli.
		 */
		readonly annuaireLisible: boolean;
		/**
		 * L'appelant tient-il sa gestion de son RÔLE (`RG-DRO-03`) ? Alors aucune
		 * ligne de cette table ne la lui retire.
		 */
		readonly appelantContourne: boolean;
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

	const dotesEnBase = [...new Set(lignesDeDroit.map((l) => l.compteId))];
	const colonnes = {
		id: comptes.id,
		identifiant: comptes.identifiant,
		nom: comptes.nom,
		actif: comptes.actif
	};
	const comptesConnus: LigneDeCompte[] = demande.annuaireLisible
		? await base.select(colonnes).from(comptes)
		: dotesEnBase.length === 0
			? []
			: await base.select(colonnes).from(comptes).where(inArray(comptes.id, dotesEnBase));

	const index = indexerLesDroits(demande.lignes, lignesDeDroit);
	const accordes = droitsResolusDUnDossier(
		index,
		demande.lignes,
		demande.dossierId,
		comptesConnus,
		demande.nomDuDomaine,
		/* `soiMeme` marque la ligne SUR LAQUELLE LE SERVEUR REFUSERA — pas celle de
		   l'appelant. Quand sa gestion vient de son rôle, aucun geste ne la menace,
		   et omettre le retrait serait omettre un geste possible. */
		demande.appelantContourne ? null : demande.appelantId
	);
	const dotes = new Set(accordes.map((d) => d.identifiant));
	const candidats = demande.annuaireLisible
		? comptesConnus
				.filter((c) => c.actif && !dotes.has(c.identifiant))
				.map((c) => ({ identifiant: c.identifiant, nom: c.nom, initiales: initialesDuNom(c.nom) }))
				.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
		: [];

	return { accordes, candidats, annuaire: demande.annuaireLisible };
}

export interface RefusDEcriture {
	readonly fait: false;
	readonly message: string;
}

/**
 * Le refus sans message — un droit qui manque ne se raconte pas. `RG-ACC-04` veut
 * qu'un refus et une inexistence soient indiscernables : la route traduit cette valeur
 * en `404`, et le message ne voyage pas.
 *
 * Valeur UNIQUE et gelée, pour la raison qui fait d'`INTROUVABLE` un objet unique.
 */
export const REFUS_MUET: RefusDEcriture = Object.freeze({ fait: false, message: '' });

export interface DeplacementFait {
	readonly fait: true;
	readonly segments: readonly string[];
}

export interface DemandeDeDeplacement {
	readonly dossierId: string;
	readonly destinationId: string;
	readonly nom: string;
	readonly lignes: readonly LigneDeDossier[];
	readonly droit: (dossierId: string) => DroitDeDossier | null;
}

/**
 * Renomme et déplace — un seul geste, parce que le gel n'en fait qu'un :
 * `#dlg-deplacer`, un champ de nom, une destination, un bouton.
 *
 * QUATRE PORTES, DANS CET ORDRE, ET AUCUNE N'EST FACULTATIVE.
 *
 *  1. LE DROIT SUR LE DOSSIER DÉPLACÉ — `administrerLeDossier` (`CDC` §2.3).
 *  2. LE DROIT SUR LA DESTINATION — `creerDesSousDossiers` : un dossier qui arrive
 *     dans un autre y devient un sous-dossier, et des deux lectures possibles c'est la
 *     plus FERMÉE.
 *  3. LA FORME — nom non vide, destination recevable (`RG-STR-04`, `RG-STR-05`), aucun
 *     frère de même adresse : le refus porte sur l'ADRESSE, deux noms distincts
 *     pouvant donner le même `identifiantLisible()`.
 *  4. L'ÉCRITURE, EN UNE TRANSACTION. SES DESCENDANTS CHANGENT DE PROFONDEUR AVEC LUI :
 *     `dossiers_profondeur_plafonnee` porte sur chaque ligne, non sur la seule qu'on
 *     déplace.
 *
 * LA RACINE NE SE DÉPLACE PAS ET NE SE RENOMME PAS ICI.
 */
export async function renommerOuDeplacerUnDossier(
	base: Base,
	demande: DemandeDeDeplacement
): Promise<DeplacementFait | RefusDEcriture> {
	const parId = new Map(demande.lignes.map((d) => [d.id, d]));
	const dossier = parId.get(demande.dossierId);
	const destination = parId.get(demande.destinationId);
	if (dossier === undefined || dossier.parentId === null) return REFUS_MUET;

	/* LE DROIT SUR LE DOSSIER PASSE AVANT TOUTE LECTURE DE FORMULAIRE : un appelant
	   sans droit qui posterait un formulaire VIDE recevrait sinon « Choisissez une
	   destination », c'est-à-dire la confirmation que le dossier existe.
	   `RG-ACC-04` veut que rien ne distingue le refus de l'inexistence. */
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

/**
 * Le nom saisi ne correspond pas — `RG-M03-04`. Le message n'est pas du gel, qui
 * DÉSACTIVE le bouton tant que la saisie diffère (`V-13:2366-2368`). Le contrôle
 * serveur est le filet, et un filet muet ne dirait pas pourquoi rien ne s'est passé.
 */
export const SAISIE_NON_CONFORME = 'Le nom saisi ne correspond pas à celui du dossier.';

/**
 * CE QUI EST PARTI AVEC LE DOSSIER, EN CLAIR — le décompte que l'écran de confirmation a
 * déjà montré. Les postes à zéro sont TUS : un dossier vide détruit seul n'a pas de détail.
 */
function detailDuDossier(sousDossiers: number, notesDetruites: number): string {
	const postes: string[] = [];
	if (sousDossiers > 0) {
		postes.push(`${String(sousDossiers)} ${accord(sousDossiers, 'sous-dossier')}`);
	}
	if (notesDetruites > 0) {
		postes.push(`${String(notesDetruites)} ${accord(notesDetruites, 'note')}`);
	}
	return postes.join(', ');
}

export interface DemandeDeSuppressionDeDossier {
	readonly dossierId: string;
	/** Le nom saisi par l'utilisateur — `RG-M03-04`, « le nom exact ». */
	readonly saisie: string;
	readonly lignes: readonly LigneDeDossier[];
	readonly droit: (dossierId: string) => DroitDeDossier | null;
	/** `RG-NF-05` — l'auteur, jusque dans la transaction qui détruit. */
	readonly identite: Identite;
}

export interface SuppressionDeDossierFaite {
	readonly fait: true;
	readonly nom: string;
	readonly dossiersDetruits: number;
	readonly notesDetruites: number;
	/** Les segments affichés du dossier PARENT — la cible du `303`. */
	readonly segmentsDuParent: readonly string[];
}

/**
 * Détruit un dossier, son sous-arbre et leurs notes — `RG-M03-04`.
 *
 * QUATRE PORTES, DANS CET ORDRE.
 *
 *  1. LE DROIT — `administrerLeDossier`. Le refus est MUET (`RG-ACC-04`).
 *  2. LE NOM EXACT — comparaison stricte, sans rognage ni pliage de casse.
 *  3. CE QUI VA DISPARAÎTRE EST LU AVANT : la transaction passée, plus rien n'est
 *     lisible pour le dire.
 *  4. L'ATOMICITÉ. L'ordre des deux suppressions compte : `notes.dossier_id` est en
 *     `ON DELETE RESTRICT`, donc les notes partent d'abord ; les sous-dossiers partent
 *     seuls, `dossiers_parent_meme_domaine` étant en `ON DELETE CASCADE`.
 *
 * LA RACINE D'UN DOMAINE NE SE SUPPRIME PAS ICI — sa disparition emporterait le
 * domaine entier. Le refus est muet.
 *
 * L'INDEX SUIT LA TRANSACTION, JAMAIS DEDANS : `entretenirLIndex()` DÉDUIT de la base
 * ce qui a disparu, et rien ici ne lui dit quoi oublier.
 *
 * CE QU'ELLE NE FAIT PAS : les OCTETS des pièces jointes restent sur le disque. La
 * cascade emporte les lignes, pas les fichiers.
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

	/* `RG-NF-05` — l'auteur est exigé AVANT la transaction : un refus tombe avant
	   toute destruction, jamais au milieu. */
	const auteur = auteurDeLaSuppression(demande.identite);

	await base.transaction(async (tx) => {
		await tx.delete(notes).where(inArray(notes.dossierId, identifiantsDeDossier));
		await tx.delete(dossiers).where(eq(dossiers.id, dossier.id));
		/* LA TRACE PARTAGE LA TRANSACTION. Le détail reprend ce que l'écran de
		   confirmation a montré — le sous-arbre entier, pas le seul dossier visé. */
		await tracerUneSuppression(tx, {
			objet: 'dossier',
			reference: dossier.id,
			designation: dossier.nom,
			detail: detailDuDossier(branche.length - 1, detruites.length),
			auteur
		});
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

/**
 * Les trois niveaux, et rien d'autre — l'énumération de base reprise en crible. `null`
 * sur tout le reste, jamais un niveau par défaut : se tromper de défaut, ici, c'est
 * accorder un droit.
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
 * `RG-M14-08` — « un compte désactivé perd IMMÉDIATEMENT l'accès ». Lui accorder un
 * droit ne lui ouvrirait rien et ferait croire le contraire à qui l'accorde.
 */
export const COMPTE_DESACTIVE = 'Ce compte est désactivé : il ne peut recevoir aucun droit.';

/**
 * Le droit visé n'est pas posé sur ce dossier — il est hérité, ou il n'existe pas.
 * « Retirer un droit explicite ne retire pas un droit hérité […] il faut la retirer là
 * où elle a été accordée » (`V-40:1220`). Un succès silencieux qui ne retirerait rien
 * ferait croire l'accès fermé.
 */
export const DROIT_NON_PROPRE =
	"Ce droit n'est pas posé sur ce dossier : il est hérité. Il se change là où il a été accordé.";

/**
 * Un gestionnaire ne se ferme pas la porte, et rien dans le schéma ne l'en empêche :
 * retirer ou abaisser son propre droit de gestion le laisserait sans recours DANS LE
 * PRODUIT — aucun écran de console ne touche `droits_de_dossier`.
 */
export const AUTO_RETRAIT_DE_GESTION =
	'Vous ne pouvez pas retirer ni abaisser votre propre droit de gestion sur ce dossier : plus aucun écran ne vous le rendrait.';

export interface DroitEcrit {
	readonly fait: true;
	readonly nom: string;
	/** Le niveau désormais posé, `null` après un retrait. */
	readonly niveau: DroitDeDossier | null;
}

export interface DemandeDeDroit {
	readonly dossierId: string;
	readonly identifiantDuCompte: string;
	readonly niveau: DroitDeDossier | null;
	readonly droit: (dossierId: string) => DroitDeDossier | null;
	/** Le compte de l'appelant, `null` en anonyme — le refus d'auto-retrait le lit. */
	readonly appelantId: string | null;
	/**
	 * L'appelant tient-il sa gestion de son RÔLE ? `contourneLesDroitsDeDossier()` est
	 * la seule écriture de `RG-DRO-03`. C'est ce qui décide si `AUTO_RETRAIT_DE_GESTION`
	 * s'applique : un gestionnaire qui tient sa gestion d'une ligne de la table se ferme
	 * la porte en s'abaissant, un administrateur ne se ferme rien.
	 */
	readonly appelantContourne: boolean;
	/**
	 * L'appelant peut-il voir l'annuaire des comptes ? Le même périmètre qu'à la
	 * lecture, et il gouverne ici DEUX choses. L'ACCORD, parce qu'accorder c'est NOMMER
	 * un compte qui n'a aucun droit ici : sans l'annuaire, il n'y a personne à nommer.
	 * Et le MESSAGE de refus des deux autres, pour la raison qui fait de « identifiant
	 * inconnu » et « mot de passe faux » un refus UNIQUE à la connexion (`ARB-005`) :
	 * deux messages distincts rendraient à l'unité l'énumération refusée en bloc.
	 */
	readonly annuaireLisible: boolean;
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
 * Le refus d'un identifiant qui ne désigne aucun compte, sur les deux gestes qui
 * visent une ligne DÉJÀ POSÉE : « aucun compte ne porte cet identifiant » à qui a le
 * droit de le savoir, « ce droit n'est pas posé sur ce dossier » aux autres — les deux
 * causes deviennent indiscernables (`ARB-005`).
 */
function refusDUnIdentifiantSansCompte(demande: DemandeDeDroit): string {
	return demande.annuaireLisible ? COMPTE_INTROUVABLE : DROIT_NON_PROPRE;
}

/**
 * L'appelant se fermerait-il la porte ? — le seul motif d'`AUTO_RETRAIT_DE_GESTION`
 * sur les deux gestes qui POSENT un niveau, en trois conditions : le compte visé est
 * l'appelant ; le niveau posé n'est pas `gestionnaire` ; sa gestion vient de la TABLE,
 * non de son rôle. Sans la troisième, le premier administrateur d'une instance neuve
 * s'entendait refuser l'abaissement d'un droit qu'il ne tenait pas.
 *
 * LE DROIT PROPRE N'EST PAS RELU ICI : posée ou héritée, écrire une ligne PROPRE plus
 * faible la lui retire, `RG-DRO-01` s'arrêtant au droit le plus proche.
 */
function sAbaisseraitLuiMeme(demande: DemandeDeDroit, compteVisee: string): boolean {
	if (compteVisee !== demande.appelantId) return false;
	if (demande.niveau === 'gestionnaire') return false;
	return !demande.appelantContourne;
}

/**
 * Accorder un droit.
 *
 * QUATRE PORTES, DANS CET ORDRE, ET LA PREMIÈRE EST LE DROIT.
 *
 *  1. `capacites().gererLesDroits`. Le refus est MUET (`RG-ACC-04`), et l'ordre n'est
 *     pas cosmétique — un message de forme rendu avant le contrôle de droit dirait à
 *     un rédacteur que le dossier existe.
 *  1 bis. L'ANNUAIRE — accorder, c'est nommer un compte qui n'a aucun droit ici.
 *  2. LE NIVEAU — l'un des trois, ou refus. Jamais de défaut.
 *  3. LE COMPTE — il existe, et il est actif (`RG-M14-08`).
 *  4. L'AUTO-ABAISSEMENT — refusé, voir `sAbaisseraitLuiMeme()`.
 *
 * L'ÉCRITURE EST UNE REPRISE SUR LA CLÉ PRIMAIRE `(dossier_id, compte_id)` : c'est
 * cette unicité qui donne son sens à `RG-DRO-01`, et lire puis écrire laisserait une
 * fenêtre où deux gestionnaires simultanés violeraient la clé.
 */
export async function accorderUnDroitDeDossier(
	base: Base,
	demande: DemandeDeDroit
): Promise<DroitEcrit | RefusDEcriture> {
	if (!capacites(demande.droit(demande.dossierId)).gererLesDroits) return REFUS_MUET;
	/* ACCORDER, C'EST NOMMER UN COMPTE SANS DROIT ICI — donc puiser dans
	   l'annuaire. Qui ne le voit pas n'a personne à nommer, et l'action le refuse
	   du même refus MUET : sinon elle resterait joignable par une adresse
	   construite à la main, et rendrait l'existence des comptes un à un. */
	if (!demande.annuaireLisible) return REFUS_MUET;
	if (demande.niveau === null) return { fait: false, message: NIVEAU_INCONNU };

	const compte = await compteVise(base, demande.identifiantDuCompte);
	if (compte === null) return { fait: false, message: COMPTE_INTROUVABLE };
	if (!compte.actif) return { fait: false, message: COMPTE_DESACTIVE };
	if (sAbaisseraitLuiMeme(demande, compte.id)) {
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
 * Changer le niveau d'un droit déjà posé sur ce dossier. LA DIFFÉRENCE AVEC
 * `accorderUnDroitDeDossier()` TIENT EN UNE PORTE : le droit doit être PROPRE.
 * L'accepter sur un droit hérité écrirait sur ce dossier un droit que personne n'y a
 * accordé.
 */
export async function changerUnDroitDeDossier(
	base: Base,
	demande: DemandeDeDroit
): Promise<DroitEcrit | RefusDEcriture> {
	if (!capacites(demande.droit(demande.dossierId)).gererLesDroits) return REFUS_MUET;
	if (demande.niveau === null) return { fait: false, message: NIVEAU_INCONNU };

	const compte = await compteVise(base, demande.identifiantDuCompte);
	if (compte === null) return { fait: false, message: refusDUnIdentifiantSansCompte(demande) };

	const propre = await droitPropre(base, demande.dossierId, compte.id);
	if (propre === null) return { fait: false, message: DROIT_NON_PROPRE };
	if (sAbaisseraitLuiMeme(demande, compte.id)) {
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
 * Retirer un droit posé sur ce dossier.
 *
 * UN DROIT HÉRITÉ N'A RIEN À SUPPRIMER ICI : un `DELETE` sans ligne correspondante
 * réussit, et l'appelant repartirait convaincu d'avoir fermé un accès resté ouvert.
 *
 * ET UN GESTIONNAIRE NE SE RETIRE PAS SA PROPRE LIGNE : elle est PROPRE, donc elle
 * porte son droit effectif. Sauf s'il tient sa gestion de son RÔLE.
 */
export async function retirerUnDroitDeDossier(
	base: Base,
	demande: DemandeDeDroit
): Promise<DroitEcrit | RefusDEcriture> {
	if (!capacites(demande.droit(demande.dossierId)).gererLesDroits) return REFUS_MUET;

	const compte = await compteVise(base, demande.identifiantDuCompte);
	if (compte === null) return { fait: false, message: refusDUnIdentifiantSansCompte(demande) };

	const propre = await droitPropre(base, demande.dossierId, compte.id);
	if (propre === null) return { fait: false, message: DROIT_NON_PROPRE };
	if (compte.id === demande.appelantId && !demande.appelantContourne) {
		return { fait: false, message: AUTO_RETRAIT_DE_GESTION };
	}

	await base
		.delete(droitsDeDossier)
		.where(
			and(eq(droitsDeDossier.dossierId, demande.dossierId), eq(droitsDeDossier.compteId, compte.id))
		);

	return { fait: true, nom: compte.nom, niveau: null };
}
