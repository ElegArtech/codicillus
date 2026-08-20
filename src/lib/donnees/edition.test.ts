/**
 * LES UNITAIRES DE L'ÉDITION — ce qui se contrôle SANS base.
 *
 * Même règle que `note.test.ts` : ce qui exige le conteneur est mesuré par les
 * batteries qui l'ouvrent. Trois décisions sont extractibles, et toutes trois
 * sont éprouvées sur du SYNTHÉTIQUE : la résolution d'une pièce jointe, la
 * lecture d'une soumission de modification, et le dossier qu'un chemin affiché
 * désigne.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE CAS DOIT ÊTRE SYNTHÉTIQUE — `P-5` ET `P-26`
 *
 * `pieces_jointes` compte ZÉRO ligne (mesuré le 20/08/2026), et
 * `pnpm verif:donnees` le chiffre autrement : « 7 notes sur 32 en déclarent,
 * 13 pièces déclarées, 2 nommées au gel dont 0 chiffrables en octets, 0 portées
 * en base ». La branche « pièce résolue » de `resoudreUnePieceJointe()` n'est
 * donc exercée par AUCUN état du dépôt : sans les lignes fabriquées ci-dessous,
 * le contrôle de visibilité de `RG-M04-08` serait une règle qu'on espère.
 *
 * ET LES DEUX POLARITÉS SONT JOUÉES. `P-5` le demande explicitement : « une
 * règle éprouvée sur un seul mécanisme n'est éprouvée qu'à moitié ». La même
 * pièce est donc demandée sur une note lisible ET sur une note qui ne l'est pas,
 * et le refus est comparé PAR IDENTITÉ à celui de la pièce inexistante.
 */
import { describe, expect, it } from 'vitest';
import { ANONYME, identiteAuthentifiee, INTROUVABLE } from '../droits/resolution';
import { DocumentInvalide, type Document } from '../contenu/document';
import { analyserMarkdown } from '../contenu/markdown';
import {
	dossierDeDestination,
	operationnelDesynchronise,
	etiquettesSoumises,
	lireLaModification,
	pieceJointeResolue,
	type ChampsSoumis,
	type LigneDePieceJointe,
	type ModificationDeNote
} from './edition';
import type { LigneDeDossier } from './rangement';

/* ═══════════════════════════════════ Le décor synthétique ═══════════════ */

const DOSSIER_LISIBLE = 'd0000000-0000-4000-8000-000000000001';
const DOSSIER_INTERDIT = 'd0000000-0000-4000-8000-000000000002';

const PERIMETRE = { tout: false as const, dossiers: new Set([DOSSIER_LISIBLE]) };
const PERIMETRE_TOTAL = { tout: true as const };

/** Une pièce jointe, jointe à sa note porteuse. Rien de tout cela n'est en base. */
function piece(surcharge: Partial<LigneDePieceJointe> = {}): LigneDePieceJointe {
	return {
		/* Les deux clés dont l'entrepôt dérive le chemin des octets (`T-026`).
		   Elles sont ici synthétiques comme le reste de la pièce : ce qui est
		   éprouvé est que la résolution les RAPPORTE, donc qu'aucun chemin de
		   fichier n'est formable avant elle. */
		id: 'p0000000-0000-4000-8000-000000000001',
		noteId: 'a0000000-0000-4000-8000-000000000001',
		nom: 'procedure-de-restauration.pdf',
		tailleOctets: 184_320,
		typeMedia: 'application/pdf',
		identifiant: 'n-restaurer-pg',
		dossierId: DOSSIER_LISIBLE,
		visibilite: 'interne',
		statut: 'publiee',
		...surcharge
	};
}

const REDACTEUR = identiteAuthentifiee('c0000000-0000-4000-8000-000000000001', 'contributeur');
const ADMINISTRATEUR = identiteAuthentifiee(
	'c0000000-0000-4000-8000-000000000002',
	'administrateur'
);

/* ═══════════════════════════════════ RG-M04-08 ══════════════════════════ */

describe('RG-M04-08 — la visibilité de la NOTE PORTEUSE décide, pas le fichier', () => {
	it('la pièce d’une note lisible est résolue, et rend ce que la base porte', () => {
		const resolue = pieceJointeResolue(REDACTEUR, piece(), PERIMETRE);
		expect(resolue.trouve).toBe(true);
		if (!resolue.trouve) return;
		expect(resolue.ressource).toEqual({
			nom: 'procedure-de-restauration.pdf',
			tailleOctets: 184_320,
			typeMedia: 'application/pdf',
			note: 'n-restaurer-pg',
			id: 'p0000000-0000-4000-8000-000000000001',
			noteId: 'a0000000-0000-4000-8000-000000000001'
		});
	});

	it('LA MÊME PIÈCE, sur une note hors périmètre, n’est pas résolue', () => {
		/* La polarité inverse. Sans ce cas, le premier ne prouverait que la
		   résolution, pas le contrôle. */
		const refusee = pieceJointeResolue(
			REDACTEUR,
			piece({ dossierId: DOSSIER_INTERDIT }),
			PERIMETRE
		);
		expect(refusee.trouve).toBe(false);
	});

	it('une pièce d’une note INTERNE n’est jamais servie en anonyme — la règle, à la lettre', () => {
		expect(pieceJointeResolue(ANONYME, piece(), PERIMETRE_TOTAL).trouve).toBe(false);
	});

	it('et une pièce d’une note publique ET publiée l’est', () => {
		/* « Publique ET publiée », les deux : c'est le « et » du cahier des charges
		   §2.2, porté par `noteVisibleEnAnonyme()`. */
		const publique = piece({ visibilite: 'publique', statut: 'publiee' });
		expect(pieceJointeResolue(ANONYME, publique, PERIMETRE_TOTAL).trouve).toBe(true);
	});

	it('une note publique mais BROUILLON ne sert pas sa pièce en anonyme', () => {
		const brouillon = piece({ visibilite: 'publique', statut: 'brouillon' });
		expect(pieceJointeResolue(ANONYME, brouillon, PERIMETRE_TOTAL).trouve).toBe(false);
	});

	it('l’administrateur contourne les droits de dossier — RG-DRO-03, son périmètre est total', () => {
		expect(pieceJointeResolue(ADMINISTRATEUR, piece(), PERIMETRE_TOTAL).trouve).toBe(true);
	});
});

/* ═══════════════════════════════════ RG-ACC-04 ══════════════════════════ */

describe('RG-ACC-04 — refus et inexistence rendent le MÊME OBJET, pas deux égaux', () => {
	it('la pièce inexistante et la pièce interdite sont identiques par référence', () => {
		const inexistante = pieceJointeResolue(REDACTEUR, undefined, PERIMETRE);
		const interdite = pieceJointeResolue(
			REDACTEUR,
			piece({ dossierId: DOSSIER_INTERDIT }),
			PERIMETRE
		);
		expect(inexistante).toBe(INTROUVABLE);
		expect(interdite).toBe(INTROUVABLE);
		expect(inexistante).toBe(interdite);
	});

	it('l’anonyme reçoit le même objet que le rédacteur sans droit', () => {
		expect(pieceJointeResolue(ANONYME, piece(), PERIMETRE_TOTAL)).toBe(
			pieceJointeResolue(REDACTEUR, piece({ dossierId: DOSSIER_INTERDIT }), PERIMETRE)
		);
	});
});

/* ═══════════════════════════════════ La lecture d'une soumission ════════ */

/**
 * CE QUE CES CAS ÉPROUVENT, ET POURQUOI ILS SONT SYNTHÉTIQUES.
 *
 * `lireLaModification()` est la porte d'entrée de `POST /notes/{id}/modifier` :
 * c'est elle qui décide ce qui sera écrit et ce qui ne le sera pas. Aucune
 * batterie du dépôt ne soumet ce formulaire — le gel de V-17 ne porte ni
 * `method`, ni `action`, ni un seul attribut de nom (`ARB-063` §1) —, de sorte
 * que sans les cas ci-dessous, la règle « aucun champ absent n'est modifié »
 * serait une règle qu'on espère (`P-5`, `P-26`).
 *
 * Ils sont éprouvés sur une table de correspondance, sans base et sans serveur :
 * la base est PARTAGÉE par plusieurs copies de travail, et un unitaire qui y
 * écrirait mesurerait le voisin (`P-30`).
 */
function champs(soumis: Record<string, unknown>): ChampsSoumis {
	return { get: (nom: string) => (nom in soumis ? soumis[nom] : null) };
}

function modificationDe(soumis: Record<string, unknown>): ModificationDeNote {
	const lue = lireLaModification(champs(soumis));
	if (!lue.recu) throw new Error('soumission refusée : ' + lue.refus.motif);
	return lue.modification;
}

function motifDuRefus(soumis: Record<string, unknown>): string {
	const lue = lireLaModification(champs(soumis));
	if (lue.recu) throw new Error('soumission acceptée, un refus était attendu');
	return lue.refus.motif;
}

describe('« aucun champ absent n’est modifié » — l’absence est une clé ABSENTE', () => {
	it('une soumission vide ne porte AUCUN champ', () => {
		expect(modificationDe({})).toEqual({});
	});

	it('une soumission qui ne porte qu’un titre ne porte pas de corps', () => {
		const modification = modificationDe({ titre: 'Restaurer PostgreSQL' });
		expect(modification.titre).toBe('Restaurer PostgreSQL');
		/* La clé est absente, et non présente à `undefined` : c'est ce que
		   `enregistrerLaNote()` lit pour ne pas toucher au corps, donc pour ne pas
		   écrire de version (`RG-M07-01`). */
		expect('corps' in modification).toBe(false);
		expect('etiquettes' in modification).toBe(false);
		expect('rangement' in modification).toBe(false);
	});

	it('un champ vide ne vaut pas un choix — visibilité et statut restent absents', () => {
		const modification = modificationDe({ visibilite: '', statut: '   ' });
		expect('visibilite' in modification).toBe(false);
		expect('statut' in modification).toBe(false);
	});
});

describe('les deux corps sont EXCLUSIFS', () => {
	it('les deux ensemble sont refusés, et le refus est nommé', () => {
		expect(
			motifDuRefus({ corps: '{"type":"doc","content":[]}', 'corps-markdown': 'Bonjour' })
		).toBe('deux corps soumis');
	});

	it('le document sérialisé seul passe, et arrive tel quel', () => {
		const modification = modificationDe({ corps: '{"type":"doc","content":[]}' });
		expect(modification.corps?.saisi).toEqual({ type: 'doc', content: [] });
	});

	it('le Markdown seul passe, et il est converti par la porte unique d’ADR-004', () => {
		/* Le corps rendu est un DOCUMENT, pas le texte reçu : c'est
		   `analyserMarkdown()` qui a travaillé, et aucun second analyseur. */
		const saisi = modificationDe({ 'corps-markdown': 'Bonjour' }).corps?.saisi as Document;
		expect(saisi.type).toBe('doc');
		expect(saisi).toEqual(analyserMarkdown('Bonjour'));
	});

	it('un document sérialisé illisible LÈVE, il n’est jamais réparé (ADR-003)', () => {
		expect(() => lireLaModification(champs({ corps: 'ceci n’est pas du JSON' }))).toThrow(
			SyntaxError
		);
	});

	it('un corps VIDE est refusé par le FORMAT, et n’efface donc jamais rien', () => {
		/* Le corps est le seul champ dont le vide n'est pas arbitré ici : la porte
		   unique du format le refuse d'elle-même — « aucun contenu vide :
		   l'absence de contenu s'écrit par l'absence de la clé ». Une note dont le
		   corps serait effacé par un champ caché resté vide est donc impossible, et
		   elle l'est par une règle qui existait déjà (`ADR-003`). */
		expect(() => lireLaModification(champs({ 'corps-markdown': '' }))).toThrow(DocumentInvalide);
		expect(() => lireLaModification(champs({ corps: '' }))).toThrow(SyntaxError);
	});
});

describe('le titre — le seul champ dont le BLANC est une erreur', () => {
	it('un titre blanc est refusé', () => {
		expect(motifDuRefus({ titre: '   ' })).toBe('titre manquant');
	});

	it('un titre est retenu sans ses blancs de bord', () => {
		expect(modificationDe({ titre: '  Astreinte  ' }).titre).toBe('Astreinte');
	});
});

describe('RG-M05-09 — le rangement se soumet ENTIER, ou pas du tout', () => {
	it('un domaine sans dossier est refusé', () => {
		expect(motifDuRefus({ domaine: 'Infrastructure' })).toBe('rangement incomplet');
	});

	it('un dossier sans domaine l’est aussi — la polarité inverse', () => {
		expect(motifDuRefus({ dossier: 'Bases de données' })).toBe('rangement incomplet');
	});

	it('les deux ensemble composent le rangement demandé', () => {
		expect(
			modificationDe({ domaine: 'Infrastructure', dossier: 'Bases de données' }).rangement
		).toEqual({ domaine: 'Infrastructure', dossier: 'Bases de données' });
	});
});

describe('les deux énumérations viennent du SCHÉMA, et rien n’est coercé', () => {
	it('les valeurs du schéma passent', () => {
		expect(modificationDe({ visibilite: 'publique' }).visibilite).toBe('publique');
		expect(modificationDe({ statut: 'brouillon' }).statut).toBe('brouillon');
	});

	it('la forme AFFICHÉE du corpus n’est pas la forme de la base', () => {
		/* `seeds/corpus.ts:77` porte « Interne » et « Publique » — la forme
		   affichée. Les colonnes portent les minuscules du schéma. Accepter la
		   première reviendrait à écrire une seconde table de correspondance. */
		expect(motifDuRefus({ visibilite: 'Publique' })).toBe('visibilite invalide');
	});

	it('une valeur hors énumération est refusée, jamais rabattue sur un défaut', () => {
		expect(motifDuRefus({ statut: 'publié' })).toBe('statut invalide');
	});
});

describe('les étiquettes — la liste soumise REMPLACE la liste courante', () => {
	it('les noms sont séparés par des virgules, sans blancs ni doublons', () => {
		expect(etiquettesSoumises('postgresql,  sauvegarde , ,postgresql')).toEqual([
			'postgresql',
			'sauvegarde'
		]);
	});

	it('une liste VIDE est une liste, et c’est le seul moyen de tout retirer', () => {
		const modification = modificationDe({ etiquettes: '' });
		expect(modification.etiquettes).toEqual([]);
		expect('etiquettes' in modification).toBe(true);
	});

	it('l’ordre soumis est l’ordre retenu — c’est lui qui devient le rang', () => {
		expect(etiquettesSoumises('pra, bases, astreinte')).toEqual(['pra', 'bases', 'astreinte']);
	});
});

describe('un champ non textuel est refusé, et le refus le NOMME', () => {
	it('un fichier déposé dans le champ titre ne devient pas un titre', () => {
		expect(motifDuRefus({ titre: new Blob(['x']) })).toBe('champ illisible : titre');
	});
});

/* ═══════════════════════════════════ Le dossier de destination ══════════ */

/**
 * L'arborescence synthétique — deux domaines, et le même nom de dossier dans
 * les deux. C'est la configuration que `resoudreLeChemin()` dit redouter : « deux
 * domaines portent tous deux un dossier "Applications" […] un appariement par
 * nom seul rendrait le mauvais ». Elle est reproduite ici pour que la descente
 * par PARENT soit éprouvée, et non seulement invoquée.
 */
const ARBRE: readonly LigneDeDossier[] = [
	{ id: 'r-infra', parentId: null, domaineId: 'd-infra', nom: 'Infrastructure', profondeur: 1 },
	{
		id: 'bases',
		parentId: 'r-infra',
		domaineId: 'd-infra',
		nom: 'Bases de données',
		profondeur: 2
	},
	{ id: 'pg', parentId: 'bases', domaineId: 'd-infra', nom: 'PostgreSQL', profondeur: 3 },
	{ id: 'r-appli', parentId: null, domaineId: 'd-appli', nom: 'Applications', profondeur: 1 },
	{
		id: 'bases-bis',
		parentId: 'r-appli',
		domaineId: 'd-appli',
		nom: 'Bases de données',
		profondeur: 2
	}
];

describe('le dossier qu’un chemin AFFICHÉ désigne', () => {
	it('le chemin du gel, séparateur compris, désigne le dossier', () => {
		expect(dossierDeDestination(ARBRE, 'Bases de données › PostgreSQL')?.id).toBe('pg');
	});

	it('les diacritiques et la casse ne décident de rien — identifiantLisible() normalise', () => {
		expect(dossierDeDestination(ARBRE, 'BASES DE DONNEES › postgresql')?.id).toBe('pg');
	});

	it('un chemin VIDE ne désigne rien — la racine n’est pas un choix de rangement', () => {
		expect(dossierDeDestination(ARBRE, '')).toBe(null);
		expect(dossierDeDestination(ARBRE, '   ')).toBe(null);
	});

	it('un segment inconnu ne désigne rien, et rien n’est deviné', () => {
		expect(dossierDeDestination(ARBRE, 'Bases de données › MariaDB')).toBe(null);
	});

	it('la descente se fait par PARENT : le dossier homonyme de l’autre domaine reste hors d’atteinte', () => {
		/* Les lignes d'un seul domaine sont passées, comme le fait
		   `destinationDuRangement()`. Le même chemin y désigne l'autre dossier —
		   et jamais les deux. */
		const dUnSeulDomaine = ARBRE.filter((d) => d.domaineId === 'd-appli');
		expect(dossierDeDestination(dUnSeulDomaine, 'Bases de données')?.id).toBe('bases-bis');
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   `RG-M06-08` — LE SIGNAL DE DÉSYNCHRONISATION, ET SON CAS SYNTHÉTIQUE

   La règle a été écrite avec une sonde de navigateur, et la sonde a été
   supprimée avec le lot : le prédicat serait redevenu une règle qu'on espère
   (`P-26`). Les cas ci-dessous ne dépendent d'aucune base, d'aucun navigateur
   et d'aucun état du dépôt, et ils jouent les DEUX polarités (`P-5`).

   `operationnelDesynchronise()` est aussi la SEULE définition de ce signal : le
   chargeur de la lecture le recopiait en ligne, et c'était `P-01` en petit.
   ═══════════════════════════════════════════════════════════════════════════ */

describe('la désynchronisation de l’Opérationnel — RG-M06-08', () => {
	const t = (iso: string): Date => new Date(iso);

	it('une note sans registre Opérationnel n’est jamais désynchronisée', () => {
		expect(
			operationnelDesynchronise({
				referenceModifieLe: t('2026-08-21T10:00:00Z'),
				operationnelModifieLe: null
			})
		).toBe(false);
	});

	it('la Référence modifiée APRÈS l’Opérationnel désynchronise', () => {
		expect(
			operationnelDesynchronise({
				referenceModifieLe: t('2026-08-21T10:00:01Z'),
				operationnelModifieLe: t('2026-08-21T10:00:00Z')
			})
		).toBe(true);
	});

	it('l’Opérationnel écrit APRÈS la Référence ne désynchronise pas', () => {
		expect(
			operationnelDesynchronise({
				referenceModifieLe: t('2026-08-21T10:00:00Z'),
				operationnelModifieLe: t('2026-08-21T10:00:01Z')
			})
		).toBe(false);
	});

	it('l’ÉGALITÉ ne désynchronise pas — le signal veut un « après », pas un « pas avant »', () => {
		const instant = t('2026-08-21T10:00:00Z');
		expect(
			operationnelDesynchronise({ referenceModifieLe: instant, operationnelModifieLe: instant })
		).toBe(false);
	});
});
