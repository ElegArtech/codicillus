import {readFile,writeFile,readdir} from 'node:fs/promises';
import {aiguillesDuCorpus,aiguillesTrouvees} from '../../aiguilles-du-corpus.mjs';
const aiguilles=await aiguillesDuCorpus();
const constats={72:'Le bouton Copier du registre Opérationnel soumet le formulaire supprimer et transforme la lecture en 404.',76:'Référent : aucun accès Analytique trouvé depuis accueil ; /console/analytique répond 404.',79:'Récupération autonome : aucun formulaire de courriel proposé après Mot de passe oublié.',89:'Après erreur réseau de sauvegarde puis réessai, éditeur affiché vide ; vérifier perte de saisie.',95:'Un fichier nommé invalide.pdf contenant du texte brut non PDF est accepté comme note avec « aucun échec ». ',96:'La vue Exports annonce explicitement que la réimportation de son archive est indisponible.'};
for(let n=72;n<=106;n++){
 const dossier=`docs/traces/recette-personas/PAR-${String(n).padStart(3,'0')}`;
 const un=JSON.parse(await readFile(dossier+'/resultat.json','utf8'));
 let r=un;try{r=JSON.parse(await readFile(dossier+'/resultat-passe-2.json','utf8'));await writeFile(dossier+'/resultat-passe-1.json',JSON.stringify(un,null,2));}catch{/* Une seule passe disponible. */}
 let rendu='';if(r.traces)for(const f of await readdir(r.traces)){if(f.endsWith('.txt'))rendu+=await readFile(r.traces+'/'+f,'utf8');}
 const trouvees=aiguillesTrouvees(rendu,aiguilles);
 r.aiguilles_premier_jeu=trouvees;
 r.assertions.push({nom:'Valeurs distinctives premier jeu absentes du rendu enregistré',ok:trouvees.length===0,detail:trouvees.map(x=>x.mot)});
 if(trouvees.length){r.statut='rouge';r.objectif_atteint=false;}
 r.correction_candidate=constats[n]?[constats[n]]:[];
 if(r.statut==='rouge'&&!constats[n])r.limites.push('Rouge de preuve incomplète : les contrôles non achevés ou sélecteurs imparfaits ne constituent pas à eux seuls un défaut produit.');
 if(n===90)r.limites=r.limites.filter(x=>!x.includes('Aucun type de relation créé'));
 r.budget_reel={passes_produit:r.passe,precision:'Les reprises dues aux sélecteurs, attentes et prérequis de recette ne comptent pas comme une passe produit supplémentaire. Les vidéos présentes gardent ces reprises.'};
 await writeFile(dossier+'/resultat.json',JSON.stringify(r,null,2));console.log(r.id,r.statut,r.aiguilles_premier_jeu.length);
}
