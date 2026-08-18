# Brief des vues — à destination du maquettage

**Produit** : plateforme de gestion des connaissances documentaires (nom de travail : *Codicillus*)
**Document source** : `CAHIER-DES-CHARGES-FONCTIONNEL.md` (même dossier)
**Version** : 1.0 — 13 août 2026
**Destinataire** : outil de conception des maquettes

---

## Mode d'emploi

### Ce que ce document fait

Il décrit **les 41 vues** de l'application : à quoi sert chaque écran, à quel moment il est vu, par qui, ce qu'il doit afficher exactement, dans quel ordre d'importance, quelles actions il propose, comment il réagit, et ce qu'il devient quand il n'y a rien à afficher ou que quelque chose échoue.

### Ce que ce document ne fait pas

Il **ne décide d'aucun parti pris visuel**. Pas de palette, pas de typographie, pas de rayon, pas de style d'ombre, pas de grille chiffrée, pas de référence esthétique. La direction artistique est entièrement à la main du concepteur des maquettes.

Quand ce document dit « saillant », « discret », « au premier regard », il exprime une **priorité de lecture fonctionnelle**, pas une prescription visuelle. Le moyen d'y parvenir est libre.

### Comment s'en servir

Chaque section de vue est **autonome** : elle rappelle le contexte nécessaire et peut être extraite telle quelle pour produire une maquette, sans avoir à lire le reste. Les conventions communes (§3) valent pour toutes les vues et n'ont pas à être redemandées à chaque fois, mais sont rappelées quand elles sont critiques.

### Ordre d'attaque recommandé

Trois vagues, à valider l'une après l'autre. Un mauvais choix de système se propage sur 41 écrans si on maquette tout d'un coup.

| Vague | Vues | Ce que la vague verrouille |
|---|---|---|
| **1 — Fondations** | V-14, V-08, V-09, V-07, V-17, V-37, V-41 | Lecture, recherche, tableau de bord, édition, navigation, système de composants |
| **2 — Structure** | V-10 à V-13, V-15, V-16, V-18, V-19, V-20 | Hiérarchie de rangement, exploration graphique, historique |
| **3 — Périphérie** | V-01 à V-06, V-21 à V-26, V-27 à V-36, V-38 à V-40 | Espace public, authentification, outils, administration, éléments transverses |

---

## 1. Le produit en dix lignes

Une base de connaissances documentaire interne, auto-hébergée, pour une direction technique d'environ 50 à 200 personnes.

Elle remplace un patrimoine éparpillé — procédures en traitement de texte, cartographies en tableur, PDF, fichiers texte, liens web — par un point d'entrée unique, cherchable et fiable.

Sa singularité : **chaque document affiche s'il est encore digne de confiance**. Un signal de fraîcheur, calculé sur la date de dernière vérification, est visible partout où un document apparaît. N'importe quel contributeur habilité peut le remettre au vert en un clic, sans formulaire. C'est le mécanisme central du produit.

Deuxième singularité : **une même note peut porter deux registres de lecture** — une version *Référence* dense et exhaustive, et une version *Opérationnelle* pas-à-pas orientée action. Pas un résumé : le même fond, réorganisé pour agir.

Troisième singularité : **le corpus est aussi un graphe**. Les notes peuvent être typées (Application, Serveur, Équipement réseau, Contact) et reliées entre elles par des relations qualifiées (héberge, dépend de, administre). On y lit les dépendances techniques et les points de défaillance unique.

---

## 2. Utilisateurs et vocabulaire

### 2.1 Les cinq profils

| Profil | Situation | Ce qu'il attend d'un écran |
|---|---|---|
| **L'intervenant** | En intervention, debout, pressé, parfois sur un poste qui n'est pas le sien | Trouver et lire. Rien d'autre ne doit le ralentir |
| **Le contributeur** | Au bureau, après une intervention, motivation fragile | Formaliser vite. Chaque friction est un abandon |
| **Le référent** | Responsable d'un périmètre | Voir l'état de santé, repérer ce qui est obsolète, arbitrer |
| **Le lecteur externe** | Collaborateur métier, sans compte | Une réponse, ou un moyen de demander de l'aide |
| **L'administrateur** | Responsable de la plateforme | Configurer la structure et mesurer l'adoption |

### 2.2 Les trois niveaux d'accès

| Niveau | Voit | Écrit |
|---|---|---|
| **Anonyme** | Uniquement les notes marquées *publiques* **et** *publiées* | Rien |
| **Contributeur** | Tout le corpus | Selon ses droits de dossier |
| **Administrateur** | Tout | Tout, plus la console d'administration |

Au-dessus de ça, des droits par dossier, hérités dans l'arborescence : **lecteur**, **rédacteur**, **gestionnaire**.

### 2.3 Vocabulaire contractuel

Ces mots sont ceux de l'interface. Ils ne doivent pas être remplacés par des synonymes dans les maquettes.

| Terme | Ce que c'est |
|---|---|
| **Note** | L'unité de connaissance. Jamais « document », « page » ou « article » |
| **Fiche** | Une note à laquelle un type structuré a été attribué (Application, Serveur…). Ce n'est pas un objet séparé |
| **Registre** | L'un des deux modes de lecture d'une note : *Référence* ou *Opérationnel* |
| **Univers** | Le niveau de rangement le plus haut |
| **Domaine** | Un espace de connaissance autonome, appartenant à un univers |
| **Dossier** | Rangement arborescent dans un domaine, jusqu'à 10 niveaux |
| **Étiquette** | Mot-clé libre. Jamais « tag » |
| **Relation** | Lien qualifié et dirigé entre deux notes |
| **Signet** | Lien web curaté |
| **Fraîcheur** | Le signal de fiabilité temporelle |
| **Vérifier** | Attester qu'une note est toujours d'actualité |
| **Console** | L'espace d'administration |

### 2.4 La hiérarchie de rangement

```
Univers  →  Domaine  →  Dossier (jusqu'à 10 niveaux)  →  Note
```

---

## 3. Conventions communes à toutes les vues

### 3.1 Le signal de fraîcheur

L'élément le plus important du produit. Il apparaît **partout** où une note est représentée : résultat de recherche, carte, ligne de liste, en-tête de lecture, nœud de graphe, export.

| Niveau | Sens | Libellé type |
|---|---|---|
| **Frais** | Vérifié récemment, fiable | « Vérifié il y a 12 jours » |
| **Vieillissant** | Une revue serait bienvenue | « Vérifié il y a 4 mois » |
| **Obsolète probable** | Ne pas s'y fier sans contrôle | « Pas revu depuis 8 mois — Revue nécessaire » |

Trois exigences fonctionnelles :

1. Il doit être **identifiable en vision périphérique**, sans lecture.
2. Il ne doit **jamais reposer sur la couleur seule** : un libellé, une forme ou un pictogramme doit porter la même information.
3. Il est **toujours accompagné de sa valeur en clair**. Un signal sans durée lisible ne remplit pas son rôle.

### 3.2 Les quatre états de toute zone de contenu

Chaque zone qui charge des données doit être maquettée dans ses quatre états.

| État | Attendu |
|---|---|
| **Chargement** | Une esquisse de la structure finale, pas un indicateur générique. L'utilisateur doit deviner ce qui arrive |
| **Vide** | Ce qui manque, pourquoi, et l'action qui permet d'y remédier. Jamais une zone blanche |
| **Erreur** | Message en langage clair, cause probable, bouton pour réessayer. Sans jargon, sans code technique |
| **Sans droit** | Explication de la restriction et, si pertinent, à qui s'adresser |

Une zone en erreur ne fait jamais tomber l'écran entier : les autres zones continuent de fonctionner.

### 3.3 La coquille applicative

Toutes les vues de l'espace de travail et de la console s'inscrivent dans une coquille permanente décrite en **V-37** : navigation latérale, barre supérieure, zone de contenu. Les vues de l'espace public (V-01 à V-04) et d'authentification (V-05, V-06) n'en font pas partie.

### 3.4 Fil d'Ariane

Présent sur toute vue située dans la hiérarchie de rangement. Reflète le chemin complet, chaque segment cliquable :

```
Accueil › Univers › Domaine › Dossier › … › Note
```

Un chemin trop long est tronqué en son milieu avec un moyen de le développer.

### 3.5 Actions et droits

Une action qu'un utilisateur n'a pas le droit d'exécuter **n'est pas affichée**. Elle n'est ni grisée, ni masquée derrière un message de refus après le clic. L'utilisateur ne rencontre pas de porte fermée.

Conséquence pour le maquettage : chaque vue portant des actions doit être déclinée au moins deux fois — **en lecture seule** et **avec droits d'écriture**.

### 3.6 Actions destructives

Toute action irréversible est confirmée par une boîte de dialogue qui rappelle précisément ce qui sera détruit **et son volume chiffré**. Pour la suppression d'un dossier ou d'un domaine, la saisie du nom exact est en outre exigée : le bouton de confirmation reste inactif tant que la saisie ne correspond pas.

### 3.7 Petits écrans

Le produit est utilisable depuis 360 px de large.

Deux cas d'usage sont **prioritaires** sur petit écran : **chercher** et **lire**. Ils doivent être excellents. La rédaction longue, la cartographie et la console d'administration sont acceptables en mode dégradé.

Comportements attendus : navigation latérale escamotable, colonnes latérales de la lecture repliées en sections dépliables, tableaux à défilement horizontal contenu dans leur bloc, jamais de défilement horizontal de la page entière.

### 3.8 Accessibilité

- Toute action atteignable au clavier seul, ordre de tabulation cohérent, indicateur de focus toujours visible.
- Les superpositions piègent le focus, se ferment à la touche d'échappement, et rendent le focus à leur déclencheur.
- L'information n'est jamais portée par la couleur seule.
- Les contenus graphiques (graphe, carte mentale, comparaison visuelle) disposent d'une alternative textuelle exploitable.

### 3.9 Langue et formats

Interface intégralement en français, messages d'erreur compris. Aucune chaîne technique brute exposée. Dates récentes en relatif (« il y a 3 jours ») avec la date absolue accessible ; dates anciennes au format français.

### 3.10 Densité d'information

Le produit affiche beaucoup d'information par écran, par nécessité : un référent doit voir l'état de son périmètre sans faire défiler. La contrainte fonctionnelle est de **hiérarchiser**, pas de retrancher. Chaque vue indique ci-après sa priorité de lecture : ce que l'œil doit atteindre en premier, en deuxième, en dernier.

---

## 4. Les 41 vues

Chaque section suit la même trame :

> **Rôle** · **Qui et quand** · **Points d'entrée** · **Contenu** · **Priorité de lecture** · **Actions** · **États** · **Interactions** · **Petit écran** · **Sorties**

---

## V-01 — Accueil public

**Rôle**
Première impression pour une personne sans compte. Elle doit comprendre en trois secondes ce qu'elle peut trouver ici, et comment le chercher.

**Qui et quand**
Le lecteur externe (collaborateur métier hors direction technique), qui a reçu l'adresse par un collègue ou un ticket. Il ne créera pas de compte. Il a une question précise.

**Points d'entrée**
Adresse racine du produit sans session active. Également après une déconnexion.

**Contenu**

| Zone | Contenu |
|---|---|
| Accroche | Message d'accueil disant clairement ce qu'on trouve ici et pour qui |
| Recherche | Champ de recherche proéminent, focus posé automatiquement au chargement |
| Guides populaires | Notes publiques classées par nombre de consultations. Pour chacune : titre, extrait de 2-3 lignes, domaine, nombre de consultations, signal de fraîcheur |
| Appel à l'action de repli | « Vous ne trouvez pas ? Ouvrir un ticket d'assistance », renvoyant vers une adresse externe configurée |
| Mention rassurante | « Pas besoin de compte pour consulter » |
| Accès connexion | Discret, pour les personnes qui ont un compte |

**Priorité de lecture**
1. Le champ de recherche. 2. L'accroche qui dit ce qu'on peut y chercher. 3. Les guides populaires. 4. Le repli vers l'assistance.

**Actions**
Lancer une recherche · Ouvrir un guide · Ouvrir un ticket · Se connecter.

**États**
*Vide* : aucun contenu public publié — l'accroche et la recherche restent, les guides populaires sont remplacés par une invitation à contacter l'assistance. *Erreur* : la recherche reste utilisable même si les guides populaires échouent.

**Interactions**
La saisie dans le champ bascule vers les résultats (V-02) au fil de la frappe.

**Petit écran**
Cas prioritaire. Le champ de recherche occupe la première hauteur d'écran. Guides populaires en liste verticale.

**Sorties**
V-02 (recherche publique) · V-03 (lecture publique) · V-05 (connexion) · portail d'assistance externe.

> **Contrainte absolue** : rien de ce qui est affiché ici ne provient d'une note interne. Aucun contenu non public n'est atteignable depuis cette vue, par aucun chemin.

---

## V-02 — Recherche publique

**Rôle**
Restituer les résultats d'une recherche pour un utilisateur sans compte.

**Qui et quand**
Le lecteur externe, après avoir tapé sa question depuis V-01.

**Points d'entrée**
Saisie depuis l'accueil public, ou adresse partagée contenant une requête.

**Contenu**

Reprend la structure de la recherche complète (V-08) **amputée** de tout ce qui n'a pas de sens sans compte :

| Élément | Présent |
|---|---|
| Champ de recherche avec la requête | oui |
| Nombre de résultats et temps de réponse | oui |
| Carte de résultat | oui — titre, extrait avec termes mis en évidence, domaine, type, signal de fraîcheur, date de dernière révision, nombre de consultations |
| Facettes | Réduites : domaine, type de note. Pas de statut, pas de visibilité, pas d'étiquette interne |
| Bascule de mode de recherche | non |
| Marquage brouillon | sans objet — aucun brouillon n'est visible |
| Action « créer cette note » sur résultat vide | non — remplacée par le repli vers l'assistance |

**Priorité de lecture**
1. Les résultats. 2. Le signal de fraîcheur de chacun. 3. Les facettes.

**États**
*Vide* : message reprenant la requête, suggestion de reformulation, et **appel à l'action vers l'assistance**. C'est le moment le plus important de cette vue : l'utilisateur qui ne trouve pas ne doit pas rester bloqué.

**Petit écran**
Cas prioritaire. Facettes repliées dans un panneau escamotable.

**Sorties**
V-03 (lecture publique) · portail d'assistance.

---

## V-03 — Lecture publique d'une note

**Rôle**
Afficher une note publique à un utilisateur sans compte.

**Qui et quand**
Le lecteur externe, après un résultat de recherche ou un lien reçu par courriel ou ticket.

**Contenu**

Reprend la lecture complète (V-14) **sans** :

- aucune action d'écriture (ni Modifier, ni Vérifier, ni Signaler, ni Supprimer) ;
- les panneaux Historique, Relations, Notes connexes ;
- les métadonnées internes (statut, visibilité).

Reprend **avec** :

- le titre, le corps, le sommaire ;
- **le signal de fraîcheur et sa date en clair** — la transparence sur la fiabilité vaut aussi pour les lecteurs externes ;
- l'auteur, la date de dernière modification, le type, le domaine ;
- les pièces jointes publiques ;
- les liens internes vers d'autres notes **publiques** uniquement ;
- le sélecteur de registre si un corps Opérationnel existe.

**Priorité de lecture**
1. Le titre. 2. Le signal de fraîcheur. 3. Le corps. 4. Le sommaire.

**Actions**
Naviguer dans le sommaire · Copier un bloc de code · Télécharger une pièce jointe · Basculer de registre · Imprimer · Ouvrir un ticket d'assistance.

**Petit écran**
Cas prioritaire. Sommaire replié en tête, dépliable. Colonne de métadonnées repliée en section.

**Sorties**
V-02 · autres notes publiques · portail d'assistance.

> Un lien interne pointant vers une note non publique n'est pas rendu cliquable et ne révèle pas le titre de sa cible.

---

## V-04 — Page non trouvée (public)

**Rôle**
Rattraper une adresse erronée sans laisser l'utilisateur dans une impasse.

**Contenu**
Message clair sans jargon ni code d'erreur brut · champ de recherche · lien vers l'accueil public · lien vers l'assistance.

**Priorité de lecture**
1. Le message. 2. La recherche. 3. Les issues.

> Cette vue sert aussi de réponse quand un contenu **existe mais n'est pas public**. Les deux cas produisent exactement la même page : rien ne doit permettre de déduire qu'une note confidentielle existe à cette adresse.

---

## V-05 — Connexion

**Rôle**
Authentifier un utilisateur en trois secondes.

**Qui et quand**
Contributeur ou administrateur. Souvent en début de journée, parfois en urgence depuis un poste tiers.

**Points d'entrée**
Lien discret depuis l'accueil public · redirection depuis une page protégée · expiration de session.

**Contenu**

| Zone | Contenu |
|---|---|
| Identité du produit | Nom, et rien de plus |
| Formulaire | Identifiant, mot de passe, case « se souvenir de moi » |
| Action principale | Bouton de connexion |
| Récupération | Lien vers la réinitialisation |
| Retour | Lien vers l'espace public — « consulter la documentation publique sans compte » |
| Message contextuel | Le cas échéant : « Session expirée », « Vous devez être connecté pour accéder à cette page » |

**Priorité de lecture**
1. Le champ identifiant, focus posé. 2. Le bouton. 3. Le retour vers le public.

**États**
*Erreur d'identifiants* : message **générique** — ni le fait que l'identifiant existe, ni celui que le mot de passe est faux ne sont révélés. *Trop de tentatives* : message indiquant la durée d'attente. *En cours* : bouton en attente, formulaire verrouillé.

**Interactions**
Validation à la touche Entrée depuis n'importe quel champ. Après connexion, retour à la page initialement demandée, sinon vers V-07.

**Petit écran**
Formulaire centré, pleine largeur.

**Sorties**
V-07 (accueil contributeur) · V-06 (réinitialisation) · V-01 (espace public).

---

## V-06 — Réinitialisation de mot de passe

**Rôle**
Permettre à un utilisateur de retrouver l'accès.

**Contenu**
Parcours guidé en étapes visibles : saisie de l'identifiant → confirmation d'envoi → saisie du nouveau mot de passe → confirmation. Longueur minimale annoncée **avant** la saisie, indicateur de robustesse, champ de confirmation.

**États**
*Succès* : confirmation explicite et lien direct vers la connexion. *Lien expiré* : message clair et moyen de relancer la demande. *Identifiant inconnu* : message **identique** au succès, pour ne pas révéler l'existence d'un compte.

**Sorties**
V-05.

---

## V-07 — Accueil contributeur

**Rôle**
Le tableau de bord quotidien. En un écran : où en est le corpus, ce qui a bougé, et ce qui attend l'utilisateur.

**Qui et quand**
Contributeur ou référent, à la connexion, plusieurs fois par jour. C'est la page la plus revue du produit après la lecture.

**Points d'entrée**
Après connexion · clic sur le logo ou « Accueil ».

**Contenu**

| Zone | Contenu détaillé |
|---|---|
| **Salutation** | Personnalisée, mentionnant le périmètre de l'utilisateur et un chiffre marquant : nombre de notes de son domaine, nombre mises à jour cette semaine |
| **Recherche** | Champ proéminent, focus automatique, rappel du raccourci clavier |
| **Indicateurs** | Quatre valeurs : notes au total · consultations sur 7 jours **avec tendance** vs semaine précédente · brouillons en cours · notes en attente de révision. Chaque indicateur est cliquable et mène à la liste correspondante |
| **Corbeille de révisions** | Notes signalées à réviser. Pour chacune : titre, domaine, **le commentaire du demandeur**, le demandeur, la date. Accès direct à la note |
| **Activité récente** | Flux chronologique : vérifications, publications, éditions, imports terminés. Pour chaque événement : qui, quoi (cible cliquable), quand en relatif |
| **Vos domaines** | Un bloc par domaine accessible : nom, couleur, nombre de notes, **répartition de la fraîcheur** sous forme de barre proportionnelle (part de frais / vieillissant / obsolète) |
| **Raccourcis de création** | Nouvelle note · Importer · Nouveau signet |
| **Pied de page** | Version du produit, volume total de notes, date de dernière synchronisation |
| **Aide première visite** | Indication du raccourci de recherche, affichée une seule fois par utilisateur, refermable |

**Priorité de lecture**
1. La recherche. 2. Les quatre indicateurs. 3. La corbeille de révisions — c'est ce qui appelle une action. 4. Vos domaines. 5. L'activité récente. 6. Les raccourcis.

**Actions**
Chercher · Ouvrir une note à réviser · Ouvrir un domaine · Créer une note · Importer · Créer un signet · Refermer l'aide.

**États**
Chaque panneau gère ses états **indépendamment** : l'activité récente peut être en erreur pendant que les indicateurs s'affichent.
*Vide global* (corpus neuf) : la vue devient un écran d'amorçage — « Votre base est vide », avec deux actions dominantes : *Importer votre patrimoine existant* et *Créer votre première note*.
*Vide partiel* : aucune révision en attente → message positif court ; aucune activité → « Rien de neuf cette semaine ».

**Interactions**
Les indicateurs sont des filtres cliquables. Les barres de fraîcheur mènent à la liste du domaine pré-filtrée sur le niveau cliqué.

**Petit écran**
Empilement vertical dans l'ordre de priorité de lecture. Les quatre indicateurs passent en grille de deux.

**Sorties**
V-08 · V-11 · V-14 · V-17 · V-24 · V-23.

> **Contrainte absolue** : tous les chiffres affichés sont réels. Aucune valeur illustrative, aucune tendance simulée. Si une donnée est indisponible, l'indicateur affiche un état neutre explicite — jamais un nombre inventé. Les maquettes doivent utiliser des valeurs plausibles et cohérentes entre elles.

---

## V-08 — Recherche

**Rôle**
Le cœur fonctionnel du produit. Trouver la bonne note en moins de dix secondes.

**Qui et quand**
Tous les profils authentifiés, plusieurs fois par jour, souvent sous pression.

**Points d'entrée**
Champ de recherche de la barre supérieure · champ de l'accueil · palette rapide (V-09) étendue · adresse partagée contenant requête et filtres.

**Contenu**

| Zone | Contenu détaillé |
|---|---|
| **Champ de recherche** | La requête, effaçable, focus au chargement |
| **Bascule de mode** | Trois modes : *Mots-clés* · *Sens* · *Hybride* (défaut). Chaque mode a besoin d'une explication courte accessible : mots-clés = correspondance textuelle tolérante aux fautes ; sens = notes parlant du même sujet même sans vocabulaire commun ; hybride = fusion des deux |
| **Compteur** | Nombre de résultats et temps de réponse (« 37 résultats en 0,4 s ») |
| **Filtres actifs** | Pastilles supprimables une à une, plus un « tout effacer » |
| **Facettes** | Univers · Domaine · Type de note · Statut · Fraîcheur · Étiquette · Visibilité. Chacune avec le nombre de résultats correspondants. Combinables |
| **Tri** | Pertinence (défaut) · Date de modification · Date de vérification · Consultations · Alphabétique |
| **Résultats** | Voir ci-dessous |

**Contenu d'une carte de résultat** — exhaustif :

- Titre
- Extrait de 2 à 3 lignes avec les termes recherchés mis en évidence
- **Signal de fraîcheur**
- **Date de dernière révision en clair** : « Révisé le 14/03/2026 » ou « Jamais révisé »
- Domaine et univers
- Type de note
- Auteur
- Nombre de consultations
- Nombre de pièces jointes, le cas échéant
- Marquage *brouillon*, le cas échéant
- Marquage *fiche* et type de fiche, le cas échéant
- Marquage *signet* si le résultat est un lien web (V-22)
- Indication si la correspondance a été trouvée dans le **registre Opérationnel** — dans ce cas l'ouverture se fait directement sur ce registre

**Priorité de lecture**
1. Le titre du premier résultat. 2. Son signal de fraîcheur. 3. L'extrait. 4. Les facettes. 5. Le mode de recherche.

**Actions**
Affiner la requête · Basculer de mode · Appliquer et retirer des filtres · Trier · Ouvrir un résultat · Créer la note manquante.

**États**
*Chargement* : esquisses de cartes de résultat.
*Vide* : message reprenant la requête entre guillemets, suggestion de reformulation, et **bouton « Créer cette note »** qui ouvre l'éditeur avec le titre pré-rempli. C'est un moment clé : l'échec de recherche devient une contribution.
*Erreur* : la recherche par sens indisponible bascule silencieusement en mots-clés, avec une mention discrète — la recherche ne tombe jamais en panne.
*Trop de résultats* : les facettes deviennent l'appel à l'action.

**Interactions clavier** — exigence forte :

| Touche | Effet |
|---|---|
| Flèches haut / bas | Parcourir les résultats |
| Entrée | Ouvrir le résultat sélectionné |
| Échappement | Effacer la requête, puis quitter |
| Flèche haut depuis le premier résultat | Retour du focus au champ de saisie |

La navigation boucle : après le dernier résultat, retour au premier. Le résultat sélectionné au clavier est visuellement identifiable **et** distinct du survol souris.

**Petit écran**
Cas prioritaire. Facettes dans un panneau escamotable avec compteur de filtres actifs. Cartes de résultat pleine largeur, sans perdre le signal de fraîcheur ni la date de révision.

**Sorties**
V-14 · V-03 · V-17 (création depuis résultat vide).

---

## V-09 — Palette de recherche rapide

**Rôle**
Chercher sans quitter sa page. Invoquée au clavier depuis n'importe où dans l'application.

**Qui et quand**
Tous, en permanence. C'est le geste le plus fréquent du produit.

**Points d'entrée**
Raccourci clavier universel · clic sur le champ de la barre supérieure.

**Contenu**

| Zone | Contenu |
|---|---|
| Champ de saisie | Focus immédiat, placeholder évoquant ce qu'on peut chercher |
| Résultats | Liste compacte : titre, domaine, type, signal de fraîcheur. Extrait court si la place le permet |
| Compteur | Nombre de résultats et temps de réponse |
| Pied | Rappel des raccourcis disponibles (naviguer, ouvrir, fermer) et lien « voir tous les résultats » vers V-08 |

**Priorité de lecture**
1. Le champ. 2. Le premier résultat. 3. Les raccourcis en pied.

**États**
*Au repos* (champ vide) : notes récemment consultées, ou suggestions d'entrée. Jamais une zone vide.
*Un seul caractère* : invitation à continuer.
*Vide* : message court et action « créer cette note ».

**Interactions**
- Résultats dès le deuxième caractère, affinés au fil de la frappe.
- Un second appui sur le raccourci alors que la palette est ouverte **replace le focus dans le champ** sans fermer.
- Échappement ferme et rend le focus à l'élément déclencheur.
- Clic hors de la palette ferme.
- Mêmes règles clavier que V-08.

**Petit écran**
Occupe la quasi-totalité de l'écran, avec un bouton de fermeture explicite.

**Sorties**
V-14 · V-08.

> Cette vue se superpose à n'importe quelle autre. Elle doit être maquettée au-dessus d'au moins deux contextes différents (lecture, tableau de bord) pour valider sa lisibilité.

---

## V-10 — Page d'un univers

**Rôle**
Vue consolidée d'un ensemble de domaines partageant un contexte.

**Qui et quand**
Référent ou administrateur, en pilotage. Point d'entrée pour naviguer vers un domaine.

**Points d'entrée**
Navigation latérale · fil d'Ariane · tableau de bord.

**Contenu**

| Zone | Contenu |
|---|---|
| **Couverture** | Nom de l'univers, description, icône, couleur d'identification, fil d'Ariane |
| **Indicateurs consolidés** | Volume total de notes · répartition de fraîcheur consolidée · nombre de contributeurs actifs · nombre de domaines |
| **Domaines rattachés** | Une carte par domaine : nom, description courte, couleur, nombre de notes, répartition de fraîcheur en barre, modules activés |
| **Accès cartographie** | Bouton menant au graphe du périmètre complet de l'univers |
| **Activité de l'univers** | Derniers mouvements tous domaines confondus |

**Priorité de lecture**
1. Le nom et l'identité de l'univers. 2. Les indicateurs consolidés. 3. Les cartes de domaines. 4. L'activité.

**États**
*Vide* : univers sans domaine — invitation à en créer un (si droits) ou explication.

**Petit écran**
Cartes de domaines empilées.

**Sorties**
V-11 · V-19 · V-14.

---

## V-11 — Page d'un domaine

**Rôle**
Le tableau de bord de santé d'un espace de connaissance, et le point d'entrée vers ses modules.

**Qui et quand**
Contributeur au quotidien pour accéder à son contenu ; référent en pilotage.

**Points d'entrée**
Navigation latérale · accueil (bloc « Vos domaines ») · page d'univers · fil d'Ariane.

**Contenu**

| Zone | Contenu |
|---|---|
| **Couverture** | Nom, description, couleur, univers de rattachement, fil d'Ariane |
| **Indicateurs** | Volume de notes · répartition de fraîcheur · notes jamais vérifiées · notes en attente de révision · brouillons |
| **Répartition par type** | Combien de procédures, de guides, d'architectures… |
| **Accès aux modules** | Uniquement les modules activés pour ce domaine, parmi : Notes · Dossiers · Fiches · Cartographie · Signets · Carte mentale |
| **Notes les plus consultées** | Top des notes du domaine |
| **Notes récemment modifiées** | Les derniers mouvements |
| **Contributeurs** | Qui alimente ce domaine, avec leur volume de contribution |
| **Actions** | Nouvelle note · Importer dans ce domaine · Exporter (administrateur) |

**Priorité de lecture**
1. Le nom du domaine et sa couverture. 2. La répartition de fraîcheur. 3. L'accès aux modules. 4. Les notes récentes et populaires. 5. Les contributeurs.

**États**
*Vide* : domaine sans note — écran d'amorçage avec deux actions dominantes (créer, importer).
*Modules* : un module non activé n'apparaît pas du tout. Ne pas maquetter d'onglet grisé.

**Interactions**
La répartition de fraîcheur est cliquable : chaque segment mène à V-12 pré-filtrée sur ce niveau.

**Petit écran**
Couverture compacte, indicateurs en grille de deux, modules en liste.

**Sorties**
V-12 · V-13 · V-19 · V-21 · V-22 · V-17 · V-24.

> Le nombre de modules activés varie d'un domaine à l'autre. Maquetter au moins deux cas : un domaine avec le seul module Notes, et un domaine avec tous les modules.

---

## V-12 — Liste des notes d'un domaine

**Rôle**
Parcourir et filtrer l'intégralité du contenu d'un domaine, sans passer par la recherche.

**Qui et quand**
Contributeur qui explore ; référent qui traite une liste d'obsolètes.

**Points d'entrée**
Page de domaine · segment de barre de fraîcheur · indicateur cliquable de l'accueil.

**Contenu**

| Zone | Contenu |
|---|---|
| **En-tête** | Nom du domaine, fil d'Ariane, compteur de notes affichées sur le total |
| **Barre de filtres** | Type de note · Étiquette · Fraîcheur · Statut · Dossier · Auteur. Filtres actifs en pastilles supprimables |
| **Tri** | Date de modification (défaut) · Date de vérification · Consultations · Alphabétique |
| **Densité** | Bascule entre affichage compact et confortable |
| **Liste** | Présentation en lignes-cartes. Pour chaque note : titre, extrait, type, étiquettes, **signal de fraîcheur**, auteur, date de modification, consultations, marquage brouillon, marquage fiche, dossier de rattachement |
| **Pagination ou défilement continu** | Selon volume |

**Priorité de lecture**
1. Le titre de chaque note. 2. Son signal de fraîcheur. 3. Les filtres. 4. Les métadonnées secondaires.

**Actions**
Filtrer · Trier · Changer la densité · Ouvrir une note · Créer une note.

**États**
*Vide sans filtre* : domaine sans contenu, écran d'amorçage.
*Vide avec filtres* : « Aucune note ne correspond à ces filtres », avec un bouton de réinitialisation. Distinguer clairement les deux cas.

**Petit écran**
Filtres dans un panneau escamotable. Lignes-cartes pleine largeur, densité compacte par défaut.

**Sorties**
V-14 · V-17 · V-13.

---

## V-13 — Page d'un dossier

**Rôle**
Naviguer dans l'arborescence et gérer l'organisation d'un périmètre.

**Qui et quand**
Contributeur qui range ; gestionnaire qui structure.

**Points d'entrée**
Arborescence de la navigation latérale · fil d'Ariane · page de domaine.

**Contenu**

| Zone | Contenu |
|---|---|
| **Fil d'Ariane complet** | Accueil › Univers › Domaine › Dossier parent › … › Dossier courant. Chaque segment cliquable |
| **En-tête** | Nom du dossier, compteurs (sous-dossiers, notes), **droit effectif de l'utilisateur** affiché explicitement (lecteur, rédacteur ou gestionnaire) |
| **Sous-dossiers** | Présentés en tuiles : nom, nombre de notes contenues, nombre de sous-dossiers |
| **Notes du dossier** | **Groupées par type de note**, avec un intitulé de groupe et un compteur. Pour chaque note : titre, signal de fraîcheur, auteur, date de modification, marquage brouillon |
| **Barre d'actions** | Selon droit effectif — voir ci-dessous |

**Actions selon le droit**

| Action | Droit requis |
|---|---|
| Nouvelle note dans ce dossier | Rédacteur |
| Nouveau sous-dossier | Gestionnaire |
| Renommer le dossier | Gestionnaire |
| Déplacer le dossier | Gestionnaire |
| Supprimer le dossier et son contenu | Gestionnaire |
| Gérer les droits | Gestionnaire |

**Priorité de lecture**
1. Le fil d'Ariane — savoir où l'on est. 2. Les sous-dossiers. 3. Les notes groupées. 4. Les actions.

**États**
*Vide* : dossier sans contenu — invitation à créer une note ou un sous-dossier selon les droits.
*Lecteur seul* : aucune action de gestion visible.

**Interactions — trois boîtes de dialogue à maquetter**

1. **Créer un sous-dossier** : nom, position. Simple.
2. **Renommer / déplacer** : nom, sélecteur arborescent de destination. Refus explicite si la destination est un descendant du dossier déplacé, ou dans un autre domaine, ou si la profondeur dépasserait 10 niveaux — chaque refus avec un message compréhensible.
3. **Supprimer** : affiche le décompte exact (« Ceci supprimera 5 sous-dossiers et 12 notes »), exige la **saisie du nom exact du dossier**, bouton de confirmation inactif tant que la saisie ne correspond pas.

**Petit écran**
Fil d'Ariane tronqué avec développement à la demande. Tuiles de sous-dossiers en liste.

**Sorties**
V-14 · V-17 · autres dossiers · boîte de dialogue de droits (V-40).

---

## V-14 — Lecture d'une note

**Rôle**
L'écran le plus vu du produit, et le moment de vérité : un intervenant lit une procédure et doit savoir s'il peut s'y fier.

**Qui et quand**
Tous les profils. L'intervenant debout et pressé est le cas dimensionnant.

**Points d'entrée**
Résultat de recherche · palette rapide · lien interne depuis une autre note · arborescence · liste de domaine ou de dossier · rétrolien · nœud de cartographie · lien reçu par courriel.

**Structure**
Trois colonnes sur grand écran, une seule sur petit écran :

| Colonne | Contenu |
|---|---|
| **Gauche** | Sommaire auto-généré, navigable |
| **Centre** | Bandeaux d'alerte, en-tête, sélecteur de registre, corps |
| **Droite** | Métadonnées, actions, panneaux relationnels |

### Contenu de l'en-tête

Titre · **signal de fraîcheur avec sa durée en clair** · date de dernière vérification · identité du dernier vérificateur · auteur · date de dernière modification · type de note · domaine · univers · étiquettes cliquables · nombre de consultations · marquage brouillon le cas échéant · visibilité.

### Bandeaux d'alerte (au-dessus de tout le reste, empilables)

| Bandeau | Quand | Contenu |
|---|---|---|
| **Révision demandée** | Une demande est ouverte | « Révision demandée par *nom* le *date* » + le commentaire du demandeur + action pour lever la demande (si droits) |
| **Brouillon** | Statut brouillon | Mention explicite que cette note n'est pas visible du public |
| **Registre à resynchroniser** | Le corps Référence a changé après la dernière mise à jour de l'Opérationnel | « Version opérationnelle à resynchroniser — la référence a été modifiée le *date* » |

### Sélecteur de registre

- **N'apparaît que si** un corps Opérationnel existe.
- Deux entrées : *Référence* (par défaut à l'ouverture) et *Opérationnel*.
- Le registre affiché est reflété dans l'adresse : le lien est partageable tel quel.
- Le sommaire est recalculé selon le registre affiché.
- **Si aucun Opérationnel n'existe** : une invitation discrète « Ajouter une version opérationnelle », visible seulement pour les profils habilités.

### Sommaire

Généré à partir des titres du registre affiché · imbriqué selon les niveaux · section courante mise en évidence pendant le défilement · défilement animé au clic · **absent si le contenu ne comporte aucun titre**.

### Corps — constructions à maquetter

Toutes doivent apparaître dans la maquette de référence, car elles fixent le rendu du contenu :

| Construction | Exigence |
|---|---|
| Titres, 6 niveaux | Hiérarchie visuelle nette, alimente le sommaire |
| Paragraphe, gras, italique, souligné, barré, surligné | — |
| Code en ligne | Distinct du texte courant |
| **Bloc de code** | Coloration syntaxique, langage affiché, **bouton de copie**. La copie produit un texte brut sans numéro de ligne ni caractère parasite |
| Listes à puces, numérotées, imbriquées | — |
| Liste de tâches | Cases à cocher en lecture seule |
| Citation | — |
| **Blocs d'alerte** | Trois niveaux distincts : *astuce*, *attention*, *danger*. Distinguables sans la couleur seule |
| Tableau | En-têtes, défilement horizontal contenu si trop large |
| Image | En ligne, agrandissement au clic |
| Séparateur | — |
| **Diagramme** | Rendu graphique d'un diagramme décrit en texte |
| **Lien interne valide** | Navigation directe |
| **Lien interne cassé** | Signalé visuellement, avec possibilité de créer la note manquante |
| Lien externe | Ouverture dans un nouvel onglet, signalé |

> La largeur de la colonne de lecture est **optimisée pour le confort de lecture, pas maximisée**. Un écran large ne doit pas produire des lignes de 200 caractères.

### Panneaux de la colonne droite

| Panneau | Contenu | Condition d'affichage |
|---|---|---|
| **Actions** | Modifier · Marquer comme vérifié · Signaler à réviser · Historique · Exporter · Supprimer | Selon droits |
| **Pièces jointes** | Nom, taille, type, téléchargement | Si présentes |
| **Rétroliens** | Notes qui pointent vers celle-ci : titre, domaine | Si présents |
| **Relations** | Relations typées entrantes et sortantes, **groupées par type**, avec le libellé adapté au sens de lecture, plus la gestion (ajouter, supprimer) | Si module Fiches actif |
| **Notes connexes** | Notes sémantiquement proches, avec indication de proximité | Si recherche par sens disponible |
| **Historique de vérification** | Chronologie : qui a vérifié, quand | Si présent |
| **Propriétés de fiche** | Champs typés de la fiche, sous forme structurée et lisible | Si la note est une fiche |
| **Position** | Domaine, dossier, navigation vers les notes voisines | Toujours |

**Priorité de lecture**
1. Le titre. 2. **Le signal de fraîcheur** — c'est ce qui décide si l'utilisateur continue. 3. Un bandeau d'alerte s'il y en a un. 4. Le corps. 5. Le sommaire. 6. Les actions. 7. Les panneaux relationnels.

**Actions**
Naviguer dans le sommaire · Copier un bloc de code · Basculer de registre · Télécharger une pièce jointe · Suivre un lien · Modifier · Vérifier · Signaler à réviser · Ouvrir l'historique · Supprimer · Imprimer.

**États**
*Chargement* : esquisse de la structure à trois colonnes.
*Chaque panneau latéral gère ses états indépendamment* — un panneau en erreur ne casse pas la lecture.
*Sans droit d'écriture* : le panneau Actions se réduit aux actions de lecture.
*Note très courte* : pas de sommaire, la mise en page doit rester équilibrée.
*Note très longue* : le sommaire devient l'outil principal de navigation.

**Interactions clés à maquetter**

1. **Vérification en un clic** : bouton, puis retour visuel immédiat — le signal repasse au vert et la date se met à jour sans rechargement. C'est le geste central du produit : il doit être gratifiant.
2. **Signalement à réviser** : le clic ouvre un champ de commentaire décrivant la révision attendue, puis confirme.
3. **Copie d'un bloc de code** : retour visuel bref confirmant la copie.
4. **Bascule de registre** : sans rechargement, avec recalcul du sommaire.

**Petit écran**
Cas prioritaire absolu. Ordre d'empilement : bandeaux → titre → signal de fraîcheur → sommaire replié → corps → panneaux repliés en sections. Les actions principales (Modifier, Vérifier) restent atteignables sans faire défiler jusqu'en bas.

**Impression**
Sans navigation ni panneaux, métadonnées de confiance en en-tête, adresses des liens en note.

**Sorties**
V-17 (édition) · V-18 (édition du registre Opérationnel) · V-15 (historique) · V-13 (dossier) · V-11 (domaine) · V-19 (cartographie) · autres notes.

> **Décliner cette vue en au moins quatre variantes** : lecture seule sans droits · avec droits d'écriture · avec un bandeau de révision demandée · avec les deux registres et le bandeau de resynchronisation. C'est l'écran qui fixe le système entier.

---

## V-15 — Historique des versions

**Rôle**
Voir l'évolution d'une note et récupérer un état antérieur.

**Qui et quand**
Contributeur qui doute d'une modification récente, ou qui veut comprendre ce qui a changé.

**Points d'entrée**
Bouton « Historique » depuis la lecture (V-14).

**Forme**
Panneau latéral qui se superpose à droite de la lecture, sans quitter la note.

**Contenu**

| Zone | Contenu |
|---|---|
| **En-tête du panneau** | Titre de la note, nombre de versions conservées, rappel du plafond de rétention |
| **Liste des versions** | De la plus récente à la plus ancienne. Pour chacune : numéro de version, date relative et absolue, auteur de la modification, et une indication de l'ampleur du changement si disponible |
| **Sélection pour comparaison** | Deux cases à cocher permettant de choisir exactement deux versions |
| **Action de comparaison** | Bouton actif seulement quand deux versions sont sélectionnées |

**Interactions**

- **Clic sur une version** : elle s'affiche en lecture seule dans la zone de contenu principale, avec un **bandeau d'identification** (« Version 12 du 11/03/2026, par Marc D. ») et un bouton **Restaurer**.
- **Restaurer** : confirmation qui explique que l'état courant sera d'abord conservé comme nouvelle version — rien n'est perdu, l'opération est réversible.
- Sélectionner deux versions puis comparer mène à V-16.

**Priorité de lecture**
1. La version la plus récente. 2. Les auteurs et les dates. 3. Les moyens de comparer.

**États**
*Vide* : note jamais modifiée depuis sa création — « Aucune version antérieure ».
*Une seule version* : la comparaison est indisponible, avec une explication.

**Petit écran**
Le panneau devient une superposition pleine hauteur.

**Sorties**
V-16 · retour à la lecture courante.

---

## V-16 — Comparaison de deux versions

**Rôle**
Comprendre précisément ce qui a changé entre deux états d'une note.

**Qui et quand**
Contributeur enquêtant sur une modification.

**Points d'entrée**
Depuis l'historique (V-15). Adresse partageable.

**Contenu**

| Zone | Contenu |
|---|---|
| **En-tête** | « Version 5 → Version 8 », avec pour chaque version sa date et son auteur. Retour vers la note |
| **Bascule de mode** | *Texte* et *Visuel* |
| **Zone de comparaison** | Selon le mode — voir ci-dessous |

**Mode Texte**
Différences ligne à ligne : lignes inchangées, lignes supprimées, lignes ajoutées, distinguées sans recourir à la couleur seule (marqueur en début de ligne). Présentation façon journal de modifications.

**Mode Visuel**
Deux colonnes côte à côte, contenu rendu tel qu'il s'affiche réellement :
- colonne gauche = version ancienne, blocs supprimés mis en évidence ;
- colonne droite = version récente, blocs ajoutés mis en évidence ;
- **les blocs identiques sont alignés horizontalement** entre les deux colonnes, y compris quand un côté a des blocs en plus.

**Priorité de lecture**
1. Quelles versions sont comparées. 2. Les différences. 3. La bascule de mode.

**États**
*Aucune différence* : message explicite plutôt qu'un écran vide.
*Comparaison impossible* (même version sélectionnée deux fois) : message clair.

**Petit écran**
Le mode Visuel bascule en affichage alterné (ancien puis nouveau) plutôt qu'en colonnes.

**Alternative textuelle**
Le mode Visuel doit disposer d'une restitution linéaire exploitable pour la lecture d'écran.

**Sorties**
V-15 · V-14.

---

## V-17 — Éditeur de note

**Rôle**
Permettre de formaliser une procédure simple en moins de cinq minutes. Chaque friction est un abandon.

**Qui et quand**
Contributeur, après une intervention, motivation fragile. C'est l'écran qui décide si le produit se remplit ou reste vide.

**Points d'entrée**
Bouton « Nouvelle note » (barre supérieure, accueil, domaine, dossier) · bouton « Modifier » depuis la lecture · bouton « Créer cette note » depuis une recherche infructueuse · lien interne cassé.

**Structure**
Zone de rédaction dominante, métadonnées accessibles sans encombrer, barre d'outils permanente.

**Contenu**

| Zone | Contenu |
|---|---|
| **Titre** | Champ de saisie proéminent, traité comme un titre et non comme un champ de formulaire |
| **Barre d'outils** | Gras · italique · souligné · barré · surligné · code en ligne · titres (3 niveaux au moins) · liste à puces · liste numérotée · liste de tâches · citation · bloc de code · tableau · image · lien · bloc d'alerte · séparateur · annuler · rétablir · menu étendu |
| **Zone de rédaction** | Le contenu, rendu tel qu'il s'affichera en lecture |
| **Métadonnées** | Type de note · Domaine · Dossier · Étiquettes · Visibilité · Statut · Type de fiche (optionnel) |
| **Indicateur de sauvegarde** | « Modifications non enregistrées » / « Enregistré à 14:32 » |
| **Actions** | Enregistrer · Prévisualiser · Annuler |

**Détail des métadonnées**

| Champ | Comportement |
|---|---|
| Type de note | Liste, obligatoire, pré-sélectionné par le template choisi |
| Domaine | Liste, obligatoire, pré-sélectionné sur le domaine de l'utilisateur. Le changer réinitialise le dossier, avec avertissement |
| Dossier | Sélecteur **arborescent** du domaine choisi, obligatoire |
| Étiquettes | Saisie avec auto-complétion sur l'existant, création à la volée, suppression individuelle |
| Visibilité | Interne (défaut) / Publique |
| Statut | Publiée (défaut) / Brouillon |
| Type de fiche | Optionnel. S'il est choisi, un **formulaire de propriétés typées apparaît**, dérivé du schéma du type |

**Vues secondaires à maquetter**

1. **Sélecteur de template** — s'affiche à la création. Liste des templates avec un aperçu de leur structure. Une option « Partir d'une page vierge » toujours visible et jamais moins accessible que les templates : le template est subsidiaire.
2. **Menu de commandes** — déclenché par un caractère sur une ligne vide. Liste filtrable au fil de la frappe, navigable au clavier, refermable à l'échappement. Entrées : bloc de code · image · tableau · alerte (3 types) · lien interne · liste de tâches · citation · séparateur · diagramme.
3. **Auto-complétion de lien interne** — déclenchée par une séquence de caractères. Propose les notes existantes avec leur domaine en indication.
4. **Avertissement de doublon** — non bloquant. Si une note très proche existe, un message propose de l'ouvrir plutôt que de créer un doublon. L'utilisateur peut toujours ignorer et continuer.
5. **Suggestions de liens** — le produit propose des liens internes pertinents déduits du contenu rédigé. Proposés, jamais appliqués automatiquement, acceptés au cas par cas.
6. **Prévisualisation** — bascule vers le rendu final sans quitter la page ni perdre le contenu.

**Priorité de lecture**
1. Le champ titre. 2. La zone de rédaction. 3. La barre d'outils. 4. Les métadonnées. 5. L'état de sauvegarde.

**États**
*Création vierge* · *Création depuis template* (contenu pré-rempli) · *Modification d'une note existante* (tout pré-rempli) · *Modifications non enregistrées* · *Enregistrement en cours* · *Erreur d'enregistrement* (le contenu n'est jamais perdu) · *Champ obligatoire manquant* (signalé à l'endroit du champ, pas seulement en haut de page).

**Interactions clés**

- Conversion Markdown au fil de la frappe : titres, listes, gras, code en ligne, bloc de code avec langage, citation, séparateur, liste de tâches.
- Sauvegarde automatique périodique avec indicateur d'état.
- Raccourci d'enregistrement, plus bouton explicite.
- Avertissement si l'utilisateur quitte avec des modifications non enregistrées.
- Insertion d'image par bouton, glisser-déposer, ou collage depuis le presse-papiers.
- Navigation entre cellules de tableau à la tabulation ; ajout et suppression de lignes et colonnes par menu contextuel.

**Petit écran**
Mode dégradé accepté. La barre d'outils se réduit aux actions essentielles, le reste passe dans le menu étendu. Les métadonnées passent dans un panneau escamotable.

**Sorties**
V-14 (après enregistrement) · retour sans enregistrer.

---

## V-18 — Éditeur du registre Opérationnel

**Rôle**
Rédiger la version pas-à-pas d'une note existante.

**Qui et quand**
Contributeur qui veut rendre exploitable une procédure de référence trop dense.

**Points d'entrée**
Invitation « Ajouter une version opérationnelle » depuis la lecture · bouton Modifier depuis le registre Opérationnel affiché.

**Contenu**
Identique à V-17, **à trois différences près** :

1. Un **sélecteur de registre** indique en permanence et sans ambiguïté quel corps est en cours d'édition. Le risque d'écraser le mauvais corps doit être nul.
2. Les **métadonnées ne sont pas éditables ici** : titre, type, domaine, dossier, étiquettes, visibilité et statut appartiennent à la note et se modifient depuis V-17. Elles sont affichées en lecture seule pour le contexte.
3. Deux **actions supplémentaires** : « Marquer comme resynchronisé » (pour le cas « j'ai relu, ça tient toujours », sans rééditer) et « Supprimer la version opérationnelle » (destructive, confirmée).

**Aide au démarrage**
À la création d'un Opérationnel vierge, un accès au contenu du registre Référence doit être possible sans quitter l'écran (consultation côte à côte ou repliable), puisque l'auteur réorganise le même fond.

**Priorité de lecture**
1. Le sélecteur de registre — savoir qu'on édite l'Opérationnel. 2. La zone de rédaction. 3. Les actions spécifiques.

**États**
*Opérationnel vierge* (première rédaction) · *Opérationnel existant* · *Opérationnel désynchronisé* (bandeau signalant que la Référence a changé depuis, avec un accès au comparatif).

**Sorties**
V-14 sur le registre Opérationnel.

---

## V-19 — Cartographie, vue complète

**Rôle**
Explorer visuellement les dépendances techniques d'un périmètre : quelle application est hébergée où, qu'est-ce qui dépend de quoi, où sont les points de rupture.

**Qui et quand**
Référent en analyse d'impact, souvent pendant ou après un incident. Usage posé, sur grand écran.

**Points d'entrée**
Menu de navigation · page de domaine · page d'univers · panneau Relations d'une note.

**Le graphe**
Les **nœuds** sont des notes. Les **arêtes** sont les relations qualifiées entre elles. La cartographie n'a aucune donnée propre : elle est intégralement dérivée du corpus.

**Contenu**

| Zone | Contenu |
|---|---|
| **Barre de contrôle** | Sélecteur de périmètre (domaine, univers, ou global) · bascule de vue (*complète* / *par type maître*) · recherche dans le graphe · bascule d'affichage de la criticité · bouton d'effacement de la sélection · recentrage |
| **Zone de graphe** | Le graphe lui-même |
| **Légende** | Liste des types présents avec leur pictogramme, leur encodage et leur compteur. **Cliquable** : cliquer un type isole ses nœuds |
| **Panneau de détail** | Au clic sur un nœud — voir ci-dessous |

**Encodage des nœuds — exigences fonctionnelles**

| Information | Doit être encodée par |
|---|---|
| Type de la note (Application, Serveur…) | Un encodage propre à chaque type, **plus** un pictogramme. Jamais la couleur seule |
| Nombre de connexions | La taille du nœud |
| **Point d'articulation** (défaillance unique) | Un marquage distinctif et non ambigu |
| Nœud hors périmètre mais relié | Traitement « fantôme » atténué, tout en restant sélectionnable et navigable |
| Nœud sélectionné et ses voisins | Pleine intensité |
| Reste du graphe pendant une sélection | Atténué |

**Comportements fondateurs**

1. **Focus persistant au clic** — cliquer un nœud met en avant ce nœud et ses voisins directs ; tout le reste s'estompe et **reste estompé** jusqu'au prochain clic ou à l'effacement explicite. C'est un point dur : la mise en évidence au survol seul est inutilisable pour analyser.
2. **Disposition stable** — les nœuds ne se chevauchent pas et ne dérivent pas indéfiniment. La disposition se stabilise puis reste stable.
3. **Zoom, panoramique, déplacement d'un nœud, recentrage automatique sur l'ensemble.**
4. **Recherche dans le graphe** — sauter directement à un nœud par son nom.
5. **Point d'entrée par les nœuds les plus connectés** quand le périmètre est trop vaste pour être affiché intégralement.

**Panneau de détail d'un nœud**
Nom · type · domaine · signal de fraîcheur · propriétés principales de la fiche · **relations listées par type** avec le libellé adapté au sens · indicateurs de criticité (nombre de connexions, statut de point d'articulation) · lien vers la note complète.

**Priorité de lecture**
1. La structure générale du graphe. 2. La légende, qui rend cette structure interprétable. 3. Les contrôles de périmètre. 4. Le panneau de détail à la sélection.

**États**
*Chargement* : le calcul de disposition peut prendre du temps — indiquer la progression plutôt qu'un écran figé.
*Vide* : périmètre sans aucune relation — expliquer que la cartographie se nourrit des relations déclarées sur les notes, et renvoyer vers la manière d'en créer.
*Trop dense* : proposer explicitement de réduire le périmètre ou de basculer en vue par type maître.
*Sans droit* : la vue globale tous domaines est réservée aux profils habilités.

**Alternative textuelle**
Liste équivalente des nœuds et de leurs relations, exploitable sans le rendu graphique.

**Petit écran**
Mode dégradé accepté. Privilégier la liste des nœuds et le panneau de détail plutôt qu'un graphe illisible.

**Sorties**
V-20 · V-14 · V-11.

---

## V-20 — Cartographie, vue par type maître

**Rôle**
Explorer le graphe en partant d'une famille d'objets, sans être noyé. Complémentaire de V-19, sur la même page, via une bascule.

**Qui et quand**
Référent qui part d'une question précise : « quelles sont mes applications, et de quoi dépend chacune ».

**Points d'entrée**
Bascule de vue depuis V-19.

**Contenu**

| Zone | Contenu |
|---|---|
| **Sélecteur de type maître** | Liste des types présents dans le périmètre, avec leur compteur. Obligatoire pour afficher quoi que ce soit |
| **Zone de graphe** | Voir le déroulé ci-dessous |
| **Panneau de détail** | Identique à V-19 |

**Déroulé en trois temps — c'est le cœur de cette vue**

1. **État initial** : tous les nœuds du type choisi sont affichés en disposition aérée et déterministe (par exemple en anneau), **sans leurs voisins et sans aucune arête**. L'écran est lisible même avec plusieurs dizaines de nœuds.
2. **Clic sur un nœud maître** : il est **recentré**, ses voisins directs apparaissent autour de lui en étoile, avec **uniquement les arêtes qui le touchent** — jamais les arêtes entre voisins.
3. **Clic sur un autre nœud maître** : le voisinage précédent se replie, le nouveau se déplie. Un seul voisinage affiché à la fois.

Règles complémentaires :
- Cliquer un **voisin non maître** : sélection simple et ouverture du panneau de détail, **aucun dépliage supplémentaire**. La profondeur est strictement limitée à un saut.
- Cliquer un voisin qui se trouve être du type maître : il devient le nouveau centre.
- Les transitions entre états sont progressives, pas brutales.

**Priorité de lecture**
1. Le sélecteur de type. 2. L'anneau de nœuds maîtres. 3. Le voisinage déplié. 4. Le panneau de détail.

**États**
*Aucun type sélectionné* : invitation explicite à en choisir un.
*Type sans nœud* : « Aucune fiche de ce type dans ce périmètre ».
*Nœud maître sans relation* : affiché seul et centré, avec la mention « Aucune connexion ».
*Nœud disparu entre-temps* : effacement discret du focus, retour à l'anneau, message court.

**Trois moments à maquetter**
L'état initial (anneau seul), un voisinage déplié, et le passage de l'un à l'autre.

**Sorties**
V-19 · V-14.

---

## V-21 — Carte mentale

**Rôle**
Visualiser l'arborescence du corpus sous forme dépliable, pour comprendre la structure plutôt que chercher un contenu.

**Qui et quand**
Nouvel arrivant qui découvre l'organisation ; référent qui vérifie la cohérence du rangement.

**Points d'entrée**
Menu de navigation · page de domaine.

**Contenu**

| Zone | Contenu |
|---|---|
| **Sélecteur de périmètre** | Tout · un univers · un domaine |
| **Arbre** | Univers → Domaines → Dossiers → Notes, en représentation arborescente |
| **Contrôles** | Zoom, panoramique, recentrage, tout replier |

Les branches non dépliées portent un **compteur** de ce qu'elles contiennent. Le dépliage est progressif : une branche ne charge son contenu qu'à l'ouverture.

**Priorité de lecture**
1. La racine et les premiers niveaux. 2. Les compteurs, qui indiquent où se trouve la matière. 3. Les feuilles.

**Actions**
Déplier · replier · zoomer · recentrer · ouvrir une note.

**États**
*Chargement d'une branche* : indication locale sur la branche, pas sur l'écran entier.
*Vide* : périmètre sans contenu.

**Alternative textuelle**
Arborescence équivalente en liste imbriquée navigable.

**Petit écran**
Mode dégradé accepté : bascule vers une liste imbriquée dépliable.

**Sorties**
V-14 · V-13.

> La carte mentale ne montre que ce que l'utilisateur a le droit de voir. Un dossier interdit n'apparaît pas.

---

## V-22 — Signets

**Rôle**
Retrouver les liens web utiles rattachés à un domaine.

**Qui et quand**
Contributeur cherchant une ressource externe déjà repérée par un collègue.

**Points d'entrée**
Page de domaine · menu de navigation · résultat de recherche.

**Contenu**

| Zone | Contenu |
|---|---|
| **En-tête** | Domaine concerné, compteur, fil d'Ariane |
| **Filtres** | Étiquette · auteur |
| **Liste** | Pour chaque signet : titre, adresse lisible (domaine du site), description, étiquettes, auteur, date d'ajout |
| **Actions** | Nouveau signet · modifier · supprimer (selon droits) |

**Priorité de lecture**
1. Les titres. 2. Les adresses. 3. Les étiquettes.

**États**
*Vide* : invitation à créer le premier signet.

**Interactions**
Le clic sur un signet ouvre le lien externe dans un nouvel onglet, avec une indication claire qu'on quitte le produit.

**Sorties**
V-23 · sites externes.

> Les signets apparaissent aussi dans les résultats de recherche (V-08), où ils doivent être **clairement identifiables comme liens externes** et non comme des notes.

---

## V-23 — Création et édition d'un signet

**Rôle**
Ajouter un lien web au corpus en quelques secondes.

**Forme**
Formulaire court, en boîte de dialogue ou page dédiée selon le contexte d'appel.

**Contenu**
Adresse (obligatoire) · Titre (proposé automatiquement à partir de l'adresse quand c'est possible) · Description · Domaine de rattachement · Étiquettes avec auto-complétion.

**Priorité de lecture**
1. Le champ adresse. 2. Le titre. 3. Le reste.

**États**
*Adresse invalide* : signalé au niveau du champ.
*Titre en cours de récupération* : indication d'attente non bloquante — l'utilisateur peut saisir le titre lui-même sans attendre.
*Édition* : tous les champs pré-remplis, plus une action de suppression.

**Sorties**
V-22.

---

## V-24 — Import

**Rôle**
Reprendre le patrimoine documentaire existant. Sans cet écran, le produit démarre vide et n'a aucune valeur.

**Qui et quand**
Administrateur ou contributeur, au démarrage du produit puis ponctuellement. Souvent une opération à enjeu : plusieurs centaines de fichiers.

**Points d'entrée**
Menu de création · bouton depuis l'accueil · bouton depuis une page de domaine · onglet Imports de la console (V-35).

**Forme**
Parcours en quatre étapes, avec une progression visible et un retour possible en arrière avant validation.

### Étape 1 — Choix du scénario

Trois scénarios, décrits **en langage métier, sans jargon** :

| Scénario | Formulation attendue |
|---|---|
| Notes dans un domaine existant | « Importer des notes dans un domaine existant » — l'arborescence des fichiers deviendra l'arborescence des dossiers |
| Domaine complet | « Importer un domaine complet » — le dossier de premier niveau deviendra un nouveau domaine |
| Corpus structuré | « Importer un corpus préparé » — pour des fichiers portant des métadonnées, avec résolution automatique des liens et idempotence |

Chaque scénario mérite une explication d'une ou deux phrases et une illustration de ce que ça produit.

### Étape 2 — Dépôt

Zone de glisser-déposer acceptant un dossier ou une archive, plus un sélecteur de fichiers classique. Formats acceptés annoncés d'emblée : traitement de texte, présentation, PDF, texte brut, Markdown. Sélection du domaine cible si le scénario le demande. Option *simulation* (valide tout et produit le rapport sans rien modifier) pour le scénario « corpus préparé ».

### Étape 3 — Aperçu avant validation

Écran de contrôle, avant tout traitement :
- l'**arborescence détectée**, présentée comme un arbre ;
- le nombre de fichiers par format ;
- les fichiers qui **seront ignorés**, avec la raison ;
- le domaine et les dossiers **qui seront créés** ;
- deux actions : valider ou renoncer.

### Étape 4 — Progression puis rapport

**Pendant** : barre de progression, nom du fichier en cours, compteurs de succès et d'échecs qui s'incrémentent en temps réel, possibilité de laisser tourner en arrière-plan.

**Rapport final** :
- nombre de notes créées, mises à jour, ignorées, en échec ;
- pour chaque échec : nom du fichier et **raison en langage clair** ;
- liste des références non résolues ;
- nombre de dossiers et de domaines créés ;
- **liens directs vers les notes créées**.

**Priorité de lecture**
Par étape : 1. Où j'en suis dans le parcours. 2. L'action attendue. 3. Le détail.

**États**
*Aucun fichier déposé* · *Analyse en cours* · *Aperçu* · *Import en cours* · *Terminé sans erreur* · *Terminé avec erreurs* (les erreurs sont l'information principale) · *Échec global*.

**Point d'attention**
Un fichier en erreur n'interrompt jamais le lot. Le rapport doit rendre cette règle évidente : l'utilisateur ne doit pas croire que tout a échoué parce que trois fichiers sur trois cents ont posé problème.

**Petit écran**
Mode dégradé accepté.

**Sorties**
V-11 · V-14 · V-35.

---

## V-25 — Profil

**Rôle**
Consulter et gérer son compte, et voir la reconnaissance de sa contribution.

**Qui et quand**
Tout utilisateur authentifié, occasionnellement.

**Points d'entrée**
Menu utilisateur de la barre supérieure.

**Contenu — quatre onglets**

| Onglet | Contenu |
|---|---|
| **Identité** | Nom affiché, identifiant, adresse électronique, rôle, domaine principal, date d'arrivée, avatar. Champs modifiables clairement distingués des champs en lecture seule (le rôle et le domaine sont attribués par un administrateur) |
| **Sécurité** | Changement de mot de passe : mot de passe actuel, nouveau, confirmation. Longueur minimale annoncée **avant** la saisie, indicateur de robustesse. Date de dernière connexion. Préférences de session |
| **Distinctions** | Six distinctions, chacune avec son intitulé, son critère affiché, son état (obtenue ou non) et une **barre de progression** vers l'obtention. Plus les statistiques de contribution : notes publiées, notes vérifiées, liens créés, citations maximales sur une note |
| **Activité** | Contributions récentes : notes créées, modifiées, vérifiées, avec leurs dates |

**Les six distinctions**

| Intitulé | Critère |
|---|---|
| Premier pas | Première note publiée |
| Veilleur | 10 notes vérifiées |
| Rédacteur | 25 notes publiées |
| Bibliothécaire | 50 notes publiées |
| Tisseur | 100 liens internes créés |
| Référent | Une note citée par 20 autres |

**Priorité de lecture**
1. L'onglet courant. 2. L'identité. 3. Le contenu de l'onglet.

**États**
*Compte à mot de passe verrouillé* : dans l'onglet Sécurité, le formulaire est remplacé par une explication — « Compte de démonstration : mot de passe géré par l'administrateur ». Ce cas doit être maquetté.
*Aucune distinction obtenue* : les six sont affichées avec leur progression, jamais une zone vide.
*Aucune activité* : message d'encouragement plutôt qu'un vide.

**Point d'attention**
Les distinctions sont individuelles et privées. **Aucun classement entre utilisateurs n'est affiché** : c'est de la reconnaissance, pas de l'évaluation.

**Petit écran**
Onglets en liste ou en défilement horizontal.

**Sorties**
V-14 (depuis l'activité) · V-05 (déconnexion).

---

## V-26 — Page non trouvée (connecté)

**Rôle**
Rattraper une adresse erronée pour un utilisateur authentifié.

**Contenu**
Message clair · champ de recherche · liens vers l'accueil et vers le dernier domaine consulté · si l'adresse ressemble à une note supprimée, le signaler explicitement.

**Différence avec V-04**
Ici l'utilisateur a un contexte : la coquille applicative reste présente, la navigation latérale reste utilisable.

**Sorties**
V-07 · V-08.

---

# La console d'administration (V-27 à V-36)

## Motif commun

Les dix vues de la console partagent une structure identique. **Maquetter d'abord ce motif, puis les variations.**

| Zone | Contenu |
|---|---|
| **Navigation secondaire** | Trois groupes d'entrées : **Contenus** (Univers, Domaines, Types de fiches, Types de relations, Templates) · **Utilisateurs** (Comptes) · **Système** (Imports, Exports, Analytique, Configuration). Chaque entrée porte un compteur quand c'est pertinent |
| **En-tête de section** | Titre de la section, description d'une ligne de ce qu'on y gère, action principale de création |
| **Zone de travail** | Selon la section : tableau, liste, ou formulaire |
| **Formulaire de création et d'édition** | En panneau latéral ou boîte de dialogue selon la complexité |

**Règles communes à toutes les sections**

1. **Aucune entrée inerte.** Une entrée visible dans la navigation est une entrée qui fonctionne. Pas de « Bientôt disponible », pas de lien mort.
2. Toute suppression est confirmée, avec le décompte chiffré de ce qui sera affecté.
3. Toute suppression d'un objet **utilisé** est refusée avec une explication chiffrée et une proposition de réaffectation.
4. Les modifications de configuration prennent effet immédiatement et le confirment visiblement.
5. La console est réservée aux administrateurs : elle n'apparaît pas dans la navigation des autres profils.

**Priorité de lecture, commune**
1. Où je suis dans la console. 2. L'action principale de la section. 3. La liste des objets. 4. Les actions unitaires.

**Petit écran**
Mode dégradé accepté. La navigation secondaire devient un sélecteur.

---

## V-27 — Console · Univers

**Rôle** Organiser la segmentation de plus haut niveau.

**Contenu** Liste des univers : nom, description, icône, couleur, ordre d'affichage, nombre de domaines rattachés, nombre de notes.

**Actions** Créer · renommer · décrire · choisir icône et couleur · **réordonner** (l'ordre pilote l'affichage dans la navigation latérale) · supprimer.

**Formulaire** Nom · description · icône · couleur · position.

**États** *Suppression refusée* : un univers contenant des domaines ne peut être supprimé — afficher le nombre de domaines et proposer de les rattacher ailleurs. *Univers par défaut* : l'univers « Non classé » ne peut pas être supprimé, et cette contrainte est expliquée sur place.

---

## V-28 — Console · Domaines

**Rôle** Créer et configurer les espaces de connaissance. La section la plus utilisée de la console.

**Contenu** Tableau des domaines : nom, univers de rattachement, couleur, nombre de notes, nombre de fiches, nombre de signets, nombre de dossiers, nombre de contributeurs, modules activés.

**Actions** Créer · renommer · décrire · colorer · **rattacher à un autre univers** · **activer ou désactiver les modules** · supprimer.

**Formulaire**
Nom · description · couleur · univers de rattachement · **cases d'activation des modules** : Notes, Fiches, Cartographie, Signets, Carte mentale. Chaque module accompagné d'une phrase expliquant ce qu'il apporte au domaine.

**Boîte de dialogue de suppression — à maquetter avec soin**
C'est l'action la plus dangereuse du produit.
- Décompte exact de ce qui sera détruit : « 47 notes, 12 fiches, 8 signets, 6 dossiers ».
- Mention explicite du caractère **définitif** et de l'absence de corbeille.
- Champ de saisie : « Pour confirmer, retapez le nom du domaine : **Infrastructure** ».
- Bouton de confirmation **inactif** tant que la saisie ne correspond pas exactement.
- Mention que les comptes rattachés à ce domaine seront conservés, sans rattachement.

**États** *Domaine vide* : la suppression reste confirmée mais le décompte est à zéro.

---

## V-29 — Console · Types de fiches

**Rôle** Définir les schémas de propriétés structurées.

**Contenu** Liste des types de fiches : nom, icône, nombre de propriétés définies, nombre de notes qui l'utilisent.

**Formulaire — le plus complexe de la console**
Nom · icône · description · puis un **constructeur de propriétés** : chaque propriété porte un nom technique, un libellé affiché, un type de valeur (texte, texte long, nombre, date, booléen, liste de valeurs, lien, adresse électronique), un caractère obligatoire ou non, une valeur par défaut, une aide à la saisie. Les propriétés sont **réordonnables**, car leur ordre pilote l'affichage dans l'éditeur et dans le panneau de lecture.

Pour les propriétés de type « liste de valeurs », un sous-formulaire de saisie des valeurs autorisées.

**États** *Suppression refusée* : type utilisé par N notes — proposer de les délester. *Modification d'un schéma utilisé* : avertir du nombre de notes concernées et de ce qui se passera pour les propriétés retirées.

---

## V-30 — Console · Types de relations

**Rôle** Enrichir le vocabulaire relationnel du graphe.

**Contenu** Liste : libellé direct, **libellé inverse**, description de l'usage attendu, nombre de relations existantes.

**Formulaire** Libellé direct (« héberge ») · libellé inverse (« hébergé par ») · description. Un aperçu doit montrer la phrase produite dans les deux sens : « *Serveur A* **héberge** *Application B* » et « *Application B* **hébergée par** *Serveur A* ». C'est ce qui permet de vérifier qu'on a bien saisi l'inverse.

**États** *Suppression d'un type utilisé* : refusée, avec le nombre de relations concernées et une proposition de réaffectation ou de suppression explicite.

---

## V-31 — Console · Templates

**Rôle** Maintenir les squelettes de rédaction proposés à la création d'une note.

**Contenu** Liste : nom, type de note associé, marquage « par défaut », nombre d'utilisations.

**Actions** Créer · éditer le contenu **dans l'éditeur riche** (V-17 en version réduite) · associer à un type de note · marquer par défaut · dupliquer · supprimer.

**Point d'attention**
Rappeler dans l'interface que modifier ou supprimer un template **n'affecte aucune note déjà créée** à partir de lui. C'est une inquiétude fréquente et la réponse doit être visible sur place.

---

## V-32 — Console · Comptes

**Rôle** Gérer les accès.

**Contenu** Tableau : identifiant, nom affiché, rôle, domaine de rattachement, date de dernière connexion, état (actif ou désactivé), marquage « mot de passe verrouillé ».

**Actions** Créer · modifier le rôle · modifier le rattachement · **réinitialiser le mot de passe** · marquer le mot de passe comme verrouillé · désactiver.

**Formulaire de création** Identifiant · nom affiché · adresse électronique · mot de passe initial · rôle · domaine principal.

**Écran de réinitialisation — à maquetter spécifiquement**
Le mot de passe temporaire généré est affiché **une seule fois**, avec un avertissement clair qu'il ne sera plus jamais consultable, et un bouton de copie.

**États** *Dernier administrateur* : le retrait du rôle d'administrateur est refusé avec une explication. *Compte désactivé* : distingué visuellement dans la liste, ses contributions passées restent attribuées.

---

## V-33 — Console · Configuration

**Rôle** Régler les paramètres globaux qui pilotent le comportement du produit.

**Contenu** Formulaire groupé par thème :

| Groupe | Paramètres |
|---|---|
| **Fraîcheur** | Seuil frais → vieillissant (en jours) · seuil vieillissant → obsolète (en jours) |
| **Historique** | Nombre maximum de versions conservées par note |
| **Espace public** | Adresse du portail d'assistance, cible de l'appel à l'action de repli |
| **Vocabulaire** | Libellé du concept « fiche » tel qu'il apparaîtra dans toute l'interface |
| **Fichiers** | Taille maximale d'un fichier joint |
| **Session** | Durée de session |

**Point d'attention majeur**
Le réglage des seuils de fraîcheur doit être accompagné d'un **aperçu de l'impact** : combien de notes basculeraient de vert à jaune, de jaune à rouge, avec les valeurs saisies. C'est un réglage qui change l'apparence de tout le produit ; l'administrateur doit voir ce qu'il déclenche avant de valider.

**États** *Validation refusée* : seuil vieillissant inférieur ou égal au seuil frais, valeur négative — message explicite au niveau du champ concerné. *Après enregistrement* : confirmation explicite mentionnant que les signaux ont été recalculés.

---

## V-34 — Console · Analytique

**Rôle** Piloter la qualité et l'adoption. La section qui transforme les données d'usage en décisions éditoriales.

**Contenu — quatre blocs**

| Bloc | Contenu | Ce qu'on en fait |
|---|---|---|
| **Trous documentaires** | Requêtes les plus fréquentes ayant produit **zéro résultat** ou **zéro ouverture**, avec leur fréquence et leur évolution | Chaque ligne propose de **créer la note manquante** avec le titre pré-rempli |
| **Notes orphelines** | Notes jamais consultées, ou sans aucun lien entrant, ou jamais vérifiées. Avec date de création, domaine, auteur | Actions : signaler à réviser, réaffecter, supprimer |
| **Santé documentaire** | Par domaine et par univers : répartition de fraîcheur et son évolution · notes jamais vérifiées · notes en attente de révision · brouillons · registres opérationnels désynchronisés · taux de couverture par type de note · contributeurs actifs | Vue de pilotage du référent |
| **Adoption** | Consultations sur 7 jours et tendance · volume de recherches · **taux de recherche aboutie** (l'indicateur nord du produit) · notes les plus consultées · contributeurs les plus actifs | Mesure de l'usage réel |

**Priorité de lecture**
1. Le taux de recherche aboutie. 2. Les trous documentaires — c'est ce qui appelle une action. 3. La santé documentaire. 4. Les orphelines.

**États**
*Données insuffisantes* : produit récemment mis en service, volume de journaux trop faible — le dire explicitement plutôt que d'afficher des graphiques vides ou trompeurs.

**Point d'attention**
Aucune restitution ne doit permettre un classement nominatif de performance individuelle. Les statistiques par contributeur sont des **volumes de contribution**, présentés comme reconnaissance.

---

## V-35 — Console · Imports

**Rôle** Lancer un import depuis la console et consulter l'historique des imports passés.

**Contenu**
Le panneau d'import de V-24, intégré dans la console, **plus** un journal des imports : date, source, auteur, nombre de notes créées, nombre d'erreurs, accès au rapport détaillé de chaque lot.

**Priorité de lecture**
1. L'action d'import. 2. Le journal.

**Sorties** V-24.

---

## V-36 — Console · Exports

**Rôle** Extraire un domaine complet dans un format ouvert et réimportable.

**Contenu**
Sélecteur de domaine · aperçu de ce qui sera exporté (nombre de notes, de dossiers, d'images, volume estimé) · bouton de téléchargement.

**Ce que contient l'archive produite** — à expliquer dans l'interface : un fichier par note, l'arborescence de dossiers reproduite, les métadonnées en en-tête de chaque fichier, les images incluses, un rapport listant ce qui n'a pas pu être converti.

**Point d'attention**
Annoncer explicitement la propriété qui fait la valeur de cet export : **il est réimportable**. Réimporter l'archive reconstitue le domaine à l'identique.

**États** *Export en cours* : indication de progression pour un domaine volumineux. *Terminé avec avertissements* : le rapport est mis en avant, pas enterré.

---

# Éléments transverses (V-37 à V-41)

## V-37 — Coquille applicative

**Rôle**
Le cadre permanent de l'espace de travail. Présent sur toutes les vues sauf l'espace public et l'authentification.

**Structure**

| Zone | Contenu |
|---|---|
| **Navigation latérale** | Identité du produit · lien Accueil · **domaines groupés par univers** avec leur arborescence de dossiers dépliable · liens vers les outils transverses (Cartographie, Carte mentale, Import) · section Gestion réservée aux profils habilités · pied avec la version |
| **Barre supérieure** | Fil d'Ariane · champ de recherche avec rappel du raccourci · menu de création (« + ») · menu utilisateur |
| **Zone de contenu** | La vue courante |

**Comportements de la navigation latérale**

- Les domaines sont groupés sous leur univers, dans l'ordre défini par l'administrateur.
- Un domaine se déplie pour révéler son arborescence de dossiers ; un dossier se déplie pour révéler ses sous-dossiers.
- Cliquer le **nom** d'un domaine navigue vers sa page ; cliquer son **chevron** déplie ou replie.
- L'**état de dépliage est mémorisé entre les sessions**.
- L'élément correspondant à la page courante est mis en évidence, et ses ancêtres sont dépliés automatiquement.
- Seuls les dossiers accessibles à l'utilisateur apparaissent.
- La navigation est escamotable, y compris sur grand écran (mode concentration pour la lecture et la rédaction).

**Menu de création (« + »)**
Nouvelle note · Nouveau dossier · Nouveau signet · Importer.

**Menu utilisateur**
Nom et avatar · Profil · Console d'administration (si administrateur) · Déconnexion.

**Priorité de lecture**
1. La zone de contenu. La coquille est un cadre : elle ne doit pas concurrencer le contenu.

**États**
*Arborescence en cours de chargement* : indication locale sur le domaine déplié.
*Aucun domaine accessible* : message explicite plutôt qu'une navigation vide.
*Navigation escamotée* : le contenu occupe toute la largeur, avec un moyen évident de la rouvrir.

**Petit écran**
Navigation latérale masquée par défaut, ouverte par un bouton, refermée après sélection. La barre supérieure conserve au minimum la recherche et le menu utilisateur.

**À maquetter**
La coquille doit être présentée avec au moins deux contenus différents (lecture, tableau de bord) et dans ses deux états (navigation ouverte, navigation escamotée).

---

## V-38 — Système de notification

**Rôle**
Confirmer une action, signaler une erreur, informer d'un événement, sans bloquer l'utilisateur.

**Types à maquetter**

| Type | Comportement |
|---|---|
| **Succès** | Confirmation brève, disparaît automatiquement après quelques secondes |
| **Erreur** | Message clair et cause probable, **persiste** jusqu'à action de l'utilisateur, propose de réessayer quand c'est pertinent |
| **Information** | Événement neutre (import terminé en arrière-plan, session bientôt expirée), refermable |
| **En cours** | Opération longue lancée en arrière-plan, avec progression et possibilité de la suivre |

**Comportements**
Non bloquantes · empilables (plusieurs simultanées) · refermables individuellement · n'occultent jamais l'action en cours ni un champ de saisie · annoncées aux technologies d'assistance.

**Exemples réels à couvrir dans les maquettes**
« Note enregistrée » · « Note marquée comme vérifiée » · « Impossible d'enregistrer — vérifiez votre connexion » · « Import terminé : 231 notes créées, 3 erreurs » · « Session expirée » · « Lien copié ».

---

## V-39 — États vides, de chargement et d'erreur

**Rôle**
Ces états représentent une part importante du temps d'usage réel. Ils doivent être conçus, pas subis.

**États vides — chacun a un message et une action propres**

| Contexte | Message | Action proposée |
|---|---|---|
| Corpus entièrement vide | « Votre base de connaissances est vide » | Importer · Créer la première note |
| Domaine sans note | « Ce domaine ne contient aucune note » | Créer · Importer dans ce domaine |
| Dossier vide | « Ce dossier est vide » | Créer une note · Créer un sous-dossier |
| Recherche sans résultat | Reprise de la requête entre guillemets | **Créer cette note** |
| Recherche filtrée sans résultat | « Aucune note ne correspond à ces filtres » | Réinitialiser les filtres |
| Aucune révision en attente | Message positif court | — |
| Aucun rétrolien | « Aucune note ne pointe vers celle-ci » | — |
| Aucune relation | « Aucune relation déclarée » | Ajouter une relation |
| Graphe sans relation | Explication de ce qui alimente la cartographie | Voir comment créer des relations |
| Aucun signet | « Aucun signet dans ce domaine » | Ajouter un signet |
| Aucune distinction obtenue | Les six affichées avec leur progression | — |

> Distinguer systématiquement **« il n'y a rien »** de **« vos filtres ne renvoient rien »**. Ce sont deux situations différentes appelant deux actions différentes.

**États de chargement**
Une esquisse de la structure finale, pas un indicateur générique. L'utilisateur doit deviner ce qui arrive. À décliner pour : carte de résultat, ligne de liste, panneau latéral, tableau de bord, graphe, arborescence.

**États d'erreur**

| Portée | Traitement |
|---|---|
| Un panneau | Message local, bouton pour réessayer, le reste de la vue fonctionne |
| Une vue entière | Message pleine zone, cause probable, retour et réessai |
| Perte de connexion | Bandeau persistant, indication de la reprise automatique, protection du travail en cours |
| Fonctionnalité dégradée | Mention discrète (« recherche par sens indisponible, résultats par mots-clés ») — sans alarmer |

Aucun message d'erreur ne contient de code technique, de trace, ni de terme anglais brut.

---

## V-40 — Boîtes de dialogue

**Rôle**
Confirmer, saisir une information courte, ou présenter un formulaire secondaire sans quitter le contexte.

**Comportements communs**
Piègent le focus · se ferment à la touche d'échappement · rendent le focus à leur déclencheur · l'action principale est identifiable · l'action destructive est distinguée de l'action neutre · aucune fermeture accidentelle quand des données ont été saisies.

**Dialogues à maquetter**

| Dialogue | Spécificité |
|---|---|
| **Confirmation simple** | Motif de base réutilisable |
| **Suppression d'une note** | Rappelle le titre, le nombre de rétroliens qui deviendront cassés, le nombre de versions perdues |
| **Suppression d'un dossier** | Décompte des sous-dossiers et notes · **saisie du nom exact exigée** · bouton inactif tant que la saisie ne correspond pas |
| **Suppression d'un domaine** | Décompte complet (notes, fiches, signets, dossiers) · mention du caractère définitif · **saisie du nom exact exigée** |
| **Restauration d'une version** | Explique que l'état courant sera conservé — rien n'est perdu, l'opération est réversible |
| **Signalement à réviser** | Champ de commentaire décrivant la révision attendue |
| **Gestion des droits d'un dossier** | Le plus complexe : liste des droits explicites · **droits hérités affichés en grisé avec leur origine** · ajout d'un utilisateur avec sélecteur de rôle · retrait d'un droit explicite · explication que retirer un droit explicite ne retire pas un droit hérité |
| **Ajout d'une relation** | Sélecteur de type de relation · recherche de la note cible · aperçu de la phrase produite dans les deux sens |
| **Sélecteur de template** | À la création d'une note · aperçu de la structure de chaque template · option « page vierge » toujours visible |
| **Avertissement de doublon** | Non bloquant · propose d'ouvrir la note existante ou de continuer |
| **Sélecteur de dossier** | Arborescent, pour le déplacement d'une note ou d'un dossier |

---

## V-41 — Bibliothèque de composants

**Rôle**
Page de démonstration vivante rassemblant tous les éléments d'interface du produit. Elle sert de référence commune et de test visuel.

**Qui et quand**
Concepteur et développeurs. Consultée à chaque ajout d'écran.

**Contenu**
Chaque élément présenté dans **toutes** ses variantes et **tous** ses états, avec son nom et son usage :

| Famille | Éléments |
|---|---|
| **Signal de fraîcheur** | Les trois niveaux, avec et sans date, dans tous les contextes d'apparition |
| **Boutons** | Toutes les variantes (principale, secondaire, discrète, destructive), toutes les tailles, avec et sans pictogramme, états normal / survol / focus / actif / désactivé / en attente |
| **Champs de saisie** | Texte, zone longue, sélecteur, sélecteur arborescent, case, interrupteur, saisie d'étiquettes — états normal / focus / erreur / désactivé / avec aide |
| **Pastilles et marqueurs** | Domaine, type de note, type de fiche, étiquette, statut brouillon, filtre actif supprimable |
| **Conteneurs** | Carte, panneau, panneau latéral, encart |
| **Navigation** | Fil d'Ariane, onglets, arborescence, pagination |
| **Restitution de données** | Tableau (avec tri), liste-carte, chronologie, indicateur chiffré avec tendance, barre de répartition |
| **Superpositions** | Boîte de dialogue, panneau latéral, palette de recherche, menu contextuel, infobulle |
| **Contenu rédigé** | Le rendu complet de toutes les constructions de l'éditeur (voir V-14) |
| **Retours** | Notifications, états vides, états de chargement, états d'erreur |
| **Identité** | Avatar, pile d'avatars, touche clavier |

**Exigence**
Chaque élément est accompagné de son **nom** et d'une phrase indiquant quand l'employer. C'est ce qui évite la divergence entre les écrans.

---

# Annexe — Récapitulatif des vues

| Réf. | Vue | Vague | Coquille |
|---|---|---|---|
| V-01 | Accueil public | 3 | non |
| V-02 | Recherche publique | 3 | non |
| V-03 | Lecture publique | 3 | non |
| V-04 | Page non trouvée (public) | 3 | non |
| V-05 | Connexion | 3 | non |
| V-06 | Réinitialisation de mot de passe | 3 | non |
| V-07 | Accueil contributeur | **1** | oui |
| V-08 | Recherche | **1** | oui |
| V-09 | Palette de recherche rapide | **1** | superposée |
| V-10 | Page d'un univers | 2 | oui |
| V-11 | Page d'un domaine | 2 | oui |
| V-12 | Liste des notes d'un domaine | 2 | oui |
| V-13 | Page d'un dossier | 2 | oui |
| V-14 | Lecture d'une note | **1** | oui |
| V-15 | Historique des versions | 2 | superposée |
| V-16 | Comparaison de versions | 2 | oui |
| V-17 | Éditeur de note | **1** | oui |
| V-18 | Éditeur du registre Opérationnel | 2 | oui |
| V-19 | Cartographie, vue complète | 2 | oui |
| V-20 | Cartographie, vue par type maître | 2 | oui |
| V-21 | Carte mentale | 3 | oui |
| V-22 | Signets | 3 | oui |
| V-23 | Création / édition d'un signet | 3 | superposée |
| V-24 | Import | 3 | oui |
| V-25 | Profil | 3 | oui |
| V-26 | Page non trouvée (connecté) | 3 | oui |
| V-27 | Console · Univers | 3 | oui |
| V-28 | Console · Domaines | 3 | oui |
| V-29 | Console · Types de fiches | 3 | oui |
| V-30 | Console · Types de relations | 3 | oui |
| V-31 | Console · Templates | 3 | oui |
| V-32 | Console · Comptes | 3 | oui |
| V-33 | Console · Configuration | 3 | oui |
| V-34 | Console · Analytique | 3 | oui |
| V-35 | Console · Imports | 3 | oui |
| V-36 | Console · Exports | 3 | oui |
| V-37 | Coquille applicative | **1** | — |
| V-38 | Système de notification | 3 | transverse |
| V-39 | États vides, chargement, erreur | 3 | transverse |
| V-40 | Boîtes de dialogue | 3 | transverse |
| V-41 | Bibliothèque de composants | **1** | — |

---

# Annexe — Les dix points durs

Les exigences qui, si elles sont manquées, font échouer le produit indépendamment de la qualité graphique.

1. **Le signal de fraîcheur est lisible en vision périphérique** et ne repose jamais sur la couleur seule.
2. **La vérification tient en un clic** et produit un retour immédiat et gratifiant.
3. **La recherche donne des résultats dès le deuxième caractère** et se pilote entièrement au clavier.
4. **Une recherche infructueuse débouche sur une création**, jamais sur une impasse.
5. **Le focus de la cartographie est persistant au clic**, jamais éphémère au survol.
6. **Le sélecteur de registre n'apparaît que si un Opérationnel existe**, et l'éditeur ne laisse jamais planer de doute sur le corps édité.
7. **Une action interdite n'est pas affichée** — jamais grisée, jamais refusée après le clic.
8. **Les suppressions structurantes exigent la saisie du nom exact** et affichent le décompte chiffré.
9. **Chaque zone est maquettée dans ses quatre états** : chargement, vide, erreur, sans droit.
10. **Aucun chiffre illustratif** : toutes les valeurs des maquettes sont plausibles et cohérentes entre elles.

---

*Fin du brief des vues — version 1.0*



