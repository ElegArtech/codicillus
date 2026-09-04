/* ==========================================================================
   CODICILLUS — JEU DE SEMENCE UNIQUE
   ==========================================================================
   Source unique et typée du corpus de démonstration (PLAN-DE-REALISATION §3.6).

   PROVENANCE. Ce fichier est l'extraction fidèle des objets globaux de données
   portés par les maquettes gelées de `mockups/`. La vue de référence est
   `mockups/V-14-lecture-note.html`, qui porte le sur-ensemble : ses vingt-neuf
   globales couvrent, valeur par valeur, celles des quarante autres vues.

   RÈGLE DE NON-COMBLEMENT (P-02). Aucune valeur n'a été inventée, arrondie,
   complétée ni « rendue plausible ». Ce qui manque dans les maquettes manque
   ici, et est signalé en commentaire plutôt que fabriqué.

   VARIANTES. Les quarante et une maquettes ne portent que cinq jeux de notes,
   strictement emboîtés : 32 (complet), 27, 19, 14 et le jeu vide. Chaque vue
   doit être nourrie du sous-ensemble exact que sa maquette utilise, faute de
   quoi la comparaison visuelle application ↔ maquette ne prouve rien. D'où
   `corpusPourVue()` en fin de fichier.

   Ce fichier ne contient que des données et des sélecteurs sans effet de bord.
   Les fonctions de calcul des maquettes (fraîcheur, recherche, sous-graphe,
   arborescences…) relèvent du code applicatif, pas du jeu de semence.

   UNE SEULE DÉPENDANCE SORT DE CE FICHIER, et elle est là pour P-01. `CONFIG`
   porte les deux seuils de fraîcheur ; les écrire en littéral en faisait un
   second jeu de seuils que rien ne liait à celui de l'implémentation unique —
   ce qu'ADR-005 interdit nommément. `SEUILS_PAR_DEFAUT` de
   `src/lib/fraicheur.ts` est la définition ; `CONFIG` en dérive (voir plus
   bas). C'est l'import d'une CONSTANTE, pas d'un calcul : la règle ci-dessus
   tient toujours. Aucun cycle n'en naît — `fraicheur.ts` ne prend d'ici qu'un
   `import type`, effacé à la compilation.
   ========================================================================== */
import { SEUILS_PAR_DEFAUT } from '../src/lib/fraicheur.js';

/* ── Date de référence ─────────────────────────────────────────────────────
   Les maquettes affichent « Vérifié il y a 12 jours » à partir d'un couple
   (date absolue, compteur de jours). Ces libellés ne sont reproductibles que
   si l'horloge est fixée — exigence du PLAN-DE-REALISATION §3.6, imposée à
   toute capture et à tout test (§4.2).

   DÉTERMINATION. La date n'est écrite nulle part dans les maquettes : elle est
   déduite. Trois familles de données portent chacune un couple date + ancienneté
   en jours ; on les additionne et on regarde où elles convergent.

     • CORPUS      — `revise` + `jours`  : 29 des 31 notes datées → 13/08/2026
                     (2 notes tombent sur le 14/08/2026, voir ci-dessous)
     • REVISIONS   — `le` + `jours`      : 3 sur 3               → 13/08/2026
     • VERSIONS    — `date` + `jours`    : 11 sur 11             → 13/08/2026

   Soit 43 dérivations sur 45 qui donnent le même jour. Les deux exceptions sont
   `n-srv-app-01` (26/12/2025 + 231 j) et `n-sig-facturation` (10/01/2026 + 216 j),
   toutes deux obsolètes depuis plus de sept mois — leur libellé est arrondi au
   mois, donc un jour d'écart y est invisible. Elles ne remettent pas en cause
   la convergence ; elles sont remontées comme écart mineur.

   INDÉTERMINATION ASSUMÉE. L'heure de référence n'est pas déductible. Les
   maquettes portent des marqueurs relatifs à l'heure (« aujourd'hui à 09:12 »
   pour le compte c-lea, activité « il y a 3 heures ») qui bornent l'instant par
   le bas sans le fixer. Aucune heure n'est donc déclarée : la fabriquer serait
   un comblement. Les captures et tests qui ont besoin d'un instant doivent
   choisir explicitement leur convention à partir de cette date. */
export const DATE_REFERENCE = '2026-08-13';

/* ── Vocabulaire ───────────────────────────────────────────────────────────
   Les termes sont ceux de BRIEF-VUES §2.3 : note, fiche, registre, univers,
   domaine, dossier, étiquette, relation, signet, fraîcheur. Aucun synonyme ne
   circule (P-07). Les unions littérales ci-dessous sont dérivées des valeurs
   réellement présentes dans les maquettes, pas d'un catalogue théorique — le
   cahier des charges §3.4 énumère onze types de notes, les maquettes n'en
   emploient que cinq, et c'est cette réalité que le jeu de semence porte. */

/** Le signal de fiabilité temporelle. `obs` = obsolète probable. */
export type NiveauFraicheur = 'frais' | 'vieil' | 'obs';

/** Une note est publique ou interne (CDC §3.2, RG-NOT-04). */
export type Visibilite = 'Interne' | 'Publique';

/** Types de notes employés par les maquettes (5 des 11 types fournis). */
export type TypeDeNote = 'Procédure' | 'Guide' | 'Note' | 'Fiche' | 'Signet';

/** Types de fiches employés par les maquettes (3 des 4 types fournis :
 *  « Équipement réseau » n'apparaît dans aucune vue). */
export type TypeDeFiche = 'Serveur' | 'Application' | 'Contact';

/** L'un des deux registres de lecture d'une note. Valeurs issues des attributs
 *  `data-reg` du sélecteur de registre de V-14. */
export type Registre = 'reference' | 'operationnel';

/** Étiquette : mot-clé libre, partagé à l'échelle du produit. Jamais « tag ». */
export type Etiquette = string;

/** Chemin de rangement d'une note dans l'arborescence de dossiers de son
 *  domaine, segments séparés par « › ». Il n'existe pas de table de dossiers
 *  dans les maquettes : l'arborescence se déduit de ces chemins. */
export type CheminDeDossier = string;

/** Date au format d'affichage des maquettes : JJ/MM/AAAA. */
export type DateCourte = string;

/* LE NOM D'UN UNIVERS EST UNE CHAÎNE, ET C'EST UNE DÉCISION DE PRODUIT.
   Il fut une union littérale — 'Production' | 'Projets' | 'Non classé' —, ce
   qui typait la coquille SUR LE VOCABULAIRE DU JEU DE SEMENCE : le rail de
   navigation ne pouvait alors nommer que les trois univers des maquettes. Or un
   univers se crée dans la console, comme un domaine, un type de fiche ou un type
   de relation : rien dans ce produit ne connaît de métier. L'union rendait la
   promesse intenable dès la première instance réelle. */
export type NomDUnivers = string;
/** Même raison que `NomDUnivers` : un domaine se crée, il ne s'énumère pas. */
export type NomDeDomaine = string;
export type NomDAuteur = 'Sophie Nguyen' | 'Marc Ferreira' | 'Karim Belhadj';

/** Les trente-deux identifiants du jeu complet. Aucun autre n'existe dans les
 *  maquettes : les quatre variantes réduites n'en introduisent aucun. */
export type IdentifiantNote =
	| 'n-restaurer-pg'
	| 'n-restaurer-maria'
	| 'n-pra-bases'
	| 'n-diag-barman'
	| 'n-pg-prod-01'
	| 'n-tester-pra'
	| 'n-astreinte'
	| 'n-doc-barman'
	| 'n-purge-sauv'
	| 'n-planifier-sauv'
	| 'n-facturation'
	| 'n-sondes'
	| 'n-migration-bases'
	| 'n-poste-sauv'
	| 'n-mot-de-passe'
	| 'n-demander-acces'
	| 'n-visio'
	| 'n-reseau-invite'
	| 'n-signaler-incident'
	| 'n-pg-prod-02'
	| 'n-bkp-01'
	| 'n-srv-app-01'
	| 'n-referentiel'
	| 'n-portail-rh'
	| 'n-presta-reseau'
	| 'n-coffre-hors-site'
	| 'n-passerelle-edi'
	| 'n-sig-postgres'
	| 'n-sig-anssi'
	| 'n-sig-statut'
	| 'n-sig-neltis'
	| 'n-sig-facturation';

/** Les quarante et une vues maquettées. */
export type IdentifiantDeVue =
	| 'V-01'
	| 'V-02'
	| 'V-03'
	| 'V-04'
	| 'V-05'
	| 'V-06'
	| 'V-07'
	| 'V-08'
	| 'V-09'
	| 'V-10'
	| 'V-11'
	| 'V-12'
	| 'V-13'
	| 'V-14'
	| 'V-15'
	| 'V-16'
	| 'V-17'
	| 'V-18'
	| 'V-19'
	| 'V-20'
	| 'V-21'
	| 'V-22'
	| 'V-23'
	| 'V-24'
	| 'V-25'
	| 'V-26'
	| 'V-27'
	| 'V-28'
	| 'V-29'
	| 'V-30'
	| 'V-31'
	| 'V-32'
	| 'V-33'
	| 'V-34'
	| 'V-35'
	| 'V-36'
	| 'V-37'
	| 'V-38'
	| 'V-39'
	| 'V-40'
	| 'V-41';

/** Les cinq jeux de notes portés par les maquettes, du plus large au vide. */
export type Variante = 'complete' | 'cartographie' | 'lecture' | 'palette' | 'vide';

/* ── Les objets métier ─────────────────────────────────────────────────────*/

/** L'unité de connaissance. Une note qui porte `typeFiche` est une *fiche* ;
 *  ce n'est pas un objet séparé (RG-NOT-01). Une note de type « Signet » porte
 *  `url` et `ajoute`. */
export interface Note {
	readonly id: IdentifiantNote;
	readonly titre: string;
	readonly extrait: string;
	readonly type: TypeDeNote;
	/** Renseigné : la note est une fiche structurée. */
	readonly typeFiche?: TypeDeFiche;
	readonly univers: NomDUnivers;
	readonly domaine: NomDeDomaine;
	readonly dossier: CheminDeDossier;
	readonly auteur: NomDAuteur;
	readonly fraicheur: NiveauFraicheur;
	/** Jours écoulés depuis la dernière vérification, à DATE_REFERENCE. */
	readonly jours: number;
	/** Date de dernière vérification. `null` : jamais vérifiée. */
	readonly revise: DateCourte | null;
	readonly vues: number;
	/** Nombre de pièces jointes. */
	readonly pj: number;
	readonly brouillon: boolean;
	readonly visibilite: Visibilite;
	/** La note porte un corps Opérationnel en plus du corps Référence. */
	readonly operationnel: boolean;
	readonly etiquettes: readonly Etiquette[];
	/** Signets seulement : l'adresse du lien curaté. */
	readonly url?: string;
	/** Signets seulement : date d'ajout du signet. */
	readonly ajoute?: DateCourte;
}

/** Couche de segmentation la plus haute (CDC §3.1). */
export interface Univers {
	readonly nom: NomDUnivers;
	readonly couleur: string;
	readonly glyphe: string;
	/** Absent des variantes réduites, présent dans le jeu complet. */
	readonly ordre?: number;
	/** Univers système : ni supprimable ni renommable. */
	readonly systeme?: boolean;
	readonly description: string;
}

/** Espace de connaissance autonome, appartenant à un univers. */
export interface Domaine {
	readonly nom: NomDeDomaine;
	readonly univers: NomDUnivers;
	readonly couleur: string;
}

export type CleDeModule =
	'notes' | 'dossiers' | 'fiches' | 'cartographie' | 'signets' | 'carteMentale';

export interface Module {
	readonly nom: string;
	readonly sous: string;
}

export interface DetailDeDomaine {
	readonly description: string;
	readonly modules: readonly CleDeModule[];
}

/** Demande de révision ouverte sur une note. */
export interface DemandeDeRevision {
	readonly id: IdentifiantNote;
	readonly par: NomDAuteur;
	readonly le: DateCourte;
	/** Ancienneté de la demande, en jours avant DATE_REFERENCE. */
	readonly jours: number;
	readonly commentaire: string;
}

export type TypeDEvenement = 'verification' | 'edition' | 'revision' | 'publication' | 'import';

export interface EvenementDActivite {
	readonly type: TypeDEvenement;
	readonly qui: NomDAuteur;
	/** `null` pour un événement sans note cible (import). */
	readonly cible: IdentifiantNote | null;
	/** Ancienneté, en heures avant DATE_REFERENCE. */
	readonly heures: number;
	readonly detail?: string;
}

export interface UtilisateurCourant {
	readonly prenom: string;
	readonly nom: NomDAuteur;
	readonly initiales: string;
	readonly domaine: NomDeDomaine;
	readonly role: RoleDeCompte;
}

export interface EtatDInstance {
	readonly version: string;
	/** Libellé relatif, tel qu'affiché par la coquille. */
	readonly synchro: string;
}

export interface Version {
	/** Numéro de version. */
	readonly n: number;
	/** Ancienneté, en jours avant DATE_REFERENCE. */
	readonly jours: number;
	readonly date: DateCourte;
	readonly heure: string;
	readonly auteur: NomDAuteur;
	/** Lignes ajoutées. */
	readonly ajout: number;
	/** Lignes retirées. */
	readonly retrait: number;
	readonly resume: string;
}

/** Bloc de contenu d'une version. La `cle` identifie le bloc d'une version à
 *  l'autre : c'est elle qui distingue un bloc déplacé d'un bloc réécrit. */
export type BlocDeContenu =
	| { readonly cle: string; readonly type: 'p' | 'h2' | 'h3'; readonly texte: string }
	| { readonly cle: string; readonly type: 'liste' | 'taches'; readonly items: readonly string[] }
	| {
			readonly cle: string;
			readonly type: 'code';
			readonly langage: 'bash' | 'sql';
			readonly lignes: readonly string[];
	  }
	| { readonly cle: string; readonly type: 'figure'; readonly legende: string }
	| {
			readonly cle: string;
			readonly type: 'alerte';
			readonly niveau: 'danger' | 'attention';
			readonly titre: string;
			readonly texte: string;
	  }
	| {
			readonly cle: string;
			readonly type: 'tableau';
			readonly entetes: readonly string[];
			readonly lignes: readonly (readonly string[])[];
	  };

/** Squelette de contenu proposé à la création. Subsidiaire : jamais imposé. */
export interface Template {
	readonly id: string;
	/** Absent des variantes réduites (V-17, V-18, V-19…), présent dans le jeu complet. */
	readonly utilisations?: number;
	/** Idem : porté par le jeu complet seulement. */
	readonly defaut?: boolean;
	readonly nom: string;
	readonly type: TypeDeNote;
	readonly description: string;
	readonly structure: readonly string[];
	/** Contenu HTML du squelette, tel que les maquettes le portent. */
	readonly contenu: string;
}

export type TypeDeChamp = 'texte' | 'nombre' | 'liste' | 'interrupteur';

export interface ChampDeFiche {
	readonly cle: string;
	readonly nom: string;
	readonly type: TypeDeChamp;
	readonly exemple?: string;
	/**
	 * LES TROIS ATTRIBUTS QUE LA CONSOLE ÉCRIT, ET QUE LE JEU DE DÉMONSTRATION NE
	 * PORTE PAS. Ils sont facultatifs pour cette raison exactement : absent vaut
	 * « rien saisi », et le rendu du jeu ne bouge pas d'un pixel.
	 */
	readonly aide?: string;
	readonly defaut?: string;
	readonly obligatoire?: boolean;
	/** Champs de type « liste » seulement. */
	readonly valeurs?: readonly string[];
}

/** La présentation d'un type de fiche en console — `#f-desc` et `#f-icones`. */
export interface PresentationDeTypeDeFiche {
	readonly description: string;
	readonly glyphe: string;
}

export type CleDeTypeDeRelation =
	'heberge' | 'depend' | 'replique' | 'sauvegarde' | 'documente' | 'contact';

/** Vocabulaire relationnel : un libellé par sens de lecture. */
export interface LibellesDeRelation {
	readonly sortant: string;
	readonly entrant: string;
}

/** Lien qualifié et dirigé entre deux notes. */
export interface Relation {
	readonly de: IdentifiantNote;
	readonly vers: IdentifiantNote;
	readonly type: CleDeTypeDeRelation;
}

export type FormatDImport =
	| 'docx'
	| 'doc'
	| 'pptx'
	| 'pdf'
	| 'md'
	| 'txt'
	| 'xlsx'
	| 'png'
	| 'jpg'
	| 'jpeg'
	| 'webp'
	| 'gif'
	| 'zip';

/** Sort réservé à un fichier du lot : converti en note, ignoré, ou en échec. */
export type SortDeFichier = 'note' | 'ignore' | 'echec';

export interface FichierDuLot {
	/** Chemin relatif dans la source. */
	readonly c: string;
	readonly f: FormatDImport;
	/** Taille, en kilo-octets tels que les maquettes les comptent. */
	readonly o: number;
	readonly s: SortDeFichier;
	/** Motif, pour les fichiers ignorés ou en échec. */
	readonly m?: string;
	/**
	 * `RG-M12-01` — LA CIBLE PORTE DÉJÀ CETTE NOTE, À CETTE PLACE : l'écriture
	 * sera une mise à jour, pas une création.
	 *
	 * Le champ est OPTIONNEL parce qu'il n'a de sens que face à une cible. Le jeu
	 * de semence n'en a aucune — son lot d'exemple est un lot nu, tiré d'un
	 * partage réseau fictif —, et l'absence vaut « rien de connu », donc
	 * « création », ce que le gel rend déjà.
	 */
	readonly maj?: boolean;
}

export interface LotDImport {
	readonly source: string;
	readonly fichiers: readonly FichierDuLot[];
}

export interface EntreeDeJournalDImport {
	readonly id: string;
	readonly date: DateCourte;
	readonly heure: string;
	readonly auteur: NomDAuteur;
	readonly source: string;
	readonly scenario: string;
	readonly domaine: NomDeDomaine;
	readonly fichiers: number;
	readonly notes: number;
	readonly ignores: number;
	readonly echecs: number;
	readonly duree: string;
}

export type RoleDeCompte = 'Administrateur' | 'Référent' | 'Contributeur' | 'Lecteur';

export interface Compte {
	readonly id: string;
	readonly nom: string;
	readonly identifiant: string;
	readonly courriel: string;
	readonly role: RoleDeCompte;
	readonly domaine: NomDeDomaine;
	readonly actif: boolean;
	readonly arrivee: DateCourte;
	/** Libellé relatif, tel qu'affiché par la console. */
	readonly derniere: string;
}

export interface Contribution {
	readonly verifiees: number;
	readonly liens: number;
	readonly arrivee: DateCourte;
	readonly derniereConnexion: string;
}

export type MesureDeDistinction = 'publiees' | 'verifiees' | 'liens' | 'citations';

export interface Distinction {
	readonly id: string;
	readonly nom: string;
	readonly critere: string;
	readonly seuil: number;
	readonly mesure: MesureDeDistinction;
	readonly quoi: string;
}

export interface Configuration {
	/** En deçà de ce nombre de jours, une note est fraîche. */
	readonly seuilFrais: number;
	/** En deçà, vieillissante ; au-delà, obsolète probable. */
	readonly seuilVieillissant: number;
	readonly versionsMax: number;
	readonly portailAssistance: string;
	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — VIDE TANT QU'ELLE NE
	 * S'EST PAS NOMMÉE.
	 *
	 * Huit vues écrivaient « Direction technique » en dur, dont les cinq pieds
	 * publics et l'écran de connexion. Ce n'est ni une donnée du jeu, ni le nom
	 * du logiciel : c'est le segment de marché du cadrage soudé dans une
	 * signature de produit. « Codicillus » reste en dur — c'est le nom du
	 * LOGICIEL ; l'organisation, elle, se nomme.
	 *
	 * Vide par défaut, même jurisprudence que `portailAssistance` : inventer un
	 * nom d'organisation serait signer le produit de quelqu'un d'autre. Les vues
	 * rendent alors « Codicillus » seul.
	 */
	readonly nomOrganisation: string;
	readonly motFiche: string;
	/** Taille maximale d'une pièce jointe, en mégaoctets. */
	readonly tailleMaxPieceJointe: number;
	/** Durée de session, en minutes. */
	readonly dureeSession: number;
	/**
	 * `RG-NF-10` — LA PAGE D'INDISPONIBILITÉ PROGRAMMÉE EST-ELLE ACTIVE ?
	 *
	 * Active, tout compte SAUF un administrateur reçoit la page au lieu de
	 * l'application. L'administrateur continue de travailler : sans cela, il ne
	 * pourrait plus la désactiver.
	 */
	readonly indisponibiliteActive: boolean;
	/**
	 * Ce que la page d'indisponibilité dit. VIDE PAR DÉFAUT, et l'activation le
	 * refuse : une page d'indisponibilité qui n'annonce rien ne vaut pas mieux
	 * qu'une erreur de connexion.
	 */
	readonly messageDIndisponibilite: string;
}

export interface RequeteDeRecherche {
	readonly terme: string;
	/** Nombre de recherches sur trente jours. */
	readonly n: number;
	readonly resultats: number;
	/** Recherches suivies de l'ouverture d'un résultat. */
	readonly ouvertures: number;
	/** Évolution en points par rapport à la période précédente ; `null` quand la période
	 *  précédente ne porte aucune recherche de ce terme — il n'y a alors rien à comparer. */
	readonly evolution: number | null;
}

/* ── Les notes ─────────────────────────────────────────────────────────────
   Le jeu complet : trente-deux notes. Les quatre autres variantes portées par
   les maquettes en sont des sous-ensembles stricts (voir VUES_PAR_VARIANTE). */
export const CORPUS: readonly Note[] = [
	{
		id: 'n-restaurer-pg',
		titre: 'Restaurer une sauvegarde PostgreSQL depuis Barman',
		extrait:
			"Cette procédure décrit la restauration d'une base PostgreSQL 16 à partir des sauvegardes gérées par Barman. Elle couvre la restauration complète et la restauration à un instant donné.",
		type: 'Procédure',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation › Sauvegardes',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 12,
		revise: '01/08/2026',
		vues: 412,
		pj: 2,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: true,
		etiquettes: ['postgresql', 'sauvegarde', 'barman', 'astreinte']
	},
	{
		id: 'n-restaurer-maria',
		titre: 'Restaurer une sauvegarde MariaDB',
		extrait:
			"Restauration d'une base de données MariaDB 11 depuis un export logique ou une copie physique. La bascule du réplica est traitée séparément.",
		type: 'Procédure',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation › Sauvegardes',
		auteur: 'Marc Ferreira',
		fraicheur: 'vieil',
		jours: 118,
		revise: '17/04/2026',
		vues: 156,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['mariadb', 'sauvegarde', 'restauration']
	},
	{
		id: 'n-pra-bases',
		titre: "Plan de reprise d'activité — volet bases de données",
		extrait:
			'Engagements de reprise, ordre de restauration des bases de données et responsabilités par application. Document de référence, revu annuellement avec la direction.',
		type: 'Note',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation',
		auteur: 'Sophie Nguyen',
		fraicheur: 'obs',
		jours: 248,
		revise: '08/12/2025',
		vues: 289,
		pj: 3,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['pra', 'sauvegarde', 'continuité']
	},
	{
		id: 'n-diag-barman',
		titre: 'Diagnostiquer un échec de restauration Barman',
		extrait:
			'Arbre de décision face à un échec de restauration de base : clés SSH, espace disque, journaux de transaction manquants, incohérence de version.',
		type: 'Procédure',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation › Sauvegardes',
		auteur: 'Karim Belhadj',
		fraicheur: 'frais',
		jours: 5,
		revise: '08/08/2026',
		vues: 74,
		pj: 0,
		brouillon: true,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['barman', 'diagnostic', 'astreinte']
	},
	{
		id: 'n-pg-prod-01',
		titre: 'pg-prod-01',
		extrait:
			'Serveur de bases de données principal. Héberge les bases de facturation et de référentiel. Sauvegardé chaque nuit par Barman ; restauration couverte par la procédure dédiée.',
		type: 'Fiche',
		typeFiche: 'Serveur',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Applications › Serveurs',
		auteur: 'Karim Belhadj',
		fraicheur: 'frais',
		jours: 20,
		revise: '24/07/2026',
		vues: 531,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['postgresql', 'serveur', 'production']
	},
	{
		id: 'n-tester-pra',
		titre: 'Tester le plan de reprise — mode opératoire',
		extrait:
			"Répétition trimestrielle de la reprise sur l'environnement de bascule. Comprend la restauration blanche des bases et le relevé des temps constatés.",
		type: 'Guide',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation',
		auteur: 'Marc Ferreira',
		fraicheur: 'vieil',
		jours: 141,
		revise: null,
		vues: 98,
		pj: 1,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: true,
		etiquettes: ['pra', 'test', 'continuité']
	},
	{
		id: 'n-astreinte',
		titre: "Consignes d'astreinte — nuit et week-end",
		extrait:
			'Qui appeler, dans quel ordre, avec quels seuils de déclenchement. Renvoie vers les procédures de restauration des bases et de bascule.',
		type: 'Procédure',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation › Astreinte',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 9,
		revise: '04/08/2026',
		vues: 623,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: true,
		etiquettes: ['astreinte', 'consignes']
	},
	{
		id: 'n-doc-barman',
		titre: 'Documentation officielle Barman',
		extrait:
			"Référence de l'éditeur : options de recover, gestion de la rétention, restauration d'une base à un instant donné.",
		type: 'Signet',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation › Sauvegardes',
		url: 'https://docs.pgbarman.org/release/3.11/',
		ajoute: '18/07/2026',
		auteur: 'Karim Belhadj',
		fraicheur: 'frais',
		jours: 26,
		revise: '18/07/2026',
		vues: 61,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['barman', 'documentation']
	},
	{
		id: 'n-purge-sauv',
		titre: 'Purger les sauvegardes hors rétention',
		extrait:
			"Libération d'espace sur le serveur de sauvegarde. À ne jamais lancer pendant une restauration en cours.",
		type: 'Procédure',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation › Sauvegardes',
		auteur: 'Marc Ferreira',
		fraicheur: 'vieil',
		jours: 126,
		revise: '09/04/2026',
		vues: 87,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['sauvegarde', 'barman', 'rétention']
	},
	{
		id: 'n-planifier-sauv',
		titre: 'Planifier une sauvegarde Barman',
		extrait:
			"Déclaration d'un nouveau serveur dans Barman, fenêtre de sauvegarde et vérification du premier passage.",
		type: 'Procédure',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation › Sauvegardes',
		auteur: 'Karim Belhadj',
		fraicheur: 'frais',
		jours: 6,
		revise: '07/08/2026',
		vues: 143,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['sauvegarde', 'barman', 'postgresql']
	},
	{
		id: 'n-facturation',
		titre: 'Facturation',
		extrait:
			'Application de facturation clients. Base de données hébergée sur pg-prod-01, restauration couverte par la procédure Barman.',
		type: 'Fiche',
		typeFiche: 'Application',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives',
		auteur: 'Sophie Nguyen',
		fraicheur: 'vieil',
		jours: 133,
		revise: '02/04/2026',
		vues: 374,
		pj: 1,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['application', 'facturation', 'postgresql']
	},
	{
		id: 'n-sondes',
		titre: 'Sondes de supervision des bases de données',
		extrait:
			'Seuils, fréquences et destinataires des alertes. La sonde de réplication doit repasser au vert après toute restauration.',
		type: 'Note',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Supervision › Sondes',
		auteur: 'Marc Ferreira',
		fraicheur: 'obs',
		jours: 274,
		revise: '12/11/2025',
		vues: 112,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['supervision', 'postgresql', 'alertes']
	},
	{
		id: 'n-migration-bases',
		titre: 'Migration 2026 — lot 3, bases de données',
		extrait:
			'Périmètre, jalons et stratégie de reprise des bases lors de la bascule vers le nouveau socle. Restauration de contrôle prévue à chaque jalon.',
		type: 'Note',
		univers: 'Projets',
		domaine: 'Migration 2026',
		dossier: 'Lots',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 3,
		revise: '10/08/2026',
		vues: 208,
		pj: 4,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['migration', 'postgresql', 'planification']
	},
	{
		id: 'n-poste-sauv',
		titre: 'Sauvegarde des postes de travail',
		extrait:
			"Périmètre couvert, fréquence et procédure de restauration d'un profil utilisateur. Sans rapport avec les sauvegardes de bases.",
		type: 'Guide',
		univers: 'Production',
		domaine: 'Poste de travail',
		dossier: 'Déploiement',
		auteur: 'Karim Belhadj',
		fraicheur: 'vieil',
		jours: 152,
		revise: '14/03/2026',
		vues: 245,
		pj: 0,
		brouillon: false,
		visibilite: 'Publique',
		operationnel: false,
		etiquettes: ['poste', 'sauvegarde', 'restauration']
	},
	{
		id: 'n-mot-de-passe',
		titre: 'Réinitialiser son mot de passe',
		extrait:
			'Réinitialisation depuis le portail, depuis un poste verrouillé, ou par appel au support. Délai de prise en compte et cas des comptes de service.',
		type: 'Guide',
		univers: 'Production',
		domaine: 'Poste de travail',
		dossier: 'Déploiement › Comptes',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 11,
		revise: '02/08/2026',
		vues: 3210,
		pj: 0,
		brouillon: false,
		visibilite: 'Publique',
		operationnel: true,
		etiquettes: ['compte', 'mot de passe', 'support']
	},
	{
		id: 'n-demander-acces',
		titre: 'Demander un accès à une application',
		extrait:
			'Formulaire à remplir, validation par le responsable hiérarchique, délais constatés par application. Liste des applications concernées et de leurs référents.',
		type: 'Guide',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives › Accès',
		auteur: 'Karim Belhadj',
		fraicheur: 'frais',
		jours: 18,
		revise: '26/07/2026',
		vues: 1842,
		pj: 1,
		brouillon: false,
		visibilite: 'Publique',
		operationnel: false,
		etiquettes: ['accès', 'habilitation', 'support']
	},
	{
		id: 'n-visio',
		titre: 'Utiliser la visioconférence en salle de réunion',
		extrait:
			"Démarrer une réunion, partager un écran, connecter un portable personnel. Que faire quand l'écran reste noir ou que le micro n'est pas détecté.",
		type: 'Guide',
		univers: 'Production',
		domaine: 'Poste de travail',
		dossier: 'Déploiement › Salles',
		auteur: 'Marc Ferreira',
		fraicheur: 'vieil',
		jours: 124,
		revise: '11/04/2026',
		vues: 1431,
		pj: 0,
		brouillon: false,
		visibilite: 'Publique',
		operationnel: true,
		etiquettes: ['visioconférence', 'salle', 'support']
	},
	{
		id: 'n-reseau-invite',
		titre: 'Connecter un poste au réseau invité',
		extrait:
			"Procédure pour un intervenant extérieur ou un appareil personnel. Durée de validité de l'accès et limites du réseau invité.",
		type: 'Guide',
		univers: 'Production',
		domaine: 'Poste de travail',
		dossier: 'Déploiement › Réseau',
		auteur: 'Marc Ferreira',
		fraicheur: 'vieil',
		jours: 149,
		revise: '17/03/2026',
		vues: 1156,
		pj: 0,
		brouillon: false,
		visibilite: 'Publique',
		operationnel: false,
		etiquettes: ['réseau', 'invité', 'support']
	},
	{
		id: 'n-signaler-incident',
		titre: 'Signaler un incident au support',
		extrait:
			"Ce qu'il faut indiquer pour être dépanné vite : capture d'écran, heure exacte, message d'erreur complet. Niveaux d'urgence et délais associés.",
		type: 'Guide',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives › Support',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 7,
		revise: '06/08/2026',
		vues: 967,
		pj: 0,
		brouillon: false,
		visibilite: 'Publique',
		operationnel: false,
		etiquettes: ['support', 'incident', 'assistance']
	},
	{
		id: 'n-pg-prod-02',
		titre: 'pg-prod-02',
		extrait:
			'Réplica synchrone de pg-prod-01. Bascule manuelle, jamais automatique. Sert aussi de source aux extractions de nuit.',
		type: 'Fiche',
		typeFiche: 'Serveur',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Applications › Serveurs',
		auteur: 'Karim Belhadj',
		fraicheur: 'frais',
		jours: 20,
		revise: '24/07/2026',
		vues: 287,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['postgresql', 'serveur', 'réplication']
	},
	{
		id: 'n-bkp-01',
		titre: 'bkp-01.prod',
		extrait:
			'Serveur de sauvegarde. Barman pour les bases, dépôt de fichiers pour le reste. Point unique : aucune redondance à ce jour.',
		type: 'Fiche',
		typeFiche: 'Serveur',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Applications › Serveurs',
		auteur: 'Marc Ferreira',
		fraicheur: 'vieil',
		jours: 139,
		revise: '27/03/2026',
		vues: 194,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['sauvegarde', 'barman', 'serveur']
	},
	{
		id: 'n-srv-app-01',
		titre: 'srv-app-01',
		extrait: 'Serveur applicatif mutualisé. Héberge les trois applications métier en service.',
		type: 'Fiche',
		typeFiche: 'Serveur',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Applications › Serveurs',
		auteur: 'Karim Belhadj',
		fraicheur: 'obs',
		jours: 231,
		revise: '26/12/2025',
		vues: 163,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['serveur', 'applicatif', 'production']
	},
	{
		id: 'n-referentiel',
		titre: 'Référentiel',
		extrait:
			'Référentiel des tiers, partagé par la facturation et le portail. Toute indisponibilité se propage aux deux.',
		type: 'Fiche',
		typeFiche: 'Application',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 16,
		revise: '28/07/2026',
		vues: 241,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['application', 'référentiel', 'postgresql']
	},
	{
		id: 'n-portail-rh',
		titre: 'Portail RH',
		extrait: "Portail des demandes de congés et de notes de frais. Pic d'usage en fin de mois.",
		type: 'Fiche',
		typeFiche: 'Application',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives',
		auteur: 'Marc Ferreira',
		fraicheur: 'vieil',
		jours: 117,
		revise: '18/04/2026',
		vues: 198,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['application', 'rh']
	},
	{
		id: 'n-presta-reseau',
		titre: 'Prestataire réseau — Neltis',
		extrait:
			'Opérateur du lien principal et de la ligne de secours. Astreinte 24/7, engagement de rétablissement en 4 heures.',
		type: 'Fiche',
		typeFiche: 'Contact',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 24,
		revise: '20/07/2026',
		vues: 88,
		pj: 1,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['contact', 'réseau', 'prestataire']
	},
	{
		id: 'n-coffre-hors-site',
		titre: 'Coffre hors site',
		extrait:
			"Dépôt distant des sauvegardes longue durée. Atteignable uniquement depuis bkp-01.prod : aucun autre chemin n'existe.",
		type: 'Fiche',
		typeFiche: 'Serveur',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Applications › Serveurs',
		auteur: 'Marc Ferreira',
		fraicheur: 'obs',
		jours: 268,
		revise: '18/11/2025',
		vues: 71,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['sauvegarde', 'rétention', 'serveur']
	},
	{
		id: 'n-passerelle-edi',
		titre: 'Passerelle EDI',
		extrait:
			'Échanges de factures avec les partenaires. Hébergée sur srv-app-01, sans instance de secours.',
		type: 'Fiche',
		typeFiche: 'Application',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives',
		auteur: 'Sophie Nguyen',
		fraicheur: 'vieil',
		jours: 108,
		revise: '27/04/2026',
		vues: 132,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['application', 'edi', 'facturation']
	},
	{
		id: 'n-sig-postgres',
		titre: 'PostgreSQL — notes de version 16',
		extrait:
			'Journal officiel des versions 16.x. À consulter avant toute montée de version mineure : les changements de comportement y sont listés en tête.',
		type: 'Signet',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Exploitation',
		url: 'https://www.postgresql.org/docs/16/release.html',
		ajoute: '03/06/2026',
		auteur: 'Karim Belhadj',
		fraicheur: 'frais',
		jours: 14,
		revise: '30/07/2026',
		vues: 143,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['postgresql', 'documentation', 'versions']
	},
	{
		id: 'n-sig-anssi',
		titre: "ANSSI — guide d'hygiène informatique",
		extrait:
			'Les 42 mesures de référence. Sert de base à nos consignes internes de durcissement et aux revues de configuration.',
		type: 'Signet',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Supervision',
		url: 'https://cyber.gouv.fr/publications/guide-hygiene-informatique',
		ajoute: '12/02/2026',
		auteur: 'Sophie Nguyen',
		fraicheur: 'vieil',
		jours: 121,
		revise: '14/04/2026',
		vues: 96,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['sécurité', 'référentiel', 'documentation']
	},
	{
		id: 'n-sig-statut',
		titre: "Page d'état de l'hébergeur",
		extrait:
			"Incidents et maintenances programmées du fournisseur. Premier réflexe avant d'ouvrir une investigation interne.",
		type: 'Signet',
		univers: 'Production',
		domaine: 'Infrastructure',
		dossier: 'Supervision',
		url: 'https://status.exemple-hebergeur.net',
		ajoute: '21/07/2026',
		auteur: 'Marc Ferreira',
		fraicheur: 'frais',
		jours: 23,
		revise: '21/07/2026',
		vues: 312,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['supervision', 'incident', 'prestataire']
	},
	{
		id: 'n-sig-neltis',
		titre: "Neltis — portail client et déclaration d'incident",
		extrait:
			"Ouverture de ticket auprès du prestataire réseau. Identifiants partagés dans le coffre de l'équipe.",
		type: 'Signet',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives',
		url: 'https://client.neltis.fr/incidents',
		ajoute: '20/07/2026',
		auteur: 'Sophie Nguyen',
		fraicheur: 'frais',
		jours: 24,
		revise: '20/07/2026',
		vues: 74,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['prestataire', 'réseau', 'incident']
	},
	{
		id: 'n-sig-facturation',
		titre: 'Éditeur Facturation — base de connaissance',
		extrait:
			"Articles de l'éditeur sur les erreurs de traitement de lots. Recherche par code d'erreur.",
		type: 'Signet',
		univers: 'Production',
		domaine: 'Applications',
		dossier: 'Fiches applicatives',
		url: 'https://support.editeur-facturation.com/kb',
		ajoute: '09/01/2026',
		auteur: 'Marc Ferreira',
		fraicheur: 'obs',
		jours: 216,
		revise: '10/01/2026',
		vues: 58,
		pj: 0,
		brouillon: false,
		visibilite: 'Interne',
		operationnel: false,
		etiquettes: ['facturation', 'éditeur', 'documentation']
	}
];

/* ── Mesures et événements ─────────────────────────────────────────────────
   Tout chiffre affiché par un tableau de bord est calculé à partir de ces
   tables. Aucune valeur n'est saisie dans une vue. */
/** Consultations des sept derniers jours, note par note. */
export const MESURES_7J: Record<IdentifiantNote, number> = {
	'n-restaurer-pg': 37,
	'n-restaurer-maria': 9,
	'n-pra-bases': 14,
	'n-diag-barman': 11,
	'n-pg-prod-01': 41,
	'n-tester-pra': 6,
	'n-astreinte': 52,
	'n-doc-barman': 4,
	'n-purge-sauv': 5,
	'n-planifier-sauv': 12,
	'n-facturation': 23,
	'n-sondes': 7,
	'n-migration-bases': 31,
	'n-poste-sauv': 8,
	'n-mot-de-passe': 214,
	'n-demander-acces': 96,
	'n-visio': 63,
	'n-reseau-invite': 44,
	'n-signaler-incident': 58,
	'n-pg-prod-02': 19,
	'n-bkp-01': 12,
	'n-srv-app-01': 16,
	'n-referentiel': 27,
	'n-portail-rh': 21,
	'n-presta-reseau': 6,
	'n-coffre-hors-site': 4,
	'n-passerelle-edi': 14,
	'n-sig-postgres': 11,
	'n-sig-anssi': 5,
	'n-sig-statut': 34,
	'n-sig-neltis': 7,
	'n-sig-facturation': 3
};

/** Consultations des sept jours précédents — base de calcul des tendances. */
export const MESURES_7J_PREC: Record<IdentifiantNote, number> = {
	'n-restaurer-pg': 22,
	'n-restaurer-maria': 11,
	'n-pra-bases': 19,
	'n-diag-barman': 3,
	'n-pg-prod-01': 38,
	'n-tester-pra': 9,
	'n-astreinte': 47,
	'n-doc-barman': 6,
	'n-purge-sauv': 8,
	'n-planifier-sauv': 10,
	'n-facturation': 26,
	'n-sondes': 12,
	'n-migration-bases': 17,
	'n-poste-sauv': 11,
	'n-mot-de-passe': 198,
	'n-demander-acces': 88,
	'n-visio': 71,
	'n-reseau-invite': 39,
	'n-signaler-incident': 51,
	'n-pg-prod-02': 24,
	'n-bkp-01': 9,
	'n-srv-app-01': 13,
	'n-referentiel': 22,
	'n-portail-rh': 30,
	'n-presta-reseau': 8,
	'n-coffre-hors-site': 3,
	'n-passerelle-edi': 11,
	'n-sig-postgres': 9,
	'n-sig-anssi': 7,
	'n-sig-statut': 21,
	'n-sig-neltis': 5,
	'n-sig-facturation': 6
};

/** Ancienneté de la dernière modification, en jours avant DATE_REFERENCE.
 *  Distincte de la dernière vérification : une note peut être relue sans être
 *  retouchée, et retouchée sans être revérifiée. */
export const MODIFICATIONS: Record<IdentifiantNote, number> = {
	'n-restaurer-pg': 22,
	'n-restaurer-maria': 96,
	'n-pra-bases': 61,
	'n-diag-barman': 5,
	'n-pg-prod-01': 14,
	'n-tester-pra': 130,
	'n-astreinte': 9,
	'n-doc-barman': 26,
	'n-purge-sauv': 118,
	'n-planifier-sauv': 3,
	'n-facturation': 47,
	'n-sondes': 205,
	'n-migration-bases': 1,
	'n-poste-sauv': 142,
	'n-mot-de-passe': 15,
	'n-demander-acces': 33,
	'n-visio': 118,
	'n-reseau-invite': 149,
	'n-signaler-incident': 7,
	'n-pg-prod-02': 18,
	'n-bkp-01': 74,
	'n-srv-app-01': 196,
	'n-referentiel': 12,
	'n-portail-rh': 88,
	'n-presta-reseau': 29,
	'n-coffre-hors-site': 241,
	'n-passerelle-edi': 63,
	'n-sig-postgres': 14,
	'n-sig-anssi': 121,
	'n-sig-statut': 23,
	'n-sig-neltis': 24,
	'n-sig-facturation': 216
};

/** Demandes de révision ouvertes. */
export const REVISIONS: readonly DemandeDeRevision[] = [
	{
		id: 'n-restaurer-pg',
		par: 'Sophie Nguyen',
		le: '28/07/2026',
		jours: 16,
		commentaire:
			"La commande de restauration partielle a changé avec Barman 3.11. Le paragraphe 3.2 renvoie encore à l'ancienne syntaxe."
	},
	{
		id: 'n-sondes',
		par: 'Karim Belhadj',
		le: '11/08/2026',
		jours: 2,
		commentaire:
			"Les seuils ont été relevés en juin après les faux positifs de l'astreinte. Le tableau n'a pas suivi."
	},
	{
		id: 'n-visio',
		par: 'Marc Ferreira',
		le: '05/08/2026',
		jours: 8,
		commentaire:
			"Les salles du deuxième étage ont changé de matériel. Le guide décrit l'ancien boîtier."
	}
];

/** Activité récente. `heures` compte à rebours depuis DATE_REFERENCE. */
export const ACTIVITE: readonly EvenementDActivite[] = [
	{ type: 'verification', qui: 'Karim Belhadj', cible: 'n-migration-bases', heures: 3 },
	{ type: 'edition', qui: 'Sophie Nguyen', cible: 'n-signaler-incident', heures: 7 },
	{ type: 'revision', qui: 'Karim Belhadj', cible: 'n-sondes', heures: 29 },
	{ type: 'verification', qui: 'Sophie Nguyen', cible: 'n-astreinte', heures: 52 },
	{ type: 'publication', qui: 'Karim Belhadj', cible: 'n-planifier-sauv', heures: 78 },
	{
		type: 'import',
		qui: 'Marc Ferreira',
		cible: null,
		heures: 104,
		detail: '12 procédures reprises depuis le partage réseau'
	},
	{ type: 'edition', qui: 'Marc Ferreira', cible: 'n-visio', heures: 126 },
	{ type: 'verification', qui: 'Karim Belhadj', cible: 'n-planifier-sauv', heures: 151 }
];

/** Utilisateur incarné par les maquettes. */
export const MOI: UtilisateurCourant = {
	prenom: 'Karim',
	nom: 'Karim Belhadj',
	initiales: 'KB',
	domaine: 'Infrastructure',
	role: 'Référent'
};

export const INSTANCE: EtatDInstance = { version: '1.0.0', synchro: 'il y a 6 minutes' };

/* ── Hiérarchie de rangement : univers → domaine → dossier ─────────────────
   Le dossier n'est pas une table : il est porté par le chemin de chaque note
   (« Exploitation › Sauvegardes ») et l'arborescence s'en déduit. */
export const UNIVERS: readonly Univers[] = [
	{
		nom: 'Production',
		couleur: '#24485c',
		glyphe: 'pile',
		ordre: 1,
		description:
			"Ce qui tourne aujourd'hui. Toute interruption ici se voit depuis le métier, et toute documentation périmée se paie une nuit d'astreinte."
	},
	{
		nom: 'Projets',
		couleur: '#4a3d6b',
		glyphe: 'jalon',
		ordre: 2,
		description:
			"Ce qui n'est pas encore en service. Contenu temporaire par nature : à la clôture du projet, ce qui doit survivre est reversé dans Production."
	},
	{
		nom: 'Non classé',
		couleur: '#6b7c87',
		glyphe: 'corbeille',
		ordre: 3,
		systeme: true,
		description:
			'Destination de repli. Un domaine qui perd son univers de rattachement atterrit ici plutôt que de disparaître de la navigation.'
	}
];

/** La couleur sert au repérage d'un domaine ; elle est choisie hors des trois
 *  teintes de la fraîcheur, pour qu'aucune confusion ne soit possible entre
 *  appartenance et fiabilité. */
export const DOMAINES: readonly Domaine[] = [
	{ nom: 'Infrastructure', univers: 'Production', couleur: '#453ba0' },
	{ nom: 'Applications', univers: 'Production', couleur: '#1b6b7a' },
	{ nom: 'Poste de travail', univers: 'Production', couleur: '#7a2f8f' },
	{ nom: 'Migration 2026', univers: 'Projets', couleur: '#3e5266' }
];

/** Les six modules activables sur un domaine. */
export const MODULES: Record<CleDeModule, Module> = {
	notes: { nom: 'Notes', sous: 'Toutes les notes du domaine' },
	dossiers: { nom: 'Dossiers', sous: 'Rangement arborescent' },
	fiches: { nom: 'Fiches', sous: 'Objets typés et leurs relations' },
	cartographie: { nom: 'Cartographie', sous: 'Graphe des dépendances' },
	signets: { nom: 'Signets', sous: 'Liens web curatés' },
	carteMentale: { nom: 'Carte mentale', sous: 'Arbre dépliable du domaine' }
};

export const DETAIL_DOMAINES: Record<NomDeDomaine, DetailDeDomaine> = {
	Infrastructure: {
		description:
			"Serveurs, réseau, sauvegardes, supervision. Le socle sur lequel tout le reste s'appuie.",
		modules: ['notes', 'dossiers', 'fiches', 'cartographie', 'signets', 'carteMentale']
	},
	Applications: {
		description: 'Fiches applicatives, accès, contacts métier. Qui fait quoi, et sur quoi.',
		modules: ['notes', 'fiches', 'cartographie']
	},
	'Poste de travail': {
		description:
			'Postes, périphériques, salles de réunion, comptes. Ce que voient les utilisateurs.',
		modules: ['notes', 'dossiers']
	},
	'Migration 2026': {
		description: 'Lots, jalons et décisions de la migration vers le nouveau socle.',
		modules: ['notes']
	}
};

/* ── Versions ────────────────────────────────────────────────────────────── */
/** Nombre de versions conservées par note. */
export const RETENTION_VERSIONS: number = 50;

/** Historique des seules notes que les maquettes exposent en V-15 et V-16.
 *  « ajout » et « retrait » comptent les lignes touchées. */
export const VERSIONS: Partial<Record<IdentifiantNote, readonly Version[]>> = {
	'n-restaurer-pg': [
		{
			n: 14,
			jours: 22,
			date: '22/07/2026',
			heure: '16:47',
			auteur: 'Sophie Nguyen',
			ajout: 6,
			retrait: 2,
			resume: "Précision sur la fenêtre d'intervention et le délai constaté"
		},
		{
			n: 13,
			jours: 41,
			date: '03/07/2026',
			heure: '09:12',
			auteur: 'Karim Belhadj',
			ajout: 18,
			retrait: 11,
			resume: 'Réécriture de la section « Restauration à un instant donné »'
		},
		{
			n: 12,
			jours: 68,
			date: '06/06/2026',
			heure: '14:30',
			auteur: 'Marc Ferreira',
			ajout: 2,
			retrait: 2,
			resume: 'Correction du nom du serveur de sauvegarde'
		},
		{
			n: 11,
			jours: 95,
			date: '10/05/2026',
			heure: '11:05',
			auteur: 'Karim Belhadj',
			ajout: 24,
			retrait: 0,
			resume: "Ajout du schéma d'enchaînement et du point de non-retour"
		},
		{
			n: 10,
			jours: 128,
			date: '07/04/2026',
			heure: '17:22',
			auteur: 'Sophie Nguyen',
			ajout: 4,
			retrait: 9,
			resume: 'Suppression du contrôle par comptage complet, abandonné'
		},
		{
			n: 9,
			jours: 161,
			date: '05/03/2026',
			heure: '08:44',
			auteur: 'Karim Belhadj',
			ajout: 12,
			retrait: 3,
			resume: 'Ajout de la liste de contrôle après restauration'
		},
		{
			n: 8,
			jours: 204,
			date: '21/01/2026',
			heure: '15:58',
			auteur: 'Marc Ferreira',
			ajout: 1,
			retrait: 1,
			resume: 'Coquille dans la commande de listage'
		},
		{
			n: 7,
			jours: 246,
			date: '10/12/2025',
			heure: '10:17',
			auteur: 'Sophie Nguyen',
			ajout: 31,
			retrait: 7,
			resume: 'Passage à Barman 3.10 : options de recover mises à jour'
		},
		{
			n: 6,
			jours: 289,
			date: '28/10/2025',
			heure: '13:03',
			auteur: 'Karim Belhadj',
			ajout: 9,
			retrait: 4,
			resume: "Prérequis d'espace disque chiffrés"
		},
		{
			n: 5,
			jours: 337,
			date: '10/09/2025',
			heure: '09:50',
			auteur: 'Karim Belhadj',
			ajout: 47,
			retrait: 0,
			resume: 'Première rédaction complète de la procédure'
		}
	],
	'n-migration-bases': [
		{
			n: 1,
			jours: 1,
			date: '12/08/2026',
			heure: '09:30',
			auteur: 'Sophie Nguyen',
			ajout: 22,
			retrait: 0,
			resume: 'Création de la note'
		}
	]
};

/** Trois états de la note de démonstration, décrits en blocs. La « clé » d'un
 *  bloc l'identifie d'une version à l'autre : c'est elle qui aligne les blocs
 *  communs en comparaison visuelle (V-16). */
export const CONTENU_VERSIONS: Partial<
	Record<IdentifiantNote, Record<string, readonly BlocDeContenu[]>>
> = {
	'n-restaurer-pg': {
		'11': [
			{
				cle: 'intro',
				type: 'p',
				texte:
					"Cette procédure décrit la restauration d'une base PostgreSQL 16 à partir des sauvegardes gérées par Barman sur bkp-01.prod."
			},
			{ cle: 'h-avant', type: 'h2', texte: 'Avant de commencer' },
			{
				cle: 'prerequis',
				type: 'liste',
				items: [
					'Un accès sudo sur le serveur de sauvegarde bkp-01.prod et sur le serveur cible.',
					'La clé SSH du compte barman déployée vers le serveur cible.'
				]
			},
			{ cle: 'h-choisir', type: 'h2', texte: 'Choisir la sauvegarde' },
			{
				cle: 'code-liste',
				type: 'code',
				langage: 'bash',
				lignes: ['barman list-backup pg-prod-01']
			},
			{ cle: 'h-restaurer', type: 'h2', texte: 'Restaurer' },
			{
				cle: 'code-recover',
				type: 'code',
				langage: 'bash',
				lignes: [
					'barman recover --remote-ssh-command "ssh postgres@pg-prod-01" \\',
					'        pg-prod-01 20260810T020112 /var/lib/postgresql/16/main'
				]
			},
			{ cle: 'h-verifier', type: 'h2', texte: 'Vérifier le résultat' },
			{
				cle: 'controles',
				type: 'taches',
				items: [
					'Le service démarre sans erreur.',
					"Le comptage complet des lignes correspond à l'attendu."
				]
			}
		],
		'13': [
			{
				cle: 'intro',
				type: 'p',
				texte:
					"Cette procédure décrit la restauration d'une base PostgreSQL 16 à partir des sauvegardes gérées par Barman sur bkp-01.prod."
			},
			{ cle: 'h-avant', type: 'h2', texte: 'Avant de commencer' },
			{
				cle: 'prerequis',
				type: 'liste',
				items: [
					'Un accès sudo sur le serveur de sauvegarde bkp-01.prod et sur le serveur cible.',
					'La clé SSH du compte barman déployée vers le serveur cible.',
					"L'espace disque disponible sur la cible : au moins 1,4 fois la taille de la sauvegarde."
				]
			},
			{ cle: 'h-choisir', type: 'h2', texte: 'Choisir la sauvegarde' },
			{
				cle: 'code-liste',
				type: 'code',
				langage: 'bash',
				lignes: ['barman list-backup pg-prod-01', 'barman show-backup pg-prod-01 20260810T020112']
			},
			{ cle: 'h-restaurer', type: 'h2', texte: 'Restaurer' },
			{
				cle: 'schema',
				type: 'figure',
				legende: 'Enchaînement de la restauration et point de non-retour.'
			},
			{
				cle: 'code-recover',
				type: 'code',
				langage: 'bash',
				lignes: [
					'barman recover --remote-ssh-command "ssh postgres@pg-prod-01" \\',
					'        pg-prod-01 20260810T020112 /var/lib/postgresql/16/main'
				]
			},
			{ cle: 'h-instant', type: 'h3', texte: 'Restauration à un instant donné' },
			{
				cle: 'code-sql',
				type: 'code',
				langage: 'sql',
				lignes: [
					'SELECT max(commit_ts) FROM audit.journal',
					"WHERE table_cible = 'facturation.lignes';"
				]
			},
			{
				cle: 'danger',
				type: 'alerte',
				niveau: 'danger',
				titre: 'Opération destructive et irréversible',
				texte: 'barman recover écrase intégralement le répertoire de données de la cible.'
			},
			{ cle: 'h-verifier', type: 'h2', texte: 'Vérifier le résultat' },
			{
				cle: 'controles',
				type: 'taches',
				items: [
					'Le service démarre sans erreur dans le journal système.',
					'La requête témoin renvoie le nombre de lignes attendu.',
					'La réplication vers pg-prod-02 est repartie.'
				]
			}
		],
		'14': [
			{
				cle: 'intro',
				type: 'p',
				texte:
					"Cette procédure décrit la restauration d'une base PostgreSQL 16 à partir des sauvegardes gérées par Barman sur bkp-01.prod. Elle couvre la restauration complète et la restauration à un instant donné."
			},
			{ cle: 'h-avant', type: 'h2', texte: 'Avant de commencer' },
			{
				cle: 'prerequis',
				type: 'liste',
				items: [
					'Un accès sudo sur le serveur de sauvegarde bkp-01.prod et sur le serveur cible.',
					'La clé SSH du compte barman déployée vers le serveur cible.',
					"L'espace disque disponible sur la cible : au moins 1,4 fois la taille de la sauvegarde."
				]
			},
			{
				cle: 'fenetre',
				type: 'alerte',
				niveau: 'attention',
				titre: 'La base cible est arrêtée pendant toute la restauration',
				texte:
					"Comptez 40 minutes pour une base de 120 Go sur disque local. Prévenez l'astreinte applicative avant de démarrer."
			},
			{ cle: 'h-choisir', type: 'h2', texte: 'Choisir la sauvegarde' },
			{
				cle: 'code-liste',
				type: 'code',
				langage: 'bash',
				lignes: ['barman list-backup pg-prod-01', 'barman show-backup pg-prod-01 20260810T020112']
			},
			{
				cle: 'tableau',
				type: 'tableau',
				entetes: ['Identifiant', 'Date', 'Taille'],
				lignes: [
					['20260810T020112', '10 août 2026', '118 Go'],
					['20260803T020108', '3 août 2026', '117 Go']
				]
			},
			{ cle: 'h-restaurer', type: 'h2', texte: 'Restaurer' },
			{
				cle: 'schema',
				type: 'figure',
				legende: 'Enchaînement de la restauration et point de non-retour.'
			},
			{
				cle: 'code-recover',
				type: 'code',
				langage: 'bash',
				lignes: [
					'barman recover --remote-ssh-command "ssh postgres@pg-prod-01" \\',
					'        pg-prod-01 20260810T020112 /var/lib/postgresql/16/main'
				]
			},
			{ cle: 'h-instant', type: 'h3', texte: 'Restauration à un instant donné' },
			{
				cle: 'code-sql',
				type: 'code',
				langage: 'sql',
				lignes: [
					'SELECT max(commit_ts) FROM audit.journal',
					"WHERE table_cible = 'facturation.lignes'",
					"  AND commit_ts < '2026-08-11 14:20:00';"
				]
			},
			{
				cle: 'danger',
				type: 'alerte',
				niveau: 'danger',
				titre: 'Opération destructive et irréversible',
				texte:
					'barman recover écrase intégralement le répertoire de données de la cible. Vérifiez trois fois le nom du serveur avant de valider.'
			},
			{ cle: 'h-verifier', type: 'h2', texte: 'Vérifier le résultat' },
			{
				cle: 'controles',
				type: 'taches',
				items: [
					'Le service démarre sans erreur dans le journal système.',
					'La requête témoin renvoie le nombre de lignes attendu.',
					'La réplication vers pg-prod-02 est repartie.',
					'La sonde de supervision est repassée au vert.'
				]
			}
		]
	}
};

/* ── Référentiels ────────────────────────────────────────────────────────── */
export const TEMPLATES: readonly Template[] = [
	{
		id: 'procedure',
		utilisations: 34,
		defaut: true,
		nom: "Procédure d'intervention",
		type: 'Procédure',
		description: 'Prérequis, étapes numérotées, contrôles de sortie. Le format le plus utilisé.',
		structure: ['Avant de commencer', 'Étapes', 'Vérifier le résultat', "En cas d'échec"],
		contenu:
			'<h2>Avant de commencer</h2><ul><li>Prérequis…</li></ul><h2>Étapes</h2><ol><li>Première étape…</li></ol><h2>Vérifier le résultat</h2><ul class="taches"><li><input type="checkbox"><span>Contrôle…</span></li></ul><h2>En cas d\'échec</h2><p>Qui appeler, quoi regarder.</p>'
	},
	{
		id: 'fiche-appli',
		utilisations: 12,
		defaut: false,
		nom: 'Fiche applicative',
		type: 'Fiche',
		description: "Identité de l'application, contacts, dépendances, exploitation courante.",
		structure: ['Rôle', 'Contacts', 'Dépendances', 'Exploitation'],
		contenu:
			'<h2>Rôle</h2><p>À quoi sert cette application, pour qui.</p><h2>Contacts</h2><ul><li>Référent métier…</li></ul><h2>Dépendances</h2><ul><li>Serveur…</li></ul><h2>Exploitation</h2><p>Sauvegarde, supervision, redémarrage.</p>'
	},
	{
		id: 'retour',
		utilisations: 7,
		defaut: false,
		nom: "Retour d'incident",
		type: 'Note',
		description: "Chronologie, cause, correctif, ce qu'on change pour que ça ne recommence pas.",
		structure: ["Ce qui s'est passé", 'Chronologie', 'Cause', "Ce qu'on change"],
		contenu:
			'<h2>Ce qui s\'est passé</h2><p>En trois lignes.</p><h2>Chronologie</h2><ul><li>hh:mm — …</li></ul><h2>Cause</h2><p>…</p><h2>Ce qu\'on change</h2><ul class="taches"><li><input type="checkbox"><span>Action…</span></li></ul>'
	},
	{
		id: 'guide',
		utilisations: 19,
		defaut: false,
		nom: 'Guide utilisateur',
		type: 'Guide',
		description:
			'Destiné aux collaborateurs hors direction technique. Vocabulaire courant, pas de jargon.',
		structure: ['Ce que ça permet', 'Comment faire', 'Si ça ne marche pas'],
		contenu:
			'<h2>Ce que ça permet</h2><p>…</p><h2>Comment faire</h2><ol><li>…</li></ol><h2>Si ça ne marche pas</h2><p>Vers qui se tourner.</p>'
	}
];

/** Schémas des types de fiche. Choisir un type fait apparaître ces champs. */
export const TYPES_FICHE: Record<TypeDeFiche, readonly ChampDeFiche[]> = {
	Serveur: [
		{ cle: 'hote', nom: "Nom d'hôte", type: 'texte', exemple: 'pg-prod-01' },
		{ cle: 'adresse', nom: 'Adresse IP', type: 'texte', exemple: '10.20.4.11' },
		{
			cle: 'environnement',
			nom: 'Environnement',
			type: 'liste',
			valeurs: ['Production', 'Recette', 'Bascule']
		},
		{
			cle: 'criticite',
			nom: 'Criticité',
			type: 'liste',
			valeurs: ['Vitale', 'Importante', 'Secondaire']
		},
		{ cle: 'sauvegarde', nom: 'Sauvegardé', type: 'interrupteur' }
	],
	Application: [
		{ cle: 'editeur', nom: 'Éditeur', type: 'texte', exemple: 'Interne' },
		{ cle: 'referent', nom: 'Référent métier', type: 'texte', exemple: 'Direction financière' },
		{ cle: 'utilisateurs', nom: 'Utilisateurs', type: 'nombre', exemple: '120' },
		{
			cle: 'criticite',
			nom: 'Criticité',
			type: 'liste',
			valeurs: ['Vitale', 'Importante', 'Secondaire']
		}
	],
	Contact: [
		{ cle: 'organisme', nom: 'Organisme', type: 'texte', exemple: 'Prestataire réseau' },
		{ cle: 'telephone', nom: 'Téléphone', type: 'texte', exemple: '01 23 45 67 89' },
		{ cle: 'astreinte', nom: 'Joignable en astreinte', type: 'interrupteur' }
	]
};

export const TYPES_NOTE: readonly TypeDeNote[] = ['Procédure', 'Guide', 'Note', 'Fiche', 'Signet'];

/** Chaque type porte deux libellés, un par sens de lecture — « héberge » d'un
 *  côté, « est hébergé par » de l'autre. */
export const TYPES_RELATION: Record<CleDeTypeDeRelation, LibellesDeRelation> = {
	heberge: { sortant: 'héberge', entrant: 'est hébergé par' },
	depend: { sortant: 'dépend de', entrant: 'dont dépendent' },
	replique: { sortant: 'réplique', entrant: 'est répliqué par' },
	sauvegarde: { sortant: 'sauvegarde', entrant: 'est sauvegardé par' },
	documente: { sortant: 'documente', entrant: 'est documenté par' },
	contact: { sortant: 'a pour contact', entrant: 'est contact de' }
};

/** Liens qualifiés et dirigés entre notes. La cartographie (V-19, V-20) n'a
 *  aucune donnée propre : elle est dérivée de ce tableau et du corpus. */
export const RELATIONS: readonly Relation[] = [
	{ de: 'n-srv-app-01', vers: 'n-facturation', type: 'heberge' },
	{ de: 'n-srv-app-01', vers: 'n-referentiel', type: 'heberge' },
	{ de: 'n-srv-app-01', vers: 'n-portail-rh', type: 'heberge' },
	{ de: 'n-facturation', vers: 'n-pg-prod-01', type: 'depend' },
	{ de: 'n-referentiel', vers: 'n-pg-prod-01', type: 'depend' },
	{ de: 'n-portail-rh', vers: 'n-pg-prod-02', type: 'depend' },
	{ de: 'n-facturation', vers: 'n-referentiel', type: 'depend' },
	{ de: 'n-pg-prod-01', vers: 'n-pg-prod-02', type: 'replique' },
	{ de: 'n-bkp-01', vers: 'n-pg-prod-01', type: 'sauvegarde' },
	{ de: 'n-bkp-01', vers: 'n-pg-prod-02', type: 'sauvegarde' },
	{ de: 'n-bkp-01', vers: 'n-srv-app-01', type: 'sauvegarde' },
	{ de: 'n-restaurer-pg', vers: 'n-pg-prod-01', type: 'documente' },
	{ de: 'n-restaurer-pg', vers: 'n-pg-prod-02', type: 'documente' },
	{ de: 'n-planifier-sauv', vers: 'n-bkp-01', type: 'documente' },
	{ de: 'n-diag-barman', vers: 'n-bkp-01', type: 'documente' },
	{ de: 'n-pra-bases', vers: 'n-pg-prod-01', type: 'documente' },
	{ de: 'n-sondes', vers: 'n-pg-prod-02', type: 'documente' },
	{ de: 'n-srv-app-01', vers: 'n-presta-reseau', type: 'contact' },
	{ de: 'n-astreinte', vers: 'n-presta-reseau', type: 'documente' },
	{ de: 'n-bkp-01', vers: 'n-coffre-hors-site', type: 'sauvegarde' },
	{ de: 'n-srv-app-01', vers: 'n-passerelle-edi', type: 'heberge' },
	{ de: 'n-passerelle-edi', vers: 'n-facturation', type: 'depend' }
];

/** Relations qui portent une dépendance technique. Une note qui en documente
 *  une autre n'en dépend pas. */
export const RELATIONS_TECHNIQUES: readonly CleDeTypeDeRelation[] = [
	'heberge',
	'depend',
	'replique',
	'sauvegarde'
];

/* ── Import ──────────────────────────────────────────────────────────────── */
/** Lot de reprise d'un partage réseau. Le sort de chaque fichier est décidé
 *  ici : l'aperçu (V-24, étape 3) et le rapport (étape 4) en sont dérivés. */
export const LOT_IMPORT: LotDImport = {
	source: 'Partage réseau — \\\\srv-fic-01\\Technique\\Exploitation',
	fichiers: [
		{ c: 'Exploitation/Sauvegardes/Restauration PostgreSQL.docx', f: 'docx', o: 184, s: 'note' },
		{ c: 'Exploitation/Sauvegardes/Restauration MariaDB.docx', f: 'docx', o: 96, s: 'note' },
		{ c: 'Exploitation/Sauvegardes/Purge des sauvegardes.docx', f: 'docx', o: 61, s: 'note' },
		{
			c: 'Exploitation/Sauvegardes/Matrice serveurs.xlsx',
			f: 'xlsx',
			o: 42,
			s: 'ignore',
			m: "Les tableurs ne sont pas convertis en notes. Déposez-le en pièce jointe d'une note existante."
		},
		{
			c: 'Exploitation/Sauvegardes/ancien/Restauration PostgreSQL.docx',
			f: 'docx',
			o: 152,
			s: 'ignore',
			m: 'Fichier identique à un autre du lot, conservé une seule fois.'
		},
		{ c: 'Exploitation/Astreinte/Consignes de nuit.docx', f: 'docx', o: 128, s: 'note' },
		{ c: 'Exploitation/Astreinte/Numéros utiles.txt', f: 'txt', o: 3, s: 'note' },
		{ c: 'Exploitation/Astreinte/Rotation 2025.pdf', f: 'pdf', o: 512, s: 'note' },
		{ c: 'Exploitation/Ordonnancement/Chaînes de nuit.docx', f: 'docx', o: 231, s: 'note' },
		{ c: 'Exploitation/Ordonnancement/Calendrier.pdf', f: 'pdf', o: 88, s: 'note' },
		{
			c: 'Exploitation/Ordonnancement/schema-chaines.png',
			f: 'png',
			o: 640,
			s: 'ignore',
			m: 'Image isolée, sans document qui la référence. Elle sera à joindre manuellement.'
		},
		{ c: 'Supervision/Sondes et seuils.docx', f: 'docx', o: 174, s: 'note' },
		{ c: "Supervision/Alertes/Politique d'escalade.md", f: 'md', o: 12, s: 'note' },
		{ c: 'Supervision/Alertes/Modèles de message.md', f: 'md', o: 7, s: 'note' },
		{ c: 'Supervision/Tableau de bord.pptx', f: 'pptx', o: 2048, s: 'note' },
		{ c: "Réseau/Plan d'adressage.docx", f: 'docx', o: 143, s: 'note' },
		{ c: 'Réseau/Configuration coeur.txt', f: 'txt', o: 28, s: 'note' },
		{ c: 'Réseau/VPN/Accès prestataires.docx', f: 'docx', o: 92, s: 'note' },
		{
			c: 'Réseau/VPN/Certificats.pdf',
			f: 'pdf',
			o: 310,
			s: 'echec',
			m: "Le fichier est protégé par un mot de passe : son contenu n'a pas pu être lu."
		},
		{
			c: 'Réseau/VPN/~$cès prestataires.docx',
			f: 'docx',
			o: 1,
			s: 'ignore',
			m: 'Fichier temporaire laissé par le traitement de texte.'
		},
		{ c: 'Serveurs/Inventaire.docx', f: 'docx', o: 205, s: 'note' },
		{ c: 'Serveurs/pg-prod-01.docx', f: 'docx', o: 74, s: 'note' },
		{ c: 'Serveurs/pg-prod-02.docx', f: 'docx', o: 71, s: 'note' },
		{ c: 'Serveurs/srv-app-01.docx', f: 'docx', o: 68, s: 'note' },
		{
			c: 'Serveurs/Anciens/srv-legacy.doc',
			f: 'doc',
			o: 55,
			s: 'echec',
			m: 'Format Word antérieur à 2007, non convertible. Réenregistrez-le en .docx.'
		},
		{ c: 'Serveurs/Anciens/notes.txt', f: 'txt', o: 0, s: 'ignore', m: 'Fichier vide.' },
		{ c: 'Procédures/Bascule PRA.docx', f: 'docx', o: 388, s: 'note' },
		{ c: 'Procédures/Bascule PRA — annexes.pdf', f: 'pdf', o: 1740, s: 'note' },
		{
			c: 'Procédures/Archive 2019.zip',
			f: 'zip',
			o: 8600,
			s: 'ignore',
			m: 'Archive imbriquée : décompressez-la et déposez son contenu séparément.'
		},
		{
			c: 'Procédures/Tests trimestriels.docx',
			f: 'docx',
			o: 119,
			s: 'echec',
			m: "Le fichier semble endommagé : sa structure interne n'a pas pu être ouverte."
		}
	]
};

/**
 * LES FORMATS QUE LA MAQUETTE DESSINE — jeu de démonstration, et elle en dessine
 * NEUF. La table du PRODUIT est `LIBELLE_PAR_FORMAT` (`$lib/donnees/import`), et
 * elle est complète : le produit reconnaît des formats d'image que la maquette
 * n'a jamais montrés. `Partial` dit exactement cela, plutôt que d'obliger ce jeu
 * à inventer des lignes que la référence ne porte pas.
 */
export const FORMATS_IMPORT: Partial<Record<FormatDImport, string>> = {
	docx: 'Traitement de texte',
	doc: 'Traitement de texte (ancien)',
	pptx: 'Présentation',
	pdf: 'PDF',
	md: 'Markdown',
	txt: 'Texte brut',
	xlsx: 'Tableur',
	png: 'Image',
	zip: 'Archive'
};

export const JOURNAL_IMPORTS: readonly EntreeDeJournalDImport[] = [
	{
		id: 'i-2026-08',
		date: '12/08/2026',
		heure: '14:22',
		auteur: 'Marc Ferreira',
		source: 'Partage réseau — Technique\\Exploitation',
		scenario: 'Notes dans un domaine existant',
		domaine: 'Infrastructure',
		fichiers: 30,
		notes: 21,
		ignores: 6,
		echecs: 3,
		duree: '4 min 12 s'
	},
	{
		id: 'i-2026-06',
		date: '18/06/2026',
		heure: '09:05',
		auteur: 'Sophie Nguyen',
		source: 'Archive — fiches-applicatives.zip',
		scenario: 'Corpus préparé',
		domaine: 'Applications',
		fichiers: 14,
		notes: 14,
		ignores: 0,
		echecs: 0,
		duree: '1 min 48 s'
	},
	{
		id: 'i-2026-04',
		date: '02/04/2026',
		heure: '16:40',
		auteur: 'Karim Belhadj',
		source: 'Dossier local — Consignes poste',
		scenario: 'Domaine complet',
		domaine: 'Poste de travail',
		fichiers: 22,
		notes: 17,
		ignores: 4,
		echecs: 1,
		duree: '2 min 31 s'
	},
	{
		id: 'i-2026-01',
		date: '23/01/2026',
		heure: '11:12',
		auteur: 'Sophie Nguyen',
		source: 'Partage réseau — Technique\\Supervision',
		scenario: 'Notes dans un domaine existant',
		domaine: 'Infrastructure',
		fichiers: 9,
		notes: 9,
		ignores: 0,
		echecs: 0,
		duree: '38 s'
	}
];

/* ── Comptes, contributions, configuration, recherches ───────────────────── */
export const COMPTES: readonly Compte[] = [
	{
		id: 'c-karim',
		nom: 'Karim Belhadj',
		identifiant: 'karim.belhadj',
		courriel: 'karim.belhadj@exemple.fr',
		role: 'Référent',
		domaine: 'Infrastructure',
		actif: true,
		arrivee: '12/09/2023',
		derniere: "aujourd'hui à 08:41"
	},
	{
		id: 'c-sophie',
		nom: 'Sophie Nguyen',
		identifiant: 'sophie.nguyen',
		courriel: 'sophie.nguyen@exemple.fr',
		role: 'Administrateur',
		domaine: 'Applications',
		actif: true,
		arrivee: '04/03/2021',
		derniere: 'hier à 17:58'
	},
	{
		id: 'c-marc',
		nom: 'Marc Ferreira',
		identifiant: 'marc.ferreira',
		courriel: 'marc.ferreira@exemple.fr',
		role: 'Contributeur',
		domaine: 'Poste de travail',
		actif: true,
		arrivee: '18/01/2024',
		derniere: 'il y a 3 jours'
	},
	{
		id: 'c-lea',
		nom: 'Léa Marchand',
		identifiant: 'lea.marchand',
		courriel: 'lea.marchand@exemple.fr',
		role: 'Contributeur',
		domaine: 'Poste de travail',
		actif: true,
		arrivee: '02/08/2026',
		derniere: "aujourd'hui à 09:12"
	},
	{
		id: 'c-ancien',
		nom: 'Pierre Dubois',
		identifiant: 'pierre.dubois',
		courriel: 'pierre.dubois@exemple.fr',
		role: 'Lecteur',
		domaine: 'Applications',
		actif: false,
		arrivee: '07/06/2020',
		derniere: 'il y a 8 mois'
	}
];

/** Ce qui est calculable l'est ; le reste — vérifications et liens, dont
 *  l'historique complet n'est pas dans ce corpus — est déclaré ici plutôt que
 *  deviné dans la vue. */
export const CONTRIBUTIONS: Record<NomDAuteur, Contribution> = {
	'Karim Belhadj': {
		verifiees: 14,
		liens: 63,
		arrivee: '12/09/2023',
		derniereConnexion: "aujourd'hui à 08:41"
	},
	'Sophie Nguyen': {
		verifiees: 22,
		liens: 91,
		arrivee: '04/03/2021',
		derniereConnexion: 'hier à 17:58'
	},
	'Marc Ferreira': {
		verifiees: 6,
		liens: 28,
		arrivee: '18/01/2024',
		derniereConnexion: 'il y a 3 jours'
	}
};

/** Les six distinctions. Individuelles et privées : aucun classement entre
 *  utilisateurs n'existe, ni ici ni ailleurs dans le produit. */
export const DISTINCTIONS: readonly Distinction[] = [
	{
		id: 'premier',
		nom: 'Premier pas',
		critere: 'Première note publiée',
		seuil: 1,
		mesure: 'publiees',
		quoi: 'note publiée'
	},
	{
		id: 'veilleur',
		nom: 'Veilleur',
		critere: '10 notes vérifiées',
		seuil: 10,
		mesure: 'verifiees',
		quoi: 'notes vérifiées'
	},
	{
		id: 'redacteur',
		nom: 'Rédacteur',
		critere: '25 notes publiées',
		seuil: 25,
		mesure: 'publiees',
		quoi: 'notes publiées'
	},
	{
		id: 'biblio',
		nom: 'Bibliothécaire',
		critere: '50 notes publiées',
		seuil: 50,
		mesure: 'publiees',
		quoi: 'notes publiées'
	},
	{
		id: 'tisseur',
		nom: 'Tisseur',
		critere: '100 liens internes créés',
		seuil: 100,
		mesure: 'liens',
		quoi: 'liens créés'
	},
	{
		id: 'referent',
		nom: 'Référent',
		critere: 'Une note citée par 20 autres',
		seuil: 20,
		mesure: 'citations',
		quoi: 'citations sur une même note'
	}
];

/** Les seuils de fraîcheur ne sont pas décoratifs : c'est d'eux que dépend le
 *  niveau affiché par le témoin sur chaque note. Le corpus leur est cohérent.
 *
 *  ILS NE SONT PAS ÉCRITS ICI, ET LE SENS DE LA DÉRIVATION EST DÉLIBÉRÉ. Le gel
 *  porte `window.CONFIG.seuilFrais = 90` et `seuilVieillissant = 180` sur ses
 *  treize maquettes ; `src/lib/fraicheur.ts` en fait `SEUILS_PAR_DEFAUT`, et
 *  c'est LUI la définition — ADR-005 : « les seuils sont des paramètres de
 *  cette implémentation, jamais des constantes locales », et toute duplication
 *  littérale est interdite « ailleurs que dans la configuration lue par
 *  l'implémentation unique ». `CONFIG` est la configuration de l'INSTANCE de
 *  démonstration : à seuils non touchés, elle vaut les valeurs par défaut du
 *  produit. Elle les LIT, elle ne les redit pas.
 *
 *  Les valeurs rendues sont inchangées : 90 et 180, comme aux treize maquettes.
 *  Les cinq autres réglages restent des données de gel, sans équivalent
 *  applicatif à quoi les rattacher. */
export const CONFIG: Configuration = {
	seuilFrais: SEUILS_PAR_DEFAUT.frais,
	seuilVieillissant: SEUILS_PAR_DEFAUT.vieillissant,
	versionsMax: 50,
	portailAssistance: 'https://assistance.exemple.fr/nouveau-ticket',
	/* L'INSTANCE DE DÉMONSTRATION NE SE NOMME PAS, ET C'EST DÉLIBÉRÉ. Le nom de
	   l'organisation n'est pas une donnée du jeu : c'est un réglage d'instance,
	   dont le défaut du produit est la chaîne vide (`schema.ts`). Y écrire
	   « Direction technique » remettrait dans le jeu la chaîne même que ce lot
	   sort des vues, et `semence.ts` n'a donc aucune ligne à poser pour elle. */
	nomOrganisation: '',
	motFiche: 'Fiche',
	tailleMaxPieceJointe: 25,
	dureeSession: 120,
	/* L'INSTANCE DE DÉMONSTRATION EST DISPONIBLE. `RG-NF-10` est un geste
	   d'exploitation, jamais un état du jeu : une semence qui l'activerait
	   fermerait l'instance à tout le monde sauf à l'administrateur. */
	indisponibiliteActive: false,
	messageDIndisponibilite: ''
};

/** Requêtes des trente derniers jours. « ouvertures » compte les recherches
 *  suivies de l'ouverture d'un résultat : de là sort le taux de recherche
 *  aboutie, l'indicateur nord du produit. */
export const RECHERCHES: readonly RequeteDeRecherche[] = [
	{ terme: 'mot de passe', n: 214, resultats: 3, ouvertures: 198, evolution: 12 },
	{ terme: 'restauration base', n: 96, resultats: 12, ouvertures: 81, evolution: 4 },
	{ terme: 'bascule voip', n: 74, resultats: 0, ouvertures: 0, evolution: 41 },
	{ terme: 'astreinte week-end', n: 63, resultats: 2, ouvertures: 58, evolution: -6 },
	{ terme: 'certificat ssl renouvellement', n: 52, resultats: 0, ouvertures: 0, evolution: 28 },
	{ terme: 'imprimante réseau', n: 47, resultats: 0, ouvertures: 0, evolution: 9 },
	{ terme: 'barman recover', n: 44, resultats: 6, ouvertures: 39, evolution: 3 },
	{ terme: 'onduleur salle serveur', n: 38, resultats: 1, ouvertures: 0, evolution: 15 },
	{ terme: 'vpn prestataire', n: 35, resultats: 2, ouvertures: 31, evolution: -2 },
	{ terme: 'supervision seuils', n: 31, resultats: 3, ouvertures: 24, evolution: 7 },
	{ terme: 'commande poste portable', n: 29, resultats: 0, ouvertures: 0, evolution: 22 },
	{ terme: 'sauvegarde postgresql', n: 27, resultats: 9, ouvertures: 25, evolution: 1 },
	{ terme: 'téléphonie standard', n: 24, resultats: 0, ouvertures: 0, evolution: 18 },
	{ terme: 'réplication retard', n: 19, resultats: 4, ouvertures: 14, evolution: -4 }
];

/** Les identifiants portés par chaque variante, dans l'ordre des maquettes.
 *  Extrait mécaniquement du bloc `window.CORPUS` de chaque vue. */
export const IDS_PAR_VARIANTE: Record<Variante, readonly IdentifiantNote[]> = {
	complete: [
		'n-restaurer-pg',
		'n-restaurer-maria',
		'n-pra-bases',
		'n-diag-barman',
		'n-pg-prod-01',
		'n-tester-pra',
		'n-astreinte',
		'n-doc-barman',
		'n-purge-sauv',
		'n-planifier-sauv',
		'n-facturation',
		'n-sondes',
		'n-migration-bases',
		'n-poste-sauv',
		'n-mot-de-passe',
		'n-demander-acces',
		'n-visio',
		'n-reseau-invite',
		'n-signaler-incident',
		'n-pg-prod-02',
		'n-bkp-01',
		'n-srv-app-01',
		'n-referentiel',
		'n-portail-rh',
		'n-presta-reseau',
		'n-coffre-hors-site',
		'n-passerelle-edi',
		'n-sig-postgres',
		'n-sig-anssi',
		'n-sig-statut',
		'n-sig-neltis',
		'n-sig-facturation'
	],
	cartographie: [
		'n-restaurer-pg',
		'n-restaurer-maria',
		'n-pra-bases',
		'n-diag-barman',
		'n-pg-prod-01',
		'n-tester-pra',
		'n-astreinte',
		'n-doc-barman',
		'n-purge-sauv',
		'n-planifier-sauv',
		'n-facturation',
		'n-sondes',
		'n-migration-bases',
		'n-poste-sauv',
		'n-mot-de-passe',
		'n-demander-acces',
		'n-visio',
		'n-reseau-invite',
		'n-signaler-incident',
		'n-pg-prod-02',
		'n-bkp-01',
		'n-srv-app-01',
		'n-referentiel',
		'n-portail-rh',
		'n-presta-reseau',
		'n-coffre-hors-site',
		'n-passerelle-edi'
	],
	lecture: [
		'n-restaurer-pg',
		'n-restaurer-maria',
		'n-pra-bases',
		'n-diag-barman',
		'n-pg-prod-01',
		'n-tester-pra',
		'n-astreinte',
		'n-doc-barman',
		'n-purge-sauv',
		'n-planifier-sauv',
		'n-facturation',
		'n-sondes',
		'n-migration-bases',
		'n-poste-sauv',
		'n-mot-de-passe',
		'n-demander-acces',
		'n-visio',
		'n-reseau-invite',
		'n-signaler-incident'
	],
	palette: [
		'n-restaurer-pg',
		'n-restaurer-maria',
		'n-pra-bases',
		'n-diag-barman',
		'n-pg-prod-01',
		'n-tester-pra',
		'n-astreinte',
		'n-doc-barman',
		'n-purge-sauv',
		'n-planifier-sauv',
		'n-facturation',
		'n-sondes',
		'n-migration-bases',
		'n-poste-sauv'
	],
	vide: []
};

/** Quelle vue est nourrie par quelle variante. */
export const VUES_PAR_VARIANTE: Record<Variante, readonly IdentifiantDeVue[]> = {
	complete: [
		'V-04',
		'V-07',
		'V-14',
		'V-20',
		'V-22',
		'V-23',
		'V-24',
		'V-25',
		'V-26',
		'V-27',
		'V-28',
		'V-29',
		'V-30',
		'V-31',
		'V-32',
		'V-33',
		'V-34',
		'V-35',
		'V-36',
		'V-37',
		'V-38',
		'V-39',
		'V-40',
		'V-41'
	],
	cartographie: ['V-19', 'V-21'],
	lecture: [
		'V-01',
		'V-02',
		'V-03',
		'V-08',
		'V-10',
		'V-11',
		'V-12',
		'V-13',
		'V-15',
		'V-16',
		'V-17',
		'V-18'
	],
	palette: ['V-09'],
	vide: ['V-05', 'V-06']
};

/** Table inverse : la variante attendue par chaque vue. */
export const VARIANTE_PAR_VUE: Record<IdentifiantDeVue, Variante> = {
	'V-04': 'complete',
	'V-07': 'complete',
	'V-14': 'complete',
	'V-20': 'complete',
	'V-22': 'complete',
	'V-23': 'complete',
	'V-24': 'complete',
	'V-25': 'complete',
	'V-26': 'complete',
	'V-27': 'complete',
	'V-28': 'complete',
	'V-29': 'complete',
	'V-30': 'complete',
	'V-31': 'complete',
	'V-32': 'complete',
	'V-33': 'complete',
	'V-34': 'complete',
	'V-35': 'complete',
	'V-36': 'complete',
	'V-37': 'complete',
	'V-38': 'complete',
	'V-39': 'complete',
	'V-40': 'complete',
	'V-41': 'complete',
	'V-19': 'cartographie',
	'V-21': 'cartographie',
	'V-01': 'lecture',
	'V-02': 'lecture',
	'V-03': 'lecture',
	'V-08': 'lecture',
	'V-10': 'lecture',
	'V-11': 'lecture',
	'V-12': 'lecture',
	'V-13': 'lecture',
	'V-15': 'lecture',
	'V-16': 'lecture',
	'V-17': 'lecture',
	'V-18': 'lecture',
	'V-09': 'palette',
	'V-05': 'vide',
	'V-06': 'vide'
};

/* ── Sélecteurs ────────────────────────────────────────────────────────────
   Nourrir chaque vue exactement du sous-ensemble que sa maquette utilise est
   la condition de la comparaison visuelle : mêmes données des deux côtés. */

const INDEX_DES_NOTES: ReadonlyMap<string, Note> = new Map(CORPUS.map((n) => [n.id, n]));

/** La note portant cet identifiant. `undefined` si l'identifiant est inconnu —
 *  aucune note de remplacement n'est fabriquée. */
export function noteParIdentifiant(id: IdentifiantNote): Note | undefined {
	return INDEX_DES_NOTES.get(id);
}

/** Les notes d'une variante, dans l'ordre où sa maquette les porte. */
export function corpusDeVariante(variante: Variante): readonly Note[] {
	return IDS_PAR_VARIANTE[variante].map((id) => {
		const note = INDEX_DES_NOTES.get(id);
		if (!note) throw new Error(`Identifiant absent du corpus : ${id}`);
		return note;
	});
}

/** Le jeu de semence exact de la maquette d'une vue.
 *  Exemple : `corpusPourVue("V-09")` rend les quatorze notes de la palette. */
export function corpusPourVue(vue: IdentifiantDeVue): readonly Note[] {
	return corpusDeVariante(VARIANTE_PAR_VUE[vue]);
}

/** Restreint une table indexée par identifiant de note au jeu passé. */
export function restreindreTable<T>(
	table: Partial<Record<IdentifiantNote, T>>,
	notes: readonly Note[]
): Partial<Record<IdentifiantNote, T>> {
	const restreinte: Partial<Record<IdentifiantNote, T>> = {};
	for (const note of notes) {
		const valeur = table[note.id];
		if (valeur !== undefined) restreinte[note.id] = valeur;
	}
	return restreinte;
}

/** Consultations des sept derniers jours, restreintes au jeu de la vue. */
export function mesures7jPourVue(vue: IdentifiantDeVue): Partial<Record<IdentifiantNote, number>> {
	return restreindreTable(MESURES_7J, corpusPourVue(vue));
}

/** Consultations des sept jours précédents, restreintes au jeu de la vue. */
export function mesures7jPrecedentesPourVue(
	vue: IdentifiantDeVue
): Partial<Record<IdentifiantNote, number>> {
	return restreindreTable(MESURES_7J_PREC, corpusPourVue(vue));
}

/** Anciennetés de modification, restreintes au jeu de la vue. */
export function modificationsPourVue(
	vue: IdentifiantDeVue
): Partial<Record<IdentifiantNote, number>> {
	return restreindreTable(MODIFICATIONS, corpusPourVue(vue));
}

/** Les vues qui appliquent en plus, à leur point d'entrée, la restriction au
 *  périmètre public — aucune note interne ne peut y être atteinte, par aucun
 *  chemin. La restriction n'est pas une donnée du corpus mais une contrainte de
 *  la vue : elle est déclarée ici parce que les maquettes la posent au même
 *  endroit (`window.CORPUS = window.corpusPublic()`). */
export const VUES_A_PERIMETRE_PUBLIC: readonly IdentifiantDeVue[] = [
	'V-01',
	'V-02',
	'V-03',
	'V-04'
];

/** Les seules notes atteignables depuis l'espace public. */
export function notesPubliques(notes: readonly Note[] = CORPUS): readonly Note[] {
	return notes.filter((n) => n.visibilite === 'Publique');
}

/** Une note qui porte un type de fiche est une fiche (RG-NOT-01). */
export function estFiche(note: Note): boolean {
	return note.typeFiche !== undefined;
}

/** Un signet est une note de type « Signet » ; elle porte alors son adresse. */
export function estSignet(note: Note): boolean {
	return note.type === 'Signet';
}

/* ── Écarts relevés entre variantes ────────────────────────────────────────
   La réconciliation des quarante et une maquettes a fait apparaître deux
   divergences de valeur sur un même identifiant. Le jeu complet (V-14) fait
   foi, et c'est lui qui est retenu ci-dessus. Ces écarts sont déclarés ici
   parce que `corpus.test.ts` les vérifie explicitement : ils ne doivent ni
   disparaître en silence ni s'étendre.

   1. `n-doc-barman.url` — les variantes 27, 19 et 14 portent l'hôte nu
      « docs.pgbarman.org » ; le jeu complet porte l'adresse entière
      « https://docs.pgbarman.org/release/3.11/ » et ajoute `ajoute`. La forme
      complète est retenue : c'est la seule qui permet de dériver l'hôte, et non
      l'inverse.

   2. `n-doc-barman.visibilite` — V-09 (palette) donne « Publique » ; les
      trente-huit autres vues qui portent cette note donnent « Interne ». Écart
      de première importance : une note interne rendue publique dans une vue
      contredit RG-NOT-04 et le périmètre public. La valeur « Interne » est
      retenue. À arbitrer avec le mainteneur des maquettes. */
