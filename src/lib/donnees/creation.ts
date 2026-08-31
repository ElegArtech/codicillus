/**
 * La création d'une note — ce que `POST /notes/nouvelle` écrit en base.
 *
 * Ce module compose : la forme de l'identifiant vient de `../rangement/identifiants.ts`
 * (`ARB-062`), la porte du format de `../contenu/markdown.ts`, le corps vide de
 * `../contenu/corps-vide.ts`, la descente d'arborescence de `./rangement.ts`. Aucune
 * règle de droit n'est écrite ici : la ROUTE appelle `peutEcrireSurLeDossier()`.
 *
 * L'UNICITÉ EST ARBITRÉE PAR LA CONTRAINTE, jamais par une lecture préalable (`ARB-062`
 * §2.5) : lire « cet identifiant est-il pris ? » puis écrire est une course. D'où une
 * transaction PAR ESSAI — PostgreSQL abandonne une transaction entière à la première
 * violation de contrainte, et un second `insert` y échouerait en `25P02`. LA BOUCLE
 * TERMINE : elle ne repart QUE sur `notes_identifiant_unique`, les candidats successifs
 * sont deux à deux distincts et la table en porte un nombre fini.
 *
 * L'INDEX VIENT APRÈS LA TRANSACTION, JAMAIS DEDANS. `ARB-060` : le document est SOUMIS
 * au moteur, sa tâche n'est pas attendue — quand `creerUneNote()` rend, la note n'est pas
 * encore trouvable.
 *
 * La contrainte croisée `notes_proprietes_exigent_un_type_de_fiche` est tenue AVANT la
 * base (`ADR-003`), et les clés sont filtrées sur `champs_de_type_de_fiche` : le `jsonb`
 * n'est contraint par rien d'autre.
 */
import { eq } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { corpsVide } from '../contenu/corps-vide';
import { documentDepuisNoeud, noeudDepuisDocument } from '../edition/document';
import {
	champsDeTypeDeFiche,
	domaines,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	notes,
	templates,
	typesDeFiche,
	typesDeNote,
	versions
} from '../base/schema';
import { versionDUnEnregistrement } from '../edition/enregistrement';
import { analyserMarkdown, markdownDeFormulaire } from '../contenu/markdown';
import type { Document } from '../contenu/document';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { identifiantDeNote, identifiantSuivant } from '../rangement/identifiants';
import { identifiantLisible, segmentsDeDossier } from '../rangement/adresses';
import { entretenirLIndex } from '../recherche/entretien';
import { resoudreLeChemin, type LigneDeDossier } from './rangement';

/** Les deux visibilités de `CDC` §3.2, telles que la colonne les porte. */
export const VISIBILITES = ['interne', 'publique'] as const;
/** Les deux statuts de `CDC:187`, tels que la colonne les porte. */
export const STATUTS = ['brouillon', 'publiee'] as const;

export type Visibilite = (typeof VISIBILITES)[number];
export type Statut = (typeof STATUTS)[number];

/**
 * La soumission, lue et rien de plus — aucun champ deviné ni normalisé au-delà du retrait
 * des blancs de bord. `visibilite` et `statut` sont `null` quand le champ est ABSENT :
 * `null` laisse le DÉFAUT DE COLONNE s'appliquer, une valeur l'écrase. Écrire un défaut
 * en dur ferait une seconde définition du défaut, à côté de celle du schéma.
 */
export interface SaisieDeNote {
	readonly titre: string;
	readonly type: string;
	readonly domaine: string;
	/** Le chemin AFFICHÉ, séparateur ` › `, racine exclue (`./rangement.ts`). */
	readonly dossier: string;
	readonly visibilite: Visibilite | null;
	readonly statut: Statut | null;
	readonly etiquettes: readonly string[];
	readonly corps: string;
	/**
	 * Le document canonique reçu de l'ÉDITEUR, ou `null`. Exclusif du précédent,
	 * ce que `corpsSoumis()` garantit.
	 */
	readonly corpsDocument: unknown;
	/**
	 * Le NOM du type de fiche choisi, ou `null`. C'est un NOM, comme le type de note et le
	 * domaine : le formulaire gelé n'envoie que des noms, et `types_de_fiche.nom` est
	 * unique. La résolution se fait dans `resoudreLaCible()`.
	 */
	readonly fiche: string | null;
	/**
	 * Ce que la note met dans les champs de son type, ou `null`. Les clés ne sont
	 * PAS contrôlées ici : le contrôle demande le référentiel, donc la base, et
	 * cette fonction est pure.
	 */
	readonly proprietes: Readonly<Record<string, string>> | null;
	/**
	 * L'IDENTIFIANT LISIBLE DU TEMPLATE qui a amorcé la rédaction, ou `null`. C'est un
	 * identifiant et non un nom, à la différence du type et du domaine : le choix de
	 * départ se fait sur `Template.id`, que `lireTemplates()` rend depuis
	 * `templates.identifiant`, et `?template=` de `docs/routes.md:287` nomme le même.
	 *
	 * IL N'EST QU'UNE TRACE D'ORIGINE : le squelette est COPIÉ dans le corps à la
	 * création, et la note en est aussitôt indépendante. La colonne sert à compter les
	 * « Utilisations » de V-31, rien d'autre.
	 */
	readonly template: string | null;
}

export type LectureDeSaisie =
	| { readonly ok: true; readonly saisie: SaisieDeNote }
	| { readonly ok: false; readonly motif: string };

/** La valeur textuelle d'un champ, ou la chaîne vide — jamais un `File`. */
function texte(formulaire: FormData, champ: string): string {
	const valeur = formulaire.get(champ);
	return typeof valeur === 'string' ? valeur.trim() : '';
}

/**
 * Les étiquettes d'une saisie — noms séparés par des virgules. Les doublons y sont
 * réduits pour une raison de schéma : `etiquettes_de_note_pk` porte sur
 * `(note_id, etiquette_id)`. La réduction garde la PREMIÈRE occurrence, donc l'ordre de
 * saisie, que `etiquettes_de_note.ordre` persiste ensuite. La comparaison est EXACTE,
 * casse comprise, comme `etiquettes_libelle_unique`.
 */
export function etiquettesDeSaisie(brut: string): readonly string[] {
	const noms = brut
		.split(',')
		.map((n) => n.trim())
		.filter((n) => n.length > 0);
	return [...new Set(noms)];
}

/**
 * LE MARKDOWN SOUMIS, sous l'un ou l'autre de ses deux noms. Voir la note de
 * `lireLaSaisie()` : `corps-markdown` fait foi, `corps` reste admis.
 */
function texteDuCorps(formulaire: FormData): string {
	const valeur = formulaire.get('corps-markdown');
	/* `markdownDeFormulaire()` défait la normalisation du sérialiseur du
	   navigateur, et rien d'autre. */
	return typeof valeur === 'string' ? markdownDeFormulaire(valeur) : '';
}

/**
 * Le document sérialisé, quand c'est l'ÉDITEUR qui a écrit le corps. Deux noms, deux
 * formats, et jamais l'inverse : `corps` porte le document canonique sérialisé,
 * `corps-markdown` du Markdown. Les deux ensemble sont refusés.
 */
export function corpsSoumis(formulaire: FormData): { markdown: string; document: unknown } {
	const brut = formulaire.get('corps');
	if (typeof brut !== 'string' || brut === '')
		return { markdown: texteDuCorps(formulaire), document: null };
	if (typeof formulaire.get('corps-markdown') === 'string' && texteDuCorps(formulaire) !== '') {
		throw new SyntaxError('deux corps soumis');
	}
	return { markdown: '', document: JSON.parse(brut) };
}

/**
 * Les propriétés typées soumises — une table de chaînes, ou un refus. Le champ transporte
 * du JSON parce qu'un formulaire ne sait pas transporter une table. Ce qui n'est pas une
 * table de valeurs SIMPLES est refusé plutôt que rogné (`ADR-003`), et les valeurs sont
 * ramenées à leur texte, forme unique de la colonne.
 */
export function proprietesSoumises(
	brut: string
): { readonly ok: true; readonly valeurs: Record<string, string> } | { readonly ok: false } {
	if (brut === '') return { ok: true, valeurs: {} };
	let lu: unknown;
	try {
		lu = JSON.parse(brut);
	} catch {
		return { ok: false };
	}
	if (typeof lu !== 'object' || lu === null || Array.isArray(lu)) return { ok: false };
	const valeurs: Record<string, string> = {};
	for (const [cle, valeur] of Object.entries(lu as Record<string, unknown>)) {
		if (typeof valeur === 'string') {
			if (valeur !== '') valeurs[cle] = valeur;
		} else if (typeof valeur === 'number' || typeof valeur === 'boolean') {
			valeurs[cle] = String(valeur);
		} else {
			return { ok: false };
		}
	}
	return { ok: true, valeurs };
}

/**
 * La lecture d'un formulaire de création — fonction PURE : elle ne touche pas la base, ne
 * décide d'aucun droit, et rend un motif plutôt que de lever. Quatre champs sont
 * obligatoires, dans l'ordre du contrat : titre, type, domaine, dossier ; un champ blanc
 * vaut un champ absent.
 *
 * LES DEUX ÉNUMÉRÉS SONT REFUSÉS HORS DE LEUR DOMAINE plutôt que ramenés à leur défaut :
 * une valeur inconnue rabattue silencieusement publierait ce que l'appelant croyait
 * retenir, ou l'inverse.
 */
export function lireLaSaisie(formulaire: FormData): LectureDeSaisie {
	const titre = texte(formulaire, 'titre');
	if (titre.length === 0) return { ok: false, motif: 'titre manquant' };
	const type = texte(formulaire, 'type');
	if (type.length === 0) return { ok: false, motif: 'type manquant' };
	const domaine = texte(formulaire, 'domaine');
	if (domaine.length === 0) return { ok: false, motif: 'domaine manquant' };
	const dossier = texte(formulaire, 'dossier');
	if (dossier.length === 0) return { ok: false, motif: 'dossier manquant' };

	const visibiliteBrute = texte(formulaire, 'visibilite');
	if (visibiliteBrute.length > 0 && !(VISIBILITES as readonly string[]).includes(visibiliteBrute)) {
		return { ok: false, motif: 'visibilité inconnue' };
	}
	const statutBrut = texte(formulaire, 'statut');
	if (statutBrut.length > 0 && !(STATUTS as readonly string[]).includes(statutBrut)) {
		return { ok: false, motif: 'statut inconnu' };
	}

	/* LE TYPE DE FICHE EST FACULTATIF. LA CONTRAINTE CROISÉE EST TENUE ICI, AVANT
	   LA BASE (`ADR-003`) : `notes_proprietes_exigent_un_type_de_fiche` refuse des
	   propriétés sans type, et laisser passer ferait remonter la violation en 500
	   sans nommer ce qui manque. */
	const fiche = texte(formulaire, 'fiche');
	const proprietes = proprietesSoumises(texte(formulaire, 'proprietes'));
	if (!proprietes.ok) return { ok: false, motif: 'propriétés illisibles' };
	if (fiche.length === 0 && Object.keys(proprietes.valeurs).length > 0) {
		return { ok: false, motif: 'propriétés sans type de fiche' };
	}

	const template = texte(formulaire, 'template');

	let soumis: { markdown: string; document: unknown };
	try {
		soumis = corpsSoumis(formulaire);
	} catch {
		/* Deux corps soumis, ou un document illisible : refus de forme, pas de
		   refus de format — rien n'a encore atteint la porte du document. */
		return { ok: false, motif: 'corps illisible' };
	}
	return {
		ok: true,
		saisie: {
			titre,
			type,
			domaine,
			dossier,
			visibilite: visibiliteBrute.length > 0 ? (visibiliteBrute as Visibilite) : null,
			statut: statutBrut.length > 0 ? (statutBrut as Statut) : null,
			etiquettes: etiquettesDeSaisie(texte(formulaire, 'etiquettes')),
			/* Le corps n'est PAS rogné : un Markdown commence parfois par une ligne
			   blanche, et `analyserMarkdown()` est seul juge de ce qu'il lit.

			   DEUX NOMS POUR UN SEUL CHAMP : un câblage unique sert les deux adresses
			   (`ARB-063`) et ne peut pas envoyer un nom ici et un autre là.
			   `corps-markdown` fait foi, `corps` reste admis. Sans cette ligne, une
			   création par le navigateur écrit un corps VIDE en silence. */
			corps: soumis.markdown,
			corpsDocument: soumis.document,
			fiche: fiche.length > 0 ? fiche : null,
			proprietes: fiche.length > 0 ? proprietes.valeurs : null,
			/* LE TEMPLATE N'EST JAMAIS UN MOTIF DE REFUS. Un identifiant que le
			   référentiel ne connaît plus laisse la note s'écrire sans provenance :
			   le contenu est déjà dans le corps soumis, et refuser ici ferait perdre
			   la rédaction pour une trace. `resoudreLaCible()` le résout ou l'oublie. */
			template: template.length > 0 ? template : null
		}
	};
}

export interface CibleDeCreation {
	readonly typeDeNoteId: string;
	readonly domaineId: string;
	readonly dossierId: string;
	/** Le type de fiche choisi, ou `null` — la note est simple. */
	readonly typeDeFicheId: string | null;
	/**
	 * Les propriétés RETENUES — celles dont la clé existe vraiment pour ce type.
	 * `null` quand la note est simple : un objet vide porté par une note simple
	 * violerait `notes_proprietes_exigent_un_type_de_fiche`.
	 */
	readonly proprietesTypees: Readonly<Record<string, string>> | null;
	/**
	 * La ligne de `templates` que la saisie désigne, ou `null` — aucun template, ou un
	 * identifiant que le référentiel ne connaît plus. VOIR `lireLaSaisie()` : ce n'est
	 * jamais un refus.
	 */
	readonly templateId: string | null;
}

/**
 * Ce qu'une résolution de cible peut rendre — trois issues, pas deux.
 *
 * `introuvable` CONFOND VOLONTAIREMENT cible inexistante, ambiguë et interdite :
 * `RG-ACC-04` et `ADR-007` veulent qu'elles ne se distinguent pas à un octet près.
 *
 * `fiche-introuvable` n'en est pas : un type de fiche n'est protégé par aucun droit, il
 * est ADMINISTRABLE (M14) et peut disparaître entre l'ouverture de l'écran et
 * l'enregistrement. Le confondre faisait perdre le brouillon entier.
 */
export type ResolutionDeCible =
	| { readonly sort: 'cible'; readonly cible: CibleDeCreation }
	| { readonly sort: 'introuvable' }
	| { readonly sort: 'fiche-introuvable' }
	/**
	 * Le type de fiche existe, et l'une au moins de ses propriétés OBLIGATOIRES n'a pas de
	 * valeur. Ni un 404 ni une erreur de forme : un champ que le rédacteur peut remplir.
	 * Les manquantes sont NOMMÉES, faute de quoi l'écran ne pourrait dire ni laquelle ni où.
	 */
	| {
			readonly sort: 'proprietes-manquantes';
			readonly manquantes: readonly ProprieteManquante[];
	  };

/**
 * Une propriété obligatoire sans valeur — sa CLÉ et son NOM. La clé porte le foyer
 * (`erreur-fiche-{cle}`), le nom porte la phrase : deux propriétés peuvent porter
 * le même nom d'affichage, seule la clé est unique par type.
 */
export interface ProprieteManquante {
	readonly cle: string;
	readonly nom: string;
}

/**
 * La colonne qui commande l'obligation, LIÉE au schéma et jamais recopiée :
 * renommer la colonne, la retirer ou en changer le type fait rougir `pnpm check`
 * ici même.
 */
export type ChampObligeant = Pick<
	typeof champsDeTypeDeFiche.$inferSelect,
	'cle' | 'nom' | 'obligatoire'
>;

/**
 * Les propriétés obligatoires que la saisie ne renseigne pas — fonction PURE. Elle lit ce
 * que `retenirLesProprietes()` a RETENU, pas ce que le formulaire a envoyé : les deux
 * filtres restent ainsi une seule définition de « propriété renseignée ». L'ORDRE est
 * celui du référentiel, celui que l'éditeur affiche.
 */
export function proprietesObligatoiresManquantes(
	champs: readonly ChampObligeant[],
	retenues: Readonly<Record<string, string>>
): readonly ProprieteManquante[] {
	const manquantes: ProprieteManquante[] = [];
	for (const champ of champs) {
		if (!champ.obligatoire) continue;
		const valeur = retenues[champ.cle];
		if (valeur === undefined || valeur === '') manquantes.push({ cle: champ.cle, nom: champ.nom });
	}
	return manquantes;
}

/**
 * La cible qu'une saisie désigne, ou son refus.
 *
 * Le formulaire gelé n'envoie que des NOMS : `#m-domaine` porte `d.nom` (`V-17:2788`),
 * l'univers est AFFICHÉ, il n'est pas SOUMIS. Or `RG-STR-02` n'impose l'unicité d'un
 * domaine qu'AU SEIN de son univers : deux homonymes dans deux univers sont écrivables.
 * La résolution REFUSE alors plutôt que d'en élire un — choisir par l'ordre des lignes
 * serait une décision fonctionnelle prise en exécution.
 *
 * Le chemin de dossier passe par `resoudreLeChemin()`, qui compare
 * `identifiantLisible(nom)` à chaque maillon : la même comparaison des deux côtés.
 */
export async function resoudreLaCible(
	base: Base,
	saisie: SaisieDeNote
): Promise<ResolutionDeCible> {
	const [type] = await base
		.select({ id: typesDeNote.id })
		.from(typesDeNote)
		.where(eq(typesDeNote.nom, saisie.type))
		.limit(1);
	if (type === undefined) return { sort: 'introuvable' };

	/* DEUX lignes sont lues, pas une : c'est la seule manière de distinguer « aucun
	   domaine de ce nom » de « plusieurs », donc de refuser le second cas. */
	const homonymes = await base
		.select({ id: domaines.id })
		.from(domaines)
		.where(eq(domaines.nom, saisie.domaine))
		.limit(2);
	if (homonymes.length !== 1) return { sort: 'introuvable' };
	const domaineId = (homonymes[0] as { id: string }).id;

	const lignes: readonly LigneDeDossier[] = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			domaineId: dossiers.domaineId,
			nom: dossiers.nom,
			profondeur: dossiers.profondeur
		})
		.from(dossiers)
		.where(eq(dossiers.domaineId, domaineId));

	/* LA RACINE D'UN DOMAINE EST UNE DESTINATION VALABLE, et `resoudreLeChemin()` n'en veut
	   pas à raison : il sert d'abord à résoudre une ADRESSE, où un chemin vide ne désigne
	   rien. Créer une note est un autre usage — un domaine tout neuf n'a que sa racine, et
	   le sélecteur la proposait quand l'enregistrement rendait 404. On retire son segment
	   en tête, et ce qui reste se résout comme avant. */
	const racine = lignes.find((d) => d.parentId === null) ?? null;
	let segments = segmentsDeDossier(saisie.dossier).map(identifiantLisible);
	if (racine !== null && segments[0] === identifiantLisible(racine.nom)) {
		segments = segments.slice(1);
	}
	const dossier = segments.length === 0 ? racine : resoudreLeChemin(lignes, segments);
	if (dossier === null) return { sort: 'introuvable' };

	const templateId = await resoudreLeTemplate(base, saisie.template);

	const fiche = await resoudreLeTypeDeFiche(base, saisie);
	if (fiche.sort === 'introuvable') return { sort: 'fiche-introuvable' };
	if (fiche.sort === 'manquantes') {
		return { sort: 'proprietes-manquantes', manquantes: fiche.manquantes };
	}

	return {
		sort: 'cible',
		cible: {
			typeDeNoteId: type.id,
			domaineId,
			dossierId: dossier.id,
			typeDeFicheId: fiche.typeDeFicheId,
			proprietesTypees: fiche.proprietesTypees,
			templateId
		}
	};
}

/**
 * LA PROVENANCE, RÉSOLUE OU OUBLIÉE — jamais un refus.
 *
 * Le référentiel des templates est ADMINISTRABLE : un gabarit peut disparaître entre
 * l'ouverture de l'écran et l'enregistrement. Rendre 404, ou même un 400 nommé, ferait
 * perdre une rédaction entière pour une TRACE dont le contenu est déjà dans le corps
 * soumis. L'identifiant inconnu vaut donc « pas de provenance », et la note s'écrit.
 */
async function resoudreLeTemplate(base: Base, identifiant: string | null): Promise<string | null> {
	if (identifiant === null) return null;
	const [ligne] = await base
		.select({ id: templates.id })
		.from(templates)
		.where(eq(templates.identifiant, identifiant))
		.limit(1);
	return ligne?.id ?? null;
}

/**
 * Le type de fiche qu'une saisie désigne, et les propriétés qu'il autorise. Un nom de
 * type INCONNU est refusé, jamais ignoré : l'ignorer écrirait une note simple là où
 * l'utilisateur a choisi une fiche.
 *
 * LES PROPRIÉTÉS SONT FILTRÉES SUR LES CLÉS RÉELLES du type : `proprietes_typees` est un
 * `jsonb` que la base ne contraint pas. Ce qui n'est pas un champ du type est ÉCARTÉ, pas
 * refusé — le référentiel est administrable, et un champ retiré en console entre deux
 * moments d'une saisie ferait sinon échouer un enregistrement que rien n'a rendu faux.
 *
 * CE QUI EST OBLIGATOIRE EST EXIGÉ : « la note ne pourra pas être enregistrée sans cette
 * valeur » (`V-29:3153`).
 */
type ResolutionDeFiche =
	| {
			readonly sort: 'fiche';
			readonly typeDeFicheId: string | null;
			readonly proprietesTypees: Readonly<Record<string, string>> | null;
	  }
	| { readonly sort: 'introuvable' }
	| { readonly sort: 'manquantes'; readonly manquantes: readonly ProprieteManquante[] };

async function resoudreLeTypeDeFiche(base: Base, saisie: SaisieDeNote): Promise<ResolutionDeFiche> {
	if (saisie.fiche === null) {
		return { sort: 'fiche', typeDeFicheId: null, proprietesTypees: null };
	}
	const [type] = await base
		.select({ id: typesDeFiche.id })
		.from(typesDeFiche)
		.where(eq(typesDeFiche.nom, saisie.fiche))
		.limit(1);
	if (type === undefined) return { sort: 'introuvable' };

	/* Trois colonnes sont lues là où une suffisait : le caractère obligatoire
	   descendait de la console jusqu'à la base et s'arrêtait là — rien nulle part
	   n'exigeait la valeur. */
	const champs = await base
		.select({
			cle: champsDeTypeDeFiche.cle,
			nom: champsDeTypeDeFiche.nom,
			obligatoire: champsDeTypeDeFiche.obligatoire
		})
		.from(champsDeTypeDeFiche)
		.where(eq(champsDeTypeDeFiche.typeDeFicheId, type.id))
		/* LE TRI ACCORDE DEUX ÉCRANS : `lireTypesDeFiche()` trie par
		   `typesDeFiche.ordre, champsDeTypeDeFiche.ordre`, et c'est dans cet ordre que
		   l'éditeur peint les champs. Sans le même tri ici, le rédacteur lirait ses
		   champs dans un ordre et ses refus dans un autre. */
		.orderBy(champsDeTypeDeFiche.ordre);
	const retenues = retenirLesProprietes(
		saisie.proprietes ?? {},
		champs.map((c) => c.cle)
	);
	const manquantes = proprietesObligatoiresManquantes(champs, retenues);
	if (manquantes.length > 0) return { sort: 'manquantes', manquantes };
	return {
		sort: 'fiche',
		typeDeFicheId: type.id,
		proprietesTypees: Object.keys(retenues).length === 0 ? null : retenues
	};
}

/**
 * LES PROPRIÉTÉS QUE LE RÉFÉRENTIEL RECONNAÎT — fonction PURE, donc éprouvable
 * dans les deux polarités sans base (`P-5`). Voir `resoudreLeTypeDeFiche()`
 * pour la raison de l'écart plutôt que du refus.
 */
export function retenirLesProprietes(
	soumises: Readonly<Record<string, string>>,
	clesConnues: readonly string[]
): Record<string, string> {
	const retenues: Record<string, string> = {};
	for (const cle of clesConnues) {
		const valeur = soumises[cle];
		if (valeur !== undefined && valeur !== '') retenues[cle] = valeur;
	}
	return retenues;
}

/** Le nom de la contrainte qui arbitre l'unicité — `ARB-062` §2.5. */
export const CONTRAINTE_D_IDENTIFIANT = 'notes_identifiant_unique';

/** Le code SQLSTATE d'une violation d'unicité (PostgreSQL, classe 23). */
const VIOLATION_D_UNICITE = '23505';

/**
 * Jusqu'où la chaîne des causes est remontée. Rien n'interdit à une erreur de se
 * désigner elle-même comme sa propre cause, et une boucle infinie coûterait ici la
 * requête entière. La chaîne réelle fait DEUX niveaux ; huit laissent de la marge.
 */
const PROFONDEUR_DES_CAUSES = 8;

/**
 * L'échec est-il la collision d'identifiant qu'`ARB-062` fait réessayer ? Fonction PURE —
 * elle n'inspecte qu'un objet d'erreur.
 *
 * LA CONTRAINTE EST NOMMÉE, ET CE N'EST PAS UN LUXE : une transaction de création écrit
 * aussi des étiquettes, et `etiquettes_libelle_unique` peut lever le MÊME code `23505`.
 * Réessayer sur le code seul ferait boucler indéfiniment.
 *
 * LA CHAÎNE DES CAUSES EST PARCOURUE : drizzle n'expose pas l'erreur du pilote, il
 * l'ENVELOPPE. Lue à plat, l'enveloppe ne porte NI code NI nom de contrainte, la boucle
 * ne repart jamais, et un titre déjà pris remonte en 500. Ne PAS resimplifier en lecture
 * d'un seul niveau : la profondeur appartient à une bibliothèque et peut changer.
 */
export function estUneCollisionDIdentifiant(cause: unknown): boolean {
	let echec: unknown = cause;
	for (let niveau = 0; niveau < PROFONDEUR_DES_CAUSES; niveau += 1) {
		if (typeof echec !== 'object' || echec === null) return false;
		const erreur = echec as { code?: unknown; constraint?: unknown; cause?: unknown };
		if (erreur.code === VIOLATION_D_UNICITE && erreur.constraint === CONTRAINTE_D_IDENTIFIANT) {
			return true;
		}
		echec = erreur.cause;
	}
	return false;
}

export interface DemandeDeCreation {
	readonly saisie: SaisieDeNote;
	readonly cible: CibleDeCreation;
	readonly identite: Identite;
	readonly maintenant: Date;
	/**
	 * L'adresse curatée, quand la note créée est un SIGNET. Un signet n'est pas un
	 * objet séparé : c'est une note de type « Signet » qui porte une adresse, le
	 * schéma le dit — deux colonnes de `notes`, pas une table.
	 */
	readonly signet?: { readonly adresse: string; readonly ajouteLe: Date };
}

export interface CreationFaite {
	readonly identifiant: string;
	readonly essais: number;
}

/**
 * Le corps rédigé, depuis le Markdown soumis — la porte est unique.
 *
 * Un corps ABSENT ou VIDE ne passe pas par `analyserMarkdown()`, qui LÈVE sur le vide :
 * « aucun contenu vide, l'absence de contenu s'écrit par l'absence de la clé ». Celui du
 * produit est `corpsVide()`, un paragraphe sans texte, REPRIS et jamais réécrit ici.
 *
 * @throws MarkdownInvalide, DocumentInvalide — le corps soumis est refusé, jamais réparé.
 */
export function corpsDeLaSaisie(corps: string, document: unknown = null): Document {
	/* LE DOCUMENT DE L'ÉDITEUR PASSE PAR LES DEUX PORTES, comme à
	   l'enregistrement : `noeudDepuisDocument()` contrôle que le schéma de
	   l'éditeur sait le porter, `documentDepuisNoeud()` rend ce que ProseMirror
	   RÉÉCRIT — jamais ce qu'on a reçu (règle 1 du format). */
	if (document !== null && document !== undefined) {
		return documentDepuisNoeud(noeudDepuisDocument(document));
	}
	return corps.trim().length === 0 ? corpsVide() : analyserMarkdown(corps);
}

/** L'étiquette d'un libellé, créée si elle n'existe pas — `RG-M12-06`. */
export async function etiquetteDuLibelle(tx: Base, libelle: string): Promise<string> {
	const [deja] = await tx
		.select({ id: etiquettes.id })
		.from(etiquettes)
		.where(eq(etiquettes.libelle, libelle))
		.limit(1);
	if (deja !== undefined) return deja.id;
	const inseres = await tx.insert(etiquettes).values({ libelle }).returning({ id: etiquettes.id });
	return (inseres[0] as { id: string }).id;
}

/**
 * La création d'une note — l'écriture, et rien qu'elle.
 *
 * LE DROIT N'EST PAS VÉRIFIÉ ICI, ET C'EST VOULU : la route le fait avant, en deux portes
 * — « écrire des notes quelque part », puis le droit sur CE dossier. Cette fonction exige
 * seulement une identité AUTHENTIFIÉE, faute de quoi il n'existe aucun auteur à écrire
 * dans `notes.auteur_id`. L'ORDRE DES ÉCRITURES : la ligne `notes`, puis les liaisons
 * d'étiquettes, qui la référencent.
 *
 * @throws MarkdownInvalide, DocumentInvalide — le corps soumis est refusé.
 * @throws l'erreur du moteur si l'index n'a pas pu être entretenu. La note est alors
 *   ÉCRITE et non indexée, et l'appelant reçoit l'échec plutôt qu'un silence.
 */
/**
 * La colonne `signet_ajoute_le` est une DATE, pas un instant : elle porte le
 * jour où le signet est entré au corpus, et rien de plus fin.
 */
function dateSeule(instant: Date): string {
	return instant.toISOString().slice(0, 10);
}

/**
 * Le résumé de la première version — repris du gel, jamais rédigé ici. `RG-M07-01`
 * capture une version « à chaque enregistrement qui modifie le corps Référence » : une
 * création écrit ce corps, elle en écrit donc la version n° 1.
 */
export const RESUME_DE_CREATION = 'Création de la note';

export async function creerUneNote(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeCreation
): Promise<Resolution<CreationFaite>> {
	if (demande.identite.type !== 'authentifie') return INTROUVABLE;
	const auteurId = demande.identite.compteId;

	/* LE CORPS EST VALIDÉ AVANT LA PREMIÈRE TRANSACTION : un Markdown illisible ne
	   doit pas coûter un aller-retour en base, ni un identifiant consommé. */
	const corps = corpsDeLaSaisie(demande.saisie.corps, demande.saisie.corpsDocument);
	const candidat = identifiantDeNote(demande.saisie.titre);

	for (let essai = 1; ; essai += 1) {
		const identifiant = identifiantSuivant(candidat, essai);
		try {
			await base.transaction(async (tx) => {
				const inseres = await tx
					.insert(notes)
					.values({
						identifiant,
						titre: demande.saisie.titre,
						corpsReference: corps,
						typeDeNoteId: demande.cible.typeDeNoteId,
						domaineId: demande.cible.domaineId,
						dossierId: demande.cible.dossierId,
						auteurId,
						/* ABSENT ⇒ NON ÉCRIT : le défaut de colonne s'applique, et il n'en
						   existe pas d'autre — `visibilite` vaut `interne`, `statut` vaut
						   `publiee`. */
						...(demande.saisie.visibilite === null
							? {}
							: { visibilite: demande.saisie.visibilite }),
						...(demande.saisie.statut === null ? {} : { statut: demande.saisie.statut }),
						/* LE TYPE DE FICHE ET SES PROPRIÉTÉS — même régime, et ils voyagent
						   ENSEMBLE : des propriétés sans type violeraient
						   `notes_proprietes_exigent_un_type_de_fiche`. */
						...(demande.cible.typeDeFicheId === null
							? {}
							: { typeDeFicheId: demande.cible.typeDeFicheId }),
						...(demande.cible.proprietesTypees === null
							? {}
							: { proprietesTypees: demande.cible.proprietesTypees }),
						/* LA PROVENANCE — la trace du squelette qui a amorcé la rédaction.
						   ABSENTE ⇒ NON ÉCRITE, comme les précédentes : la colonne est
						   nullable et son absence dit « partie d'une page vierge ». C'est
						   elle, et elle seule, qui rend « Utilisations » calculable en
						   V-31. */
						...(demande.cible.templateId === null ? {} : { templateId: demande.cible.templateId }),
						/* UN SEUL INSTANT pour les trois dates — celui de la requête. Trois
						   `now()` de base donneraient trois valeurs différentes. */
						creeLe: demande.maintenant,
						modifieLe: demande.maintenant,
						corpsReferenceModifieLe: demande.maintenant,
						...(demande.signet === undefined
							? {}
							: {
									signetAdresse: demande.signet.adresse,
									signetAjouteLe: dateSeule(demande.signet.ajouteLe)
								})
					})
					.returning({ id: notes.id });
				const noteId = (inseres[0] as { id: string }).id;

				/* LA VERSION N° 1, composée par `versionDUnEnregistrement()` : la MÊME
				   décision que celle de l'enregistrement, un second calcul divergerait et
				   la divergence ne se verrait qu'à l'historique. L'état d'AVANT est
				   l'absence, ce qui donne « n lignes ajoutées, 0 retirée ». */
				const version = versionDUnEnregistrement({
					dernierNumero: 0,
					auteurId,
					maintenant: demande.maintenant,
					titre: demande.saisie.titre,
					corps: { reference: corps, operationnel: null },
					avant: { titre: demande.saisie.titre, reference: null, operationnel: null }
				});
				if (version !== null) {
					await tx.insert(versions).values({
						noteId,
						numero: version.numero,
						le: version.le,
						auteurId: version.auteurId,
						resume: RESUME_DE_CREATION,
						ajout: version.ajout,
						retrait: version.retrait,
						titre: version.titre,
						corpsReference: version.corpsReference,
						corpsOperationnel: version.corpsOperationnel
					});
				}

				let ordre = 0;
				for (const libelle of demande.saisie.etiquettes) {
					const etiquetteId = await etiquetteDuLibelle(tx as unknown as Base, libelle);
					await tx.insert(etiquettesDeNote).values({ noteId, etiquetteId, ordre });
					ordre += 1;
				}
			});

			/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. */
			await entretenirLIndex(base, client, [identifiant]);
			return { trouve: true, ressource: { identifiant, essais: essai } };
		} catch (cause) {
			if (!estUneCollisionDIdentifiant(cause)) throw cause;
			/* L'identifiant est pris. Le tour suivant en propose un autre — et il
			   n'y a rien à défaire : la transaction a été abandonnée entière. */
		}
	}
}
