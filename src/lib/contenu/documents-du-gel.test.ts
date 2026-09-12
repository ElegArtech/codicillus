import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOMMAIRE_REFERENCE } from '../lecture/note-de-demonstration';
import { ancresDuDocument } from './rendu';
import { texteBrut, titres, liensInternes } from './document';
import {
	CIBLES_SANS_NOTE,
	DOCUMENTS_DU_GEL,
	documentDuGel,
	idParTitre,
	resoudreDansLeCorpus
} from './documents-du-gel';

function texteDuDocument(texte: string): string {
	return texte.replace(/\s+/g, ' ').trim();
}

const EXEMPLES = [
	{
		fichier: 'seeds/fixtures/restauration-reference.txt',
		note: 'n-restaurer-pg',
		registre: 'reference' as const
	},
	{
		fichier: 'seeds/fixtures/restauration-operationnel.txt',
		note: 'n-restaurer-pg',
		registre: 'operationnel' as const
	},
	{
		fichier: 'seeds/fixtures/connexion-reference.txt',
		note: 'n-mot-de-passe',
		registre: 'reference' as const
	},
	{
		fichier: 'seeds/fixtures/connexion-operationnel.txt',
		note: 'n-mot-de-passe',
		registre: 'operationnel' as const
	}
];

describe('les contenus de démonstration', () => {
	it('sont quatre, chacun rattaché à son texte attendu', () => {
		expect(DOCUMENTS_DU_GEL).toHaveLength(4);
		for (const d of DOCUMENTS_DU_GEL) expect(d.source).toMatch(/^seeds\/fixtures\/.+\.txt$/);
	});

	for (const m of EXEMPLES) {
		it(`${m.note} / ${m.registre} rend le texte de ${m.fichier}`, () => {
			const attendu = readFileSync(m.fichier, 'utf8').trim();
			const obtenu = texteDuDocument(texteBrut(documentDuGel(m.note, m.registre)));
			expect(obtenu).toBe(attendu);
		});
	}

	it('garde les espaces insécables des exemples — trois, dans l’opérationnel de V-03', () => {
		const texte = texteBrut(documentDuGel('n-mot-de-passe', 'operationnel'));
		expect(texte.match(/\u00a0\?/g)).toHaveLength(3);
		expect(texte.match(/\?/g)).toHaveLength(3);
	});
});

describe('le sommaire se déduit du contenu', () => {
	it('redonne les quatorze entrées de note-de-demonstration.ts, dans l’ordre', () => {
		const releve = [...ancresDuDocument(documentDuGel('n-restaurer-pg', 'reference'))].map(
			([t, ancre]) => ({
				niveau: t.attrs.level,
				ancre,
				libelle: (t.content ?? []).map((x) => x.text).join('')
			})
		);
		expect(releve).toEqual(SOMMAIRE_REFERENCE.map((e) => ({ ...e })));
	});

	it('porte les six niveaux de titre des exemples — 2 à 6, jamais 1', () => {
		const niveaux = new Set(
			titres(documentDuGel('n-restaurer-pg', 'reference')).map((t) => t.attrs.level)
		);
		expect([...niveaux].sort()).toEqual([2, 3, 4, 5, 6]);
	});
});

describe('les liens internes des exemples', () => {
	it('portent des identifiants du corpus quand la note existe', () => {
		const cites = liensInternes(documentDuGel('n-restaurer-pg', 'reference'));
		expect(cites).toContain(idParTitre('Diagnostiquer un échec de restauration Barman'));
		for (const id of cites) {
			if (CIBLES_SANS_NOTE.includes(id)) continue;
			expect(resoudreDansLeCorpus(id), `cible ${id}`).not.toBeNull();
		}
	});

	it('comptent deux cibles que le corpus ne porte pas, et pas une de plus', () => {
		const toutes = DOCUMENTS_DU_GEL.flatMap((d) => liensInternes(d.document));
		const orphelines = [...new Set(toutes)].filter((id) => resoudreDansLeCorpus(id) === null);
		expect(orphelines.sort()).toEqual([...CIBLES_SANS_NOTE].sort());
	});

	it('n’invente aucun identifiant : idParTitre lève sur un titre absent', () => {
		expect(() => idParTitre('Reconstruire le dépôt Barman')).toThrow(/aucune note intitulée/);
	});
});
