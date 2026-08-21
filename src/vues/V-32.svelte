<script lang="ts">
	/**
	 * V-32 — Console · Comptes.
	 * Route `/console/comptes` (`docs/routes.md` §3.6).
	 *
	 * COQUILLE DE FORME ABRÉGÉE, ENVELOPPE `console` — vérifié sur le gel par
	 * `node verif/releve-vues.mjs --formes` (ARB-021, A-1 ; ARB-023).
	 *
	 * CE QUI EST COMMUN, ET CE QUI NE L'EST PAS. `src/lib/console/` porte les
	 * treize classes des dix vues de console et le panneau des six registres
	 * (`sections.ts`, en-tête). Propres à V-32 : `avatar-c`, `tg__ident`,
	 * `tg__marques`, `past--desactive`, `past--verrou`, `past--systeme`,
	 * `past--admin`, `champ__boite`, `champ__action`, `avert-unique`,
	 * `mdp-unique`, `mdp-unique__valeur`, `transmettre`, `tg--reduit`, et le
	 * modificateur de grille `tg--comptes`. AUCUNE FACTORISATION AU-DELÀ.
	 *
	 * SEULE VUE DU DÉPÔT À DEUX BOÎTES DISTINCTES ouvertes par deux états
	 * distincts — `#dlg-mdp` pour `mdp`, `#dlg-desactiver` pour `des`. La
	 * révélation `modalite-dialogue` porte sur « tout `dialog[open]` du
	 * document » et couvre donc les deux sans les nommer
	 * (`verif/references/protocole-app.json`, ARB-017).
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL. Hors de
	 * `div.app`, `.app[data-form="ouvert"] .tiroir-form` ne l'atteint pas ; le
	 * NIVEAU 1 en est le seul juge (`CLAUDE.md` §6, P-3). RIEN DE CE FICHIER NE
	 * CHANGE CELA : le déplacement qui rend la règle gelée applicable est fait par
	 * la ROUTE, au montage (`cablerLeTiroirDeFormulaire()` de
	 * `src/routes/console/cablage.ts`), sur le document vivant que le banc
	 * n'atteint jamais. La vue, elle, se borne à dire `data-form="ouvert"`.
	 *
	 * AUCUN `autofocus` : hors dialogue, le focus ne survit pas à `stabiliser()`
	 * (`CLAUDE.md` §6, P-4). Dans `#dlg-desactiver`, `showModal()` focalise
	 * `button.dlg__fermer`, premier focalisable ; dans `#dlg-mdp`, qui n'a pas
	 * de bouton de fermeture en tête, c'est `button#mdp-copier`, également le
	 * premier — rien à déclarer dans un cas comme dans l'autre.
	 *
	 * LES ÉTATS DE RÔLE ET DE DROIT SONT DES ÉTATS DE PLANCHE, PAS UNE
	 * FRONTIÈRE DE SÉCURITÉ. Le sélecteur de rôle verrouillé et le refus de
	 * désactivation du dernier administrateur reproduisent la maquette. **CE LOT
	 * NE DÉCLARE PAS `P-09` TENUE** : qu'une action interdite ne soit dans aucun
	 * DOM relève de la batterie 7 (`pnpm test:droits`) et des lots T-011, T-016.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : les comptes, leurs rôles et leurs
	 * dernières connexions viennent de `COMPTES` ; le nombre de contributions
	 * est compté sur le corpus de la vue.
	 *
	 * AUCUNE MINUTERIE (ARB-011). LE COMPORTEMENT, LUI, EXISTE DÉSORMAIS, et il
	 * est celui du script du gel : « Modifier » ouvre le panneau sur un compte
	 * (`V-32:3107`), le sélecteur de rôle met son aide à jour (`V-32:3136`),
	 * « Annuler » et la croix le referment (`V-32:3225`), « Enregistrer » rend le
	 * rôle choisi à la page. Aucun de ces gestes n'a lieu au rendu serveur : les
	 * deux états qui les portent partent de `null`, et les sept positions de
	 * planche rendent exactement ce qu'elles rendaient.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette`, `dialog#palette` fermé,
	 * et `div.planche`, bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-32.css` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import {
		COMPTES,
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Compte,
		type Domaine,
		type EtatDInstance,
		type Note,
		type RoleDeCompte,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';

	interface Proprietes {
		/** Le vecteur complet de l'état — formulaire × cas. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-32')`. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Le registre des comptes. Absente, la constante du jeu de semence. */
		comptes?: readonly Compte[];
		/**
		 * CE QUE LA VUE FAIT QUAND LA DÉSACTIVATION EST CONFIRMÉE, ou quand un
		 * compte est réactivé.
		 *
		 * Même partage qu'en `V-27`, `V-28` et `V-29` : la vue tient l'état de son
		 * dialogue — quel compte est visé, s'il est le dernier administrateur, ce
		 * que ses contributions comptent — et la page tient le réseau. Le décompte
		 * des contributions se fait sur les notes qu'elle a reçues ; personne
		 * d'autre ne peut le composer.
		 *
		 * `actif` PORTE L'ÉTAT VOULU, pas une bascule : deux administrateurs qui
		 * cliquent en même temps ne doivent pas s'annuler l'un l'autre.
		 */
		onChangerLActivation?: (compte: {
			readonly identifiant: string;
			readonly actif: boolean;
		}) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND « ENREGISTRER » EST CLIQUÉ — `RG-M14-07`.
		 *
		 * MÊME PARTAGE QUE CI-DESSUS : la vue tient l'état de son panneau — quel
		 * compte est édité, quel rôle est choisi dans le sélecteur —, la page tient
		 * le réseau et l'action. Le gel fait exactement ce partage-là : `V-32:3199`
		 * relit `document.getElementById("f-role").value` au clic, puis écrit.
		 *
		 * ABSENTE, LE PANNEAU S'OUVRE ET SE FERME SANS RIEN ENVOYER : c'est l'état
		 * d'une planche, qui n'a ni route ni action derrière elle.
		 *
		 * SEUL LE RÔLE VOYAGE. Le gel enregistre aussi le nom affiché, le courriel,
		 * le domaine principal et le verrouillage du mot de passe (`V-32:3214-3218`)
		 * ; côté produit, `RG-M14-07` est la seule de ces écritures dont l'action de
		 * route existe (`changerLeRole`). Les quatre autres sont REMONTÉES, pas
		 * comblées : leur envoyer un champ qu'aucune action ne lit ferait croire à
		 * un enregistrement qui n'a pas lieu.
		 */
		onEnregistrerLeRole?: (demande: {
			readonly identifiant: string;
			readonly role: RoleDeCompte;
		}) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND « CRÉER LE COMPTE » EST CLIQUÉ — `UC-M14-07`.
		 *
		 * MÊME PARTAGE QUE LES DEUX PRÉCÉDENTES : la vue relève les sept nœuds de
		 * son panneau et rend la demande ; la page tient le réseau et l'action. Le
		 * gel fait exactement ce partage — `V-32:3175-3206` relit les champs par
		 * `getElementById` au clic, puis écrit.
		 *
		 * ELLE REND UNE PROMESSE, ET C'EST LA SEULE DES TROIS. Un refus de création
		 * s'affiche DANS le formulaire — `#erreur-ident` et `#erreur-nom` sont des
		 * nœuds du gel, révélés par `marquer()` (`V-32:3186`) — et un succès ouvre
		 * `#dlg-mdp` sur le mot de passe initial. La vue a donc besoin de savoir ce
		 * que le serveur a répondu ; les deux autres gestes rechargent la page et
		 * n'ont rien à attendre.
		 *
		 * SEULS LES DEUX CHAMPS QUE LE GEL SAIT MARQUER PEUVENT PORTER UN MESSAGE.
		 * Le formulaire n'a que deux blocs `.champ__erreur` (`V-32:1352`,
		 * `V-32:1362`) : un refus qui viserait un autre champ n'a nulle part où se
		 * dire, et la vue n'invente pas d'endroit — le panneau reste simplement
		 * ouvert, sans rien écrire.
		 *
		 * ABSENTE, « CRÉER LE COMPTE » FERME LE PANNEAU SANS RIEN ENVOYER : c'est
		 * l'état d'une planche, qui n'a ni route ni action derrière elle.
		 */
		onCreerUnCompte?: (demande: {
			readonly identifiant: string;
			readonly nom: string;
			readonly courriel: string;
			readonly motDePasse: string;
			readonly role: RoleDeCompte;
			/** Le NOM d'affichage du domaine choisi. Vide : aucun rattachement. */
			readonly domaine: string;
			readonly motDePasseVerrouille: boolean;
		}) => Promise<{
			readonly cree: boolean;
			readonly erreurs: readonly { readonly champ: 'ident' | 'nom'; readonly message: string }[];
		}>;
		/**
		 * CE QUE LA VUE FAIT QUAND LE MOT DE PASSE A ÉTÉ NOTÉ — `#mdp-fermer`.
		 *
		 * Le gel efface la valeur du document en même temps qu'elle disparaît de
		 * l'écran (`V-32:3255`) : « elle ne doit pas rester récupérable dans la
		 * page ». Côté produit, la liste rendue vient du serveur et le compte
		 * nouvellement créé n'y est pas encore : c'est ce rappel qui fait relire la
		 * page, et il efface la valeur par la même occasion.
		 */
		onMotDePasseTransmis?: () => void;
		/**
		 * RÉINITIALISER LE MOT DE PASSE D'UN COMPTE — `RG-CPT-01`, dernière phrase :
		 * « La réinitialisation par un administrateur reste possible », y compris
		 * sur un compte dont le mot de passe est verrouillé.
		 *
		 * `reinitialiser(c)` du gel (`V-32:3228`) engendre la valeur AU NAVIGATEUR
		 * et ouvre `#dlg-mdp` dessus. Le partage est celui de la création : la vue
		 * engendre et affiche, la page envoie ; la base n'en garde que le condensat,
		 * et aucune réponse ne reporte la valeur claire.
		 *
		 * ABSENTE, LA BOÎTE S'OUVRE SANS RIEN ENVOYER : c'est l'état d'une planche.
		 */
		onReinitialiserLeMotDePasse?: (demande: {
			readonly identifiant: string;
			readonly motDePasse: string;
		}) => Promise<boolean>;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		comptes: registreDeComptes = COMPTES,
		onChangerLActivation,
		onEnregistrerLeRole,
		onCreerUnCompte,
		onMotDePasseTransmis,
		onReinitialiserLeMotDePasse
	}: Proprietes = $props();

	/**
	 * LES QUATRE RÔLES ET LEUR AIDE sont ceux du gel (`V-32:2947`).
	 * `seeds/corpus.ts` porte le TYPE `RoleDeCompte` — les quatre noms — mais
	 * pas la phrase qui dit ce que chacun permet : elle est recopiée du gel.
	 */
	const ROLES: readonly { cle: RoleDeCompte; aide: string }[] = [
		{ cle: 'Lecteur', aide: 'Consulte, ne modifie rien.' },
		{ cle: 'Contributeur', aide: 'Écrit et modifie les notes de son domaine.' },
		{
			cle: 'Référent',
			aide: 'Contributeur, plus la gestion du rangement et des droits de son domaine.'
		},
		{ cle: 'Administrateur', aide: 'Accès complet, y compris la console et tous les domaines.' }
	];

	/**
	 * LE VERROUILLAGE DE MOT DE PASSE est un attribut du gel (`V-32:2957`), et
	 * il n'existe que là : `Compte` n'en porte pas. Le déduire d'autre chose
	 * serait inventer une règle que rien ne pose.
	 */
	const IDENTIFIANT_VERROUILLE = 'lea.marchand';

	/** Le domaine proposé à la création : le premier de la liste (`V-32:3149`). */
	const PREMIER_DOMAINE = $derived(domaines[0]?.nom ?? '');

	interface CompteRendu {
		readonly compte: Compte;
		readonly verrouille: boolean;
	}

	const comptes: readonly CompteRendu[] = $derived(
		registreDeComptes.map((c) => ({
			compte: c,
			verrouille: c.identifiant === IDENTIFIANT_VERROUILLE
		}))
	);

	/** L'ordre du gel : les actifs d'abord, puis par nom (`V-32:2989`). */
	const listeTriee: readonly CompteRendu[] = $derived(
		[...comptes].sort(
			(a, b) =>
				Number(b.compte.actif) - Number(a.compte.actif) ||
				a.compte.nom.localeCompare(b.compte.nom, 'fr')
		)
	);

	function initiales(nom: string): string {
		return nom
			.split(' ')
			.map((m) => m[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	const administrateurs: readonly CompteRendu[] = $derived(
		comptes.filter((c) => c.compte.role === 'Administrateur' && c.compte.actif)
	);

	function estDernierAdmin(c: CompteRendu): boolean {
		return c.compte.role === 'Administrateur' && c.compte.actif && administrateurs.length === 1;
	}

	/** Les notes écrites par ce compte — comptées, jamais écrites. */
	function contributions(nom: string): number {
		return corpus.filter((n) => n.auteur === nom).length;
	}

	/**
	 * LE MOT DE PASSE TEMPORAIRE — LA MÊME COMPOSITION QUE LE GEL
	 * (`V-32:2975`) : trois mots tirés d'une liste de seize, prononçables et
	 * sans caractère ambigu, puis un nombre à deux chiffres.
	 *
	 * SA VALEUR NE PEUT PAS COÏNCIDER AVEC CELLE DE LA MAQUETTE, et
	 * `verif/masques.json` le dit déjà en toutes lettres : « aucune
	 * implémentation ne peut reproduire la valeur de la maquette : la comparer
	 * mesurerait le générateur, pas la vue ». Le masque couvre les PIXELS ;
	 * l'instantané ARIA du niveau 1, lui, porte encore la valeur des deux
	 * côtés. C'est un manque d'instrument, déclaré au rapport de lot — jamais
	 * une raison de figer la valeur ici, ce qui ferait de ce générateur une
	 * suite prévisible.
	 */
	const MOTS_DE_PASSE: readonly string[] = [
		'ancre',
		'brique',
		'cordon',
		'dune',
		'ferme',
		'givre',
		'hamac',
		'ilot',
		'jonc',
		'lisse',
		'menthe',
		'noyau',
		'orage',
		'pivot',
		'roseau',
		'sillon'
	];

	function motDePasse(): string {
		const t: string[] = [];
		for (let i = 0; i < 3; i++) t.push(MOTS_DE_PASSE[Math.floor(Math.random() * 16)] ?? '');
		return `${t.join('-')}-${Math.floor(Math.random() * 90) + 10}`;
	}

	/* ── L'état, tel que le vecteur de planche le décrit ───────────────────
	   Le panneau et les boîtes ne s'ouvrent que si la position DÉVIE du
	   réglage par défaut (`V-32:3337`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const casMdp = $derived(reglage['c-mdp'] === true);
	const casDes = $derived(reglage['c-des'] === true);

	/**
	 * LE COMPTE DONT « MODIFIER » A OUVERT LE PANNEAU — `ouvrirForm(c)` du gel
	 * (`V-32:3107`).
	 *
	 * `null` AU RENDU SERVEUR, exactement comme `demandeDeDesactivation` plus
	 * bas : l'écran reste celui que le vecteur décrit tant que personne n'a
	 * cliqué, et les sept positions de planche ne bougent pas d'un pixel.
	 *
	 * La vue tient cet état parce que le gel le tenait — `edite` est une variable
	 * de son script, pas un paramètre d'adresse : `docs/routes.md` §3.6 ne déclare
	 * aucun état adressable pour le panneau de formulaire, et lui en inventer un
	 * serait combler.
	 */
	let demandeDEdition = $state<string | null>(null);

	/**
	 * `ouvrirForm(null)` DU GEL (`V-32:3216`) — « Nouveau compte » a été cliqué.
	 *
	 * `false` AU RENDU SERVEUR, comme `demandeDEdition` : les sept positions de
	 * planche rendent exactement ce qu'elles rendaient, et la position `creation`
	 * du vecteur continue d'ouvrir le panneau par `form`.
	 */
	let demandeDeCreation = $state(false);

	/** Le rôle retenu dans le sélecteur, tant que le panneau est ouvert. */
	let roleChoisi = $state<RoleDeCompte | null>(null);

	/**
	 * LES DEUX BLOCS D'ERREUR DU FORMULAIRE — `marquer()` du gel (`V-32:3186`).
	 *
	 * `erreurIdent` porte le TEXTE parce que le gel en écrit trois différents
	 * dans `#erreur-ident-txt` ; `erreurNom` n'est qu'un drapeau parce que le
	 * message de `#erreur-nom` est ÉCRIT EN DUR dans le balisage gelé
	 * (`V-32:1364`) — le reproduire depuis le serveur en ferait une seconde
	 * source pour la même phrase.
	 *
	 * Les deux valent leur état de repos au rendu serveur : les blocs restent
	 * `hidden` et `#champ-ident` ne porte aucun `data-etat`, ce qui est le gel.
	 */
	let erreurIdent = $state<string | null>(null);
	let erreurNom = $state(false);

	function ouvrirLeFormulaire(identifiant: string): void {
		demandeDEdition = identifiant;
		demandeDeCreation = false;
		roleChoisi = null;
		effacerLesErreurs();
	}

	/** `ouvrirForm(null)` — le panneau s'ouvre vide, sur un mot de passe frais. */
	function ouvrirLaCreation(): void {
		demandeDEdition = null;
		demandeDeCreation = true;
		roleChoisi = null;
		motDePasseSaisi = motDePasse();
		effacerLesErreurs();
	}

	/** `marquer(k, null)` du gel, pour les deux champs à la fois (`V-32:3134`). */
	function effacerLesErreurs(): void {
		erreurIdent = null;
		erreurNom = false;
	}

	/** `fermerForm()` du gel (`V-32:3225`) — l'écran revient à sa liste. */
	function fermerLeFormulaire(): void {
		demandeDEdition = null;
		demandeDeCreation = false;
		roleChoisi = null;
		motDePasseSaisi = null;
		effacerLesErreurs();
	}

	/**
	 * « NOUVEAU COMPTE » OUVRE LE PANNEAU — `V-32:3217` :
	 * `document.getElementById("creer").addEventListener("click", …)`.
	 *
	 * L'ÉCOUTEUR EST POSÉ SUR LE NŒUD, PAS ÉCRIT DANS LE BALISAGE, et ce n'est pas
	 * un contournement : `#creer` est rendu par `BoutonDeCreation.svelte`, commun
	 * aux six vues à panneau de formulaire, et qui ne prend aucun comportement en
	 * propriété. Lui en ajouter une changerait les cinq autres vues ; le geste du
	 * gel, lui, ne touche que celle-ci.
	 *
	 * `$effect` NE COURT QU'AU NAVIGATEUR : le rendu serveur — donc le banc — ne
	 * le traverse jamais, et pas un pixel ne bouge de son fait. C'est la même
	 * construction que l'effet de `#dlg-desactiver`, plus bas.
	 */
	$effect(() => {
		const bouton = document.getElementById('creer');
		if (bouton === null) return;
		bouton.addEventListener('click', ouvrirLaCreation);
		return () => bouton.removeEventListener('click', ouvrirLaCreation);
	});

	const panneauOuvert = $derived(form !== 'ferme' || demandeDEdition !== null || demandeDeCreation);

	/**
	 * Le compte édité : celui que « Modifier » désigne, sinon « Karim Belhadj »
	 * pour la position `edition` et le premier administrateur actif pour `admin`
	 * (`V-32:3342`).
	 */
	const edite = $derived<CompteRendu | null>(
		demandeDeCreation
			? null
			: demandeDEdition !== null
				? (comptes.find((c) => c.compte.identifiant === demandeDEdition) ?? null)
				: form === 'edition'
					? (comptes.find((c) => c.compte.identifiant === 'karim.belhadj') ?? null)
					: form === 'admin'
						? (administrateurs[0] ?? null)
						: null
	);
	const nouveau = $derived(form === 'creation' || demandeDeCreation);
	const dernierAdminEdite = $derived(edite !== null && estDernierAdmin(edite));

	/** Le rôle porté par le sélecteur, et l'aide qui va avec (`V-32:3136`). */
	const roleCourant = $derived<RoleDeCompte>(
		roleChoisi ?? (edite ? edite.compte.role : 'Contributeur')
	);
	const aideDuRole = $derived(ROLES.find((r) => r.cle === roleCourant)?.aide ?? '');

	/**
	 * LE MOT DE PASSE INITIAL, ET POURQUOI IL EST UN ÉTAT PLUTÔT QU'UN DÉRIVÉ.
	 *
	 * `#regenerer` du gel (`V-32:3213`) en tire un autre sans que rien d'autre ne
	 * change à l'écran : un dérivé ne se recalculerait pas, faute de dépendance
	 * modifiée. L'état porte donc la valeur DEMANDÉE, et le dérivé ci-dessous
	 * garde le comportement d'origine tant que personne n'a rien demandé — au
	 * rendu serveur, `motDePasseSaisi` vaut `null` et la position `creation` de la
	 * planche rend exactement ce qu'elle rendait.
	 */
	let motDePasseSaisi = $state<string | null>(null);
	const motDePasseInitial = $derived(motDePasseSaisi ?? (nouveau ? motDePasse() : ''));

	/**
	 * LE COMPTE QUI VIENT D'ÊTRE CRÉÉ — `afficherMotDePasse(nom, mdp, true)` du
	 * gel (`V-32:3196`), qui ouvre `#dlg-mdp` sur son mot de passe initial.
	 *
	 * LA VALEUR VIENT DU NAVIGATEUR, JAMAIS DU SERVEUR. C'est cette page qui l'a
	 * engendrée et envoyée ; la base n'en garde que le condensat Argon2id, et
	 * aucune réponse d'action ne la reporte. L'avertissement du gel dit
	 * exactement cela : « il n'est pas conservé en clair et ne pourra plus être
	 * consulté, ni par vous, ni par personne » (`V-32:1428`).
	 *
	 * `null` au rendu serveur : la boîte reste celle que le vecteur décrit.
	 */
	let compteCree = $state<{ readonly nom: string; readonly motDePasse: string } | null>(null);

	/**
	 * LES SEPT CHAMPS SONT RELUS SUR LE DOCUMENT AU CLIC, comme le gel les relit
	 * (`V-32:3175-3201`, `getElementById(...).value`), et pour la même raison :
	 * aucun de ces nœuds n'est lié à un état — ils portent la valeur INITIALE que
	 * le rendu leur a donnée, et la frappe de l'utilisateur ne vit que dans le
	 * document. Y ajouter des liaisons ferait un second état pour la même donnée.
	 */
	function valeurDe(id: string): string {
		const noeud = document.getElementById(id);
		return noeud instanceof HTMLInputElement || noeud instanceof HTMLSelectElement
			? noeud.value
			: '';
	}

	function estCoche(id: string): boolean {
		const noeud = document.getElementById(id);
		return noeud instanceof HTMLInputElement && noeud.checked;
	}

	/**
	 * « CRÉER LE COMPTE » — le geste de `V-32:3174-3197`, moins la validation.
	 *
	 * LA VALIDATION N'EST PAS REFAITE ICI, ET C'EST DÉLIBÉRÉ. Le gel valide au
	 * navigateur parce qu'il n'a pas de serveur ; le produit en a un, et c'est lui
	 * qui décide — il est le seul à savoir si un identifiant est déjà pris. Écrire
	 * les mêmes trois conditions des deux côtés ferait deux définitions d'une même
	 * règle, dont l'une finirait par diverger : c'est la faute que `P-01` nomme
	 * pour la fraîcheur. Les MESSAGES, eux, restent ceux du gel — ils viennent du
	 * verdict, qui les transcrit.
	 */
	async function creerLeCompte(): Promise<void> {
		if (onCreerUnCompte === undefined) {
			fermerLeFormulaire();
			return;
		}
		const nom = valeurDe('f-nom').trim();
		const motDePasseEnvoye = valeurDe('f-mdp');
		const issue = await onCreerUnCompte({
			identifiant: valeurDe('f-ident'),
			nom,
			courriel: valeurDe('f-courriel'),
			motDePasse: motDePasseEnvoye,
			role: roleCourant,
			domaine: valeurDe('f-domaine'),
			motDePasseVerrouille: estCoche('f-verrou')
		});
		if (issue.cree) {
			compteCree = { nom, motDePasse: motDePasseEnvoye };
			fermerLeFormulaire();
			return;
		}
		/* `marquer()` du gel, dans les deux polarités : un champ que le refus ne
		   nomme pas est un champ dont la marque est RETIRÉE (`V-32:3186`). */
		erreurIdent = issue.erreurs.find((e) => e.champ === 'ident')?.message ?? null;
		erreurNom = issue.erreurs.some((e) => e.champ === 'nom');
	}

	/**
	 * LE COMPTE DONT LE MOT DE PASSE VIENT D'ÊTRE REMPLACÉ, et la valeur qui l'a
	 * remplacé. `null` au rendu serveur : l'écran reste celui que le vecteur
	 * décrit tant que personne n'a cliqué.
	 */
	let reinitialise = $state<{ readonly compte: CompteRendu; readonly motDePasse: string } | null>(
		null
	);

	/**
	 * `reinitialiser(c)` du gel (`V-32:3228`) — la valeur est engendrée ICI, puis
	 * envoyée. La boîte ne s'ouvre qu'une fois l'écriture faite : ouvrir d'abord
	 * annoncerait un mot de passe que la base n'a peut-être pas accepté.
	 */
	async function reinitialiserLeMotDePasse(c: CompteRendu): Promise<void> {
		const clair = motDePasse();
		if (onReinitialiserLeMotDePasse === undefined) {
			reinitialise = { compte: c, motDePasse: clair };
			return;
		}
		const fait = await onReinitialiserLeMotDePasse({
			identifiant: c.compte.identifiant,
			motDePasse: clair
		});
		if (fait) reinitialise = { compte: c, motDePasse: clair };
	}

	/**
	 * « COPIER LE MOT DE PASSE » — `V-32:3243`, et le libellé qui accuse réception.
	 *
	 * LE PRESSE-PAPIERS PEUT MANQUER, et le gel le prévoit : sans lui, le libellé
	 * change quand même. C'est délibéré de sa part — l'utilisateur voit la valeur,
	 * il peut la recopier à la main, et un bouton qui ne réagit pas laisserait
	 * croire à une panne. Les deux issues de la promesse mènent au même libellé.
	 */
	const LIBELLE_DE_COPIE = 'Copier le mot de passe';
	let libelleDeCopie = $state(LIBELLE_DE_COPIE);

	function copierLeMotDePasse(): void {
		const valeur = document.getElementById('mdp-valeur')?.textContent ?? '';
		const fini = (): void => {
			libelleDeCopie = 'Copié dans le presse-papiers';
		};
		if (navigator.clipboard) void navigator.clipboard.writeText(valeur).then(fini, fini);
		else fini();
	}

	/** `mdp` réinitialise le premier compte du jeu — `comptes[0]` (`V-32:3345`). */
	const compteReinitialise = $derived(reinitialise?.compte ?? (casMdp ? comptes[0] : null));
	const motDePasseAffiche = $derived(reinitialise?.motDePasse ?? (casMdp ? motDePasse() : '—'));

	/**
	 * LE COMPTE DONT LA DÉSACTIVATION EST EXAMINÉE.
	 *
	 * `null` au rendu serveur : l'écran reste celui que le vecteur décrit tant que
	 * personne n'a cliqué. C'est `demanderDesactivation(c)` du gel
	 * (`V-32:3264`), rendu à la vue qui le transcrit.
	 *
	 * LA RÉACTIVATION N'OUVRE PAS DE DIALOGUE, et c'est le gel qui en décide :
	 * `V-32:3067` réactive directement — elle ne retire aucun accès, il n'y a rien
	 * à confirmer.
	 */
	let demandeDeDesactivation = $state<string | null>(null);

	/** `des` désactive le premier compte actif non administrateur (`V-32:3348`). */
	const compteDesactive = $derived(
		demandeDeDesactivation !== null
			? (comptes.find((c) => c.compte.identifiant === demandeDeDesactivation) ?? null)
			: casDes
				? (comptes.find((c) => c.compte.actif && c.compte.role !== 'Administrateur') ?? null)
				: null
	);

	/**
	 * `showModal()` — ET `boite.open` NE SUFFIT PAS À LE DÉCIDER. La vue rend
	 * `<dialog open={…}>` : Svelte pose l'attribut avant que cet effet ne coure,
	 * la garde sur `open` renonce, et la boîte reste ouverte SANS être modale —
	 * dans le flux, sans couche supérieure, donc recouvrable par le tiroir de
	 * formulaire. `:modal` pose la seule question qui vaille. Le raisonnement
	 * complet est à l'effet homologue de `V-31`.
	 */
	$effect(() => {
		const boite = document.getElementById('dlg-desactiver');
		if (!(boite instanceof HTMLDialogElement)) return;
		if (compteDesactive === null) {
			if (boite.open) boite.close();
			return;
		}
		if (boite.matches(':modal')) return;
		if (boite.open) boite.close();
		boite.showModal();
	});
	const refusDeDesactivation = $derived(
		compteDesactive !== null && estDernierAdmin(compteDesactive)
	);
</script>

<Coquille
	forme="abregee"
	role="admin"
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	fil={filDeConsole('Comptes')}
	donnees={{ 'data-form': panneauOuvert ? 'ouvert' : 'ferme' }}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
>
	{#snippet avantContenu()}
		<NavigationConsole courante="comptes" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Comptes"
			description="Les accès à l'instance. Un compte désactivé conserve ses contributions : les notes qu'il a écrites restent à son nom, et l'historique des vérifications n'est pas réécrit."
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau compte" />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--comptes tg--entetes" role="row">
				<span></span>
				<span>Nom et identifiant</span>
				<span class="tg--reduit">Rôle</span>
				<span class="tg--masquable">Domaine</span>
				<span class="tg--masquable">Dernière connexion</span>
				<span></span>
			</div>
			<div id="liste">
				<!--
					LA CLÉ EST L'IDENTIFIANT DE CONNEXION, ET NON `id` — UN DÉFAUT MESURÉ.

					`c.compte.id` était la clé. Elle vaut `undefined` pour tout compte venu
					de la base : `lireComptes()` omet `id` PAR DÉCISION, et le dit —
					« `comptes.identifiant` porte déjà l'identifiant de connexion que
					CDC:1178 énumère […] la table a bien un `id`, mais c'est un UUID tiré au
					hasard ».

					Cinq clés `undefined` font `each_key_duplicate`, et Svelte ABANDONNE
					L'HYDRATATION DE LA PAGE ENTIÈRE : plus un seul écouteur n'était posé,
					sur aucun écran de cette route. Le rendu serveur restait juste, ce qui
					rendait le défaut invisible à l'œil — c'est la sonde qui l'a nommé.

					`identifiant` est unique par contrainte (`comptes_identifiant_unique`),
					présent au jeu de semence comme en base, et stable : c'est la clé.
				-->
				{#each listeTriee as c (c.compte.identifiant)}
					{@const marques = !c.compte.actif || c.verrouille || estDernierAdmin(c)}
					<div class="tg tg--comptes tg--ligne" data-actif={c.compte.actif ? 'oui' : 'non'}>
						<span class="avatar-c">{initiales(c.compte.nom)}</span>
						<div style="min-width:0">
							<div class="tg__nom">{c.compte.nom}</div>
							<div class="tg__ident">{c.compte.identifiant}</div>
							{#if marques}<div class="tg__marques">
									{#if !c.compte.actif}<span class="past past--desactive">désactivé</span
										>{/if}{#if c.verrouille}<span class="past past--verrou"
											>mot de passe verrouillé</span
										>{/if}{#if estDernierAdmin(c)}<span class="past past--systeme"
											>seul administrateur</span
										>{/if}
								</div>{/if}
						</div>
						<span
							class="past tg--reduit"
							class:past--admin={c.compte.role === 'Administrateur'}
							style="justify-self:start">{c.compte.role}</span
						>
						<span class="tg__n tg--masquable">{c.compte.domaine}</span>
						<span
							class="tg__n tg--masquable"
							style={c.compte.actif ? undefined : 'color:var(--c-encre-4)'}
							>{c.compte.derniere}</span
						>
						<div class="tg__actions">
							<button
								class="btn"
								type="button"
								onclick={() => ouvrirLeFormulaire(c.compte.identifiant)}>Modifier</button
							>
							{#if c.compte.actif}<button
									class="btn"
									type="button"
									aria-label="Réinitialiser le mot de passe de {c.compte.nom}"
									title="Réinitialiser le mot de passe"
									onclick={() => void reinitialiserLeMotDePasse(c)}
									><svg
										width="14"
										height="14"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										><rect x="3" y="7" width="10" height="6.5" rx="1.3" /><path
											d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
										/></svg
									></button
								>{/if}
							<button
								class="btn"
								class:btn--destructif={c.compte.actif}
								type="button"
								onclick={() => {
									if (c.compte.actif) demandeDeDesactivation = c.compte.identifiant;
									else
										onChangerLActivation?.({
											identifiant: c.compte.identifiant,
											actif: true
										});
								}}>{c.compte.actif ? 'Désactiver' : 'Réactiver'}</button
							>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de compte">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">
						{edite ? edite.compte.nom : 'Nouveau compte'}
					</h2>
					<div class="tiroir-form__sous" id="form-sous">
						{#if edite}{#if edite.compte.actif}Dernière connexion {edite.compte
									.derniere}.{:else}Compte désactivé — ses contributions restent à son nom.{/if}{:else}L'utilisateur
							devra changer son mot de passe à la première connexion.{/if}
					</div>
				</div>
				<button
					class="tiroir-form__fermer"
					id="form-fermer"
					aria-label="Fermer le formulaire"
					onclick={fermerLeFormulaire}
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</button>
			</div>

			<div class="tiroir-form__corps">
				<div id="avert-form">
					{#if dernierAdminEdite && edite}<div class="refus">
							<div class="refus__titre">Le rôle d'administrateur ne peut pas être retiré</div>
							<div class="refus__sortie">
								« {edite.compte.nom} » est le seul administrateur actif de l'instance. Le retirer fermerait
								définitivement l'accès à la console — plus personne ne pourrait créer de domaine, gérer
								les comptes, ni rendre ce rôle à quiconque. Nommez d'abord un second administrateur :
								le sélecteur se déverrouillera aussitôt.
							</div>
						</div>{/if}
				</div>

				<div class="champ" id="champ-ident" data-etat={erreurIdent === null ? undefined : 'erreur'}>
					<label class="champ__label" for="f-ident">Identifiant <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-ident"
						autocomplete="off"
						spellcheck="false"
						autocapitalize="none"
						placeholder="prenom.nom"
						value={edite ? edite.compte.identifiant : ''}
						disabled={edite !== null}
					/>
					<span class="champ__aide" id="aide-ident"
						>{#if edite}L'identifiant est définitif : le modifier casserait l'attribution de ses
							contributions passées.{:else}Sert à se connecter. Il ne pourra plus être modifié
							ensuite.{/if}</span
					>
					<div class="champ__erreur" id="erreur-ident" hidden={erreurIdent === null}>
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							style="flex:none;margin-top:1px"
							><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<span id="erreur-ident-txt">{erreurIdent ?? ''}</span>
					</div>
				</div>

				<div class="champ" id="champ-nom" data-etat={erreurNom ? 'erreur' : undefined}>
					<label class="champ__label" for="f-nom">Nom affiché <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-nom"
						autocomplete="off"
						placeholder="Prénom Nom"
						value={edite ? edite.compte.nom : ''}
					/>
					<span class="champ__aide">Apparaît sur les notes et dans l'activité.</span>
					<div class="champ__erreur" id="erreur-nom" hidden={!erreurNom}>
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							style="flex:none;margin-top:1px"
							><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						Donnez un nom affiché.
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-courriel">Adresse électronique</label>
					<input
						class="saisie"
						type="email"
						id="f-courriel"
						autocomplete="off"
						placeholder="prenom.nom@exemple.fr"
						value={edite ? edite.compte.courriel : ''}
					/>
					<span class="champ__aide"
						>Sert aux notifications et à la réinitialisation autonome du mot de passe.</span
					>
				</div>

				<div class="champ" id="champ-mdp" hidden={edite !== null}>
					<label class="champ__label" for="f-mdp"
						>Mot de passe initial <span class="oblig">*</span></label
					>
					<div class="champ__boite">
						<input
							class="saisie"
							type="text"
							id="f-mdp"
							autocomplete="off"
							spellcheck="false"
							value={motDePasseInitial}
						/>
						<button
							class="champ__action"
							type="button"
							id="regenerer"
							aria-label="Générer un autre mot de passe"
							title="Générer un autre"
							onclick={() => (motDePasseSaisi = motDePasse())}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" /><path d="M2 2.5v3.6h3.6" /></svg
							>
						</button>
					</div>
					<span class="champ__aide"
						>Généré automatiquement. Il devra être changé à la première connexion.</span
					>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-role">Rôle <span class="oblig">*</span></label>
					<select
						class="selecteur"
						id="f-role"
						disabled={dernierAdminEdite}
						onchange={(evenement) => {
							roleChoisi = evenement.currentTarget.value as RoleDeCompte;
						}}
						>{#if panneauOuvert}{#each ROLES as r (r.cle)}<option
									value={r.cle}
									selected={r.cle === roleCourant}>{r.cle}</option
								>{/each}{/if}</select
					>
					<span class="champ__aide" id="aide-role"
						>{#if panneauOuvert}{aideDuRole}{:else}Le rôle détermine ce que le compte peut faire,
							indépendamment du domaine.{/if}</span
					>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-domaine">Domaine principal</label>
					<select class="selecteur" id="f-domaine"
						>{#if panneauOuvert}{#each domaines as d (d.nom)}<option
									value={d.nom}
									selected={d.nom === (edite ? edite.compte.domaine : PREMIER_DOMAINE)}
									>{d.univers} › {d.nom}</option
								>{/each}{/if}</select
					>
					<span class="champ__aide"
						>Détermine son périmètre de contribution et ce qu'il voit à l'accueil.</span
					>
				</div>

				<div class="champ" id="champ-verrou">
					<label class="case" style="align-items:flex-start">
						<input type="checkbox" id="f-verrou" checked={edite ? edite.verrouille : false} />
						<span class="case__txt"
							>Mot de passe verrouillé
							<span class="case__aide"
								>Le compte ne pourra pas changer son mot de passe lui-même : seule l'administration
								le fera. Réservé aux comptes de démonstration et aux accès partagés.</span
							>
						</span>
					</label>
				</div>
			</div>

			<!--
				LE PIED DU PANNEAU — les trois boutons du gel, câblés comme
				`V-32:3232-3235` et `V-32:3238` les câblent.

				AUCUN N'EST DANS UN FORMULAIRE, et aucun ne porte donc `type` : le gel
				n'en pose pas, et le danger d'un bouton sans type — soumettre — n'existe
				qu'à l'intérieur d'un `<form>`, qui n'existe pas ici.

				« CRÉER LE COMPTE » PORTE DÉSORMAIS `UC-M14-07`, et le bouton fait donc
				DEUX choses selon l'état du panneau : sur un compte existant il rend le
				rôle choisi (`RG-M14-07`), sur un panneau vide il rend la demande de
				création. C'est le partage du gel lui-même, dont le seul écouteur
				branche sur `edite.nouveau` (`V-32:3184`).

				SANS RAPPEL DE CRÉATION — le cas des planches, qui n'ont ni route ni
				action derrière elles —, il ferme le panneau sans rien envoyer.
			-->
			<div class="tiroir-form__pied">
				<button
					class="btn btn--destructif"
					id="form-desactiver"
					hidden={edite === null || !edite.compte.actif}
					onclick={() => {
						if (edite !== null) demandeDeDesactivation = edite.compte.identifiant;
					}}>Désactiver</button
				>
				<button class="btn" id="form-annuler" onclick={fermerLeFormulaire}>Annuler</button>
				<button
					class="btn btn--principal"
					id="form-valider"
					onclick={() => {
						if (edite === null) {
							void creerLeCompte();
							return;
						}
						onEnregistrerLeRole?.({ identifiant: edite.compte.identifiant, role: roleCourant });
						fermerLeFormulaire();
					}}><span id="form-valider-txt">{edite ? 'Enregistrer' : 'Créer le compte'}</span></button
				>
			</div>
		</aside>

		<!--
			LA MÊME BOÎTE SERT LES DEUX GESTES, ET C'EST LE GEL QUI LE DÉCIDE :
			`afficherMotDePasse(nom, mdp, creation)` (`V-32:3235`) n'ouvre qu'un
			dialogue, et son troisième paramètre change le titre et la phrase — rien
			d'autre. Les deux textes ci-dessous en sont la transcription.
		-->
		<dialog
			class="dlg"
			id="dlg-mdp"
			aria-labelledby="dlg-mdp-titre"
			open={casMdp || compteCree !== null || reinitialise !== null}
		>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><rect x="3" y="7" width="10" height="7" rx="1.4" /><path
								d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
							/></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-mdp-titre">
						{compteCree ? 'Compte créé' : 'Mot de passe réinitialisé'}
					</h2>
				</div>
				<div class="dlg__corps">
					<!--
						LA RÉGION EST SOUSTRAITE AU FORMATEUR, ET LA RAISON EST MESURÉE
						(`P-6`). Le reflux du formateur déplace les blancs À L'INTÉRIEUR du
						texte : la branche de RÉINITIALISATION — celle que la position de
						planche `c-mdp` rend — ne sortait plus les mêmes octets qu'avant ce
						lot, sur une phrase pourtant inchangée. La branche est donc écrite
						exactement comme elle l'était, retours de ligne compris.
					-->
					<!-- prettier-ignore -->
					<p class="dlg__texte" id="mdp-qui">
						{#if compteCree}Le compte de {compteCree.nom} est créé. Voici son mot de passe initial.{:else if compteReinitialise}Le mot de passe de {compteReinitialise.compte.nom} a été remplacé.
							L'ancien ne fonctionne plus.{:else}—{/if}
					</p>

					<!--
						L'avertissement précède la valeur : il faut savoir qu'on ne la
						reverra pas avant de fermer la boîte, pas après.
					-->
					<div class="avert-unique">
						<svg
							width="18"
							height="18"
							viewBox="0 0 16 16"
							fill="none"
							stroke="var(--c-alerte)"
							stroke-width="1.7"
							style="flex:none;margin-top:1px"
							><path d="M8 5.5v3.5M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<div>
							<b>Ce mot de passe est affiché une seule fois.</b> Il n'est pas conservé en clair et ne
							pourra plus être consulté, ni par vous, ni par personne. Si vous fermez cette boîte sans
							l'avoir transmis, il faudra en générer un autre.
						</div>
					</div>

					<div class="mdp-unique">
						<!-- prettier-ignore -->
						<div class="mdp-unique__valeur" id="mdp-valeur">{compteCree ? compteCree.motDePasse : motDePasseAffiche}</div>
						<button class="btn btn--principal" id="mdp-copier" onclick={copierLeMotDePasse}>
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
									d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
								/></svg
							>
							<span id="mdp-copier-txt">{libelleDeCopie}</span>
						</button>
					</div>

					<p class="transmettre">
						Transmettez-le par un canal distinct de l'adresse électronique du compte — de vive voix,
						par téléphone, ou par messagerie interne. Le compte devra le changer à sa première
						connexion.
					</p>
				</div>
				<div class="dlg__pied">
					<!--
						« J'AI NOTÉ LE MOT DE PASSE » — le gel ferme la boîte ET EFFACE LA
						VALEUR du document (`V-32:3255`) : « elle ne doit pas rester
						récupérable dans la page ». Ici, `compteCree` remis à `null` fait
						les deux d'un coup, et le rappel demande à la page de se relire —
						c'est ainsi que le compte créé rejoint la liste.
					-->
					<button
						class="btn btn--principal"
						id="mdp-fermer"
						onclick={() => {
							const avaitCree = compteCree !== null;
							compteCree = null;
							reinitialise = null;
							libelleDeCopie = LIBELLE_DE_COPIE;
							if (avaitCree) onMotDePasseTransmis?.();
						}}>J'ai noté le mot de passe</button
					>
				</div>
			</div>
		</dialog>

		<dialog class="dlg" id="dlg-desactiver" aria-labelledby="dlg-des-titre" open={casDes}>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true" style="background:var(--c-alerte)">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><circle cx="8" cy="8" r="6.2" /><path d="M4 12L12 4" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-des-titre">Désactiver le compte</h2>
					<button
						class="dlg__fermer"
						data-fermer
						aria-label="Fermer"
						onclick={() => (demandeDeDesactivation = null)}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<div class="dlg__corps" id="des-corps">
					{#if compteDesactive}{#if refusDeDesactivation}<div class="refus">
								<div class="refus__titre">Désactivation refusée</div>
								<div class="refus__sortie">
									« {compteDesactive.compte.nom} » est le seul administrateur actif. Désactiver ce compte
									rendrait la console inaccessible et sans recours. Nommez un second administrateur avant
									de revenir ici.
								</div>
							</div>{:else}{@const n = contributions(compteDesactive.compte.nom)}
							<p class="dlg__texte">
								« {compteDesactive.compte.nom} » ne pourra plus se connecter. Ses sessions ouvertes sont
								fermées immédiatement.
							</p>
							<div class="contexte contexte--succes" style="margin:0">
								<span class="contexte__marque" aria-hidden="true">✓</span>
								<div>
									<div class="contexte__titre">Ses contributions sont conservées</div>
									<div>
										{#if n}Les {n} notes écrites par {compteDesactive.compte.nom} restent à son nom, et
											l'historique des vérifications n'est pas réécrit. Désactiver n'efface rien : c'est
											ce qui permet de savoir, dans deux ans, qui avait rédigé quoi.{:else}Aucune
											note n'est attribuée à ce compte. Rien ne sera réécrit.{/if}
									</div>
								</div>
							</div>
							<p class="dlg__texte">
								La désactivation est réversible : le compte pourra être réactivé depuis cette liste,
								avec un nouveau mot de passe.
							</p>{/if}{/if}
				</div>
				<div class="dlg__pied">
					<button
						class="btn"
						data-fermer
						id="des-annuler"
						onclick={() => (demandeDeDesactivation = null)}
						>{refusDeDesactivation ? 'Fermer' : 'Annuler'}</button
					>
					<button
						class="btn btn--principal btn--destructif"
						id="des-valider"
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						hidden={refusDeDesactivation}
						onclick={() => {
							if (compteDesactive === null || refusDeDesactivation) return;
							onChangerLActivation?.({
								identifiant: compteDesactive.compte.identifiant,
								actif: false
							});
						}}>Désactiver</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
