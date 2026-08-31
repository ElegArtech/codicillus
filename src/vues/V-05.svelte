<script lang="ts">
	/**
	 * V-05 — Connexion. Route `/connexion`, niveau d'accès anonyme
	 * (`docs/routes.md` §3.2).
	 *
	 * PAS DE COQUILLE : V-01 à V-06 et V-09 n'en portent pas
	 * (`docs/releve-vues.md` §5.1) — ni lien d'évitement, ni fil d'Ariane.
	 * L'enveloppe est `<main class="auth" id="app">`, et rien d'autre.
	 *
	 * LE RENDU NE DÉPEND QUE DE `arrivee` : les deux gestionnaires de la planche du
	 * gel (`V-05:831`, `V-05:839`) rappellent l'un et l'autre
	 * `afficherContexte(arrivee)`, et le contrôle « Issue de la tentative » ne peint
	 * donc rien — il déclenche une soumission différée que seul un clic emprunte.
	 *
	 * `autofocus` est porté PARCE QUE LE GEL LE PORTE, non pour obtenir un anneau :
	 * hors dialogue révélé, il ne survit pas à la stabilisation.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (`ARB-011`) : révélation du mot de passe,
	 * avertissement de verrouillage des majuscules, marquage d'erreur, rouet
	 * d'attente et décompte relèvent du câblage. `div.notifs` reste vide.
	 *
	 * AUCUNE DONNÉE N'EST SAISIE ICI, et `notes` n'est pas déclarée : V-05 n'affiche
	 * aucune note, et `svelte/no-unused-props` refuse une propriété déclarée et non
	 * employée.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-05.css` ; les deux `style=`
	 * du fichier figurent à l'ensemble clos du gel.
	 */
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import Marque from '$lib/auth/Marque.svelte';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		/**
		 * CE QUE LE SERVEUR A REFUSÉ, quand il a refusé. Absent : rien n'a été soumis,
		 * et le bloc de contexte reste celui de l'arrivée.
		 */
		refus?: Contexte | null;
	}

	const { vecteur, refus = null }: Proprietes = $props();

	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation` de la
	 * table `parametres`, descendue par le contexte de coquille.
	 *
	 * CET ÉCRAN DEMANDAIT « les identifiants de votre compte DE LA DIRECTION
	 * TECHNIQUE » : le segment de marché du cadrage, écrit dans la phrase d'accueil
	 * de l'écran de connexion — adressé à chaque personne qui entre dans le produit.
	 *
	 * ON NE MET RIEN DANS LA PHRASE, ET C'EST LA PRÉPOSITION QUI L'INTERDIT : le gel
	 * gouverne le nom par « de votre compte DE LA … », et un nom d'organisation
	 * n'apporte pas son article — aucune recomposition ne tient pour tous les noms.
	 * La phrase reste celle du gel moins son complément, et le nom se pose en
	 * JUXTAPOSITION dans le titre, forme que la signature de pied emploie déjà.
	 *
	 * CHAÎNE VIDE = L'INSTANCE NE S'EST PAS NOMMÉE : le titre retombe sur
	 * « Connexion » seul, qui ne nomme personne et reste vrai partout.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');
	const titre = $derived(nomOrganisation === '' ? 'Connexion' : `Connexion · ${nomOrganisation}`);

	/**
	 * Le message contextuel, tel que `ARRIVEES` du gel le déclare (`V-05:667`).
	 * `directe` y vaut `null` : le bandeau est alors MASQUÉ, sans que sa classe ni
	 * son contenu ne changent — `afficherContexte()` sort avant de les toucher
	 * (`V-05:683`). Le port garde donc les valeurs du balisage.
	 */
	interface Contexte {
		variante: string;
		marque: string;
		titre: string;
		txt: string;
	}
	const ARRIVEES: Record<string, Contexte | null> = {
		protegee: {
			variante: 'info',
			marque: 'i',
			titre: 'Vous devez être connecté pour accéder à cette page',
			txt: 'Après connexion, vous serez ramené là où vous alliez.'
		},
		expiree: {
			variante: 'info',
			marque: 'i',
			titre: 'Session expirée',
			txt: "Votre session a été fermée après une période d'inactivité. Reconnectez-vous pour reprendre."
		},
		directe: null
	};
	const AU_BALISAGE = ARRIVEES['protegee'] as Contexte;

	const arrivee = $derived(typeof vecteur?.arrivee === 'string' ? vecteur.arrivee : 'protegee');
	/**
	 * LE REFUS L'EMPORTE SUR L'ARRIVÉE, et il fallait qu'il l'emporte : une
	 * identification refusée rendait `401`, la page se réaffichait à l'identique,
	 * les champs vidés, et RIEN ne le disait. Le gel a les deux messages —
	 * `mockups/V-05-connexion.html:697` et `:712` — et il les écrit dans ce même
	 * bloc de contexte.
	 *
	 * Les mots sont ceux du gel, à la lettre. `RG-ACC-04` tient : un seul message
	 * quelle que soit la cause, et aucun marquage d'un champ plutôt que de l'autre.
	 */
	const contexte = $derived(refus ?? ARRIVEES[arrivee] ?? null);
	/** Masqué, mais toujours présent, et avec le contenu que le balisage porte. */
	const affiche = $derived(contexte ?? AU_BALISAGE);
</script>

<main class="auth" id="app" data-etat="repos">
	<div class="auth__colonne">
		<Marque />

		<!-- Message contextuel : pourquoi l'utilisateur se trouve ici. -->
		<div class="contexte contexte--{affiche.variante}" id="contexte" hidden={contexte === null}>
			<span class="contexte__marque" aria-hidden="true">{affiche.marque}</span>
			<div>
				<div class="contexte__titre" id="contexte-titre">{affiche.titre}</div>
				<div id="contexte-txt">{affiche.txt}</div>
			</div>
		</div>

		<div class="auth__boite">
			<h1 class="auth__titre">{titre}</h1>
			<p class="auth__sous">Utilisez les identifiants de votre compte.</p>

			<!--
				`method="post"` EST DANS LE BALISAGE, ET C'EST UNE QUESTION DE SÛRETÉ. Les
				trois champs portent leur `name` : un formulaire sans méthode soumet en GET,
				et tant que l'hydratation n'a pas eu lieu, une soumission envoyait donc le
				mot de passe DANS L'ADRESSE — donc dans l'historique du navigateur et dans
				les journaux du frontal. La parade avait d'abord été posée par le câblage,
				dans `onMount` : elle n'existait pas AVANT lui, ce qui est exactement la
				fenêtre du défaut.
				DIVERGENCE ASSUMÉE AVEC LE GEL, qui n'écrit pas cet attribut : il ne déplace
				aucun pixel et n'ajoute aucun nœud.
			-->
			<form class="auth__form" id="form" method="post" novalidate>
				<fieldset id="champs">
					<div class="champ" id="champ-id">
						<label class="champ__label" for="identifiant">Identifiant</label>
						<!--
							`autofocus` est PORTÉ PARCE QUE LE GEL LE PORTE, et il ne peint rien :
							hors dialogue révélé, il ne survit pas à la stabilisation.
						-->
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="saisie"
							type="text"
							id="identifiant"
							name="identifiant"
							autocomplete="username"
							autocapitalize="none"
							spellcheck="false"
							autofocus
							placeholder="prenom.nom"
						/>
					</div>

					<div class="champ" id="champ-mdp">
						<label class="champ__label" for="motdepasse">Mot de passe</label>
						<div class="champ__boite">
							<input
								class="saisie"
								type="password"
								id="motdepasse"
								name="motdepasse"
								autocomplete="current-password"
								spellcheck="false"
							/>
							<button
								class="champ__action"
								type="button"
								id="voir"
								aria-label="Afficher le mot de passe"
								aria-pressed="false"
							>
								<svg
									width="17"
									height="17"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									id="icone-voir"
								>
									<path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8z" /><circle
										cx="8"
										cy="8"
										r="1.8"
									/>
								</svg>
							</button>
						</div>
						<!--
							Avertissement de verrouillage majuscules : la première cause d'échec de
							saisie sur un poste tiers. Rendu MASQUÉ, comme le gel le montre.
						-->
						<div class="avis-saisie" id="majuscules" hidden>
							<svg
								width="13"
								height="13"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"><path d="M8 2.5L3 8h10L8 2.5zM4.5 11.5h7v2h-7z" /></svg
							>
							Le verrouillage des majuscules est activé
						</div>
					</div>

					<div class="auth__ligne">
						<label class="case">
							<!-- Le `name` accompagne les deux autres : l'action lit la PRÉSENCE de
								ce champ, jamais sa valeur (`+page.server.ts`). -->
							<input type="checkbox" id="souvenir" name="souvenir" />
							<span class="case__txt"
								>Se souvenir de moi
								<span class="case__aide">À éviter sur un poste partagé</span>
							</span>
						</label>
					</div>

					<button
						class="btn btn--principal"
						type="submit"
						id="valider"
						style="width:100%;padding:11px"
					>
						<span id="valider-txt">Se connecter</span>
					</button>
				</fieldset>
			</form>

			<div class="auth__ligne" style="margin-top:var(--e-4);justify-content:center">
				<a class="auth__lien" href={resolve('/mot-de-passe-oublie')} id="oublie"
					>Mot de passe oublié&nbsp;?</a
				>
			</div>
		</div>

		<div class="auth__pied">
			<p>Pas de compte&nbsp;? Les guides ouverts à tous restent consultables.</p>
			<a class="btn" href={resolve('/')} id="public"
				>Consulter la documentation publique sans compte</a
			>
		</div>
	</div>
</main>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
