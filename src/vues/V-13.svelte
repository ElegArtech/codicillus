<script lang="ts">
	/**
	 * V-13 — Page d'un dossier.
	 * Route `/univers/{univers}/{domaine}/dossiers/{chemin…}` (`docs/routes.md` §3.3).
	 *
	 * L'adresse prolonge la FORME CANONIQUE de V-11 : le segment `dossiers` vient
	 * de la convention de préfixe R1 et lève la collision avec les segments
	 * réservés `notes` et `signets` (§5.4) ; `{chemin…}` est la suite des
	 * identifiants de dossiers, jusqu'à dix niveaux (RG-STR-04). Le gabarit
	 * d'adresse est `$lib/rangement/adresses`.
	 *
	 * LES LIENS RESTENT CEUX DU GEL — `href="#"`. Voir l'en-tête de `V-10.svelte`
	 * pour le constat mesuré sur le filtre d'ARB-013.
	 *
	 * SIX ÉTATS — `verif/scenarios/V-13.json`. Deux axes : dossier × droit
	 * effectif. Les trois chemins de dossier sont EMBOÎTÉS, ce qui met cette vue
	 * à l'abri de l'accumulation de mise en évidence relevée sur V-11.
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1, vérifié sur le gel. `<main>` porte
	 * la classe `dossier-vue` (ARB-015) ; le chemin courant du rail est
	 * `[Infrastructure, …chemin]`, ce qui déplie la branche et met en évidence le
	 * dossier atteint.
	 *
	 * `.noeud` N'EST PAS PORTÉE ICI — nœud d'arborescence du rail, rendu par la
	 * coquille ; nœud de GRAPHE en V-19 et V-20 (`docs/DESIGN.md` §2.H). Aucune
	 * factorisation, et `.tuile`, `.groupe`, `.note-ligne`, `.droit` restent
	 * gouvernées par `src/vues/V-13.css`.
	 *
	 * LES TROIS DROITS EFFECTIFS SONT DES ÉTATS DE PLANCHE, PAS UNE FRONTIÈRE DE
	 * SÉCURITÉ. Gestionnaire, rédacteur et lecteur pilotent `data-droit` et
	 * `data-droits`, et la feuille de la vue fait disparaître les actions
	 * correspondantes — `si-gestionnaire`, `si-redacteur`, `si-ecriture`. **CE LOT
	 * NE DÉCLARE PAS `P-09` TENUE** : qu'une action interdite ne soit dans aucun
	 * DOM, par aucun chemin, relève de la batterie 7 (`pnpm test:droits`) et des
	 * lots T-011 et T-016. Ce qui est livré ici est le rendu de trois états, pas
	 * une preuve d'étanchéité.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : sous-dossiers, notes directes, notes
	 * totales et groupes par type sont déduits du rangement réel des notes de
	 * `seeds/corpus.ts` — aucune structure de dossiers séparée n'existe.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : les TROIS `dialog.dlg` FERMÉS de la maquette —
	 * `#dlg-creer`, `#dlg-deplacer`, `#dlg-supprimer` —, `template#tpl-palette` et
	 * `dialog#palette`. `docs/releve-vues.md` §4.1 les mesure : un `<dialog>`
	 * fermé ne porte AUCUNE boîte de rendu, ne déplace aucun pixel et n'entre pas
	 * dans l'instantané ARIA. Le gabarit n'ouvre sa `superposition` qu'aux neuf
	 * nœuds hors `div.app` qui rendent, et aucun n'est de V-13. Leur ouverture
	 * est du comportement, donc hors de ce lot. Et `div.planche`, bloc hors
	 * produit (§2.G), qui ne se porte jamais.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-13.css`, posé par `node verif/feuilles-de-vue.mjs V-13
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import { DOMAINES, INSTANCE, MODIFICATIONS, MOI, UNIVERS, type Note } from '../../seeds/corpus';
	import { classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { segmentsDeDossier } from '$lib/rangement/adresses';

	interface Proprietes {
		/** Le vecteur complet de l'état — dossier × droit effectif. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-13')`, variante « lecture ». */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	/**
	 * Le domaine et l'univers que la maquette fixe en tête de son script
	 * (`V-13:1957`) : la page de dossier est toujours celle d'Infrastructure.
	 */
	const DOMAINE = 'Infrastructure';
	const UNIVERS_DU_DOMAINE = DOMAINES.find((d) => d.nom === DOMAINE)?.univers ?? 'Production';

	/** Les trois droits effectifs de la planche, et rien d'autre. */
	type NiveauDeDroit = 'gestionnaire' | 'redacteur' | 'lecteur';

	const reglage = $derived(vecteur ?? {});
	const chemin = $derived(segmentsDeDossier(String(reglage['dos'] ?? 'Exploitation')));
	const niveau = $derived<NiveauDeDroit>(
		reglage['dr'] === 'redacteur'
			? 'redacteur'
			: reglage['dr'] === 'lecteur'
				? 'lecteur'
				: 'gestionnaire'
	);

	/** Le droit effectif : son nom, et d'où il vient. Trois états, pas plus. */
	const DROITS: Record<NiveauDeDroit, { nom: string; source: string }> = {
		lecteur: { nom: 'Lecteur', source: '— hérité du domaine Infrastructure' },
		redacteur: { nom: 'Rédacteur', source: '— hérité du domaine Infrastructure' },
		gestionnaire: { nom: 'Gestionnaire', source: '— accordé sur ce dossier' }
	};
	const droitEffectif = $derived(DROITS[niveau]);

	/* ── Arborescence — déduite du rangement réel des notes ──────────────────
	   Aucune structure séparée : le rangement affiché est celui qui existe. Un
	   chemin que le corpus ne porte pas ne rend donc aucun nœud, et c'est ainsi
	   que la planche présente son dossier vide. */
	interface NoeudDeDossier {
		readonly enfants: Record<string, NoeudDeDossier>;
	}

	const arbre = $derived.by<Record<string, NoeudDeDossier>>(() => {
		const racines: Record<string, NoeudDeDossier> = {};
		for (const n of corpus) {
			if (n.domaine !== DOMAINE || !n.dossier) continue;
			let courant = racines;
			for (const segment of segmentsDeDossier(n.dossier)) {
				const existant = courant[segment];
				const noeud = existant ?? { enfants: {} };
				if (!existant) courant[segment] = noeud;
				courant = noeud.enfants;
			}
		}
		return racines;
	});

	function noeudDe(c: readonly string[]): NoeudDeDossier | null {
		let niveauCourant = arbre;
		let trouve: NoeudDeDossier | null = null;
		for (const segment of c) {
			const n = niveauCourant[segment];
			if (!n) return null;
			trouve = n;
			niveauCourant = n.enfants;
		}
		return trouve;
	}

	function compterDossiers(a: Record<string, NoeudDeDossier>): number {
		let total = 0;
		for (const n of Object.values(a)) total += 1 + compterDossiers(n.enfants);
		return total;
	}

	function cheminTexte(c: readonly string[]): string {
		return c.join(' › ');
	}

	function notesDirectes(c: readonly string[]): readonly Note[] {
		const cible = cheminTexte(c);
		return corpus.filter((n) => n.domaine === DOMAINE && n.dossier === cible);
	}

	function notesRecursives(c: readonly string[]): readonly Note[] {
		const prefixe = cheminTexte(c);
		return corpus.filter(
			(n) =>
				n.domaine === DOMAINE && (n.dossier === prefixe || n.dossier.startsWith(`${prefixe} ›`))
		);
	}

	function sousDossiers(c: readonly string[]): readonly string[] {
		const n = noeudDe(c);
		return n ? Object.keys(n.enfants) : [];
	}

	function compterSousArbre(c: readonly string[]): number {
		const n = noeudDe(c);
		return n ? compterDossiers(n.enfants) : 0;
	}

	const nom = $derived(chemin[chemin.length - 1] ?? '');
	const sous = $derived(sousDossiers(chemin));
	const notesDuDossier = $derived(notesDirectes(chemin));
	const toutes = $derived(notesRecursives(chemin));

	/* ── Notes groupées par type ─────────────────────────────────────────────
	   Une fiche est groupée sous son type structuré : « Fiche Serveur ». */
	function cleDeType(n: Note): string {
		return n.type === 'Fiche' ? `Fiche ${n.typeFiche}` : n.type;
	}

	function pluriel(t: string): string {
		if (t === 'Procédure') return 'Procédures';
		if (t === 'Guide') return 'Guides';
		if (t === 'Note') return 'Notes';
		if (t === 'Signet') return 'Signets';
		if (t.startsWith('Fiche ')) return `Fiches ${t.slice(6)}`;
		return t;
	}

	const groupes = $derived.by<readonly [string, readonly Note[]][]>(() => {
		const table: Record<string, Note[]> = {};
		for (const n of notesDuDossier) {
			const cle = cleDeType(n);
			const liste = table[cle];
			if (liste) liste.push(n);
			else table[cle] = [n];
		}
		return Object.entries(table).sort(
			(a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'fr')
		);
	});

	/* ── Témoin de fraîcheur — une seule fabrique ────────────────────────────── */
	function barres(f: Note['fraicheur']): number {
		return f === 'frais' ? 3 : f === 'vieil' ? 2 : 1;
	}

	/** L'ancienneté de la dernière modification — distincte de la vérification. */
	function modification(n: Note): string {
		const j = MODIFICATIONS[n.id];
		if (typeof j !== 'number') return 'modification inconnue';
		return j <= 1 ? 'modifiée hier' : `modifiée il y a ${j} jours`;
	}

	/** Nombre en français — `x.toLocaleString("fr-FR")` du gel. */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}
</script>

{#snippet temoin(n: Note)}
	<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i class={rang < barres(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="dossier-vue"
	fil={['Accueil', UNIVERS_DU_DOMAINE, DOMAINE, ...chemin]}
	courant={[DOMAINE, ...chemin]}
	droits={niveau === 'lecteur' ? 'lecture' : 'ecriture'}
	donnees={{ 'data-droit': niveau }}
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
		<header class="tete-dossier">
			<div class="tete-dossier__corps">
				<div class="tete-dossier__sur">
					<span class="droit" id="droit" data-niveau={niveau}>
						<span class="droit__pastille"></span>
						<span id="droit-nom">{droitEffectif.nom}</span>
						<span class="droit__source" id="droit-source">{droitEffectif.source}</span>
					</span>
				</div>
				<h1>
					<svg
						width="22"
						height="22"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><path
							d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
						/></svg
					>
					<span id="titre">{nom}</span>
				</h1>
				<div class="compteurs" id="compteurs">
					<span><b>{nb(sous.length)}</b> {sous.length > 1 ? 'sous-dossiers' : 'sous-dossier'}</span
					><span style="color:var(--c-trait-fort)">·</span><span
						><b>{nb(notesDuDossier.length)}</b>
						{notesDuDossier.length > 1 ? 'notes directes' : 'note directe'}</span
					>{#if toutes.length !== notesDuDossier.length}<span style="color:var(--c-trait-fort)"
							>·</span
						><span><b>{nb(toutes.length)}</b> notes au total, sous-dossiers compris</span>{/if}
				</div>
			</div>

			<div class="actions-dossier">
				<button class="btn btn--principal si-redacteur" id="a-note">
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
					>
					Nouvelle note
				</button>
				<button class="btn si-gestionnaire" id="a-sousdossier">Nouveau sous-dossier</button>
				<button class="btn si-gestionnaire" id="a-renommer">Renommer ou déplacer</button>
				<button class="btn si-gestionnaire" id="a-droits">Gérer les droits</button>
				<button class="btn btn--destructif si-gestionnaire" id="a-supprimer">Supprimer</button>
			</div>
		</header>

		<section class="bloc" id="bloc-sous" hidden={!sous.length}>
			<div class="section-titre">
				<h2>Sous-dossiers</h2>
				<span class="etiq" id="n-sous"
					>{#if sous.length}{sous.length}
						{sous.length > 1 ? 'sous-dossiers' : 'sous-dossier'}{/if}</span
				>
			</div>
			<div class="tuiles" id="tuiles">
				{#each sous as s (s)}
					{@const sousChemin = [...chemin, s]}
					{@const nbNotes = notesRecursives(sousChemin).length}
					{@const nbSous = compterSousArbre(sousChemin)}
					<a class="tuile" href="#"
						><span class="tuile__ic"
							><svg
								width="18"
								height="18"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><path
									d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
								/></svg
							></span
						><span
							><span class="tuile__nom">{s}</span><span class="tuile__n"
								>{nbNotes}
								{nbNotes > 1 ? 'notes' : 'note'}{nbSous
									? ` · ${nbSous} ${nbSous > 1 ? 'sous-dossiers' : 'sous-dossier'}`
									: ''}</span
							></span
						></a
					>
				{/each}
			</div>
		</section>

		<section class="bloc" id="bloc-notes" hidden={!notesDuDossier.length}>
			<div class="section-titre">
				<h2>Notes de ce dossier</h2>
				<span class="etiq" id="n-notes"
					>{#if notesDuDossier.length}{notesDuDossier.length}
						{notesDuDossier.length > 1 ? 'notes' : 'note'}{/if}</span
				>
			</div>
			<div id="groupes">
				{#each groupes as [type, liste] (type)}
					<section class="groupe">
						<div class="groupe__tete">
							<h3 class="groupe__nom">{liste.length > 1 ? pluriel(type) : type}</h3>
							<span class="groupe__n">{liste.length}</span>
						</div>
						{#each liste as n (n.id)}<a class="note-ligne" href="#"
								><span class="note-ligne__corps"
									><span class="note-ligne__titre"
										>{n.titre}{#if n.brouillon}<span class="past past--brouillon">Brouillon</span
											>{/if}</span
									><span class="note-ligne__sous"
										><span>{n.auteur}</span><span class="sep">·</span><span>{modification(n)}</span
										></span
									></span
								>{@render temoin(n)}</a
							>{/each}
					</section>
				{/each}
			</div>
		</section>

		<section class="bloc" id="bloc-vide" hidden={sous.length > 0 || notesDuDossier.length > 0}>
			<div class="vide-dossier">
				<h2>Ce dossier est vide</h2>
				<p id="vide-txt">
					Aucune note, aucun sous-dossier. Un dossier vide n'est pas un problème : c'est une place
					préparée pour ce qui va venir.
				</p>
				<div class="vide-dossier__actions">
					<button class="btn btn--principal si-redacteur" id="v-note">Créer une note ici</button>
					<button class="btn si-gestionnaire" id="v-sousdossier">Créer un sous-dossier</button>
				</div>
			</div>
		</section>
	{/snippet}
</Coquille>
