/**
 * LA COPIE RESTITUE CE QUE L'ÉCRAN MONTRE, pas ce que le navigateur en déduit.
 *
 * Chaque retour à la ligne de l'éditeur est un PARAGRAPHE, et les vues les posent sans
 * marge : à l'écran, deux paragraphes se suivent comme deux lignes. Le navigateur, lui,
 * sépare toujours deux paragraphes par une ligne vide en texte brut, et la destination
 * d'un collage riche leur rend ses propres marges. Ce module relève donc la mise en page
 * sur un arbre RENDU, puis en tire un texte et un balisage qui la respectent.
 *
 * Le relevé se fait en trois temps, parce que la géométrie ne se lit que sur un arbre
 * affiché alors que la copie se fabrique sur un clone : `marquerLaMiseEnPage()` sur
 * l'arbre affiché, le clonage par l'appelant, puis `harmoniserLeBalisage()` et
 * `texteFidele()` sur le clone, qui a emporté les marques.
 */

const COLLE = 'data-copie-colle';
const SANS_MARGE = 'data-copie-sans-marge';

/** Un caractère d'usage privé : aucune note ne le porte, et il survit à `innerText`. */
const SENTINELLE = '';
const AUTOUR_DE_LA_SENTINELLE = new RegExp(`\\n*${SENTINELLE}\\n*`, 'g');

function estAffiche(element: Element): boolean {
	return element.getClientRects().length > 0;
}

/** Deux blocs sont collés quand rien de visible ne les sépare — moins d'une demi-ligne. */
function sontColles(haut: Element, bas: Element, fenetre: Window): boolean {
	if (!estAffiche(haut) || !estAffiche(bas)) return false;
	const ecart = bas.getBoundingClientRect().top - haut.getBoundingClientRect().bottom;
	const taille = Number.parseFloat(fenetre.getComputedStyle(haut).fontSize) || 16;
	return ecart < taille / 2;
}

/**
 * Pose sur un arbre AFFICHÉ les deux constats dont la copie a besoin : quels
 * paragraphes n'ont aucune marge, et quels blocs touchent leur suivant. Rend le geste
 * qui retire ces marques de l'arbre affiché.
 */
export function marquerLaMiseEnPage(racine: Element): () => void {
	const fenetre = racine.ownerDocument.defaultView;
	if (fenetre === null) return () => {};
	for (const paragraphe of racine.querySelectorAll('p')) {
		const style = fenetre.getComputedStyle(paragraphe);
		if (
			Math.abs(Number.parseFloat(style.marginTop) || 0) < 0.5 &&
			Math.abs(Number.parseFloat(style.marginBottom) || 0) < 0.5
		)
			paragraphe.setAttribute(SANS_MARGE, '');
		const precedent = paragraphe.previousElementSibling;
		if (precedent !== null && sontColles(precedent, paragraphe, fenetre))
			precedent.setAttribute(COLLE, '');
		const suivant = paragraphe.nextElementSibling;
		if (suivant !== null && sontColles(paragraphe, suivant, fenetre))
			paragraphe.setAttribute(COLLE, '');
	}
	return () => retirerLesMarques(racine);
}

function retirerLesMarques(racine: ParentNode): void {
	for (const element of racine.querySelectorAll(`[${COLLE}], [${SANS_MARGE}]`)) {
		element.removeAttribute(COLLE);
		element.removeAttribute(SANS_MARGE);
	}
}

/**
 * Le balisage du presse-papiers : un paragraphe sans marge à l'écran le reste chez la
 * destination, qui sinon lui rendrait les siennes. Les marques sont retirées.
 */
export function harmoniserLeBalisage(racine: ParentNode): void {
	for (const paragraphe of racine.querySelectorAll<HTMLElement>(`p[${SANS_MARGE}]`))
		paragraphe.style.margin = '0';
	retirerLesMarques(racine);
}

/**
 * Le texte brut : celui d'`innerText`, qui respecte listes, tableaux et blocs de code,
 * mais un seul retour à la ligne entre deux blocs collés. `innerText` ne lit que les
 * nœuds rendus : le clone est posé hors écran le temps d'une lecture. Il est CONSOMMÉ.
 */
export function texteFidele(clone: HTMLElement): string {
	for (const element of clone.querySelectorAll(`[${COLLE}]`)) element.append(SENTINELLE);
	retirerLesMarques(clone);
	clone.setAttribute('aria-hidden', 'true');
	clone.style.cssText =
		'position:fixed;left:-10000px;top:0;width:800px;pointer-events:none;opacity:0';
	clone.ownerDocument.body.append(clone);
	const texte = clone.innerText;
	clone.remove();
	return texte.replace(AUTOUR_DE_LA_SENTINELLE, '\n').replaceAll(SENTINELLE, '').trim();
}
