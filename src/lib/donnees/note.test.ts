/**
 * LES UNITAIRES DE LA LECTURE D'UNE NOTE — ce qui se contrôle SANS base.
 *
 * Même règle que `lecture.test.ts` : ce qui exige le conteneur `db` est mesuré
 * par les batteries qui l'ouvrent, pas par `pnpm test:unit`. Ce qui est contrôlé
 * ici est donc tout ce qui est PUR — le registre demandé, le corps rendu, le
 * résolveur de liens, les rétroliens, et le choix du périmètre.
 *
 * DEUX DE CES CAS SONT SYNTHÉTIQUES, ET C'EST VOULU (P-5, P-26). Aucun corps de
 * la base ne porte de lien interne : le lien cassé et le rétrolien ne sont
 * exercés par AUCUN état du dépôt. Un contrôle dont le seul cas d'épreuve est
 * l'état du dépôt devient inerte le jour où le dépôt change ; les documents de
 * ces deux cas sont donc écrits ici, à la main.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS } from '../../../seeds/corpus';
import { corpsDepuisTexte, corpsVide, lignesDeNote } from '../base/semence';
import { documentDuGel } from '../contenu/documents-du-gel';
import { liensInternes } from '../contenu/document';
import { identiteAuthentifiee, indexerLesDroits, ANONYME } from '../droits/resolution';
import {
	corpsRendu,
	perimetreDeLaLectureDUneNote,
	registreDemande,
	resolveurDeNotes,
	retroliensVers
} from './note';

/* ═══════════════════════════════════════════════════ Le registre ════════ */

describe('le registre demandé par l’adresse — routes.md §4.1', () => {
	it('rend `operationnel` sur la seule valeur que §4.1 nomme', () => {
		expect(registreDemande('operationnel')).toBe('operationnel');
	});

	it('rend `reference` sans paramètre — c’est le défaut de §4.1', () => {
		expect(registreDemande(null)).toBe('reference');
		expect(registreDemande('reference')).toBe('reference');
	});

	it('rend le défaut sur toute autre valeur, sans lever', () => {
		/* Une adresse forgée ne fabrique pas un troisième registre : le
		   vocabulaire contractuel §3 n'en connaît que deux. */
		for (const valeur of ['', 'Operationnel', 'op', 'reference operationnel', '1']) {
			expect(registreDemande(valeur)).toBe('reference');
		}
	});
});

/* ═══════════════════════════════════════════════════ Le corps ═══════════ */

const RESOLVEUR = resolveurDeNotes([
	{ identifiant: 'n-cible-interne', titre: 'Une cible interne', publique: false },
	{ identifiant: 'n-cible-publique', titre: 'Une cible publique', publique: true }
]);

/** Un corps d'un seul paragraphe, dont le fragment cite une note. */
const corpsQuiCite = (cible: string) => ({
	type: 'doc',
	content: [
		{
			type: 'paragraph',
			content: [
				{ type: 'text', text: 'la note', marks: [{ type: 'lienInterne', attrs: { cible } }] }
			]
		}
	]
});

describe('le corps du registre demandé', () => {
	it('un registre absent rend un corps déclaré absent, jamais un autre registre', () => {
		/* 27 notes sur 32 n'ont pas de corps Opérationnel : la colonne est nulle.
		   Retomber sur le corps Référence serait afficher un registre pour
		   l'autre — le contraire de ce que le vocabulaire §3 appelle un registre. */
		const corps = corpsRendu(null, 'operationnel', RESOLVEUR);
		expect(corps).toEqual({
			registre: 'operationnel',
			existe: false,
			redige: false,
			html: '',
			cites: []
		});
	});

	it('un corps VIDE est rendu vide, et se déclare non rédigé', () => {
		/* Les 5 corps Opérationnels de la base sont `corpsVide()` — un paragraphe
		   sans texte. Le gel prévoit cet état ; la prose, non. */
		const corps = corpsRendu(corpsVide(), 'operationnel', RESOLVEUR);
		expect(corps.existe).toBe(true);
		expect(corps.redige).toBe(false);
		expect(corps.html.replace(/<[^>]*>/g, '').trim()).toBe('');
	});

	it('un corps rédigé passe par `rendreDocument`, et son texte est échappé', () => {
		const corps = corpsRendu(
			corpsDepuisTexte('Deux <balises> & un « esperluette »'),
			'reference',
			RESOLVEUR
		);
		expect(corps.redige).toBe(true);
		expect(corps.html).toContain('&lt;balises&gt;');
		expect(corps.html).toContain('&amp;');
	});

	it('rend les deux registres du corps transcrit du gel, sans les confondre', () => {
		/* `documents-du-gel.ts` porte les quatre corps des maquettes. Ils NE SONT
		   PAS servis par la route — la base ne les porte pas, et les substituer
		   serait la valeur illustrative de P-02 —, mais ils sont la seule matière
		   qui exerce le rendu d'un corps VRAIMENT rédigé. */
		const reference = corpsRendu(
			documentDuGel('n-restaurer-pg', 'reference'),
			'reference',
			RESOLVEUR
		);
		const operationnel = corpsRendu(
			documentDuGel('n-restaurer-pg', 'operationnel'),
			'operationnel',
			RESOLVEUR
		);
		expect(reference.redige).toBe(true);
		expect(operationnel.redige).toBe(true);
		expect(reference.html).not.toBe(operationnel.html);
		/* Le sommaire de V-14 se construit sur les titres du corps AFFICHÉ, et les
		   deux registres portent les leurs : `s-…` pour la Référence, `o-…` pour
		   l'Opérationnel (`note-de-demonstration.ts`, `SOMMAIRE_REFERENCE`). */
		expect(reference.html).toContain('<h2 id="s-avant">');
		expect(operationnel.html).toContain('<h2 id="o-preparer">');
		expect(operationnel.html).not.toContain('id="s-avant"');
	});

	it('une cible inconnue se signale cassée, sans `href` — CONSTRUCTIONS n° 14', () => {
		const corps = corpsRendu(corpsQuiCite('n-cette-note-nexiste-pas'), 'reference', RESOLVEUR);
		expect(corps.html).toBe('<p><a class="lien-casse">la note</a></p>');
		expect(corps.cites).toEqual(['n-cette-note-nexiste-pas']);
	});

	it('une cible connue devient l’adresse `/notes/{identifiant}`', () => {
		const corps = corpsRendu(corpsQuiCite('n-cible-interne'), 'reference', RESOLVEUR);
		expect(corps.html).toBe('<p><a class="lien-int" href="/notes/n-cible-interne">la note</a></p>');
	});
});

/* ═══════════════════════════════════════════════════ Le résolveur ══════ */

describe('le résolveur de liens internes, adossé aux notes lisibles', () => {
	it('rend `null` sur une cible absente de l’ensemble — jamais une adresse devinée', () => {
		expect(RESOLVEUR('n-absente')).toBeNull();
	});

	it('bâtit l’adresse sur l’identifiant de la note, comme la route la résout', () => {
		expect(RESOLVEUR('n-cible-interne')).toEqual({
			id: 'n-cible-interne',
			titre: 'Une cible interne',
			adresse: '/notes/n-cible-interne',
			publique: false
		});
	});

	it('reporte la publicité de la cible — la conjonction de RG-ACC-01', () => {
		expect(RESOLVEUR('n-cible-publique')?.publique).toBe(true);
	});
});

/* ═══════════════════════════════════════════════════ Les rétroliens ════ */

describe('les rétroliens — déduits du parcours des corps, RG-M05-02', () => {
	const cite = (cible: string) => corpsQuiCite(cible);

	it('retient les notes qui citent la cible, dans l’ordre de la requête', () => {
		const retroliens = retroliensVers('n-a', [
			{ identifiant: 'n-b', titre: 'B', reference: cite('n-a'), operationnel: null },
			{ identifiant: 'n-c', titre: 'C', reference: corpsDepuisTexte('rien'), operationnel: null },
			{
				identifiant: 'n-d',
				titre: 'D',
				reference: corpsDepuisTexte('rien'),
				operationnel: cite('n-a')
			}
		]);
		expect(retroliens).toEqual([
			{ identifiant: 'n-b', titre: 'B', adresse: '/notes/n-b' },
			{ identifiant: 'n-d', titre: 'D', adresse: '/notes/n-d' }
		]);
	});

	it('les deux registres comptent — un lien du corps Opérationnel est un lien', () => {
		const retroliens = retroliensVers('n-a', [
			{
				identifiant: 'n-d',
				titre: 'D',
				reference: corpsDepuisTexte('rien'),
				operationnel: cite('n-a')
			}
		]);
		expect(retroliens).toHaveLength(1);
	});

	it('une note qui se cite elle-même n’est pas son propre rétrolien', () => {
		expect(
			retroliensVers('n-a', [
				{ identifiant: 'n-a', titre: 'A', reference: cite('n-a'), operationnel: null }
			])
		).toEqual([]);
	});

	it('un corps sans lien ne rend aucun rétrolien, et n’en invente pas', () => {
		expect(
			retroliensVers('n-a', [
				{ identifiant: 'n-b', titre: 'B', reference: corpsDepuisTexte('rien'), operationnel: null }
			])
		).toEqual([]);
	});

	it('AUCUN corps de la semence ne porte de lien interne — le compte, mesuré', () => {
		/* CE QUE CE TEST DIT, ET IL EST LÀ POUR LE DIRE : les 32 corps que la
		   semence écrit sont des paragraphes d'extrait, sans le moindre lien. Le
		   rétrolien de RG-M05-02 est donc CALCULÉ et rend l'ensemble vide, sur les
		   32 notes. Le jour où la semence portera les corps rédigés, ce compte
		   cessera d'être nul : c'est l'écart du lot T-033 qui se referme, et cette
		   assertion est le témoin qui le signalera. */
		const lignes = lignesDeNote();
		expect(lignes).toHaveLength(CORPUS.length);
		const liens = lignes.flatMap((l) => [
			...liensInternes(l.corpsReference),
			...(l.corpsOperationnel === null ? [] : liensInternes(l.corpsOperationnel))
		]);
		expect(liens).toEqual([]);
		expect(lignes.filter((l) => l.corpsOperationnel !== null)).toHaveLength(5);
	});
});

/* ═══════════════════════════════════════════════════ Le périmètre ══════ */

describe('le périmètre de la famille `/notes/…` — routes.md §5.5', () => {
	/* Deux dossiers, l'un parent de l'autre : de quoi éprouver la remontée sans
	   dépendre de l'arborescence du corpus. */
	const ARBRE = [
		{ id: 'racine', parentId: null },
		{ id: 'enfant', parentId: 'racine' }
	];

	it('l’anonyme n’a AUCUN dossier — la colonne « Anonyme » de §5.5 rend 404', () => {
		/* Et surtout : ce n'est pas le périmètre PUBLIC. Une note publique et
		   publiée se lit à `/guides/{identifiant}` (ARB-007, A-05), jamais ici. */
		const perimetre = perimetreDeLaLectureDUneNote(ANONYME, indexerLesDroits(ARBRE));
		expect(perimetre.tout).toBe(false);
		expect(perimetre.tout ? new Set() : perimetre.dossiers).toEqual(new Set());
	});

	it('un droit posé sur la racine couvre le descendant — RG-DRO-05, par résolution', () => {
		const index = indexerLesDroits(ARBRE, [
			{ dossierId: 'racine', compteId: 'c-1', droit: 'lecteur' }
		]);
		const perimetre = perimetreDeLaLectureDUneNote(
			identiteAuthentifiee('c-1', 'contributeur'),
			index
		);
		expect(perimetre.tout).toBe(false);
		expect(perimetre.tout ? new Set() : perimetre.dossiers).toEqual(new Set(['racine', 'enfant']));
	});

	it('sans droit explicite, le connecté n’a aucun dossier — RG-DRO-02', () => {
		const perimetre = perimetreDeLaLectureDUneNote(
			identiteAuthentifiee('c-2', 'contributeur'),
			indexerLesDroits(ARBRE)
		);
		expect(perimetre.tout ? new Set(['tout']) : perimetre.dossiers).toEqual(new Set());
	});

	it('l’administrateur a le périmètre total — RG-DRO-03', () => {
		const perimetre = perimetreDeLaLectureDUneNote(
			identiteAuthentifiee('c-3', 'administrateur'),
			indexerLesDroits(ARBRE)
		);
		expect(perimetre.tout).toBe(true);
	});
});
