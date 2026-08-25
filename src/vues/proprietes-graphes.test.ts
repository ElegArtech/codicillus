/**
 * T-043 — LES SEPT VUES RENDUES CAPABLES : ce que la propriété emporte, et ce
 * que le défaut rend.
 *
 * CE QUE CES UNITAIRES PROUVENT. Chaque vue déclare des propriétés OPTIONNELLES
 * dont le défaut est la constante du jeu de semence. Deux affirmations, et il
 * faut les deux : *fournie, la propriété l'emporte* — sans quoi le câblage est
 * décoratif et la vue continue de servir une valeur figée, indépendante de la
 * base et de l'identité (`P-02`) ; *absente, le défaut s'applique* — sans quoi
 * le mode de conception ne rendrait plus ce que le gel montre, et le banc de
 * comparaison rougirait.
 *
 * POURQUOI UN SERVEUR VITE EN INTERGICIEL, ET PAS UN IMPORT ORDINAIRE.
 * `vitest` n'a pas le greffon Svelte : un `import` de `.svelte` ne se compile
 * pas. La parade N'EST PAS de gréer la configuration de vitest — c'est un
 * fichier partagé par tous les lots d'une vague. Un serveur Vite en mode
 * INTERGICIEL n'ouvre aucun port, et `ssrLoadModule()` donne le composant ET
 * `render()` DU MÊME GRAPHE DE MODULES. Les deux du même graphe, sans quoi tout
 * composant rend 500 sans que rien ne le voie — c'est `ECART-013` É-1, et c'est
 * exactement le chemin que le banc emprunte en `source=composant`.
 *
 * CE QU'ILS NE PROUVENT PAS, ET LE DIRE FAIT PARTIE DU CONTRÔLE (`P-5`).
 * Six des sept vues montent la coquille en forme ABRÉGÉE, dont le rail est
 * écrit au balisage du gel et ne se dérive NI des univers NI des domaines
 * (`Coquille.svelte`, §`forme`). Sur V-15, V-16 et V-23, `univers` n'a donc
 * aucun rendu observable : l'unitaire l'établit au lieu de le taire, en
 * exigeant que le balisage soit inchangé. La propriété est acceptée, elle
 * n'est pas exercée — le jour où une vue en dérivera quelque chose, le cas
 * sera à écrire.
 *
 * Aucun comportement n'est joué ici : les batteries 9 et 10 s'en chargent.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';
import type { ComponentProps } from 'svelte';
import {
	DOMAINES,
	RELATIONS,
	RELATIONS_TECHNIQUES,
	TYPES_FICHE,
	TYPES_RELATION,
	UNIVERS,
	VERSIONS,
	corpusPourVue,
	noteParIdentifiant,
	type ChampDeFiche,
	type Note,
	type TypeDeChamp,
	type UtilisateurCourant
} from '../../seeds/corpus';
import type { LectureAffichee } from '../lib/lecture/note-de-demonstration';
import { TYPES_DE_FICHE as TYPES_DE_FICHE_PEUPLES } from '../../seeds/demonstration';
import type { CompteAffiche } from '../lib/coquille/identite';

/* ── Le harnais ───────────────────────────────────────────────────────────
   Un seul serveur pour tout le fichier : le monter coûte quelques secondes,
   le rendu d'une vue coûte quelques millisecondes. */

const RACINE = fileURLToPath(new URL('../../', import.meta.url));

/** Ce que `render()` de `svelte/server` rend — seul `body` est lu ici. */
interface RenduServeur {
	readonly body: string;
}
type RendreSvelte = (composant: unknown, options: { props: object }) => RenduServeur;

let serveur: ViteDevServer;
let rendreSvelte: RendreSvelte;

beforeAll(async () => {
	serveur = await createServer({
		// `root` n'est pas passé : SvelteKit l'impose lui-même, et le lui donner
		// ne fait qu'imprimer un avertissement d'écrasement.
		configFile: `${RACINE}vite.config.ts`,
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
		logLevel: 'silent'
	});
	const module = (await serveur.ssrLoadModule('svelte/server')) as { render: RendreSvelte };
	rendreSvelte = module.render;
}, 120_000);

afterAll(async () => {
	await serveur?.close();
});

/** Le balisage rendu par une vue, chargée par le graphe SSR de Vite. */
async function rendre(vue: string, props: object): Promise<string> {
	const module = (await serveur.ssrLoadModule(`/src/vues/${vue}.svelte`)) as { default: unknown };
	return rendreSvelte(module.default, { props }).body;
}

/* Sept portes typées : le contrat de propriétés de chaque vue est vérifié à la
   compilation, le rendu passe par le graphe de Vite. */
const v15 = (p: ComponentProps<typeof import('./V-15.svelte').default>) => rendre('V-15', p);
const v16 = (p: ComponentProps<typeof import('./V-16.svelte').default>) => rendre('V-16', p);
const v19 = (p: ComponentProps<typeof import('./V-19.svelte').default>) => rendre('V-19', p);
const v20 = (p: ComponentProps<typeof import('./V-20.svelte').default>) => rendre('V-20', p);
const v21 = (p: ComponentProps<typeof import('./V-21.svelte').default>) => rendre('V-21', p);
const v22 = (p: ComponentProps<typeof import('./V-22.svelte').default>) => rendre('V-22', p);
const v23 = (p: ComponentProps<typeof import('./V-23.svelte').default>) => rendre('V-23', p);

/* ── Les valeurs de substitution ──────────────────────────────────────────
   Toutes sont tirées du jeu de semence, jamais fabriquées : ce qu'un chargeur
   de route passera vient de la base, et il vaut mieux que le cas d'épreuve lui
   ressemble. Seuls les libellés de relation sont marqués, pour être
   reconnaissables sans ambiguïté dans le balisage. */

/**
 * LA NOTE TELLE QUE LE CHARGEUR L'AFFICHE — l'enveloppe minimale.
 *
 * Les deux corps sont `null` et le sommaire est vide : ce sont des états que
 * `LectureAffichee` déclare, et ils suffisent à ce que la vue rende son
 * enveloppe. Aucun corps n'est écrit à la main — ce serait le second
 * convertisseur qu'`ADR-004` interdit, y compris dans un test.
 */
function afficheeDe(note: Note): LectureAffichee {
	const instant = { iso: '2026-03-02', jour: '2 mars 2026', heureDite: '2 mars 2026 à 17:40' };
	return {
		note,
		reference: null,
		operationnel: null,
		sommaire: [],
		controle: null,
		joursDepuisControle: 4,
		modifiee: instant,
		referenceModifiee: instant,
		resync: false,
		revision: null,
		consultations30j: 7,
		consultationsTotal: 431
	};
}

/** Une autre identité que `MOI` : autres initiales, autre nom, autre domaine. */
const AUTRE_COMPTE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

/**
 * LA MÊME IDENTITÉ, DANS LA FORME QUE LA COQUILLE AFFICHE.
 *
 * `CompteAffiche` est le contrat que le gabarit racine sert et que déclarent
 * les vues dont le défaut tiré du jeu a été retiré. Il est DÉRIVÉ de
 * `AUTRE_COMPTE` plutôt que recopié : deux littéraux divergeraient sans
 * qu'aucun compilateur ne le voie, et le contrôle mesurerait sa propre copie.
 */
const AUTRE_COMPTE_AFFICHE: CompteAffiche = {
	nom: AUTRE_COMPTE.nom,
	initiales: AUTRE_COMPTE.initiales,
	role: AUTRE_COMPTE.role,
	domaine: AUTRE_COMPTE.domaine
};

/** Un seul univers, et ce n'est pas le premier du jeu. */
const UN_UNIVERS = UNIVERS.filter((u) => u.nom === 'Projets');
/** Un seul domaine, et ce n'est pas le premier du jeu. */
const UN_DOMAINE = DOMAINES.filter((d) => d.nom === 'Applications');
/** Une seule relation — le sous-graphe n'en portera qu'une arête. */
const UNE_RELATION = RELATIONS.slice(0, 1);
/**
 * Une seule relation, touchant le nœud que V-20 met au centre au moment
 * « déplié » : c'est elle qui alimente le panneau de détail, donc le libellé.
 */
const UNE_RELATION_AU_CENTRE = RELATIONS.filter(
	(r) => r.vers === 'n-pg-prod-01' && r.type === 'depend'
).slice(0, 1);
/** Les mêmes types, deux libellés marqués — reconnaissables sans ambiguïté. */
const TYPES_MARQUES = {
	...TYPES_RELATION,
	heberge: { sortant: 'HÉBERGE-MARQUÉ', entrant: 'HÉBERGÉ-MARQUÉ' },
	depend: { sortant: 'DÉPEND-MARQUÉ', entrant: 'DONT-DÉPENDENT-MARQUÉ' }
};

/* ── Le référentiel de fiche, TEL QUE LA BASE LE REND ─────────────────────
   Il n'est pas écrit ici, et c'est tout le contrôle : un cas qui fabriquerait
   son référentiel ne prouverait rien de celui d'une instance réelle. Il est
   dérivé de `seeds/demonstration.ts`, les lignes mêmes que `base:peupler`
   insère et que `lireTypesDeFiche()` relit — quatre types dont « Équipement
   réseau », que la constante `TYPES_FICHE` du jeu de rendu ne connaît pas, et
   des champs qui ne portent NI les mêmes clés NI les mêmes noms.

   LA SEULE CONVERSION EST CELLE DU LECTEUR : la colonne énumérée dit `booleen`,
   `lireTypesDeFiche()` rend `interrupteur`. Clés, noms, exemples et valeurs sont
   repris tels quels. */
const TYPE_DE_CHAMP_LU: Record<string, TypeDeChamp> = {
	texte: 'texte',
	nombre: 'nombre',
	liste: 'liste',
	booleen: 'interrupteur'
};

const REFERENTIEL_PEUPLE: Record<string, readonly ChampDeFiche[]> = Object.fromEntries(
	TYPES_DE_FICHE_PEUPLES.map((t) => [
		t.nom,
		t.champs.map((c) => ({ ...c, type: TYPE_DE_CHAMP_LU[c.type] ?? 'texte' }))
	])
);

/** Le même référentiel, dont le type de la fiche observée a été RETIRÉ. */
const REFERENTIEL_SANS_SERVEUR: Record<string, readonly ChampDeFiche[]> = Object.fromEntries(
	Object.entries(REFERENTIEL_PEUPLE).filter(([nom]) => nom !== 'Serveur')
);

/** Le nombre d'occurrences d'un motif dans le balisage rendu. */
function compter(html: string, motif: RegExp): number {
	return html.match(motif)?.length ?? 0;
}

/* ═══════════════════════════════════════════════════════════════════════ */

describe('V-15 — historique des versions', () => {
	const notes = corpusPourVue('V-15');
	/* LA NOTE DONT L'HISTORIQUE EST OUVERT. Elle vient du corpus servi, jamais
	   d'une saisie : c'est la forme qu'un chargeur produit. */
	const LA_NOTE = notes[0]!;
	const AFFICHEE = afficheeDe(LA_NOTE);
	const SOCLE = {
		vecteur: null,
		notes,
		note: LA_NOTE,
		affichee: AFFICHEE,
		versions: {},
		retentionVersions: 50,
		versionAffichee: null,
		onComparer: () => undefined
	};

	it("sans identité servie, aucun compte du jeu de démonstration n'est nommé", async () => {
		const body = await v15(SOCLE);
		expect(body).not.toContain('Karim Belhadj — menu utilisateur');
		expect(body).not.toContain('>KB<');
	});

	it("l'identité servie est celle qui est rendue", async () => {
		const body = await v15({ ...SOCLE, compte: AUTRE_COMPTE });
		expect(body).toContain('Sophie Nguyen');
		expect(body).toContain('>SN<');
	});

	/* La rétention n'est annoncée que lorsqu'il y a quelque chose à conserver :
	   le gel efface le texte plutôt que d'annoncer zéro. */
	it('annonce la rétention servie, et non celle du jeu', async () => {
		const body = await v15({
			...SOCLE,
			versions: { [LA_NOTE.id]: VERSIONS['n-restaurer-pg']! },
			retentionVersions: 7
		});
		expect(body).toContain('les 7 dernières sont gardées');
		expect(body).not.toContain('les 50 dernières sont gardées');
	});

	it("l'historique rendu est celui de la note ouverte, et rien d'autre", async () => {
		const vide = await v15(SOCLE);
		expect(vide).toContain('Aucune version antérieure');
		expect(vide).not.toContain('Version 14');

		/* L'historique est lu SOUS LA CLÉ DE LA NOTE OUVERTE : servi sous une
		   autre clé, il ne se rend pas. C'est ce que le levier `hist` de la
		   planche contournait, en choisissant une note du jeu. */
		const servi = await v15({ ...SOCLE, versions: { [LA_NOTE.id]: VERSIONS['n-restaurer-pg']! } });
		expect(servi).toContain('Version 14');
	});

	it("la forme abrégée ne dérive rien des univers ni des domaines — la propriété est acceptée, elle n'est pas exercée", async () => {
		const temoin = await v15(SOCLE);
		const restreint = await v15({ ...SOCLE, univers: UN_UNIVERS, domaines: UN_DOMAINE });
		expect(restreint).toBe(temoin);
	});
});

describe('V-16 — comparaison de versions', () => {
	const notes = corpusPourVue('V-16');
	const LA_NOTE = notes[0]!;
	const SOCLE = { vecteur: null, notes, note: LA_NOTE, versions: {}, contenuVersions: {} };

	it('sans historique ni contenu de version, rien ne se fabrique', async () => {
		const body = await v16(SOCLE);
		expect(body).not.toContain('22/07/2026');
		expect(body).not.toContain("Cette procédure décrit la restauration d'une base PostgreSQL");
		expect(body).not.toContain('Karim Belhadj — menu utilisateur');
	});

	it("l'historique servi est lu sous la clé de la note comparée", async () => {
		const body = await v16({
			...SOCLE,
			vecteur: { cmp: '13-14' },
			versions: { [LA_NOTE.id]: VERSIONS['n-restaurer-pg']! }
		});
		expect(body).toContain('22/07/2026');
	});

	it("l'identité servie est celle qui est rendue", async () => {
		const body = await v16({ ...SOCLE, compte: AUTRE_COMPTE });
		expect(body).toContain('>SN<');
	});
});

describe('V-19 — cartographie', () => {
	const notes = corpusPourVue('V-19');

	/* LES CINQ SOURCES DU GRAPHE SONT EXIGÉES — il n'existe plus de « absente,
	   la constante du jeu s'applique » à éprouver, et c'est le correctif : ce
	   défaut-là servait le jeu de démonstration à toute route qui l'oubliait.
	   Le socle du cas les passe donc explicitement, comme la route les sert. */
	const SOCLE = {
		vecteur: null,
		notes,
		univers: UNIVERS,
		domaines: DOMAINES,
		relations: RELATIONS,
		typesRelation: TYPES_RELATION,
		relationsTechniques: RELATIONS_TECHNIQUES
	} as const;

	it('rend ce qui lui est servi, et le sélecteur ouvre sur tout le corpus', async () => {
		const body = await v19({ ...SOCLE });
		expect(body).toContain('>Univers Production<');
		expect(body).toContain('>Domaine Infrastructure<');
		expect(body).toContain('est hébergé par');
		expect(compter(body, /class="arete"/g)).toBeGreaterThan(1);
		/* LE DÉFAUT RÉPARÉ : le périmètre valait `global|` et le sélecteur n'en
		   portait aucune option. Le contrôle s'ouvrait sans valeur au-dessus
		   d'une carte qui montrait tout, et rien ne ramenait au corpus entier. */
		expect(body).toContain('<option value="global|">Tous les domaines</option>');
	});

	it('sans identité servie, aucun compte du jeu n’atteint le balisage', async () => {
		const body = await v19({ ...SOCLE });
		expect(body).not.toContain('>KB<');
		expect(body).not.toContain('Codicillus 1.0.0');
	});

	it("fournie, l'identité l'emporte", async () => {
		const body = await v19({ ...SOCLE, compte: AUTRE_COMPTE });
		expect(body).toContain('>SN<');
	});

	it('le rangement servi décide seul du sélecteur de périmètre', async () => {
		const body = await v19({ ...SOCLE, univers: UN_UNIVERS, domaines: UN_DOMAINE });
		expect(body).toContain('>Univers Projets<');
		expect(body).not.toContain('>Univers Production<');
		expect(body).toContain('>Domaine Applications<');
		expect(body).not.toContain('>Domaine Infrastructure<');
	});

	it('les relations servies décident seules — libellés et dépendances techniques', async () => {
		const body = await v19({
			...SOCLE,
			relations: UNE_RELATION,
			typesRelation: TYPES_MARQUES,
			relationsTechniques: []
		});
		expect(compter(body, /class="arete"/g)).toBe(1);
		expect(body).toContain('HÉBERGE-MARQUÉ');
		expect(compter(body, /data-technique="oui"/g)).toBe(0);
		expect(compter(body, /data-technique="non"/g)).toBe(1);
	});

	it('sans relation servie, la carte est vide — jamais celle du jeu', async () => {
		const body = await v19({ ...SOCLE, relations: [] });
		expect(compter(body, /class="arete"/g)).toBe(0);
		expect(body).not.toContain('Restaurer une sauvegarde PostgreSQL');
	});
});

describe('V-20 — cartographie par type maître', () => {
	const notes = corpusPourVue('V-20');

	/* LES QUATRE SOURCES DU GRAPHE SONT EXIGÉES — voir V-19. */
	const SOCLE = {
		vecteur: null,
		notes,
		relations: RELATIONS,
		typesRelation: TYPES_RELATION,
		relationsTechniques: RELATIONS_TECHNIQUES,
		typesFiche: TYPES_FICHE
	} as const;

	it('sans rangement ni identité servis, rien du jeu n’atteint le balisage', async () => {
		const body = await v20({ ...SOCLE });
		expect(body).not.toContain('>Domaine Infrastructure<');
		expect(body).not.toContain('>KB</button>');
		expect(body).not.toContain('Karim Belhadj — menu utilisateur');
		expect(body).not.toContain('Codicillus 1.0.0');
	});

	it("fournis, le rangement et l'identité l'emportent", async () => {
		const body = await v20({ ...SOCLE, domaines: UN_DOMAINE, compte: AUTRE_COMPTE });
		expect(body).toContain('>Domaine Applications<');
		expect(body).toContain('>SN</button>');
		expect(body).toContain('Sophie Nguyen — menu utilisateur');
	});

	it('les relations servies sont les seules dessinées', async () => {
		/* L'anneau n'est peuplé qu'à partir du moment où un type maître est choisi :
		   c'est `moment=deplie` qui dessine les nœuds ET leurs arêtes titrées. */
		const etat = { moment: 'deplie' };
		const temoin = await v20({ ...SOCLE, vecteur: etat });
		const body = await v20({
			...SOCLE,
			vecteur: etat,
			relations: UNE_RELATION_AU_CENTRE,
			typesRelation: TYPES_MARQUES
		});
		expect(compter(temoin, /data-maitre="/g)).toBeGreaterThan(compter(body, /data-maitre="/g));
		expect(compter(body, /data-maitre="/g)).toBe(2);
		expect(temoin).not.toContain('DONT-DÉPENDENT-MARQUÉ');
		expect(body).toContain('DONT-DÉPENDENT-MARQUÉ');
	});

	/* ── LE PANNEAU DE DÉTAIL D'UNE FICHE ─────────────────────────────────
	   Le nœud choisi est `n-pg-prod-01`, une fiche de type « Serveur » du corpus
	   de la vue ; l'adresse le désigne, comme le chargeur le fait. */
	const SUR_UNE_FICHE = {
		...SOCLE,
		perimetreDemande: 'global|',
		typeMaitreDemande: 'Serveur',
		centreDemande: 'n-pg-prod-01'
	} as const;

	it('rend les champs du référentiel reçu, et non ceux du jeu de rendu', async () => {
		const temoin = await v20({ ...SUR_UNE_FICHE });
		expect(temoin).toContain('Adresse IP');

		const body = await v20({ ...SUR_UNE_FICHE, typesFiche: REFERENTIEL_PEUPLE });
		expect(body).toContain('Nom DNS');
		expect(body).not.toContain('Adresse IP');
	});

	it('un type absent du référentiel reçu rend un état neutre, sans lever', async () => {
		/* LE DÉFAUT RÉPARÉ : la vue lisait le référentiel du jeu de semence au
		   niveau de son module et indexait sans garde. Un type de fiche que ce
		   référentiel-là ne porte pas — créé en console, ou simplement postérieur
		   au jeu — faisait LEVER l'accès au clic sur le nœud. */
		const body = await v20({ ...SUR_UNE_FICHE, typesFiche: REFERENTIEL_SANS_SERVEUR });
		expect(body).toContain('Aucune propriété au référentiel.');
		expect(body).not.toContain('Nom DNS');
	});

	it('les valeurs servies décident seules, et l’exemple du référentiel s’efface', async () => {
		/* SERVIES — fût-ce vides, ce que rend la lecture quand aucune fiche ne
		   porte de propriété —, elles sont la seule source de valeur. Le champ
		   reste annoncé, sa valeur devient le tiret : un exemple de référentiel
		   affiché sous l'intitulé « Propriétés » d'une note réelle est une valeur
		   inventée. */
		const temoin = await v20({ ...SUR_UNE_FICHE, typesFiche: REFERENTIEL_PEUPLE });
		expect(temoin).toContain('pg-prod-01.interne');

		const body = await v20({
			...SUR_UNE_FICHE,
			typesFiche: REFERENTIEL_PEUPLE,
			proprietesDeFiche: {}
		});
		expect(body).toContain('Nom DNS');
		expect(body).not.toContain('pg-prod-01.interne');
	});
});

describe('V-21 — carte mentale', () => {
	const notes = corpusPourVue('V-21');

	/* LE RANGEMENT EST EXIGÉ : la carte mentale dessinait l'arborescence du jeu
	   de démonstration à toute route qui l'oubliait, et chacun de ses nœuds
	   ouvrait une adresse en 404. */
	const SOCLE = { vecteur: null, notes, univers: UNIVERS, domaines: DOMAINES } as const;

	it('rend le rangement servi, sans identité du jeu', async () => {
		const body = await v21({ ...SOCLE });
		expect(body).toContain('>Univers Production<');
		expect(body).toContain('>Univers Projets<');
		expect(body).toContain('>Domaine Infrastructure<');
		expect(body).not.toContain('>KB<');
		expect(body).not.toContain('Codicillus 1.0.0');
	});

	it("fournis, le rangement et l'identité l'emportent", async () => {
		const body = await v21({
			...SOCLE,
			univers: UN_UNIVERS,
			domaines: UN_DOMAINE,
			compte: AUTRE_COMPTE
		});
		expect(body).toContain('>Univers Projets<');
		expect(body).not.toContain('>Univers Production<');
		expect(body).toContain('>Domaine Applications<');
		expect(body).not.toContain('>Domaine Infrastructure<');
		expect(body).toContain('>SN<');
	});

	it('sur un rangement vide, aucun univers ni domaine du jeu ne subsiste', async () => {
		const body = await v21({ ...SOCLE, univers: [], domaines: [] });
		expect(body).not.toContain('>Univers Production<');
		expect(body).not.toContain('>Domaine Infrastructure<');
	});
});

describe('V-22 — signets d’un domaine', () => {
	const notes = corpusPourVue('V-22');

	/* `domaines` EST REQUISE. Elle a eu `DOMAINES` du jeu de démonstration pour
	   défaut : une route qui l'oubliait servait un rangement qui n'existe pas.
	   Le contrôle porte donc sur ce que la liste SERVIE décide, et sur ce que la
	   vue ne montre plus quand cette liste ne porte pas le domaine du jeu. */
	it('le domaine rendu est celui de la liste servie, jamais celui du jeu', async () => {
		const body = await v22({ vecteur: null, notes, domaines: UN_DOMAINE });
		expect(body).toContain('>Signets de Applications<');
		expect(body).not.toContain('>Signets de Infrastructure<');
	});

	/* AUCUNE IDENTITÉ, AUCUNE VERSION — les deux états vides, ensemble. La barre
	   supérieure annonçait « Karim Belhadj » et le pied du rail « Codicillus
	   1.0.0 » à qui n'était personne : deux valeurs du jeu servies comme des
	   faits. Sans compte servi, rien n'est annoncé. */
	it('sans compte ni version, rien du jeu n’est annoncé', async () => {
		const body = await v22({ vecteur: null, notes, domaines: DOMAINES });
		expect(body).not.toContain('>KB<');
		expect(body).not.toContain('Karim Belhadj — menu utilisateur');
		expect(body).not.toContain('Codicillus 1.0.0');
	});

	it('fournie, l’identité l’emporte', async () => {
		const body = await v22({
			vecteur: null,
			notes,
			domaines: DOMAINES,
			compte: AUTRE_COMPTE_AFFICHE
		});
		expect(body).toContain('>SN<');
	});

	/* LE RAIL NE MARQUE QUE LE DOMAINE COURANT. Il en marquait DEUX : le gel
	   accumule la marque, et la vue recopiait « Infrastructure » en dur. */
	it('le rail ne met en évidence que le domaine servi', async () => {
		const body = await v22({ vecteur: { dom: 'Applications' }, notes, domaines: DOMAINES });
		expect(body).toContain('>Signets de Applications<');
		expect(body).not.toContain('>Signets de Infrastructure<');
	});

	/* LES VALEURS DE FACETTE RETENUES — les deux que `docs/routes.md` §4.2
	   déclare pour cette route. Avant leur câblage, les menus étaient
	   décoratifs : cocher une valeur ne filtrait rien. */

	it('absente, aucun signet du domaine ne manque et rien n’est retenu', async () => {
		const body = await v22({ vecteur: null, notes, domaines: DOMAINES });
		expect(body).toContain('PostgreSQL');
		expect(body).toContain('ANSSI');
		expect(body).toContain("Page d'état de l'hébergeur");
		expect(body).not.toContain('Tout effacer');
		expect(body).not.toContain('data-actif="oui"');
	});

	it('fournie, elle filtre la liste, coche la valeur et pose son jeton', async () => {
		const body = await v22({
			vecteur: null,
			notes,
			domaines: DOMAINES,
			retenues: { auteur: ['Sophie Nguyen'] }
		});
		expect(body).toContain('ANSSI');
		expect(body).not.toContain('PostgreSQL');
		expect(body).not.toContain("Page d'état de l'hébergeur");
		expect(body).toContain('Auteur : ');
		expect(body).toContain('Tout effacer');
		expect(body).toContain('data-actif="oui"');
	});

	it('deux facettes se combinent en ET, deux valeurs d’une facette en OU', async () => {
		const etDeux = await v22({
			vecteur: null,
			notes,
			domaines: DOMAINES,
			retenues: { auteur: ['Karim Belhadj'], etiquette: ['postgresql'] }
		});
		expect(etDeux).toContain('PostgreSQL');
		expect(etDeux).not.toContain('Documentation officielle Barman');

		const ouDeux = await v22({
			vecteur: null,
			notes,
			domaines: DOMAINES,
			retenues: { etiquette: ['postgresql', 'barman'] }
		});
		expect(ouDeux).toContain('PostgreSQL');
		expect(ouDeux).toContain('Documentation officielle Barman');
		expect(ouDeux).not.toContain('ANSSI');
	});

	it('une valeur qui ne mord sur rien rend l’état « aucun résultat »', async () => {
		const body = await v22({
			vecteur: null,
			notes,
			domaines: DOMAINES,
			retenues: { auteur: ['Personne'] }
		});
		expect(body).toContain('Aucun signet ne correspond à ces filtres');
		expect(body).toContain('Réinitialiser les filtres');
		expect(body).not.toContain('Aucun signet dans ce domaine');
	});

	/* LE MENU RENDU DIT QUELLE FACETTE IL PORTE.

	   Le câblage retrouvait la facette d'un menu par son RANG. Or la vue
	   n'émet un menu que si la facette a au moins une valeur, et les
	   étiquettes d'un signet sont FACULTATIVES : sur un domaine dont aucun
	   signet n'en porte, le seul menu rendu est « Auteur », au rang 0, et
	   cocher un auteur écrivait une clé d'adresse `etiquette`. L'autre
	   moitié du chemin — de l'identifiant à la clé d'adresse — est éprouvée
	   par `src/lib/cablage/facettes.test.ts`. */

	/** Les mêmes signets, sans aucune étiquette — la saisie les rend vides. */
	const sansEtiquette = notes.map((n) => ({ ...n, etiquettes: [] }));

	it('chaque menu rendu porte l’identifiant de SA facette', async () => {
		const body = await v22({ vecteur: null, notes, domaines: DOMAINES });
		expect(body).toContain('data-facette="etiquette"');
		expect(body).toContain('data-facette="auteur"');
	});

	it('sans aucune étiquette, le seul menu rendu est celui de l’auteur', async () => {
		const body = await v22({ vecteur: null, notes: sansEtiquette, domaines: DOMAINES });
		expect(body).toContain('data-facette="auteur"');
		expect(body).not.toContain('data-facette="etiquette"');
		expect(body.match(/class="fac-menu"/g) ?? []).toHaveLength(1);
	});
});

describe('V-23 — formulaire de signet', () => {
	const notes = corpusPourVue('V-23');

	/* SANS SIGNET, LE FORMULAIRE EST VIERGE. Il retombait sur `n-sig-statut` du
	   jeu de démonstration — la note que le gel édite —, y compris sur
	   `/…/signets/nouveau`, qui n'en désigne aucun. `null` est l'état vide. */
	it('sans signet, aucune valeur du jeu n’atteint le formulaire', async () => {
		const body = await v23({
			vecteur: { mode: 'edition' },
			notes,
			domaines: DOMAINES,
			signet: null
		});
		expect(body).not.toContain("Page d'état de l'hébergeur");
		expect(body).not.toContain('https://status.exemple-hebergeur.net');
		expect(body).not.toContain('Codicillus 1.0.0');
		expect(body).not.toContain('>KB<');
	});

	it('fourni, le signet l’emporte — chaque signet est rendu, pas toujours le même', async () => {
		for (const id of ['n-doc-barman', 'n-sig-postgres', 'n-sig-anssi', 'n-sig-statut'] as const) {
			const signet = noteParIdentifiant(id);
			if (!signet) throw new Error(`le jeu de semence ne porte pas ${id}`);
			const body = await v23({
				vecteur: { mode: 'edition' },
				notes,
				domaines: DOMAINES,
				signet
			});
			expect(body).toContain(signet.titre.replace(/&/g, '&amp;'));
			expect(body).toContain(signet.url ?? '');
		}
	});

	/* LE DOMAINE PRÉ-CHOISI VIENT DE L'ADRESSE, jamais d'une identité : il
	   descendait par `compte.domaine`, dont le dernier repli était `MOI` du jeu.
	   Et le sélecteur n'offre que les domaines SERVIS. */
	it('le sélecteur n’offre que les domaines servis, et coche celui de l’adresse', async () => {
		const body = await v23({
			vecteur: { mode: 'creation' },
			notes,
			domaines: UN_DOMAINE,
			domaineDeDepart: 'Applications',
			compte: AUTRE_COMPTE_AFFICHE
		});
		expect(body).toContain('value="Applications"');
		expect(body).not.toContain('value="Infrastructure"');
		expect(body).toContain('>SN<');
	});

	/* LE FIL D'ARIANE PORTE LE RANGEMENT RÉEL. Il écrivait « Production ›
	   Infrastructure » en dur — deux noms du jeu, annoncés comme un fait. La
	   mesure est découpée sur le fil : le rail abrégé nomme, lui, les dossiers
	   du gel tant qu'aucun gabarit racine ne lui sert la base. */
	it('le fil d’Ariane nomme l’univers et le domaine servis', async () => {
		const body = await v23({
			vecteur: { mode: 'creation' },
			notes,
			domaines: UN_DOMAINE,
			domaineDeDepart: 'Applications'
		});
		const fil = /<nav class="fil"[\s\S]*?<\/nav>/.exec(body)?.[0] ?? '';
		expect(fil).toContain('>Applications</a>');
		expect(fil).not.toContain('>Infrastructure</a>');
	});
});
