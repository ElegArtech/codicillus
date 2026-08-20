#!/usr/bin/env node
/**
 * LE CHARGEMENT DU JEU DE VOLUMÉTRIE HAUTE — lot T-055.
 *
 * `seeds/volumetrie.ts` ENGENDRE le jeu ; ce module l'ÉCRIT, le retire, et
 * compte ce qu'il a posé. La séparation est celle de `seeds/corpus.ts` et de
 * `src/lib/base/semence.ts`, et pour la même raison : ce qui est engendré est
 * une donnée pure, éprouvable sans base ; ce qui écrit a besoin d'une base et
 * n'a rien à faire dans un unitaire.
 *
 * IL NE TOUCHE PAS AU CORPUS GELÉ. Aucune ligne existante n'est modifiée ni
 * supprimée : le jeu se pose PAR-DESSUS une base déjà semée, dont il réemploie
 * les référentiels — types de note, types de relation, étiquettes. Le retrait
 * se fait par préfixe (`lignesDeRetrait`), donc il ne peut pas emporter une
 * ligne du corpus.
 *
 * LE CHARGEMENT EST PAR PALIERS. Le palier 0 porte la volumétrie annoncée par
 * le cahier ; les paliers suivants ne font grossir que l'univers du graphe de
 * V-19, pour que `R-01` se mesure sur une COURBE et non sur un point.
 *
 * Usage :
 *   node verif/volumetrie.mjs charger [--palier=n]   pose les paliers 0..n
 *   node verif/volumetrie.mjs retirer                retire tout le jeu
 *   node verif/volumetrie.mjs etat                   ce que la base porte
 *
 * Codes de retour : 0 si la commande a prouvé ce qu'elle annonce, 1 sinon.
 */
import { argv, exit } from 'node:process';
import { join } from 'node:path';
import { racine } from './banc/inventaire.mjs';

/* ═════════════════════════════════════════ La base, et rien d'autre ═════ */

/** Le bassin de connexions, lu comme `verif/etancheite.mjs` le lit (ARB-038 :
 *  des variables séparées, JAMAIS une URI — `P-13`). */
export async function ouvrirLeBassin() {
	const pg = (await import('pg')).default;
	try {
		process.loadEnvFile(join(racine, '.env'));
	} catch {
		/* Pas de `.env` : l'environnement du processus fait foi (`base/base.mjs`). */
	}
	return new pg.Pool({
		host: process.env.HOTE_BASE ?? process.env.HOTE_POSTGRES ?? '127.0.0.1',
		port: Number(process.env.PORT_BASE ?? process.env.PORT_DB ?? 19432),
		user: process.env.UTILISATEUR_BASE ?? process.env.UTILISATEUR_POSTGRES ?? 'codicillus',
		password: process.env.MDP_BASE ?? process.env.MDP_POSTGRES,
		database: process.env.NOM_BASE ?? process.env.BASE_POSTGRES ?? 'codicillus'
	});
}

/** Charge `seeds/volumetrie.ts` par le chemin de modules du dépôt (`base/base.mjs`). */
export async function chargerLeGenerateur() {
	const { createServer } = await import('vite');
	const vite = await createServer({
		server: { middlewareMode: true },
		appType: 'custom',
		logLevel: 'error'
	});
	const module = await vite.ssrLoadModule('/seeds/volumetrie.ts');
	return { module, fermer: () => vite.close() };
}

/* ═══════════════════════════════════════════════ Ce qui existe déjà ═════ */

/**
 * L'existant, MESURÉ dans la base — jamais recopié d'une source.
 * @param {import('pg').Pool} bassin
 * @param {string} universDuGraphe l'univers de `PERIMETRE_DE_V19`
 */
export async function lireExistant(bassin, universDuGraphe) {
	/* CE QUE CE MODULE A DÉJÀ POSÉ NE COMPTE PAS COMME EXISTANT — et c'est la
	   propriété qui rend le chargement IDEMPOTENT et les paliers cumulables.
	   Sans le crible par préfixe, un second appel lit 5 000 notes là où le
	   corpus gelé en pose 32, le générateur rend un autre jeu, ses identifiants
	   entrent en collision avec ceux du premier chargement, et TOUT est écarté
	   comme déjà posé : la base ne bouge plus d'une ligne et le palier suivant
	   mesure le précédent. Mesuré au premier essai — cinq paliers identiques à
	   500 nœuds. */
	const hors = "identifiant not like 'vol-%'";
	const univers = await bassin.query(`select nom from univers where ${hors} order by ordre, nom`);
	const domaines = await bassin.query(
		`select u.nom as univers, d.nom as domaine from domaines d join univers u on u.id = d.univers_id
		  where d.identifiant not like 'vol-%' and u.identifiant not like 'vol-%' order by d.nom`
	);
	const notes = await bassin.query(`select count(*)::int as n from notes where ${hors}`);
	const comptes = await bassin.query(`select count(*)::int as n from comptes where ${hors}`);
	const dansLeGraphe = await bassin.query(
		`select count(*)::int as n from notes n
		   join domaines d on d.id = n.domaine_id
		   join univers u on u.id = d.univers_id
		  where u.nom = $1 and n.identifiant not like 'vol-%'`,
		[universDuGraphe]
	);
	/** @type {Map<string, string[]>} */
	const parUnivers = new Map();
	for (const ligne of domaines.rows) {
		const liste = parUnivers.get(ligne.univers) ?? [];
		liste.push(ligne.domaine);
		parUnivers.set(ligne.univers, liste);
	}
	return {
		universExistants: univers.rows.map((u) => u.nom),
		domainesExistants: parUnivers,
		universDuGraphe,
		notesDejaDansLeGraphe: dansLeGraphe.rows[0]?.n ?? 0,
		notesExistantes: notes.rows[0]?.n ?? 0,
		comptesExistants: comptes.rows[0]?.n ?? 0
	};
}

/* ═════════════════════════════════════════════════ Le chargement ════════ */

/** Insère par tranches : une requête de 5 000 lignes tient en mémoire, pas en
 *  paramètres — PostgreSQL en plafonne le nombre à 65 535. */
async function insererParTranches(bassin, entete, colonnes, lignes, suffixe = '') {
	const parTranche = Math.max(1, Math.floor(60_000 / colonnes));
	for (let d = 0; d < lignes.length; d += parTranche) {
		const tranche = lignes.slice(d, d + parTranche);
		const valeurs = [];
		const gabarits = tranche.map((ligne, i) => {
			const jetons = ligne.map((_, j) => `$${i * colonnes + j + 1}`);
			valeurs.push(...ligne);
			return `(${jetons.join(',')})`;
		});
		await bassin.query(`${entete} values ${gabarits.join(',')} ${suffixe}`, valeurs);
	}
}

/**
 * Pose les paliers 0 à `palier`. Chaque palier n'est posé qu'une fois : les
 * notes déjà présentes sont reconnues à leur identifiant.
 *
 * @param {import('pg').Pool} bassin
 * @param {{volumes: object, comptes: object[], univers: object[], domaines: object[],
 *   dossiers: object[], notes: object[], relations: object[]}} jeu
 * @param {(texte: string) => object} corpsDeNote
 * @param {number} palier
 */
export async function charger(bassin, jeu, corpsDeNote, palier) {
	const pose = {
		univers: 0,
		domaines: 0,
		dossiers: 0,
		comptes: 0,
		notes: 0,
		etiquettesDeNote: 0,
		relations: 0
	};

	/* ── Les référentiels du corpus gelé, réemployés tels quels ──────────── */
	const typesDeNote = (await bassin.query('select id from types_de_note order by ordre')).rows;
	const typesDeRelation = (await bassin.query('select id from types_de_relation order by ordre'))
		.rows;
	const etiquettes = (await bassin.query('select id from etiquettes order by libelle')).rows;
	if (typesDeNote.length === 0 || typesDeRelation.length === 0 || etiquettes.length === 0) {
		throw new Error(
			'la base ne porte pas les référentiels du corpus gelé : semer avant de charger la volumétrie'
		);
	}

	/* ── Univers et domaines (palier 0 seulement) ───────────────────────── */
	if (palier >= 0) {
		const dejaU = new Set(
			(
				await bassin.query("select identifiant from univers where identifiant like 'vol-%'")
			).rows.map((r) => r.identifiant)
		);
		const aPoser = jeu.univers.filter((u) => !dejaU.has(u.identifiant));
		if (aPoser.length > 0) {
			const depart = (await bassin.query('select coalesce(max(ordre), 0)::int as m from univers'))
				.rows[0].m;
			await insererParTranches(
				bassin,
				'insert into univers (identifiant, nom, description, couleur, glyphe, ordre)',
				6,
				aPoser.map((u, i) => [
					u.identifiant,
					u.nom,
					'Univers engendré par seeds/volumetrie.ts — lot T-055.',
					'#3e5266',
					'□',
					depart + i + 1
				])
			);
			pose.univers = aPoser.length;
		}

		const idsUnivers = new Map(
			(await bassin.query('select id, nom from univers')).rows.map((r) => [r.nom, r.id])
		);
		const dejaD = new Set(
			(
				await bassin.query("select identifiant from domaines where identifiant like 'vol-%'")
			).rows.map((r) => r.identifiant)
		);
		const domainesAPoser = jeu.domaines.filter((d) => !dejaD.has(d.identifiant));
		if (domainesAPoser.length > 0) {
			await insererParTranches(
				bassin,
				'insert into domaines (univers_id, identifiant, nom, description, couleur)',
				5,
				domainesAPoser.map((d) => [
					idsUnivers.get(d.universNom),
					d.identifiant,
					d.nom,
					'Domaine engendré par seeds/volumetrie.ts — lot T-055.',
					d.couleur
				])
			);
			pose.domaines = domainesAPoser.length;
			const idsDomaines = (
				await bassin.query("select id from domaines where identifiant like 'vol-%'")
			).rows;
			const modules = ['notes', 'dossiers', 'fiches', 'cartographie', 'signets', 'carte_mentale'];
			await insererParTranches(
				bassin,
				'insert into modules_de_domaine (domaine_id, module)',
				2,
				idsDomaines.flatMap((d) => modules.map((m) => [d.id, m])),
				'on conflict do nothing'
			);
			/* La RACINE de chaque domaine engendré. Le générateur n'en pose pas :
			   il commence au niveau 2, et un domaine du corpus gelé a déjà la
			   sienne. */
			await insererParTranches(
				bassin,
				'insert into dossiers (domaine_id, parent_id, nom, position, profondeur)',
				5,
				idsDomaines.map((d) => [d.id, null, 'vol-racine', 0, 1])
			);
		}

		/* ── Les dossiers, du plus haut au plus profond ───────────────────── */
		const idsDomainesParNom = new Map(
			(await bassin.query('select id, nom from domaines')).rows.map((r) => [r.nom, r.id])
		);
		const racinesParDomaine = new Map(
			(await bassin.query('select id, domaine_id from dossiers where parent_id is null')).rows.map(
				(r) => [r.domaine_id, r.id]
			)
		);
		const dejaF = new Map(
			(await bassin.query("select id, nom from dossiers where nom like 'vol-dossier%'")).rows.map(
				(r) => [r.nom, r.id]
			)
		);
		/** @type {Map<string,string>} */
		const idParCle = new Map();
		const parProfondeur = [...jeu.dossiers].sort((a, b) => a.profondeur - b.profondeur);
		for (const f of parProfondeur) {
			const dejaPose = dejaF.get(f.nom);
			if (dejaPose !== undefined) {
				idParCle.set(f.cle, dejaPose);
				continue;
			}
			const domaineId = idsDomainesParNom.get(f.domaineNom);
			const parentId =
				f.parentCle === null ? racinesParDomaine.get(domaineId) : idParCle.get(f.parentCle);
			const r = await bassin.query(
				'insert into dossiers (domaine_id, parent_id, nom, position, profondeur) values ($1,$2,$3,$4,$5) returning id',
				[domaineId, parentId, f.nom, f.position, f.profondeur]
			);
			idParCle.set(f.cle, r.rows[0].id);
			pose.dossiers += 1;
		}

		/* ── Les comptes ──────────────────────────────────────────────────── */
		const dejaC = new Set(
			(
				await bassin.query("select identifiant from comptes where identifiant like 'vol-%'")
			).rows.map((r) => r.identifiant)
		);
		const comptesAPoser = jeu.comptes.filter((c) => !dejaC.has(c.identifiant));
		if (comptesAPoser.length > 0) {
			await insererParTranches(
				bassin,
				'insert into comptes (identifiant, nom, courriel, role, actif, arrive_le)',
				6,
				comptesAPoser.map((c) => [c.identifiant, c.nom, c.courriel, c.role, true, '2026-01-05'])
			);
			pose.comptes = comptesAPoser.length;
		}
	}

	/* ── Les notes du palier demandé ─────────────────────────────────────── */
	const idsComptes = (
		await bassin.query("select id from comptes where identifiant like 'vol-%' order by identifiant")
	).rows;
	const dossiersParNom = new Map(
		(
			await bassin.query(
				"select d.id, d.nom, d.domaine_id from dossiers d where d.nom like 'vol-dossier%'"
			)
		).rows.map((r) => [r.nom, r])
	);
	const dossierDeCle = new Map(jeu.dossiers.map((f) => [f.cle, f.nom]));
	const dejaN = new Set(
		(await bassin.query("select identifiant from notes where identifiant like 'vol-%'")).rows.map(
			(r) => r.identifiant
		)
	);

	const maintenant = Date.now();
	const jour = 86_400_000;
	const aPoser = jeu.notes.filter((n) => n.palier <= palier && !dejaN.has(n.identifiant));
	await insererParTranches(
		bassin,
		'insert into notes (identifiant, titre, corps_reference, type_de_note_id, domaine_id, dossier_id, auteur_id, visibilite, statut, cree_le, modifie_le, corps_reference_modifie_le, verifie_le)',
		13,
		aPoser.map((n) => {
			const dossier = dossiersParNom.get(dossierDeCle.get(n.dossierCle));
			const auteur = idsComptes[n.indiceAuteur % idsComptes.length];
			const type = typesDeNote[n.indiceType % typesDeNote.length];
			const modifie = new Date(maintenant - n.modifieeIlYA * jour).toISOString();
			return [
				n.identifiant,
				n.titre,
				JSON.stringify(corpsDeNote(n.extrait)),
				type.id,
				dossier.domaine_id,
				dossier.id,
				auteur.id,
				n.visibilite,
				n.statut,
				modifie,
				modifie,
				modifie,
				n.verifieeIlYA === null ? null : new Date(maintenant - n.verifieeIlYA * jour).toISOString()
			];
		})
	);
	pose.notes = aPoser.length;

	/* ── Les étiquettes de note, prises dans celles du corpus gelé ────────── */
	const idsNotes = new Map(
		(
			await bassin.query("select id, identifiant from notes where identifiant like 'vol-%'")
		).rows.map((r) => [r.identifiant, r.id])
	);
	const liaisons = [];
	for (const n of aPoser) {
		const noteId = idsNotes.get(n.identifiant);
		n.indicesEtiquettes.forEach((indice, rang) => {
			liaisons.push([noteId, etiquettes[indice % etiquettes.length].id, rang]);
		});
	}
	await insererParTranches(
		bassin,
		'insert into etiquettes_de_note (note_id, etiquette_id, ordre)',
		3,
		liaisons,
		'on conflict do nothing'
	);
	pose.etiquettesDeNote = liaisons.length;

	/* ── Les relations (palier 0) ────────────────────────────────────────── */
	if (palier >= 0) {
		const dejaR = (
			await bassin.query(
				"select count(*)::int as n from relations r join notes s on s.id = r.source_id where s.identifiant like 'vol-%'"
			)
		).rows[0].n;
		if (dejaR === 0) {
			const lignes = jeu.relations
				.map((r) => [
					idsNotes.get(r.sourceIdentifiant),
					idsNotes.get(r.cibleIdentifiant),
					typesDeRelation[r.indiceType % typesDeRelation.length].id,
					r.origine
				])
				.filter((l) => l[0] !== undefined && l[1] !== undefined);
			await insererParTranches(
				bassin,
				'insert into relations (source_id, cible_id, type_de_relation_id, origine)',
				4,
				lignes,
				'on conflict do nothing'
			);
			pose.relations = lignes.length;
		}
	}

	return pose;
}

/**
 * Ramène la base au palier demandé : les notes des paliers supérieurs sont
 * retirées, leurs étiquettes et relations partent en cascade.
 *
 * SANS CE GESTE, UNE SECONDE EXÉCUTION MESURE LE GRAPHE DE LA PREMIÈRE. Les
 * paliers sont cumulatifs ; la base garde le dernier chargé. Une batterie qui
 * ne rembobine pas ne mesure pas 500 nœuds au palier du budget, elle mesure ce
 * que l'exécution précédente a laissé — et son verdict devient dépendant de son
 * histoire, ce qu'aucune mesure ne doit être (`P-28`).
 *
 * @param {import('pg').Pool} bassin
 * @param {{notes: {identifiant: string, palier: number}[]}} jeu
 * @param {number} palier
 */
export async function ramenerAuPalier(bassin, jeu, palier) {
	const trop = jeu.notes.filter((n) => n.palier > palier).map((n) => n.identifiant);
	let retirees = 0;
	for (let d = 0; d < trop.length; d += 1000) {
		const tranche = trop.slice(d, d + 1000);
		const r = await bassin.query('delete from notes where identifiant = any($1::text[])', [
			tranche
		]);
		retirees += r.rowCount ?? 0;
	}
	return retirees;
}

/** Retire tout le jeu, par préfixe. @param {import('pg').Pool} bassin */
export async function retirer(bassin, lignes) {
	const compte = {};
	for (const instruction of lignes) {
		const r = await bassin.query(instruction);
		/* La table visée est le mot qui suit `from` — pas un rang fixe : une
		   instruction reformulée déplacerait le rang, et le rapport nommerait
		   « where » au lieu de « notes ». Mesuré, et corrigé. */
		const mots = instruction.split(/\s+/);
		const table = mots[mots.indexOf('from') + 1] ?? instruction;
		compte[table] = r.rowCount;
	}
	/* Les racines des domaines engendrés partent avec eux (cascade) ; celles
	   qui subsisteraient sous un domaine du corpus gelé n'existent pas — le
	   générateur n'en pose aucune. */
	const r = await bassin.query("delete from dossiers where nom = 'vol-racine'");
	compte.racines = r.rowCount;
	return compte;
}

/** Ce que la base porte, jeu compris. @param {import('pg').Pool} bassin */
export async function etat(bassin, universDuGraphe) {
	const un = async (texte, valeurs = []) => (await bassin.query(texte, valeurs)).rows[0].n;
	return {
		notes: await un('select count(*)::int as n from notes'),
		notesEngendrees: await un(
			"select count(*)::int as n from notes where identifiant like 'vol-%'"
		),
		noeudsDuGraphe: await un(
			`select count(*)::int as n from notes n join domaines d on d.id = n.domaine_id
			   join univers u on u.id = d.univers_id where u.nom = $1`,
			[universDuGraphe]
		),
		comptes: await un('select count(*)::int as n from comptes'),
		univers: await un('select count(*)::int as n from univers'),
		domaines: await un('select count(*)::int as n from domaines'),
		dossiers: await un('select count(*)::int as n from dossiers'),
		profondeurMax: await un('select coalesce(max(profondeur), 0)::int as n from dossiers'),
		relations: await un('select count(*)::int as n from relations'),
		etiquettesDeNote: await un('select count(*)::int as n from etiquettes_de_note')
	};
}

/* ═══════════════════════════════════════════════════ Le lanceur ═════════ */

/** L'univers du périmètre de V-19 — lu du produit, jamais recopié ici. */
export const UNIVERS_DU_GRAPHE = 'Production';

if (import.meta.url === `file://${process.argv[1]}`) {
	const args = argv.slice(2);
	const commande = args[0];
	const palier = Number(
		args.find((a) => a.startsWith('--palier='))?.slice('--palier='.length) ?? 0
	);
	const bassin = await ouvrirLeBassin();
	let code = 0;
	try {
		if (commande === 'charger') {
			const { module, fermer } = await chargerLeGenerateur();
			const existant = await lireExistant(bassin, UNIVERS_DU_GRAPHE);
			const jeu = module.engendrer(module.VOLUMETRIE_HAUTE, existant);
			const pose = await charger(bassin, jeu, module.corpsDeNote, palier);
			await fermer();
			console.log(`palier ${palier} :`, pose);
			console.log('état :', await etat(bassin, UNIVERS_DU_GRAPHE));
		} else if (commande === 'retirer') {
			const { module, fermer } = await chargerLeGenerateur();
			const lignes = module.lignesDeRetrait();
			await fermer();
			console.log('retiré :', await retirer(bassin, lignes));
			console.log('état :', await etat(bassin, UNIVERS_DU_GRAPHE));
		} else if (commande === 'etat') {
			console.log(await etat(bassin, UNIVERS_DU_GRAPHE));
		} else {
			console.error('commandes : charger [--palier=n] · retirer · etat');
			code = 1;
		}
	} catch (erreur) {
		console.error(`ÉCHEC — ${erreur instanceof Error ? erreur.stack : String(erreur)}`);
		code = 1;
	} finally {
		await bassin.end();
	}
	exit(code);
}
