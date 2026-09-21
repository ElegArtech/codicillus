import './videos.css';

const MESSAGE_VIDEO =
	'Cette vidéo ne peut pas être lue. Son encodage peut être incompatible avec ce navigateur ou le fichier indisponible. Téléchargez l’original pour l’ouvrir.';

/** Les erreurs média ne remontent pas : la capture couvre aussi les aperçus ajoutés ensuite. */
export function cablerLesVideos(racine: HTMLElement): () => void {
	const signaler = (evenement: Event): void => {
		if (!(evenement.target instanceof HTMLVideoElement)) return;
		const message =
			evenement.target.parentElement?.querySelector<HTMLElement>('[data-erreur-video]');
		if (message) message.hidden = false;
	};
	for (const video of racine.querySelectorAll('video')) {
		if (video.error) {
			const message = video.parentElement?.querySelector<HTMLElement>('[data-erreur-video]');
			if (message) message.hidden = false;
		}
	}
	racine.addEventListener('error', signaler, true);
	return () => racine.removeEventListener('error', signaler, true);
}

export function creerLeLecteurVideo(doc: Document, adresse: string, nom: string): HTMLElement {
	const figure = doc.createElement('figure');
	figure.className = 'video-integree';
	const video = doc.createElement('video');
	video.controls = true;
	video.playsInline = true;
	video.preload = 'metadata';
	video.setAttribute('aria-label', nom);
	const message = doc.createElement('p');
	message.hidden = true;
	message.setAttribute('role', 'alert');
	message.textContent = MESSAGE_VIDEO;
	video.addEventListener('error', () => {
		message.hidden = false;
	});
	video.src = adresse;
	figure.append(video, message);
	return figure;
}
