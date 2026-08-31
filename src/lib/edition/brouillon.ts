/**
 * LE BROUILLON LOCAL — la moitié manquante de `RG-NF-02` : « sauvegarde automatique et
 * avertissement de sortie ». L'avertissement existait (`gestes.ts`, bouton « Annuler ») ;
 * la sauvegarde, non. Un contributeur qui rédigeait vingt minutes et dont l'onglet se
 * fermait perdait tout.
 *
 * IL VIT DANS LE STOCKAGE DU NAVIGATEUR, PAS EN BASE. Aucune table, aucune migration,
 * aucun appel réseau périodique : un brouillon est un état de RÉDACTION, pas une version
 * de la note (`RG-M07-01` capture à l'enregistrement, et lui seul). Il est écrit après
 * chaque pause de frappe, relu à l'ouverture de l'éditeur, effacé quand l'enregistrement
 * a abouti.
 *
 * LA CLÉ DISTINGUE DEUX CHOSES À LA FOIS — la CIBLE et le COMPTE. Sans la cible, ouvrir
 * une seconde note ferait apparaître le brouillon de la première ; sans le compte, deux
 * personnes qui se relaient sur le même poste hériteraient du texte l'une de l'autre. Le
 * compte n'entre pas par son identifiant : `empreinteDeCompte()` en dérive une marque
 * stable, de sorte que le stockage du navigateur — que la seconde personne peut lire —
 * ne porte pas l'identifiant de la première.
 *
 * LE CORPS EST GARDÉ DANS LA FORME QUE LA SOUMISSION EMPLOIE — le document canonique
 * d'`ADR-003`, celui que `cablerLEditeur()` sérialise dans le champ `corps`. Un second
 * format aurait à être tenu à jour à deux endroits, et le brouillon relu par la mauvaise
 * porte serait un contenu amputé.
 */
import { analyserDocument, type Document } from '../contenu/document';
import { formaterDateHeureFr, formaterHeureFr } from '../dates';
import { poserUnAvis, retirerUnAvis } from './avis';
import { DOCUMENT_VIDE, poserLeTemoinDeBrouillon } from './gestes';

/** Ce qu'un brouillon garde. Rien qui ne se retrouve dans l'écran rouvert. */
export interface Brouillon {
	readonly titre: string;
	readonly corps: Document;
	/** L'instant de la dernière écriture locale, en ISO 8601. */
	readonly le: string;
	/**
	 * LE GABARIT DONT LA RÉDACTION EST PARTIE — l'identifiant que le choix de départ
	 * dépose dans la soumission, et rien de plus : le squelette, lui, est déjà DANS le
	 * corps. Absent quand la note part d'une page vierge, ce qui est le cas ordinaire ;
	 * il n'est donc écrit que lorsqu'il vaut quelque chose.
	 *
	 * Sans lui, changer de domaine en cours de rédaction rendait le texte intact et la
	 * PROVENANCE perdue : la note s'enregistrait comme née de rien, et « Utilisations »
	 * du gabarit n'en savait rien.
	 */
	readonly gabarit?: string;
}

/**
 * Ce que ce module demande au stockage — trois méthodes, jamais l'objet entier. Un
 * contrôle peut alors en tenir un faux, et le module ne peut pas balayer les clés d'un
 * stockage qu'il partage avec le reste du produit.
 */
export interface StockageLocal {
	getItem(cle: string): string | null;
	setItem(cle: string, valeur: string): void;
	removeItem(cle: string): void;
}

/** Le préfixe des clés du produit dans le stockage du navigateur. */
export const PREFIXE_DE_BROUILLON = 'codicillus:brouillon:';

/** La cible d'un brouillon de CRÉATION — l'écran `/notes/nouvelle` n'a pas de note. */
export const CIBLE_DE_CREATION = 'nouvelle';

/**
 * LA MARQUE D'UN COMPTE — une empreinte, pas son identifiant.
 *
 * Elle n'a pas à résister à une attaque : elle sépare deux sessions sur un même
 * navigateur, elle ne protège rien. Ce qu'elle doit être, c'est STABLE d'une ouverture à
 * l'autre et calculable des deux côtés sans dépendance — deux passes de FNV-1a sur des
 * amorces différentes, concaténées, soit seize chiffres hexadécimaux.
 */
export function empreinteDeCompte(compteId: string): string {
	return passeFnv(compteId, 0x811c9dc5) + passeFnv(compteId, 0x01000193);
}

function passeFnv(texte: string, amorce: number): string {
	let empreinte = amorce >>> 0;
	for (let rang = 0; rang < texte.length; rang += 1) {
		empreinte ^= texte.charCodeAt(rang);
		empreinte = Math.imul(empreinte, 0x01000193) >>> 0;
	}
	return empreinte.toString(16).padStart(8, '0');
}

/**
 * La clé d'un brouillon. `compte` est l'empreinte, jamais l'identifiant ; `cible` est
 * l'identifiant de la note en modification, ou `CIBLE_DE_CREATION`.
 */
export function cleDeBrouillon(compte: string, cible: string): string {
	return `${PREFIXE_DE_BROUILLON}${compte}:${cible}`;
}

/**
 * Le brouillon rangé sous cette clé, ou `null`.
 *
 * TOUT CE QUI N'EST PAS UN BROUILLON ENTIER REND `null`, ET N'EST PAS RÉPARÉ : le corps
 * repasse par la porte unique du format (`analyserDocument`), donc un contenu tronqué,
 * d'une version antérieure du schéma, ou écrit par autre chose, est ÉCARTÉ plutôt
 * qu'inséré dans l'éditeur. Le rédacteur perd un brouillon illisible ; il ne voit pas son
 * document se faire amputer en silence.
 */
export function lireLeBrouillon(stockage: StockageLocal, cle: string): Brouillon | null {
	let brut: string | null;
	try {
		brut = stockage.getItem(cle);
	} catch {
		/* Un stockage refusé — navigation privée verrouillée, réglage d'entreprise.
		   L'éditeur marche sans brouillon ; il ne doit pas refuser de s'ouvrir. */
		return null;
	}
	if (brut === null || brut === '') return null;
	try {
		const lu: unknown = JSON.parse(brut);
		if (typeof lu !== 'object' || lu === null) return null;
		const champs = lu as Record<string, unknown>;
		const titre = champs['titre'];
		const le = champs['le'];
		if (typeof titre !== 'string' || typeof le !== 'string') return null;
		if (Number.isNaN(Date.parse(le))) return null;
		const corps = analyserDocument(champs['corps']);
		/* LE GABARIT EST FACULTATIF, ET UN BROUILLON SANS LUI RESTE VALIDE : les
		   brouillons écrits avant qu'il n'existe se relisent, et une page vierge n'en
		   porte aucun. Tout ce qui n'est pas une chaîne non vide est simplement absent. */
		const gabarit = champs['gabarit'];
		if (typeof gabarit !== 'string' || gabarit === '') return { titre, corps, le };
		return { titre, corps, le, gabarit };
	} catch {
		return null;
	}
}

/**
 * Écrit le brouillon. Rend `false` quand le stockage a refusé — quota atteint, stockage
 * fermé : le témoin de la barre d'état ne doit pas annoncer un enregistrement local qui
 * n'a pas eu lieu.
 */
export function ecrireLeBrouillon(
	stockage: StockageLocal,
	cle: string,
	brouillon: Brouillon
): boolean {
	try {
		stockage.setItem(cle, JSON.stringify(brouillon));
		return true;
	} catch {
		return false;
	}
}

export function effacerLeBrouillon(stockage: StockageLocal, cle: string): void {
	try {
		stockage.removeItem(cle);
	} catch {
		/* Rien à faire : le brouillon suivant l'écrasera. */
	}
}

/**
 * LE BROUILLON A-T-IL ÉTÉ DOUBLÉ PAR LA BASE ? — la question que la MODIFICATION doit
 * poser, et que la création n'a pas à poser.
 *
 * `enregistreeLe` est l'instant du dernier enregistrement de la note. S'il est postérieur
 * au brouillon, quelqu'un — ou soi-même, depuis un autre poste — a écrit après que ce
 * brouillon a été laissé : le restaurer écraserait ce travail. La restauration reste
 * OFFERTE, jamais imposée ; ce prédicat ne fait que dire à l'écran quoi annoncer.
 */
export function brouillonDoubleParLaBase(
	brouillon: Brouillon,
	enregistreeLe: string | null
): boolean {
	if (enregistreeLe === null) return false;
	const enregistre = Date.parse(enregistreeLe);
	const local = Date.parse(brouillon.le);
	if (Number.isNaN(enregistre) || Number.isNaN(local)) return false;
	return enregistre > local;
}

/* =====================================================================
   LE CÂBLAGE — ce qui relie le brouillon à l'écran de rédaction.
   ===================================================================== */

export type Debranchement = () => void;

export interface OptionsDuBrouillonLocal {
	/** La clé, composée par `cleDeBrouillon()` : elle porte le compte ET la cible. */
	readonly cle: string;
	/** Le document courant — la MÊME forme que le champ `corps` de la soumission. */
	readonly document: () => Document;
	/** Remplace le corps de l'éditeur. C'est la restauration, et rien d'autre. */
	readonly remplacer: (document: Document) => void;
	/**
	 * LE GABARIT COURANT — l'identifiant que la soumission porte, chaîne vide quand la
	 * note ne part d'aucun gabarit. Absent, le brouillon n'en garde pas : l'écran de
	 * MODIFICATION n'a pas de choix de départ.
	 */
	readonly gabarit?: () => string;
	/** Repose le gabarit du brouillon repris — chaîne vide pour « aucun ». */
	readonly poserLeGabarit?: (gabarit: string) => void;
	/**
	 * L'instant du dernier enregistrement de la note, en ISO — `null` en CRÉATION.
	 * C'est ce qui sépare les deux régimes : en création il n'y a rien à écraser et le
	 * brouillon est repris d'emblée ; en modification il est PROPOSÉ, jamais imposé.
	 */
	readonly enregistreeLe?: string | null;
	/** Le stockage. Absent : celui de la fenêtre qui porte le formulaire. */
	readonly stockage?: StockageLocal | null;
	readonly maintenant?: () => Date;
	/** Le repos après la frappe, en millisecondes. */
	readonly delai?: number;
}

export interface BrouillonCable {
	/**
	 * UN BROUILLON A-T-IL ÉTÉ REPRIS À L'OUVERTURE ? Vrai seulement quand la reprise a
	 * eu lieu d'emblée — le régime de la CRÉATION. L'écran s'en sert pour ne pas
	 * redemander par quoi commencer à quelqu'un qui a déjà son texte sous les yeux.
	 */
	readonly repris: boolean;
	/** Une frappe a eu lieu : l'écriture est différée du délai de repos. */
	signaler(): void;
	/** Écrit sans attendre — la fermeture de l'onglet ne laisse pas passer le délai. */
	ecrireMaintenant(): void;
	/** L'enregistrement a abouti : le brouillon n'a plus de raison d'être. */
	effacer(): void;
	defaire(): void;
}

const DELAI_PAR_DEFAUT = 1000;

/** La clé de l'avis de restauration. */
const CLE_D_AVIS = 'brouillon';

/**
 * LE CÂBLAGE DE LA SAUVEGARDE AUTOMATIQUE — appelé depuis `onMount` d'une route, après
 * le montage de l'éditeur.
 *
 * TROIS MOMENTS, ET AUCUN QUI TOUCHE AU RÉSEAU : à l'ouverture il relit ; après chaque
 * pause de frappe il écrit ; quand la page se cache — onglet fermé, onglet quitté — il
 * écrit sans attendre le repos, sans quoi les mots des trois dernières secondes se
 * perdraient au moment précis où le brouillon sert.
 */
export function cablerLeBrouillonLocal(
	formulaire: HTMLFormElement,
	options: OptionsDuBrouillonLocal
): BrouillonCable {
	const document = formulaire.ownerDocument;
	const fenetre = document.defaultView;
	const stockage = options.stockage ?? stockageDeLaFenetre(fenetre);
	const maintenant = options.maintenant ?? (() => new Date());
	const inerte: BrouillonCable = {
		repris: false,
		signaler: () => undefined,
		ecrireMaintenant: () => undefined,
		effacer: () => undefined,
		defaire: () => undefined
	};
	if (stockage === null) return inerte;

	const champTitre = formulaire.querySelector<HTMLTextAreaElement>('#titre');
	let minuterie: ReturnType<typeof setTimeout> | null = null;

	const ecrire = (): void => {
		if (minuterie !== null) {
			clearTimeout(minuterie);
			minuterie = null;
		}
		const le = maintenant();
		/* LE GABARIT EST DEMANDÉ À L'ÉCRITURE, JAMAIS RETENU AU CÂBLAGE : le champ qui
		   le porte est posé par le choix de départ, qui peut être câblé après nous. */
		const gabarit = options.gabarit?.() ?? '';
		const ecrit = ecrireLeBrouillon(stockage, options.cle, {
			titre: champTitre?.value ?? '',
			corps: options.document(),
			le: le.toISOString(),
			...(gabarit === '' ? {} : { gabarit })
		});
		/* LE TÉMOIN NE PARLE QUE SI L'ÉCRITURE A EU LIEU : un stockage plein annoncerait
		   sinon un brouillon qui n'existe pas. */
		if (ecrit) poserLeTemoinDeBrouillon(formulaire, formaterHeureFr(le));
	};

	const differer = (): void => {
		if (minuterie !== null) clearTimeout(minuterie);
		minuterie = setTimeout(ecrire, options.delai ?? DELAI_PAR_DEFAUT);
	};

	const effacer = (): void => {
		if (minuterie !== null) {
			clearTimeout(minuterie);
			minuterie = null;
		}
		effacerLeBrouillon(stockage, options.cle);
		retirerUnAvis(formulaire, CLE_D_AVIS);
	};

	const restaurer = (brouillon: Brouillon): void => {
		if (champTitre !== null && brouillon.titre !== '') champTitre.value = brouillon.titre;
		options.remplacer(brouillon.corps);
		options.poserLeGabarit?.(brouillon.gabarit ?? '');
		retirerUnAvis(formulaire, CLE_D_AVIS);
	};

	/* REPARTIR D'UNE PAGE VIERGE, C'EST CE QUE LE BOUTON DIT : le brouillon est
	   effacé ET l'écran est rendu à l'état d'une note à naître. Effacer la seule clé
	   laisserait le texte restauré à l'écran, et le premier caractère frappé le
	   réécrirait aussitôt. */
	const vider = (): void => {
		effacer();
		if (champTitre !== null) champTitre.value = '';
		options.remplacer(DOCUMENT_VIDE);
		options.poserLeGabarit?.('');
	};

	const repris = proposerLaReprise(formulaire, {
		brouillon: lireLeBrouillon(stockage, options.cle),
		enregistreeLe: options.enregistreeLe ?? null,
		restaurer,
		vider,
		ecarter: effacer
	});

	/* LE TITRE EST DANS LE BROUILLON, DONC IL LE DÉCLENCHE. Rien d'autre ne l'écoute :
	   `cablerLEditeur()` ne pose `surSaisie` que sur les champs de fiche, et
	   `monterLEditeur()` ne voit que le corps. Sans cet écouteur, un titre frappé sans
	   une ligne de texte ne serait jamais gardé. */
	champTitre?.addEventListener('input', differer);

	/* La page se cache : c'est le dernier instant où l'on peut écrire. `pagehide` porte
	   la fermeture d'onglet et la navigation ; `visibilitychange` porte le passage en
	   arrière-plan, que les navigateurs mobiles substituent parfois au premier. */
	const auDepart = (): void => {
		if (minuterie !== null) ecrire();
	};
	const auMasquage = (): void => {
		if (document.visibilityState === 'hidden') auDepart();
	};
	fenetre?.addEventListener('pagehide', auDepart);
	document.addEventListener('visibilitychange', auMasquage);

	return {
		repris,
		signaler: differer,
		ecrireMaintenant: ecrire,
		effacer,
		defaire: () => {
			if (minuterie !== null) clearTimeout(minuterie);
			champTitre?.removeEventListener('input', differer);
			fenetre?.removeEventListener('pagehide', auDepart);
			document.removeEventListener('visibilitychange', auMasquage);
		}
	};
}

/** Le stockage de la fenêtre, ou `null` — il peut être refusé sans être absent. */
function stockageDeLaFenetre(fenetre: Window | null): StockageLocal | null {
	if (fenetre === null) return null;
	try {
		return fenetre.localStorage;
	} catch {
		return null;
	}
}

interface Reprise {
	readonly brouillon: Brouillon | null;
	readonly enregistreeLe: string | null;
	readonly restaurer: (brouillon: Brouillon) => void;
	/** Effacer le brouillon ET rendre l'écran vierge — la création. */
	readonly vider: () => void;
	/** Effacer le brouillon, sans toucher à ce qui est ouvert — la modification. */
	readonly ecarter: () => void;
}

/**
 * CE QUE L'ÉCRAN FAIT D'UN BROUILLON RETROUVÉ — et les deux régimes ne se confondent
 * pas.
 *
 * EN CRÉATION, il est repris tout de suite : la zone est vide, il n'y a rien à écraser,
 * et l'avis DIT ce qui vient d'arriver plutôt que de le demander. Le rédacteur peut
 * repartir d'une page vierge d'un clic.
 *
 * EN MODIFICATION, il est PROPOSÉ. La note en base porte peut-être le travail de
 * quelqu'un d'autre, et un brouillon plus ancien qu'elle l'écraserait sans que personne
 * ne l'ait demandé : l'avis le dit, en toutes lettres, et attend.
 */
function proposerLaReprise(formulaire: HTMLFormElement, reprise: Reprise): boolean {
	const brouillon = reprise.brouillon;
	if (brouillon === null) return false;
	/* LA DATE ENTIÈRE, PAS L'HEURE SEULE : un brouillon peut dormir des jours, et
	   « écrit à 18:53 » laisserait croire qu'il date de l'heure précédente. */
	const quand = formaterDateHeureFr(brouillon.le);

	if (reprise.enregistreeLe === null) {
		reprise.restaurer(brouillon);
		poserUnAvis(formulaire, {
			cle: CLE_D_AVIS,
			variante: 'info',
			titre: 'Brouillon local restauré',
			texte: `Cette note n’a jamais été enregistrée. Le texte ci-dessous vient de votre navigateur, où il a été écrit le ${quand}.`,
			actions: [{ libelle: 'Repartir d’une page vierge', faire: reprise.vider }]
		});
		return true;
	}

	const double = brouillonDoubleParLaBase(brouillon, reprise.enregistreeLe);
	poserUnAvis(formulaire, {
		cle: CLE_D_AVIS,
		variante: double ? 'alerte' : 'info',
		titre: 'Un brouillon local de cette note vous attend',
		texte: double
			? `Écrit le ${quand} dans votre navigateur, il est ANTÉRIEUR au dernier enregistrement de la note (${formaterDateHeureFr(reprise.enregistreeLe)}). Le restaurer remplacerait ce qui a été écrit depuis.`
			: `Écrit le ${quand} dans votre navigateur, il n’a jamais été enregistré. La note ouverte ci-dessous est celle de la base.`,
		actions: [
			{ libelle: 'Restaurer le brouillon', faire: () => reprise.restaurer(brouillon) },
			{ libelle: 'Écarter le brouillon', faire: reprise.ecarter }
		]
	});
	/* PROPOSÉ N'EST PAS REPRIS : rien n'a été posé dans l'éditeur tant que
	   l'utilisateur n'a pas cliqué. */
	return false;
}
