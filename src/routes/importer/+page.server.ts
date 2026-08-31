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
	VOIE_PAR_FORMAT,
	classerLeLot,
	convertirLeLot,
	entreeDeJournal,
	executerLImport,
	formatDuChemin,
	identifiantsPris,
	libellesDeFormat,
	sonderLeServiceDeConversion,
	type FichierDepose
} from '$lib/donnees/import';
import { SCENARIO_LIVRE, scenarioEstLivre } from '$lib/donnees/scenarios-d-import';
import {
	droitEffectif,
	lireNotesLisibles,
	ouvrirLAcces,
	peutEcrireDansLUn,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import { moteurPartage } from '$lib/recherche/acces';
import { adresseDeNote } from '$lib/rangement/adresses';
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
	if (
		!peutEcrireDansLUn(
			acces,
			acces.dossiers.filter((d) => d.parentId === null).map((d) => d.id)
		)
	) {
		/* LE CODE RESTE 404 — SEULE LA PHRASE CHANGE, ET POUR UN SEUL CAS. Une
		   instance à zéro univers n'a aucune racine de domaine : l'administrateur qui
		   vient d'installer tombait sur un 404 nu, sans savoir que ce qui manque est
		   un univers. Tout autre compte, toute autre cause : `MESSAGE_INTROUVABLE`,
		   au même octet. */
		error(404, await refusDEcriture(base, identite));
	}

	return { base, acces, compteId: identite.compteId };
}

export const load: PageServerLoad = async ({ locals }) => {
	const { base, acces } = await importateur(locals);
	const cibles = await domainesOuEcrire(base, acces);

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
 * TOUT CE QU'UN LOT DEMANDE AVANT D'ÊTRE CLASSÉ. LES DEUX ACTIONS PARTAGENT CE
 * CHEMIN, ET C'EST LA CONDITION DE `RG-M12-02` : l'aperçu et l'exécution
 * traversent le MÊME `classerLeLot()`, avec les mêmes octets et le même contexte.
 */
async function preparerLeLot(locals: App.Locals, request: Request, fetch: typeof globalThis.fetch) {
	const { base, acces, compteId } = await importateur(locals);

	const champs = await request.formData();

	/* LE SCÉNARIO EST ÉPROUVÉ AVANT TOUT LE RESTE. L'étape 1 offrait trois
	   scénarios ; aucun n'était transmis, et cette action traitait les trois comme
	   `UC-M12-01`, le seul livré — un lot choisi « domaine complet » se rangeait
	   dans le domaine proposé PAR DÉFAUT. Un envoi qui le nommerait est REFUSÉ,
	   jamais dérivé en silence.

	   L'ABSENCE VAUT LE SCÉNARIO LIVRÉ : c'est le seul qui existe. */
	const scenario = String(champs.get('scenario') ?? SCENARIO_LIVRE);
	if (!scenarioEstLivre(scenario)) {
		return { refus: fail(400, { issue: 'scenario-non-livre' }) } as const;
	}

	const nomDuDomaine = String(champs.get('domaine-cible') ?? '');
	const simulation = champs.get('simulation') !== null;

	/* Le droit est éprouvé SUR LA CIBLE, et pas seulement à l'entrée : un compte
	   peut avoir le droit d'écrire quelque part, et pas ici. */
	const racine = await racineDuDomaine(base, nomDuDomaine);
	if (racine === null) return { refus: fail(400, { issue: 'domaine-inconnu' }) } as const;
	if (!capacites(droitEffectif(acces, racine.id)).ecrireDesNotes) {
		return { refus: fail(403, { issue: 'sans-droit-sur-la-cible' }) } as const;
	}

	const fichiers = await deposes(champs);
	if (fichiers.length === 0) return { refus: fail(400, { issue: 'lot-vide' }) } as const;

	/* L'ÉTAT DU SERVICE EST SONDÉ UNE FOIS PAR LOT, PUIS LE LOT EST CONVERTI AVANT
	   D'ÊTRE CLASSÉ. L'ordre n'est pas indifférent : le classement est synchrone et
	   sans réseau, condition pour que l'étape 3 soit une décision pure et que la
	   simulation n'ait rien de plus à faire que l'import réel (`RG-M12-02`). */
	const service = await sonderLeServiceDeConversion(fetch, env['URL_CONVERSION']);
	const conversions = await convertirLeLot(fetch, env['URL_CONVERSION'], fichiers, service);

	/* `RG-M12-01` — ce que la cible contient déjà, et OÙ : ce qui permet à un
	   réimport de retrouver ses notes plutôt que d'en créer des copies suffixées.
	   Sans cette carte, l'idempotence n'a aucun discriminant. */
	const cible = await contenuDeLaCible(base, acces, racine.id);

	const plan = classerLeLot(nomDuDomaine, fichiers, {
		service,
		conversions,
		identifiantsPris: await identifiantsPris(base),
		notesDeLaCible: cible.notes,
		profondeurDeDepart: racine.profondeur
	});

	return {
		base,
		plan,
		simulation,
		/* LE CONTENU DE LA CIBLE REMONTE AVEC LE PLAN, et c'est le correctif de
		   l'aperçu menteur : le classement l'a consulté, il ne l'a pas consigné. */
		contenuDeLaCible: cible,
		cible: { domaineId: racine.domaineId, dossierId: racine.id, auteurId: compteId },
		profondeurDeDepart: racine.profondeur,
		domaine: nomDuDomaine
	} as const;
}

export const actions: Actions = {
	/**
	 * L'APERÇU — `UC-M12-04` étape 3, « rien n'a encore été écrit » : `classerLeLot()` n'a
	 * pas de base, et la promesse tient par construction. LES MOTIFS SONT DES CODES, la mise
	 * en français est dans la vue. CE QUE LA CIBLE PORTE DÉJÀ VOYAGE AVEC LE LOT — `maj` par
	 * ligne, et les dossiers existants ; sans eux, l'aperçu comptait tout comme neuf.
	 */
	analyser: async ({ locals, request, fetch }) => {
		const prepare = await preparerLeLot(locals, request, fetch);
		if ('refus' in prepare) return prepare.refus;

		return {
			issue: 'lot-analyse',
			lot: {
				source: prepare.domaine,
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
			dossiersExistants: prepare.contenuDeLaCible.dossiers
		};
	},

	/**
	 * L'EXÉCUTION DU LOT — la même tâche en simulation et en réel (`RG-M12-02`). Les
	 * noms de champ sont ceux du gel ; le nom de la partie qui porte les fichiers n'a
	 * AUCUNE source, le gel n'ayant pas de champ de fichier.
	 */
	importer: async ({ locals, request, fetch }) => {
		const prepare = await preparerLeLot(locals, request, fetch);
		if ('refus' in prepare) return prepare.refus;

		/* L'INDEX EST ENTRETENU PAR LE LOT — `RG-M12-08`. Le client est un
		   paramètre : un import ne peut pas s'exécuter sans dire par quel moteur ses
		   notes deviendront trouvables. */
		const rapport = await executerLImport(
			prepare.base,
			moteurPartage(),
			prepare.cible,
			prepare.plan,
			{ simulation: prepare.simulation, profondeurDeDepart: prepare.profondeurDeDepart }
		);

		/* `RG-M12-09` — « chaque lot d'import produit une entrée de journal ». Elle
		   est composée sur le rapport, donc sur ce qui a réellement eu lieu. Ce
		   qu'elle n'a pas : aucune table ne la garde, la console des imports ne la
		   relira pas. */
		console.info('[import]', JSON.stringify(entreeDeJournal(prepare.cible, rapport, new Date())));

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
				total: rapport.total,
				notesCreees: rapport.notesCreees,
				notesMisesAJour: rapport.notesMisesAJour,
				ignores: rapport.ignores,
				echecs: rapport.echecs,
				dossiersCrees: rapport.dossiersCrees,
				domaine: prepare.domaine,
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

async function racineDuDomaine(
	base: Base,
	nom: string
): Promise<{
	readonly id: string;
	readonly domaineId: string;
	readonly profondeur: number;
} | null> {
	if (nom === '') return null;
	const lignes = await base
		.select({
			id: dossiers.id,
			domaineId: dossiers.domaineId,
			profondeur: dossiers.profondeur,
			parentId: dossiers.parentId
		})
		.from(dossiers)
		.innerJoin(domaines, eq(dossiers.domaineId, domaines.id))
		.where(eq(domaines.nom, nom));
	const racine = lignes.find((l) => l.parentId === null);
	return racine === undefined
		? null
		: { id: racine.id, domaineId: racine.domaineId, profondeur: racine.profondeur };
}
