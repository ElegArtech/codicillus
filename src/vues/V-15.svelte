<script lang="ts">
	/**
	 * V-15 — L'HISTORIQUE D'UNE NOTE. Route `/notes/{identifiant}/historique`.
	 *
	 * C'EST UNE PAGE, ET PLUS UN TIROIR. L'historique était un état de l'adresse de
	 * lecture : `?version` nu faisait glisser un panneau par-dessus la note. On ne
	 * pouvait ni le mettre en signet, ni l'envoyer, ni y revenir ; le fil d'Ariane
	 * nommait la note, jamais l'historique. La référence en fait une page — fil qui
	 * se ferme sur « historique », « ← Retour à la note » en tête, titre en Literata,
	 * onglets de registre — et c'est ce que cette vue rend.
	 *
	 * UN FIL VERTICAL, DU PLUS RÉCENT AU PLUS ANCIEN. Chaque événement porte son
	 * jalon — le glyphe de son état de vivacité, ou un carré neutre quand il n'en
	 * change aucun —, sa date, le registre qu'il touche, son titre et son détail.
	 *
	 * ELLE NE CALCULE RIEN. Les événements arrivent construits par le chargeur ; les
	 * bascules automatiques sont dérivées par `basculesDUneNote()` ; le glyphe et la
	 * couleur d'état viennent de la fabrique unique (`P-01`, `ADR-005`). La vue ne
	 * lit d'elle-même qu'un champ de `ETATS_DE_VIVACITE` : le degré d'attention, qui
	 * décide si le titre se colore.
	 *
	 * TROIS ÉTATS VIVENT DANS L'ADRESSE — le filtre de registre, le panneau de
	 * comparaison, la confirmation de restauration. Aucun n'est un `hidden` que rien
	 * ne bascule : ce sont des liens, ils marchent sans script et survivent au
	 * rechargement.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (`P-1`, `ADR-002`) : elles vivent dans
	 * `src/socle.css` et `src/vues/V-15.css`.
	 */
	import type { Domaine, Note, Univers } from '../../seeds/corpus';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import GlypheDeVivacite from '$lib/GlypheDeVivacite.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import { ETATS_DE_VIVACITE, type EtatDeVivacite } from '$lib/fraicheur';

	/** Un onglet du filtre de registre — trois, et le chargeur dit lequel est actif. */
	interface OngletDeRegistre {
		readonly libelle: string;
		readonly actif: boolean;
		readonly adresse: string;
	}

	/** Les deux colonnes du panneau de comparaison d'une version. */
	interface ComparaisonAffichee {
		readonly avant: readonly string[];
		readonly apres: readonly string[];
		readonly identique: boolean;
		readonly registre: string;
		readonly resteAvant: string;
		readonly resteApres: string;
	}

	/** Un événement du fil, tel que le chargeur l'a construit. */
	interface EvenementAffiche {
		readonly cle: string;
		readonly date: string;
		readonly registre: string;
		readonly etat: EtatDeVivacite | null;
		readonly titre: string;
		readonly detail: string;
		readonly version: string | null;
		readonly adresseComparaison: string;
		readonly libelleComparaison: string;
		readonly comparaison: ComparaisonAffichee | null;
		readonly adresseRestauration: string;
		readonly restaurationDepliee: boolean;
		readonly numero: string;
	}

	/** L'état vide d'un onglet — il NOMME le geste qui le remplit. */
	interface EtatVide {
		readonly titre: string;
		readonly texte: string;
		readonly adresse: string;
		readonly libelle: string;
	}

	interface Proprietes {
		/**
		 * LA NOTE DONT L'HISTORIQUE EST OUVERT — REQUISE. Elle décide du titre, du fil
		 * d'Ariane et du rangement mis en évidence dans le rail. Son défaut était une
		 * note du jeu de démonstration, servie sous le fil d'une autre.
		 */
		note: Note;
		/** Le corpus lisible — la coquille en dérive son rail. Vide : rien à montrer. */
		notes?: readonly Note[];
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. `null` : personne n'est connecté. */
		compte?: CompteAffiche | null;
		/** L'adresse de la note — « ← Retour à la note », et le fil d'Ariane. */
		adresseDeLaNote: string;
		/** « il y a 4 jours par Alexandre Berge ». Vide : rien à annoncer. */
		derniereModification?: string;
		/** Les trois onglets Tous / Référence / Opérationnel. REQUIS : le filtre est réel. */
		onglets: readonly OngletDeRegistre[];
		/** Le fil, du plus récent au plus ancien. Vide : `vide` dit pourquoi. */
		evenements: readonly EvenementAffiche[];
		/** L'état vide, ou `null` quand le fil porte au moins un événement. */
		vide: EtatVide | null;
		/** `P-09` — le geste de restauration n'est rendu que pour qui peut écrire. */
		ecriture?: boolean;
	}

	const {
		note,
		notes = [],
		univers = [],
		domaines = [],
		compte = null,
		adresseDeLaNote,
		derniereModification = '',
		onglets,
		evenements,
		vide,
		ecriture = false
	}: Proprietes = $props();

	/**
	 * LE RANGEMENT DE LA NOTE, tel que le fil le déroule. Une note posée à la racine
	 * d'un domaine n'a aucun segment de dossier.
	 */
	const segments = $derived(
		note.dossier
			.split('›')
			.map((s) => s.trim())
			.filter((s) => s !== '')
	);

	/**
	 * LE FIL D'ARIANE SE FERME SUR « historique », et le titre de la note qui le
	 * précède est un LIEN vers elle : la coquille le compose dès que le rangement
	 * concorde. C'est le second chemin de retour, à côté du bouton d'en-tête.
	 */
	const fil = $derived([
		'Accueil',
		note.univers,
		note.domaine,
		...segments,
		note.titre,
		'historique'
	]);
	const courant = $derived([note.domaine, ...segments]);

	/**
	 * LE TITRE SE COLORE DÈS QUE L'ÉTAT ATTEINT « À vérifier » — le degré
	 * d'attention de la fabrique, jamais un seuil réécrit ici.
	 */
	function attention(etat: EtatDeVivacite | null): 0 | 1 | 2 | 3 {
		return etat === null ? 0 : ETATS_DE_VIVACITE[etat].attention;
	}

	/** La classe de teinte de l'état, ou rien : le jalon neutre reste gris. */
	function classeDEtat(etat: EtatDeVivacite | null): string {
		return etat === null ? '' : ETATS_DE_VIVACITE[etat].classe;
	}
</script>

<!--
	L'EN-TÊTE DE DROITE APPARTIENT À LA VUE. La coquille la reçoit en `Snippet` :
	elle n'a aucun moyen de deviner qu'on est sur l'historique et qu'il faut y
	poser « ← Retour à la note ».
-->
{#snippet actions()}
	{#if derniereModification !== ''}
		<div class="hist__modif">
			<svg
				width="18"
				height="18"
				viewBox="0 0 20 20"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"><path d="M1 10h4l2-5 3 10 2-6 1.5 3H19" /></svg
			>
			<span class="hist__modif-texte">
				<span class="hist__modif-titre">Dernière modification</span>
				<span>{derniereModification}</span>
			</span>
		</div>
	{/if}
	<!-- L'ADRESSE VIENT DU CHARGEUR, composée par `adresseDeNote()` : la règle
		inspecte l'EXPRESSION du `href` et ne peut pas la suivre jusque là. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a class="btn hist__retour" href={adresseDeLaNote}>← Retour à la note</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

<Coquille
	classeContenu="hist"
	{fil}
	{courant}
	{univers}
	{domaines}
	{notes}
	compte={compte ?? COMPTE_VIDE}
	version=""
	actionsDEntete={actions}
>
	{#snippet enfants()}
		<header class="hist__tete">
			<p class="etiq">Historique</p>
			<h1 class="hist__titre">{note.titre}</h1>
			<p class="hist__chapo">
				Versions du contenu, vérifications et changements d'état de vivacité, du plus récent au plus
				ancien. Chaque registre a son propre cycle.
			</p>
		</header>

		<!-- eslint-disable svelte/no-navigation-without-resolve -- toutes les adresses
			de ce bloc sont composées par le chargeur, sur `adresseDeNote()`. -->
		<nav class="hist__onglets" aria-label="Filtrer par registre">
			{#each onglets as onglet (onglet.libelle)}
				<a
					class="hist__onglet"
					href={onglet.adresse}
					aria-current={onglet.actif ? 'page' : undefined}>{onglet.libelle}</a
				>
			{/each}
		</nav>

		{#if vide}
			<!--
				AUCUNE DONNÉE : LA PAGE LE DIT, ET NOMME LE GESTE QUI LA REMPLIT. Une
				liste vide sans phrase laisse croire à une panne.
			-->
			<div class="hist__vide">
				<h2 class="hist__vide-titre">{vide.titre}</h2>
				<p class="hist__vide-texte">{vide.texte}</p>
				{#if vide.adresse !== ''}<a class="btn btn--principal" href={vide.adresse}>{vide.libelle}</a
					>{/if}
			</div>
		{:else}
			<ol class="hist__fil">
				{#each evenements as ev (ev.cle)}
					<li class="hist__evenement">
						<span class="hist__jalon {classeDEtat(ev.etat)}">
							{#if ev.etat === null}
								<!--
									LE JALON NEUTRE — un carré gris. Il n'est pas un état de vivacité :
									une version ne change aucun cycle, elle capture un contenu. Le
									glyphe de vivacité ne saurait pas le dire.
								-->
								<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
									<circle
										cx="8"
										cy="8"
										r="6.5"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
									/>
									<path d="M5 5h6v6H5z" fill="currentColor" />
								</svg>
							{:else}
								<GlypheDeVivacite etat={ev.etat} />
							{/if}
						</span>

						<div class="hist__quand">
							<span class="hist__date">{ev.date}</span>
							<span class="etiq hist__registre">{ev.registre}</span>
						</div>

						<div class="hist__corps">
							<span
								class="hist__intitule {classeDEtat(ev.etat)}"
								data-attention={attention(ev.etat)}>{ev.titre}</span
							>
							<span class="hist__detail">{ev.detail}</span>

							{#if ev.version !== null}
								<div class="hist__version">
									<span class="hist__pastille">{ev.version}</span>
									<a class="hist__lien" href={ev.adresseComparaison}>{ev.libelleComparaison}</a>
									{#if ev.adresseRestauration !== ''}<a
											class="hist__lien"
											href={ev.adresseRestauration}
											>{ev.restaurationDepliee ? 'Annuler' : 'Restaurer cette version'}</a
										>{/if}
								</div>
							{/if}

							{#if ev.comparaison}
								<!--
									LE PANNEAU DE COMPARAISON — deux colonnes, ce qui part à gauche sur
									voile rouge, ce qui arrive à droite sur voile vert. Son état vit dans
									l'adresse : le lien ci-dessus l'ouvre et le referme.
								-->
								<div class="diff">
									<div class="diff__col diff__col--avant">
										<p class="diff__titre">{'− AVANT · ' + ev.comparaison.registre}</p>
										{#if ev.comparaison.identique}
											<p class="diff__rien">
												Le registre {ev.comparaison.registre} n'a pas changé.
											</p>
										{:else if ev.comparaison.avant.length === 0}
											<p class="diff__rien">Rien n'a été retiré.</p>
										{:else}
											{#each ev.comparaison.avant as ligne, rang (rang)}<span class="diff__ligne"
													>{ligne}</span
												>{/each}
											{#if ev.comparaison.resteAvant !== ''}<span class="diff__reste"
													>{ev.comparaison.resteAvant}</span
												>{/if}
										{/if}
									</div>
									<div class="diff__col diff__col--apres">
										<p class="diff__titre">{'+ APRÈS · ' + ev.comparaison.registre}</p>
										{#if ev.comparaison.identique}
											<p class="diff__rien">Le contenu est identique à la version précédente.</p>
										{:else if ev.comparaison.apres.length === 0}
											<p class="diff__rien">Rien n'a été ajouté.</p>
										{:else}
											{#each ev.comparaison.apres as ligne, rang (rang)}<span class="diff__ligne"
													>{ligne}</span
												>{/each}
											{#if ev.comparaison.resteApres !== ''}<span class="diff__reste"
													>{ev.comparaison.resteApres}</span
												>{/if}
										{/if}
									</div>
								</div>
							{/if}

							{#if ev.restaurationDepliee && ecriture}
								<!--
									RESTAURER — geste irréversible, donc confirmation qui rappelle ce qui
									sera écrasé (`RG-M18-05`). La confirmation est un ÉTAT DE L'ADRESSE,
									pas une boîte de dialogue du navigateur : elle marche sans script.
								-->
								<form class="hist__restaurer" method="POST" action="{adresseDeLaNote}?/restaurer">
									<input type="hidden" name="version" value={ev.numero} />
									<p class="hist__restaurer-texte">
										Restaurer la version {ev.version} remplacera le contenu actuel de la Référence. La
										version courante sera conservée dans ce fil.
									</p>
									<button class="btn btn--principal" type="submit">Restaurer cette version</button>
								</form>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/snippet}
</Coquille>
