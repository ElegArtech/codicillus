/**
 * La batterie d'équivalence — ce que la base rend est-il ce que le jeu exporte ?
 *
 * La base a été semée DEPUIS `seeds/corpus.ts` : les deux côtés portent les mêmes données, et
 * une couche de lecture fidèle doit rendre EXACTEMENT les formes du jeu — mêmes valeurs, mêmes
 * clés, même ordre. Elle ne prouve RIEN sur le rendu : c'est une prémisse, pas un verdict.
 *
 * DEUX GENRES DE CONSTAT, ET LES DEUX FONT ROUGIR. Une DIVERGENCE est un défaut de la couche,
 * qui se corrige dans `lecture.ts` ; une LACUNE est une donnée que la base NE PORTE PAS.
 *
 * LES LACUNES SONT MESURÉES, PLUS DÉCLARÉES : une liste de littéraux avait survécu à la
 * migration qui en refermait trois, et le rapport imprimait « la colonne n'existe pas » alors
 * qu'elle existait. Un instrument qui affirme au lieu de mesurer gouverne la couche qu'il juge.
 *
 * LES SONDES ONT LE CODE INVERSÉ : `--sonde=<genre>` perturbe le CANDIDAT, jamais la
 * référence, et exige que la batterie rougisse DAVANTAGE. L'inversion s'arrête au refus de
 * conclure — une mutation qui n'a RIEN touché ne teste rien. La mesure ne peut pas être « le
 * rouge existe » : la batterie est déjà rouge de ses lacunes, et la sonde compare donc le
 * NOMBRE de divergences avec et sans mutation.
 */
import { COMPTES, CORPUS, TEMPLATES, type Compte, type Note } from '../../../seeds/corpus';
import type { Base } from '../base/acces';

/**
 * Le premier chemin où deux valeurs diffèrent, ou `null` si elles sont égales. ELLE COMPARE
 * LES ENSEMBLES DE CLÉS, et pas seulement les valeurs : une clé présente valant `undefined`
 * n'est PAS une clé absente, et `JSON.stringify` efface cette différence.
 */
export function premiereDifference(a: unknown, b: unknown, chemin = ''): string | null {
	if (a === b) return null;
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b)) {
			return `${chemin} : ${apercu(a)} / ${apercu(b)}`;
		}
		if (a.length !== b.length) {
			return `${chemin} : ${String(a.length)} élément(s) / ${String(b.length)}`;
		}
		for (let i = 0; i < a.length; i++) {
			const trouve = premiereDifference(a[i], b[i], `${chemin}[${String(i)}]`);
			if (trouve !== null) return trouve;
		}
		return null;
	}
	if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
		const ca = Object.keys(a as object).sort();
		const cb = Object.keys(b as object).sort();
		if (ca.join(',') !== cb.join(',')) {
			const seulementA = ca.filter((c) => !cb.includes(c));
			const seulementB = cb.filter((c) => !ca.includes(c));
			return (
				`${chemin} : clés différentes — en trop ${seulementA.join('/') || '·'}, ` +
				`manquantes ${seulementB.join('/') || '·'}`
			);
		}
		for (const cle of ca) {
			const trouve = premiereDifference(
				(a as Record<string, unknown>)[cle],
				(b as Record<string, unknown>)[cle],
				chemin === '' ? cle : `${chemin}.${cle}`
			);
			if (trouve !== null) return trouve;
		}
		return null;
	}
	return `${chemin} : ${apercu(a)} / ${apercu(b)}`;
}

function apercu(valeur: unknown): string {
	const texte = typeof valeur === 'string' ? valeur : JSON.stringify(valeur);
	const rendu = texte ?? String(valeur);
	return rendu.length > 60 ? `${rendu.slice(0, 57)}…` : rendu;
}

export interface Sonde {
	readonly genre: string;
	readonly cote: string;
	readonly description: string;
	readonly muter: (notes: readonly Note[]) => { notes: readonly Note[]; touches: number };
}

export const SONDES: readonly Sonde[] = [
	{
		genre: 'date-decalee',
		cote: 'conversion des dates',
		description:
			'une couche qui lirait les composantes d’un `timestamptz` en heure LOCALE au ' +
			'lieu d’UTC : toute date de vérification recule d’un jour. C’est le défaut que le ' +
			'contrat annonce comme « le point où l’on se trompe », et celui contre lequel ' +
			'`dateCourteDInstant()` emploie `getUTC*`.',
		muter: (notes) => {
			let touches = 0;
			const mutees = notes.map((n) => {
				if (n.revise === null) return n;
				touches += 1;
				const [jour, mois, annee] = n.revise.split('/');
				const veille = new Date(Date.UTC(Number(annee), Number(mois) - 1, Number(jour) - 1));
				const jj = String(veille.getUTCDate()).padStart(2, '0');
				const mm = String(veille.getUTCMonth() + 1).padStart(2, '0');
				return { ...n, revise: `${jj}/${mm}/${String(veille.getUTCFullYear())}` };
			});
			return { notes: mutees, touches };
		}
	},
	{
		genre: 'optionnel-pose',
		cote: 'forme des objets',
		description:
			'une couche qui poserait les champs optionnels à `undefined` au lieu de les ' +
			'OMETTRE. Les valeurs sont toutes justes ; seule la forme change. Aucune ' +
			'comparaison par sérialisation ne le verrait — cette sonde éprouve donc la ' +
			'comparaison des ensembles de clés, et elle seule.',
		muter: (notes) => {
			let touches = 0;
			const mutees = notes.map((n) => {
				const copie = { ...n } as Record<string, unknown>;
				let touchee = false;
				for (const cle of ['typeFiche', 'url', 'ajoute']) {
					if (!(cle in copie)) {
						copie[cle] = undefined;
						touchee = true;
					}
				}
				if (touchee) touches += 1;
				return copie as unknown as Note;
			});
			return { notes: mutees, touches };
		}
	},
	{
		genre: 'ordre-etiquettes',
		cote: 'ordre des suites',
		description:
			'une couche qui rendrait les étiquettes TRIÉES PAR LIBELLÉ au lieu de l’ordre ' +
			'du jeu. C’est exactement ce que ce module a rendu pendant huit lots, et la ' +
			'batterie ne pouvait pas le voir : sa référence était triée elle aussi. Cette ' +
			'sonde existe parce que `T-049` a refermé la lacune `Note.etiquettes (leur ' +
			'ORDRE)` — sans un cas qui la sollicite, la mesure retrouvée serait une règle ' +
			'qu’on espère, pas une règle posée (P-5).',
		muter: (notes) => {
			let touches = 0;
			const mutees = notes.map((n) => {
				const trie = [...n.etiquettes].sort((a, b) => a.localeCompare(b, 'fr'));
				if (trie.join('\x1f') === n.etiquettes.join('\x1f')) return n;
				touches += 1;
				return { ...n, etiquettes: trie };
			});
			return { notes: mutees, touches };
		}
	},
	{
		genre: 'temoin-inerte',
		cote: 'forme des objets',
		description:
			'LA SONDE QUI NE TOUCHE RIEN, et elle est là pour être jouée : elle retire des ' +
			'notes un champ que cette couche ne rend jamais. La batterie doit alors REFUSER ' +
			'DE CONCLURE (code 2, jamais inversé) au lieu de rendre le vert d’une mutation ' +
			'inerte. Sans ce témoin, la garde qui protège du faux vert serait elle-même une ' +
			'règle qu’aucun cas n’exerce (P-5).',
		muter: (notes) => {
			let touches = 0;
			const mutees = notes.map((n) => {
				const copie = { ...n } as Record<string, unknown>;
				if ('empreinteDeRevision' in copie) {
					delete copie['empreinteDeRevision'];
					touches += 1;
				}
				return copie as unknown as Note;
			});
			return { notes: mutees, touches };
		}
	}
];

export interface Lacune {
	readonly forme: string;
	readonly champ: string;
	readonly combien: string;
	readonly pourquoi: string;
	readonly ceQuiLaFermerait: string;
}

/**
 * Ce qu'une mesure de lacune constate. `attendu` est le nombre de valeurs que le JEU
 * demande de restituer ; `restituables` est le nombre que la base permet RÉELLEMENT
 * de rendre, et il est MESURÉ, jamais déclaré. La lacune disparaît à l'égalité.
 */
export interface MesureDeLacune {
	readonly attendu: number;
	readonly restituables: number;
	readonly combien: string;
}

export interface ContexteDeMesure {
	readonly base: Base;
	/**
	 * Ce que la couche rend des comptes, là seulement pour les champs dont la
	 * restitution est un RENDU et non une colonne. Pour tous les autres, la mesure
	 * interroge la BASE : mesurer sur le candidat ce que le candidat doit produire
	 * refermerait une lacune dès que la couche fabriquerait la valeur.
	 */
	readonly comptesRendus: readonly Partial<Compte>[];
}

export interface CandidatDeLacune {
	readonly forme: string;
	readonly champ: string;
	readonly pourquoi: string;
	readonly ceQuiLaFermerait: string;
	readonly mesurer: (contexte: ContexteDeMesure) => Promise<MesureDeLacune>;
}

/** Les lignes d'un `execute`, que le pilote rend tantôt nues, tantôt en `rows`. */
function rangs<T>(resultat: unknown): readonly T[] {
	const enveloppe = resultat as { rows?: readonly T[] };
	return enveloppe.rows ?? (resultat as readonly T[]);
}

/** Le séparateur des agrégats SQL — une unité de séparation, jamais un libellé. */
const SEPARATEUR = '\u001f';

/**
 * Ce que le gel donne des pièces jointes, compté sur le fichier ouvert. Deux constantes, et
 * c'est la seconde qui décide : `V-14:1831-1840` nomme deux pièces, mais leurs tailles y sont
 * RENDUES — « 1,2 Mo » désigne un intervalle. Le nombre de pièces dont le gel donne une taille
 * exploitable comme DONNÉE est donc zéro, et c'est ce zéro qui interdit la semence. La première
 * dit ce qu'un regel devrait compléter, la seconde pourquoi un regel des seuls NOMS ne
 * suffirait pas.
 */
const PIECES_NOMMEES_AU_GEL = 2;
const PIECES_CHIFFRABLES_AU_GEL = 0;

/**
 * Les lacunes candidates — leur motif est écrit à la main, leur chiffre est mesuré à chaque
 * exécution.
 *
 * Ce tableau n'est PAS la liste des lacunes. Il l'a été, et c'était un défaut d'instrument :
 * six littéraux comptés tels quels, si bien que `total = divergences + 6` était un plancher.
 * La conséquence était pire — la migration a refermé trois lacunes, le rapport a continué de
 * les imprimer, et rendre la donnée juste aurait fait rougir la batterie POUR AVOIR EU RAISON.
 *
 * CHAQUE MESURE INTERROGE LA BASE, ET UNE SEULE FAIT EXCEPTION : `Compte.derniere` est un
 * LIBELLÉ RELATIF. Ce qui manque est la RÈGLE de passage, et aucune requête ne mesure une
 * règle absente.
 */
export const CANDIDATS_DE_LACUNE: readonly CandidatDeLacune[] = [
	{
		forme: 'Note',
		champ: 'pj',
		pourquoi:
			'le jeu porte des DÉCOMPTES, jamais des fichiers, et `nom`, `taille_octets` ' +
			'et `type_media` sont NOT NULL. Le gel ne nomme que DEUX des treize pièces — ' +
			'celles du panneau de V-14 (:1831-1840). ET CES DEUX-LÀ NE SE SÈMENT PAS NON ' +
			'PLUS : leur taille y est un RENDU — « 1,2 Mo », « 18 Ko » —, pas une donnée. ' +
			'Aucun nombre d’octets ne se déduit de « 1,2 Mo » : tout l’intervalle des ' +
			'tailles à deux chiffres significatifs s’y affiche pareil. C’est le défaut de ' +
			'`Compte.derniere` mot pour mot — le gel montre le rendu, la colonne veut la ' +
			'donnée, et le passage inverse n’est pas une fonction. En écrire une serait ' +
			'la valeur illustrative que P-02 proscrit.',
		ceQuiLaFermerait:
			'un regel qui donne les treize pièces en DONNÉES — nom, octets, type de média. ' +
			'Ni une migration ni une semence : la table les attend depuis 002',
		mesurer: async ({ base }) => {
			const declarantes = CORPUS.filter((n) => n.pj > 0);
			const declarees = declarantes.reduce((s, n) => s + n.pj, 0);
			const lignes = rangs<{ identifiant: string; n: number }>(
				await base.execute(
					`select n.identifiant, count(p.id)::int as n
					   from notes n join pieces_jointes p on p.note_id = n.id
					  group by n.identifiant`
				)
			);
			const reelles = new Map(lignes.map((l) => [l.identifiant, l.n]));
			const portees = [...reelles.values()].reduce((s, n) => s + n, 0);
			const servies = declarantes.filter((n) => reelles.get(n.id) === n.pj).length;
			return {
				attendu: declarantes.length,
				restituables: servies,
				combien:
					`${String(declarantes.length)} note(s) sur ${String(CORPUS.length)} en ` +
					`déclarent, ${String(declarees)} pièce(s) déclarée(s), ` +
					`${String(PIECES_NOMMEES_AU_GEL)} nommée(s) au gel dont ` +
					`${String(PIECES_CHIFFRABLES_AU_GEL)} chiffrable(s) en octets, ` +
					`${String(portees)} portée(s) en base`
			};
		}
	},
	{
		forme: 'Note',
		champ: 'etiquettes (leur ORDRE)',
		pourquoi:
			'`etiquettes_de_note` était une pure table de liaison : l’ordre du jeu — qui ' +
			'n’est pas l’ordre alphabétique — n’y était pas représentable, et la couche ' +
			'rendait un tri par libellé, déterministe et déclaré, plutôt qu’un ordre ' +
			'physique de lignes que PostgreSQL ne garantit pas.',
		ceQuiLaFermerait: 'une colonne `ordre` sur `etiquettes_de_note`, écrite par la semence',
		mesurer: async ({ base }) => {
			const attendues = CORPUS.filter((n) => n.etiquettes.length > 0);
			const lignes = rangs<{ identifiant: string; libelles: string }>(
				await base.execute(
					`select n.identifiant,
					        string_agg(e.libelle, chr(31) order by en.ordre) as libelles
					   from etiquettes_de_note en
					   join notes n on n.id = en.note_id
					   join etiquettes e on e.id = en.etiquette_id
					  group by n.identifiant`
				)
			);
			const enBase = new Map(lignes.map((l) => [l.identifiant, l.libelles]));
			const fideles = attendues.filter(
				(n) => enBase.get(n.id) === n.etiquettes.join(SEPARATEUR)
			).length;
			return {
				attendu: attendues.length,
				restituables: fideles,
				combien:
					`${String(fideles)} note(s) sur ${String(attendues.length)} dont la base ` +
					'rend l’ordre exact du jeu'
			};
		}
	},
	{
		forme: 'Template',
		champ: 'utilisations',
		pourquoi:
			'AUCUNE COLONNE, ET AUCUNE COLONNE NE SUFFIRAIT. C’est un compteur d’EMPLOI : ' +
			'il se calcule sur la provenance des notes créées depuis un template, et rien ' +
			'ne l’enregistre. Mais le manque de schéma n’est pas le défaut — le défaut est ' +
			'ARITHMÉTIQUE et il est DANS LE GEL : V-31 déclare 34+12+7+19 utilisations ' +
			'(:2705, :2711, :2717, :2723), son `total()` les somme (:3289-3291) et les ' +
			'imprime au :1655, alors que le corpus embarqué par cette même maquette compte ' +
			'32 notes (:1876-2200). Aucune colonne de provenance ne peut porter 72 ' +
			'provenances sur 32 lignes.',
		ceQuiLaFermerait:
			'un regel de V-31 — voir `docs/dossier-regel.md`. Poser la colonne ne fermerait ' +
			'rien : rien ne l’écrirait, rien ne la lirait (P-5)',
		mesurer: async ({ base }) => {
			/* La question mesurée est « `notes` référence-t-elle `templates` ? », posée au
			   catalogue plutôt qu'à un nom de colonne deviné : le jour où une migration
			   pose la provenance, ce compte bouge tout seul. */
			const lignes = rangs<{ n: number }>(
				await base.execute(
					`select count(*)::int as n
					   from information_schema.table_constraints tc
					   join information_schema.constraint_column_usage ccu
					     on ccu.constraint_name = tc.constraint_name
					    and ccu.constraint_schema = tc.constraint_schema
					  where tc.table_name = 'notes'
					    and tc.constraint_type = 'FOREIGN KEY'
					    and ccu.table_name = 'templates'`
				)
			);
			const provenances = lignes[0]?.n ?? 0;
			const annoncees = TEMPLATES.reduce((s, t) => s + (t.utilisations ?? 0), 0);
			return {
				attendu: TEMPLATES.length,
				restituables: provenances === 0 ? 0 : TEMPLATES.length,
				combien:
					`les ${String(TEMPLATES.length)} templates — ${String(annoncees)} ` +
					`utilisations annoncées pour ${String(CORPUS.length)} notes au corpus, ` +
					`${String(provenances)} provenance(s) en base`
			};
		}
	},
	{
		forme: 'Compte',
		champ: 'id',
		pourquoi:
			'`c-karim` et ses quatre voisins ne sont écrits nulle part, ET C’EST UNE ' +
			'DÉCISION : `comptes.identifiant` porte déjà l’identifiant de connexion que ' +
			'CDC:1178 énumère (`karim.belhadj`), et un second identifiant qu’aucune règle ' +
			'du produit ne demande serait une colonne de commodité de semence. L’`id` de ' +
			'la table est un UUID tiré au hasard, donc différent à chaque semence.',
		ceQuiLaFermerait:
			'rien qui vaille la peine — ce champ appartient au jeu, pas au produit. Il ' +
			'reste compté ici plutôt qu’effacé : une lacune assumée se déclare, elle ne ' +
			'se retire pas de l’instrument',
		mesurer: async ({ base }) => {
			/* La mesure cherche les identifiants du jeu là où ils pourraient être : dans
			   la seule colonne d'identité de `comptes`. Elle rend 0, et elle rendrait 5
			   le jour où une colonne les porterait. */
			const attendus = COMPTES.map((c) => c.id);
			const lignes = rangs<{ identifiant: string }>(
				await base.execute(`select identifiant from comptes`)
			);
			const trouves = lignes.filter((l) => attendus.includes(l.identifiant)).length;
			return {
				attendu: COMPTES.length,
				restituables: trouves,
				combien:
					`${String(trouves)} identifiant(s) de jeu sur ${String(COMPTES.length)} ` +
					'retrouvé(s) en base'
			};
		}
	},
	{
		forme: 'Compte',
		champ: 'domaine',
		pourquoi:
			'`comptes` n’avait pas la colonne. RG-M14-04 (CDC:1149) en fixe la forme — ' +
			'« les comptes rattachés au domaine supprimé sont conservés ; leur ' +
			'rattachement devient vide » —, c’est-à-dire une colonne nullable en ' +
			'`ON DELETE SET NULL`.',
		ceQuiLaFermerait: 'une colonne de rattachement sur `comptes`, écrite par la semence',
		mesurer: async ({ base }) => {
			const lignes = rangs<{ identifiant: string; domaine: string | null }>(
				await base.execute(
					`select c.identifiant, d.nom as domaine
					   from comptes c left join domaines d on d.id = c.domaine_id`
				)
			);
			const enBase = new Map(lignes.map((l) => [l.identifiant, l.domaine]));
			const rattaches = COMPTES.filter((c) => enBase.get(c.identifiant) === c.domaine).length;
			return {
				attendu: COMPTES.length,
				restituables: rattaches,
				combien:
					`${String(rattaches)} compte(s) sur ${String(COMPTES.length)} dont la base ` +
					'porte le rattachement du jeu'
			};
		}
	},
	{
		forme: 'Compte',
		champ: 'derniere',
		pourquoi:
			'« aujourd’hui à 08:41 » est un libellé RELATIF, donc un RENDU et non une ' +
			'donnée. `comptes.derniere_connexion_le` porte l’instant depuis `005`, et ' +
			'`instantDeDerniereConnexion()` déduit l’instant du libellé. LE SENS INVERSE ' +
			'N’EST PAS DÉDUCTIBLE : aucune source du gel ne donne le seuil où « N jours » ' +
			'devient « N mois », ni l’heure que porterait un « il y a 3 jours ». Les deux ' +
			'vues qui l’affichent écrivent la chaîne telle quelle, sans la calculer — ' +
			'V-32:3043 et V-25:2712. L’inventer serait un comblement (CLAUDE.md §2).',
		ceQuiLaFermerait:
			'un arbitrage donnant la règle de passage de l’instant au libellé, puis la ' +
			'fabrique qui l’applique — la donnée, elle, est en base',
		mesurer: async ({ base, comptesRendus }) => {
			/* LA SEULE MESURE QUI REGARDE LE CANDIDAT : ce qui manque est une règle de
			   rendu, et une requête ne mesure pas une règle absente. Le nombre d'instants
			   portés est relevé quand même — il dit que la donnée est là. */
			const lignes = rangs<{ n: number }>(
				await base.execute(
					`select count(*)::int as n from comptes where derniere_connexion_le is not null`
				)
			);
			const instants = lignes[0]?.n ?? 0;
			const parIdentifiant = new Map(
				comptesRendus.map((c) => [c.identifiant, c.derniere as string | undefined])
			);
			const rendus = COMPTES.filter((c) => parIdentifiant.get(c.identifiant) === c.derniere).length;
			return {
				attendu: COMPTES.length,
				restituables: rendus,
				combien:
					`${String(instants)} instant(s) en base sur ${String(COMPTES.length)}, et ` +
					`${String(rendus)} libellé(s) restitué(s) — la donnée est portée, la règle ` +
					'de rendu manque'
			};
		}
	}
];

/**
 * Les lacunes, MESURÉES — celles qui restent ouvertes, et elles seules. Une lacune dont la
 * base porte désormais toutes les valeurs DISPARAÎT du rapport, et la normalisation qu'elle
 * justifiait disparaît avec elle. ELLE NE SAIT PAS FERMER UNE LACUNE PAR COMPLAISANCE : la
 * seule façon de faire disparaître une entrée est que sa mesure rende `restituables >=
 * attendu`.
 */
export async function chiffrerLesLacunes(
	contexte: ContexteDeMesure,
	candidats: readonly CandidatDeLacune[] = CANDIDATS_DE_LACUNE
): Promise<readonly Lacune[]> {
	const ouvertes: Lacune[] = [];
	for (const candidat of candidats) {
		const mesure = await candidat.mesurer(contexte);
		if (mesure.restituables >= mesure.attendu) continue;
		ouvertes.push({
			forme: candidat.forme,
			champ: candidat.champ,
			combien: mesure.combien,
			pourquoi: candidat.pourquoi,
			ceQuiLaFermerait: candidat.ceQuiLaFermerait
		});
	}
	return ouvertes;
}

function estOuverte(lesLacunes: readonly Lacune[], forme: string, prefixeDeChamp: string): boolean {
	return lesLacunes.some((l) => l.forme === forme && l.champ.startsWith(prefixeDeChamp));
}

/**
 * La référence des notes, normalisée par ce que les lacunes OUVERTES permettent.
 *
 * Ce n'est pas un affaiblissement : on remplace la valeur de référence par ce que la lacune
 * permet AU MIEUX, et tout écart au-delà reste rouge. La normalisation est CONDITIONNÉE par la
 * mesure — lacune refermée, référence intacte.
 *
 *   `etiquettes`  lacune ouverte → référence TRIÉE : l'ordre cesse d'être mesuré, l'ENSEMBLE
 *                 l'est toujours.
 *   `pj`          lacune ouverte → référence au décompte RÉEL de la table, mesuré
 *                 indépendamment de la couche.
 */
export function normalisationDesNotes(
	lesLacunes: readonly Lacune[],
	piecesReelles: ReadonlyMap<string, number>,
	consultationsReelles: ReadonlyMap<string, number> = new Map()
): readonly Note[] {
	const ordreEnLacune = estOuverte(lesLacunes, 'Note', 'etiquettes');
	const pjEnLacune = estOuverte(lesLacunes, 'Note', 'pj');
	return CORPUS.map((n) => ({
		...n,
		pj: pjEnLacune ? (piecesReelles.get(n.id) ?? 0) : n.pj,
		/* `ARB-061` : la valeur du jeu PLUS les entrées du journal. Les croiser est
		   plus fort que comparer le compteur à une constante que la première lecture
		   périme. */
		vues: n.vues + (consultationsReelles.get(n.id) ?? 0),
		etiquettes: ordreEnLacune
			? [...n.etiquettes].sort((a, b) => a.localeCompare(b, 'fr'))
			: n.etiquettes
	}));
}

export function champsDeCompteEnLacune(lesLacunes: readonly Lacune[]): ReadonlySet<string> {
	return new Set(lesLacunes.filter((l) => l.forme === 'Compte').map((l) => l.champ));
}
