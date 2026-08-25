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
 * Une nuance, et elle a coûté un 500 : synthétique ne veut pas dire que la FORME
 * de l'entrée peut être inventée. Le dernier bloc de ce fichier fait produire
 * l'échec d'insertion par drizzle lui-même, sans base — voir son en-tête.
 * L'écriture elle-même — transaction, réessai, index — n'est pas éprouvée ici :
 * elle exige une base, et la base est partagée (`P-30`).
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { corpsVide } from '../base/semence';
import { notes } from '../base/schema';
import {
	CONTRAINTE_D_IDENTIFIANT,
	corpsDeLaSaisie,
	estUneCollisionDIdentifiant,
	etiquettesDeSaisie,
	lireLaSaisie,
	proprietesSoumises,
	proprietesObligatoiresManquantes,
	retenirLesProprietes,
	type ChampObligeant
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

/**
 * L'ÉCHEC TEL QUE LE PRODUIT LE REÇOIT — enveloppé PAR DRIZZLE LUI-MÊME.
 *
 * Les cas ci-dessus passent à la fonction un objet plat, exactement la forme
 * qu'elle savait lire — et exactement celle que le produit ne lui donne jamais.
 * Le contrôle et le code partageaient la même hypothèse sur la forme de
 * l'entrée : un titre déjà pris rendait 500 sans qu'aucun cas ne vire au rouge.
 *
 * Ces cas-ci ne FABRIQUENT donc pas l'enveloppe : ils la font produire par sa
 * source, sur le vrai chemin — une insertion dans la table des notes, bâtie et
 * exécutée par le pilote PostgreSQL de drizzle, qui enveloppe ce que le client
 * lui lève. Le client est le seul leurre, et il ne remplace que le réseau ; ce
 * qu'il lève est bâti par la classe d'erreur du pilote, avec le code et le nom
 * de contrainte MESURÉS sur une vraie collision en base. Aucune base n'est
 * ouverte : rien n'est envoyé nulle part (`P-30`).
 */
async function echecDUneInsertion(erreurDuPilote: Error): Promise<unknown> {
	const leurre = {
		query: () => Promise.reject(erreurDuPilote)
	} as unknown as pg.Client;
	try {
		await drizzle(leurre).insert(notes).values({
			identifiant: 'restaurer-postgresql',
			titre: 'Restaurer PostgreSQL',
			corpsReference: corpsVide(),
			typeDeNoteId: '00000000-0000-4000-8000-000000000001',
			domaineId: '00000000-0000-4000-8000-000000000002',
			dossierId: '00000000-0000-4000-8000-000000000003',
			auteurId: '00000000-0000-4000-8000-000000000004'
		});
		return null;
	} catch (cause) {
		return cause;
	}
}

/** L'erreur du pilote, telle qu'une violation d'unicité la construit. */
function erreurDuPilote(code: string, contrainte: string): Error {
	const erreur = new pg.DatabaseError(
		'duplicate key value violates unique constraint',
		108,
		'error'
	);
	return Object.assign(erreur, { code, constraint: contrainte });
}

describe('ARB-062 §2.5 — la collision est reconnue SOUS l’enveloppe de drizzle', () => {
	it('l’enveloppe ne porte le code sur AUCUN de ses champs de surface', async () => {
		const echec = await echecDUneInsertion(erreurDuPilote('23505', CONTRAINTE_D_IDENTIFIANT));
		/* La démonstration du défaut : ce que la lecture à plat voyait. Si un jour
		   drizzle cesse d'envelopper, ce cas tombe et dit pourquoi. */
		expect(echec).toBeInstanceOf(Error);
		expect((echec as { code?: unknown }).code).toBeUndefined();
		expect((echec as { constraint?: unknown }).constraint).toBeUndefined();
		expect((echec as { cause?: unknown }).cause).toBeInstanceOf(pg.DatabaseError);
	});

	it('reconnaît la collision d’identifiant sous l’enveloppe', async () => {
		expect(
			estUneCollisionDIdentifiant(
				await echecDUneInsertion(erreurDuPilote('23505', CONTRAINTE_D_IDENTIFIANT))
			)
		).toBe(true);
	});

	it('NE reconnaît PAS, sous la même enveloppe, une autre contrainte ni un autre code', async () => {
		expect(
			estUneCollisionDIdentifiant(
				await echecDUneInsertion(erreurDuPilote('23505', 'etiquettes_libelle_unique'))
			)
		).toBe(false);
		expect(
			estUneCollisionDIdentifiant(
				await echecDUneInsertion(erreurDuPilote('23503', CONTRAINTE_D_IDENTIFIANT))
			)
		).toBe(false);
	});

	it('NE boucle PAS sur une erreur qui se désigne comme sa propre cause', () => {
		const erreur = new Error('cycle');
		Object.assign(erreur, { cause: erreur });
		expect(estUneCollisionDIdentifiant(erreur)).toBe(false);
	});
});

/* ═══════════════════════════════════ Le type de fiche ═══════════════════ */

/**
 * LE TYPE DE FICHE ET SES PROPRIÉTÉS — le trou que ce lot referme.
 *
 * Le sélecteur « Type de fiche » de V-17 affichait les vrais types de
 * l'instance et sa valeur ne quittait jamais l'écran : `lireLaSaisie()` ne
 * déclarait aucun champ de fiche, et `notes.type_de_fiche_id` n'était posé par
 * aucune route du produit. Les cas ci-dessous éprouvent la moitié PURE de la
 * chaîne — ce que le formulaire porte et ce qu'il vaut. L'autre moitié demande
 * la base (résolution du nom, filtrage sur les clés réelles) ou un navigateur
 * (le câblage qui compose la soumission) ; elle est éprouvée là-bas.
 */
describe('la soumission porte le type de fiche, ou ne le porte pas', () => {
	it('sans champ de fiche, la note est SIMPLE — et c’est le cas ordinaire', () => {
		const lue = lireLaSaisie(formulaire(COMPLET));
		expect(lue.ok).toBe(true);
		if (!lue.ok) return;
		expect(lue.saisie.fiche).toBeNull();
		expect(lue.saisie.proprietes).toBeNull();
	});

	it('un champ de fiche VIDE vaut « Aucun — note simple »', () => {
		const lue = lireLaSaisie(formulaire({ ...COMPLET, fiche: '', proprietes: '{}' }));
		expect(lue.ok).toBe(true);
		if (!lue.ok) return;
		expect(lue.saisie.fiche).toBeNull();
		expect(lue.saisie.proprietes).toBeNull();
	});

	it('un type choisi arrive avec ses propriétés, en NOM et en table de chaînes', () => {
		const lue = lireLaSaisie(
			formulaire({
				...COMPLET,
				fiche: 'Serveur',
				proprietes: JSON.stringify({ hote: 'pg-prod-01', sauvegarde: 'oui' })
			})
		);
		expect(lue.ok).toBe(true);
		if (!lue.ok) return;
		expect(lue.saisie.fiche).toBe('Serveur');
		expect(lue.saisie.proprietes).toEqual({ hote: 'pg-prod-01', sauvegarde: 'oui' });
	});

	it('des propriétés SANS type sont refusées — le miroir applicatif du CHECK', () => {
		/* `notes_proprietes_exigent_un_type_de_fiche` (`002_socle.montee.sql:380`)
		   les refuserait en base, en 500 et sans nommer ce qui manque. */
		const lue = lireLaSaisie(
			formulaire({ ...COMPLET, fiche: '', proprietes: JSON.stringify({ hote: 'x' }) })
		);
		expect(lue).toEqual({ ok: false, motif: 'propriétés sans type de fiche' });
	});

	it('des propriétés illisibles sont refusées, jamais rognées (ADR-003)', () => {
		for (const brut of ['ceci n’est pas du JSON', '[1,2]', '"Serveur"', '{"a":{"b":1}}']) {
			expect(lireLaSaisie(formulaire({ ...COMPLET, fiche: 'Serveur', proprietes: brut }))).toEqual({
				ok: false,
				motif: 'propriétés illisibles'
			});
		}
	});
});

describe('proprietesSoumises — la table de chaînes, et rien d’autre', () => {
	it('un champ vide rend une table vide, sans lever', () => {
		expect(proprietesSoumises('')).toEqual({ ok: true, valeurs: {} });
	});

	it('les nombres et les booléens sont ramenés à leur texte — la colonne ne porte que cela', () => {
		expect(proprietesSoumises(JSON.stringify({ vcpu: 16, actif: true }))).toEqual({
			ok: true,
			valeurs: { vcpu: '16', actif: 'true' }
		});
	});

	it('une valeur vide n’est pas une propriété', () => {
		expect(proprietesSoumises(JSON.stringify({ hote: '', adresse: '10.0.0.1' }))).toEqual({
			ok: true,
			valeurs: { adresse: '10.0.0.1' }
		});
	});

	it('un tableau, une valeur nulle ou un objet imbriqué sont refusés', () => {
		expect(proprietesSoumises('[]').ok).toBe(false);
		expect(proprietesSoumises(JSON.stringify({ a: null })).ok).toBe(false);
		expect(proprietesSoumises(JSON.stringify({ a: ['x'] })).ok).toBe(false);
	});
});

describe('retenirLesProprietes — le jsonb n’est contraint par rien d’autre', () => {
	it('ne garde que les clés du référentiel, et écarte le reste en silence', () => {
		expect(retenirLesProprietes({ hote: 'pg-prod-01', intrus: 'x' }, ['hote', 'adresse'])).toEqual({
			hote: 'pg-prod-01'
		});
	});

	it('rend une table vide quand rien ne correspond', () => {
		expect(retenirLesProprietes({ intrus: 'x' }, ['hote'])).toEqual({});
		expect(retenirLesProprietes({}, [])).toEqual({});
	});
});

/**
 * L'OBLIGATION, ET LE MOMENT OÙ ELLE MORD — la moitié PURE du refus.
 *
 * L'autre moitié — lire la colonne `obligatoire` de `champs_de_type_de_fiche` —
 * demande la base, qui est partagée (`P-30`) ; elle a été relevée dans un
 * navigateur, sur la chaîne entière « console → base → éditeur → refus ».
 *
 * Les champs ci-dessous sont typés `ChampObligeant`, c'est-à-dire par un `Pick`
 * sur ce que drizzle DÉRIVE de la table : la forme éprouvée est celle du
 * schéma, jamais une forme écrite ici. C'est le lien qui manquait le 25/08/2026
 * à 17:13:45, quand une interface recopiée à la main a rendu trois colonnes
 * invisibles sans qu'aucun compilateur ne bronche.
 */
describe('proprietesObligatoiresManquantes — ce que le schéma exige, et rien de plus', () => {
	const CHAMPS: readonly ChampObligeant[] = [
		{ cle: 'adresse_ip', nom: 'Adresse IP', obligatoire: true },
		{ cle: 'salle', nom: 'Salle', obligatoire: true },
		{ cle: 'commentaire', nom: 'Commentaire', obligatoire: false }
	];

	it('nomme chaque propriété obligatoire sans valeur — sa clé ET son nom', () => {
		expect(proprietesObligatoiresManquantes(CHAMPS, {})).toEqual([
			{ cle: 'adresse_ip', nom: 'Adresse IP' },
			{ cle: 'salle', nom: 'Salle' }
		]);
	});

	it('ne rend rien quand toutes les obligatoires sont renseignées', () => {
		expect(
			proprietesObligatoiresManquantes(CHAMPS, { adresse_ip: '10.0.0.99', salle: 'C03' })
		).toEqual([]);
	});

	it('n’EXIGE JAMAIS une propriété que le schéma ne marque pas', () => {
		expect(
			proprietesObligatoiresManquantes(CHAMPS, { adresse_ip: '10.0.0.99', salle: 'C03' })
		).toEqual([]);
		expect(proprietesObligatoiresManquantes([CHAMPS[2] as ChampObligeant], {})).toEqual([]);
	});

	it('une valeur VIDE ne vaut pas une valeur — `retenirLesProprietes()` l’a déjà écartée', () => {
		expect(proprietesObligatoiresManquantes(CHAMPS, { adresse_ip: '', salle: 'C03' })).toEqual([
			{ cle: 'adresse_ip', nom: 'Adresse IP' }
		]);
	});

	it('rend les manquantes DANS L’ORDRE DU RÉFÉRENTIEL, celui que l’éditeur affiche', () => {
		const inverse: readonly ChampObligeant[] = [
			{ cle: 'salle', nom: 'Salle', obligatoire: true },
			{ cle: 'adresse_ip', nom: 'Adresse IP', obligatoire: true }
		];
		expect(proprietesObligatoiresManquantes(inverse, {}).map((p) => p.cle)).toEqual([
			'salle',
			'adresse_ip'
		]);
	});
});
