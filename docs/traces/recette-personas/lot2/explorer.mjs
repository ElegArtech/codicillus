import { ouvrirNavigateur } from '../preparer.mjs';
const n=await ouvrirNavigateur('/tmp/codicillus_recette9_mtv40vd1/l2_p039_a1.json','contributeur','lot2/exploration');
for(const route of ['/notes/recette-interne','/notes/recette-interne/modifier','/cartographie','/mon-profil','/imports']) {await n.page.goto(n.instance.url+route); console.log(route,await n.page.locator('body').innerText());console.log(await n.page.locator('input,textarea,select').evaluateAll(x=>x.map(e=>({tag:e.tagName,id:e.id,name:e.name,type:e.type,options:e.options?[...e.options].map(x=>({v:x.value,t:x.text})):undefined}))));}
await n.fermer();
