/**
 * Recherche et mise en évidence — port fidèle des fabriques des maquettes
 * gelées de l'espace public et de la page non trouvée connectée.
 *
 * PROVENANCE, ligne à ligne : `window.chercher()`, `window.chercherPublic()` et
 * `window.surligner()`, écrits à l'identique dans les cinq maquettes du lot
 * (`V-01:1215` et suivantes, mêmes corps dans V-02, V-03, V-04, V-26). Aucune
 * règle n'est ajoutée, aucune n'est retirée : ce qui n'est pas dans le gel
 * n'est pas ici.
 *
 * PÉRIMÈTRE PUBLIC — RG-M17-01, ET IL EST APPLIQUÉ AILLEURS QU'ICI.
 * Les quatre vues publiques réduisent leur corpus AU POINT D'ENTRÉE de la vue
 * — `window.CORPUS = window.corpusPublic()` (`V-01:1006`, V-02, V-03, V-04) —,
 * jamais au moment de l'affichage. `seeds/corpus.ts` porte la même restriction
 * au même endroit : `VUES_A_PERIMETRE_PUBLIC` et `notesPubliques()`. Ce module
 * ne filtre donc RIEN de lui-même : il cherche dans le jeu qu'on lui donne, et
 * c'est la vue qui décide de ce jeu. Une fonction qui filtrerait ici
 * déplacerait la contrainte hors de son point d'application et permettrait
 * qu'un appel l'oublie.
 *
 * CE QUI N'EST PAS PROUVÉ ICI. L'étanchéité réelle du périmètre public relève
 * de la batterie 6 (`pnpm test:etancheite`, livrée par T-012b le 20/08/2026 —
 * `/recherche` n'étant pas montée, sa case y est VACANTE), matrice routes ×
 * personas. Ce module rend un état de maquette ; il ne résout aucun droit.
 */
import type { Note } from '../../../seeds/corpus';

/**
 * LE PÉRIMÈTRE PUBLIC, ET IL VIT DÉSORMAIS ICI.
 *
 * `notesPubliques()` était importée de `seeds/corpus.ts` par V-01, V-02 et
 * V-04 : un APPEL DE FONCTION du jeu de démonstration, au point d'entrée de
 * trois écrans servis à un visiteur sans session. La fonction ne porte aucune
 * donnée du jeu — elle filtre celle qu'on lui donne —, mais l'importer faisait
 * du jeu une dépendance du produit, et sa forme là-bas admettait `CORPUS` en
 * argument par défaut : un appel sans argument rendait le corpus de
 * démonstration.
 *
 * Ici, l'argument est EXIGÉ, et la valeur comparée est typée contre
 * `Note['visibilite']` : renommer la valeur dans le corpus ne peut pas laisser
 * ce filtre en silence sur une constante devenue fausse.
 */
const VISIBILITE_PUBLIQUE: Note['visibilite'] = 'Publique';

/** Les seules notes atteignables depuis l'espace public — RG-M17-01. */
export function notesPubliques(notes: readonly Note[]): readonly Note[] {
	return notes.filter((n) => n.visibilite === VISIBILITE_PUBLIQUE);
}

/**
 * Correspondance tolérante : la requête est découpée en termes, un résultat
 * sort s'il porte TOUS les termes dans son titre, son extrait, ses étiquettes,
 * son domaine ou son type de fiche. Tolérance de racine à quatre caractères,
 * telle que le gel l'écrit — « suffisante pour la maquette », dit-il.
 */
export function chercher(notes: readonly Note[], requete: string): readonly Note[] {
	const termes = (requete || '').toLowerCase().split(/\s+/).filter(Boolean);
	if (!termes.length) return [];
	return notes.filter((n) => {
		const champ = (
			n.titre +
			' ' +
			n.extrait +
			' ' +
			n.etiquettes.join(' ') +
			' ' +
			n.domaine +
			' ' +
			(n.typeFiche || '')
		).toLowerCase();
		return termes.every((t) => {
			if (champ.indexOf(t) !== -1) return true;
			return t.length > 4 && champ.indexOf(t.slice(0, Math.max(4, t.length - 2))) !== -1;
		});
	});
}

/** Un morceau de texte, marqué ou non. `marque` rend un `<mark>`. */
export interface Segment {
	readonly texte: string;
	readonly marque: boolean;
}

/**
 * Découpe un texte selon les termes de la requête, sans jamais injecter de
 * balisage issu de la saisie — la propriété que `window.surligner()` obtient en
 * construisant des nœuds de texte, et que ce port obtient en rendant des
 * segments que Svelte échappe.
 *
 * Seuls les termes de plus de deux caractères marquent, comme au gel.
 */
export function segmenter(texte: string, requete: string): readonly Segment[] {
	const termes = (requete || '')
		.toLowerCase()
		.split(/\s+/)
		.filter((t) => t.length > 2);
	if (!termes.length) return [{ texte, marque: false }];
	const motif = new RegExp(
		'(' + termes.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
		'ig'
	);
	const segments: Segment[] = [];
	let dernier = 0;
	let m: RegExpExecArray | null;
	motif.lastIndex = 0;
	while ((m = motif.exec(texte)) !== null) {
		if (m.index > dernier) segments.push({ texte: texte.slice(dernier, m.index), marque: false });
		segments.push({ texte: m[0], marque: true });
		dernier = m.index + m[0].length;
		if (m.index === motif.lastIndex) motif.lastIndex++;
	}
	if (dernier < texte.length) segments.push({ texte: texte.slice(dernier), marque: false });
	return segments;
}

/**
 * Un nombre dans la forme des maquettes : `toLocaleString("fr-FR")`, qui rend
 * l'espace fine insécable comme séparateur de milliers.
 */
export function nombreFr(x: number): string {
	return x.toLocaleString('fr-FR');
}
