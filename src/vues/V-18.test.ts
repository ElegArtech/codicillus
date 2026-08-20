/**
 * V-18 — LE CONTEXTE ET LA NOTE ÉDITÉE (T-042).
 *
 * L'ÉDITEUR EST RENDU CAPABLE, AUCUNE SAISIE N'EST ÉCRITE : la zone de
 * rédaction reçoit le corps rendu, elle ne le modifie pas — l'édition est un
 * comportement (ARB-011).
 *
 * TROIS PLACES POUR LA MÊME NOTE, et le gel en veut trois : le nom du registre
 * édité, le panneau de rappel de la Référence, et la zone de rédaction qui
 * porte l'Opérationnel. La propriété les alimente toutes les trois, ou aucune.
 *
 * LE CORPS EST RENDU PAR `rendreDocument`, ET PAR RIEN D'AUTRE — ADR-004
 * interdit tout second convertisseur, « y compris une transformation ad hoc
 * dans un test ».
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import {
	corpusPourVue,
	INSTANCE,
	MOI,
	noteParIdentifiant,
	UNIVERS,
	type EtatDInstance,
	type Note,
	type UtilisateurCourant
} from '../../seeds/corpus';
import { documentDuGel, resoudreDansLeCorpus } from '../lib/contenu/documents-du-gel';
import { rendreDocument } from '../lib/contenu/rendu';
import { NOTE } from '../lib/lecture/note-de-demonstration';

const NOTES = corpusPourVue('V-18');

const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9-epreuve', synchro: "à l'instant" };

const AUTRE_NOTE = (() => {
	const note = noteParIdentifiant('n-mot-de-passe');
	if (!note) throw new Error('seeds/corpus.ts : « n-mot-de-passe » a disparu');
	return note;
})();

function corpsRenduDuGel(note: Note, registre: 'reference' | 'operationnel'): string {
	return rendreDocument(documentDuGel(note.id, registre), {
		resoudre: resoudreDansLeCorpus,
		contexte: 'interne'
	});
}

const AFFICHEE = {
	note: AUTRE_NOTE,
	reference: corpsRenduDuGel(AUTRE_NOTE, 'reference'),
	operationnel: corpsRenduDuGel(AUTRE_NOTE, 'operationnel')
};

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-18', { vecteur: null, notes: NOTES, ...proprietes });
}

/** Le nombre d'occurrences d'un fragment — l'Opérationnel est rendu DEUX fois. */
function occurrences(html: string, fragment: string): number {
	return html.split(fragment).length - 1;
}

afterAll(fermerLeHarnais);

describe('V-18 — la propriété fournie l’emporte', () => {
	it('sert le compte reçu, et non celui du jeu de semence', async () => {
		const html = await rendu({ compte: SOPHIE });
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('sert la version d’instance reçue', async () => {
		expect(await rendu({ instance: AUTRE_INSTANCE })).toContain('9.9.9-epreuve');
	});

	/** Vue de forme ABRÉGÉE : `univers` ne sert pas au rail (`Coquille.svelte`). */
	it('accepte la liste d’univers reçue sans rien changer au rail abrégé', async () => {
		const restreint = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Projets') });
		expect(restreint).toEqual(await rendu({}));
	});

	it('nomme la note éditée et son rangement, jamais celle du gel', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(html).toContain(`id="nom-note">${AUTRE_NOTE.titre}</div>`);
		expect(html).not.toContain(NOTE.titre);
		expect(html).toContain(
			[AUTRE_NOTE.univers, AUTRE_NOTE.domaine, AUTRE_NOTE.dossier].join(' › ')
		);
		expect(html).toContain(AUTRE_NOTE.visibilite);
	});

	it('rend les deux corps de la note éditée — et l’Opérationnel deux fois', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(AFFICHEE.reference.length).toBeGreaterThan(200);
		expect(html).toContain(AFFICHEE.reference);
		/* Source masquée du panneau ET zone de rédaction : le gel le rend deux
		   fois (`V-18:3281`), et la propriété ne change pas ce compte. */
		expect(occurrences(html, AFFICHEE.operationnel)).toBe(2);
	});
});

describe('V-18 — la propriété absente rend la transcription figée du gel', () => {
	it('rend la note de démonstration et le contexte du jeu de semence', async () => {
		const html = await rendu({});
		expect(html).toContain(`id="nom-note">${NOTE.titre}</div>`);
		expect(html).toContain(`${MOI.nom} — menu utilisateur`);
		expect(html).toContain(INSTANCE.version);
	});

	it('rend les corps transcrits, l’Opérationnel deux fois, et non un document', async () => {
		const html = await rendu({});
		expect(html).toContain('id="s-restaurer"');
		expect(occurrences(html, 'id="o-preparer"')).toBe(2);
		expect(html).not.toContain(AFFICHEE.reference);
	});
});
