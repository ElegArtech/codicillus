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
 *   2. L'INDISPONIBILITÉ DE LA VOIE BUREAUTIQUE A UN CAS D'ÉPREUVE
 *      SYNTHÉTIQUE. `P-26` : « tout contrôle doit avoir un cas d'épreuve
 *      indépendant de l'état du dépôt ». Le service de conversion est absent
 *      aujourd'hui ; le jour où `T-042` le livrera, les trois causes
 *      d'indisponibilité resteront éprouvées, parce que l'état du service est
 *      un PARAMÈTRE ici, jamais une lecture du monde.
 *
 *   3. LE LOT NE S'ARRÊTE JAMAIS. `RG-M12-04` : « un fichier en erreur
 *      n'interrompt jamais le lot ». Un lot d'épreuve mêle les six sorts
 *      possibles, et le contrôle porte sur le fait que les fichiers d'APRÈS
 *      l'erreur sont traités — pas seulement sur le compte final.
 */
import { describe, expect, it } from 'vitest';
import type { Base } from '../base/acces';
import { dossiers, etiquettes, etiquettesDeNote, notes, typesDeNote } from '../base/schema';
import {
	CONVERSION_LIVREE,
	MANQUES_DE_L_IMPORT,
	SERVICE_INJOIGNABLE,
	VOIE_PAR_FORMAT,
	classerLeLot,
	detacherLEnTete,
	executerLImport,
	formatDuChemin,
	identifiantLibre,
	libellesDeFormat,
	motifDIndisponibilite,
	segmentsPlafonnes,
	sonderLeServiceDeConversion,
	type EtatDuServiceDeConversion,
	type FichierDepose
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

	it('nomme l’outil manquant quand le service répond sans lui', () => {
		const partiel: EtatDuServiceDeConversion = {
			joignable: true,
			outils: { pandoc: null, 'python-pptx': '1.0.2', pdfplumber: '0.11.10' },
			complet: false
		};
		expect(motifDIndisponibilite(partiel, 'docx')).toBe('outil-de-conversion-absent');
		/* Et il ne le reproche qu’au format concerné : c’est une dégradation
		   ciblée, pas une panne d’ensemble. */
		expect(motifDIndisponibilite(partiel, 'pptx')).toBe('conversion-non-livree');
	});

	it('déclare le point d’entrée non livré sur un service pourtant complet', () => {
		const complet: EtatDuServiceDeConversion = {
			joignable: true,
			outils: { pandoc: '3.10.2', 'python-pptx': '1.0.2', pdfplumber: '0.11.10' },
			complet: true
		};
		/* Le jour où T-042 livre, cette attente change AVEC la constante — et
		   c’est le seul endroit du dépôt où le fait est écrit. */
		expect(CONVERSION_LIVREE).toBe(false);
		expect(motifDIndisponibilite(complet, 'pdf')).toBe('conversion-non-livree');
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
	identifiantsPris: new Set<string>(),
	profondeurDeDepart: 1
};

describe('le classement d’un lot — RG-M12-04, et le lot ne s’arrête jamais', () => {
	const LOT: readonly FichierDepose[] = [
		{ chemin: 'Exploitation/Consignes.md', octets: 42, texte: '# Consignes\n\nDe nuit.' },
		{ chemin: 'Exploitation/Matrice.xlsx', octets: 42, texte: null },
		{ chemin: 'Exploitation/Restauration.docx', octets: 42, texte: null },
		{ chemin: 'Exploitation/vide.txt', octets: 0, texte: '' },
		{ chemin: 'Exploitation/archive.rar', octets: 42, texte: null },
		{ chemin: 'Exploitation/Consignes.md', octets: 42, texte: 'doublon' },
		{ chemin: 'Exploitation/illisible.md', octets: 42, texte: null },
		{ chemin: 'Reseau/Adressage.txt', octets: 42, texte: 'Plan.' }
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
					texte: '---\ntitre: Plan d’adressage\netiquettes: [reseau]\n---\nLe corps.'
				}
			],
			SANS_SERVICE
		);
		expect(seul.lignes[0]?.titre).toBe('Plan d’adressage');
		expect(seul.lignes[0]?.etiquettes).toEqual(['reseau']);
	});

	it('ne reprend pas un identifiant déjà en base — RG-M12-11', () => {
		const seul = classerLeLot('épreuve', [{ chemin: 'Adressage.md', octets: 4, texte: 'x' }], {
			...SANS_SERVICE,
			identifiantsPris: new Set(['adressage'])
		});
		expect(seul.lignes[0]?.identifiant).toBe('adressage-2');
	});

	it('ne prend jamais deux fois le même identifiant dans un seul lot', () => {
		const seul = classerLeLot(
			'épreuve',
			[
				{ chemin: 'a/Adressage.md', octets: 4, texte: 'x' },
				{ chemin: 'b/Adressage.md', octets: 4, texte: 'y' }
			],
			SANS_SERVICE
		);
		expect(seul.lignes.map((l) => l.identifiant)).toEqual(['adressage', 'adressage-2']);
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

	const lire = (table: unknown, colonnes: Record<string, unknown>): unknown[] => {
		if (table === typesDeNote) return [{ id: 'type-note' }];
		if (table === notes) return 'identifiant' in colonnes ? [{ identifiant: 'deja-pris' }] : [];
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
			const rendu = [{ id: `${nomDe(table)}-${rang}` }];
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
			try {
				await corps(base);
			} catch (erreur) {
				annulations += 1;
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

const CIBLE = { domaineId: 'dom-1', dossierId: 'racine-1', auteurId: 'compte-1' };

describe('l’exécution d’un lot — RG-M12-02, un seul chemin de code', () => {
	const plan = classerLeLot(
		'épreuve',
		[
			{
				chemin: 'Exploitation/Sauvegardes/Restauration.md',
				octets: 42,
				texte:
					'---\ntitre: Restauration\netiquettes: [barman]\nvoir: [deja-pris, inconnue]\n---\nLe corps.'
			},
			{ chemin: 'Exploitation/Matrice.xlsx', octets: 42, texte: null },
			{ chemin: 'Reseau/Adressage.txt', octets: 42, texte: 'Plan.' }
		],
		SANS_SERVICE
	);

	it('écrit, compte, puis annule — et le rapport est le même des deux côtés', async () => {
		const reel = baseDEpreuve();
		const rapportReel = await executerLImport(reel.base, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});

		const simule = baseDEpreuve();
		const rapportSimule = await executerLImport(simule.base, CIBLE, plan, {
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
		await executerLImport(reel.base, CIBLE, plan, { simulation: false, profondeurDeDepart: 1 });
		expect(reel.transactions()).toBe(1);
		expect(reel.annulations()).toBe(0);

		const simule = baseDEpreuve();
		await executerLImport(simule.base, CIBLE, plan, { simulation: true, profondeurDeDepart: 1 });
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
			executerLImport(cassee, CIBLE, plan, { simulation: true, profondeurDeDepart: 1 })
		).rejects.toThrow('la base a rompu');
	});

	it('crée les dossiers de l’arborescence, du plus haut au plus bas', async () => {
		const essai = baseDEpreuve();
		const rapport = await executerLImport(essai.base, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		expect(essai.journal.filter((l) => l.startsWith('insert dossier'))).toHaveLength(3);
		expect(rapport.dossiersCrees).toBe(3);
	});

	it('rattache les étiquettes déclarées — RG-M12-06', async () => {
		const essai = baseDEpreuve();
		await executerLImport(essai.base, CIBLE, plan, { simulation: false, profondeurDeDepart: 1 });
		expect(essai.journal).toContain('insert etiquette barman');
		expect(essai.journal.filter((l) => l.startsWith('insert liaison'))).toHaveLength(1);
	});

	it('consigne les renvois qu’aucune note ne résout, et seulement ceux-là', async () => {
		const essai = baseDEpreuve();
		const rapport = await executerLImport(essai.base, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		const ligne = rapport.lignes.find((l) => l.chemin.endsWith('Restauration.md'));
		/* `deja-pris` est en base d’épreuve, `inconnue` ne l’est nulle part. */
		expect(ligne?.renvoisNonResolus).toEqual(['inconnue']);
	});

	it('reporte au rapport les fichiers écartés, avec leur motif', async () => {
		const essai = baseDEpreuve();
		const rapport = await executerLImport(essai.base, CIBLE, plan, {
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
		const rapport = await executerLImport(essai.base, CIBLE, plan, {
			simulation: false,
			profondeurDeDepart: 1
		});
		/* RG-M12-09 et RG-M12-08 : aucune table d’imports, aucun index alimenté. */
		expect(rapport.journalEnregistre).toBe(false);
		expect(rapport.indexeALaRecherche).toBe(false);
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
