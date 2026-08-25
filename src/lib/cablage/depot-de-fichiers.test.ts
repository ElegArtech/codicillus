/**
 * LES UNITAIRES DU DÉPÔT DE FICHIERS — l'arborescence descendue, et le repli
 * quand le navigateur n'offre rien à descendre.
 *
 * CE QUE CES CAS MESURENT, ET QU'AUCUN AUTRE NE VOYAIT. Deux écrans reçoivent un
 * lot déposé, et un seul des deux descendait l'arborescence : le lot de la
 * console arrivait plat, toutes ses notes tombaient à la racine du domaine, et
 * l'idempotence de l'import tombait avec — son discriminant compte le chemin de
 * dossier sous la cible. La descente est désormais unique et partagée ; ce qui
 * suit éprouve la descente elle-même, sans navigateur.
 *
 * LE TRANSFERT EST UN PARAMÈTRE, JAMAIS UNE LECTURE DU MONDE. Les entrées sont
 * fabriquées ici, avec leurs rappels, leur pagination et leur barre oblique de
 * tête : ces cas mesurent la même chose sur une machine sans écran.
 */
import { describe, expect, it } from 'vitest';
import {
	cheminDuFichier,
	fichiersDuTransfert,
	type EntreeDeTransfert,
	type TransfertDepose
} from './depot-de-fichiers';

/** Un fichier d'épreuve, tel que le lecteur d'entrées le rendrait. */
function fichier(nom: string): File {
	return new File(['x'], nom, { type: 'text/markdown' });
}

/** Une entrée de fichier, son chemin complet tel que le transfert le donne. */
function entreeDeFichier(cheminComplet: string): EntreeDeTransfert {
	const nom = cheminComplet.slice(cheminComplet.lastIndexOf('/') + 1);
	return {
		isFile: true,
		isDirectory: false,
		fullPath: cheminComplet,
		file: (retour) => retour(fichier(nom))
	};
}

/**
 * Une entrée de répertoire dont le lecteur rend ses enfants PAR PAGES — c'est
 * ce que fait le lecteur réel, qui n'en rend jamais plus de cent d'un coup, et
 * c'est le piège que la pagination doit franchir.
 */
function entreeDeRepertoire(
	cheminComplet: string,
	enfants: readonly EntreeDeTransfert[]
): EntreeDeTransfert {
	let rendus = 0;
	return {
		isFile: false,
		isDirectory: true,
		fullPath: cheminComplet,
		createReader: () => ({
			readEntries: (retour) => {
				const page = enfants.slice(rendus, rendus + 1);
				rendus += page.length;
				retour([...page]);
			}
		})
	};
}

/** Le transfert, tel que l'événement de dépôt le porte. */
function transfert(
	entrees: readonly EntreeDeTransfert[],
	fichiersPlats: readonly File[] = []
): TransfertDepose {
	return {
		items: entrees.map((e) => ({ webkitGetAsEntry: () => e })),
		files: fichiersPlats
	};
}

describe('les fichiers d’un transfert', () => {
	it('rend le lot vide quand il n’y a pas de transfert', async () => {
		expect(await fichiersDuTransfert(null)).toEqual([]);
	});

	it('descend l’arborescence sur trois niveaux, chemin relatif greffé', async () => {
		const depose = transfert([
			entreeDeRepertoire('/Exploitation', [
				entreeDeFichier('/Exploitation/Racine.md'),
				entreeDeRepertoire('/Exploitation/Sauvegardes', [
					entreeDeRepertoire('/Exploitation/Sauvegardes/Restauration', [
						entreeDeFichier('/Exploitation/Sauvegardes/Restauration/Bandes.md')
					])
				])
			])
		]);

		const recus = await fichiersDuTransfert(depose);

		expect(recus.map((f) => cheminDuFichier(f))).toEqual([
			'Exploitation/Racine.md',
			'Exploitation/Sauvegardes/Restauration/Bandes.md'
		]);
	});

	it('retire la barre oblique de tête que le transfert pose', async () => {
		const recus = await fichiersDuTransfert(transfert([entreeDeFichier('/Seul.md')]));
		expect(cheminDuFichier(recus[0] as File)).toBe('Seul.md');
	});

	it('retombe sur la liste plate quand aucune entrée n’est offerte', async () => {
		const plats = [fichier('Un.md'), fichier('Deux.md')];
		const recus = await fichiersDuTransfert({ items: [], files: plats });
		expect(recus.map((f) => f.name)).toEqual(['Un.md', 'Deux.md']);
	});

	it('ignore une entrée qui n’est ni fichier ni répertoire', async () => {
		const boiteuse: EntreeDeTransfert = {
			isFile: false,
			isDirectory: false,
			fullPath: '/Rien'
		};
		expect(await fichiersDuTransfert(transfert([boiteuse]))).toEqual([]);
	});

	it('ignore un fichier que le lecteur refuse de rendre', async () => {
		const refusee: EntreeDeTransfert = {
			isFile: true,
			isDirectory: false,
			fullPath: '/Refuse.md',
			file: (_retour, echec) => echec(new Error('refus'))
		};
		expect(await fichiersDuTransfert(transfert([refusee]))).toEqual([]);
	});
});

describe('le chemin d’un fichier du lot', () => {
	it('rend le seul nom quand aucun chemin relatif n’est greffé', () => {
		expect(cheminDuFichier(fichier('Isole.md'))).toBe('Isole.md');
	});

	it('rend le chemin relatif dès qu’il est greffé', () => {
		const f = fichier('Bandes.md');
		Object.defineProperty(f, 'webkitRelativePath', {
			value: 'Exploitation/Sauvegardes/Bandes.md',
			configurable: true
		});
		expect(cheminDuFichier(f)).toBe('Exploitation/Sauvegardes/Bandes.md');
	});
});
