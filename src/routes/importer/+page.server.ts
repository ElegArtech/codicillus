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
 *                     illustrative, et `P-02` n'en admet aucune. Le rendu ne
 *                     bouge pas d'un pixel — le lot n'est lu qu'aux étapes 3 et
 *                     4, qu'une requête directe n'atteint pas.
 *   `formatsImport` — la table des libellés, servie par le module d'import qui
 *                     connaît les formats (`libellesDeFormat()`).
 *
 * `univers`, `domaines`, `compte` et `instance` NE SONT PAS PASSÉS, et l'écart
 * est déclaré au rapport du lot : la coquille de toutes les routes montées lit
 * encore ces quatre sources dans le jeu de semence, et les brancher est un
 * sujet transverse qu'un lot d'import ne peut pas trancher pour les trente
 * autres routes.
 */
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { basePartagee, type Base } from '$lib/base/acces';
import { domaines, dossiers } from '$lib/base/schema';
import { capacites } from '$lib/droits/resolution';
import {
	VOIE_PAR_FORMAT,
	classerLeLot,
	convertirLeLot,
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
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte),
		/* Rien n'a été déposé : le lot est vide, et il le dit. */
		lotImport: { source: '', fichiers: [] },
		formatsImport: libellesDeFormat()
	};
};

export const actions: Actions = {
	/**
	 * LE DÉPÔT D'UN LOT — la même tâche en simulation et en réel (`RG-M12-02`).
	 *
	 * AUCUNE SOUMISSION NE L'ATTEINT ENCORE, et il faut le dire : le gel de V-24
	 * ne porte ni méthode ni cible sur quoi que ce soit, et son bouton de
	 * parcours n'a aucun champ de fichier derrière lui — le dépôt y est un
	 * comportement de navigateur, du temps 3 (`ARB-011`), et `src/vues/` est
	 * hors du périmètre de ce lot. C'est la situation exacte des trois actions
	 * de `/mon-profil` et de celle de `/connexion` avant le lot qui a relié leur
	 * formulaire.
	 *
	 * LES NOMS DE CHAMP SONT CEUX DU GEL — `domaine-cible` et `simulation` sont
	 * les identifiants que porte V-24 (`ARB-054` §3, convention déjà appliquée
	 * par `/mon-profil`). Le nom de la partie qui porte les fichiers, lui, n'a
	 * AUCUNE source : le gel n'a pas de champ de fichier. Il est déclaré au
	 * rapport du lot comme le seul choix non fondé de ce fichier.
	 */
	importer: async ({ locals, request, fetch }) => {
		const { base, acces, compteId } = await importateur(locals);

		const champs = await request.formData();
		const nomDuDomaine = String(champs.get('domaine-cible') ?? '');
		const simulation = champs.get('simulation') !== null;

		/* Le droit est éprouvé SUR LA CIBLE, et pas seulement à l'entrée : un
		   compte peut avoir le droit d'écrire quelque part, et pas ici. */
		const racine = await racineDuDomaine(base, nomDuDomaine);
		if (racine === null) return fail(400, { issue: 'domaine-inconnu' });
		if (!capacites(droitEffectif(acces, racine.id)).ecrireDesNotes) {
			return fail(403, { issue: 'sans-droit-sur-la-cible' });
		}

		const fichiers = await deposes(champs);
		if (fichiers.length === 0) return fail(400, { issue: 'lot-vide' });

		/* L'ÉTAT DU SERVICE EST SONDÉ UNE FOIS PAR LOT, PUIS LE LOT EST CONVERTI
		   AVANT D'ÊTRE CLASSÉ. L'ordre n'est pas indifférent : le classement est
		   synchrone et sans réseau, ce qui est la condition pour que l'étape 3 de
		   `UC-M12-04` soit une décision pure et que la simulation n'ait rien de
		   plus à faire que l'import réel (`RG-M12-02`). */
		const service = await sonderLeServiceDeConversion(fetch, env['URL_CONVERSION']);
		const conversions = await convertirLeLot(fetch, env['URL_CONVERSION'], fichiers, service);

		const plan = classerLeLot(`Dépôt — ${fichiers.length} fichier(s)`, fichiers, {
			service,
			conversions,
			identifiantsPris: await identifiantsPris(base),
			profondeurDeDepart: racine.profondeur
		});

		/* L'INDEX EST ENTRETENU PAR LE LOT — `RG-M12-08`. Le client est un
		   paramètre : un import ne peut pas s'exécuter sans dire par quel moteur
		   ses notes deviendront trouvables. */
		const rapport = await executerLImport(
			base,
			moteurPartage(),
			{ domaineId: racine.domaineId, dossierId: racine.id, auteurId: compteId },
			plan,
			{ simulation, profondeurDeDepart: racine.profondeur }
		);

		return { issue: 'lot-traite', rapport };
	}
};

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
