import { writeFile } from 'node:fs/promises';
import { cloner, ouvrirNavigateur, fermerInstance } from '../../preparer.mjs';

let session;
let instance;
const observations = [];
const actions = [];
let debut;
export async function ouvrir() {
	instance = await cloner('/tmp/codicillus_recette9_mtv40vd1/configuration.json', 'exploration_administrateur', 'garnie', 5913);
	session = await ouvrirNavigateur(instance, 'administrateur', 'exploration-finale/administrateur');
	debut = Date.now();
	await session.page.goto(session.instance.url);
	return await voir('accueil');
}
export async function voir(nom) {
	await session.page.screenshot({ path: `${session.dossierTraces}/${nom}.png`, fullPage: true });
	const texte = await session.page.locator('body').innerText();
	const liens = await session.page.locator('a').evaluateAll((elements) => elements.map((a) => ({ texte: a.textContent, href: a.getAttribute('href') })));
	observations.push({ nom, url: session.page.url(), texte, liens });
	return { texte, liens };
}
export async function cliquer(role, nom) {
	actions.push({ action: 'cliquer', role, nom });
	await session.page.getByRole(role, { name: nom, exact: true }).click();
}
export async function remplir(label, valeur) {
	actions.push({ action: 'remplir', label, valeur });
	await session.page.getByLabel(label, { exact: true }).fill(valeur);
}
export function page() { return session.page; }
export async function finir(resultat) {
	await writeFile(`${session.dossierTraces}/resultat.json`, JSON.stringify({ persona: 'administrateur', contexte: 'clone garni indépendant', dureeSecondes: Math.round((Date.now() - debut) / 1000), ...resultat, actions, observations, erreurs: session.erreurs, preuves: ['trace.zip', 'final.png', ...observations.map((o) => `${o.nom}.png`)] }, null, 2));
	try { await session.fermer(); } finally { await fermerInstance(instance); }
}
