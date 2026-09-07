<script lang="ts">
	/**
	 * `/modelisation` — LA VUE DE MODÉLISATION.
	 *
	 * ELLE FONCTIONNE SANS HYDRATATION, ET C'EST LE CHOIX STRUCTURANT. Tous les gestes
	 * passent par un formulaire qui poste, et la sélection d'une arête passe par
	 * l'adresse. Un écran de modélisation dont la moitié des boutons attend un paquet
	 * de script est un écran qu'on ne peut pas éprouver — ici, tout se vérifie dans un
	 * navigateur, script coupé.
	 *
	 * LA DISPOSITION VIENT DU CHARGEUR, ENTIÈREMENT. Elle est déterministe et ne dépend
	 * d'aucun geste : la refaire ici la paierait deux fois, au serveur puis à
	 * l'hydratation, pour un dessin rigoureusement identique.
	 *
	 * L'APPARENCE SERA REPRISE. La mécanique est ce qui devait exister : déclarer,
	 * requalifier, retirer, confirmer, rejeter — et voir ce qui dépend de quoi.
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { page } from '$app/state';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import {
		DEMI_HAUTEUR,
		DEMI_LARGEUR,
		RAYON_DE_POIGNEE,
		tracerLesAretes
	} from '$lib/graphe/traces';
	import type { IdentifiantNote } from '../../../seeds/corpus';
	import './modelisation.css';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/**
	 * LES TRACÉS, PAR CLÉ. La géométrie a quitté ce fichier pour `$lib/graphe/traces`,
	 * où un unitaire l'atteint : deux relations entre les deux mêmes notes recevaient
	 * ici un chemin RIGOUREUSEMENT identique, leurs deux prises se superposaient, et
	 * l'une des deux était inatteignable au clic.
	 *
	 * LE MODULE REND SA TABLE RANGÉE PAR CLÉ, pas dans l'ordre d'entrée : la vue lit
	 * par clé, et l'ordre du balisage reste celui du chargeur.
	 */
	const tracesParCle = $derived(
		new Map(tracerLesAretes(data.aretes, data.noeuds).map((t) => [t.cle, t] as const))
	);

	/** Le tracé d'une arête, ou un tracé vide — une extrémité peut manquer. */
	function traceDe(cle: string) {
		return tracesParCle.get(cle) ?? { cle, d: '', poignee: { x: 0, y: 0 } };
	}

	const areteChoisie = $derived(data.aretes.find((a) => a.cle === data.areteChoisie) ?? null);

	/**
	 * LES OPTIONS DU SÉLECTEUR DE PÉRIMÈTRE — LES MÊMES QU'À LA CARTOGRAPHIE, et par la
	 * même source : les univers et les domaines que le gabarit racine a lus en base,
	 * déjà bornés au périmètre lisible de l'appelant. Les recopier d'un jeu d'exemple
	 * proposerait des rangements qu'aucune instance ne porte.
	 */
	const universLisibles = $derived(
		(page.data.univers as readonly { nom: string }[] | undefined) ?? []
	);
	const domainesLisibles = $derived(
		(page.data.domaines as readonly { nom: string }[] | undefined) ?? []
	);

	/** La classe d'une arête — son origine, son sens, et le fait qu'on l'ait choisie. */
	function classeDArete(a: (typeof data.aretes)[number]): string {
		const parts = ['mod-arete'];
		if (a.origine === 'deduite') parts.push('mod-arete--deduite');
		if (a.origine === 'ambigue') parts.push('mod-arete--ambigue');
		if (a.retour) parts.push('mod-arete--retour');
		if (a.cle === data.areteChoisie) parts.push('mod-arete--choisie');
		return parts.join(' ');
	}

	/**
	 * L'ADRESSE QUI DÉSIGNE UNE ARÊTE, périmètre conservé.
	 *
	 * La chaîne est composée à la main : `URLSearchParams` est une classe mutable, et
	 * la règle `svelte/prefer-svelte-reactivity` la refuse à raison — un objet muté ne
	 * réveille rien dans un état dérivé. Ici deux valeurs suffisent, encodées chacune.
	 */
	function adresseDArete(cle: string): string {
		const morceaux = [];
		if (data.perimetreDemande !== 'global|') {
			morceaux.push('perimetre=' + encodeURIComponent(data.perimetreDemande));
		}
		morceaux.push('arete=' + encodeURIComponent(cle));
		return '?' + morceaux.join('&');
	}

	/**
	 * L'ADRESSE D'UNE ASSISE, périmètre conservé. Même règle que `adresseDArete()` :
	 * la chaîne est composée à la main, `URLSearchParams` étant une classe mutable que
	 * `svelte/prefer-svelte-reactivity` refuse à raison.
	 *
	 * L'ARÊTE CHOISIE NE SUIT PAS : changer d'assise réétage le dessin, et le panneau
	 * rouvert sur une arête que le nouvel étagement place ailleurs n'apporte rien.
	 */
	function adresseDAssise(voulue: 'tout' | 'declarees'): string {
		const morceaux = [];
		if (data.perimetreDemande !== 'global|') {
			morceaux.push('perimetre=' + encodeURIComponent(data.perimetreDemande));
		}
		if (voulue === 'declarees') morceaux.push('etagement=declarees');
		return morceaux.length === 0 ? '?' : '?' + morceaux.join('&');
	}

	/** Ce sur quoi la hauteur d'un nœud s'appuie, dit en toutes lettres. */
	const phraseDeLAssise = $derived(
		data.assise === 'tout'
			? 'L’étagement s’appuie sur les ' +
					String(data.nombreDeDeclarees) +
					' relations déclarées et les ' +
					String(data.nombreDeMentions) +
					' mentions : la hauteur d’une note dépend aussi des liens écrits dans les corps.'
			: 'L’étagement s’appuie sur les seules ' +
					String(data.nombreDeDeclarees) +
					' relations déclarées. Les ' +
					String(data.nombreDeMentions) +
					' mentions sont dessinées, elles ne placent rien.'
	);

	const MOT_DE_L_ORIGINE: Record<string, string> = {
		declaree: 'Déclarée',
		deduite: 'Mention',
		ambigue: 'Proposition, à confirmer'
	};
</script>

<!-- `svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR CE BALISAGE : les
	adresses de sélection sont des chaînes de requête composées ici, et les adresses de
	note viennent de la fabrique unique du rangement, que la règle ne sait pas suivre. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<Coquille
	fil={['Accueil', 'Modélisation']}
	classeContenu="modelisation"
	cibleEvitement="restitution"
	libelleEvitement="Aller à la liste des relations"
	univers={page.data.univers}
	domaines={page.data.domaines}
	notes={page.data.notes}
	compte={{ nom: '', initiales: '', role: '', domaine: '' }}
	version=""
>
	{#snippet enfants()}
		<div class="mod-commandes">
			<!-- LE PÉRIMÈTRE SE CHOISIT PAR UNE REQUÊTE, pas par un script : le sélecteur
				est dans un formulaire qui navigue, et l'adresse obtenue est partageable. -->
			<form method="GET">
				<!-- LE RÉGLAGE D'ÉTAGEMENT VOYAGE AVEC LE PÉRIMÈTRE : c'est un formulaire
					GET, et ce qu'il ne porte pas disparaît de l'adresse. -->
				<input type="hidden" name="etagement" value={data.assise} />
				<label class="etiq" for="perimetre">Périmètre</label>
				<select id="perimetre" name="perimetre">
					<option value="global|" selected={data.perimetreDemande === 'global|'}
						>Tout le corpus</option
					>
					{#each universLisibles as u (u.nom)}
						<option value="univers|{u.nom}" selected={data.perimetreDemande === 'univers|' + u.nom}
							>{'Univers ' + u.nom}</option
						>
					{/each}
					{#each domainesLisibles as d (d.nom)}
						<option value="domaine|{d.nom}" selected={data.perimetreDemande === 'domaine|' + d.nom}
							>{'Domaine ' + d.nom}</option
						>
					{/each}
				</select>
				<button class="btn" type="submit">Afficher</button>
			</form>

			<!-- « Proposer » DIT CE QU'IL FERA. Sans chiffre, c'est un bouton qu'on n'ose
				pas presser ; à zéro, il n'a rien à faire et il n'est pas rendu. -->
			{#if data.propositionsPossibles > 0}
				<form method="POST" action="?/proposer">
					<input type="hidden" name="perimetre" value={data.perimetreDemande} />
					<input type="hidden" name="etagement" value={data.assise} />
					<button class="btn" type="submit"
						>{'Proposer ' + String(data.propositionsPossibles) + ' relation(s) à confirmer'}</button
					>
				</form>
			{/if}

			<div class="mod-mesures">
				<span class="mod-mesure"><b>{data.nombreDeDeclarees}</b> déclarées</span>
				<span class="mod-mesure"><b>{data.nombreDePropositions}</b> à confirmer</span>
				<span class="mod-mesure"><b>{data.nombreDeMentions}</b> mentions</span>
				<span class="mod-mesure"><b>{data.noeuds.length}</b> notes reliées</span>
			</div>
		</div>

		<!-- ── L'ASSISE DE L'ÉTAGEMENT ───────────────────────────────────────────
			DES LIENS, PAS UN SCRIPT : l'adresse obtenue est partageable, et l'écran
			continue de marcher script coupé.

			LA PHRASE EST TOUJOURS RENDUE, y compris à zéro mention : « … et les 0
			mentions » dit que la règle existe, là où une phrase conditionnelle
			laisserait croire qu'elle change. -->
		<div class="mod-assise">
			<span class="mod-assise__choix">
				<a href={adresseDAssise('tout')} aria-current={data.assise === 'tout' ? 'true' : undefined}
					>Sur tout ce qui est dessiné</a
				><a
					href={adresseDAssise('declarees')}
					aria-current={data.assise === 'declarees' ? 'true' : undefined}
					>Sur les seules relations déclarées</a
				>
			</span>
			<p class="mod-assise__phrase">{phraseDeLAssise}</p>
		</div>

		<!-- ── L'AVIS QUAND LA QUESTION N'A PAS DE SENS ──────────────────────────
			Sans un seul type marqué « Dépendance technique », `pointsArticulation()`
			reçoit une liste vide, ne trouve rien, et l'écran dirait silencieusement
			« aucun point de défaillance unique » là où la vérité est « personne n'a dit
			ce qui porte une dépendance ». C'est un mensonge par omission. -->
		{#if data.nombreDeTypesPorteurs === 0}
			<p class="mod-avis">
				<b>Aucun type de relation ne porte de dépendance.</b> Les points de défaillance unique ne
				sont donc pas calculés : le produit ne sait pas encore quelles relations font dépendre une
				note d'une autre.
				{#if data.consoleOuverte}
					<span
						>Un administrateur le règle sur
						<a href="/console/types-de-relations">Console › Types de relations</a>, case «
						Dépendance technique ».</span
					>
				{/if}
			</p>
		{/if}

		{#if form?.message}
			<p class="mod-message" role="alert">{form.message}</p>
		{/if}

		<!-- ── CE QUE « PROPOSER » A ÉCARTÉ ──────────────────────────────────────
			Un fait, pas un refus : le geste a abouti, et il n'a pas tout posé. Le
			bouton annonce un nombre ; quand l'écriture en pose moins, se taire fait
			mentir le bouton. `role="status"` et non `alert` — rien n'a échoué. -->
		{#if data.avisDeProposition !== null}
			<p class="mod-message mod-message--avis" role="status">{data.avisDeProposition}</p>
		{/if}

		{#if data.noeuds.length === 0}
			<p class="mod-vide">
				Aucune note reliée dans ce périmètre. Une note n'apparaît ici que lorsqu'une relation
				déclarée ou un lien écrit dans un corps la rattache à une autre.
				{#if data.notesDuPerimetre.length >= 2}
					<span>Déclarez la première relation avec le formulaire ci-contre.</span>
				{/if}
			</p>
		{:else}
			<div class="mod-plan">
				<svg
					viewBox="0 0 {data.largeur} {data.hauteur}"
					width={data.largeur}
					height={data.hauteur}
					role="img"
					aria-label="Modèle des dépendances du périmètre. La liste équivalente est sous le dessin."
				>
					<defs>
						<marker
							id="pointe"
							viewBox="0 0 8 8"
							refX="7"
							refY="4"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M0 0 L8 4 L0 8 z" fill="currentColor" />
						</marker>
					</defs>

					{#each data.aretes as a (a.cle)}
						{@const trace = traceDe(a.cle)}
						<g class="mod-arete__groupe">
							<path class={classeDArete(a)} d={trace.d} marker-end="url(#pointe)" />
							<!-- LA PRISE EST UN TRAIT LARGE ET TRANSPARENT : un trait d'un pixel et demi
								ne se vise pas à la souris, et l'épaissir pour l'attraper mentirait sur
								la nature de l'arête. LA POIGNÉE VIENT PAR-DESSUS : c'est elle qui atteint
								une arête parallèle à une autre, là où deux prises se recouvrent. -->
							<a
								href={adresseDArete(a.cle)}
								aria-label={a.titreDe + ' ' + a.libelle + ' ' + a.titreVers}
							>
								<path class="mod-arete__prise" d={trace.d} />
								<circle
									class="mod-arete__poignee"
									cx={trace.poignee.x}
									cy={trace.poignee.y}
									r={RAYON_DE_POIGNEE}
								/>
							</a>
						</g>
					{/each}

					{#each data.noeuds as n (n.id)}
						<g class={n.rupture ? 'mod-noeud mod-noeud--rupture' : 'mod-noeud'}>
							<a href={adresseDeNote(n.id as IdentifiantNote)}>
								<title
									>{n.titre +
										' — ' +
										n.type +
										(n.rupture ? ' — point de défaillance unique' : '')}</title
								>
								<rect
									x={n.x - DEMI_LARGEUR}
									y={n.y - DEMI_HAUTEUR}
									width={DEMI_LARGEUR * 2}
									height={DEMI_HAUTEUR * 2}
									rx="4"
								/>
								<text class="mod-noeud__code" x={n.x - DEMI_LARGEUR + 8} y={n.y - 4}
									>{n.code + (n.rupture ? '  ⚠' : '')}</text
								>
								<text class="mod-noeud__titre" x={n.x - DEMI_LARGEUR + 8} y={n.y + 12}
									>{n.titre.length > 22 ? n.titre.slice(0, 21) + '…' : n.titre}</text
								>
							</a>
						</g>
					{/each}
				</svg>
			</div>
		{/if}

		<!-- ── LE PANNEAU ────────────────────────────────────────────────────────
			IL EST HORS DE LA BRANCHE DU DESSIN, et c'est un défaut réparé : sur une
			instance qui n'a encore AUCUNE relation, le dessin est vide, et le
			formulaire qui sert à déclarer la première partait avec lui. L'écran qui
			sert à relier les notes ne pouvait pas relier les deux premières. -->
		<div class="mod-panneau">
			<!-- ── DÉCLARER ──────────────────────────────────────────────────────── -->
			{#if data.notesDuPerimetre.length >= 2 && data.typesOfferts.length > 0}
				<section class="mod-bloc">
					<h2>Déclarer une relation</h2>
					<form method="POST" action="?/declarer">
						<input type="hidden" name="perimetre" value={data.perimetreDemande} />
						<input type="hidden" name="etagement" value={data.assise} />
						<label class="etiq" for="source">De</label>
						<select id="source" name="source" required>
							{#each data.notesDuPerimetre as n (n.id)}
								<option value={n.id}>{n.titre}</option>
							{/each}
						</select>
						<label class="etiq" for="type-nouveau">Relation</label>
						<select id="type-nouveau" name="type" required>
							{#each data.typesOfferts as t (t.identifiant)}
								<option value={t.identifiant}>{t.sortant}</option>
							{/each}
						</select>
						<label class="etiq" for="cible">Vers</label>
						<select id="cible" name="cible" required>
							{#each data.notesDuPerimetre as n (n.id)}
								<option value={n.id}>{n.titre}</option>
							{/each}
						</select>
						<button class="btn btn--principal" type="submit">Déclarer</button>
					</form>
				</section>
			{:else}
				<!-- L'ÉTAT VIDE NOMME LE GESTE QUI DÉBLOQUE : une liste de deux
					sélecteurs sans une seule option est un formulaire qui ne peut pas
					aboutir, et le rendre inerte ne dirait pas pourquoi. -->
				<section class="mod-bloc">
					<h2>Déclarer une relation</h2>
					{#if data.typesOfferts.length === 0}
						<p class="mod-fait">
							<span
								>Aucun type de relation n'existe encore. Un administrateur en crée un sur
								<a href="/console/types-de-relations">Console › Types de relations</a>.</span
							>
						</p>
					{:else}
						<p class="mod-fait">
							<span
								>Il faut deux notes dans le périmètre pour déclarer une relation. Créez-en depuis
								<a href="/notes/nouvelle">Nouvelle note</a>, ou élargissez le périmètre.</span
							>
						</p>
					{/if}
				</section>
			{/if}

			<!-- ── L'ARÊTE CHOISIE ────────────────────────────────────────────────
				Elle n'a de sens qu'avec un dessin : sans arête, il n'y a rien à
				choisir, et le bloc n'aurait qu'un état vide à montrer. -->
			{#if data.noeuds.length > 0}
				<section class="mod-bloc">
					<h2>Lien choisi</h2>
					{#if areteChoisie === null}
						<p class="mod-fait">
							<span>Aucun lien choisi — cliquez un trait du dessin.</span>
						</p>
					{:else}
						<p class="mod-fait"><span>De</span><span>{areteChoisie.titreDe}</span></p>
						<p class="mod-fait"><span>Lien</span><span>{areteChoisie.libelle}</span></p>
						<p class="mod-fait"><span>Vers</span><span>{areteChoisie.titreVers}</span></p>
						<p class="mod-fait">
							<span>Nature</span><span>{MOT_DE_L_ORIGINE[areteChoisie.origine] ?? ''}</span>
						</p>
						{#if areteChoisie.technique}
							<p class="mod-fait">
								<span>Portée</span><span>dépendance technique</span>
							</p>
						{/if}
						{#if areteChoisie.retour}
							<p class="mod-fait">
								<span>Sens</span><span>remonte — ce lien referme un circuit</span>
							</p>
						{/if}

						{#if areteChoisie.origine === 'deduite'}
							<!-- UNE MENTION NE SE RETIRE PAS : elle n'est pas une ligne, elle est le
								reflet d'un lien écrit dans un corps. Le seul geste qu'elle offre est
								de la QUALIFIER, et le type choisi crée la relation déclarée. -->
							<form method="POST" action="?/declarer">
								<input type="hidden" name="perimetre" value={data.perimetreDemande} />
								<input type="hidden" name="etagement" value={data.assise} />
								<input type="hidden" name="source" value={areteChoisie.de} />
								<input type="hidden" name="cible" value={areteChoisie.vers} />
								<label class="etiq" for="type-mention">Qualifier ce lien</label>
								<select id="type-mention" name="type" required>
									{#each data.typesOfferts as t (t.identifiant)}
										<option value={t.identifiant}>{t.sortant}</option>
									{/each}
								</select>
								<button class="btn btn--principal" type="submit">Déclarer ce type</button>
							</form>
							<p class="mod-fait">
								<span>Ce lien vient du corps de la note, il ne se retire pas d'ici.</span>
							</p>
						{:else}
							<form method="POST" action="?/changer">
								<input type="hidden" name="perimetre" value={data.perimetreDemande} />
								<input type="hidden" name="etagement" value={data.assise} />
								<input type="hidden" name="relation" value={areteChoisie.id ?? ''} />
								<label class="etiq" for="type-change">Changer le type</label>
								<select id="type-change" name="type" required>
									{#each data.typesOfferts as t (t.identifiant)}
										<option value={t.identifiant} selected={t.identifiant === areteChoisie.type}
											>{t.sortant}</option
										>
									{/each}
								</select>
								<button class="btn" type="submit">Appliquer</button>
							</form>

							<div class="mod-gestes">
								{#if areteChoisie.origine === 'ambigue'}
									<form method="POST" action="?/confirmer">
										<input type="hidden" name="perimetre" value={data.perimetreDemande} />
										<input type="hidden" name="etagement" value={data.assise} />
										<input type="hidden" name="relation" value={areteChoisie.id ?? ''} />
										<button class="btn btn--principal" type="submit">Confirmer</button>
									</form>
									<form method="POST" action="?/rejeter">
										<input type="hidden" name="perimetre" value={data.perimetreDemande} />
										<input type="hidden" name="etagement" value={data.assise} />
										<input type="hidden" name="relation" value={areteChoisie.id ?? ''} />
										<button class="btn" type="submit">Rejeter</button>
									</form>
								{:else}
									<form method="POST" action="?/retirer">
										<input type="hidden" name="perimetre" value={data.perimetreDemande} />
										<input type="hidden" name="etagement" value={data.assise} />
										<input type="hidden" name="relation" value={areteChoisie.id ?? ''} />
										<input type="hidden" name="depuis" value={areteChoisie.de} />
										<button class="btn btn--destructif" type="submit">Retirer</button>
									</form>
								{/if}
							</div>
						{/if}
					{/if}
				</section>
			{/if}
		</div>

		{#if data.noeuds.length > 0}
			<!-- ── LA RESTITUTION ─────────────────────────────────────────────────
				`P-06` — tout contenu graphique porte son alternative. Elle dit ce que le
				dessin dit, dans l'ordre du dessin, et elle est atteignable. -->
			<section class="mod-restitution" id="restitution">
				<details>
					<summary>{'Les ' + String(data.aretes.length) + ' liens du modèle, en liste'}</summary>
					<ol>
						{#each data.aretes as a (a.cle)}
							<li>
								{a.titreDe + ' ' + a.libelle + ' ' + a.titreVers}
								{' — ' + (MOT_DE_L_ORIGINE[a.origine] ?? '')}
							</li>
						{/each}
					</ol>
				</details>
			</section>
		{/if}

		<!-- ── LES PROPOSITIONS REFUSÉES ───────────────────────────────────────
			IL EST HORS DU DESSIN, ET C'EST NÉCESSAIRE : refuser la seule proposition
			d'une paire peut vider le dessin, et un bloc rendu dans la branche du
			dessin emporterait alors le seul geste qui défait le refus. Il n'existe
			que s'il y a quelque chose dedans — un cadre vide dirait qu'il manque une
			donnée. -->
		{#if data.refuses.length > 0}
			<section class="mod-bloc mod-refuses">
				<h2>Propositions refusées</h2>
				<p class="mod-refuses__phrase">
					Ces liens ont été proposés puis refusés. Ils ne seront plus proposés. Vous pouvez toujours
					les déclarer vous-même.
				</p>
				<ul class="mod-refus">
					{#each data.refuses as r (r.id)}
						<li>
							<!-- LES TROIS PARTIES SONT DISTINCTES, et ce n'est pas décoratif : un
								titre qui porte lui-même un tiret cadratin rendrait la ligne illisible
								s'ils étaient concaténés en un seul texte. -->
							<span class="mod-refus__lien">
								<span class="mod-refus__note">{r.titreDe}</span><span class="mod-refus__type"
									>{' — ' + r.libelle + ' → '}</span
								><span class="mod-refus__note">{r.titreVers}</span>
							</span>
							<span class="mod-refus__date">{r.refuseeLe}</span>
							<form method="POST" action="?/annulerLeRefus">
								<input type="hidden" name="perimetre" value={data.perimetreDemande} />
								<input type="hidden" name="etagement" value={data.assise} />
								<input type="hidden" name="refus" value={r.id} />
								<button class="btn" type="submit">Annuler ce refus</button>
							</form>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/snippet}
</Coquille>
