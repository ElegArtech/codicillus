import { writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { cloner, ouvrirNavigateur, fermerInstance } from '../../preparer.mjs';

const chemin = await cloner('/tmp/codicillus_recette9_mtv40vd1/configuration.json', 'exploration_externe', 'garnie', 5911);
let navigation;
const etapes = [];
const debut = Date.now();
const entree = createInterface({ input: process.stdin, output: process.stdout });
try {
 navigation = await ouvrirNavigateur(chemin, 'externe', 'exploration-finale/externe');
 const { page, dossierTraces } = navigation;
 await page.goto(navigation.instance.url);
 for (;;) {
  console.log(JSON.stringify({ url: page.url(), texte: await page.locator('body').innerText(), liens: await page.locator('a').evaluateAll((liens) => liens.map((l) => ({ texte: l.innerText, href: l.getAttribute('href') }))) }));
  const action = JSON.parse(await entree.question('ACTION '));
  if (action.fin) {
   await writeFile(`${dossierTraces}/résultat.json`, JSON.stringify({ persona: 'externe', dureeSecondes: Math.round((Date.now()-debut)/1000), ...action.fin, etapes, preuves: ['trace.zip', 'final.png', 'erreurs.json', ...etapes.map((e) => e.capture).filter(Boolean)] }, null, 2));
   break;
  }
  try {
   if (action.lien) await page.getByRole('link', { name: action.lien, exact: true }).first().click();
   if (action.bouton) await page.getByRole('button', { name: action.bouton, exact: true }).first().click();
   if (action.retour) await page.goBack();
   if (action.capture) await page.screenshot({ path: `${dossierTraces}/${action.capture}`, fullPage: true });
   etapes.push({ ...action, url: page.url() });
  } catch (erreur) { console.log(erreur.message); etapes.push({ ...action, erreur: erreur.message }); }
 }
} finally {
 entree.close();
 if (navigation) await navigation.fermer();
 await fermerInstance(chemin);
}
