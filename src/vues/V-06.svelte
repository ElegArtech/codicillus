<script lang="ts">
	/**
	 * V-06 — Mot de passe oublié. UNE SEULE ROUTE, `/mot-de-passe-oublie`.
	 * `docs/routes.md` §3.2 en déclarait une seconde, `…/{jeton}`, qui rendait le
	 * même écran sans lire son paramètre ; aucun lien n'étant jamais émis, elle a
	 * été retirée.
	 *
	 * POURQUOI LE PARCOURS EN QUATRE ÉTAPES N'EST PLUS RENDU. Le gel dessine un
	 * parcours guidé — identifiant, envoi d'un lien, nouveau mot de passe,
	 * confirmation —, or LE PRODUIT N'A AUCUN EXPÉDITEUR DE COURRIEL et aucune table
	 * ne porte de jeton de réinitialisation : l'action de la route répondait `501` à
	 * l'utilisateur qui soumettait son identifiant, sur LA SEULE PORTE DE SECOURS
	 * d'un compte dont on a perdu l'accès. Ce qui n'a pas de contrepartie n'est pas
	 * ÉMIS ; l'écran NOMME LE CHEMIN QUI EXISTE — la réinitialisation par un
	 * administrateur, que `cadrage/STACK-TECHNIQUE.md:472` range parmi les trois
	 * issues prévues.
	 *
	 * SONT DONC RETIRÉS, ET NON MASQUÉS : la saisie d'identifiant, les quatre jalons,
	 * l'écran d'envoi, la saisie d'un nouveau mot de passe, la confirmation, et
	 * l'écran « Lien expiré » — qui affirmait qu'un lien avait existé.
	 *
	 * CE QUE L'ÉCRAN AFFIRME S'ARRÊTE OÙ LA CERTITUDE S'ARRÊTE. Il disait « vous le
	 * remplacerez ensuite depuis votre profil » ; un compte dont
	 * `comptes.mot_de_passe_verrouille` est posée se voit REFUSER ce remplacement.
	 * Or cet écran est ANONYME : il ne sait pas à quel compte il parle et ne peut
	 * donc pas trancher.
	 *
	 * `RG-ACC-04` est tenue plus solidement qu'avant : l'écran ne demande plus rien
	 * et n'interroge aucun annuaire, donc la réponse est la même pour tout visiteur,
	 * sans lecture en base ni écart de temps mesurable.
	 *
	 * PAS DE COQUILLE : V-01 à V-06 et V-09 n'en portent pas
	 * (`docs/releve-vues.md` §5.1).
	 *
	 * « OUVRIR UN TICKET D'ASSISTANCE » N'EST ÉMIS QUE S'IL MÈNE QUELQUE PART :
	 * `CONFIGURATION_PAR_DEFAUT` laisse `portail_assistance` VIDE, et le lien
	 * portait alors une destination vide — le seul geste actionnable restant de la
	 * SEULE porte de secours. Le pied entier, la question comme le bouton, n'est
	 * rendu que si l'adresse existe.
	 */
	import { resolve } from '$app/paths';
	import Marque from '$lib/auth/Marque.svelte';

	interface Proprietes {
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — donnée d'INSTANCE, lue dans la table
		 * `parametres` et TOUJOURS passée : la propriété est EXIGÉE. Vide, le pied
		 * d'assistance n'est pas rendu.
		 */
		portail: string;
	}

	const { portail }: Proprietes = $props();

	/** Une adresse absente ou blanche ne mène nulle part : rien ne l'annonce. */
	const assistanceJoignable = $derived(portail.trim() !== '');
</script>

<!--
	L'ADRESSE DU PORTAIL D'ASSISTANCE EST EXTERNE, et `resolve()` ne s'y applique
	pas : elle composerait une adresse INTERNE sous la racine de déploiement. La
	règle est levée pour ce fichier, et pour elle seule — même levée qu'en
	`V-03.svelte`.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<main class="auth" id="app" data-etape="indisponible">
	<div class="auth__colonne">
		<Marque />

		<div class="auth__boite">
			<section class="etape" data-etape="indisponible" data-active="oui">
				<h1 class="auth__titre">Mot de passe oublié</h1>

				<div class="contexte contexte--info" style="margin-bottom:var(--e-4)">
					<span class="contexte__marque" aria-hidden="true">i</span>
					<div>
						<div class="contexte__titre">Cette instance n'envoie aucun courriel</div>
						<div>
							Aucun lien de réinitialisation ne peut vous être adressé, et aucune adresse ne reçoit
							de message de ce produit.
						</div>
					</div>
				</div>

				<p class="auth__sous">
					Votre mot de passe se fait réinitialiser <strong>par un administrateur</strong>, depuis la
					console des comptes. Il vous remet en main propre celui qu'il a posé.
				</p>

				<a
					class="btn btn--principal"
					href={resolve('/connexion')}
					style="width:100%;padding:11px;justify-content:center"
					data-vers="connexion">Revenir à la connexion</a
				>
			</section>
		</div>

		{#if assistanceJoignable}
			<div class="auth__pied">
				<p>Besoin d'aide pour retrouver votre accès&nbsp;?</p>
				<a class="btn" href={portail} id="assistance">Ouvrir un ticket d'assistance</a>
			</div>
		{/if}
	</div>
</main>
