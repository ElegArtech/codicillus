<script lang="ts">
	/**
	 * LA PALETTE DE RECHERCHE RAPIDE — V-09, montée en superposition.
	 *
	 * `UC-M02-01` (`CDC:373`) : « Depuis n'importe quelle page, l'utilisateur ouvre une
	 * palette de recherche par raccourci clavier et trouve un document sans quitter son
	 * contexte. » La règle ajoute : ouverture au raccourci OU au clic sur la barre de
	 * recherche, superposition centrée sur fond atténué, focus posé dans le champ,
	 * fermeture à l'échappement ou au clic hors de la boîte, et — c'est le membre qu'on
	 * oublie — un SECOND appui sur le raccourci REPLACE LE FOCUS dans le champ SANS
	 * refermer.
	 *
	 * CE QUE CE COMPOSANT REMPLACE. `Ctrl` `K` et le clic sur le champ de la barre
	 * NAVIGUAIENT vers `/recherche` : le contexte était perdu à chaque recherche, ce que
	 * l'énoncé du cas d'usage exclut en toutes lettres, et `/bibliotheque` promettait au
	 * lecteur une capacité que le produit n'avait pas. `src/vues/V-09.svelte` rendait les
	 * six états côte à côte et AUCUN FICHIER NE L'IMPORTAIT.
	 *
	 * LE PÉRIMÈTRE N'EST PAS DÉCIDÉ ICI, ET IL NE PEUT PAS L'ÊTRE (`ADR-006`) : la palette
	 * n'a pas de corpus, elle interroge `/recherche/palette`, qui appelle le seul chemin
	 * de recherche du dépôt — celui qui calcule son filtre depuis l'identité. Ce que la
	 * liste montre est ce que le serveur a consenti à rendre, compteur compris.
	 *
	 * ELLE NE CHARGE RIEN AU MONTAGE. `CDC:1535` veut l'ouverture « perçue instantanée » :
	 * la superposition s'ouvre et prend le focus sans attendre une seule réponse, et la
	 * première interrogation part APRÈS. Trente-quatre routes qui embarqueraient leur
	 * corpus pour l'obtenir le paieraient sur chaque page.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (`ADR-002`, `P-1`) : `src/palette.css`, qui
	 * est le bloc « palette » de `src/vues/V-09.css` recopié à la déclaration près, et
	 * `src/socle.css` pour le témoin de fraîcheur.
	 */
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import { segmenter } from '$lib/public/recherche';
	import { vocabulaireRendu } from '$lib/vocabulaire';
	import { TEXTE_DU_VIDE, TITRE_DU_VIDE, type MotifDuVide } from '$lib/recherche/motifs';
	import {
		MINIMUM_DE_CARACTERES,
		TEMPORISATION_DE_FRAPPE,
		adresseDInterrogation,
		adresseDeTousLesResultats,
		compteurDeResultats,
		estLeRaccourciDeLaPalette,
		rangSuivant,
		type ReponseDePalette,
		type ResultatDePalette
	} from '$lib/recherche/palette';

	interface Proprietes {
		/**
		 * L'appelant peut-il écrire quelque part — `P-09`. Sans écriture, l'impasse
		 * n'offre PAS « Créer cette note » : `/notes/nouvelle` refuserait, et une action
		 * interdite ne se rend pas, ni grisée ni masquée.
		 */
		ecriture: boolean;
	}

	const { ecriture }: Proprietes = $props();

	/** Le glyphe de type — la table du gel (`V-09:1067`), défaut « NOT ». */
	const GLYPHES: Readonly<Record<string, string>> = {
		Procédure: 'PRO',
		Guide: 'GUI',
		Fiche: 'FIC',
		Note: 'NOT',
		Signet: 'LIE'
	};

	/* LE MOT RENOMMABLE DE `M14.7`, lu sur le contexte de coquille. */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	let dialogue: HTMLDialogElement | undefined = $state();
	let champ: HTMLInputElement | undefined = $state();
	let liste: HTMLElement | undefined = $state();

	let requete = $state('');
	/**
	 * LA RÉPONSE, ET LA REQUÊTE QU'ELLE SERT — les deux ensemble, jamais séparément.
	 * La liste reste affichée pendant la frappe suivante ; sans la requête servie, la
	 * mise en évidence des termes marquerait des lettres que ces résultats ne portent
	 * pas, et le compteur annoncerait le compte d'une autre requête.
	 */
	interface InterrogationServie {
		readonly requete: string;
		readonly reponse: ReponseDePalette;
	}
	let servie = $state<InterrogationServie | null>(null);
	/** Le rang sélectionné, ou `-1` quand la liste n'en porte aucun. */
	let rang = $state(-1);
	/** L'interrogation n'a pas abouti — une panne, pas un état du corpus. */
	let panne = $state(false);

	/* La dernière interrogation lancée gagne : une réponse plus lente que sa
	   suivante réécrirait la liste avec le résultat d'une requête déjà abandonnée. */
	let derniere = 0;
	let minuterie: ReturnType<typeof setTimeout> | undefined;

	const requeteNette = $derived(requete.trim());
	/** Sous deux caractères, aucune requête ne part : `UC-M02-02`. */
	const tropCourte = $derived(
		requeteNette.length > 0 && requeteNette.length < MINIMUM_DE_CARACTERES
	);

	const resultats = $derived<readonly ResultatDePalette[]>(
		tropCourte ? [] : (servie?.reponse.resultats ?? [])
	);
	const requeteServie = $derived(servie?.requete ?? '');
	const motif = $derived<MotifDuVide | null>(tropCourte ? null : (servie?.reponse.motif ?? null));
	const degrade = $derived(servie?.reponse.degrade ?? false);

	/**
	 * LE COMPTEUR N'EST ÉCRIT QUE LORSQU'UNE RECHERCHE A EU LIEU. Au repos la liste
	 * n'est pas un résultat — ce sont les dernières notes ouvertes —, et compter des
	 * lignes qui ne répondent à aucune requête serait annoncer une mesure inexistante.
	 */
	const compteur = $derived(
		servie === null || servie.reponse.recentes || tropCourte
			? ''
			: compteurDeResultats(servie.reponse.total, servie.reponse.dureeMs)
	);

	/** L'intitulé de groupe — seulement au repos, et seulement s'il y a des lignes. */
	const groupe = $derived(
		servie !== null && servie.reponse.recentes && resultats.length > 0
			? 'Consultées récemment'
			: null
	);

	/**
	 * INTERROGER — un aller-retour, et un seul à la fois. Une requête sous deux
	 * caractères n'en déclenche aucun : le serveur rendrait l'état de repos, et
	 * l'écraser ferait clignoter la liste des récentes entre deux frappes.
	 */
	async function interroger(demande: string): Promise<void> {
		const numero = ++derniere;
		try {
			const reponse = await fetch(adresseDInterrogation(demande), {
				headers: { accept: 'application/json' }
			});
			if (numero !== derniere) return;
			if (!reponse.ok) {
				panne = true;
				return;
			}
			const recue = (await reponse.json()) as ReponseDePalette;
			if (numero !== derniere) return;
			panne = false;
			servie = { requete: demande.trim(), reponse: recue };
			rang = recue.resultats.length > 0 ? 0 : -1;
		} catch {
			if (numero === derniere) panne = true;
		}
	}

	/**
	 * LA FRAPPE — temporisée après la dernière touche (`UC-M02-02`). La minuterie est
	 * relancée à chaque caractère : ce qui part est la requête telle qu'elle est au
	 * moment où la frappe s'arrête, jamais une par lettre.
	 */
	function surLaFrappe(): void {
		clearTimeout(minuterie);
		const demande = requete;
		if (demande.trim().length > 0 && demande.trim().length < MINIMUM_DE_CARACTERES) {
			/* Rien ne part, et rien n'est effacé : la liste précédente disparaît par
			   l'état « un seul caractère », qui dit pourquoi. */
			derniere += 1;
			return;
		}
		minuterie = setTimeout(() => void interroger(demande), TEMPORISATION_DE_FRAPPE);
	}

	/**
	 * OUVRIR — ET C'EST AUSSI CE QUE FAIT LE SECOND APPUI. `UC-M02-01` : « un second
	 * appui sur le raccourci alors que la palette est ouverte replace le focus dans le
	 * champ sans la fermer ». Le texte est sélectionné, pour que la frappe suivante
	 * reparte d'une requête neuve sans obliger à effacer.
	 */
	export function ouvrir(): void {
		if (dialogue === undefined) return;
		if (dialogue.open) {
			champ?.focus();
			champ?.select();
			return;
		}
		/* « Champ vide, à l'ouverture » — `V-09`, état 01. */
		requete = '';
		servie = null;
		rang = -1;
		panne = false;
		clearTimeout(minuterie);
		/* LA SUPERPOSITION S'OUVRE AVANT TOUTE INTERROGATION : `showModal()` pose le
		   fond atténué et piège le focus, et la fermeture rendra le focus au nœud qui
		   l'avait — les deux sont natifs, et aucun n'attend le réseau. */
		dialogue.showModal();
		champ?.focus();
		void interroger('');
	}

	export function fermer(): void {
		clearTimeout(minuterie);
		dialogue?.close();
	}

	function effacer(): void {
		requete = '';
		champ?.focus();
		surLaFrappe();
	}

	/**
	 * Faire défiler la ligne sélectionnée jusqu'à elle : la liste est bornée en hauteur,
	 * et la sélection au clavier boucle — après le dernier résultat, le premier est hors
	 * du cadre. `tick()` attend que le rendu ait posé l'attribut.
	 */
	async function deplacer(pas: 1 | -1): Promise<void> {
		rang = rangSuivant(rang, resultats.length, pas);
		await tick();
		liste?.querySelector<HTMLElement>('[data-sel="oui"]')?.scrollIntoView({ block: 'nearest' });
	}

	/** Ouvrir un résultat — la palette se referme, et la navigation reste interne. */
	function ouvrirLeResultat(id: string): void {
		fermer();
		/* L'adresse vient d'`adresseDeNote()`, la fabrique unique du rangement ; la
		   règle inspecte l'expression et ne peut pas la suivre jusque-là. La faire
		   repasser par `resolve()` ajouterait une seconde source de vérité. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresseDeNote(id));
	}

	function surLeClavierDeLaBoite(evenement: KeyboardEvent): void {
		if (evenement.key === 'ArrowDown') {
			evenement.preventDefault();
			void deplacer(1);
			return;
		}
		if (evenement.key === 'ArrowUp') {
			evenement.preventDefault();
			void deplacer(-1);
			return;
		}
		if (evenement.key === 'Enter') {
			const choisi = resultats[rang];
			if (choisi === undefined) return;
			evenement.preventDefault();
			ouvrirLeResultat(choisi.id);
		}
	}

	/**
	 * LE CLIC HORS DE LA BOÎTE FERME — `UC-M02-01`. La cible est le `dialog` lui-même :
	 * la boîte est son enfant, et un clic dedans ne remonte donc jamais jusqu'à lui.
	 */
	function surLeClic(evenement: MouseEvent): void {
		if (evenement.target === dialogue) fermer();
	}

	/**
	 * LE RACCOURCI UNIVERSEL, ÉCOUTÉ SUR LE DOCUMENT — « depuis n'importe quelle page ».
	 * `preventDefault()` reprend `Ctrl` `K` au navigateur, qui l'affecte à sa propre
	 * barre de recherche ; le raccourci est repris parce que c'est celui que la barre
	 * supérieure et le pied de la palette affichent.
	 */
	onMount(() => {
		const auClavier = (evenement: KeyboardEvent): void => {
			if (!estLeRaccourciDeLaPalette(evenement)) return;
			evenement.preventDefault();
			ouvrir();
		};
		document.addEventListener('keydown', auClavier);
		return () => {
			clearTimeout(minuterie);
			document.removeEventListener('keydown', auClavier);
		};
	});
</script>

<!--
	AUCUN BLANC ENTRE LES NŒUDS DE LA LIGNE : le nom accessible d'une option se
	construit sur son texte, et un blanc inséré par le formateur s'y verrait. Le bloc
	est protégé du formateur.

	Les termes de la requête sont mis en évidence par `segmenter()`, qui rend des
	segments que Svelte échappe : aucun balisage issu de la saisie n'est injecté.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -- l'adresse vient
	d'`adresseDeNote()`, la fabrique unique du rangement ; la règle inspecte
	l'expression du `href` et ne peut pas la suivre jusque-là. Même geste qu'en V-09
	et V-26. -->
<!-- prettier-ignore -->
{#snippet ligne(n: ResultatDePalette, termes: string, position: number)}<a class="pres" href={adresseDeNote(n.id)} id="palette-option-{position}" role="option" data-index={position} aria-selected={position === rang} data-sel={position === rang ? 'oui' : 'non'} onclick={(evenement) => { evenement.preventDefault(); ouvrirLeResultat(n.id); }}><span class="pres__glyphe">{GLYPHES[n.type] ?? 'NOT'}</span><span class="pres__corps"><span class="pres__titre">{#each segmenter(n.titre, termes) as s, k (k)}{#if s.marque}<mark>{s.texte}</mark>{:else}{s.texte}{/if}{/each}</span><span class="pres__sous"><span class="temoin {classeTemoin(n.fraicheur)}"><span class="temoin__jauge" aria-hidden="true">{#each [0, 1, 2] as barre (barre)}<i class={barre < barresFraicheur(n.fraicheur) ? 'plein' : undefined}></i>{/each}</span><span class="temoin__txt">{libelleFraicheur(n)}</span></span><span>{'· ' + n.domaine + ' · ' + (n.typeFiche ? n.type + ' ' + n.typeFiche : n.type)}</span>{#if n.operationnel}<span class="past" style="padding: 1px 5px;">Opérationnel</span>{/if}</span></span><span class="pres__entree">↵</span></a>{/snippet}
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<dialog
	class="palette"
	id="palette"
	bind:this={dialogue}
	aria-label="Recherche rapide"
	onclick={surLeClic}
	onkeydown={surLeClavierDeLaBoite}
>
	<div class="palette__boite" data-degrade={degrade ? 'oui' : undefined}>
		<div class="palette__champ">
			<svg
				width="18"
				height="18"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
			>
			<input
				class="palette__saisie"
				type="search"
				autocomplete="off"
				spellcheck="false"
				bind:this={champ}
				bind:value={requete}
				oninput={surLaFrappe}
				placeholder="Chercher une note, une {motFicheMinuscule}, un signet…"
				role="combobox"
				aria-controls="palette-liste"
				aria-expanded="true"
				aria-activedescendant={rang >= 0 ? `palette-option-${rang}` : undefined}
				aria-label="Recherche rapide"
			/>
			<button
				class="palette__effacer"
				type="button"
				aria-label="Effacer la recherche"
				hidden={requete === ''}
				onclick={effacer}
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
				>
			</button>
			<button class="btn btn--discret palette__fermer" type="button" onclick={fermer}>Fermer</button
			>
		</div>

		<div class="palette__degrade">
			<svg
				width="13"
				height="13"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"><path d="M8 5.5v3.5M8 11.2v.3" /><circle cx="8" cy="8" r="6" /></svg
			>
			Recherche par sens indisponible — résultats en mots-clés
		</div>

		<!-- prettier-ignore -->
		<div class="palette__liste" id="palette-liste" bind:this={liste} role="listbox" aria-label="Résultats">{#if groupe}<div class="palette__groupe etiq">{groupe}</div>{/if}{#each resultats as n, position (n.id)}{@render ligne(n, requeteServie, position)}{/each}{#if panne}<div class="palette__etat"><p><strong>La recherche n'a pas répondu.</strong> Le moteur est peut-être arrêté ; le corpus reste lisible depuis le rail.</p><button class="btn" type="button" onclick={() => void interroger(requete)}>Réessayer</button></div>{:else if tropCourte}<div class="palette__etat"><p>Continuez à taper — les résultats apparaissent dès le deuxième caractère.</p></div>{:else if motif !== null}<div class="palette__etat"><p><strong>{TITRE_DU_VIDE[motif]}</strong> {TEXTE_DU_VIDE[motif]}</p>{#if motif === 'sans-univers'}<a class="btn btn--principal" href={resolve('/console/univers')} onclick={fermer}>Créer un univers</a>{:else if motif === 'corpus-vide' && ecriture}<a class="btn btn--principal" href={resolve('/notes/nouvelle')} onclick={fermer}>Créer une note</a>{/if}</div>{:else if resultats.length === 0 && servie !== null && servie.reponse.recentes}<div class="palette__etat"><p>Aucune note ouverte récemment. Tapez deux caractères pour chercher dans ce que vous pouvez lire.</p></div>{:else if resultats.length === 0 && servie !== null}<div class="palette__etat"><p>Aucun résultat pour<span class="palette__requete">{' « ' + requeteServie + ' »'}</span></p>{#if ecriture}<a class="btn btn--principal" href={resolve('/notes/nouvelle')} onclick={fermer}>Créer cette note</a>{/if}</div>{/if}</div>

		<div class="palette__pied">
			<!-- prettier-ignore -->
			<div class="palette__aides">
				<span class="palette__aide"><kbd class="touche">↑</kbd><kbd class="touche">↓</kbd> Parcourir</span>
				<span class="palette__aide"><kbd class="touche">Entrée</kbd> Ouvrir</span>
				<span class="palette__aide"><kbd class="touche">Échap</kbd> Fermer</span>
			</div>
			<div class="palette__droite">
				<span class="palette__compteur">{compteur}</span>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- l'adresse est
					composée par `adresseDeTousLesResultats()`, qui porte la seule écriture de
					la sortie « voir tous les résultats » de `docs/routes.md:206`. -->
				<a
					class="palette__tous"
					href={adresseDeTousLesResultats(requete)}
					onclick={fermer}
					hidden={requeteNette.length < MINIMUM_DE_CARACTERES}>Voir tous les résultats</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</div>
	</div>
</dialog>
