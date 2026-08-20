/**
 * LES UNITAIRES DU CHEMIN PUBLIC — les décisions, sans base.
 *
 * Ce qui exige une base est `pnpm verif:donnees` et la batterie 6 ; les mêler
 * ici rendrait `pnpm test:unit` dépendant de Docker, et une batterie qui ne
 * s'exécute pas ne prouve rien (`lecture.test.ts` pose la règle, celui-ci la
 * suit).
 *
 * TROIS PROPRIÉTÉS Y SONT ÉPROUVÉES, ET CHACUNE A UN CAS QUI LA SOLLICITE —
 * `P-5` et `P-26` : un contrôle dont l'unique cas est l'état du dépôt devient
 * inerte le jour où le dépôt change.
 *
 *   1. **le filtre public est celui de `resolution.ts`, pas celui de
 *      `seeds/corpus.ts`.** Le cas qui les sépare — une note **publique en
 *      brouillon** — n'existe dans aucune donnée livrée (mesuré en base : 6
 *      publique+publiée, 25 interne+publiée, 1 interne+brouillon, **0**
 *      publique+brouillon). Il est donc SYNTHÉTIQUE ici, et le reste quelle que
 *      soit la semence de demain ;
 *   2. **un paramètre non honoré n'a aucun chemin jusqu'à la réponse.** Le cas
 *      qui le sollicite est un jeu de paramètres où `statut=` et `visibilite=`
 *      sont présents ET répétés, ce qu'aucune adresse du produit ne produit ;
 *   3. **les deux cas du point dur de V-04 passent par le même appel.** Le cas
 *      est l'égalité d'IDENTITÉ de référence entre les deux résolutions —
 *      `resolution.test.ts` la pose sur `INTROUVABLE`, celui-ci prouve que le
 *      chemin public l'atteint.
 */
import { describe, expect, it } from 'vitest';
import {
	ANONYME,
	INTROUVABLE,
	identiteAuthentifiee,
	indexerLesDroits,
	noteVisibleEnAnonyme,
	resoudre
} from '../droits/resolution';
import { notesPubliques, type Note } from '../../../seeds/corpus';
import {
	LACUNES_DU_CHEMIN_PUBLIC,
	PARAMETRES_HONORES_EN_ANONYME,
	SENS_DISPONIBLE,
	casDeV04,
	casDeV26,
	parametresHonores,
	peutEcrireQuelquePart,
	requeteDemandee,
	vueDeLAdresseNonResolue
} from './public';

/* ═══════════════════════════════════════ Le décor ══════════════════════ */

/**
 * Une arborescence à trois étages : `racine → intermediaire → feuille`, plus un
 * second sous-arbre pour qu'un droit posé sur le premier ne suffise jamais à
 * ouvrir le second.
 */
const ARBRE = [
	{ id: 'racine', parentId: null },
	{ id: 'intermediaire', parentId: 'racine' },
	{ id: 'feuille', parentId: 'intermediaire' },
	{ id: 'ailleurs', parentId: null }
];

const MOI = identiteAuthentifiee('compte-1', 'contributeur');
const ADMIN = identiteAuthentifiee('compte-2', 'administrateur');

/* ═══════════════════ 1 · Le filtre public, et sa moitié invisible ══════ */

describe('le périmètre public — publique ET publiée', () => {
	/**
	 * Les quatre couples (visibilité × statut) dans le MÊME dossier : le dossier
	 * unique rend impossible de confondre le filtre de dossier avec celui de la
	 * note, puisque les quatre le partagent.
	 */
	const PROJECTIONS = [
		{ nom: 'pub-publiee', visibilite: 'publique', statut: 'publiee' },
		{ nom: 'pub-brouillon', visibilite: 'publique', statut: 'brouillon' },
		{ nom: 'int-publiee', visibilite: 'interne', statut: 'publiee' },
		{ nom: 'int-brouillon', visibilite: 'interne', statut: 'brouillon' }
	] as const;

	it('ne laisse passer que la note publique ET publiée', () => {
		const passees = PROJECTIONS.filter((p) =>
			noteVisibleEnAnonyme({ dossierId: 'feuille', visibilite: p.visibilite, statut: p.statut })
		).map((p) => p.nom);
		expect(passees).toEqual(['pub-publiee']);
	});

	/**
	 * LA DEMI-RÈGLE D'`ECART-047`, ÉPROUVÉE DE FACE. `notesPubliques()` de
	 * `seeds/corpus.ts` ne connaît que la visibilité ; le chemin public exige
	 * aussi le statut. Le brouillon public est le SEUL cas qui les sépare, et il
	 * n'existe dans aucune donnée livrée : sans ce test, la différence serait
	 * invisible et la règle « espérée » plutôt que posée.
	 */
	it('diverge de notesPubliques() sur le brouillon public — le cas que le corpus n’a pas', () => {
		const brouillonPublic = {
			id: 'n-brouillon-public',
			visibilite: 'Publique'
		} as unknown as Note;

		expect(notesPubliques([brouillonPublic])).toHaveLength(1);
		expect(
			noteVisibleEnAnonyme({
				dossierId: 'feuille',
				visibilite: 'publique',
				statut: 'brouillon'
			})
		).toBe(false);
	});
});

/* ═══════════════════ 2 · Le point dur de V-04 ═════════════════════════ */

describe('le point dur de V-04 — inexistante ≡ existante non publique', () => {
	const publique = { dossierId: 'feuille', visibilite: 'publique', statut: 'publiee' } as const;
	const interne = { dossierId: 'feuille', visibilite: 'interne', statut: 'publiee' } as const;

	it('rend le MÊME OBJET pour l’inexistence et pour le refus', () => {
		const inexistante = resoudre(undefined, noteVisibleEnAnonyme);
		const nonPublique = resoudre(interne, noteVisibleEnAnonyme);

		/* Non « deux objets égaux » : LE MÊME. Une divergence future — un champ
		   `raison`, un code — casserait immédiatement cette égalité. */
		expect(inexistante).toBe(INTROUVABLE);
		expect(nonPublique).toBe(INTROUVABLE);
		expect(inexistante).toBe(nonPublique);
	});

	it('laisse passer la note publique et publiée, et elle seule', () => {
		expect(resoudre(publique, noteVisibleEnAnonyme).trouve).toBe(true);
		expect(resoudre(interne, noteVisibleEnAnonyme).trouve).toBe(false);
	});

	/**
	 * `docs/routes.md` §5.5 : la ligne « note interne ou brouillon » rend
	 * **404 V-04** dans les QUATRE colonnes. L'écran d'échec de `/guides/…` ne
	 * dépend donc pas de la session — sans quoi le cookie dirait ce que
	 * `ARB-007` A-05 interdit de dire.
	 */
	it('sert V-04 sous /guides quelle que soit la session', () => {
		expect(vueDeLAdresseNonResolue('/guides/n-quelconque', false)).toBe('V-04');
		expect(vueDeLAdresseNonResolue('/guides/n-quelconque', true)).toBe('V-04');
	});

	/** Hors espace public, la règle générale de `docs/routes.md:90` s'applique. */
	it('sert V-04 en anonyme et V-26 en session hors espace public', () => {
		expect(vueDeLAdresseNonResolue('/notes/n-quelconque', false)).toBe('V-04');
		expect(vueDeLAdresseNonResolue('/notes/n-quelconque', true)).toBe('V-26');
		expect(vueDeLAdresseNonResolue('/ceci-nexiste-pas', false)).toBe('V-04');
		expect(vueDeLAdresseNonResolue('/ceci-nexiste-pas', true)).toBe('V-26');
	});

	/**
	 * `/guides` nu est « l'adresse racine erronée » de la planche
	 * (`docs/routes.md:103`). Elle ne porte AUCUN identifiant de corpus : la
	 * distinguer ne révèle rien. Toute adresse qui en porte un rend la position
	 * commune aux deux cas indiscernables.
	 */
	it('ne distingue que l’adresse racine erronée, jamais deux identifiants', () => {
		expect(casDeV04('/guides')).toBe('nu');
		expect(casDeV04('/guides/')).toBe('nu');
		expect(casDeV04('/guides/n-existe-pas')).toBe('prive');
		expect(casDeV04('/guides/n-interne')).toBe('prive');
		expect(casDeV04('/guides/n-existe-pas')).toBe(casDeV04('/guides/n-interne'));
	});

	/**
	 * La pierre tombale de V-26 est la SEULE dérogation admise à `RG-ACC-04`
	 * (`docs/routes.md:163`), et elle est la position PAR DÉFAUT de la vue : ne
	 * rien passer la servirait, avec un auteur, une date et un motif écrits dans
	 * le gel. Le produit ne la sert jamais.
	 */
	it('ne sert jamais la pierre tombale de V-26', () => {
		expect(casDeV26()).toBe('inexistante');
		expect(casDeV26()).not.toBe('supprimee');
	});
});

/* ═══════════════════ 3 · Les paramètres ignorés, jamais refusés ════════ */

describe('les paramètres d’adresse — ignorés, jamais refusés', () => {
	it('n’honore que q, domaine et type en anonyme', () => {
		expect([...PARAMETRES_HONORES_EN_ANONYME]).toEqual(['q', 'domaine', 'type']);
	});

	/**
	 * LE CAS QUI SOLLICITE LA RÈGLE, et qu'aucune adresse du produit ne produit :
	 * `statut=` et `visibilite=` présents, répétés, mêlés aux honorés. Le crible
	 * doit rendre le MÊME jeu que sans eux — sinon « ignorer » voudrait encore
	 * dire « répondre quelque chose ».
	 */
	it('rend le même jeu avec et sans les paramètres non honorés', () => {
		const sans = new URLSearchParams('q=mot+de+passe&domaine=Support&type=Guide');
		const avec = new URLSearchParams(
			'q=mot+de+passe&statut=Brouillon&domaine=Support&visibilite=Interne&statut=Publiee&type=Guide&tri=alpha'
		);
		expect(parametresHonores(avec, false).toString()).toBe(
			parametresHonores(sans, false).toString()
		);
	});

	it('ne laisse fuir aucun paramètre non honoré', () => {
		const retenus = parametresHonores(
			new URLSearchParams('q=a&statut=Brouillon&visibilite=Interne&mode=sens'),
			false
		);
		expect([...retenus.keys()]).toEqual(['q']);
		expect(retenus.has('statut')).toBe(false);
		expect(retenus.has('visibilite')).toBe(false);
		expect(retenus.has('mode')).toBe(false);
	});

	/** En session, V-08 n'a d'axe pour aucun paramètre — `q` compris. */
	it('n’honore aucun paramètre en session', () => {
		expect([...parametresHonores(new URLSearchParams('q=a&domaine=b'), true).keys()]).toEqual([]);
	});

	it('rend la requête telle quelle, sans validation ni troncature', () => {
		expect(requeteDemandee(new URLSearchParams('q=mot+de+passe'))).toBe('mot de passe');
		expect(requeteDemandee(new URLSearchParams())).toBe('');
		expect(requeteDemandee(new URLSearchParams('q=%3Cscript%3E'))).toBe('<script>');
	});
});

/* ═══════════════════ 4 · La capacité d’écriture ═══════════════════════ */

describe('la capacité d’écriture — par capacites(), jamais par le rôle', () => {
	it('refuse l’anonyme sans consulter l’arbre', () => {
		expect(peutEcrireQuelquePart(ANONYME, indexerLesDroits(ARBRE))).toBe(false);
	});

	/** `RG-DRO-02` — aucun droit explicite, aucune capacité. */
	it('refuse un authentifié sans droit explicite', () => {
		expect(peutEcrireQuelquePart(MOI, indexerLesDroits(ARBRE))).toBe(false);
	});

	/** La table de CDC §2.3 : `lecteur` lit, il n'écrit pas. */
	it('refuse le droit de lecteur, accorde celui de rédacteur', () => {
		const lecteur = indexerLesDroits(ARBRE, [
			{ dossierId: 'racine', compteId: 'compte-1', droit: 'lecteur' }
		]);
		const redacteur = indexerLesDroits(ARBRE, [
			{ dossierId: 'racine', compteId: 'compte-1', droit: 'redacteur' }
		]);
		expect(peutEcrireQuelquePart(MOI, lecteur)).toBe(false);
		expect(peutEcrireQuelquePart(MOI, redacteur)).toBe(true);
	});

	/** `RG-DRO-03` — l'administrateur contourne les droits de dossier. */
	it('accorde à l’administrateur', () => {
		expect(peutEcrireQuelquePart(ADMIN, indexerLesDroits(ARBRE))).toBe(true);
	});
});

/* ═══════════════════ 5 · Ce qui est déclaré et non comblé ═════════════ */

describe('les constats déclarés', () => {
	/**
	 * `T-027` n'a pas alimenté l'index : le mode « Sens » n'existe pas, et il se
	 * DÉCLARE indisponible plutôt que d'être simulé (`P-02`, `P-10`). Le jour où
	 * il existera, ce test rougira — c'est ce qu'on lui demande.
	 */
	it('déclare le mode « Sens » indisponible', () => {
		expect(SENS_DISPONIBLE).toBe(false);
	});

	/**
	 * Les lacunes sont COMPTÉES, jamais seulement racontées : un lot futur qui en
	 * refermerait une fait rougir ce test plutôt que de laisser un commentaire
	 * périmé derrière lui.
	 */
	it('compte six lacunes, chacune nommée avec son écran et son motif', () => {
		expect(LACUNES_DU_CHEMIN_PUBLIC).toHaveLength(6);
		for (const lacune of LACUNES_DU_CHEMIN_PUBLIC) {
			expect(lacune.donnee.length).toBeGreaterThan(0);
			expect(lacune.vue).toMatch(/^V-\d\d/);
			expect(lacune.affichage.length).toBeGreaterThan(0);
			expect(lacune.motif.length).toBeGreaterThan(30);
		}
	});
});
