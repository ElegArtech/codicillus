/**
 * L'IMPORT — le catalogue des formats, le classement d'un lot, son exécution.
 *
 * `docs/routes.md:157` : `/importer` rend **V-24**, niveau « connecté +
 * rédacteur ». La GARDE de l'adresse est dans `src/routes/importer/+page.server.ts` ;
 * ce module porte ce qu'elle protège.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL CONVERTISSEUR, ET IL N'EST PAS ÉCRIT ICI — ADR-004
 *
 * `analyserMarkdown` de `src/lib/contenu/markdown.ts` est l'implémentation
 * unique, livrée par `T-015`. Ce module l'APPELLE et ne convertit rien
 * lui-même : `ADR-004` interdit nommément « les convertisseurs qualifiés de
 * temporaires, provisoires ou pour l'import seulement », et
 * `pnpm verif:convertisseur` compte les implémentations.
 *
 * L'en-tête de métadonnées est DÉTACHÉ, pas converti : c'est une enveloppe
 * autour du texte, elle ne décrit aucun nœud du format canonique, et le texte
 * qu'elle enveloppe part entier vers l'implémentation unique.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX VOIES, ET ELLES CONVERGENT — STACK §4.6, ADR-004
 *
 * La pile technique partage les formats en deux, et le partage est formel :
 *
 *   · `.md` et `.txt` — « Ne sort pas de l'application : c'est le chemin qui
 *     garantit l'idempotence et la résolution des références (RG-M12-01) ».
 *   · `.docx`, `.pptx`, `.pdf` — un service Python séparé, qui « retourne du
 *     Markdown et des images extraites » (`services/conversion/`, lots `T-003`
 *     puis `T-052`).
 *
 * LE POINT DE CONVERGENCE EST À UNE SEULE LIGNE DE `classerLeLot`, et c'est
 * l'exigence d'`ADR-004` : « l'import bureautique et l'import Markdown
 * convergent vers le même code après la sortie du service de conversion ». Un
 * document bureautique devient un TEXTE MARKDOWN, puis suit exactement le
 * chemin d'un `.md` — même détachement d'en-tête, même unique appel à
 * `analyserMarkdown`, même écriture. Il n'existe pas de seconde branche à
 * maintenir, donc pas de seconde branche pour diverger.
 *
 * L'INDISPONIBILITÉ RESTE UN ÉTAT, JAMAIS UNE PANNE. C'est `P-10` — « une
 * brique optionnelle indisponible dégrade la fonctionnalité concernée avec un
 * message clair, sans jamais empêcher l'usage du reste » — et `RG-NF-01`. Le lot
 * va jusqu'au bout, chaque fichier bureautique en échec est consigné avec le
 * motif de son échec, et l'import Markdown du même lot n'en souffre pas.
 *
 * DEUX CAUSES D'INDISPONIBILITÉ SONT DISTINGUÉES, et aucune n'est devinée : le
 * service est injoignable, ou il répond en déclarant un outil absent — son
 * contrôle de santé rend les trois versions d'outils, et l'application les lit.
 * S'y ajoutent les motifs propres à un FICHIER, qui ne sont pas des
 * indisponibilités : endommagé, protégé par un mot de passe, ou trop long à
 * convertir.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE MODE SIMULATION EST LE MÊME CODE — RG-M12-02, ADR-004
 *
 * « La même tâche exécutée dans une transaction annulée à la fin : un seul
 * chemin de code, donc un rapport de simulation qui dit rigoureusement ce que
 * fera l'import réel. » Il n'existe ici qu'une fonction d'exécution, et la
 * simulation n'y est PAS un paramètre de branchement : elle décide uniquement
 * du sort de la transaction, après que tout a été fait et compté. Un `if`
 * supplémentaire quelque part, et la propriété tombe.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE TIENT PAS, ET IL FAUT LE DIRE
 *
 * `RG-M12-01` (idempotence), `UC-M12-02` (importer un domaine complet) et
 * `UC-M12-03` (corpus préparé) reposent tous trois sur un en-tête de
 * métadonnées « selon une convention DOCUMENTÉE ». Cette convention n'existe
 * nulle part au dépôt : le seul endroit qui nomme des clés est l'illustration
 * du troisième scénario de V-24, qui en montre trois — le titre, les étiquettes
 * et une clé de renvoi. Elles sont lues, et rien d'autre : deviner le nom de la
 * clé d'identifiant serait un comblement, et sans elle une note importée ne
 * peut pas retrouver la note qu'elle met à jour.
 *
 * `MANQUES_DE_L_IMPORT` recense ce qui manque, avec sa cause. Rien n'est
 * simulé, rien n'est comblé, tout est compté.
 */
import { and, eq } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { dossiers, etiquettes, etiquettesDeNote, notes, typesDeNote } from '../base/schema';
import type { Document } from '../contenu/document';
import { analyserMarkdown } from '../contenu/markdown';
import { identifiantLisible } from '../rangement/adresses';
import { PROFONDEUR_MAX } from './rangement';
import { FORMATS_IMPORT, type FormatDImport, type SortDeFichier } from '../../../seeds/corpus';

/* ═══════════════════════════════════════════ Le catalogue des formats ══ */

/**
 * La voie qu'un format emprunte. Trois valeurs, et la table de STACK §4.6 les
 * décide toutes — aucune n'est choisie ici.
 *
 *   `application` — traité dans l'application, sans sortir (`.md`, `.txt`).
 *   `service`     — passe par le service de conversion (`.docx`, `.pptx`, `.pdf`).
 *   `ecarte`      — n'a jamais vocation à devenir une note.
 */
export type VoieDeTraitement = 'application' | 'service' | 'ecarte';

/**
 * LA VOIE DE CHAQUE FORMAT — transcription de la table de STACK §4.6, ligne à
 * ligne, et de rien d'autre.
 *
 * Les trois formats écartés ne sont pas un choix de ce module : `xlsx`, `png`
 * et `zip` figurent au lot d'exemple du gel de V-24 avec, chacun, le motif de
 * son écart. Le format `doc` y figure aussi : la table de STACK §4.6 ne le
 * porte pas, et Pandoc n'y est mandaté que pour `.docx`.
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
 * L'OUTIL QUE CHAQUE FORMAT DE LA VOIE « SERVICE » EXIGE — STACK §4.6, colonne
 * « Outil ». Les noms sont ceux que le service rend dans son état de santé
 * (`services/conversion/service.py`, clé `outils`), non des noms réinventés.
 */
const OUTIL_PAR_FORMAT: Readonly<Partial<Record<FormatDImport, string>>> = {
	docx: 'pandoc',
	pptx: 'python-pptx',
	pdf: 'pdfplumber'
};

/**
 * L'OUTIL QUI ÉCRIT LE MARKDOWN, POUR LES TROIS FORMATS. Le service confie la
 * lecture à l'outil de la colonne de STACK §4.6 et l'écriture à Pandoc seul —
 * son en-tête dit pourquoi, et le lot T-052 le déclare. Un conteneur privé de
 * Pandoc ne convertit donc rien du tout.
 */
const OUTIL_ECRIVAIN = 'pandoc';

/**
 * Le format d'un chemin, d'après son extension, ou `null` si le dépôt n'en
 * connaît aucun de ce nom. La comparaison est faite en minuscules : un fichier
 * nommé en capitales est le même fichier.
 */
export function formatDuChemin(chemin: string): FormatDImport | null {
	const dernier = chemin.slice(chemin.lastIndexOf('.') + 1).toLowerCase();
	return dernier in VOIE_PAR_FORMAT ? (dernier as FormatDImport) : null;
}

/**
 * LES LIBELLÉS DES FORMATS, tels que la vue les affiche au récapitulatif.
 *
 * La table est celle du jeu de semence, qui transcrit celle du gel de V-24, et
 * elle est rendue ENTIÈRE. En retirer les formats indisponibles ne dirait pas
 * l'indisponibilité : le rendu retombe alors sur l'extension nue, ce qui
 * dégraderait un libellé sans porter le moindre message. `P-10` demande un
 * message CLAIR, et V-24 n'a aucune prise pour le porter — écart déclaré au
 * rapport du lot, non comblé ici.
 */
export function libellesDeFormat(): Partial<Record<FormatDImport, string>> {
	return FORMATS_IMPORT;
}

/* ═══════════════════════════════════ Le service de conversion — P-10 ═══ */

/**
 * LE POINT D'ENTRÉE DE CONVERSION, ET CE QU'IL RAPPORTE.
 *
 * `T-052` a livré le service (`services/conversion/`). Le contrat de l'appel
 * est écrit une seule fois, ici et là-bas : un fichier envoyé en corps brut, son
 * nom en paramètre, et une réponse qui porte toujours `issue`.
 *
 * `T-040` portait à cet endroit une constante `CONVERSION_LIVREE` valant faux,
 * dont son commentaire disait : « le jour où le lot livre le point d'entrée,
 * elle disparaît avec la branche qu'elle gouverne ». C'est ce qui est arrivé —
 * la constante et le motif `conversion-non-livree` sont retirés, et non
 * conservés à faux « au cas où » : un interrupteur qui survit à sa cause devient
 * une branche que rien n'exerce (`P-5`).
 */
const CHEMIN_DE_CONVERSION = '/convertir';

/** L'état du service de conversion, tel que son contrôle de santé le rend. */
export interface EtatDuServiceDeConversion {
	/** Le service a répondu. */
	readonly joignable: boolean;
	/** La version de chaque outil, ou `null` s'il est absent du conteneur. */
	readonly outils: Readonly<Record<string, string | null>>;
	/** Le service déclare ses trois outils présents. */
	readonly complet: boolean;
}

/** Un service qu'on n'a pas pu joindre — aucun outil, rien de deviné. */
export const SERVICE_INJOIGNABLE: EtatDuServiceDeConversion = Object.freeze({
	joignable: false,
	outils: Object.freeze({}),
	complet: false
});

/**
 * L'état de santé du service, demandé une seule fois par lot.
 *
 * `recuperer` est un PARAMÈTRE, et ce n'est pas un ornement : sans lui, ce
 * contrôle n'aurait pour cas d'épreuve que l'état du dépôt du jour — celui-là
 * même que la livraison de `T-042` effacera. `P-26` : « tout contrôle doit
 * avoir un cas d'épreuve synthétique, indépendant de l'état du dépôt ».
 *
 * AUCUNE PANNE NE REMONTE. Une brique optionnelle injoignable n'est pas une
 * erreur du produit (`P-10`, `RG-NF-01`) : c'est un état, et il est rendu comme
 * tel.
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
 * Le motif pour lequel la voie « service » ne peut pas traiter ce format, ou
 * `null` quand elle le peut.
 *
 * L'ordre des deux causes est celui de leur proximité : on ne reproche pas à un
 * service arrêté de manquer d'outils.
 *
 * L'OUTIL EXIGÉ N'EST PAS SEULEMENT CELUI DE LA COLONNE DE STACK §4.6. Pandoc
 * est le seul écrivain de Markdown du service — `services/conversion/convertisseurs.py`
 * dit pourquoi, et le lot T-052 le déclare —, de sorte qu'un conteneur privé de
 * Pandoc ne convertit AUCUN des trois formats, pas seulement le `.docx`. Le
 * réclamer partout est ce qui rend l'indisponibilité vraie au lieu d'optimiste :
 * la promettre pour l'annoncer au fichier suivant serait pire que de la dire
 * tout de suite (`P-10` veut un message clair, pas un espoir).
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

/* ══════════════════════════════════ L'appel de conversion — ADR-004 ════ */

/** Une image que le service a extraite du fichier, encodée pour le transport. */
export interface ImageExtraite {
	/** Le chemin relatif sous lequel le Markdown rendu la référence. */
	readonly nom: string;
	readonly typeMime: string;
	readonly octets: number;
	readonly contenuBase64: string;
}

/**
 * CE QUE LE SERVICE REND D'UN FICHIER — DU MARKDOWN, JAMAIS UN DOCUMENT.
 *
 * `ADR-004` : le service « s'arrête à la production de Markdown », et
 * l'application applique ensuite son convertisseur unique. Le type le dit :
 * `markdown` est une CHAÎNE, et rien dans ce module ne la transforme autrement
 * qu'en la passant à `analyserMarkdown`.
 */
export type ResultatDeConversion =
	| {
			readonly issue: 'converti';
			readonly markdown: string;
			readonly images: readonly ImageExtraite[];
			/** Des codes, dont celui du PDF sans texte extractible (M12.1). */
			readonly avertissements: readonly string[];
	  }
	| { readonly issue: 'echec'; readonly motif: MotifDEchec };

/**
 * LES MOTIFS QUE LE SERVICE REND, TRADUITS EN MOTIFS DU PRODUIT.
 *
 * La table est FERMÉE des deux côtés, et c'est ce qui la rend utile : un motif
 * que le service inventerait — ou qu'une version ultérieure ajouterait sans que
 * l'application le sache — ne devient pas un code inconnu qui traverserait le
 * rapport jusqu'à l'écran. Il devient `contenu-illisible`, le motif générique,
 * et le fichier est consigné.
 *
 * Les deux premiers sont les cas d'échec que le lot d'exemple du gel de V-24
 * porte (`seeds/corpus.ts`, `LOT_IMPORT`), et ils justifient d'être distingués :
 * un fichier protégé se rouvre avec son mot de passe, un fichier endommagé ne se
 * rouvre pas.
 */
const MOTIF_DU_SERVICE: Readonly<Record<string, MotifDEchec>> = {
	'fichier-endommage': 'fichier-endommage',
	'fichier-protege': 'fichier-protege',
	'delai-depasse': 'delai-de-conversion-depasse',
	'fichier-vide': 'contenu-illisible',
	'format-non-pris-en-charge': 'contenu-illisible',
	'outil-absent': 'outil-de-conversion-absent'
};

/** L'adresse du point d'entrée, la barre oblique finale absorbée. */
function adresseDeConversion(adresse: string, nom: string): string {
	return `${adresse.replace(/\/+$/, '')}${CHEMIN_DE_CONVERSION}?nom=${encodeURIComponent(nom)}`;
}

/**
 * UN FICHIER ENVOYÉ AU SERVICE, ET SON VERDICT — jamais une exception.
 *
 * `RG-M12-04` gouverne cette fonction de bout en bout : « un fichier en erreur
 * n'interrompt jamais le lot ». Elle ne lève donc RIEN. Un service qui ne répond
 * pas, une réponse tronquée, un corps qui n'est pas du JSON, un JSON qui ne
 * porte pas ce qu'on attend : chacun est un motif, consigné, et le lot continue.
 *
 * LE NOM ENVOYÉ EST LE NOM DU FICHIER, PAS SON CHEMIN. Le service n'a besoin
 * que de l'extension, et un chemin de partage réseau dans une adresse serait à
 * la fois inutile et bavard.
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
		/* L'appelant n'a pas lu les octets. Ce n'est pas le service qui manque,
		   c'est le fichier qui n'est pas là : le dire autrement accuserait à
		   tort une brique optionnelle. */
		return { issue: 'echec', motif: 'contenu-illisible' };
	}
	const nom = fichier.chemin.slice(fichier.chemin.lastIndexOf('/') + 1);
	let reponse: Response;
	try {
		reponse = await recuperer(adresseDeConversion(adresse, nom), {
			method: 'POST',
			headers: { 'content-type': 'application/octet-stream' },
			/* Le corps EST le fichier, octet pour octet. La conversion de type est
			   celle du tableau d'octets vers un corps de requête : la plateforme
			   l'accepte, la déclaration de `fetch` la nomme par une union dont
			   `Uint8Array` fait partie sous un autre alias de tampon. */
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

/** Le verdict lu d'un corps de réponse INCONNU — aucune forme n'est supposée. */
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

/** Les images d'une réponse, celles qui portent tout ce qu'il faut. */
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
 * LE LOT ENVOYÉ AU SERVICE, FICHIER PAR FICHIER — `STACK` §4.6.
 *
 * L'appel est séquentiel, et c'est la conséquence directe de ce qu'il traverse :
 * « ces convertisseurs sont lents, consomment de la mémoire de façon
 * irrégulière ». Un lot de plusieurs centaines de fichiers lancé de front sur un
 * service qui borne chaque conversion par un sous-processus ferait de la mémoire
 * du conteneur le facteur limitant, et les délais commenceraient à courir avant
 * que le premier fichier ne soit lu.
 *
 * NE SONT ENVOYÉS QUE LES FICHIERS DE LA VOIE « SERVICE », et seulement quand
 * elle est disponible : un `.md` ne sort jamais de l'application (`ADR-004`), et
 * un service arrêté n'a rien à recevoir.
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

/* ═══════════════════════════════════════════════════ Les motifs ════════ */

/**
 * POURQUOI UN FICHIER N'EST PAS DEVENU UNE NOTE — DES CODES, PAS DES PHRASES.
 *
 * `RG-M12-04` veut « la raison en langage clair » au rapport, et STACK §4.7 en
 * désigne la source : « un catalogue de messages en français ». Ce catalogue
 * n'existe pas au dépôt. Écrire ici les phrases françaises serait décider d'un
 * texte d'interface en exécution — un défaut de contrat, pas une initiative.
 *
 * Les motifs sont donc des codes stables, que la vue mettra en français quand
 * elle en aura la prise. Le gel de V-24 en porte d'ailleurs les formulations,
 * dans le lot d'exemple du jeu de semence : elles seront reprises là-bas.
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
	 * AUCUN VERDICT POUR CE FICHIER. Le classement a reçu un lot dont un fichier
	 * de la voie « service » n'a pas été soumis à la conversion. Le motif existe
	 * parce que `RG-M12-04` interdit de lever : un défaut d'enchaînement devient
	 * une ligne du rapport, pas un lot perdu.
	 */
	| 'conversion-absente'
	| 'contenu-illisible';

/* ═══════════════════════════════════════════ L'en-tête de métadonnées ══ */

/**
 * LES TROIS SEULES CLÉS LUES, ET LA SOURCE DE CHACUNE.
 *
 * L'illustration du troisième scénario de V-24 les nomme au caractère près
 * (`seeds/corpus.ts`, segments du scénario « corpus préparé », transcrits en
 * `src/vues/V-24.svelte`) : un titre, une liste d'étiquettes, une liste de
 * renvois. `UC-M12-03` en énumère sept autres — identifiant, type, dossier,
 * domaine, visibilité, statut, propriétés typées — dont AUCUNE source du dépôt
 * ne donne le nom de clé. Elles ne sont pas lues.
 */
const CLE_TITRE = 'titre';
const CLE_ETIQUETTES = 'etiquettes';
const CLE_RENVOIS = 'voir';

/** Ce qu'un en-tête de métadonnées apporte, et le texte qui restait dessous. */
export interface EnTeteDetache {
	readonly titre: string | null;
	readonly etiquettes: readonly string[];
	/** Les identifiants de notes que le fichier dit voir — `RG-M12-03`. */
	readonly renvois: readonly string[];
	/** Le texte, en-tête retiré. C'est LUI qui part au convertisseur unique. */
	readonly texte: string;
}

/** La ligne de délimitation d'un en-tête : trois tirets seuls sur leur ligne. */
const DELIMITEUR = /^-{3,}\s*$/;

/** Une liste entre crochets, ou une valeur seule. */
function valeursDe(brut: string): string[] {
	const nu = brut.trim();
	const interieur = nu.startsWith('[') && nu.endsWith(']') ? nu.slice(1, -1) : nu;
	return interieur
		.split(',')
		.map((v) => v.trim().replace(/^["']|["']$/g, ''))
		.filter((v) => v !== '');
}

/**
 * L'EN-TÊTE DÉTACHÉ DU TEXTE — une enveloppe retirée, jamais une conversion.
 *
 * Ce n'est pas un second convertisseur au sens d'`ADR-004` : rien ici ne nomme
 * un nœud du format canonique, rien n'écrit une construction de contenu, et le
 * texte ressort ENTIER pour l'implémentation unique. La fonction ne fait que
 * décider où commence le corps.
 *
 * Un en-tête ouvert et jamais refermé n'en est pas un : le fichier est alors
 * rendu tel quel, et le convertisseur unique en fera ce qu'il en fait.
 */
export function detacherLEnTete(texte: string): EnTeteDetache {
	const lignes = texte.split('\n');
	const intact: EnTeteDetache = { titre: null, etiquettes: [], renvois: [], texte };
	if (!DELIMITEUR.test(lignes[0] ?? '')) return intact;

	const fin = lignes.findIndex((l, i) => i > 0 && DELIMITEUR.test(l));
	if (fin === -1) return intact;

	let titre: string | null = null;
	let etiquettesLues: readonly string[] = [];
	let renvois: readonly string[] = [];

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
		}
	}

	return { titre, etiquettes: etiquettesLues, renvois, texte: lignes.slice(fin + 1).join('\n') };
}

/* ═══════════════════════════════════════════════ Le plan d'un lot ══════ */

/** Un fichier tel que le dépôt le remet — son chemin, sa taille, son texte. */
export interface FichierDepose {
	/** Chemin relatif dans la source, séparé par des barres obliques. */
	readonly chemin: string;
	/** Taille en octets, telle que le dépôt la connaît. */
	readonly octets: number;
	/**
	 * Le contenu décodé, pour la seule voie « application ». `null` pour tout
	 * fichier que l'application ne lit pas elle-même — et c'est un fait, non une
	 * commodité : elle n'ouvre ni un document bureautique, ni une archive.
	 */
	readonly texte: string | null;
	/**
	 * LES OCTETS BRUTS, POUR LA SEULE VOIE « SERVICE ». `null` partout ailleurs.
	 *
	 * Un document bureautique n'est pas du texte : il part au service tel quel, et
	 * l'application ne l'ouvre à aucun moment — c'est le sens même de l'isolement
	 * (`STACK` §4.6). Le champ est distinct de `texte` pour que le type interdise
	 * de confondre les deux voies : un `.md` n'a pas d'octets à envoyer, un
	 * `.docx` n'a pas de texte à lire.
	 */
	readonly binaire: Uint8Array | null;
}

/** Ce qu'un fichier du lot deviendra, décidé sans rien écrire. */
export interface LigneDePlan {
	readonly chemin: string;
	readonly format: FormatDImport | null;
	readonly voie: VoieDeTraitement;
	readonly sort: SortDeFichier;
	readonly motif: MotifDEcart | MotifDEchec | null;
	/** L'identifiant lisible retenu, unique dans le lot et hors du lot. */
	readonly identifiant: string | null;
	/** `RG-M12-05` — le titre vient de l'en-tête, sinon du nom du fichier. */
	readonly titre: string | null;
	/** Le corps canonique, produit par l'implémentation unique. */
	readonly corps: Document | null;
	/** `RG-M12-06` — les étiquettes déclarées à l'en-tête. */
	readonly etiquettes: readonly string[];
	/** Les dossiers à créer, du plus haut au plus bas, déjà plafonnés. */
	readonly segments: readonly string[];
	/** `RG-M12-10` — des niveaux ont été aplatis pour tenir sous le plafond. */
	readonly aplatie: boolean;
	/** `RG-M12-03` — les renvois déclarés, dont la résolution reste à faire. */
	readonly renvois: readonly string[];
	/**
	 * `M12.1` — les avertissements que la conversion a levés, en codes. Le seul
	 * qu'une source du dépôt nomme est celui du PDF sans texte extractible, dont
	 * la phrase française est déjà DANS le corps : le code permet de le compter
	 * au rapport sans relire le contenu.
	 */
	readonly avertissements: readonly string[];
	/**
	 * `RG-M12-07` — les images que le service a extraites. Elles sont portées
	 * jusqu'ici et PAS ÉCRITES : aucun stockage de pièce jointe n'existe (voir
	 * `MANQUES_DE_L_IMPORT`). Les taire aurait fait croire qu'il n'y en avait pas.
	 */
	readonly images: readonly ImageExtraite[];
}

/** Ce qu'un lot deviendra, en entier, sans qu'une ligne ait été écrite. */
export interface PlanDImport {
	readonly source: string;
	readonly lignes: readonly LigneDePlan[];
	readonly total: number;
	readonly notes: number;
	readonly ignores: number;
	readonly echecs: number;
}

/** Ce que le classement a besoin de savoir du monde extérieur. */
export interface ContexteDeClassement {
	/** L'état du service de conversion, sondé une fois pour le lot. */
	readonly service: EtatDuServiceDeConversion;
	/**
	 * Les identifiants lisibles déjà pris en base. `RG-M12-11` : « rendus
	 * uniques automatiquement en cas de collision, SANS ÉCRASER de note
	 * existante » — c'est cet ensemble qui garantit la seconde moitié.
	 */
	readonly identifiantsPris: ReadonlySet<string>;
	/**
	 * La profondeur du dossier qui reçoit le lot, celle d'où partent les
	 * dossiers créés. La racine d'un domaine vaut 1 (`src/lib/base/schema.ts`,
	 * contrainte `dossiers_racine_sans_parent`).
	 */
	readonly profondeurDeDepart: number;
	/**
	 * LE VERDICT DU SERVICE POUR CHAQUE FICHIER DE LA VOIE « SERVICE », par
	 * chemin. Il est établi AVANT le classement, par `convertirLeLot`, parce que
	 * le classement est synchrone et n'a pas de réseau — c'est ce qui permet à
	 * l'étape 3 de `UC-M12-04` d'être une décision pure, et à la simulation de
	 * n'avoir rigoureusement rien de plus à faire que l'import réel.
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
 * Un identifiant lisible libre — `RG-M12-11`.
 *
 * La forme lisible vient de `identifiantLisible()`, l'implémentation unique du
 * dépôt : aucune translittération n'est réécrite ici. Seule la levée de
 * collision appartient à l'import, et elle suffixe un rang plutôt que d'écraser
 * quoi que ce soit. Un nom qui ne laisse aucun caractère retenu — un fichier
 * nommé de seuls signes — retombe sur un identifiant de rang, faute de quoi il
 * n'aurait pas d'adresse.
 */
export function identifiantLibre(nom: string, pris: ReadonlySet<string>, rang: number): string {
	const racine = identifiantLisible(nom) || `note-${rang}`;
	if (!pris.has(racine)) return racine;
	let suffixe = 2;
	while (pris.has(`${racine}-${suffixe}`)) suffixe += 1;
	return `${racine}-${suffixe}`;
}

/**
 * LES SEGMENTS DE DOSSIER D'UN CHEMIN, PLAFONNÉS — `RG-M12-10`.
 *
 * « La profondeur d'arborescence importée est plafonnée au maximum autorisé.
 * Au-delà, les niveaux excédentaires sont APLATIS et l'opération est signalée
 * au rapport. » Le maximum est celui du produit, `PROFONDEUR_MAX` — dix niveaux
 * (`CLAUDE.md` §3, et la contrainte `dossiers_profondeur_plafonnee` du schéma,
 * qui refuserait l'insertion) —, jamais un nombre écrit ici.
 *
 * Aplatir, c'est rattacher au dernier dossier admis : les segments excédentaires
 * sont abandonnés, la note reste. Elle n'est pas perdue, elle est moins bien
 * rangée — ce que la règle demande.
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
 * LE CLASSEMENT D'UN LOT — la totalité des décisions, aucune écriture.
 *
 * C'est l'étape 3 de `UC-M12-04` : « le produit affiche l'arborescence
 * détectée, le nombre de fichiers par format, les fichiers qui seront ignorés,
 * et le domaine ou les dossiers qui seront créés. L'utilisateur valide ou
 * renonce. » Rien n'est écrit tant qu'il n'a pas validé, et cette fonction est
 * la raison pour laquelle c'est vrai : elle n'a pas de base.
 *
 * `RG-M12-04` GOUVERNE TOUTE LA BOUCLE — « un fichier en erreur n'interrompt
 * jamais le lot ». Aucune branche ne sort de la boucle, aucune exception ne la
 * traverse : le convertisseur unique est appelé sous garde, et un texte qu'il
 * refuse devient une ligne en échec, pas un lot perdu.
 */
export function classerLeLot(
	source: string,
	fichiers: readonly FichierDepose[],
	contexte: ContexteDeClassement
): PlanDImport {
	const pris = new Set(contexte.identifiantsPris);
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

		/* Un même chemin deux fois dans un lot ne peut pas donner deux notes : le
		   second est un doublon, et c'est le seul cas de doublon que ce module
		   sache reconnaître — l'identité de CONTENU en est un autre, que le gel
		   montre, et qui demande un condensat qu'aucune colonne ne porte. */
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
		/* LES DEUX VOIES CONVERGENT ICI, ET C'EST L'EXIGENCE D'ADR-004 : « l'import
		   bureautique et l'import Markdown convergent vers le même code après la
		   sortie du service de conversion ». Un fichier bureautique devient un
		   texte Markdown — celui que le service a rendu —, et tout ce qui suit est
		   rigoureusement le chemin du `.md` : un seul convertisseur, appelé une
		   seule fois, au même endroit. */
		let texte = fichier.texte;
		let avertissements: readonly string[] = [];
		let images: readonly ImageExtraite[] = [];

		if (voie === 'service') {
			const indisponible = motifDIndisponibilite(contexte.service, format);
			if (indisponible !== null) {
				/* `P-10` — la brique optionnelle est absente ou incomplète. Le
				   fichier est consigné, le lot continue, et l'import Markdown du
				   même lot n'en souffre pas. */
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

		const titre = entete.titre ?? nomSansExtension(fichier.chemin);
		const identifiant = identifiantLibre(titre, pris, rang + 1);
		pris.add(identifiant);
		const { segments, aplatie } = segmentsPlafonnes(fichier.chemin, contexte.profondeurDeDepart);

		lignes.push({
			...commun,
			sort: 'note',
			motif: null,
			identifiant,
			titre,
			corps,
			etiquettes: entete.etiquettes,
			segments,
			aplatie,
			renvois: entete.renvois,
			avertissements,
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

/* ═══════════════════════════════════════════════════ Le rapport ════════ */

/** Le sort réellement réservé à un fichier, une fois le lot passé. */
export interface LigneDeRapport {
	readonly chemin: string;
	readonly sort: SortDeFichier;
	readonly motif: MotifDEcart | MotifDEchec | null;
	/** L'identifiant de la note écrite, quand il y en a une. */
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
	 * `RG-M12-07` — les images que le service a extraites et QUE RIEN N'A ÉCRITES.
	 *
	 * Le nombre est au rapport parce qu'il n'est pas nul et qu'il ne doit pas
	 * l'avoir l'air : aucun stockage de pièce jointe n'existe (voir
	 * `MANQUES_DE_L_IMPORT`), donc les images d'un document importé sont perdues,
	 * et le rapport le dit plutôt que de les taire (`P-02`, aucune valeur
	 * illustrative — et une absence tue en est une).
	 */
	readonly imagesNonReprises: number;
}

/** Le rapport d'un lot — le même en simulation et en réel, par construction. */
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
	 * `RG-M12-09` — « chaque lot d'import produit une entrée de journal ».
	 * Aucune table ne la porte : le rapport le DIT, il ne le tait pas.
	 */
	readonly journalEnregistre: boolean;
	/** `RG-M12-08` — indexation à la recherche. Aucun index n'est alimenté. */
	readonly indexeALaRecherche: boolean;
}

/* ═══════════════════════════════════════════════ L'exécution ═══════════ */

/** Où le lot atterrit, et par qui il est signé. */
export interface CibleDImport {
	readonly domaineId: string;
	/** Le dossier qui reçoit l'arborescence du lot. */
	readonly dossierId: string;
	readonly auteurId: string;
}

/**
 * L'ANNULATION D'UNE SIMULATION — une erreur, parce qu'une transaction ne
 * s'annule pas autrement, et une erreur PROPRE au module, parce qu'attraper
 * n'importe quoi effacerait un vrai défaut.
 */
class AnnulationDeSimulation extends Error {
	constructor() {
		super('simulation');
		this.name = 'AnnulationDeSimulation';
	}
}

/** Le dossier d'un segment sous un parent, créé s'il n'existe pas encore. */
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

	const inseres = await tx
		.insert(dossiers)
		.values({ domaineId: cible.domaineId, parentId, nom, profondeur })
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
 * LES IDENTIFIANTS LISIBLES DÉJÀ PRIS — `RG-M12-11`, première moitié.
 *
 * Toute la colonne est lue, et non les seuls identifiants du domaine visé :
 * `notes_identifiant_unique` porte sur la table entière, et un identifiant pris
 * ailleurs ferait échouer l'insertion, pas un doublon.
 */
export async function identifiantsPris(base: Base): Promise<ReadonlySet<string>> {
	const lignes = await base.select({ identifiant: notes.identifiant }).from(notes);
	return new Set(lignes.map((l) => l.identifiant));
}

/**
 * L'EXÉCUTION D'UN PLAN — LA MÊME EN SIMULATION ET EN RÉEL.
 *
 * `RG-M12-02` et `ADR-004` : « la même tâche exécutée dans une transaction
 * annulée à la fin. Un seul chemin de code, donc un rapport de simulation qui
 * dit rigoureusement ce que fera l'import réel. »
 *
 * La simulation N'EST DONC LUE QU'UNE FOIS, à la toute fin, quand tout a été
 * écrit et compté. Rien avant elle ne la consulte : il n'existe pas de branche
 * « en simulation, ne pas faire ceci ». Le rapport est constitué DANS la
 * transaction, et il survit à son annulation parce qu'il vit dans la portée
 * d'au-dessus — c'est le seul artifice, et il est ici plutôt que dispersé.
 *
 * `RG-M12-04` continue de gouverner : une ligne que la base refuse devient un
 * échec au rapport, et le lot poursuit.
 */
export async function executerLImport(
	base: Base,
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

		/* Les identifiants que le corpus porte déjà, pour dire quels renvois ne
		   résolvent rien (`RG-M12-03`). Ils sont lus une fois, avant d'écrire :
		   un renvoi vers une note du lot lui-même se résout donc par le second
		   ensemble, celui des identifiants que le plan retient. */
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
			   dupliquée. La branche existe et elle est juste ; ce qui manque pour
			   la rendre atteignable est le nom de la clé d'identifiant à l'en-tête
			   (voir `MANQUES_DE_L_IMPORT`), sans lequel un second import d'un même
			   fichier produit un identifiant suffixé et non une mise à jour. */
			const existante = await tx
				.select({ id: notes.id })
				.from(notes)
				.where(eq(notes.identifiant, ligne.identifiant))
				.limit(1);
			const trouvee = existante[0];
			const maintenant = new Date();

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
						auteurId: cible.auteurId
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
						corpsReferenceModifieLe: maintenant
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
				avertissements: ligne.avertissements,
				imagesNonReprises: ligne.images.length
			});
		}
	};

	try {
		await base.transaction(async (tx) => {
			await appliquer(tx as unknown as Base);
			/* LA SEULE LECTURE DE `simulation` DU MODULE, et elle est la dernière
			   instruction de la transaction : tout ce qui précède a été fait pour
			   de bon, ce qui est la condition pour que le rapport dise vrai. */
			if (options.simulation) throw new AnnulationDeSimulation();
		});
	} catch (erreur) {
		if (!(erreur instanceof AnnulationDeSimulation)) throw erreur;
	}

	return {
		source: plan.source,
		simulation: options.simulation,
		total: plan.total,
		notesCreees,
		notesMisesAJour,
		ignores: lignes.filter((l) => l.sort === 'ignore').length,
		echecs: lignes.filter((l) => l.sort === 'echec').length,
		dossiersCrees,
		lignes,
		/* Aucune table d'imports n'existe (`src/lib/base/schema.ts`, vingt et une
		   tables, aucune ne les porte). Le rapport le déclare plutôt que de le
		   taire — et `base/` n'est pas le territoire de ce lot. */
		journalEnregistre: false,
		/* Aucun index de recherche n'est alimenté par le produit à ce jour. */
		indexeALaRecherche: false
	};
}

/* ═══════════════════════════ Ce que le produit ne porte pas encore ═════ */

/** Une exigence d'import que le dépôt ne peut pas tenir, et pourquoi. */
export interface ManqueDeLImport {
	readonly exigence: string;
	readonly ceQuiManque: string;
	readonly motif: string;
}

/**
 * LE RECENSEMENT DES MANQUES — compté, jamais comblé.
 *
 * `CLAUDE.md` §2, règle de non-comblement : « un agent qui rencontre un vide ne
 * le comble pas. Il s'arrête et remonte. » Ce tableau est la forme durable de
 * cette remontée : il vit à côté du code qui en souffre, et il ne se périme pas
 * en silence.
 */
export const MANQUES_DE_L_IMPORT: readonly ManqueDeLImport[] = [
	{
		exigence: 'RG-M12-01',
		ceQuiManque: 'l’idempotence d’un réimport',
		motif:
			'l’identifiant d’une note importée ne peut venir que de l’en-tête de métadonnées, dont ' +
			'la convention est dite « documentée » par UC-M12-03 sans l’être nulle part. Trois clés ' +
			'seulement sont nommées par une source du dépôt, et l’identifiant n’en fait pas partie. ' +
			'La branche de mise à jour existe et attend son nom de clé.'
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
		exigence: 'RG-M12-08',
		ceQuiManque: 'l’indexation à la recherche dans les 10 secondes',
		motif: 'aucun index de recherche n’est alimenté par le produit à ce jour.'
	},
	{
		exigence: 'RG-M12-09',
		ceQuiManque: 'l’entrée de journal d’un lot',
		motif:
			'aucune table d’imports n’existe — les vingt et une tables du schéma n’en portent pas. ' +
			'Créer une migration serait sortir du territoire du lot.'
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
