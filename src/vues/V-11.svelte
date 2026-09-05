<script lang="ts">
	/**
	 * V-11 — Page d'un domaine. Route `/univers/{univers}/{domaine}`.
	 *
	 * TROIS BLOCS, DANS CET ORDRE : le bandeau au filet vert et sa bande de
	 * compteurs de vivacité ; « Contenu du domaine » et « À surveiller » ; « Notes
	 * les plus consultées » et « Activité récente ».
	 *
	 * C'EST LA FORME CANONIQUE au sens de `RG-M03-02` et la SEULE forme publiée
	 * depuis `ARB-001` : la forme raccourcie `/domaines/{domaine}` n'est pas
	 * implémentée. L'unicité d'un domaine n'est portée que par son univers
	 * (`RG-STR-02`), d'où le segment obligatoire.
	 *
	 * LES GESTES DE CET ÉCRAN MÈNENT QUELQUE PART, ET CE SONT DES LIENS. Les six
	 * entrées de « Contenu du domaine » et d'« Explorer » sont des ancres composées
	 * par `$lib/rangement/adresses.ts` : elles n'ont plus besoin d'être reconnues à
	 * leur TEXTE par le câblage, où renommer un module rendait sa tuile inerte sans
	 * qu'aucune compilation ne proteste. Il ne reste au câblage que les deux
	 * sélecteurs, qui sont des formulaires (`./cablage.ts`).
	 *
	 * AUCUN ÉTAT DE VIVACITÉ N'EST CALCULÉ ICI (`P-01`, `ADR-005`) : les cinq états
	 * viennent du chargeur, qui les tient de `vivacite()`. La vue compte, elle ne
	 * date rien.
	 *
	 * LE PRODUIT COMMENCE VIDE. Un domaine sans note garde ses quatre tuiles à zéro,
	 * sa bande de compteurs dit « aucune note à mesurer », et les trois panneaux
	 * nomment le geste qui débloque plutôt que de ne rien rendre.
	 *
	 * Aucun chiffre n'est saisi. Le style est dans `src/socle.css` et
	 * `src/vues/V-11.css`.
	 */
	import type {
		CleDeModule,
		DetailDeDomaine,
		Domaine,
		IdentifiantNote,
		Module,
		NomDeDomaine,
		Note,
		Univers
	} from '../../seeds/corpus';
	import { getContext } from 'svelte';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import GlypheDeVivacite from '$lib/GlypheDeVivacite.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import {
		CLE_IDENTITE,
		type CompteAffiche,
		type IdentiteDeCoquille
	} from '$lib/coquille/identite';
	import { ETATS_DE_VIVACITE, ORDRE_DES_ETATS, type EtatDeVivacite } from '$lib/fraicheur';
	import { libelleDeModule } from '$lib/rangement/modules';
	import { accord } from '$lib/vocabulaire';
	import { adresseDeNote } from '$lib/rangement/adresses';

	/**
	 * UN ÉVÉNEMENT DU FIL, tel que le chargeur le sert. Le GENRE est une donnée ;
	 * le titre affiché, le badge et la couleur du disque sont du dessin, et se
	 * décident ici.
	 */
	interface EvenementDuDomaine {
		readonly genre: 'verification' | 'modification' | 'creation' | 'echeance' | 'import';
		readonly objet: string;
		/** L'identifiant de la note visée, ou `null` : un lot d'import n'en vise aucune. */
		readonly note: string | null;
		/** Vide pour une bascule automatique : personne ne l'a faite. */
		readonly par: string;
		readonly heures: number;
	}

	/**
	 * LES SOURCES DE L'ÉCRAN SONT REQUISES. Optionnelles, de défaut une constante
	 * de `seeds/corpus.ts`, une route qui en oubliait une servait le jeu de
	 * démonstration SANS QUE RIEN NE PROTESTE.
	 *
	 * `detailDomaines` ET `modules` RENDENT `P-04` EFFECTIVE, et leurs deux sources
	 * sont distinctes : les CLÉS actives d'un domaine viennent de
	 * `modules_de_domaine` (`RG-STR-06`), les LIBELLÉS du catalogue de produit
	 * `$lib/rangement/modules.ts`.
	 *
	 * LES DEUX TABLES DE MESURE SONT PARTIELLES, ET C'EST DÉLIBÉRÉ : exiger la forme
	 * complète interdirait au chargeur de passer un ensemble vide — l'état neutre
	 * explicite. Ce qui n'y est pas se DIT, jamais ne s'invente.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		/** L'utilisateur connecté. `null` : aucun compte connu. */
		compte?: CompteAffiche | null;
		detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
		/** Le catalogue des modules — nom et sous-titre de chaque clé. */
		modules: Record<CleDeModule, Module>;
		/**
		 * L'état de vivacité du registre RÉFÉRENCE, par note. PARTIELLE : une note
		 * absente n'est pas mesurée, et ne compte dans aucun état.
		 */
		vivacites: Partial<Record<IdentifiantNote, EtatDeVivacite>>;
		/** Les consultations sur la fenêtre que le panneau annonce. */
		mesures: Partial<Record<IdentifiantNote, number>>;
		/** La fenêtre de consultation, en jours — ce que le sélecteur affiche. */
		fenetreDeConsultation: number;
		/** Le fil d'activité, du plus récent au plus ancien. */
		activite: readonly EvenementDuDomaine[];
		/** La position du sélecteur du fil. */
		filtreDActivite: string;
		/** Ancienneté de la dernière activité, en heures. `null` : aucune trace. */
		derniereActiviteHeures: number | null;
		/** Le seuil « bientôt à vérifier », en jours — l'alerte l'annonce. */
		seuilBientot: number;
		/**
		 * LES ADRESSES DU DOMAINE, COMPOSÉES PAR LE CHARGEUR sur les identifiants
		 * PERSISTÉS. La vue ne connaît que des NOMS d'affichage, qui ne se
		 * redérivent pas en identifiant : `audit_code` est déjà une adresse et la
		 * console le garde tel quel, quand la dérivation en fait `audit-code` et
		 * rend 404.
		 */
		adressesDuDomaine: {
			readonly domaine: string;
			readonly notes: string;
			readonly fiches: string;
			readonly dossiers: string;
			readonly signets: string;
		};
		/**
		 * Le nombre de dossiers du domaine, racine exclue. REQUIS : le déduire du
		 * rangement des notes ne voit pas un dossier VIDE, et la tuile mentait.
		 */
		nombreDeDossiers: number;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte: compteConnecte = null,
		detailDomaines,
		modules,
		vivacites,
		mesures,
		fenetreDeConsultation,
		activite,
		filtreDActivite,
		derniereActiviteHeures,
		seuilBientot,
		adressesDuDomaine,
		nombreDeDossiers
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const profil = $derived(String(reglage['role'] ?? 'referent'));
	/**
	 * L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040`. Une action
	 * qu'on ne peut pas faire n'est « ni grisée, NI MASQUÉE » : elle n'est pas
	 * émise.
	 */
	const ecriture = $derived(profil !== 'lecteur');
	const admin = $derived(profil === 'admin');

	/** AUCUN DOMAINE — l'état vide, écrit plutôt que subi : un tableau vide rendait
	    `domaines[0].nom` et sortait en 500. */
	const AUCUN_DOMAINE: Domaine = { nom: '', univers: '', couleur: '' };

	const courant = $derived(
		domaines.find((d) => d.nom === reglage['dom']) ?? domaines[0] ?? AUCUN_DOMAINE
	);

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — LE DOMAINE COURANT, ET LUI SEUL. Le nom d'un
	 * domaine du jeu de démonstration écrit en dur marquait, sur une instance qui
	 * ne le porte pas, un nœud inexistant.
	 */
	const railCourant = $derived([courant.nom]);
	/* `NomDeDomaine` est une chaîne : la table de détail peut ne rien porter pour un
	   domaine créé dans la console. Le repli vide évite la page en erreur. */
	const detail = $derived(detailDomaines[courant.nom] ?? { description: '', modules: [] });
	const notesDuDomaine = $derived(corpus.filter((n) => n.domaine === courant.nom));
	const vide = $derived(notesDuDomaine.length === 0);

	/* ── La vivacité : on COMPTE, on ne calcule pas ─────────────────────────── */

	function etatDe(n: Note): EtatDeVivacite | undefined {
		return vivacites[n.id];
	}

	const compteurs = $derived(
		ORDRE_DES_ETATS.map((etat) => ({
			etat,
			description: ETATS_DE_VIVACITE[etat],
			n: notesDuDomaine.filter((note) => etatDe(note) === etat).length
		}))
	);
	/** Un compteur NUL n'est pas rendu : la bande dit ce qui est, pas ce qui manque. */
	const compteursPresents = $derived(compteurs.filter((c) => c.n > 0));

	function combien(etat: EtatDeVivacite): number {
		return compteurs.find((c) => c.etat === etat)?.n ?? 0;
	}

	/* ── Les alertes — les mêmes que la page d'univers, la note en plus ─────── */
	interface Alerte {
		readonly n: number;
		readonly etat: EtatDeVivacite;
		readonly titre: string;
		readonly detail: string;
	}

	/** Les états qui réclament une attention, du plus criant au moins criant. */
	const ETATS_EN_RETARD: readonly EtatDeVivacite[] = ['obsolete', 'arevoir', 'averifier'];

	/** La note la plus criante du domaine — c'est elle que le détail nomme. */
	const noteEnRetard = $derived.by<Note | undefined>(() => {
		for (const etat of ETATS_EN_RETARD) {
			const trouvee = notesDuDomaine.find((n) => etatDe(n) === etat);
			if (trouvee !== undefined) return trouvee;
		}
		return undefined;
	});

	const alertes = $derived.by<readonly Alerte[]>(() => {
		const liste: Alerte[] = [];
		const attention = combien('averifier') + combien('arevoir') + combien('obsolete');
		if (attention > 0) {
			liste.push({
				n: attention,
				etat: combien('arevoir') + combien('obsolete') > 0 ? 'arevoir' : 'averifier',
				titre: accord(
					attention,
					'note nécessite votre attention',
					'notes nécessitent votre attention'
				),
				/* LE DÉTAIL NOMME LA NOTE, quand il y en a une à nommer. */
				detail: noteEnRetard?.titre ?? 'Leur période de validité est dépassée'
			});
		}
		const bientot = combien('bientot');
		if (bientot > 0) {
			liste.push({
				n: bientot,
				etat: 'bientot',
				titre: accord(
					bientot,
					'note arrive bientôt à échéance',
					'notes arrivent bientôt à échéance'
				),
				detail: `Vérification prévue dans les ${String(seuilBientot)} prochains jours`
			});
		}
		return liste;
	});

	/* ── Contenu du domaine ─────────────────────────────────────────────────── */

	/** L'ordre des quatre tuiles, et celui des deux entrées d'exploration. */
	const CLES_DE_TUILE: readonly CleDeModule[] = ['notes', 'dossiers', 'fiches', 'signets'];
	const CLES_DEXPLORATION: readonly CleDeModule[] = ['cartographie', 'carteMentale'];

	/** Les compteurs portés par les tuiles. Les deux entrées d'exploration n'en ont pas. */
	const comptes = $derived<Partial<Record<CleDeModule, number>>>({
		notes: notesDuDomaine.length,
		dossiers: nombreDeDossiers,
		fiches: notesDuDomaine.filter((n) => n.type === 'Fiche').length,
		signets: notesDuDomaine.filter((n) => n.type === 'Signet').length
	});

	const actifs = $derived(detail.modules as readonly string[]);
	/**
	 * LES TUILES — les clés connues dans l'ordre du produit, PUIS les clés que le
	 * catalogue ne porte pas. Une clé stockée en base et inconnue ici se nomme par
	 * elle-même plutôt que de disparaître sans un mot.
	 */
	const tuiles = $derived([
		...CLES_DE_TUILE.filter((c) => actifs.includes(c)),
		...actifs.filter(
			(c) =>
				!CLES_DE_TUILE.includes(c as CleDeModule) && !CLES_DEXPLORATION.includes(c as CleDeModule)
		)
	] as readonly string[]);
	const exploration = $derived(CLES_DEXPLORATION.filter((c) => actifs.includes(c)));

	/* ── Palmarès et fil ────────────────────────────────────────────────────── */
	const populaires = $derived(
		[...notesDuDomaine]
			.sort(
				(a, b) =>
					(mesures[b.id] ?? 0) - (mesures[a.id] ?? 0) || a.titre.localeCompare(b.titre, 'fr')
			)
			.slice(0, 5)
	);

	/** Ancienneté en clair — la forme du prototype, « il y a 2 h », « il y a 3 j ». */
	function relatif(heures: number): string {
		if (heures < 1) return "à l'instant";
		if (heures < 24) return `il y a ${String(heures)} h`;
		const jours = Math.round(heures / 24);
		if (jours < 31) return `il y a ${String(jours)} j`;
		const mois = Math.round(jours / 30);
		return `il y a ${String(mois)} mois`;
	}

	/** Ce que chaque genre d'événement affiche — titre, badge, teinte du disque. */
	const DESSIN_DEVENEMENT: Readonly<
		Record<EvenementDuDomaine['genre'], { titre: string; badge: string; classe: string }>
	> = {
		verification: { titre: 'Note vérifiée', badge: 'Vérification', classe: 'evt--verification' },
		modification: { titre: 'Note modifiée', badge: 'Note', classe: 'evt--modification' },
		creation: { titre: 'Nouvelle note', badge: 'Note', classe: 'evt--creation' },
		echeance: { titre: 'Échéance atteinte', badge: 'Vivacité', classe: 'evt--echeance' },
		import: { titre: 'Import terminé', badge: 'Import', classe: 'evt--import' }
	};

	/* ── Contributeurs et dernière activité — les statistiques du bandeau ───── */
	const contributeurs = $derived(new Set(notesDuDomaine.map((n) => n.auteur)).size);

	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/**
	 * L'AVATAR DE L'EN-TÊTE — l'identité RÉELLE, celle du gabarit racine. Hors
	 * application le contexte est absent, la propriété reprend la main, et sans
	 * initiales connues l'avatar n'est PAS rendu : une pastille vide n'est pas une
	 * identité.
	 */
	const identiteDeCoquille = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const compteAffiche = $derived(identiteDeCoquille?.compte ?? compteConnecte);

	/**
	 * OÙ MÈNE UNE ENTRÉE DE MODULE — et il faut qu'elle mène quelque part.
	 *
	 * LA RACINE DES DOSSIERS S'ADRESSE PAR LE CHEMIN NU, que le chargeur de V-13
	 * redirige vers sa forme nommée : c'est la seule adresse composable sans
	 * connaître le nom de la racine. CARTOGRAPHIE ET CARTE MENTALE SONT DES ÉCRANS
	 * GLOBAUX : leur périmètre voyage en paramètre, sous la forme `type|nom` que
	 * leurs chargeurs relisent.
	 */
	function perimetreDuDomaine(nom: string): string {
		return `?perimetre=${encodeURIComponent('domaine|' + nom)}`;
	}

	function adresseDeModule(cle: string): string {
		switch (cle) {
			case 'notes':
				return adressesDuDomaine.notes;
			case 'dossiers':
				return adressesDuDomaine.dossiers;
			case 'fiches':
				return adressesDuDomaine.fiches;
			case 'signets':
				return adressesDuDomaine.signets;
			case 'cartographie':
				return `/cartographie${perimetreDuDomaine(courant.nom)}`;
			case 'carteMentale':
				return `/carte-mentale${perimetreDuDomaine(courant.nom)}`;
			default:
				/* Une clé stockée que le catalogue ne porte pas — même repli que
				   `libelleDeModule()` : la page du domaine, jamais un lien mort. */
				return adressesDuDomaine.domaine;
		}
	}

	/** L'éditeur, pré-réglé sur ce domaine. */
	const adresseDeLaNouvelleNote = $derived(
		`/notes/nouvelle?domaine=${encodeURIComponent(courant.nom)}`
	);
	const adresseDesNotes = $derived(adressesDuDomaine.notes);
</script>

<!-- `svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE : ses adresses sont COMPOSÉES par `$lib/rangement/adresses.ts`, la
	fabrique unique du rangement, que la règle ne sait pas suivre. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<!-- Le chevron d'une ligne cliquable — un seul dessin, partout. -->
{#snippet chevron()}
	<svg
		class="chevron"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg
	>
{/snippet}

<!-- Le pictogramme d'un module, par sa clé. Une clé inconnue rend le dessin de note. -->
{#snippet pictogramme(cle: string)}
	<svg
		width="20"
		height="20"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.3"
		aria-hidden="true"
		>{#if cle === 'dossiers'}<path
				d="M1.5 4.5h4l1.5 1.5h7.5v7.5h-13zM1.5 8h13"
			/>{:else if cle === 'fiches'}<path
				d="M2 3h12v10H2zM2 6.5h12M6 6.5V13"
			/>{:else if cle === 'signets'}<path
				d="M4 2h8v12l-4-3-4 3z"
			/>{:else if cle === 'cartographie'}<circle cx="4" cy="4" r="2" /><circle
				cx="12"
				cy="6"
				r="2"
			/><circle cx="7" cy="12" r="2" /><path
				d="M5.8 4.6l4.4 1M5.4 5.7l1.2 4.4"
			/>{:else if cle === 'carteMentale'}<circle cx="3.5" cy="8" r="1.8" /><rect
				x="9.5"
				y="2"
				width="5"
				height="3.4"
				rx="1"
			/><rect x="9.5" y="10.6" width="5" height="3.4" rx="1" /><path
				d="M5.3 8h2.2V3.7h2M7.5 8v4.3h2"
			/>{:else}<path d="M4 2.5h6l2.5 2.5v8.5H4zM6 8h4M6 10.5h4" />{/if}</svg
	>
{/snippet}

<Coquille
	classeContenu="domaine"
	fil={['Accueil', courant.univers, courant.nom]}
	courant={railCourant}
	role={profil === 'admin' ? 'admin' : 'referent'}
	droits={profil === 'lecteur' ? 'lecture' : 'ecriture'}
	donnees={{ 'data-etat': vide ? 'vide' : 'peuple' }}
	{univers}
	{domaines}
	notes={corpus}
	compte={compteConnecte ?? COMPTE_VIDE}
	version=""
>
	{#snippet actionsDEntete()}
		{#if ecriture}<a class="btn si-ecriture" href={adresseDeLaNouvelleNote}
				><svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg
				>Créer</a
			>{/if}{#if compteAffiche !== null && compteAffiche.initiales !== ''}<a
				class="avatar-entete"
				href="/mon-profil"
				title={compteAffiche.nom}
				aria-label={compteAffiche.nom + ' — mon profil'}>{compteAffiche.initiales}</a
			>{/if}
	{/snippet}

	{#snippet enfants()}
		<!-- ═══ 1. LE BANDEAU ═══════════════════════════════════════════════ -->
		<header class="bandeau" id="couv">
			<div class="bandeau__haut">
				<div class="bandeau__corps">
					<span class="etiq">Domaine</span>
					<h1 class="bandeau__nom" id="titre">{courant.nom}</h1>
					<p class="bandeau__phrase" id="description">
						{'Le domaine ' + courant.nom + " de l'Univers "}<b>{courant.univers}</b>{'. ' +
							detail.description}
					</p>
					<ul class="stats">
						<li class="stat">
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.3"
								aria-hidden="true"><path d="M4 2.5h6l2.5 2.5v8.5H4zM6 8h4M6 10.5h4" /></svg
							><b>{nb(notesDuDomaine.length)}</b><span>{accord(notesDuDomaine.length, 'note')}</span
							>
						</li>
						<li class="stat">
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.3"
								aria-hidden="true"
								><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14.5a5.5 5.5 0 0 1 11 0" /></svg
							><b>{nb(contributeurs)}</b><span>{accord(contributeurs, 'contributeur')}</span>
						</li>
						<li class="stat">
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.3"
								aria-hidden="true"
								><path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 4.5V8l2.5 1.5" /></svg
							><b>{derniereActiviteHeures === null ? '—' : relatif(derniereActiviteHeures)}</b><span
								>dernière activité</span
							>
						</li>
					</ul>
				</div>

				<div class="bandeau__actions">
					<!-- P-09 · ARB-040 — omises, jamais masquées ni grisées. -->
					{#if ecriture}<a
							class="btn btn--principal si-ecriture"
							id="a-creer"
							href={adresseDeLaNouvelleNote}
							><svg
								width="14"
								height="14"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg
							>Nouvelle note</a
						>
						<a class="btn si-ecriture" id="a-importer" href="/importer">Importer</a>{/if}
					{#if admin}<a class="btn si-admin" id="a-exporter" href="/console/exports">Exporter</a
						>{/if}
					<!--
						LE MENU EST UN `details`, ET C'EST DÉLIBÉRÉ : il s'ouvre, se ferme et se
						parcourt au clavier sans une ligne de script. Un menu câblé après
						hydratation reste mort pour un navigateur qui n'exécute rien.
					-->
					<details class="menu-dom">
						<summary class="btn menu-dom__bouton" aria-label="Autres actions du domaine"
							><svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="currentColor"
								aria-hidden="true"
								><circle cx="3" cy="8" r="1.4" /><circle cx="8" cy="8" r="1.4" /><circle
									cx="13"
									cy="8"
									r="1.4"
								/></svg
							></summary
						>
						<div class="menu-dom__liste">
							<a class="menu-dom__lien" href={adresseDesNotes}>Voir toutes les notes</a>
							{#if exploration.includes('cartographie')}<a
									class="menu-dom__lien"
									href={adresseDeModule('cartographie')}>Cartographie du domaine</a
								>{/if}
							{#if admin}<a class="menu-dom__lien si-admin" href="/console/domaines"
									>Modifier le domaine</a
								>{/if}
						</div>
					</details>
				</div>
			</div>

			<!-- LA BANDE DE COMPTEURS — un état non nul, un compteur. -->
			<div class="bande" id="vivacites">
				{#if compteursPresents.length === 0}
					<span class="bande__vide"
						>{vide ? 'Aucune note à mesurer.' : 'Aucun état de vivacité mesuré.'}</span
					>
				{:else}
					{#each compteursPresents as c (c.etat)}
						<span class="bande__cellule"
							><GlypheDeVivacite etat={c.etat} taille={14} /><b class="bande__n">{nb(c.n)}</b><span
								class="bande__lib">{c.description.libelle}</span
							></span
						>
					{/each}
				{/if}
				<span class="bande__total"
					><b>{nb(notesDuDomaine.length)}</b>{' ' +
						accord(notesDuDomaine.length, 'note au total', 'notes au total')}</span
				>
			</div>
		</header>

		<!-- ═══ 2. CONTENU DU DOMAINE · À SURVEILLER ════════════════════════ -->
		<div class="grille-dom">
			<section class="carte" id="modules">
				<div class="carte__tete"><span class="etiq">Contenu du domaine</span></div>
				<div class="carte__corps">
					{#if tuiles.length === 0}
						<p class="vide-txt">
							Aucun module n'est activé sur ce domaine. Ils s'activent depuis la console, sur la
							fiche du domaine.
						</p>
					{:else}
						<div class="tuiles">
							{#each tuiles as m (m)}
								<a class="module tuile" href={adresseDeModule(m)}>
									<span class="tuile__tete"
										><span class="tuile__ic">{@render pictogramme(m)}</span><span
											class="module__nom">{libelleDeModule(modules, m).nom}</span
										></span
									>
									<span class="module__n tuile__n"
										>{typeof comptes[m as CleDeModule] === 'number'
											? nb(comptes[m as CleDeModule] ?? 0)
											: '—'}</span
									>
									<span
										class="tuile__barre"
										data-plein={(comptes[m as CleDeModule] ?? 0) > 0 ? 'oui' : 'non'}
									></span>
								</a>
							{/each}
						</div>
					{/if}

					{#if exploration.length > 0}
						<div class="explorer">
							<span class="etiq">Explorer</span>
							<div class="explorer__grille">
								{#each exploration as m (m)}
									<a class="module explo" href={adresseDeModule(m)}
										><span class="explo__ic">{@render pictogramme(m)}</span><span
											class="explo__corps"
											><span class="module__nom">{libelleDeModule(modules, m).nom}</span><span
												class="explo__sous">{libelleDeModule(modules, m).sous}</span
											></span
										>{@render chevron()}</a
									>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</section>

			<section class="carte" id="surveiller">
				<div class="carte__tete"><span class="etiq">À surveiller</span></div>
				<div class="carte__corps">
					{#if alertes.length === 0}
						<div class="calme">
							<span class="calme__marque" aria-hidden="true"
								><svg
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
								></span
							>
							<div class="calme__corps">
								<span class="calme__titre">Rien à surveiller</span>
								<span class="calme__sous"
									>{vide
										? 'Ce domaine ne contient encore aucune note.'
										: 'Toutes les notes du domaine sont à jour.'}</span
								>
							</div>
						</div>
						{#if vide && ecriture}<a class="lien-tout si-ecriture" href={adresseDeLaNouvelleNote}
								>→ Créer la première note</a
							>{/if}
					{:else}
						{#each alertes as a (a.etat)}
							<a class="alerte" href={adresseDesNotes}
								><span class="alerte__pastille alerte__pastille--{a.etat}"
									><GlypheDeVivacite etat={a.etat} taille={18} /></span
								><span class="alerte__corps"
									><span class="alerte__titre"
										><b class="alerte__n alerte__n--{a.etat}">{nb(a.n)}</b>{' ' + a.titre}</span
									><span class="alerte__detail">{a.detail}</span></span
								>{@render chevron()}</a
							>
						{/each}
						<a class="lien-tout" href={adresseDesNotes}>→ Voir toutes les notes à surveiller</a>
					{/if}
				</div>
			</section>
		</div>

		<!-- ═══ 3. NOTES LES PLUS CONSULTÉES · ACTIVITÉ RÉCENTE ═════════════ -->
		<div class="grille-dom">
			<section class="carte" id="populaires">
				<div class="carte__tete">
					<span class="etiq">Notes les plus consultées</span>
					<!--
						LE SÉLECTEUR EST UNE ADRESSE : le formulaire remet la page avec sa
						fenêtre, et le chargeur mesure celle-là. Sans script, le bouton
						« Appliquer » le soumet ; avec, `cablage.ts` le fait au changement.
					-->
					<form class="filtre" method="get" data-filtre>
						<input type="hidden" name="evenements" value={filtreDActivite} />
						<select class="filtre__choix" name="vues" aria-label="Fenêtre de consultation">
							<option value="7" selected={fenetreDeConsultation === 7}>7 jours</option>
							<option value="30" selected={fenetreDeConsultation === 30}>30 jours</option>
						</select>
						<button class="filtre__ok" type="submit">Appliquer</button>
					</form>
				</div>
				<div class="carte__corps carte__corps--liste">
					{#if populaires.length === 0}
						<p class="vide-txt">
							Aucune note dans ce domaine — rien à consulter, donc rien à classer.
						</p>
						{#if ecriture}<a class="lien-tout si-ecriture" href={adresseDeLaNouvelleNote}
								>→ Créer la première note</a
							>{/if}
					{:else}
						{#each populaires as n, rang (n.id)}
							<a class="ligne-note" href={adresseDeNote(n.id)}
								><span class="ligne-note__rang">{String(rang + 1).padStart(2, '0')}</span><span
									class="ligne-note__corps"
									><span class="ligne-note__titre">{n.titre}</span><span class="ligne-note__sous"
										>{#if etatDe(n) !== undefined}<GlypheDeVivacite
												etat={etatDe(n) ?? 'ajour'}
												taille={12}
											/><span class="ligne-note__etat ligne-note__etat--{etatDe(n) ?? 'ajour'}"
												>{ETATS_DE_VIVACITE[etatDe(n) ?? 'ajour'].libelle}</span
											>{:else}<span class="ligne-note__etat">Vivacité non mesurée</span>{/if}</span
									></span
								><span class="ligne-note__n"
									>{nb(mesures[n.id] ?? 0) + ' ' + accord(mesures[n.id] ?? 0, 'vue')}</span
								></a
							>
						{/each}
					{/if}
				</div>
			</section>

			<section class="carte" id="activite">
				<div class="carte__tete">
					<span class="etiq">Activité récente</span>
					<form class="filtre" method="get" data-filtre>
						<input type="hidden" name="vues" value={String(fenetreDeConsultation)} />
						<select class="filtre__choix" name="evenements" aria-label="Genre d'événement">
							<option value="tous" selected={filtreDActivite === 'tous'}>Tous les événements</option
							>
							<option value="verification" selected={filtreDActivite === 'verification'}
								>Vérifications</option
							>
							<option value="note" selected={filtreDActivite === 'note'}>Notes</option>
							<option value="vivacite" selected={filtreDActivite === 'vivacite'}>Vivacité</option>
							<option value="import" selected={filtreDActivite === 'import'}>Imports</option>
						</select>
						<button class="filtre__ok" type="submit">Appliquer</button>
					</form>
				</div>
				<div class="carte__corps carte__corps--liste">
					{#if activite.length === 0}
						<p class="vide-txt">
							{filtreDActivite === 'tous'
								? 'Rien ne s’est encore passé dans ce domaine.'
								: 'Aucun événement de ce genre dans ce domaine.'}
						</p>
						{#if filtreDActivite === 'tous' && ecriture}<a
								class="lien-tout si-ecriture"
								href={adresseDeLaNouvelleNote}>→ Créer la première note</a
							>{/if}
					{:else}
						<ol class="fil-evt">
							{#each activite as e, rang (String(rang) + e.genre + e.objet)}
								<li class="evt {DESSIN_DEVENEMENT[e.genre].classe}">
									<span class="evt__disque" aria-hidden="true"
										><svg
											width="12"
											height="12"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											>{#if e.genre === 'verification'}<path
													d="M3 8.5l3.5 3.5L13 4.5"
												/>{:else if e.genre === 'modification'}<path
													d="M11 2.5l2.5 2.5L5 13.5H2.5V11z"
												/>{:else if e.genre === 'creation'}<path
													d="M8 3v10M3 8h10"
												/>{:else if e.genre === 'echeance'}<path d="M8 3.5V8l3 2" />{:else}<path
													d="M8 2v8M5 7l3 3 3-3M2.5 13h11"
												/>{/if}</svg
										></span
									>
									<span class="evt__corps"
										><span class="evt__titre"
											><b>{DESSIN_DEVENEMENT[e.genre].titre}</b><span
												class="evt__tiret"
												aria-hidden="true">—</span
											>{#if e.note !== null}<a class="evt__objet" href={adresseDeNote(e.note)}
													>{e.objet}</a
												>{:else}{e.objet}{/if}</span
										><span class="evt__meta"
											>{(e.par === '' ? 'automatique' : 'par ' + e.par) +
												' · ' +
												relatif(e.heures)}</span
										></span
									>
									<span class="evt__badge">{DESSIN_DEVENEMENT[e.genre].badge}</span>
								</li>
							{/each}
						</ol>
					{/if}
				</div>
			</section>
		</div>
	{/snippet}
</Coquille>
