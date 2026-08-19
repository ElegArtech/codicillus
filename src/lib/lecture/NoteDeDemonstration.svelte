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
	import {
		anciennete,
		CONSULTATIONS_RECENTES,
		CONTROLE_PAR_NIVEAU,
		NOTE,
		RANGEMENT
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
	}

	const {
		niveau = 'frais',
		revision = false,
		brouillon = false,
		resync = false,
		operationnel = true,
		separateur
	}: Proprietes = $props();

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
		<button class="btn si-ecriture" style="flex:none">Lever la demande</button>
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
		<button class="btn btn--principal si-ecriture" style="flex:none">Publier</button>
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
		<button class="btn si-ecriture" style="flex:none">Comparer les deux registres</button>
	</div>
</div>

<!-- En-tête -->
<header class="entete">
	<div class="entete__sur">
		<span class="past past--type">{NOTE.type}</span>
		<span class="past" id="past-brouillon" hidden={!brouillon}>Brouillon</span>
		<span class="past">{NOTE.visibilite}</span>
	</div>

	<h1 class="titre-note" id="h-titre">{NOTE.titre}</h1>

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
		<div class="cartouche__actions si-ecriture">
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
		</div>
		<div class="tampon" aria-hidden="true"><span>VÉRIFIÉ</span></div>
	</div>

	<!-- Signalement à réviser -->
	<div class="reviser si-ecriture" id="panneau-reviser" data-ouvert="non">
		<label class="etiq" for="txt-reviser">Qu'attendez-vous de cette révision&nbsp;?</label>
		<textarea
			id="txt-reviser"
			placeholder="Décrivez ce qui doit être vérifié ou corrigé. Le message sera affiché en tête de la note."
		></textarea>
		<div class="reviser__pied">
			<button class="btn btn--principal" id="btn-reviser-envoi">Signaler à réviser</button>
			<button class="btn btn--discret" id="btn-reviser-annul">Annuler</button>
		</div>
	</div>

	<!-- Métadonnées -->
	<dl class="meta">
		<dt>Rangement</dt>
		<dd>
			{#each RANGEMENT as segment, rang (segment)}{#if rang}{@render separateur()}{/if}
				<a href="#">{segment}</a>
			{/each}
		</dd>

		<dt>Rédaction</dt>
		<dd>
			Créée par <a href="#">{NOTE.auteur}</a> · modifiée
			<time datetime="2026-07-22" title="22 juillet 2026 à 16:47">il y a 3 semaines</time>
		</dd>

		<dt>Étiquettes</dt>
		<dd>
			{#each NOTE.etiquettes as etiquette (etiquette)}
				<a class="past past--etiquette" href="#">{etiquette}</a>
			{/each}
		</dd>

		<dt>Consultations</dt>
		<dd>
			<span class="chiffre"
				>{NOTE.vues} consultations · {CONSULTATIONS_RECENTES} sur les 30 derniers jours</span
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
<button class="invite-op si-ecriture" id="invite-op" hidden={operationnel}>
	<svg
		width="13"
		height="13"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
	>
	Ajouter une version opérationnelle
</button>

<!-- ============ NOTE DE DÉMONSTRATION — corps rédigé, deux registres ============ -->
<!-- ================= CORPS — REGISTRE RÉFÉRENCE ================= -->
<div class="prose" id="corps-reference">
	<p>
		Cette procédure décrit la restauration d'une base <strong>PostgreSQL 16</strong> à partir des
		sauvegardes gérées par Barman sur <code>bkp-01.prod</code>. Elle couvre la restauration complète
		et la restauration à un instant donné. Elle <em>ne couvre pas</em> la bascule d'un réplica en primaire,
		traitée dans une note séparée.
	</p>

	<h2 id="s-avant">Avant de commencer</h2>

	<h3 id="s-prerequis">Prérequis</h3>
	<ul>
		<li>
			Un accès <code>sudo</code> sur le serveur de sauvegarde <code>bkp-01.prod</code> et sur le serveur
			cible.
		</li>
		<li>
			La clé SSH du compte <code>barman</code> déployée vers le serveur cible.
			<ul>
				<li>Vérifiable avec <code>barman check pg-prod-01</code>.</li>
				<li>
					En cas d'échec, voir <a class="lien-int" href="#"
						>Renouveler les clés SSH du compte barman</a
					>.
				</li>
			</ul>
		</li>
		<li>
			L'espace disque disponible sur la cible : au moins <strong>1,4 fois</strong> la taille de la sauvegarde.
		</li>
	</ul>

	<h3 id="s-fenetre">Fenêtre d'intervention</h3>
	<div class="alerte alerte--attention">
		<div>
			<div class="alerte__tete">
				<span class="alerte__glyphe">ATTENTION</span> La base cible est arrêtée pendant toute la restauration
			</div>
			<div>
				Comptez 40 minutes pour une base de 120 Go sur disque local. Prévenez l'astreinte
				applicative avant de démarrer et déclarez la fenêtre dans l'outil de suivi.
			</div>
		</div>
	</div>

	<h2 id="s-choisir">Choisir la sauvegarde</h2>
	<p>
		Listez les sauvegardes disponibles pour le serveur concerné. La sortie est triée de la plus
		récente à la plus ancienne.
	</p>

	<div class="bloc-code">
		<div class="bloc-code__tete">
			<span class="etiq">bash</span>
			<button class="btn btn--discret btn-copier">
				<svg
					width="13"
					height="13"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
						d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
					/></svg
				>
				Copier
			</button>
		</div>
		<pre><code
				><span class="j-com"># depuis bkp-01.prod, sous le compte barman</span>
<span class="j-cmd">barman</span> list-backup <span class="j-arg">pg-prod-01</span>
<span class="j-cmd">barman</span> show-backup <span class="j-arg">pg-prod-01</span> <span
					class="j-str">20260810T020112</span
				></code
			></pre>
	</div>

	<p>
		Recoupez l'identifiant obtenu avec le tableau ci-dessous, tenu à jour par l'équipe exploitation.
	</p>

	<div class="tableau-boite">
		<table>
			<thead>
				<tr
					><th>Identifiant</th><th>Date</th><th>Type</th><th>Taille</th><th>Rétention</th><th
						>État</th
					></tr
				>
			</thead>
			<tbody>
				<tr
					><td class="num">20260810T020112</td><td>10 août 2026, 02:01</td><td>Complète</td><td
						class="num">118 Go</td
					><td>30 jours</td><td>Valide</td></tr
				>
				<tr
					><td class="num">20260803T020108</td><td>3 août 2026, 02:01</td><td>Complète</td><td
						class="num">117 Go</td
					><td>30 jours</td><td>Valide</td></tr
				>
				<tr
					><td class="num">20260727T020115</td><td>27 juillet 2026, 02:01</td><td>Complète</td><td
						class="num">116 Go</td
					><td>30 jours</td><td>Valide</td></tr
				>
				<tr
					><td class="num">20260701T020104</td><td>1<sup>er</sup> juillet 2026, 02:01</td><td
						>Complète</td
					><td class="num">114 Go</td><td>1 an</td><td>Archivée</td></tr
				>
			</tbody>
		</table>
	</div>

	<h2 id="s-restaurer">Restaurer</h2>
	<p>
		La restauration se déroule en quatre temps. Le schéma ci-dessous fixe l'enchaînement et les
		points de non-retour.
	</p>

	<figure class="figure">
		<button class="figure__cadre" aria-label="Agrandir le schéma d'enchaînement">
			<svg
				viewBox="0 0 640 132"
				width="100%"
				height="auto"
				role="img"
				aria-labelledby="diag-titre diag-desc"
			>
				<title id="diag-titre">Enchaînement de la restauration</title>
				<desc id="diag-desc"
					>Quatre étapes successives : arrêt du service PostgreSQL sur la cible, transfert de la
					sauvegarde par barman recover, application des journaux de transaction, puis redémarrage
					et vérification. Un point de non-retour est signalé entre l'arrêt du service et le
					transfert.</desc
				>
				<g font-family="Archivo, sans-serif" font-size="11">
					<g>
						<rect x="2" y="34" width="132" height="46" rx="6" fill="#fcfbf8" stroke="#9aa7a3" />
						<text x="14" y="54" font-weight="700" fill="#16222b">1 · Arrêter</text>
						<text x="14" y="70" fill="#46585f">systemctl stop</text>
					</g>
					<path d="M134 57h30" stroke="#9aa7a3" stroke-width="1.4" /><path
						d="M164 52l9 5-9 5z"
						fill="#9aa7a3"
					/>
					<g>
						<rect x="174" y="34" width="132" height="46" rx="6" fill="#edecf8" stroke="#453ba0" />
						<text x="186" y="54" font-weight="700" fill="#322b78">2 · Transférer</text>
						<text x="186" y="70" fill="#453ba0">barman recover</text>
					</g>
					<path d="M306 57h30" stroke="#9aa7a3" stroke-width="1.4" /><path
						d="M336 52l9 5-9 5z"
						fill="#9aa7a3"
					/>
					<g>
						<rect x="346" y="34" width="132" height="46" rx="6" fill="#fcfbf8" stroke="#9aa7a3" />
						<text x="358" y="54" font-weight="700" fill="#16222b">3 · Rejouer</text>
						<text x="358" y="70" fill="#46585f">journaux WAL</text>
					</g>
					<path d="M478 57h30" stroke="#9aa7a3" stroke-width="1.4" /><path
						d="M508 52l9 5-9 5z"
						fill="#9aa7a3"
					/>
					<g>
						<rect x="518" y="34" width="120" height="46" rx="6" fill="#e4efe8" stroke="#1d6b4a" />
						<text x="530" y="54" font-weight="700" fill="#1d6b4a">4 · Vérifier</text>
						<text x="530" y="70" fill="#1d6b4a">requête témoin</text>
					</g>
					<g>
						<path d="M154 24v66" stroke="#a52c1b" stroke-width="1.4" stroke-dasharray="4 3" />
						<text x="160" y="20" fill="#a52c1b" font-weight="700" font-size="10"
							>POINT DE NON-RETOUR</text
						>
						<text x="160" y="104" fill="#a52c1b" font-size="10"
							>au-delà, la base cible est écrasée</text
						>
					</g>
				</g>
			</svg>
		</button>
		<figcaption>
			<b>Schéma 1</b><span
				>Enchaînement de la restauration et point de non-retour. Cliquez pour agrandir.</span
			>
		</figcaption>
	</figure>

	<h3 id="s-complete">Restauration complète</h3>
	<ol>
		<li>Arrêtez le service sur le serveur cible et confirmez qu'aucune connexion ne subsiste.</li>
		<li>Lancez le transfert depuis <code>bkp-01.prod</code>.</li>
		<li>Laissez Barman rejouer les journaux jusqu'à la fin de la sauvegarde.</li>
	</ol>

	<div class="bloc-code">
		<div class="bloc-code__tete">
			<span class="etiq">bash</span>
			<button class="btn btn--discret btn-copier">
				<svg
					width="13"
					height="13"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
						d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
					/></svg
				>
				Copier
			</button>
		</div>
		<pre><code
				><span class="j-cmd">barman</span> recover <span class="j-arg">--remote-ssh-command</span
				> <span class="j-str">"ssh postgres@pg-prod-01"</span> \
        <span class="j-arg">pg-prod-01</span> <span class="j-str">20260810T020112</span> \
        <span class="j-arg">/var/lib/postgresql/16/main</span></code
			></pre>
	</div>

	<h3 id="s-instant">Restauration à un instant donné</h3>
	<p>
		Pour revenir à un état antérieur précis — typiquement après une suppression accidentelle —
		ajoutez la cible temporelle. L'heure est interprétée dans le fuseau du serveur de bases.
	</p>

	<div class="bloc-code">
		<div class="bloc-code__tete">
			<span class="etiq">sql</span>
			<button class="btn btn--discret btn-copier">
				<svg
					width="13"
					height="13"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
						d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
					/></svg
				>
				Copier
			</button>
		</div>
		<pre><code
				><span class="j-com">-- repérer l'instant juste avant l'incident</span>
<span class="j-mot">SELECT</span> max(commit_ts) <span class="j-mot">FROM</span> audit.journal
<span class="j-mot">WHERE</span> table_cible = <span class="j-str">'facturation.lignes'</span>
  <span class="j-mot">AND</span> commit_ts &lt; <span class="j-str">'2026-08-11 14:20:00'</span
				>;</code
			></pre>
	</div>

	<div class="alerte alerte--danger">
		<div>
			<div class="alerte__tete">
				<span class="alerte__glyphe">DANGER</span> Opération destructive et irréversible
			</div>
			<div>
				<code>barman recover</code> écrase intégralement le répertoire de données de la cible. Vérifiez
				trois fois le nom du serveur avant de valider. Une restauration lancée sur le mauvais serveur
				détruit une production saine.
			</div>
		</div>
	</div>

	<h2 id="s-verifier">Vérifier le résultat</h2>
	<p>
		Ne rendez pas la main tant que les quatre contrôles suivants ne sont pas passés. Cette liste est
		reprise telle quelle dans le registre opérationnel.
	</p>

	<ul class="taches">
		<li>
			<input type="checkbox" checked disabled /><span
				>Le service démarre sans erreur dans le journal système.</span
			>
		</li>
		<li>
			<input type="checkbox" checked disabled /><span
				>La requête témoin renvoie le nombre de lignes attendu.</span
			>
		</li>
		<li>
			<input type="checkbox" disabled /><span
				>La réplication vers <code>pg-prod-02</code> est repartie.</span
			>
		</li>
		<li>
			<input type="checkbox" disabled /><span>La sonde de supervision est repassée au vert.</span>
		</li>
	</ul>

	<p>
		La <mark>requête témoin</mark> est volontairement <u>peu coûteuse</u> : elle doit pouvoir être
		lancée en pleine charge. <s>L'ancien contrôle par comptage complet</s> a été abandonné en 2025, il
		bloquait la table pendant plusieurs minutes.
	</p>

	<h2 id="s-echec">En cas d'échec</h2>
	<blockquote class="prose-cit">
		Une restauration qui échoue à 3 heures du matin n'est jamais un problème technique isolé : c'est
		presque toujours un prérequis non vérifié en amont.
		<footer>— Retour d'expérience de l'astreinte, revue trimestrielle du 12 mars 2026</footer>
	</blockquote>

	<p>
		Reprenez d'abord les prérequis, puis consultez <a class="lien-int" href="#"
			>Diagnostiquer un échec de restauration Barman</a
		>. Si le serveur de sauvegarde lui-même est en cause, la note
		<a class="lien-casse" id="lien-casse">Reconstruire le dépôt Barman</a>
		n'existe pas encore — signalez-le ou créez-la. La documentation amont de l'éditeur est disponible
		sur
		<a class="lien-ext" href="https://docs.pgbarman.org" target="_blank" rel="noopener"
			>docs.pgbarman.org</a
		>.
	</p>

	<div class="alerte alerte--astuce">
		<div>
			<div class="alerte__tete">
				<span class="alerte__glyphe">ASTUCE</span> Répétez la manœuvre à froid
			</div>
			<div>
				Une restauration blanche sur <code>pg-bac-01</code> une fois par trimestre coûte une heure et
				transforme cette procédure en réflexe. C'est la seule façon de savoir qu'elle fonctionne encore.
			</div>
		</div>
	</div>

	<hr />

	<h2 id="s-annexe">Annexe — conventions de rédaction</h2>
	<p>
		Cette section n'a pas de valeur opérationnelle. Elle fixe le rendu des six niveaux de titre pour
		la maquette de référence.
	</p>
	<h3 id="s-n3">Niveau 3 — sous-partie</h3>
	<h4>Niveau 4 — regroupement</h4>
	<h5>Niveau 5 — précision</h5>
	<h6>Niveau 6 — annotation</h6>
	<p>
		Le niveau 1 est réservé au titre de la note, affiché en tête de page. Seuls les niveaux 2 et 3
		alimentent le sommaire.
	</p>
</div>

<!-- ================ CORPS — REGISTRE OPÉRATIONNEL ================ -->
<div class="prose" id="corps-operationnel" hidden>
	<div class="alerte alerte--astuce">
		<div>
			<div class="alerte__tete">
				<span class="alerte__glyphe">REGISTRE</span> Version opérationnelle
			</div>
			<div>
				Pas-à-pas d'intervention. Pour le détail, les cas particuliers et les justifications,
				basculez sur le registre <strong>Référence</strong>.
			</div>
		</div>
	</div>

	<h2 id="o-preparer">Préparer</h2>
	<ol>
		<li>Prévenez l'astreinte applicative. Déclarez la fenêtre.</li>
		<li>Ouvrez une session sur <code>bkp-01.prod</code> sous le compte <code>barman</code>.</li>
		<li>Notez l'identifiant de la sauvegarde à restaurer.</li>
	</ol>

	<h2 id="o-executer">Exécuter</h2>
	<div class="alerte alerte--danger">
		<div>
			<div class="alerte__tete">
				<span class="alerte__glyphe">DANGER</span> Relisez le nom du serveur cible avant d'appuyer
			</div>
			<div>L'étape suivante écrase la base de la cible. Elle ne s'annule pas.</div>
		</div>
	</div>
	<div class="bloc-code">
		<div class="bloc-code__tete">
			<span class="etiq">bash</span>
			<button class="btn btn--discret btn-copier">
				<svg
					width="13"
					height="13"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
						d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
					/></svg
				>
				Copier
			</button>
		</div>
		<pre><code
				><span class="j-cmd">ssh</span> postgres@pg-prod-01 <span class="j-str"
					>"sudo systemctl stop postgresql@16-main"</span
				>
<span class="j-cmd">barman</span> recover <span class="j-arg">--remote-ssh-command</span> <span
					class="j-str">"ssh postgres@pg-prod-01"</span
				> \
        <span class="j-arg">pg-prod-01</span> <span class="j-str">20260810T020112</span> <span
					class="j-arg">/var/lib/postgresql/16/main</span
				></code
			></pre>
	</div>

	<h2 id="o-controler">Contrôler</h2>
	<ul class="taches">
		<li>
			<input type="checkbox" disabled /><span>Service démarré, journal système sans erreur.</span>
		</li>
		<li><input type="checkbox" disabled /><span>Requête témoin conforme.</span></li>
		<li>
			<input type="checkbox" disabled /><span
				>Réplication vers <code>pg-prod-02</code> repartie.</span
			>
		</li>
		<li><input type="checkbox" disabled /><span>Sonde de supervision au vert.</span></li>
	</ul>

	<h2 id="o-bloque">Si ça bloque</h2>
	<p>
		Ne relancez pas la commande. Appelez l'astreinte infrastructure et suivez <a
			class="lien-int"
			href="#">Diagnostiquer un échec de restauration Barman</a
		>.
	</p>
</div>
