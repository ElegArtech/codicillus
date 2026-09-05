/**
 * V-14 — LA LECTURE D'UNE NOTE, ET CE QU'ELLE NE DOIT JAMAIS INVENTER.
 *
 * TROIS DÉFAUTS SONT FERMÉS ICI, ET CHACUN A COÛTÉ.
 *
 *  1. LA NOTE SERVIE EST CELLE QU'ON LIT. `/notes/{identifiant}` a servi l'article
 *     d'une note du jeu de démonstration POUR TOUT LE CORPUS, faute d'une propriété
 *     pour recevoir la vraie.
 *  2. LA VIVACITÉ N'EST PAS RECALCULÉE. L'état, les libellés, la frise et le rappel
 *     sortent tous de `vivacite()` — la fabrique unique (`P-01`, `ADR-005`). Les cas
 *     ci-dessous construisent leurs attentes PAR ELLE : un libellé réécrit dans la
 *     vue ferait tomber le contrôle, et c'est exactement ce qu'on veut.
 *  3. LE REGISTRE AFFICHÉ COMMANDE TOUT. Bascule sur l'Opérationnel, et la ligne, la
 *     carte, la frise et le rappel parlent de SON cycle — les deux registres d'une
 *     même note vivent deux états différents.
 *
 * LE CORPS EST RENDU PAR `rendreDocument`, ET PAR RIEN D'AUTRE : ce fichier n'écrit
 * aucun HTML de corps à la main, ce qui serait le second convertisseur qu'`ADR-004`
 * interdit — « y compris dans un test ».
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import {
	corpusPourVue,
	MOI,
	noteParIdentifiant,
	type Note,
	type UtilisateurCourant
} from '../../seeds/corpus';
import { documentDuGel, resoudreDansLeCorpus } from '../lib/contenu/documents-du-gel';
import { rendreDocument } from '../lib/contenu/rendu';
import type { LectureAffichee } from '../lib/lecture/note-de-demonstration';
import type {
	AdressesDeLecture,
	ContexteDeLaNote,
	EnteteDeLecture,
	VivaciteDesRegistres
} from '../lib/lecture/ecran';
import { vivacite, type CycleDeVivacite } from '../lib/fraicheur';

const NOTES = corpusPourVue('V-14');

/** LA NOTE DU JEU DE DÉMONSTRATION — celle qui ne doit plus jamais paraître. */
const NOTE_DU_GEL = (() => {
	const note = noteParIdentifiant('n-restaurer-pg');
	if (!note) throw new Error('seeds/corpus.ts : « n-restaurer-pg » a disparu');
	return note;
})();

/** L'AUTRE note à corps transcrit du gel — jamais celle de la démonstration. */
const AUTRE_NOTE = (() => {
	const note = noteParIdentifiant('n-mot-de-passe');
	if (!note) throw new Error('seeds/corpus.ts : « n-mot-de-passe » a disparu');
	return note;
})();

const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

/** Le corps rendu par l'implémentation unique — ADR-004, jamais un second chemin. */
function corpsRenduDuGel(note: Note, registre: 'reference' | 'operationnel'): string {
	return rendreDocument(documentDuGel(note.id, registre), {
		resoudre: resoudreDansLeCorpus,
		contexte: 'interne'
	});
}

const REFERENCE_RENDUE = corpsRenduDuGel(AUTRE_NOTE, 'reference');
const OPERATIONNEL_RENDU = corpsRenduDuGel(AUTRE_NOTE, 'operationnel');

/** Le jour d'observation, fixe : une borne ne se prouve pas sur l'horloge. */
const AUJOURDHUI = '2026-09-05';

/** Le cycle d'un registre, posé à N jours de sa vérification. */
function cycleDepuis(jours: number, validite: number, revisionPar?: string): CycleDeVivacite {
	const verifiee = new Date(Date.UTC(2026, 8, 5, 12) - jours * 86_400_000)
		.toISOString()
		.slice(0, 10);
	return {
		verifiee,
		modifiee: verifiee,
		validite,
		par: 'Karim Belhadj',
		...(revisionPar === undefined ? {} : { revisionPar })
	};
}

/** La Référence à jour du prototype : vérifiée il y a 23 jours, valable 90. */
const REFERENCE_A_JOUR = vivacite(cycleDepuis(23, 90), AUJOURDHUI);
/** L'Opérationnel à vérifier : vérifié il y a 22 jours, valable 21. */
const OPERATIONNEL_A_VERIFIER = vivacite(cycleDepuis(22, 21), AUJOURDHUI);

const VIVACITE: VivaciteDesRegistres = {
	courante: REFERENCE_A_JOUR,
	reference: REFERENCE_A_JOUR,
	operationnelle: OPERATIONNEL_A_VERIFIER
};

const AFFICHEE: LectureAffichee = {
	note: AUTRE_NOTE,
	reference: REFERENCE_RENDUE,
	operationnel: OPERATIONNEL_RENDU,
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
	/* TROIS NOMBRES DISTINCTS, ET C'EST LE POINT : `Note.vues` du corpus, le cumul
	   servi et la fenêtre de trente jours ne coïncident pas. */
	consultationsTotal: 431
};

/** Les panneaux, tous vides — l'état que la colonne doit DIRE en un chiffre. */
const PANNEAUX_VIDES = {
	voisines: [],
	pieces: [],
	relations: [],
	retroliens: [],
	verifications: [],
	proprietes: []
};

const ENTETE: EnteteDeLecture = {
	creeeLe: '12 janvier 2026',
	version: 'v3',
	derniereModification: 'il y a 4 jours par Karim Belhadj'
};

const CONTEXTE: ContexteDeLaNote = {
	univers: AUTRE_NOTE.univers,
	rangement: { libelle: AUTRE_NOTE.domaine, adresse: '/univers/production/exploitation' },
	voisinage: { libelle: '4 autres notes dans ce domaine', adresse: '/univers/u/d/notes' }
};

const ADRESSES: AdressesDeLecture = {
	reference: `/notes/${AUTRE_NOTE.id}`,
	operationnel: `/notes/${AUTRE_NOTE.id}?registre=operationnel`,
	modifier: `/notes/${AUTRE_NOTE.id}/modifier`,
	modifierLOperationnel: `/notes/${AUTRE_NOTE.id}/operationnel`,
	historique: `/notes/${AUTRE_NOTE.id}/historique`,
	relations: `/notes/${AUTRE_NOTE.id}/relations`,
	planche: '/bibliotheque/vivacite'
};

/** Le socle de propriétés requises : la route ne peut pas les oublier. */
function rendu(proprietes: Record<string, unknown> = {}): Promise<string> {
	return rendreLaVue('V-14', {
		vecteur: null,
		notes: NOTES,
		affichee: AFFICHEE,
		panneaux: PANNEAUX_VIDES,
		registre: 'reference',
		vivacite: VIVACITE,
		entete: ENTETE,
		contexte: CONTEXTE,
		adresses: ADRESSES,
		...proprietes
	});
}

afterAll(fermerLeHarnais);

describe('V-14 — la note lue est celle qu’on lit', () => {
	it('rend le titre, le corps et les métadonnées de la note reçue', async () => {
		const html = await rendu();
		expect(html).toContain(AUTRE_NOTE.titre);
		expect(html).not.toContain(NOTE_DU_GEL.titre);
		expect(REFERENCE_RENDUE.length).toBeGreaterThan(200);
		expect(html).toContain(REFERENCE_RENDUE);
		expect(html).toContain('12 janvier 2026');
		expect(html).toContain('v3');
		expect(html).toContain('431 consultations');
		expect(html).toContain('7 sur les 30 derniers jours');
		expect(html).not.toContain(`${AUTRE_NOTE.vues} consultations`);
	});

	it('sert le compte reçu, et non celui du jeu de semence', async () => {
		const html = await rendu({ compte: SOPHIE });
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('ne rend le corps que du registre affiché', async () => {
		const surLaReference = await rendu();
		expect(surLaReference).toContain(REFERENCE_RENDUE);
		expect(surLaReference).not.toContain(OPERATIONNEL_RENDU);

		const surLOperationnel = await rendu({ registre: 'operationnel' });
		expect(surLOperationnel).toContain(OPERATIONNEL_RENDU);
		expect(surLOperationnel).not.toContain(REFERENCE_RENDUE);
	});

	it('dit qu’un registre est vide plutôt que d’inventer un corps', async () => {
		const html = await rendu({
			registre: 'operationnel',
			affichee: { ...AFFICHEE, operationnel: null }
		});
		expect(html).toContain('Registre Opérationnel vide');
		expect(html).not.toContain(OPERATIONNEL_RENDU);
	});
});

describe('V-14 — la vivacité vient de la fabrique, et du registre affiché', () => {
	it('rend l’état, la vérification, l’échéance et le rappel de la Référence', async () => {
		const html = await rendu();
		expect(html).toContain(REFERENCE_A_JOUR.libelle);
		expect(html).toContain(REFERENCE_A_JOUR.ligneVerification);
		expect(html).toContain(REFERENCE_A_JOUR.ligneEcheance);
		expect(html).toContain(REFERENCE_A_JOUR.rappel);
		/* La carte de la colonne nomme le registre : deux cycles cohabitent. */
		expect(html).toContain('Vivacité (Référence)');
		expect(html).toContain('data-attention="0"');
	});

	it('bascule TOUT sur le cycle de l’Opérationnel', async () => {
		const html = await rendu({
			registre: 'operationnel',
			vivacite: { ...VIVACITE, courante: OPERATIONNEL_A_VERIFIER }
		});
		expect(OPERATIONNEL_A_VERIFIER.etat).toBe('averifier');
		expect(html).toContain('Vivacité (Opérationnel)');
		expect(html).toContain(OPERATIONNEL_A_VERIFIER.ligneEcheance);
		expect(html).toContain(OPERATIONNEL_A_VERIFIER.rappel);
		expect(html).toContain('data-attention="2"');
		/* Et rien de l'autre registre ne subsiste. */
		expect(html).not.toContain(REFERENCE_A_JOUR.ligneEcheance);
	});

	it('pose la frise sur la position rendue par la fabrique', async () => {
		const html = await rendu();
		const attendue = `${(REFERENCE_A_JOUR.fraction * 100).toFixed(1)}%`;
		expect(html).toContain(attendue);
		expect(html).toContain(REFERENCE_A_JOUR.departCourt);
		expect(html).toContain(REFERENCE_A_JOUR.echeanceCourt);
		expect(html).toContain(REFERENCE_A_JOUR.relatif);
	});

	it('annonce la demande de révision quand elle vise ce registre', async () => {
		const demandee = vivacite(cycleDepuis(23, 90, 'Karim Belhadj'), AUJOURDHUI);
		const html = await rendu({
			vivacite: { ...VIVACITE, courante: demandee, reference: demandee }
		});
		expect(demandee.etat).toBe('arevoir');
		expect(html).toContain('Révision demandée · Karim Belhadj');
		expect(html).toContain('Lever la demande de révision');
		expect(html).toContain('id="btn-lever"');
		/* Le menu propose l'un OU l'autre : la demande posée, on la lève. */
		expect(html).not.toContain('id="btn-reviser"');
	});
});

describe('V-14 — le sélecteur de registre', () => {
	it('rend deux onglets quand l’Opérationnel existe, et marque celui qui est ouvert', async () => {
		const html = await rendu({ registre: 'operationnel' });
		expect(html).toContain(`href="${ADRESSES.reference}"`);
		expect(html).toContain(`href="${ADRESSES.operationnel}"`);
		expect(html).toContain('Opérationnel</a>');
		expect(html).not.toContain('Créer la version opérationnelle');
	});

	/**
	 * `README` du paquet : « Pas d'onglet Opérationnel désactivé ». Sans registre,
	 * un seul onglet, et le geste qui crée le second — jamais une porte fermée.
	 */
	it('n’affiche jamais d’onglet désactivé : sans Opérationnel, il offre de le créer', async () => {
		const html = await rendu({ vivacite: { ...VIVACITE, operationnelle: null } });
		expect(html).toContain('Créer la version opérationnelle');
		expect(html).toContain(`href="${ADRESSES.modifierLOperationnel}"`);
		expect(html).not.toContain(`href="${ADRESSES.operationnel}"`);
		expect(html).not.toContain('disabled');
		/* Et la colonne d'actions propose de le créer, non de le modifier. */
		expect(html).toContain("Créer l'opérationnel");
		expect(html).not.toContain("Modifier l'opérationnel");
	});
});

describe('V-14 — les libellés dont un geste dépend', () => {
	/**
	 * `src/routes/notes/{identifiant}/cablage.ts` et `$lib/cablage/libelles.ts`
	 * retrouvent ces boutons PAR LEUR TEXTE. Les renommer débranche le geste sans
	 * erreur de compilation : ce contrôle est le seul qui puisse s'en apercevoir.
	 */
	it('porte les libellés que le câblage vise, au caractère près', async () => {
		const html = await rendu();
		for (const libelle of [
			'Modifier la référence',
			"Modifier l'opérationnel",
			'Exporter',
			'Imprimer',
			'Supprimer',
			'Marquer comme vérifiée',
			'Signaler à réviser',
			'Historique des versions'
		]) {
			expect(html).toContain(libelle);
		}
		/* Les trois identifiants que le câblage cherche. */
		expect(html).toContain('id="btn-verifier"');
		expect(html).toContain('id="btn-reviser"');
		expect(html).toContain('id="panneau-reviser"');
	});

	/** `P-09`, `ARB-040` — en lecture seule, l'action d'écriture n'est pas ÉMISE. */
	it('n’émet aucune action d’écriture sans le droit d’écrire', async () => {
		const html = await rendu({ vecteur: { droits: 'lecture' } });
		expect(html).not.toContain('Modifier la référence');
		expect(html).not.toContain('Marquer comme vérifiée');
		expect(html).not.toContain('Supprimer');
		expect(html).not.toContain('id="panneau-reviser"');
		/* Ce qui reste lisible reste offert. */
		expect(html).toContain('Imprimer');
		expect(html).toContain('Historique des versions');
	});
});

describe('V-14 — la colonne de contexte ne ment pas', () => {
	it('dit un compteur à zéro en un chiffre, sans grande zone vide', async () => {
		const html = await rendu();
		const colonne = html.slice(html.indexOf('data-zone="pieces"'));
		expect(colonne).toContain('Pièces jointes');
		expect(colonne).toContain('Rétroliens');
		/* Aucune phrase d'excuse, aucun exemple du gel. */
		expect(html).not.toContain('Aucune pièce jointe');
		expect(html).not.toContain('Aucun rétrolien');
		expect(html).not.toContain('pg-prod-01');
		expect(html).not.toContain('Plan de reprise — volet bases');
	});

	it('rend les pièces et les rétroliens servis, et rien qu’eux', async () => {
		const html = await rendu({
			panneaux: {
				...PANNEAUX_VIDES,
				pieces: [
					{
						nom: 'Journal',
						extension: 'CSV',
						taille: '18 Ko',
						depose: 'déposé le 4 juin 2026',
						adresse: '/notes/n-restaurer-pg/pieces-jointes/Journal.csv'
					}
				],
				relations: [
					{
						libelle: 'Dépend de',
						notes: [
							{
								identifiant: 'n-pg-prod-02',
								titre: 'pg-prod-02',
								type: 'Fiche',
								domaine: 'Infrastructure'
							}
						]
					}
				],
				retroliens: [
					{ identifiant: 'n-astreinte', titre: 'Consignes d’astreinte', domaine: 'Infrastructure' }
				]
			}
		});
		expect(html).toContain('Journal');
		expect(html).toContain('18 Ko · déposé le 4 juin 2026');
		expect(html).toContain('Consignes d’astreinte');
		/* Les relations se comptent, et le compte mène à leur page. */
		expect(html).toContain('note liée');
		expect(html).toContain(`href="${ADRESSES.relations}"`);
	});

	it('ne rend la ligne de voisinage que s’il y a des voisines', async () => {
		expect(await rendu()).toContain('4 autres notes dans ce domaine');
		const seule = await rendu({ contexte: { ...CONTEXTE, voisinage: null } });
		expect(seule).not.toContain('autres notes dans ce');
	});
});

describe('V-14 — le pied de note et la bulle du geste', () => {
	it('rend le rappel automatique et le lien vers la planche', async () => {
		const html = await rendu();
		expect(html).toContain(REFERENCE_A_JOUR.rappel);
		expect(html).toContain('Planche des états de vivacité');
		expect(html).toContain(`href="${ADRESSES.planche}"`);
	});

	it('ne rend aucune bulle sans geste, et le texte servi sinon', async () => {
		expect(await rendu()).not.toContain('id="toast"');
		const html = await rendu({
			annonce: "Vérifiée à l'instant — le cycle repart pour 90 jours"
		});
		expect(html).toContain('id="toast"');
		expect(html).toContain("Vérifiée à l'instant — le cycle repart pour 90 jours");
	});
});

describe('V-14 — rien du jeu de démonstration ne subsiste au défaut', () => {
	it('ne nomme aucun compte du jeu quand aucun ne lui est servi', async () => {
		const html = await rendu();
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('ne dérive plus son rail des propriétés — sans contexte, il est vide', async () => {
		const rail = (html: string) => /<aside class="rail"[\s\S]*?<\/aside>/.exec(html)?.[0] ?? '';
		const vide = rail(await rendu());
		expect(vide).not.toContain('>Production</span>');
		expect(vide).not.toContain('>Projets</span>');
	});
});
