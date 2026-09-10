import {readFile,writeFile} from 'node:fs/promises';
import pg from 'pg';
import assert from 'node:assert/strict';
import {cloner,ouvrirNavigateur,fermerInstance} from './preparer.mjs';
const fichier=await cloner(process.env.CONFIG_RECETTE??'/tmp/codicillus_recette9_mtv40vd1/configuration.json','corrections_finales_v3','garnie',5901);
const instance=JSON.parse(await readFile(fichier,'utf8'));
const e=instance.env;
const pool=new pg.Pool({host:e.HOTE_BASE??e.HOTE_POSTGRES??'127.0.0.1',port:Number(e.PORT_BASE??e.PORT_DB??19432),user:e.UTILISATEUR_BASE??e.UTILISATEUR_POSTGRES??'codicillus',password:e.MDP_BASE??e.MDP_POSTGRES,database:instance.base});
const commande='printf "relais-boreal"';
await pool.query('update notes set corps_operationnel=$1 where identifiant=$2',[JSON.stringify({type:'doc',content:[{type:'codeBlock',attrs:{language:'bash'},content:[{type:'text',text:commande}]}]}),'recette-interne']);
const resultats=[];
async function epreuve(nom,persona,agir){
 const b=await ouvrirNavigateur(fichier,persona,'corrections/'+nom);
 const captures=[];
 const capturer=async(etape)=>{await b.page.screenshot({path:b.dossierTraces+'/'+etape+'.png',fullPage:true});await writeFile(b.dossierTraces+'/'+etape+'.txt',await b.page.locator('body').innerText());captures.push(etape);};
 let statut='vert',erreur=null;
 try{await agir(b,capturer);assert.equal(b.erreurs.length,0,JSON.stringify(b.erreurs));}catch(err){statut='rouge';erreur=err.message;}finally{await b.fermer();}
 const r={nom,statut,erreur,erreurs:b.erreurs,captures,traces:b.dossierTraces};resultats.push(r);console.log(nom,statut,erreur??'');await writeFile(b.dossierTraces+'/resultat.json',JSON.stringify(r,null,2));
}
try{
 await epreuve('vivacite','intervenant',async({page},cap)=>{
  await page.goto(instance.url+'/recherche?q=relais',{waitUntil:'networkidle'});
  const texte=await page.locator('body').innerText();assert.match(texte,/Vivacité/iu);assert.doesNotMatch(texte,/Fraîcheur|Vieillissant|Obsolète probable/u);
  await cap('01-recherche');
  const check=page.getByRole('checkbox',{name:/À revoir/}).first();await check.check();
  await page.waitForFunction(()=>document.querySelectorAll('#resultats a.carte').length===1);
  assert.match(await page.locator('#resultats').innerText(),/Relève du relais boréal/u);await cap('02-facette');
  await page.goto(instance.url+'/univers/atelier-recette',{waitUntil:'networkidle'});
  assert.match(await page.locator('.ligne-dom__etats').innerText(),/2\s*En retard/u);await cap('03-univers');
 });
 await epreuve('copie','intervenant',async({page,contexte},cap)=>{
  await page.goto(instance.url+'/notes/recette-interne',{waitUntil:'networkidle'});
  await page.getByRole('link',{name:'Opérationnel',exact:true}).click();await page.getByRole('button',{name:'Copier',exact:true}).waitFor();
  await contexte.grantPermissions(['clipboard-read','clipboard-write']);
  const requetes=[];page.on('request',r=>{if(r.method()==='POST')requetes.push(r.url());});
  await page.getByRole('button',{name:'Copier',exact:true}).click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),commande);assert.equal(requetes.length,0);assert.equal(new URL(page.url()).pathname,'/notes/recette-interne');await cap('01-copie-sans-soumission');
 });
 await epreuve('dossier','administrateur',async({page},cap)=>{
  await page.goto(instance.url+'/univers/atelier-recette/exploitation-recette/dossiers/',{waitUntil:'networkidle'});
  await page.getByRole('link',{name:/Relève boréale/}).last().click();
  await page.locator('#a-supprimer').click();await page.locator('#dlg-supprimer[open]').waitFor();
  assert.equal(await page.locator('#sup-saisie').inputValue(),'');assert.equal(await page.locator('#sup-valider').isDisabled(),true);await cap('01-dialogue-apres-navigation');
 });
 await epreuve('public','externe',async({page},cap)=>{
  await page.goto(instance.url+'/recherche?q=relais',{waitUntil:'networkidle'});
  const carte=page.getByRole('link',{name:/Accès public au relais boréal/}).first();const taille=await carte.boundingBox();assert.ok(taille.width>400,JSON.stringify(taille));await cap('01-resultat-cliquable');
  await carte.click();await page.waitForURL('**/guides/recette-publique');assert.match(await page.locator('body').innerText(),/Accès public au relais boréal/u);await cap('02-guide-ouvert');
 });
}finally{await pool.end();await fermerInstance(fichier);await writeFile('docs/traces/recette-personas/corrections/resultats.json',JSON.stringify(resultats,null,2));}
if(resultats.some(r=>r.statut!=='vert'))process.exitCode=1;
