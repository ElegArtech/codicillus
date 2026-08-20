/**
 * V-14 — LE CONTEXTE, ET SURTOUT LA NOTE LUE (T-042).
 *
 * LE DÉFAUT QUE CE FICHIER FERME EST LE PLUS VISIBLE DU PRODUIT :
 * `/notes/{identifiant}` servait l'article de `n-restaurer-pg` POUR LES 32
 * NOTES. Le chargeur rendait pourtant déjà la note réelle et son corps —
 * `src/lib/donnees/note.ts` —, mais la vue ne déclarait aucune propriété pour
 * les recevoir (écart déclaré au rapport de `T-033`).
 *
 * LE CORPS EST RENDU PAR `rendreDocument`, ET PAR RIEN D'AUTRE. Ce contrôle
 * emprunte l'implémentation unique d'ADR-004 pour construire la propriété : il
 * n'écrit aucun HTML de corps à la main, ce qui serait le second convertisseur
 * que l'ADR interdit nommément — y compris « dans un test ».
 *
 * LA SECONDE MOITIÉ EST LA PLUS IMPORTANTE. Un défaut de DÉFAUT ferait bouger
 * les 44 couples du banc ; les cas de la seconde section sont la polarité que
 * P-5 réclame.
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

const NOTES = corpusPourVue('V-14');

const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9-epreuve', synchro: "à l'instant" };

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

const AFFICHEE = {
	note: AUTRE_NOTE,
	reference: corpsRenduDuGel(AUTRE_NOTE, 'reference'),
	operationnel: corpsRenduDuGel(AUTRE_NOTE, 'operationnel')
};

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-14', { vecteur: null, notes: NOTES, ...proprietes });
}

afterAll(fermerLeHarnais);

describe('V-14 — la propriété fournie l’emporte', () => {
	it('sert le compte reçu, et non celui du jeu de semence', async () => {
		const html = await rendu({ compte: SOPHIE });
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('sert la version d’instance reçue', async () => {
		expect(await rendu({ instance: AUTRE_INSTANCE })).toContain('9.9.9-epreuve');
	});

	/**
	 * V-14 est la SEULE vue de forme COMPLÈTE de ce lot : son rail se dérive du
	 * corpus, `univers` et `domaines` y ont donc un effet observable — ce qui
	 * n'est pas le cas des quatre vues abrégées (`Coquille.svelte` le dit).
	 */
	it('dérive son rail des univers et domaines reçus', async () => {
		const defaut = await rendu({});
		expect(defaut).toContain('<div class="rail__titre etiq">Production</div>');
		expect(defaut).toContain('<div class="rail__titre etiq">Projets</div>');

		const html = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Production') });
		expect(html).toContain('<div class="rail__titre etiq">Production</div>');
		expect(html).not.toContain('<div class="rail__titre etiq">Projets</div>');
	});

	it('rend la note reçue — titre, rangement et pièces jointes', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(html).toContain(AUTRE_NOTE.titre);
		expect(html).not.toContain(NOTE.titre);
		expect(html).toContain(`<a href="#">${AUTRE_NOTE.domaine}</a>`);
	});

	it('rend le corps de la note reçue, rendu par l’implémentation unique', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(AFFICHEE.reference.length).toBeGreaterThan(200);
		expect(html).toContain(AFFICHEE.reference);
		expect(html).toContain(AFFICHEE.operationnel);
	});

	it('n’invente aucun corps quand le registre n’existe pas', async () => {
		const html = await rendu({
			affichee: { note: AUTRE_NOTE, reference: AFFICHEE.reference, operationnel: null }
		});
		/* L'enveloppe du gel reste — le nœud ne disparaît pas —, et elle ne
		   porte AUCUN contenu : ni la transcription du gel, ni un corps inventé.
		   Les marques de rendu de Svelte sont retirées avant de mesurer, elles
		   ne portent aucun texte. */
		const enveloppe = html.slice(html.indexOf('id="corps-operationnel"'));
		const contenu = enveloppe.slice(0, enveloppe.indexOf('</div>')).replaceAll(/<!--.*?-->/gu, '');
		expect(contenu).toBe('id="corps-operationnel" hidden="">');
		expect(html).not.toContain('id="o-preparer"');
	});
});

describe('V-14 — la propriété absente rend la transcription figée du gel', () => {
	it('rend la note de démonstration, son rangement et son contexte', async () => {
		const html = await rendu({});
		expect(html).toContain(NOTE.titre);
		expect(html).toContain('<a href="#">Infrastructure</a>');
		expect(html).toContain(`${MOI.nom} — menu utilisateur`);
		expect(html).toContain(INSTANCE.version);
	});

	/**
	 * LE CŒUR DE LA GARANTIE DE BANC : sans la propriété, les deux corps sont
	 * la transcription figée, et non un document rendu. Les titres du registre
	 * Opérationnel du gel sont le témoin — ils n'existent nulle part ailleurs
	 * que dans cette transcription.
	 */
	it('rend les deux corps transcrits, et non un document', async () => {
		const html = await rendu({});
		expect(html).toContain('id="s-restaurer"');
		expect(html).toContain('id="o-preparer"');
		expect(html).not.toContain(AFFICHEE.reference);
	});
});
