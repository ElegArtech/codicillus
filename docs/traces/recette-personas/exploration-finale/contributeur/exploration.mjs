import { cloner, ouvrirNavigateur, fermerInstance } from '../../preparer.mjs';
import { writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
const chemin = await cloner('/tmp/codicillus_recette9_mtv40vd1/configuration.json', 'exploration_contributeur', 'garnie', 5912);
const session = await ouvrirNavigateur(chemin, 'contributeur', 'exploration-finale/contributeur');
const page = session.page;
await page.goto(session.instance.url);
console.log(await page.locator('body').innerText());
const actions = [];
const entree = createInterface({ input: process.stdin });
try {
 for await (const action of entree) {
  if (action === 'FIN') break;
  actions.push(action);
  try { console.log(await eval(action)); } catch (erreur) { console.log(erreur.message); }
 }
} finally {
 await writeFile(`${session.dossierTraces}/actions.json`, JSON.stringify(actions, null, 2));
 await session.fermer();
 await fermerInstance(chemin);
}
