import {fermerInstance} from '../preparer.mjs';
for(const n of [20,22]){try{await fermerInstance(`/tmp/codicillus_recette9_mtv40vd1/l1_p${String(n).padStart(3,'0')}_a2.json`);}catch{ /* Clone déjà fermé. */ }}
