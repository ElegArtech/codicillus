<script lang="ts">
	/**
	 * V-12 — Liste des notes d'un domaine. Route
	 * `/univers/{univers}/{domaine}/notes` (`docs/routes.md` §3.3).
	 *
	 * L'ADRESSE EST CELLE DU GABARIT, PROLONGÉE — `$lib/rangement/adresses`,
	 * `adresseDesNotesDuDomaine()`. P-9 a écrit la forme canonique
	 * `/univers/{u}/{d}` ; ce lot la prolonge en `/notes`, `/signets` et
	 * `/signets/nouveau`. La forme raccourcie `/domaines/…` n'existe pas
	 * (ARB-001) et la clause de désambiguïsation de `RG-M03-02` reste **sans
	 * objet** (E-09) : elle ne doit jamais être implémentée.
	 *
	 * CHAQUE LIGNE DE LA LISTE PORTE L'ADRESSE RÉELLE DE SA NOTE — `ligneCarte`
	 * la compose par `adresseDeNote()`, la fabrique unique de `docs/routes.md`.
	 * ARB-013 est donc tenu. Le gel écrivait `href="#"` faute de serveur ; le
	 * constat de P-9 qui le reconduisait porte sur l'instrument de comparaison,
	 * pas sur le produit, et il ne vaut plus pour cette vue.
	 *
	 * SEPT ÉTATS — `verif/scenarios/V-12.json`. Trois axes, vecteur complet :
	 * domaine × arrivée × état. Deux doublons déclarés (`arr-tout` et
	 * `etat-nominal` sont `identiqueA` `dom-infrastructure`).
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1. `<main class="liste-vue"
	 * id="contenu">` (ARB-015) ; lien d'évitement `#liste` « Aller à la liste »
	 * (ARB-019) ; chemin courant du rail `[nom du domaine]`, ce qui déplie et
	 * met en évidence le nœud homonyme.
	 *
	 * `data-etat` N'EST POSÉ QUE PAR L'ÉTAT « DOMAINE SANS NOTE », et c'est le
	 * gel : la planche n'écrit l'attribut que lorsqu'un `change` est émis, et le
	 * mode démo n'en émet aucun sur une position déjà cochée
	 * (le module de service du banc, `scriptDEtat`). Aucune règle de la feuille ne
	 * le lit — seul le script de planche l'interroge. Poser l'attribut sur les
	 * six autres états serait rendre ce que la maquette ne rend pas.
	 *
	 * LE MOTEUR DE FACETTES N'EST PAS FACTORISÉ AVEC V-22, ET C'EST DÉLIBÉRÉ.
	 * Les deux vues partagent dix-neuf classes — `.barre-outils`, `.fac-menu*`,
	 * `.filtres-barre`, `.tete*` —, ce qui a fait ce lot (`docs/releve-vues.md`
	 * §8.1). Mais `docs/DESIGN.md` §2.H recense soixante-six noms de classe à
	 * DÉFINITIONS DIVERGENTES selon la vue, dont cinq de cette famille
	 * (`.facettes`, `.reglages`, `.val`, `.tri`, `.actifs` — R-11 du relevé) :
	 * chaque vue porte sa définition, par P-6.3, et la collision est de NOM, pas
	 * d'objet. Factoriser au-delà de ce que le relevé mesure comme partagé est
	 * l'endroit exact où un lot pressé casserait deux vues en croyant en
	 * simplifier une. Les définitions de facettes diffèrent d'ailleurs
	 * réellement : six ici, deux en V-22.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : compteur, comptes de facettes,
	 * consultations et anciennetés sortent des propriétés servies.
	 *
	 * LA FRAÎCHEUR VIENT DE LA FABRIQUE UNIQUE (P-01, ADR-005) —
	 * `$lib/fraicheur`. Aucun seuil, aucun libellé, aucun compte de barres n'est
	 * recalculé ici.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : le squelette rend l'état,
	 * jamais la transition. Les menus de facettes sont donc rendus fermés — le
	 * gel ne pose `data-ouvert` qu'au clic.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-12.css`, posé par `node verif/feuilles-de-vue.mjs V-12
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import type { Domaine, IdentifiantNote, Note, Univers } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { adresseDeNote } from '$lib/rangement/adresses';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	interface Proprietes {
		/** Le vecteur complet de l'état — domaine × arrivée × état. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-12')`, variante « lecture ». */
		notes: readonly Note[];
		/**
		 * LE RANGEMENT ET L'IDENTITÉ — plus aucun défaut tiré du jeu.
		 *
		 * Ces propriétés ont eu pour défaut `UNIVERS`, `DOMAINES`, `MOI` et
		 * `INSTANCE` de `seeds/corpus.ts` : une route qui oubliait d'en passer une
		 * servait le contexte du jeu de démonstration quelle que fût l'identité de
		 * l'appelant, et rien ne protestait.
		 *
		 * `domaines` EST REQUISE — la route la passe, et le compilateur garde
		 * désormais la porte. `univers` peut légitimement être vide : en forme
		 * abrégée, le rail est écrit au balisage et ne s'en déduit pas ; son état
		 * vide est le tableau vide. `compte` peut manquer, et son état vide est
		 * `null` : la barre supérieure n'annonce alors personne.
		 *
		 * `instance` A DISPARU. Elle ne servait qu'à la version du pied de rail,
		 * que le contexte de coquille sert depuis `package.json` — la vraie, pas
		 * le `1.0.0` du jeu.
		 */
		univers?: readonly Univers[];
		domaines: readonly Domaine[];
		compte?: CompteAffiche | null;
		/**
		 * LES VALEURS DE FACETTE RETENUES, telles que L'ADRESSE les porte.
		 *
		 * Les six facettes du gel étaient inertes : cliquer « Type » n'ouvrait
		 * rien, cocher une valeur ne filtrait rien. Elles sont désormais
		 * gouvernées par l'adresse — même régime que `/recherche`, et pour la même
		 * raison : un état de filtrage se partage par son adresse.
		 *
		 * ABSENTE, la vue garde la dérivation du gel — les valeurs que l'arrivée
		 * pose elle-même —, et le rendu ne bouge pas d'un octet.
		 */
		retenues?: Record<string, readonly string[]>;
		/**
		 * L'ORDRE DEMANDÉ. Les quatre valeurs sont celles des `option` du gel :
		 * `modification`, `verification`, `consultations`, `alpha`. Absente,
		 * l'ordre est celui que le gel applique — l'ancienneté de modification.
		 */
		tri?: string;
		/**
		 * L'ANCIENNETÉ DE MODIFICATION DE CHAQUE NOTE — `window.modifJours` du gel.
		 *
		 * `Partial` ET NON `Record` TOTAL, et c'est une exigence de P-02 : un
		 * type total réclamerait les trente-deux clés, ce qui interdirait
		 * mécaniquement à un chargeur de passer un état PARTIEL ou NEUTRE. Une
		 * note absente de la table s'affiche « date de modification inconnue »,
		 * jamais une ancienneté inventée.
		 */
		modifications: Partial<Record<IdentifiantNote, number>>;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines,
		compte = null,
		retenues = undefined,
		tri = undefined,
		modifications
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const vide = $derived(reglage['etat'] === 'vide');
	const arrivee = $derived(String(reglage['arr'] ?? 'tout'));

	/**
	 * AUCUN DOMAINE — l'état vide, écrit plutôt que subi. La liste servie ne peut
	 * pas être vide sur cette route : le chargeur résout le domaine de l'adresse
	 * avant d'ouvrir l'écran. Le repli est là pour que la propriété soit honnête
	 * sur toute sa forme — un tableau vide rendait `domaines[0].nom` et sortait
	 * en 500.
	 */
	const AUCUN_DOMAINE: Domaine = { nom: '', univers: '', couleur: '' };

	const courant = $derived(
		domaines.find((d) => d.nom === reglage['dom']) ?? domaines[0] ?? AUCUN_DOMAINE
	);

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — LE DOMAINE COURANT, ET LUI SEUL.
	 *
	 * Le gel en marquait DEUX : `coquille()` de la maquette AJOUTE la marque
	 * `noeud--courant` et ne la retire jamais (`V-12:1827`), si bien que la
	 * planche rendait d'abord « Infrastructure » — le domaine que son scénario
	 * charge — puis ajoutait le domaine visité sans effacer le premier. La vue
	 * recopiait ce comportement, et donc le NOM D'UN DOMAINE DU JEU DE
	 * DÉMONSTRATION, écrit en dur.
	 *
	 * Une liste de notes n'a qu'un domaine courant. C'était déjà écrit ici, sous
	 * la forme d'une dette assumée au banc ; le banc a été supprimé.
	 */
	const railCourant = $derived([courant.nom]);

	/** Les notes du domaine — vides quand la planche demande « domaine sans note ». */
	const base = $derived(vide ? [] : corpus.filter((n) => n.domaine === courant.nom));

	/* ═════════════════════════════════════════════════════════════════════
	   LES FACETTES — le calque du moteur du gel, réduit à ce qu'un rendu
	   d'état demande.

	   Le gel écrit un moteur interactif (`creerFacettes`) ; ce qui en est
	   observable dans un état est un ÉTAT DE SÉLECTION et son rendu. Les
	   trois règles qui décident du rendu sont reprises à la lettre :

	     1. le compte affiché en regard d'une valeur est le nombre de résultats
	        obtenus SI cette valeur était retenue, les autres facettes restant
	        appliquées ;
	     2. les valeurs sont triées par compte décroissant, puis par ordre
	        alphabétique français ;
	     3. une valeur retenue mais absente du compte est ajoutée en queue, et
	        s'affiche en retrait (`data-vide="oui"`) plutôt que de disparaître —
	        sa disparition ferait croire à un défaut d'affichage.
	   ═════════════════════════════════════════════════════════════════════ */

	interface DefinitionDeFacette {
		readonly id: string;
		readonly nom: string;
		readonly cle: (n: Note) => readonly string[];
		readonly prefixe?: string;
	}

	/** Les six facettes du brief. Ni univers ni domaine : on est déjà dans un domaine. */
	const FACETTES: readonly DefinitionDeFacette[] = [
		{ id: 'type', nom: 'Type', cle: (n) => [n.type] },
		{
			id: 'fraicheur',
			nom: 'Fraîcheur',
			cle: (n) => [{ frais: 'Frais', vieil: 'Vieillissant', obs: 'Obsolète probable' }[n.fraicheur]]
		},
		{ id: 'statut', nom: 'Statut', cle: (n) => [n.brouillon ? 'Brouillon' : 'Publiée'] },
		{ id: 'dossier', nom: 'Dossier', cle: (n) => [n.dossier] },
		{ id: 'auteur', nom: 'Auteur', cle: (n) => [n.auteur] },
		{ id: 'etiquette', nom: 'Étiquette', cle: (n) => n.etiquettes, prefixe: '#' }
	];

	/**
	 * LES VALEURS RETENUES À L'ARRIVÉE — le gel les pose lui-même.
	 *
	 * « Arrivée depuis un segment de barre de fraîcheur ou un indicateur de
	 * l'accueil : la liste s'ouvre déjà filtrée, et le filtre est visible et
	 * retirable comme n'importe quel autre » (`V-12:2303`). Ce n'est donc pas
	 * un pré-réglage de maquette : c'est le comportement de la vue.
	 */
	const choisis = $derived<Record<string, readonly string[]>>(
		retenues ??
			(arrivee === 'obsolete'
				? { fraicheur: ['Obsolète probable'] }
				: arrivee === 'brouillon'
					? { statut: ['Brouillon'] }
					: {})
	);

	/** Un résultat passe chaque facette ayant au moins une valeur retenue ; à
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
		const retenues = choisis[f.id] ?? [];
		for (const v of retenues) if (!ordonnees.includes(v)) ordonnees.push(v);
		return {
			id: f.id,
			nom: f.nom,
			prefixe: f.prefixe ?? '',
			retenues: retenues.length,
			valeurs: ordonnees.map((valeur) => ({
				valeur,
				compte: comptes[valeur] ?? 0,
				retenue: retenues.includes(valeur)
			}))
		};
	}

	/** Seules les facettes qui ont au moins une valeur sont rendues. */
	const facettes = $derived(FACETTES.map(facetteRendue).filter((f) => f.valeurs.length > 0));

	/** Les jetons de filtre actif, dans l'ordre de déclaration des facettes. */
	const filtresActifs = $derived(
		FACETTES.flatMap((f) =>
			(choisis[f.id] ?? []).map((valeur) => ({
				nom: f.nom,
				valeur,
				etiquette: (f.prefixe ?? '') + valeur
			}))
		)
	);

	/* ═════════════════════════════════════════════════════════════════════
	   TRI — le réglage par défaut du gel, et lui seul.

	   `<select id="tri">` n'a pas d'option `selected` : sa valeur au
	   chargement est la première, « Date de modification ». Aucun état de
	   `verif/scenarios/V-12.json` ne la dévie ; les trois autres tris sont du
	   comportement, donc du temps 3.
	   ═════════════════════════════════════════════════════════════════════ */
	function ancienneteDeModification(n: Note): number {
		return modifications[n.id] ?? 999;
	}

	/**
	 * L'ORDRE DEMANDÉ — les quatre que le gel offre, et pas un de plus.
	 *
	 * Les comparaisons sont celles de `mockups/V-12-liste-notes.html:2117-2124`,
	 * reprises telles quelles : trier par ancienneté croissante, c'est trier par
	 * date décroissante. Une valeur inconnue retombe sur l'ordre du gel plutôt
	 * que de refuser — un paramètre d'adresse ne se refuse pas, il s'ignore.
	 */
	function comparer(a: Note, b: Note): number {
		if (tri === 'alpha') return a.titre.localeCompare(b.titre, 'fr');
		if (tri === 'consultations') return b.vues - a.vues;
		if (tri === 'verification') return a.jours - b.jours;
		return ancienneteDeModification(a) - ancienneteDeModification(b);
	}

	const filtrees = $derived(
		base
			.filter((n) => passe(n))
			.slice()
			.sort(comparer)
	);

	/** Nombre en français — `x.toLocaleString("fr-FR")` du gel. */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/** Le compteur de tête : « N notes », ou « N sur M notes » quand un filtre mord. */
	const compteur = $derived(
		filtrees.length === base.length
			? ` ${accord(base.length, 'note')}`
			: ` sur ${nb(base.length)} ${accord(base.length, 'note')}`
	);

	/** L'ancienneté de modification en clair — `window.modifJours` du gel. */
	function modifiee(n: Note): string {
		const j = modifications[n.id];
		if (typeof j !== 'number') return 'date de modification inconnue';
		if (j <= 0) return "modifiée aujourd'hui";
		return j === 1 ? 'modifiée hier' : `modifiée il y a ${j} jours`;
	}

	/** Le libellé de pastille de type : une fiche annonce son type de fiche. */
	function libelleDeType(n: Note): string {
		return n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type;
	}
</script>

<!--
	`svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE, ET LA RAISON EST LA MÊME QUE POUR LE FIL D'ARIANE DE LA COQUILLE.

	La règle veille à ce qu'une adresse interne passe par `resolve()` de
	SvelteKit. Les adresses de cette vue sont COMPOSÉES par
	`$lib/rangement/adresses.ts`, la fabrique unique du rangement : la règle
	inspecte l'EXPRESSION du `href`, elle ne peut pas la suivre jusque là, et
	elle ne peut pas non plus la vérifier ici. Faire passer une adresse déjà
	composée par `resolve()` ne prouverait rien de plus et ajouterait une
	seconde source de vérité pour une forme qui n'en a qu'une.

	Même geste, même justification qu'en V-03, V-22, V-24 et
	`src/lib/coquille/BarreSuperieure.svelte`.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!--
	Le témoin de fraîcheur — la fabrique unique de `$lib/fraicheur` (P-01). Le
	libellé accompagne TOUJOURS la jauge : l'information ne passe jamais par la
	couleur seule (RG-M18-09).
-->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!--
	AUCUN BLANC ENTRE LES NŒUDS DE LA LIGNE-CARTE, et il doit le rester : le
	relevé d'ordre de tabulation du niveau 1 construit le nom accessible sur
	`textContent`, où un blanc inséré par le formateur se voit (CLAUDE.md §6,
	P-6). Le bloc est protégé du formateur ; ne jamais citer la forme exacte de
	la directive à l'intérieur d'un commentaire (P-9).

	UNE NOTE RANGÉE À LA RACINE DU DOMAINE N'A PAS DE CHEMIN DE DOSSIER : le
	chevron et son séparateur sont alors omis. Les rendre laissait « ▸ · » seul
	sur chaque ligne.
-->
<!-- prettier-ignore -->
{#snippet ligneCarte(n: Note)}<a class="lc" href={adresseDeNote(n.id)}><div class="lc__haut"><h2 class="lc__titre">{n.titre}</h2><span class="past past--type">{libelleDeType(n)}</span>{#if n.brouillon}<span class="past past--brouillon">Brouillon</span>{/if}</div><p class="lc__extrait">{n.extrait}</p><div class="lc__meta">{#if n.dossier}<span class="lc__dossier">{'▸ ' + n.dossier}</span><span class="sep">·</span>{/if}<span>{n.auteur}</span><span class="sep">·</span><span>{modifiee(n)}</span></div><div class="lc__etiquettes">{#each n.etiquettes.slice(0, 4) as e (e)}<span class="past past--etiquette">{e}</span>{/each}</div><div class="lc__droite">{@render temoin(n)}<span class="lc__vues">{nb(n.vues) + ' ' + accord(n.vues, 'consultation')}</span></div></a>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="liste-vue"
	cibleEvitement="liste"
	libelleEvitement="Aller à la liste"
	fil={['Accueil', courant.univers, courant.nom, 'Notes']}
	courant={railCourant}
	droits="ecriture"
	donnees={{ 'data-filtres': 'ferme', 'data-etat': vide ? 'vide' : undefined }}
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
				<h1 id="titre">{'Notes de ' + courant.nom}</h1>
			</div>
			<div style="display:flex;align-items:center;gap:var(--e-3);flex-wrap:wrap">
				<!-- prettier-ignore -->
				<span class="tete__compteur" id="compteur">{#if base.length}<b>{nb(filtrees.length)}</b>{compteur}{/if}</span>
				<button class="btn btn--principal si-ecriture" id="creer">
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
			</div>
		</header>

		<div class="barre-outils">
			<div class="filtres-barre" id="facettes">
				{#each facettes as f (f.id)}
					<!-- LE MENU DIT QUELLE FACETTE IL PORTE. Le câblage l'identifiait par
					     son RANG, et une facette sans aucune valeur n'est pas rendue :
					     le rang se décalait alors et cocher une valeur écrivait la clé
					     d'adresse de la facette voisine. -->
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
			<div class="reglages-droite">
				<button class="btn bouton-filtres" id="ouvrir-filtres">
					Filtrer <span class="compte-filtres" id="compte-filtres" hidden={!filtresActifs.length}
						>{filtresActifs.length}</span
					>
				</button>
				<div class="tri">
					<label class="etiq" for="tri">Trier par</label>
					<select id="tri">
						<option value="modification" selected={tri === undefined || tri === 'modification'}
							>Date de modification</option
						>
						<option value="verification" selected={tri === 'verification'}
							>Date de vérification</option
						>
						<option value="consultations" selected={tri === 'consultations'}>Consultations</option>
						<option value="alpha" selected={tri === 'alpha'}>Alphabétique</option>
					</select>
				</div>
				<div class="densite" role="group" aria-label="Densité d'affichage">
					<button
						type="button"
						data-densite="confort"
						aria-pressed="true"
						aria-label="Affichage confortable"
						title="Confortable"
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M2 3.5h12M2 8h12M2 12.5h12" /></svg
						>
					</button>
					<button
						type="button"
						data-densite="compact"
						aria-pressed="false"
						aria-label="Affichage compact"
						title="Compact"
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M2 2.5h12M2 5.8h12M2 9.2h12M2 12.5h12" /></svg
						>
					</button>
				</div>
			</div>
		</div>

		<div class="actifs" id="actifs">
			<!-- prettier-ignore -->
			{#each filtresActifs as f, rang (rang)}<span class="filtre"><span><b>{f.nom + ' : '}</b>{f.etiquette}</span><button type="button" aria-label={'Retirer le filtre ' + f.nom + ' ' + f.valeur}><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></span>{/each}{#if filtresActifs.length}<button
					class="actifs__vider"
					type="button">Tout effacer</button
				>{/if}
		</div>

		<div class="liste" id="liste" data-densite="confort">
			{#if !base.length}
				<div class="vide-liste">
					<h2>Ce domaine ne contient aucune note</h2>
					<p>
						L'espace existe, il attend son contenu. Reprendre ce qui est déjà écrit ailleurs va plus
						vite que de repartir d'une page blanche.
					</p>
					<div class="vide-liste__actions">
						<button class="btn btn--principal si-ecriture">Importer dans ce domaine</button>
						<button class="btn si-ecriture">Créer la première note</button>
					</div>
				</div>
			{:else if !filtrees.length}
				<div class="vide-liste">
					<h2>Aucune note ne correspond à ces filtres</h2>
					<p>
						{'Le domaine contient ' +
							nb(base.length) +
							' notes, mais aucune ne réunit toutes les conditions retenues. Retirez un filtre pour élargir.'}
					</p>
					<div class="vide-liste__actions">
						<button class="btn btn--principal">Réinitialiser les filtres</button>
					</div>
				</div>
			{:else}
				{#each filtrees as n (n.id)}{@render ligneCarte(n)}{/each}
			{/if}
		</div>
	{/snippet}
</Coquille>
