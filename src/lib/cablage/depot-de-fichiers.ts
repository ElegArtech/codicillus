/**
 * LE DÉPÔT DE FICHIERS — la descente de l'arborescence d'un répertoire déposé,
 * écrite UNE fois et employée par les deux écrans qui reçoivent un lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE MODULE EXISTE
 *
 * Deux écrans reçoivent un dépôt : `/importer` (V-24), qui envoie le lot au
 * serveur, et `/console/imports` (V-35), qui le confie au parcours d'import par
 * `src/routes/importer/lot-en-attente.ts`. Les deux promettent la MÊME chose, et
 * la maquette de la console la promet mot pour mot : « L'arborescence est
 * conservée telle quelle » (`mockups/V-35-console-imports.html:1310`).
 *
 * V-24 la descendait, la console non : elle prenait la liste plate des fichiers
 * du transfert. Un répertoire déposé y perdait sa structure, toutes ses notes
 * atterrissaient à la racine du domaine, et l'idempotence de l'import tombait
 * avec — son discriminant est « identifiant lisible + chemin de dossier sous la
 * cible » (`src/lib/donnees/import.ts`), et ce chemin valait la chaîne vide pour
 * tout le lot.
 *
 * La descente vit donc ici, et les deux écrans l'importent. Deux copies
 * auraient divergé au premier oubli.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE CHEMIN DEVIENT
 *
 * Le chemin complet de chaque entrée est greffé sur son fichier sous le nom de
 * propriété que le sélecteur de répertoire du navigateur emploie déjà — ainsi un
 * lot déposé et un lot choisi voyagent de la même façon, et l'envoi n'a qu'une
 * seule lecture à faire. Le transfert rend un chemin qui commence par une barre
 * oblique ; le lot le veut relatif, la barre de tête est retirée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * QUAND LE NAVIGATEUR N'OFFRE PAS D'ENTRÉES
 *
 * La lecture des entrées d'un transfert n'est pas universelle. Quand aucune
 * n'est offerte, le lot retombe sur la liste plate des fichiers : c'est le
 * comportement d'avant, et il reste juste pour des fichiers déposés un à un.
 */

/** Une entrée de système de fichiers, telle que le transfert la rend. */
export interface EntreeDeTransfert {
	readonly isFile: boolean;
	readonly isDirectory: boolean;
	readonly fullPath: string;
	file?: (retour: (f: File) => void, echec: (e: unknown) => void) => void;
	createReader?: () => {
		readEntries: (retour: (e: EntreeDeTransfert[]) => void, echec: (e: unknown) => void) => void;
	};
}

/** Ce qu'on lit d'un transfert : ses entrées quand il en a, ses fichiers sinon. */
export interface TransfertDepose {
	readonly items?: ArrayLike<{ webkitGetAsEntry?: () => unknown }> | null;
	readonly files?: ArrayLike<File> | null;
}

/** Le fichier d'une entrée, son chemin complet greffé dessus. */
function fichierDe(entree: EntreeDeTransfert): Promise<File | null> {
	return new Promise((rendre) => {
		if (entree.file === undefined) {
			rendre(null);
			return;
		}
		entree.file(
			(f) => {
				Object.defineProperty(f, 'webkitRelativePath', {
					value: entree.fullPath.replace(/^\//, ''),
					configurable: true
				});
				rendre(f);
			},
			() => rendre(null)
		);
	});
}

/** Les entrées d'un répertoire, page par page — le lecteur en rend au plus cent. */
function entreesDe(entree: EntreeDeTransfert): Promise<EntreeDeTransfert[]> {
	const lecteur = entree.createReader?.();
	if (lecteur === undefined) return Promise.resolve([]);
	const toutes: EntreeDeTransfert[] = [];
	return new Promise((rendre) => {
		const lire = (): void => {
			lecteur.readEntries(
				(lot) => {
					if (lot.length === 0) {
						rendre(toutes);
						return;
					}
					toutes.push(...lot);
					lire();
				},
				() => rendre(toutes)
			);
		};
		lire();
	});
}

/** Le parcours en profondeur d'une entrée déposée. */
async function descendre(entree: EntreeDeTransfert, recueil: File[]): Promise<void> {
	if (entree.isFile) {
		const f = await fichierDe(entree);
		if (f !== null) recueil.push(f);
		return;
	}
	if (!entree.isDirectory) return;
	for (const enfant of await entreesDe(entree)) await descendre(enfant, recueil);
}

/** Les fichiers d'un transfert, arborescence conservée quand elle est offerte. */
export async function fichiersDuTransfert(
	transfert: TransfertDepose | null
): Promise<readonly File[]> {
	if (transfert === null) return [];
	const items = Array.from(transfert.items ?? []);
	const entrees = items
		.map((i) => i.webkitGetAsEntry?.() ?? null)
		.filter((e) => e !== null)
		.map((e) => e as EntreeDeTransfert);
	if (entrees.length === 0) return Array.from(transfert.files ?? []);
	const recueil: File[] = [];
	for (const e of entrees) await descendre(e, recueil);
	return recueil;
}

/**
 * LE CHEMIN D'UN FICHIER DU LOT — celui du dépôt, jamais son seul nom.
 *
 * Le chemin relatif porte l'arborescence quand le navigateur la connaît : c'est
 * elle qui deviendra l'arborescence des dossiers, à l'identique. À défaut, le
 * fichier est à la racine du lot.
 */
export function cheminDuFichier(fichier: File): string {
	const relatif = (fichier as File & { webkitRelativePath?: string }).webkitRelativePath;
	return relatif !== undefined && relatif !== '' ? relatif : fichier.name;
}
