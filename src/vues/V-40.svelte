<script lang="ts">
	/**
	 * V-40 — Boîtes de dialogue. Catalogue transverse, pas une route : V-40 est une
	 * SECTION de V-41, sans adresse propre (`ARB-002`), et chaque dialogue s'exécute
	 * dans la vue qui le déclenche (`docs/routes.md` §3.7 et §3.8).
	 *
	 * DEUX RÉGIMES. `catalogue` vraie — le défaut — rend LE CATALOGUE ET LES DIX
	 * `dialog.dlg` dans l'ordre de la maquette, celui de `etat` étant seul ouvert.
	 * `catalogue` fausse rend LE SEUL dialogue nommé par `etat`, sans cadre et sans
	 * `open`, pour que la vue qui le déclenche le monte chez elle — `d-relation`
	 * porte `ou: "V-14"` en toutes lettres (`V-40:3252`).
	 *
	 * `showModal()` n'est pas appelé ici : l'attribut `open` place le dialogue dans
	 * le flux plutôt que dans la couche supérieure, et le voile `::backdrop` n'existe
	 * qu'en modal.
	 *
	 * TOUTES LES DONNÉES VIENNENT DE L'HÔTE, ET AUCUNE DU JEU DE DÉMONSTRATION : les
	 * décomptes de suppression sont calculés sur ce qui est servi, et une
	 * confirmation destructive annonce le volume réel de ce qu'elle détruit — zéro
	 * quand rien ne lui est servi.
	 *
	 * Le cadre vient du gabarit ; les dix `<dialog>` restent au premier niveau du
	 * document, hors de la coquille, comme dans la maquette. Le style est dans
	 * `src/socle.css` et `src/vues/V-40.css`.
	 */
	import type {
		Compte,
		Domaine,
		IdentifiantNote,
		LibellesDeRelation,
		Note,
		Relation,
		Template,
		Univers,
		Version
	} from '../../seeds/corpus';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { libelleFraicheur } from '$lib/fraicheur';
	import { accord } from '$lib/vocabulaire';

	interface Proprietes {
		etat: string;
		notes: readonly Note[];
		/**
		 * LE CATALOGUE, OU UN SEUL DIALOGUE. `docs/routes.md:211` : V-40 n'a aucune
		 * adresse propre, « chaque dialogue s'exécute dans la vue qui le déclenche ».
		 *
		 * FAUSSE, la vue rend le seul dialogue nommé par `etat`, SANS `open` : c'est
		 * l'hôte qui pilote la modalité par `showModal()`, parce que le voile, le piège
		 * de focus et Échap n'existent qu'en modal. LES NEUF AUTRES NE SONT PAS RENDUS :
		 * ils portent des actions que l'hôte n'a aucune raison d'offrir, et les poser
		 * fermés les mettrait dans le DOM, ce que `P-09` refuse.
		 */
		catalogue: boolean;
		/** LES SOURCES DE LA COQUILLE ET DES DIALOGUES : leur défaut est l'ENSEMBLE
		    VIDE. C'était la constante du jeu de démonstration, et les dialogues
		    annonçaient les comptes, les relations et l'historique des maquettes. */
		/** Les univers déclarés — le contexte de coquille les porte. Vide : aucun. */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		/** Le compte connecté — même canal. `null` : personne n'est connecté. */
		compte?: CompteAffiche | null;
		comptes?: readonly Compte[];
		relations?: readonly Relation[];
		templates?: readonly Template[];
		/**
		 * LES LIBELLÉS DES TYPES DE RELATION — REQUISE. LES CLÉS NE SONT PAS FERMÉES :
		 * `CleDeTypeDeRelation` énumère les six types du jeu de semence, mais le produit
		 * les fait ADMINISTRER (`M14`), et un chargeur qui sert la table réelle ne peut
		 * promettre aucune de ces clés. L'ORDRE est celui d'administration.
		 */
		typesRelation: Readonly<Record<string, LibellesDeRelation>>;
		/**
		 * LES NOTES QUE `d-relation` PEUT VISER — vide : AUCUNE, ET LA BOÎTE LE DIT. Le
		 * dialogue cherche sa cible dans une liste que l'hôte peuple à la frappe : sur
		 * une instance à une seule note, le champ restait ouvert, la liste vide et le
		 * bouton grisé sans un mot. SEULE LA VACUITÉ EST LUE ICI.
		 */
		ciblesDeRelation?: readonly { readonly identifiant: string; readonly titre: string }[];
		/**
		 * L'historique par note. Vide : aucun n'est lu. La table est PARTIELLE —
		 * une note sans historique n'a pas d'entrée, et exiger les clés du corpus
		 * interdirait l'état neutre (`P-02`).
		 */
		versions?: Partial<Record<IdentifiantNote, readonly Version[]>>;
		/**
		 * LA NOTE DONT LES DIALOGUES PARLENT — REQUISE. `d-relation` compose l'aperçu
		 * « Ce que cela produira » autour du TITRE de la note d'où part la relation
		 * (`V-40:3450`) ; fixée à une note de démonstration, le dialogue monté chez son
		 * hôte annonçait une relation partant d'une AUTRE note que celle qu'on regarde.
		 */
		note: Note;
		/** LE DOSSIER DONT `d-dossier` ET `d-droits` PARLENT — `null` : AUCUN. C'étaient
		    deux littéraux du jeu de démonstration posés au niveau du module, et les
		    boîtes annonçaient la destruction d'un dossier des maquettes. */
		dossier?: { readonly domaine: string; readonly chemin: string } | null;
	}

	const {
		etat,
		notes,
		catalogue,
		note,
		univers = [],
		domaines = [],
		compte = null,
		comptes = [],
		relations = [],
		templates = [],
		typesRelation,
		ciblesDeRelation = [],
		versions = {},
		dossier = null
	}: Proprietes = $props();

	/** Le compte servi à la coquille. Hors gabarit racine, il n'y a PAS de compte connecté. */
	const COMPTE_ABSENT: CompteAffiche = { nom: '', initiales: '', role: '', domaine: '' };

	/** Le dialogue dont le CONTENU est préparé. Aucun autre ne l'est. */
	const ouvert = $derived(etat);

	/** Le dialogue RENDU. Au catalogue, les dix ; hors catalogue, celui-là seul. */
	function rendu(cle: string): boolean {
		return catalogue || etat === cle;
	}

	/**
	 * Le dialogue qui porte l'attribut `open`. HORS CATALOGUE, AUCUN : le produit
	 * ouvre sa boîte au clic par `showModal()`, seul appel qui donne le voile, le
	 * piège de focus et la fermeture par Échap (`RG-M18-08`).
	 */
	function revele(cle: string): boolean {
		return catalogue && ouvert === cle;
	}

	const nomDuDossier = $derived(dossier === null ? '' : (dossier.chemin.split(' › ').pop() ?? ''));
	const cheminDuDossier = $derived(
		dossier === null ? '' : `${dossier.domaine} › ${dossier.chemin}`
	);

	/** La note dont les dialogues parlent — celle qu'on lit, et aucune autre. */
	const NOTE = $derived(note);

	/* Où la note est rangée maintenant — ce que `d-deplacer` annonce, et le seul
	   emplacement qu'il interdit de choisir. Les deux sites lisaient deux littéraux
	   du jeu. Un dossier vide désigne la racine du domaine. */
	const emplacementDeLaNote = $derived(
		NOTE.dossier ? `${NOTE.domaine} › ${NOTE.dossier}` : NOTE.domaine
	);

	/** LE TYPE DE RELATION PROPOSÉ D'ENTRÉE — le premier du référentiel :
	    `prepRelation()` remplit le sélecteur dans l'ordre des clés puis lit
	    `select.value`. Le gel écrivait `heberge` parce qu'il est la première clé, non
	    parce que ce type aurait un statut. */
	const premierType = $derived<LibellesDeRelation>(
		Object.values(typesRelation)[0] ?? { sortant: '', entrant: '' }
	);

	/** CE QUI EMPÊCHE `d-relation` D'ABOUTIR, ET IL Y EN A DEUX. Le repli ci-dessus
	    rend deux libellés vides quand le référentiel l'est, et l'aide composait
	    dessus : « Se lira «  » depuis cette note » sous un sélecteur sans option. */
	const sansTypeDeRelation = $derived(Object.keys(typesRelation).length === 0);
	const sansCibleDeRelation = $derived(ciblesDeRelation.length === 0);
	const relationImpossible = $derived(sansTypeDeRelation || sansCibleDeRelation);
	/** La note que la confirmation de suppression nomme. C'était une note du jeu
	    retrouvée dans le corpus servi : la boîte annonçait la destruction d'une
	    AUTRE note que celle qu'on regarde. */
	const NOTE_SUP = $derived(note);

	/* Ce qui disparaît avec la note, compté sur ce qui est servi — et rien de plus.
	   Le décompte se repliait sur six versions tirées de la maquette, et ce repli
	   valait TOUJOURS depuis que l'historique n'a plus le jeu pour défaut. */
	const versionsSup = $derived(versions[NOTE_SUP.id]?.length ?? 0);
	const retroliensSup = $derived(relations.filter((r) => r.vers === NOTE_SUP.id).length);
	const notesDuDossier = $derived(
		dossier === null
			? 0
			: notes.filter((n) => n.domaine === dossier.domaine && n.dossier.startsWith(dossier.chemin))
					.length
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

	/**
	 * LA NOTE PROCHE DE CELLE QU'ON ÉCRIT. Le titre cherché était le littéral du
	 * gel, et l'avertissement de doublon désignait donc toujours la même note.
	 */
	const doublon = $derived(notesProches(NOTE.titre)[0] ?? NOTE);

	interface Droit {
		readonly qui: string;
		readonly role: string;
		readonly herite: boolean;
		readonly origine?: string;
	}

	/** LES DROITS POSÉS SUR LE DOSSIER — AUCUN N'EST LU, ET LA TABLE EST DONC VIDE.
	    Elle nommait quatre comptes du jeu de démonstration servis comme des faits ;
	    `droits_de_dossier` n'est lue par aucun chargeur qui monte cette vue. */
	const DROITS: readonly Droit[] = [];

	const comptesSansAcces = $derived(
		comptes.filter((c) => c.actif && !DROITS.some((d) => d.qui === c.nom))
	);

	const initiales = (nom: string) =>
		nom
			.split(' ')
			.map((m) => m[0])
			.join('');

	interface Destination {
		readonly nom: string;
		readonly chemin: string;
		readonly notes: number;
		readonly enfants: readonly Destination[];
	}

	/**
	 * L'arborescence de destination d'un domaine, DANS L'ORDRE DE RANGEMENT du
	 * corpus — et non par ordre alphabétique comme le rail : c'est l'ordre que la
	 * maquette produit. Une note compte pour le dossier terminal de son chemin.
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
		domaines
			.map((d) => ({ nom: d.nom, racines: destinations(d.nom) }))
			.filter((d) => d.racines.length > 0)
	);

	interface EntreeDeCatalogue {
		readonly id: string;
		readonly nom: string;
		readonly ou: string;
		readonly quoi: string;
	}

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
</script>

<!--
	L'ÉLÉMENT FOCAL DE CHAQUE BOÎTE, DÉCLARÉ — et non piloté. La maquette le pose en
	script à l'ouverture (`mockups/V-40-dialogues.html:3189`) ; ici `autofocus`
	déclare la même propriété, que le délégué de focalisation de `showModal()`
	honore. Pour `d-droits` et `d-deplacer` la cible est désactivée, donc non
	focalisable, et la focalisation retombe sur le bouton de fermeture — ce que la
	maquette obtient parce que `focus()` y est sans effet. `a11y_autofocus` vise la
	focalisation au CHARGEMENT D'UNE PAGE ; ici c'est celle d'un dialogue modal, que
	`RG-M18-08` exige.
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
	{@const courant = domaine === NOTE.domaine && d.chemin === NOTE.dossier}
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

{#if catalogue}
	<Coquille
		fil={['Accueil', 'Boîtes de dialogue']}
		{univers}
		{domaines}
		{notes}
		compte={compte ?? COMPTE_ABSENT}
		version=""
		classeContenu="doc"
	>
		{#snippet enfants()}
			<header class="doc__tete">
				<h1>Boîtes de dialogue</h1>
				<p>
					Confirmer, saisir une information courte, ou présenter un formulaire secondaire sans
					quitter le contexte. Les dialogues ouverts depuis cette page sont ceux du produit, avec
					leurs décomptes réels : ouvrez-les, essayez de les fermer, saisissez quelque chose puis
					appuyez sur Échap.
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
{/if}

<!-- ============================ Confirmation simple ============================ -->
{#if rendu('d-simple')}
	<dialog class="dlg" id="d-simple" aria-labelledby="t-simple" open={revele('d-simple')}>
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
						><path d="M8 4.5v4.2M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
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
{/if}

<!-- ============================ Suppression d'une note ============================ -->
{#if rendu('d-note')}
	<dialog class="dlg dlg--destructif" id="d-note" aria-labelledby="t-note" open={revele('d-note')}>
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
								<b>{retroliensSup}</b>{accord(
									retroliensSup,
									'note qui pointe vers elle',
									'notes qui pointent vers elle'
								)}
							</li>
							<li>
								<b>{NOTE_SUP.pj}</b>{accord(NOTE_SUP.pj, 'pièce jointe', 'pièces jointes')}
							</li>{/if}
					</ul>
					<div class="decompte__note" id="note-liens">
						{#if ouvert === 'd-note'}{retroliensSup
								? accord(
										retroliensSup,
										"Le lien qui mène à cette note deviendra cassé dans la note d'origine. Elle restera lisible, mais le lien ne mènera plus nulle part.",
										`Les ${retroliensSup} liens qui mènent à cette note deviendront cassés dans les notes d'origine. Elles resteront lisibles, mais le lien ne mènera plus nulle part.`
									)
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
{/if}

<!-- ============================ Suppression d'un dossier ============================ -->
{#if rendu('d-dossier')}
	<dialog
		class="dlg dlg--destructif"
		id="d-dossier"
		aria-labelledby="t-dossier"
		open={revele('d-dossier')}
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
								<b>{notesDuDossier}</b>{notesDuDossier > 1
									? 'notes rangées ici'
									: 'note rangée ici'}
							</li>
							<li><b style="color:var(--c-encre-3)">0</b>sous-dossier</li>{/if}
					</ul>
					<div class="decompte__note">
						La suppression est définitive : il n'y a pas de corbeille.
					</div>
				</div>
				<div class="champ">
					<label class="champ__label" for="dossier-saisie">
						Pour confirmer, retapez le nom du dossier :
						<span class="confirmation__cible" id="dossier-cible">{nomDuDossier}</span>
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
{/if}

<!-- ============================ Restauration d'une version ============================ -->
{#if rendu('d-restaurer')}
	<dialog class="dlg" id="d-restaurer" aria-labelledby="t-restaurer" open={revele('d-restaurer')}>
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
						><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" /><path d="M2 2.5v3.6h3.6" /></svg
					>
				</span>
				<h2 class="dlg__titre" id="t-restaurer">Restaurer la version 11</h2>
				<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
					{@render croix()}
				</button>
			</div>
			<div class="dlg__corps">
				<!-- L'ATTRIBUTION ÉTAIT CELLE DU GEL — « écrite par Sophie Nguyen le
				     12 mai 2026 » — et ne s'affichait jamais : aucune route ne monte ce
				     dialogue. Nommer un auteur et une date demanderait que la version soit
				     SERVIE ; la phrase dit donc ce que le geste fait, et rien de plus. -->
				<p class="dlg__texte">
					Le contenu de cette version redeviendra le contenu courant de la note.
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
{/if}

<!-- ============================ Signalement à réviser ============================ -->
{#if rendu('d-reviser')}
	<dialog class="dlg" id="d-reviser" aria-labelledby="t-reviser" open={revele('d-reviser')}>
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
						placeholder="La commande de l'étape 4 a changé depuis la dernière mise à jour de l'outil."
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
{/if}

<!-- ============================ Droits d'un dossier ============================ -->
{#if rendu('d-droits')}
	<dialog class="dlg dlg--large" id="d-droits" aria-labelledby="t-droits" open={revele('d-droits')}>
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
					<h2 class="dlg__titre" id="t-droits">
						{nomDuDossier === '' ? 'Droits du dossier' : `Droits du dossier ${nomDuDossier}`}
					</h2>
					<div style="font-size:var(--t-mini);color:var(--c-encre-3);margin-top:2px">
						{cheminDuDossier}
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
						> : si un compte a l'écriture sur tout le domaine, la lui retirer ici la lui laisse — il faut
						la retirer là où elle a été accordée. Le nom du dossier d'origine est indiqué sous chaque
						droit hérité.
					</div>
				</div>
			</div>
			<div class="dlg__pied">
				<button class="btn" data-fermer="">Fermer</button>
				<button class="btn btn--principal" data-fermer="">Enregistrer les droits</button>
			</div>
		</div>
	</dialog>
{/if}

<!-- ============================ Ajout d'une relation ============================ -->
{#if rendu('d-relation')}
	<dialog class="dlg" id="d-relation" aria-labelledby="t-relation" open={revele('d-relation')}>
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
					<!--
							UN SÉLECTEUR QUI NE PEUT RIEN OFFRIR LE DIT ET SE FERME — même motif que
							`#droit-qui` plus haut : une option de repli qui NOMME le vide, et
							`disabled`. Sans elle, la boîte présentait une liste déroulante vide.
						-->
					<!-- svelte-ignore a11y_autofocus -->
					<select
						class="selecteur"
						id="rel-type"
						autofocus
						disabled={ouvert === 'd-relation' && sansTypeDeRelation}
						>{#if ouvert === 'd-relation'}{#each Object.entries(typesRelation) as [cle, libelles] (cle)}<option
									value={cle}>{libelles.sortant}</option
								>{:else}<option>Aucun type de relation n'existe encore</option>{/each}{/if}</select
					>
					<!--
							L'AIDE NE COMPOSE PLUS SUR UN LIBELLÉ ABSENT : elle écrivait « Se lira
							«  » depuis cette note » dès que le référentiel était vide. Elle nomme
							désormais le geste ET son adresse.
						-->
					<span class="champ__aide" id="rel-usage"
						>{#if ouvert === 'd-relation'}{#if sansTypeDeRelation}Aucun type de relation n'existe
								encore sur cette instance : une relation ne peut pas être qualifiée. Créez-en un
								dans la console, à l'adresse /console/types-de-relations — réservée à
								l'administrateur —, puis revenez.{:else}Se lira « {premierType.sortant} » depuis cette
								note, et « {premierType.entrant}
								» depuis l'autre.{/if}{/if}</span
					>
				</div>
				<div class="champ rel-cible">
					<label class="champ__label" for="rel-cherche">Note visée</label>
					<input
						class="saisie"
						type="search"
						id="rel-cherche"
						autocomplete="off"
						disabled={ouvert === 'd-relation' && relationImpossible}
						placeholder="Chercher une note…"
					/>
					<div class="rel-liste" id="rel-liste" role="listbox"></div>
					<!-- L'AUTRE MANQUE, ET IL NE SE SOIGNE PAS AU MÊME ENDROIT : chercher une
							note visée n'a aucun sens quand il n'y en a aucune à trouver. -->
					{#if ouvert === 'd-relation' && sansCibleDeRelation}<span class="champ__aide"
							>Aucune autre note n'est offerte : déclarer une relation exige le droit d'écriture sur
							les deux extrémités. Créez-en une seconde à l'adresse /notes/nouvelle, ou faites-vous
							accorder l'écriture sur la note que vous visez.</span
						>{/if}
				</div>
				<div class="champ">
					<!--
						L'APERÇU NE S'ANNONCE QUE S'IL PEUT MONTRER QUELQUE CHOSE. La zone n'est
						JAMAIS retirée du document : l'hôte la cherche par son identifiant pour y
						composer les deux phrases, et son absence désarmerait tout le câblage.
					-->
					{#if !relationImpossible}<span class="champ__label">Ce que cela produira</span>{/if}
					<div id="rel-apercu">
						{#if ouvert === 'd-relation' && !relationImpossible}<div class="phrase-rel">
								<span class="phrase-rel__sens">sens direct</span><span
									><i>{NOTE.titre}</i> <b>{premierType.sortant}</b>
									<span class="phrase-rel__vide">…note à choisir…</span>.</span
								>
							</div>
							<div class="phrase-rel">
								<span class="phrase-rel__sens">sens inverse</span><span
									><span class="phrase-rel__vide">…note à choisir…</span>
									<b>{premierType.entrant}</b> <i>{NOTE.titre}</i>.</span
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
{/if}

<!-- ============================ Sélecteur de template ============================ -->
{#if rendu('d-template')}
	<dialog
		class="dlg dlg--large"
		id="d-template"
		aria-labelledby="t-template"
		open={revele('d-template')}
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
					{#if ouvert === 'd-template'}{#each templates as t (t.id)}<button
								class="tpl"
								type="button"
								><span class="tpl__ic">{t.type.slice(0, 3).toUpperCase()}</span><span
									><span class="tpl__nom">{t.nom}</span><span class="tpl__desc"
										>{t.description}</span
									><span class="tpl__struct">{t.structure.join(' › ')}</span></span
								></button
							>{/each}{/if}
				</div>
			</div>
		</div>
	</dialog>
{/if}

<!-- ============================ Avertissement de doublon ============================ -->
{#if rendu('d-doublon')}
	<dialog class="dlg" id="d-doublon" aria-labelledby="t-doublon" open={revele('d-doublon')}>
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
						><path d="M8 4.5v4.2M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
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
				<button class="btn btn--principal" data-fermer="" autofocus>Ouvrir la note existante</button
				>
			</div>
		</div>
	</dialog>
{/if}

<!-- ============================ Sélecteur de dossier ============================ -->
{#if rendu('d-deplacer')}
	<dialog class="dlg" id="d-deplacer" aria-labelledby="t-deplacer" open={revele('d-deplacer')}>
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
					Emplacement actuel : {emplacementDeLaNote}
				</p>
			</div>
			<div class="dlg__pied">
				<button class="btn" data-fermer="">Annuler</button>
				<!-- svelte-ignore a11y_autofocus -->
				<button class="btn btn--principal" id="deplacer-valider" disabled autofocus>Déplacer</button
				>
			</div>
		</div>
	</dialog>
{/if}
