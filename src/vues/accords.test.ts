/**
 * LES ACCORDS QUI RESTAIENT — ET L'APOSTROPHE DES DEUX JUMEAUX.
 *
 * CE QUE CE FICHIER FERME. Quatre nœuds servaient une phrase fausse dès qu'un
 * compte valait un, et un cinquième servait la même phrase sous deux apostrophes
 * différentes selon qu'elle venait de la vue ou du serveur :
 *
 *   `V-34`  « 1 contributeurs actifs », « 1 notes au total », et un
 *           « consultations sur 7 jours » figé au pluriel ;
 *   `V-15`  « il y a 1 an(s) » ;
 *   `V-33` / `donnees/administration.ts` — `En l'état` d'un côté, `En l’état`
 *           de l'autre : le MÊME nœud, `#erreur-vieil-txt`, changeait de
 *           caractère entre l'aperçu immédiat et le retour d'« Enregistrer ».
 *
 * LE CAS DE V-10 EST PARTI AVEC SON NŒUD : la refonte de la page d'un univers ne
 * compte plus les brouillons, et `src/vues/V-10.test.ts` éprouve les accords de
 * l'écran qui l'a remplacée.
 *
 * C'EST LA VALEUR 1 QUI PORTAIT LA FAUTE, et chaque cas la joue — avec 0 et 2
 * de part et d'autre, sans quoi un `+s` inconditionnel resterait vert d'un
 * côté et un singulier inconditionnel de l'autre.
 *
 * LA MESURE PORTE SUR CE QUE LE HTML SERVI DONNE À LIRE D'UN TRAIT, et c'est
 * l'arbitrage de fond : les trois lignes d'adoption de `V-34` sont un grand
 * chiffre et deux légendes VOISINES, qui se lisent « 1 note au total · 1
 * ouverte au public · 1 contributeur actif ». Elles portent donc un nombre
 * grammatical. `texteDe()` retire le balisage plutôt que de figer une classe :
 * un cas qui citerait le balisage mesurerait la feuille de style.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import {
	CONFIG,
	corpusPourVue,
	type Configuration,
	type Note,
	type RequeteDeRecherche,
	type Version
} from '../../seeds/corpus';
import { messageSeuilNonCroissant } from '../lib/donnees/administration';
import type { LectureAffichee } from '../lib/lecture/note-de-demonstration';

afterAll(fermerLeHarnais);

/** Le texte rendu, balisage retiré — ce que l'œil lit, et rien d'autre. */
function texteDe(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/* ── V-34 — les trois lignes d'adoption ──────────────────────────────────── */

/** Deux notes du jeu, réécrites : seuls l'auteur et la visibilité comptent ici. */
const [PREMIERE, SECONDE] = corpusPourVue('V-34');
if (PREMIERE === undefined || SECONDE === undefined)
	throw new Error('seeds/corpus.ts : « V-34 » ne sert plus deux notes');

const UNE: Note = { ...PREMIERE, auteur: 'Sophie Nguyen', visibilite: 'Interne' };
const AUTRE: Note = { ...SECONDE, auteur: 'Marc Ferreira', visibilite: 'Interne' };

function rendu34(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-34', {
		vecteur: null,
		notes: [],
		domaines: [],
		relations: [],
		mesures7j: {},
		mesures7jPrec: {},
		...proprietes
	});
}

/** Le seul bloc mesuré : la ligne d'adoption, jusqu'au classement qui la suit. */
async function adoption(proprietes: Record<string, unknown>): Promise<string> {
	const html = await rendu34(proprietes);
	const bloc = /<div class="adoption" id="adoption"[^>]*>([\s\S]*?)<span class="etiq"/.exec(html);
	if (bloc?.[1] === undefined) throw new Error('V-34 : le bloc d’adoption ne se rend plus');
	return texteDe(bloc[1]);
}

describe('V-34 — les lignes d’adoption s’accordent, parce qu’elles sont des phrases', () => {
	it('accorde « consultation sur 7 jours » sur la somme mesurée', async () => {
		expect(await adoption({ notes: [UNE] })).toContain('0 consultation sur 7 jours');
		expect(await adoption({ notes: [UNE], mesures7j: { [UNE.id]: 1 } })).toContain(
			'1 consultation sur 7 jours'
		);
		expect(await adoption({ notes: [UNE], mesures7j: { [UNE.id]: 2 } })).toContain(
			'2 consultations sur 7 jours'
		);
	});

	it('accorde « note au total » — l’instance à une note ne lit plus « 1 notes »', async () => {
		expect(await adoption({ notes: [] })).toContain('0 note au total');
		expect(await adoption({ notes: [UNE] })).toContain('1 note au total');
		expect(await adoption({ notes: [UNE, AUTRE] })).toContain('2 notes au total');
	});

	/** La sous-ligne portait déjà son accord : elle reste mesurée, pas supposée. */
	it('accorde « ouverte au public » avec la ligne qu’elle sous-titre', async () => {
		expect(await adoption({ notes: [UNE] })).toContain('0 ouverte au public');
		expect(await adoption({ notes: [{ ...UNE, visibilite: 'Publique' }] })).toContain(
			'1 ouverte au public'
		);
		expect(
			await adoption({
				notes: [
					{ ...UNE, visibilite: 'Publique' },
					{ ...AUTRE, visibilite: 'Publique' }
				]
			})
		).toContain('2 ouvertes au public');
	});

	/**
	 * L'ACCORD EN CASCADE — le nom, l'adjectif ET le possessif de la sous-ligne.
	 * « 1 contributeurs actifs … à leur nom » était faux trois fois ; un `+s`
	 * posé sur le seul nom l'aurait laissé faux deux fois.
	 */
	it('accorde « contributeur actif » et le possessif de sa sous-ligne', async () => {
		const aucun = await adoption({ notes: [] });
		expect(aucun).toContain('0 contributeur actif');
		expect(aucun).toContain('au moins une note à son nom');

		const seul = await adoption({ notes: [UNE, { ...AUTRE, auteur: 'Sophie Nguyen' }] });
		expect(seul).toContain('1 contributeur actif');
		expect(seul).toContain('au moins une note à son nom');

		const deux = await adoption({ notes: [UNE, AUTRE] });
		expect(deux).toContain('2 contributeurs actifs');
		expect(deux).toContain('au moins une note à leur nom');
	});

	/**
	 * LA LIGNE DES RECHERCHES NE SE REND QUE SOUS UN JOURNAL, et elle est écrite
	 * pour le jour où il existera : son pluriel était figé comme les trois
	 * autres. Le journal se sert ici, la ligne revient, et elle s'accorde.
	 */
	it('accorde « recherche sur 30 jours » dès qu’un journal la porte', async () => {
		const journal = (n: number): readonly RequeteDeRecherche[] => [
			{ terme: 'sauvegarde', n, resultats: 3, ouvertures: n, evolution: 0 }
		];
		expect(await adoption({ notes: [UNE], recherches: journal(0) })).toContain(
			'0 recherche sur 30 jours'
		);
		expect(await adoption({ notes: [UNE], recherches: journal(1) })).toContain(
			'1 recherche sur 30 jours'
		);
		expect(await adoption({ notes: [UNE], recherches: journal(2) })).toContain(
			'2 recherches sur 30 jours'
		);
	});
});

/* ── V-15 — l'ancienneté d'une version ───────────────────────────────────── */

describe('V-15 — l’ancienneté d’une version ne porte plus de parenthèse', () => {
	const NOTE_15: Note = (() => {
		const premiere = corpusPourVue('V-15')[0];
		if (premiere === undefined) throw new Error('seeds/corpus.ts : « V-15 » ne sert plus de note');
		return premiere;
	})();

	const AFFICHEE: LectureAffichee = {
		note: NOTE_15,
		reference: '',
		operationnel: null,
		sommaire: [],
		controle: null,
		joursDepuisControle: 4,
		modifiee: { iso: '2026-03-02', jour: '2 mars 2026', heureDite: '2 mars 2026 à 17:40' },
		referenceModifiee: {
			iso: '2026-03-02',
			jour: '2 mars 2026',
			heureDite: '2 mars 2026 à 17:40'
		},
		resync: false,
		revision: null,
		consultations30j: 0,
		consultationsTotal: 0
	};

	const version = (jours: number): Version => ({
		n: 1,
		jours,
		date: '2 mars 2026',
		heure: '17:40',
		auteur: 'Sophie Nguyen',
		ajout: 4,
		retrait: 1,
		resume: 'Une révision d’épreuve'
	});

	function rendu15(jours: number): Promise<string> {
		return rendreLaVue('V-15', {
			vecteur: null,
			notes: corpusPourVue('V-15'),
			note: NOTE_15,
			affichee: AFFICHEE,
			versions: { [NOTE_15.id]: [version(jours)] },
			retentionVersions: 50,
			versionAffichee: null,
			onComparer: () => undefined
		});
	}

	/**
	 * ZÉRO AN N'EST PAS ATTEIGNABLE PAR CETTE BRANCHE — en deçà de douze mois,
	 * la ligne compte en mois, et c'est ce que le premier cas fixe. La faute
	 * vivait à un an, et l'écart de maquette (`mockups/V-15:2764`) est assumé.
	 */
	it('compte en mois sous l’année, puis accorde « an » à un et à deux', async () => {
		const mois = texteDe(await rendu15(200));
		expect(mois).toContain('il y a 7 mois');
		expect(mois).not.toMatch(/il y a \d+ ans?\b/);

		expect(texteDe(await rendu15(365))).toContain('il y a 1 an');
		expect(texteDe(await rendu15(730))).toContain('il y a 2 ans');
	});

	it('ne sert plus la parenthèse du repli', async () => {
		expect(await rendu15(365)).not.toContain('an(s)');
	});
});

/* ── Le message de seuil — deux sites, une seule phrase ──────────────────── */

describe('le message de seuil est le MÊME des deux côtés, à l’octet', () => {
	/** La position « actuel » de la planche dérive de `config` : elle suffit. */
	const configuration = (frais: number, vieillissant: number): Configuration => ({
		...CONFIG,
		seuilFrais: frais,
		seuilVieillissant: vieillissant
	});

	function rendu33(frais: number, vieillissant: number): Promise<string> {
		return rendreLaVue('V-33', {
			vecteur: null,
			notes: corpusPourVue('V-33'),
			config: configuration(frais, vieillissant)
		});
	}

	/**
	 * LE CAS NE RECOPIE AUCUNE PHRASE : il compare le rendu de la vue à ce que
	 * le module serveur PRODUIT. Une divergence d'un seul caractère — c'était
	 * l'apostrophe droite contre l'apostrophe typographique — le fait rougir, ce qu'un
	 * cas écrivant la phrase à la main n'aurait jamais vu.
	 */
	it('la vue rend exactement ce que le serveur compose, à zéro, à un et à deux', async () => {
		expect(await rendu33(0, 0)).toContain(messageSeuilNonCroissant(0));
		expect(await rendu33(1, 1)).toContain(messageSeuilNonCroissant(1));
		expect(await rendu33(2, 1)).toContain(messageSeuilNonCroissant(2));
	});

	it('accorde « jour » — et le seuil à un ne lit plus « 1 jours »', () => {
		expect(messageSeuilNonCroissant(0)).toContain('(0 jour)');
		expect(messageSeuilNonCroissant(1)).toContain('(1 jour)');
		expect(messageSeuilNonCroissant(2)).toContain('(2 jours)');
	});

	/** L'apostrophe typographique, des deux côtés — et plus jamais la droite. */
	it('porte l’apostrophe typographique, et elle seule', async () => {
		expect(messageSeuilNonCroissant(30)).toContain('En l’état');
		const html = await rendu33(90, 45);
		expect(html).toContain('En l’état');
		expect(html).not.toContain("En l'état");
	});
});
