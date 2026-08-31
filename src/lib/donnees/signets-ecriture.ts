/**
 * L'ÉCRITURE D'UN SIGNET — créer, modifier, supprimer.
 *
 * UN SIGNET EST UNE NOTE, ET C'EST LE SCHÉMA QUI LE DIT : `notes.signet_adresse` et
 * `notes.signet_ajoute_le` sont deux COLONNES de `notes`, pas une table, et « Signet — lien
 * web curaté » est un TYPE de note. Ce module appelle `creerUneNote()`, avec deux colonnes de
 * plus.
 *
 * LES TROIS VALEURS QUE LE FORMULAIRE GELÉ NE DONNE PAS — `ARB-064` : LE DOSSIER D'ACCUEIL,
 * `RG-STR-03` voulant que toute note appartienne à un dossier, d'où la RACINE du domaine ; LE
 * CORPS, `notes.corps_reference` étant non nul et canonique, d'où la description saisie ; et
 * L'IDENTIFIANT, `ARB-062` sans exception.
 *
 * LE DROIT EST RÉSOLU AILLEURS, ET AVANT : `resoudreLAccesAuxSignets()` et
 * `resoudreUnSignet()` le font, par le même chemin que la lecture.
 */
import { and, eq, isNull } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { corpsVide } from '../contenu/corps-vide';
import { dossiers, etiquettesDeNote, notes, typesDeNote } from '../base/schema';
import { analyserMarkdown, markdownDeFormulaire } from '../contenu/markdown';
import { entretenirLIndex } from '../recherche/entretien';
import { retirerDesNotes } from '../recherche/moteur';
import type { Identite, Resolution } from '../droits/resolution';
import { INTROUVABLE } from '../droits/resolution';
import { creerUneNote, etiquetteDuLibelle } from './creation';

/** Le type de note que porte tout signet — `seeds/corpus.ts`, `TypeDeNote`. */
const TYPE_SIGNET = 'Signet';

/** Ce que le formulaire de V-23 porte, une fois lu. */
export interface SaisieDeSignet {
	readonly adresse: string;
	readonly titre: string;
	readonly description: string;
	readonly domaine: string;
	readonly etiquettes: readonly string[];
}

export type LectureDeSignet =
	| { readonly ok: true; readonly saisie: SaisieDeSignet }
	| { readonly ok: false; readonly motif: string };

function texte(champs: FormData, nom: string): string {
	const valeur = champs.get(nom);
	return typeof valeur === 'string' ? valeur.trim() : '';
}

/**
 * L'ADRESSE EST LE SEUL CHAMP DONT LA FORME SE CONTRÔLE, et elle se contrôle par
 * l'analyseur d'adresses de la plateforme, jamais par une expression régulière écrite
 * ici. Seuls `http` et `https` sont admis : un `javascript:` collé dans ce champ
 * serait servi ensuite à tous les lecteurs du domaine.
 */
export function adresseDeSignet(brut: string): string | null {
	let analysee: URL;
	try {
		analysee = new URL(brut);
	} catch {
		return null;
	}
	return analysee.protocol === 'http:' || analysee.protocol === 'https:' ? analysee.href : null;
}

export function etiquettesDeSaisie(brut: string): readonly string[] {
	const vues = new Set<string>();
	for (const morceau of brut.split(',')) {
		const libelle = morceau.trim();
		if (libelle !== '' && !vues.has(libelle)) vues.add(libelle);
	}
	return [...vues];
}

export function lireLaSaisieDeSignet(champs: FormData): LectureDeSignet {
	const adresse = adresseDeSignet(texte(champs, 'adresse'));
	if (adresse === null) return { ok: false, motif: 'adresse invalide' };

	const titre = texte(champs, 'titre');
	if (titre === '') return { ok: false, motif: 'titre manquant' };

	const domaine = texte(champs, 'domaine');
	if (domaine === '') return { ok: false, motif: 'domaine manquant' };

	return {
		ok: true,
		saisie: {
			adresse,
			titre,
			description: texte(champs, 'description'),
			domaine,
			etiquettes: etiquettesDeSaisie(texte(champs, 'etiquettes'))
		}
	};
}

/** Le dossier RACINE d'un domaine — le point d'accueil d'`ARB-064` §1. */
export async function racineDuDomaine(base: Base, domaineId: string): Promise<string | null> {
	const [ligne] = await base
		.select({ id: dossiers.id })
		.from(dossiers)
		.where(and(eq(dossiers.domaineId, domaineId), isNull(dossiers.parentId)))
		.limit(1);
	return ligne?.id ?? null;
}

/** L'identifiant du type de note « Signet », tel que la base le porte. */
export async function typeSignet(base: Base): Promise<string | null> {
	const [ligne] = await base
		.select({ id: typesDeNote.id })
		.from(typesDeNote)
		.where(eq(typesDeNote.nom, TYPE_SIGNET))
		.limit(1);
	return ligne?.id ?? null;
}

export interface DemandeDeSignet {
	readonly saisie: SaisieDeSignet;
	readonly domaineId: string;
	readonly identite: Identite;
	readonly maintenant: Date;
}

/**
 * @throws MarkdownInvalide, DocumentInvalide — la description est refusée,
 *   jamais réparée (`ADR-003`).
 */
export async function creerUnSignet(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeSignet
): Promise<Resolution<{ identifiant: string }>> {
	const [dossierId, typeDeNoteId] = await Promise.all([
		racineDuDomaine(base, demande.domaineId),
		typeSignet(base)
	]);
	if (dossierId === null || typeDeNoteId === null) return INTROUVABLE;

	const fait = await creerUneNote(base, client, {
		saisie: {
			titre: demande.saisie.titre,
			type: TYPE_SIGNET,
			domaine: demande.saisie.domaine,
			dossier: '',
			visibilite: null,
			statut: null,
			etiquettes: demande.saisie.etiquettes,
			corps: demande.saisie.description,
			/* Le formulaire d'un signet n'a pas d'éditeur : sa description est du
			   texte, jamais un document. */
			corpsDocument: null,
			/* UN SIGNET N'EST PAS UNE FICHE — `TYPE_SIGNET` est son type de note, et
			   l'écran de V-13 n'offre aucun type de fiche. Les deux champs sont donc
			   vides, et la note s'écrit sans propriétés typées. */
			fiche: null,
			proprietes: null,
			/* UN SIGNET NE PART D'AUCUN SQUELETTE : V-13 n'offre pas le choix de
			   départ, et il n'y a donc aucune provenance à consigner. */
			template: null
		},
		cible: {
			typeDeNoteId,
			domaineId: demande.domaineId,
			dossierId,
			typeDeFicheId: null,
			proprietesTypees: null,
			templateId: null
		},
		identite: demande.identite,
		maintenant: demande.maintenant,
		signet: { adresse: demande.saisie.adresse, ajouteLe: demande.maintenant }
	});
	if (!fait.trouve) return INTROUVABLE;
	return { trouve: true, ressource: { identifiant: fait.ressource.identifiant } };
}

/**
 * L'IDENTIFIANT NE BOUGE JAMAIS, quoi qu'il advienne du titre — `RG-M03-03`,
 * `ARB-062` §2.6. Le DOMAINE non plus : le déplacer supposerait le droit de rédaction
 * sur les deux domaines (`RG-M05-09`), et l'écran ne l'offre pas. Le champ est lu,
 * comparé, et un domaine différent est refusé plutôt que subi.
 */
export async function enregistrerUnSignet(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeSignet & { readonly identifiant: string }
): Promise<Resolution<{ identifiant: string }>> {
	const [ligne] = await base
		.select({ id: notes.id, domaineId: notes.domaineId })
		.from(notes)
		.where(eq(notes.identifiant, demande.identifiant))
		.limit(1);
	if (ligne === undefined || ligne.domaineId !== demande.domaineId) return INTROUVABLE;

	const description = markdownDeFormulaire(demande.saisie.description);
	const corps = description.trim() === '' ? corpsVide() : analyserMarkdown(description);

	await base.transaction(async (tx) => {
		await tx
			.update(notes)
			.set({
				titre: demande.saisie.titre,
				corpsReference: corps,
				signetAdresse: demande.saisie.adresse,
				modifieLe: demande.maintenant,
				corpsReferenceModifieLe: demande.maintenant
			})
			.where(eq(notes.id, ligne.id));

		/* LA LISTE SOUMISE REMPLACE LA LISTE COURANTE — c'est le seul moyen de
		   retirer une étiquette depuis un écran qui n'a qu'un bouton
		   d'enregistrement. Même règle que la modification d'une note. */
		await tx.delete(etiquettesDeNote).where(eq(etiquettesDeNote.noteId, ligne.id));
		let ordre = 0;
		for (const libelle of demande.saisie.etiquettes) {
			const etiquetteId = await etiquetteDuLibelle(tx as unknown as Base, libelle);
			await tx.insert(etiquettesDeNote).values({ noteId: ligne.id, etiquetteId, ordre });
			ordre += 1;
		}
	});

	/* L'index APRÈS la transaction, jamais dedans : une transaction annulée ne
	   peut pas laisser un index amputé. */
	await entretenirLIndex(base, client, [demande.identifiant]);
	return { trouve: true, ressource: { identifiant: demande.identifiant } };
}

/**
 * La destruction est atomique et définitive : il n'y a pas de corbeille
 * (`RG-M14-03`). Les sept clés étrangères qui référencent `notes.id` sont en
 * cascade — étiquettes, relations dans les deux sens, pièces jointes,
 * vérifications, consultations, versions —, donc le schéma fait le travail.
 */
export async function supprimerUnSignet(
	base: Base,
	client: Meilisearch,
	identifiant: string,
	domaineId: string
): Promise<Resolution<{ identifiant: string }>> {
	const [ligne] = await base
		.select({ id: notes.id, domaineId: notes.domaineId })
		.from(notes)
		.where(eq(notes.identifiant, identifiant))
		.limit(1);
	if (ligne === undefined || ligne.domaineId !== domaineId) return INTROUVABLE;

	await base.transaction(async (tx) => {
		await tx.delete(notes).where(eq(notes.id, ligne.id));
	});

	/* Après la transaction — le contenu détruit disparaît immédiatement de la
	   recherche (`RG-M14-05`). */
	await retirerDesNotes(client, [identifiant], 'soumettre');
	return { trouve: true, ressource: { identifiant } };
}
