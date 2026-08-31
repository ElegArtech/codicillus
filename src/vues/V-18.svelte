<script lang="ts">
	/**
	 * V-18 — Éditeur du registre Opérationnel. Route
	 * `/notes/{identifiant}/operationnel` (`docs/routes.md`).
	 *
	 * LE SECOND CORPS. Le corps rédigé est LE MÊME OBJET qu'en V-14, porté par
	 * `$lib/lecture/CorpsReference.svelte` et `CorpsOperationnel.svelte` : `diff`
	 * entre `V-14:1523-1753` et `V-18:1709-1939` ne rend aucune ligne, et la
	 * maquette le dit — « l'éditeur et la lecture montrent le même contenu, jamais
	 * deux versions du markup » (`V-18:2930`).
	 *
	 * LE CORPS OPÉRATIONNEL EST RENDU DEUX FOIS, et c'est le gel : une fois comme
	 * SOURCE masquée dans le panneau de référence (`V-18:2932`), une fois dans la
	 * zone de rédaction, où le script le recopie tel quel (`V-18:3281`). Les
	 * identifiants de titre y sont donc en double.
	 *
	 * DEUX LEVIERS ORTHOGONAUX : `cas` décide du contenu rédigé, de l'état de
	 * sauvegarde, du libellé du bouton principal, de l'avis affiché et des deux
	 * actions de registre (`V-18:3261`) ; `ref` décide de la place du panneau de
	 * Référence (`V-18:3160`) — `ouvert`, `cote` ou `ferme`.
	 *
	 * Coquille de forme abrégée ; lien d'évitement vers `#redaction`, libellé
	 * « Aller à la rédaction ».
	 *
	 * LA BARRE D'ÉTAT PASSE PAR `apresContenu` : avec V-17, V-18 est la seule
	 * maquette du dépôt à porter un nœud après `<main>` — `div.barre-etat`.
	 *
	 * CINQ ATTRIBUTS DE DONNÉES HORS GABARIT — `data-vue`, `data-meta`,
	 * `data-numerote`, `data-reference` et `data-cas`, portés par `donnees`.
	 * `data-reference` commande à lui seul les trois positions du panneau
	 * (`V-18.css:961-979`). `data-numerote` NE PRODUIT RIEN : le gel le pose sur
	 * `div.app#app` et la règle qui l'exploite vise `body` — le « corriger »
	 * changerait le rendu.
	 *
	 * UNE PARTICULARITÉ DU GEL, RELEVÉE ET NON CORRIGÉE : en position `cote`, la
	 * feuille écrit `.app[data-reference="cote"] .meta-panneau { display: none }`
	 * (`V-18.css:978`) alors que le panneau de Référence VIT DANS ce
	 * `.meta-panneau` — la colonne de droite disparaît donc entièrement, là où le
	 * nom de la position promet le contraire. Ne le « répare » pas.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-18.css`.
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BandeauApercu from '$lib/edition/BandeauApercu.svelte';
	import BarreDEtat from '$lib/edition/BarreDEtat.svelte';
	import ZoneDeRedaction from '$lib/edition/ZoneDeRedaction.svelte';
	import { rangementDe, type NoteAffichee } from '$lib/lecture/note-de-demonstration';
	import type { Domaine, Note, Univers } from '../../seeds/corpus';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { accord } from '$lib/vocabulaire';

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * LE CONTEXTE, ET SON DÉFAUT EST L'ENSEMBLE VIDE. Cette vue lisait `UNIVERS`,
		 * `DOMAINES` et `MOI` du jeu de démonstration, puis en a fait ses DÉFAUTS, ce
		 * qui n'était que le même défaut déplacé. La route ne les passe pas — le
		 * contexte de coquille les porte.
		 */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: CompteAffiche | null;
		/**
		 * LA NOTE ÉDITÉE ET SES DEUX CORPS RENDUS — REQUISE. L'écran montre trois
		 * choses de la note : son identité, le registre Référence en panneau de rappel
		 * et le registre Opérationnel dans la zone de rédaction. Absente, les trois
		 * venaient de la transcription gelée de la note de démonstration, POUR LA NOTE
		 * QU'ON ÉTAIT EN TRAIN D'ÉCRIRE, et rien ne le signalait.
		 */
		affichee: NoteAffichee;
		/**
		 * CE QUE LE BANDEAU DE DÉSYNCHRONISATION NOMME — `RG-M06-08`, REQUISE. Le gel
		 * écrit la date et l'auteur en dur (`V-18:3287`) ; le produit les LIT — la date
		 * de `corps_reference_modifie_le`, l'auteur de la version écrite.
		 *
		 * L'AUTEUR PEUT MANQUER, et son absence retire la mention plutôt que d'inventer
		 * un nom : c'est la jurisprudence du bandeau de V-14.
		 */
		desynchronisation: { quand: string; par: string | null };
		/**
		 * L'ANCIENNETÉ DU DERNIER ENREGISTREMENT, EN JOURS — `null` PAR DÉFAUT : la
		 * note n'a aucune version, et « Aucune modification » — l'autre phrase du gel —
		 * le dit exactement. Absente, la barre écrivait « il y a 3 semaines » sur toute
		 * note. Aucune route ne sert cette ancienneté.
		 */
		dernierEnregistrement?: number | null;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines = [],
		compte = null,
		affichee,
		desynchronisation,
		dernierEnregistrement = null
	}: Proprietes = $props();

	/** Le compte servi à la coquille. Hors gabarit racine, il n'y a PAS de compte
	    connecté ; en application, le contexte l'emporte. */
	const COMPTE_ABSENT: CompteAffiche = { nom: '', initiales: '', role: '', domaine: '' };

	const note = $derived(affichee.note);
	const rangement = $derived(rangementDe(note));

	const reglage = $derived(vecteur ?? {});

	/** L'état du registre édité — `charger()`, `V-18:3261`. */
	const cas = $derived<'existant' | 'vierge' | 'desync'>(
		reglage['cas'] === 'vierge' ? 'vierge' : reglage['cas'] === 'desync' ? 'desync' : 'existant'
	);

	/** La place du panneau de Référence — `reglerReference()`, `V-18:3160`. */
	const reference = $derived<'ouvert' | 'cote' | 'ferme'>(
		reglage['ref'] === 'cote' ? 'cote' : reglage['ref'] === 'ferme' ? 'ferme' : 'ouvert'
	);

	/**
	 * LA PHRASE DU BANDEAU DE DÉSYNCHRONISATION — celle du gel, mot pour mot. La
	 * mention de l'auteur tombe avec l'auteur, et ne se remplace pas : nommer « un
	 * contributeur » là où la base ne sait pas qui a écrit serait une valeur
	 * illustrative.
	 */
	const SUITE_DESYNC =
		", après votre dernière rédaction. Vérifiez que le pas-à-pas tient toujours — ou attestez qu'il tient, sans le rééditer.";
	const phraseDesync = $derived(
		`Modifiée le ${desynchronisation.quand}${
			desynchronisation.par === null ? '' : ` par ${desynchronisation.par}`
		}${SUITE_DESYNC}`
	);

	const etatSauvegarde = $derived(cas === 'vierge' ? 'vierge' : 'enregistre');
	/**
	 * LA BARRE D'ÉTAT NE PEUT PLUS DIRE « il y a 3 semaines » SUR N'IMPORTE QUELLE
	 * NOTE : la chaîne était figée dans la vue. Les deux phrases restent celles du
	 * gel, et `dernierEnregistrement` décide laquelle.
	 */
	const texteSauvegarde = $derived(
		cas === 'vierge' || dernierEnregistrement === null
			? 'Aucune modification'
			: `Enregistré · dernière version il y a ${dernierEnregistrement} ${accord(dernierEnregistrement, 'jour')}`
	);
</script>

<!--
	LE CORPS OPÉRATIONNEL DANS LA ZONE DE RÉDACTION — la seconde des deux copies
	que le gel rend (`V-18:3281`). Le même composant que la source masquée du
	panneau : un seul markup, deux places.

	Le bloc est protégé du formateur : un blanc inséré entre l'enveloppe et son
	contenu se relit dans le nom accessible, et la forme exacte de la directive ne
	se cite jamais dans un commentaire.

	L'INSERTION DE BALISAGE EST ADMISE PARCE QUE LE CONTENU EST MAÎTRISÉ : c'est la
	sortie de `rendreDocument`, dont l'en-tête énonce la contrepartie du refus
	d'`ADR-003` de stocker du HTML libre — « le texte d'un document est du TEXTE : il
	ne devient jamais du balisage ».
-->
<!-- eslint-disable svelte/no-at-html-tags -- sortie de `rendreDocument`, texte échappé par `echapper()` (ADR-003) -->
<!-- prettier-ignore -->
{#snippet corpsOperationnelRedige()}{@html affichee.operationnel ?? ''}{/snippet}
<!-- eslint-enable svelte/no-at-html-tags -->

<!--
	Le contenu du bouton principal de la barre d'état. Il vit ICI parce qu'il porte
	`margin-left:4px` : un style en ligne n'est prouvé que par la maquette rattachée
	au fichier (`ARB-016`), et `src/lib/edition/` n'a aucun rattachement. Même
	jurisprudence que le séparateur `›` de V-14.
-->
{#snippet boutonEnregistrer()}<span id="enregistrer-txt"
		>{cas === 'vierge' ? "Créer l'Opérationnel" : "Enregistrer l'Opérationnel"}</span
	>
	<kbd class="touche" style="margin-left:4px">Ctrl</kbd><kbd class="touche">S</kbd>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="editeur"
	cibleEvitement="redaction"
	libelleEvitement="Aller à la rédaction"
	donnees={{
		'data-vue': 'redaction',
		'data-meta': 'ferme',
		'data-numerote': 'non',
		'data-reference': reference,
		'data-cas': cas
	}}
	fil={['Accueil', ...rangement, note.titre, 'Opérationnel']}
	courant={rangement.slice(1)}
	{univers}
	{domaines}
	notes={corpus}
	compte={compte ?? COMPTE_ABSENT}
	version=""
>
	{#snippet enfants()}
		<div class="colonne-redaction">
			<!-- ---------- Registre édité : permanent, sans ambiguïté ---------- -->
			<div class="registre-actif">
				<div class="registre-actif__quoi">
					<span class="registre-actif__sceau" aria-hidden="true">OP</span>
					<div class="registre-actif__txt">
						<div class="registre-actif__label">Vous modifiez le registre</div>
						<div class="registre-actif__nom">Opérationnel</div>
						<div class="registre-actif__note" id="nom-note">{note.titre}</div>
					</div>
				</div>
				<button class="btn" id="vers-reference">
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"><path d="M14 8H3M6.5 4.5L3 8l3.5 3.5" /></svg
					>
					Modifier la Référence
				</button>
			</div>

			<!-- Avertissements — un avis par état, et deux états seulement en portent
				un : l'aide au démarrage de la première rédaction, et le signalement de
				désynchronisation. -->
			<div id="avis">
				{#if cas === 'vierge'}
					<div class="avis avis--info" data-avis="depart">
						<div class="avis__corps">
							<div class="avis__titre">Première rédaction de l'Opérationnel</div>
							<div>
								Vous réorganisez un fond qui existe déjà. La Référence est consultable à droite ; le
								menu étendu permet d'en reprendre le plan pour ne pas repartir d'une page blanche.
							</div>
							<div class="avis__actions">
								<button class="btn">Reprendre le plan de la Référence</button>
							</div>
						</div>
					</div>
				{:else if cas === 'desync'}
					<div class="avis avis--resync" data-avis="resync">
						<div class="avis__corps">
							<div class="avis__titre">
								La Référence a changé depuis la dernière mise à jour de l'Opérationnel
							</div>
							<div>{phraseDesync}</div>
							<div class="avis__actions">
								<button class="btn">Comparer les deux registres</button>
								<button class="btn">Marquer comme resynchronisé</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<BandeauApercu texte="Prévisualisation du registre Opérationnel. Rien n'est perdu." />

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
				</div>
				<div class="oz" data-secondaire="oui">
					<button
						class="ob"
						type="button"
						data-bloc="alerte-attention"
						title="Alerte — attention"
						aria-label="Alerte attention"
					>
						<svg
							width="16"
							height="16"
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
						<button type="button" data-bloc="alerte-danger" role="menuitem"
							>Bloc d'alerte — danger</button
						>
						<button type="button" data-bloc="tableau" role="menuitem">Tableau</button>
						<button type="button" data-bloc="citation" role="menuitem">Citation</button>
						<button type="button" id="reprendre-ref" role="menuitem"
							>Reprendre le plan de la Référence</button
						>
					</div>
				</div>
			</div>

			<ZoneDeRedaction
				libelle="Corps du registre Opérationnel"
				invite="Le pas-à-pas d'intervention. Gardez les gestes, laissez les explications à la Référence — elle est consultable à droite."
				{...cas === 'vierge' ? {} : { corps: corpsOperationnelRedige }}
			/>
		</div>

		<!-- ---------- Colonne droite ---------- -->
		<aside class="meta-panneau" aria-label="Référence et métadonnées">
			<!-- Aide au démarrage : la Référence, consultable sans quitter l'écran -->
			<section class="ref-panneau">
				<div class="ref-panneau__tete">
					<button
						class="btn btn--discret"
						id="bascule-ref"
						aria-expanded={reference !== 'ferme'}
						style="padding:2px 4px;gap:var(--e-2)"
					>
						<svg class="ref-chevron" width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
							><path d="M3 1l4 4-4 4z" /></svg
						>
						<span class="etiq">Registre Référence</span>
					</button>
					<button class="btn btn--discret" id="cote-a-cote" style="padding:4px 8px"
						>{reference === 'cote' ? 'En panneau' : 'Côte à côte'}</button
					>
				</div>
				<div class="ref-panneau__corps" id="ref-corps">
					<!-- ============ NOTE DE DÉMONSTRATION — corps rédigé, deux registres ============ -->
					<!-- ================= CORPS — REGISTRE RÉFÉRENCE ================= -->
					<!-- eslint-disable svelte/no-at-html-tags -- sortie de `rendreDocument`, texte échappé (ADR-003) -->
					<!-- prettier-ignore -->
					<div class="prose" id="corps-reference">{@html affichee.reference ?? ''}</div>

					<!-- ================ CORPS — REGISTRE OPÉRATIONNEL ================ -->
					<!-- prettier-ignore -->
					<div class="prose" id="corps-operationnel" hidden>{@html affichee.operationnel ?? ''}</div>
					<!-- eslint-enable svelte/no-at-html-tags -->
				</div>
			</section>

			<!-- Métadonnées : affichées pour le contexte, non modifiables ici -->
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Métadonnées de la note</span></div>
				<div class="panneau__corps meta-figee" id="meta-figee">
					<div class="mf">
						<span class="mf__cle">Titre</span><span class="mf__val">{note.titre}</span>
					</div>
					<div class="mf">
						<span class="mf__cle">Type</span><span class="mf__val"
							><span class="past past--type">{note.type}</span></span
						>
					</div>
					<div class="mf">
						<span class="mf__cle">Rangement</span><span class="mf__val"
							>{rangement.join(' › ')}</span
						>
					</div>
					<div class="mf">
						<span class="mf__cle">Étiquettes</span><span class="mf__val"
							><span
								>{#each note.etiquettes as etiquette (etiquette)}<span class="past past--etiquette"
										>{etiquette}</span
									>{/each}</span
							></span
						>
					</div>
					<div class="mf">
						<span class="mf__cle">Visibilité</span><span class="mf__val">{note.visibilite}</span>
					</div>
					<div class="mf">
						<span class="mf__cle">Statut</span><span class="mf__val"
							>{note.brouillon ? 'Brouillon' : 'Publiée'}</span
						>
					</div>
					<div class="meta-figee__note">
						Ces informations appartiennent à la note et valent pour ses deux registres. Elles se
						modifient depuis l'éditeur de la Référence.
					</div>
				</div>
			</section>

			<!-- Actions propres à l'Opérationnel -->
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Registre Opérationnel</span></div>
				<div class="panneau__corps panneau__corps--serre">
					<div style="display:flex;flex-direction:column;gap:var(--e-1)">
						<button class="btn btn--menu" id="a-resync" hidden={cas !== 'desync'}>
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" /><path d="M2 2.5v3.6h3.6" /></svg
							>
							Marquer comme resynchronisé
						</button>
						<button
							class="btn btn--menu btn--destructif"
							id="a-supprimer"
							hidden={cas === 'vierge'}
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><path
									d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
								/></svg
							>
							Supprimer la version opérationnelle
						</button>
					</div>
				</div>
			</section>
		</aside>
	{/snippet}

	{#snippet apresContenu()}
		<BarreDEtat
			etat={etatSauvegarde}
			texte={texteSauvegarde}
			libelleMeta="Référence"
			enregistrer={boutonEnregistrer}
		/>
	{/snippet}
</Coquille>
