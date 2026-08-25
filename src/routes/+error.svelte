<script lang="ts">
	/**
	 * TOUTE ADRESSE NON RÉSOLUE — **V-04** (public) et **V-26** (connecté).
	 *
	 * `docs/routes.md` §3.1 et §3.5, même formule dans les deux : « **pas de
	 * route propre** : réponse 404 rendue à l'adresse demandée ». Dans SvelteKit,
	 * cela désigne ce fichier, et lui seul — il répond aussi bien quand aucune
	 * route ne correspond que quand un chargeur a appelé `refuserLAdresse()`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * `ADR-007` — LE CHEMIN DE CODE EST UNIQUE, ET CE FICHIER EN EST LA PREUVE
	 *
	 * « Une réponse unique, produite par le même chemin de code, sert les deux
	 * cas. L'application ne distingue pas, dans son code de rendu, “la ressource
	 * n'existe pas” de “la ressource existe mais vous n'y avez pas droit”. »
	 *
	 * Ce composant ne reçoit **ni ressource, ni raison, ni identifiant demandé** :
	 * il lit un chemin, un statut, et deux booléens d'écran posés par le chargeur
	 * du gabarit racine. Il n'a rien à quoi raccrocher une distinction, et une
	 * distinction ne peut donc pas s'y glisser plus tard sans qu'on lui ajoute
	 * une entrée — ce qu'aucun chargeur ne peut faire seul.
	 *
	 * C'est ce qui donne au point dur de `V-04:2219` — « une adresse inexistante
	 * et une note existante non publique doivent produire un rendu strictement
	 * identique : la vérification la plus importante de cette vue » — une forme
	 * qui ne dépend d'aucune discipline d'écriture.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * QUEL ÉCRAN, ET POURQUOI PAS TOUJOURS SELON LA SESSION
	 *
	 * La règle générale est « 404 + V-04 en anonyme, 404 + V-26 en connecté »
	 * (`docs/routes.md:90`). L'espace public y fait exception, et §5.5 l'écrit
	 * ligne par ligne : `/guides/{id}` non public rend **404 V-04 dans les quatre
	 * colonnes**, administrateur compris — conséquence directe d'`ARB-007` A-05,
	 * « la session ne change ni la route, ni la vue, ni les états ». Si la page
	 * servie ne change pas avec le cookie, la page d'échec ne le peut pas
	 * davantage. `vueDeLAdresseNonResolue()` porte la règle ; ce fichier
	 * l'applique.
	 *
	 * SANS DONNÉE DE GABARIT — chargeur en échec, rendu de secours — la lecture
	 * retombe sur `false` : l'écran public, sans action d'écriture. La fermeture
	 * par défaut de `RG-DRO-02` vaut aussi pour un affichage.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES DEUX POSITIONS DE PLANCHE SERVIES, ET LES QUATRE QUI NE LE SONT PAS
	 *
	 * V-26 est passée en `inexistante` **explicitement** : sa position par défaut
	 * est la pierre tombale, qui affirme une suppression avec un auteur, une date
	 * et un motif écrits dans le gel. La servir serait `P-02` au carré. C'est
	 * aussi la seule dérogation admise à `RG-ACC-04` (`docs/routes.md:163`), et
	 * une dérogation ne se prend pas par défaut. `casDeV26()` porte le motif.
	 *
	 * V-04 distingue `nu` — `/guides` sans identifiant, « adresse racine
	 * erronée » (`docs/routes.md:103`) — de tout le reste. Cette adresse ne porte
	 * AUCUN identifiant de corpus : la distinguer ne révèle rien, et ne pas la
	 * distinguer effacerait un des trois cas déclarés par la planche.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * `notes={[]}` — CE QUI MANQUE, ET IL FAUT LE DIRE
	 *
	 * Les deux vues affichent des guides suggérés, et V-04 les quatre guides les
	 * plus consultés — « la sortie de secours ». Les leur passer demanderait de
	 * lire le corpus entier à CHAQUE requête du produit, ce canal étant le
	 * chargeur du gabarit racine. Les listes sont donc vides plutôt que fausses
	 * (`P-02`), la lacune est comptée à `LACUNES_DU_CHEMIN_PUBLIC` et remontée au
	 * rapport du lot. La contrepartie est une propriété : la réponse ne dépend
	 * d'aucune donnée de la ressource demandée.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * TOUT AUTRE STATUT QUE 404 — ÉTAT NON MAQUETTÉ, DÉCLARÉ
	 *
	 * Aucune maquette, aucun arbitrage et aucune ligne de `docs/routes.md` ne
	 * décrivent une page d'erreur de serveur : les deux seuls écrans d'erreur du
	 * gel disent « cette page n'est pas accessible », ce qui serait faux d'un
	 * 500. Le rendu de secours est donc réduit au statut et au message que le
	 * cadre fournit, sans classe ni valeur de style — rien n'y est inventé au-delà
	 * de ce minimum, et le vide est remonté au rapport plutôt que comblé.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * UNE SEULE FEUILLE LIÉE, PAR LA TÊTE DU DOCUMENT
	 *
	 * Le croisement entre les deux feuilles a été mesuré avant d'écrire :
	 * `V-04.css` atteint **30 règles** du balisage de V-26, `V-26.css` en atteint
	 * **34** de celui de V-04 — `.carte`, `.resultats`, `.introuvable`,
	 * `.adresse-demandee`, et `.app` que V-26 porte par sa coquille. Les lier
	 * ensemble ferait peindre chaque écran par la feuille de l'autre. La feuille
	 * est donc liée conditionnellement, par l'adresse que Vite émet pour elle,
	 * dans `<svelte:head>` — le canal que `P-19` désigne. Les deux fichiers
	 * restent identiques à l'octet à leur source gelée (P-6.3) : ils ne sont pas
	 * édités, seulement liés.
	 */
	import { page } from '$app/state';
	import VuePublique from '../vues/V-04.svelte';
	import VueConnectee from '../vues/V-26.svelte';
	import feuillePublique from '../vues/V-04.css?url';
	import feuilleConnectee from '../vues/V-26.css?url';
	import { casDeV04, casDeV26, vueDeLAdresseNonResolue } from '$lib/donnees/public';
	import { onMount } from 'svelte';
	import { cablerLaPageDErreur } from './cablage-erreur';

	const donnees = $derived(
		page.data as {
			session?: boolean;
			ecriture?: boolean;
			compte?: { nom: string; initiales: string; role: string; domaine: string } | null;
			domaines?: readonly { nom: string; univers: string; couleur: string }[];
			portailAssistance?: string;
		}
	);
	const session = $derived(donnees.session === true);
	const ecriture = $derived(donnees.ecriture === true);
	/**
	 * SANS DONNÉE DE GABARIT — chargeur en échec, rendu de secours —, la chaîne
	 * vide : V-04 n'émet alors pas le bouton, plutôt que de retomber sur le
	 * domaine d'exemple du jeu de démonstration. Un lien d'assistance qui pointe
	 * vers `exemple.fr` est pire que pas de lien.
	 */
	const portail = $derived(donnees.portailAssistance ?? '');

	const nonResolue = $derived(page.status === 404);
	const vue = $derived(vueDeLAdresseNonResolue(page.url.pathname, session));

	/* LE CÂBLAGE DES TROIS GESTES DE LA PAGE — `ARB-063`, depuis la route.
	   V-04 et V-26 les portent aux mêmes identifiants, à un près : le champ est
	   `#saisie` ici, `#rech` là. `cablerLaPageDErreur` cherche les deux. */
	onMount(() => {
		if (!nonResolue) return;
		return cablerLaPageDErreur(document, { creationPossible: ecriture });
	});
</script>

<svelte:head>
	{#if nonResolue}<link
			rel="stylesheet"
			href={vue === 'V-26' ? feuilleConnectee : feuillePublique}
		/>{/if}
</svelte:head>

{#if nonResolue}
	{#if vue === 'V-26'}
		<!-- Le compte et les domaines viennent du gabarit racine, qui les lit en
		     base : sans eux, la page d'adresse non résolue affichait l'identité et
		     le rangement du jeu de semence — « Karim Belhadj », « Infrastructure »
		     — sur une instance qui ne les a jamais portés. -->
		<!--
			L'ADRESSE DEMANDÉE, ET C'EST LA SEULE ENTRÉE D'`adresseNonResolue()`.
			Les deux vues n'avaient aucune propriété pour la recevoir et retombaient
			sur les tables d'adresses de leurs planches : toute adresse cassée de
			l'instance annonçait celle d'une note de démonstration, et le bouton
			« Créer la note » de V-26 ouvrait l'éditeur avec ce titre-là, prêt à être
			enregistré en base. C'est un CHEMIN qui descend, jamais une raison —
			`ADR-007` reste tenu : les deux cas rendent le même écran.
		-->
		<VueConnectee
			vecteur={{ cas: casDeV26(), droits: ecriture ? 'ecriture' : 'lecture' }}
			notes={[]}
			adresse={page.url.pathname}
			{...donnees.session === true ? { reprises: [] } : {}}
			{...donnees.compte === null || donnees.compte === undefined
				? {}
				: { compte: donnees.compte as never }}
			{...donnees.domaines === undefined ? {} : { domaines: donnees.domaines as never }}
		/>
	{:else}
		<VuePublique
			vecteur={{ cas: casDeV04(page.url.pathname) }}
			notes={[]}
			adresse={page.url.pathname}
			{portail}
		/>
	{/if}
{:else}
	<h1>{page.status}</h1>
	<p>{page.error?.message}</p>
{/if}
