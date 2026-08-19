<script lang="ts">
	/**
	 * V-23 — Formulaire de signet. DEUX routes, un seul écran
	 * (`docs/routes.md` §3.3) :
	 *
	 *   /univers/{univers}/{domaine}/signets/nouveau               création
	 *   /univers/{univers}/{domaine}/signets/{identifiant}/modifier  édition
	 *
	 * L'ADRESSE EST CELLE DU GABARIT, PROLONGÉE — `$lib/rangement/adresses`,
	 * `adresseDeCreationDeSignet()` et `adresseDeModificationDeSignet()`.
	 * `nouveau` est réservé sous `.../signets/` (§5.4). L'ENVELOPPE N'EST PAS
	 * DANS L'ADRESSE : les deux enveloppes partagent la même paire d'adresses,
	 * puisque c'est le même écran.
	 *
	 * SEPT ÉTATS — `verif/scenarios/V-23.json`. Trois axes : enveloppe × mode ×
	 * récupération du titre. Deux doublons déclarés (`mode-creation` et
	 * `recup-ok` sont `identiqueA` `env-dialogue`).
	 *
	 * ═════════════════════════════════════════════════════════════════════
	 * L'AXE « RÉCUPÉRATION DU TITRE » NE REND RIEN, ET C'EST MESURÉ SUR LE GEL
	 *
	 * Les trois positions — aboutit, lente, échoue — ne sont lues que par
	 * `recupererTitre()` (`V-23:2803`, lecture de la position à `:2812`), qui
	 * n'est appelée QUE sur la sortie du champ d'adresse ou après un collage. Aucun `change` n'y est branché : les
	 * radios `recup` n'ont pas d'écouteur. `recup-lente` et `recup-echec`
	 * rendent donc EXACTEMENT `env-dialogue`.
	 *
	 * C'est heureux, et ce n'est pas une commodité : l'attente du titre est un
	 * comportement TEMPORISÉ — `setTimeout` à 750 ms ou 2 600 ms —, et ARB-011
	 * tranche que le squelette rend l'ÉTAT, jamais la transition. Le rouet
	 * `.attente-titre` et l'encart `.titre-propose` restent donc masqués, comme
	 * au gel, et AUCUNE MINUTERIE N'EST ÉCRITE ICI.
	 *
	 * ═════════════════════════════════════════════════════════════════════
	 * LA MODALITÉ EST ÉTABLIE PAR LE BANC, DES DEUX CÔTÉS — ARB-017
	 *
	 * Six des sept états ouvrent `dialog#dlg-signet.dlg.dlg--large.si-dialogue`.
	 * V-23 est DÉCLARÉE RÉVÉLABLE à `verif/references/protocole-app.json`, bloc
	 * `revelations`, sous la révélation `modalite-dialogue`. L'obligation de la
	 * vue y est écrite, et elle est minimale : rendre `#dlg-signet` avec
	 * l'attribut `open`, ET RIEN D'AUTRE. `open` n'est pas `showModal()`, et la
	 * couche supérieure ne s'atteint pas déclarativement : c'est le banc qui
	 * l'établit, par un code unique, avant de mesurer. AUCUN SCRIPT N'EST ÉCRIT
	 * ICI — en écrire un serait exiger du JavaScript d'un squelette statique
	 * pour satisfaire une mesure.
	 *
	 * `env-page` n'ouvre rien : la révélation ne s'y applique pas d'elle-même,
	 * faute de `dialog[open]` à trouver. C'est la PROPRIÉTÉ qui décide, jamais
	 * la vue.
	 *
	 * ═════════════════════════════════════════════════════════════════════
	 * LA FOCALISATION — MESURÉE AVANT D'ÊTRE POSÉE (CLAUDE.md §6, P-4)
	 *
	 * Le gel focalise `input#adresse` dans les SEPT états (`appliquerEnveloppe`,
	 * `V-23:2979`), et `docs/releve-vues.md` §6.2 range `env-page` dans la
	 * jurisprudence d'`ECART-020`. L'anneau est celui de `.saisie:focus`
	 * (`socle.css:422`) — donc `:focus` NU, pas `:focus-visible` : la modalité
	 * de saisie n'y entre pour rien, seule compte la présence du focus à
	 * l'instant de la mesure.
	 *
	 * MESURE FAITE, AVANT DE RIEN POSER, ET ELLE TRANCHE EN DEUX :
	 *
	 *   • SANS `autofocus`, les SEPT états divergent — 5 830 px sur les six
	 *     états en dialogue (le focal y allait à `.dlg__fermer`, premier
	 *     focalisable de la boîte, quand la référence l'a sur l'adresse), 5 148
	 *     px sur `env-page`.
	 *   • AVEC `autofocus`, les six états en dialogue passent à ZÉRO :
	 *     `showModal()` est appelé par la révélation APRÈS la stabilisation, et
	 *     l'attribut est alors honoré. C'est exactement P-4, et le seul cas où
	 *     il joue.
	 *
	 * `env-page` RESTE À 5 148 PIXELS, ET C'EST UN ÉCART DÉCLARÉ, NON COMBLÉ.
	 * Hors dialogue, `autofocus` est posé au chargement puis effacé par le blur
	 * de `stabiliser()` (`conditions.mjs:270`) ; la référence, elle, reçoit son
	 * focus APRÈS la stabilisation, parce que la planche lui applique son
	 * vecteur en différé et que le gel focalise 40 ms plus tard. La divergence
	 * n'est donc pas dans la vue : elle est dans l'asymétrie du moment où le
	 * focus est posé de chaque côté. Il n'existe aucune forme DÉCLARATIVE qui
	 * survive au blur, et écrire un script pour focaliser après coup violerait
	 * ARB-011. La sortie légitime est l'arbitrage — instrument, ou niveau 3 —,
	 * jamais un contournement pris ici. Voir le rapport de lot.
	 *
	 * ═════════════════════════════════════════════════════════════════════
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1. `<main id="contenu">` SANS
	 * CLASSE : V-23 est, avec V-37, l'une des deux seules maquettes à coquille
	 * qui n'en portent pas (ARB-015). Lien d'évitement `#adresse` « Aller au
	 * formulaire » (ARB-019). Chemin courant du rail `["Infrastructure"]`, appelé
	 * UNE SEULE FOIS par le gel : aucune accumulation de marque ici,
	 * contrairement à V-11, V-12 et V-22.
	 *
	 * `data-droits` N'EST PAS POSÉ, et c'est le gel : `div.app` ne porte que
	 * `data-rail`, `data-enveloppe` et `data-mode` (`V-23:1006`). La seule règle
	 * du socle sur cet attribut vise `[data-droits="lecture"]` ; l'omettre et
	 * poser « écriture » rendraient la même chose, mais on rend ce que la
	 * maquette rend.
	 *
	 * LE FORMULAIRE EST UNIQUE ET MIGRE D'UNE ENVELOPPE À L'AUTRE. Le gel le
	 * clone d'un `<template>` dans `#hote-dialogue` ou `#hote-page` ; ici c'est
	 * un `{#snippet}`, rendu dans l'un ou l'autre hôte. Le recopier deux fois
	 * serait deux formulaires à maintenir, et le gel dit lui-même « formulaire,
	 * unique et migrant ».
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : le contenu du mode « édition » vient de
	 * `seeds/corpus.ts`, note `n-sig-statut`, celle que le gel édite.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-23.css`, posé par `node verif/feuilles-de-vue.mjs V-23
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		noteParIdentifiant,
		type Note
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';

	interface Proprietes {
		/** Le vecteur complet de l'état — enveloppe × mode × récupération. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-23')`, variante « complète ». */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const enveloppe = $derived(reglage['env'] === 'page' ? 'page' : 'dialogue');
	const edition = $derived(reglage['mode'] === 'edition');

	/**
	 * LE SIGNET ÉDITÉ — `n-sig-statut`, celui que le gel désigne nommément
	 * (`V-23:2723`) : `window.CORPUS.filter(n => n.id === "n-sig-statut")[0]`. Il
	 * n'est pas choisi, il est lu — et il est lu DANS LE JEU DE SEMENCE DE LA
	 * VUE, comme le gel le lit dans le sien.
	 */
	const SIGNET = $derived(
		(corpus.find((n) => n.id === 'n-sig-statut') ?? noteParIdentifiant('n-sig-statut')) as Note
	);

	/* ── Les valeurs du formulaire, selon le mode ─────────────────────────── */
	const adresse = $derived(edition ? (SIGNET.url ?? '') : '');
	const titre = $derived(edition ? SIGNET.titre : '');
	const description = $derived(edition ? SIGNET.extrait : '');
	const domaineChoisi = $derived(edition ? SIGNET.domaine : MOI.domaine);
	const etiquettes = $derived<readonly string[]>(edition ? SIGNET.etiquettes : []);

	const libelle = $derived(edition ? 'Modifier le signet' : 'Nouveau signet');
	const libelleValider = $derived(
		edition ? 'Enregistrer les modifications' : 'Enregistrer le signet'
	);
	const sousTitre = $derived(
		edition
			? "Les champs sont repris tels qu'ils ont été enregistrés. L'adresse peut être corrigée : le signet reste le même."
			: "Un lien web que l'équipe doit pouvoir retrouver : documentation d'éditeur, page d'état d'un fournisseur, portail de prestataire."
	);

	/* ═════════════════════════════════════════════════════════════════════
	   L'ADRESSE EXTERNE, LUE COMME LE GEL LA LIT — `window.hoteDe` et
	   `window.cheminDe`, recopiées à la lettre. Elles ne vont PAS dans
	   `$lib/rangement/adresses` : ce module compose les adresses INTERNES du
	   produit ; une adresse de signet est une donnée saisie, d'un autre espace
	   de noms.
	   ═════════════════════════════════════════════════════════════════════ */
	function hoteDe(url: string): string {
		// `split` rend toujours au moins un morceau ; le repli est là pour le
		// typage strict, jamais pour un cas réel.
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
	 * L'APERÇU D'ADRESSE — `majApercu()` du gel. Il n'est actif que si le champ
	 * porte une adresse valable ; en création, le champ est vide, donc
	 * `data-actif="non"`. La troncature est à 44 caractères, coupée à 43.
	 */
	const apercuActif = $derived(adresse.trim() !== '');
	const apercuSceau = $derived(apercuActif ? monogramme(adresse) : '??');
	const apercuHote = $derived(apercuActif ? hoteDe(adresse) : '');
	const apercuChemin = $derived.by(() => {
		if (!apercuActif) return '';
		const chemin = cheminDe(adresse);
		return chemin.length > 44 ? chemin.slice(0, 43) + '…' : chemin;
	});

	/** Le compteur de description — 240 caractères, la borne du `maxlength` du gel. */
	const compteurDescription = $derived(`${description.length} / 240`);
</script>

<!--
	LE FORMULAIRE, UNIQUE ET MIGRANT. Rendu dans `#hote-dialogue` ou dans
	`#hote-page` selon l'enveloppe, jamais dans les deux : c'est le clone unique
	du `<template id="tpl-formulaire">` du gel.

	Les régions serrées sont protégées du formateur — un blanc inséré entre deux
	nœuds se lit dans le nom accessible (CLAUDE.md §6, P-6). Ne jamais citer la
	forme exacte de la directive à l'intérieur d'un commentaire (P-9).
-->
{#snippet formulaire()}
	<form class="formulaire" novalidate>
		<div class="champ champ-adresse" id="champ-adresse">
			<!-- prettier-ignore -->
			<label class="champ__label" for="adresse">Adresse du lien <span class="oblig">*</span></label>
			<div class="champ__boite">
				<!--
					`autofocus` — LA CIBLE QUE LE GEL FOCALISE, ET LA SEULE FORME
					DÉCLARATIVE QUI L'HONORE (ECART-020 É-1). Il ne vaut QUE dans la
					boîte de dialogue, où `showModal()` est appelé par la révélation
					APRÈS la stabilisation (CLAUDE.md §6, P-4) : sans lui, la couche
					supérieure focaliserait `.dlg__fermer`, premier focalisable de la
					boîte, et l'anneau de `.saisie:focus` manquerait à l'adresse.
					Aucun script n'est écrit pour cela (ARB-011).
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
					value={adresse}
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
				{#each DOMAINES as d (d.nom)}<option value={d.nom} selected={d.nom === domaineChoisi}>{d.univers + ' › ' + d.nom}</option>{/each}
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
	L'ENVELOPPE « BOÎTE DE DIALOGUE » — rendue HORS de `div.app`, entre
	`div.app` et `div.notifs` : l'emplacement exact du gel (`V-23:1157`,
	ARB-021, A-4). C'est l'un des neuf seuls nœuds hors `div.app` du dépôt qui
	portent une boîte de rendu.

	L'attribut `open` est TOUT ce que la vue pose. La modalité — couche
	supérieure, `position: fixed`, voile — est établie par le banc, des deux
	côtés, par un code unique (ARB-017, `verif/banc/revelation.mjs`).
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
	fil={['Accueil', 'Production', 'Infrastructure', 'Signets', 'Nouveau']}
	courant={['Infrastructure']}
	donnees={{ 'data-enveloppe': enveloppe, 'data-mode': edition ? 'edition' : 'creation' }}
	univers={UNIVERS}
	domaines={DOMAINES}
	notes={corpus}
	compte={{
		nom: MOI.nom,
		initiales: MOI.initiales,
		role: MOI.role,
		domaine: MOI.domaine
	}}
	version={INSTANCE.version}
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
