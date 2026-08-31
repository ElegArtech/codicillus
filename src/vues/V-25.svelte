<script lang="ts">
	/**
	 * V-25 — Mon profil. Route `/mon-profil` (`docs/routes.md`).
	 *
	 * Quatre onglets : un seul `.volet` porte `data-actif="oui"`, le contenu des
	 * quatre étant rendu dans tous les cas, comme au gel.
	 *
	 * LES DISTINCTIONS SONT CALCULÉES, JAMAIS FIGÉES — `M16.5`. Aucun chiffre n'est
	 * écrit ici : indicateurs, jauges et flux d'activité sortent des sources reçues,
	 * par trois fonctions qui transcrivent celles du gel — `statistiquesDe()`
	 * (`V-25:2486`), `progression()` (`V-25:2765-2790`) et `evenementsDe()`
	 * (`V-25:2830`). Un compte sans contribution rend zéro parce que RIEN NE LE
	 * PORTE, jamais parce qu'un zéro est écrit quelque part.
	 *
	 * LA FRAÎCHEUR N'EST PAS AFFICHÉE PAR CETTE VUE : `$lib/fraicheur` n'est pas
	 * importé, et rien n'est recalculé ici.
	 *
	 * DEUX LITTÉRAUX DU GEL QUE LA DONNÉE NE PORTE PAS : la règle des initiales
	 * (`initialesDe()`, déjà transcrite par V-10, V-11 et V-40) et les libellés de
	 * geste et d'ancienneté (`V-25:2812`, `V-25:2818`) — des textes d'interface.
	 *
	 * Coquille de forme abrégée ; `data-onglet`, `data-verrou` et `data-activite`
	 * passent par `donnees`. `droits` n'est PAS transmis, et c'est délibéré : le gel
	 * n'écrit jamais `data-droits` sur `div.app`, donc les trois nœuds `si-ecriture`
	 * du rail et de la barre restent visibles.
	 *
	 * `#robustesse` reste dans la forme que le gel lui donne AU BALISAGE — quatre
	 * segments éteints, « Trop court », « 0 / 12 » — parce que `creerRobustesse()`
	 * n'évalue rien à la construction (`V-25:2618`). Pour la même raison, les trois
	 * `li` de `#regles` ne portent aucun `data-ok`.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-25.css`.
	 */
	import type {
		Compte,
		Distinction,
		Domaine,
		EvenementDActivite,
		Note,
		Relation,
		TypeDEvenement,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { adresseDesNotesDuDomaine } from '$lib/rangement/adresses';

	interface Proprietes {
		vecteur?: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * CE QUE LA ROUTE SERT EST EXIGÉ, LE RESTE A UN ÉTAT VIDE. Ces sources étaient
		 * optionnelles, de défaut la constante de `seeds/corpus.ts` : une route qui en
		 * oubliait une affichait l'identité, les contributions et l'activité d'un
		 * contributeur de démonstration comme celles du titulaire de la session.
		 * `univers`, `comptes` et `distinctions` restent optionnelles, avec un état vide.
		 */
		/** Les univers déclarés. Absente, aucun univers — jamais ceux du jeu. */
		univers?: readonly Univers[];
		domaines: readonly Domaine[];
		compte: UtilisateurCourant;
		/** Les comptes de l'instance. Absente, aucun — jamais ceux du jeu. */
		comptes?: readonly Compte[];
		/**
		 * Les contributions déclarées, par auteur. La table est PARTIELLE : un compte
		 * sans contribution déclarée existe. `null` N'EST PAS ZÉRO — un chargeur qui ne
		 * peut pas attribuer les liens internes passe `null`, et l'indicateur s'affiche
		 * en état neutre explicite, jamais en zéro muet.
		 */
		contributions: Partial<Record<string, ContributionAffichee>>;
		/**
		 * Les distinctions du barème. Absente, aucune — le barème vivait dans le jeu de
		 * démonstration ; le barème du PRODUIT vit dans `src/lib/donnees/distinctions.ts`,
		 * et c'est lui que la route sert. Aucune servie, l'onglet DIT POURQUOI plutôt que
		 * de se taire — un onglet qu'on ouvre et qui ne montre rien est un défaut.
		 */
		distinctions?: readonly Distinction[];
		/**
		 * LA DATE D'OBTENTION DE CHACUNE, par clé de distinction. Elle ne se calcule
		 * pas : une mesure dit qu'un seuil EST franchi, jamais QUAND il l'a été, et
		 * c'est tout ce que la table `distinctions_obtenues` porte. Absente, ou clé
		 * absente : la jauge dit « obtenue » sans date, jamais une date inventée.
		 */
		obtentions?: Readonly<Record<string, string>>;
		/** Le flux d'activité, tel que la base le porte — vide tant qu'aucune table ne l'écrit. */
		activite: readonly EvenementDActivite[];
		relations: readonly Relation[];
		/**
		 * LE PROFIL DU COMPTE CONNECTÉ, tel que la base le porte. Absente, le compte est
		 * cherché dans `comptes` par le nom de `compte` — le chemin du jeu de semence.
		 * Fournie, elle l'emporte : l'écran cesse d'afficher l'identité du corpus.
		 * `profilAffiche()` de `src/lib/donnees/profil.ts` en est la seule fabrique.
		 */
		profilDuCompte?: ProfilAffiche | null;
		/**
		 * LE RANGEMENT DU TITULAIRE — les deux IDENTIFIANTS d'adresse de son domaine de
		 * rattachement. C'est ce qui donne son adresse à « Voir les notes de … », et
		 * elle ne se dérive pas du nom affiché : `RG-M12-11` fige l'identifiant à la
		 * création. `null` : aucun rattachement, le bouton reste inerte.
		 */
		rangementDuProfil?: { readonly univers: string; readonly domaine: string } | null;
		/**
		 * « Rester connecté sur cet appareil » — l'état de `sessions.souvenir` pour
		 * la session courante. Absente, la case reste dans la position du gel.
		 */
		preferenceDeSession?: boolean;
		/**
		 * LE CHANGEMENT DE MOT DE PASSE EST-IL IMPOSÉ — `M14.6`. La propriété est
		 * EXIGÉE : une seule route rend cet écran, et l'oubli serait un compte enfermé
		 * sur un profil sans savoir pourquoi. Vraie, `src/hooks.server.ts` renvoie
		 * TOUTE autre adresse ici tant que le mot de passe posé par l'administration
		 * n'est pas remplacé ; l'écran ouvre alors l'onglet « Sécurité » sur
		 * l'explication, plutôt que de laisser le titulaire tourner en rond.
		 */
		changementImpose: boolean;
	}

	/**
	 * Une contribution telle que l'écran la reçoit — deux nombres, dont chacun peut
	 * être INDISPONIBLE.
	 */
	interface ContributionAffichee {
		readonly verifiees: number | null;
		readonly liens: number | null;
	}

	interface ProfilAffiche {
		readonly nom: string;
		readonly identifiant: string;
		readonly courriel: string;
		readonly role: string;
		readonly domaine: string;
		readonly arrivee: string;
		readonly derniereConnexion: string;
	}

	const {
		vecteur,
		notes,
		univers = [],
		domaines,
		compte,
		comptes = [],
		contributions,
		distinctions = [],
		obtentions = {},
		activite,
		relations,
		profilDuCompte = null,
		rangementDuProfil,
		preferenceDeSession = false,
		changementImpose
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	const onglet = $derived(typeof reglage['ong'] === 'string' ? reglage['ong'] : 'identite');
	/** Le compte incarné par la planche : `karim` ou `neuf`. */
	const cas = $derived(typeof reglage['cpt'] === 'string' ? reglage['cpt'] : 'karim');
	/** Le mot de passe est-il géré par l'administrateur ? `appliquerVerrou()` du gel. */
	const verrouille = $derived(reglage['c-verrou'] === true);

	/**
	 * LE COMPTE À INCARNER — le seul littéral de désignation du gel. `COMPTE_NEUF`
	 * (`V-25:2984`) nomme Léa Marchand ; `COMPTES` porte ses huit autres valeurs.
	 */
	const IDENTIFIANT_DU_COMPTE_NEUF = 'c-lea';

	/**
	 * Les initiales d'un nom — règle de `window.contributeurs` du gel, déjà
	 * transcrite par V-10, V-11 et V-40.
	 */
	function initialesDe(nom: string): string {
		return nom
			.split(' ')
			.map((m) => m[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/** LE MARQUEUR D'UNE DONNÉE QUI N'EXISTE PAS, et c'est la seule forme que le gel
	    donne au vide : zéro et « indisponible » sont deux informations différentes,
	    et c'est le zéro muet que `RG-M01-01` vise. */
	const RIEN = '—';

	function chiffre(x: number | null): string {
		return x === null ? RIEN : nb(x);
	}

	interface Profil {
		readonly nom: string;
		readonly initiales: string;
		readonly identifiant: string;
		readonly courriel: string;
		readonly role: string;
		readonly domaine: string;
		readonly arrivee: string;
		readonly derniereConnexion: string;
	}

	/** Un compte du corpus, mis dans la forme que la vue attend. `arrivee` et
	    `derniere` de `COMPTES` valent exactement ce que `CONTRIBUTIONS` porte : une
	    seule des deux sources suffit aux deux comptes. */
	function profilDe(compte: Compte): Profil {
		return {
			nom: compte.nom,
			initiales: initialesDe(compte.nom),
			identifiant: compte.identifiant,
			courriel: compte.courriel,
			role: compte.role,
			domaine: compte.domaine,
			arrivee: compte.arrivee,
			derniereConnexion: compte.derniere
		};
	}

	const compteCourant = $derived(
		comptes.find((c) =>
			cas === 'neuf' ? c.id === IDENTIFIANT_DU_COMPTE_NEUF : c.nom === compte.nom
		)
	);

	/** LE PROFIL RENDU — celui de la base quand un chargeur le passe, celui du corpus
	    sinon. Les initiales ne voyagent pas : les appliquer ici plutôt que de les
	    recevoir garantit qu'il n'en existe qu'une règle. */
	const profil = $derived<Profil | null>(
		profilDuCompte !== null && profilDuCompte !== undefined
			? { ...profilDuCompte, initiales: initialesDe(profilDuCompte.nom) }
			: compteCourant
				? profilDe(compteCourant)
				: null
	);

	const attribues = $derived(
		profil
			? ([
					['Identifiant', profil.identifiant],
					['Rôle', profil.role],
					['Domaine principal', profil.domaine],
					["Date d'arrivée", profil.arrivee]
				] as const)
			: []
	);

	/* Les contributions — `window.statsDe`, transcrit (`V-25:2486`). */

	interface Statistiques {
		readonly publiees: number;
		readonly brouillons: number;
		/** `null` quand la donnée n'existe pas — jamais un zéro de commodité. */
		readonly verifiees: number | null;
		readonly liens: number | null;
		readonly citations: number;
		readonly notePhare: Note | null;
	}

	/**
	 * Ce qui est calculable l'est : publications et brouillons se comptent sur le
	 * corpus ; les citations sont, parmi les notes de l'auteur, le plus grand nombre
	 * de relations pointant vers l'une d'elles — et la note qui les porte est la note
	 * phare. Les vérifications et les liens ne sont pas dérivables d'un corpus sans
	 * historique : ils sont déclarés, et leur absence vaut zéro.
	 */
	function statistiquesDe(nom: string): Statistiques {
		const declaree: ContributionAffichee | undefined = contributions[nom];
		const siennes = notes.filter((n) => n.auteur === nom && !n.brouillon);
		const brouillons = notes.filter((n) => n.auteur === nom && n.brouillon);
		let citations = 0;
		let notePhare: Note | null = null;
		for (const n of siennes) {
			const vers = relations.filter((r) => r.vers === n.id).length;
			if (vers > citations) {
				citations = vers;
				notePhare = n;
			}
		}
		return {
			publiees: siennes.length,
			brouillons: brouillons.length,
			verifiees: declaree === undefined ? 0 : declaree.verifiees,
			liens: declaree === undefined ? 0 : declaree.liens,
			citations,
			notePhare
		};
	}

	const stats = $derived(profil ? statistiquesDe(profil.nom) : null);

	const indicateurs = $derived(
		stats
			? ([
					[
						stats.publiees,
						'notes publiées',
						stats.brouillons ? `${stats.brouillons} brouillon en cours` : 'aucun brouillon'
					],
					[stats.verifiees, 'notes vérifiées', 'depuis votre arrivée'],
					[stats.liens, 'liens internes créés', "vers d'autres notes"],
					[
						stats.citations,
						'citations maximales',
						stats.notePhare ? `sur « ${stats.notePhare.titre} »` : 'sur une même note'
					]
				] as const)
			: []
	);

	/* Les six distinctions — toujours affichées, obtenues ou non. */

	interface Jauge {
		readonly distinction: Distinction;
		/** `null` : la mesure n'existe pas. Ni obtenue, ni en progression — inconnue. */
		readonly valeur: number | null;
		readonly obtenue: boolean;
		readonly part: number;
		/** La date d'obtention, quand elle est connue. `null` : elle ne l'est pas. */
		readonly obtenueLe: string | null;
	}

	/** `V-25:2765` — la mesure lue sur les statistiques, jamais une constante. UNE
	    MESURE INDISPONIBLE NE PROGRESSE PAS DE ZÉRO POUR CENT : poser `0 %`
	    affirmerait que le compte n'a rien fait, ce qu'on ignore. */
	function progression(d: Distinction, s: Statistiques): Jauge {
		const valeur = s[d.mesure];
		const obtenueLe = obtentions[d.id] ?? null;
		if (valeur === null) {
			return { distinction: d, valeur: null, obtenue: false, part: 0, obtenueLe };
		}
		return {
			distinction: d,
			valeur,
			obtenue: valeur >= d.seuil,
			part: Math.min(100, Math.round((valeur / d.seuil) * 100)),
			obtenueLe
		};
	}

	function etatDeLaJauge(j: Jauge): string {
		if (j.valeur === null) return 'mesure indisponible';
		return j.obtenue ? 'obtenue' : `progression ${j.part} pour cent`;
	}

	const jauges = $derived(stats ? distinctions.map((d) => progression(d, stats)) : []);

	/* L'activité — `rendreActivite` (`V-25:2830`). */

	/** Les libellés de geste — `GESTES` du gel (`V-25:2812`). */
	const GESTES: Record<TypeDEvenement, string> = {
		verification: 'Vous avez vérifié',
		edition: 'Vous avez modifié',
		publication: 'Vous avez publié',
		revision: 'Vous avez signalé à réviser',
		import: 'Vous avez terminé un import'
	};

	/** `relatif()` du gel (`V-25:2818`) — l'ancienneté en heures, mise en mots. */
	function relatif(h: number): string {
		if (h < 1) return "à l'instant";
		if (h < 24) return `il y a ${h} h`;
		const j = Math.round(h / 24);
		return j === 1 ? 'hier' : `il y a ${j} jours`;
	}

	const evenements = $derived(
		profil ? activite.filter((e: EvenementDActivite) => e.qui === profil.nom) : []
	);

	function titreDe(cible: string): string {
		return notes.find((n) => n.id === cible)?.titre ?? cible;
	}

	/**
	 * L'ADRESSE DE « VOIR LES NOTES DE … » — l'issue que le gel propose au nouvel
	 * arrivant dont le flux est vide (`V-25:2884`). ELLE EST LUE, JAMAIS DÉRIVÉE DU
	 * NOM : un domaine ne s'adresse que dans son univers (`RG-STR-02`) et par ses deux
	 * IDENTIFIANTS, que `RG-M12-11` fige à la création — chercher par nom d'affichage
	 * composait une adresse qui rend 404 dès le premier renommage.
	 *
	 * SANS ADRESSE, LE BOUTON N'EST PAS RENDU — il était rendu INERTE. `ARB-039` :
	 * l'inertie dépend-elle d'un droit, ou d'un état que l'utilisateur peut changer
	 * lui-même ? Ici d'un droit : c'est donc `P-09`, l'action absente.
	 */
	const adresseDesNotesDuProfil = $derived.by(() => {
		if (rangementDuProfil !== undefined) {
			return rangementDuProfil === null
				? null
				: adresseDesNotesDuDomaine(rangementDuProfil.univers, rangementDuProfil.domaine);
		}
		const duJeu = domaines.find((d) => d.nom === profil?.domaine);
		return duJeu === undefined ? null : adresseDesNotesDuDomaine(duJeu.univers, duJeu.nom);
	});

	/** L'adresse vient de la fabrique unique (`ARB-001`), et
	    `svelte/no-navigation-without-resolve` ne sait pas la vérifier : ce n'est pas un
	    identifiant de route mais une chaîne dérivée. La règle est levée sur cette
	    seule ligne. */
	function voirLesNotesDuDomaine(): void {
		if (adresseDesNotesDuProfil === null) return;
		/* eslint-disable-next-line svelte/no-navigation-without-resolve */
		void goto(adresseDesNotesDuProfil);
	}

	/** `data-activite` de `div.app` — le gel le pose à « vide » ou « pleine »
	    (`V-25:3003`, `:3014`) puis le relit pour décider s'il rend un flux ou un
	    encouragement. */
	const etatDActivite = $derived(evenements.length ? 'pleine' : 'vide');
</script>

<Coquille
	fil={['Accueil', 'Mon profil']}
	courant={[]}
	{univers}
	{domaines}
	{notes}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version=""
	rail="ouvert"
	forme="abregee"
	donnees={{
		'data-onglet': onglet,
		'data-verrou': verrouille ? 'oui' : 'non',
		'data-activite': etatDActivite
	}}
	classeContenu="profil"
	idContenu="contenu"
>
	{#snippet enfants()}
		<!-- L'ENTÊTE. `#sous-nom` est construit sans un seul blanc entre ses trois
			enfants : `.entete-profil__sous` est un conteneur `flex` à `gap`, et un blanc
			inséré s'y verrait au pixel. -->
		<header class="entete-profil">
			<div class="avatar-profil" id="avatar" aria-hidden="true">{profil?.initiales ?? ''}</div>
			<div class="entete-profil__corps">
				<h1 id="nom">{profil?.nom ?? ''}</h1>
				<!-- prettier-ignore -->
				<div class="entete-profil__sous" id="sous-nom"
					><span class="past past--type">{profil?.role ?? ''}</span
					><span class="past">{profil?.domaine ?? ''}</span
					><span>{`dans l'équipe depuis le ${profil?.arrivee ?? ''}`}</span
				></div>
			</div>
			<button class="btn" id="deconnexion">Se déconnecter</button>
		</header>

		<!-- prettier-ignore -->
		<div class="onglets" role="tablist" aria-label="Sections du profil"
			><button role="tab" aria-selected={onglet === 'identite'} data-onglet="identite">Identité</button
			><button role="tab" aria-selected={onglet === 'securite'} data-onglet="securite">Sécurité</button
			><button role="tab" aria-selected={onglet === 'distinctions'} data-onglet="distinctions">Distinctions</button
			><button role="tab" aria-selected={onglet === 'activite'} data-onglet="activite">Activité</button
		></div>

		<!-- ============ IDENTITÉ ============ -->
		<section
			class="volet"
			data-volet="identite"
			data-actif={onglet === 'identite' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Ce que vous pouvez modifier</span></div>
				<div class="panneau__corps bloc__corps">
					<div class="champ">
						<label class="champ__label" for="p-affiche">Nom affiché</label>
						<input
							class="saisie"
							type="text"
							id="p-affiche"
							style="max-width:380px"
							value={profil?.nom ?? ''}
						/>
						<span class="champ__aide"
							>C'est ce nom qui apparaît sur vos notes et dans l'activité.</span
						>
					</div>
					<div class="champ">
						<label class="champ__label" for="p-courriel">Adresse électronique</label>
						<input
							class="saisie"
							type="email"
							id="p-courriel"
							style="max-width:380px"
							value={profil?.courriel ?? ''}
						/>
						<!-- LE GEL ÉCRIVAIT ICI « Sert aux notifications et à la réinitialisation
								du mot de passe ». Les deux usages sont faux : le produit n'a AUCUN
								expéditeur de courriel, et la réinitialisation par lien n'existe pas. -->
						<span class="champ__aide"
							>Enregistrée sur votre compte, et visible dans la console des comptes. Ce produit
							n'envoie aucun message&nbsp;: ni notification, ni lien de réinitialisation.</span
						>
					</div>
					<div>
						<button class="btn btn--principal" id="enregistrer-identite">Enregistrer</button>
					</div>
				</div>
			</div>

			<!--
				Champs attribués : lisibles, expliqués, jamais de simple grisé. Le gel les
				construit sans blanc entre les trois cellules.
			-->
			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Attribué par l'administration</span></div>
				<!-- prettier-ignore -->
				<div class="panneau__corps bloc__corps" id="attribues"
					>{#each attribues as ligne (ligne[0])}<div class="attribue"
						><span class="attribue__cle">{ligne[0]}</span
						><span class="attribue__val">{ligne[1]}</span
						><span class="attribue__cadenas"
							><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
								><rect x="3.5" y="7" width="9" height="6.5" rx="1.3"/><path d="M5.8 7V5.2a2.2 2.2 0 0 1 4.4 0V7"/></svg
							>attribué</span
						></div
					>{/each}<div class="mention-attribution">Le rôle et le domaine principal sont fixés par un administrateur, depuis la console. Si l'un des deux ne correspond plus à votre situation, demandez-lui de le corriger — vous ne pouvez pas le faire vous-même, et c'est voulu.</div
				></div>
			</div>
		</section>

		<!-- ============ SÉCURITÉ ============ -->
		<section
			class="volet"
			data-volet="securite"
			data-actif={onglet === 'securite' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Mot de passe</span></div>
				<div class="panneau__corps bloc__corps">
					<div class="verrou" id="verrou" hidden={!verrouille}>
						<svg
							width="20"
							height="20"
							viewBox="0 0 16 16"
							fill="none"
							stroke="var(--c-info)"
							stroke-width="1.5"
							style="flex:none;margin-top:1px"
							><rect x="3" y="7" width="10" height="7" rx="1.4" /><path
								d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
							/></svg
						>
						<div>
							<h3>Compte de démonstration</h3>
							<p>
								Le mot de passe de ce compte est géré par l'administrateur : il ne peut pas être
								changé depuis ici. Adressez-vous à l'administration technique si vous devez le faire
								modifier.
							</p>
						</div>
					</div>

					<!--
						`M14.6` — CE QUI RETIENT LE TITULAIRE SUR CET ÉCRAN EST DIT. Sans cette
						phrase, la garde des hooks le renvoyait ici depuis chaque adresse, en
						silence : il cliquait « Accueil » et retombait sur son profil. Le bloc
						reprend la forme de `#verrou`, la seule que le gel donne à un avis de ce
						panneau ; il ne s'affiche que si le geste est réellement exigé.
					-->
					<div class="verrou" id="changement-impose" hidden={!changementImpose || verrouille}>
						<svg
							width="20"
							height="20"
							viewBox="0 0 16 16"
							fill="none"
							stroke="var(--c-alerte)"
							stroke-width="1.5"
							style="flex:none;margin-top:1px"
							><circle cx="8" cy="8" r="6.2" /><path d="M8 4.6v4M8 11.2v.3" /></svg
						>
						<div>
							<h3>Changez ce mot de passe pour continuer</h3>
							<p>
								Celui que vous venez d'employer a été posé par un administrateur, qui l'a eu en
								clair. Tant qu'il n'est pas remplacé, cet écran est le seul accessible : remplissez
								les trois champs ci-dessous, et le reste du produit s'ouvrira.
							</p>
						</div>
					</div>

					<div id="form-mdp" hidden={verrouille}>
						<!-- Les règles sont annoncées avant la saisie, comme en V-06. -->
						<div style="margin-bottom:var(--e-4)">
							<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
								>Ce qui est demandé</span
							>
							<ul class="regles" id="regles">
								<li data-regle="longueur">12 caractères au minimum</li>
								<li data-regle="varie">Au moins deux natures de caractères différentes</li>
								<li data-regle="different">Différent de votre identifiant</li>
							</ul>
						</div>

						<form class="bloc__corps" id="form-securite" novalidate>
							<div class="champ" id="champ-actuel" style="max-width:380px">
								<label class="champ__label" for="actuel">Mot de passe actuel</label>
								<input class="saisie" type="password" id="actuel" autocomplete="current-password" />
								<div class="champ__erreur" id="erreur-actuel" hidden>
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
									Saisissez votre mot de passe actuel.
								</div>
							</div>

							<div class="champ" id="champ-nouveau" style="max-width:380px">
								<label class="champ__label" for="nouveau">Nouveau mot de passe</label>
								<div class="champ__boite">
									<input class="saisie" type="password" id="nouveau" autocomplete="new-password" />
									<button
										class="champ__action"
										type="button"
										id="voir"
										aria-label="Afficher le mot de passe"
										aria-pressed="false"
									>
										<svg
											width="17"
											height="17"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											><path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8z" /><circle
												cx="8"
												cy="8"
												r="1.8"
											/></svg
										>
									</button>
								</div>
								<div class="robustesse" id="robustesse" data-niveau="court">
									<!-- prettier-ignore -->
									<div class="robustesse__segments" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
									<div class="robustesse__txt">
										<span class="robustesse__note" id="robustesse-note">Trop court</span>
										<span class="robustesse__reste" id="robustesse-reste">0 / 12</span>
									</div>
								</div>
								<span class="champ__aide"
									>Quatre mots sans rapport entre eux valent mieux qu'un mot compliqué.</span
								>
							</div>

							<div class="champ" id="champ-confirm" style="max-width:380px">
								<label class="champ__label" for="confirmation"
									>Confirmer le nouveau mot de passe</label
								>
								<input
									class="saisie"
									type="password"
									id="confirmation"
									autocomplete="new-password"
								/>
								<div class="champ__erreur" id="erreur-confirm" hidden>
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
									Les deux saisies ne correspondent pas.
								</div>
							</div>

							<div>
								<button class="btn btn--principal" type="submit">Changer le mot de passe</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Session</span></div>
				<div class="panneau__corps bloc__corps">
					<!-- prettier-ignore -->
					<div class="attribue"
						><span class="attribue__cle">Dernière connexion</span
						><span class="attribue__val" id="derniere-connexion">{profil?.derniereConnexion ?? ''}</span
					></div>
					<div class="preferences">
						<label class="pref">
							<span class="pref__txt">
								<span class="pref__nom">Rester connecté sur cet appareil</span>
								<span class="pref__aide"
									>À éviter sur un poste partagé. Sans cette option, la session se ferme après deux
									heures d'inactivité.</span
								>
							</span>
							<!-- prettier-ignore -->
							<span class="interrupteur"><input type="checkbox" id="p-session" checked={preferenceDeSession}><span class="interrupteur__piste"></span></span>
						</label>
						<!--
							L'INTERRUPTEUR « Recevoir les demandes de révision par courriel » N'EST PLUS
							ÉMIS : le gel le posait coché sans lui attacher aucun gestionnaire, et rien ne
							pouvait le tenir — aucune colonne de préférence, aucun expéditeur de courriel.
							La lacune reste comptée par `SANS_CONTREPARTIE_EN_BASE`.
						-->
					</div>
					<div>
						<button class="btn btn--destructif" id="fermer-sessions"
							>Fermer toutes les autres sessions</button
						>
					</div>
				</div>
			</div>
		</section>

		<!-- ============ DISTINCTIONS ============ -->
		<section
			class="volet"
			data-volet="distinctions"
			data-actif={onglet === 'distinctions' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<!-- L'INTRODUCTION EST TOUJOURS RENDUE. Elle ne décrit pas des jauges, elle
				 énonce la règle qui les gouverne — `RG-M16-03`, « individuelles et
				 privées » —, et cette règle vaut qu'il y ait six distinctions ou aucune.
				 La taire quand le bloc est vide laissait l'onglet muet. -->
			<p
				class="etape__sous"
				style="font-family:var(--f-lecture);font-size:var(--t-base);color:var(--c-encre-2);line-height:1.6;margin:0 0 var(--e-5);max-width:64ch"
			>
				Ces distinctions sont les vôtres et ne sont visibles que de vous. Elles ne donnent lieu à
				aucun classement : documenter n'est pas une compétition.
			</p>

			<span class="etiq" style="display:block;margin-bottom:var(--e-3)">Vos contributions</span>
			<!-- prettier-ignore -->
			<div class="stats" id="stats"
				>{#each indicateurs as i (i[1])}<div class="stat"
					><div class="stat__val">{chiffre(i[0])}</div
					><span class="stat__nom">{i[1]}</span
					><span class="stat__sous">{i[2]}</span
				></div>{/each}</div>

			<!-- SANS DISTINCTION SERVIE, LE BLOC DIT POURQUOI — il ne se tait plus.
				L'onglet était vide pour toujours et rien n'expliquait ce vide : un écran
				qu'on ouvre et qui ne montre rien doit nommer le geste qui le remplit
				(`RG-M01-01`). -->
			<span class="etiq" style="display:block;margin:var(--e-6) 0 var(--e-3)">Distinctions</span>
			{#if jauges.length === 0}
				<div class="vide-distinctions">
					<h2>Aucune distinction à afficher</h2>
					<p>
						Les distinctions se dérivent de vos contributions — notes publiées, notes vérifiées,
						liens déclarés. Publiez une première note pour ouvrir la première d'entre elles.
					</p>
				</div>
			{:else}
				<!-- prettier-ignore -->
				<div class="distinctions" id="distinctions"
					>{#each jauges as j (j.distinction.id)}<article class="dist" data-obtenue={j.obtenue ? 'oui' : 'non'} aria-label={`${j.distinction.nom}, ${j.distinction.critere}, ${etatDeLaJauge(j)}`}
						><span class="dist__sceau" aria-hidden="true"
							>{#if j.obtenue}<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 8.5l3.5 3.5L13 4.5"/></svg>{:else if j.valeur === null}{RIEN}{:else}{`${Math.min(99, j.part)}%`}{/if}</span
						><div class="dist__nom">{j.distinction.nom}</div
						><div class="dist__critere">{j.distinction.critere}</div
						><div class="dist__jauge"
							><div class="dist__piste"><i style="width:{j.part}%"></i></div
							><div class="dist__chiffre"
								><b>{`${j.valeur === null ? RIEN : nb(Math.min(j.valeur, j.distinction.seuil))} / ${nb(j.distinction.seuil)}`}</b
								><span class="dist__reste">{j.valeur === null ? 'mesure indisponible' : j.obtenue ? (j.obtenueLe === null ? 'obtenue' : `obtenue le ${j.obtenueLe}`) : `encore ${nb(j.distinction.seuil - j.valeur)} ${j.distinction.quoi}`}</span
							></div
						></div
					></article>{/each}</div>
			{/if}
		</section>

		<!-- ============ ACTIVITÉ ============ -->
		<section
			class="volet"
			data-volet="activite"
			data-actif={onglet === 'activite' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<div class="panneau">
				<div class="panneau__tete">
					<span class="etiq">Vos contributions récentes</span>
					<span class="chiffre" id="n-activite">{evenements.length || ''}</span>
				</div>
				<!-- Encouragement plutôt qu'un vide : c'est le premier écran que voit un
					nouvel arrivant, et il décide s'il contribuera. -->
				<!-- prettier-ignore -->
				<div class="panneau__corps" id="activite"
					>{#if evenements.length === 0}<div class="encouragement"
						><h3>Rien à afficher pour l'instant</h3
						><p>Vos contributions apparaîtront ici dès la première. Le plus simple pour commencer : vérifier une note de votre domaine que vous connaissez déjà — cela prend une minute et rend service à tout le monde.</p
						>{#if adresseDesNotesDuProfil !== null}<button class="btn btn--principal" onclick={() => voirLesNotesDuDomaine()}>{`Voir les notes de ${profil?.domaine ?? ''}`}</button>{/if}</div>{:else}<ul class="flux"
						>{#each evenements as ev, rang (rang)}<li data-type={ev.type}
							><div class="flux__txt"
								>{GESTES[ev.type] + ' '}{#if ev.cible}<a href={resolve('/notes/[identifiant]', { identifiant: ev.cible })}>{titreDe(ev.cible)}</a>{:else if ev.detail}{`— ${ev.detail}`}{/if}<span class="flux__quand">{relatif(ev.heures)}</span
							></div
						></li>{/each}</ul
					>{/if}</div>
			</div>
		</section>
	{/snippet}
</Coquille>
