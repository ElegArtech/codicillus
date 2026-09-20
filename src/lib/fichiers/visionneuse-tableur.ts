import { lireLeTableur, nomDeColonne, valeurDeCellule, type FeuilleDeTableur } from './tableur';

import { fenetreDeTableur, etendueDeTableur, positionDeDefilement } from './fenetre-tableur';
let prochaineVisionneuse = 0;

export async function afficherLeTableur(
	corps: HTMLElement,
	adresse: string,
	signal: AbortSignal
): Promise<void> {
	const doc = corps.ownerDocument;
	try {
		const reponse = await fetch(adresse, { signal, credentials: 'same-origin' });
		if (!reponse.ok) throw new Error('Le fichier n’a pas pu être chargé.');
		const octets = await reponse.arrayBuffer();
		if (signal.aborted) return;
		const feuilles = lireLeTableur(octets);
		if (signal.aborted) return;
		corps.replaceChildren();
		const racine = doc.createElement('div');
		racine.className = 'tableur';
		corps.append(racine);
		const information = doc.createElement('p');
		information.className = 'tableur__information';
		information.textContent =
			'Lecture seule · Valeurs enregistrées, sans recalcul des formules. Téléchargez l’original pour retrouver sa mise en forme et ses graphiques.';
		racine.append(information);
		if (feuilles.length === 0) {
			information.textContent =
				'Ce tableur ne contient aucune feuille. Téléchargez l’original pour l’ouvrir dans votre tableur.';
			return;
		}
		const onglets = doc.createElement('div');
		onglets.className = 'tableur__onglets';
		onglets.setAttribute('role', 'tablist');
		onglets.setAttribute('aria-label', 'Feuilles du tableur');
		const panneau = doc.createElement('div');
		panneau.className = 'tableur__feuille';
		panneau.id = `tableur-${++prochaineVisionneuse}`;
		panneau.setAttribute('role', 'tabpanel');
		racine.append(onglets, panneau);
		let defaireFeuille = (): void => {};
		signal.addEventListener('abort', () => defaireFeuille(), { once: true });
		const boutons = feuilles.map((feuille, index) => {
			const bouton = doc.createElement('button');
			bouton.type = 'button';
			bouton.className = 'btn btn--discret';
			bouton.textContent = feuille.nom;
			bouton.id = `${panneau.id}-feuille-${index}`;
			bouton.setAttribute('role', 'tab');
			bouton.setAttribute('aria-controls', panneau.id);
			bouton.addEventListener('click', () => choisir(index));
			bouton.addEventListener('keydown', (evenement) => {
				let suivant: number;
				if (evenement.key === 'ArrowRight') suivant = (index + 1) % feuilles.length;
				else if (evenement.key === 'ArrowLeft')
					suivant = (index + feuilles.length - 1) % feuilles.length;
				else if (evenement.key === 'Home') suivant = 0;
				else if (evenement.key === 'End') suivant = feuilles.length - 1;
				else return;
				evenement.preventDefault();
				choisir(suivant);
				boutons[suivant]?.focus();
			});
			onglets.append(bouton);
			return bouton;
		});
		function choisir(index: number): void {
			const boutonChoisi = boutons[index];
			const feuilleChoisie = feuilles[index];
			if (!boutonChoisi || !feuilleChoisie) return;
			boutons.forEach((bouton, rang) => {
				bouton.setAttribute('aria-selected', String(rang === index));
				bouton.tabIndex = rang === index ? 0 : -1;
			});
			panneau.setAttribute('aria-labelledby', boutonChoisi.id);
			defaireFeuille();
			defaireFeuille = afficherLaFeuille(panneau, feuilleChoisie);
		}
		choisir(0);
	} catch {
		if (signal.aborted) return;
		corps.replaceChildren();
		const erreur = doc.createElement('p');
		erreur.className = 'tableur__message';
		erreur.setAttribute('role', 'alert');
		erreur.textContent =
			'Impossible de lire ce tableur. Le fichier peut être endommagé, protégé par un mot de passe ou dans un format non pris en charge. Téléchargez l’original pour l’ouvrir dans votre tableur.';
		corps.append(erreur);
	}
}

function afficherLaFeuille(panneau: HTMLElement, feuille: FeuilleDeTableur): () => void {
	const doc = panneau.ownerDocument;
	panneau.replaceChildren();
	if (feuille.finLigne < 0 || feuille.finColonne < 0) {
		const vide = doc.createElement('p');
		vide.className = 'tableur__message';
		vide.textContent =
			'Cette feuille est vide. Choisissez une autre feuille ou téléchargez l’original pour la compléter.';
		panneau.append(vide);
		return () => {};
	}
	const nombreLignes = feuille.finLigne - feuille.debutLigne + 1;
	const nombreColonnes = feuille.finColonne - feuille.debutColonne + 1;
	const selection = doc.createElement('label');
	selection.className = 'tableur__selection';
	const adresseSelection = doc.createElement('span');
	adresseSelection.textContent = 'Valeur de la cellule';
	const valeurSelection = doc.createElement('textarea');
	valeurSelection.readOnly = true;
	valeurSelection.rows = 2;
	valeurSelection.placeholder =
		'Sélectionnez une cellule pour lire sa valeur complète. Les flèches du clavier permettent de parcourir la grille.';
	selection.append(adresseSelection, valeurSelection);
	const annonce = doc.createElement('p');
	annonce.className = 'tableur__plage';
	annonce.textContent = `${nombreLignes} lignes · ${nombreColonnes} colonnes`;
	const defilement = doc.createElement('div');
	defilement.className = 'tableur__defilement';
	defilement.tabIndex = 0;
	defilement.setAttribute('role', 'grid');
	defilement.setAttribute('aria-label', `Cellules de ${feuille.nom}`);
	defilement.setAttribute('aria-rowcount', String(feuille.finLigne + 2));
	defilement.setAttribute('aria-colcount', String(feuille.finColonne + 2));
	defilement.setAttribute('aria-readonly', 'true');
	const table = doc.createElement('table');
	table.className = 'tableur__grille';
	table.setAttribute('role', 'presentation');
	defilement.append(table);
	panneau.append(selection, annonce, defilement);

	// Les mesures viennent des mêmes jetons que la feuille de style.
	const styles = getComputedStyle(defilement);
	const hauteurLigne = parseFloat(styles.getPropertyValue('--tableur-hauteur-ligne'));
	const largeurColonne = parseFloat(styles.getPropertyValue('--tableur-largeur-colonne'));
	const largeurNumero = parseFloat(styles.getPropertyValue('--tableur-largeur-numero'));
	table.style.width = `${largeurNumero + etendueDeTableur(nombreColonnes, largeurColonne)}px`;
	let selectionnee: { ligne: number; colonne: number } | null = null;
	let derniereFenetre = '';
	let animation: number | null = null;
	let detruit = false;

	function identifiantCellule(ligne: number, colonne: number): string {
		return `${panneau.id}-cellule-${ligne}-${colonne}`;
	}
	function annoncerLaSelection(): void {
		if (!selectionnee) return;
		const { ligne, colonne } = selectionnee;
		adresseSelection.textContent = `Cellule ${nomDeColonne(colonne)}${ligne + 1}`;
		valeurSelection.value = valeurDeCellule(feuille, ligne, colonne);
		defilement.setAttribute('aria-activedescendant', identifiantCellule(ligne, colonne));
	}
	function choisir(ligne: number, colonne: number): void {
		selectionnee = { ligne, colonne };
		annoncerLaSelection();
		derniereFenetre = '';
		rendre();
		defilement.focus({ preventScroll: true });
	}
	function montrerLaSelection(): void {
		if (!selectionnee) return;
		const haut = (selectionnee.ligne - feuille.debutLigne) * hauteurLigne;
		const gauche = (selectionnee.colonne - feuille.debutColonne) * largeurColonne;
		const hauteurVisible = Math.max(hauteurLigne, defilement.clientHeight - hauteurLigne);
		const largeurVisible = Math.max(largeurColonne, defilement.clientWidth - largeurNumero);
		const hautAvant = positionDeDefilement(haut, nombreLignes, hauteurLigne, hauteurVisible);
		const hautApres = positionDeDefilement(
			haut + hauteurLigne - hauteurVisible,
			nombreLignes,
			hauteurLigne,
			hauteurVisible
		);
		const gaucheAvant = positionDeDefilement(
			gauche,
			nombreColonnes,
			largeurColonne,
			largeurVisible
		);
		const gaucheApres = positionDeDefilement(
			gauche + largeurColonne - largeurVisible,
			nombreColonnes,
			largeurColonne,
			largeurVisible
		);
		if (defilement.scrollTop > hautAvant) defilement.scrollTop = hautAvant;
		else if (defilement.scrollTop < hautApres) defilement.scrollTop = hautApres;
		if (defilement.scrollLeft > gaucheAvant) defilement.scrollLeft = gaucheAvant;
		else if (defilement.scrollLeft < gaucheApres) defilement.scrollLeft = gaucheApres;
	}

	function auClavier(evenement: KeyboardEvent): void {
		if (
			![
				'ArrowDown',
				'ArrowUp',
				'ArrowLeft',
				'ArrowRight',
				'Home',
				'End',
				'PageDown',
				'PageUp'
			].includes(evenement.key)
		)
			return;
		evenement.preventDefault();
		let ligne =
			selectionnee?.ligne ??
			Math.min(
				feuille.finLigne,
				feuille.debutLigne +
					fenetreDeTableur(
						nombreLignes,
						hauteurLigne,
						defilement.scrollTop,
						defilement.clientHeight - hauteurLigne,
						0
					).debut
			);
		let colonne =
			selectionnee?.colonne ??
			Math.min(
				feuille.finColonne,
				feuille.debutColonne +
					fenetreDeTableur(
						nombreColonnes,
						largeurColonne,
						defilement.scrollLeft,
						defilement.clientWidth - largeurNumero,
						0
					).debut
			);
		const hauteurVisible = Math.max(1, Math.floor(defilement.clientHeight / hauteurLigne) - 1);
		if (evenement.key === 'ArrowDown') ligne++;
		if (evenement.key === 'ArrowUp') ligne--;
		if (evenement.key === 'ArrowRight') colonne++;
		if (evenement.key === 'ArrowLeft') colonne--;
		if (evenement.key === 'PageDown') ligne += hauteurVisible;
		if (evenement.key === 'PageUp') ligne -= hauteurVisible;
		if (evenement.key === 'Home') {
			colonne = feuille.debutColonne;
			if (evenement.ctrlKey || evenement.metaKey) ligne = feuille.debutLigne;
		}
		if (evenement.key === 'End') {
			colonne = feuille.finColonne;
			if (evenement.ctrlKey || evenement.metaKey) ligne = feuille.finLigne;
		}
		selectionnee = {
			ligne: Math.min(feuille.finLigne, Math.max(feuille.debutLigne, ligne)),
			colonne: Math.min(feuille.finColonne, Math.max(feuille.debutColonne, colonne))
		};
		montrerLaSelection();
		choisir(selectionnee.ligne, selectionnee.colonne);
	}
	function auClic(evenement: MouseEvent): void {
		const cible = evenement.target;
		if (!(cible instanceof Element)) return;
		const cellule = cible.closest<HTMLElement>('[data-cellule-ligne]');
		if (!cellule) return;
		choisir(Number(cellule.dataset['celluleLigne']), Number(cellule.dataset['celluleColonne']));
	}
	function programmer(): void {
		if (animation !== null || detruit) return;
		animation = requestAnimationFrame(() => {
			animation = null;
			rendre();
		});
	}
	function rendre(): void {
		if (detruit || defilement.clientWidth === 0 || defilement.clientHeight === 0) return;
		const lignes = fenetreDeTableur(
			nombreLignes,
			hauteurLigne,
			defilement.scrollTop,
			defilement.clientHeight - hauteurLigne,
			5
		);
		const colonnes = fenetreDeTableur(
			nombreColonnes,
			largeurColonne,
			defilement.scrollLeft,
			defilement.clientWidth - largeurNumero,
			2
		);
		const cle = `${lignes.debut}:${lignes.fin}:${lignes.avant}:${colonnes.debut}:${colonnes.fin}:${colonnes.avant}`;
		if (cle === derniereFenetre) return;
		derniereFenetre = cle;
		const largeurs = doc.createElement('colgroup');
		function largeur(valeur: number): void {
			const col = doc.createElement('col');
			col.style.width = `${valeur}px`;
			largeurs.append(col);
		}
		largeur(largeurNumero);
		if (colonnes.avant) largeur(colonnes.avant);
		for (let colonne = colonnes.debut; colonne <= colonnes.fin; colonne++) largeur(largeurColonne);
		if (colonnes.apres) largeur(colonnes.apres);
		function espaceHorizontal(rangee: HTMLTableRowElement, largeur: number): void {
			if (!largeur) return;
			const espace = doc.createElement('td');
			espace.className = 'tableur__espace';
			espace.setAttribute('aria-hidden', 'true');
			rangee.append(espace);
		}
		const tete = doc.createElement('thead');
		tete.setAttribute('role', 'rowgroup');
		const titres = doc.createElement('tr');
		titres.setAttribute('role', 'row');
		titres.setAttribute('aria-rowindex', '1');
		const coin = doc.createElement('th');
		coin.className = 'tableur__coin';
		coin.scope = 'col';
		coin.setAttribute('role', 'columnheader');
		coin.textContent = 'Ligne';
		titres.append(coin);
		espaceHorizontal(titres, colonnes.avant);
		for (let colonne = colonnes.debut; colonne <= colonnes.fin; colonne++) {
			const titre = doc.createElement('th');
			titre.scope = 'col';
			titre.setAttribute('role', 'columnheader');
			titre.setAttribute('aria-colindex', String(feuille.debutColonne + colonne + 2));
			titre.textContent = nomDeColonne(feuille.debutColonne + colonne);
			titres.append(titre);
		}
		espaceHorizontal(titres, colonnes.apres);
		tete.append(titres);
		const corps = doc.createElement('tbody');
		corps.setAttribute('role', 'rowgroup');
		function espaceVertical(hauteur: number): void {
			if (!hauteur) return;
			const rangee = doc.createElement('tr');
			rangee.setAttribute('aria-hidden', 'true');
			const espace = doc.createElement('td');
			espace.className = 'tableur__espace';
			espace.colSpan = largeurs.children.length;
			espace.style.height = `${hauteur}px`;
			rangee.append(espace);
			corps.append(rangee);
		}
		espaceVertical(lignes.avant);
		for (let index = lignes.debut; index <= lignes.fin; index++) {
			const ligne = feuille.debutLigne + index;
			const rangee = doc.createElement('tr');
			rangee.setAttribute('role', 'row');
			rangee.setAttribute('aria-rowindex', String(ligne + 2));
			const numero = doc.createElement('th');
			numero.scope = 'row';
			numero.setAttribute('role', 'rowheader');
			numero.textContent = String(ligne + 1);
			rangee.append(numero);
			espaceHorizontal(rangee, colonnes.avant);
			for (let indexColonne = colonnes.debut; indexColonne <= colonnes.fin; indexColonne++) {
				const colonne = feuille.debutColonne + indexColonne;
				const cellule = doc.createElement('td');
				cellule.id = identifiantCellule(ligne, colonne);
				cellule.setAttribute('role', 'gridcell');
				cellule.setAttribute('aria-colindex', String(colonne + 2));
				cellule.setAttribute(
					'aria-selected',
					String(selectionnee?.ligne === ligne && selectionnee?.colonne === colonne)
				);
				cellule.dataset['celluleLigne'] = String(ligne);
				cellule.dataset['celluleColonne'] = String(colonne);
				const texte = doc.createElement('span');
				texte.className = 'tableur__valeur';
				texte.textContent = valeurDeCellule(feuille, ligne, colonne);
				cellule.title = texte.textContent;
				cellule.append(texte);
				rangee.append(cellule);
			}
			espaceHorizontal(rangee, colonnes.apres);
			corps.append(rangee);
		}
		espaceVertical(lignes.apres);
		table.replaceChildren(largeurs, tete, corps);
		if (
			selectionnee &&
			!table.querySelector(`[id="${identifiantCellule(selectionnee.ligne, selectionnee.colonne)}"]`)
		)
			defilement.removeAttribute('aria-activedescendant');
		else if (selectionnee) annoncerLaSelection();
	}
	defilement.addEventListener('scroll', programmer, { passive: true });
	defilement.addEventListener('keydown', auClavier);
	defilement.addEventListener('click', auClic);
	const observer = new ResizeObserver(programmer);
	observer.observe(defilement);
	rendre();
	return () => {
		detruit = true;
		observer.disconnect();
		if (animation !== null) cancelAnimationFrame(animation);
		defilement.removeEventListener('scroll', programmer);
		defilement.removeEventListener('keydown', auClavier);
		defilement.removeEventListener('click', auClic);
	};
}
