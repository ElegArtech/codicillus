/**
 * LES UNITAIRES DE L'IMPORT — ce qui se contrôle SANS base, et pourquoi c'est
 * là que ça se contrôle.
 *
 * Même partage que `signets.test.ts` et `lecture.test.ts` : ce qui exige le
 * conteneur de base est mesuré par les batteries qui construisent le produit.
 * Ici, les DÉCISIONS pures — celles où une erreur est silencieuse parce qu'elle
 * rend un résultat plausible au lieu de lever.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS PROPRIÉTÉS SONT ÉPROUVÉES ICI QU'AUCUNE AUTRE BATTERIE NE PEUT VOIR
 *
 *   1. LE RAPPORT DE SIMULATION EST LE MÊME QUE LE RÉEL. `RG-M12-02` et
 *      `ADR-004` : « un seul chemin de code, donc un rapport de simulation qui
 *      dit RIGOUREUSEMENT ce que fera l'import réel ». C'est une propriété
 *      d'égalité, et elle est vérifiée comme telle : le même plan est exécuté
 *      deux fois sur la même base d'épreuve, et les deux rapports comme les
 *      deux journaux d'écriture sont comparés. Un `if (simulation)` glissé dans
 *      la boucle les ferait diverger.
 *
 *   2. L'ÉTAT DE LA VOIE BUREAUTIQUE A UN CAS D'ÉPREUVE SYNTHÉTIQUE, DANS LES
 *      DEUX SENS. `P-26` : « tout contrôle doit avoir un cas d'épreuve
 *      indépendant de l'état du dépôt ». L'état du service et le verdict de
 *      chaque fichier sont des PARAMÈTRES ici, jamais une lecture du monde : ni
 *      un conteneur arrêté, ni un conteneur qui tourne ne change ce que ces cas
 *      mesurent. C'est ce qui a permis à `T-052` de RETOURNER les cas de
 *      l'indisponibilité sans en perdre un seul.
 *
 *   3. LE LOT NE S'ARRÊTE JAMAIS. `RG-M12-04` : « un fichier en erreur
 *      n'interrompt jamais le lot ». Un lot d'épreuve mêle les six sorts
 *      possibles, et le contrôle porte sur le fait que les fichiers d'APRÈS
 *      l'erreur sont traités — pas seulement sur le compte final.
 */
import { describe, expect, it } from 'vitest';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { dossiers, etiquettes, etiquettesDeNote, notes, typesDeNote } from '../base/schema';
import type { NoteIndexee } from '../recherche/notes-indexees';
import {
	MANQUES_DE_L_IMPORT,
	SERVICE_INJOIGNABLE,
	VOIE_PAR_FORMAT,
	classerLeLot,
	convertirLeLot,
	convertirParLeService,
	detacherLEnTete,
	executerLImport,
	formatDuChemin,
	identifiantLibre,
	libellesDeFormat,
	motifDIndisponibilite,
	segmentsPlafonnes,
	sonderLeServiceDeConversion,
	verdictDuCorps,
	type EtatDuServiceDeConversion,
	type FichierDepose,
	type ResultatDeConversion
} from './import';

/* ═══════════════════════════════════════════ Le catalogue des formats ══ */

describe('le catalogue des formats — STACK §4.6', () => {
	it('range les deux formats textuels dans l’application, jamais dans le service', () => {
		expect(VOIE_PAR_FORMAT.md).toBe('application');
		expect(VOIE_PAR_FORMAT.txt).toBe('application');
	});

	it('range les trois formats bureautiques de la table dans le service', () => {
		expect(VOIE_PAR_FORMAT.docx).toBe('service');
		expect(VOIE_PAR_FORMAT.pptx).toBe('service');
		expect(VOIE_PAR_FORMAT.pdf).toBe('service');
	});

	it('écarte ce que la table de STACK ne porte pas', () => {
		expect(VOIE_PAR_FORMAT.doc).toBe('ecarte');
		expect(VOIE_PAR_FORMAT.xlsx).toBe('ecarte');
		expect(VOIE_PAR_FORMAT.png).toBe('ecarte');
		expect(VOIE_PAR_FORMAT.zip).toBe('ecarte');
	});

	it('reconnaît l’extension quelle que soit sa casse', () => {
		expect(formatDuChemin('Exploitation/Notes.MD')).toBe('md');
		expect(formatDuChemin('a/b/Rapport.PdF')).toBe('pdf');
	});

	it('ne reconnaît pas ce qui n’est pas au catalogue', () => {
		expect(formatDuChemin('archive.rar')).toBeNull();
		expect(formatDuChemin('sans-extension')).toBeNull();
	});

	it('rend la table des libellés entière — un libellé retiré n’est pas un message', () => {
		const libelles = libellesDeFormat();
		for (const format of Object.keys(VOIE_PAR_FORMAT)) {
			expect(libelles[format as keyof typeof VOIE_PAR_FORMAT]).toBeTypeOf('string');
		}
	});
});

/* ═══════════════════════════════════ Le service de conversion — P-10 ═══ */

/** Une réponse de contrôle de santé, telle que le service en rend une. */
function reponseDeSante(corps: unknown, ok = true): Response {
	return {
		ok,
		json: async () => corps
	} as unknown as Response;
}

describe('le service de conversion — P-10, RG-NF-01', () => {
	it('rend un état injoignable quand aucune adresse n’est configurée', async () => {
		const etat = await sonderLeServiceDeConversion(
			(() => {
				throw new Error('ne doit pas être appelé');
			}) as unknown as typeof fetch,
			undefined
		);
		expect(etat).toBe(SERVICE_INJOIGNABLE);
	});

	it('rend un état injoignable quand la requête échoue — jamais une panne', async () => {
		const etat = await sonderLeServiceDeConversion(
			(async () => {
				throw new Error('connexion refusée');
			}) as unknown as typeof fetch,
			'http://conversion:8000'
		);
		expect(etat.joignable).toBe(false);
	});

	it('rend un état injoignable quand le service répond en erreur', async () => {
		const etat = await sonderLeServiceDeConversion(
			(async () => reponseDeSante({}, false)) as unknown as typeof fetch,
			'http://conversion:8000'
		);
		expect(etat.joignable).toBe(false);
	});

	it('relève les versions d’outils que le service déclare', async () => {
		const etat = await sonderLeServiceDeConversion(
			(async () =>
				reponseDeSante({
					outils: { pandoc: '3.10.2', 'python-pptx': null, pdfplumber: '0.11.10' },
					complet: false
				})) as unknown as typeof fetch,
			'http://conversion:8000/'
		);
		expect(etat.joignable).toBe(true);
		expect(etat.complet).toBe(false);
		expect(etat.outils['pandoc']).toBe('3.10.2');
		expect(etat.outils['python-pptx']).toBeNull();
	});

	it('reproche au service arrêté son arrêt, pas ses outils', () => {
		expect(motifDIndisponibilite(SERVICE_INJOIGNABLE, 'docx')).toBe(
			'service-de-conversion-injoignable'
		);
	});

	it('nomme l’outil manquant quand le service répond sans le lecteur du format', () => {
		const partiel: EtatDuServiceDeConversion = {
			joignable: true,
			outils: { pandoc: '3.10.2', 'python-pptx': null, pdfplumber: '0.11.10' },
			complet: false
		};
		expect(motifDIndisponibilite(partiel, 'pptx')).toBe('outil-de-conversion-absent');
		/* Et il ne le reproche qu’au format concerné : c’est une dégradation
		   ciblée, pas une panne d’ensemble. */
		expect(motifDIndisponibilite(partiel, 'docx')).toBeNull();
		expect(motifDIndisponibilite(partiel, 'pdf')).toBeNull();
	});

	it('ferme LES TROIS formats quand l’écrivain manque — T-052', () => {
		/* Pandoc écrit le Markdown des trois formats, y compris de ceux qu’un
		   autre outil LIT (`services/conversion/convertisseurs.py`). Sans lui, le
		   service ne rend rien : le déclarer disponible pour le .pptx serait une
		   promesse que le fichier suivant démentirait. */
		const sansEcrivain: EtatDuServiceDeConversion = {
			joignable: true,
			outils: { pandoc: null, 'python-pptx': '1.0.2', pdfplumber: '0.11.10' },
			complet: false
		};
		expect(motifDIndisponibilite(sansEcrivain, 'docx')).toBe('outil-de-conversion-absent');
		expect(motifDIndisponibilite(sansEcrivain, 'pptx')).toBe('outil-de-conversion-absent');
		expect(motifDIndisponibilite(sansEcrivain, 'pdf')).toBe('outil-de-conversion-absent');
	});

	it('déclare la voie ouverte sur un service joignable et complet — T-052', () => {
		const complet: EtatDuServiceDeConversion = {
			joignable: true,
			outils: { pandoc: '3.10.2', 'python-pptx': '1.0.2', pdfplumber: '0.11.10' },
			complet: true
		};
		/* Avant T-052, cette attente valait `conversion-non-livree` : le point
		   d’entrée n’existait pas. Il existe, et la constante qui le disait a été
		   retirée avec la branche qu’elle gouvernait. */
		for (const format of ['docx', 'pptx', 'pdf'] as const) {
			expect(motifDIndisponibilite(complet, format)).toBeNull();
		}
	});
});

/* ═════════════════════════════ L'appel de conversion — T-052, ADR-004 ══ */

/** Une réponse du point d’entrée de conversion, telle que le service en rend. */
function reponseDeConversion(corps: unknown, ok = true): Response {
	return { ok, json: async () => corps } as unknown as Response;
}

/** Un fichier bureautique déposé, avec ses octets — jamais son texte. */
function docxDepose(chemin = 'Exploitation/Restauration.docx'): FichierDepose {
	return { chemin, octets: 42, texte: null, binaire: new Uint8Array([80, 75, 3, 4]) };
}

const SERVICE_COMPLET: EtatDuServiceDeConversion = {
	joignable: true,
	outils: { pandoc: '3.10.2', 'python-pptx': '1.0.2', pdfplumber: '0.11.10' },
	complet: true
};

describe('l’appel de conversion — ADR-004, RG-M12-04', () => {
	it('rend le Markdown du service, et rien qui ressemble à un document', async () => {
		let vue = '';
		const verdict = await convertirParLeService(
			(async (adresse: string) => {
				vue = String(adresse);
				return reponseDeConversion({
					issue: 'converti',
					format: 'docx',
					markdown: 'du texte',
					images: [],
					avertissements: []
				});
			}) as unknown as typeof fetch,
			'http://conversion:8000',
			docxDepose()
		);
		expect(verdict).toEqual({
			issue: 'converti',
			markdown: 'du texte',
			images: [],
			avertissements: []
		});
		/* Le NOM est envoyé, pas le chemin de partage réseau. */
		expect(vue).toContain('Restauration.docx');
		expect(vue).not.toContain('Exploitation');
	});

	it('ne lève jamais quand le service ne répond pas — RG-M12-04', async () => {
		const verdict = await convertirParLeService(
			(async () => {
				throw new Error('connexion refusée');
			}) as unknown as typeof fetch,
			'http://conversion:8000',
			docxDepose()
		);
		expect(verdict).toEqual({ issue: 'echec', motif: 'service-de-conversion-injoignable' });
	});

	it('ne lève jamais quand le corps n’est pas du JSON — RG-M12-04', async () => {
		const verdict = await convertirParLeService(
			(async () =>
				({
					ok: true,
					json: async () => {
						throw new Error('corps tronqué');
					}
				}) as unknown as Response) as unknown as typeof fetch,
			'http://conversion:8000',
			docxDepose()
		);
		expect(verdict).toEqual({ issue: 'echec', motif: 'contenu-illisible' });
	});

	it('traduit les motifs du service, et ferme la table aux inconnus', () => {
		expect(verdictDuCorps({ issue: 'echec', motif: 'fichier-endommage' })).toEqual({
			issue: 'echec',
			motif: 'fichier-endommage'
		});
		expect(verdictDuCorps({ issue: 'echec', motif: 'fichier-protege' })).toEqual({
			issue: 'echec',
			motif: 'fichier-protege'
		});
		expect(verdictDuCorps({ issue: 'echec', motif: 'delai-depasse' })).toEqual({
			issue: 'echec',
			motif: 'delai-de-conversion-depasse'
		});
		/* Un motif qu’une version ultérieure du service ajouterait ne traverse
		   pas le rapport jusqu’à l’écran : il devient le motif générique. */
		expect(verdictDuCorps({ issue: 'echec', motif: 'quelque-chose-de-neuf' })).toEqual({
			issue: 'echec',
			motif: 'contenu-illisible'
		});
	});

	it('refuse une réponse qui ne porte pas de Markdown — aucune forme supposée', () => {
		expect(verdictDuCorps({ issue: 'converti' })).toEqual({
			issue: 'echec',
			motif: 'contenu-illisible'
		});
		expect(verdictDuCorps(null)).toEqual({ issue: 'echec', motif: 'contenu-illisible' });
		expect(verdictDuCorps('converti')).toEqual({ issue: 'echec', motif: 'contenu-illisible' });
	});

	it('relève les images extraites, et laisse tomber celles qui sont incomplètes', () => {
		const verdict = verdictDuCorps({
			issue: 'converti',
			markdown: 'x',
			images: [
				{ nom: 'media/rId9.png', type_mime: 'image/png', octets: 81, contenu_base64: 'AAAA' },
				{ type_mime: 'image/png', contenu_base64: 'AAAA' },
				'pas un objet'
			],
			avertissements: ['contenu-scanne', 7]
		});
		expect(verdict.issue).toBe('converti');
		if (verdict.issue !== 'converti') return;
		expect(verdict.images).toEqual([
			{ nom: 'media/rId9.png', typeMime: 'image/png', octets: 81, contenuBase64: 'AAAA' }
		]);
		expect(verdict.avertissements).toEqual(['contenu-scanne']);
	});

	it('n’envoie au service QUE les fichiers de la voie « service »', async () => {
		const envoyes: string[] = [];
		const conversions = await convertirLeLot(
			(async (adresse: string) => {
				envoyes.push(String(adresse));
				return reponseDeConversion({ issue: 'converti', markdown: 'x' });
			}) as unknown as typeof fetch,
			'http://conversion:8000',
			[
				{ chemin: 'a/Consignes.md', octets: 42, texte: '# x', binaire: null },
				{ chemin: 'a/Matrice.xlsx', octets: 42, texte: null, binaire: new Uint8Array([1]) },
				{ chemin: 'a/vide.docx', octets: 0, texte: null, binaire: new Uint8Array() },
				docxDepose('a/Restauration.docx')
			],
			SERVICE_COMPLET
		);
		expect(envoyes).toHaveLength(1);
		expect(envoyes[0]).toContain('Restauration.docx');
		expect([...conversions.keys()]).toEqual(['a/Restauration.docx']);
	});

	it('n’envoie rien du tout quand la brique optionnelle est arrêtée — P-10', async () => {
		const conversions = await convertirLeLot(
			(() => {
				throw new Error('ne doit pas être appelé');
			}) as unknown as typeof fetch,
			'http://conversion:8000',
			[docxDepose()],
			SERVICE_INJOIGNABLE
		);
		expect(conversions.size).toBe(0);
	});
});

/* ═══════════════════════════════════════════ L'en-tête de métadonnées ══ */

describe('l’en-tête de métadonnées — RG-M12-05, RG-M12-06, RG-M12-03', () => {
	it('laisse un texte sans en-tête absolument intact', () => {
		const texte = 'Une consigne, et rien de plus.\n\nDeuxième ligne.';
		const lu = detacherLEnTete(texte);
		expect(lu.texte).toBe(texte);
		expect(lu.titre).toBeNull();
		expect(lu.etiquettes).toEqual([]);
	});

	it('laisse intact un en-tête ouvert et jamais refermé', () => {
		const texte = '---\ntitre: Restauration\nune ligne sans fin d’en-tête';
		expect(detacherLEnTete(texte).texte).toBe(texte);
		expect(detacherLEnTete(texte).titre).toBeNull();
	});

	it('lit les trois clés que le gel de V-24 nomme, et retire l’enveloppe', () => {
		const lu = detacherLEnTete(
			'---\ntitre: Restauration\netiquettes: [barman, postgresql]\nvoir: [pg-prod-01]\n---\nLe corps.'
		);
		expect(lu.titre).toBe('Restauration');
		expect(lu.etiquettes).toEqual(['barman', 'postgresql']);
		expect(lu.renvois).toEqual(['pg-prod-01']);
		expect(lu.texte).toBe('Le corps.');
	});

	it('ignore les clés dont aucune source ne donne le nom', () => {
		const lu = detacherLEnTete('---\ntitre: T\nidentifiant: n-quelque-chose\ntype: Fiche\n---\nx');
		expect(lu.titre).toBe('T');
		/* `identifiant` n’est PAS lu : le deviner serait un comblement, et sans
		   lui `RG-M12-01` reste non tenue — c’est écrit au recensement. */
		expect(MANQUES_DE_L_IMPORT.some((m) => m.exigence === 'RG-M12-01')).toBe(true);
	});

	it('accepte une valeur seule là où une liste est attendue', () => {
		expect(detacherLEnTete('---\netiquettes: barman\n---\nx').etiquettes).toEqual(['barman']);
	});
});

/* ═══════════════════════════════════════ Identifiants et profondeur ════ */

describe('l’identifiant lisible — RG-M12-11', () => {
	it('n’écrase jamais un identifiant déjà pris', () => {
		const pris = new Set(['restauration']);
		expect(identifiantLibre('Restauration', pris, 1)).toBe('restauration-2');
	});

	it('cherche jusqu’au premier rang libre', () => {
		const pris = new Set(['restauration', 'restauration-2', 'restauration-3']);
		expect(identifiantLibre('Restauration', pris, 1)).toBe('restauration-4');
	});

	it('retombe sur un identifiant de rang quand le nom ne laisse rien', () => {
		expect(identifiantLibre('!!! ???', new Set(), 7)).toBe('note-7');
	});
});

describe('la profondeur importée — RG-M12-10', () => {
	it('conserve une arborescence qui tient sous le plafond', () => {
		const lu = segmentsPlafonnes('Exploitation/Sauvegardes/Restauration.md', 1);
		expect(lu.segments).toEqual(['Exploitation', 'Sauvegardes']);
		expect(lu.aplatie).toBe(false);
	});

	it('aplatit les niveaux excédentaires et le signale', () => {
		const profond = Array.from({ length: 12 }, (_, i) => `n${i + 1}`).join('/');
		const lu = segmentsPlafonnes(`${profond}/note.md`, 1);
		expect(lu.aplatie).toBe(true);
		/* La racine du domaine occupe le niveau 1 : il reste neuf niveaux. */
		expect(lu.segments).toHaveLength(9);
	});

	it('n’invente aucun dossier quand le point de dépôt est déjà au plafond', () => {
		const lu = segmentsPlafonnes('a/b/note.md', 10);
		expect(lu.segments).toEqual([]);
		expect(lu.aplatie).toBe(true);
	});
});

/* ═══════════════════════════════════════════════ Le classement ═════════ */

const SANS_SERVICE = {
	service: SERVICE_INJOIGNABLE,
	conversions: new Map<string, ResultatDeConversion>(),
	identifiantsPris: new Set<string>(),
	profondeurDeDepart: 1
};

describe('le classement d’un lot — RG-M12-04, et le lot ne s’arrête jamais', () => {
	const LOT: readonly FichierDepose[] = [
		{
			chemin: 'Exploitation/Consignes.md',
			octets: 42,
			texte: '# Consignes\n\nDe nuit.',
			binaire: null
		},
		{ chemin: 'Exploitation/Matrice.xlsx', octets: 42, texte: null, binaire: null },
		{ chemin: 'Exploitation/Restauration.docx', octets: 42, texte: null, binaire: null },
		{ chemin: 'Exploitation/vide.txt', octets: 0, texte: '', binaire: null },
		{ chemin: 'Exploitation/archive.rar', octets: 42, texte: null, binaire: null },
		{ chemin: 'Exploitation/Consignes.md', octets: 42, texte: 'doublon', binaire: null },
		{ chemin: 'Exploitation/illisible.md', octets: 42, texte: null, binaire: null },
		{ chemin: 'Reseau/Adressage.txt', octets: 42, texte: 'Plan.', binaire: null }
	];

	const plan = classerLeLot('épreuve', LOT, SANS_SERVICE);

	it('traite les fichiers qui suivent une erreur — c’est la règle même', () => {
		const dernier = plan.lignes[plan.lignes.length - 1];
		expect(dernier?.chemin).toBe('Reseau/Adressage.txt');
		expect(dernier?.sort).toBe('note');
	});

	it('compte chaque fichier une fois, et rien de plus', () => {
		expect(plan.total).toBe(LOT.length);
		expect(plan.notes + plan.ignores + plan.echecs).toBe(LOT.length);
	});

	it('donne à chaque écart et à chaque échec son motif', () => {
		const motifs = new Map(plan.lignes.map((l) => [l.chemin, l.motif]));
		expect(motifs.get('Exploitation/Matrice.xlsx')).toBe('format-non-converti');
		expect(motifs.get('Exploitation/vide.txt')).toBe('fichier-vide');
		expect(motifs.get('Exploitation/archive.rar')).toBe('format-inconnu');
		expect(motifs.get('Exploitation/illisible.md')).toBe('contenu-illisible');
	});

	it('écarte le second passage d’un même chemin sans écarter le premier', () => {
		const homonymes = plan.lignes.filter((l) => l.chemin === 'Exploitation/Consignes.md');
		expect(homonymes.map((l) => l.sort)).toEqual(['note', 'ignore']);
		expect(homonymes[1]?.motif).toBe('doublon-dans-le-lot');
	});

	it('signale l’indisponibilité de la voie bureautique, sans la simuler', () => {
		const bureautique = plan.lignes.find((l) => l.chemin === 'Exploitation/Restauration.docx');
		expect(bureautique?.voie).toBe('service');
		expect(bureautique?.sort).toBe('echec');
		expect(bureautique?.motif).toBe('service-de-conversion-injoignable');
		/* Et surtout : aucun corps n’a été fabriqué pour lui. */
		expect(bureautique?.corps).toBeNull();
	});

	it('consigne un fichier de la voie service qu’aucun verdict n’accompagne', () => {
		/* Défaut d’enchaînement plutôt que défaut de fichier : le classement le
		   consigne au lieu de lever, parce que RG-M12-04 gouverne aussi les
		   erreurs de l’appelant. */
		const sansVerdict = classerLeLot('épreuve', [docxDepose('a/Restauration.docx')], {
			...SANS_SERVICE,
			service: SERVICE_COMPLET
		});
		expect(sansVerdict.lignes[0]?.sort).toBe('echec');
		expect(sansVerdict.lignes[0]?.motif).toBe('conversion-absente');
	});

	it('n’empêche pas l’import Markdown — RG-NF-01, la dégradation ciblée', () => {
		expect(plan.notes).toBe(2);
	});

	it('fait passer le contenu par le convertisseur unique', () => {
		const note = plan.lignes.find((l) => l.chemin === 'Exploitation/Consignes.md');
		expect(note?.corps).not.toBeNull();
		expect(note?.corps?.type).toBe('doc');
	});

	it('prend le titre du nom de fichier quand l’en-tête n’en donne pas — RG-M12-05', () => {
		const note = plan.lignes.find((l) => l.chemin === 'Reseau/Adressage.txt');
		expect(note?.titre).toBe('Adressage');
		expect(note?.identifiant).toBe('adressage');
	});

	it('prend le titre de l’en-tête quand il en donne un — RG-M12-05', () => {
		const seul = classerLeLot(
			'épreuve',
			[
				{
					chemin: 'Reseau/quelconque.md',
					octets: 42,
					texte: '---\ntitre: Plan d’adressage\netiquettes: [reseau]\n---\nLe corps.',
					binaire: null
				}
			],
			SANS_SERVICE
		);
		expect(seul.lignes[0]?.titre).toBe('Plan d’adressage');
		expect(seul.lignes[0]?.etiquettes).toEqual(['reseau']);
	});

	it('ne reprend pas un identifiant déjà en base — RG-M12-11', () => {
		const seul = classerLeLot(
			'épreuve',
			[{ chemin: 'Adressage.md', octets: 4, texte: 'x', binaire: null }],
			{
				...SANS_SERVICE,
				identifiantsPris: new Set(['adressage'])
			}
		);
		expect(seul.lignes[0]?.identifiant).toBe('adressage-2');
	});

	it('ne prend jamais deux fois le même identifiant dans un seul lot', () => {
		const seul = classerLeLot(
			'épreuve',
			[
				{ chemin: 'a/Adressage.md', octets: 4, texte: 'x', binaire: null },
				{ chemin: 'b/Adressage.md', octets: 4, texte: 'y', binaire: null }
			],
			SANS_SERVICE
		);
		expect(seul.lignes.map((l) => l.identifiant)).toEqual(['adressage', 'adressage-2']);
	});
});

/* ══════════════════════ La voie bureautique disponible — T-052 ═════════ */

/**
 * LES QUATRE SORTIES DU SERVICE SONT CELLES QU'IL A RÉELLEMENT RENDUES.
 *
 * Elles ne sont pas rédigées ici : elles sont recopiées de l'exécution du
 * service dans son conteneur, sur des fichiers d'épreuve fabriqués par Pandoc
 * lui-même — un `.docx` et un `.pptx` écrits depuis un même Markdown source, un
 * PDF de trois lignes, et un PDF sans aucun flux de texte. C'est ce qui distingue
 * ces cas d'une maquette de réponse : ils cassent si le dialecte de sortie du
 * service change, et c'est précisément ce qu'on veut d'eux.
 *
 * Les formes Markdown sont donc dans des littéraux de ce fichier, et il faut le
 * dire : ce fichier ne CONVERTIT rien, il vérifie qu'un texte venu du dehors
 * traverse le convertisseur unique. `ADR-004` n'interdit pas de citer du
 * Markdown, il interdit d'en écrire à partir d'un document canonique.
 */
const SORTIE_DOCX = [
	'# Restauration PostgreSQL',
	'',
	'Procédure de restauration, avec un nom_de_serveur.',
	'',
	'## Prérequis',
	'',
	'- une sauvegarde',
	'- un accès au serveur pg-prod-01',
	''
].join('\n');

const SORTIE_PPTX = ['## Restauration PostgreSQL', '', '- Prérequis', '- pg-prod-01', ''].join(
	'\n'
);

const SORTIE_PDF = [
	'Rotation d’astreinte 2025',
	'',
	'Semaine 1 : pg-prod-01, equipe Exploitation',
	''
].join('\n');

const SORTIE_PDF_SCANNE = 'contenu scanné — transcription manuelle recommandée\n';

function converti(markdown: string, avertissements: readonly string[] = []): ResultatDeConversion {
	return { issue: 'converti', markdown, images: [], avertissements };
}

describe('la voie bureautique, service disponible — M12.1, ADR-004', () => {
	const LOT: readonly FichierDepose[] = [
		docxDepose('Exploitation/Restauration PostgreSQL.docx'),
		{
			chemin: 'Supervision/Tableau de bord.pptx',
			octets: 99,
			texte: null,
			binaire: new Uint8Array([1])
		},
		{
			chemin: 'Astreinte/Rotation 2025.pdf',
			octets: 99,
			texte: null,
			binaire: new Uint8Array([1])
		},
		{
			chemin: 'VPN/Certificats scannes.pdf',
			octets: 99,
			texte: null,
			binaire: new Uint8Array([1])
		},
		{
			chemin: 'Procedures/Tests trimestriels.docx',
			octets: 99,
			texte: null,
			binaire: new Uint8Array([1])
		},
		{ chemin: 'VPN/Certificats.pdf', octets: 99, texte: null, binaire: new Uint8Array([1]) },
		{ chemin: 'Procedures/Annexes.pdf', octets: 99, texte: null, binaire: new Uint8Array([1]) },
		{ chemin: 'Astreinte/Numéros utiles.txt', octets: 12, texte: 'Le standard.', binaire: null }
	];

	const plan = classerLeLot('épreuve', LOT, {
		...SANS_SERVICE,
		service: SERVICE_COMPLET,
		conversions: new Map<string, ResultatDeConversion>([
			['Exploitation/Restauration PostgreSQL.docx', converti(SORTIE_DOCX)],
			['Supervision/Tableau de bord.pptx', converti(SORTIE_PPTX)],
			['Astreinte/Rotation 2025.pdf', converti(SORTIE_PDF)],
			['VPN/Certificats scannes.pdf', converti(SORTIE_PDF_SCANNE, ['contenu-scanne'])],
			['Procedures/Tests trimestriels.docx', { issue: 'echec', motif: 'fichier-endommage' }],
			['VPN/Certificats.pdf', { issue: 'echec', motif: 'fichier-protege' }],
			['Procedures/Annexes.pdf', { issue: 'echec', motif: 'delai-de-conversion-depasse' }]
		])
	});

	const ligne = (chemin: string) => plan.lignes.find((l) => l.chemin === chemin);

	it('fait des notes des trois formats bureautiques — STACK §4.6', () => {
		for (const chemin of [
			'Exploitation/Restauration PostgreSQL.docx',
			'Supervision/Tableau de bord.pptx',
			'Astreinte/Rotation 2025.pdf'
		]) {
			expect(ligne(chemin)?.sort).toBe('note');
			expect(ligne(chemin)?.corps).not.toBeNull();
		}
	});

	it('fait passer le Markdown du service par le convertisseur UNIQUE — ADR-004', () => {
		/* Le corps est un document validé par `analyserDocument`, que seul
		   `analyserMarkdown` produit dans ce dépôt. Le service n’en a jamais
		   fabriqué : il a rendu du texte. */
		const note = ligne('Exploitation/Restauration PostgreSQL.docx');
		expect(note?.corps?.type).toBe('doc');
		expect(note?.corps?.content?.length).toBeGreaterThan(3);
	});

	it('prend le titre du nom du fichier bureautique — RG-M12-05', () => {
		expect(ligne('Exploitation/Restauration PostgreSQL.docx')?.titre).toBe(
			'Restauration PostgreSQL'
		);
		expect(ligne('Exploitation/Restauration PostgreSQL.docx')?.identifiant).toBe(
			'restauration-postgresql'
		);
	});

	it('crée la note d’un PDF sans texte, avec son avertissement — M12.1', () => {
		const scanne = ligne('VPN/Certificats scannes.pdf');
		/* LA NOTE EST CRÉÉE : ce n’est pas un échec, et ce n’est pas une
		   reconnaissance de caractères — « hors périmètre » (STACK §4.6). */
		expect(scanne?.sort).toBe('note');
		expect(scanne?.avertissements).toEqual(['contenu-scanne']);
		/* Et l’avertissement est DANS le corps, en français, pas seulement en
		   code : c’est ce que M12.1 demande de la note. */
		expect(JSON.stringify(scanne?.corps)).toContain('contenu scanné');
	});

	it('consigne chaque fichier en erreur avec SON motif — RG-M12-04', () => {
		expect(ligne('Procedures/Tests trimestriels.docx')?.motif).toBe('fichier-endommage');
		expect(ligne('VPN/Certificats.pdf')?.motif).toBe('fichier-protege');
		expect(ligne('Procedures/Annexes.pdf')?.motif).toBe('delai-de-conversion-depasse');
		for (const chemin of [
			'Procedures/Tests trimestriels.docx',
			'VPN/Certificats.pdf',
			'Procedures/Annexes.pdf'
		]) {
			expect(ligne(chemin)?.sort).toBe('echec');
			expect(ligne(chemin)?.corps).toBeNull();
		}
	});

	it('N’INTERROMPT PAS LE LOT sur trois fichiers en erreur — RG-M12-04', () => {
		/* Le dernier fichier du lot vient APRÈS les trois erreurs, et il est
		   traité : c’est la règle même, et le compte final ne suffirait pas à le
		   prouver. */
		const dernier = plan.lignes[plan.lignes.length - 1];
		expect(dernier?.chemin).toBe('Astreinte/Numéros utiles.txt');
		expect(dernier?.sort).toBe('note');
		expect(plan.total).toBe(LOT.length);
		expect(plan.notes).toBe(5);
		expect(plan.echecs).toBe(3);
	});

	it('porte les images extraites jusqu’au plan, sans les écrire — RG-M12-07', () => {
		const avecImage = classerLeLot('épreuve', [docxDepose('a/Avec image.docx')], {
			...SANS_SERVICE,
			service: SERVICE_COMPLET,
			conversions: new Map<string, ResultatDeConversion>([
				[
					'a/Avec image.docx',
					{
						issue: 'converti',
						markdown: 'Un texte.\n',
						images: [
							{
								nom: 'media/rId9.png',
								typeMime: 'image/png',
								octets: 81,
								contenuBase64: 'AAAA'
							}
						],
						avertissements: []
					}
				]
			])
		});
		expect(avecImage.lignes[0]?.images).toHaveLength(1);
		expect(avecImage.lignes[0]?.images[0]?.nom).toBe('media/rId9.png');
	});
});

/* ═══════════════════════════════════════════════ L'exécution ═══════════ */

/**
 * UNE BASE D'ÉPREUVE — un journal des écritures, et rien qui ressemble à un
 * moteur.
 *
 * Elle existe pour une seule question, et c'est celle que rien d'autre ne peut
 * poser : la simulation fait-elle EXACTEMENT le même travail que le réel ? La
 * réponse se lit dans le journal, pas dans un compteur.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ELLE PORTE DÉSORMAIS UN ÉTAT, ET C'EST `RG-M12-08` QUI L'EXIGE — `T-075`
 *
 * `executerLImport()` entretient l'index APRÈS sa transaction, et le geste RELIT
 * LA BASE plutôt que de croire le plan (`../recherche/entretien.ts`). Une base
 * d'épreuve sans mémoire rendrait donc le même résultat en simulation et en
 * réel pour la mauvaise raison — elle ne porterait jamais rien —, et le contrôle
 * serait inerte au sens de `P-26`.
 *
 * Elle tient donc les dossiers et les notes que l'import écrit, et elle les REND
 * quand la transaction est validée, jamais quand elle est annulée. C'est le
 * minimum sans lequel la question « la note créée entre-t-elle dans l'index ? »
 * n'a pas de réponse mesurable ici.
 */
function baseDEpreuve(): {
	readonly base: Base;
	readonly journal: readonly string[];
	transactions(): number;
	annulations(): number;
} {
	const journal: string[] = [];
	let transactions = 0;
	let annulations = 0;
	let rang = 0;

	/* L'ÉTAT — ce que la transaction a écrit, et qu'elle rend si elle est
	   validée. `racine-1` est le dossier de la cible, seule racine de l'arbre. */
	let arbre: { id: string; parentId: string | null }[] = [{ id: 'racine-1', parentId: null }];
	let notesEnBase: Record<string, unknown>[] = [];

	const lire = (table: unknown, colonnes: Record<string, unknown>): unknown[] => {
		if (table === typesDeNote) return [{ id: 'type-note' }];
		if (table === dossiers) {
			/* La PROJECTION lit l'arbre — `{ id, parentId }` ; `dossierDuSegment()`
			   lit un dossier précis et ne demande que `id`. Les deux requêtes se
			   distinguent par leurs colonnes, non par un ordre d'appel. */
			return 'parentId' in colonnes ? arbre : [];
		}
		if (table === notes) {
			/* Le socle de `projeterLeCorpus()` demande le corps ; `identifiantsPris()`
			   ne demande que l'identifiant. */
			if ('corpsReference' in colonnes) return notesEnBase;
			return 'identifiant' in colonnes ? [{ identifiant: 'deja-pris' }] : [];
		}
		return [];
	};

	const selection = (colonnes: Record<string, unknown>) => {
		let table: unknown = null;
		const chaine: Record<string, unknown> = {
			from(t: unknown) {
				table = t;
				return chaine;
			},
			innerJoin: () => chaine,
			leftJoin: () => chaine,
			orderBy: () => chaine,
			where: () => chaine,
			limit: () => chaine,
			then: (suite: (v: unknown) => unknown, echec?: (e: unknown) => unknown) =>
				Promise.resolve(lire(table, colonnes)).then(suite, echec)
		};
		return chaine;
	};

	const nomDe = (table: unknown): string =>
		table === dossiers
			? 'dossier'
			: table === notes
				? 'note'
				: table === etiquettes
					? 'etiquette'
					: table === etiquettesDeNote
						? 'liaison'
						: 'inconnue';

	const insertion = (table: unknown) => ({
		values(v: Record<string, unknown>) {
			rang += 1;
			const identite = String(v['identifiant'] ?? v['libelle'] ?? v['nom'] ?? v['ordre'] ?? '');
			journal.push(`insert ${nomDe(table)} ${identite}`);
			const id = `${nomDe(table)}-${rang}`;
			const rendu = [{ id }];
			/* L'ÉTAT SUIT L'ÉCRITURE — sans quoi la projection d'après transaction
			   ne verrait jamais ce que l'import vient d'écrire. */
			if (table === dossiers) {
				arbre = [...arbre, { id, parentId: String(v['parentId']) }];
			}
			if (table === notes) {
				notesEnBase = [
					...notesEnBase,
					{
						identifiant: v['identifiant'],
						titre: v['titre'],
						corpsReference: v['corpsReference'],
						typeNom: 'Procédure',
						typeFicheNom: null,
						universNom: 'Production',
						domaineNom: 'Exploitation',
						dossierId: v['dossierId'],
						auteurNom: 'Compte d’épreuve',
						visibilite: 'interne',
						statut: 'publiee',
						modifieLe: new Date('2026-08-20T00:00:00Z'),
						verifieLe: null,
						consultations: 0
					}
				];
			}
			return {
				returning: () => Promise.resolve(rendu),
				then: (suite: (v: unknown) => unknown) => Promise.resolve(rendu).then(suite)
			};
		}
	});

	const base = {
		select: selection,
		insert: insertion,
		update: (table: unknown) => ({
			set(v: Record<string, unknown>) {
				journal.push(`update ${nomDe(table)} ${String(v['titre'] ?? '')}`);
				return { where: () => Promise.resolve([]) };
			}
		}),
		delete: (table: unknown) => {
			journal.push(`delete ${nomDe(table)}`);
			return { where: () => Promise.resolve([]) };
		},
		async transaction(corps: (tx: unknown) => Promise<void>) {
			transactions += 1;
			/* L'ANNULATION REND L'ÉTAT — c'est ce qui fait qu'une simulation ne
			   laisse rien derrière elle, et donc que l'entretien de l'index ne
			   trouve rien à écrire. Le journal, lui, n'est PAS rendu : il porte
			   ce qui a été tenté, et c'est sa raison d'être. */
			const arbreAvant = arbre;
			const notesAvant = notesEnBase;
			try {
				await corps(base);
			} catch (erreur) {
				annulations += 1;
				arbre = arbreAvant;
				notesEnBase = notesAvant;
				throw erreur;
			}
		}
	};

	return {
		base: base as unknown as Base,
		journal,
		transactions: () => transactions,
		annulations: () => annulations
	};
}

/**
 * UN MOTEUR D'ÉPREUVE — il retient ce qu'on lui écrit, et rien de plus.
 *
 * `RG-M12-08` se mesure sur ce qui ENTRE dans l'index, pas sur un booléen du
 * rapport. Ce faux moteur porte donc les deux gestes que `entretenirLIndex()`
 * emploie, et chacun rend une tâche ENFILÉE : depuis `ARB-060`, l'entretien
 * SOUMET et n'attend pas — c'est l'enfilement qu'il attend, donc c'est lui que
 * le faux moteur doit rendre. `waitTask` reste posé, et reste sans appelant sur
 * ce chemin : il est conservé pour que la forme du faux moteur reste celle du
 * client réel, jamais parce que l'import s'en sert.
 */
function moteurDEpreuve(): {
	readonly client: Meilisearch;
	/** Les identifiants écrits dans l'index, dans l'ordre des appels. */
	readonly ecrites: string[];
	/** Les identifiants retirés de l'index. */
	readonly retirees: string[];
	/** Ce que la dernière écriture a porté comme périmètre, par identifiant. */
	readonly perimetres: Map<string, { dossier: string; ancetres: readonly string[] }>;
} {
	const ecrites: string[] = [];
	const retirees: string[] = [];
	const perimetres = new Map<string, { dossier: string; ancetres: readonly string[] }>();
	let dernierUid = 0;
	const tache = (type: string) => {
		dernierUid += 1;
		return Object.assign(Promise.resolve({ taskUid: dernierUid }), {
			waitTask: async () => ({ status: 'succeeded', type })
		});
	};
	const client = {
		index: () => ({
			addDocuments(entrees: NoteIndexee[]) {
				for (const e of entrees) {
					ecrites.push(e.id);
					perimetres.set(e.id, { dossier: e.dossier, ancetres: e.ancetres });
				}
				return tache('documentAdditionOrUpdate');
			},
			deleteDocuments(ids: string[]) {
				retirees.push(...ids);
				return tache('documentDeletion');
			}
		})
	};
	return { client: client as unknown as Meilisearch, ecrites, retirees, perimetres };
}

const CIBLE = { domaineId: 'dom-1', dossierId: 'racine-1', auteurId: 'compte-1' };

describe('l’exécution d’un lot — RG-M12-02, un seul chemin de code', () => {
	const plan = classerLeLot(
		'épreuve',
		[
			{
				chemin: 'Exploitation/Sauvegardes/Restauration.md',
				octets: 42,
				texte:
					'---\ntitre: Restauration\netiquettes: [barman]\nvoir: [deja-pris, inconnue]\n---\nLe corps.',
				binaire: null
			},
			{ chemin: 'Exploitation/Matrice.xlsx', octets: 42, texte: null, binaire: null },
			{ chemin: 'Reseau/Adressage.txt', octets: 42, texte: 'Plan.', binaire: null }
		],
		SANS_SERVICE
	);

	it('écrit, compte, puis annule — et le rapport est le même des deux côtés', async () => {
		const reel = baseDEpreuve();
		const rapportReel = await executerLImport(reel.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});

		const simule = baseDEpreuve();
		const rapportSimule = await executerLImport(simule.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: true,
			profondeurDeDepart: 1
		});

		/* LA propriété : les deux journaux d’écriture sont identiques. Un
		   `if (simulation)` glissé dans la boucle les ferait diverger, et c’est
		   le seul contrôle qui le verrait. */
		expect(simule.journal).toEqual(reel.journal);
		expect({ ...rapportSimule, simulation: false }).toEqual(rapportReel);
	});

	it('n’annule la transaction QUE en simulation', async () => {
		const reel = baseDEpreuve();
		await executerLImport(reel.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		expect(reel.transactions()).toBe(1);
		expect(reel.annulations()).toBe(0);

		const simule = baseDEpreuve();
		await executerLImport(simule.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: true,
			profondeurDeDepart: 1
		});
		expect(simule.transactions()).toBe(1);
		expect(simule.annulations()).toBe(1);
	});

	it('n’avale pas une vraie panne de transaction', async () => {
		const cassee = {
			transaction: async () => {
				throw new Error('la base a rompu');
			}
		} as unknown as Base;
		await expect(
			executerLImport(cassee, moteurDEpreuve().client, CIBLE, plan, {
				simulation: true,
				profondeurDeDepart: 1
			})
		).rejects.toThrow('la base a rompu');
	});

	it('crée les dossiers de l’arborescence, du plus haut au plus bas', async () => {
		const essai = baseDEpreuve();
		const rapport = await executerLImport(essai.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		expect(essai.journal.filter((l) => l.startsWith('insert dossier'))).toHaveLength(3);
		expect(rapport.dossiersCrees).toBe(3);
	});

	it('rattache les étiquettes déclarées — RG-M12-06', async () => {
		const essai = baseDEpreuve();
		await executerLImport(essai.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		expect(essai.journal).toContain('insert etiquette barman');
		expect(essai.journal.filter((l) => l.startsWith('insert liaison'))).toHaveLength(1);
	});

	it('consigne les renvois qu’aucune note ne résout, et seulement ceux-là', async () => {
		const essai = baseDEpreuve();
		const rapport = await executerLImport(essai.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		const ligne = rapport.lignes.find((l) => l.chemin.endsWith('Restauration.md'));
		/* `deja-pris` est en base d’épreuve, `inconnue` ne l’est nulle part. */
		expect(ligne?.renvoisNonResolus).toEqual(['inconnue']);
	});

	it('reporte au rapport les fichiers écartés, avec leur motif', async () => {
		const essai = baseDEpreuve();
		const rapport = await executerLImport(essai.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		expect(rapport.total).toBe(3);
		expect(rapport.notesCreees).toBe(2);
		expect(rapport.ignores).toBe(1);
		expect(rapport.lignes.find((l) => l.chemin.endsWith('.xlsx'))?.motif).toBe(
			'format-non-converti'
		);
	});

	it('déclare ce qu’il n’a pas fait plutôt que de le taire', async () => {
		const essai = baseDEpreuve();
		const rapport = await executerLImport(essai.base, moteurDEpreuve().client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		/* `RG-M12-09` — aucune table d’imports n’existe, et le rapport le dit. */
		expect(rapport.journalEnregistre).toBe(false);
	});

	/* ── `RG-M12-08` — l’index suit le lot, et il le suit VRAIMENT (`T-075`) ── */

	it('écrit dans l’index les notes qu’il a créées, avec leur périmètre', async () => {
		const essai = baseDEpreuve();
		const moteur = moteurDEpreuve();
		const rapport = await executerLImport(essai.base, moteur.client, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});

		const attendues = rapport.lignes
			.filter((l) => l.sort === 'note')
			.map((l) => l.identifiant)
			.sort();
		expect(attendues).toHaveLength(2);
		expect([...moteur.ecrites].sort()).toEqual(attendues);
		expect(moteur.retirees).toEqual([]);
		expect(rapport.indexeALaRecherche).toBe(true);

		/* LE PÉRIMÈTRE EST CELUI DU DOSSIER OÙ LA NOTE A ATTERRI, et la chaîne
		   d’ancêtres remonte jusqu’à la racine de la cible. Une entrée sans
		   périmètre est un document public (`ADR-006`) : le contrôle porte donc
		   sur la chaîne, pas sur la seule présence de l’identifiant. */
		for (const identifiant of attendues) {
			const perimetre = moteur.perimetres.get(identifiant as string);
			expect(perimetre).toBeDefined();
			expect(perimetre?.ancetres.length).toBeGreaterThan(0);
			expect(perimetre?.ancetres[0]).toBe(perimetre?.dossier);
			expect(perimetre?.ancetres).toContain(CIBLE.dossierId);
		}
	});

	it('n’écrit RIEN dans l’index quand la transaction a été annulée — la simulation', async () => {
		const essai = baseDEpreuve();
		const moteur = moteurDEpreuve();
		const rapport = await executerLImport(essai.base, moteur.client, CIBLE, plan, {
			simulation: true,
			profondeurDeDepart: 1
		});

		/* La polarité inverse de l’essai précédent, et c’est elle qui prouve que
		   l’entretien LIT LA BASE au lieu de croire le plan : les mêmes lignes de
		   rapport, le même nombre de notes, et pourtant aucune entrée écrite. */
		expect(moteur.ecrites).toEqual([]);
		expect([...moteur.retirees].sort()).toEqual(
			rapport.lignes
				.filter((l) => l.sort === 'note')
				.map((l) => l.identifiant)
				.sort()
		);
		/* Le geste a bien été tenté pour chacune — c’est ce que le champ mesure. */
		expect(rapport.indexeALaRecherche).toBe(true);
	});
});

describe('le recensement des manques', () => {
	it('nomme une exigence, ce qui manque et pourquoi — jamais une seule des trois', () => {
		expect(MANQUES_DE_L_IMPORT.length).toBeGreaterThan(0);
		for (const manque of MANQUES_DE_L_IMPORT) {
			expect(manque.exigence).not.toBe('');
			expect(manque.ceQuiManque).not.toBe('');
			expect(manque.motif).not.toBe('');
		}
	});
});
