<script lang="ts">
	/**
	 * V-15 — Historique des versions d'une note. Route `/notes/{identifiant}`.
	 *
	 * V-15 N'EST PAS UNE ROUTE PROPRE : elle SE SUPERPOSE à l'adresse de V-14 — même
	 * route, même note, même article. Ce qui les distingue est le panneau latéral et
	 * l'état `data-historique` qu'il pose sur `div.app`.
	 *
	 * L'ARTICLE EST CELUI DE V-14, À L'OCTET : `V-14:1415-1755` et `V-15:1507-1847`
	 * sont identiques, et la maquette l'annonce — « les deux vues montrent la même
	 * note, jamais deux versions divergentes du markup ». D'où `$lib/lecture/`.
	 *
	 * Coquille de forme abrégée. Trois attributs de données hors gabarit —
	 * `data-registre`, `data-historique`, `data-version` —, dont le deuxième commande
	 * l'escamotage du panneau : `.app[data-historique="ferme"] .tiroir` (`V-15.css`).
	 *
	 * LE PANNEAU EST UNE SUPERPOSITION : `aside.tiroir#tiroir` vit HORS de `div.app`
	 * (`V-15:1853`) et il est l'un des neuf seuls nœuds hors `div.app` du gel à
	 * porter une boîte de rendu. Il est rendu par la propriété `superposition` du
	 * gabarit, à sa place exacte : après `div.app`, avant `div.notifs`.
	 *
	 * AUCUN CHIFFRE N'EST SAISI : une note sans version antérieure rend l'état vide
	 * du gel, jamais une liste d'exemple.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (`ARB-011`) : ce qui est rendu est l'ÉTAT
	 * DE DÉPART du gel — aucune version cochée, « Comparer » désactivé. UNE SEULE
	 * EXCEPTION, ET ELLE EST ADRESSABLE : la version consultée, que `?version={n}`
	 * porte (`docs/routes.md:224`).
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-15.css`.
	 */
	import type { Domaine, IdentifiantNote, Note, Univers, Version } from '../../seeds/corpus';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import NoteDeDemonstration from '$lib/lecture/NoteDeDemonstration.svelte';
	import SommaireDeLaNote from '$lib/lecture/SommaireDeLaNote.svelte';
	import type { LectureAffichee } from '$lib/lecture/note-de-demonstration';
	import { accord } from '$lib/vocabulaire';

	/**
	 * CE QUE LA ROUTE PASSE EST REQUIS ; CE QU'ELLE NE PASSE PAS EST VIDE. Toutes ces
	 * propriétés étaient optionnelles, de défaut une constante du jeu de
	 * démonstration : l'historique d'une note quelconque servait les dix versions de
	 * `n-restaurer-pg`. `compte` est reçu SOUS LE NOM LOCAL `moi` — la vue porte déjà
	 * un `compte`, le libellé du pied du panneau —, mais le nom de la propriété reste
	 * `compte` : il est contractuel.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/** Les univers du produit — le contexte de coquille les porte. Vide : aucun. */
		univers?: readonly Univers[];
		/** Les domaines du produit — même canal. Vide : aucun périmètre. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant — même canal. `null` : personne n'est connecté. */
		compte?: CompteAffiche | null;
		/** L'historique, par note — servi par le chargeur, jamais par le jeu. */
		versions: Partial<Record<IdentifiantNote, readonly Version[]>>;
		/** Le nombre de versions conservées par note, lu en configuration. */
		retentionVersions: number;
		/**
		 * LA NOTE DONT L'HISTORIQUE EST MONTRÉ — REQUISE. Elle décide de tout ce qui
		 * nomme la note : les versions lues, le titre du fil et du panneau, le
		 * rangement. Son défaut était une note du jeu choisie par le vecteur.
		 */
		note: Note;
		/**
		 * LA NOTE TELLE QU'ELLE S'AFFICHE — l'identité, les deux corps rendus, le
		 * sommaire, le dernier contrôle, les dates et les mesures. REQUISE : sans elle, le
		 * bloc partagé retombait sur la note de démonstration, et
		 * `/notes/{identifiant}?version` rendait POUR N'IMPORTE QUELLE NOTE le titre, le
		 * rangement et l'auteur de `n-restaurer-pg`, sous un fil d'Ariane qui nommait la
		 * vraie note.
		 *
		 * `note` NE FAIT PAS DOUBLE EMPLOI : elle porte l'ENVELOPPE de l'écran — rangement
		 * du fil, titre du panneau, clé de lecture des versions — quand `affichee` porte
		 * l'ARTICLE, c'est-à-dire l'ÉTAT CONSULTÉ. LES DEUX PEUVENT DIVERGER, ET C'EST
		 * TOUT L'OBJET DE CET ÉCRAN : sur `?version={n}`, « Restaurer cette version »
		 * écrasait la note avec un contenu jamais montré (`RG-M18-05`).
		 */
		affichee: LectureAffichee;
		/**
		 * COMPARER DEUX VERSIONS — REQUISE. Le gel écrit `disabled` en dur sur
		 * `#comparer` et n'attache rien aux cases : `/notes/{id}/comparaison` existait
		 * sans qu'aucun clic n'y mène.
		 */
		onComparer: (a: number, b: number) => void;
		/**
		 * LE NUMÉRO DE LA VERSION CONSULTÉE — `?version={n}`. `null`, ou désignant la
		 * version courante : le bandeau reste replié. Un numéro qui ne désigne aucune
		 * version vaut la version courante — une adresse forgée ne fabrique pas un
		 * troisième état.
		 */
		versionAffichee: number | null;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines = [],
		compte: moi = null,
		versions: historique,
		retentionVersions,
		note,
		affichee,
		versionAffichee,
		onComparer
	}: Proprietes = $props();

	/**
	 * Le compte servi à la coquille. Hors gabarit racine, il n'y a PAS de compte
	 * connecté : la barre le rend vide plutôt que de nommer un utilisateur du jeu.
	 */
	const COMPTE_ABSENT: CompteAffiche = { nom: '', initiales: '', role: '', domaine: '' };

	const reglage = $derived(vecteur ?? {});

	const panneau = $derived<'ouvert' | 'ferme'>(reglage['pan'] === 'ferme' ? 'ferme' : 'ouvert');
	const droits = $derived<'ecriture' | 'lecture'>(
		reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture'
	);
	/** L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040` : le gel cache
	    ses actions d'écriture en feuille, le produit ne les émet pas. La classe reste
	    posée sur les nœuds rendus. */
	const ecriture = $derived(droits !== 'lecture');

	/**
	 * LES VERSIONS DE LA NOTE OUVERTE, ET D'AUCUNE AUTRE. Le levier `hist` de la
	 * planche choisissait entre deux notes du jeu et le vide quand aucune note
	 * n'était passée.
	 */
	const versions = $derived<readonly Version[]>(historique[note.id] ?? []);

	const titre = $derived(note.titre);

	/** LE RANGEMENT DE LA NOTE, tel que le fil le déroule : le chemin de dossier est
	    découpé comme `src/vues/V-17.svelte:247` le découpe, et non par une seconde
	    règle. Une note rangée à la racine d'un domaine n'a aucun segment. */
	const segments = $derived(
		note.dossier
			.split('›')
			.map((s) => s.trim())
			.filter((s) => s !== '')
	);

	/** LE TITRE DE L'ÉTAT AFFICHÉ — celui que l'article porte en `<h1>`, et qui n'est
	    pas toujours celui de la note : `versions.titre` est CAPTURÉ parce que le titre
	    est renommable (`RG-M07-02`). Le panneau garde `titre` — il nomme LA NOTE dont
	    l'historique est ouvert, pas l'état consulté. */
	const titreAffiche = $derived(affichee.note.titre);

	/** Le fil d'Ariane — identique à celui de V-14 : l'historique n'a pas de chemin propre. */
	const fil = $derived(['Accueil', note.univers, note.domaine, ...segments, titreAffiche]);
	const courant = $derived([note.domaine, ...segments]);

	/**
	 * LA VERSION ANTÉRIEURE CONSULTÉE — `afficher()`, `V-15:2905`. La plus récente
	 * est la version COURANTE : la consulter n'est pas consulter un état antérieur,
	 * et le gel replie alors le bandeau.
	 */
	const anterieure = $derived(
		versionAffichee === null || versionAffichee === versions[0]?.n
			? null
			: (versions.find((v) => v.n === versionAffichee) ?? null)
	);

	const bandeau = $derived(
		anterieure === null
			? null
			: {
					titre: `Version ${anterieure.n} du ${anterieure.date}, par ${anterieure.auteur}`,
					sous: `${anterieure.resume} · vous consultez un état antérieur, la note courante n'est pas modifiée.`
				}
	);

	/* Le panneau — transcription de `rendreListe()` (`V-15:2857`), `ligneVersion()`
	   (`V-15:2795`), `ampleur()` (`V-15:2767`), `relatif()` (`V-15:2761`) et
	   `majPied()` (`V-15:2884`). */

	/** La rétention annoncée sous le titre du panneau. Vide quand il n'y a rien à
	    conserver — le gel efface alors le texte plutôt que d'annoncer zéro. */
	const retention = $derived(
		versions.length === 0
			? ''
			: `${versions.length} ${accord(versions.length, 'version conservée', 'versions conservées')}` +
					` · les ${retentionVersions} dernières sont gardées, les plus anciennes sont supprimées automatiquement`
	);

	/** Le bloc d'état du panneau. Deux cas, et aucun troisième : aucune version, ou
	    une seule. */
	const etatDuPanneau = $derived(
		versions.length === 0
			? {
					titre: 'Aucune version antérieure',
					texte:
						"Cette note n'a pas été modifiée depuis sa création. L'historique se remplira à la première modification enregistrée."
				}
			: versions.length === 1
				? {
						titre: 'Comparaison indisponible',
						texte:
							"Il faut deux versions pour comparer. Celle-ci est la seule enregistrée : la note n'a pas été modifiée depuis sa création."
					}
				: null
	);

	let choisies = $state<number[]>([]);
	function basculerChoix(n: number): void {
		choisies = choisies.includes(n) ? choisies.filter((x) => x !== n) : [...choisies, n].slice(-2);
	}

	/**
	 * Le pied du panneau. Aucune version n'est sélectionnée à l'état de départ :
	 * « Comparer » est donc toujours désactivé ici.
	 */
	const compte = $derived(
		versions.length < 2
			? 'Comparaison indisponible'
			: choisies.length === 0
				? 'Sélectionnez deux versions'
				: choisies.length === 1
					? 'Une version sélectionnée'
					: 'Deux versions sélectionnées'
	);

	/**
	 * L'ancienneté d'une version, en clair — `relatif()`, `V-15:2761`. LE GEL DIT
	 * « HIER » DÈS ZÉRO JOUR, ET C'EST FAUX : `joursEcoules()` compte des jours
	 * PLEINS, donc une version capturée il y a dix minutes vaut 0. « À l'instant »
	 * exigerait des HEURES que `Version.jours` ne porte pas.
	 *
	 * LA PARENTHÈSE DE « an(s) » TOMBE, ÉCART DE MAQUETTE ASSUMÉ : une version d'un an
	 * y lisait « il y a 1 an(s) », exactement le repli qu'`accord()` existe pour
	 * supprimer. « mois » ne bouge pas, il est invariable.
	 */
	function relatif(jours: number): string {
		if (jours <= 0) return "aujourd'hui";
		if (jours === 1) return 'hier';
		if (jours < 31) return `il y a ${jours} jours`;
		const mois = Math.round(jours / 30);
		if (mois < 12) return `il y a ${mois} mois`;
		const ans = Math.round(jours / 365);
		return `il y a ${ans} ${accord(ans, 'an')}`;
	}

	/** Les cinq segments de la barre d'ampleur — cinq toujours, jamais moins. */
	const SEGMENTS = [0, 1, 2, 3, 4];

	/**
	 * La classe d'un segment : `a` pour la part ajoutée, `r` pour la part retirée,
	 * aucune quand la version n'a rien touché. Répartition au prorata, avec un
	 * minimum d'un segment ajouté dès qu'il y a du mouvement.
	 */
	function segment(v: Version, rang: number): string | undefined {
		const total = v.ajout + v.retrait;
		if (!total) return undefined;
		const parts = Math.max(1, Math.round((v.ajout / total) * 5));
		return rang < parts ? 'a' : 'r';
	}
</script>

{#snippet ligneVersion(v: Version, courante: boolean)}
	<!-- prettier-ignore -->
	<div class="ver" data-courante={courante ? 'oui' : undefined} data-affichee={anterieure !== null && anterieure.n === v.n ? 'oui' : undefined}
		><label class="ver__case"
			><input
				type="checkbox"
				disabled={versions.length < 2}
				checked={choisies.includes(v.n)}
				onchange={() => basculerChoix(v.n)}
				aria-label="Sélectionner la version {v.n} pour comparaison"
			/></label
		><button class="ver__corps" type="button"
			><div class="ver__haut"
				><span class="ver__n">Version {v.n}</span
				>{#if courante}<span class="ver__marque">courante</span>{/if}<span
					class="ver__quand"
					title="{v.date} à {v.heure}">{relatif(v.jours)}</span
				></div
			><div class="ver__resume">{v.resume}</div
			><div class="ver__bas"
				><span class="ver__qui">{v.auteur}</span
				><span
					class="ampleur"
					title="{v.ajout} {accord(v.ajout, 'ligne ajoutée', 'lignes ajoutées')}, {v.retrait} {accord(
						v.retrait,
						'retirée'
					)}"
					><span class="ampleur__plus">+{v.ajout}</span
					><span class="ampleur__moins">−{v.retrait}</span
					><span class="ampleur__barre" aria-hidden="true"
						>{#each SEGMENTS as rang (rang)}<i class={segment(v, rang)}></i>{/each}</span
					></span
				></div
			></button
		></div
	>
{/snippet}

<!-- LE SÉPARATEUR `›` DE LA LIGNE « RANGEMENT » vit ici, et non dans
	`$lib/lecture/`, parce qu'il porte un style en ligne du gel : un style en ligne
	n'est prouvé que par la maquette RATTACHÉE au fichier (`ARB-016`), et
	`src/lib/lecture/` n'a pas ce rattachement. Écart remonté. -->
{#snippet separateur()}<span style="color:var(--c-encre-4)">›</span>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="lecture"
	cibleEvitement="article"
	{fil}
	{courant}
	{droits}
	donnees={{
		'data-registre': 'reference',
		'data-historique': panneau,
		'data-version': anterieure === null ? 'courante' : 'antérieure'
	}}
	{univers}
	{domaines}
	notes={corpus}
	compte={moi ?? COMPTE_ABSENT}
	version=""
>
	{#snippet enfants()}
		<SommaireDeLaNote entrees={affichee.sommaire} />

		<article class="article" id="article">
			<!--
				Bandeau d'identification, affiché quand une version antérieure est consultée
				— `?version={n}` désignant autre chose que la plus récente. Il précède tout
				le reste, y compris l'en-tête.
			-->
			<div class="bandeau-version" id="bandeau-version" hidden={bandeau === null}>
				<div class="bandeau-version__corps">
					<div class="bandeau-version__titre" id="bv-titre">{bandeau ? bandeau.titre : '—'}</div>
					<div id="bv-sous">{bandeau ? bandeau.sous : ''}</div>
				</div>
				<div class="bandeau-version__actions">
					<!-- P-09 · ARB-040 — omise, jamais masquée. `V-15:1502` -->
					{#if ecriture}<button class="btn si-ecriture" id="bv-restaurer"
							>Restaurer cette version</button
						>{/if}
					<button class="btn btn--discret" id="bv-retour">Revenir à la version courante</button>
				</div>
			</div>

			<!-- P-09 · ARB-040 — le bloc partagé OMET ses actions d'écriture en lecture seule. -->
			<NoteDeDemonstration {droits} {separateur} {affichee} />
		</article>
	{/snippet}

	{#snippet superposition()}
		<!-- ============================ PANNEAU LATÉRAL ============================ -->
		<aside class="tiroir" id="tiroir" aria-label="Historique des versions">
			<div class="tiroir__tete">
				<div class="tiroir__ligne">
					<div style="min-width:0">
						<h2 class="tiroir__titre">Historique</h2>
						<div class="tiroir__note" id="tiroir-note">{titre}</div>
					</div>
					<button class="tiroir__fermer" id="fermer-tiroir" aria-label="Fermer l'historique">
						<svg
							width="17"
							height="17"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<span class="tiroir__retention" id="retention">{retention}</span>
			</div>

			<div class="tiroir__corps" id="versions">
				{#each versions as v, rang (v.n)}{@render ligneVersion(
						v,
						rang === 0
					)}{/each}{#if etatDuPanneau}<!-- prettier-ignore -->
					<div class="tiroir__etat"
						><h3>{etatDuPanneau.titre}</h3
						><p>{etatDuPanneau.texte}</p
					></div>{/if}
			</div>

			<div class="tiroir__pied">
				<span class="tiroir__compte" id="selection">{compte}</span>
				<button
					class="btn btn--principal"
					id="comparer"
					disabled={choisies.length !== 2}
					onclick={() => {
						const [a, b] = [...choisies].sort((x, y) => x - y);
						if (a !== undefined && b !== undefined) onComparer(a, b);
					}}>Comparer</button
				>
			</div>
		</aside>
	{/snippet}
</Coquille>
