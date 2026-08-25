<script lang="ts">
	/**
	 * V-06 — Mot de passe oublié. DEUX ROUTES pour une seule vue
	 * (`docs/routes.md` §3.2) : `/mot-de-passe-oublie` et
	 * `/mot-de-passe-oublie/{jeton}`. Elles rendent DÉSORMAIS le même écran, et
	 * c'est le seul que le produit puisse tenir.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * POURQUOI LE PARCOURS EN QUATRE ÉTAPES N'EST PLUS RENDU
	 *
	 * Le gel dessine un parcours guidé — identifiant, envoi d'un lien, nouveau
	 * mot de passe, confirmation — et son étape 1 promettait « vous recevrez un
	 * lien de réinitialisation sur votre adresse professionnelle ».
	 *
	 * LE PRODUIT N'A AUCUN EXPÉDITEUR DE COURRIEL — relevé sur le dépôt entier :
	 * aucune dépendance d'envoi, aucun appel d'envoi, aucune configuration de
	 * relais. Et aucune table ne porte de jeton de réinitialisation : le schéma
	 * porte `sessions` et `tentatives_de_connexion`, rien d'autre. Aucune des
	 * quatre étapes n'a donc de contrepartie, et l'action de la route répondait
	 * `501` à l'utilisateur qui soumettait son identifiant — sur LA SEULE PORTE
	 * DE SECOURS d'un compte dont on a perdu l'accès.
	 *
	 * Le geste retenu est celui que `+layout.svelte` fait déjà pour la donnée
	 * de synchronisation de V-07 : ce qui n'a pas de contrepartie N'EST PAS
	 * ÉMIS. La vue cesse de promettre le courriel et NOMME LE CHEMIN QUI
	 * EXISTE — la réinitialisation par un administrateur, servie par la console
	 * des comptes. `cadrage/STACK-TECHNIQUE.md:472` range cette issue parmi les
	 * trois prévues : « parcours de réinitialisation entièrement délégué à
	 * l'administrateur ».
	 *
	 * SONT DONC RETIRÉS, ET NON MASQUÉS : la saisie d'identifiant (un geste
	 * dessiné qui n'aboutissait nulle part), les quatre jalons du parcours,
	 * l'écran d'envoi, la saisie d'un nouveau mot de passe, l'écran de
	 * confirmation, et l'écran « Lien expiré » — qui affirmait qu'un lien avait
	 * existé et venait de se périmer.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE L'ÉCRAN AFFIRME S'ARRÊTE OÙ LA CERTITUDE S'ARRÊTE
	 *
	 * La réinitialisation par un administrateur vaut pour TOUT compte :
	 * l'action `reinitialiserLeMotDePasse` de `console/comptes` écrit le
	 * condensat sans consulter le moindre drapeau.
	 *
	 * LA SUITE, ELLE, NE VAUT PAS POUR TOUT LE MONDE, et l'écran a cessé de
	 * l'annoncer. Il disait « vous le remplacerez ensuite depuis votre
	 * profil » ; un compte dont la colonne `comptes.mot_de_passe_verrouille`
	 * est posée — un drapeau que la console offre à l'administrateur au
	 * moment de la création — se voit REFUSER ce remplacement :
	 * `changerLeMotDePasse` (`$lib/donnees/profil`) rend l'issue
	 * `verrouille` avant même de lire le condensat, et V-25 n'affiche alors
	 * aucun formulaire de mot de passe. Or CET ÉCRAN EST ANONYME : il ne sait
	 * pas à quel compte il parle, aucune propriété ne le lui dirait, et il ne
	 * peut donc pas trancher. Une phrase que l'écran ne peut pas vérifier est
	 * une promesse au même titre que le courriel — elle n'est pas émise.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * `RG-ACC-04` — LA NON-DIVULGATION EST TENUE, ET PLUS SOLIDEMENT QU'AVANT
	 *
	 * L'écran ne demande plus rien et n'interroge aucun annuaire. Il ne peut
	 * donc rien dire de l'existence d'un compte : la réponse est la même pour
	 * tout visiteur, sans lecture en base, sans écart de temps mesurable. La
	 * propriété n'est plus une chose à vérifier, elle est structurelle.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PAS DE COQUILLE — V-01 à V-06 et V-09 n'en portent pas
	 * (`docs/releve-vues.md` §5.1) : page autonome, ni lien d'évitement ni fil
	 * d'Ariane. L'enveloppe reste l'élément principal de classe `auth`, dont
	 * l'identifiant est `app`.
	 *
	 * « OUVRIR UN TICKET D'ASSISTANCE » N'EST ÉMIS QUE S'IL MÈNE QUELQUE PART.
	 * L'adresse du portail est une donnée d'INSTANCE — clé `portail_assistance`
	 * de la table `parametres` —, elle arrive par la propriété `portail`, et
	 * elle n'est pas fabriquée ici. Mais `CONFIGURATION_PAR_DEFAUT` la laisse
	 * VIDE, et la table est vide tant que personne ne l'a renseignée en
	 * console : sur une instance conforme au « produit qui commence vide », le
	 * lien portait une destination vide et le clic rechargeait le même écran —
	 * le seul geste actionnable restant de la SEULE porte de secours. Le pied
	 * entier, la question comme le bouton, n'est donc rendu que si l'adresse
	 * existe. Même règle que le reste de la vue : ce qui n'a pas de
	 * contrepartie n'est pas émis.
	 */
	import { resolve } from '$app/paths';
	import Marque from '$lib/auth/Marque.svelte';
	import { CONFIG } from '../../seeds/corpus';

	interface Proprietes {
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — donnée d'INSTANCE, lue dans la table
		 * `parametres` par le chargeur de la route. Absente, la valeur du jeu de
		 * semence, qui est celle que la semence écrit en base. VIDE — ce que rend
		 * `CONFIGURATION_PAR_DEFAUT` sur une instance dont personne n'a renseigné
		 * la clé —, le pied d'assistance n'est pas rendu.
		 */
		portail?: string;
	}

	const { portail = CONFIG.portailAssistance }: Proprietes = $props();

	/** Une adresse absente ou blanche ne mène nulle part : rien ne l'annonce. */
	const assistanceJoignable = $derived(portail.trim() !== '');
</script>

<!--
	L'ADRESSE DU PORTAIL D'ASSISTANCE EST EXTERNE, et `resolve()` ne s'y applique
	pas : elle compose une adresse INTERNE sous la racine de déploiement, quand
	celle-ci est une adresse absolue lue dans la table `parametres`. La règle est
	donc levée pour ce fichier, et pour elle seule — même levée que `V-03.svelte`,
	et pour la même raison. Tous les autres liens de la vue passent par
	`resolve()`.
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
