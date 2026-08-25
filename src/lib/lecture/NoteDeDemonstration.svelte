<script lang="ts">
	/**
	 * LA NOTE DE DÉMONSTRATION — le bloc que V-14 et V-15 partagent à l'octet.
	 *
	 * `V-14:1415-1755` et `V-15:1507-1847` : 341 lignes identiques, vérifiées
	 * par `diff`. La maquette l'annonce en tête du bloc — « partagé par la
	 * lecture interne (V-14) et l'historique (V-15) : les deux vues montrent la
	 * même note, jamais deux versions divergentes du markup ». Ce composant est
	 * cette unicité, portée dans l'application : bandeaux d'alerte, en-tête,
	 * cartouche de contrôle, panneau de signalement, métadonnées, sélecteur de
	 * registre et les deux corps rédigés.
	 *
	 * LES DEUX CORPS RÉDIGÉS ONT ÉTÉ SORTIS DANS `CorpsReference.svelte` et
	 * `CorpsOperationnel.svelte`, et le motif est V-18 : l'éditeur de
	 * l'Opérationnel porte LES MÊMES DEUX CORPS, identiques à l'octet — `diff`
	 * entre `V-14:1523-1753` et `V-18:1709-1939` ne rend aucune ligne —, et il
	 * rend le second DEUX FOIS, en source masquée et dans la zone de rédaction.
	 * Les recopier eût créé une seconde version d'un markup que la maquette
	 * déclare unique. L'enveloppe `div.prose#corps-…`, elle, reste ici : V-18 la
	 * rend ailleurs, sous d'autres règles de feuille.
	 *
	 * CE QUI VARIE, ET RIEN D'AUTRE — les cinq propriétés ci-dessous. Elles sont
	 * exactement les cinq leviers que la planche de V-14 actionne sur ce bloc
	 * (`V-14:4076-4108`) ; aucune des deux vues ne les actionne EN SERVICE, où
	 * `affichee` les remplace tous par des faits de la note.
	 *
	 * LE TÉMOIN PASSE PAR LA FABRIQUE UNIQUE — `$lib/fraicheur.ts`, P-01 et
	 * ADR-005. Le nombre de barres pleines et le libellé en clair en sortent ;
	 * la jauge rend TOUJOURS trois `<i>`, `.plein` sur les n premières, et
	 * `aria-hidden="true"` reste sur la jauge (`docs/DESIGN.md` §3.3 et §3.7).
	 * Aucun second calcul n'est écrit ici, et « si (jours > 180) » n'y figure
	 * pas — c'est l'écart type que nomme ADR-005.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011). Le bloc rend un ÉTAT :
	 * la bascule de registre, la copie d'un bloc de code, l'ouverture du
	 * panneau de révision, le tampon de vérification et l'agrandissement du
	 * schéma sont des comportements, et ils appartiennent aux lots de logique.
	 * Les attributs qu'ils piloteraient sont rendus dans leur position de
	 * départ, celle du gel : `#panneau-reviser[data-ouvert="non"]`,
	 * `#corps-operationnel[hidden]`, `aria-expanded="false"` sur
	 * « Signaler à réviser ».
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-14.css` / `src/vues/V-15.css`, posées par
	 * `node verif/feuilles-de-vue.mjs V-xx --installer` (P-6.3). Les deux
	 * feuilles portent les mêmes règles pour ce bloc — c'est ce qui permet au
	 * composant d'être unique. Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import { BARRES_DE_JAUGE, temoinFraicheur, type NiveauFraicheur } from '$lib/fraicheur';
	import { motFiche } from '$lib/vocabulaire';
	import CorpsOperationnel from './CorpsOperationnel.svelte';
	import CorpsReference from './CorpsReference.svelte';
	import {
		anciennete,
		consultationsRecentes,
		CONTROLE_PAR_NIVEAU,
		NOTE,
		rangementDe,
		type LectureAffichee,
		type InstantAffiche,
		type RevisionCourante
	} from './note-de-demonstration';
	import {
		adresseDeDomaine,
		adresseDeDossier,
		adresseDesNotesDuDomaine,
		adresseDUnivers,
		segmentsDeDossier
	} from '$lib/rangement/adresses';
	import type { Snippet } from 'svelte';

	interface Proprietes {
		/**
		 * Le niveau porté par le cartouche de contrôle. V-14 le fait varier par
		 * sa planche ; V-15 n'a pas ce levier et reste au niveau du gel.
		 */
		niveau?: NiveauFraicheur;
		/** Le bandeau « Révision demandée » est déployé. */
		revision?: boolean;
		/** Le bandeau « Brouillon » est déployé, et la pastille avec lui. */
		brouillon?: boolean;
		/** Le bandeau « Version opérationnelle à resynchroniser » est déployé. */
		resync?: boolean;
		/**
		 * La note porte une version opérationnelle. Faux : le sélecteur de
		 * registre disparaît et l'invitation à en créer une prend sa place
		 * (`V-14:4095-4104`).
		 */
		operationnel?: boolean;
		/**
		 * LES DROITS EFFECTIFS, ET CE QU'ILS COMMANDENT — P-09 / RG-M05-08.
		 *
		 * Le gel POSE les actions d'écriture de ce bloc puis les cache par
		 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
		 * (`V-14:403`, `V-15:339`). Une maquette statique n'a pas de serveur :
		 * le masquage y est sa SEULE possibilité. Le produit peut ne pas les
		 * émettre, et P-09 l'exige — « ni grisée, NI MASQUÉE » (ARB-040).
		 *
		 * La valeur par défaut est `ecriture`, celle du gel : une vue qui ne
		 * passe rien rend exactement ce que la maquette rend. La classe
		 * `si-ecriture` reste posée sur les nœuds rendus — elle porte aussi le
		 * rendu, elle ne se retire pas.
		 *
		 * Énumération : `docs/omissions-p09.md`.
		 */
		droits?: 'ecriture' | 'lecture';
		/**
		 * LE SÉPARATEUR `›` DE LA LIGNE « RANGEMENT », fourni par la vue.
		 *
		 * Le gel le pose dans un `span` porteur d'un style en ligne — la teinte
		 * `--c-encre-4` —, et un tel style n'est admis que dans un fichier
		 * RATTACHÉ à une maquette
		 * gelée : par le nommage pour `src/vues/V-xx.svelte` (ARB-016), par
		 * déclaration humaine dans `verif/references/preuve-par-le-gel.json` pour
		 * une ressource partagée (ARB-022). `src/lib/lecture/` n'est ni l'un ni
		 * l'autre, et **un agent d'exécution n'écrit jamais** dans ce fichier de
		 * rattachement — c'est le contournement de vérification nommé par
		 * PLAN §12. Le fragment vient donc des deux vues, qui, elles, sont
		 * rattachées par leur nom ; le CHEMIN de rangement, lui, reste dans
		 * `note-de-demonstration.ts`, où il ne peut pas diverger d'une vue à
		 * l'autre. Écart remonté : un rattachement de `src/lib/lecture/` à V-14
		 * le ramènerait ici en une ligne.
		 */
		separateur: Snippet;
		/**
		 * LA NOTE RÉELLEMENT LUE, ET SES DEUX CORPS RENDUS — T-042.
		 *
		 * ABSENTE, LE BLOC REND LA TRANSCRIPTION FIGÉE DU GEL, à l'identique :
		 * c'est le défaut, et c'est ce qui garantit que le banc ne bouge pas.
		 *
		 * LES DEUX VUES LA PASSENT DÉSORMAIS. V-15 ne la passait pas, et
		 * l'historique d'une note QUELCONQUE servait donc l'article de la note
		 * de démonstration — son titre, son rangement, son auteur, ses 412
		 * consultations et ses liens internes — sous un fil d'Ariane qui, lui,
		 * nommait la vraie note.
		 *
		 * FOURNIE, L'IDENTITÉ DE LA NOTE VIENT D'ELLE — pastille de type,
		 * visibilité, titre, rangement, auteur, étiquettes, consultations — et
		 * les deux corps sont le HTML que l'appelant a rendu par
		 * `rendreDocument` (ADR-004 : une seule implémentation, et aucune vue
		 * n'en est un second chemin).
		 *
		 * CE QU'ELLE ALIMENTE DÉSORMAIS, ET QUI RESTAIT DU GEL. Les trois
		 * exclusions déclarées à `T-042` sont levées, parce que leur cause a
		 * disparu : elles tenaient à ce que `Note` de `seeds/corpus.ts` ne porte
		 * ni le vérificateur, ni l'heure, ni la date de modification. Le
		 * chargeur les lit maintenant à la SOURCE — `verifications`,
		 * `notes.modifie_le`, les quatre colonnes `revision_*` — et les passe
		 * ici tout rendus.
		 *
		 *   · LE CARTOUCHE DE CONTRÔLE. « par <qui> · <date> » vient du journal.
		 *     Ce qui dépend du NIVEAU et non de la note — le suffixe « une revue
		 *     serait bienvenue », l'appui « revue nécessaire » — continue de se
		 *     lire dans `CONTROLE_PAR_NIVEAU` : ce n'est pas une donnée de note,
		 *     c'est la mise en garde que le gel attache à chaque niveau. Le
		 *     cartouche n'est donc pas MIXTE : ses deux moitiés sont vraies.
		 *   · LA DATE DE MODIFICATION de la ligne « Rédaction ».
		 *   · LES TROIS BANDEAUX, qui décrivent l'état de la note et non un
		 *     réglage de planche.
		 *
		 * ET CE QU'ELLE N'ALIMENTE TOUJOURS PAS : rien du libellé de fraîcheur.
		 * Il sort de la fabrique unique, à qui l'on ne donne que le niveau et
		 * l'ancienneté (P-01, ADR-005).
		 */
		affichee?: LectureAffichee | undefined;
	}

	const {
		niveau = 'frais',
		revision = false,
		brouillon = false,
		resync = false,
		operationnel = true,
		droits = 'ecriture',
		separateur,
		affichee
	}: Proprietes = $props();

	/** P-09 · ARB-040 — ce qui n'est pas émis n'est pas une porte fermée. */
	const ecriture = $derived(droits !== 'lecture');

	/** La note affichée — celle qu'on lit, ou celle du gel à défaut. */
	const note = $derived(affichee?.note ?? NOTE);
	const rangement = $derived(rangementDe(note));

	/**
	 * LES TROIS FAMILLES DE LIENS DE L'EN-TÊTE — le rangement, l'auteur, les
	 * étiquettes. Le gel les écrit en ancre vide, faute de serveur.
	 *
	 * LE CHEMIN VIENT TOUJOURS DE LA FABRIQUE (`$lib/rangement/adresses.ts`),
	 * jamais d'un gabarit écrit ici : `rangementDe` compose le chemin lisible
	 * — univers, domaine, puis les dossiers — et les fonctions ci-dessous en
	 * donnent l'adresse canonique d'ARB-001, segment par segment.
	 *
	 * LE FILTRE, LUI, VOYAGE EN PARAMÈTRE DE REQUÊTE, ce que `docs/routes.md`
	 * §4.2 fixe pour la liste des notes d'un domaine : `auteur` et `etiquette`
	 * y sont deux facettes nommées. Un filtre n'est pas un niveau de rangement,
	 * il n'entre donc pas dans le chemin.
	 */
	function adresseDuSegment(rang: number): string {
		if (rang === 0) return adresseDUnivers(note.univers);
		if (rang === 1) return adresseDeDomaine(note.univers, note.domaine);
		return adresseDeDossier(
			note.univers,
			note.domaine,
			segmentsDeDossier(note.dossier).slice(0, rang - 1)
		);
	}

	/** La liste des notes du domaine, restreinte à une facette et une valeur. */
	function adresseFiltree(facette: string, valeur: string): string {
		const liste = adresseDesNotesDuDomaine(note.univers, note.domaine);
		return `${liste}?${facette}=${encodeURIComponent(valeur)}`;
	}
	const consultations = $derived(
		affichee ? affichee.consultations30j : consultationsRecentes(note)
	);

	/**
	 * LE CUMUL DE CONSULTATIONS — celui que le chargeur a relu APRÈS avoir
	 * compté l'ouverture courante, et non `Note.vues`, projeté AVANT elle.
	 *
	 * Les deux nombres de cette ligne décrivent le même fait sur deux fenêtres :
	 * le cumul de toute la vie de la note, et les trente derniers jours. Pris à
	 * deux instants encadrant l'écriture, ils rendaient un total INFÉRIEUR à sa
	 * propre fenêtre — « 0 consultations · 1 sur les 30 derniers jours ». Sans
	 * note affichée, le cumul reste celui du jeu, comme tout le reste du bloc.
	 */
	const consultationsCumul = $derived(affichee ? affichee.consultationsTotal : note.vues);

	/**
	 * LA PASTILLE DE TYPE — « Fiche Serveur », et non « Fiche ».
	 *
	 * C'est le gabarit que huit autres vues appliquent déjà (V-02, V-04, V-08,
	 * V-12, V-13, V-26, V-09, V-41) : le nom du TYPE DE FICHE quand la note en
	 * porte un, le type de note sinon. V-14 était la seule à ne pas l'appliquer,
	 * alors que `typeFiche` lui était servi — reçu, jamais lu. Le mot « Fiche »
	 * lui-même vient du vocabulaire configurable, pas d'un littéral.
	 */
	const pastilleDeType = $derived(note.typeFiche ? `${motFiche} ${note.typeFiche}` : note.type);

	/** Les trois rangs de la jauge — jamais un de plus, jamais un de moins. */
	const RANGS = Array.from({ length: BARRES_DE_JAUGE }, (_, rang) => rang);

	/**
	 * LES QUATRE LEVIERS DE PLANCHE DEVIENNENT DES FAITS DE LA NOTE — T-042b.
	 *
	 * Sans note affichée, ils restent ce qu'ils étaient : cinq contrôles que la
	 * planche de V-14 actionne, et que V-15 laisse à leur défaut. Avec une note
	 * affichée, ils décrivent CETTE note-ci, et rien n'est plus piloté de
	 * l'extérieur : un bandeau de révision déployé sur une note sans demande
	 * courante serait exactement la valeur illustrative que P-02 proscrit.
	 */
	const niveauAffiche = $derived(affichee ? affichee.note.fraicheur : niveau);
	const revisionAffichee = $derived(affichee ? affichee.revision !== null : revision);
	const brouillonAffiche = $derived(affichee ? affichee.note.brouillon : brouillon);
	const resyncAffiche = $derived(affichee ? affichee.resync : resync);
	const operationnelAffiche = $derived(affichee ? affichee.note.operationnel : operationnel);

	/**
	 * LE TÉMOIN PASSE PAR LA FABRIQUE UNIQUE, ET SON ANCIENNETÉ VIENT DE LA MÊME
	 * SOURCE QUE SON NIVEAU (P-01, ADR-005).
	 *
	 * `joursDepuisControle` est l'ancienneté sur laquelle le niveau a été
	 * résolu — dernière vérification, à défaut dernière modification
	 * (`RG-M06-01`). La lire ailleurs ferait dire au libellé autre chose que ce
	 * que la jauge montre. Sans note affichée, l'ancienneté reste celle de la
	 * date de planche, comptée depuis `DATE_REFERENCE`.
	 */

	/**
	 * LA PROSE DU CARTOUCHE QUI DÉPEND DU NIVEAU, ET D'ELLE SEULE — le suffixe
	 * « une revue serait bienvenue » et l'appui « revue nécessaire ».
	 *
	 * Ce ne sont pas des données de note : ce sont les deux mises en garde que
	 * le gel attache aux niveaux `vieil` et `obs` (`V-14:4008-4012`). Elles se
	 * lisent donc sur le niveau AFFICHÉ, qui est celui de la note quand une note
	 * est affichée. Le couple « qui · quand », lui, ne se déduit d'aucun niveau
	 * et vient du journal des vérifications.
	 */
	const prose = $derived(CONTROLE_PAR_NIVEAU[niveauAffiche]);

	/**
	 * LES TROIS PROSES DATÉES DU GEL — la demande de révision, la modification
	 * de la note, celle du corps Référence.
	 *
	 * Elles sont ici pour la même raison que `CONTROLE_PAR_NIVEAU` : sans note
	 * affichée, le bloc rend la transcription de la planche, et cette
	 * transcription porte des dates. Avec une note affichée, AUCUNE n'est lue —
	 * les trois viennent de `notes.revision_le`, `notes.modifie_le` et
	 * `notes.corps_reference_modifie_le`.
	 */
	const REVISION_DU_GEL: RevisionCourante = {
		par: 'Sophie Nguyen',
		le: '28 juillet 2026',
		commentaire:
			"La commande de restauration partielle a changé avec Barman 3.11. Le paragraphe 3.2 renvoie encore à l'ancienne syntaxe."
	};
	const MODIFICATION_DU_GEL: InstantAffiche = {
		iso: '2026-07-22',
		jour: 'il y a 3 semaines',
		heureDite: '22 juillet 2026 à 16:47'
	};

	const revisionDite = $derived(affichee ? affichee.revision : REVISION_DU_GEL);
	const modifiee = $derived(affichee ? affichee.modifiee : MODIFICATION_DU_GEL);
	const referenceModifieeLe = $derived(
		affichee ? affichee.referenceModifiee.jour : '22 juillet 2026'
	);
	/** Le dernier contrôle : celui du journal, ou celui de la planche à défaut. */
	const controle = $derived(
		affichee
			? affichee.controle
			: {
					par: CONTROLE_PAR_NIVEAU[niveau].par as string | null,
					quand: {
						iso: CONTROLE_PAR_NIVEAU[niveau].iso,
						jour: CONTROLE_PAR_NIVEAU[niveau].jour,
						heureDite: `${CONTROLE_PAR_NIVEAU[niveau].jour} à ${CONTROLE_PAR_NIVEAU[niveau].heure}`
					}
				}
	);

	const temoin = $derived(
		temoinFraicheur(
			affichee
				? {
						fraicheur: niveauAffiche,
						jours: affichee.joursDepuisControle,
						/* UNE NOTE JAMAIS VÉRIFIÉE NE PEUT PAS ÊTRE « VÉRIFIÉE IL Y A N
						   JOURS ». Le cartouche écrivait les deux à la fois : « Vérifié
						   il y a 0 jours » sur la ligne du haut, « Jamais vérifiée » sur
						   celle du bas. `controle` est ce que le journal des
						   vérifications porte — `null` quand il n'en porte rien —, et
						   c'est la même source que la ligne de détail juste en dessous.
						   Le NIVEAU ne bouge pas : `RG-M06-01` retombe sur la
						   modification, et c'est juste. Seul le verbe cesse de mentir. */
						revise: controle === null ? null : controle.quand.iso
					}
				: { fraicheur: niveau, jours: anciennete(CONTROLE_PAR_NIVEAU[niveau].iso) }
		)
	);
</script>

<!-- ============ NOTE DE DÉMONSTRATION — bandeaux, en-tête, cartouche ============
Partagé par la lecture interne (V-14) et l'historique (V-15) : les deux
vues montrent la même note, jamais deux versions divergentes du markup. -->
<!-- Bandeaux d'alerte, empilables, au-dessus de tout -->
<div class="bandeaux" id="bandeaux">
	<div class="bandeau bandeau--revision" id="bandeau-revision" hidden={!revisionAffichee}>
		<div class="bandeau__marque" aria-hidden="true">!</div>
		<div class="bandeau__corps">
			<!-- `RG-M06-05` — qui a demandé, quand, et pourquoi. Un demandeur que le
			     journal ne nomme plus (compte effacé) est DIT, jamais remplacé. -->
			<div class="bandeau__titre">
				{revisionDite === null
					? 'Révision demandée'
					: revisionDite.par === null
						? `Révision demandée le ${revisionDite.le}`
						: `Révision demandée par ${revisionDite.par} le ${revisionDite.le}`}
			</div>
			<div class="bandeau__note">
				{revisionDite === null || revisionDite.commentaire === null
					? 'Aucune explication n’a été jointe à la demande.'
					: `« ${revisionDite.commentaire} »`}
			</div>
		</div>
		<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1427` / `V-15:1519` -->
		{#if ecriture}<button class="btn si-ecriture" style="flex:none">Lever la demande</button>{/if}
	</div>

	<div class="bandeau bandeau--brouillon" id="bandeau-brouillon" hidden={!brouillonAffiche}>
		<div class="bandeau__marque" aria-hidden="true">B</div>
		<div class="bandeau__corps">
			<div class="bandeau__titre">Brouillon — cette note n'est pas visible du public</div>
			<div>
				{`Elle reste accessible aux contributeurs du domaine ${note.domaine}. Publiez-la pour la rendre consultable depuis l'espace public.`}
			</div>
		</div>
		<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1436` / `V-15:1528` -->
		{#if ecriture}<button class="btn btn--principal si-ecriture" style="flex:none">Publier</button
			>{/if}
	</div>

	<div class="bandeau bandeau--resync" id="bandeau-resync" hidden={!resyncAffiche}>
		<div class="bandeau__marque" aria-hidden="true">↺</div>
		<div class="bandeau__corps">
			<div class="bandeau__titre">Version opérationnelle à resynchroniser</div>
			<div>
				{`La référence a été modifiée le ${referenceModifieeLe}, après la dernière mise à jour de l'opérationnel.`}
			</div>
		</div>
		<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1445` / `V-15:1537` -->
		{#if ecriture}<button class="btn si-ecriture" style="flex:none"
				>Comparer les deux registres</button
			>{/if}
	</div>
</div>

<!-- En-tête -->
<header class="entete">
	<div class="entete__sur">
		<span class="past past--type">{pastilleDeType}</span>
		<span class="past" id="past-brouillon" hidden={!brouillonAffiche}>Brouillon</span>
		<span class="past">{note.visibilite}</span>
	</div>

	<h1 class="titre-note" id="h-titre">{note.titre}</h1>

	<!-- CARTOUCHE DE CONTRÔLE — signal de fraîcheur -->
	<div class="cartouche" id="cartouche" data-niveau={niveauAffiche}>
		<div class="cartouche__bloc">
			<span class="temoin__jauge" id="jauge" aria-hidden="true"
				>{#each RANGS as rang (rang)}<i class={rang < temoin.barres ? 'plein' : undefined}
					></i>{/each}</span
			>
			<div>
				<div class="cartouche__valeur" id="cart-valeur">{temoin.libelle}</div>
				<!-- LE COUPLE « QUI · QUAND » VIENT DU JOURNAL DES VÉRIFICATIONS.
				     Trois états, et aucun n'invente : le contrôle nommé, le contrôle
				     dont le journal ne porte pas le compte (`RG-M15-02` : anonymiser
				     n'est pas omettre), et la note jamais vérifiée — dont le niveau
				     se lit alors sur la modification (`RG-M06-01`). -->
				<div class="cartouche__detail" id="cart-detail">
					{#if controle === null}Jamais vérifiée{:else}{#if controle.par === null}par <strong
								>auteur non journalisé</strong
							>{:else}par <strong>{controle.par}</strong>{/if} ·
						<time datetime={controle.quand.iso} title={controle.quand.heureDite}
							>{controle.quand.jour}</time
						>{prose.suffixe}{#if prose.appui}<strong>{prose.appui}</strong>{/if}{/if}
				</div>
			</div>
		</div>
		<!-- P-09 · ARB-040 — omises, jamais masquées. `V-14:1471` / `V-15:1563` -->
		{#if ecriture}<div class="cartouche__actions si-ecriture">
				<button class="btn btn--verifier" id="btn-verifier">
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
					>
					Marquer comme vérifié
				</button>
				<button class="btn" id="btn-reviser" aria-expanded="false">Signaler à réviser</button>
			</div>{/if}
		<div class="tampon" aria-hidden="true"><span>VÉRIFIÉ</span></div>
	</div>

	<!-- Signalement à réviser -->
	<!-- P-09 · ARB-040 — omis, jamais masqué. `V-14:1482` / `V-15:1574` -->
	{#if ecriture}<div class="reviser si-ecriture" id="panneau-reviser" data-ouvert="non">
			<label class="etiq" for="txt-reviser">Qu'attendez-vous de cette révision&nbsp;?</label>
			<textarea
				id="txt-reviser"
				placeholder="Décrivez ce qui doit être vérifié ou corrigé. Le message sera affiché en tête de la note."
			></textarea>
			<div class="reviser__pied">
				<button class="btn btn--principal" id="btn-reviser-envoi">Signaler à réviser</button>
				<button class="btn btn--discret" id="btn-reviser-annul">Annuler</button>
			</div>
		</div>{/if}

	<!-- eslint-disable svelte/no-navigation-without-resolve -- les adresses de ce bloc
	sortent de la fabrique unique, `$lib/rangement/adresses.ts`, qui les compose dans
	la forme canonique d'ARB-001 et nulle part ailleurs. La règle inspecte
	l'EXPRESSION du href et ne peut pas la suivre jusqu'à la fabrique : elle ne
	saurait pas plus la vérifier ici. Même geste qu'en V-03, V-22, V-24 et dans la
	barre supérieure. -->
	<!-- Métadonnées -->
	<dl class="meta">
		<dt>Rangement</dt>
		<dd>
			<!-- LA CLÉ EST LE RANG, ET NON LE NOM DU SEGMENT : rien n'interdit qu'un
			     dossier porte le nom d'un domaine — le corpus en a le cas —, et deux
			     segments homonymes font lever `each_key_duplicate`, ce qui tue le
			     JavaScript de toute la page à l'hydratation. -->
			{#each rangement as segment, rang (rang)}{#if rang}{@render separateur()}{/if}
				<a href={adresseDuSegment(rang)}>{segment}</a>
			{/each}
		</dd>

		<dt>Rédaction</dt>
		<dd>
			Créée par <a href={adresseFiltree('auteur', note.auteur)}>{note.auteur}</a> · modifiée
			<time datetime={modifiee.iso} title={modifiee.heureDite}>{modifiee.jour}</time>
		</dd>

		<dt>Étiquettes</dt>
		<dd>
			{#each note.etiquettes as etiquette (etiquette)}
				<a class="past past--etiquette" href={adresseFiltree('etiquette', etiquette)}>{etiquette}</a
				>
			{:else}
				Aucune étiquette
			{/each}
		</dd>

		<dt>Consultations</dt>
		<dd>
			<span class="chiffre"
				>{consultationsCumul} consultations · {consultations} sur les 30 derniers jours</span
			>
		</dd>
	</dl>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</header>

<!-- Sélecteur de registre -->
<div
	class="registre"
	id="registre"
	role="tablist"
	aria-label="Registre de lecture"
	hidden={!operationnelAffiche}
>
	<button role="tab" aria-selected="true" data-reg="reference"
		><span class="registre__pt"></span>Référence</button
	>
	<button role="tab" aria-selected="false" data-reg="operationnel"
		><span class="registre__pt"></span>Opérationnel</button
	>
</div>
<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1517` / `V-15:1609` -->
{#if ecriture}<button class="invite-op si-ecriture" id="invite-op" hidden={operationnelAffiche}>
		<svg
			width="13"
			height="13"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
		>
		Ajouter une version opérationnelle
	</button>{/if}

<!-- ============ NOTE DE DÉMONSTRATION — corps rédigé, deux registres ============
	LES DEUX ENVELOPPES SONT CELLES DU GEL, ET ELLES NE BOUGENT PAS. Ce qu'elles
	contiennent change de SOURCE, jamais de forme : sans note affichée, la
	transcription figée des deux corps ; avec, le HTML que l'appelant a rendu par
	l'implémentation unique de `rendreDocument` (ADR-004).

	AUCUN BLANC ENTRE L'ENVELOPPE ET SON CONTENU, et le bloc est protégé du
	formateur : un blanc inséré se relit dans le nom accessible du niveau 1
	(CLAUDE.md §6, P-6). Ne jamais citer la forme exacte de la directive à
	l'intérieur d'un commentaire (P-9).

	POURQUOI L'INSERTION DE BALISAGE EST ADMISE ICI, ET SEULEMENT ICI. La règle
	qui l'interdit vise l'insertion de contenu NON MAÎTRISÉ ; ce contenu est la
	sortie de `rendreDocument`, dont l'en-tête énonce la contrepartie exacte du
	refus d'ADR-003 de stocker du HTML libre : « le texte d'un document est du
	TEXTE : il ne devient jamais du balisage » — `echapper()` s'applique à
	chaque nœud de texte, et le schéma ProseMirror refuse tout document
	structurellement invalide avant même le rendu. Même jurisprudence que
	`src/vues/V-31.svelte` et que le composant d'étalon du banc.

	La directive est portée en BLOC plutôt qu'en ligne : la ligne précédant
	chaque enveloppe est déjà celle du formateur, et deux directives ne peuvent
	pas viser la même ligne.
-->
<!-- eslint-disable svelte/no-at-html-tags -- sortie de `rendreDocument`, texte échappé par `echapper()` (ADR-003) -->
<!-- prettier-ignore -->
<div class="prose" id="corps-reference">{#if affichee}{#if affichee.reference === null}<div class="zone-etat"><div class="zone-etat__titre">Registre Référence vide</div><div class="zone-etat__txt">Cette note ne porte encore aucun texte de référence.</div></div>{:else}{@html affichee.reference}{/if}{:else}<CorpsReference />{/if}</div>

<!-- prettier-ignore -->
<div class="prose" id="corps-operationnel" hidden>{#if affichee}{@html affichee.operationnel ?? ''}{:else}<CorpsOperationnel />{/if}</div>
<!-- eslint-enable svelte/no-at-html-tags -->
