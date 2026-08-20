/**
 * L'ÉPREUVE DE L'ENTRETIEN DE L'INDEX — et elle porte les DEUX polarités.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'AUCUNE AUTRE BATTERIE NE MESURE
 *
 * `pnpm mesure:budgets` chronomètre un DÉLAI : il dit qu'une note enregistrée
 * est retrouvée, jamais sous quel périmètre. `pnpm test:etancheite` mesure des
 * ROUTES : il ne lit pas le contenu de l'index. Le périmètre écrit à
 * l'enregistrement n'a donc qu'un juge, et c'est ce fichier.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX POLARITÉS, ET LA SECONDE EST CELLE QU'ON OUBLIE — `P-5`
 *
 * Une note qui ENTRE dans le périmètre d'un compte au moment de l'écriture est
 * la polarité facile : elle se voit au premier essai, et un entretien qui
 * n'écrirait rien la ferait rougir.
 *
 * Une note qui EN SORT est la fuite, et rien ne la signale : l'index garde
 * l'ancienne entrée, la requête la rapporte, et `/recherche` lit en base les
 * identifiants QUE L'INDEX A RENDUS (`donnees/public.ts`) — sans les refiltrer,
 * puisque le filtre est censé être dans la requête (`ADR-006`). Trois sorties
 * sont donc éprouvées ici, une par mécanisme : le DÉPLACEMENT dans un dossier
 * hors périmètre, le passage de PUBLIQUE à INTERNE, et la DISPARITION.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE LIEN AVEC LA DÉCISION D'ACCÈS N'EST PAS RÉÉCRIT ICI — `P-01` EN ESPRIT
 *
 * Le contrôle ne compare pas l'entrée écrite à une liste attendue : il la
 * compare à ce que `perimetreDeLecture()` — la résolution des droits elle-même —
 * rend pour le compte. Une liste écrite à la main serait une seconde définition
 * du droit, et la première divergence lui donnerait raison ; c'est le
 * raisonnement que `recherche/commandes.ts` tient déjà pour son épreuve.
 *
 * Le champ interrogé est `dossier`, et c'est celui que `filtreDuPerimetre()`
 * emploie sous le régime authentifié — « c'est le DOSSIER PORTEUR de la note qui
 * est interrogé, jamais un ancêtre » (`perimetre.ts`). Pour l'anonyme, ce sont
 * `visibilite` et `statut`, et le contrôle porte sur eux.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TOUT EST SYNTHÉTIQUE — `P-26`
 *
 * Aucun cas ne dépend de l'état du dépôt : ni de la base, ni du moteur, ni du
 * corpus semé. L'arborescence, les droits et les notes sont fabriqués ici. Un
 * contrôle dont le seul cas d'épreuve est le défaut qu'il répare devient inerte
 * en réussissant ; celui-ci reste exercé après la correction de `T-075`.
 */
import { describe, expect, it } from 'vitest';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { dossiers, etiquettesDeNote, notes } from '../base/schema';
import {
	identiteAuthentifiee,
	indexerLesDroits,
	perimetreDeLecture,
	type DroitExplicite
} from '../droits/resolution';
import { entretenirLIndex } from './entretien';
import type { NoteIndexee } from './notes-indexees';

/* ═══════════════════════════════════ Le décor synthétique ═══════════════ */

/**
 * L'ARBORESCENCE D'ÉPREUVE — deux racines, et c'est le point.
 *
 *   `d-racine`      la racine où le droit du compte est posé
 *     `d-atelier`     sous elle : dans le périmètre, par `RG-DRO-05`
 *   `d-interdit`    l'autre racine : hors du périmètre, aucun droit
 */
const ARBRE = [
	{ id: 'd-racine', parentId: null },
	{ id: 'd-atelier', parentId: 'd-racine' },
	{ id: 'd-interdit', parentId: null }
];

const DROIT: DroitExplicite = { dossierId: 'd-racine', compteId: 'c-lecteur', droit: 'lecteur' };

const LECTEUR = identiteAuthentifiee('c-lecteur', 'contributeur');

/** Le corps minimal qu'`analyserDocument()` accepte — la forme de la semence. */
function corps(texte: string): unknown {
	return {
		type: 'doc',
		content: [{ type: 'paragraph', content: [{ type: 'text', text: texte }] }]
	};
}

/** Une ligne de `notes` telle que le socle de `projeterLeCorpus()` la lit. */
interface LigneDeNote {
	identifiant: string;
	titre: string;
	corpsReference: unknown;
	typeNom: string;
	typeFicheNom: string | null;
	universNom: string;
	domaineNom: string;
	dossierId: string;
	auteurNom: string;
	visibilite: 'interne' | 'publique';
	statut: 'brouillon' | 'publiee';
	modifieLe: Date;
	verifieLe: Date | null;
	consultations: number;
}

function uneNote(identifiant: string, dossierId: string): LigneDeNote {
	return {
		identifiant,
		titre: `Note ${identifiant}`,
		corpsReference: corps(`Le corps de ${identifiant}.`),
		typeNom: 'Procédure',
		typeFicheNom: null,
		universNom: 'Production',
		domaineNom: 'Exploitation',
		dossierId,
		auteurNom: 'Compte d’épreuve',
		visibilite: 'interne',
		statut: 'publiee',
		modifieLe: new Date('2026-08-20T10:00:00Z'),
		verifieLe: null,
		consultations: 0
	};
}

/**
 * LES IDENTIFIANTS QUE LA REQUÊTE RESTREINT — lus dans le prédicat de drizzle.
 *
 * `projeterLeCorpus()` pose `inArray(notes.identifiant, …)` quand on lui nomme
 * des notes. Une base d'épreuve qui ignorerait ce prédicat rendrait TOUT le
 * corpus, et le contrôle « seules les notes demandées sont réécrites » serait
 * vert sans rien exercer. Les valeurs sont donc extraites des morceaux de
 * requête, et un cas nommé plus bas rougit si l'extraction cesse de fonctionner :
 * la fixture est éprouvée, pas espérée (`P-5`).
 */
function identifiantsDuPredicat(predicat: unknown): string[] | null {
	const sorties: string[] = [];
	let vu = false;
	const descendre = (chose: unknown) => {
		if (Array.isArray(chose)) {
			for (const c of chose) descendre(c);
			return;
		}
		if (chose === null || typeof chose !== 'object') return;
		const objet = chose as { value?: unknown; queryChunks?: unknown };
		if (typeof objet.value === 'string') {
			vu = true;
			sorties.push(objet.value);
		}
		if (objet.queryChunks !== undefined) descendre(objet.queryChunks);
	};
	descendre((predicat as { queryChunks?: unknown }).queryChunks);
	return vu ? sorties : null;
}

/** La base d'épreuve — un état que les cas font bouger, et rien de plus. */
function baseDEpreuve(lignes: LigneDeNote[]) {
	const etat = { notes: lignes };

	const selection = (colonnes: Record<string, unknown>) => {
		let table: unknown = null;
		let restriction: string[] | null = null;
		const chaine: Record<string, unknown> = {
			from(t: unknown) {
				table = t;
				return chaine;
			},
			innerJoin: () => chaine,
			leftJoin: () => chaine,
			orderBy: () => chaine,
			where(predicat: unknown) {
				restriction = identifiantsDuPredicat(predicat);
				return chaine;
			},
			limit: () => chaine,
			then(suite: (v: unknown) => unknown, echec?: (e: unknown) => unknown) {
				return Promise.resolve(lire()).then(suite, echec);
			}
		};
		const lire = (): unknown[] => {
			if (table === dossiers) return ARBRE;
			if (table === etiquettesDeNote) return [];
			if (table === notes && 'corpsReference' in colonnes) {
				return restriction === null
					? etat.notes
					: etat.notes.filter((n) => (restriction as string[]).includes(n.identifiant));
			}
			return [];
		};
		return chaine;
	};

	return { base: { select: selection } as unknown as Base, etat };
}

/**
 * Le moteur d'épreuve — il retient ce qu'on lui écrit, et ce qu'on lui retire.
 *
 * IL DISTINGUE LES DEUX ÉCHECS, PARCE QU'`ARB-060` LES SÉPARE. La SOUMISSION
 * — l'enfilement, c'est-à-dire la requête HTTP au moteur — reste dans la requête
 * et doit lever. La TÂCHE, elle, n'est plus suivie : son état terminal ne peut
 * plus faire échouer un enregistrement, et le faux moteur doit pouvoir prouver
 * les deux polarités séparément.
 *
 * `waitTask` reste posé sur la tâche, et il est COMPTÉ : un cas nommé plus bas
 * exige qu'`entretenirLIndex()` ne l'appelle jamais. Sans ce compte, le retrait
 * de l'attente serait espéré et non posé — `P-5`.
 *
 * @param echecDeSoumission le moteur refuse l'enfilement (arrêté, injoignable)
 * @param echecDeTache la tâche est enfilée puis échoue — ce que le chemin de
 *   requête ne voit plus, et que le contrôle de `verif/budgets.mjs` relève
 */
function moteurDEpreuve(
	echecDeSoumission: string | null = null,
	echecDeTache: string | null = null
) {
	const ecrites: NoteIndexee[] = [];
	const retirees: string[] = [];
	let appels = 0;
	let attentes = 0;
	let dernierUid = 0;
	const tache = (type: string) => {
		dernierUid += 1;
		const enfilement =
			echecDeSoumission === null
				? Promise.resolve({ taskUid: dernierUid })
				: Promise.reject(new Error(echecDeSoumission));
		return Object.assign(enfilement, {
			waitTask: async () => {
				attentes += 1;
				return echecDeTache === null
					? { status: 'succeeded', type }
					: { status: 'failed', type, error: { message: echecDeTache } };
			}
		});
	};
	const client = {
		index: () => ({
			addDocuments(entrees: NoteIndexee[]) {
				appels += 1;
				ecrites.push(...entrees);
				return tache('documentAdditionOrUpdate');
			},
			deleteDocuments(ids: string[]) {
				appels += 1;
				retirees.push(...ids);
				return tache('documentDeletion');
			}
		})
	};
	return {
		client: client as unknown as Meilisearch,
		ecrites,
		retirees,
		appels: () => appels,
		attentes: () => attentes
	};
}

/** L'entrée d'index d'un identifiant, telle que la dernière écriture l'a posée. */
function derniereEntree(moteur: ReturnType<typeof moteurDEpreuve>, identifiant: string) {
	return [...moteur.ecrites].reverse().find((e) => e.id === identifiant);
}

/** Les dossiers que la RÉSOLUTION DES DROITS rend lisibles pour le lecteur. */
function dossiersLisibles(): ReadonlySet<string> {
	const perimetre = perimetreDeLecture(LECTEUR, indexerLesDroits(ARBRE, [DROIT]));
	if (perimetre.tout) throw new Error('le décor d’épreuve ne doit pas rendre un périmètre total');
	return perimetre.dossiers;
}

/* ═══════════════════════════════════ Le décor, d'abord ══════════════════ */

describe('le décor d’épreuve exerce bien ce qu’il prétend — P-5', () => {
	it('pose un périmètre qui contient une racine et son sous-dossier, pas l’autre racine', () => {
		const lisibles = dossiersLisibles();
		expect(lisibles.has('d-racine')).toBe(true);
		/* `RG-DRO-05` — un droit posé sur un dossier vaut pour tout son sous-arbre. */
		expect(lisibles.has('d-atelier')).toBe(true);
		/* Sans cette ligne, tous les cas de « sortie » seraient verts pour rien. */
		expect(lisibles.has('d-interdit')).toBe(false);
	});
});

/* ═══════════════════════════════════ Polarité 1 — l'entrée ══════════════ */

describe('une note écrite ENTRE dans l’index avec son périmètre', () => {
	it('écrit l’entrée, son dossier porteur et sa chaîne d’ancêtres', async () => {
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();

		const rapport = await entretenirLIndex(base, moteur.client, ['n-1']);

		expect(rapport).toEqual({ indexees: 1, retirees: 0 });
		const entree = derniereEntree(moteur, 'n-1');
		expect(entree?.dossier).toBe('d-atelier');
		/* La chaîne commence au dossier porteur et remonte jusqu’à la racine —
		   l’ordre de `RG-DRO-01`, « le plus proche d’abord ». */
		expect(entree?.ancetres).toEqual(['d-atelier', 'd-racine']);
		/* Le dossier porteur est dans le périmètre du lecteur : le filtre de
		   `perimetre.ts` interroge ce champ, et la note lui parvient. */
		expect(dossiersLisibles().has(entree?.dossier as string)).toBe(true);
	});

	it('porte l’extrait dérivé du corps — c’est ce qui rend la note trouvable', async () => {
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();
		await entretenirLIndex(base, moteur.client, ['n-1']);
		expect(derniereEntree(moteur, 'n-1')?.extrait).toContain('Le corps de n-1.');
	});

	it('ne réécrit QUE les notes nommées, jamais le corpus entier', async () => {
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier'), uneNote('n-2', 'd-atelier')]);
		const moteur = moteurDEpreuve();

		const rapport = await entretenirLIndex(base, moteur.client, ['n-1']);

		expect(rapport.indexees).toBe(1);
		expect(moteur.ecrites.map((e) => e.id)).toEqual(['n-1']);
		/* Et rien n’est retiré au passage : `n-2` n’a pas été demandée, elle n’est
		   donc ni réécrite ni effacée. */
		expect(moteur.retirees).toEqual([]);
	});
});

/* ═══════════════════════════════════ Polarité 2 — la sortie ═════════════ */

describe('une note qui SORT du périmètre en sort AUSSI dans l’index — la fuite', () => {
	it('réécrit le dossier et la chaîne quand la note est DÉPLACÉE hors du périmètre', async () => {
		const { base, etat } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();
		await entretenirLIndex(base, moteur.client, ['n-1']);
		expect(derniereEntree(moteur, 'n-1')?.dossier).toBe('d-atelier');

		/* L’écriture qui déplace la note. C’est le cas d’`ADR-006` : « le
		   déplacement d’un dossier impose une réindexation des documents
		   concernés : le chemin d’ancêtres projeté doit suivre ». */
		(etat.notes[0] as LigneDeNote).dossierId = 'd-interdit';
		await entretenirLIndex(base, moteur.client, ['n-1']);

		const entree = derniereEntree(moteur, 'n-1');
		expect(entree?.dossier).toBe('d-interdit');
		expect(entree?.ancetres).toEqual(['d-interdit']);
		/* LA PROPRIÉTÉ : le dossier porteur n’est plus dans le périmètre du
		   lecteur. Une entrée qui aurait gardé `d-atelier` serait rapportée par sa
		   requête, et `/recherche` lirait la note en base sans la refiltrer. */
		expect(dossiersLisibles().has(entree?.dossier as string)).toBe(false);
		/* L’ancienne chaîne ne subsiste nulle part dans l’entrée courante :
		   l’écriture REMPLACE le document, elle ne le fusionne pas. */
		expect(entree?.ancetres).not.toContain('d-racine');
	});

	it('réécrit la visibilité quand une note publique devient interne', async () => {
		const publiee = uneNote('n-1', 'd-atelier');
		publiee.visibilite = 'publique';
		const { base, etat } = baseDEpreuve([publiee]);
		const moteur = moteurDEpreuve();
		await entretenirLIndex(base, moteur.client, ['n-1']);
		expect(derniereEntree(moteur, 'n-1')?.visibilite).toBe('publique');

		(etat.notes[0] as LigneDeNote).visibilite = 'interne';
		await entretenirLIndex(base, moteur.client, ['n-1']);

		/* Le filtre anonyme d’`ADR-006` est « visibilite = publique AND statut =
		   publiee » : l’entrée réécrite ne le satisfait plus. */
		expect(derniereEntree(moteur, 'n-1')?.visibilite).toBe('interne');
	});

	it('réécrit le statut quand une note publiée retourne au brouillon', async () => {
		const { base, etat } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();
		await entretenirLIndex(base, moteur.client, ['n-1']);

		(etat.notes[0] as LigneDeNote).statut = 'brouillon';
		await entretenirLIndex(base, moteur.client, ['n-1']);

		expect(derniereEntree(moteur, 'n-1')?.statut).toBe('brouillon');
	});

	it('RETIRE de l’index une note qui n’est plus en base — la suppression', async () => {
		const { base, etat } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();
		await entretenirLIndex(base, moteur.client, ['n-1']);

		etat.notes = [];
		const rapport = await entretenirLIndex(base, moteur.client, ['n-1']);

		expect(rapport).toEqual({ indexees: 0, retirees: 1 });
		expect(moteur.retirees).toEqual(['n-1']);
	});

	it('sépare les vivantes des disparues dans un même lot', async () => {
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();

		const rapport = await entretenirLIndex(base, moteur.client, ['n-1', 'n-partie']);

		expect(rapport).toEqual({ indexees: 1, retirees: 1 });
		expect(moteur.ecrites.map((e) => e.id)).toEqual(['n-1']);
		expect(moteur.retirees).toEqual(['n-partie']);
	});
});

/* ═══════════════════════════════════ Les refus et les bords ═════════════ */

describe('ce que l’entretien refuse, et ce qu’il ne fait pas', () => {
	it('ne sollicite PAS le moteur quand aucune note n’est nommée', async () => {
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();

		const rapport = await entretenirLIndex(base, moteur.client, []);

		expect(rapport).toEqual({ indexees: 0, retirees: 0 });
		expect(moteur.appels()).toBe(0);
	});

	it('réduit les doublons plutôt que de les refuser', async () => {
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();

		const rapport = await entretenirLIndex(base, moteur.client, ['n-1', 'n-1', 'n-1']);

		expect(rapport.indexees).toBe(1);
		expect(moteur.ecrites).toHaveLength(1);
	});

	it('REFUSE d’indexer une note dont le dossier est hors de l’arborescence', async () => {
		/* `ADR-006`, dernière interdiction : « un document indexé sans périmètre
		   est un document public ». `projeterLeCorpus()` lève, et rien n’est écrit
		   — le refus n’est pas rattrapé ici, il remonte. */
		const { base } = baseDEpreuve([uneNote('n-1', 'd-fantome')]);
		const moteur = moteurDEpreuve();

		await expect(entretenirLIndex(base, moteur.client, ['n-1'])).rejects.toThrow(
			/hors de l’arborescence|aucun chemin d’ancêtres/
		);
		expect(moteur.appels()).toBe(0);
	});

	it('ne TAIT pas un échec de SOUMISSION — moteur arrêté, injoignable ou refusant', async () => {
		/* `ARB-060` : « il n'autorise pas à taire un échec de soumission ». C'est
		   la moitié de la décision qui ne bouge pas, et c'est celle qu'un lot
		   pressé aurait avalée avec l'autre. */
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve('le moteur a refusé');

		await expect(entretenirLIndex(base, moteur.client, ['n-1'])).rejects.toThrow(
			'le moteur a refusé'
		);
	});
});

/* ═══════════════════════════════════ ARB-060 — la soumission ════════════ */

/**
 * CE QUE CE GROUPE MESURE, ET POURQUOI IL EST ICI PLUTÔT QU'AILLEURS.
 *
 * `ARB-060` retire l'attente du CHEMIN DE REQUÊTE, et de lui seul. Ce module est
 * ce chemin — ses trois appelants sont les trois écritures que fait un
 * utilisateur. Le régime se lit donc ici, à deux lignes de code, et nulle part
 * ailleurs : `RegimeDeTache` n'a pas de valeur par défaut, si bien qu'aucun
 * appelant ne peut hériter d'un régime sans l'écrire.
 *
 * LA POLARITÉ INVERSE — l'attente CONSERVÉE dans `reindexer()`, les commandes de
 * console et `eprouverLesSondes()` — n'est pas mesurable ici : ces chemins ne
 * passent pas par ce module. Elle l'est par la lecture du régime au point
 * d'appel, et par le fait qu'`indexerDesNotes()` exige ce paramètre.
 */
describe('ARB-060 — l’entretien SOUMET la tâche et ne l’attend pas', () => {
	it('n’appelle jamais waitTask, ni pour l’écriture ni pour le retrait', async () => {
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve();

		/* Deux gestes en un : `n-1` est réécrite, `n-partie` n'est pas en base et
		   doit être retirée. Les DEUX tâches sont donc sollicitées, et aucune
		   attendue — un cas qui ne solliciterait que l'écriture laisserait le
		   retrait sans épreuve. */
		const rapport = await entretenirLIndex(base, moteur.client, ['n-1', 'n-partie']);

		expect(rapport).toEqual({ indexees: 1, retirees: 1 });
		expect(moteur.appels()).toBe(2);
		/* LE CŒUR DU LOT, EN UNE LIGNE : deux tâches posées, zéro attendue. */
		expect(moteur.attentes()).toBe(0);
	});

	it('NE LÈVE PLUS quand la tâche du moteur échoue après la soumission', async () => {
		/* Ce cas mesure exactement la garantie qui a CHANGÉ DE PLACE. Elle n'est
		   pas perdue : le moteur conserve ses tâches, et le contrôle « aucune
		   tâche en échec dans le moteur » de `verif/budgets.mjs` la relève après
		   coup. Un jour où ce contrôle disparaîtrait, ce cas resterait vert — c'est
		   pourquoi il NOMME le contrôle qui le complète. */
		const { base } = baseDEpreuve([uneNote('n-1', 'd-atelier')]);
		const moteur = moteurDEpreuve(null, 'la tâche a échoué');

		const rapport = await entretenirLIndex(base, moteur.client, ['n-1']);

		expect(rapport.indexees).toBe(1);
		expect(moteur.attentes()).toBe(0);
	});
});
