# ÉCART-011 — T-101 arrêté au protocole d'écart — 18 août 2026

**Le lot n'est pas livré. Aucun fichier n'a été créé.** L'exécutant a exécuté le temps 1
(extraction), constaté que les critères de sortie étaient inatteignables, et s'est arrêté avant la
première ligne de code. C'est le comportement exigé, et c'est la première fois que le protocole
d'écart joue son rôle.

---

## É-1 — `verif:maquette --contre=app` n'est pas outillé. **Défaut de contrat, imputable à l'orchestrateur.**

**Gravité : bloquante.**

Le contrat T-101 demandait de « lever le garde-fou `--contre=app` ». Vérifié dans
`verif/maquette.mjs` : ce n'est pas un garde-fou posé devant un chemin existant — **le chemin
n'existe pas**. `--base` est parsé et n'apparaît que dans le message de refus ; un seul serveur est
démarré, sur `mockups/` ; la même adresse sert de référence *et* de candidat ; et l'état est atteint
par pilotage de `.planche`, que l'application n'a pas.

**La faute est au contrat, pas à l'exécutant.** Le contrat de T-007 disait explicitement : *« Ne
fabrique pas le volet `app` des scénarios au-delà de ce que `routes.md` établit : aucune vue
n'existe encore. »* T-007 a donc livré, correctement, la moitié à-blanc de l'instrument. Puis T-101
a été écrit comme si l'autre moitié existait. C'est exactement ce que `PLAN §0` nomme : *« toute
décision prise pendant l'exécution est un défaut de contrat de tâche »* — ici, l'exécutant n'a rien
décidé, il a buté sur un critère de sortie que personne ne pouvait atteindre.

**Résolution.** Le régime `app` est un **instrument** : il relève de l'orchestrateur, jamais d'un
lot de vue — un implémenteur qui écrit le chemin par lequel il sera mesuré écrit sa propre note.
Le protocole est déjà spécifié, et depuis le début : `règles/workflow_agentic.md` annexe F prescrit
un *« mode démo de l'implémentation rendant chaque état avec les fixtures — route
`/__design/V-xx?state=…`, builds de développement uniquement »*. C'est la moitié manquante ; elle
sera écrite avant toute reprise de T-101.

---

## É-2 — Conformité pixel et batterie 2 s'excluent. **Résolu par renversement de la contrainte.**

**Gravité : haute. Portée : les 41 vues.**

Mesuré : le second bloc `<style>` de V-37 — 782 lignes de style propre à la vue, que la conformité
pixel oblige à porter **tel quel** — produit **94 constats** `verif:jetons` : 30 P-1.1, 35 P-1.2,
1 P-1.3, 20 P-1.4, 2 P-1.5, 4 P-1.6, 2 P-6.2.

Aucun de ces littéraux n'a d'équivalent dans les 70 jetons : `13px` n'est pas un pas de `--e-*`,
`#f6e9a8` et `#7a2f8f` n'existent nulle part, `90ms` n'est pas un `--m-*`, `line-height: 1.12` n'est
pas un `--i-*`. **Les remplacer déplace le rendu ; les garder rend la batterie rouge.** Les deux
contraintes sont vraies et incompatibles.

**Résolution : la contrainte n'est pas assouplie, elle est renversée — et resserrée.**

Une feuille de vue portée d'une maquette gelée est soumise à un contrôle **plus strict** que P-1 :
elle doit être **identique à l'octet** au second bloc `<style>` de sa maquette, vérifié
mécaniquement, exactement comme P-6.1 le fait déjà pour le socle. À l'intérieur de ce bloc vérifié,
P-1 ne s'applique pas — non par tolérance, mais parce qu'« identique au gel » **implique** et
dépasse « n'emploie que des jetons ».

Hors de ce bloc, P-1 s'applique intégralement : **toute ligne de CSS qu'un agent écrit lui-même
reste soumise à la règle entière.** Le risque RA-02 — dérive du système visuel par valeurs en dur —
est visé par la seconde moitié, et il est mieux couvert qu'avant : une feuille identique au gel ne
peut pas dériver du tout, tandis qu'une feuille jetonnée pouvait dériver en restant jetonnée.

C'est la même mécanique qu'ADR-002 applique au socle, étendue aux feuilles de vue. `docs/DESIGN.md`
§5 est amendé en conséquence, et `verif/jetons.mjs` reçoit le contrôle correspondant.

---

## É-3 — Faux positif d'instrument sur `@keyframes` — **corrigé**

`selecteursDe()` de `verif/jetons.mjs` traite les étapes `to` et `from` d'un `@keyframes` comme des
sélecteurs CSS. Le socle en déclarant déjà, **toute feuille de vue portant une animation nommée
sera rouge, quelle qu'elle soit**. Deux constats garantis d'avance sur V-37.

C'est un défaut de l'instrument, pas du code mesuré. Correction d'orchestrateur.

---

## É-5 — La surface capturée de V-37 déborde le périmètre du lot — **conformité par zone**

Le banc ne retire du DOM que `.planche`. Tout le reste est comparé. Or V-37 embarque :

- **`section.regles`** — six pavés dont la maquette dit elle-même *« Ce bloc n'appartient pas au
  produit »*. Le retirer avant capture n'est pas dévier de la maquette : c'est **obéir à ce qu'elle
  déclare**. Il rejoint `.planche` dans les blocs retirés.
- **le tableau de bord de démonstration** — c'est le contenu de V-07 ;
- **la note de démonstration complète** — c'est le contenu de V-14, avec ses trois blocs de code,
  son tableau, sa figure et ses trois alertes.

V-37 **n'est pas une route** : `docs/routes.md` la classe parmi les six vues sans adresse propre.
C'est un catalogue de la coquille, comme V-41 l'est des composants. Comparer page entière une vue
qui n'existe à aucune adresse, contre une application qui ne la sert nulle part, n'a pas de sens.

**Résolution.** Le scénario d'une vue peut déclarer les **zones comparées**. Pour V-37 : `aside.rail`
et `header.barre` — la coquille proprement dite. Le contenu qu'elle enveloppe est couvert par les
lots de V-07 et V-14, sur leurs propres maquettes.

**Garde-fou, sans lequel c'est une échappatoire** : la liste des zones est en **écriture humaine
seule**, au même titre que les tolérances et les masques ; le rapport nomme les zones comparées à
chaque exécution ; et une vue sans déclaration de zones est comparée **page entière**, par défaut.
Un agent bloqué sur un rouge ne restreint jamais une zone.

---

## É-4 — 36 classes de V-37 absentes de l'inventaire fermé

Dont neuf pour la seule famille des bandeaux d'alerte, et une **troisième forme** d'indicateur
chiffré (`.mesure`), là où `docs/DESIGN.md` §2 n'en connaît que deux — ce qui aggrave la
contradiction déjà relevée en §6.3.

`docs/DESIGN.md` §2 pose qu'« un composant absent de cet inventaire n'existe pas ». L'inventaire a
été extrait de `socle.css` et de V-41 ; il ne couvre donc pas les composants propres aux autres
vues. **L'inventaire est à compléter par relevé systématique des 41 maquettes**, avant que le
contrôle P-5 ne puisse être outillé — ce qui est déjà une condition de clôture de la phase 1
(`ECART-008 c`).

Sans effet bloquant sur T-101 : les classes existent dans la maquette gelée, elles ne sont pas
inventées.

---

## É-9 — Le volet `app` des scénarios n'est pas éditable à la main

`verif/scenarios/V-xx.json` est régénéré par `extraire-scenarios.mjs`, qui écrit `app: null`, et
`pnpm scenarios:verifier` échoue sur toute divergence. L'instruction du contrat T-101 — « renseigne
le volet `app` » — n'avait donc **aucun destinataire dans le code**. Second défaut du même contrat.

À traiter avec É-1 : le protocole d'état côté application se déclare ailleurs, ou l'extracteur
apprend à préserver un volet `app` fourni.

Signalé aussi : le champ `"fenetres": ["1440x900"]` des scénarios est **périmé** depuis ARB-009 —
`maquette.mjs` lit `fenetresDe()` et capture bien les quatre fenêtres. Écart de traçabilité, sans
effet sur les verdicts.

---

## Ce que le lot a tout de même établi

**E-01 et E-02 sont bien corrigés sur V-37, et pour la bonne raison** — vérifié au rendu, aux
quatre fenêtres, en contenu tableau de bord et en contenu lecture, rail ouvert et rail fermé.
À aucun moment une piste de grille de largeur nulle n'apparaît : la déclaration est
`minmax(0,1fr)` seule et le rail sort de la grille par `display:none`. Aucun débord horizontal,
y compris à 360 px avec trois blocs de code et un tableau à six colonnes. Zéro occurrence de
`grid-template-columns: 0` dans le fichier. **D-04 tient.**

**Un effet de bord non documenté** : sous 1240 px, `rail-ouvert` et `rail-ferme` rendent le même
écran. Trois des huit états deviennent indiscernables deux à deux sur trois des quatre fenêtres.
Ce n'est pas un défaut, mais « 32 couples conformes » ne signifie pas « 32 rendus distincts
prouvés » — et il faut le savoir avant de lire un rapport.
