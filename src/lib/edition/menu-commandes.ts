import type { Command } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

const ENTREES = [
	['h1', 'Titre 1'],
	['h2', 'Titre 2'],
	['h3', 'Titre 3'],
	['citation', 'Citation'],
	['code', 'Code'],
	['taches', 'Liste de tâches'],
	['separateur', 'Séparateur'],
	['alerte-astuce', 'Astuce'],
	['alerte-attention', 'Attention'],
	['alerte-danger', 'Danger'],
	['tableau', 'Tableau'],
	['image', 'Image'],
	['lien', 'Lien'],
	['lien-interne', 'Lien interne'],
	['diagramme', 'Diagramme']
] as const;

/** Le menu réemploie les commandes de la barre et conserve le point d'insertion. */
export function menuDeCommandes(zone: HTMLElement, commandes: Record<string, Command>) {
	const menu = zone.ownerDocument.createElement('div');
	menu.className = 'commandes';
	menu.setAttribute('role', 'listbox');
	menu.setAttribute('aria-label', 'Blocs à insérer');
	zone.insertAdjacentElement('afterend', menu);
	let selection = 0;
	let fermeA: number | null = null;
	let dernierTexte = '';
	let vueCourante: EditorView | null = null;
	let choix: (typeof ENTREES)[number][] = [];
	const fermer = () => {
		menu.dataset['ouvert'] = 'non';
	};
	const prendre = (vue: EditorView, index: number) => {
		const entree = choix[index];
		if (!entree) return;
		const { $from } = vue.state.selection;
		fermeA = $from.start();
		vue.dispatch(vue.state.tr.delete($from.start(), $from.end()));
		commandes[entree[0]]?.(vue.state, vue.dispatch, vue);
		fermer();
		vue.focus();
	};
	menu.addEventListener('mousedown', (e) => e.preventDefault());
	const clicExterieur = (e: MouseEvent) => {
		if (!menu.contains(e.target as Node) && e.target !== zone && !zone.contains(e.target as Node)) {
			fermeA = vueCourante?.state.selection.$from.start() ?? null;
			fermer();
		}
	};
	zone.ownerDocument.addEventListener('mousedown', clicExterieur);
	return {
		actualiser(vue: EditorView) {
			vueCourante = vue;
			const { $from, empty } = vue.state.selection;
			const texte = $from.parent.textContent;
			if (!empty || $from.parent.type.name !== 'paragraph' || !/^\/[^\n]*$/.test(texte)) {
				fermeA = null;
				fermer();
				return;
			}
			if (fermeA === $from.start()) return;
			if (texte !== dernierTexte) selection = 0;
			dernierTexte = texte;
			const requete = texte.slice(1).toLocaleLowerCase('fr');
			choix = ENTREES.filter(([cle, libelle]) =>
				`${cle} ${libelle}`.toLocaleLowerCase('fr').includes(requete)
			);
			menu.replaceChildren();
			choix.forEach(([, libelle], i) => {
				const bouton = zone.ownerDocument.createElement('button');
				bouton.type = 'button';
				bouton.className = 'cmd';
				bouton.setAttribute('role', 'option');
				bouton.setAttribute('aria-selected', String(i === selection));
				bouton.textContent = libelle;
				bouton.addEventListener('click', () => prendre(vue, i));
				menu.append(bouton);
			});
			if (!choix.length) {
				const vide = zone.ownerDocument.createElement('p');
				vide.className = 'commandes__vide';
				vide.textContent = 'Aucun bloc correspondant';
				menu.append(vide);
			}
			menu.dataset['ouvert'] = 'oui';
		},
		clavier(vue: EditorView, evenement: KeyboardEvent) {
			if (menu.dataset['ouvert'] !== 'oui') return false;
			if (evenement.key === 'Escape') {
				fermeA = vue.state.selection.$from.start();
				fermer();
				return true;
			}
			if (evenement.key === 'Enter' && choix.length) {
				prendre(vue, selection);
				return true;
			}
			if (['ArrowDown', 'ArrowUp'].includes(evenement.key) && choix.length) {
				selection =
					(selection + (evenement.key === 'ArrowDown' ? 1 : -1) + choix.length) % choix.length;
				menu.querySelectorAll('[role=option]').forEach((e, i) => {
					e.setAttribute('aria-selected', String(i === selection));
					if (i === selection) e.scrollIntoView({ block: 'nearest' });
				});
				return true;
			}
			return false;
		},
		detruire() {
			zone.ownerDocument.removeEventListener('mousedown', clicExterieur);
			menu.remove();
		}
	};
}
