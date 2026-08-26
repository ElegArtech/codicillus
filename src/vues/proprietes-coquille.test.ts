/**
 * T-045 — LE CONTRAT DE PROPRIÉTÉS DES VUES CÂBLÉES.
 *
 * Ce que ces cas prouvent, et rien d'autre : chacune des vues du lot accepte en
 * PROPRIÉTÉ les sources qu'elle importait en constante, et pour chacune
 *
 *   · ABSENTE, LE DÉFAUT S'APPLIQUE — la rendre en passant explicitement le
 *     défaut que la vue déclare donne le MÊME balisage, à l'octet, que de
 *     l'omettre. C'est la propriété qui garantit que le banc ne bouge pas : le
 *     mode démo ne passe que `vecteur`/`etat` et `notes`.
 *   · FOURNIE, ELLE L'EMPORTE — la rendre avec une autre valeur change le
 *     balisage. Sans ce second cas, la propriété serait acceptée sans être lue,
 *     et le contrôle serait celui d'une règle que rien n'exerce (P-5).
 *
 * LE PREMIER CAS N'EST PAS ÉCRIT POUR UNE SOURCE QUE L'ÉTAT DU CAS PORTE DÉJÀ
 * (`socle: true`) — propriété EXIGÉE par la vue, ou servie par le socle pour
 * ouvrir l'état à éprouver. La repasser par-dessus comparerait deux rendus
 * strictement identiques : un cas vert qui ne prouve rien, et qui compterait
 * pour une preuve. Ce que la vue fait sans elle est alors mesuré ailleurs — par
 * un cas nommé, quand un défaut vide existe, ou par le compilateur, quand la
 * propriété est exigée.
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
	CONTRIBUTIONS,
	DISTINCTIONS,
	DOMAINES,
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
	noteParIdentifiant,
	type Compte,
	type Domaine,
	type EtatDInstance,
	type Note,
	type Univers,
	type UtilisateurCourant,
	type Version
} from '../../seeds/corpus';
import { CONFIGURATION_PAR_DEFAUT } from '../lib/base/schema';
/* LE RÉFÉRENTIEL DES LIBELLÉS DE FORMAT VIENT DU PRODUIT, PAS DU JEU.
   `seeds/corpus.ts` en porte une copie mot pour mot (`FORMATS_IMPORT`) ; la
   servir ici aurait éprouvé la copie là où `/importer` sert l'original, et
   les deux auraient pu diverger sans que rien ne rougisse. Le lien entre les
   deux tables est éprouvé par `import-promesses.test.ts`. */
import { LIBELLE_PAR_FORMAT } from '../lib/donnees/import';
/* LES DEUX POSITIONS DE PLANCHE SERVIES ET LA DÉRIVATION DES TERMES VIENNENT DE
   LEURS SOURCES, celles-là mêmes que `+error.svelte` et les vues emploient. Les
   recopier ici aurait éprouvé la copie, et la copie aurait pu diverger sans que
   rien ne rougisse. */
import { casDeV04, casDeV26 } from '../lib/donnees/public';
import { requeteDepuisAdresse } from '../lib/public/adresse-non-resolue';

type Proprietes = Record<string, unknown>;
type Rendre = (composant: unknown, options: { props: Proprietes }) => { body: string };

/** Une source portée par une vue, et de quoi l'éprouver dans les deux sens. */
interface SourceCommune {
	/** Le nom contractuel de la propriété — camelCase du nom de la constante. */
	readonly cle: string;
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

/** Une source que la vue déclare avec un défaut — il se mesure. */
interface SourceADefaut extends SourceCommune {
	/**
	 * CE SUR QUOI LA VUE RETOMBE quand la source n'est pas passée — la constante
	 * du jeu de semence là où elle survit, l'ÉTAT VIDE partout où le motif a été
	 * retiré. Une source dont TOUTES les routes passent la donnée n'en a plus de
	 * mesurable : elle est exigée, et se déclare alors `socle: true`.
	 */
	readonly defaut: unknown;
	readonly socle?: never;
}

/**
 * UNE SOURCE QUE L'ÉTAT DU CAS PORTE DÉJÀ — AUCUN DÉFAUT NE S'Y MESURE.
 *
 * La propriété est EXIGÉE par la vue, ou bien le socle la sert pour ouvrir
 * l'état qu'on veut éprouver. Dans les deux cas, la repasser par-dessus le
 * socle rendrait DEUX FOIS le même balisage : le cas serait vert sans rien
 * prouver, et il compterait pour une preuve. Il n'est donc pas écrit.
 */
interface SourceDuSocle extends SourceCommune {
	readonly socle: true;
	readonly defaut?: never;
}

type Source = SourceADefaut | SourceDuSocle;

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
/** Une adresse de portail qui n'est celle d'aucun jeu — les vues l'EXIGENT. */
const PORTAIL_DE_CONTROLE = 'https://assistance.exemple.test/nouveau-ticket';
/** L'identité vide que V-26 applique quand aucun compte ne lui est servi. */
const SANS_IDENTITE = { prenom: '', nom: '', initiales: '', domaine: '', role: '' };
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

/**
 * LA NOTE DONT LES BOÎTES DE V-40 PARLENT — elle est REQUISE depuis que la vue
 * a cessé de la retrouver elle-même dans le corpus servi. Elle est citée par
 * d'autres notes : sans rétrolien, le décompte de suppression serait nul et le
 * cas de `relations` ne mesurerait rien.
 */
const NOTE_DE_BOITE: Note = (() => {
	const note = noteParIdentifiant('n-pg-prod-01');
	if (!note) throw new Error('seeds/corpus.ts : « n-pg-prod-01 » a disparu');
	return note;
})();

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
	formatsImport: LIBELLE_PAR_FORMAT,
	domaineParDefaut: DOMAINES[0]!.nom
};

const SOCLE_V25: Proprietes = {
	domaines: DOMAINES,
	compte: MOI,
	contributions: CONTRIBUTIONS,
	activite: ACTIVITE,
	relations: RELATIONS
};

/**
 * LE SOCLE DE V-40 — ce que ses dix boîtes exigent avant toute source.
 * `catalogue`, `note` et `typesRelation` sont REQUISES : la vue retrouvait
 * elle-même sa note dans le corpus servi, et les trois autres tombaient d'un
 * défaut tiré du jeu de démonstration.
 */
const SOCLE_V40 = {
	etat: 'd-note',
	catalogue: true,
	note: NOTE_DE_BOITE,
	typesRelation: TYPES_RELATION
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
	/* `portail` N'EST PLUS UNE SOURCE OPTIONNELLE : elle est EXIGÉE. Son défaut
	   était l'adresse du jeu de démonstration, et une route qui l'aurait oubliée
	   aurait servi `assistance.exemple.fr` comme un fait. Elle passe donc au
	   réglage de base, et les deux sens — l'adresse renseignée l'emporte, l'adresse
	   vide n'émet rien — sont éprouvés par les cas dédiés, plus bas. */
	'V-06': { base: { portail: PORTAIL_DE_CONTROLE }, sources: [] },
	'V-24': {
		base: { ...SOCLE_V24, vecteur: { et: '2' } },
		sources: [
			/* `univers` N'A PLUS LE JEU POUR DÉFAUT — le rail abrégé ne s'en dérive
			   pas, et son état vide est un tableau vide, jamais les univers du jeu. */
			{ cle: 'univers', defaut: [], autre: AUTRES_UNIVERS, inerte: true },
			{ cle: 'domaines', socle: true, autre: AUTRES_DOMAINES },
			{ cle: 'compte', defaut: null, autre: AUTRE_COMPTE, marqueur: 'ZQ' },
			{
				cle: 'lotImport',
				socle: true,
				autre: { ...LOT_IMPORT, fichiers: LOT_IMPORT.fichiers.slice(0, 4) },
				/* L'étape 3 est celle de l'aperçu : c'est là que le lot est compté. */
				base: { ...SOCLE_V24, vecteur: { et: '3' } }
			},
			{
				cle: 'formatsImport',
				socle: true,
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
			{ cle: 'domaines', socle: true, autre: AUTRES_DOMAINES, inerte: true },
			{ cle: 'compte', socle: true, autre: AUTRE_COMPTE, marqueur: 'ZQ' },
			/* `comptes` EST PORTÉE PAR LE SOCLE, et son défaut vide se mesure plus
			   bas, hors de cet état : ici, la liste ouvre le chemin de la planche. */
			{
				cle: 'comptes',
				socle: true,
				autre: COMPTES.map((c) => ({ ...c, courriel: 'zq@exemple.test' })),
				marqueur: 'zq@exemple.test'
			},
			{
				cle: 'contributions',
				socle: true,
				autre: {
					...CONTRIBUTIONS,
					'Karim Belhadj': { ...CONTRIBUTIONS['Karim Belhadj'], verifiees: 999 }
				}
			},
			/* `distinctions` N'A PLUS LE JEU POUR DÉFAUT : aucune table ne porte le
			   barème, et des seuils inventés mesureraient le titulaire contre rien. */
			{ cle: 'distinctions', defaut: [], autre: DISTINCTIONS.slice(0, 1) },
			{ cle: 'activite', socle: true, autre: ACTIVITE.slice(0, 1) },
			{ cle: 'relations', socle: true, autre: [] }
		]
	},
	/* V-04 N'A PAS DE COQUILLE (`docs/releve-vues.md` §5.1) : l'adresse du portail
	   d'assistance est la seule donnée d'instance qui la traverse. L'adresse
	   demandée, elle, ne s'éprouve pas ici — son défaut est un littéral de
	   planche que la vue n'exporte pas, et le recopier ferait de ce cas une
	   épreuve de la copie. Elle a ses propres cas, plus bas, qui LISENT le défaut
	   sur le rendu de la vue au lieu de le redéclarer. */
	/* MÊME MOTIF QU'EN V-06 pour `portail`. `pistes` est exigée pour la même
	   raison : la vue en portait cinq écrites dans sa maquette, et une page
	   d'erreur n'a pas de chargeur d'où les dériver. `+error.svelte` passe la
	   liste vide, et le bloc n'est alors pas rendu. */
	'V-04': {
		base: { vecteur: null, portail: PORTAIL_DE_CONTROLE, pistes: [] },
		sources: []
	},
	/* V-26 — LES SOURCES DE COQUILLE Y RETOMBENT SUR L'ÉTAT VIDE, plus sur le jeu.
	   `+error.svelte` n'en passe AUCUNE : l'identité et le rangement réels
	   descendent par le contexte de coquille, que `Coquille.svelte` lit avant de
	   regarder ses propriétés. Le défaut décide donc de ce qu'affiche un rendu
	   SANS contexte — rendu de secours, ou rendu direct de la vue —, et ce défaut
	   est vide. `instance` a disparu : la version du pied de rail vient du
	   contexte elle aussi. */
	'V-26': {
		base: { vecteur: null, pistes: [] },
		sources: [
			{ cle: 'univers', defaut: [], autre: AUTRES_UNIVERS, inerte: true },
			{ cle: 'domaines', defaut: [], autre: AUTRES_DOMAINES, inerte: true },
			{ cle: 'compte', defaut: SANS_IDENTITE, autre: AUTRE_COMPTE, marqueur: 'ZQ' }
		]
	},
	/* V-35 — `journalImports` EST DEVENUE EXIGÉE : elle retombait sur
	   `JOURNAL_IMPORTS` du jeu de démonstration, quatre lots datés servis sur
	   l'écran de traçabilité même. Il n'y a plus de défaut à éprouver, et une
	   route qui l'oublierait ne compilerait plus ; elle est donc au réglage de
	   base. `lotImport` reste une source, et son DÉFAUT est l'état vide : sans
	   lot déposé, aucun fichier en échec n'est nommé. */
	'V-35': {
		base: { etat: 'journal-peuple', journalImports: JOURNAL_IMPORTS },
		sources: [
			{
				cle: 'lotImport',
				defaut: null,
				autre: LOT_IMPORT,
				/* Le rapport de lot est le seul état qui liste les fichiers en échec. */
				base: { etat: 'rapport-de-lot', journalImports: JOURNAL_IMPORTS }
			}
		]
	},
	/* V-36 — `domaines` ET `nomsDArchive` SONT DEVENUES EXIGÉES. Les domaines
	   retombaient sur `DOMAINES` du jeu, et le nom d'archive se recomposait avec
	   la date à laquelle le jeu est figé : l'écran offrait un périmètre que
	   l'instance ne porte pas, et annonçait un fichier daté de 2026. Les deux
	   sont au réglage de base ; ce qu'elles font du rendu est éprouvé par
	   `consoles-proprietes.test.ts`. */
	'V-36': { base: { domaines: DOMAINES, nomsDArchive: {} }, sources: [] },
	'V-37': { base: { vecteur: null }, sources: coquille() },
	'V-38': { base: { etat: 'succes' }, sources: coquille() },
	'V-39': { base: { etat: 'vide' }, sources: coquille() },
	/*
	   V-40 N'A PLUS DE DÉFAUT TIRÉ DU JEU DE DÉMONSTRATION, et c'est pourquoi
	   elle n'emprunte plus `coquille()`.

	   Ses dix boîtes annonçaient les comptes, les relations, les gabarits et
	   l'historique des MAQUETTES sur toute instance : une confirmation de
	   suppression comptait les versions d'une note du jeu, et le dialogue des
	   droits nommait quatre personnes qui n'existent nulle part. Chaque défaut
	   est désormais l'ENSEMBLE VIDE, et la note dont les boîtes parlent est
	   REQUISE — le « défaut » qu'éprouve chaque cas est donc le vide, et la
	   valeur servie est celle du jeu.

	   `domaines` NE SE MESURE QUE SOUS UN UNIVERS SERVI : le rail est fait de
	   sections d'univers, et sans univers il n'a aucune section où ranger un
	   domaine. Son cas sert donc les univers du jeu, et rien de plus.
	*/
	'V-40': {
		base: SOCLE_V40,
		sources: [
			{ cle: 'univers', defaut: [], autre: AUTRES_UNIVERS },
			{
				cle: 'domaines',
				defaut: [],
				autre: AUTRES_DOMAINES,
				base: { ...SOCLE_V40, univers: UNIVERS }
			},
			{ cle: 'compte', defaut: null, autre: AUTRE_COMPTE, marqueur: 'ZQ' },
			{
				cle: 'comptes',
				defaut: [],
				autre: [COMPTE_SYNTHETIQUE],
				/* Le dialogue des droits est le seul à énumérer les comptes. */
				base: { ...SOCLE_V40, etat: 'd-droits' },
				marqueur: 'Zoé Quintard'
			},
			{ cle: 'relations', defaut: [], autre: RELATIONS },
			{ cle: 'versions', defaut: {}, autre: { [NOTE_DE_BOITE.id]: TROIS_VERSIONS } },
			{
				cle: 'templates',
				defaut: [],
				autre: TEMPLATES.slice(0, 1),
				base: { ...SOCLE_V40, etat: 'd-template' }
			},
			{
				cle: 'typesRelation',
				defaut: TYPES_RELATION,
				autre: {
					...TYPES_RELATION,
					heberge: { sortant: 'zq-sortant', entrant: 'zq-entrant' }
				},
				base: { ...SOCLE_V40, etat: 'd-relation' },
				marqueur: 'zq-sortant'
			}
		]
	},
	/*
	   V-41 N'EMPRUNTE PLUS `coquille()`, ET C'EST LE CORRECTIF DU LOT C.

	   Ses sept sources étaient facultatives, de défaut la constante du jeu de
	   démonstration — et TROIS n'étaient passées par personne : la chronologie
	   nommait « Karim Belhadj » et « Sophie Nguyen », le pied de rail annonçait
	   le numéro de version du jeu, le sélecteur d'exemple listait ses types de
	   note. Le coût principal n'était pas à l'écran : l'import était fait EN
	   VALEUR, et les trente-deux notes du corpus partaient dans le chunk de
	   `/bibliotheque` — 57 Ko servis comme fichier statique, atteignables même
	   par qui reçoit 404 sur la page.

	   LES SEPT SONT EXIGÉES : il n'y a plus de défaut à mesurer, et le socle du
	   cas les passe comme le chargeur les sert. Ce que chacune fait du rendu
	   reste éprouvé — `socle: true` garde le cas « fournie, elle l'emporte ».
	*/
	'V-41': {
		base: {
			univers: UNIVERS,
			domaines: DOMAINES,
			compte: MOI,
			instance: INSTANCE,
			activite: ACTIVITE,
			typesNote: TYPES_NOTE
		},
		sources: [
			{ cle: 'univers', socle: true, autre: AUTRES_UNIVERS },
			{ cle: 'domaines', socle: true, autre: AUTRES_DOMAINES },
			{ cle: 'compte', socle: true, autre: AUTRE_COMPTE, marqueur: 'ZQ' },
			{ cle: 'instance', socle: true, autre: AUTRE_INSTANCE, marqueur: '9.9.9' },
			{ cle: 'activite', socle: true, autre: ACTIVITE.slice(0, 1) },
			{ cle: 'typesNote', socle: true, autre: TYPES_NOTE.slice(0, 1) }
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

describe.each(NOMS)('%s — les sources passées en propriétés', (vue) => {
	const { base, sources } = VUES[vue]!;

	it('rend sans qu’aucune source ne lui soit passée', () => {
		expect(corps(vue, base).length).toBeGreaterThan(0);
	});

	for (const source of sources) {
		const etat = source.base ?? base;

		if (!source.socle) {
			it(`absente, \`${source.cle}\` retombe sur le défaut que la vue déclare`, () => {
				expect(corps(vue, etat, { [source.cle]: source.defaut })).toBe(corps(vue, etat));
			});
		}

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
	const rendu = (): string => corps('V-06', { portail: PORTAIL_DE_CONTROLE });

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
	const base = { vecteur: { cas: casDeV26(), droits: 'ecriture' }, pistes: [] };

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
		const tombe = { vecteur: { cas: 'supprimee' }, pistes: [] };
		expect(corps('V-26', tombe, { adresse: CHEMIN_DEMANDE })).toBe(corps('V-26', tombe));
	});
});

describe('V-04 — l’adresse demandée en anonyme', () => {
	const base = {
		vecteur: { cas: casDeV04(CHEMIN_PUBLIC_DEMANDE) },
		portail: PORTAIL_DE_CONTROLE,
		pistes: []
	};

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
		const rendu = corps(
			'V-04',
			{ vecteur: { cas: casDeV04(nu) }, portail: PORTAIL_DE_CONTROLE, pistes: [] },
			{ adresse: nu }
		);
		expect(contenuDe(rendu, 'adresse')).toBe(nu);
	});
});

/* ══════════════════════════════════════════════════════════════════════════
   V-26 ET V-04 — LES SOURCES ABSENTES NE RENDENT PLUS LE JEU DE DÉMONSTRATION

   C'EST LE DÉFAUT QUE CETTE CAMPAGNE RETIRE, et il ne se voyait nulle part :
   `+error.svelte` ne passe ni `univers`, ni — sans donnée de gabarit — `compte`
   ou `domaines`, et les défauts des vues étaient les constantes du jeu. Toute
   adresse cassée d'une instance neuve affichait donc « Karim Belhadj » dans sa
   barre supérieure et « Codicillus 1.0.0 » au pied de son rail.

   LES VALEURS CHERCHÉES VIENNENT DE LEUR SOURCE, jamais d'une chaîne écrite ici :
   `MOI`, `INSTANCE` et `UNIVERS` du jeu de démonstration. Le jour où le jeu
   change de noms, ces cas suivent.
   ══════════════════════════════════════════════════════════════════════════ */
describe('V-26 — sans source servie, rien du jeu de démonstration n’atteint l’écran', () => {
	const rendu = (): string => corps('V-26', { vecteur: null, pistes: [] });

	it('n’affiche ni le compte ni le rôle du jeu', () => {
		expect(rendu()).not.toContain(MOI.nom);
		expect(rendu()).not.toContain(MOI.initiales);
	});

	it('n’affiche pas la version d’instance du jeu', () => {
		expect(rendu()).not.toContain(INSTANCE.version);
	});

	it('n’affiche aucune reprise de contexte — aucune table n’en porte', () => {
		expect(rendu()).not.toContain('Reprendre où vous en étiez');
		expect(rendu()).not.toContain('Dernier dossier consulté');
	});

	it('n’affiche aucune piste de reformulation écrite dans la maquette', () => {
		const cherche = corps(
			'V-26',
			{ vecteur: { cas: casDeV26(), droits: 'ecriture' }, pistes: [] },
			{ adresse: CHEMIN_DEMANDE }
		);
		expect(cherche).not.toContain('class="reformuler"');
		expect(cherche).not.toContain('class="piste"');
	});
});

describe('V-04 — sans piste servie, aucune reformulation n’est promise', () => {
	it('ne rend pas le bloc, plutôt que d’ouvrir cinq recherches sans résultat', () => {
		const rendu = corps(
			'V-04',
			{ vecteur: null, portail: PORTAIL_DE_CONTROLE, pistes: [] },
			{ adresse: CHEMIN_PUBLIC_DEMANDE }
		);
		expect(rendu).not.toContain('class="reformuler"');
		expect(rendu).not.toContain('class="piste"');
	});

	it('les rend quand on lui en sert', () => {
		const rendu = corps(
			'V-04',
			{ vecteur: null, portail: PORTAIL_DE_CONTROLE, pistes: ['badge'] },
			{ adresse: CHEMIN_PUBLIC_DEMANDE }
		);
		expect(rendu).toContain('class="reformuler"');
		expect(rendu).toContain('<button class="piste">badge</button>');
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
	const base = { vecteur: null, pistes: [] };

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
