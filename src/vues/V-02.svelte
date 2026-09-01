<script lang="ts">
	/**
	 * V-02 — Recherche publique, sans session. Route `/recherche` en anonyme
	 * (`docs/routes.md` §3.1) ; la même adresse sert V-08 en session.
	 *
	 * V-02 EST V-08 AMPUTÉE, JAMAIS RÉÉCRITE — c'est le commentaire du gel
	 * (`V-02:1125`) : la carte publique retire le brouillon, la visibilité, le
	 * marquage de registre et le rangement interne, et les facettes se réduisent à
	 * deux — Domaine et Type de guide.
	 *
	 * `recherchees` TRANCHE CE QUI CHERCHE. La vue portait sa propre correspondance,
	 * une SECONDE implémentation de la recherche à côté du moteur — elle n'inspecte
	 * ni le corps, ni le rangement, ni l'auteur —, et une note trouvée par l'index
	 * pouvait disparaître à l'affichage. Son défaut est `false` : sans elle, la vue
	 * cherche elle-même, comme le gel. Le chargeur de `/recherche` la pose.
	 *
	 * PÉRIMÈTRE PUBLIC — `RG-M17-01`, AU POINT D'ENTRÉE : « aucune fonction de cette
	 * page ne peut atteindre une note interne, même par erreur de branchement : elles
	 * n'existent plus pour elle » (`V-02:1120`). IL EST CONSERVÉ MÊME QUAND LE MOTEUR
	 * A DÉJÀ CHERCHÉ : le filtre du régime anonyme est porté par `resolution.ts` et
	 * injecté dans la requête à l'index (`ADR-006`) ; cette réduction-ci le double.
	 *
	 * L'ÉTAT DE LA RECHERCHE EST PORTÉ PAR L'ADRESSE — `RG-M02-06` : le gel garde ses
	 * filtres dans une variable de page, et une recherche affinée n'est donc pas
	 * partageable. `docs/routes.md` §4.2 : dans une facette les valeurs sont en OU
	 * (paramètre répété), entre facettes en ET.
	 *
	 * LE COMPTEUR DE DURÉE ÉTAIT UNE CONSTANTE PRÉSENTÉE COMME UNE MESURE : la
	 * formule du gel a un terme mesuré NUL PAR CONSTRUCTION. La durée est désormais
	 * une donnée reçue, ou `null` — et `null` veut dire QU'AUCUNE MESURE N'EXISTE :
	 * l'écran n'écrit alors pas de durée, ni constante plausible, ni `0,00 s`.
	 *
	 * UN RÉSULTAT OUVRE SON GUIDE — `/guides/{identifiant}`, par `resolve()`. Le style
	 * est dans `src/socle.css` et `src/vues/V-02.css`.
	 */
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Note } from '../../seeds/corpus';
	import { chercher, nombreFr, notesPubliques, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	/**
	 * LES MOTIFS DE ROUTE, ÉCRITS EN CONSTANTES —
	 * `svelte/no-navigation-without-resolve` inspecte l'EXPRESSION du `href`, et une
	 * adresse composée à la main lui est opaque. UN RÉSULTAT S'OUVRE EN
	 * `/guides/{identifiant}`, JAMAIS EN `/notes/{…}` : cet écran est celui du
	 * visiteur SANS SESSION, qui n'a aucun droit sur l'adresse interne.
	 */
	const ROUTE_DU_GUIDE = '/guides/[identifiant]' as const;

	interface Proprietes {
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
		 * `parametres`. EXIGÉE : son défaut était l'adresse du jeu de démonstration, et
		 * une route qui l'aurait oubliée aurait servi `assistance.exemple.fr` comme un
		 * fait. Vide, aucun appel à l'assistance n'est ÉMIS.
		 */
		portail: string;
		/**
		 * LES PISTES DE REFORMULATION — une DONNÉE. La vue en portait cinq en dur,
		 * tirées du gel, dont chacune ouvrait `/recherche?q=…` à zéro résultat. EXIGÉE :
		 * la route doit dire ce qu'elle propose, fût-ce rien. Liste vide, le bloc n'est
		 * pas rendu du tout.
		 */
		pistes: readonly string[];
		/**
		 * LA DURÉE DE LA RECHERCHE, EN MILLISECONDES — une MESURE, ou `null` quand
		 * aucune mesure n'existe : l'écran n'écrit alors aucune durée. Pas encore
		 * EXIGÉE parce que sa source ne descend pas encore — le moteur ne retient pas
		 * le `processingTimeMs` que Meilisearch lui rend.
		 */
		dureeMs?: number | null;
		/**
		 * LE MOTEUR N'A PAS RÉPONDU — `RG-M04-07`. Une panne de service N'EST PAS un
		 * corpus vide : sans ce drapeau, la zone de résultats affirmait « Aucun guide
		 * ne répond à “…” » alors qu'aucune requête n'avait abouti, et le visiteur
		 * repartait en croyant la connaissance absente. Faux par défaut — l'état
		 * ordinaire, où l'absence de résultat est bien celle du corpus.
		 */
		panne?: boolean;
	}

	const {
		vecteur,
		notes,
		recherchees = false,
		retenues,
		portail,
		pistes,
		dureeMs = null,
		panne = false
	}: Proprietes = $props();

	/** Une adresse absente ou blanche ne mène nulle part : rien ne l'annonce. */
	const assistanceJoignable = $derived(portail.trim() !== '');

	const reglage = $derived(vecteur ?? {});
	const etat = $derived(typeof reglage['etat'] === 'string' ? reglage['etat'] : 'nominal');
	const saisie = $derived(typeof reglage['req'] === 'string' ? reglage['req'] : 'mot de passe');

	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation` de la
	 * table `parametres`. Cet écran écrivait « Direction technique » EN DUR : le
	 * SEGMENT DE MARCHÉ du cadrage soudé dans une signature de produit.
	 * « Codicillus » n'est pas concerné, c'est le nom du LOGICIEL.
	 *
	 * CHAÎNE VIDE = L'INSTANCE NE S'EST PAS NOMMÉE, l'état normal d'une installation
	 * neuve : la signature rend « Codicillus » seul.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');
	const signature = $derived(
		nomOrganisation === '' ? 'Codicillus' : `Codicillus · ${nomOrganisation}`
	);

	/** RG-M17-01 — la restriction au périmètre public, au point d'entrée. */
	const publiques = $derived(notesPubliques(notes));

	const requete = $derived(saisie.trim());
	/**
	 * `base` est le résultat AVANT filtrage par facettes, `resultats` l'ensemble
	 * après (`V-02:1394-1395`) : les comptes de facette se calculent sur `base`.
	 */
	const base = $derived(recherchees ? publiques : chercher(publiques, requete));

	/**
	 * LA DURÉE EN CLAIR — deux décimales, virgule décimale, comme le gel l'écrit.
	 * Une mesure absente ne devient ni une constante, ni un zéro.
	 */
	const dureeEnClair = $derived(
		dureeMs === null ? null : (dureeMs / 1000).toFixed(2).replace('.', ',')
	);

	/** Facettes réduites : ni statut, ni visibilité, ni étiquette interne. */
	const FACETTES = [
		{ id: 'domaine', nom: 'Domaine', cle: (n: Note) => [n.domaine as string] },
		{ id: 'type', nom: 'Type de guide', cle: (n: Note) => [n.type as string] }
	];

	/** Les valeurs retenues, facette par facette — l'adresse en est la source. */
	const choisis = $derived<Record<string, readonly string[]>>(retenues ?? {});

	const nbFiltres = $derived(Object.values(choisis).reduce((s, v) => s + v.length, 0));

	/**
	 * Un résultat passe s'il satisfait chaque facette ayant au moins une valeur
	 * retenue ; à l'intérieur d'une facette, les valeurs sont en « ou »
	 * (`V-02:1272-1280`). `saufFacette` sert au comptage.
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
	 * décroissant, puis alphabétique français. Une valeur retenue qui ne mènerait à
	 * rien est CONSERVÉE en fin de liste, marquée `data-vide` — « sa disparition
	 * ferait croire à un défaut d'affichage ».
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

	/* L'ADRESSE PORTE L'ÉTAT — `RG-M02-06`, `RG-M02-07`. Une seule fabrique, et
	   toutes les commandes de la page y passent : c'est ce qui garantit qu'une
	   adresse partagée rend le même écran. `docs/routes.md` §4.2. */

	/**
	 * L'adresse est composée COUPLE PAR COUPLE, et non par `URLSearchParams` : une
	 * instance mutable de cette classe est refusée dans un composant
	 * (`svelte/prefer-svelte-reactivity`). L'ordre est fixe, pour que deux états
	 * identiques rendent la même adresse.
	 */
	function adresse(prochaines: Record<string, readonly string[]>, q: string): string {
		const couples: string[] = [];
		if (q) couples.push(`q=${encodeURIComponent(q)}`);
		for (const f of FACETTES) {
			for (const v of prochaines[f.id] ?? []) couples.push(`${f.id}=${encodeURIComponent(v)}`);
		}
		return couples.length ? `/recherche?${couples.join('&')}` : '/recherche';
	}

	/** La navigation n'a lieu que BRANCHÉE : sans `recherchees`, la vue rend un état
	    de maquette hors de toute route, et y naviguer l'emmènerait ailleurs. */
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
</script>

<!--
	Le témoin de fraîcheur — fabrique unique : « il n'existe qu'une seule fabrique,
	pour qu'il ne puisse pas diverger d'un écran à l'autre » (`V-02:1017`). Le
	libellé accompagne toujours la jauge (RG-M18-09).
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
	<!-- AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE, et il doit le rester : le nom
		accessible se construit sur `textContent`. -->
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
			><span class="carte__chemin"><b>{n.domaine}</b></span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues)} {accord(n.vues, 'consultation')}</span
			>{#if n.pj}<span class="sep">·</span><span>{n.pj} {accord(n.pj, 'pièce jointe', 'pièces jointes')}</span>{/if}</div
		></a
	>
{/snippet}

<!-- L'ADRESSE DU PORTAIL D'ASSISTANCE EST EXTERNE, et `resolve()` ne s'y applique
	pas : elle composerait une adresse INTERNE sous la racine de déploiement. Tous
	les autres liens de la vue y passent. -->
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
						>{#if resultats.length}<b>{resultats.length} {accord(resultats.length, 'résultat')}</b
							>{#if dureeEnClair !== null}{` en ${dureeEnClair} s`}{/if}{/if}</span
					>
					<button class="btn bouton-facettes" id="ouvrir-facettes">
						Affiner <span class="compte-filtres" id="compte-filtres" hidden={!nbFiltres}
							>{nbFiltres}</span
						>
					</button>
				</div>

				<!--
					LES PASTILLES DE FILTRE — `RG-M02-07`, port de `rendreActifs()`. Chaque
					pastille retire son couple de l'adresse ; « Tout effacer » ne garde que `q`.
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
					<!--
						`RG-M04-07` — LE PANNEAU EN ERREUR, ET IL NE CASSE PAS LA PAGE : la
						recherche n'a pas répondu, tout le reste de l'écran reste servi. Le
						bloc précède les trois états du vide parce qu'il les CONTREDIT — ne
						rien trouver et ne pas avoir cherché ne se disent pas pareil.
					-->
					{#if panne}
						<div class="zone-vide">
							<div class="zone-vide__titre">La recherche n'a pas répondu</div>
							<p>
								Le moteur de recherche est momentanément indisponible : aucune requête n'a abouti,
								et cela ne dit rien du contenu publié. Réessayez dans un instant.
							</p>
							<button
								class="btn btn--principal"
								type="button"
								onclick={() => window.location.reload()}>Réessayer</button
							>
							{#if assistanceJoignable}<a class="btn" href={portail}
									>Ouvrir un ticket d'assistance</a
								>{/if}
						</div>
					{:else if resultats.length === 0}<!--
							Moment le plus important de la vue : l'utilisateur qui ne trouve pas
							ne doit pas rester bloqué. Aucune création de note ici — le repli est
							l'assistance.
						-->
						<div class="zone-vide">
							<!--
								TROIS ÉTATS, ET NON UN SEUL. Le titre citait la requête SANS CONDITION :
								ouverte sans `?q=`, la page annonçait « Aucun guide ne répond à “ ” ».
								Une recherche sans requête n'est pas une recherche sans résultat.
							-->
							<div class="zone-vide__titre">
								{#if requete !== ''}Aucun guide ne répond à <em>« {requete} »</em
									>{:else if nbFiltres}Aucun guide ne correspond aux filtres retenus{:else}Aucun
									guide n'est encore publié{/if}
							</div>
							<p>
								{requete === '' && nbFiltres === 0
									? "Aucune note n'a encore été publiée pour la consultation publique. Si vous avez un compte, connectez-vous — /connexion — pour chercher dans tout le corpus ; sinon, l'assistance répond directement."
									: nbFiltres
										? 'Aucun guide public ne correspond avec les filtres appliqués. Retirez-en un, ou reformulez votre question.'
										: "Aucun guide public ne correspond. Essayez d'autres mots, ou demandez directement à l'assistance — votre question signalera le guide manquant."}
							</p>
							{#if pistes.length}<div class="reformuler">
									{#each pistes as piste (piste)}<button
											class="piste"
											onclick={() => essayer(piste)}>{piste}</button
										>{/each}
								</div>{/if}
							{#if assistanceJoignable}<a class="btn btn--principal" href={portail}
									>Ouvrir un ticket d'assistance</a
								>{/if}
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

				<!-- Repli permanent : présent même quand la recherche aboutit.
					 L'ASIDE ENTIER EST GARDÉ quand aucun portail n'est configuré :
					 garder la question sans le lien laisserait une impasse. -->
				{#if assistanceJoignable}
					<aside class="repli">
						<div>
							<h2 class="repli__titre">Ce que vous cherchez n'est pas là ?</h2>
							<p class="repli__txt">
								L'assistance répond directement. Précisez ce que vous cherchiez : c'est souvent ce
								qui déclenche l'écriture du guide manquant.
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
				{/if}
			</div>
		</div>
	</main>

	<footer class="pied-public">
		<div class="pied-public__int">
			<span class="etiq">{signature}</span>
			<a href={resolve('/connexion')}>Se connecter</a>
		</div>
	</footer>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
