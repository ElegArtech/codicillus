/**
 * LE JEU DE VOLUMÉTRIE HAUTE — engendré, jamais recopié.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS `seeds/corpus.ts`
 *
 * `seeds/corpus.ts` est l'extraction fidèle des 41 maquettes gelées : 32 notes,
 * 4 domaines, 19 dossiers. C'est la référence du banc de comparaison et de la
 * batterie d'équivalence, et il ne bouge pas. Or les sept budgets de
 * performance se mesurent, dit le plan de réalisation §5, « sur volumétrie
 * haute synthétique » : mesurer sur 32 notes et titrer « budget tenu » serait
 * exactement la valeur illustrative que `P-02` proscrit.
 *
 * Ce module ENGENDRE le second jeu. Il ne le stocke pas : à volumes et graine
 * identiques, il rend deux fois la même chose, octet pour octet. Un jeu de
 * 8 500 notes rangé dans le dépôt serait invérifiable et périmé au premier
 * changement de schéma ; un jeu engendré se relit en trente lignes.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES VOLUMES VIENNENT DE LA SOURCE, PAS DE L'AGENT
 *
 * `CAHIER-DES-CHARGES-FONCTIONNEL.md:1539-1544`, « Volumétrie de
 * dimensionnement », recopié sans arrondi :
 *
 *   • 50 à 200 utilisateurs authentifiés, 10 à 30 simultanés
 *   • 500 notes à la mise en service, croissance visée vers plusieurs milliers
 *   • 10 à 30 domaines, 2 à 6 univers
 *   • arborescences jusqu'à 10 niveaux, plusieurs centaines de dossiers
 *   • graphes de 500 à 2 000 nœuds
 *
 * `VOLUMETRIE_HAUTE` prend le HAUT de chaque fourchette, et « plusieurs
 * milliers » est lu 5 000 — le seul nombre de ce module qui soit une
 * interprétation, et il est déclaré comme telle au rapport de lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES PALIERS DE GRAPHE — R-01, ET LE SEUIL DE RG-M09-04
 *
 * `STACK-TECHNIQUE.md:284` : « le seuil de bascule vers l'exploration
 * progressive exigé par RG-M09-04 est un PARAMÈTRE, réglé après mesure ».
 * Un seuil ne se mesure pas sur un point : il se mesure sur une COURBE. Les
 * paliers sont donc des tailles de graphe CUMULÉES dans un seul univers —
 * `Existant.universDuGraphe`, celui du corpus gelé où le jeu concentre ses
 * relations —, chargées l'une après l'autre, et la mesure rend la taille à
 * laquelle le budget de 3 s est franchi.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE JEU N'INVENTE PAS
 *
 * Il ne crée NI type de note, NI type de fiche, NI type de relation, NI
 * étiquette, NI template, NI paramètre : il se pose SUR une base déjà semée du
 * corpus gelé et réemploie ses référentiels. Un référentiel synthétique aurait
 * fait mesurer un produit qui n'est pas celui-là. Les prose des notes est
 * ouvertement fabriquée — mots techniques recombinés — et ne prétend à aucune
 * vraisemblance documentaire : elle ne sert qu'à donner au moteur de recherche
 * de quoi chercher, et à l'index de quoi peser.
 */

/* ═════════════════════════════════════════════════ Les volumes ══════════ */

/** Ce qui décide de la taille du jeu. Tout est ici, rien n'est en dur ailleurs. */
export interface Volumes {
	/** Comptes AU TOTAL, corpus gelé compris (CDC : 200). */
	readonly comptes: number;
	/** Univers AU TOTAL, corpus gelé compris (CDC : 6). */
	readonly univers: number;
	/** Domaines AU TOTAL, corpus gelé compris (CDC : 30). */
	readonly domaines: number;
	/** Dossiers engendrés, en plus des 19 du corpus gelé (CDC : plusieurs centaines). */
	readonly dossiers: number;
	/** Profondeur maximale d'une chaîne de dossiers (CDC et RG-STR-04 : 10). */
	readonly profondeurMax: number;
	/** Notes AU TOTAL au palier 0, corpus gelé compris (CDC : plusieurs milliers). */
	readonly notes: number;
	/** Relations engendrées entre notes du palier 0. */
	readonly relations: number;
	/** Étiquettes posées par note, prises dans celles du corpus gelé. */
	readonly etiquettesParNote: number;
	/**
	 * Les tailles de graphe visées, CUMULÉES, dans `Existant.universDuGraphe`.
	 * Le premier palier est celui du budget (500 nœuds) ; le troisième est celui
	 * de `R-01` (2 000) ; LES SUIVANTS SORTENT DE LA VOLUMÉTRIE ANNONCÉE, et
	 * c'est délibéré : un seuil ne se lit pas sur une courbe qui ne franchit
	 * rien. Ils ne servent qu'à situer le franchissement du budget, jamais à
	 * décrire un corpus attendu.
	 */
	readonly paliersDeGraphe: readonly number[];
}

/** Les volumes hauts du cahier des charges, pris au haut de chaque fourchette. */
export const VOLUMETRIE_HAUTE: Volumes = {
	comptes: 200,
	univers: 6,
	domaines: 30,
	dossiers: 400,
	profondeurMax: 10,
	notes: 5000,
	relations: 3000,
	etiquettesParNote: 2,
	paliersDeGraphe: [500, 1000, 2000, 4000, 8000, 16_000]
};

/** La graine du tirage. Fixée : un jeu qui change à chaque exécution n'est pas
 *  une condition de mesure, c'est une variable de plus. */
export const GRAINE = 20_550_820;

/** Le préfixe de TOUT ce que ce module écrit en base — et donc de tout ce que
 *  `lignesDeRetrait()` reprend. Aucune ligne du corpus gelé ne le porte. */
export const PREFIXE = 'vol-';

/* ═══════════════════════════════════════════════════ Le tirage ══════════ */

/**
 * Un générateur pseudo-aléatoire à état de 32 bits, reproductible et sans
 * dépendance. `Math.random()` est interdit ici : il rendrait le jeu
 * irreproductible, donc la mesure incomparable d'une exécution à l'autre.
 */
export function tirage(graine: number): () => number {
	let etat = graine >>> 0;
	return () => {
		etat = (etat + 0x6d2b79f5) >>> 0;
		let t = etat;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	};
}

/* ══════════════════════════════════════════════ Les mots du jeu ═════════ */

/** Le vocabulaire recombiné. Ouvertement fabriqué : voir l'en-tête. */
const SUJETS = [
	'bascule',
	'sauvegarde',
	'supervision',
	'passerelle',
	'annuaire',
	'ordonnanceur',
	'répartiteur',
	'entrepôt',
	'collecteur',
	'certificat',
	'grappe',
	'réplique'
] as const;

const QUALIFIANTS = [
	'de production',
	'de secours',
	'de recette',
	'de qualification',
	'du site principal',
	'du site distant'
] as const;

const ACTIONS = [
	'Procédure de',
	'Consignes de',
	'Exploitation de',
	'Raccordement de',
	'Supervision de',
	'Recette de'
] as const;

/* ════════════════════════════════════════════ Ce qui est engendré ═══════ */

/** Un compte engendré. Sans condensat : un compte du jeu ne s'authentifie pas. */
export interface CompteEngendre {
	readonly identifiant: string;
	readonly nom: string;
	readonly courriel: string;
	readonly role: 'referent' | 'contributeur' | 'lecteur';
	readonly indiceDomaine: number;
}

/** Un univers engendré. */
export interface UniversEngendre {
	readonly identifiant: string;
	readonly nom: string;
}

/** Un domaine engendré, rattaché à un univers par son nom. */
export interface DomaineEngendre {
	readonly identifiant: string;
	readonly nom: string;
	readonly universNom: string;
	readonly couleur: string;
}

/** Un dossier engendré, désigné par sa clé et celle de son parent. */
export interface DossierEngendre {
	readonly cle: string;
	readonly domaineNom: string;
	/** `null` : le dossier pend d'une racine existante, pas d'un dossier engendré. */
	readonly parentCle: string | null;
	readonly nom: string;
	readonly profondeur: number;
	readonly position: number;
}

/** Une note engendrée. `palier` décide de la tranche de chargement. */
export interface NoteEngendree {
	readonly identifiant: string;
	readonly titre: string;
	readonly extrait: string;
	readonly dossierCle: string;
	readonly indiceAuteur: number;
	readonly indiceType: number;
	readonly visibilite: 'interne' | 'publique';
	readonly statut: 'brouillon' | 'publiee';
	/** Ancienneté en jours de la dernière vérification ; `null` : jamais vérifiée. */
	readonly verifieeIlYA: number | null;
	readonly modifieeIlYA: number;
	readonly indicesEtiquettes: readonly number[];
	readonly palier: number;
}

/** Une relation engendrée entre deux notes engendrées. */
export interface RelationEngendree {
	readonly sourceIdentifiant: string;
	readonly cibleIdentifiant: string;
	readonly indiceType: number;
	readonly origine: 'declaree' | 'deduite';
}

/** Le jeu complet. */
export interface JeuDeVolumetrie {
	readonly volumes: Volumes;
	readonly comptes: readonly CompteEngendre[];
	readonly univers: readonly UniversEngendre[];
	readonly domaines: readonly DomaineEngendre[];
	readonly dossiers: readonly DossierEngendre[];
	readonly notes: readonly NoteEngendree[];
	readonly relations: readonly RelationEngendree[];
}

/** Ce que le jeu suppose déjà présent en base — mesuré, jamais deviné. */
export interface Existant {
	/** Les noms des univers du corpus gelé, dans l'ordre de la base. */
	readonly universExistants: readonly string[];
	/** Les noms des domaines du corpus gelé, par univers. */
	readonly domainesExistants: ReadonlyMap<string, readonly string[]>;
	/** L'univers où le jeu concentre ses relations — celui dont les notes font le graphe. */
	readonly universDuGraphe: string;
	/** Le nombre de notes que le corpus gelé pose déjà dans cet univers. */
	readonly notesDejaDansLeGraphe: number;
	/** Le nombre de notes du corpus gelé, tous univers confondus. */
	readonly notesExistantes: number;
	/** Le nombre de comptes du corpus gelé. */
	readonly comptesExistants: number;
}

const numero = (n: number, largeur: number): string => String(n).padStart(largeur, '0');

/**
 * Engendre le jeu. Fonction PURE : mêmes volumes, même graine, même existant →
 * même jeu. C'est ce que `seeds/volumetrie.test.ts` éprouve, et c'est la seule
 * propriété qui rende une mesure comparable à la suivante.
 */
export function engendrer(
	volumes: Volumes = VOLUMETRIE_HAUTE,
	existant: Existant,
	graine: number = GRAINE
): JeuDeVolumetrie {
	const dé = tirage(graine);
	const entre = (min: number, max: number): number => min + Math.floor(dé() * (max - min + 1));
	const parmi = <T>(liste: readonly T[]): T => {
		const choisi = liste[Math.floor(dé() * liste.length)];
		if (choisi === undefined) throw new Error('tirage dans une liste vide');
		return choisi;
	};

	/* ── Les univers ────────────────────────────────────────────────────────
	   Ceux du corpus gelé comptent : le cahier annonce 2 à 6 univers AU TOTAL,
	   pas 6 de plus. */
	const universNouveaux: UniversEngendre[] = [];
	for (let i = existant.universExistants.length; i < volumes.univers; i++) {
		const rang = i + 1;
		universNouveaux.push({
			identifiant: `${PREFIXE}u-${numero(rang, 2)}`,
			nom: `Volumétrie ${numero(rang, 2)}`
		});
	}

	/* ── Les domaines ───────────────────────────────────────────────────────
	   Répartis à tour de rôle sur TOUS les univers, gelés compris : le graphe de
	   V-19 doit grossir, donc l'univers du périmètre doit recevoir des domaines
	   nouveaux lui aussi. */
	const tousUnivers = [...existant.universExistants, ...universNouveaux.map((u) => u.nom)];
	const dejaDomaines = [...existant.domainesExistants.values()].reduce((n, d) => n + d.length, 0);
	const domaines: DomaineEngendre[] = [];
	for (let i = dejaDomaines; i < volumes.domaines; i++) {
		const rang = i + 1;
		const universNom = tousUnivers[(i - dejaDomaines) % tousUnivers.length];
		if (universNom === undefined) throw new Error('aucun univers où ranger un domaine');
		domaines.push({
			identifiant: `${PREFIXE}d-${numero(rang, 2)}`,
			nom: `Domaine de volumétrie ${numero(rang, 2)}`,
			universNom,
			couleur: '#3e5266'
		});
	}

	/* ── Les dossiers ───────────────────────────────────────────────────────
	   Des CHAÎNES, pas une nappe : le cahier annonce « arborescences jusqu'à 10
	   niveaux ». Un dossier engendré au premier niveau pend de la racine du
	   domaine, qui existe déjà (corpus gelé) ou sera créée au chargement. */
	const domainesEngendresParUnivers = new Map<string, string[]>();
	for (const d of domaines) {
		const liste = domainesEngendresParUnivers.get(d.universNom) ?? [];
		liste.push(d.nom);
		domainesEngendresParUnivers.set(d.universNom, liste);
	}
	const tousDomaines: { nom: string; universNom: string }[] = [];
	for (const [universNom, noms] of existant.domainesExistants) {
		for (const nom of noms) tousDomaines.push({ nom, universNom });
	}
	for (const d of domaines) tousDomaines.push({ nom: d.nom, universNom: d.universNom });

	const dossiers: DossierEngendre[] = [];
	let posé = 0;
	let chaine = 0;
	while (posé < volumes.dossiers) {
		const domaine = tousDomaines[chaine % tousDomaines.length];
		if (domaine === undefined) throw new Error('aucun domaine où ranger un dossier');
		/* La profondeur d'un dossier engendré est `p + 1` — le niveau 1 est la
		   racine du domaine, qui n'est jamais engendrée. La chaîne s'arrête donc
		   à `profondeurMax - 1` maillons, sinon le CHECK `dossiers_profondeur_
		   plafonnee` refuse la ligne. */
		const longueur = entre(2, volumes.profondeurMax - 1);
		let parentCle: string | null = null;
		for (let p = 1; p <= longueur && posé < volumes.dossiers; p++) {
			const cle = `${PREFIXE}f-${numero(posé + 1, 4)}`;
			dossiers.push({
				cle,
				domaineNom: domaine.nom,
				parentCle,
				nom: `${PREFIXE}dossier ${numero(posé + 1, 4)} niveau ${p}`,
				/* Le niveau 1 est la RACINE du domaine, et elle est unique par
				   domaine (contrainte `dossiers_racine_unique_par_domaine`). Un
				   dossier engendré commence donc au niveau 2, sous la racine. */
				profondeur: p + 1,
				position: p
			});
			parentCle = cle;
			posé += 1;
		}
		chaine += 1;
	}

	/* ── Les comptes ────────────────────────────────────────────────────────
	   Aucun condensat de mot de passe : un compte engendré ne se connecte pas.
	   La mesure ouvre sa session en base, comme la batterie 6. */
	const comptes: CompteEngendre[] = [];
	for (let i = existant.comptesExistants; i < volumes.comptes; i++) {
		const rang = i + 1;
		comptes.push({
			identifiant: `${PREFIXE}c-${numero(rang, 3)}`,
			nom: `Compte de volumétrie ${numero(rang, 3)}`,
			courriel: `${PREFIXE}c-${numero(rang, 3)}@exemple.invalid`,
			role: rang % 17 === 0 ? 'referent' : rang % 3 === 0 ? 'contributeur' : 'lecteur',
			indiceDomaine: rang % Math.max(1, domaines.length)
		});
	}

	/* ── Les notes ──────────────────────────────────────────────────────────
	   Deux tranches : le palier 0 porte la volumétrie annoncée ; les paliers
	   suivants ne font grossir QUE l'univers du graphe. */
	const dossiersDuGraphe = dossiers.filter((f) => {
		const d = tousDomaines.find((t) => t.nom === f.domaineNom);
		return d !== undefined && d.universNom === existant.universDuGraphe;
	});
	const dossiersHorsGraphe = dossiers.filter((f) => !dossiersDuGraphe.includes(f));
	if (dossiersDuGraphe.length === 0) throw new Error('aucun dossier dans l’univers du graphe');
	if (dossiersHorsGraphe.length === 0) throw new Error('aucun dossier hors de l’univers du graphe');

	const premierPalier = volumes.paliersDeGraphe[0];
	if (premierPalier === undefined) throw new Error('aucun palier de graphe');
	const notesDuGrapheAuPalier0 = Math.max(0, premierPalier - existant.notesDejaDansLeGraphe);

	const notes: NoteEngendree[] = [];
	let rangDeNote = 0;
	const engendrerUneNote = (dossier: DossierEngendre, palier: number): NoteEngendree => {
		rangDeNote += 1;
		const sujet = parmi(SUJETS);
		const qualifiant = parmi(QUALIFIANTS);
		const action = parmi(ACTIONS);
		const verifiee = dé();
		const etiq: number[] = [];
		for (let e = 0; e < volumes.etiquettesParNote; e++) etiq.push(entre(0, 41));
		return {
			identifiant: `${PREFIXE}n-${numero(rangDeNote, 5)}`,
			titre: `${action} ${sujet} ${qualifiant} ${numero(rangDeNote, 5)}`,
			extrait:
				`${action} ${sujet} ${qualifiant}. Ce texte est engendré par seeds/volumetrie.ts ` +
				`pour donner au moteur de quoi chercher : il ne décrit aucun système réel. ` +
				`Repère de recherche ${numero(rangDeNote, 5)}.`,
			dossierCle: dossier.cle,
			indiceAuteur: rangDeNote % Math.max(1, comptes.length),
			indiceType: rangDeNote % 5,
			visibilite: rangDeNote % 7 === 0 ? 'publique' : 'interne',
			statut: rangDeNote % 11 === 0 ? 'brouillon' : 'publiee',
			verifieeIlYA: verifiee < 0.15 ? null : entre(1, 900),
			modifieeIlYA: entre(0, 900),
			indicesEtiquettes: [...new Set(etiq)],
			palier
		};
	};

	for (let i = 0; i < notesDuGrapheAuPalier0; i++) {
		const dossier = dossiersDuGraphe[i % dossiersDuGraphe.length];
		if (dossier === undefined) throw new Error('dossier du graphe introuvable');
		notes.push(engendrerUneNote(dossier, 0));
	}
	const restantes = volumes.notes - existant.notesExistantes - notesDuGrapheAuPalier0;
	for (let i = 0; i < restantes; i++) {
		const dossier = dossiersHorsGraphe[i % dossiersHorsGraphe.length];
		if (dossier === undefined) throw new Error('dossier hors graphe introuvable');
		notes.push(engendrerUneNote(dossier, 0));
	}

	let atteint = premierPalier;
	for (let p = 1; p < volumes.paliersDeGraphe.length; p++) {
		const vise = volumes.paliersDeGraphe[p];
		if (vise === undefined) continue;
		for (let i = 0; i < vise - atteint; i++) {
			const dossier = dossiersDuGraphe[i % dossiersDuGraphe.length];
			if (dossier === undefined) throw new Error('dossier du graphe introuvable');
			notes.push(engendrerUneNote(dossier, p));
		}
		atteint = vise;
	}

	/* ── Les relations ──────────────────────────────────────────────────────
	   Entre notes du palier 0, et jamais réflexives (`relations_pas_reflexives`).
	   Le couple (source, cible, type) est unique : les doublons sont écartés. */
	const duPalier0 = notes.filter((n) => n.palier === 0);
	const relations: RelationEngendree[] = [];
	const vues = new Set<string>();
	let essais = 0;
	while (relations.length < volumes.relations && essais < volumes.relations * 20) {
		essais += 1;
		const source = duPalier0[Math.floor(dé() * duPalier0.length)];
		const cible = duPalier0[Math.floor(dé() * duPalier0.length)];
		const indiceType = entre(0, 5);
		if (source === undefined || cible === undefined) continue;
		if (source.identifiant === cible.identifiant) continue;
		const cle = `${source.identifiant} ${cible.identifiant} ${indiceType}`;
		if (vues.has(cle)) continue;
		vues.add(cle);
		relations.push({
			sourceIdentifiant: source.identifiant,
			cibleIdentifiant: cible.identifiant,
			indiceType,
			origine: relations.length % 4 === 0 ? 'deduite' : 'declaree'
		});
	}

	return { volumes, comptes, univers: universNouveaux, domaines, dossiers, notes, relations };
}

/**
 * Le corps Référence d'une note engendrée — la forme minimale qu'`ADR-003`
 * accepte, et celle que le corpus gelé porte : un `doc` d'un `paragraph` d'un
 * `text`. L'extrait de l'index en est DÉRIVÉ (`extraitDuCorps`), ce qui rend le
 * texte cherchable sans qu'aucune donnée ne soit écrite deux fois.
 */
export function corpsDeNote(texte: string): {
	type: 'doc';
	content: { type: 'paragraph'; content: { type: 'text'; text: string }[] }[];
} {
	return {
		type: 'doc',
		content: [{ type: 'paragraph', content: [{ type: 'text', text: texte }] }]
	};
}

/**
 * Les instructions de RETRAIT, dans l'ordre des dépendances.
 *
 * Le jeu se retire par son PRÉFIXE, jamais par une liste d'identifiants tenue à
 * jour à la main : une liste se désynchronise, un préfixe non. Les relations et
 * les étiquettes de note partent en cascade avec leurs notes.
 */
export function lignesDeRetrait(prefixe: string = PREFIXE): readonly string[] {
	const p = `${prefixe}%`;
	return [
		`delete from notes where identifiant like '${p}'`,
		`delete from dossiers where nom like '${p}'`,
		`delete from comptes where identifiant like '${p}'`,
		`delete from domaines where identifiant like '${p}'`,
		`delete from univers where identifiant like '${p}'`
	];
}
