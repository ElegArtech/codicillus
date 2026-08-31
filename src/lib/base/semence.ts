/**
 * La semence — `seeds/corpus.ts` transformé en lignes de la base.
 *
 * `seeds/corpus.ts` est l'extraction fidèle des données portées par les 41 maquettes
 * gelées : un schéma qui l'accepte accepte le RÉEL du produit, quand un schéma validé par
 * un jeu fabriqué pour lui plaire ne prouve rien. Ce module ne fabrique aucune donnée.
 *
 * SIX MANQUES SONT RÉELS, et aucun n'est comblé en silence :
 *
 *  1. LE CORPS DES NOTES. Les maquettes l'écrivent au balisage ; le seul texte que le
 *     corpus porte par note est son `extrait`, qui devient le corps Référence.
 *  2. LE CORPS OPÉRATIONNEL des cinq notes qui le déclarent : aucun texte. Un document
 *     vide est écrit, jamais une prose fabriquée.
 *  3. LES DATES DE CRÉATION ET DE MODIFICATION. Le corpus porte `jours`, une ancienneté
 *     au sens de `RG-M06-01` : la date écrite est `DATE_REFERENCE - jours`, et
 *     `verifierFraicheur()` la contrôle.
 *  4. L'HEURE. Le corpus la déclare indéterminable. Convention explicite : minuit UTC.
 *  5. L'IDENTITÉ DU VÉRIFICATEUR (M06.2). Absente : la colonne reste nulle.
 *  6. LES PIÈCES JOINTES. Le corpus n'en porte que le NOMBRE : aucune ligne n'est écrite,
 *     un nom de fichier inventé serait une valeur illustrative.
 */
import { corpsVide } from '../contenu/corps-vide';
import { analyserDocument, type Document } from '../contenu/document';
import { SEUILS_PAR_DEFAUT, niveauFraicheur } from '../fraicheur';
import { identifiantLisible, segmentsDeDossier } from '../rangement/adresses';
import {
	COMPTES,
	CONFIG,
	CORPUS,
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
	VERSIONS,
	type CleDeModule,
	type CleDeTypeDeRelation,
	type Note,
	type TypeDeChamp
} from '../../../seeds/corpus';

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

export function anciennete(instant: Date): number {
	return Math.floor((instantDeReference().getTime() - instant.getTime()) / MILLISECONDES_PAR_JOUR);
}

/**
 * L'instant situé `mois` mois de calendrier avant la date de référence. Le jour du mois est
 * CONSERVÉ, et ramené au dernier jour du mois d'arrivée quand celui-ci est plus court.
 * L'instant de référence est un PARAMÈTRE pour cela : `DATE_REFERENCE` tombe un 13, aucune
 * valeur du jeu ne peut faire jouer le ramenage, et une branche qu'aucun cas ne peut
 * atteindre est un espoir (`P-5`).
 */
export function instantMoisAvantReference(mois: number, depuis?: Date): Date {
	const reference = depuis ?? instantDeReference();
	const annee = reference.getUTCFullYear();
	const moisDeReference = reference.getUTCMonth();
	const jour = reference.getUTCDate();
	/* Le jour 0 du mois suivant est le dernier jour du mois visé. */
	const dernierJour = new Date(Date.UTC(annee, moisDeReference - mois + 1, 0)).getUTCDate();
	return new Date(
		Date.UTC(
			annee,
			moisDeReference - mois,
			Math.min(jour, dernierJour),
			reference.getUTCHours(),
			reference.getUTCMinutes()
		)
	);
}

/**
 * Le libellé de dernière connexion du jeu, rendu à l'instant qu'il désigne. `interface
 * Compte` porte `derniere` en toutes lettres — « aujourd'hui à 08:41 », « il y a 8 mois » :
 * c'est un RENDU relatif, la DONNÉE est l'instant.
 *
 * CE SENS-LÀ EST DÉDUCTIBLE, L'AUTRE NE L'EST PAS : passer de l'instant au libellé
 * demanderait le seuil où « N jours » devient « N mois » et l'heure d'un « il y a 3 jours »,
 * deux règles qu'aucune source ne porte.
 *
 * DEUX CONVENTIONS SONT CHOISIES ICI, PAS DÉDUITES : « il y a N jours » et « il y a N mois »
 * reçoivent minuit UTC ; « aujourd'hui » et « hier » portent une heure, lue en UTC.
 * L'apostrophe est acceptée sous ses deux formes. Tout libellé d'une autre forme fait LEVER :
 * rendre `null` sur l'inconnu perdrait silencieusement une donnée que le jeu porte.
 */
export function instantDeDerniereConnexion(libelle: string): Date {
	const normalise = libelle.replace(/’/g, "'").trim();

	const aujourdhui = /^aujourd'hui à (\d{1,2}):(\d{2})$/.exec(normalise);
	const hier = /^hier à (\d{1,2}):(\d{2})$/.exec(normalise);
	const jours = /^il y a (\d+) jours?$/.exec(normalise);
	const mois = /^il y a (\d+) mois$/.exec(normalise);

	const aLHeure = (joursAvant: number, heures: string, minutes: string): Date => {
		const jour = new Date(instantDeReference().getTime() - joursAvant * MILLISECONDES_PAR_JOUR);
		return new Date(
			Date.UTC(
				jour.getUTCFullYear(),
				jour.getUTCMonth(),
				jour.getUTCDate(),
				Number(heures),
				Number(minutes)
			)
		);
	};

	if (aujourdhui?.[1] !== undefined && aujourdhui[2] !== undefined) {
		return aLHeure(0, aujourdhui[1], aujourdhui[2]);
	}
	if (hier?.[1] !== undefined && hier[2] !== undefined) {
		return aLHeure(1, hier[1], hier[2]);
	}
	if (jours?.[1] !== undefined) return instantAvantReference(Number(jours[1]));
	if (mois?.[1] !== undefined) return instantMoisAvantReference(Number(mois[1]));

	throw new Error(`libellé de dernière connexion illisible : ${libelle}`);
}

/**
 * Un document ProseMirror sérialisé, tel qu'`ADR-003` le décrit. Le format est
 * défini par `../contenu/document.ts` ; ce module s'y rattache plutôt que d'en
 * tenir une seconde définition, qui divergerait.
 */
export type DocumentDeNote = Document;

/**
 * Le corps Référence dérivé du seul texte que le corpus porte : l'extrait. Le
 * document est VALIDÉ avant d'être rendu — `ADR-003` interdit « toute écriture
 * directe en base d'un document non validé », et la semence en est une.
 */
export function corpsDepuisTexte(texte: string): DocumentDeNote {
	return analyserDocument({
		type: 'doc',
		content: [{ type: 'paragraph', content: [{ type: 'text', text: texte }] }]
	});
}

/* LE CORPS VIDE N'EST PLUS DÉFINI ICI : `corpsVide()` est la définition du
   PRODUIT, et ce module tire `seeds/corpus.ts` EN VALEUR — tout appelant qui la
   touchait embarquait les 32 notes du jeu de démonstration derrière elle. */

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
	readonly domaineNom: string;
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
	/** Le domaine principal, par son nom. Nullable au schéma (RG-M14-04). */
	readonly domaineNom: string | null;
	readonly derniereConnexionLe: Date | null;
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
	/**
	 * Les étiquettes DANS L'ORDRE DU JEU : cet ordre n'est pas l'ordre alphabétique
	 * sur 25 notes de 32, et `etiquettes_de_note.ordre` en porte le rang — celui de
	 * ce tableau, sans retri.
	 */
	readonly etiquettes: readonly string[];
	readonly signetAdresse: string | null;
	readonly signetAjouteLe: string | null;
	readonly revisionDemandee: boolean;
	readonly revisionCommentaire: string | null;
	readonly revisionParNom: string | null;
	readonly revisionLe: Date | null;
}

/**
 * Le renommage de « Production » en « Technique », à l'étage du semeur. Il ne peut PAS se
 * faire dans `seeds/corpus.ts` : ce fichier est la transcription des maquettes gelées, et
 * son test le prouve en relisant `mockups/`. Le produit sert désormais deux univers de
 * contenu. Conséquence assumée : les adresses passent de `/univers/production/…` à
 * `/univers/technique/…`.
 */
const RENOMMAGES_DUNIVERS: Readonly<Record<string, string>> = { Production: 'Technique' };

function nomDUniversSeme(nom: string): string {
	return RENOMMAGES_DUNIVERS[nom] ?? nom;
}

export function lignesDUnivers(): readonly LigneDUnivers[] {
	return UNIVERS.map((u, rang) => ({
		identifiant: identifiantLisible(nomDUniversSeme(u.nom)),
		nom: nomDUniversSeme(u.nom),
		description: u.description,
		couleur: u.couleur,
		glyphe: u.glyphe,
		ordre: u.ordre ?? rang + 1,
		systeme: u.systeme === true
	}));
}

export function lignesDeDomaine(): readonly LigneDeDomaine[] {
	return DOMAINES.map((d) => {
		/* `NomDeDomaine` est une CHAÎNE depuis que le vocabulaire s'ouvre : la table de
		   détail peut donc ne rien porter pour un nom. Un domaine du corpus en a
		   toujours un — sinon le jeu est incohérent, et il vaut mieux le dire ici. */
		const detail = DETAIL_DOMAINES[d.nom];
		if (detail === undefined) throw new Error(`domaine sans détail : ${d.nom}`);
		return {
			universNom: nomDUniversSeme(d.univers),
			identifiant: identifiantLisible(d.nom),
			nom: d.nom,
			description: detail.description,
			couleur: d.couleur,
			modules: detail.modules.map((cle: CleDeModule) => MODULE_EN_ENUM[cle])
		};
	});
}

/**
 * Les dossiers, déduits des chemins que portent les notes. `RG-STR-03` exige un
 * dossier racine par domaine, dont le NOM n'est spécifié nulle part — ni l'adresse
 * ni aucune maquette ne l'affichent. Il reçoit ici le nom de son domaine.
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

/**
 * Les comptes de la console (V-32). `Compte.id` n'est pas écrit : `comptes.identifiant`
 * porte déjà l'identifiant de connexion que le cahier énumère, et un second identifiant
 * qu'aucune règle ne demande serait une colonne de commodité de semence.
 */
export function lignesDeCompte(): readonly LigneDeCompte[] {
	return COMPTES.map((c) => ({
		identifiant: c.identifiant,
		nom: c.nom,
		courriel: c.courriel,
		role: ROLE_EN_ENUM[c.role],
		actif: c.actif,
		arriveLe: dateCourteEnIso(c.arrivee),
		/* Les cinq comptes du jeu en portent un. La colonne est malgré tout
		   nullable — RG-M14-04 l'exige —, et c'est la semence qui n'exerce pas
		   ce cas, non le schéma qui l'interdit. */
		domaineNom: c.domaine,
		derniereConnexionLe: instantDeDerniereConnexion(c.derniere)
	}));
}

export interface LigneDeReferentiel {
	readonly identifiant: string;
	readonly nom: string;
	readonly ordre: number;
}

/** Les types de note employés par les maquettes — cinq des onze de CDC §3.4. */
/** Une ligne de `droits_de_dossier`, telle que la semence la pose. */
export interface LigneDeDroitDeDossier {
	readonly compteNom: string;
	readonly domaineNom: string;
	readonly droit: 'lecteur' | 'redacteur' | 'gestionnaire';
}

/**
 * Les droits du corpus de démonstration — et pourquoi il en faut.
 *
 * `RG-DRO-02` est sans appel : « aucun droit explicite, aucune capacité ». Sans une seule
 * ligne dans `droits_de_dossier`, les quatre comptes non administrateurs ne peuvent RIEN
 * écrire, quand les maquettes montrent l'inverse — la position par défaut de V-14 est
 * « Droits : écriture ».
 *
 * LA DÉRIVATION EST CELLE DE `CDC` §2.3, ET RIEN DE PLUS : référent → gestionnaire,
 * contributeur → rédacteur, lecteur → lecteur, administrateur → AUCUNE LIGNE (`RG-DRO-03`
 * contourne déjà tout). LE DROIT PORTE SUR LA RACINE DU DOMAINE, et il descend seul
 * (`RG-DRO-01`) : une ligne par dossier fabriquerait des droits qu'aucune source ne décrit.
 */
export function lignesDeDroitDeDossier(): readonly LigneDeDroitDeDossier[] {
	const parRole: Record<string, LigneDeDroitDeDossier['droit'] | null> = {
		administrateur: null,
		referent: 'gestionnaire',
		contributeur: 'redacteur',
		lecteur: 'lecteur'
	};
	const lignes: LigneDeDroitDeDossier[] = [];
	for (const compte of lignesDeCompte()) {
		const droit = parRole[compte.role];
		if (droit === null || droit === undefined || compte.domaineNom === null) continue;
		lignes.push({ compteNom: compte.nom, domaineNom: compte.domaineNom, droit });
	}
	return lignes;
}

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

export function lignesDEtiquette(notes: readonly Note[] = CORPUS): readonly string[] {
	return [...new Set(notes.flatMap((n) => n.etiquettes))].sort((a, b) => a.localeCompare(b, 'fr'));
}

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

export interface LigneDeVersion {
	readonly noteIdentifiant: string;
	readonly numero: number;
	readonly le: Date;
	readonly auteurNom: string;
	readonly resume: string;
	readonly ajout: number;
	readonly retrait: number;
	readonly titre: string;
	readonly corpsReference: DocumentDeNote;
}

/**
 * Les versions du corpus — l'historique et la comparaison n'ont rien à montrer sans elles.
 *
 * CE QUE LE CORPUS PORTE, ET CE QU'IL NE PORTE PAS : `VERSIONS` donne le journal — numéro,
 * ancienneté, auteur, quantités, résumé — pour les deux notes que V-15 et V-16 mettent en
 * scène, mais PAS le corps de chaque version. Le corps est donc dérivé de l'extrait de la
 * note : un corps inventé serait une semence inventée, un corps absent violerait `NOT NULL`.
 * Le titre est celui de la note : aucune version du corpus n'en porte d'autre.
 */
export function lignesDeVersion(notes: readonly Note[] = CORPUS): readonly LigneDeVersion[] {
	const parIdentifiant = new Map(notes.map((n) => [n.id, n]));
	const lignes: LigneDeVersion[] = [];
	for (const [identifiant, versions] of Object.entries(VERSIONS)) {
		const note = parIdentifiant.get(identifiant as Note['id']);
		/* Une version sans sa note ne s'insère pas : la clé étrangère la refuse,
		   et le corpus peut décrire un historique pour une note écartée du jeu. */
		if (note === undefined || versions === undefined) continue;
		for (const v of versions) {
			lignes.push({
				noteIdentifiant: identifiant,
				numero: v.n,
				le: instantAvantReference(v.jours),
				auteurNom: v.auteur,
				resume: v.resume,
				ajout: v.ajout,
				retrait: v.retrait,
				titre: note.titre,
				corpsReference: corpsDepuisTexte(note.extrait)
			});
		}
	}
	return lignes;
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
 * Les paramètres globaux (CDC §3.3). Les deux seuils viennent de `CONFIG`, qui les
 * LIT de `SEUILS_PAR_DEFAUT` : `ADR-005` interdit toute duplication littérale
 * ailleurs que dans la configuration lue par l'implémentation unique.
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

export interface Divergence {
	readonly quoi: string;
	readonly attendu: string;
	readonly obtenu: string;
}

/**
 * Le contrôle qui compte : les dates écrites redonnent-elles, par
 * `niveauFraicheur()`, le niveau que le corpus porte ? Si non, la dérivation est
 * fausse et le corpus chargé ment sur la fraîcheur.
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
 * Le second contrôle : l'univers que chaque note déclare est-il bien celui de son
 * domaine ? Le schéma ne stocke pas l'univers sur la note — il se lit par le
 * domaine —, ce qui n'est licite que si le corpus est cohérent.
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

export function nombreDeModules(): number {
	return Object.keys(MODULES).length;
}
