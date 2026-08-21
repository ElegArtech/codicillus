<script lang="ts">
	/**
	 * V-36 — Console · Exports. Route `/console/exports` (`docs/routes.md`).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES QUATRE ÉTATS RENDENT LE MÊME ÉCRAN, ET C'EST UN FAIT DU GEL
	 *
	 * `verif/scenarios/V-36.json` déclare quatre états — `issue-propre`,
	 * `issue-avert`, `vol-normal`, `vol-lent` —, dont un seul est marqué
	 * `identiqueA`. Les trois autres ne le sont pas parce que l'extraction
	 * compare des VECTEURS, pas des rendus. Or, au gel, les deux contrôles de
	 * planche ne touchent RIEN au chargement :
	 *
	 *   • `input[name="issue"]` et `input[name="vol"]` n'ont qu'un seul
	 *     gestionnaire de `change` : `document.getElementById("resultat")
	 *     .innerHTML = ""` (`V-36:3088-3092`) — or `#resultat` est DÉJÀ vide,
	 *     `rendreRecap()` venant de le vider ;
	 *   • leur valeur n'est lue qu'à l'intérieur du gestionnaire de clic de
	 *     `#exporter` (`V-36:2979`, `V-36:3012`), c'est-à-dire jamais tant que
	 *     l'archive n'est pas demandée.
	 *
	 * Les quatre états sont donc l'écran AU REPOS, `data-etat="repos"`, sans
	 * résultat ni progression. Ce n'est pas une simplification : c'est ce que
	 * la maquette montre, et le banc en est le juge sur les quatre couples.
	 *
	 * CE QUE CETTE VUE NE REND PAS, ET POURQUOI. La préparation de l'archive
	 * est une MINUTERIE (`setInterval` à 90 ou 130 ms, `V-36:2992`) qui fait
	 * avancer `#barre` et bascule `data-etat` de `repos` à `encours` puis
	 * `fini`. ARB-011 : le squelette rend l'état, jamais la transition. Aucun
	 * état déclaré ne montre `encours` ni `fini` — les positions `avert` et
	 * `lent` de la planche décrivent ce que l'export PRODUIRAIT, et il faut un
	 * clic pour l'obtenir. `#etat` est donc rendu `hidden`, comme au gel, et
	 * `#resultat` vide.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * TOUT CHIFFRE VIENT DU CORPUS — AUCUN LITTÉRAL DE DONNÉE
	 *
	 * `apercuExport()` est le calque exact de `window.apercuExport`
	 * (`V-36:2661`), qui s'appuie lui-même sur `notesDuDomaine`,
	 * `dossiersDuDomaine` et `compterDossiers` (`V-36:1926`, `:1946`,
	 * `:2530`). Les cinq lignes du récapitulatif, le volume estimé, le nombre
	 * de dossiers annoncé par « L'arborescence de dossiers, reproduite » et
	 * l'arborescence d'archive en sortent tous.
	 *
	 * LE NOM D'ARCHIVE PORTE UNE DATE, ET ELLE N'EST PAS ÉCRITE À LA MAIN. Le
	 * gel écrit `ardoise(dom) + "-2026-08-13.zip"` (`V-36:2964`, `V-36:3061`).
	 * `2026-08-13` est `DATE_REFERENCE` de `seeds/corpus.ts` — « la date à
	 * laquelle le corpus est figé » —, et c'est de là qu'elle est prise.
	 *
	 * LE DOMAINE COURANT EST LE PREMIER DE `DOMAINES`. Le gel ne pose aucun
	 * `selected` : `rendreRecap()` lit `select.value`, qui est celui de la
	 * première option (`V-36:3357-3363`, puis `:3364`).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA COQUILLE ET LE MOTIF COMMUN
	 *
	 * Forme ABRÉGÉE (ARB-021), enveloppe `div.console` (ARB-023), et les treize
	 * classes du motif commun des dix vues de console, portées par
	 * `$lib/console/` — écrites par P-2, consommées ici (`docs/releve-vues.md`
	 * §9, R-2). V-36 n'a NI panneau `tiroir-form`, NI `data-form`, NI dialogue
	 * de suppression, NI tableau de gestion : c'est mesuré, et c'est ce qui
	 * sépare les quatre pages des six registres.
	 *
	 * `data-etat="repos"` est transmis à `div.app` par `donnees` (ARB-021,
	 * A-2) : le gel le pose (`V-36:1054`) et la feuille de la vue le lit.
	 *
	 * L'hôte de palette de V-09 — `template#tpl-palette` et `dialog#palette`
	 * fermé — n'est pas rendu : mesuré SANS AUCUNE INCIDENCE sur trente
	 * maquettes (`docs/releve-vues.md` §4.1). `div.notifs` est rendu vide :
	 * les notifications sont du comportement (ARB-011, T-017).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE CE COMPOSANT NE PROUVE PAS. Il rend un ÉTAT DE MAQUETTE. Ni
	 * `P-09`, ni `P-02`, ni `RG-M15-03` ne sont déclarées tenues par ce lot.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-36.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-36 --installer`. Les six `style=`
	 * reproduits figurent tous à l'ensemble clos du gel de V-36 (ARB-016,
	 * `node verif/styles-en-ligne.mjs V-36`).
	 */
	import {
		DATE_REFERENCE,
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { motFicheMinuscule, motFichePlurielMinuscule } from '$lib/vocabulaire';

	interface Proprietes {
		/**
		 * Le jeu de semence de la vue — `corpusPourVue('V-36')`. C'est la SEULE
		 * propriété que cette vue lit : ses quatre états rendent le même écran,
		 * et `etat` comme `vecteur` ne lui apprendraient rien.
		 */
		notes: readonly Note[];
		/**
		 * LES DOMAINES DE L'INSTANCE, EN PROPRIÉTÉ OPTIONNELLE (T-045). Absente,
		 * `DOMAINES` du jeu de semence s'applique — c'est ce que le mode démo
		 * passe, et c'est ce qui garantit que le banc ne bouge pas d'un pixel.
		 */
		domaines?: readonly Domaine[];
		/**
		 * LES QUATRE SOURCES DE LA COQUILLE, TOUTES FACULTATIVES — le rail de
		 * gauche, le fil et l'identité de la barre. Absentes, les constantes du jeu
		 * de semence s'appliquent, et cette vue rend exactement ce qu'elle rendait.
		 * `CoquilleDeConsole.svelte:70-75` les déclare dans les mêmes termes ; elles
		 * ne faisaient que manquer ICI, si bien que cet écran affichait le rail et
		 * l'utilisateur du jeu de semence même servi depuis la base.
		 *
		 * `domaines` est déclarée plus haut : elle servait déjà au CONTENU de cet
		 * écran — le périmètre exportable — avant de servir au rail.
		 */
		univers?: readonly Univers[];
		compte?: UtilisateurCourant;
		instance?: EtatDInstance;
		/**
		 * CE QUE LA VUE FAIT QUAND L'ARCHIVE EST DEMANDÉE.
		 *
		 * `P-03` — « une entrée visible est une entrée qui fonctionne » : le bouton
		 * « Préparer l'archive » est au gel, et la route qui produit l'archive
		 * existe (`/console/exports/{univers}/{domaine}`). Il ne manquait que le
		 * fil entre les deux. La vue rend le NOM du domaine choisi ; la page sait à
		 * quelle adresse il correspond.
		 */
		onExporter?: (domaine: string) => void;
	}

	const {
		notes,
		domaines = DOMAINES,
		univers = UNIVERS,
		compte = MOI,
		instance = INSTANCE,
		onExporter
	}: Proprietes = $props();

	/* ── Le calque des fabriques du gel ──────────────────────────────────────
	   `ECART-020` É-3 : un gel qui produit une valeur par une fabrique n'admet
	   pas qu'on la réécrive autrement. Ces quatre fonctions sont recopiées de
	   la maquette, ligne à ligne, et appelées avec les mêmes arguments. */

	/**
	 * `window.notesDuDomaine` (`V-36:2530`).
	 *
	 * LE CORPUS LU EST CELUI DE LA PROPRIÉTÉ, PLUS CELUI DU MODULE. La fabrique
	 * du gel ferme sur `CORPUS`, parce qu'une maquette n'a qu'une source ; ici la
	 * vue reçoit ses notes en propriété — `notes` —, et lire `CORPUS` revenait à
	 * décompter le jeu de semence quelle que soit la base servie. Tout ce que cet
	 * écran chiffre en découle : notes, fiches, signets, dossiers, pièces jointes,
	 * et jusqu'au nom de l'archive. L'argument change, la fabrique non.
	 */
	const notesDuDomaine = (nom: string): readonly Note[] => notes.filter((n) => n.domaine === nom);

	interface NoeudDeDossier {
		enfants: Record<string, NoeudDeDossier>;
		notes: number;
	}

	/** `window.dossiersDuDomaine` (`V-36:1926`) — le rangement affiché est celui
	 *  qui existe : il se déduit du chemin des notes, jamais d'une table à part. */
	function dossiersDuDomaine(domaine: string): Record<string, NoeudDeDossier> {
		const racines: Record<string, NoeudDeDossier> = {};
		for (const n of notes) {
			if (n.domaine !== domaine || !n.dossier) continue;
			const segments = n.dossier
				.split('›')
				.map((s) => s.trim())
				.filter(Boolean);
			let niveau = racines;
			for (const s of segments) {
				const noeud = (niveau[s] ??= { enfants: {}, notes: 0 });
				niveau = noeud.enfants;
			}
			let courant = racines;
			segments.forEach((s, k) => {
				const noeud = courant[s];
				if (!noeud) return;
				if (k === segments.length - 1) noeud.notes++;
				courant = noeud.enfants;
			});
		}
		return racines;
	}

	/** `window.compterDossiers` (`V-36:1946`). */
	function compterDossiers(arbre: Record<string, NoeudDeDossier>): number {
		return Object.values(arbre).reduce((s, n) => s + 1 + compterDossiers(n.enfants), 0);
	}

	/** `window.apercuExport` (`V-36:2661`). L'estimation de volume est celle du
	 *  gel : « le texte pèse peu, les pièces jointes font le volume ». */
	function apercuExport(domaine: string) {
		const liste = notesDuDomaine(domaine);
		const arbre = dossiersDuDomaine(domaine);
		const pj = liste.reduce((s, n) => s + (n.pj ?? 0), 0);
		const mots = liste.reduce((s, n) => s + n.extrait.split(/\s+/).length * 14, 0);
		return {
			notes: liste.length,
			dossiers: compterDossiers(arbre),
			fiches: liste.filter((n) => n.type === 'Fiche').length,
			signets: liste.filter((n) => n.type === 'Signet').length,
			pieces: pj,
			octets: Math.round((mots * 6) / 1024) + pj * 780
		};
	}

	/** `volume()` (`V-36:2877`). */
	const volume = (ko: number): string =>
		ko < 1024 ? `${ko} Ko` : `${Math.round((ko / 1024) * 10) / 10} Mo`;

	/** `ardoise()` (`V-36:2880`) — le nom de fichier tiré d'un libellé. */
	const ardoise = (nom: string): string =>
		nom
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-');

	/* ── L'état rendu ────────────────────────────────────────────────────────
	   Le domaine courant est celui de la première option, faute de `selected`
	   au gel. `notes` reste la propriété du contrat de rendu ; les agrégats
	   d'export portent, eux, sur le corpus entier, comme au gel — la vue de
	   console administre l'instance, pas une variante. */
	/**
	 * LE DOMAINE CHOISI — `select#domaine` du gel, dont la valeur initiale est le
	 * premier de la liste. Au rendu serveur, `choisi` est vide et le premier
	 * s'applique : l'écran reste celui que la maquette montre.
	 */
	let choisi = $state('');
	const domaineCourant = $derived(
		/* `domaines[0]!` faisait tomber la page quand la liste est VIDE — une
		   instance neuve n'a aucun domaine, et l'export sortait en 500. La chaîne
		   vide traverse le reste sans rien affirmer : l'écran rend son état vide. */
		choisi !== '' && domaines.some((d) => d.nom === choisi) ? choisi : (domaines[0]?.nom ?? '')
	);
	const apercu = $derived(apercuExport(domaineCourant));

	/** Les cinq lignes du récapitulatif, dans l'ordre du gel (`V-36:2894`). */
	const recapitulatif = $derived([
		['Notes', apercu.notes],
		[`dont ${motFichePlurielMinuscule}`, apercu.fiches],
		['dont signets', apercu.signets],
		['Dossiers', apercu.dossiers],
		['Pièces jointes', apercu.pieces]
	] as const);

	/** L'arborescence d'archive (`V-36:2955-2969`), montrée plutôt que décrite. */
	const archive = $derived.by(() => {
		const arbre = dossiersDuDomaine(domaineCourant);
		const [premier, racine] = Object.entries(arbre)[0] ?? [];
		const sous = racine ? Object.keys(racine.enfants)[0] : undefined;
		const note = notesDuDomaine(domaineCourant)[0];
		const feuille = note ? ardoise(note.titre) : 'note';
		return {
			nom: `${ardoise(domaineCourant)}-${DATE_REFERENCE}.zip`,
			corps:
				`\n├── ${premier ?? 'notes'}/\n` +
				(sous ? `│   └── ${sous}/\n│       └── ${feuille}.md\n` : `│   └── ${feuille}.md\n`) +
				(apercu.pieces ? '├── pieces-jointes/\n' : '') +
				'├── rapport-de-conversion.md\n' +
				'└── domaine.json'
		};
	});
</script>

<CoquilleDeConsole
	section="exports"
	{notes}
	{univers}
	{domaines}
	{compte}
	{instance}
	donnees={{ 'data-etat': 'repos' }}
>
	{#snippet enfants()}
		<TeteDeSection
			titre="Exports"
			description="Extraire un domaine entier dans un format ouvert, lisible sans le produit."
		/>

		<!--
			AUCUN BLANC ENTRE LES NŒUDS PORTEURS DE TEXTE, et il doit le rester :
			le relevé d'ordre de tabulation du niveau 1 construit le nom accessible
			sur `textContent`, où un blanc réintroduit par le formateur se voit
			(CLAUDE.md §6, P-6). D'où les gardes de formatage ci-dessous, dont la
			forme est exacte et obligatoire : un commentaire rédigé autrement
			n'est pas reconnu par le formateur.
		-->
		<!-- prettier-ignore -->
		<section class="reversible"
			><div class="reversible__ic"
				><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 12a9 9 0 0 1 15.3-6.4M21 12a9 9 0 0 1-15.3 6.4"/><path d="M18 2.5V6h-3.5M6 21.5V18h3.5"/></svg
			></div
			><div
				><h2>Cet export est réimportable</h2
				><p>Réimporter l'archive reconstitue le domaine <b>à l'identique</b> : mêmes notes, même arborescence, mêmes métadonnées, mêmes liens entre notes. C'est ce qui distingue une sauvegarde d'une copie morte — et ce qui garantit que vous n'êtes pas prisonnier de ce produit.</p
			></div
		></section>

		<div class="grille-export">
			<div>
				<div class="champ" style="margin-bottom:var(--e-4)">
					<label class="champ__label" for="domaine">Domaine à exporter</label>
					<!-- prettier-ignore -->
					<select
						class="selecteur"
						id="domaine"
						value={domaineCourant}
						onchange={(e) => (choisi = e.currentTarget.value)}
						>{#each domaines as d (d.nom)}<option value={d.nom}>{d.univers} › {d.nom} — {notesDuDomaine(d.nom).length} notes</option>{/each}</select
					>
				</div>

				<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
					>Ce que contient l'archive</span
				>

				<!-- prettier-ignore -->
				<div class="contenu-archive" id="contenu-archive"
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"/></svg></span
						><div
							><div class="ca__nom">Un fichier par note</div
							><div class="ca__txt">Au format Markdown, lisible dans n'importe quel éditeur de texte. Le nom du fichier reprend le titre de la note.</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"/></svg></span
						><div
							><div class="ca__nom">L'arborescence de dossiers, reproduite</div
							><div class="ca__txt">Les {apercu.dossiers} dossiers du domaine deviennent des dossiers de l'archive, à la même place.</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.4"/><path d="M2 6h12M5.5 9h5"/></svg></span
						><div
							><div class="ca__nom">Les métadonnées, en en-tête de chaque fichier</div
							><div class="ca__txt">Type, étiquettes, auteur, date de dernière vérification, visibilité et propriétés de {motFicheMinuscule}, dans un bloc <code>---</code> en tête de fichier. C'est ce bloc qui rend l'archive réimportable.</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.4"/><circle cx="5.5" cy="6.5" r="1.2"/><path d="M2.5 11.5l3.5-3 3 2.5 2.5-2 2.5 2"/></svg></span
						><div
							><div class="ca__nom">Les images et pièces jointes</div
							><div class="ca__txt">{#if apercu.pieces}Les {apercu.pieces} fichiers joints sont inclus dans un dossier voisin, et les notes y renvoient par chemin relatif.{:else}Ce domaine n'a aucune pièce jointe : l'archive ne contiendra que du texte.{/if}</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM5.5 9h5M5.5 11.5h3"/></svg></span
						><div
							><div class="ca__nom">Un rapport de conversion</div
							><div class="ca__txt">Liste ce qui n'a pas pu être rendu fidèlement en Markdown, avec la raison. À lire avant d'archiver.</div
						></div
					></div
					><div class="arbo-archive"><b>{archive.nom}</b>{archive.corps}</div
				></div>

				<div id="resultat"></div>
			</div>

			<!-- prettier-ignore -->
			<aside class="recap-export"
				><div class="recap-export__tete"
					><span class="etiq">Volume estimé</span
					><div class="recap-export__volume" id="volume">{volume(apercu.octets)}</div
				></div
				><div class="recap-export__corps"
					><div id="recap"
						>{#each recapitulatif as [nom, valeur] (nom)}<div class="re" data-nul={valeur ? 'non' : 'oui'}><span>{nom}</span><span class="re__n">{valeur}</span></div>{/each}</div
					><button
						class="btn btn--principal"
						id="exporter"
						type="button"
						onclick={() => onExporter?.(domaineCourant)}
						><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2v8.5M4.8 7.3L8 10.7l3.2-3.4M2.5 13.5h11"/></svg>
						Préparer l'archive</button
					><div class="etat-export" id="etat" hidden
						><div class="barre-progres"><i id="barre"></i></div
						><div class="etat-export__txt" id="etat-txt">—</div
					></div
				></div
			></aside>
		</div>
	{/snippet}
</CoquilleDeConsole>
