<script lang="ts">
	/**
	 * LE CORPS RÉDIGÉ DU REGISTRE OPÉRATIONNEL — le contenu de
	 * `#corps-operationnel`, sans son enveloppe.
	 *
	 * MÊME PARTAGE QUE `CorpsReference`, et une raison de plus de l'isoler : V-18
	 * le rend DEUX FOIS dans la même page, et le gel le fait lui aussi. La
	 * première fois dans `#corps-operationnel`, masqué, à l'intérieur du panneau
	 * de référence — c'est la SOURCE (`V-18:2932-2934`) ; la seconde dans
	 * `#redaction`, où le script le recopie tel quel
	 * (`redaction.innerHTML = OPERATIONNEL`, `V-18:3281`). Les deux copies
	 * portent donc les mêmes identifiants de titre, `o-preparer`, `o-executer`,
	 * `o-controler`, `o-bloque` : c'est le rendu du gel, mesuré, et non une
	 * inadvertance de portage.
	 *
	 * RATTACHEMENT — voir `CorpsReference.svelte`. Aucun attribut `style` ici non
	 * plus.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-6.1, P-6.3).
	 */
</script>

<div class="alerte alerte--astuce">
	<div>
		<div class="alerte__tete">
			<span class="alerte__glyphe">REGISTRE</span> Version opérationnelle
		</div>
		<div>
			Pas-à-pas d'intervention. Pour le détail, les cas particuliers et les justifications, basculez
			sur le registre <strong>Référence</strong>.
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
		<input type="checkbox" disabled /><span>Réplication vers <code>pg-prod-02</code> repartie.</span
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
