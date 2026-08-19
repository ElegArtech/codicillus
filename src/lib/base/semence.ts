/**
 * LA SEMENCE — `seeds/corpus.ts` transformé en lignes de la base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE CHARGEMENT EST UNE PREUVE, ET PAS UNE COMMODITÉ
 *
 * `seeds/corpus.ts` est l'extraction fidèle des données portées par les 41
 * maquettes gelées. Un schéma qui l'accepte accepte le RÉEL du produit ; un
 * schéma validé par un jeu d'essai fabriqué pour lui plaire ne prouve rien.
 * C'est la raison d'être de ce module : il ne fabrique aucune donnée, il
 * transporte celles qui existent.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE CORPUS NE PORTE PAS, ET CE QUE CE MODULE EN FAIT
 *
 * Six manques sont réels, et aucun n'est comblé en silence — chacun est
 * signalé ici et remonté au rapport de lot :
 *
 *  1. LE CORPS DES NOTES. Les maquettes écrivent le corps au balisage, pas en
 *     données (`src/lib/lecture/note-de-demonstration.ts` le constate). Le seul
 *     texte que le corpus porte par note est son `extrait`. Il devient le corps
 *     Référence — la SEULE dérivation possible qui n'invente pas de prose.
 *  2. LE CORPS OPÉRATIONNEL des cinq notes qui le déclarent : aucun texte.
 *     Un document vide est écrit — le registre existe, son contenu n'est nulle
 *     part —, jamais une prose fabriquée.
 *  3. LES DATES DE CRÉATION ET DE MODIFICATION. Le corpus porte `revise` et
 *     `jours`. `jours` est l'ancienneté au sens de RG-M06-01 ; la date qui la
 *     produit est donc `DATE_REFERENCE - jours`, et c'est elle qui est écrite
 *     en création et en modification. C'est la seule dérivation qui REPRODUISE
 *     l'ancienneté observable, et `verifierFraicheur()` la contrôle.
 *  4. L'HEURE. Le corpus la déclare indéterminable et refuse de la fabriquer.
 *     Convention explicite de ce module : minuit UTC. Elle est choisie ici, pas
 *     déduite.
 *  5. L'IDENTITÉ DU VÉRIFICATEUR (M06.2). Absente : la colonne reste nulle.
 *  6. LES PIÈCES JOINTES. Le corpus n'en porte que le NOMBRE (`pj`), jamais un
 *     fichier. Aucune ligne n'est écrite — un nom de fichier inventé serait une
 *     valeur illustrative, ce que P-02 proscrit.
 */
import { SEUILS_PAR_DEFAUT, niveauFraicheur } from '../fraicheur';
import { identifiantLisible, segmentsDeDossier } from '../rangement/adresses';
import {
	CORPUS,
	COMPTES,
	CONFIG,
	DATE_REFERENCE,
	DETAIL_DOMAINES,
	DOMAINES,
	MODULES,
	RELATIONS,
	RELATIONS_TECHNIQUES,
	REVISIONS,
	TEMPLATES,
	TYPES_FICHE,
	TYPES_NOTE,
	TYPES_RELATION,
	UNIVERS,
	type CleDeModule,
	type CleDeTypeDeRelation,
	type Note,
	type TypeDeChamp
} from '../../../seeds/corpus';

/* ═══════════════════════════════════════════════════ Les dates ══════════ */

/** L'heure retenue, faute d'heure déductible. Convention, pas déduction. */
export const HEURE_DE_REFERENCE = 'T00:00:00.000Z';

const MILLISECONDES_PAR_JOUR = 86_400_000;

/** `13/08/2026` vers `2026-08-13`. Le format d'affichage des maquettes. */
export function dateCourteEnIso(courte: string): string {
	const morceaux = courte.split('/');
	const jour = morceaux[0];
	const mois = morceaux[1];
	const annee = morceaux[2];
	if (morceaux.length !== 3 || jour === undefined || mois === undefined || annee === undefined) {
		throw new Error(`Date courte illisible : ${courte}`);
	}
	return `${annee}-${mois}-${jour}`;
}

/** L'instant d'une date courte, à l'heure de convention. */
export function instantDeDateCourte(courte: string): Date {
	return new Date(`${dateCourteEnIso(courte)}${HEURE_DE_REFERENCE}`);
}

/** L'instant de référence du corpus — `DATE_REFERENCE`, à l'heure de convention. */
export function instantDeReference(): Date {
	return new Date(`${DATE_REFERENCE}${HEURE_DE_REFERENCE}`);
}

/** L'instant situé `jours` avant la date de référence. */
export function instantAvantReference(jours: number): Date {
	return new Date(instantDeReference().getTime() - jours * MILLISECONDES_PAR_JOUR);
}

/** Le nombre de jours entiers écoulés entre un instant et la date de référence. */
export function anciennete(instant: Date): number {
	return Math.floor((instantDeReference().getTime() - instant.getTime()) / MILLISECONDES_PAR_JOUR);
}

/* ═══════════════════════════════════════════ Le corps des notes ═════════ */

/** Un document ProseMirror sérialisé, tel qu'ADR-003 le décrit. */
export interface DocumentDeNote {
	readonly type: 'doc';
	readonly content: readonly unknown[];
}

/** Le corps Référence dérivé du seul texte que le corpus porte : l'extrait. */
export function corpsDepuisTexte(texte: string): DocumentDeNote {
	return {
		type: 'doc',
		content: [{ type: 'paragraph', content: [{ type: 'text', text: texte }] }]
	};
}

/** Le corps Opérationnel des notes qui le déclarent sans le porter : vide. */
export function corpsVide(): DocumentDeNote {
	return { type: 'doc', content: [{ type: 'paragraph' }] };
}

/* ═══════════════════════════════════════════════ Les traductions ════════ */

/** Les rôles des maquettes, en valeurs d'énumération. */
export const ROLE_EN_ENUM = {
	Administrateur: 'administrateur',
	Référent: 'referent',
	Contributeur: 'contributeur',
	Lecteur: 'lecteur'
} as const;

/**
 * Les six modules des maquettes, en valeurs d'énumération. Seule `carteMentale`
 * change de forme — la casse chameau devient un tiret bas.
 */
export const MODULE_EN_ENUM = {
	notes: 'notes',
	dossiers: 'dossiers',
	fiches: 'fiches',
	cartographie: 'cartographie',
	signets: 'signets',
	carteMentale: 'carte_mentale'
} as const;

/**
 * Les types de champ. Le corpus en emploie quatre (`texte`, `nombre`, `liste`,
 * `interrupteur`) ; CDC §3.5 en énumère six, dont `booléen` — c'est lui que
 * `interrupteur` désigne. La traduction est déclarée, jamais tacite.
 */
export const TYPE_DE_CHAMP_EN_ENUM = {
	texte: 'texte',
	nombre: 'nombre',
	liste: 'liste',
	interrupteur: 'booleen'
} as const satisfies Record<TypeDeChamp, string>;

/* ═══════════════════════════════════════════════════ Les lignes ═════════ */

export interface LigneDUnivers {
	readonly identifiant: string;
	readonly nom: string;
	readonly description: string;
	readonly couleur: string;
	readonly glyphe: string;
	readonly ordre: number;
	readonly systeme: boolean;
}

export interface LigneDeDomaine {
	readonly universNom: string;
	readonly identifiant: string;
	readonly nom: string;
	readonly description: string;
	readonly couleur: string;
	readonly modules: readonly string[];
}

export interface LigneDeDossier {
	/** Le domaine, par son nom. */
	readonly domaineNom: string;
	/** Le chemin complet depuis la racine, racine comprise. */
	readonly chemin: readonly string[];
	readonly nom: string;
	readonly profondeur: number;
	readonly position: number;
}

export interface LigneDeCompte {
	readonly identifiant: string;
	readonly nom: string;
	readonly courriel: string;
	readonly role: string;
	readonly actif: boolean;
	readonly arriveLe: string;
}

export interface LigneDeNote {
	readonly identifiant: string;
	readonly titre: string;
	readonly corpsReference: DocumentDeNote;
	readonly corpsOperationnel: DocumentDeNote | null;
	readonly typeDeNoteNom: string;
	readonly typeDeFicheNom: string | null;
	readonly domaineNom: string;
	readonly cheminDeDossier: readonly string[];
	readonly auteurNom: string;
	readonly visibilite: 'interne' | 'publique';
	readonly statut: 'brouillon' | 'publiee';
	readonly creeLe: Date;
	readonly modifieLe: Date;
	readonly corpsOperationnelModifieLe: Date | null;
	readonly verifieLe: Date | null;
	readonly compteurDeConsultations: number;
	readonly etiquettes: readonly string[];
	readonly signetAdresse: string | null;
	readonly signetAjouteLe: string | null;
	readonly revisionDemandee: boolean;
	readonly revisionCommentaire: string | null;
	readonly revisionParNom: string | null;
	readonly revisionLe: Date | null;
}

/* ═══════════════════════════════════════════════ Les dérivations ════════ */

/** Les univers, dans l'ordre que le corpus leur donne. */
export function lignesDUnivers(): readonly LigneDUnivers[] {
	return UNIVERS.map((u, rang) => ({
		identifiant: identifiantLisible(u.nom),
		nom: u.nom,
		description: u.description,
		couleur: u.couleur,
		glyphe: u.glyphe,
		ordre: u.ordre ?? rang + 1,
		systeme: u.systeme === true
	}));
}

/** Les domaines, avec leur description et leurs modules activés. */
export function lignesDeDomaine(): readonly LigneDeDomaine[] {
	return DOMAINES.map((d) => {
		const detail = DETAIL_DOMAINES[d.nom];
		return {
			universNom: d.univers,
			identifiant: identifiantLisible(d.nom),
			nom: d.nom,
			description: detail.description,
			couleur: d.couleur,
			modules: detail.modules.map((cle: CleDeModule) => MODULE_EN_ENUM[cle])
		};
	});
}

/**
 * Les dossiers, déduits des chemins que portent les notes.
 *
 * RG-STR-03 exige un dossier racine par domaine. Son NOM n'est spécifié nulle
 * part : le chemin d'adresse ne le porte pas (`adresseDeDossier()` ne compose
 * que les segments sous la racine) et aucune maquette ne l'affiche. Il reçoit
 * ici le nom de son domaine — décision déclarée au rapport.
 */
export function lignesDeDossier(notes: readonly Note[] = CORPUS): readonly LigneDeDossier[] {
	const lignes: LigneDeDossier[] = [];
	const vues = new Set<string>();
	const rangs = new Map<string, number>();

	const ajouter = (domaineNom: string, chemin: readonly string[]): void => {
		const cle = `${domaineNom} ${chemin.join(' ')}`;
		if (vues.has(cle)) return;
		vues.add(cle);
		const parent = `${domaineNom} ${chemin.slice(0, -1).join(' ')}`;
		const position = rangs.get(parent) ?? 0;
		rangs.set(parent, position + 1);
		const nom = chemin[chemin.length - 1];
		if (nom === undefined) throw new Error('chemin de dossier vide');
		lignes.push({ domaineNom, chemin, nom, profondeur: chemin.length, position });
	};

	for (const domaine of DOMAINES) ajouter(domaine.nom, [domaine.nom]);

	for (const note of notes) {
		const segments = segmentsDeDossier(note.dossier);
		for (let i = 1; i <= segments.length; i += 1) {
			ajouter(note.domaine, [note.domaine, ...segments.slice(0, i)]);
		}
	}
	return lignes;
}

/** Les comptes de la console (V-28). */
export function lignesDeCompte(): readonly LigneDeCompte[] {
	return COMPTES.map((c) => ({
		identifiant: c.identifiant,
		nom: c.nom,
		courriel: c.courriel,
		role: ROLE_EN_ENUM[c.role],
		actif: c.actif,
		arriveLe: dateCourteEnIso(c.arrivee)
	}));
}

export interface LigneDeReferentiel {
	readonly identifiant: string;
	readonly nom: string;
	readonly ordre: number;
}

/** Les types de note employés par les maquettes — cinq des onze de CDC §3.4. */
export function lignesDeTypeDeNote(): readonly LigneDeReferentiel[] {
	return TYPES_NOTE.map((nom, rang) => ({
		identifiant: identifiantLisible(nom),
		nom,
		ordre: rang
	}));
}

/** Les types de fiche — trois des quatre de CDC §3.5. */
export function lignesDeTypeDeFiche(): readonly LigneDeReferentiel[] {
	return Object.keys(TYPES_FICHE).map((nom, rang) => ({
		identifiant: identifiantLisible(nom),
		nom,
		ordre: rang
	}));
}

export interface LigneDeChamp {
	readonly typeDeFicheNom: string;
	readonly cle: string;
	readonly nom: string;
	readonly type: string;
	readonly ordre: number;
	readonly exemple: string | null;
	readonly valeurs: readonly string[] | null;
}

/** Les champs de chaque type de fiche, dans l'ordre du corpus. */
export function lignesDeChamp(): readonly LigneDeChamp[] {
	const lignes: LigneDeChamp[] = [];
	for (const [typeDeFicheNom, champs] of Object.entries(TYPES_FICHE)) {
		champs.forEach((champ, rang) => {
			lignes.push({
				typeDeFicheNom,
				cle: champ.cle,
				nom: champ.nom,
				type: TYPE_DE_CHAMP_EN_ENUM[champ.type],
				ordre: rang,
				exemple: champ.exemple ?? null,
				valeurs: champ.valeurs ?? null
			});
		});
	}
	return lignes;
}

export interface LigneDeTypeDeRelation {
	readonly identifiant: string;
	readonly libelleSortant: string;
	readonly libelleEntrant: string;
	readonly technique: boolean;
	readonly ordre: number;
}

/** Les six types de relation, avec leurs deux libellés (RG-M08-06). */
export function lignesDeTypeDeRelation(): readonly LigneDeTypeDeRelation[] {
	return Object.entries(TYPES_RELATION).map(([identifiant, libelles], rang) => ({
		identifiant,
		libelleSortant: libelles.sortant,
		libelleEntrant: libelles.entrant,
		technique: RELATIONS_TECHNIQUES.includes(identifiant as CleDeTypeDeRelation),
		ordre: rang
	}));
}

export interface LigneDeTemplate {
	readonly identifiant: string;
	readonly nom: string;
	readonly description: string;
	readonly typeDeNoteNom: string;
	readonly defaut: boolean;
	readonly structure: readonly string[];
	readonly contenu: string;
}

/** Les templates fournis (RG-REF-01) — quatre dans les maquettes. */
export function lignesDeTemplate(): readonly LigneDeTemplate[] {
	return TEMPLATES.map((t) => ({
		identifiant: t.id,
		nom: t.nom,
		description: t.description,
		typeDeNoteNom: t.type,
		defaut: t.defaut === true,
		structure: t.structure,
		contenu: t.contenu
	}));
}

/** Les étiquettes distinctes du corpus, partagées à l'échelle du produit. */
export function lignesDEtiquette(notes: readonly Note[] = CORPUS): readonly string[] {
	return [...new Set(notes.flatMap((n) => n.etiquettes))].sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Les notes, avec leurs dates dérivées et leur demande de révision rattachée. */
export function lignesDeNote(notes: readonly Note[] = CORPUS): readonly LigneDeNote[] {
	const revisions = new Map(REVISIONS.map((r) => [r.id, r]));
	return notes.map((n) => {
		const modifieLe = instantAvantReference(n.jours);
		const revision = revisions.get(n.id);
		return {
			identifiant: n.id,
			titre: n.titre,
			corpsReference: corpsDepuisTexte(n.extrait),
			corpsOperationnel: n.operationnel ? corpsVide() : null,
			typeDeNoteNom: n.type,
			typeDeFicheNom: n.typeFiche ?? null,
			domaineNom: n.domaine,
			cheminDeDossier: [n.domaine, ...segmentsDeDossier(n.dossier)],
			auteurNom: n.auteur,
			visibilite: n.visibilite === 'Publique' ? 'publique' : 'interne',
			statut: n.brouillon ? 'brouillon' : 'publiee',
			creeLe: modifieLe,
			modifieLe,
			corpsOperationnelModifieLe: n.operationnel ? modifieLe : null,
			verifieLe: n.revise === null ? null : instantDeDateCourte(n.revise),
			compteurDeConsultations: n.vues,
			etiquettes: n.etiquettes,
			signetAdresse: n.url ?? null,
			signetAjouteLe: n.ajoute === undefined ? null : dateCourteEnIso(n.ajoute),
			revisionDemandee: revision !== undefined,
			revisionCommentaire: revision?.commentaire ?? null,
			revisionParNom: revision?.par ?? null,
			revisionLe: revision === undefined ? null : instantDeDateCourte(revision.le)
		};
	});
}

export interface LigneDeRelation {
	readonly sourceIdentifiant: string;
	readonly cibleIdentifiant: string;
	readonly typeIdentifiant: string;
}

/**
 * Les relations. Leur ORIGINE (P-08 : déclarée, déduite, ambiguë) n'est portée
 * par aucune maquette ; la colonne prend sa valeur par défaut, `declaree`.
 * Décision déclarée au rapport.
 */
export function lignesDeRelation(): readonly LigneDeRelation[] {
	return RELATIONS.map((r) => ({
		sourceIdentifiant: r.de,
		cibleIdentifiant: r.vers,
		typeIdentifiant: r.type
	}));
}

/**
 * Les paramètres globaux (CDC §3.3). Les deux seuils viennent de `CONFIG`, qui
 * les LIT de `SEUILS_PAR_DEFAUT` — ADR-005 interdit toute duplication littérale
 * ailleurs que dans la configuration lue par l'implémentation unique. Cette
 * table EST cette configuration : elle les reçoit, elle ne les réécrit pas.
 */
export function lignesDeParametre(): readonly { cle: string; valeur: unknown }[] {
	return [
		{ cle: 'seuil_frais', valeur: CONFIG.seuilFrais },
		{ cle: 'seuil_vieillissant', valeur: CONFIG.seuilVieillissant },
		{ cle: 'versions_max', valeur: CONFIG.versionsMax },
		{ cle: 'portail_assistance', valeur: CONFIG.portailAssistance },
		{ cle: 'mot_fiche', valeur: CONFIG.motFiche },
		{ cle: 'taille_max_piece_jointe', valeur: CONFIG.tailleMaxPieceJointe },
		{ cle: 'duree_session', valeur: CONFIG.dureeSession }
	];
}

/* ═══════════════════════════════════════════════ Les contrôles ══════════ */

/** Une divergence constatée entre le corpus et ce que le schéma en fait. */
export interface Divergence {
	readonly quoi: string;
	readonly attendu: string;
	readonly obtenu: string;
}

/**
 * LE CONTRÔLE QUI COMPTE : les dates écrites redonnent-elles, par
 * `niveauFraicheur()` — l'implémentation unique de P-01 —, le niveau que le
 * corpus porte ?
 *
 * Si non, la dérivation des dates est fausse et le corpus chargé ment sur la
 * fraîcheur, ce qui est exactement ce que P-01 interdit.
 */
export function verifierFraicheur(notes: readonly Note[] = CORPUS): readonly Divergence[] {
	const lignes = lignesDeNote(notes);
	const divergences: Divergence[] = [];
	notes.forEach((note, rang) => {
		const ligne = lignes[rang];
		if (ligne === undefined) return;
		const reference = ligne.verifieLe ?? ligne.modifieLe;
		const niveau = niveauFraicheur(anciennete(reference), SEUILS_PAR_DEFAUT);
		if (niveau !== note.fraicheur) {
			divergences.push({
				quoi: `fraîcheur de ${note.id}`,
				attendu: note.fraicheur,
				obtenu: niveau
			});
		}
	});
	return divergences;
}

/**
 * Le second contrôle : l'univers que chaque note déclare est-il bien celui de
 * son domaine ? Le schéma ne stocke pas l'univers sur la note — il se lit par
 * le domaine —, ce qui n'est licite que si le corpus est cohérent.
 */
export function verifierUniversDesNotes(notes: readonly Note[] = CORPUS): readonly Divergence[] {
	const universParDomaine = new Map(DOMAINES.map((d) => [d.nom, d.univers]));
	const divergences: Divergence[] = [];
	for (const note of notes) {
		const attendu = universParDomaine.get(note.domaine);
		if (attendu !== note.univers) {
			divergences.push({
				quoi: `univers de ${note.id}`,
				attendu: note.univers,
				obtenu: attendu ?? '(domaine inconnu)'
			});
		}
	}
	return divergences;
}

/** Le nombre de modules connus des maquettes, pour le rapport de chargement. */
export function nombreDeModules(): number {
	return Object.keys(MODULES).length;
}
