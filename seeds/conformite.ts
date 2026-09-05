/**
 * LE JEU DE CONFORMITÉ — les données du prototype validé, et rien d'autre.
 *
 * Les neuf captures de `design_handoff_refonte_codicillus/captures/` montrent un corpus précis :
 * six univers, soixante-dix-sept notes, une répartition d'états qui donne « 77 notes dans votre
 * bibliothèque, dont 65 sont actuellement à jour ». Sans ces données en base, un écran du produit
 * et sa capture ne sont pas comparables : on mesurerait des écarts de contenu en croyant mesurer
 * des écarts de dessin.
 *
 * CE N'EST PAS LA VÉRITÉ DU PRODUIT. C'est un jeu de démonstration de plus, au même titre que
 * `corpus.ts` et `demonstration.ts` — aucune de ses valeurs ne doit finir servie comme un fait de
 * l'instance. Le produit commence VIDE, et chaque écran se vérifie aussi à zéro donnée.
 *
 * Extrait de `design_handoff_refonte_codicillus/reference/logique-prototype.js` : `ARBRE`,
 * `REPARTITION`, `IC_UNIVERS`, `DESCRIPTIONS`, `DESC_DOMAINES`.
 */

/** Les cinq états, dans l'ordre des compteurs. */
export type EtatSeme = 'ajour' | 'bientot' | 'averifier' | 'arevoir' | 'obsolete';

/**
 * L'ancienneté de vérification qui pose un état, pour une validité de 90 jours. Le calcul est
 * celui de `vivacite()` : reste = vérifiée + validité − aujourd'hui.
 */
export const ANCIENNETE_PAR_ETAT: Readonly<Record<EtatSeme, number>> = {
	ajour: 23, // reste 67
	bientot: 84, // reste 6
	averifier: 94, // reste −4
	arevoir: 111, // reste −21
	obsolete: 200 // reste −110
};

export interface NoteSemee {
	readonly titre: string;
	/** Le chemin de dossier sous le domaine, vide à la racine. */
	readonly dossier?: string;
	readonly etat: EtatSeme;
	/**
	 * L'ANCIENNETÉ DE VÉRIFICATION, EN JOURS, quand elle doit s'écarter de celle de son état.
	 *
	 * Sans elle, TOUTES les notes d'un même état sont vérifiées le même jour, et le fil
	 * d'activité — sept derniers jours — sort vide sur les six univers. La capture d'un univers
	 * en montre cinq traces. Une note à jour vérifiée il y a deux heures reste à jour : l'état
	 * ne bouge pas, seule la date du geste change.
	 */
	readonly ancienneteJours?: number;
	/** La note est écrite en toutes lettres dans `seeds/conformite/` — son corps en vient. */
	readonly fichier?: string;
}

export interface DomaineSeme {
	readonly nom: string;
	readonly description: string;
	/** Le nombre total de notes du domaine — les notes nommées, puis du remplissage. */
	readonly notes: number;
	/** La répartition des états, dans l'ordre ajour / bientot / averifier / arevoir / obsolete. */
	readonly repartition: readonly [number, number, number, number, number];
	readonly nommees: readonly NoteSemee[];
	/**
	 * LES TITRES DE REMPLISSAGE — de quoi porter les états que les notes nommées ne portent
	 * pas. Le prototype ne montre que onze notes sur soixante-dix-sept ; les soixante-six
	 * autres n'existent QUE par leur état, parce que c'est tout ce que les captures en
	 * montrent : un compteur, une barre empilée, un nombre dans le rail. Leur titre est donc
	 * plausible et rien de plus, et leur corps tient en une phrase.
	 *
	 * Il en faut exactement `notes − nommees.length` : le chargeur refuse tout autre compte
	 * plutôt que d'inventer un titre en silence.
	 */
	readonly remplissage: readonly string[];
}

export interface UniversSeme {
	readonly nom: string;
	readonly description: string;
	/**
	 * LE GLYPHE DE L'UNIVERS — une CLÉ de la liste close que la console propose
	 * (`src/lib/coquille/glyphes.ts`), jamais un tracé. Le rail et la page d'univers
	 * rendent le choix fait en console : un tracé libre y retombe sur le repli, et les
	 * six univers portaient alors la même icône.
	 */
	readonly glyphe: string;
	readonly couleur: string;
	readonly domaines: readonly DomaineSeme[];
}

/**
 * LES SIX UNIVERS DU PROTOTYPE. Les totaux sont ceux des captures : 24 + 18 + 12 + 8 + 6 + 9 = 77
 * notes, dont 65 à jour, 6 bientôt, 3 à vérifier, 2 à revoir, 1 obsolète.
 */
export const UNIVERS_DE_CONFORMITE: readonly UniversSeme[] = [
	{
		nom: 'Claude',
		description:
			"Notes techniques, prompts et harnais autour de Claude et de Claude Code : installation, audit de code, bonnes pratiques d'autonomie.",
		glyphe: 'boussole',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'audit_code',
				description: 'Audits, incidents et procédures autour de Claude Code.',
				notes: 9,
				repartition: [5, 2, 1, 1, 0],
				nommees: [
					{
						titre: 'Note technique — Installation de Claude Code sous Linux et mode autonome',
						etat: 'ajour',
						fichier: 'claude.md'
					},
					{ titre: 'Incident — PATH Linux', etat: 'arevoir' },
					{ titre: 'Mode autonome — Bonnes pratiques', etat: 'ajour', ancienneteJours: 1 },
					{ titre: 'Workflow — Analyse IA', etat: 'ajour', ancienneteJours: 2 },
					{
						titre: 'Ancienne procédure npm',
						dossier: 'archives',
						etat: 'ajour',
						ancienneteJours: 0
					}
				],
				remplissage: [
					'Audit — Dépendances du dépôt',
					'Procédure — Revue assistée avant fusion',
					'Incident — Jeton d’authentification expiré',
					'Checklist — Session de code assistée'
				]
			},
			{
				nom: 'prompts',
				description: "Prompts utilisés dans l'univers.",
				notes: 11,
				repartition: [11, 0, 0, 0, 0],
				nommees: [
					{ titre: 'Prompt — Architecture LLM', etat: 'ajour' },
					{ titre: 'Prompt — Revue de code', etat: 'ajour', ancienneteJours: 3 }
				],
				remplissage: [
					'Prompt — Rédaction d’une note technique',
					'Prompt — Extraction d’une procédure',
					'Prompt — Synthèse de réunion',
					'Prompt — Traduction technique',
					'Prompt — Génération de tests',
					'Prompt — Analyse d’incident',
					'Prompt — Reformulation pour l’astreinte',
					'Prompt — Cadrage d’un besoin',
					'Prompt — Relecture orthographique'
				]
			},
			{
				nom: 'harnais',
				description: "Bancs d'évaluation et harnais LLM.",
				notes: 4,
				repartition: [4, 0, 0, 0, 0],
				nommees: [{ titre: "Harnais d'évaluation", etat: 'ajour', ancienneteJours: 5 }],
				remplissage: [
					'Banc — Jeux d’évaluation internes',
					'Banc — Mesure de régression',
					'Harnais — Journalisation des exécutions'
				]
			}
		]
	},
	{
		nom: 'Candidature',
		description:
			"CV, lettres et préparation d'entretiens. Chaque pièce est datée et revérifiée avant envoi.",
		glyphe: 'livre',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'CV',
				description: 'Versions datées du CV.',
				notes: 6,
				repartition: [5, 1, 0, 0, 0],
				nommees: [],
				remplissage: [
					'CV — Version courante',
					'CV — Version longue',
					'CV — Version anglaise',
					'CV — Format une page',
					'CV — Rubrique compétences',
					'CV — Historique des versions'
				]
			},
			{
				nom: 'Lettres',
				description: 'Lettres de motivation et relances.',
				notes: 8,
				repartition: [7, 1, 0, 0, 0],
				nommees: [],
				remplissage: [
					'Lettre — Modèle générique',
					'Lettre — Poste de business analyst',
					'Lettre — Poste de chef de projet',
					'Lettre — Relance après entretien',
					'Lettre — Candidature spontanée',
					'Lettre — Réponse à une annonce',
					'Lettre — Remerciements',
					'Lettre — Refus d’une proposition'
				]
			},
			{
				nom: 'Entretiens',
				description: "Préparation et comptes rendus d'entretiens.",
				notes: 4,
				repartition: [3, 0, 0, 0, 1],
				nommees: [],
				remplissage: [
					'Entretien — Questions récurrentes',
					'Entretien — Préparation technique',
					'Entretien — Compte rendu du 12 mars',
					'Entretien — Négociation salariale'
				]
			}
		]
	},
	{
		nom: 'Business Analysis',
		description:
			"Cadrages, ateliers et livrables d'analyse. Les connaissances méthodologiques de référence.",
		glyphe: 'jalon',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'Cadrage',
				description: 'Notes de cadrage et périmètres.',
				notes: 7,
				repartition: [6, 1, 0, 0, 0],
				nommees: [],
				remplissage: [
					'Cadrage — Note de périmètre',
					'Cadrage — Parties prenantes',
					'Cadrage — Objectifs et indicateurs',
					'Cadrage — Contraintes et hypothèses',
					'Cadrage — Trajectoire de livraison',
					'Cadrage — Risques identifiés',
					'Cadrage — Glossaire du projet'
				]
			},
			{
				nom: 'Ateliers',
				description: "Supports et restitutions d'ateliers.",
				notes: 5,
				repartition: [5, 0, 0, 0, 0],
				nommees: [],
				remplissage: [
					'Atelier — Cartographie des processus',
					'Atelier — Priorisation des besoins',
					'Atelier — Parcours utilisateur',
					'Atelier — Restitution du 4 février',
					'Atelier — Modèle d’animation'
				]
			}
		]
	},
	{
		nom: 'Substack',
		description: "Veille, connaissance et production autour de l'écosystème Substack.",
		glyphe: 'corbeille',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'Brouillons',
				description: "Articles en cours d'écriture.",
				notes: 5,
				repartition: [4, 0, 1, 0, 0],
				nommees: [],
				remplissage: [
					'Brouillon — L’écriture technique au quotidien',
					'Brouillon — Ce que la documentation coûte',
					'Brouillon — Notes de lecture',
					'Brouillon — Retour sur six mois d’agents',
					'Brouillon — Plan de la série'
				]
			},
			{
				nom: 'Publiés',
				description: 'Articles publiés et leurs sources.',
				notes: 3,
				repartition: [3, 0, 0, 0, 0],
				nommees: [],
				remplissage: [
					'Publié — Pourquoi vérifier une note',
					'Publié — Le graphe comme plan',
					'Publié — Deux registres pour une note'
				]
			}
		]
	},
	{
		nom: 'Agents',
		description: "Orchestration d'agents : patrons, garde-fous et retours d'expérience.",
		glyphe: 'engrenage',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'Orchestration',
				description: 'Patrons d’orchestration et garde-fous.',
				notes: 6,
				repartition: [6, 0, 0, 0, 0],
				nommees: [],
				remplissage: [
					'Patron — Orchestrateur et exécutants',
					'Patron — Reprise après échec',
					'Patron — Passage de contexte',
					'Garde-fou — Périmètres d’écriture disjoints',
					'Garde-fou — Budget de tours',
					'Retour — Une vague de six agents'
				]
			}
		]
	},
	{
		nom: 'Infrastructure',
		description:
			"Exploitation, sauvegardes et réseau. Les procédures que l'astreinte doit pouvoir suivre les yeux fermés.",
		glyphe: 'pile',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'Sauvegardes',
				description: 'Politique, procédures et fiches de sauvegarde.',
				notes: 3,
				repartition: [1, 0, 1, 1, 0],
				nommees: [
					{
						titre: 'Restaurer une sauvegarde PostgreSQL',
						dossier: 'Exploitation',
						etat: 'arevoir',
						fichier: 'pg.md'
					},
					{ titre: 'Politique de sauvegarde', dossier: 'Exploitation', etat: 'averifier' },
					{ titre: 'Fiche BKP-01', etat: 'ajour' }
				],
				remplissage: []
			},
			{
				nom: 'Réseau',
				description: 'Équipements, bascules et incidents réseau.',
				notes: 6,
				repartition: [5, 1, 0, 0, 0],
				nommees: [],
				remplissage: [
					'Bascule — Lien opérateur principal',
					'Équipement — Commutateur cœur de réseau',
					'Incident — Perte de la liaison secondaire',
					'Procédure — Mise à jour du pare-feu',
					'Plan — Adressage interne',
					'Équipement — Points d’accès sans fil'
				]
			}
		]
	}
];

/**
 * LA RÉPARTITION ATTENDUE, dans l'ordre `ORDRE_DES_ETATS` — ce que `01-accueil.png` affiche en
 * toutes lettres : « 77 notes dans votre bibliothèque, dont 65 sont actuellement à jour », puis
 * les cinq compteurs 65 / 6 / 3 / 2 / 1. Le chargeur la RELIT depuis la base avant de rendre la
 * main : c'est la seule garantie que le jeu vaut quelque chose.
 */
export const REPARTITION_ATTENDUE: readonly [number, number, number, number, number] = [
	65, 6, 3, 2, 1
];

/** Le total des notes, dérivé de la répartition — jamais écrit deux fois. */
export const NOTES_ATTENDUES: number = REPARTITION_ATTENDUE.reduce((a, b) => a + b, 0);

/**
 * LE PROFIL DE CONSULTATION D'UNE NOTE — `RG-M04-09`.
 *
 * Sans lignes dans `consultations`, la section « RÉCENTS » du rail et les deux listes de
 * l'accueil sont vides : elles ne se déduisent d'aucun autre fait. Le profil porte donc les
 * trois nombres que `01-accueil.png` montre — le cumul de toute la vie de la note, ce qu'elle
 * a pris sur trente jours, et depuis combien d'heures elle a été ouverte pour la dernière
 * fois. `heuresDepuisLaDerniere` à `null` : la note n'a pas été ouverte de la semaine, elle ne
 * paraît pas dans « Récemment consultées ».
 *
 * L'ORDRE DES DEUX LISTES EN DÉCOULE, il n'est pas écrit à côté : « les plus consultées » se
 * classe par `total`, « récemment consultées » par `heuresDepuisLaDerniere`.
 */
export interface ConsultationSemee {
	/** Le titre de la note consultée — il doit exister dans `UNIVERS_DE_CONFORMITE`. */
	readonly titre: string;
	/** Le cumul, celui de `notes.compteur_de_consultations`. */
	readonly total: number;
	/** Combien de ce cumul tombent dans les trente derniers jours. */
	readonly trenteDerniersJours: number;
	/** L'ancienneté de la dernière ouverture, en heures. `null` : plus d'une semaine. */
	readonly heuresDepuisLaDerniere: number | null;
}

/** Les six notes que `01-accueil.png` et `08-…png` chiffrent. Les autres n'ont aucune ligne. */
export const CONSULTATIONS_DE_CONFORMITE: readonly ConsultationSemee[] = [
	{
		titre: 'Note technique — Installation de Claude Code sous Linux et mode autonome',
		total: 2,
		trenteDerniersJours: 2,
		heuresDepuisLaDerniere: 0.2
	},
	{
		titre: 'Mode autonome — Bonnes pratiques',
		total: 94,
		trenteDerniersJours: 12,
		heuresDepuisLaDerniere: 1
	},
	{
		titre: 'Prompt — Architecture LLM',
		total: 118,
		trenteDerniersJours: 14,
		heuresDepuisLaDerniere: 3
	},
	{
		titre: 'Restaurer une sauvegarde PostgreSQL',
		total: 412,
		trenteDerniersJours: 17,
		heuresDepuisLaDerniere: 5
	},
	{
		titre: 'Workflow — Analyse IA',
		total: 142,
		trenteDerniersJours: 16,
		heuresDepuisLaDerniere: 7
	},
	{
		titre: 'Politique de sauvegarde',
		total: 87,
		trenteDerniersJours: 11,
		heuresDepuisLaDerniere: null
	}
];

/* ─────────────────────────────────────────────── Les relations ───────── */

/**
 * LE VOCABULAIRE DES RELATIONS. Un jeu qui efface la table des types doit la rendre : sans elle,
 * le panneau RELATIONS d'une note ne peut rien porter et la cartographie n'a aucune arête à
 * dessiner. Ce sont ceux du jeu de démonstration — un vocabulaire de relations est un choix
 * d'instance, jamais une donnée de refonte.
 */
export interface TypeDeRelationSeme {
	readonly identifiant: string;
	readonly sortant: string;
	readonly entrant: string;
	readonly technique: boolean;
}

export const TYPES_DE_RELATION_DE_CONFORMITE: readonly TypeDeRelationSeme[] = [
	{ identifiant: 'depend-de', sortant: 'dépend de', entrant: 'dont dépendent', technique: true },
	{
		identifiant: 'documente',
		sortant: 'documente',
		entrant: 'est documenté par',
		technique: false
	},
	{ identifiant: 'complete', sortant: 'complète', entrant: 'est complété par', technique: false },
	{ identifiant: 'corrige', sortant: 'corrige', entrant: 'est corrigé par', technique: false },
	{ identifiant: 'remplace', sortant: 'remplace', entrant: 'est remplacé par', technique: false }
];

export interface RelationSemee {
	/** Le TITRE de la note source — les notes du jeu se désignent par leur titre. */
	readonly source: string;
	readonly cible: string;
	readonly type: string;
}

/**
 * LES RELATIONS DES DEUX NOTES RÉDIGÉES. La capture de la première en annonce trois, celle de la
 * seconde quatre. Elles traversent les univers, et c'est le point d'un graphe : une procédure
 * d'exploitation est documentée par une fiche d'un autre domaine.
 */
export const RELATIONS_DE_CONFORMITE: readonly RelationSemee[] = [
	{
		source: 'Note technique — Installation de Claude Code sous Linux et mode autonome',
		cible: 'Mode autonome — Bonnes pratiques',
		type: 'complete'
	},
	{
		source: 'Note technique — Installation de Claude Code sous Linux et mode autonome',
		cible: 'Incident — PATH Linux',
		type: 'corrige'
	},
	{
		source: 'Note technique — Installation de Claude Code sous Linux et mode autonome',
		cible: 'Ancienne procédure npm',
		type: 'remplace'
	},
	{
		source: 'Restaurer une sauvegarde PostgreSQL',
		cible: 'Politique de sauvegarde',
		type: 'depend-de'
	},
	{ source: 'Restaurer une sauvegarde PostgreSQL', cible: 'Fiche BKP-01', type: 'documente' },
	{
		source: 'Restaurer une sauvegarde PostgreSQL',
		cible: 'Workflow — Analyse IA',
		type: 'complete'
	},
	{
		source: 'Restaurer une sauvegarde PostgreSQL',
		cible: "Harnais d'évaluation",
		type: 'documente'
	}
];
