// Régénère static/licences/javascript.txt depuis les dépendances de production installées.
// Usage : pnpm install --frozen-lockfile && node outils/licences-javascript.mjs
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SORTIE = 'static/licences/javascript.txt';
const SEPARATEUR = '='.repeat(72);

// Paquets dont le manifeste ne déclare pas la licence que porte leur fichier LICENSE.
const LICENCE_CONSTATEE = { khroma: 'MIT' };
// Paquets livrés hors du registre npm, dont le nom seul ne dit pas l'édition.
const PRECISION = { xlsx: ' (SheetJS Community Edition)' };

// Un paquet publié sans fichier de licence prend le texte de son dépôt d'origine, conservé
// dans outils/licences/ sous son nom (la barre oblique d'une portée devient deux soulignés).
function texteDeLicence(nom, dossier) {
	const fichier = readdirSync(dossier)
		.filter((entree) => /^(licen[cs]e|copying)([.-]|$)/i.test(entree))
		.sort()[0];
	const chemin =
		fichier === undefined
			? join(import.meta.dirname, 'licences', `${nom.replace('/', '__')}.txt`)
			: join(dossier, fichier);
	const texte = readFileSync(chemin, 'utf8').replace(/\r\n?/g, '\n');
	return texte.endsWith('\n') ? texte : texte + '\n';
}

const parLicence = JSON.parse(
	execFileSync('pnpm', ['licenses', 'list', '--prod', '--json'], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024
	})
);

const blocs = [];
for (const licence of Object.keys(parLicence).sort()) {
	for (const paquet of parLicence[licence]) {
		blocs.push(
			[
				SEPARATEUR,
				`${paquet.name} ${paquet.versions.join(', ')}${PRECISION[paquet.name] ?? ''}`,
				`Licence : ${LICENCE_CONSTATEE[paquet.name] ?? licence}`,
				`Source : ${paquet.homepage ?? `https://www.npmjs.com/package/${paquet.name}`}`,
				'',
				texteDeLicence(paquet.name, paquet.paths[0])
			].join('\n')
		);
	}
}

writeFileSync(
	SORTIE,
	'Licences des dépendances JavaScript de production de Codicillus\nVersions : pnpm-lock.yaml\n\n\n' +
		blocs.join('\n\n') +
		'\n'
);
console.log(`${SORTIE} : ${blocs.length} paquets`);
