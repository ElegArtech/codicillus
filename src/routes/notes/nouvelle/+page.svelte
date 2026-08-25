<script lang="ts">
	/**
	 * `/notes/nouvelle` — V-17 Éditeur d'une note, création.
	 *
	 * La vue ne change pas : elle reçoit ses propriétés, et cinq d'entre elles
	 * viennent de la BASE — le corpus lisible par l'appelant, les types de note,
	 * les types de fiche et les gabarits, tous administrables (M14) donc propres
	 * à l'instance.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict, et les 409 couples
	 * ne peuvent pas bouger de son fait. C'est le fondement d'`ARB-063`, et c'est
	 * pourquoi le câblage du formulaire est écrit ici plutôt qu'en `src/vues/`.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * L'ENVELOPPE DE FORMULAIRE NE PÈSE AUCUN PIXEL
	 *
	 * `display: contents` retire l'élément de la génération de boîtes : il ne
	 * porte ni marge, ni remplissage, ni contexte de formatage, et ses enfants
	 * se disposent comme s'il n'était pas là. Le rendu est celui d'avant, à
	 * l'octet — et le banc, qui ne traverse pas ce fichier, n'a de toute façon
	 * pas à en juger.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LE DOMAINE VIENT DE L'ADRESSE, ET IL COMMANDE L'ARBORESCENCE
	 *
	 * `docs/routes.md:287` prévoit un paramètre `domaine` sur cette adresse. Il
	 * est désormais honoré, et il l'est PAR LA VUE plutôt qu'à côté d'elle :
	 * `compte.domaine` commande le domaine pré-choisi d'une note vierge
	 * (`V-17:3537`) ET l'arborescence du choix de dossier qui s'en déduit. Le
	 * porter par cette propriété est donc le seul moyen que la vue offre — et
	 * elle l'offre : `compte` est optionnelle depuis `T-042`, son défaut est la
	 * constante du jeu, et le mode de conception ne la passe pas.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LE DOSSIER VIENT DE L'ADRESSE, ET IL COCHE SON BOUTON RADIO
	 *
	 * `docs/routes.md:288` prévoit `?dossier=`, et le brief de V-13 promet une
	 * « nouvelle note DANS CE DOSSIER ». Le paramètre était émis par personne et
	 * lu par personne : les deux gestes de la page d'un dossier ouvraient
	 * l'éditeur sur le bon DOMAINE et rien de plus, à charge pour l'utilisateur
	 * de retrouver dans l'arborescence le dossier d'où il venait de cliquer.
	 *
	 * Il est désormais lu, et il l'est PAR LA VUE — `dossierDeDepart` —, parce
	 * que c'est elle qui rend l'arborescence et décide quel bouton radio est
	 * coché. La valeur porte la forme AFFICHÉE du chemin, la seule que ce
	 * cochage sache comparer.
	 *
	 * ELLE EST VÉRIFIÉE AVANT D'ÊTRE SERVIE. Un chemin qui ne désigne aucun
	 * dossier du domaine — lien périmé, dossier renommé — est ignoré en silence :
	 * le formulaire s'ouvre, rien n'est coché, aucune erreur. Voir
	 * `dossierDeLArborescence()`.
	 *
	 * Les deux autres paramètres de `docs/routes.md:287-288` — titre et
	 * template — sont lus plus bas et par le câblage du choix de départ.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import Vue from '../../../vues/V-17.svelte';
	import '../../../vues/V-17.css';
	import { cablerLEditeur } from '$lib/cablage/formulaires';
	import { monterLEditeur } from '$lib/edition/editeur-client';
	import {
		cablerLesGestesDEdition,
		resolveurDuCorpusServi,
		DOCUMENT_VIDE,
		type GestesCables,
		peindreLeRefusDEdition
	} from '$lib/edition/gestes';
	import { adresseDesNotesDuDomaine, dossierDeLArborescence } from '$lib/rangement/adresses';
	import { cablerLeChoixDeDepart } from './cablage';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/** Le domaine demandé par l'adresse, à défaut celui du compte du jeu. */
	const domaineDemande = $derived(page.url.searchParams.get('domaine'));
	/* LE COMPTE RÉEL, ET SON UNIVERS. Le repli était `MOI` — la constante du jeu
	   de démonstration : l'éditeur affichait « Karim Belhadj » et un fil d'Ariane
	   « Accueil › Production › Infrastructure » sur une instance qui n'a jamais
	   porté ces noms. Mesuré le 21/08/2026 sur une base neuve : le fil offrait
	   `/univers/production/infrastructure`, qui rend 404. Sans compte servi, le
	   compte est VIDE — jamais celui des maquettes. */
	const compteServi = $derived(
		page.data.compte ?? { nom: '', initiales: '', role: '', domaine: '' }
	);
	const premierDomaine = $derived(page.data.domaines?.[0]?.nom ?? '');

	const compte = $derived({
		nom: compteServi.nom,
		initiales: compteServi.initiales,
		role: compteServi.role,
		/* UN ADMINISTRATEUR N'A PAS FORCÉMENT DE DOMAINE DE RATTACHEMENT, et sur une
		   instance neuve il n'en a jamais. Sans repli, `domaineChoisi` reste vide :
		   le sélecteur de domaine ne présélectionne rien et l'arborescence de
		   dossiers sort vide — mesuré, la première note était impossible à écrire.
		   Le premier domaine servi fait un point de départ que l'utilisateur change
		   d'un clic. */
		domaine: domaineDemande ?? (compteServi.domaine || premierDomaine)
	});
	/* LE DOSSIER DEMANDÉ PAR L'ADRESSE, vérifié contre l'arborescence du domaine
	   servie par le chargeur — jamais contre celle d'un autre domaine, sans quoi
	   changer de domaine dans l'adresse cocherait un dossier étranger. */
	const dossierDeDepart = $derived(
		dossierDeLArborescence(
			data.dossiersParDomaine?.[compte.domaine],
			page.url.searchParams.get('dossier')
		)
	);
	/* L'univers auquel le domaine du compte appartient, tel que la base le nomme. */
	const universDuCompte = $derived(
		page.data.domaines?.find((d: { nom: string }) => d.nom === compte.domaine)?.univers ??
			'Production'
	);
	/* OÙ « ANNULER » RAMÈNE : la liste des notes du domaine visé, l'accueil quand
	   la base n'en porte aucun. Faute d'adresse nommée, le bouton faisait
	   `history.back()` — mesuré le 22/08/2026 sur un onglet neuf ouvert
	   directement sur cet écran : l'URL devenait `about:blank`, l'utilisateur
	   était hors du produit. Une note à naître n'a pas d'adresse, mais le domaine
	   qui va la recevoir en a une. */
	const retourDAnnulation = $derived(
		page.data.domaines?.some((d: { nom: string }) => d.nom === compte.domaine) === true
			? adresseDesNotesDuDomaine(universDuCompte, compte.domaine)
			: '/'
	);

	let formulaire: HTMLFormElement;

	/**
	 * LE REFUS D'ENREGISTREMENT SE VOIT — mesuré muet le 21/08/2026.
	 * Créer sans choisir de dossier renvoyait `400 { motif: 'dossier manquant' }`
	 * et l'écran ne disait rien : ni message, ni témoin, ni foyer. Les deux blocs
	 * du gel — `#erreur-titre`, `#erreur-dossier` — existaient depuis le début.
	 */
	$effect(() => {
		if (formulaire === undefined) return;
		peindreLeRefusDEdition(formulaire, form ?? null);
	});

	/**
	 * L'ÉDITEUR SE MONTE SUR LA ZONE DU GEL, ET C'EST LUI QUI DONNE LE CORPS.
	 *
	 * Il rend la barre d'outils vivante — gras, titres, listes, tableaux,
	 * alertes, tâches — et la soumission porte alors le document canonique dans
	 * `corps`, jamais du Markdown. Sans lui, la zone resterait une saisie nue et
	 * le champ serait `corps-markdown` : les deux chemins existent, ils ne se
	 * mélangent pas (`P-35`).
	 */
	onMount(() => {
		/* `?titre=` — LE QUATRIÈME PARAMÈTRE DE `docs/routes.md:287`, LU ICI.
		   TROIS ÉCRANS L'ÉMETTAIENT DÉJÀ, ET PERSONNE NE LE LISAIT : la recherche
		   sans résultat (`V-08:659`), la page d'adresse non résolue
		   (`cablage-erreur.ts`) et la console analytique, toutes trois par
		   « Créer la note « … » ». Le titre cherché se perdait donc en chemin, et
		   l'utilisateur retrouvait une page blanche là où le produit lui promettait
		   sa requête. C'est le trou que `P-35` décrit : un contrat émis d'un côté,
		   jamais honoré de l'autre.
		   Le champ est posé DIRECTEMENT plutôt que passé en propriété : le titre
		   n'est pas un état de départ que le serveur décide, c'est une amorce que
		   l'utilisateur va récrire — et `src/vues/` ne se touche pas (`ARB-063`). */
		const titreDemande = page.url.searchParams.get('titre');
		const champTitre = formulaire.querySelector<HTMLTextAreaElement>('#titre');
		if (titreDemande !== null && titreDemande !== '' && champTitre !== null) {
			champTitre.value = titreDemande;
		}

		const zone = formulaire.querySelector<HTMLElement>('#redaction');
		/* LE NŒUD ENTRE LES DEUX CÂBLAGES. L'éditeur est monté AVANT les gestes —
		   il prend la zone du gel, que les gestes interrogent ensuite — et il ne
		   peut donc pas se référer à eux à sa construction. Le renvoi est différé
		   par cette variable : c'est ce qui fait passer le témoin de sauvegarde à
		   « Modifications non enregistrées » à la première frappe. */
		let gestes: GestesCables | null = null;
		const editeur =
			zone === null
				? null
				: monterLEditeur(zone, null, formulaire, {
						surChangement: () => gestes?.signalerUneModification()
					});
		const defaire = cablerLEditeur(formulaire, {
			rechargerSurDomaine: (domaine) => `/notes/nouvelle?domaine=${encodeURIComponent(domaine)}`,
			/* LE RÉFÉRENTIEL DES TYPES DE FICHE — le même que celui qui peuple
			   `#m-fiche`. Sans lui, choisir un type ne fait apparaître aucun champ
			   et la valeur du sélecteur ne quitte jamais l'écran. */
			typesFiche: data.typesFiche,
			surSaisie: () => gestes?.signalerUneModification(),
			...(editeur === null ? {} : { editeur: () => editeur.document() })
		});
		gestes = cablerLesGestesDEdition(formulaire, {
			document: () => editeur?.document() ?? DOCUMENT_VIDE,
			resoudre: resolveurDuCorpusServi(data.notes),
			retour: retourDAnnulation
		});
		const defaireLeChoix =
			editeur === null
				? () => undefined
				: cablerLeChoixDeDepart(formulaire, {
						templates: data.templates,
						inserer: (document) => editeur.inserer(document),
						demande: data.templateDemande
					});
		return () => {
			defaireLeChoix();
			gestes?.defaire();
			defaire();
			editeur?.detruire();
		};
	});
</script>

<!-- LE REFUS NE DOIT PAS EMPORTER LE BROUILLON — mesuré le 25/08/2026.
     Sans amélioration progressive, la soumission fait une navigation complète :
     la réponse 400 réaffiche l'écran NEUF, et le titre, le corps, les
     étiquettes, le type de fiche et ses valeurs sont perdus. `peindreLeRefusDEdition()`
     n'avait alors plus de champ où se poser, et le refus d'une propriété
     obligatoire ne pouvait pas être « signalé à l'endroit du champ »
     (`BRIEF-VUES.md:973`) : le champ n'existait plus. Avec elle, la soumission
     part en arrière-plan, le document reste, et le refus se peint dessus. -->
<form method="POST" use:enhance bind:this={formulaire} style="display:contents">
	<!-- `domaines` vient du GABARIT RACINE, qui les lit en base : la propriété de
	     la vue retombe sinon sur `DOMAINES` du jeu de semence, et le sélecteur
	     proposait des domaines inexistants — mesuré sur une instance neuve, il
	     offrait « Production › Infrastructure » à une base qui n'en a jamais eu. -->
	<Vue
		domaines={page.data.domaines}
		{universDuCompte}
		dossiersParDomaine={data.dossiersParDomaine}
		{dossierDeDepart}
		vecteur={data.vecteur}
		notes={data.notes}
		{compte}
		typesNote={data.typesNote}
		typesFiche={data.typesFiche}
		templates={data.templates}
	/>
</form>
