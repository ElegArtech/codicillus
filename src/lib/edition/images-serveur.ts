const TYPES_D_IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class ImageRefusee extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ImageRefusee';
	}
}

function typeReel(octets: Uint8Array): string | null {
	if (
		octets.length >= 8 &&
		octets[0] === 0x89 &&
		octets[1] === 0x50 &&
		octets[2] === 0x4e &&
		octets[3] === 0x47 &&
		octets[4] === 0x0d &&
		octets[5] === 0x0a &&
		octets[6] === 0x1a &&
		octets[7] === 0x0a
	)
		return 'image/png';
	if (octets.length >= 3 && octets[0] === 0xff && octets[1] === 0xd8 && octets[2] === 0xff) {
		return 'image/jpeg';
	}
	if (
		octets.length >= 12 &&
		String.fromCharCode(...octets.slice(0, 4)) === 'RIFF' &&
		String.fromCharCode(...octets.slice(8, 12)) === 'WEBP'
	)
		return 'image/webp';
	return null;
}

export interface ImageLue {
	readonly nom: string;
	readonly typeMedia: string;
	readonly octets: Uint8Array;
}

export async function lireImage(fichier: FormDataEntryValue | null): Promise<ImageLue> {
	if (!(fichier instanceof File) || fichier.size === 0) {
		throw new ImageRefusee('Choisissez une image à déposer.');
	}
	if (!TYPES_D_IMAGES.has(fichier.type)) {
		throw new ImageRefusee('Formats acceptés : JPEG, PNG et WebP.');
	}
	const octets = new Uint8Array(await fichier.arrayBuffer());
	const reconnu = typeReel(octets);
	if (reconnu === null || reconnu !== fichier.type) {
		throw new ImageRefusee('Le contenu du fichier ne correspond pas à une image valide.');
	}
	return { nom: fichier.name, typeMedia: reconnu, octets };
}
