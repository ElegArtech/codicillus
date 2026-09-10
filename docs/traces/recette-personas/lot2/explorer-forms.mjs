import { ouvrirNavigateur } from '../preparer.mjs';
const n=await ouvrirNavigateur('/tmp/codicillus_recette9_mtv40vd1/l2_p039_a1.json','administrateur','lot2/exploration-forms');
for(const route of ['/console/domaines','/console/types-de-fiches','/console/types-de-relations','/console/templates','/console/comptes','/console/analytique','/importer','/console/exports','/univers/atelier-recette/exploitation-recette/signets/nouveau','/carte-mentale']) {await n.page.goto(n.instance.url+route); console.log('\nROUTE',route,await n.page.locator('body').innerText()); console.log(JSON.stringify(await n.page.locator('input,textarea,select').evaluateAll(x=>x.map(e=>({id:e.id,name:e.name,type:e.type,options:e.options?[...e.options].map(x=>({v:x.value,t:x.text})):undefined})))));}
await n.fermer();
