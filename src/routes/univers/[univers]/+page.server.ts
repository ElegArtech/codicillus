/**
 * LE CHARGEUR DE `/univers/{univers}` — V-10, page d'un univers.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CETTE ROUTE DÉCIDE, ET AVEC QUOI
 *
 * `docs/routes.md:124` fixe son niveau d'accès : « connecté (AU MOINS UN
 * DOMAINE LISIBLE) ». Les deux moitiés sont appliquées, et aucune n'est écrite
 * ici : la session vient de `src/hooks.server.ts` (`locals.identite`), et
 * « lisible » vient de `src/lib/droits/resolution.ts` par `capacites()`.
 * Ce chargeur ne compare aucun rôle et ne remonte aucune arborescence.
 *
 * `docs/routes.md:365`, matrice §5.5, ligne `/univers/…` : **404 V-04** en
 * anonyme, **404 V-26** en connecté sans droit, la page pour les deux autres
 * colonnes. Les deux refus passent par le même point de sortie, `ADR-007`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA VUE REÇOIT DÉSORMAIS — LA PAGE EST BRANCHÉE SUR LA BASE
 *
 * `T-041` avait rendu les sept sources de V-10 PASSABLES sans rien passer : la
 * vue lisait toujours `UNIVERS`, `DOMAINES`, `DETAIL_DOMAINES` et `ACTIVITE`
 * dans `seeds/corpus.ts`, et une note créée à l'instant ne changeait donc ni la
 * description d'un domaine, ni ses pastilles de module, ni le flux d'activité.
 * Les quatre viennent maintenant de la base :
 *
 *   `univers`         `univers`, ordre compris, réduit à ceux qui portent au
 *                     moins un domaine lisible par l'appelant ;
 *   `domaines`        `domaines`, réduits de la même façon — une carte de
 *                     domaine mène à une page, donc à une page atteignable
 *                     (`P-03`) ;
 *   `detailDomaines`  la description de `domaines` et les modules de
 *                     `modules_de_domaine`. C'est ce qui rend `P-04` EFFECTIVE
 *                     sur les pastilles des cartes : elles coïncidaient avec la
 *                     table sans en être pilotées (mesuré par `T-032`) ;
 *   `activite`        les traces que la base porte RÉELLEMENT — voir plus bas.
 *
 * NE SONT TOUJOURS PAS PASSÉS, et c'est déclaré plutôt que comblé :
 * `modules` — le catalogue des six libellés de module, qui n'est pas une donnée
 * d'instance mais une nomenclature, et qu'aucune table ne porte —, `compte` et
 * `instance`, qui appartiennent à la COQUILLE et sont servis de la même façon
 * aux 41 vues : les câbler ici seulement fabriquerait deux régimes.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ACTIVITÉ NE S'INVENTE PAS — CE QUE LA BASE ENREGISTRE, ET RIEN D'AUTRE
 *
 * `P-02` : « aucun indicateur, aucune tendance, aucun compteur ne peut être
 * figé ou simulé ». Le flux d'activité de V-10 servait jusqu'ici les huit
 * événements de `ACTIVITE`, écrits à la main pour la maquette.
 *
 * La base porte trois des cinq types de `TypeDEvenement`, et chacun par une
 * trace horodatée et signée :
 *
 *   `verification` — une ligne de `verifications` (M06.2, écrite par
 *                    `src/lib/donnees/verification.ts`) ;
 *   `edition`      — une ligne de `versions` (RG-M07-02, écrite par
 *                    `src/lib/donnees/edition.ts`) ;
 *   `revision`     — le signalement porté par la note elle-même
 *                    (`revision_demandee`, RG-M06-05).
 *
 * LES DEUX AUTRES — `publication` et `import` — N'ONT AUCUNE TRACE, et ils ne
 * sont donc JAMAIS ÉMIS. Ce n'est pas une lacune de ce chargeur : rien en base
 * ne date une publication ni un import, et en déduire un événement serait
 * exactement la valeur illustrative que `P-02` proscrit. La lacune est celle
 * que `SANS_CONTREPARTIE_EN_BASE` de `src/lib/donnees/accueil.ts` décrit pour
 * V-07 ; ce chargeur en tire la seule conclusion possible — il rend ce qui est
 * enregistré, jamais ce qui manque.
 *
 * LA FENÊTRE EST DE SEPT JOURS, ET ELLE EST LUE DANS LE GEL, non décidée ici :
 * la zone annonce elle-même son absence par « Rien de neuf CETTE SEMAINE »
 * (`mockups/V-10-page-univers.html:1983`), et les huit événements de la maquette
 * s'étalent sur 151 heures au plus — six jours et demi. Les deux se recoupent
 * sur la semaine.
 *
 * UN ÉVÉNEMENT SANS AUTEUR CONNU N'EST PAS RENDU. Les trois jointures sur
 * `comptes` sont INTERNES : `verifications.compte_id` et `notes.revision_par_id`
 * s'annulent quand le compte disparaît, et une ligne de flux s'écrit « QUI a
 * fait QUOI ». Sans le qui, il n'y a pas de ligne à écrire, et lui en inventer
 * un serait la même faute. Le jeu de semence est dans ce cas — ses trente
 * vérifications ne portent aucun compte —, ce qui rend le cas réel et non
 * théorique.
 */
import { basePartagee } from '$lib/base/acces';
import type { Base } from '$lib/base/acces';
import {
	comptes,
	domaines as tableDesDomaines,
	notes as tableDesNotes,
	univers as tableDesUnivers,
	verifications,
	versions
} from '$lib/base/schema';
import { resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	dossiersDuDomaine,
	lireDomainesDeLUnivers,
	lireNotesLisibles,
	lireUniversParIdentifiant,
	ouvrirLAcces,
	peutEcrireDansLUn,
	refuserLAdresse,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import { lireModulesParDomaine, lireUnivers } from '$lib/donnees/lecture';
import { accesALaConsole } from '$lib/donnees/consoles';
import { and, eq, gte, inArray } from 'drizzle-orm';
import type {
	DetailDeDomaine,
	Domaine,
	EvenementDActivite,
	NomDeDomaine,
	Univers
} from '../../../../seeds/corpus';
import type { PageServerLoad } from './$types';

/** Le rangement que l'appelant peut atteindre — univers, domaines, détail. */
interface RangementLisible {
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
	readonly detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
}

/**
 * LE RANGEMENT RÉDUIT À CE QUI EST LISIBLE — et la réduction est un refus de
 * porte fermée, pas une précaution.
 *
 * `P-03` : « une entrée visible est une entrée qui fonctionne ». La carte d'un
 * domaine sur lequel l'appelant n'a aucun droit mènerait à une adresse que
 * cette même route refuse — un lien mort, et un nom de domaine divulgué que
 * `RG-ACC-01` n'autorise pas davantage.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI : `domaineLisible()` interroge
 * `capacites()`, l'implémentation unique.
 *
 * CE CODE EST LE MÊME DANS LE CHARGEUR VOISIN, `[domaine]/+page.server.ts`, et
 * la duplication est SUBIE : `+page.server.ts` n'admet que les exports que
 * SvelteKit valide, un module partagé demanderait un fichier hors du périmètre
 * de ce lot. Les deux copies appellent les mêmes fonctions de lecture — la
 * divergence possible est dans l'assemblage, pas dans les conversions.
 */
async function lireLeRangementLisible(
	base: Base,
	acces: AccesAuRangement
): Promise<RangementLisible> {
	const lignes = await base
		.select({
			id: tableDesDomaines.id,
			nom: tableDesDomaines.nom,
			couleur: tableDesDomaines.couleur,
			description: tableDesDomaines.description,
			universNom: tableDesUnivers.nom
		})
		.from(tableDesDomaines)
		.innerJoin(tableDesUnivers, eq(tableDesDomaines.universId, tableDesUnivers.id))
		.orderBy(tableDesUnivers.ordre, tableDesDomaines.nom);

	const lisibles = lignes.filter((ligne) => domaineLisible(acces, ligne.id));
	const modulesParDomaine = await lireModulesParDomaine(base);

	/* `DetailDeDomaine.modules` est la liste RÉELLE de `modules_de_domaine`. Un
	   domaine sans aucune ligne fille rend une liste vide : la base ne porte pas
	   le plancher « 1 à N » de RG-STR-06 (déclaré par `002_socle.montee.sql`), et
	   supposer un module par défaut serait le combler ici, au mauvais endroit. */
	const detail: Record<string, DetailDeDomaine> = {};
	for (const ligne of lisibles) {
		detail[ligne.nom] = {
			description: ligne.description,
			modules: modulesParDomaine.get(ligne.nom) ?? []
		};
	}

	const tousLesUnivers = await lireUnivers(base);
	return {
		univers: tousLesUnivers.filter((u) => lisibles.some((l) => l.universNom === u.nom)),
		domaines: lisibles.map(
			(l) => ({ nom: l.nom, univers: l.universNom, couleur: l.couleur }) as Domaine
		),
		detailDomaines: detail as Record<NomDeDomaine, DetailDeDomaine>
	};
}

const MILLISECONDES_PAR_JOUR = 86_400_000;
const MILLISECONDES_PAR_HEURE = 3_600_000;
/** La semaine que la zone d'activité annonce elle-même quand elle est vide. */
const FENETRE_DACTIVITE_JOURS = 7;

/**
 * L'ACTIVITÉ DE LA SEMAINE, LUE DANS LES TROIS TRACES QUI EXISTENT.
 *
 * Le filtre de périmètre est DANS la requête, jamais après elle (`ADR-006`) :
 * les trois lectures portent l'ensemble des dossiers lisibles dans leur
 * condition, exactement comme `lireNotesLisibles()`. Un périmètre vide
 * n'interroge pas la base — même raison que là-bas, un ensemble vide passé à une
 * clause d'appartenance ne se rend pas de la même façon selon le dialecte.
 */
async function lireLActiviteRecente(
	base: Base,
	acces: AccesAuRangement,
	maintenant: Date
): Promise<readonly EvenementDActivite[]> {
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];
	const filtre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);
	const depuis = new Date(maintenant.getTime() - FENETRE_DACTIVITE_JOURS * MILLISECONDES_PAR_JOUR);

	const verifiees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: verifications.le })
		.from(verifications)
		.innerJoin(tableDesNotes, eq(verifications.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(verifications.compteId, comptes.id))
		.where(and(gte(verifications.le, depuis), filtre));

	const modifiees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: versions.le })
		.from(versions)
		.innerJoin(tableDesNotes, eq(versions.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(versions.auteurId, comptes.id))
		.where(and(gte(versions.le, depuis), filtre));

	const signalees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: tableDesNotes.revisionLe })
		.from(tableDesNotes)
		.innerJoin(comptes, eq(tableDesNotes.revisionParId, comptes.id))
		.where(
			and(eq(tableDesNotes.revisionDemandee, true), gte(tableDesNotes.revisionLe, depuis), filtre)
		);

	function evenement(
		type: EvenementDActivite['type'],
		ligne: { cible: string; qui: string; le: Date | null }
	): EvenementDActivite | null {
		if (ligne.le === null) return null;
		return {
			type,
			qui: ligne.qui,
			cible: ligne.cible,
			heures: Math.floor((maintenant.getTime() - ligne.le.getTime()) / MILLISECONDES_PAR_HEURE)
		} as EvenementDActivite;
	}

	const evenements = [
		...verifiees.map((l) => evenement('verification', l)),
		...modifiees.map((l) => evenement('edition', l)),
		...signalees.map((l) => evenement('revision', l))
	].filter((e): e is EvenementDActivite => e !== null);

	/* Du plus récent au plus ancien — l'ordre du gel, où `heures` croît le long
	   de la liste. À égalité, l'identifiant de note départage : sans lui, l'ordre
	   dépendrait de celui que le serveur a rendu, donc du plan de requête. */
	return evenements.sort(
		(a, b) => a.heures - b.heures || (a.cible ?? '').localeCompare(b.cible ?? '', 'fr')
	);
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const univers = await lireUniversParIdentifiant(base, params.univers);
	const domainesDeLUnivers = univers === null ? [] : await lireDomainesDeLUnivers(base, univers.id);
	const lisibles = domainesDeLUnivers.filter((d) => domaineLisible(acces, d.id));

	/**
	 * UN UNIVERS QUI NE PORTE AUCUN DOMAINE S’OUVRE — `ARB-065`.
	 *
	 * LA RÉDACTION PRÉCÉDENTE REFUSAIT LES DEUX CAS PAR LA MÊME LIGNE, et elle
	 * l'assumait : « la position "sans domaine" de la planche ne peut pas être
	 * atteinte par cette route, puisque zéro domaine lisible rend 404 ». Le
	 * constat était juste et la conclusion fausse, exactement comme `P-3`.
	 *
	 * CE QUE CELA COÛTAIT, MESURÉ LE 22/08/2026 : sur une instance neuve, on
	 * crée un univers par la console — c'est le premier geste du produit, celui
	 * que `pnpm base:administrateur` annonce en toutes lettres — et cet univers
	 * N'EST OUVRABLE PAR AUCUN CHEMIN. Le rail l'écarte (il ne liste que les
	 * univers porteurs d'un domaine, et c'est la règle du gel lui-même,
	 * `V-07:construireRail`), la console n'y mène pas, et l'adresse rend 404. Le
	 * produit demande de commencer par un geste dont il refuse ensuite le
	 * résultat.
	 *
	 * ET LE GEL DESSINE CET ÉTAT. `mockups/V-10-page-univers.html` porte un bloc
	 * `.vide-univers` COMPLET — sa feuille de style, son titre « Cet univers ne
	 * contient aucun domaine », sa phrase, et un bouton « Créer un domaine dans
	 * {nom} ». `src/vues/V-10.svelte:449` le transcrit déjà. Un état dessiné,
	 * stylé et transcrit, qu'aucune adresse ne peut atteindre, est un défaut.
	 *
	 * LES DEUX REFUS DE `RG-ACC-04` NE BOUGENT PAS, et c'est ce qui rend
	 * l'ouverture sûre : un univers ABSENT rend 404 ; un univers qui porte des
	 * domaines dont AUCUN n'est lisible rend 404, par le même point de sortie et
	 * sans se distinguer du premier (`ADR-007`). Seul s'ouvre l'univers dont la
	 * base dit qu'il ne porte RIEN — il n'y a alors aucun contenu à protéger, et
	 * le refuser ne protège que du vide.
	 *
	 * L'ANONYME RESTE DEHORS. `docs/routes.md` §5.5 le veut en 404 sur toute la
	 * famille `/univers/…`, et ce n'est pas ce point-ci qui l'ouvrirait : un nom
	 * d'univers est une information d'instance.
	 */
	const vide = univers !== null && domainesDeLUnivers.length === 0;
	const ouvrable = locals.identite.type === 'authentifie' && vide;
	const resolution = resoudre(univers, () => lisibles.length > 0 || ouvrable);
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	/* Les dossiers des seuls domaines lisibles : c'est sur eux que se lit la
	   capacité d'écriture, jamais sur l'univers entier. */
	const dossiersLisibles = lisibles.flatMap((d) =>
		dossiersDuDomaine(acces, d.id).map((ligne) => ligne.id)
	);

	const rangement = await lireLeRangementLisible(base, acces);

	/**
	 * L'UNIVERS OUVERT DOIT ÊTRE DANS LA LISTE QU'ON PASSE, MÊME VIDE.
	 *
	 * `lireLeRangementLisible()` réduit les univers à ceux qui portent au moins
	 * un domaine lisible — c'est ce qu'il doit faire, une carte d'univers menant
	 * à une page atteignable (`P-03`). Un univers sans domaine en est donc
	 * absent, et `V-10.svelte:163` cherche `univers.find(…) ?? univers[0]` : sur
	 * une liste vide, `univers[0]` vaut `undefined` et la vue rompt en lisant
	 * `.nom`. Mesuré — 500, pas 404.
	 *
	 * ON N'AJOUTE QUE L'UNIVERS QUE L'ADRESSE NOMME DÉJÀ. Passer la liste
	 * complète réparerait le rendu et ouvrirait au passage les noms des autres
	 * univers à qui n'y a aucun droit ; ici, rien n'est révélé que le segment
	 * d'adresse ne porte.
	 */
	const universOuvert = rangement.univers.some((u) => u.nom === resolution.ressource.nom)
		? rangement.univers
		: [
				...rangement.univers,
				...(await lireUnivers(base)).filter((u) => u.nom === resolution.ressource.nom)
			];

	return {
		/* `uni` porte le NOM, non l'identifiant d'adresse : c'est ce que l'axe
		   « Univers » de la planche emploie (`verif/scenarios/V-10.json`, valeurs
		   `Production` et `Projets`), et ce que la vue cherche dans les univers
		   qu'elle reçoit.

		   `etat` VAUT « vide » QUAND L'UNIVERS NE PORTE AUCUN DOMAINE, et la vue
		   rend alors son bloc `.vide-univers` (`V-10.svelte:449`). C'est la
		   position que la rédaction précédente déclarait inatteignable ; `ARB-065`
		   ci-dessus dit pourquoi elle l'est devenue. Hors de ce cas, `etat` n'est
		   pas posé et vaut « nominal ». */
		vecteur: {
			uni: resolution.ressource.nom,
			/**
			 * SUR UN UNIVERS VIDE, C'EST L'ACCÈS À LA CONSOLE QUI DÉCIDE.
			 *
			 * `peutEcrireDansLUn()` interroge les DOSSIERS lisibles, et un univers
			 * sans domaine n'en a aucun : il rendrait donc toujours « lecture », et
			 * le seul geste de l'état vide — « Créer un domaine dans {nom} »,
			 * `V-10.svelte:457`, rendu sous `si-ecriture` — resterait caché à
			 * l'administrateur lui-même. Ce serait le défaut d'hier : ouvrir la
			 * page et y taire la sortie.
			 *
			 * La question que pose ce bouton n'est PAS « peut-il écrire une note
			 * ici » — il n'y a pas de « ici » — mais « peut-il créer un domaine »,
			 * et un domaine ne se crée qu'à la console (`/console/domaines`).
			 * `accesALaConsole()` est donc le prédicat exact, et c'est le même que
			 * la route de destination appliquera : le bouton ne mène pas à un refus.
			 */
			droits: (vide ? accesALaConsole(locals.identite) : peutEcrireDansLUn(acces, dossiersLisibles))
				? 'ecriture'
				: 'lecture',
			...(vide ? { etat: 'vide' } : {})
		},
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte),
		univers: universOuvert,
		domaines: rangement.domaines,
		detailDomaines: rangement.detailDomaines,
		activite: await lireLActiviteRecente(base, acces, maintenant)
	};
};
