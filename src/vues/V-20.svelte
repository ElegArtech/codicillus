<script lang="ts">
	/**
	 * V-20 — Cartographie par type maître. Route `/cartographie/par-type`
	 * (`docs/routes.md` §3). Aucune entrée de rail ne la vise : on y arrive par
	 * la bascule « Par type maître » de V-19.
	 *
	 * AUCUNE DONNÉE PROPRE (`RG-M09-01`), ET PLUS AUCUN DÉFAUT TIRÉ DU JEU. Les
	 * quatre tables du graphe — relations, types de relation, types techniques,
	 * référentiel des types de fiche — étaient des propriétés OPTIONNELLES dont
	 * le défaut était la constante de `seeds/corpus.ts` : une route qui en
	 * oubliait une dessinait la carte du jeu de démonstration sans que rien ne
	 * proteste. Elles sont EXIGÉES ; la route les sert depuis la base, et une
	 * route qui en oublierait une ne bâtirait plus.
	 *
	 * `TYPES_FICHE` A CESSÉ D'ÊTRE UNE CONSTANTE NUE, ET C'ÉTAIT DÉJÀ UNE
	 * RÉPARATION. Elle était importée au niveau du module et employée SANS
	 * PROPRIÉTÉ : aucun chargeur ne pouvait donc la corriger. Le panneau de
	 * détail rendait alors, sous l'intitulé « Propriétés », les noms de champ du
	 * JEU DE SEMENCE et leurs valeurs d'EXEMPLE, présentés comme les propriétés
	 * de la note réelle choisie — et un type de fiche créé en console, absent de
	 * la constante, faisait LEVER `.slice()` au clic sur le nœud. Le référentiel
	 * et les valeurs sont reçus, et le jeu n'en est plus le défaut.
	 * Ce lot NE DÉCLARE PAS `RG-M09-01` tenue.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CETTE VUE N'EMPRUNTE PAS `$lib/coquille/Coquille.svelte`, ET C'EST UN
	 * ÉCART DÉCLARÉ — remonté, non arbitré à ce jour.
	 *
	 * LE FAIT DU GEL. `V-20:1101` pose `<nav class="fil" id="fil">` dans la
	 * barre, et `V-20:1129` pose `<div class="fil-deroule" id="fil" hidden>`
	 * dans la zone de graphe : DEUX ÉLÉMENTS PORTENT LE MÊME IDENTIFIANT. Or
	 * `rendreFil()` (`V-20:2924`) écrit dans `document.getElementById("fil")`,
	 * qui rend le PREMIER en ordre de document — le fil d'Ariane. Le déroulé
	 * par type maître remplace donc le fil d'Ariane, et `.fil-deroule` reste
	 * vide et masqué à tous les états. Mesuré sur les cinq états, pas déduit :
	 * l'instantané de la référence porte
	 * `nav[aria-label="Fil d'Ariane"] > button "Tous les serveurs"`.
	 *
	 * POURQUOI LE GABARIT NE PEUT PAS LE RENDRE. `Coquille` reçoit `fil` comme
	 * une LISTE DE SEGMENTS et `BarreSuperieure` en fait des `<a>` et un
	 * `span.fil__courant` ; elle n'a ni `hidden`, ni bouton, ni
	 * `span.fil-deroule__courant`, et aucune propriété n'ouvre ce nœud. Le
	 * gabarit est REGELÉ : « un seul lot est encore autorisé à y revenir :
	 * T-106 / P-8 » — pas celui-ci, et le lot n'écrit jamais dans
	 * `src/lib/coquille/`.
	 *
	 * CE QUI EST FAIT, ET CE QUI NE L'EST PAS. La coquille est recomposée ICI,
	 * au balisage du gel de V-20, MAIS `Rail.svelte` et `railAbregeRendu()`
	 * sont EMPRUNTÉS TELS QUELS : le rail de V-20 est identique à l'octet à
	 * celui de V-19, V-21 et V-22 (`diff` sur les quatre `aside.rail` du gel :
	 * zéro ligne). Seuls la barre supérieure — trente lignes — et les trois
	 * nœuds d'enveloppe sont réécrits. Aucune règle de style n'est dupliquée.
	 * La duplication est donc BORNÉE au nœud que le gabarit ne sait pas rendre,
	 * et elle est visible : elle ne se paiera pas en silence.
	 * ═══════════════════════════════════════════════════════════════════════
	 *
	 * LA VUE N'A PLUS DE VECTEUR DE PLANCHE, ET C'EST LE CORRECTIF DU LOT C. Les
	 * cinq états de `verif/scenarios/V-20.json` étaient rendus par un vecteur
	 * dont les « moments » posaient eux-mêmes le type maître et le nœud au
	 * centre — deux identifiants du jeu de démonstration écrits en dur. Ils ne
	 * s'affichaient sur aucune route, la seule qui monte cette vue posant
	 * toujours les trois axes d'adresse ; ils partaient dans le paquet servi au
	 * navigateur. Les trois axes sont désormais EXIGÉS : l'état de l'écran est
	 * celui de l'adresse, et il n'y a plus de seconde source à laquelle il
	 * puisse retomber.
	 *
	 * AUCUNE DISPOSITION SIMULÉE (ARB-011). Le gel le dit de lui-même :
	 * « Disposition — déterministe, jamais simulée. L'anneau et l'étoile sont
	 * calculés géométriquement : la place d'un nœud ne dépend que de son rang »
	 * (`V-20:2701`). Les deux fabriques sont donc portées à l'identique —
	 * mêmes opérations, mêmes constantes —, ce qu'`ECART-020` É-3 nomme le
	 * calque exact de la fabrique du gel. Rien n'est itéré, rien n'est animé.
	 *
	 * `.noeud`, `.arete`, `.scene`, `.detail-col`, `.zone-graphe` SONT ICI DES
	 * CLASSES DE GRAPHE — `docs/DESIGN.md` §2.H. `.noeud` désigne un nœud
	 * d'ARBORESCENCE dans 33 autres vues, dont le rail de cette page même que
	 * `Rail.svelte` rend avec sa définition à lui. Les règles sont
	 * inconciliables, chacune vit dans la feuille de sa vue (P-6.3), et AUCUNE
	 * FACTORISATION N'EST PERMISE.
	 *
	 * LE PANNEAU DE DÉTAIL EST ÉCRIT ICI, et non partagé avec V-19 dont le gel
	 * l'écrit mot pour mot : il porte des styles en ligne que P-6.4 n'admet que
	 * dans un fichier rattaché à une maquette. Voir
	 * `$lib/graphe/cartographie.ts`. Il n'est d'ailleurs PEUPLÉ que dans cette
	 * vue : les six états de V-19 rendent tous `detail__vide`.
	 *
	 * LE TÉMOIN DE FRAÎCHEUR PASSE PAR LA FABRIQUE UNIQUE `$lib/fraicheur`
	 * (P-01, RG-M06-03). Aucun libellé n'est construit localement.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-20.css`, posé par `node verif/feuilles-de-vue.mjs V-20
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
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
	 * LES QUATRE SOURCES DU GRAPHE SONT EXIGÉES, ET C'EST LE LEVIER.
	 *
	 * Relations, types de relation, types techniques et référentiel des types de
	 * fiche étaient OPTIONNELS, de défaut la constante de `seeds/corpus.ts` : une
	 * route qui en oubliait un dessinait la carte du jeu de démonstration sans
	 * que rien ne proteste. Exigés, ils sont gardés par le compilateur — une
	 * route qui en oublierait un ne bâtirait plus.
	 *
	 * V-20 ne compose pas la coquille : elle monte le rail elle-même, et n'a donc
	 * pas d'univers à recevoir — la propriété n'est pas déclarée parce qu'aucun
	 * nœud de cette vue n'en dépendrait, et une propriété inerte est une promesse
	 * sans effet. `domaines` et `compte` restent optionnelles, avec un ÉTAT VIDE
	 * pour défaut : aucune route ne les passe, le contexte de coquille porte le
	 * rangement et l'identité réels, et un domaine ou un compte du jeu en défaut
	 * serait une donnée inventée. `instance` a disparu : elle ne servait qu'à
	 * donner sa version au pied du rail, que le contexte sert déjà.
	 */
	interface Proprietes {
		/** Le jeu de semence de la vue — `corpusPourVue('V-20')`. */
		notes: readonly Note[];
		/** Les domaines du produit. Absente, aucun domaine — jamais ceux du jeu. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, un compte VIDE — jamais celui du jeu. */
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
		 * LE RÉFÉRENTIEL DES TYPES DE FICHE — un schéma de champs par type, tel que
		 * la table le porte. Exigé : il valait celui du jeu de semence.
		 *
		 * L'INDEX EST UNE CHAÎNE, ET C'EST LE FAIT DE LA BASE. Le jeu n'en connaît
		 * que trois, la table en porte autant que la console en crée, et `typeFiche`
		 * d'une note lue en base est le nom de la ligne jointe. Un type que le
		 * référentiel reçu ne porte pas est donc un cas ORDINAIRE, pas une anomalie :
		 * il se rend en état neutre, il ne lève pas.
		 */
		typesFiche: Record<string, readonly ChampDeFiche[]>;
		/**
		 * LES VALEURS DE PROPRIÉTÉ DE CHAQUE FICHE — par identifiant de note, puis
		 * par clé de champ. La colonne `proprietes_typees` les porte.
		 *
		 * ABSENTE, LA VUE N'EST PAS BRANCHÉE SUR UNE BASE, et le panneau reprend
		 * alors l'illustration du gel : la valeur d'exemple du référentiel. C'est le
		 * même partage qu'en `V-28`, qui détecte de la même façon qu'elle tourne sur
		 * le jeu. SERVIE, elle est la seule source de valeur : ce que la note ne
		 * porte pas se rend en tiret, jamais en exemple — un exemple affiché sous
		 * l'intitulé « Propriétés » d'une note réelle est une valeur inventée.
		 */
		proprietesDeFiche?: Readonly<Record<string, Readonly<Record<string, string>>>>;
		/**
		 * ─────────────────────────────────────────────────────────────────────
		 * LES TROIS AXES QUE L'ADRESSE PORTE — `RG-M09-05`, « état de cartographie
		 * partageable » — ET ILS SONT EXIGÉS.
		 *
		 * Le gel garde ses trois choix dans une clôture : le périmètre, la famille
		 * d'objets et le nœud déplié. Une carte explorée ne s'envoie donc à
		 * personne, et le rechargement la ramène à « aucun type choisi ». Ici,
		 * `?perimetre=`, `?type=` et `?centre=` les portent, et le chargeur — seul
		 * lecteur de `url` — les extrait.
		 *
		 * ILS ÉTAIENT FACULTATIFS, ET LA PLANCHE RÉPONDAIT À LEUR PLACE : absents,
		 * trois « moments » de vecteur posaient eux-mêmes le type maître et le
		 * nœud au centre — `'n-pg-prod-01'` et `'n-coffre-hors-site'`, DEUX
		 * IDENTIFIANTS DU JEU DE DÉMONSTRATION écrits en dur. Ils ne s'affichaient
		 * jamais sur la route, qui pose toujours les trois axes ; ils partaient
		 * dans le paquet servi au navigateur, et s'y lisaient. La seule route qui
		 * monte cette vue les passe : ils sont exigés, la bascule n'a plus lieu
		 * d'être, et les deux identifiants sont partis avec elle.
		 */
		/** Le périmètre demandé — `type|nom`, la valeur même du sélecteur du gel. */
		perimetreDemande: string;
		/** La famille d'objets choisie, ou `null` si aucune. */
		typeMaitreDemande: string | null;
		/** Le nœud déplié, ou `null` si l'on en est à l'anneau. */
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

	/**
	 * LE COMPTE RENDU QUAND AUCUNE IDENTITÉ N'EST SERVIE — un état VIDE, jamais
	 * un compte du jeu de démonstration. En application, le contexte de coquille
	 * l'emporte et cette valeur n'atteint aucun écran.
	 */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;

	/**
	 * L'IDENTITÉ ET LE RANGEMENT RÉELS L'EMPORTENT — `$lib/coquille/identite.ts`
	 * porte le contrat et le motif complet.
	 *
	 * CE QUE CELA RÉPARE, ET C'EST MESURÉ. V-20 ne compose pas `Coquille.svelte`
	 * (le commentaire d'en-tête dit pourquoi) : elle monte son en-tête et son
	 * rail elle-même, et elle était donc RESTÉE HORS de la réparation que la
	 * coquille a reçue. Relevé le 22/08/2026 sur une base à zéro univers, alors
	 * que `/cartographie` — sa jumelle, même écran, autre onglet — était juste :
	 * l'avatar annonçait « Karim Belhadj », le rail dépliait « Migration 2026 »,
	 * et le sélecteur de périmètre proposait les quatre domaines du jeu de
	 * semence. Trois nœuds, trois adresses en 404 au clic.
	 *
	 * LA PRÉSENCE DU CONTEXTE DÉCIDE, PAS SON CONTENU. Une base vide n'est pas
	 * une base absente : elle se rend vide. Hors application — le rendu par
	 * défaut d'une vue, sans gabarit racine —, `getContext` rend `undefined`,
	 * les propriétés du jeu s'appliquent, et le gel ne bouge pas d'un pixel.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const domainesEffectifs = $derived(identite === undefined ? domaines : identite.domaines);
	const compteEffectif = $derived(identite?.compte ?? compte ?? COMPTE_VIDE);
	/* LA VERSION DU PIED DE RAIL EST CELLE DU PAQUET, comme dans `Coquille.svelte`.
	   Une propriété `instance` la portait, et son défaut était le `1.0.0` de
	   `seeds/corpus.ts` : V-20 câblant `Rail` en direct, elle annonçait un numéro
	   de démonstration comme un fait, seule de toutes les pages. La propriété est
	   partie ; hors application, la version est VIDE, jamais inventée. */
	const versionEffective = $derived(identite?.version ?? '');

	/**
	 * LE RAIL ABRÉGÉ SUIT LA BASE DÈS QU'ELLE EN A UNE — la copie exacte de ce
	 * que `Coquille.svelte` fait pour les vingt-deux autres vues. Sans contexte,
	 * `railAbregeRendu()` retombe sur `SECTIONS_ABREGEES`, l'arbre du gel.
	 *
	 * V-20 NE DÉCLARE TOUJOURS PAS DE PROPRIÉTÉ `univers`, et c'est délibéré :
	 * le contexte la porte, et une propriété de plus serait un second chemin
	 * pour une seule vérité (`P-35`).
	 */
	const sectionsAbregees = $derived(
		identite === undefined
			? railAbregeRendu([])
			: railAbregeRendu(
					[],
					sectionsAbregeesDuCorpus(sectionsDuRail(identite.univers, identite.domaines, corpus))
				)
	);

	/* ── Le graphe ──────────────────────────────────────────────────────────
	   Le périmètre est la première option du sélecteur, « Tous les domaines ». */
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
	 * LA FAMILLE ET LE NŒUD VIENNENT DE L'ADRESSE, ET DE NULLE PART AILLEURS.
	 *
	 * Deux dérivations les posaient à la place du chargeur quand les propriétés
	 * manquaient — les « moments » de la planche —, et elles nommaient deux notes
	 * du jeu de démonstration en dur. Les propriétés sont exigées ; il n'y a plus
	 * de seconde source, ni les deux identifiants qui allaient avec.
	 */
	const typeMaitre = $derived(typeMaitreDemande);
	const centre = $derived(centreDemande);
	const choisi = $derived(centre);

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

	/* ── Disposition — déterministe, jamais simulée ─────────────────────────
	   Le calque exact des deux fabriques du gel : mêmes opérations, mêmes
	   constantes, même origine. Rien n'est itéré. */
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

	/** Les voisins d'un nœud, dans l'ordre des arêtes, sans doublon. */
	function voisinsDe(id: string): string[] {
		const v: string[] = [];
		for (const r of graphe.aretes) {
			if (r.de === id && !v.includes(r.vers)) v.push(r.vers);
			if (r.vers === id && !v.includes(r.de)) v.push(r.de);
		}
		return v.filter((x) => graphe.index.has(x));
	}

	/** Le rôle d'un nœud dans le déroulé : centre, voisin, ou maître. */
	type Role = 'centre' | 'voisin' | 'maitre';

	function rayon(id: string, role: Role): number {
		const base = 15 + Math.min(degreDe(id), 8) * 2.4;
		return role === 'centre' ? base * 1.28 : role === 'voisin' ? base * 0.86 : base;
	}

	/** Le nom porté sous le nœud, tronqué au-delà de 24 caractères. */
	const nomCourt = (titre: string): string =>
		titre.length > 24 ? `${titre.slice(0, 23)}…` : titre;

	/** La scène rendue : les arêtes, puis les nœuds, dans l'ordre du gel. */
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

	/** Le nom accessible d'un nœud — titre, type, connexions, rôle, rupture. */
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
	 * LES TROIS PREMIÈRES PROPRIÉTÉS DE LA FICHE CHOISIE — son schéma, ses
	 * valeurs.
	 *
	 * LE SCHÉMA VIENT DU RÉFÉRENTIEL REÇU, et un type qu'il ne porte pas rend une
	 * liste vide : c'est le type de fiche créé en console, que la constante du jeu
	 * ne pouvait pas connaître, et sur lequel la lecture directe LEVAIT au clic.
	 *
	 * LA VALEUR VIENT DE LA NOTE, ET D'ELLE SEULE, dès que les propriétés sont
	 * servies. Le repli sur l'exemple du référentiel n'a lieu que hors produit,
	 * là où il est l'illustration de la planche et non le fait d'une note.
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
	/** La note choisie est-elle une fiche ? Le panneau rend alors ses propriétés. */
	const detailEstUneFiche = $derived(noteDuDetail?.typeFiche !== undefined);
	const noeudDuDetail = $derived(choisi === null ? undefined : graphe.index.get(choisi));

	/* ═════════════════════════════════════════════════════════════════════
	   L'ADRESSE PORTE L'ÉTAT — RG-M09-05

	   Une seule fabrique, et tous les gestes de la vue y passent : c'est ce qui
	   garantit qu'une carte partagée rend exactement l'écran d'où elle vient.
	   Les trois axes ne s'écrivent que hors de leur défaut, pour la même raison
	   qu'en V-08 : deux écrans identiques doivent rendre la même adresse.
	   ═════════════════════════════════════════════════════════════════════ */

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
	 * LA GARDE DE PLANCHE A DISPARU AVEC LA PLANCHE : les trois axes venant
	 * toujours de l'adresse, la vue n'est plus rendue hors de sa route.
	 *
	 * `svelte/no-navigation-without-resolve` inspecte l'expression passée à
	 * `goto()` : une adresse composée lui est opaque. La règle est levée sur
	 * cette seule ligne, comme `V-24` la lève pour les adresses de son rapport.
	 */
	function allerA(cible: string): void {
		/* eslint-disable-next-line svelte/no-navigation-without-resolve */
		void goto(cible);
	}

	/** Choisir une famille d'objets — la rechoisir la referme, comme une bascule. */
	function choisirLeType(cle: string): void {
		allerA(adresse(typeMaitre === cle ? null : cle, null));
	}

	/** Déplier un nœud. Le même nœud rechoisi ramène à l'anneau. */
	function deplier(identifiant: string): void {
		allerA(adresse(typeMaitre, centre === identifiant ? null : identifiant));
	}

	/** « Revenir à l'anneau » — le centre tombe, la famille reste. */
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
	 * LE RAIL SE REPLIE, ET CE N'EST PAS ICI QUE ÇA SE PASSE — mesuré.
	 *
	 * `#bascule-rail` est déjà servi par le câblage de la coquille,
	 * `$lib/cablage/coquille.ts`, accroché au DOCUMENT depuis `+layout.svelte` :
	 * il lit `data-rail` sur `div.app` et le bascule, transcrit de `V-37:3270`.
	 * Cette vue monte son cadre elle-même, mais elle vit sous la même
	 * disposition, et le bouton y porte le même identifiant.
	 *
	 * UNE SECONDE BASCULE ANNULAIT LA PREMIÈRE : un état local ici posait
	 * `data-rail="ferme"` à la volée de Svelte, puis l'écouteur du document —
	 * atteint par la remontée de l'événement, donc APRÈS — relisait « ferme » et
	 * reposait « ouvert ». Le bouton ne faisait rien, et les deux moitiés avaient
	 * chacune raison. C'est `P-35` sur un état d'interface : deux détenteurs d'une
	 * même vérité finissent par se contredire.
	 *
	 * L'attribut reste donc écrit au balisage, comme le gel l'écrit, et c'est le
	 * câblage de la coquille qui le fait bouger — un seul chemin.
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
	LE FIL DÉROULÉ — UNE SEULE SOURCE POUR LES DEUX NŒUDS QUI PORTENT `id="fil"`.

	Le gel n'a qu'UN constructeur, `rendreFil()` (`V-20:2924`), et il produit ces
	nœuds-là :

	  • sans centre   — un `span.fil-deroule__courant` (`V-20:2933-2937`) ;
	  • avec centre   — `button` « Tous les … », `span.fil-deroule__sep` de
	    `textContent "›"` (`V-20:2945`), `span.fil-deroule__courant` du titre
	    (`V-20:2948`), puis un `span` de style en ligne portant le nombre de
	    connexions (`V-20:2951-2953`).

	La feuille du gel les habille : `.fil-deroule` (`V-20:869-876`),
	`.fil-deroule button` (`:877-880`), son survol (`:881`), `__sep` (`:882`) et
	`__courant` (`:883`) — cinq règles, portées à l'identique par
	`src/vues/V-20.css:461-475`.

	CE SNIPPET EST CE CONSTRUCTEUR, ET IL EST RENDU AUX DEUX ENDROITS que le gel
	désigne : le `nav.fil` de la barre (`V-20:1090`), que `getElementById("fil")`
	atteint réellement, et le `div.fil-deroule` de la zone de graphe
	(`V-20:1129`), que le double identifiant d'ARB-025 rend inatteignable. La
	zone cesse d'être du balisage mort sans qu'un pixel bouge : le second nœud
	reste `hidden` là où le gel le laisse `hidden`, et `[hidden] { display: none
	!important }` (`src/socle.css:116`) le tient hors de toute boîte de rendu
	comme hors de l'arbre d'accessibilité.
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
			<!--
				LE FIL DÉROULÉ EST ÉCRIT DANS LE FIL D'ARIANE — voir l'en-tête. Deux
				éléments du gel portent `id="fil"` ; `rendreFil()` atteint le premier.
			-->
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

					<!--
						LE NŒUD QUE LE DOUBLE IDENTIFIANT REND INATTEIGNABLE — ARB-025.
						`hidden` est celui du gel (`V-20:1129`) et il ne bouge pas : dans le
						gel, `rendreFil()` n'atteint jamais ce nœud, donc rien ne lui retire
						l'attribut, et il n'est visible dans AUCUN des cinq états déclarés de
						`verif/scenarios/V-20.json`. Le contenu, lui, est désormais celui que
						le constructeur produirait — même snippet que la barre, donc même
						balisage, mêmes classes, mêmes jetons, par construction et non par
						recopie. La zone est vivante ; elle n'est pas visible.
					-->
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
						LE VOILE GARDE SA BOÎTE — `voile(null)` ne fait que retirer
						`data-actif`, il ne vide pas `#voile-boite` (`V-20:2989`). Le message
						« Choisissez une famille d'objets », posé au premier rendu, reste donc
						dans le DOM des cinq états, visible ou non.
					-->
					<div class="voile" id="voile" data-actif={typeMaitre === null ? 'oui' : 'non'}>
						<div class="voile__boite" id="voile-boite">
							<div>
								<h2>Choisissez une famille d'objets</h2>
								<p>
									Cette vue part d'un type — vos serveurs, vos applications, vos contacts — et
									déplie leurs connexions un par un. Sélectionnez un type dans la barre ci-dessus
									pour commencer.
								</p>
							</div>
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
						<!-- LE PANNEAU DIT CE QU'IL SAIT, ET SEULEMENT CELA. Une fiche dont le
						     référentiel reçu ne porte pas le type — créé en console, puis
						     retiré — rendait ici une exception au clic. Elle rend maintenant
						     l'état neutre, sur le modèle de « Aucune relation déclarée » de
						     la section voisine. Une note qui n'est pas une fiche n'a pas de
						     section : c'est le rendu du gel, et il est juste. -->
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
