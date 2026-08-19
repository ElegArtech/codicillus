<script lang="ts">
	/**
	 * V-02 — Recherche publique, sans session. Route `/recherche` en anonyme
	 * (`docs/routes.md` §3.1). La même adresse sert V-08 en session : les deux
	 * branches sont SÉQUENCÉES, jamais parallèles (DAG K-2, `docs/releve-vues.md`
	 * §9 R-6). P-8 écrit la branche connectée, ce lot l'anonyme.
	 *
	 * V-02 EST V-08 AMPUTÉE, JAMAIS RÉÉCRITE — c'est le commentaire du gel
	 * (`V-02:1125`) : la carte de résultat publique retire le brouillon, la
	 * visibilité, le marquage de registre et le rangement interne ; tout le reste
	 * — signal de fraîcheur, date de dernière révision en clair, consultations —
	 * est identique. Les facettes se réduisent de même à deux : Domaine et Type
	 * de guide. Ni statut, ni visibilité, ni étiquette interne.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PÉRIMÈTRE PUBLIC — RG-M17-01, AU POINT D'ENTRÉE
	 *
	 * « Réduction du corpus au point d'entrée de la vue, comme en V-01. Aucune
	 * fonction de cette page ne peut atteindre une note interne, même par erreur
	 * de branchement : elles n'existent plus pour elle » (`V-02:1120`).
	 * `notesPubliques(notes)` est calculé une fois, en tête ; toutes les
	 * expressions du fichier en descendent. `seeds/corpus.ts` porte la même
	 * déclaration au même endroit.
	 *
	 * CE QUE CE COMPOSANT NE PROUVE PAS. Il rend un ÉTAT DE MAQUETTE. L'étanchéité
	 * réelle est la batterie 6 (`pnpm test:etancheite`, lot T-011). Ni
	 * `RG-ACC-01`, ni `RG-ACC-04`, ni `P-09` ne sont déclarées tenues.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PAS DE COQUILLE, ET QUATRE FENÊTRES
	 *
	 * `docs/releve-vues.md` §5.1 : V-01 à V-06 et V-09 n'en portent pas.
	 * V-02 est contrôlée sur quatre fenêtres (ARB-009, RG-M18-13, cas d'usage
	 * « chercher ») : cinq états × quatre fenêtres = 20 couples.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT — ARB-011. Le dépliage des facettes,
	 * le choix d'une valeur, le retrait d'un filtre, la frappe et l'ouverture
	 * d'un guide relèvent de T-017. Aucun filtre n'est choisi dans les cinq états
	 * déclarés : `#actifs` est vide, `#vider-facettes` et `#compte-filtres` sont
	 * masqués, comme la référence les montre.
	 *
	 * LE COMPTEUR DE DURÉE EST UNE VALEUR DU GEL, ET IL CONTREDIT P-02. La
	 * maquette écrit `Math.max(0.06, (performance.now() - t0) / 1000 + 0.18)` :
	 * une durée SIMULÉE, que P-02 proscrit — « aucun compteur ne peut être figé
	 * ou simulé ». Le squelette ne mesure rien, il rend un instant : la valeur
	 * portée est celle de la formule à durée écoulée nulle, soit 0,18 s, et c'est
	 * exactement ce que la référence affiche. La contradiction appartient au gel,
	 * pas au port ; elle est remontée au rapport du lot, et P-02 n'est pas
	 * déclarée tenue.
	 *
	 * LES ADRESSES RESTENT CELLES DU GEL — voir l'en-tête de `V-04.svelte`.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-02.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-02 --installer`. Les deux `style=` du
	 * fichier — `padding:4px 8px` et `padding-top:0` — figurent à l'ensemble clos
	 * du gel (ARB-016).
	 */
	import { notesPubliques, type Note } from '../../seeds/corpus';
	import { chercher, nombreFr, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-02')`, variante « lecture ». */
		notes: readonly Note[];
	}

	const { vecteur, notes }: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const etat = $derived(typeof reglage['etat'] === 'string' ? reglage['etat'] : 'nominal');
	const saisie = $derived(typeof reglage['req'] === 'string' ? reglage['req'] : 'mot de passe');

	/** RG-M17-01 — la restriction au périmètre public, au point d'entrée. */
	const publiques = $derived(notesPubliques(notes));

	const requete = $derived(saisie.trim());
	/**
	 * `base` est le résultat AVANT filtrage par facettes ; `resultats` l'ensemble
	 * après. Aucun filtre n'est choisi dans les états déclarés, les deux
	 * coïncident donc — mais la distinction est celle du gel, et les comptes de
	 * facette se calculent sur `base`, jamais sur `resultats`.
	 */
	const base = $derived(chercher(publiques, requete));
	const resultats = $derived(base);

	/**
	 * La durée affichée. Formule du gel à durée écoulée nulle — voir l'en-tête :
	 * le squelette ne mesure pas, il rend l'instant que la référence montre.
	 */
	const duree = Math.max(0.06, 0 / 1000 + 0.18)
		.toFixed(2)
		.replace('.', ',');

	/** Facettes réduites : ni statut, ni visibilité, ni étiquette interne. */
	const FACETTES = [
		{ id: 'domaine', nom: 'Domaine', cle: (n: Note) => [n.domaine as string] },
		{ id: 'type', nom: 'Type de guide', cle: (n: Note) => [n.type as string] }
	];

	/**
	 * Les valeurs d'une facette et leur compte, dans l'ordre du gel : compte
	 * décroissant, puis ordre alphabétique français à égalité.
	 */
	function valeursDe(facette: (typeof FACETTES)[number]): readonly (readonly [string, number])[] {
		const comptes: Record<string, number> = {};
		for (const n of base) {
			for (const v of facette.cle(n)) comptes[v] = (comptes[v] ?? 0) + 1;
		}
		return Object.entries(comptes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
	}

	/** Les cinq pistes de reformulation, telles que le gel les énumère. */
	const PISTES = ['mot de passe', 'accès', 'salle de réunion', 'réseau', 'support'];
</script>

<!--
	Le témoin de fraîcheur — fabrique unique : « il n'existe qu'une seule
	fabrique, pour qu'il ne puisse pas diverger d'un écran à l'autre »
	(`V-02:1017`). Le libellé accompagne toujours la jauge (RG-M18-09).
-->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!-- Un texte, avec les termes de la requête marqués — `surligner()` du gel. -->
{#snippet marque(
	texte: string,
	q: string
)}{#each segmenter(texte, q) as s, rang (rang)}{#if s.marque}<mark>{s.texte}</mark
			>{:else}{s.texte}{/if}{/each}{/snippet}

<!--
	La carte de résultat, variante PUBLIQUE : le rangement interne n'est pas
	exposé, seul le domaine l'est.
-->
{#snippet carte(n: Note, q: string, index: number)}
	<!--
		AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE, et il doit le rester : le relevé
		d'ordre de tabulation du niveau 1 construit le nom accessible sur
		`textContent`, où un blanc inséré par le formateur se voit. Mesuré : trois
		états en échec de structure pour cette seule cause.
	-->
	<!-- prettier-ignore -->
	<a class="carte carte--publique" href="#" data-index={index}
		><div class="carte__haut"
			><h2 class="carte__titre">{@render marque(n.titre, q)}</h2><span class="past past--type">{n.type === 'Fiche' ? `Fiche ${n.typeFiche}` : n.type}</span
		></div
		>{#if n.type === 'Signet'}<div class="marque-signet" style="margin-bottom:var(--e-2)">↗ {n.url}</div>{/if}<p class="carte__extrait">{@render marque(n.extrait, q)}</p
		><div class="carte__signal"
			>{@render temoin(n)}<span class="carte__revision" data-jamais={n.revise ? undefined : 'oui'}>{n.revise ? `Révisé le ${n.revise}` : 'Jamais révisé'}</span
		></div
		><div class="carte__pied"
			><span class="carte__chemin"><b>{n.domaine}</b></span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues)} consultations</span
			>{#if n.pj}<span class="sep">·</span><span>{n.pj} {n.pj > 1 ? 'pièces jointes' : 'pièce jointe'}</span>{/if}</div
		></a
	>
{/snippet}

<a class="saut-contenu" href="#resultats">Aller aux résultats</a>

<div class="public app" id="app" data-etat={etat} data-facettes="ferme">
	<header class="chapeau">
		<a class="marque" href="#" aria-label="Codicillus — accueil public">
			<span class="marque__sceau" aria-hidden="true">C</span>
			<span class="marque__nom">Codicillus</span>
		</a>
		<!-- Accès connexion : discret, pour les personnes qui ont déjà un compte. -->
		<a class="btn btn--discret" href="#">Se connecter</a>
	</header>

	<div class="barre-requete">
		<div class="barre-requete__int">
			<div class="champ-public champ-public--compact">
				<svg
					width="20"
					height="20"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
				>
				<input
					type="search"
					id="saisie"
					autocomplete="off"
					spellcheck="false"
					value={saisie}
					placeholder="Que cherchez-vous ?"
					aria-label="Rechercher dans les guides publics"
				/>
				<button class="champ-public__effacer" id="effacer" aria-label="Effacer la recherche">
					<svg
						width="18"
						height="18"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</button>
			</div>
		</div>
	</div>

	<main class="corps-public">
		<div class="grille-rech">
			<!-- ---------- Facettes réduites ---------- -->
			<aside class="facettes" aria-label="Filtres">
				<div class="panneau">
					<div class="panneau__tete">
						<span class="etiq">Affiner</span>
						<button class="btn btn--discret" id="vider-facettes" style="padding:4px 8px" hidden
							>Tout effacer</button
						>
					</div>
					<div class="panneau__corps" id="facettes" style="padding-top:0">
						{#each FACETTES as f (f.id)}{@const valeurs = valeursDe(f)}{#if valeurs.length}<section
									class="facette"
									data-ouvert="oui"
								>
									<button class="facette__tete" aria-expanded="true"
										><span class="etiq">{f.nom}</span><span
											><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
												><path d="M3 1l4 4-4 4z" /></svg
											></span
										></button
									>
									<div class="facette__corps">
										{#each valeurs as [valeur, compte] (valeur)}<label
												class="val"
												data-vide={compte ? undefined : 'oui'}
												><input type="checkbox" /><span class="val__nom">{valeur}</span><span
													class="val__n">{compte}</span
												></label
											>{/each}
									</div>
								</section>{/if}{/each}
					</div>
				</div>
			</aside>

			<!-- ---------- Résultats ---------- -->
			<div id="resultats-zone">
				<div class="reglages">
					<span class="compteur" id="compteur"
						>{#if resultats.length}<b
								>{resultats.length} résultat{resultats.length > 1 ? 's' : ''}</b
							>{` en ${duree} s`}{/if}</span
					>
					<button class="btn bouton-facettes" id="ouvrir-facettes">
						Affiner <span class="compte-filtres" id="compte-filtres" hidden>0</span>
					</button>
				</div>

				<div class="actifs" id="actifs"></div>

				<div class="resultats si-nominal" id="resultats">
					{#if resultats.length === 0}<!--
							Moment le plus important de la vue : l'utilisateur qui ne trouve pas
							ne doit pas rester bloqué. Aucune création de note ici — le repli est
							l'assistance.
						-->
						<div class="zone-vide">
							<div class="zone-vide__titre">Aucun guide ne répond à <em>« {requete} »</em></div>
							<p>
								Aucun guide public ne correspond. Essayez d'autres mots, ou demandez directement à
								l'assistance — votre question signalera le guide manquant.
							</p>
							<div class="reformuler">
								{#each PISTES as piste (piste)}<button class="piste">{piste}</button>{/each}
							</div>
							<a class="btn btn--principal" href="#">Ouvrir un ticket d'assistance</a>
						</div>{:else}{#each resultats as n, index (n.id)}{@render carte(
								n,
								requete,
								index
							)}{/each}{/if}
				</div>

				<div class="si-chargement" aria-hidden="true">
					<div class="esquisse esq-carte"></div>
					<div class="esquisse esq-carte"></div>
					<div class="esquisse esq-carte"></div>
				</div>

				<!-- Repli permanent : présent même quand la recherche aboutit. -->
				<aside class="repli">
					<div>
						<h2 class="repli__titre">Ce que vous cherchez n'est pas là ?</h2>
						<p class="repli__txt">
							L'assistance répond directement. Précisez ce que vous cherchiez : c'est souvent ce qui
							déclenche l'écriture du guide manquant.
						</p>
					</div>
					<a class="btn btn--principal" href="#" id="ticket">
						Ouvrir un ticket d'assistance
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M6 3h7v7M13 3L4 12" /></svg
						>
					</a>
				</aside>
			</div>
		</div>
	</main>

	<footer class="pied-public">
		<div class="pied-public__int">
			<span class="etiq">Codicillus · Direction technique</span>
			<a href="#">Se connecter</a>
		</div>
	</footer>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
