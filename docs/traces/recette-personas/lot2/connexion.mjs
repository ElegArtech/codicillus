import {cloner,ouvrirNavigateur,fermerInstance} from '../preparer.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const instance=await cloner('/tmp/codicillus_recette9_mtv40vd1/configuration.json','l2_p066_a8','garnie',5766);
const ins=JSON.parse(await readFile(instance));for(let t=0;t<100;t++){try{if((await fetch(ins.url+'/connexion')).ok)break;}catch{/* Démarrage. */}await new Promise(r=>setTimeout(r,100));}
const n=await ouvrirNavigateur(instance,'externe','PAR-066/fr-FR/connexion-reelle');
const assertions=[];try{
await n.page.goto(ins.url+'/');await n.page.screenshot({path:n.dossierTraces+'/01-accueil-public.png',fullPage:true});
await n.page.getByRole('link',{name:'Se connecter',exact:true}).first().click();await n.page.screenshot({path:n.dossierTraces+'/02-formulaire-vide.png',fullPage:true});
await writeFile(n.dossierTraces+'/02-formulaire-vide.txt',await n.page.locator('body').innerText());
await n.contexte.tracing.stop({path:n.dossierTraces+'/avant-saisie.zip'});
await n.page.locator('#identifiant').fill(ins.personas.contributeur.identifiant);await n.page.locator('#motdepasse').fill(ins.personas.contributeur.motDePasse);
await n.page.screenshot({path:n.dossierTraces+'/03-formulaire-rempli.png',fullPage:true});
await Promise.all([n.page.waitForURL(u=>u.pathname==='/'),n.page.locator('#valider').click()]);
await n.contexte.tracing.start({screenshots:true,snapshots:true});
await n.page.screenshot({path:n.dossierTraces+'/04-session-ouverte.png',fullPage:true});const body=await n.page.locator('body').innerText();await writeFile(n.dossierTraces+'/04-session-ouverte.txt',body);
assertions.push({critere:'Connexion locale réellement soumise au navigateur et accueil authentifié reçu',reussi:body.includes('Bonjour Recette')});
await n.page.goto(ins.url+'/notes/recette-interne');await n.page.screenshot({path:n.dossierTraces+'/05-note-autorisee.png',fullPage:true});await writeFile(n.dossierTraces+'/05-note-autorisee.txt',await n.page.locator('body').innerText());assertions.push({critere:'Session donne accès à la note interne',reussi:(await n.page.locator('body').innerText()).includes('Référence du relais boréal')});
}catch(e){assertions.push({critere:'Connexion réelle',reussi:false,detail:e.message});}finally{await n.fermer().catch(()=>{});await n.navigateur.close();await fermerInstance(instance);await writeFile('docs/traces/recette-personas/PAR-066/resultat.json',JSON.stringify({id:'PAR-066',persona:'contributeur',langue:'fr-FR',statut:'rouge',objectif_atteint:false,assertions,erreurs:n.erreurs,traces:'docs/traces/recette-personas/PAR-066/fr-FR/connexion-reelle',correction_candidate:[],limites:['Connexion locale effectivement réalisée et session ouverte ; durée session prolongée, destination protégée restaurée et limitation des tentatives non établies.','La trace est suspendue pendant la saisie et soumission des secrets ; captures PNG et vidéo documentent le geste, puis trace DOM active sur accueil authentifié et note autorisée.'],passes_executees:1,reprises_harness:'Une tentative antérieure a cherché à tort un formulaire sur la note publique masquée en 404.'},null,2));}
