<script lang="ts">
	/**
	 * V-20 — Cartographie par type maître. Route `/cartographie/par-type`. Aucune
	 * entrée de rail ne la vise : on y arrive par la bascule « Par type maître » de
	 * V-19.
	 *
	 * AUCUNE DONNÉE PROPRE (`RG-M09-01`), ET PLUS AUCUN DÉFAUT TIRÉ DU JEU : les
	 * quatre tables du graphe étaient optionnelles, de défaut la constante de
	 * `seeds/corpus.ts`. `TYPES_FICHE` était pire — importée au niveau du module,
	 * sans propriété : le panneau de détail rendait sous « Propriétés » les noms de
	 * champ du jeu et leurs valeurs d'EXEMPLE comme celles de la note choisie, et un
	 * type de fiche créé en console faisait LEVER `.slice()` au clic.
	 *
	 * CETTE VUE N'EMPRUNTE PAS `$lib/coquille/Coquille.svelte`, ET C'EST UN ÉCART
	 * DÉCLARÉ. `V-20:1101` pose `<nav class="fil" id="fil">` dans la barre et
	 * `V-20:1129` un `<div class="fil-deroule" id="fil" hidden>` dans la zone de
	 * graphe : DEUX ÉLÉMENTS PORTENT LE MÊME IDENTIFIANT, et `rendreFil()`
	 * (`V-20:2924`) écrit dans le PREMIER en ordre de document. `Coquille` reçoit
	 * `fil` comme une liste de segments et n'a ni `hidden`, ni bouton, ni
	 * `span.fil-deroule__courant` ; le gabarit est REGELÉ. La coquille est donc
	 * recomposée ici, MAIS `Rail.svelte` et `railAbregeRendu()` sont empruntés tels
	 * quels, et aucune règle de style n'est dupliquée.
	 *
	 * LES TROIS AXES VIENNENT DE L'ADRESSE ET SONT EXIGÉS : l'état de l'écran n'a
	 * plus de seconde source à laquelle retomber.
	 *
	 * AUCUNE DISPOSITION SIMULÉE (`ARB-011`) : « l'anneau et l'étoile sont calculés
	 * géométriquement, la place d'un nœud ne dépend que de son rang » (`V-20:2701`).
	 *
	 * `.noeud`, `.arete`, `.scene`, `.detail-col`, `.zone-graphe` SONT ICI DES
	 * CLASSES DE GRAPHE (`docs/DESIGN.md` §2.H) : `.noeud` désigne un nœud
	 * d'ARBORESCENCE dans 33 autres vues, dont le rail de cette page même. Les règles
	 * sont inconciliables et AUCUNE FACTORISATION N'EST PERMISE — le panneau de
	 * détail est écrit ici, et non partagé avec V-19, pour la même raison.
	 *
	 * Le témoin de fraîcheur passe par la fabrique unique `$lib/fraicheur`. Le style
	 * est dans `src/socle.css` et `src/vues/V-20.css`.
	 */
	import type {
		ChampDeFiche,
		CleDeTypeDeRelation,
		Domaine,
		LibellesDeRelation,
		Note,
		Relation
	} from '../../seeds/corpus';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import Rail from '$lib/coquille/Rail.svelte';
	import { railAbregeRendu, sectionsAbregeesDuCorpus } from '$lib/coquille/arborescence-abregee';
	import { sectionsDuRail } from '$lib/coquille/arborescence';
	import { accord, pluriel } from '$lib/vocabulaire';
	import {
		CLE_IDENTITE,
		type CompteAffiche,
		type IdentiteDeCoquille
	} from '$lib/coquille/identite';
	import {
		contourDeForme,
		degres,
		estTechnique,
		pointsArticulation,
		relationsDe,
		sousGraphe,
		titreDe,
		typeCarto,
		typeDe,
		typesPresents,
		type Contour,
		type EncodageDeType
	} from '$lib/graphe/cartographie';

	/**
	 * LES QUATRE SOURCES DU GRAPHE SONT EXIGÉES, ET C'EST LE LEVIER : optionnelles,
	 * leur défaut était la constante de `seeds/corpus.ts`.
	 *
	 * V-20 ne compose pas la coquille : elle monte le rail elle-même et n'a donc pas
	 * d'univers à recevoir — une propriété inerte serait une promesse sans effet.
	 * `domaines` et `compte` restent optionnelles, avec un ÉTAT VIDE.
	 */
	interface Proprietes {
		notes: readonly Note[];
		/** Les domaines du produit. Absente, aucun domaine — jamais ceux du jeu. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, un compte VIDE — jamais celui du jeu. */
		compte?: CompteAffiche | null;
		/** Les relations du corpus. La vue n'en fabrique aucune : elle les descend au
		    socle commun des cartographies, qui en dérive le sous-graphe. */
		relations: readonly Relation[];
		typesRelation: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		relationsTechniques: readonly CleDeTypeDeRelation[];
		/**
		 * LE RÉFÉRENTIEL DES TYPES DE FICHE — un schéma de champs par type. Exigé : il
		 * valait celui du jeu de semence. L'INDEX EST UNE CHAÎNE, et c'est le fait de la
		 * base : un type que le référentiel reçu ne porte pas est un cas ORDINAIRE — il
		 * se rend en état neutre, il ne lève pas.
		 */
		typesFiche: Record<string, readonly ChampDeFiche[]>;
		/**
		 * LES VALEURS DE PROPRIÉTÉ DE CHAQUE FICHE — par identifiant de note, puis par
		 * clé de champ. ABSENTE, la vue n'est pas branchée sur une base et le panneau
		 * reprend l'illustration du gel. SERVIE, elle est la seule source : ce que la
		 * note ne porte pas se rend en tiret, jamais en exemple.
		 */
		proprietesDeFiche?: Readonly<Record<string, Readonly<Record<string, string>>>>;
		/**
		 * LES TROIS AXES QUE L'ADRESSE PORTE — `RG-M09-05`, « état de cartographie
		 * partageable » — ET ILS SONT EXIGÉS. Le gel garde ses trois choix dans une
		 * clôture : une carte explorée ne s'envoie à personne. Facultatifs, la planche
		 * répondait à leur place et posait deux identifiants du jeu écrits en dur, qui
		 * partaient dans le paquet servi au navigateur.
		 */
		/** Le périmètre demandé — `type|nom`, la valeur même du sélecteur du gel. */
		perimetreDemande: string;
		typeMaitreDemande: string | null;
		centreDemande: string | null;
	}

	const {
		notes: corpus,
		domaines = [],
		compte = null,
		relations,
		typesRelation,
		relationsTechniques,
		typesFiche,
		proprietesDeFiche,
		perimetreDemande,
		typeMaitreDemande,
		centreDemande
	}: Proprietes = $props();

	/** Aucune identité servie : un compte VIDE, jamais celui du jeu de démonstration. */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;

	/**
	 * L'IDENTITÉ ET LE RANGEMENT RÉELS L'EMPORTENT — `$lib/coquille/identite.ts`
	 * porte le contrat. V-20 ne composant pas `Coquille.svelte`, elle était restée
	 * HORS de la réparation que la coquille a reçue : sur une base à zéro univers,
	 * l'avatar annonçait un nom du jeu et le sélecteur de périmètre proposait ses
	 * quatre domaines.
	 *
	 * LA PRÉSENCE DU CONTEXTE DÉCIDE, PAS SON CONTENU : une base vide n'est pas une
	 * base absente, elle se rend vide.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const domainesEffectifs = $derived(identite === undefined ? domaines : identite.domaines);
	const compteEffectif = $derived(identite?.compte ?? compte ?? COMPTE_VIDE);
	/* La version du pied de rail est celle du paquet, comme dans `Coquille.svelte`.
	   Une propriété `instance` la portait, et son défaut était le numéro du jeu :
	   V-20 câblant `Rail` en direct, elle l'annonçait comme un fait, seule de toutes
	   les pages. Hors application, la version est VIDE, jamais inventée. */
	const versionEffective = $derived(identite?.version ?? '');

	/** LE RAIL ABRÉGÉ SUIT LA BASE DÈS QU'ELLE EN A UNE — la copie exacte de ce que
	    `Coquille.svelte` fait pour les autres vues. V-20 ne déclare pas de propriété
	    `univers` : le contexte la porte, et une propriété de plus serait un second
	    chemin pour une seule vérité. */
	const sectionsAbregees = $derived(
		identite === undefined
			? railAbregeRendu([])
			: railAbregeRendu(
					[],
					sectionsAbregeesDuCorpus(sectionsDuRail(identite.univers, identite.domaines, corpus))
				)
	);

	/**
	 * LE PÉRIMÈTRE EFFECTIF — celui de l'adresse. Une valeur que le sélecteur ne
	 * reconnaît pas retombe sur « Tous les domaines », sa première option.
	 */
	const perimetre = $derived.by(() => {
		const brut = perimetreDemande;
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
	 * LA FAMILLE ET LE NŒUD VIENNENT DE L'ADRESSE, ET DE NULLE PART AILLEURS. Deux
	 * dérivations les posaient à la place du chargeur et nommaient deux notes du jeu
	 * de démonstration en dur.
	 */
	const typeMaitre = $derived(typeMaitreDemande);
	const centre = $derived(centreDemande);
	const choisi = $derived(centre);

	/* CE QUI MANQUE, ET LE GESTE QUI DÉBLOQUE. Le voile n'avait qu'une phrase —
	   « Sélectionnez un type dans la barre ci-dessus » —, et sur l'instance neuve
	   cette barre est VIDE : l'écran envoyait choisir dans un contrôle sans option.
	   Chaque manque a désormais sa phrase, et chacune nomme son adresse. */
	type Manque = 'domaine' | 'note' | 'relation' | 'perimetre' | 'famille';

	const administrateur = $derived(identite?.administrateur ?? false);

	const manque = $derived.by<Manque | null>(() => {
		if (domainesEffectifs.length === 0) return 'domaine';
		if (corpus.length === 0) return 'note';
		if (graphe.noeuds.length === 0) return relations.length === 0 ? 'relation' : 'perimetre';
		return typeMaitre === null ? 'famille' : null;
	});

	/**
	 * `data-detail` suit le nœud choisi : le panneau de détail EXISTE au balisage
	 * de cette vue, il a donc quelque chose à montrer dès qu'un nœud est déplié.
	 */
	const detailOuvert = $derived(choisi !== null);

	/* ── Les nœuds maîtres ──────────────────────────────────────────────────
	   Classés par titre, comparaison française — l'ordre décide de l'anneau. */
	const maitres = $derived(
		typeMaitre === null
			? []
			: graphe.noeuds
					.filter((n) => typeCarto(n.note) === typeMaitre)
					.map((n) => n.id)
					.sort((a, b) =>
						(graphe.index.get(a)?.note.titre ?? '').localeCompare(
							graphe.index.get(b)?.note.titre ?? '',
							'fr'
						)
					)
	);

	const degreDe = (id: string): number => deg.get(id) ?? 0;
	const noteDe = (id: string): Note | undefined => graphe.index.get(id)?.note;

	/* Disposition — déterministe, jamais simulée : le calque exact des deux
	   fabriques du gel, mêmes opérations, mêmes constantes. Rien n'est itéré. */
	const L = 1000;
	const H = 620;
	const CX = L / 2;
	const CY = H / 2;

	interface Point {
		readonly x: number;
		readonly y: number;
	}

	function positionsAnneau(ids: readonly string[]): [string, Point][] {
		const n = ids.length;
		const r = Math.min(238, 78 + n * 15);
		return ids.map((id, i) => {
			/* Un maître seul est au centre, jamais sur un anneau d'un seul point. */
			if (n === 1) return [id, { x: CX, y: CY }];
			const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
			return [id, { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r }];
		});
	}

	function positionsEtoile(idCentre: string, ids: readonly string[]): [string, Point][] {
		const n = ids.length;
		const r = Math.min(226, 128 + n * 9);
		return [
			[idCentre, { x: CX, y: CY }],
			...ids.map((id, i): [string, Point] => {
				const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
				return [id, { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * 0.86 }];
			})
		];
	}

	function voisinsDe(id: string): string[] {
		const v: string[] = [];
		for (const r of graphe.aretes) {
			if (r.de === id && !v.includes(r.vers)) v.push(r.vers);
			if (r.vers === id && !v.includes(r.de)) v.push(r.de);
		}
		return v.filter((x) => graphe.index.has(x));
	}

	type Role = 'centre' | 'voisin' | 'maitre';

	function rayon(id: string, role: Role): number {
		const base = 15 + Math.min(degreDe(id), 8) * 2.4;
		return role === 'centre' ? base * 1.28 : role === 'voisin' ? base * 0.86 : base;
	}

	const nomCourt = (titre: string): string =>
		titre.length > 24 ? `${titre.slice(0, 23)}…` : titre;

	interface NoeudPlace {
		readonly id: string;
		readonly p: Point;
		readonly role: Role;
	}
	interface AretePlacee {
		readonly a: Point;
		readonly b: Point;
		readonly technique: boolean;
		readonly titre: string;
	}

	const voisins = $derived(centre === null ? [] : voisinsDe(centre));

	const scene = $derived.by<{
		aretes: AretePlacee[];
		noeuds: NoeudPlace[];
		mentionSeule: number | null;
	}>(() => {
		if (typeMaitre === null || !maitres.length) {
			return { aretes: [], noeuds: [], mentionSeule: null };
		}

		/* Temps 1 : l'anneau seul, sans voisins ni arêtes. */
		if (centre === null) {
			const p = new Map(positionsAnneau(maitres));
			return {
				aretes: [],
				noeuds: maitres.map((id) => ({ id, p: p.get(id) ?? { x: 0, y: 0 }, role: 'maitre' })),
				mentionSeule: null
			};
		}

		/* Temps 2 : un voisinage déplié, à un seul saut. Les autres maîtres restent
		   visibles, repoussés sur un anneau extérieur : on ne perd pas la famille de
		   vue en explorant l'un de ses membres. */
		const autres = maitres.filter((id) => id !== centre && !voisins.includes(id));
		const pos = new Map<string, Point>([
			...positionsEtoile(centre, voisins),
			...autres.map((id, i): [string, Point] => {
				const a = -Math.PI / 2 + (i / Math.max(autres.length, 1)) * Math.PI * 2;
				return [id, { x: CX + Math.cos(a) * 400, y: CY + Math.sin(a) * 268 }];
			})
		]);

		const centrePoint = pos.get(centre) ?? { x: CX, y: CY };
		const aretes: AretePlacee[] = [];
		for (const r of graphe.aretes) {
			if (r.de !== centre && r.vers !== centre) continue;
			const autre = r.de === centre ? r.vers : r.de;
			const b = pos.get(autre);
			if (!b) continue;
			aretes.push({
				a: centrePoint,
				b,
				technique: estTechnique(r.type, relationsTechniques),
				titre: `${titreDe(graphe, corpus, r.de)} ${typesRelation[r.type].sortant} ${titreDe(graphe, corpus, r.vers)}`
			});
		}

		const noeuds: NoeudPlace[] = [
			{ id: centre, p: centrePoint, role: 'centre' },
			...voisins.map((id) => ({ id, p: pos.get(id) ?? { x: 0, y: 0 }, role: 'voisin' as Role })),
			...autres.map((id) => ({ id, p: pos.get(id) ?? { x: 0, y: 0 }, role: 'maitre' as Role }))
		];

		/* Nœud maître sans relation : affiché seul et centré, avec la mention. */
		return {
			aretes,
			noeuds,
			mentionSeule: voisins.length ? null : CY + rayon(centre, 'centre') + 40
		};
	});

	function libelleDuNoeud(id: string): string {
		const note = noteDe(id);
		if (!note) return id;
		return (
			`${note.titre}, ${typeDe(note).nom}, ${degreDe(id)} ${accord(degreDe(id), 'connexion')}` +
			(typeCarto(note) === typeMaitre ? ', nœud maître' : ', voisin') +
			(ruptures.has(id) ? ', point de rupture' : '')
		);
	}

	/** Le repli d'un nœud dont la note aurait disparu du graphe — jamais atteint. */
	const NOTE_ABSENTE = { titre: '', type: 'Note' } as unknown as Note;

	/* ── Le fil déroulé — écrit dans le fil d'Ariane, voir l'en-tête ─────── */
	const typeMaitreEncode = $derived<EncodageDeType | null>(
		typeMaitre === null ? null : (types.find((t) => t.cle === typeMaitre)?.type ?? null)
	);

	/* ── Le panneau de détail ───────────────────────────────────────────────
	   Les relations groupées par libellé, dans l'ordre où elles sont reçues — le
	   libellé dépend du sens de lecture, « héberge » ou « est hébergé par ». */
	interface GroupeDeRelations {
		readonly libelle: string;
		readonly items: { autre: string; code: string | null }[];
	}

	const groupesDuDetail = $derived.by<GroupeDeRelations[]>(() => {
		if (choisi === null) return [];
		const groupes: GroupeDeRelations[] = [];
		for (const r of relationsDe(choisi, relations)) {
			const libelle = typesRelation[r.type][r.sortant ? 'sortant' : 'entrant'];
			const note = noteDe(r.autre);
			const existant = groupes.find((g) => g.libelle === libelle);
			const groupe = existant ?? { libelle, items: [] };
			if (!existant) groupes.push(groupe);
			groupe.items.push({ autre: r.autre, code: note ? typeDe(note).code : null });
		}
		return groupes;
	});

	/** Le tiret cadratin du gel, pour une valeur que la note ne porte pas. */
	const RIEN_A_AFFICHER = '—';

	/**
	 * LES TROIS PREMIÈRES PROPRIÉTÉS DE LA FICHE CHOISIE. Le SCHÉMA vient du
	 * référentiel reçu, et un type qu'il ne porte pas rend une liste vide : c'est le
	 * type créé en console, sur lequel la lecture directe LEVAIT au clic. LA VALEUR
	 * VIENT DE LA NOTE dès que les propriétés sont servies.
	 */
	const proprietesDuDetail = $derived.by(() => {
		const note = choisi === null ? undefined : noteDe(choisi);
		if (!note?.typeFiche) return [];
		const champs = typesFiche[note.typeFiche] ?? [];
		const valeurs = proprietesDeFiche?.[note.id];
		return champs.slice(0, 3).map((c) => ({
			nom: c.nom,
			valeur:
				proprietesDeFiche === undefined
					? (c.exemple ?? c.valeurs?.[0] ?? RIEN_A_AFFICHER)
					: (valeurs?.[c.cle] ?? RIEN_A_AFFICHER)
		}));
	});

	const noteDuDetail = $derived(choisi === null ? undefined : noteDe(choisi));
	const detailEstUneFiche = $derived(noteDuDetail?.typeFiche !== undefined);
	const noeudDuDetail = $derived(choisi === null ? undefined : graphe.index.get(choisi));

	/* L'ADRESSE PORTE L'ÉTAT — `RG-M09-05`. Une seule fabrique, et tous les gestes
	   y passent : c'est ce qui garantit qu'une carte partagée rend l'écran d'où elle
	   vient. Les trois axes ne s'écrivent que hors de leur défaut, pour la même
	   raison qu'en V-08. */

	function adresse(
		typeVoulu: string | null,
		centreVoulu: string | null,
		perimetreVoulu: string = perimetreDemande ?? 'global|'
	): string {
		const couples: string[] = [];
		if (perimetreVoulu !== 'global|')
			couples.push(`perimetre=${encodeURIComponent(perimetreVoulu)}`);
		if (typeVoulu !== null) couples.push(`type=${encodeURIComponent(typeVoulu)}`);
		if (centreVoulu !== null) couples.push(`centre=${encodeURIComponent(centreVoulu)}`);
		return couples.length
			? `/cartographie/par-type?${couples.join('&')}`
			: '/cartographie/par-type';
	}

	/**
	 * `svelte/no-navigation-without-resolve` inspecte l'expression passée à
	 * `goto()` : une adresse composée lui est opaque, et la règle est levée sur
	 * cette seule ligne.
	 */
	function allerA(cible: string): void {
		/* eslint-disable-next-line svelte/no-navigation-without-resolve */
		void goto(cible);
	}

	function choisirLeType(cle: string): void {
		allerA(adresse(typeMaitre === cle ? null : cle, null));
	}

	function deplier(identifiant: string): void {
		allerA(adresse(typeMaitre, centre === identifiant ? null : identifiant));
	}

	function revenirALAnneau(): void {
		allerA(adresse(typeMaitre, null));
	}

	function changerDePerimetre(valeur: string): void {
		allerA(adresse(typeMaitre, null, valeur));
	}

	/**
	 * « OUVRIR LA NOTE COMPLÈTE » — l'issue du panneau de détail. L'adresse d'une
	 * note est PLATE et stable (`RG-M03-03`) ; `resolve()` la compose depuis
	 * l'identifiant de route, ce que la règle de navigation sait vérifier.
	 */
	function ouvrirLaNote(): void {
		if (choisi === null) return;
		void goto(resolve('/notes/[identifiant]', { identifiant: choisi }));
	}

	/**
	 * LES TROIS RACCOURCIS DE LA BARRE — la boîte de recherche, « Créer » et
	 * l'avatar. Les trois adresses sont des identifiants de route, que
	 * `resolve()` compose et que la règle de navigation sait vérifier.
	 */
	function allerALaRecherche(): void {
		void goto(resolve('/recherche'));
	}

	function allerALaCreation(): void {
		void goto(resolve('/notes/nouvelle'));
	}

	function allerAuProfil(): void {
		void goto(resolve('/mon-profil'));
	}

	/*
	 * LE RAIL SE REPLIE, ET CE N'EST PAS ICI QUE ÇA SE PASSE. `#bascule-rail` est
	 * servi par le câblage de la coquille, `$lib/cablage/coquille.ts`, accroché au
	 * DOCUMENT depuis `+layout.svelte`. UNE SECONDE BASCULE ANNULAIT LA PREMIÈRE : un
	 * état local posait `data-rail="ferme"`, puis l'écouteur du document — atteint par
	 * la remontée, donc APRÈS — relisait « ferme » et reposait « ouvert ». Le bouton
	 * ne faisait rien. N'en remets pas.
	 */
</script>

<!-- Le contour d'un nœud — le calque de `forme()` du gel. -->
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

<!-- La miniature de type du sélecteur : le même contour, au rayon 9. -->
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

<!-- Le témoin de fraîcheur — la fabrique unique de `$lib/fraicheur` (P-01). -->
<!-- prettier-ignore -->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!--
	LE FIL DÉROULÉ — UNE SEULE SOURCE POUR LES DEUX NŒUDS QUI PORTENT `id="fil"`. Le
	gel n'a qu'un constructeur, `rendreFil()` (`V-20:2924`) : sans centre un
	`span.fil-deroule__courant` ; avec centre un `button`, un séparateur, le titre et
	un `span` portant le nombre de connexions (`V-20:2933-2953`).

	CE SNIPPET EST CE CONSTRUCTEUR, rendu AUX DEUX ENDROITS que le gel désigne : le
	`nav.fil` de la barre, que `getElementById("fil")` atteint réellement, et le
	`div.fil-deroule` que le double identifiant rend inatteignable — et qui reste
	`hidden` là où le gel le laisse `hidden`.
-->
<!-- prettier-ignore -->
{#snippet filDeroule()}{#if centre === null}<span
			class="fil-deroule__courant"
			>{`${maitres.length} ${accord(maitres.length, (typeMaitreEncode?.nom ?? '').toLowerCase())} — choisissez-en un pour déplier ses connexions`}</span
		>{:else}<button type="button" onclick={revenirALAnneau}
			>{`Tous les ${pluriel((typeMaitreEncode?.nom ?? '').toLowerCase())}`}</button
		><span class="fil-deroule__sep">›</span><span class="fil-deroule__courant"
			>{titreDe(graphe, corpus, centre)}</span
		><span style="font-family:var(--f-donnee);font-size:var(--t-micro);color:var(--c-encre-3)"
			>{`${voisins.length} ${accord(voisins.length, 'connexion')}`}</span
		>{/if}{/snippet}

<a class="saut-contenu" href="#contenu">Aller au contenu</a>

<div class="app" id="app" data-rail="ouvert" data-detail={detailOuvert ? 'ouvert' : 'ferme'}>
	<Rail forme="abregee" {sectionsAbregees} version={versionEffective} />

	<div class="cadre">
		<header class="barre">
			<button
				class="btn btn--discret"
				id="bascule-rail"
				aria-label="Replier la navigation"
				title="Mode concentration"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path d="M6 2.5v11" /></svg
				>
			</button>
			<!-- LE FIL DÉROULÉ EST ÉCRIT DANS LE FIL D'ARIANE — voir l'en-tête. Deux
				éléments du gel portent `id="fil"` ; `rendreFil()` atteint le premier. -->
			<!-- prettier-ignore -->
			<nav class="fil" id="fil" aria-label="Fil d'Ariane" hidden={typeMaitre === null}>
				{#if typeMaitre === null}<a href={resolve('/')}>Accueil</a><span>›</span><a
						href={resolve('/cartographie')}>Cartographie</a
					><span>›</span><span class="fil__courant">Par type</span>{:else}{@render filDeroule()}{/if}
			</nav>
			<div
				class="recherche"
				role="button"
				tabindex="0"
				onclick={allerALaRecherche}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						allerALaRecherche();
					}
				}}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
				>
				<span class="recherche__txt" style="flex:1">Rechercher…</span>
				<kbd class="touche">Ctrl</kbd><kbd class="touche">K</kbd>
			</div>
			<button class="btn si-ecriture" title="Créer" onclick={allerALaCreation}>
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
				>
				Créer
			</button>
			<button class="avatar" title="{compteEffectif.nom} — menu utilisateur" onclick={allerAuProfil}
				>{compteEffectif.initiales}</button
			>
		</header>

		<main class="carto" id="contenu">
			<div class="controles">
				<div class="bascule-vue" role="tablist" aria-label="Mode de cartographie">
					<button role="tab" aria-selected="false" data-vue="complete">Vue complète</button>
					<button role="tab" aria-selected="true" data-vue="maitre">Par type maître</button>
				</div>

				<div class="controles__groupe" style="display:flex;align-items:center;gap:var(--e-2)">
					<label class="etiq" for="perimetre">Périmètre</label>
					<select id="perimetre" onchange={(e) => changerDePerimetre(e.currentTarget.value)}
						><option value="global|">Tous les domaines</option
						>{#each domainesEffectifs as d (d.nom)}<option value="domaine|{d.nom}"
								>Domaine {d.nom}</option
							>{/each}</select
					>
				</div>

				<div style="display:flex;align-items:center;gap:var(--e-2);flex-wrap:wrap">
					<span class="etiq">Type maître</span>
					<div class="types-maitres" id="types-maitres" role="group" aria-label="Type maître">
						{#each types as t (t.cle)}<button
								class="tm"
								type="button"
								aria-pressed={typeMaitre === t.cle}
								onclick={() => choisirLeType(t.cle)}
								>{@render miniature(t.type)}{t.type.nom}<span class="tm__n">{t.n}</span></button
							>{/each}
					</div>
				</div>

				<button
					class="btn"
					id="revenir"
					style="margin-left:auto"
					disabled={centre === null}
					onclick={revenirALAnneau}>Revenir à l'anneau</button
				>
			</div>

			<div class="scene">
				<div class="zone-graphe" id="zone-graphe">
					<svg
						id="graphe"
						class="graphe"
						data-criticite="oui"
						role="img"
						aria-label="Cartographie par type maître. Le détail de chaque nœud est disponible dans le panneau de droite."
						viewBox="0 0 1000 620"
						><g id="racine" transform="translate(0,0) scale(1)"
							>{#if typeMaitre !== null && maitres.length}<g
									>{#each scene.aretes as a, rang (rang)}<line
											class="arete"
											x1={a.a.x}
											y1={a.a.y}
											x2={a.b.x}
											y2={a.b.y}
											data-actif="oui"
											data-technique={a.technique ? 'oui' : 'non'}><title>{a.titre}</title></line
										>{/each}</g
								><g
									>{#each scene.noeuds as n (n.id)}{@const note =
											noteDe(n.id) ?? NOTE_ABSENTE}{@const ray = rayon(n.id, n.role)}<g
											class="noeud"
											transform="translate({n.p.x},{n.p.y})"
											data-id={n.id}
											data-maitre={typeCarto(note) === typeMaitre ? 'oui' : 'non'}
											data-centre={n.role === 'centre' ? 'oui' : 'non'}
											data-role-graphe={n.role}
											data-fantome={graphe.index.get(n.id)?.fantome ? 'oui' : 'non'}
											data-choisi={n.id === choisi ? 'oui' : 'non'}
											tabindex="0"
											role="button"
											aria-label={libelleDuNoeud(n.id)}
											onclick={() => deplier(n.id)}
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													deplier(n.id);
												}
											}}
											>{#if n.role === 'centre'}<circle
													class="halo-centre"
													r={ray + 16}
												/>{/if}{@render contour(
												contourDeForme(typeDe(note), ray),
												typeDe(note).couleur
											)}{#if ruptures.has(n.id)}<circle class="rupture-anneau" r={ray + 7} /><circle
													class="rupture-fanion"
													cx={ray * 0.78}
													cy={-ray * 0.9}
													r="7.5"
												/><text class="rupture-glyphe" x={ray * 0.78} y={-ray * 0.9}>!</text
												>{/if}<text class="noeud__code">{typeDe(note).code}</text><text
												class="noeud__nom"
												y={ray + 16}>{nomCourt(note.titre)}</text
											></g
										>{/each}{#if scene.mentionSeule !== null}<text
											class="mention-seul"
											x={CX}
											y={scene.mentionSeule}>Aucune connexion déclarée pour ce nœud</text
										>{/if}</g
								>{/if}</g
						></svg
					>

					<!-- LE NŒUD QUE LE DOUBLE IDENTIFIANT REND INATTEIGNABLE — `ARB-025`.
						`hidden` est celui du gel (`V-20:1129`) et il ne bouge pas. Le contenu est
						celui que le constructeur produirait — même snippet que la barre, donc même
						balisage par construction et non par recopie. -->
					<!-- prettier-ignore -->
					<div class="fil-deroule" id="fil" hidden>{#if typeMaitre !== null}{@render filDeroule()}{/if}</div>

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
						<button type="button" id="ajuster" aria-label="Recentrer" title="Recentrer">
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

					<!--
						LE VOILE GARDE SA BOÎTE — `voile(null)` ne fait que retirer `data-actif`,
						il ne vide pas `#voile-boite` (`V-20:2989`).
					-->
					<div class="voile" id="voile" data-actif={manque === null ? 'non' : 'oui'}>
						<div class="voile__boite" id="voile-boite">
							{#if manque === 'domaine'}<div>
									<h2>Aucun domaine lisible</h2>
									<p>
										Cette vue part des notes du corpus, et le corpus n'a encore nulle part où être
										rangé.{administrateur
											? ' Créez un univers, puis un domaine, dans la console — /console/univers.'
											: " Demandez à un administrateur l'accès à un domaine."}
									</p>
									<div class="voile__actions">
										{#if administrateur}<a
												class="btn btn--principal"
												href={resolve('/console/univers')}>Créer un univers</a
											>{/if}
									</div>
								</div>{:else if manque === 'note'}<div>
									<h2>Aucune note à cartographier</h2>
									<p>
										Cette vue groupe les notes par type — vos serveurs, vos applications, vos
										contacts — et le corpus est vide. Déclarez vos types de fiches —
										/console/types-de-fiches —, créez des notes, puis reliez-les entre elles.
									</p>
									<div class="voile__actions">
										{#if administrateur}<a class="btn" href={resolve('/console/types-de-fiches')}
												>Déclarer un type de fiche</a
											>{/if}<a class="btn btn--principal" href={resolve('/notes/nouvelle')}
											>Créer une note</a
										>
									</div>
								</div>{:else if manque === 'relation'}<div>
									<h2>Aucune relation dans le corpus</h2>
									<p>
										La barre des types se remplit des notes RELIÉES, et aucune relation n'est encore
										déclarée : il n'y a donc aucune famille à proposer. Ouvrez une note, ajoutez-y
										une relation — « héberge », « dépend de », « sauvegarde » —, et son type
										paraîtra ici.
									</p>
								</div>{:else if manque === 'perimetre'}<div>
									<h2>Aucune relation dans ce périmètre</h2>
									<p>
										Le corpus porte des relations, mais aucune ne touche le domaine choisi. Revenez
										à tous les domaines, ou choisissez-en un autre dans le sélecteur ci-dessus.
									</p>
									<div class="voile__actions">
										<a class="btn btn--principal" href={resolve('/cartographie/par-type')}
											>Voir tous les domaines</a
										>
									</div>
								</div>{:else}<div>
									<h2>Choisissez une famille d'objets</h2>
									<p>
										Cette vue part d'un type — vos serveurs, vos applications, vos contacts — et
										déplie leurs connexions un par un. Sélectionnez un type dans la barre ci-dessus
										pour commencer.
									</p>
								</div>{/if}
						</div>
					</div>
				</div>

				<aside class="detail-col" id="detail" aria-label="Détail du nœud sélectionné">
					{#if noteDuDetail === undefined}<div class="detail__vide">
							<span class="etiq">Aucun nœud sélectionné</span>
							<p>
								Cliquez un nœud pour isoler son voisinage. La mise en avant reste en place jusqu'au
								prochain clic : elle sert à analyser, pas à survoler.
							</p>
						</div>{:else}<div class="detail__tete">
							<h2 class="detail__titre">{noteDuDetail.titre}</h2>
						</div>
						<div class="detail__sous">
							<span class="past past--type">{typeDe(noteDuDetail).nom}</span><span class="past"
								>{noteDuDetail.domaine}</span
							>{#if noeudDuDetail?.fantome}<span class="past">Hors périmètre</span>{/if}
						</div>
						{@render temoin(noteDuDetail)}
						<div class="detail__section">
							<span class="etiq">Criticité</span>
							<div class="crit">
								<div class="crit__boite">
									<div class="crit__val">{degreDe(choisi ?? '')}</div>
									<span class="crit__nom">connexions</span>
								</div>
								<div class="crit__boite" class:crit__boite--rupture={ruptures.has(choisi ?? '')}>
									<div class="crit__val">{ruptures.has(choisi ?? '') ? 'Oui' : 'Non'}</div>
									<span class="crit__nom">point de rupture</span>
								</div>
							</div>
							{#if ruptures.has(choisi ?? '')}<p
									style="font-size:var(--t-mini);color:var(--c-danger);line-height:1.5;margin:var(--e-2) 0 0"
								>
									Son indisponibilité isole une partie du périmètre : aucun autre chemin ne dessert
									ce qui en dépend.
								</p>{/if}
						</div>
						<!-- LE PANNEAU DIT CE QU'IL SAIT, ET SEULEMENT CELA : une fiche dont le
						     référentiel reçu ne porte pas le type — créé en console, puis retiré —
						     rendait ici une exception au clic. Elle rend maintenant l'état neutre.
						     Une note qui n'est pas une fiche n'a pas de section. -->
						{#if detailEstUneFiche}<div class="detail__section">
								<span class="etiq">Propriétés</span>{#if !proprietesDuDetail.length}<p
										style="font-size:var(--t-petit);color:var(--c-encre-3);margin:0"
									>
										Aucune propriété au référentiel.
									</p>{:else}{#each proprietesDuDetail as p (p.nom)}<div class="prop">
											<span class="prop__cle">{p.nom}</span><span>{p.valeur}</span>
										</div>{/each}{/if}
							</div>{/if}
						<div class="detail__section">
							<span class="etiq">Relations</span>{#if !groupesDuDetail.length}<p
									style="font-size:var(--t-petit);color:var(--c-encre-3);margin:0"
								>
									Aucune relation déclarée.
								</p>{:else}{#each groupesDuDetail as g (g.libelle)}<div class="rel-groupe">
										<div class="rel-groupe__titre etiq">{g.libelle}</div>
										{#each g.items as x, rang (rang)}<button
												class="rel-item"
												type="button"
												onclick={() => deplier(x.autre)}
												><span class="rel-item__nom">{titreDe(graphe, corpus, x.autre)}</span
												>{#if x.code !== null}<span class="rel-item__type">{x.code}</span
													>{/if}</button
											>{/each}
									</div>{/each}{/if}
						</div>
						<button
							class="btn btn--principal"
							style="width:100%;margin-top:var(--e-4);justify-content:center"
							onclick={ouvrirLaNote}>Ouvrir la note complète</button
						>{/if}
				</aside>
			</div>
		</main>
	</div>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
