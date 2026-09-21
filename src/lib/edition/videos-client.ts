import { deserialize } from '$app/forms';
import { adresseDeNote, adresseDePieceJointe } from '../rangement/adresses';

export async function deposerVideoDansLaNote(
	identifiant: string,
	fichier: File
): Promise<{ src: string; nom: string; typeMedia: string }> {
	const typeMedia = /\.mp4$/i.test(fichier.name)
		? 'video/mp4'
		: /\.webm$/i.test(fichier.name)
			? 'video/webm'
			: null;
	if (!typeMedia) throw new Error('Formats acceptés : MP4 et WebM.');
	const corps = new FormData();
	corps.set('fichier', new File([fichier], fichier.name, { type: typeMedia }));
	const reponse = await fetch(`${adresseDeNote(identifiant)}?/deposerPiece`, {
		method: 'POST',
		body: corps,
		headers: { 'x-sveltekit-action': 'true' }
	});
	const resultat = deserialize(await reponse.text());
	if (resultat.type !== 'success') {
		const motif = resultat.type === 'failure' ? resultat.data?.['motif'] : null;
		throw new Error(typeof motif === 'string' ? motif : 'Le dépôt de la vidéo a échoué.');
	}
	return { src: adresseDePieceJointe(identifiant, fichier.name), nom: fichier.name, typeMedia };
}
