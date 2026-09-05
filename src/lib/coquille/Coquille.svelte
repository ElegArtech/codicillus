<script lang="ts">
	/**
	 * Coquille applicative — le gabarit permanent de l'espace de travail (V-37),
	 * autour des 35 vues de l'espace de travail et de la console.
	 *
	 * Rendu SERVEUR, sans hydratation (ADR-001). Aucune minuterie n'est écrite : le
	 * squelette rend l'ÉTAT, jamais la transition (ARB-011).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : toute déclaration ajoutée retomberait
	 * sous P-1 en entier (ADR-002).
	 */
	import type { Snippet } from 'svelte';
	import type { Domaine, Note, Univers } from '../../../seeds/corpus';
	import { resolve } from '$app/paths';
	import { adresseDeNote, adressesParLesNoms } from '$lib/rangement/adresses';
	import { railRendu, sectionsDuRail, type PageCourante } from './arborescence';
	import BarreSuperieure from './BarreSuperieure.svelte';
	import Rail from './Rail.svelte';
	import PileDeNotifications from './PileDeNotifications.svelte';
	import type { Notification } from './notifications';
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { CLE_IDENTITE, designationsDeCoquille, type IdentiteDeCoquille } from './identite';

	interface Compte {
		readonly nom: string;
		readonly initiales: string;
		readonly role: string;
		readonly domaine: string;
		/**
		 * LE COURRIEL, SOUS LE NOM DANS LA CARTE DE COMPTE. Optionnel, et il doit
		 * l'être : vingt-cinq vues passent cette propriété et ne le connaissent pas.
		 * En application, le contexte d'identité le porte.
		 */
		readonly courriel?: string;
	}

	interface Proprietes {
		/** Le chemin de la page, du premier segment au titre courant. */
		fil: readonly string[];
		/** Le chemin de rangement mis en évidence dans le rail, du domaine au dernier dossier. */
		courant?: readonly string[];
		/**
		 * ACCEPTÉES, PLUS LUES POUR LE RAIL : la navigation vient du chargeur racine
		 * (voir `universEffectif`). Vingt-cinq vues les passent, et le compilateur les
		 * casserait toutes.
		 */
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		notes: readonly Note[];
		compte: Compte;
		/**
		 * La version affichée au pied du rail. En application, le contexte —
		 * `package.json` — l'emporte ; cette propriété ne sert qu'au rendu par
		 * défaut des vues.
		 */
		version: string;
		/** Navigation ouverte, ou escamotée en mode concentration. */
		rail?: 'ouvert' | 'ferme';
		/** Profil : la section Gestion n'apparaît que pour l'administrateur. */
		role?: 'referent' | 'admin';
		/** Droits effectifs : en lecture seule, les actions d'écriture disparaissent. */
		droits?: 'ecriture' | 'lecture';
		/** Identité de la branche dont l'arborescence est en cours de chargement. */
		brancheEnChargement?: string | null;
		/** Notifications visibles à l'instant rendu — un état, jamais une minuterie. */
		notifications?: readonly Notification[];
		/**
		 * LA PARTIE DROITE DE L'EN-TÊTE, FOURNIE PAR LA VUE. Elle change à chaque
		 * écran — « + Créer » et l'avatar sur l'accueil, « Modifier » et le menu ⋮ sur
		 * une note, « ← Retour à la note » sur l'historique — et la coquille n'a aucun
		 * moyen de la deviner. OPTIONNELLE : les vues qui n'en posent pas rendent un
		 * en-tête réduit au fil d'Ariane, ce qui était déjà leur cas.
		 */
		actionsDEntete?: Snippet | undefined;
		enfants?: Snippet;
		/** Contenu présenté par le catalogue V-37 — `data-contenu` de la maquette. */
		contenu?: 'bord' | 'lecture';
		/**
		 * La classe de `<main>`, propre à chaque vue. Absente, `<main>` est rendu
		 * sans attribut `class` (V-23 et V-37).
		 */
		classeContenu?: string;
		/**
		 * L'identifiant de `<main>`, et la cible du lien d'évitement PAR DÉFAUT.
		 * `contenu` (23 vues), `travail` (console), `corps` (V-41).
		 */
		idContenu?: string;
		/**
		 * La cible du lien d'évitement, SANS le croisillon. Absente, la cible est
		 * `idContenu` — les 22 maquettes où le lien vise bien `<main>` ; les douze
		 * autres visent une ancre INTÉRIEURE au contenu.
		 */
		cibleEvitement?: string;
		/**
		 * Le libellé du lien d'évitement. Absent, « Aller au contenu ». Cible et
		 * libellé sont indépendants : V-14 et V-15 gardent le libellé par défaut tout
		 * en visant `article`.
		 */
		libelleEvitement?: string;
		/**
		 * LA FORME DE COQUILLE — ELLE N'EN DÉCIDE PLUS RIEN, ET C'EST L'OBJET DE LA
		 * REFONTE. Vingt-six vues portaient une coquille « abrégée » : un rail écrit au
		 * balisage, sans pictogramme, sans menu, avec un arbre qui n'était pas celui du
		 * corpus. Deux navigations pour un seul produit, et la seconde mentait.
		 *
		 * IL N'Y EN A PLUS QU'UNE. La propriété reste acceptée — vingt-six vues la
		 * passent, et le compilateur les casserait toutes —, elle n'est simplement plus
		 * lue.
		 */
		forme?: 'complete' | 'abregee';
		/**
		 * LES ATTRIBUTS DE DONNÉES que la vue pose sur `div.app` (ARB-021), TELS QUELS
		 * et avec leur nom complet : le gabarit ne préfixe rien, pour qu'une vue ne
		 * puisse jamais poser un attribut que la maquette n'écrit pas. Ils ne peuvent
		 * pas écraser `data-rail`, `data-role`, `data-droits` ni `data-contenu`, écrits
		 * APRÈS l'étalement.
		 */
		donnees?: Record<string, string | undefined>;
		/**
		 * UNE SUPERPOSITION RENDUE HORS DE `div.app` (ARB-021), entre `div.app` et
		 * `div.notifs` — l'emplacement exact du gel. Les autres nœuds hors `div.app` ne
		 * portent aucune boîte de rendu ; le gabarit ne leur ouvre rien.
		 */
		superposition?: Snippet;
		/**
		 * L'entrée « Accueil » du rail EST la page courante. V-07 seule :
		 * `aria-current="page"`, que `.rail__lien[aria-current="page"]` rend visible.
		 */
		accueilCourant?: boolean;
		/**
		 * LA CLASSE DE L'ENVELOPPE intercalée entre `div.cadre` et `<main>` (ARB-023).
		 * Absente, AUCUN conteneur n'est rendu — pas un `div` sans classe — et `<main>`
		 * reste enfant direct du cadre. `console` et `biblio` sont des GRILLES déclarées
		 * par la feuille de chaque vue ; le gabarit pose la classe qui les active.
		 */
		classeEnveloppe?: string;
		/**
		 * LE NŒUD RENDU DANS L'ENVELOPPE, AVANT `<main>` — la première cellule de la
		 * grille. Balise, identifiant, libellé et contenu appartiennent à la vue. N'a de
		 * sens qu'avec `classeEnveloppe` : sans enveloppe, il n'est pas rendu.
		 */
		avantContenu?: Snippet;
		/**
		 * LE NŒUD RENDU APRÈS `<main>`, dans son parent immédiat : l'enveloppe si la vue
		 * en déclare une, `div.cadre` sinon. Deux maquettes en portent un —
		 * `div.barre-etat` de V-17 et V-18, barre collante qui occupe une place réelle.
		 * Leur contenu diffère : le gabarit ne pose ni balise ni classe.
		 */
		apresContenu?: Snippet;
	}

	const {
		fil,
		courant = [],
		notes,
		compte,
		version,
		rail = 'ouvert',
		role = 'referent',
		droits,
		brancheEnChargement = null,
		notifications = [],
		actionsDEntete,
		enfants,
		contenu,
		classeContenu,
		idContenu = 'contenu',
		cibleEvitement,
		libelleEvitement = 'Aller au contenu',
		donnees,
		superposition,
		accueilCourant = false,
		classeEnveloppe,
		avantContenu,
		apresContenu
	}: Proprietes = $props();

	/**
	 * L'IDENTITÉ RÉELLE L'EMPORTE SUR CELLE DU GEL — `$lib/coquille/identite.ts`
	 * porte le contrat. Hors application, `getContext` rend `undefined` et la
	 * propriété s'applique.
	 *
	 * `roleEffectif` répare l'entrée « Console d'administration » : `socle.css` cache
	 * `.si-admin` hors de `data-role="admin"`, et le défaut `'referent'` la rendait
	 * invisible à l'administrateur lui-même.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	/**
	 * LES ADRESSES SE COMPOSENT SUR L'IDENTIFIANT PERSISTÉ, PAS SUR LE NOM. Le
	 * rail et le fil ne portent que des NOMS d'affichage ; les slugifier rendait
	 * 404 toute la branche dès qu'un univers ou un domaine était renommé, leur
	 * identifiant étant persisté et stable sous les renommages (`RG-M12-11`). La
	 * table vient du gabarit racine ; hors application elle est vide.
	 */
	const designations = designationsDeCoquille();
	const adresses = adressesParLesNoms(designations);
	/**
	 * LA NAVIGATION VIENT DU CHARGEUR RACINE, ET DE LUI SEUL.
	 *
	 * `univers`, `domaines` et `notes` sont des propriétés que chaque vue remplit
	 * avec le corpus de SA page : le rail changeait donc de contenu d'un écran à
	 * l'autre — les notes d'un domaine y apparaissaient sur la page de ce domaine et
	 * disparaissaient sur la suivante —, et vingt-six vues portaient en plus un rail
	 * ÉCRIT AU BALISAGE qui ne dérivait de rien. Trois navigations pour un produit.
	 *
	 * Le gabarit racine lit l'arborescence UNE FOIS, pour toutes les pages, bornée par
	 * les droits de l'appelant. Hors application le contexte est absent et le rail est
	 * VIDE — il dit alors le geste qui débloque, ce qu'aucune valeur de repli ne
	 * saurait faire : l'arborescence des maquettes servie en repli, c'est justement le
	 * défaut que quatre campagnes ont chassé.
	 */
	const universEffectif = $derived(identite?.univers ?? []);
	const domainesEffectifs = $derived(identite?.domaines ?? []);
	const compteEffectif = $derived(identite?.compte ?? compte);
	/* Hors application, ou sur la page d'erreur, le contexte est absent ou `null`
	   et la propriété reprend la main. */
	const versionEffective = $derived(identite?.version ?? version);
	const roleEffectif = $derived(
		identite === undefined ? role : identite.administrateur ? 'admin' : 'referent'
	);

	/**
	 * LES DROITS EFFECTIFS — UNE SOURCE, ET NON TRENTE-QUATRE TRANSMISSIONS. `droits`
	 * est une propriété de vue que quatre vues sur trente-quatre passaient ; ailleurs
	 * `droits !== 'lecture'` valait VRAI et le menu « Créer » était émis en entier,
	 * vers des adresses en 404 sur une instance neuve.
	 *
	 * Le verdict serveur est celui de `+layout.server.ts`, calculé par la MÊME
	 * fonction que la garde de la route, et lu ici une fois.
	 *
	 * LA PROPRIÉTÉ GARDE LE DERNIER MOT quand une vue la passe. Hors application,
	 * `identite` est absent et `page.data` n'est PAS lu — il lèverait, n'étant lié
	 * qu'à une requête en cours.
	 */
	const droitsEffectifs = $derived(
		droits ?? (identite === undefined || ecritureServie() ? undefined : ('lecture' as const))
	);

	/** `ecriture` du gabarit racine — le seul verdict d'écriture du produit. */
	function ecritureServie(): boolean {
		return page.data['ecriture'] === true;
	}

	/**
	 * CE QUE LE MENU « CRÉER » ÉMET — `P-03` et `P-09` ensemble. Les deux entrées qui
	 * exigent un domaine étaient TOUJOURS émises, puis retirées après hydratation :
	 * un navigateur sans script les gardait, mortes. `P-09` ne veut ni grisée ni
	 * masquée — il veut absente. Hors application, les deux sont émises.
	 */
	const rangementEffectif = $derived(identite?.rangement);
	const creations = $derived(
		rangementEffectif === undefined
			? { dossier: true, signet: true }
			: { dossier: rangementEffectif !== null, signet: rangementEffectif?.signets === true }
	);

	/** Les feuilles de l'arbre, et les cinq récents — voir `universEffectif`. */
	const notesDuRail = $derived(identite?.notes ?? []);
	const recents = $derived(identite?.recents ?? []);

	/**
	 * LA PAGE COURANTE, TELLE QUE LE RAIL LA LIT — trois choses, et le fil les donne
	 * toutes.
	 *
	 * `courant` va du domaine au dernier dossier. L'UNIVERS N'Y EST PAS : il est le
	 * SECOND segment du fil, par la même convention qu'`adressesDuFil()` — et sans lui
	 * le rail ne pouvait ni mettre l'univers en évidence ni le déplier, ce que la
	 * référence demande. Un fil qui s'arrête là — `['Accueil', univers]` — EST la page
	 * de l'univers.
	 *
	 * LA NOTE OUVERTE SE LIT SUR L'ADRESSE, seul endroit qui la porte : le fil ne
	 * donne que son TITRE, et deux notes peuvent porter le même. `page.url` n'est lu
	 * qu'en application — hors requête, il lèverait.
	 */
	const pageDuRail: PageCourante = $derived({
		chemin: courant,
		note: identite === undefined ? null : noteDeLAdresse(page.url.pathname),
		univers: fil[0] === 'Accueil' ? (fil[1] ?? null) : null,
		surLUnivers: fil[0] === 'Accueil' && fil.length === 2
	});

	/** L'identifiant lisible de la note ouverte, ou `null`. */
	function noteDeLAdresse(chemin: string): string | null {
		const segments = chemin.split('/').filter((s) => s !== '');
		return segments[0] === 'notes' ? (segments[1] ?? null) : null;
	}

	/** L'arborescence du rail — univers, domaines, dossiers, et les notes en feuilles. */
	const sections = $derived(
		railRendu(
			sectionsDuRail(universEffectif, domainesEffectifs, notesDuRail),
			pageDuRail,
			brancheEnChargement,
			designations
		)
	);

	/** L'ancre déclarée par la vue, à défaut l'identifiant de `<main>`. */
	const cible = $derived(cibleEvitement ?? idContenu);

	/**
	 * LES ADRESSES DU FIL D'ARIANE — COMPOSÉES, PARCE QUE LE GEL N'EN DÉCLARE AUCUNE :
	 * le script de la maquette pose `href="#"` sur chaque ancêtre.
	 *
	 * LA COQUILLE EST LE SEUL ENDROIT QUI PEUT LE FAIRE : la barre supérieure ne reçoit
	 * que des LIBELLÉS, et c'est `courant` qui dit lesquels sont un univers, un domaine,
	 * un dossier. Un fil de rangement se reconnaît à ceci : son TROISIÈME segment est le
	 * PREMIER de `courant`.
	 *
	 *   ['Accueil', univers, domaine, …dossiers, …feuilles]   courant = [domaine, …dossiers]
	 *   ['Accueil', 'Console', section]                        courant = []
	 *
	 * `Notes` et `Signets` sont des identifiants RÉSERVÉS sous un domaine : un segment
	 * qui les porte n'est jamais un dossier. CE QUI RESTE SANS ADRESSE RESTE SANS
	 * ADRESSE — `BarreSuperieure.svelte` rend en `<span>` un segment que ces règles ne
	 * résolvent pas, et une destination devinée serait pire qu'un lien mort.
	 */
	function adressesDuFil(
		segments: readonly string[],
		chemin: readonly string[],
		corpus: readonly Note[]
	): readonly (string | undefined)[] {
		const cibles: (string | undefined)[] = segments.map(() => undefined);
		/* Le dernier segment est la page courante : le gel le rend en `span`. */
		const dernier = segments.length - 1;
		if (segments[0] === 'Accueil' && dernier > 0) cibles[0] = '/';
		if (segments[1] === 'Console') {
			if (dernier > 1) cibles[1] = '/console';
			return cibles;
		}
		const universDuFil = segments[1];
		const domaineDuFil = segments[2];
		if (universDuFil === undefined || domaineDuFil === undefined) return cibles;
		if (chemin[0] !== domaineDuFil) return cibles;
		if (dernier > 1) cibles[1] = adresses.univers(universDuFil);
		if (dernier > 2) cibles[2] = adresses.domaine(universDuFil, domaineDuFil);
		/* `courant` va du domaine au dernier dossier : la profondeur de dossiers
		   est donc sa longueur moins un. Au-delà, le fil parle d'autre chose. */
		const profondeur = chemin.length - 1;
		for (let rang = 3; rang < dernier; rang += 1) {
			const segment = segments[rang];
			if (segment === 'Notes') {
				cibles[rang] = adresses.notes(universDuFil, domaineDuFil);
			} else if (segment === 'Signets') {
				cibles[rang] = adresses.signets(universDuFil, domaineDuFil);
			} else if (rang - 3 < profondeur) {
				cibles[rang] = adresses.dossier(universDuFil, domaineDuFil, segments.slice(3, rang + 1));
			} else if (rang - 3 === profondeur) {
				/*
				 * LE SEGMENT QUI SUIT LE DERNIER DOSSIER EST UN TITRE DE NOTE — le fil de
				 * `/notes/{id}/operationnel` et `/notes/{id}/relations`. L'ADRESSE NE SE
				 * DÉRIVE PAS DU TITRE : l'identifiant lisible est PERSISTÉ et stable sous
				 * les renommages (`RG-M12-11`). Il est LU sur la note du corpus, et
				 * seulement si le rangement concorde.
				 */
				const note = corpus.find(
					(candidate) =>
						candidate.titre === segment &&
						candidate.univers === universDuFil &&
						candidate.domaine === domaineDuFil
				);
				if (note !== undefined) cibles[rang] = adresseDeNote(note.id);
			}
		}
		return cibles;
	}

	const ciblesDuFil = $derived(adressesDuFil(fil, courant, notes));

	/**
	 * LE COMPTE, DANS LA FORME QUE LA CARTE DU RAIL DEMANDE. `courriel` est
	 * optionnel sur la propriété — vingt-cinq vues la passent et ne le connaissent
	 * pas —, et la carte n'émet pas la ligne quand il est vide.
	 */
	const compteDuRail = $derived({
		nom: compteEffectif.nom,
		initiales: compteEffectif.initiales,
		role: compteEffectif.role,
		domaine: compteEffectif.domaine,
		courriel: compteEffectif.courriel ?? ''
	});
</script>

<!--
	`<main>`, rendu une seule fois et posé à deux endroits : dans l'enveloppe quand
	la vue en déclare une, en enfant direct du cadre sinon. Un snippet plutôt que
	deux `<main>` recopiés, qui divergeraient au premier amendement.
-->
{#snippet zoneDeContenu()}<main class={classeContenu} id={idContenu}>
		{#if enfants}{@render enfants()}{/if}
	</main>{/snippet}

<a class="saut-contenu" href="#{cible}">{libelleEvitement}</a>

<div
	class="app"
	id="app"
	{...donnees}
	data-rail={rail}
	data-role={roleEffectif}
	data-droits={droitsEffectifs}
	data-contenu={contenu}
>
	<!--
		LE VOILE DES TIROIRS — rendu toujours, visible seulement quand `data-tiroir`
		est posé sur `div.app`. Un clic dessus ferme : c'est le geste que tout le
		monde essaie en premier. `$lib/coquille/tiroirs.ts` porte le câblage.
	-->
	<div class="voile" data-fermer-tiroir aria-hidden="true"></div>

	<!--
		`droits` et `role` DESCENDENT jusqu'au rail : P-09 lui demande de ne pas
		ÉMETTRE ce que le socle se contentait de cacher.
	-->
	<Rail
		{sections}
		{recents}
		compte={compteDuRail}
		version={versionEffective}
		droits={droitsEffectifs}
		role={roleEffectif}
		{creations}
		rangement={rangementEffectif}
		{accueilCourant}
		noteCourante={pageDuRail.note}
	/>

	<div class="cadre">
		<BarreSuperieure {fil} cibles={ciblesDuFil} accueil={resolve('/')} actions={actionsDEntete} />

		{#if classeEnveloppe}<div class={classeEnveloppe}>
				{#if avantContenu}{@render avantContenu()}{/if}
				{@render zoneDeContenu()}{#if apresContenu}{@render apresContenu()}{/if}
			</div>{:else}{@render zoneDeContenu()}{#if apresContenu}{@render apresContenu()}{/if}{/if}
	</div>
</div>

<!-- La superposition rendue HORS de `div.app` : après lui, avant `div.notifs`. -->
{#if superposition}{@render superposition()}{/if}

<PileDeNotifications {notifications} />
