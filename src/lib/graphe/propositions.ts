/**
 * LES PROPOSITIONS DE RELATION — ce que le produit AVANCE, et que personne n'a encore
 * confirmé.
 *
 * L'ORIGINE `ambigue` ATTENDAIT DEPUIS LA PREMIÈRE MIGRATION. `origine_de_relation`
 * porte trois valeurs, glosées par le cahier : `declaree` « saisie humaine »,
 * `deduite` « inférée par le produit », `ambigue` « à confirmer ». Les deux dernières
 * n'avaient aucun producteur. Ce module est celui de la troisième.
 *
 * CE QU'UNE PROPOSITION EST, ET CE QU'ELLE N'EST PAS. Une MENTION dit un fait : ce
 * corps cite cette note. Une PROPOSITION dit une hypothèse : ce fait ressemble à une
 * relation d'un certain type. La première ne se confirme pas — elle est vraie ou elle
 * n'existe pas. La seconde se confirme ou se rejette, et tant qu'on ne l'a pas fait,
 * elle reste distincte à l'écran.
 *
 * ══ LA RÈGLE, ET POURQUOI CELLE-CI ══
 *
 * UNE MENTION EST PROPOSÉE AVEC LE TYPE QUE LE CORPUS EMPLOIE DÉJÀ ENTRE CES DEUX
 * TYPES DE NOTES. On relève, sur les relations DÉCLARÉES du périmètre, quel type
 * revient entre un « Serveur » et une « Application » ; si un type domine
 * strictement et qu'il s'appuie sur assez d'exemples, les mentions du même couple le
 * reçoivent en proposition.
 *
 * LA PREMIÈRE VERSION NOMMAIT LES TYPES EN DUR — `heberge`, `depend`, `contact` — et
 * elle était FAUSSE. `types_de_relation` est une table ADMINISTRABLE : l'instance de
 * développement porte `depend-de`, `complete`, `corrige`, `remplace`, et pas une des
 * six clés du jeu de démonstration. Une règle écrite sur ce vocabulaire-là ne
 * proposait rien du tout sur une instance réelle, sans qu'aucun message ne le dise.
 * ICI, AUCUN NOM DE TYPE N'EST ÉCRIT : ils sortent tous des relations que
 * l'utilisateur a lui-même déclarées, donc du référentiel tel qu'il existe.
 *
 * ELLE SE TAIT PLUTÔT QUE DE DEVINER. Un corpus sans relation déclarée ne donne
 * aucune proposition, et c'est la réponse juste : le produit n'a rien sur quoi
 * s'appuyer. Il faut déclarer quelques relations à la main pour que la règle ait de
 * la matière — c'est ce qui fait d'elle une aide au travail commencé, jamais une
 * opinion sur un corpus qu'elle ne connaît pas.
 *
 * ELLE S'EXPLIQUE EN UNE PHRASE, et la porte : « d'après 7 relations déjà déclarées
 * entre Serveur et Application ». Une proposition qu'on ne peut pas contester est une
 * proposition qu'on ne peut pas refuser en connaissance de cause.
 */
import type { Note } from '../../../seeds/corpus';
import { typeCarto } from './cartographie';
import type { RelationLisible } from '../donnees/outils';

/**
 * LE NOMBRE D'EXEMPLES EN DEÇÀ DUQUEL UN COUPLE NE DÉCIDE RIEN. Une seule relation
 * déclarée entre un Serveur et une Application est une anecdote, pas un usage : la
 * généraliser ferait proposer, à partir d'un geste unique, autant de relations que le
 * corpus porte de citations.
 */
const SUPPORT_MINIMAL = 2;

/** La clé d'un couple de types, ORIENTÉE : source puis cible, jamais l'inverse. */
function cleDeCouple(source: string, cible: string): string {
	return source + ' → ' + cible;
}

export interface Proposition {
	readonly de: string;
	readonly vers: string;
	readonly type: string;
	/** Ce dont la proposition est tirée, en toutes lettres — l'écran le montre. */
	readonly motif: string;
}

interface UsageDUnCouple {
	readonly type: string;
	readonly exemples: number;
}

/**
 * L'USAGE DOMINANT DE CHAQUE COUPLE DE TYPES, relevé sur les relations DÉCLARÉES.
 *
 * DEUX CONDITIONS, ET LES DEUX COMPTENT : assez d'exemples (`SUPPORT_MINIMAL`), et un
 * type STRICTEMENT au-dessus des autres. Une égalité ne tranche pas — proposer l'un
 * des deux reviendrait à tirer au sort, et à faire porter le tirage par un écran qui
 * dit « à confirmer », donc à le faire passer pour un raisonnement.
 *
 * SEULES LES RELATIONS `declaree` COMPTENT. Une proposition qui s'appuierait sur
 * d'autres propositions se confirmerait elle-même : le premier couple posé par erreur
 * se répandrait sur tout le corpus au clic suivant.
 */
export function usagesParCouple(
	notes: readonly Note[],
	declarees: readonly RelationLisible[]
): ReadonlyMap<string, UsageDUnCouple> {
	const typeParNote = new Map(notes.map((n) => [n.id, typeCarto(n)] as const));

	const comptes = new Map<string, Map<string, number>>();
	for (const r of declarees) {
		if (r.origine !== 'declaree') continue;
		const source = typeParNote.get(r.de);
		const cible = typeParNote.get(r.vers);
		if (source === undefined || cible === undefined) continue;
		const cle = cleDeCouple(source, cible);
		const parType = comptes.get(cle) ?? new Map<string, number>();
		parType.set(r.type, (parType.get(r.type) ?? 0) + 1);
		comptes.set(cle, parType);
	}

	const dominants = new Map<string, UsageDUnCouple>();
	for (const [cle, parType] of [...comptes].sort((a, b) => a[0].localeCompare(b[0]))) {
		/* L'ordre du classement est déterministe : l'effectif d'abord, puis la clé du
		   type. Sans le second critère, deux types à égalité changeraient de rang au
		   gré de l'ordre d'insertion, et la condition de stricte domination ci-dessous
		   se lirait sur un classement instable. */
		const classes = [...parType].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
		const premier = classes[0];
		if (premier === undefined) continue;
		if (premier[1] < SUPPORT_MINIMAL) continue;
		const second = classes[1];
		if (second !== undefined && second[1] === premier[1]) continue;
		dominants.set(cle, { type: premier[0], exemples: premier[1] });
	}
	return dominants;
}

/**
 * LES PROPOSITIONS D'UN JEU DE MENTIONS.
 *
 * ELLES NE PORTENT QUE SUR LES MENTIONS, jamais sur des paires quelconques : le
 * produit n'invente pas un rapport, il QUALIFIE un rapport que le corps affirme déjà.
 * Une proposition sans mention derrière elle serait une pure supposition, et il n'y a
 * aucune raison de faire confirmer cela à quelqu'un.
 *
 * L'ORDRE RENDU EST CELUI DES MENTIONS, donc lexical et déterministe.
 */
export function propositionsDeMention(
	notes: readonly Note[],
	declarees: readonly RelationLisible[],
	mentions: readonly RelationLisible[]
): readonly Proposition[] {
	const usages = usagesParCouple(notes, declarees);
	if (usages.size === 0) return [];

	const typeParNote = new Map(notes.map((n) => [n.id, typeCarto(n)] as const));
	const proposees: Proposition[] = [];

	for (const mention of mentions) {
		const source = typeParNote.get(mention.de);
		const cible = typeParNote.get(mention.vers);
		if (source === undefined || cible === undefined) continue;
		const cle = cleDeCouple(source, cible);
		const usage = usages.get(cle);
		if (usage === undefined) continue;
		proposees.push({
			de: mention.de,
			vers: mention.vers,
			type: usage.type,
			motif:
				"d'après " +
				String(usage.exemples) +
				' relation' +
				(usage.exemples > 1 ? 's' : '') +
				' déjà déclarée' +
				(usage.exemples > 1 ? 's' : '') +
				' de ' +
				cle
		});
	}
	return proposees;
}
