<script lang="ts">
	/**
	 * V-31 — Console · Templates. Route `/console/templates` (`docs/routes.md` §3.6).
	 *
	 * Coquille de forme abrégée, enveloppe `console`.
	 *
	 * `data-numerote="non"` EST POSÉ SUR `div.app`, ET NULLE PART AILLEURS : le gel
	 * l'écrit là (`V-31:1488`) alors que la règle qui l'exploite vise `body`.
	 * L'attribut ne produit donc RIEN ici, et le porter sur `<body>` CHANGERAIT le
	 * rendu.
	 *
	 * `src/lib/console/` porte les classes communes aux dix vues de console. V-31 est
	 * la vue qui emploie le PLUS d'homonymes du périmètre — quinze, dont
	 * `.selecteur`, `.prose` et `.contexte` : AUCUNE FACTORISATION.
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL : hors de `div.app`,
	 * `.app[data-form="ouvert"] .tiroir-form` ne l'atteint pas. Aucun `autofocus` :
	 * dans le dialogue, `showModal()` focalise déjà `button.dlg__fermer`.
	 *
	 * AUCUN CHIFFRE N'EST SAISI : la structure annoncée est extraite du contenu du
	 * squelette — la règle du gel (`V-31:3295`), pas une table parallèle.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-31.css`.
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import { accord } from '$lib/vocabulaire';
	import type {
		Domaine,
		Note,
		Template,
		TypeDeNote,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		compte: UtilisateurCourant;
		templates: readonly Template[];
		typesNote: readonly TypeDeNote[];
		/**
		 * CE QUE LA VUE FAIT QUAND UN GESTE EST CONFIRMÉ — deux rappels, deux gestes.
		 * Même partage qu'en `V-27`, `V-28`, `V-29`, `V-30` et `V-32` : la vue tient
		 * l'état de son dialogue, la page tient le réseau.
		 */
		onSupprimer?: (template: string) => void;
		/** `RG-REF-02` — « Cocher décochera "X", qui l'est actuellement » (`V-31:380`). */
		onMarquerParDefaut?: (template: string) => void;
		/**
		 * DUPLIQUER UN TEMPLATE — `dupliquer(t)` du gel (`V-31:3385`), qui copie tout
		 * sauf le caractère « par défaut » et suffixe le nom par « (copie) ». Le
		 * suffixe est composé par la page, qui connaît le nom.
		 */
		onDupliquer?: (template: string) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND « CRÉER LE TEMPLATE » OU « ENREGISTRER » EST CLIQUÉ.
		 * Elle rend une PROMESSE parce qu'un refus s'affiche DANS le formulaire :
		 * `#champ-nom` et `#erreur-nom` sont des nœuds du gel, révélés au refus. `id` NUL
		 * DÉSIGNE UNE CRÉATION : c'est la seule chose qui distingue les deux gestes.
		 */
		onEnregistrer?: (demande: {
			readonly id: string | null;
			readonly nom: string;
			readonly description: string;
			readonly type: string;
			readonly defaut: boolean;
			readonly contenu: string;
		}) => Promise<{ readonly enregistre: boolean; readonly message: string | null }>;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte,
		templates,
		typesNote,
		onSupprimer,
		onMarquerParDefaut,
		onDupliquer,
		onEnregistrer
	}: Proprietes = $props();

	/** LA STRUCTURE ANNONCÉE EST EXTRAITE DU CONTENU, jamais lue ailleurs — la règle
	    du gel (`V-31:3295`) : les titres de section du squelette SONT sa structure.
	    `Template.structure` dit la même chose, mais la lire ferait deux sources pour
	    une seule. */
	function structure(html: string): readonly string[] {
		return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
			(m[1] ?? '').replace(/<[^>]*>/g, '').trim()
		);
	}

	/**
	 * Le nombre de notes parties d'un squelette — OU SON ABSENCE.
	 *
	 * LA BASE LE PORTE DÉSORMAIS : la migration `011` a posé `notes.template_id`, une
	 * trace d'origine que `lireTemplates()` compte par jointure. Zéro est donc un
	 * RÉSULTAT — un squelette dont personne n'est encore parti —, et l'entrée du
	 * recensement `MESURES_DE_CONSOLE_SANS_CONTREPARTIE` est retirée.
	 *
	 * `null` RESTE LA RÉPONSE À L'ABSENCE, et le repli n'est pas mort : `Template` est
	 * un type partagé dont les variantes réduites du jeu ne portent pas le champ. Un
	 * repli à zéro afficherait « 0 note » là où l'on ne sait rien, et « 0 » n'est pas
	 * « indisponible » — c'est le zéro muet que `RG-M01-01` vise.
	 */
	function utilisations(t: Template): number | null {
		return t.utilisations ?? null;
	}

	const INDISPONIBLE = '—';

	/**
	 * Le total du bandeau — ou `null` si AUCUN template ne porte le compteur : sommer
	 * en traitant l'absence comme un zéro rendrait un total faux. LE REGISTRE VIDE EST
	 * TRAITÉ À PART, ET IL N'EST PAS UNE ABSENCE : `every()` rend `true` par vacuité,
	 * et zéro template donnait « Les — notes déjà créées » là où la réponse est ZÉRO.
	 */
	const totalUtilisations = $derived(
		templates.length > 0 && templates.every((t) => utilisations(t) === null)
			? null
			: templates.reduce((s, t) => s + (utilisations(t) ?? 0), 0)
	);

	/**
	 * L'ACCORD DE LA PHRASE DE RAPPEL court sur le nom, le participe ET le verbe :
	 * « Les 1 notes déjà créées … ne bougeront pas » aurait été faux trois fois pour
	 * un seul `+s`. Le total INDISPONIBLE ne porte aucun nombre grammatical. L'ARTICLE
	 * « Les » A DISPARU — il ne s'accorde pas seul devant un chiffre.
	 */
	const suiteDuTotal = $derived(
		totalUtilisations === null
			? 'notes déjà créées à partir de ces templates ne bougeront pas.'
			: accord(
					totalUtilisations,
					'note déjà créée à partir de ces templates ne bougera pas.',
					'notes déjà créées à partir de ces templates ne bougeront pas.'
				)
	);

	/**
	 * LE SQUELETTE D'UN TEMPLATE NEUF est celui du gel (`V-31:3468`) : c'est le
	 * point de départ, pas une donnée.
	 */
	const SQUELETTE_NEUF = "<h2>Première section</h2><p>Texte d'exemple, à remplacer.</p>";

	/* L'état, tel que le vecteur de planche le décrit. Le panneau et le dialogue ne
	   s'ouvrent que si la position DÉVIE du réglage par défaut (`V-31:3567`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const sup = $derived(String(reglage['sup'] ?? 'defaut'));

	/**
	 * LE PANNEAU DEMANDÉ DEPUIS L'ÉCRAN — `ouvrirForm(t)` du gel (`V-31:3456`).
	 * `null` au rendu serveur. `template` nul dans la demande, c'est « Nouveau
	 * template » — `ouvrirForm(null)`.
	 */
	let demandeDeFormulaire = $state<{ readonly template: string | null } | null>(null);

	function ouvrirLeFormulaire(template: string | null): void {
		demandeDeFormulaire = { template };
		structureVive = null;
		erreurNom = null;
	}

	function fermerLeFormulaire(): void {
		demandeDeFormulaire = null;
		structureVive = null;
		erreurNom = null;
	}

	/** « NOUVEAU TEMPLATE » OUVRE LE PANNEAU — `V-31:3500`. L'écouteur est posé sur
	    le nœud, pas écrit dans le balisage : `#creer` est rendu par
	    `BoutonDeCreation.svelte`, commun aux six vues à panneau, et lui ajouter un
	    comportement changerait les cinq autres. */
	$effect(() => {
		const bouton = document.getElementById('creer');
		if (bouton === null) return;
		const ouvrir = (): void => ouvrirLeFormulaire(null);
		bouton.addEventListener('click', ouvrir);
		return () => bouton.removeEventListener('click', ouvrir);
	});

	const panneauOuvert = $derived(demandeDeFormulaire !== null || form !== 'ferme');

	/** Le template édité — celui que « Modifier » désigne, sinon celui de la
	 *  position « Édition · Procédure » (`V-31:3571`). */
	const edite = $derived<Template | null>(
		demandeDeFormulaire !== null
			? demandeDeFormulaire.template === null
				? null
				: (templates.find((t) => t.id === demandeDeFormulaire?.template) ?? null)
			: form === 'edition'
				? (templates[0] ?? null)
				: null
	);
	const contenuEdite = $derived(panneauOuvert ? (edite ? edite.contenu : SQUELETTE_NEUF) : '');

	/**
	 * LA STRUCTURE ANNONCÉE PENDANT LA FRAPPE — `majStructure()` du gel
	 * (`V-31:3434`). ELLE EST TENUE À PART DU CONTENU RENDU : le squelette est posé
	 * par `{@html}`, et le relire dans la même expression ferait re-rendre la zone de
	 * rédaction à chaque touche — le point d'insertion sauterait au début.
	 */
	let structureVive = $state<readonly string[] | null>(null);
	const titresEdites = $derived(structureVive ?? (panneauOuvert ? structure(contenuEdite) : []));

	/** Le message de refus du nom — `marquer()` du gel (`V-31:3512`). */
	let erreurNom = $state<string | null>(null);

	/* ── L'éditeur réduit du squelette (`V-31:3396-3444`) ──────────────────── */

	/** Ce que chaque bouton de bloc insère — littéral du gel (`V-31:3399`). */
	const BLOCS: Record<string, string> = {
		h2: '<h2>Titre de section</h2>',
		h3: '<h3>Sous-titre</h3>',
		taches: '<ul class="taches"><li><input type="checkbox"><span>À contrôler</span></li></ul>',
		code: '<div class="bloc-code"><div class="bloc-code__tete"><span class="etiq">bash</span></div><pre><code>commande</code></pre></div>',
		'alerte-attention':
			'<div class="alerte alerte--attention"><div><div class="alerte__tete"><span class="alerte__glyphe">ATTENTION</span> Titre</div><div>Ce qu\'il faut savoir avant d\'agir.</div></div></div>'
	};

	function zoneDeRedaction(): HTMLElement | null {
		const noeud = document.getElementById('f-contenu');
		return noeud instanceof HTMLElement ? noeud : null;
	}

	/** `ligneCourante()` du gel (`V-31:3407`) — le bloc qui porte le curseur. */
	function ligneCourante(zone: HTMLElement): Node | null {
		const selection = document.getSelection();
		if (selection === null || selection.rangeCount === 0) return null;
		let noeud: Node | null = selection.getRangeAt(0).startContainer;
		while (
			noeud !== null &&
			noeud !== zone &&
			!(noeud instanceof HTMLElement && /^(P|DIV|H2|H3|LI)$/.test(noeud.tagName))
		) {
			noeud = noeud.parentNode;
		}
		return noeud === zone ? null : noeud;
	}

	function relireLaStructure(): void {
		const zone = zoneDeRedaction();
		if (zone !== null) structureVive = structure(zone.innerHTML);
	}

	/**
	 * INSÉRER UN BLOC — le geste du gel, remplacement de la ligne courante compris :
	 * le squelette est un contenu que l'utilisateur va remplacer, et la ligne où il
	 * se trouve cède la place.
	 */
	function insererUnBloc(cle: string): void {
		const zone = zoneDeRedaction();
		const html = BLOCS[cle];
		if (zone === null || html === undefined) return;
		zone.focus();
		const porteur = document.createElement('div');
		porteur.innerHTML = html;
		const noeuds = Array.from(porteur.childNodes);
		const ligne = ligneCourante(zone);
		const parent = ligne === null ? null : ligne.parentNode;
		if (ligne !== null && parent !== null) {
			for (const n of noeuds) parent.insertBefore(n, ligne);
			parent.removeChild(ligne);
		} else {
			for (const n of noeuds) zone.appendChild(n);
		}
		relireLaStructure();
	}

	/** GRAS, ITALIQUE ET LES DEUX LISTES — `document.execCommand` du gel
	    (`V-31:3431`), employé tel quel. TIPTAP N'EST PAS EMPLOYÉ ICI : la zone de
	    rédaction est un nœud du gel, et la remplacer par l'arbre d'un éditeur tiers
	    changerait le balisage rendu. */
	function appliquerUneCommande(commande: string): void {
		const zone = zoneDeRedaction();
		if (zone === null) return;
		zone.focus();
		document.execCommand(commande, false);
	}

	/* ── Le pied du panneau (`V-31:3500-3538`) ─────────────────────────────── */

	/** La valeur courante d'un champ du panneau, relue sur le document comme le
	 *  gel la relit (`V-31:3520`) : aucun de ces nœuds n'est lié à un état. */
	function valeurDe(id: string): string {
		const noeud = document.getElementById(id);
		return noeud instanceof HTMLInputElement ||
			noeud instanceof HTMLSelectElement ||
			noeud instanceof HTMLTextAreaElement
			? noeud.value
			: '';
	}

	function estCoche(id: string): boolean {
		const noeud = document.getElementById(id);
		return noeud instanceof HTMLInputElement && noeud.checked;
	}

	/** « CRÉER LE TEMPLATE » / « ENREGISTRER » — le geste de `V-31:3509`. Les deux
	    refus sont ceux du gel, éprouvés des DEUX côtés : ici pour que la saisie ne
	    parte pas pour rien, et à l'action pour qu'aucun client ne les contourne. Le
	    serveur reste le juge. */
	async function validerLeFormulaire(): Promise<void> {
		const nom = valeurDe('f-nom').trim();
		const doublon = templates.some((t) => t !== edite && t.nom.toLowerCase() === nom.toLowerCase());
		if (nom === '' || doublon) {
			erreurNom = nom === '' ? 'Donnez un nom au template.' : `« ${nom} » existe déjà.`;
			document.getElementById('f-nom')?.focus();
			return;
		}
		erreurNom = null;
		if (onEnregistrer === undefined) {
			fermerLeFormulaire();
			return;
		}
		const zone = zoneDeRedaction();
		const issue = await onEnregistrer({
			id: edite?.id ?? null,
			nom,
			description: valeurDe('f-desc').trim(),
			type: valeurDe('f-type'),
			defaut: estCoche('f-defaut'),
			contenu: zone === null ? contenuEdite : zone.innerHTML
		});
		if (issue.enregistre) {
			fermerLeFormulaire();
			return;
		}
		erreurNom = issue.message;
	}

	/** Le template par défaut, hors celui qu'on édite — l'aide du gel s'y règle. */
	const defautActuel = $derived(templates.find((t) => t.defaut && t !== edite) ?? null);

	/**
	 * LE TEMPLATE DONT LA SUPPRESSION EST EXAMINÉE — celui par défaut pour la
	 * position « Template par défaut », le premier qui ne l'est pas pour « Template
	 * ordinaire » (`V-31:3574`). `null` au rendu serveur.
	 */
	let demande = $state<string | null>(null);

	const aSupprimer = $derived<Template | null>(
		demande !== null
			? (templates.find((t) => t.id === demande) ?? null)
			: sup === 'defaut'
				? null
				: (templates.find((t) => !t.defaut) ?? null)
	);

	/**
	 * `showModal()` — ET LA RAISON POUR LAQUELLE `boite.open` NE SUFFIT PAS À LE
	 * DÉCIDER. La vue rend `<dialog open={…}>` : Svelte pose l'attribut AVANT que cet
	 * effet ne coure, une garde sur `open` renonce, et la boîte reste OUVERTE SANS
	 * ÊTRE MODALE — dans le flux, sans couche supérieure. Depuis le pied du panneau de
	 * formulaire, le tiroir passe alors DEVANT elle et son bouton de validation
	 * devient inatteignable. `:modal` est la seule question qui vaille ; on referme
	 * pour rouvrir, `showModal()` sur un dialogue déjà ouvert levant
	 * `InvalidStateError` — et l'exception avalée masquait le défaut.
	 */
	$effect(() => {
		const boite = document.getElementById('dlg-supprimer');
		if (!(boite instanceof HTMLDialogElement)) return;
		if (aSupprimer === null) {
			if (boite.open) boite.close();
			return;
		}
		if (boite.matches(':modal')) return;
		if (boite.open) boite.close();
		boite.showModal();
	});
</script>

<!-- LA VERSION DU PIED DE RAIL VIENT DU CONTEXTE DE COQUILLE, JAMAIS D'ICI : la
	vue passait le numéro du jeu de démonstration comme un fait. -->
<Coquille
	forme="abregee"
	role="admin"
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	fil={filDeConsole('Templates')}
	donnees={{ 'data-form': panneauOuvert ? 'ouvert' : 'ferme', 'data-numerote': 'non' }}
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
		<NavigationConsole courante="templates" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Templates"
			description="Les squelettes proposés au moment de créer une note. Ils font gagner la page blanche, jamais l'écriture : le rédacteur reste libre de tout modifier ou de partir de rien."
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau template" />
			{/snippet}
		</TeteDeSection>

		<!-- Réponse à l'inquiétude la plus fréquente, affichée d'emblée. -->
		<div class="rassurance">
			<svg
				width="18"
				height="18"
				viewBox="0 0 16 16"
				fill="none"
				stroke="var(--c-frais)"
				stroke-width="1.8"
				style="flex:none;margin-top:1px"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
			>
			<div>
				<b>Modifier ou supprimer un template n'affecte aucune note existante.</b>
				Un squelette est copié au moment de la création : la note devient aussitôt indépendante.
				<span id="total-utilisations">{totalUtilisations ?? INDISPONIBLE}</span>
				{suiteDuTotal}
			</div>
		</div>

		<div class="tableau-gestion">
			<div class="tg tg--templates tg--entetes" role="row">
				<span>Nom et structure</span>
				<span class="tg--masquable">Type de note</span>
				<span class="tg--masquable">Par défaut</span>
				<span class="tg--masquable">Utilisations</span>
				<span></span>
			</div>
			<div id="liste">
				{#each templates as t (t.id)}
					{@const titres = structure(t.contenu)}
					<div class="tg tg--templates tg--ligne">
						<div style="min-width:0">
							<div class="tg__nom">{t.nom}</div>
							<div class="tg__desc" style="font-family:var(--f-donnee)">
								{titres.length ? titres.join(' › ') : 'Squelette sans section'}
							</div>
						</div>
						<span class="past past--type tg--masquable" style="justify-self:start">{t.type}</span>
						<span class="tg--masquable"
							>{#if t.defaut}<span class="past past--defaut">par défaut</span>{:else}<button
									class="btn btn--discret"
									type="button"
									style="padding:3px var(--e-2);font-size:var(--t-mini)"
									onclick={() => onMarquerParDefaut?.(t.id)}>Marquer</button
								>{/if}</span
						>
						<span
							class="tg__n tg--masquable"
							style={utilisations(t) ? undefined : 'color:var(--c-encre-4)'}
							>{#if utilisations(t) === null}{INDISPONIBLE}{:else}{utilisations(t)}
								{accord(utilisations(t) ?? 0, 'note')}{/if}</span
						>
						<div class="tg__actions">
							<button class="btn" type="button" onclick={() => ouvrirLeFormulaire(t.id)}
								>Modifier</button
							>
							<button
								class="btn"
								type="button"
								aria-label="Dupliquer {t.nom}"
								onclick={() => onDupliquer?.(t.id)}
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
										d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
									/></svg
								></button
							>
							<button
								class="btn btn--destructif"
								type="button"
								aria-label="Supprimer {t.nom}"
								onclick={() => (demande = t.id)}
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><path
										d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
									/></svg
								></button
							>
						</div>
					</div>
					<!--
						L'ÉTAT VIDE, PARCE QUE LE PRODUIT COMMENCE VIDE. Une instance neuve ne
						porte aucun template : l'écran se réduisait à une ligne d'en-têtes suivie
						de blanc, sous une phrase qui rassure sur des squelettes inexistants.
					-->
				{:else}
					<div class="zone-etat" id="liste-vide">
						<div class="zone-etat__titre">Aucun template</div>
						<div class="zone-etat__txt">
							Rien n'est proposé au moment de créer une note : le rédacteur part de la page blanche,
							ce qui reste un choix valable. Le bouton « Nouveau template », en haut à droite, crée
							le premier squelette.
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de template">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">
						{edite ? edite.nom : 'Nouveau template'}
					</h2>
					<div class="tiroir-form__sous" id="form-sous">
						{#if edite}{utilisations(edite) ?? INDISPONIBLE}
							{(utilisations(edite) ?? 0) > 1
								? 'notes ont été créées à partir de ce squelette — elles ne bougeront pas.'
								: 'note a été créée à partir de ce squelette — elle ne bougera pas.'}{:else}Ce que
							vous écrivez ici est exactement ce que trouvera le rédacteur.{/if}
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
				<div class="champ" id="champ-nom" data-etat={erreurNom === null ? undefined : 'erreur'}>
					<label class="champ__label" for="f-nom">Nom <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-nom"
						autocomplete="off"
						placeholder="Bilan trimestriel"
						value={edite ? edite.nom : ''}
					/>
					<span class="champ__aide">Affiché au moment de choisir un point de départ.</span>
					<div class="champ__erreur" id="erreur-nom" hidden={erreurNom === null}>
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
						<span id="erreur-nom-txt">{erreurNom ?? ''}</span>
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-desc">Description</label>
					<textarea
						class="saisie"
						id="f-desc"
						rows="2"
						placeholder="Quand employer ce squelette plutôt qu'un autre."
						value={edite ? edite.description : ''}></textarea>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-type">Type de note associé</label>
					<select class="selecteur" id="f-type"
						>{#if panneauOuvert}{#each typesNote as type (type)}<option
									value={type}
									selected={type === (edite ? edite.type : 'Procédure')}>{type}</option
								>{/each}{/if}</select
					>
					<span class="champ__aide"
						>Choisir ce template pré-remplira le type de la note. Le rédacteur pourra le changer.</span
					>
				</div>

				<div class="champ">
					<label class="case" style="align-items:flex-start">
						<input type="checkbox" id="f-defaut" checked={edite ? edite.defaut : false} />
						<span class="case__txt"
							>Template par défaut
							<span class="case__aide" id="aide-defaut"
								>{#if panneauOuvert}{#if defautActuel}Proposé en premier dans le sélecteur. Cocher
										décochera « {defautActuel.nom} », qui l'est actuellement.{:else}Proposé en
										premier dans le sélecteur. Aucun template n'est marqué par défaut pour
										l'instant.{/if}{:else}Proposé en premier dans le sélecteur. Un seul template
									peut l'être : cocher celui-ci décochera l'actuel.{/if}</span
							>
						</span>
					</label>
				</div>

				<div class="champ">
					<span class="champ__label">Contenu du squelette</span>
					<span class="champ__aide" style="margin-bottom:var(--e-2)"
						>Éditeur réduit : titres, listes, tâches et encadrés. Le texte sert d'exemple, il est
						destiné à être remplacé.</span
					>

					<div class="outils-red" role="toolbar" aria-label="Mise en forme du squelette">
						<div class="oz">
							<button
								class="ob ob--txt"
								type="button"
								data-bloc="h2"
								title="Titre de section"
								onclick={() => insererUnBloc('h2')}>H2</button
							>
							<button
								class="ob ob--txt"
								type="button"
								data-bloc="h3"
								title="Sous-titre"
								onclick={() => insererUnBloc('h3')}>H3</button
							>
						</div>
						<div class="oz">
							<button
								class="ob"
								type="button"
								data-cmd="bold"
								title="Gras"
								onclick={() => appliquerUneCommande('bold')}
								><b style="font-family:var(--f-ui);font-size:13px">G</b></button
							>
							<button
								class="ob"
								type="button"
								data-cmd="italic"
								title="Italique"
								onclick={() => appliquerUneCommande('italic')}
								><i style="font-family:var(--f-lecture);font-size:13px">I</i></button
							>
						</div>
						<div class="oz">
							<button
								class="ob"
								type="button"
								data-cmd="insertUnorderedList"
								title="Liste à puces"
								aria-label="Liste à puces"
								onclick={() => appliquerUneCommande('insertUnorderedList')}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><path d="M6 4h8M6 8h8M6 12h8" /><circle
										cx="3"
										cy="4"
										r="1"
										fill="currentColor"
										stroke="none"
									/><circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" /><circle
										cx="3"
										cy="12"
										r="1"
										fill="currentColor"
										stroke="none"
									/></svg
								>
							</button>
							<button
								class="ob"
								type="button"
								data-cmd="insertOrderedList"
								title="Liste numérotée"
								aria-label="Liste numérotée"
								onclick={() => appliquerUneCommande('insertOrderedList')}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><path d="M6 4h8M6 8h8M6 12h8" /><path
										d="M2 2.5h1V6M1.8 9.2h1.6L1.8 11.4h1.7"
										stroke-width="1.2"
									/></svg
								>
							</button>
							<button
								class="ob"
								type="button"
								data-bloc="taches"
								title="Liste de tâches"
								aria-label="Liste de tâches"
								onclick={() => insererUnBloc('taches')}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><rect x="1.5" y="2.5" width="4" height="4" rx="1" /><rect
										x="1.5"
										y="9.5"
										width="4"
										height="4"
										rx="1"
									/><path d="M7.5 4.5H14M7.5 11.5H14" /></svg
								>
							</button>
						</div>
						<div class="oz">
							<button
								class="ob"
								type="button"
								data-bloc="alerte-attention"
								title="Encadré attention"
								aria-label="Encadré attention"
								onclick={() => insererUnBloc('alerte-attention')}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><path d="M8 6v3M8 11.2v.3" /><path
										d="M7 2.9L1.7 12a.8.8 0 0 0 .7 1.2h11.2a.8.8 0 0 0 .7-1.2L9 2.9a1.1 1.1 0 0 0-2 0z"
									/></svg
								>
							</button>
							<button
								class="ob"
								type="button"
								data-bloc="code"
								title="Bloc de code"
								aria-label="Bloc de code"
								onclick={() => insererUnBloc('code')}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path
										d="M6 6.5L4 8l2 1.5M10 6.5L12 8l-2 1.5"
									/></svg
								>
							</button>
						</div>
					</div>
					<div
						class="prose redaction-tpl"
						id="f-contenu"
						contenteditable="true"
						spellcheck="true"
						role="textbox"
						aria-multiline="true"
						aria-label="Contenu du squelette"
						oninput={relireLaStructure}
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html contenuEdite}
					</div>
				</div>

				<div class="champ">
					<span class="champ__label">Structure produite</span>
					<div class="structure-apercu" id="apercu-structure">
						<!--
							LA CLÉ EST LE RANG, ET C'EST UNE OBLIGATION : deux sections peuvent porter le
							MÊME titre — le bouton « H2 » insère « Titre de section » autant de fois qu'on
							le clique. Une clé sur le titre ferait `each_key_duplicate`, et Svelte abandonne
							l'hydratation de la PAGE ENTIÈRE, le rendu restant juste.
						-->
						{#if panneauOuvert}{#if titresEdites.length}{#each titresEdites as titre, rang (rang)}<span
										>{titre}</span
									>{/each}{:else}<span
									style="font-size:var(--t-mini);color:var(--c-encre-3);background:none"
									>Aucune section — le squelette s'ouvrira sur un texte libre.</span
								>{/if}{/if}
					</div>
					<span class="champ__aide"
						>Les titres de section, tels qu'ils apparaîtront dans le sélecteur de template.</span
					>
				</div>
			</div>

			<div class="tiroir-form__pied">
				<button
					class="btn btn--destructif"
					id="form-supprimer"
					hidden={!edite}
					onclick={() => {
						if (edite !== null) demande = edite.id;
					}}>Supprimer</button
				>
				<button
					class="btn"
					id="form-dupliquer"
					hidden={!edite}
					onclick={() => {
						if (edite !== null) onDupliquer?.(edite.id);
					}}>Dupliquer</button
				>
				<button class="btn" id="form-annuler" onclick={fermerLeFormulaire}>Annuler</button>
				<button
					class="btn btn--principal"
					id="form-valider"
					onclick={() => void validerLeFormulaire()}
					><span id="form-valider-txt">{edite ? 'Enregistrer' : 'Créer le template'}</span></button
				>
			</div>
		</aside>

		<dialog
			class="dlg"
			id="dlg-supprimer"
			aria-labelledby="dlg-sup-titre"
			open={aSupprimer !== null}
		>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true" style="background:var(--c-alerte)">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><path d="M8 4.5v4.2M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer le template</h2>
					<button
						class="dlg__fermer"
						data-fermer
						aria-label="Fermer"
						onclick={() => (demande = null)}
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
				<div class="dlg__corps">
					<p class="dlg__texte" id="sup-txt">
						{#if aSupprimer}« {aSupprimer.nom} » disparaîtra du choix proposé à la création d'une note.{:else}—{/if}
					</p>
					<!-- Le rappel est répété ici, à l'endroit où l'inquiétude se manifeste. -->
					<div class="contexte contexte--succes" style="margin:0">
						<span class="contexte__marque" aria-hidden="true">✓</span>
						<div>
							<div class="contexte__titre">Aucune note ne sera touchée</div>
							<div id="sup-rassure">
								{#if aSupprimer}{#if utilisations(aSupprimer)}{accord(
											utilisations(aSupprimer) ?? 0,
											"La note créée à partir de ce squelette garde son contenu, sa structure et son historique. Un template est copié à la création : elle n'y est plus rattachée depuis longtemps.",
											`Les ${utilisations(aSupprimer)} notes créées à partir de ce squelette gardent leur contenu, leur structure et leur historique. Un template est copié à la création : elles n'y sont plus rattachées depuis longtemps.`
										)}{:else}Aucune note n'a encore été créée à partir de ce squelette.{/if}{:else}—{/if}
							</div>
						</div>
					</div>
					<div id="sup-defaut" hidden={!aSupprimer?.defaut}>
						<div class="refus">
							<div class="refus__titre">Ce template est le template par défaut</div>
							<div class="refus__sortie">
								En le supprimant, la création de note s'ouvrira sur la page vierge tant qu'un autre
								n'aura pas été marqué par défaut. Ce n'est pas bloquant, mais autant le savoir.
							</div>
						</div>
					</div>
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer onclick={() => (demande = null)}>Annuler</button>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						onclick={() => {
							if (aSupprimer === null) return;
							onSupprimer?.(aSupprimer.id);
						}}>Supprimer</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
