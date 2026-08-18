# Cahier des charges fonctionnel

**Produit** : plateforme de gestion des connaissances documentaires (nom de travail : *Codicillus*)
**Version du document** : 1.0
**Date** : 13 août 2026
**Statut** : socle de référence produit

---

## Avertissement de périmètre

Ce document décrit **ce que le produit doit faire**, jamais **comment il le fait**.

Il énonce **l'intégralité des fonctionnalités et des cas d'usage** attendus, sans engager **aucun** élément technique : ni langage, ni framework, ni base de données, ni moteur de recherche, ni schéma de données, ni interface applicative, ni composant.

Toute décision de réalisation — pile technique, architecture, modèle de stockage, hébergement — est **hors de ce document** et sera arbitrée après validation fonctionnelle et après la phase de maquettage.

Les besoins sont exprimés en intentions d'usage, jamais en solutions : on écrit « éditeur de texte riche », « recherche plein texte tolérante aux fautes », « recherche par similarité de sens », et jamais le nom d'une technologie susceptible de les servir.

---

## Sommaire

1. [Vision et proposition de valeur](#1-vision-et-proposition-de-valeur)
2. [Utilisateurs, rôles et droits](#2-utilisateurs-rôles-et-droits)
3. [Objets métier](#3-objets-métier)
4. [Inventaire des vues](#4-inventaire-des-vues)
5. [M01 — Accueil et tableaux de bord](#m01--accueil-et-tableaux-de-bord)
6. [M02 — Recherche](#m02--recherche)
7. [M03 — Navigation et organisation du contenu](#m03--navigation-et-organisation-du-contenu)
8. [M04 — Lecture d'une note](#m04--lecture-dune-note)
9. [M05 — Rédaction et édition](#m05--rédaction-et-édition)
10. [M06 — Fraîcheur et cycle de vie](#m06--fraîcheur-et-cycle-de-vie)
11. [M07 — Historique et versions](#m07--historique-et-versions)
12. [M08 — Fiches structurées et relations](#m08--fiches-structurées-et-relations)
13. [M09 — Cartographie](#m09--cartographie)
14. [M10 — Carte mentale](#m10--carte-mentale)
15. [M11 — Signets web](#m11--signets-web)
16. [M12 — Import du patrimoine](#m12--import-du-patrimoine)
17. [M13 — Export](#m13--export)
18. [M14 — Administration](#m14--administration)
19. [M15 — Mesure et pilotage documentaire](#m15--mesure-et-pilotage-documentaire)
20. [M16 — Compte utilisateur](#m16--compte-utilisateur)
21. [M17 — Espace public](#m17--espace-public)
22. [M18 — Comportements transverses](#m18--comportements-transverses)
23. [Référentiel des règles de gestion](#référentiel-des-règles-de-gestion)
24. [Parcours utilisateurs de référence](#parcours-utilisateurs-de-référence)
25. [Exigences non fonctionnelles perçues](#exigences-non-fonctionnelles-perçues)
26. [Brief de direction artistique](#brief-de-direction-artistique)
27. [Backlog de maquettage](#backlog-de-maquettage)
28. [Principes de conception non négociables](#principes-de-conception-non-négociables)
29. [Hors périmètre](#hors-périmètre)

---

## 1. Vision et proposition de valeur

### 1.1 Ce qu'est le produit

Un **point d'entrée unique sur la connaissance documentaire d'une direction technique**. Un wiki d'entreprise auto-hébergé qui unifie procédures, guides, architectures, fiches applicatives, contacts et liens web dans une interface web accessible depuis n'importe quel navigateur, y compris depuis le poste d'un intervenant en déplacement.

### 1.2 Les cinq problèmes résolus

| # | Problème | Réponse du produit |
|---|---|---|
| P1 | La recherche dans les arborescences de fichiers est inutilisable en transversal | Recherche instantanée, tolérante aux fautes, sur l'intégralité du corpus |
| P2 | Aucun outil n'indique si un document est encore fiable | Signal de fraîcheur natif, visible partout, avec vérification en un clic |
| P3 | Contribuer coûte trop cher (documents bureautiques lourds) | Rédaction en moins de 5 minutes pour une procédure simple |
| P4 | Les documents sont sur des partages réseau inaccessibles en intervention | Accès navigateur, sans dépendance à un partage de fichiers |
| P5 | La connaissance tacite n'est jamais formalisée | Barrière à l'entrée minimale : templates, import, structuration progressive |

### 1.3 Le différenciateur

**Le signal de fraîcheur.** Aucun outil concurrent n'affiche la fiabilité temporelle d'un document. Ce signal casse le cercle vicieux de non-consultation (« je ne lis pas la doc parce que je ne sais pas si elle est à jour ») pour un coût de maintenance d'une seconde par document.

Deux différenciateurs secondaires viennent le compléter :

- **Le double registre de lecture** : une même note porte une version *Référence* (dense, exhaustive) et une version *Opérationnelle* (pas-à-pas, orientée action). Pas un résumé — un autre registre de lecture du même fond.
- **La cartographie relationnelle** : le corpus documentaire est aussi un graphe de dépendances techniques exploitable (qui héberge quoi, qui dépend de quoi, quels sont les points de défaillance unique).

### 1.4 Indicateur nord

**Taux de recherche aboutie** : pourcentage de recherches qui débouchent sur l'ouverture d'un document. Mesurable dès la mise en service.

---

## 2. Utilisateurs, rôles et droits

### 2.1 Personas

| Persona | Profil | Besoin dominant |
|---|---|---|
| **L'intervenant** | Technicien en intervention, sous pression | Trouver la bonne procédure en moins de 10 secondes et savoir si elle est fiable |
| **Le contributeur** | Membre de la direction technique | Formaliser une connaissance sans que ça lui coûte une demi-journée |
| **Le référent** | Responsable d'un périmètre | Voir l'état de santé de son périmètre, savoir ce qui est obsolète, arbitrer |
| **Le lecteur externe** | Collaborateur métier hors direction technique | Consulter la documentation applicative publique sans compte |
| **L'administrateur** | Responsable de la plateforme | Configurer la structure, les comptes, les référentiels, mesurer l'adoption |

### 2.2 Les trois niveaux d'accès

| Niveau | Authentification | Lecture | Écriture | Administration |
|---|---|---|---|---|
| **Anonyme** | Aucune | Notes marquées *publiques* **et** publiées uniquement | Aucune | Non |
| **Contributeur** | Compte local | Tout le corpus | Selon droits de dossier (voir 2.3) | Non |
| **Administrateur** | Compte local | Tout le corpus | Tout | Oui |

**RG-ACC-01** — L'anonyme ne voit *jamais* un contenu non public : ni en navigation, ni en recherche, ni en suggestion, ni en cartographie, ni via un lien direct. Le filtrage est appliqué au plus près de la donnée, pas seulement dans l'affichage.

**RG-ACC-02** — Après déconnexion, l'utilisateur atterrit sur l'espace public, jamais sur une page d'erreur.

**RG-ACC-03** — À l'expiration de la session, l'utilisateur est renvoyé vers la page de connexion avec le message « Session expirée ». La page qu'il tentait d'atteindre est restaurée après reconnexion.

**RG-ACC-04** — Un accès refusé sur un contenu existant et un accès sur un contenu inexistant produisent la **même** réponse visible, pour ne pas révéler l'existence d'un contenu confidentiel.

### 2.3 Droits sur les dossiers

Au-dessus des trois niveaux d'accès, un système de droits par dossier, **hérité** dans l'arborescence.

| Droit | Lire le dossier et ses notes | Créer / modifier des notes | Créer des sous-dossiers | Renommer / déplacer / supprimer le dossier | Gérer les droits |
|---|---|---|---|---|---|
| **Lecteur** | oui | non | non | non | non |
| **Rédacteur** | oui | oui | non | non | non |
| **Gestionnaire** | oui | oui | oui | oui | oui |

**RG-DRO-01** — Le droit effectif d'un utilisateur sur un dossier est le droit explicite **le plus proche** en remontant l'arborescence. Le plus spécifique gagne.

**RG-DRO-02** — En l'absence de tout droit explicite sur le dossier ou l'un de ses ancêtres, l'utilisateur n'a **aucun** accès (fermeture par défaut).

**RG-DRO-03** — L'administrateur contourne tous les droits de dossier.

**RG-DRO-04** — Les droits de dossier ne s'appliquent qu'aux utilisateurs authentifiés. L'anonyme voit les dossiers qui contiennent au moins une note publique, ainsi que leurs ancêtres, et rien d'autre.

**RG-DRO-05** — Un droit posé sur un dossier racine vaut pour tout le sous-arbre, donc de fait pour l'ensemble d'un domaine.

### 2.4 Comptes particuliers

**RG-CPT-01** — Un compte peut être marqué *mot de passe verrouillé* : il conserve tous ses droits de contenu mais ne peut pas changer son propre mot de passe. Usage : compte de démonstration partagé. La réinitialisation par un administrateur reste possible.

**RG-CPT-02** — L'accès administrateur ne peut pas être auto-attribué. La création du premier compte administrateur est une opération d'exploitation, hors interface.

---

## 3. Objets métier

Le vocabulaire ci-dessous est **contractuel** : il structure l'interface, la documentation et les échanges.

### 3.1 Hiérarchie de rangement

```
Univers  →  Domaine  →  Dossier (jusqu'à 10 niveaux)  →  Note
```

| Objet | Définition | Porte |
|---|---|---|
| **Univers** | Couche de segmentation la plus haute. Regroupe des domaines qui partagent un contexte (ex. une entité, une direction, un périmètre fonctionnel) | Nom, identifiant lisible, ordre d'affichage, couleur, icône |
| **Domaine** | Espace de connaissance autonome (ex. Infrastructure, Support, Études & Développement, Gouvernance) | Nom, identifiant lisible, description, couleur, rattachement à un univers, modules activés |
| **Dossier** | Rangement arborescent au sein d'un domaine | Nom, position parmi ses frères, droits explicites |
| **Note** | L'unité de connaissance. Voir 3.2 | Voir 3.2 |

**RG-STR-01** — Un univers contient 0 à N domaines. Un domaine appartient à exactement un univers. Un univers « Non classé » existe par défaut et ne peut pas être supprimé.

**RG-STR-02** — L'identifiant lisible d'un domaine est unique **au sein de son univers**, pas globalement. Deux univers peuvent donc avoir chacun un domaine « support ».

**RG-STR-03** — Chaque domaine dispose à sa création d'un dossier racine par défaut. Toute note appartient à un dossier.

**RG-STR-04** — La profondeur de l'arborescence de dossiers est plafonnée à 10 niveaux. Toute création ou déplacement qui dépasserait ce plafond est refusé avec un message explicite.

**RG-STR-05** — Un dossier ne peut pas être déplacé dans l'un de ses propres descendants, ni dans un autre domaine.

**RG-STR-06** — Un domaine active 1 à N modules parmi : *Notes*, *Fiches*, *Cartographie*, *Signets*, *Carte mentale*. Un module non activé n'apparaît ni dans la navigation du domaine, ni dans ses tableaux de bord. L'activation est modifiable après création.

### 3.2 La note

L'objet central. Une note est **une seule entité** qui peut porter plusieurs facettes.

| Attribut | Description | Obligatoire |
|---|---|---|
| Titre | — | oui |
| Identifiant lisible | Dérivé du titre, unique, stable, utilisé dans l'adresse | oui (généré) |
| **Corps Référence** | Contenu riche, dense, canonique | oui |
| **Corps Opérationnel** | Second contenu riche, pas-à-pas, orienté action | non |
| Type de note | Classification (procédure, guide, architecture, FAQ…) | oui |
| Domaine | Espace de rattachement | oui |
| Dossier | Rangement dans l'arborescence du domaine | oui |
| Étiquettes | Mots-clés libres, partagés à l'échelle du produit | non |
| Visibilité | *publique* ou *interne* | oui (défaut : interne) |
| Statut | *brouillon* ou *publiée* | oui (défaut : publiée) |
| Auteur | Créateur de la note | oui |
| Dates | Création, dernière modification, dernière modification du corps Référence, dernière mise à jour du corps Opérationnel, dernière vérification | oui |
| Compteur de consultations | — | oui |
| Demande de révision | Drapeau + commentaire + demandeur + date | non |
| **Type de fiche** | Si renseigné, la note est aussi une *fiche structurée* (voir M08) | non |
| **Propriétés typées** | Champs structurés dictés par le type de fiche | non |
| Pièces jointes | Fichiers liés à la note | non |
| Relations sortantes / entrantes | Relations typées vers d'autres notes | non |
| Liens internes / rétroliens | Liens libres dans le corps, et leur réciproque | non |

**RG-NOT-01** — Une note est unique. La fiche structurée n'est pas un objet séparé : c'est une note qui porte un type de fiche et des propriétés typées. Le nœud du graphe **est** la note.

**RG-NOT-02** — Le corps Référence est canonique. Le corps Opérationnel est optionnel et ne peut exister sans Référence.

**RG-NOT-03** — Titre, identifiant, étiquettes, fraîcheur, dossier, relations, rétroliens et pièces jointes sont **partagés** entre les deux registres. Il n'y a qu'une note.

**RG-NOT-04** — Une note en brouillon n'est jamais visible en anonyme. Elle reste visible et cherchable par les utilisateurs authentifiés, avec un marquage visuel explicite.

### 3.3 Objets de référentiel

| Objet | Rôle | Géré par |
|---|---|---|
| **Type de note** | Classification obligatoire d'une note. 10 types fournis + « Autre » | Administrateur |
| **Template** | Squelette de contenu proposé à la création. 10 templates fournis, un par type | Administrateur |
| **Type de fiche** | Schéma de propriétés typées (Application, Serveur, Équipement réseau, Contact…) | Administrateur |
| **Type de relation** | Vocabulaire relationnel, avec son libellé inverse (*héberge* / *hébergé par*) | Administrateur |
| **Étiquette** | Mot-clé libre, créé à la volée, partagé | Tout contributeur |
| **Signet** | Lien web curaté (voir M11) | Tout contributeur |
| **Paramètre** | Valeur de configuration globale (seuils, adresses, quotas, libellés) | Administrateur |

### 3.4 Types de notes fournis

1. Procédure technique
2. Guide utilisateur
3. Architecture système
4. FAQ
5. Diagnostic et résolution d'incident
6. Fiche applicative
7. Procédure d'installation
8. Note de version / changelog
9. Guide de dépannage réseau
10. Documentation d'API ou de service
11. Autre

**RG-REF-01** — Chaque type fourni est accompagné d'un template correspondant. Les templates sont **subsidiaires** : la page vierge est le défaut, un template n'est jamais imposé.

**RG-REF-02** — Modifier ou supprimer un template n'affecte aucune note déjà créée à partir de lui.

**RG-REF-03** — Un type de note ne peut être supprimé s'il est utilisé. Le produit propose alors une réaffectation.

### 3.5 Types de fiches fournis

Application, Serveur, Équipement réseau, Contact. Chacun définit un ensemble de propriétés typées (texte, nombre, date, liste de valeurs, lien, booléen).

### 3.6 Types de relations fournis

*héberge*, *administre*, *utilise*, *connecté à*, *dépend de* — chacun avec son libellé inverse.

---

## 4. Inventaire des vues

Liste exhaustive des écrans à concevoir. Sert de base au backlog de maquettage (§27).

### Espace public (sans compte)

| Réf. | Vue | Contenu principal |
|---|---|---|
| V-01 | Accueil public | Accroche, recherche, guides populaires, appel à l'action support |
| V-02 | Recherche publique | Résultats filtrés sur le corpus public |
| V-03 | Lecture publique d'une note | Contenu, métadonnées de confiance, sans actions d'écriture |
| V-04 | Page non trouvée | — |

### Authentification

| Réf. | Vue | Contenu principal |
|---|---|---|
| V-05 | Connexion | Identifiant, mot de passe, « se souvenir de moi » |
| V-06 | Réinitialisation de mot de passe | Parcours guidé |

### Espace de travail

| Réf. | Vue | Contenu principal |
|---|---|---|
| V-07 | Accueil contributeur | Salutation, indicateurs, recherche, activité, domaines, corbeille de révisions |
| V-08 | Recherche | Résultats, facettes, bascule de mode de recherche |
| V-09 | Palette de recherche rapide | Superposition invoquée au clavier depuis n'importe où |
| V-10 | Page d'un univers | Vue d'ensemble, domaines rattachés, indicateurs consolidés |
| V-11 | Page d'un domaine | Couverture, indicateurs, accès aux modules activés |
| V-12 | Liste des notes d'un domaine | Cartes-lignes, filtres, tri |
| V-13 | Page d'un dossier | Sous-dossiers, notes groupées, actions de gestion |
| V-14 | Lecture d'une note | Contenu, sommaire, métadonnées, panneaux latéraux, actions |
| V-15 | Historique des versions | Panneau latéral, sélection pour comparaison |
| V-16 | Comparaison de deux versions | Vue texte et vue visuelle côte à côte |
| V-17 | Éditeur de note | Rédaction riche, barre d'outils, métadonnées |
| V-18 | Éditeur du registre Opérationnel | Idem, sur le second corps |
| V-19 | Cartographie — vue complète | Graphe, légende, panneau de détail, filtres |
| V-20 | Cartographie — vue par type maître | Anneau de nœuds maîtres, étoile de voisinage |
| V-21 | Carte mentale | Arbre dépliable |
| V-22 | Signets | Liste, filtres |
| V-23 | Création / édition d'un signet | Formulaire |
| V-24 | Import | Choix du scénario, dépôt, aperçu, progression, rapport |
| V-25 | Profil | Identité, sécurité, distinctions, activité |
| V-26 | Page non trouvée (connecté) | — |

### Administration

| Réf. | Vue | Contenu principal |
|---|---|---|
| V-27 | Console — Univers | Liste, création, édition, ordre |
| V-28 | Console — Domaines | Liste, création, édition, rattachement, modules, suppression |
| V-29 | Console — Types de fiches | Liste, schéma de propriétés |
| V-30 | Console — Types de relations | Liste, libellé inverse |
| V-31 | Console — Templates | Liste, édition du contenu |
| V-32 | Console — Comptes | Liste, création, rôle, périmètre, réinitialisation |
| V-33 | Console — Configuration | Seuils, adresses, quotas, libellés |
| V-34 | Console — Analytique | Trous documentaires, notes orphelines, adoption |
| V-35 | Console — Imports | Panneau d'import et journal |
| V-36 | Console — Exports | Choix du périmètre, téléchargement |

### Composants transverses à maquetter

| Réf. | Élément |
|---|---|
| V-37 | Coquille applicative : barre latérale, barre supérieure, arborescence |
| V-38 | Système de notification (succès, erreur, information) |
| V-39 | États vides, états de chargement, états d'erreur |
| V-40 | Boîtes de dialogue de confirmation (dont actions destructives) |
| V-41 | Bibliothèque de composants — page de démonstration vivante |

---

## M01 — Accueil et tableaux de bord

### M01.1 — Accueil contributeur

**UC-M01-01** — À la connexion, l'utilisateur arrive sur un tableau de bord personnalisé qui lui dit, en un écran : où en est le corpus, ce qui a bougé, et ce qui l'attend.

Contenu attendu :

- **Salutation personnalisée** mentionnant son périmètre et un chiffre marquant (volume de notes de son domaine, nombre mis à jour cette semaine).
- **Recherche proéminente**, avec le focus posé automatiquement.
- **Indicateurs clés** : nombre total de notes, consultations sur 7 jours avec tendance par rapport à la semaine précédente, nombre de brouillons, nombre de notes en attente de révision.
- **Activité récente** : flux chronologique des derniers événements du corpus — vérifications, publications, éditions, imports terminés — avec l'auteur, la cible cliquable et l'horodatage relatif.
- **Vos domaines** : chaque domaine avec son volume et la répartition de sa fraîcheur (part de vert / jaune / rouge) sous forme de barre.
- **Corbeille de révisions** : les notes signalées comme devant être révisées, avec le commentaire du demandeur, accessibles en un clic.
- **Raccourcis de création** : nouvelle note, import, nouveau signet.
- **Pied de page** : version du produit, volume total, date de dernière synchronisation.
- **Aide contextuelle première visite** : indication du raccourci clavier de recherche, affichée une seule fois par utilisateur.

**RG-M01-01** — Tous les chiffres affichés sont réels. Aucune valeur illustrative, aucune tendance simulée. Si une donnée est indisponible, l'indicateur affiche un état neutre explicite, jamais une valeur inventée.

**RG-M01-02** — Les indicateurs de pilotage (consultations, santé documentaire) ne sont visibles que par les utilisateurs authentifiés.

**RG-M01-03** — L'activité récente déduplique un même objet publié puis édité dans une fenêtre courte : un seul événement est affiché.

### M01.2 — Tableau de bord d'univers

**UC-M01-02** — Depuis un univers, l'utilisateur consulte une vue consolidée de tous ses domaines.

Contenu : identité de l'univers (nom, couleur, icône), volume total de notes, répartition de fraîcheur consolidée, nombre de contributeurs actifs, liste des domaines rattachés avec leurs propres compteurs, accès direct à la cartographie du périmètre.

### M01.3 — Tableau de bord de domaine

**UC-M01-03** — Depuis un domaine, l'utilisateur consulte l'état de santé de son périmètre.

Contenu :

- Couverture d'en-tête : nom, description, couleur, univers de rattachement, fil d'Ariane.
- Volume de notes, répartition par type, répartition de fraîcheur.
- Notes les plus consultées.
- Contributeurs du domaine.
- Notes jamais vérifiées, notes en attente de révision.
- Accès aux modules activés du domaine : notes, dossiers, fiches, cartographie, signets, carte mentale.

**RG-M01-04** — Les agrégats de domaine et d'univers ne comptent que les notes **publiées** et sont **stables quel que soit le rôle** de l'observateur : deux utilisateurs voient les mêmes chiffres pour le même périmètre.

---

## M02 — Recherche

Le cœur du produit. La promesse : *plus rapide que de demander au collègue d'à côté*.

### M02.1 — Palette de recherche rapide

**UC-M02-01** — Depuis n'importe quelle page, l'utilisateur ouvre une palette de recherche par raccourci clavier et trouve un document sans quitter son contexte.

- Ouverture par raccourci clavier universel, ou par clic sur la barre de recherche.
- Superposition centrée, arrière-plan atténué, focus posé dans le champ.
- Fermeture par touche d'échappement ou clic hors de la palette.
- Un second appui sur le raccourci alors que la palette est ouverte replace le focus dans le champ sans la fermer.

### M02.2 — Recherche au fil de la frappe

**UC-M02-02** — Les résultats apparaissent pendant la saisie, sans validation.

- Premiers résultats dès le deuxième caractère.
- Requêtes temporisées après la dernière frappe pour éviter la surcharge.
- Affinement progressif à mesure que la saisie s'allonge.
- Affichage du nombre de résultats et du temps de réponse.

### M02.3 — Tolérance aux fautes

**UC-M02-03** — L'utilisateur trouve son document malgré des fautes de frappe.

- Une lettre manquante ou remplacée sur un mot : le document est trouvé.
- Deux fautes réparties sur deux mots d'une requête : le document est trouvé.
- Aucun résultat aberrant sur des mots totalement différents.

### M02.4 — Modes de recherche

**UC-M02-04** — L'utilisateur choisit comment il cherche.

| Mode | Comportement |
|---|---|
| **Mots-clés** | Correspondance textuelle, tolérante aux fautes, avec mise en évidence des termes trouvés |
| **Sens** | Correspondance par proximité de signification : trouve les notes qui *parlent du même sujet* même sans partager de vocabulaire |
| **Hybride** (défaut) | Fusion des deux classements en un seul, ordonné par pertinence combinée |

**RG-M02-01** — Si la recherche par sens est indisponible, le produit bascule silencieusement en mode mots-clés. La recherche ne tombe jamais en panne à cause d'une brique optionnelle.

### M02.5 — Résultats

Chaque résultat affiche :

- Titre de la note.
- Extrait de 2 à 3 lignes avec les termes recherchés mis en évidence.
- Badge de fraîcheur et date de dernière révision en clair (« Révisé le … » ou « Jamais révisé »).
- Domaine et univers.
- Type de note.
- Auteur.
- Nombre de consultations.
- Nombre de pièces jointes, le cas échéant.
- Marquage *brouillon* si applicable.
- Marquage *fiche* et type de fiche si applicable.
- Marquage *signet* si le résultat est un lien web.

**RG-M02-02** — Un résultat dont la correspondance a été trouvée dans le corps Opérationnel ouvre la note **directement sur ce registre**.

### M02.6 — Filtres et facettes

**UC-M02-05** — L'utilisateur restreint ses résultats.

Facettes disponibles, **combinables** : univers, domaine, type de note, statut (brouillon / publiée), fraîcheur (vert / jaune / rouge), étiquette, visibilité.

- Chaque facette affiche le nombre de résultats correspondants.
- Les filtres actifs sont affichés sous forme de pastilles supprimables individuellement.
- Un lien « tout effacer » réinitialise l'ensemble.
- Le compteur reflète le filtrage (« 4 résultats sur 37 »).
- L'état de la recherche (requête + filtres + mode) est **partageable par l'adresse** de la page.

### M02.7 — Navigation au clavier

**UC-M02-06** — L'utilisateur navigue dans les résultats sans quitter le clavier.

- Flèches haut / bas pour parcourir les résultats.
- Entrée pour ouvrir le résultat sélectionné.
- Échappement pour fermer.
- Boucle cyclique : après le dernier résultat, retour au premier.
- Depuis le premier résultat, la flèche haut remet le focus dans le champ de saisie.

### M02.8 — Aucun résultat

**UC-M02-07** — Quand rien ne correspond, le produit propose une issue.

- Message explicite reprenant la requête.
- Suggestion de reformulation.
- Bouton **« Créer cette note »** qui ouvre l'éditeur avec le titre pré-rempli et le domaine de l'utilisateur pré-sélectionné.

**RG-M02-03** — Toute recherche est journalisée : requête, horodatage, nombre de résultats, résultat ouvert ou absence d'ouverture. Les recherches sans ouverture constituent le signal de **trou documentaire** exploité en M15.

### M02.9 — Périmètre selon le rôle

**RG-M02-04** — En anonyme, la recherche ne porte que sur les notes publiques et publiées. Aucun autre contenu n'est atteignable, y compris via une adresse construite manuellement.

---

## M03 — Navigation et organisation du contenu

### M03.1 — Coquille applicative

**UC-M03-01** — L'utilisateur navigue dans la structure du corpus depuis une barre latérale permanente.

- Domaines groupés par univers, dans l'ordre défini par l'administrateur.
- Chaque domaine se déplie pour révéler son arborescence de dossiers.
- Un dossier se déplie pour révéler ses sous-dossiers.
- L'état de dépliage est **mémorisé entre les sessions**.
- Section « Gestion » réservée aux profils habilités.
- Barre supérieure : fil d'Ariane, recherche, menu de création, menu utilisateur.

**RG-M03-01** — La barre latérale n'affiche que les dossiers accessibles à l'utilisateur courant. Un dossier interdit n'apparaît pas.

### M03.2 — Adressage

**RG-M03-02** — L'adresse canonique d'un domaine inclut son univers. Une adresse ancienne ou raccourcie est **redirigée** vers l'adresse canonique. En cas d'ambiguïté (même identifiant de domaine dans deux univers), le produit demande à l'utilisateur de choisir plutôt que de deviner.

**RG-M03-03** — L'adresse d'une note reste stable dans le temps, même si la note change de dossier ou de domaine.

### M03.3 — Fil d'Ariane

**UC-M03-02** — L'utilisateur se repère et remonte dans la hiérarchie.

Le fil d'Ariane reflète le chemin complet : Accueil › Univers › Domaine › Dossier › … › Note. Chaque segment est cliquable. Un chemin trop long est tronqué en son milieu avec un moyen de le développer.

### M03.4 — Liste des notes d'un domaine

**UC-M03-03** — L'utilisateur parcourt tout le contenu d'un domaine.

- Présentation en cartes-lignes : titre, extrait, type, étiquettes, fraîcheur, auteur, date, consultations.
- Filtres : type, étiquette, fraîcheur, statut, dossier.
- Tri : pertinence, date de modification, date de vérification, consultations, alphabétique.
- Bascule de densité d'affichage (compact / confortable).

### M03.5 — Gestion des dossiers

**UC-M03-04** — Un gestionnaire organise l'arborescence de son périmètre.

Actions disponibles depuis la page d'un dossier, selon le droit effectif :

| Action | Droit requis |
|---|---|
| Créer une note dans le dossier | Rédacteur |
| Créer un sous-dossier | Gestionnaire |
| Renommer le dossier | Gestionnaire |
| Déplacer le dossier | Gestionnaire (sur l'origine **et** la destination) |
| Supprimer le dossier et son contenu | Gestionnaire |
| Gérer les droits du dossier | Gestionnaire |

**UC-M03-05** — Avant de supprimer un dossier, l'utilisateur voit exactement ce qu'il détruit.

**RG-M03-04** — La suppression d'un dossier affiche le décompte des sous-dossiers et des notes qui seront détruits, et exige la **saisie du nom exact du dossier** pour être confirmée. L'opération est atomique : soit tout est supprimé, soit rien ne l'est.

**UC-M03-06** — Un gestionnaire attribue des droits nominatifs sur un dossier.

L'écran de gestion des droits liste les droits explicites posés sur ce dossier, affiche en grisé les droits **hérités** des dossiers parents avec leur origine, et permet d'ajouter, modifier ou retirer un droit explicite. Retirer un droit explicite ne retire pas un droit hérité.

### M03.6 — Page d'un dossier

Contenu : fil d'Ariane complet, sous-dossiers présentés en tuiles, notes du dossier **groupées par type**, droit effectif de l'utilisateur affiché, barre d'actions contextuelle.

---

## M04 — Lecture d'une note

Le moment de vérité : l'intervenant lit la procédure.

### M04.1 — Structure de la vue

Disposition en trois colonnes sur grand écran, dégradée en une colonne sur petit écran :

| Colonne | Contenu |
|---|---|
| Gauche | Sommaire auto-généré, navigable |
| Centre | En-tête, sélecteur de registre, contenu |
| Droite | Métadonnées, actions, panneaux relationnels |

### M04.2 — En-tête et métadonnées de confiance

**UC-M04-01** — L'utilisateur sait immédiatement s'il peut faire confiance à ce qu'il lit.

L'en-tête affiche : titre, badge de fraîcheur avec libellé en clair (« Vérifié il y a 12 jours »), date de dernière vérification, identité du dernier vérificateur, auteur, date de dernière modification, type, domaine, univers, étiquettes cliquables, compteur de consultations, statut (si brouillon), visibilité.

**RG-M04-01** — Le badge de fraîcheur est le premier élément visuellement saillant après le titre.

### M04.3 — Bandeaux d'alerte

**RG-M04-02** — Si une révision est demandée, un bandeau d'avertissement en haut de la note affiche : « Révision demandée par *nom* le *date* », le commentaire du demandeur, et une action pour lever la demande (réservée aux profils habilités).

**RG-M04-03** — Si la note est en brouillon, un bandeau le signale explicitement.

**RG-M04-04** — Si le registre Opérationnel est désynchronisé, un bandeau le signale sur ce registre (voir M06.4).

### M04.4 — Sélecteur de registre

**UC-M04-02** — L'utilisateur bascule entre la version Référence et la version Opérationnelle de la même note.

- Le sélecteur n'apparaît **que si** un corps Opérationnel existe.
- Le registre par défaut à l'ouverture est **Référence**.
- Le registre affiché est reflété dans l'adresse de la page : le lien est partageable tel quel.
- Le sommaire est recalculé selon le registre affiché.
- Si aucun Opérationnel n'existe, une invitation discrète « Ajouter une version opérationnelle » est proposée aux profils habilités.

### M04.5 — Sommaire

**UC-M04-03** — L'utilisateur navigue dans un document long.

- Généré automatiquement à partir des titres du contenu affiché.
- Titres imbriqués selon leur niveau.
- Section courante mise en évidence pendant le défilement.
- Clic sur une entrée : défilement animé vers la section.
- Absent si le document ne contient aucun titre.

### M04.6 — Rendu du contenu

Le contenu restitue fidèlement toutes les constructions de l'éditeur :

| Construction | Comportement en lecture |
|---|---|
| Titres (6 niveaux) | Hiérarchie visuelle nette, alimente le sommaire |
| Paragraphes, gras, italique, souligné, barré, surligné | Rendu typographique |
| Code en ligne | Police à chasse fixe, fond distinct |
| **Bloc de code** | Coloration syntaxique, langage affiché, **bouton de copie en un clic** |
| Listes à puces, numérotées, imbriquées | — |
| Listes de tâches | Cases à cocher, en lecture seule |
| Citations | Rendu distinct |
| **Blocs d'alerte** | 3 niveaux visuellement distincts : astuce, attention, danger |
| Tableaux | En-têtes, défilement horizontal si trop large |
| Images | Affichage en ligne, agrandissement au clic |
| Séparateurs | — |
| **Diagrammes** | Rendu graphique d'un diagramme décrit en texte |
| **Liens internes** | Navigation directe vers la note cible |
| **Liens cassés** | Signalés visuellement (cible inexistante) |
| Liens externes | Ouverture dans un nouvel onglet, indication visuelle |

**RG-M04-05** — La copie d'un bloc de code produit un texte **brut, sans caractère parasite** : pas de numéro de ligne, pas de retour chariot Windows, exactement ce que l'utilisateur collera dans son terminal.

**RG-M04-06** — La largeur de la colonne de lecture est optimisée pour le confort de lecture, pas maximisée.

### M04.7 — Panneaux latéraux

| Panneau | Contenu | Condition |
|---|---|---|
| **Actions** | Modifier, Marquer comme vérifié, Signaler à réviser, Historique, Supprimer, Exporter | Selon droits |
| **Pièces jointes** | Liste des fichiers, taille, type, téléchargement | Si présentes |
| **Rétroliens** | Notes qui pointent vers celle-ci | Si présents |
| **Relations** | Relations typées entrantes et sortantes, groupées par type, avec gestion | Si module Fiches actif |
| **Notes connexes** | Notes sémantiquement proches, avec score de proximité | Si recherche par sens disponible |
| **Historique de vérification** | Chronologie des vérifications : qui, quand | Si présent |
| **Propriétés de fiche** | Champs typés de la fiche | Si la note est une fiche |
| **Position** | Domaine, dossier, navigation vers les notes voisines | Toujours |

**RG-M04-07** — Chaque panneau gère ses trois états : chargement, vide (message explicite), erreur (message + possibilité de réessayer). Un panneau en erreur ne casse jamais la page.

### M04.8 — Pièces jointes

**UC-M04-04** — L'utilisateur télécharge un fichier attaché à une note.

**RG-M04-08** — L'accès à une pièce jointe respecte strictement la visibilité de la note qui la porte. Une pièce jointe d'une note interne n'est pas téléchargeable en anonyme, même avec son adresse directe.

### M04.9 — Consultation

**RG-M04-09** — Toute ouverture d'une note incrémente son compteur de consultations et produit une entrée de journal (identité de l'utilisateur, horodatage, durée approximative). En anonyme, l'entrée est **anonymisée**.

### M04.10 — Actions destructives

**UC-M04-05** — Un utilisateur habilité supprime une note.

**RG-M04-10** — La suppression est confirmée par une boîte de dialogue rappelant le titre, le nombre de rétroliens qui deviendront cassés, et le nombre de versions perdues.

---

## M05 — Rédaction et édition

Objectif : **moins de 5 minutes** pour formaliser une procédure simple.

### M05.1 — Création

**UC-M05-01** — L'utilisateur crée une note vierge.

Points d'entrée : menu de création de la barre supérieure, bouton d'un domaine ou d'un dossier, bouton « créer cette note » depuis une recherche infructueuse, invitation depuis un lien interne cassé.

**UC-M05-02** — L'utilisateur crée une note à partir d'un template.

- Un sélecteur propose les templates disponibles, avec un aperçu de leur structure.
- Le choix d'un template pré-remplit le contenu et pré-sélectionne le type de note correspondant.
- L'utilisateur peut toujours refuser et partir d'une page vierge.

### M05.2 — Métadonnées à la rédaction

| Champ | Comportement |
|---|---|
| Titre | Saisie libre, obligatoire ; génère l'identifiant lisible |
| Type de note | Liste, obligatoire, pré-sélectionné par le template |
| Domaine | Liste, obligatoire, pré-sélectionné sur le domaine de l'utilisateur |
| Dossier | Sélecteur arborescent du domaine choisi, obligatoire |
| Étiquettes | Saisie avec auto-complétion sur les étiquettes existantes, création à la volée |
| Visibilité | Interne (défaut) / Publique |
| Statut | Publiée (défaut) / Brouillon |
| Type de fiche | Optionnel ; s'il est choisi, un formulaire de propriétés typées apparaît |

**RG-M05-01** — Changer le domaine réinitialise le sélecteur de dossier, avec un avertissement si un dossier était déjà choisi.

### M05.3 — Édition riche

**UC-M05-03** — L'utilisateur met en forme son contenu à la souris.

Barre d'outils : gras, italique, souligné, barré, surligné, code en ligne, titres (3 niveaux au moins), liste à puces, liste numérotée, liste de tâches, citation, bloc de code, tableau, image, lien, bloc d'alerte, séparateur, annuler / rétablir, et un menu étendu pour le reste.

**UC-M05-04** — L'utilisateur rédige en syntaxe Markdown, converti à la volée.

Conversions attendues pendant la frappe : niveaux de titre, listes à puces et numérotées, gras, italique, code en ligne, bloc de code avec langage, citation, séparateur, liste de tâches.

**UC-M05-05** — L'utilisateur insère un bloc via un menu de commandes.

- La saisie d'un caractère déclencheur sur une ligne vide ouvre un menu contextuel.
- Le menu est filtrable par la saisie qui suit.
- Navigation au clavier, validation par Entrée, fermeture par Échappement.
- Entrées : bloc de code, image, tableau, alerte (3 types), lien interne, liste de tâches, citation, séparateur, diagramme.

### M05.4 — Constructions de contenu

**Blocs de code** — Sélecteur de langage modifiable après insertion. Coloration syntaxique. Langages couverts au minimum : shell, PowerShell, SQL, Python, JSON, XML, YAML, JavaScript. Bouton de copie.

**Images** — Insertion par bouton, par glisser-déposer, ou par collage depuis le presse-papiers. Formats bitmap courants. Taille unitaire plafonnée, valeur configurable. Texte alternatif saisissable. Stockage attaché à la note.

**Tableaux** — Insertion avec choix des dimensions. Navigation entre cellules à la tabulation. Ajout et suppression de lignes et de colonnes via un menu contextuel. Ligne d'en-tête activable.

**Blocs d'alerte** — Trois niveaux visuellement distincts : *astuce*, *attention*, *danger*. Contenu riche autorisé à l'intérieur.

**Diagrammes** — Un bloc dédié permet de décrire un diagramme en texte et d'en obtenir le rendu graphique.

### M05.5 — Liens internes

**UC-M05-06** — L'utilisateur lie sa note à une autre note du corpus.

- Déclenchement par une séquence de caractères dédiée, ou par le bouton de lien.
- Auto-complétion sur les titres des notes existantes, avec le domaine en indication.
- Le lien créé pointe vers la note cible et reste valide si elle est renommée.
- Un lien vers une note inexistante est **conservé** et signalé visuellement en lecture, avec la possibilité de créer la note manquante.

**RG-M05-02** — Les rétroliens sont **déduits automatiquement** des liens internes. Aucune saisie manuelle. Ils sont mis à jour à chaque enregistrement.

### M05.6 — Suggestions assistées

**UC-M05-07** — Pendant la rédaction, le produit signale à l'utilisateur qu'une note très proche existe déjà.

**RG-M05-03** — À la saisie du titre puis pendant la rédaction, si une note sémantiquement très proche existe, un avertissement non bloquant propose de l'ouvrir plutôt que de créer un doublon. L'utilisateur peut toujours ignorer.

**UC-M05-08** — Le produit propose des liens internes pertinents à partir du contenu rédigé.

**RG-M05-04** — Ces suggestions sont proposées, jamais appliquées automatiquement. L'utilisateur accepte au cas par cas.

### M05.7 — Enregistrement

**UC-M05-09** — L'utilisateur enregistre son travail.

- Raccourci clavier universel d'enregistrement, et bouton explicite.
- **Sauvegarde automatique** périodique du travail en cours, avec indicateur d'état (« Modifications non enregistrées », « Enregistré à hh:mm »).
- Confirmation visuelle brève après enregistrement.
- Avertissement si l'utilisateur quitte la page avec des modifications non enregistrées.

**RG-M05-05** — Publication immédiate : une note publiée est visible et trouvable dès son enregistrement, sans workflow de validation. Le statut *brouillon* est le seul mécanisme de rétention, et il est optionnel.

**RG-M05-06** — Une note enregistrée est trouvable en recherche dans un délai maximal de 10 secondes.

**RG-M05-07** — Une note nouvellement créée ou enregistrée reçoit un signal de fraîcheur vert.

### M05.8 — Prévisualisation

**UC-M05-10** — Avant de publier, l'utilisateur voit le rendu final de sa note.

Bascule entre édition et prévisualisation, sans quitter la page ni perdre le contenu.

### M05.9 — Édition du registre Opérationnel

**UC-M05-11** — L'utilisateur rédige la version opérationnelle d'une note existante.

- Même éditeur, mêmes constructions, mêmes droits que l'édition du corps Référence.
- Un sélecteur de registre indique clairement quel corps est en cours d'édition.
- Enregistrer l'Opérationnel lève automatiquement le signal de désynchronisation.
- Actions dédiées : « Marquer comme resynchronisé » (sans rééditer), « Supprimer la version opérationnelle ».

### M05.10 — Modification et suppression

**UC-M05-12** — L'utilisateur modifie une note existante.

**RG-M05-08** — Les actions d'écriture (Modifier, Vérifier, Signaler, Supprimer) ne sont **affichées** que si l'utilisateur y a droit. Un utilisateur ne rencontre pas de refus après avoir cliqué.

**RG-M05-09** — Déplacer une note vers un autre dossier exige le droit de rédaction sur le dossier d'origine **et** sur le dossier de destination.

---

## M06 — Fraîcheur et cycle de vie

### M06.1 — Le signal de fraîcheur

**UC-M06-01** — En un coup d'œil, l'utilisateur sait si un document est fiable.

| Signal | Seuil par défaut | Libellé | Signification |
|---|---|---|---|
| **Vert** | moins de 90 jours | « Vérifié il y a X jours » | Document frais, fiable |
| **Jaune** | 90 à 180 jours | « Vérifié il y a X mois » | Document vieillissant, revue bienvenue |
| **Rouge** | plus de 180 jours | « Pas revu depuis X mois — Revue nécessaire » | Obsolescence probable |

**RG-M06-01** — Le calcul est **purement temporel**. Il repose sur la date de dernière vérification explicite ; à défaut, sur la date de dernière modification ; à défaut, sur la date de création. Aucune autre logique n'entre en jeu.

**RG-M06-02** — Les seuils sont configurables globalement par l'administrateur. Le seuil jaune doit être strictement supérieur au seuil vert. Les badges sont recalculés immédiatement après modification des seuils.

**RG-M06-03** — Un **seul** mode de calcul de fraîcheur existe dans tout le produit. Le badge d'une note, les agrégats de domaine, les agrégats d'univers et les indicateurs d'accueil utilisent rigoureusement la même définition.

**RG-M06-04** — Le signal de fraîcheur est affiché **partout** où une note apparaît : résultats de recherche, accueil, listes de domaine, page de dossier, en-tête de lecture, cartographie, espace public, résultats d'export.

### M06.2 — Vérification en un clic

**UC-M06-02** — Un utilisateur habilité atteste qu'une note est toujours d'actualité.

- Un bouton unique, sans formulaire, sans champ obligatoire.
- Le badge repasse au vert immédiatement.
- La date et l'identité du vérificateur sont enregistrées.
- L'historique complet des vérifications est conservé et consultable.
- L'action lève automatiquement toute demande de révision en cours.

**RG-M06-05** — La vérification est une action **distincte** de la modification. Vérifier ne crée pas de version, ne modifie pas le contenu, et ne déclenche pas de signal de désynchronisation du registre Opérationnel.

### M06.3 — Demande de révision

**UC-M06-03** — Un utilisateur signale qu'une note doit être révisée, en expliquant pourquoi.

- Bouton « Signaler à réviser » depuis la lecture de la note.
- Ouverture d'un champ de commentaire décrivant la révision attendue.
- La note apparaît dès lors dans la corbeille de révisions de l'accueil, avec son commentaire.
- Un bandeau d'avertissement s'affiche sur la note, indiquant le demandeur, la date et le commentaire.
- Une action permet de lever la demande.

**RG-M06-06** — Une note ne porte qu'**une seule** demande de révision courante. Une nouvelle demande remplace la précédente. Il n'y a pas d'historique de demandes ni de fil de discussion.

**RG-M06-07** — Vérifier une note efface sa demande de révision et son commentaire.

### M06.4 — Synchronisation des deux registres

**UC-M06-04** — L'utilisateur sait que la version opérationnelle a pris du retard sur la référence.

**RG-M06-08** — Le registre Opérationnel est signalé « à resynchroniser » si et seulement si le **corps Référence** a été modifié après la dernière mise à jour du corps Opérationnel.

**RG-M06-09** — Modifier une métadonnée (titre, étiquettes, visibilité, statut, dossier) ou vérifier la note ne déclenche **pas** ce signal. Seule une modification effective du corps Référence le déclenche.

**RG-M06-10** — Deux actions lèvent le signal : enregistrer une nouvelle version du corps Opérationnel, ou « Marquer comme resynchronisé » (pour le cas « j'ai relu, ça tient toujours »).

### M06.5 — Statut de publication

**UC-M06-05** — L'utilisateur retient une note en brouillon le temps de la finir.

**RG-M06-11** — Une note en brouillon : n'est jamais visible en anonyme ; reste visible, cherchable et éditable par les utilisateurs authentifiés ; est **visuellement marquée** partout où elle apparaît ; est comptée dans l'indicateur « brouillons » de l'accueil ; n'entre pas dans les agrégats de santé documentaire.

---

## M07 — Historique et versions

### M07.1 — Capture automatique

**UC-M07-01** — Chaque enregistrement significatif laisse une trace récupérable.

**RG-M07-01** — Une version est capturée automatiquement à chaque enregistrement qui modifie le corps Référence **ou** le corps Opérationnel. Un enregistrement sans changement de contenu ne crée pas de version.

**RG-M07-02** — Une version capture : le titre, les deux corps, l'auteur de la modification et la date. Elle est **immuable**.

**RG-M07-03** — Le nombre de versions conservées par note est plafonné, valeur configurable (défaut : 50). Au-delà, les plus anciennes sont purgées.

**RG-M07-04** — La suppression d'une note supprime tout son historique.

### M07.2 — Consultation de l'historique

**UC-M07-02** — L'utilisateur parcourt les versions successives d'une note.

- Panneau latéral listant les versions de la plus récente à la plus ancienne.
- Chaque entrée : numéro de version, date relative et absolue, auteur.
- Clic sur une version : affichage en lecture seule dans la zone de contenu, avec un bandeau identifiant la version affichée et un bouton « Restaurer ».
- Cases à cocher pour sélectionner deux versions à comparer.

### M07.3 — Comparaison

**UC-M07-03** — L'utilisateur compare deux versions pour comprendre ce qui a changé.

Deux modes, commutables :

| Mode | Rendu |
|---|---|
| **Texte** | Différences ligne à ligne, ajouts et suppressions colorés, façon journal de modifications |
| **Visuel** | Deux colonnes côte à côte, contenu rendu tel qu'il s'affiche, blocs supprimés surlignés à gauche, blocs ajoutés surlignés à droite, blocs identiques alignés horizontalement |

- La comparaison est accessible par une adresse partageable.
- L'ordre des versions est normalisé (la plus ancienne à gauche).
- Comparer une version avec elle-même est refusé avec un message explicite.

### M07.4 — Restauration

**UC-M07-04** — L'utilisateur revient à une version antérieure.

**RG-M07-05** — Restaurer une version **ne détruit rien** : l'état courant est d'abord capturé comme nouvelle version, puis le contenu ancien devient l'état courant. L'historique reste complet et l'opération est elle-même réversible.

**RG-M07-06** — Restaurer une version restaure les **deux** corps. Si la version restaurée est antérieure à l'existence du registre Opérationnel, le corps Opérationnel courant est laissé inchangé plutôt qu'effacé.

---

## M08 — Fiches structurées et relations

### M08.1 — Principe

**RG-M08-01** — Une **fiche** n'est pas un objet distinct : c'est une note à laquelle un *type de fiche* a été attribué. Elle conserve son corps rédigé, ses étiquettes, sa fraîcheur, sa place dans l'arborescence, et gagne des propriétés typées et des relations.

Cette unification est structurante : **le nœud du graphe est la note**. Il n'existe pas de registre applicatif séparé du wiki.

### M08.2 — Propriétés typées

**UC-M08-01** — L'utilisateur renseigne les caractéristiques structurées d'une application, d'un serveur, d'un équipement ou d'un contact.

- Le type de fiche définit un schéma de propriétés : nom, libellé, type de valeur (texte, texte long, nombre, date, booléen, liste de valeurs, lien, adresse électronique), caractère obligatoire, valeur par défaut, aide à la saisie.
- L'éditeur présente un formulaire dérivé de ce schéma.
- La lecture présente ces propriétés dans un panneau structuré et lisible.
- Les propriétés sont exploitables en recherche et en filtrage.

**Exemple — type « Application »** : éditeur, version, environnement, adresse d'accès, responsable, statut de cycle de vie, mécanisme d'habilitation, contact support.

**RG-M08-02** — Changer le type de fiche d'une note conserve les propriétés dont le nom existe dans le nouveau schéma et signale explicitement celles qui seront perdues.

### M08.3 — Relations typées

**UC-M08-02** — L'utilisateur déclare qu'une application est hébergée sur un serveur.

- Depuis la lecture d'une note, un panneau de gestion des relations permet d'ajouter une relation : choix du type de relation, recherche de la note cible, validation.
- Les relations sont **dirigées** mais **navigables dans les deux sens** : le serveur affiche « héberge → Application X », l'application affiche « hébergé par → Serveur Y ».
- Les relations sont groupées par type dans l'affichage.
- Chaque relation est supprimable.
- Une relation porte un indicateur d'origine : *déclarée* (saisie humaine), *déduite* (inférée par le produit), *ambiguë* (à confirmer).

**RG-M08-03** — Une même relation (même source, même cible, même type) ne peut exister qu'une fois.

**RG-M08-04** — Créer ou supprimer une relation exige le droit d'écriture sur le domaine de la source **et** sur celui de la cible.

**RG-M08-05** — Supprimer une note supprime toutes ses relations, dans les deux sens.

### M08.4 — Vocabulaire relationnel

**RG-M08-06** — Chaque type de relation définit un libellé direct et un libellé inverse. L'interface affiche toujours le libellé adapté au sens de lecture.

**RG-M08-07** — Un type de relation utilisé ne peut être supprimé sans réaffectation ou suppression explicite des relations concernées.

### M08.5 — Distinction avec les liens libres

| Mécanisme | Nature | Création | Usage |
|---|---|---|---|
| **Lien interne** | Libre, non typé, dans le corps du texte | Rédaction | Navigation contextuelle, rétroliens |
| **Relation typée** | Structurée, dirigée, qualifiée | Panneau dédié | Cartographie, analyse de dépendances |

Les deux coexistent et sont complémentaires.

---

## M09 — Cartographie

Le produit absorbe ce qui se maintient d'ordinaire dans des tableurs séparés et jamais synchronisés : cartographie applicative, cartographie serveurs, architecture réseau, matrice d'hébergement. Une seule source, tenue à jour par ceux qui déclarent les relations sur leurs notes.

### M09.1 — Le graphe

**Nœuds** : les notes (typées comme fiches ou non).
**Arêtes** : les relations typées entre notes.

**RG-M09-01** — La cartographie n'a **aucune donnée propre**. Elle est intégralement dérivée des notes et de leurs relations. Modifier une relation modifie le graphe instantanément.

### M09.2 — Périmètre

**UC-M09-01** — L'utilisateur cartographie un domaine, un univers, ou l'ensemble du corpus.

**RG-M09-02** — La vue globale (tous domaines) est réservée aux profils habilités. Un anonyme ne peut cartographier qu'un périmètre public.

**RG-M09-03** — Les nœuds hors du périmètre affiché mais reliés à un nœud du périmètre sont affichés en **fantôme** : atténués, mais sélectionnables et navigables.

### M09.3 — Vue complète

**UC-M09-02** — L'utilisateur explore visuellement l'ensemble des dépendances d'un périmètre.

Comportements attendus :

- **Encodage par type** : chaque type de fiche a une couleur et une icône propres, assignées de façon déterministe. La lisibilité de la structure ne dépend pas du domaine.
- **Disposition stable** : les nœuds ne se chevauchent pas et ne dansent pas. La disposition se stabilise puis reste stable.
- **Focus persistant au clic** : cliquer un nœud le met en avant avec ses voisins directs ; tout le reste s'estompe et **reste estompé** jusqu'au prochain clic ou effacement explicite. Pas de mise en évidence éphémère au survol.
- **Légende cliquable** : liste des types présents avec leur compteur ; cliquer un type isole ses nœuds.
- **Zoom, panoramique, déplacement d'un nœud, recentrage automatique, effacement de la sélection.**
- **Recherche dans le graphe** : sauter directement à un nœud par son nom.
- **Point d'entrée par les nœuds les plus connectés** quand le périmètre est trop vaste pour être affiché intégralement.
- **Panneau de détail** au clic : nom, type, domaine, propriétés principales, relations listées par type, lien vers la note complète.

**RG-M09-04** — Sous un seuil de volume configurable, le périmètre est chargé intégralement. Au-delà, l'exploration est progressive.

### M09.4 — Vue par type maître

**UC-M09-03** — L'utilisateur explore le graphe en partant d'une famille d'objets, sans être noyé.

- L'utilisateur choisit un **type maître** (ex. « Application »). Un sélecteur liste les types présents dans le périmètre avec leur compteur.
- **État initial** : tous les nœuds de ce type sont affichés en disposition aérée et déterministe (anneau), **sans leurs voisins ni leurs arêtes**.
- **Clic sur un nœud maître** : il est recentré et ses voisins directs apparaissent en étoile autour de lui, avec les seules arêtes qui le touchent.
- **Clic sur un autre nœud maître** : le voisinage précédent se replie, le nouveau se déplie. Un seul voisinage à la fois.
- **Clic sur un voisin non maître** : sélection simple, ouverture du panneau de détail, aucun dépliage supplémentaire.
- Profondeur strictement limitée à un saut.
- Transitions douces entre les états.

**États limites** : type sans aucun nœud → message explicite ; nœud maître sans relation → affiché seul avec la mention « Aucune connexion ».

**RG-M09-05** — Le mode d'affichage, le type maître et le périmètre sont reflétés dans l'adresse de la page : la vue est partageable telle quelle.

### M09.5 — Analyse de criticité

**UC-M09-04** — Le référent identifie les points de défaillance unique de son infrastructure.

Indicateurs calculés et exposés :

| Indicateur | Signification métier |
|---|---|
| **Nombre de connexions** | Combien d'objets dépendent de celui-ci, ou dont il dépend |
| **Centralité de passage** | À quel point cet objet est un point de passage obligé entre deux parties du système |
| **Point d'articulation** | Sa disparition couperait le système en morceaux isolés — **point de défaillance unique** |

Restitution :

- Taille du nœud proportionnelle à son nombre de connexions.
- Halo distinctif sur les points d'articulation.
- Bascule d'affichage pour activer ou masquer la mise en évidence de la criticité.
- Détail chiffré dans le panneau de détail du nœud.
- Liste ordonnée des objets les plus critiques du périmètre.

### M09.6 — Analyses complémentaires

| Analyse | Apport |
|---|---|
| **Communautés** | Regroupements naturels d'objets fortement interconnectés, révélant les sous-systèmes de fait |
| **Connexions surprenantes** | Relations statistiquement inattendues entre objets — signal de dépendance non documentée ou d'erreur de saisie |
| **Familles sémantiques** | Regroupement des notes par proximité de sens, indépendamment des relations déclarées. Révèle les notes qui parlent du même sujet sans être liées |

**RG-M09-06** — Les familles sémantiques sont recalculées périodiquement, pas à chaque consultation. Leur date de calcul est affichée.

**RG-M09-07** — Une légende explique la sémantique de chaque encodage visuel (couleur, taille, halo, forme). Aucun encodage n'est laissé à l'interprétation.

---

## M10 — Carte mentale

**UC-M10-01** — L'utilisateur visualise l'arborescence de son corpus sous forme de carte mentale dépliable.

- Représentation arborescente radiale ou horizontale : univers → domaines → dossiers → notes.
- Dépliage progressif : les branches ne sont chargées qu'à l'ouverture.
- Zoom, panoramique, recentrage.
- Clic sur une feuille : ouverture de la note.
- Compteurs sur les branches non dépliées.
- Périmètre sélectionnable (tout, un univers, un domaine).

**RG-M10-01** — La carte mentale ne montre que ce que l'utilisateur a le droit de voir.

---

## M11 — Signets web

**UC-M11-01** — L'utilisateur enregistre un lien web utile dans un domaine.

- Formulaire : adresse, titre, description, domaine de rattachement, étiquettes.
- Le titre est proposé automatiquement à partir de l'adresse quand c'est possible.
- Liste des signets d'un domaine, filtrable par étiquette.
- Modification et suppression par les profils habilités.

**RG-M11-01** — Les signets sont **cherchables** au même titre que les notes, et clairement identifiés comme liens externes dans les résultats.

**RG-M11-02** — Un signet appartient à un domaine et suit ses règles de visibilité.

---

## M12 — Import du patrimoine

Sans reprise de l'existant, le produit démarre vide et n'a aucune valeur. L'import est une fonctionnalité de premier plan, pas un utilitaire.

### M12.1 — Formats acceptés

| Format | Traitement attendu |
|---|---|
| **Traitement de texte** (.doc, .docx) | Conversion en contenu riche. Titres, listes, tableaux, mise en forme préservés. Images extraites et rattachées |
| **Présentation** (.pptx) | Conversion en contenu riche, une section par diapositive |
| **PDF** | Extraction du texte sélectionnable. Un PDF scanné produit une note avec un avertissement explicite « contenu scanné — transcription manuelle recommandée » |
| **Texte brut** (.txt) | Interprété comme du Markdown si une structure est détectée |
| **Markdown** (.md) | Conversion directe, en-tête de métadonnées exploité |

### M12.2 — Scénarios d'import

**UC-M12-01 — Importer des notes dans un domaine existant.**
L'utilisateur choisit un domaine cible et dépose un dossier ou une archive. L'arborescence de fichiers devient l'arborescence de dossiers du domaine.

**UC-M12-02 — Importer un domaine complet.**
L'utilisateur dépose une arborescence dont le premier niveau devient un nouveau domaine, créé automatiquement, et dont les sous-dossiers deviennent ses dossiers.

**UC-M12-03 — Importer un corpus structuré.**
Import destiné à des contenus produits en amont selon une convention de métadonnées documentée. Chaque fichier porte un en-tête décrivant : identifiant, type, titre, étiquettes, dossier, domaine, visibilité, statut, propriétés typées, liens vers d'autres fiches. L'import résout ces références, crée les liens internes et les relations correspondantes.

**RG-M12-01** — L'import structuré est **idempotent** : réimporter le même corpus met à jour les notes existantes identifiées par leur identifiant, sans créer de doublon et sans casser les liens existants.

**RG-M12-02** — Un mode **simulation** valide l'ensemble du corpus et produit le rapport complet sans rien modifier.

**RG-M12-03** — Les références non résolues (lien vers un identifiant inexistant, type inconnu, étiquette inconnue) sont **signalées dans le rapport** sans faire échouer l'import, sauf si l'utilisateur a explicitement demandé un mode strict.

### M12.3 — Parcours d'import

**UC-M12-04** — L'utilisateur importe un lot et suit son déroulement.

1. **Choix du scénario** (parmi les trois ci-dessus), avec une explication en langage clair — jamais de jargon technique.
2. **Dépôt** : glisser-déposer d'un dossier ou d'une archive, ou sélection de fichiers.
3. **Aperçu** : le produit affiche l'arborescence détectée, le nombre de fichiers par format, les fichiers qui seront ignorés, et le domaine ou les dossiers qui seront créés. L'utilisateur valide ou renonce.
4. **Progression en temps réel** : barre de progression, fichier en cours, compteurs de succès et d'échecs qui s'incrémentent.
5. **Rapport final** : nombre de notes créées, mises à jour, ignorées, en échec ; pour chaque échec, le nom du fichier et la raison en langage clair ; liste des références non résolues ; liens directs vers les notes créées.

**RG-M12-04** — Un fichier en erreur n'interrompt jamais le lot. Le traitement continue et l'erreur est consignée.

**RG-M12-05** — Le titre d'une note importée provient de l'en-tête de métadonnées s'il existe, sinon du nom du fichier.

**RG-M12-06** — Les étiquettes déclarées dans l'en-tête de métadonnées sont créées si nécessaire et rattachées.

**RG-M12-07** — Les images référencées en chemin relatif dans les fichiers importés sont reprises et rattachées aux notes correspondantes.

**RG-M12-08** — Chaque note importée est indexée pour la recherche dans les 10 secondes.

**RG-M12-09** — Chaque lot d'import produit une entrée de journal : source, volume, erreurs, auteur, date. Ce journal alimente le flux d'activité de l'accueil et l'écran d'administration.

**RG-M12-10** — La profondeur d'arborescence importée est plafonnée au maximum autorisé. Au-delà, les niveaux excédentaires sont aplatis et l'opération est signalée dans le rapport.

**RG-M12-11** — Les identifiants lisibles sont rendus uniques automatiquement en cas de collision, sans écraser de note existante.

---

## M13 — Export

**UC-M13-01** — L'administrateur exporte l'intégralité d'un domaine dans un format ouvert et réimportable.

- Choix du domaine.
- Production d'une archive contenant un fichier Markdown par note.
- L'**arborescence de dossiers** du domaine est reproduite dans l'archive.
- Chaque fichier porte un en-tête de métadonnées : titre, identifiant, étiquettes, type, domaine, dossier, visibilité, statut, date.
- Les **images** sont incluses dans l'archive et les liens sont réécrits en chemins relatifs.
- Les liens internes sont exprimés dans une syntaxe réimportable.
- Un **rapport d'export** est joint quand des éléments ont été ignorés ou n'ont pas pu être convertis.

**RG-M13-01** — L'export est **réimportable** : réimporter l'archive produite doit reconstituer le domaine à l'identique, arborescence, métadonnées, étiquettes et images comprises. C'est le critère de réussite principal.

**RG-M13-02** — Un contenu non convertible n'interrompt pas l'export : la note est ignorée et consignée dans le rapport.

**RG-M13-03** — L'export est réservé aux administrateurs.

---

## M14 — Administration

Une console dédiée, organisée en trois groupes : **Contenus**, **Utilisateurs**, **Système**.

### M14.1 — Univers

**UC-M14-01** — L'administrateur organise la segmentation de haut niveau.

Créer, renommer, décrire, colorer, choisir une icône, ordonner. Voir le nombre de domaines rattachés.

**RG-M14-01** — Un univers contenant des domaines ne peut être supprimé. Le produit propose de rattacher ses domaines ailleurs.

### M14.2 — Domaines

**UC-M14-02** — L'administrateur crée et configure un espace de connaissance.

- Créer, renommer, décrire, colorer.
- Rattacher ou déplacer vers un autre univers.
- Activer ou désactiver les modules du domaine (Notes, Fiches, Cartographie, Signets, Carte mentale).
- Voir les compteurs : notes, fiches, signets, dossiers, contributeurs.
- Supprimer.

**UC-M14-03** — L'administrateur supprime un domaine et tout son contenu.

**RG-M14-02** — La suppression d'un domaine non vide affiche le décompte exact de ce qui sera détruit (notes, fiches, signets, dossiers) et exige la **saisie du nom exact du domaine**. Le bouton reste inactif tant que la saisie ne correspond pas.

**RG-M14-03** — La suppression est atomique et définitive : soit tout est supprimé, soit rien. Il n'y a pas de corbeille.

**RG-M14-04** — Les comptes rattachés au domaine supprimé sont conservés ; leur rattachement devient vide.

**RG-M14-05** — Après suppression, le contenu détruit disparaît immédiatement de la recherche.

### M14.3 — Types de fiches

**UC-M14-04** — L'administrateur définit un schéma de propriétés typées.

Créer, renommer, choisir une icône et une couleur, définir la liste des propriétés (nom, libellé, type de valeur, obligatoire, valeurs autorisées, aide à la saisie), ordonner les propriétés.

**RG-M14-06** — Supprimer un type de fiche utilisé est refusé. Le produit indique combien de notes l'utilisent et propose de les délester.

### M14.4 — Types de relations

**UC-M14-05** — L'administrateur enrichit le vocabulaire relationnel.

Créer, renommer, définir le libellé inverse, décrire l'usage attendu, voir le nombre de relations existantes.

### M14.5 — Templates

**UC-M14-06** — L'administrateur maintient les squelettes de rédaction.

Créer, éditer le contenu dans l'éditeur riche, associer à un type de note, marquer un template par défaut, dupliquer, supprimer, voir le nombre d'utilisations.

### M14.6 — Comptes

**UC-M14-07** — L'administrateur gère les accès.

- Lister : identifiant, nom affiché, rôle, domaine de rattachement, date de dernière connexion, état.
- Créer un compte : identifiant, mot de passe initial, rôle, domaine principal.
- Modifier le rôle et le rattachement.
- Réinitialiser un mot de passe : un mot de passe temporaire est généré et affiché **une seule fois**.
- Marquer un compte comme *mot de passe verrouillé*.
- Désactiver un compte.

**RG-M14-07** — Un administrateur ne peut pas se retirer lui-même le rôle d'administrateur s'il est le dernier.

**RG-M14-08** — Un compte désactivé perd immédiatement l'accès mais reste attaché à ses contributions passées.

### M14.7 — Configuration globale

| Paramètre | Effet |
|---|---|
| Seuil de fraîcheur vert | Bascule vert → jaune |
| Seuil de fraîcheur jaune | Bascule jaune → rouge |
| Nombre maximum de versions par note | Plafond de rétention de l'historique |
| Adresse du portail d'assistance | Cible de l'appel à l'action de l'espace public |
| Libellé du concept « fiche » | Terme affiché dans toute l'interface (« Fiche », « Objet », « Entité »…) |
| Taille maximale d'un fichier joint | Plafond d'upload |
| Durée de session | Longévité de la connexion |

**RG-M14-09** — Toute modification de seuil provoque un recalcul immédiat et visible de tous les badges concernés.

**RG-M14-10** — La validation refuse les combinaisons incohérentes (seuil jaune inférieur ou égal au seuil vert, plafond négatif…) avec un message explicite.

### M14.8 — Imports et exports

Les panneaux d'import (M12) et d'export (M13) sont accessibles depuis la console, en plus de leurs points d'entrée propres. Le journal des imports passés y est consultable.

### M14.9 — Analytique

Voir M15.

---

## M15 — Mesure et pilotage documentaire

### M15.1 — Compteur de consultations

**RG-M15-01** — Chaque note affiche son nombre de consultations partout où elle apparaît. Ce compteur sert de reconnaissance implicite du travail des contributeurs.

### M15.2 — Journaux

| Journal | Contenu |
|---|---|
| **Recherches** | Requête, horodatage, nombre de résultats, résultat ouvert ou non, utilisateur (anonymisé en public) |
| **Consultations** | Note, horodatage, durée approximative, utilisateur (anonymisé en public) |
| **Imports** | Source, volume, erreurs, auteur, horodatage |
| **Vérifications** | Note, vérificateur, horodatage |

**RG-M15-02** — Les journaux de l'espace public sont anonymisés : aucun identifiant d'utilisateur n'y est associé.

### M15.3 — Trous documentaires

**UC-M15-01** — L'administrateur découvre ce que les gens cherchent sans le trouver.

Écran listant les requêtes les plus fréquentes ayant produit **zéro résultat** ou **zéro ouverture**, avec leur fréquence et leur évolution. Chaque ligne propose de créer la note manquante avec le titre pré-rempli.

### M15.4 — Notes orphelines

**UC-M15-02** — L'administrateur identifie le contenu mort.

Écran listant les notes jamais consultées, ou sans aucun lien entrant, ou jamais vérifiées, avec leur date de création, leur domaine et leur auteur. Actions proposées : signaler à réviser, réaffecter, supprimer.

### M15.5 — Santé documentaire

**UC-M15-03** — Le référent pilote la qualité de son périmètre.

Restitution par domaine et par univers :

- Répartition de la fraîcheur (vert / jaune / rouge) et son évolution.
- Nombre de notes jamais vérifiées.
- Nombre de notes en attente de révision.
- Nombre de brouillons.
- Nombre de registres opérationnels désynchronisés.
- Taux de couverture par type de note.
- Contributeurs actifs sur la période.

### M15.6 — Adoption

- Consultations sur 7 jours et tendance par rapport à la période précédente.
- Volume de recherches et **taux de recherche aboutie** (l'indicateur nord).
- Notes les plus consultées.
- Contributeurs les plus actifs.

**RG-M15-03** — Aucun indicateur ne permet d'établir un classement nominatif de performance individuelle exploitable à des fins de contrôle. Les statistiques par contributeur restent des volumes de contribution, présentés comme reconnaissance, pas comme évaluation.

---

## M16 — Compte utilisateur

### M16.1 — Connexion

**UC-M16-01** — L'utilisateur se connecte avec un compte local.

- Identifiant et mot de passe.
- Option « se souvenir de moi » prolongeant la session.
- Message d'erreur **générique** en cas d'échec : ni le fait que l'identifiant existe, ni celui que le mot de passe est faux ne sont révélés.
- Après connexion, l'utilisateur retourne à la page qu'il tentait d'atteindre, ou à son accueil.

**RG-M16-01** — Un nombre excessif de tentatives depuis une même origine est ralenti puis bloqué temporairement, avec un message explicite indiquant la durée d'attente.

### M16.2 — Déconnexion

**UC-M16-02** — L'utilisateur se déconnecte depuis son menu utilisateur et atterrit sur l'espace public.

### M16.3 — Profil

**UC-M16-03** — L'utilisateur consulte et met à jour ses informations.

Onglets :

| Onglet | Contenu |
|---|---|
| **Identité** | Nom affiché, identifiant, adresse électronique, rôle, domaine principal, date d'arrivée, avatar |
| **Sécurité** | Changement de mot de passe, dernière connexion, préférences de session |
| **Distinctions** | Badges obtenus et à obtenir, statistiques de contribution |
| **Activité** | Contributions récentes : notes créées, modifiées, vérifiées |

### M16.4 — Changement de mot de passe

**UC-M16-04** — L'utilisateur change son mot de passe.

- Saisie du mot de passe actuel, du nouveau, et de sa confirmation.
- Longueur minimale imposée et indiquée avant la saisie.
- Indicateur de robustesse.
- La session reste active après le changement.

**RG-M16-02** — Un compte marqué *mot de passe verrouillé* voit le formulaire masqué et remplacé par une explication : « Compte de démonstration — mot de passe géré par l'administrateur ».

### M16.5 — Distinctions

**UC-M16-05** — L'utilisateur voit la reconnaissance de sa contribution.

Six distinctions, avec leur critère affiché et une barre de progression vers l'obtention :

| Distinction | Critère |
|---|---|
| **Premier pas** | Première note publiée |
| **Veilleur** | 10 notes vérifiées |
| **Rédacteur** | 25 notes publiées |
| **Bibliothécaire** | 50 notes publiées |
| **Tisseur** | 100 liens internes créés |
| **Référent** | Une note citée par 20 autres |

Statistiques associées : notes publiées, notes vérifiées, liens créés, citations maximales sur une note.

**RG-M16-03** — Les distinctions sont individuelles et privées par défaut. Aucun classement public n'est affiché.

---

## M17 — Espace public

Destiné aux lecteurs hors direction technique, sans compte.

### M17.1 — Accueil public

**UC-M17-01** — Un collaborateur métier trouve une réponse applicative sans créer de compte.

Contenu :

- Message d'accueil clair sur ce qu'on peut trouver ici.
- **Recherche proéminente**, focus automatique.
- **Guides populaires** : notes publiques classées par nombre de consultations, en cartes avec titre, extrait, domaine et compteur.
- **Appel à l'action de repli** : « Vous ne trouvez pas ? Ouvrir un ticket d'assistance », renvoyant vers l'adresse configurée par l'administrateur.
- Mention explicite : « Pas besoin de compte pour consulter ».
- Accès discret à la connexion pour les personnes qui en ont une.

### M17.2 — Périmètre strict

**RG-M17-01** — L'espace public expose **exclusivement** les notes à la fois *publiques* et *publiées*. Toute autre note est invisible : absente de la recherche, des suggestions, de la navigation, de la cartographie, des listes, et inaccessible par adresse directe.

**RG-M17-02** — Aucune action d'écriture n'est proposée en anonyme : ni Modifier, ni Vérifier, ni Signaler, ni Commenter.

**RG-M17-03** — Le badge de fraîcheur **est** affiché en public. La transparence sur la fiabilité vaut aussi pour les lecteurs externes.

**RG-M17-04** — Les journaux produits en anonyme sont anonymisés.

---

## M18 — Comportements transverses

### M18.1 — Retours à l'utilisateur

**RG-M18-01** — Toute action déclenche un retour visible en moins de 200 ms : changement d'état du bouton, indicateur de chargement, ou notification.

**RG-M18-02** — Les notifications sont non bloquantes, empilables, auto-effacées après quelques secondes pour les succès, persistantes jusqu'à action pour les erreurs.

### M18.2 — États

**RG-M18-03** — Chaque zone de contenu gère explicitement quatre états :

| État | Attendu |
|---|---|
| **Chargement** | Squelette de la structure finale, pas un simple sablier |
| **Vide** | Explication de ce qui manque et action pour y remédier |
| **Erreur** | Message en langage clair, cause probable, bouton pour réessayer |
| **Sans droit** | Explication et, si pertinent, à qui s'adresser |

**RG-M18-04** — Une erreur dans un panneau secondaire ne fait jamais tomber la page entière.

### M18.3 — Actions destructives

**RG-M18-05** — Toute action irréversible exige une confirmation qui rappelle précisément ce qui sera détruit et son volume. Les suppressions de dossier et de domaine exigent en outre la saisie du nom exact.

### M18.4 — Raccourcis clavier

| Raccourci | Action |
|---|---|
| Recherche rapide | Ouvrir la palette depuis n'importe où |
| Enregistrer | Enregistrer la note en cours d'édition |
| Échappement | Fermer la superposition ou le panneau courant |
| Flèches | Naviguer dans les listes de résultats |
| Entrée | Valider ou ouvrir la sélection |
| Nouvelle note | Ouvrir l'éditeur |

**RG-M18-06** — Les raccourcis disponibles sont découvrables : indiqués sur les éléments concernés et regroupés dans une aide accessible.

### M18.5 — Accessibilité

**RG-M18-07** — Contraste conforme au niveau AA sur tout texte et tout élément d'interface porteur de sens.

**RG-M18-08** — Toute action est atteignable au clavier seul, avec un ordre de tabulation cohérent et un indicateur de focus toujours visible.

**RG-M18-09** — L'information n'est **jamais** portée par la couleur seule. Le signal de fraîcheur, les types de blocs d'alerte, les types de nœuds de la cartographie portent aussi un libellé, une icône ou une forme.

**RG-M18-10** — Les superpositions piègent le focus, se ferment à l'échappement, et rendent le focus à leur déclencheur.

**RG-M18-11** — Les contenus graphiques (cartographie, carte mentale, comparaison visuelle) disposent d'une **alternative textuelle exploitable** : liste équivalente des nœuds et relations, liste des différences.

### M18.6 — Adaptation aux écrans

**RG-M18-12** — Le produit est utilisable de 360 px à très grand écran. Sur petit écran : barre latérale escamotable, colonnes latérales de la lecture repliées en sections accessibles, tableaux à défilement horizontal contenu.

**RG-M18-13** — Les cas d'usage prioritaires sur mobile sont **chercher** et **lire**. La rédaction longue et la cartographie sont acceptables en mode dégradé.

### M18.7 — Langue et formats

**RG-M18-14** — Interface intégralement en français, y compris les messages d'erreur. Aucune chaîne technique brute exposée à l'utilisateur.

**RG-M18-15** — Dates au format français, dates récentes en relatif (« il y a 3 jours ») avec la date absolue en infobulle.

**RG-M18-16** — L'architecture des textes n'interdit pas une internationalisation ultérieure, mais aucune autre langue n'est livrée.

### M18.8 — Impression

**RG-M18-17** — La lecture d'une note produit une impression propre : sans navigation, sans panneaux latéraux, avec les métadonnées de confiance en en-tête et les adresses des liens en note.

---

## Référentiel des règles de gestion

Synthèse des règles structurantes. La numérotation détaillée figure dans chaque module.

| Thème | Règle cardinale |
|---|---|
| **Accès** | Le contenu non public est invisible en anonyme, par tous les chemins, sans exception |
| **Droits** | Fermeture par défaut ; le droit explicite le plus proche dans l'arborescence l'emporte |
| **Fraîcheur** | Calcul purement temporel, seuils configurables, définition unique dans tout le produit |
| **Vérification** | Une action d'un clic, distincte de la modification, avec historique conservé |
| **Publication** | Immédiate ; le brouillon est le seul mécanisme de rétention et il est optionnel |
| **Indexation** | Toute note enregistrée ou importée est trouvable en moins de 10 secondes |
| **Recherche** | Réponse en moins de 1,5 s ; au-delà de 3 s le produit a échoué |
| **Unicité de la note** | Une fiche est une note ; le nœud du graphe est la note ; aucun objet parallèle |
| **Registres** | Deux registres figés, Référence canonique et Opérationnel optionnel, métadonnées partagées |
| **Versions** | Capture automatique, immuable, plafonnée ; restaurer ne détruit jamais |
| **Templates** | Subsidiaires ; la page vierge est le défaut |
| **Import** | Un échec unitaire n'interrompt jamais un lot ; idempotence sur l'import structuré |
| **Export** | Réimportable à l'identique — critère de réussite principal |
| **Suppression** | Atomique, définitive, confirmée par saisie du nom pour les objets structurants |
| **Chiffres** | Aucune valeur illustrative, aucune tendance simulée, jamais |
| **Dégradation** | Une brique optionnelle indisponible n'empêche jamais d'utiliser le produit |

---

## Parcours utilisateurs de référence

### PU-01 — L'intervenant sous pression (chemin nominal)

1. Sur site, l'intervenant ouvre le produit dans son navigateur.
2. Il déclenche la palette de recherche au clavier et tape trois mots, avec une faute.
3. Les résultats apparaissent au fil de la frappe ; le premier porte un badge vert « Vérifié il y a 12 jours ».
4. Il ouvre le résultat à la flèche puis Entrée.
5. La note s'affiche : bandeau de confiance en haut, sommaire à gauche.
6. Un sélecteur lui propose la version *Opérationnelle* : il bascule dessus.
7. Il suit les phases numérotées, copie un bloc de commande en un clic, colle dans son terminal : le texte est propre.
8. En bas, un bloc d'alerte « Attention » lui évite une erreur.
9. L'opération réussie, il clique **Marquer comme vérifié**. Le badge repasse au vert. Une seconde.

**Critère de réussite : moins de 60 secondes entre l'ouverture et le premier geste technique.**

### PU-02 — Le contributeur formalise

1. Après une intervention, le contributeur clique « Nouvelle note ».
2. Un sélecteur propose des templates ; il choisit « Procédure technique ».
3. Le squelette apparaît : Objectif, Prérequis, Étapes, Vérification, En cas de problème.
4. Il saisit le titre — le produit l'avertit qu'une note très proche existe déjà. Il vérifie, ce n'est pas la même, il continue.
5. Il rédige en Markdown ; les listes et titres se forment à la volée.
6. Il tape le caractère déclencheur, insère un bloc de code, choisit le langage.
7. Il tape la séquence de lien interne, l'auto-complétion propose une note existante, il la lie.
8. Il ajoute deux étiquettes en auto-complétion, choisit son dossier.
9. Il enregistre. Confirmation. La note est trouvable en recherche dans les secondes qui suivent.

**Critère de réussite : moins de 5 minutes pour une procédure simple.**

### PU-03 — Le lecteur externe

1. Sans compte, un collaborateur métier ouvre l'adresse du produit.
2. L'accueil public l'accueille et propose une recherche.
3. Il cherche un nom d'application. Les résultats ne contiennent que du contenu public.
4. Il ouvre un guide utilisateur, le lit, voit qu'il a été vérifié récemment.
5. Il ne trouve pas la réponse à sa question suivante : l'appel à l'action « Ouvrir un ticket d'assistance » le redirige vers le portail.

**Critère de réussite : aucun contenu interne n'est atteignable, à aucun moment.**

### PU-04 — Le référent pilote

1. Le référent ouvre son accueil : quatre indicateurs, dont « 7 notes à réviser ».
2. La corbeille de révisions lui montre les notes signalées avec le commentaire de chaque demandeur.
3. Il ouvre la première, lit le commentaire en bandeau, corrige, enregistre, vérifie. La demande disparaît.
4. Il ouvre le tableau de bord de son domaine : la barre de fraîcheur montre 18 % de rouge.
5. Il filtre la liste sur « fraîcheur rouge », trie par consultations décroissantes, et traite les plus lues d'abord.
6. Il consulte les trous documentaires : trois requêtes récurrentes sans résultat. Il crée la note manquante d'un clic depuis la liste.

### PU-05 — La reprise du patrimoine

1. L'administrateur ouvre la console, onglet Imports.
2. Il choisit « Importer un domaine complet », dépose une arborescence.
3. L'aperçu affiche l'arborescence détectée, 240 fichiers, 3 formats, 6 fichiers ignorés avec la raison.
4. Il valide. La progression défile en temps réel.
5. Le rapport final : 231 notes créées, 3 en échec avec la raison, 6 ignorées, 18 dossiers créés, 1 domaine créé.
6. Il ouvre le domaine créé : l'arborescence est là, les notes sont trouvables.

### PU-06 — L'analyse de dépendance

1. Un incident survient sur un serveur.
2. Le référent ouvre la cartographie, filtre sur le domaine Infrastructure.
3. Il cherche le serveur dans le graphe et clique dessus : le focus se pose, ses voisins ressortent, le reste s'estompe et **reste** estompé.
4. Le panneau de détail liste : « héberge → 4 applications », « dépend de → 2 équipements réseau ».
5. Un halo indique que ce serveur est un **point d'articulation** : sa perte isolerait une partie du système.
6. Il ouvre chaque application impactée, dont les fiches portent les contacts et procédures de reprise.

---

## Exigences non fonctionnelles perçues

Formulées en termes d'expérience, pas de moyens.

### Performance

| Exigence | Cible | Seuil d'échec |
|---|---|---|
| Affichage des premiers résultats de recherche | < 500 ms | > 1,5 s |
| Recherche complète avec facettes | < 1,5 s | > 3 s |
| Ouverture d'une note | < 1 s | > 2,5 s |
| Indexation après enregistrement | < 10 s | > 30 s |
| Ouverture de la palette de recherche | Immédiate, perçue instantanée | perceptible |
| Affichage initial d'une cartographie de 500 nœuds | < 3 s | > 8 s |
| Enregistrement d'une note | < 1 s | > 3 s |

### Volumétrie de dimensionnement

- 50 à 200 utilisateurs authentifiés, 10 à 30 simultanés.
- 500 notes à la mise en service, croissance visée vers plusieurs milliers.
- 10 à 30 domaines, 2 à 6 univers.
- Arborescences jusqu'à 10 niveaux, plusieurs centaines de dossiers.
- Graphes de 500 à 2 000 nœuds.
- Imports de lots de plusieurs centaines de fichiers.

### Robustesse

**RG-NF-01** — Une brique optionnelle indisponible (recherche par sens, service de conversion à l'import) **dégrade** la fonctionnalité concernée avec un message clair, sans jamais empêcher l'usage du reste du produit.

**RG-NF-02** — Aucune perte de contenu : une note en cours de rédaction est protégée par la sauvegarde automatique et l'avertissement de sortie.

**RG-NF-03** — Aucune donnée invisible : si un traitement différé est en cours (indexation, calcul de familles sémantiques), l'utilisateur en est informé plutôt que de constater une absence inexpliquée.

### Sécurité fonctionnelle

**RG-NF-04** — Le refus d'accès et l'inexistence produisent la même réponse visible.

**RG-NF-05** — Les actions destructives sont confirmées, tracées et attribuées à leur auteur.

**RG-NF-06** — Aucun secret, aucune trace technique, aucun identifiant interne n'est exposé dans un message d'erreur destiné à l'utilisateur.

**RG-NF-07** — Les tentatives de connexion répétées sont ralenties.

### Exploitation

**RG-NF-08** — Le produit est auto-hébergeable sans dépendance à un service externe payant.

**RG-NF-09** — Sauvegarde et restauration complètes du contenu (notes, fichiers joints, configuration) sont des opérations documentées et testables.

**RG-NF-10** — Une page d'indisponibilité programmée peut être activée sans que les utilisateurs rencontrent des erreurs brutes.

---

## Brief de direction artistique

Cette section **cadre** la charte graphique. Elle ne la choisit pas : les options sont à arbitrer avant le maquettage.

### Ce que la charte doit porter

| Intention | Traduction attendue |
|---|---|
| **Fiabilité lisible** | Le signal de fraîcheur est l'élément le plus reconnaissable du produit. Il doit être identifiable en vision périphérique |
| **Confort de lecture** | Le produit est lu longtemps, sur des contenus techniques denses. La typographie de lecture prime sur tout le reste |
| **Densité maîtrisée** | Beaucoup d'information par écran, sans sensation d'encombrement |
| **Caractère assumé** | Le produit ne doit pas ressembler à un wiki d'entreprise générique. Une identité reconnaissable en une capture d'écran |
| **Hiérarchie franche** | Un utilisateur pressé doit distinguer titre / métadonnées / contenu / actions sans les lire |

### Ce qui relève de la conception graphique, et non de ce document

Le choix du registre visuel, de la palette, des typographies, de la grille, des rayons et du traitement iconographique **n'est pas arbitré ici**. Il appartient à la phase de conception graphique, menée séparément à partir des intentions ci-dessus.

Ce document ne prescrit donc aucune valeur visuelle. Quand il emploie les mots « saillant », « discret » ou « au premier regard », il exprime une **priorité de lecture fonctionnelle**, pas une consigne esthétique : le moyen d'y parvenir est libre.

**RG-DA-01** — Quelle que soit la direction retenue, la charte est **systémique** : jetons de couleur, d'espacement, de typographie et de rayon nommés, aucune valeur arbitraire dans les écrans, une bibliothèque de composants qui fait foi.

**RG-DA-02** — La charte est validée **sur les maquettes**, avant toute réalisation.

**RG-DA-03** — Le signal de fraîcheur reste identifiable en vision périphérique et ne repose jamais sur la couleur seule, quelle que soit la direction retenue. C'est la seule contrainte que le fonctionnel impose au graphisme.

---

## Backlog de maquettage

Ordre d'attaque proposé pour la phase design, en trois vagues. Chaque vague se valide avant la suivante.

### Vague 1 — Fondations et moments de vérité (7 écrans)

| Priorité | Écran | Pourquoi en premier |
|---|---|---|
| 1 | **V-14 Lecture d'une note** | L'écran le plus vu du produit. Il fixe typographie, densité, hiérarchie, traitement du signal de fraîcheur |
| 2 | **V-08 Recherche + V-09 Palette** | Le cœur fonctionnel. Fixe la carte de résultat, les facettes, la navigation clavier |
| 3 | **V-07 Accueil contributeur** | Fixe les indicateurs, les cartes, les panneaux, l'activité |
| 4 | **V-17 Éditeur** | Fixe la barre d'outils, le menu de commandes, les blocs de contenu |
| 5 | **V-37 Coquille applicative** | Fixe la navigation permanente, l'arborescence, la barre supérieure |
| 6 | **V-41 Bibliothèque de composants** | Consolide tout ce qui précède en système |

### Vague 2 — Structure et exploration (9 écrans)

V-11 Page de domaine · V-10 Page d'univers · V-12 Liste des notes · V-13 Page de dossier · V-19 Cartographie complète · V-20 Cartographie par type maître · V-15 Historique · V-16 Comparaison de versions · V-18 Éditeur Opérationnel

### Vague 3 — Périphérie et administration (12 écrans)

V-01 à V-04 Espace public · V-05 / V-06 Authentification · V-24 Import · V-25 Profil · V-21 Carte mentale · V-22 / V-23 Signets · V-27 à V-36 Console d'administration (un gabarit générique + variations)

### Livrables attendus par écran

1. Maquette haute fidélité, état nominal.
2. États : chargement, vide, erreur, sans droit.
3. Déclinaison petit écran pour les écrans concernés par RG-M18-13.
4. Annotations des comportements interactifs et des règles de gestion appliquées.

---

## Principes de conception non négociables

Ces principes priment sur toute considération de commodité de réalisation. Ils sont énoncés séparément parce qu'ils sont les plus faciles à sacrifier sous contrainte de délai, et les plus coûteux à réintroduire après coup.

| # | Principe | Portée |
|---|---|---|
| P-01 | **Une seule définition de la fraîcheur** | Le badge d'une note, les agrégats de domaine, ceux d'univers et les indicateurs d'accueil emploient rigoureusement le même calcul. Deux définitions concurrentes ruinent la crédibilité du signal (RG-M06-03) |
| P-02 | **Aucune valeur illustrative** | Aucun indicateur, aucune tendance, aucun compteur ne peut être figé ou simulé. Une donnée indisponible s'affiche comme telle (RG-M01-01) |
| P-03 | **Aucune entrée de menu inerte** | Une entrée visible est une entrée qui fonctionne. Pas de « bientôt disponible », pas de lien mort, pas d'onglet grisé |
| P-04 | **Les modules de domaine sont réellement effectifs** | Un module désactivé disparaît de la navigation et des tableaux de bord du domaine. L'activation n'est pas décorative (RG-STR-06) |
| P-05 | **Le pilotage documentaire est livré, pas différé** | Santé par domaine, trous documentaires et notes orphelines font partie de la première livraison. Ce sont eux qui font vivre le corpus (M15) |
| P-06 | **Alternative textuelle sur tout contenu graphique** | Cartographie, carte mentale et comparaison visuelle disposent d'une restitution exploitable sans le rendu graphique (RG-M18-11) |
| P-07 | **Un seul terme par concept** | Le vocabulaire du §2.3 est contractuel. Aucun synonyme ne circule dans l'interface. Seul le concept « fiche » est renommable, et globalement (M14.7) |
| P-08 | **L'origine d'une relation est visible** | Déclarée, déduite ou ambiguë : l'utilisateur sait toujours si une relation a été saisie par un humain ou inférée (M08.3) |
| P-09 | **Une action interdite n'est pas affichée** | Ni grisée, ni refusée après le clic. L'utilisateur ne rencontre pas de porte fermée (RG-M05-08) |
| P-10 | **Dégradation, jamais panne** | Une brique optionnelle indisponible dégrade la fonctionnalité concernée avec un message clair, sans jamais empêcher l'usage du reste (RG-NF-01) |

---

## Hors périmètre

Explicitement exclu. À réévaluer sur preuve de besoin.

| Fonctionnalité | Motif |
|---|---|
| **Commentaires et fils de discussion sur les notes** | Le retour se fait oralement à cette échelle. La demande de révision commentée couvre le besoin de signalement |
| **Notifications par courriel** | Population co-localisée qui se voit quotidiennement |
| **Édition collaborative en temps réel** | Surdimensionné ; le versionnement et l'avertissement de conflit suffisent |
| **Workflow de validation formel** | Le brouillon et la demande de révision couvrent le besoin sans cérémonie |
| **Corbeille et restauration après suppression** | La suppression est confirmée et définitive. La sauvegarde couvre l'accident |
| **Export PDF** | L'impression propre (RG-M18-17) et l'export Markdown couvrent l'essentiel |
| **Import de tableurs** | Les tableaux de gestion de parc restent dans leur outil |
| **Authentification par annuaire d'entreprise** | Reporté à une version ultérieure ; l'authentification locale est le socle |
| **Vues dynamiques interrogeant les propriétés typées** | Envisageable une fois le corpus de fiches significatif |
| **Assistant conversationnel sur le corpus** | La recherche par sens le rendra possible plus tard ; hors périmètre de la première version |
| **Application mobile native** | Le navigateur couvre les usages mobiles prioritaires (chercher, lire) |
| **Multilinguisme** | Français uniquement (RG-M18-16) |

---

## Ce qui reste à arbitrer

Quatre décisions sont attendues avant la mise en œuvre :

1. **Nom du produit** — Le nom de travail *Codicillus* est-il retenu ?
2. **Périmètre de la première version** — Les 18 modules sont-ils tous dans la première livraison, ou certains (carte mentale, signets, analyses de graphe avancées) passent-ils en seconde version ?
3. **Vocabulaire du concept « fiche »** — Terme retenu par défaut dans l'interface (M14.7).
4. **Amorçage du corpus** — Volumétrie et formats du patrimoine documentaire à reprendre lors de la mise en service, afin de dimensionner l'import (M12).

La direction graphique fait l'objet d'un arbitrage distinct, hors de ce document (§26).

---

*Fin du cahier des charges fonctionnel — version 1.0*
