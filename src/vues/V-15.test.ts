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
import { corpusPourVue, noteParIdentifiant, type Note } from '../../seeds/corpus';
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

describe('V-15 — la propriété absente rend la transcription figée du gel', () => {
	it('rend la note de démonstration et son corps transcrit', async () => {
		const html = await rendu({});
		expect(html).toContain(NOTE.titre);
		expect(html).toContain('id="s-restaurer"');
		expect(html).not.toContain(REFERENCE_RENDUE);
	});
});
