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
	import type { IdentifiantNote } from '../../../seeds/corpus';
	import './modelisation.css';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/** La demi-hauteur et la demi-largeur d'un nœud — le dessin les partage. */
	const DEMI_LARGEUR = 84;
	const DEMI_HAUTEUR = 21;

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

	/**
	 * LE CHEMIN D'UNE ARÊTE — du bas de la note qui porte au haut de la note visée.
	 *
	 * UNE ARÊTE QUI REMONTE PART ET ARRIVE SUR LE CÔTÉ : dessinée comme les autres, elle
	 * traverserait le nœud dont elle sort. Le crochet dit sans un mot qu'on remonte.
	 */
	function cheminDArete(a: (typeof data.aretes)[number]): string {
		const source = data.noeuds.find((n) => n.id === a.de);
		const cible = data.noeuds.find((n) => n.id === a.vers);
		if (source === undefined || cible === undefined) return '';
		if (a.retour || source.couche >= cible.couche) {
			const cote = source.x <= cible.x ? -1 : 1;
			const x1 = source.x + cote * DEMI_LARGEUR;
			const x2 = cible.x + cote * DEMI_LARGEUR;
			const pivot = Math.min(x1, x2) + cote * 46;
			return `M ${x1} ${source.y} C ${pivot} ${source.y}, ${pivot} ${cible.y}, ${x2} ${cible.y}`;
		}
		const y1 = source.y + DEMI_HAUTEUR;
		const y2 = cible.y - DEMI_HAUTEUR;
		const milieu = (y1 + y2) / 2;
		return `M ${source.x} ${y1} C ${source.x} ${milieu}, ${cible.x} ${milieu}, ${cible.x} ${y2}`;
	}

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

		{#if form?.message}
			<p class="mod-message" role="alert">{form.message}</p>
		{/if}

		{#if data.noeuds.length === 0}
			<p class="mod-vide">
				Aucune note reliée dans ce périmètre. Une note n'apparaît ici que lorsqu'une relation
				déclarée ou un lien écrit dans un corps la rattache à une autre.
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
						<g class="mod-arete__groupe">
							<path class={classeDArete(a)} d={cheminDArete(a)} marker-end="url(#pointe)" />
							<!-- LA PRISE EST UN TRAIT LARGE ET TRANSPARENT : un trait d'un pixel et demi
								ne se vise pas à la souris, et l'épaissir pour l'attraper mentirait sur
								la nature de l'arête. -->
							<a
								href={adresseDArete(a.cle)}
								aria-label={a.titreDe + ' ' + a.libelle + ' ' + a.titreVers}
							>
								<path class="mod-arete__prise" d={cheminDArete(a)} />
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

			<div class="mod-panneau">
				<!-- ── DÉCLARER ────────────────────────────────────────────────────── -->
				<section class="mod-bloc">
					<h2>Déclarer une relation</h2>
					<form method="POST" action="?/declarer">
						<input type="hidden" name="perimetre" value={data.perimetreDemande} />
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

				<!-- ── L'ARÊTE CHOISIE ─────────────────────────────────────────────── -->
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
										<input type="hidden" name="relation" value={areteChoisie.id ?? ''} />
										<button class="btn btn--principal" type="submit">Confirmer</button>
									</form>
									<form method="POST" action="?/rejeter">
										<input type="hidden" name="perimetre" value={data.perimetreDemande} />
										<input type="hidden" name="relation" value={areteChoisie.id ?? ''} />
										<button class="btn" type="submit">Rejeter</button>
									</form>
								{:else}
									<form method="POST" action="?/retirer">
										<input type="hidden" name="perimetre" value={data.perimetreDemande} />
										<input type="hidden" name="relation" value={areteChoisie.id ?? ''} />
										<input type="hidden" name="depuis" value={areteChoisie.de} />
										<button class="btn btn--destructif" type="submit">Retirer</button>
									</form>
								{/if}
							</div>
						{/if}
					{/if}
				</section>
			</div>

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
	{/snippet}
</Coquille>
