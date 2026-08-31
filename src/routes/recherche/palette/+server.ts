/**
 * `/recherche/palette` — CE QUE LA PALETTE DEMANDE QUAND ON TAPE, et rien d'autre.
 *
 * AUCUNE ADRESSE N'OUVRE D'ÉCRAN ICI : `docs/routes.md:206` donne à V-09 « aucune
 * adresse », la palette étant une superposition montée sur toutes les routes portant la
 * coquille. Il lui faut pourtant une source, et `CDC:1535` interdit de la lui donner au
 * montage de chaque page — « ouverture perçue instantanée » ne se paie pas en chargeant
 * le corpus entier trente-quatre fois. LA PALETTE CHERCHE QUAND ON TAPE, donc elle
 * interroge, donc il lui faut ce point d'entrée.
 *
 * LE PÉRIMÈTRE EST DANS LA REQUÊTE, PAS DANS L'AFFICHAGE (`ADR-006`). Cette route
 * n'écrit aucun filtre : elle appelle `chercherLesNotes()`, le seul chemin de recherche
 * du dépôt, qui CALCULE son filtre depuis l'identité et n'a aucun champ où un appelant
 * pourrait l'élargir. Les notes sont ensuite lues en base PAR LEURS IDENTIFIANTS, ceux
 * que le moteur a consenti à rendre. Une palette qui chercherait sur tout le corpus et
 * masquerait ensuite serait une fuite ; le compteur en serait une aussi, et il compte les
 * mêmes notes.
 *
 * LES NOTES CONSULTÉES RÉCEMMENT PORTENT LE MÊME FILTRE, ÉCRIT DANS LA CLAUSE SQL : elles
 * ne passent pas par le moteur — ce n'est pas une recherche —, donc le périmètre y est
 * posé à la main, sur les DOSSIERS, par `perimetreDeLIdentite()`. Périmètre fermé :
 * aucune requête.
 *
 * CE POINT D'ENTRÉE N'ÉCRIT PAS AU JOURNAL DE `RG-M02-03`, et c'est une décision, pas un
 * oubli : la palette interroge à la frappe, et journaliser chaque préfixe inscrirait
 * « res », « resta », « restaur » comme autant de recherches sans ouverture — le taux de
 * recherche aboutie que M15 tire de ce journal deviendrait faux. `/recherche` reste
 * l'unique écrivain, et la sortie « Voir tous les résultats » de la palette y mène.
 */
import { and, desc, eq, inArray, max } from 'drizzle-orm';
import { basePartagee } from '$lib/base/acces';
import { consultations, notes } from '$lib/base/schema';
import { lireConfiguration, lireNotes, type ContexteDeLecture } from '$lib/donnees/lecture';
import { SENS_DISPONIBLE } from '$lib/donnees/public';
import { moteurPartage } from '$lib/recherche/acces';
import { chercherLesNotes, perimetreDeLIdentite } from '$lib/recherche/moteur';
import { AUCUN_RESULTAT, indexAbsent, motifDuPerimetreVide } from '$lib/recherche/vide';
import {
	MAX_RECENTES,
	MAX_RESULTATS,
	MINIMUM_DE_CARACTERES,
	type ReponseDePalette,
	type ResultatDePalette
} from '$lib/recherche/palette';
import type { MotifDuVide } from '$lib/recherche/motifs';
import type { Base } from '$lib/base/acces';
import type { Identite } from '$lib/droits/resolution';
import type { Note } from '../../../../seeds/corpus';
import type { RequestHandler } from './$types';

/** La ligne servie — le type étroit de `$lib/recherche/palette`, et lui seul. */
function ligneDe(note: Note): ResultatDePalette {
	return {
		id: note.id,
		titre: note.titre,
		type: note.type,
		typeFiche: note.typeFiche ?? null,
		domaine: note.domaine,
		operationnel: note.operationnel,
		fraicheur: note.fraicheur,
		jours: note.jours,
		revise: note.revise
	};
}

/**
 * LES NOTES DANS L'ORDRE DEMANDÉ — `lireNotes()` classe par identifiant, une lecture en
 * base n'ayant pas de raison de connaître la pertinence ni l'ordre de consultation. Une
 * note absente de la lecture — retirée entre les deux requêtes — disparaît simplement.
 */
function dansLOrdre(lues: readonly Note[], ordre: readonly string[]): readonly Note[] {
	const parIdentifiant = new Map<string, Note>(lues.map((n) => [n.id, n]));
	const rangees: Note[] = [];
	for (const identifiant of ordre) {
		const note = parIdentifiant.get(identifiant);
		if (note !== undefined) rangees.push(note);
	}
	return rangees;
}

/**
 * LES NOTES QUE L'APPELANT A OUVERTES EN DERNIER — la table `consultations`, celle que
 * `RG-M04-09` alimente à chaque ouverture. « Consultées récemment » n'est pas un jeu de
 * données : c'est un fait de l'instance, et sans lui la palette s'ouvrirait sur du blanc.
 *
 * LE FILTRE EST DANS LA CLAUSE : les dossiers du périmètre, jamais un tri après coup. Un
 * droit retiré depuis la consultation referme donc la ligne, ce qui est le sens de la
 * règle. L'anonyme n'a pas de compte, donc pas d'historique : la liste est vide et aucune
 * requête ne part.
 */
async function consulteesRecemment(base: Base, identite: Identite): Promise<readonly string[]> {
	if (identite.type !== 'authentifie') return [];
	const perimetre = await perimetreDeLIdentite(base, identite);
	if (!perimetre.tout && perimetre.dossiers.size === 0) return [];

	const dansLePerimetre = perimetre.tout
		? undefined
		: inArray(notes.dossierId, [...perimetre.dossiers]);
	const lignes = await base
		.select({ identifiant: notes.identifiant, dernier: max(consultations.le) })
		.from(consultations)
		.innerJoin(notes, eq(consultations.noteId, notes.id))
		.where(and(eq(consultations.compteId, identite.compteId), dansLePerimetre))
		.groupBy(notes.identifiant)
		.orderBy(desc(max(consultations.le)))
		.limit(MAX_RECENTES);
	return lignes.map((l) => l.identifiant);
}

/**
 * LA TAILLE DU PÉRIMÈTRE LISIBLE, ou le motif de son absence — la requête VIDE au
 * moteur, celle que `/recherche` emploie pour distinguer « aucun résultat » de « rien à
 * chercher ». Elle se rattrape sur l'index absent : une installation neuve n'est pas une
 * panne, et c'est l'état où la palette a le plus besoin de nommer le geste qui débloque.
 */
async function motifDuPerimetre(base: Base, identite: Identite): Promise<MotifDuVide | null> {
	const lisible = await chercherLesNotes(base, moteurPartage(), identite, { requete: '' }).catch(
		(erreur: unknown) => {
			if (indexAbsent(erreur)) return null;
			throw erreur;
		}
	);
	if (lisible === null) return 'sans-index';
	if (lisible.total > 0) return null;
	return await motifDuPerimetreVide(base, identite);
}

/**
 * L'ÉTAT DE REPOS — les notes récemment consultées, « point de départ » de `V-09`
 * état 01 : « la palette ne s'ouvre jamais sur du blanc ».
 *
 * AUCUNE RÉCENTE N'EST PAS UN ÉTAT MUET. N'avoir rien ouvert n'est pas la même chose que
 * n'avoir rien à ouvrir, et la seconde est le cas d'une instance neuve : le motif est
 * alors demandé, et lui seul nomme le geste qui débloque. Il ne l'est QUE dans ce cas —
 * une palette ouverte par quelqu'un qui a un historique ne touche ni le moteur ni la
 * table des univers.
 */
async function auRepos(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<ReponseDePalette> {
	const recents = await consulteesRecemment(base, identite);
	const notesLues = dansLOrdre(await lireNotes(base, contexte, recents), recents);
	return {
		resultats: notesLues.map(ligneDe),
		total: notesLues.length,
		/* AUCUNE REQUÊTE DE RECHERCHE N'EST PARTIE : il n'y a pas de durée, et `null` ne
		   vaut pas zéro. Le pied n'écrit alors aucune durée. */
		dureeMs: null,
		recentes: true,
		degrade: !SENS_DISPONIBLE,
		motif: notesLues.length > 0 ? null : await motifDuPerimetre(base, identite)
	};
}

/**
 * LA RECHERCHE — deux requêtes au moteur, comme `/recherche`, et pour la même raison : la
 * requête VIDE rapporte la taille du périmètre lisible, seul moyen de distinguer « aucun
 * résultat » de « rien à chercher ». Les deux partent ensemble et se rattrapent ensemble
 * sur l'index absent — une installation neuve, pas une panne.
 */
async function pourLaRequete(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture,
	requete: string
): Promise<ReponseDePalette> {
	const client = moteurPartage();
	const interrogation = await Promise.all([
		chercherLesNotes(base, client, identite, { requete }),
		chercherLesNotes(base, client, identite, { requete: '' })
	]).catch((erreur: unknown) => {
		if (indexAbsent(erreur)) return null;
		throw erreur;
	});
	const [trouvees, toutLeLisible] = interrogation ?? [AUCUN_RESULTAT, AUCUN_RESULTAT];

	/* SEPT LIGNES AU PLUS SONT LUES EN BASE, pas mille : la palette n'en montre pas
	   davantage, et lire le reste coûterait sans rien rendre. Le COMPTEUR, lui, reste
	   le total du périmètre — c'est ce que la recherche a trouvé. */
	const retenus = trouvees.identifiants.slice(0, MAX_RESULTATS);
	const notesLues = dansLOrdre(await lireNotes(base, contexte, retenus), retenus);

	const motif =
		toutLeLisible.total > 0
			? null
			: interrogation === null
				? ('sans-index' as const)
				: await motifDuPerimetreVide(base, identite);

	return {
		resultats: notesLues.map(ligneDe),
		total: trouvees.total,
		dureeMs: trouvees.dureeMs,
		recentes: false,
		degrade: !SENS_DISPONIBLE,
		motif
	};
}

/**
 * `q` ABSENT OU TROP COURT N'EST PAS UN REFUS : c'est l'état de repos de la palette.
 * Sous deux caractères aucune requête ne part — `UC-M02-02` ne promet des résultats qu'à
 * partir du deuxième —, et la palette montre alors les notes récemment consultées, ce
 * qu'elle montre déjà champ vide.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const base = basePartagee();
	const config = await lireConfiguration(base);
	const contexte: ContexteDeLecture = {
		maintenant: new Date(),
		seuils: { frais: config.seuilFrais, vieillissant: config.seuilVieillissant }
	};
	const requete = (url.searchParams.get('q') ?? '').trim();
	const reponse =
		requete.length < MINIMUM_DE_CARACTERES
			? await auRepos(base, locals.identite, contexte)
			: await pourLaRequete(base, locals.identite, contexte, requete);
	/* AUCUN CACHE : `ADR-006` interdit « tout cache d'index ou de résultat partagé entre
	   personas », et cette réponse est calculée pour une identité. */
	return new Response(JSON.stringify(reponse), {
		headers: new Headers({
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		})
	});
};
