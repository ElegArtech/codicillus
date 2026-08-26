<script lang="ts">
	/**
	 * V-05 — Connexion. Route `/connexion`, niveau d'accès anonyme
	 * (`docs/routes.md` §3.2).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE CE COMPOSANT NE PROUVE PAS, ET IL FAUT LE DIRE EN PREMIER
	 *
	 * Il rend un ÉTAT DE MAQUETTE. Il n'authentifie personne, n'ouvre aucune
	 * session, ne compte aucune tentative et ne ralentit rien. `RG-M16-01`
	 * (politique de mot de passe), `RG-ACC-03`, `RG-ACC-04` et `RG-NF-07`
	 * (temporisation après échecs) NE SONT PAS TENUES par ce lot, et aucune
	 * propriété de sécurité ne l'est davantage. Le verrouillage « Trop de
	 * tentatives » du gel est un COMPORTEMENT TEMPORISÉ : ARB-011 l'exclut du
	 * squelette, et `CLAUDE.md` §4 range tout comportement temporisé parmi les
	 * interdictions de conclure.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PAS DE COQUILLE — `node verif/releve-vues.mjs --coquille`
	 *
	 * V-01 à V-06 et V-09 n'en portent pas (`docs/releve-vues.md` §5.1) : la
	 * page est autonome, `$lib/coquille` n'est pas employé, et il n'y a NI lien
	 * d'évitement NI fil d'Ariane — le relevé donne « — » aux deux colonnes.
	 * L'enveloppe est `<main class="auth" id="app">`, et rien d'autre.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES SIX ÉTATS, ET CE QUE LA PLANCHE ATTEINT RÉELLEMENT — MESURÉ
	 *
	 * `reglerPlanche()` applique le vecteur complet mais n'émet `change` que sur
	 * un bouton QUI N'EST PAS DÉJÀ COCHÉ (`capture.mjs` du banc). Or les deux
	 * gestionnaires de la planche du gel (`V-05:831` et `V-05:839`) rappellent
	 * l'UN ET L'AUTRE `afficherContexte(arrivee)` : le contrôle « Issue de la
	 * tentative » ne peint donc rien. Il déclenche une soumission différée de
	 * 850 ms que seul un clic sur « Se connecter » emprunte, et le banc ne clique
	 * pas.
	 *
	 * (Le chemin complet du module du banc n'est volontairement PAS cité :
	 * depuis T-070 cette vue est servie par une route réelle, donc BÂTIE, et
	 * `verif:demo:hors-production` cherche cette chaîne en texte brut dans le
	 * produit construit — commentaires compris. Écart É-2 du lot T-070.)
	 *
	 * RELEVÉ AU NAVIGATEUR, dans les conditions du banc — six états, TROIS
	 * écrans distincts :
	 *
	 *   arrivee-protegee · issue-succes · issue-echec · issue-trop  → identiques
	 *   arrivee-expiree                                             → distinct
	 *   arrivee-directe                                             → distinct
	 *
	 * Le scénario ne marque `identiqueA` que sur `issue-succes`, dont le vecteur
	 * égale le réglage par défaut ; `issue-echec` et `issue-trop` ont un vecteur
	 * distinct et un rendu identique. LE RENDU NE DÉPEND QUE DE `arrivee`.
	 *
	 * Aucun élément n'est focalisé sur aucun des six états : l'`autofocus` du gel
	 * est perdu à la stabilisation du banc (`CLAUDE.md` §6, P-4) — vérifié des
	 * DEUX côtés, la référence sort `document.activeElement === document.body`.
	 * Il est porté ici parce que le gel le porte, non pour obtenir un anneau.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT — ARB-011
	 *
	 * Révélation du mot de passe, avertissement de verrouillage des majuscules,
	 * marquage d'erreur des champs, rouet d'attente, décompte de l'attente et
	 * notifications de sortie sont du comportement : ils relèvent de T-017. Le
	 * squelette rend l'état que la référence montre à l'instant capturé, et
	 * `div.notifs` reste vide — la référence le montre vide sur les six états.
	 *
	 * LES ADRESSES DU GEL SONT DÉSORMAIS DE VRAIES ADRESSES. `ARB-013` retire les
	 * lignes `/url:` de la comparaison de structure précisément pour que le
	 * produit porte SES adresses ; la campagne de câblage du 21/08/2026 lève la
	 * réserve qui les avait laissées à `#`, et c'est la seule modification
	 * qu'elle autorise dans une vue. Elles passent toutes par `resolve()`.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-05.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-05 --installer`, identique à l'octet au
	 * second bloc `<style>` de la maquette. Les deux `style=` du fichier —
	 * `width:100%;padding:11px` et `margin-top:var(--e-4);justify-content:center`
	 * — figurent à l'ensemble clos du gel (ARB-016, P-6.4).
	 *
	 * LE JEU DE SEMENCE EST VIDE, ET C'EST DÉCLARÉ. `VARIANTE_PAR_VUE` range
	 * V-05 dans la variante « vide » (`seeds/corpus.ts`) : le mode démo passe
	 * bien `notes`, mais `corpusPourVue('V-05')` rend zéro note. La propriété
	 * n'est donc pas déclarée — `svelte/no-unused-props` refuse une propriété
	 * déclarée et non employée, et la déclarer pour l'ignorer serait mentir sur
	 * ce que cette vue consomme. Aucune donnée de maquette n'est saisie ici :
	 * V-05 n'en affiche aucune.
	 *
	 * VOCABULAIRE : aucun des douze termes contractuels n'apparaît dans cette
	 * vue ; rien à y contrôler (P-07).
	 */
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import Marque from '$lib/auth/Marque.svelte';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/**
		 * CE QUE LE SERVEUR A REFUSÉ, quand il a refusé. Absent : rien n'a été
		 * soumis, et le bloc de contexte reste celui de l'arrivée.
		 */
		refus?: Contexte | null;
	}

	const { vecteur, refus = null }: Proprietes = $props();

	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation`
	 * de la table `parametres`, descendue par le contexte de coquille.
	 *
	 * CET ÉCRAN DEMANDAIT « les identifiants de votre compte DE LA DIRECTION
	 * TECHNIQUE ». Ce n'était pas une donnée du jeu de démonstration : c'était
	 * le SEGMENT DE MARCHÉ du cadrage, écrit dans la phrase d'accueil de l'écran
	 * de connexion — c'est-à-dire adressé à chaque personne qui entre dans le
	 * produit, sur une instance qui n'est pas celle-là.
	 *
	 * CHAÎNE VIDE = L'INSTANCE NE S'EST PAS NOMMÉE, et c'est l'état normal d'une
	 * installation neuve : le titre retombe alors sur « Connexion » seul, qui ne
	 * nomme personne et reste vrai partout. Même rendu hors gabarit racine, où
	 * `getContext` ne trouve rien.
	 *
	 * ═════════════════════════════════════════════════════════════════════
	 * OÙ LE NOM SE POSE, ET POURQUOI PAS DANS LA PHRASE.
	 *
	 * La phrase du gel gouverne le nom par une préposition ET un article — « de
	 * votre compte DE LA direction technique ». Un nom d'organisation n'apporte
	 * pas son article : « de votre compte de la Mairie de Sainte-Foy » demande
	 * un article que rien ne nous donne, « de votre compte Mairie de Sainte-Foy »
	 * le supprime et casse la phrase du gel. Aucune recomposition ne tient pour
	 * tous les noms.
	 *
	 * ON NE MET DONC RIEN DANS LA PHRASE : elle reste celle du gel moins son
	 * complément, vraie sur toute instance. Le nom se pose en JUXTAPOSITION dans
	 * le titre — « Connexion · <organisation> » —, la forme que la signature de
	 * pied emploie déjà partout et qui ne gouverne rien.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');
	/** « Connexion · <organisation> », ou « Connexion » seul. */
	const titre = $derived(nomOrganisation === '' ? 'Connexion' : `Connexion · ${nomOrganisation}`);

	/**
	 * Le message contextuel, tel que `ARRIVEES` du gel le déclare (`V-05:667`).
	 * `directe` y vaut `null` : le bandeau est alors MASQUÉ, sans que sa classe
	 * ni son contenu ne changent — `afficherContexte()` sort avant de les
	 * toucher (`V-05:683`). Le port garde donc les valeurs du balisage.
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
	 * LE REFUS L'EMPORTE SUR L'ARRIVÉE, et il fallait qu'il l'emporte.
	 *
	 * Une identification refusée rendait `401`, la page se réaffichait à
	 * l'identique, les champs vidés, et RIEN ne le disait : de l'utilisateur, ça
	 * s'appelle « je clique et rien ne se passe ». Le gel, lui, a les deux
	 * messages — `echec()` et `verrouiller()`, `mockups/V-05-connexion.html:697`
	 * et `:712` — et il les écrit dans ce même bloc de contexte.
	 *
	 * Les mots sont ceux du gel, à la lettre. `RG-ACC-04` tient : un seul et même
	 * message quelle que soit la cause, et aucun marquage d'un champ plutôt que
	 * de l'autre — ni l'existence de l'identifiant ni la validité du mot de passe
	 * ne sont révélées.
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
				`method="post"` EST DANS LE BALISAGE, ET C'EST UNE QUESTION DE SÛRETÉ.

				Les trois champs portent leur `name` depuis le lot de liaison. Un
				formulaire sans méthode soumet en **GET** : tant que l'hydratation n'a
				pas eu lieu, une soumission envoyait donc
				`…/connexion?identifiant=…&motdepasse=…` — le mot de passe dans
				l'adresse, donc dans l'historique du navigateur et dans les journaux du
				frontal. Mesuré sur le HTML servi.

				La parade a d'abord été posée par le câblage, dans `onMount` : elle
				n'existait pas AVANT lui, ce qui est exactement la fenêtre du défaut.
				C'est `P-5` — une règle qu'aucun cas n'exerçait. Elle est donc dans le
				balisage, où aucune fenêtre ne subsiste.

				DIVERGENCE ASSUMÉE AVEC LE GEL : `mockups/V-05-connexion.html` n'écrit
				pas cet attribut. Il ne déplace aucun pixel, ne change aucun nom
				accessible et n'ajoute aucun nœud ; il fait ce que la maquette
				décrivait sans pouvoir le dire, faute de serveur.
			-->
			<form class="auth__form" id="form" method="post" novalidate>
				<fieldset id="champs">
					<div class="champ" id="champ-id">
						<label class="champ__label" for="identifiant">Identifiant</label>
						<!--
							`autofocus` est PORTÉ PARCE QUE LE GEL LE PORTE, et il ne peint
							rien : hors dialogue révélé, il ne survit pas à `stabiliser()`
							(`CLAUDE.md` §6, P-4). Mesuré des deux côtés — la référence sort
							elle aussi sans élément actif.
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
							Avertissement de verrouillage majuscules : la première cause
							d'échec de saisie sur un poste tiers. Rendu MASQUÉ, comme le gel
							le montre — son apparition est un comportement (ARB-011).
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
