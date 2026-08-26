<script lang="ts">
	/**
	 * V-26 — Page non trouvée, utilisateur connecté. Servie à TOUTE adresse non
	 * résolue en session (`docs/routes.md` §3.1 et §5.5).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE CHEMIN DE CODE UNIQUE — ADR-007
	 *
	 * V-26 partage avec V-04 le point d'entrée `adresseNonResolue()`
	 * (`$lib/public/adresse-non-resolue`), dont la SEULE entrée est le chemin
	 * demandé. Les deux vues sont dans le même lot par obligation
	 * (`docs/releve-vues.md` §9, R-7) : « Deux lots parallèles y écrivant chacun
	 * leur branche est la manière la plus sûre de faire apparaître la branche
	 * “interdit” que l'ADR interdit. »
	 *
	 * LES DEUX CAS INDISCERNABLES, ET LA PREUVE PAR LA DONNÉE. Les positions
	 * `inexistante` et `interdite` de la planche ne diffèrent que par LA CHAÎNE
	 * DEMANDÉE — le gel l'écrit en toutes lettres : « Rigoureusement identique au
	 * cas précédent, à la chaîne demandée près » (`V-26:2600`). Ici, elles
	 * n'existent même pas comme deux branches : les deux traversent
	 * `adresseNonResolue()`, et le titre, le texte et la requête en découlent.
	 * La requête le montre mécaniquement — `requeteDepuisAdresse()` rend
	 * exactement les deux chaînes que le gel porte.
	 *
	 * LE CAS « SUPPRIMÉE » N'EST PAS DU MÊME RÉGIME, ET C'EST L'ADR QUI LE DIT.
	 * Une note supprimée dans un domaine où l'utilisateur A DES DROITS est une
	 * ressource dont l'existence lui est déjà connue : la signaler ne révèle
	 * rien. C'est la distinction qu'ADR-007 pose explicitement entre la
	 * résolution d'une ressource entière (régime indiscernable) et l'état d'une
	 * zone d'une page qu'on a le droit d'ouvrir. Ce cas ne passe donc PAS par
	 * `adresseNonResolue()` — et le gel le confirme sans le dire : sa requête,
	 * « restaurer sauvegarde mariadb », n'est pas dérivable de son adresse
	 * `/notes/restaurer-une-sauvegarde-mariadb`, qui donnerait « restaurer une
	 * sauvegarde mariadb ». Les deux autres, elles, le sont — au caractère près.
	 *
	 * CE QUE CE COMPOSANT NE PROUVE PAS. Il rend un ÉTAT DE MAQUETTE. Il ne
	 * résout aucun droit, n'interroge aucune base, ne mesure aucun temps de
	 * réponse. `RG-ACC-04` relève de la batterie 6 (`pnpm test:etancheite`, lot
	 * T-011) ; l'indiscernabilité TEMPORELLE n'est mesurée par aucun instrument
	 * (`docs/releve-vues.md` §10, M-5). Ni elle ni `P-09` ne sont déclarées
	 * tenues par ce lot. L'attribut `si-ecriture` reproduit le gel, qui retire
	 * l'élément EN CSS : ce n'est pas P-09, qui exige l'absence du DOM.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA COQUILLE, FORME ABRÉGÉE — ARB-021
	 *
	 * V-26 est l'une des 26 vues de forme abrégée : barre sans les deux menus
	 * déroulants, rail sans pictogrammes ni `data-vers`, `Gestion` en
	 * `si-ecriture`, arborescence écrite au balisage. Le gabarit amendé par P-0
	 * la rend sur `forme="abregee"`. `data-cas` est transmis à `div.app` par
	 * `donnees` (A-2) : le gel le pose, et la feuille de la vue le lit.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT — ARB-011. `div.notifs` est rendu
	 * vide : les notifications de la maquette sont du comportement (T-017).
	 * L'hôte de palette de V-09 — `template#tpl-palette` et `dialog#palette`
	 * fermé — n'est pas rendu : mesuré SANS AUCUNE INCIDENCE sur trente
	 * maquettes, instantané ARIA identique et capture identique à l'octet
	 * (`docs/releve-vues.md` §4.1). Son montage réel appartient au lot qui
	 * portera V-09 (DAG K-10).
	 *
	 * LES ADRESSES RESTENT CELLES DU GEL. Voir l'en-tête de `V-04.svelte` : le
	 * filtre d'ARB-013 ne reconnaît pas la forme que Playwright produit, et toute
	 * adresse réelle fait échouer le niveau 1. Constat remonté au rapport.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-26.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-26 --installer`. Les `style=` reproduits
	 * figurent tous à l'ensemble clos du gel de V-26 (ARB-016).
	 */
	import type { Domaine, Note, Univers, UtilisateurCourant } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { adresseNonResolue } from '$lib/public/adresse-non-resolue';
	import { chercher, nombreFr, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { adresseDeNote } from '$lib/rangement/adresses';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-26')`, variante complète. */
		notes: readonly Note[];
		/**
		 * LES SOURCES DE LA COQUILLE — ET LEUR DÉFAUT EST L'ÉTAT VIDE.
		 *
		 * Leur défaut était les constantes du jeu de démonstration. `+error.svelte`
		 * n'a pas de chargeur de page : il ne passe `compte` et `domaines` que
		 * lorsque le gabarit racine les lui a servis, et ne passe JAMAIS `univers`.
		 * Une page d'adresse non résolue affichait donc « Karim Belhadj » et
		 * l'arborescence des maquettes sur une instance qui ne les a jamais portés.
		 *
		 * Absentes, elles valent maintenant vide. `instance` a disparu : aucune
		 * source ne la passait, et la version du pied de rail vient du contexte.
		 */
		/** Les univers déclarés. Absente, aucun. */
		univers?: readonly Univers[];
		/** Les domaines du périmètre du compte. Absente, aucun. */
		domaines?: readonly Domaine[];
		/** Le compte connecté. Absente, une identité sans nom. */
		compte?: IdentiteAffichee;
		/** Les reprises de contexte. Absente, aucune. */
		reprises?: readonly { nom: string; sous: string; trace: string | null }[];
		/**
		 * LES PISTES DE REFORMULATION — une DONNÉE, et elle n'a pas de source ici.
		 *
		 * La vue en portait quatre en dur, tirées du gel : « sauvegarde »,
		 * « restauration », « astreinte », « supervision ». Chacune ouvrait la
		 * recherche à zéro résultat sur une instance qui ne porte rien de tel. Une
		 * page d'erreur n'a pas de chargeur : rien ne peut les dériver ici, et une
		 * liste vide ne rend pas le bloc.
		 *
		 * EXIGÉE — `+error.svelte` la passe, et c'est le seul montage de cette vue.
		 */
		pistes: readonly string[];
		/**
		 * L'ADRESSE RÉELLEMENT DEMANDÉE — la seule entrée d'`adresseNonResolue()`.
		 *
		 * La vue n'a jamais eu de moyen de la recevoir : elle retombait sur la
		 * table `ADRESSES` de la planche, et TOUTE adresse cassée de l'instance
		 * annonçait « Adresse demandée /notes/bascule-telephonie-voip ». La
		 * conséquence n'était pas seulement un mensonge d'affichage : la requête
		 * s'en dérive, et le bouton « Créer la note » ouvrait l'éditeur avec le
		 * titre d'une note de démonstration, prêt à être enregistré en base.
		 *
		 * Absente, la constante de la planche reste le défaut : le banc ne bouge
		 * pas d'un pixel. Fournie — par le composant d'erreur de la racine, qui
		 * lit `page.url.pathname` —, elle l'emporte.
		 *
		 * ELLE NE DISTINGUE RIEN, et c'est `ADR-007` : c'est un CHEMIN, pas une
		 * raison. Le rendu reste le même que l'adresse désigne une note
		 * inexistante ou une note hors du périmètre de l'appelant.
		 */
		adresse?: string;
		/**
		 * CE QUE LE PRODUIT SAIT D'UNE NOTE SUPPRIMÉE — une DONNÉE, et aucune table
		 * ne la porte.
		 *
		 * La vue l'écrivait en dur, tirée du gel : « Restaurer une sauvegarde
		 * MariaDB », « Infrastructure › Exploitation › Sauvegardes », « Marc
		 * Ferreira », « il y a 6 jours », « Contenu fusionné dans une autre
		 * procédure ». Aucun écran ne l'affiche — `casDeV26()` rend TOUJOURS
		 * `inexistante`, et le dépôt le gèle par un cas nommé —, mais un littéral
		 * n'a pas besoin d'être rendu pour être LIVRÉ : les cinq chaînes partaient
		 * dans le paquet de la page d'erreur, lisibles dans le source servi à
		 * n'importe quel visiteur d'une adresse cassée.
		 *
		 * `null` EST L'ÉTAT NORMAL, et il le restera tant qu'aucune table ne portera
		 * l'auteur, l'instant et le motif d'une suppression. La vue rend alors la
		 * réponse unique d'adresse non résolue — celle que `ADR-007` prescrit, et
		 * la seule que le produit sache tenir.
		 */
		supprimee?: NoteSupprimee | null;
	}

	/**
	 * LA PIERRE TOMBALE — ce qu'un écran peut dire d'une note qui n'est plus là.
	 *
	 * Régime distinct de l'adresse non résolue, et l'ADR le nomme : l'existence de
	 * la ressource est déjà connue de l'utilisateur, qui a des droits sur son
	 * domaine. La forme reste écrite pour le jour où une table la portera ; d'ici
	 * là, aucun montage ne la sert.
	 */
	interface NoteSupprimee {
		/** Le titre de la note supprimée. */
		readonly nom: string;
		/** Son rangement lisible — « Univers › Domaine › Dossier ». */
		readonly ou: string;
		/** Qui l'a supprimée. */
		readonly par: string;
		/** Quand, en clair. */
		readonly quand: string;
		/** Le motif indiqué à la suppression. */
		readonly motif: string;
		/** Les termes dont la recherche de repli s'amorce. */
		readonly requete: string;
	}

	/**
	 * L'IDENTITÉ AFFICHÉE — la forme d'`UtilisateurCourant`, dont les valeurs
	 * figées du jeu de démonstration sont ÉLARGIES.
	 *
	 * `UtilisateurCourant.nom` est typé `NomDAuteur`, l'union des trois noms du
	 * jeu — « Sophie Nguyen », « Marc Ferreira », « Karim Belhadj » — et `role`
	 * comme `domaine` sont de même farine. Aucune instance réelle ne porte ces
	 * valeurs, et aucun état vide n'y est représentable. Le JEU DE CLÉS reste lié
	 * au type d'origine par un type mappé : un champ ajouté là-bas apparaît ici,
	 * et cette forme ne peut pas diverger en silence.
	 */
	type IdentiteAffichee = { readonly [K in keyof UtilisateurCourant]: string };

	/**
	 * L'IDENTITÉ VIDE — ce que la barre supérieure affiche sans compte servi.
	 * Elle remplace `MOI` du jeu de démonstration, qui faisait passer « Karim
	 * Belhadj » pour l'utilisateur connecté sur toute instance.
	 */
	const SANS_IDENTITE: IdentiteAffichee = {
		prenom: '',
		nom: '',
		initiales: '',
		domaine: '',
		role: ''
	};

	const {
		vecteur,
		notes,
		univers = [],
		domaines = [],
		compte = SANS_IDENTITE,
		reprises = [],
		pistes,
		adresse,
		supprimee = null
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const cas = $derived(typeof reglage['cas'] === 'string' ? reglage['cas'] : 'supprimee');
	/**
	 * Les droits effectifs, transmis au gabarit. Le gel ne pose `data-droits` que
	 * lorsque la position de planche change (`V-26:2775`) : à l'écriture,
	 * l'attribut est ABSENT du gel, tandis que la coquille écrit
	 * `data-droits="ecriture"`. La divergence est de balisage et NULLE au rendu —
	 * la seule règle qui lit l'attribut est
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`src/socle.css:396`), et l'instantané ARIA ne porte pas les attributs de
	 * données. Vérifié : les cinq états restent à zéro pixel.
	 */
	const droits = $derived(
		reglage['droits'] === 'lecture' ? ('lecture' as const) : ('ecriture' as const)
	);
	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE les actions d'écriture puis les cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-26-non-trouvee-connecte.html:339`) : faute de serveur, une
	 * maquette statique n'a pas d'autre moyen de dire « cette action n'existe pas
	 * pour ce rôle ». Le produit peut ne pas l'émettre, et P-09 l'exige — « ni
	 * grisée, NI MASQUÉE ». La classe reste posée sur les nœuds rendus.
	 * Énumération : `docs/omissions-p09.md`.
	 */
	const ecriture = $derived(droits !== 'lecture');

	/**
	 * LES TROIS ADRESSES DE LA PLANCHE DE REVUE. Données de MAQUETTE
	 * (`V-26:2583-2606`) : la planche ne choisit pas un comportement, elle
	 * choisit QUELLE ADRESSE a été demandée.
	 */
	const ADRESSE_SUPPRIMEE = '/notes/restaurer-une-sauvegarde-mariadb';
	const ADRESSE_PAR_DEFAUT = '/notes/bascule-telephonie-voip';
	const ADRESSES: Record<string, string> = {
		supprimee: ADRESSE_SUPPRIMEE,
		inexistante: ADRESSE_PAR_DEFAUT,
		interdite: '/notes/comptes-a-privileges-production'
	};

	/**
	 * LA RÉPONSE UNIQUE. Une adresse entre, un état sort — et rien, ici, ne peut
	 * savoir POURQUOI l'adresse n'a rien rapporté (ADR-007).
	 */
	const TITRE_NON_RESOLUE = "Cette page n'est pas accessible.";
	const TEXTE_NON_RESOLUE =
		"L'adresse demandée ne correspond à aucune note. Elle n'existe pas, elle a été déplacée, " +
		'ou son contenu ne vous est pas accessible. La recherche ci-dessous couvre tout ce que vous ' +
		'avez le droit de consulter.';

	/**
	 * LA RÉPONSE DE LA PIERRE TOMBALE — le seul texte qui reste écrit ici, parce
	 * qu'il ne décrit AUCUNE note : c'est la formulation du produit, comme
	 * `TITRE_NON_RESOLUE` et `TEXTE_NON_RESOLUE` au-dessus. Ce qui décrivait une
	 * note du jeu de démonstration est parti dans la propriété `supprimee`.
	 */
	const TITRE_SUPPRIMEE = 'Cette note a été supprimée.';
	const TEXTE_SUPPRIMEE =
		"Le lien que vous avez suivi menait à une note qui n'existe plus. Elle se trouvait dans un " +
		'domaine où vous avez des droits : voici ce que nous savons de sa disparition.';

	/**
	 * LA POSITION DE PLANCHE NE SUFFIT PLUS À RENDRE LA PIERRE TOMBALE : IL FAUT
	 * LA DONNÉE. Sans elle, l'écran n'a rien à dire de la disparition, et un
	 * cartouche « voici ce que nous savons » suivi de blancs serait une promesse
	 * sans objet — la même jurisprudence que les reprises de contexte.
	 */
	const tombe = $derived(cas === 'supprimee' && supprimee !== null);
	/** Le point d'entrée partagé avec V-04, pour les seuls cas non résolus. */
	const resolution = $derived(
		tombe ? null : adresseNonResolue(adresse ?? ADRESSES[cas] ?? ADRESSE_PAR_DEFAUT)
	);

	/** Ce que la ligne « Adresse demandée » porte à l'écran. */
	const adresseAffichee = $derived(tombe ? (adresse ?? '') : (resolution?.adresse ?? ''));
	const titre = $derived(tombe ? TITRE_SUPPRIMEE : TITRE_NON_RESOLUE);
	const texte = $derived(tombe ? TEXTE_SUPPRIMEE : TEXTE_NON_RESOLUE);
	const requete = $derived(
		(tombe ? (supprimee?.requete ?? '') : (resolution?.requete ?? '')).trim()
	);

	/** `rendre()` du gel : rien n'est cherché sous deux caractères. */
	const resultats = $derived(requete.length < 2 ? [] : chercher(notes, requete));

	/**
	 * LES TROIS REPRISES DE CONTEXTE — `V-26:2731`.
	 *
	 * La DEUXIÈME nomme un dossier réel : « Sauvegardes · Dernier dossier consulté
	 * · Infrastructure › Exploitation ». C'est le jeu de démonstration, et aucune
	 * table ne porte d'historique de consultation : sur une instance qui n'a
	 * jamais eu ces dossiers, la page d'adresse non résolue proposait d'y
	 * retourner. Mesuré le 21/08/2026.
	 *
	 * Elles sont donc une propriété, DONT LE DÉFAUT EST VIDE : aucune table de la
	 * base ne porte d'historique de consultation, et le gel n'est pas une source.
	 * Vide, le bloc entier n'est pas rendu — un titre « Reprendre où vous en
	 * étiez » suivi de rien serait une promesse sans objet.
	 */
</script>

<!--
	`svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE, ET LA RAISON EST LA MÊME QUE POUR LE FIL D'ARIANE DE LA COQUILLE.

	La règle veille à ce qu'une adresse interne passe par `resolve()` de
	SvelteKit. Les adresses de cette vue sont COMPOSÉES par
	`$lib/rangement/adresses.ts`, la fabrique unique du rangement : la règle
	inspecte l'EXPRESSION du `href`, elle ne peut pas la suivre jusque là, et
	elle ne peut pas non plus la vérifier ici. Faire passer une adresse déjà
	composée par `resolve()` ne prouverait rien de plus et ajouterait une
	seconde source de vérité pour une forme qui n'en a qu'une.

	Même geste, même justification qu'en V-03, V-22, V-24 et
	`src/lib/coquille/BarreSuperieure.svelte`.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!--
	Le témoin de fraîcheur — `temoinFraicheur()` du gel. Le libellé accompagne
	TOUJOURS la jauge : l'information ne passe jamais par la couleur seule
	(RG-M18-09).
-->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!-- Un texte, avec les termes de la requête marqués — `surligner()` du gel. -->
{#snippet marque(
	texte: string,
	q: string
)}{#each segmenter(texte, q) as s, rang (rang)}{#if s.marque}<mark>{s.texte}</mark
			>{:else}{s.texte}{/if}{/each}{/snippet}

<!--
	La carte de résultat, variante INTERNE : elle porte le brouillon, le
	rangement complet, le marquage de registre et la visibilité — ce que la
	variante publique de V-02 et V-04 ampute.
-->
{#snippet carte(n: Note, q: string, index: number)}
	<!--
		AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE, et il doit le rester : le relevé
		d'ordre de tabulation du niveau 1 construit le nom accessible sur
		`textContent`, où un blanc inséré par le formateur se voit. Mesuré : trois
		états de V-26 en échec de structure pour cette seule cause.
	-->
	<!-- prettier-ignore -->
	<a class="carte" href={adresseDeNote(n.id)} data-index={index}
		><div class="carte__haut"
			><h2 class="carte__titre">{@render marque(n.titre, q)}</h2>{#if n.brouillon}<span class="past past--brouillon">Brouillon</span>{/if}<span class="past past--type">{n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type}</span
		></div
		>{#if n.type === 'Signet'}<div class="marque-signet" style="margin-bottom:var(--e-2)">↗ {n.url}</div>{/if}<p class="carte__extrait">{@render marque(n.extrait, q)}</p
		><div class="carte__signal"
			>{@render temoin(n)}<span class="carte__revision" data-jamais={n.revise ? undefined : 'oui'}>{n.revise ? `Révisé le ${n.revise}` : 'Jamais révisé'}</span
			>{#if n.operationnel}<span class="marque-op">↳ Trouvé dans le registre Opérationnel</span>{/if}</div
		><div class="carte__pied"
			><span class="carte__chemin"><span>{`${n.univers} › `}</span><b>{n.domaine}</b><span>{` › ${n.dossier}`}</span></span
			><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues)} {accord(n.vues, 'consultation')}</span
			>{#if n.pj}<span class="sep">·</span><span>{n.pj} {accord(n.pj, 'pièce jointe', 'pièces jointes')}</span>{/if}{#if n.visibilite === 'Publique'}<span class="sep">·</span><span class="carte__visibilite">Publique</span>{/if}</div
		></a
	>
{/snippet}

<Coquille
	fil={['Accueil', 'Page introuvable']}
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
	{droits}
	forme="abregee"
	donnees={{ 'data-cas': cas }}
	classeContenu="introuvable"
	idContenu="contenu"
	cibleEvitement="rech"
	libelleEvitement="Aller à la recherche"
>
	{#snippet enfants()}
		<h1 id="titre">{titre}</h1>
		<p class="introuvable__txt" id="txt">{texte}</p>

		<div class="adresse-demandee">
			<span class="etiq">Adresse demandée</span>
			<span id="adresse">{adresseAffichee}</span>
		</div>

		<!-- ---------- Note supprimée ----------
			 LA SECTION N'EST PLUS SERVIE HORS DE SON CAS. Elle était toujours
			 émise, masquée par `hidden` : toute adresse cassée d'une instance
			 réelle expédiait donc dans son HTML « Restaurer une sauvegarde
			 MariaDB », « Marc Ferreira » et « Infrastructure › Exploitation ›
			 Sauvegardes » — des noms du jeu de démonstration, présentés comme
			 les faits d'une suppression qui n'a jamais eu lieu.

			 CE N'ÉTAIT QUE LA MOITIÉ DU DÉFAUT. Les cinq chaînes restaient ÉCRITES
			 DANS LA VUE : la condition les retirait de l'écran, pas du paquet, et
			 le chunk de la page d'erreur les portait toujours. Elles sont
			 désormais une DONNÉE que personne ne sert — aucune table ne porte
			 l'auteur, l'instant ni le motif d'une suppression.

			 Rien ne bascule `tombe` côté navigateur : `cablage-erreur.ts` ne câble
			 ni `#sup-restaurer` ni `#sup-domaine`, et le dit. -->
		{#if tombe && supprimee !== null}
			<section class="suppression" id="suppression">
				<svg
					width="22"
					height="22"
					viewBox="0 0 16 16"
					fill="none"
					stroke="var(--c-alerte)"
					stroke-width="1.5"
					style="flex:none;margin-top:2px"
					><path
						d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
					/></svg
				>
				<div style="flex:1">
					<h2>Cette note a été supprimée</h2>
					<p id="sup-txt">
						« {supprimee.nom} » se trouvait dans {supprimee.ou}. Son contenu reste consultable dans
						l'historique tant que la corbeille n'a pas été vidée.
					</p>
					<div class="suppression__qui" id="sup-qui">
						<span>Supprimée par : {supprimee.par}</span><span style="color:var(--c-trait-fort)"
							>·</span
						><span>Quand : {supprimee.quand}</span><span style="color:var(--c-trait-fort)">·</span
						><span>Motif indiqué : {supprimee.motif}</span>
					</div>
					<div class="suppression__actions">
						<!-- P-09 · ARB-040 — omise, jamais masquée. `V-26:1078` -->
						{#if ecriture}<button class="btn si-ecriture" id="sup-restaurer"
								>Demander sa restauration</button
							>{/if}
						<button class="btn" id="sup-domaine">Voir le dossier qui la contenait</button>
					</div>
				</div>
			</section>
		{/if}

		<!-- ---------- Recherche ---------- -->
		<div class="champ-rech" id="champ-rech">
			<svg
				width="22"
				height="22"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
			>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="search"
				id="rech"
				autocomplete="off"
				spellcheck="false"
				autofocus
				value={requete}
				placeholder="Que cherchiez-vous ?"
				aria-label="Rechercher dans la base"
			/>
			<button
				class="champ-rech__effacer"
				id="effacer"
				aria-label="Effacer la recherche"
				hidden={!requete}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
				>
			</button>
		</div>
		<p class="aide-rech" id="aide-rech">
			Les termes de l'adresse ont été repris. <kbd class="touche">Ctrl</kbd>
			<kbd class="touche">K</kbd> ouvre la recherche rapide depuis n'importe où.
		</p>

		<div class="resultats" id="resultats">
			{#if requete.length >= 2}{#if resultats.length === 0}<div class="zone-vide">
						<div class="zone-vide__titre">Rien ne correspond à <em>« {requete} »</em></div>
						<p>
							{droits === 'lecture'
								? "Essayez d'autres mots, ou demandez à un contributeur du domaine si cette connaissance est écrite quelque part."
								: "Essayez d'autres mots — ou écrivez-la : c'est souvent une adresse cassée qui révèle une note manquante."}
						</p>
						{#if pistes.length}<div class="reformuler">
								{#each pistes as piste (piste)}<button class="piste">{piste}</button>{/each}
							</div>{/if}
						<!-- P-09 · ARB-040 — omise, jamais masquée. `V-26:2709` -->
						{#if ecriture}<button
								class="btn btn--principal si-ecriture"
								style="margin-top:var(--e-3)">Créer la note « {requete} »</button
							>{/if}
					</div>{:else}<div class="etiq">
						{resultats.length}{' ' +
							accord(resultats.length, 'note correspond', 'notes correspondent')}
					</div>
					{#each resultats.slice(0, 3) as n, index (n.id)}{@render carte(
							n,
							requete,
							index
						)}{/each}{/if}{/if}
		</div>

		<!-- ---------- Reprises de contexte ---------- -->
		{#if reprises.length}
			<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
				>Reprendre où vous en étiez</span
			>
			<div class="reprises" id="reprises">
				{#each reprises as r (r.nom)}<button class="reprise" type="button"
						><span class="reprise__ic"
							><svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								>{#if r.trace}<path d={r.trace} />{:else}<circle cx="7" cy="7" r="4.5" /><path
										d="M10.5 10.5L14 14"
									/>{/if}</svg
							></span
						><span
							><span class="reprise__nom">{r.nom}</span><span class="reprise__sous">{r.sous}</span
							></span
						></button
					>{/each}
			</div>
		{/if}
	{/snippet}
</Coquille>
