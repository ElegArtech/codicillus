import type { Document } from '$lib/contenu/document';

export interface ImageEnAttente {
	readonly marque: string;
	readonly champ: string;
}

export function creerDepotDImagesEnAttente() {
	const fichiers = new Map<string, File>();
	const adresses = new Set<string>();

	return {
		deposer: async (fichier: File): Promise<{ readonly src: string; readonly nom: string }> => {
			const adresse = URL.createObjectURL(fichier);
			fichiers.set(adresse, fichier);
			adresses.add(adresse);
			return { src: adresse, nom: fichier.name };
		},
		ajouterAuFormulaire: (formulaire: FormData, document: Document): void => {
			const images: ImageEnAttente[] = [];
			let numero = 0;
			const parcourir = (valeur: unknown): unknown => {
				if (Array.isArray(valeur)) return valeur.map(parcourir);
				if (typeof valeur !== 'object' || valeur === null) return valeur;
				const objet = valeur as Record<string, unknown>;
				if (
					objet['type'] === 'image' &&
					typeof objet['attrs'] === 'object' &&
					objet['attrs'] !== null
				) {
					const attrs = objet['attrs'] as Record<string, unknown>;
					const source = typeof attrs['src'] === 'string' ? attrs['src'] : '';
					const fichier = fichiers.get(source);
					if (fichier !== undefined) {
						const marque = `image-en-attente:${numero}`;
						const champ = `image-en-attente-${numero}`;
						numero += 1;
						images.push({ marque, champ });
						formulaire.append(champ, fichier, fichier.name);
						return { ...objet, attrs: { ...attrs, src: marque } };
					}
				}
				return Object.fromEntries(
					Object.entries(objet).map(([cle, contenu]) => [cle, parcourir(contenu)])
				);
			};

			formulaire.set('corps', JSON.stringify(parcourir(document)));
			formulaire.set('images-en-attente', JSON.stringify(images));
		},
		liberer: (): void => {
			for (const adresse of adresses) URL.revokeObjectURL(adresse);
			adresses.clear();
			fichiers.clear();
		}
	};
}
