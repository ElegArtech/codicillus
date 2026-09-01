/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}/dossiers/{chemin…}` — V-13.
 *
 * TROIS REPRÉSENTATIONS DU MÊME CHEMIN, ET IL NE FAUT PAS LES CONFONDRE : en base une
 * ligne, son parent, sa profondeur (`RG-STR-04`, dix) ; dans l'adresse
 * `exploitation/sauvegardes`, identifiants lisibles séparés de barres obliques ; à
 * l'écran `Exploitation › Sauvegardes`, noms et séparateur du gel dont les deux espaces
 * font partie. `src/lib/donnees/rangement.ts` traduit l'une dans l'autre.
 *
 * L'ARBORESCENCE SERVIE EST CELLE DE LA BASE, PLUS CELLE DES NOTES — UN DOSSIER VIDE
 * N'APPARAÎT DANS AUCUNE NOTE —, ET ELLE EST RABATTUE SUR LE PÉRIMÈTRE : `ADR-006` veut
 * le filtre dans la requête plutôt qu'après elle, et un dossier hors périmètre n'a pas à
 * être nommé, pas même comme destination impossible. LE DROIT EFFECTIF EST CELUI DE LA
 * RÉSOLUTION UNIQUE, transmis TEL QUEL : un droit posé sur la racine d'un domaine
 * gouverne tout son sous-arbre (`RG-DRO-01`, `RG-DRO-05`), et le module `dossiers` est
 * EXIGÉ (`RG-STR-06`).
 *
 * QUATRE ACTIONS, ET LEURS DROITS NE SONT PAS LES MÊMES : `CDC` §2.3 réserve la création
 * de sous-dossiers, le renommage, le déplacement, la suppression et la gestion des
 * droits au GESTIONNAIRE, l'écriture de notes au RÉDACTEUR. Aucune de ces distinctions
 * n'est écrite ici — `capacites()` porte la table, et le refus est le `404` de partout
 * ailleurs. « NOUVELLE NOTE » n'est pas une action mais une navigation.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { accesALaConsole } from '$lib/donnees/consoles';
import { dossiers } from '$lib/base/schema';
import { moteurPartage } from '$lib/recherche/acces';
import { adresseDeDomaine, adresseDeDossier, identifiantLisible } from '$lib/rangement/adresses';
import {
	capacites,
	contourneLesDroitsDeDossier,
	perimetreContient,
	resoudre
} from '$lib/droits/resolution';
import {
	cheminAffiche,
	dossiersDuDomaine,
	droitEffectif,
	lireDomaineParIdentifiants,
	lireModulesDuDomaine,
	lireNotesLisibles,
	moduleActif,
	ouvrirLAcces,
	refuserLAdresse,
	resoudreLeChemin,
	segmentsAffiches,
	MESSAGE_INTROUVABLE,
	PROFONDEUR_MAX,
	type AccesAuRangement,
	type DomaineResolu,
	type LigneDeDossier
} from '$lib/donnees/rangement';
import type { DroitDeDossier } from '$lib/droits/resolution';
import {
	accorderUnDroitDeDossier,
	changerUnDroitDeDossier,
	libelleDOrigine,
	lireLesDroitsDUnDossier,
	motifDeRefusDeDestination,
	niveauDeDroitDepuisLaSaisie,
	nomDejaPris,
	origineDUnDroit,
	renommerOuDeplacerUnDossier,
	retirerUnDroitDeDossier,
	supprimerUnDossier,
	tropProfond,
	NOM_MANQUANT,
	type DemandeDeDroit,
	type DroitEcrit,
	type RefusDEcriture
} from '$lib/donnees/dossiers-ecriture';
import type { Base } from '$lib/base/acces';
import { ancienneteDeModification } from '$lib/donnees/lecture';
import { NOM_DU_COMPTE_VISE, nomDuNiveau } from './champs-de-droits';
import type { NomDeDomaine } from '../../../../../../../seeds/corpus';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

/* ═══════════════════════════════════ Le contexte, résolu une fois ═══════ */

interface ContexteDeDossier {
	readonly acces: AccesAuRangement;
	readonly domaine: DomaineResolu;
	readonly lignes: readonly LigneDeDossier[];
	readonly dossier: LigneDeDossier;
	/** Le droit effectif sur ce dossier — JAMAIS nul : sans lui, on a refusé. */
	readonly droit: DroitDeDossier;
}

/**
 * OUVRE L'ACCÈS, RÉSOUT LE DOMAINE ET LE DOSSIER, OU REFUSE — un seul chemin pour
 * le chargeur et pour les quatre actions. L'écrire une fois garantit qu'une
 * action ne puisse pas franchir une porte que la lecture ferme : module exigé,
 * lecture du dossier et résolution du chemin sont les mêmes pour les cinq entrées.
 */
async function ouvrirLeDossier(
	params: { univers: string; domaine: string; chemin: string },
	identite: AccesAuRangement['identite'],
	adresse: string,
	/**
	 * LE CHEMIN VIDE EST-IL ADMIS ? Le chargeur seul l'admet, et seulement pour
	 * REDIRIGER vers la forme nommée : aucune des quatre actions n'est servie à cette
	 * adresse, sans quoi elles auraient deux adresses au lieu d'une. Le paramètre ne
	 * peut que RESSERRER — le contrôle de droit reste le même pour les cinq.
	 */
	admetLAdresseNue: boolean = false
): Promise<ContexteDeDossier> {
	const base = basePartagee();
	const acces = await ouvrirLAcces(base, identite, new Date());

	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	const modules =
		domaine === null ? new Set<never>() : await lireModulesDuDomaine(base, domaine.id);

	/* Les segments vides sont écartés : `/dossiers/` et `/dossiers//a` ne sont pas
	   des chemins plus profonds, ce sont les mêmes chemins écrits autrement. */
	const segments = params.chemin.split('/').filter((s) => s !== '');
	const lignes = domaine === null ? [] : dossiersDuDomaine(acces, domaine.id);

	/**
	 * LA RACINE A UNE ADRESSE : celle qui porte son seul nom.
	 *
	 * `resoudreLeChemin()` descend depuis la racine SANS la consommer — elle ne peut
	 * donc désigner qu'un descendant, et la racine n'avait aucune page. Sur un
	 * domaine neuf, `?/creerSousDossier` n'était atteignable de NULLE PART.
	 *
	 * UN SEUL SEGMENT, ET SEULEMENT SEUL : accepter le nom de la racine en tête d'un
	 * chemin plus long donnerait deux adresses au même dossier.
	 *
	 * ET LE CHEMIN VIDE Y MÈNE, POUR LE CHARGEUR SEUL. `adresseDeDossier(u, d, [])`
	 * compose `…/dossiers` nu, que la page d'une note POSÉE DANS LA RACINE compose.
	 * Le chargeur l'accepte pour REDIRIGER ; les quatre actions continuent de
	 * refuser.
	 */
	const racine = lignes.find((d) => d.parentId === null) ?? null;
	const viseLaRacine =
		racine !== null &&
		((admetLAdresseNue && segments.length === 0) ||
			(segments.length === 1 && segments[0] === identifiantLisible(racine.nom)));
	const dossier =
		domaine === null ? null : viseLaRacine ? racine : resoudreLeChemin(lignes, segments);

	/* Le droit est résolu AVANT le verdict, et par l'implémentation unique. La
	   fermeture par défaut de `RG-DRO-02` répond d'elle-même quand le dossier est
	   introuvable : `droitEffectif()` rend `null`, et `capacites(null)` met toutes
	   les capacités à faux. */
	const droit = dossier === null ? null : droitEffectif(acces, dossier.id);

	const resolution = resoudre(
		dossier,
		() => moduleActif(modules, 'dossiers') && capacites(droit).lire
	);
	if (!resolution.trouve || droit === null || domaine === null) refuserLAdresse(adresse);

	return { acces, domaine, lignes, dossier: resolution.ressource, droit };
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const { acces, domaine, lignes, dossier, droit } = await ouvrirLeDossier(
		params,
		locals.identite,
		url.pathname,
		/* Le chargeur, et lui seul, admet l'adresse nue — pour la rediriger. */
		true
	);

	/* LA FORME CANONIQUE DE LA RACINE PORTE SON NOM. L'adresse nue y mène plutôt
	   que d'être servie en double : chemin affiché, redirections d'après-création
	   et tuiles de sous-dossier composent tous la forme nommée. La redirection est
	   permanente — l'adresse nue ne changera plus de sens.

	   LES DEUX PREMIERS SEGMENTS SONT LES IDENTIFIANTS PERSISTÉS, jamais les noms
	   slugifiés : ce sont ceux sur lesquels l'adresse vient d'être résolue, et ils
	   ne suivent pas les renommages (`RG-M12-11`). Composée sur les noms, chacune
	   des quatre redirections de ce fichier menait en 404 dès qu'un univers ou un
	   domaine avait été renommé. */
	if (dossier.parentId === null && params.chemin.split('/').every((s) => s === '')) {
		redirect(308, adresseDeDossier(domaine.universIdentifiant, domaine.identifiant, [dossier.nom]));
	}

	/**
	 * LES DESTINATIONS — tout le domaine, rabattu sur le périmètre, chacune avec
	 * son motif de refus. Le motif est calculé ICI parce qu'il dépend de la
	 * profondeur RÉELLE des lignes, que la vue n'a pas.
	 */
	const visibles = lignes.filter((d) => perimetreContient(acces.perimetre, d.id));
	const destinations = [...visibles]
		/* L'ORDRE EST CELUI DE LA FRATRIE, jamais l'alphabet : `dossiers.position`
		   est la seule règle d'ordre du produit. Le tri par profondeur d'abord
		   garantit qu'un parent est rencontré avant ses enfants, ce dont la vue a
		   besoin pour bâtir son arborescence en une passe. */
		.sort((a, b) => a.profondeur - b.profondeur || (a.position ?? 0) - (b.position ?? 0))
		.map((d) => ({
			id: d.id,
			segments: segmentsAffiches(acces.dossiers, d.id),
			refus: motifDeRefusDeDestination(lignes, dossier.id, d.id)
		}));

	/* L'INSTANT DE RÉFÉRENCE EST PRIS UNE FOIS, et c'est celui de l'accès : la
	   fraîcheur de chaque note se compte déjà sur lui, et l'ancienneté de
	   modification se compte sur la même ligne de l'écran. Un second `new Date()`
	   pourrait tomber de l'autre côté d'une frontière de jour. */
	const maintenant = acces.contexte.maintenant;
	const notesLisibles = await lireNotesLisibles(base, acces.perimetre, acces.contexte);

	return {
		vecteur: {
			/* `dos` porte le chemin AFFICHÉ, séparateur du gel compris : ce que l'axe
			   « Dossier » de la planche emploie, et ce que `segmentsDeDossier()` sait
			   relire. La remontée se fait sur l'arborescence entière : le chemin d'un
			   dossier passe par ses ancêtres, dans le périmètre ou non — c'est le
			   chemin de la ressource, pas un droit. */
			dos: cheminAffiche(segmentsAffiches(acces.dossiers, dossier.id)),
			dr: droit
		},
		notes: notesLisibles,
		/**
		 * L'ANCIENNETÉ DE MODIFICATION DE CHAQUE NOTE — `notes.modifie_le`. Sans elle,
		 * la vue retombait sur la table du jeu de démonstration, dont les clés sont
		 * des identifiants de semence : chaque ligne annonçait l'âge d'une autre note.
		 */
		modifications: await ancienneteDeModification(base, notesLisibles, maintenant),
		domaine: domaine.nom as NomDeDomaine,
		/* L'univers porteur, pour que la vue ne le devine pas : elle le cherchait
		   dans le jeu de démonstration et retombait sur « Production ». */
		universDuDomaine: domaine.universNom,
		rangement: {
			destinations,
			dossierId: dossier.id,
			/* LA RACINE A UNE PAGE, ET ELLE N'A PAS DE PARENT. La chaîne vide dit cette
			   absence, et le sélecteur de destination du dialogue de déplacement ne
			   coche alors aucune ligne. Ce dialogue n'est de toute façon pas rendu sur
			   la racine : les deux écritures y refusent muettement. */
			parentId: dossier.parentId ?? ''
		},
		/**
		 * LES DROITS DU DOSSIER — servis AU SEUL GESTIONNAIRE, et `null` sinon.
		 *
		 * `ADR-006` veut le filtre au plus près de la donnée : les lire pour un
		 * lecteur, quitte à ce que la vue n'en fasse rien, mettrait les droits du
		 * dossier dans la charge utile de tout le monde. La capacité qui gouverne le
		 * GESTE gouverne donc sa LECTURE.
		 *
		 * MAIS CETTE CAPACITÉ EST LOCALE, ET ELLE NE SUFFIT PAS À TOUT SERVIR : elle
		 * s'obtient sur UN dossier. L'annuaire des comptes de l'instance, lui, est
		 * réservé au rôle `administrateur` (`docs/routes.md:167`). Les deux périmètres
		 * voyagent séparément jusqu'à la requête, qui les rabat elle-même — le champ
		 * `annuaireLisible`.
		 *
		 * ET LE SECOND PÉRIMÈTRE N'EST PAS ÉCRIT ICI : c'est `accesALaConsole()`, le
		 * prédicat que les douze écrans de console consultent déjà. Une porte définie
		 * deux fois s'ouvre un jour d'un seul côté.
		 */
		droits: capacites(droit).gererLesDroits
			? await lireLesDroitsDUnDossier(base, {
					dossierId: dossier.id,
					lignes: acces.dossiers,
					nomDuDomaine: domaine.nom,
					appelantId: locals.identite.type === 'authentifie' ? locals.identite.compteId : null,
					annuaireLisible: accesALaConsole(locals.identite),
					appelantContourne: contourneLesDroitsDeDossier(locals.identite)
				})
			: null,
		origineDuDroit: libelleDOrigine(
			locals.identite.type === 'authentifie'
				? origineDUnDroit(
						acces.index,
						acces.dossiers,
						dossier.id,
						locals.identite.compteId,
						domaine.nom
					)
				: null
		)
	};
};

/* ═══════════════════════════════════ Les trois gestes de droits ═════════ */

type EcritureDeDroit = (
	base: Base,
	demande: DemandeDeDroit
) => Promise<DroitEcrit | RefusDEcriture>;

/**
 * LE PRÉAMBULE DES TROIS GESTES DE DROITS — un seul chemin, une seule traduction.
 * Rien ici ne compare un droit ni ne lit `droits_de_dossier` : `gererLesDroits` est
 * éprouvé dans le module de données, à l'endroit où l'écriture a lieu, et le refus
 * muet devient le `404` de partout ailleurs (`RG-ACC-04`).
 *
 * LE NIVEAU SE LIT SOUS UN NOM DÉRIVÉ DU COMPTE VISÉ — `champs-de-droits.ts` dit
 * pourquoi. Absent ou inconnu il vaut `null`, que le module refuse : se tromper de
 * défaut ici serait accorder un droit. ET SON PÉRIMÈTRE D'ANNUAIRE AVEC —
 * `annuaireLisible`, le même champ qu'au chargeur : une garde d'écran que l'action
 * ne tient pas n'est pas une garde.
 *
 * LE COMPTE DE L'APPELANT VOYAGE JUSQU'AU MODULE, parce que c'est lui qui refuse
 * l'auto-retrait de gestion — et son RÉGIME avec lui : un administrateur tient sa
 * gestion de `RG-DRO-03`, sans ligne dans la table.
 *
 * LE RETOUR EST UN `303` VERS LA MÊME ADRESSE : la liste des droits est relue par
 * le chargeur, et un rechargement ne rejoue pas l'écriture.
 */
async function reponseDeDroit(
	evenement: RequestEvent,
	ecrire: EcritureDeDroit
): Promise<ReturnType<typeof fail>> {
	const { acces, dossier } = await ouvrirLeDossier(
		evenement.params,
		evenement.locals.identite,
		evenement.url.pathname
	);
	const champs = await evenement.request.formData();
	const identifiantDuCompte = String(champs.get(NOM_DU_COMPTE_VISE) ?? '');

	const fait = await ecrire(basePartagee(), {
		dossierId: dossier.id,
		identifiantDuCompte,
		niveau: niveauDeDroitDepuisLaSaisie(champs.get(nomDuNiveau(identifiantDuCompte))),
		droit: (id) => droitEffectif(acces, id),
		appelantId:
			evenement.locals.identite.type === 'authentifie' ? evenement.locals.identite.compteId : null,
		appelantContourne: contourneLesDroitsDeDossier(evenement.locals.identite),
		annuaireLisible: accesALaConsole(evenement.locals.identite)
	});
	if (!fait.fait) {
		if (fait.message === '') error(404, MESSAGE_INTROUVABLE);
		return fail(422, { droits: fait.message });
	}
	redirect(303, evenement.url.pathname);
}

/* ═══════════════════════════════════ Les quatre gestes du gel ═══════════ */

/**
 * Les gestes de `.actions-dossier` (`V-13:1156`-`1165`), et ce que chacun exige.
 *
 *   `#a-note`         navigation vers `/notes/nouvelle` — rédacteur, hors d'ici
 *   `#a-sousdossier`  `creerSousDossier`      — `creerDesSousDossiers`
 *   `#a-renommer`     `renommerOuDeplacer`    — `administrerLeDossier`
 *   `#a-droits`       `accorderLeDroit`, `changerLeDroit`, `retirerLeDroit`
 *                                             — `gererLesDroits`
 *   `#a-supprimer`    `supprimer`             — `administrerLeDossier`
 *
 * AUCUNE ACTION PAR DÉFAUT : SvelteKit refuse qu'une action anonyme cohabite avec
 * des actions nommées, et le refus est un `500`. Les six sont nommées.
 */
export const actions: Actions = {
	/**
	 * `RG-STR-03` — CRÉER UN SOUS-DOSSIER. Le parent est le dossier de l'adresse.
	 * « Créer des sous-dossiers » est la troisième colonne de `CDC` §2.3, et seul le
	 * GESTIONNAIRE la porte ; le refus est le même `404` que partout dans cette
	 * famille. LA PROFONDEUR EST PLAFONNÉE À DIX, et le refus le dit dans les mots
	 * du gel.
	 */
	creerSousDossier: async ({ params, locals, request, url }) => {
		const base = basePartagee();
		const { acces, domaine, lignes, dossier } = await ouvrirLeDossier(
			params,
			locals.identite,
			url.pathname
		);
		if (capacites(droitEffectif(acces, dossier.id)).creerDesSousDossiers !== true) {
			error(404, MESSAGE_INTROUVABLE);
		}

		const brut = (await request.formData()).get('nom');
		const nom = typeof brut === 'string' ? brut.trim() : '';
		if (nom === '') return fail(400, { creation: NOM_MANQUANT });

		/* Le niveau annoncé est celui du GEL — la racine du domaine ne s'y compte
		   pas —, tandis que la contrainte de base compte depuis la racine. Le plafond
		   est le même ; seule la façon de le dire diffère. */
		if (dossier.profondeur + 1 > PROFONDEUR_MAX) {
			return fail(422, { creation: tropProfond(dossier.profondeur) });
		}

		/* Un frère du même nom rendrait deux adresses identiques : refus, pas de
		   réparation silencieuse. Le refus porte sur l'ADRESSE, pas sur le nom. */
		const existe = lignes.some(
			(d) => d.parentId === dossier.id && identifiantLisible(d.nom) === identifiantLisible(nom)
		);
		if (existe) return fail(409, { creation: nomDejaPris(nom) });

		const freres = lignes.filter((d) => d.parentId === dossier.id);
		await base.insert(dossiers).values({
			domaineId: domaine.id,
			parentId: dossier.id,
			nom,
			position: freres.length,
			profondeur: dossier.profondeur + 1
		});

		/* L'adresse du nouveau dossier se compose des segments AFFICHÉS de son
		   parent, jamais du chemin reçu : quand le parent est la racine, le chemin
		   reçu la NOMME alors que ses enfants s'adressent sans elle. Concaténer
		   rendait une adresse en 404 juste après une création réussie. */
		const segmentsDuParent = segmentsAffiches(lignes, dossier.id).map(identifiantLisible);
		redirect(
			303,
			adresseDeDossier(domaine.universIdentifiant, domaine.identifiant, [
				...segmentsDuParent,
				identifiantLisible(nom)
			])
		);
	},

	/**
	 * `RG-STR-04`, `RG-STR-05` — RENOMMER OU DÉPLACER. Le gel n'en fait qu'un geste,
	 * et l'action non plus.
	 *
	 * TOUTE LA DÉCISION EST DANS `renommerOuDeplacerUnDossier()` : rien ici ne
	 * compare un droit, ne mesure une profondeur ni ne cherche un cycle.
	 *
	 * L'ADRESSE D'ARRIVÉE EST CELLE DU NOUVEAU NOM, et l'ancienne cesse de résoudre :
	 * `RG-M03-03` protège l'adresse d'une NOTE, jamais celle d'un dossier.
	 */
	renommerOuDeplacer: async ({ params, locals, request, url }) => {
		const { acces, domaine, lignes, dossier } = await ouvrirLeDossier(
			params,
			locals.identite,
			url.pathname
		);
		const formulaire = await request.formData();
		const brutNom = formulaire.get('nouveauNom');
		const brutDestination = formulaire.get('destination');

		const fait = await renommerOuDeplacerUnDossier(basePartagee(), {
			dossierId: dossier.id,
			destinationId: typeof brutDestination === 'string' ? brutDestination : '',
			nom: typeof brutNom === 'string' ? brutNom : '',
			lignes,
			droit: (id) => droitEffectif(acces, id)
		});
		if (!fait.fait) {
			if (fait.message === '') error(404, MESSAGE_INTROUVABLE);
			return fail(422, { deplacement: fait.message });
		}

		redirect(303, adresseDeDossier(domaine.universIdentifiant, domaine.identifiant, fait.segments));
	},

	/**
	 * `RG-DRO-01` — ACCORDER UN DROIT, le geste de `.dr-ajout`.
	 *
	 * ACCORDER ET CHANGER SONT DEUX GESTES, PAS UN. Le premier vise un compte qui
	 * n'a rien sur ce dossier, le second une ligne déjà posée — et c'est cette
	 * distinction qui permet au second d'exiger un droit PROPRE. Les confondre
	 * ferait d'un clic sur la ligne d'un droit HÉRITÉ une écriture sur ce dossier.
	 */
	accorderLeDroit: (evenement) => reponseDeDroit(evenement, accorderUnDroitDeDossier),

	/** `RG-DRO-01` — CHANGER LE NIVEAU d'un droit posé sur CE dossier. */
	changerLeDroit: (evenement) => reponseDeDroit(evenement, changerUnDroitDeDossier),

	/** `RG-DRO-01` — RETIRER un droit posé sur CE dossier. Le niveau n'est pas lu. */
	retirerLeDroit: (evenement) => reponseDeDroit(evenement, retirerUnDroitDeDossier),

	/**
	 * `RG-M03-04` — SUPPRIMER. LE DÉCOMPTE EST À L'ÉCRAN, LA SAISIE EST ICI : le
	 * dialogue désactive son bouton tant que la saisie diffère, et le serveur refuse
	 * quand même — une désactivation d'écran n'est pas un contrôle.
	 *
	 * LE RETOUR SE FAIT AU PARENT, calculé AVANT : après la transaction, le dossier
	 * n'a plus de chemin. Quand le parent est la racine du domaine, il n'y a pas de
	 * page de dossier où revenir — c'est V-11.
	 */
	supprimer: async ({ params, locals, request, url }) => {
		const { acces, domaine, lignes, dossier } = await ouvrirLeDossier(
			params,
			locals.identite,
			url.pathname
		);
		const brut = (await request.formData()).get('confirmation');

		const fait = await supprimerUnDossier(basePartagee(), moteurPartage(), {
			dossierId: dossier.id,
			saisie: typeof brut === 'string' ? brut : '',
			lignes,
			droit: (id) => droitEffectif(acces, id),
			/* `RG-NF-05` — l'auteur de la destruction, jusque dans la transaction. */
			identite: locals.identite
		});
		if (!fait.fait) {
			if (fait.message === '') error(404, MESSAGE_INTROUVABLE);
			return fail(422, { suppression: fait.message });
		}

		redirect(
			303,
			fait.segmentsDuParent.length === 0
				? adresseDeDomaine(domaine.universIdentifiant, domaine.identifiant)
				: adresseDeDossier(domaine.universIdentifiant, domaine.identifiant, fait.segmentsDuParent)
		);
	}
};
