/**
 * LE CHARGEUR DU JEU DE CONFORMITÉ — `pnpm base:conformite`.
 *
 * Il écrit en base le corpus du prototype validé : les six univers de `seeds/conformite.ts`,
 * leurs treize domaines, les onze notes que les captures nomment et les soixante-six qui
 * n'existent que par leur état. Sans lui, poser un écran du produit à côté de sa capture
 * mesure des écarts de CONTENU en croyant mesurer des écarts de DESSIN.
 *
 * CE N'EST PAS LA VÉRITÉ DU PRODUIT, c'est un jeu de démonstration de plus. Le produit
 * commence VIDE — ni univers, ni domaine, ni note — et chaque écran se vérifie AUSSI à zéro
 * donnée. Aucune valeur de `seeds/conformite.ts` ne doit ressortir ailleurs que d'ici.
 *
 * IL REMPLACE LE CONTENU, IL NE S'Y AJOUTE PAS, ET IL NE TOUCHE À AUCUN COMPTE. Les
 * suppressions sont explicites, des filles vers les mères, exactement comme dans
 * `demonstration.ts` : `truncate … cascade` sur `domaines` a détruit un compte réel, parce
 * que `comptes` porte une clé étrangère vers `domaines` et que le CASCADE emportait la table
 * entière. Les deux comptes que le jeu emploie sont CRÉÉS S'ILS MANQUENT et laissés intacts
 * s'ils existent — `a.berge` garde son mot de passe.
 *
 * IL CONTRÔLE AVANT DE RENDRE LA MAIN, dans la même transaction : il relit les notes depuis
 * la base, rejoue `vivacite()` sur chaque cycle Référence et compare la répartition obtenue à
 * celle des captures. Un écart annule tout — ce qui a été ÉCRIT n'est pas ce qui sera LU, un
 * `timestamptz` traversant une conversion de fuseau à l'aller comme au retour, et une base à
 * moitié chargée qui ment sur la vivacité serait pire que rien.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import type { Session } from './commandes';
import {
	champsDeTypeDeFiche,
	comptes,
	consultations,
	domaines,
	dossiers,
	droitsDeDossier,
	etiquettes,
	etiquettesDeNote,
	modulesDeDomaine,
	notes,
	relations,
	typesDeFiche,
	typesDeNote,
	typesDeRelation,
	univers,
	verifications
} from './schema';
import { analyserMarkdown } from '../contenu/markdown';
import { hacherMotDePasse } from '../auth/mots-de-passe';
import { identifiantLisible } from '../rangement/adresses';
import { cycleDuRegistre, type LigneDeCycles } from '../donnees/vivacite';
import { ETATS_DE_VIVACITE, ORDRE_DES_ETATS, vivacite, type EtatDeVivacite } from '../fraicheur';
import {
	ANCIENNETE_PAR_ETAT,
	CONSULTATIONS_DE_CONFORMITE,
	NOTES_ATTENDUES,
	REPARTITION_ATTENDUE,
	UNIVERS_DE_CONFORMITE,
	type ConsultationSemee,
	type DomaineSeme,
	type EtatSeme,
	type UniversSeme
} from '../../../seeds/conformite';

/**
 * Le mot de passe des comptes que ce chargeur CRÉE. Il n'en repose jamais un sur un compte
 * existant : `a.berge` est un compte réel sur l'instance de développement.
 */
export const MOT_DE_PASSE_DE_CONFORMITE = 'conformite-2026';

/** Le dossier des deux notes écrites en toutes lettres. */
const DOSSIER_DU_CONTENU = path.join('seeds', 'conformite');

const SEPARATEUR_DE_REGISTRE = '--- OPERATIONNEL ---';
const JOUR = 86_400_000;
const HEURE = 3_600_000;

/**
 * L'AUTEUR PAR DÉFAUT — `02-univers-claude.png` signe « par Alexandre Berge » chacune des cinq
 * lignes de son fil d'activité. Les notes écrites en toutes lettres nomment le leur dans leur
 * en-tête ; `08-…png` donne `k.belhadj` pour la procédure de restauration.
 */
const AUTEUR_PAR_DEFAUT = 'a.berge';

interface CompteDuJeu {
	readonly identifiant: string;
	readonly nom: string;
	readonly courriel: string;
	readonly role: 'administrateur' | 'referent';
	readonly arriveLe: string;
}

/**
 * LES DEUX COMPTES QUE LE JEU EMPLOIE, et rien de plus. Ils ne sont posés QUE S'ILS MANQUENT :
 * sur l'instance de développement, `a.berge` existe déjà avec son mot de passe, et le
 * réécrire enfermerait son propriétaire dehors.
 */
const COMPTES_DU_JEU: readonly CompteDuJeu[] = [
	{
		identifiant: 'a.berge',
		nom: 'Alexandre Berge',
		courriel: 'alexandre.berge@exemple.fr',
		role: 'administrateur',
		arriveLe: '2024-01-08'
	},
	{
		identifiant: 'k.belhadj',
		nom: 'Karim Belhadj',
		courriel: 'karim.belhadj@exemple.fr',
		role: 'referent',
		arriveLe: '2020-01-06'
	}
];

/** Les six modules d'un domaine (`RG-STR-06`) : le prototype les montre tous. */
const MODULES_DU_JEU = [
	'notes',
	'dossiers',
	'fiches',
	'cartographie',
	'signets',
	'carte_mentale'
] as const;

interface EnTete {
	readonly [cle: string]: string;
}

interface NoteLue {
	readonly entete: EnTete;
	readonly reference: string;
	readonly operationnel: string | null;
}

/**
 * L'en-tête est délimité par deux lignes de trois tirets, et le format est volontairement
 * pauvre — une clé, deux points, une valeur. Même lecture que `demonstration.ts` : les deux
 * jeux partagent le format de fichier, pas le module qui les charge.
 */
function lireLeFichier(texte: string): NoteLue {
	const lignes = texte.split('\n');
	if (lignes[0]?.trim() !== '---') throw new Error('en-tête manquant');
	const fin = lignes.indexOf('---', 1);
	if (fin < 0) throw new Error('en-tête non refermé');

	const entete: Record<string, string> = {};
	for (const ligne of lignes.slice(1, fin)) {
		const sep = ligne.indexOf(':');
		if (sep < 0) continue;
		entete[ligne.slice(0, sep).trim()] = ligne.slice(sep + 1).trim();
	}

	const corps = lignes
		.slice(fin + 1)
		.join('\n')
		.trim();
	const coupe = corps.indexOf(SEPARATEUR_DE_REGISTRE);
	return coupe < 0
		? { entete, reference: corps, operationnel: null }
		: {
				entete,
				reference: corps.slice(0, coupe).trim(),
				operationnel: corps.slice(coupe + SEPARATEUR_DE_REGISTRE.length).trim()
			};
}

const liste = (v: string | undefined): string[] =>
	v === undefined
		? []
		: v
				.split(',')
				.map((x) => x.trim())
				.filter((x) => x !== '');

function exiger<T>(valeur: T | undefined, quoi: string): T {
	if (valeur === undefined) throw new Error(`introuvable : ${quoi}`);
	return valeur;
}

/** Un nom qui est DÉJÀ une adresse : minuscules, chiffres, tiret bas, tiret. */
const NOM_DEJA_ADRESSABLE = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * L'IDENTIFIANT D'ADRESSE d'un univers ou d'un domaine. Il est PERSISTÉ, et c'est LUI que
 * l'adresse porte — `identifiantDeDomaine()` ne retombe sur le nom slugifié que faute d'en
 * trouver un en base.
 *
 * LE NOM EST GARDÉ TEL QUEL QUAND IL EST DÉJÀ UNE ADRESSE. `audit_code` est le nom que
 * `03-domaine-audit_code.png` affiche et le segment que `tools/conformite/vues.json` demande ;
 * `identifiantLisible()` en ferait `audit-code`, une adresse qu'aucune capture ne montre et
 * que le harnais de comparaison ouvrirait en 404. Les autres noms — accentués, capitalisés,
 * espacés — passent par la dérivation ordinaire, celle que la console emploie.
 */
function identifiantDAdresse(nom: string): string {
	return NOM_DEJA_ADRESSABLE.test(nom) ? nom : identifiantLisible(nom);
}

/**
 * LA NOTE À POSER — la forme intermédiaire, dérivée du jeu AVANT toute écriture. La dériver
 * d'abord et l'écrire ensuite permet de refuser un jeu incohérent — un domaine dont la
 * répartition ne tient pas dans son effectif — sans avoir rien touché à la base.
 */
interface NoteAPoser {
	readonly identifiant: string;
	readonly titre: string;
	readonly universNom: string;
	readonly domaineNom: string;
	/** Le chemin de dossier sous le domaine, vide à la racine. */
	readonly chemin: string;
	readonly etat: EtatSeme;
	readonly auteur: string;
	readonly reference: string;
	readonly operationnel: string | null;
	readonly etiquettes: readonly string[];
	readonly validiteReference: number;
	readonly validiteOperationnel: number;
	/** L'ancienneté de la vérification de l'Opérationnel, en jours. Nulle sans Opérationnel. */
	readonly ancienneteOperationnel: number | null;
}

/**
 * LE LIBELLÉ D'UN ÉTAT — celui de la fabrique unique, jamais une seconde liste. `EtatSeme` et
 * `EtatDeVivacite` nomment le même ensemble de cinq états ; recopier les libellés ici les
 * aurait laissés diverger de l'écran au premier changement de mot (`P-01`, `ADR-005`).
 */
function libelleDeLEtat(etat: EtatSeme): string {
	return ETATS_DE_VIVACITE[etat].libelle;
}

/** Le corps d'une note de remplissage : une phrase, et elle dit ce qu'elle est. */
function corpsDeRemplissage(titre: string, etat: EtatSeme): string {
	return (
		`# ${titre}\n\n` +
		`Note de remplissage du jeu de conformité. Elle n'existe que pour porter l'état ` +
		`« ${libelleDeLEtat(etat)} » dans les compteurs des écrans : le prototype ne montre le ` +
		`contenu que de onze notes sur ${String(NOTES_ATTENDUES)}, et inventer les autres serait ` +
		`écrire de la fausse connaissance.`
	);
}

/**
 * LES ÉTATS QU'IL RESTE À DISTRIBUER dans un domaine, une fois les notes nommées servies.
 *
 * La répartition du domaine est un ENGAGEMENT : les captures affichent ses cinq nombres. Les
 * notes nommées portent l'état que le jeu leur donne ; le remplissage prend le reste, dans
 * l'ordre des états. Un reste négatif est un jeu qui se contredit, et il est refusé ici —
 * avant la première écriture — plutôt que découvert par le contrôle final.
 */
function etatsDeRemplissage(domaine: DomaineSeme): readonly EtatSeme[] {
	const reste: Record<EtatSeme, number> = {
		ajour: domaine.repartition[0],
		bientot: domaine.repartition[1],
		averifier: domaine.repartition[2],
		arevoir: domaine.repartition[3],
		obsolete: domaine.repartition[4]
	};
	for (const nommee of domaine.nommees) reste[nommee.etat] -= 1;

	const rendu: EtatSeme[] = [];
	for (const etat of ORDRE_DES_ETATS) {
		if (reste[etat] < 0) {
			throw new Error(
				`domaine ${domaine.nom} : les notes nommées portent plus de « ${libelleDeLEtat(etat)} » que la répartition n'en compte`
			);
		}
		for (let i = 0; i < reste[etat]; i += 1) rendu.push(etat);
	}
	if (rendu.length !== domaine.remplissage.length) {
		throw new Error(
			`domaine ${domaine.nom} : ${String(rendu.length)} notes de remplissage à poser, ${String(domaine.remplissage.length)} titres déclarés`
		);
	}
	if (domaine.nommees.length + domaine.remplissage.length !== domaine.notes) {
		throw new Error(
			`domaine ${domaine.nom} : ${String(domaine.notes)} notes annoncées, ${String(domaine.nommees.length + domaine.remplissage.length)} décrites`
		);
	}
	return rendu;
}

/** Les notes d'un domaine, les nommées d'abord, puis le remplissage. */
function notesDUnDomaine(
	universSeme: UniversSeme,
	domaine: DomaineSeme,
	lues: ReadonlyMap<string, NoteLue>
): readonly NoteAPoser[] {
	const nommees = domaine.nommees.map((nommee): NoteAPoser => {
		const lue =
			nommee.fichier === undefined ? undefined : exiger(lues.get(nommee.fichier), nommee.fichier);
		const entete = lue?.entete ?? {};
		const validite = (cle: string, defaut: number): number => {
			const brut = entete[cle];
			if (brut === undefined) return defaut;
			const valeur = Number(brut);
			return Number.isSafeInteger(valeur) && valeur >= 1 ? valeur : defaut;
		};
		const anciennete = entete['verifie-operationnel-il-y-a-jours'];
		return {
			identifiant: entete['identifiant'] ?? identifiantLisible(nommee.titre),
			titre: entete['titre'] ?? nommee.titre,
			universNom: universSeme.nom,
			domaineNom: domaine.nom,
			chemin: nommee.dossier ?? '',
			etat: nommee.etat,
			auteur: entete['auteur'] ?? AUTEUR_PAR_DEFAUT,
			reference: lue?.reference ?? corpsDeRemplissage(nommee.titre, nommee.etat),
			operationnel: lue?.operationnel ?? null,
			etiquettes: liste(entete['etiquettes']),
			validiteReference: validite('validite-reference', 90),
			validiteOperationnel: validite('validite-operationnel', 21),
			ancienneteOperationnel:
				lue?.operationnel == null ? null : anciennete === undefined ? 0 : Number(anciennete)
		};
	});

	const etats = etatsDeRemplissage(domaine);
	const remplissage = domaine.remplissage.map((titre, rang): NoteAPoser => {
		const etat = exiger(etats[rang], `état de remplissage ${String(rang)} de ${domaine.nom}`);
		return {
			identifiant: identifiantLisible(titre),
			titre,
			universNom: universSeme.nom,
			domaineNom: domaine.nom,
			chemin: '',
			etat,
			auteur: AUTEUR_PAR_DEFAUT,
			reference: corpsDeRemplissage(titre, etat),
			operationnel: null,
			etiquettes: [],
			validiteReference: 90,
			validiteOperationnel: 21,
			ancienneteOperationnel: null
		};
	});

	return [...nommees, ...remplissage];
}

/** Les soixante-dix-sept notes du jeu, dans l'ordre du fichier. */
function notesDuJeu(lues: ReadonlyMap<string, NoteLue>): readonly NoteAPoser[] {
	const rendu = UNIVERS_DE_CONFORMITE.flatMap((u) =>
		u.domaines.flatMap((d) => notesDUnDomaine(u, d, lues))
	);
	const vus = new Set<string>();
	for (const note of rendu) {
		if (vus.has(note.identifiant)) {
			throw new Error(`deux notes portent l'identifiant ${note.identifiant}`);
		}
		vus.add(note.identifiant);
	}
	if (rendu.length !== NOTES_ATTENDUES) {
		throw new Error(
			`le jeu décrit ${String(rendu.length)} notes, les captures en affichent ${String(NOTES_ATTENDUES)}`
		);
	}
	return rendu;
}

/**
 * LES INSTANTS D'OUVERTURE d'une note — `RG-M04-09`. Le cumul est une SÉRIE DATÉE, pas un
 * nombre : « 412 consultations, 17 sur les 30 derniers jours » ne se rend qu'avec des lignes
 * réparties dans le temps. La répartition est déterministe pour que deux chargements donnent
 * la même base.
 */
function instantsDeConsultation(profil: ConsultationSemee, maintenant: Date): readonly Date[] {
	const fin = maintenant.getTime();
	const rendu: Date[] = [];

	/* Les trente derniers jours. La plus récente est posée à l'heure que le profil
	   donne ; les autres s'échelonnent du premier jour au vingt-neuvième. Sans heure
	   récente, elles commencent au huitième jour — la note ne doit pas paraître dans
	   « Récemment consultées », qui n'en regarde que sept. */
	const recentes = profil.trenteDerniersJours;
	const aUneOuvertureRecente = profil.heuresDepuisLaDerniere !== null;
	if (aUneOuvertureRecente) {
		rendu.push(new Date(fin - (profil.heuresDepuisLaDerniere ?? 0) * HEURE));
	}
	const restantes = recentes - (aUneOuvertureRecente ? 1 : 0);
	const premierJour = aUneOuvertureRecente ? 1 : 8;
	for (let i = 0; i < restantes; i += 1) {
		const jours = premierJour + (i * (29 - premierJour)) / Math.max(1, restantes - 1);
		rendu.push(new Date(fin - jours * JOUR));
	}

	/* Le reste du cumul, réparti sur l'année écoulée au-delà de la fenêtre de trente jours. */
	const anciennes = profil.total - recentes;
	for (let i = 0; i < anciennes; i += 1) {
		const jours = 31 + (i * 334) / Math.max(1, anciennes - 1);
		rendu.push(new Date(fin - jours * JOUR));
	}
	return rendu;
}

export interface RapportDeConformite {
	readonly comptesCrees: number;
	readonly univers: number;
	readonly domaines: number;
	readonly dossiers: number;
	readonly notes: number;
	readonly etiquettes: number;
	readonly verifications: number;
	readonly consultations: number;
	/** La répartition RELUE depuis la base, dans l'ordre des cinq états. */
	readonly repartition: readonly [number, number, number, number, number];
}

/**
 * CHARGE LE CORPUS DU PROTOTYPE VALIDÉ.
 *
 * @param session la connexion ouverte par `base/base.mjs`
 * @param racine la racine du dépôt, d'où `seeds/conformite/` est lu
 * @param maintenant l'instant de référence — un PARAMÈTRE, jamais une horloge cachée : sans
 *   lui, le contrôle d'aller-retour ne pourrait épingler aucune borne. Il est posé à midi UTC
 *   du jour courant, ce qui met chaque date de vérification au milieu de son jour civil : à
 *   quelques secondes de minuit, un décalage d'heure d'été aurait fait glisser un état.
 */
export async function chargerLaConformite(
	session: Session,
	racine = process.cwd(),
	maintenant = midiDuJour(new Date())
): Promise<RapportDeConformite> {
	const fichiers = new Set(
		UNIVERS_DE_CONFORMITE.flatMap((u) =>
			u.domaines.flatMap((d) => d.nommees.map((n) => n.fichier))
		).filter((f): f is string => f !== undefined)
	);
	const lues = new Map<string, NoteLue>();
	for (const fichier of fichiers) {
		const chemin = path.join(racine, DOSSIER_DU_CONTENU, fichier);
		try {
			lues.set(fichier, lireLeFichier(await readFile(chemin, 'utf8')));
		} catch (cause) {
			throw new Error(`${fichier} : ${cause instanceof Error ? cause.message : String(cause)}`, {
				cause
			});
		}
	}

	/* LA DÉRIVATION D'ABORD, L'ÉCRITURE ENSUITE. Un jeu qui se contredit est refusé
	   avant la transaction, et la base n'a rien vu passer. */
	const aPoser = notesDuJeu(lues);
	const condensat = await hacherMotDePasse(MOT_DE_PASSE_DE_CONFORMITE);

	return session.db.transaction(async (tx) => {
		/**
		 * ON EFFACE LE CONTENU, ET SURTOUT PAS LES COMPTES. `truncate … cascade` sur
		 * `domaines` a détruit un compte réel : `comptes` porte une clé étrangère vers
		 * `domaines`, donc le CASCADE emportait la table ENTIÈRE. Un `cascade` ne se
		 * raisonne pas sur les tables qu'on nomme, mais sur toutes celles qui les
		 * référencent. Ici AUCUN compte n'est même supprimé : le jeu réemploie ceux qui
		 * sont là.
		 */
		await tx.execute(sql`delete from ${etiquettesDeNote}`);
		await tx.execute(sql`delete from ${relations}`);
		await tx.execute(sql`delete from ${verifications}`);
		await tx.execute(sql`delete from ${consultations}`);
		await tx.execute(sql`delete from versions`);
		await tx.execute(sql`delete from pieces_jointes`);
		await tx.execute(sql`delete from ${droitsDeDossier}`);
		await tx.execute(sql`delete from ${champsDeTypeDeFiche}`);
		await tx.execute(sql`delete from ${modulesDeDomaine}`);
		await tx.execute(sql`delete from ${notes}`);
		await tx.execute(sql`delete from ${dossiers}`);
		await tx.execute(sql`delete from ${etiquettes}`);
		await tx.execute(sql`delete from ${typesDeFiche}`);
		await tx.execute(sql`delete from ${typesDeRelation}`);
		/* Le rattachement d'un compte à un domaine s'efface avec le domaine
		   (`on delete set null`) ; le compte, lui, reste. */
		await tx.execute(sql`delete from ${domaines}`);
		await tx.execute(sql`delete from ${univers}`);

		/* LES COMPTES — ceux qui manquent, et eux seuls. */
		const existants = await tx
			.select({ id: comptes.id, identifiant: comptes.identifiant })
			.from(comptes);
		const compteParIdentifiant = new Map(existants.map((c) => [c.identifiant, c.id]));
		const aCreer = COMPTES_DU_JEU.filter((c) => !compteParIdentifiant.has(c.identifiant));
		if (aCreer.length > 0) {
			const poses = await tx
				.insert(comptes)
				.values(
					aCreer.map((c) => ({
						identifiant: c.identifiant,
						nom: c.nom,
						courriel: c.courriel,
						role: c.role,
						actif: true,
						arriveLe: c.arriveLe,
						condensatMotDePasse: condensat
					}))
				)
				.returning({ id: comptes.id, identifiant: comptes.identifiant });
			for (const pose of poses) compteParIdentifiant.set(pose.identifiant, pose.id);
		}

		/* LES SIX UNIVERS, dans l'ordre du fichier — c'est celui du rail. */
		const universPoses = await tx
			.insert(univers)
			.values(
				UNIVERS_DE_CONFORMITE.map((u, ordre) => ({
					identifiant: identifiantDAdresse(u.nom),
					nom: u.nom,
					description: u.description,
					couleur: u.couleur,
					glyphe: u.glyphe,
					ordre,
					systeme: false
				}))
			)
			.returning({ id: univers.id, nom: univers.nom });
		const universParNom = new Map(universPoses.map((u) => [u.nom, u.id]));

		/* LEURS DOMAINES. L'identifiant est celui que `identifiantLisible()` dérive du
		   nom : c'est exactement ce que les adresses reconstruisent quand la base n'en
		   porte pas d'autre, donc les deux ne peuvent pas diverger. */
		const declares = UNIVERS_DE_CONFORMITE.flatMap((u) =>
			u.domaines.map((d) => ({ universNom: u.nom, couleur: u.couleur, domaine: d }))
		);
		const domainesPoses = await tx
			.insert(domaines)
			.values(
				declares.map((d) => ({
					universId: exiger(universParNom.get(d.universNom), `univers ${d.universNom}`),
					identifiant: identifiantDAdresse(d.domaine.nom),
					nom: d.domaine.nom,
					description: d.domaine.description,
					couleur: d.couleur
				}))
			)
			.returning({ id: domaines.id, nom: domaines.nom });
		const domaineParNom = new Map(domainesPoses.map((d) => [d.nom, d.id]));

		await tx.insert(modulesDeDomaine).values(
			declares.flatMap((d) =>
				MODULES_DU_JEU.map((module) => ({
					domaineId: exiger(domaineParNom.get(d.domaine.nom), `domaine ${d.domaine.nom}`),
					module
				}))
			)
		);

		/* LES DOSSIERS : la racine porte le nom du domaine (`RG-STR-03`), puis les
		   chemins que les notes nommées réclament — `archives` sous `audit_code`,
		   `Exploitation` sous `Sauvegardes`. Aucun n'est écrit ici : ils sont DÉDUITS du
		   jeu, donc une note rangée ailleurs fait naître son dossier au lieu d'échouer. */
		const dossierParChemin = new Map<string, string>();
		for (const d of declares) {
			const domaineId = exiger(domaineParNom.get(d.domaine.nom), `domaine ${d.domaine.nom}`);
			const [racineDuDomaine] = await tx
				.insert(dossiers)
				.values({
					domaineId,
					parentId: null,
					nom: d.domaine.nom,
					position: 0,
					profondeur: 1
				})
				.returning({ id: dossiers.id });
			dossierParChemin.set(
				`${d.domaine.nom}|`,
				exiger(racineDuDomaine?.id, `racine de ${d.domaine.nom}`)
			);

			const chemins = [
				...new Set(
					d.domaine.nommees
						.map((n) => n.dossier)
						.filter((c): c is string => c !== undefined && c !== '')
				)
			].sort((a, b) => a.split('›').length - b.split('›').length);
			for (const [rang, chemin] of chemins.entries()) {
				const segments = chemin.split('›').map((s) => s.trim());
				const nom = exiger(segments.at(-1), chemin);
				const cheminDuParent = segments.slice(0, -1).join(' › ');
				const parentId = exiger(
					dossierParChemin.get(`${d.domaine.nom}|${cheminDuParent}`),
					`parent de ${chemin}`
				);
				const [pose] = await tx
					.insert(dossiers)
					.values({
						domaineId,
						parentId,
						nom,
						position: rang,
						profondeur: segments.length + 1
					})
					.returning({ id: dossiers.id });
				dossierParChemin.set(`${d.domaine.nom}|${chemin}`, exiger(pose?.id, chemin));
			}
		}

		/* Le type « Note » vient de la migration `007`, jamais d'une semence. */
		const typesPoses = await tx
			.select({ id: typesDeNote.id, nom: typesDeNote.nom })
			.from(typesDeNote);
		const typeNote = exiger(
			typesPoses.find((t) => t.nom === 'Note')?.id,
			'type de note « Note » — la migration 007 le pose'
		);

		/* LES NOTES. La date de vérification EST ce qui pose l'état : `vivacite()` la
		   compare à l'échéance, et `ANCIENNETE_PAR_ETAT` donne l'ancienneté qui tombe
		   dans chaque état pour une validité de quatre-vingt-dix jours. */
		const noteParTitre = new Map<string, string>();
		const etiquetteParLibelle = new Map<string, string>();
		const lignesDeVerification: {
			noteId: string;
			compteId: string;
			registre: 'reference' | 'operationnel';
			le: Date;
		}[] = [];

		for (const note of aPoser) {
			const verifieLe = new Date(maintenant.getTime() - ANCIENNETE_PAR_ETAT[note.etat] * JOUR);
			const verifieLeOperationnel =
				note.ancienneteOperationnel === null
					? null
					: new Date(maintenant.getTime() - note.ancienneteOperationnel * JOUR);
			const auteurId = exiger(compteParIdentifiant.get(note.auteur), `compte ${note.auteur}`);
			const profil = CONSULTATIONS_DE_CONFORMITE.find((c) => c.titre === note.titre);

			const [posee] = await tx
				.insert(notes)
				.values({
					identifiant: note.identifiant,
					titre: note.titre,
					corpsReference: analyserMarkdown(note.reference),
					corpsOperationnel:
						note.operationnel === null ? null : analyserMarkdown(note.operationnel),
					/* Quatre contraintes de cohérence lient ces colonnes deux à deux : un
					   corps opérationnel sans sa date est un état qu'aucun écran ne rend. */
					corpsOperationnelModifieLe: verifieLeOperationnel,
					typeDeNoteId: typeNote,
					domaineId: exiger(domaineParNom.get(note.domaineNom), `domaine ${note.domaineNom}`),
					dossierId: exiger(
						dossierParChemin.get(`${note.domaineNom}|${note.chemin}`),
						`dossier ${note.domaineNom} › ${note.chemin}`
					),
					auteurId,
					statut: 'publiee' as const,
					/* La dernière modification EST la dernière vérification : vérifier une note
					   qu'on vient d'écrire est le geste normal, et laisser `modifie_le` au
					   défaut `now()` aurait fait dire à chaque fil d'activité que les
					   soixante-dix-sept notes ont été touchées à l'instant. */
					creeLe: new Date(verifieLe.getTime() - 60 * JOUR),
					modifieLe: verifieLe,
					corpsReferenceModifieLe: verifieLe,
					verifieLe,
					verifieLeOperationnel,
					validiteReference: note.validiteReference,
					validiteOperationnel: note.validiteOperationnel,
					compteurDeConsultations: profil?.total ?? 0
				})
				.returning({ id: notes.id });
			const noteId = exiger(posee?.id, note.identifiant);
			noteParTitre.set(note.titre, noteId);

			/* La vérification est une TRACE, pas seulement une date : sans elle, le fil
			   d'activité reste vide alors que les notes s'affichent vérifiées. */
			lignesDeVerification.push({
				noteId,
				compteId: auteurId,
				registre: 'reference',
				le: verifieLe
			});
			if (verifieLeOperationnel !== null) {
				lignesDeVerification.push({
					noteId,
					compteId: auteurId,
					registre: 'operationnel',
					le: verifieLeOperationnel
				});
			}

			for (const [rang, libelle] of note.etiquettes.entries()) {
				let etiquetteId = etiquetteParLibelle.get(libelle);
				if (etiquetteId === undefined) {
					const [poseeEtq] = await tx
						.insert(etiquettes)
						.values({ libelle })
						.returning({ id: etiquettes.id });
					etiquetteId = exiger(poseeEtq?.id, libelle);
					etiquetteParLibelle.set(libelle, etiquetteId);
				}
				await tx.insert(etiquettesDeNote).values({ noteId, etiquetteId, ordre: rang });
			}
		}

		await tx.insert(verifications).values(lignesDeVerification);

		/* LES CONSULTATIONS. Le rail montre cinq récents et l'accueil deux listes : sans
		   lignes ici, ces trois zones sont vides. Les ouvertures des trente derniers
		   jours sont portées par le compte courant — `recentsDuCompte()` filtre sur lui,
		   et servir les lectures de tout le monde annoncerait à chacun ce que les autres
		   lisent. Les plus anciennes vont à l'autre compte du jeu. */
		const moi = exiger(compteParIdentifiant.get(AUTEUR_PAR_DEFAUT), `compte ${AUTEUR_PAR_DEFAUT}`);
		const autre = exiger(compteParIdentifiant.get('k.belhadj'), 'compte k.belhadj');
		const limiteDeFraicheur = maintenant.getTime() - 30 * JOUR;
		const lignesDeConsultation = CONSULTATIONS_DE_CONFORMITE.flatMap((profil) => {
			const noteId = exiger(noteParTitre.get(profil.titre), `note « ${profil.titre} »`);
			return instantsDeConsultation(profil, maintenant).map((le) => ({
				noteId,
				compteId: le.getTime() >= limiteDeFraicheur ? moi : autre,
				le
			}));
		});
		if (lignesDeConsultation.length > 0) {
			await tx.insert(consultations).values(lignesDeConsultation);
		}

		/* ── LE CONTRÔLE D'ALLER-RETOUR, DANS LA MÊME TRANSACTION. Ce qui a été ÉCRIT
		   n'est pas ce qui sera LU : un `timestamptz` traverse une conversion de fuseau à
		   l'aller comme au retour, et une date décalée d'un jour décale l'état d'une note
		   posée sur un seuil. Le contrôle relit donc les dates DEPUIS LA BASE et rejoue
		   `vivacite()` — la fabrique unique, jamais un second calcul. S'il échoue, rien
		   n'est chargé. */
		const relues = await tx
			.select({
				identifiant: notes.identifiant,
				modifieLe: notes.modifieLe,
				corpsOperationnelModifieLe: notes.corpsOperationnelModifieLe,
				verifieLe: notes.verifieLe,
				verifieLeOperationnel: notes.verifieLeOperationnel,
				validiteReference: notes.validiteReference,
				validiteOperationnel: notes.validiteOperationnel,
				revisionDemandee: notes.revisionDemandee,
				revisionRegistre: notes.revisionRegistre
			})
			.from(notes);

		const cycleDe = (ligne: (typeof relues)[number]): LigneDeCycles => ({
			modifieLe: ligne.modifieLe,
			corpsOperationnelModifieLe: ligne.corpsOperationnelModifieLe,
			verifieLe: ligne.verifieLe,
			verifieLeOperationnel: ligne.verifieLeOperationnel,
			validiteReference: ligne.validiteReference,
			validiteOperationnel: ligne.validiteOperationnel,
			revisionDemandee: ligne.revisionDemandee,
			revisionRegistre: ligne.revisionRegistre,
			revisionPar: null,
			verifieParReference: null,
			verifieParOperationnel: null
		});

		/**
		 * LES DEUX NOTES QUE LES CAPTURES MONTRENT EN ENTIER. Le total ne les couvre pas :
		 * la répartition serait juste avec les deux états échangés. `04-…png` et `05-…png`
		 * montrent la même note « À jour » sur sa Référence et « À vérifier » sur son
		 * Opérationnel — DEUX ÉTATS SUR LA MÊME NOTE, ce qui est tout l'intérêt d'un cycle
		 * par registre ; `08-…png` montre l'autre « À revoir », sans Opérationnel du tout.
		 */
		const attendusNommes: readonly {
			identifiant: string;
			reference: EtatDeVivacite;
			operationnel: EtatDeVivacite | null;
		}[] = [
			{
				identifiant: 'note-technique-claude-code-linux',
				reference: 'ajour',
				operationnel: 'averifier'
			},
			{
				identifiant: 'n-restaurer-une-sauvegarde-postgresql',
				reference: 'arevoir',
				operationnel: null
			}
		];

		const compte: Record<EtatDeVivacite, number> = {
			ajour: 0,
			bientot: 0,
			averifier: 0,
			arevoir: 0,
			obsolete: 0
		};
		for (const ligne of relues) {
			const cycle = cycleDuRegistre(cycleDe(ligne), 'reference');
			if (cycle === null) throw new Error(`${ligne.identifiant} : pas de cycle Référence`);
			compte[vivacite(cycle, maintenant).etat] += 1;
		}
		const repartition = ORDRE_DES_ETATS.map((etat) => compte[etat]) as unknown as [
			number,
			number,
			number,
			number,
			number
		];
		const ecarts = ORDRE_DES_ETATS.flatMap((etat, i) =>
			compte[etat] === REPARTITION_ATTENDUE[i]
				? []
				: [
						`${libelleDeLEtat(etat)} : attendu ${String(REPARTITION_ATTENDUE[i])}, relu ${String(compte[etat])}`
					]
		);
		if (relues.length !== NOTES_ATTENDUES) {
			ecarts.push(`total : attendu ${String(NOTES_ATTENDUES)}, relu ${String(relues.length)}`);
		}
		for (const attendu of attendusNommes) {
			const ligne = relues.find((l) => l.identifiant === attendu.identifiant);
			if (ligne === undefined) {
				ecarts.push(`${attendu.identifiant} : absente de la base`);
				continue;
			}
			const reference = cycleDuRegistre(cycleDe(ligne), 'reference');
			const operationnel = cycleDuRegistre(cycleDe(ligne), 'operationnel');
			const etatReference = reference === null ? null : vivacite(reference, maintenant).etat;
			const etatOperationnel =
				operationnel === null ? null : vivacite(operationnel, maintenant).etat;
			if (etatReference !== attendu.reference) {
				ecarts.push(
					`${attendu.identifiant} (Référence) : attendu ${attendu.reference}, relu ${String(etatReference)}`
				);
			}
			if (etatOperationnel !== attendu.operationnel) {
				ecarts.push(
					`${attendu.identifiant} (Opérationnel) : attendu ${String(attendu.operationnel)}, relu ${String(etatOperationnel)}`
				);
			}
		}
		if (ecarts.length > 0) {
			throw new Error(
				`la vivacité relue depuis la base ne redonne pas celle des captures — ${ecarts.join(' ; ')}`
			);
		}

		return {
			comptesCrees: aCreer.length,
			univers: universPoses.length,
			domaines: domainesPoses.length,
			dossiers: dossierParChemin.size,
			notes: relues.length,
			etiquettes: etiquetteParLibelle.size,
			verifications: lignesDeVerification.length,
			consultations: lignesDeConsultation.length,
			repartition
		};
	});
}

/**
 * MIDI UTC DU JOUR D'UNE DATE. Les anciennetés se comptent en jours pleins ; les poser depuis
 * l'instant courant ferait glisser une note d'un jour civil dès qu'un changement d'heure
 * traverse l'intervalle, et un jour de glissement fait changer l'état d'une note posée sur un
 * seuil. Midi UTC est le milieu du jour dans tous les fuseaux du produit.
 */
export function midiDuJour(instant: Date): Date {
	return new Date(
		Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate(), 12)
	);
}
