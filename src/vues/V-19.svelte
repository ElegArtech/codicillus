<script lang="ts">
	/**
	 * V-19 — Cartographie. Route `/cartographie` (`docs/routes.md` §3), atteinte
	 * par l'entrée de rail « Outils › Cartographie ».
	 *
	 * AUCUNE DONNÉE PROPRE (`RG-M09-01`), ET PLUS AUCUN DÉFAUT TIRÉ DU JEU : les
	 * trois tableaux du graphe étaient optionnels, de défaut la constante de
	 * `seeds/corpus.ts`, et une route qui les oubliait dessinait le graphe du jeu
	 * de démonstration. Aucun identifiant, aucun libellé, aucun compteur n'est
	 * écrit ici.
	 *
	 * LE RENDU EST DU SVG DANS LE DOM, jamais un canevas ni WebGL (`ADR-008`).
	 * Chaque nœud est un `<g role="button" tabindex="0">` porteur de son nom
	 * accessible, et `details#liste-noeuds` restitue le même contenu en texte.
	 *
	 * AUCUNE DISPOSITION N'EST ÉCRITE ICI. La vue portait une table de seize
	 * positions relevées sur le gel, INDEXÉE PAR SEIZE IDENTIFIANTS DE NOTES DU JEU
	 * DE DÉMONSTRATION : le jeu descendait dans le produit par la géométrie.
	 * `disposer()` de `$lib/graphe/cartographie` place tous les corpus de la même
	 * façon, et elle est déterministe.
	 *
	 * LE SÉLECTEUR DE PÉRIMÈTRE OFFRE « TOUS LES DOMAINES », ET IL LE DOIT : le gel
	 * l'écrit (`V-19:3072`) mais le conditionne à `data-role="admin"`, si bien que
	 * l'option manquait alors que le défaut du périmètre EST `global|` — le contrôle
	 * s'ouvrait sans valeur au-dessus d'une carte qui montrait tout. Elle est rendue
	 * SANS GARDE DE RÔLE : `RG-M09-02` veut le périmètre RABATTU, jamais un refus, et
	 * la carte globale d'un référent est déjà celle de ce qu'il a le droit de voir.
	 *
	 * `.noeud` EST ICI UN NŒUD DE GRAPHE (`docs/DESIGN.md` §2.H) : le même nom de
	 * classe désigne un nœud d'ARBORESCENCE dans 33 autres vues, dont le rail de
	 * cette page même. Les deux règles sont inconciliables et AUCUNE FACTORISATION
	 * N'EST PERMISE — `.noeud__nom` compris. Le panneau de détail n'est pas
	 * factorisé avec V-20 pour la même raison de styles en ligne.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (`ARB-011`) : la jauge de « Calcul en
	 * cours » est un INSTANT, jamais un film.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-19.css`.
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
	import {
		CLE_IDENTITE,
		type CompteAffiche,
		type IdentiteDeCoquille
	} from '$lib/coquille/identite';
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
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
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { formaterDateHeureFr, formaterDateIso } from '$lib/dates';
	import type { FamillesSemantiques } from '$lib/graphe/familles';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	/**
	 * LES CINQ SOURCES DU GRAPHE SONT EXIGÉES, ET C'EST LE LEVIER : optionnelles,
	 * leur défaut était la constante de `seeds/corpus.ts`, et seule l'ouverture de
	 * l'écran sur une base vide le révélait.
	 *
	 * `compte` reste OPTIONNELLE, avec un ÉTAT VIDE pour défaut : aucune route ne la
	 * passe, et le contexte de coquille porte l'identité réelle.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		/** L'utilisateur courant. Absente, un compte VIDE — rien n'est inventé. */
		compte?: CompteAffiche | null;
		/** Les relations du corpus. La vue n'en fabrique aucune : elle les descend au
		    socle commun des cartographies, qui en dérive le sous-graphe. */
		relations: readonly Relation[];
		typesRelation: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		relationsTechniques: readonly CleDeTypeDeRelation[];
		/**
		 * LE PÉRIMÈTRE DEMANDÉ PAR L'ADRESSE — `?perimetre=`, sous la forme même du
		 * sélecteur du gel : `type|nom`. `RG-M09-05` veut l'état de cartographie
		 * partageable, quand le gel garde son périmètre dans une clôture
		 * (`V-19:3089`).
		 *
		 * ABSENTE, C'EST TOUT LE CORPUS. Le gel ouvrait sur un univers du jeu de
		 * démonstration : la carte s'ouvrait vide, sous un voile qui accusait le
		 * périmètre d'être sans relation là où il n'existait pas.
		 */
		perimetreDemande?: string | undefined;
		/**
		 * LES FAMILLES SÉMANTIQUES DU PÉRIMÈTRE ET LA DATE DE LEUR CALCUL —
		 * `RG-M09-06`. EXIGÉE : les deux routes de cartographie la passent, et le
		 * compilateur garde la porte. Le calcul se fait au chargeur, sur les notes
		 * lisibles ; la vue n'en refait aucun bout — elle ne saurait pas dire de
		 * quand date ce qu'elle recalculerait.
		 */
		familles: FamillesSemantiques;
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
		perimetreDemande,
		familles
	}: Proprietes = $props();

	/** Aucune identité servie : un compte VIDE, jamais celui du jeu de démonstration. */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;
	const compteRendu = $derived(compte ?? COMPTE_VIDE);

	const reglage = $derived(vecteur ?? {});
	const cas = $derived(String(reglage['etat'] ?? 'nominal'));

	/* Le périmètre d'ouverture est TOUT LE CORPUS, comme en V-20. Le gel ouvrait sur
	   un univers du jeu de démonstration : hors du jeu, la carte s'ouvrait sur zéro
	   nœud. Le sélecteur pose l'option globale, que le gel dessine (`V-19:3072`) ;
	   sans elle, `selectedIndex` valait -1 au-dessus d'une carte qui montrait tout. */
	const PERIMETRE_DE_PLANCHE = 'global|';

	/**
	 * LE PÉRIMÈTRE EFFECTIF — la valeur du sélecteur, découpée. Une valeur sans
	 * barre verticale, ou d'un type inconnu, retombe sur celle de la planche : un
	 * périmètre inventé montrerait un graphe vide sans jamais dire pourquoi.
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
	 * LES UNIVERS DU SÉLECTEUR DE PÉRIMÈTRE — sans l'univers SYSTÈME, destination
	 * de repli d'un domaine qui perd son rattachement : aucun domaine n'y est
	 * rattaché, et l'offrir proposerait un choix qui ne rend rien. Le filtre est
	 * celui du gel (`V-19:1710`), pas une décision.
	 */
	const UNIVERS_PROPOSES = $derived(univers.filter((u) => !u.systeme));

	/**
	 * LES PLACES DES NŒUDS — CALCULÉES POUR TOUT CORPUS, ET POUR AUCUN EN
	 * PARTICULIER. La vue portait une table de seize positions du gel, indexée par
	 * les identifiants de seize notes du JEU DE DÉMONSTRATION.
	 *
	 * `disposer()` est le calque de la fabrique du gel et elle est DÉTERMINISTE :
	 * « deux chargements du même périmètre donnent exactement la même carte »
	 * (`V-19:2561`). Aucun tirage, aucune horloge — ce n'est pas un comportement.
	 */
	const places = $derived(disposer(graphe));

	const ORIGINE = { x: 0, y: 0 };
	const positionDe = (id: string): { x: number; y: number } => places.get(id) ?? ORIGINE;
	const degreDe = (id: string): number => deg.get(id) ?? 0;

	const rayon = (id: string): number => 15 + Math.min(degreDe(id), 8) * 2.6;

	const nomCourt = (titre: string): string =>
		titre.length > 26 ? `${titre.slice(0, 25)}…` : titre;

	const libelleDuNoeud = (id: string, note: Note): string =>
		`${note.titre}, ${typeDe(note).nom}, ${degreDe(id)} ${accord(degreDe(id), 'connexion')}` +
		(ruptures.has(id) ? ', point de rupture' : '');

	const ligneAlternative = (id: string, note: Note): string => {
		const famille = familleParNote.get(id);
		return (
			` — ${typeDe(note).nom}, ${note.domaine}, ${degreDe(id)} ${accord(degreDe(id), 'connexion')}` +
			(ruptures.has(id) ? ', point de rupture' : '') +
			(famille === undefined ? ', aucune famille sémantique' : `, famille sémantique ${famille}`) +
			'.'
		);
	};

	/* L'avancement du calcul de disposition : le gel remplit la jauge par pas de
	   7 % toutes les 90 ms (`V-19:3008`), et onze pas sont dus au moment mesuré.
	   C'est un état figé, jamais une animation. */
	const AVANCEMENT = 77;

	/* ── LES FAMILLES SÉMANTIQUES — `RG-M09-06` ────────────────────────────────
	   « Regroupement des notes par proximité de sens, INDÉPENDAMMENT des relations
	   déclarées » (M09.6). Elles ne se lisent donc pas sur `graphe` : une famille
	   réunit des notes que le dessin ne relie pas, et peut nommer une note qu'aucune
	   arête ne touche — donc absente du dessin. C'est tout l'intérêt du regroupement,
	   et la légende le dit en toutes lettres.

	   LA DATE VIENT DU CHARGEUR, JAMAIS D'ICI. Une horloge lue dans la vue daterait
	   l'affichage, pas le calcul : `RG-M09-06` demande la seconde. */

	/**
	 * LA FAMILLE DE CHAQUE NOTE. La légende donne les familles ; la liste des nœuds
	 * dit, note par note, laquelle. LA LÉGENDE NE CITE AUCUN TITRE : la colonne est
	 * étroite, et les titres sont déjà écrits une fois, dans la liste équivalente.
	 */
	const familleParNote = $derived(
		new Map<string, string>(
			familles.familles.flatMap((f) => f.membres.map((membre) => [membre, f.nom] as const))
		)
	);

	/**
	 * LA DATE DU CALCUL, EN TOUTES LETTRES. Une chaîne vide vaut « pas de calcul » —
	 * il n'y a alors rien à dater, et la formater lèverait.
	 */
	const dateDeCalcul = $derived(
		familles.calculeLe === '' ? null : formaterDateHeureFr(familles.calculeLe)
	);
	const dateDeCalculMachine = $derived(
		familles.calculeLe === '' ? null : formaterDateIso(familles.calculeLe)
	);

	/**
	 * CE QUE LA LÉGENDE DIT DU REGROUPEMENT, ESPACE FINAL COMPRIS. La phrase est
	 * portée par une EXPRESSION et non par du texte de balisage : Svelte élague les
	 * blancs en bord d'élément, et la mention de date qui la suit se collerait au
	 * point de la phrase précédente.
	 */
	const mentionDesFamilles = $derived(
		(familles.familles.length > 0 && familles.sansFamille > 0
			? `${familles.sansFamille} ${accord(familles.sansFamille, 'note')} hors famille. `
			: '') +
			'Regroupement par proximité de sens — étiquettes, dossier, mots des titres —, ' +
			"indépendant des relations déclarées : une famille peut réunir des notes qu'aucune arête ne relie. "
	);

	/** Les cinq clés de lecture du graphe, dans l'ordre du gel. */
	const CLES_DE_LECTURE: readonly (readonly [string, string])[] = [
		['Taille du nœud', 'proportionnelle au nombre de connexions'],
		['Anneau interrompu et fanion', 'point de rupture : son retrait isole une partie du périmètre'],
		['Contour pointillé, teinte pâle', 'nœud hors périmètre mais relié'],
		['Trait plein', 'dépendance technique'],
		['Trait pointillé', 'lien documentaire']
	];

	/* CE QUI MANQUE, ET LE GESTE QUI DÉBLOQUE. Le voile n'avait qu'une phrase pour
	   un graphe vide — « Ouvrez une fiche et ajoutez-y une relation » —, FAUSSE sur
	   l'instance neuve : il n'y a ni fiche à ouvrir, ni domaine où la ranger, et le
	   seul bouton offert sortait désactivé, sans motif. */
	type Manque = 'univers' | 'domaine' | 'note' | 'relation' | 'perimetre';

	/**
	 * L'IDENTITÉ RÉELLE, POUR SAVOIR À QUI ON PARLE : la console n'est ouverte qu'à
	 * l'administrateur, et ne lui promettre l'adresse qu'à lui est ce qui distingue
	 * une issue d'une impasse.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const administrateur = $derived(identite?.administrateur ?? false);

	const manque = $derived.by<Manque | null>(() => {
		if (UNIVERS_PROPOSES.length === 0) return 'univers';
		if (domaines.length === 0) return 'domaine';
		if (corpus.length === 0) return 'note';
		if (graphe.noeuds.length > 0) return null;
		/* Le graphe est vide. Des relations existent-elles ailleurs dans le
		   corpus lisible ? Si oui, c'est le PÉRIMÈTRE qui n'en porte pas ; sinon,
		   c'est le corpus entier qui n'a encore aucune relation. */
		return relations.length === 0 ? 'relation' : 'perimetre';
	});

	/** Le voile ne porte `data-actif` que si le gel l'a écrit sur cet état. */
	const voileActif = $derived(
		cas === 'chargement' || manque !== null ? 'oui' : cas === 'dense' ? 'non' : undefined
	);
</script>

<!--
	Le contour d'un nœud — le calque de `forme()` du gel. La couleur est un attribut
	de présentation SVG du gel, jamais une déclaration de style.
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
					<span class="etiq">Familles sémantiques</span>
					<div id="legende-familles" style="margin-top:var(--e-2)">
						{#each familles.familles as f (f.cle)}<div
								style="font-size:var(--t-mini);line-height:1.45;margin-bottom:var(--e-2)"
							>
								<b style="display:block;color:var(--c-encre);font-weight:var(--g-fort)"
									>{f.nom + ' · ' + f.membres.length + ' ' + accord(f.membres.length, 'note')}</b
								><span style="color:var(--c-encre-3)">{f.origine}</span>
							</div>{:else}<p
								style="font-size:var(--t-mini);line-height:1.45;color:var(--c-encre-3)"
							>
								{familles.notesExaminees === 0
									? 'Aucune note dans ce périmètre : il n’y a rien à regrouper.'
									: `Aucune famille : ces ${familles.notesExaminees} ${accord(familles.notesExaminees, 'note')} ne partagent ni étiquette, ni dossier, ni mot de titre. Posez une même étiquette sur deux notes pour en former une.`}
							</p>{/each}
					</div>
					<p class="legende__note">
						{mentionDesFamilles}{#if dateDeCalcul !== null && dateDeCalculMachine !== null}<time
								datetime={dateDeCalculMachine}>{'Calculé le ' + dateDeCalcul + '.'}</time
							>{/if}
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
							</div>{:else if manque === 'univers'}<div>
								<h2>Aucun univers sur cette instance</h2>
								<p>
									La cartographie n'a pas de données propres : elle se nourrit des notes et des
									relations du corpus, et cette instance n'a encore nulle part où les ranger.{administrateur
										? ' Créez un univers, puis un domaine, dans la console — /console/univers.'
										: " Demandez à un administrateur d'en créer un."}
								</p>
								<div class="voile__actions">
									{#if administrateur}<a
											class="btn btn--principal"
											href={resolve('/console/univers')}>Créer un univers</a
										>{/if}
								</div>
							</div>{:else if manque === 'domaine'}<div>
								<h2>Aucun domaine lisible</h2>
								<p>
									Une note se range dans un dossier, et un dossier dans un domaine : sans domaine,
									le corpus ne peut rien porter.{administrateur
										? ' Créez un domaine dans la console — /console/domaines.'
										: " Demandez à un administrateur l'accès à un domaine."}
								</p>
								<div class="voile__actions">
									{#if administrateur}<a
											class="btn btn--principal"
											href={resolve('/console/domaines')}>Créer un domaine</a
										>{/if}
								</div>
							</div>{:else if manque === 'note'}<div>
								<h2>Aucune note à cartographier</h2>
								<p>
									Le rangement est en place, le corpus est vide : il n'y a aucun nœud à dessiner.
									Créez une première note — /notes/nouvelle —, puis une seconde, et reliez-les.
								</p>
								<div class="voile__actions">
									<a class="btn btn--principal si-ecriture" href={resolve('/notes/nouvelle')}
										>Créer une note</a
									>
								</div>
							</div>{:else if manque === 'relation'}<div>
								<h2>Aucune relation dans le corpus</h2>
								<p>
									La cartographie n'a pas de données propres : elle se nourrit des relations
									déclarées sur les notes. Ouvrez une {motFicheMinuscule} et ajoutez-y une relation —
									« héberge », « dépend de », « sauvegarde » — pour voir le graphe apparaître.
								</p>
								<div class="voile__actions">
									<button class="btn btn--principal">Comment déclarer une relation</button>
								</div>
							</div>{:else if manque === 'perimetre'}<div>
								<h2>Aucune relation dans ce périmètre</h2>
								<p>
									Le corpus porte des relations, mais aucune ne touche le périmètre choisi. Revenez
									à tous les domaines, ou choisissez-en un autre dans le sélecteur ci-dessus.
								</p>
								<div class="voile__actions">
									<a class="btn btn--principal" href={resolve('/cartographie')}
										>Voir tous les domaines</a
									>
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
