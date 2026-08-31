<script lang="ts">
	/**
	 * V-10 — Page d'un univers. Route `/univers/{univers}` (`docs/routes.md` §3.3).
	 *
	 * C'est le premier des deux segments de LA FORME CANONIQUE au sens de
	 * `RG-M03-02` ; V-11 en pose le second. La forme raccourcie `/domaines/…`
	 * n'existe pas (`ARB-001`) et n'est émise nulle part. Le gabarit d'adresse est
	 * `$lib/rangement/adresses`.
	 *
	 * Coquille de forme abrégée : la classe de `<main>` est `univers`, et le chemin
	 * courant du rail est VIDE — une page d'univers ne met en évidence aucun
	 * domaine. `data-etat` est passé au gabarit par `donnees`.
	 *
	 * `.noeud` n'est pas portée ici : c'est le nœud d'arborescence du rail, rendu
	 * par la coquille ; en V-19 et V-20 la même classe est un nœud de GRAPHE, aux
	 * règles inconciliables (`docs/DESIGN.md` §2.H). Aucune factorisation.
	 *
	 * Aucun chiffre n'est saisi : notes, domaines, contributeurs et répartition de
	 * fraîcheur sont calculés depuis les propriétés servies.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-10.css` ; les styles en ligne
	 * reproduits sont ceux du gel.
	 */
	import type {
		CleDeModule,
		DetailDeDomaine,
		Domaine,
		EvenementDActivite,
		Module,
		NomDeDomaine,
		Note,
		Univers
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import { designationsDeCoquille, type CompteAffiche } from '$lib/coquille/identite';
	import { libelleDeModule } from '$lib/rangement/modules';
	import { accord } from '$lib/vocabulaire';
	import { adresseDeNote, adressesParLesNoms } from '$lib/rangement/adresses';

	/**
	 * LES ADRESSES SE COMPOSENT SUR L'IDENTIFIANT PERSISTÉ, PAS SUR LE NOM. La vue
	 * ne reçoit que des noms d'affichage et les slugifiait ; `univers.identifiant`
	 * et `domaines.identifiant` sont persistés et ne suivent PAS les renommages
	 * (`RG-M12-11`), si bien que renommer un univers ou un domaine en console
	 * rendait 404 chacun des liens d'ici.
	 */
	const adresses = adressesParLesNoms(designationsDeCoquille());

	/**
	 * LES SOURCES DE L'ÉCRAN SONT REQUISES — le motif est retiré, pas contourné.
	 * Optionnelles, de défaut la constante de `seeds/corpus.ts`, une route qui en
	 * oubliait une servait le jeu de démonstration SANS QUE RIEN NE PROTESTE : ni le
	 * compilateur, ni un test, ni l'écran, qui affichait un contenu plausible.
	 *
	 * `detailDomaines` ET `modules` RENDENT `P-04` EFFECTIVE, et leurs deux sources
	 * sont distinctes : les CLÉS actives d'un domaine viennent de
	 * `modules_de_domaine` (`RG-STR-06`), les LIBELLÉS du catalogue de produit
	 * `$lib/rangement/modules.ts`.
	 *
	 * `compte` PEUT LÉGITIMEMENT MANQUER — une page rendue hors gabarit racine n'a
	 * pas d'identité —, et son état vide est `null`.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		/** L'utilisateur connecté. `null` : aucun compte connu. */
		compte?: CompteAffiche | null;
		activite: readonly EvenementDActivite[];
		detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
		/** Le catalogue des modules — nom et sous-titre de chaque clé. */
		modules: Record<CleDeModule, Module>;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines: tousLesDomaines,
		compte: compteConnecte = null,
		activite,
		detailDomaines,
		modules
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const droits = $derived(reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture');
	/**
	 * L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040`. Le gel pose
	 * l'action d'écriture puis la cache en feuille, seule possibilité d'une maquette
	 * statique ; le produit ne l'émet pas, « ni grisée, NI MASQUÉE ». La classe reste
	 * posée sur le nœud rendu.
	 */
	const ecriture = $derived(droits !== 'lecture');
	const etatDeLaPage = $derived(
		reglage['etat'] === 'vide' ? 'vide' : reglage['etat'] === 'chargement' ? 'chargement' : 'peuple'
	);

	/**
	 * AUCUN UNIVERS — l'état vide, écrit plutôt que subi. La liste servie ne peut
	 * pas être vide sur cette route : le chargeur y AJOUTE celui que l'adresse
	 * nomme, même quand aucun de ses domaines n'est lisible. Le repli est là pour
	 * que la propriété soit honnête sur toute sa forme — un tableau vide rendait
	 * `univers[0].nom` et sortait en 500.
	 */
	const AUCUN_UNIVERS: Univers = { nom: '', couleur: '', glyphe: '', description: '' };

	/** L'univers rendu. La maquette le cherche par son nom dans `window.UNIVERS`
	    (`V-10:1814`) ; le produit le cherche dans la liste que le chargeur sert. */
	const courant = $derived(
		univers.find((u) => u.nom === reglage['uni']) ?? univers[0] ?? AUCUN_UNIVERS
	);

	const notesDeLUnivers = $derived(
		etatDeLaPage === 'vide' ? [] : corpus.filter((n) => n.univers === courant.nom)
	);
	const domaines = $derived(
		etatDeLaPage === 'vide' ? [] : tousLesDomaines.filter((d) => d.univers === courant.nom)
	);
	const brouillons = $derived(notesDeLUnivers.filter((n) => n.brouillon).length);

	interface Contributeur {
		readonly nom: string;
		readonly initiales: string;
		readonly notes: number;
	}

	/** Contributeurs d'un ensemble de notes, classés par volume (`V-10:1610`). */
	function contributeurs(notes: readonly Note[]): readonly Contributeur[] {
		const par: Record<string, number> = {};
		for (const n of notes) par[n.auteur] = (par[n.auteur] ?? 0) + 1;
		return Object.entries(par)
			.map(([nom, compte]) => ({
				nom,
				initiales: nom
					.split(' ')
					.map((m) => m[0])
					.join('')
					.slice(0, 2)
					.toUpperCase(),
				notes: compte
			}))
			.sort((a, b) => b.notes - a.notes || a.nom.localeCompare(b.nom, 'fr'));
	}

	const contribs = $derived(contributeurs(notesDeLUnivers));

	/* Répartition de fraîcheur — le même composant que partout ailleurs
	   (`ADR-005`) : elle compte les niveaux que le corpus porte, elle ne les
	   recalcule pas. Les trois parts sont dans l'ordre du gel. */
	interface Part {
		readonly cle: 'frais' | 'vieil' | 'obs';
		readonly classe: string;
		/* Le pluriel n'est plus porté : les trois formes sont en `+s`, et `accord()`
		   est la seule source de cette règle. */
		readonly singulier: string;
	}

	const PARTS: readonly Part[] = [
		{ cle: 'frais', classe: 'p-frais', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', singulier: 'obsolète' }
	];

	function compte(notes: readonly Note[], cle: Part['cle']): number {
		return notes.filter((n) => n.fraicheur === cle).length;
	}

	function partsPresentes(notes: readonly Note[]): readonly Part[] {
		return PARTS.filter((p) => compte(notes, p.cle) > 0);
	}

	function resumeRepartition(notes: readonly Note[]): string {
		return (
			partsPresentes(notes)
				.map((p) => `${compte(notes, p.cle)} ${accord(compte(notes, p.cle), p.singulier)}`)
				.join(', ') + ` sur ${notes.length}`
		);
	}

	function libellePart(p: Part, notes: readonly Note[], contexte: string): string {
		const n = compte(notes, p.cle);
		return `${n} ${accord(n, p.singulier)}${contexte ? ` · ${contexte}` : ''}`;
	}

	/* Les deux glyphes d'univers — `GLYPHES` de la maquette (`V-10:1783`). Le corpus
	   en nomme un troisième, « corbeille », pour l'univers système. */

	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/** Ancienneté en clair, en heures (`V-10:1795`). */
	function relatif(h: number): string {
		if (h < 1) return "à l'instant";
		if (h < 24) return `il y a ${h} h`;
		const j = Math.round(h / 24);
		return j === 1 ? 'hier' : `il y a ${j} jours`;
	}

	const GESTES: Record<EvenementDActivite['type'], string> = {
		verification: 'a vérifié',
		edition: 'a modifié',
		publication: 'a publié',
		revision: 'a signalé à réviser',
		import: 'a terminé un import'
	};

	function noteParId(id: string): Note | undefined {
		return corpus.find((n) => n.id === id);
	}

	/**
	 * L'activité de l'univers. Elle est indépendante de l'état « sans domaine » : la
	 * maquette la filtre sur le corpus entier (`V-10:1974`).
	 *
	 * UN ÉVÉNEMENT SANS CIBLE EST RATTACHÉ PAR LE CHARGEUR, JAMAIS ICI. Il l'était à
	 * « Production » — un nom d'univers du jeu de démonstration écrit en dur dans une
	 * règle —, puis il a été écarté purement et simplement. Ni l'un ni l'autre : un
	 * LOT D'IMPORT (`RG-M12-09`) ne vise aucune note et vise un DOMAINE, ce que la vue
	 * ne peut pas savoir et ce que le chargeur sait — il ne sert que les lots des
	 * domaines de cet univers. Le rattachement se fait donc là où la donnée est.
	 */
	const evenements = $derived(
		activite.filter((e) => {
			if (!e.cible) return true;
			const n = noteParId(e.cible);
			return n !== undefined && n.univers === courant.nom;
		})
	);

	const nombreDeDomaines = $derived(
		domaines.length ? `${domaines.length} ${accord(domaines.length, 'domaine')}` : ''
	);
</script>

<!-- `svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE : ses adresses sont COMPOSÉES par `$lib/rangement/adresses.ts`, la
	fabrique unique du rangement, que la règle ne sait pas suivre. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!--
	La barre de répartition de fraîcheur, et sa légende chiffrée. Deux emplois dans
	cette vue : l'indicateur consolidé de l'univers et chaque carte de domaine. Un
	ensemble vide n'affiche pas zéro — il le dit.
-->
{#snippet repartition(notes: readonly Note[], contexte: string)}
	{#if notes.length === 0}<div class="zone-etat__txt" style="margin:0">Aucune note à mesurer.</div>
	{:else}<div class="repart" role="img" aria-label={resumeRepartition(notes)}>
			{#each partsPresentes(notes) as p (p.cle)}<button
					type="button"
					class={p.classe}
					style="flex:{compte(notes, p.cle)}"
					title={libellePart(p, notes, contexte)}
					aria-label={libellePart(p, notes, contexte)}
				></button>{/each}
		</div>
		<div class="legende">
			{#each partsPresentes(notes) as p (p.cle)}<span
					><i class={p.classe}></i><b>{compte(notes, p.cle)}</b>
					{accord(compte(notes, p.cle), p.singulier)}</span
				>{/each}
		</div>{/if}
{/snippet}

<!-- L'esquisse de chargement — hauteur et rayon posés par la fabrique du gel. -->
{#snippet esquisse(hauteur: string)}
	<div class="esquisse" style="height:{hauteur};border-radius:var(--r-3)"></div>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="univers"
	fil={['Accueil', courant.nom]}
	courant={[]}
	{droits}
	donnees={{ 'data-etat': etatDeLaPage }}
	{univers}
	domaines={tousLesDomaines}
	notes={corpus}
	compte={compteConnecte ?? COMPTE_VIDE}
	version=""
>
	{#snippet enfants()}
		<header class="couverture" id="couverture" style="--teinte:{courant.couleur}">
			<div class="couverture__sceau" id="sceau" aria-hidden="true">
				{#if courant.glyphe === 'pile'}<svg
						width="26"
						height="26"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						><rect x="3" y="4" width="18" height="5" rx="1.5" /><rect
							x="3"
							y="12"
							width="18"
							height="5"
							rx="1.5"
						/><path d="M6.5 6.5h.01M6.5 14.5h.01M3 19.5h18" /></svg
					>{:else}<svg
						width="26"
						height="26"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"><path d="M6 21V3M6 4h11l-2.2 3.5L17 11H6" /></svg
					>{/if}
			</div>
			<div class="couverture__corps">
				<div class="couverture__sur etiq">Univers</div>
				<h1 id="titre">{courant.nom}</h1>
				<p id="description">{courant.description}</p>
			</div>
			<div class="couverture__actions">
				<button class="btn" id="carto">
					<svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><circle cx="4" cy="4" r="2" /><circle cx="12" cy="6" r="2" /><circle
							cx="7"
							cy="12"
							r="2"
						/><path d="M5.8 4.6l4.4 1M5.4 5.7l1.2 4.4" /></svg
					>
					Cartographie de l'univers
				</button>
			</div>
		</header>

		<section class="consolide" id="consolide" aria-label="Indicateurs consolidés">
			{#if etatDeLaPage === 'chargement'}
				{#each [0, 1, 2, 3] as rang (rang)}{@render esquisse('116px')}{/each}
			{:else}
				<!-- LES DEUX NOMBRES DE CETTE MESURE MÈNENT À LA RECHERCHE, réduite à cet
				     univers : le total sans autre filtre, le sous-compte sur
				     `?statut=Brouillon`. Deux boutons FRÈRES, jamais imbriqués — un bouton
				     dans un bouton n'est pas un document. -->
				<div class="mesure">
					<button class="mesure__lien" type="button" id="m-notes">
						<span class="mesure__nom etiq">Notes</span>
						<div class="mesure__val">{nb(notesDeLUnivers.length)}</div>
					</button>
					<!-- LA PARENTHÈSE TOMBE, ÉCART DE MAQUETTE ASSUMÉ : `mockups/V-10:1864`
					     fige « brouillon(s) », exactement le repli qu'`accord()` existe pour
					     supprimer. -->
					<button class="mesure__lien" type="button" id="m-brouillons">
						<span class="mesure__sous">{`${brouillons} ${accord(brouillons, 'brouillon')}`}</span>
					</button>
				</div>
				<div class="mesure">
					<span class="mesure__nom etiq">Domaines</span>
					<div class="mesure__val">{nb(domaines.length)}</div>
					<span class="mesure__sous"
						>{domaines.length
							? domaines.map((d) => d.nom).join(' · ')
							: 'Aucun domaine rattaché'}</span
					>
				</div>
				<div class="mesure">
					<span class="mesure__nom etiq">Contributeurs actifs</span>
					<div class="mesure__val">{nb(contribs.length)}</div>
					{#if contribs.length}<div class="avatars">
							{#each contribs.slice(0, 5) as c (c.nom)}<span
									class="avatar-pile"
									title="{c.nom} — {c.notes} {accord(c.notes, 'note')}">{c.initiales}</span
								>{/each}
						</div>{/if}
				</div>
				<div class="mesure mesure--large">
					<span class="mesure__nom etiq">Fraîcheur consolidée</span>
					{@render repartition(notesDeLUnivers, courant.nom)}
				</div>
			{/if}
		</section>

		<div class="section-titre">
			<h2>Domaines rattachés</h2>
			<span class="etiq" id="n-domaines"
				>{etatDeLaPage === 'chargement' ? '' : nombreDeDomaines}</span
			>
		</div>
		<section id="domaines">
			{#if etatDeLaPage === 'chargement'}{@render esquisse('176px')}{:else if !domaines.length}
				<div class="vide-univers">
					<h2>Cet univers ne contient aucun domaine</h2>
					<p>
						Un univers est un regroupement : il n'a de contenu que par les domaines qui lui sont
						rattachés. Créez-en un pour commencer à y ranger des notes.
					</p>
					<!-- P-09 · ARB-040 — omise, jamais masquée. `V-10:1908` -->
					{#if ecriture}<button class="btn btn--principal si-ecriture"
							>Créer un domaine dans {courant.nom}</button
						>{/if}
				</div>
			{:else}
				<div class="grille-domaines">
					{#each domaines as d (d.nom)}
						{@const detail = detailDomaines[d.nom] ?? { description: '', modules: [] }}
						{@const notesDom = corpus.filter((n) => n.domaine === d.nom)}
						<article class="carte-dom" style="--teinte:{d.couleur}">
							<div class="carte-dom__tete">
								<a class="carte-dom__nom" href={adresses.domaine(d.univers, d.nom)}>{d.nom}</a>
								<span class="carte-dom__n">{notesDom.length} {accord(notesDom.length, 'note')}</span
								>
							</div>
							<p class="carte-dom__desc">{detail.description}</p>
							<div>{@render repartition(notesDom, d.nom)}</div>
							<div class="carte-dom__modules">
								{#each detail.modules as m (m)}{@const libelle = libelleDeModule(modules, m)}<span
										class="past"
										title={libelle.sous}>{libelle.nom}</span
									>{/each}
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>

		<div class="section-titre">
			<h2>Activité de l'univers</h2>
			<span class="etiq">Tous domaines confondus</span>
		</div>
		<section class="panneau">
			<div class="panneau__corps" id="activite">
				{#if etatDeLaPage === 'chargement'}{@render esquisse('140px')}{:else if !evenements.length}
					<div class="zone-etat">
						<div class="zone-etat__titre">Rien de neuf cette semaine</div>
						<div class="zone-etat__txt">
							Aucune modification, vérification ou publication dans les domaines de cet univers.
						</div>
					</div>
				{:else}
					<ul class="flux">
						{#each evenements as e, rang (rang)}
							{@const n = e.cible ? noteParId(e.cible) : undefined}
							<li data-type={e.type}>
								<div class="flux__txt">
									<span style="font-weight:var(--g-fort)">{e.qui}</span>
									{GESTES[e.type]}
									{#if n}<a href={adresseDeNote(n.id)}>{n.titre}</a><span class="flux__ou"
											>{' dans ' + n.domaine}</span
										>{:else if e.detail}— {e.detail}{/if}<span class="flux__quand"
										>{relatif(e.heures)}</span
									>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>
	{/snippet}
</Coquille>
