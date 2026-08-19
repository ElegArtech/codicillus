<script lang="ts">
	/**
	 * V-17 — Éditeur d'une note (registre Référence).
	 * Routes `/notes/nouvelle` et `/notes/{identifiant}/modifier`
	 * (`docs/routes.md`, `verif/scenarios/V-17.json`).
	 *
	 * SIX ÉTATS, UNE FENÊTRE — 6 couples. Les clés sont celles de
	 * `verif/scenarios/V-17.json`, réextraites de la planche gelée.
	 *
	 * QUATRE DES SIX ÉTATS RENDENT LE MÊME ÉCRAN, ET C'EST MESURÉ. Le DOM
	 * stabilisé de `cas-vierge`, `sv-normal`, `sv-erreur` et `doublon` est
	 * IDENTIQUE À L'OCTET — relevé dans les conditions du banc, planche retirée.
	 * Les deux leviers qui les distinguent n'ont aucun effet sur l'état de
	 * départ :
	 *
	 *   • `sv` n'est lu qu'à l'INTÉRIEUR de `enregistrer()` (`V-17:2700`), donc
	 *     jamais tant que rien n'est enregistré ; son écouteur de planche ne fait
	 *     que retirer un avis d'erreur qui n'existe pas (`V-17:3584-3586`) ;
	 *   • `c-doublon` déclenche `verifierDoublon()` (`V-17:3583`), qui sort
	 *     immédiatement quand le titre est vide (`V-17:2763-2765`) — et il l'est, la
	 *     création étant vierge.
	 *
	 * Ils ne sont donc pas lus ici. Ce n'est pas un oubli : les lire pour rendre
	 * quelque chose serait inventer un écran que la maquette ne montre pas.
	 * `verif/scenarios/V-17.json` marque déjà `sv-normal` `identiqueA`
	 * `cas-vierge` ; les deux autres ne le sont pas parce que leur VECTEUR dévie,
	 * non parce que leur RENDU diverge.
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1 : barre sans les deux menus
	 * déroulants, rail écrit au balisage. `<main class="editeur" id="contenu">`
	 * (ARB-015) ; le lien d'évitement vise `#redaction` avec le libellé « Aller à
	 * la rédaction » (ARB-019).
	 *
	 * LA BARRE D'ÉTAT PASSE PAR `apresContenu` — `ECART-027` É-2, cinquième
	 * passage du gabarit. V-17 et V-18 sont les deux SEULES maquettes du dépôt à
	 * porter un nœud après `<main>` : `div.barre-etat`, classe seule, boîte
	 * `248, 837, 1192, 63` aux douze états des deux vues et aux quatre fenêtres du
	 * banc, collante (`position: sticky; bottom: 0`, `V-17:1099`). Son absence
	 * n'est pas sans incidence : elle occupe une place réelle.
	 *
	 * TROIS ATTRIBUTS DE DONNÉES HORS GABARIT — `data-vue`, `data-meta` et
	 * `data-numerote`, portés par `donnees` (ARB-021, A-2). Le premier commande
	 * `.si-redaction` / `.si-apercu` (`V-17.css:711-712`), le deuxième le
	 * dépliage des métadonnées sous 980 px (`V-17.css:745`).
	 *
	 * LE TROISIÈME NE PRODUIT RIEN, ET LE GEL LE VEUT AINSI. Le gel pose
	 * `data-numerote` sur `div.app#app` (`V-17:1347`) tandis que la règle qui
	 * l'exploite vise `body` (`V-17:836`) : le sélecteur ne peut pas
	 * s'appliquer. C'est le constat §7.7 de `docs/releve-vues.md`, et il vaut
	 * pour cinq maquettes. Le poser sur `<body>` — ce que seule V-03 fait, par
	 * `attributs_de_corps` — CHANGERAIT le rendu : c'est un comblement, et il
	 * serait rouge au banc. L'attribut est porté là où le gel le pose, et nulle
	 * part ailleurs. Même famille que P-3.
	 *
	 * L'ÉTAT `cas-template` OUVRE UN DIALOGUE MODAL, et c'est le BANC qui établit
	 * la modalité, des deux côtés (ARB-017, `verif/references/protocole-app.json`
	 * → `revelations` → V-17). L'obligation de la vue est écrite là-bas et se
	 * borne à ceci : rendre `#dlg-template` avec l'attribut `open`, et rien
	 * d'autre. `open` n'est pas `showModal()` ; la couche supérieure ne s'atteint
	 * pas déclarativement, et l'hydratation est du temps 3 (ARB-011).
	 *
	 * LA FOCALISATION DE `cas-template` NE PRODUIT AUCUN PIXEL, et c'est mesuré.
	 * Le gel focalise `button#tpl-vierge.btn--principal` à l'ouverture
	 * (`docs/releve-vues.md` §6.1). Un bouton focalisé en modalité POINTEUR ne
	 * déclenche pas `:focus-visible` — seules les cibles `.saisie` et
	 * `.selecteur` en produisent (§6.2) — et la révélation retire de toute façon
	 * le focus qu'elle vient de poser. Aucune déclaration `focalisations` n'est
	 * donc demandée pour V-17.
	 *
	 * LA HAUTEUR DU CHAMP DE TITRE EST UNE MESURE DU GEL, PAS UN CHOIX. Le script
	 * écrit `titre.style.height = titre.scrollHeight + "px"` (`V-17:3473` et `:3574`), ce
	 * qui donne 49 px aux six états — une ligne, titre vide comme titre rempli.
	 * Sans cet attribut, un `textarea[rows="1"]` mesure 50,8 px : deux pixels de
	 * divergence, et le seuil est zéro (ARB-018). `height` n'est pas une
	 * propriété contrainte par P-1 ; la valeur est relevée au navigateur, dans
	 * les conditions du banc, jamais estimée.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011). Ni conversion Markdown à la
	 * frappe, ni menu de commandes, ni auto-complétion de lien interne, ni
	 * sauvegarde automatique, ni prévisualisation, ni enregistrement. Le
	 * squelette rend l'état de départ du gel. **CE LOT NE DÉCLARE TENUE AUCUNE
	 * EXIGENCE D'ÉDITION**, ni `P-09` : les actions d'écriture disparaissent en
	 * lecture seule par `si-ecriture`, ce qui est le rendu d'un état et non une
	 * preuve d'étanchéité (`pnpm test:droits`).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `div.commandes#commandes`, `div.liens-auto`,
	 * `dialog#dlg-quitter` fermé, et `dialog#dlg-template` fermé dans les cinq
	 * états qui ne l'ouvrent pas. `docs/releve-vues.md` §4.1 les mesure un par
	 * un : un `<dialog>` fermé et un bloc masqué ne portent aucune boîte de
	 * rendu, ne déplacent aucun pixel et n'entrent pas dans l'instantané ARIA.
	 * Et `div.planche`, bloc hors produit (`docs/DESIGN.md` §2.G), qui ne se
	 * porte jamais.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-17.css`, posé par `node verif/feuilles-de-vue.mjs V-17
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BandeauApercu from '$lib/edition/BandeauApercu.svelte';
	import BarreDEtat from '$lib/edition/BarreDEtat.svelte';
	import ZoneDeRedaction from '$lib/edition/ZoneDeRedaction.svelte';
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		TEMPLATES,
		TYPES_FICHE,
		TYPES_NOTE,
		UNIVERS,
		modificationsPourVue,
		noteParIdentifiant,
		type Note
	} from '../../seeds/corpus';
	import { motFiche, motFicheMinuscule } from '$lib/vocabulaire';

	interface Proprietes {
		/** Le vecteur complet de l'état — trois contrôles de planche. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-17')`, variante « lecture ». */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	/** Le seul levier que la planche exerce sur le rendu — `charger()`, `V-17:3537`. */
	const cas = $derived<'vierge' | 'template' | 'modif'>(
		reglage['cas'] === 'modif' ? 'modif' : reglage['cas'] === 'template' ? 'template' : 'vierge'
	);

	/**
	 * LA NOTE REPRISE EN MODIFICATION — `n-planifier-sauv`, nommée par le gel
	 * (`V-17:3549`). Elle vient du corpus, jamais d'une transcription.
	 */
	const NOTE_MODIFIEE = noteParIdentifiant('n-planifier-sauv');

	/** L'ancienneté de la dernière version, en jours — `window.modifJours`, `V-17:2240`, table `MODIFICATIONS` `V-17:2235`. */
	const JOURS_DEPUIS_MODIF = modificationsPourVue('V-17')['n-planifier-sauv'];

	const titre = $derived(cas === 'modif' ? (NOTE_MODIFIEE?.titre ?? '') : '');
	const typeChoisi = $derived(cas === 'modif' ? (NOTE_MODIFIEE?.type ?? 'Procédure') : 'Procédure');
	const domaineChoisi = $derived(cas === 'modif' ? (NOTE_MODIFIEE?.domaine ?? '') : MOI.domaine);
	const dossierChoisi = $derived(cas === 'modif' ? (NOTE_MODIFIEE?.dossier ?? null) : null);
	const etiquettes = $derived(cas === 'modif' ? (NOTE_MODIFIEE?.etiquettes ?? []) : []);

	/**
	 * L'ARBORESCENCE DU CHOIX DE DOSSIER — `window.dossiersDuDomaine`,
	 * `V-17:2247`. Elle se déduit du rangement des notes, et elle N'EST PAS celle
	 * du rail : le gel la construit dans l'ORDRE DE RENCONTRE des notes du corpus
	 * et compte, pour chaque dossier, les notes de son chemin terminal. La
	 * dérivation du rail (`$lib/coquille/arborescence.ts`) trie par ordre
	 * alphabétique français et ne compte rien — la reprendre ici rendrait
	 * « Applications, Exploitation, Supervision » là où le gel rend
	 * « Exploitation, Applications, Supervision ». Deux dérivations, deux objets :
	 * ce n'est pas un doublon, et le vérifier était la question à trancher.
	 */
	interface DossierDeChoix {
		readonly nom: string;
		readonly notes: number;
		readonly enfants: readonly DossierDeChoix[];
	}

	/** Le même nœud, le temps de la construction — le décompte s'y incrémente. */
	interface DossierEnConstruction {
		readonly nom: string;
		notes: number;
		readonly enfants: DossierEnConstruction[];
	}

	function dossiersDuDomaine(domaine: string): readonly DossierDeChoix[] {
		const racines: DossierEnConstruction[] = [];
		for (const note of corpus) {
			if (note.domaine !== domaine || !note.dossier) continue;
			let niveau = racines;
			let terminal: DossierEnConstruction | null = null;
			for (const segment of note.dossier.split('›').map((s) => s.trim())) {
				if (!segment) continue;
				let branche = niveau.find((n) => n.nom === segment);
				if (!branche) {
					branche = { nom: segment, notes: 0, enfants: [] };
					niveau.push(branche);
				}
				terminal = branche;
				niveau = branche.enfants;
			}
			if (terminal) terminal.notes += 1;
		}
		return racines;
	}

	const dossiers = $derived(dossiersDuDomaine(domaineChoisi));

	/** L'état du témoin de sauvegarde, et son libellé — `charger()`, `V-17:3537`. */
	const etatSauvegarde = $derived(cas === 'modif' ? 'enregistre' : 'vierge');
	const texteSauvegarde = $derived(
		cas === 'modif'
			? `Enregistré · dernière version il y a ${JOURS_DEPUIS_MODIF} jours`
			: 'Aucune modification'
	);

	/** Le fil d'Ariane et le chemin courant du rail — `coquille({…})`, `V-17:3568`. */
	const fil = $derived(
		cas === 'modif'
			? ['Accueil', 'Production', domaineChoisi, 'Modifier']
			: ['Accueil', 'Production', MOI.domaine, 'Nouvelle note']
	);
</script>

<!--
	L'ARBORESCENCE DU CHOIX DE DOSSIER, rendue par un snippet récursif : le gel
	l'écrit par une fonction récursive (`parcourir`, `V-17:2810`), et la
	profondeur du rangement va jusqu'à dix niveaux.

	Le chemin porte le séparateur ` › ` du corpus, parce que c'est LUI qui décide
	quel bouton radio est coché : `r.checked = dossierChoisi === chemin`
	(`V-17:2819`).
-->
{#snippet niveauDeDossiers(noeuds: readonly DossierDeChoix[], prefixe: string)}
	<ul>
		{#each noeuds as noeud (noeud.nom)}
			{@const chemin = prefixe ? `${prefixe} › ${noeud.nom}` : noeud.nom}
			<li>
				<label class="dc"
					><input type="radio" name="dossier" checked={dossierChoisi === chemin} /><span
						>{noeud.nom}</span
					><span class="dc__n">{noeud.notes || ''}</span></label
				>
				{#if noeud.enfants.length}{@render niveauDeDossiers(noeud.enfants, chemin)}{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<!--
	Le contenu du bouton principal de la barre d'état. Il vit ICI, et non dans
	`$lib/edition/`, parce qu'il porte un style en ligne — `margin-left:4px`, une
	propriété contrainte par P-1.2 — et qu'un style en ligne n'est prouvé que par
	la maquette rattachée au fichier (ARB-016, P-6.4). Même jurisprudence que le
	séparateur `›` de V-14.
-->
{#snippet boutonEnregistrer()}<span id="enregistrer-txt"
		>{cas === 'modif' ? 'Enregistrer les modifications' : 'Enregistrer'}</span
	>
	<kbd class="touche" style="margin-left:4px">Ctrl</kbd><kbd class="touche">S</kbd>{/snippet}

<!--
	LE CORPS REPRIS EN MODIFICATION — `charger("modif")`, `V-17:3550`. Le premier
	paragraphe est l'extrait de la note, lu au corpus ; le reste est le balisage
	que le gel écrit.
-->
{#snippet corpsRepris()}
	<p>{NOTE_MODIFIEE?.extrait ?? ''}</p>
	<h2 id="s-decl">Déclarer le serveur</h2>
	<ol>
		<li>Ajouter la section dans la configuration de Barman.</li>
		<li>Recharger la configuration.</li>
	</ol>
	<h2 id="s-verif">Vérifier le premier passage</h2>
	<ul class="taches">
		<li><input type="checkbox" checked /><span>La sauvegarde apparaît dans la liste.</span></li>
		<li><input type="checkbox" /><span>La taille est cohérente avec la base.</span></li>
	</ul>
{/snippet}

{#snippet dialogueTemplate()}
	<!-- ============================ Sélecteur de template ============================
			Rendu OUVERT par l'attribut `open`, et rien d'autre : c'est le banc qui
			établit la modalité, des deux côtés (ARB-017). -->
	<dialog class="dlg dlg--large" id="dlg-template" aria-labelledby="dlg-tpl-titre" open>
		<div class="dlg__boite">
			<div class="dlg__tete">
				<span class="dlg__marque" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						><rect x="2" y="2.5" width="12" height="11" rx="1.4" /><path d="M2 6h12M6 6v7.5" /></svg
					>
				</span>
				<h2 class="dlg__titre" id="dlg-tpl-titre">Par quoi commencer&nbsp;?</h2>
			</div>
			<div class="dlg__corps">
				<!-- La page vierge est proposée en premier et avec le même poids visuel
						que les templates : le template est subsidiaire, jamais imposé. -->
				<button
					class="btn btn--principal"
					id="tpl-vierge"
					style="width:100%;padding:12px;justify-content:flex-start;gap:var(--e-3)"
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><path
							d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"
						/></svg
					>
					Partir d'une page vierge
				</button>
				<div class="etiq">Ou reprendre une structure éprouvée</div>
				<div id="templates" style="display:flex;flex-direction:column;gap:var(--e-2)">
					{#each TEMPLATES as gabarit (gabarit.id)}<button
							class="module"
							type="button"
							style="width:100%"
							><span class="module__ic" style="font-family:var(--f-donnee);font-size:var(--t-micro)"
								>{gabarit.type.slice(0, 3).toUpperCase()}</span
							><span class="module__corps"
								><span class="module__nom">{gabarit.nom}</span><span class="module__sous"
									>{gabarit.description}</span
								><span
									class="module__sous"
									style="margin-top:var(--e-1);font-family:var(--f-donnee)"
									>{gabarit.structure.join(' › ')}</span
								></span
							></button
						>{/each}
				</div>
			</div>
		</div>
	</dialog>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="editeur"
	cibleEvitement="redaction"
	libelleEvitement="Aller à la rédaction"
	donnees={{ 'data-vue': 'redaction', 'data-meta': 'ferme', 'data-numerote': 'non' }}
	{fil}
	courant={[cas === 'modif' ? domaineChoisi : MOI.domaine]}
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
	{...cas === 'template' ? { superposition: dialogueTemplate } : {}}
>
	{#snippet enfants()}
		<div class="colonne-redaction">
			<!-- ---------- Avertissements ----------
				Vide aux six états : les deux avis de V-17 — échec d'enregistrement et
				doublon détecté — ne se posent qu'après un geste (`V-17:2755` et `:2763`). -->
			<div id="avis"></div>

			<BandeauApercu
				texte="Prévisualisation — le rendu tel qu'il s'affichera en lecture. Rien n'est perdu."
			/>

			<!-- ---------- Titre ---------- -->
			<div class="champ" id="champ-titre">
				<label class="hors-ecran" for="titre">Titre de la note</label>
				<!-- prettier-ignore — un blanc entre la balise et la valeur entrerait dans
					la valeur du champ, donc dans son nom accessible au niveau 1 (P-6). -->
				<textarea
					class="champ-titre"
					id="titre"
					rows="1"
					placeholder="Titre de la note"
					spellcheck="false"
					style="height:49px">{titre}</textarea
				>
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
					Une note sans titre est introuvable. Donnez-lui-en un, même approximatif.
				</div>
			</div>

			<!-- ---------- Barre d'outils ---------- -->
			<div class="outils-red si-redaction" role="toolbar" aria-label="Mise en forme">
				<div class="oz">
					<button
						class="ob"
						type="button"
						data-cmd="undo"
						title="Annuler · Ctrl+Z"
						aria-label="Annuler"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M3 7h7a3.5 3.5 0 0 1 0 7H7" /><path d="M5.5 4.5L3 7l2.5 2.5" /></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-cmd="redo"
						title="Rétablir · Ctrl+Y"
						aria-label="Rétablir"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M13 7H6a3.5 3.5 0 0 0 0 7h3" /><path d="M10.5 4.5L13 7l-2.5 2.5" /></svg
						>
					</button>
				</div>

				<div class="oz">
					<button class="ob ob--txt" type="button" data-bloc="h2" title="Titre de niveau 2"
						>H2</button
					>
					<button class="ob ob--txt" type="button" data-bloc="h3" title="Titre de niveau 3"
						>H3</button
					>
					<button class="ob ob--txt" type="button" data-bloc="h4" title="Titre de niveau 4"
						>H4</button
					>
				</div>

				<div class="oz">
					<button class="ob" type="button" data-cmd="bold" title="Gras · Ctrl+B" aria-label="Gras"
						><b style="font-family:var(--f-ui);font-size:14px">G</b></button
					>
					<button
						class="ob"
						type="button"
						data-cmd="italic"
						title="Italique · Ctrl+I"
						aria-label="Italique"
						><i style="font-family:var(--f-lecture);font-size:14px">I</i></button
					>
					<button
						class="ob"
						type="button"
						data-cmd="underline"
						title="Souligné · Ctrl+U"
						aria-label="Souligné"><u style="font-family:var(--f-ui);font-size:14px">S</u></button
					>
					<button class="ob" type="button" data-cmd="strikeThrough" title="Barré" aria-label="Barré"
						><s style="font-family:var(--f-ui);font-size:14px">B</s></button
					>
					<button
						class="ob"
						type="button"
						data-mark="surligne"
						title="Surligné"
						aria-label="Surligné"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M2.5 13.5h11" /><path d="M4.5 11l6-6 2 2-6 6H4.5V11z" /></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-mark="code"
						title="Code en ligne"
						aria-label="Code en ligne"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M5.5 4L2 8l3.5 4M10.5 4L14 8l-3.5 4" /></svg
						>
					</button>
				</div>

				<div class="oz">
					<button
						class="ob"
						type="button"
						data-cmd="insertUnorderedList"
						title="Liste à puces"
						aria-label="Liste à puces"
					>
						<svg
							width="16"
							height="16"
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
					>
						<svg
							width="16"
							height="16"
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
					>
						<svg
							width="16"
							height="16"
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
							/><path d="M7.5 4.5H14M7.5 11.5H14M2.5 4.5l.8.8 1.4-1.6" /></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-bloc="citation"
						title="Citation"
						aria-label="Citation"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M3 3v10M6 5.5h8M6 8.5h8M6 11.5h5" /></svg
						>
					</button>
				</div>

				<div class="oz" data-secondaire="oui">
					<button
						class="ob"
						type="button"
						data-bloc="code"
						title="Bloc de code"
						aria-label="Bloc de code"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path
								d="M6 6.5L4 8l2 1.5M10 6.5L12 8l-2 1.5"
							/></svg
						>
					</button>
					<button class="ob" type="button" data-bloc="tableau" title="Tableau" aria-label="Tableau">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path
								d="M1.5 6h13M6 6v7.5M10.5 6v7.5"
							/></svg
						>
					</button>
					<button class="ob" type="button" data-bloc="image" title="Image" aria-label="Image">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><circle
								cx="5.5"
								cy="6"
								r="1.2"
							/><path d="M2 11.5l3.5-3 3 2.5 2.5-2 3 2.5" /></svg
						>
					</button>
					<button class="ob" type="button" data-bloc="lien" title="Lien" aria-label="Lien">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.9.9" /><path
								d="M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.9-.9"
							/></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-bloc="separateur"
						title="Séparateur"
						aria-label="Séparateur"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M2 8h12" /></svg
						>
					</button>
				</div>

				<div class="oz menu-etendu" id="menu-etendu" style="margin-left:auto">
					<button
						class="ob"
						type="button"
						id="ouvrir-etendu"
						aria-haspopup="true"
						aria-expanded="false"
						title="Plus"
						aria-label="Menu étendu"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
							><circle cx="3" cy="8" r="1.4" /><circle cx="8" cy="8" r="1.4" /><circle
								cx="13"
								cy="8"
								r="1.4"
							/></svg
						>
					</button>
					<div class="menu-etendu__liste" role="menu">
						<button type="button" data-bloc="alerte-astuce" role="menuitem"
							>Bloc d'alerte — astuce</button
						>
						<button type="button" data-bloc="alerte-attention" role="menuitem"
							>Bloc d'alerte — attention</button
						>
						<button type="button" data-bloc="alerte-danger" role="menuitem"
							>Bloc d'alerte — danger</button
						>
						<button type="button" data-bloc="diagramme" role="menuitem">Diagramme</button>
						<button type="button" data-bloc="lien-interne" role="menuitem"
							>Lien interne <span class="raccourci">[[</span></button
						>
						<button type="button" id="menu-commandes-aide" role="menuitem"
							>Menu de commandes <span class="raccourci">/</span></button
						>
					</div>
				</div>
			</div>

			<ZoneDeRedaction
				libelle="Corps de la note"
				invite="Écrivez ici. Tapez « / » sur une ligne vide pour insérer un bloc, « [[ » pour lier une autre note."
				{...cas === 'modif' ? { corps: corpsRepris } : {}}
			/>
		</div>

		<!-- ---------- Métadonnées ---------- -->
		<aside class="meta-panneau" aria-label="Métadonnées de la note">
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Rangement</span></div>
				<div class="panneau__corps meta-bloc">
					<div class="champ">
						<label class="champ__label" for="m-type"
							>Type de note <span class="oblig">*</span></label
						>
						<select class="selecteur" id="m-type">
							{#each TYPES_NOTE as type (type)}<option value={type} selected={type === typeChoisi}
									>{type}</option
								>{/each}
						</select>
					</div>

					<div class="champ">
						<label class="champ__label" for="m-domaine">Domaine <span class="oblig">*</span></label>
						<select class="selecteur" id="m-domaine">
							{#each DOMAINES as domaine (domaine.nom)}<option
									value={domaine.nom}
									selected={domaine.nom === domaineChoisi}
									>{domaine.univers + ' › ' + domaine.nom}</option
								>{/each}
						</select>
						<span class="champ__aide">Changer de domaine réinitialise le dossier.</span>
					</div>

					<div class="champ" id="champ-dossier">
						<span class="champ__label">Dossier <span class="oblig">*</span></span>
						<div class="dossier-choix" id="m-dossier">
							{@render niveauDeDossiers(dossiers, '')}
						</div>
						<div class="champ__erreur" id="erreur-dossier" hidden>
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
							Choisissez un dossier de rangement.
						</div>
					</div>

					<div class="champ" style="position:relative">
						<label class="champ__label" for="m-etiquette">Étiquettes</label>
						<div class="etq-boite" id="etq-boite">
							{#each etiquettes as etiquette (etiquette)}<span class="etq"
									>{etiquette}<button type="button" aria-label="Retirer l'étiquette {etiquette}"
										><svg
											width="11"
											height="11"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="2.2"><path d="M4 4l8 8M12 4l-8 8" /></svg
										></button
									></span
								>{/each}<input
								type="text"
								id="m-etiquette"
								placeholder="Ajouter…"
								autocomplete="off"
								spellcheck="false"
							/>
						</div>
						<div class="etq-suggestions" id="etq-suggestions"></div>
						<span class="champ__aide"
							>Entrée pour valider. Une étiquette qui n'existe pas est créée.</span
						>
					</div>
				</div>
			</section>

			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Publication</span></div>
				<div class="panneau__corps meta-bloc">
					<div class="champ">
						<span class="champ__label">Visibilité</span>
						<div class="duo" id="m-visibilite" role="group">
							<button type="button" data-val="Interne" aria-pressed="true">Interne</button>
							<button type="button" data-val="Publique" aria-pressed="false">Publique</button>
						</div>
						<span class="champ__aide" id="aide-visibilite"
							>Consultable par les comptes de la direction technique.</span
						>
					</div>
					<div class="champ">
						<span class="champ__label">Statut</span>
						<div class="duo" id="m-statut" role="group">
							<button type="button" data-val="Publiée" aria-pressed="true">Publiée</button>
							<button type="button" data-val="Brouillon" aria-pressed="false">Brouillon</button>
						</div>
					</div>
				</div>
			</section>

			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">{motFiche} structurée</span></div>
				<div class="panneau__corps meta-bloc">
					<div class="champ">
						<label class="champ__label" for="m-fiche">Type de {motFicheMinuscule}</label>
						<select class="selecteur" id="m-fiche">
							<option value="" selected>Aucun — note simple</option>
							{#each Object.keys(TYPES_FICHE) as type (type)}<option value={type}>{type}</option
								>{/each}
						</select>
						<span class="champ__aide"
							>Optionnel. Un type ajoute des propriétés structurées et rend la note exploitable en
							cartographie.</span
						>
					</div>
					<div class="proprietes" id="proprietes"></div>
				</div>
			</section>

			<!-- Les liens suggérés ne se calculent qu'à la frappe (`suggererLiens`,
				`V-17:3384`) : le bloc reste masqué aux six états, comme au gel. -->
			<section class="panneau" id="bloc-suggestions" hidden>
				<div class="panneau__tete">
					<span class="etiq">Liens suggérés</span>
					<span class="chiffre" id="n-suggestions"></span>
				</div>
				<div class="panneau__corps" id="suggestions"></div>
			</section>
		</aside>
	{/snippet}

	{#snippet apresContenu()}
		<BarreDEtat
			etat={etatSauvegarde}
			texte={texteSauvegarde}
			libelleMeta="Métadonnées"
			enregistrer={boutonEnregistrer}
		/>
	{/snippet}
</Coquille>
