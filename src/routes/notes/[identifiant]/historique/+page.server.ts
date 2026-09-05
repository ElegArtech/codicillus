/**
 * `/notes/{identifiant}/historique` — L'HISTORIQUE D'UNE NOTE A SA PAGE (V-15).
 *
 * IL ÉTAIT UN ÉTAT DE `/notes/{identifiant}` : `?version` nu ouvrait un tiroir
 * superposé à la lecture. Ce n'était pas une page — pas d'adresse propre, pas de
 * fil d'Ariane qui la nomme, rien à mettre en signet, rien à envoyer à un
 * collègue. La référence en fait une page, et c'est celle-ci.
 *
 * TROIS ÉTATS VIVENT DANS L'ADRESSE, ET AUCUN AILLEURS : `?registre=` filtre le
 * fil, `?comparer={n}` ouvre le panneau de comparaison d'une version,
 * `?restaurer={n}` déplie la confirmation de restauration. Tous trois survivent
 * au rechargement, se partagent, et marchent sans une ligne de script.
 *
 * L'ACCÈS EST DÉCIDÉ UNE FOIS, PAR `lireLaNote()` — la même résolution que la
 * lecture, jamais une seconde règle. Un refus et une note absente rendent le
 * même 404 (`RG-ACC-04`).
 */
import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import { comptes, notes, verifications, versions } from '$lib/base/schema';
import { formaterDateFr } from '$lib/dates';
import { comparerEnTexte } from '$lib/donnees/histoire';
import { lireSeuils, lireSeuilsDeVivacite } from '$lib/donnees/lecture';
import { lireLaNote, type Registre } from '$lib/donnees/note';
import { basculesDUneNote, type LigneDeCycles } from '$lib/donnees/vivacite';
import type { EtatDeVivacite } from '$lib/fraicheur';
import { adresseDeNote } from '$lib/rangement/adresses';
import { accord } from '$lib/vocabulaire';
import {
	ancienneteEnClair,
	comparaisonDemandee,
	evenementDeBascule,
	evenementDeCreation,
	evenementDeRevision,
	evenementDeVerification,
	evenementDeVersion,
	evenementDuRegistreOperationnel,
	filFiltre,
	filTrie,
	filtreDemande,
	libelleDeRegistres,
	restaurationDemandee,
	type EvenementConstruit,
	type FiltreDeRegistre
} from './evenements';
import type { PageServerLoad } from './$types';

/** Le refus unique de la famille des adresses de note — jamais un aveu. */
const MESSAGE_INTROUVABLE = 'Note introuvable';

/** Le nombre de lignes montrées de chaque côté d'une comparaison. */
const LIGNES_DE_COMPARAISON = 24;

/** Un onglet du filtre — trois, toujours, et l'actif se lit sur l'adresse. */
export interface OngletDeRegistre {
	readonly cle: FiltreDeRegistre;
	readonly libelle: string;
	readonly actif: boolean;
	readonly adresse: string;
}

/** Les deux colonnes du panneau de comparaison. */
export interface ComparaisonAffichee {
	readonly avant: readonly string[];
	readonly apres: readonly string[];
	/** Rien n'a bougé sur le registre comparé : le panneau le dit au lieu de rester vide. */
	readonly identique: boolean;
	/** Le registre effectivement comparé, en clair. */
	readonly registre: string;
	/** « et 12 lignes de plus », ou la chaîne vide. */
	readonly resteAvant: string;
	readonly resteApres: string;
}

/** Un événement, dans la forme exacte que V-15 rend. */
export interface EvenementAffiche {
	readonly cle: string;
	readonly date: string;
	readonly registre: string;
	/** L'état de vivacité atteint, ou `null` : la vue rend alors un jalon neutre. */
	readonly etat: EtatDeVivacite | null;
	readonly titre: string;
	readonly detail: string;
	/** La pastille mono d'une version, ou `null` : l'événement n'en est pas une. */
	readonly version: string | null;
	readonly adresseComparaison: string;
	readonly libelleComparaison: string;
	readonly comparaison: ComparaisonAffichee | null;
	/** L'adresse qui déplie la confirmation de restauration. Vide : geste non offert. */
	readonly adresseRestauration: string;
	readonly restaurationDepliee: boolean;
	/** Le numéro soumis à `?/restaurer`, en clair pour le champ caché. */
	readonly numero: string;
}

/** L'état vide de l'onglet courant — il nomme le geste qui le remplit. */
export interface EtatVide {
	readonly titre: string;
	readonly texte: string;
	/** L'adresse du geste, ou la chaîne vide : il n'y en a pas à offrir. */
	readonly adresse: string;
	readonly libelle: string;
}

/** L'adresse de la page, avec les seuls paramètres qui ont une valeur. */
function adresseDuFil(
	identifiant: string,
	parametres: { registre?: FiltreDeRegistre; comparer?: number; restaurer?: number }
): string {
	const requete = new URLSearchParams();
	if (parametres.registre !== undefined && parametres.registre !== 'tous') {
		requete.set('registre', parametres.registre);
	}
	if (parametres.comparer !== undefined) requete.set('comparer', String(parametres.comparer));
	if (parametres.restaurer !== undefined) requete.set('restaurer', String(parametres.restaurer));
	const suite = requete.toString();
	return `${adresseDeNote(identifiant)}/historique${suite === '' ? '' : `?${suite}`}`;
}

/** Les lignes d'un côté de la comparaison, bornées, plus ce qui reste à dire. */
function borner(lignes: readonly string[]): { montrees: readonly string[]; reste: string } {
	const montrees = lignes.slice(0, LIGNES_DE_COMPARAISON);
	const reste = lignes.length - montrees.length;
	return {
		montrees,
		reste: reste <= 0 ? '' : `et ${reste} ${accord(reste, 'ligne de plus', 'lignes de plus')}`
	};
}

/**
 * LA COMPARAISON D'UNE VERSION AVEC CELLE QUI LA PRÉCÈDE.
 *
 * Elle porte sur le registre de l'onglet courant quand la version l'a capturé,
 * sur la Référence sinon — le seul registre que toute version capture. La
 * première version n'a pas d'antérieure : tout y est ajout, et c'est vrai.
 *
 * L'ALIGNEMENT EST CELUI DE `comparerEnTexte()`, l'implémentation unique : rien
 * n'est redécoupé ici.
 */
function comparaisonDeLaVersion(
	lignes: readonly LigneDeVersionComplete[],
	numero: number,
	filtre: FiltreDeRegistre
): ComparaisonAffichee | null {
	const version = lignes.find((l) => l.numero === numero);
	if (version === undefined) return null;
	/* Les versions arrivent du plus récent au plus ancien : la précédente est la
	   première dont le numéro est plus petit. */
	const precedente = lignes.find((l) => l.numero < numero);

	const surLOperationnel = filtre === 'operationnel' && version.corpsOperationnel !== null;
	const corpsDe = (l: LigneDeVersionComplete | undefined): unknown =>
		l === undefined ? null : surLOperationnel ? l.corpsOperationnel : l.corpsReference;

	const ecart = comparerEnTexte(corpsDe(precedente), corpsDe(version));
	const avant = borner(ecart.lignes.filter((p) => p.etat === 'retire').map((p) => p.a ?? ''));
	const apres = borner(ecart.lignes.filter((p) => p.etat === 'ajoute').map((p) => p.b ?? ''));

	return {
		avant: avant.montrees,
		apres: apres.montrees,
		identique: ecart.ajouts === 0 && ecart.retraits === 0,
		registre: surLOperationnel ? 'Opérationnel' : 'Référence',
		resteAvant: avant.reste,
		resteApres: apres.reste
	};
}

interface LigneDeVersionComplete {
	readonly numero: number;
	readonly le: Date;
	readonly auteur: string | null;
	readonly resume: string;
	readonly ajout: number;
	readonly retrait: number;
	readonly corpsReference: unknown;
	readonly corpsOperationnel: unknown;
}

/** Les versions de la note, de la plus récente à la plus ancienne. */
async function lireLesVersions(
	base: Base,
	identifiant: string
): Promise<readonly LigneDeVersionComplete[]> {
	return await base
		.select({
			numero: versions.numero,
			le: versions.le,
			auteur: comptes.nom,
			resume: versions.resume,
			ajout: versions.ajout,
			retrait: versions.retrait,
			corpsReference: versions.corpsReference,
			corpsOperationnel: versions.corpsOperationnel
		})
		.from(versions)
		.innerJoin(notes, eq(versions.noteId, notes.id))
		.leftJoin(comptes, eq(versions.auteurId, comptes.id))
		.where(eq(notes.identifiant, identifiant))
		.orderBy(desc(versions.numero));
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const contexte = { maintenant, seuils: await lireSeuils(base) };

	/* LA MÊME RÉSOLUTION QUE LA LECTURE. La Référence est demandée parce que
	   l'historique ne rend aucun corps : le registre de l'adresse ne filtre que
	   le fil, il ne choisit pas un contenu. */
	const resolution = await lireLaNote(base, {
		identifiant: params.identifiant,
		registre: 'reference',
		identite: locals.identite,
		contexte
	});
	if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);
	const lecture = resolution.ressource;

	const [ligne] = await base
		.select({
			cle: notes.id,
			creeLe: notes.creeLe,
			auteur: comptes.nom,
			modifieLe: notes.modifieLe,
			corpsOperationnelModifieLe: notes.corpsOperationnelModifieLe,
			verifieLe: notes.verifieLe,
			verifieLeOperationnel: notes.verifieLeOperationnel,
			validiteReference: notes.validiteReference,
			validiteOperationnel: notes.validiteOperationnel,
			revisionDemandee: notes.revisionDemandee,
			revisionCommentaire: notes.revisionCommentaire,
			revisionLe: notes.revisionLe,
			revisionRegistre: notes.revisionRegistre
		})
		.from(notes)
		.leftJoin(comptes, eq(notes.auteurId, comptes.id))
		.where(eq(notes.identifiant, params.identifiant))
		.limit(1);

	/* La note a disparu entre sa résolution et cette lecture : même refus. */
	if (ligne === undefined) error(404, MESSAGE_INTROUVABLE);

	const [revisionnaire] = ligne.revisionDemandee
		? await base
				.select({ nom: comptes.nom })
				.from(notes)
				.innerJoin(comptes, eq(notes.revisionParId, comptes.id))
				.where(eq(notes.id, ligne.cle))
				.limit(1)
		: [];

	const attestations = await base
		.select({ par: comptes.nom, le: verifications.le, registre: verifications.registre })
		.from(verifications)
		.leftJoin(comptes, eq(verifications.compteId, comptes.id))
		.where(eq(verifications.noteId, ligne.cle))
		.orderBy(desc(verifications.le));

	const lignesDeVersion = await lireLesVersions(base, params.identifiant);

	/* LE DERNIER VÉRIFICATEUR DE CHAQUE REGISTRE — la liste est déjà triée, le
	   premier de chaque registre est le bon. */
	const dernierVerificateur = (registre: Registre): string | null =>
		attestations.find((a) => a.registre === registre)?.par ?? null;

	const ligneDeCycles: LigneDeCycles = {
		modifieLe: ligne.modifieLe,
		corpsOperationnelModifieLe: ligne.corpsOperationnelModifieLe,
		verifieLe: ligne.verifieLe,
		verifieLeOperationnel: ligne.verifieLeOperationnel,
		validiteReference: ligne.validiteReference,
		validiteOperationnel: ligne.validiteOperationnel,
		revisionDemandee: ligne.revisionDemandee,
		revisionRegistre: ligne.revisionRegistre,
		revisionPar: revisionnaire?.nom ?? null,
		verifieParReference: dernierVerificateur('reference'),
		verifieParOperationnel: dernierVerificateur('operationnel')
	};

	const seuils = await lireSeuilsDeVivacite(base);

	/* LES BASCULES SONT DÉRIVÉES, JAMAIS STOCKÉES — `basculesDUneNote()` est leur
	   unique producteur, et cette route n'en calcule aucune. */
	const bascules = basculesDUneNote(ligneDeCycles, maintenant, seuils);

	const validiteDe = (registre: Registre): number =>
		registre === 'operationnel' ? ligne.validiteOperationnel : ligne.validiteReference;

	/**
	 * LE GESTE QUI A OUVERT LE REGISTRE OPÉRATIONNEL — UNE LIGNE, PAS DEUX.
	 *
	 * Créer l'Opérationnel écrit son corps ET le vérifie dans le même geste. La
	 * base garde les deux faits dans deux endroits : `corps_operationnel_modifie_le`
	 * et une ligne de `verifications`. Quand la plus ANCIENNE de ces vérifications
	 * tombe le même jour civil que l'écriture du corps, c'est le même geste, et le
	 * fil le dit d'une seule ligne. Sinon les deux se disent séparément : le corps a
	 * été réécrit après coup, et le taire serait mentir.
	 */
	const jourCivil = (quand: Date): string => quand.toISOString().slice(0, 10);

	/**
	 * LA PREMIÈRE VERSION EST LA CRÉATION — quand elle tombe le jour même. Créer
	 * une note l'enregistre, et l'enregistrement capture sa version 1 : deux
	 * lignes pour un seul geste. Le fil n'en écrit qu'une, et elle porte la
	 * pastille de version, donc la comparaison. Une note créée avant que les
	 * versions ne soient tenues garde ses deux lignes, parce qu'elles sont vraies.
	 */
	const versionInitiale = lignesDeVersion.find(
		(v) => v.numero === 1 && jourCivil(v.le) === jourCivil(ligne.creeLe)
	);

	const attestationsOperationnelles = attestations.filter((a) => a.registre === 'operationnel');
	const premiereOperationnelle =
		attestationsOperationnelles[attestationsOperationnelles.length - 1];
	const memeGeste =
		ligne.corpsOperationnelModifieLe !== null &&
		premiereOperationnelle !== undefined &&
		jourCivil(premiereOperationnelle.le) === jourCivil(ligne.corpsOperationnelModifieLe);

	const rangement = { univers: lecture.note.univers, domaine: lecture.note.domaine };

	const construits: EvenementConstruit[] = [
		...(versionInitiale === undefined
			? [
					evenementDeCreation({
						creeLe: ligne.creeLe,
						auteur: ligne.auteur,
						...rangement
					})
				]
			: []),
		...lignesDeVersion.map((v) =>
			evenementDeVersion({
				numero: v.numero,
				le: v.le,
				auteur: v.auteur,
				resume: v.resume,
				ajout: v.ajout,
				retrait: v.retrait,
				aUnOperationnel: v.corpsOperationnel !== null && v.corpsOperationnel !== undefined,
				...(v === versionInitiale ? { creationDeLaNote: rangement } : {})
			})
		),
		...attestations.map((a) =>
			evenementDeVerification({
				le: a.le,
				par: a.par,
				registre: a.registre,
				validite: validiteDe(a.registre),
				ouvreLeRegistre: memeGeste && a === premiereOperationnelle
			})
		),
		...bascules.map(evenementDeBascule)
	];

	if (ligne.corpsOperationnelModifieLe !== null && !memeGeste) {
		construits.push(
			evenementDuRegistreOperationnel({
				le: ligne.corpsOperationnelModifieLe,
				validite: ligne.validiteOperationnel
			})
		);
	}

	if (ligne.revisionDemandee && ligne.revisionLe !== null) {
		construits.push(
			evenementDeRevision({
				le: ligne.revisionLe,
				par: revisionnaire?.nom ?? null,
				registre: ligne.revisionRegistre ?? 'reference',
				commentaire: ligne.revisionCommentaire
			})
		);
	}

	const fil = filTrie(construits);
	const filtre = filtreDemande(url.searchParams.get('registre'));
	const montres = filFiltre(fil, filtre);

	const comparee = comparaisonDemandee(url.searchParams.get('comparer'));
	const restauree = restaurationDemandee(url.searchParams.get('restaurer'));
	const comparaison =
		comparee === null ? null : comparaisonDeLaVersion(lignesDeVersion, comparee, filtre);

	/* `P-09` — le geste de restauration n'est PRÉPARÉ que pour qui peut écrire.
	   Sans droit, ni lien, ni formulaire, ni champ caché n'entrent dans la page. */
	const ecriture = lecture.capacites.ecrireDesNotes;

	const onglets: readonly OngletDeRegistre[] = (
		[
			{ cle: 'tous', libelle: 'Tous' },
			{ cle: 'reference', libelle: 'Référence' },
			{ cle: 'operationnel', libelle: 'Opérationnel' }
		] as const
	).map((o) => ({
		cle: o.cle,
		libelle: o.libelle,
		actif: o.cle === filtre,
		adresse: adresseDuFil(params.identifiant, { registre: o.cle })
	}));

	const evenements: readonly EvenementAffiche[] = montres.map((e, rang) => {
		const estVersion = e.numero !== null;
		const ouverte = estVersion && e.numero === comparee;
		const depliee = estVersion && e.numero === restauree;
		return {
			cle: `${e.quand.getTime()}-${rang}`,
			date: formaterDateFr(e.quand),
			registre: libelleDeRegistres(e.registres),
			etat: e.etat,
			titre: e.titre,
			detail: e.detail,
			version: e.numero === null ? null : `v${e.numero}`,
			adresseComparaison:
				e.numero === null
					? ''
					: ouverte
						? adresseDuFil(params.identifiant, { registre: filtre })
						: adresseDuFil(params.identifiant, { registre: filtre, comparer: e.numero }),
			libelleComparaison: ouverte
				? 'Masquer la comparaison'
				: 'Comparer avec la version précédente',
			comparaison: ouverte ? comparaison : null,
			adresseRestauration:
				!ecriture || e.numero === null
					? ''
					: depliee
						? adresseDuFil(params.identifiant, { registre: filtre })
						: adresseDuFil(params.identifiant, {
								registre: filtre,
								...(comparee === null ? {} : { comparer: comparee }),
								restaurer: e.numero
							}),
			restaurationDepliee: depliee,
			numero: e.numero === null ? '' : String(e.numero)
		};
	});

	/**
	 * L'ÉTAT VIDE NOMME LE GESTE QUI LE REMPLIT. Le fil complet n'est jamais vide
	 * — une note porte toujours sa création —, mais un onglet peut l'être : une
	 * note sans registre Opérationnel n'a aucun événement à y montrer.
	 */
	const sansOperationnel = ligne.corpsOperationnelModifieLe === null;
	const vide: EtatVide | null =
		evenements.length > 0
			? null
			: filtre === 'operationnel' && sansOperationnel
				? {
						titre: 'Cette note n’a pas de registre Opérationnel',
						texte:
							'Le registre Opérationnel porte le pas-à-pas, et il vit son propre cycle de vivacité. ' +
							'Créez-le : sa création ouvrira ce fil.',
						adresse: `${adresseDeNote(params.identifiant)}/operationnel`,
						libelle: 'Créer l’Opérationnel'
					}
				: {
						titre: 'Aucun événement sur ce registre',
						texte:
							'Rien n’a encore été enregistré ici. Vérifiez la note ou modifiez son contenu : ' +
							'chaque geste laisse une ligne dans ce fil.',
						adresse: adresseDeNote(params.identifiant),
						libelle: 'Ouvrir la note'
					};

	return {
		note: lecture.note,
		notes: lecture.notes,
		adresseDeLaNote: adresseDeNote(params.identifiant),
		/* L'en-tête de la référence porte « Dernière modification / il y a 4 jours
		   par X ». L'auteur nommé est celui de la dernière VERSION quand il y en a
		   une, celui de la note sinon — jamais un nom deviné. */
		derniereModification: `${ancienneteEnClair(ligne.modifieLe, maintenant)}${
			(lignesDeVersion[0]?.auteur ?? ligne.auteur) === null
				? ''
				: ` par ${lignesDeVersion[0]?.auteur ?? ligne.auteur}`
		}`,
		onglets,
		evenements,
		vide,
		ecriture
	};
};
