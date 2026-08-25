<script lang="ts">
	/**
	 * V-02 — Recherche publique, sans session. Route `/recherche` en anonyme
	 * (`docs/routes.md` §3.1). La même adresse sert V-08 en session : les deux
	 * branches sont SÉQUENCÉES, jamais parallèles (DAG K-2, `docs/releve-vues.md`
	 * §9 R-6).
	 *
	 * V-02 EST V-08 AMPUTÉE, JAMAIS RÉÉCRITE — c'est le commentaire du gel
	 * (`V-02:1125`) : la carte de résultat publique retire le brouillon, la
	 * visibilité, le marquage de registre et le rangement interne ; tout le reste
	 * — signal de fraîcheur, date de dernière révision en clair, consultations —
	 * est identique. Les facettes se réduisent de même à deux : Domaine et Type
	 * de guide. Ni statut, ni visibilité, ni étiquette interne.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUI CHERCHE, ET CE QUI REND — `recherchees`
	 *
	 * Cette vue portait sa propre correspondance : `chercher()`, le port fidèle
	 * de la fabrique de maquette, rejoué sur les notes reçues. C'était une
	 * SECONDE implémentation de la recherche à côté du moteur — elle n'inspecte
	 * ni le corps, ni le rangement, ni l'auteur —, et une note trouvée par
	 * l'index pouvait disparaître à l'affichage sans que rien ne le dise.
	 *
	 * `recherchees` tranche l'ambiguïté au point d'entrée, et son défaut est
	 * `false` : sans elle, la vue cherche elle-même dans le jeu qu'on lui donne,
	 * exactement comme le gel — c'est ce que fait le rendu d'un état de maquette,
	 * qui ne passe par aucune route. Le chargeur de `/recherche`, lui, la pose :
	 * les notes qu'il transmet SONT le résultat de l'index, dans l'ordre du
	 * moteur, et la vue n'a plus qu'à les rendre.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PÉRIMÈTRE PUBLIC — RG-M17-01, AU POINT D'ENTRÉE
	 *
	 * « Réduction du corpus au point d'entrée de la vue, comme en V-01. Aucune
	 * fonction de cette page ne peut atteindre une note interne, même par erreur
	 * de branchement : elles n'existent plus pour elle » (`V-02:1120`).
	 * `notesPubliques(notes)` est calculé une fois, en tête ; toutes les
	 * expressions du fichier en descendent. IL EST CONSERVÉ MÊME QUAND LE MOTEUR
	 * A DÉJÀ CHERCHÉ : le filtre du régime anonyme est porté par
	 * `resolution.ts` et injecté dans la requête à l'index (`ADR-006`), et cette
	 * réduction-ci ne le remplace pas — elle le double, au point exact où le gel
	 * la met.
	 *
	 * CE QUE CE COMPOSANT NE PROUVE PAS. L'étanchéité réelle est la batterie 6
	 * (`pnpm test:etancheite`), matrice routes × personas. Ni `RG-ACC-01`, ni
	 * `RG-ACC-04`, ni `P-09` ne sont déclarées tenues.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * L'ÉTAT DE LA RECHERCHE EST PORTÉ PAR L'ADRESSE — RG-M02-06
	 *
	 * Le gel garde ses filtres dans une variable de page (`choisis`) : rien n'en
	 * sort, et une recherche affinée n'est pas partageable. Ici, `retenues` vient
	 * de l'adresse et RIEN d'autre ne la porte : chaque bascule de valeur, chaque
	 * pastille retirée, chaque « Tout effacer » recompose l'adresse et y navigue.
	 * `docs/routes.md` §4.2 : « à l'intérieur d'une facette les valeurs sont en
	 * OU (paramètre répété), entre facettes en ET » ; « `/recherche` sans
	 * paramètre autre que `q` réinitialise tout ».
	 *
	 * AUCUN NŒUD N'EST AJOUTÉ NI DÉPLACÉ POUR CELA. Le gel fait de ses valeurs
	 * de facette des cases à cocher et de ses pastilles des boutons ; ils le
	 * restent, et ce sont leurs gestionnaires — non leur nature — qui changent.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE COMPTEUR DE DURÉE EST UNE VALEUR DU GEL, ET IL CONTREDIT P-02. La
	 * maquette écrit `Math.max(0.06, (performance.now() - t0) / 1000 + 0.18)` :
	 * une durée SIMULÉE, que P-02 proscrit — « aucun compteur ne peut être figé
	 * ou simulé ». La vue ne mesure rien, elle rend un instant : la valeur portée
	 * est celle de la formule à durée écoulée nulle, soit 0,18 s, et c'est
	 * exactement ce que la référence affiche. La contradiction appartient au gel,
	 * pas au port ; P-02 n'est pas déclarée tenue.
	 *
	 * LE COMPTE, LUI, EST RÉEL — `RG-M02-08`, « compteur global reflétant le
	 * filtrage ». Le cahier l'illustre par « 4 résultats sur 37 » ; le gel écrit
	 * `N résultat(s)` et rien d'autre (`V-02:1447-1452`), et la maquette fait la
	 * loi sur la forme (ordre de préséance, `CLAUDE.md` §2). Ce qui devient vrai
	 * ici est le nombre : il reflète la requête ET les facettes retenues.
	 *
	 * UN RÉSULTAT OUVRE SON GUIDE — `/guides/{identifiant}`, par `resolve()`. Les
	 * adresses du gel étaient inertes ; elles ne le sont plus, et c'est la seule
	 * modification que la campagne de câblage autorise dans une vue.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-02.css` (P-6.3). Les deux `style=` du fichier —
	 * `padding:4px 8px` et `padding-top:0` — figurent à l'ensemble clos du gel
	 * (ARB-016).
	 */
	import { resolve } from '$app/paths';
	import { CONFIG, notesPubliques, type Note } from '../../seeds/corpus';
	import { chercher, nombreFr, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { vocabulaireRendu } from '$lib/vocabulaire';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	/**
	 * LES MOTIFS DE ROUTE, ÉCRITS EN CONSTANTES — `svelte/no-navigation-without-resolve`
	 * inspecte l'EXPRESSION du `href`, et une adresse composée à la main lui est
	 * opaque. Même écriture qu'à `V-07:455` et sur `src/lib/coquille/Rail.svelte`.
	 *
	 * UN RÉSULTAT S'OUVRE EN `/guides/{identifiant}`, JAMAIS EN `/notes/{…}` :
	 * cet écran est celui du visiteur SANS SESSION, qui n'a aucun droit sur
	 * l'adresse interne.
	 */
	const ROUTE_DU_GUIDE = '/guides/[identifiant]' as const;

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Les notes à rendre — jeu de semence, ou résultat du moteur. */
		notes: readonly Note[];
		/**
		 * Les notes reçues SONT-ELLES déjà le résultat du moteur ? Absent : non,
		 * et la vue cherche elle-même, comme le gel. Voir l'en-tête.
		 */
		recherchees?: boolean;
		/**
		 * Les valeurs de facette retenues par l'adresse, par identifiant de
		 * facette. Absent : aucune — l'état des cinq positions de la planche.
		 */
		retenues?: Record<string, readonly string[]>;
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — donnée d'INSTANCE, lue dans la table
		 * `parametres` par le chargeur de la route. Absente, la valeur du jeu de
		 * semence, qui est celle que la semence écrit en base.
		 */
		portail?: string;
	}

	const {
		vecteur,
		notes,
		recherchees = false,
		retenues,
		portail = CONFIG.portailAssistance
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const etat = $derived(typeof reglage['etat'] === 'string' ? reglage['etat'] : 'nominal');
	const saisie = $derived(typeof reglage['req'] === 'string' ? reglage['req'] : 'mot de passe');

	/** RG-M17-01 — la restriction au périmètre public, au point d'entrée. */
	const publiques = $derived(notesPubliques(notes));

	const requete = $derived(saisie.trim());
	/**
	 * `base` est le résultat AVANT filtrage par facettes ; `resultats` l'ensemble
	 * après. La distinction est celle du gel (`V-02:1394-1395`), et les comptes
	 * de facette se calculent sur `base`, jamais sur `resultats`.
	 */
	const base = $derived(recherchees ? publiques : chercher(publiques, requete));

	/**
	 * La durée affichée. Formule du gel à durée écoulée nulle — voir l'en-tête :
	 * la vue ne mesure pas, elle rend l'instant que la référence montre.
	 */
	const duree = Math.max(0.06, 0 / 1000 + 0.18)
		.toFixed(2)
		.replace('.', ',');

	/** Facettes réduites : ni statut, ni visibilité, ni étiquette interne. */
	const FACETTES = [
		{ id: 'domaine', nom: 'Domaine', cle: (n: Note) => [n.domaine as string] },
		{ id: 'type', nom: 'Type de guide', cle: (n: Note) => [n.type as string] }
	];

	/** Les valeurs retenues, facette par facette — l'adresse en est la source. */
	const choisis = $derived<Record<string, readonly string[]>>(retenues ?? {});

	/** Le nombre total de valeurs retenues — `nbFiltres()` du gel. */
	const nbFiltres = $derived(Object.values(choisis).reduce((s, v) => s + v.length, 0));

	/**
	 * Un résultat passe s'il satisfait chaque facette ayant au moins une valeur
	 * retenue ; à l'intérieur d'une facette, les valeurs sont en « ou »
	 * (`V-02:1272-1280`). `saufFacette` sert au comptage : la facette qu'on
	 * compte est écartée, les autres restent appliquées.
	 */
	function passe(n: Note, saufFacette?: string): boolean {
		return FACETTES.every((f) => {
			if (f.id === saufFacette) return true;
			const c = choisis[f.id];
			if (!c || !c.length) return true;
			const vals = f.cle(n);
			return c.some((v) => vals.indexOf(v) !== -1);
		});
	}

	const resultats = $derived(base.filter((n) => passe(n)));

	/**
	 * Les valeurs d'une facette et leur compte, dans l'ordre du gel : compte
	 * décroissant, puis ordre alphabétique français à égalité. Une valeur retenue
	 * qui ne mènerait à rien est CONSERVÉE en fin de liste et marquée
	 * `data-vide` — « sa disparition ferait croire à un défaut d'affichage ».
	 */
	function valeursDe(facette: (typeof FACETTES)[number]): readonly (readonly [string, number])[] {
		const comptes: Record<string, number> = {};
		for (const n of base.filter((x) => passe(x, facette.id))) {
			for (const v of facette.cle(n)) comptes[v] = (comptes[v] ?? 0) + 1;
		}
		const valeurs = Object.entries(comptes).sort(
			(a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr')
		);
		for (const v of choisis[facette.id] ?? []) {
			if (!valeurs.some(([nom]) => nom === v)) valeurs.push([v, 0]);
		}
		return valeurs;
	}

	/** Le dépliage d'une facette — état local, comme au gel (`V-02:1267`). */
	const ouverts = $state<Record<string, boolean>>({ domaine: true, type: true });
	function estOuverte(id: string): boolean {
		return ouverts[id] !== false;
	}

	/* ═════════════════════════════════════════════════════════════════════
	   L'ADRESSE PORTE L'ÉTAT — RG-M02-06, RG-M02-07

	   Une seule fabrique d'adresse, et toutes les commandes de la page y
	   passent : c'est ce qui garantit qu'une adresse partagée rend exactement le
	   même écran que celui d'où elle vient. `docs/routes.md` §4.2.
	   ═════════════════════════════════════════════════════════════════════ */

	/**
	 * L'adresse est composée COUPLE PAR COUPLE, et non par `URLSearchParams` :
	 * une instance mutable de cette classe est refusée dans un composant Svelte
	 * (`svelte/prefer-svelte-reactivity`), et la réactivité n'a rien à faire ici
	 * — cette fabrique est pure. `q` vient en premier, puis les facettes dans
	 * l'ordre de lecture : deux états identiques rendent la même adresse, donc
	 * comparable.
	 */
	function adresse(prochaines: Record<string, readonly string[]>, q: string): string {
		const couples: string[] = [];
		if (q) couples.push(`q=${encodeURIComponent(q)}`);
		for (const f of FACETTES) {
			for (const v of prochaines[f.id] ?? []) couples.push(`${f.id}=${encodeURIComponent(v)}`);
		}
		return couples.length ? `/recherche?${couples.join('&')}` : '/recherche';
	}

	/**
	 * LA NAVIGATION N'A LIEU QUE BRANCHÉE. Sans `recherchees`, la vue rend un
	 * état de maquette hors de toute route : y naviguer emmènerait la page de
	 * démonstration ailleurs. Le gel, dans cette situation, ne navigue pas non
	 * plus — il rejoue son rendu en mémoire.
	 */
	function aller(cible: string): void {
		if (recherchees) window.location.assign(cible);
	}

	function basculer(idFacette: string, valeur: string, actif: boolean): void {
		const prochaines: Record<string, readonly string[]> = { ...choisis };
		const courantes = prochaines[idFacette] ?? [];
		const suite = actif ? [...courantes, valeur] : courantes.filter((v) => v !== valeur);
		if (suite.length) prochaines[idFacette] = suite;
		else delete prochaines[idFacette];
		aller(adresse(prochaines, requete));
	}

	/** « Tout effacer » — l'adresse ne garde que `q` (`docs/routes.md` §4.2). */
	function toutEffacer(): void {
		aller(adresse({}, requete));
	}

	/** Une nouvelle requête conserve les filtres, comme le gel le fait à la frappe. */
	function chercherA(q: string): void {
		aller(adresse(choisis, q.trim()));
	}

	/** Une piste de reformulation repart à neuf — `choisis = {}` (`V-02:1430`). */
	function essayer(piste: string): void {
		aller(adresse({}, piste));
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
	<a class="carte carte--publique" href={resolve(ROUTE_DU_GUIDE, { identifiant: n.id })} data-index={index}
		><div class="carte__haut"
			><h2 class="carte__titre">{@render marque(n.titre, q)}</h2><span class="past past--type">{n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type}</span
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

<!--
	L'ADRESSE DU PORTAIL D'ASSISTANCE EST EXTERNE, et `resolve()` ne s'y applique
	pas : elle compose une adresse INTERNE sous la racine de déploiement, quand
	celle-ci est une adresse absolue lue dans la table `parametres`. La règle est
	donc levée pour ce fichier, et pour elle seule — même levée que `V-03.svelte`,
	et pour la même raison. Tous les autres liens de la vue passent par
	`resolve()`.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a class="saut-contenu" href="#resultats">Aller aux résultats</a>

<div class="public app" id="app" data-etat={etat} data-facettes="ferme">
	<header class="chapeau">
		<a class="marque" href={resolve('/')} aria-label="Codicillus — accueil public">
			<span class="marque__sceau" aria-hidden="true">C</span>
			<span class="marque__nom">Codicillus</span>
		</a>
		<!-- Accès connexion : discret, pour les personnes qui ont déjà un compte. -->
		<a class="btn btn--discret" href={resolve('/connexion')}>Se connecter</a>
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
					onkeydown={(e) => {
						if (e.key === 'Enter') chercherA(e.currentTarget.value);
						else if (e.key === 'Escape' && e.currentTarget.value) chercherA('');
					}}
				/>
				<button
					class="champ-public__effacer"
					id="effacer"
					aria-label="Effacer la recherche"
					onclick={() => chercherA('')}
				>
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
						<button
							class="btn btn--discret"
							id="vider-facettes"
							style="padding:4px 8px"
							hidden={!nbFiltres}
							onclick={toutEffacer}>Tout effacer</button
						>
					</div>
					<div class="panneau__corps" id="facettes" style="padding-top:0">
						{#each FACETTES as f (f.id)}{@const valeurs = valeursDe(f)}{#if valeurs.length}<section
									class="facette"
									data-ouvert={estOuverte(f.id) ? 'oui' : 'non'}
								>
									<button
										class="facette__tete"
										aria-expanded={estOuverte(f.id)}
										onclick={() => (ouverts[f.id] = !estOuverte(f.id))}
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
												><input
													type="checkbox"
													checked={(choisis[f.id] ?? []).indexOf(valeur) !== -1}
													onchange={(e) => basculer(f.id, valeur, e.currentTarget.checked)}
												/><span class="val__nom">{valeur}</span><span class="val__n">{compte}</span
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
						Affiner <span class="compte-filtres" id="compte-filtres" hidden={!nbFiltres}
							>{nbFiltres}</span
						>
					</button>
				</div>

				<!--
					LES PASTILLES DE FILTRE — RG-M02-07, port de `rendreActifs()`
					(`V-02:1351-1385`). Chaque pastille retire son couple
					`{facette}={valeur}` de l'adresse ; « Tout effacer » ne garde que `q`.
				-->
				<div class="actifs" id="actifs">
					{#if nbFiltres}{#each FACETTES as f (f.id)}{#each choisis[f.id] ?? [] as valeur (valeur)}<span
									class="filtre"
									><span><b>{f.nom + ' : '}</b>{valeur}</span><button
										aria-label={`Retirer le filtre ${f.nom} ${valeur}`}
										onclick={() => basculer(f.id, valeur, false)}
										><svg
											width="12"
											height="12"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="2"><path d="M4 4l8 8M12 4l-8 8" /></svg
										></button
									></span
								>{/each}{/each}<button class="actifs__vider" onclick={toutEffacer}
							>Tout effacer</button
						>{/if}
				</div>

				<div class="resultats si-nominal" id="resultats">
					{#if resultats.length === 0}<!--
							Moment le plus important de la vue : l'utilisateur qui ne trouve pas
							ne doit pas rester bloqué. Aucune création de note ici — le repli est
							l'assistance.
						-->
						<div class="zone-vide">
							<div class="zone-vide__titre">Aucun guide ne répond à <em>« {requete} »</em></div>
							<p>
								{nbFiltres
									? 'Aucun guide public ne correspond avec les filtres appliqués. Retirez-en un, ou reformulez votre question.'
									: "Aucun guide public ne correspond. Essayez d'autres mots, ou demandez directement à l'assistance — votre question signalera le guide manquant."}
							</p>
							<div class="reformuler">
								{#each PISTES as piste (piste)}<button class="piste" onclick={() => essayer(piste)}
										>{piste}</button
									>{/each}
							</div>
							<a class="btn btn--principal" href={portail}>Ouvrir un ticket d'assistance</a>
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
					<a class="btn btn--principal" href={portail} id="ticket">
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
			<a href={resolve('/connexion')}>Se connecter</a>
		</div>
	</footer>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
