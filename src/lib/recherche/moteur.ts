/**
 * LE MOTEUR — alimenter l'index, et l'interroger AVEC le périmètre.
 *
 * `STACK-TECHNIQUE.md` §4.2 : « Meilisearch 1.53, avec un index unique pour le
 * corpus ». `ADR-006` : « l'autorisation est calculée côté serveur, avant toute
 * production de HTML et AVANT TOUTE REQUÊTE À L'INDEX, et elle est projetée dans
 * l'index de recherche ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * IL N'Y A QU'UN CHEMIN POUR INTERROGER L'INDEX, ET IL PORTE LE FILTRE
 *
 * `chercherLesNotes()` est la seule fonction de ce dépôt qui appelle la
 * recherche du moteur. Elle ne prend PAS de filtre en paramètre : elle le
 * CALCULE, depuis l'identité, par `resolution.ts` puis `perimetre.ts`. Un
 * appelant ne peut donc ni l'oublier, ni l'élargir, ni le remplacer — il n'a
 * aucun champ où l'écrire.
 *
 * C'est la forme qui tient la propriété, pas la relecture : `ADR-006` interdit
 * « toute route qui reçoit une liste puis la filtre », et une fonction qui
 * accepterait un filtre optionnel serait exactement la porte que cette
 * interdiction nomme.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX RÉGIMES DE TÂCHE, ET AUCUN N'EST UNE TEMPORISATION — ARB-060
 *
 * `ADR-006`, dernière conséquence : « le non-déterminisme de l'indexation en
 * test impose d'attendre l'indexation EXPLICITEMENT, jamais par temporisation ».
 * Cette interdiction tient dans les deux régimes, et c'est ce qui les rend
 * comparables : ni l'un ni l'autre ne dort.
 *
 *   `attendre()`   suit la tâche jusqu'à son état terminal et LÈVE si cet état
 *                  n'est pas la réussite. C'est `P-1` sous un autre habit : on
 *                  attend un marqueur écrit, pas l'écoulement d'un délai.
 *   `soumettre()`  POSE la tâche et rend son numéro. La soumission reste
 *                  synchrone — moteur arrêté, injoignable ou refusant, l'appel
 *                  échoue au même endroit qu'avant — mais la tâche n'est pas
 *                  suivie.
 *
 * `ARB-060` : « la requête d'enregistrement soumet le document à l'index et ne
 * l'attend pas ». Le régime n'a pas de valeur par défaut, et c'est la forme qui
 * tient la propriété : tout appelant DÉCLARE le sien, personne ne l'hérite. Le
 * cahier porte deux budgets sur deux lignes — indexation < 10 s (`CDC:1534`),
 * enregistrement < 1 s (`CDC:1537`) —, et l'attente coûte 804 ms d'intervalle de
 * regroupement du moteur, mesurés, indépendants de la volumétrie.
 *
 * CE QUE LA SOUMISSION PERD, ET OÙ CETTE GARANTIE EST REPLACÉE. `attendre()`
 * était le seul juge d'une tâche en échec ; sans elle, un échec survenu après la
 * soumission ne lèverait nulle part. Le moteur CONSERVE ses tâches : le contrôle
 * de `verif/budgets.mjs` — « aucune tâche en échec dans le moteur » — le relève
 * après coup, et rougit. Sans ce contrôle, `ARB-060` ne serait qu'un desserrage.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE FAIT PAS
 *
 *  - Il n'établit aucune identité, et n'en fabrique aucune. Il en reçoit une.
 *  - Il n'écrit aucune règle de droit : `resolution.ts` les porte toutes.
 *  - Il ne rend aucun contenu de note. L'index rapporte des IDENTIFIANTS ; le
 *    contenu affiché vient de PostgreSQL, qui reste la base de vérité
 *    (`ADR-006` : « l'index de recherche est un index reconstructible : le
 *    perdre n'a aucun effet sur le contenu »).
 *  - Il ne garde aucun résultat en mémoire. `ADR-006` interdit « tout cache
 *    d'index ou de résultat partagé entre personas » : rien n'est mémorisé ici,
 *    et le seul objet partagé est le client d'accès au moteur, qui ne porte
 *    aucune donnée de corpus.
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

/* ═══════════════════════════════════ Le client ═════════════════════════ */

/** Le client du moteur, construit sur la configuration lue de l'environnement. */
export function moteurDeRecherche(env: EnvironnementDeRecherche): Meilisearch {
	return clientDe(configurationDeRecherche(env));
}

/** Le client, à partir d'une configuration déjà validée. */
export function clientDe(config: ConfigurationDeRecherche): Meilisearch {
	return new Meilisearch({ host: config.host, apiKey: config.apiKey });
}

/* ═══════════════════════════════════ Les deux régimes de tâche ════════ */

/**
 * LE RÉGIME D'UNE TÂCHE DU MOTEUR — déclaré par l'appelant, jamais hérité.
 *
 * Il n'a délibérément PAS de valeur par défaut. Un défaut aurait fait de
 * l'attente un choix silencieux : le prochain appelant l'aurait obtenue — ou
 * perdue — sans l'écrire, et c'est exactement ce qu'`ARB-060` demande de rendre
 * lisible au point d'appel.
 */
export type RegimeDeTache =
	/** Suivre la tâche jusqu'à son état terminal et lever si ce n'est pas la
	 *  réussite. Partout où la latence ne coûte rien : réindexation, commandes
	 *  de console, épreuves de périmètre. */
	| 'attendre'
	/** Poser la tâche et rendre. Le CHEMIN DE REQUÊTE, et lui seul (`ARB-060`). */
	| 'soumettre';

/**
 * Attend la fin d'une tâche du moteur et LÈVE si elle n'a pas réussi.
 *
 * Un échec d'indexation silencieux est le pire des états : l'index paraît
 * alimenté et ne l'est pas, et la recherche rend moins que le corpus sans que
 * rien ne le dise. La tâche porte son erreur ; elle est remontée telle quelle.
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
 * SOUMET une tâche au moteur et rend son numéro, SANS la suivre — `ARB-060`.
 *
 * CE QUI RESTE SYNCHRONE, ET C'EST L'ESSENTIEL. La promesse rendue par le client
 * est celle de l'ENFILEMENT : l'attendre, c'est faire la requête HTTP au moteur
 * et lire son accusé. Un moteur arrêté, injoignable, saturé ou qui refuse la
 * requête fait donc échouer cet appel — au même endroit et de la même façon
 * qu'avant `ARB-060`, qui « n'autorise pas à taire un échec de soumission ».
 *
 * CE QUI CESSE D'ÊTRE SUIVI : l'état terminal de la tâche. Mesuré sur cette
 * copie, sept tirages, index de 32 documents — soumission 6 ms de médiane,
 * attente 804 ms, dont l'intervalle de regroupement du moteur fait la quasi
 * totalité. C'est cette part-là qui disparaît, et elle seule.
 *
 * @returns le numéro de la tâche enfilée — ce par quoi le moteur la nomme, et
 *   par quoi un contrôle la retrouve après coup
 */
export async function soumettre(tache: Promise<EnqueuedTask>): Promise<number> {
	const enfilee = await tache;
	return enfilee.taskUid;
}

/** Joue une tâche du moteur sous le régime que l'appelant a déclaré. */
async function selonLeRegime(
	tache: Promise<EnqueuedTask> & { waitTask: () => Promise<Task> },
	regime: RegimeDeTache
): Promise<void> {
	if (regime === 'attendre') await attendre(tache);
	else await soumettre(tache);
}

/* ═══════════════════════════════════ La projection du corpus ══════════ */

/** L'arborescence, réduite à ce que `RG-DRO-01` a besoin de remonter. */
async function lireArbre(base: Base): Promise<readonly DossierDeLArbre[]> {
	return await base.select({ id: dossiers.id, parentId: dossiers.parentId }).from(dossiers);
}

/** Les droits EXPLICITES, et eux seuls — le droit effectif se calcule. */
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
 * LE CORPUS, PROJETÉ POUR L'INDEX — avec son périmètre, note par note.
 *
 * La chaîne d'ancêtres vient de `chaineDAncetres()`, la fonction de
 * `resolution.ts` que la résolution des droits emploie elle-même. Aucune
 * remontée d'arborescence n'est réécrite ici : le chemin projeté dans l'index et
 * le chemin parcouru par la résolution sont le MÊME code, ce qui est la seule
 * façon qu'ils ne divergent pas.
 *
 * @param identifiants restreint la projection à ces notes — l'indexation
 *   synchrone d'une écriture n'a pas à relire le corpus entier. Absent : tout.
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

/* ═══════════════════════════════════ L'alimentation ═══════════════════ */

/** L'index existe-t-il ? Lu sur le moteur, jamais supposé. */
async function lIndexExiste(client: Meilisearch, uid: string): Promise<boolean> {
	return await client
		.getRawIndex(uid)
		.then(() => true)
		.catch(() => false);
}

/** Pose l'index s'il n'existe pas, et ses réglages dans tous les cas. */
export async function assurerLIndex(client: Meilisearch, uid: string): Promise<void> {
	if (!(await lIndexExiste(client, uid))) {
		await attendre(client.createIndex(uid, { primaryKey: CLE_PRIMAIRE }));
	}
	await attendre(client.index(uid).updateSettings(REGLAGES_DE_L_INDEX));
}

/**
 * RETIRE UN INDEX S'IL EXISTE — et n'enfile RIEN quand il n'existe pas.
 *
 * `deleteIndexIfExists()` du client ne tient pas son nom sous cette version
 * (`meilisearch` 0.60.0, `dist/index.js:1030`) : il n'attend que l'ENFILEMENT de
 * la suppression, et rattrape un refus SYNCHRONE que le moteur n'émet pas. Le
 * moteur, lui, accepte la demande puis fait ÉCHOUER la tâche en
 * `index_not_found`. Mesuré sur un moteur neuf : la première réindexation
 * laissait une tâche `indexDeletion` en état « failed », pour une opération
 * pourtant nominale et volontairement tolérée.
 *
 * DEUX RAISONS DE LE CORRIGER ICI, ET LA SECONDE DÉCIDE. La première est qu'un
 * échec toléré reste un échec inscrit dans le moteur. La seconde est que le
 * contrôle qui remplace l'attente du chemin de requête (`ARB-060`, point 2) pose
 * une question sans nuance — « existe-t-il, dans le moteur, une tâche en
 * échec ? ». Laisser subsister un producteur légitime de tâches en échec aurait
 * obligé ce contrôle à porter une liste d'exceptions, c'est-à-dire un trou
 * nommé, qui s'élargit à chaque cas suivant. On retire la cause, pas le
 * contrôle.
 *
 * L'ATTENTE EST ICI CONSERVÉE, et même AJOUTÉE : la réindexation est le lieu où
 * la latence ne coûte rien (`ARB-060`, point 1). Un retrait d'index non suivi
 * laisserait l'index de reconstruction en place sans que rien ne le dise.
 */
async function retirerLIndexSIlExiste(client: Meilisearch, uid: string): Promise<boolean> {
	if (!(await lIndexExiste(client, uid))) return false;
	await attendre(client.deleteIndex(uid));
	return true;
}

/**
 * L'ÉCRITURE D'UNE ÉCRITURE DE NOTE — `STACK` §4.2 : « l'écriture est synchrone
 * à l'enregistrement, le calcul du vecteur est différé. Une note est donc
 * trouvable en mots-clés immédiatement ».
 *
 * L'appelant est la couche qui vient d'écrire en base, et c'est LUI qui déclare
 * son régime. Sous `attendre`, la note est trouvable quand cette promesse rend.
 * Sous `soumettre` (`ARB-060`), elle l'est 804 ms plus tard : `RG-M05-06` et
 * `RG-M12-08` portent sur la trouvabilité « dans un délai maximal de 10
 * secondes », que ce régime tient avec un facteur douze.
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
 * LE RETRAIT DE L'INDEX — À APPELER APRÈS LA VALIDATION DE LA TRANSACTION,
 * JAMAIS AVANT.
 *
 * `STACK` §4.8, recopiée : « le retrait de l'index de recherche suit la
 * validation de la transaction, jamais avant — de sorte qu'une transaction
 * annulée ne puisse pas laisser un index amputé ». `ADR-009` porte la même
 * exigence.
 *
 * CE QUE CETTE SIGNATURE GARANTIT, ET CE QU'ELLE NE PEUT PAS GARANTIR. Elle ne
 * reçoit ni transaction, ni connexion : elle ne PEUT donc pas être appelée
 * depuis l'intérieur d'un bloc transactionnel en croyant y participer — il n'y a
 * rien à quoi s'y raccrocher. Mais aucune signature n'empêche un appelant de
 * l'invoquer trop tôt ; l'ordre reste à sa charge, et c'est pourquoi il est
 * écrit ici en majuscules plutôt que supposé.
 *
 * Le sens du défaut n'est pas symétrique, et il faut le dire : un retrait TROP
 * TARD laisse une entrée qui ne mène nulle part — la route de lecture revérifie
 * le droit et rend introuvable. Un retrait TROP TÔT, suivi d'une annulation,
 * laisse une note bien vivante et INTROUVABLE. C'est la seconde faute qui coûte,
 * et c'est celle que l'ordre prescrit évite.
 *
 * LE RÉGIME NE DÉPLACE PAS CET ORDRE, il ne déplace que l'instant où le retrait
 * est ACQUIS. Sous `soumettre`, l'entrée survit encore quelques centaines de
 * millisecondes après le retour — sans effet sur la fuite que ce module évite :
 * la route de lecture revérifie le droit et rend l'entrée périmée introuvable.
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
	/** Le nombre de notes projetées depuis la base. */
	readonly projetees: number;
	/** Le nombre d'entrées que le moteur porte APRÈS l'échange. */
	readonly indexees: number;
	/** Le nombre d'entrées que l'index portait avant. */
	readonly precedentes: number;
	/** L'index a-t-il été échangé, ou posé pour la première fois ? */
	readonly echange: boolean;
}

/**
 * LA RÉINDEXATION COMPLÈTE — « l'index n'entre pas dans la sauvegarde
 * (`RG-NF-09`) : il est reconstructible depuis la base, et sa réindexation est un
 * test de cohérence ».
 *
 * ELLE NE PASSE JAMAIS PAR UN INDEX À MOITIÉ REMPLI. Le corpus est écrit dans un
 * index de RECONSTRUCTION, puis les deux noms sont ÉCHANGÉS en une opération du
 * moteur, puis l'ancien est retiré. Une requête concurrente voit donc l'ancien
 * index complet, ou le nouveau complet, jamais un état intermédiaire. Vider
 * l'index puis le remplir aurait laissé une fenêtre pendant laquelle la
 * recherche rend moins que le corpus — une fenêtre où rien n'est faux, et où
 * tout est incomplet.
 *
 * LE TEST DE COHÉRENCE EST DANS LE RAPPORT, pas dans un commentaire : le nombre
 * projeté depuis la base et le nombre porté par l'index sont rendus tous les
 * deux. L'appelant les compare — s'ils diffèrent, la reconstruction n'a pas
 * reconstruit le corpus.
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

/** L'état de l'index — ce qu'il porte, et ce qu'il ne portera pas. */
export interface EtatDeLIndex {
	readonly existe: boolean;
	readonly entrees: number;
	readonly champsCherchables: readonly string[];
	readonly champsFiltrables: readonly string[];
	readonly champsTriables: readonly string[];
	/** Les embedders déclarés. Vide : le mode « Sens » est indisponible. */
	readonly embedders: readonly string[];
}

/** Lit l'état réel de l'index — mesuré sur le moteur, jamais supposé. */
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

/* ═══════════════════════════════════ Le périmètre de l'appelant ═══════ */

/**
 * LE PÉRIMÈTRE DE L'APPELANT, PUIS SON FILTRE — et le régime anonyme ne coûte
 * AUCUNE lecture de droit.
 *
 * Trois régimes, trois coûts, et ce n'est pas une optimisation : c'est la forme
 * de `RG-DRO-04`. L'anonyme n'a pas de droits de dossier — il a un périmètre,
 * réduit par `ADR-006` à deux attributs de la note. Aucune table de droits n'est
 * donc lue pour lui, et aucun droit ne peut lui parvenir par une branche
 * oubliée. L'administrateur contourne (`RG-DRO-03`) : rien n'est lu non plus.
 *
 * `perimetreDeLecture()` reçoit une liste de notes VIDE, et c'est correct :
 * cette liste ne sert qu'au régime anonyme, qui est déjà sorti. La lire serait
 * un balayage du corpus entier sans effet sur le résultat.
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

/* ═══════════════════════════════════ La requête ═══════════════════════ */

/**
 * LE PLAFOND DE RÉSULTATS D'UNE REQUÊTE.
 *
 * Le moteur ne rend pas tout par défaut — vingt entrées —, et un plafond
 * silencieux serait pire qu'un plafond assumé : l'écran montrerait vingt notes
 * là où le corpus en porte trente-deux, sans que rien ne le dise. La valeur est
 * celle du plafond de comptage du moteur laissé à son défaut, et le résultat
 * porte `tronque` : ce que le plafond retient est COMPTÉ, jamais caché.
 *
 * Aucun écran gelé n'a d'axe de pagination : la découper n'est pas de ce lot, et
 * ne s'invente pas ici.
 */
export const PLAFOND_DE_RESULTATS = 1000;

/* ═══════════════════════════════════ L'ordre de tri ════════════════════ */

/**
 * LES CINQ ORDRES DE `docs/routes.md` §4.2, ET CE QUI LES DÉFINIT.
 *
 * LES NOMS NE SONT PAS INVENTÉS : ce sont les valeurs des `<option>` du gel de
 * V-08 (`mockups/V-08-recherche.html:1191-1195`), reprises telles quelles par
 * `docs/routes.md:243`.
 *
 * LEUR SÉMANTIQUE NON PLUS, ET C'EST LE POINT QUI A LONGTEMPS MANQUÉ. V-08
 * appelle `trier(filtres)` (`V-08:1966`) sans définir `trier` : la fonction
 * n'existe nulle part dans ses 2 377 lignes, `rendre()` lève une
 * `ReferenceError` à chaque appel, et c'est pourquoi la zone de résultats de la
 * référence reste vide sur les sept états (voir l'en-tête de `V-08.svelte`).
 *
 * MAIS UNE AUTRE MAQUETTE GELÉE LA DÉFINIT, avec les MÊMES quatre valeurs et
 * les mêmes libellés : `mockups/V-12-liste-notes.html:2117-2124`, dont le
 * sélecteur (`V-12:1151-1156`) porte `modification`, `verification`,
 * `consultations` et `alpha`. Recopiée :
 *
 *     if (t === "alpha")             a.titre.localeCompare(b.titre, "fr")
 *     else if (t === "consultations") b.vues - a.vues
 *     else if (t === "verification")  a.jours - b.jours
 *     else                            modifJours(a) - modifJours(b)
 *
 * `jours` est l'ancienneté de la dernière vérification et `modifJours` celle de
 * la dernière modification (`V-12:1702-1716`) : trier par ancienneté CROISSANTE,
 * c'est trier par date DÉCROISSANTE. D'où les quatre clauses ci-dessous. Rien
 * n'est inventé — les maquettes priment, et l'une d'elles écrit la règle.
 *
 * LA PERTINENCE N'EST PAS UNE CLAUSE, c'est l'absence de clause : le classement
 * par défaut du moteur. `CHAMPS_TRIABLES` de `notes-indexees.ts` le disait déjà
 * avant ce lot, et déclarait les quatre champs qui suivent.
 *
 * DEUX DIVERGENCES CONNUES AVEC LES COMPARATEURS DE V-12, et elles tiennent au
 * fait que le tri est fait par le MOTEUR et non sur une liste déjà en mémoire :
 *
 *   · `alpha` suit l'ordre du moteur, non `localeCompare(…, 'fr')` ; deux
 *     titres qui ne diffèrent que par une diacritique peuvent donc se ranger
 *     autrement ;
 *   · `verification` place EN DERNIER les notes jamais vérifiées, dont
 *     `verifieLe` est nul, là où `jours` de V-12 retombe sur la modification.
 *     C'est ce que l'écran dit d'elles par ailleurs — « Jamais révisé ».
 *
 * ET UNE TROISIÈME, MESURÉE, QUI N'EST PAS DE MÊME NATURE : `consultations`
 * classe sur la valeur INDEXÉE, que l'écran n'affiche pas — il affiche celle de
 * la base, seule vérité (`lireNotes()`). Une ouverture de note incrémente le
 * compteur en base (`T-078`) sans réindexer la note : les deux valeurs dérivent
 * donc entre deux indexations. Mesuré le 21/08/2026 sur la base partagée :
 * index 1 856 · 1 434 · 631 contre base 1 842 · 1 431 · 623 pour trois notes,
 * l'ORDRE restant le même. Le jour où l'écart de deux notes voisines dépassera
 * leur intervalle, l'ordre affiché paraîtra faux à qui lit les chiffres.
 * Refermer cela est une décision d'indexation — réindexer à chaque
 * consultation, ou trier hors du moteur —, pas un réglage de ce tri : c'est
 * REMONTÉ, pas comblé.
 *
 * Le tri est fait par le moteur PARCE QUE l'ordre doit décider AVANT le plafond
 * de résultats : trier après coup ne classerait que ce que le plafond a déjà
 * retenu, et le premier corpus dépassant `PLAFOND_DE_RESULTATS` rendrait un
 * classement faux sans que rien ne le dise.
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

/** La clause de tri du moteur, vide pour la pertinence. */
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

/** Ce qu'une requête demande. Le filtre n'en fait PAS partie : il se calcule. */
export interface DemandeDeRecherche {
	/** La requête de mots-clés. Vide : tout le périmètre. */
	readonly requete: string;
	/** Les paramètres de facette DÉJÀ CRIBLÉS par la couche de route. */
	readonly facettes?: URLSearchParams;
	/** L'ordre demandé. Absent : la pertinence, classement par défaut du moteur. */
	readonly tri?: OrdreDeTri;
}

/**
 * CE QUE LE MOTEUR RAPPORTE D'UNE ENTRÉE — la clé primaire, et rien d'autre.
 *
 * Le type est étroit à dessein : il dit ce que la requête demande. Un type large
 * annoncerait des champs que la réponse ne porte pas, et le premier appelant qui
 * les lirait obtiendrait `undefined` sans qu'aucun contrôle ne l'ait signalé.
 */
type EntreeRapportee = { readonly id: string };

/** Ce qu'une requête rapporte — des identifiants, jamais du contenu. */
export interface ResultatDeRecherche {
	/** Les identifiants des notes retenues, dans l'ordre du moteur. */
	readonly identifiants: readonly string[];
	/** Le compte exact des notes retenues — `RG-M02-08`. */
	readonly total: number;
	/** Le plafond a-t-il retenu des résultats ? */
	readonly tronque: boolean;
	/** Le filtre effectivement envoyé — `null` : aucune requête n'a été émise. */
	readonly filtre: string | null;
}

/**
 * LA RECHERCHE — le seul appel de recherche du dépôt, et il porte le filtre.
 *
 * Le filtre est calculé, jamais reçu. `ADR-006` : « à chaque requête, le serveur
 * calcule l'ensemble des dossiers effectivement lisibles par l'appelant […] et
 * l'injecte comme filtre. La requête envoyée au moteur NE PEUT PAS rapporter un
 * document interdit. »
 *
 * PÉRIMÈTRE VIDE : AUCUNE REQUÊTE. Ce n'est pas une économie, c'est la forme la
 * plus forte du filtre — le moteur n'est pas sollicité du tout, et le résultat
 * est vide parce qu'il ne peut pas être autre chose (`RG-DRO-02`).
 *
 * SEULS LES IDENTIFIANTS SONT DEMANDÉS. Le contenu affiché est lu dans
 * PostgreSQL, base de vérité : l'index n'a pas à porter la vérité d'affichage,
 * et une entrée d'index périmée ne peut donc pas faire mentir un écran.
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
		return { identifiants: [], total: 0, tronque: false, filtre: null };
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
		filtre: filtre.filtre
	};
}
