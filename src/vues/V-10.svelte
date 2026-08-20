<script lang="ts">
	/**
	 * V-10 — Page d'un univers. Route `/univers/{univers}` (`docs/routes.md` §3.3).
	 *
	 * C'est le premier des deux segments de LA FORME CANONIQUE au sens de
	 * `RG-M03-02` ; V-11 en pose le second. La forme raccourcie `/domaines/…`
	 * n'existe pas (ARB-001) et n'est émise nulle part. Le gabarit d'adresse est
	 * `$lib/rangement/adresses` — il porte la forme, le motif et la raison, et
	 * c'est lui que P-10 prolongera.
	 *
	 * LES LIENS RESTENT CEUX DU GEL — `href="#"`, comme `src/lib/coquille/*` les
	 * porte depuis T-101. ARB-013 devait permettre l'adresse réelle en retirant
	 * les lignes `/url:` de l'instantané ARIA ; MESURÉ ici, le filtre de
	 * le module de capture du banc ne retire rien — son motif `/^\s*\/url:/` ne
	 * reconnaît pas la forme `- /url: …` que Playwright imprime —, et six des
	 * sept états sortaient en échec de structure sur cette seule ligne.
	 * `ECART-013` É-5 annonçait que l'écart mordrait « au premier lot câblant une
	 * adresse » : c'est ce lot. L'instrument est en écriture humaine seule
	 * (ARB-013, `PLAN §12`) ; le constat est déclaré au rapport, et le câblage
	 * attend sa correction. Aucun lien mort n'est pour autant inventé : ce sont
	 * exactement ceux du gel.
	 *
	 * SEPT ÉTATS — `verif/scenarios/V-10.json`, extraits de la planche de revue
	 * de la maquette gelée. Chacun arrive par son VECTEUR COMPLET : droits ×
	 * univers × état. Trois axes, jamais un delta.
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1. Vérifié sur le gel, pas supposé :
	 * `header.barre` rend deux boutons nus, le rail n'a ni pictogramme ni
	 * `data-vers`, `Gestion` porte `si-ecriture`, il n'y a pas de
	 * `#rail-univers`, et l'arborescence est celle des quinze nœuds ÉCRITE AU
	 * BALISAGE, que le gabarit porte (`arborescence-abregee.ts`). La classe de
	 * `<main>` est `univers` (ARB-015), le chemin courant du rail est VIDE — une
	 * page d'univers ne met en évidence aucun domaine.
	 *
	 * `data-etat` est l'attribut de données de la vue (ARB-021, A-2) ; il est
	 * passé au gabarit par `donnees`, tel quel et sous son nom complet.
	 *
	 * `.noeud` N'EST PAS PORTÉE ICI. C'est le nœud d'arborescence du rail, rendu
	 * par la coquille ; en V-19 et V-20 la même classe est un nœud de GRAPHE, aux
	 * règles inconciliables (`docs/DESIGN.md` §2.H). Aucune factorisation.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : notes, domaines, contributeurs et
	 * répartition de fraîcheur sont calculés depuis `seeds/corpus.ts`, comme la
	 * maquette les calcule depuis `window.CORPUS`.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : l'état est rendu, jamais
	 * la transition. Les gestes de la maquette — notifications au clic sur une
	 * part de fraîcheur, sur une carte de domaine, sur un événement — relèvent
	 * des lots de logique.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette` — la
	 * divergence de balisage mesurée NULLE de `docs/releve-vues.md` §4.1
	 * (instantané ARIA identique, capture identique à l'octet) ; le montage de la
	 * palette est assigné au lot qui portera V-09. Et `div.planche`, bloc hors
	 * produit (§2.G), qui ne se porte jamais.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-10.css`, posé par
	 * `node verif/feuilles-de-vue.mjs V-10 --installer` et identique à l'octet au
	 * second bloc `<style>` du gel (P-6.3). Les styles en ligne reproduits sont
	 * ceux du gel, et eux seuls (P-6.4, ARB-016).
	 */
	import {
		ACTIVITE,
		DETAIL_DOMAINES,
		DOMAINES,
		INSTANCE,
		MODULES,
		MOI,
		UNIVERS,
		type CleDeModule,
		type EvenementDActivite,
		type Note,
		type Univers
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';

	interface Proprietes {
		/** Le vecteur complet de l'état — droits × univers × état. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-10')`, variante « lecture ». */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const droits = $derived(reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture');
	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE l'action d'écriture puis la cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-10-page-univers.html:338`) : faute de serveur, une maquette statique n'a
	 * pas d'autre moyen de dire « cette action n'existe pas pour ce rôle ». Le
	 * produit peut ne pas l'émettre, et P-09 l'exige — « ni grisée, NI MASQUÉE ».
	 * La classe reste posée sur le nœud rendu.
	 *
	 * AUCUN ÉTAT DÉCLARÉ N'EXERCE CETTE OMISSION, et c'est dit : le nœud vit dans
	 * l'état vide, qu'aucun vecteur du scénario ne croise avec `droits=lecture`.
	 * Le différentiel de la batterie 7 ne le voit donc pas (P-5). Il est traité
	 * comme les autres pour que la vue n'ait qu'une seule règle.
	 * Énumération : `docs/omissions-p09.md`.
	 */
	const ecriture = $derived(droits !== 'lecture');
	const etatDeLaPage = $derived(
		reglage['etat'] === 'vide' ? 'vide' : reglage['etat'] === 'chargement' ? 'chargement' : 'peuple'
	);

	/**
	 * L'univers rendu. La maquette le cherche par son nom dans `window.UNIVERS`
	 * (`V-10:1814`) ; le corpus en porte un troisième — « Non classé », univers
	 * système — que la planche ne présente pas et que le gel ignore donc.
	 */
	const courant = $derived(
		(UNIVERS.find((u) => u.nom === reglage['uni']) ?? UNIVERS[0]) as Univers
	);

	/** L'état « sans domaine » vide l'univers de ses deux dérivés à la fois. */
	const notesDeLUnivers = $derived(
		etatDeLaPage === 'vide' ? [] : corpus.filter((n) => n.univers === courant.nom)
	);
	const domaines = $derived(
		etatDeLaPage === 'vide' ? [] : DOMAINES.filter((d) => d.univers === courant.nom)
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

	/* ── Répartition de fraîcheur ───────────────────────────────────────────
	   Le même composant que partout ailleurs (P-01) : la répartition compte les
	   niveaux que le corpus porte, elle ne les recalcule pas. Les trois parts
	   sont dans l'ordre du gel — jamais l'ordre alphabétique. */
	interface Part {
		readonly cle: 'frais' | 'vieil' | 'obs';
		readonly classe: string;
		readonly pluriel: string;
		readonly singulier: string;
	}

	const PARTS: readonly Part[] = [
		{ cle: 'frais', classe: 'p-frais', pluriel: 'fraîches', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', pluriel: 'vieillissantes', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', pluriel: 'obsolètes', singulier: 'obsolète' }
	];

	function compte(notes: readonly Note[], cle: Part['cle']): number {
		return notes.filter((n) => n.fraicheur === cle).length;
	}

	function partsPresentes(notes: readonly Note[]): readonly Part[] {
		return PARTS.filter((p) => compte(notes, p.cle) > 0);
	}

	function accord(p: Part, n: number): string {
		return n > 1 ? p.pluriel : p.singulier;
	}

	function resumeRepartition(notes: readonly Note[]): string {
		return (
			partsPresentes(notes)
				.map((p) => `${compte(notes, p.cle)} ${accord(p, compte(notes, p.cle))}`)
				.join(', ') + ` sur ${notes.length}`
		);
	}

	function libellePart(p: Part, notes: readonly Note[], contexte: string): string {
		const n = compte(notes, p.cle);
		return `${n} ${accord(p, n)}${contexte ? ` · ${contexte}` : ''}`;
	}

	/* ── Les deux glyphes d'univers ─────────────────────────────────────────
	   `GLYPHES` de la maquette (`V-10:1783`). Le corpus en nomme un troisième,
	   « corbeille », pour l'univers système que cette vue ne présente pas. */

	/** Nombre en français — `x.toLocaleString("fr-FR")` du gel. */
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
	 * L'activité de l'univers. Elle est indépendante de l'état « sans domaine » :
	 * la maquette la filtre sur `window.ACTIVITE` et le corpus entier, jamais sur
	 * l'ensemble vidé (`V-10:1974`). L'événement sans cible — l'import — est
	 * rattaché à Production.
	 */
	const evenements = $derived(
		ACTIVITE.filter((e) => {
			if (!e.cible) return courant.nom === 'Production';
			const n = noteParId(e.cible);
			return n !== undefined && n.univers === courant.nom;
		})
	);

	const nombreDeDomaines = $derived(
		domaines.length ? `${domaines.length} ${domaines.length > 1 ? 'domaines' : 'domaine'}` : ''
	);
</script>

<!--
	La barre de répartition de fraîcheur, et sa légende chiffrée. Deux emplois
	dans cette vue : l'indicateur consolidé de l'univers et chaque carte de
	domaine. Un ensemble vide n'affiche pas zéro — il le dit (P-02).
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
					{accord(p, compte(notes, p.cle))}</span
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
				<div class="mesure">
					<span class="mesure__nom etiq">Notes</span>
					<div class="mesure__val">{nb(notesDeLUnivers.length)}</div>
					<span class="mesure__sous">{brouillons} brouillon(s)</span>
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
									title="{c.nom} — {c.notes} note{c.notes > 1 ? 's' : ''}">{c.initiales}</span
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
						{@const detail = DETAIL_DOMAINES[d.nom]}
						{@const notesDom = corpus.filter((n) => n.domaine === d.nom)}
						<article class="carte-dom" style="--teinte:{d.couleur}">
							<div class="carte-dom__tete">
								<a class="carte-dom__nom" href="#">{d.nom}</a>
								<span class="carte-dom__n"
									>{notesDom.length} {notesDom.length > 1 ? 'notes' : 'note'}</span
								>
							</div>
							<p class="carte-dom__desc">{detail.description}</p>
							<div>{@render repartition(notesDom, d.nom)}</div>
							<div class="carte-dom__modules">
								{#each detail.modules as m (m)}<span
										class="past"
										title={MODULES[m as CleDeModule].sous}>{MODULES[m as CleDeModule].nom}</span
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
									{#if n}<a href="#">{n.titre}</a><span class="flux__ou"
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
