<script lang="ts">
	/**
	 * `/console/analytique` — V-34 Console · Analytique.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * LE VECTEUR VIENT DU SERVEUR, ET IL PORTE `P-02`. Le produit n'a aucune des
	 * cinq mesures que cet écran calcule ; le chargeur demande donc l'état neutre
	 * explicite que le gel porte lui-même — voir son en-tête pour le
	 * raisonnement complet et le recensement des lacunes.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il atteint la vue par le mode de
	 * conception, qui rend le composant directement et lui passe le vecteur du
	 * scénario. Rien de ce fichier n'entre dans son verdict, et `pnpm test:vide`
	 * n'en dépend pas davantage — il mesure la vue, pas la route.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-34.svelte';
	import '../../../vues/V-34.css';
	import { goto } from '$app/navigation';
	import { adresseDeNote, adresseDesNotesDuDomaine } from '$lib/rangement/adresses';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LA LISTE DES NOTES D'UN DOMAINE, DÉJÀ FILTRÉE — l'adresse sort de la
	 * fabrique, jamais d'un gabarit écrit à la main, et le domaine se désigne par
	 * sa forme CANONIQUE : la vue rend un nom d'affichage, le chargeur a servi la
	 * table de correspondance. Le filtre voyage en paramètre de requête
	 * (`docs/routes.md` §4.2), jamais en segment de chemin.
	 */
	function adresseDeListe(domaine: string, fraicheur?: string): string | null {
		const canonique = data.designations[domaine];
		if (canonique === undefined) return null;
		const base = adresseDesNotesDuDomaine(canonique.univers, canonique.domaine);
		return fraicheur === undefined ? base : `${base}?fraicheur=${encodeURIComponent(fraicheur)}`;
	}

	/** Le domaine d'une note, tel que le chargeur l'a servi. */
	function domaineDe(identifiant: string): string | undefined {
		return data.notes.find((n) => n.id === identifiant)?.domaine;
	}
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	relations={data.relations}
	mesures7j={data.mesures7j}
	mesures7jPrec={data.mesures7jPrec}
	onVoirLesNotes={(demande) => {
		const adresse = adresseDeListe(demande.domaine, demande.fraicheur);
		/* LA RÈGLE EST DÉSARMÉE, ET LE PRÉCÉDENT EST CELUI DU DÉPÔT.
		   `svelte/no-navigation-without-resolve` veut voir `resolve()` au point
		   d'appel. L'adresse vient ici de `$lib/rangement/adresses.ts`, que le plan
		   de remédiation §3.3 rend OBLIGATOIRE — « les adresses sortent de la
		   fabrique, jamais un gabarit écrit à la main » — et la fabrique rend une
		   chaîne déjà composée : la règle ne sait pas la reconnaître. Passer par
		   `resolve()` ici reviendrait à recomposer le chemin à côté de la fabrique,
		   c'est-à-dire à faire exactement ce que le plan interdit. Même désarmement
		   qu'en `V-03`, `V-13`, `V-22` et `V-24`. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (adresse !== null) void goto(adresse);
	}}
	onOuvrirLaNote={(identifiant) => {
		/* LA RÈGLE EST DÉSARMÉE, ET LE PRÉCÉDENT EST CELUI DU DÉPÔT.
		   `svelte/no-navigation-without-resolve` veut voir `resolve()` au point
		   d'appel. L'adresse vient ici de `$lib/rangement/adresses.ts`, que le plan
		   de remédiation §3.3 rend OBLIGATOIRE — « les adresses sortent de la
		   fabrique, jamais un gabarit écrit à la main » — et la fabrique rend une
		   chaîne déjà composée : la règle ne sait pas la reconnaître. Passer par
		   `resolve()` ici reviendrait à recomposer le chemin à côté de la fabrique,
		   c'est-à-dire à faire exactement ce que le plan interdit. Même désarmement
		   qu'en `V-03`, `V-13`, `V-22` et `V-24`. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresseDeNote(identifiant));
	}}
	onTrou={(demande) => {
		/* LES DEUX ISSUES SONT CELLES DU GEL (`V-34:3100`), et les deux adresses
		   sont déclarées : « Écrire cette note » ouvre l'éditeur avec le titre
		   pré-rempli et la requête d'origine — `?titre=` et `?q=` de
		   `/notes/nouvelle` —, « Examiner les résultats » rejoue la recherche. */
		const terme = encodeURIComponent(demande.terme);
		const adresse =
			demande.resultats === 0
				? `/notes/nouvelle?titre=${terme}&q=${terme}`
				: `/recherche?q=${terme}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresse);
	}}
	onOrpheline={(demande) => {
		/* CHAQUE FAMILLE A SA DESTINATION, ET DEUX DES TROIS SONT CELLES DU GEL :
		   « Réaffecter » mène à la liste du domaine (vue V-12), « Lier depuis une
		   note » à l'éditeur de la note (vue V-17).

		   LA TROISIÈME EST UN ARBITRAGE DÉCLARÉ. « Signaler à réviser » notifie au
		   gel « Demande de révision envoyée », et AUCUNE TABLE n'enregistre une
		   demande de révision — le recensement des lacunes le dit en propres
		   termes. Plutôt qu'un bouton sans réponse ou qu'une écriture inventée, le
		   geste ouvre la note : c'est là que vit « Marquer comme vérifié », le seul
		   geste de contrôle que le produit porte réellement. */
		const domaine = domaineDe(demande.identifiant);
		const adresse =
			demande.famille === 'peuConsultees'
				? domaine === undefined
					? null
					: adresseDeListe(domaine)
				: demande.famille === 'sansLienEntrant'
					? `${adresseDeNote(demande.identifiant)}/modifier`
					: adresseDeNote(demande.identifiant);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (adresse !== null) void goto(adresse);
	}}
/>
