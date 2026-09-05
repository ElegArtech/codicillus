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
}

export interface UniversSeme {
	readonly nom: string;
	readonly description: string;
	/** Le tracé du glyphe de l'univers, dans une boîte de 16 × 16. */
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
		glyphe: 'M8 1.5v13M1.5 8h13M3.4 3.4l9.2 9.2M12.6 3.4L3.4 12.6',
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
					{ titre: 'Mode autonome — Bonnes pratiques', etat: 'ajour' },
					{ titre: 'Workflow — Analyse IA', etat: 'ajour' },
					{ titre: 'Ancienne procédure npm', dossier: 'archives', etat: 'ajour' }
				]
			},
			{
				nom: 'prompts',
				description: "Prompts utilisés dans l'univers.",
				notes: 11,
				repartition: [11, 0, 0, 0, 0],
				nommees: [
					{ titre: 'Prompt — Architecture LLM', etat: 'ajour' },
					{ titre: 'Prompt — Revue de code', etat: 'ajour' }
				]
			},
			{
				nom: 'harnais',
				description: "Bancs d'évaluation et harnais LLM.",
				notes: 4,
				repartition: [4, 0, 0, 0, 0],
				nommees: [{ titre: "Harnais d'évaluation", etat: 'ajour' }]
			}
		]
	},
	{
		nom: 'Candidature',
		description:
			"CV, lettres et préparation d'entretiens. Chaque pièce est datée et revérifiée avant envoi.",
		glyphe: 'M2 5.5h12v8H2zM5.5 5.5V3.5h5v2M2 9h12',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'CV',
				description: 'Versions datées du CV.',
				notes: 6,
				repartition: [5, 1, 0, 0, 0],
				nommees: []
			},
			{
				nom: 'Lettres',
				description: 'Lettres de motivation et relances.',
				notes: 8,
				repartition: [7, 1, 0, 0, 0],
				nommees: []
			},
			{
				nom: 'Entretiens',
				description: "Préparation et comptes rendus d'entretiens.",
				notes: 4,
				repartition: [3, 0, 0, 0, 1],
				nommees: []
			}
		]
	},
	{
		nom: 'Business Analysis',
		description:
			"Cadrages, ateliers et livrables d'analyse. Les connaissances méthodologiques de référence.",
		glyphe: 'M2 14h12M4 11V7M8 11V4M12 11V9',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'Cadrage',
				description: 'Notes de cadrage et périmètres.',
				notes: 7,
				repartition: [6, 1, 0, 0, 0],
				nommees: []
			},
			{
				nom: 'Ateliers',
				description: "Supports et restitutions d'ateliers.",
				notes: 5,
				repartition: [5, 0, 0, 0, 0],
				nommees: []
			}
		]
	},
	{
		nom: 'Substack',
		description: "Veille, connaissance et production autour de l'écosystème Substack.",
		glyphe: 'M2.5 3h11M2.5 6.5h11M2.5 10h11v4h-11z',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'Brouillons',
				description: "Articles en cours d'écriture.",
				notes: 5,
				repartition: [4, 0, 1, 0, 0],
				nommees: []
			},
			{
				nom: 'Publiés',
				description: 'Articles publiés et leurs sources.',
				notes: 3,
				repartition: [3, 0, 0, 0, 0],
				nommees: []
			}
		]
	},
	{
		nom: 'Agents',
		description: "Orchestration d'agents : patrons, garde-fous et retours d'expérience.",
		glyphe:
			'M8 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM13 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 5L4 11M9 5l3 6M5 13h6',
		couleur: '#1f5a3c',
		domaines: [
			{
				nom: 'Orchestration',
				description: 'Patrons d’orchestration et garde-fous.',
				notes: 6,
				repartition: [6, 0, 0, 0, 0],
				nommees: []
			}
		]
	},
	{
		nom: 'Infrastructure',
		description:
			"Exploitation, sauvegardes et réseau. Les procédures que l'astreinte doit pouvoir suivre les yeux fermés.",
		glyphe: 'M2 2.5h12v4H2zM2 9.5h12v4H2zM4.5 4.5h.01M4.5 11.5h.01',
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
				]
			},
			{
				nom: 'Réseau',
				description: 'Équipements, bascules et incidents réseau.',
				notes: 6,
				repartition: [5, 1, 0, 0, 0],
				nommees: []
			}
		]
	}
];
