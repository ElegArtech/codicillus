<script lang="ts">
	/**
	 * V-19 — Cartographie. Route `/cartographie` (`docs/routes.md` §3),
	 * atteinte par l'entrée de rail « Outils › Cartographie ».
	 *
	 * LA CARTOGRAPHIE N'A AUCUNE DONNÉE PROPRE (`RG-M09-01`). Le graphe est
	 * intégralement dérivé de `seeds/corpus.ts` — `RELATIONS`,
	 * `RELATIONS_TECHNIQUES`, `TYPES_RELATION` — et du jeu de semence que le
	 * mode démo passe en propriété (`corpusPourVue('V-19')`, variante
	 * « cartographie », 27 notes). Les trois tableaux sont désormais REÇUS EN
	 * PROPRIÉTÉ, de défaut la constante du jeu (T-043) : la base les porte, un
	 * chargeur de route peut donc les passer sans que le rendu par défaut change.
	 * Aucun identifiant, aucun libellé, aucun
	 * compteur n'est écrit ici. Ce lot NE DÉCLARE PAS `RG-M09-01` tenue : la
	 * règle porte sur le module entier, pas sur une vue.
	 *
	 * LE RENDU EST DU SVG DANS LE DOM, jamais un canevas ni WebGL (ADR-008,
	 * `STACK §4.4`). Chaque nœud est un `<g role="button" tabindex="0">` porteur
	 * de son nom accessible, et `details#liste-noeuds` restitue le même contenu
	 * en texte — la matière de `RG-M18-11`, que ce lot NE DÉCLARE PAS TENUE : la
	 * batterie qui l'éprouve est `pnpm test:a11y`, hors périmètre.
	 *
	 * AUCUNE DISPOSITION N'EST CALCULÉE ICI (ARB-011). Le gel obtient ses
	 * positions par une force dirigée de 320 itérations, exécutée une fois puis
	 * figée (`V-19:2566`) — un comportement, donc hors du squelette. Les
	 * positions ci-dessous sont CELLES DU GEL, relevées sur la maquette gelée
	 * dans les conditions du banc, et rendues telles quelles. Aucune simulation,
	 * aucun `d3-force`. Le sous-graphe, les degrés et les points de rupture,
	 * eux, sont dérivés du corpus par `$lib/graphe/cartographie`.
	 *
	 * SIX ÉTATS — `verif/scenarios/V-19.json`. Deux axes, vecteur complet :
	 * profil × état. `etat-nominal` est déclaré `identiqueA` `role-admin`, et le
	 * relevé du gel en montre un TROISIÈME identique : `role-referent`.
	 *
	 * LE PROFIL NE CHANGE RIEN AU RENDU, ET C'EST LE GEL. Le balisage pose
	 * `data-role="referent"` sur `div.app` (`V-19:973`) tandis que la planche
	 * coche « Administrateur » par défaut : les deux ne concordent pas. Le banc
	 * n'émet un `change` que sur une position RÉELLEMENT différente, si bien que
	 * `role-admin` n'exécute jamais le gestionnaire et laisse l'attribut à
	 * `referent` ; `role-referent` l'exécute et y réécrit `referent`. Les six
	 * états rendent donc `data-role="referent"`, et le sélecteur de périmètre
	 * n'offre JAMAIS « Tous les domaines » — l'option n'est ajoutée que pour
	 * `admin` (`V-19:3072`). Mesuré sur les six états, pas déduit. Le
	 * « corriger » serait un comblement, et il serait rouge au banc.
	 *
	 * `.noeud` EST ICI UN NŒUD DE GRAPHE, ET NULLE PART AILLEURS DANS CETTE
	 * PAGE — `docs/DESIGN.md` §2.H. Le même nom de classe désigne un nœud
	 * d'ARBORESCENCE dans 33 autres vues, dont le rail de cette page même, que
	 * `$lib/coquille/Rail.svelte` rend avec sa définition à lui. Les deux règles
	 * sont inconciliables, chacune vit dans la feuille de sa vue (P-6.3), et
	 * AUCUNE FACTORISATION N'EST PERMISE. Il en va de même de `.noeud__nom`.
	 *
	 * LE PANNEAU DE DÉTAIL N'EST PAS FACTORISÉ AVEC V-20 bien que les deux gels
	 * l'écrivent mot pour mot : il porte des styles en ligne que P-6.4 n'admet
	 * que dans un fichier rattaché à une maquette, et le rattachement d'une
	 * ressource partagée s'écrit à `verif/references/preuve-par-le-gel.json`, en
	 * écriture humaine seule. Voir l'en-tête de `$lib/graphe/cartographie.ts`.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : ni la force dirigée, ni
	 * le zoom, ni la sélection persistante, ni la recherche dans le graphe. La
	 * jauge de l'état « Calcul en cours » est un INSTANT — celui que le budget
	 * d'horloge du banc atteint —, jamais un film.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-19.css`, posé par `node verif/feuilles-de-vue.mjs V-19
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		RELATIONS,
		RELATIONS_TECHNIQUES,
		TYPES_RELATION,
		UNIVERS,
		type CleDeTypeDeRelation,
		type Domaine,
		type EtatDInstance,
		type LibellesDeRelation,
		type Note,
		type Relation,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import {
		contourDeForme,
		degres,
		estTechnique,
		pointsArticulation,
		relationsDe,
		sousGraphe,
		titreDe,
		typeDe,
		typesPresents,
		type Contour,
		type EncodageDeType
	} from '$lib/graphe/cartographie';
	import { motFicheMinuscule } from '$lib/vocabulaire';

	/**
	 * LES PROPRIÉTÉS DE RANGEMENT ET D'IDENTITÉ SONT OPTIONNELLES, ET LEUR
	 * DÉFAUT EST LA CONSTANTE DU JEU DE SEMENCE.
	 *
	 * La vue devient capable de recevoir ce qu'un chargeur de route lit en base
	 * — univers, domaines, compte courant, état de l'instance — sans qu'aucun
	 * rendu ne change tant que rien ne lui est passé : le mode de conception ne
	 * passe que `vecteur` et `notes`, la vue reçoit donc exactement ce qu'elle
	 * recevait, et le banc de comparaison ne bouge pas d'un pixel.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — profil × état. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-19')`. */
		notes: readonly Note[];
		/** Les univers du produit. Défaut : ceux du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du produit. Défaut : ceux du jeu de semence. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Défaut : celui du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance servie. Défaut : celui du jeu de semence. */
		instance?: EtatDInstance;
		/**
		 * Les relations du corpus. Défaut : celles du jeu de semence.
		 *
		 * La base les porte réellement. La vue n'en fabrique aucune : elle les
		 * descend au socle commun des cartographies, qui en dérive le sous-graphe.
		 */
		relations?: readonly Relation[];
		/** Les types de relation et leurs deux libellés. Défaut : ceux du jeu de semence. */
		typesRelation?: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		/** Les types de relation qui portent une dépendance technique. Défaut : ceux du jeu de semence. */
		relationsTechniques?: readonly CleDeTypeDeRelation[];
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		relations = RELATIONS,
		typesRelation = TYPES_RELATION,
		relationsTechniques = RELATIONS_TECHNIQUES
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const cas = $derived(String(reglage['etat'] ?? 'nominal'));

	/* ── Le graphe ──────────────────────────────────────────────────────────
	   Le périmètre est la première option du sélecteur, celle que le gel a
	   sélectionnée au chargement : « Univers Production », l'option globale
	   n'étant jamais posée (voir l'en-tête). */
	const graphe = $derived(sousGraphe(corpus, { type: 'univers', nom: 'Production' }, relations));
	const deg = $derived(degres(graphe));
	const ruptures = $derived(pointsArticulation(graphe, relationsTechniques));
	const types = $derived(typesPresents(graphe));

	/**
	 * LES UNIVERS DU SÉLECTEUR DE PÉRIMÈTRE — les deux univers déclarés, sans
	 * l'univers SYSTÈME. `seeds/corpus.ts` en porte trois : « Non classé »,
	 * marqué `systeme: true`, est la destination de repli d'un domaine qui perd
	 * son rattachement. Le gel, lui, n'en connaît que deux (`V-19:1710`), et
	 * aucun domaine n'y est rattaché : l'offrir en périmètre proposerait un
	 * choix qui ne rend rien. Le filtre est celui du gel, pas une décision.
	 */
	const UNIVERS_PROPOSES = $derived(univers.filter((u) => !u.systeme));

	/**
	 * LES POSITIONS DU GEL, RENDUES TELLES QUELLES.
	 *
	 * Relevées sur `mockups/V-19-cartographie.html` servie par le banc, fenêtre
	 * 1440 × 900, horloge et animations dans les conditions de capture du banc
	 * (`conditions.mjs`). Identiques aux six états : le périmètre ne
	 * change pas, et `disposer()` est déterministe — « deux chargements du même
	 * périmètre donnent exactement la même carte, ce qui est indispensable pour
	 * s'y repérer d'une session à l'autre » (`V-19:2561`).
	 *
	 * (Le chemin complet du module du banc n'est volontairement PAS cité :
	 * depuis T-070 cette vue est servie par une route réelle, donc BÂTIE, et
	 * `verif:demo:hors-production` cherche cette chaîne en texte brut dans le
	 * produit construit — commentaires compris. Écart É-2 du lot T-070.)
	 *
	 * Ce ne sont PAS des données du produit : c'est le calque d'une fabrique du
	 * gel, au sens d'`ECART-020` É-3, pour une fabrique dont le recalcul serait
	 * du comportement.
	 */
	const POSITIONS: ReadonlyMap<string, { x: number; y: number }> = new Map([
		['n-restaurer-pg', { x: 653.9707053327447, y: 287.8897930291837 }],
		['n-pra-bases', { x: 746.015606048004, y: 440.3884825858544 }],
		['n-diag-barman', { x: 617.1812656350542, y: 528 }],
		['n-pg-prod-01', { x: 562.126287623757, y: 430.4864853369219 }],
		['n-astreinte', { x: 474.01178797747997, y: 333.89436941071835 }],
		['n-planifier-sauv', { x: 457.21359176101754, y: 506.0945035089283 }],
		['n-facturation', { x: 399.6943720898564, y: 365.64884777819327 }],
		['n-sondes', { x: 253.98439395199608, y: 315.41530517325054 }],
		['n-pg-prod-02', { x: 439.57537256166, y: 264.40143563903223 }],
		['n-bkp-01', { x: 572.5308841941778, y: 336.0045892643791 }],
		['n-srv-app-01', { x: 377.0513136222336, y: 223.1045102791675 }],
		['n-referentiel', { x: 536.965204126182, y: 260.58050171416744 }],
		['n-portail-rh', { x: 336.81213476414524, y: 92 }],
		['n-presta-reseau', { x: 467.0257166408093, y: 109.80990187225255 }],
		['n-coffre-hors-site', { x: 699.7140383094593, y: 177.75306505034592 }],
		['n-passerelle-edi', { x: 523.882106263361, y: 176.5086362476089 }]
	]);

	const ORIGINE = { x: 0, y: 0 };
	const positionDe = (id: string): { x: number; y: number } => POSITIONS.get(id) ?? ORIGINE;
	const degreDe = (id: string): number => deg.get(id) ?? 0;

	/** Le rayon d'un nœud : proportionnel à ses connexions, plafonné à huit. */
	const rayon = (id: string): number => 15 + Math.min(degreDe(id), 8) * 2.6;

	/** Le nom porté sous le nœud, tronqué au-delà de 26 caractères. */
	const nomCourt = (titre: string): string =>
		titre.length > 26 ? `${titre.slice(0, 25)}…` : titre;

	/** Le nom accessible d'un nœud : titre, type, connexions, rupture. */
	const libelleDuNoeud = (id: string, note: Note): string =>
		`${note.titre}, ${typeDe(note).nom}, ${degreDe(id)} connexions` +
		(ruptures.has(id) ? ', point de rupture' : '');

	/** La ligne d'alternative textuelle d'un nœud, sans ses relations. */
	const ligneAlternative = (id: string, note: Note): string =>
		` — ${typeDe(note).nom}, ${note.domaine}, ${degreDe(id)} connexions` +
		(ruptures.has(id) ? ', point de rupture' : '') +
		'.';

	/* ── L'avancement du calcul de disposition ──────────────────────────────
	   Le gel remplit la jauge par pas de 7 % toutes les 90 ms (`V-19:3008`). Le
	   banc règle la planche à t = AVANCE_CHARGEMENT_MS, puis avance de
	   AVANCE_ETAT_MS : onze pas sont dus, la jauge est à 77 %. C'est un état
	   figé, jamais une animation — ARB-011. */
	const AVANCEMENT = 77;

	/** Les cinq clés de lecture du graphe, dans l'ordre du gel. */
	const CLES_DE_LECTURE: readonly (readonly [string, string])[] = [
		['Taille du nœud', 'proportionnelle au nombre de connexions'],
		['Anneau interrompu et fanion', 'point de rupture : son retrait isole une partie du périmètre'],
		['Contour pointillé, teinte pâle', 'nœud hors périmètre mais relié'],
		['Trait plein', 'dépendance technique'],
		['Trait pointillé', 'lien documentaire']
	];

	/** Le voile ne porte `data-actif` que si le gel l'a écrit sur cet état. */
	const voileActif = $derived(
		cas === 'chargement' || cas === 'vide' ? 'oui' : cas === 'dense' ? 'non' : undefined
	);
</script>

<!--
	Le contour d'un nœud — le calque de `forme()` du gel. La couleur est un
	attribut de présentation SVG du gel, jamais une déclaration de style.
-->
{#snippet contour(f: Contour, couleur: string)}{#if f.balise === 'circle'}<circle
			r={f.r}
			class="noeud__forme"
			fill={couleur}
			stroke="#fff"
		/>{:else if f.balise === 'rect'}<rect
			x={f.x}
			y={f.y}
			width={f.largeur}
			height={f.hauteur}
			rx={f.rx}
			class="noeud__forme"
			fill={couleur}
			stroke="#fff"
		/>{:else if f.balise === 'polygon'}<polygon
			points={f.points}
			class="noeud__forme"
			fill={couleur}
			stroke="#fff"
		/>{:else}<path d={f.d} class="noeud__forme" fill={couleur} stroke="#fff" />{/if}{/snippet}

<!-- La miniature de type de la légende : le même contour, au rayon 9. -->
{#snippet miniature(t: EncodageDeType)}<svg
		width="26"
		height="26"
		viewBox="-13 -13 26 26"
		class="lg__forme"
		>{@render contour(contourDeForme(t, 9), t.couleur)}<text
			class="noeud__code"
			style="font-size:6px">{t.code}</text
		></svg
	>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="carto"
	cibleEvitement="liste-noeuds"
	libelleEvitement="Aller à la liste des nœuds"
	fil={['Accueil', 'Cartographie']}
	donnees={{ 'data-dense': cas === 'dense' ? 'oui' : 'non', 'data-detail': 'ferme' }}
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
		<!-- ---------- Barre de contrôle ---------- -->
		<div class="controles">
			<div class="controles__groupe">
				<label class="etiq" for="perimetre">Périmètre</label>
				<select id="perimetre"
					>{#each UNIVERS_PROPOSES as u (u.nom)}<option value="univers|{u.nom}"
							>Univers {u.nom}</option
						>{/each}{#each domaines as d (d.nom)}<option value="domaine|{d.nom}"
							>Domaine {d.nom}</option
						>{/each}</select
				>
			</div>

			<div class="bascule-vue" role="tablist" aria-label="Mode de cartographie">
				<button role="tab" aria-selected="true" data-vue="complete">Vue complète</button>
				<button role="tab" aria-selected="false" data-vue="maitre">Par type maître</button>
			</div>

			<div class="rech-graphe" id="rech-graphe">
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
				>
				<input
					type="search"
					id="rech"
					placeholder="Aller à un nœud…"
					autocomplete="off"
					aria-label="Chercher un nœud dans le graphe"
				/>
				<div class="rech-graphe__liste" id="rech-liste" role="listbox"></div>
			</div>

			<label class="case" style="gap:var(--e-2)">
				<input type="checkbox" id="c-criticite" checked />
				<span class="case__txt">Afficher la criticité</span>
			</label>

			<div style="margin-left:auto;display:flex;gap:var(--e-2)">
				<button class="btn" id="effacer-sel" disabled>Effacer la sélection</button>
				<button class="btn" id="recentrer">Recentrer</button>
			</div>
		</div>

		<div class="scene">
			<!-- ---------- Légende ---------- -->
			<aside class="legende-col" aria-label="Légende">
				<div class="legende__bloc">
					<span class="etiq">Types présents</span>
					<div id="legende-types" style="margin-top:var(--e-2)">
						{#each types as t (t.cle)}<button class="lg" type="button" data-isole="non"
								>{@render miniature(t.type)}<span class="lg__nom">{t.type.nom}</span><span
									class="lg__n">{t.n}</span
								></button
							>{/each}
					</div>
					<p class="legende__note">
						Cliquer un type isole ses nœuds. La forme et le code portent le type ; la couleur ne
						fait que les répéter.
					</p>
				</div>

				<div class="legende__bloc">
					<span class="etiq">Lecture du graphe</span>
					<div id="legende-cles" style="margin-top:var(--e-2)">
						{#each CLES_DE_LECTURE as cle (cle[0])}<div
								style="font-size:var(--t-mini);line-height:1.45;margin-bottom:var(--e-2)"
							>
								<b style="display:block;color:var(--c-encre);font-weight:var(--g-fort)">{cle[0]}</b
								><span style="color:var(--c-encre-3)">{cle[1]}</span>
							</div>{/each}
					</div>
				</div>

				<details class="alt-texte" id="liste-noeuds">
					<summary>Liste des nœuds et de leurs relations</summary>
					<ul id="alt-liste">
						{#each graphe.noeuds as n (n.id)}<li>
								<b>{n.note.titre}</b>{ligneAlternative(
									n.id,
									n.note
								)}{#each relationsDe(n.id, relations) as r, rang (rang)}<div
										style="color:var(--c-encre-2)"
									>
										{`${typesRelation[r.type][r.sortant ? 'sortant' : 'entrant']} : ${titreDe(graphe, corpus, r.autre)}`}
									</div>{/each}
							</li>{/each}
					</ul>
				</details>
			</aside>

			<!-- ---------- Graphe ---------- -->
			<div class="zone-graphe" id="zone-graphe">
				<svg
					id="graphe"
					class="graphe"
					data-focus="non"
					data-isole="non"
					data-criticite="oui"
					role="img"
					aria-label="Graphe des dépendances du périmètre. Une liste équivalente est disponible dans la légende."
					viewBox="0 0 1000 620"
					><g id="racine" transform="translate(0,0) scale(1)"
						><g
							>{#each graphe.aretes as r, rang (rang)}<line
									class="arete"
									x1={positionDe(r.de).x}
									y1={positionDe(r.de).y}
									x2={positionDe(r.vers).x}
									y2={positionDe(r.vers).y}
									data-de={r.de}
									data-vers={r.vers}
									data-actif="non"
									data-technique={estTechnique(r.type, relationsTechniques) ? 'oui' : 'non'}
									><title
										>{`${titreDe(graphe, corpus, r.de)} ${typesRelation[r.type].sortant} ${titreDe(graphe, corpus, r.vers)}`}</title
									></line
								>{/each}</g
						><g
							>{#each graphe.noeuds as n (n.id)}{@const ray = rayon(n.id)}<g
									class="noeud"
									transform="translate({positionDe(n.id).x},{positionDe(n.id).y})"
									data-id={n.id}
									data-fantome={n.fantome ? 'oui' : 'non'}
									data-actif="non"
									data-type-visible="oui"
									data-choisi="non"
									tabindex="0"
									role="button"
									aria-label={libelleDuNoeud(n.id, n.note)}
									>{@render contour(
										contourDeForme(typeDe(n.note), ray),
										typeDe(n.note).couleur
									)}{#if ruptures.has(n.id)}<circle class="rupture-anneau" r={ray + 7} /><circle
											class="rupture-fanion"
											cx={ray * 0.78}
											cy={-ray * 0.9}
											r="7.5"
										/><text class="rupture-glyphe" x={ray * 0.78} y={-ray * 0.9}>!</text>{/if}<text
										class="noeud__code">{typeDe(n.note).code}</text
									><text class="noeud__nom" y={ray + 16}>{nomCourt(n.note.titre)}</text></g
								>{/each}</g
						></g
					></svg
				>

				<div class="dense-bandeau">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						style="flex:none"><path d="M8 5.5v3.5M8 11.2v.3" /><circle cx="8" cy="8" r="6" /></svg
					>
					<span style="flex:1"
						>Ce périmètre compte trop de nœuds pour être lu d'un seul coup. Réduisez-le, ou partez
						d'une famille d'objets.</span
					>
					<button class="btn" id="dense-reduire">Réduire le périmètre</button>
					<button class="btn btn--principal" id="dense-maitre">Passer en vue par type maître</button
					>
				</div>

				<div class="outils-graphe">
					<button type="button" id="zoom-plus" aria-label="Agrandir" title="Agrandir">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M8 3.5v9M3.5 8h9" /></svg
						>
					</button>
					<button type="button" id="zoom-moins" aria-label="Réduire" title="Réduire">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M3.5 8h9" /></svg
						>
					</button>
					<button
						type="button"
						id="ajuster"
						aria-label="Recentrer sur l'ensemble"
						title="Recentrer sur l'ensemble"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M2 5.5V2.5h3M14 5.5V2.5h-3M2 10.5v3h3M14 10.5v3h-3" /></svg
						>
					</button>
				</div>

				<div class="voile" id="voile" data-actif={voileActif}>
					<div class="voile__boite" id="voile-boite">
						{#if cas === 'chargement'}<div>
								<h2>Calcul de la disposition</h2>
								<p>
									Les nœuds cherchent leur place. Le calcul se fait une fois : la carte sera ensuite
									stable, et identique à chaque ouverture du même périmètre.
								</p>
								<div class="progression"><i style="width:{AVANCEMENT}%"></i></div>
							</div>{:else if cas === 'vide'}<div>
								<h2>Aucune relation dans ce périmètre</h2>
								<p>
									La cartographie n'a pas de données propres : elle se nourrit des relations
									déclarées sur les notes. Ouvrez une {motFicheMinuscule} et ajoutez-y une relation —
									« héberge », « dépend de », « sauvegarde » — pour voir le graphe apparaître.
								</p>
								<div class="voile__actions">
									<button class="btn btn--principal">Comment déclarer une relation</button>
								</div>
							</div>{/if}
					</div>
				</div>
			</div>

			<!-- ---------- Détail ---------- -->
			<aside class="detail-col" id="detail" aria-label="Détail du nœud sélectionné">
				<div class="detail__vide">
					<span class="etiq">Aucun nœud sélectionné</span>
					<p>
						Cliquez un nœud pour isoler son voisinage. La mise en avant reste en place jusqu'au
						prochain clic : elle sert à analyser, pas à survoler.
					</p>
				</div>
			</aside>
		</div>
	{/snippet}
</Coquille>
