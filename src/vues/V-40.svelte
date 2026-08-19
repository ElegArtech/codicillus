<script lang="ts">
	/**
	 * V-40 — Boîtes de dialogue. Catalogue transverse, pas une route.
	 *
	 * `docs/routes.md` §3.7 et §3.8 : V-40 est une SECTION de V-41, sans adresse
	 * propre (ARB-002) ; chaque dialogue s'exécute dans la vue qui le déclenche
	 * (C-06). Ce fichier n'existe que pour le mode démo —
	 * `/__design/V-40?etat=…` (`verif/banc/mode-demo.mjs`, ÉCART-011 É-1).
	 *
	 * DIX ÉTATS, TOUS DE ZONE — `verif/scenarios/V-40.json` : `dialog.dlg`, rangs
	 * 0 à 9. Le protocole est « page-entiere-zone-isolee »
	 * (`verif/references/protocole-app.json`) : la page rend LE CATALOGUE ET LES
	 * DIX `dialog.dlg` dans l'ordre de la maquette, celui de la clé demandée étant
	 * SEUL OUVERT. Rendre un dialogue unique ferait échouer la résolution du rang
	 * — le rang ne veut rien dire hors de l'ordre du document complet.
	 *
	 * AUCUN PILOTAGE, AUCUNE OUVERTURE AU CLIC — ARB-011. La maquette ouvre le
	 * dialogue en cliquant son entrée de catalogue et prépare son contenu à ce
	 * moment-là ; le squelette reçoit l'état par l'adresse et rend cet état. Les
	 * neuf autres dialogues restent donc dans leur forme initiale, non préparée,
	 * exactement comme la référence les laisse : ils sont fermés, donc absents du
	 * rendu comme de l'arbre d'accessibilité.
	 *
	 * `showModal()` N'EST PAS APPELÉ, et ne peut pas l'être : le rendu est un rendu
	 * serveur sans hydratation (ADR-001, ARB-011). L'attribut `open` place le
	 * dialogue dans le flux plutôt que dans la couche supérieure ; `.dlg__boite`
	 * étant en `position: fixed`, la boîte se pose au même endroit de la fenêtre.
	 * Le voile `::backdrop`, lui, n'existe qu'en modal — écart déclaré au rapport.
	 *
	 * TOUTES LES DONNÉES VIENNENT DE `seeds/corpus.ts`. Les décomptes de
	 * suppression sont calculés, jamais saisis : une confirmation destructive
	 * annonce le volume réel de ce qu'elle détruit (brief §3.6, point dur n° 8).
	 *
	 * LE CADRE VIENT DU GABARIT — `$lib/coquille/Coquille.svelte`, amendé par
	 * T-101b (ARB-015). La classe `doc` de `<main>` lui est passée en propriété :
	 * le cadre local que ce fichier composait faute d'elle (`ECART-015` É-1) est
	 * retiré, et la duplication avec lui. Les dix `<dialog>` restent au premier
	 * niveau du document, hors de la coquille, comme dans la maquette — ils y
	 * suivent la zone de notifications au lieu de la précéder, celle-ci étant en
	 * `position: fixed` et donc hors du flux : écart d'ORDRE de document déclaré
	 * au rapport, sans effet de mise en page.
	 *
	 * LA FRAÎCHEUR VIENT DE L'IMPLÉMENTATION UNIQUE — `$lib/fraicheur.ts`,
	 * extraite du gel par le lot P-0b. La restitution locale de `libelleFraicheur`
	 * que ce fichier portait, déclarée à `ECART-015` É-6, est RETIRÉE : elle était
	 * le second calcul dérivé de la fraîcheur du dépôt, et P-01 n'en admet qu'un.
	 * Le texte rendu est identique — la fabrique unique est la transcription
	 * littérale de `window.libelleFraicheur` du gel, dont la restitution locale
	 * était déjà la copie.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-40.css` (P-6.3). Les styles en ligne reproduits
	 * ci-dessous sont ceux de la maquette gelée — voir l'écart déclaré au rapport
	 * du lot : P-1.7 les refuse, la conformité pixel les impose.
	 */
	import {
		COMPTES,
		DOMAINES,
		INSTANCE,
		MOI,
		RELATIONS,
		TEMPLATES,
		TYPES_RELATION,
		UNIVERS,
		VERSIONS,
		type Note
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { libelleFraicheur } from '$lib/fraicheur';

	interface Proprietes {
		/** La clé de l'état demandé : le dialogue rendu ouvert. */
		etat: string;
		/** Le jeu de semence de la vue — `corpusPourVue('V-40')`, variante complète. */
		notes: readonly Note[];
	}

	const { etat, notes }: Proprietes = $props();

	/** Le dialogue ouvert à cet état. Aucun autre ne l'est. */
	const ouvert = $derived(etat);

	/** Le dossier dont la maquette démontre la suppression et les droits. */
	const DOSSIER = 'Exploitation › Sauvegardes';
	const DOMAINE_DOSSIER = 'Infrastructure';

	/** La note de démonstration — celle de V-14, V-15 et V-37. */
	const NOTE = $derived(notes.find((n) => n.id === 'n-restaurer-pg'));
	/**
	 * Pour la suppression, une note effectivement citée : le décompte de
	 * rétroliens n'a d'intérêt à être maquetté que s'il n'est pas nul.
	 */
	const NOTE_SUP = $derived(notes.find((n) => n.id === 'n-pg-prod-01'));

	/** Rétention par défaut quand la note n'a pas d'historique détaillé. */
	const VERSIONS_PAR_DEFAUT = 6;

	const versionsSup = $derived(
		NOTE_SUP ? (VERSIONS[NOTE_SUP.id]?.length ?? 0) || VERSIONS_PAR_DEFAUT : 0
	);
	const retroliensSup = $derived(
		NOTE_SUP ? RELATIONS.filter((r) => r.vers === NOTE_SUP.id).length : 0
	);
	/** Les notes rangées dans le dossier à supprimer, sous-dossiers compris. */
	const notesDuDossier = $derived(
		notes.filter((n) => n.domaine === DOMAINE_DOSSIER && n.dossier.startsWith(DOSSIER)).length
	);

	/** Les notes dont le titre recouvre au moins 60 % des mots significatifs. */
	function notesProches(titre: string): readonly Note[] {
		const mots = titre
			.toLowerCase()
			.split(/\s+/)
			.filter((m) => m.length > 3);
		if (mots.length < 2) return [];
		return notes
			.map((n) => {
				const champ = n.titre.toLowerCase();
				return { note: n, score: mots.filter((m) => champ.includes(m)).length / mots.length };
			})
			.filter((x) => x.score >= 0.6)
			.sort((a, b) => b.score - a.score)
			.map((x) => x.note);
	}

	const doublon = $derived(notesProches('Restaurer une sauvegarde PostgreSQL')[0] ?? NOTE);

	interface Droit {
		readonly qui: string;
		readonly role: string;
		readonly herite: boolean;
		readonly origine?: string;
	}

	/** Les droits posés sur le dossier de démonstration, explicites et hérités. */
	const DROITS: readonly Droit[] = [
		{ qui: 'Karim Belhadj', role: 'Gestion', herite: false },
		{ qui: 'Marc Ferreira', role: 'Écriture', herite: false },
		{ qui: 'Sophie Nguyen', role: 'Écriture', herite: true, origine: 'domaine Infrastructure' },
		{ qui: 'Léa Marchand', role: 'Lecture', herite: true, origine: 'dossier Exploitation' }
	];

	/** Les comptes actifs à qui aucun accès explicite ni hérité n'est encore posé. */
	const comptesSansAcces = $derived(
		COMPTES.filter((c) => c.actif && !DROITS.some((d) => d.qui === c.nom))
	);

	const initiales = (nom: string) =>
		nom
			.split(' ')
			.map((m) => m[0])
			.join('');

	/** Un dossier de destination : son nom, son décompte de notes, ses enfants. */
	interface Destination {
		readonly nom: string;
		readonly chemin: string;
		readonly notes: number;
		readonly enfants: readonly Destination[];
	}

	/**
	 * L'arborescence de destination d'un domaine, DANS L'ORDRE DE RANGEMENT du
	 * corpus — et non par ordre alphabétique comme le rail. C'est l'ordre que la
	 * maquette produit, et la sélection d'une destination se lit dans cet ordre.
	 * Une note compte pour le dossier terminal de son chemin.
	 */
	function destinations(domaine: string): readonly Destination[] {
		interface Brouillon {
			readonly nom: string;
			notes: number;
			readonly enfants: Brouillon[];
		}
		// Un tableau, et non une table associative : l'ORDRE D'INSERTION est ce qui
		// est rendu, et c'est celui du rangement du corpus.
		const racines: Brouillon[] = [];
		for (const note of notes) {
			if (note.domaine !== domaine || !note.dossier) continue;
			const segments = note.dossier
				.split('›')
				.map((s) => s.trim())
				.filter(Boolean);
			let niveau = racines;
			let courant: Brouillon | undefined;
			for (const segment of segments) {
				let branche = niveau.find((b) => b.nom === segment);
				if (!branche) {
					branche = { nom: segment, notes: 0, enfants: [] };
					niveau.push(branche);
				}
				courant = branche;
				niveau = branche.enfants;
			}
			// La note compte pour le dossier terminal de son chemin.
			if (courant) courant.notes += 1;
		}
		const figer = (niveau: readonly Brouillon[], prefixe: string): readonly Destination[] =>
			niveau.map((b) => {
				const chemin = prefixe ? `${prefixe} › ${b.nom}` : b.nom;
				return { nom: b.nom, chemin, notes: b.notes, enfants: figer(b.enfants, chemin) };
			});
		return figer(racines, '');
	}

	const arbresDeDestination = $derived(
		DOMAINES.map((d) => ({ nom: d.nom, racines: destinations(d.nom) })).filter(
			(d) => d.racines.length > 0
		)
	);

	interface EntreeDeCatalogue {
		readonly id: string;
		readonly nom: string;
		readonly ou: string;
		readonly quoi: string;
	}

	/** Le catalogue, dans l'ordre où la maquette présente les dix boîtes. */
	const CATALOGUE: readonly EntreeDeCatalogue[] = [
		{
			id: 'd-simple',
			nom: 'Confirmation simple',
			ou: 'motif de base',
			quoi: 'Deux issues, aucune conséquence irréversible. Le motif dont tous les autres dérivent.'
		},
		{
			id: 'd-note',
			nom: "Suppression d'une note",
			ou: 'V-14',
			quoi: 'Rappelle le titre, les rétroliens qui deviendront cassés et les versions perdues.'
		},
		{
			id: 'd-dossier',
			nom: "Suppression d'un dossier",
			ou: 'V-13',
			quoi: 'Décompte des sous-dossiers et des notes, puis saisie du nom exact pour confirmer.'
		},
		{
			id: 'd-restaurer',
			nom: "Restauration d'une version",
			ou: 'V-15',
			quoi:
				"Explique que l'état courant est conservé : restaurer ajoute une version, n'en écrase " +
				'aucune.'
		},
		{
			id: 'd-reviser',
			nom: 'Signalement à réviser',
			ou: 'V-14',
			quoi: 'Un champ de commentaire décrivant ce qui doit être revu.'
		},
		{
			id: 'd-droits',
			nom: "Droits d'un dossier",
			ou: 'V-13',
			quoi:
				'Le plus complexe : droits explicites et droits hérités, ces derniers montrés avec leur ' +
				'origine.'
		},
		{
			id: 'd-relation',
			nom: "Ajout d'une relation",
			ou: 'V-14',
			quoi: "Type, note visée, et l'aperçu de la phrase produite dans les deux sens."
		},
		{
			id: 'd-template',
			nom: 'Sélecteur de template',
			ou: 'V-17',
			quoi: "La page vierge d'abord, les structures éprouvées ensuite, avec leur plan."
		},
		{
			id: 'd-doublon',
			nom: 'Avertissement de doublon',
			ou: 'V-17',
			quoi: "Non bloquant : propose d'ouvrir l'existante ou de continuer."
		},
		{
			id: 'd-deplacer',
			nom: 'Sélecteur de dossier',
			ou: 'V-12 · V-13',
			quoi:
				'Arborescent, pour déplacer une note ou un dossier. La destination courante et les ' +
				'destinations impossibles sont signalées.'
		}
	];

	/** Les six règles communes à toutes les boîtes. */
	const REGLES: readonly (readonly [string, string])[] = [
		[
			'Le focus est piégé',
			"Tabulation et Maj+Tabulation tournent à l'intérieur de la boîte. Rien derrière n'est " +
				"atteignable tant qu'elle est ouverte."
		],
		[
			'Échap referme, sauf si vous avez saisi',
			'Ouvrez « Signaler à réviser », écrivez une ligne, appuyez sur Échap : la boîte résiste et ' +
				"propose d'abandonner explicitement."
		],
		[
			'Le focus retourne à son déclencheur',
			'À la fermeture, il revient sur le bouton qui a ouvert la boîte. Sans cela, la navigation au ' +
				'clavier repart du haut du document.'
		],
		[
			"L'action principale se distingue",
			"Une seule action pleine par boîte, à droite. L'action neutre est à sa gauche, en secondaire."
		],
		[
			"L'action destructive est à part",
			"Rouge, et jamais collée à l'action neutre. Dans les cas les plus graves, elle est séparée à " +
				"l'opposé du pied de boîte."
		],
		[
			'Le décompte précède la confirmation',
			"Une suppression annonce d'abord ce qu'elle détruit, chiffres à l'appui, avant de demander " +
				"l'accord."
		]
	];

	const compte = {
		nom: MOI.nom,
		initiales: MOI.initiales,
		role: MOI.role,
		domaine: MOI.domaine
	};
</script>

<!--
	L'ÉLÉMENT FOCAL DE CHAQUE BOÎTE, DÉCLARÉ — et non piloté.

	La maquette gelée le pose en script, à l'ouverture :
	`d.querySelector(".saisie, .selecteur, .btn--principal").focus()`
	(`mockups/V-40-dialogues.html:3189`). Le squelette n'a pas de script
	(ADR-001, ARB-011) ; il pose donc la même propriété en DÉCLARATION, par
	`autofocus`, que l'algorithme du délégué de focalisation de `showModal()`
	honore. Résultat identique des deux côtés, y compris pour `d-droits` et
	`d-deplacer` où la cible est désactivée : elle n'est pas une aire
	focalisable, la focalisation retombe donc sur le bouton de fermeture — ce
	que la maquette obtient parce que `focus()` y est sans effet.

	Sans cette déclaration, la référence portait l'anneau de `.saisie:focus`
	(`box-shadow: 0 0 0 3px var(--c-accent-voile)`) et le candidat non :
	4 380 px sur `d-dossier`, 4 746 sur `d-reviser`, 2 884 sur `d-relation`.
	C'est la cause réelle du jeton faux relevé par `ECART-017` É-2 — le voile
	n'est pas posé sur un bloc `.contexte`, il est celui de la focalisation.

	`a11y_autofocus` met en garde contre la focalisation automatique AU
	CHARGEMENT D'UNE PAGE. Ici la focalisation est celle d'un dialogue modal,
	que `RG-M18-08` et P-06 exigent : ne pas la poser serait la régression.
-->

{#snippet croix()}
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
	>
{/snippet}

{#snippet branche(d: Destination, domaine: string)}
	{@const courant = domaine === DOMAINE_DOSSIER && d.chemin === DOSSIER}
	<li>
		<label class="ac{courant ? ' ac--interdit' : ''}"
			><input type="radio" name="dest" disabled={courant} />{d.nom}<span class="ac__n"
				>{courant ? 'emplacement actuel' : d.notes || ''}</span
			></label
		>{#if d.enfants.length}<ul>
				{#each d.enfants as enfant (enfant.chemin)}{@render branche(enfant, domaine)}{/each}
			</ul>{/if}
	</li>
{/snippet}

<Coquille
	fil={['Accueil', 'Boîtes de dialogue']}
	univers={UNIVERS}
	domaines={DOMAINES}
	{notes}
	{compte}
	version={INSTANCE.version}
	classeContenu="doc"
>
	{#snippet enfants()}
		<header class="doc__tete">
			<h1>Boîtes de dialogue</h1>
			<p>
				Confirmer, saisir une information courte, ou présenter un formulaire secondaire sans quitter
				le contexte. Les dialogues ouverts depuis cette page sont ceux du produit, avec leurs
				décomptes réels : ouvrez-les, essayez de les fermer, saisissez quelque chose puis appuyez
				sur Échap.
			</p>
		</header>

		<div class="catalogue" id="catalogue">
			{#each CATALOGUE as entree (entree.id)}<article class="entree">
					<div class="entree__nom">{entree.nom}</div>
					<div class="entree__quoi">{entree.quoi}</div>
					<div class="entree__ou">{entree.ou}</div>
					<button class="btn" type="button">Ouvrir</button>
				</article>{/each}
		</div>

		<div class="regles-d" id="regles">
			{#each REGLES as [nom, texte] (nom)}<div class="regle-d">
					<div class="regle-d__nom">{nom}</div>
					<div class="regle-d__txt">{texte}</div>
				</div>{/each}
		</div>
	{/snippet}
</Coquille>

<!-- ============================ Confirmation simple ============================ -->
<dialog class="dlg" id="d-simple" aria-labelledby="t-simple" open={ouvert === 'd-simple'}>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M8 4.5v4.2M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-simple">Quitter la comparaison ?</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<p class="dlg__texte">
				Vous reviendrez à la lecture de la version courante. Rien n'est modifié.
			</p>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Rester ici</button>
			<!-- svelte-ignore a11y_autofocus -->
			<button class="btn btn--principal" data-fermer="" autofocus>Quitter</button>
		</div>
	</div>
</dialog>

<!-- ============================ Suppression d'une note ============================ -->
<dialog class="dlg dlg--destructif" id="d-note" aria-labelledby="t-note" open={ouvert === 'd-note'}>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					><path d="M8 4.5v4.2M8 11.4v.3" /><path
						d="M7 1.9L1.3 12.4a.9.9 0 0 0 .8 1.3h11.8a.9.9 0 0 0 .8-1.3L9 1.9a1.1 1.1 0 0 0-2 0z"
					/></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-note">Supprimer cette note</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<p class="dlg__texte" id="note-titre">
				{#if ouvert === 'd-note' && NOTE_SUP}« {NOTE_SUP.titre} » — {NOTE_SUP.domaine} › {NOTE_SUP.dossier}.{:else}—{/if}
			</p>
			<div class="decompte">
				<div class="decompte__titre">Ce qui disparaît avec elle</div>
				<ul id="note-decompte">
					{#if ouvert === 'd-note' && NOTE_SUP}<li>
							<b>{versionsSup}</b>{versionsSup > 1
								? 'versions de son historique'
								: 'version de son historique'}
						</li>
						<li>
							<b>{retroliensSup}</b>{retroliensSup > 1
								? 'notes qui pointent vers elle'
								: 'note qui pointe vers elle'}
						</li>
						<li><b>{NOTE_SUP.pj}</b>{NOTE_SUP.pj > 1 ? 'pièces jointes' : 'pièce jointe'}</li>{/if}
				</ul>
				<div class="decompte__note" id="note-liens">
					{#if ouvert === 'd-note'}{retroliensSup
							? `Les ${retroliensSup} liens qui mènent à cette note deviendront cassés dans les notes d'origine. Elles resteront lisibles, mais le lien ne mènera plus nulle part.`
							: 'Aucune note ne pointe vers celle-ci : sa suppression ne cassera aucun lien.'}{:else}—{/if}
				</div>
			</div>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Annuler</button>
			<!-- svelte-ignore a11y_autofocus -->
			<button
				class="btn btn--principal btn--destructif"
				autofocus
				data-fermer=""
				style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
				>Supprimer la note</button
			>
		</div>
	</div>
</dialog>

<!-- ============================ Suppression d'un dossier ============================ -->
<dialog
	class="dlg dlg--destructif"
	id="d-dossier"
	aria-labelledby="t-dossier"
	open={ouvert === 'd-dossier'}
>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					><path d="M8 4.5v4.2M8 11.4v.3" /><path
						d="M7 1.9L1.3 12.4a.9.9 0 0 0 .8 1.3h11.8a.9.9 0 0 0 .8-1.3L9 1.9a1.1 1.1 0 0 0-2 0z"
					/></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-dossier">Supprimer le dossier</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<div class="decompte">
				<div class="decompte__titre">Ce qui sera détruit</div>
				<ul id="dossier-decompte">
					{#if ouvert === 'd-dossier'}<li>
							<b>{notesDuDossier}</b>{notesDuDossier > 1 ? 'notes rangées ici' : 'note rangée ici'}
						</li>
						<li><b style="color:var(--c-encre-3)">0</b>sous-dossier</li>{/if}
				</ul>
				<div class="decompte__note">La suppression est définitive : il n'y a pas de corbeille.</div>
			</div>
			<div class="champ">
				<label class="champ__label" for="dossier-saisie">
					Pour confirmer, retapez le nom du dossier :
					<span class="confirmation__cible" id="dossier-cible">Sauvegardes</span>
				</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="saisie"
					autofocus
					type="text"
					id="dossier-saisie"
					autocomplete="off"
					spellcheck="false"
					placeholder="Nom du dossier"
				/>
			</div>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Annuler</button>
			<button
				class="btn btn--principal btn--destructif"
				id="dossier-valider"
				disabled
				style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
				>Supprimer définitivement</button
			>
		</div>
	</div>
</dialog>

<!-- ============================ Restauration d'une version ============================ -->
<dialog class="dlg" id="d-restaurer" aria-labelledby="t-restaurer" open={ouvert === 'd-restaurer'}>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" /><path d="M2 2.5v3.6h3.6" /></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-restaurer">Restaurer la version 11</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<p class="dlg__texte">
				Le contenu de la version 11, écrite par Sophie Nguyen le 12 mai 2026, redeviendra le contenu
				courant de la note.
			</p>
			<!-- L'inquiétude est « vais-je perdre l'état actuel ». La réponse passe
			     avant tout le reste. -->
			<div class="contexte contexte--succes" style="margin:0">
				<span class="contexte__marque" aria-hidden="true">✓</span>
				<div>
					<div class="contexte__titre">Rien n'est perdu, l'opération est réversible</div>
					<div>
						L'état actuel devient la version 15 et reste consultable dans l'historique. Restaurer
						n'écrase pas : cela ajoute une version au sommet de la pile.
					</div>
				</div>
			</div>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Annuler</button>
			<!-- svelte-ignore a11y_autofocus -->
			<button class="btn btn--principal" data-fermer="" autofocus>Restaurer cette version</button>
		</div>
	</div>
</dialog>

<!-- ============================ Signalement à réviser ============================ -->
<dialog class="dlg" id="d-reviser" aria-labelledby="t-reviser" open={ouvert === 'd-reviser'}>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true" style="background:var(--c-alerte)">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					><path d="M8 5.5v3.5M8 11.4v.3" /><path
						d="M7 2.4L1.6 12a.85.85 0 0 0 .75 1.25h11.3A.85.85 0 0 0 14.4 12L9 2.4a1.15 1.15 0 0 0-2 0z"
					/></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-reviser">Signaler cette note à réviser</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<p class="dlg__texte">
				Le référent du domaine recevra la demande. Elle apparaîtra sur son accueil et un bandeau
				sera visible en tête de la note.
			</p>
			<div class="champ">
				<label class="champ__label" for="reviser-txt">Qu'est-ce qui doit être revu ?</label>
				<!-- svelte-ignore a11y_autofocus -->
				<textarea
					class="saisie"
					autofocus
					id="reviser-txt"
					rows="3"
					placeholder="La commande de l'étape 4 a changé depuis la version 3.11 de Barman."
				></textarea>
				<span class="champ__aide"
					>Décrivez ce qui vous semble faux ou périmé. Une demande précise est traitée en quelques
					minutes ; une demande vague dort des semaines.</span
				>
			</div>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Annuler</button>
			<button class="btn btn--principal" data-fermer="">Envoyer la demande</button>
		</div>
	</div>
</dialog>

<!-- ============================ Droits d'un dossier ============================ -->
<dialog
	class="dlg dlg--large"
	id="d-droits"
	aria-labelledby="t-droits"
	open={ouvert === 'd-droits'}
>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					><rect x="3" y="7" width="10" height="6.5" rx="1.3" /><path
						d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
					/></svg
				>
			</span>
			<div style="flex:1;min-width:0">
				<h2 class="dlg__titre" id="t-droits">Droits du dossier Sauvegardes</h2>
				<div style="font-size:var(--t-mini);color:var(--c-encre-3);margin-top:2px">
					Infrastructure › Exploitation › Sauvegardes
				</div>
			</div>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<span class="etiq">Droits accordés</span>
			<div class="droits" id="liste-droits">
				{#if ouvert === 'd-droits'}{#each DROITS as d (d.qui)}<div
							class="dr"
							data-herite={d.herite ? 'oui' : 'non'}
						>
							<span class="dr__avatar">{initiales(d.qui)}</span>
							<div style="min-width:0">
								<div class="dr__nom">{d.qui}</div>
								{#if d.herite}<div class="dr__origine">
										<svg
											width="10"
											height="10"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="2"><path d="M4 2v8a2 2 0 0 0 2 2h6" /></svg
										>hérité du {d.origine}
									</div>{/if}
							</div>
							<span class="dr__role">{d.role}</span>{#if d.herite}<span style="width:27px"
								></span>{:else}<button
									class="dr__retirer"
									type="button"
									aria-label="Retirer l'accès de {d.qui}"
									><svg
										width="14"
										height="14"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
									></button
								>{/if}
						</div>{/each}{/if}
			</div>

			<div class="champ">
				<span class="champ__label">Ajouter un accès</span>
				<div class="dr-ajout">
					<!-- svelte-ignore a11y_autofocus -->
					<select
						class="selecteur"
						autofocus
						id="droit-qui"
						aria-label="Personne"
						disabled={ouvert === 'd-droits' && comptesSansAcces.length === 0}
						>{#if ouvert === 'd-droits'}{#if comptesSansAcces.length}{#each comptesSansAcces as c (c.nom)}<option
										value={c.nom}>{c.nom} — {c.role}</option
									>{/each}{:else}<option>Tous les comptes ont déjà un accès</option
								>{/if}{/if}</select
					>
					<select class="selecteur" id="droit-role" aria-label="Rôle sur ce dossier">
						<option value="Lecture">Lecture</option>
						<option value="Écriture">Écriture</option>
						<option value="Gestion">Gestion</option>
					</select>
					<button class="btn btn--principal" id="droit-ajouter">Ajouter</button>
				</div>
			</div>

			<div class="decompte">
				<div class="decompte__titre">Droits explicites et droits hérités</div>
				<div class="decompte__note">
					Les droits en pointillé sont hérités d'un dossier parent ou du domaine. <b
						>Retirer un droit explicite ne retire pas un droit hérité</b
					> : si Sophie Nguyen a l'écriture sur tout le domaine, lui retirer l'écriture ici la lui laisse
					— il faut la retirer là où elle a été accordée. Le nom du dossier d'origine est indiqué sous
					chaque droit hérité.
				</div>
			</div>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Fermer</button>
			<button class="btn btn--principal" data-fermer="">Enregistrer les droits</button>
		</div>
	</div>
</dialog>

<!-- ============================ Ajout d'une relation ============================ -->
<dialog class="dlg" id="d-relation" aria-labelledby="t-relation" open={ouvert === 'd-relation'}>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					><circle cx="4" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><path
						d="M5.6 5.6l4.8 4.8"
					/></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-relation">Ajouter une relation</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<div class="champ">
				<label class="champ__label" for="rel-type">Type de relation</label>
				<!-- svelte-ignore a11y_autofocus -->
				<select class="selecteur" id="rel-type" autofocus
					>{#if ouvert === 'd-relation'}{#each Object.entries(TYPES_RELATION) as [cle, libelles] (cle)}<option
								value={cle}>{libelles.sortant}</option
							>{/each}{/if}</select
				>
				<span class="champ__aide" id="rel-usage"
					>{#if ouvert === 'd-relation'}Se lira « {TYPES_RELATION.heberge.sortant} » depuis cette note,
						et « {TYPES_RELATION.heberge.entrant} » depuis l'autre.{/if}</span
				>
			</div>
			<div class="champ rel-cible">
				<label class="champ__label" for="rel-cherche">Note visée</label>
				<input
					class="saisie"
					type="search"
					id="rel-cherche"
					autocomplete="off"
					placeholder="Chercher une note…"
				/>
				<div class="rel-liste" id="rel-liste" role="listbox"></div>
			</div>
			<div class="champ">
				<span class="champ__label">Ce que cela produira</span>
				<div id="rel-apercu">
					{#if ouvert === 'd-relation' && NOTE}<div class="phrase-rel">
							<span class="phrase-rel__sens">sens direct</span><span
								><i>{NOTE.titre}</i> <b>{TYPES_RELATION.heberge.sortant}</b>
								<span class="phrase-rel__vide">…note à choisir…</span>.</span
							>
						</div>
						<div class="phrase-rel">
							<span class="phrase-rel__sens">sens inverse</span><span
								><span class="phrase-rel__vide">…note à choisir…</span>
								<b>{TYPES_RELATION.heberge.entrant}</b> <i>{NOTE.titre}</i>.</span
							>
						</div>{/if}
				</div>
			</div>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Annuler</button>
			<button class="btn btn--principal" id="rel-valider" disabled>Déclarer la relation</button>
		</div>
	</div>
</dialog>

<!-- ============================ Sélecteur de template ============================ -->
<dialog
	class="dlg dlg--large"
	id="d-template"
	aria-labelledby="t-template"
	open={ouvert === 'd-template'}
>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					><rect x="2" y="2.5" width="12" height="11" rx="1.4" /><path d="M2 6h12M6 6v7.5" /></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-template">Par quoi commencer ?</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<!-- svelte-ignore a11y_autofocus -->
			<button
				class="btn btn--principal"
				autofocus
				data-fermer=""
				style="width:100%;padding:12px;justify-content:flex-start;gap:var(--e-3)"
			>
				<svg
					width="17"
					height="17"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><path
						d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"
					/></svg
				>
				Partir d'une page vierge
			</button>
			<span class="etiq">Ou reprendre une structure éprouvée</span>
			<div class="tpl-liste" id="templates">
				{#if ouvert === 'd-template'}{#each TEMPLATES as t (t.id)}<button class="tpl" type="button"
							><span class="tpl__ic">{t.type.slice(0, 3).toUpperCase()}</span><span
								><span class="tpl__nom">{t.nom}</span><span class="tpl__desc">{t.description}</span
								><span class="tpl__struct">{t.structure.join(' › ')}</span></span
							></button
						>{/each}{/if}
			</div>
		</div>
	</div>
</dialog>

<!-- ============================ Avertissement de doublon ============================ -->
<dialog class="dlg" id="d-doublon" aria-labelledby="t-doublon" open={ouvert === 'd-doublon'}>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true" style="background:var(--c-alerte)">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M8 4.5v4.2M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-doublon">Une note très proche existe déjà</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<p class="dlg__texte" id="doublon-txt">
				{#if ouvert === 'd-doublon' && doublon}« {doublon.titre} » — {doublon.domaine}, {libelleFraicheur(
						doublon
					).toLowerCase()}, consultée {doublon.vues} fois.{:else}—{/if}
			</p>
			<p class="dlg__texte">
				Deux notes sur le même sujet finissent toujours par diverger, et personne ne sait plus
				laquelle fait foi. Compléter l'existante rend en général plus service.
			</p>
		</div>
		<div class="dlg__pied dlg__pied--reparti">
			<button class="btn" data-fermer="">Continuer quand même</button>
			<!-- svelte-ignore a11y_autofocus -->
			<button class="btn btn--principal" data-fermer="" autofocus>Ouvrir la note existante</button>
		</div>
	</div>
</dialog>

<!-- ============================ Sélecteur de dossier ============================ -->
<dialog class="dlg" id="d-deplacer" aria-labelledby="t-deplacer" open={ouvert === 'd-deplacer'}>
	<div class="dlg__boite">
		<div class="dlg__tete">
			<span class="dlg__marque" aria-hidden="true">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					><path
						d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
					/></svg
				>
			</span>
			<h2 class="dlg__titre" id="t-deplacer">Déplacer « {NOTE ? NOTE.titre : ''} »</h2>
			<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
				{@render croix()}
			</button>
		</div>
		<div class="dlg__corps">
			<span class="etiq">Choisissez le dossier de destination</span>
			<div class="arbre-choix" id="arbre-choix">
				{#if ouvert === 'd-deplacer'}{#each arbresDeDestination as domaine (domaine.nom)}<div
							class="etiq"
							style="margin:var(--e-2) 0 var(--e-1)"
						>
							{domaine.nom}
						</div>
						<ul>
							{#each domaine.racines as racine (racine.chemin)}{@render branche(
									racine,
									domaine.nom
								)}{/each}
						</ul>{/each}{/if}
			</div>
			<p class="dlg__texte" id="deplacer-etat">
				Emplacement actuel : {DOMAINE_DOSSIER} › {DOSSIER}
			</p>
		</div>
		<div class="dlg__pied">
			<button class="btn" data-fermer="">Annuler</button>
			<!-- svelte-ignore a11y_autofocus -->
			<button class="btn btn--principal" id="deplacer-valider" disabled autofocus>Déplacer</button>
		</div>
	</div>
</dialog>
