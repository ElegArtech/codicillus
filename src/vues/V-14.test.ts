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
import { NOTE, type LectureAffichee } from '../lib/lecture/note-de-demonstration';
import { adresseDeDomaine } from '../lib/rangement/adresses';
import { motFiche } from '../lib/vocabulaire';

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

/**
 * LA NOTE AFFICHÉE, COMPLÈTE — et « complète » a changé de sens.
 *
 * Elle ne portait que l'identité et les deux corps ; le reste de l'écran —
 * cartouche de contrôle, dates, bandeaux, mesure de consultation, sommaire —
 * restait la transcription du gel, quelle que fût la note ouverte. Ces champs
 * sont ceux que le chargeur lit désormais en base.
 *
 * LES VALEURS SONT CELLES D'UN CAS, PAS CELLES DU GEL : elles ne coïncident
 * avec aucune date de la planche, et c'est ce qui rend les contrôles
 * ci-dessous capables de dire non (P-5).
 */
/** Les deux corps rendus, nommés : `LectureAffichee` les admet nuls, pas eux. */
const REFERENCE_RENDUE = corpsRenduDuGel(AUTRE_NOTE, 'reference');
const OPERATIONNEL_RENDU = corpsRenduDuGel(AUTRE_NOTE, 'operationnel');

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
	referenceModifiee: {
		iso: '2026-03-02',
		jour: '2 mars 2026',
		heureDite: '2 mars 2026 à 17:40'
	},
	resync: false,
	revision: null,
	consultations30j: 7,
	/* TROIS NOMBRES DISTINCTS, ET C'EST LE POINT. `Note.vues` du corpus, le
	   cumul servi et la fenêtre de trente jours ne coïncident pas : sans cela,
	   un rendu qui lirait encore `note.vues` passerait pour juste. */
	consultationsTotal: 431
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
		/* Le titre d'une section du rail est un LIEN vers la page de son univers
		   depuis qu'un univers sans domaine doit pouvoir s'atteindre. */
		const titre = (nom: string) => `href="/univers/${nom.toLowerCase()}">${nom}</a>`;

		const defaut = await rendu({});
		expect(defaut).toContain(titre('Production'));
		expect(defaut).toContain(titre('Projets'));

		const html = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Production') });
		expect(html).toContain(titre('Production'));
		expect(html).not.toContain(titre('Projets'));
	});

	it('rend la note reçue — titre, rangement et pièces jointes', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(html).toContain(AUTRE_NOTE.titre);
		expect(html).not.toContain(NOTE.titre);
		/* LE LIEN DE RANGEMENT N'EST PLUS UNE ANCRE VIDE : il porte l'adresse
		   canonique du domaine, composée par la fabrique unique. Le contrôle
		   suit la vue, et il vérifie toujours la même chose — que la ligne
		   « Rangement » parle de la note REÇUE, et non de celle du gel. */
		expect(html).toContain(
			`<a href="${adresseDeDomaine(AUTRE_NOTE.univers, AUTRE_NOTE.domaine)}">${AUTRE_NOTE.domaine}</a>`
		);
	});

	it('rend le corps de la note reçue, rendu par l’implémentation unique', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(REFERENCE_RENDUE.length).toBeGreaterThan(200);
		expect(html).toContain(REFERENCE_RENDUE);
		expect(html).toContain(OPERATIONNEL_RENDU);
	});

	it('rend le contrôle, les dates et la mesure de la note reçue', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		/* Le cartouche : le vérificateur et la date du journal, jamais ceux de la
		   planche — « Karim Belhadj » et « 1er août 2026 » n'apparaissent plus. */
		expect(html).toContain('<strong>Marc Ferreira</strong>');
		expect(html).toContain('5 mars 2026');
		expect(html).not.toContain('1<sup>er</sup> août 2026');
		/* La ligne « Rédaction » et la mesure de consultation. */
		expect(html).toContain('2 mars 2026 à 17:40');
		expect(html).not.toContain('il y a 3 semaines');
		/* LE CUMUL EST CELUI QUE LE CHARGEUR A RELU APRÈS AVOIR COMPTÉ
		   L'OUVERTURE, jamais `Note.vues`, projeté avant elle : les afficher
		   côte à côte donnait un total inférieur à sa propre fenêtre. */
		expect(html).toContain('431 consultations · 7 sur les 30 derniers jours');
		expect(html).not.toContain(`${AUTRE_NOTE.vues} consultations`);
		/* Le sommaire suit le corps affiché, et non les onze titres du gel. */
		expect(html).toContain("Un titre d'épreuve");
		expect(html).not.toContain('s-prerequis');
	});

	it('dit qu’une note n’a jamais été vérifiée plutôt que d’inventer un contrôle', async () => {
		const html = await rendu({ affichee: { ...AFFICHEE, controle: null } });
		expect(html).toContain('Jamais vérifiée');
		expect(html).not.toContain('<strong>Marc Ferreira</strong>');
	});

	/**
	 * P-02 — les sept panneaux latéraux étaient transcrits du gel : deux pièces
	 * jointes, quatre relations, trois rétroliens et quatre vérifications, les
	 * mêmes pour toutes les notes. Sans données, ils DISENT le vide.
	 */
	it('rend les panneaux vides en état neutre, jamais en exemple', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(html).toContain('Aucune pièce jointe');
		expect(html).toContain('Aucune relation');
		expect(html).toContain('Aucun rétrolien');
		expect(html).not.toContain('Plan de reprise — volet bases');
		expect(html).not.toContain('pg-prod-01');
		expect(html).not.toContain("Consignes d'astreinte — nuit et week-end");
		expect(html).not.toContain('Restaurer une sauvegarde MariaDB');
	});

	it('rend les panneaux servis, et rien qu’eux', async () => {
		const html = await rendu({
			affichee: AFFICHEE,
			panneaux: {
				voisines: [],
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
				],
				verifications: [{ par: null, iso: '2026-03-05', jour: '5 mars 2026' }],
				proprietes: []
			}
		});
		expect(html).toContain('Journal');
		expect(html).toContain('pg-prod-02');
		expect(html).toContain('Consignes d’astreinte');
		/* Une attestation que le journal ne rattache à aucun compte est DITE,
		   jamais attribuée (`RG-M15-02`). */
		expect(html).toContain('auteur non journalisé');
		expect(html).not.toContain('Aucune relation');
	});

	it('n’invente aucun corps quand le registre n’existe pas', async () => {
		const html = await rendu({ affichee: { ...AFFICHEE, operationnel: null } });
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

/**
 * LE PANNEAU DE PROPRIÉTÉS ET LA PASTILLE DE TYPE — le huitième panneau que
 * `BRIEF-VUES.md:797` énumère, que le gel ne dessine pas, et sans lequel les
 * propriétés typées d'une fiche ne se relisaient NULLE PART hors de l'éditeur.
 *
 * CE QUE CES CAS NE PROUVENT PAS, et il faut le dire : ils éprouvent le RENDU
 * à partir d'une liste construite ici. Ils ne prouvent rien de la forme que le
 * chargeur produit — l'appariement `champs[i].cle → valeurs[cle]`, l'ordre du
 * référentiel, l'écart d'une colonne `jsonb` de forme non garantie. Cela se
 * mesure sur une base réelle, dans un navigateur, et le relevé du lot le porte.
 */
describe('V-14 — les propriétés typées d’une fiche se relisent', () => {
	/** Une note du corpus qui EST une fiche — le type vient d'elle, pas d'ici. */
	const FICHE = (() => {
		const note = noteParIdentifiant('n-pg-prod-01');
		if (!note?.typeFiche)
			throw new Error('seeds/corpus.ts : « n-pg-prod-01 » n’est plus une fiche');
		return note;
	})();

	const AFFICHEE_FICHE: LectureAffichee = { ...AFFICHEE, note: FICHE };

	const PANNEAUX_VIDES = {
		voisines: [],
		pieces: [],
		relations: [],
		retroliens: [],
		verifications: []
	};

	it('rend la pastille « Fiche <type> », et non le seul type de note', async () => {
		const html = await rendu({ affichee: AFFICHEE_FICHE });
		expect(html).toContain(`<span class="past past--type">${motFiche} ${FICHE.typeFiche}</span>`);
	});

	it('rend les propriétés servies, dans l’ordre reçu', async () => {
		const html = await rendu({
			affichee: AFFICHEE_FICHE,
			panneaux: {
				...PANNEAUX_VIDES,
				proprietes: [
					{ nom: 'Nom DNS', valeur: 'pg-prod-01.interne' },
					{ nom: 'Salle', valeur: 'Datacentre A' }
				]
			}
		});
		expect(html).toContain('Propriétés de fiche');
		expect(html).toContain('pg-prod-01.interne');
		expect(html).toContain('Datacentre A');
		/* L'ORDRE EST MESURÉ DANS LE PANNEAU, et non dans la page : « Salle »
		   est aussi un dossier du rail, et un relevé fait sur la page entière
		   mesurerait la coquille au lieu du panneau. */
		const panneau = html.slice(html.indexOf('Propriétés de fiche'));
		expect(panneau.indexOf('Nom DNS')).toBeLessThan(panneau.indexOf('Salle'));
	});

	/** `RG-M18-03` — l'absence est DITE, jamais comblée par l'exemple du référentiel. */
	it('dit qu’une propriété n’est pas renseignée plutôt que d’inventer une valeur', async () => {
		const html = await rendu({
			affichee: AFFICHEE_FICHE,
			panneaux: { ...PANNEAUX_VIDES, proprietes: [{ nom: 'vCPU', valeur: null }] }
		});
		expect(html).toContain('Non renseignée');
	});

	/**
	 * P-5 — la polarité. Sans ce cas, un panneau rendu inconditionnellement
	 * passerait pour conforme : `BRIEF-VUES.md:797` le borne à « si la note est
	 * une fiche », et une note ordinaire n'a pas de propriétés typées.
	 */
	it('ne rend aucun panneau de propriétés sur une note qui n’est pas une fiche', async () => {
		const html = await rendu({
			affichee: AFFICHEE,
			panneaux: { ...PANNEAUX_VIDES, proprietes: [] }
		});
		expect(AUTRE_NOTE.typeFiche).toBeUndefined();
		expect(html).not.toContain('Propriétés de fiche');
	});
});

describe('V-14 — la propriété absente rend la transcription figée du gel', () => {
	it('rend la note de démonstration, son rangement et son contexte', async () => {
		const html = await rendu({});
		expect(html).toContain(NOTE.titre);
		expect(html).toContain(
			`<a href="${adresseDeDomaine(NOTE.univers, NOTE.domaine)}">Infrastructure</a>`
		);
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
		expect(html).not.toContain(REFERENCE_RENDUE);
	});
});
