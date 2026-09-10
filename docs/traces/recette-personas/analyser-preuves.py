import json
from pathlib import Path
from zipfile import ZipFile

racine = Path(__file__).resolve().parent
mots = json.loads(Path('/tmp/codicillus-recette-aiguilles.json').read_text())

def texte_dom(noeud):
    if isinstance(noeud, str):
        return noeud
    if not isinstance(noeud, list):
        return ''
    if noeud and isinstance(noeud[0], str):
        if noeud[0].upper() in ('SCRIPT', 'STYLE'):
            return ''
        return ' '.join(texte_dom(enfant) for enfant in noeud[2:])
    return ''

resume = []
for resultat in sorted(racine.glob('PAR-*/resultat.json')):
    donnees = json.loads(resultat.read_text())
    chemin = donnees.get('traces')
    if not isinstance(chemin, str):
        resume.append({'id': resultat.parent.name, 'erreur': 'Chemin de trace absent'})
        continue
    dossier = Path(chemin)
    fichiers = list(dossier.glob('*.txt'))
    corpus = '\n'.join(f.read_text(errors='replace') for f in fichiers)
    instantanes = 0
    archive = dossier / 'trace.zip'
    if archive.exists():
        with ZipFile(archive) as z:
            for nom in z.namelist():
                if not nom.endswith('.trace'):
                    continue
                for ligne in z.read(nom).decode().splitlines():
                    objet = json.loads(ligne)
                    if objet.get('type') == 'frame-snapshot':
                        corpus += '\n' + texte_dom(objet['snapshot']['html'])
                        instantanes += 1
    trouvees = []
    for aiguille in mots:
        texte = corpus if aiguille.get('casse') is not False else corpus.lower()
        mot = aiguille['mot'] if aiguille.get('casse') is not False else aiguille['mot'].lower()
        position = texte.find(mot)
        if position >= 0:
            trouvees.append({'mot': aiguille['mot'], 'extrait': corpus[max(0, position - 90):position + len(mot) + 90]})
    controle = {'id': resultat.parent.name, 'aiguilles': len(mots), 'textes': len(fichiers), 'instantanes_dom': instantanes, 'trouvees': trouvees, 'trace': str(archive), 'mesure': 'Texte des captures et instantanés DOM enregistrés, hors contenu des balises script/style.'}
    (dossier / 'corpus.json').write_text(json.dumps(controle, ensure_ascii=False, indent=2) + '\n')
    resume.append(controle)
(racine / 'controle-corpus.json').write_text(json.dumps(resume, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'parcours': len(resume), 'avec_occurrences': [(r['id'], [m['mot'] for m in r.get('trouvees', [])]) for r in resume if r.get('trouvees')], 'sans_instantanes': [r['id'] for r in resume if not r.get('instantanes_dom')]}, ensure_ascii=False))
