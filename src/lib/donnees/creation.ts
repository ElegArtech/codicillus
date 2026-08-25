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
 * LE TYPE DE FICHE EST LU, ET IL NE L'ÉTAIT PAS — `ECART-048` É-1 REFERMÉ
 *
 * Le contrat de soumission de `T-079` §3 excluait le type de fiche et les
 * propriétés typées. La conséquence n'était pas une nuance : le sélecteur
 * « Type de fiche » de V-17 affichait les VRAIS types de l'instance, et sa
 * valeur ne quittait jamais l'écran. `notes.type_de_fiche_id` n'était donc posé
 * par AUCUNE route — la seule écriture atteignable, `administration.ts:936`,
 * est une nullification —, `proprietes_typees` restait vide à jamais,
 * `/console/types-de-fiches` comptait tout type comme inutilisé, le panneau de
 * propriétés de la cartographie ne s'ouvrait jamais, et la facette `typeFiche`
 * de la recherche était vide en permanence. Un référentiel entier que le
 * produit remplissait et auquel aucune note ne se raccrochait.
 *
 * Les deux champs sont lus, résolus et écrits ici. La contrainte croisée
 * (`notes_proprietes_exigent_un_type_de_fiche`) est tenue AVANT la base —
 * `ADR-003` —, et les clés sont filtrées sur `champs_de_type_de_fiche` : le
 * `jsonb` n'est contraint par rien d'autre.
 */
import { eq } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { corpsVide } from '../base/semence';
import { documentDepuisNoeud, noeudDepuisDocument } from '../edition/document';
import {
	champsDeTypeDeFiche,
	domaines,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	notes,
	typesDeFiche,
	typesDeNote,
	versions
} from '../base/schema';
import { versionDUnEnregistrement } from '../edition/enregistrement';
import { analyserMarkdown, markdownDeFormulaire } from '../contenu/markdown';
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
	/**
	 * Le document canonique reçu de l'ÉDITEUR, ou `null`. Exclusif du précédent :
	 * `corpsSoumis()` le garantit, et `P-35` dit pourquoi les deux ne portent pas
	 * le même nom.
	 */
	readonly corpsDocument: unknown;
	/**
	 * LE NOM DU TYPE DE FICHE CHOISI, ou `null` — « Aucun — note simple ».
	 *
	 * C'est un NOM, comme le type de note et le domaine : le formulaire gelé
	 * n'envoie que des noms, et `types_de_fiche.nom` est unique
	 * (`002_socle.montee.sql:240-247`). La résolution en identifiant se fait
	 * dans `resoudreLaCible()`, avec les deux autres.
	 */
	readonly fiche: string | null;
	/**
	 * CE QUE LA NOTE MET DANS LES CHAMPS DE SON TYPE, ou `null`.
	 *
	 * Les clés ne sont PAS contrôlées ici : le contrôle demande le référentiel,
	 * donc la base, et cette fonction est pure. `resoudreLaCible()` filtre sur
	 * les clés réelles de `champs_de_type_de_fiche` — le `jsonb` n'est pas
	 * contraint, et rien d'autre ne le ferait.
	 */
	readonly proprietes: Readonly<Record<string, string>> | null;
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
 * LE MARKDOWN SOUMIS, sous l'un ou l'autre de ses deux noms. Voir la note de
 * `lireLaSaisie()` : `corps-markdown` fait foi, `corps` reste admis.
 */
function texteDuCorps(formulaire: FormData): string {
	const valeur = formulaire.get('corps-markdown');
	/* `markdownDeFormulaire()` défait la normalisation du sérialiseur du
	   navigateur, et rien d'autre : voir son en-tête, et `P-26` pour la raison
	   qu'elle ne vit pas dans l'analyseur. */
	return typeof valeur === 'string' ? markdownDeFormulaire(valeur) : '';
}

/**
 * LE DOCUMENT SÉRIALISÉ, quand c'est l'ÉDITEUR qui a écrit le corps.
 *
 * Deux noms, deux formats, et jamais l'inverse — `P-35` a coûté une note créée
 * vide, en 303, parce que deux contrats du même jour appelaient `corps` deux
 * choses différentes :
 *
 *   `corps`           le document canonique sérialisé — ce que l'éditeur produit
 *   `corps-markdown`  du Markdown — ce qu'une zone de saisie nue produit
 *
 * Les deux ensemble sont refusés : personne ne peut avoir écrit deux corps.
 */
export function corpsSoumis(formulaire: FormData): { markdown: string; document: unknown } {
	const brut = formulaire.get('corps');
	if (typeof brut !== 'string' || brut === '')
		return { markdown: texteDuCorps(formulaire), document: null };
	if (typeof formulaire.get('corps-markdown') === 'string' && texteDuCorps(formulaire) !== '') {
		throw new SyntaxError('deux corps soumis');
	}
	return { markdown: '', document: JSON.parse(brut) };
}

/**
 * LES PROPRIÉTÉS TYPÉES SOUMISES — une table de chaînes, ou un refus.
 *
 * Le champ transporte du JSON parce qu'un formulaire ne sait pas transporter
 * une table : `poserChamp()` (`../cablage/formulaires.ts`) le sérialise, et le
 * geste inverse est ici. Ce qui n'est pas une table de valeurs SIMPLES est
 * refusé plutôt que rogné — `ADR-003`, rien d'invalide n'entre en base — et les
 * valeurs sont ramenées à leur texte, forme unique de la colonne
 * (`lireLesProprietesDeFiche()`, `./lecture.ts`).
 */
export function proprietesSoumises(
	brut: string
): { readonly ok: true; readonly valeurs: Record<string, string> } | { readonly ok: false } {
	if (brut === '') return { ok: true, valeurs: {} };
	let lu: unknown;
	try {
		lu = JSON.parse(brut);
	} catch {
		return { ok: false };
	}
	if (typeof lu !== 'object' || lu === null || Array.isArray(lu)) return { ok: false };
	const valeurs: Record<string, string> = {};
	for (const [cle, valeur] of Object.entries(lu as Record<string, unknown>)) {
		if (typeof valeur === 'string') {
			if (valeur !== '') valeurs[cle] = valeur;
		} else if (typeof valeur === 'number' || typeof valeur === 'boolean') {
			valeurs[cle] = String(valeur);
		} else {
			return { ok: false };
		}
	}
	return { ok: true, valeurs };
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

	/* LE TYPE DE FICHE EST FACULTATIF — le sélecteur du gel s'ouvre sur « Aucun
	   — note simple », et une note simple est le cas ordinaire.

	   LA CONTRAINTE CROISÉE EST TENUE ICI, AVANT LA BASE (`ADR-003`) :
	   `notes_proprietes_exigent_un_type_de_fiche` (`002_socle.montee.sql:380`)
	   refuse des propriétés sans type. Laisser passer ferait remonter la
	   violation en 500, sans nommer ce qui manque. */
	const fiche = texte(formulaire, 'fiche');
	const proprietes = proprietesSoumises(texte(formulaire, 'proprietes'));
	if (!proprietes.ok) return { ok: false, motif: 'propriétés illisibles' };
	if (fiche.length === 0 && Object.keys(proprietes.valeurs).length > 0) {
		return { ok: false, motif: 'propriétés sans type de fiche' };
	}

	let soumis: { markdown: string; document: unknown };
	try {
		soumis = corpsSoumis(formulaire);
	} catch {
		/* Deux corps soumis, ou un document illisible : refus de forme, pas de
		   refus de format — rien n'a encore atteint la porte du document. */
		return { ok: false, motif: 'corps illisible' };
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
			   blanche, et `analyserMarkdown()` est seul juge de ce qu'il lit.

			   DEUX NOMS POUR UN SEUL CHAMP, et ce n'est pas une hésitation. Le
			   contrat de `T-079` nommait ce champ `corps` ; celui de `T-081` —
			   l'ÉCRAN JUMEAU, la même vue V-17 — nomme `corps-markdown` le
			   Markdown et réserve `corps` au document sérialisé de l'éditeur. Un
			   câblage unique sert les deux adresses (`ARB-063`), et il ne peut
			   pas envoyer un nom ici et un autre là. `corps-markdown` fait donc
			   foi, `corps` reste admis pour ce qu'écrivait le contrat de ce lot.
			   Mesuré : sans cette ligne, une création par le navigateur écrit un
			   corps VIDE sans que rien ne s'en plaigne — le champ était envoyé,
			   il n'était simplement pas lu. */
			corps: soumis.markdown,
			corpsDocument: soumis.document,
			fiche: fiche.length > 0 ? fiche : null,
			proprietes: fiche.length > 0 ? proprietes.valeurs : null
		}
	};
}

/* ═══════════════════════════════════════════ La cible en base ══════════ */

/** Les références que la saisie désigne par des NOMS, résolues en base. */
export interface CibleDeCreation {
	readonly typeDeNoteId: string;
	readonly domaineId: string;
	readonly dossierId: string;
	/** Le type de fiche choisi, ou `null` — la note est simple. */
	readonly typeDeFicheId: string | null;
	/**
	 * Les propriétés RETENUES — celles dont la clé existe vraiment dans
	 * `champs_de_type_de_fiche` pour ce type. `null` quand la note est simple :
	 * `notes_proprietes_exigent_un_type_de_fiche` l'exige, et un objet vide
	 * porté par une note simple violerait la contrainte.
	 */
	readonly proprietesTypees: Readonly<Record<string, string>> | null;
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

	/* LA RACINE D'UN DOMAINE EST UNE DESTINATION VALABLE — et `resoudreLeChemin()`
	   n'en veut pas, à raison : elle sert D'ABORD à résoudre une ADRESSE
	   (`/univers/{u}/{d}/dossiers/{chemin…}`), où un chemin vide ne désigne rien.
	   Créer une note est un autre usage : un domaine tout neuf n'a que sa racine,
	   et il faut bien y écrire la première note.

	   MESURÉ LE 21/08/2026 sur une instance neuve : le sélecteur proposait la
	   racine — seul dossier existant —, et l'enregistrement rendait 404. Le
	   rédacteur ne pouvait écrire nulle part.

	   Le chemin soumis nomme la racine par son nom de domaine, comme le fait
	   l'arborescence de choix. On le retire donc en tête, et ce qui reste se
	   résout comme avant. */
	const racine = lignes.find((d) => d.parentId === null) ?? null;
	let segments = segmentsDeDossier(saisie.dossier).map(identifiantLisible);
	if (racine !== null && segments[0] === identifiantLisible(racine.nom)) {
		segments = segments.slice(1);
	}
	const dossier = segments.length === 0 ? racine : resoudreLeChemin(lignes, segments);
	if (dossier === null) return null;

	const fiche = await resoudreLeTypeDeFiche(base, saisie);
	if (fiche === null) return null;

	return {
		typeDeNoteId: type.id,
		domaineId,
		dossierId: dossier.id,
		typeDeFicheId: fiche.typeDeFicheId,
		proprietesTypees: fiche.proprietesTypees
	};
}

/**
 * LE TYPE DE FICHE QU'UNE SAISIE DÉSIGNE, ET LES PROPRIÉTÉS QU'IL AUTORISE.
 *
 * `null` est le refus, comme pour les trois autres références : un nom de type
 * de fiche INCONNU est refusé, jamais ignoré. L'ignorer écrirait une note
 * simple là où l'utilisateur a choisi une fiche, et rien à l'écran ne le
 * dirait — c'est exactement la famille de défauts que ce lot referme.
 *
 * LES PROPRIÉTÉS SONT FILTRÉES SUR LES CLÉS RÉELLES du type.
 * `notes.proprietes_typees` est un `jsonb` : la base n'y contraint aucune clé,
 * et une soumission composée à la main y écrirait ce qu'elle veut. Ce qui n'est
 * pas un champ du type est ÉCARTÉ — pas refusé : le référentiel est
 * administrable (M14), un champ retiré en console entre les deux moments d'une
 * saisie ferait sinon échouer un enregistrement que rien n'a rendu faux.
 */
async function resoudreLeTypeDeFiche(
	base: Base,
	saisie: SaisieDeNote
): Promise<{
	readonly typeDeFicheId: string | null;
	readonly proprietesTypees: Readonly<Record<string, string>> | null;
} | null> {
	if (saisie.fiche === null) return { typeDeFicheId: null, proprietesTypees: null };
	const [type] = await base
		.select({ id: typesDeFiche.id })
		.from(typesDeFiche)
		.where(eq(typesDeFiche.nom, saisie.fiche))
		.limit(1);
	if (type === undefined) return null;

	const clesConnues = await base
		.select({ cle: champsDeTypeDeFiche.cle })
		.from(champsDeTypeDeFiche)
		.where(eq(champsDeTypeDeFiche.typeDeFicheId, type.id));
	const retenues = retenirLesProprietes(
		saisie.proprietes ?? {},
		clesConnues.map((c) => c.cle)
	);
	return {
		typeDeFicheId: type.id,
		proprietesTypees: Object.keys(retenues).length === 0 ? null : retenues
	};
}

/**
 * LES PROPRIÉTÉS QUE LE RÉFÉRENTIEL RECONNAÎT — fonction PURE, donc éprouvable
 * dans les deux polarités sans base (`P-5`). Voir `resoudreLeTypeDeFiche()`
 * pour la raison de l'écart plutôt que du refus.
 */
export function retenirLesProprietes(
	soumises: Readonly<Record<string, string>>,
	clesConnues: readonly string[]
): Record<string, string> {
	const retenues: Record<string, string> = {};
	for (const cle of clesConnues) {
		const valeur = soumises[cle];
		if (valeur !== undefined && valeur !== '') retenues[cle] = valeur;
	}
	return retenues;
}

/* ═══════════════════════════════════════════ L'écriture ════════════════ */

/** Le nom de la contrainte qui arbitre l'unicité — `ARB-062` §2.5. */
export const CONTRAINTE_D_IDENTIFIANT = 'notes_identifiant_unique';

/** Le code SQLSTATE d'une violation d'unicité (PostgreSQL, classe 23). */
const VIOLATION_D_UNICITE = '23505';

/**
 * JUSQU'OÙ LA CHAÎNE DES CAUSES EST REMONTÉE.
 *
 * Rien n'interdit à une erreur de se désigner elle-même comme sa propre cause,
 * et l'inspection ci-dessous est appelée depuis la reprise d'une transaction :
 * une boucle infinie y coûterait la requête entière, ce qui est pire que
 * l'échec qu'elle inspecte. Mesuré sur la base, la chaîne réelle fait DEUX
 * niveaux ; huit laissent de la marge à une bibliothèque qui en ajouterait.
 */
const PROFONDEUR_DES_CAUSES = 8;

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
 *
 * LA CHAÎNE DES CAUSES EST PARCOURUE, ET C'EST LE CŒUR DE LA FONCTION. Drizzle
 * n'expose pas l'erreur du pilote : il l'ENVELOPPE dans une erreur à lui et
 * range l'originale sous sa propriété de cause — l'enveloppement vit dans la
 * préparation de requête du pilote PostgreSQL et couvre la branche d'insertion.
 * Lue à plat, l'enveloppe ne porte donc NI code NI nom de contrainte : les deux
 * comparaisons sont fausses, la boucle de reprise ne repart jamais, et un titre
 * déjà pris remonte en 500 au lieu d'obtenir un identifiant suffixé. Mesuré sur
 * la base : deux niveaux, l'enveloppe puis l'erreur du pilote qui porte `23505`
 * et `notes_identifiant_unique`. Ne PAS resimplifier en lecture d'un seul
 * niveau : la profondeur appartient à une bibliothèque, elle peut changer, et
 * le parcours est ce qui rend la fonction indifférente à ce nombre. Le parcours
 * est borné — voir `PROFONDEUR_DES_CAUSES`.
 */
export function estUneCollisionDIdentifiant(cause: unknown): boolean {
	let echec: unknown = cause;
	for (let niveau = 0; niveau < PROFONDEUR_DES_CAUSES; niveau += 1) {
		if (typeof echec !== 'object' || echec === null) return false;
		const erreur = echec as { code?: unknown; constraint?: unknown; cause?: unknown };
		if (erreur.code === VIOLATION_D_UNICITE && erreur.constraint === CONTRAINTE_D_IDENTIFIANT) {
			return true;
		}
		echec = erreur.cause;
	}
	return false;
}

/** Ce qu'une création demande, une fois la cible résolue et le droit acquis. */
export interface DemandeDeCreation {
	readonly saisie: SaisieDeNote;
	readonly cible: CibleDeCreation;
	readonly identite: Identite;
	readonly maintenant: Date;
	/**
	 * L'ADRESSE CURATÉE, quand la note créée est un SIGNET.
	 *
	 * Un signet n'est pas un objet séparé : c'est une note de type « Signet »
	 * qui porte une adresse. Le schéma le dit — `notes.signet_adresse` et
	 * `notes.signet_ajoute_le` sont deux colonnes de `notes`, pas une table —,
	 * et le vocabulaire du produit ne connaît que la Note. Cette création est
	 * donc la même, avec deux colonnes de plus.
	 */
	readonly signet?: { readonly adresse: string; readonly ajouteLe: Date };
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
export function corpsDeLaSaisie(corps: string, document: unknown = null): Document {
	/* LE DOCUMENT DE L'ÉDITEUR PASSE PAR LES DEUX PORTES, comme à
	   l'enregistrement : `noeudDepuisDocument()` contrôle que le schéma de
	   l'éditeur sait le porter, `documentDepuisNoeud()` rend ce que ProseMirror
	   RÉÉCRIT — jamais ce qu'on a reçu. C'est ce qui garantit que deux écritures
	   d'un même document ne peuvent pas cohabiter (règle 1 du format). */
	if (document !== null && document !== undefined) {
		return documentDepuisNoeud(noeudDepuisDocument(document));
	}
	return corps.trim().length === 0 ? corpsVide() : analyserMarkdown(corps);
}

/** L'étiquette d'un libellé, créée si elle n'existe pas — `RG-M12-06`. */
export async function etiquetteDuLibelle(tx: Base, libelle: string): Promise<string> {
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
/**
 * La colonne `signet_ajoute_le` est une DATE, pas un instant : elle porte le
 * jour où le signet est entré au corpus, et rien de plus fin.
 */
function dateSeule(instant: Date): string {
	return instant.toISOString().slice(0, 10);
}

/**
 * LE RÉSUMÉ DE LA PREMIÈRE VERSION — repris du gel, jamais rédigé ici.
 *
 * `RG-M07-01` capture une version « à chaque enregistrement qui modifie le corps
 * Référence » : une création écrit ce corps, de rien vers quelque chose, et elle
 * en écrit donc la version n° 1. Elle ne l'écrivait pas, et c'est pourquoi
 * `versions` portait ZÉRO ligne pour 32 notes — l'historique de V-15 et la
 * comparaison de V-16 n'avaient rien à montrer d'une note créée par le produit.
 *
 * Le résumé n'est PAS inventé : `seeds/corpus.ts:1497` le donne mot pour mot
 * pour `n-migration-bases`, note dont l'unique version est sa création. Il n'est
 * donc pas `RESUME_NON_SAISI` — le vide de `enregistrement.ts` dit « aucun champ
 * ne l'a saisi », et ici le gel l'a écrit.
 */
export const RESUME_DE_CREATION = 'Création de la note';

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
	const corps = corpsDeLaSaisie(demande.saisie.corps, demande.saisie.corpsDocument);
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
						/* LE TYPE DE FICHE ET SES PROPRIÉTÉS — même régime que les deux
						   énumérés : absent ⇒ non écrit, le défaut de colonne s'applique
						   et il vaut `null`. Les deux voyagent ENSEMBLE, résolus par
						   `resoudreLeTypeDeFiche()` : des propriétés sans type
						   violeraient `notes_proprietes_exigent_un_type_de_fiche`. */
						...(demande.cible.typeDeFicheId === null
							? {}
							: { typeDeFicheId: demande.cible.typeDeFicheId }),
						...(demande.cible.proprietesTypees === null
							? {}
							: { proprietesTypees: demande.cible.proprietesTypees }),
						/* UN SEUL INSTANT pour les trois dates — celui de la requête, pris
						   une fois par la route. Trois `now()` de base donneraient trois
						   valeurs voisines et différentes, pour un même geste. */
						creeLe: demande.maintenant,
						modifieLe: demande.maintenant,
						corpsReferenceModifieLe: demande.maintenant,
						...(demande.signet === undefined
							? {}
							: {
									signetAdresse: demande.signet.adresse,
									signetAjouteLe: dateSeule(demande.signet.ajouteLe)
								})
					})
					.returning({ id: notes.id });
				const noteId = (inseres[0] as { id: string }).id;

				/* LA VERSION N° 1 — voir `RESUME_DE_CREATION`. Elle est composée par
				   `versionDUnEnregistrement()`, la MÊME décision que celle de
				   l'enregistrement : un second calcul de numéro, de quantités ou de
				   capture divergerait, et la divergence ne se verrait qu'à
				   l'historique. L'état d'AVANT est l'absence — la note n'existait pas
				   —, ce qui donne « n lignes ajoutées, 0 retirée », exactement la
				   forme que `seeds/corpus.ts:1490-1496` porte pour une création. */
				const version = versionDUnEnregistrement({
					dernierNumero: 0,
					auteurId,
					maintenant: demande.maintenant,
					titre: demande.saisie.titre,
					corps: { reference: corps, operationnel: null },
					avant: { titre: demande.saisie.titre, reference: null, operationnel: null }
				});
				if (version !== null) {
					await tx.insert(versions).values({
						noteId,
						numero: version.numero,
						le: version.le,
						auteurId: version.auteurId,
						resume: RESUME_DE_CREATION,
						ajout: version.ajout,
						retrait: version.retrait,
						titre: version.titre,
						corpsReference: version.corpsReference,
						corpsOperationnel: version.corpsOperationnel
					});
				}

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
