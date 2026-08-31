/**
 * L'IMPORT N'OFFRE QUE CE QU'IL FAIT — les deux écrans, rendus par le chemin du
 * produit.
 *
 * Ce que ces cas éprouvent : le BALISAGE RÉELLEMENT SERVI. Le composant est
 * chargé par `ssrLoadModule` et rendu par `svelte/server`, comme le mode démo et
 * comme `proprietes-coquille.test.ts` — un cas qui n'aurait pas traversé le
 * compilateur Svelte ne dirait rien du composant réellement servi.
 *
 * CE QU'ILS NE PROUVENT PAS, ET C'EST DÉLIBÉRÉ : le refus d'un scénario non
 * livré par l'action de `/importer`. Ce refus se joue sur une `FormData` qui
 * arrive du navigateur ; la fabriquer ici ferait partager au contrôle et au code
 * la même hypothèse sur la forme de l'entrée, et le contrôle ne pourrait pas la
 * détecter fausse. Il est relevé au navigateur, par un envoi réel, et son code
 * HTTP est au rapport du lot.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import {
	CORPUS,
	DOMAINES,
	FORMATS_IMPORT,
	JOURNAL_IMPORTS,
	LOT_IMPORT,
	UNIVERS,
	corpusDeVariante,
	type LotDImport,
	type Note
} from '../../seeds/corpus';
import { LIBELLE_PAR_FORMAT } from '../lib/donnees/import';
import { LIBELLE_DU_MOTIF } from '../lib/import/motifs';
import {
	MESURES_DE_CONSOLE_SANS_CONTREPARTIE,
	journalDImportsEnregistre
} from '../lib/donnees/consoles';
import { SCENARIOS_NON_LIVRES, SCENARIO_LIVRE } from '../lib/donnees/scenarios-d-import';

type Proprietes = Record<string, unknown>;
type Rendre = (composant: unknown, options: { props: Proprietes }) => { body: string };

let vite: ViteDevServer;
let rendre: Rendre;
let notes: readonly Note[];
const composants = new Map<string, unknown>();

beforeAll(async () => {
	vite = await createServer({
		server: { middlewareMode: true },
		appType: 'custom',
		logLevel: 'error'
	});
	const serveur = (await vite.ssrLoadModule('svelte/server')) as unknown as { render: Rendre };
	rendre = serveur.render;
	notes = corpusDeVariante('complete');
	for (const nom of ['V-24', 'V-35']) {
		const module = (await vite.ssrLoadModule(`/src/vues/${nom}.svelte`)) as unknown as {
			default: unknown;
		};
		composants.set(nom, module.default);
	}
}, 300_000);

afterAll(async () => {
	await vite?.close();
});

/**
 * CE QUE CHAQUE VUE EXIGE, et qu'elle ne fabrique plus elle-même.
 *
 * `journalImports` de V-35 retombait sur `JOURNAL_IMPORTS` du jeu de
 * démonstration ; la propriété est devenue EXIGÉE, et l'état que le produit
 * sert est la table vide — aucune table n'enregistre d'import.
 */
const EXIGEES: Readonly<Record<string, Proprietes>> = { 'V-35': { journalImports: [] } };

function corps(vue: string, props: Proprietes = {}): string {
	return rendre(composants.get(vue), { props: { notes, ...EXIGEES[vue], ...props } }).body;
}

/**
 * LES BORNES D'UN ÉLÉMENT SERVI, RELEVÉES SUR LE BALISAGE RÉEL.
 *
 * Ni le fragment ni ses attributs ne sont écrits ici : ils sont cherchés dans
 * ce que le compilateur Svelte a produit. Un contrôle qui fabriquerait le
 * balisage qu'il éprouve ne dirait rien de celui que le produit sert.
 */
function borneServie(
	rendu: string,
	identifiant: string,
	balise: string
): { readonly ouvrante: string; readonly debut: number; readonly fin: number } {
	const ancre = rendu.indexOf('id="' + identifiant + '"');
	expect(ancre).toBeGreaterThan(-1);
	const debut = rendu.lastIndexOf('<' + balise, ancre);
	const finDeLOuvrante = rendu.indexOf('>', ancre);
	const fin = rendu.indexOf('</' + balise + '>', ancre);
	expect(debut).toBeGreaterThan(-1);
	expect(fin).toBeGreaterThan(finDeLOuvrante);
	return { ouvrante: rendu.slice(debut, finDeLOuvrante + 1), debut, fin };
}

/**
 * CE QUE `/importer` SERT TOUJOURS, ET QUE V-24 EXIGE DÉSORMAIS.
 *
 * Ces quatre propriétés étaient optionnelles, de défaut la constante de
 * `seeds/corpus.ts` : un écran d'import sans chargeur montrait trente fichiers
 * de démonstration comme s'ils venaient d'être déposés. Le socle du cas les
 * passe comme la route les sert. `formatsImport` vient du référentiel du
 * produit, `$lib/donnees/import.ts`, et non plus du jeu.
 */
const SOCLE_V24: Proprietes = {
	domaines: DOMAINES,
	/* `UC-M12-02` — deux univers d'accueil, donc le scénario « domaine complet » est
	   OFFERT sous ce socle. Le cas de la liste vide est joué à part. */
	universOuCreerUnDomaine: [
		{ identifiant: 'production', nom: 'Zone Q' },
		{ identifiant: 'gouvernance', nom: 'Zone R' }
	],
	lotImport: LOT_IMPORT,
	formatsImport: LIBELLE_PAR_FORMAT,
	domaineParDefaut: DOMAINES[0]!.nom
};

/** Les quatre étapes du parcours, telles que la clé d'état les nomme. */
const VECTEURS: readonly (Proprietes | null)[] = [null, { et: '2' }, { et: '3' }, { et: '4' }];

/* ══════════════════════════════════════════════════════════════════════════
   LA COPIE DU JEU EST LIÉE À SON ORIGINE

   Les libellés de format sont un RÉFÉRENTIEL DU PRODUIT — `LIBELLE_PAR_FORMAT`
   de `$lib/donnees/import.ts`, la contrepartie française de `VOIE_PAR_FORMAT` —
   et `/importer` les sert de là. `seeds/corpus.ts` en garde une copie mot pour
   mot, `FORMATS_IMPORT`, pour le jeu de démonstration. Deux tables identiques
   qu'aucun contrôle ne lie divergent en silence : aucun compilateur ne voit la
   copie, et c'est le jeu qui montrerait alors un libellé que le produit n'écrit
   nulle part. Le lien est ici, et il rougit dans les deux sens.
   ══════════════════════════════════════════════════════════════════════════ */
describe('les libellés de format — le jeu de démonstration recopie le produit', () => {
	it('la table du jeu est celle du produit, clé pour clé', () => {
		expect(FORMATS_IMPORT).toEqual(LIBELLE_PAR_FORMAT);
	});
});

describe('V-24 — l’étape 1 offre les trois scénarios, et les trois sont exécutés', () => {
	it('rend les trois vignettes du gel', () => {
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: null });
		expect(rendu).toContain('Importer des notes dans un domaine existant');
		expect(rendu).toContain('Importer un domaine complet');
		expect(rendu).toContain('Importer un corpus préparé');
	});

	it('n’a plus aucun scénario en retrait', () => {
		/* LE MÉCANISME RESTE, ET IL EST VIDE. Ce n'est pas un vestige : c'est par lui
		   que l'écran n'offre jamais ce que l'action refuse. Le jour où un scénario
		   reculerait, il suffirait d'y entrer pour que la vignette disparaisse. */
		expect(SCENARIOS_NON_LIVRES).toEqual([]);
		expect(SCENARIO_LIVRE).toBe('notes');
	});

	it('RETIRE « domaine complet » à qui ne peut pas créer de domaine — P-09', () => {
		/* Le droit s'éprouve sur l'UNIVERS, la cible n'existant pas encore. Sans
		   univers d'accueil servi, l'offre n'est pas rendue : une action interdite
		   n'est pas dessinée, et l'action la refuse par ailleurs. */
		const rendu = corps('V-24', { ...SOCLE_V24, universOuCreerUnDomaine: [], vecteur: null });
		expect(rendu).toContain('Importer des notes dans un domaine existant');
		expect(rendu).toContain('Importer un corpus préparé');
		expect(rendu).not.toContain('Importer un domaine complet');
	});

	it('porte la case du mode strict, que RG-M12-03 exige et qu’aucune maquette n’offre', () => {
		/* « … sauf si l'utilisateur a explicitement demandé un mode strict » : sans
		   déclencheur, la règle n'est pas tenue. La case est à l'étape 1, le mode
		   gouvernant le lot entier et non son dépôt. */
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: null });
		expect(rendu).toContain('Refuser le lot entier si une ligne échoue');
		expect(borneServie(rendu, 'champ-strict', 'label').ouvrante).not.toContain('hidden');
	});

	it('n’offre chaque champ de cible que sous son scénario', () => {
		/* Les trois champs de l'étape 2 sont ceux du gel, et leur condition
		   d'affichage est celle de `rendreDepot()` (`V-24:2923`) — à ceci près que le
		   domaine de destination sert DEUX scénarios : `UC-M12-01` et `UC-M12-03` y
		   rangent tous deux leurs notes. La planche rend le scénario de base. */
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: { et: '2' } });
		expect(borneServie(rendu, 'champ-domaine', 'div').ouvrante).not.toContain('hidden');
		expect(borneServie(rendu, 'champ-nom-domaine', 'div').ouvrante).toContain('hidden');
		expect(borneServie(rendu, 'champ-simulation', 'label').ouvrante).toContain('hidden');
	});

	it('redemande le nom du domaine à créer, et son univers d’accueil', () => {
		/* « Nom du domaine à créer * » était OBLIGATOIRE à l'écran et n'était lu
		   nulle part : le champ avait été retiré. Il est remis, et il est LU —
		   `destinationDuLot()` en fait le nom du domaine qu'elle crée. L'univers,
		   lui, n'est dans aucune maquette : un domaine appartient à un univers
		   (`RG-STR-02`), et rien d'autre à l'écran ne dit lequel. */
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: { et: '2' } });
		expect(rendu).toContain('Nom du domaine à créer');
		expect(rendu).toContain('nom-domaine');
		expect(rendu).toContain('univers-cible');
		expect(rendu).toContain('Zone Q');
	});

	it('promet de nouveau la résolution automatique des liens, et la tient', () => {
		/* La promesse avait été RETIRÉE parce que rien ne la tenait : un renvoi était
		   relevé, consigné, jamais résolu — la clé ne nommait pas le type de relation.
		   `relations:` le nomme, la seconde passe crée la relation, et le rapport la
		   compte. La phrase du gel peut revenir. */
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: null });
		expect(rendu).toContain('liens entre documents sont résolus automatiquement');
	});

	it('n’invite plus à déposer une archive, que le classement écarte', () => {
		const rendu = corps('V-24', { ...SOCLE_V24, vecteur: { et: '2' } });
		expect(rendu).toContain('Glissez un dossier ici');
		expect(rendu).not.toContain('Glissez un dossier ou une archive ici');
	});

	it('le scénario livré reste celui de l’étape 2 de la planche', () => {
		expect(SCENARIO_LIVRE).toBe('notes');
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   V-24 NE NOMME AUCUN NŒUD DU JEU DE DÉMONSTRATION

   L’illustration du scénario d’import écrivait deux chemins de
   `CORPUS[].dossier` — et pas seulement dans l’arbre de FICHIERS, à gauche de
   la flèche : elle les répétait EN GRAS à droite, là où la flèche désigne des
   dossiers DU PRODUIT. L’installateur lisait donc, comme destination, deux
   dossiers que son domaine ne porte pas.

   LE CONTRÔLE DU PAQUET NE PEUT PAS ATTRAPER ÇA, ET IL LE DIT LUI-MÊME
   (`docs/traces/aiguilles-du-corpus.mjs`) : il ne pose que les chemins
   ENTIERS, jamais leurs segments, parce qu’un segment d’un seul mot ne
   distingue pas une valeur du corpus d’un nom commun — posés, ses aiguilles
   criaient sur de la prose française ordinaire, dans tout le produit bâti.

   Ici le rendu est CONNU : une seule vue, quatre étapes, des propriétés nues.
   Les segments peuvent donc être posés un par un, et les rares homonymes
   écartés NOMMÉMENT, avec leur raison — comme la trace écarte les siens.

   LA LISTE SE LIT DU JEU, ELLE NE SE RECOPIE PAS : un dossier ajouté à
   `seeds/corpus.ts` entre dans ce cas sans que personne y pense.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * LES HOMONYMES ÉCARTÉS, ET LA RAISON DE CHACUN — AUCUN, AUJOURD’HUI.
 *
 * C’est le risque annoncé par la trace du paquet : un segment d’un seul mot
 * commun n’est pas une aiguille, et « Applications », « Comptes », « Support »
 * ou « Accès » sont aussi du vocabulaire du produit et de la prose française.
 * MESURÉ sur les quatre étapes de V-24, propriétés nues : pas un seul des
 * segments du jeu n’y apparaît autrement que par la fuite corrigée. La table
 * reste donc VIDE, et c’est un résultat, pas un oubli.
 *
 * Le jour où un mot du jeu se retrouve dans de la prose légitime de cet écran,
 * il s’écarte ICI, avec son motif écrit — jamais par un filtre muet, et jamais
 * en renonçant au cas.
 */
const HOMONYMES_ECARTES: ReadonlyMap<string, string> = new Map<string, string>();

/** Les nœuds du jeu que V-24 ne doit nommer sous aucune étape. */
const NOEUDS_DU_JEU: readonly { readonly mot: string; readonly origine: string }[] = (() => {
	const par = new Map<string, string>();
	const poser = (mot: string, origine: string): void => {
		const propre = mot.trim();
		if (propre === '' || HOMONYMES_ECARTES.has(propre)) return;
		if (!par.has(propre)) par.set(propre, origine);
	};
	for (const u of UNIVERS) poser(u.nom, 'UNIVERS.nom');
	for (const d of DOMAINES) poser(d.nom, 'DOMAINES.nom');
	for (const n of CORPUS) {
		for (const segment of n.dossier.split('›')) poser(segment, 'CORPUS.dossier, segment');
	}
	return [...par].map(([mot, origine]) => ({ mot, origine }));
})();

/**
 * UN LOT QUI NE DOIT RIEN AU JEU — et qui a la taille que l’étape 4 demande.
 *
 * L’instant figé de l’étape 4 lit le septième fichier du lot : un lot vide y
 * fait sortir la vue. Huit fichiers, donc, dont un écarté pour que l’étape 3
 * rende aussi sa liste — et pas un chemin qui figure au jeu.
 */
const LOT_NU: LotDImport = {
	source: 'Un partage quelconque',
	fichiers: [
		{ c: 'Recrutement/Entretiens/Grille.docx', f: 'docx', o: 14, s: 'note' },
		{ c: 'Recrutement/Entretiens/Trame.docx', f: 'docx', o: 9, s: 'note' },
		{ c: 'Recrutement/Offres/Poste ouvert.docx', f: 'docx', o: 21, s: 'note' },
		{ c: 'Recrutement/Offres/Diffusion.md', f: 'md', o: 4, s: 'note' },
		{
			c: 'Recrutement/Barème.xlsx',
			f: 'xlsx',
			o: 33,
			s: 'ignore',
			m: 'Un tableur reste un tableur.'
		},
		{ c: 'Formation/Catalogue.pdf', f: 'pdf', o: 240, s: 'note' },
		{ c: 'Formation/Sessions/Planning.txt', f: 'txt', o: 6, s: 'note' },
		{ c: 'Formation/Sessions/Bilan.docx', f: 'docx', o: 18, s: 'note' }
	]
};

/**
 * DES PROPRIÉTÉS NUES — ce qu’une instance neuve sert, et rien du jeu.
 *
 * `SOCLE_V24` passe `DOMAINES` et `LOT_IMPORT` : sous ce socle-là, tout mot du
 * jeu trouvé dans le rendu viendrait des PROPRIÉTÉS, et le cas ne dirait rien
 * de la vue. Ici aucune source du jeu n’entre : ce qui sort du rendu a été
 * écrit dans V-24.
 */
const SOCLE_NU: Proprietes = {
	notes: [],
	domaines: [],
	universOuCreerUnDomaine: [],
	lotImport: LOT_NU,
	formatsImport: LIBELLE_PAR_FORMAT,
	domaineParDefaut: ''
};

describe('V-24 — l’écran d’import ne nomme aucun nœud du jeu de démonstration', () => {
	it('la liste des nœuds est LUE du jeu, et elle n’est pas vide', () => {
		expect(NOEUDS_DU_JEU.length).toBeGreaterThan(10);
		expect(NOEUDS_DU_JEU.map((n) => n.mot)).toContain('Exploitation');
		expect(NOEUDS_DU_JEU.map((n) => n.mot)).toContain('Sauvegardes');
		expect(NOEUDS_DU_JEU.map((n) => n.mot)).toContain('Infrastructure');
	});

	it('n’en écrit aucun, sur aucune des quatre étapes', () => {
		const fuites: string[] = [];
		for (const [rang, vecteur] of VECTEURS.entries()) {
			const rendu = corps('V-24', { ...SOCLE_NU, vecteur });
			for (const { mot, origine } of NOEUDS_DU_JEU) {
				if (rendu.includes(mot)) fuites.push('étape ' + (rang + 1) + ' — ' + mot + ' — ' + origine);
			}
		}
		expect(fuites).toEqual([]);
	});
});

describe('V-35 — le journal dit ce qu’il conserve', () => {
	it('sans journal enregistré, l’écran l’annonce au lieu d’un tableau vide', () => {
		const rendu = corps('V-35', { journalImports: [], journalEnregistre: false });
		expect(rendu).toContain("Aucun lot n'est conservé");
		expect(rendu).not.toContain('restent consultables indéfiniment');
		expect(rendu).not.toContain('Chaque lot conserve son rapport');
	});

	it('journal enregistré, le tableau et les phrases du gel reviennent', () => {
		const rendu = corps('V-35', { journalEnregistre: true });
		expect(rendu).toContain('restent consultables indéfiniment');
		expect(rendu).not.toContain("Aucun lot n'est conservé");
	});

	it('le drapeau absent rend exactement ce que la vue rendait', () => {
		expect(corps('V-35', { journalEnregistre: true })).toBe(corps('V-35'));
	});

	it('offre les trois accès directs, puisque l’import exécute les trois', () => {
		const rendu = corps('V-35');
		expect(rendu).toContain('Dans un domaine existant');
		expect(rendu).toContain('Un domaine complet');
		expect(rendu).toContain('Un corpus préparé');
	});

	it('annonce son vide quand aucun lot n’a eu lieu, et nomme le geste', () => {
		/* DEUX VIDES QUI NE DISENT PAS LA MÊME CHOSE. « Rien n'est conservé » est
		   l'état d'une instance sans table de journal ; « aucun import n'a eu lieu »
		   est celui d'une instance neuve, dont le journal est tenu et vide. Le second
		   nomme le geste qui débloque. */
		const rendu = corps('V-35', { journalImports: [], journalEnregistre: true });
		expect(rendu).toContain("Aucun import n'a encore eu lieu");
		expect(rendu).toContain('Déposez un dossier ci-dessus');
		expect(rendu).not.toContain("Aucun lot n'est conservé");
	});

	it('met en français le motif d’un fichier en échec, au lieu de son code', () => {
		/* LE MOTIF EST UN CODE EN BASE — `$lib/donnees/import.ts` n'écrit que des
		   codes, et il dit pourquoi. La phrase est celle de V-24, PARTAGÉE plutôt que
		   recopiée : l'écran rendait « service-de-conversion-injoignable » sous le nom
		   du fichier. */
		const rendu = corps('V-35', {
			etat: 'rapport-de-lot',
			journalImports: JOURNAL_IMPORTS,
			fichiersDuLot: [{ c: 'Strict/Bureau.docx', s: 'echec', m: 'fichier-vide' }]
		});
		expect(rendu).toContain('Strict/Bureau.docx');
		expect(rendu).toContain(LIBELLE_DU_MOTIF['fichier-vide']);
		expect(rendu).not.toContain('>fichier-vide<');
	});

	it('n’invite plus à déposer une archive', () => {
		const rendu = corps('V-35');
		expect(rendu).toContain('Déposez un dossier');
		expect(rendu).not.toContain('Déposez un dossier ou une archive');
	});
});

describe('journalDImportsEnregistre — le drapeau est LU sur le recensement réel', () => {
	it('rend vrai sur le recensement du dépôt, d’où les deux entrées ont disparu', () => {
		/* Le recensement par défaut, pas un recensement fabriqué : la migration `009`
		   porte les deux tables, les entrées sont parties, et l'écran a basculé PAR
		   CONSTRUCTION — aucune ligne de la vue n'a eu à changer d'avis. */
		expect(journalDImportsEnregistre()).toBe(true);
		expect(MESURES_DE_CONSOLE_SANS_CONTREPARTIE.some((m) => m.donnee === 'JOURNAL_IMPORTS')).toBe(
			false
		);
	});

	it('rend faux dès que l’entrée revient au recensement', () => {
		/* SANS CE CAS, LE PRÉCÉDENT SERAIT SATISFAIT PAR UNE FONCTION QUI REND
		   TOUJOURS VRAI (`P-26`) : le drapeau doit rester DÉRIVÉ. */
		const avecEntree = [
			...MESURES_DE_CONSOLE_SANS_CONTREPARTIE,
			{
				donnee: 'JOURNAL_IMPORTS',
				vue: 'V-35',
				affichage: 'le journal transverse des imports',
				motif: 'cas d’épreuve — le recensement décide, jamais la vue'
			}
		];
		expect(journalDImportsEnregistre(avecEntree)).toBe(false);
	});

	it('ne recense plus la moitié « accueil » de RG-M12-09, que le flux lit', () => {
		/* « Ce journal alimente le flux d'activité de l'accueil ET l'écran
		   d'administration » : `lireLActiviteRecente()` lit `lots_d_import` et rend le
		   genre `import`, que `V-07` dessine depuis toujours. */
		expect(MESURES_DE_CONSOLE_SANS_CONTREPARTIE.filter((m) => m.vue === 'V-07')).toHaveLength(0);
	});
});
