/**
 * `pnpm test:degradation` — LA PART PURE DE LA BATTERIE 14.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE À CÔTÉ DE `degradation.mjs`
 *
 * Même partage que `etancheite-attendu.mjs` : le RUNNER construit une image,
 * lance un conteneur, sert le produit et interroge la base — rien de tout cela
 * ne s'importe depuis un test unitaire. Ce qui se juge sans conteneur vit donc
 * ici, et `verif/degradation.test.ts` l'éprouve sur des cas SYNTHÉTIQUES,
 * indépendants de l'état du dépôt.
 *
 * `P-26` est la raison, mot pour mot : « un contrôle dont le seul cas d'épreuve
 * est le défaut qu'il trouve devient inerte en réussissant ». La propriété de
 * composition d'`ADR-009` est aujourd'hui TENUE ; sans cas synthétique, le
 * contrôle qui l'établit ne serait jamais exercé côté rouge.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. LA COMPOSITION, LUE — jamais crue

   `ADR-009` : « les briques optionnelles ne sont JAMAIS dans le chemin
   critique ». `compose.yaml` le dit de lui-même : « c'est une propriété de
   cette composition, pas une intention ». Une propriété se lit dans le
   fichier ; une intention se croit sur parole. Ce module lit.

   L'analyse est un SOUS-ENSEMBLE de YAML, délibérément : la composition est
   écrite en indentation de deux espaces, sans ancre, sans document multiple,
   sans bloc replié. Un analyseur général serait une dépendance de plus (`P-24`
   interdit d'en installer), et un analyseur qui accepterait plus que ce que la
   source emploie accepterait aussi des formes que personne ne relit.
   ═════════════════════════════════════════════════════════════════════════ */

/** L'indentation d'une ligne, en espaces. Un tabulateur invalide l'analyse. */
function indentation(ligne) {
	const m = /^( *)\S/.exec(ligne);
	return m === null ? -1 : m[1].length;
}

/**
 * Les services de la composition, chacun avec ce qui décide du chemin critique.
 *
 * @param {string} texte le contenu de `compose.yaml`
 * @returns {{services: Map<string, {optionnel: boolean, dependsOn: string[],
 *   sante: string, environnement: Map<string,string>, ligne: number}>,
 *   refus: string[]}}
 */
export function analyserLaComposition(texte) {
	/** @type {string[]} */
	const refus = [];
	if (texte.includes('\t')) {
		refus.push('compose.yaml contient un tabulateur : l’analyse par indentation ne s’applique pas');
	}
	const lignes = texte.split('\n');

	const debutServices = lignes.findIndex((l) => /^services:\s*$/.test(l));
	if (debutServices === -1) {
		refus.push('compose.yaml ne porte aucun bloc « services: » à la colonne zéro');
		return { services: new Map(), refus };
	}

	/** @type {Map<string, {optionnel: boolean, dependsOn: string[], sante: string,
	 *   environnement: Map<string,string>, ligne: number}>} */
	const services = new Map();

	for (let i = debutServices + 1; i < lignes.length; i++) {
		const ligne = lignes[i];
		if (/^\S/.test(ligne)) break; /* la colonne zéro referme `services:` */
		const cle = /^ {2}([a-z][a-z0-9_-]*):\s*$/.exec(ligne);
		if (cle === null) continue;
		const nom = cle[1];

		/* Le bloc du service : tout ce qui suit, plus indenté que sa clé. */
		let fin = i + 1;
		while (fin < lignes.length) {
			const l = lignes[fin];
			if (l.trim() === '') {
				fin++;
				continue;
			}
			if (indentation(l) <= 2) break;
			fin++;
		}
		const bloc = lignes.slice(i + 1, fin);

		/* LE COMMENTAIRE QUI PRÉCÈDE LA CLÉ porte la qualification. La
		   composition écrit « OPTIONNEL. » en tête du bloc de chaque brique
		   optionnelle, et l'en-tête du fichier la répète en tableau. C'est la
		   source, et elle est dans le fichier — pas dans ce script. */
		let entete = '';
		for (let j = i - 1; j >= 0; j--) {
			if (!/^ *#/.test(lignes[j])) break;
			entete = lignes[j] + '\n' + entete;
		}

		services.set(nom, {
			optionnel: /^\s*#\s*OPTIONNEL\b/m.test(entete),
			dependsOn: dependancesDeDemarrage(bloc),
			sante: sousBloc(bloc, 'healthcheck').join('\n'),
			environnement: environnementDu(bloc),
			ligne: i + 1
		});
		i = fin - 1;
	}

	if (services.size === 0) refus.push('compose.yaml ne déclare aucun service analysable');
	return { services, refus };
}

/** Les lignes d'une clé de premier niveau du bloc d'un service. */
function sousBloc(bloc, cle) {
	const debut = bloc.findIndex((l) => new RegExp(`^ {4}${cle}:`).test(l));
	if (debut === -1) return [];
	const sorties = [];
	for (let i = debut + 1; i < bloc.length; i++) {
		if (bloc[i].trim() === '') continue;
		if (indentation(bloc[i]) <= 4) break;
		sorties.push(bloc[i]);
	}
	return sorties;
}

/**
 * LES DÉPENDANCES DE DÉMARRAGE, ET ELLES SEULES.
 *
 * Les deux formes de `depends_on` sont acceptées, parce que les deux ont le
 * même effet : la forme longue (`nom:` puis `condition:`) et la forme courte
 * (`- nom`). N'en lire qu'une laisserait passer l'autre.
 */
function dependancesDeDemarrage(bloc) {
	const sorties = [];
	for (const l of sousBloc(bloc, 'depends_on')) {
		const longue = /^ {6}([a-z][a-z0-9_-]*):\s*$/.exec(l);
		if (longue !== null) sorties.push(longue[1]);
		const courte = /^ {6}- *([a-z][a-z0-9_-]*)\s*$/.exec(l);
		if (courte !== null) sorties.push(courte[1]);
	}
	return sorties;
}

/** Les variables d'environnement du service, nom vers valeur brute. */
function environnementDu(bloc) {
	const sorties = new Map();
	for (const l of sousBloc(bloc, 'environment')) {
		const m = /^ {6}([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(l);
		if (m !== null) sorties.set(m[1], m[2].trim());
	}
	return sorties;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. CE QUE LA COMPOSITION DOIT DIRE — les cinq contrôles d'`ADR-009`
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Les briques qu'`ADR-009` désigne optionnelles, par leur rôle.
 *
 * Le NOM du service est lu dans `compose.yaml` ; ce qui est écrit ici est la
 * liste que l'ADR énumère — « le service local d'embeddings (Ollama, conteneur
 * optionnel) et le service Python de conversion » (`ADR-009`, Contexte). Les
 * deux sources sont RECOUPÉES : si la composition qualifiait d'optionnel un
 * service que l'ADR ne nomme pas, ou l'inverse, la batterie refuse de mesurer.
 */
export const OPTIONNELS_DE_L_ADR = ['conversion', 'embeddings'];

/** Les ports que les deux optionnels servent, tels que la composition les pose. */
export const PORTS_DES_OPTIONNELS = { conversion: '8000', embeddings: '11434' };

/**
 * Les défauts de la propriété structurelle. Liste vide : elle est tenue.
 *
 * @param {ReturnType<typeof analyserLaComposition>['services']} services
 * @returns {{quoi: string, detail: string}[]}
 */
export function defautsDeComposition(services) {
	/** @type {{quoi: string, detail: string}[]} */
	const defauts = [];
	const optionnels = [...services.entries()].filter(([, s]) => s.optionnel).map(([n]) => n);
	const critiques = [...services.entries()].filter(([, s]) => !s.optionnel).map(([n]) => n);

	for (const nom of OPTIONNELS_DE_L_ADR) {
		if (!services.has(nom)) {
			defauts.push({
				quoi: `le service « ${nom} » a disparu de la composition`,
				detail: 'ADR-009 le désigne optionnel : sa disparition change ce qui est mesuré'
			});
			continue;
		}
		if (!optionnels.includes(nom)) {
			defauts.push({
				quoi: `le service « ${nom} » n’est plus qualifié OPTIONNEL dans compose.yaml`,
				detail: 'ADR-009 le désigne optionnel ; la composition ne le dit plus'
			});
		}
	}

	for (const critique of critiques) {
		const s = services.get(critique);
		/* R1 — AUCUN SERVICE CRITIQUE NE LES ATTEND AU DÉMARRAGE. C'est la
		   phrase de `compose.yaml` : « app ne les déclare pas en depends_on ». */
		for (const attendu of s.dependsOn) {
			if (optionnels.includes(attendu) || OPTIONNELS_DE_L_ADR.includes(attendu)) {
				defauts.push({
					quoi: `« ${critique} » attend la brique optionnelle « ${attendu} » au démarrage`,
					detail:
						`depends_on de « ${critique} » cite « ${attendu} » : une brique optionnelle ` +
						'est dans le chemin de démarrage — ADR-009 l’interdit nommément'
				});
			}
		}
		/* R2 — AUCUN CONTRÔLE DE SANTÉ NE LES TRAVERSE. Un service critique
		   déclaré malsain parce qu'un optionnel est arrêté est un optionnel dans
		   le chemin critique, par un autre chemin que `depends_on`. */
		for (const optionnel of OPTIONNELS_DE_L_ADR) {
			const port = PORTS_DES_OPTIONNELS[optionnel];
			if (s.sante.includes(optionnel) || (port !== undefined && s.sante.includes(`:${port}`))) {
				defauts.push({
					quoi: `le contrôle de santé de « ${critique} » traverse « ${optionnel} »`,
					detail: `healthcheck de « ${critique} » : ${s.sante.trim().slice(0, 160)}`
				});
			}
		}
	}

	/* R3 — L'APPLICATION EN CONNAÎT L'ADRESSE, ET RIEN DE PLUS. « Une adresse,
	   jamais une dépendance » : sans l'adresse, la fonctionnalité ne serait pas
	   dégradée, elle serait absente — et le produit ne saurait pas la nommer. */
	const app = services.get('app');
	if (app === undefined) {
		defauts.push({
			quoi: 'la composition ne déclare aucun service « app »',
			detail: 'le service applicatif est le sujet de la mesure ; sans lui, rien n’est mesurable'
		});
	} else {
		for (const [variable, optionnel] of [
			['URL_CONVERSION', 'conversion'],
			['URL_EMBEDDINGS', 'embeddings']
		]) {
			const valeur = app.environnement.get(variable);
			if (valeur === undefined || !valeur.includes(optionnel)) {
				defauts.push({
					quoi: `« app » ne reçoit plus l’adresse de « ${optionnel} » (${variable})`,
					detail:
						'ADR-009 veut une adresse, jamais une dépendance : sans adresse, la ' +
						'fonctionnalité n’est pas dégradée, elle est muette'
				});
			}
		}
	}

	return defauts;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. LE VERDICT D'UN LOT D'IMPORT — les deux moitiés, comptées

   `T-052` a mesuré la dégradation des deux côtés sur un lot de dix fichiers :
   service démarré, 6 notes / 4 échecs motivés ; service arrêté, 2 notes / 8
   échecs `service-de-conversion-injoignable`, « et le fichier d'APRÈS les
   erreurs passe quand même ». Ce module transforme cette mesure en verdict.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Ce qu'un plan d'import dit de la dégradation.
 *
 * `continueApresLErreur` est la forme mesurable de `RG-M12-04` et de la
 * contrainte `C-07` : « un échec unitaire n'interrompt jamais un lot ». Elle
 * n'est vraie que si une ligne RETENUE porte un rang postérieur au PREMIER
 * échec — un lot qui s'arrêterait au premier échec rendrait le même compte de
 * notes si les fichiers valides étaient tous en tête.
 *
 * @param {{lignes: readonly {chemin: string, sort: string, motif: string|null,
 *   voie: string}[], notes: number, ignores: number, echecs: number}} plan
 */
export function verdictDuLot(plan) {
	const rangs = plan.lignes.map((l, rang) => ({ ...l, rang }));
	const premierEchec = rangs.find((l) => l.sort === 'echec');
	const derniereRetenue = [...rangs].reverse().find((l) => l.sort === 'note');
	/** @type {Map<string, number>} */
	const motifs = new Map();
	for (const l of rangs) {
		if (l.sort !== 'echec') continue;
		motifs.set(l.motif ?? '(sans motif)', (motifs.get(l.motif ?? '(sans motif)') ?? 0) + 1);
	}
	return {
		total: plan.lignes.length,
		notes: plan.notes,
		ignores: plan.ignores,
		echecs: plan.echecs,
		motifs,
		/** Les fichiers que l'application traite seule ne sortent jamais d'elle. */
		notesDeLApplication: rangs.filter((l) => l.sort === 'note' && l.voie === 'application').length,
		sansMotif: rangs.filter((l) => l.sort === 'echec' && l.motif === null).map((l) => l.chemin),
		continueApresLErreur:
			premierEchec !== undefined &&
			derniereRetenue !== undefined &&
			derniereRetenue.rang > premierEchec.rang,
		premierEchec: premierEchec?.chemin ?? null,
		derniereRetenue: derniereRetenue?.chemin ?? null
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. LE SIGNALEMENT — ce qui ATTEINT L'ÉCRAN, et rien d'autre

   `P-10` a deux moitiés, et c'est la seconde qu'on oublie : « une brique
   optionnelle indisponible dégrade la fonctionnalité concernée AVEC UN MESSAGE
   CLAIR ». Un état calculé côté serveur qu'aucun nœud ne rend n'est pas un
   message : c'est un silence bien informé.

   La mesure porte donc sur le DOCUMENT SERVI, jamais sur une valeur de
   chargeur. Deux marques sont exigées ensemble : l'attribut d'état, qui dit que
   la vue a reçu le constat, et la PHRASE, qui dit que l'utilisateur le lit.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Le signalement du mode « Sens » indisponible, tel que le gel de V-08 l'écrit.
 *
 * Les deux marques viennent de la maquette et non de ce script : `data-degrade`
 * est l'un des cinq attributs de données de V-08 (relevé du lot de vue), et la
 * phrase est celle du gel, recopiée. Un implémenteur qui changerait l'une des
 * deux ferait rougir la batterie — c'est la propriété recherchée.
 */
export const MARQUES_DU_SENS = {
	attribut: 'data-degrade="oui"',
	phrase: 'Recherche par sens momentanément indisponible'
};

/**
 * Ce que le document rendu porte du signalement d'une brique.
 *
 * @param {string} html le document servi, tel quel
 * @param {{attribut: string, phrase: string}} marques
 */
export function signalementDansLeDocument(html, marques) {
	const attribut = html.includes(marques.attribut);
	/* La phrase est cherchée sur le texte NORMALISÉ : le rendu peut replier une
	   ligne entre deux mots, et un signalement replié reste un signalement. */
	const texte = html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&#39;|&apos;/g, '’')
		.replace(/\s+/g, ' ');
	return {
		attribut,
		phrase: texte.includes(marques.phrase),
		atteintLEcran: attribut && texte.includes(marques.phrase)
	};
}

/**
 * LES FORMES D'UNE TRACE TECHNIQUE, cherchées par leur forme et non par un mot.
 *
 * Le premier jet cherchait la chaîne « at » précédée d'espaces : elle se
 * rencontre dans n'importe quel document indenté, et le contrôle aurait été
 * faux-positif sur du HTML ordinaire. Une trame de pile a une FORME — un nom
 * qualifié suivi d'une parenthèse —, et c'est elle qui est cherchée.
 */
const TRACES = [
	{ nom: 'trame de pile', motif: /\n\s+at [\w$.[\]<>]+ \(/ },
	{ nom: 'nom de code Node', motif: /\bERR_[A-Z_]{3,}\b/ },
	{ nom: 'exception de plateforme', motif: /\b(TypeError|ReferenceError|SyntaxError): / },
	{ nom: 'refus de connexion', motif: /\bECONNREFUSED\b/ },
	{ nom: 'échec de récupération', motif: /\bfetch failed\b/ }
];

/**
 * UNE PANNE, ET NON UNE DÉGRADATION — ce qu'une réponse ne doit jamais porter.
 *
 * `P-10` : « dégradation, jamais panne ». `ADR-009` nomme les trois formes
 * qu'il interdit : « jamais une erreur, jamais un écran vide, jamais un
 * chargement infini ». Les deux premières se mesurent sur la réponse ; la
 * troisième est hors de portée d'une requête unique et n'est PAS prétendue
 * mesurée ici.
 *
 * @param {{code: number, corps: string}} reponse
 */
export function pannesDeLaReponse(reponse) {
	/** @type {string[]} */
	const pannes = [];
	if (reponse.code >= 500) pannes.push(`code ${String(reponse.code)}`);
	if (reponse.code === 0) pannes.push('aucune réponse — la requête n’a pas abouti');
	for (const { nom, motif } of TRACES) {
		if (motif.test(reponse.corps)) pannes.push(`trace technique servie (${nom})`);
	}
	if (reponse.code === 200 && reponse.corps.trim() === '') pannes.push('corps vide sur un 200');
	return pannes;
}
