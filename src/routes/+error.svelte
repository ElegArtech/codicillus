<script lang="ts">
	/**
	 * TOUTE ADRESSE NON RÉSOLUE — V-04 (public) et V-26 (connecté). « Pas de route
	 * propre : réponse 404 rendue à l'adresse demandée », ce qui dans SvelteKit désigne
	 * ce fichier.
	 *
	 * `ADR-007` — LE CHEMIN DE CODE EST UNIQUE, ET CE FICHIER EN EST LA PREUVE : il ne
	 * reçoit NI RESSOURCE, NI RAISON, NI IDENTIFIANT DEMANDÉ, seulement un chemin, un
	 * statut et deux booléens d'écran. Une distinction ne peut pas s'y glisser plus tard
	 * sans qu'on lui ajoute une entrée.
	 *
	 * QUEL ÉCRAN, ET POURQUOI PAS TOUJOURS SELON LA SESSION : `/guides/{id}` non public
	 * rend 404 V-04 dans les QUATRE colonnes — si la page servie ne change pas avec le
	 * cookie (`ARB-007` A-05), la page d'échec ne le peut pas davantage. SANS DONNÉE DE
	 * GABARIT la lecture retombe sur `false` : l'écran public, sans action d'écriture.
	 *
	 * V-26 EST PASSÉE EN `inexistante` EXPLICITEMENT : sa position par défaut est la
	 * pierre tombale, qui affirme une suppression avec auteur, date et motif écrits dans
	 * le gel — la seule dérogation admise à `RG-ACC-04`, et une dérogation ne se prend
	 * pas par défaut.
	 *
	 * `notes={[]}` ET `pistes={[]}` : les passer demanderait de lire le corpus entier à
	 * CHAQUE requête du produit, et les listes sont vides plutôt que fausses (`P-02`).
	 * UNE SEULE FEUILLE LIÉE, PAR LA TÊTE DU DOCUMENT (`P-19`) — `V-04.css` atteint 30
	 * règles du balisage de V-26 et `V-26.css` 34 de celui de V-04.
	 */
	import { page } from '$app/state';
	import VuePublique from '../vues/V-04.svelte';
	import VueConnectee from '../vues/V-26.svelte';
	import feuillePublique from '../vues/V-04.css?url';
	import feuilleConnectee from '../vues/V-26.css?url';
	import { resolve } from '$app/paths';
	import { casDeV26, vueDeLAdresseNonResolue } from '$lib/donnees/public';
	import { onMount } from 'svelte';
	import { cablerLaPageDErreur } from './cablage-erreur';

	const donnees = $derived(
		page.data as {
			session?: boolean;
			ecriture?: boolean;
			portailAssistance?: string;
		}
	);
	const session = $derived(donnees.session === true);
	const ecriture = $derived(donnees.ecriture === true);
	/**
	 * SANS DONNÉE DE GABARIT, LA CHAÎNE VIDE : V-04 n'émet alors pas le bouton,
	 * plutôt que de retomber sur le domaine d'exemple du jeu de démonstration. Un
	 * lien d'assistance qui pointe vers `exemple.fr` est pire que pas de lien.
	 */
	const portail = $derived(donnees.portailAssistance ?? '');

	const nonResolue = $derived(page.status === 404);

	/**
	 * CE QUE LA PAGE DE PANNE ÉCRIT. Le message du serveur est repris tel quel quand
	 * il en est un ; « Internal Error » est le repli de SvelteKit, il ne nomme rien et
	 * la phrase de repli le remplace. Rien n'est inventé sur la CAUSE : le seul fait
	 * que cette page connaisse est que la donnée n'a pas été perdue.
	 */
	const REPLI_DE_PANNE =
		'Une des sources de cette page n’a pas répondu. Rien n’est perdu : le contenu ' +
		'est intact, seule son ouverture a échoué. Réessayez — si l’échec se répète, ' +
		'signalez-le à un administrateur.';
	const message = $derived.by(() => {
		const servi = page.error?.message;
		return servi === undefined || servi === 'Internal Error' ? REPLI_DE_PANNE : servi;
	});
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
		<!--
			NI `compte` NI `domaines` NE SONT PASSÉS, ET CE N'EST PAS UN OUBLI.

			Ils l'étaient, par deux `as never` : les formes de V-26 les typent depuis
			`seeds/corpus.ts`, où `nom` est l'union des trois noms du jeu, et
			l'assertion faisait taire l'écart. `as never` est assignable à tout —
			c'est-à-dire qu'AUCUNE vérification ne restait au seul site de montage de
			la vue, sous la propriété même dont ce lot venait de changer le type.

			Le canal juste existe déjà et il est unique : `+layout.svelte` pose
			l'identité et le rangement RÉELS dans le contexte de coquille, et
			`Coquille.svelte` les y lit avant de regarder ses propriétés
			(`identite?.compte ?? compte`). La page d'erreur est rendue dans ce
			gabarit ; elle n'a donc rien à recopier. Sans contexte — rendu de secours
			—, la vue retombe sur son identité VIDE et sur aucun domaine, jamais sur
			« Karim Belhadj » ni « Infrastructure ».
		-->
		<!--
			L'ADRESSE DEMANDÉE, ET C'EST LA SEULE ENTRÉE D'`adresseNonResolue()`.
			Les deux vues n'avaient aucune propriété pour la recevoir et retombaient
			sur les tables d'adresses de leurs planches : toute adresse cassée de
			l'instance annonçait celle d'une note de démonstration, et le bouton
			« Créer la note » de V-26 ouvrait l'éditeur avec ce titre-là, prêt à être
			enregistré en base. C'est un CHEMIN qui descend, jamais une raison —
			`ADR-007` reste tenu : les deux cas rendent le même écran.
		-->
		<!--
			LE MESSAGE D'AMORÇAGE, ENFIN PEINT. Il descendait déjà dans la réponse
			HTTP, et cette branche ne le rendait nulle part : seule la branche
			NON-404, plus bas, affichait `page.error.message`. Le serveur disait
			« créez un univers, puis un domaine, dans la console », l'écran
			répondait « l'adresse demandée ne correspond à aucune note ».

			Il ne voyage qu'avec le drapeau `amorcage`, posé par `refusDEcriture()`
			au seul administrateur d'une instance qui n'a pas encore de quoi ranger
			une note. Sans lui, la vue rend sa réponse habituelle, et les deux cas
			d'`ADR-007` restent indiscernables.
		-->
		<VueConnectee
			vecteur={{ cas: casDeV26(), droits: ecriture ? 'ecriture' : 'lecture' }}
			notes={[]}
			adresse={page.url.pathname}
			pistes={[]}
			amorcage={page.error?.amorcage === true ? (page.error.message ?? '') : ''}
		/>
	{:else}
		<!--
			V-04 N'A PLUS DE VECTEUR DE PLANCHE : son unique lecteur était la table
			d'adresses de la maquette, qui a disparu avec elle. `adresse` est
			désormais EXIGÉE par les deux vues, et le chemin demandé est la seule
			chose qui descend.
		-->
		<VuePublique notes={[]} adresse={page.url.pathname} pistes={[]} {portail} />
	{/if}
{:else}
	<!--
		TOUT CE QUI N'EST PAS UNE ADRESSE NON RÉSOLUE — la panne. `RG-M04-07` exige
		d'un état d'erreur « un message ET une possibilité de réessayer » ; ces deux
		lignes n'en donnaient aucun des deux. Mesuré, moteur de recherche éteint :
		l'écran servi était « 500 » puis « Internal Error », sans style, sans phrase et
		sans issue — un cul-de-sac où le seul geste restant est le bouton du
		navigateur.

		LE MESSAGE DU SERVEUR EST RENDU S'IL EN EST UN, jamais inventé : `error()` en
		pose un délibéré, et SvelteKit retombe sinon sur « Internal Error », qui
		n'apprend rien à personne. Dans ce cas, la phrase de repli dit ce qui est vrai
		— la panne est du côté du service, la donnée n'est pas perdue.

		DEUX SORTIES, PARCE QU'IL EN FAUT UNE QUI MARCHE TOUJOURS : réessayer la même
		adresse, et revenir à l'accueil si la panne y persiste. `socle.css` est chargé
		par le gabarit racine : les classes employées ici sont peintes sans feuille
		supplémentaire.
	-->
	<main class="panne">
		<p class="panne__code">Erreur {page.status}</p>
		<h1 class="panne__titre">Cette page n'a pas pu être affichée</h1>
		<p class="panne__txt">
			{message}
		</p>
		<div class="panne__gestes">
			<button class="btn btn--principal" type="button" onclick={() => globalThis.location.reload()}
				>Réessayer</button
			>
			<a class="btn" href={resolve('/')}>Revenir à l'accueil</a>
		</div>
	</main>
{/if}

<style>
	.panne {
		max-width: 44rem;
		margin: 0 auto;
		padding: 96px 24px;
	}
	.panne__code {
		margin: 0 0 8px;
		font-size: 13px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--c-encre-3);
	}
	.panne__titre {
		margin: 0 0 12px;
		font-size: 26px;
		line-height: 1.25;
		color: var(--c-encre);
	}
	.panne__txt {
		margin: 0 0 24px;
		color: var(--c-encre-2);
		line-height: 1.55;
	}
	.panne__gestes {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>
