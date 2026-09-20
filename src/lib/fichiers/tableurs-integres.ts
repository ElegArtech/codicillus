import './visionneuse-tableur.css';

/** Monte les tableurs déjà rendus et ceux ajoutés par un aperçu d’édition. */
export function cablerLesTableursIntegres(racine: HTMLElement): () => void {
	const montes = new Map<HTMLElement, () => void>();
	function actualiser(): void {
		for (const [figure, defaire] of montes) {
			if (figure.isConnected) continue;
			defaire();
			montes.delete(figure);
		}
		for (const figure of racine.querySelectorAll<HTMLElement>('[data-tableur-integre]')) {
			if (montes.has(figure)) continue;
			montes.set(figure, monterLeTableur(figure));
		}
	}
	const observation = new MutationObserver(actualiser);
	observation.observe(racine, { childList: true, subtree: true });
	actualiser();
	return () => {
		observation.disconnect();
		for (const defaire of montes.values()) defaire();
		montes.clear();
	};
}

function monterLeTableur(figure: HTMLElement): () => void {
	const corps = figure.querySelector<HTMLElement>('[data-tableur-adresse]');
	const adresse = corps?.dataset['tableurAdresse'];
	if (!corps || !adresse) return () => {};
	const controle = new AbortController();
	void import('./visionneuse-tableur')
		.then(({ afficherLeTableur }) => {
			if (!controle.signal.aborted) return afficherLeTableur(corps, adresse, controle.signal);
		})
		.catch(() => {
			if (controle.signal.aborted) return;
			corps.textContent =
				'La visionneuse n’a pas pu être chargée. Téléchargez l’original pour l’ouvrir dans votre tableur.';
		});
	const doc = figure.ownerDocument;
	const agrandir = figure.querySelector<HTMLButtonElement>('[data-agrandir-tableur]');
	let boite: HTMLDialogElement | null = null;
	let emplacement: Comment | null = null;
	let position = { haut: 0, gauche: 0 };
	function memoriserPosition(): void {
		const grille = figure.querySelector<HTMLElement>('.tableur__defilement');
		if (grille) position = { haut: grille.scrollTop, gauche: grille.scrollLeft };
	}
	function restaurerPosition(): void {
		const grille = figure.querySelector<HTMLElement>('.tableur__defilement');
		if (!grille) return;
		grille.scrollTop = position.haut;
		grille.scrollLeft = position.gauche;
		grille.dispatchEvent(new Event('scroll'));
	}
	function reduire(): void {
		emplacement?.replaceWith(figure);
		emplacement = null;
		boite?.remove();
		boite = null;
		restaurerPosition();
		if (agrandir) {
			agrandir.textContent = 'Agrandir';
			agrandir.setAttribute('aria-expanded', 'false');
			agrandir.focus();
		}
	}
	function basculer(): void {
		memoriserPosition();
		if (boite) {
			boite.close();
			return;
		}
		emplacement = doc.createComment('Emplacement du tableur');
		figure.before(emplacement);
		boite = doc.createElement('dialog');
		boite.className = 'tableur-integre__dialogue';
		boite.setAttribute('aria-label', figure.querySelector('strong')?.textContent ?? 'Tableur');
		boite.addEventListener('close', reduire, { once: true });
		boite.addEventListener('cancel', memoriserPosition, { once: true });
		boite.append(figure);
		doc.body.append(boite);
		if (agrandir) {
			agrandir.textContent = 'Réduire';
			agrandir.setAttribute('aria-expanded', 'true');
		}
		boite.showModal();
		restaurerPosition();
	}
	agrandir?.setAttribute('aria-expanded', 'false');
	agrandir?.addEventListener('click', basculer);
	return () => {
		controle.abort();
		if (boite) {
			boite.removeEventListener('close', reduire);
			emplacement?.replaceWith(figure);
			boite.close();
			boite.remove();
		}
		agrandir?.removeEventListener('click', basculer);
	};
}
