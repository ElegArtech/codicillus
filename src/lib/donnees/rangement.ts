/**
 * Le rangement, lu depuis la base — univers, domaine, dossiers, notes lisibles.
 *
 * Ce module est bâti sur `./lecture.ts`, qui rend les formes de `seeds/corpus.ts` SANS
 * AUCUN FILTRE : il n'en redéfinit aucun type et lui délègue tout ce qui ne dépend pas de
 * l'appelant. CE QU'IL AJOUTE, ET C'EST TOUT : le PÉRIMÈTRE. `ADR-006` interdit « toute
 * route qui reçoit une liste puis la filtre », d'où `lireNotesLisibles()`, qui porte
 * l'ensemble des dossiers lisibles DANS son `where`. AUCUNE RÈGLE DE DROIT N'EST ÉCRITE
 * ICI : `../droits/resolution.ts` est l'implémentation unique.
 *
 * LE SÉPARATEUR DE CHEMIN EST UNE DONNÉE DU GEL : espace, chevron simple droit (U+203A),
 * espace — relevé sur pièce, les deux espaces en font partie. L'ADRESSE, elle, n'emploie
 * pas ce séparateur : `{chemin…}` est une suite de segments séparés par des barres
 * obliques, chacun étant l'identifiant lisible du nom.
 *
 * LA RACINE N'EST PAS DANS LE CHEMIN : `dossiers` porte un dossier de profondeur 1 par
 * domaine, dont le nom est celui du domaine (`RG-STR-03`), et il n'apparaît ni dans
 * `Note.dossier`, ni dans l'axe « Dossier » de V-13, ni dans l'adresse. MAIS LA RACINE A
 * UNE PAGE, et ce module ne la décide pas : le chargeur de V-13 lui donne l'adresse qui
 * porte son seul nom, parce qu'un domaine neuf n'a que sa racine et que le premier
 * dossier ne pouvait sans cela être créé de nulle part.
 */
import { error } from '@sveltejs/kit';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Base } from '../base/acces';
import {
	comptes,
	domaines,
	dossiers,
	droitsDeDossier,
	etiquettes,
	etiquettesDeNote,
	modulesDeDomaine,
	notes,
	piecesJointes,
	typesDeFiche,
	typesDeNote,
	univers
} from '../base/schema';
import {
	capacites,
	indexerLesDroits,
	perimetreDeLecture,
	resoudreDroitDeDossier,
	type DroitDeDossier,
	type Identite,
	type IndexDesDroits,
	type Perimetre
} from '../droits/resolution';
import { niveauFraicheur } from '../fraicheur';
import { identifiantLisible } from '../rangement/adresses';
import {
	dateCourteDInstant,
	dateCourteDIso,
	extraitDuCorps,
	joursEcoules,
	lireCheminsDeDossier,
	lireSeuils,
	type ContexteDeLecture
} from './lecture';
import type { CleDeModule, Note, TypeDeFiche, TypeDeNote } from '../../../seeds/corpus';

/**
 * Le séparateur AFFICHÉ d'un chemin de dossier — espace, U+203A, espace.
 * Voir l'en-tête : c'est un relevé du gel, à trois caractères et cinq octets.
 */
export const SEPARATEUR_DE_CHEMIN = ' › ';

/**
 * Le plafond de `RG-STR-04`, que `dossiers_profondeur_plafonnee` porte déjà en
 * base. Il est relu ici pour REFUSER une adresse trop profonde sans interroger la
 * base : le dire coûte une comparaison plutôt qu'une requête.
 */
export const PROFONDEUR_MAX = 10;

export interface LigneDeDossier {
	readonly id: string;
	readonly parentId: string | null;
	readonly domaineId: string;
	readonly nom: string;
	readonly profondeur: number;
	/**
	 * Le rang dans la fratrie — `dossiers.position`, et c'est la SEULE règle d'ordre que le
	 * produit connaisse entre frères. OPTIONNELLE, et c'est délibéré : ce type est
	 * STRUCTUREL, et le rendre obligatoire forcerait tout cas synthétique à renseigner un
	 * rang dont il n'a que faire. Absente, elle vaut `0` chez l'appelant qui trie.
	 */
	readonly position?: number;
}

/** Le chemin affiché d'une suite de segments — la forme de `Note.dossier`. */
export function cheminAffiche(segments: readonly string[]): string {
	return segments.join(SEPARATEUR_DE_CHEMIN);
}

/**
 * Le dossier qu'une adresse désigne, ou `null`. Fonction PURE : elle descend
 * l'arborescence maillon par maillon depuis la racine. Trois refus — un chemin VIDE (la
 * racine n'est pas une page de dossier), un chemin au-delà de `PROFONDEUR_MAX`
 * (`RG-STR-04`), un segment qui ne correspond à aucun ENFANT du maillon courant.
 *
 * La descente est faite par PARENT, jamais par nom global : deux domaines portent tous
 * deux un dossier « Applications ».
 */
export function resoudreLeChemin(
	lignes: readonly LigneDeDossier[],
	segments: readonly string[]
): LigneDeDossier | null {
	if (segments.length === 0 || segments.length > PROFONDEUR_MAX - 1) return null;
	const racine = lignes.find((d) => d.parentId === null);
	if (racine === undefined) return null;

	let courant = racine;
	for (const segment of segments) {
		const enfant = lignes.find(
			(d) => d.parentId === courant.id && identifiantLisible(d.nom) === segment
		);
		if (enfant === undefined) return null;
		courant = enfant;
	}
	return courant;
}

/**
 * Les segments affichés d'un dossier — racine exclue, du plus haut au dossier lui-même.
 * Fonction PURE, inverse exact de `resoudreLeChemin()`. Le garde-fou de cycle est celui
 * de `chaineDAncetres()` : le schéma n'exclut pas un cycle long, la remontée s'arrête au
 * premier identifiant déjà vu, et rend un chemin tronqué plutôt qu'une boucle.
 */
export function segmentsAffiches(
	lignes: readonly LigneDeDossier[],
	dossierId: string
): readonly string[] {
	const parId = new Map(lignes.map((d) => [d.id, d]));
	const remontee: string[] = [];
	const vus = new Set<string>();
	let courant = parId.get(dossierId);
	while (courant !== undefined && !vus.has(courant.id) && courant.parentId !== null) {
		vus.add(courant.id);
		remontee.push(courant.nom);
		courant = parId.get(courant.parentId);
	}
	return remontee.reverse();
}

/**
 * `moduleDeDomaine` de la base vers la clé des maquettes.
 * `lireModulesParDomaine()` porte la même table indexée par NOM de domaine ; ici
 * la lecture se fait par IDENTIFIANT de ligne, seule indépendante du nom affiché.
 */
const MODULE_DEPUIS_ENUM: Record<string, CleDeModule> = {
	notes: 'notes',
	dossiers: 'dossiers',
	fiches: 'fiches',
	cartographie: 'cartographie',
	signets: 'signets',
	carte_mentale: 'carteMentale'
};

/**
 * `RG-STR-06` — « un module non activé n'apparaît ni dans la navigation du domaine, ni
 * dans ses tableaux de bord », et `P-04` : « l'activation n'est pas décorative ».
 * Fonction PURE, éprouvable dans les deux polarités sans base.
 *
 * LA CONSÉQUENCE POUR UNE ROUTE : l'adresse d'un module non activé ne rend rien, et le
 * refus prend la forme du régime indiscernable — la route ne dit pas « module désactivé ».
 */
export function moduleActif(actifs: ReadonlySet<CleDeModule>, module: CleDeModule): boolean {
	return actifs.has(module);
}

export async function lireModulesDuDomaine(
	base: Base,
	domaineId: string
): Promise<ReadonlySet<CleDeModule>> {
	const lignes = await base
		.select({ module: modulesDeDomaine.module })
		.from(modulesDeDomaine)
		.where(eq(modulesDeDomaine.domaineId, domaineId));

	const actifs = new Set<CleDeModule>();
	for (const ligne of lignes) {
		const cle = MODULE_DEPUIS_ENUM[ligne.module];
		if (cle === undefined) throw new Error(`module inconnu en base : ${ligne.module}`);
		actifs.add(cle);
	}
	return actifs;
}

/**
 * Ce qu'une requête de rangement sait de son appelant — établi UNE FOIS par
 * requête, jamais par dossier : « refaire un balayage linéaire à chaque niveau
 * ferait du coût une raison de contourner la règle » (`resolution.ts`).
 */
export interface AccesAuRangement {
	readonly identite: Identite;
	readonly index: IndexDesDroits;
	readonly perimetre: Perimetre;
	readonly contexte: ContexteDeLecture;
	readonly dossiers: readonly LigneDeDossier[];
}

/**
 * L'accès d'une requête, et le seul endroit où le périmètre est calculé.
 *
 * DEUX CHOSES SE LISENT ICI, ET PAS UNE DE PLUS : l'arborescence entière — la remontée
 * d'ancêtres de `RG-DRO-01` en a besoin, un dossier hors périmètre pouvant être l'ancêtre
 * d'un dossier dans le périmètre — et les droits explicites DU SEUL COMPTE APPELANT.
 *
 * LE PÉRIMÈTRE ANONYME EST VIDE ICI, ET CE N'EST PAS UN RACCOURCI : celui-ci est le
 * périmètre AUTORISÉ, le périmètre PUBLIC étant celui de `/guides/{identifiant}`. La
 * matrice §5.5 rend **404 V-04** à l'anonyme sur `/univers/…`, sans condition — ne passer
 * aucune note est la transcription de cette ligne, non une omission.
 */
export async function ouvrirLAcces(
	base: Base,
	identite: Identite,
	maintenant: Date
): Promise<AccesAuRangement> {
	const lignes = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			domaineId: dossiers.domaineId,
			nom: dossiers.nom,
			profondeur: dossiers.profondeur,
			position: dossiers.position
		})
		.from(dossiers);

	const explicites =
		identite.type === 'authentifie'
			? await base
					.select({
						dossierId: droitsDeDossier.dossierId,
						compteId: droitsDeDossier.compteId,
						droit: droitsDeDossier.droit
					})
					.from(droitsDeDossier)
					.where(eq(droitsDeDossier.compteId, identite.compteId))
			: [];

	const index = indexerLesDroits(lignes, explicites);
	return {
		identite,
		index,
		perimetre: perimetreDeLecture(identite, index),
		contexte: { maintenant, seuils: await lireSeuils(base) },
		dossiers: lignes
	};
}

/**
 * Le droit effectif de l'appelant sur un dossier, ou `null`. Un seul appel, vers
 * l'implémentation unique — c'est la seule porte par laquelle un droit entre
 * dans ce module.
 */
export function droitEffectif(acces: AccesAuRangement, dossierId: string): DroitDeDossier | null {
	return resoudreDroitDeDossier(acces.identite, dossierId, acces.index);
}

/**
 * L'appelant peut-il écrire des notes dans l'un de ces dossiers ? C'est la table
 * de capacités de CDC §2.3 qui répond, par `capacites()` — aucune comparaison de
 * droit n'est écrite ici, et aucune n'a à l'être.
 */
export function peutEcrireDansLUn(
	acces: AccesAuRangement,
	dossiersVises: readonly string[]
): boolean {
	return dossiersVises.some((id) => capacites(droitEffectif(acces, id)).ecrireDesNotes);
}

/** Les dossiers d'un domaine, parmi ceux que `ouvrirLAcces()` a déjà lus. */
export function dossiersDuDomaine(
	acces: AccesAuRangement,
	domaineId: string
): readonly LigneDeDossier[] {
	return acces.dossiers.filter((d) => d.domaineId === domaineId);
}

/**
 * LE DOMAINE EST-IL LISIBLE ? — un dossier au moins dont les capacités portent
 * la lecture. `capacites()` est la seule autorité : on ne présuppose pas que
 * « tout droit permet de lire », c'est la table de CDC §2.3 qui le dit.
 */
export function domaineLisible(acces: AccesAuRangement, domaineId: string): boolean {
	return dossiersDuDomaine(acces, domaineId).some(
		(d) => capacites(droitEffectif(acces, d.id)).lire
	);
}

export interface DomaineLisible {
	readonly id: string;
	readonly nom: string;
	readonly univers: string;
	readonly couleur: string;
	/**
	 * L'IDENTIFIANT D'ADRESSE DU DOMAINE, ET CELUI DE SON UNIVERS — persistés, stables sous
	 * les renommages (`RG-M12-11`), et donc les SEULS qui composent une adresse qui
	 * s'ouvre. Le nom ne le fait pas : slugifié, il rendait 404 dès le premier renommage.
	 */
	readonly identifiant: string;
	readonly universIdentifiant: string;
}

/**
 * Les domaines que l'appelant peut ouvrir — une seule décision pour tous ceux qui les
 * NOMMENT. Le rail était filtré ici et le tableau de bord de l'accueil lisait la table
 * entière : la MÊME réponse portait un rail vide et des cartes de domaines dont chacune
 * menait en 404. La fonction est ici, et non recopiée dans chaque chargeur, pour que deux
 * écrans de la même réponse ne PUISSENT plus se contredire (`RG-ACC-01`, `P-03`).
 */
export async function lireLesDomainesLisibles(
	base: Base,
	acces: AccesAuRangement
): Promise<readonly DomaineLisible[]> {
	const lignes = await base
		.select({
			id: domaines.id,
			nom: domaines.nom,
			univers: univers.nom,
			couleur: domaines.couleur,
			identifiant: domaines.identifiant,
			universIdentifiant: univers.identifiant
		})
		.from(domaines)
		.innerJoin(univers, eq(univers.id, domaines.universId))
		.orderBy(univers.ordre, domaines.nom);
	return lignes.filter((d) => domaineLisible(acces, d.id));
}

/**
 * Le seul point de sortie en refus des quatre routes du rangement — `ADR-007`, « une
 * réponse unique, produite par le même chemin de code, sert les deux cas ».
 *
 * Son unique entrée est le chemin demandé : la fonction n'a RIEN à quoi se raccrocher
 * pour distinguer « n'existe pas » de « vous n'y avez pas droit », et le type de retour
 * `never` interdit qu'un appelant reprenne la main pour nuancer.
 *
 * ELLE NE REND NI V-04 NI V-26 : écrire ici un rendu d'erreur ferait apparaître la
 * branche « interdit » que l'ADR interdit. `RG-ACC-04` n'est pas déclarée tenue par ce
 * lot : l'indiscernabilité de temps de réponse n'est mesurée par rien à ce jour.
 */
export function refuserLAdresse(chemin: string): never {
	/* Le chemin n'est pas transmis au cadre : le message d'une erreur voyage jusqu'au
	   client, et `masquerLAdresse()` de la batterie 6 masque le chemin AVANT comparaison
	   précisément parce qu'il est licite de l'afficher — mais rien n'exige de le faire. Il
	   reste dans la signature parce qu'une signature qui ne prend rien ne dit pas qu'elle
	   ne prend QUE cela. */
	void chemin;
	error(404, MESSAGE_INTROUVABLE);
}

export interface UniversResolu {
	readonly id: string;
	readonly nom: string;
	readonly identifiant: string;
}

export interface DomaineResolu {
	readonly id: string;
	readonly nom: string;
	readonly universId: string;
	readonly universNom: string;
	readonly couleur: string;
	/**
	 * Les deux identifiants d'adresse, tels que la base les porte. `identifiant`
	 * est persisté et stable sous les renommages (`RG-M12-11`), le nom ne l'est
	 * pas : une redirection dérivée du nom rendait 404 dès le premier renommage.
	 */
	readonly identifiant: string;
	readonly universIdentifiant: string;
}

/** L'univers d'un identifiant d'adresse, ou `null`. */
export async function lireUniversParIdentifiant(
	base: Base,
	identifiant: string
): Promise<UniversResolu | null> {
	const [ligne] = await base
		.select({ id: univers.id, nom: univers.nom, identifiant: univers.identifiant })
		.from(univers)
		.where(eq(univers.identifiant, identifiant));
	return ligne ?? null;
}

/**
 * Le domaine d'un couple d'identifiants d'adresse, ou `null`. `RG-STR-02` — l'unicité
 * d'un domaine n'est portée QUE par son univers, et le schéma la porte sur le couple : la
 * requête joint donc les deux, et il n'existe ici aucune lecture par le seul identifiant.
 */
export async function lireDomaineParIdentifiants(
	base: Base,
	identifiantUnivers: string,
	identifiantDomaine: string
): Promise<DomaineResolu | null> {
	const [ligne] = await base
		.select({
			id: domaines.id,
			nom: domaines.nom,
			couleur: domaines.couleur,
			universId: univers.id,
			universNom: univers.nom,
			identifiant: domaines.identifiant,
			universIdentifiant: univers.identifiant
		})
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.where(
			and(eq(univers.identifiant, identifiantUnivers), eq(domaines.identifiant, identifiantDomaine))
		);
	return ligne ?? null;
}

/**
 * Les domaines d'un univers, sans considération de droit — la liste que
 * `domaineLisible()` rabat ensuite, domaine par domaine.
 */
export async function lireDomainesDeLUnivers(
	base: Base,
	universId: string
): Promise<readonly { id: string; nom: string }[]> {
	return base
		.select({ id: domaines.id, nom: domaines.nom })
		.from(domaines)
		.where(eq(domaines.universId, universId))
		.orderBy(domaines.nom);
}

/**
 * La ligne brute d'une note, telle que la requête la rend. Le type est nommé
 * pour que la projection ci-dessous soit une fonction PURE, donc éprouvable
 * sans base.
 */
export interface LigneDeNote {
	readonly identifiant: string;
	readonly titre: string;
	readonly corpsReference: unknown;
	readonly corpsOperationnel: unknown;
	readonly typeNom: string;
	readonly typeFicheNom: string | null;
	readonly universNom: string;
	readonly domaineNom: string;
	readonly dossierId: string;
	readonly auteurNom: string;
	readonly visibilite: string;
	readonly statut: string;
	readonly modifieLe: Date;
	readonly verifieLe: Date | null;
	readonly consultations: number;
	readonly signetAdresse: string | null;
	readonly signetAjouteLe: string | null;
}

export interface VoisinesDeNote {
	readonly chemins: ReadonlyMap<string, string>;
	readonly etiquettes: ReadonlyMap<string, readonly string[]>;
	readonly piecesJointes: ReadonlyMap<string, number>;
}

/**
 * Une ligne vers une `Note` — la projection, et elle est PURE.
 *
 * Elle porte les mêmes décisions que `lireNotes()`, et le doublon est dans la PROJECTION,
 * jamais dans les CONVERSIONS : `extraitDuCorps`, `dateCourteDInstant`, `dateCourteDIso`,
 * `joursEcoules` et `niveauFraicheur` sont APPELÉES, pas réécrites. `lireNotes()` ne prend
 * aucun filtre, et `ADR-006` interdit de filtrer sa sortie — d'où cette seconde projection.
 *
 * LES DEUX LACUNES DÉCLARÉES DE LA LECTURE SONT REPRISES TELLES QUELLES : le nombre de
 * pièces jointes est le compte RÉEL, et l'ordre des étiquettes n'est pas représentable
 * faute de colonne de rang — elles sont triées en français, déterministe et déclaré.
 */
export function noteDepuisLigne(
	ligne: LigneDeNote,
	voisines: VoisinesDeNote,
	contexte: ContexteDeLecture
): Note {
	/* RG-M06-01 — la fraîcheur se lit sur la dernière vérification, et à défaut
	   sur la dernière modification. La comparaison au seuil, elle, n'est pas
	   écrite ici : `niveauFraicheur()` est l'implémentation unique (P-01). */
	const reference = ligne.verifieLe ?? ligne.modifieLe;
	const rendu: Record<string, unknown> = {
		id: ligne.identifiant,
		titre: ligne.titre,
		extrait: extraitDuCorps(ligne.corpsReference),
		type: ligne.typeNom as TypeDeNote,
		univers: ligne.universNom,
		domaine: ligne.domaineNom,
		dossier: voisines.chemins.get(ligne.dossierId) ?? '',
		auteur: ligne.auteurNom,
		fraicheur: niveauFraicheur(joursEcoules(reference, contexte.maintenant), contexte.seuils),
		/* L'ÂGE DE LA VÉRIFICATION — même correction, même raison qu'à
		   `./lecture.ts` : `fraicheur` et `jours` se calculent sur le MÊME
		   instant de référence, sans quoi le libellé contredit la jauge. */
		jours: joursEcoules(reference, contexte.maintenant),
		revise: ligne.verifieLe === null ? null : dateCourteDInstant(ligne.verifieLe),
		vues: ligne.consultations,
		pj: voisines.piecesJointes.get(ligne.identifiant) ?? 0,
		brouillon: ligne.statut === 'brouillon',
		visibilite: ligne.visibilite === 'publique' ? 'Publique' : 'Interne',
		operationnel: ligne.corpsOperationnel !== null,
		etiquettes: voisines.etiquettes.get(ligne.identifiant) ?? []
	};
	/* Trois clés OPTIONNELLES : omises quand la colonne est nulle, jamais posées
	   à la valeur indéfinie. Une clé présente et vide n'est pas la même valeur
	   qu'une clé absente pour une comparaison profonde — la raison est celle de
	   `T-030`, et c'est cette comparaison qui garde les lots suivants. */
	if (ligne.typeFicheNom !== null) rendu['typeFiche'] = ligne.typeFicheNom as TypeDeFiche;
	if (ligne.signetAdresse !== null) rendu['url'] = ligne.signetAdresse;
	if (ligne.signetAjouteLe !== null) rendu['ajoute'] = dateCourteDIso(ligne.signetAjouteLe);
	return rendu as unknown as Note;
}

/**
 * Les notes que l'appelant peut lire — LE FILTRE EST DANS LA REQUÊTE. Le `where`
 * ci-dessous est l'injection qu'`ADR-006` exige, et l'ensemble vient de
 * `perimetreDeLecture()`.
 *
 * UN PÉRIMÈTRE VIDE N'INTERROGE PAS LA BASE, et ce n'est pas une optimisation : un
 * ensemble vide passé à une clause d'appartenance est une expression que chaque dialecte
 * rend à sa façon, et le doute ne se résout jamais en faveur de l'accès.
 *
 * LE STATUT N'EST PAS FILTRÉ ICI : la visibilité des brouillons n'est réglée par aucune
 * règle, et le lot qui la spécifiera ajoutera son filtre dans `noteLisible()`.
 */
export async function lireNotesLisibles(
	base: Base,
	perimetre: Perimetre,
	contexte: ContexteDeLecture
): Promise<readonly Note[]> {
	const autorises = perimetre.tout ? null : [...perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];

	const filtre = autorises === null ? undefined : inArray(notes.dossierId, autorises);

	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel,
			typeNom: typesDeNote.nom,
			typeFicheNom: typesDeFiche.nom,
			universNom: univers.nom,
			domaineNom: domaines.nom,
			dossierId: notes.dossierId,
			auteurNom: comptes.nom,
			visibilite: notes.visibilite,
			statut: notes.statut,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			consultations: notes.compteurDeConsultations,
			signetAdresse: notes.signetAdresse,
			signetAjouteLe: notes.signetAjouteLe
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.leftJoin(typesDeFiche, eq(notes.typeDeFicheId, typesDeFiche.id))
		.where(filtre)
		.orderBy(notes.identifiant);

	const voisines: VoisinesDeNote = {
		chemins: await lireCheminsDeDossier(base),
		etiquettes: await lireEtiquettesLisibles(base, autorises),
		piecesJointes: await lirePiecesJointesLisibles(base, autorises)
	};
	return lignes.map((ligne) => noteDepuisLigne(ligne, voisines, contexte));
}

/**
 * Les étiquettes des notes du périmètre, triées en français. LE TRI EST FAIT EN
 * TYPESCRIPT, ET SURTOUT PAS PAR ORDRE SQL : la collation du serveur classe sur les
 * octets de l'encodage, où le e accentué suit le f, là où la collation française le place
 * avant. Déléguer le tri au serveur ferait dépendre l'ordre d'un réglage d'exploitation.
 */
async function lireEtiquettesLisibles(
	base: Base,
	autorises: readonly string[] | null
): Promise<ReadonlyMap<string, readonly string[]>> {
	const lignes = await base
		.select({ noteIdentifiant: notes.identifiant, libelle: etiquettes.libelle })
		.from(etiquettesDeNote)
		.innerJoin(notes, eq(etiquettesDeNote.noteId, notes.id))
		.innerJoin(etiquettes, eq(etiquettesDeNote.etiquetteId, etiquettes.id))
		.where(autorises === null ? undefined : inArray(notes.dossierId, autorises));

	const par = new Map<string, string[]>();
	for (const ligne of lignes) {
		const deja = par.get(ligne.noteIdentifiant);
		if (deja === undefined) par.set(ligne.noteIdentifiant, [ligne.libelle]);
		else deja.push(ligne.libelle);
	}
	for (const libelles of par.values()) libelles.sort((a, b) => a.localeCompare(b, 'fr'));
	return par;
}

/**
 * Le nombre de pièces jointes des notes du périmètre — le compte RÉEL de la table,
 * donc zéro partout tant que rien n'en écrit. Le rendre autrement serait la valeur
 * illustrative que `P-02` proscrit.
 */
async function lirePiecesJointesLisibles(
	base: Base,
	autorises: readonly string[] | null
): Promise<ReadonlyMap<string, number>> {
	/* LE FILTRE EST CONSTRUIT PAR LE BÂTISSEUR, PAS ÉCRIT EN SQL, et c'est un défaut mesuré
	   qui l'impose : un tableau interpolé dans un modèle `sql` est développé en TUPLE —
	   `any(($1, $2, …))` —, que PostgreSQL refuse. Le symptôme est un 500 à la première
	   adresse servie, et il n'apparaît qu'avec un périmètre non total. `inArray()` rend un
	   seul paramètre de tableau, donc une requête que le dialecte accepte. */
	const filtre = autorises === null ? undefined : inArray(notes.dossierId, autorises);

	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			nombre: sql<number>`count(${piecesJointes.id})::int`
		})
		.from(notes)
		.leftJoin(piecesJointes, eq(piecesJointes.noteId, notes.id))
		.where(filtre)
		.groupBy(notes.identifiant);

	return new Map(lignes.map((l) => [l.identifiant, l.nombre]));
}

/**
 * Le message du refus, et pourquoi il est celui du cadre.
 *
 * `error(404)` sans message fait porter à la charge sérialisée `« Error: 404 »`, là où
 * une adresse qu'AUCUNE route ne dessert porte `« Not Found »`, défaut de SvelteKit. Un
 * octet, et il distingue « cette adresse existe et t'est refusée » de « cette adresse
 * n'existe pas » — exactement ce que `RG-ACC-04` interdit. Le produit adopte donc le
 * message du cadre, partout.
 */
export const MESSAGE_INTROUVABLE = 'Not Found';
