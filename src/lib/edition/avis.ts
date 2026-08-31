/**
 * LES BANDEAUX D'AVERTISSEMENT DE L'ÉDITEUR — le contenu de `div#avis`, que V-17 et V-18
 * rendent VIDE en tête de la colonne de rédaction : « les deux avis de V-17, échec
 * d'enregistrement et doublon détecté, ne se posent qu'après un geste ».
 *
 * ILS SONT COMPOSÉS ICI, ET PAS DANS `src/vues/` (`ARB-063`) : ce sont des nœuds qui
 * naissent d'un geste — une frappe dans le titre, un brouillon retrouvé —, et la vue ne
 * les connaît qu'à travers leur conteneur. Les classes sont celles de la feuille gelée
 * (`V-17.css:574-590`), qui les porte déjà toutes : rien n'est stylé ici.
 *
 * UNE CLÉ PAR AVIS, ET ELLE EST SA PLACE : reposer un avis remplace le précédent de même
 * clé, si bien qu'une frappe de plus dans le titre ne fait pas s'empiler cinq bandeaux.
 */

/** Un bouton d'avis — un geste d'écran, jamais une écriture. */
export interface ActionDAvis {
	readonly libelle: string;
	readonly faire: () => void;
}

/** Un lien d'avis — une note du produit, qu'on va lire. */
export interface LienDAvis {
	readonly libelle: string;
	readonly adresse: string;
	/**
	 * Ouvrir dans un onglet neuf. C'est le cas des notes proches : le rédacteur est en
	 * train d'écrire, et l'avertissement l'invite à LIRE l'existante — pas à quitter sa
	 * page.
	 */
	readonly nouvelOnglet?: boolean;
}

/**
 * Les trois teintes de bandeau. Elles sont NOMMÉES PAR CE QU'ELLES DISENT, pas par la
 * classe qui les peint : la feuille gelée appelle l'ambre `avis--doublon` parce que
 * l'avertissement de doublon en était le seul porteur, et le brouillon local, qui n'est
 * pas un doublon, la porte aussi. `CLASSE_DE_VARIANTE` fait la traduction, une fois.
 */
export type VarianteDAvis = 'alerte' | 'erreur' | 'info';

const CLASSE_DE_VARIANTE: Readonly<Record<VarianteDAvis, string>> = {
	alerte: 'avis--doublon',
	erreur: 'avis--erreur',
	info: 'avis--info'
};

export interface Avis {
	readonly cle: string;
	readonly variante: VarianteDAvis;
	readonly titre: string;
	readonly texte: string;
	readonly liens?: readonly LienDAvis[];
	readonly actions?: readonly ActionDAvis[];
	/**
	 * Ce que le bouton de fermeture fait EN PLUS de retirer le bandeau. L'avis de
	 * doublon s'en sert pour se taire tant que le titre ne change pas : sans cela, la
	 * frappe suivante le reposerait, et le bouton ne fermerait rien.
	 */
	readonly auMasquage?: () => void;
}

/** Le conteneur du gel. Absent — la vue n'est pas montée —, rien ne se pose. */
function boite(racine: ParentNode): Element | null {
	return racine.querySelector('#avis');
}

export function retirerUnAvis(racine: ParentNode, cle: string): void {
	const zone = boite(racine);
	if (zone === null) return;
	for (const pose of Array.from(zone.querySelectorAll(`[data-avis="${cle}"]`))) pose.remove();
}

/**
 * Pose l'avis, en remplaçant celui de même clé. Rend le nœud posé, ou `null` quand
 * l'écran n'a pas de conteneur.
 */
export function poserUnAvis(racine: ParentNode, avis: Avis): HTMLElement | null {
	const zone = boite(racine);
	if (zone === null) return null;
	retirerUnAvis(racine, avis.cle);
	const document = zone.ownerDocument;

	const bandeau = document.createElement('div');
	bandeau.className = `avis ${CLASSE_DE_VARIANTE[avis.variante]}`;
	bandeau.dataset['avis'] = avis.cle;

	const corps = document.createElement('div');
	corps.className = 'avis__corps';
	const titre = document.createElement('div');
	titre.className = 'avis__titre';
	titre.textContent = avis.titre;
	corps.appendChild(titre);
	const phrase = document.createElement('div');
	phrase.textContent = avis.texte;
	corps.appendChild(phrase);

	const liens = avis.liens ?? [];
	const actions = avis.actions ?? [];
	if (liens.length > 0 || actions.length > 0) {
		const barre = document.createElement('div');
		barre.className = 'avis__actions';
		for (const lien of liens) {
			const ancre = document.createElement('a');
			ancre.className = 'btn';
			ancre.href = lien.adresse;
			ancre.textContent = lien.libelle;
			if (lien.nouvelOnglet === true) {
				ancre.target = '_blank';
				ancre.rel = 'noopener';
			}
			barre.appendChild(ancre);
		}
		for (const action of actions) {
			const bouton = document.createElement('button');
			/* LE TYPE EST POSÉ, ET C'EST INDISPENSABLE : ces boutons naissent DANS le
			   formulaire de l'éditeur, et un bouton sans type y soumet la note. */
			bouton.type = 'button';
			bouton.className = 'btn';
			bouton.textContent = action.libelle;
			bouton.addEventListener('click', action.faire);
			barre.appendChild(bouton);
		}
		corps.appendChild(barre);
	}
	bandeau.appendChild(corps);

	const fermer = document.createElement('button');
	fermer.type = 'button';
	fermer.className = 'avis__fermer';
	fermer.setAttribute('aria-label', 'Masquer cet avertissement');
	fermer.textContent = '×';
	fermer.addEventListener('click', () => {
		bandeau.remove();
		avis.auMasquage?.();
	});
	bandeau.appendChild(fermer);

	zone.appendChild(bandeau);
	return bandeau;
}
