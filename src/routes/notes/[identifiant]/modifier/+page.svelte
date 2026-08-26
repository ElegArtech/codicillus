<script lang="ts">
	/**
	 * `/notes/{identifiant}/modifier` — V-17 Éditeur d'une note, modification.
	 *
	 * La vue ne change pas. Six de ses propriétés viennent de la base : le corpus
	 * lisible par l'appelant, la NOTE REPRISE — celle que l'adresse désigne, et
	 * non plus celle du gel —, et les trois référentiels de saisie.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict. C'est le fondement
	 * d'`ARB-063`.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LE CORPS RÉDIGÉ ENTRE ENFIN DANS L'ÉCRAN, ET PAR LE CONVERTISSEUR UNIQUE
	 *
	 * `data.corps` porte le document canonique du registre Référence, validé par
	 * la porte unique du format, et `data.corpsRendu` en est le HTML.
	 *
	 * L'ÉCRAN OUVRAIT LE CORPS D'UNE AUTRE NOTE, ET C'ÉTAIT SERVI.
	 * `src/vues/V-17.svelte` ne déclarait aucune propriété qui reçût le corps :
	 * la vue écrivait donc, en modification, l'extrait de la note suivi des
	 * sections d'une procédure de démonstration, et le câblage remplaçait le tout
	 * APRÈS le montage. Flash à chaque chargement, contenu PERMANENT sans
	 * JavaScript, et c'est ce que montrait le source de la page.
	 *
	 * La vue déclare désormais `corps`, et la route le lui passe. Le câblage
	 * continue de monter l'éditeur sur le MÊME document : ce que le serveur rend
	 * et ce que l'éditeur ouvre sont la même chose.
	 *
	 * La sérialisation passe par `serialiserEnMarkdown()`, le convertisseur
	 * unique (`verif:convertisseur` en interdit un second). Le texte posé est
	 * celui-là même que la soumission renverra si rien n'est frappé, et
	 * `pnpm test:aller-retour` est ce qui rend cette phrase vraie.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LE RANGEMENT SERVI EST CELUI DE LA BASE
	 *
	 * Le sélecteur de domaine et l'arborescence de dossiers viennent du chargeur
	 * et du gabarit racine, comme à la création. Sans eux, V-17 retombait sur les
	 * constantes du jeu de semence : mesuré le 22/08/2026, l'écran offrait
	 * « Production › Applications », « Production › Poste de travail » et
	 * « Projets › Migration 2026 » — trois domaines qui n'existent nulle part en
	 * base — et sa liste de dossiers sortait vide.
	 *
	 * `horsDePorteeDeLEditeur` reste non montré : la liste est vide quand la note
	 * s'ouvre entière, et aucun nœud du gel ne l'accueillerait autrement.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../vues/V-17.svelte';
	import '../../../../vues/V-17.css';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { cablerLEditeur } from '$lib/cablage/formulaires';
	import { monterLEditeur } from '$lib/edition/editeur-client';
	import {
		cablerLesGestesDEdition,
		resolveurDuCorpusServi,
		DOCUMENT_VIDE,
		type GestesCables,
		peindreLeRefusDEdition
	} from '$lib/edition/gestes';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/* LE COMPTE RÉEL, ET L'UNIVERS DE LA NOTE. Le repli était `MOI` de
	   `seeds/corpus.ts` : la pastille nommait « Karim Belhadj » et le fil
	   d'Ariane plaçait la note dans l'univers du jeu de démonstration. Le
	   gabarit racine sert le compte connecté ; sans lui — il n'y en a pas — le
	   compte est VIDE, jamais celui des maquettes. `universDuCompte` est ici
	   l'univers du domaine PORTEUR : c'est lui que le fil rend en modification,
	   aux côtés du domaine de la note. */
	const compte = $derived(page.data.compte ?? { nom: '', initiales: '', role: '', domaine: '' });

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
	 * L'ÉDITEUR REÇOIT LE DOCUMENT CANONIQUE, pas une transposition.
	 *
	 * `data.corps` est ce que la base porte, validé par la porte unique du
	 * format. Il entre dans l'éditeur par `noeudDepuisDocument()` et en ressort
	 * par `documentDepuisNoeud()` : ce qui est réenregistré sans une frappe est
	 * identique à ce qui a été ouvert.
	 */
	onMount(() => {
		const zone = formulaire.querySelector<HTMLElement>('#redaction');
		/* LE NŒUD ENTRE LES DEUX CÂBLAGES — voir `/notes/nouvelle`, même raison :
		   l'éditeur est monté avant les gestes et ne peut pas s'y référer. */
		let gestes: GestesCables | null = null;
		const editeur =
			zone === null
				? null
				: monterLEditeur(zone, data.corps, formulaire, {
						surChangement: () => gestes?.signalerUneModification()
					});
		/* PAS DE `rechargerSurDomaine` ICI, ET C'EST VOULU. Changer de domaine doit
		   refaire l'arbre des dossiers — sans quoi déplacer une note est impossible
		   —, mais un rechargement de page jetterait le corps en cours de rédaction.
		   V-17 suit désormais la valeur vive du sélecteur et refait l'arbre
		   elle-même ; le dossier repris tombe, comme l'aide du champ le promet. */
		const defaire = cablerLEditeur(formulaire, {
			/* LE RÉFÉRENTIEL ET L'ÉTAT DE FICHE — sans le premier, `#m-fiche` reste
			   inerte et sa valeur n'est pas soumise ; sans le second, l'écran rouvre
			   une fiche sur « Aucun — note simple » et l'enregistrement la
			   dépouille de son type. */
			typesFiche: data.typesFiche,
			ficheDeDepart:
				data.noteModifiee.typeFiche === undefined
					? null
					: { type: data.noteModifiee.typeFiche, proprietes: data.proprietesDeFiche },
			surSaisie: () => gestes?.signalerUneModification(),
			...(editeur === null ? {} : { editeur: () => editeur.document() })
		});
		gestes = cablerLesGestesDEdition(formulaire, {
			document: () => editeur?.document() ?? data.corps ?? DOCUMENT_VIDE,
			resoudre: resolveurDuCorpusServi(data.notes),
			/* « Annuler » ramène à la LECTURE de la note qu'on modifiait — la
			   destination que `docs/routes.md` donne à cette famille, et celle
			   qu'un enregistrement réussi emprunte déjà. */
			retour: adresseDeNote(page.params['identifiant'] ?? '')
		});
		return () => {
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
	<Vue
		domaines={page.data.domaines}
		universDuCompte={data.noteModifiee.univers}
		dossiersParDomaine={data.dossiersParDomaine}
		{compte}
		vecteur={data.vecteur}
		notes={data.notes}
		noteModifiee={data.noteModifiee}
		corps={data.corpsRendu}
		typesNote={data.typesNote}
		typesFiche={data.typesFiche}
		templates={data.templates}
		dernierEnregistrement={data.dernierEnregistrement}
	/>
</form>
