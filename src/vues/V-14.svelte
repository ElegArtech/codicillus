<script lang="ts">
	/**
	 * V-14 — Lecture d'une note.
	 * Route `/notes/{identifiant}` (`docs/routes.md`, `verif/scenarios/V-14.json`).
	 *
	 * LA VUE CENTRALE DU PRODUIT. Elle porte le corpus de référence — la note de
	 * démonstration `n-restaurer-pg` — et c'est d'elle que les autres vues
	 * empruntent leur idée du témoin, du cartouche et des deux registres.
	 *
	 * ONZE ÉTATS SUR QUATRE FENÊTRES — 44 couples. V-14 est l'une des six vues
	 * contrôlées sur les quatre fenêtres au titre de RG-M18-13 (ARB-009,
	 * le module de conditions du banc). Les onze clés sont celles de
	 * `verif/scenarios/V-14.json`, réextraites de la planche gelée ; deux d'entre
	 * elles — `fr-frais` et `etat-nominal` — sont marquées `identiqueA`
	 * `droits-ecriture`, parce qu'elles ne dévient d'aucun contrôle.
	 *
	 * COQUILLE DE FORME COMPLÈTE — ARB-021, A-1 : le rail se dérive du corpus,
	 * la barre porte ses deux menus déroulants. V-14 est l'une des huit vues
	 * dans ce cas. `<main class="lecture" id="contenu">` (ARB-015), et le lien
	 * d'évitement vise `#article`, pas `<main>` (ARB-019) : c'est une ancre
	 * INTÉRIEURE au contenu, avec le libellé par défaut « Aller au contenu ».
	 *
	 * DEUX ATTRIBUTS DE DONNÉES HORS GABARIT — `data-etat` et `data-registre`,
	 * portés par `donnees` (ARB-021, A-2). Le premier commande l'état de
	 * chargement : `.app[data-etat="chargement"] .vue-reelle { display: none }`
	 * et sa réciproque sur `.vue-esquisse` (`V-14.css:571-572`). LES DEUX
	 * ARBRES SONT DONC RENDUS EN PERMANENCE, réel et esquisse, et c'est la
	 * feuille qui choisit — exactement comme le gel. Le second nomme le
	 * registre affiché ; aucun état de la planche ne le fait varier, la bascule
	 * étant un comportement (ARB-011).
	 *
	 * LE CARTOUCHE NE PASSE PAS PAR `appliquerFraicheur` AU NIVEAU FRAIS, ET
	 * C'EST MESURABLE. Le mode démo n'émet un `change` que sur les contrôles
	 * qu'il DÉPLACE (le module de service du banc, `if (!r.checked)`). `fr=frais`
	 * étant la position par défaut de la planche, `appliquerFraicheur("frais")`
	 * n'est appelée dans AUCUN des onze états : le cartouche frais reste celui
	 * du BALISAGE, qui écrit « 1er août 2026 » là où la fonction écrirait
	 * « 1<sup>er</sup> août 2026 ». Huit états sur onze en dépendent.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011). Ni le tampon de
	 * vérification, ni la bascule de registre, ni le repliage des panneaux sur
	 * petit écran, ni l'agrandissement du schéma, ni la copie d'un bloc de code.
	 * L'attribut `onclick="window.print()"` du bouton « Imprimer » n'est pas
	 * porté : c'est un comportement, et **ce lot ne déclare pas `RG-M18-17`
	 * tenue**. Le bouton est rendu, son effet appartient au lot d'impression.
	 *
	 * **CE LOT NE DÉCLARE PAS `P-09` TENUE.** Les actions d'écriture disparaissent
	 * en lecture seule par `si-ecriture` et `.app[data-droits="lecture"]`
	 * (`socle.css:396`) — c'est le rendu de deux états, pas une preuve
	 * d'étanchéité : celle-ci relève de `pnpm test:droits`.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `dialog.loupe#loupe` et `dialog.palette#palette`,
	 * tous deux FERMÉS, et `template#tpl-palette`. `docs/releve-vues.md` §4.1 les
	 * mesure : un `<dialog>` fermé et un `<template>` ne portent aucune boîte de
	 * rendu, ne déplacent aucun pixel et n'entrent pas dans l'instantané ARIA. Le
	 * gabarit n'ouvre sa `superposition` qu'aux neuf nœuds hors `div.app` qui
	 * rendent, et aucun n'est de V-14. Et `div.planche`, bloc hors produit
	 * (`docs/DESIGN.md` §2.G), qui ne se porte jamais.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-14.css`, posé par `node verif/feuilles-de-vue.mjs V-14
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
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
	import NoteDeDemonstration from '$lib/lecture/NoteDeDemonstration.svelte';
	import SommaireDeLaNote from '$lib/lecture/SommaireDeLaNote.svelte';
	import {
		BARRES_DE_JAUGE,
		barresFraicheur,
		classeTemoin,
		libelleFraicheur,
		type NiveauFraicheur
	} from '$lib/fraicheur';
	import { NOTE, rangementDe, type LectureAffichee } from '$lib/lecture/note-de-demonstration';
	import type { PanneauxDeLaNote } from '$lib/lecture/panneaux';

	interface Proprietes {
		/** Le vecteur complet de l'état — cinq contrôles de planche. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-14')`, variante « complète ». */
		notes: readonly Note[];
		/**
		 * LES QUATRE PROPRIÉTÉS DE CONTEXTE — T-042, et elles sont OPTIONNELLES.
		 *
		 * Avant ce lot, cette vue lisait `UNIVERS`, `DOMAINES`, `MOI` et
		 * `INSTANCE` au niveau du module : un chargeur de route ne pouvait rien
		 * y substituer, et l'écran servait le contexte du jeu de semence quelle
		 * que fût l'identité de l'appelant.
		 *
		 * LE DÉFAUT EST LA CONSTANTE DU JEU, et c'est ce qui garantit que le banc
		 * ne bouge pas : le mode de conception ne passe que `vecteur` et `notes`,
		 * la vue reçoit donc exactement ce qu'elle avait.
		 */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: UtilisateurCourant;
		instance?: EtatDInstance;
		/**
		 * LA NOTE LUE ET SES DEUX CORPS RENDUS — T-042, et c'est le défaut le
		 * plus visible du produit : `/notes/{identifiant}` servait l'article de
		 * `n-restaurer-pg` POUR LES 32 NOTES.
		 *
		 * La cause n'était pas le chargeur — `src/lib/donnees/note.ts` rend
		 * depuis le 20 août la note réelle et son corps rendu par
		 * `rendreDocument` — mais l'absence d'une propriété pour les recevoir,
		 * écart déclaré au rapport de `T-033`. C'est cette propriété.
		 *
		 * ABSENTE, LA TRANSCRIPTION FIGÉE DU GEL, à l'identique. FOURNIE, TOUT
		 * ce que l'écran dit de la note : identité, corps rendus, sommaire,
		 * cartouche de contrôle, dates, bandeaux et mesure de consultation.
		 *
		 * LE CARTOUCHE ET LA DATE DE MODIFICATION EN FONT DÉSORMAIS PARTIE. Ils
		 * en étaient exclus faute de colonnes projetées par la couche de
		 * lecture ; le chargeur les lit maintenant à la source — `verifications`,
		 * `notes.modifie_le` —, et un cartouche mixte, moitié note moitié
		 * planche, n'a plus lieu d'être (P-02).
		 */
		affichee?: LectureAffichee;
		/**
		 * LES SEPT PANNEAUX LATÉRAUX — T-042b, et c'est la seconde moitié du
		 * défaut que `affichee` a ouverte.
		 *
		 * Ils étaient TRANSCRITS : deux notes voisines nommées, deux pièces
		 * jointes, quatre relations, trois rétroliens, quatre vérifications et
		 * trois notes connexes — le même contenu pour les 32 notes du corpus, et
		 * pour toute note créée depuis. C'est la « valeur illustrative » que P-02
		 * proscrit, et le gel ne pouvait pas faire autrement : une maquette
		 * statique n'a pas de base.
		 *
		 * ABSENTS, LES PANNEAUX SONT VIDES, ET ILS LE DISENT. Le défaut n'est pas
		 * la transcription du gel — ce serait rendre l'exemple opposable une fois
		 * de plus —, c'est l'ensemble vide, que chaque panneau rend en état neutre
		 * explicite (`RG-M18-03`).
		 */
		panneaux?: PanneauxDeLaNote;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		affichee,
		panneaux
	}: Proprietes = $props();

	/** Les cinq listes des panneaux — vides tant que rien n'est servi. */
	const voisines = $derived(panneaux?.voisines ?? []);
	const pieces = $derived(panneaux?.pieces ?? []);
	const relations = $derived(panneaux?.relations ?? []);
	const retroliens = $derived(panneaux?.retroliens ?? []);
	const verifications = $derived(panneaux?.verifications ?? []);

	const reglage = $derived(vecteur ?? {});

	/** Les cinq leviers de la planche, lus au vecteur et jamais ailleurs. */
	const droits = $derived<'ecriture' | 'lecture'>(
		reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture'
	);
	const niveau = $derived<NiveauFraicheur>(
		reglage['fr'] === 'vieil' ? 'vieil' : reglage['fr'] === 'obs' ? 'obs' : 'frais'
	);
	const revision = $derived(reglage['c-revision'] === true);
	const brouillon = $derived(reglage['c-brouillon'] === true);
	const resync = $derived(reglage['c-resync'] === true);
	const operationnel = $derived(reglage['c-op'] !== false);
	const etat = $derived<'nominal' | 'chargement'>(
		reglage['etat'] === 'chargement' ? 'chargement' : 'nominal'
	);
	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE les actions d'écriture puis les cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-14-lecture-note.html:403`) : faute de serveur, une maquette
	 * statique n'a pas d'autre moyen de dire « cette action n'existe pas pour ce
	 * rôle ». Le produit peut ne pas l'émettre, et P-09 l'exige — « ni grisée,
	 * NI MASQUÉE ». La classe reste posée sur les nœuds rendus.
	 * Énumération : `docs/omissions-p09.md`.
	 */
	const ecriture = $derived(droits !== 'lecture');

	/**
	 * LE TITRE DE LA NOTE ferme le fil d'Ariane (`V-14:4365`), et le nombre de
	 * pièces jointes coiffe son panneau. Les deux viennent du corpus, par le
	 * module partagé — la même note que celle que rend `NoteDeDemonstration`,
	 * jamais une seconde lecture.
	 *
	 * T-042 — LA NOTE EST CELLE QU'ON LIT, ou celle du gel à défaut. Le fil
	 * d'Ariane et le chemin courant du rail s'en DÉDUISENT par `rangementDe`,
	 * là où ils étaient écrits en clair : au défaut, la déduction redonne
	 * exactement `['Accueil', 'Production', 'Infrastructure', 'Exploitation',
	 * 'Sauvegardes', titre]`, ce que les 44 couples vérifient.
	 */
	const note = $derived(affichee?.note ?? NOTE);
	const titre = $derived(note.titre);
	const rangement = $derived(rangementDe(note));

	/**
	 * LA LIGNE DE RANGEMENT DU PANNEAU « POSITION » — le domaine, puis le
	 * dossier qui porte directement la note.
	 *
	 * Le gel écrit « Infrastructure › Sauvegardes » : ni l'univers, ni les
	 * dossiers intermédiaires, que le fil d'Ariane rend déjà au-dessus de
	 * l'article. `rangementDe` donne le chemin complet ; les deux extrémités
	 * utiles s'y lisent sans second calcul. Une note posée à la racine de son
	 * domaine n'a pas de second segment, et la ligne s'arrête au domaine.
	 */
	const domaineDeLaNote = $derived(rangement[1] ?? note.domaine);
	const dossierDeLaNote = $derived(rangement.length > 2 ? (rangement.at(-1) ?? '') : '');

	/**
	 * LE LIBELLÉ D'UNE NOTE VOISINE, dans la forme COMPACTE du gel — « il y a
	 * 6 j » (V-14:1817), « il y a 4 mois » (V-14:1822).
	 *
	 * Ce n'est pas un second libellé : c'est la seconde FORME du libellé unique,
	 * entrée dans la fabrique par ARB-029 — « ce n'est pas un second calcul,
	 * c'est un second rendu du même calcul ». Le niveau et l'ancienneté sont
	 * ceux que le chargeur a lus en base, comme la classe et les barres.
	 *
	 * C'est ici, et NULLE PART AILLEURS, que la forme compacte s'emploie : la
	 * borne d'ARB-029 est explicite, un troisième site serait un comblement.
	 */
	function libelleCompactDe(voisine: { fraicheur: NiveauFraicheur; jours: number }): string {
		return libelleFraicheur({ fraicheur: voisine.fraicheur, jours: voisine.jours }, 'compacte');
	}

	/** Les rangs de la jauge — trois, toujours (`docs/DESIGN.md` §3.7, 2). */
	const RANGS = Array.from({ length: BARRES_DE_JAUGE }, (_, rang) => rang);
</script>

<!--
	LE SÉPARATEUR `›` DE LA LIGNE « RANGEMENT ».

	Il vit ici, et non dans `$lib/lecture/`, parce qu'il porte un style en ligne
	du gel — `color:var(--c-encre-4)` — et qu'un style en ligne n'est prouvé que
	par la maquette RATTACHÉE au fichier : par le nommage pour
	`src/vues/V-xx.svelte` (ARB-016, P-6.4), par déclaration humaine dans
	`verif/references/preuve-par-le-gel.json` pour une ressource partagée
	(ARB-022). `src/lib/lecture/` n'a aucune des deux, et un agent d'exécution
	n'écrit jamais dans ce fichier de rattachement (PLAN §12). Écart remonté.
-->
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
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
>
	{#snippet enfants()}
		<!-- ---------- Sommaire ---------- -->
		<SommaireDeLaNote classe="sommaire vue-reelle" entrees={affichee?.sommaire} />
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
			<NoteDeDemonstration
				{niveau}
				{revision}
				{brouillon}
				{resync}
				{operationnel}
				{droits}
				{separateur}
				{affichee}
			/>
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

			<!-- Position -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete"><span class="etiq">Position</span></div>
				<div class="panneau__corps">
					<div class="item__sous" style="margin-bottom:var(--e-3)">
						<a
							href="#"
							style="color:var(--c-encre);text-decoration:none;border-bottom:1px solid var(--c-trait-fort)"
							>{domaineDeLaNote}</a
						>
						{#if dossierDeLaNote}
							›
							<a
								href="#"
								style="color:var(--c-encre);text-decoration:none;border-bottom:1px solid var(--c-trait-fort)"
								>{dossierDeLaNote}</a
							>
						{/if}
					</div>
					{#each voisines as voisine (voisine.identifiant)}
						<a class="item" href="#">
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
					{#each pieces as piece (piece.nom)}
						<a class="pj" href="#">
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
					{#if ecriture}<button class="btn btn--discret si-ecriture" style="padding:4px 8px"
							>+ Ajouter</button
						>{/if}
				</div>
				<div class="panneau__corps panneau__corps--serre">
					{#each relations as groupe (groupe.libelle)}
						<div class="rel-groupe">
							<div class="rel-groupe__titre etiq">{groupe.libelle}</div>
							{#each groupe.notes as liee (liee.identifiant)}
								<a class="item" href="#"
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

			<!-- Rétroliens -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete">
					<span class="etiq">Rétroliens</span><span class="chiffre">{retroliens.length}</span>
				</div>
				<div class="panneau__corps panneau__corps--serre">
					{#each retroliens as retrolien (retrolien.identifiant)}
						<a class="item" href="#"
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

			<!-- Historique de vérification -->
			<section class="panneau repliable" data-ouvert="oui">
				<div class="panneau__tete"><span class="etiq">Historique de vérification</span></div>
				<div class="panneau__corps">
					{#if verifications.length}
						<ul class="chrono" id="chrono">
							{#each verifications as attestation (attestation.iso)}
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
					<!-- LE RAPPROCHEMENT PAR PROXIMITÉ N'EXISTE PAS DANS LE PRODUIT.
					     Le gel montre trois notes et une jauge à quatre rangs ; aucune
					     source ne dit ce que la proximité mesure ni comment elle se
					     calcule, et aucun module du dépôt ne la produit. En inventer un
					     barème serait combler (`CLAUDE.md` §2) ; recopier les trois
					     notes du gel serait une valeur illustrative (P-02). L'état est
					     donc DIT, et le vide remonté au rapport du lot. -->
					<div class="zone-etat">
						<div class="zone-etat__titre">Rapprochement indisponible</div>
						<div class="zone-etat__txt">
							Le calcul de proximité entre notes n'est pas encore fourni par le produit.
						</div>
					</div>
				</div>
			</section>

			<!-- Exemple d'un panneau en erreur : il ne casse pas la lecture -->
			<section class="panneau panneau--erreur">
				<div class="panneau__tete"><span class="etiq">Consultations détaillées</span></div>
				<div class="panneau__corps">
					<div class="zone-etat">
						<div class="zone-etat__titre">Statistiques indisponibles</div>
						<div class="zone-etat__txt">
							Le service de mesure ne répond pas. Le reste de la note reste consultable.
						</div>
						<button class="btn">Réessayer</button>
					</div>
				</div>
			</section>
		</aside>

		<!-- Esquisse de chargement des panneaux -->
		<div class="panneaux vue-esquisse" aria-hidden="true">
			<div class="esquisse" style="height:196px;border-radius:8px"></div>
			<div class="esquisse" style="height:120px;border-radius:8px"></div>
			<div class="esquisse" style="height:150px;border-radius:8px"></div>
		</div>
	{/snippet}
</Coquille>
