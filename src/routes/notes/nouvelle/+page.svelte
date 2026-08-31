<script lang="ts">
	/**
	 * `/notes/nouvelle` — V-17 Éditeur d'une note, création. Cinq propriétés viennent
	 * de la BASE — corpus lisible, types de note, types de fiche et gabarits, tous
	 * administrables (M14) donc propres à l'instance.
	 *
	 * L'ENVELOPPE DE FORMULAIRE NE PÈSE AUCUN PIXEL : `display: contents` retire
	 * l'élément de la génération de boîtes, et ses enfants se disposent comme s'il
	 * n'était pas là.
	 *
	 * LE DOMAINE ET LE DOSSIER VIENNENT DE L'ADRESSE, ET SONT LUS PAR LA VUE :
	 * `compte.domaine` commande le domaine pré-choisi ET l'arborescence du choix de
	 * dossier, et `dossierDeDepart` décide quel bouton radio est coché — c'est la vue
	 * qui rend l'arborescence, et la valeur porte la forme AFFICHÉE du chemin, la
	 * seule que ce cochage sache comparer.
	 *
	 * `?dossier=` EST VÉRIFIÉ AVANT D'ÊTRE SERVI : un chemin qui ne désigne aucun
	 * dossier du domaine — lien périmé, dossier renommé — est ignoré en silence.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
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
	import {
		cablerLeBrouillonLocal,
		cleDeBrouillon,
		CIBLE_DE_CREATION,
		type BrouillonCable
	} from '$lib/edition/brouillon';
	import { cablerLAvertissementDeDoublon } from '$lib/edition/doublons';
	import {
		adresseDeNote,
		adressesParLesNoms,
		dossierDeLArborescence
	} from '$lib/rangement/adresses';
	import { designationsDeCoquille } from '$lib/coquille/identite';

	/* LES ADRESSES SE COMPOSENT SUR L'IDENTIFIANT PERSISTÉ, PAS SUR LE NOM : il
	   ne suit pas les renommages (`RG-M12-11`), et « Annuler » ramenait en 404 dès
	   qu'on avait renommé le domaine de rattachement. */
	const adresses = adressesParLesNoms(designationsDeCoquille());
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
	/* L'UNIVERS AUQUEL LE DOMAINE DU COMPTE APPARTIENT, tel que la base le nomme.
	   Le repli était le littéral `'Production'` — un univers du jeu de
	   démonstration. Sur une instance à zéro domaine, la recherche échoue
	   toujours : le fil d'Ariane devenait « Accueil › Production › » et la
	   coquille en tirait `/univers/production`, qui rend 404. Sans domaine
	   trouvé, l'univers est VIDE, et V-17 raccourcit son fil. */
	const universDuCompte = $derived(
		page.data.domaines?.find((d: { nom: string }) => d.nom === compte.domaine)?.univers ?? ''
	);
	/* OÙ « ANNULER » RAMÈNE : la liste des notes du domaine visé, l'accueil quand
	   la base n'en porte aucun. Faute d'adresse nommée, le bouton faisait
	   `history.back()` — mesuré le 22/08/2026 sur un onglet neuf ouvert
	   directement sur cet écran : l'URL devenait `about:blank`, l'utilisateur
	   était hors du produit. Une note à naître n'a pas d'adresse, mais le domaine
	   qui va la recevoir en a une. */
	const retourDAnnulation = $derived(
		page.data.domaines?.some((d: { nom: string }) => d.nom === compte.domaine) === true
			? adresses.notes(universDuCompte, compte.domaine)
			: '/'
	);

	let formulaire: HTMLFormElement;
	/**
	 * LE BROUILLON LOCAL — `RG-NF-02`. Il est déclaré ICI, hors de `onMount`, parce que
	 * DEUX moments le touchent : le montage le câble, et la soumission l'efface quand
	 * elle a abouti.
	 */
	let brouillon: BrouillonCable | null = null;

	/**
	 * L'ENREGISTREMENT ABOUTI EFFACE LE BROUILLON, ET RIEN D'AUTRE NE L'EFFACE. La
	 * création répond par une redirection : c'est à ce type de réponse, et à lui seul,
	 * que le brouillon a cessé d'avoir un objet. Un refus le garde — c'est précisément
	 * le moment où il sert.
	 */
	const surEnvoi: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'redirect' || result.type === 'success') brouillon?.effacer();
			await update();
		};
	};

	/**
	 * LE REFUS D'ENREGISTREMENT SE VOIT — il était muet. Créer sans choisir de
	 * dossier renvoyait `400 { motif: 'dossier manquant' }` et l'écran ne disait
	 * rien : ni message, ni témoin, ni foyer. Les deux blocs du gel —
	 * `#erreur-titre`, `#erreur-dossier` — existaient depuis le début.
	 */
	$effect(() => {
		if (formulaire === undefined) return;
		peindreLeRefusDEdition(formulaire, form ?? null);
	});

	/**
	 * L'ÉDITEUR SE MONTE SUR LA ZONE DU GEL, ET C'EST LUI QUI DONNE LE CORPS. La
	 * soumission porte alors le document canonique dans `corps`, jamais du Markdown.
	 * Sans lui, la zone resterait une saisie nue et le champ serait
	 * `corps-markdown` : les deux chemins existent, ils ne se mélangent pas (`P-35`).
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
						surChangement: () => {
							gestes?.signalerUneModification();
							brouillon?.signaler();
						}
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
		/* LE BROUILLON LOCAL, CÂBLÉ APRÈS L'ÉDITEUR : il restaure dedans. En création,
		   `enregistreeLe` est nul — il n'y a aucune version en base à écraser, et le
		   brouillon est repris d'emblée. */
		brouillon =
			editeur === null
				? null
				: cablerLeBrouillonLocal(formulaire, {
						cle: cleDeBrouillon(data.empreinteDuCompte, CIBLE_DE_CREATION),
						document: () => editeur.document(),
						remplacer: (document) => editeur.remplacer(document),
						enregistreeLe: null
					});

		/* L'AVERTISSEMENT DE DOUBLON — `RG-M05-03`. Il compare aux titres du corpus
		   DÉJÀ SERVI, celui que le chargeur a filtré au périmètre de l'appelant. */
		const defaireLesDoublons = cablerLAvertissementDeDoublon(formulaire, {
			notes: data.notes,
			adresse: (id) => adresseDeNote(id)
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
			defaireLesDoublons();
			brouillon?.defaire();
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
<form method="POST" use:enhance={surEnvoi} bind:this={formulaire} style="display:contents">
	<!-- `domaines` vient du GABARIT RACINE, qui les lit en base : la propriété de
	     la vue retombe sinon sur `DOMAINES` du jeu de semence, et le sélecteur
	     proposait des domaines inexistants — mesuré sur une instance neuve, il
	     offrait « Production › Infrastructure » à une base qui n'en a jamais eu. -->
	<!-- UNE NOTE VIERGE N'A PAS DE CORPS, ET LA ZONE DE RÉDACTION LE DIT : `corps`
	     est la chaîne vide, et l'invite d'amorçage s'affiche. La propriété est
	     REQUISE, et c'est ce qui garantit que l'écran de MODIFICATION ne peut
	     plus oublier de servir le sien. -->
	<Vue
		domaines={page.data.domaines}
		{universDuCompte}
		dossiersParDomaine={data.dossiersParDomaine}
		{dossierDeDepart}
		vecteur={data.vecteur}
		notes={data.notes}
		{compte}
		corps=""
		typesNote={data.typesNote}
		typesFiche={data.typesFiche}
		templates={data.templates}
	/>
</form>
