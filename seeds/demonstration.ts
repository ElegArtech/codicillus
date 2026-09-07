/**
 * LE JEU DE DÉMONSTRATION — une direction des systèmes d'information de 120
 * personnes, telle qu'elle documente réellement son travail.
 *
 * Il ne remplace pas `corpus.ts`, qui transcrit les maquettes et sert au rendu
 * par défaut des vues. Celui-ci sert à MONTRER LE PRODUIT PLEIN : il couvre les
 * trois natures de contenu d'une DSI — la gouvernance et sa comitologie, les
 * notes de service, la documentation technique — et il exerce chaque
 * fonctionnalité plutôt que de la décrire.
 *
 * CE QUI EST EXERCÉ, ET POURQUOI CHAQUE CHOIX :
 *
 *   · LA FRAÎCHEUR. Les dates de vérification sont ÉTALÉES à dessein — du jour
 *     même à dix-huit mois — pour que les trois niveaux du témoin se voient
 *     côte à côte. Une charte signée il y a un an est légitimement ancienne ;
 *     une procédure d'astreinte qui ne l'a pas été depuis huit mois est un
 *     risque. C'est tout le propos du produit, et il ne se démontre pas sur un
 *     corpus uniformément frais.
 *   · LES DEUX REGISTRES. Les procédures portent une Référence (ce qui est
 *     vrai) ET un Opérationnel (ce qu'on fait, pas à pas). Les politiques et
 *     les comptes rendus n'ont qu'une Référence : tout ne se joue pas en deux
 *     registres, et prétendre le contraire serait un remplissage.
 *   · LES RELATIONS. Elles traversent les univers : une note de service
 *     ENCADRE une procédure technique, une application DÉPEND d'un serveur, un
 *     comité EST DOCUMENTÉ PAR ses comptes rendus. C'est ce croisement qui rend
 *     la cartographie lisible plutôt que décorative.
 *   · LES ÉTATS. Un brouillon, deux notes en révision demandée avec leur motif,
 *     des notes jamais vérifiées : les écrans d'alerte ont de quoi montrer.
 */

/* ─────────────────────────────────────────────── Les comptes ─────────── */

export interface CompteDeDemonstration {
	readonly identifiant: string;
	readonly nom: string;
	readonly courriel: string;
	readonly role: 'administrateur' | 'referent' | 'contributeur' | 'lecteur';
	readonly arriveLe: string;
	readonly actif: boolean;
}

export const COMPTES: readonly CompteDeDemonstration[] = [
	{
		identifiant: 'c.marchand',
		nom: 'Claire Marchand',
		courriel: 'claire.marchand@exemple.fr',
		role: 'administrateur',
		arriveLe: '2019-03-04',
		actif: true
	},
	{
		identifiant: 'y.abitbol',
		nom: 'Yaël Abitbol',
		courriel: 'yael.abitbol@exemple.fr',
		role: 'administrateur',
		arriveLe: '2021-09-13',
		actif: true
	},
	{
		identifiant: 'k.belhadj',
		nom: 'Karim Belhadj',
		courriel: 'karim.belhadj@exemple.fr',
		role: 'referent',
		arriveLe: '2020-01-06',
		actif: true
	},
	{
		identifiant: 's.nguyen',
		nom: 'Sophie Nguyen',
		courriel: 'sophie.nguyen@exemple.fr',
		role: 'referent',
		arriveLe: '2018-11-19',
		actif: true
	},
	{
		identifiant: 'm.ferreira',
		nom: 'Marc Ferreira',
		courriel: 'marc.ferreira@exemple.fr',
		role: 'contributeur',
		arriveLe: '2022-05-02',
		actif: true
	},
	{
		identifiant: 'l.pereira',
		nom: 'Léa Pereira',
		courriel: 'lea.pereira@exemple.fr',
		role: 'contributeur',
		arriveLe: '2023-02-27',
		actif: true
	},
	{
		identifiant: 'j.tanaka',
		nom: 'Jun Tanaka',
		courriel: 'jun.tanaka@exemple.fr',
		role: 'contributeur',
		arriveLe: '2024-09-02',
		actif: true
	},
	{
		identifiant: 'a.rousseau',
		nom: 'Antoine Rousseau',
		courriel: 'antoine.rousseau@exemple.fr',
		role: 'lecteur',
		arriveLe: '2017-06-12',
		actif: false
	}
];

/* ──────────────────────────────────── L'organisation du corpus ───────── */

export interface UniversDeDemonstration {
	readonly identifiant: string;
	readonly nom: string;
	readonly description: string;
	readonly couleur: string;
	readonly glyphe: string;
	readonly ordre: number;
}

export const UNIVERS: readonly UniversDeDemonstration[] = [
	{
		identifiant: 'gouvernance',
		nom: 'Gouvernance',
		couleur: '#5b3f7a',
		glyphe: 'jalon',
		ordre: 1,
		description:
			"Comment la direction décide, qui décide, et ce qui a été décidé. Les instances et leur cadence, la doctrine qui s'impose à tous, les notes de service qui la diffusent. Le contenu y vieillit lentement mais son obsolescence coûte cher : une règle périmée continue d'être appliquée."
	},
	{
		identifiant: 'production',
		nom: 'Production',
		couleur: '#24485c',
		glyphe: 'pile',
		ordre: 2,
		description:
			"Ce qui tourne aujourd'hui. Toute interruption ici se voit depuis le métier, et toute documentation périmée se paie une nuit d'astreinte."
	},
	{
		identifiant: 'projets',
		nom: 'Projets',
		couleur: '#1d6b4a',
		glyphe: 'corbeille',
		ordre: 3,
		description:
			"Ce qui n'est pas encore en service. Contenu temporaire par nature : à la clôture du projet, ce qui doit survivre est reversé dans Production."
	},
	/**
	 * SUBSTACK — L'UNIVERS QUI FAIT VOIR LA CARTOGRAPHIE, et c'est sa seule raison
	 * d'être ici. Les trois univers ci-dessus portent vingt-cinq notes et vingt-deux
	 * relations : à cette taille, tout dessin est lisible, y compris un mauvais.
	 *
	 * CELUI-CI EN PORTE QUATRE-VINGT-DEUX, réparties en neuf familles sémantiques
	 * d'effectifs très inégaux — de douze notes à cinq — plus huit notes que rien ne
	 * rapproche de rien. C'est exactement la forme sur laquelle une disposition se
	 * casse : une petite famille coincée entre deux grandes, des contours qui se
	 * recouvrent, des libellés qui se chevauchent. Un jeu de vingt-cinq notes ne
	 * prouve rien de la carte.
	 *
	 * IL EST AUTONOME : aucune de ses notes ne se relie aux trois autres univers, et
	 * c'est ce qui permet de le regarder seul, au sélecteur de périmètre.
	 */
	{
		identifiant: 'substack',
		nom: 'Substack',
		couleur: '#2f6b4f',
		glyphe: 'pile',
		ordre: 4,
		description:
			"Une lettre hebdomadaire sur l'outillage et la méthode de ceux qui écrivent du code. Les chroniques publiées, l'atelier qui les produit, et la veille qui les nourrit."
	}
];

export interface DomaineDeDemonstration {
	readonly identifiant: string;
	readonly nom: string;
	readonly univers: string;
	readonly description: string;
	readonly couleur: string;
	readonly modules: readonly string[];
}

const TOUS_MODULES = ['notes', 'dossiers', 'fiches', 'cartographie', 'signets', 'carte_mentale'];

export const DOMAINES: readonly DomaineDeDemonstration[] = [
	{
		identifiant: 'instances',
		nom: 'Instances',
		univers: 'Gouvernance',
		couleur: '#7a2f8f',
		description:
			'La comitologie : qui siège, à quelle cadence, avec quel mandat, et ce que chaque séance a tranché.',
		modules: ['notes', 'dossiers', 'cartographie', 'carte_mentale']
	},
	{
		identifiant: 'doctrine',
		nom: 'Doctrine',
		univers: 'Gouvernance',
		couleur: '#453ba0',
		description:
			"Les politiques et les règles qui s'imposent à toute la direction : sécurité, architecture, achats.",
		modules: ['notes', 'dossiers', 'signets', 'cartographie']
	},
	{
		identifiant: 'notes-de-service',
		nom: 'Notes de service',
		univers: 'Gouvernance',
		couleur: '#8f5a2f',
		description:
			"Les décisions diffusées à tous, datées et signées. Une note de service ne se discute pas : elle s'applique.",
		modules: ['notes', 'dossiers']
	},
	{
		identifiant: 'infrastructure',
		nom: 'Infrastructure',
		univers: 'Production',
		couleur: '#1b6b7a',
		description:
			'Serveurs, réseau, sauvegardes, supervision. Le socle sur lequel tout le reste repose.',
		modules: TOUS_MODULES
	},
	{
		identifiant: 'applications',
		nom: 'Applications',
		univers: 'Production',
		couleur: '#2f6b4f',
		description:
			"Le parc applicatif et ce qu'il faut savoir pour l'exploiter : fiches, intégrations, contacts éditeurs.",
		modules: TOUS_MODULES
	},
	{
		identifiant: 'migration-2027',
		nom: 'Migration 2027',
		univers: 'Projets',
		couleur: '#3e5266',
		description:
			'Le remplacement du socle de messagerie et la bascule du parc vers le nouveau domaine.',
		modules: ['notes', 'dossiers', 'cartographie']
	},
	{
		identifiant: 'chroniques',
		nom: 'Chroniques',
		univers: 'Substack',
		couleur: '#6d4bc4',
		description:
			'Les textes publiés : ce que la lettre a dit sur les modèles, la stratégie, le marketing et la fabrique du contenu.',
		modules: TOUS_MODULES
	},
	{
		identifiant: 'atelier',
		nom: 'Atelier',
		univers: 'Substack',
		couleur: '#1d7a52',
		description:
			"Ce qui produit la lettre : l'outillage, l'installation de la chaîne de publication, le code, et la méthode d'écriture.",
		modules: TOUS_MODULES
	},
	{
		identifiant: 'veille',
		nom: 'Veille',
		univers: 'Substack',
		couleur: '#b8791a',
		description:
			"Ce qu'on suit, ce qu'on lit, et le vrac que personne n'a encore rangé — il existe dans toute base réelle, et la carte doit savoir le montrer.",
		modules: TOUS_MODULES
	}
];

/** Les dossiers, par domaine, du plus haut au plus profond. */
export const DOSSIERS: Readonly<Record<string, readonly string[]>> = {
	Instances: [
		'Comités permanents',
		'Comités permanents › Mandats',
		'Comptes rendus',
		'Comptes rendus › 2026'
	],
	Doctrine: ['Sécurité', 'Architecture', 'Achats'],
	'Notes de service': ['2026', '2025'],
	Infrastructure: [
		'Exploitation',
		'Exploitation › Sauvegardes',
		'Exploitation › Astreinte',
		'Réseau',
		'Supervision'
	],
	Applications: ['Fiches applicatives', 'Intégrations'],
	'Migration 2027': ['Cadrage', 'Lots'],
	/* LES DOSSIERS DE SUBSTACK PORTENT LES NOMS DES FAMILLES, et ce n'est pas une
	   coquetterie : le regroupement sémantique pèse l'étiquette trois, le dossier
	   deux et le mot de titre un. Le dossier RENFORCE ce que l'étiquette déclare, et
	   la partition qui en sort est stable — sans lui, deux familles voisines
	   fusionnent au gré du tirage de Louvain. */
	Chroniques: ['IA & Productivité', 'Business & Stratégie', 'Marketing', 'Contenu'],
	Atelier: ['Développement', 'Installation', 'Outils & Tech', 'Méthode'],
	/* HUIT DOSSIERS D'UN SEUL TENANT POUR LES HUIT NOTES ISOLÉES. Un dossier partagé
	   les rapprocherait — le dossier est un trait —, et elles ne seraient plus
	   isolées. C'est la seule façon de fabriquer, dans un jeu de démonstration, ce
	   qu'une base réelle produit toute seule : des notes que rien ne rejoint. */
	Veille: [
		'Veille',
		'Vrac — brouillons',
		'Vrac — comptabilité',
		'Vrac — accès',
		'Vrac — dates',
		'Vrac — cuisine',
		'Vrac — véhicule',
		'Vrac — loisirs',
		'Vrac — quotidien'
	]
};

/* ─────────────────────────────── Les référentiels de saisie ──────────── */

export interface TypeDeFicheDeDemonstration {
	readonly identifiant: string;
	readonly nom: string;
	/**
	 * QUATRE TYPES, PAS SIX. L'énumération `type_de_champ` de la base en déclare
	 * six — elle ajoute `date` et `lien` —, mais `lireTypesDeFiche()` n'en
	 * traduit que quatre et LÈVE sur les deux autres : une fiche qui les emploie
	 * met tous les écrans d'édition en 500. Le jeu s'en tient donc à ce que le
	 * produit sait rendre, et l'écart est signalé plutôt que contourné en
	 * silence.
	 */
	readonly champs: readonly {
		readonly cle: string;
		readonly nom: string;
		readonly type: 'texte' | 'nombre' | 'liste' | 'booleen';
		readonly exemple?: string;
		readonly valeurs?: readonly string[];
	}[];
}

export const TYPES_DE_FICHE: readonly TypeDeFicheDeDemonstration[] = [
	{
		identifiant: 'application',
		nom: 'Application',
		champs: [
			{ cle: 'editeur', nom: 'Éditeur', type: 'texte', exemple: 'Teclib' },
			{ cle: 'version', nom: 'Version', type: 'texte', exemple: '10.0.16' },
			{
				cle: 'criticite',
				nom: 'Criticité',
				type: 'liste',
				valeurs: ['Vitale', 'Importante', 'Secondaire']
			},
			{ cle: 'donnees-personnelles', nom: 'Données personnelles', type: 'booleen' },
			{ cle: 'contrat', nom: 'Échéance du contrat', type: 'texte', exemple: '31/03/2027' },
			{ cle: 'url', nom: 'Adresse', type: 'texte', exemple: 'https://…' }
		]
	},
	{
		identifiant: 'serveur',
		nom: 'Serveur',
		champs: [
			{ cle: 'nom-dns', nom: 'Nom DNS', type: 'texte', exemple: 'pg-prod-01.interne' },
			{ cle: 'systeme', nom: "Système d'exploitation", type: 'texte', exemple: 'Debian 13' },
			{
				cle: 'salle',
				nom: 'Salle',
				type: 'liste',
				valeurs: ['Datacentre A', 'Datacentre B', 'Local technique']
			},
			{ cle: 'vcpu', nom: 'vCPU', type: 'nombre', exemple: '16' },
			{ cle: 'sauvegarde', nom: 'Sauvegardé', type: 'booleen' }
		]
	},
	{
		identifiant: 'equipement-reseau',
		nom: 'Équipement réseau',
		champs: [
			{ cle: 'modele', nom: 'Modèle', type: 'texte', exemple: 'Catalyst 9300' },
			{
				cle: 'role',
				nom: 'Rôle',
				type: 'liste',
				valeurs: ['Cœur', 'Distribution', 'Accès', 'Pare-feu']
			},
			{ cle: 'salle', nom: 'Salle', type: 'texte', exemple: 'Datacentre A' },
			{ cle: 'fin-de-support', nom: 'Fin de support', type: 'texte', exemple: '31/07/2028' }
		]
	},
	{
		identifiant: 'contact',
		nom: 'Contact',
		champs: [
			{ cle: 'organisation', nom: 'Organisation', type: 'texte', exemple: 'Teclib' },
			{ cle: 'fonction', nom: 'Fonction', type: 'texte', exemple: 'Ingénieur avant-vente' },
			{ cle: 'courriel', nom: 'Courriel', type: 'texte', exemple: 'contact@exemple.fr' },
			{ cle: 'telephone', nom: 'Téléphone', type: 'texte', exemple: '+33 1 23 45 67 89' },
			{ cle: 'astreinte', nom: 'Joignable en astreinte', type: 'booleen' }
		]
	}
];

export interface TypeDeRelationDeDemonstration {
	readonly identifiant: string;
	readonly sortant: string;
	readonly entrant: string;
	readonly technique: boolean;
}

export const TYPES_DE_RELATION: readonly TypeDeRelationDeDemonstration[] = [
	{ identifiant: 'depend-de', sortant: 'dépend de', entrant: 'dont dépendent', technique: true },
	{ identifiant: 'heberge', sortant: 'héberge', entrant: 'est hébergé par', technique: true },
	{
		identifiant: 'sauvegarde',
		sortant: 'sauvegarde',
		entrant: 'est sauvegardé par',
		technique: true
	},
	{
		identifiant: 'documente',
		sortant: 'documente',
		entrant: 'est documenté par',
		technique: false
	},
	{ identifiant: 'encadre', sortant: 'encadre', entrant: 'est encadré par', technique: false },
	{
		identifiant: 'contact',
		sortant: 'a pour contact',
		entrant: 'est contact de',
		technique: false
	},
	{ identifiant: 'remplace', sortant: 'remplace', entrant: 'est remplacé par', technique: false }
];

/* ─────────────────────────────────────────────── Les relations ───────── */

/**
 * Elles TRAVERSENT les univers, et c'est le point : une note de service encadre
 * une procédure technique, une application dépend d'un serveur, un comité est
 * documenté par ses relevés. Un graphe qui resterait dans un seul domaine ne
 * montrerait rien qu'une liste ne montre déjà.
 */
export interface RelationDeDemonstration {
	readonly source: string;
	readonly type: string;
	readonly cible: string;
}

export const RELATIONS: readonly RelationDeDemonstration[] = [
	/* La gouvernance encadre la technique. */
	{
		source: 'n-note-de-service-gel-des-changements-de-fin-d-annee',
		type: 'encadre',
		cible: 'n-charte-du-comite-des-changements'
	},
	{
		source: 'n-politique-de-sauvegarde',
		type: 'encadre',
		cible: 'n-restaurer-une-sauvegarde-postgresql'
	},
	{
		source: 'n-politique-de-securite-des-systemes-d-information',
		type: 'encadre',
		cible: 'n-astreinte-conduite-a-tenir'
	},
	{ source: 'n-regles-d-architecture', type: 'encadre', cible: 'n-gestion-de-parc' },
	{
		source: 'n-note-de-service-equipement-du-teletravail',
		type: 'encadre',
		cible: 'n-politique-de-securite-des-systemes-d-information'
	},

	/* Les instances et leurs traces. */
	{ source: 'n-codir-si-releve-du-3-mars-2026', type: 'documente', cible: 'n-charte-du-codir-si' },
	{
		source: 'n-comite-des-changements-releve-du-12-mars-2026',
		type: 'documente',
		cible: 'n-charte-du-comite-des-changements'
	},
	{
		source: 'n-comite-securite-mandat-et-cadence',
		type: 'depend-de',
		cible: 'n-charte-du-codir-si'
	},
	{
		source: 'n-comite-securite-mandat-et-cadence',
		type: 'documente',
		cible: 'n-politique-de-securite-des-systemes-d-information'
	},

	/* Le socle technique. */
	{ source: 'n-gestion-de-parc', type: 'depend-de', cible: 'n-pg-prod-01' },
	{ source: 'n-pg-prod-01', type: 'depend-de', cible: 'n-sw-core-01' },
	{ source: 'n-bkp-01', type: 'sauvegarde', cible: 'n-pg-prod-01' },
	{ source: 'n-restaurer-une-sauvegarde-postgresql', type: 'documente', cible: 'n-bkp-01' },
	{ source: 'n-bascule-du-reseau-de-secours', type: 'documente', cible: 'n-sw-core-01' },
	{ source: 'n-lire-une-alerte-de-supervision', type: 'documente', cible: 'n-pg-prod-01' },
	{
		source: 'n-documentation-postgresql-sauvegarde',
		type: 'documente',
		cible: 'n-restaurer-une-sauvegarde-postgresql'
	},

	/* Les contacts et le projet. */
	{
		source: 'n-support-editeur-messagerie',
		type: 'contact',
		cible: 'n-migration-2027-note-de-cadrage'
	},
	{
		source: 'n-migration-2027-note-de-cadrage',
		type: 'depend-de',
		cible: 'n-inventaire-des-dependances-a-l-annuaire'
	},
	{
		source: 'n-inventaire-des-dependances-a-l-annuaire',
		type: 'depend-de',
		cible: 'n-regles-d-architecture'
	},
	{
		source: 'n-anssi-guides-d-hygiene-informatique',
		type: 'documente',
		cible: 'n-politique-de-securite-des-systemes-d-information'
	},
	{ source: 'n-cnil-registre-des-traitements', type: 'documente', cible: 'n-gestion-de-parc' },

	/* ── L'UNIVERS SUBSTACK ──────────────────────────────────────────────────
	   AUCUNE DE CES RELATIONS NE SORT DE L'UNIVERS, et c'est délibéré : la
	   cartographie doit pouvoir se regarder au périmètre « Univers : Substack »
	   sans qu'un seul nœud fantôme vienne du dehors. Elles suivent les familles
	   sans s'y enfermer — une note de l'atelier documente une chronique, une
	   chronique dépend d'une note de méthode : c'est ce croisement qui rend la
	   carte lisible plutôt que décorative. */
	{ source: 'n-sub-installation', type: 'documente', cible: 'n-sub-claude-code' },
	{ source: 'n-sub-claude-code', type: 'depend-de', cible: 'n-sub-api-anthropic' },
	{ source: 'n-sub-vs-code', type: 'depend-de', cible: 'n-sub-claude-code' },
	{ source: 'n-sub-claude-code', type: 'depend-de', cible: 'n-sub-docker' },
	{ source: 'n-sub-ressources', type: 'documente', cible: 'n-sub-claude-code' },
	{ source: 'n-sub-extensions', type: 'depend-de', cible: 'n-sub-vs-code' },
	{ source: 'n-sub-raccourcis', type: 'documente', cible: 'n-sub-vs-code' },
	{ source: 'n-sub-editeur-de-texte', type: 'depend-de', cible: 'n-sub-vs-code' },
	{ source: 'n-sub-terminal', type: 'depend-de', cible: 'n-sub-linux' },
	{ source: 'n-sub-git', type: 'depend-de', cible: 'n-sub-terminal' },
	{ source: 'n-sub-debogage', type: 'depend-de', cible: 'n-sub-terminal' },
	{ source: 'n-sub-gestionnaire-de-paquets', type: 'depend-de', cible: 'n-sub-paquets' },
	{ source: 'n-sub-prerequis', type: 'documente', cible: 'n-sub-installation' },
	{ source: 'n-sub-depannage', type: 'documente', cible: 'n-sub-installation' },
	{ source: 'n-sub-mise-a-jour', type: 'depend-de', cible: 'n-sub-installation' },
	{ source: 'n-sub-desinstallation', type: 'documente', cible: 'n-sub-installation' },
	{ source: 'n-sub-proxy', type: 'documente', cible: 'n-sub-installation' },
	{ source: 'n-sub-configuration', type: 'documente', cible: 'n-sub-variables' },
	{ source: 'n-sub-env', type: 'documente', cible: 'n-sub-configuration' },
	{ source: 'n-sub-docker', type: 'depend-de', cible: 'n-sub-linux' },
	{ source: 'n-sub-serveur', type: 'heberge', cible: 'n-sub-docker' },
	{ source: 'n-sub-serveur', type: 'depend-de', cible: 'n-sub-linux' },
	{ source: 'n-sub-tests', type: 'documente', cible: 'n-sub-ci' },
	{ source: 'n-sub-revue', type: 'encadre', cible: 'n-sub-ci' },
	{ source: 'n-sub-migrations', type: 'depend-de', cible: 'n-sub-schema' },
	{ source: 'n-sub-typage', type: 'depend-de', cible: 'n-sub-schema' },
	{ source: 'n-sub-erreurs', type: 'documente', cible: 'n-sub-journalisation' },
	{ source: 'n-sub-auth', type: 'depend-de', cible: 'n-sub-ressources' },
	{ source: 'n-sub-claude', type: 'depend-de', cible: 'n-sub-api-anthropic' },
	{ source: 'n-sub-prompts', type: 'documente', cible: 'n-sub-claude' },
	{ source: 'n-sub-agents', type: 'depend-de', cible: 'n-sub-claude' },
	{ source: 'n-sub-evaluer', type: 'documente', cible: 'n-sub-claude' },
	{ source: 'n-sub-contexte-long', type: 'depend-de', cible: 'n-sub-cout-par-jeton' },
	{ source: 'n-sub-ecrire-avec-un-modele', type: 'depend-de', cible: 'n-sub-prompts' },
	{ source: 'n-sub-assistant-quotidien', type: 'documente', cible: 'n-sub-prompts' },
	{ source: 'n-sub-tarification', type: 'depend-de', cible: 'n-sub-modele-economique' },
	{ source: 'n-sub-abonnements', type: 'depend-de', cible: 'n-sub-tarification' },
	{ source: 'n-sub-partenariats', type: 'depend-de', cible: 'n-sub-modele-economique' },
	{ source: 'n-sub-go-to-market', type: 'depend-de', cible: 'n-sub-positionnement' },
	{ source: 'n-sub-positionnement', type: 'depend-de', cible: 'n-sub-audience-cible' },
	{ source: 'n-sub-etude-de-marche', type: 'documente', cible: 'n-sub-positionnement' },
	{ source: 'n-sub-page-datterrissage', type: 'depend-de', cible: 'n-sub-audience-cible' },
	{ source: 'n-sub-reseaux-sociaux', type: 'depend-de', cible: 'n-sub-audience-cible' },
	{ source: 'n-sub-bienvenue', type: 'depend-de', cible: 'n-sub-page-datterrissage' },
	{ source: 'n-sub-parrainage', type: 'depend-de', cible: 'n-sub-bienvenue' },
	{ source: 'n-sub-objet-de-courriel', type: 'documente', cible: 'n-sub-taux-douverture' },
	{ source: 'n-sub-croissance', type: 'depend-de', cible: 'n-sub-taux-douverture' },
	{ source: 'n-sub-guide', type: 'documente', cible: 'n-sub-installation' },
	{ source: 'n-sub-readme', type: 'documente', cible: 'n-sub-guide' },
	{ source: 'n-sub-documentation', type: 'encadre', cible: 'n-sub-readme' },
	{ source: 'n-sub-archivage', type: 'encadre', cible: 'n-sub-documentation' },
	{ source: 'n-sub-controle-avant-publication', type: 'encadre', cible: 'n-sub-relecture' },
	{ source: 'n-sub-relecture', type: 'depend-de', cible: 'n-sub-titre-et-accroche' },
	{ source: 'n-sub-calendrier-editorial', type: 'encadre', cible: 'n-sub-decoupage' },
	{ source: 'n-sub-routine', type: 'depend-de', cible: 'n-sub-calendrier-editorial' },
	{ source: 'n-sub-prise-de-notes', type: 'encadre', cible: 'n-sub-routine' },
	{ source: 'n-sub-revue-hebdomadaire', type: 'documente', cible: 'n-sub-croissance' },
	{ source: 'n-sub-sources', type: 'documente', cible: 'n-sub-lecture-hebdo' },
	{ source: 'n-sub-flux-rss', type: 'depend-de', cible: 'n-sub-sources' },
	{ source: 'n-sub-conferences', type: 'documente', cible: 'n-sub-sources' },
	{ source: 'n-sub-automatiser-sa-veille', type: 'depend-de', cible: 'n-sub-flux-rss' },
	{ source: 'n-sub-lettres-concurrentes', type: 'documente', cible: 'n-sub-etude-de-marche' }
];

/**
 * LES DROITS. Chaque domaine a un gestionnaire nommé et des rédacteurs. Le
 * lecteur inactif n'en reçoit aucun : un compte désactivé qui garderait ses
 * droits est le défaut que la revue annuelle cherche.
 */
export const DROITS: readonly {
	readonly domaine: string;
	readonly compte: string;
	readonly droit: 'lecteur' | 'redacteur' | 'gestionnaire';
}[] = [
	{ domaine: 'Instances', compte: 'c.marchand', droit: 'gestionnaire' },
	{ domaine: 'Instances', compte: 'y.abitbol', droit: 'redacteur' },
	{ domaine: 'Instances', compte: 'k.belhadj', droit: 'redacteur' },
	{ domaine: 'Doctrine', compte: 'y.abitbol', droit: 'gestionnaire' },
	{ domaine: 'Doctrine', compte: 's.nguyen', droit: 'redacteur' },
	{ domaine: 'Doctrine', compte: 'k.belhadj', droit: 'redacteur' },
	{ domaine: 'Notes de service', compte: 'c.marchand', droit: 'gestionnaire' },
	{ domaine: 'Infrastructure', compte: 'k.belhadj', droit: 'gestionnaire' },
	{ domaine: 'Infrastructure', compte: 'm.ferreira', droit: 'redacteur' },
	{ domaine: 'Infrastructure', compte: 'j.tanaka', droit: 'redacteur' },
	{ domaine: 'Applications', compte: 's.nguyen', droit: 'gestionnaire' },
	{ domaine: 'Applications', compte: 'l.pereira', droit: 'redacteur' },
	{ domaine: 'Migration 2027', compte: 's.nguyen', droit: 'gestionnaire' },
	{ domaine: 'Migration 2027', compte: 'l.pereira', droit: 'redacteur' },
	{ domaine: 'Chroniques', compte: 'l.pereira', droit: 'gestionnaire' },
	{ domaine: 'Chroniques', compte: 'k.belhadj', droit: 'redacteur' },
	{ domaine: 'Chroniques', compte: 's.nguyen', droit: 'redacteur' },
	{ domaine: 'Atelier', compte: 'j.tanaka', droit: 'gestionnaire' },
	{ domaine: 'Atelier', compte: 'm.ferreira', droit: 'redacteur' },
	{ domaine: 'Atelier', compte: 'k.belhadj', droit: 'redacteur' },
	{ domaine: 'Veille', compte: 's.nguyen', droit: 'gestionnaire' },
	{ domaine: 'Veille', compte: 'l.pereira', droit: 'redacteur' }
];
