/**
 * LA TRANSCRIPTION EST-ELLE FIDÈLE ? — la preuve est mécanique.
 *
 * Une transcription à la main se relit mal : l'œil recompose ce qu'il attend.
 * Ces cas confrontent donc les quatre documents au TEXTE DE LA MAQUETTE
 * elle-même, extrait du fichier gelé à chaque exécution. Un mot changé, une
 * apostrophe typographique glissée à la place d'une droite, un fragment oublié :
 * le cas rougit.
 *
 * Le gel est immuable et contrôlé par `pnpm verif:gel` : le lire est le seul
 * moyen d'attester une transcription sans redire à la main ce qu'elle dit déjà.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOMMAIRE_REFERENCE } from '../lecture/note-de-demonstration';
import { texteBrut, titres, liensInternes } from './document';
import {
	CIBLES_SANS_NOTE,
	DOCUMENTS_DU_GEL,
	documentDuGel,
	idParTitre,
	resoudreDansLeCorpus
} from './documents-du-gel';

/** Le contenu d'un `<div>` identifié, borné par comptage d'imbrication. */
function corpsDeLaMaquette(fichier: string, identifiant: string): string {
	const source = readFileSync(fichier, 'utf-8');
	const debut = source.indexOf(`id="${identifiant}"`);
	expect(debut, `${identifiant} introuvable dans ${fichier}`).toBeGreaterThan(0);
	let i = source.indexOf('>', debut) + 1;
	let profondeur = 1;
	const departContenu = i;
	while (profondeur > 0 && i < source.length) {
		const ouvre = source.indexOf('<div', i);
		const ferme = source.indexOf('</div>', i);
		if (ferme === -1) break;
		if (ouvre !== -1 && ouvre < ferme) {
			profondeur += 1;
			i = ouvre + 4;
		} else {
			profondeur -= 1;
			i = ferme + 6;
			if (profondeur === 0) return source.slice(departContenu, ferme);
		}
	}
	throw new Error(`div « ${identifiant} » non refermé`);
}

/**
 * Le texte que la maquette donne à lire.
 *
 * Deux retraits, et ils sont motivés : les FIGURES, dont le document ne porte
 * pas la source (voir l'en-tête de `documents-du-gel.ts`), et la TÊTE d'un bloc
 * de code — le nom du langage et le bouton « Copier » sont du rendu, jamais du
 * contenu. Les balises en ligne disparaissent sans laisser d'espace ; les
 * autres en laissent un, parce qu'elles séparent deux blocs de lecture.
 */
const BALISES_EN_LIGNE = /<\/?(?:a|b|i|u|s|em|strong|mark|code|span|sup|sub|time|small)\b[^>]*>/g;

function texteDeLaMaquette(html: string): string {
	return html
		.replace(/<figure[\s\S]*?<\/figure>/g, ' ')
		.replace(/<div class="bloc-code__tete">[\s\S]*?<\/div>/g, ' ')
		.replace(BALISES_EN_LIGNE, '')
		.replace(/<[^>]+>/g, ' ')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&nbsp;', ' ')
		.replaceAll('&amp;', '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function texteDuDocument(texte: string): string {
	return texte.replace(/\s+/g, ' ').trim();
}

const MAQUETTES = [
	{
		fichier: 'mockups/V-14-lecture-note.html',
		note: 'n-restaurer-pg',
		registre: 'reference' as const,
		identifiant: 'corps-reference'
	},
	{
		fichier: 'mockups/V-14-lecture-note.html',
		note: 'n-restaurer-pg',
		registre: 'operationnel' as const,
		identifiant: 'corps-operationnel'
	},
	{
		fichier: 'mockups/V-03-lecture-publique.html',
		note: 'n-mot-de-passe',
		registre: 'reference' as const,
		identifiant: 'corps-reference'
	},
	{
		fichier: 'mockups/V-03-lecture-publique.html',
		note: 'n-mot-de-passe',
		registre: 'operationnel' as const,
		identifiant: 'corps-operationnel'
	}
];

describe('les corps transcrits du gel', () => {
	it('sont quatre, chacun rattaché à sa maquette et à ses lignes', () => {
		expect(DOCUMENTS_DU_GEL).toHaveLength(4);
		for (const d of DOCUMENTS_DU_GEL) expect(d.source).toMatch(/^mockups\/V-\d\d.*:\d+-\d+$/);
	});

	for (const m of MAQUETTES) {
		it(`${m.note} / ${m.registre} rend le texte de ${m.fichier}`, () => {
			const attendu = texteDeLaMaquette(corpsDeLaMaquette(m.fichier, m.identifiant));
			const obtenu = texteDuDocument(texteBrut(documentDuGel(m.note, m.registre)));
			expect(obtenu).toBe(attendu);
		});
	}

	it('garde les espaces insécables du gel — trois, dans l’opérationnel de V-03', () => {
		/* `V-03:1091-1093` — « Session ouverte&nbsp;? ». L’insécable est une décision
		   typographique du gel, et le contrôle de fidélité ci-dessus ne peut pas la
		   voir : il normalise les blancs, et la classe des blancs comprend
		   l’insécable. Sans ce cas, la règle serait espérée, pas posée (P-5). */
		const texte = texteBrut(documentDuGel('n-mot-de-passe', 'operationnel'));
		expect(texte.match(/\u00a0\?/g)).toHaveLength(3);
		expect(texte.match(/\?/g)).toHaveLength(3);
	});
});

describe('le sommaire du gel se déduit du document transcrit', () => {
	it('redonne les onze entrées de note-de-demonstration.ts, dans l’ordre', () => {
		const releve = titres(documentDuGel('n-restaurer-pg', 'reference'))
			.filter((t) => (t.attrs.level === 2 || t.attrs.level === 3) && t.attrs.ancre !== null)
			.map((t) => ({
				niveau: t.attrs.level,
				ancre: t.attrs.ancre,
				libelle: (t.content ?? []).map((x) => x.text).join('')
			}));
		expect(releve).toEqual(SOMMAIRE_REFERENCE.map((e) => ({ ...e })));
	});

	it('porte les six niveaux de titre que le gel écrit — 2 à 6, jamais 1', () => {
		const niveaux = new Set(
			titres(documentDuGel('n-restaurer-pg', 'reference')).map((t) => t.attrs.level)
		);
		expect([...niveaux].sort()).toEqual([2, 3, 4, 5, 6]);
	});
});

describe('les liens internes du gel', () => {
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
