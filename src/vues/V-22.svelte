<script lang="ts">
	/**
	 * V-22 — Signets d'un domaine. Route `/univers/{univers}/{domaine}/signets`
	 * (`docs/routes.md` §3.3), atteinte par l'entrée de rail « Outils › Signets ».
	 *
	 * L'ADRESSE EST CELLE DU GABARIT, PROLONGÉE — `$lib/rangement/adresses`,
	 * `adresseDesSignetsDuDomaine()`. `signets` est un identifiant réservé sous
	 * `/univers/{u}/{d}/` (§5.4). La forme raccourcie `/domaines/…` n'existe pas
	 * (ARB-001), et la clause de désambiguïsation de `RG-M03-02` reste **sans
	 * objet** (E-09) : à ne jamais implémenter.
	 *
	 * UN SIGNET EST UNE NOTE DE TYPE « Signet », pas un objet séparé — c'est le
	 * vocabulaire contractuel (`CLAUDE.md` §3), et c'est ce que porte
	 * `seeds/corpus.ts` : `type === 'Signet'`, plus `url` et `ajoute`. Le mot
	 * « lien » ne désigne ici que la cible externe, jamais l'objet du produit.
	 *
	 * LES LIENS DE SIGNET PORTENT LEUR ADRESSE RÉELLE, et c'est le gel : ce sont
	 * des adresses EXTERNES, écrites au corpus, pas des `href="#"` de maquette.
	 * Les liens INTERNES, eux, restent ceux du gel — voir l'en-tête de
	 * `V-12.svelte` et le constat reconduit de P-9 sur ARB-013.
	 *
	 * SIX ÉTATS — `verif/scenarios/V-22.json`. Trois axes, vecteur complet :
	 * domaine × droits × rappel de sortie. Un doublon déclaré
	 * (`droits-ecriture` est `identiqueA` `dom-infrastructure`).
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1. `<main class="signets-vue"
	 * id="contenu">` (ARB-015) ; lien d'évitement `#liste` « Aller à la liste »
	 * (ARB-019) ; chemin courant du rail `[nom du domaine]`.
	 *
	 * `dialog#dlg-supprimer` N'EST PAS RENDU, et c'est déclaré. Il est FERMÉ à
	 * l'état par défaut, et aucun des six états ne l'ouvre : un `<dialog>` fermé
	 * ne porte aucune boîte de rendu et n'entre pas dans l'instantané ARIA
	 * (`docs/releve-vues.md` §4.1, colonne « rendu », qui est physique et
	 * déterministe). La divergence de balisage est MESURÉE NULLE. La
	 * confirmation de suppression relève du lot de logique.
	 *
	 * LE MOTEUR DE FACETTES N'EST PAS FACTORISÉ AVEC V-12, ET C'EST DÉLIBÉRÉ —
	 * `docs/DESIGN.md` §2.H, R-11 du relevé. Voir l'en-tête de `V-12.svelte` :
	 * les deux vues partagent dix-neuf classes, mais cinq d'entre elles
	 * (`.facettes`, `.reglages`, `.val`, `.tri`, `.actifs`) ont des définitions
	 * DIVERGENTES selon la vue, chacune portée par sa propre feuille (P-6.3).
	 * Les définitions de facettes diffèrent elles aussi : deux ici, six en V-12.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : compteur, comptes de facettes et dates
	 * sortent de `seeds/corpus.ts`.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-22.css`, posé par `node verif/feuilles-de-vue.mjs V-22
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import { DOMAINES, INSTANCE, MOI, UNIVERS, type Domaine, type Note } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';

	interface Proprietes {
		/** Le vecteur complet de l'état — domaine × droits × rappel. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-22')`, variante « complète ». */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const droits = $derived(reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture');
	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE les actions d'écriture puis les cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-22-signets.html:339`) : faute de serveur, une maquette statique
	 * n'a pas d'autre moyen de dire « cette action n'existe pas pour ce rôle ».
	 * Le produit peut ne pas l'émettre, et P-09 l'exige — « ni grisée, NI
	 * MASQUÉE ». La classe reste posée sur les nœuds rendus.
	 * Énumération : `verif/rapports/omissions-p09.md`.
	 */
	const ecriture = $derived(droits !== 'lecture');
	/** Le rappel de sortie est une case de planche : cochée par défaut. */
	const rappelDemande = $derived(reglage['c-rappel'] !== false);

	const courant = $derived(
		(DOMAINES.find((d) => d.nom === reglage['dom']) ?? DOMAINES[0]) as Domaine
	);

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — DEUX DOMAINES, ET C'EST UN FAIT DU GEL.
	 *
	 * `coquille()` de la maquette AJOUTE la marque `noeud--courant` et ne la
	 * retire jamais (`V-22:2493`) : la planche rend d'abord `Infrastructure` —
	 * `changerDomaine("Infrastructure")` au chargement, `V-22:3232` —, puis le
	 * changement de position ajoute le second domaine sans effacer le premier.
	 * Même jurisprudence que V-11 et V-12, même cause, mesurée sur ce lot.
	 * « Corriger » le gel serait un comblement, et il serait rouge au banc.
	 */
	const DOMAINE_INITIAL = 'Infrastructure';
	const railCourant = $derived(
		courant.nom === DOMAINE_INITIAL ? [courant.nom] : [DOMAINE_INITIAL, courant.nom]
	);

	/**
	 * LES SIGNETS DU DOMAINE — `window.signetsDe` du gel, à la lettre : les
	 * notes de type « Signet » du domaine, triées par ancienneté de vérification
	 * CROISSANTE. Le tri est celui du gel, il n'est pas rejoué ici.
	 */
	const base = $derived(
		corpus
			.filter((n) => n.type === 'Signet' && n.domaine === courant.nom)
			.slice()
			.sort((a, b) => (a.jours || 0) - (b.jours || 0))
	);

	/* ═════════════════════════════════════════════════════════════════════
	   LES FACETTES — deux ici, et le même calque de moteur qu'en V-12 : le
	   compte affiché en regard d'une valeur est le nombre de résultats obtenus
	   si cette valeur était retenue, les autres facettes restant appliquées ;
	   les valeurs sont triées par compte décroissant puis alphabétiquement.

	   AUCUN ÉTAT DE V-22 NE RETIENT DE VALEUR : la planche n'a pas d'axe
	   « arrivée », contrairement à V-12. Les jetons de filtre actif et le
	   bouton « Tout effacer » relèvent donc du lot de logique ; `.actifs` reste
	   vide, et `.actifs:empty { display: none }` le fait disparaître.
	   ═════════════════════════════════════════════════════════════════════ */

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

	interface ValeurDeFacette {
		readonly valeur: string;
		readonly compte: number;
	}

	interface FacetteRendue {
		readonly id: string;
		readonly nom: string;
		readonly prefixe: string;
		readonly valeurs: readonly ValeurDeFacette[];
	}

	function facetteRendue(f: DefinitionDeFacette): FacetteRendue {
		const comptes: Record<string, number> = {};
		for (const n of base) {
			for (const v of f.cle(n)) if (v) comptes[v] = (comptes[v] ?? 0) + 1;
		}
		const ordonnees = Object.keys(comptes).sort(
			(a, b) => (comptes[b] ?? 0) - (comptes[a] ?? 0) || a.localeCompare(b, 'fr')
		);
		return {
			id: f.id,
			nom: f.nom,
			prefixe: f.prefixe ?? '',
			valeurs: ordonnees.map((valeur) => ({ valeur, compte: comptes[valeur] ?? 0 }))
		};
	}

	const facettes = $derived(FACETTES.map(facetteRendue).filter((f) => f.valeurs.length > 0));

	/* ═════════════════════════════════════════════════════════════════════
	   L'ADRESSE EXTERNE, LUE COMME LE GEL LA LIT

	   `window.hoteDe` et `window.cheminDe` : c'est le NOM D'HÔTE qu'on montre,
	   pas l'adresse complète — « un lecteur reconnaît un site à son nom de
	   domaine ». Les deux fonctions sont recopiées à la lettre, protocole et
	   `www.` retirés.

	   Elles ne vont PAS dans `$lib/rangement/adresses` : ce module compose les
	   adresses INTERNES du produit, celles de `docs/routes.md`. Une adresse de
	   signet est une donnée du corpus, saisie par un contributeur, et lui
	   appliquer le gabarit de rangement mélangerait deux espaces de noms.
	   ═════════════════════════════════════════════════════════════════════ */
	function hoteDe(url: string): string {
		// `split` rend toujours au moins un morceau ; le repli est là pour le
		// typage strict, jamais pour un cas réel.
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

	/** Le chemin affiché, tronqué au-delà de 42 caractères. */
	function cheminAffiche(url: string): string {
		const chemin = cheminDe(url);
		return chemin.length > 42 ? chemin.slice(0, 41) + '…' : chemin;
	}

	/** Le compteur de tête. Aucun filtre n'étant retenu, il dit le total. */
	const compteur = $derived(base.length > 1 ? ' signets' : ' signet');

	/**
	 * LE RAPPEL DE SORTIE — RG-M11-02. Il ne s'affiche que si le domaine porte
	 * au moins un signet : un rappel sur une liste vide n'avertit de rien.
	 */
	const rappelVisible = $derived(base.length > 0 && rappelDemande);
</script>

<!--
	AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE DE SIGNET, et il doit le rester : le
	relevé d'ordre de tabulation du niveau 1 construit le nom accessible sur
	`textContent`, où un blanc inséré par le formateur se voit (CLAUDE.md §6,
	P-6). Le bloc est protégé du formateur ; ne jamais citer la forme exacte de
	la directive à l'intérieur d'un commentaire (P-9).

	`target="_blank"` et `rel="noopener noreferrer"` sont ceux du gel : un signet
	s'ouvre dans un nouvel onglet, « votre lecture en cours n'est pas perdue ».
	L'intitulé accessible dit explicitement qu'on quitte le produit.
-->
<!--
	`svelte/no-navigation-without-resolve` EST DÉSACTIVÉE ICI, ET SEULEMENT ICI.
	La règle veille à ce qu'une adresse INTERNE passe par `resolve()` de
	SvelteKit ; `n.url` est une adresse EXTERNE, écrite au corpus, hors de tout
	espace de routes du produit. La résoudre serait une faute, pas une
	précaution. Les adresses internes du produit, elles, passent par
	`$lib/rangement/adresses`.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!-- prettier-ignore -->
{#snippet carteSignet(n: Note)}<article class="sig"><span class="sig__sceau" aria-hidden="true">{monogramme(n.url ?? '')}</span><div style="min-width:0"><a class="sig__titre" href={n.url} target="_blank" rel="noopener noreferrer" aria-label={n.titre + " — site externe, s'ouvre dans un nouvel onglet"}>{n.titre}</a><div class="sig__adresse"><span class="sig__hote">{hoteDe(n.url ?? '')}</span>{#if cheminAffiche(n.url ?? '')}<span class="sig__chemin">{cheminAffiche(n.url ?? '')}</span>{/if}<span class="sig__sortie"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h7v7M13 3L4 12"/></svg>site externe</span></div></div>{#if ecriture}<div class="sig__actions si-ecriture"><button class="btn" type="button">Modifier</button><button class="btn btn--destructif" type="button" aria-label={'Supprimer le signet ' + n.titre}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"/></svg></button></div>{/if}<p class="sig__desc">{n.extrait}</p><div class="sig__pied"><span class="sig__etq">{#each n.etiquettes as e (e)}<span class="past past--etiquette">{e}</span>{/each}</span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{'ajouté le ' + (n.ajoute ?? n.revise)}</span></div></article>{/snippet}
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<Coquille
	forme="abregee"
	classeContenu="signets-vue"
	cibleEvitement="liste"
	libelleEvitement="Aller à la liste"
	fil={['Accueil', courant.univers, courant.nom, 'Signets']}
	courant={railCourant}
	{droits}
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
				<span class="tete__compteur" id="compteur">{#if base.length}<b>{base.length}</b>{compteur}{/if}</span>
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
					<div class="fac-menu">
						<!-- prettier-ignore -->
						<button type="button" class="fac-menu__bouton" aria-expanded="false">{f.nom}<span><svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3l4 4 4-4z"/></svg></span></button>
						<div class="fac-menu__panneau">
							<div class="facette__corps">
								<!-- prettier-ignore -->
								{#each f.valeurs as v (v.valeur)}<label class="val"><input type="checkbox"><span class="val__nom">{f.prefixe + v.valeur}</span><span class="val__n">{v.compte}</span></label>{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="actifs" id="actifs"></div>

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
				<b>Ces liens mènent hors de Codicillus.</b> Ils s'ouvrent dans un nouvel onglet : votre lecture
				en cours n'est pas perdue. Les sites externes ne sont pas maintenus par la direction technique
				et peuvent avoir changé depuis leur enregistrement.
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
			{:else}
				{#each base as n (n.id)}{@render carteSignet(n)}{/each}
			{/if}
		</div>
	{/snippet}
</Coquille>
