/**
 * L'UNIVERS « ORGANISATION » — le jeu de semence qui montre que le produit ne
 * connaît aucun métier.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS DANS `seeds/corpus.ts`
 *
 * `seeds/corpus.ts` n'est pas un jeu de démonstration libre : c'est la
 * TRANSCRIPTION des maquettes gelées, et `seeds/corpus.test.ts` le prouve en
 * relisant `mockups/` pour comparer valeur par valeur. C'est cet invariant qui
 * garantit qu'une vue sans propriété rend exactement ce que sa maquette montre.
 * Y ajouter une note, c'est casser le gel — mesuré : 39 tests tombent.
 *
 * Or le corpus du gel est ENTIÈREMENT INFORMATIQUE — trente-deux notes de
 * sauvegardes, de serveurs et de bases —, ce qui donne du produit une idée
 * fausse. Les types de fiche et les types de relation se CRÉENT DANS LA
 * CONSOLE : rien dans le produit ne parle d'informatique. Le jeu de semence,
 * lui, le laissait croire.
 *
 * Ce fichier est donc la seconde couche : elle ne touche ni les maquettes, ni
 * `corpus.ts`, ni le rendu par défaut des vues. Elle n'entre QUE dans la base,
 * par `semer()`. Le gel reste le gel ; le produit montre ce qu'il sait faire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE APPORTE
 *
 *   · un univers `Organisation` et trois domaines — Gouvernance, Méthodes et
 *     qualité, Ressources humaines ;
 *   · deux types de fiche qui ne nomment aucune technologie — `Processus` et
 *     `Prestataire` — avec leurs champs, pour montrer qu'un type se définit ;
 *   · deux types de relation de même nature — « est validé par », « s'appuie
 *     sur » ;
 *   · quatorze notes portant la même mécanique que les autres : fraîcheur aux
 *     trois niveaux, deux registres, brouillon, visibilité publique, pièces
 *     jointes, étiquettes ;
 *   · douze relations, dont DEUX QUI FRANCHISSENT la frontière des univers —
 *     c'est le point : le graphe ne s'arrête pas au périmètre d'un métier.
 *
 * Les dates sont dérivées de `DATE_REFERENCE`, comme celles du corpus : les
 * deux jeux vieillissent ensemble, et aucune fraîcheur ne diverge de l'autre.
 */
import { analyserDocument } from '../contenu/document';
import { instantAvantReference } from './semence';
import type {
	LigneDeChamp,
	LigneDeDomaine,
	LigneDeDossier,
	LigneDeNote,
	LigneDeRelation,
	LigneDeReferentiel,
	LigneDeTypeDeRelation,
	LigneDUnivers
} from './semence';

/** Le corps Référence dérivé du seul texte porté ici : l'extrait. Même
 *  construction que `corpsDepuisTexte()` du corpus — un document VALIDÉ avant
 *  écriture, `ADR-003`. */
function corps(texte: string): LigneDeNote['corpsReference'] {
	return analyserDocument({
		type: 'doc',
		content: [{ type: 'paragraph', content: [{ type: 'text', text: texte }] }]
	});
}

function corpsVide(): LigneDeNote['corpsReference'] {
	return analyserDocument({ type: 'doc', content: [{ type: 'paragraph' }] });
}

/* ═══════════════════════════════════ La structure ═══════════════════════ */

export function universDOrganisation(): readonly LigneDUnivers[] {
	return [
		{
			identifiant: 'organisation',
			nom: 'Organisation',
			description:
				"Ce qui vaut quel que soit le métier : les règles qu'on se donne, la façon dont on travaille, et ce qui fait tourner le service. Rien ici ne dépend d'une technologie.",
			couleur: '#1d5c4a',
			glyphe: 'pile',
			ordre: 2,
			systeme: false
		}
	];
}

export function domainesDOrganisation(): readonly LigneDeDomaine[] {
	return [
		{
			universNom: 'Organisation',
			identifiant: 'gouvernance',
			nom: 'Gouvernance',
			description:
				"Les règles que le service se donne et celles qu'il subit : politiques, engagements, délégations. Ce qui s'oppose à quelqu'un doit être daté et vérifié.",
			couleur: '#8a5a1e',
			modules: ['notes', 'dossiers', 'fiches', 'signets']
		},
		{
			universNom: 'Organisation',
			identifiant: 'methodes',
			nom: 'Méthodes et qualité',
			description:
				"Comment on travaille, et comment on sait que c'est bien fait. Conventions, modèles, revues, contrôles.",
			couleur: '#2f6b58',
			modules: ['notes', 'dossiers', 'fiches', 'cartographie', 'carte_mentale']
		},
		{
			universNom: 'Organisation',
			identifiant: 'ressources-humaines',
			nom: 'Ressources humaines',
			description:
				"Ce qu'un agent doit pouvoir trouver seul, sans demander : arrivée, absences, frais, matériel.",
			couleur: '#6b3a5c',
			modules: ['notes', 'dossiers']
		}
	];
}

/** Les dossiers, racine comprise. `semer()` les pose du moins profond au plus
 *  profond : le parent doit exister quand l'enfant arrive. */
export function dossiersDOrganisation(): readonly LigneDeDossier[] {
	const arbre: readonly (readonly [string, readonly string[]])[] = [
		['Gouvernance', ['Gouvernance']],
		['Gouvernance', ['Gouvernance', 'Politiques']],
		['Gouvernance', ['Gouvernance', 'Politiques', 'Données personnelles']],
		['Gouvernance', ['Gouvernance', 'Instances']],
		['Gouvernance', ['Gouvernance', 'Achats']],
		['Gouvernance', ['Gouvernance', 'Achats', 'Prestataires']],
		['Méthodes et qualité', ['Méthodes et qualité']],
		['Méthodes et qualité', ['Méthodes et qualité', 'Rédaction']],
		['Méthodes et qualité', ['Méthodes et qualité', 'Projet']],
		['Ressources humaines', ['Ressources humaines']],
		['Ressources humaines', ['Ressources humaines', 'Arrivée et départ']],
		['Ressources humaines', ['Ressources humaines', 'Déplacements']],
		['Ressources humaines', ['Ressources humaines', 'Moyens']],
		['Ressources humaines', ['Ressources humaines', 'Organisation du travail']]
	];
	const rang = new Map<string, number>();
	return arbre.map(([domaineNom, chemin]) => {
		const cleDuParent = `${domaineNom}\0${chemin.slice(0, -1).join('\0')}`;
		const position = rang.get(cleDuParent) ?? 0;
		rang.set(cleDuParent, position + 1);
		return {
			domaineNom,
			chemin,
			nom: chemin[chemin.length - 1] ?? domaineNom,
			profondeur: chemin.length,
			position
		};
	});
}

/* ═══════════════════════════════════ Le référentiel ═════════════════════ */

/**
 * DEUX TYPES DE FICHE QUI NE NOMMENT AUCUNE TECHNOLOGIE. Leur ordre reprend
 * après les trois du corpus (Serveur, Application, Contact).
 */
export function typesDeFicheDOrganisation(): readonly LigneDeReferentiel[] {
	return [
		{ identifiant: 'processus', nom: 'Processus', ordre: 4 },
		{ identifiant: 'prestataire', nom: 'Prestataire', ordre: 5 }
	];
}

export function champsDOrganisation(): readonly LigneDeChamp[] {
	return [
		{
			typeDeFicheNom: 'Processus',
			cle: 'proprietaire',
			nom: 'Propriétaire',
			type: 'texte',
			ordre: 1,
			exemple: 'Direction des services',
			valeurs: null
		},
		{
			typeDeFicheNom: 'Processus',
			cle: 'periodicite',
			nom: 'Périodicité',
			type: 'liste',
			ordre: 2,
			exemple: null,
			valeurs: ['Continu', 'Mensuel', 'Trimestriel', 'Annuel']
		},
		{
			typeDeFicheNom: 'Processus',
			cle: 'criticite',
			nom: 'Criticité',
			type: 'liste',
			ordre: 3,
			exemple: null,
			valeurs: ['Vitale', 'Importante', 'Secondaire']
		},
		{
			typeDeFicheNom: 'Processus',
			cle: 'opposable',
			nom: 'Opposable à un tiers',
			type: 'booleen',
			ordre: 4,
			exemple: null,
			valeurs: null
		},
		{
			typeDeFicheNom: 'Prestataire',
			cle: 'raison',
			nom: 'Raison sociale',
			type: 'texte',
			ordre: 1,
			exemple: 'Atelier Beaumont',
			valeurs: null
		},
		{
			typeDeFicheNom: 'Prestataire',
			cle: 'contrat',
			nom: 'Référence du contrat',
			type: 'texte',
			ordre: 2,
			exemple: 'CT-2024-118',
			valeurs: null
		},
		{
			typeDeFicheNom: 'Prestataire',
			cle: 'interlocuteur',
			nom: 'Interlocuteur',
			type: 'texte',
			ordre: 3,
			exemple: 'Claire Fontaine',
			valeurs: null
		},
		{
			typeDeFicheNom: 'Prestataire',
			cle: 'perimetre',
			nom: 'Périmètre',
			type: 'liste',
			ordre: 4,
			exemple: null,
			valeurs: ['Prestation intellectuelle', 'Fourniture', 'Maintenance', 'Formation']
		},
		{
			typeDeFicheNom: 'Prestataire',
			cle: 'reconduction',
			nom: 'Reconduction tacite',
			type: 'booleen',
			ordre: 5,
			exemple: null,
			valeurs: null
		}
	];
}

export function typesDeRelationDOrganisation(): readonly LigneDeTypeDeRelation[] {
	return [
		{
			identifiant: 'valide',
			libelleSortant: 'est validé par',
			libelleEntrant: 'valide',
			technique: false,
			ordre: 7
		},
		{
			identifiant: 'appuie',
			libelleSortant: "s'appuie sur",
			libelleEntrant: 'sert de socle à',
			technique: false,
			ordre: 8
		}
	];
}

/* ═══════════════════════════════════ Les notes ══════════════════════════ */

interface Graine {
	readonly id: string;
	readonly titre: string;
	readonly extrait: string;
	readonly type: string;
	readonly typeFiche?: string;
	readonly domaine: string;
	readonly dossier: readonly string[];
	readonly auteur: string;
	/** Jours écoulés depuis la dernière vérification, à la date de référence. */
	readonly jours: number;
	/** Jours écoulés depuis la dernière modification. */
	readonly modifie: number;
	readonly vues: number;
	readonly brouillon?: boolean;
	readonly publique?: boolean;
	readonly operationnel?: boolean;
	readonly etiquettes: readonly string[];
}

const GRAINES: readonly Graine[] = [
	{
		id: 'n-politique-securite',
		titre: "Politique de sécurité de l'information",
		extrait:
			"Le texte de référence : ce qui est protégé, contre quoi, et qui en répond. Il s'oppose à tout agent et à tout prestataire, et se relit chaque année.",
		type: 'Note',
		domaine: 'Gouvernance',
		dossier: ['Gouvernance', 'Politiques'],
		auteur: 'Sophie Nguyen',
		jours: 34,
		modifie: 34,
		vues: 287,
		etiquettes: ['sécurité', 'politique', 'annuel', 'opposable']
	},
	{
		id: 'n-rgpd-registre',
		titre: 'Tenir le registre des traitements',
		extrait:
			'Qui inscrit un traitement, quand, avec quelles mentions. La procédure vaut pour tout service qui collecte une donnée personnelle, y compris hors informatique.',
		type: 'Procédure',
		domaine: 'Gouvernance',
		dossier: ['Gouvernance', 'Politiques', 'Données personnelles'],
		auteur: 'Sophie Nguyen',
		jours: 154,
		modifie: 71,
		vues: 96,
		operationnel: true,
		etiquettes: ['rgpd', 'registre', 'données personnelles', 'conformité']
	},
	{
		id: 'n-delegations',
		titre: 'Délégations de signature en vigueur',
		extrait:
			"Qui engage le service, jusqu'à quel montant, et ce qui se passe en cas d'absence. Une délégation périmée est une décision annulable : cette note est vérifiée à chaque mouvement.",
		type: 'Note',
		domaine: 'Gouvernance',
		dossier: ['Gouvernance', 'Instances'],
		auteur: 'Sophie Nguyen',
		jours: 9,
		modifie: 9,
		vues: 203,
		etiquettes: ['délégation', 'signature', 'opposable']
	},
	{
		id: 'n-comite-si',
		titre: 'Comité de pilotage — composition et cadence',
		extrait:
			"Qui siège, à quelle fréquence, ce qui s'y décide et ce qui n'y a pas sa place. Le relevé de décisions fait foi.",
		type: 'Note',
		domaine: 'Gouvernance',
		dossier: ['Gouvernance', 'Instances'],
		auteur: 'Karim Belhadj',
		jours: 121,
		modifie: 121,
		vues: 64,
		etiquettes: ['comité', 'gouvernance', 'décision']
	},
	{
		id: 'n-marches-seuils',
		titre: "Seuils et procédures d'achat",
		extrait:
			"En dessous de quel montant on commande librement, au-dessus duquel il faut mettre en concurrence, et qui valide quoi. Les seuils changent : la date de vérification n'est pas décorative.",
		type: 'Guide',
		domaine: 'Gouvernance',
		dossier: ['Gouvernance', 'Achats'],
		auteur: 'Marc Ferreira',
		jours: 311,
		modifie: 143,
		vues: 148,
		operationnel: true,
		etiquettes: ['achat', 'marché', 'seuil', 'validation']
	},
	{
		id: 'n-presta-beaumont',
		titre: 'Atelier Beaumont',
		extrait:
			'Prestataire de formation interne. Contrat CT-2024-118, reconduction tacite. Interlocutrice : Claire Fontaine.',
		type: 'Fiche',
		typeFiche: 'Prestataire',
		domaine: 'Gouvernance',
		dossier: ['Gouvernance', 'Achats', 'Prestataires'],
		auteur: 'Marc Ferreira',
		jours: 21,
		modifie: 21,
		vues: 41,
		etiquettes: ['prestataire', 'contrat', 'formation']
	},
	{
		id: 'n-conventions-redaction',
		titre: 'Conventions de rédaction',
		extrait:
			"Comment on titre, comment on structure, quand on ouvre un registre Opérationnel. Une note qui suit ces conventions se relit en deux minutes ; une autre coûte un quart d'heure.",
		type: 'Guide',
		domaine: 'Méthodes et qualité',
		dossier: ['Méthodes et qualité', 'Rédaction'],
		auteur: 'Léa Marchand',
		jours: 5,
		modifie: 5,
		vues: 312,
		publique: true,
		etiquettes: ['rédaction', 'convention', 'qualité']
	},
	{
		id: 'n-conduite-projet',
		titre: 'Conduite de projet — les cinq jalons',
		extrait:
			'Cadrage, engagement, réalisation, recette, clôture. Ce qui doit exister à chaque jalon pour passer au suivant, et qui le prononce.',
		type: 'Guide',
		domaine: 'Méthodes et qualité',
		dossier: ['Méthodes et qualité', 'Projet'],
		auteur: 'Karim Belhadj',
		jours: 46,
		modifie: 46,
		vues: 176,
		operationnel: true,
		etiquettes: ['projet', 'jalon', 'méthode']
	},
	{
		id: 'n-revue-pairs',
		titre: 'Revue par les pairs',
		extrait:
			"Un écrit qui engage le service ne part jamais sans une seconde lecture. Qui relit quoi, dans quel délai, et ce qu'on fait d'un désaccord.",
		type: 'Procédure',
		domaine: 'Méthodes et qualité',
		dossier: ['Méthodes et qualité', 'Rédaction'],
		auteur: 'Léa Marchand',
		jours: 138,
		modifie: 52,
		vues: 89,
		etiquettes: ['revue', 'relecture', 'qualité']
	},
	{
		id: 'n-proc-recette',
		titre: 'Recette et vérification du service fait',
		extrait:
			"Processus opposable : sans procès-verbal de recette, aucune facture n'est mise en paiement. Vaut pour une prestation intellectuelle comme pour une livraison.",
		type: 'Fiche',
		typeFiche: 'Processus',
		domaine: 'Méthodes et qualité',
		dossier: ['Méthodes et qualité', 'Projet'],
		auteur: 'Marc Ferreira',
		jours: 62,
		modifie: 62,
		vues: 133,
		etiquettes: ['recette', 'service fait', 'paiement', 'opposable']
	},
	{
		id: 'n-accueil-arrivant',
		titre: 'Accueillir un nouvel arrivant',
		extrait:
			"La première semaine, heure par heure : ce qui doit être prêt avant l'arrivée, ce qui se fait le premier jour, ce qui peut attendre. Le registre Opérationnel se suit sans rien connaître du service.",
		type: 'Procédure',
		domaine: 'Ressources humaines',
		dossier: ['Ressources humaines', 'Arrivée et départ'],
		auteur: 'Léa Marchand',
		jours: 17,
		modifie: 17,
		vues: 254,
		operationnel: true,
		etiquettes: ['arrivée', 'accueil', 'checklist']
	},
	{
		id: 'n-frais-mission',
		titre: 'Frais de mission — ce qui se rembourse',
		extrait:
			'Barèmes, justificatifs exigés, délai de dépôt. La question revient chaque mois : elle est écrite une fois ici, et vérifiée quand les barèmes bougent.',
		type: 'Guide',
		domaine: 'Ressources humaines',
		dossier: ['Ressources humaines', 'Déplacements'],
		auteur: 'Léa Marchand',
		jours: 167,
		modifie: 167,
		vues: 421,
		etiquettes: ['frais', 'mission', 'barème', 'remboursement']
	},
	{
		id: 'n-commande-materiel',
		titre: 'Commander du matériel de bureau',
		extrait:
			"Le circuit court, pour les fournitures courantes, et le circuit long au-delà du seuil. À qui s'adresser, sous quelle forme, et le délai à annoncer.",
		type: 'Procédure',
		domaine: 'Ressources humaines',
		dossier: ['Ressources humaines', 'Moyens'],
		auteur: 'Marc Ferreira',
		jours: 289,
		modifie: 94,
		vues: 187,
		operationnel: true,
		etiquettes: ['commande', 'fourniture', 'circuit']
	},
	{
		id: 'n-teletravail',
		titre: 'Télétravail — cadre et demande',
		extrait:
			"Nombre de jours, conditions d'éligibilité, formulaire et délai d'instruction. L'accord est en cours de renégociation.",
		type: 'Note',
		domaine: 'Ressources humaines',
		dossier: ['Ressources humaines', 'Organisation du travail'],
		auteur: 'Léa Marchand',
		jours: 3,
		modifie: 3,
		vues: 12,
		brouillon: true,
		etiquettes: ['télétravail', 'accord', 'demande']
	}
];

export function notesDOrganisation(): readonly LigneDeNote[] {
	return GRAINES.map((g) => {
		const modifieLe = instantAvantReference(g.modifie);
		return {
			identifiant: g.id,
			titre: g.titre,
			corpsReference: corps(g.extrait),
			corpsOperationnel: g.operationnel === true ? corpsVide() : null,
			typeDeNoteNom: g.type,
			typeDeFicheNom: g.typeFiche ?? null,
			domaineNom: g.domaine,
			cheminDeDossier: g.dossier,
			auteurNom: g.auteur,
			visibilite: g.publique === true ? 'publique' : 'interne',
			statut: g.brouillon === true ? 'brouillon' : 'publiee',
			creeLe: modifieLe,
			modifieLe,
			corpsOperationnelModifieLe: g.operationnel === true ? modifieLe : null,
			verifieLe: instantAvantReference(g.jours),
			compteurDeConsultations: g.vues,
			etiquettes: g.etiquettes,
			signetAdresse: null,
			signetAjouteLe: null,
			revisionDemandee: false,
			revisionCommentaire: null,
			revisionParNom: null,
			revisionLe: null
		};
	});
}

/** Les étiquettes que ces notes introduisent, dédoublonnées et triées. */
export function etiquettesDOrganisation(): readonly string[] {
	return [...new Set(GRAINES.flatMap((g) => g.etiquettes))].sort((a, b) =>
		a.localeCompare(b, 'fr')
	);
}

/**
 * LES RELATIONS, DONT DEUX QUI FRANCHISSENT LA FRONTIÈRE DES UNIVERS.
 *
 * `n-astreinte` et `n-purge-sauv` appartiennent au corpus du gel, côté
 * technique ; elles s'appuient ici sur une politique et sur un registre de
 * traitements. C'est ce que la cartographie doit montrer : le graphe ne
 * s'arrête pas au périmètre d'un métier.
 */
export function relationsDOrganisation(): readonly LigneDeRelation[] {
	return [
		{
			sourceIdentifiant: 'n-proc-recette',
			cibleIdentifiant: 'n-marches-seuils',
			typeIdentifiant: 'appuie'
		},
		{
			sourceIdentifiant: 'n-proc-recette',
			cibleIdentifiant: 'n-delegations',
			typeIdentifiant: 'valide'
		},
		{
			sourceIdentifiant: 'n-presta-beaumont',
			cibleIdentifiant: 'n-proc-recette',
			typeIdentifiant: 'depend'
		},
		{
			sourceIdentifiant: 'n-rgpd-registre',
			cibleIdentifiant: 'n-politique-securite',
			typeIdentifiant: 'appuie'
		},
		{
			sourceIdentifiant: 'n-marches-seuils',
			cibleIdentifiant: 'n-comite-si',
			typeIdentifiant: 'valide'
		},
		{
			sourceIdentifiant: 'n-conduite-projet',
			cibleIdentifiant: 'n-revue-pairs',
			typeIdentifiant: 'appuie'
		},
		{
			sourceIdentifiant: 'n-revue-pairs',
			cibleIdentifiant: 'n-conventions-redaction',
			typeIdentifiant: 'appuie'
		},
		{
			sourceIdentifiant: 'n-commande-materiel',
			cibleIdentifiant: 'n-marches-seuils',
			typeIdentifiant: 'appuie'
		},
		{
			sourceIdentifiant: 'n-accueil-arrivant',
			cibleIdentifiant: 'n-conventions-redaction',
			typeIdentifiant: 'documente'
		},
		{
			sourceIdentifiant: 'n-astreinte',
			cibleIdentifiant: 'n-politique-securite',
			typeIdentifiant: 'appuie'
		},
		{
			sourceIdentifiant: 'n-purge-sauv',
			cibleIdentifiant: 'n-rgpd-registre',
			typeIdentifiant: 'appuie'
		}
	];
}

/**
 * LA FRAÎCHEUR ATTENDUE DE CHAQUE NOTE, DÉCLARÉE.
 *
 * `semer()` relit les dates DEPUIS LA BASE et rejoue `niveauFraicheur()` pour
 * vérifier qu'un aller-retour `timestamptz` n'a pas décalé une note d'un seuil.
 * Le contrôle compare au niveau ANNONCÉ — pour le corpus, celui que la maquette
 * porte ; pour ces quatorze notes, celui-ci. Le déduire de `jours` viderait le
 * contrôle de son sens : il ne comparerait plus qu'un calcul à lui-même.
 *
 * Seuils par défaut : frais en deçà de 90 jours, vieillissant jusqu'à 180,
 * obsolète probable au-delà.
 */
export function fraicheurAttendueDOrganisation(): ReadonlyMap<string, 'frais' | 'vieil' | 'obs'> {
	return new Map([
		['n-politique-securite', 'frais'],
		['n-rgpd-registre', 'vieil'],
		['n-delegations', 'frais'],
		['n-comite-si', 'vieil'],
		['n-marches-seuils', 'obs'],
		['n-presta-beaumont', 'frais'],
		['n-conventions-redaction', 'frais'],
		['n-conduite-projet', 'frais'],
		['n-revue-pairs', 'vieil'],
		['n-proc-recette', 'frais'],
		['n-accueil-arrivant', 'frais'],
		['n-frais-mission', 'vieil'],
		['n-commande-materiel', 'obs'],
		['n-teletravail', 'frais']
	]);
}
