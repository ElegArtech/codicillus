/**
 * LA BATTERIE D'ÉQUIVALENCE — ce que la base rend est-il ce que le jeu exporte ?
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE PROUVE, ET POURQUOI HUIT LOTS EN DÉPENDENT
 *
 * La base a été semée DEPUIS `seeds/corpus.ts` (`commandes.ts` `semer()`). Les
 * deux côtés portent donc les mêmes données, et une couche de lecture fidèle
 * doit rendre EXACTEMENT les formes du jeu — mêmes valeurs, mêmes clés, même
 * ordre. Si c'est vrai, un chargeur de route qui remplace `corpusPourVue()` par
 * `lireNotes()` ne peut pas déplacer un pixel, et les huit lots de câblage n'ont
 * plus à le prouver écran par écran.
 *
 * Elle ne prouve RIEN sur le rendu : la conformité aux maquettes reste l'affaire
 * de `pnpm verif:maquette`. Elle prouve que les DONNÉES qu'on lui donnera sont
 * les mêmes. C'est une prémisse, pas un verdict d'écran.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX GENRES DE CONSTAT, ET LES DEUX FONT ROUGIR
 *
 *   DIVERGENCE  la base porte la donnée, la couche la rend mal. C'est un défaut
 *               de ce lot, et il se corrige dans `lecture.ts`.
 *   LACUNE      la base NE PORTE PAS la donnée : aucune colonne ne l'accueille,
 *               la semence ne l'écrit pas, ou le gel ne la donne qu'en RENDU.
 *               Aucune ligne de `lecture.ts` ne peut la refermer — il y faut une
 *               migration, une semence, un arbitrage ou un regel.
 *
 * Les deux comptent dans le rouge, et c'est délibéré. Une lacune tolérée
 * silencieusement est exactement ce qui ferait échouer un lot de câblage six
 * semaines plus tard, sur un écran, sans que personne sache pourquoi. Le
 * distinguo est dans le RAPPORT, pas dans le code de retour.
 *
 * ET LES LACUNES SONT MESURÉES, PLUS DÉCLARÉES (`T-049`). Elles ont été une
 * liste de six littéraux, et la liste a survécu à la migration qui en refermait
 * trois : le rapport imprimait « `comptes` n'a pas la colonne » alors que la
 * colonne existait et que la semence l'écrivait. Un instrument qui affirme au
 * lieu de mesurer gouverne la couche qu'il est censé juger — `lecture.ts` a
 * renoncé à rendre une donnée juste pour ne pas rougir. `chiffrerLesLacunes()`
 * interroge désormais la base, candidat par candidat.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES, ET POURQUOI LEUR CODE EST INVERSÉ
 *
 * Un banc toujours vert ne prouve rien (RA-01). `--sonde=<genre>` perturbe le
 * CANDIDAT — ce que la couche de lecture rend —, jamais la référence, et exige
 * que la batterie rougisse DAVANTAGE : le code de retour est alors inversé.
 *
 * L'inversion s'arrête au refus de conclure : quand la mutation n'a RIEN
 * TOUCHÉ, elle ne teste rien, et l'instrument refuse. Inverser ce cas
 * fabriquerait un vert à partir d'une sonde inerte — le défaut qu'ARB-013 a
 * laissé courir huit lots (P-5).
 *
 * ET LA MESURE NE PEUT PAS ÊTRE « LE ROUGE EXISTE » : la batterie est DÉJÀ
 * rouge, de ses lacunes. Une sonde qui se contenterait de constater du rouge
 * serait inerte sans qu'on le voie — le piège même que P-26 décrit. Elle
 * compare donc le NOMBRE de divergences avec et sans mutation, et n'accepte que
 * s'il a AUGMENTÉ.
 */
import {
	COMPTES,
	CONFIG,
	CORPUS,
	DETAIL_DOMAINES,
	DOMAINES,
	RELATIONS,
	RELATIONS_TECHNIQUES,
	TEMPLATES,
	TYPES_FICHE,
	TYPES_NOTE,
	TYPES_RELATION,
	UNIVERS,
	type Compte,
	type Note
} from '../../../seeds/corpus';
import type { Base } from '../base/acces';
import { instantDeReference, lignesDeDossier } from '../base/semence';
import {
	lireCheminsDeDossier,
	lireComptes,
	lireConfiguration,
	lireDescriptionsDeDomaine,
	lireDomaines,
	lireDomainesParDossier,
	lireModulesParDomaine,
	lireNotes,
	lireRelations,
	lireRelationsTechniques,
	lireSeuils,
	lireTemplates,
	lireTypesDeFiche,
	lireTypesDeNote,
	lireTypesDeRelation,
	lireUnivers
} from './lecture';

/* ═══════════════════════════════════════════ La comparaison profonde ═══ */

/**
 * Le premier chemin où deux valeurs diffèrent, ou `null` si elles sont égales.
 *
 * ELLE COMPARE LES ENSEMBLES DE CLÉS, et pas seulement les valeurs. Une clé
 * présente et valant `undefined` n'est PAS une clé absente : `interface Note`
 * déclare `typeFiche`, `url` et `ajoute` optionnels, et une couche qui les
 * poserait à `undefined` au lieu de les omettre rendrait un objet de forme
 * différente. `JSON.stringify` efface cette différence — c'est pourquoi elle
 * n'est pas mesurée par sérialisation.
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

/* ═══════════════════════════════════════════════════ Les sondes ═════════ */

/** Ce qu'une sonde fait aux notes que la couche a rendues, et combien elle touche. */
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
				if (trie.join('') === n.etiquettes.join('')) return n;
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

/* ═══════════════════════════════════════════════════ Les constats ═══════ */

/** Une donnée que la base ne peut pas rendre : aucune colonne, ou rien d'écrit. */
export interface Lacune {
	readonly forme: string;
	readonly champ: string;
	readonly combien: string;
	readonly pourquoi: string;
	readonly ceQuiLaFermerait: string;
}

/**
 * CE QU'UNE MESURE DE LACUNE CONSTATE.
 *
 * `attendu` est le nombre de valeurs que le JEU demande de restituer pour cette
 * forme ; `restituables` est le nombre que la base permet RÉELLEMENT de rendre,
 * et il est MESURÉ, jamais déclaré. La lacune est ouverte tant que
 * `restituables < attendu`, et elle disparaît du rapport à l'égalité.
 */
export interface MesureDeLacune {
	readonly attendu: number;
	readonly restituables: number;
	/** Le libellé chiffré du rapport — il porte les deux nombres et leur unité. */
	readonly combien: string;
}

/** Ce que la mesure d'une lacune a le droit de regarder. */
export interface ContexteDeMesure {
	readonly base: Base;
	/**
	 * CE QUE LA COUCHE REND DES COMPTES, et il n'est là que pour les champs dont
	 * la restitution est un RENDU et non une colonne — `Compte.derniere` est le
	 * seul. Pour tous les autres, la mesure interroge la BASE : mesurer sur le
	 * candidat ce que le candidat doit produire refermerait une lacune dès que la
	 * couche fabriquerait la valeur, ce qui est exactement ce que P-02 interdit.
	 */
	readonly comptesRendus: readonly Partial<Compte>[];
}

/** Une lacune candidate : son motif est écrit, son chiffre est mesuré. */
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
 * CE QUE LE GEL DONNE DES PIÈCES JOINTES, COMPTÉ SUR LE FICHIER OUVERT.
 *
 * Deux constantes, et c'est la seconde qui décide. `mockups/V-14-lecture-note.html`
 * :1831-1840 nomme deux pièces, avec leur taille et leur date de dépôt. Aucune
 * autre maquette n'en nomme une seule : les onze autres pièces que le jeu
 * décompte n'ont ni nom, ni taille, ni type de média.
 *
 * Mais les tailles de ces deux-là y sont écrites « 1,2 Mo » et « 18 Ko »,
 * c'est-à-dire RENDUES. `taille_octets` veut un nombre d'octets, et « 1,2 Mo »
 * n'en désigne aucun — il en désigne un intervalle. Le nombre de pièces dont le
 * gel donne une taille exploitable comme DONNÉE est donc zéro, et c'est ce zéro
 * qui interdit la semence, pas les onze noms manquants.
 *
 * Elles sont deux plutôt qu'une parce qu'elles ne disent pas la même chose : la
 * première dit ce qu'un regel devrait compléter, la seconde dit pourquoi un
 * regel des seuls NOMS ne suffirait pas — il faut changer la nature de ce que la
 * maquette porte, du rendu vers la donnée.
 */
const PIECES_NOMMEES_AU_GEL = 2;
const PIECES_CHIFFRABLES_AU_GEL = 0;

/**
 * LES LACUNES CANDIDATES — leur motif est écrit à la main, leur chiffre est
 * mesuré à chaque exécution.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE TABLEAU N'EST PLUS LA LISTE DES LACUNES
 *
 * Il l'a été, et c'était un défaut d'instrument : six littéraux, comptés tels
 * quels. `T-030b` l'a relevé, et l'entête de `lacunes()` promettait déjà le
 * contraire — « une lacune qu'une migration referme disparaît d'elle-même du
 * rapport » — sans qu'aucune ligne ne le fasse. La `chiffrerLesLacunes()` que ce
 * commentaire nommait n'existait pas ; `total = divergences + 6` était donc un
 * plancher, et la batterie ne pouvait PAS atteindre zéro.
 *
 * La conséquence était pire que le plancher, et elle a coûté deux lots : la
 * migration `005` a posé `comptes.domaine_id`, `comptes.derniere_connexion_le` et
 * `etiquettes_de_note.ordre`, la semence les écrit — et le rapport a continué
 * d'imprimer « `comptes` n'a pas la colonne ». Un instrument qui affirme au lieu
 * de mesurer finit par mentir sur le sens inverse : rendre la donnée que la base
 * porte désormais aurait fait rougir la batterie POUR AVOIR EU RAISON, et
 * `lecture.ts` a préféré ne pas la rendre. L'instrument a gouverné la couche.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CHAQUE MESURE INTERROGE LA BASE, ET UNE SEULE FAIT EXCEPTION
 *
 * La définition d'une lacune est « la base NE PORTE PAS la donnée » : la mesure
 * est donc une requête, indépendante de la couche de lecture. Une seule
 * exception, et elle est motivée à son entrée : `Compte.derniere` est un LIBELLÉ
 * RELATIF, c'est-à-dire un rendu. La base porte l'instant depuis `005` ; ce qui
 * manque est la RÈGLE de passage, et aucune requête ne mesure une règle absente.
 * Sa restitution est donc mesurée là où elle se produirait — sur ce que la couche
 * rend —, et le jour où un arbitrage donne le seuil, la lacune se referme seule.
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
			/* La question mesurée est « `notes` référence-t-elle `templates` ? », et
			   elle est posée au catalogue plutôt qu'à un nom de colonne devinné : le
			   jour où une migration pose la provenance, ce compte bouge tout seul. */
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
			/* LA SEULE MESURE QUI REGARDE LE CANDIDAT, et son entête dit pourquoi : ce
			   qui manque est une règle de rendu, et une requête ne mesure pas une règle
			   absente. Le nombre d'instants portés est relevé quand même — il dit que la
			   donnée est là et que seul le rendu manque. */
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
 * LES LACUNES, MESURÉES — celles qui restent ouvertes, et elles seules.
 *
 * C'est la fonction que l'entête de l'ancien `lacunes()` promettait sans
 * l'écrire. Une lacune dont la base porte désormais toutes les valeurs
 * DISPARAÎT du rapport, et la normalisation qu'elle justifiait disparaît avec
 * elle — `normalisationDesNotes()` et `champsDeCompteEnLacune()` se déduisent de
 * ce qu'elle rend, jamais d'une liste écrite ailleurs.
 *
 * ELLE NE SAIT PAS FERMER UNE LACUNE PAR COMPLAISANCE : la seule façon de faire
 * disparaître une entrée est que sa mesure rende `restituables >= attendu`, et
 * chaque mesure interroge la base. Une lacune inventée — un candidat dont la
 * base ne porte rien — apparaît donc et compte, sans qu'aucune ligne d'ici n'ait
 * à la connaître ; c'est l'épreuve que `equivalence.test.ts` lui fait passer.
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

/** Une lacune est-elle ouverte, par sa forme et son champ ? */
function estOuverte(lesLacunes: readonly Lacune[], forme: string, prefixeDeChamp: string): boolean {
	return lesLacunes.some((l) => l.forme === forme && l.champ.startsWith(prefixeDeChamp));
}

/**
 * LA RÉFÉRENCE DES NOTES, NORMALISÉE PAR CE QUE LES LACUNES OUVERTES PERMETTENT.
 *
 * CE N'EST PAS UN AFFAIBLISSEMENT, et le motif n'a pas changé : on ne retire
 * rien de la mesure, on remplace la valeur de référence par ce que la lacune
 * permet AU MIEUX, et tout écart au-delà reste rouge. Ce qui a changé, c'est que
 * la normalisation est désormais CONDITIONNÉE par la mesure : lacune refermée,
 * référence intacte, champ mesuré pour de bon.
 *
 *   `etiquettes`  lacune ouverte → la référence est TRIÉE : l'ordre cesse d'être
 *                 mesuré, l'ENSEMBLE l'est toujours, et une étiquette manquante
 *                 ou en trop rougit encore.
 *   `pj`          lacune ouverte → la référence prend le décompte RÉEL de la
 *                 table, mesuré par une requête INDÉPENDANTE de la couche. Le
 *                 décompte du jeu cesse d'être exigé — c'est ce que la lacune
 *                 dit —, mais la couche doit rendre le compte vrai : une couche
 *                 qui fabriquerait un chiffre diverge, y compris à zéro.
 */
export function normalisationDesNotes(
	lesLacunes: readonly Lacune[],
	piecesReelles: ReadonlyMap<string, number>
): readonly Note[] {
	const ordreEnLacune = estOuverte(lesLacunes, 'Note', 'etiquettes');
	const pjEnLacune = estOuverte(lesLacunes, 'Note', 'pj');
	return CORPUS.map((n) => ({
		...n,
		pj: pjEnLacune ? (piecesReelles.get(n.id) ?? 0) : n.pj,
		etiquettes: ordreEnLacune
			? [...n.etiquettes].sort((a, b) => a.localeCompare(b, 'fr'))
			: n.etiquettes
	}));
}

/** Les champs de compte qu'une lacune ouverte retire de la comparaison. */
export function champsDeCompteEnLacune(lesLacunes: readonly Lacune[]): ReadonlySet<string> {
	return new Set(lesLacunes.filter((l) => l.forme === 'Compte').map((l) => l.champ));
}

/* ═══════════════════════════════════════════════════ Le rapport ═════════ */

interface Verdict {
	readonly forme: string;
	readonly attendus: number;
	readonly obtenus: number;
	/**
	 * LE COMPTE VRAI, jamais tronqué. `montrees` est ce que le rapport imprime ;
	 * ce nombre est ce que la sonde compare. Confondre les deux plafonnerait le
	 * décompte, et une sonde qui ajoute des divergences au-delà du plafond
	 * paraîtrait inerte — un faux rouge de sonde, donc un faux vert de batterie.
	 */
	readonly combien: number;
	readonly montrees: readonly string[];
}

export interface RapportDEquivalence {
	readonly texte: string;
	readonly code: 0 | 1 | 2;
	readonly divergences: number;
}

/** Compare deux suites d'objets appariées par une clé, et non par leur position. */
function comparerParCle<A, B>(
	forme: string,
	attendu: readonly A[],
	obtenu: readonly B[],
	cleAttendu: (a: A) => string,
	cleObtenu: (b: B) => string,
	plafond = 6
): Verdict {
	const divergences: string[] = [];
	const parCle = new Map(obtenu.map((o) => [cleObtenu(o), o]));
	for (const a of attendu) {
		const cle = cleAttendu(a);
		const o = parCle.get(cle);
		if (o === undefined) {
			divergences.push(`${cle} : absent de la base`);
			continue;
		}
		const difference = premiereDifference(a, o);
		if (difference !== null) divergences.push(`${cle} → ${difference}`);
	}
	const attenduCles = new Set(attendu.map(cleAttendu));
	for (const o of obtenu) {
		if (!attenduCles.has(cleObtenu(o))) {
			divergences.push(`${cleObtenu(o)} : en base, absent du jeu`);
		}
	}
	return {
		forme,
		attendus: attendu.length,
		obtenus: obtenu.length,
		combien: divergences.length,
		montrees: divergences.slice(0, plafond)
	};
}

/** Compare deux valeurs entières — configuration, tables de correspondance. */
function comparerEntier(forme: string, attendu: unknown, obtenu: unknown): Verdict {
	const difference = premiereDifference(attendu, obtenu);
	return {
		forme,
		attendus: 1,
		obtenus: 1,
		combien: difference === null ? 0 : 1,
		montrees: difference === null ? [] : [difference]
	};
}

/** Compare deux suites dans leur ORDRE — là où l'ordre est une donnée. */
function comparerEnOrdre(forme: string, attendu: unknown[], obtenu: unknown[]): Verdict {
	const difference = premiereDifference(attendu, obtenu);
	return {
		forme,
		attendus: attendu.length,
		obtenus: obtenu.length,
		combien: difference === null ? 0 : 1,
		montrees: difference === null ? [] : [difference]
	};
}

/**
 * La batterie. `genreDeSonde` perturbe le seul côté candidat.
 *
 * L'INSTANT DE RÉFÉRENCE EST CELUI DU JEU. `Note.fraicheur` et `Note.jours` du
 * corpus sont vrais à `DATE_REFERENCE` ; mesurer à l'heure de l'exécution
 * rendrait la batterie rouge chaque jour un peu plus, pour une raison qui n'a
 * rien à voir avec la fidélité de la couche.
 */
export async function rapportDEquivalence(
	base: Base,
	genreDeSonde?: string
): Promise<RapportDEquivalence> {
	const sonde =
		genreDeSonde === undefined ? undefined : SONDES.find((s) => s.genre === genreDeSonde);
	if (genreDeSonde !== undefined && sonde === undefined) {
		return {
			texte:
				`sonde inconnue : « ${genreDeSonde} ». Les sondes posées sont : ` +
				SONDES.map((s) => s.genre).join(', '),
			code: 1,
			divergences: 0
		};
	}

	const lignes: string[] = [
		'verif:donnees — la batterie d’équivalence « base ↔ seeds/corpus.ts »',
		'  « pour chaque forme, ce que la base rend est identique à ce que seeds/corpus.ts',
		'  exporte. » La base est semée DEPUIS ce fichier : toute différence est un défaut',
		'  de la couche de lecture, ou une donnée que le schéma ne porte pas.',
		''
	];
	if (sonde !== undefined) {
		lignes.push(
			`  SONDE POSÉE : ${sonde.genre} — côté ${sonde.cote}`,
			`    ${sonde.description}`,
			'    Le rouge SUPPLÉMENTAIRE est attendu : le lanceur inverse le code de retour.',
			''
		);
	}

	const seuils = await lireSeuils(base);
	const contexte = { maintenant: instantDeReference(), seuils };

	const notesLues = await lireNotes(base, contexte);
	const mutation = sonde === undefined ? undefined : sonde.muter(notesLues);

	/* Les modules et descriptions, remis dans la forme de `DETAIL_DOMAINES`. */
	const modules = await lireModulesParDomaine(base);
	const descriptions = await lireDescriptionsDeDomaine(base);
	const detailObtenu: Record<string, unknown> = {};
	for (const nom of Object.keys(DETAIL_DOMAINES)) {
		detailObtenu[nom] = {
			description: descriptions.get(nom),
			modules: [...(modules.get(nom) ?? [])].sort()
		};
	}
	const detailAttendu: Record<string, unknown> = {};
	for (const [nom, detail] of Object.entries(DETAIL_DOMAINES)) {
		detailAttendu[nom] = { description: detail.description, modules: [...detail.modules].sort() };
	}

	/* Les 19 dossiers : 4 racines — une par domaine, portant son nom — et 15
	   chemins sous elles. La racine n'apparaît PAS dans `Note.dossier` ; elle est
	   donc identifiée par son domaine et un chemin vide, ce qui la compte sans la
	   confondre avec les autres. */
	const cheminsDeDossier = await lireCheminsDeDossier(base);
	const domainesParDossier = await lireDomainesParDossier(base);
	const dossiersAttendus = lignesDeDossier()
		.map((d) => `${d.domaineNom} : ${d.chemin.slice(1).join(' › ')}`)
		.sort();
	const dossiersObtenus = [...cheminsDeDossier.entries()]
		.map(([id, chemin]) => `${domainesParDossier.get(id) ?? '?'} : ${chemin}`)
		.sort();

	const comptesLus = await lireComptes(base);

	/* ── LES LACUNES, MESURÉES AVANT TOUTE COMPARAISON ───────────────────────
	   Elles sont mesurées ICI, et non imprimées à la fin, parce que la référence
	   de deux formes en DÉPEND : ce qu'une lacune ouverte permet au mieux est ce
	   que la comparaison exige, et une lacune refermée rend son champ à la
	   mesure pleine. L'ordre est donc contraint — mesurer, puis normaliser, puis
	   comparer —, jamais l'inverse. */
	const lesLacunes = await chiffrerLesLacunes({ base, comptesRendus: comptesLus });
	const champsDeCompteSansContrepartie = champsDeCompteEnLacune(lesLacunes);
	const utilisationsEnLacune = lesLacunes.some(
		(l) => l.forme === 'Template' && l.champ === 'utilisations'
	);

	/* LE DÉCOMPTE RÉEL DES PIÈCES JOINTES, PAR UNE REQUÊTE À NOUS. Il sert de
	   référence quand `Note.pj` est en lacune, et il est délibérément SÉPARÉ de
	   `lirePiecesJointesParNote()` : prendre la valeur du candidat pour référence
	   rendrait la comparaison tautologique — la couche serait comparée à
	   elle-même, et un décompte fabriqué passerait au vert. */
	const piecesReellesParNote = new Map(
		rangs<{ identifiant: string; n: number }>(
			await base.execute(
				`select n.identifiant, count(p.id)::int as n
				   from notes n left join pieces_jointes p on p.note_id = n.id
				  group by n.identifiant`
			)
		).map((l) => [l.identifiant, l.n])
	);
	const comptesAttendus = COMPTES.map((c) => {
		const reduit: Record<string, unknown> = {};
		for (const [cle, valeur] of Object.entries(c)) {
			if (!champsDeCompteSansContrepartie.has(cle)) reduit[cle] = valeur;
		}
		return reduit;
	});

	/* Les formes AUTRES que les notes ne dépendent pas de la sonde : elles sont
	   mesurées une fois, et réemployées pour les deux passes. */
	const verdictsHorsNotes: Verdict[] = [
		comparerEnOrdre('les univers', [...UNIVERS], [...(await lireUnivers(base))]),
		comparerParCle(
			'les domaines',
			DOMAINES,
			await lireDomaines(base),
			(d) => d.nom,
			(d) => d.nom
		),
		comparerEntier('les modules et descriptions de domaine', detailAttendu, detailObtenu),
		comparerEnOrdre('les dossiers', dossiersAttendus, dossiersObtenus),
		comparerParCle(
			'les relations',
			RELATIONS,
			await lireRelations(base),
			(r) => `${r.de} ${r.type} ${r.vers}`,
			(r) => `${r.de} ${r.type} ${r.vers}`
		),
		comparerParCle(
			/* LE NOMBRE DE CHAMPS EST COMPTÉ, PAS ÉCRIT. Il valait « 6 » en dur, et
			   il est devenu faux le jour où `Compte.domaine` a cessé d'être en
			   lacune : un libellé de rapport qui ne suit pas sa propre mesure est la
			   version bénigne du défaut que ce lot répare. */
			`les comptes (les ${String(Object.keys(COMPTES[0] ?? {}).length - champsDeCompteSansContrepartie.size)} champs que la base porte)`,
			comptesAttendus,
			comptesLus,
			(c) => String(c['identifiant']),
			(c) => String((c as Record<string, unknown>)['identifiant'])
		),
		comparerEntier('la configuration', CONFIG, await lireConfiguration(base)),
		comparerEnOrdre('les types de note', [...TYPES_NOTE], [...(await lireTypesDeNote(base))]),
		comparerEntier('les types de fiche', TYPES_FICHE, await lireTypesDeFiche(base)),
		comparerEntier('les types de relation', TYPES_RELATION, await lireTypesDeRelation(base)),
		comparerEnOrdre(
			'les relations techniques',
			[...RELATIONS_TECHNIQUES].sort(),
			[...(await lireRelationsTechniques(base))].sort()
		),
		comparerParCle(
			utilisationsEnLacune ? 'les templates (hors `utilisations`, en lacune)' : 'les templates',
			TEMPLATES.map((t) => {
				const reduit: Record<string, unknown> = { ...t };
				if (utilisationsEnLacune) delete reduit['utilisations'];
				return reduit;
			}),
			await lireTemplates(base),
			(t) => String(t['id']),
			(t) => String((t as unknown as Record<string, unknown>)['id'])
		)
	];

	/* ── LA NORMALISATION, DÉSORMAIS DÉDUITE DE LA MESURE ────────────────────
	   Les lacunes OUVERTES sont comptées UNE FOIS, dans leur section. Les
	   laisser aussi rougir la comparaison des formes les compterait deux fois
	   et, plus grave, MASQUERAIT les vrais défauts de couche derrière elles : la
	   comparaison ne rend que la PREMIÈRE différence de chaque objet, et une
	   lacune sur `etiquettes` cachait déjà celle sur `pj`.

	   CE QUI A CHANGÉ AVEC `chiffrerLesLacunes()` : la liste n'est plus écrite,
	   elle est mesurée, et la normalisation la suit. Une lacune refermée rend
	   son champ à la mesure PLEINE — c'est la promesse que l'ancien entête
	   faisait sans l'écrire. Le détail du « au mieux » de chaque champ est à
	   `normalisationDesNotes()`. */
	const referenceDesNotes = normalisationDesNotes(lesLacunes, piecesReellesParNote);

	const verdictDesNotes = (notesCandidates: readonly Note[]): Verdict =>
		comparerParCle(
			'les notes',
			referenceDesNotes,
			notesCandidates,
			(n) => n.id,
			(n) => n.id
		);

	/* LA PASSE SANS MUTATION EST TOUJOURS JOUÉE, même quand une sonde est posée :
	   c'est elle qui donne le plancher au-dessus duquel la sonde doit faire
	   monter le rouge. Sans ce plancher, une sonde inerte hériterait du rouge
	   des lacunes et passerait pour une sonde qui a mordu (P-26). */
	const divergencesSansMutation =
		verdictDesNotes(notesLues).combien + verdictsHorsNotes.reduce((s, v) => s + v.combien, 0);

	const verdicts: Verdict[] = [
		verdictDesNotes(mutation === undefined ? notesLues : mutation.notes),
		...verdictsHorsNotes
	];

	lignes.push('  LES FORMES, ET CE QUE LA BASE EN REND');
	for (const v of verdicts) {
		const etat = v.combien === 0 ? 'OK  ' : 'ÉCART';
		const compte = v.combien === 0 ? '' : ` — ${String(v.combien)} écart(s)`;
		lignes.push(
			`  ${etat} ${colonne(v.forme, 46)}${String(v.attendus)} attendu(s), ` +
				`${String(v.obtenus)} lu(s)${compte}`
		);
		for (const d of v.montrees) lignes.push(`          ${d}`);
		if (v.combien > v.montrees.length) {
			lignes.push(`          … et ${String(v.combien - v.montrees.length)} autre(s)`);
		}
	}

	const divergences = verdicts.reduce((s, v) => s + v.combien, 0);

	const refermees = CANDIDATS_DE_LACUNE.length - lesLacunes.length;
	lignes.push(
		'',
		`  LES LACUNES — ${String(lesLacunes.length)} donnée(s) que la base NE PORTE PAS`,
		'  Aucune ligne de lecture.ts ne les referme : elles demandent une migration, une',
		'  semence, ou un regel. Elles comptent dans le rouge — une lacune tolérée en',
		'  silence est ce qui ferait échouer un lot de câblage six semaines plus tard.',
		`  ${String(CANDIDATS_DE_LACUNE.length)} candidate(s) mesurée(s), ${String(refermees)} refermée(s) : une lacune dont la base`,
		'  porte toutes les valeurs disparaît d’ici SANS QU’ON LA RETIRE.'
	);
	for (const l of lesLacunes) {
		lignes.push(
			`  MANQUE ${colonne(`${l.forme}.${l.champ}`, 34)}${l.combien}`,
			`           pourquoi : ${l.pourquoi}`,
			`           refermé par : ${l.ceQuiLaFermerait}`
		);
	}

	const total = divergences + lesLacunes.length;
	lignes.push(
		'',
		`  ${String(divergences)} divergence(s) — la base porte la donnée, la couche la rend mal`,
		`  ${String(lesLacunes.length)} lacune(s)     — la base ne porte pas la donnée`
	);

	/* ── LE VERDICT SOUS SONDE ────────────────────────────────────────────────
	   Il ne peut pas être « du rouge existe » : il en existe déjà, du fait des
	   lacunes. Le seul verdict qui mesure quelque chose est le DELTA — la
	   mutation a-t-elle fait MONTER le nombre de divergences ? */
	if (mutation !== undefined && sonde !== undefined) {
		lignes.push('', `  la sonde ${sonde.genre} a touché ${String(mutation.touches)} note(s).`);
		if (mutation.touches === 0) {
			lignes.push(
				'  MUTATION INERTE : elle ne touche rien, donc elle ne teste rien.',
				'  REFUS DE CONCLURE — code 2, jamais inversé. Inverser ici fabriquerait un vert',
				'  à partir d’une sonde qui n’a rien fait.'
			);
			return { texte: lignes.join('\n'), code: 2, divergences: total };
		}
		const monte = divergences - divergencesSansMutation;
		lignes.push(
			`  divergences sans la mutation : ${String(divergencesSansMutation)} — avec : ` +
				`${String(divergences)} (${monte >= 0 ? '+' : ''}${String(monte)})`
		);
		if (monte > 0) {
			lignes.push('  LA BATTERIE A VU LA MUTATION : le lanceur inverse, 0.');
			return { texte: lignes.join('\n'), code: 1, divergences: total };
		}
		lignes.push(
			'  LA BATTERIE N’A RIEN VU : la mutation a touché des notes et le décompte n’a pas',
			'  monté. C’est un trou de mesure, et le lanceur le rend en 1.'
		);
		return { texte: lignes.join('\n'), code: 0, divergences: total };
	}

	lignes.push(
		'',
		total === 0
			? '  ÉQUIVALENCE ÉTABLIE : la base rend exactement les formes du jeu de semence.'
			: `  ÉQUIVALENCE NON ÉTABLIE sur ${String(total)} point(s).`
	);

	return { texte: lignes.join('\n'), code: total === 0 ? 0 : 1, divergences: total };
}

function colonne(texte: string, largeur: number): string {
	return texte.length >= largeur ? `${texte} ` : texte + ' '.repeat(largeur - texte.length);
}
