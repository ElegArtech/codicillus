/**
 * `/notes/{identifiant}/comparaison` — LE CHARGEUR DE LA COMPARAISON DE DEUX
 * VERSIONS (V-16). « Connecté + lecteur », et `?versions={a}-{b}` porte l'état.
 *
 * UN SEUL POINT DE SORTIE POUR LE REFUS — ADR-007, RG-ACC-04 : `lireLaNote()` rend
 * une ressource ou `INTROUVABLE`, et le chargeur n'a donc qu'UN `error(404, …)`.
 * AUCUNE seconde règle de droit n'est écrite ici — la comparaison des versions d'une
 * note est atteignable exactement quand la note l'est.
 *
 * `contenuVersions` EST PASSÉ VIDE, ET C'EST DÉLIBÉRÉ : la propriété porte le contenu
 * d'exemple des maquettes, et l'omettre le ferait servir au PRODUIT.
 *
 * LE COUPLE PAR DÉFAUT EST UNE DÉCISION DÉCLARÉE, aucune source n'en nommant un :
 * deux versions ou plus, les deux plus récentes sont comparées ; une seule, les deux
 * bornes la désignent et le gel rend « Il n'y a rien à comparer » ; aucune, le
 * vecteur reste `null` et la vue retombe sur son état de départ.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	bornesDemandees,
	lireLHistoire,
	lireLaComparaison,
	rangeesDAffichage,
	versionDemandee,
	type Bornes
} from '$lib/donnees/histoire';
import { enregistrerLaNote } from '$lib/donnees/edition';
import { lireSeuils } from '$lib/donnees/lecture';
import { lireLaNote } from '$lib/donnees/note';
import { adresseDeNote } from '$lib/rangement/adresses';
import { moteurPartage } from '$lib/recherche/acces';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { Version } from '../../../../../seeds/corpus';

/**
 * LE COUPLE QUE L'ADRESSE NE PORTE PAS. La liste est ordonnée de la plus récente
 * à la plus ancienne — c'est l'ordre de l'index —, donc la borne d'origine est la
 * SECONDE de la liste et la borne comparée la première.
 */
function coupleParDefaut(versions: readonly Version[]): Bornes | null {
	const [derniere, precedente] = versions;
	if (derniere === undefined) return null;
	if (precedente === undefined) return { a: derniere.n, b: derniere.n };
	return { a: precedente.n, b: derniere.n };
}

/** L'instant est pris UNE FOIS par requête : deux lectures d'horloge dateraient
 *  la fraîcheur et le geste de deux instants différents. */
async function contexteDeLaRequete() {
	const base = basePartagee();
	const maintenant = new Date();
	return { base, maintenant, contexte: { maintenant, seuils: await lireSeuils(base) } };
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const { base, maintenant, contexte } = await contexteDeLaRequete();

	/* LA RÉSOLUTION EST CELLE DE LA NOTE. Le registre Référence est celui que
	   §4.1 nomme défaut ; il ne décide de rien ici, la comparaison ayant son
	   propre registre, et il n'existe pas d'adresse de comparaison qui en
	   nommerait un autre. */
	const resolution = await lireLaNote(base, {
		identifiant: params.identifiant,
		registre: 'reference',
		identite: locals.identite,
		contexte
	});

	if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);
	const lecture = resolution.ressource;

	/* L'HISTORIQUE EST LU AVANT LA COMPARAISON, et pour une seule raison : il
	   décide du couple quand l'adresse n'en porte pas. L'accès est déjà résolu —
	   les deux lectures prennent la MÊME `LectureDeNote`, il n'existe donc pas
	   deux décisions d'accès à cette adresse. */
	const histoire = await lireLHistoire(base, lecture, maintenant, null);
	const bornes =
		bornesDemandees(url.searchParams.get('versions')) ?? coupleParDefaut(histoire.versions);
	const comparaison = await lireLaComparaison(base, lecture, maintenant, bornes);

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-16 — le couple comparé. Le second contrôle de la
		 * planche, le repli du journal, est du comportement (ARB-011) et n'appartient
		 * pas à l'adresse.
		 */
		vecteur: bornes === null ? null : { cmp: `${String(bornes.a)}-${String(bornes.b)}` },
		notes: lecture.notes,
		note: lecture.note,
		versions: { [lecture.note.id]: comparaison.versions },
		contenuVersions: {},
		comparaison: {
			lignes: comparaison.texte.lignes,
			rangees: rangeesDAffichage(comparaison.visuel)
		}
	};
};

export const actions: Actions = {
	/**
	 * RESTAURER UNE VERSION — `UC-M07-04`, déclenché depuis l'historique.
	 *
	 * ELLE N'ÉCRIT PAS ELLE-MÊME, ET C'EST TOUT LE POINT : le corps capturé est repassé par
	 * `enregistrerLaNote()`, la voie unique d'écriture d'une note, et la restauration
	 * hérite donc, sans les recopier, de la résolution des droits (`RG-M05-09`), du refus
	 * d'un document mal formé (`ADR-003`), de la capture d'une version (`RG-M07-01`) et de
	 * l'entretien de l'index. Une seconde voie divergerait, et la divergence ne se verrait
	 * qu'à l'historique. L'ÉTAT COURANT N'EST PAS PERDU : chaque enregistrement capture
	 * l'état qu'il produit.
	 *
	 * LE TITRE N'EST PAS RESTAURÉ : le dialogue dit « le CONTENU de la version X remplacera
	 * le contenu actuel ». La version capture pourtant le titre (`RG-M07-02`) — la capture
	 * dit comment la note s'appelait, elle ne demande pas qu'on la renomme.
	 *
	 * LE REFUS EST LE MÊME `404` QUE PARTOUT DANS CETTE FAMILLE (`RG-ACC-04`).
	 */
	restaurer: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDeLaRequete();
		const resolution = await lireLaNote(base, {
			identifiant: params.identifiant,
			registre: 'reference',
			identite: locals.identite,
			contexte
		});
		if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);

		/* LE NUMÉRO EST LU PAR LA LECTURE DE `?version=`, jamais par une seconde :
		   une version se désigne d'une seule façon dans ce produit. */
		const soumis = (await request.formData()).get('version');
		const numero = versionDemandee(typeof soumis === 'string' ? soumis : null);
		const histoire = await lireLHistoire(base, resolution.ressource, maintenant, numero);
		if (histoire.affichee === null) {
			/* LA FORME EST REFUSÉE APRÈS LE DROIT, jamais avant : une réponse qui
			   distinguerait « ce numéro ne désigne aucune version » de « adresse
			   inconnue » révélerait l'existence de la note à qui n'y a pas droit. La
			   résolution ci-dessus a déjà tranché. */
			return fail(400, { motif: 'aucune version ne porte ce numéro' });
		}

		const issue = await enregistrerLaNote(base, moteurPartage(), {
			identifiant: params.identifiant,
			registre: 'reference',
			identite: locals.identite,
			contexte,
			maintenant,
			modification: { corps: { saisi: histoire.affichee.reference } }
		});
		if (!issue.trouve) error(404, MESSAGE_INTROUVABLE);

		/* `redirect()` LÈVE : l'appel est la dernière ligne, tout ce qui la suivrait
		   serait mort. La note est relue à son adresse, restaurée. */
		redirect(303, adresseDeNote(params.identifiant));
	}
};
