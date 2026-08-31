/**
 * L'import — le catalogue des formats, le classement d'un lot, son exécution.
 *
 * UN SEUL CONVERTISSEUR, ET IL N'EST PAS ÉCRIT ICI (`ADR-004`) : `analyserMarkdown` est
 * l'implémentation unique, et l'ADR interdit « les convertisseurs qualifiés de
 * temporaires, provisoires ou pour l'import seulement ». L'en-tête de métadonnées est
 * DÉTACHÉ, pas converti. DEUX VOIES QUI CONVERGENT (STACK §4.6), à UNE SEULE LIGNE de
 * `classerLeLot` : pas de seconde branche, donc rien qui puisse diverger.
 *
 * L'INDISPONIBILITÉ EST UN ÉTAT, JAMAIS UNE PANNE (`P-10`) : le lot va jusqu'au bout,
 * chaque fichier en échec est consigné avec son motif. LA SIMULATION EST LE MÊME CODE
 * (`RG-M12-02`) : elle décide seulement du sort de la transaction, après que tout a été
 * fait et compté. Un `if` de plus, et la propriété tombe.
 *
 * CE QUE CE MODULE NE TIENT PAS : `RG-M12-01`, `UC-M12-02` et `UC-M12-03` reposent sur
 * une convention d'en-tête « documentée » qui n'existe nulle part au dépôt.
 * `MANQUES_DE_L_IMPORT` recense le reste.
 */
import { and, eq } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import {
	champsDeTypeDeFiche,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	notes,
	typesDeFiche,
	typesDeNote
} from '../base/schema';
import type { Document } from '../contenu/document';
import { analyserMarkdown } from '../contenu/markdown';
import { entretenirLIndex } from '../recherche/entretien';
import { identifiantLisible } from '../rangement/adresses';
import { PROFONDEUR_MAX } from './rangement';
import { proprietesSoumises, retenirLesProprietes } from './creation';
import { CLE_PROPRIETES_DE_FICHE, CLE_TYPE_DE_FICHE } from '../export/archive';
import type { FormatDImport, SortDeFichier } from '../../../seeds/corpus';

/**
 * La voie qu'un format emprunte — `application`, `service`, `ecarte`. La table de
 * STACK §4.6 les décide toutes.
 */
export type VoieDeTraitement = 'application' | 'service' | 'ecarte';

/**
 * La voie de chaque format — transcription de la table de STACK §4.6, et de rien
 * d'autre. Les formats écartés figurent au lot d'exemple du gel avec le motif de
 * leur écart, et `doc` est absent de la table de STACK.
 */
export const VOIE_PAR_FORMAT: Readonly<Record<FormatDImport, VoieDeTraitement>> = {
	md: 'application',
	txt: 'application',
	docx: 'service',
	pptx: 'service',
	pdf: 'service',
	doc: 'ecarte',
	xlsx: 'ecarte',
	png: 'ecarte',
	zip: 'ecarte'
};

/**
 * L'outil que chaque format de la voie « service » exige — STACK §4.6, colonne
 * « Outil ». Les noms sont ceux que le service rend dans son état de santé.
 */
const OUTIL_PAR_FORMAT: Readonly<Partial<Record<FormatDImport, string>>> = {
	docx: 'pandoc',
	pptx: 'python-pptx',
	pdf: 'pdfplumber'
};

/**
 * L'outil qui ÉCRIT le Markdown, pour les trois formats : un conteneur privé de
 * Pandoc ne convertit rien du tout.
 */
const OUTIL_ECRIVAIN = 'pandoc';

/**
 * Le format d'un chemin, d'après son extension, ou `null`. La comparaison est
 * faite en minuscules : un fichier nommé en capitales est le même fichier.
 */
export function formatDuChemin(chemin: string): FormatDImport | null {
	const dernier = chemin.slice(chemin.lastIndexOf('.') + 1).toLowerCase();
	return dernier in VOIE_PAR_FORMAT ? (dernier as FormatDImport) : null;
}

/**
 * Les libellés des formats — la contrepartie française de `VOIE_PAR_FORMAT`, donc un
 * référentiel du produit. `Record` COMPLET, pas `Partial` : un libellé oublié ne compile
 * pas. Elle est rendue ENTIÈRE — en retirer les formats indisponibles ferait retomber le
 * rendu sur l'extension nue, sans message.
 */
export const LIBELLE_PAR_FORMAT: Readonly<Record<FormatDImport, string>> = {
	docx: 'Traitement de texte',
	doc: 'Traitement de texte (ancien)',
	pptx: 'Présentation',
	pdf: 'PDF',
	md: 'Markdown',
	txt: 'Texte brut',
	xlsx: 'Tableur',
	png: 'Image',
	zip: 'Archive'
};

export function libellesDeFormat(): Partial<Record<FormatDImport, string>> {
	return LIBELLE_PAR_FORMAT;
}

/**
 * Le point d'entrée de conversion : un fichier en corps brut, son nom en paramètre,
 * une réponse qui porte toujours `issue`. Contrat écrit une seule fois, ici et dans
 * `services/conversion/`.
 */
const CHEMIN_DE_CONVERSION = '/convertir';

export interface EtatDuServiceDeConversion {
	readonly joignable: boolean;
	/** La version de chaque outil, ou `null` s'il est absent du conteneur. */
	readonly outils: Readonly<Record<string, string | null>>;
	readonly complet: boolean;
}

/** Un service qu'on n'a pas pu joindre — aucun outil, rien de deviné. */
export const SERVICE_INJOIGNABLE: EtatDuServiceDeConversion = Object.freeze({
	joignable: false,
	outils: Object.freeze({}),
	complet: false
});

/**
 * L'état de santé du service, demandé une seule fois par lot. `recuperer` est un
 * PARAMÈTRE : sans lui, ce contrôle n'aurait pour cas d'épreuve que l'état du dépôt du
 * jour (`P-26`). AUCUNE PANNE NE REMONTE — une brique optionnelle injoignable est un
 * état, pas une erreur du produit.
 */
export async function sonderLeServiceDeConversion(
	recuperer: typeof fetch,
	adresse: string | undefined
): Promise<EtatDuServiceDeConversion> {
	if (adresse === undefined || adresse === '') return SERVICE_INJOIGNABLE;
	try {
		const reponse = await recuperer(`${adresse.replace(/\/+$/, '')}/sante`);
		if (!reponse.ok) return SERVICE_INJOIGNABLE;
		const corps = (await reponse.json()) as {
			outils?: Record<string, string | null>;
			complet?: boolean;
		};
		return { joignable: true, outils: corps.outils ?? {}, complet: corps.complet === true };
	} catch {
		return SERVICE_INJOIGNABLE;
	}
}

/**
 * Le motif pour lequel la voie « service » ne peut pas traiter ce format, ou `null`.
 * L'ordre des deux causes est celui de leur proximité : on ne reproche pas à un service
 * arrêté de manquer d'outils. L'OUTIL EXIGÉ N'EST PAS SEULEMENT CELUI DE STACK §4.6 :
 * Pandoc est le seul écrivain de Markdown du service, et un conteneur qui en est privé
 * ne convertit AUCUN des trois formats.
 */
export function motifDIndisponibilite(
	etat: EtatDuServiceDeConversion,
	format: FormatDImport
): MotifDEchec | null {
	if (!etat.joignable) return 'service-de-conversion-injoignable';
	const outils = [OUTIL_PAR_FORMAT[format], OUTIL_ECRIVAIN];
	for (const outil of outils) {
		if (outil !== undefined && (etat.outils[outil] ?? null) === null) {
			return 'outil-de-conversion-absent';
		}
	}
	return null;
}

export interface ImageExtraite {
	readonly nom: string;
	readonly typeMime: string;
	readonly octets: number;
	readonly contenuBase64: string;
}

/**
 * Ce que le service rend d'un fichier — du Markdown, jamais un document : il
 * « s'arrête à la production de Markdown » (`ADR-004`), et rien ici ne transforme la
 * chaîne autrement qu'en la passant à `analyserMarkdown`.
 */
export type ResultatDeConversion =
	| {
			readonly issue: 'converti';
			readonly markdown: string;
			readonly images: readonly ImageExtraite[];
			readonly avertissements: readonly string[];
	  }
	| { readonly issue: 'echec'; readonly motif: MotifDEchec };

/**
 * Les motifs que le service rend, traduits en motifs du produit. La table est FERMÉE des
 * deux côtés : un motif qu'une version ultérieure ajouterait ne traverse pas le rapport
 * jusqu'à l'écran, il devient `contenu-illisible`. Fichier protégé et fichier endommagé
 * sont distingués parce qu'ils appellent des gestes différents.
 */
const MOTIF_DU_SERVICE: Readonly<Record<string, MotifDEchec>> = {
	'fichier-endommage': 'fichier-endommage',
	'fichier-protege': 'fichier-protege',
	'delai-depasse': 'delai-de-conversion-depasse',
	'fichier-vide': 'contenu-illisible',
	'format-non-pris-en-charge': 'contenu-illisible',
	'outil-absent': 'outil-de-conversion-absent'
};

function adresseDeConversion(adresse: string, nom: string): string {
	return `${adresse.replace(/\/+$/, '')}${CHEMIN_DE_CONVERSION}?nom=${encodeURIComponent(nom)}`;
}

/**
 * Un fichier envoyé au service, et son verdict — jamais une exception. `RG-M12-04`
 * gouverne cette fonction de bout en bout : service muet, réponse tronquée, corps qui
 * n'est pas du JSON, chacun est un motif consigné et le lot continue. Le nom envoyé est
 * le NOM du fichier, pas son chemin.
 */
export async function convertirParLeService(
	recuperer: typeof fetch,
	adresse: string | undefined,
	fichier: FichierDepose
): Promise<ResultatDeConversion> {
	if (adresse === undefined || adresse === '') {
		return { issue: 'echec', motif: 'service-de-conversion-injoignable' };
	}
	if (fichier.binaire === null) {
		/* L'appelant n'a pas lu les octets : ce n'est pas le service qui manque,
		   c'est le fichier. Le dire autrement accuserait une brique optionnelle. */
		return { issue: 'echec', motif: 'contenu-illisible' };
	}
	const nom = fichier.chemin.slice(fichier.chemin.lastIndexOf('/') + 1);
	let reponse: Response;
	try {
		reponse = await recuperer(adresseDeConversion(adresse, nom), {
			method: 'POST',
			headers: { 'content-type': 'application/octet-stream' },
			/* Le corps EST le fichier, octet pour octet. La conversion de type est celle
			   du tableau d'octets vers un corps de requête, que la plateforme accepte. */
			body: fichier.binaire as BodyInit
		});
	} catch {
		return { issue: 'echec', motif: 'service-de-conversion-injoignable' };
	}
	if (!reponse.ok) return { issue: 'echec', motif: 'service-de-conversion-injoignable' };

	let corps: unknown;
	try {
		corps = await reponse.json();
	} catch {
		return { issue: 'echec', motif: 'contenu-illisible' };
	}
	return verdictDuCorps(corps);
}

export function verdictDuCorps(corps: unknown): ResultatDeConversion {
	if (typeof corps !== 'object' || corps === null) {
		return { issue: 'echec', motif: 'contenu-illisible' };
	}
	const lu = corps as {
		issue?: unknown;
		markdown?: unknown;
		motif?: unknown;
		images?: unknown;
		avertissements?: unknown;
	};
	if (lu.issue === 'echec') {
		const motif = typeof lu.motif === 'string' ? MOTIF_DU_SERVICE[lu.motif] : undefined;
		return { issue: 'echec', motif: motif ?? 'contenu-illisible' };
	}
	if (lu.issue !== 'converti' || typeof lu.markdown !== 'string') {
		return { issue: 'echec', motif: 'contenu-illisible' };
	}
	return {
		issue: 'converti',
		markdown: lu.markdown,
		images: imagesDu(lu.images),
		avertissements: Array.isArray(lu.avertissements)
			? lu.avertissements.filter((a): a is string => typeof a === 'string')
			: []
	};
}

function imagesDu(brut: unknown): readonly ImageExtraite[] {
	if (!Array.isArray(brut)) return [];
	const sorties: ImageExtraite[] = [];
	for (const element of brut) {
		if (typeof element !== 'object' || element === null) continue;
		const image = element as Record<string, unknown>;
		if (typeof image['nom'] !== 'string' || typeof image['contenu_base64'] !== 'string') continue;
		sorties.push({
			nom: image['nom'],
			typeMime: typeof image['type_mime'] === 'string' ? image['type_mime'] : '',
			octets: typeof image['octets'] === 'number' ? image['octets'] : 0,
			contenuBase64: image['contenu_base64']
		});
	}
	return sorties;
}

/**
 * Le lot envoyé au service, fichier par fichier. L'appel est SÉQUENTIEL : « ces
 * convertisseurs sont lents, consomment de la mémoire de façon irrégulière », et un lot
 * lancé de front ferait de la mémoire du conteneur le facteur limitant. Ne sont envoyés
 * que les fichiers de la voie « service », et seulement quand elle est disponible.
 */
export async function convertirLeLot(
	recuperer: typeof fetch,
	adresse: string | undefined,
	fichiers: readonly FichierDepose[],
	etat: EtatDuServiceDeConversion
): Promise<ReadonlyMap<string, ResultatDeConversion>> {
	const verdicts = new Map<string, ResultatDeConversion>();
	for (const fichier of fichiers) {
		const format = formatDuChemin(fichier.chemin);
		if (format === null || VOIE_PAR_FORMAT[format] !== 'service') continue;
		if (verdicts.has(fichier.chemin)) continue;
		if (fichier.octets === 0) continue;
		if (motifDIndisponibilite(etat, format) !== null) continue;
		verdicts.set(fichier.chemin, await convertirParLeService(recuperer, adresse, fichier));
	}
	return verdicts;
}

/**
 * Pourquoi un fichier n'est pas devenu une note — des CODES, pas des phrases. STACK §4.7
 * désigne la source des phrases françaises, « un catalogue de messages », qui n'existe
 * pas au dépôt : les écrire ici déciderait d'un texte d'interface en exécution.
 */
export type MotifDEcart =
	'format-non-converti' | 'format-inconnu' | 'fichier-vide' | 'doublon-dans-le-lot';

export type MotifDEchec =
	| 'service-de-conversion-injoignable'
	| 'outil-de-conversion-absent'
	/** Le service a répondu que le fichier est chiffré — gel de V-24. */
	| 'fichier-protege'
	/** Le service a répondu que la structure interne ne s'ouvre pas — gel de V-24. */
	| 'fichier-endommage'
	/** La conversion a dépassé `DELAI_MAX_CONVERSION` et a été tuée (RG-M12-04). */
	| 'delai-de-conversion-depasse'
	/**
	 * Aucun verdict pour ce fichier. Le motif existe parce que `RG-M12-04` interdit de
	 * lever : un défaut d'enchaînement devient une ligne du rapport, pas un lot perdu.
	 */
	| 'conversion-absente'
	| 'contenu-illisible';

/**
 * Les deux avertissements que l'import lève lui-même (`RG-M12-04`), au même rang que
 * ceux du service : un ÉCART SILENCIEUX est un défaut. Ni l'un ni l'autre n'est un
 * échec — une note reste une note sans ses propriétés.
 */
export const AVERTISSEMENT_PROPRIETES_ILLISIBLES = 'proprietes-de-fiche-illisibles';

/** Le nom de type de fiche déclaré n'est dans aucun type de l'instance. */
export const AVERTISSEMENT_TYPE_DE_FICHE_INCONNU = 'type-de-fiche-inconnu';

/**
 * Les clés lues, et la source de chacune. Les trois premières viennent de l'illustration
 * du troisième scénario de V-24. Les deux suivantes sont celles de l'export, IMPORTÉES
 * de lui et jamais recopiées ; les six autres qu'`UC-M12-03` énumère n'ont aucun nom de
 * clé au dépôt, et ne sont pas lues.
 */
const CLE_TITRE = 'titre';
const CLE_ETIQUETTES = 'etiquettes';
const CLE_RENVOIS = 'voir';

export interface EnTeteDetache {
	readonly titre: string | null;
	readonly etiquettes: readonly string[];
	/** Les identifiants de notes que le fichier dit voir — `RG-M12-03`. */
	readonly renvois: readonly string[];
	/** Le NOM du type de fiche déclaré, ou `null` — la note est simple. */
	readonly fiche: string | null;
	readonly proprietes: Readonly<Record<string, string>>;
	/**
	 * La ligne de propriétés était là ET NE S'EST PAS LUE. Le fait remonte jusqu'au
	 * rapport : sans lui, un en-tête abîmé faisait perdre les valeurs en silence.
	 */
	readonly proprietesIllisibles: boolean;
	readonly texte: string;
}

/** La ligne de délimitation d'un en-tête : trois tirets seuls sur leur ligne. */
const DELIMITEUR = /^-{3,}\s*$/;

function valeursDe(brut: string): string[] {
	const nu = brut.trim();
	const interieur = nu.startsWith('[') && nu.endsWith(']') ? nu.slice(1, -1) : nu;
	return interieur
		.split(',')
		.map((v) => v.trim().replace(/^["']|["']$/g, ''))
		.filter((v) => v !== '');
}

/**
 * L'en-tête détaché du texte — une enveloppe retirée, jamais une conversion : rien
 * ici ne nomme un nœud du format canonique, et le texte ressort ENTIER pour
 * l'implémentation unique. Un en-tête ouvert et jamais refermé n'en est pas un.
 */
export function detacherLEnTete(texte: string): EnTeteDetache {
	const lignes = texte.split('\n');
	const intact: EnTeteDetache = {
		titre: null,
		etiquettes: [],
		renvois: [],
		fiche: null,
		proprietes: {},
		proprietesIllisibles: false,
		texte
	};
	if (!DELIMITEUR.test(lignes[0] ?? '')) return intact;

	const fin = lignes.findIndex((l, i) => i > 0 && DELIMITEUR.test(l));
	if (fin === -1) return intact;

	let titre: string | null = null;
	let etiquettesLues: readonly string[] = [];
	let renvois: readonly string[] = [];
	let fiche: string | null = null;
	let proprietes: Readonly<Record<string, string>> = {};
	let proprietesIllisibles = false;

	for (const ligne of lignes.slice(1, fin)) {
		const separateur = ligne.indexOf(':');
		if (separateur === -1) continue;
		const cle = ligne.slice(0, separateur).trim().toLowerCase();
		const valeur = ligne.slice(separateur + 1);
		if (cle === CLE_TITRE) {
			const nu = valeur.trim().replace(/^["']|["']$/g, '');
			titre = nu === '' ? null : nu;
		} else if (cle === CLE_ETIQUETTES) {
			etiquettesLues = valeursDe(valeur);
		} else if (cle === CLE_RENVOIS) {
			renvois = valeursDe(valeur);
		} else if (cle === CLE_TYPE_DE_FICHE) {
			const nu = valeur.trim().replace(/^["']|["']$/g, '');
			fiche = nu === '' ? null : nu;
		} else if (cle === CLE_PROPRIETES_DE_FICHE) {
			/* L'export écrit cette valeur en JSON sur une ligne. Ce qui ne se lit pas est
				   ÉCARTÉ, jamais deviné, et LE FAIT REMONTE au rapport : un écart silencieux
				   est ce que `RG-M12-04` refuse. */
			const lu = proprietesSoumises(valeur.trim());
			proprietes = lu.ok ? lu.valeurs : {};
			proprietesIllisibles = !lu.ok;
		}
	}

	return {
		titre,
		etiquettes: etiquettesLues,
		renvois,
		fiche,
		proprietes,
		proprietesIllisibles,
		texte: lignes.slice(fin + 1).join('\n')
	};
}

export interface FichierDepose {
	readonly chemin: string;
	readonly octets: number;
	/**
	 * Le contenu décodé, pour la seule voie « application ». `null` pour tout fichier
	 * que l'application n'ouvre pas elle-même.
	 */
	readonly texte: string | null;
	/**
	 * Les octets bruts, pour la seule voie « service ». `null` partout ailleurs : un
	 * document bureautique part au service tel quel. Le champ est distinct de `texte`
	 * pour que le type interdise de confondre les deux voies.
	 */
	readonly binaire: Uint8Array | null;
}

export interface LigneDePlan {
	readonly chemin: string;
	readonly format: FormatDImport | null;
	readonly voie: VoieDeTraitement;
	readonly sort: SortDeFichier;
	readonly motif: MotifDEcart | MotifDEchec | null;
	readonly identifiant: string | null;
	/** `RG-M12-05` — le titre vient de l'en-tête, sinon du nom du fichier. */
	readonly titre: string | null;
	readonly corps: Document | null;
	/** `RG-M12-06` — les étiquettes déclarées à l'en-tête. */
	readonly etiquettes: readonly string[];
	/** Le NOM du type de fiche déclaré à l'en-tête, ou `null`. */
	readonly fiche: string | null;
	readonly proprietes: Readonly<Record<string, string>>;
	readonly segments: readonly string[];
	/** `RG-M12-10` — des niveaux ont été aplatis pour tenir sous le plafond. */
	readonly aplatie: boolean;
	/** `RG-M12-03` — les renvois déclarés, dont la résolution reste à faire. */
	readonly renvois: readonly string[];
	/**
	 * `M12.1` — les avertissements de la conversion, en codes. Celui du PDF sans texte
	 * extractible a déjà sa phrase DANS le corps : le code permet de le compter.
	 */
	readonly avertissements: readonly string[];
	/**
	 * `RG-M12-07` — les images extraites, portées jusqu'ici et PAS ÉCRITES : aucun
	 * stockage de pièce jointe n'existe. Les taire ferait croire qu'il n'y en a pas.
	 */
	readonly images: readonly ImageExtraite[];
}

export interface PlanDImport {
	readonly source: string;
	readonly lignes: readonly LigneDePlan[];
	readonly total: number;
	readonly notes: number;
	readonly ignores: number;
	readonly echecs: number;
}

export interface ContexteDeClassement {
	readonly service: EtatDuServiceDeConversion;
	/**
	 * Les identifiants lisibles déjà pris en base. `RG-M12-11` : « rendus uniques
	 * automatiquement en cas de collision, SANS ÉCRASER de note existante ».
	 */
	readonly identifiantsPris: ReadonlySet<string>;
	/**
	 * La profondeur du dossier qui reçoit le lot. La racine d'un domaine vaut 1
	 * (contrainte `dossiers_racine_sans_parent`).
	 */
	readonly profondeurDeDepart: number;
	/**
	 * Ce que la cible contient déjà — la clé de l'idempotence (`RG-M12-01`) : l'identifiant
	 * lisible de chaque note du sous-arbre, et le CHEMIN où elle est rangée sous la cible.
	 * `RG-M12-01` veut qu'un réimport METTE À JOUR, `RG-M12-11` qu'une collision N'ÉCRASE
	 * PAS : le discriminant est le CHEMIN, seul que le dépôt possède. VIDE PAR DÉFAUT :
	 * sans elle, on retrouve `RG-M12-11` seul.
	 */
	readonly notesDeLaCible?: ReadonlyMap<string, string> | undefined;
	/**
	 * Le verdict du service pour chaque fichier de la voie « service ». Établi AVANT
	 * le classement, qui est synchrone et n'a pas de réseau : c'est ce qui en fait une
	 * décision pure, et ce qui laisse la simulation faire exactement l'import réel.
	 */
	readonly conversions: ReadonlyMap<string, ResultatDeConversion>;
}

/** Le nom d'un fichier, extension retirée. `RG-M12-05`, seconde branche. */
function nomSansExtension(chemin: string): string {
	const nom = chemin.slice(chemin.lastIndexOf('/') + 1);
	const point = nom.lastIndexOf('.');
	return point <= 0 ? nom : nom.slice(0, point);
}

/**
 * Un identifiant lisible libre — `RG-M12-11`. La forme vient de `identifiantLisible()` ;
 * seule la levée de collision appartient à l'import, et elle suffixe un rang plutôt que
 * d'écraser. Un nom qui ne laisse aucun caractère retenu retombe sur un identifiant de
 * rang, faute de quoi il n'aurait pas d'adresse.
 */
export function identifiantLibre(nom: string, pris: ReadonlySet<string>, rang: number): string {
	const racine = identifiantLisible(nom) || `note-${rang}`;
	if (!pris.has(racine)) return racine;
	let suffixe = 2;
	while (pris.has(`${racine}-${suffixe}`)) suffixe += 1;
	return `${racine}-${suffixe}`;
}

/**
 * L'identifiant d'un fichier du lot — repris s'il désigne la même note, rendu unique
 * sinon. C'est ici que `RG-M12-01` et `RG-M12-11` se départagent : REPRIS quand la cible
 * porte déjà une note de cet identifiant RANGÉE À LA MÊME PLACE ; RENDU UNIQUE quand
 * l'identifiant est pris par une note rangée AILLEURS.
 */
export function identifiantDuFichier(
	titre: string,
	segments: readonly string[],
	pris: ReadonlySet<string>,
	notesDeLaCible: ReadonlyMap<string, string>,
	rang: number
): string {
	const racine = identifiantLisible(titre) || `note-${rang}`;
	const place = notesDeLaCible.get(racine);
	if (place !== undefined && place === segments.join('/')) return racine;
	return identifiantLibre(titre, pris, rang);
}

/**
 * Les segments de dossier d'un chemin, plafonnés — `RG-M12-10` : « au-delà, les niveaux
 * excédentaires sont APLATIS et l'opération est signalée au rapport ». Le maximum est
 * `PROFONDEUR_MAX`. Aplatir, c'est rattacher au dernier dossier admis : la note n'est pas
 * perdue, elle est moins bien rangée.
 */
export function segmentsPlafonnes(
	chemin: string,
	profondeurDeDepart: number
): { readonly segments: readonly string[]; readonly aplatie: boolean } {
	const tous = chemin
		.split('/')
		.slice(0, -1)
		.map((s) => s.trim())
		.filter((s) => s !== '');
	const admis = Math.max(0, PROFONDEUR_MAX - profondeurDeDepart);
	return admis >= tous.length
		? { segments: tous, aplatie: false }
		: { segments: tous.slice(0, admis), aplatie: true };
}

/**
 * Le classement d'un lot — la totalité des décisions, aucune écriture : rien n'est écrit
 * tant que l'utilisateur n'a pas validé, et cette fonction est la raison pour laquelle
 * c'est vrai — elle n'a pas de base. `RG-M12-04` gouverne toute la boucle : aucune
 * branche n'en sort, aucune exception ne la traverse.
 */
export function classerLeLot(
	source: string,
	fichiers: readonly FichierDepose[],
	contexte: ContexteDeClassement
): PlanDImport {
	const pris = new Set(contexte.identifiantsPris);
	const dansLaCible = contexte.notesDeLaCible ?? new Map<string, string>();
	const lignes: LigneDePlan[] = [];
	const cheminsVus = new Set<string>();

	fichiers.forEach((fichier, rang) => {
		const format = formatDuChemin(fichier.chemin);
		const voie: VoieDeTraitement = format === null ? 'ecarte' : VOIE_PAR_FORMAT[format];
		const commun = {
			chemin: fichier.chemin,
			format,
			voie,
			identifiant: null,
			titre: null,
			corps: null,
			etiquettes: [] as readonly string[],
			fiche: null as string | null,
			proprietes: {} as Readonly<Record<string, string>>,
			segments: [] as readonly string[],
			aplatie: false,
			renvois: [] as readonly string[],
			avertissements: [] as readonly string[],
			images: [] as readonly ImageExtraite[]
		};

		const ecart = (motif: MotifDEcart): void => {
			lignes.push({ ...commun, sort: 'ignore', motif });
		};
		const echec = (motif: MotifDEchec): void => {
			lignes.push({ ...commun, sort: 'echec', motif });
		};

		/* Un même chemin deux fois dans un lot ne peut pas donner deux notes. C'est
		   le seul cas de doublon reconnaissable ici — l'identité de CONTENU en est
		   un autre, qui demande un condensat qu'aucune colonne ne porte. */
		if (cheminsVus.has(fichier.chemin)) {
			ecart('doublon-dans-le-lot');
			return;
		}
		cheminsVus.add(fichier.chemin);

		if (fichier.octets === 0) {
			ecart('fichier-vide');
			return;
		}
		if (format === null) {
			ecart('format-inconnu');
			return;
		}
		if (voie === 'ecarte') {
			ecart('format-non-converti');
			return;
		}
		/* LES DEUX VOIES CONVERGENT ICI (`ADR-004`) : un fichier bureautique devient le
		   texte Markdown que le service a rendu, et tout ce qui suit est le chemin du
		   `.md` — un seul convertisseur, appelé une seule fois. */
		let texte = fichier.texte;
		let avertissements: readonly string[] = [];
		let images: readonly ImageExtraite[] = [];

		if (voie === 'service') {
			const indisponible = motifDIndisponibilite(contexte.service, format);
			if (indisponible !== null) {
				/* `P-10` — la brique optionnelle est absente ou incomplète : le fichier est
				   consigné, le lot continue. */
				echec(indisponible);
				return;
			}
			const verdict = contexte.conversions.get(fichier.chemin);
			if (verdict === undefined) {
				echec('conversion-absente');
				return;
			}
			if (verdict.issue === 'echec') {
				echec(verdict.motif);
				return;
			}
			texte = verdict.markdown;
			avertissements = verdict.avertissements;
			images = verdict.images;
		}

		if (texte === null) {
			echec('contenu-illisible');
			return;
		}

		const entete = detacherLEnTete(texte);
		let corps: Document;
		try {
			corps = analyserMarkdown(entete.texte);
		} catch {
			/* RG-M12-04 : le lot continue. La cause technique ne remonte pas —
			   STACK §4.7, « aucune trace technique ne remonte à l'interface ». */
			echec('contenu-illisible');
			return;
		}

		/* Une ligne de propriétés qui ne s'est pas lue rejoint les avertissements de
		   la conversion : même rang, même destination. */
		const avertissementsDeLaNote = entete.proprietesIllisibles
			? [...avertissements, AVERTISSEMENT_PROPRIETES_ILLISIBLES]
			: avertissements;

		const titre = entete.titre ?? nomSansExtension(fichier.chemin);
		/* LA PLACE SE DÉCIDE AVANT L'IDENTIFIANT, parce qu'elle en décide : elle dit si
		   la note existante du même identifiant est celle-ci ou une homonyme. */
		const { segments, aplatie } = segmentsPlafonnes(fichier.chemin, contexte.profondeurDeDepart);
		const identifiant = identifiantDuFichier(titre, segments, pris, dansLaCible, rang + 1);
		pris.add(identifiant);

		lignes.push({
			...commun,
			sort: 'note',
			motif: null,
			identifiant,
			titre,
			corps,
			etiquettes: entete.etiquettes,
			/* Les propriétés ne voyagent qu'AVEC leur type : sans lui, elles ne
			   désignent aucun champ, et `notes_proprietes_exigent_un_type_de_fiche`
			   les refuserait de toute façon. */
			fiche: entete.fiche,
			proprietes: entete.fiche === null ? {} : entete.proprietes,
			segments,
			aplatie,
			renvois: entete.renvois,
			avertissements: avertissementsDeLaNote,
			images
		});
	});

	return {
		source,
		lignes,
		total: lignes.length,
		notes: lignes.filter((l) => l.sort === 'note').length,
		ignores: lignes.filter((l) => l.sort === 'ignore').length,
		echecs: lignes.filter((l) => l.sort === 'echec').length
	};
}

export interface LigneDeRapport {
	readonly chemin: string;
	readonly sort: SortDeFichier;
	readonly motif: MotifDEcart | MotifDEchec | null;
	readonly identifiant: string | null;
	/** La note existait déjà et a été mise à jour — `RG-M12-01`. */
	readonly miseAJour: boolean;
	/** Des niveaux ont été aplatis — `RG-M12-10`. */
	readonly aplatie: boolean;
	/** Les renvois qu'aucune note ne résout — `RG-M12-03`. */
	readonly renvoisNonResolus: readonly string[];
	/** `M12.1` — les avertissements de la conversion, en codes. */
	readonly avertissements: readonly string[];
	/**
	 * `RG-M12-07` — les images extraites QUE RIEN N'A ÉCRITES. Le nombre est au rapport
	 * parce qu'il n'est pas nul et qu'il ne doit pas en avoir l'air.
	 */
	readonly imagesNonReprises: number;
}

/**
 * L'entrée de journal d'un lot — `RG-M12-09` : source, volume, erreurs, auteur, date.
 * ELLE EST PRODUITE, ELLE N'EST PAS STOCKÉE — aucune table d'imports n'existe, et
 * `journalEnregistre` reste FAUX.
 */
export interface EntreeDeJournalDImport {
	readonly source: string;
	readonly simulation: boolean;
	readonly volume: {
		readonly total: number;
		readonly notesCreees: number;
		readonly notesMisesAJour: number;
		readonly ignores: number;
		readonly echecs: number;
		readonly dossiersCrees: number;
	};
	/** Les erreurs, chemin par chemin. `RG-M12-04` : consignées, jamais tues. */
	readonly erreurs: readonly { readonly chemin: string; readonly motif: string | null }[];
	readonly auteurId: string;
	readonly date: string;
}

/**
 * L'entrée de journal d'un lot, composée sur son rapport. ELLE N'EST PAS DANS LE
 * RAPPORT, et la raison est une propriété : `RG-M12-02` veut que le rapport de simulation
 * dise rigoureusement ce que fera l'import réel, et une DATE le ferait diverger à chaque
 * exécution. `auteur` est celui de la CIBLE, donc celui qui répond du lot.
 */
export function entreeDeJournal(
	cible: CibleDImport,
	rapport: RapportDImport,
	date: Date
): EntreeDeJournalDImport {
	return {
		source: rapport.source,
		simulation: rapport.simulation,
		volume: {
			total: rapport.total,
			notesCreees: rapport.notesCreees,
			notesMisesAJour: rapport.notesMisesAJour,
			ignores: rapport.ignores,
			echecs: rapport.echecs,
			dossiersCrees: rapport.dossiersCrees
		},
		erreurs: rapport.lignes
			.filter((l) => l.sort === 'echec')
			.map((l) => ({ chemin: l.chemin, motif: l.motif })),
		auteurId: cible.auteurId,
		date: date.toISOString()
	};
}

export interface RapportDImport {
	readonly source: string;
	readonly simulation: boolean;
	readonly total: number;
	readonly notesCreees: number;
	readonly notesMisesAJour: number;
	readonly ignores: number;
	readonly echecs: number;
	readonly dossiersCrees: number;
	readonly lignes: readonly LigneDeRapport[];
	/**
	 * `RG-M12-09`, seconde moitié — l'entrée est-elle STOCKÉE là où une console pourra
	 * la relire ? Non, et le rapport le dit plutôt que de le taire.
	 */
	readonly journalEnregistre: boolean;
	/**
	 * `RG-M12-08` — chaque note écrite par le lot a traversé l'entretien de
	 * l'index (`../recherche/entretien.ts`), qu'elle y ait été écrite ou retirée.
	 */
	readonly indexeALaRecherche: boolean;
}

export interface CibleDImport {
	readonly domaineId: string;
	readonly dossierId: string;
	readonly auteurId: string;
}

/**
 * L'annulation d'une simulation — une erreur, parce qu'une transaction ne
 * s'annule pas autrement, et une erreur PROPRE au module, parce qu'attraper
 * n'importe quoi effacerait un vrai défaut.
 */
class AnnulationDeSimulation extends Error {
	constructor() {
		super('simulation');
		this.name = 'AnnulationDeSimulation';
	}
}

async function dossierDuSegment(
	tx: Base,
	cible: CibleDImport,
	parentId: string,
	profondeur: number,
	nom: string
): Promise<{ readonly id: string; readonly cree: boolean }> {
	const deja = await tx
		.select({ id: dossiers.id })
		.from(dossiers)
		.where(
			and(
				eq(dossiers.domaineId, cible.domaineId),
				eq(dossiers.parentId, parentId),
				eq(dossiers.nom, nom)
			)
		)
		.limit(1);
	const trouve = deja[0];
	if (trouve !== undefined) return { id: trouve.id, cree: false };

	/* LA POSITION SE CALCULE, ELLE NE SE LAISSE PAS AU DÉFAUT DE LA COLONNE, qui
	   vaut zéro : sans ce compte, toute la fratrie créée par un import se
	   retrouvait à la même position, et l'ordre d'affichage devenait celui du
	   hasard. L'action `creerSousDossier` la calcule déjà de cette façon. */
	const freres = await tx
		.select({ id: dossiers.id })
		.from(dossiers)
		.where(and(eq(dossiers.domaineId, cible.domaineId), eq(dossiers.parentId, parentId)));

	const inseres = await tx
		.insert(dossiers)
		.values({ domaineId: cible.domaineId, parentId, nom, position: freres.length, profondeur })
		.returning({ id: dossiers.id });
	return { id: (inseres[0] as { id: string }).id, cree: true };
}

/** L'étiquette d'un libellé, créée si elle n'existe pas — `RG-M12-06`. */
async function etiquetteDuLibelle(tx: Base, libelle: string): Promise<string> {
	const deja = await tx
		.select({ id: etiquettes.id })
		.from(etiquettes)
		.where(eq(etiquettes.libelle, libelle))
		.limit(1);
	const trouve = deja[0];
	if (trouve !== undefined) return trouve.id;
	const inseres = await tx.insert(etiquettes).values({ libelle }).returning({ id: etiquettes.id });
	return (inseres[0] as { id: string }).id;
}

/**
 * Les identifiants lisibles déjà pris — `RG-M12-11`. Toute la colonne est lue, et non les
 * seuls identifiants du domaine visé : `notes_identifiant_unique` porte sur la table
 * entière, et un identifiant pris ailleurs ferait échouer l'insertion.
 */
export async function identifiantsPris(base: Base): Promise<ReadonlySet<string>> {
	const lignes = await base.select({ identifiant: notes.identifiant }).from(notes);
	return new Set(lignes.map((l) => l.identifiant));
}

/**
 * L'exécution d'un plan — la même en simulation et en réel (`RG-M12-02`) : « un seul
 * chemin de code, donc un rapport de simulation qui dit rigoureusement ce que fera
 * l'import réel ».
 *
 * La simulation n'est donc LUE QU'UNE FOIS, à la toute fin, quand tout a été écrit et
 * compté. Le rapport est constitué DANS la transaction et survit à son annulation parce
 * qu'il vit dans la portée d'au-dessus — c'est le seul artifice. `RG-M12-04` continue de
 * gouverner : une ligne que la base refuse devient un échec au rapport.
 */
export async function executerLImport(
	base: Base,
	client: Meilisearch,
	cible: CibleDImport,
	plan: PlanDImport,
	options: { readonly simulation: boolean; readonly profondeurDeDepart: number }
): Promise<RapportDImport> {
	const lignes: LigneDeRapport[] = [];
	let notesCreees = 0;
	let notesMisesAJour = 0;
	let dossiersCrees = 0;

	const appliquer = async (tx: Base): Promise<void> => {
		const typeNote = await tx
			.select({ id: typesDeNote.id })
			.from(typesDeNote)
			.where(eq(typesDeNote.identifiant, 'note'))
			.limit(1);
		const typeDeNoteId = (typeNote[0] as { id: string } | undefined)?.id;

		/* LE RÉFÉRENTIEL DES FICHES, LU UNE FOIS — deux requêtes pour tout le lot
		   plutôt que deux par note. Un nom de type inconnu ne fait pas échouer la
		   ligne : la note est écrite SIMPLE, mais le rapport le dit
		   (`AVERTISSEMENT_TYPE_DE_FICHE_INCONNU`) — l'écart sans trace était le
		   défaut. */
		const ficheParNom = new Map<string, { readonly id: string; readonly cles: Set<string> }>();
		for (const t of await tx
			.select({ id: typesDeFiche.id, nom: typesDeFiche.nom })
			.from(typesDeFiche)) {
			ficheParNom.set(t.nom, { id: t.id, cles: new Set<string>() });
		}
		const parId = new Map([...ficheParNom.values()].map((t) => [t.id, t.cles]));
		for (const c of await tx
			.select({ typeId: champsDeTypeDeFiche.typeDeFicheId, cle: champsDeTypeDeFiche.cle })
			.from(champsDeTypeDeFiche)) {
			parId.get(c.typeId)?.add(c.cle);
		}

		/* Les identifiants que le corpus porte déjà, pour dire quels renvois ne
		   résolvent rien (`RG-M12-03`). Un renvoi vers une note du lot lui-même se
		   résout par le second ensemble, celui des identifiants que le plan retient. */
		const enBase = await identifiantsPris(tx);
		const duLot = new Set(
			plan.lignes.map((l) => l.identifiant).filter((i): i is string => i !== null)
		);

		for (const ligne of plan.lignes) {
			const renvoisNonResolus = ligne.renvois.filter((r) => !enBase.has(r) && !duLot.has(r));

			if (ligne.sort !== 'note' || ligne.identifiant === null || ligne.corps === null) {
				lignes.push({
					chemin: ligne.chemin,
					sort: ligne.sort,
					motif: ligne.motif,
					identifiant: null,
					miseAJour: false,
					aplatie: ligne.aplatie,
					renvoisNonResolus,
					avertissements: ligne.avertissements,
					imagesNonReprises: ligne.images.length
				});
				continue;
			}

			if (typeDeNoteId === undefined) {
				/* Le type générique manque en base : aucune note ne peut être
				   écrite, et c'est un fait consigné, pas une exception jetée. */
				lignes.push({
					chemin: ligne.chemin,
					sort: 'echec',
					motif: 'contenu-illisible',
					identifiant: null,
					miseAJour: false,
					aplatie: ligne.aplatie,
					renvoisNonResolus,
					avertissements: ligne.avertissements,
					imagesNonReprises: ligne.images.length
				});
				continue;
			}

			let dossierId = cible.dossierId;
			let profondeur = options.profondeurDeDepart;
			for (const segment of ligne.segments) {
				profondeur += 1;
				const dossier = await dossierDuSegment(tx, cible, dossierId, profondeur, segment);
				dossierId = dossier.id;
				if (dossier.cree) dossiersCrees += 1;
			}

			/* `RG-M12-01` — une note du même identifiant est MISE À JOUR, jamais
			   dupliquée. Ce qui manque pour rendre la branche atteignable après un
			   renommage est le nom de la clé d'identifiant à l'en-tête (voir
			   `MANQUES_DE_L_IMPORT`). */
			const existante = await tx
				.select({ id: notes.id })
				.from(notes)
				.where(eq(notes.identifiant, ligne.identifiant))
				.limit(1);
			const trouvee = existante[0];
			const maintenant = new Date();

			/* LES DEUX COLONNES VOYAGENT ENSEMBLE
			   (`notes_proprietes_exigent_un_type_de_fiche`), et les clés sont filtrées
			   sur le référentiel réel : le `jsonb` n'est contraint par rien, et un
			   fichier déposé écrirait sinon ce qu'il veut. */
			const typeDeLaFiche = ligne.fiche === null ? undefined : ficheParNom.get(ligne.fiche);
			/* L'en-tête nommait un type que l'instance ne porte pas. La note est
			   écrite simple, et la ligne du rapport porte le pourquoi. */
			const avertissementsDeLaLigne =
				ligne.fiche !== null && typeDeLaFiche === undefined
					? [...ligne.avertissements, AVERTISSEMENT_TYPE_DE_FICHE_INCONNU]
					: ligne.avertissements;
			const retenues =
				typeDeLaFiche === undefined
					? {}
					: retenirLesProprietes(ligne.proprietes, [...typeDeLaFiche.cles]);
			/* ABSENT ⇒ NON ÉCRIT, et c'est le régime de tout ce fichier : un `.md`
			   sans en-tête de fiche ne DÉPOUILLE pas la note qu'il met à jour
			   (`RG-M12-01`), il ne dit simplement rien de son type. */
			const colonnesDeFiche =
				typeDeLaFiche === undefined
					? {}
					: {
							typeDeFicheId: typeDeLaFiche.id,
							proprietesTypees: Object.keys(retenues).length === 0 ? null : retenues
						};

			let noteId: string;
			if (trouvee === undefined) {
				const inseres = await tx
					.insert(notes)
					.values({
						identifiant: ligne.identifiant,
						titre: ligne.titre ?? ligne.identifiant,
						corpsReference: ligne.corps,
						typeDeNoteId,
						domaineId: cible.domaineId,
						dossierId,
						auteurId: cible.auteurId,
						...colonnesDeFiche
					})
					.returning({ id: notes.id });
				noteId = (inseres[0] as { id: string }).id;
				notesCreees += 1;
			} else {
				noteId = trouvee.id;
				await tx
					.update(notes)
					.set({
						titre: ligne.titre ?? ligne.identifiant,
						corpsReference: ligne.corps,
						dossierId,
						modifieLe: maintenant,
						corpsReferenceModifieLe: maintenant,
						...colonnesDeFiche
					})
					.where(eq(notes.id, noteId));
				await tx.delete(etiquettesDeNote).where(eq(etiquettesDeNote.noteId, noteId));
				notesMisesAJour += 1;
			}

			let ordre = 0;
			for (const libelle of ligne.etiquettes) {
				const etiquetteId = await etiquetteDuLibelle(tx, libelle);
				await tx.insert(etiquettesDeNote).values({ noteId, etiquetteId, ordre });
				ordre += 1;
			}

			lignes.push({
				chemin: ligne.chemin,
				sort: 'note',
				motif: null,
				identifiant: ligne.identifiant,
				miseAJour: trouvee !== undefined,
				aplatie: ligne.aplatie,
				renvoisNonResolus,
				avertissements: avertissementsDeLaLigne,
				imagesNonReprises: ligne.images.length
			});
		}
	};

	try {
		await base.transaction(async (tx) => {
			await appliquer(tx as unknown as Base);
			/* LA SEULE LECTURE DE `simulation` DU MODULE, et elle est la dernière
			   instruction de la transaction : tout ce qui précède a été fait pour de
			   bon, ce qui est la condition pour que le rapport dise vrai. */
			if (options.simulation) throw new AnnulationDeSimulation();
		});
	} catch (erreur) {
		if (!(erreur instanceof AnnulationDeSimulation)) throw erreur;
	}

	/* L'INDEX, APRÈS LA TRANSACTION — `RG-M12-08`, ET TOUJOURS UN SEUL CHEMIN DE
	   CODE. `simulation` n'est pas relue ici : `entretenirLIndex()` RELIT LA BASE
	   pour les identifiants qu'on lui nomme. En réel les notes y sont et sont
	   réécrites ; en simulation la transaction a été annulée, elles n'y sont pas,
	   et rien n'est écrit.

	   LES NOTES MISES À JOUR SONT DANS LA LISTE AU MÊME TITRE QUE LES CRÉÉES : la
	   mise à jour réécrit le titre, le corps, le DOSSIER — qui porte le périmètre —
	   et les étiquettes. Une note déplacée dont l'index garderait l'ancienne chaîne
	   d'ancêtres serait lisible sous son ancien périmètre (`ADR-006`). */
	const ecrites = lignes
		.filter((l) => l.sort === 'note' && l.identifiant !== null)
		.map((l) => l.identifiant as string);
	/* `ARB-060` : les documents sont SOUMIS au moteur, la tâche n'est pas attendue
	   — un lot d'import est aussi un chemin de requête. Le rapport compte ce qui a
	   été SOUMIS : `RG-M12-08` porte sur la trouvabilité, pas sur un instant. */
	const entretien = await entretenirLIndex(base, client, ecrites);

	const ignores = lignes.filter((l) => l.sort === 'ignore').length;
	const echecs = lignes.filter((l) => l.sort === 'echec').length;

	return {
		source: plan.source,
		simulation: options.simulation,
		total: plan.total,
		notesCreees,
		notesMisesAJour,
		ignores,
		echecs,
		dossiersCrees,
		lignes,
		/* Aucune table d'imports n'existe. Le rapport le déclare plutôt que de le
		   taire. */
		journalEnregistre: false,
		/* `RG-M12-08` — ET C'EST UNE MESURE, PAS UNE DÉCLARATION. Une note qui existe
		   en base est INDEXÉE, une note qui n'y est pas (simulation annulée) en est
		   RETIRÉE : la somme des deux vaut le nombre de notes écrites, et un
		   identifiant qui aurait échappé au geste ferait tomber l'égalité. */
		indexeALaRecherche: entretien.indexees + entretien.retirees === ecrites.length
	};
}

export interface ManqueDeLImport {
	readonly exigence: string;
	readonly ceQuiManque: string;
	readonly motif: string;
}

/**
 * Le recensement des manques — compté, jamais comblé : il vit à côté du code qui
 * en souffre, et il ne se périme pas en silence.
 */
export const MANQUES_DE_L_IMPORT: readonly ManqueDeLImport[] = [
	{
		exigence: 'RG-M12-01',
		ceQuiManque: 'l’identité d’une note à travers un RENOMMAGE ou un DÉPLACEMENT de son fichier',
		motif:
			'l’idempotence est TENUE tant que le fichier garde son nom et sa place : ' +
			'`identifiantDuFichier()` reprend l’identifiant d’une note déjà rangée là où le fichier ' +
			'se range, et l’écriture est alors une mise à jour — même adresse, mêmes liens, aucun ' +
			'doublon. Ce qui manque est le cas où le fichier change de nom ou de dossier entre deux ' +
			'imports : la note perd alors sa place, et rien ne dit qu’il s’agit de la même. Seul un ' +
			'identifiant DÉCLARÉ à l’en-tête le dirait, et aucune source du dépôt n’en nomme la ' +
			'clé — UC-M12-03 dit la convention « documentée » sans l’être nulle part.'
	},
	{
		exigence: 'RG-M12-07',
		ceQuiManque: 'la reprise des images en chemin relatif',
		motif:
			'le service de conversion les EXTRAIT désormais, et le rapport les compte ligne par ' +
			'ligne — mais aucun stockage de pièce jointe n’existe : la table des pièces jointes ' +
			'porte des métadonnées, et rien n’écrit ni ne sert le fichier lui-même. Les images ' +
			'arrivent donc jusqu’à l’application et s’arrêtent là, ce que `imagesNonReprises` dit ' +
			'plutôt que de le taire.'
	},
	{
		exigence: 'RG-M12-09',
		ceQuiManque: 'le STOCKAGE de l’entrée de journal, et donc sa relecture par la console',
		motif:
			'l’entrée est PRODUITE — `RapportDImport.journalDuLot` porte ses cinq membres, source, ' +
			'volume, erreurs, auteur et date, tous mesurés sur ce que le lot a fait —, et la route ' +
			'd’import l’écrit au journal d’application. Ce qui manque est une TABLE : les ' +
			'vingt-deux tables du schéma n’en portent pas, `journalEnregistre` reste donc faux, et ' +
			'V-35 ne peut pas relire ce qu’aucune colonne ne garde. Créer une migration serait ' +
			'sortir du territoire du lot.'
	},
	{
		exigence: 'UC-M12-02, UC-M12-03',
		ceQuiManque: 'les scénarios « domaine complet » et « corpus préparé »',
		motif:
			'le premier crée un domaine, le second lit sept clés de métadonnées dont aucune source ' +
			'du dépôt ne donne le nom. Seul UC-M12-01 — des notes dans un domaine existant — est livré.'
	},
	{
		exigence: 'RG-M12-03',
		ceQuiManque: 'la résolution des renvois et le mode strict',
		motif:
			'les renvois déclarés sont relevés et ceux qu’aucune note ne résout sont consignés au ' +
			'rapport, ce que la règle demande. La création des relations correspondantes exige un ' +
			'type de relation que la clé de renvoi ne nomme pas. Le mode strict n’a aucun ' +
			'déclencheur : aucune maquette ne l’offre.'
	},
	{
		exigence: 'P-10, RG-NF-01',
		ceQuiManque: 'le message clair de dégradation, à l’écran',
		motif:
			'l’indisponibilité de la voie bureautique est décidée, motivée et consignée ici, avec ' +
			'ses causes distinguées. V-24 n’a aucune propriété pour la recevoir : sa liste des ' +
			'formats admis est transcrite du gel, et son rapport n’est dans aucun de ses sept états.'
	},
	{
		exigence: 'M12.1',
		ceQuiManque: 'la nature « bloc de code » d’un bloc importé d’un .docx',
		motif:
			'Pandoc écrit tout bloc de code sans langage en bloc INDENTÉ, dans tous ses dialectes ' +
			'Markdown et sans option pour l’en empêcher — mesuré sur `gfm` et sur `commonmark` ; ' +
			'or l’implémentation unique ne lit comme bloc de code que les blocs clôturés. Le texte ' +
			'survit en paragraphes, sa nature de bloc non. M12.1 exige du .docx « titres, listes, ' +
			'tableaux, mise en forme préservés » et ne nomme pas les blocs de code.'
	}
];
