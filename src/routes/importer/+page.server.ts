/**
 * `/importer` — LE CHARGEUR ET L'ACTION de V-24.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE FICHIER FERME UNE FUITE MESURÉE, ET IL FAUT DIRE LAQUELLE
 *
 * `ECART-047` É-1, et la batterie 6 le remesurait encore le 20 août :
 *
 *     [matrice] /importer · contributeur-sans-droit
 *         attendu refus-404, obtenu servi (200, 14 927 o)
 *     [matrice] /importer · lecteur
 *         attendu refus-404, obtenu servi (200, 14 927 o)
 *
 * Quinze kilo-octets d'écran d'import — l'arborescence complète des univers et
 * des domaines par le rail, le compte, les actions — servis à un contributeur
 * SANS le moindre droit de rédaction, et à un lecteur. La route n'avait pas de
 * chargeur : elle rendait l'état de maquette, quel que soit l'appelant.
 *
 * `docs/routes.md:157` fixe le niveau — « connecté + rédacteur » — et la
 * matrice §5.5 (`:370`) le rendu de chaque colonne : **302** vers la connexion
 * en anonyme, **404** pour un connecté sans droit de rédaction, **V-24** pour
 * les deux autres.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA REDIRECTION ANONYME N'EST PAS ÉCRITE ICI, ET C'EST VOULU
 *
 * `src/lib/auth/garde.ts:110` range `/importer` au régime `redirection`, et
 * `src/hooks.server.ts` l'applique AVANT toute route, pour le GET comme pour le
 * POST. La réécrire ici ferait deux définitions d'une même règle, dont l'une
 * finirait par mentir. L'anonyme est donc traité ici comme un cas
 * INATTEIGNABLE — et fermé par défaut tout de même, parce qu'une omission le
 * jour où le régime changerait serait une fuite.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI — T-011
 *
 * `src/lib/droits/resolution.ts` est l'implémentation unique. Ce fichier passe
 * par `ouvrirLAcces()`, `peutEcrireDansLUn()` et `droitEffectif()` de
 * `src/lib/donnees/rangement.ts`, qui appellent `capacites()` : c'est la table
 * de CDC §2.3 qui décide qu'un rédacteur écrit des notes et qu'un lecteur n'en
 * écrit pas, jamais une comparaison recopiée ici.
 *
 * LE DROIT EST CHERCHÉ SUR TOUS LES DOSSIERS DU PRODUIT, et c'est la question
 * que l'adresse pose : `/importer` n'est pas l'import d'un domaine, c'est
 * l'écran d'import. Un compte qui peut écrire dans un seul sous-dossier d'un
 * seul domaine a quelque chose à y importer ; `RG-DRO-05` ne réserve pas
 * l'écriture aux porteurs d'un droit de racine, et l'exiger fermerait une porte
 * que les droits ouvrent.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL CHEMIN DE SORTIE EN REFUS — ADR-007, RG-ACC-04
 *
 * Les `error(404, MESSAGE_INTROUVABLE)` de ce fichier sont SANS MESSAGE, et c'est délibéré : un
 * message passé à `error()` entrerait dans le corps rendu et rendrait le refus
 * discernable d'une inexistence.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE CHARGEUR PASSE, ET CE QU'IL NE PASSE PAS
 *
 *   `notes`         — le périmètre de LECTURE de l'appelant, jamais le corpus.
 *                     La coquille en déduit le rail ; le corpus entier
 *                     publierait la structure interne (`RG-ACC-01`).
 *   `vecteur`       — `null`. L'étape du parcours n'est pas dans l'adresse :
 *                     `docs/routes.md:297` le tranche — « un parcours qui porte
 *                     des fichiers déposés n'est pas restaurable depuis une
 *                     adresse ». Une requête directe rend TOUJOURS l'étape 1.
 *   `lotImport`     — VIDE, parce que rien n'a été déposé. Le jeu de semence en
 *                     porte un de trente fichiers, tiré d'un partage réseau
 *                     fictif : le servir depuis une route serait une valeur
 *                     illustrative, et `P-02` n'en admet aucune. Le lot analysé
 *                     arrive plus tard, par l'action `analyser`.
 *   `formatsImport` — la table des libellés, servie par le module d'import qui
 *                     connaît les formats (`libellesDeFormat()`).
 *
 * `univers`, `domaines`, `compte` et `instance` NE SONT PAS PASSÉS, et l'écart
 * est déclaré au rapport du lot : la coquille de toutes les routes montées lit
 * encore ces quatre sources dans le jeu de semence, et les brancher est un
 * sujet transverse qu'un lot d'import ne peut pas trancher pour les trente
 * autres routes.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX ACTIONS, ET ELLES SONT TOUTES DEUX NOMMÉES
 *
 * `analyser` CLASSE sans rien écrire — c'est l'étape 3 de `UC-M12-04`, « rien
 * n'a encore été écrit. Vérifiez l'arborescence détectée […] puis validez ou
 * renoncez » —, et `importer` exécute. Deux actions nommées, jamais une action
 * par défaut : SvelteKit rend 500 quand les deux régimes cohabitent.
 *
 * LE LOT EST ENVOYÉ DEUX FOIS, ET C'EST ASSUMÉ. Le produit ne garde aucun état
 * de parcours entre deux requêtes — `docs/routes.md:297` le tranche pour
 * l'adresse, et rien ne le stocke ailleurs. Les fichiers restent donc dans le
 * navigateur, qui les redépose pour l'exécution. La contrepartie est une
 * propriété : l'analyse et l'exécution partent des MÊMES octets et traversent
 * le MÊME `classerLeLot()`, donc l'aperçu ne peut pas mentir sur ce qui suivra.
 */
import { eq, isNull } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { basePartagee, type Base } from '$lib/base/acces';
import { domaines, dossiers, notes as notesDuSchema } from '$lib/base/schema';
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
import {
	droitEffectif,
	lireNotesLisibles,
	ouvrirLAcces,
	peutEcrireDansLUn,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import { moteurPartage } from '$lib/recherche/acces';
import { adresseDeNote } from '$lib/rangement/adresses';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

/**
 * L'appelant et son droit d'importer — le seul point d'entrée du fichier.
 *
 * Le chargeur et l'action le franchissent tous deux, et aucun ne peut donc
 * l'oublier : un POST qui contournerait la garde du GET serait la même fuite,
 * par l'autre verbe.
 */
async function importateur(locals: App.Locals): Promise<{
	readonly base: Base;
	readonly acces: AccesAuRangement;
	readonly compteId: string;
}> {
	const identite = locals.identite;
	/* Inatteignable : `regimeDe('/importer')` vaut `redirection`, et les hooks
	   ont déjà répondu 302. Fermé par défaut plutôt que supposé impossible. */
	if (identite.type !== 'authentifie') error(404, MESSAGE_INTROUVABLE);

	const base = basePartagee();
	const acces = await ouvrirLAcces(base, identite, new Date());
	if (
		!peutEcrireDansLUn(
			acces,
			acces.dossiers.map((d) => d.id)
		)
	) {
		error(404, MESSAGE_INTROUVABLE);
	}

	return { base, acces, compteId: identite.compteId };
}

export const load: PageServerLoad = async ({ locals }) => {
	const { base, acces } = await importateur(locals);

	return {
		vecteur: null,
		/**
		 * « LAISSER TOURNER EN ARRIÈRE-PLAN » MÈNE À LA CONSOLE, ET ELLE EST
		 * RÉSERVÉE — `V-24:3383` : « suivez-le depuis la console, onglet Imports,
		 * vue V-35 ». `docs/routes.md:167` : toutes les routes de console exigent
		 * le rôle administrateur, et un autre compte y reçoit 404.
		 *
		 * Le bouton n'est donc POSÉ que pour l'administrateur (`P-09` : une action
		 * interdite n'est pas rendue). C'est le seul usage de cette valeur ; elle
		 * ne dit rien d'autre que « ce bouton a une destination atteignable ».
		 */
		suiviEnConsole:
			locals.identite.type === 'authentifie' && locals.identite.role === 'administrateur',
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte),
		/* Rien n'a été déposé : le lot est vide, et il le dit. */
		lotImport: { source: '', fichiers: [] },
		formatsImport: libellesDeFormat(),
		/* Le domaine proposé au dépôt : le premier où l'appelant a le droit
		   d'écrire. Il n'est pas « son » domaine — un compte peut n'avoir aucun
		   droit d'écriture sur le domaine auquel il est rattaché —, et le proposer
		   quand même ferait choisir par défaut une cible que la soumission
		   refuserait (`P-09`, esprit : pas de porte fermée). */
		domaineParDefaut: await premierDomaineOuEcrire(base, acces)
	};
};

/**
 * LE PREMIER DOMAINE OÙ L'APPELANT PEUT ÉCRIRE, ou la chaîne vide s'il n'y en a
 * aucun — auquel cas la garde d'entrée l'aurait déjà refusé.
 *
 * L'ordre est celui des domaines en base, et il est déterministe : « premier »
 * veut dire quelque chose. Le droit est demandé à `capacites(droitEffectif())`,
 * l'implémentation unique, jamais recalculé.
 */
async function premierDomaineOuEcrire(base: Base, acces: AccesAuRangement): Promise<string> {
	const racines = await base
		.select({ nom: domaines.nom, dossierId: dossiers.id })
		.from(dossiers)
		.innerJoin(domaines, eq(dossiers.domaineId, domaines.id))
		.where(isNull(dossiers.parentId))
		.orderBy(domaines.nom);
	for (const r of racines) {
		if (capacites(droitEffectif(acces, r.dossierId)).ecrireDesNotes) return r.nom;
	}
	return '';
}

/**
 * TOUT CE QU'UN LOT DEMANDE AVANT D'ÊTRE CLASSÉ — la cible, le droit sur elle,
 * les fichiers, l'état du service et le classement.
 *
 * LES DEUX ACTIONS PARTAGENT CE CHEMIN, ET C'EST LA CONDITION DE `RG-M12-02` :
 * l'aperçu et l'exécution traversent le MÊME `classerLeLot()`, avec les mêmes
 * octets et le même contexte. Deux chemins de classement auraient fini par
 * diverger, et l'aperçu aurait menti sur ce qui allait suivre.
 */
async function preparerLeLot(locals: App.Locals, request: Request, fetch: typeof globalThis.fetch) {
	const { base, acces, compteId } = await importateur(locals);

	const champs = await request.formData();
	const nomDuDomaine = String(champs.get('domaine-cible') ?? '');
	const simulation = champs.get('simulation') !== null;

	/* Le droit est éprouvé SUR LA CIBLE, et pas seulement à l'entrée : un
	   compte peut avoir le droit d'écrire quelque part, et pas ici. */
	const racine = await racineDuDomaine(base, nomDuDomaine);
	if (racine === null) return { refus: fail(400, { issue: 'domaine-inconnu' }) } as const;
	if (!capacites(droitEffectif(acces, racine.id)).ecrireDesNotes) {
		return { refus: fail(403, { issue: 'sans-droit-sur-la-cible' }) } as const;
	}

	const fichiers = await deposes(champs);
	if (fichiers.length === 0) return { refus: fail(400, { issue: 'lot-vide' }) } as const;

	/* L'ÉTAT DU SERVICE EST SONDÉ UNE FOIS PAR LOT, PUIS LE LOT EST CONVERTI
	   AVANT D'ÊTRE CLASSÉ. L'ordre n'est pas indifférent : le classement est
	   synchrone et sans réseau, ce qui est la condition pour que l'étape 3 de
	   `UC-M12-04` soit une décision pure et que la simulation n'ait rien de
	   plus à faire que l'import réel (`RG-M12-02`). */
	const service = await sonderLeServiceDeConversion(fetch, env['URL_CONVERSION']);
	const conversions = await convertirLeLot(fetch, env['URL_CONVERSION'], fichiers, service);

	const plan = classerLeLot(nomDuDomaine, fichiers, {
		service,
		conversions,
		identifiantsPris: await identifiantsPris(base),
		/* `RG-M12-01` — ce que la cible contient déjà, et OÙ. C'est ce qui permet
		   à un réimport de retrouver ses notes plutôt que d'en créer des copies
		   suffixées. Sans cette carte, l'idempotence n'a aucun discriminant. */
		notesDeLaCible: await notesDeLaCible(base, acces, racine.id),
		profondeurDeDepart: racine.profondeur
	});

	return {
		base,
		plan,
		simulation,
		cible: { domaineId: racine.domaineId, dossierId: racine.id, auteurId: compteId },
		profondeurDeDepart: racine.profondeur,
		domaine: nomDuDomaine
	} as const;
}

export const actions: Actions = {
	/**
	 * L'APERÇU — `UC-M12-04` étape 3, « rien n'a encore été écrit ».
	 *
	 * Cette action CLASSE et ne touche pas à la base : `classerLeLot()` n'a pas
	 * de base, et c'est ce qui rend la promesse tenable par construction plutôt
	 * que par discipline. Le lot rendu est dans la forme que V-24 lit déjà —
	 * chemin, format, taille, sort, motif —, de sorte que l'arborescence, le
	 * récapitulatif chiffré et les fichiers écartés se dérivent à l'écran par
	 * les mêmes fonctions que le gel emploie.
	 *
	 * LES MOTIFS SONT DES CODES, et ils le restent : leur mise en français est
	 * dans la vue (`LIBELLE_DU_MOTIF`), là où `import.ts` a toujours dit qu'elle
	 * devait aller.
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
					   formats et retombe sur la valeur brute quand elle n'y figure pas.
					   Un fichier dont l'extension n'est d'aucun format connu porte donc
					   son extension, ce qui est exactement ce que l'écran doit montrer. */
					f: l.format ?? extensionDe(l.chemin),
					o: 0,
					s: l.sort,
					...(l.motif === null ? {} : { m: l.motif })
				}))
			}
		};
	},

	/**
	 * L'EXÉCUTION DU LOT — la même tâche en simulation et en réel (`RG-M12-02`).
	 *
	 * LES NOMS DE CHAMP SONT CEUX DU GEL — `domaine-cible` et `simulation` sont
	 * les identifiants que porte V-24 (`ARB-054` §3, convention déjà appliquée
	 * par `/mon-profil`). Le nom de la partie qui porte les fichiers, lui, n'a
	 * AUCUNE source : le gel n'a pas de champ de fichier. Il est déclaré au
	 * rapport du lot comme le seul choix non fondé de ce fichier.
	 */
	importer: async ({ locals, request, fetch }) => {
		const prepare = await preparerLeLot(locals, request, fetch);
		if ('refus' in prepare) return prepare.refus;

		/* L'INDEX EST ENTRETENU PAR LE LOT — `RG-M12-08`. Le client est un
		   paramètre : un import ne peut pas s'exécuter sans dire par quel moteur
		   ses notes deviendront trouvables. */
		const rapport = await executerLImport(
			prepare.base,
			moteurPartage(),
			prepare.cible,
			prepare.plan,
			{ simulation: prepare.simulation, profondeurDeDepart: prepare.profondeurDeDepart }
		);

		/* `RG-M12-09` — « chaque lot d'import produit une entrée de journal
		   (source, volume, erreurs, auteur, date) ». Elle est composée sur le
		   rapport, donc sur ce qui a réellement eu lieu, et écrite au journal
		   d'application. Ce qu'elle n'a pas, et que le rapport dit lui-même :
		   aucune table ne la garde, la console des imports ne la relira pas. */
		console.info('[import]', JSON.stringify(entreeDeJournal(prepare.cible, rapport, new Date())));

		/* Les titres des notes écrites, pour la section « Notes créées » du
		   rapport. Le titre vient du PLAN — c'est celui qui a été écrit —, et le
		   sort de chaque ligne vient du RAPPORT : une note peut avoir été mise à
		   jour plutôt que créée (`RG-M12-01`), et le rapport seul le sait. */
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

/** L'extension d'un chemin, en minuscules — la marque d'un format inconnu. */
function extensionDe(chemin: string): string {
	const point = chemin.lastIndexOf('.');
	return point <= 0 ? 'fichier' : chemin.slice(point + 1).toLowerCase();
}

/**
 * CE QUE LA CIBLE CONTIENT DÉJÀ — identifiant de note, et chemin de dossier
 * SOUS la cible. La matière de l'idempotence (`RG-M12-01`).
 *
 * L'arborescence est celle que `ouvrirLAcces()` a déjà lue : elle n'est pas
 * relue. Seul le sous-arbre de la cible est parcouru — une note rangée ailleurs
 * n'est pas une note de ce lot, et son identifiant reste une collision au sens
 * de `RG-M12-11`.
 */
async function notesDeLaCible(
	base: Base,
	acces: AccesAuRangement,
	racineId: string
): Promise<ReadonlyMap<string, string>> {
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
	return carte;
}

/**
 * Les parties de la requête qui sont des fichiers, décodées quand on sait.
 *
 * DEUX LECTURES, ET JAMAIS LES DEUX POUR LE MÊME FICHIER. Un `.md` est du
 * texte, et l'application le lit ; un `.docx` ne l'est pas, et l'application ne
 * l'ouvre à aucun moment — elle en prend les octets et les passe au service,
 * qui est isolé précisément pour ça (`STACK` §4.6). Un fichier écarté n'est ni
 * lu ni transporté : le classement le refusera sur sa seule extension.
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

/** La racine du domaine désigné par son nom, ou `null`. */
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
