<script lang="ts">
	/**
	 * V-38 — Système de notification. Catalogue transverse, pas une route :
	 * `docs/routes.md` §3.7 et §3.8 en font une SECTION de V-41, sans adresse propre
	 * (`ARB-002`).
	 *
	 * AUCUNE MINUTERIE (`ARB-011`) : l'effacement automatique — 3 200 ms pour un
	 * succès, 6 000 ms pour une information, persistance jusqu'à action pour une
	 * erreur (`RG-M18-02`) — est du COMPORTEMENT. La barre d'avancement de la
	 * notification « en cours » est figée à la valeur que la référence montre.
	 *
	 * Le cadre vient du gabarit (`ARB-015`) : la classe `doc` de `<main>` et la pile
	 * de notifications typées lui sont passées en propriétés. Le style est dans
	 * `src/socle.css` et `src/vues/V-38.css` ; les styles en ligne sont ceux du gel.
	 */
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import type { Notification } from '$lib/coquille/notifications';

	interface Proprietes {
		etat: string;
		notes: readonly Note[];
		/** LES QUATRE SOURCES DE LA COQUILLE. Absentes, les constantes du jeu de
		    semence s'appliquent ; fournies par une route, elles l'emportent. */
		/** Les univers déclarés. Absente, `UNIVERS` du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du périmètre du compte. Absente, `DOMAINES` du jeu de semence. */
		domaines?: readonly Domaine[];
		/** Le compte connecté. Absente, `MOI` du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, `INSTANCE` du jeu de semence. */
		instance?: EtatDInstance;
	}

	const {
		etat,
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE
	}: Proprietes = $props();

	const TYPES = [
		{
			id: 'succes',
			nom: 'Succès',
			couleur: '#1d6b4a',
			duree: '3 s',
			regle:
				'Confirmation brève. Disparaît seule au bout de trois secondes — mais le survol ' +
				"suspend le compte à rebours, pour qu'elle ne s'évanouisse pas sous le curseur de " +
				'celui qui la lit.',
			exemples: ['Note enregistrée', 'Note vérifiée', 'Lien copié']
		},
		{
			id: 'erreur',
			nom: 'Erreur',
			couleur: '#a52c1b',
			duree: 'persiste',
			regle:
				"Persiste jusqu'à une action. Dit la cause probable et propose de réessayer quand " +
				"c'est pertinent. Seule notification annoncée avec insistance aux lecteurs d'écran, " +
				"parce qu'elle attend une décision.",
			exemples: ['Enregistrement impossible', 'Session expirée', 'Fichier trop volumineux']
		},
		{
			id: 'info',
			nom: 'Information',
			couleur: '#1b6b7a',
			duree: '6 s',
			regle:
				"Événement neutre dont il faut être averti sans être interrompu. Refermable, s'efface " +
				'au bout de six secondes.',
			exemples: ['Import terminé', 'Session bientôt expirée', 'Note modifiée ailleurs']
		},
		{
			id: 'encours',
			nom: 'En cours',
			couleur: '#453ba0',
			duree: 'persiste',
			regle:
				'Opération longue poursuivie en arrière-plan. Montre son avancement et permet de la ' +
				'suivre. Se transforme en succès ou en erreur à son terme, plutôt que de disparaître ' +
				"sans dire ce qu'elle a produit.",
			exemples: ['Import en arrière-plan', "Export d'un domaine"]
		}
	] as const;

	const REGLES: readonly (readonly [string, string])[] = [
		[
			'Jamais bloquantes',
			"Aucune ne fige l'écran ni ne capture le focus. Ce qui exige une décision avant de " +
				"continuer relève d'une boîte de dialogue, pas d'une notification."
		],
		[
			'Empilables et refermables une à une',
			"Elles s'accumulent du bas vers le haut. Chacune porte sa propre croix, et refermer la " +
				'première ne referme pas les autres.'
		],
		[
			"Elles n'occultent rien d'utile",
			"Ancrées en bas à droite, à l'écart des colonnes de contenu et des champs de saisie. Le " +
				"bac d'épreuve en bas de page sert à le vérifier."
		],
		[
			"Annoncées aux technologies d'assistance",
			"Poliment pour le succès, l'information et le suivi ; avec insistance pour l'erreur " +
				"seule, qui interrompt la lecture en cours parce qu'elle attend une réponse."
		],
		[
			'Le type se lit sans la couleur',
			"Chaque type porte un glyphe distinct et un filet latéral. Le vert, l'ambre et le rouge " +
				'restent réservés au signal de fraîcheur : ici ils ne font que redoubler le glyphe.'
		],
		[
			"Une opération longue dit ce qu'elle a produit",
			'La notification de suivi se transforme en succès ou en erreur à son terme, au lieu de ' +
				"s'effacer en laissant deviner l'issue."
		]
	];

	/**
	 * L'état « empiler les quatre types » : le premier exemple de chaque type, tel
	 * que la référence le montre à l'instant capturé. L'échelonnement de 260 ms de la
	 * maquette est une transition ; seul son résultat est un fait.
	 */
	const EMPILEMENT: readonly Notification[] = [
		{ type: 'succes', titre: 'Note enregistrée' },
		{
			type: 'erreur',
			titre: "Impossible d'enregistrer",
			detail:
				"Le serveur n'a pas répondu. Votre texte est intact à l'écran et conservé localement.",
			actions: ['Réessayer', 'Plus tard']
		},
		{
			type: 'info',
			titre: 'Import terminé : 231 notes créées, 3 erreurs',
			detail:
				"Le lot est allé jusqu'au bout. Les trois fichiers en échec sont listés dans le rapport.",
			actions: ['Voir le rapport']
		},
		{
			type: 'encours',
			titre: 'Import de 231 fichiers',
			detail: 'Poursuivi en arrière-plan — vous pouvez continuer à travailler.',
			actions: ['Suivre'],
			progres: 9
		}
	];

	const notifications = $derived<readonly Notification[]>(etat === 'empilement' ? EMPILEMENT : []);
</script>

{#snippet glyphe(type: string)}
	<svg
		width="17"
		height="17"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.9"
		>{#if type === 'succes'}<path d="M3 8.5l3.5 3.5L13 4.5" />{:else if type === 'erreur'}<circle
				cx="8"
				cy="8"
				r="6.2"
			/><path d="M8 4.5v4M8 11.2v.3" />{:else if type === 'info'}<circle
				cx="8"
				cy="8"
				r="6.2"
			/><path d="M8 7.2v4M8 4.7v.3" />{:else}<path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" /><path
				d="M2 2.5v3.6h3.6"
			/>{/if}</svg
	>
{/snippet}

<Coquille
	fil={['Accueil', 'Système de notification']}
	{univers}
	{domaines}
	{notes}
	{compte}
	version={instance.version}
	classeContenu="doc"
	{notifications}
>
	{#snippet enfants()}
		<header class="doc__tete">
			<h1>Système de notification</h1>
			<p>
				Confirmer, signaler, informer — sans jamais bloquer. Les notifications déclenchées depuis
				cette page sont celles du produit : même code, mêmes durées, mêmes comportements.
				Empilez-les, laissez-les, refermez-en une seule.
			</p>
		</header>

		<div id="types">
			{#each TYPES as t (t.id)}<section class="type-bloc">
					<div class="type-bloc__tete">
						<span class="type-bloc__sceau" aria-hidden="true" style="background:{t.couleur}"
							>{@render glyphe(t.id)}</span
						>
						<div style="min-width:0">
							<div class="type-bloc__nom">{t.nom}</div>
							<div class="type-bloc__regle">{t.regle}</div>
						</div>
						<span class="etiq" style="white-space:nowrap">{t.duree}</span>
					</div>
					<div class="type-bloc__exemples">
						{#each t.exemples as exemple (exemple)}<button class="btn" type="button"
								>{exemple}</button
							>{/each}
					</div>
				</section>{/each}
		</div>

		<div class="regles-c" id="regles">
			{#each REGLES as [nom, texte] (nom)}<div class="regle-c">
					<div class="regle-c__nom">{nom}</div>
					<div class="regle-c__txt">{texte}</div>
				</div>{/each}
		</div>

		<!-- ---------- Bac d'épreuve ---------- -->
		<section class="epreuve">
			<div class="epreuve__corps">
				<span class="etiq">Bac d'épreuve</span>
				<p
					style="font-size:var(--t-petit);color:var(--c-encre-2);line-height:1.55;margin:0;max-width:60ch"
				>
					Écrivez dans ce champ pendant qu'une notification est affichée, et vérifiez que le bouton
					d'enregistrement reste atteignable. Une notification qui recouvre un champ de saisie ou
					l'action en cours est une notification ratée.
				</p>
				<div class="champ">
					<label class="champ__label" for="test">Champ de saisie</label>
					<input
						class="saisie"
						type="text"
						id="test"
						placeholder="Tapez ici pendant qu'une notification est affichée"
					/>
				</div>
			</div>
			<div class="epreuve__barre">
				<span style="font-size:var(--t-mini);color:var(--c-encre-3)"
					>Barre d'action collée en bas, comme dans l'éditeur</span
				>
				<button class="btn btn--principal" id="test-enregistrer">Enregistrer</button>
			</div>
		</section>
	{/snippet}
</Coquille>
