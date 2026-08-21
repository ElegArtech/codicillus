/**
 * `/guides/{identifiant}` — LA LECTURE PUBLIQUE D'UN GUIDE (V-03).
 *
 * `docs/routes.md` §5.5, deux lignes et elles suffisent :
 *
 *   note publique ET publiée      → **V-03**, dans les QUATRE colonnes
 *   note interne ou brouillon     → **404 V-04**, dans les QUATRE colonnes
 *
 * `ARB-007` A-05 en donne le motif : « une seule adresse, un seul rendu : la
 * session ne change ni la route, ni la vue, ni les états ». Ce chargeur ne lit
 * donc PAS `locals.identite`, et ce n'est pas un oubli : la réponse ne doit
 * dépendre d'aucun cookie. Une branche par persona ne peut pas s'y glisser,
 * puisqu'il n'y a rien à quoi la raccrocher.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE POINT DUR — `V-04:2219`, ET C'EST CETTE ROUTE QUI LE REND MESURABLE
 *
 * « Une adresse inexistante et une note existante non publique doivent produire
 * un rendu strictement identique : c'est la vérification la plus importante de
 * cette vue. »
 *
 * Trois propriétés la tiennent, et aucune n'est déclarative :
 *
 *   1. **une seule requête, la même dans les deux cas** — une projection par
 *      identifiant, SANS CONTENU (`resoudreLeGuide()`). Une note interne coûte
 *      exactement ce que coûte une note absente ;
 *   2. **un seul point de sortie** — `refuserLAdresse()`, dont le type de
 *      retour `never` interdit qu'on reprenne la main pour nuancer ;
 *   3. **un seul écran d'échec** — le composant d'erreur de la racine, qui ne
 *      reçoit ni la ressource, ni la raison, ni l'identifiant demandé.
 *
 * L'ORDRE EST LA PROPRIÉTÉ. Le contenu du guide n'est lu qu'APRÈS le refus, et
 * jamais avant : `ADR-006` interdit « de charger une ressource pour la refuser
 * ensuite », et c'est aussi ce qui empêche la fuite de latence d'`ARB-005`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA PAGE REÇOIT — LE GUIDE DEMANDÉ, ET PLUS LE GUIDE ÉCRIT
 *
 * `T-032` notait ici que V-03 « ne déclare qu'une propriété, `vecteur` », et
 * que son article était la transcription gelée d'une page écrite. La propriété
 * `guide` existe désormais, et ce chargeur la remplit :
 *
 *   · le titre, le type, le domaine, l'auteur — de la couche de lecture, qui
 *     rend les formes de `seeds/corpus.ts` depuis la base ;
 *   · les DEUX CORPS, rendus par `rendreDocument` en contexte **public** —
 *     l'implémentation unique (`ADR-004`), jamais un second convertisseur. Le
 *     contexte décide du sort d'un lien vers une note interne :
 *     `span.lien-prive`, qui ne révèle pas le titre de sa cible (`RG-M17-01`) ;
 *   · le sommaire, DÉDUIT des titres de niveau 2 du corps Référence par
 *     `titres()` de `../contenu/document.ts` — jamais relu sur du HTML ;
 *   · les pièces jointes de la note, et leurs adresses réelles.
 *
 * LES DEUX AXES DE LA PLANCHE VIENNENT DÉSORMAIS DE LA NOTE. `fr` était le
 * niveau de fraîcheur du guide gelé, `c-op` la présence de son registre « En
 * bref » : les deux décrivent LA NOTE AFFICHÉE, et c'est elle qui les porte.
 * `vecteur` reste `null` — il n'a plus rien à piloter.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS SORTS D'UN LIEN INTERNE — ET LE RÉSOLVEUR DOIT LES DISTINGUER
 *
 * `rendu.ts` les nomme : cible résolue → `a.lien-int` ; cible INEXISTANTE →
 * `a.lien-casse`, sans adresse ; cible existante mais NON PUBLIQUE, en lecture
 * publique → `span.lien-prive`. Le troisième est celui que `V-03:1072` écrit et
 * que `RG-M17-01` exige.
 *
 * LE RÉSOLVEUR CONNAÎT DONC TOUTES LES NOTES, avec leur drapeau de publicité.
 * Une première écriture ne lui donnait que les notes publiques : une cible
 * interne n'y était pas trouvée, et le rendu la traitait en LIEN CASSÉ. Mesuré
 * au navigateur — zéro `span.lien-prive` sur un corps qui en attendait un.
 * C'est l'écran qui aurait menti : « cette ressource n'existe pas » là où elle
 * existe et n'est pas publique.
 *
 * ET RIEN NE FUIT, parce que `span.lien-prive` ne porte RIEN de la cible : ni
 * son adresse, ni son titre. Le texte affiché est celui que le document
 * lui-même écrit, déjà lisible par l'anonyme puisqu'il est dans le corps du
 * guide. Le drapeau de publicité, lui, ne sort jamais du serveur — il décide
 * d'une forme, il n'est pas rendu.
 */
import { eq } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import { notes, piecesJointes } from '$lib/base/schema';
import { analyserDocument, titres, type Titre } from '$lib/contenu/document';
import { rendreDocument } from '$lib/contenu/rendu';
import { formaterDateFr, formaterDateIso } from '$lib/dates';
import { compteDeLEspacePublic, journaliserUneConsultation } from '$lib/donnees/consultation';
import { lireConfiguration, lireNotes } from '$lib/donnees/lecture';
import { noteVisibleEnAnonyme } from '$lib/droits/resolution';
import { refuserLAdresse } from '$lib/donnees/rangement';
import { resoudreLeGuide } from '$lib/donnees/public';
import { adresseDeDomaine, adresseDePieceJointe } from '$lib/rangement/adresses';
import type { CibleDeNote } from '$lib/contenu/rendu';
import type { PageServerLoad } from './$types';

/** `/guides/{identifiant}` — l'adresse publique d'un guide (`docs/routes.md` §5.5). */
function adresseDeGuide(identifiant: string): string {
	return `/guides/${identifiant}`;
}

/**
 * LA TAILLE D'UNE PIÈCE JOINTE, TELLE QUE LE GEL L'ÉCRIT — « 320 Ko »,
 * « 18 Ko », « 1,2 Mo » (`V-03:1132`, `V-14:1836`, `V-14:1840`).
 *
 * Trois échantillons, une seule règle qui les rende tous les trois : sous le
 * mégaoctet, des kilooctets entiers ; au-delà, un mégaoctet à une décimale, la
 * virgule française. La colonne porte des OCTETS (`taille_octets`) : la mise en
 * mots n'existait nulle part au dépôt, et elle est ici plutôt que dans une vue,
 * pour qu'il n'y en ait qu'une.
 */
function tailleEnClair(octets: number): string {
	if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
	return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

/** La marque de format d'une pièce — son extension, en capitales. */
function marqueDuFichier(nom: string): string {
	const point = nom.lastIndexOf('.');
	return point <= 0 ? 'FIC' : nom.slice(point + 1).toUpperCase();
}

/**
 * LES CIBLES DE LIEN INTERNE — toutes les notes, chacune avec sa publicité.
 *
 * `publique` est décidé par `noteVisibleEnAnonyme()`, la règle de
 * `resolution.ts`, et non par une comparaison recopiée : c'est la même fonction
 * que `resoudreLeGuide()` applique à la note demandée, et il ne peut donc pas y
 * avoir deux définitions de « publique » sur cet écran.
 *
 * L'ADRESSE EST CELLE DU GUIDE, pas celle de la note. Un lecteur anonyme n'a
 * aucun droit sur `/notes/{identifiant}` : y renvoyer produirait un lien mort
 * pour lui, ce que `P-03` refuse. Elle n'est d'ailleurs employée que pour les
 * cibles publiques — le rendu ne pose aucune adresse sur les autres.
 */
async function ciblesDeLien(base: Base): Promise<Map<string, CibleDeNote>> {
	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			dossierId: notes.dossierId,
			visibilite: notes.visibilite,
			statut: notes.statut
		})
		.from(notes);
	const cibles = new Map<string, CibleDeNote>();
	for (const n of lignes) {
		cibles.set(n.identifiant, {
			id: n.identifiant,
			titre: n.titre,
			adresse: adresseDeGuide(n.identifiant),
			publique: noteVisibleEnAnonyme(n)
		});
	}
	return cibles;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const base = basePartagee();
	const resolution = await resoudreLeGuide(base, params.identifiant);
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	/* ═══════════════════════════════════════════════════════════════════════
	   LA CONSULTATION SE COMPTE ET SE JOURNALISE — `RG-M04-09`, T-078.

	   « TOUTE ouverture d'une note » : la lecture publique en est une. Le
	   compteur monte donc ici aussi, et non sur la seule lecture interne — un
	   compteur qui ignorerait l'espace public sous-compterait les notes
	   publiques, qui sont précisément celles que le public lit.

	   CE CHARGEUR N'AFFICHE PAS CE COMPTEUR, et il ne prétend donc rien de la
	   règle de M15.1 qui veut le nombre de consultations visible partout où une
	   note apparaît : elle reste sans porteur, et son numéro n'est pas cité ici
	   — le nommer ferait descendre le compte de `pnpm verif:couverture` sans que
	   le produit ait changé.

	   L'ENTRÉE EST ANONYMISÉE, ET SANS LIRE LA SESSION. `RG-M15-02` (CDC:1227)
	   ne parle pas du lecteur mais du JOURNAL : « les journaux de l'espace
	   public sont anonymisés : aucun identifiant d'utilisateur n'y est
	   associé ». C'est aussi la seule forme compatible avec `ARB-007` A-05, que
	   l'en-tête de ce fichier cite — « la session ne change ni la route, ni la
	   vue, ni les états » : un journal qui distinguerait le connecté de
	   l'anonyme rétablirait ici la dépendance au cookie que l'arbitrage a
	   fermée. La fonction appelée ne prend aucune identité ; la garantie est
	   portée par la signature, pas par la discipline.

	   APRÈS LA RÉSOLUTION, ET JAMAIS AVANT — même raison qu'à
	   `/notes/{identifiant}` : une note interne et une adresse absente sortent
	   toutes deux par le refus ci-dessus, sans atteindre cette écriture. Le
	   point dur de `V-04:2219` reste tenu, coût compris.

	   L'INSTANT EST PRIS ICI, une fois : ce chargeur n'en avait aucun. */
	const maintenant = new Date();
	await journaliserUneConsultation(base, {
		identifiant: params.identifiant,
		compte: compteDeLEspacePublic(),
		maintenant
	});

	/* ── Le contenu, lu APRÈS le refus et pas avant (`ADR-006`) ──────────── */
	const [ligne] = await base
		.select({
			id: notes.id,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe
		})
		.from(notes)
		.where(eq(notes.identifiant, params.identifiant))
		.limit(1);
	/* La projection a résolu et la note a disparu entre les deux requêtes : le
	   refus est le même, par le même chemin. Rien ici ne distingue deux causes. */
	if (ligne === undefined) refuserLAdresse(url.pathname);

	/* La forme d'affichage vient de la couche de lecture, et d'elle seule : la
	   fraîcheur y est calculée par l'implémentation unique (`P-01`). */
	const config = await lireConfiguration(base);
	const contexte = {
		maintenant,
		seuils: { frais: config.seuilFrais, vieillissant: config.seuilVieillissant }
	};
	const [note] = await lireNotes(base, contexte, [params.identifiant]);
	if (note === undefined) refuserLAdresse(url.pathname);

	const cibles = await ciblesDeLien(base);
	const resoudre = (identifiant: string): CibleDeNote | null => cibles.get(identifiant) ?? null;

	const rendre = (valeur: unknown): string | null =>
		valeur === null || valeur === undefined
			? null
			: rendreDocument(analyserDocument(valeur), { resoudre, contexte: 'public' });

	const reference = rendre(ligne.corpsReference);
	const sommaire =
		ligne.corpsReference === null
			? []
			: titres(analyserDocument(ligne.corpsReference))
					.filter((t) => t.attrs.level === 2 && t.attrs.ancre !== null)
					.map((t) => ({ ancre: t.attrs.ancre as string, titre: texteDuTitre(t) }));

	const pieces = await base
		.select({ nom: piecesJointes.nom, tailleOctets: piecesJointes.tailleOctets })
		.from(piecesJointes)
		.where(eq(piecesJointes.noteId, ligne.id))
		.orderBy(piecesJointes.nom);

	return {
		/* Les deux axes de la planche décrivent la note ; la note les porte. */
		vecteur: null,
		/* L'ADRESSE DU PORTAIL D'ASSISTANCE — clé `portail_assistance` de la table
		   `parametres` (M14.7), « adresse externe configurée en console »
		   (`V-04:2205`). Elle sort de la MÊME lecture que les seuils : une requête,
		   et `P-01` inchangée. */
		portail: config.portailAssistance,
		guide: {
			titre: note.titre,
			type: note.type,
			domaine: note.domaine,
			adresseDuDomaine: adresseDeDomaine(note.univers, note.domaine),
			auteur: note.auteur,
			modifieLe: formaterDateFr(ligne.modifieLe),
			modifieIso: formaterDateIso(ligne.modifieLe),
			fraicheur: note.fraicheur,
			jours: note.jours,
			/* LA DATE DE CONTRÔLE EST LUE SUR LA COLONNE, PAS SUR `Note.revise`.
			   `revise` est déjà une chaîne FRANÇAISE — `dateCourteDInstant()` rend
			   « 02/08/2026 » —, et la repasser au formateur la relirait comme une
			   date anglaise : « 02/08 » deviendrait le 8 février. Le formateur
			   reçoit donc l'instant que la colonne porte, jamais un libellé.

			   `null` : la note n'a jamais été vérifiée. La date ne se fabrique pas,
			   et la vue rend son marqueur de vide (`P-02`). */
			controleLe: ligne.verifieLe === null ? null : formaterDateFr(ligne.verifieLe),
			controleIso: ligne.verifieLe === null ? null : formaterDateIso(ligne.verifieLe),
			reference: reference ?? '',
			operationnel: rendre(ligne.corpsOperationnel),
			sommaire,
			piecesJointes: pieces.map((p) => ({
				nom: p.nom,
				marque: marqueDuFichier(p.nom),
				taille: tailleEnClair(p.tailleOctets),
				adresse: adresseDePieceJointe(params.identifiant, p.nom)
			}))
		}
	};
};

/**
 * LE LIBELLÉ D'UN TITRE — le texte de ses enfants, mis bout à bout.
 *
 * Un titre du document canonique est un bloc à enfants de texte : son libellé
 * n'est pas une propriété, il se lit. Le sommaire porte du TEXTE, jamais du
 * balisage — c'est ce qui interdit qu'une marque d'emphase remonte dans le
 * lien.
 */
function texteDuTitre(titre: Titre): string {
	return (titre.content ?? []).map((n) => n.text).join('');
}
