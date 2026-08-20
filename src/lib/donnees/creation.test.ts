/**
 * LA CRÉATION D'UNE NOTE — ce qui s'en éprouve SANS BASE.
 *
 * Trois choses seulement, et ce sont les trois qui décident du reste :
 *
 *   · le CONTRAT DE SOUMISSION (`T-079` §3) — quels champs sont lus, lesquels
 *     sont obligatoires, ce qu'un champ absent vaut ;
 *   · la RECONNAISSANCE DE LA COLLISION d'identifiant — ce qui fait repartir la
 *     boucle d'`ARB-062` §2.5, et surtout ce qui ne la fait PAS repartir ;
 *   · le CORPS d'une saisie vide, qui n'est pas produit par le Markdown.
 *
 * Tous les cas sont SYNTHÉTIQUES (`P-26`) : ils ne lisent ni la base, ni l'état
 * du dépôt, et resteront exercés quand le produit aura créé ses premières notes.
 * L'écriture elle-même — transaction, réessai, index — n'est pas éprouvée ici :
 * elle exige une base, et la base est partagée (`P-30`).
 */
import { describe, expect, it } from 'vitest';
import { corpsVide } from '../base/semence';
import {
	CONTRAINTE_D_IDENTIFIANT,
	corpsDeLaSaisie,
	estUneCollisionDIdentifiant,
	etiquettesDeSaisie,
	lireLaSaisie
} from './creation';

/** Un formulaire de création complet — la base des cas ci-dessous. */
function formulaire(champs: Record<string, string>): FormData {
	const f = new FormData();
	for (const [cle, valeur] of Object.entries(champs)) f.append(cle, valeur);
	return f;
}

const COMPLET = {
	titre: 'Restaurer PostgreSQL',
	type: 'Procédure',
	domaine: 'Infrastructure',
	dossier: 'Exploitation › Sauvegardes'
};

describe('T-079 §3 — le contrat de soumission', () => {
	it('lit les quatre champs obligatoires et rien de plus', () => {
		const lue = lireLaSaisie(formulaire(COMPLET));
		expect(lue.ok).toBe(true);
		if (!lue.ok) return;
		expect(lue.saisie.titre).toBe('Restaurer PostgreSQL');
		expect(lue.saisie.type).toBe('Procédure');
		expect(lue.saisie.domaine).toBe('Infrastructure');
		expect(lue.saisie.dossier).toBe('Exploitation › Sauvegardes');
		expect(lue.saisie.etiquettes).toEqual([]);
		expect(lue.saisie.corps).toBe('');
	});

	it('refuse un titre absent, vide ou blanc — et le motif est celui du contrat', () => {
		for (const titre of [undefined, '', '   ', '\t\n']) {
			const champs = { ...COMPLET, ...(titre === undefined ? {} : { titre }) };
			if (titre === undefined) delete (champs as Record<string, string>).titre;
			const lue = lireLaSaisie(formulaire(champs));
			expect(lue).toEqual({ ok: false, motif: 'titre manquant' });
		}
	});

	it('refuse un type, un domaine ou un dossier manquant', () => {
		for (const [champ, motif] of [
			['type', 'type manquant'],
			['domaine', 'domaine manquant'],
			['dossier', 'dossier manquant']
		]) {
			const champs: Record<string, string> = { ...COMPLET };
			delete champs[champ as string];
			expect(lireLaSaisie(formulaire(champs))).toEqual({ ok: false, motif });
		}
	});

	it('retire les blancs de bord des champs obligatoires', () => {
		const lue = lireLaSaisie(formulaire({ ...COMPLET, titre: '  Astreinte  ' }));
		expect(lue.ok && lue.saisie.titre).toBe('Astreinte');
	});
});

describe('T-079 §3 — les deux énumérés, et leur absence', () => {
	it('rend `null` quand le champ est absent : le DÉFAUT DE COLONNE s’applique', () => {
		const lue = lireLaSaisie(formulaire(COMPLET));
		expect(lue.ok && lue.saisie.visibilite).toBeNull();
		expect(lue.ok && lue.saisie.statut).toBeNull();
	});

	it('accepte les deux valeurs de chaque ensemble fermé', () => {
		for (const visibilite of ['interne', 'publique']) {
			const lue = lireLaSaisie(formulaire({ ...COMPLET, visibilite }));
			expect(lue.ok && lue.saisie.visibilite).toBe(visibilite);
		}
		for (const statut of ['brouillon', 'publiee']) {
			const lue = lireLaSaisie(formulaire({ ...COMPLET, statut }));
			expect(lue.ok && lue.saisie.statut).toBe(statut);
		}
	});

	it('REFUSE une valeur hors de l’ensemble plutôt que de la rabattre sur le défaut', () => {
		/* La polarité inverse du cas précédent (`P-5`) : une valeur inconnue
		   ramenée silencieusement au défaut publierait ce que l'appelant croyait
		   retenir, ou l'inverse. */
		expect(lireLaSaisie(formulaire({ ...COMPLET, visibilite: 'Publique' }))).toEqual({
			ok: false,
			motif: 'visibilité inconnue'
		});
		expect(lireLaSaisie(formulaire({ ...COMPLET, statut: 'Publiée' }))).toEqual({
			ok: false,
			motif: 'statut inconnu'
		});
	});
});

describe('T-079 §3 — les étiquettes, séparées par des virgules', () => {
	it('découpe, retire les blancs et ignore les vides', () => {
		expect(etiquettesDeSaisie('postgresql, sauvegarde ,  pra ')).toEqual([
			'postgresql',
			'sauvegarde',
			'pra'
		]);
		expect(etiquettesDeSaisie('')).toEqual([]);
		expect(etiquettesDeSaisie('  ,  , ')).toEqual([]);
	});

	it('réduit les doublons en gardant la PREMIÈRE occurrence — donc l’ordre de saisie', () => {
		/* Raison de SCHÉMA, non de confort : `etiquettes_de_note_pk` porte sur
		   `(note_id, etiquette_id)`, et deux fois la même étiquette sur une note est
		   une violation de clé primaire. */
		expect(etiquettesDeSaisie('pra, sauvegarde, pra')).toEqual(['pra', 'sauvegarde']);
	});

	it('distingue la casse, comme `etiquettes_libelle_unique` la distingue', () => {
		expect(etiquettesDeSaisie('Réseau, réseau')).toEqual(['Réseau', 'réseau']);
	});

	it('est lue depuis le formulaire', () => {
		const lue = lireLaSaisie(formulaire({ ...COMPLET, etiquettes: 'pra, sauvegarde' }));
		expect(lue.ok && lue.saisie.etiquettes).toEqual(['pra', 'sauvegarde']);
	});
});

describe('T-079 §3 — le corps soumis', () => {
	/* DEUX NOMS, DEUX FORMATS — `P-35`. `corps-markdown` porte du Markdown,
	   `corps` porte le document sérialisé de l'éditeur, et jamais l'inverse. La
	   confusion des deux a coûté une note créée VIDE, en 303, sans que rien ne
	   s'en plaigne : les cas ci-dessous existent pour que cela ne se reproduise
	   pas en silence. */
	it('n’est PAS rogné : `analyserMarkdown()` est seul juge de ce qu’il lit', () => {
		const lue = lireLaSaisie(formulaire({ ...COMPLET, 'corps-markdown': '\nBonjour\n' }));
		expect(lue.ok && lue.saisie.corps).toBe('\nBonjour\n');
	});

	it('les fins de ligne du sérialiseur de formulaire sont défaites — P-34', () => {
		const lue = lireLaSaisie(formulaire({ ...COMPLET, 'corps-markdown': '## A\r\n\r\nB' }));
		expect(lue.ok && lue.saisie.corps).toBe('## A\n\nB');
	});

	it('`corps` porte le DOCUMENT de l’éditeur, jamais du Markdown', () => {
		const document = { type: 'doc', content: [{ type: 'paragraph' }] };
		const lue = lireLaSaisie(formulaire({ ...COMPLET, corps: JSON.stringify(document) }));
		expect(lue.ok && lue.saisie.corpsDocument).toEqual(document);
		expect(lue.ok && lue.saisie.corps).toBe('');
	});

	it('un `corps` illisible est refusé en forme, pas en format', () => {
		const lue = lireLaSaisie(formulaire({ ...COMPLET, corps: 'Bonjour' }));
		expect(lue.ok).toBe(false);
		expect(!lue.ok && lue.motif).toBe('corps illisible');
	});

	it('les deux corps ensemble sont refusés : personne n’en a écrit deux', () => {
		const lue = lireLaSaisie(
			formulaire({
				...COMPLET,
				corps: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
				'corps-markdown': 'Bonjour'
			})
		);
		expect(lue.ok).toBe(false);
	});

	it('vaut la chaîne vide quand le champ est absent', () => {
		const lue = lireLaSaisie(formulaire(COMPLET));
		expect(lue.ok && lue.saisie.corps).toBe('');
		expect(lue.ok && lue.saisie.corpsDocument).toBe(null);
	});

	it('un corps absent ou blanc donne le corps VIDE du produit, non un Markdown', () => {
		/* Mesuré : `analyserMarkdown('')` LÈVE — « aucun contenu vide : l'absence de
		   contenu s'écrit par l'absence de la clé » — et un document sans `content`
		   est refusé lui aussi. Le corps vide du produit est `corpsVide()`
		   (`../base/semence.ts:239`), et `./histoire.test.ts:158` le nomme ainsi ; il
		   est REPRIS, jamais réécrit. */
		expect(corpsDeLaSaisie('')).toEqual(corpsVide());
		expect(corpsDeLaSaisie('   \n  ')).toEqual(corpsVide());
	});

	it('un corps rédigé passe par la porte unique du Markdown', () => {
		expect(corpsDeLaSaisie('Bonjour')).toEqual({
			type: 'doc',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bonjour' }] }]
		});
	});
});

describe('ARB-062 §2.5 — la collision est reconnue par la CONTRAINTE, pas par le code seul', () => {
	it('reconnaît une violation de `notes_identifiant_unique`', () => {
		expect(
			estUneCollisionDIdentifiant({ code: '23505', constraint: CONTRAINTE_D_IDENTIFIANT })
		).toBe(true);
	});

	it('NE reconnaît PAS une violation d’unicité portée par une autre contrainte', () => {
		/* La polarité inverse, et elle décide de la TERMINAISON de la boucle : une
		   création écrit aussi des étiquettes, et `etiquettes_libelle_unique` lève le
		   même `23505`. Réessayer là-dessus ferait boucler sans fin sur une cause
		   qu'un identifiant neuf ne peut pas lever. */
		expect(
			estUneCollisionDIdentifiant({ code: '23505', constraint: 'etiquettes_libelle_unique' })
		).toBe(false);
		expect(
			estUneCollisionDIdentifiant({ code: '23505', constraint: 'etiquettes_de_note_pk' })
		).toBe(false);
	});

	it('NE reconnaît PAS un autre échec de base, ni une erreur quelconque', () => {
		expect(estUneCollisionDIdentifiant({ code: '23503', constraint: 'notes_auteur_id_fkey' })).toBe(
			false
		);
		expect(estUneCollisionDIdentifiant({ code: '25P02' })).toBe(false);
		expect(estUneCollisionDIdentifiant(new Error('connexion perdue'))).toBe(false);
		expect(estUneCollisionDIdentifiant(null)).toBe(false);
		expect(estUneCollisionDIdentifiant(undefined)).toBe(false);
		expect(estUneCollisionDIdentifiant('23505')).toBe(false);
	});
});
