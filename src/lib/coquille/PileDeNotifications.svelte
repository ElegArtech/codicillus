<script lang="ts">
	/**
	 * PileDeNotifications — la famille A-8, UN SEUL composant, DEUX ÉTATS GELÉS.
	 *
	 * POURQUOI CE COMPOSANT EXISTE — ARB-028. Un seul des 409 états des 41 maquettes rend
	 * une bulle hors de V-38 : `V-06 · cpt-inconnu`, gelée AVANT la refonte `flex` →
	 * `grid`. L'ordre de préséance — Maquettes > CDC > Brief > Pile > Plan — tranche : V-06
	 * RÉGIT V-06. Ce que la décision N'AUTORISE PAS, et c'est la moitié qui compte : DEUX
	 * composants — `docs/DESIGN.md` §3.7 point 7 reste entier.
	 *
	 * CE QUI DIVERGE : les deux socles en ligne ne diffèrent QUE par leur section 9. V-06
	 * ne connaît que `.notifs`, `.notif` et `.notif--succes` — ni `max-width`, ni
	 * `pointer-events`, ni grille, ni aucun `.notif__*`. LES RÈGLES SONT REMPLACÉES, PAS
	 * ÉTENDUES, alors que `docs/DESIGN.md` §0.2 dit le socle « strictement plus riche » et
	 * « emboîté » : c'est faux pour CETTE famille. Le balisage diverge autant — le
	 * `notifier()` de V-06 fait `n.textContent = txt` et s'arrête là.
	 *
	 * CE QUE LA VARIANTE NE FAIT PAS : elle ne surcharge pas le socle (P-6.2 interdirait de
	 * redéclarer `.notif`), et elle ne s'ouvre pas — une troisième valeur exigerait une
	 * troisième maquette.
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
	 * mutuellement exclusives PAR CONSTRUCTION, et non par convention d'appel : un
	 * appelant qui passerait les deux n'en rendrait qu'une.
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

	Ce bloc ne fait qu'UNE chose : rendre à la variante `texte` les déclarations que le
	socle de V-07 a REMPLACÉES dans celui de V-06. Il n'ajoute rien, ne compense rien,
	n'invente aucune valeur — chaque ligne annule une ligne de `src/socle.css` §9, et
	chaque longueur est un jeton du socle.

	LE SOCLE N'EST PAS SURCHARGÉ : `.notifs` et `.notif` ne sont PAS redéclarés (P-6.2
	l'interdit). Le sélecteur porte la variante déclarée, et lui seul ; les quarante
	autres vues ne voient rien de ce bloc, qui n'est même pas émis pour elles.

	POURQUOI DANS `<svelte:head>` ET NON DANS LE BLOC `<style>` DU COMPOSANT : Svelte pose
	bien la classe de portée sur les nœuds, mais la feuille qui la définit n'est liée
	nulle part dans le document composé pour un rendu de vue isolé — elle ne peint RIEN.

	Les deux autres canaux étaient fermés, et pour de bonnes raisons : les deux feuilles
	servies sont gelées à l'octet (P-6.1, P-6.3), et l'ensemble clos des styles en ligne
	de V-06 (P-6.4, ARB-016) ne contient aucune des déclarations nécessaires — il porte
	`display:flex`, mais ni `align-items:center`, ni `gap`, ni le rembourrage, ni
	`max-width`. `<svelte:head>` est le seul canal qui atteigne le document.

	`line-height: inherit` n'est pas un raccourci : le socle de V-06 ne déclare PAS de
	`line-height` sur `.notif`, la bulle hérite donc celui de `body`. Écrire la valeur ici
	la figerait ; hériter transcrit le gel.
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
				Le socle applicatif étale la pile sur toute la largeur sous 640 px ; le socle
				de V-06 n'a pas cette règle du tout, et sa maquette fait loi à toutes les
				largeurs. Transcrire « pas de règle » se dit en rendant les valeurs de base.
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
