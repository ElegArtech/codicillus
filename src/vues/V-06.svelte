<script lang="ts">
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
