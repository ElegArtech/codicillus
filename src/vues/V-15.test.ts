/**
 * V-15 — L'HISTORIQUE MONTRE *CETTE* NOTE.
 *
 * LE DÉFAUT QUE CE FICHIER FERME. `V-15.svelte` montait le bloc partagé SANS
 * `affichee`, et le bloc retombe alors sur la note de démonstration :
 * `/notes/{identifiant}?version` rendait, POUR N'IMPORTE QUELLE NOTE, le titre
 * « Restaurer une sauvegarde PostgreSQL depuis Barman », son rangement, son
 * auteur, ses 412 consultations, le sommaire de son corps et un cartouche
 * « Vérifié par Karim Belhadj » — le tout sous un fil d'Ariane qui, lui,
 * nommait la vraie note. Les deux liens internes du corps transcrit menaient à
 * `n-diag-barman`, une note qui rend 404 sur une instance réelle.
 *
 * LE CORPS EST RENDU PAR `rendreDocument`, ET PAR RIEN D'AUTRE — ADR-004. Ce
 * fichier n'écrit aucun HTML de corps à la main, ce que l'ADR interdit
 * nommément, « y compris dans un test ».
 *
 * LES DEUX POLARITÉS SONT JOUÉES — P-5. La seconde section garde le DÉFAUT :
 * sans propriété, la transcription figée du gel, à l'identique. Un correctif
 * qui aurait supprimé la transcription au lieu de la reléguer au défaut ferait
 * échouer cette moitié-là.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import { corpusPourVue, noteParIdentifiant, VERSIONS, type Note } from '../../seeds/corpus';
import { documentDuGel, resoudreDansLeCorpus } from '../lib/contenu/documents-du-gel';
import { rendreDocument } from '../lib/contenu/rendu';
import { NOTE, type LectureAffichee } from '../lib/lecture/note-de-demonstration';

const NOTES = corpusPourVue('V-15');

/** L'AUTRE note à corps transcrit du gel — jamais celle de la démonstration. */
const AUTRE_NOTE = (() => {
	const note = noteParIdentifiant('n-mot-de-passe');
	if (!note) throw new Error('seeds/corpus.ts : « n-mot-de-passe » a disparu');
	return note;
})();

/** Le corps rendu par l'implémentation unique — ADR-004, jamais un second chemin. */
function corpsRenduDuGel(note: Note, registre: 'reference' | 'operationnel'): string {
	return rendreDocument(documentDuGel(note.id, registre), {
		resoudre: resoudreDansLeCorpus,
		contexte: 'interne'
	});
}

const REFERENCE_RENDUE = corpsRenduDuGel(AUTRE_NOTE, 'reference');

const AFFICHEE: LectureAffichee = {
	note: AUTRE_NOTE,
	reference: REFERENCE_RENDUE,
	operationnel: null,
	sommaire: [{ niveau: 2, ancre: 's-epreuve', libelle: "Un titre d'épreuve" }],
	controle: {
		par: 'Marc Ferreira',
		quand: { iso: '2026-03-05', jour: '5 mars 2026', heureDite: '5 mars 2026 à 08:12' }
	},
	joursDepuisControle: 4,
	modifiee: { iso: '2026-03-02', jour: '2 mars 2026', heureDite: '2 mars 2026 à 17:40' },
	referenceModifiee: { iso: '2026-03-02', jour: '2 mars 2026', heureDite: '2 mars 2026 à 17:40' },
	resync: false,
	revision: null,
	consultations30j: 7,
	consultationsTotal: 431
};

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-15', { vecteur: null, notes: NOTES, ...proprietes });
}

afterAll(fermerLeHarnais);

describe('V-15 — l’historique sert l’article de la note demandée', () => {
	it('rend le titre, le corps et le cartouche de la note reçue', async () => {
		const html = await rendu({ note: AUTRE_NOTE, affichee: AFFICHEE });
		expect(html).toContain(AUTRE_NOTE.titre);
		expect(REFERENCE_RENDUE.length).toBeGreaterThan(200);
		expect(html).toContain(REFERENCE_RENDUE);
		expect(html).toContain('<strong>Marc Ferreira</strong>');
	});

	/**
	 * LE CŒUR DU DÉFAUT : rien de la note de démonstration ne doit subsister
	 * sous le fil d'Ariane d'une autre note — ni son titre, ni son auteur, ni
	 * son compteur, ni les trois vérificateurs de la planche.
	 */
	it('ne laisse rien de la note de démonstration', async () => {
		const html = await rendu({ note: AUTRE_NOTE, affichee: AFFICHEE });
		expect(html).not.toContain(NOTE.titre);
		expect(html).not.toContain(`${NOTE.vues} consultations`);
		/* LE CARTOUCHE, ET NON LA PAGE : « Karim Belhadj » est aussi le compte
		   courant du jeu, dont le nom coiffe le menu utilisateur de la barre.
		   C'est l'attribution du contrôle qui ne doit plus venir de la planche. */
		expect(html).not.toContain('par <strong>Karim Belhadj</strong>');
		/* Le sommaire suit le corps affiché, et non les onze titres du gel. */
		expect(html).toContain("Un titre d'épreuve");
		expect(html).not.toContain('s-prerequis');
	});

	/**
	 * LE LIEN INTERNE DU CORPS TRANSCRIT — `n-diag-barman`. Il ne se rend que
	 * faute de note affichée ; servi sur une instance réelle, il menait à une
	 * note qui n'existe pas.
	 */
	it('ne rend aucun lien vers la note du corps transcrit', async () => {
		const html = await rendu({ note: AUTRE_NOTE, affichee: AFFICHEE });
		expect(html).not.toContain('n-diag-barman');
	});

	it('rend le cumul de consultations servi, et non celui du corpus', async () => {
		const html = await rendu({ note: AUTRE_NOTE, affichee: AFFICHEE });
		expect(html).toContain('431 consultations · 7 sur les 30 derniers jours');
	});
});

/**
 * L’ÉTAT CONSULTÉ N’EST PAS TOUJOURS LA NOTE COURANTE — `?version={n}`.
 *
 * LE DÉFAUT QUE CES CAS FERMENT. Le bandeau annonçait « Version N … vous
 * consultez un état antérieur » au-dessus du titre, du corps et du sommaire les
 * PLUS RÉCENTS : `lireLHistoire()` capturait pourtant le titre et les deux corps
 * de la version demandée, les servait au navigateur, et aucun nœud ne les
 * lisait. « Restaurer cette version » écrasait donc la note avec un contenu que
 * l’écran n’avait jamais montré — ce que `RG-M18-05` refuse.
 *
 * CE QUE CES CAS NE PROUVENT PAS. Ils éprouvent le RENDU à partir d’un état
 * construit ici ; ils ne prouvent rien de ce que le chargeur tire de la table
 * `versions`, ni de l’appariement d’un numéro d’adresse à une ligne. Cela se
 * mesure sur une base réelle, dans un navigateur, et le relevé du lot le porte.
 */
describe('V-15 — l’article suit l’état consulté, pas la note courante', () => {
	/** Le titre que la version a CAPTURÉ — la note a été renommée depuis (`RG-M07-02`). */
	const TITRE_CAPTURE = 'Un titre que la note ne porte plus';

	/** L’historique, dans la forme que le corpus donne — jamais une forme réécrite ici. */
	const HISTORIQUE = (() => {
		const lignes = VERSIONS['n-restaurer-pg'];
		if (lignes === undefined || lignes.length < 2)
			throw new Error('seeds/corpus.ts : « n-restaurer-pg » n’a plus deux versions');
		return lignes;
	})();

	/** La plus ancienne des deux : consultée, elle N’EST PAS la version courante. */
	const ANTERIEURE = HISTORIQUE[HISTORIQUE.length - 1] as (typeof HISTORIQUE)[number];

	const AFFICHEE_ANTERIEURE: LectureAffichee = {
		...AFFICHEE,
		note: { ...AUTRE_NOTE, titre: TITRE_CAPTURE }
	};

	function renduAnterieur(): Promise<string> {
		return rendu({
			note: AUTRE_NOTE,
			affichee: AFFICHEE_ANTERIEURE,
			versions: { [AUTRE_NOTE.id]: HISTORIQUE },
			versionAffichee: ANTERIEURE.n
		});
	}

	it('rend le bandeau d’état antérieur au-dessus du titre capturé', async () => {
		const html = await renduAnterieur();
		expect(html).toContain(`Version ${ANTERIEURE.n} du ${ANTERIEURE.date}`);
		expect(html).toContain(`<h1 class="titre-note" id="h-titre">${TITRE_CAPTURE}</h1>`);
	});

	/** Le fil se ferme sur le titre de l’ARTICLE qu’il coiffe, comme partout ailleurs. */
	it('ferme le fil d’Ariane sur le titre capturé', async () => {
		const html = await renduAnterieur();
		expect(html).toContain(`<span class="fil__courant">${TITRE_CAPTURE}</span>`);
	});

	/** LE PANNEAU NOMME LA NOTE, ET NON L’ÉTAT : c’est son historique qui est ouvert. */
	it('garde le titre de la note en tête du panneau d’historique', async () => {
		const html = await renduAnterieur();
		expect(html).toContain(`id="tiroir-note">${AUTRE_NOTE.titre}</div>`);
	});

	/**
	 * P-5 — LA POLARITÉ. Sans version antérieure consultée, le titre de l’article
	 * est celui de la note : un rendu qui prendrait toujours le titre capturé
	 * passerait pour juste.
	 */
	it('rend le titre de la note quand aucune version antérieure n’est consultée', async () => {
		const html = await rendu({ note: AUTRE_NOTE, affichee: AFFICHEE });
		expect(html).toContain(`<h1 class="titre-note" id="h-titre">${AUTRE_NOTE.titre}</h1>`);
		expect(html).not.toContain(TITRE_CAPTURE);
	});
});

describe('V-15 — la propriété absente rend la transcription figée du gel', () => {
	it('rend la note de démonstration et son corps transcrit', async () => {
		const html = await rendu({});
		expect(html).toContain(NOTE.titre);
		expect(html).toContain('id="s-restaurer"');
		expect(html).not.toContain(REFERENCE_RENDUE);
	});
});
