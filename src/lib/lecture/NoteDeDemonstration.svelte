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
	 * (`V-14:4076-4108`) ; V-15 n'en actionne aucun et prend donc les défauts.
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
	import CorpsOperationnel from './CorpsOperationnel.svelte';
	import CorpsReference from './CorpsReference.svelte';
	import {
		anciennete,
		consultationsRecentes,
		CONTROLE_PAR_NIVEAU,
		NOTE,
		rangementDe,
		type NoteAffichee
	} from './note-de-demonstration';
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
		 * V-15 ne la passe pas et ne change donc en rien.
		 *
		 * FOURNIE, L'IDENTITÉ DE LA NOTE VIENT D'ELLE — pastille de type,
		 * visibilité, titre, rangement, auteur, étiquettes, consultations — et
		 * les deux corps sont le HTML que l'appelant a rendu par
		 * `rendreDocument` (ADR-004 : une seule implémentation, et aucune vue
		 * n'en est un second chemin).
		 *
		 * CE QU'ELLE N'ALIMENTE PAS, ET POURQUOI — écart déclaré, non comblé :
		 *
		 *   · LE CARTOUCHE DE CONTRÔLE. Il affiche « par <qui> · <date> », et
		 *     `Note` de `seeds/corpus.ts` ne porte NI le vérificateur, NI
		 *     l'heure, NI la date en toutes lettres. Trois des sept champs
		 *     seulement sont dérivables ; en alimenter trois et laisser quatre
		 *     valeurs de planche produirait un cartouche MIXTE, c'est-à-dire une
		 *     valeur illustrative au sens de P-02. Il reste donc entièrement sur
		 *     le levier `niveau`.
		 *   · LA DATE DE MODIFICATION de la ligne « Rédaction ». Même cause :
		 *     `Note` ne la porte pas.
		 *   · LES TROIS BANDEAUX. Leur prose est écrite au gel (auteur et date
		 *     de la demande de révision, nom du domaine) ; ils restent des
		 *     leviers, comme `operationnel`.
		 */
		affichee?: NoteAffichee | undefined;
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
	const consultations = $derived(consultationsRecentes(note));

	/** Les trois rangs de la jauge — jamais un de plus, jamais un de moins. */
	const RANGS = Array.from({ length: BARRES_DE_JAUGE }, (_, rang) => rang);

	const controle = $derived(CONTROLE_PAR_NIVEAU[niveau]);
	const temoin = $derived(temoinFraicheur({ fraicheur: niveau, jours: anciennete(controle.iso) }));
</script>

<!-- ============ NOTE DE DÉMONSTRATION — bandeaux, en-tête, cartouche ============
Partagé par la lecture interne (V-14) et l'historique (V-15) : les deux
vues montrent la même note, jamais deux versions divergentes du markup. -->
<!-- Bandeaux d'alerte, empilables, au-dessus de tout -->
<div class="bandeaux" id="bandeaux">
	<div class="bandeau bandeau--revision" id="bandeau-revision" hidden={!revision}>
		<div class="bandeau__marque" aria-hidden="true">!</div>
		<div class="bandeau__corps">
			<div class="bandeau__titre">Révision demandée par Sophie Nguyen le 28 juillet 2026</div>
			<div class="bandeau__note">
				« La commande de restauration partielle a changé avec Barman 3.11. Le paragraphe 3.2 renvoie
				encore à l'ancienne syntaxe. »
			</div>
		</div>
		<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1427` / `V-15:1519` -->
		{#if ecriture}<button class="btn si-ecriture" style="flex:none">Lever la demande</button>{/if}
	</div>

	<div class="bandeau bandeau--brouillon" id="bandeau-brouillon" hidden={!brouillon}>
		<div class="bandeau__marque" aria-hidden="true">B</div>
		<div class="bandeau__corps">
			<div class="bandeau__titre">Brouillon — cette note n'est pas visible du public</div>
			<div>
				Elle reste accessible aux contributeurs du domaine Infrastructure. Publiez-la pour la rendre
				consultable depuis l'espace public.
			</div>
		</div>
		<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1436` / `V-15:1528` -->
		{#if ecriture}<button class="btn btn--principal si-ecriture" style="flex:none">Publier</button
			>{/if}
	</div>

	<div class="bandeau bandeau--resync" id="bandeau-resync" hidden={!resync}>
		<div class="bandeau__marque" aria-hidden="true">↺</div>
		<div class="bandeau__corps">
			<div class="bandeau__titre">Version opérationnelle à resynchroniser</div>
			<div>
				La référence a été modifiée le 22 juillet 2026, après la dernière mise à jour de
				l'opérationnel.
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
		<span class="past past--type">{note.type}</span>
		<span class="past" id="past-brouillon" hidden={!brouillon}>Brouillon</span>
		<span class="past">{note.visibilite}</span>
	</div>

	<h1 class="titre-note" id="h-titre">{note.titre}</h1>

	<!-- CARTOUCHE DE CONTRÔLE — signal de fraîcheur -->
	<div class="cartouche" id="cartouche" data-niveau={niveau}>
		<div class="cartouche__bloc">
			<span class="temoin__jauge" id="jauge" aria-hidden="true"
				>{#each RANGS as rang (rang)}<i class={rang < temoin.barres ? 'plein' : undefined}
					></i>{/each}</span
			>
			<div>
				<div class="cartouche__valeur" id="cart-valeur">{temoin.libelle}</div>
				<div class="cartouche__detail" id="cart-detail">
					par <strong>{controle.par}</strong> ·
					<time datetime={controle.iso} title="{controle.jour} à {controle.heure}"
						>{controle.jour}</time
					>{controle.suffixe}{#if controle.appui}<strong>{controle.appui}</strong>{/if}
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

	<!-- Métadonnées -->
	<dl class="meta">
		<dt>Rangement</dt>
		<dd>
			{#each rangement as segment, rang (segment)}{#if rang}{@render separateur()}{/if}
				<a href="#">{segment}</a>
			{/each}
		</dd>

		<dt>Rédaction</dt>
		<dd>
			Créée par <a href="#">{note.auteur}</a> · modifiée
			<time datetime="2026-07-22" title="22 juillet 2026 à 16:47">il y a 3 semaines</time>
		</dd>

		<dt>Étiquettes</dt>
		<dd>
			{#each note.etiquettes as etiquette (etiquette)}
				<a class="past past--etiquette" href="#">{etiquette}</a>
			{/each}
		</dd>

		<dt>Consultations</dt>
		<dd>
			<span class="chiffre"
				>{note.vues} consultations · {consultations} sur les 30 derniers jours</span
			>
		</dd>
	</dl>
</header>

<!-- Sélecteur de registre -->
<div
	class="registre"
	id="registre"
	role="tablist"
	aria-label="Registre de lecture"
	hidden={!operationnel}
>
	<button role="tab" aria-selected="true" data-reg="reference"
		><span class="registre__pt"></span>Référence</button
	>
	<button role="tab" aria-selected="false" data-reg="operationnel"
		><span class="registre__pt"></span>Opérationnel</button
	>
</div>
<!-- P-09 · ARB-040 — omise, jamais masquée. `V-14:1517` / `V-15:1609` -->
{#if ecriture}<button class="invite-op si-ecriture" id="invite-op" hidden={operationnel}>
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
<div class="prose" id="corps-reference">{#if affichee}{@html affichee.reference ?? ''}{:else}<CorpsReference />{/if}</div>

<!-- prettier-ignore -->
<div class="prose" id="corps-operationnel" hidden>{#if affichee}{@html affichee.operationnel ?? ''}{:else}<CorpsOperationnel />{/if}</div>
<!-- eslint-enable svelte/no-at-html-tags -->
