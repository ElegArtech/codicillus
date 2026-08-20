/**
 * LA CRÉATION D'UNE NOTE — ce que `POST /notes/nouvelle` écrit en base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE COMPOSE, IL NE REDÉFINIT RIEN
 *
 *   `../rangement/identifiants.ts`  la forme de l'identifiant (`ARB-062`), en
 *                                   fonctions PURES. L'unicité, elle, est
 *                                   arbitrée ICI, et par la BASE.
 *   `../contenu/markdown.ts`        `analyserMarkdown()`, la porte UNIQUE du
 *                                   texte rédigé vers le format canonique.
 *   `../base/semence.ts`            `corpsVide()`, la seule définition du corps
 *                                   vide du produit (`./histoire.test.ts:158`).
 *   `./rangement.ts`                `resoudreLeChemin()`, la descente d'une
 *                                   arborescence de dossiers, déjà écrite et
 *                                   déjà éprouvée dans les deux polarités.
 *   `./edition.ts`                  `peutEcrireSurLeDossier()`, appelée par la
 *                                   ROUTE : aucune règle de droit n'est écrite
 *                                   dans ce fichier, pas une.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'UNICITÉ EST ARBITRÉE PAR LA CONTRAINTE, JAMAIS PAR UNE LECTURE PRÉALABLE
 *
 * `ARB-062` §2.5 : « la contrainte d'unicité de `notes.identifiant` est le juge ;
 * la boucle d'essai réessaie sur violation de contrainte. Une lecture "cet
 * identifiant est-il pris ?" suivie d'une écriture est une course, et deux
 * créations simultanées du même titre l'exhiberaient — c'est `P-28` dans sa
 * forme la plus banale. »
 *
 * D'où la forme de `creerUneNote()` : une transaction PAR ESSAI, et non une
 * boucle dans une transaction. PostgreSQL abandonne une transaction entière à
 * la première violation de contrainte — un second `insert` dans la même
 * transaction échouerait en `25P02`, sans jamais réessayer quoi que ce soit.
 *
 * LA BOUCLE TERMINE, ET CE N'EST PAS UNE ESPÉRANCE. Elle ne repart QUE sur une
 * violation de `notes_identifiant_unique` — donc uniquement quand l'identifiant
 * du tour est PRIS. Les candidats successifs sont deux à deux distincts
 * (`ARB-062` §2.4 les numérote), et la table en porte un nombre fini : la suite
 * des identifiants pris ne peut pas couvrir la suite infinie des candidats.
 * Aucun plafond d'essais n'est donc écrit — en inventer un serait décider d'un
 * refus qu'`ARB-062` ne connaît pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'INDEX VIENT APRÈS LA TRANSACTION, JAMAIS DEDANS
 *
 * `retirerDesNotes()` (`../recherche/moteur.ts`) le prescrit en majuscules, et
 * `enregistrerLeCorps()` le tient déjà : « une transaction annulée ne peut pas
 * laisser un index amputé ». `ARB-060` fixe le régime : le document est SOUMIS
 * au moteur, sa tâche n'est PAS attendue — cette route est un chemin de
 * requête. Quand `creerUneNote()` rend, la note est écrite et la soumission
 * faite ; elle n'est pas encore trouvable, elle le sera sous les 10 s de
 * `RG-M05-06`. Ne rien conclure d'autre de ce retour.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE LOT NE PREND PAS, ET QUI EST DÉCLARÉ — `ECART-048`
 *
 * Le TYPE DE FICHE et les PROPRIÉTÉS TYPÉES ne sont pas lus (`ECART-048` É-1) :
 * le contrat de soumission de `T-079` §3 les exclut, et le schéma les porte
 * sous une contrainte croisée (`notes_proprietes_exigent_un_type_de_fiche`) que
 * seul un contrat de soumission complet peut honorer. Une note créée est donc
 * une note SIMPLE, jamais une fiche — et `V-17` porte le champ « Type de fiche »
 * qui restera sans effet tant que ce vide n'est pas comblé par arbitrage.
 */
import { eq } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { corpsVide } from '../base/semence';
import {
	domaines,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	notes,
	typesDeNote
} from '../base/schema';
import { analyserMarkdown } from '../contenu/markdown';
import type { Document } from '../contenu/document';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { identifiantDeNote, identifiantSuivant } from '../rangement/identifiants';
import { identifiantLisible, segmentsDeDossier } from '../rangement/adresses';
import { entretenirLIndex } from '../recherche/entretien';
import { resoudreLeChemin, type LigneDeDossier } from './rangement';

/* ═══════════════════════════════════════════ Le contrat de soumission ══ */

/** Les deux visibilités de `CDC` §3.2, telles que la colonne les porte. */
export const VISIBILITES = ['interne', 'publique'] as const;
/** Les deux statuts de `CDC:187`, tels que la colonne les porte. */
export const STATUTS = ['brouillon', 'publiee'] as const;

export type Visibilite = (typeof VISIBILITES)[number];
export type Statut = (typeof STATUTS)[number];

/**
 * LA SOUMISSION, LUE ET RIEN DE PLUS — aucun champ n'est ici deviné, complété
 * ni normalisé au-delà du retrait des blancs de bord.
 *
 * `visibilite` et `statut` sont `null` quand le champ est ABSENT, et c'est une
 * distinction qui compte : `null` laisse le DÉFAUT DE COLONNE s'appliquer, une
 * valeur l'écrase. Écrire ici un défaut en dur ferait une seconde définition du
 * défaut, à côté de celle du schéma.
 */
export interface SaisieDeNote {
	readonly titre: string;
	readonly type: string;
	readonly domaine: string;
	/** Le chemin AFFICHÉ, séparateur ` › `, racine exclue (`./rangement.ts`). */
	readonly dossier: string;
	readonly visibilite: Visibilite | null;
	readonly statut: Statut | null;
	readonly etiquettes: readonly string[];
	/** Le Markdown reçu, tel quel. Vide : la note naît sans corps rédigé. */
	readonly corps: string;
}

/** Ce que la lecture d'un formulaire rend : une saisie, ou le motif du refus. */
export type LectureDeSaisie =
	| { readonly ok: true; readonly saisie: SaisieDeNote }
	| { readonly ok: false; readonly motif: string };

/** La valeur textuelle d'un champ, ou la chaîne vide — jamais un `File`. */
function texte(formulaire: FormData, champ: string): string {
	const valeur = formulaire.get(champ);
	return typeof valeur === 'string' ? valeur.trim() : '';
}

/**
 * LES ÉTIQUETTES D'UNE SAISIE — noms séparés par des virgules.
 *
 * Fonction PURE, et les doublons y sont réduits pour une raison de schéma, non
 * de confort : `etiquettes_de_note_pk` porte sur `(note_id, etiquette_id)`, et
 * deux fois la même étiquette sur une note est une violation de clé primaire.
 * La réduction garde la PREMIÈRE occurrence, donc l'ordre de saisie — que
 * `etiquettes_de_note.ordre` persiste ensuite.
 *
 * La comparaison est EXACTE, casse comprise : `etiquettes_libelle_unique` l'est
 * aussi. « Réseau » et « réseau » sont deux étiquettes en base ; les confondre
 * ici en créerait une troisième définition de l'égalité de deux étiquettes.
 */
export function etiquettesDeSaisie(brut: string): readonly string[] {
	const noms = brut
		.split(',')
		.map((n) => n.trim())
		.filter((n) => n.length > 0);
	return [...new Set(noms)];
}

/**
 * LA LECTURE D'UN FORMULAIRE DE CRÉATION — `T-079` §3, le contrat de
 * soumission, à la lettre et sans un champ de plus.
 *
 * Fonction PURE : elle ne touche pas la base, ne décide d'aucun droit, et rend
 * un motif plutôt que de lever. C'est ce qui la rend éprouvable sans état du
 * dépôt (`P-26`), et c'est la moitié du contrat qu'un test peut opposer.
 *
 * QUATRE CHAMPS SONT OBLIGATOIRES, et leur ordre de contrôle est celui du
 * contrat : titre, type, domaine, dossier. Un champ blanc vaut un champ absent
 * — un titre d'espaces ne rend pas une note trouvable.
 *
 * LES DEUX ÉNUMÉRÉS SONT REFUSÉS HORS DE LEUR DOMAINE plutôt que ramenés à leur
 * défaut : le contrat les donne comme des ensembles fermés de deux valeurs, et
 * une valeur inconnue rabattue silencieusement sur un défaut publierait ce que
 * l'appelant croyait retenir, ou l'inverse.
 */
export function lireLaSaisie(formulaire: FormData): LectureDeSaisie {
	const titre = texte(formulaire, 'titre');
	if (titre.length === 0) return { ok: false, motif: 'titre manquant' };
	const type = texte(formulaire, 'type');
	if (type.length === 0) return { ok: false, motif: 'type manquant' };
	const domaine = texte(formulaire, 'domaine');
	if (domaine.length === 0) return { ok: false, motif: 'domaine manquant' };
	const dossier = texte(formulaire, 'dossier');
	if (dossier.length === 0) return { ok: false, motif: 'dossier manquant' };

	const visibiliteBrute = texte(formulaire, 'visibilite');
	if (visibiliteBrute.length > 0 && !(VISIBILITES as readonly string[]).includes(visibiliteBrute)) {
		return { ok: false, motif: 'visibilité inconnue' };
	}
	const statutBrut = texte(formulaire, 'statut');
	if (statutBrut.length > 0 && !(STATUTS as readonly string[]).includes(statutBrut)) {
		return { ok: false, motif: 'statut inconnu' };
	}

	return {
		ok: true,
		saisie: {
			titre,
			type,
			domaine,
			dossier,
			visibilite: visibiliteBrute.length > 0 ? (visibiliteBrute as Visibilite) : null,
			statut: statutBrut.length > 0 ? (statutBrut as Statut) : null,
			etiquettes: etiquettesDeSaisie(texte(formulaire, 'etiquettes')),
			/* Le corps n'est PAS rogné : un Markdown commence parfois par une ligne
			   blanche, et `analyserMarkdown()` est seul juge de ce qu'il lit. */
			corps: typeof formulaire.get('corps') === 'string' ? String(formulaire.get('corps')) : ''
		}
	};
}

/* ═══════════════════════════════════════════ La cible en base ══════════ */

/** Les trois références que la saisie désigne par des NOMS. */
export interface CibleDeCreation {
	readonly typeDeNoteId: string;
	readonly domaineId: string;
	readonly dossierId: string;
}

/**
 * LA CIBLE QU'UNE SAISIE DÉSIGNE, ou `null` — et `null` est le seul refus.
 *
 * Le formulaire gelé n'envoie que des NOMS : `#m-type` porte `t` (le nom du
 * type), `#m-domaine` porte `d.nom` — relevé sur pièce,
 * `mockups/V-17-editeur.html:2788-2793` : « o.value = d.nom ; o.textContent =
 * d.univers + " › " + d.nom ». L'univers est AFFICHÉ, il n'est pas SOUMIS.
 *
 * CE QUE CELA COÛTE, ET C'EST DÉCLARÉ (`ECART-048` É-3) : `RG-STR-02` n'impose
 * l'unicité d'un domaine qu'AU SEIN de son univers, et le schéma la porte sur
 * le couple. Deux domaines homonymes dans deux univers sont donc écrivables, et
 * un nom seul ne les distingue pas. La résolution REFUSE alors, plutôt que d'en
 * élire un : écrire une note dans un domaine choisi par l'ordre des lignes
 * serait une décision fonctionnelle prise en exécution. Le corpus n'exerce pas
 * ce cas — ses quatre noms de domaine sont distincts.
 *
 * LE CHEMIN DE DOSSIER PASSE PAR `resoudreLeChemin()`, l'implémentation unique,
 * qui compare `identifiantLisible(nom)` à chaque maillon : les segments
 * AFFICHÉS y sont donc convertis avant la descente. C'est la même comparaison
 * des deux côtés, et elle rend « Poste de travail » et « poste-de-travail »
 * équivalents sans qu'une seconde règle d'appariement soit écrite.
 */
export async function resoudreLaCible(
	base: Base,
	saisie: SaisieDeNote
): Promise<CibleDeCreation | null> {
	const [type] = await base
		.select({ id: typesDeNote.id })
		.from(typesDeNote)
		.where(eq(typesDeNote.nom, saisie.type))
		.limit(1);
	if (type === undefined) return null;

	/* DEUX lignes sont lues, pas une : c'est la seule manière de DISTINGUER
	   « aucun domaine de ce nom » de « plusieurs », et donc de refuser le second
	   cas au lieu d'en élire un silencieusement. */
	const homonymes = await base
		.select({ id: domaines.id })
		.from(domaines)
		.where(eq(domaines.nom, saisie.domaine))
		.limit(2);
	if (homonymes.length !== 1) return null;
	const domaineId = (homonymes[0] as { id: string }).id;

	const lignes: readonly LigneDeDossier[] = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			domaineId: dossiers.domaineId,
			nom: dossiers.nom,
			profondeur: dossiers.profondeur
		})
		.from(dossiers)
		.where(eq(dossiers.domaineId, domaineId));

	const segments = segmentsDeDossier(saisie.dossier).map(identifiantLisible);
	const dossier = resoudreLeChemin(lignes, segments);
	if (dossier === null) return null;

	return { typeDeNoteId: type.id, domaineId, dossierId: dossier.id };
}

/* ═══════════════════════════════════════════ L'écriture ════════════════ */

/** Le nom de la contrainte qui arbitre l'unicité — `ARB-062` §2.5. */
export const CONTRAINTE_D_IDENTIFIANT = 'notes_identifiant_unique';

/** Le code SQLSTATE d'une violation d'unicité (PostgreSQL, classe 23). */
const VIOLATION_D_UNICITE = '23505';

/**
 * L'ÉCHEC EST-IL LA COLLISION D'IDENTIFIANT QU'`ARB-062` FAIT RÉESSAYER ?
 *
 * Fonction PURE — elle n'inspecte qu'un objet d'erreur —, donc éprouvable dans
 * les DEUX POLARITÉS sans base (`P-5`) : une violation de
 * `notes_identifiant_unique` fait repartir la boucle, TOUTE AUTRE ERREUR la
 * fait sortir.
 *
 * LA CONTRAINTE EST NOMMÉE, ET CE N'EST PAS UN LUXE. Une transaction de
 * création écrit aussi des étiquettes, et `etiquettes_libelle_unique` peut lever
 * le MÊME code `23505` si deux créations concurrentes créent la même étiquette
 * inconnue. Réessayer sur le code seul ferait boucler indéfiniment sur une
 * cause que le changement d'identifiant ne peut pas lever : la boucle
 * repartirait sans fin sur un candidat neuf et un échec identique.
 */
export function estUneCollisionDIdentifiant(cause: unknown): boolean {
	if (typeof cause !== 'object' || cause === null) return false;
	const erreur = cause as { code?: unknown; constraint?: unknown };
	return erreur.code === VIOLATION_D_UNICITE && erreur.constraint === CONTRAINTE_D_IDENTIFIANT;
}

/** Ce qu'une création demande, une fois la cible résolue et le droit acquis. */
export interface DemandeDeCreation {
	readonly saisie: SaisieDeNote;
	readonly cible: CibleDeCreation;
	readonly identite: Identite;
	readonly maintenant: Date;
}

/** Ce qu'une création rend : l'identifiant, qui est désormais une adresse. */
export interface CreationFaite {
	readonly identifiant: string;
	/** Le rang de l'essai qui a abouti — 1 quand le titre n'a pas de doublon. */
	readonly essais: number;
}

/**
 * LE CORPS RÉDIGÉ, DEPUIS LE MARKDOWN SOUMIS — la porte est unique.
 *
 * Un corps ABSENT ou VIDE ne passe pas par `analyserMarkdown()`, et ce n'est pas
 * un contournement : mesuré, `analyserMarkdown('')` LÈVE — « content : aucun
 * contenu vide : l'absence de contenu s'écrit par l'absence de la clé » — et un
 * document sans `content` est refusé lui aussi. Il n'existe donc pas de
 * « document vide » que le Markdown sache produire. Celui du produit est
 * `corpsVide()` (`../base/semence.ts:239`), un paragraphe sans texte, et
 * `./histoire.test.ts:158` le désigne en propres termes : « le corps vide du
 * produit est celui de `corpsVide()` — un paragraphe sans texte ». Il est
 * REPRIS, jamais réécrit ici.
 *
 * @throws MarkdownInvalide, DocumentInvalide — le corps soumis est refusé,
 *   jamais réparé (`ADR-003`).
 */
export function corpsDeLaSaisie(corps: string): Document {
	return corps.trim().length === 0 ? corpsVide() : analyserMarkdown(corps);
}

/** L'étiquette d'un libellé, créée si elle n'existe pas — `RG-M12-06`. */
async function etiquetteDuLibelle(tx: Base, libelle: string): Promise<string> {
	const [deja] = await tx
		.select({ id: etiquettes.id })
		.from(etiquettes)
		.where(eq(etiquettes.libelle, libelle))
		.limit(1);
	if (deja !== undefined) return deja.id;
	const inseres = await tx.insert(etiquettes).values({ libelle }).returning({ id: etiquettes.id });
	return (inseres[0] as { id: string }).id;
}

/**
 * LA CRÉATION D'UNE NOTE — l'écriture, et rien qu'elle.
 *
 * LE DROIT N'EST PAS VÉRIFIÉ ICI, ET C'EST VOULU. La route le fait AVANT, en
 * deux portes que le contrat de `T-079` §5 ordonne : `resoudreLaCreationDeNote()`
 * — « écrire des notes quelque part » — puis, la cible étant connue,
 * `peutEcrireSurLeDossier()` — le droit sur CE dossier. Les deux refusent par
 * `INTROUVABLE`, au même octet. Cette fonction ne sait rien de tout cela ; elle
 * exige seulement une identité AUTHENTIFIÉE, faute de quoi il n'existe aucun
 * auteur à écrire dans `notes.auteur_id` — la colonne est `NOT NULL` et
 * référence `comptes` en `RESTRICT`. Ce refus-là est le même `INTROUVABLE`.
 *
 * L'ORDRE DES ÉCRITURES DANS LA TRANSACTION : la ligne `notes`, puis les
 * liaisons d'étiquettes, qui la référencent. Une note enregistrée sans ses
 * étiquettes serait une note rangée à moitié, et rien ne le dirait.
 *
 * @throws MarkdownInvalide, DocumentInvalide — le corps soumis est refusé.
 * @throws l'erreur du moteur si l'index n'a pas pu être entretenu. La note est
 *   alors ÉCRITE et non indexée, et l'appelant reçoit l'échec plutôt qu'un
 *   silence — même régime que `enregistrerLeCorps()`, et même écart déclaré :
 *   aucune source ne décrit l'état d'un enregistrement dont l'index a refusé.
 */
export async function creerUneNote(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeCreation
): Promise<Resolution<CreationFaite>> {
	if (demande.identite.type !== 'authentifie') return INTROUVABLE;
	const auteurId = demande.identite.compteId;

	/* LE CORPS EST VALIDÉ AVANT LA PREMIÈRE TRANSACTION : un Markdown illisible
	   ne doit pas coûter un aller-retour en base, et surtout pas un identifiant
	   consommé. `ADR-003` — rien d'invalide n'entre en base. */
	const corps = corpsDeLaSaisie(demande.saisie.corps);
	const candidat = identifiantDeNote(demande.saisie.titre);

	for (let essai = 1; ; essai += 1) {
		const identifiant = identifiantSuivant(candidat, essai);
		try {
			await base.transaction(async (tx) => {
				const inseres = await tx
					.insert(notes)
					.values({
						identifiant,
						titre: demande.saisie.titre,
						corpsReference: corps,
						typeDeNoteId: demande.cible.typeDeNoteId,
						domaineId: demande.cible.domaineId,
						dossierId: demande.cible.dossierId,
						auteurId,
						/* ABSENT ⇒ NON ÉCRIT : le défaut de colonne s'applique, et il
						   n'existe pas d'autre défaut. `visibilite` vaut alors `interne`
						   (`CDC` §3.2), `statut` vaut `publiee` (`CDC:187`, « défaut :
						   publiée » — et le gel de V-17 presse « Publiée » à
						   l'ouverture). Voir `ECART-048` É-4. */
						...(demande.saisie.visibilite === null
							? {}
							: { visibilite: demande.saisie.visibilite }),
						...(demande.saisie.statut === null ? {} : { statut: demande.saisie.statut }),
						/* UN SEUL INSTANT pour les trois dates — celui de la requête, pris
						   une fois par la route. Trois `now()` de base donneraient trois
						   valeurs voisines et différentes, pour un même geste. */
						creeLe: demande.maintenant,
						modifieLe: demande.maintenant,
						corpsReferenceModifieLe: demande.maintenant
					})
					.returning({ id: notes.id });
				const noteId = (inseres[0] as { id: string }).id;

				let ordre = 0;
				for (const libelle of demande.saisie.etiquettes) {
					const etiquetteId = await etiquetteDuLibelle(tx as unknown as Base, libelle);
					await tx.insert(etiquettesDeNote).values({ noteId, etiquetteId, ordre });
					ordre += 1;
				}
			});

			/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
			await entretenirLIndex(base, client, [identifiant]);
			return { trouve: true, ressource: { identifiant, essais: essai } };
		} catch (cause) {
			if (!estUneCollisionDIdentifiant(cause)) throw cause;
			/* L'identifiant est pris. Le tour suivant en propose un autre — et il
			   n'y a rien à défaire : la transaction a été abandonnée entière. */
		}
	}
}
