/**
 * T-045 — LE CONTRAT DE PROPRIÉTÉS DES VUES CÂBLÉES.
 *
 * Ce que ces cas prouvent, et rien d'autre : chacune des vues du lot accepte en
 * PROPRIÉTÉ les sources qu'elle importait en constante, et pour chacune
 *
 *   · ABSENTE, LE DÉFAUT S'APPLIQUE — la rendre en passant explicitement la
 *     constante du jeu de semence donne le MÊME balisage, à l'octet, que de
 *     l'omettre. C'est la propriété qui garantit que le banc ne bouge pas : le
 *     mode démo ne passe que `vecteur`/`etat` et `notes`.
 *   · FOURNIE, ELLE L'EMPORTE — la rendre avec une autre valeur change le
 *     balisage. Sans ce second cas, la propriété serait acceptée sans être lue,
 *     et le contrôle serait celui d'une règle que rien n'exerce (P-5).
 *
 * CHAQUE SOURCE EST ÉPROUVÉE DANS UN ÉTAT QUI LA LIT. Onze des dix-neuf ne sont
 * lues que dans un état précis — l'étape 3 de l'import, le dialogue de gabarits,
 * le rapport de lot. Mesurée dans l'état par défaut, la source aurait rendu le
 * même balisage des deux côtés et le cas aurait été VERT SANS RIEN PROUVER.
 * L'état choisi est porté à `base`, et le motif avec lui.
 *
 * LA COMPARAISON PORTE SUR LE BALISAGE ENTIER, jamais sur une chaîne choisie :
 * un marqueur bien choisi prouve qu'une chaîne a circulé, l'égalité du rendu
 * prouve que RIEN d'autre n'a bougé.
 *
 * LE CHEMIN EMPRUNTÉ EST CELUI DU PRODUIT — `ssrLoadModule` puis `render()`,
 * comme le mode démo, les deux tirés du MÊME graphe de modules. Un cas qui
 * n'aurait pas traversé le compilateur Svelte ne dirait rien du composant
 * réellement servi (ÉCART-013 É-1).
 *
 * CE QUE CES CAS NE PROUVENT PAS : la conformité au gel, qui est le domaine du
 * banc de comparaison, et le routage, qui n'est pas de ce lot — aucune vue
 * n'est branchée à un chargeur ici.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import {
	ACTIVITE,
	COMPTES,
	CONFIG,
	CONTRIBUTIONS,
	DISTINCTIONS,
	DOMAINES,
	FORMATS_IMPORT,
	INSTANCE,
	JOURNAL_IMPORTS,
	LOT_IMPORT,
	MOI,
	RELATIONS,
	TEMPLATES,
	TYPES_NOTE,
	TYPES_RELATION,
	UNIVERS,
	VERSIONS,
	corpusDeVariante,
	type Compte,
	type Domaine,
	type EtatDInstance,
	type Note,
	type Univers,
	type UtilisateurCourant,
	type Version
} from '../../seeds/corpus';
import { CONFIGURATION_PAR_DEFAUT } from '../lib/base/schema';
/* LES DEUX POSITIONS DE PLANCHE SERVIES ET LA DÉRIVATION DES TERMES VIENNENT DE
   LEURS SOURCES, celles-là mêmes que `+error.svelte` et les vues emploient. Les
   recopier ici aurait éprouvé la copie, et la copie aurait pu diverger sans que
   rien ne rougisse. */
import { casDeV04, casDeV26 } from '../lib/donnees/public';
import { requeteDepuisAdresse } from '../lib/public/adresse-non-resolue';

type Proprietes = Record<string, unknown>;
type Rendre = (composant: unknown, options: { props: Proprietes }) => { body: string };

/** Une source portée par une vue, et de quoi l'éprouver dans les deux sens. */
interface Source {
	/** Le nom contractuel de la propriété — camelCase du nom de la constante. */
	readonly cle: string;
	/** La constante du jeu de semence, celle sur laquelle la vue retombe. */
	readonly defaut: unknown;
	/** Une autre valeur, du même type, qui doit changer le rendu. */
	readonly autre: unknown;
	/** L'état dans lequel la source est lue, quand ce n'est pas celui de base. */
	readonly base?: Proprietes;
	/**
	 * Déclaré INERTE : la propriété est acceptée et transmise, et AUCUN nœud ne
	 * s'en dérive dans cette vue. Le cas exige alors l'égalité — le dire est plus
	 * honnête que de choisir un état qui l'éviterait.
	 */
	readonly inerte?: true;
	/** Une chaîne que la valeur fournie doit faire apparaître au balisage. */
	readonly marqueur?: string;
}

/* ── Les valeurs de contre-épreuve ─────────────────────────────────────────
   Toutes restent dans les types de `seeds/corpus.ts` : aucun type n'est
   déclaré ici, et les noms d'univers, de domaine et d'auteur sont ceux que le
   jeu de semence admet. */

const AUTRE_COMPTE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'ZQ',
	domaine: 'Applications',
	role: 'Administrateur'
};
const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9', synchro: 'à l’instant' };
const AUTRES_UNIVERS: readonly Univers[] = UNIVERS.filter((u) => u.nom === 'Production');
const AUTRES_DOMAINES: readonly Domaine[] = DOMAINES.filter((d) => d.nom === 'Applications');

/** Un compte que le jeu de semence ne porte pas, et qui n'a donc aucun accès. */
const COMPTE_SYNTHETIQUE: Compte = {
	...COMPTES[0]!,
	id: 'c-zq',
	nom: 'Zoé Quintard',
	identifiant: 'zquintard',
	courriel: 'zq@exemple.test',
	actif: true
};

/** Un historique posé sur une note qui n'en a pas au jeu de semence. */
const TROIS_VERSIONS: readonly Version[] = (
	Object.values(VERSIONS).find((v) => v !== undefined) ?? []
).slice(0, 3);

/**
 * CE QUE `/importer` ET `/mon-profil` SERVENT TOUJOURS — donc ce que les deux
 * vues EXIGENT désormais.
 *
 * Ces propriétés étaient optionnelles, de défaut la constante de
 * `seeds/corpus.ts` : une route qui en oubliait une servait le lot, les
 * domaines, l'identité et les contributions du jeu de démonstration sans que
 * rien ne proteste. Elles n'ont plus de défaut, et le socle du cas les passe
 * comme la route les sert.
 */
const SOCLE_V24: Proprietes = {
	domaines: DOMAINES,
	lotImport: LOT_IMPORT,
	formatsImport: FORMATS_IMPORT,
	domaineParDefaut: DOMAINES[0]!.nom
};

const SOCLE_V25: Proprietes = {
	domaines: DOMAINES,
	compte: MOI,
	contributions: CONTRIBUTIONS,
	activite: ACTIVITE,
	relations: RELATIONS
};

/** Les quatre sources de la coquille, communes aux vues qui la portent. */
function coquille(inertes: readonly string[] = []): readonly Source[] {
	const inerte = (cle: string) => (inertes.includes(cle) ? ({ inerte: true } as const) : {});
	return [
		{ cle: 'univers', defaut: UNIVERS, autre: AUTRES_UNIVERS, ...inerte('univers') },
		{ cle: 'domaines', defaut: DOMAINES, autre: AUTRES_DOMAINES, ...inerte('domaines') },
		{ cle: 'compte', defaut: MOI, autre: AUTRE_COMPTE, marqueur: 'ZQ', ...inerte('compte') },
		{
			cle: 'instance',
			defaut: INSTANCE,
			autre: AUTRE_INSTANCE,
			marqueur: '9.9.9',
			...inerte('instance')
		}
	];
}

/**
 * LES VUES DU LOT ET LEURS SOURCES.
 *
 * `base` au niveau de la vue est le réglage minimal — ce que le mode démo lui
 * passe déjà. `base` au niveau d'une source le remplace, et seulement pour ce
 * cas-là.
 *
 * V-25 et V-26 rendent la coquille en forme ABRÉGÉE, dont le rail est écrit au
 * balisage et ne se dérive pas du corpus : `univers` et `domaines` y sont
 * acceptées sans qu'aucun nœud n'en dépende. V-24, abrégée elle aussi, lit
 * pourtant `domaines` — son sélecteur de domaine de destination les énumère.
 *
 * POUR V-24 ET V-25, `defaut` N'EST PLUS LA CONSTANTE DU JEU : ce qui n'a pas
 * de source en base porte un ÉTAT VIDE — tableau vide, `null` —, et ce que la
 * route sert toujours est passé par le socle du cas, la propriété étant exigée.
 */
const VUES: Readonly<
	Record<string, { readonly base: Proprietes; readonly sources: readonly Source[] }>
> = {
	/* V-06 N'A PLUS QU'UNE SOURCE, ET C'EST LE CORRECTIF DU LOT G : ses quatre
	   étapes décrivaient une réinitialisation par courriel dont le produit n'a
	   aucun morceau. La vue rend un écran unique, sans vecteur et sans compte à
	   rappeler ; l'adresse du portail d'assistance est la seule donnée
	   d'instance qui la traverse encore. */
	'V-06': {
		base: {},
		sources: [
			{
				cle: 'portail',
				defaut: CONFIG.portailAssistance,
				autre: 'https://assistance.exemple.test/autre',
				marqueur: 'https://assistance.exemple.test/autre'
			}
		]
	},
	'V-24': {
		base: { ...SOCLE_V24, vecteur: { et: '2' } },
		sources: [
			/* `univers` N'A PLUS LE JEU POUR DÉFAUT — le rail abrégé ne s'en dérive
			   pas, et son état vide est un tableau vide, jamais les univers du jeu. */
			{ cle: 'univers', defaut: [], autre: AUTRES_UNIVERS, inerte: true },
			{ cle: 'domaines', defaut: DOMAINES, autre: AUTRES_DOMAINES },
			{ cle: 'compte', defaut: null, autre: AUTRE_COMPTE, marqueur: 'ZQ' },
			{
				cle: 'lotImport',
				defaut: LOT_IMPORT,
				autre: { ...LOT_IMPORT, fichiers: LOT_IMPORT.fichiers.slice(0, 4) },
				/* L'étape 3 est celle de l'aperçu : c'est là que le lot est compté. */
				base: { ...SOCLE_V24, vecteur: { et: '3' } }
			},
			{
				cle: 'formatsImport',
				defaut: FORMATS_IMPORT,
				autre: {},
				base: { ...SOCLE_V24, vecteur: { et: '3' } }
			}
		]
	},
	/* LE SOCLE DE V-25 PORTE `comptes`, ET C'EST LE CHEMIN DE LA PLANCHE : sans
	   profil lu en base, la vue cherche le titulaire dans la liste servie, et
	   sans titulaire aucun indicateur, aucune jauge, aucun flux n'est rendu — il
	   n'y aurait alors rien à mesurer. Que son DÉFAUT soit désormais la liste
	   VIDE, et non l'annuaire du jeu, est éprouvé par le cas nommé plus bas. */
	'V-25': {
		base: { ...SOCLE_V25, vecteur: null, comptes: COMPTES },
		sources: [
			{ cle: 'univers', defaut: [], autre: AUTRES_UNIVERS, inerte: true },
			{ cle: 'domaines', defaut: DOMAINES, autre: AUTRES_DOMAINES, inerte: true },
			{ cle: 'compte', defaut: MOI, autre: AUTRE_COMPTE, marqueur: 'ZQ' },
			{
				cle: 'comptes',
				defaut: COMPTES,
				autre: COMPTES.map((c) => ({ ...c, courriel: 'zq@exemple.test' })),
				marqueur: 'zq@exemple.test'
			},
			{
				cle: 'contributions',
				defaut: CONTRIBUTIONS,
				autre: {
					...CONTRIBUTIONS,
					'Karim Belhadj': { ...CONTRIBUTIONS['Karim Belhadj'], verifiees: 999 }
				}
			},
			/* `distinctions` N'A PLUS LE JEU POUR DÉFAUT : aucune table ne porte le
			   barème, et des seuils inventés mesureraient le titulaire contre rien. */
			{ cle: 'distinctions', defaut: [], autre: DISTINCTIONS.slice(0, 1) },
			{ cle: 'activite', defaut: ACTIVITE, autre: ACTIVITE.slice(0, 1) },
			{ cle: 'relations', defaut: RELATIONS, autre: [] }
		]
	},
	/* V-04 N'A PAS DE COQUILLE (`docs/releve-vues.md` §5.1) : l'adresse du portail
	   d'assistance est la seule donnée d'instance qui la traverse. L'adresse
	   demandée, elle, ne s'éprouve pas ici — son défaut est un littéral de
	   planche que la vue n'exporte pas, et le recopier ferait de ce cas une
	   épreuve de la copie. Elle a ses propres cas, plus bas, qui LISENT le défaut
	   sur le rendu de la vue au lieu de le redéclarer. */
	'V-04': {
		base: { vecteur: null },
		sources: [
			{
				cle: 'portail',
				defaut: CONFIG.portailAssistance,
				autre: 'https://assistance.exemple.test/autre',
				marqueur: 'https://assistance.exemple.test/autre'
			}
		]
	},
	'V-26': { base: { vecteur: null }, sources: coquille(['univers', 'domaines']) },
	'V-35': {
		base: { etat: 'journal-peuple' },
		sources: [
			{
				cle: 'journalImports',
				defaut: JOURNAL_IMPORTS,
				autre: JOURNAL_IMPORTS.slice(0, 1)
			},
			{
				cle: 'lotImport',
				defaut: LOT_IMPORT,
				autre: { ...LOT_IMPORT, fichiers: LOT_IMPORT.fichiers.filter((f) => f.s !== 'echec') },
				/* Le rapport de lot est le seul état qui liste les fichiers en échec. */
				base: { etat: 'rapport-de-lot' }
			}
		]
	},
	'V-36': { base: {}, sources: [{ cle: 'domaines', defaut: DOMAINES, autre: AUTRES_DOMAINES }] },
	'V-37': { base: { vecteur: null }, sources: coquille() },
	'V-38': { base: { etat: 'succes' }, sources: coquille() },
	'V-39': { base: { etat: 'vide' }, sources: coquille() },
	'V-40': {
		base: { etat: 'd-note' },
		sources: [
			...coquille(),
			{
				cle: 'comptes',
				defaut: COMPTES,
				autre: [...COMPTES, COMPTE_SYNTHETIQUE],
				/* Le dialogue des droits est le seul à énumérer les comptes. */
				base: { etat: 'd-droits' },
				marqueur: 'Zoé Quintard'
			},
			{ cle: 'relations', defaut: RELATIONS, autre: [] },
			{ cle: 'versions', defaut: VERSIONS, autre: { ...VERSIONS, 'n-pg-prod-01': TROIS_VERSIONS } },
			{
				cle: 'templates',
				defaut: TEMPLATES,
				autre: TEMPLATES.slice(0, 1),
				base: { etat: 'd-template' }
			},
			{
				cle: 'typesRelation',
				defaut: TYPES_RELATION,
				autre: {
					...TYPES_RELATION,
					heberge: { sortant: 'zq-sortant', entrant: 'zq-entrant' }
				},
				base: { etat: 'd-relation' },
				marqueur: 'zq-sortant'
			}
		]
	},
	'V-41': {
		base: {},
		sources: [
			...coquille(),
			{ cle: 'activite', defaut: ACTIVITE, autre: ACTIVITE.slice(0, 1) },
			{ cle: 'typesNote', defaut: TYPES_NOTE, autre: TYPES_NOTE.slice(0, 1) }
		]
	}
};

const NOMS = Object.keys(VUES);

let vite: ViteDevServer;
let rendre: Rendre;
let notes: readonly Note[];
const composants = new Map<string, unknown>();

beforeAll(async () => {
	vite = await createServer({
		// LE SURVEILLANT NE DOIT PAS DESCENDRE DANS .claude/worktrees/ NI DANS build/.
		// Il parcourt toute la racine ; sous .claude/worktrees/ vivent des copies
		// complètes du dépôt, et les veilleurs du système s'épuisent : la série sort
		// en ENOSPC, ses tests verts compris. Le surveillant attend un prédicat, pas
		// un motif : les jokers y sont inertes, et `watch: null` ne l'éteint pas —
		// il ne fait que lui retirer ce filtre.
		server: {
			middlewareMode: true,
			watch: {
				ignored: (chemin: string) => chemin.includes('/.claude') || chemin.includes('/build/')
			}
		},
		appType: 'custom',
		logLevel: 'error'
	});
	const serveur = (await vite.ssrLoadModule('svelte/server')) as unknown as { render: Rendre };
	rendre = serveur.render;
	notes = corpusDeVariante('complete');
	for (const nom of NOMS) {
		const module = (await vite.ssrLoadModule(`/src/vues/${nom}.svelte`)) as unknown as {
			default: unknown;
		};
		composants.set(nom, module.default);
	}
}, 300_000);

afterAll(async () => {
	await vite?.close();
});

/** Le balisage rendu par la vue, dans l'état donné, plus les propriétés données. */
function corps(vue: string, base: Proprietes, sup: Proprietes = {}): string {
	return rendre(composants.get(vue), { props: { ...base, notes, ...sup } }).body;
}

describe.each(NOMS)('%s — les sources en propriétés optionnelles', (vue) => {
	const { base, sources } = VUES[vue]!;

	it('rend sans qu’aucune source ne lui soit passée', () => {
		expect(corps(vue, base).length).toBeGreaterThan(0);
	});

	for (const source of sources) {
		const etat = source.base ?? base;

		it(`absente, \`${source.cle}\` retombe sur le défaut que la vue déclare`, () => {
			expect(corps(vue, etat, { [source.cle]: source.defaut })).toBe(corps(vue, etat));
		});

		if (source.inerte) {
			it(`fournie, \`${source.cle}\` ne change rien — le rail abrégé ne s’en dérive pas`, () => {
				expect(corps(vue, etat, { [source.cle]: source.autre })).toBe(corps(vue, etat));
			});
		} else {
			it(`fournie, \`${source.cle}\` l’emporte sur le défaut`, () => {
				expect(corps(vue, etat, { [source.cle]: source.autre })).not.toBe(corps(vue, etat));
			});

			if (source.marqueur) {
				it(`la valeur fournie pour \`${source.cle}\` atteint le balisage`, () => {
					expect(corps(vue, etat)).not.toContain(source.marqueur);
					expect(corps(vue, etat, { [source.cle]: source.autre })).toContain(source.marqueur);
				});
			}
		}
	}
});

/* ══════════════════════════════════════════════════════════════════════════
   V-25 — LES DÉFAUTS QUI SERVAIENT LE JEU DE DÉMONSTRATION SONT DES ÉTATS VIDES

   `comptes` valait `COMPTES` et `distinctions` valait `DISTINCTIONS` : aucun
   chargeur ne sert l'un ni l'autre, si bien que l'écran affichait l'annuaire et
   le barème du jeu comme s'ils étaient ceux de l'instance. Les deux valent
   désormais la liste vide, et l'écran ne montre rien plutôt que d'inventer.
   ══════════════════════════════════════════════════════════════════════════ */
describe('V-25 — les défauts ne servent plus le jeu de démonstration', () => {
	const socle = { ...SOCLE_V25, vecteur: null };

	it('sans comptes servis, aucune adresse de l’annuaire du jeu n’est rendue', () => {
		const rendu = corps('V-25', socle);
		expect(corps('V-25', { ...socle, comptes: COMPTES })).toContain(COMPTES[0]!.courriel);
		expect(rendu).not.toContain(COMPTES[0]!.courriel);
	});

	it('sans distinctions servies, aucun seuil du barème du jeu n’est rendu', () => {
		const avec = corps('V-25', { ...socle, comptes: COMPTES, distinctions: DISTINCTIONS });
		const sans = corps('V-25', { ...socle, comptes: COMPTES });
		expect(avec).toContain(DISTINCTIONS[0]!.nom);
		expect(sans).not.toContain(DISTINCTIONS[0]!.nom);
	});
});

/* ══════════════════════════════════════════════════════════════════════════
   V-25 — « VOIR LES NOTES DE … » NE SE DÉRIVE PLUS DU NOM DU DOMAINE

   CE QUE CE CONTRÔLE PROUVE, ET CE QU'IL NE PROUVE PAS. L'adresse elle-même
   n'est composée qu'AU CLIC : le balisage rendu ne la porte pas, seul l'état
   du bouton s'y lit. Le contrôle établit donc la seule chose observable au
   rendu, et c'est la charnière du défaut — le bouton ne dépend plus de la
   présence du nom du domaine dans la liste. La preuve que l'adresse ouvre bien
   la liste des notes se fait dans un navigateur, sur un domaine RENOMMÉ : c'est
   là que la dérivation par le nom rendait 404, et aucun rendu ne le montrerait.
   ══════════════════════════════════════════════════════════════════════════ */
describe('V-25 — l’issue « Voir les notes de … »', () => {
	/* Un titulaire dont le domaine n'est dans AUCUNE entrée de `domaines` : c'est
	   l'état d'un domaine renommé, dont la liste porte le nouveau nom et le
	   profil l'ancien — ou l'inverse. */
	const TITULAIRE = {
		nom: 'Zoé Quintard',
		identifiant: 'zquintard',
		courriel: 'zq@exemple.test',
		role: 'Contributeur',
		domaine: 'Un domaine que la liste ne porte pas',
		arrivee: '3 février 2026',
		derniereConnexion: 'à l’instant'
	};
	const base = { ...SOCLE_V25, vecteur: null, profilDuCompte: TITULAIRE };

	it('sans rattachement lu, le bouton n’est pas ÉMIS', () => {
		/* `P-09` — « ni grisée, ni masquée ». Le bouton était rendu INERTE, et
		   `ARB-039` dit quand l'inertie devient un refus : quand l'utilisateur ne
		   peut pas la lever lui-même. Ici elle tient à un droit et à un module ;
		   le nœud doit donc être absent, et non désactivé. */
		const rendu = corps('V-25', base, { rangementDuProfil: null });
		expect(rendu).not.toContain('Voir les notes de');
		/* Le bloc d'encouragement qui le porte, lui, reste rendu. */
		expect(rendu).toContain("Rien à afficher pour l'instant");
	});

	it('le rattachement lu rend le bouton actif, sans que le nom soit dans la liste', () => {
		const rendu = corps('V-25', base, {
			rangementDuProfil: { univers: 'production', domaine: 'infra-prod' }
		});
		expect(rendu).toContain('Voir les notes de Un domaine que la liste ne porte pas');
		expect(rendu).not.toContain('disabled="">Voir les notes de');
	});
});

/* ══════════════════════════════════════════════════════════════════════════
   LE COURRIEL N'EST PLUS PROMIS — V-06 ET V-25

   CE QUE CES CAS ÉPROUVENT : le BALISAGE RÉELLEMENT RENDU par les deux vues,
   compilé et exécuté par le même graphe de modules que le produit. Ils ne
   relisent pas le fichier source, et ils ne fabriquent pas la chaîne qu'ils
   cherchent : c'est la vue qui la produit, ou ne la produit pas.

   Le produit n'a AUCUN expéditeur de courriel, et aucune table ne porte de
   jeton de réinitialisation. Toute phrase qui annonce un message à venir est
   donc une promesse que rien ne peut tenir. Le jour où un expéditeur arrive,
   ces cas rougissent — et c'est exactement ce qu'on leur demande.
   ══════════════════════════════════════════════════════════════════════════ */
describe('V-06 — l’écran ne promet plus un courriel que rien n’enverrait', () => {
	const rendu = (): string => corps('V-06', {});

	it('ne promet aucun envoi ni aucune adresse de destination', () => {
		expect(rendu()).not.toContain('vous recevrez un lien');
		expect(rendu()).not.toContain('adresse professionnelle');
		expect(rendu()).not.toContain('Vérifiez votre messagerie');
	});

	it('n’affirme plus qu’un lien a existé et vient d’expirer', () => {
		expect(rendu()).not.toContain("Ce lien n'est plus valable");
		expect(rendu()).not.toContain('expire au bout d’une heure');
	});

	it('ne demande plus d’identifiant : aucun champ, donc rien à divulguer', () => {
		expect(rendu()).not.toContain('id="identifiant"');
		expect(rendu()).not.toContain('<form');
	});

	it('dit l’indisponibilité et nomme le chemin qui existe', () => {
		expect(rendu()).toContain("Cette instance n'envoie aucun courriel");
		expect(rendu()).toContain('par un administrateur');
		expect(rendu()).toContain('console des comptes');
	});

	/* LA SECONDE MOITIÉ DE LA PHRASE ÉTAIT UNE PROMESSE DE PLUS. L'écran
	   annonçait « vous le remplacerez ensuite depuis votre profil » ; un compte
	   dont `mot_de_passe_verrouille` est posé se voit refuser ce remplacement,
	   et le refus est prouvé à sa source, pas ici : `profil.test.ts` exerce
	   `changerLeMotDePasse` sur un profil verrouillé et relève l'issue
	   `verrouille`, décidée avant la moindre requête. V-06 est ANONYME — aucune
	   propriété ne lui dit à quel compte il parle —, il ne peut donc pas
	   distinguer les deux cas, et n'annonce plus que celui qui vaut pour tous. */
	it('n’annonce plus un changement depuis le profil, que le verrou refuse', () => {
		expect(rendu()).not.toContain('votre profil');
		expect(rendu()).not.toContain('remplacerez');
		expect(rendu()).not.toContain('provisoire');
	});
});

/* ══════════════════════════════════════════════════════════════════════════
   V-06 — LE PIED D'ASSISTANCE N'EST ÉMIS QUE S'IL MÈNE QUELQUE PART

   LA VALEUR ÉPROUVÉE N'EST PAS FABRIQUÉE ICI : c'est
   `CONFIGURATION_PAR_DEFAUT.portailAssistance`, le défaut même sur lequel
   `lireConfiguration()` retombe clé par clé quand `parametres` ne porte rien —
   l'état d'une instance neuve, où seule la console peut renseigner l'adresse.
   Écrire une chaîne vide à la main aurait éprouvé une hypothèse ; importer la
   constante éprouve ce que le chargeur passe réellement à la vue.
   ══════════════════════════════════════════════════════════════════════════ */
describe('V-06 — le ticket d’assistance n’est offert qu’avec une destination', () => {
	it('n’émet ni la question ni le bouton quand l’instance n’a pas d’adresse', () => {
		const rendu = corps('V-06', {}, { portail: CONFIGURATION_PAR_DEFAUT.portailAssistance });
		expect(rendu).not.toContain('id="assistance"');
		expect(rendu).not.toContain('Ouvrir un ticket d’assistance');
		expect(rendu).not.toContain("Ouvrir un ticket d'assistance");
		expect(rendu).not.toContain('retrouver votre accès');
	});

	it('les émet dès qu’une adresse est renseignée, et c’est celle-là', () => {
		const adresse = 'https://assistance.exemple.test/nouveau';
		const rendu = corps('V-06', {}, { portail: adresse });
		expect(rendu).toContain('id="assistance"');
		expect(rendu).toContain(adresse);
	});

	it('une adresse blanche ne mène pas plus loin qu’une adresse absente', () => {
		expect(corps('V-06', {}, { portail: '   ' })).not.toContain('id="assistance"');
	});
});

describe('V-25 — l’interrupteur de notification par courriel n’est plus émis', () => {
	const rendu = (): string => corps('V-25', { ...SOCLE_V25, vecteur: null });

	it('ne pose plus le contrôle que le gel laissait coché sans gestionnaire', () => {
		expect(rendu()).not.toContain('p-courriels');
		expect(rendu()).not.toContain('Recevoir les demandes de révision par courriel');
	});

	it('garde l’interrupteur de session, lui, qui a bien sa contrepartie', () => {
		expect(rendu()).toContain('p-session');
	});
});

/* ══════════════════════════════════════════════════════════════════════════
   V-04 ET V-26 — LA PAGE D'ADRESSE NON RÉSOLUE DIT L'ADRESSE DEMANDÉE

   LE DÉFAUT N'EST PAS RECOPIÉ, IL EST LU SUR LE RENDU DE LA VUE. Les adresses
   de planche sont des littéraux internes aux deux vues, qui ne les exportent
   pas : les redéclarer ici aurait fait de ces cas l'épreuve d'une copie, verte
   le jour où la vue et la copie changeraient ensemble et fausses toutes les
   deux. Chaque cas rend donc d'abord la vue SANS adresse, relève ce que la
   ligne « Adresse demandée » porte alors, et exige que ce relevé ait DISPARU du
   rendu servi.

   LE CHEMIN VIENT DE SON PRODUCTEUR. `+error.svelte` passe `page.url.pathname`
   — le composant `pathname` d'une URL. Les cas le produisent de la même façon,
   par `new URL(...)`, et non par une chaîne écrite à la main qui aurait pu ne
   pas être un chemin. Les termes de recherche, eux, viennent de la fonction que
   la vue emploie : `requeteDepuisAdresse()`, importée de sa source.

   CE QUE CES CAS NE PROUVENT PAS : que la route passe bien la propriété. Cela
   se voit dans un navigateur, sur une adresse cassée d'une instance réelle, et
   c'est là que la preuve du lot a été faite.
   ══════════════════════════════════════════════════════════════════════════ */

/** Le contenu textuel du nœud d'identifiant donné, tel que le rendu le porte. */
function contenuDe(rendu: string, identifiant: string): string {
	const motif = new RegExp(`<span id="${identifiant}"[^>]*>([^<]*)</span>`, 'u');
	return motif.exec(rendu)?.[1] ?? '';
}

/* Une adresse d'instance qui n'existe nulle part, produite comme le produit la
   produit : le chemin d'une URL. L'hôte est indifférent — `pathname` ne le
   porte pas —, et le domaine de premier niveau réservé aux essais le dit. */
const CHEMIN_DEMANDE = new URL('https://codicillus.invalid/notes/inexistante-xyz').pathname;
const CHEMIN_PUBLIC_DEMANDE = new URL('https://codicillus.invalid/guides/inexistant').pathname;

describe('V-26 — l’adresse demandée en session', () => {
	/* La position que le produit sert, nommée par la fonction qui la décide —
	   jamais par un littéral. La pierre tombale, position PAR DÉFAUT de la vue,
	   ne passe pas par `adresseNonResolue()` et ne lit donc pas cette source. */
	const base = { vecteur: { cas: casDeV26(), droits: 'ecriture' } };

	it('affiche le chemin demandé, et l’adresse de la planche a disparu', () => {
		const planche = contenuDe(corps('V-26', base), 'adresse');
		expect(planche).not.toBe('');
		const rendu = corps('V-26', base, { adresse: CHEMIN_DEMANDE });
		expect(contenuDe(rendu, 'adresse')).toBe(CHEMIN_DEMANDE);
		expect(rendu).not.toContain(planche);
	});

	it('amorce la recherche sur les termes du chemin demandé', () => {
		const rendu = corps('V-26', base, { adresse: CHEMIN_DEMANDE });
		expect(rendu).toContain(`value="${requeteDepuisAdresse(CHEMIN_DEMANDE)}"`);
	});

	it('« Créer la note » ne propose plus le titre d’une note de démonstration', () => {
		const requeteDeLaPlanche = requeteDepuisAdresse(contenuDe(corps('V-26', base), 'adresse'));
		const rendu = corps('V-26', base, { adresse: CHEMIN_DEMANDE });
		expect(rendu).toContain(`Créer la note « ${requeteDepuisAdresse(CHEMIN_DEMANDE)} »`);
		expect(rendu).not.toContain(`Créer la note « ${requeteDeLaPlanche} »`);
	});

	it('la pierre tombale, elle, ne lit pas l’adresse demandée — elle n’en a pas', () => {
		const tombe = { vecteur: { cas: 'supprimee' } };
		expect(corps('V-26', tombe, { adresse: CHEMIN_DEMANDE })).toBe(corps('V-26', tombe));
	});
});

describe('V-04 — l’adresse demandée en anonyme', () => {
	const base = { vecteur: { cas: casDeV04(CHEMIN_PUBLIC_DEMANDE) } };

	it('affiche le chemin demandé, et l’adresse de la planche a disparu', () => {
		const planche = contenuDe(corps('V-04', base), 'adresse');
		expect(planche).not.toBe('');
		const rendu = corps('V-04', base, { adresse: CHEMIN_PUBLIC_DEMANDE });
		expect(contenuDe(rendu, 'adresse')).toBe(CHEMIN_PUBLIC_DEMANDE);
		expect(rendu).not.toContain(planche);
	});

	it('amorce la recherche sur les termes du chemin demandé', () => {
		const rendu = corps('V-04', base, { adresse: CHEMIN_PUBLIC_DEMANDE });
		expect(rendu).toContain(`value="${requeteDepuisAdresse(CHEMIN_PUBLIC_DEMANDE)}"`);
	});

	/* `/guides` nu est le seul cas où la table de la planche coïncidait avec le
	   chemin demandé — par accident. Il coïncide encore, et pour une raison :
	   c'est le chemin lui-même qui descend. */
	it('l’adresse racine du corpus public reste la sienne', () => {
		const nu = new URL('https://codicillus.invalid/guides').pathname;
		const rendu = corps('V-04', { vecteur: { cas: casDeV04(nu) } }, { adresse: nu });
		expect(contenuDe(rendu, 'adresse')).toBe(nu);
	});
});

/* ══════════════════════════════════════════════════════════════════════════
   V-04 — LE TICKET D'ASSISTANCE N'EST OFFERT QU'AVEC UNE DESTINATION

   MÊME RÈGLE QUE V-06, ET MÊME VALEUR ÉPROUVÉE : `CONFIGURATION_PAR_DEFAUT`,
   le défaut sur lequel la lecture de `parametres` retombe quand la clé est
   absente — l'état d'une instance neuve. Le bouton était la SEULE issue externe
   de l'écran, et il portait le domaine d'exemple du jeu de démonstration.
   ══════════════════════════════════════════════════════════════════════════ */
describe('V-04 — l’issue d’assistance', () => {
	const base = { vecteur: null };

	it('n’émet pas le bouton quand l’instance n’a pas d’adresse', () => {
		const rendu = corps('V-04', base, { portail: CONFIGURATION_PAR_DEFAUT.portailAssistance });
		expect(rendu).not.toContain('id="ticket"');
		expect(rendu).not.toContain("Ouvrir un ticket d'assistance");
		/* L'autre issue, elle, reste rendue : l'écran n'est pas une impasse. */
		expect(rendu).toContain('id="accueil"');
	});

	it('l’émet dès qu’une adresse est renseignée, et c’est celle-là', () => {
		const adresse = 'https://assistance.exemple.test/nouveau';
		const rendu = corps('V-04', base, { portail: adresse });
		expect(rendu).toContain('id="ticket"');
		expect(rendu).toContain(adresse);
	});

	it('une adresse blanche ne mène pas plus loin qu’une adresse absente', () => {
		expect(corps('V-04', base, { portail: '   ' })).not.toContain('id="ticket"');
	});
});
