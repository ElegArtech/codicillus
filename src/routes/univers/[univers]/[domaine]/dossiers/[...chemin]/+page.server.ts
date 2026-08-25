/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}/dossiers/{chemin…}` — V-13.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DOSSIERS NE SONT PAS UNE TABLE PLATE
 *
 * `seeds/corpus.ts` porte le rangement d'une note en CHAÎNE — « Exploitation ›
 * Sauvegardes » — et l'arborescence s'en déduit. La base, elle, porte une table
 * `dossiers` avec un parent et une profondeur plafonnée à 10 (`RG-STR-04`,
 * contrainte `dossiers_profondeur_plafonnee`). Les deux représentations se
 * traduisent l'une dans l'autre, et c'est `src/lib/donnees/rangement.ts` qui le
 * fait, par deux fonctions pures et réciproques : `resoudreLeChemin()` descend
 * l'arborescence depuis la racine, `segmentsAffiches()` la remonte.
 *
 * TROIS REPRÉSENTATIONS DU MÊME CHEMIN, ET IL NE FAUT PAS LES CONFONDRE :
 *
 *   en base       une ligne, son parent, sa profondeur ;
 *   dans l'adresse `exploitation/sauvegardes` — identifiants lisibles, barres
 *                 obliques (`$lib/rangement/adresses`) ;
 *   à l'écran     `Exploitation › Sauvegardes` — noms, séparateur du gel, dont
 *                 les deux espaces font partie (`SEPARATEUR_DE_CHEMIN`).
 *
 * LA RACINE N'EST DANS AUCUNE DES DEUX DERNIÈRES. Un `{chemin…}` vide ne
 * désigne donc rien, et cette route rend alors le même refus que pour un chemin
 * faux : la page du dossier racine est celle du domaine, V-11. Les trois sources
 * sont citées dans l'en-tête de `rangement.ts`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ARBORESCENCE SERVIE EST CELLE DE LA BASE, PLUS CELLE DES NOTES
 *
 * La vue sait déduire son arborescence du rangement des notes — c'est ce que le
 * gel fait, faute de serveur. LE PRODUIT NE PEUT PAS S'EN CONTENTER : un dossier
 * VIDE n'apparaît dans aucune note. Un sous-dossier fraîchement créé restait
 * donc invisible sur la page de son propre parent, et le sélecteur de
 * destination du dialogue de déplacement n'offrait que les dossiers portant des
 * notes. La propriété `rangement` porte l'arborescence réelle ; son absence
 * laisse la vue exactement comme elle était, ce qui est la garantie que le banc
 * ne bouge pas.
 *
 * ELLE EST RABATTUE SUR LE PÉRIMÈTRE, jamais servie entière : `ADR-006` veut le
 * filtre dans la requête plutôt qu'après elle, et un dossier hors périmètre n'a
 * pas à être nommé — pas même comme destination impossible.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DROIT EFFECTIF EST CELUI DE LA RÉSOLUTION UNIQUE
 *
 * `docs/routes.md:127` : « connecté + lecteur (écriture selon droit effectif) ».
 * L'axe « Droit effectif » de la planche a exactement les trois valeurs de
 * `DroitDeDossier` — gestionnaire, rédacteur, lecteur — et ce chargeur les
 * transmet TELLES QUELLES depuis `resoudreDroitDeDossier()`. C'est le seul
 * endroit du lot où une valeur de la maquette et une valeur du modèle de droits
 * coïncident sans traduction, et c'est pourquoi cette vue est celle dont le
 * câblage des droits est le plus complet.
 *
 * `RG-DRO-01` et `RG-DRO-05` sont donc à l'œuvre sans qu'une ligne d'ici les
 * exprime : un droit posé sur la racine d'un domaine gouverne tout son
 * sous-arbre, parce que la remontée de `resolution.ts` l'atteint depuis
 * n'importe quel descendant.
 *
 * ET SON ORIGINE EST DÉSORMAIS DITE. `.droit__source` (`V-13:1146`) affichait
 * « — hérité du domaine Infrastructure » quel que fût le domaine et quelle que
 * fût l'origine : une valeur illustrative, c'est-à-dire `P-02`. Elle est
 * remplacée par ce que `RG-DRO-01` a réellement trouvé — le dossier le plus
 * proche portant un droit explicite —, dans les trois tournures du gel.
 *
 * RG-STR-06 — le module `dossiers` est EXIGÉ. Deux domaines du corpus ne
 * l'activent pas alors que la base leur donne des dossiers : « Applications »
 * (trois dossiers sous la racine) et « Migration 2026 » (un). Leurs adresses de
 * dossier ne rendent donc rien, et c'est ce qui rend cette règle éprouvée sur un
 * cas réel plutôt qu'espérée (`P-5`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * QUATRE ACTIONS, ET LEURS DROITS NE SONT PAS LES MÊMES
 *
 * `CDC` §2.3 réserve « créer des sous-dossiers », « renommer / déplacer /
 * supprimer le dossier » et « gérer les droits » au GESTIONNAIRE, et « créer et
 * modifier des notes » au RÉDACTEUR. Aucune de ces distinctions n'est écrite
 * ici : `capacites()` porte la table, colonne par colonne, et chaque action lui
 * demande la capacité qui la concerne. Le refus est le `404` de partout ailleurs
 * (`RG-ACC-04`) — refus et inexistence ne se distinguent pas.
 *
 * « NOUVELLE NOTE » N'EST PAS UNE ACTION, c'est une navigation vers
 * `/notes/nouvelle` : elle n'écrit rien ici, et le droit qui la gouverne est
 * celui de la route d'arrivée. La vue n'affiche son bouton qu'au rédacteur.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { dossiers } from '$lib/base/schema';
import { moteurPartage } from '$lib/recherche/acces';
import { adresseDeDomaine, adresseDeDossier, identifiantLisible } from '$lib/rangement/adresses';
import { capacites, perimetreContient, resoudre } from '$lib/droits/resolution';
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
import { NOM_DU_COMPTE_VISE, nomDuNiveau } from './champs-de-droits';
import type { NomDeDomaine } from '../../../../../../../seeds/corpus';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

/* ═══════════════════════════════════ Le contexte, résolu une fois ═══════ */

/** Ce que toute requête de cette route établit avant de décider quoi que ce soit. */
interface ContexteDeDossier {
	readonly acces: AccesAuRangement;
	readonly domaine: DomaineResolu;
	readonly lignes: readonly LigneDeDossier[];
	readonly dossier: LigneDeDossier;
	/** Le droit effectif sur ce dossier — JAMAIS nul : sans lui, on a refusé. */
	readonly droit: DroitDeDossier;
}

/**
 * OUVRE L'ACCÈS, RÉSOUT LE DOMAINE ET LE DOSSIER, OU REFUSE — un seul chemin
 * pour le chargeur et pour les quatre actions.
 *
 * L'écrire une fois n'est pas une commodité : c'est ce qui garantit qu'une
 * action ne puisse pas franchir une porte que la lecture ferme. Le module
 * `dossiers` exigé (`RG-STR-06`), la lecture du dossier (`capacites().lire`) et
 * la résolution du chemin sont les mêmes pour les cinq entrées.
 */
async function ouvrirLeDossier(
	params: { univers: string; domaine: string; chemin: string },
	identite: AccesAuRangement['identite'],
	adresse: string
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
	 * `resoudreLeChemin()` descend depuis la racine SANS la consommer — elle ne
	 * peut donc désigner qu'un descendant, et la racine n'avait aucune page.
	 * Conséquence mesurée le 22/08/2026 sur un domaine neuf, qui n'a que sa
	 * racine : `?/creerSousDossier` n'était atteignable de NULLE PART, et le
	 * premier dossier d'un domaine ne pouvait donc jamais être créé.
	 *
	 * UN SEUL SEGMENT, ET SEULEMENT SEUL. Accepter le nom de la racine en tête
	 * d'un chemin plus long donnerait deux adresses au même dossier ; ici on
	 * n'en ajoute qu'une, et elle ne désignait rien auparavant.
	 */
	const racine = lignes.find((d) => d.parentId === null) ?? null;
	const viseLaRacine =
		racine !== null && segments.length === 1 && segments[0] === identifiantLisible(racine.nom);
	const dossier =
		domaine === null ? null : viseLaRacine ? racine : resoudreLeChemin(lignes, segments);

	/* Le droit est résolu AVANT le verdict, et par l'implémentation unique. La
	   fermeture par défaut de `RG-DRO-02` répond d'elle-même quand le dossier est
	   introuvable : `droitEffectif()` rend alors `null`, et `capacites(null)` met
	   toutes les capacités à faux. */
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
		url.pathname
	);

	/**
	 * LES DESTINATIONS — tout le domaine, rabattu sur le périmètre, chacune avec
	 * son motif de refus. Le motif est calculé ICI plutôt que dans la vue pour
	 * deux raisons : il dépend de la profondeur RÉELLE des lignes, que la vue n'a
	 * pas, et la fonction qui le rend vit dans un module qui parle à la base.
	 */
	const visibles = lignes.filter((d) => perimetreContient(acces.perimetre, d.id));
	const destinations = [...visibles]
		/* L'ORDRE EST CELUI DE LA FRATRIE, jamais l'alphabet : `dossiers.position`
		   est la seule règle d'ordre du produit, et c'est elle qui reproduit
		   l'ordre des maquettes. Le tri par profondeur d'abord n'est pas
		   cosmétique — il garantit qu'un parent est rencontré avant ses enfants,
		   ce dont la vue a besoin pour bâtir son arborescence en une passe. */
		.sort((a, b) => a.profondeur - b.profondeur || (a.position ?? 0) - (b.position ?? 0))
		.map((d) => ({
			id: d.id,
			segments: segmentsAffiches(acces.dossiers, d.id),
			refus: motifDeRefusDeDestination(lignes, dossier.id, d.id)
		}));

	return {
		vecteur: {
			/* `dos` porte le chemin AFFICHÉ, séparateur du gel compris : c'est ce que
			   l'axe « Dossier » de la planche emploie, et ce que `segmentsDeDossier()`
			   de `$lib/rangement/adresses` sait relire. La remontée se fait sur
			   l'arborescence entière, non sur les seuls dossiers du domaine : le
			   chemin d'un dossier passe par ses ancêtres, qu'ils soient ou non dans le
			   périmètre — c'est le chemin de la ressource, pas un droit. */
			dos: cheminAffiche(segmentsAffiches(acces.dossiers, dossier.id)),
			dr: droit
		},
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte),
		domaine: domaine.nom as NomDeDomaine,
		/* L'univers porteur, pour que la vue ne le devine pas : elle le cherchait
		   dans le jeu de démonstration et retombait sur « Production ». */
		universDuDomaine: domaine.universNom,
		rangement: {
			destinations,
			dossierId: dossier.id,
			/* Un dossier de page a toujours un parent : la racine n'a pas de page. */
			parentId: dossier.parentId ?? ''
		},
		/**
		 * LES DROITS DU DOSSIER — servis AU SEUL GESTIONNAIRE, et `null` sinon.
		 *
		 * Cette réponse porte la liste des comptes de l'instance et ce que chacun
		 * peut faire ici. `ADR-006` veut le filtre au plus près de la donnée : la
		 * lire pour un lecteur, quitte à ce que la vue n'en fasse rien, mettrait
		 * l'annuaire des comptes dans la charge utile de tout le monde. La
		 * capacité qui gouverne le GESTE gouverne donc aussi sa LECTURE, et c'est
		 * le même `capacites().gererLesDroits` que les trois actions consultent.
		 */
		droits: capacites(droit).gererLesDroits
			? await lireLesDroitsDUnDossier(base, {
					dossierId: dossier.id,
					lignes: acces.dossiers,
					nomDuDomaine: domaine.nom,
					appelantId: locals.identite.type === 'authentifie' ? locals.identite.compteId : null
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

/** L'écriture que l'une des trois actions confie au module de données. */
type EcritureDeDroit = (
	base: Base,
	demande: DemandeDeDroit
) => Promise<DroitEcrit | RefusDEcriture>;

/**
 * LE PRÉAMBULE DES TROIS GESTES DE DROITS — un seul chemin, une seule traduction.
 *
 * Il ouvre le dossier par `ouvrirLeDossier()`, comme les trois autres gestes :
 * même exigence de module (`RG-STR-06`), même lecture, même résolution. Rien ici
 * ne compare un droit ni ne lit `droits_de_dossier` — `gererLesDroits` est
 * éprouvé dans le module de données, à l'endroit où l'écriture a lieu, et le
 * refus muet devient le `404` de partout ailleurs (`RG-ACC-04`).
 *
 * LE NIVEAU SE LIT SOUS UN NOM DÉRIVÉ DU COMPTE VISÉ — `champs-de-droits.ts`
 * dit pourquoi. Absent ou inconnu, il vaut `null`, que le module refuse par
 * `NIVEAU_INCONNU` : aucun défaut n'est supposé, se tromper de défaut ici serait
 * accorder un droit.
 *
 * LE COMPTE DE L'APPELANT VOYAGE JUSQU'AU MODULE, parce que c'est lui qui refuse
 * l'auto-retrait de gestion. `null` en anonyme — cas qui n'arrive pas,
 * `ouvrirLeDossier()` ayant déjà refusé faute de droit, et le type l'exprime
 * plutôt que de le supposer.
 *
 * LE RETOUR EST UN `303` VERS LA MÊME ADRESSE, non la charge utile de l'action :
 * la liste des droits est relue par le chargeur, donc elle est juste, et un
 * rechargement ne rejoue pas l'écriture.
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
			evenement.locals.identite.type === 'authentifie' ? evenement.locals.identite.compteId : null
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
 * AUCUNE ACTION PAR DÉFAUT : SvelteKit refuse qu'une action anonyme cohabite
 * avec des actions nommées, et le refus est un `500`. Les six sont nommées.
 */
export const actions: Actions = {
	/**
	 * `RG-STR-03` — CRÉER UN SOUS-DOSSIER, le geste que `#dlg-creer` dessine.
	 *
	 * `mockups/V-13-page-dossier.html:1161` pose le bouton `#a-sousdossier` sous
	 * la classe `si-gestionnaire`, `:1192` son jumeau `#v-sousdossier` du dossier
	 * vide, et `:1203` leur dialogue : un seul champ, « Nom du dossier »,
	 * obligatoire. Le parent est le dossier de l'adresse — le dialogue le rappelle
	 * en toutes lettres, « il sera créé dans … ».
	 *
	 * LE DROIT EST CELUI DU GEL : « créer des sous-dossiers » est la troisième
	 * colonne de `CDC` §2.3, et seul le **gestionnaire** la porte. Le refus est le
	 * même `404` que partout dans cette famille (`RG-ACC-04`).
	 *
	 * LA PROFONDEUR EST PLAFONNÉE À DIX (`PROFONDEUR_MAX`), et le refus le dit
	 * dans les mots du gel : c'est la seule limite que le rangement connaisse, et
	 * elle est du cahier.
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
		   pas —, tandis que la contrainte de base compte depuis la racine. Le
		   plafond est le même ; seule la façon de le dire diffère. */
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
		   reçu la NOMME (c'est sa seule adresse) alors que ses enfants s'adressent
		   sans elle. Concaténer aurait rendu une adresse en 404 juste après une
		   création réussie. */
		const segmentsDuParent = segmentsAffiches(lignes, dossier.id).map(identifiantLisible);
		redirect(
			303,
			adresseDeDossier(domaine.universNom, domaine.nom, [
				...segmentsDuParent,
				identifiantLisible(nom)
			])
		);
	},

	/**
	 * `RG-STR-04`, `RG-STR-05` — RENOMMER OU DÉPLACER, le geste de `#dlg-deplacer`
	 * (`V-13:1231`). Un champ de nom, un sélecteur arborescent de destination, un
	 * bouton « Enregistrer » : le gel n'en fait qu'un geste, et l'action non plus.
	 *
	 * TOUTE LA DÉCISION EST DANS `renommerOuDeplacerUnDossier()`. Rien ici ne
	 * compare un droit, ne mesure une profondeur ni ne cherche un cycle : cette
	 * fonction rend soit le chemin d'arrivée, soit un refus — muet quand c'est un
	 * droit qui manque, ce que la route traduit en `404`.
	 *
	 * L'ADRESSE D'ARRIVÉE EST CELLE DU NOUVEAU NOM, et l'ancienne cesse de
	 * résoudre. Voir l'en-tête de `dossiers-ecriture.ts` : `RG-M03-03` protège
	 * l'adresse d'une NOTE, jamais celle d'un dossier, qui se dérive de son nom.
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

		redirect(303, adresseDeDossier(domaine.universNom, domaine.nom, fait.segments));
	},

	/**
	 * `RG-DRO-01` — ACCORDER UN DROIT, le geste de `.dr-ajout` (`V-40:1203`).
	 *
	 * ACCORDER ET CHANGER SONT DEUX GESTES, PAS UN. Le premier vise un compte qui
	 * n'a rien sur ce dossier, le second une ligne déjà posée — et c'est cette
	 * distinction qui permet au second d'exiger un droit PROPRE. Les confondre
	 * ferait d'un clic sur la ligne d'un droit HÉRITÉ une écriture sur ce
	 * dossier, c'est-à-dire l'inverse de ce que la ligne montrait.
	 */
	accorderLeDroit: (evenement) => reponseDeDroit(evenement, accorderUnDroitDeDossier),

	/** `RG-DRO-01` — CHANGER LE NIVEAU d'un droit posé sur CE dossier. */
	changerLeDroit: (evenement) => reponseDeDroit(evenement, changerUnDroitDeDossier),

	/** `RG-DRO-01` — RETIRER un droit posé sur CE dossier. Le niveau n'est pas lu. */
	retirerLeDroit: (evenement) => reponseDeDroit(evenement, retirerUnDroitDeDossier),

	/**
	 * `RG-M03-04` — SUPPRIMER, le geste de `#dlg-supprimer` (`V-13:1262`).
	 *
	 * LE DÉCOMPTE EST À L'ÉCRAN, LA SAISIE EST ICI. La règle exige les deux : « la
	 * suppression d'un dossier affiche le décompte des sous-dossiers et des notes
	 * qui seront détruits, ET exige la saisie du nom exact du dossier pour être
	 * confirmée ». Le dialogue désactive son bouton tant que la saisie diffère
	 * (`V-13:2366`) ; le serveur refuse quand même — une désactivation d'écran
	 * n'est pas un contrôle.
	 *
	 * LE RETOUR SE FAIT AU PARENT, et il faut le calculer AVANT : après la
	 * transaction, le dossier n'a plus de chemin. Quand le parent est la racine du
	 * domaine, il n'y a pas de page de dossier où revenir — c'est la page du
	 * domaine, V-11 (`ARB-001`, forme canonique).
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
			droit: (id) => droitEffectif(acces, id)
		});
		if (!fait.fait) {
			if (fait.message === '') error(404, MESSAGE_INTROUVABLE);
			return fail(422, { suppression: fait.message });
		}

		redirect(
			303,
			fait.segmentsDuParent.length === 0
				? adresseDeDomaine(domaine.universNom, domaine.nom)
				: adresseDeDossier(domaine.universNom, domaine.nom, fait.segmentsDuParent)
		);
	}
};
