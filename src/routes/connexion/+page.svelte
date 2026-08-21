<script lang="ts">
	/**
	 * `/connexion` — V-05 Connexion.
	 *
	 * LOT T-070, « la liaison », a posé cette route parce qu'une entrée de
	 * navigation la nomme : le gel déclare sa destination en `data-vers`
	 * (« connexion », les quatre liens de retour de V-06), et `docs/routes.md` §3 — qui fait foi sur les chemins — la
	 * résout en `/connexion` → V-05.
	 *
	 * LOT T-012 y a ajouté le CHARGEUR ET L'ACTION — `+page.server.ts`, qui porte
	 * l'authentification, le barème de ralentissement et l'ouverture de session.
	 * IL NE CÂBLE PLUS RIEN, ET C'EST DÉLIBÉRÉ. La méthode et les trois noms de
	 * champ étaient posés ici depuis `onMount` : la parade n'existait donc pas
	 * avant le montage, et une soumission dans cette fenêtre partait en `GET`
	 * avec le mot de passe dans l'adresse. Les quatre attributs sont désormais
	 * dans le balisage de la vue, et la connexion fonctionne sans JavaScript.
	 * Ce fichier LIT `?motif=` par son chargeur, comme
	 * `docs/routes.md:286` le prescrit — `page-protegee` / `session-expiree` /
	 * (absent) → `protegee` / `expiree` / `directe`, les trois positions de l'axe
	 * « Arrivée » de la planche V-05. La correspondance vient de la source ; elle
	 * n'est pas inventée ici.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il atteint la vue par la route de
	 * conception du mode démo, qui rend le composant directement. Rien de ce
	 * fichier n'entre dans son verdict, et le vecteur qu'il passe n'est pas
	 * celui-ci.
	 *
	 * SON ADRESSE N'EST PAS CITÉE ICI, ET C'EST UN PIÈGE MESURÉ. Depuis T-070,
	 * cette route est BÂTIE, et `verif:demo:hors-production` cherche la chaîne du
	 * mode démo en texte brut dans le produit construit — COMMENTAIRES COMPRIS.
	 * Écrire l'adresse dans ce fichier a fait rougir la batterie sur trois
	 * fichiers produits (T-012). Le fait n'était pas hypothétique : l'en-tête de
	 * `src/vues/V-05.svelte` le déclarait déjà (écart É-2 de T-070), et les autres
	 * routes bâties y échappent seulement parce que leur commentaire ne précède
	 * aucune instruction conservée — un `$props()` de plus, et la trace revient.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : le mode démo pose lui-même son `<link>`, `+layout.svelte` ne porte
	 * que le socle. Elle est identique à l'octet à sa source gelée (P-6.3) et
	 * n'est pas modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les `<title>` des maquettes sont ceux des planches de revue — celui de
	 * V-07 porte même son numéro de vue —, et en inventer un serait un
	 * comblement.
	 */
	import Vue from '../../vues/V-05.svelte';
	import '../../vues/V-05.css';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/**
	 * CE QUE LE SERVEUR A REFUSÉ, DIT À L'ÉCRAN — et il ne l'était pas.
	 *
	 * L'action rendait `fail(401, { issue: 'echec' })` ou `fail(429, { issue:
	 * 'trop', secondes })`, la page se réaffichait à l'identique, les champs
	 * vidés, et rien ne le disait. Un utilisateur voyait « je clique et rien ne
	 * se passe » — mesuré, c'est exactement ce que ça donne.
	 *
	 * Les deux messages sont ceux du gel, à la lettre : `echec()` et
	 * `verrouiller()`, `mockups/V-05-connexion.html:697` et `:712`. Le décompte
	 * de la seconde est du COMPORTEMENT (`ARB-011`) ; la durée annoncée, elle,
	 * est celle que le serveur a décidée, et elle est vraie sans script.
	 *
	 * `RG-ACC-04` tient : un seul message quelle que soit la cause du refus.
	 */
	const refus = $derived.by(() => {
		if (form?.issue === 'trop') {
			/* `ActionData` unifie les deux formes de refus, et `secondes` n'existe
			   que sur l'une : la lecture est gardée plutôt que forcée. */
			const s = 'secondes' in form && typeof form.secondes === 'number' ? form.secondes : 0;
			const minutes = Math.floor(s / 60);
			const reste = s % 60;
			const duree =
				minutes > 0 ? `${minutes} min ${String(reste).padStart(2, '0')} s` : `${reste} s`;
			return {
				variante: 'attente',
				marque: '⏱',
				titre: 'Trop de tentatives',
				txt: `Nouvelle tentative possible dans ${duree}.`
			};
		}
		if (form?.issue === 'echec') {
			return {
				variante: 'erreur',
				marque: '!',
				titre: 'Identifiant ou mot de passe incorrect',
				txt: 'Vérifiez votre saisie, puis réessayez.'
			};
		}
		return null;
	});
</script>

<Vue vecteur={{ arrivee: data.arrivee }} {refus} />
