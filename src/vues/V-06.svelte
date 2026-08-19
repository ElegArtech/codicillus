<script lang="ts">
	/**
	 * V-06 — Réinitialisation du mot de passe. DEUX ROUTES pour une seule vue
	 * (`docs/routes.md` §3.2) : `/mot-de-passe-oublie` porte les étapes 1 et 2,
	 * `/mot-de-passe-oublie/{jeton}` porte les étapes 3 et 4 ainsi que le lien
	 * expiré. La seconde adresse est DÉRIVÉE de l'état `c-expire` de la planche
	 * — un lien expirable est un lien porteur d'un jeton —, elle n'est pas lue
	 * dans la maquette, qui ne porte aucun lien inter-vue.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE CE COMPOSANT NE PROUVE PAS, ET IL FAUT LE DIRE EN PREMIER
	 *
	 * `RG-ACC-04` — le parcours ne doit pas révéler qu'un compte existe — N'EST
	 * PAS TENUE PAR CE LOT, et il ne la déclare pas tenue. La maquette porte la
	 * propriété dans son écran : l'étape 2 est le MÊME écran que l'identifiant
	 * existe ou non, et la planche a un contrôle « Identifiant connu / inconnu »
	 * dont le gel écrit lui-même qu'il « ne change rien à l'écran d'envoi : c'est
	 * précisément ce qu'il faut vérifier » (`V-06:1062`). Ce composant REND CE
	 * QUE LA MAQUETTE MONTRE. Il n'interroge aucun annuaire, n'envoie aucun
	 * courriel, ne mesure aucun temps de réponse — et l'indiscernabilité
	 * TEMPORELLE, qui fait partie de RG-ACC-04, n'est mesurée par aucun
	 * instrument à ce jour (`docs/releve-vues.md` §10, M-5). La preuve relève de
	 * la batterie 6 (`pnpm test:etancheite`) et du lot T-011.
	 *
	 * NE SONT PAS TENUES DAVANTAGE : `RG-M16-01` — la robustesse affichée est
	 * l'état figé du gel, aucune politique n'est appliquée —, `RG-NF-07`, et
	 * aucune propriété de sécurité. La `ul.regles` « Ce qui est demandé » est
	 * rendue telle que le gel la pose, sans aucune coche.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PAS DE COQUILLE — `node verif/releve-vues.mjs --coquille`
	 *
	 * V-01 à V-06 et V-09 n'en portent pas (`docs/releve-vues.md` §5.1) : page
	 * autonome, `$lib/coquille` non employé, ni lien d'évitement ni fil
	 * d'Ariane. L'enveloppe est `<main class="auth" id="app">`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES SEPT ÉTATS, ET CE QUE LA PLANCHE ATTEINT RÉELLEMENT — MESURÉ
	 *
	 * `reglerPlanche()` applique le vecteur complet mais n'émet `change` que sur
	 * un contrôle dont la position CHANGE (`verif/banc/capture.mjs`). Deux
	 * conséquences, toutes deux relevées au navigateur dans les conditions du
	 * banc, et aucune n'était écrite ailleurs :
	 *
	 *   • `expire` — vecteur `{ et: "1", cpt: "connu", c-expire: true }`. Seule
	 *     la case bascule, et son gestionnaire (`V-06:1078`) ne fait quelque
	 *     chose QUE si l'écran est déjà à l'étape 3 ou à « expire ». À l'étape 1,
	 *     il est INERTE : l'état `expire` rend EXACTEMENT l'écran de `et-1`.
	 *     La section `data-etape="expire"` existe dans le document, en
	 *     `display: none`, et n'est atteinte par aucun des sept états.
	 *   • `cpt-inconnu` — le gestionnaire (`V-06:1083`) n'affiche pas d'écran,
	 *     il EMPILE UNE NOTIFICATION. Le banc avance de 1 000 ms après le
	 *     réglage, la minuterie de retrait du gel est à 2 600 ms : la
	 *     notification est donc PLEINEMENT VISIBLE à l'instant capturé, et c'est
	 *     le seul état à notification visible du périmètre (`docs/releve-vues.md`
	 *     §6.4). ARB-011 dit « l'état, jamais la transition » : l'état porte la
	 *     notification, le squelette ne l'anime ni ne la retire.
	 *     `cpt-connu`, position cochée au balisage, n'émet aucun `change` : sa
	 *     notification jumelle du gel n'est jamais atteinte, et le scénario le
	 *     déclare `identiqueA` `et-1`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA FOCALISATION DES ÉTAPES 3 ET 4 — ÉCART MESURÉ, NON COMBLÉ
	 *
	 * `aller()` focalise, à chaque changement d'étape, le premier
	 * `.saisie` ou `.btn--principal` de la section devenue active (`V-06:866`).
	 * Le geste a lieu APRÈS `stabiliser()`, donc il SURVIT du côté référence —
	 * mesuré : `et-3` sort avec `input#nouveau` actif et `:focus-visible`,
	 * `et-4` avec le `a.btn.btn--principal` actif et `:focus-visible`.
	 *
	 * Le côté application reçoit son état PAR L'ADRESSE : la page est chargée
	 * puis stabilisée, et `stabiliser()` floute l'élément actif. Aucune forme
	 * déclarative ne rend un nœud focalisé après ce floutage HORS D'UN DIALOGUE
	 * RÉVÉLÉ — c'est exactement P-4 (`CLAUDE.md` §6), et `V-28.svelte` l'a déjà
	 * mesuré. `docs/releve-vues.md` §6.2 range pourtant `et-3` et `et-4` dans la
	 * jurisprudence d'`ECART-020` É-1, qui vaut pour `showModal()` et pour lui
	 * seul ; V-06 n'a aucun `dialog`, et `verif/references/protocole-app.json`
	 * ne lui déclare aucune révélation.
	 *
	 * AUCUN `autofocus` N'EST DONC POSÉ SUR `#nouveau` NI SUR LE LIEN FINAL :
	 * il serait perdu au même floutage, et le poser laisserait croire la cause
	 * traitée. L'`autofocus` de `input#identifiant` est porté, lui, parce que le
	 * BALISAGE du gel le porte (`V-06:665`) — il ne peint rien non plus.
	 *
	 * COÛT MESURÉ, ET CAUSE ISOLÉE PAR NEUTRALISATION. `et-3` : 3 108 px, écart
	 * de canal max 108 — l'anneau de `.saisie:focus` (`src/socle.css:422`).
	 * `et-4` : 1 596 px, canal max 192 — le liseré de `:focus-visible`
	 * (`src/socle.css:133`) autour du lien pleine largeur. Flouter l'élément
	 * actif DU SEUL CÔTÉ RÉFÉRENCE, après le réglage de la planche, ramène les
	 * deux à ZÉRO : la focalisation est la cause entière, et la seule.
	 *
	 * Au passage, `docs/releve-vues.md` §6.2 écrit qu'« un `.btn--principal`
	 * focalisé ne déclenche pas `:focus-visible` » et ne range donc pas `et-4`
	 * parmi les cibles à risque. La mesure dit l'inverse : la modalité n'est
	 * PAS le pointeur ici — `reglerPlanche()` émet un `change` par script, sans
	 * qu'aucun pointeur ne touche la page —, `:focus-visible` s'applique, et le
	 * lien coûte 1 596 px.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * `cpt-inconnu` — LE SOCLE RETENU N'EST PAS UN SUR-ENSEMBLE DU SIEN,
	 * ET V-06 REND DÉSORMAIS LA NOTIFICATION QUE V-06 MONTRE (ARB-028)
	 *
	 * Le constat ne vient ni de cette vue ni de son premier lot. E-01 et ADR-002
	 * retiennent comme socle applicatif celui de V-07, le plus complet des états
	 * en ligne ; `docs/DESIGN.md` §0.2 les décrit « strictement plus riche » et
	 * « emboîtés ». POUR LA FAMILLE DES NOTIFICATIONS, C'EST FAUX : les règles ne
	 * sont pas étendues, elles sont REMPLACÉES.
	 *
	 *   socle gelé de V-06        →  `.notifs` sans `max-width`
	 *                                `.notif { display: flex; align-items: center;
	 *                                 gap: e-3; padding: e-3 e-4 }`
	 *   src/socle.css (V-07)      →  `.notifs { max-width: min(400px, …) }`
	 *                                `.notif { display: grid; …; width: 100%;
	 *                                 padding: e-3 e-3 e-3 e-4; line-height: 1.45 }`
	 *
	 * La bulle de la référence n'est pas bornée et tient sur UNE ligne ; celle du
	 * socle applicatif est plafonnée à 400 px et repasse à la ligne. Coût mesuré
	 * au premier lot : 13 276 px, canal max 230 — le DERNIER écart visuel des
	 * 409 couples.
	 *
	 * ARB-024 en avait conclu « la famille suit V-38, et V-06 demande un regel ».
	 * ARB-028 RENVERSE LA RÉSOLUTION, et le constat reste : l'ordre de préséance
	 * met la maquette au-dessus de toute doctrine de réalisation, et il porte sur
	 * CHAQUE VUE dans CHACUN de ses aspects. V-06 régit V-06.
	 *
	 * CE QUE CETTE VUE FAIT DONC, ET CE QU'ELLE NE FAIT PAS. Elle appelle le
	 * composant UNIQUE de la famille — `$lib/coquille/PileDeNotifications.svelte`
	 * — avec la variante `texte`, celle que SA maquette gèle. Elle ne recopie
	 * aucun balisage (`docs/DESIGN.md` §3.7, interdit n° 7), n'écrit aucune règle
	 * de style, et ne touche ni à `src/socle.css` (P-6.1) ni à `src/vues/V-06.css`
	 * (P-6.3), qui restent gelés à l'octet. La variante et sa feuille vivent dans
	 * le composant, où la divergence est documentée en entier.
	 *
	 * Hors de cette famille, le socle gelé de V-06 et `src/socle.css` ne diffèrent
	 * que par un COMMENTAIRE : deux blocs de différence en tout — vérifié par diff
	 * intégral des 400 lignes —, et le second est le titre de la section 9. Aucun
	 * autre état des deux vues n'est touché, et pour une raison mesurée :
	 * `cpt-inconnu` est le SEUL état des 37 vues restantes qui rende une
	 * notification visible (`docs/releve-vues.md` §6.4). La règle divergente
	 * n'avait jamais été exercée — c'est exactement P-5 (`CLAUDE.md` §6).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT — ARB-011
	 *
	 * La jauge de robustesse, le cochage des règles au fil de la frappe, la
	 * vérification de la confirmation, le rouet d'attente de 800 ms, la
	 * révélation du mot de passe et l'avertissement de verrouillage des
	 * majuscules sont du comportement : ils relèvent de T-017. Le squelette rend
	 * l'état que la référence montre à l'instant capturé — `robustesse` à
	 * `data-niveau="court"`, aucun segment allumé, « Trop court », « 0 / 12 »,
	 * et aucune règle marquée `data-ok`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * BLOCS HORS PRODUIT, ET LE PIÈGE NOMMÉ
	 *
	 * Seule `div.planche` est hors produit ici, et elle n'est pas rendue. La
	 * `ul.regles` de l'étape 3 EST DU PRODUIT : le sélecteur du banc est
	 * `section.regles`, pas `.regles` (`verif/banc/conditions.mjs`,
	 * `BLOCS_HORS_PRODUIT` ; `docs/DESIGN.md` §2.G). Un lot qui « nettoierait »
	 * par nom de classe retirerait une exigence fonctionnelle.
	 *
	 * LES ADRESSES RESTENT CELLES DU GEL — voir l'en-tête de `V-04.svelte`.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-06.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-06 --installer`, identique à l'octet au
	 * second bloc `<style>` de la maquette. Tous les `style=` du fichier
	 * figurent à l'ensemble clos du gel (ARB-016, P-6.4). La seule règle de style
	 * que cette vue fasse poser est celle de la variante `texte` de la famille des
	 * notifications, et elle vit dans le composant qui la rend, pas ici (ARB-028).
	 *
	 * LE JEU DE SEMENCE EST VIDE, ET C'EST DÉCLARÉ. `VARIANTE_PAR_VUE` range
	 * V-06 dans la variante « vide » (`seeds/corpus.ts`) : le mode démo passe
	 * bien `notes`, mais `corpusPourVue('V-06')` rend zéro note. La propriété
	 * n'est donc pas déclarée — `svelte/no-unused-props` refuse une propriété
	 * déclarée et non employée. La SEULE donnée que cette vue tire du jeu de
	 * semence est l'identifiant du compte `c-sophie`, lu dans `COMPTES`.
	 *
	 * VOCABULAIRE : aucun des douze termes contractuels n'apparaît dans cette
	 * vue ; rien à y contrôler (P-07).
	 */
	import Marque from '$lib/auth/Marque.svelte';
	import PileDeNotifications from '$lib/coquille/PileDeNotifications.svelte';
	import { COMPTES } from '../../seeds/corpus';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
	}

	const { vecteur }: Proprietes = $props();

	/**
	 * L'étape affichée, portée du gestionnaire de la planche (`V-06:1068`) :
	 * la position du contrôle « Étape », déviée vers « expire » quand la case
	 * « Lien expiré » est cochée ET que la position visée est la troisième.
	 * L'autre gestionnaire, celui de la case (`V-06:1078`), est inerte partout
	 * ailleurs — voir l'en-tête.
	 */
	const et = $derived(typeof vecteur?.et === 'string' ? vecteur.et : '1');
	const lienExpire = $derived(vecteur?.['c-expire'] === true);
	const etape = $derived(et === '3' && lienExpire ? 'expire' : et);

	/** `ORDRE` du gel (`V-06:854`) — « expire » occupe le rang de l'étape 3. */
	const ORDRE: Record<string, number> = { '1': 1, '2': 2, '3': 3, expire: 3, '4': 4 };
	const rang = $derived(ORDRE[etape] ?? 1);

	/** Les quatre jalons, dans l'ordre du gel. `aller()` les classe par rang. */
	const JALONS = [
		{ n: 1, nom: 'Identifiant' },
		{ n: 2, nom: 'Envoi' },
		{ n: 3, nom: 'Nouveau' },
		{ n: 4, nom: 'Terminé' }
	];
	function etatDeJalon(n: number, courant: number): string {
		return n < courant ? 'faite' : n === courant ? 'courante' : 'avenir';
	}

	/**
	 * L'identifiant rappelé à l'étape 2. Le gel le pose depuis la saisie de
	 * l'étape 1 ; atteinte par la planche, l'étape 2 n'a rien saisi et le gel
	 * retombe sur un compte du jeu de semence (`V-06:1073`). C'est le compte
	 * `c-sophie` de `seeds/corpus.ts`, et l'identifiant est LU LÀ, jamais
	 * recopié. Hors de l'étape 2, le balisage porte un cadratin.
	 */
	const TIRET = '—';
	const identifiantRappele = $derived(
		etape === '2' ? (COMPTES.find((c) => c.id === 'c-sophie')?.identifiant ?? TIRET) : TIRET
	);

	/**
	 * La notification du contrôle « Compte ». Seule la position `inconnu` en
	 * émet une : `connu` est cochée au balisage, et `reglerPlanche()` n'émet
	 * aucun `change` sur un contrôle déjà dans la position visée. Le libellé est
	 * celui du gel (`V-06:1086`).
	 */
	const CPT_COCHE_AU_BALISAGE = 'connu';
	const cpt = $derived(typeof vecteur?.cpt === 'string' ? vecteur.cpt : CPT_COCHE_AU_BALISAGE);
	const notifications = $derived<readonly string[]>(
		cpt === CPT_COCHE_AU_BALISAGE
			? []
			: ["Identifiant inconnu — l'écran d'envoi reste rigoureusement identique"]
	);

	/** `aller()` marque chaque section active ou non — jamais retirée du DOM. */
	function active(cle: string, courante: string): 'oui' | 'non' {
		return cle === courante ? 'oui' : 'non';
	}
</script>

<main class="auth" id="app" data-etape={etape}>
	<div class="auth__colonne">
		<Marque />

		<!--
			Étapes visibles en permanence.

			RÉGION SERRÉE : le gel ne met AUCUN blanc entre `.jalon__barre` et
			`.jalon__nom`, et le relevé d'ordre de tabulation du niveau 1 construit
			ses noms accessibles sur `textContent` — un blanc inséré par le
			formateur s'y voit (`CLAUDE.md` §6, P-6). La directive de non-formatage
			ci-dessous est donc obligatoire, et sa forme est exacte.
		-->
		<!-- prettier-ignore -->
		<ol class="jalons" id="jalons" aria-label="Étapes de la réinitialisation">
			{#each JALONS as jalon (jalon.n)}<li class="jalon" data-jalon={jalon.n} data-etat={etatDeJalon(jalon.n, rang)}
				><span class="jalon__barre"></span><span class="jalon__nom">{jalon.nom}</span></li
			>{/each}
		</ol>

		<div class="auth__boite">
			<!-- ============ ÉTAPE 1 — Identifiant ============ -->
			<section class="etape" data-etape="1" data-active={active('1', etape)}>
				<h1 class="auth__titre">Mot de passe oublié</h1>
				<p class="auth__sous">
					Indiquez votre identifiant. Si un compte y correspond, vous recevrez un lien de
					réinitialisation sur votre adresse professionnelle.
				</p>

				<form class="auth__form" id="form-1" novalidate>
					<fieldset id="champs-1">
						<div class="champ" id="champ-id">
							<label class="champ__label" for="identifiant">Identifiant</label>
							<!--
								`autofocus` est porté PARCE QUE LE BALISAGE DU GEL LE PORTE, et il
								ne peint rien : hors dialogue révélé, il ne survit pas à
								`stabiliser()` (`CLAUDE.md` §6, P-4).
							-->
							<!-- svelte-ignore a11y_autofocus -->
							<input
								class="saisie"
								type="text"
								id="identifiant"
								autocomplete="username"
								autocapitalize="none"
								spellcheck="false"
								autofocus
								placeholder="prenom.nom"
							/>
							<span class="champ__aide">Le même que pour vous connecter, sans le domaine.</span>
						</div>
						<button
							class="btn btn--principal"
							type="submit"
							id="valider-1"
							style="width:100%;padding:11px"
						>
							<span id="txt-1">Envoyer le lien</span>
						</button>
					</fieldset>
				</form>

				<div class="auth__ligne" style="margin-top:var(--e-4);justify-content:center">
					<a class="auth__lien" href="#" data-vers="connexion">Revenir à la connexion</a>
				</div>
			</section>

			<!--
				============ ÉTAPE 2 — Confirmation d'envoi ============
				Message rigoureusement identique que l'identifiant existe ou non :
				rien ne doit permettre de déduire qu'un compte porte ce nom. C'est ce
				que la maquette MONTRE ; la propriété, elle, se prouve ailleurs (voir
				l'en-tête, RG-ACC-04).
			-->
			<section class="etape" data-etape="2" data-active={active('2', etape)}>
				<h1 class="auth__titre">Vérifiez votre messagerie</h1>
				<p class="auth__sous">
					Si un compte correspond à cet identifiant, un lien de réinitialisation vient d'être envoyé
					à l'adresse professionnelle associée. Le lien est valable <strong>une heure</strong>
					et ne peut servir qu'une fois.
				</p>

				<div class="contexte contexte--info" style="margin-bottom:var(--e-4)">
					<span class="contexte__marque" aria-hidden="true">i</span>
					<div>
						<div class="contexte__titre">Rien reçu au bout de quelques minutes&nbsp;?</div>
						<div>
							Vérifiez les courriers indésirables. Si vous n'avez toujours rien, l'identifiant saisi
							n'est peut-être pas le bon.
						</div>
					</div>
				</div>

				<!-- prettier-ignore -->
				<div style="display:flex;justify-content:center;margin-bottom:var(--e-4)">
					<span class="rappel-id">Demande envoyée pour <b id="rappel-identifiant">{identifiantRappele}</b></span>
				</div>

				<button class="btn" style="width:100%" id="renvoyer">
					Recommencer avec un autre identifiant
				</button>

				<div class="auth__ligne" style="margin-top:var(--e-4);justify-content:center">
					<a class="auth__lien" href="#" data-vers="connexion">Revenir à la connexion</a>
				</div>
			</section>

			<!-- ============ ÉTAPE 3 — Nouveau mot de passe ============ -->
			<section class="etape" data-etape="3" data-active={active('3', etape)}>
				<h1 class="auth__titre">Choisir un nouveau mot de passe</h1>
				<p class="auth__sous">Il remplacera immédiatement l'ancien sur l'ensemble de vos accès.</p>

				<!--
					Les règles sont annoncées avant la saisie, pas après l'échec.
					`ul.regles` EST DU PRODUIT — voir l'en-tête, §2.G.
				-->
				<div style="margin-bottom:var(--e-4)">
					<span class="etiq" style="display:block;margin-bottom:var(--e-2)">Ce qui est demandé</span
					>
					<ul class="regles" id="regles">
						<li data-regle="longueur">12 caractères au minimum</li>
						<li data-regle="varie">Au moins deux natures de caractères différentes</li>
						<li data-regle="different">Différent de votre identifiant</li>
					</ul>
				</div>

				<form class="auth__form" id="form-3" novalidate>
					<fieldset id="champs-3">
						<div class="champ" id="champ-nouveau">
							<label class="champ__label" for="nouveau">Nouveau mot de passe</label>
							<div class="champ__boite">
								<input
									class="saisie"
									type="password"
									id="nouveau"
									autocomplete="new-password"
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
									>
										<path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8z" /><circle
											cx="8"
											cy="8"
											r="1.8"
										/>
									</svg>
								</button>
							</div>
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
							<!-- prettier-ignore -->
							<div class="robustesse" id="robustesse" data-niveau="court">
								<div class="robustesse__segments" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
								<div class="robustesse__txt">
									<span class="robustesse__note" id="robustesse-note">Trop court</span>
									<span class="robustesse__reste" id="robustesse-reste">0 / 12</span>
								</div>
							</div>
							<span class="champ__aide"
								>Quatre mots sans rapport entre eux valent mieux qu'un mot compliqué.</span
							>
						</div>

						<div class="champ" id="champ-confirm">
							<label class="champ__label" for="confirmation">Confirmer le mot de passe</label>
							<input
								class="saisie"
								type="password"
								id="confirmation"
								autocomplete="new-password"
								spellcheck="false"
							/>
							<div class="champ__erreur" id="erreur-confirm" hidden>
								<svg
									width="13"
									height="13"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									style="flex:none;margin-top:1px"
									><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
								>
								Les deux saisies ne correspondent pas.
							</div>
						</div>

						<button
							class="btn btn--principal"
							type="submit"
							id="valider-3"
							style="width:100%;padding:11px"
						>
							<span id="txt-3">Enregistrer le nouveau mot de passe</span>
						</button>
					</fieldset>
				</form>
			</section>

			<!--
				============ ÉTAPE 3 bis — Lien expiré ============
				Section présente dans le document et jamais active sur les sept états
				déclarés : la case « Expiré » de la planche ne bascule l'écran que
				depuis l'étape 3, et aucun état ne l'y met. Mesuré — voir l'en-tête.
			-->
			<section class="etape" data-etape="expire" data-active={active('expire', etape)}>
				<div class="contexte contexte--attente" style="margin-bottom:var(--e-4)">
					<span class="contexte__marque" aria-hidden="true">⏱</span>
					<div>
						<div class="contexte__titre">Ce lien n'est plus valable</div>
						<div>
							Un lien de réinitialisation expire au bout d'une heure et ne sert qu'une fois.
							Celui-ci a dépassé ce délai, ou a déjà été utilisé.
						</div>
					</div>
				</div>
				<p class="auth__sous">
					Rien n'est perdu : demandez-en un nouveau, la démarche prend quelques secondes.
				</p>
				<button class="btn btn--principal" style="width:100%;padding:11px" id="relancer"
					>Demander un nouveau lien</button
				>
				<div class="auth__ligne" style="margin-top:var(--e-4);justify-content:center">
					<a class="auth__lien" href="#" data-vers="connexion">Revenir à la connexion</a>
				</div>
			</section>

			<!-- ============ ÉTAPE 4 — Confirmation ============ -->
			<section class="etape etape--fin" data-etape="4" data-active={active('4', etape)}>
				<div class="fanion" aria-hidden="true">
					<svg
						width="24"
						height="24"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
					>
				</div>
				<h1 class="auth__titre">Mot de passe enregistré</h1>
				<p class="auth__sous">
					Il est actif dès maintenant sur l'ensemble de vos accès. Vos autres sessions ouvertes ont
					été fermées.
				</p>
				<a
					class="btn btn--principal"
					href="#"
					style="width:100%;padding:11px;justify-content:center"
					data-vers="connexion">Se connecter</a
				>
			</section>
		</div>

		<div class="auth__pied">
			<p>Besoin d'aide pour retrouver votre accès&nbsp;?</p>
			<a class="btn" href="#" id="assistance">Ouvrir un ticket d'assistance</a>
		</div>
	</div>
</main>

<!--
	LA PILE DE NOTIFICATIONS, VARIANTE `texte` — ARB-028.

	V-06 rend la notification que V-06 montre : une bulle de texte nu, non
	bornée, tenue sur une ligne, telle que le `notifier()` du gel la pose
	(`V-06:830`, `n.textContent = txt`). Ce n'est PAS le catalogue de V-38, et
	les deux socles en ligne divergent réellement sur cette seule famille — le
	constat d'ARB-024, dont ARB-028 renverse la seule résolution.

	LE BALISAGE N'EST PAS RECOPIÉ (`docs/DESIGN.md` §3.7, interdit n° 7) : c'est
	le composant unique de la famille, appelé avec la variante que SA maquette
	gèle. Le détail de la divergence est en tête de `PileDeNotifications.svelte`.
-->
<PileDeNotifications variante="texte" textes={notifications} />
