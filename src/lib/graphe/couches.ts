/**
 * LE PLACEMENT EN COUCHES — la disposition de `/modelisation`.
 *
 * POURQUOI IL N'Y A PAS DE FORCES ICI. La cartographie dispose par forces, et c'est
 * juste pour ce qu'elle fait : observer. Un modèle ne s'observe pas, il se LIT — « ce
 * serveur porte ces trois applications, dont deux dépendent de cette base ». Une
 * disposition par forces ne rend pas cette phrase : elle place au hasard des
 * répulsions, elle bouge d'un chargement à l'autre, et le sens d'une dépendance n'y
 * a aucune traduction géométrique. Ici, LA POSITION DIT LE SENS : ce qui est en haut
 * porte, ce qui est en bas dépend.
 *
 * IL EST DÉTERMINISTE, ET C'EST UNE EXIGENCE, PAS UN CONFORT. Un modèle qu'on rouvre
 * doit être le modèle qu'on a quitté, sinon on le relit en entier à chaque fois.
 * Aucun tirage n'entre dans ce fichier : les parcours suivent l'ordre lexical des
 * identifiants, et chaque égalité est tranchée par ce même ordre.
 *
 * LES CYCLES NE SONT PAS UNE ERREUR. Un corpus réel en porte — deux serveurs qui se
 * répliquent, deux notes qui se citent l'une l'autre. Un étagement exige un graphe
 * sans circuit : les arêtes qui REMONTENT sont donc écartées de l'étagement, et
 * rendues à l'appelant pour qu'il puisse les dessiner autrement. Elles ne sont pas
 * perdues, elles sont dites.
 */
import type { Graphe } from './cartographie';
import type { Relation } from '../../../seeds/corpus';

/** La clé d'une arête — le type compte : deux notes peuvent se relier deux fois. */
export function cleDArete(r: Relation): string {
	return r.de + '>' + r.vers + '>' + r.type;
}

export interface PlaceEnCouche {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	/** Le rang de la couche, 0 en haut — ce qui ne dépend de rien. */
	readonly couche: number;
	/** Le rang dans la couche, de gauche à droite. */
	readonly rang: number;
}

export interface DispositionEnCouches {
	readonly places: ReadonlyMap<string, PlaceEnCouche>;
	/** Le nombre de couches — zéro sur un graphe vide. */
	readonly nombreDeCouches: number;
	readonly largeur: number;
	readonly hauteur: number;
	/**
	 * LES ARÊTES QUI REMONTENT — celles qu'un circuit a obligé à écarter de
	 * l'étagement. La vue les dessine autrement : une dépendance qui remonte est un
	 * fait du corpus, et le taire ferait croire à un modèle acyclique qu'il n'est pas.
	 */
	readonly retours: ReadonlySet<string>;
	/**
	 * LES ARÊTES QUE L'ASSISE A ÉCARTÉES — dessinées, mais sans voix sur les
	 * positions. Elles sont DISTINCTES des retours, et ce n'est pas un détail : une
	 * mention écartée n'est pas une arête qui remonte, et l'écran ne dira jamais
	 * d'elle « ce lien referme un circuit ». À l'assise `tout`, cet ensemble est
	 * vide.
	 */
	readonly horsEtagement: ReadonlySet<string>;
}

/**
 * SUR QUOI L'ÉTAGEMENT S'APPUIE.
 *
 * `tout` : les arêtes déclarées ET les mentions — le dessin le plus riche, et celui
 * qui répond sur un corpus consolidé au lien de corps, où l'étagement sur les seules
 * déclarées donnerait UNE couche unique portant tout le périmètre : un peigne, pas
 * un modèle.
 *
 * `declarees` : les seules relations qu'un humain a saisies — le modèle au sens
 * strict, où la position ne doit rien à une citation.
 *
 * IL N'A PAS DE DÉFAUT, ET C'EST LA RÈGLE DE `SortDesIsolees` : un défaut ferait
 * pencher un appelant sans que personne l'ait décidé.
 *
 * IL PORTE SUR L'ORIGINE, PAS SUR L'ATTRIBUT DE DÉPENDANCE. `origine` dit QUI l'a
 * affirmé — un humain ou le corps d'une note —, et c'est la question de l'étagement.
 * `technique` dit ce que le lien PORTE, et c'est la question des points de rupture.
 * Étager sur les seules relations techniques effondrerait tout corpus documentaire
 * en une seule couche.
 */
export type AssiseDeLEtagement = 'tout' | 'declarees';

/** L'écart horizontal entre deux nœuds voisins d'une couche. */
const PAS_HORIZONTAL = 210;
/** L'écart vertical entre deux couches. */
const PAS_VERTICAL = 132;
const MARGE = 70;
/** Le nombre de passes d'ordonnancement — au-delà, le dessin ne bouge plus. */
const PASSES = 4;

const VIDE: DispositionEnCouches = {
	places: new Map(),
	nombreDeCouches: 0,
	largeur: MARGE * 2,
	hauteur: MARGE * 2,
	retours: new Set(),
	horsEtagement: new Set()
};

/**
 * LES ARÊTES QUI REMONTENT, relevées par un parcours en profondeur.
 *
 * Une arête est un RETOUR quand elle vise un nœud encore ouvert dans le parcours —
 * c'est la définition même d'une arête arrière, et c'est ce qui referme un circuit.
 * L'ordre de départ et l'ordre des voisins sont lexicaux : sur un circuit, LAQUELLE
 * des arêtes est déclarée retour dépend de cet ordre, et il faut donc qu'il ne bouge
 * jamais.
 */
function aretesDeRetour(
	ids: readonly string[],
	sortantes: ReadonlyMap<string, readonly Relation[]>
): Set<string> {
	const retours = new Set<string>();
	const clos = new Set<string>();
	const ouverts = new Set<string>();

	const descendre = (u: string): void => {
		ouverts.add(u);
		for (const r of sortantes.get(u) ?? []) {
			if (ouverts.has(r.vers)) {
				retours.add(cleDArete(r));
				continue;
			}
			if (!clos.has(r.vers)) descendre(r.vers);
		}
		ouverts.delete(u);
		clos.add(u);
	};

	for (const id of ids) if (!clos.has(id)) descendre(id);
	return retours;
}

/**
 * L'ÉTAGE DE CHAQUE NŒUD — le plus long chemin depuis un nœud que rien ne précède.
 *
 * LE PLUS LONG, ET NON LE PLUS COURT : c'est lui qui garantit qu'une arête descend
 * toujours d'au moins une couche, donc qu'aucune ne reste horizontale. Le parcours est
 * celui de Kahn, sa file tenue en ordre lexical pour que l'étagement ne dépende pas de
 * l'ordre où les arêtes sont arrivées.
 */
function etages(
	ids: readonly string[],
	sortantes: ReadonlyMap<string, readonly Relation[]>,
	retours: ReadonlySet<string>
): Map<string, number> {
	const restant = new Map<string, number>();
	for (const id of ids) restant.set(id, 0);
	for (const id of ids) {
		for (const r of sortantes.get(id) ?? []) {
			if (retours.has(cleDArete(r))) continue;
			if (!restant.has(r.vers)) continue;
			restant.set(r.vers, (restant.get(r.vers) ?? 0) + 1);
		}
	}

	const etage = new Map<string, number>();
	let file = ids.filter((id) => (restant.get(id) ?? 0) === 0);
	for (const id of file) etage.set(id, 0);

	while (file.length > 0) {
		const suivante: string[] = [];
		for (const u of file) {
			for (const r of sortantes.get(u) ?? []) {
				if (retours.has(cleDArete(r))) continue;
				const reste = restant.get(r.vers);
				if (reste === undefined) continue;
				etage.set(r.vers, Math.max(etage.get(r.vers) ?? 0, (etage.get(u) ?? 0) + 1));
				restant.set(r.vers, reste - 1);
				if (reste - 1 === 0) suivante.push(r.vers);
			}
		}
		file = suivante.sort();
	}

	/* UN NŒUD QUE LE PARCOURS N'A PAS ATTEINT NE DISPARAÎT PAS. Il ne devrait pas y en
	   avoir — les retours cassent tous les circuits —, mais un nœud sans étage serait
	   un nœud sans place, donc un nœud absent du dessin sans qu'aucun réglage ne le
	   dise. Il tombe à la première couche. */
	for (const id of ids) if (!etage.has(id)) etage.set(id, 0);
	return etage;
}

/**
 * L'ORDRE DANS CHAQUE COUCHE — le barycentre des voisins, en passes alternées.
 *
 * Le but est de croiser le moins de traits possible : un nœud se place au milieu de
 * ceux auxquels il tient. Les passes descendent puis remontent, parce qu'un nœud tient
 * à ses deux côtés ; quatre suffisent, au-delà le dessin ne bouge plus.
 *
 * CHAQUE ÉGALITÉ EST TRANCHÉE PAR L'IDENTIFIANT — un nœud sans voisin dans la couche
 * de référence garde son rang, et deux barycentres égaux se rangent dans l'ordre du
 * corpus. Sans cette règle, l'ordre dépendrait de la stabilité du tri de la machine.
 */
function ordonner(
	parCouche: readonly string[][],
	sortantes: ReadonlyMap<string, readonly Relation[]>,
	entrantes: ReadonlyMap<string, readonly Relation[]>,
	retours: ReadonlySet<string>
): string[][] {
	const couches = parCouche.map((c) => [...c].sort());

	const barycentre = (
		id: string,
		voisines: ReadonlyMap<string, readonly Relation[]>,
		extremite: 'de' | 'vers',
		rangs: ReadonlyMap<string, number>
	): number | null => {
		let somme = 0;
		let compte = 0;
		for (const r of voisines.get(id) ?? []) {
			if (retours.has(cleDArete(r))) continue;
			const rang = rangs.get(r[extremite]);
			if (rang === undefined) continue;
			somme += rang;
			compte += 1;
		}
		return compte === 0 ? null : somme / compte;
	};

	const passer = (descendante: boolean): void => {
		const indices = descendante
			? [...couches.keys()].slice(1)
			: [...couches.keys()].slice(0, -1).reverse();
		for (const i of indices) {
			const reference = couches[descendante ? i - 1 : i + 1] ?? [];
			const rangs = new Map(reference.map((id, rang) => [id, rang] as const));
			const courante = couches[i] ?? [];
			const rangInitial = new Map(courante.map((id, rang) => [id, rang] as const));
			couches[i] = [...courante].sort((a, b) => {
				const ba = barycentre(
					a,
					descendante ? entrantes : sortantes,
					descendante ? 'de' : 'vers',
					rangs
				);
				const bb = barycentre(
					b,
					descendante ? entrantes : sortantes,
					descendante ? 'de' : 'vers',
					rangs
				);
				const va = ba ?? rangInitial.get(a) ?? 0;
				const vb = bb ?? rangInitial.get(b) ?? 0;
				return va - vb || a.localeCompare(b);
			});
		}
	};

	for (let passe = 0; passe < PASSES; passe += 1) passer(passe % 2 === 0);
	return couches;
}

/**
 * L'ORIGINE D'UNE ARÊTE, quand le graphe la porte.
 *
 * `Graphe.aretes` est typé `Relation` — la forme du corpus, qui ne connaît pas les
 * colonnes ajoutées par la base. Les objets, EUX, sont ceux de `RelationLisible` et
 * portent `origine` : la lecture est donc sûre en fait, et prudente en type. Une
 * arête sans origine lisible est tenue pour DÉCLARÉE, parce que c'est la valeur par
 * défaut de la colonne et qu'écarter par défaut ferait disparaître d'un étagement
 * des arêtes que personne n'a voulu écarter.
 */
function origineDe(r: Relation): string {
	const lue = (r as { readonly origine?: unknown }).origine;
	return typeof lue === 'string' ? lue : 'declaree';
}

/**
 * LA DISPOSITION EN COUCHES D'UN GRAPHE ORIENTÉ.
 *
 * L'ASSISE DIT SUR QUOI ELLE S'APPUIE, et elle est exigée : voir
 * `AssiseDeLEtagement`. Les arêtes que l'assise écarte sont DESSINÉES quand même —
 * elles sortent dans `horsEtagement` —, elles ne placent simplement rien.
 */
export function disposerEnCouches(g: Graphe, assise: AssiseDeLEtagement): DispositionEnCouches {
	if (g.noeuds.length === 0) return VIDE;

	const ids = g.noeuds.map((n) => n.id).sort();
	const presents = new Set(ids);

	const sortantes = new Map<string, Relation[]>();
	const entrantes = new Map<string, Relation[]>();
	for (const id of ids) {
		sortantes.set(id, []);
		entrantes.set(id, []);
	}
	/* L'ORDRE DES ARÊTES EST FIXÉ ICI, et il compte : c'est lui que suit le parcours
	   en profondeur, donc lui qui décide LAQUELLE des arêtes d'un circuit devient un
	   retour. L'ordre de la requête ne suffit pas — deux lectures peuvent le rendre
	   différemment si un jour un tri change. */
	const aretes = [...g.aretes]
		.filter((r) => presents.has(r.de) && presents.has(r.vers))
		.sort((a, b) => cleDArete(a).localeCompare(cleDArete(b)));
	for (const r of aretes) {
		sortantes.get(r.de)?.push(r);
		entrantes.get(r.vers)?.push(r);
	}

	/* LES ARÊTES QUE L'ASSISE ÉCARTE, relevées AVANT le parcours des retours : une
	   mention qui ne place rien ne doit pas non plus fermer un circuit, sans quoi
	   l'écran dirait d'elle qu'elle remonte alors qu'elle n'étage même pas. */
	const horsEtagement = new Set<string>(
		assise === 'declarees'
			? aretes.filter((r) => origineDe(r) !== 'declaree').map((r) => cleDArete(r))
			: []
	);
	const etageantes = new Map<string, Relation[]>();
	for (const id of ids) etageantes.set(id, []);
	for (const r of aretes) {
		if (horsEtagement.has(cleDArete(r))) continue;
		etageantes.get(r.de)?.push(r);
	}

	const retours = aretesDeRetour(ids, etageantes);
	/* LES DEUX ENSEMBLES RESTENT DISTINCTS AU-DEHORS, et ne se confondent que pour
	   les calculs : `etages()` et `ordonner()` écartent les deux, la vue n'en nomme
	   qu'un. */
	const ecartees = new Set([...retours, ...horsEtagement]);
	const etage = etages(ids, sortantes, ecartees);

	const hauteurEnCouches = Math.max(...ids.map((id) => etage.get(id) ?? 0)) + 1;
	const parCouche: string[][] = Array.from({ length: hauteurEnCouches }, () => []);
	for (const id of ids) parCouche[etage.get(id) ?? 0]?.push(id);

	const ordonnees = ordonner(parCouche, sortantes, entrantes, ecartees);

	const largeurUtile = Math.max(...ordonnees.map((c) => c.length)) * PAS_HORIZONTAL;
	const places = new Map<string, PlaceEnCouche>();
	for (const [couche, membres] of ordonnees.entries()) {
		/* CHAQUE COUCHE EST CENTRÉE sur la plus large : une couche de deux nœuds sous
		   une couche de neuf collée à gauche donnerait un dessin en escalier, où la
		   position horizontale voudrait dire quelque chose qu'elle ne dit pas. */
		const decalage = (largeurUtile - membres.length * PAS_HORIZONTAL) / 2;
		for (const [rang, id] of membres.entries()) {
			places.set(id, {
				id,
				x: MARGE + decalage + rang * PAS_HORIZONTAL + PAS_HORIZONTAL / 2,
				y: MARGE + couche * PAS_VERTICAL,
				couche,
				rang
			});
		}
	}

	return {
		places,
		nombreDeCouches: hauteurEnCouches,
		largeur: largeurUtile + MARGE * 2,
		hauteur: (hauteurEnCouches - 1) * PAS_VERTICAL + MARGE * 2,
		retours,
		horsEtagement
	};
}
