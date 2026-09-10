import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import pg from 'pg';
import {cloner,ouvrirNavigateur,fermerInstance} from './preparer.mjs';
for(const [id,persona,port] of [['PAR-107','externe',5902],['PAR-108','administrateur',5903]]){
 const fichier=await cloner('/tmp/codicillus_recette9_mtv40vd1/configuration.json','rejeu4_'+id.toLowerCase().replace('-','_'),'garnie',port);
 const instance=JSON.parse(await readFile(fichier,'utf8'));let pool;
 if(id==='PAR-108'){
  const e=instance.env;pool=new pg.Pool({host:e.HOTE_BASE??e.HOTE_POSTGRES??'127.0.0.1',port:Number(e.PORT_BASE??e.PORT_DB??19432),user:e.UTILISATEUR_BASE??e.UTILISATEUR_POSTGRES??'codicillus',password:e.MDP_BASE??e.MDP_POSTGRES,database:instance.base});
  await pool.query("insert into univers (identifiant,nom,couleur,glyphe,ordre) values ('releve-polaire','Relève polaire','#49745c','layers',1)");
 }
 const b=await ouvrirNavigateur(fichier,persona,id+'/fr-FR/rejeu-4');let erreur=null;
 const capture=async(nom)=>{await b.page.screenshot({path:b.dossierTraces+'/'+nom+'.png',fullPage:true});await writeFile(b.dossierTraces+'/'+nom+'.txt',await b.page.locator('body').innerText());};
 try{
  const page=b.page;
  if(id==='PAR-107'){
   await page.goto(instance.url+'/guides/recette-publique',{waitUntil:'networkidle'});await capture('01-guide');
   await page.getByRole('link',{name:'Exploitation boréale',exact:true}).first().click();await page.waitForURL('**/recherche?domaine=*');await capture('02-domaine-public');
   await page.getByRole('link',{name:/Accès public au relais boréal/}).first().click();await page.waitForURL('**/guides/recette-publique');await capture('03-retour-guide');
  }else{
   await page.goto(instance.url+'/univers/releve-polaire',{waitUntil:'networkidle'});
   await page.getByRole('link',{name:'Créer un domaine dans Relève polaire',exact:true}).click();
   await page.getByRole('button',{name:'Nouveau domaine',exact:true}).click();
   assert.equal(await page.locator('#f-univers').inputValue(),'Relève polaire');await capture('01-univers-preselectionne');
   await page.locator('#f-nom').fill('Transmission polaire');await Promise.all([page.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('/console/domaines')),page.locator('#form-valider').click()]);
   await page.getByRole('link',{name:'Transmission polaire',exact:true}).waitFor();await page.waitForLoadState('networkidle');
   await page.getByRole('button',{name:'Modifier',exact:true}).last().waitFor();
   await page.goto(instance.url+'/univers/releve-polaire',{waitUntil:'networkidle'});
   await page.getByRole('link',{name:/Transmission polaire/}).first().click();await page.waitForURL('**/univers/releve-polaire/*');await capture('02-domaine-rattache');
  }
  assert.equal(b.erreurs.length,0,JSON.stringify(b.erreurs));
 }catch(e){erreur=e.message;}finally{await b.fermer();if(pool)await pool.end();await fermerInstance(fichier);}
 const r={id,persona,langue:'fr-FR',statut:erreur?'rouge':'vert',objectif_atteint:!erreur,assertions:[{nom:'Parcours ajouté après exploration accompli sans erreur navigateur',ok:!erreur,detail:erreur}],erreurs:b.erreurs,traces:b.dossierTraces,jeu:'garnie',limites:['Ajout après exploration, hors dérivation initiale aveugle. Un rejeu formel après correction.'],correction_candidate:erreur?[erreur]:[]};
 await writeFile('docs/traces/recette-personas/'+id+'/resultat.json',JSON.stringify(r,null,2));console.log(id,r.statut,erreur??'');
 if(erreur)process.exitCode=1;
}
