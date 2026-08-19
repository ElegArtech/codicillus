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
	 * LES LIENS RESTENT CEUX DU GEL — `href="#"`. ARB-013 devait permettre
	 * l'adresse réelle ; mesuré par P-9, le filtre de `verif/banc/capture.mjs`
	 * ne retire pas les lignes `/url:` de l'instantané ARIA, et l'instrument est
	 * en écriture humaine seule. Le constat est reconduit ici, pas rouvert.
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
	 * (`verif/banc/mode-demo.mjs`, `scriptDEtat`). Aucune règle de la feuille ne
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
	 * consultations et anciennetés sortent de `seeds/corpus.ts`.
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
	import {
		DOMAINES,
		INSTANCE,
		MODIFICATIONS,
		MOI,
		UNIVERS,
		type Domaine,
		type Note
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { motFiche } from '$lib/vocabulaire';

	interface Proprietes {
		/** Le vecteur complet de l'état — domaine × arrivée × état. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-12')`, variante « lecture ». */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const vide = $derived(reglage['etat'] === 'vide');
	const arrivee = $derived(String(reglage['arr'] ?? 'tout'));

	const courant = $derived(
		(DOMAINES.find((d) => d.nom === reglage['dom']) ?? DOMAINES[0]) as Domaine
	);

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — DEUX DOMAINES, ET C'EST UN FAIT DU GEL.
	 *
	 * `coquille()` de la maquette AJOUTE la marque `noeud--courant` et ne la
	 * retire jamais (`V-12:1827`) : la planche rend d'abord `Infrastructure` —
	 * `changerDomaine("Infrastructure")` au chargement, `V-12:2574` —, puis le
	 * changement de position ajoute le second domaine sans effacer le premier.
	 *
	 * MESURÉ, page stabilisée dans les conditions du banc, pas déduit : ne pas
	 * le reproduire coûte **6 903 pixels** sur `dom-poste-de-travail`, seul état
	 * qui dévie le domaine. C'est le chiffre exact que P-9 a relevé sur V-11, et
	 * pour la même cause.
	 *
	 * CE N'EST PAS LE COMPORTEMENT DU PRODUIT, et le rapport de lot le déclare :
	 * une liste de notes n'a qu'un domaine courant. « Corriger » le gel serait
	 * un comblement, et il serait rouge au banc. La reprise appartient au lot de
	 * logique, avec l'arbitrage qui va avec.
	 */
	const DOMAINE_INITIAL = 'Infrastructure';
	const railCourant = $derived(
		courant.nom === DOMAINE_INITIAL ? [courant.nom] : [DOMAINE_INITIAL, courant.nom]
	);

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
		arrivee === 'obsolete'
			? { fraicheur: ['Obsolète probable'] }
			: arrivee === 'brouillon'
				? { statut: ['Brouillon'] }
				: {}
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
		return MODIFICATIONS[n.id] ?? 999;
	}

	const filtrees = $derived(
		base
			.filter((n) => passe(n))
			.slice()
			.sort((a, b) => ancienneteDeModification(a) - ancienneteDeModification(b))
	);

	/** Nombre en français — `x.toLocaleString("fr-FR")` du gel. */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/** Le compteur de tête : « N notes », ou « N sur M notes » quand un filtre mord. */
	const compteur = $derived(
		filtrees.length === base.length
			? base.length > 1
				? ' notes'
				: ' note'
			: ` sur ${nb(base.length)}${base.length > 1 ? ' notes' : ' note'}`
	);

	/** L'ancienneté de modification en clair — `window.modifJours` du gel. */
	function modifiee(n: Note): string {
		const j = MODIFICATIONS[n.id];
		if (typeof j !== 'number') return 'date de modification inconnue';
		return j <= 1 ? 'modifiée hier' : `modifiée il y a ${j} jours`;
	}

	/** Le libellé de pastille de type : une fiche annonce son type de fiche. */
	function libelleDeType(n: Note): string {
		return n.type === 'Fiche' ? `${motFiche} ${n.typeFiche}` : n.type;
	}
</script>

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
-->
<!-- prettier-ignore -->
{#snippet ligneCarte(n: Note)}<a class="lc" href="#"><div class="lc__haut"><h2 class="lc__titre">{n.titre}</h2><span class="past past--type">{libelleDeType(n)}</span>{#if n.brouillon}<span class="past past--brouillon">Brouillon</span>{/if}</div><p class="lc__extrait">{n.extrait}</p><div class="lc__meta"><span class="lc__dossier">{'▸ ' + n.dossier}</span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{modifiee(n)}</span></div><div class="lc__etiquettes">{#each n.etiquettes.slice(0, 4) as e (e)}<span class="past past--etiquette">{e}</span>{/each}</div><div class="lc__droite">{@render temoin(n)}<span class="lc__vues">{nb(n.vues) + ' consultations'}</span></div></a>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="liste-vue"
	cibleEvitement="liste"
	libelleEvitement="Aller à la liste"
	fil={['Accueil', courant.univers, courant.nom, 'Notes']}
	courant={railCourant}
	droits="ecriture"
	donnees={{ 'data-filtres': 'ferme', 'data-etat': vide ? 'vide' : undefined }}
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
					<div class="fac-menu">
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
						<option value="modification">Date de modification</option>
						<option value="verification">Date de vérification</option>
						<option value="consultations">Consultations</option>
						<option value="alpha">Alphabétique</option>
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
