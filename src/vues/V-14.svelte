<script lang="ts">
	/**
	 * V-14 — Lecture d'une note. Route `/notes/{identifiant}` (`docs/routes.md`).
	 *
	 * LA VUE CENTRALE DU PRODUIT : c'est d'elle que les autres empruntent leur idée du
	 * témoin, du cartouche et des deux registres.
	 *
	 * Coquille de forme COMPLÈTE. Le lien d'évitement vise `#article`, pas `<main>`
	 * (`ARB-019`) : c'est une ancre INTÉRIEURE au contenu.
	 *
	 * DEUX ATTRIBUTS DE DONNÉES HORS GABARIT — `data-etat` et `data-registre`, portés
	 * par `donnees`. Le premier commande l'état de chargement (`V-14.css:571-572`) :
	 * LES DEUX ARBRES SONT DONC RENDUS EN PERMANENCE, réel et esquisse, et c'est la
	 * feuille qui choisit — exactement comme le gel.
	 *
	 * AUCUN COMPORTEMENT N'EST ÉCRIT ICI, ET CE N'EST PAS UN REFUS : tous les gestes
	 * de cet écran agissent, câblés depuis la route
	 * (`src/routes/notes/{identifiant}/cablage.ts`, `ARB-063`). NE RENOMME ET NE
	 * RETIRE RIEN DE CE QUE CES CÂBLAGES VISENT : un libellé de bouton, un
	 * identifiant, une classe.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-14.css`.
	 */
	import type { Domaine, Note, Univers } from '../../seeds/corpus';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import type { Notification } from '$lib/coquille/notifications';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import NoteDeDemonstration from '$lib/lecture/NoteDeDemonstration.svelte';
	import SommaireDeLaNote from '$lib/lecture/SommaireDeLaNote.svelte';
	import { BARRES_DE_JAUGE, barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { rangementDe, type LectureAffichee } from '$lib/lecture/note-de-demonstration';
	/**
	 * LA FABRIQUE D'ADRESSES — jamais un gabarit d'URL écrit à la main. Les six liens
	 * de cette vue en sortent ; celle d'une pièce jointe est SERVIE par le chargeur —
	 * le nom affiché est amputé de son suffixe et ne permet pas de la recomposer. Le
	 * gel les écrit tous en ancre vide, faute de serveur.
	 */
	import { adresseDeNote, adressesParLesNoms, segmentsDeDossier } from '$lib/rangement/adresses';
	import { designationsDeCoquille } from '$lib/coquille/identite';

	/**
	 * LES ADRESSES SE COMPOSENT SUR L'IDENTIFIANT PERSISTÉ, PAS SUR LE NOM. La note
	 * ne porte que les NOMS de son univers et de son domaine, et la vue les
	 * slugifiait ; l'identifiant ne suit pas les renommages (`RG-M12-11`), et
	 * renommer le domaine d'une note rendait 404 les deux liens de son rangement.
	 */
	const adresses = adressesParLesNoms(designationsDeCoquille());
	import type { PanneauxDeLaNote, VoisineAffichee } from '$lib/lecture/panneaux';

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * LES TROIS PROPRIÉTÉS DE CONTEXTE, ET LEUR DÉFAUT EST L'ENSEMBLE VIDE. C'était
		 * le jeu de démonstration : cette route ne les passe pas — le contexte de
		 * coquille les porte —, et l'écran servait donc le rail et l'identité des
		 * maquettes sur toute instance dont le gabarit racine ne les aurait pas posés.
		 * Une base vide n'est pas une absence de base : elle se rend vide.
		 */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: CompteAffiche | null;
		/** `/notes/{identifiant}/relations` — la route la compose et la passe. */
		adresseDesRelations: string;
		/**
		 * LA NOTE LUE ET SES DEUX CORPS RENDUS — REQUISE. `/notes/{identifiant}` servait
		 * l'article de `n-restaurer-pg` POUR LES 32 NOTES : la cause n'était pas le
		 * chargeur, qui rend la note réelle, mais l'absence d'une propriété pour la
		 * recevoir. Elle porte TOUT ce que l'écran dit de la note, cartouche et date de
		 * modification compris — un cartouche mixte, moitié note moitié planche, n'a plus
		 * lieu d'être.
		 */
		affichee: LectureAffichee;
		/**
		 * LES SEPT PANNEAUX LATÉRAUX. Ils étaient TRANSCRITS : deux notes voisines
		 * nommées, deux pièces jointes, quatre relations, trois rétroliens — le même
		 * contenu pour toute note. VIDES, LES PANNEAUX LE DISENT : le défaut n'est pas la
		 * transcription du gel, c'est l'ensemble vide, que chaque panneau rend en état
		 * neutre explicite (`RG-M18-03`).
		 */
		panneaux: PanneauxDeLaNote;
		/**
		 * LES BULLES DE LA PILE — `RG-NF-03`. Vide par défaut, et c'est un ÉTAT VIDE
		 * EXPLICITE : une note ouverte ordinairement n'annonce rien. La seule bulle que
		 * cette vue reçoive aujourd'hui vient de la redirection d'enregistrement, qui
		 * dit ce qui reste à faire — l'indexation de recherche, soumise et non attendue.
		 */
		notifications?: readonly Notification[];
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines = [],
		compte = null,
		affichee,
		panneaux,
		adresseDesRelations,
		notifications = []
	}: Proprietes = $props();

	/**
	 * Le compte servi à la coquille. En application, le contexte l'emporte. Hors
	 * gabarit racine, il n'y a PAS de compte connecté : la barre le rend vide plutôt
	 * que de nommer un utilisateur du jeu de démonstration.
	 */
	const COMPTE_ABSENT: CompteAffiche = { nom: '', initiales: '', role: '', domaine: '' };

	const voisines = $derived(panneaux.voisines);
	const pieces = $derived(panneaux.pieces);
	const relations = $derived(panneaux.relations);
	/** Les propriétés typées de la fiche, dans l'ordre du référentiel — vides tant
	    que rien n'est servi, et le panneau n'est alors pas rendu. */
	const proprietes = $derived(panneaux.proprietes);
	const retroliens = $derived(panneaux.retroliens);
	const verifications = $derived(panneaux.verifications);

	const reglage = $derived(vecteur ?? {});

	/**
	 * LES DEUX LEVIERS QUI RESTENT — les droits et l'état de chargement. Cinq autres
	 * décidaient de ce que le bloc d'article montrait ; la note affichée étant
	 * requise, ces cinq états se lisent sur ELLE.
	 */
	const droits = $derived<'ecriture' | 'lecture'>(
		reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture'
	);
	const etat = $derived<'nominal' | 'chargement'>(
		reglage['etat'] === 'chargement' ? 'chargement' : 'nominal'
	);
	/** L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040` : le gel cache
	    ses actions d'écriture en feuille, le produit ne les émet pas. La classe reste
	    posée sur les nœuds rendus. */
	const ecriture = $derived(droits !== 'lecture');

	/**
	 * LE TITRE DE LA NOTE ferme le fil d'Ariane (`V-14:4365`). La note est celle
	 * qu'on lit, et le fil d'Ariane comme le chemin courant du rail s'en DÉDUISENT
	 * par `rangementDe`, là où ils étaient écrits en clair.
	 */
	const note = $derived(affichee.note);
	const titre = $derived(note.titre);
	/**
	 * LE PANNEAU DE PROPRIÉTÉS N'EXISTE QUE POUR UNE FICHE — `BRIEF-VUES.md:797`,
	 * « si la note est une fiche » : un panneau vide annoncerait à une note
	 * ordinaire une capacité qu'elle n'a pas.
	 */
	const estUneFiche = $derived(note.typeFiche !== undefined);
	const rangement = $derived(rangementDe(note));

	/**
	 * LA LIGNE DE RANGEMENT DU PANNEAU « POSITION » — le domaine, puis le dossier
	 * qui porte directement la note. Le gel écrit « Infrastructure › Sauvegardes » :
	 * ni l'univers, ni les dossiers intermédiaires, que le fil d'Ariane rend déjà.
	 * Une note posée à la racine de son domaine n'a pas de second segment.
	 */
	const domaineDeLaNote = $derived(rangement[1] ?? note.domaine);
	const dossierDeLaNote = $derived(rangement.length > 2 ? (rangement.at(-1) ?? '') : '');

	/**
	 * Et leurs deux adresses — la forme canonique d'`ARB-001`, et elle seule. Le
	 * dossier visé est celui qui porte DIRECTEMENT la note : `adresses.dossier`
	 * attend la suite des segments, ce que `segmentsDeDossier` découpe.
	 */
	const adresseDuDomaine = $derived(adresses.domaine(note.univers, note.domaine));
	const adresseDuDossier = $derived(
		adresses.dossier(note.univers, note.domaine, segmentsDeDossier(note.dossier))
	);

	/**
	 * LE LIBELLÉ D'UNE NOTE VOISINE, dans la forme COMPACTE du gel — « il y a 6 j »
	 * (`V-14:1817`). Ce n'est pas un second libellé, c'est la seconde FORME du
	 * libellé unique (`ARB-029`). C'est ici, et NULLE PART AILLEURS, qu'elle
	 * s'emploie : la borne d'`ARB-029` est explicite.
	 */
	function libelleCompactDe(voisine: VoisineAffichee): string {
		return libelleFraicheur(
			{
				fraicheur: voisine.fraicheur,
				jours: voisine.jours,
				/* LE MAILLON QUI MANQUAIT : `EtatDeFraicheur.revise` est OPTIONNEL et sa
				   garde est STRICTE — omis, `undefined` ne la déclenche pas et une voisine
				   JAMAIS VÉRIFIÉE lisait « il y a 3 mois » au lieu de « jamais ». C'est l'un
				   des deux seuls sites du dépôt qui construisent un objet littéral plutôt
				   que de passer une `Note` entière. */
				revise: voisine.revise
			},
			'compacte'
		);
	}

	/** Les rangs de la jauge — trois, toujours (`docs/DESIGN.md` §3.7, 2). */
	const RANGS = Array.from({ length: BARRES_DE_JAUGE }, (_, rang) => rang);
</script>

<!-- LE SÉPARATEUR `›` DE LA LIGNE « RANGEMENT » vit ici, et non dans
	`$lib/lecture/`, parce qu'il porte un style en ligne du gel : un style en ligne
	n'est prouvé que par la maquette RATTACHÉE au fichier (`ARB-016`), et
	`src/lib/lecture/` n'a pas ce rattachement. Écart remonté. -->
{#snippet separateur()}<span style="color:var(--c-encre-4)">›</span>{/snippet}

<Coquille
	classeContenu="lecture"
	cibleEvitement="article"
	fil={['Accueil', ...rangement, titre]}
	courant={rangement.slice(1)}
	{droits}
	donnees={{ 'data-etat': etat, 'data-registre': 'reference' }}
	{univers}
	{domaines}
	notes={corpus}
	compte={compte ?? COMPTE_ABSENT}
	version=""
	{notifications}
>
	{#snippet enfants()}
		<!-- ---------- Sommaire ---------- -->
		<SommaireDeLaNote classe="sommaire vue-reelle" entrees={affichee.sommaire} />
		<div class="sommaire vue-esquisse" aria-hidden="true">
			<div class="esquisse esq-l" style="width:60%"></div>
			<div class="esquisse esq-l" style="width:90%"></div>
			<div class="esquisse esq-l" style="width:75%"></div>
			<div class="esquisse esq-l" style="width:85%"></div>
		</div>

		<!-- ---------- Article ---------- -->

		<!-- ---------- Article ---------- -->
		<article class="article vue-reelle" id="article">
			<!-- P-09 · ARB-040 — le bloc partagé OMET ses actions d'écriture en lecture seule. -->
			<NoteDeDemonstration {droits} {separateur} {affichee} />
		</article>

		<!-- Esquisse de chargement de l'article -->
		<div class="article vue-esquisse" aria-hidden="true">
			<div class="esquisse" style="height:46px;width:70%;margin-bottom:20px"></div>
			<div class="esquisse" style="height:72px;margin-bottom:20px;border-radius:8px"></div>
			<div class="esquisse esq-l" style="width:100%"></div>
			<div class="esquisse esq-l" style="width:96%"></div>
			<div class="esquisse esq-l" style="width:88%"></div>
			<div class="esquisse" style="height:26px;width:44%;margin:28px 0 14px"></div>
			<div class="esquisse esq-l" style="width:100%"></div>
			<div class="esquisse esq-l" style="width:92%"></div>
			<div class="esquisse" style="height:120px;border-radius:8px;margin-top:20px"></div>
		</div>

		<aside class="panneaux vue-reelle" aria-label="Actions et relations">
			<!-- Actions -->
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Actions</span></div>
				<div class="panneau__corps panneau__corps--serre">
					<div class="actions-liste">
						<!-- P-09 · ARB-040 — omises, jamais masquées. `V-14:1778`, `:1782`, `:1798` -->
						{#if ecriture}<button class="btn btn--menu si-ecriture">
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11z" /></svg
								>
								Modifier la référence
							</button>
							<button class="btn btn--menu si-ecriture">
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11z" /></svg
								>
								Modifier l'opérationnel
							</button>{/if}
						<button class="btn btn--menu">
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.5 1.5" /></svg
							>
							Historique des versions
						</button>
						<button class="btn btn--menu">
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"><path d="M8 2v8M5 7l3 3 3-3M2.5 12.5h11" /></svg
							>
							Exporter
						</button>
						<button class="btn btn--menu">
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><path
									d="M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z"
								/></svg
							>
							Imprimer
						</button>
						{#if ecriture}<button class="btn btn--menu btn--destructif si-ecriture">
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><path
										d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
									/></svg
								>
								Supprimer
							</button>{/if}
					</div>
				</div>
			</section>

			<!-- eslint-disable svelte/no-navigation-without-resolve -- les adresses de ce bloc
				sortent de la fabrique unique, `$lib/rangement/adresses.ts`, qui les compose dans
				la forme canonique d'ARB-001 et nulle part ailleurs. La règle inspecte
				l'EXPRESSION du href et ne peut pas la suivre jusqu'à la fabrique : elle ne
				saurait pas plus la vérifier ici. Même geste qu'en V-03, V-22, V-24 et dans la
				barre supérieure. -->
			<!-- Position -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete"><span class="etiq">Position</span></div>
				<div class="panneau__corps">
					<div class="item__sous" style="margin-bottom:var(--e-3)">
						<a
							href={adresseDuDomaine}
							style="color:var(--c-encre);text-decoration:none;border-bottom:1px solid var(--c-trait-fort)"
							>{domaineDeLaNote}</a
						>
						{#if dossierDeLaNote}
							›
							<a
								href={adresseDuDossier}
								style="color:var(--c-encre);text-decoration:none;border-bottom:1px solid var(--c-trait-fort)"
								>{dossierDeLaNote}</a
							>
						{/if}
					</div>
					{#each voisines as voisine (voisine.identifiant)}
						<a class="item" href={adresseDeNote(voisine.identifiant)}>
							<span style="color:var(--c-encre-4)">{voisine.sens}</span>
							<span
								><span class="item__nom">{voisine.titre}</span>
								<span class="item__sous"
									><span class="temoin {classeTemoin(voisine.fraicheur)}"
										><span class="temoin__jauge"
											>{#each RANGS as rang (rang)}<i
													class={rang < barresFraicheur(voisine.fraicheur) ? 'plein' : undefined}
												></i>{/each}</span
										><span class="temoin__txt">{libelleCompactDe(voisine)}</span></span
									></span
								></span
							>
						</a>
					{:else}
						<div class="item__sous">Aucune autre note dans ce dossier</div>
					{/each}
				</div>
			</section>

			<!-- Pièces jointes -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete">
					<span class="etiq">Pièces jointes</span><span class="chiffre">{pieces.length}</span>
				</div>
				<div class="panneau__corps panneau__corps--serre">
					{#each pieces as piece, rang (rang)}
						<a class="pj" href={piece.adresse}>
							<span class="pj__ext">{piece.extension}</span>
							<span
								><span class="item__nom">{piece.nom}</span>
								<span class="item__sous">{piece.taille} · {piece.depose}</span></span
							>
						</a>
					{:else}
						<div class="zone-etat">
							<div class="zone-etat__titre">Aucune pièce jointe</div>
							<div class="zone-etat__txt">Cette note ne porte aucun fichier joint.</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Relations typées -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete">
					<span class="etiq">Relations</span>
					<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1848` -->
					<!-- `/notes/{id}/relations` rend l'ORIGINE de chaque relation, que ce
					     panneau ne montre pas, et aucun clic n'y menait. Absente, la
					     propriété laisse le gel intact : le lien n'est pas rendu. -->
					{#if adresseDesRelations !== undefined}<a
							class="btn btn--discret"
							style="padding:4px 8px"
							href={adresseDesRelations}>Toutes les relations</a
						>{/if}{#if ecriture}<button class="btn btn--discret si-ecriture" style="padding:4px 8px"
							>+ Ajouter</button
						>{/if}
				</div>
				<div class="panneau__corps panneau__corps--serre">
					{#each relations as groupe (groupe.libelle)}
						<div class="rel-groupe">
							<div class="rel-groupe__titre etiq">{groupe.libelle}</div>
							{#each groupe.notes as liee (liee.identifiant)}
								<a class="item" href={adresseDeNote(liee.identifiant)}
									><span
										><span class="item__nom">{liee.titre}</span>
										<span class="item__sous"
											><span class="past">{liee.type}</span>
											{liee.domaine}</span
										></span
									></a
								>
							{/each}
						</div>
					{:else}
						<div class="zone-etat">
							<div class="zone-etat__titre">Aucune relation</div>
							<div class="zone-etat__txt">
								Cette note n'est reliée à aucune autre par une relation qualifiée.
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!--
				Propriétés de fiche — LE HUITIÈME PANNEAU, celui que le gel ne dessine pas et
				que le cadrage nomme : `BRIEF-VUES.md:797` en énumère huit, le gel en dessine
				sept, et `RG-NOT-01` interdit de faire de la fiche un objet séparé de la note.
				DIVERGENCE ASSUMÉE AVEC LE GEL, et elle déplace des pixels. LES CLASSES SONT
				PROPRES À CETTE VUE : `.prop` et `.prop__cle` appartiennent à V-20 et les
				emprunter est interdit ; les trois règles de `.propriete` sont dans `V-14.css`.
			-->
			{#if estUneFiche}
				<section class="panneau repliable" data-ouvert="oui">
					<div class="panneau__tete">
						<span class="etiq">Propriétés de fiche</span><span class="chiffre"
							>{proprietes.length}</span
						>
					</div>
					<div class="panneau__corps">
						{#each proprietes as propriete (propriete.nom)}
							<div class="propriete">
								<span class="propriete__cle">{propriete.nom}</span>
								<!-- UNE PROPRIÉTÉ NON RENSEIGNÉE EST DITE, JAMAIS COMBLÉE
										(`RG-M18-03`) : l'exemple du référentiel serait la valeur d'une
										note inventée. -->
								<span
									class="propriete__valeur"
									data-vide={propriete.valeur === null ? 'oui' : undefined}
									>{propriete.valeur ?? 'Non renseignée'}</span
								>
							</div>
						{:else}
							<div class="zone-etat">
								<div class="zone-etat__titre">Aucune propriété</div>
								<div class="zone-etat__txt">
									Ce type de fiche ne définit aucune propriété typée.
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Rétroliens -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete">
					<span class="etiq">Rétroliens</span><span class="chiffre">{retroliens.length}</span>
				</div>
				<div class="panneau__corps panneau__corps--serre">
					{#each retroliens as retrolien (retrolien.identifiant)}
						<a class="item" href={adresseDeNote(retrolien.identifiant)}
							><span
								><span class="item__nom">{retrolien.titre}</span><span class="item__sous"
									>{retrolien.domaine}</span
								></span
							></a
						>
					{:else}
						<div class="zone-etat">
							<div class="zone-etat__titre">Aucun rétrolien</div>
							<div class="zone-etat__txt">Aucune note du corpus lisible ne cite celle-ci.</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- eslint-enable svelte/no-navigation-without-resolve -->

			<!-- Historique de vérification -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete"><span class="etiq">Historique de vérification</span></div>
				<div class="panneau__corps">
					{#if verifications.length}
						<ul class="chrono" id="chrono">
							<!-- LA CLÉ EST LE RANG, ET C'EST UNE CORRECTION MESURÉE. Elle était la
							     date ISO, or `RG-M06-02` n'interdit pas deux vérifications le MÊME
							     JOUR : deux attestations du même jour ont fait lever
							     `each_key_duplicate` à l'hydratation, ce qui tuait tout le
							     JavaScript de la page — donc « Marquer comme vérifié » avec. -->
							{#each verifications as attestation, rang (rang)}
								<li>
									<span class="item__nom">{attestation.par ?? 'auteur non journalisé'}</span><time
										datetime={attestation.iso}>{attestation.jour}</time
									>
								</li>
							{/each}
						</ul>
					{:else}
						<div class="zone-etat">
							<div class="zone-etat__titre">Jamais vérifiée</div>
							<div class="zone-etat__txt">
								Le journal des vérifications ne porte aucune attestation pour cette note.
							</div>
						</div>
					{/if}
				</div>
			</section>

			<!-- Notes connexes -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete"><span class="etiq">Notes connexes</span></div>
				<div class="panneau__corps panneau__corps--serre">
					<!-- LE RAPPROCHEMENT PAR PROXIMITÉ N'EXISTE PAS DANS LE PRODUIT. Le gel
					     montre trois notes et une jauge à quatre rangs ; aucune source ne dit
					     ce que la proximité mesure ni comment elle se calcule, et aucun module
					     du dépôt ne la produit. L'état est donc DIT. -->
					<div class="zone-etat">
						<div class="zone-etat__titre">Rapprochement indisponible</div>
						<div class="zone-etat__txt">
							Le calcul de proximité entre notes n'est pas encore fourni par le produit.
						</div>
					</div>
				</div>
			</section>

			<!-- LE PANNEAU D'ERREUR PERMANENT A ÉTÉ RETIRÉ, ET LA MAQUETTE AVEC : il
			     annonçait « Statistiques indisponibles » SANS CONDITION, sur chaque note,
			     avec un bouton « Réessayer » sans gestionnaire — au-dessus d'un compteur de
			     consultations qui fonctionne. LE RETRAIT, ET NON UNE CONDITION : la panne
			     n'est pas détectable, le chargeur écrivant `mesure?.nombre ?? 0`. -->
		</aside>

		<!-- Esquisse de chargement des panneaux -->
		<div class="panneaux vue-esquisse" aria-hidden="true">
			<div class="esquisse" style="height:196px;border-radius:8px"></div>
			<div class="esquisse" style="height:120px;border-radius:8px"></div>
			<div class="esquisse" style="height:150px;border-radius:8px"></div>
		</div>
	{/snippet}
</Coquille>
