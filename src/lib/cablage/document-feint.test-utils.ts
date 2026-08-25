/**
 * UN DOCUMENT FEINT, ET POURQUOI IL EN FAUT UN.
 *
 * `vitest.config.ts` monte l'environnement `node` — aucun document n'existe —,
 * et la configuration est PARTAGÉE par tout le dépôt : la gréer d'une
 * implémentation complète du document pour deux fichiers de contrôle serait un
 * coût porté par les soixante et un autres. `facettes.test.ts` a posé le
 * précédent ; celui-ci l'élargit juste ce qu'il faut pour les deux modules qui
 * COMPOSENT des nœuds au lieu de les lire — `formulaires.ts` et `gestes.ts`.
 *
 * CE FICHIER N'EST PAS UN CONTRÔLE : son nom ne se termine pas par la marque
 * que `include` retient, et rien de `src/` ne l'importe.
 *
 * CE QU'IL FEINT, ET RIEN DE PLUS : créer un nœud — de balisage, de balisage
 * graphique, ou de texte —, l'attacher, lui poser un texte, une classe, un
 * identifiant, un attribut, une donnée ; le retrouver par un sélecteur simple ou
 * de descendance ; remonter à son plus proche ancêtre. Les modules éprouvés,
 * eux, sont les vrais.
 *
 * LE MOT DU DÉPÔT POUR UN NOM DE BALISE EST « BALISE » — `rendu.ts:154`,
 * `Coquille.svelte:96`. « tag » n'est écrit nulle part sinon dans les phrases
 * qui l'interdisent (`schema.ts:29`, `:396`, `seeds/corpus.ts:90`) et collé à
 * l'interface du document (`tagName`). Un identifiant librement choisi n'a
 * aucune raison de le rouvrir.
 */

/** Ce qu'un pas de sélecteur retient : un nom, un identifiant, des classes, des données. */
interface PasDeSelecteur {
	balise?: string;
	id?: string;
	readonly classes: readonly string[];
	readonly donnees: readonly string[];
}

function pas(fragment: string): PasDeSelecteur {
	const classes: string[] = [];
	const donnees: string[] = [];
	let balise: string | undefined;
	let id: string | undefined;
	const jetons = fragment.match(/#[\w-]+|\.[\w_-]+|\[[\w-]+\]|[a-zA-Z][\w-]*/g) ?? [];
	for (const jeton of jetons) {
		if (jeton.startsWith('#')) id = jeton.slice(1);
		else if (jeton.startsWith('.')) classes.push(jeton.slice(1));
		else if (jeton.startsWith('[')) donnees.push(jeton.slice(1, -1));
		else balise = jeton;
	}
	const rendu: PasDeSelecteur = { classes, donnees };
	if (balise !== undefined) rendu.balise = balise;
	if (id !== undefined) rendu.id = id;
	return rendu;
}

export interface DocumentFeint {
	createElement(balise: string): NoeudFeint;
	/* Les balises graphiques passent par leur espace de nommage — le feint n'en
	   retient que la balise, aucun sélecteur du dépôt ne portant sur l'espace. */
	createElementNS(espace: string, balise: string): NoeudFeint;
	createTextNode(texte: string): NoeudFeint;
}

export interface NoeudFeint {
	readonly balise: string;
	className: string;
	id: string;
	hidden: boolean;
	type: string;
	checked: boolean;
	value: string;
	placeholder: string;
	textContent: string;
	readonly dataset: Record<string, string | undefined>;
	readonly attributs: Record<string, string>;
	readonly enfants: NoeudFeint[];
	readonly ecoutes: string[];
	parent: NoeudFeint | null;
	readonly ownerDocument: DocumentFeint;
	appendChild(enfant: NoeudFeint): NoeudFeint;
	append(...enfants: NoeudFeint[]): void;
	replaceChildren(): void;
	addEventListener(type: string, ecoute: () => void): void;
	setAttribute(nom: string, valeur: string): void;
	getAttribute(nom: string): string | null;
	querySelector(selecteur: string): NoeudFeint | null;
	querySelectorAll(selecteur: string): NoeudFeint[];
	closest(selecteur: string): NoeudFeint | null;
	scrollIntoView(): void;
}

export function documentFeint(): DocumentFeint {
	const doc: DocumentFeint = {
		createElement(balise: string): NoeudFeint {
			return creer(balise, doc);
		},
		createElementNS(_espace: string, balise: string): NoeudFeint {
			return creer(balise, doc);
		},
		createTextNode(texte: string): NoeudFeint {
			const noeud = creer('#texte', doc);
			noeud.textContent = texte;
			return noeud;
		}
	};
	return doc;
}

function creer(balise: string, doc: DocumentFeint): NoeudFeint {
	let texte = '';
	const lui: NoeudFeint = {
		balise,
		className: '',
		id: '',
		hidden: false,
		type: '',
		checked: false,
		value: '',
		placeholder: '',
		dataset: {},
		attributs: {},
		enfants: [],
		ecoutes: [],
		parent: null,
		ownerDocument: doc,
		get textContent(): string {
			return texte + lui.enfants.map((e) => e.textContent).join('');
		},
		set textContent(valeur: string) {
			texte = valeur;
			lui.enfants.length = 0;
		},
		appendChild(enfant: NoeudFeint): NoeudFeint {
			enfant.parent = lui;
			lui.enfants.push(enfant);
			return enfant;
		},
		append(...enfants: NoeudFeint[]): void {
			for (const enfant of enfants) lui.appendChild(enfant);
		},
		replaceChildren(): void {
			lui.enfants.length = 0;
		},
		addEventListener(type: string): void {
			lui.ecoutes.push(type);
		},
		setAttribute(nom: string, valeur: string): void {
			lui.attributs[nom] = valeur;
		},
		getAttribute(nom: string): string | null {
			return lui.attributs[nom] ?? null;
		},
		querySelector(selecteur: string): NoeudFeint | null {
			return lui.querySelectorAll(selecteur)[0] ?? null;
		},
		querySelectorAll(selecteur: string): NoeudFeint[] {
			const trouves: NoeudFeint[] = [];
			for (const alternative of selecteur.split(',')) {
				const etapes = alternative.trim().split(/\s+/).map(pas);
				for (const noeud of descendants(lui)) {
					if (correspond(noeud, etapes) && !trouves.includes(noeud)) trouves.push(noeud);
				}
			}
			return trouves;
		},
		closest(selecteur: string): NoeudFeint | null {
			const etapes = selecteur.trim().split(/\s+/).map(pas);
			let courant: NoeudFeint | null = lui;
			while (courant !== null) {
				if (correspond(courant, etapes)) return courant;
				courant = courant.parent;
			}
			return null;
		},
		scrollIntoView(): void {}
	};
	return lui;
}

function descendants(racine: NoeudFeint): NoeudFeint[] {
	const rendu: NoeudFeint[] = [];
	for (const enfant of racine.enfants) {
		rendu.push(enfant, ...descendants(enfant));
	}
	return rendu;
}

/** Le dernier pas porte sur le nœud ; les précédents, sur ses ancêtres, dans l'ordre. */
function correspond(noeud: NoeudFeint, etapes: readonly PasDeSelecteur[]): boolean {
	const dernier = etapes[etapes.length - 1];
	if (dernier === undefined || !porte(noeud, dernier)) return false;
	let courant = noeud.parent;
	for (let rang = etapes.length - 2; rang >= 0; rang -= 1) {
		const etape = etapes[rang];
		if (etape === undefined) return false;
		while (courant !== null && !porte(courant, etape)) courant = courant.parent;
		if (courant === null) return false;
		courant = courant.parent;
	}
	return true;
}

function porte(noeud: NoeudFeint, etape: PasDeSelecteur): boolean {
	if (etape.balise !== undefined && etape.balise !== noeud.balise) return false;
	if (etape.id !== undefined && etape.id !== noeud.id) return false;
	const classes = noeud.className.split(/\s+/).filter((c) => c !== '');
	for (const classe of etape.classes) if (!classes.includes(classe)) return false;
	for (const donnee of etape.donnees) {
		const cle = donnee
			.replace(/^data-/, '')
			.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase());
		if (noeud.dataset[cle] === undefined && noeud.attributs[donnee] === undefined) return false;
	}
	return true;
}
