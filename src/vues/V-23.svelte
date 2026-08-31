<script lang="ts">
	/**
	 * V-23 — Formulaire de signet. DEUX routes, un seul écran
	 * (`docs/routes.md` §3.3) :
	 *
	 *   /univers/{univers}/{domaine}/signets/nouveau                  création
	 *   /univers/{univers}/{domaine}/signets/{identifiant}/modifier   édition
	 *
	 * L'adresse est celle du gabarit, prolongée — `$lib/rangement/adresses`.
	 * L'ENVELOPPE N'EST PAS DANS L'ADRESSE : les deux enveloppes partagent la même
	 * paire d'adresses, puisque c'est le même écran.
	 *
	 * AUCUNE MINUTERIE N'EST ÉCRITE ICI : l'attente du titre est un comportement
	 * temporisé (`recupererTitre()`, `V-23:2803`), et le squelette rend l'ÉTAT. Le
	 * rouet `.attente-titre` et l'encart `.titre-propose` restent masqués.
	 *
	 * Six des sept états ouvrent `dialog#dlg-signet` : la vue pose l'attribut
	 * `open`, ET RIEN D'AUTRE — `open` n'est pas `showModal()`, et la couche
	 * supérieure ne s'atteint pas déclarativement.
	 *
	 * LA FOCALISATION EST MESURÉE AVANT D'ÊTRE POSÉE. Le gel focalise
	 * `input#adresse` dans les sept états (`V-23:2979`), et l'anneau est celui de
	 * `.saisie:focus` — donc `:focus` NU. Avec `autofocus`, les six états en
	 * dialogue tombent à zéro divergence, `showModal()` étant appelé après la
	 * stabilisation. `env-page` reste à 5 148 pixels, ÉCART DÉCLARÉ NON COMBLÉ :
	 * hors dialogue, `autofocus` est posé au chargement puis effacé, et il
	 * n'existe aucune forme DÉCLARATIVE qui survive.
	 *
	 * Coquille de forme abrégée. `<main id="contenu">` SANS CLASSE : V-23 est, avec
	 * V-37, l'une des deux seules maquettes à coquille qui n'en portent pas.
	 * `data-droits` n'est pas posé, et c'est le gel : `div.app` ne porte que
	 * `data-rail`, `data-enveloppe` et `data-mode` (`V-23:1006`).
	 *
	 * LE FORMULAIRE EST UNIQUE ET MIGRE D'UNE ENVELOPPE À L'AUTRE : le gel le clone
	 * d'un `<template>` dans `#hote-dialogue` ou `#hote-page` ; ici c'est un
	 * `{#snippet}`, rendu dans l'un ou l'autre hôte.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-23.css`.
	 */
	import type { Domaine, Note, Univers } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import type { CompteAffiche } from '$lib/coquille/identite';

	/**
	 * LE RANGEMENT ET L'IDENTITÉ — plus aucun défaut tiré du jeu. Ces propriétés ont
	 * eu pour défaut `UNIVERS`, `DOMAINES` et `MOI` de `seeds/corpus.ts` : une route
	 * qui en oubliait une offrait au sélecteur de destination les domaines du jeu de
	 * démonstration. `domaines` est REQUISE ; `univers` peut être vide, le rail
	 * abrégé étant écrit au balisage.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers?: readonly Univers[];
		domaines: readonly Domaine[];
		/** L'utilisateur connecté. `null` : aucun compte connu. */
		compte?: CompteAffiche | null;
		/**
		 * LE DOMAINE PRÉ-CHOISI À LA CRÉATION — celui que l'ADRESSE porte. Il venait
		 * du compte, donc d'un domaine du jeu de démonstration quand aucune route ne
		 * passait le compte ; c'est le seul domaine que l'action accepte, et un
		 * administrateur n'a pas de rattachement.
		 */
		domaineDeDepart?: string;
		/**
		 * LE SIGNET ÉDITÉ, quand la route en désigne un — `null` sinon. La vue
		 * cherchait un signet DANS LE JEU DE DÉMONSTRATION quand la propriété
		 * manquait : le mode création n'en a que faire, mais le repli restait une note
		 * de démonstration importée en produit.
		 */
		signet?: Note | null;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines,
		compte = null,
		domaineDeDepart = '',
		signet = null
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const enveloppe = $derived(reglage['env'] === 'page' ? 'page' : 'dialogue');
	const edition = $derived(reglage['mode'] === 'edition');

	/* LE MODE ÉDITION EXIGE UN SIGNET : le vecteur peut demander « édition » sans
	   qu'aucun signet ne soit servi, et le formulaire y est vierge plutôt que
	   peuplé d'une note d'exemple. */
	const enEdition = $derived(edition && signet !== null);
	const adresse = $derived(enEdition ? (signet?.url ?? '') : '');
	const titre = $derived(enEdition ? (signet?.titre ?? '') : '');
	const description = $derived(enEdition ? (signet?.extrait ?? '') : '');
	const domaineChoisi = $derived(enEdition ? (signet?.domaine ?? '') : domaineDeDepart);
	const etiquettes = $derived<readonly string[]>(enEdition ? (signet?.etiquettes ?? []) : []);

	const libelle = $derived(edition ? 'Modifier le signet' : 'Nouveau signet');

	/**
	 * LE FIL D'ARIANE — le rangement RÉEL du signet, jamais celui du gel, qui
	 * nommait un univers et un domaine du jeu de démonstration quel que fût le
	 * domaine visité. Ce qui n'est pas connu ne s'écrit pas.
	 */
	const universDuSignet = $derived(domaines.find((d) => d.nom === domaineChoisi)?.univers ?? '');
	const filDAriane = $derived([
		'Accueil',
		...(universDuSignet === '' ? [] : [universDuSignet]),
		...(domaineChoisi === '' ? [] : [domaineChoisi]),
		'Signets',
		edition ? 'Modifier' : 'Nouveau'
	]);
	const libelleValider = $derived(
		edition ? 'Enregistrer les modifications' : 'Enregistrer le signet'
	);
	const sousTitre = $derived(
		edition
			? "Les champs sont repris tels qu'ils ont été enregistrés. L'adresse peut être corrigée : le signet reste le même."
			: "Un lien web que l'équipe doit pouvoir retrouver : documentation d'éditeur, page d'état d'un fournisseur, portail de prestataire."
	);

	/* L'adresse externe, lue comme le gel la lit — `window.hoteDe` et
	   `window.cheminDe`, recopiées à la lettre. Elles ne vont PAS dans
	   `$lib/rangement/adresses` : ce module compose les adresses INTERNES du
	   produit, et une adresse de signet est une donnée saisie. */
	function hoteDe(url: string): string {
		// `split` rend toujours au moins un morceau ; le repli est là pour le typage
		// strict, jamais pour un cas réel.
		return (
			String(url || '')
				.replace(/^https?:\/\//, '')
				.replace(/^www\./, '')
				.split('/')[0] ?? ''
		);
	}

	function cheminDe(url: string): string {
		const reste = String(url || '')
			.replace(/^https?:\/\//, '')
			.replace(/^www\./, '');
		const i = reste.indexOf('/');
		return i === -1 ? '' : reste.slice(i);
	}

	/** Le monogramme du site. Le repli est `??`, à deux points d'interrogation —
	 *  c'est celui du gel de V-23, et c'est aussi le contenu initial du sceau. */
	function monogramme(url: string): string {
		const h = hoteDe(url).split('.');
		const mot = h.length > 2 ? h[h.length - 3] : h[0];
		return (mot || '??').slice(0, 2);
	}

	/**
	 * L'ADRESSE SAISIE EST UN ÉTAT LIÉ, PAS UN ATTRIBUT — et l'aperçu la suit.
	 * `adresse` est ce que le signet PORTE ; le champ, lui, est modifiable, et tant
	 * que l'aperçu ne lisait que la propriété, le sceau, l'hôte et le chemin
	 * annonçaient l'adresse précédente. C'est `majApercu()` du gel, qui se rejoue à
	 * chaque frappe.
	 *
	 * LA LIAISON EST LA SEULE FORME QUI TIENNE, ET C'EST MESURÉ : un `value=`
	 * réactif à côté d'un écouteur de frappe EFFACE LA SAISIE — au premier re-rendu
	 * suivant l'hydratation, la valeur de l'attribut est réappliquée au nœud, la
	 * table d'attributs de Svelte étant vide après hydratation. Le champ se vidait à
	 * la première frappe et l'enregistrement rendait 400.
	 *
	 * `state_referenced_locally` EST TU À DESSEIN : l'état de départ est celui du
	 * signet SERVI, lu une fois — une autre adresse est une autre page.
	 */
	/* svelte-ignore state_referenced_locally */
	let adresseSaisie = $state(adresse);

	const apercuActif = $derived(adresseSaisie.trim() !== '');
	const apercuSceau = $derived(apercuActif ? monogramme(adresseSaisie) : '??');
	const apercuHote = $derived(apercuActif ? hoteDe(adresseSaisie) : '');
	const apercuChemin = $derived.by(() => {
		if (!apercuActif) return '';
		const chemin = cheminDe(adresseSaisie);
		return chemin.length > 44 ? chemin.slice(0, 43) + '…' : chemin;
	});

	const compteurDescription = $derived(`${description.length} / 240`);
</script>

<!--
	LE FORMULAIRE, UNIQUE ET MIGRANT. Rendu dans `#hote-dialogue` ou dans
	`#hote-page` selon l'enveloppe, jamais dans les deux : c'est le clone unique du
	`<template id="tpl-formulaire">` du gel.

	Les régions serrées sont protégées du formateur — un blanc inséré entre deux
	nœuds se lit dans le nom accessible. Ne jamais citer la forme exacte de la
	directive à l'intérieur d'un commentaire.
-->
{#snippet formulaire()}
	<form class="formulaire" novalidate>
		<div class="champ champ-adresse" id="champ-adresse">
			<!-- prettier-ignore -->
			<label class="champ__label" for="adresse">Adresse du lien <span class="oblig">*</span></label>
			<div class="champ__boite">
				<!--
					`autofocus` — LA CIBLE QUE LE GEL FOCALISE, ET LA SEULE FORME DÉCLARATIVE
					QUI L'HONORE. Il ne vaut QUE dans la boîte de dialogue, où `showModal()`
					est appelé après la stabilisation : sans lui, la couche supérieure
					focaliserait `.dlg__fermer`, premier focalisable de la boîte.
				-->
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="saisie"
					type="url"
					id="adresse"
					inputmode="url"
					autocomplete="off"
					spellcheck="false"
					placeholder="https://…"
					bind:value={adresseSaisie}
					autofocus
				/>
				<button
					class="coller"
					type="button"
					id="coller"
					aria-label="Coller depuis le presse-papiers"
					title="Coller"
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><rect x="3.5" y="3" width="9" height="11" rx="1.4" /><path
							d="M6 3V2.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V3"
						/></svg
					>
				</button>
			</div>
			<div class="apercu-adresse" id="apercu-adresse" data-actif={apercuActif ? 'oui' : 'non'}>
				<span class="apercu-adresse__sceau" id="apercu-sceau" aria-hidden="true">{apercuSceau}</span
				>
				<span class="apercu-adresse__hote" id="apercu-hote">{apercuHote}</span>
				<span class="apercu-adresse__chemin" id="apercu-chemin">{apercuChemin}</span>
				<span class="apercu-adresse__sortie">
					<svg
						width="10"
						height="10"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M6 3h7v7M13 3L4 12" /></svg
					>
					site externe
				</span>
			</div>
			<div class="champ__erreur" id="erreur-adresse" hidden>
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
				<span id="erreur-adresse-txt"></span>
			</div>
		</div>

		<div class="champ" id="champ-titre">
			<label class="champ__label champ__label--ligne" for="titre-signet">
				Titre <span class="oblig">*</span>
				<span class="attente-titre">
					<span class="rouet" aria-hidden="true"></span>
					Lecture du titre de la page…
				</span>
			</label>
			<input
				class="saisie"
				type="text"
				id="titre-signet"
				autocomplete="off"
				placeholder="Écrivez-le, ou laissez-le se remplir"
				value={titre}
			/>
			<div class="titre-propose" id="titre-propose">
				<svg
					width="13"
					height="13"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					style="flex:none"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
				>
				<span>Titre trouvé sur la page : <b id="titre-trouve"></b></span>
				<button class="btn" type="button" id="reprendre-titre">Reprendre</button>
			</div>
			<div class="champ__erreur" id="erreur-titre" hidden>
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
				Donnez un titre : c'est lui qu'on lira dans la liste, pas l'adresse.
			</div>
		</div>

		<div class="champ">
			<label class="champ__label champ__label--ligne" for="description">
				Description
				<span class="compteur-desc" id="compteur-desc">{compteurDescription}</span>
			</label>
			<textarea
				class="saisie"
				id="description"
				rows="3"
				maxlength="240"
				placeholder="Pourquoi ce lien vaut la peine d'être retrouvé, et quand s'en servir."
				>{description}</textarea
			>
			<span class="champ__aide"
				>Facultatif, mais c'est ce qui distingue un signet utile d'une liste de liens morts.</span
			>
		</div>

		<div class="champ">
			<!-- prettier-ignore -->
			<label class="champ__label" for="domaine">Domaine de rattachement <span class="oblig">*</span></label>
			<select class="selecteur" id="domaine">
				<!-- prettier-ignore -->
				{#each domaines as d (d.nom)}<option value={d.nom} selected={d.nom === domaineChoisi}>{d.univers + ' › ' + d.nom}</option>{/each}
			</select>
		</div>

		<div class="champ" style="position:relative">
			<label class="champ__label" for="etiquette">Étiquettes</label>
			<!-- prettier-ignore -->
			<div class="etq-boite" id="etq-boite">{#each etiquettes as e (e)}<span class="etq">{e}<button type="button" aria-label={"Retirer l'étiquette " + e}><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></span>{/each}<input type="text" id="etiquette" placeholder="Ajouter…" autocomplete="off" spellcheck="false"></div>
			<div class="etq-suggestions" id="etq-suggestions"></div>
			<span class="champ__aide">Entrée pour valider. Une étiquette inconnue est créée.</span>
		</div>

		<div
			class="si-page"
			style="display:flex;gap:var(--e-2);flex-wrap:wrap;padding-top:var(--e-2);border-top:1px solid var(--c-trait)"
		>
			<button class="btn btn--principal" type="submit" id="valider-page"
				><span id="valider-txt-page">{libelleValider}</span></button
			>
			<button class="btn" type="button" id="annuler-page">Annuler</button>
			<button
				class="btn btn--destructif"
				type="button"
				id="supprimer-page"
				hidden={!edition}
				style="margin-left:auto">Supprimer</button
			>
		</div>
	</form>
{/snippet}

<!--
	L'ENVELOPPE « BOÎTE DE DIALOGUE » — rendue HORS de `div.app`, entre `div.app` et
	`div.notifs` : l'emplacement exact du gel (`V-23:1157`). C'est l'un des neuf
	seuls nœuds hors `div.app` du dépôt qui portent une boîte de rendu. L'attribut
	`open` est TOUT ce que la vue pose.
-->
{#snippet boiteDeDialogue()}
	<dialog
		class="dlg dlg--large si-dialogue"
		id="dlg-signet"
		aria-labelledby="dlg-signet-titre"
		open={enveloppe === 'dialogue'}
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
						stroke-width="1.5"><path d="M4 2.5h8v11l-4-3-4 3v-11z" /></svg
					>
				</span>
				<h2 class="dlg__titre" id="dlg-signet-titre">{libelle}</h2>
				<button class="dlg__fermer" id="fermer-dlg" aria-label="Fermer">
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
			<div class="dlg__corps" id="hote-dialogue">
				{#if enveloppe === 'dialogue'}{@render formulaire()}{/if}
			</div>
			<div class="dlg__pied dlg__pied--reparti">
				<button class="btn btn--destructif" id="supprimer-dlg" hidden={!edition}>Supprimer</button>
				<div style="display:flex;gap:var(--e-2);margin-left:auto">
					<button class="btn" id="annuler-dlg">Annuler</button>
					<button class="btn btn--principal" id="valider-dlg"
						><span id="valider-txt-dlg">{libelleValider}</span></button
					>
				</div>
			</div>
		</div>
	</dialog>
{/snippet}

<Coquille
	forme="abregee"
	cibleEvitement="adresse"
	libelleEvitement="Aller au formulaire"
	fil={filDAriane}
	courant={domaineChoisi === '' ? [] : [domaineChoisi]}
	donnees={{ 'data-enveloppe': enveloppe, 'data-mode': edition ? 'edition' : 'creation' }}
	{univers}
	{domaines}
	notes={corpus}
	compte={compte ?? COMPTE_VIDE}
	version=""
	superposition={boiteDeDialogue}
>
	{#snippet enfants()}
		<div class="page-signet si-page">
			<header class="page-signet__tete">
				<span class="etiq" id="page-sur">{domaineChoisi}</span>
				<h1 id="page-titre">{libelle}</h1>
				<p id="page-sous">{sousTitre}</p>
			</header>
			<div id="hote-page">
				{#if enveloppe === 'page'}{@render formulaire()}{/if}
			</div>
		</div>
	{/snippet}
</Coquille>
