import {ouvrirNavigateur,fermerInstance} from '../preparer.mjs';
const c='/tmp/codicillus_recette9_mtv40vd1/l1_explore.json'; const b=await ouvrirNavigateur(c,'referent','lot1/exploration');
for(const url of ['/','/univers/atelier-recette','/univers/atelier-recette/exploitation-recette','/notes/recette-interne','/notes/nouvelle','/recherche?q=relais']){await b.page.goto(b.instance.url+url); console.log('\nURL',url,await b.page.locator('body').innerText());console.log('INPUTS',await b.page.locator('input,textarea,select,[contenteditable],button').evaluateAll(es=>es.map(e=>({tag:e.tagName,text:e.textContent?.slice(0,90),name:e.getAttribute('name'),label:e.getAttribute('aria-label'),placeholder:e.getAttribute('placeholder')}))));}
await b.fermer();await fermerInstance(c);
