import { ouvrirNavigateur } from '../preparer.mjs';
const n=await ouvrirNavigateur('/tmp/codicillus_recette9_mtv40vd1/l2_p039_a1.json','administrateur','lot2/exploration-admin');
for(const route of ['/','/console/univers']){await n.page.goto(n.instance.url+route);console.log(route,await n.page.locator('body').innerText());console.log(await n.page.locator('a').evaluateAll(x=>x.map(e=>({t:e.innerText,h:e.getAttribute('href')}))));}
await n.fermer();
