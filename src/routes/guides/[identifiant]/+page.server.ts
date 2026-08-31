/**
 * `/guides/{identifiant}` — LA LECTURE PUBLIQUE D'UN GUIDE (V-03). Une note publique ET
 * publiée rend V-03 dans les QUATRE colonnes ; une note interne ou brouillon rend 404
 * V-04, dans les quatre aussi. `ARB-007` A-05 : « la session ne change ni la route, ni
 * la vue, ni les états » — ce chargeur ne lit donc PAS `locals.identite`.
 *
 * LE POINT DUR — `V-04:2219` : « une adresse inexistante et une note existante non
 * publique doivent produire un rendu strictement identique ». Trois propriétés la
 * tiennent : UNE SEULE REQUÊTE, la même dans les deux cas, par identifiant et SANS
 * CONTENU ; UN SEUL POINT DE SORTIE, `refuserLAdresse()`, dont le type de retour `never`
 * interdit qu'on reprenne la main ; UN SEUL ÉCRAN D'ÉCHEC, qui ne reçoit ni la
 * ressource, ni la raison, ni l'identifiant demandé. L'ORDRE EST LA PROPRIÉTÉ : le
 * contenu n'est lu qu'APRÈS le refus (`ADR-006`, `ARB-005`).
 *
 * LES TROIS SORTS D'UN LIEN INTERNE : cible résolue → `a.lien-int` ; INEXISTANTE →
 * `a.lien-casse`, sans adresse ; existante mais NON PUBLIQUE → `span.lien-prive`, celui
 * que `RG-M17-01` exige. LE RÉSOLVEUR CONNAÎT DONC TOUTES LES NOTES, avec leur drapeau
 * de publicité — ne lui donner que les publiques faisait traiter une cible interne en
 * LIEN CASSÉ. Rien ne fuit : `span.lien-prive` ne porte NI adresse NI titre.
 */
import { eq } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import { domaines, notes, piecesJointes, univers } from '$lib/base/schema';
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
 * LA TAILLE D'UNE PIÈCE JOINTE, TELLE QUE LE GEL L'ÉCRIT — « 320 Ko », « 18 Ko »,
 * « 1,2 Mo ». Une seule règle rend les trois : sous le mégaoctet, des kilooctets
 * entiers ; au-delà, un mégaoctet à une décimale, virgule française. La colonne
 * porte des OCTETS ; la mise en mots est ici plutôt que dans une vue, pour qu'il
 * n'y en ait qu'une.
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
 * `resolution.ts`, et non par une comparaison recopiée : la même fonction que
 * `resoudreLeGuide()` applique à la note demandée.
 *
 * L'ADRESSE EST CELLE DU GUIDE, pas celle de la note. Un lecteur anonyme n'a
 * aucun droit sur `/notes/{identifiant}` : y renvoyer produirait un lien mort
 * (`P-03`). Elle n'est employée que pour les cibles publiques.
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

	/* LA CONSULTATION SE COMPTE ET SE JOURNALISE — `RG-M04-09` : « TOUTE ouverture
	   d'une note », et la lecture publique en est une. Un compteur qui ignorerait
	   l'espace public sous-compterait les notes publiques, qui sont précisément
	   celles que le public lit.

	   L'ENTRÉE EST ANONYMISÉE, ET SANS LIRE LA SESSION. `RG-M15-02` ne parle pas du
	   lecteur mais du JOURNAL : « les journaux de l'espace public sont anonymisés ;
	   aucun identifiant d'utilisateur n'y est associé ». C'est aussi la seule forme
	   compatible avec `ARB-007` A-05 — un journal qui distinguerait le connecté de
	   l'anonyme rétablirait la dépendance au cookie. La fonction appelée ne prend
	   aucune identité : la garantie est portée par la signature.

	   APRÈS LA RÉSOLUTION, ET JAMAIS AVANT : une note interne et une adresse absente
	   sortent toutes deux par le refus ci-dessus, sans atteindre cette écriture. Le
	   point dur de `V-04:2219` reste tenu, coût compris. L'INSTANT EST PRIS ICI. */
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
			verifieLe: notes.verifieLe,
			/* LES DEUX IDENTIFIANTS D'ADRESSE DU RANGEMENT, lus plutôt que dérivés du
			   nom : ils sont fixés à la création et ne suivent PAS les renommages
			   (`RG-M12-11`). Le lien « voir le domaine » se composait sur le nom
			   slugifié et rendait 404 dès qu'un domaine avait été renommé. */
			universIdentifiant: univers.identifiant,
			domaineIdentifiant: domaines.identifiant
		})
		.from(notes)
		.innerJoin(domaines, eq(domaines.id, notes.domaineId))
		.innerJoin(univers, eq(univers.id, domaines.universId))
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
		/* L'ADRESSE DU PORTAIL D'ASSISTANCE — clé `portail_assistance` de la table
		   `parametres` (M14.7), « adresse externe configurée en console »
		   (`V-04:2205`). Elle sort de la MÊME lecture que les seuils : une requête,
		   et `P-01` inchangée. */
		portail: config.portailAssistance,
		guide: {
			titre: note.titre,
			type: note.type,
			domaine: note.domaine,
			adresseDuDomaine: adresseDeDomaine(ligne.universIdentifiant, ligne.domaineIdentifiant),
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
 * LE LIBELLÉ D'UN TITRE — le texte de ses enfants, mis bout à bout. Le sommaire
 * porte du TEXTE, jamais du balisage : c'est ce qui interdit qu'une marque
 * d'emphase remonte dans le lien.
 */
function texteDuTitre(titre: Titre): string {
	return (titre.content ?? []).map((n) => n.text).join('');
}
