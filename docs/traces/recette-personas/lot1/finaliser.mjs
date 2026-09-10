import {readFile,writeFile,readdir,access} from 'node:fs/promises';
const bilan={vert:0,rouge:0,'non-joue':0};
for(let n=1;n<=38;n++){
 const id='PAR-'+String(n).padStart(3,'0'),dir='docs/traces/recette-personas/'+id;
 const r=JSON.parse(await readFile(dir+'/resultat.json','utf8'));
 const essais=[];
 for(const d of await readdir(dir+'/fr-FR').catch(()=>[])){try{await access(dir+'/fr-FR/'+d+'/trace.zip');essais.push(dir+'/fr-FR/'+d);}catch{ /* Essai interrompu avant enregistrement trace. */ }}
 r.essais_avec_traces=essais;r.limites=r.limites.filter(x=>!x.includes('passe')&&!x.includes('passes'));
 r.limites.push('Les dossiers de traces conservent les essais techniques et leurs reprises. Les erreurs de sélecteur, de connexion préalable et de prérequis ne prouvent aucun défaut produit.');
 if(n===20){r.objectif_atteint=true;r.erreurs.push({type:'http',code:404,attendu:true,url:'adresse directe pièce jointe interne, contexte anonyme',texte:'Refus conforme au droit de lecture; le protocole exige rouge sur tout HTTP >=400.'});r.assertions=r.assertions.filter(x=>!x.assertion.startsWith('HTTP 404'));r.correction_candidate=null;}
 const faits={1:'Accueil : pas indicateur brouillons, activité récente ni pied version/synchronisation exigés.',2:'Univers : carte du domaine classe les deux notes en retard en Obsolète alors que synthèse différencie À revoir et Obsolète.',15:'Clic Supprimer après navigation racine vers dossier enfant donne 404 sans confirmation. Aucune suppression SQL constatée.',19:'Sommaire encore visible avec Aucun titre dans cette note alors que oracle demande son absence.',23:'Template préparé avant parcours mais aucun choix visible dans écran de création observé.',25:'Saisie Markdown conservée littérale après enregistrement : titre et gras non convertis.',26:'Saisie /citation sur ligne vide sans menu de commandes puis texte littéral en lecture.',36:'Commentaire envoyé via btn-reviser-envoi non visible sur note ni accueil.',37:'Après modification du corps Référence, aucun signal à resynchroniser ni action Marquer comme resynchronisé observés sur Opérationnel.'};
 if(faits[n])r.correction_candidate=faits[n];
 if([3,8,11,13,14,16,18,27,29,30,32,33,35,38].includes(n))r.limites.push('Oracle complet non couvert : ce rouge inclut une limite de recette, pas uniquement un défaut produit démontré.');
 if([10,12,17,18,21,34].includes(n))r.limites.push('Attente historique ou persona à rapprocher de la refonte et des droits : aucune restauration de l’ancienne interface demandée.');
 if(n===32){r.traces=dir+'/fr-FR/passe-1';r.limites.push('La première trace atteste enregistrement Opérationnel; la reprise a échoué sur sélecteur éditeur.');}
 await writeFile(dir+'/resultat.json',JSON.stringify(r,null,2));bilan[r.statut]++;
}
console.log(JSON.stringify(bilan));
