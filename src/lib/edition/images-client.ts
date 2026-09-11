import { adresseDeNote } from '../rangement/adresses';

export interface ImageDeposee {
	readonly src: string;
	readonly nom: string;
}

/** Dépose une image dans l'entrepôt de la note et rend sa source interne. */
export async function deposerImageDansLaNote(
	identifiant: string,
	fichier: File
): Promise<ImageDeposee> {
	const corps = new FormData();
	corps.set('fichier', fichier);
	const reponse = await fetch(`${adresseDeNote(identifiant)}/images`, {
		method: 'POST',
		body: corps
	});
	const issue = (await reponse.json()) as { adresse?: string; nom?: string; motif?: string };
	if (!reponse.ok || !issue.adresse || !issue.nom) {
		throw new Error(issue.motif ?? 'Le dépôt de l’image a échoué.');
	}
	return { src: issue.adresse, nom: issue.nom };
}
