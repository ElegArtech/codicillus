<script lang="ts">
	/**
	 * V-31 — Console · Templates.
	 * Route `/console/templates` (`docs/routes.md` §3.6).
	 *
	 * COQUILLE DE FORME ABRÉGÉE, ENVELOPPE `console` — vérifié sur le gel par
	 * `node verif/releve-vues.mjs --formes` (ARB-021, A-1 ; ARB-023).
	 *
	 * `data-numerote="non"` EST POSÉ SUR `div.app`, ET NULLE PART AILLEURS.
	 * Le gel l'écrit là (`V-31:1488`) alors que la règle qui l'exploite vise
	 * `body` (`docs/releve-vues.md` §7.7) : dans cette vue l'attribut ne produit
	 * donc RIEN, et le gel le veut ainsi. Le porter sur `<body>` — ce que
	 * `verif/references/protocole-app.json` → `attributs_de_corps` permettrait —
	 * CHANGERAIT le rendu. C'est un comblement, et il serait rouge au banc.
	 *
	 * CE QUI EST COMMUN, ET CE QUI NE L'EST PAS. `src/lib/console/` porte les
	 * treize classes des dix vues de console et le panneau des six registres
	 * (`sections.ts`, en-tête). Propres à V-31 : `rassurance`,
	 * `structure-apercu`, `redaction-tpl`, `outils-red`, `oz`, `ob`, `ob--txt`,
	 * et le modificateur de grille `tg--templates`. V-31 est la vue qui emploie
	 * le PLUS d'homonymes du périmètre — quinze (`docs/releve-vues.md` §7.3),
	 * dont `.selecteur`, `.prose` et `.contexte` : AUCUNE FACTORISATION.
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL. Hors de
	 * `div.app`, `.app[data-form="ouvert"] .tiroir-form` ne l'atteint pas. Le
	 * NIVEAU 1 en est le seul juge (`CLAUDE.md` §6, P-3).
	 *
	 * AUCUN `autofocus` : hors dialogue, le focus ne survit pas à `stabiliser()`
	 * (`CLAUDE.md` §6, P-4). Dans le dialogue, `showModal()` — établi par le
	 * banc (ARB-017) — focalise déjà `button.dlg__fermer`.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : le total d'utilisations est la somme
	 * des utilisations de `TEMPLATES`, et la structure annoncée est extraite du
	 * contenu du squelette — la règle du gel (`V-31:3295`), pas une table
	 * parallèle.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette`, `dialog#palette` fermé,
	 * et `div.planche`, bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-31.css` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import type {
		Domaine,
		Note,
		Template,
		TypeDeNote,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';

	interface Proprietes {
		/** Le vecteur complet de l'état — formulaire × suppression. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-31')`. */
		notes: readonly Note[];
		/** Les univers déclarés, servis par la route. Vide : aucun périmètre. */
		univers: readonly Univers[];
		/** Les domaines déclarés, servis par la route. Vide : aucun domaine. */
		domaines: readonly Domaine[];
		/** L'utilisateur courant, servi par la route. */
		compte: UtilisateurCourant;
		/** Les squelettes déclarés, servis par la route. Vide : aucun squelette. */
		templates: readonly Template[];
		/** Les types de note proposés, servis par la route. */
		typesNote: readonly TypeDeNote[];
		/**
		 * CE QUE LA VUE FAIT QUAND UN GESTE EST CONFIRMÉ — deux rappels, deux
		 * gestes. Même partage qu'en `V-27`, `V-28`, `V-29`, `V-30` et `V-32` : la
		 * vue tient l'état de son dialogue, la page tient le réseau. Le template est
		 * désigné par son identifiant lisible, que `Template.id` porte déjà.
		 */
		onSupprimer?: (template: string) => void;
		/** `RG-REF-02` — « Cocher décochera "X", qui l'est actuellement » (`V-31:380`). */
		onMarquerParDefaut?: (template: string) => void;
		/**
		 * DUPLIQUER UN TEMPLATE — `dupliquer(t)` du gel (`V-31:3385`), qui copie
		 * tout sauf le caractère « par défaut » et suffixe le nom par « (copie) ».
		 * Le suffixe est composé par la page, qui connaît le nom : la vue ne
		 * transmet que la DÉSIGNATION du modèle, comme les deux rappels ci-dessus.
		 */
		onDupliquer?: (template: string) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND « CRÉER LE TEMPLATE » OU « ENREGISTRER » EST
		 * CLIQUÉ — même partage qu'en `V-32` : la vue relève les cinq nœuds de son
		 * panneau et rend la demande, la page tient le réseau et l'action.
		 *
		 * ELLE REND UNE PROMESSE parce qu'un refus s'affiche DANS le formulaire :
		 * `#champ-nom` et `#erreur-nom` sont des nœuds du gel, révélés au refus, et
		 * la vue a donc besoin de savoir ce que le serveur a répondu.
		 *
		 * `id` NUL DÉSIGNE UNE CRÉATION. C'est la seule chose qui distingue les
		 * deux gestes : le formulaire, ses champs et sa validation sont les mêmes.
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

	/**
	 * LA STRUCTURE ANNONCÉE EST EXTRAITE DU CONTENU, jamais lue ailleurs.
	 * C'est la règle du gel (`V-31:3295`) : les titres de section du squelette
	 * SONT sa structure. `Template.structure` du jeu de semence dit la même
	 * chose, mais la lire ferait deux sources pour une seule — et le contenu
	 * saisi dans le panneau, lui, n'a pas de table à consulter.
	 */
	function structure(html: string): readonly string[] {
		return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
			(m[1] ?? '').replace(/<[^>]*>/g, '').trim()
		);
	}

	/**
	 * Le nombre de notes créées à partir d'un squelette — OU SON ABSENCE.
	 *
	 * `Template.utilisations` est FACULTATIF dans `seeds/corpus.ts`, et la base
	 * NE LE PORTE PAS : `src/lib/donnees/lecture.ts` le dit en propres termes —
	 * « `utilisations` n'a AUCUNE colonne : c'est un compteur d'emploi » —, et
	 * aucune colonne de `notes` ne rattache une note au template qui l'a amorcée.
	 *
	 * LE REPLI À ZÉRO ÉTAIT SANS CONSÉQUENCE TANT QUE LA VUE LISAIT LE JEU DE
	 * SEMENCE, qui porte la clé pour ses quatre templates. Servi depuis la base,
	 * il afficherait « 0 note » partout — et « 0 » n'est pas « indisponible » :
	 * c'est exactement le zéro muet que `RG-M01-01` vise et que `P-02` proscrit.
	 *
	 * `null` DIT L'ABSENCE, ET LE RENDU LA MONTRE PAR « — » — la marque que le
	 * gel emploie déjà pour un vide (`V-28:614`, `aSupprimer?.nom ?? '—'`). La
	 * lacune est par ailleurs recensée dans `MESURES_DE_CONSOLE_SANS_CONTREPARTIE`
	 * (`src/lib/donnees/consoles.ts`), de sorte qu'elle soit comptée et non
	 * seulement racontée.
	 */
	function utilisations(t: Template): number | null {
		return t.utilisations ?? null;
	}

	/** L'absence de compteur, telle qu'elle s'écrit à l'écran. */
	const INDISPONIBLE = '—';

	/**
	 * Le total du bandeau — ou `null` si AUCUN template ne porte le compteur.
	 * Sommer en traitant l'absence comme un zéro rendrait un total faux ; le
	 * total n'existe que si la donnée existe.
	 *
	 * LE REGISTRE VIDE EST TRAITÉ À PART, ET IL N'EST PAS UNE ABSENCE. `every()`
	 * rend `true` par vacuité : sur une instance neuve, zéro template donnait
	 * donc « Les — notes déjà créées », un tiret là où la réponse est ZÉRO et
	 * qu'elle est CERTAINE. Sans template, aucune note n'a pu être amorcée : le
	 * total se calcule, il ne se devine pas.
	 */
	const totalUtilisations = $derived(
		templates.length > 0 && templates.every((t) => utilisations(t) === null)
			? null
			: templates.reduce((s, t) => s + (utilisations(t) ?? 0), 0)
	);

	/**
	 * LE SQUELETTE D'UN TEMPLATE NEUF est celui du gel (`V-31:3468`) : une
	 * section et une ligne de texte d'exemple. Aucun template du jeu de semence
	 * ne le porte — c'est le point de départ, pas une donnée.
	 */
	const SQUELETTE_NEUF = "<h2>Première section</h2><p>Texte d'exemple, à remplacer.</p>";

	/* ── L'état, tel que le vecteur de planche le décrit ───────────────────
	   Le panneau et le dialogue ne s'ouvrent que si la position DÉVIE du
	   réglage par défaut (`V-31:3567`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const sup = $derived(String(reglage['sup'] ?? 'defaut'));

	/**
	 * LE PANNEAU DEMANDÉ DEPUIS L'ÉCRAN — `ouvrirForm(t)` du gel (`V-31:3456`).
	 *
	 * `null` AU RENDU SERVEUR : l'écran reste celui que le vecteur décrit tant
	 * que personne n'a cliqué, et les planches du banc ne bougent pas d'un pixel.
	 * `template` nul dans la demande, c'est « Nouveau template » — `ouvrirForm(null)`.
	 */
	let demandeDeFormulaire = $state<{ readonly template: string | null } | null>(null);

	function ouvrirLeFormulaire(template: string | null): void {
		demandeDeFormulaire = { template };
		structureVive = null;
		erreurNom = null;
	}

	/** `fermerForm()` du gel (`V-31:3494`) — le panneau se referme, rien n'est écrit. */
	function fermerLeFormulaire(): void {
		demandeDeFormulaire = null;
		structureVive = null;
		erreurNom = null;
	}

	/**
	 * « NOUVEAU TEMPLATE » OUVRE LE PANNEAU — `V-31:3500` :
	 * `document.getElementById("creer").addEventListener("click", …)`.
	 *
	 * L'ÉCOUTEUR EST POSÉ SUR LE NŒUD, PAS ÉCRIT DANS LE BALISAGE, et pour la
	 * raison que `V-32` énonce déjà : `#creer` est rendu par
	 * `BoutonDeCreation.svelte`, commun aux six vues à panneau, et qui ne prend
	 * aucun comportement en propriété. `$effect` ne court qu'au navigateur.
	 */
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
	 * (`V-31:3434`), qui relit `f-contenu` à chaque saisie.
	 *
	 * ELLE EST TENUE À PART DU CONTENU RENDU, ET C'EST LE POINT DÉLICAT. Le
	 * squelette est posé par `{@html}` : le relire dans la même expression
	 * ferait re-rendre la zone de rédaction à chaque touche, et le point
	 * d'insertion sauterait au début à chaque caractère. `structureVive` porte
	 * donc la lecture du document, et le repli sur le contenu servi ne vaut que
	 * tant que personne n'a rien tapé.
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

	/** `majStructure()` du gel — la structure suit ce que la zone contient. */
	function relireLaStructure(): void {
		const zone = zoneDeRedaction();
		if (zone !== null) structureVive = structure(zone.innerHTML);
	}

	/**
	 * INSÉRER UN BLOC — le geste du gel, remplacement de la ligne courante
	 * compris. Le squelette est un contenu que l'utilisateur va remplacer : la
	 * ligne où il se trouve cède la place, elle ne s'ajoute pas au-dessus.
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

	/**
	 * GRAS, ITALIQUE ET LES DEUX LISTES — `document.execCommand` du gel
	 * (`V-31:3431`), employé tel quel.
	 *
	 * TIPTAP N'EST PAS EMPLOYÉ ICI, ET C'EST MESURÉ. La zone de rédaction est un
	 * nœud du gel — `#f-contenu`, avec ses classes et son contenu servi ; la
	 * remplacer par l'arbre d'un éditeur tiers changerait le balisage rendu, ce
	 * que rien dans cet écran ne demande. La commande native fait exactement ce
	 * que la maquette fait, sur le nœud que la maquette pose.
	 */
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

	/**
	 * « CRÉER LE TEMPLATE » / « ENREGISTRER » — le geste de `V-31:3509`.
	 *
	 * LES DEUX REFUS SONT CEUX DU GEL, et ils sont éprouvés des DEUX côtés : ici
	 * pour que la saisie ne parte pas pour rien, et à l'action pour qu'aucun
	 * client ne les contourne. Ce n'est pas une double définition — c'est la même
	 * règle, dont le serveur reste le juge : son message l'emporte.
	 */
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
	 * LE TEMPLATE PROPOSÉ À LA SUPPRESSION (`V-31:3574`) : celui par défaut pour
	 * la position « Template par défaut », le premier qui ne l'est pas pour
	 * « Template ordinaire ». La position par défaut n'ouvre rien.
	 */
	/**
	 * LE TEMPLATE DONT LA SUPPRESSION EST EXAMINÉE. `null` au rendu serveur :
	 * l'écran reste celui que le vecteur décrit tant que personne n'a cliqué.
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
	 * DÉCIDER, qui a coûté un geste inatteignable.
	 *
	 * La vue rend `<dialog open={…}>` : Svelte pose donc l'attribut AVANT que cet
	 * effet ne coure. `boite.open` vaut déjà vrai, la garde `if (!boite.open)`
	 * renonce, et la boîte reste OUVERTE SANS ÊTRE MODALE — rendue dans le flux
	 * de la superposition, sans fond, sans couche supérieure.
	 *
	 * Tant que rien ne la recouvrait, la différence ne se voyait pas. Depuis le
	 * PIED DU PANNEAU DE FORMULAIRE, le tiroir passe DEVANT elle et son bouton de
	 * validation devient inatteignable : le dialogue s'affiche, et le geste ne
	 * part jamais. C'est `P-5` — un chemin que rien n'avait parcouru.
	 *
	 * `:modal` EST LA SEULE QUESTION QUI VAILLE, parce que c'est exactement celle
	 * qu'on pose : cette boîte est-elle dans la couche supérieure ? Un dialogue
	 * ouvert par attribut y répond non, et on le referme pour le rouvrir comme il
	 * faut — `showModal()` sur un dialogue déjà ouvert lève `InvalidStateError`,
	 * et l'exception avalée était précisément ce qui masquait le défaut.
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

<!--
	LA VERSION DU PIED DE RAIL VIENT DU CONTEXTE DE COQUILLE, JAMAIS D'ICI.
	La vue passait `instance.version` — le `1.0.0` d'`INSTANCE` du jeu de
	démonstration, servi comme un fait sur le pied du rail d'une instance
	réelle. Aucune route ne passe de version : `Coquille` lit celle du paquet
	sur le contexte que le gabarit racine pose, et la propriété n'est plus
	qu'un état vide explicite — hors gabarit racine, le pied ne nomme rien
	plutôt que de nommer un numéro de démonstration.
-->
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
				Un squelette est copié au moment de la création : la note devient aussitôt indépendante. Les
				<span id="total-utilisations">{totalUtilisations ?? INDISPONIBLE}</span> notes déjà créées à partir
				de ces templates ne bougeront pas.
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
								{(utilisations(t) ?? 0) > 1 ? 'notes' : 'note'}{/if}</span
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
						placeholder="Compte rendu"
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
							LA CLÉ EST LE RANG, ET C'EST UNE OBLIGATION, PAS UN CHOIX DE STYLE.

							Deux sections peuvent porter le MÊME titre — le bouton « H2 » insère
							« Titre de section » autant de fois qu'on le clique, et c'est le geste
							du gel. Une clé sur le titre ferait alors `each_key_duplicate`, et
							Svelte abandonne l'hydratation de la PAGE ENTIÈRE : plus un écouteur
							ne serait posé, sur aucun écran de cette route. Le rendu resterait
							juste, ce qui rend le défaut invisible à l'œil.

							Tant que la structure venait du contenu SERVI, le cas ne pouvait pas
							se produire. Il le peut depuis que la frappe la met à jour.
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
								{#if aSupprimer}{#if utilisations(aSupprimer)}Les {utilisations(aSupprimer)} notes créées
										à partir de ce squelette gardent leur contenu, leur structure et leur historique.
										Un template est copié à la création : elles n'y sont plus rattachées depuis longtemps.{:else}Aucune
										note n'a encore été créée à partir de ce squelette.{/if}{:else}—{/if}
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
