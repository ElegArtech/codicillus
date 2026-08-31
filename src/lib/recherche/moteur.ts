/**
 * Le moteur — alimenter l'index, et l'interroger AVEC le périmètre. `ADR-006` :
 * « l'autorisation est calculée côté serveur, avant toute production de HTML et AVANT
 * TOUTE REQUÊTE À L'INDEX, et elle est projetée dans l'index. »
 *
 * IL N'Y A QU'UN CHEMIN POUR INTERROGER L'INDEX, ET IL PORTE LE FILTRE.
 * `chercherLesNotes()` ne prend PAS de filtre en paramètre : elle le CALCULE depuis
 * l'identité. Un appelant ne peut donc ni l'oublier, ni l'élargir, ni le remplacer — il
 * n'a aucun champ où l'écrire. Une fonction qui accepterait un filtre optionnel serait
 * exactement la porte qu'`ADR-006` interdit.
 *
 * DEUX RÉGIMES DE TÂCHE, ET AUCUN N'EST UNE TEMPORISATION (`ARB-060`) : `attendre()`
 * suit la tâche jusqu'à son état terminal et LÈVE si ce n'est pas la réussite ;
 * `soumettre()` POSE la tâche et rend son numéro — la soumission reste synchrone, seul
 * le suivi disparaît. Le régime n'a pas de valeur par défaut : tout appelant DÉCLARE le
 * sien. CE QUE LA SOUMISSION PERD est replacé par le contrôle « aucune tâche en échec
 * dans le moteur » ; sans lui, `ARB-060` ne serait qu'un desserrage.
 *
 * Ce module n'établit aucune identité, n'écrit aucune règle de droit, ne rend aucun
 * contenu de note — l'index rapporte des IDENTIFIANTS — et ne garde aucun résultat en
 * mémoire (`ADR-006` interdit « tout cache d'index ou de résultat partagé »).
 */
import { eq, inArray } from 'drizzle-orm';
import { Meilisearch } from 'meilisearch';
import type { EnqueuedTask, Task } from 'meilisearch';
import type { Base } from '../base/acces';
import {
	comptes,
	domaines,
	dossiers,
	droitsDeDossier,
	notes,
	typesDeFiche,
	typesDeNote,
	univers
} from '../base/schema';
import {
	type DossierDeLArbre,
	type DroitExplicite,
	type Identite,
	type Perimetre,
	chaineDAncetres,
	indexerLesDroits,
	perimetreDeLecture
} from '../droits/resolution';
import { extraitDuCorps, lireEtiquettesParNote } from '../donnees/lecture';
import {
	type ConfigurationDeRecherche,
	type EnvironnementDeRecherche,
	configurationDeRecherche
} from './connexion';
import {
	CLE_PRIMAIRE,
	NOM_DE_L_INDEX,
	NOM_DE_L_INDEX_EN_RECONSTRUCTION,
	type NoteIndexee,
	REGLAGES_DE_L_INDEX
} from './notes-indexees';
import { type FiltreDIndex, clausesDeFacette, filtreComplet, filtreDuPerimetre } from './perimetre';

export function moteurDeRecherche(env: EnvironnementDeRecherche): Meilisearch {
	return clientDe(configurationDeRecherche(env));
}

export function clientDe(config: ConfigurationDeRecherche): Meilisearch {
	return new Meilisearch({ host: config.host, apiKey: config.apiKey });
}

/**
 * Le régime d'une tâche du moteur — déclaré par l'appelant, jamais hérité. Il n'a
 * délibérément PAS de valeur par défaut : le prochain appelant aurait obtenu, ou
 * perdu, l'attente sans l'écrire.
 */
export type RegimeDeTache =
	/** Suivre la tâche jusqu'à son état terminal et lever si ce n'est pas la
	 *  réussite. Partout où la latence ne coûte rien : réindexation, commandes
	 *  de console, épreuves de périmètre. */
	| 'attendre'
	/** Poser la tâche et rendre. Le CHEMIN DE REQUÊTE, et lui seul (`ARB-060`). */
	| 'soumettre';

/**
 * Attend la fin d'une tâche du moteur et LÈVE si elle n'a pas réussi. Un échec
 * d'indexation silencieux est le pire des états : l'index paraît alimenté et ne
 * l'est pas, et la recherche rend moins que le corpus sans que rien ne le dise.
 */
export async function attendre(tache: Promise<unknown> & { waitTask: () => Promise<Task> }) {
	const finie = await tache.waitTask();
	if (finie.status !== 'succeeded') {
		throw new Error(
			`tâche « ${finie.type} » du moteur en état « ${finie.status} » : ` +
				(finie.error?.message ?? 'aucun message')
		);
	}
	return finie;
}

/**
 * Soumet une tâche au moteur et rend son numéro, SANS la suivre (`ARB-060`).
 *
 * CE QUI RESTE SYNCHRONE : la promesse rendue par le client est celle de l'ENFILEMENT.
 * Un moteur arrêté, injoignable ou qui refuse fait donc échouer cet appel — `ARB-060`
 * « n'autorise pas à taire un échec de soumission ». Ce qui cesse d'être suivi est
 * l'état terminal de la tâche : 804 ms d'attente mesurés contre 6 ms de soumission.
 *
 * @returns le numéro de la tâche enfilée, par quoi un contrôle la retrouve
 */
export async function soumettre(tache: Promise<EnqueuedTask>): Promise<number> {
	const enfilee = await tache;
	return enfilee.taskUid;
}

async function selonLeRegime(
	tache: Promise<EnqueuedTask> & { waitTask: () => Promise<Task> },
	regime: RegimeDeTache
): Promise<void> {
	if (regime === 'attendre') await attendre(tache);
	else await soumettre(tache);
}

/** L'arborescence, réduite à ce que `RG-DRO-01` a besoin de remonter. */
async function lireArbre(base: Base): Promise<readonly DossierDeLArbre[]> {
	return await base.select({ id: dossiers.id, parentId: dossiers.parentId }).from(dossiers);
}

async function lireDroits(base: Base): Promise<readonly DroitExplicite[]> {
	return await base
		.select({
			dossierId: droitsDeDossier.dossierId,
			compteId: droitsDeDossier.compteId,
			droit: droitsDeDossier.droit
		})
		.from(droitsDeDossier);
}

/**
 * Le corpus, projeté pour l'index — avec son périmètre, note par note. La chaîne
 * d'ancêtres vient de `chaineDAncetres()`, celle que la résolution des droits emploie :
 * le chemin projeté dans l'index et le chemin parcouru par la résolution sont le MÊME
 * code, seule façon qu'ils ne divergent pas.
 *
 * @param identifiants restreint la projection à ces notes. Absent : tout.
 */
export async function projeterLeCorpus(
	base: Base,
	identifiants?: readonly string[]
): Promise<readonly NoteIndexee[]> {
	if (identifiants !== undefined && identifiants.length === 0) return [];

	const arbre = await lireArbre(base);
	const index = indexerLesDroits(arbre);

	const socle = base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			typeNom: typesDeNote.nom,
			typeFicheNom: typesDeFiche.nom,
			universNom: univers.nom,
			domaineNom: domaines.nom,
			dossierId: notes.dossierId,
			auteurNom: comptes.nom,
			visibilite: notes.visibilite,
			statut: notes.statut,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			consultations: notes.compteurDeConsultations
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.leftJoin(typesDeFiche, eq(notes.typeDeFicheId, typesDeFiche.id));

	const lignes = await (identifiants === undefined
		? socle.orderBy(notes.identifiant)
		: socle.where(inArray(notes.identifiant, [...identifiants])).orderBy(notes.identifiant));

	const etiquettesParNote = await lireEtiquettesParNote(base);

	return lignes.map((n) => {
		const ancetres = chaineDAncetres(index, n.dossierId);
		if (ancetres.length === 0) {
			/* `ADR-006` : « un document indexé sans périmètre est un document
			   public ». Un dossier introuvable dans l'arbre rendrait une chaîne
			   vide : on ne l'indexe pas, on refuse. */
			throw new Error(
				`la note « ${n.identifiant} » porte un dossier hors de l’arborescence : ` +
					'aucun chemin d’ancêtres, donc aucun périmètre — refus d’indexer.'
			);
		}
		return {
			id: n.identifiant,
			titre: n.titre,
			extrait: extraitDuCorps(n.corpsReference),
			auteur: n.auteurNom,
			type: n.typeNom,
			typeFiche: n.typeFicheNom,
			univers: n.universNom,
			domaine: n.domaineNom,
			etiquettes: etiquettesParNote.get(n.identifiant) ?? [],
			dossier: n.dossierId,
			ancetres,
			visibilite: n.visibilite,
			statut: n.statut,
			modifieLe: n.modifieLe.getTime(),
			verifieLe: n.verifieLe === null ? null : n.verifieLe.getTime(),
			consultations: n.consultations
		};
	});
}

async function lIndexExiste(client: Meilisearch, uid: string): Promise<boolean> {
	return await client
		.getRawIndex(uid)
		.then(() => true)
		.catch(() => false);
}

export async function assurerLIndex(client: Meilisearch, uid: string): Promise<void> {
	if (!(await lIndexExiste(client, uid))) {
		await attendre(client.createIndex(uid, { primaryKey: CLE_PRIMAIRE }));
	}
	await attendre(client.index(uid).updateSettings(REGLAGES_DE_L_INDEX));
}

/**
 * Retire un index s'il existe — et n'enfile RIEN quand il n'existe pas.
 *
 * `deleteIndexIfExists()` du client ne tient pas son nom sous cette version
 * (`meilisearch` 0.60.0) : il n'attend que l'ENFILEMENT et rattrape un refus SYNCHRONE
 * que le moteur n'émet pas. Le moteur accepte la demande puis fait ÉCHOUER la tâche en
 * `index_not_found`, laissant une tâche « failed » pour une opération nominale. On
 * retire la cause, pas le contrôle : celui qui remplace l'attente pose une question sans
 * nuance — « existe-t-il une tâche en échec ? ».
 *
 * L'ATTENTE EST ICI CONSERVÉE : la réindexation est le lieu où la latence ne coûte rien,
 * et un retrait non suivi laisserait l'index de reconstruction en place sans le dire.
 */
async function retirerLIndexSIlExiste(client: Meilisearch, uid: string): Promise<boolean> {
	if (!(await lIndexExiste(client, uid))) return false;
	await attendre(client.deleteIndex(uid));
	return true;
}

/**
 * L'indexation d'une écriture de note — `STACK` §4.2 : « l'écriture est synchrone à
 * l'enregistrement, le calcul du vecteur est différé ». L'appelant est la couche qui
 * vient d'écrire en base, et c'est LUI qui déclare son régime : sous `attendre`, la note
 * est trouvable quand la promesse rend ; sous `soumettre`, 804 ms plus tard — les dix
 * secondes de `RG-M05-06` et `RG-M12-08` sont tenues avec un facteur douze.
 *
 * @param regime `attendre` ou `soumettre` — voir `RegimeDeTache`
 */
export async function indexerDesNotes(
	client: Meilisearch,
	notesAIndexer: readonly NoteIndexee[],
	regime: RegimeDeTache
): Promise<number> {
	if (notesAIndexer.length === 0) return 0;
	await selonLeRegime(client.index(NOM_DE_L_INDEX).addDocuments([...notesAIndexer]), regime);
	return notesAIndexer.length;
}

/**
 * Le retrait de l'index — À APPELER APRÈS LA VALIDATION DE LA TRANSACTION, JAMAIS AVANT :
 * « de sorte qu'une transaction annulée ne puisse pas laisser un index amputé »
 * (`STACK` §4.8, `ADR-009`).
 *
 * La signature ne reçoit ni transaction ni connexion : elle ne PEUT donc pas être
 * appelée depuis l'intérieur d'un bloc transactionnel en croyant y participer. Mais
 * aucune signature n'empêche un appelant de l'invoquer trop tôt, d'où les majuscules.
 *
 * Le sens du défaut n'est pas symétrique : un retrait TROP TARD laisse une entrée qui ne
 * mène nulle part, et la route de lecture revérifie le droit ; un retrait TROP TÔT suivi
 * d'une annulation laisse une note vivante et INTROUVABLE.
 *
 * @param regime `attendre` ou `soumettre` — voir `RegimeDeTache`
 */
export async function retirerDesNotes(
	client: Meilisearch,
	identifiants: readonly string[],
	regime: RegimeDeTache
): Promise<number> {
	if (identifiants.length === 0) return 0;
	await selonLeRegime(client.index(NOM_DE_L_INDEX).deleteDocuments([...identifiants]), regime);
	return identifiants.length;
}

/** Ce que la réindexation rapporte — des comptes, jamais un « c'est fait ». */
export interface RapportDeReindexation {
	readonly projetees: number;
	readonly indexees: number;
	readonly precedentes: number;
	readonly echange: boolean;
}

/**
 * La réindexation complète — « l'index n'entre pas dans la sauvegarde (`RG-NF-09`) : il
 * est reconstructible depuis la base, et sa réindexation est un test de cohérence ».
 *
 * ELLE NE PASSE JAMAIS PAR UN INDEX À MOITIÉ REMPLI : le corpus est écrit dans un index
 * de RECONSTRUCTION, les deux noms sont ÉCHANGÉS en une opération du moteur, puis
 * l'ancien est retiré. Une requête concurrente voit l'ancien index complet ou le nouveau
 * complet, jamais un état intermédiaire. LE TEST DE COHÉRENCE EST DANS LE RAPPORT : le
 * nombre projeté et le nombre porté par l'index sont rendus tous les deux.
 */
export async function reindexer(base: Base, client: Meilisearch): Promise<RapportDeReindexation> {
	const corpus = await projeterLeCorpus(base);

	const precedentes = await client
		.index(NOM_DE_L_INDEX)
		.getStats()
		.then((s) => s.numberOfDocuments)
		.catch(() => 0);

	await retirerLIndexSIlExiste(client, NOM_DE_L_INDEX_EN_RECONSTRUCTION);
	await assurerLIndex(client, NOM_DE_L_INDEX_EN_RECONSTRUCTION);
	if (corpus.length > 0) {
		await attendre(client.index(NOM_DE_L_INDEX_EN_RECONSTRUCTION).addDocuments([...corpus]));
	}

	/* L'échange exige que les deux index existent : celui de destination est posé
	   s'il ne l'était pas encore, ce qui rend la première réindexation identique
	   aux suivantes — un seul chemin, donc un seul comportement à connaître. */
	await assurerLIndex(client, NOM_DE_L_INDEX);
	/* `rename: false` — l'ÉCHANGE, pas le renommage. Les deux index existent et
	   troquent leurs contenus ; l'ancien reste accessible sous l'autre nom le
	   temps qu'on le retire. Le renommage, lui, effacerait la destination sans
	   qu'aucun état intermédiaire ne soit inspectable si l'opération échouait. */
	await attendre(
		client.swapIndexes([
			{ indexes: [NOM_DE_L_INDEX, NOM_DE_L_INDEX_EN_RECONSTRUCTION], rename: false }
		])
	);
	await retirerLIndexSIlExiste(client, NOM_DE_L_INDEX_EN_RECONSTRUCTION);

	const indexees = await client
		.index(NOM_DE_L_INDEX)
		.getStats()
		.then((s) => s.numberOfDocuments);

	return { projetees: corpus.length, indexees, precedentes, echange: true };
}

export interface EtatDeLIndex {
	readonly existe: boolean;
	readonly entrees: number;
	readonly champsCherchables: readonly string[];
	readonly champsFiltrables: readonly string[];
	readonly champsTriables: readonly string[];
	/** Les embedders déclarés. Vide : le mode « Sens » est indisponible. */
	readonly embedders: readonly string[];
}

export async function etatDeLIndex(client: Meilisearch): Promise<EtatDeLIndex> {
	const existe = await client
		.getRawIndex(NOM_DE_L_INDEX)
		.then(() => true)
		.catch(() => false);
	if (!existe) {
		return {
			existe: false,
			entrees: 0,
			champsCherchables: [],
			champsFiltrables: [],
			champsTriables: [],
			embedders: []
		};
	}
	const index = client.index(NOM_DE_L_INDEX);
	const stats = await index.getStats();
	const reglages = await index.getSettings();
	return {
		existe: true,
		entrees: stats.numberOfDocuments,
		champsCherchables: reglages.searchableAttributes ?? [],
		champsFiltrables: (reglages.filterableAttributes ?? []).map((a) =>
			typeof a === 'string' ? a : JSON.stringify(a)
		),
		champsTriables: reglages.sortableAttributes ?? [],
		embedders: Object.keys(reglages.embedders ?? {})
	};
}

/**
 * Le périmètre de l'appelant, puis son filtre — et le régime anonyme ne coûte AUCUNE
 * lecture de droit. Ce n'est pas une optimisation, c'est la forme de `RG-DRO-04` :
 * l'anonyme n'a pas de droits de dossier, il a un périmètre réduit à deux attributs de
 * la note. L'administrateur contourne (`RG-DRO-03`) : rien n'est lu non plus.
 * `perimetreDeLecture()` reçoit une liste de notes VIDE, qui ne sert qu'au régime
 * anonyme, déjà sorti.
 */
export async function filtreDeLIdentite(base: Base, identite: Identite): Promise<FiltreDIndex> {
	if (identite.type === 'anonyme') {
		return filtreDuPerimetre(identite, { tout: false, dossiers: new Set() });
	}
	if (identite.role === 'administrateur') {
		return filtreDuPerimetre(identite, { tout: true });
	}
	const perimetre = await perimetreDeLIdentite(base, identite);
	return filtreDuPerimetre(identite, perimetre);
}

/** Le périmètre AUTORISÉ d'une identité authentifiée — `resolution.ts` décide. */
export async function perimetreDeLIdentite(base: Base, identite: Identite): Promise<Perimetre> {
	const [arbre, droits] = await Promise.all([lireArbre(base), lireDroits(base)]);
	return perimetreDeLecture(identite, indexerLesDroits(arbre, droits));
}

/**
 * Le plafond de résultats d'une requête. Le moteur ne rend que vingt entrées par défaut,
 * et un plafond silencieux serait pire qu'un plafond assumé : l'écran montrerait vingt
 * notes là où le corpus en porte trente-deux. Le résultat porte `tronque`.
 */
export const PLAFOND_DE_RESULTATS = 1000;

/**
 * Les cinq ordres de `docs/routes.md` §4.2.
 *
 * LES NOMS SONT CEUX DES `<option>` du gel de V-08. LEUR SÉMANTIQUE VIENT DE
 * `V-12-liste-notes.html:2117-2124`, la seule maquette qui définisse `trier` :
 *
 *     if (t === "alpha")              a.titre.localeCompare(b.titre, "fr")
 *     else if (t === "consultations") b.vues - a.vues
 *     else if (t === "verification")  a.jours - b.jours
 *     else                            modifJours(a) - modifJours(b)
 *
 * `jours` est une ANCIENNETÉ : trier par ancienneté croissante, c'est trier par date
 * décroissante. La pertinence n'est pas une clause, c'est l'absence de clause.
 *
 * DEUX DIVERGENCES CONNUES avec V-12, dues au tri par le MOTEUR : `alpha` suit l'ordre
 * du moteur et non `localeCompare(…, 'fr')` ; `verification` place EN DERNIER les notes
 * jamais vérifiées. UNE TROISIÈME, D'UNE AUTRE NATURE : `consultations` classe sur la
 * valeur INDEXÉE quand l'écran affiche celle de la base — une ouverture de note
 * incrémente le compteur sans réindexer.
 *
 * Le tri est fait par le moteur PARCE QUE l'ordre doit décider AVANT le plafond de
 * résultats : trier après coup ne classerait que ce que le plafond a retenu.
 */
export const ORDRES_DE_TRI = [
	'pertinence',
	'modification',
	'verification',
	'consultations',
	'alpha'
] as const;

export type OrdreDeTri = (typeof ORDRES_DE_TRI)[number];

/** L'ordre par défaut : celui que le navigateur retient, faute de `selected`. */
export const ORDRE_PAR_DEFAUT: OrdreDeTri = 'pertinence';

/** L'ordre demandé, ou `null` si ce n'en est pas un — jamais un défaut deviné. */
export function ordreDeTriDemande(valeur: string | null): OrdreDeTri | null {
	return ORDRES_DE_TRI.find((o) => o === valeur) ?? null;
}

function clauseDeTri(tri: OrdreDeTri): readonly string[] {
	switch (tri) {
		case 'modification':
			return ['modifieLe:desc'];
		case 'verification':
			return ['verifieLe:desc'];
		case 'consultations':
			return ['consultations:desc'];
		case 'alpha':
			return ['titre:asc'];
		default:
			return [];
	}
}

export interface DemandeDeRecherche {
	readonly requete: string;
	readonly facettes?: URLSearchParams;
	readonly tri?: OrdreDeTri;
}

/**
 * Ce que le moteur rapporte d'une entrée — la clé primaire, et rien d'autre. Le
 * type est étroit à dessein : un type large annoncerait des champs que la réponse
 * ne porte pas, et le premier appelant qui les lirait obtiendrait `undefined`.
 */
type EntreeRapportee = { readonly id: string };

export interface ResultatDeRecherche {
	readonly identifiants: readonly string[];
	/** Le compte exact des notes retenues — `RG-M02-08`. */
	readonly total: number;
	readonly tronque: boolean;
	/** Le filtre effectivement envoyé — `null` : aucune requête n'a été émise. */
	readonly filtre: string | null;
	/**
	 * La durée de traitement du moteur, en millisecondes — `processingTimeMs` de la
	 * réponse, jamais une constante : les trois écrans de recherche affichaient une durée
	 * FABRIQUÉE dont le terme mesuré était nul par construction. `null` quand aucune
	 * requête n'a été émise — périmètre fermé (`RG-DRO-02`) : une durée qui n'existe pas ne
	 * se rend pas en `0,00 s`, c'est le zéro muet que `P-02` proscrit.
	 */
	readonly dureeMs: number | null;
}

/**
 * La recherche — le seul appel de recherche du dépôt, et il porte le filtre, calculé et
 * jamais reçu. `ADR-006` : « la requête envoyée au moteur NE PEUT PAS rapporter un
 * document interdit. »
 *
 * PÉRIMÈTRE VIDE : AUCUNE REQUÊTE. Ce n'est pas une économie, c'est la forme la plus
 * forte du filtre (`RG-DRO-02`). SEULS LES IDENTIFIANTS SONT DEMANDÉS : le contenu vient
 * de PostgreSQL, base de vérité, et une entrée d'index périmée ne peut donc pas faire
 * mentir un écran.
 */
export async function chercherLesNotes(
	base: Base,
	client: Meilisearch,
	identite: Identite,
	demande: DemandeDeRecherche
): Promise<ResultatDeRecherche> {
	const perimetre = await filtreDeLIdentite(base, identite);
	const facettes = demande.facettes === undefined ? [] : clausesDeFacette(demande.facettes);
	const filtre = filtreComplet(perimetre, facettes);

	if (!filtre.interroger) {
		return { identifiants: [], total: 0, tronque: false, filtre: null, dureeMs: null };
	}

	/* L'ORDRE EST DEMANDÉ AU MOTEUR, JAMAIS RÉTABLI APRÈS COUP — voir
	   `ORDRES_DE_TRI`. Une clause vide n'est pas envoyée : `sort: []` demanderait
	   au moteur un classement sur rien, là où la pertinence EST son classement. */
	const sort = clauseDeTri(demande.tri ?? ORDRE_PAR_DEFAUT);
	const reponse = await client.index<EntreeRapportee>(NOM_DE_L_INDEX).search(demande.requete, {
		filter: filtre.filtre,
		attributesToRetrieve: [CLE_PRIMAIRE],
		page: 1,
		hitsPerPage: PLAFOND_DE_RESULTATS,
		...(sort.length === 0 ? {} : { sort: [...sort] })
	});

	return {
		identifiants: reponse.hits.map((h) => h.id),
		total: reponse.totalHits,
		tronque: reponse.totalHits > reponse.hits.length,
		filtre: filtre.filtre,
		dureeMs: reponse.processingTimeMs
	};
}
