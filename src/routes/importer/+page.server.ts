/**
 * `/importer` — LE CHARGEUR ET L'ACTION de V-24. « Connecté + rédacteur » ; 302 vers la
 * connexion en anonyme, 404 sans droit de rédaction. LA REDIRECTION ANONYME N'EST PAS
 * ÉCRITE ICI : `garde.ts` range `/importer` au régime `redirection`, appliqué AVANT toute
 * route. AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI non plus, et UN SEUL CHEMIN DE SORTIE EN
 * REFUS — ADR-007, RG-ACC-04.
 *
 * LE DROIT EST CHERCHÉ SUR LES RACINES DE DOMAINE : interroger TOUS les dossiers laissait
 * passer un compte à qui un sous-dossier seul est ouvert, et `domainesOuEcrire()` lui
 * rendait une liste VIDE — sélecteur sans option, soumission que le 403 attendait (`P-09`).
 *
 * `notes` est le périmètre de LECTURE, jamais le corpus (`RG-ACC-01`). `domainesOuEcrire`
 * N'EST PAS LE RAIL : V-24 lit `domaines` POUR SON PROPRE BALISAGE, hors coquille, et en
 * peuple un CHAMP DE SAISIE OBLIGATOIRE ; le rail porte le périmètre LISIBLE, quand une
 * cible doit être INSCRIPTIBLE.
 *
 * DEUX ACTIONS NOMMÉES, jamais une action par défaut : SvelteKit rend 500 quand les deux
 * régimes cohabitent. LE LOT EST ENVOYÉ DEUX FOIS, ET C'EST ASSUMÉ — analyse et exécution
 * partent des MÊMES octets et traversent le MÊME `classerLeLot()`.
 */
import { eq, isNull } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { basePartagee, type Base } from '$lib/base/acces';
import { domaines, dossiers, notes as notesDuSchema, univers } from '$lib/base/schema';
import { capacites } from '$lib/droits/resolution';
import {
	SOURCE_SANS_DOSSIER,
	VOIE_PAR_FORMAT,
	classerLeLot,
	convertirLeLot,
	enregistrerLeLot,
	entreeDeJournal,
	executerLImport,
	formatDuChemin,
	identifiantsPris,
	libellesDeFormat,
	sansLePremierNiveau,
	sonderLeServiceDeConversion,
	sourceDuLot,
	type FichierDepose
} from '$lib/donnees/import';
import {
	SCENARIO_DE_DOMAINE,
	SCENARIO_LIVRE,
	scenarioEstLivre
} from '$lib/donnees/scenarios-d-import';
import { creerUnDomaine } from '$lib/donnees/administration';
import { lireUnivers } from '$lib/donnees/lecture';
import {
	droitEffectif,
	lireNotesLisibles,
	ouvrirLAcces,
	peutEcrireDansLUn,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import { moteurPartage } from '$lib/recherche/acces';
import { adresseDeDomaine, adresseDeNote } from '$lib/rangement/adresses';
import { estUneMiseAJour } from './reprise';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { refusDEcriture } from '$lib/donnees/amorcage';

/**
 * L'appelant et son droit d'importer — le seul point d'entrée du fichier. Le
 * chargeur et l'action le franchissent tous deux : un POST qui contournerait la
 * garde du GET serait la même fuite, par l'autre verbe.
 */
async function importateur(locals: App.Locals): Promise<{
	readonly base: Base;
	readonly acces: AccesAuRangement;
	readonly compteId: string;
	/**
	 * PEUT-IL CRÉER UN DOMAINE ? `UC-M12-02` importe « une arborescence dont le premier
	 * niveau devient un NOUVEAU domaine » : le droit ne peut pas s'éprouver sur un
	 * domaine qui n'existe pas encore, il s'éprouve sur l'univers d'accueil. Créer un
	 * domaine est un geste d'administration (`UC-M14-02`, `/console/domaines`), et
	 * c'est ce droit-là qui est demandé — pas un second, inventé pour l'occasion.
	 */
	readonly peutCreerUnDomaine: boolean;
}> {
	const identite = locals.identite;
	/* Inatteignable : `regimeDe('/importer')` vaut `redirection`, et les hooks ont
	   déjà répondu 302. Fermé par défaut plutôt que supposé impossible. */
	if (identite.type !== 'authentifie') error(404, MESSAGE_INTROUVABLE);

	const base = basePartagee();
	const acces = await ouvrirLAcces(base, identite, new Date());
	/* LES RACINES DE DOMAINE, ET RIEN D'AUTRE — voir l'en-tête. Même ensemble que
	   `domainesOuEcrire()` filtre, cherché sur les dossiers DÉJÀ LUS par
	   `ouvrirLAcces()` : aucune seconde lecture. */
	const dansUnDomaine = peutEcrireDansLUn(
		acces,
		acces.dossiers.filter((d) => d.parentId === null).map((d) => d.id)
	);
	const peutCreerUnDomaine = identite.role === 'administrateur';

	/* L'ADMINISTRATEUR D'UNE INSTANCE SANS AUCUN DOMAINE ENTRE ICI, et c'est
	   `UC-M12-02` qui le veut : reprendre un périmètre entier d'un coup est
	   précisément ce qu'on fait sur une instance neuve. Il lui faut un univers
	   d'accueil — sans lui, il n'y a rien où créer le domaine, et le refus nomme le
	   geste qui débloque. */
	const universDAccueil = peutCreerUnDomaine ? await lireUnivers(base) : [];
	if (!dansUnDomaine && universDAccueil.length === 0) {
		/* LE CODE RESTE 404 — SEULE LA PHRASE CHANGE, ET POUR UN SEUL CAS. Une
		   instance à zéro univers n'a aucune racine de domaine : l'administrateur qui
		   vient d'installer tombait sur un 404 nu, sans savoir que ce qui manque est
		   un univers. Tout autre compte, toute autre cause : `MESSAGE_INTROUVABLE`,
		   au même octet. */
		error(404, await refusDEcriture(base, identite));
	}

	return { base, acces, compteId: identite.compteId, peutCreerUnDomaine };
}

export const load: PageServerLoad = async ({ locals }) => {
	const { base, acces, peutCreerUnDomaine } = await importateur(locals);
	const cibles = await domainesOuEcrire(base, acces);
	/* LES UNIVERS OÙ UN DOMAINE PEUT NAÎTRE — `UC-M12-02`. Vide pour qui n'a pas le
	   droit de créer un domaine : l'étape 1 n'offre alors pas le scénario, et
	   l'action le refuse. Une action interdite n'est pas rendue (`P-09`). */
	const universDAccueil = peutCreerUnDomaine ? await universOuCreerUnDomaine(base) : [];

	return {
		vecteur: null,
		/**
		 * « LAISSER TOURNER EN ARRIÈRE-PLAN » MÈNE À LA CONSOLE, ET ELLE EST
		 * RÉSERVÉE : toutes les routes de console exigent le rôle administrateur, et
		 * un autre compte y reçoit 404. Le bouton n'est donc POSÉ que pour lui
		 * (`P-09`).
		 */
		suiviEnConsole:
			locals.identite.type === 'authentifie' && locals.identite.role === 'administrateur',
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte),
		/* Rien n'a été déposé : le lot est vide, et il le dit. */
		lotImport: { source: '', fichiers: [] },
		formatsImport: libellesDeFormat(),
		/* LES CIBLES OFFERTES AU SÉLECTEUR — le périmètre est celui de l'ÉCRITURE,
		   pas celui de la lecture. */
		domainesOuEcrire: cibles,
		/* `UC-M12-02` — les univers d'accueil du domaine à créer, et le droit de le
		   faire. La vue n'offre le scénario que si la liste n'est pas vide. */
		universOuCreerUnDomaine: universDAccueil,
		/* Le domaine proposé au dépôt : le premier où l'appelant a le droit d'écrire.
		   Il n'est pas « son » domaine — un compte peut n'avoir aucun droit d'écriture
		   sur celui auquel il est rattaché —, et le proposer quand même ferait choisir
		   par défaut une cible que la soumission refuserait. C'est la TÊTE de la liste
		   ci-dessus, et pas une seconde lecture : deux lectures auraient fini par
		   proposer un défaut absent du menu. */
		domaineParDefaut: cibles[0]?.nom ?? ''
	};
};

/**
 * LES DOMAINES OÙ L'APPELANT PEUT ÉCRIRE, dans l'ordre des noms — les cibles d'import
 * possibles, et rien d'autre. VIDE EST INATTEIGNABLE, la garde d'entrée interrogeant
 * exactement les racines que ce filtre retient ; qu'ils divergent, et c'est un sélecteur
 * vide qui est rendu. Le droit est demandé à `capacites(droitEffectif())`, jamais recalculé.
 */
/**
 * LES UNIVERS OÙ UN DOMAINE PEUT NAÎTRE — leur identifiant, qui est ce que
 * `creerUnDomaine()` attend, et leur nom, qui est ce que l'écran montre. Résoudre un
 * univers par son nom ne tiendrait que par la chance de schéma d'`univers_nom_unique`.
 */
async function universOuCreerUnDomaine(
	base: Base
): Promise<readonly { readonly identifiant: string; readonly nom: string }[]> {
	return await base
		.select({ identifiant: univers.identifiant, nom: univers.nom })
		.from(univers)
		.orderBy(univers.ordre);
}

async function domainesOuEcrire(
	base: Base,
	acces: AccesAuRangement
): Promise<
	readonly { readonly nom: string; readonly univers: string; readonly couleur: string }[]
> {
	const racines = await base
		.select({
			nom: domaines.nom,
			univers: univers.nom,
			couleur: domaines.couleur,
			dossierId: dossiers.id
		})
		.from(dossiers)
		.innerJoin(domaines, eq(dossiers.domaineId, domaines.id))
		.innerJoin(univers, eq(univers.id, domaines.universId))
		.where(isNull(dossiers.parentId))
		.orderBy(domaines.nom);
	return racines
		.filter((r) => capacites(droitEffectif(acces, r.dossierId)).ecrireDesNotes)
		.map((r) => ({ nom: r.nom, univers: r.univers, couleur: r.couleur }));
}

/**
 * LA CIBLE D'UN LOT — le domaine où il atterrit, sa racine, sa profondeur de départ.
 * `null` quand le domaine n'existe pas encore : l'aperçu de `UC-M12-02` n'a pas le droit
 * d'en créer un, et il n'en a pas besoin — le classement ne demande qu'une profondeur.
 */
interface CibleDuLot {
	readonly id: string;
	readonly domaineId: string;
	readonly profondeur: number;
	/** L'adresse du domaine, composée par la fabrique unique (`ARB-001`). */
	readonly adresse: string;
}

/**
 * TOUT CE QU'UN LOT DEMANDE AVANT D'ÊTRE CLASSÉ. LES DEUX ACTIONS PARTAGENT CE
 * CHEMIN, ET C'EST LA CONDITION DE `RG-M12-02` : l'aperçu et l'exécution
 * traversent le MÊME `classerLeLot()`, avec les mêmes octets et le même contexte.
 *
 * `ecrire` EST LA SEULE DIFFÉRENCE ENTRE LES DEUX APPELS, et elle ne porte que sur la
 * CIBLE : l'aperçu de « domaine complet » ne crée aucun domaine — « rien n'a encore été
 * écrit » (`UC-M12-04` §3) —, l'exécution le crée. Le classement, lui, est le même.
 */
async function preparerLeLot(
	locals: App.Locals,
	request: Request,
	fetch: typeof globalThis.fetch,
	ecrire: boolean
) {
	const { base, acces, compteId, peutCreerUnDomaine } = await importateur(locals);

	const champs = await request.formData();

	/* LE SCÉNARIO EST ÉPROUVÉ AVANT TOUT LE RESTE : il décide de la cible, donc de
	   tout ce qui suit. L'ABSENCE VAUT LE SCÉNARIO DE BASE — des notes dans un
	   domaine existant. Un scénario que l'instance n'exécute pas est REFUSÉ, jamais
	   dérivé en silence. */
	const scenario = String(champs.get('scenario') ?? SCENARIO_LIVRE);
	if (!scenarioEstLivre(scenario)) {
		return { refus: fail(400, { issue: 'scenario-non-livre' }) } as const;
	}

	const simulation = champs.get('simulation') !== null;
	/* `RG-M12-03` — « sauf si l'utilisateur a explicitement demandé un mode strict ».
	   La case est à l'étape 1 de V-24 : aucune maquette ne l'offre, la règle l'exige. */
	const strict = champs.get('strict') !== null;

	const deposesBruts = await deposes(champs);
	if (deposesBruts.length === 0) return { refus: fail(400, { issue: 'lot-vide' }) } as const;

	/* LA SOURCE EST CELLE DES FICHIERS, jamais celle de la destination : c'est elle
	   que `RG-M12-09` fait inscrire au journal, et elle se lit sur les chemins
	   déposés — donc AVANT que `UC-M12-02` n'en retire le premier niveau. */
	const source = sourceDuLot(deposesBruts);

	/* `UC-M12-02` — le premier niveau devient le domaine, il ne se recrée pas en
	   dossier à l'intérieur. Les deux autres scénarios gardent le lot tel quel. */
	const fichiers =
		scenario === SCENARIO_DE_DOMAINE ? sansLePremierNiveau(deposesBruts) : deposesBruts;

	const destination = await destinationDuLot(base, acces, {
		scenario,
		champs,
		source,
		peutCreerUnDomaine,
		ecrire
	});
	if ('refus' in destination) return destination;

	/* L'ÉTAT DU SERVICE EST SONDÉ UNE FOIS PAR LOT, PUIS LE LOT EST CONVERTI AVANT
	   D'ÊTRE CLASSÉ. L'ordre n'est pas indifférent : le classement est synchrone et
	   sans réseau, condition pour que l'étape 3 soit une décision pure et que la
	   simulation n'ait rien de plus à faire que l'import réel (`RG-M12-02`). */
	const service = await sonderLeServiceDeConversion(fetch, env['URL_CONVERSION']);
	const conversions = await convertirLeLot(fetch, env['URL_CONVERSION'], fichiers, service);

	/* `RG-M12-01` — ce que la cible contient déjà, et OÙ : ce qui permet à un
	   réimport de retrouver ses notes plutôt que d'en créer des copies suffixées.
	   Sans cette carte, l'idempotence n'a aucun discriminant. Un domaine qui n'existe
	   pas encore ne contient rien, et la carte est vide. */
	const cible =
		destination.cible === null
			? { notes: new Map<string, string>(), dossiers: [] as readonly string[] }
			: await contenuDeLaCible(base, acces, destination.cible.id);

	const plan = classerLeLot(source, fichiers, {
		service,
		conversions,
		identifiantsPris: await identifiantsPris(base),
		notesDeLaCible: cible.notes,
		profondeurDeDepart: destination.profondeur
	});

	return {
		base,
		plan,
		simulation,
		strict,
		scenario,
		source,
		/* LE CONTENU DE LA CIBLE REMONTE AVEC LE PLAN, et c'est le correctif de
		   l'aperçu menteur : le classement l'a consulté, il ne l'a pas consigné. */
		contenuDeLaCible: cible,
		cible:
			destination.cible === null
				? null
				: {
						domaineId: destination.cible.domaineId,
						dossierId: destination.cible.id,
						auteurId: compteId
					},
		adresseDuDomaine: destination.cible?.adresse ?? '',
		profondeurDeDepart: destination.profondeur,
		domaine: destination.domaine
	} as const;
}

/**
 * OÙ LE LOT ATTERRIT, ET À QUEL DROIT. Un seul point de sortie en refus, et le droit y
 * est éprouvé SUR LA CIBLE — pas seulement à l'entrée : un compte peut avoir le droit
 * d'écrire quelque part, et pas ici.
 *
 * DEUX RÉGIMES, PARCE QUE `UC-M12-02` N'A PAS DE DOMAINE À ÉPROUVER : le droit se demande
 * alors à l'UNIVERS d'accueil, qui est le seul objet qui existe au moment du geste.
 */
async function destinationDuLot(
	base: Base,
	acces: AccesAuRangement,
	demande: {
		readonly scenario: string;
		readonly champs: FormData;
		readonly source: string;
		readonly peutCreerUnDomaine: boolean;
		readonly ecrire: boolean;
	}
): Promise<
	| { readonly refus: ReturnType<typeof fail> }
	| {
			readonly cible: CibleDuLot | null;
			readonly profondeur: number;
			readonly domaine: string;
	  }
> {
	if (demande.scenario !== SCENARIO_DE_DOMAINE) {
		const nomDuDomaine = String(demande.champs.get('domaine-cible') ?? '');
		const racine = await racineDuDomaine(base, nomDuDomaine);
		if (racine === null) return { refus: fail(400, { issue: 'domaine-inconnu' }) };
		if (!capacites(droitEffectif(acces, racine.id)).ecrireDesNotes) {
			return { refus: fail(403, { issue: 'sans-droit-sur-la-cible' }) };
		}
		return { cible: racine, profondeur: racine.profondeur, domaine: nomDuDomaine };
	}

	/* ── `UC-M12-02` — le domaine est à créer ─────────────────────────────── */
	if (!demande.peutCreerUnDomaine) {
		return { refus: fail(403, { issue: 'sans-droit-sur-la-cible' }) };
	}
	/* Le nom saisi l'emporte ; à défaut, le dossier de premier niveau du lot en
	   fournit le nom — c'est ce que l'aide du champ promet. */
	const saisi = String(demande.champs.get('nom-domaine') ?? '').trim();
	const nom = saisi !== '' ? saisi : demande.source === SOURCE_SANS_DOSSIER ? '' : demande.source;
	if (nom === '') return { refus: fail(400, { issue: 'nom-de-domaine-manquant' }) };

	/* LE DOMAINE PEUT DÉJÀ EXISTER, ET C'EST L'IDEMPOTENCE (`RG-M12-01`) : rejouer
	   le même lot ne crée pas un second domaine, il réécrit dans le premier. */
	const deja = await racineDuDomaine(base, nom);
	if (deja !== null) {
		if (!capacites(droitEffectif(acces, deja.id)).ecrireDesNotes) {
			return { refus: fail(403, { issue: 'sans-droit-sur-la-cible' }) };
		}
		return { cible: deja, profondeur: deja.profondeur, domaine: nom };
	}

	/* LA RACINE D'UN DOMAINE EST DE PROFONDEUR 1 (`RG-STR-03`, contrainte
	   `dossiers_racine_sans_parent`) : l'aperçu classe donc le lot exactement comme
	   l'exécution le fera, sans avoir rien créé. */
	if (!demande.ecrire) return { cible: null, profondeur: 1, domaine: nom };

	const universDAccueil = String(demande.champs.get('univers-cible') ?? '');
	if (universDAccueil === '') return { refus: fail(400, { issue: 'univers-inconnu' }) };
	/* LES TROIS ÉCRITURES DE `RG-STR-03` ET `RG-STR-06` EN UNE TRANSACTION — le
	   domaine, son dossier racine et ses modules — sont celles de la console, et
	   c'est la même fonction qui les fait. Aucune seconde manière de créer un
	   domaine. `dossiers` est activé avec `notes` : un lot importé EST une
	   arborescence, et un domaine qui n'offrirait pas de la parcourir la cacherait. */
	const issue = await creerUnDomaine(base, {
		nom,
		description: '',
		univers: universDAccueil,
		couleur: COULEUR_DE_DOMAINE_IMPORTE,
		modules: ['notes', 'dossiers']
	});
	if (issue.issue === 'introuvable') return { refus: fail(400, { issue: 'univers-inconnu' }) };
	if (issue.issue !== 'possible') return { refus: fail(400, { issue: 'domaine-deja-present' }) };

	const creee = await racineDuDomaine(base, nom);
	if (creee === null) return { refus: fail(400, { issue: 'domaine-inconnu' }) };
	return { cible: creee, profondeur: creee.profondeur, domaine: nom };
}

/**
 * La couleur d'un domaine créé par un import — la première de la palette de `V-28`, celle
 * que le panneau de création propose. Elle se change en console ; la choisir au hasard
 * ferait deux domaines créés le même jour de deux teintes sans raison.
 */
const COULEUR_DE_DOMAINE_IMPORTE = '#453ba0';

export const actions: Actions = {
	/**
	 * L'APERÇU — `UC-M12-04` étape 3, « rien n'a encore été écrit » : `classerLeLot()` n'a
	 * pas de base, et la promesse tient par construction. LES MOTIFS SONT DES CODES, la mise
	 * en français est dans la vue. CE QUE LA CIBLE PORTE DÉJÀ VOYAGE AVEC LE LOT — `maj` par
	 * ligne, et les dossiers existants ; sans eux, l'aperçu comptait tout comme neuf.
	 */
	analyser: async ({ locals, request, fetch }) => {
		const prepare = await preparerLeLot(locals, request, fetch, false);
		if ('refus' in prepare) return prepare.refus;

		return {
			issue: 'lot-analyse',
			lot: {
				source: prepare.source,
				fichiers: prepare.plan.lignes.map((l) => ({
					c: l.chemin,
					/* `f` est une MARQUE D'AFFICHAGE : la vue la traduit par la table des
					   formats et retombe sur la valeur brute quand elle n'y figure pas. */
					f: l.format ?? extensionDe(l.chemin),
					o: 0,
					s: l.sort,
					...(l.motif === null ? {} : { m: l.motif }),
					...(estUneMiseAJour(l, prepare.contenuDeLaCible.notes) ? { maj: true } : {})
				}))
			},
			dossiersExistants: prepare.contenuDeLaCible.dossiers,
			/* `UC-M12-02` — l'aperçu annonce le domaine qui SERA créé, et rien ne l'a
			   été : la cible est nulle tant que le lot n'est pas lancé. */
			domaineACreer: prepare.cible === null ? prepare.domaine : ''
		};
	},

	/**
	 * L'EXÉCUTION DU LOT — la même tâche en simulation et en réel (`RG-M12-02`). Les
	 * noms de champ sont ceux du gel ; le nom de la partie qui porte les fichiers n'a
	 * AUCUNE source, le gel n'ayant pas de champ de fichier.
	 */
	importer: async ({ locals, request, fetch }) => {
		const prepare = await preparerLeLot(locals, request, fetch, true);
		if ('refus' in prepare) return prepare.refus;
		/* Inatteignable : `ecrire` vaut vrai, et la cible est alors créée ou refusée.
		   Fermé par défaut plutôt que supposé impossible. */
		if (prepare.cible === null) return fail(400, { issue: 'domaine-inconnu' });

		/* LA DURÉE EST MESURÉE, JAMAIS ESTIMÉE — c'est celle que le journal porte et
		   que `/console/imports` affiche par lot. */
		const debut = Date.now();

		/* L'INDEX EST ENTRETENU PAR LE LOT — `RG-M12-08`. Le client est un
		   paramètre : un import ne peut pas s'exécuter sans dire par quel moteur ses
		   notes deviendront trouvables. */
		const rapport = await executerLImport(
			prepare.base,
			moteurPartage(),
			prepare.cible,
			prepare.plan,
			{
				simulation: prepare.simulation,
				profondeurDeDepart: prepare.profondeurDeDepart,
				strict: prepare.strict,
				domaineCible: prepare.domaine
			}
		);

		/* `RG-M12-09` — « chaque lot d'import produit une entrée de journal ». Elle
		   est composée sur le rapport, donc sur ce qui a réellement eu lieu, PUIS
		   ÉCRITE : `lots_d_import` la garde, `/console/imports` la relit, et le flux
		   d'activité de l'accueil la lit aussi. Les deux destinataires que la règle
		   nomme sont servis. */
		await enregistrerLeLot(
			prepare.base,
			entreeDeJournal(prepare.cible, rapport, new Date(), {
				scenario: prepare.scenario,
				domaine: prepare.domaine,
				dureeMs: Date.now() - debut
			})
		);

		/* Les titres des notes écrites. Le titre vient du PLAN — c'est celui qui a
		   été écrit —, et le sort de chaque ligne vient du RAPPORT : une note peut
		   avoir été mise à jour plutôt que créée, et le rapport seul le sait. */
		const ecrites = prepare.plan.lignes.filter((l) => l.sort === 'note');
		const parIdentifiant = new Map(
			rapport.lignes.filter((l) => l.identifiant !== null).map((l) => [l.identifiant, l])
		);

		return {
			issue: 'lot-traite',
			rapport: {
				simulation: rapport.simulation,
				/* `RG-M12-03`, mode strict — le lot est allé au bout puis a été
				   refusé en bloc. L'écran doit le dire : ses liens rendraient 404. */
				refuseEnBloc: rapport.refuseEnBloc,
				total: rapport.total,
				notesCreees: rapport.notesCreees,
				notesMisesAJour: rapport.notesMisesAJour,
				ignores: rapport.ignores,
				echecs: rapport.echecs,
				dossiersCrees: rapport.dossiersCrees,
				relationsCreees: rapport.relationsCreees,
				domaine: prepare.domaine,
				/* L'ADRESSE VIENT D'ICI, ET DE NULLE PART AILLEURS : un domaine que
				   `UC-M12-02` vient de créer n'est dans aucune liste servie à
				   l'ouverture de l'écran. */
				adresseDuDomaine: prepare.adresseDuDomaine,
				enEchec: rapport.lignes
					.filter((l) => l.sort === 'echec')
					.map((l) => ({ chemin: l.chemin, motif: l.motif ?? '' })),
				renvoisNonResolus: rapport.lignes
					.filter((l) => l.renvoisNonResolus.length > 0)
					.map((l) => ({ chemin: l.chemin, renvois: l.renvoisNonResolus })),
				ecrites: ecrites
					.filter((l) => l.identifiant !== null && parIdentifiant.has(l.identifiant))
					.map((l) => ({
						identifiant: l.identifiant as string,
						titre: l.titre ?? (l.identifiant as string),
						ou: l.segments.join(' › '),
						adresse: adresseDeNote(l.identifiant as string),
						miseAJour: parIdentifiant.get(l.identifiant)?.miseAJour ?? false
					}))
			}
		};
	}
};

function extensionDe(chemin: string): string {
	const point = chemin.lastIndexOf('.');
	return point <= 0 ? 'fichier' : chemin.slice(point + 1).toLowerCase();
}

/**
 * CE QUE LA CIBLE CONTIENT DÉJÀ — identifiant de note, et chemin de dossier SOUS la cible :
 * la matière de l'idempotence (`RG-M12-01`). L'arborescence est celle que `ouvrirLAcces()`
 * a déjà lue, et seul le sous-arbre de la cible est parcouru — une note rangée ailleurs
 * n'est pas une note de ce lot. La seconde sortie ne coûte rien : le parcours construit
 * déjà le chemin relatif de CHAQUE dossier, ceux que l'aperçu ne doit PAS annoncer comme
 * créés — les notes ne suffisaient pas, un dossier vide n'en portant aucune.
 */
async function contenuDeLaCible(
	base: Base,
	acces: AccesAuRangement,
	racineId: string
): Promise<{
	readonly notes: ReadonlyMap<string, string>;
	readonly dossiers: readonly string[];
}> {
	const enfants = new Map<string, { id: string; nom: string }[]>();
	for (const d of acces.dossiers) {
		if (d.parentId === null) continue;
		const fratrie = enfants.get(d.parentId) ?? [];
		fratrie.push({ id: d.id, nom: d.nom });
		enfants.set(d.parentId, fratrie);
	}

	/* Le chemin relatif de chaque dossier du sous-arbre, la cible valant ''. */
	const chemins = new Map<string, string>([[racineId, '']]);
	const aVisiter = [racineId];
	while (aVisiter.length > 0) {
		const courant = aVisiter.pop() as string;
		const prefixe = chemins.get(courant) ?? '';
		for (const enfant of enfants.get(courant) ?? []) {
			chemins.set(enfant.id, prefixe === '' ? enfant.nom : `${prefixe}/${enfant.nom}`);
			aVisiter.push(enfant.id);
		}
	}

	const lignes = await base
		.select({ identifiant: notesDuSchema.identifiant, dossierId: notesDuSchema.dossierId })
		.from(notesDuSchema);
	const carte = new Map<string, string>();
	for (const n of lignes) {
		const place = chemins.get(n.dossierId);
		if (place !== undefined) carte.set(n.identifiant, place);
	}
	/* La cible elle-même vaut `''` : elle n'est pas un dossier À CRÉER, et aucun
	   nœud de l'arborescence du lot ne porte ce chemin. Elle sort de la liste. */
	return { notes: carte, dossiers: [...chemins.values()].filter((c) => c !== '') };
}

/**
 * Les parties de la requête qui sont des fichiers, décodées quand on sait. DEUX
 * LECTURES, ET JAMAIS LES DEUX POUR LE MÊME FICHIER : un `.md` est du texte et
 * l'application le lit ; un `.docx` ne l'est pas, et l'application ne l'ouvre à
 * aucun moment — elle en passe les octets au service, isolé pour ça. Un fichier
 * écarté n'est ni lu ni transporté.
 */
async function deposes(champs: FormData): Promise<readonly FichierDepose[]> {
	const sortis: FichierDepose[] = [];
	for (const partie of champs.getAll('fichiers')) {
		if (typeof partie === 'string') continue;
		const format = formatDuChemin(partie.name);
		const voie = format === null ? 'ecarte' : VOIE_PAR_FORMAT[format];
		sortis.push({
			chemin: partie.name,
			octets: partie.size,
			texte: voie === 'application' ? await partie.text() : null,
			binaire: voie === 'service' ? new Uint8Array(await partie.arrayBuffer()) : null
		});
	}
	return sortis;
}

async function racineDuDomaine(base: Base, nom: string): Promise<CibleDuLot | null> {
	if (nom === '') return null;
	const lignes = await base
		.select({
			id: dossiers.id,
			domaineId: dossiers.domaineId,
			profondeur: dossiers.profondeur,
			parentId: dossiers.parentId,
			/* LES DEUX IDENTIFIANTS PERSISTÉS, POUR L'ADRESSE — jamais les noms
			   slugifiés : ils ne suivent pas les renommages (`ARB-001`). */
			domaineIdentifiant: domaines.identifiant,
			universIdentifiant: univers.identifiant
		})
		.from(dossiers)
		.innerJoin(domaines, eq(dossiers.domaineId, domaines.id))
		.innerJoin(univers, eq(univers.id, domaines.universId))
		.where(eq(domaines.nom, nom));
	const racine = lignes.find((l) => l.parentId === null);
	return racine === undefined
		? null
		: {
				id: racine.id,
				domaineId: racine.domaineId,
				profondeur: racine.profondeur,
				adresse: adresseDeDomaine(racine.universIdentifiant, racine.domaineIdentifiant)
			};
}
