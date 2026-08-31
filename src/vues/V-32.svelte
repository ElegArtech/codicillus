<script lang="ts">
	/**
	 * V-32 — Console · Comptes. Route `/console/comptes` (`docs/routes.md` §3.6).
	 *
	 * Coquille de forme abrégée, enveloppe `console`. `src/lib/console/` porte les
	 * classes communes aux dix vues de console ; celles de V-32 lui sont propres, et
	 * AUCUNE FACTORISATION AU-DELÀ n'est permise.
	 *
	 * Seule vue à DEUX BOÎTES DISTINCTES — `#dlg-mdp` et `#dlg-desactiver`. Aucun
	 * `autofocus` : `showModal()` focalise déjà le premier focalisable de chacune.
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL HORS DE `div.app` : le déplacement
	 * qui rend la règle gelée applicable est fait par la ROUTE, au montage
	 * (`cablerLeTiroirDeFormulaire()` de `src/routes/console/cablage.ts`).
	 *
	 * LES ÉTATS DE RÔLE ET DE DROIT SONT DES ÉTATS DE PLANCHE, PAS UNE FRONTIÈRE DE
	 * SÉCURITÉ. Aucun chiffre n'est saisi, et aucun geste du script du gel n'a lieu
	 * au rendu serveur : les états qui les portent partent de `null`.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-32.css`.
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import { accord } from '$lib/vocabulaire';
	import type {
		Compte,
		Domaine,
		Note,
		RoleDeCompte,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		compte: UtilisateurCourant;
		comptes: readonly Compte[];
		/**
		 * `comptes.mot_de_passe_verrouille`, PAR IDENTIFIANT DE CONNEXION. `interface
		 * Compte` n'en porte pas de champ : la vue lisait le verrou sur un identifiant
		 * du jeu de démonstration écrit en dur, et la pastille ne s'allumait pour
		 * personne. Identifiant absent de la table : non verrouillé.
		 */
		verrous: Readonly<Record<string, boolean>>;
		/**
		 * CE QUE LA VUE FAIT QUAND LA DÉSACTIVATION EST CONFIRMÉE, ou quand un compte
		 * est réactivé. Même partage qu'en `V-27`, `V-28` et `V-29` : la vue tient
		 * l'état de son dialogue, la page tient le réseau. `actif` PORTE L'ÉTAT VOULU,
		 * pas une bascule : deux administrateurs qui cliquent en même temps ne doivent
		 * pas s'annuler l'un l'autre.
		 */
		onChangerLActivation?: (compte: {
			readonly identifiant: string;
			readonly actif: boolean;
		}) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND « ENREGISTRER » EST CLIQUÉ — `RG-M14-07`. La vue
		 * tient l'état de son panneau, la page tient le réseau et l'action, comme
		 * `V-32:3199` le fait au clic. Absente, le panneau se ferme sans rien envoyer.
		 *
		 * SEUL LE RÔLE VOYAGE. Le gel enregistre aussi le nom, le courriel, le domaine
		 * et le verrouillage (`V-32:3214-3218`) ; `RG-M14-07` est la seule de ces
		 * écritures dont l'action de route existe. Les quatre autres sont REMONTÉES,
		 * pas comblées : envoyer un champ qu'aucune action ne lit ferait croire à un
		 * enregistrement qui n'a pas lieu.
		 */
		onEnregistrerLeRole?: (demande: {
			readonly identifiant: string;
			readonly role: RoleDeCompte;
		}) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND « CRÉER LE COMPTE » EST CLIQUÉ — `UC-M14-07`. La vue
		 * relève les sept nœuds de son panneau et rend la demande ; la page tient le
		 * réseau. ELLE REND UNE PROMESSE, ET C'EST LA SEULE DES TROIS : un refus
		 * s'affiche DANS le formulaire — `#erreur-ident` et `#erreur-nom`, révélés par
		 * `marquer()` (`V-32:3186`) — et un succès ouvre `#dlg-mdp`.
		 *
		 * DEUX CHAMPS SEULEMENT SAVENT PORTER UN MESSAGE : un refus d'une autre nature
		 * n'avait nulle part où se dire, le panneau restait ouvert et l'utilisateur
		 * croyait avoir enregistré. `message` porte ce refus-là.
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
			/** Le refus qu'aucun des deux blocs du gel ne sait porter. */
			readonly message?: string | null;
		}>;
		/**
		 * CE QUE LA VUE FAIT QUAND LE MOT DE PASSE A ÉTÉ NOTÉ — `#mdp-fermer`. Le gel
		 * efface la valeur du document en même temps qu'elle quitte l'écran
		 * (`V-32:3255`) : « elle ne doit pas rester récupérable dans la page ». Ce
		 * rappel fait relire la page et efface la valeur par la même occasion.
		 */
		onMotDePasseTransmis?: () => void;
		/**
		 * RÉINITIALISER LE MOT DE PASSE — `RG-CPT-01` : « la réinitialisation par un
		 * administrateur reste possible », y compris sur un compte verrouillé.
		 *
		 * LA VUE NE TIRE PLUS LA VALEUR. `reinitialiser(c)` du gel (`V-32:3228`)
		 * l'engendrait au navigateur, avec `Math.random()` sur seize mots — dix-huit
		 * bits d'une suite qui se rejoue, sur la seule porte de secours d'un compte.
		 * Le geste RAPPORTE désormais le mot de passe que le serveur a tiré et
		 * condensé, ou `null` s'il n'a rien écrit : la boîte ne montre que ce qui est
		 * réellement devenu le mot de passe du compte.
		 */
		onReinitialiserLeMotDePasse?: (demande: {
			readonly identifiant: string;
		}) => Promise<string | null>;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte,
		comptes: registreDeComptes,
		verrous,
		onChangerLActivation,
		onEnregistrerLeRole,
		onCreerUnCompte,
		onMotDePasseTransmis,
		onReinitialiserLeMotDePasse
	}: Proprietes = $props();

	/** LES QUATRE RÔLES ET LEUR AIDE sont ceux du gel (`V-32:2947`) : la donnée porte
	    le type `RoleDeCompte`, pas la phrase qui dit ce que chacun permet. */
	const ROLES: readonly { cle: RoleDeCompte; aide: string }[] = [
		{ cle: 'Lecteur', aide: 'Consulte, ne modifie rien.' },
		{ cle: 'Contributeur', aide: 'Écrit et modifie les notes de son domaine.' },
		{
			cle: 'Référent',
			aide: 'Contributeur, plus la gestion du rangement et des droits de son domaine.'
		},
		{ cle: 'Administrateur', aide: 'Accès complet, y compris la console et tous les domaines.' }
	];

	/** Le domaine proposé à la création : le premier de la liste (`V-32:3149`). */
	const PREMIER_DOMAINE = $derived(domaines[0]?.nom ?? '');

	interface CompteRendu {
		readonly compte: Compte;
		readonly verrouille: boolean;
	}

	const comptes: readonly CompteRendu[] = $derived(
		registreDeComptes.map((c) => ({
			compte: c,
			verrouille: verrous[c.identifiant] === true
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
	 * LE MOT DE PASSE INITIAL PROPOSÉ À LA CRÉATION — la composition du gel
	 * (`V-32:2975`) : trois mots tirés d'une liste de seize, prononçables et sans
	 * caractère ambigu, puis un nombre à deux chiffres. NE FIGE JAMAIS CETTE VALEUR
	 * pour la faire coïncider avec celle de la maquette : ce générateur deviendrait
	 * une suite prévisible.
	 *
	 * IL NE SERT PLUS À LA RÉINITIALISATION, ET C'EST LE POINT : `Math.random()` sur
	 * seize mots fait dix-huit bits d'une suite qui se rejoue. La valeur posée par
	 * `reinitialiserLeMotDePasse` est tirée par le serveur — voir
	 * `$lib/auth/mot-de-passe-temporaire`. Ici, l'administrateur voit la proposition
	 * dans un champ qu'il peut réécrire avant d'envoyer.
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

	/* L'état, tel que le vecteur de planche le décrit. Le panneau et les boîtes ne
	   s'ouvrent que si la position DÉVIE du réglage par défaut (`V-32:3337`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const casMdp = $derived(reglage['c-mdp'] === true);
	const casDes = $derived(reglage['c-des'] === true);

	/**
	 * LE COMPTE DONT « MODIFIER » A OUVERT LE PANNEAU — `ouvrirForm(c)` du gel
	 * (`V-32:3107`). `null` au rendu serveur. La vue tient cet état parce que le gel
	 * le tenait : `docs/routes.md` §3.6 ne déclare aucun état adressable pour le
	 * panneau, et lui en inventer un serait combler.
	 */
	let demandeDEdition = $state<string | null>(null);

	/**
	 * `ouvrirForm(null)` du gel (`V-32:3216`) — « Nouveau compte » a été cliqué.
	 * `false` au rendu serveur, comme `demandeDEdition`.
	 */
	let demandeDeCreation = $state(false);

	let roleChoisi = $state<RoleDeCompte | null>(null);

	/**
	 * LE VERROU CHOISI DANS LE PANNEAU — `#f-verrou`, suivi parce que TROIS PHRASES
	 * en dépendent : le sous-titre du panneau, l'aide du champ de mot de passe et la
	 * phrase de transmission de la boîte « Compte créé ». « Il devra être changé à la
	 * première connexion » n'est PAS vrai d'un compte verrouillé (`RG-CPT-01`), et
	 * `creerUnCompte()` écrit `motDePasseAChanger: !motDePasseVerrouille`.
	 */
	let verrouChoisi = $state<boolean | null>(null);

	/**
	 * LES DEUX BLOCS D'ERREUR DU FORMULAIRE — `marquer()` du gel (`V-32:3186`).
	 * `erreurIdent` porte le TEXTE parce que le gel en écrit trois différents ;
	 * `erreurNom` n'est qu'un drapeau parce que le message de `#erreur-nom` est écrit
	 * en dur dans le balisage gelé (`V-32:1364`).
	 */
	let erreurIdent = $state<string | null>(null);
	let erreurNom = $state(false);
	/** Le refus qui ne vise ni l'identifiant ni le nom — voir `onCreerUnCompte`. */
	let refusGeneral = $state<string | null>(null);

	function ouvrirLeFormulaire(identifiant: string): void {
		demandeDEdition = identifiant;
		demandeDeCreation = false;
		roleChoisi = null;
		verrouChoisi = null;
		effacerLesErreurs();
	}

	/** `ouvrirForm(null)` — le panneau s'ouvre vide, sur un mot de passe frais. */
	function ouvrirLaCreation(): void {
		demandeDEdition = null;
		demandeDeCreation = true;
		roleChoisi = null;
		verrouChoisi = null;
		motDePasseSaisi = motDePasse();
		effacerLesErreurs();
	}

	/** `marquer(k, null)` du gel, pour les deux champs à la fois (`V-32:3134`). */
	function effacerLesErreurs(): void {
		erreurIdent = null;
		erreurNom = false;
		refusGeneral = null;
	}

	function fermerLeFormulaire(): void {
		demandeDEdition = null;
		demandeDeCreation = false;
		roleChoisi = null;
		verrouChoisi = null;
		motDePasseSaisi = null;
		effacerLesErreurs();
	}

	/**
	 * « NOUVEAU COMPTE » OUVRE LE PANNEAU — `V-32:3217`. L'écouteur est posé sur le
	 * nœud, pas écrit dans le balisage : `#creer` est rendu par
	 * `BoutonDeCreation.svelte`, commun aux six vues à panneau, et lui ajouter une
	 * propriété de comportement changerait les cinq autres.
	 */
	$effect(() => {
		const bouton = document.getElementById('creer');
		if (bouton === null) return;
		bouton.addEventListener('click', ouvrirLaCreation);
		return () => bouton.removeEventListener('click', ouvrirLaCreation);
	});

	const panneauOuvert = $derived(form !== 'ferme' || demandeDEdition !== null || demandeDeCreation);

	/**
	 * Le compte édité : celui que « Modifier » désigne, sinon LE PREMIER DU REGISTRE
	 * SERVI — le gel y nomme un compte de son jeu (`V-32:3342`), et le désigner par
	 * son rang dit la même chose sans écrire un compte de démonstration.
	 */
	const edite = $derived<CompteRendu | null>(
		demandeDeCreation
			? null
			: demandeDEdition !== null
				? (comptes.find((c) => c.compte.identifiant === demandeDEdition) ?? null)
				: form === 'edition'
					? (comptes[0] ?? null)
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

	const verrouCourant = $derived(verrouChoisi ?? (edite ? edite.verrouille : false));

	/** LE MOT DE PASSE INITIAL EST UN ÉTAT PLUTÔT QU'UN DÉRIVÉ : `#regenerer`
	    (`V-32:3213`) en tire un autre sans que rien d'autre ne change à l'écran, et un
	    dérivé ne se recalculerait pas faute de dépendance modifiée. */
	let motDePasseSaisi = $state<string | null>(null);
	const motDePasseInitial = $derived(motDePasseSaisi ?? (nouveau ? motDePasse() : ''));

	/**
	 * LE COMPTE QUI VIENT D'ÊTRE CRÉÉ — `afficherMotDePasse(nom, mdp, true)` du gel
	 * (`V-32:3196`). LA VALEUR VIENT DU NAVIGATEUR, JAMAIS DU SERVEUR : la base n'en
	 * garde que le condensat Argon2id, et l'avertissement du gel le dit (`V-32:1428`).
	 */
	let compteCree = $state<{
		readonly nom: string;
		readonly motDePasse: string;
		/** L'état de `#f-verrou` tel qu'il a été ENVOYÉ, retenu parce que la boîte
		    survit à la fermeture du panneau : la phrase de transmission ne peut plus le
		    relire sur le document. */
		readonly verrouille: boolean;
	} | null>(null);

	/** LES SEPT CHAMPS SONT RELUS SUR LE DOCUMENT AU CLIC, comme le gel les relit
	    (`V-32:3175-3201`) : aucun de ces nœuds n'est lié à un état — y ajouter des
	    liaisons ferait un second état pour la même donnée. */
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
	 * « CRÉER LE COMPTE » — le geste de `V-32:3174-3197`, moins la validation : le
	 * gel valide au navigateur faute de serveur, le produit en a un, et lui seul sait
	 * si un identifiant est déjà pris. Écrire les mêmes conditions des deux côtés
	 * ferait deux définitions d'une même règle. Les MESSAGES restent ceux du gel.
	 */
	async function creerLeCompte(): Promise<void> {
		if (onCreerUnCompte === undefined) {
			fermerLeFormulaire();
			return;
		}
		const nom = valeurDe('f-nom').trim();
		const motDePasseEnvoye = valeurDe('f-mdp');
		const verrouEnvoye = estCoche('f-verrou');
		const issue = await onCreerUnCompte({
			identifiant: valeurDe('f-ident'),
			nom,
			courriel: valeurDe('f-courriel'),
			motDePasse: motDePasseEnvoye,
			role: roleCourant,
			domaine: valeurDe('f-domaine'),
			motDePasseVerrouille: verrouEnvoye
		});
		if (issue.cree) {
			compteCree = { nom, motDePasse: motDePasseEnvoye, verrouille: verrouEnvoye };
			fermerLeFormulaire();
			return;
		}
		/* `marquer()` du gel, dans les deux polarités : un champ que le refus ne
		   nomme pas est un champ dont la marque est RETIRÉE (`V-32:3186`). */
		erreurIdent = issue.erreurs.find((e) => e.champ === 'ident')?.message ?? null;
		erreurNom = issue.erreurs.some((e) => e.champ === 'nom');
		refusGeneral = issue.message ?? null;
	}

	/**
	 * Le compte dont le mot de passe vient d'être remplacé, et la valeur qui l'a
	 * remplacé. `null` au rendu serveur.
	 */
	let reinitialise = $state<{ readonly compte: CompteRendu; readonly motDePasse: string } | null>(
		null
	);

	/** `reinitialiser(c)` du gel (`V-32:3228`) — LA VALEUR VIENT DU GESTE, jamais de
	    cette vue. La boîte ne s'ouvre qu'une fois l'écriture faite : ouvrir d'abord
	    annoncerait un mot de passe que la base n'a peut-être pas accepté. Sans geste
	    branché, RIEN NE S'OUVRE : montrer une valeur qu'aucun compte ne porte serait
	    la valeur illustrative que `P-02` proscrit. */
	async function reinitialiserLeMotDePasse(c: CompteRendu): Promise<void> {
		if (onReinitialiserLeMotDePasse === undefined) return;
		const pose = await onReinitialiserLeMotDePasse({ identifiant: c.compte.identifiant });
		if (pose !== null) reinitialise = { compte: c, motDePasse: pose };
	}

	/** « Copier le mot de passe » — `V-32:3243`. LE PRESSE-PAPIERS PEUT MANQUER, et le
	    libellé change quand même : un bouton sans réaction laisserait croire à une
	    panne, alors que la valeur est à l'écran et se recopie. */
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

	/** LE VERROU DU COMPTE DONT LA BOÎTE MONTRE LE MOT DE PASSE — il décide de la
	    phrase de transmission, et il est lu à la SOURCE de chaque cas : la case
	    envoyée pour une création, l'état du compte pour une réinitialisation. */
	const verrouDeLaBoite = $derived(
		compteCree ? compteCree.verrouille : (compteReinitialise?.verrouille ?? false)
	);

	/**
	 * LE COMPTE DONT LA DÉSACTIVATION EST EXAMINÉE — `demanderDesactivation(c)` du
	 * gel (`V-32:3264`). `null` au rendu serveur. LA RÉACTIVATION N'OUVRE PAS DE
	 * DIALOGUE, et c'est le gel qui en décide (`V-32:3067`) : elle ne retire aucun
	 * accès, il n'y a rien à confirmer.
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
	 * `<dialog open={…}>` : Svelte pose l'attribut avant que cet effet ne coure, une
	 * garde sur `open` renonce, et la boîte reste ouverte SANS être modale — dans le
	 * flux, donc recouvrable par le tiroir. `:modal` pose la seule question qui vaille.
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

<!--
	LA VERSION DU PIED DE RAIL VIENT DU CONTEXTE DE COQUILLE, JAMAIS D'ICI. La vue
	passait le numéro du jeu de démonstration, servi comme un fait sur une instance
	réelle ; aucune route ne passe de version, et la propriété n'est plus qu'un
	état vide explicite.
-->
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
	version=""
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
					LA CLÉ EST L'IDENTIFIANT DE CONNEXION, ET NON `id`, qui vaut `undefined`
					pour tout compte venu de la base. Cinq clés `undefined` font
					`each_key_duplicate`, et Svelte ABANDONNE L'HYDRATATION DE LA PAGE ENTIÈRE :
					plus un écouteur n'était posé sur aucun écran de cette route, le rendu
					serveur restant juste.
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
									.derniere}.{:else}Compte désactivé — ses contributions restent à son nom.{/if}{:else}{#if verrouCourant}Son
								mot de passe est verrouillé : seule l'administration pourra le changer.{:else}L'utilisateur
								devra changer son mot de passe à la première connexion.{/if}{/if}
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
						</div>{/if}{#if refusGeneral !== null}<div class="refus" id="refus-creation">
							<div class="refus__titre">Le compte n'a pas été créé</div>
							<div class="refus__sortie">{refusGeneral}</div>
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
						>Généré automatiquement. {verrouCourant
							? 'Le compte ne pourra pas le changer lui-même.'
							: 'Il devra être changé à la première connexion.'}</span
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
					<!--
						LE SÉLECTEUR SANS RIEN À OFFRIR LE DIT, ET IL NE BLOQUE RIEN : sur une
						instance neuve il sortait sans une option, sous une étiquette qui promettait
						un choix. Le rattachement reste FACULTATIF — la colonne est nullable par
						exigence —, donc l'option de repli porte la chaîne vide.
					-->
					<select class="selecteur" id="f-domaine" disabled={panneauOuvert && domaines.length === 0}
						>{#if panneauOuvert}{#each domaines as d (d.nom)}<option
									value={d.nom}
									selected={d.nom === (edite ? edite.compte.domaine : PREMIER_DOMAINE)}
									>{d.univers} › {d.nom}</option
								>{:else}<option value="">Aucun domaine sur cette instance</option
								>{/each}{/if}</select
					>
					<span class="champ__aide"
						>{domaines.length === 0
							? "Aucun domaine n'existe encore : le compte sera créé sans périmètre de contribution. Créez un domaine dans Console › Domaines pour pouvoir en rattacher un à la création."
							: "Détermine son périmètre de contribution et ce qu'il voit à l'accueil."}</span
					>
				</div>

				<div class="champ" id="champ-verrou">
					<label class="case" style="align-items:flex-start">
						<input
							type="checkbox"
							id="f-verrou"
							checked={verrouCourant}
							onchange={(evenement) => {
								verrouChoisi = evenement.currentTarget.checked;
							}}
						/>
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
				LE PIED DU PANNEAU — les trois boutons du gel (`V-32:3232-3238`). AUCUN N'EST
				DANS UN FORMULAIRE, et aucun ne porte donc `type` : le danger d'un bouton sans
				type n'existe qu'à l'intérieur d'un `<form>`.
				« Créer le compte » fait DEUX choses selon l'état du panneau — c'est le partage
				du gel, dont le seul écouteur branche sur `edite.nouveau` (`V-32:3184`).
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

		<!-- LA MÊME BOÎTE SERT LES DEUX GESTES, ET C'EST LE GEL QUI LE DÉCIDE :
			`afficherMotDePasse(nom, mdp, creation)` (`V-32:3235`) n'ouvre qu'un dialogue,
			et son troisième paramètre change le titre et la phrase, rien d'autre. -->
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
					<!-- LA RÉGION EST SOUSTRAITE AU FORMATEUR : son reflux déplace les blancs À
						L'INTÉRIEUR du texte, et la branche de réinitialisation ne sortait plus les
						mêmes octets sur une phrase pourtant inchangée. -->
					<!-- prettier-ignore -->
					<p class="dlg__texte" id="mdp-qui">
						{#if compteCree}Le compte de {compteCree.nom} est créé. Voici son mot de passe initial.{:else if compteReinitialise}Le mot de passe de {compteReinitialise.compte.nom} a été remplacé.
							L'ancien ne fonctionne plus.{:else}—{/if}
					</p>

					<!-- L'avertissement précède la valeur : il faut savoir qu'on ne la reverra
						pas avant de fermer la boîte, pas après. -->
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
						par téléphone, ou par messagerie interne. {verrouDeLaBoite
							? "Son mot de passe est verrouillé : seule l'administration pourra le changer."
							: 'Le compte devra le changer à sa première connexion.'}
					</p>
				</div>
				<div class="dlg__pied">
					<!-- « J'ai noté le mot de passe » — le gel ferme la boîte ET EFFACE LA VALEUR
						du document (`V-32:3255`). Ici, `compteCree` remis à `null` fait les deux, et
						le rappel demande à la page de se relire. -->
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
										{#if n}{accord(
												n,
												`La note écrite par ${compteDesactive.compte.nom} reste à son nom`,
												`Les ${n} notes écrites par ${compteDesactive.compte.nom} restent à son nom`
											)}, et l'historique des vérifications n'est pas réécrit. Désactiver n'efface
											rien : c'est ce qui permet de savoir, dans deux ans, qui avait rédigé quoi.{:else}Aucune
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
