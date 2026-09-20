import { lireLeTableur, nomDeColonne, valeurDeCellule, type FeuilleDeTableur } from './tableur';

const LIGNES_PAR_LOT = 100;
const COLONNES_PAR_LOT = 20;
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
			afficherLaFeuille(panneau, feuilleChoisie);
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

function afficherLaFeuille(panneau: HTMLElement, feuille: FeuilleDeTableur): void {
	const doc = panneau.ownerDocument;
	panneau.replaceChildren();
	if (feuille.finLigne < 0 || feuille.finColonne < 0) {
		const vide = doc.createElement('p');
		vide.className = 'tableur__message';
		vide.textContent =
			'Cette feuille est vide. Choisissez une autre feuille ou téléchargez l’original pour la compléter.';
		panneau.append(vide);
		return;
	}
	let debutLigne = feuille.debutLigne;
	let debutColonne = feuille.debutColonne;
	const commandes = doc.createElement('div');
	commandes.className = 'tableur__commandes';
	const annonce = doc.createElement('p');
	annonce.className = 'tableur__plage';
	annonce.setAttribute('role', 'status');
	const defilement = doc.createElement('div');
	defilement.className = 'tableur__defilement';
	defilement.tabIndex = 0;
	defilement.setAttribute('role', 'region');
	defilement.setAttribute('aria-label', `Cellules de ${feuille.nom}`);
	panneau.append(commandes, annonce, defilement);

	function pagination(
		libelle: string,
		taille: number,
		minimum: number,
		maximum: number,
		lire: () => number,
		changer: (debut: number) => void
	): () => void {
		const groupe = doc.createElement('div');
		groupe.className = 'tableur__pagination';
		const precedent = doc.createElement('button');
		precedent.type = 'button';
		precedent.className = 'btn btn--discret';
		precedent.textContent = '←';
		precedent.setAttribute('aria-label', `${libelle} précédentes`);
		const suivant = doc.createElement('button');
		suivant.type = 'button';
		suivant.className = 'btn btn--discret';
		suivant.textContent = '→';
		suivant.setAttribute('aria-label', `${libelle} suivantes`);
		const etiquette = doc.createElement('label');
		etiquette.textContent = `${libelle} à partir de `;
		const champ = doc.createElement('input');
		champ.type = 'number';
		champ.min = String(minimum + 1);
		champ.max = String(maximum + 1);
		champ.step = '1';
		etiquette.append(champ);
		const aller = (position: number): void => {
			changer(Math.min(maximum, Math.max(minimum, Math.floor(position))));
			rendre();
		};
		precedent.addEventListener('click', () => aller(lire() - taille));
		suivant.addEventListener('click', () => aller(lire() + taille));
		champ.addEventListener('change', () => {
			if (champ.value !== '' && Number.isFinite(champ.valueAsNumber))
				aller(champ.valueAsNumber - 1);
			else champ.value = String(lire() + 1);
		});
		groupe.append(precedent, etiquette, suivant);
		commandes.append(groupe);
		return () => {
			champ.value = String(lire() + 1);
			precedent.disabled = lire() <= minimum;
			suivant.disabled = lire() + taille > maximum;
		};
	}
	const actualiserLignes = pagination(
		'Lignes',
		LIGNES_PAR_LOT,
		feuille.debutLigne,
		feuille.finLigne,
		() => debutLigne,
		(valeur) => {
			debutLigne = valeur;
		}
	);
	const actualiserColonnes = pagination(
		'Colonnes',
		COLONNES_PAR_LOT,
		feuille.debutColonne,
		feuille.finColonne,
		() => debutColonne,
		(valeur) => {
			debutColonne = valeur;
		}
	);
	function rendre(): void {
		actualiserLignes();
		actualiserColonnes();
		const finLigne = Math.min(feuille.finLigne, debutLigne + LIGNES_PAR_LOT - 1);
		const finColonne = Math.min(feuille.finColonne, debutColonne + COLONNES_PAR_LOT - 1);
		annonce.textContent = `Lignes ${debutLigne + 1}–${finLigne + 1} sur ${feuille.finLigne + 1} · Colonnes ${nomDeColonne(debutColonne)}–${nomDeColonne(finColonne)} sur ${nomDeColonne(feuille.finColonne)}`;
		const table = doc.createElement('table');
		table.className = 'tableur__grille';
		const legende = doc.createElement('caption');
		legende.className = 'hors-ecran';
		legende.textContent = feuille.nom;
		const tete = doc.createElement('thead');
		const titres = doc.createElement('tr');
		const coin = doc.createElement('th');
		coin.scope = 'col';
		coin.textContent = 'Ligne';
		titres.append(coin);
		for (let colonne = debutColonne; colonne <= finColonne; colonne++) {
			const titre = doc.createElement('th');
			titre.scope = 'col';
			titre.textContent = nomDeColonne(colonne);
			titres.append(titre);
		}
		tete.append(titres);
		const lignes = doc.createElement('tbody');
		for (let ligne = debutLigne; ligne <= finLigne; ligne++) {
			const rangee = doc.createElement('tr');
			const numero = doc.createElement('th');
			numero.scope = 'row';
			numero.textContent = String(ligne + 1);
			rangee.append(numero);
			for (let colonne = debutColonne; colonne <= finColonne; colonne++) {
				const cellule = doc.createElement('td');
				cellule.textContent = valeurDeCellule(feuille, ligne, colonne);
				rangee.append(cellule);
			}
			lignes.append(rangee);
		}
		table.append(legende, tete, lignes);
		defilement.replaceChildren(table);
		defilement.scrollTop = 0;
		defilement.scrollLeft = 0;
	}
	rendre();
}
