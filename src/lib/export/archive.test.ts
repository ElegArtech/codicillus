/**
 * L'ARCHIVE D'EXPORT — LES UNITAIRES, ET LE CRITÈRE DE RÉUSSITE PRINCIPAL.
 *
 * `RG-M13-01` est une propriété d'ALLER-RETOUR, pas une propriété d'écriture :
 * produire une archive est facile, prouver que la réimporter reconstitue le
 * domaine à l'identique est le lot. Ce fichier porte donc deux natures de cas,
 * et il faut les distinguer :
 *
 *   LE DOMAINE ENTIER, DÉRIVÉ DU JEU DE SEMENCE. Le corpus figé de
 *   `seeds/corpus.ts` traverse l'archive et revient. Aucune donnée n'est
 *   inventée ici (`P-02`) : les notes, leurs dossiers, leurs étiquettes et leurs
 *   dates viennent de `src/lib/base/semence.ts`, et les deux corps les plus
 *   riches viennent de `documents-du-gel.ts`, transcrits de deux maquettes.
 *
 *   LES CAS ADVERSES, SYNTHÉTIQUES ET ASSUMÉS. `P-26` : « tout contrôle doit
 *   avoir un cas d'épreuve synthétique, indépendant de l'état du dépôt ». Le
 *   corpus ne porte AUCUNE image, AUCUNE pièce jointe, AUCUN diagramme et aucun
 *   nom de dossier à barre oblique : les mécaniques qui les traitent seraient
 *   inertes sans les cas ci-dessous, et une mécanique inerte est une mécanique
 *   dont on ignore si elle marche (`P-5`).
 *
 * CE FICHIER N'ÉCRIT AUCUNE FORME DU MARKDOWN, et c'est une contrainte, pas un
 * style : `ADR-004` réserve les formes à l'implémentation unique, et
 * Le contrôle A2 du convertisseur n'exempte que trois fichiers,
 * dont celui-ci n'est pas. Les cas adverses sont donc construits en DOCUMENTS
 * CANONIQUES — un bloc de code dont le contenu est trois tirets, par exemple —
 * et c'est le convertisseur qui en écrit la forme. La conséquence est heureuse :
 * les cas éprouvent le chemin réel, pas une chaîne écrite à la main.
 */
import { describe, expect, it } from 'vitest';
import { MarkdownNonRepresentable, serialiserEnMarkdown } from '../contenu/markdown';
import { documentDuGel } from '../contenu/documents-du-gel';
import { lignesDeDossier, lignesDeNote } from '../base/semence';
import { identifiantLisible } from '../rangement/adresses';
import { DOMAINES } from '../../../seeds/corpus';
import {
	ArchiveInvalide,
	DOSSIER_DES_PIECES,
	FAMILLE_SANS_CAS,
	NOM_DU_RAPPORT,
	cheminDArchive,
	construireLArchive,
	desechapperSegment,
	echapperSegment,
	exporterLeDomaine,
	lireFichierDeNote,
	nomDArchive,
	reimporterLArchive,
	segmentsDepuisLArchive,
	type DomaineAExporter,
	type NoteAExporter
} from './archive';
import { ecrireZip } from './zip';

/* ═══════════════════════════════════ Le domaine du jeu de semence ══════ */

/** Le domaine du corpus figé, tel que la base le porterait. */
function domaineDuJeu(nomDeDomaine: string): DomaineAExporter {
	const domaine = DOMAINES.find((d) => d.nom === nomDeDomaine);
	if (domaine === undefined) throw new Error('domaine absent du corpus : ' + nomDeDomaine);
	return {
		universIdentifiant: identifiantLisible(domaine.univers),
		universNom: domaine.univers,
		identifiant: identifiantLisible(domaine.nom),
		nom: domaine.nom,
		dossiers: lignesDeDossier()
			.filter((d) => d.domaineNom === nomDeDomaine)
			.map((d) => ({ chemin: d.chemin })),
		notes: lignesDeNote()
			.filter((n) => n.domaineNom === nomDeDomaine)
			.map((n) => ({
				identifiant: n.identifiant,
				titre: n.titre,
				typeDeNote: n.typeDeNoteNom,
				typeDeFiche: n.typeDeFicheNom,
				proprietesDeFiche: null,
				cheminDeDossier: n.cheminDeDossier,
				auteur: n.auteurNom,
				etiquettes: n.etiquettes,
				visibilite: n.visibilite,
				statut: n.statut,
				creeLe: n.creeLe.toISOString(),
				modifieLe: n.modifieLe.toISOString(),
				corpsReferenceModifieLe: n.modifieLe.toISOString(),
				corpsOperationnelModifieLe: n.corpsOperationnelModifieLe?.toISOString() ?? null,
				verifieLe: n.verifieLe?.toISOString() ?? null,
				consultations: n.compteurDeConsultations,
				signetAdresse: n.signetAdresse,
				signetAjouteLe: n.signetAjouteLe,
				revisionDemandee: n.revisionDemandee,
				revisionCommentaire: n.revisionCommentaire,
				revisionPar: n.revisionParNom,
				revisionLe: n.revisionLe?.toISOString() ?? null,
				relations: [],
				/* Les deux corps du gel là où ils existent : ce sont les seuls corps
				   RÉDIGÉS du dépôt, et les seuls qui exercent les quinze
				   constructions. Ailleurs, le corps dérivé de l'extrait. */
				corpsReference:
					n.identifiant === 'n-restaurer-pg'
						? documentDuGel('n-restaurer-pg', 'reference')
						: n.corpsReference,
				corpsOperationnel:
					n.identifiant === 'n-restaurer-pg'
						? documentDuGel('n-restaurer-pg', 'operationnel')
						: n.corpsOperationnel,
				piecesJointes: []
			}))
	};
}

/* ═══════════════════════════════════ Les fabriques des cas adverses ════ */

const doc = (...blocs: unknown[]) => ({ type: 'doc', content: blocs });
const para = (texte: string) => ({ type: 'paragraph', content: [{ type: 'text', text: texte }] });
const bloc = (contenu: string) => ({
	type: 'codeBlock',
	attrs: { language: 'bash' },
	content: [{ type: 'text', text: contenu }]
});

/** Une note minimale, dont seuls les champs cités par le cas comptent. */
function note(surcharge: Partial<NoteAExporter>): NoteAExporter {
	return {
		identifiant: 'n-cas',
		titre: 'Un cas',
		typeDeNote: 'Note',
		typeDeFiche: null,
		proprietesDeFiche: null,
		cheminDeDossier: ['Racine'],
		auteur: 'sophie.nguyen',
		etiquettes: [],
		visibilite: 'interne',
		statut: 'publiee',
		creeLe: '2026-08-01T00:00:00.000Z',
		modifieLe: '2026-08-01T00:00:00.000Z',
		corpsReferenceModifieLe: '2026-08-01T00:00:00.000Z',
		corpsOperationnelModifieLe: null,
		verifieLe: null,
		consultations: 0,
		signetAdresse: null,
		signetAjouteLe: null,
		revisionDemandee: false,
		revisionCommentaire: null,
		revisionPar: null,
		revisionLe: null,
		relations: [],
		corpsReference: doc(para('corps')),
		corpsOperationnel: null,
		piecesJointes: [],
		...surcharge
	};
}

/** Un domaine minimal autour d'une ou plusieurs notes. */
function domaineDe(
	notes: readonly NoteAExporter[],
	dossiers?: readonly string[][]
): DomaineAExporter {
	return {
		universIdentifiant: 'production',
		universNom: 'Production',
		identifiant: 'infrastructure',
		nom: 'Infrastructure',
		dossiers: (dossiers ?? [['Racine']]).map((chemin) => ({ chemin })),
		notes
	};
}

/* ═══════════════════════════ LE CRITÈRE DE RÉUSSITE PRINCIPAL ══════════ */

describe('RG-M13-01 — l’aller-retour sur un domaine entier du corpus figé', () => {
	const nomsDeDomaine = [...new Set(lignesDeNote().map((n) => n.domaineNom))];

	for (const nom of nomsDeDomaine) {
		it('exporter puis réimporter « ' + nom + ' » rend le domaine à l’identique', () => {
			const avant = domaineDuJeu(nom);
			const apres = reimporterLArchive(exporterLeDomaine(avant).octets);
			expect(apres).toEqual(avant);
		});
	}

	it('les dossiers reviennent tous, dans le même ordre — l’arborescence de V-36:2926', () => {
		const avant = domaineDuJeu('Infrastructure');
		const apres = reimporterLArchive(exporterLeDomaine(avant).octets);
		expect(apres.dossiers.map((d) => d.chemin.join('/'))).toEqual(
			avant.dossiers.map((d) => d.chemin.join('/'))
		);
	});

	it('R-05 — réexporter le domaine réimporté rend LES MÊMES OCTETS', () => {
		const avant = domaineDuJeu('Infrastructure');
		const premier = exporterLeDomaine(avant).octets;
		const second = exporterLeDomaine(reimporterLArchive(premier)).octets;
		expect(Buffer.from(second).equals(Buffer.from(premier))).toBe(true);
	});

	it('les étiquettes reviennent DANS LEUR ORDRE, qui n’est pas l’ordre alphabétique', () => {
		const avant = domaineDuJeu('Infrastructure');
		const apres = reimporterLArchive(exporterLeDomaine(avant).octets);
		const attendues = avant.notes.map((n) => n.etiquettes.join(' '));
		expect(apres.notes.map((n) => n.etiquettes.join(' '))).toEqual(attendues);
		expect(attendues.some((e) => e !== [...e.split(' ')].sort().join(' '))).toBe(true);
	});

	it('les deux registres reviennent tous les deux — RG-NOT-02', () => {
		const avant = domaineDuJeu('Infrastructure');
		const apres = reimporterLArchive(exporterLeDomaine(avant).octets);
		const deux = avant.notes.filter((n) => n.corpsOperationnel !== null);
		expect(deux.length).toBeGreaterThan(0);
		for (const attendue of deux) {
			const relue = apres.notes.find((n) => n.identifiant === attendue.identifiant);
			expect(relue?.corpsOperationnel).toEqual(attendue.corpsOperationnel);
		}
	});
});

/* ═══════════════════════════ L'EN-TÊTE, ET SA LECTURE SANS AMBIGUÏTÉ ═══ */

describe('l’en-tête de métadonnées — V-36:2929, « c’est ce bloc qui rend l’archive réimportable »', () => {
	/** Le fichier de la première note d'une archive à une note. */
	function fichierDe(uneNote: NoteAExporter): string {
		const entrees = construireLArchive(domaineDe([uneNote])).entrees;
		const trouvee = entrees.find((e) => e.chemin.endsWith('.md') && e.chemin !== NOM_DU_RAPPORT);
		if (trouvee === undefined) throw new Error('aucun fichier de note dans l’archive');
		return Buffer.from(trouvee.octets).toString('utf8');
	}

	it('le bloc ouvre le fichier, et le corps commence après sa clôture', () => {
		const texte = fichierDe(note({}));
		const lu = lireFichierDeNote(texte);
		expect(lu.champs.get('titre')).toBe('Un cas');
		expect(lu.corps.startsWith('corps')).toBe(true);
	});

	it('ARB-049 décision 5 — UN DOCUMENT DONT LE PREMIER BLOC EST UN SÉPARATEUR', () => {
		/* Le cas exact que `T-015` a traité pour ce lot : le convertisseur écrit
		   des astérisques, jamais trois tirets. Le corps ne peut donc pas ouvrir
		   un faux bloc de métadonnées. */
		const cas = note({ corpsReference: doc({ type: 'horizontalRule' }, para('après')) });
		const texte = fichierDe(cas);
		const lu = lireFichierDeNote(texte);
		expect(lu.corps.split('\n')[0]).not.toBe('-'.repeat(3));
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('ET MÊME SI LE CORPS PORTAIT TROIS TIRETS EN PREMIÈRE LIGNE, la lecture ne se tromperait pas', () => {
		/* La polarité inverse (`P-5`) : un bloc de code porte son contenu
		   VERBATIM, donc un corps PEUT porter une ligne de trois tirets. Elle
		   n'est jamais la première — mais la lecture ne s'appuie pas sur cette
		   promesse : elle borne le bloc à la PREMIÈRE clôture, et les valeurs de
		   l'en-tête sont du JSON sur une ligne, donc jamais trois tirets. */
		const cas = note({ corpsReference: doc(bloc('-'.repeat(3)), para('après')) });
		const lu = lireFichierDeNote(fichierDe(cas));
		expect(lu.champs.get('identifiant')).toBe('n-cas');
		expect(lu.corps).toContain('-'.repeat(3));
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('un titre qui EST la clôture du bloc ne clôt rien : la valeur est du JSON', () => {
		const cas = note({ titre: '-'.repeat(3) });
		const lu = lireFichierDeNote(fichierDe(cas));
		expect(lu.champs.get('titre')).toBe('-'.repeat(3));
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]?.titre).toBe(
			'-'.repeat(3)
		);
	});

	it('un titre à tirets, à deux-points, à guillemets et à saut de ligne revient exact', () => {
		const titre = 'Serveur-01 : « mise à jour »\nsuite du titre';
		const cas = note({ titre });
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]?.titre).toBe(
			titre
		);
	});

	it('un fichier sans bloc de métadonnées est refusé, jamais deviné', () => {
		expect(() => lireFichierDeNote('corps sans en-tête\n')).toThrow(ArchiveInvalide);
	});

	it('un bloc non clos est refusé', () => {
		expect(() => lireFichierDeNote('-'.repeat(3) + '\ntitre: "x"\n')).toThrow(ArchiveInvalide);
	});
});

/* ═══════════════════════════ LES DEUX REGISTRES DANS UN SEUL FICHIER ═══ */

describe('le séparateur de registre — déclaré dans l’en-tête, donc indevinable', () => {
	it('un corps Opérationnel revient exact', () => {
		const cas = note({
			corpsOperationnel: doc(para('opérationnel')),
			corpsOperationnelModifieLe: '2026-08-01T00:00:00.000Z'
		});
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('P-26 — UN CORPS QUI PORTE LE SÉPARATEUR : il est allongé, et l’aller-retour tient', () => {
		/* Le cas synthétique sans lequel l'allongement serait une règle qu'on
		   espère : un bloc de code dont le contenu EST le séparateur par défaut.
		   Le corpus n'en porte aucun, et n'en portera jamais. */
		const separateur = '%%% registre operationnel %%%';
		const cas = note({
			corpsReference: doc(bloc(separateur), para('après')),
			corpsOperationnel: doc(bloc(separateur), para('opérationnel')),
			corpsOperationnelModifieLe: '2026-08-01T00:00:00.000Z'
		});
		const octets = exporterLeDomaine(domaineDe([cas])).octets;
		expect(reimporterLArchive(octets).notes[0]).toEqual(cas);
	});

	it('une note sans registre Opérationnel n’annonce aucun séparateur', () => {
		const entrees = construireLArchive(domaineDe([note({})])).entrees;
		const fichier = entrees.find((e) => e.chemin.endsWith('.md') && e.chemin !== NOM_DU_RAPPORT);
		const lu = lireFichierDeNote(Buffer.from(fichier?.octets ?? new Uint8Array()).toString('utf8'));
		expect(lu.champs.has('separateur_de_registre')).toBe(false);
	});
});

/* ═══════════════════════════ RG-M13-02 — LE CONTENU NON CONVERTIBLE ════ */

describe('RG-M13-02 — la note est ignorée et consignée, l’export ne s’interrompt pas', () => {
	/* La seule limite de représentation du convertisseur, déclarée par son
	   en-tête : un texte marqué « code » et composé uniquement d'espaces. Elle
	   lève `MarkdownNonRepresentable`, et c'est la porte d'entrée de RG-M13-02. */
	const corpsNonConvertible = doc({
		type: 'paragraph',
		content: [{ type: 'text', text: '  ', marks: [{ type: 'code' }] }]
	});

	it('la levée du convertisseur est bien celle qu’on croit — le cas est vérifié, pas supposé', () => {
		/* Le refus vient de l'implémentation unique, et il est constaté ici plutôt
		   que supposé : sans cette ligne, la famille `note-ignoree` pourrait être
		   nourrie par n'importe quelle panne. */
		expect(() => serialiserEnMarkdown(corpsNonConvertible)).toThrow(MarkdownNonRepresentable);
		const rapport = construireLArchive(
			domaineDe([note({ corpsReference: corpsNonConvertible })])
		).rapport;
		expect(rapport.notesIgnorees).toBe(1);
		expect(rapport.notesExportees).toBe(0);
		expect(rapport.avertissements[0]?.famille).toBe('note-ignoree');
		expect(rapport.avertissements[0]?.raison).toContain('non représentable');
	});

	it('les notes convertibles sont exportées quand une autre est ignorée', () => {
		const bonne = note({ identifiant: 'n-bonne', titre: 'Bonne' });
		const mauvaise = note({
			identifiant: 'n-mauvaise',
			titre: 'Mauvaise',
			corpsReference: corpsNonConvertible
		});
		const construite = construireLArchive(domaineDe([mauvaise, bonne]));
		expect(construite.rapport.notesExportees).toBe(1);
		expect(construite.rapport.notesIgnorees).toBe(1);
		const noms = construite.entrees.map((e) => e.chemin);
		expect(noms.some((n) => n.includes('Bonne'))).toBe(true);
		expect(noms.some((n) => n.includes('Mauvaise'))).toBe(false);
	});

	it('un corps stocké INVALIDE est ignoré de la même façon, pas relevé en panne', () => {
		const cas = note({ corpsReference: { type: 'doc', content: [{ type: 'iframe' }] } });
		const rapport = construireLArchive(domaineDe([cas])).rapport;
		expect(rapport.notesIgnorees).toBe(1);
		expect(rapport.avertissements[0]?.famille).toBe('note-ignoree');
	});

	it('le rapport est une entrée de l’archive, et il porte la raison — V-36:2937', () => {
		const construite = construireLArchive(
			domaineDe([note({ corpsReference: corpsNonConvertible })])
		);
		const rapport = construite.entrees.find((e) => e.chemin === NOM_DU_RAPPORT);
		expect(rapport).toBeDefined();
		const texte = Buffer.from(rapport?.octets ?? new Uint8Array()).toString('utf8');
		expect(texte).toContain('note-ignoree');
		expect(texte).toContain('Un cas');
	});

	it('sans avertissement, le rapport le dit — jamais une liste vide muette', () => {
		const construite = construireLArchive(domaineDe([note({})]));
		const rapport = construite.entrees.find((e) => e.chemin === NOM_DU_RAPPORT);
		expect(Buffer.from(rapport?.octets ?? new Uint8Array()).toString('utf8')).toContain(
			'sans perte'
		);
	});
});

/* ═══════════════════════════ LES TROIS FAMILLES DU GEL ═════════════════ */

describe('les familles d’avertissement de V-36:3042-3046', () => {
	it('« 1 diagramme — converti en bloc de code, sans rendu graphique » (V-36:3044)', () => {
		const cas = note({
			corpsReference: doc({
				type: 'diagramme',
				attrs: {
					source: 'A --> B',
					langage: 'mermaid',
					alternative: 'A précède B',
					etiquette: null,
					legende: null
				}
			})
		});
		const rapport = construireLArchive(domaineDe([cas])).rapport;
		expect(rapport.notesExportees).toBe(1);
		expect(rapport.avertissements.map((a) => a.famille)).toContain('diagramme');
		/* La note EST dans l'archive : l'avertissement dit une perte de RENDU
		   hors du produit, pas un refus — `ARB-049` décision 1. */
		expect(rapport.notesIgnorees).toBe(0);
	});

	it('« les signets — exportés comme fichiers de liens, sans contenu distant » (V-36:3045)', () => {
		const cas = note({
			typeDeNote: 'Signet',
			signetAdresse: 'https://exemple.test/page',
			signetAjouteLe: '2026-07-01'
		});
		const rapport = construireLArchive(domaineDe([cas])).rapport;
		expect(rapport.avertissements.map((a) => a.famille)).toContain('signet');
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('la troisième famille du gel N’A AUCUN CAS POSSIBLE, et c’est un constat, pas un oubli', () => {
		/* Les cellules fusionnées : `document.ts` ne déclare ni `colspan` ni
		   `rowspan`, et le schéma est strict. Compter cette famille demanderait
		   d'inventer un cas — ce que `P-02` proscrit. */
		expect(FAMILLE_SANS_CAS).toContain('fusionnées');
	});
});

/* ═══════════════════════════ LES IMAGES ET LES PIÈCES JOINTES ══════════ */

describe('V-36:2932 — les images dans un dossier voisin, et les liens en chemin relatif', () => {
	const octetsDePiece = new Uint8Array([1, 2, 3, 4, 5]);

	function noteAImage(): NoteAExporter {
		return note({
			cheminDeDossier: ['Racine', 'Exploitation'],
			corpsReference: doc(para('avant'), {
				type: 'image',
				attrs: { src: 'schema.png', alt: 'Le schéma', etiquette: null, legende: null }
			}),
			piecesJointes: [
				{
					nom: 'schema.png',
					typeMedia: 'image/png',
					deposeeLe: '2026-07-01T00:00:00.000Z',
					octets: octetsDePiece
				}
			]
		});
	}

	it('les octets de la pièce sont dans le dossier voisin', () => {
		const entrees = construireLArchive(
			domaineDe([noteAImage()], [['Racine'], ['Racine', 'Exploitation']])
		).entrees;
		const piece = entrees.find((e) => e.chemin.startsWith(DOSSIER_DES_PIECES + '/'));
		expect(piece?.chemin).toBe(DOSSIER_DES_PIECES + '/n-cas/schema.png');
		expect(Buffer.from(piece?.octets ?? new Uint8Array()).equals(Buffer.from(octetsDePiece))).toBe(
			true
		);
	});

	it('le corps sérialisé porte un chemin RELATIF vers elle', () => {
		const entrees = construireLArchive(
			domaineDe([noteAImage()], [['Racine'], ['Racine', 'Exploitation']])
		).entrees;
		const fichier = entrees.find((e) => e.chemin.endsWith('.md') && e.chemin !== NOM_DU_RAPPORT);
		const corps = lireFichierDeNote(
			Buffer.from(fichier?.octets ?? new Uint8Array()).toString('utf8')
		).corps;
		expect(corps).toContain('../../' + DOSSIER_DES_PIECES + '/n-cas/schema.png');
	});

	it('l’aller-retour rend l’adresse d’origine ET les octets — RG-M13-01, « images comprises »', () => {
		const avant = domaineDe([noteAImage()], [['Racine'], ['Racine', 'Exploitation']]);
		expect(reimporterLArchive(exporterLeDomaine(avant).octets)).toEqual(avant);
	});

	it('une image qui n’est aucune pièce jointe est CONSIGNÉE, et son adresse n’est pas touchée', () => {
		const cas = note({
			corpsReference: doc({
				type: 'image',
				attrs: { src: 'absente.png', alt: 'Absente', etiquette: null, legende: null }
			})
		});
		const construite = construireLArchive(domaineDe([cas]));
		expect(construite.rapport.avertissements.map((a) => a.famille)).toContain('image-non-incluse');
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('DEUX ADRESSES POUR UNE MÊME PIÈCE : une seule est réécrite, l’autre est consignée', () => {
		/* Le piège que la première rédaction portait : les deux adresses partaient
		   vers le même chemin relatif, et la relecture rendait la même aux deux.
		   L'aller-retour aurait été faux en silence — la pire des pertes. */
		const cas = note({
			cheminDeDossier: ['Racine'],
			corpsReference: doc(
				{
					type: 'image',
					attrs: { src: 'schema.png', alt: 'Nu', etiquette: null, legende: null }
				},
				{
					type: 'image',
					attrs: { src: 'media/schema.png', alt: 'Chemin', etiquette: null, legende: null }
				}
			),
			piecesJointes: [
				{
					nom: 'schema.png',
					typeMedia: 'image/png',
					deposeeLe: '2026-07-01T00:00:00.000Z',
					octets: octetsDePiece
				}
			]
		});
		const construite = construireLArchive(domaineDe([cas]));
		expect(construite.rapport.avertissements.map((a) => a.famille)).toContain('image-non-incluse');
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('deux pièces HOMONYMES sur une note font ignorer la note, pas perdre un fichier', () => {
		const cas = note({
			piecesJointes: [
				{
					nom: 'schema.png',
					typeMedia: 'image/png',
					deposeeLe: '2026-07-01T00:00:00.000Z',
					octets: octetsDePiece
				},
				{
					nom: 'schema.png',
					typeMedia: 'image/png',
					deposeeLe: '2026-07-02T00:00:00.000Z',
					octets: new Uint8Array([9, 9])
				}
			]
		});
		const rapport = construireLArchive(domaineDe([cas])).rapport;
		expect(rapport.notesIgnorees).toBe(1);
		expect(rapport.avertissements[0]?.famille).toBe('note-ignoree');
	});

	it('une pièce jointe annoncée et absente fait REFUSER la lecture, jamais deviner', () => {
		/* L'archive amputée de ses octets : l'en-tête annonce la pièce, le dossier
		   voisin ne la porte pas. Une lecture qui rendrait la note sans sa pièce
		   dirait que l'aller-retour est l'identité alors qu'il a perdu un fichier. */
		const entrees = construireLArchive(
			domaineDe([noteAImage()], [['Racine'], ['Racine', 'Exploitation']])
		).entrees.filter((e) => !e.chemin.startsWith(DOSSIER_DES_PIECES + '/'));
		expect(() => reimporterLArchive(ecrireZip(entrees))).toThrow(ArchiveInvalide);
	});
});

/* ═══════════════════════════ LES NOMS, ET L'ARBORESCENCE ══════════════ */

describe('les noms de chemin — l’arborescence revient exacte, ou elle ne revient pas', () => {
	it('la barre oblique et le pour cent sont échappés, et l’inverse est exact', () => {
		for (const nom of ['Exploitation', 'A/B', '100 %', '%2F', 'a%25b/c']) {
			expect(desechapperSegment(echapperSegment(nom))).toBe(nom);
		}
	});

	it('un dossier dont le nom porte une barre oblique revient entier', () => {
		const avant = domaineDe(
			[note({ cheminDeDossier: ['Racine', 'Entrée/Sortie'] })],
			[['Racine'], ['Racine', 'Entrée/Sortie']]
		);
		expect(reimporterLArchive(exporterLeDomaine(avant).octets)).toEqual(avant);
	});

	it('un dossier racine qui porte un nom RÉSERVÉ ne collisionne pas', () => {
		const avant = domaineDe(
			[note({ cheminDeDossier: [DOSSIER_DES_PIECES] })],
			[[DOSSIER_DES_PIECES]]
		);
		expect(cheminDArchive([DOSSIER_DES_PIECES])).not.toBe(DOSSIER_DES_PIECES);
		expect(segmentsDepuisLArchive(cheminDArchive([DOSSIER_DES_PIECES]))).toEqual([
			DOSSIER_DES_PIECES
		]);
		expect(reimporterLArchive(exporterLeDomaine(avant).octets)).toEqual(avant);
	});

	it('un dossier VIDE survit — il n’a aucun fichier pour le porter, il a son entrée', () => {
		const avant = domaineDe([note({})], [['Racine'], ['Racine', 'Vide']]);
		const apres = reimporterLArchive(exporterLeDomaine(avant).octets);
		expect(apres.dossiers.map((d) => d.chemin)).toEqual([['Racine'], ['Racine', 'Vide']]);
	});

	it('deux notes de même titre dans le même dossier ne s’écrasent pas', () => {
		const avant = domaineDe([
			note({ identifiant: 'n-un', titre: 'Homonyme' }),
			note({ identifiant: 'n-deux', titre: 'Homonyme' })
		]);
		const construite = construireLArchive(avant);
		const fichiers = construite.entrees.filter(
			(e) => e.chemin.endsWith('.md') && e.chemin !== NOM_DU_RAPPORT
		);
		expect(new Set(fichiers.map((f) => f.chemin)).size).toBe(2);
		expect(construite.rapport.avertissements.map((a) => a.famille)).toContain('nom-de-fichier');
		expect(reimporterLArchive(exporterLeDomaine(avant).octets)).toEqual(avant);
	});

	it('les propriétés de fiche reviennent, valeur par valeur — V-36:2929 les nomme', () => {
		/* Le corpus ne porte aucune propriété typée en base : sans ce cas, la clé
		   serait écrite et jamais relue, et personne ne le saurait (`P-5`). */
		const cas = note({
			typeDeFiche: 'Serveur',
			proprietesDeFiche: {
				adresse: '10.0.0.4',
				processeurs: 8,
				sauvegarde: true,
				environnement: ['production', 'secours'],
				commentaire: null
			}
		});
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('les relations sortantes reviennent avec LEUR ORIGINE — P-08', () => {
		const cas = note({
			relations: [
				{ cible: 'n-autre', type: 'heberge', origine: 'declaree' },
				{ cible: 'n-tierce', type: 'depend-de', origine: 'deduite' }
			]
		});
		expect(reimporterLArchive(exporterLeDomaine(domaineDe([cas])).octets).notes[0]).toEqual(cas);
	});

	it('le nom de l’archive est celui du gel — V-36:3061', () => {
		expect(nomDArchive('infrastructure', '2026-08-13T00:00:00.000Z')).toBe(
			'infrastructure-2026-08-13.zip'
		);
	});
});
