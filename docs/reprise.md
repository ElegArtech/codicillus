# Où reprendre

*État au 1er septembre 2026. Ce fichier ne dit que ce qui a été **ouvert dans un navigateur**,
sur une base migrée jamais semée. Ce qu'un contrôle déclare n'y entre pas.*

```
pnpm check      = 0        0 erreur, 0 avertissement
pnpm test:unit  = 0        83 fichiers, 1 885 contrôles
pnpm build      = 0
passage-a-froid = 0        42 routes, chacune au code attendu d'elle, aucun nom du jeu servi
aiguilles       = 0        111 aiguilles, deux zones du paquet
```

---

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

**AUCUNE SAUVEGARDE N'EST PLANIFIÉE**, et c'est ce qui manque de plus urgent. `RG-NF-09` porte
sur deux éléments — la base **et** le volume `fichiers` — et aucune tâche périodique ne les
copie. Une restauration n'a jamais été éprouvée non plus : une sauvegarde qu'on n'a pas rejouée
n'est pas une sauvegarde. C'est le seul manque de cette instance dont l'absence ne se remarque
qu'au moment où il est trop tard.

Elle est aussi restée vingt-deux heures indisponible après un redémarrage du VPS, sans que
personne le sache. Le défaut applicatif est réparé — le serveur survit désormais à la perte de sa
base et se rétablit seul —, mais **rien ne surveille cette instance** : la panne a été trouvée
parce qu'on est allé voir.

## Ce qui reste

- **`docs/routes.md`, `DESIGN.md`, `releve-vues.md` et `arbitrages.md`** décrivent l'état d'avant
  et n'ont pas été remesurés. `routes.md` fait toujours autorité sur les adresses, le code le
  cite ; les trois autres sont de l'historique.
- Décocher le module `dossiers` d'un domaine fait reperdre la page d'où les droits s'accordent.
  L'écran l'annonce désormais, mais c'est un piège de conception qui mériterait mieux.

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

Deux contrôles seulement, et ils lancent le produit plutôt que de le juger sur pièces. Le premier
a attrapé, la veille de ce relevé, un exemple d'import qui montrait un serveur du jeu de
démonstration à tout installateur. **N'en ajoute pas un troisième.**

Les identifiants de développement vivent dans `.env`, ignoré. Pour ouvrir une instance neuve :
`pnpm base:administrateur`. Pour un jeu de démonstration complet : `pnpm base:peupler`.
