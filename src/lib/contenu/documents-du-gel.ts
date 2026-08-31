/**
 * LES DOCUMENTS DE DÉMONSTRATION — TRANSCRITS DU GEL, JAMAIS RÉDIGÉS.
 *
 * `seeds/corpus.ts` ne porte pas le corps COURANT des notes : les maquettes l'écrivent au
 * balisage. Il porte bien du corps rédigé, mais celui de trois versions anciennes d'une seule
 * note, typé `BlocDeContenu` : cinq informations que le format exige leur manquent — l'ancre
 * d'un titre, l'état coché d'une tâche, le glyphe d'une alerte, la nature numérique d'une
 * cellule, la source d'une figure. Les combler serait décider.
 *
 * Les quatre documents ci-dessous sont donc la transcription, bloc à bloc, du contenu rédigé
 * que deux maquettes PORTENT DÉJÀ :
 *
 *   `V-14-lecture-note.html:1524-1705`      Référence de « Restaurer une sauvegarde
 *                                           PostgreSQL depuis Barman »
 *   `V-14-lecture-note.html:1708-1753`      Opérationnel de la même note
 *   `V-03-lecture-publique.html:984-1078`   Référence de « Réinitialiser son mot de passe »
 *   `V-03-lecture-publique.html:1081-1102`  Opérationnel de la même note
 *
 * Écrire un contenu d'exemple qui exercerait commodément les quinze constructions aurait été
 * plus simple, et faux (`P-02`). Ce que le gel n'exerce pas est COMPTÉ à la fin de ce module.
 *
 * TROIS FRAGMENTS NE SONT PAS TRANSCRITS : les deux FIGURES, dont le gel porte le SVG — le
 * RÉSULTAT — quand M04.6 et `ADR-003` stockent la SOURCE, qui n'existe nulle part ; le LIEN
 * PRIVÉ de `V-03:1072`, dont la maquette masque le titre de la cible ; l'EXPOSANT de
 * `V-14:1577`, `sup` n'étant aucune des quinze constructions.
 *
 * LES IDENTIFIANTS DE CIBLE VIENNENT DU CORPUS : le gel écrit `href="#"` et le titre en clair,
 * `ADR-003` veut l'IDENTIFIANT. `idParTitre` le retrouve dans `seeds/corpus.ts` — et LÈVE si
 * le titre n'y est pas. DEUX CIBLES DU GEL N'EXISTENT PAS DANS LE CORPUS : l'une, le gel la
 * rend déjà cassée ; l'autre, il la rend VALIDE alors qu'aucune note ne porte ce titre.
 */
import { CORPUS } from '../../../seeds/corpus';
import { adresseDeNote, identifiantLisible } from '../rangement/adresses';
import {
	analyserDocument,
	type Alerte,
	type Bloc,
	type BlocDeCode,
	type Cellule,
	type CelluleDEntete,
	type Citation,
	type Document,
	type ElementDeListe,
	type LigneDeTableau,
	type ListeAPuces,
	type ListeDeTaches,
	type ListeNumerotee,
	type Marque,
	type Paragraphe,
	type Separateur,
	type Tableau,
	type Tache,
	type Texte,
	type Titre
} from './document';
import type { CibleDeNote, ResolveurDeNote } from './rendu';

function txt(text: string, ...marks: Marque[]): Texte {
	return marks.length === 0 ? { type: 'text', text } : { type: 'text', text, marks };
}
const fort = (text: string): Texte => txt(text, { type: 'bold' });
const ital = (text: string): Texte => txt(text, { type: 'italic' });
const souligne = (text: string): Texte => txt(text, { type: 'underline' });
const barre = (text: string): Texte => txt(text, { type: 'strike' });
const surligne = (text: string): Texte => txt(text, { type: 'highlight' });
const enLigne = (text: string): Texte => txt(text, { type: 'code' });
const interne = (text: string, cible: string): Texte =>
	txt(text, { type: 'lienInterne', attrs: { cible } });
const externe = (text: string, href: string): Texte => txt(text, { type: 'link', attrs: { href } });

function para(...content: Texte[]): Paragraphe {
	return content.length === 0 ? { type: 'paragraph' } : { type: 'paragraph', content };
}
function titre(level: 1 | 2 | 3 | 4 | 5 | 6, ancre: string | null, ...content: Texte[]): Titre {
	return { type: 'heading', attrs: { level, ancre }, content };
}
function bloc_de_code(language: string | null, code: string): BlocDeCode {
	return { type: 'codeBlock', attrs: { language }, content: [{ type: 'text', text: code }] };
}
const item = (...content: Bloc[]): ElementDeListe => ({ type: 'listItem', content });
const puces = (...content: ElementDeListe[]): ListeAPuces => ({ type: 'bulletList', content });
const numeros = (...content: ElementDeListe[]): ListeNumerotee => ({
	type: 'orderedList',
	content
});
const tache = (checked: boolean, ...content: Bloc[]): Tache => ({
	type: 'taskItem',
	attrs: { checked },
	content
});
const taches = (...content: Tache[]): ListeDeTaches => ({ type: 'taskList', content });
const citation = (attribution: string | null, ...content: Bloc[]): Citation => ({
	type: 'blockquote',
	attrs: { attribution },
	content
});
const alerte = (
	niveau: Alerte['attrs']['niveau'],
	glyphe: string,
	titreDAlerte: string,
	...content: Bloc[]
): Alerte => ({ type: 'alerte', attrs: { niveau, glyphe, titre: titreDAlerte }, content });
const entete = (...content: Texte[]): CelluleDEntete => ({
	type: 'tableHeader',
	content: [para(...content)]
});
const cellule = (numerique: boolean, ...content: Texte[]): Cellule => ({
	type: 'tableCell',
	attrs: { numerique },
	content: [para(...content)]
});
const ligne = (...content: (CelluleDEntete | Cellule)[]): LigneDeTableau => ({
	type: 'tableRow',
	content
});
const tableau = (...content: LigneDeTableau[]): Tableau => ({ type: 'table', content });
const separateur: Separateur = { type: 'horizontalRule' };

export function idParTitre(titreDeNote: string): string {
	const note = CORPUS.find((n) => n.titre === titreDeNote);
	if (note === undefined) {
		throw new Error(`seeds/corpus.ts ne porte aucune note intitulée « ${titreDeNote} »`);
	}
	return note.id;
}

/**
 * Une cible qui n'existe pas et doit le rester. E-04 interdit de forger un
 * identifiant de note ; ces chaînes n'en sont pas, et ne prétendent pas l'être.
 */
function cibleInexistante(quoi: string): string {
	return `cible-inexistante:${quoi}`;
}

const CIBLE_CLES_SSH = cibleInexistante('renouveler-les-cles-ssh-du-compte-barman');
const CIBLE_DEPOT_BARMAN = cibleInexistante('reconstruire-le-depot-barman');

/** Les deux cibles du gel qu'aucune note du corpus ne porte. */
export const CIBLES_SANS_NOTE: readonly string[] = [CIBLE_CLES_SSH, CIBLE_DEPOT_BARMAN];

/**
 * LE RÉSOLVEUR DE DÉMONSTRATION — il lit le corpus, il n'invente rien. « Publique » y
 * est la conjonction que `RG-ACC-01` impose : visibilité publique ET note publiée.
 */
export const resoudreDansLeCorpus: ResolveurDeNote = (identifiant: string): CibleDeNote | null => {
	const note = CORPUS.find((n) => n.id === identifiant);
	if (note === undefined) return null;
	return {
		id: note.id,
		titre: note.titre,
		adresse: adresseDeNote(identifiantLisible(note.titre)),
		publique: note.visibilite === 'Publique' && !note.brouillon
	};
};

const V14_REFERENCE_BLOCS: readonly Bloc[] = [
	para(
		txt("Cette procédure décrit la restauration d'une base "),
		fort('PostgreSQL 16'),
		txt(' à partir des sauvegardes gérées par Barman sur '),
		enLigne('bkp-01.prod'),
		txt('. Elle couvre la restauration complète et la restauration à un instant donné. Elle '),
		ital('ne couvre pas'),
		txt(" la bascule d'un réplica en primaire, traitée dans une note séparée.")
	),
	titre(2, 's-avant', txt('Avant de commencer')),
	titre(3, 's-prerequis', txt('Prérequis')),
	puces(
		item(
			para(
				txt('Un accès '),
				enLigne('sudo'),
				txt(' sur le serveur de sauvegarde '),
				enLigne('bkp-01.prod'),
				txt(' et sur le serveur cible.')
			)
		),
		item(
			para(
				txt('La clé SSH du compte '),
				enLigne('barman'),
				txt(' déployée vers le serveur cible.')
			),
			puces(
				item(para(txt('Vérifiable avec '), enLigne('barman check pg-prod-01'), txt('.'))),
				item(
					para(
						txt("En cas d'échec, voir "),
						interne('Renouveler les clés SSH du compte barman', CIBLE_CLES_SSH),
						txt('.')
					)
				)
			)
		),
		item(
			para(
				txt("L'espace disque disponible sur la cible : au moins "),
				fort('1,4 fois'),
				txt(' la taille de la sauvegarde.')
			)
		)
	),
	titre(3, 's-fenetre', txt("Fenêtre d'intervention")),
	alerte(
		'attention',
		'ATTENTION',
		'La base cible est arrêtée pendant toute la restauration',
		para(
			txt(
				"Comptez 40 minutes pour une base de 120 Go sur disque local. Prévenez l'astreinte " +
					"applicative avant de démarrer et déclarez la fenêtre dans l'outil de suivi."
			)
		)
	),
	titre(2, 's-choisir', txt('Choisir la sauvegarde')),
	para(
		txt(
			'Listez les sauvegardes disponibles pour le serveur concerné. La sortie est triée de la ' +
				'plus récente à la plus ancienne.'
		)
	),
	bloc_de_code(
		'bash',
		'# depuis bkp-01.prod, sous le compte barman\n' +
			'barman list-backup pg-prod-01\n' +
			'barman show-backup pg-prod-01 20260810T020112'
	),
	para(
		txt(
			"Recoupez l'identifiant obtenu avec le tableau ci-dessous, tenu à jour par l'équipe " +
				'exploitation.'
		)
	),
	tableau(
		ligne(
			entete(txt('Identifiant')),
			entete(txt('Date')),
			entete(txt('Type')),
			entete(txt('Taille')),
			entete(txt('Rétention')),
			entete(txt('État'))
		),
		ligne(
			cellule(true, txt('20260810T020112')),
			cellule(false, txt('10 août 2026, 02:01')),
			cellule(false, txt('Complète')),
			cellule(true, txt('118 Go')),
			cellule(false, txt('30 jours')),
			cellule(false, txt('Valide'))
		),
		ligne(
			cellule(true, txt('20260803T020108')),
			cellule(false, txt('3 août 2026, 02:01')),
			cellule(false, txt('Complète')),
			cellule(true, txt('117 Go')),
			cellule(false, txt('30 jours')),
			cellule(false, txt('Valide'))
		),
		ligne(
			cellule(true, txt('20260727T020115')),
			cellule(false, txt('27 juillet 2026, 02:01')),
			cellule(false, txt('Complète')),
			cellule(true, txt('116 Go')),
			cellule(false, txt('30 jours')),
			cellule(false, txt('Valide'))
		),
		ligne(
			cellule(true, txt('20260701T020104')),
			cellule(false, txt('1er juillet 2026, 02:01')),
			cellule(false, txt('Complète')),
			cellule(true, txt('114 Go')),
			cellule(false, txt('1 an')),
			cellule(false, txt('Archivée'))
		)
	),
	titre(2, 's-restaurer', txt('Restaurer')),
	para(
		txt(
			'La restauration se déroule en quatre temps. Le schéma ci-dessous fixe ' +
				"l'enchaînement et les points de non-retour."
		)
	),
	/* Ici le gel place sa figure (`V-14:1585-1623`) — non transcriptible : voir
	   l'en-tête du module, point 1. */
	titre(3, 's-complete', txt('Restauration complète')),
	numeros(
		item(
			para(
				txt("Arrêtez le service sur le serveur cible et confirmez qu'aucune connexion ne subsiste.")
			)
		),
		item(para(txt('Lancez le transfert depuis '), enLigne('bkp-01.prod'), txt('.'))),
		item(para(txt("Laissez Barman rejouer les journaux jusqu'à la fin de la sauvegarde.")))
	),
	bloc_de_code(
		'bash',
		'barman recover --remote-ssh-command "ssh postgres@pg-prod-01" \\\n' +
			'        pg-prod-01 20260810T020112 \\\n' +
			'        /var/lib/postgresql/16/main'
	),
	titre(3, 's-instant', txt('Restauration à un instant donné')),
	para(
		txt(
			'Pour revenir à un état antérieur précis — typiquement après une suppression ' +
				"accidentelle — ajoutez la cible temporelle. L'heure est interprétée dans le fuseau " +
				'du serveur de bases.'
		)
	),
	bloc_de_code(
		'sql',
		"-- repérer l'instant juste avant l'incident\n" +
			'SELECT max(commit_ts) FROM audit.journal\n' +
			"WHERE table_cible = 'facturation.lignes'\n" +
			"  AND commit_ts < '2026-08-11 14:20:00';"
	),
	alerte(
		'danger',
		'DANGER',
		'Opération destructive et irréversible',
		para(
			enLigne('barman recover'),
			txt(
				' écrase intégralement le répertoire de données de la cible. Vérifiez trois fois le ' +
					'nom du serveur avant de valider. Une restauration lancée sur le mauvais serveur ' +
					'détruit une production saine.'
			)
		)
	),
	titre(2, 's-verifier', txt('Vérifier le résultat')),
	para(
		txt(
			'Ne rendez pas la main tant que les quatre contrôles suivants ne sont pas passés. Cette ' +
				'liste est reprise telle quelle dans le registre opérationnel.'
		)
	),
	taches(
		tache(true, para(txt('Le service démarre sans erreur dans le journal système.'))),
		tache(true, para(txt('La requête témoin renvoie le nombre de lignes attendu.'))),
		tache(false, para(txt('La réplication vers '), enLigne('pg-prod-02'), txt(' est repartie.'))),
		tache(false, para(txt('La sonde de supervision est repassée au vert.')))
	),
	para(
		txt('La '),
		surligne('requête témoin'),
		txt(' est volontairement '),
		souligne('peu coûteuse'),
		txt(' : elle doit pouvoir être lancée en pleine charge. '),
		barre("L'ancien contrôle par comptage complet"),
		txt(' a été abandonné en 2025, il bloquait la table pendant plusieurs minutes.')
	),
	titre(2, 's-echec', txt("En cas d'échec")),
	citation(
		"— Retour d'expérience de l'astreinte, revue trimestrielle du 12 mars 2026",
		para(
			txt(
				"Une restauration qui échoue à 3 heures du matin n'est jamais un problème technique " +
					"isolé : c'est presque toujours un prérequis non vérifié en amont."
			)
		)
	),
	para(
		txt("Reprenez d'abord les prérequis, puis consultez "),
		interne(
			'Diagnostiquer un échec de restauration Barman',
			idParTitre('Diagnostiquer un échec de restauration Barman')
		),
		txt('. Si le serveur de sauvegarde lui-même est en cause, la note '),
		interne('Reconstruire le dépôt Barman', CIBLE_DEPOT_BARMAN),
		txt(
			" n'existe pas encore — signalez-le ou créez-la. La documentation amont de l'éditeur " +
				'est disponible sur '
		),
		externe('docs.pgbarman.org', 'https://docs.pgbarman.org'),
		txt('.')
	),
	alerte(
		'astuce',
		'ASTUCE',
		'Répétez la manœuvre à froid',
		para(
			txt('Une restauration blanche sur '),
			enLigne('pg-bac-01'),
			txt(
				' une fois par trimestre coûte une heure et transforme cette procédure en réflexe. ' +
					"C'est la seule façon de savoir qu'elle fonctionne encore."
			)
		)
	),
	separateur,
	titre(2, 's-annexe', txt('Annexe — conventions de rédaction')),
	para(
		txt(
			"Cette section n'a pas de valeur opérationnelle. Elle fixe le rendu des six niveaux de " +
				'titre pour la maquette de référence.'
		)
	),
	titre(3, 's-n3', txt('Niveau 3 — sous-partie')),
	titre(4, null, txt('Niveau 4 — regroupement')),
	titre(5, null, txt('Niveau 5 — précision')),
	titre(6, null, txt('Niveau 6 — annotation')),
	para(
		txt(
			'Le niveau 1 est réservé au titre de la note, affiché en tête de page. Seuls les ' +
				'niveaux 2 et 3 alimentent le sommaire.'
		)
	)
];

const V14_OPERATIONNEL_BLOCS: readonly Bloc[] = [
	alerte(
		'astuce',
		'REGISTRE',
		'Version opérationnelle',
		para(
			txt(
				"Pas-à-pas d'intervention. Pour le détail, les cas particuliers et les justifications, basculez sur le registre "
			),
			fort('Référence'),
			txt('.')
		)
	),
	titre(2, 'o-preparer', txt('Préparer')),
	numeros(
		item(para(txt("Prévenez l'astreinte applicative. Déclarez la fenêtre."))),
		item(
			para(
				txt('Ouvrez une session sur '),
				enLigne('bkp-01.prod'),
				txt(' sous le compte '),
				enLigne('barman'),
				txt('.')
			)
		),
		item(para(txt("Notez l'identifiant de la sauvegarde à restaurer.")))
	),
	titre(2, 'o-executer', txt('Exécuter')),
	alerte(
		'danger',
		'DANGER',
		"Relisez le nom du serveur cible avant d'appuyer",
		para(txt("L'étape suivante écrase la base de la cible. Elle ne s'annule pas."))
	),
	bloc_de_code(
		'bash',
		'ssh postgres@pg-prod-01 "sudo systemctl stop postgresql@16-main"\n' +
			'barman recover --remote-ssh-command "ssh postgres@pg-prod-01" \\\n' +
			'        pg-prod-01 20260810T020112 /var/lib/postgresql/16/main'
	),
	titre(2, 'o-controler', txt('Contrôler')),
	taches(
		tache(false, para(txt('Service démarré, journal système sans erreur.'))),
		tache(false, para(txt('Requête témoin conforme.'))),
		tache(false, para(txt('Réplication vers '), enLigne('pg-prod-02'), txt(' repartie.'))),
		tache(false, para(txt('Sonde de supervision au vert.')))
	),
	titre(2, 'o-bloque', txt('Si ça bloque')),
	para(
		txt("Ne relancez pas la commande. Appelez l'astreinte infrastructure et suivez "),
		interne(
			'Diagnostiquer un échec de restauration Barman',
			idParTitre('Diagnostiquer un échec de restauration Barman')
		),
		txt('.')
	)
];

const V03_REFERENCE_BLOCS: readonly Bloc[] = [
	para(
		txt(
			'Votre mot de passe expire tous les six mois, et il peut être réinitialisé à tout ' +
				"moment. Trois chemins existent selon l'endroit où vous êtes et l'état de votre poste. "
		),
		fort("Aucun d'eux ne nécessite d'appeler le support"),
		txt(', sauf le dernier cas décrit plus bas.')
	),
	alerte(
		'attention',
		'ATTENTION',
		'Personne ne vous demandera jamais votre mot de passe',
		para(
			txt(
				'Ni par téléphone, ni par courriel, ni par message. Aucun agent du support, aucun ' +
					"responsable. Un message qui vous le demande est une tentative d'hameçonnage : " +
					'signalez-le sans y répondre.'
			)
		)
	),
	titre(2, 's-portail', txt('Depuis le portail, sur votre poste')),
	para(
		txt(
			"C'est le cas courant : vous êtes connecté et vous voulez changer votre mot de passe " +
				"avant qu'il n'expire."
		)
	),
	numeros(
		item(para(txt('Ouvrez le portail interne et allez dans '), fort('Mon compte'), txt('.'))),
		item(para(txt('Choisissez '), fort('Changer mon mot de passe'), txt('.'))),
		item(para(txt("Saisissez l'ancien, puis le nouveau deux fois."))),
		item(
			para(
				txt(
					'Verrouillez puis déverrouillez votre session pour vérifier que le nouveau est ' +
						'bien pris en compte.'
				)
			)
		)
	),
	/* Ici le gel place sa figure (`V-03:1004-1040`) — non transcriptible. */
	titre(2, 's-verrouille', txt("Depuis l'écran de connexion, poste verrouillé")),
	para(
		txt(
			'Si vous avez oublié votre mot de passe et que vous ne pouvez plus ouvrir votre ' +
				'session, utilisez le lien '
		),
		ital('Mot de passe oublié'),
		txt(
			' sous les champs de connexion. Un code vous est envoyé sur votre téléphone ' +
				'professionnel.'
		)
	),
	alerte(
		'astuce',
		'ASTUCE',
		'Le code arrive rarement en moins de dix secondes',
		para(
			txt(
				'Attendez une minute avant de le redemander : chaque nouvelle demande annule la ' +
					'précédente, et beaucoup de blocages viennent de là.'
			)
		)
	),
	titre(2, 's-deplacement', txt('En déplacement, sans accès au réseau interne')),
	para(
		txt(
			'Appelez le support. Votre identité sera vérifiée par une question convenue à votre ' +
				"arrivée dans l'entreprise. Si vous ne vous en souvenez pas, le support passera par " +
				'votre responsable hiérarchique — comptez alors une demi-journée.'
		)
	),
	titre(2, 's-regles', txt('Ce que doit contenir le nouveau mot de passe')),
	tableau(
		ligne(entete(txt('Règle')), entete(txt('Détail'))),
		ligne(cellule(false, txt('Longueur')), cellule(false, txt('12 caractères au minimum'))),
		ligne(
			cellule(false, txt('Composition')),
			cellule(false, txt('Aucune contrainte de caractères spéciaux'))
		),
		ligne(cellule(false, txt('Réutilisation')), cellule(false, txt('Différent des 5 derniers'))),
		ligne(cellule(false, txt('Validité')), cellule(false, txt('6 mois'))),
		ligne(
			cellule(false, txt('Prise en compte')),
			cellule(false, txt("5 minutes sur l'ensemble des services"))
		)
	),
	para(
		txt("Une phrase de passe est plus sûre et plus facile à retenir qu'une suite de symboles. "),
		surligne('Quatre mots sans rapport entre eux'),
		txt(" valent mieux qu'un mot compliqué.")
	),
	titre(2, 's-particuliers', txt('Cas particuliers')),
	puces(
		item(
			para(
				fort("Compte partagé d'équipe"),
				txt(
					" — la procédure est différente et suivie par l'équipe technique. Elle est " +
						'décrite dans une ressource réservée aux équipes techniques.'
				)
			)
		),
		item(
			para(
				fort("Vous n'arrivez plus à accéder à une application précise"),
				txt(" — ce n'est peut-être pas votre mot de passe. Voyez "),
				interne(
					'Demander un accès à une application',
					idParTitre('Demander un accès à une application')
				),
				txt('.')
			)
		),
		item(
			para(
				fort('Téléphone professionnel perdu'),
				txt(" — signalez-le d'abord, la réinitialisation viendra ensuite. Voyez "),
				interne('Signaler un incident au support', idParTitre('Signaler un incident au support')),
				txt('.')
			)
		)
	),
	para(
		txt("La politique de mots de passe suit les recommandations publiques de l'"),
		externe('ANSSI', 'https://cyber.gouv.fr'),
		txt('.')
	)
];

const V03_OPERATIONNEL_BLOCS: readonly Bloc[] = [
	alerte(
		'astuce',
		'EN BREF',
		'Version courte',
		para(
			txt('Pour le détail, les cas particuliers et les règles, revenez au '),
			fort('guide complet'),
			txt('.')
		)
	),
	titre(2, 'o-faire', txt("Ce qu'il faut faire")),
	numeros(
		item(
			para(
				txt('Session ouverte ? Portail interne → '),
				fort('Mon compte'),
				txt(' → '),
				fort('Changer mon mot de passe'),
				txt('.')
			)
		),
		item(
			para(
				txt('Poste verrouillé ? '),
				fort('Mot de passe oublié'),
				txt(" sur l'écran de connexion, puis le code reçu par téléphone.")
			)
		),
		item(para(txt('En déplacement sans réseau ? Appelez le support.')))
	),
	titre(2, 'o-retenir', txt('À retenir')),
	taches(
		tache(false, para(txt('12 caractères minimum, différent des 5 derniers.'))),
		tache(false, para(txt('Actif sous 5 minutes sur tous les services.'))),
		tache(false, para(txt('Personne ne vous demandera jamais votre mot de passe.')))
	)
];

export interface DocumentDuGel {
	readonly note: string;
	readonly registre: 'reference' | 'operationnel';
	readonly source: string;
	readonly document: Document;
}

/**
 * LES QUATRE CORPS DU GEL, validés à la construction : si la transcription est
 * mal formée, ce module ne se charge pas. C'est voulu — un document de
 * démonstration invalide serait le pire des faux verts.
 */
export const DOCUMENTS_DU_GEL: readonly DocumentDuGel[] = [
	{
		note: 'n-restaurer-pg',
		registre: 'reference',
		source: 'mockups/V-14-lecture-note.html:1524-1705',
		document: analyserDocument({ type: 'doc', content: V14_REFERENCE_BLOCS })
	},
	{
		note: 'n-restaurer-pg',
		registre: 'operationnel',
		source: 'mockups/V-14-lecture-note.html:1708-1753',
		document: analyserDocument({ type: 'doc', content: V14_OPERATIONNEL_BLOCS })
	},
	{
		note: 'n-mot-de-passe',
		registre: 'reference',
		source: 'mockups/V-03-lecture-publique.html:984-1078',
		document: analyserDocument({ type: 'doc', content: V03_REFERENCE_BLOCS })
	},
	{
		note: 'n-mot-de-passe',
		registre: 'operationnel',
		source: 'mockups/V-03-lecture-publique.html:1081-1102',
		document: analyserDocument({ type: 'doc', content: V03_OPERATIONNEL_BLOCS })
	}
];

export function documentDuGel(note: string, registre: 'reference' | 'operationnel'): Document {
	const trouve = DOCUMENTS_DU_GEL.find((d) => d.note === note && d.registre === registre);
	if (trouve === undefined) throw new Error(`aucun corps du gel pour ${note} / ${registre}`);
	return trouve.document;
}
