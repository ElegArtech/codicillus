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
 *               ou la semence ne l'écrit pas. Aucune ligne de `lecture.ts` ne
 *               peut la refermer — seule une migration le peut.
 *
 * Les deux comptent dans le rouge, et c'est délibéré. Une lacune tolérée
 * silencieusement est exactement ce qui ferait échouer un lot de câblage six
 * semaines plus tard, sur un écran, sans que personne sache pourquoi. Le
 * distinguo est dans le RAPPORT, pas dans le code de retour.
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
 * LES LACUNES, RELEVÉES ET CHIFFRÉES.
 *
 * Chaque entrée a été MESURÉE sur le dépôt, jamais déduite (P-21). Les
 * décomptes sont recalculés à chaque exécution par `chiffrerLesLacunes()` : une
 * lacune qu'une migration referme disparaît d'elle-même du rapport, et une
 * lacune qui s'aggrave se voit.
 */
export function lacunes(): readonly Lacune[] {
	const notesAvecPj = CORPUS.filter((n) => n.pj > 0);
	const piecesDeclarees = notesAvecPj.reduce((s, n) => s + n.pj, 0);
	const desordonnees = CORPUS.filter((n) => {
		const trie = [...n.etiquettes].sort((a, b) => a.localeCompare(b, 'fr'));
		return trie.join(' ') !== [...n.etiquettes].join(' ');
	});

	return [
		{
			forme: 'Note',
			champ: 'pj',
			combien:
				`${String(notesAvecPj.length)} note(s) sur ${String(CORPUS.length)}, ` +
				`${String(piecesDeclarees)} pièce(s) jointe(s) déclarée(s)`,
			pourquoi:
				'la table `pieces_jointes` existe depuis 002 mais AUCUNE semence n’y écrit : ' +
				'`semence.ts` n’a pas de `lignesDePieceJointe()`. Le compte réel est donc 0 ' +
				'partout, et P-02 interdit de rendre le chiffre du jeu à la place.',
			ceQuiLaFermerait: 'une semence des pièces jointes — le jeu porte les décomptes, pas les noms'
		},
		{
			forme: 'Note',
			champ: 'etiquettes (leur ORDRE)',
			combien:
				`${String(desordonnees.length)} note(s) sur ${String(CORPUS.length)} dont l’ordre ` +
				'du jeu n’est pas l’ordre alphabétique',
			pourquoi:
				'`etiquettes_de_note` est une table de liaison sans colonne de rang : l’ordre ' +
				'du jeu n’y est pas représentable. La couche rend un ordre alphabétique, ' +
				'DÉTERMINISTE et déclaré, plutôt qu’un ordre physique de lignes que ' +
				'PostgreSQL ne garantit pas et qui rendrait cette batterie verte par accident.',
			ceQuiLaFermerait: 'une colonne `ordre` sur `etiquettes_de_note`, écrite par la semence'
		},
		{
			forme: 'Template',
			champ: 'utilisations',
			combien: `les ${String(TEMPLATES.length)} templates`,
			pourquoi:
				'`templates` n’a pas la colonne : c’est un compteur d’EMPLOI, qui se calcule ' +
				'sur les notes créées depuis un template, et rien n’enregistre cette ' +
				'provenance. Le rendre à 0 serait faux, le rendre depuis le jeu serait la ' +
				'valeur illustrative que P-02 proscrit.',
			ceQuiLaFermerait:
				'une colonne de provenance sur `notes`, et un décompte — ou une colonne de compteur'
		},
		{
			forme: 'Compte',
			champ: 'id',
			combien: `les ${String(COMPTES.length)} comptes`,
			pourquoi:
				'`c-karim` et ses voisins ne sont écrits nulle part : `lignesDeCompte()` ne ' +
				'retient que `identifiant`. L’`id` de la table est un UUID tiré au hasard, ' +
				'donc différent à chaque semence.',
			ceQuiLaFermerait: 'rien à ajouter au schéma — la semence doit écrire l’identifiant du jeu'
		},
		{
			forme: 'Compte',
			champ: 'domaine',
			combien: `les ${String(COMPTES.length)} comptes`,
			pourquoi:
				'`comptes` n’a pas la colonne. C’est précisément le champ dont l’entrée ' +
				'« Signets » du rail aurait besoin pour pointer vers un domaine.',
			ceQuiLaFermerait: 'une colonne de rattachement sur `comptes`, ou une table de rattachement'
		},
		{
			forme: 'Compte',
			champ: 'derniere',
			combien: `les ${String(COMPTES.length)} comptes`,
			pourquoi:
				'« aujourd’hui à 08:41 » est un libellé RELATIF, donc un rendu et non une ' +
				'donnée. La donnée serait un instant de dernière connexion, et `comptes` ne ' +
				'l’a pas non plus — `sessions` le porterait, mais la semence n’ouvre aucune ' +
				'session.',
			ceQuiLaFermerait:
				'une colonne d’instant de dernière connexion, et une fabrique de libellé relatif'
		}
	];
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
	const champsDeCompteSansContrepartie = new Set(['id', 'domaine', 'derniere']);
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
			'les comptes (les 6 champs que la base porte)',
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
			'les templates (hors `utilisations`, en lacune)',
			TEMPLATES.map((t) => {
				const reduit: Record<string, unknown> = { ...t };
				delete reduit['utilisations'];
				return reduit;
			}),
			await lireTemplates(base),
			(t) => String(t['id']),
			(t) => String((t as unknown as Record<string, unknown>)['id'])
		)
	];

	/* ── LA NORMALISATION DES LACUNES CONNUES ────────────────────────────────
	   Les six lacunes sont comptées UNE FOIS, dans leur section. Les laisser
	   aussi rougir la comparaison des formes les compterait deux fois et, plus
	   grave, MASQUERAIT les vrais défauts de couche derrière elles : la
	   comparaison ne rend que la PREMIÈRE différence de chaque objet, et une
	   lacune sur `etiquettes` cachait déjà celle sur `pj`.

	   CE N'EST PAS UN AFFAIBLISSEMENT, et voici précisément pourquoi. On ne
	   retire rien de la mesure : on remplace la valeur de référence par ce que
	   la lacune permet AU MIEUX, et tout écart au-delà reste rouge. Pour
	   `etiquettes`, la référence est TRIÉE : l'ordre cesse d'être mesuré — il est
	   déjà en lacune —, mais l'ENSEMBLE des étiquettes l'est toujours, et une
	   étiquette manquante ou en trop rougit encore. Pour `pj`, les deux côtés
	   sont mis à 0 : le décompte cesse d'être mesuré, ce que la lacune dit déjà.
	   Le jour où une migration referme une lacune, son entrée disparaît et la
	   normalisation qu'elle justifiait disparaît avec elle. */
	const referenceDesNotes = CORPUS.map((n) => ({
		...n,
		pj: 0,
		etiquettes: [...n.etiquettes].sort((a, b) => a.localeCompare(b, 'fr'))
	}));

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

	const lesLacunes = lacunes();
	lignes.push(
		'',
		`  LES LACUNES — ${String(lesLacunes.length)} donnée(s) que la base NE PORTE PAS`,
		'  Aucune ligne de lecture.ts ne les referme : elles demandent une migration ou une',
		'  semence. Elles comptent dans le rouge — une lacune tolérée en silence est ce qui',
		'  ferait échouer un lot de câblage six semaines plus tard, sur un écran.'
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
