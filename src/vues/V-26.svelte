<script lang="ts">
	/**
	 * V-26 — Page non trouvée, utilisateur connecté. Servie à TOUTE adresse non
	 * résolue en session (`docs/routes.md` §3.1 et §5.5).
	 *
	 * LE CHEMIN DE CODE UNIQUE — `ADR-007`. V-26 partage avec V-04 le point
	 * d'entrée `adresseNonResolue()` (`$lib/public/adresse-non-resolue`), dont la
	 * SEULE entrée est le chemin demandé. « Inexistante » et « interdite » ne
	 * diffèrent que par la chaîne demandée — le gel l'écrit en toutes lettres
	 * (`V-26:2600`) — et ne sont même pas deux branches ici.
	 *
	 * LE CAS « SUPPRIMÉE » N'EST PAS DU MÊME RÉGIME, ET C'EST L'ADR QUI LE DIT :
	 * une note supprimée dans un domaine où l'utilisateur a des droits est une
	 * ressource dont l'existence lui est déjà connue, et la signaler ne révèle
	 * rien. Ce cas ne passe donc PAS par `adresseNonResolue()` ; ce que la pierre
	 * tombale affiche vient de la propriété `supprimee`, et d'elle seule.
	 *
	 * Coquille de forme abrégée. `data-cas` est transmis à `div.app` par `donnees` :
	 * le gel le pose, et la feuille de la vue le lit. Le style est dans
	 * `src/socle.css` et `src/vues/V-26.css`.
	 */
	import type { Domaine, Note, Univers, UtilisateurCourant } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { adresseNonResolue } from '$lib/public/adresse-non-resolue';
	import { chercher, nombreFr, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { adresseDeNote } from '$lib/rangement/adresses';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * LES SOURCES DE LA COQUILLE — ET LEUR DÉFAUT EST L'ÉTAT VIDE. C'étaient les
		 * constantes du jeu de démonstration : `+error.svelte` n'a pas de chargeur de
		 * page, il ne passe `compte` et `domaines` que lorsque le gabarit racine les
		 * lui a servis et ne passe JAMAIS `univers`. Une page d'adresse non résolue
		 * affichait donc un nom et une arborescence de maquette.
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
		 * LES PISTES DE REFORMULATION — une DONNÉE. La vue en portait quatre en dur,
		 * tirées du gel, chacune ouvrant la recherche à zéro résultat. Une page
		 * d'erreur n'a pas de chargeur : rien ne peut les dériver ici, et une liste
		 * vide ne rend pas le bloc. EXIGÉE — `+error.svelte` est le seul montage.
		 */
		pistes: readonly string[];
		/**
		 * LE MESSAGE D'AMORÇAGE — celui d'une instance qui n'a pas encore de quoi
		 * ranger une note, et qui nomme l'écran de console qui débloque. Servi depuis
		 * qu'il existe, il n'était jamais peint : `+error.svelte` rend cette vue pour
		 * tout 404 et n'affichait ce message que dans sa branche non-404. Absent, la
		 * vue rend sa réponse habituelle — il ne voyage qu'avec un refus d'amorçage,
		 * donc au seul administrateur (`ADR-007` intact).
		 */
		amorcage?: string;
		/**
		 * L'ADRESSE RÉELLEMENT DEMANDÉE — la seule entrée d'`adresseNonResolue()`, et
		 * elle est EXIGÉE. Optionnelle, son défaut était la table d'adresses de la
		 * planche : toute adresse cassée annonçait une note du jeu de démonstration,
		 * la requête s'en dérivait, et « Créer la note » ouvrait l'éditeur sur ce
		 * titre. Les littéraux partaient de surcroît dans le chunk d'erreur, celui que
		 * toute page d'erreur charge.
		 *
		 * ELLE NE DISTINGUE RIEN, et c'est `ADR-007` : c'est un CHEMIN, pas une raison.
		 */
		adresse: string;
		/**
		 * CE QUE LE PRODUIT SAIT D'UNE NOTE SUPPRIMÉE — une DONNÉE, et aucune table ne
		 * la porte. La vue écrivait cinq chaînes du gel ; aucun écran ne les affichait,
		 * mais un littéral n'a pas besoin d'être rendu pour être LIVRÉ : elles
		 * partaient dans le paquet de la page d'erreur, lisibles par n'importe quel
		 * visiteur d'une adresse cassée. `null` est l'état normal, et il le restera
		 * tant qu'aucune table ne portera l'auteur, l'instant et le motif.
		 */
		supprimee?: NoteSupprimee | null;
	}

	/**
	 * LA PIERRE TOMBALE — ce qu'un écran peut dire d'une note qui n'est plus là.
	 * Régime distinct de l'adresse non résolue (`ADR-007`). La forme reste écrite
	 * pour le jour où une table la portera ; d'ici là, aucun montage ne la sert.
	 */
	interface NoteSupprimee {
		readonly nom: string;
		readonly ou: string;
		readonly par: string;
		readonly quand: string;
		readonly motif: string;
		readonly requete: string;
	}

	/**
	 * L'identité affichée — la forme d'`UtilisateurCourant`, dont les valeurs du jeu
	 * de démonstration sont ÉLARGIES : `nom` y est l'union des trois noms du jeu, où
	 * aucun état vide n'est représentable. Le jeu de CLÉS reste lié au type
	 * d'origine par un type mappé, pour qu'il ne diverge pas en silence.
	 */
	type IdentiteAffichee = { readonly [K in keyof UtilisateurCourant]: string };

	/** L'identité vide — ce que la barre supérieure affiche sans compte servi. */
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
		supprimee = null,
		amorcage = ''
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const cas = $derived(typeof reglage['cas'] === 'string' ? reglage['cas'] : 'supprimee');
	/**
	 * Les droits effectifs, transmis au gabarit. Le gel ne pose `data-droits` que
	 * lorsque la position de planche change (`V-26:2775`) ; la divergence est de
	 * balisage et NULLE au rendu, la seule règle qui lit l'attribut étant
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`.
	 */
	const droits = $derived(
		reglage['droits'] === 'lecture' ? ('lecture' as const) : ('ecriture' as const)
	);
	/** L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040` : le gel cache
	    ses actions d'écriture en feuille, le produit ne les émet pas. La classe reste
	    posée sur les nœuds rendus. */
	const ecriture = $derived(droits !== 'lecture');

	/**
	 * LA RÉPONSE UNIQUE. Une adresse entre, un état sort — et rien, ici, ne peut
	 * savoir POURQUOI l'adresse n'a rien rapporté (`ADR-007`).
	 */
	const TITRE_NON_RESOLUE = "Cette page n'est pas accessible.";
	const TEXTE_NON_RESOLUE =
		"L'adresse demandée ne correspond à aucune note. Elle n'existe pas, elle a été déplacée, " +
		'ou son contenu ne vous est pas accessible. La recherche ci-dessous couvre tout ce que vous ' +
		'avez le droit de consulter.';

	/**
	 * La réponse de la pierre tombale — le seul texte qui reste écrit ici parce
	 * qu'il ne décrit AUCUNE note : c'est la formulation du produit.
	 */
	const TITRE_SUPPRIMEE = 'Cette note a été supprimée.';
	const TEXTE_SUPPRIMEE =
		"Le lien que vous avez suivi menait à une note qui n'existe plus. Elle se trouvait dans un " +
		'domaine où vous avez des droits : voici ce que nous savons de sa disparition.';

	/**
	 * LA POSITION DE PLANCHE NE SUFFIT PAS À RENDRE LA PIERRE TOMBALE : IL FAUT LA
	 * DONNÉE. Sans elle, un cartouche « voici ce que nous savons » suivi de blancs
	 * serait une promesse sans objet.
	 */
	const tombe = $derived(cas === 'supprimee' && supprimee !== null);
	/** Le point d'entrée partagé avec V-04, pour les seuls cas non résolus. */
	const resolution = $derived(tombe ? null : adresseNonResolue(adresse));

	const adresseAffichee = $derived(tombe ? adresse : (resolution?.adresse ?? ''));
	/**
	 * L'AMORÇAGE PASSE DEVANT, et il ne dit pas la même chose que le refus :
	 * « L'adresse demandée ne correspond à aucune note » est faux ici — l'adresse
	 * est bonne, c'est l'instance qui n'a nulle part où ranger.
	 */
	const TITRE_AMORCAGE = "Il n'y a nulle part où ranger une note.";
	const adresseDeConsole = $derived(/\/console\/[a-z-]+/u.exec(amorcage)?.[0] ?? '');
	const titre = $derived(
		amorcage !== '' ? TITRE_AMORCAGE : tombe ? TITRE_SUPPRIMEE : TITRE_NON_RESOLUE
	);
	const texte = $derived(amorcage !== '' ? amorcage : tombe ? TEXTE_SUPPRIMEE : TEXTE_NON_RESOLUE);
	const requete = $derived(
		(tombe ? (supprimee?.requete ?? '') : (resolution?.requete ?? '')).trim()
	);

	/** `rendre()` du gel : rien n'est cherché sous deux caractères. */
	const resultats = $derived(requete.length < 2 ? [] : chercher(notes, requete));

	/**
	 * LES TROIS REPRISES DE CONTEXTE — `V-26:2731`. La deuxième nommait un dossier
	 * du jeu de démonstration, et aucune table ne porte d'historique de
	 * consultation : la page proposait d'y retourner sur une instance qui ne l'a
	 * jamais eu. Elles sont donc une propriété au défaut VIDE ; vide, le bloc entier
	 * n'est pas rendu.
	 */
</script>

<!-- `svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE : ses adresses sont COMPOSÉES par `$lib/rangement/adresses.ts`, la
	fabrique unique du rangement, que la règle ne sait pas suivre. -->
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
	La carte de résultat, variante INTERNE : elle porte le brouillon, le rangement
	complet, le marquage de registre et la visibilité — ce que la variante publique
	de V-02 et V-04 ampute.
-->
{#snippet carte(n: Note, q: string, index: number)}
	<!-- AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE, et il doit le rester : le nom
		accessible se construit sur `textContent`. -->
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
		{#if adresseDeConsole !== ''}
			<!--
				UN LIEN, PAS UN BOUTON : Svelte n'émet pas les gestionnaires de clic
				au rendu serveur, et cet écran est précisément celui qu'on atteint
				avant toute hydratation sur une installation neuve.
			-->
			<p class="introuvable__txt">
				<a class="btn btn--principal" id="aller-console" href={adresseDeConsole}
					>Ouvrir la console</a
				>
			</p>
		{/if}

		<div class="adresse-demandee">
			<span class="etiq">Adresse demandée</span>
			<span id="adresse">{adresseAffichee}</span>
		</div>

		<!-- ---------- Note supprimée ----------
			 LA SECTION N'EST PLUS SERVIE HORS DE SON CAS. Elle était toujours émise,
			 masquée par `hidden` : toute adresse cassée expédiait dans son HTML cinq
			 noms du jeu de démonstration, présentés comme les faits d'une suppression
			 qui n'a jamais eu lieu — et la condition les retirait de l'écran, pas du
			 paquet. Elles sont désormais une DONNÉE que personne ne sert.
			 Rien ne bascule `tombe` côté navigateur, et la section n'offre plus aucun
			 geste : ses deux boutons promettaient une corbeille que le produit n'a pas. -->
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
						« {supprimee.nom} » se trouvait dans {supprimee.ou}. La suppression est définitive : il
						n'y a pas de corbeille.
					</p>
					<div class="suppression__qui" id="sup-qui">
						<span>Supprimée par : {supprimee.par}</span><span style="color:var(--c-trait-fort)"
							>·</span
						><span>Quand : {supprimee.quand}</span><span style="color:var(--c-trait-fort)">·</span
						><span>Motif indiqué : {supprimee.motif}</span>
					</div>
					<!--
						LES DEUX BOUTONS DU GEL SONT RETIRÉS — « Demander sa restauration »
						promettait une corbeille que `RG-M14-03` refuse au produit (« la
						suppression est atomique et définitive ») ; « Voir le dossier qui la
						contenait » un dossier dont aucune donnée ne remonte ici.
					-->
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
