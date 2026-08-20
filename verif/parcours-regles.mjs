/**
 * LES RÈGLES DE LA BATTERIE 12 — les six parcours, leurs étapes, leurs
 * critères, et les quatre décisions qui font le verdict.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LES RÈGLES SONT SÉPARÉES DU PILOTE
 *
 * `verif/parcours.mjs` ouvre une base, construit le produit, le sert et le
 * conduit dans un navigateur : rien de tout cela ne s'éprouve dans un
 * unitaire. Ce qui décide du VERDICT — le classement d'une étape, le sens
 * qu'on donne à un budget, l'imputabilité d'une sonde, la comparaison des
 * empreintes d'état — est pur, et vit ici pour que `verif/parcours.test.ts`
 * puisse l'éprouver sur des cas SYNTHÉTIQUES (`P-26` : un contrôle dont le
 * seul cas d'épreuve est le défaut qu'il trouve devient inerte en
 * réussissant). Même partage que `verif/etancheite-attendu.mjs`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES PHRASES SONT RECOPIÉES, PAS RÉSUMÉES — ET LEUR LIGNE EST CITÉE
 *
 * `P-21` : « n'énonce jamais un fait sur une source sans citer la ligne que tu
 * as lue ». Chaque étape porte le numéro de ligne de
 * `cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md` d'où elle vient et le texte
 * EXACT qui s'y trouve. `verif/parcours.test.ts` rouvre le fichier et exige
 * l'égalité : une étape reformulée, une ligne qui glisse, et la batterie
 * refuse de mesurer. C'est ce qui interdit à cet instrument de juger le
 * produit sur une paraphrase.
 */

/** Le fichier d'où viennent toutes les phrases ci-dessous. */
export const SOURCE = 'cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md';

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES QUATRE ISSUES D'UNE ÉTAPE, ET POURQUOI IL EN FAUT QUATRE

   Deux issues — réussie, échouée — suffiraient à un test. Elles ne suffisent
   pas ici, et le contrat du lot le dit : « ce que tu ne peux pas jouer se
   compte […] un parcours qu'aucune route ne permet encore se déclare NON
   COUVERT, jamais simulé ».

   La distinction n'est pas cosmétique : elle décide de ce qu'un lot suivant a
   à faire. Un DÉFAUT se répare dans le code existant ; un NON-COUVERT attend
   qu'une route, une action ou un comportement soit écrit — et quand la cause
   est le GEL, il n'attend pas un lot, il attend un regel (`docs/dossier-regel.md`).

   Les deux comptent pour rouge. C'est la jurisprudence de la VACUITÉ de la
   batterie 6 : « le nombre de cases vacantes est un ÉCHEC, pas une réussite »,
   sans quoi la batterie serait verte sur ce qui n'existe pas (`RA-01`).
   ═════════════════════════════════════════════════════════════════════════ */

export const ISSUES = ['franchie', 'defaut', 'non-couvert', 'hors-produit'];

/**
 * Les causes admises d'un non-couvert. La liste est CLOSE : une cause hors
 * liste fait refuser de mesurer, pour que « non couvert » ne devienne pas le
 * tiroir où l'on range ce qu'on n'a pas su expliquer.
 */
export const CAUSES = {
	'route-absente': 'aucune route du produit ne porte cette étape',
	'action-absente': 'la route existe, aucune action d’écriture ne la sert',
	'action-refusee': 'l’action existe et refuse explicitement — 501, non implémentée',
	'comportement-non-cable': 'l’affordance est rendue, aucun comportement ne l’écoute (ARB-011)',
	gel: 'la maquette gelée elle-même ne rend pas cette étape — un regel, pas un lot',
	'droit-du-persona': 'le persona du parcours n’a pas le droit que l’étape suppose',
	'parametre-ignore':
		'la route sert, et n’honore pas le paramètre d’adresse que la source attache à l’étape'
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. LES SIX PARCOURS, RECOPIÉS

   `PLAN-DE-REALISATION.md:347` : « PU-01 à PU-06 joués de bout en bout, avec
   leurs critères de réussite chiffrés ».

   `critere` est `null` quand LE CAHIER N'EN DONNE PAS. Trois parcours sur six
   sont dans ce cas — PU-04, PU-05, PU-06 —, vérifié fichier ouvert : entre
   `:1501` et `:1503` il n'y a pas de ligne « Critère de réussite », là où
   `:1468`, `:1482` et `:1492` en portent une. Ce n'est pas une lacune de cet
   instrument, et il ne la comble pas : il la compte.
   ═════════════════════════════════════════════════════════════════════════ */

export const PARCOURS = [
	{
		id: 'PU-01',
		titre: 'L’intervenant sous pression (chemin nominal)',
		ligneTitre: 1456,
		persona: 'karim.belhadj',
		critere: {
			ligne: 1468,
			texte:
				"**Critère de réussite : moins de 60 secondes entre l'ouverture et le premier geste technique.**",
			genre: 'duree',
			budgetMs: 60_000,
			borne: 'du chargement de l’accueil jusqu’au bloc de commande copiable'
		},
		etapes: [
			{
				rang: 1,
				ligne: 1458,
				phrase: "Sur site, l'intervenant ouvre le produit dans son navigateur.",
				mesure: 'pu01-ouvrir'
			},
			{
				rang: 2,
				ligne: 1459,
				phrase:
					'Il déclenche la palette de recherche au clavier et tape trois mots, avec une faute.',
				mesure: 'pu01-palette'
			},
			{
				rang: 3,
				ligne: 1460,
				phrase:
					'Les résultats apparaissent au fil de la frappe ; le premier porte un badge vert « Vérifié il y a 12 jours ».',
				mesure: 'pu01-resultats'
			},
			{
				rang: 4,
				ligne: 1461,
				phrase: 'Il ouvre le résultat à la flèche puis Entrée.',
				mesure: 'pu01-ouvrir-resultat'
			},
			{
				rang: 5,
				ligne: 1462,
				phrase: "La note s'affiche : bandeau de confiance en haut, sommaire à gauche.",
				mesure: 'pu01-lecture'
			},
			{
				rang: 6,
				ligne: 1463,
				phrase: 'Un sélecteur lui propose la version *Opérationnelle* : il bascule dessus.',
				mesure: 'pu01-registre'
			},
			{
				rang: 7,
				ligne: 1464,
				phrase:
					'Il suit les phases numérotées, copie un bloc de commande en un clic, colle dans son terminal : le texte est propre.',
				mesure: 'pu01-copie'
			},
			{
				rang: 8,
				ligne: 1465,
				phrase: "En bas, un bloc d'alerte « Attention » lui évite une erreur.",
				mesure: 'pu01-alerte'
			},
			{
				rang: 9,
				ligne: 1466,
				phrase:
					"L'opération réussie, il clique **Marquer comme vérifié**. Le badge repasse au vert. Une seconde.",
				mesure: 'pu01-verifier'
			}
		]
	},
	{
		id: 'PU-02',
		titre: 'Le contributeur formalise',
		ligneTitre: 1470,
		persona: 'marc.ferreira',
		critere: {
			ligne: 1482,
			texte: '**Critère de réussite : moins de 5 minutes pour une procédure simple.**',
			genre: 'duree',
			budgetMs: 300_000,
			borne: 'de l’ouverture de la création jusqu’à l’enregistrement'
		},
		etapes: [
			{
				rang: 1,
				ligne: 1472,
				phrase: 'Après une intervention, le contributeur clique « Nouvelle note ».',
				mesure: 'pu02-nouvelle-note'
			},
			{
				rang: 2,
				ligne: 1473,
				phrase: 'Un sélecteur propose des templates ; il choisit « Procédure technique ».',
				mesure: 'pu02-template'
			},
			{
				rang: 3,
				ligne: 1474,
				phrase:
					'Le squelette apparaît : Objectif, Prérequis, Étapes, Vérification, En cas de problème.',
				mesure: 'pu02-squelette'
			},
			{
				rang: 4,
				ligne: 1475,
				phrase:
					"Il saisit le titre — le produit l'avertit qu'une note très proche existe déjà. Il vérifie, ce n'est pas la même, il continue.",
				mesure: 'pu02-doublon'
			},
			{
				rang: 5,
				ligne: 1476,
				phrase: 'Il rédige en Markdown ; les listes et titres se forment à la volée.',
				mesure: 'pu02-markdown'
			},
			{
				rang: 6,
				ligne: 1477,
				phrase: 'Il tape le caractère déclencheur, insère un bloc de code, choisit le langage.',
				mesure: 'pu02-bloc-de-code'
			},
			{
				rang: 7,
				ligne: 1478,
				phrase:
					"Il tape la séquence de lien interne, l'auto-complétion propose une note existante, il la lie.",
				mesure: 'pu02-lien-interne'
			},
			{
				rang: 8,
				ligne: 1479,
				phrase: 'Il ajoute deux étiquettes en auto-complétion, choisit son dossier.',
				mesure: 'pu02-etiquettes'
			},
			{
				rang: 9,
				ligne: 1480,
				phrase:
					'Il enregistre. Confirmation. La note est trouvable en recherche dans les secondes qui suivent.',
				mesure: 'pu02-enregistrer'
			}
		]
	},
	{
		id: 'PU-03',
		titre: 'Le lecteur externe',
		ligneTitre: 1484,
		persona: 'anonyme',
		critere: {
			ligne: 1492,
			texte: "**Critère de réussite : aucun contenu interne n'est atteignable, à aucun moment.**",
			genre: 'etancheite',
			borne: 'toute réponse reçue pendant le parcours, y compris par adresse construite'
		},
		etapes: [
			{
				rang: 1,
				ligne: 1486,
				phrase: "Sans compte, un collaborateur métier ouvre l'adresse du produit.",
				mesure: 'pu03-ouvrir'
			},
			{
				rang: 2,
				ligne: 1487,
				phrase: "L'accueil public l'accueille et propose une recherche.",
				mesure: 'pu03-champ'
			},
			{
				rang: 3,
				ligne: 1488,
				phrase:
					"Il cherche un nom d'application. Les résultats ne contiennent que du contenu public.",
				mesure: 'pu03-resultats-publics'
			},
			{
				rang: 4,
				ligne: 1489,
				phrase: "Il ouvre un guide utilisateur, le lit, voit qu'il a été vérifié récemment.",
				mesure: 'pu03-guide'
			},
			{
				rang: 5,
				ligne: 1490,
				phrase:
					"Il ne trouve pas la réponse à sa question suivante : l'appel à l'action « Ouvrir un ticket d'assistance » le redirige vers le portail.",
				mesure: 'pu03-assistance'
			}
		]
	},
	{
		id: 'PU-04',
		titre: 'Le référent pilote',
		ligneTitre: 1494,
		persona: 'karim.belhadj',
		critere: null,
		etapes: [
			{
				rang: 1,
				ligne: 1496,
				phrase: 'Le référent ouvre son accueil : quatre indicateurs, dont « 7 notes à réviser ».',
				mesure: 'pu04-indicateurs'
			},
			{
				rang: 2,
				ligne: 1497,
				phrase:
					'La corbeille de révisions lui montre les notes signalées avec le commentaire de chaque demandeur.',
				mesure: 'pu04-corbeille'
			},
			{
				rang: 3,
				ligne: 1498,
				phrase:
					'Il ouvre la première, lit le commentaire en bandeau, corrige, enregistre, vérifie. La demande disparaît.',
				mesure: 'pu04-corriger'
			},
			{
				rang: 4,
				ligne: 1499,
				phrase:
					'Il ouvre le tableau de bord de son domaine : la barre de fraîcheur montre 18 % de rouge.',
				mesure: 'pu04-bord-domaine'
			},
			{
				rang: 5,
				ligne: 1500,
				phrase:
					"Il filtre la liste sur « fraîcheur rouge », trie par consultations décroissantes, et traite les plus lues d'abord.",
				mesure: 'pu04-filtrer'
			},
			{
				rang: 6,
				ligne: 1501,
				phrase:
					"Il consulte les trous documentaires : trois requêtes récurrentes sans résultat. Il crée la note manquante d'un clic depuis la liste.",
				mesure: 'pu04-trous'
			}
		]
	},
	{
		id: 'PU-05',
		titre: 'La reprise du patrimoine',
		ligneTitre: 1503,
		persona: 'sophie.nguyen',
		critere: null,
		etapes: [
			{
				rang: 1,
				ligne: 1505,
				phrase: "L'administrateur ouvre la console, onglet Imports.",
				mesure: 'pu05-console'
			},
			{
				rang: 2,
				ligne: 1506,
				phrase: 'Il choisit « Importer un domaine complet », dépose une arborescence.',
				mesure: 'pu05-deposer'
			},
			{
				rang: 3,
				ligne: 1507,
				phrase:
					"L'aperçu affiche l'arborescence détectée, 240 fichiers, 3 formats, 6 fichiers ignorés avec la raison.",
				mesure: 'pu05-apercu'
			},
			{
				rang: 4,
				ligne: 1508,
				phrase: 'Il valide. La progression défile en temps réel.',
				mesure: 'pu05-progression'
			},
			{
				rang: 5,
				ligne: 1509,
				phrase:
					'Le rapport final : 231 notes créées, 3 en échec avec la raison, 6 ignorées, 18 dossiers créés, 1 domaine créé.',
				mesure: 'pu05-rapport'
			},
			{
				rang: 6,
				ligne: 1510,
				phrase: "Il ouvre le domaine créé : l'arborescence est là, les notes sont trouvables.",
				mesure: 'pu05-domaine-cree'
			}
		]
	},
	{
		id: 'PU-06',
		titre: 'L’analyse de dépendance',
		ligneTitre: 1512,
		persona: 'karim.belhadj',
		critere: null,
		etapes: [
			{
				rang: 1,
				ligne: 1514,
				phrase: 'Un incident survient sur un serveur.',
				mesure: 'pu06-incident'
			},
			{
				rang: 2,
				ligne: 1515,
				phrase: 'Le référent ouvre la cartographie, filtre sur le domaine Infrastructure.',
				mesure: 'pu06-cartographie'
			},
			{
				rang: 3,
				ligne: 1516,
				phrase:
					"Il cherche le serveur dans le graphe et clique dessus : le focus se pose, ses voisins ressortent, le reste s'estompe et **reste** estompé.",
				mesure: 'pu06-focus'
			},
			{
				rang: 4,
				ligne: 1517,
				phrase:
					'Le panneau de détail liste : « héberge → 4 applications », « dépend de → 2 équipements réseau ».',
				mesure: 'pu06-detail'
			},
			{
				rang: 5,
				ligne: 1518,
				phrase:
					"Un halo indique que ce serveur est un **point d'articulation** : sa perte isolerait une partie du système.",
				mesure: 'pu06-articulation'
			},
			{
				rang: 6,
				ligne: 1519,
				phrase:
					'Il ouvre chaque application impactée, dont les fiches portent les contacts et procédures de reprise.',
				mesure: 'pu06-impactees'
			}
		]
	}
];

/** Toutes les étapes à plat, dans l'ordre de parcours. */
export function toutesLesEtapes() {
	return PARCOURS.flatMap((p) => p.etapes.map((e) => ({ ...e, parcours: p.id })));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. LE BUDGET — UN INSTRUMENT NE PEUT QUE RÉFUTER

   Les deux critères chiffrés de durée mesurent une durée HUMAINE : « moins de
   60 secondes entre l'ouverture et le premier geste technique » compte le
   temps que met un intervenant à lire, décider et taper. Aucun instrument ne
   mesure cela, et le contrat du lot l'a prévu : « si un critère chiffré du
   cahier n'est pas mesurable, nomme-le et compte-le — n'invente pas de
   substitut ».

   Ce que la batterie mesure est la PART DU PRODUIT : le temps qu'il consomme
   entre les deux bornes, l'utilisateur agissant sans délai. C'est une borne
   INFÉRIEURE stricte de la durée du parcours, et une borne inférieure ne sert
   qu'à une chose — RÉFUTER :

     part du produit  >  budget   ⇒  le critère est INFIRMÉ, sans appel : la
                                     durée totale lui est supérieure.
     part du produit  ≤  budget   ⇒  RIEN N'EST CONCLU. Le critère n'est pas
                                     « tenu », il n'est pas infirmé.

   Ne jamais lire « non-infirmé » comme « vert ». C'est la même prudence que
   « ce qu'un vert ne dit jamais » (`CLAUDE.md` §4) : la batterie mesure ce
   qu'elle traverse, pas la satisfaction de l'exigence.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * @param {{budgetMs: number, partDuProduitMs: number, mesuree: boolean}} entree
 * @returns {{verdict: 'infirme'|'non-infirme'|'non-mesuree', marge: number}}
 */
export function verdictDeBudget(entree) {
	if (!entree.mesuree) return { verdict: 'non-mesuree', marge: Number.NaN };
	const marge = entree.budgetMs - entree.partDuProduitMs;
	/* L'égalité ne réfute pas : à part égale au budget, la durée totale peut
	   encore valoir le budget si l'humain n'a rien coûté. Le doute profite au
	   candidat, comme partout ailleurs dans ce dépôt. */
	return { verdict: entree.partDuProduitMs > entree.budgetMs ? 'infirme' : 'non-infirme', marge };
}

/**
 * LE CRITÈRE D'ÉTANCHÉITÉ DE PU-03 — celui-là se mesure entièrement.
 *
 * « Aucun contenu interne n'est atteignable, à aucun moment » : la batterie
 * relève, dans CHAQUE réponse reçue pendant le parcours anonyme, les marques
 * du corpus interne — identifiants de notes non publiques. Une seule
 * occurrence infirme le critère, et la pièce est l'identifiant trouvé.
 *
 * CE QU'IL NE PROUVE PAS : la matrice exhaustive routes × personas, qui est le
 * périmètre de la batterie 6. Ici, seul le chemin du parcours est parcouru.
 *
 * @param {{reponses: {chemin: string, corps: string}[], marquesInternes: string[]}} entree
 */
export function verdictDEtancheite(entree) {
	const fuites = [];
	for (const reponse of entree.reponses) {
		for (const marque of entree.marquesInternes) {
			if (reponse.corps.includes(marque)) fuites.push({ chemin: reponse.chemin, marque });
		}
	}
	return { verdict: fuites.length === 0 ? 'non-infirme' : 'infirme', fuites };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. `P-28` — CHAQUE PARCOURS RÉTABLIT SON ÉTAT, ET LE PROUVE

   « Une matrice dont les cases se contaminent mesure l'ordre, pas la
   propriété. » Un parcours ouvre des sessions, pose des droits, écrit des
   versions, importe des notes : sans rétablissement, le second parcours
   mesurerait ce que le premier a laissé, et trois exécutions ne rendraient
   jamais le même verdict.

   Le rétablissement ne se DÉCLARE pas, il se MESURE : une empreinte par table
   est prise avant les préconditions et après la restauration, et toute
   divergence est un défaut imputé au parcours qui l'a laissée. C'est la même
   exigence que « retour à l'identique après restauration, `git status`
   propre » de `docs/orchestration.md` §1.2 règle 4, portée sur la base.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * LA COMPARAISON SE FAIT LIGNE PAR LIGNE, ET ELLE DISTINGUE DEUX FAITS.
 *
 * `avant` et `apres` sont, par table, un dictionnaire clé → condensat de ligne.
 *
 *   DISPARUE   une clé de `avant` absente de `apres` — quelque chose a été
 *              détruit ;
 *   MODIFIÉE   une clé présente des deux côtés, condensat différent — quelque
 *              chose a été réécrit.
 *
 * Les lignes APPARUES ne sont volontairement pas comptées ici, et c'est la
 * leçon du premier passage : la base est PARTAGÉE entre les copies de travail
 * d'une vague, et sept écarts sur sept venaient d'un lot voisin. Une ligne
 * apparue n'est imputable qu'à qui l'a écrite ; ce que ce parcours a écrit se
 * mesure par attribution (compte du persona, fenêtre de temps), pas par
 * différence de comptes. Voir `residusDuParcours` dans le pilote.
 *
 * @param {Record<string, Record<string, string>>} avant
 * @param {Record<string, Record<string, string>>} apres
 */
export function comparerEmpreintes(avant, apres) {
	const tables = [...new Set([...Object.keys(avant), ...Object.keys(apres)])].sort();
	const ecarts = [];
	for (const table of tables) {
		const a = avant[table] ?? {};
		const b = apres[table] ?? {};
		for (const [cle, somme] of Object.entries(a)) {
			if (!Object.hasOwn(b, cle)) ecarts.push({ table, cle, genre: 'disparue' });
			else if (b[cle] !== somme) ecarts.push({ table, cle, genre: 'modifiee' });
		}
	}
	return ecarts;
}

/**
 * LE VERDICT D'ÉTAT — et il n'impute pas au parcours ce qu'un voisin a fait.
 *
 * Deux natures, deux traitements, et le second n'est pas une indulgence :
 *
 *   RÉSIDU        une ligne que CE parcours a écrite et qui survit à son
 *                 rétablissement. Attribuable, donc comptée comme défaut.
 *   ALTÉRATION    une ligne du corpus détruite ou réécrite que le parcours n'a
 *                 pas touchée. Elle peut venir d'une autre copie de travail
 *                 écrivant dans la base partagée : la batterie REFUSE DE
 *                 MESURER plutôt que d'imputer. Un chiffre faux est plus
 *                 coûteux qu'un refus.
 *
 * @param {{residus: {quoi: string, combien: number}[],
 *   alterations: {table: string, cle: string, genre: string}[],
 *   notesRemises: string[]}} bilan
 */
export function verdictDEtat(bilan) {
	const attribuables = bilan.residus.filter((r) => r.combien > 0);
	return {
		defauts: attribuables,
		refus:
			bilan.alterations.length === 0
				? []
				: [
						`${bilan.alterations.length} ligne(s) du corpus altérée(s) hors de ce parcours — ` +
							bilan.alterations
								.slice(0, 4)
								.map((a) => `${a.table}/${a.cle.slice(0, 8)} ${a.genre}`)
								.join(', ') +
							'. La base est partagée entre les copies de travail : la batterie refuse ' +
							'd’imputer ce qu’elle ne peut pas attribuer.'
					]
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LES SONDES — DEUX GENRES DE MUTATION, ET UN REFUS DE CONCLURE

   `docs/orchestration.md` §1.2 règle 4. Le modèle exécutable est
   `verif/aller-retour.mjs --sonde=temoin-inerte`, et le raffinement vient de
   la batterie 6 : quand une batterie porte DÉJÀ des défauts — et celle-ci en
   portera longtemps, le produit n'étant pas fini —, « rougit » est vrai quoi
   qu'une sonde fasse. Exiger le rouge ne prouverait donc rien.

   D'où l'IMPUTABILITÉ : une sonde d'observation ou d'état doit produire au
   moins un défaut SUR UNE ÉTAPE QU'ELLE A TOUCHÉE, et cette étape doit être
   FRANCHIE hors sonde — sinon la sonde se ferait créditer d'un défaut
   préexistant.
   ═════════════════════════════════════════════════════════════════════════ */

export const GENRES_DE_SONDE = {
	/* L'OBSERVATION : la réponse d'une étape est altérée dans le navigateur. */
	'etape-brisee': 'observation',
	/* L'ÉTAT : le droit du persona est retiré avant le parcours. La mutation
	   porte sur le candidat en base, pas sur la mesure. */
	'droit-retire': 'etat',
	/* LA CONFIGURATION : le produit répond réellement plus lentement — chaque
	   réponse est retenue au passage. C'est le seul cas d'épreuve SYNTHÉTIQUE
	   du budget de durée (`P-26`) : sans lui, la règle « part > budget ⇒
	   infirmé » ne serait exercée par aucun cas du dépôt. */
	'produit-ralenti': 'configuration',
	/* LA SONDE QUI NE TOUCHE RIEN, et elle est là pour être jouée. */
	'temoin-inerte': 'inerte'
};

/**
 * LA MORSURE SE LIT SUR DEUX PASSES, JAMAIS SUR UNE.
 *
 * Le premier jet de ce fichier exigeait « au moins un défaut sur une étape que
 * la sonde a touchée ». C'était insuffisant, et pour une raison qui est déjà
 * écrite dans la batterie 6 : cette batterie porte des défauts de fond, donc
 * une étape touchée peut être en défaut SANS la sonde. La sonde se serait fait
 * créditer du défaut d'autrui — `P-26` sous un autre angle.
 *
 * Une exécution sous sonde rejoue donc le parcours visé DEUX FOIS : une passe
 * de référence sans mutation, une passe mutée. La sonde a mordu s'il existe une
 * conséquence attendue qui était SAINE avant et FAUTIVE après. Rien d'autre ne
 * compte : ni le nombre total de défauts, ni la couleur de la batterie.
 *
 * @param {{quoi: string, avant: string, apres: string, attenduAvant: string,
 *   attenduApres: string}[]} consequences
 */
export function morsure(consequences) {
	const mordues = consequences.filter(
		(c) => c.avant === c.attenduAvant && c.apres === c.attenduApres
	);
	return { mordu: mordues.length > 0, mordues, examinees: consequences.length };
}

/**
 * @param {{genre: string, touches: number, mordu: boolean, detail: string}} entree
 * @returns {{code: 0|1|2, motif: string}} 0 : la batterie n'a rien vu ;
 *   1 : la batterie a dit non, et la conséquence est imputable à la mutation ;
 *   2 : refus de conclure — la mutation n'a rien touché.
 */
export function verdictDeSonde(entree) {
	if (entree.genre === 'inerte') {
		/* JAMAIS INVERSÉ, dans un sens comme dans l'autre. Une sonde inerte qui
		   aurait touché quelque chose n'est pas inerte : c'est la sonde qui est
		   fautive, et le refus de conclure vaut aussi pour ce cas. */
		return entree.touches === 0
			? { code: 2, motif: 'témoin inerte : rien n’a été touché, il n’y a rien à conclure' }
			: { code: 2, motif: `témoin inerte qui a touché ${entree.touches} fois — sonde fautive` };
	}
	if (entree.touches === 0) {
		return {
			code: 2,
			motif: 'la mutation n’a rien touché : elle ne teste rien (refus de conclure)'
		};
	}
	if (!entree.mordu) {
		return {
			code: 0,
			motif: `la sonde a touché ${entree.touches} fois et aucune conséquence ne lui est imputable — ${entree.detail}`
		};
	}
	return { code: 1, motif: `la batterie a dit non — ${entree.detail}` };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LE VERDICT GLOBAL
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * @param {{defauts: unknown[], nonCouverts: unknown[], criteresInfirmes: unknown[],
 *   ecartsDEtat: unknown[], refus: unknown[]}} bilan
 * @returns {0|1|2}
 */
export function codeDeRetour(bilan) {
	if (bilan.refus.length > 0) return 2;
	if (
		bilan.defauts.length > 0 ||
		bilan.nonCouverts.length > 0 ||
		bilan.criteresInfirmes.length > 0 ||
		bilan.ecartsDEtat.length > 0
	) {
		return 1;
	}
	return 0;
}

/**
 * LE BLOC DE VERDICT — la seule sortie que le déterminisme compare.
 *
 * `docs/orchestration.md` §1.2 règle 5 : « sois déterministe, et prouve-le sur
 * trois exécutions ». Un parcours mesure des DURÉES, qui ne se répètent
 * jamais à la milliseconde. Le bloc ci-dessous n'en porte aucune : il porte
 * des COMPTES et des VERDICTS, qui, eux, doivent être identiques d'une
 * exécution à l'autre. Les durées sont imprimées ailleurs, et ne sont pas
 * comparées — les comparer ferait échouer le déterminisme sur du bruit.
 */
export function blocDeVerdict(bilan) {
	const l = [];
	l.push('VERDICT');
	l.push(`  étapes franchies         ${bilan.franchies}`);
	l.push(`  étapes en défaut         ${bilan.defauts.length}`);
	l.push(`  étapes non couvertes     ${bilan.nonCouverts.length}`);
	l.push(`  étapes hors produit      ${bilan.horsProduit}`);
	l.push(`  critères infirmés        ${bilan.criteresInfirmes.length}`);
	l.push(`  critères sans chiffre    ${bilan.criteresAbsents}`);
	l.push(`  écarts d’état (P-28)     ${bilan.ecartsDEtat.length}`);
	l.push(`  refus de mesurer         ${bilan.refus.length}`);
	l.push(`  code                     ${codeDeRetour(bilan)}`);
	return l.join('\n');
}
