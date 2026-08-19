# L'orchestration — comment un lot se commande, se surveille et se rapatrie

*Écrit le 19 août 2026, après trente-deux heures et une trentaine de lots. **Rien ici n'est
théorique** : chaque règle vient d'une faute qui a coûté un lot, un aller-retour, ou une journée de
confiance mal placée. Les comptes sont exacts au jour de la rédaction.*

---

## Pourquoi ce document existe

`CLAUDE.md` dit ce qu'un **exécutant** doit savoir. `règles/workflow_agentic.md` dit la méthode.
**Rien ne disait comment on commande un lot** — et c'est pourtant là que se sont produites la plupart
des pertes.

La question de clôture du plan est : *« le dépôt suffirait-il à réexpliquer ce lot sans le
rouvrir ? »* Sans ce document, la réponse était **non** : la manière d'écrire un contrat vivait dans
le contexte d'une session, et mourait avec elle.

---

## 1 · Ce qu'un contrat doit contenir

Un contrat qui marche tient en six parties, dans cet ordre. Celles qui manquent sont celles qui
coûtent.

### 1.1 · Ce que le lot ferme, et d'où le fait sort

Nomme le défaut, **et l'instrument qui l'a mesuré**. Jamais « il faudrait améliorer X ». Un lot se
commande sur une mesure, pas sur une impression.

Et **cite la commande qui reproduit le chiffre**, pas seulement le chiffre :

```
pnpm test:droits          → 0 portage · 59 gel
```

### 1.2 · Les six règles de méthode

Elles se recopient dans **tout** contrat d'instrument, et la plupart valent aussi pour un lot de vue.

1. **Audite les deux côtés.** Maquette gelée *et* application, par le **même code**, dans les mêmes
   conditions de capture. Lis la nature dans la comparaison : commun → `gel` ; surplus application →
   `portage` ; surplus gel → `gel non reporté` ; indécidable → `instrument`, non opposable.
   *Sans ce recoupement, la batterie 10 aurait imputé 3 470 défauts au code au lieu de 31.*
2. **Éprouve ta clé de rapprochement dans les deux sens.** Une jointure produit deux fautes
   symétriques : sur-rapprocher masque un défaut réel, sous-rapprocher en fabrique un faux. Prouve
   les deux — un cas qui **doit** se rapprocher, un cas qui **ne doit pas**.
   *`ECART-041` : une clé sensible aux blancs a fabriqué **31 faux défauts sur 31**, parce que le
   compilateur Svelte élague les nœuds de texte blancs d'un côté et pas de l'autre.*
3. **Éprouve ta table avant de mesurer.** Une famille qu'aucune classe du gel ne satisfait fait
   sortir en **code 2**, jamais en vert. *`P-5` : une règle qu'aucun cas n'exerce est une règle dont
   on ignore si elle marche. Un filtre est resté inerte huit lots durant.*
4. **Prouve que la batterie sait dire non.** Mutation d'au moins deux genres, retour à l'identique
   après restauration, `git status` propre. **Et prouve que la mutation n'est pas inerte** — une
   perturbation qui ne change rien ne teste rien.
5. **Sois déterministe, et prouve-le sur trois exécutions.** Deux ne suffisent pas : ce sont deux
   exécutions qui ont donné 92 puis 95 sur un arbre identique.
6. **Ne te donne pas ton seuil.** `verif/references/` est en écriture humaine seule. Si le dépôt ne
   peut pas passer au vert, **livre rouge en l'expliquant**.

### 1.3 · Ce qui est déjà tranché

Les arbitrages que le lot applique, **nommés** — `ARB-xxx` — et non résumés. Un exécutant qui ne peut
pas lire la décision la réinvente.

> **Et crée la copie de travail APRÈS avoir commité ces décisions.** Deux lots ont travaillé sans le
> document qui les gouvernait, parce que leur copie datait d'un commit antérieur. Ils l'ont dit ;
> c'est la seule raison pour laquelle ça n'a pas coûté.

### 1.4 · Les interdictions

Les sources en lecture seule ; les fichiers qu'un autre lot occupe ; l'instrument qui le juge ; et
les pièges de `CLAUDE.md` §6 qui le concernent **nommément** — pas « lis le §6 ».

### 1.5 · Les critères de sortie, en deux groupes

```
le but         : ce que le lot doit faire descendre
la condition   : tout le reste, INCHANGÉ
```

**Le second groupe est le vrai critère.** *Quatre lots de suite ont fermé leur cible en déplaçant
autre chose*, et c'est ainsi qu'on l'a su à chaque fois. Énumère les batteries à comparer, ne dis pas
« ne casse rien ».

Et exige la **ligne de base relevée avant écriture**, citée dans le rapport. *Prouver après sans
avoir mesuré avant ne prouve rien.*

### 1.6 · Le livrable

Le code, et un rapport qui donne : la ligne de base, ce qui est fait, ce qui **ne** l'est **pas** et
pourquoi, la sortie **réelle** de chaque commande, et **les écarts numérotés `É-1, É-2…`**.

Ajoute toujours : *« ne commite pas ; ne crée rien dans `docs/ecarts/` — je numérote »*. La
numérotation est globale ; deux lots parallèles produiraient le même numéro.

---

## 2 · La règle que l'orchestrateur viole le plus souvent

> **N'énonce jamais un fait sur le gel sans citer la ligne que tu as lue.** (`P-21`)

**Neuf affirmations transmises se sont révélées fausses en une journée**, toujours pour la même
raison — je n'avais pas ouvert le fichier :

| Ce que j'ai écrit | Ce qui était vrai |
|---|---|
| « aucune maquette ne montre un module désactivé » | V-11 et V-28 en montrent **39 instances** |
| « V-18 est la lecture du registre Opérationnel » | c'est l'**éditeur** |
| « aucune maquette ne montre le fil de V-20 rempli » | **sa propre maquette le décrit à trois endroits** |
| une plage de lignes de constructeur | **amputée du quatrième nœud** |
| « axe ne peut pas savoir qu'un élément est inactif » | **si** — `isDisabled()` remonte les ascendants |
| « un `role` ne peint aucun pixel, donc c'est réparable » | vrai des pixels, **faux du niveau 1 du banc** |
| « rien ne distingue les deux portées de Signets » | **aucun état de V-22 n'existe sans domaine** |
| « les huit sites sont dans le rail et la barre » | la barre n'en porte **aucun** |
| deux critères de sortie dans un même contrat | **mutuellement inaccessibles** |

`verif/contrat.mjs` protège contre les chiffres tapés à la main. **Il ne protège ni d'une lecture de
travers, ni d'une affirmation non vérifiée.**

**Deux parades, et elles marchent :**

- **écrire *fichier, ligne, et ce qu'on y lit* — ou rien** ;
- **poser la borne qui doit arrêter l'exécutant si l'affirmation est fausse.** C'est ce qui a sauvé
  le lot Signets : le contrat disait *« si un état déclaré de V-22 montrait un domaine, arrête-toi et
  déclare-le »*. Il s'est arrêté. C'est la seule des neuf qui n'a rien coûté.

Et dis-le dans le contrat : *« neuf de mes affirmations se sont révélées fausses — vérifie-les. »*
Un exécutant qui sait qu'il peut me contredire le fait.

---

## 3 · La procédure d'une vague

```bash
# 1. commiter d'abord les décisions dont les lots dépendent          (§1.3)
git commit …

# 2. une copie par lot, un port par copie
git worktree add --detach /tmp/wt-<nom> HEAD -q
bash verif/preparer-copie.sh /tmp/wt-<nom> <port>     # 5910, 5911, 5912…

# 3. le contrat DANS la copie, et sauvegardé au dépôt
$EDITOR /tmp/wt-<nom>/CONTRAT.md
cp /tmp/wt-<nom>/CONTRAT.md docs/taches/contrats/T-xxx.md

# 4. au retour : rapatrier, PUIS revérifier soi-même
cp …                                                   # jamais git merge : les copies sont détachées
pnpm check && pnpm verif:gel && pnpm test:unit
pnpm verif:maquette:app                                # 6 à 9 min
pnpm <les batteries que le lot touche ET celles qu'il ne touche pas>

# 5. écrire l'écart, arbitrer, commiter, pousser
# 6. RETIRER LA COPIE — elle emporte son serveur                     (P-22)
chmod -R u+w /tmp/wt-<nom> && git worktree remove /tmp/wt-<nom> --force
```

**Trois points où l'on se brûle :**

- **Le parallélisme se décide par fichier, pas par sujet.** Deux lots peuvent partager un thème sans
  se gêner ; deux lots qui touchent `src/lib/coquille/` se gênent toujours.
- **`P-16` — un lot qui installe une dépendance ne se rapatrie pas tant qu'une autre copie tourne.**
  `node_modules` est **lié** à l'arbre principal : l'installation changerait les copies **sous**
  elles.
- **`P-22` — retirer la copie n'est pas du ménage, c'est de la correction.** Huit serveurs orphelins
  ont été trouvés le 19 août, le plus vieux de vingt et une heures, occupant **7,3 Go**. Le banc
  passe de 363 s à 563 s selon la charge, et un port pris fait **mesurer le mauvais serveur**.

---

## 4 · Les seuils

Un seuil rend opposable une dette qu'aucun lot ne peut fermer. Quatre règles, toutes payées :

1. **Par règle et par nature, jamais un compte global** — un seuil global absorbe les dettes
   nouvelles en silence.
2. **Aucune ligne de `portage` n'est jamais admise.** Elles sont corrigeables ; les admettre, c'est
   les enterrer.
3. **Le fichier descend, il ne monte pas.** Toute hausse est un défaut de lot, pas une mise à jour.
4. **Ne pose pas un seuil sur un instrument dont le déterminisme n'est pas prouvé.** *`ARB-026` a dû
   être suspendu puis rétabli : j'avais posé un seuil qui figeait 31 lignes du côté du code, sur une
   batterie qui rendait 92 puis 95 sur un arbre identique.*

Et **ne pose pas de seuil sur une dette qu'un lot referme** : les 59 actions interdites de la
batterie 7 avaient un seuil proposé à 59 ; un lot les a toutes fermées.

---

## 5 · Ce qu'un rapport de lot mérite en retour

**Lis-le en entier, et cherche d'abord ce qui te contredit.** La valeur d'un exécutant est là.

Sur une trentaine de lots, **quatre refus ont été justes et m'ont évité une faute** :

- un lot a livré **zéro correction** après avoir démontré que les 31 défauts qu'on lui donnait
  n'existaient pas ;
- trois ont livré **rouge** plutôt que d'assouplir leur instrument ;
- aucun ne s'est donné son propre seuil ;
- un a **refusé une route techniquement viable et vérifiée**, au motif qu'elle ne réparait rien —
  elle requalifiait.

**Un rapport qui ne contient aucun écart est suspect**, pas rassurant.

Et **la contradiction se vérifie avant d'être acceptée** : quand un lot a écarté ma suggestion de clé
de rapprochement, il l'a fait avec une mesure — **59 % de collisions contre 14,8 %**, sur 2 244
nœuds. C'est la mesure qui tranche, pas l'autorité.

---

## 6 · Ce que ce dispositif n'a pas encore

*À jour au 19 août 2026, et à tenir à jour.*

- **Trois défauts d'instrument connus, déclarés, non réparés** : l'horloge du banc qui ne survit pas
  au parallélisme (`P-14`) ; une troisième source de non-déterminisme sur `V-37 chargement`
  (`ECART-042` É-6) ; et la sonde de restitution de focus qui, **une fois corrigée, n'est plus
  exercée par aucun des 409 couples** — `P-5` sur la correction elle-même.
- **`verif/menus.mjs` porte `ATTENDU_ROUTES = 39` en dur** et refuse de mesurer si l'extraction
  diverge. Son commentaire annonce lire le §9 de `docs/routes.md` ; il l'a recopié. Toute route
  ajoutée, même arbitrée, fait refuser l'instrument.
- **Aucun hook ne refuse la clôture d'un lot sans mise à jour du journal.** Le journal de vague a été
  écrit après coup, pour trois vagues, parce qu'un vérificateur l'a relevé — pas parce que le
  dispositif l'a exigé.
