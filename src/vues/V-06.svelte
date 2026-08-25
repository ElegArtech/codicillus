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
	 * « Ouvrir un ticket d'assistance » garde sa destination : la table
	 * `parametres` porte l'adresse du portail sous la clé `portail_assistance`,
	 * et elle arrive par la propriété `portail`. Elle n'est pas fabriquée ici —
	 * c'est une donnée d'instance, pas une constante.
	 */
	import { resolve } from '$app/paths';
	import Marque from '$lib/auth/Marque.svelte';
	import { CONFIG } from '../../seeds/corpus';

	interface Proprietes {
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — donnée d'INSTANCE, lue dans la table
		 * `parametres` par le chargeur de la route. Absente, la valeur du jeu de
		 * semence, qui est celle que la semence écrit en base.
		 */
		portail?: string;
	}

	const { portail = CONFIG.portailAssistance }: Proprietes = $props();
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
					console des comptes. Il vous remet le mot de passe provisoire en main propre&nbsp;; vous
					le remplacerez ensuite depuis votre profil.
				</p>

				<a
					class="btn btn--principal"
					href={resolve('/connexion')}
					style="width:100%;padding:11px;justify-content:center"
					data-vers="connexion">Revenir à la connexion</a
				>
			</section>
		</div>

		<div class="auth__pied">
			<p>Besoin d'aide pour retrouver votre accès&nbsp;?</p>
			<a class="btn" href={portail} id="assistance">Ouvrir un ticket d'assistance</a>
		</div>
	</div>
</main>
