<script lang="ts">
	/**
	 * V-12 — Liste des notes d'un domaine. Route `/univers/{univers}/{domaine}/notes`
	 * (`docs/routes.md` §3.3).
	 *
	 * L'adresse est celle du gabarit, prolongée — `$lib/rangement/adresses`. La
	 * forme raccourcie `/domaines/…` n'existe pas (`ARB-001`) et la clause de
	 * désambiguïsation de `RG-M03-02` reste SANS OBJET : à ne jamais implémenter.
	 *
	 * CHAQUE LIGNE PORTE L'ADRESSE RÉELLE DE SA NOTE — `ligneCarte` la compose par
	 * `adresseDeNote()`, la fabrique unique. Le gel écrivait `href="#"` faute de
	 * serveur.
	 *
	 * Coquille de forme abrégée ; lien d'évitement `#liste` « Aller à la liste » ;
	 * chemin courant du rail `[nom du domaine]`.
	 *
	 * `data-etat` N'EST POSÉ QUE PAR L'ÉTAT « DOMAINE SANS NOTE », et c'est le gel :
	 * la planche n'écrit l'attribut que sur un `change`. Aucune règle de la feuille
	 * ne le lit ; le poser sur les autres états serait rendre ce que la maquette ne
	 * rend pas.
	 *
	 * LE MOTEUR DE FACETTES N'EST PAS FACTORISÉ AVEC V-22, ET C'EST DÉLIBÉRÉ. Les
	 * deux vues partagent dix-neuf classes, mais `docs/DESIGN.md` §2.H recense
	 * soixante-six noms de classe à DÉFINITIONS DIVERGENTES selon la vue, dont cinq
	 * de cette famille — `.facettes`, `.reglages`, `.val`, `.tri`, `.actifs`. La
	 * collision est de NOM, pas d'objet, et les définitions de facettes diffèrent
	 * réellement : six ici, deux en V-22.
	 *
	 * Aucun chiffre n'est saisi ; la fraîcheur vient de la fabrique unique
	 * `$lib/fraicheur` (`ADR-005`). Les menus de facettes sont rendus fermés — le
	 * gel ne pose `data-ouvert` qu'au clic.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-12.css`.
	 */
	import type { Domaine, IdentifiantNote, Note, Univers } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import {
		FACETTES_DE_NOTE,
		type FacetteRendue,
		type RetenuesDeFacette
	} from '$lib/liste/facettes';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { adresseDeNote } from '$lib/rangement/adresses';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	/** Ce que le chargeur dit de la page servie et de celles qui l'encadrent. */
	interface PaginationDeListe {
		readonly page: number;
		readonly pages: number;
		/** L'adresse de la page voisine, ou `null` — il n'y en a pas. */
		readonly precedente: string | null;
		readonly suivante: string | null;
	}

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		/**
		 * LA PAGE DE NOTES, DÉJÀ BORNÉE AU DOMAINE, FILTRÉE ET ORDONNÉE. Cette vue
		 * recevait le corpus de l'INSTANCE ENTIÈRE et en tirait tout : le domaine, les
		 * six facettes, leurs compteurs, le tri et le nombre de résultats. Le coût était
		 * linéaire dans le nombre de notes lisibles de l'instance ; il est désormais
		 * porté par des clauses SQL, et la vue ne calcule plus rien de tout cela.
		 */
		notes: readonly Note[];
		/**
		 * LE RANGEMENT ET L'IDENTITÉ — plus aucun défaut tiré du jeu. Ces propriétés
		 * ont eu pour défaut `UNIVERS`, `DOMAINES` et `MOI` de `seeds/corpus.ts` : une
		 * route qui en oubliait une servait le contexte du jeu de démonstration quelle
		 * que fût l'identité de l'appelant.
		 *
		 * `domaines` est REQUISE ; `univers` peut être vide, le rail abrégé étant écrit
		 * au balisage, et `compte` peut manquer — la barre n'annonce alors personne.
		 */
		univers?: readonly Univers[];
		domaines: readonly Domaine[];
		compte?: CompteAffiche | null;
		/** Les notes du domaine, TOUTES FACETTES RETIRÉES — le second chiffre du compteur. */
		total: number;
		/** Celles qui passent les filtres retenus — le premier chiffre du compteur. */
		nombre: number;
		/**
		 * LES SIX FACETTES, COMPTÉES PAR LE CHARGEUR. Le compte d'une valeur est celui
		 * qu'on obtiendrait SI elle était retenue, les autres facettes restant
		 * appliquées : c'est un agrégat par facette, et il se fait en SQL.
		 */
		facettes: readonly FacetteRendue[];
		/**
		 * LES VALEURS DE FACETTE RETENUES, telles que L'ADRESSE les porte — les pastilles
		 * de filtre actif s'en déduisent, dans l'ordre des menus puis celui de l'adresse.
		 */
		retenues: RetenuesDeFacette;
		/**
		 * L'ORDRE DEMANDÉ. Les quatre valeurs sont celles des `option` du gel :
		 * `modification`, `verification`, `consultations`, `alpha`. Absente,
		 * l'ordre est celui que le gel applique — l'ancienneté de modification.
		 */
		tri?: string;
		/**
		 * L'ancienneté de modification de chaque note — `window.modifJours` du gel.
		 * `Partial` et non `Record` total : un type total réclamerait toutes les clés
		 * et interdirait à un chargeur de passer un état partiel. Une note absente de
		 * la table s'affiche « date de modification inconnue », jamais une ancienneté
		 * inventée.
		 */
		modifications: Partial<Record<IdentifiantNote, number>>;
		pagination: PaginationDeListe;
	}

	const {
		vecteur,
		notes,
		univers = [],
		domaines,
		compte = null,
		total,
		nombre,
		facettes,
		retenues,
		tri = undefined,
		modifications,
		pagination
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const vide = $derived(reglage['etat'] === 'vide');

	/** AUCUN DOMAINE — l'état vide, écrit plutôt que subi : un tableau vide rendait
	    `domaines[0].nom` et sortait en 500. */
	const AUCUN_DOMAINE: Domaine = { nom: '', univers: '', couleur: '' };

	const courant = $derived(
		domaines.find((d) => d.nom === reglage['dom']) ?? domaines[0] ?? AUCUN_DOMAINE
	);

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — LE DOMAINE COURANT, ET LUI SEUL. Le gel en
	 * marquait DEUX : `coquille()` AJOUTE `noeud--courant` et ne la retire jamais
	 * (`V-12:1827`), si bien que la planche marquait d'abord le domaine de son
	 * scénario. La vue recopiait ce comportement, donc le NOM D'UN DOMAINE DU JEU DE
	 * DÉMONSTRATION, écrit en dur.
	 */
	const railCourant = $derived([courant.nom]);

	/**
	 * LES PASTILLES DE FILTRE ACTIF — l'ordre des menus, puis celui de l'adresse.
	 * Elles se lisent sur les valeurs RETENUES et non sur les facettes rendues : une
	 * valeur retenue dont le compte est nul reste retirable, et l'ordre des menus n'est
	 * pas celui des comptes.
	 */
	const filtresActifs = $derived(
		FACETTES_DE_NOTE.flatMap((f) =>
			(retenues[f.id] ?? []).map((valeur) => ({
				nom: f.nom,
				valeur,
				etiquette: f.prefixe + valeur
			}))
		)
	);

	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	const compteur = $derived(
		nombre === total ? ` ${accord(total, 'note')}` : ` sur ${nb(total)} ${accord(total, 'note')}`
	);

	/** L'ancienneté de modification en clair — `window.modifJours` du gel. */
	function modifiee(n: Note): string {
		const j = modifications[n.id];
		if (typeof j !== 'number') return 'date de modification inconnue';
		if (j <= 0) return "modifiée aujourd'hui";
		return j === 1 ? 'modifiée hier' : `modifiée il y a ${j} jours`;
	}

	function libelleDeType(n: Note): string {
		return n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type;
	}
</script>

<!-- `svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE : ses adresses sont COMPOSÉES par `$lib/rangement/adresses.ts`, la
	fabrique unique du rangement, que la règle ne sait pas suivre. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!--
	Le témoin de fraîcheur — la fabrique unique de `$lib/fraicheur`. Le libellé
	accompagne TOUJOURS la jauge : l'information ne passe jamais par la couleur
	seule (RG-M18-09).
-->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!--
	AUCUN BLANC ENTRE LES NŒUDS DE LA LIGNE-CARTE, et il doit le rester : le nom
	accessible se construit sur `textContent`, où un blanc inséré par le formateur
	se voit. Ne jamais citer la forme exacte de la directive dans un commentaire.

	UNE NOTE RANGÉE À LA RACINE DU DOMAINE N'A PAS DE CHEMIN DE DOSSIER : le chevron
	et son séparateur sont alors omis. Les rendre laissait « ▸ · » seul sur chaque
	ligne.
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
	{notes}
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
				<span class="tete__compteur" id="compteur">{#if total}<b>{nb(nombre)}</b>{compteur}{/if}</span>
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
			{#if !total}
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
			{:else if !nombre}
				<div class="vide-liste">
					<h2>Aucune note ne correspond à ces filtres</h2>
					<p>
						{'Le domaine contient ' +
							nb(total) +
							' notes, mais aucune ne réunit toutes les conditions retenues. Retirez un filtre pour élargir.'}
					</p>
					<div class="vide-liste__actions">
						<button class="btn btn--principal">Réinitialiser les filtres</button>
					</div>
				</div>
			{:else}
				{#each notes as n (n.id)}{@render ligneCarte(n)}{/each}
			{/if}
		</div>

		<!--
			LA PAGINATION — la liste rendait TOUTES les notes du domaine, et le
			chargeur les lisait toutes pour cela. Elle ne se rend que lorsqu'il y a
			plus d'une page : un domaine qui tient sur une page est exactement l'écran
			d'avant. LES DEUX ADRESSES VIENNENT DU CHARGEUR, seul à connaître l'adresse
			demandée — facettes et ordre compris.
		-->
		{#if pagination.pages > 1}
			<nav class="pagination" aria-label="Pages de la liste">
				{#if pagination.precedente}
					<a class="btn" href={pagination.precedente} rel="prev">Page précédente</a>
				{/if}
				<span class="pagination__etat"
					>{'Page ' + nb(pagination.page) + ' sur ' + nb(pagination.pages)}</span
				>
				{#if pagination.suivante}
					<a class="btn" href={pagination.suivante} rel="next">Page suivante</a>
				{/if}
			</nav>
		{/if}
	{/snippet}
</Coquille>
