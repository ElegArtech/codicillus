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
	DOMAINES,
	MOI,
	noteParIdentifiant,
	UNIVERS,
	type Note,
	type UtilisateurCourant
} from '../../seeds/corpus';
import { documentDuGel, resoudreDansLeCorpus } from '../lib/contenu/documents-du-gel';
import { rendreDocument } from '../lib/contenu/rendu';
import type { LectureAffichee } from '../lib/lecture/note-de-demonstration';
import { adresseDeDomaine } from '../lib/rangement/adresses';
import { VOCABULAIRE_PAR_DEFAUT } from '../lib/vocabulaire';

const NOTES = corpusPourVue('V-14');

/** LA NOTE DU JEU DE DÉMONSTRATION — celle qui ne doit plus jamais paraître. */
const NOTE_DU_GEL = (() => {
	const note = noteParIdentifiant('n-restaurer-pg');
	if (!note) throw new Error('seeds/corpus.ts : « n-restaurer-pg » a disparu');
	return note;
})();

const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

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

/** Les sept panneaux latéraux, tous vides — l'état que la vue doit DIRE. */
const PANNEAUX_VIDES = {
	voisines: [],
	pieces: [],
	relations: [],
	retroliens: [],
	verifications: [],
	proprietes: []
};

/**
 * LE SOCLE DE PROPRIÉTÉS REQUISES. La note affichée, les panneaux et l'adresse
 * des relations ne sont plus optionnels : leur absence rendait la transcription
 * figée du gel et ses sept panneaux transcrits, et c'était le défaut.
 */
function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-14', {
		vecteur: null,
		notes: NOTES,
		affichee: AFFICHEE,
		panneaux: PANNEAUX_VIDES,
		adresseDesRelations: `/notes/${AUTRE_NOTE.id}/relations`,
		...proprietes
	});
}

afterAll(fermerLeHarnais);

describe('V-14 — la propriété fournie l’emporte', () => {
	it('sert le compte reçu, et non celui du jeu de semence', async () => {
		const html = await rendu({ compte: SOPHIE });
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	/**
	 * V-14 est la SEULE vue de forme COMPLÈTE de ce lot : son rail se dérive du
	 * corpus, `univers` et `domaines` y ont donc un effet observable — ce qui
	 * n'est pas le cas des quatre vues abrégées (`Coquille.svelte` le dit).
	 */
	it('dérive son rail des univers et domaines reçus, et de rien d’autre', async () => {
		/* Le titre d'une section du rail est un LIEN vers la page de son univers
		   depuis qu'un univers sans domaine doit pouvoir s'atteindre. LE RELEVÉ
		   SE FAIT DANS LE RAIL, et non dans la page : le fil d'Ariane porte le
		   même lien pour l'univers de la note, et un relevé fait sur la page
		   entière mesurerait le fil au lieu du rail. */
		const titre = (nom: string) => `href="/univers/${nom.toLowerCase()}">${nom}</a>`;
		const rail = (html: string) => /<aside class="rail"[\s\S]*?<\/aside>/.exec(html)?.[0] ?? '';

		/* SANS UNIVERS SERVI, LE RAIL EST VIDE. Le défaut était `UNIVERS` du jeu
		   de démonstration : une instance neuve — zéro univers, l'état normal au
		   premier démarrage — voyait l'arborescence des maquettes, et des
		   adresses qui rendent 404. */
		const vide = rail(await rendu({}));
		expect(vide).not.toContain(titre('Production'));
		expect(vide).not.toContain(titre('Projets'));

		const deux = rail(await rendu({ univers: UNIVERS, domaines: DOMAINES }));
		expect(deux).toContain(titre('Production'));
		expect(deux).toContain(titre('Projets'));

		const html = rail(
			await rendu({
				univers: UNIVERS.filter((u) => u.nom === 'Production'),
				domaines: DOMAINES
			})
		);
		expect(html).toContain(titre('Production'));
		expect(html).not.toContain(titre('Projets'));
	});

	it('rend la note reçue — titre, rangement et pièces jointes', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(html).toContain(AUTRE_NOTE.titre);
		expect(html).not.toContain(NOTE_DU_GEL.titre);
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

	it('rend la pastille « Fiche <type> », et non le seul type de note', async () => {
		const html = await rendu({ affichee: AFFICHEE_FICHE });
		/* LE MOT VIENT DE SA SOURCE, PAS D'UN LITTÉRAL. `NoteDeDemonstration` le
		   lit sur le contexte de coquille ; rendue hors gabarit racine, la vue
		   retombe sur `VOCABULAIRE_PAR_DEFAUT` — la même valeur que le repli du
		   gel, et la seule que ce rendu puisse porter. */
		expect(html).toContain(
			`<span class="past past--type">${VOCABULAIRE_PAR_DEFAUT.fiche} ${FICHE.typeFiche}</span>`
		);
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

/**
 * LE MOTIF EST RETIRÉ, ET C'EST CE QUE CETTE SECTION MESURE.
 *
 * Chaque propriété de contexte portait pour DÉFAUT une constante du jeu de
 * démonstration, et la note affichée était optionnelle : une route qui les
 * oubliait servait l'article de « Restaurer une sauvegarde PostgreSQL », le
 * compte « Karim Belhadj », la version `1.0.0` d'`INSTANCE` et les sept
 * panneaux transcrits du gel — SANS QUE RIEN NE PROTESTE. Quatre campagnes ont
 * couru après les symptômes de ce défaut-là.
 *
 * `affichee`, `panneaux` et `adresseDesRelations` sont désormais REQUISES : une
 * route qui les oublierait ne compilerait plus. Le contexte, que le gabarit
 * racine porte, rend VIDE.
 */
describe('V-14 — rien du jeu de démonstration ne subsiste au défaut', () => {
	it('ne nomme aucun compte du jeu quand aucun ne lui est servi', async () => {
		const html = await rendu({});
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('ne rend ni la note du gel, ni son rangement, ni ses corps transcrits', async () => {
		const html = await rendu({});
		expect(html).not.toContain(NOTE_DU_GEL.titre);
		expect(html).not.toContain(
			`<a href="${adresseDeDomaine(NOTE_DU_GEL.univers, NOTE_DU_GEL.domaine)}">Infrastructure</a>`
		);
		expect(html).not.toContain('id="s-restaurer"');
		expect(html).not.toContain('id="o-preparer"');
	});
});

/**
 * LE PANNEAU « POSITION » — LE LIBELLÉ D'UNE NOTE VOISINE, ET LE JUMEAU NON
 * RAPPORTÉ DE LA FRAÎCHEUR MENSONGÈRE.
 *
 * `libelleCompactDe()` construisait un objet littéral SANS `revise`. Le champ
 * est optionnel dans `EtatDeFraicheur` et sa garde est stricte : `undefined` ne
 * la déclenchait pas, et une note voisine JAMAIS VÉRIFIÉE lisait « il y a
 * 3 mois » là où la note principale, sur la même page, dit « Jamais vérifiée ».
 * Le type ne pouvait pas protester — c'est ce qui a laissé passer le défaut.
 */
describe('V-14 — la fraîcheur d’une note voisine ne ment pas', () => {
	const VOISINE = {
		identifiant: 'n-voisine',
		sens: '←' as const,
		titre: 'La note qui précède',
		fraicheur: 'vieil' as const,
		jours: 92,
		revise: '2026-05-25'
	};

	it('rend le libellé compact d’une voisine vérifiée', async () => {
		const html = await rendu({
			panneaux: { ...PANNEAUX_VIDES, voisines: [VOISINE] }
		});
		expect(html).toContain('il y a 3 mois');
		expect(html).not.toContain('>jamais<');
	});

	it('dit « jamais » d’une voisine que personne n’a jamais vérifiée', async () => {
		const html = await rendu({
			panneaux: { ...PANNEAUX_VIDES, voisines: [{ ...VOISINE, revise: null }] }
		});
		expect(html).toContain('>jamais<');
		expect(html).not.toContain('il y a 3 mois');
	});
});

/**
 * LE PANNEAU D'ERREUR PERMANENT — retiré, avec la maquette qui le portait.
 *
 * « Statistiques indisponibles / Le service de mesure ne répond pas » était
 * rendu SANS CONDITION sur chaque note, avec un bouton « Réessayer » inerte, et
 * 300 px au-dessus d'un compteur de consultations qui fonctionne.
 */
describe('V-14 — aucun panneau n’annonce une panne qui n’a pas eu lieu', () => {
	it('ne rend plus « Statistiques indisponibles » ni son bouton inerte', async () => {
		const html = await rendu({ affichee: AFFICHEE });
		expect(html).not.toContain('Statistiques indisponibles');
		expect(html).not.toContain('Le service de mesure ne répond pas');
		expect(html).not.toContain('Réessayer');
		expect(html).not.toContain('panneau--erreur');
		/* Le compteur, lui, reste — c'est lui que le panneau contredisait. */
		expect(html).toContain('431 consultations · 7 sur les 30 derniers jours');
	});
});
