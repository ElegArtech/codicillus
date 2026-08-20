/**
 * `/notes/{identifiant}/comparaison` — LE CHARGEUR DE LA COMPARAISON DE DEUX
 * VERSIONS (V-16). `docs/routes.md:142` : « connecté + lecteur », et
 * `docs/routes.md:284` porte le paramètre d'état — `?versions={a}-{b}`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL POINT DE SORTIE POUR LE REFUS — ADR-007, RG-ACC-04
 *
 * La résolution est celle de la note, et il n'y en a pas d'autre :
 * `lireLaNote()` rend une ressource ou `INTROUVABLE`, sans troisième forme, et
 * ce fichier n'a donc qu'UN `error(404, MESSAGE_INTROUVABLE)`. `docs/routes.md:366` range cette
 * adresse dans la famille « `/notes/{id}` et sous-routes » — 404 pour
 * l'anonyme, 404 pour le connecté sans droit, servie au lecteur —, exactement
 * la ligne que la route de la note applique déjà. AUCUNE seconde règle de droit
 * n'est écrite ici, ni aucune seconde décision : la comparaison des versions
 * d'une note est atteignable exactement quand la note l'est.
 *
 * CE QUE CE 404 NE REND PAS ENCORE : V-04 pour l'anonyme et V-26 pour le
 * connecté sans droit (`docs/routes.md` §5.5), qui sont l'objet de `T-035`. Le
 * code de statut, lui, est celui que §5.5 exige, et les deux côtés du couple
 * sont indiscernables — c'est ce que mesure `pnpm test:etancheite`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA BASE NE PORTE PAS, ET QUI N'EST DONC PAS INVENTÉ
 *
 * La table `versions` porte ZÉRO ligne (mesuré le 20 août 2026, 32 notes) :
 * aucune borne d'aucune adresse ne désigne une version existante, et
 * `Comparaison.presentes` le dit borne par borne. Les deux modes rendent
 * l'ensemble vide PARCE QU'IL EST VRAI, et non parce qu'un contenu manquerait
 * d'être transposé — `src/lib/donnees/histoire.ts` porte le raisonnement.
 *
 * `?versions=` ABSENT N'EST PAS UNE ERREUR ET N'EST PAS UN DÉFAUT. Aucune
 * source ne nomme de couple par défaut : `docs/routes.md:284` décrit la forme
 * du paramètre sans en poser un, et le couple du gel est l'état de départ d'une
 * planche de revue. Le chargeur rend donc `bornes: null`, et le vecteur d'état
 * de la vue ne porte alors AUCUN couple — c'est le seul comportement qui
 * n'invente rien. Écart déclaré au rapport de lot.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { bornesDemandees, lireLaComparaison } from '$lib/donnees/histoire';
import { lireSeuils } from '$lib/donnees/lecture';
import { lireLaNote } from '$lib/donnees/note';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const contexte = { maintenant, seuils: await lireSeuils(base) };

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

	const bornes = bornesDemandees(url.searchParams.get('versions'));
	const comparaison = await lireLaComparaison(base, lecture, maintenant, bornes);

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-16 — deux contrôles de planche, et un seul est
		 * une propriété de la REQUÊTE : le couple comparé, que l'adresse porte.
		 * Le second — le repli du journal — est du comportement (ARB-011), et
		 * aucune source ne l'adresse.
		 *
		 * Le vecteur vaut `null` quand l'adresse ne porte pas de couple lisible :
		 * la vue retombe alors sur l'état de départ du gel, et ce lot n'a pas à
		 * décider d'un autre — il n'a surtout pas à en inventer un.
		 */
		vecteur: bornes === null ? null : { cmp: `${String(bornes.a)}-${String(bornes.b)}` },
		notes: lecture.notes,
		/**
		 * L'HISTORIQUE RÉEL, DANS LA FORME QUE LA VUE ACCEPTE. `src/vues/V-16.svelte`
		 * déclare `versions` et `contenuVersions` en propriétés optionnelles depuis
		 * `T-043` ; les deux sont passées, et les deux sont donc celles de la BASE,
		 * jamais celles du jeu de semence — omettre la propriété ferait servir au
		 * PRODUIT le contenu illustratif des maquettes, ce que P-02 proscrit.
		 *
		 * `contenuVersions` EST VIDE, ET IL EST VIDE POUR DEUX RAISONS QUI SE
		 * SUFFISENT CHACUNE : la table ne porte aucune version, et la propriété
		 * attend la forme `BlocDeContenu` des maquettes, que le format canonique
		 * d'ADR-003 ne se transpose pas — T-014 et T-015 l'ont tous deux refusé.
		 */
		versions: { [lecture.note.id]: comparaison.versions },
		contenuVersions: {},
		/**
		 * LA COMPARAISON RÉELLE — les deux modes, calculés sur les documents
		 * canoniques des deux versions, ET QU'AUCUN NŒUD DE V-16 NE PEUT RECEVOIR :
		 * la vue calcule les siens à partir de `contenuVersions`, et ne déclare
		 * aucune propriété qui porterait un alignement. Aucun fichier de
		 * `src/vues/` n'est touché par ce lot — c'est la règle de la vague —, donc
		 * l'écran reste celui du gel. Écart déclaré, chiffré au rapport.
		 */
		comparaison
	};
};
