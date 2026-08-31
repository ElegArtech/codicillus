<script lang="ts">
	/**
	 * V-22 — Signets d'un domaine. Route `/univers/{univers}/{domaine}/signets`
	 * (`docs/routes.md` §3.3), atteinte par l'entrée de rail « Outils › Signets ».
	 *
	 * L'adresse est celle du gabarit, prolongée — `$lib/rangement/adresses`. La
	 * forme raccourcie `/domaines/…` n'existe pas (`ARB-001`), et la clause de
	 * désambiguïsation de `RG-M03-02` reste SANS OBJET : à ne jamais implémenter.
	 *
	 * UN SIGNET EST UNE NOTE DE TYPE « Signet », pas un objet séparé : c'est le
	 * vocabulaire contractuel, et c'est ce que porte `seeds/corpus.ts` — `type ===
	 * 'Signet'`, plus `url` et `ajoute`. Le mot « lien » ne désigne ici que la cible
	 * externe, jamais l'objet du produit.
	 *
	 * LES LIENS DE SIGNET PORTENT LEUR ADRESSE RÉELLE, et c'est le gel : ce sont des
	 * adresses EXTERNES, écrites au corpus.
	 *
	 * Coquille de forme abrégée ; lien d'évitement `#liste` « Aller à la liste » ;
	 * chemin courant du rail `[nom du domaine]`.
	 *
	 * LE MOTEUR DE FACETTES N'EST PAS FACTORISÉ AVEC V-12, ET C'EST DÉLIBÉRÉ
	 * (`docs/DESIGN.md` §2.H) : les deux vues partagent dix-neuf classes, mais cinq
	 * d'entre elles — `.facettes`, `.reglages`, `.val`, `.tri`, `.actifs` — ont des
	 * définitions DIVERGENTES, chacune portée par sa propre feuille. Les
	 * définitions de facettes diffèrent aussi : deux ici, six en V-12.
	 *
	 * Aucun chiffre n'est saisi : compteur, comptes de facettes et dates sortent des
	 * notes servies. Le style est dans `src/socle.css` et `src/vues/V-22.css`.
	 */
	import type { Domaine, Note, Univers } from '../../seeds/corpus';
	import { getContext } from 'svelte';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { accord } from '$lib/vocabulaire';

	/* LE NOM DE L'ORGANISATION VIENT DU CONTEXTE, JAMAIS DU PRODUIT. Cette phrase
	   nommait « la direction technique » en dur — le segment de marché du cadrage
	   soudé dans une phrase d'écran. Chaîne vide : l'instance ne s'est pas nommée,
	   et la phrase retombe sur une formulation qui n'affirme rien. */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');

	/**
	 * LE RANGEMENT ET L'IDENTITÉ — plus aucun défaut tiré du jeu. Ces propriétés ont
	 * eu pour défaut `UNIVERS`, `DOMAINES` et `MOI` de `seeds/corpus.ts` : une route
	 * qui en oubliait une servait le rangement du jeu de démonstration, et l'écran
	 * restait plausible avec des domaines qui n'existent pas. `domaines` est
	 * REQUISE ; `univers` peut être vide, le rail abrégé étant écrit au balisage.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers?: readonly Univers[];
		domaines: readonly Domaine[];
		/** L'utilisateur connecté. `null` : aucun compte connu. */
		compte?: CompteAffiche | null;
		/**
		 * MODIFIER UN SIGNET. Absente, le bouton reste inerte comme au gel. Passée par
		 * la route, il mène à `/univers/{u}/{d}/signets/{identifiant}/modifier`, un
		 * écran qui existait sans qu'aucun clic n'y mène.
		 */
		onModifier?: (identifiant: string) => void;
		/**
		 * LES VALEURS DE FACETTE RETENUES, telles que L'ADRESSE les porte. Les deux
		 * facettes du gel — Étiquette, Auteur — étaient DÉCORATIVES : cocher une valeur
		 * ne filtrait rien, et cet écran était le dernier écran de liste que son adresse
		 * ne gouvernait pas, alors que `docs/routes.md` §4.2 les déclare.
		 */
		retenues?: Record<string, readonly string[]>;
		/**
		 * L'ORDRE DEMANDÉ — le vocabulaire de la liste des notes, et pas un mot de
		 * plus : `modification`, `verification`, `consultations`, `alpha`. Deux listes
		 * du même produit ne nomment pas leur ordre de deux façons.
		 *
		 * ABSENTE, l'ordre est celui du gel : ancienneté de VÉRIFICATION croissante.
		 * Aucun sélecteur d'ordre n'est dessiné sur cet écran, l'ordre ne s'atteint que
		 * par l'adresse. `modification` retombe sur l'ordre du gel — cet écran n'a pas
		 * la table des anciennetés de modification, et l'inventer serait un chiffre
		 * saisi. Une valeur inconnue retombe de même : un paramètre d'adresse ne se
		 * refuse pas, il s'ignore.
		 */
		tri?: string;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines,
		compte = null,
		onModifier,
		retenues = undefined,
		tri = undefined
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const droits = $derived(reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture');
	/** L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040` : le gel cache
	    ses actions d'écriture en feuille, le produit ne les émet pas. La classe reste
	    posée sur les nœuds rendus. */
	const ecriture = $derived(droits !== 'lecture');
	/** Le rappel de sortie est une case de planche : cochée par défaut. */
	const rappelDemande = $derived(reglage['c-rappel'] !== false);

	/** AUCUN DOMAINE — l'état vide, écrit plutôt que subi : un tableau vide rendait
	    `domaines[0].nom` et sortait en 500. */
	const AUCUN_DOMAINE: Domaine = { nom: '', univers: '', couleur: '' };

	const courant = $derived(
		domaines.find((d) => d.nom === reglage['dom']) ?? domaines[0] ?? AUCUN_DOMAINE
	);

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — LE DOMAINE COURANT, ET LUI SEUL. Le gel en
	 * marquait DEUX : `coquille()` AJOUTE `noeud--courant` et ne la retire jamais
	 * (`V-22:2493`), si bien que la planche marquait d'abord le domaine de son
	 * scénario. La vue recopiait ce comportement, donc le NOM D'UN DOMAINE DU JEU DE
	 * DÉMONSTRATION, écrit en dur. Même jurisprudence qu'en V-11 et V-12.
	 */
	const railCourant = $derived([courant.nom]);

	/**
	 * LES SIGNETS DU DOMAINE — `window.signetsDe` du gel, à la lettre : les notes de
	 * type « Signet » du domaine, triées par ancienneté de vérification CROISSANTE.
	 * C'est l'ordre rendu tant qu'aucun ordre n'est demandé par l'adresse.
	 */
	function comparer(a: Note, b: Note): number {
		if (tri === 'alpha') return a.titre.localeCompare(b.titre, 'fr');
		if (tri === 'consultations') return b.vues - a.vues;
		return (a.jours || 0) - (b.jours || 0);
	}

	const base = $derived(
		corpus
			.filter((n) => n.type === 'Signet' && n.domaine === courant.nom)
			.slice()
			.sort(comparer)
	);

	/* LES FACETTES — deux ici, et le même calque de moteur qu'en V-12 : le compte
	   affiché en regard d'une valeur est le nombre de résultats obtenus si cette
	   valeur était retenue, les autres facettes restant appliquées ; les valeurs sont
	   triées par compte décroissant puis alphabétiquement. LES VALEURS RETENUES
	   VIENNENT DE L'ADRESSE, et de nulle part ailleurs. Le moteur est celui du gel à
	   la lettre (`V-22:2540-2600`). */

	interface DefinitionDeFacette {
		readonly id: string;
		readonly nom: string;
		readonly cle: (n: Note) => readonly string[];
		readonly prefixe?: string;
	}

	const FACETTES: readonly DefinitionDeFacette[] = [
		{ id: 'etiquette', nom: 'Étiquette', cle: (n) => n.etiquettes, prefixe: '#' },
		{ id: 'auteur', nom: 'Auteur', cle: (n) => [n.auteur] }
	];

	/** Les valeurs retenues, telles que l'adresse les porte. */
	const choisis = $derived<Record<string, readonly string[]>>(retenues ?? {});

	/** Un signet passe chaque facette ayant au moins une valeur retenue ; à
	 *  l'intérieur d'une facette, les valeurs sont en « ou ». */
	function passe(n: Note, saufFacette?: string): boolean {
		return FACETTES.every((f) => {
			if (f.id === saufFacette) return true;
			const c = choisis[f.id];
			if (!c || !c.length) return true;
			const valeurs = f.cle(n);
			return c.some((v) => valeurs.includes(v));
		});
	}

	interface ValeurDeFacette {
		readonly valeur: string;
		readonly compte: number;
		readonly retenue: boolean;
	}

	interface FacetteRendue {
		readonly id: string;
		readonly nom: string;
		readonly prefixe: string;
		readonly retenues: number;
		readonly valeurs: readonly ValeurDeFacette[];
	}

	function facetteRendue(f: DefinitionDeFacette): FacetteRendue {
		const sansCelleCi = base.filter((n) => passe(n, f.id));
		const comptes: Record<string, number> = {};
		for (const n of sansCelleCi) {
			for (const v of f.cle(n)) if (v) comptes[v] = (comptes[v] ?? 0) + 1;
		}
		const ordonnees = Object.keys(comptes).sort(
			(a, b) => (comptes[b] ?? 0) - (comptes[a] ?? 0) || a.localeCompare(b, 'fr')
		);
		/* Une valeur retenue mais absente du compte est ajoutée en queue et s'affiche
		   en retrait : la faire disparaître ferait croire à un défaut. */
		const gardees = choisis[f.id] ?? [];
		for (const v of gardees) if (!ordonnees.includes(v)) ordonnees.push(v);
		return {
			id: f.id,
			nom: f.nom,
			prefixe: f.prefixe ?? '',
			retenues: gardees.length,
			valeurs: ordonnees.map((valeur) => ({
				valeur,
				compte: comptes[valeur] ?? 0,
				retenue: gardees.includes(valeur)
			}))
		};
	}

	const facettes = $derived(FACETTES.map(facetteRendue).filter((f) => f.valeurs.length > 0));

	const filtresActifs = $derived(
		FACETTES.flatMap((f) =>
			(choisis[f.id] ?? []).map((valeur) => ({
				nom: f.nom,
				valeur,
				etiquette: (f.prefixe ?? '') + valeur
			}))
		)
	);

	const filtrees = $derived(base.filter((n) => passe(n)));

	/* L'ADRESSE EXTERNE, LUE COMME LE GEL LA LIT — `window.hoteDe` et
	   `window.cheminDe` : c'est le NOM D'HÔTE qu'on montre, pas l'adresse complète.
	   Elles ne vont PAS dans `$lib/rangement/adresses` : ce module compose les
	   adresses INTERNES du produit, et une adresse de signet est une donnée du
	   corpus, saisie par un contributeur. */
	function hoteDe(url: string): string {
		// `split` rend toujours au moins un morceau ; le repli est là pour le typage
		// strict, jamais pour un cas réel.
		return (
			String(url || '')
				.replace(/^https?:\/\//, '')
				.replace(/^www\./, '')
				.split('/')[0] ?? ''
		);
	}

	function cheminDe(url: string): string {
		const reste = String(url || '')
			.replace(/^https?:\/\//, '')
			.replace(/^www\./, '');
		const i = reste.indexOf('/');
		return i === -1 ? '' : reste.slice(i);
	}

	/**
	 * Le monogramme du site : les deux premières lettres significatives du nom
	 * d'hôte, stables d'un signet à l'autre du même site.
	 */
	function monogramme(url: string): string {
		const h = hoteDe(url).split('.');
		const mot = h.length > 2 ? h[h.length - 3] : h[0];
		return (mot || '?').slice(0, 2);
	}

	function cheminAffiche(url: string): string {
		const chemin = cheminDe(url);
		return chemin.length > 42 ? chemin.slice(0, 41) + '…' : chemin;
	}

	/** Le compteur de tête : « N signets », ou « N sur M signets » quand un
	 *  filtre mord — la forme du gel, `V-22:2897-2900`. */
	const compteur = $derived(
		filtrees.length === base.length
			? ` ${accord(base.length, 'signet')}`
			: ` sur ${base.length} ${accord(base.length, 'signet')}`
	);

	/**
	 * LE RAPPEL DE SORTIE — `RG-M11-02`. Il ne s'affiche que si le domaine porte au
	 * moins un signet : un rappel sur une liste vide n'avertit de rien.
	 */
	const rappelVisible = $derived(base.length > 0 && rappelDemande);
</script>

<!--
	AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE DE SIGNET, et il doit le rester : le nom
	accessible se construit sur `textContent`, où un blanc inséré par le formateur
	se voit. Ne jamais citer la forme exacte de la directive à l'intérieur d'un
	commentaire.

	`target="_blank"` et `rel="noopener noreferrer"` sont ceux du gel : un signet
	s'ouvre dans un nouvel onglet, « votre lecture en cours n'est pas perdue ».
-->
<!--
	`svelte/no-navigation-without-resolve` EST DÉSACTIVÉE ICI, ET SEULEMENT ICI :
	`n.url` est une adresse EXTERNE, écrite au corpus, hors de tout espace de routes
	du produit. La résoudre serait une faute, pas une précaution.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!-- prettier-ignore -->
{#snippet carteSignet(n: Note)}<article class="sig"><span class="sig__sceau" aria-hidden="true">{monogramme(n.url ?? '')}</span><div style="min-width:0"><a class="sig__titre" href={n.url} target="_blank" rel="noopener noreferrer" aria-label={n.titre + " — site externe, s'ouvre dans un nouvel onglet"}>{n.titre}</a><div class="sig__adresse"><span class="sig__hote">{hoteDe(n.url ?? '')}</span>{#if cheminAffiche(n.url ?? '')}<span class="sig__chemin">{cheminAffiche(n.url ?? '')}</span>{/if}<span class="sig__sortie"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h7v7M13 3L4 12"/></svg>site externe</span></div></div>{#if ecriture}<div class="sig__actions si-ecriture"><button class="btn" type="button" onclick={() => onModifier?.(n.id)}>Modifier</button><button class="btn btn--destructif" type="button" aria-label={'Supprimer le signet ' + n.titre}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"/></svg></button></div>{/if}<p class="sig__desc">{n.extrait}</p><div class="sig__pied"><span class="sig__etq">{#each n.etiquettes as e (e)}<span class="past past--etiquette">{e}</span>{/each}</span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{'ajouté le ' + (n.ajoute ?? n.revise)}</span></div></article>{/snippet}
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<Coquille
	forme="abregee"
	classeContenu="signets-vue"
	cibleEvitement="liste"
	libelleEvitement="Aller à la liste"
	fil={['Accueil', courant.univers, courant.nom, 'Signets']}
	courant={railCourant}
	{droits}
	{univers}
	{domaines}
	notes={corpus}
	compte={compte ?? COMPTE_VIDE}
	version=""
>
	{#snippet enfants()}
		<header class="tete" style="--teinte:{courant.couleur}">
			<div>
				<div class="tete__sur">
					<span class="tete__puce"></span>
					<span class="etiq" id="sur-titre">{courant.univers + ' · ' + courant.nom}</span>
				</div>
				<h1 id="titre">{'Signets de ' + courant.nom}</h1>
			</div>
			<div style="display:flex;align-items:center;gap:var(--e-3);flex-wrap:wrap">
				<!-- prettier-ignore -->
				<span class="tete__compteur" id="compteur">{#if base.length}<b>{filtrees.length}</b>{compteur}{/if}</span>
				<!-- P-09 · ARB-040 — omise, jamais masquée. `V-22:1257` -->
				{#if ecriture}<button class="btn btn--principal si-ecriture" id="nouveau">
						<svg
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
						>
						Nouveau signet
					</button>{/if}
			</div>
		</header>

		<div class="barre-outils">
			<div class="filtres-barre" id="facettes">
				{#each facettes as f (f.id)}
					<!-- LE MENU DIT QUELLE FACETTE IL PORTE : le câblage l'identifiait par son
					     RANG, or une facette sans valeur n'est pas rendue — le rang se décalait
					     et cocher une valeur écrivait la clé de la facette voisine. -->
					<div class="fac-menu" data-facette={f.id}>
						<!-- prettier-ignore -->
						<button type="button" class="fac-menu__bouton" aria-expanded="false" data-actif={f.retenues ? 'oui' : undefined}>{f.nom}{#if f.retenues}<span class="fac-menu__n">{f.retenues}</span>{/if}<span><svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3l4 4 4-4z"/></svg></span></button>
						<div class="fac-menu__panneau">
							<div class="facette__corps">
								<!-- prettier-ignore -->
								{#each f.valeurs as v (v.valeur)}<label class="val" data-vide={v.compte ? undefined : 'oui'}><input type="checkbox" checked={v.retenue}><span class="val__nom">{f.prefixe + v.valeur}</span><span class="val__n">{v.compte}</span></label>{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- prettier-ignore -->
		<div class="actifs" id="actifs">{#each filtresActifs as f, rang (rang)}<span class="filtre"><span><b>{f.nom + ' : '}</b>{f.etiquette}</span><button type="button" aria-label={'Retirer le filtre ' + f.nom + ' ' + f.valeur}><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></span>{/each}{#if filtresActifs.length}<button class="actifs__vider" type="button">Tout effacer</button>{/if}</div>

		<div class="sortie-rappel" id="sortie-rappel" hidden={!rappelVisible}>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				style="flex:none;margin-top:1px"><path d="M6 3h7v7M13 3L4 12" /></svg
			>
			<div style="flex:1">
				<b>Ces liens mènent hors de Codicillus.</b> Ils s'ouvrent dans un nouvel onglet : votre
				lecture en cours n'est pas perdue. Les sites externes ne sont pas maintenus
				{nomOrganisation === '' ? 'par cette instance' : `par ${nomOrganisation}`} et peuvent avoir changé
				depuis leur enregistrement.
			</div>
			<button
				class="sortie-rappel__fermer"
				id="fermer-rappel"
				aria-label="Ne plus afficher ce rappel"
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
				>
			</button>
		</div>

		<div class="liste-signets" id="liste">
			{#if !base.length}
				<div class="vide-signets">
					<h2>Aucun signet dans ce domaine</h2>
					<p>
						Un signet est un lien web que l'équipe veut retrouver : documentation d'éditeur, page
						d'état d'un fournisseur, portail de prestataire. Le premier prend quinze secondes à
						enregistrer.
					</p>
					<!-- P-09 · ARB-040 — omise, jamais masquée. `V-22:2915` -->
					{#if ecriture}<button class="btn btn--principal si-ecriture"
							>Ajouter le premier signet</button
						>{/if}
				</div>
			{:else if !filtrees.length}
				<!-- L'état « aucun résultat » du gel, `V-22:2923-2937` : il dit combien
					     le domaine en contient, et rend la sortie du filtre. -->
				<div class="vide-signets">
					<h2>Aucun signet ne correspond à ces filtres</h2>
					<p>
						{'Ce domaine en contient ' +
							base.length +
							', mais aucun ne réunit les conditions retenues.'}
					</p>
					<button class="btn btn--principal" type="button">Réinitialiser les filtres</button>
				</div>
			{:else}
				{#each filtrees as n (n.id)}{@render carteSignet(n)}{/each}
			{/if}
		</div>
	{/snippet}
</Coquille>
