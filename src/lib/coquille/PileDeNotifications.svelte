<script lang="ts">
	/**
	 * PileDeNotifications — la famille A-8, UN SEUL composant, DEUX ÉTATS GELÉS.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * POURQUOI CE COMPOSANT EXISTE — ARB-028, RÉVISION D'ARB-024
	 *
	 * Les 41 maquettes portent le conteneur `div.notifs`, et UN SEUL de leurs
	 * 409 états rend une bulle hors de V-38 : `V-06 · cpt-inconnu`. Or V-06 a
	 * été gelée AVANT la refonte `flex` → `grid` du composant, et les deux
	 * maquettes ne montrent donc pas la même bulle. Mesuré : 13 276 px, 1,02 %
	 * — le dernier écart visuel du projet.
	 *
	 * ARB-024 avait conclu « la famille suit V-38, et V-06 demande un regel ».
	 * ARB-028 renverse la résolution, parce que l'ordre de préséance dit
	 * l'inverse — `Maquettes > Cahier des charges > Brief > Pile > Plan` :
	 *
	 *     V-06 RÉGIT V-06. LA MAQUETTE FAIT LOI DANS TOUS SES ASPECTS.
	 *
	 * Ce que la décision N'AUTORISE PAS, et c'est la moitié qui compte : elle
	 * n'autorise pas DEUX composants. `docs/DESIGN.md` §3.7 point 7 — « recopier
	 * le balisage au lieu d'appeler le composant unique » — reste entier. D'où
	 * ce fichier : le balisage de la famille est écrit UNE fois, et la variante
	 * est DÉCLARÉE, rattachée à la maquette qui la gèle.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUI DIVERGE, RELEVÉ ET NON RECOPIÉ D'UN RÉSUMÉ
	 *
	 * Les deux socles en ligne — `mockups/V-06:308-331` et `mockups/V-38:317-397`
	 * — ne diffèrent QUE par la section 9, et par le commentaire qui la titre.
	 * Diff intégral des 400 lignes restantes : identiques à l'octet. La section 9
	 * de V-38 est celle que `src/socle.css` porte (extraite de V-07, E-01).
	 *
	 *   déclaration         V-06 (gel)                V-38 / socle applicatif
	 *   ─────────────────── ───────────────────────── ──────────────────────────
	 *   .notifs max-width   — (non bornée)            min(400px, 100vw - 2×e-5)
	 *   .notifs pointer-ev. — (auto)                  none, + `> * { auto }`
	 *   .notif  display     flex                      grid
	 *   .notif  colonnes    —                         auto minmax(0,1fr) auto
	 *   .notif  align-items center                    start
	 *   .notif  gap         e-3                       e-1 e-3
	 *   .notif  width       — (auto)                  100%
	 *   .notif  padding     e-3 e-4                   e-3 e-3 e-3 e-4
	 *   .notif  line-height — (hérité, --i-ui = 1.45) 1.45
	 *   .notif  [data-sortie], @media reduce, tout `.notif__*`, `.notif--erreur`,
	 *           `--info`, `--encours`, `@media (max-width: 640px)` : ABSENTS de
	 *           V-06, qui ne connaît que `.notifs`, `.notif`, `.notif--succes`.
	 *
	 * LES RÈGLES SONT REMPLACÉES, PAS ÉTENDUES. C'est le constat exact d'ARB-024,
	 * et il reste vrai : `docs/DESIGN.md` §0.2 écrit que le socle retenu est
	 * « strictement plus riche » et « emboîté » — pour CETTE famille, c'est faux.
	 *
	 * Le balisage diverge autant que le style : le `notifier()` de V-06
	 * (`V-06:830`) fait `n.textContent = txt` et s'arrête là. Pas de glyphe, pas
	 * de titre, pas de bouton de fermeture — une bulle de texte, sur une ligne.
	 * Celui de V-38 (`V-38:2263`) construit les six enfants du catalogue.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE LA VARIANTE NE FAIT PAS
	 *
	 * Elle ne surcharge pas le socle : `src/socle.css` est intouché, et P-6.2
	 * interdirait de redéclarer `.notif`. Le style de la variante est porté ICI,
	 * sous le sélecteur de la variante, en jetons seulement — la seule chose
	 * qu'il fait est de RENDRE à `texte` les déclarations que V-07 a remplacées.
	 *
	 * Elle ne s'ouvre pas non plus : une troisième valeur exigerait une
	 * troisième maquette qui la montre. En son absence, ce serait un comblement.
	 */
	import type { Notification, TypeNotification, VarianteDeNotification } from './notifications';

	const {
		variante = 'catalogue',
		notifications = [],
		textes = []
	}: {
		/** L'état gelé rendu. `catalogue` = V-38 ; `texte` = V-06. */
		variante?: VarianteDeNotification;
		/** Les notifications TYPÉES du catalogue V-38 — variante `catalogue`. */
		notifications?: readonly Notification[];
		/** Les bulles de texte nu de V-06 — variante `texte`. */
		textes?: readonly string[];
	} = $props();

	/*
	 * Chaque variante ne lit QUE sa propre source. Les deux listes sont donc
	 * mutuellement exclusives PAR CONSTRUCTION, et non par convention d'appel :
	 * un appelant qui passerait les deux n'en rendrait qu'une, celle de la
	 * variante qu'il a déclarée.
	 */
	const bullesTypees = $derived<readonly Notification[]>(
		variante === 'catalogue' ? notifications : []
	);
	const bullesTexte = $derived<readonly string[]>(variante === 'texte' ? textes : []);
</script>

<!--
	La marque d'une notification. Les trois glyphes sont ceux de `GLYPHES_NOTIF`
	de la maquette gelée ; « en cours » n'en a pas et porte le rouet.
-->
{#snippet marque(type: TypeNotification)}
	<span class="notif__marque" aria-hidden="true"
		>{#if type === 'encours'}<span class="notif__rouet"></span>{:else}<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.9"
				>{#if type === 'succes'}<path
						d="M3 8.5l3.5 3.5L13 4.5"
					/>{:else if type === 'erreur'}<circle cx="8" cy="8" r="6.2" /><path
						d="M8 4.5v4M8 11.2v.3"
					/>{:else}<circle cx="8" cy="8" r="6.2" /><path d="M8 7.2v4M8 4.7v.3" />{/if}</svg
			>{/if}</span
	>
{/snippet}

<!--
	LA VARIANTE `texte` — L'ÉTAT GELÉ DE V-06, ARB-028.

	Ce bloc ne fait qu'UNE chose : rendre à la variante `texte` les déclarations
	que le socle de V-07 a REMPLACÉES dans celui de V-06. Il n'ajoute rien, ne
	compense rien, n'invente aucune valeur — chaque ligne annule une ligne de
	`src/socle.css` §9, et chaque longueur est un jeton du socle.

	LE SOCLE N'EST PAS SURCHARGÉ : `.notifs` et `.notif` ne sont PAS redéclarés
	(P-6.2 l'interdit, et il a raison). Le sélecteur porte la variante déclarée,
	et lui seul. Les quarante autres vues, qui n'en déclarent aucune, ne voient
	rien de ce bloc — et il n'est même pas émis pour elles.

	POURQUOI DANS `<svelte:head>` ET NON DANS LE BLOC `<style>` DU COMPOSANT.
	Parce qu'un bloc `<style>` de composant N'EST JAMAIS SERVI AU BANC. Le mode
	démo compose le document lui-même et n'y met que trois feuilles : les polices,
	`src/socle.css` et `src/vues/V-xx.css` (le module de service du banc, et
	`verif/references/protocole-app.json` le dit noir sur blanc). Svelte pose bien
	la classe de portée sur les nœuds — relevé au document servi : le conteneur
	sort avec sa classe `notifs` suivie de la classe de portée `svelte-xxxxxxx` —
	mais la feuille qui la définit n'est liée nulle part : elle ne peint RIEN.
	Aucun composant de `src/` ne portait de bloc `<style>` ; la propriété n'avait
	donc jamais été exercée. C'est P-5 encore une fois.

	Les deux autres canaux étaient fermés, et pour de bonnes raisons : les deux
	feuilles servies sont gelées à l'octet (P-6.1, P-6.3), et l'ensemble clos des
	styles en ligne de V-06 (P-6.4, ARB-016) ne contient aucune des déclarations
	nécessaires — il porte `display:flex`, mais ni `align-items:center`, ni
	`gap`, ni le rembourrage, ni `max-width`. `<svelte:head>` est le seul canal
	qui atteigne le document, et il ne se soustrait à AUCUN contrôle : `verif:jetons`
	relève tout bloc `<style>` d'un fichier `.svelte`, où qu'il soit — P-1 sur le
	contenu, P-4.2 sur la nomenclature, P-6.2 sur les sélecteurs.

	`line-height: inherit` n'est pas un raccourci : le socle de V-06 ne déclare
	PAS de `line-height` sur `.notif`, la bulle hérite donc celui de `body`,
	`var(--i-ui)`. Écrire la valeur ici la figerait ; hériter transcrit le gel.
-->
<svelte:head>
	{#if variante === 'texte'}
		<style>
			.notifs[data-variante='texte'] {
				max-width: none;
				pointer-events: auto;
			}

			.notifs[data-variante='texte'] .notif {
				display: flex;
				grid-template-columns: none;
				align-items: center;
				gap: var(--e-3);
				width: auto;
				padding: var(--e-3) var(--e-4);
				line-height: inherit;
			}

			/*
				Le socle applicatif étale la pile sur toute la largeur sous 640 px ; le
				socle de V-06 n'a pas cette règle du tout. Aucun des 409 couples ne
				l'exerce — V-06 n'est mesurée qu'à 1440×900 —, mais la vue est une route
				réelle et sa maquette fait loi à toutes les largeurs. Transcrire « pas de
				règle » se dit en rendant les valeurs de base.
			*/
			@media (max-width: 640px) {
				.notifs[data-variante='texte'] {
					right: var(--e-5);
					left: auto;
					bottom: var(--e-5);
				}
			}
		</style>
	{/if}
</svelte:head>

<div class="notifs" id="notifs" role="status" aria-live="polite" data-variante={variante}>
	{#each bullesTexte as texte, rang (rang)}<div class="notif">{texte}</div>{/each}
	{#each bullesTypees as n, rang (rang)}<div
			class="notif notif--{n.type}"
			role={n.type === 'erreur' ? 'alert' : 'status'}
			aria-live={n.type === 'erreur' ? 'assertive' : 'polite'}
		>
			{@render marque(n.type)}
			<div class="notif__corps">
				<div class="notif__titre">{n.titre}</div>
				{#if n.detail}<div class="notif__detail">{n.detail}</div>{/if}
			</div>
			<button class="notif__fermer" type="button" aria-label="Fermer cette notification"
				><svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
				></button
			>{#if n.progres !== undefined}<div class="notif__progres">
					<i style="width:{n.progres}%"></i>
				</div>{/if}{#if n.actions}<div class="notif__actions">
					{#each n.actions as action (action)}<button type="button">{action}</button>{/each}
				</div>{/if}
		</div>{/each}
</div>
