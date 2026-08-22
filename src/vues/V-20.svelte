<script lang="ts">
	/**
	 * V-20 — Cartographie par type maître. Route `/cartographie/par-type`
	 * (`docs/routes.md` §3). Aucune entrée de rail ne la vise : on y arrive par
	 * la bascule « Par type maître » de V-19.
	 *
	 * AUCUNE DONNÉE PROPRE (`RG-M09-01`) : `RELATIONS`, `RELATIONS_TECHNIQUES`,
	 * `TYPES_RELATION`, `TYPES_FICHE` de `seeds/corpus.ts`, et le jeu de semence
	 * que le mode démo passe en propriété (`corpusPourVue('V-20')`, variante
	 * « complete », 32 notes dont cinq signets sans relation, donc absents du
	 * graphe). Les trois tableaux de relations sont désormais REÇUS EN PROPRIÉTÉ,
	 * de défaut la constante du jeu (T-043) ; `TYPES_FICHE` reste une constante,
	 * hors de l'énumération du contrat. Ce lot NE DÉCLARE PAS `RG-M09-01` tenue.
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
	 * CINQ ÉTATS — `verif/scenarios/V-20.json`, QUATRE RENDUS DISTINCTS. Le
	 * relevé du gel donne `disparu` STRICTEMENT IDENTIQUE à `moment-aucun` :
	 * la case « Nœud disparu » n'a aucun gestionnaire de `change`, elle n'est
	 * lue qu'au clic sur un nœud (`V-20:2879`), c'est-à-dire jamais dans un
	 * squelette qui rend l'état et non la transition (ARB-011). Ce n'est pas un
	 * oubli à combler : c'est ce que la maquette montre.
	 *
	 * `isole` LAISSE `data-detail="ferme"` TOUT EN REMPLISSANT LE PANNEAU. Le
	 * gestionnaire de la case « Maître sans relation » (`V-20:3121`) appelle
	 * `rendreDetail(choisi)` sans toucher à `data-detail`, là où celui des
	 * moments le règle. La colonne de détail est donc peuplée et masquée à la
	 * fois. Mesuré, reproduit tel quel.
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
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		RELATIONS,
		RELATIONS_TECHNIQUES,
		TYPES_FICHE,
		TYPES_RELATION,
		type CleDeTypeDeRelation,
		type Domaine,
		type EtatDInstance,
		type LibellesDeRelation,
		type Note,
		type Relation,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import Rail from '$lib/coquille/Rail.svelte';
	import { railAbregeRendu, sectionsAbregeesDuCorpus } from '$lib/coquille/arborescence-abregee';
	import { sectionsDuRail } from '$lib/coquille/arborescence';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';
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
	 * LES PROPRIÉTÉS DE RANGEMENT ET D'IDENTITÉ SONT OPTIONNELLES, ET LEUR
	 * DÉFAUT EST LA CONSTANTE DU JEU DE SEMENCE.
	 *
	 * V-20 ne compose pas la coquille : elle monte le rail elle-même, et n'a donc
	 * pas d'univers à recevoir — la propriété n'est pas déclarée parce qu'aucun
	 * nœud de cette vue n'en dépendrait, et une propriété inerte est une promesse
	 * sans effet. Pour le reste, le défaut est la constante du jeu : le mode de
	 * conception ne passe que `vecteur` et `notes`, la vue reçoit donc exactement
	 * ce qu'elle recevait, et le banc de comparaison ne bouge pas d'un pixel.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — moment × cas limites. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-20')`. */
		notes: readonly Note[];
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
		/**
		 * ─────────────────────────────────────────────────────────────────────
		 * LES TROIS AXES QUE L'ADRESSE PORTE — `RG-M09-05`, « état de cartographie
		 * partageable ».
		 *
		 * Le gel garde ses trois choix dans une clôture : le périmètre, la famille
		 * d'objets et le nœud déplié. Une carte explorée ne s'envoie donc à
		 * personne, et le rechargement la ramène à « aucun type choisi ». Ici,
		 * `?perimetre=`, `?type=` et `?centre=` les portent, et le chargeur — seul
		 * lecteur de `url` — les extrait.
		 *
		 * ABSENTS, LES TROIS MOMENTS DE LA PLANCHE RÉPONDENT SEULS, et les cinq
		 * états déclarés ne bougent pas d'un pixel : c'est `typeMaitreDemande` qui
		 * fait la bascule, parce que le chargeur le pose TOUJOURS — fût-ce à
		 * `null` — et que le mode de conception ne le pose jamais.
		 */
		/** Le périmètre demandé — `type|nom`, la valeur même du sélecteur du gel. */
		perimetreDemande?: string | undefined;
		/** La famille d'objets choisie, ou `null` si aucune. */
		typeMaitreDemande?: string | null | undefined;
		/** Le nœud déplié, ou `null` si l'on en est à l'anneau. */
		centreDemande?: string | null | undefined;
	}

	const {
		vecteur,
		notes: corpus,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		relations = RELATIONS,
		typesRelation = TYPES_RELATION,
		relationsTechniques = RELATIONS_TECHNIQUES,
		perimetreDemande,
		typeMaitreDemande,
		centreDemande
	}: Proprietes = $props();

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
	const compteEffectif = $derived(identite?.compte ?? compte);
	/* LA VERSION DU PIED DE RAIL EST CELLE DU PAQUET, comme dans `Coquille.svelte`.
	   La propriété `instance` porte le `1.0.0` de `seeds/corpus.ts` — un numéro de
	   démonstration : V-20 câblant `Rail` en direct, elle l'annonçait comme un fait,
	   seule de toutes les pages. Hors application, le contexte est absent et la
	   propriété reprend la main : le gel ne bouge pas. */
	const versionEffective = $derived(identite?.version ?? instance.version);

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

	/**
	 * L'ÉCRAN EST-IL BRANCHÉ SUR UNE ADRESSE ? C'est le point unique où la
	 * planche et le produit se séparent — même partage qu'en V-08 avec
	 * `recherchees`. Le chargeur pose toujours `typeMaitreDemande`, fût-ce à
	 * `null` ; le rendu d'une planche ne le pose jamais.
	 */
	const branche = $derived(typeMaitreDemande !== undefined);

	const reglage = $derived(vecteur ?? {});
	const moment = $derived(String(reglage['moment'] ?? 'aucun'));
	const casIsole = $derived(reglage['c-isole'] === true);

	/* ── Le graphe ──────────────────────────────────────────────────────────
	   Le périmètre est la première option du sélecteur, « Tous les domaines ». */
	/**
	 * LE PÉRIMÈTRE EFFECTIF — celui de l'adresse, à défaut « Tous les domaines »,
	 * la première option du sélecteur du gel et le défaut de la planche.
	 */
	const perimetre = $derived.by(() => {
		const brut = perimetreDemande ?? 'global|';
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
	 * LES TROIS MOMENTS ET LE CAS LIMITE, tels que les gestionnaires du gel les
	 * établissent (`V-20:3110` et `:3121`) — et rien de plus.
	 *
	 * `c-isole` n'agit QUE si aucun centre n'est déjà choisi : son vecteur
	 * laisse le moment à « aucun », donc le gestionnaire des moments ne s'est
	 * pas exécuté, et la case pose elle-même le type maître et son centre.
	 */
	const typeMaitreDePlanche = $derived(moment === 'aucun' && !casIsole ? null : 'Serveur');
	const centreDePlanche = $derived(
		moment === 'deplie'
			? 'n-pg-prod-01'
			: casIsole && moment === 'aucun'
				? 'n-coffre-hors-site'
				: null
	);

	const typeMaitre = $derived(branche ? (typeMaitreDemande ?? null) : typeMaitreDePlanche);
	const centre = $derived(branche ? (centreDemande ?? null) : centreDePlanche);
	const choisi = $derived(centre);

	/**
	 * `data-detail` n'est réglé que par le gestionnaire des moments — en planche.
	 * Branché, il suit le nœud choisi : le panneau de détail EXISTE au balisage de
	 * cette vue, il a donc quelque chose à montrer dès qu'un nœud est déplié.
	 */
	const detailOuvert = $derived(branche ? choisi !== null : moment === 'deplie');

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

	const voisins = $derived(centre === null || casIsole ? [] : voisinsDe(centre));

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
			`${note.titre}, ${typeDe(note).nom}, ${degreDe(id)} connexions` +
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

	/** Les trois premières propriétés du schéma de fiche, quand il en existe un. */
	const proprietesDuDetail = $derived.by(() => {
		const note = choisi === null ? undefined : noteDe(choisi);
		if (!note?.typeFiche) return [];
		return TYPES_FICHE[note.typeFiche].slice(0, 3).map((c) => ({
			nom: c.nom,
			valeur: c.exemple ?? c.valeurs?.[0] ?? '—'
		}));
	});

	const noteDuDetail = $derived(choisi === null ? undefined : noteDe(choisi));
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
	 * LA NAVIGATION N'A LIEU QUE BRANCHÉE — même règle qu'en V-08. Sans adresse,
	 * la vue rend un état de maquette hors de toute route, et y naviguer
	 * emmènerait la page de démonstration ailleurs.
	 *
	 * `svelte/no-navigation-without-resolve` inspecte l'expression passée à
	 * `goto()` : une adresse composée lui est opaque. La règle est levée sur
	 * cette seule ligne, comme `V-24` la lève pour les adresses de son rapport.
	 */
	function allerA(cible: string): void {
		if (!branche) return;
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
		if (!branche || choisi === null) return;
		void goto(resolve('/notes/[identifiant]', { identifiant: choisi }));
	}

	/**
	 * LES TROIS RACCOURCIS DE LA BARRE — la boîte de recherche, « Créer » et
	 * l'avatar. Les trois adresses sont des identifiants de route, que
	 * `resolve()` compose et que la règle de navigation sait vérifier.
	 */
	function allerALaRecherche(): void {
		if (branche) void goto(resolve('/recherche'));
	}

	function allerALaCreation(): void {
		if (branche) void goto(resolve('/notes/nouvelle'));
	}

	function allerAuProfil(): void {
		if (branche) void goto(resolve('/mon-profil'));
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
			>{`${maitres.length} ${(typeMaitreEncode?.nom ?? '').toLowerCase()}${maitres.length > 1 ? 's' : ''} — choisissez-en un pour déplier ses connexions`}</span
		>{:else}<button type="button" onclick={revenirALAnneau}
			>{`Tous les ${(typeMaitreEncode?.nom ?? '').toLowerCase()}s`}</button
		><span class="fil-deroule__sep">›</span><span class="fil-deroule__courant"
			>{titreDe(graphe, corpus, centre)}</span
		><span style="font-family:var(--f-donnee);font-size:var(--t-micro);color:var(--c-encre-3)"
			>{`${voisins.length}${voisins.length > 1 ? ' connexions' : ' connexion'}`}</span
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
						{#if proprietesDuDetail.length}<div class="detail__section">
								<span class="etiq">Propriétés</span>{#each proprietesDuDetail as p (p.nom)}<div
										class="prop"
									>
										<span class="prop__cle">{p.nom}</span><span>{p.valeur}</span>
									</div>{/each}
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
