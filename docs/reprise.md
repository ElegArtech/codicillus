# Où reprendre

*État au 4 septembre 2026. Ce fichier ne dit que ce qui a été **ouvert dans un navigateur**,
sur une base migrée jamais semée. Ce qu'un contrôle déclare n'y entre pas.*

```
pnpm check      = 0        0 erreur, 0 avertissement
pnpm test:unit  = 0        83 fichiers, 1 885 contrôles
pnpm build      = 0
passage-a-froid = 0        42 routes, chacune au code attendu d'elle, aucun nom du jeu servi
aiguilles       = 0        111 aiguilles, deux zones du paquet
```

---

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
`codicillus-vpn/ACCES.md`, hors dépôt. Au 1er septembre elle porte ce code, ses migrations sont
appliquées jusqu'à `013`, son index de recherche est posé, et elle est vide de données.

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
