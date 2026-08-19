<script lang="ts">
	/**
	 * LE CORPS RÉDIGÉ DU REGISTRE RÉFÉRENCE — le contenu de `#corps-reference`,
	 * sans son enveloppe.
	 *
	 * TROIS MAQUETTES LE PORTENT, IDENTIQUE À L'OCTET : V-14 (lecture d'une
	 * note), V-15 (historique) et V-18 (éditeur de l'Opérationnel). Vérifié par
	 * `diff` : `V-14:1523-1753` et `V-18:1709-1939` ne divergent d'aucun
	 * caractère, et V-18 le dit dans son propre balisage — « la source de
	 * l'Opérationnel est le corps partagé de la note : l'éditeur et la lecture
	 * montrent le même contenu, jamais deux versions du markup » (`V-18:2930-2931`).
	 *
	 * POURQUOI L'ENVELOPPE RESTE À L'APPELANT. `NoteDeDemonstration` la rend en
	 * `div.prose#corps-reference` ; V-18 la rend à la même adresse, mais À
	 * L'INTÉRIEUR de `#ref-corps`, où la feuille lui applique ses propres règles
	 * de lecture seule (`V-18.css:967-974`). Le contenu, lui, ne change pas —
	 * c'est ce qui est partagé, et rien d'autre.
	 *
	 * RATTACHEMENT — `src/lib/lecture` est rattaché à V-14 pour la preuve par le
	 * gel (ARB-022, `verif/references/preuve-par-le-gel.json`). Ce fragment ne
	 * porte AUCUN attribut `style`, vérifié : la question de la portée ne se pose
	 * donc pas, et le rattachement existant la couvrirait de toute façon,
	 * puisque V-14 est bien la maquette dont ce corps est extrait.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : ni copie d'un bloc de
	 * code, ni agrandissement du schéma, ni cases à cocher actionnables.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-6.1, P-6.3).
	 */
</script>

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
			Comptez 40 minutes pour une base de 120 Go sur disque local. Prévenez l'astreinte applicative
			avant de démarrer et déclarez la fenêtre dans l'outil de suivi.
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
				><th>Identifiant</th><th>Date</th><th>Type</th><th>Taille</th><th>Rétention</th><th>État</th
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
	La restauration se déroule en quatre temps. Le schéma ci-dessous fixe l'enchaînement et les points
	de non-retour.
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
				sauvegarde par barman recover, application des journaux de transaction, puis redémarrage et
				vérification. Un point de non-retour est signalé entre l'arrêt du service et le transfert.</desc
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
	Pour revenir à un état antérieur précis — typiquement après une suppression accidentelle — ajoutez
	la cible temporelle. L'heure est interprétée dans le fuseau du serveur de bases.
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
			trois fois le nom du serveur avant de valider. Une restauration lancée sur le mauvais serveur détruit
			une production saine.
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
	lancée en pleine charge. <s>L'ancien contrôle par comptage complet</s> a été abandonné en 2025, il bloquait
	la table pendant plusieurs minutes.
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
	n'existe pas encore — signalez-le ou créez-la. La documentation amont de l'éditeur est disponible sur
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
			Une restauration blanche sur <code>pg-bac-01</code> une fois par trimestre coûte une heure et transforme
			cette procédure en réflexe. C'est la seule façon de savoir qu'elle fonctionne encore.
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
