import {ouvrirNavigateur,fermerInstance} from '../preparer.mjs';
const c='/tmp/codicillus_recette9_mtv40vd1/l3_explore.json';const b=await ouvrirNavigateur(c,'administrateur','lot3/exploration');
for(const r of ['/notes/recette-interne','/notes/recette-interne/modifier','/console/univers','/console/domaines','/console/configuration','/console/comptes','/cartographie','/importer','/mon-profil','/bibliotheque']) {await b.page.goto(b.instance.url+r);console.log('\nROUTE',r,await b.page.locator('body').innerText()); console.log('FIELDS',await b.page.locator('input,textarea,select').evaluateAll(es=>es.map(e=>({tag:e.tagName,id:e.id,name:e.name,type:e.type,placeholder:e.placeholder}))));}
await b.fermer();await fermerInstance(c);
