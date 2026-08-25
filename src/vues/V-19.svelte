<script lang="ts">
	/**
	 * V-19 — Cartographie. Route `/cartographie` (`docs/routes.md` §3),
	 * atteinte par l'entrée de rail « Outils › Cartographie ».
	 *
	 * LA CARTOGRAPHIE N'A AUCUNE DONNÉE PROPRE (`RG-M09-01`), ET PLUS AUCUN
	 * DÉFAUT TIRÉ DU JEU. Les trois tableaux du graphe — relations, types de
	 * relation, types techniques — étaient des propriétés OPTIONNELLES dont le
	 * défaut était la constante de `seeds/corpus.ts` : une route qui les oubliait
	 * dessinait le graphe du jeu de démonstration sans que rien ne proteste. Ils
	 * sont désormais EXIGÉS, comme les univers et les domaines ; la route les sert
	 * tous les cinq depuis la base, et une route qui en oublierait un NE
	 * COMPILERAIT PLUS. Aucun identifiant, aucun libellé, aucun compteur n'est
	 * écrit ici. Ce lot NE DÉCLARE PAS `RG-M09-01` tenue : la règle porte sur le
	 * module entier, pas sur une vue.
	 *
	 * LE RENDU EST DU SVG DANS LE DOM, jamais un canevas ni WebGL (ADR-008,
	 * `STACK §4.4`). Chaque nœud est un `<g role="button" tabindex="0">` porteur
	 * de son nom accessible, et `details#liste-noeuds` restitue le même contenu
	 * en texte — la matière de `RG-M18-11`, que ce lot NE DÉCLARE PAS TENUE : la
	 * batterie qui l'éprouve est `pnpm test:a11y`, hors périmètre.
	 *
	 * AUCUNE DISPOSITION N'EST ÉCRITE ICI. La vue portait une table de seize
	 * positions relevées sur la maquette gelée, INDEXÉE PAR SEIZE IDENTIFIANTS DE
	 * NOTES DU JEU DE DÉMONSTRATION : une instance qui charge ce jeu — et elle
	 * seule — recevait une disposition privilégiée que le corpus d'un client
	 * n'obtenait jamais. La table est partie ; `disposer()` de
	 * `$lib/graphe/cartographie` place TOUS les corpus de la même façon, et elle
	 * est déterministe — « deux chargements du même périmètre donnent exactement
	 * la même carte ». Le sous-graphe, les degrés et les points de rupture en
	 * viennent aussi.
	 *
	 * SIX ÉTATS — `verif/scenarios/V-19.json`. Deux axes, vecteur complet :
	 * profil × état. `etat-nominal` est déclaré `identiqueA` `role-admin`, et le
	 * relevé du gel en montre un TROISIÈME identique : `role-referent`.
	 *
	 * LE SÉLECTEUR DE PÉRIMÈTRE OFFRE « TOUS LES DOMAINES », ET IL LE DOIT.
	 * Le gel l'écrit — `o.value = "global|"` et `o.textContent = "Tous les
	 * domaines"` (`V-19:3072`) —, mais conditionnée à `data-role="admin"`, que les
	 * six états du banc ne rendaient jamais. L'option manquait donc, alors que le
	 * défaut du périmètre EST `global|` : le contrôle s'ouvrait sans valeur
	 * au-dessus d'une carte qui montrait tout, et rien ne ramenait au corpus
	 * entier une fois un domaine choisi. Elle est rendue SANS GARDE DE RÔLE, et
	 * c'est délibéré : le gel refusait le global au non-administrateur par un
	 * voile, le produit applique `RG-M09-02` — périmètre RABATTU, jamais refus.
	 * `ouvrirLAcces()` ne sert que les notes lisibles, et la carte globale d'un
	 * référent est déjà la carte de ce qu'il a le droit de voir.
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
	import type {
		CleDeTypeDeRelation,
		Domaine,
		LibellesDeRelation,
		Note,
		Relation,
		Univers
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import {
		contourDeForme,
		degres,
		disposer,
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
	import { vocabulaireRendu } from '$lib/vocabulaire';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	/**
	 * LES CINQ SOURCES DU GRAPHE SONT EXIGÉES, ET C'EST LE LEVIER.
	 *
	 * Elles étaient optionnelles, de défaut la constante de `seeds/corpus.ts` :
	 * une route qui en oubliait une servait le jeu de démonstration sans que
	 * rien ne proteste, et seule l'ouverture de l'écran sur une base vide le
	 * révélait. Exigées, elles sont gardées par le compilateur —
	 * `exactOptionalPropertyTypes` et `strict` sont actifs, `svelte-check` est
	 * dans `pnpm check` : la route qui en oublierait une ne bâtirait plus.
	 *
	 * `compte` reste OPTIONNELLE, avec un ÉTAT VIDE pour défaut : aucune route
	 * ne la passe, le contexte de coquille porte l'identité réelle, et un compte
	 * de démonstration en défaut serait une identité inventée. `instance` a
	 * disparu : elle ne servait qu'à donner sa version au pied du rail, que le
	 * contexte sert déjà depuis `package.json`.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — profil × état. */
		vecteur: Record<string, string | boolean> | null;
		/** Les notes du périmètre, telles que le chargeur les lit. */
		notes: readonly Note[];
		/** Les univers du produit, tels que la base les porte. */
		univers: readonly Univers[];
		/** Les domaines du produit, tels que la base les porte. */
		domaines: readonly Domaine[];
		/**
		 * L'utilisateur courant. Absente, un compte VIDE — le contexte de coquille
		 * porte l'identité réelle en application, et rien n'est inventé sans lui.
		 */
		compte?: CompteAffiche | null;
		/**
		 * Les relations du corpus, telles que la base les porte.
		 *
		 * La vue n'en fabrique aucune : elle les descend au socle commun des
		 * cartographies, qui en dérive le sous-graphe.
		 */
		relations: readonly Relation[];
		/** Les types de relation et leurs deux libellés, tels que la base les porte. */
		typesRelation: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		/** Les types de relation qui portent une dépendance technique. */
		relationsTechniques: readonly CleDeTypeDeRelation[];
		/**
		 * LE PÉRIMÈTRE DEMANDÉ PAR L'ADRESSE — `?perimetre=`, sous la forme même du
		 * sélecteur du gel : `type|nom`, où le type vaut `univers` ou `domaine`.
		 *
		 * `RG-M09-05` veut l'état de cartographie partageable ; le gel, lui, garde
		 * son périmètre dans une clôture (`charger()`, `V-19:3089`) et une carte
		 * réduite ne s'envoie donc pas à un collègue. Le chargeur — seul lecteur de
		 * `url` — l'extrait, et cette propriété est le chemin par lequel il
		 * atteint le graphe.
		 *
		 * ABSENTE, C'EST TOUT LE CORPUS. Le gel ouvrait sur « Univers Production »,
		 * un nom du jeu de démonstration que rien ne pose sur une instance réelle :
		 * la carte s'ouvrait vide, sous un voile qui accusait le périmètre d'être
		 * sans relation là où il n'existait pas. Les six états déclarés ne bougent
		 * pas d'un pixel — sur le jeu de semence, les vingt-deux relations touchent
		 * toutes l'univers Production, et le sous-graphe global est le même.
		 */
		perimetreDemande?: string | undefined;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte = null,
		relations,
		typesRelation,
		relationsTechniques,
		perimetreDemande
	}: Proprietes = $props();

	/**
	 * LE COMPTE RENDU QUAND AUCUNE IDENTITÉ N'EST SERVIE — un état VIDE, jamais
	 * un compte du jeu de démonstration. En application, le contexte de coquille
	 * l'emporte et cette valeur n'atteint aucun écran.
	 */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;
	const compteRendu = $derived(compte ?? COMPTE_VIDE);

	const reglage = $derived(vecteur ?? {});
	const cas = $derived(String(reglage['etat'] ?? 'nominal'));

	/* ── Le graphe ──────────────────────────────────────────────────────────
	   Le périmètre d'ouverture est TOUT LE CORPUS, comme en V-20 et en carte
	   mentale. Le gel ouvrait sur « Univers Production » — un univers du jeu de
	   démonstration : hors du jeu, la carte s'ouvrait sur zéro nœud. LE SÉLECTEUR
	   POSE L'OPTION GLOBALE, et le gel la dessine : `V-19:3072` écrit la valeur
	   `global|` et le libellé « Tous les domaines », les mêmes qu'en V-20. Sans
	   elle, `selectedIndex` valait -1 au-dessus d'une carte qui montrait tout,
	   et aucun choix ne ramenait au corpus entier. */
	const PERIMETRE_DE_PLANCHE = 'global|';

	/**
	 * LE PÉRIMÈTRE EFFECTIF — la valeur du sélecteur, découpée. Une valeur que
	 * l'adresse porterait sans barre verticale, ou avec un type inconnu, retombe
	 * sur celui de la planche : un périmètre inventé montrerait un graphe vide
	 * sans jamais dire pourquoi.
	 */
	const perimetre = $derived.by(() => {
		const brut = perimetreDemande ?? PERIMETRE_DE_PLANCHE;
		const barre = brut.indexOf('|');
		const type = barre < 0 ? brut : brut.slice(0, barre);
		const nom = barre < 0 ? '' : brut.slice(barre + 1);
		if ((type === 'univers' || type === 'domaine') && nom !== '') return { type, nom };
		return { type: 'global' };
	});

	const graphe = $derived(sousGraphe(corpus, perimetre, relations));
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
	 * LES PLACES DES NŒUDS — CALCULÉES POUR TOUT CORPUS, ET POUR AUCUN EN
	 * PARTICULIER.
	 *
	 * La vue portait ici une table de seize positions relevées sur la maquette
	 * gelée, indexée par les identifiants de seize notes du JEU DE
	 * DÉMONSTRATION. Une instance qui charge ce jeu recevait donc la disposition
	 * du gel, et le corpus d'un client n'y avait jamais droit : le jeu
	 * descendait dans le produit par la géométrie. `placesDuGraphe()`, qui
	 * arbitrait entre la table et le calcul, n'a plus rien à arbitrer et a
	 * disparu avec elle.
	 *
	 * `disposer()` est le calque de la fabrique du gel, transcrite constante par
	 * constante, et elle est DÉTERMINISTE : « deux chargements du même périmètre
	 * donnent exactement la même carte, ce qui est indispensable pour s'y
	 * repérer d'une session à l'autre » (`V-19:2561`). Aucun tirage, aucune
	 * horloge — ce n'est donc pas un comportement au sens d'ARB-011.
	 */
	const places = $derived(disposer(graphe));

	const ORIGINE = { x: 0, y: 0 };
	const positionDe = (id: string): { x: number; y: number } => places.get(id) ?? ORIGINE;
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
		nom: compteRendu.nom,
		initiales: compteRendu.initiales,
		role: compteRendu.role,
		domaine: compteRendu.domaine
	}}
	version=""
>
	{#snippet enfants()}
		<!-- ---------- Barre de contrôle ---------- -->
		<div class="controles">
			<div class="controles__groupe">
				<label class="etiq" for="perimetre">Périmètre</label>
				<select id="perimetre"
					><option value="global|">Tous les domaines</option
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
