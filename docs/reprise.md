# Où reprendre

*État au 7 septembre 2026. Ce fichier ne dit que ce qui a été **ouvert dans un navigateur**,
sur une base migrée jamais semée. Ce qu'un contrôle déclare n'y entre pas.*

```
pnpm check           = 0        0 erreur, 0 avertissement, 1432 fichiers
pnpm test:unit       = 0        92 fichiers, 2 060 contrôles
pnpm build           = 0
pnpm base:migrer     = 0        17 migrations, base neuve
pnpm base:coherence  = 0        schema.ts décrit exactement la base migrée
pnpm base:reversibilite = 0     monter, descendre, remonter : empreinte identique
passage-a-froid      = 0        43 routes, chacune au code attendu d'elle, aucun nom du jeu servi
aiguilles            = 0        111 aiguilles, 1252 fichiers, 103 morceaux tiers écartés et NOMMÉS
```

**`aiguilles` était rouge, et il l'était avant le 7 septembre.** Le dépôt a été reconstruit à
`08bf423`, le commit d'avant la première ligne du jour : le contrôle y rendait le **même** échec,
52 occurrences sur un fichier. Ce fichier est le morceau de 662 Ko de l'analyseur de Mermaid, où
« Production » est le nom d'une classe de grammaire — pas l'univers du jeu de démonstration. La
ligne `aiguilles = 0` de la version précédente de ce fichier était donc **déjà fausse quand elle a
été écrite**, et c'est la leçon que ce fichier porte sur lui-même.

**Le contrôle est corrigé, et il ne se tait sur rien.** Il n'écarte pas un mot : il écarte un
FICHIER dont la carte de source dit que toutes ses sources sont sous `node_modules`. Un morceau
mêlé — une seule source du produit — reste mesuré en entier. L'écart est nommé au relevé, avec son
compte. Le paquet qui part n'a toujours aucune carte de source : le contrôle en fabrique une à
lui, en `'hidden'`, dans un répertoire qu'il efface, et apparie par empreinte de CONTENU — les
cartes changent 56 des 180 fichiers et leurs empreintes de nom avec eux.

---

## Ce que le 7 septembre a fait

Neuf lots, cinq vagues. Le détail des arbitrages est dans `docs/plan-de-reprise.md`, section
« Décisions prises à l'exécution ».

- **Les mentions ont enfin de quoi se voir.** Le jeu de démonstration cite ses propres notes —
  neuf liens de corps dans six fichiers, **six arêtes déduites** —, et un unitaire tient le
  compte : orientation, dédoublonnage, et l'effacement quand une relation déclarée porte déjà la
  paire, dans un sens comme dans l'autre.
- **La Modélisation est un module de domaine**, activable comme Cartographie (migrations `016`
  et `017`). La reprise l'a activée partout où Cartographie l'était : **13 domaines sur 13**,
  rien n'a disparu. La console offre sa case sans une ligne de câblage de plus, et l'entrée de
  rail ne s'affiche que là où le module vit.
- **Une proposition rejetée ne revient plus.** Le refus est une table à part, `propositions_
  refusees`, et non une quatrième origine : garder la ligne dans `relations` aurait rendu
  IMPOSSIBLE de déclarer soi-même la relation refusée, `relations_unicite` s'y opposant. La vue
  montre les refus et permet de les annuler.
- **Deux relations entre deux mêmes notes s'atteignent chacune.** Leurs deux prises se
  superposaient exactement : l'une des deux était inatteignable au clic. La géométrie a quitté la
  vue pour un module éprouvé — éventail des parallèles, une poignée par arête, glissée le long de
  **son** tracé. Mesuré au navigateur : 29 arêtes, 29 tracés distincts, aucune paire de poignées à
  moins de 20 px.
- **L'écran dit sur quoi son étagement s'appuie**, et un réglage d'adresse le borne aux relations
  déclarées. Le réglage porte sur l'ORIGINE, pas sur l'attribut de dépendance : étager sur les
  seules relations techniques effondrerait tout corpus documentaire en une couche.
- **L'écran dit quand « aucun point de défaillance unique » ne veut rien dire.** Sur une instance
  où aucun type ne porte de dépendance — le cas de toute instance neuve —, il l'annonce et nomme
  l'adresse qui débloque, à l'administrateur seul. Aucune migration : la colonne `technique`
  existe depuis `002`, et le calcul la lisait déjà.

## Les trois défauts que la vérification a trouvés, et qu'aucun chantier n'avait prévus

- **Le formulaire qui sert à déclarer la première relation partait avec le dessin vide.** Il
  vivait dans la branche `{:else}` : sur une instance sans une seule relation, l'écran qui sert à
  relier les notes ne pouvait pas relier les deux premières. Trouvé parce qu'un contrôle de fin a
  échoué, pas parce que quelqu'un l'avait prévu.
- **`pnpm base:peupler` échouait sur toute base portant une trace de suppression.** Le semeur
  supprime les comptes du jeu, et `traces_de_suppression.auteur_id` est en `RESTRICT` : une
  instance sur laquelle on avait supprimé quoi que ce soit ne pouvait plus être repeuplée. La clé
  étrangère est juste et n'a pas bougé — c'est l'ordre de suppression qui était faux.
- **« Proposer 3 relation(s) à confirmer » en posait 2, sans un mot.** Deux notes qui se citent
  réciproquement donnaient deux propositions sur la même paire, dont l'écriture écartait une ; le
  chiffre du bouton était compté avant cette règle. Le produit se tait désormais sur une citation
  mutuelle — il sait que deux notes se citent, pas laquelle dépend de l'autre —, et l'action dit
  ce qu'elle écarte. **Trouvé au rejeu des clics dans un navigateur, et par rien d'autre** : ni le
  typage, ni les 2 060 unitaires ne le voyaient.

## Ce que le 4 septembre a réparé

- **Il n'y avait aucune sauvegarde.** `RG-NF-09` porte sur deux éléments — la base et le volume
  `fichiers` — et rien ne les copiait : ni crontab, ni tâche systemd, sur une instance qui tourne
  depuis quatre jours. Un timer les archive désormais chaque nuit, avec rattrapage si la machine
  était éteinte. Les deux archives sont **relues juste après leur écriture**, par les outils qui
  les restaureront : une sauvegarde vide sort non-zéro et se voit dans `systemctl status`, au lieu
  de se découvrir le jour du sinistre. `outils/sauvegarder.sh`, `outils/restaurer.sh`.
- **Et elle a été rejouée**, ce qui est l'autre moitié de l'exigence. Un univers, un domaine, une
  note et un fichier créés par le produit sur l'instance de recette, sauvegardés, retrouvés dans
  une base d'épreuve jetable, puis effacés par la restauration du jeu précédent : l'instance est
  revenue à son état d'avant, l'index de recherche compris. **Une sauvegarde qu'on n'a pas
  restaurée n'est pas une sauvegarde.**
- **Un domaine sans le module `dossiers` ne se partageait plus.** Décocher la case en console
  fermait la page de la racine — la seule d'où un droit s'accorde à un compte —, et elle rendait
  404 à l'administrateur compris. Le module gouverne l'ARBORESCENCE, pas les droits : la racine
  reste servie sans lui, les trois gestes de rangement refusent, et « Nouveau sous-dossier » est
  omis comme « Renommer » et « Supprimer » le sont déjà là.

## Ce que la veille a trouvé, et qui était faux depuis longtemps

La version précédente de ce fichier déclarait le produit sans défaut connu. Elle se trompait, et
il faut savoir sur quoi pour ne pas la recroire.

- **Le produit était mono-utilisateur.** Un domaine créé en console n'activait pas le module
  `dossiers` ; or la page d'un dossier est le seul endroit d'où un droit s'accorde à un compte.
  Elle rendait 404, même à l'administrateur. Et les six tuiles d'accès de la page d'un domaine
  étaient des `<button>` sans écouteur : l'adresse n'existait que si on la tapait. Un référent
  rattaché à un domaine ne voyait donc aucune note, et rien ne permettait de l'y autoriser.
- **Renommer un univers ou un domaine rendait 404 toutes ses adresses.** La base porte des
  identifiants stables, les chargeurs passaient les noms d'affichage, et les vues composaient
  l'adresse en les slugifiant.
- **Le message « créez un univers » n'a jamais été peint.** Le serveur le servait dans la
  réponse ; `+error.svelte` rendait V-26 pour tout 404 et n'affichait le message que dans sa
  branche *non*-404. L'écran disait donc l'inverse de ce qu'il fallait faire.
- **`/recherche` sortait en 500 sur toute installation neuve** : `pnpm base:migrer` ne pose pas
  l'index du moteur.
- **Le mot de passe temporaire était tiré dans le navigateur avec `Math.random()`** — trois mots
  d'une liste de seize et deux chiffres, ~18 bits, sur la seule porte de secours d'un compte.
- **La liste de notes d'un domaine chargeait toutes les notes lisibles de l'instance**, corps
  JSONB compris, pour en afficher vingt : 24,9 Mo servis, 993 ms.

Les six sont réparés et mesurés. La leçon tient en une ligne : **un fichier d'état qui n'est pas
remesuré vieillit plus vite que le code.**

---

## Ce qu'un utilisateur peut faire, vérifié

Sur une instance neuve — `pnpm base:migrer`, `pnpm base:administrateur`, rien de semé :

| | |
|---|---|
| S'installer | créer un univers, un domaine, un dossier ; les écrans nomment le geste suivant quand il manque quelque chose |
| Écrire | créer une note, la modifier, la vérifier, la signaler à réviser, lever la demande, la supprimer |
| Ranger | dossiers jusqu'à dix niveaux, renommer, déplacer — **et renommer ne casse aucune adresse** |
| Ouvrir à d'autres | créer un compte, lui accorder un droit de dossier, le lui retirer, changer son rattachement |
| Relier | déclarer une relation, la retirer ; l'écran dit ce qui manque quand aucun type n'existe |
| Chercher | la recherche, et la palette au raccourci depuis toute route en session, bornée au périmètre |
| Importer | les trois scénarios, renvois typés en relations, mode strict, journal des lots et rapport par lot |
| Exporter | l'archive d'un domaine |
| Administrer | les onze écrans de console, dont les types de note et la page d'indisponibilité |
| Mesurer | l'analytique sur des chiffres réels — recherches, révisions, modifications, adoption |

---

## Les cinq règles qui n'avaient jamais été mesurées

Elles l'ont été le 1er septembre, en ouvrant les écrans — moteur de recherche éteint pour de
bon, table renommée en base pour faire lever une lecture, serveur ralenti à 1,8 s.

| Règle | Verdict |
|---|---|
| `RG-M04-07` panneau en erreur | **non tenue.** Moteur éteint, `/recherche` rendait **500** et une page morte, pendant que la version publique affirmait « Aucun guide ne répond à “charte” » — un mensonge. Réparé : la panne est nommée, « Réessayer » offert, la page reste peinte. La palette faisait déjà mieux |
| `RG-M17-04` journaux anonymisés | **tenue.** Parcours anonyme complet : `consultations` et `recherches` écrivent leurs lignes avec `compte_id` NULL, ouverture attachée comprise |
| `RG-NF-05` destructions tracées | **non tenue.** Une note supprimée retirait 1 note, 2 relations et 3 étiquettes, et **aucune des 27 tables ne gagnait une ligne** : rien ne disait qui avait détruit quoi. Migration `013`, onze chemins câblés, `auteur_id` en `ON DELETE RESTRICT` — une trace qui perd son auteur cesse d'être une attribution |
| `RG-M18-01` retour sous 200 ms | **non tenue.** Le « premier changement visible » d'un bouton de console était le fond `:active` **revenant au repos** à 94 ms ; rien ensuite pendant 1,7 s. Et « Enregistrement… » était **recouvert à 411 ms** par le témoin de brouillon. Réparé : 24 et 31 ms, et le témoin se tait pendant un enregistrement |
| `RG-M18-16` i18n non interdite | **architecture tenue** — chaque phrase est un gabarit entier à un seul site. Mais un motif la condamnait ailleurs : **onze gestes retrouvaient leur bouton par le texte affiché**. Traduire « Supprimer » et le bouton d'une note ne fait plus rien, sans erreur ni avertissement. Les onze littéraux sont désormais dans une table close |

## L'instance de recette

Elle tourne sur un VPS, derrière un tunnel — l'accès et l'exploitation sont décrits dans
`codicillus-vpn/ACCES.md`, hors dépôt. **Au 7 septembre elle porte les migrations jusqu'à `017`**, son index est reconstruit sur ses **300 notes
réelles**, treize univers et un compte.

**Le déploiement du 7 septembre.** Sauvegarde `20260907-134913` prise et RELUE juste avant —
28 tables, 48 fichiers, sortie 0 —, puis `rsync`, `docker compose up -d --build`, et les
migrations `016` et `017` par le conteneur outil. Après : **300 notes intactes**, 21 domaines,
13 univers, `modelisation` = 21 = `cartographie` — la reprise n'a rien fait disparaître —,
`propositions_refusees` posée et vide, six services `healthy`. Vérifié dans un navigateur par le
tunnel : l'entrée de rail et la tuile EXPLORER mènent à `/modelisation`, et le domaine `Articles`
y rend **245 mentions sur 97 notes reliées** — les 245 liens « Voir aussi » des chroniques
Substack, dessinés pour la première fois. Zéro erreur de console.

La migration `014` — un cycle de vivacité par registre — a été passée sur ces données réelles.
Elle est purement additive : deux colonnes de validité prenant leur défaut, une date de
vérification opérationnelle nulle, un registre de révision repris à `reference`. Une sauvegarde a
été prise et RELUE juste avant (28 tables, 48 fichiers), et le compte des notes a été vérifié
identique après. Le jeu de conformité — `pnpm base:conformite` — n'a jamais été passé sur cette
instance et ne doit pas l'être : il efface le contenu.

**LA SAUVEGARDE EST POSÉE** depuis le 4 septembre — `codicillus-sauvegarde.timer`, chaque nuit à
2 h 30, un jeu par dossier horodaté sous `/var/sauvegardes/codicillus`, quatorze quotidiennes puis
les mensuelles sur six mois. Elle a été restaurée pour de vrai le jour où elle a été posée.

Elle est restée vingt-deux heures indisponible après un redémarrage du VPS, sans que personne le
sache. Le défaut applicatif est réparé — le serveur survit désormais à la perte de sa base et se
rétablit seul —, mais **rien ne surveille cette instance** : la panne a été trouvée parce qu'on
est allé voir. C'est le manque qui reste, et il est difficile à combler d'ici : l'instance n'est
joignable que par le tunnel, donc aucun service extérieur ne peut l'interroger. Seul un battement
SORTANT — le VPS annonce qu'il est vivant, et l'alerte se déclenche quand il se tait — détecte la
mort de la machine. Il demande une destination, et donc une décision.

## Ce qui reste

- **Trois chantiers sont cadrés et non exécutés** — `docs/plan-de-reprise.md` les porte, avec
  pour chacun l'état actuel, le périmètre, ce qu'il faut produire avant de coder et les
  arbitrages déjà pris. Dans l'ordre : **la carte mentale**, qui n'affiche que **3 notes sur 77**
  de la base de développement parce que 74 sont à la racine de leur domaine et qu'elle
  n'accroche une note qu'à un dossier ; **l'apparence de `/modelisation`**, qui n'a jamais été
  travaillée et attend une maquette ; **les embeddings**, pour le mode « Sens » et les familles.
- **L'éditeur de note émet deux avertissements de console** — « ProseMirror expects the CSS
  white-space property to be set » —, relevés au parcours à zéro donnée du 7 septembre. Ils
  viennent de `prosemirror-view`, dont la feuille n'est pas chargée ; l'éditeur fonctionne. Relevé,
  pas réparé.
- **Le chevron de l'arbre du rail est un `<button>`** : script coupé, aucun univers ne s'y
  déplie. Ce n'est pas bloquant — les cartes d'univers de l'accueil et les cartes de domaine de
  la page d'univers sont des liens, et le parcours complet a été rejoué par elles, script coupé
  compris. Relevé, pas réparé.
- **`docs/routes.md`, `DESIGN.md`, `releve-vues.md` et `arbitrages.md`** décrivent l'état d'avant
  et n'ont pas été remesurés. `routes.md` fait toujours autorité sur les adresses, le code le
  cite ; les trois autres sont de l'historique.
- **Rien ne surveille l'instance de recette**, et c'est assumé pour l'instant — la question a été
  posée le 4 septembre, la réponse est d'attendre. Voir ci-dessus pour ce que la surveillance
  demanderait : un battement sortant, et une destination pour le recevoir.

---

## Comment on travaille

Lire `CLAUDE.md`. En deux mots : **on répare le défaut, on vérifie dans un navigateur, on
commite.** Pas de contrat de tâche, pas de dossier d'écart, pas de journal, pas de rapport, pas
d'agent qui juge — tout cela a été supprimé le 31 août, 17 292 lignes qui n'avaient jamais fait
marcher un écran.

Les maquettes de `mockups/` sont la référence visuelle, pas une loi : quand l'une empêche le
produit de marcher, elle cède, et l'écart se note dans le commit.

```
pnpm dev            le serveur
pnpm check          typage, style, formatage — DOIT rester à 0
pnpm test:unit      les unitaires

pnpm build && node docs/traces/passage-a-froid.mjs           42 routes, base neuve
pnpm build && node docs/traces/aiguilles-dans-le-paquet.mjs  ce qui se livre au navigateur
```

Sur le VPS, deux gestes d'exploitation de plus — ils vivent dans `outils/`, donc ils suivent le
code et le rsync les remplace :

```
sudo outils/sauvegarder.sh              un jeu de plus, relu ; le timer le fait chaque nuit
sudo outils/restaurer.sh --eprouver     rejoue le dernier jeu dans une base jetable, sans risque
sudo outils/restaurer.sh --pour-de-vrai remplace la base, le volume, et réindexe
```

Deux contrôles seulement, et ils lancent le produit plutôt que de le juger sur pièces. Le premier
a attrapé, la veille de ce relevé, un exemple d'import qui montrait un serveur du jeu de
démonstration à tout installateur. **N'en ajoute pas un troisième.**

Les identifiants de développement vivent dans `.env`, ignoré. Pour ouvrir une instance neuve :
`pnpm base:administrateur`. Pour un jeu de démonstration complet : `pnpm base:peupler`.
