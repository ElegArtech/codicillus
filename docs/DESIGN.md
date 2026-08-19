# DESIGN.md — le système visuel comme contrainte

**Lot** : T-009, complété par **T-009b** · **Date** : 18 août 2026, complètement de
l'inventaire le 19 août 2026 · **Régime** : extraction, pas conception.

Ce document ne dessine rien. Il **documente et contraint**. La source unique du
système visuel reste `mockups/socle.css`, lu et jamais édité (plan §3.5,
ADR-002) ; la feuille globale de l'application en est une copie contrôlée dont
la non-divergence est vérifiée mécaniquement (`pnpm verif:jetons`, batterie 2).

Sa fonction est de transformer la production d'interface en **assemblage
contraint** : l'agent qui implémente une vue ne dessine pas, il compose. Toute
valeur qu'il aurait à choisir lui-même est le signe qu'il est sorti du système —
et c'est un écart à remonter, jamais une décision d'exécution.

## Sommaire

| § | Contenu | À lire quand |
|---|---|---|
| **0** | Sources, préséance, et **l'avertissement sur les deux socles** | Avant toute reprise du socle dans l'application |
| **1** | Les jetons nommés — décompte réel, rôle, emploi, décisions tracées | Avant d'écrire une déclaration de style |
| **2** | **L'inventaire fermé des composants** — les 41 maquettes, par nature, et le contrôle P-5 | Avant d'implémenter une vue |
| **3** | **Le témoin de fraîcheur** — balisage exact, géométrie, interdits | Dès qu'une note est représentée |
| **4** | Les règles de layout — grille, densité, ruptures, 360 px | Avant de poser une structure |
| **5** | **Ce qui est proscrit** — huit familles de contrôles mécanisables | Spécification de `pnpm verif:jetons` |
| **6** | Constats de vérification, contradictions, écarts | En revue, et en cas de doute sur une source |
| **7** | Ce que ce document n'autorise pas | — |

---

## 0. Sources, préséance, avertissement

### 0.1 Sources de ce document

| Source | Ce qu'elle apporte | Statut |
|---|---|---|
| `mockups/socle.css` (331 lignes) | Les jetons, dix familles de composants | Gelé, lecture seule, empreinte au `GEL.md` |
| `mockups/V-41-bibliotheque.html` | Onze familles de composants en situation, avec leur règle d'emploi | Gelé, lecture seule |
| `mockups/V-37-coquille.html`, `V-14`, `V-12` | Grille, densité, points de rupture | Gelés |
| **Les 41 `mockups/V-xx-*.html`** | Le relevé complet des classes employées, par nature — §2.0, §2.D à §2.I | Gelés, relevés mécaniquement (`verif/inventaire-composants.mjs`) |
| `cadrage/BRIEF-VUES.md` §3, §V-41 | Les conventions communes que le socle sert | Gelé |
| `cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md` | RG-DA-01, RG-DA-03, RG-M18-07, RG-M18-09, RG-M18-12, RG-M18-13 | Gelé |

Ordre de préséance en cas de désaccord : **maquettes > cahier des charges**
(plan §11, D-08). Les désaccords relevés lors de l'extraction sont listés au
§6.

### 0.2 Avertissement : il existe deux socles, et ce n'est pas le même

**Constat de fait, à traiter avant tout portage** (voir `docs/ecarts/ECART-006.md`).

`mockups/socle.css` compte 331 lignes. Le socle **en ligne** dans les maquettes
en compte jusqu'à 465, et il est **strictement plus riche**. Les 41 vues
embarquent cinq états successifs du même fichier, emboîtés :

| Lignes du socle en ligne | Vues | Ce qu'il contient de plus que `socle.css` |
|---|---|---|
| 331 | V-01, V-02, V-03, V-09 | — identique au fichier |
| 399 | V-05, V-08, V-10 | + section 11 « Champs de saisie », `.si-admin`, jeton `--l-large` |
| 400–401 | V-04, V-06, V-11 à V-13, V-15 à V-37 | idem, à un commentaire près |
| 465–466 | **V-07, V-14, V-38, V-39, V-40, V-41** | + section 9 « Notifications » complète (quatre types, actions, progression, fermeture) |

Conséquences, énoncées ici pour qu'elles soient lisibles plus tard :

1. **Le fichier `mockups/socle.css` est en retard sur les maquettes qu'il est
   censé fonder.** Il ne contient ni les champs de saisie, ni les notifications
   à quatre types, ni le jeton `--l-large`, ni la règle de rôle `.si-admin` —
   tous employés par les vues gelées.
2. Une copie conforme de `mockups/socle.css` dans l'application **ne suffirait
   pas** à rendre les vues : il manquerait 23 classes, une règle de rôle et un jeton.
   *Relevé de T-009b, pour mémoire* : le socle en ligne déclare **58** noms de
   classe, dont **25** que `mockups/socle.css` ne porte pas — `.si-admin`
   comprise. L'écart de comptage avec « 23 » n'a pas d'effet : la contrainte
   réelle est P-6.1, qui compare le fichier au bloc gelé, à l'octet.
3. Le présent document documente **les deux**, et signale systématiquement ce
   qui n'existe que dans le socle en ligne. La référence de vérité retenue pour
   l'implémentation est le socle en ligne le plus complet, celui de
   **`mockups/V-07-accueil-contributeur.html`** (lignes 8 à 472), par
   application de l'ordre de préséance.

> **Précision du 18 août 2026** — une première rédaction désignait ici **V-41**.
> Les deux blocs sont identiques au saut de ligne final près : 19 622 octets pour
> V-41, non terminé par un saut de ligne, contre 19 623 pour V-07. L'enjeu est nul
> au rendu, mais réel pour un contrôle à l'octet — et la batterie P-6.1 compare
> précisément à l'octet. La source citée est donc **V-07** partout :
> `docs/ecarts/ECART-007.md`, `docs/errata-cadrage.md` E-01, `verif/extraire-socle.mjs`
> et le présent paragraphe. V-07 est retenu parce qu'il est le gel le plus récent
> et le sur-ensemble strict.

Aucune correction n'est apportée à `mockups/` : il est gelé, et il le reste. Les
corrections au cadrage vivent dans `docs/errata-cadrage.md` (ARB-006).

---

## 1. Les jetons nommés

### 1.0 Décompte réel

Le plan §3.4 annonce **61 jetons**. Le décompte réel, effectué sur le bloc
`:root` de `mockups/socle.css` (lignes 10 à 102) :

> **69 jetons** dans `mockups/socle.css`.
> **70 jetons** dans le socle en ligne des maquettes (`--l-large` en plus).

Le chiffre du plan est à corriger. Répartition :

| Famille | Nombre | Lignes de `socle.css` |
|---|---|---|
| Couleur — encres | 4 | 12–20 |
| Couleur — surfaces | 4 | 23–26 |
| Couleur — traits | 3 | 29–31 |
| Couleur — accent | 4 | 34–37 |
| Couleur — fraîcheur | 6 | 40–45 |
| Couleur — sémantique | 6 | 48–53 |
| Typographie — familles | 3 | 56–58 |
| Typographie — échelle | 9 | 61–69 |
| Typographie — interlignes et graisses | 7 | 72–78 |
| Espacement | 9 | 81–82 |
| Rayons | 4 | 85 |
| Élévations | 2 | 88–89 |
| Dimensions de structure | 5 (**6** en ligne) | 92–96 |
| Mouvement | 3 | 99–101 |
| **Total** | **69** (**70** en ligne) | |

### 1.1 Couleur — encres

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--c-encre` | `#16222b` | Texte principal | `body`, titres, `.btn`, fond des notifications, `.saut-contenu` |
| `--c-encre-2` | `#46585f` | Texte secondaire | `.past`, `.btn--discret`, `.rail__lien`, `.carte__extrait`, `.dlg__texte` |
| `--c-encre-3` | `#536066` | Texte tertiaire, métadonnées | `.etiq`, `.zone-etat__txt`, `.champ__aide`, `.fil a`, `.chrono__quand` |
| `--c-encre-4` | `#93a2a6` | Désactivé, réservé de saisie | `.saisie::placeholder`, `.past--etiquette::before`, `.fil span` |

**Décision tracée** — `--c-encre-3` porte dans `socle.css` (lignes 14–19) le
commentaire suivant, qui est une décision d'accessibilité et non une note de
style :

> *texte tertiaire, métadonnées — assombri le 16/08/2026 : `#71838a` ne donnait
> que 2,75:1 sur le fond creux, là où RG-M18-07 exige 4,5:1 pour un texte de
> 11 px. Teinte conservée, contraste porté à 4,54:1 au pire des quatre
> surfaces.*

Cette valeur ne se ré-éclaircit pas. Toute proposition de la ramener vers
`#71838a` est un retour en arrière sur RG-M18-07 et doit être refusée.

### 1.2 Couleur — surfaces

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--c-fond` | `#e2e7e4` | Fond d'application | `body`, `.barre` (à 90 % d'opacité) |
| `--c-fond-creux` | `#d3d9d6` | Zones en retrait, rail | `.rail`, `.esquisse`, `.saisie:disabled`, survol de `.champ__action` |
| `--c-papier` | `#fcfbf8` | Surface de lecture et cartes | `.panneau`, `.btn`, `.carte`, `.saisie`, `.dlg__boite`, `.palette__boite` |
| `--c-papier-2` | `#f5f4ef` | Surface secondaire, en-têtes de tableau | `.btn:hover`, `.past`, `.dlg__pied`, `.prose thead th` |

**Quatre surfaces, pas davantage.** Le contraste de `--c-encre-3` est calculé
« au pire des quatre » : ajouter une cinquième surface invalide ce calcul.

### 1.3 Couleur — traits

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--c-trait` | `#cbd3d0` | Bordure standard | `.panneau`, `.btn`, `.past`, `.rail` (bord droit), `.arbre ul` |
| `--c-trait-fin` | `#e0e5e2` | Séparateur discret | `.panneau__tete`, `.dlg__pied`, `.chrono` |
| `--c-trait-fort` | `#9aa7a3` | Bordure appuyée | `.saisie`, `.btn:hover`, `.dlg__boite`, contours en pointillés d'état vide |

### 1.4 Couleur — accent (violet d'encre)

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--c-accent` | `#453ba0` | Action principale, focus, état courant | `.btn--principal`, `:focus-visible`, `.rail__sceau`, `.saisie:focus`, `.dlg__marque` |
| `--c-accent-fonce` | `#322b78` | Survol de l'action principale, texte sur voile | `.btn--principal:hover`, `.past--type` |
| `--c-accent-voile` | `#edecf8` | Fond d'état sélectionné | `.past--type`, `::selection`, halo de `.saisie:focus`, filtre actif |
| `--c-accent-trait` | `#c9c5e8` | Bordure sur voile d'accent | `.past--type`, pastille de filtre actif |

L'accent est **la seule teinte d'action** du système. Il n'y a pas de couleur
« secondaire » : la hiérarchie des boutons passe par le poids visuel, pas par
une seconde teinte (V-41, famille « Boutons »).

### 1.5 Couleur — fraîcheur

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--c-frais` | `#1d6b4a` | Niveau frais | `.temoin--frais`, `.cartouche[data-niveau="frais"]`, `.tampon` |
| `--c-frais-voile` | `#e4efe8` | Fond du niveau frais | `.cartouche[data-niveau="frais"]`, `.repart .p-frais` |
| `--c-vieil` | `#8f5c00` | Niveau vieillissant | `.temoin--vieil`, `.cartouche[data-niveau="vieil"]` |
| `--c-vieil-voile` | `#f6eedd` | Fond du niveau vieillissant | `.cartouche[data-niveau="vieil"]` |
| `--c-obsolete` | `#a52c1b` | Niveau obsolète | `.temoin--obs`, `.cartouche[data-niveau="obs"]` |
| `--c-obsolete-voile` | `#f7e7e3` | Fond hachuré du niveau obsolète | `.temoin--obs .temoin__txt`, `.cartouche[data-niveau="obs"]` |

Ces six jetons ne servent **qu'à** la fraîcheur. Les employer pour autre chose
détruit la lecture périphérique exigée par RG-DA-03 : voir §3.

### 1.6 Couleur — sémantique

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--c-info` | `#1b5c86` | Information | Bandeaux et alertes d'information |
| `--c-info-voile` | `#e4eef4` | Fond d'information | idem |
| `--c-alerte` | `#8f5c00` | Avertissement | `.past--brouillon`, `.avis-saisie`, `.alerte--attention` |
| `--c-alerte-voile` | `#f6eedd` | Fond d'avertissement | idem |
| `--c-danger` | `#a52c1b` | Danger, destruction, erreur | `.btn--destructif`, `.champ__erreur`, `.dlg--destructif`, `.decompte` |
| `--c-danger-voile` | `#f7e7e3` | Fond de danger | `.btn--destructif:hover`, `.decompte`, halo d'erreur de saisie |

**Collision assumée** : `--c-alerte` = `--c-vieil` et `--c-danger` =
`--c-obsolete`, aux mêmes valeurs. Les jetons restent **distincts par nom** :
un composant de fraîcheur emploie les jetons de fraîcheur, un composant
sémantique emploie les jetons sémantiques. Substituer l'un à l'autre parce que
« la valeur est la même » interdit de faire diverger les deux échelles plus
tard, et c'est proscrit (§5, P-2).

### 1.7 Typographie — familles

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--f-ui` | `"Archivo", "Helvetica Neue", Arial, sans-serif` | Toute l'interface | `body`, `.btn`, `.saisie`, `.titre-note` |
| `--f-lecture` | `"Literata", Georgia, "Times New Roman", serif` | Corps rédigé, texte long | `.prose`, `.famille__sous`, `.bord__sous` |
| `--f-donnee` | `"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace` | Chiffres, étiquettes d'instrument, code, dates | `.etiq`, `.temoin`, `.touche`, `.bloc-code`, `.cartouche__valeur` |

Les polices sont **locales** (`mockups/polices/`, décision D-05) : aucune
requête vers une fonderie distante (RG-NF-08).

### 1.8 Typographie — échelle

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--t-micro` | `0.6875rem` (11 px) | Étiquettes mono capitales | `.etiq`, compteurs de rail |
| `--t-mini` | `0.75rem` (12 px) | Métadonnées | `.past`, `.temoin`, `.champ__aide`, `.notif__detail` |
| `--t-petit` | `0.8125rem` (13 px) | Interface secondaire | `.btn`, `.zone-etat__txt`, `.rail__lien`, `.dlg__texte` |
| `--t-base` | `0.9375rem` (15 px) | Interface | `body`, `.saisie` |
| `--t-lect` | `1.0625rem` (17 px) | Corps rédigé | `.prose` |
| `--t-t3` | `1.125rem` | Titre de niveau 3 | `.rail__nom`, `.dlg__titre`, `.cartouche__valeur` |
| `--t-t2` | `1.375rem` | Titre de niveau 2 | `.prose h2` |
| `--t-t1` | `1.75rem` | Titre de niveau 1 | `.titre-note` sur petit écran |
| `--t-titre` | `2.125rem` | Titre de note | `.titre-note` |

Neuf pas, pas un de plus. Une taille intermédiaire est un écart.

### 1.9 Typographie — interlignes et graisses

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--i-serre` | `1.2` | Titres, valeurs chiffrées | Titres de vue et de note |
| `--i-ui` | `1.45` | Interface | `body`, `.notif` |
| `--i-lect` | `1.72` | Corps rédigé | `.prose` |
| `--g-normal` | `400` | Texte courant | `body` |
| `--g-moyen` | `500` | Accentuation légère | `.etiq`, `.past`, `.btn--discret`, `.notif` |
| `--g-fort` | `600` | Libellés d'action, en-têtes | `.btn`, `.champ__label`, `.zone-etat__titre` |
| `--g-lourd` | `700` | Titres, chiffres saillants | `.rail__nom`, `.dlg__titre`, `.indicateur__val` |

### 1.10 Espacement

| Jeton | Valeur | Rôle courant |
|---|---|---|
| `--e-0` | `2px` | Interstice de jauge, ajustements optiques |
| `--e-1` | `4px` | Écart intra-composant (icône ↔ texte de pastille) |
| `--e-2` | `8px` | Écart standard entre éléments voisins |
| `--e-3` | `12px` | Rembourrage de composant, gouttière serrée |
| `--e-4` | `16px` | Rembourrage de panneau, gouttière courante |
| `--e-5` | `24px` | Marge de zone, rembourrage de page |
| `--e-6` | `32px` | Gouttière de grille de lecture |
| `--e-7` | `48px` | Séparation de sections |
| `--e-8` | `64px` | Respiration de bas de page |

Neuf pas. **Aucune valeur d'espacement en pixels n'est admise hors de cette
échelle** (§5, P-1).

### 1.11 Rayons

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--r-0` | `0` | Angle vif | Rupture de bord (palette plein écran) |
| `--r-1` | `2px` | Barres de jauge, focus, micro-éléments | `.temoin__jauge i`, `:focus-visible`, `.past`, `.esquisse` |
| `--r-2` | `4px` | Boutons, champs, liens de rail | `.btn`, `.saisie`, `.rail__lien`, `.dlg__marque` |
| `--r-3` | `8px` | Conteneurs | `.panneau`, `.notif`, `.dlg__boite`, `.cartouche` |

Le rayon plein (`50%` pour les avatars et les rouets, `999px` pour la planche
de revue) n'est pas jeton : il est propre à des formes circulaires et se lit
comme tel.

### 1.12 Élévations

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--o-pose` | `0 1px 2px rgba(22, 34, 43, .07)` | Élément posé sur le fond | `.panneau`, `.rail__lien[aria-current]`, `.carte` |
| `--o-flotte` | `0 6px 20px -4px rgba(22,34,43,.18), 0 2px 6px rgba(22,34,43,.08)` | Élément détaché, superposé | `.notif`, `.dlg__boite`, `.palette__boite`, `.menu-ctx` |

**Deux niveaux d'élévation, pas trois.** Ce qui flotte flotte ; ce qui est posé
est posé. Il n'y a pas de degré intermédiaire.

### 1.13 Dimensions de structure

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--l-rail` | `248px` | Largeur de la navigation latérale | `.app` (première piste de grille) |
| `--l-sommaire` | `204px` | Largeur du sommaire de note | `.lecture` (première piste) |
| `--l-lecture` | `680px` | Mesure du texte — confort de lecture, non maximisé | `.prose > *` |
| `--l-panneaux` | `292px` | Largeur de la colonne droite | `.lecture` (troisième piste) |
| `--l-barre` | `52px` | Hauteur de la barre supérieure | `.barre`, `scroll-margin-top` des ancres |
| `--l-large` | `900px` | Débord des objets denses : code, tableaux, schémas | `.article` |

**`--l-large` n'existe pas dans `mockups/socle.css`** — seulement dans le socle
en ligne (§0.2). Il est pourtant employé par `.article` dans toutes les vues de
lecture. Sans lui, `.article { max-width: var(--l-large) }` retombe sur `none`
et la mesure du texte n'est plus bornée.

**Décision tracée** — `--l-lecture` porte le commentaire *« confort de lecture,
non maximisé »* (`socle.css` ligne 94). Le texte rédigé est borné à 680 px
**par choix**, pas par contrainte technique : élargir la mesure au motif que
« l'écran est grand » est un écart.

### 1.14 Mouvement

| Jeton | Valeur | Rôle | Où il est employé |
|---|---|---|---|
| `--m-vif` | `120ms cubic-bezier(.2,.7,.4,1)` | Réaction immédiate | `.btn`, `.saisie`, `.saut-contenu` |
| `--m-doux` | `240ms cubic-bezier(.2,.7,.4,1)` | Apparition, transition de couche | `.notif`, `.dlg__boite`, remplissage de jauge |
| `--m-ample` | `520ms cubic-bezier(.16,.85,.3,1)` | Geste remarquable, une fois | `.tampon` (vérification en un clic) |

**Décision tracée** — `socle.css` lignes 104–107 :

```
@media (prefers-reduced-motion: reduce) {
  :root { --m-vif: 1ms; --m-doux: 1ms; --m-ample: 1ms; }
  * { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
}
```

Les trois jetons **et** toute animation sont neutralisés d'un bloc. Une
animation écrite en dur échappe à cette neutralisation : c'est l'une des raisons
pour lesquelles les durées en dur sont proscrites (§5, P-1).

### 1.15 Les autres décisions tracées dans le socle

Ces commentaires portent une justification et ne sont pas décoratifs. Ils sont
reproduits ici parce qu'ils ne se déduisent pas du code qu'ils accompagnent.

| Emplacement | Décision |
|---|---|
| `socle.css` l. 4 | *« Aucune valeur arbitraire dans les écrans : tout passe par un jeton nommé. »* — c'est ADR-002 énoncé dans la source elle-même |
| `socle.css` l. 114 | *« L'attribut `hidden` doit primer sur toute mise en page en flex ou grid. »* — d'où `[hidden] { display: none !important }` |
| `socle.css` l. 166–168 | *« Jauge à trois barres : 3 pleines = frais, 2 = vieillissant, 1 + hachures = obsolète. La forme porte l'information ; la couleur ne fait que la répéter. »* |
| `socle.css` l. 195–196 | *« Le niveau obsolète porte en plus un hachurage : reconnaissable de loin, et lisible en niveaux de gris comme en vision périphérique. »* |
| `socle.css` l. 328–329 | *« Une action qu'un utilisateur n'a pas le droit d'exécuter n'est pas affichée : ni grisée, ni refusée après le clic. »* — ADR-011 |
| Socle en ligne, section 9 | *« Le type se lit par le glyphe et le filet, jamais par la couleur seule. »* — RG-M18-09 appliqué aux notifications |
| Socle en ligne, `.notif__progres` | *« Une opération longue montre son avancement : sans quoi on ne sait pas si elle progresse ou si elle est bloquée. »* |
| V-41 l. 476–479 | *« Le rail escamoté sort de la grille : la colonne de contenu devient la seule piste. Déclarer "0 1fr" laisserait le contenu se placer dans la piste de largeur nulle, puisqu'un élément en `display:none` n'occupe plus sa piste. »* — c'est le correctif E-01/E-02, voir §6.1 |
| V-14 l. 1301–1304 | *« Le titre d'une note peut être long […] sans troncature, le fil élargit la barre, qui élargit la grille, qui fait défiler la page. Le défaut ne se voyait qu'à 768 px — entre les deux largeurs qu'on regarde d'ordinaire. »* |

---

## 2. L'inventaire fermé des composants

> **Fermé signifie : un composant absent de cet inventaire n'existe pas, et sa
> création est un écart à remonter, jamais une initiative.**

La procédure, sans exception : si la vue à implémenter demande un élément qui
n'est pas ci-dessous, l'agent **arrête** et ouvre une fiche dans `docs/ecarts/`.
Il n'invente ni classe, ni variante, ni état. Il ne « compose vite fait » pas
davantage : une classe locale nouvelle est un composant nouveau.

**Colonne « Règle » ou « Trace »** : `socle.css:NNN` désigne la ligne de la
déclaration dans `mockups/socle.css`. `V-41:NNN` désigne la ligne dans
`mockups/V-41-bibliotheque.html` — soit parce que le composant n'existe que dans
le socle en ligne (§0.2), soit parce qu'il est propre à la planche. Les entrées
du complément (§2.E) tracent au fichier qui **déclare** la classe : `socle.css`
d'abord, puis `V-07` pour ce que seul le socle en ligne porte — c'est le socle
retenu par `ECART-008 a)`, identique à celui de V-41 au saut de ligne final près
—, puis la feuille de vue qui la définit, la première dans l'ordre des numéros.

**Lire d'abord le §2.0.** Il énonce les trois natures de classe, ce que « fermé »
veut dire pour chacune, et ce que le contrôle P-5 refuse. Sans lui, le mot
« fermé » induit en erreur : les 41 maquettes connaissent 1 254 classes, et cet
inventaire n'a pas vocation à les porter toutes au même rang.

### 2.0 Les trois natures, et ce que « fermé » veut dire pour chacune

**Cette section est la clé de lecture de tout le §2, et elle est née d'une
dette.** L'inventaire ci-dessous avait été extrait de `mockups/socle.css` et de
la planche V-41, et de rien d'autre. Quatre lots ont relevé ce qu'il ne portait
pas, sans pouvoir le compléter : 36 classes de V-37 (`ECART-011` É-4), quatre
classes des zones comparées (`ECART-013` É-4), 86 classes sur V-38, V-39 et V-40
(`ECART-015`), la famille `.notif__*` désormais portée par le gabarit
(`ECART-016` É-5). **Le complément est fait, par relevé mécanique des 41
maquettes gelées.** Il ne se relit pas à la main : l'instrument est
`verif/inventaire-composants.mjs`, il rejoue le relevé à chaque exécution, et
`--verifier` confronte ce document au gel.

#### Ce que « employée » veut dire, mécaniquement

Une classe est **employée** par une vue quand la maquette la pose sur un nœud.
Quatre chemins, tous relevés — les maquettes construisent l'essentiel de leur
DOM en script, et un relevé qui ne lirait que le balisage serait faux de moitié :

| # | Chemin | Exemple |
|---|---|---|
| 1 | l'attribut `class` du balisage | `<div class="panneau">` |
| 2 | `className`, `classList`, `setAttribute("class", …)`, le balisage porté par une chaîne | `className = "notif"` |
| 3 | une **fabrique** — toute fonction qui affecte un de ses paramètres à `className`, propagation jusqu'à point fixe comprise | `el("div", "encart-b", …)` |
| 4 | une table de données ou une fonction de choix, **bornée aux classes que le fichier déclare lui-même** | `{ classe: "p-frais" }`, `return "temoin--obs"` |

Les 41 maquettes portent **1 679 affectations de `className`**, et davantage
encore d'appels de fabrique. Sans les chemins 2 et 3, `.avatar-p`, `.encart-b`,
`.chrono__txt` passaient pour mortes alors que V-41 les rend. Les jetons des chemins 2 à 4 qu'aucune maquette ne déclare ni ne pose sont
**rejetés** : « Gagner du temps » est une phrase d'alerte, pas un composant, et
`pg-prod-01` est le titre d'une note de démonstration
(`node verif/inventaire-composants.mjs --rejets`). Le chemin 2 échappe à ce
crible — ce que reçoit `className` est une classe par construction, même si
aucune règle ne la style, et `.n1` du sommaire de note est exactement dans ce
cas. Un littéral qui touche un opérateur de comparaison, lui, n'est jamais
retenu : dans `tagName === "H3" ? "n2" : "n1"`, « H3 » est comparé, pas posé.

#### Le décompte

Les 41 maquettes connaissent **1 254 classes** — déclarées par une feuille,
posées par un balisage, ou les deux :

| Nature | Classes | Familles | Son autorité | Ce qui la contrôle |
|---|---|---|---|---|
| **Transverse** | **449**, dont 58 au socle en ligne | 202 | **le §2** | **P-5**, nommément |
| **Propre à une vue** | **790** | 361 | **sa maquette gelée** | P-6.3, P-6.4, batterie 11 |
| **Hors produit** | **5** | 2 | la maquette, qui les déclare hors produit | le banc, qui les retire (§2.G) |
| Déclarée sans emploi | 10 | — | aucune — elles ne rendent rien | — (`--residu`) |

Le §6.4 annonçait « 1 202 classes » sans citer sa méthode ; le décompte ci-dessus
est celui de l'instrument, et il se reproduit par `node
verif/inventaire-composants.mjs`. Sur les 449 transverses, **210 étaient déjà
inventoriées** aux §2.A à §2.C ; les **239** autres sont au §2.E.

#### La règle, et elle est opposable

**1 · Transverse — c'est un composant, et l'inventaire le nomme.** Une classe est
transverse quand **le socle en ligne la déclare** — elle est alors opposable aux
41 vues quel que soit son nombre d'emplois — **ou** quand **deux vues au moins
l'emploient**. *Fermé* y a son sens plein, dans les deux directions : une classe
transverse absente de ce document est un **trou d'inventaire** ; une classe
employée par l'application et absente des 41 maquettes est une **invention**.
P-5 dit l'un et l'autre.

**2 · Propre à une vue — la maquette gelée est l'inventaire.** Une classe
employée par **une seule** vue et non déclarée par le socle n'est pas nommée ici,
et son absence de ce document **n'autorise rien**. *Fermé* y signifie **relevée
de la maquette à porter, et de rien d'autre** : l'agent qui implémente V-24 tire
ses 49 classes propres de `mockups/V-24-import.html`, dont sa feuille est une
copie à l'octet (P-6.3). La liste d'une vue s'obtient par
`node verif/inventaire-composants.mjs --liste=V-24`. **Ce document ne la duplique
pas** : 790 lignes recopiées à la main d'une source gelée seraient une seconde
source de vérité, donc une occasion de divergence — et le §7 interdit déjà de
compléter cet inventaire autrement que depuis une source.

**3 · Hors produit — cela ne se porte jamais.** Cinq classes ne vivent qu'à
l'intérieur d'un bloc que la maquette déclare elle-même hors produit, et que le
banc retire du DOM avant toute mesure (`verif/banc/conditions.mjs`,
`BLOCS_HORS_PRODUIT`). Les porter, ce serait porter le contrôle de maquette dans
le produit. §2.G.

#### Ce que cette règle n'autorise pas

- Elle **n'ouvre pas** la porte à une classe « propre à une vue » inventée en
  session. Propre à une vue veut dire **présente dans sa maquette gelée**, à sa
  ligne. Une classe qui n'existe dans **aucune** des 41 maquettes est une
  invention pure, et un écart au sens plein.
- Elle ne fait pas de la fréquence un argument de conception. Deux vues suffisent
  à rendre une classe transverse : **c'est un constat de partage, pas un brevet
  de qualité.** Le §2.H recense 66 noms partagés dont les vues ne partagent pas
  la définition — `.vide` et `.noeud` en tête.
- Elle ne renomme rien et ne factorise rien. Le §2.D tranche quatre
  contradictions par le décompte ; **aucune ne se solde par un renommage**, parce
  que la vue à porter garde sa classe (préséance des maquettes, plan §11 D-08).

#### L'instrument, et ce que P-5 contrôle désormais

| Commande | Ce qu'elle donne |
|---|---|
| `node verif/inventaire-composants.mjs` | le décompte par nature |
| `… --verifier` | **P-5** — sort en 1 dès un constat |
| `… --liste` | les transverses, tracées, par famille |
| `… --liste=V-xx` | les classes propres d'une vue, tracées |
| `… --classe=vide` | la fiche d'une classe : nature, trace, emplois, vue par vue |
| `… --regles=vide` | ses déclarations CSS, vue par vue — pour départager deux homonymes |
| `… --homonymes` `--orphelines` `--residu` `--rejets` | les quatre signaux du §2.I |
| `… --json` `--markdown` | le relevé exploitable, et les tables §2.E à §2.H |

`--verifier` porte quatre sous-contrôles, et il **énonce ce qu'il ne couvre pas**
à chaque exécution (RA-01) :

| # | Ce qu'il refuse | Ce qu'il lit |
|---|---|---|
| P-5.1 | une classe employée par `src/**` et absente des 41 maquettes | les `class` des composants, littéraux d'expression compris |
| P-5.2 | une classe propre à une vue employée par une **autre** vue, ou en dur dans un fichier partagé | idem, croisé au relevé |
| P-5.3 | un transverse absent du §2 · une entrée du §2 absente du gel ou sans emploi | le §2 de ce fichier, `code spans` compris, une famille notée `.prefixe*` valant pour ses membres |
| P-5.4 | une colonne « En situation » que le relevé dément | la dernière cellule de chaque ligne de tableau du §2 |

**Ce qu'il ne couvre pas** : le sens inverse de P-5.2 — une variante documentée
et non implémentée — suppose une vue achevée, et 36 vues restent à écrire ; et
une classe posée par une expression Svelte non littérale échapperait au relevé de
`src/**` (aucune n'existe aujourd'hui).

### 2.A Les familles du socle

#### A-1 · Base et accessibilité

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.saut-contenu` | — | `:focus` (sort de l'écran) | `socle.css:140`, `:146` | Les 38 vues portant une coquille ou un contenu principal |
| `.hors-ecran` | — | — | `socle.css:148` | V-17 et partout où un libellé n'est destiné qu'aux lecteurs d'écran |
| `:focus-visible` | — | — | `socle.css:132` | Global — contour `2px` accent, décalage `2px`, rayon `--r-1` |
| `[hidden]` | — | — | `socle.css:115` | Global — prime sur flex et grid |

**Emploi** : le lien d'évitement est le **premier** nœud du `body`, avant la
coquille. Le contour de focus n'est jamais supprimé : il conditionne l'usage au
clavier (brief §3.8, V-41 famille « Boutons » / États).

#### A-2 · Étiquette mono

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.etiq` | — | — | `socle.css:156` | Les 39 vues — c'est le composant le plus employé après `.btn` |

**Emploi** : le label d'instrument. Mono, 11 px, capitales, interlettrage
`.09em`, encre tertiaire. Il **nomme une zone**, il ne décrit pas : « Relations »,
« bash », « Registre ». Jamais de phrase.

#### A-3 · Témoin de fraîcheur

Traité au §3, en détail. Classes : `.temoin`, `.temoin__jauge`, `.temoin__txt`,
`.temoin--frais`, `.temoin--vieil`, `.temoin--obs`, `i.plein`.
Règles : `socle.css:170` à `:205`.

#### A-4 · Boutons

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.btn` | base (secondaire) | `:hover`, `:active`, `:focus-visible`, `[disabled]`, `[data-attente="oui"]` | `socle.css:210`, `:223`, `:224` | Les 40 vues |
| `.btn--principal` | modificateur | `:hover` | `socle.css:226`, `:229` | Une seule par écran |
| `.btn--discret` | modificateur | `:hover` | `socle.css:231`, `:235` | Barres denses, actions d'appoint |
| `.btn--destructif` | modificateur | `:hover` | `socle.css:237`, `:238` | Toujours détaché des actions neutres |
| `.btn--plein` | modificateur de largeur | — | `socle.css:240` | Colonnes étroites |
| `.btn--menu` | modificateur de largeur | `:hover` | `socle.css:241`, `:242` | Entrées de menu déroulant |
| `.btn svg` | pictogramme | — | `socle.css:244` | Le pictogramme **précède** le libellé |
| `.rouet` | attente | animation `tourne` | `V-41:467` | Bouton en attente ; **absent de `socle.css`** |

**Règles d'emploi** (V-41, famille « Boutons ») :

- Une seule action principale par écran. **Jamais deux boutons pleins côte à côte.**
- Le pictogramme précède toujours le libellé et ne le remplace jamais, sauf dans
  une barre d'outils où l'infobulle prend le relais.
- Un bouton **désactivé doit être rare** : préférer masquer une action interdite
  (`.si-ecriture`, `.si-admin`) plutôt que la montrer inaccessible — ADR-011.
- En attente : `[data-attente="oui"]` verrouille le pointeur et réduit l'opacité
  à `.82` ; **le libellé reste lisible**.

#### A-5 · Pastilles et marqueurs

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.past` | base | — | `socle.css:249` | V-03, V-14, V-15, V-37 et les listes |
| `.past--type` | type de note / de fiche | — | `socle.css:259` | V-02, V-03, V-04, V-12, V-14, V-15, V-18, V-19, V-20, V-25, V-26, V-31, V-37, V-41 |
| `.past--brouillon` | statut brouillon | — | `socle.css:263` | V-02, V-04, V-12, V-13, V-26, V-41 |
| `.past--etiquette` | étiquette | `:hover` | `socle.css:267`, `:271`, `:272` | V-12, V-14, V-15, V-18, V-22, V-37, V-41 — croisillon en `::before` |
| pastille de domaine | puce colorée + nom | — | V-41 famille « Pastilles » | Teinte d'identification du domaine |
| pastille de filtre actif | + bouton de retrait | — | V-41 famille « Pastilles » | V-08, V-12 |

**Règles d'emploi** : *elles ne portent jamais d'action, sauf le filtre actif,
dont la croix est explicite* (V-41). Le brouillon est **hachuré** comme
l'obsolète : ce n'est pas encore publiable.

#### A-6 · Panneau

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.panneau` | — | — | `socle.css:277` | V-07, V-10, V-11, V-14, V-17, V-25, V-37 |
| `.panneau__tete` | — | — | `socle.css:283` | En-tête étiqueté (`.etiq`) + compteur |
| `.panneau__corps` | — | — | `socle.css:289` | — |
| `.panneau__corps--serre` | densité | — | `socle.css:290` | Listes internes |

**Emploi** : un regroupement thématique dans une page. **Ne jamais imbriquer
deux conteneurs du même type** : deux cadres emboîtés ne hiérarchisent rien
(V-41, famille « Conteneurs »).

#### A-7 · États de zone

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.esquisse` | — | animation `glisse` (1,4 s, infinie) | `socle.css:295`, `@keyframes:301` | V-01, V-02, V-08, V-14 |
| `.zone-etat` | — | — | `socle.css:303` | V-14 et toutes les zones vides |
| `.zone-etat__titre` | — | — | `socle.css:304` | — |
| `.zone-etat__txt` | — | — | `socle.css:305` | — |
| `.sq`, `.sq--fort`, `.sq-l`, `.sq-l--titre`, `.sq-pile` | primitives d'esquisse | — | `V-41:1060`–`1073` | V-39 (planche des états) |
| `.sq-carte`, `.sq-liste`, `.sq-ligne`, `.sq-panneau`, `.sq-bord`, `.sq-mesure`, `.sq-graphe`, `.sq-noeud`, `.sq-arete`, `.sq-arbre`, `.sq-branche` | esquisses typées | — | `V-41:1076`–`1113` | V-39 |

**Les quatre états de toute zone de contenu** (brief §3.2) :

| État | Composant | Règle d'emploi |
|---|---|---|
| **Chargement** | esquisse typée (`.sq-*`) | Une esquisse **de la structure qui arrive**, jamais un rouet universel |
| **Vide** | `.zone-etat` — **c'est elle qui fait loi**, §2.D-1 | Titre qui nomme la situation, phrase qui explique, action qui en sort. « Il n'y a rien » et « vos filtres ne renvoient rien » **ne se confondent jamais** |
| **Erreur** | bloc d'erreur local (V-41, famille « Retours ») | La panne d'un panneau ne condamne pas l'écran. Dire ce qui continue de fonctionner, proposer de réessayer |
| **Sans droit** | l'action n'est pas rendue (`.si-ecriture`, `.si-admin`) | Pas de composant : l'élément est absent du DOM |

**Une seconde famille existe dans le corpus, et elle n'est pas celle-ci.** V-08
et V-39 emploient `.vide`, `.vide__titre`, `.vide__txt` — et V-39, la planche des
états, **n'emploie pas `.zone-etat`**. Les deux vues n'en donnent pas la même
définition, ce qui interdit d'y voir un composant commun. La contradiction est
tranchée au **§2.D-1** : `.zone-etat` fait loi, `.vide` reste au gel de ses deux
vues et ne se factorise pas.

#### A-8 · Notifications

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.notifs` | conteneur fixe, bas-droite | — | `socle.css:310` / **`V-41:322`** | Les 40 vues |
| `.notif` | base | `[data-sortie="oui"]`, animations `monte` / `descend` | `socle.css:314` / **`V-41:330`** | — |
| `.notif--succes` | succès | — | `socle.css:323` / `V-41:370` | S'efface seule |
| `.notif--erreur` | erreur | — | **`V-41:372`** | **Persiste** et propose une issue |
| `.notif--info` | information | — | **`V-41:374`** | Refermable |
| `.notif--encours` | suivi d'opération | `.notif__progres` | **`V-41:376`** | Montre son avancement, puis dit ce qu'elle a produit |
| `.notif__marque` | glyphe de type | — | **`V-41:348`** | Le type se lit par le glyphe **et** le filet |
| `.notif__corps`, `.notif__titre`, `.notif__detail` | structure | — | **`V-41:349`–`351`** | — |
| `.notif__actions` | actions attenantes | `:hover` | **`V-41:355`** | « Réessayer » sur une erreur |
| `.notif__fermer` | fermeture individuelle | `:hover` | **`V-41:363`** | — |
| `.notif__progres`, `.notif__progres i` | barre d'avancement | — | **`V-41:381`, `:385`** | — |
| `.notif__rouet` | rouet d'attente | animation `tourne-notif` | **`V-41:387`** | — |

**Tout ce qui est en gras n'existe pas dans `mockups/socle.css`** : ce fichier ne
connaît que `.notifs`, `.notif` et `.notif--succes` (§0.2).

**Règles d'emploi** (socle en ligne, section 9) : elles **ne bloquent jamais**,
s'empilent, se referment individuellement, et n'occultent ni l'action en cours
ni un champ de saisie — d'où l'ancrage en bas à droite. Le type se lit par le
glyphe et le filet, **jamais par la couleur seule** (RG-M18-09). Sur ≤ 640 px,
la pile occupe toute la largeur.

#### A-9 · Champs de saisie — **absents de `mockups/socle.css`**

| Classe | Variantes | États | Règle | En situation |
|---|---|---|---|---|
| `.champ` | — | `[data-etat="erreur"]` | `V-41:411` | V-05, V-06, V-13, V-17, V-23 à V-33, V-38, V-40 |
| `.champ__label` | + `.oblig` | — | `V-41:412`, `:415` | Toujours **au-dessus** du champ |
| `.champ__aide` | — | — | `V-41:416` | Sous le champ |
| `.champ__erreur` | — | — | `V-41:435` | **Remplace** l'aide |
| `.saisie` | `input`, `textarea` — **pas `select`**, §2.D-3 | `:hover`, `:focus`, `:disabled`, `::placeholder` | `V-41:418`–`430` | 17 vues |
| `.selecteur` | `select` | `:hover`, `:focus`, `:disabled` | `V-17:1009` | V-17, V-23, V-24, V-27, V-28, V-29, V-30, V-31, V-32, V-33, V-36, V-40 — définitions divergentes, §2.H |
| `.champ__boite`, `.champ__action` | champ à action attenante | `:hover` | `V-41:441`, `:443` | Révéler un mot de passe (V-05), vider une saisie |
| `.case`, `.case__txt`, `.case__aide` | case à cocher | — | `V-41:451`–`457` | V-05, V-24, V-30, V-31, V-32 |
| `.avis-saisie` | avertissement non bloquant | — | `V-41:460` | V-05, V-06 (§2.D-4) |
| `.interrupteur`, `.interrupteur__piste` | interrupteur | `:checked`, `:focus` | `V-41:1627`–`1633` | V-17, V-25 |
| `.etq-boite`, `.etq`, `.etq-suggestions`, `.etq-sug`, `.etq-sug__n`, `.etq-sug__neuf` | saisie d'étiquettes | `[data-ouvert="oui"]` | `V-41:1250`–`1284` | V-17, V-23, V-41 |
| `.dossier-choix-b`, `.dc-b` | sélecteur arborescent | — | `V-41:1635`–`1643` | **V-41 seulement** — la variante `.arbre-choix` ailleurs (§2.E) |

**Règles d'emploi** (V-41, famille « Champs de saisie ») :

- **Toujours une étiquette au-dessus, jamais dans le champ** : une étiquette
  flottante disparaît au moment précis où l'on en aurait besoin.
- L'aide est sous le champ ; **l'erreur remplace l'aide**.
- L'erreur est **toujours accompagnée de son motif**, jamais d'un simple contour
  rouge. Le message dit ce qui ne va pas **et** ce qu'il faut faire.
- La **case** pour un choix qui sera validé avec le formulaire ; l'**interrupteur**
  pour un réglage qui prend effet immédiatement. *Les confondre trompe sur le
  moment où l'action se produit.*
- Le **sélecteur** quand les valeurs possibles sont connues, fermées et peu
  nombreuses ; le **sélecteur arborescent** pour choisir un dossier, parce que la
  hiérarchie doit rester lisible pendant le choix.

#### A-10 · Droits

| Sélecteur | Rôle | Règle | En situation |
|---|---|---|---|
| `.app[data-droits="lecture"] .si-ecriture` | Masque tout ce qui écrit | `socle.css:331` | Les 35 vues à coquille |
| `.app:not([data-role="admin"]) .si-admin` | Masque la console | **`V-41:404`** — absent de `socle.css` | idem |

**Emploi** : *une action qu'un utilisateur n'a pas le droit d'exécuter n'est pas
affichée : ni grisée, ni refusée après le clic* (ADR-011, RG-M05-08, brief §3.5).
Ces deux sélecteurs sont le mécanisme, et ils sont en `!important` : ils priment
sur toute mise en page.

### 2.B Les familles de la planche V-41

Les onze familles que la planche démontre, dans l'ordre où elle les présente.
La phrase en italique est la **règle d'emploi telle qu'elle est écrite dans la
planche** — elle n'est pas reformulée ici.

#### B-1 · Signal de fraîcheur → §3

Composants : témoin trois niveaux, témoin avec date, barre de répartition
(`.repart`, `.legende` — `V-41:1032`, `:1043`, en situation V-07, V-10, V-11,
V-33, V-34).
*« Un seul constructeur les produit tous, dans toutes les vues. »*

#### B-2 · Boutons → A-4

#### B-3 · Champs de saisie → A-9

#### B-4 · Pastilles et marqueurs → A-5

#### B-5 · Conteneurs

| Composant | Classes | Règle | En situation |
|---|---|---|---|
| Carte de résultat | `.carte`, `.carte__haut`, `.carte__titre`, `.carte__extrait`, `.carte__signal`, `.carte__revision`, `.carte__pied`, `.carte__chemin`, `.carte--publique`, `[data-sel="oui"]` | `V-41:954`–`1019` | V-02, V-04, V-26, V-41 — la recherche connectée rend ses résultats en `.pres` |
| Marqueurs de carte | `.marque-op`, `.marque-signet` | `V-41:1004`, `:1011` | V-02, V-04, V-26, V-41 |
| Panneau | `.panneau*` | `socle.css:277` | → A-6 |
| Encart | `.encart-b` | `V-41:1613` | **V-41 seulement** — le produit a quatre familles de bandeau, §2.D-4 |
| Panneau latéral | `.tiroir-form*` | Style local des vues console | V-27, V-28, V-29, V-30, V-31, V-32 |

*« Quatre niveaux de mise en boîte, du plus au moins engageant. Ne jamais en
imbriquer deux du même type. »* — La carte porte **toujours** le témoin de
fraîcheur et le chemin de rangement. L'encart a un filet latéral, **jamais de
fond coloré vif** : un encart n'est pas une alerte. Le panneau latéral est
préféré à la boîte de dialogue quand la saisie est longue.

#### B-6 · Navigation

| Composant | Classes | États | Règle | En situation |
|---|---|---|---|---|
| Fil d'Ariane | `.fil`, `.fil a`, `.fil span`, `.fil__courant` | — | `V-41:551`–`555`, `:1687`–`1689` | 34 vues |
| Onglets | `.onglets-d` | `[aria-selected]` | `V-41:1512` | **V-41 seulement** — deux autres vues ont chacune la leur (§2.D-2) |
| Arborescence | `.arbre`, `.noeud`, `.noeud__chevron`, `.noeud__nom`, `.noeud--courant`, `.noeud__rouet`, `[data-ouvert]` | ouvert / fermé / courant / en chargement | `V-41:513`–`535`, `:606` | 27 vues, rail compris |
| Pagination | `.pagination`, `.pagination__saut` | `[aria-current="page"]` | `V-41:1521`–`1531` | **V-41 seulement** — voir §6.3 |

*« Dire où l'on est avant de dire où aller. »*
Fil d'Ariane : **le dernier segment n'est jamais cliquable** — c'est la page
courante, et l'offrir au clic est une promesse vide.
Onglets : pour des **vues alternatives d'un même objet**. Jamais pour des objets
différents : ce serait de la navigation déguisée.
Arborescence : **le chevron déplie, le nom navigue. Deux cibles distinctes,
toujours.**
Pagination : au-delà de cinquante éléments ; elle indique **toujours la page
courante et le total**.

#### B-7 · Restitution de données

| Composant | Classes | États | Règle | En situation |
|---|---|---|---|---|
| Tableau triable | `.tableau-tri`, `.tableau-tri th button`, `td.n` | `[aria-sort]` | `V-41:1533`–`1548` | **V-41 seulement** (V-34 emploie `.tg`, voir §6.3) |
| Boîte de tableau | `.tableau-boite` | défilement horizontal contenu | `V-41:892`, `:1679` | V-03, V-14, V-15, V-17, V-18, V-37 |
| Indicateur chiffré | `.indicateur`, `.indicateur__val`, `.indicateur__nom` | — | `V-41:1562`–`1564` | **V-41 seulement** — trois formes concurrentes, tranchées au §2.D-2 |
| Tendance | `.tendance-c` | `[data-sens="hausse"|"baisse"|"stable"]` | `V-41:1565`–`1568` | **V-41 seulement** — `.tendance` ailleurs (§2.E) |
| Chronologie | `.chrono`, `.chrono__txt`, `.chrono__quand` | `[data-marque="fait"]` | `V-41:1550`–`1560` | V-14 |
| Barre de répartition | `.repart`, `.p-frais`, `.p-vieil`, `.p-obs`, `.legende` | parts cliquables | `V-41:1032`–`1049` | V-07, V-10, V-11, V-33, V-34 |

*« Un chiffre seul ne décide de rien. »* La **tendance est indispensable** :
*« 1 240 consultations ne veut rien dire, "1 240, en hausse de 12 %" veut dire
quelque chose. Une tendance stable se dit aussi. »* L'en-tête trié porte
`aria-sort` **et** une flèche : sans elle, on ne sait pas ce qui a été trié.

#### B-8 · Superpositions

| Composant | Classes | États | Règle | En situation |
|---|---|---|---|---|
| Boîte de dialogue | `.dlg`, `.dlg__boite`, `.dlg__tete`, `.dlg__marque`, `.dlg__titre`, `.dlg__fermer`, `.dlg__corps`, `.dlg__texte`, `.dlg__pied`, `.dlg--large`, `.dlg--destructif`, `.dlg__pied--reparti` | `[open]`, animation `dlg-entre` | `V-41:1125`–`1183` | V-13, V-15, V-17, V-18, V-22, V-23, V-27 à V-32, V-35, V-40 |
| Décompte de destruction | `.decompte`, `.decompte__titre`, `.decompte__note` | — | `V-41:1188`–`1201` | V-13, V-18, V-28, V-40 |
| Confirmation par saisie | `.confirmation__cible` | bouton inactif tant que la saisie diffère | `V-41:1204` | V-13, V-28, V-40 |
| Sélecteur arborescent de destination | `.arbre-choix`, `.choix`, `.choix__nom`, `.choix__motif`, `[data-refuse="oui"]` | refusé | `V-41:1212`–`1232` | V-13, V-40 |
| Palette de recherche rapide | `.palette`, `.palette__boite`, `.palette__champ`, `.palette__saisie`, `.palette__effacer`, `.palette__curseur`, `.palette__degrade`, `.palette__liste`, `.palette__groupe`, `.palette__etat`, `.palette__requete`, `.palette__pied`, `.palette__aides`, `.palette__compteur`, `.palette__tous`, `.palette__fermer`, `.palette-hote` | `[open]`, `[data-curseur]`, `[data-degrade]` | `V-41:1296`–`1436` | V-09 et 29 vues |
| Ligne de présentation | `.pres`, `.pres__glyphe`, `.pres__corps`, `.pres__titre`, `.pres__sous`, `.pres__entree` | `[data-sel="oui"]` | `V-41:1370`–`1410` | Résultats de palette, 31 vues |
| Menu contextuel | `.menu-ctx`, `.menu-ctx__sep`, `.menu-ctx__raccourci`, `button.destructif` | — | `V-41:1596`–`1611` | **V-41 seulement** — les listes emploient `.fac-menu*` (§2.E) |
| Menu de barre | `.menu-barre`, `.menu-barre__liste`, `.menu-barre__entete`, `.menu-barre__sep` | `[data-ouvert="oui"]` | `V-41:579`–`603` | V-37 et les vues à coquille |
| Infobulle | `.infobulle`, `.infobulle-h` | `:hover`, `:focus` | `V-41:1581`–`1594` | **V-41 seulement** — aucune autre vue n'en porte |
| Agrandissement d'image | `.loupe`, `.loupe__boite`, `.loupe__pied` | `[open]` | `V-41:929`–`936` | V-03, V-14 — cinq autres vues la déclarent sans l'employer |

*« Ce qui exige une décision avant de continuer est une boîte de dialogue ; tout
le reste doit pouvoir être ignoré. »*
Boîte de dialogue : **piège le focus, se ferme à Échap, rend le focus à son
déclencheur** (brief §3.8). Toute action irréversible est confirmée avec le
**volume chiffré** de ce qui sera détruit ; la suppression d'un dossier ou d'un
domaine exige en outre la saisie du nom exact (brief §3.6).
Menu contextuel : **l'action destructive y est séparée par un filet et colorée**
— c'est le seul endroit où elle voisine des actions neutres.
Infobulle : **jamais pour une information nécessaire**. Elle est inaccessible au
toucher et invisible à l'impression.

#### B-9 · Contenu rédigé

| Composant | Classes | Règle | En situation |
|---|---|---|---|
| Corps | `.prose` + `h2`…`h6`, `p`, `strong`, `em`, `u`, `s`, `mark`, `ul`, `ol`, `li`, `hr`, `code` | `V-41:767`–`845` | V-03, V-14, V-15, V-17, V-18, V-31, V-37 |
| Liste de tâches | `.taches` | `V-41:834`–`839` | idem |
| Citation | `.prose-cit` | style local `.prose` | idem |
| Bloc de code | `.bloc-code`, `.bloc-code__tete`, `.j-cmd`, `.j-arg`, `.j-str`, `.j-com`, `.j-mot` | `V-41:846`–`864` | idem |
| Alertes | `.alerte`, `.alerte__tete`, `.alerte__glyphe`, `.alerte--astuce`, `.alerte--attention`, `.alerte--danger` | `V-41:873`–`890` | idem |
| Tableau | `.tableau-boite`, `.prose table`, `td.num` | `V-41:892`–`897` | idem |
| Figure | `.figure`, `.figure__cadre`, `figcaption` | `V-41:899`–`909` | idem |
| Liens | `.lien-int`, `.lien-casse`, `.lien-ext` | `V-41:913`–`926` | idem |
| Numérotation de sections | `body[data-numerote]` + `.prose h2::before`, `.sommaire__num` | `V-41:938`–`943`, `:649` | V-14, V-17 |

*« La mesure du texte est bornée à 680 pixels ; seuls le code, les tableaux, les
figures et les alertes débordent, parce qu'ils se lisent en balayage et non en
ligne. »* Ce rendu est **identique dans l'éditeur (V-17) et en lecture (V-14) :
c'est le même fragment de style.** Les trois niveaux d'alerte portent un
**glyphe textuel en capitales** (`ASTUCE`, `ATTENTION`, `DANGER`) : la couleur ne
fait que répéter (RG-M18-09).

#### B-10 · Retours

Notifications → A-8. État vide, état de chargement, état d'erreur local → A-7.
*« Les planches complètes sont en V-38 et V-39. »*

#### B-11 · Identité

| Composant | Classes | Règle | En situation |
|---|---|---|---|
| Avatar | `.avatar` (barre), `.avatar-p` (contenu) | `V-41:571`, `:1571` | V-10, V-25, V-37 |
| Pile d'avatars | `.piles`, `.avatar-p--reste` | `V-41:1570`, `:1579` | **V-41 seulement** — la page d'univers empile par `.avatars` (§2.F) |
| Touche clavier | `.touche` (`<kbd>`) | `V-41:566` | 35 vues |

*« Un avatar n'est jamais seul quand le nom peut tenir à côté : deux initiales
ne suffisent pas à identifier un collègue. »* Au-delà de quatre contributeurs,
un compteur prend le relais. La touche clavier emploie **toujours la notation
réelle du clavier, jamais une paraphrase**.

### 2.C La coquille — composants de structure

Non listés par V-41 comme une famille, mais posés par V-37 et employés par les
35 vues à coquille.

| Composant | Classes | États | Règle | En situation |
|---|---|---|---|---|
| Coquille | `.app` | `[data-rail]`, `[data-droits]`, `[data-role]`, `[data-etat]` | `V-41:475`–`481` | 35 vues |
| Rail | `.rail`, `.rail__marque`, `.rail__nom`, `.rail__sceau`, `.rail__section`, `.rail__titre`, `.rail__lien`, `.rail__pied`, `.rail__vide` | `[aria-current="page"]`, `:hover`, vide | `V-41:483`–`536`, `:614` | 33 vues |
| Cadre | `.cadre` | — | `V-41:542` | — |
| Barre supérieure | `.barre`, `.recherche`, `.avatar` | collante | `V-41:543`–`578` | 34 vues |
| Article | `.article` | — | `V-41:632` | Vues de lecture |
| Sommaire de note | `.sommaire`, `.sommaire__liste`, `.sommaire__num` | `[aria-current="true"]` | `V-41:635`–`650` | V-03, V-14, V-15 |
| En-tête de note | `.entete`, `.entete__sur`, `.titre-note` | — | `V-41:653`–`655` | V-03, V-14, V-15 |
| Cartouche de contrôle | `.cartouche*`, `.tampon` | `[data-niveau]`, `.tamponne` | `V-41:663`–`723` | V-03, V-14, V-15, V-37 → §3 |
| Métadonnées | `.meta`, `.chiffre` | — | `V-41:727`–`736` | V-03, V-14, V-15, V-17, V-37 — `.chiffre` aussi en V-11, V-25, V-34, V-41 |
| Sélecteur de registre | `.registre`, `.registre__pt`, `.invite-op` | `[aria-selected]` | `V-41:739`–`764` | V-03, V-14, V-15, V-37 |

### 2.D Les quatre contradictions, tranchées par le décompte

Quatre contradictions traînaient dans ce document, relevées par les lots et
jamais tranchées faute de relevé. Elles le sont ici, **par la préséance des
maquettes et par le nombre d'emplois réels**, jamais par goût. Chaque décompte
se reproduit : `node verif/inventaire-composants.mjs --classe=NOM`.

#### D-1 · `.zone-etat` contre `.vide` — l'état vide

C'est la contradiction que `ECART-015` désignait comme *« la première à
trancher »* : le §2 donne `.zone-etat` comme composant d'état vide, mais V-39 —
la vue qui définit les états vides — ne l'emploie pas.

| | `.zone-etat`, `.zone-etat__titre`, `.zone-etat__txt` | `.vide`, `.vide__titre`, `.vide__txt`, `.vide--sobre`, `.vide__actions` |
|---|---|---|
| Déclarée par | `mockups/socle.css:303`–`305`, **et le socle en ligne des 41 maquettes** | la feuille de **V-08** (`V-08:909`) et celle de **V-39** (`V-39:727`), et rien d'autre |
| Employée par | **5 vues** — V-07, V-10, V-14, V-29, V-34 ; la variante `__txt` seule : 10 vues | **2 vues** — V-08, V-39 |
| Définitions | **une seule**, identique dans les 41 fichiers | **deux, qui divergent** : bord `1px solid --c-trait` contre `1px dashed --c-trait-fort`, `--e-7 --e-5` contre `--e-5 --e-4`, titre `--t-t2` contre `--t-t3` |

**`.zone-etat` fait loi.** Elle est au socle — donc opposable aux 41 vues —, elle
est employée par cinq vues, et elle n'a **qu'une définition**. `.vide` en a deux,
qui ne décrivent pas le même objet : ce n'est pas un composant transverse, c'est
**un nom que deux vues emploient chacune pour le sien**.

**Ce que devient `.vide`.** Elle ne disparaît pas et ne se renomme pas : elle est
dans deux maquettes gelées. V-08 et V-39 se portent avec elle, chacune avec **sa**
définition, par P-6.3 — leur feuille est une copie à l'octet. Elle est
inventoriée au §2.E, marquée divergente au §2.H, et cela veut dire une chose
précise : **ne jamais la factoriser**, ni la promouvoir au socle, ni la donner en
exemple à une vue nouvelle. Une zone vide à écrire emploie `.zone-etat`.

**Le constat d'`ECART-015` reste vrai, et il est mesuré** : les trois occurrences
de `zone-etat` dans `mockups/V-39-etats.html` sont les trois déclarations du
socle ; **aucune n'est un emploi**. La planche des états ne démontre pas le
composant d'état vide du socle. Ce n'est pas un défaut à corriger — `mockups/`
est en lecture seule — mais un fait à connaître avant de porter V-39.

#### D-2 · Trois formes d'indicateur chiffré

| Forme | Trace | Ce qu'elle porte | Employée par |
|---|---|---|---|
| `.indicateur`, `.indicateur__val`, `.indicateur__nom` | `V-41:1562`–`1564` | la démonstration de la planche | **1 vue** — V-41 |
| `.mesure`, `.mesure__val`, `.mesure__nom`, `.mesure__sous` | `V-10:764`–`769` | le chiffre d'un panneau d'univers ou de domaine | **3 vues** — V-10, V-11, V-37 |
| `.mesure-a`, `.mesure-a__val`, `.nord` | `V-34:1062`–`1063`, `:960` | l'indicateur d'analytique et sa mesure phare | **1 vue** — V-34 |

**Aucune n'est canonique, et le décompte le dit sans ambiguïté.** La plus
employée est `.mesure`, à trois vues — mais ses trois vues **n'en donnent pas la
même définition** (§2.H), ce qui lui interdit précisément le rang de forme
commune. `.indicateur` est démontrée par la planche et employée par **aucune**
des quarante autres vues.

**Décision — elle confirme le §6.3, désormais chiffré : l'implémentation reprend
la classe de la vue à porter.** Aucune promotion, aucun renommage, aucune
factorisation. `.indicateur` reste au §2.B, marquée « V-41 seulement ».

**Le même motif se répète ailleurs, et il faut le lire comme un motif, pas comme
trois accidents** : les onglets sont `.onglets-d` en V-41, `.onglets` en V-25,
`.onglets-o` en V-34 — trois vues, trois noms, aucun partagé ; le tableau est
`.tableau-tri` en V-41 et `.tableau-gestion` / `.tg` dans sept vues de console ;
la pagination n'existe qu'en V-41. **La planche V-41 démontre 37
classes qu'aucune autre vue n'emploie** (`--liste=V-41`), et non quatre comme le
§6.3 le supposait.

#### D-3 · `.selecteur` contre `.saisie`

Le §2 A-9 range `select` sous `.saisie`. **Le relevé le dément.**

| | `.saisie` | `.selecteur` |
|---|---|---|
| Déclarée | socle en ligne, `V-07:418`–`430` — absente de `mockups/socle.css` (§0.2) | la feuille de 10 vues, à partir de `V-17:1009` |
| Employée | **17 vues** | **12 vues** — V-17, V-23, V-24, V-27, V-28, V-29, V-30, V-31, V-32, V-33, V-36, V-40 |
| Portée | `input`, `textarea` | `select` |
| Définitions | une | **cinq corps distincts** sur dix déclarations — `padding` de 7, 8 ou 9 px, taille `--t-base` ou `--t-petit` |

**Le fait qui tranche** : sur les 25 `<select>` que les 41 maquettes portent avec
une classe, **quinze portent `.selecteur`, dix portent `.nav2__selecteur`, et
aucun ne porte `.saisie`**. Réciproquement, aucun `input` ni `textarea` ne porte
`.selecteur`.

**`.selecteur` entre à l'inventaire comme composant transverse à part entière**
(§2.E), et la ligne `.saisie` du §2 A-9 est corrigée : elle couvre `input` et
`textarea`, pas `select`. La règle d'emploi de la planche — *« le sélecteur quand
les valeurs possibles sont connues, fermées et peu nombreuses »* — vaut toujours ;
c'est la classe qui était fausse, pas la règle. Ses définitions divergentes
(§2.H) interdisent ici encore de la factoriser : chaque vue porte la sienne.

#### D-4 · `.contexte*`, quatrième famille d'encart

Le §2 B-5 donne quatre niveaux de mise en boîte et cite `.encart-b` comme
l'encart. Le relevé donne cinq familles de bandeau ou d'encart, et `.encart-b`
n'est pas la plus employée — c'est la moins employée de toutes.

| Famille | Trace | Ce qu'elle dit | Employée par |
|---|---|---|---|
| `.alerte`, `.alerte__tete`, `.alerte__glyphe`, `.alerte--astuce`, `.alerte--attention`, `.alerte--danger` | `V-03:707`–`722` | un avertissement **dans un corps rédigé** | **8 vues** — V-03, V-14, V-15, V-17, V-18, V-31, V-37, V-41 |
| `.contexte`, `.contexte__marque`, `.contexte__titre`, `.contexte--succes`, `.contexte--info`, `.contexte--attente`, `.contexte--erreur`, `.contexte__compte` | `V-05:476`–`497` | l'**état de la situation** en tête d'écran ou de dialogue | **6 vues** — V-05, V-06, V-15, V-31, V-32, V-40 |
| `.avis`, `.avis__titre`, `.avis__corps`, `.avis__actions`, `.avis__fermer`, `.avis--doublon`, `.avis--erreur`, `.avis--info`, `.avis--resync` | `V-17:982`–`994` | un avis **d'éditeur**, refermable | **2 vues** — V-17, V-18 |
| `.avis-saisie` | `V-07:460` (socle en ligne) | un avertissement **non bloquant sous un champ** | **2 vues** — V-05, V-06 |
| `.encart-b` | `V-41:1613` | la démonstration de l'encart | **1 vue** — V-41 |

**`.contexte*` entre à l'inventaire comme quatrième famille**, et elle y entre
par son décompte : six vues, une seule définition, aucune divergence. `.encart-b`
reste ce qu'elle est — une démonstration de planche — et le §2 B-5 ne peut pas la
présenter comme l'encart du produit.

**Un piège mesuré, à connaître avant de porter** : `.contexte` est **employée par
six vues et déclarée par deux** (V-05 et V-06). V-15, V-31, V-32 et V-40 la
posent sans qu'aucune de leurs feuilles ne la définisse : dans ces quatre vues,
le nœud **rend sans style**, et c'est le gel qui le veut. Le porter fidèlement,
c'est porter la classe sans chercher la règle manquante. Il y a **92 emplois
orphelins** de cette sorte dans le corpus (§2.I).

### 2.E Le complément — les composants transverses relevés des 41 maquettes

**239 classes, 124 familles.** Ce sont les composants transverses que les §2.A à
§2.C ne portaient pas : ils viennent des 39 maquettes qui n'avaient jamais été
dépouillées. Chacune est tracée à la ligne du fichier qui la **déclare** —
`socle.css:NNN` quand le fichier gelé la porte, `V-07:NNN` quand elle n'existe
que dans le socle en ligne (§0.2), `V-xx:NNN` quand c'est la feuille d'une vue
qui la définit, la première dans l'ordre des numéros.

La colonne « Employée par » donne le décompte réel, tous chemins confondus
(§2.0). La mention **divergente** renvoie au §2.H : le nom est partagé, la
définition ne l'est pas — **une telle classe ne se factorise jamais**, elle se
porte vue par vue depuis le gel.

Cette table est **dérivée**, pas rédigée : `node
verif/inventaire-composants.mjs --markdown` la réémet, et `--verifier` refuse
qu'elle et le gel divergent.

| Classe | Trace | Employée par |
|---|---|---|
| `.ac__n` | `V-40:868` | 2 — V-40, V-41 |
| `.actifs` | `V-02:609` | 4 — V-02, V-08, V-12, V-22 |
| `.actifs__vider` | `V-02:624` | 4 — V-02, V-08, V-12, V-22 |
| `.adresse-demandee` | `V-04:638` | 2 — V-04, V-26 |
| `.aide` | `V-07:689` | 2 — V-07, V-30 |
| `.amorce` | `V-07:859` | 2 — V-07, V-11 · **divergente** |
| `.amorce__actions` | `V-07:871` | 2 — V-07, V-11 |
| `.apercu-bandeau` | `V-17:1121` | 2 — V-17, V-18 |
| `.arete` | `V-19:829` | 2 — V-19, V-20 · **divergente** |
| `.auth` | `V-05:415` | 2 — V-05, V-06 |
| `.auth__boite` | `V-05:439` | 2 — V-05, V-06 |
| `.auth__colonne` | `V-05:421` | 2 — V-05, V-06 |
| `.auth__form` | `V-05:453` | 2 — V-05, V-06 |
| `.auth__lien` | `V-05:461` | 2 — V-05, V-06 |
| `.auth__ligne` | `V-05:457` | 2 — V-05, V-06 |
| `.auth__marque` | `V-05:424` | 2 — V-05, V-06 |
| `.auth__nom` | `V-05:434` | 2 — V-05, V-06 |
| `.auth__pied` | `V-05:467` | 2 — V-05, V-06 |
| `.auth__sceau` | `V-05:428` | 2 — V-05, V-06 |
| `.auth__sous` | `V-05:450` | 2 — V-05, V-06 |
| `.auth__titre` | `V-05:446` | 2 — V-05, V-06 |
| `.avis` | `V-17:982` | 2 — V-17, V-18 |
| `.avis__actions` | `V-17:990` | 2 — V-17, V-18 |
| `.avis__corps` | `V-17:988` | 2 — V-17, V-18 |
| `.avis__titre` | `V-17:989` | 2 — V-17, V-18 |
| `.avis--doublon` | `V-17:991` | 2 — V-17, V-18 |
| `.avis--erreur` | `V-17:992` | 2 — V-17, V-18 |
| `.avis--info` | `V-17:993` | 2 — V-17, V-18 |
| `.bandeau` | `V-14:961` | 3 — V-14, V-15, V-37 |
| `.bandeau__corps` | `V-14:973` | 3 — V-14, V-15, V-37 |
| `.bandeau__marque` | `V-14:968` | 3 — V-14, V-15, V-37 |
| `.bandeau__note` | `V-14:975` | 3 — V-14, V-15, V-37 |
| `.bandeau__titre` | `V-14:974` | 3 — V-14, V-15, V-37 |
| `.bandeau--brouillon` | `V-14:982` | 3 — V-14, V-15, V-37 |
| `.bandeau--resync` | `V-14:984` | 3 — V-14, V-15, V-37 |
| `.bandeau--revision` | `V-14:980` | 3 — V-14, V-15, V-37 |
| `.bandeaux` | `V-14:959` | 3 — V-14, V-15, V-37 |
| `.barre-etat` | `V-17:1098` | 2 — V-17, V-18 |
| `.barre-etat__actions` | `V-17:1116` | 2 — V-17, V-18 |
| `.barre-outils` | `V-12:824` | 2 — V-12, V-22 |
| `.barre-progres` | `V-24:995` | 2 — V-24, V-36 · **divergente** |
| `.bascule-vue` | `V-19:706` | 2 — V-19, V-20 |
| `.bilan` | `V-16:736` | 2 — V-16, V-24 · **divergente** |
| `.bloc` | `V-13:923` | 2 — V-13, V-25 · **divergente** |
| `.bouton-facettes` | `V-02:631` | 2 — V-02, V-08 |
| `.bouton-meta` | `V-17:1154` | 2 — V-17, V-18 |
| `.btn--verifier` | `V-03:537` | 3 — V-14, V-15, V-37 |
| `.btn-copier` | — *crochet de script, aucune règle* | 5 — V-14, V-15, V-17, V-18, V-37 |
| `.carte__visibilite` | `V-02:540` | 4 — V-02, V-04, V-26, V-41 |
| `.carto` | `V-19:687` | 2 — V-19, V-20 |
| `.champ-public` | `V-01:388` | 3 — V-01, V-02, V-04 · **divergente** |
| `.champ-public__effacer` | `V-01:406` | 3 — V-01, V-02, V-04 |
| `.chapeau` | `V-01:353` | 4 — V-01, V-02, V-03, V-04 |
| `.colonne` | `V-07:774` | 2 — V-07, V-11 |
| `.colonne-redaction` | `V-17:852` | 2 — V-17, V-18 · **divergente** |
| `.commandes` | `V-17:937` | 2 — V-17, V-18 |
| `.compte-filtres` | `V-02:632` | 3 — V-02, V-08, V-12 |
| `.compteur` | `V-02:606` | 2 — V-02, V-08 |
| `.console` | `V-27:733` | 11 — 11 vues |
| `.contexte` | `V-05:476` | 6 — 6 vues |
| `.contexte__marque` | `V-05:483` | 6 — 6 vues |
| `.contexte__titre` | `V-05:488` | 6 — 6 vues |
| `.contexte--attente` | `V-05:493` | 2 — V-05, V-06 |
| `.contexte--info` | `V-05:489` | 2 — V-05, V-06 |
| `.contexte--succes` | `V-05:495` | 5 — V-05, V-15, V-31, V-32, V-40 |
| `.controles` | `V-19:694` | 3 — V-19, V-20, V-21 |
| `.controles__groupe` | `V-19:700` | 2 — V-19, V-20 |
| `.corps-public` | `V-01:432` | 2 — V-01, V-02 · **divergente** |
| `.couleurs` | `V-27:880` | 2 — V-27, V-28 |
| `.crit` | `V-19:788` | 2 — V-19, V-20 |
| `.crit__boite` | `V-19:789` | 2 — V-19, V-20 |
| `.crit__boite--rupture` | `V-19:796` | 2 — V-19, V-20 |
| `.crit__nom` | `V-19:795` | 2 — V-19, V-20 |
| `.crit__val` | `V-19:794` | 2 — V-19, V-20 |
| `.degrade` | `V-08:820` | 2 — V-08, V-39 · **divergente** |
| `.depot` | `V-24:894` | 2 — V-24, V-35 · **divergente** |
| `.depot__ic` | `V-24:900` | 2 — V-24, V-35 · **divergente** |
| `.detail__section` | `V-19:785` | 2 — V-19, V-20 |
| `.detail__sous` | `V-19:784` | 2 — V-19, V-20 |
| `.detail__tete` | `V-19:779` | 2 — V-19, V-20 |
| `.detail__titre` | `V-19:780` | 2 — V-19, V-20 |
| `.detail__vide` | `V-19:777` | 2 — V-19, V-20 |
| `.detail-col` | `V-19:743` | 2 — V-19, V-20 · **divergente** |
| `.doc` | `V-38:625` | 3 — V-38, V-39, V-40 · **divergente** |
| `.doc__tete` | `V-38:627` | 3 — V-38, V-39, V-40 · **divergente** |
| `.domaine` | `V-11:716` | 2 — V-07, V-11 |
| `.editeur` | `V-17:845` | 2 — V-17, V-18 |
| `.esq-carte` | `V-02:641` | 2 — V-02, V-08 |
| `.esq-l` | `V-07:886` | 2 — V-07, V-14 · **divergente** |
| `.etape` | `V-06:550` | 2 — V-06, V-24 |
| `.etape__sous` | `V-24:853` | 2 — V-24, V-25 |
| `.fac-menu` | `V-12:766` | 2 — V-12, V-22 |
| `.fac-menu__bouton` | `V-12:767` | 2 — V-12, V-22 |
| `.fac-menu__n` | `V-12:780` | 2 — V-12, V-22 |
| `.fac-menu__panneau` | `V-12:785` | 2 — V-12, V-22 |
| `.facette` | `V-02:575` | 4 — V-02, V-08, V-12, V-22 |
| `.facette__corps` | `V-02:585` | 4 — V-02, V-08, V-12, V-22 |
| `.facette__tete` | `V-02:577` | 4 — V-02, V-08, V-12, V-22 |
| `.facettes` | `V-02:574` | 2 — V-02, V-08 · **divergente** |
| `.filtre` | `V-02:611` | 4 — V-02, V-08, V-12, V-22 |
| `.filtres-barre` | `V-12:765` | 2 — V-12, V-22 |
| `.flux` | `V-10:820` | 2 — V-10, V-25 |
| `.flux__quand` | `V-10:834` | 2 — V-10, V-25 |
| `.flux__txt` | `V-10:831` | 2 — V-10, V-25 |
| `.graphe` | `V-19:833` | 2 — V-19, V-20 |
| `.groupe` | `V-13:882` | 2 — V-13, V-33 |
| `.groupe__nom` | `V-13:888` | 2 — V-13, V-33 · **divergente** |
| `.groupe__tete` | `V-13:883` | 2 — V-13, V-33 · **divergente** |
| `.icones` | `V-27:890` | 2 — V-27, V-29 |
| `.introuvable` | `V-04:619` | 2 — V-04, V-26 · **divergente** |
| `.introuvable__txt` | `V-04:631` | 2 — V-04, V-26 · **divergente** |
| `.jalon` | `V-06:519` | 2 — V-06, V-24 |
| `.jalon__barre` | `V-06:524` | 2 — V-06, V-24 |
| `.jalon__nom` | `V-06:528` | 2 — V-06, V-24 · **divergente** |
| `.jalons` | `V-06:514` | 2 — V-06, V-24 · **divergente** |
| `.lecture` | `V-14:950` | 3 — V-14, V-15, V-37 · **divergente** |
| `.lg__forme` | `V-19:763` | 2 — V-19, V-20 |
| `.liste` | `V-12:853` | 2 — V-07, V-12 |
| `.marque` | `V-01:358` | 4 — V-01, V-02, V-03, V-04 · **divergente** |
| `.marque__nom` | `V-01:365` | 4 — V-01, V-02, V-03, V-04 |
| `.marque__sceau` | `V-01:359` | 4 — V-01, V-02, V-03, V-04 |
| `.menu-barre__liste--droite` | `V-07:587` | 8 — 8 vues |
| `.menu-barre__nom` | `V-07:602` | 8 — 8 vues |
| `.menu-barre__role` | `V-07:603` | 8 — 8 vues |
| `.menu-etendu` | `V-17:899` | 2 — V-17, V-18 |
| `.menu-etendu__liste` | `V-17:900` | 2 — V-17, V-18 |
| `.mesure` | `V-10:764` | 3 — V-10, V-11, V-37 · **divergente** |
| `.mesure__nom` | `V-10:768` | 3 — V-10, V-11, V-37 · **divergente** |
| `.mesure__sous` | `V-10:773` | 2 — V-10, V-11 · **divergente** |
| `.mesure__val` | `V-10:769` | 3 — V-10, V-11, V-37 · **divergente** |
| `.meta-panneau` | `V-17:1001` | 2 — V-17, V-18 |
| `.modes` | `V-08:715` | 2 — V-08, V-16 · **divergente** |
| `.module` | `V-11:783` | 2 — V-11, V-17 |
| `.module__corps` | `V-11:798` | 2 — V-11, V-17 |
| `.module__ic` | `V-11:792` | 2 — V-11, V-17 |
| `.module__nom` | `V-11:799` | 2 — V-11, V-17 |
| `.module__sous` | `V-11:804` | 2 — V-11, V-17 |
| `.n1` | — *crochet de script, aucune règle* | 5 — V-03, V-14, V-15, V-37, V-41 |
| `.n2` | `V-03:490` | 5 — V-03, V-14, V-15, V-37, V-41 |
| `.nav2` | `V-27:736` | 10 — 10 vues |
| `.nav2__groupe` | `V-27:748` | 10 — 10 vues |
| `.nav2__lien` | `V-27:750` | 10 — 10 vues |
| `.nav2__n` | `V-27:764` | 10 — 10 vues |
| `.nav2__nom` | `V-27:743` | 10 — 10 vues |
| `.nav2__nomlien` | `V-27:763` | 10 — 10 vues |
| `.nav2__selecteur` | `V-27:771` | 10 — 10 vues |
| `.nav2__sous` | `V-27:747` | 10 — 10 vues |
| `.nav2__tete` | `V-27:742` | 10 — 10 vues |
| `.nav2__titre` | `V-27:749` | 10 — 10 vues |
| `.noeud__code` | `V-19:818` | 2 — V-19, V-20 |
| `.noeud__forme` | `V-19:817` | 2 — V-19, V-20 |
| `.ob` | `V-17:883` | 3 — V-17, V-18, V-31 · **divergente** |
| `.ob--txt` | `V-17:892` | 3 — V-17, V-18, V-31 |
| `.on` | `V-06:575` | 3 — V-06, V-14, V-25 |
| `.outils-graphe` | `V-19:883` | 3 — V-19, V-20, V-21 |
| `.outils-red` | `V-17:869` | 3 — V-17, V-18, V-31 · **divergente** |
| `.oz` | `V-17:878` | 3 — V-17, V-18, V-31 · **divergente** |
| `.palette__aide` | `V-07:1082` | 30 — 30 vues |
| `.palette__droite` | `V-07:1083` | 30 — 30 vues |
| `.past--systeme` | `V-27:820` | 2 — V-27, V-32 |
| `.pied-public` | `V-01:525` | 4 — V-01, V-02, V-03, V-04 |
| `.pied-public__int` | `V-01:529` | 4 — V-01, V-02, V-03, V-04 |
| `.piste` | `V-02:442` | 4 — V-02, V-04, V-08, V-26 |
| `.pj` | `V-03:819` | 2 — V-03, V-14 · **divergente** |
| `.pj__ext` | `V-03:821` | 2 — V-03, V-14 |
| `.prop` | `V-19:811` | 2 — V-19, V-20 |
| `.prop__cle` | `V-19:813` | 2 — V-19, V-20 |
| `.public` | `V-01:347` | 6 — 6 vues |
| `.rang` | `V-27:828` | 2 — V-27, V-29 |
| `.rassurance` | `V-01:416` | 2 — V-01, V-31 · **divergente** |
| `.recherche__txt` | `V-07:926` | 34 — 34 vues |
| `.redaction` | `V-17:919` | 2 — V-17, V-18 |
| `.reformuler` | `V-02:441` | 3 — V-02, V-04, V-26 · **divergente** |
| `.refus` | `V-27:922` | 5 — V-27, V-29, V-30, V-31, V-32 |
| `.refus__sortie` | `V-27:931` | 5 — V-27, V-29, V-30, V-31, V-32 |
| `.refus__titre` | `V-27:927` | 5 — V-27, V-29, V-30, V-31, V-32 |
| `.reglages` | `V-02:600` | 2 — V-02, V-08 · **divergente** |
| `.regles` | `V-06:585` | 2 — V-06, V-25 · **divergente** |
| `.rel-groupe` | `V-14:1002` | 3 — V-14, V-19, V-20 |
| `.rel-groupe__titre` | `V-14:1003` | 3 — V-14, V-19, V-20 · **divergente** |
| `.rel-item` | `V-19:802` | 3 — V-19, V-20, V-40 · **divergente** |
| `.rel-item__nom` | `V-19:808` | 2 — V-19, V-20 |
| `.rel-item__type` | `V-19:809` | 2 — V-19, V-20 |
| `.repli` | `V-01:510` | 3 — V-01, V-02, V-03 |
| `.repli__titre` | `V-01:518` | 3 — V-01, V-02, V-03 |
| `.repli__txt` | `V-01:522` | 3 — V-01, V-02, V-03 |
| `.resultats` | `V-02:473` | 4 — V-02, V-04, V-08, V-26 · **divergente** |
| `.reviser` | `V-14:1031` | 3 — V-14, V-15, V-37 |
| `.reviser__pied` | `V-14:1040` | 3 — V-14, V-15, V-37 |
| `.robustesse` | `V-06:561` | 2 — V-06, V-25 |
| `.robustesse__note` | `V-06:572` | 2 — V-06, V-25 |
| `.robustesse__reste` | `V-06:573` | 2 — V-06, V-25 |
| `.robustesse__segments` | `V-06:562` | 2 — V-06, V-25 |
| `.robustesse__txt` | `V-06:568` | 2 — V-06, V-25 |
| `.rupture-anneau` | `V-19:842` | 2 — V-19, V-20 |
| `.rupture-fanion` | `V-19:843` | 2 — V-19, V-20 |
| `.rupture-glyphe` | `V-19:844` | 2 — V-19, V-20 |
| `.sauvegarde` | `V-17:1107` | 2 — V-17, V-18 |
| `.sauvegarde__pastille` | `V-17:1108` | 2 — V-17, V-18 |
| `.scene` | `V-19:741` | 3 — V-19, V-20, V-21 · **divergente** |
| `.section-titre` | `V-10:837` | 3 — V-10, V-11, V-13 · **divergente** |
| `.selecteur` | `V-17:1009` | 12 — 12 vues · **divergente** |
| `.sep` | `V-02:522` | 7 — 7 vues |
| `.si-apercu` | `V-17:1120` | 2 — V-17, V-18 |
| `.si-chargement` | `V-01:538` | 3 — V-01, V-02, V-08 |
| `.si-nominal` | `V-01:537` | 3 — V-01, V-02, V-08 |
| `.si-peuple` | `V-07:874` | 2 — V-07, V-11 |
| `.si-redaction` | `V-17:1119` | 2 — V-17, V-18 |
| `.si-vide` | `V-07:875` | 3 — V-07, V-11, V-34 |
| `.tableau-gestion` | `V-27:793` | 7 — 7 vues |
| `.tete` | `V-12:808` | 2 — V-12, V-22 |
| `.tete__compteur` | `V-12:820` | 2 — V-12, V-22 |
| `.tete__puce` | `V-12:815` | 2 — V-12, V-22 |
| `.tete__sur` | `V-12:814` | 2 — V-12, V-22 |
| `.tete-section` | `V-27:776` | 10 — 10 vues |
| `.tete-section__corps` | `V-27:782` | 10 — 10 vues |
| `.tg__actions` | `V-27:815` | 7 — 7 vues |
| `.tg__desc` | `V-27:810` | 6 — 6 vues |
| `.tg__n` | `V-27:814` | 7 — 7 vues |
| `.tg__nom` | `V-27:809` | 6 — 6 vues |
| `.tg__puce` | `V-27:817` | 2 — V-27, V-28 |
| `.tg--entetes` | `V-27:802` | 7 — 7 vues |
| `.tg--ligne` | `V-27:808` | 7 — 7 vues |
| `.tg--masquable` | `V-27:1098` | 7 — 7 vues |
| `.tg--reduit` | `V-28:1116` | 2 — V-28, V-32 |
| `.tire` | `V-19:752` | 2 — V-19, V-21 |
| `.travail` | `V-27:774` | 10 — 10 vues · **divergente** |
| `.tri` | `V-08:755` | 2 — V-08, V-12 · **divergente** |
| `.val` | `V-02:588` | 4 — V-02, V-08, V-12, V-22 · **divergente** |
| `.val__n` | `V-02:596` | 4 — V-02, V-08, V-12, V-22 |
| `.val__nom` | `V-02:595` | 4 — V-02, V-08, V-12, V-22 |
| `.vide` | `V-08:909` | 2 — V-08, V-39 · **divergente** |
| `.vide__titre` | `V-08:913` | 2 — V-08, V-39 · **divergente** |
| `.vide__txt` | `V-08:918` | 2 — V-08, V-39 · **divergente** |
| `.voile` | `V-19:848` | 3 — V-19, V-20, V-21 |
| `.voile__boite` | `V-19:854` | 3 — V-19, V-20, V-21 · **divergente** |
| `.zone-graphe` | `V-19:750` | 2 — V-19, V-20 · **divergente** |
| `.zone-vide` | `V-01:541` | 4 — V-01, V-02, V-04, V-26 |
| `.zone-vide__titre` | `V-01:546` | 4 — V-01, V-02, V-04, V-26 · **divergente** |

### 2.F Les classes propres à une vue

**790 classes, 361 familles, réparties sur les 41 vues.** Elles ne sont pas
nommées ici, et c'est une décision, pas un oubli : leur autorité est la maquette
gelée de leur vue, dont la feuille portée est une copie à l'octet (P-6.3).
Les recopier ici créerait une seconde source de vérité pour une source déjà
gelée — donc une occasion de divergence, et rien d'autre.

**Ce que « fermé » veut dire ici, et c'est opposable** : l'agent qui implémente
V-xx relève ses classes propres de `mockups/V-xx-*.html`, à la ligne, et
**n'en emploie aucune autre**. Une classe absente de sa maquette est une
invention, qu'elle ressemble ou non à ce que fait une autre vue. La liste
tracée d'une vue s'obtient par `node verif/inventaire-composants.mjs
--liste=V-xx` ; P-5.2 refuse qu'une vue emploie la classe propre d'une autre.

| Vue | Classes propres | Premières |
|---|---|---|
| V-01 | 23 | `.esq-guide` `.guide` `.guide__extrait` `.guide__pied` … |
| V-02 | 4 | `.barre-requete` `.barre-requete__int` `.champ-public--compact` `.grille-rech` |
| V-03 | 8 | `.aparte` `.cartouche--lecture` `.fil-pub` `.lecture-pub` … |
| V-04 | 6 | `.introuvable__aide` `.introuvable__champ` `.issues` `.rattrapage` … |
| V-05 | 2 | `.contexte__compte` `.contexte--erreur` |
| V-06 | 3 | `.etape--fin` `.fanion` `.rappel-id` |
| V-07 | 48 | `.aide__corps` `.aide__fermer` `.aide__marque` `.dom` … |
| V-08 | 9 | `.aide-mode` `.facettes__cadre` `.rech` `.requete` … |
| V-09 | 12 | `.cas` `.cas__hote` `.cas__nom` `.cas__num` … |
| V-10 | 19 | `.avatar-pile` `.avatars` `.carte-dom` `.carte-dom__desc` … |
| V-11 | 31 | `.contrib` `.contrib__av` `.contrib__barre` `.contrib__n` … |
| V-12 | 15 | `.bouton-filtres` `.densite` `.lc` `.lc__dossier` … |
| V-13 | 27 | `.actions-dossier` `.choix` `.choix__corps` `.choix__motif` … |
| V-14 | 10 | `.actions-liste` `.item` `.item__nom` `.item__sous` … |
| V-15 | 31 | `.a` `.ampleur` `.ampleur__barre` `.ampleur__moins` … |
| V-16 | 39 | `.alternative` `.alternative__corps` `.bilan__egal` `.bilan__moins` … |
| V-17 | 23 | `.avis__fermer` `.champ-titre` `.cmd` `.cmd__ic` … |
| V-18 | 17 | `.avis--resync` `.meta-figee` `.meta-figee__note` `.mf` … |
| V-19 | 15 | `.alt-texte` `.dense-bandeau` `.legende__bloc` `.legende__note` … |
| V-20 | 8 | `.fil-deroule` `.fil-deroule__courant` `.fil-deroule__sep` `.halo-centre` … |
| V-21 | 19 | `.bascule-affichage` `.branche` `.chevron` `.chevron__fond` … |
| V-22 | 16 | `.liste-signets` `.sig` `.sig__actions` `.sig__adresse` … |
| V-23 | 16 | `.apercu-adresse` `.apercu-adresse__chemin` `.apercu-adresse__hote` `.apercu-adresse__sceau` … |
| V-24 | 49 | `.al` `.al__fmt` `.al__ic` `.al__neuf` … |
| V-25 | 34 | `.attribue` `.attribue__cadenas` `.attribue__cle` `.attribue__val` … |
| V-26 | 11 | `.aide-rech` `.champ-rech` `.champ-rech__effacer` `.reprise` … |
| V-27 | 4 | `.apercu-nav` `.apercu-nav__ligne` `.apercu-nav__sceau` `.tg--univers` |
| V-28 | 13 | `.conserve` `.definitif` `.mod` `.mod__aide` … |
| V-29 | 20 | `.apercu-schema` `.as-aide` `.as-champ` `.as-faux` … |
| V-30 | 11 | `.apercu-phrases` `.choix-reaffectation` `.exemples` `.phrase` … |
| V-31 | 4 | `.past--defaut` `.redaction-tpl` `.structure-apercu` `.tg--templates` |
| V-32 | 10 | `.avatar-c` `.avert-unique` `.mdp-unique` `.mdp-unique__valeur` … |
| V-33 | 21 | `.apercu-vocabulaire` `.champ-nombre` `.champ-nombre__unite` `.comparaison` … |
| V-34 | 43 | `.adoption` `.alerte-dom` `.alertes-dom` `.bloc-a` … |
| V-35 | 17 | `.lancement` `.n-echec` `.n-nul` `.rapport-lot` … |
| V-36 | 21 | `.arbo-archive` `.ca` `.ca__ic` `.ca__nom` … |
| V-37 | 9 | `.bord` `.bord__grille` `.bord__salut` `.bord__sous` … |
| V-38 | 13 | `.epreuve` `.epreuve__barre` `.epreuve__corps` `.regle-c` … |
| V-39 | 40 | `.bandeau-reseau` `.bandeau-reseau__detail` `.bandeau-reseau__pastille` `.chapitre` … |
| V-40 | 32 | `.ac` `.ac--interdit` `.catalogue` `.dr` … |
| V-41 | 37 | `.avatar-p` `.avatar-p--reste` `.biblio` `.chrono__quand` … |

### 2.G Les blocs hors produit

Cinq classes, deux blocs. Les maquettes les déclarent elles-mêmes hors produit —
V-37 écrit de sa section de règles : *« Ce bloc n'appartient pas au produit »* —
et le banc les retire du DOM avant toute mesure, sur les deux niveaux
(`verif/banc/conditions.mjs`, `BLOCS_HORS_PRODUIT` ; `ECART-011` É-5).

**Elles ne se portent jamais.** Les porter serait porter le contrôle de maquette
dans le produit, et P-5.1 le refuse nommément.

| Classe | Trace | Bloc | Vues |
|---|---|---|---|
| `.planche` | `V-01:556` | `.planche` | 37 |
| `.planche__sep` | `V-01:570` | `.planche` | 33 |
| `.regles__liste` | `V-37:1122` | `section.regles` | 1 |
| `.regles__sous` | `V-37:1121` | `section.regles` | 1 |
| `.regles__titre` | `V-37:1117` | `section.regles` | 1 |

La classe `regles` **ne figure pas** dans cette table, et c'est volontaire : le
`ul.regles` de V-06 et V-25 — la liste des exigences d'un mot de passe — est du
produit. Seule la `section.regles` de V-37 est hors produit. Le relevé distingue
les deux par leur balise et leur sous-arbre, pas par leur nom.

### 2.H Les définitions divergentes — 66 noms partagés qui ne partagent pas leur objet

Deux vues ou plus déclarent le même nom de classe et donnent **au même sélecteur
des corps différents**. Une redéclaration à l'identique ne compte pas, une règle
qu'une vue ajoute et que l'autre n'a pas non plus : seul un **conflit sur le même
sélecteur** est retenu.

**Ce que ces 66 lignes interdisent** : les factoriser dans une feuille commune,
les promouvoir au socle, ou porter la définition de l'une dans l'autre. Chaque
vue garde la sienne, par P-6.3. Ce que la table donne à voir, ce sont les
endroits où un agent pressé casserait deux vues en croyant en simplifier une.

Trois exemples qui valent avertissement. `.vide`, au §2.D-1. `.noeud`, que
34 vues emploient : le nœud d'arborescence du rail pour presque toutes, **et** le
nœud de graphe pour V-19 et V-20, avec des règles inconciliables. `.fil`, enfin : déclarée par
35 vues et identique dans 34 ; seule V-09 n'a pas le `overflow: hidden` de la
correction de troncature du fil d'Ariane (§6.1), et elle est aussi la seule à ne
pas employer le fil.

| Classe | Vues qui la déclarent | Sélecteur en collision |
|---|---|---|
| `.amorce` | 2 — V-07, V-11 | `.amorce p` |
| `.arbre-choix` | 16 — V-13, V-15, V-17, V-18, V-22, V-23, V-24, V-27, V-28, V-29, V-30, V-31, V-32, V-35, V-40, V-41 | `.arbre-choix` |
| `.arete` | 2 — V-19, V-20 | `.arete` |
| `.article` | 8 — V-03, V-14, V-15, V-17, V-18, V-31, V-37, V-41 | `.article` |
| `.barre-progres` | 2 — V-24, V-36 | `.barre-progres` (+1) |
| `.bilan` | 2 — V-16, V-24 | `.bilan` |
| `.bloc` | 2 — V-13, V-25 | `.bloc + .bloc` |
| `.bloc-code` | 9 — V-03, V-11, V-14, V-15, V-17, V-18, V-31, V-37, V-41 | `.bloc-code pre` |
| `.champ-public` | 4 — V-01, V-02, V-03, V-04 | `.champ-public` |
| `.chrono` | 2 — V-14, V-41 | `.chrono` (+2) |
| `.colonne-redaction` | 2 — V-17, V-18 | `.colonne-redaction` |
| `.corps-public` | 2 — V-01, V-02 | `.corps-public` |
| `.degrade` | 2 — V-08, V-39 | `.degrade` |
| `.depot` | 2 — V-24, V-35 | `.depot` (+1) |
| `.depot__ic` | 2 — V-24, V-35 | `.depot__ic` |
| `.detail-col` | 2 — V-19, V-20 | `.detail-col` |
| `.doc` | 3 — V-38, V-39, V-40 | `.doc` |
| `.doc__tete` | 3 — V-38, V-39, V-40 | `.doc__tete p` |
| `.esq-l` | 2 — V-07, V-14 | `.esq-l` |
| `.facettes` | 4 — V-02, V-08, V-12, V-22 | `.facettes` |
| `.fil` | 35 — V-07, V-08, V-09, V-10, V-11, V-12, V-13, V-14, V-15, V-16, V-17, V-18, V-19, V-20, V-21, V-22, V-23, V-24, V-25, V-26, V-27, V-28, V-29, V-30, V-31, V-32, V-33, V-34, V-35, V-36, V-37, V-38, V-39, V-40, V-41 | `.fil` |
| `.groupe__nom` | 2 — V-13, V-33 | `.groupe__nom` |
| `.groupe__tete` | 2 — V-13, V-33 | `.groupe__tete` |
| `.interrupteur` | 4 — V-17, V-18, V-25, V-41 | `.interrupteur` |
| `.introuvable` | 2 — V-04, V-26 | `.introuvable` (+1) |
| `.introuvable__txt` | 2 — V-04, V-26 | `.introuvable__txt` |
| `.jalon__nom` | 2 — V-06, V-24 | `.jalon__nom` |
| `.jalons` | 2 — V-06, V-24 | `.jalons` |
| `.lecture` | 2 — V-14, V-15 | `.lecture` (+1) |
| `.ligne-note__titre` | 9 — V-03, V-11, V-14, V-15, V-17, V-18, V-31, V-37, V-41 | `.ligne-note__titre` |
| `.marque` | 4 — V-01, V-02, V-03, V-04 | `.marque` |
| `.mesure` | 3 — V-10, V-11, V-37 | `.mesure` |
| `.mesure__nom` | 3 — V-10, V-11, V-37 | `.mesure__nom` |
| `.mesure__sous` | 2 — V-10, V-11 | `.mesure__sous` |
| `.mesure__val` | 3 — V-10, V-11, V-37 | `.mesure__val` |
| `.modes` | 2 — V-08, V-16 | `.modes` (+1) |
| `.noeud` | 35 — V-07, V-08, V-09, V-10, V-11, V-12, V-13, V-14, V-15, V-16, V-17, V-18, V-19, V-20, V-21, V-22, V-23, V-24, V-25, V-26, V-27, V-28, V-29, V-30, V-31, V-32, V-33, V-34, V-35, V-36, V-37, V-38, V-39, V-40, V-41 | `.noeud` |
| `.noeud__nom` | 35 — V-07, V-08, V-09, V-10, V-11, V-12, V-13, V-14, V-15, V-16, V-17, V-18, V-19, V-20, V-21, V-22, V-23, V-24, V-25, V-26, V-27, V-28, V-29, V-30, V-31, V-32, V-33, V-34, V-35, V-36, V-37, V-38, V-39, V-40, V-41 | `.noeud__nom` |
| `.ob` | 3 — V-17, V-18, V-31 | `.ob` |
| `.outils-red` | 3 — V-17, V-18, V-31 | `.outils-red` |
| `.oz` | 3 — V-17, V-18, V-31 | `.oz + .oz::before` |
| `.pj` | 2 — V-03, V-14 | `.pj` |
| `.rassurance` | 2 — V-01, V-31 | `.rassurance` |
| `.reformuler` | 4 — V-02, V-03, V-04, V-26 | `.reformuler` |
| `.reglages` | 4 — V-02, V-08, V-12, V-22 | `.reglages` |
| `.regles` | 3 — V-06, V-25, V-37 | `.regles` |
| `.rel-groupe__titre` | 3 — V-14, V-19, V-20 | `.rel-groupe__titre` |
| `.rel-item` | 3 — V-19, V-20, V-40 | `.rel-item` |
| `.resultats` | 5 — V-02, V-04, V-08, V-26, V-41 | `.resultats` |
| `.scene` | 3 — V-19, V-20, V-21 | `.scene` (+1) |
| `.section-titre` | 3 — V-10, V-11, V-13 | `.section-titre` |
| `.selecteur` | 10 — V-17, V-18, V-23, V-24, V-29, V-31, V-32, V-33, V-36, V-40 | `.selecteur` |
| `.sommaire` | 8 — V-03, V-14, V-15, V-17, V-18, V-31, V-37, V-41 | `@media (max-width: 1240px) » .sommaire` |
| `.tableau-boite` | 9 — V-03, V-11, V-14, V-15, V-17, V-18, V-31, V-37, V-41 | `.tableau-boite` |
| `.tendance` | 2 — V-07, V-34 | `.tendance` |
| `.tiroir-form` | 10 — V-27, V-28, V-29, V-30, V-31, V-32, V-33, V-34, V-35, V-36 | `.tiroir-form` |
| `.travail` | 10 — V-27, V-28, V-29, V-30, V-31, V-32, V-33, V-34, V-35, V-36 | `.travail` |
| `.tri` | 3 — V-08, V-12, V-22 | `.tri select` |
| `.val` | 4 — V-02, V-08, V-12, V-22 | `.val:hover` |
| `.vide` | 2 — V-08, V-39 | `.vide` |
| `.vide__titre` | 2 — V-08, V-39 | `.vide__titre` |
| `.vide__txt` | 2 — V-08, V-39 | `.vide__txt` |
| `.voile__boite` | 3 — V-19, V-20, V-21 | `.voile__boite` |
| `.zone-erreur__titre` | 4 — V-01, V-02, V-03, V-04 | `.zone-vide__titre, .zone-erreur__titre` |
| `.zone-graphe` | 2 — V-19, V-20 | `.zone-graphe svg` (+1) |
| `.zone-vide__titre` | 5 — V-01, V-02, V-03, V-04, V-26 | `.zone-vide__titre, .zone-erreur__titre` |

### 2.I Les quatre signaux que le relevé produit, et que rien ne corrige

Ces quatre listes ne sont pas des composants. Ce sont des faits du gel, qu'un
lot doit connaître avant de porter une vue, et qu'**aucun lot n'a le droit de
corriger** : `mockups/` est en lecture seule.

| Signal | Volume | Ce que c'est | Commande |
|---|---|---|---|
| **Emplois orphelins** | 92 | la vue pose la classe, aucune de ses deux feuilles ne la déclare : le nœud rend sans style | `--orphelines` |
| **Déclarées sans emploi** | 10 | la feuille porte la règle, aucun balisage ne la pose : elle ne rend rien, donc elle ne se porte pas | `--residu` |
| **Homonymes divergents** | 66 | §2.H | `--homonymes` |
| **Jetons rejetés** | 53 | ce que le relevé a lu dans un script et écarté, faute d'être déclaré ou posé nulle part | `--rejets` |

Le plus instructif est le premier. `.btn-copier`, employée par cinq vues, n'est
**déclarée nulle part** : c'est un crochet de script, et son apparence vient de
`.btn`. `.contexte` est employée par six vues et déclarée par deux (§2.D-4).
Porter fidèlement, c'est porter la classe **telle que le gel la pose**, sans
inventer la règle qui manque — et sans la retirer parce qu'elle « ne sert à
rien ».

---

## 3. Le témoin de fraîcheur

C'est **la signature du produit**, le composant le plus reproduit et le plus
facile à dégrader. Il apparaît partout où une note est représentée : résultat de
recherche, carte, ligne de liste, en-tête de lecture, nœud de graphe, export
(brief §3.1). **Ne jamais afficher une note sans son témoin** — c'est le
renseignement qui décide si l'on peut s'y fier (V-41).

### 3.1 Le principe, et pourquoi il est non négociable

> *La forme porte l'information ; la couleur ne fait que la répéter.*
> — `socle.css` lignes 166–168

Trois exigences fonctionnelles, toutes trois de rang contractuel :

1. **Identifiable en vision périphérique**, sans lecture (RG-DA-03).
2. **Jamais porté par la couleur seule** (RG-M18-09, RG-DA-03) : la hauteur de
   la jauge, le nombre de barres pleines et le hachurage portent l'information
   indépendamment de la teinte.
3. **Toujours accompagné de sa valeur en clair** (brief §3.1) : un signal sans
   durée lisible ne remplit pas son rôle.

Un rendu en niveaux de gris doit rester lisible. C'est le test de recette.

### 3.2 Les trois niveaux

| Niveau | Barres pleines | Classe | Couleur | Marque supplémentaire | Libellé type |
|---|---|---|---|---|---|
| Frais | **3 / 3** | `.temoin--frais` | `--c-frais` | — | « Vérifié il y a 12 jours » |
| Vieillissant | **2 / 3** | `.temoin--vieil` | `--c-vieil` | — | « Vérifié il y a 4 mois » |
| Obsolète | **1 / 3** | `.temoin--obs` | `--c-obsolete` | **hachurage** du libellé | « Pas revu depuis 8 mois » |

Le libellé se construit selon `libelleFraicheur` : sous 31 jours, « Vérifié il y
a *n* jours » ; au-delà, en mois ; le niveau obsolète change de verbe — « **Pas
revu depuis** *n* mois ».

### 3.3 Le balisage exact

Tel qu'il apparaît dans les maquettes gelées (`V-03:959`, `V-14:1463`, `:1817`,
`:1822`, et le constructeur `window.temoinFraicheur`) :

```html
<span class="temoin temoin--frais">
  <span class="temoin__jauge" aria-hidden="true">
    <i class="plein"></i><i class="plein"></i><i class="plein"></i>
  </span>
  <span class="temoin__txt">Vérifié il y a 12 jours</span>
</span>
```

```html
<span class="temoin temoin--vieil">
  <span class="temoin__jauge" aria-hidden="true">
    <i class="plein"></i><i class="plein"></i><i></i>
  </span>
  <span class="temoin__txt">Vérifié il y a 4 mois</span>
</span>
```

```html
<span class="temoin temoin--obs">
  <span class="temoin__jauge" aria-hidden="true">
    <i class="plein"></i><i></i><i></i>
  </span>
  <span class="temoin__txt">Pas revu depuis 8 mois</span>
</span>
```

Points de balisage qui ne se devinent pas :

- **Toujours trois `<i>`**, quel que soit le niveau. Les barres non atteintes
  restent présentes, en contour vide (`border: 1px solid currentColor;
  background: transparent`). C'est le contraste plein / vide qui fait la forme :
  n'émettre qu'une barre pour le niveau obsolète détruit la lecture périphérique.
- **`.plein`** sur les *n* premières barres, jamais sur d'autres.
- **`aria-hidden="true"`** sur `.temoin__jauge` : la jauge est une redondance
  visuelle, le texte de `.temoin__txt` porte l'information pour les lecteurs
  d'écran. Sans cet attribut, trois éléments vides seraient annoncés.
- **`.temoin__txt` n'est jamais omis.** Il porte la valeur en clair (exigence 3)
  *et* le fond hachuré du niveau obsolète.
- Une **fabrique unique** produit tous les témoins du produit :
  *« il n'existe qu'une seule fabrique, pour qu'il ne puisse pas diverger d'un
  écran à l'autre »* (V-41, `window.temoinFraicheur`). ADR-005 pose la même
  unicité côté calcul. Corollaire d'implémentation : **un seul composant, appelé
  partout**, jamais un balisage recopié.

### 3.4 La géométrie de la jauge

`socle.css:178`–`189` :

| Élément | Valeur | Ce qu'elle fait |
|---|---|---|
| `.temoin__jauge` | `inline-flex`, `align-items: flex-end`, `gap: 2px`, `height: 13px`, `flex: none` | Barres alignées **par le bas** — c'est l'alignement bas qui rend l'étagement lisible |
| `.temoin__jauge i` | `width: 4px`, `border-radius: 1px`, `border: 1px solid currentColor`, `background: transparent` | Barre vide |
| `i:nth-child(1)` | `height: 6px` | Barre courte |
| `i:nth-child(2)` | `height: 10px` | Barre moyenne |
| `i:nth-child(3)` | `height: 13px` | Barre haute |
| `i.plein` | `background: currentColor` | Barre pleine |

Trois hauteurs **croissantes** : 6 → 10 → 13. La forme de la silhouette change
avec le niveau, indépendamment du remplissage. `currentColor` fait que la teinte
vient d'un seul endroit — le modificateur de niveau posé sur `.temoin`.

`.temoin` lui-même (`socle.css:170`) : `inline-flex`, `gap: var(--e-2)`,
`--f-donnee`, `--t-mini`, `--g-moyen`, `line-height: 1`, `white-space: nowrap`.

### 3.5 Le hachurage du niveau obsolète

`socle.css:195`–`205`, précédé de sa justification :

> *Le niveau obsolète porte en plus un hachurage : reconnaissable de loin, et
> lisible en niveaux de gris comme en vision périphérique.*

```css
.temoin--obs .temoin__txt {
  padding: 2px var(--e-2);
  border-radius: var(--r-1);
  background: repeating-linear-gradient(135deg,
                var(--c-obsolete-voile) 0 5px, #f0d5cf 5px 10px);
  box-shadow: inset 0 0 0 1px #e0b6ad;
}
```

Le hachurage porte sur **le libellé**, pas sur la jauge. Trame à 135°, pas de
5 px. Les deux valeurs `#f0d5cf` et `#e0b6ad` sont en dur **dans le socle** :
elles sont dérivées de `--c-obsolete-voile` et n'ont pas été promues en jetons.
C'est un fait constaté, pas une autorisation d'en ajouter (§5, P-1).

Le même motif de hachures désigne le **brouillon** (`.past--brouillon`) : *« ce
n'est pas encore publiable »*.

### 3.6 Le cartouche de contrôle — la forme longue

`V-41:663`–`723`. En tête de note (V-03, V-14, V-15, V-37), le témoin change
d'échelle sans changer de nature :

| Aspect | Témoin courant | Cartouche |
|---|---|---|
| Hauteur de jauge | 13 px | **26 px** (`.cartouche .temoin__jauge`) |
| Largeur de barre | 4 px | **7 px**, bordure 1,5 px |
| Hauteurs | 6 / 10 / 13 | **12 / 19 / 26** |
| Fond | aucun (sauf hachures obsolète) | `[data-niveau]` → voile de fraîcheur, **hachuré à 9 px pour l'obsolète** |
| Texte | `.temoin__txt` | `.cartouche__valeur` (mono, `--t-t3`, lourd) + `.cartouche__detail` |
| Bordure | — | `1.5px solid currentColor` |

Le cartouche porte l'action « Vérifier » (`.btn--verifier`) et son retour visuel,
le **tampon** (`.tampon`, `V-41:702`) : animation `tamponner` sur `--m-ample`,
avec remplissage échelonné des trois barres (`remplir`, décalages 0 / 90 / 180 ms).
Toutes ces animations sont neutralisées par
`prefers-reduced-motion` via les jetons de mouvement (§1.14).

### 3.7 Ce qui est interdit sur le témoin

Ces interdits sont opposables :

1. **Rendre le témoin sans `.temoin__txt`.** Un signal sans durée lisible ne
   remplit pas son rôle (brief §3.1, exigence 3).
2. **Émettre moins de trois `<i>`.** La forme n'existe plus.
3. **Retirer `aria-hidden="true"` de la jauge**, ou le poser sur `.temoin` entier.
4. **Retirer le hachurage du niveau obsolète**, ou l'étendre aux autres niveaux.
5. **Encoder le niveau par la couleur seule** — par exemple trois barres pleines
   rouges pour l'obsolète.
6. **Employer les jetons de fraîcheur ailleurs** que sur un signal de fraîcheur.
7. **Recopier le balisage** au lieu d'appeler le composant unique.
8. **Ajouter un quatrième niveau**, ou renommer les trois existants.
9. **Retirer le témoin en densité compacte.** *« Le signal de fraîcheur ne
   disparaît jamais »* (`V-12:900`) : le mode compact retranche l'extrait et les
   étiquettes, jamais le témoin.

Le contrôle mécanique correspondant est la batterie 5 (`pnpm verif:fraicheur`,
lot T-013) : unicité de la fraîcheur.

---

## 4. Les règles de layout

### 4.1 La grille de coquille

`V-37:411`–`417`, identique dans les 35 vues à coquille :

```css
.app { display: grid; grid-template-columns: var(--l-rail) minmax(0,1fr); min-height: 100vh; }
.app[data-rail="ferme"] { grid-template-columns: minmax(0,1fr); }
.app[data-rail="ferme"] .rail { display: none; }
```

**Deux pistes quand le rail est là, une seule quand il n'y est pas.** La
deuxième piste est `minmax(0,1fr)` et non `1fr` : sans le `minmax(0,…)`, un
contenu large (tableau, bloc de code, fil d'Ariane) impose sa largeur minimale à
la piste et fait déborder la page entière.

Le commentaire du socle en ligne dit pourquoi la piste disparaît au lieu de
passer à zéro :

> *Le rail escamoté sort de la grille : la colonne de contenu devient la seule
> piste. Déclarer « 0 1fr » laisserait le contenu se placer dans la piste de
> largeur nulle, puisqu'un élément en `display:none` n'occupe plus sa piste.*

C'est le correctif E-01 / E-02 (§6.1). **Il ne doit jamais être défait.**

### 4.2 La grille de lecture

`V-14:950`–`956` :

```css
.lecture {
  display: grid; align-items: start;
  grid-template-columns: var(--l-sommaire) minmax(0,1fr) var(--l-panneaux);
  gap: var(--e-6);
  padding: var(--e-5) var(--e-5) var(--e-8);
  max-width: 1560px; width: 100%; margin: 0 auto;
}
```

Trois colonnes : sommaire, article, panneaux. Bornée à 1560 px et centrée.
`.article { min-width: 0; max-width: var(--l-large) }` ; à l'intérieur,
`.prose > *` est borné à `--l-lecture` (680 px), sauf `.bloc-code`,
`.tableau-boite`, `.figure` et `.alerte` qui débordent jusqu'à `--l-large`.

Autres grilles employées, toutes exprimées en jetons ou en `auto-fit` :

| Grille | Déclaration | Vue |
|---|---|---|
| Tableau de bord | `repeat(auto-fit, minmax(212px, 1fr))` avec `gap: var(--e-3)` | V-07, V-37 (`.bord__grille`) |
| Notification | `auto minmax(0, 1fr) auto` | Socle en ligne, `.notif` |
| Cartouche | `1fr auto` | `.cartouche` |
| Métadonnées | `auto 1fr` | `.meta` |

### 4.3 La densité

Un seul mécanisme de densité existe dans les maquettes, et il est **local à la
liste de notes**, pas global à l'application. `V-12:838`–`904` :

| Élément | Classe / attribut | Effet |
|---|---|---|
| Sélecteur | `.densite` avec deux boutons `[data-densite="confort"|"compact"]`, `role="group"`, `aria-pressed` | Bascule |
| Confortable (défaut) | `.liste[data-densite="confort"]` | Extrait et étiquettes visibles, `padding: var(--e-3) var(--e-4)` |
| Compact | `.liste[data-densite="compact"]` | `.lc__extrait` et `.lc__etiquettes` en `display:none` ; `padding: var(--e-2) var(--e-3)` ; `gap: var(--e-1) var(--e-3)` |

**Décision tracée** — le commentaire qui accompagne le mode compact
(`V-12:899`–`900`) :

> *Densité compacte : l'extrait et les étiquettes disparaissent, le reste tient
> sur une ligne. **Le signal de fraîcheur ne disparaît jamais.***

Le compact **retranche des lignes de contenu, il ne réduit pas la typographie** :
les jetons de taille sont inchangés d'un mode à l'autre. Et il ne touche pas au
témoin : voir §3.7, interdit n° 9.

La règle de fond est au brief §3.10 : *« la contrainte fonctionnelle est de
**hiérarchiser**, pas de retrancher »*. Un référent doit voir l'état de son
périmètre sans faire défiler.

### 4.4 Les points de rupture

Relevé exhaustif sur les 41 maquettes. Cinq largeurs portent la structure ; les
autres sont locales à une vue et servent un composant précis.

| Largeur | Occurrences | Ce qui change |
|---|---|---|
| **1240 px** | 35 vues | **Le rail sort** : `.app` passe à une piste, `.rail { display: none }`. La lecture passe de trois à deux colonnes, le sommaire bascule en bandeau horizontal |
| **900 px** | 17 vues | La lecture passe à **une colonne** ; les panneaux deviennent des sections repliables (`.repliable[data-ouvert]`) ; le cartouche empile ; les métadonnées passent en une colonne ; `.titre-note` descend à `--t-t1` |
| **700 px** | 40 vues | La **palette** occupe l'écran entier (`100vw` / `100dvh`, sans rayon ni bordure), sa croix de fermeture apparaît, ses rappels clavier disparaissent |
| **640 px** | 52 occurrences | La **barre supérieure** se resserre : rembourrage `--e-3`, champ de recherche élastique, rappels clavier masqués, **fil d'Ariane réduit à son segment courant**. Les notifications occupent toute la largeur |
| **520 px** | 16 occurrences | Ajustements locaux de composants denses |
| 1480, 1400, 1180, 1080, 1060, 980, 860, 820, 760, 720, 600, 480 px | 1 à 7 | Ajustements locaux |
| `@container (max-width: 430px)` | palette | La palette réagit à **son conteneur**, pas à la fenêtre |
| `@media print` | vues de lecture | Rail, barre, panneaux, sommaire, notifications, actions et registre masqués ; grille à une colonne ; adresses des liens externes révélées |

**Aucun point de rupture nouveau ne s'invente.** Les cinq largeurs structurantes
sont 1240, 900, 700, 640 et 520 px.

### 4.5 Le comportement à 360 px

RG-M18-12 : *« Le produit est utilisable de 360 px à très grand écran. »*
RG-M18-13 : les cas d'usage prioritaires sur mobile sont **chercher** et **lire** ;
la rédaction longue et la cartographie sont acceptables en mode dégradé.

Les cinq mécanismes qui le garantissent, tous présents dans les maquettes :

1. **Le rail sort de la grille** sous 1240 px, sans laisser de piste vide (§4.1).
   C'est la condition sans laquelle rien d'autre ne tient.
2. **Le fil d'Ariane ne pousse jamais la page.** Deux dispositifs cumulés :
   ```css
   .fil { overflow: hidden; }
   .fil > * { min-width: 0; flex: 0 1 auto; }
   .fil__courant { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
   ```
   et sous 640 px, `.fil > *:not(.fil__courant) { display: none }` — *« seul le
   segment courant reste, les ancêtres restent atteignables par le rail »*.
   Le commentaire du socle note que le défaut *« ne se voyait qu'à 768 px — entre
   les deux largeurs qu'on regarde d'ordinaire »*.
3. **Les contenus larges défilent dans leur bloc**, jamais la page :
   `.bloc-code pre { overflow-x: auto }`, `.tableau-boite { overflow-x: auto }`.
4. **Le champ de recherche devient élastique** (`flex: 1 1 90px; min-width: 0`)
   et lâche ses rappels clavier, *« qui n'ont pas de sens sans clavier physique »*.
5. **Les colonnes latérales de la lecture se replient en sections dépliables**
   sous 900 px, elles ne disparaissent pas.

Le critère de recette est binaire : **aucun défilement horizontal de la page
entière à 360 px**, sur les 41 vues.

---

## 5. Ce qui est proscrit

Section opposable. Chaque interdit est formulé pour qu'un contrôle automatique
s'en déduise. Elle est la spécification de `pnpm verif:jetons` (batterie 2,
lot T-004) et du hook de contrôle des jetons à l'écriture (plan §3.7, RA-02).

**Périmètre de tous les contrôles** : les fichiers de style et de gabarit de
l'application — `src/**/*.{css,svelte,html}` — **à l'exclusion des feuilles dont
l'identité à une source gelée est prouvée par ailleurs**, ce qui est strictement
plus fort que P-1 :

- la copie contrôlée du socle, `src/socle.css`, par **P-6.1** ;
- toute **feuille de vue portée** `src/**/V-xx.css`, par **P-6.3** — voir la
  sous-section correspondante, qui explique pourquoi la contrainte y est
  renversée plutôt qu'assouplie.

Une feuille portée qui **diverge** de son gel n'est plus dans cette exclusion :
P-1 lui est dû en entier, en plus du constat P-6.3.

**Et une exclusion de même nature au niveau du balisage** : un attribut
`style="…"` d'un composant `src/**/V-xx.svelte` dont la valeur figure dans la
maquette gelée de la vue, par **P-6.4** — voir la sous-section correspondante.
Hors de cet ensemble clos, P-1.7 s'applique intégralement.

`mockups/**` n'est jamais analysé : il est gelé et sert de référence.

### P-1 · Aucune valeur en dur hors du socle

| # | Interdit | Détection | Remplacement |
|---|---|---|---|
| P-1.1 | Couleur littérale : `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, nom CSS (`red`, `white`…) | Expression sur les valeurs de déclaration | Un jeton `--c-*` |
| P-1.2 | Longueur d'espacement littérale en `px`/`rem` sur `margin`, `padding`, `gap`, `row-gap`, `column-gap`, `inset`, `top`, `right`, `bottom`, `left` | idem | Un jeton `--e-*` |
| P-1.3 | `border-radius` littéral | idem | Un jeton `--r-*` |
| P-1.4 | `font-family`, `font-size`, `font-weight`, `line-height` littéraux | idem | `--f-*`, `--t-*`, `--g-*`, `--i-*` |
| P-1.5 | `box-shadow` littéral | idem | `--o-pose` ou `--o-flotte` |
| P-1.6 | Durée de `transition` ou d'`animation` littérale | idem | `--m-vif`, `--m-doux`, `--m-ample` |
| P-1.7 | Style en ligne (`style="…"`) portant l'une des propriétés ci-dessus, **et dont la valeur ne figure pas dans la maquette gelée de la vue** (P-6.4) | Analyse des attributs de gabarit, développés | Une classe de l'inventaire |

**Exceptions admises, énumérées et closes.** Toute autre exception est un écart.

| Exception | Motif |
|---|---|
| `0` sans unité | Neutre |
| `1px`, `1.5px`, `2px`, `3px`, `4px` sur `border-width`, `outline-width`, `outline-offset` | Épaisseurs de trait ; le système ne les jetonne pas |
| `50%`, `999px` sur `border-radius` | Formes circulaires (avatars, rouets, planche de revue) |
| `100%`, `100vw`, `100vh`, `100dvh`, `auto`, `none`, `inherit`, `currentColor`, `transparent` | Mots-clés et proportions |
| Dimensions propres à un composant : `13px` de jauge, `4px` de barre, `26px` de sceau, `52px` de barre | Elles **font** la forme du composant et sont dans le socle |
| Les valeurs littérales **du fichier socle lui-même** | Le socle est la frontière : voir P-1.8 |

**P-1.8 — Les valeurs littérales résiduelles du socle sont closes.**

> **Réénumération du 18 août 2026.** Le recensement ci-dessous portait sur
> `mockups/socle.css`, qui n'est plus la source (E-01). Sur le socle retenu —
> celui de V-07, installé en `src/socle.css` — il y a **27 occurrences pour 20
> valeurs distinctes**, et non huit. Une liste close qui ne l'est que pour un
> fichier abandonné n'est pas close. La liste faisant foi est celle du second
> tableau ; le premier est conservé pour la traçabilité.
>
> **Ce recensement n'est pas ce qui contraint.** La contrainte réelle est P-6.1 :
> `src/socle.css` est identique **à l'octet** au bloc extrait de la maquette
> gelée. Aucune vingt-et-unième valeur ne peut donc apparaître sans faire rougir
> la batterie, indépendamment de toute énumération. L'énumération sert à la
> lecture humaine et à la reconnaissance des faux positifs, pas au verrou.

**Recensement d'origine — `mockups/socle.css` (source abandonnée, E-01), huit valeurs :**

| Valeur | Ligne | Emploi |
|---|---|---|
| `#f0d5cf` | 203 | Trame de hachures du témoin obsolète |
| `#e0b6ad` | 204 | Liseré interne du témoin obsolète |
| `#fff` | 227 | Texte du bouton principal |
| `rgba(22,34,43,.06)` | 235, 242 | Survol des boutons discret et de menu |
| `#e2b8b0` | 238 | Bordure de survol du bouton destructif |
| `#dcc59a` | 264 | Bordure de la pastille brouillon |
| `#e6eae7` | 296 | Crête de l'animation d'esquisse |
| `#4fbf8b` | 323 | Filet de la notification de succès |

**Recensement faisant foi — `src/socle.css` (socle retenu), 27 occurrences pour
20 valeurs distinctes :**

| Valeur | Occ. | Emploi |
|---|---|---|
| `#f0d5cf` | 1 | Trame de hachures du témoin obsolète |
| `#e0b6ad` | 1 | Liseré interne du témoin obsolète |
| `#fff` | 1 | Texte du bouton principal |
| `rgba(22,34,43,.06)` | 2 | Survol des boutons discret et de menu |
| `#e2b8b0` | 1 | Bordure de survol du bouton destructif |
| `#dcc59a` | 1 | Bordure de la pastille brouillon |
| `#e6eae7` | 1 | Crête de l'animation d'esquisse |
| `#4fbf8b` | 2 | Filet de la notification de succès |
| `#e8776a` | 2 | Filet de la notification d'erreur |
| `#7fb3d0` | 2 | Filet de la notification d'information |
| `#9d94e8` | 4 | Filet de la notification en cours, et bord du rouet |
| `rgba(252,251,248,.1)` · `.16` · `.18` · `.22` · `.25` · `.3` · `.5` · `.6` · `.72` | 9 | Voiles sur fond sombre — texte secondaire, bordures, survols, jauge et rouet de la notification |

Les douze valeurs qui s'ajoutent au recensement d'origine appartiennent toutes au
**composant de notification**, absent du socle abandonné. C'est la même refonte
que celle décrite en `ECART-007` : elle explique à la fois les 23 classes
manquantes et ces douze littéraux.

**Aucune valeur littérale ne s'ajoute au socle sans arbitrage** : la voie normale
est un nouveau jeton, et un nouveau jeton est une modification d'une source
gelée — donc un geste humain, tracé, suivi d'un regel.

### P-2 · Aucun jeton employé hors de son rôle

| # | Interdit | Détection |
|---|---|---|
| P-2.1 | Un jeton `--c-frais*`, `--c-vieil*`, `--c-obsolete*` sur un élément qui n'est pas un signal de fraîcheur | Croisement sélecteur ↔ jeton |
| P-2.2 | Un jeton sémantique (`--c-alerte*`, `--c-danger*`) substitué à son homologue de fraîcheur au motif de la valeur identique | idem |
| P-2.3 | Un jeton de dimension de structure (`--l-*`) employé pour autre chose que la structure qu'il nomme | idem |

### P-3 · Aucune bibliothèque de composants (ADR-002)

| # | Interdit | Détection |
|---|---|---|
| P-3.1 | Toute dépendance de bibliothèque d'interface ou de composants dans `package.json` | Liste d'exclusion sur les dépendances |
| P-3.2 | Tout import de feuille de style tierce | Analyse des imports |

Le système visuel du produit est `socle.css` et rien d'autre. Une bibliothèque
importe son propre système de jetons, ce qui rend RG-DA-01 invérifiable.

### P-4 · Aucune classe utilitaire (ADR-002)

| # | Interdit | Détection |
|---|---|---|
| P-4.1 | Framework utilitaire (Tailwind, UnoCSS, Windi et assimilés), sa configuration, sa directive | Dépendances + fichiers de configuration |
| P-4.2 | Classe utilitaire écrite à la main : classe dont la règle ne porte qu'**une seule déclaration** correspondant à sa propre nomenclature (`.mt-4`, `.text-sm`, `.flex`, `.p-2`…) | Analyse des règles de la feuille applicative |
| P-4.3 | Attribut `class` ne contenant aucune classe de l'inventaire alors que l'élément porte une mise en forme | Analyse des gabarits |

La nomenclature du produit est **BEM** : `bloc`, `bloc__element`,
`bloc--modificateur`, et les états par attribut de données
(`[data-etat]`, `[data-niveau]`, `[data-ouvert]`, `[data-sel]`, `[data-sens]`,
`[data-densite]`, `[data-rail]`, `[data-droits]`, `[data-role]`) ou par attribut
ARIA (`[aria-current]`, `[aria-selected]`, `[aria-sort]`, `[aria-pressed]`).

### P-5 · Aucun composant hors inventaire — **outillé**

`node verif/inventaire-composants.mjs --verifier`. Le contrôle était assigné à
T-009 par `ADR-002` et resté non outillé (`ECART-008 c`) faute d'inventaire
complet ; l'inventaire l'étant (§2.0), il l'est aussi. Il **ne consulte aucune
liste rédigée à la main** : il relève les 41 maquettes gelées à chaque exécution
et confronte le relevé au §2 de ce document.

| # | Interdit | Détection |
|---|---|---|
| P-5.1 | Toute classe employée par `src/**` et absente des 41 maquettes | Différence entre les classes des composants et le relevé du gel |
| P-5.2 | Toute classe **propre à une vue** employée par une autre vue, ou en dur dans un fichier partagé | Le relevé donne la vue propriétaire ; le nom de fichier donne la vue employeuse |
| P-5.3 | Tout composant **transverse** absent du §2 · toute entrée du §2 absente du gel ou sans emploi | Différence dans les deux sens entre le §2 et le relevé |
| P-5.4 | Toute colonne « En situation » que le relevé dément | La dernière cellule de chaque ligne de tableau du §2 |

**C'est le contrôle qui donne sa force au mot « fermé ».** Il produit deux
listes : *ce qui existe en trop* (écart de dérive) et *ce qui manque* (écart de
couverture). Les deux se remontent dans `docs/ecarts/`.

**Ce qu'il ne couvre pas, et il le dit à chaque exécution** (RA-01) : le sens
inverse de P-5.2 — une variante documentée et non implémentée — suppose une vue
achevée, et 36 vues restent à écrire ; une classe posée par une expression Svelte
non littérale échapperait au relevé de `src/**`, et aucune n'existe aujourd'hui.
La conformité de rendu des classes **propres à une vue** relève de P-6.3 et de la
batterie 11, pas d'ici : leur autorité est la maquette, non ce document.

### P-6 · Aucune divergence du socle

| # | Interdit | Détection |
|---|---|---|
| P-6.1 | La copie applicative du socle diffère de sa référence | Comparaison d'empreinte avec la référence du `GEL.md` |
| P-6.2 | Une règle du socle est redéclarée ou surchargée dans une feuille de vue | Croisement des sélecteurs |
| P-6.3 | Une **feuille de vue portée** diffère, ne serait-ce que d'un octet, du second bloc `<style>` de sa maquette gelée | Comparaison octet pour octet, ancrée sur le `GEL.md` |
| P-6.4 | Un **style en ligne** d'un composant `V-xx.svelte` porte une valeur qui ne figure pas parmi les valeurs de `style` de sa maquette gelée | Appartenance à l'ensemble clos extrait du gel, ancrée sur le `GEL.md` |

**Réserve à lever avant d'activer P-6.1** : la référence à retenir est le socle
en ligne des maquettes, pas `mockups/socle.css`, qui est en retard (§0.2 et
`docs/ecarts/ECART-006.md`). Un contrôle qui compare à `mockups/socle.css`
échouerait à juste titre sur les champs de saisie et les notifications.

#### P-6.3 — la feuille de vue portée, et le renversement de P-1

*Amendement du 18 août 2026, lot T-007b. Résout `docs/ecarts/ECART-011.md` É-2.
Outillé par `verif/feuilles-de-vue.mjs`, joué par `pnpm verif:jetons`.*

**Le constat, mesuré.** Le second bloc `<style>` de `V-37-coquille.html` —
782 lignes de style propre à la vue, que la conformité pixel oblige à porter
**tel quel** — produit **92 constats P-1** : 30 P-1.1, 35 P-1.2, 1 P-1.3,
20 P-1.4, 2 P-1.5, 4 P-1.6. Aucun de ces littéraux n'a d'équivalent parmi les
70 jetons : `13px` n'est pas un pas de `--e-*`, `#f6e9a8` et `#7a2f8f`
n'existent nulle part, `90ms` n'est pas un `--m-*`, `line-height: 1.12` n'est
pas un `--i-*`. **Les remplacer déplace le rendu ; les garder rend la batterie
rouge.** Les deux contraintes sont vraies et incompatibles.

> Le relevé d'origine d'`ECART-011` comptait 94 constats, dont 2 P-6.2. Ces
> deux-là étaient un **faux positif d'instrument** : `selecteursDe()` lisait
> les étapes `to` et `from` d'un `@keyframes` comme des sélecteurs CSS, et le
> socle en déclare cinq — toute feuille portant une animation nommée était
> rouge d'avance (É-3). Corrigé au même lot, unitaire à l'appui.

**La contrainte n'est pas assouplie : elle est renversée, et resserrée.**

Une feuille de vue portée d'une maquette gelée est soumise à un contrôle **plus
strict** que P-1 : elle doit être **identique à l'octet** au second bloc
`<style>` de sa maquette, vérifié mécaniquement, exactement comme P-6.1 le fait
pour le socle. À l'intérieur de ce bloc vérifié, les contrôles de contenu —
P-1, P-4.2, P-6.2 — ne s'appliquent pas : **non par tolérance, mais parce
qu'« identique au gel » implique et dépasse « n'emploie que des jetons »**. Le
socle bénéficie de la même exemption, et pour la même raison exactement (P-1.8,
dernier alinéa : « ce recensement n'est pas ce qui contraint »).

**Hors de ce bloc, P-1 s'applique intégralement.** Toute ligne de CSS qu'un
agent écrit lui-même reste soumise à la règle entière. C'est cette seconde
moitié qui maintient RA-02 couvert — et mieux qu'avant : une feuille identique
au gel **ne peut pas dériver du tout**, tandis qu'une feuille jetonnée pouvait
dériver en restant jetonnée.

**Le nom de fichier est le verrou, et il ne s'évade pas dans les deux sens.**
Est une feuille de vue portée **tout fichier de `src/**` nommé `V-xx.css`**, et
rien d'autre.

| Tentative | Ce qui se passe |
|---|---|
| Rédiger sa propre feuille et la nommer `V-37.css` | P-6.3 la nomme, ligne par ligne — **et** P-1 continue de s'y appliquer |
| Porter le bloc de la maquette sous un autre nom (`coquille.css`) | Le fichier n'est pas reconnu comme porté : P-1 y relève ses 92 constats |
| Retoucher une valeur « juste un peu » | Un octet suffit : le contrôle nomme la ligne et donne la commande de réinstallation |

La seule façon d'être vert est donc de porter le bloc **tel quel, sous son nom
de vue** — c'est-à-dire exactement ce que la conformité pixel exige déjà.

**Une feuille portée ne se recopie pas à la main**, pas plus que le socle. Elle
s'extrait mécaniquement de la maquette gelée, à la demande :

```
node verif/feuilles-de-vue.mjs V-37 --installer   → src/vues/V-37.css
pnpm vues:feuille                                  → état des feuilles portées
```

L'extraction est **ancrée sur le gel** : elle refuse de s'exécuter si la
maquette source diverge de son empreinte au `mockups/GEL.md`. On n'extrait pas
d'une maquette qui a bougé sans arbitrage.

**Conséquence sur le formatage.** `.prettierignore` exclut `src/**/V-xx.css`,
au même titre que `src/socle.css` : reformater une feuille portée la ferait
diverger du gel, donc rougir P-6.3. Le formatage porte sur ce que le dépôt
écrit, jamais sur ce qu'il recopie.

#### P-6.4 — le style en ligne porté, et le prolongement de P-6.3

*Amendement du 19 août 2026, lot T-007d. Résout `docs/ecarts/ECART-015.md` É-3,
tranché par **ARB-016**. Outillé par `verif/styles-en-ligne.mjs`, joué par
`pnpm verif:jetons`. Portée : les 41 vues.*

**Le constat, mesuré.** L'implémentation de V-38, V-39 et V-40 produit
**62 constats** — 49 P-1.7, 5 P-1.3, 3 P-1.4, 3 P-1.2, 2 P-1.1 — portant **tous**
sur des attributs `style="…"` que **la maquette gelée porte elle-même** : les
sceaux colorés des quatre types de notification, la géométrie des esquisses de
chargement, les boutons destructifs des dialogues. Aucun n'est décoratif : les
retirer déplace le rendu, les garder rend la batterie rouge. C'est **la même
contradiction que P-6.3**, au même endroit et pour la même raison — P-6.3 avait
renversé la contrainte pour le bloc `<style>` porté, il ne couvrait pas les
styles en ligne du **balisage** porté.

**La règle, et elle est plus stricte que P-1, pas plus lâche.**

> Un attribut `style="…"` d'un composant `src/**/V-xx.svelte` est admis **si et
> seulement si la même valeur figure dans `mockups/V-xx-*.html`**.

Les valeurs de `style` du fichier gelé forment un **ensemble clos**. On ne peut
pas inventer un style : il faut qu'il soit déjà dans le gel. « Présent dans la
référence » **implique et dépasse** « n'emploie que des jetons » — un style
absent du gel reste un écart, quelle qu'en soit la justification, y compris
lorsqu'il n'emploie que des jetons du socle.

**L'ensemble est par vue.** Le gel de V-39 ne prouve rien de V-40 :
`border-radius:3px` appartient au premier, pas au second, et l'écrire dans V-40
est un constat.

**Ce que l'ensemble contient — et il ne peut pas contenir moins.** Sur les vues
mesurées, la quasi-totalité des styles en ligne du rendu final sont posés par le
**script** de la maquette, jamais écrits dans son balisage (`ECART-013` É-3, le
`line-height:0` des icônes de menu). Quatre formes sont donc lues :

| Forme lue dans le gel | Exemple |
|---|---|
| `style="…"` du balisage | `V-40:1190`, `flex:1;min-width:0` |
| `x.style.cssText = <expr>` | `V-39:2960`, `"width:" + w + ";height:15px;border-radius:3px"` |
| `x.style.propriété = <expr>` | `V-39:3041`, `b.style.paddingLeft = (p[0] * 18) + "px"` |
| `x.setAttribute("style", …)`, `x.style.setProperty(…)` | — |

**Ce que l'ensemble ne contient pas** : les règles du bloc `<style>` de la
maquette. L'ensemble clos est celui des **valeurs de `style`**, pas celui des
déclarations CSS de la vue — celles-là relèvent de P-6.3, et les verser au
balisage ouvrirait le gel entier.

**La comparaison porte sur la déclaration, pas sur l'attribut entier**, et ce
n'est pas un choix de commodité : le gel écrit la même mise en forme tantôt en
un attribut, tantôt en un `cssText`, tantôt en quatre affectations séparées,
là où un squelette sans hydratation n'a qu'un attribut. Un attribut du composant
n'a donc en général aucun homologue textuel dans le gel, alors que chacune de
ses déclarations en a un, exactement. **L'ordre des déclarations en devient sans
effet** — un ensemble n'a pas d'ordre.

**Normalisation, liste close.** Espaces, ordre des déclarations, point-virgule
final, casse des unités et des couleurs hexadécimales. Rien d'autre : chaque
normalisation supplémentaire élargit l'ensemble des styles admis. `0px` n'est
pas `0`, `12.0px` n'est pas `12px`.

**Les valeurs calculées : un marqueur, qui n'est pas un joker.**
`l.style.left = s[0] + "%"` ne dit pas *quelle* valeur, il dit sa **forme**.
Le composant qui écrit `style="left:{a.gauche}%"` dit la même forme. Chaque
portion non littérale est donc réduite au même marqueur des deux côtés, et la
comparaison reste une **égalité de chaînes**, marqueur compris : un gel qui pose
`width:‹calculé›` **n'admet pas** un composant qui écrit `width:64%`.

**Le nom de fichier est le verrou, et il ne s'évade pas dans les deux sens.**
Est un composant de vue **tout fichier de `src/**` nommé `V-xx.svelte`**, et
rien d'autre — la même famille de noms que la feuille portée de P-6.3.

| Tentative | Ce qui se passe |
|---|---|
| Écrire ses propres styles en ligne dans `src/lib/…/Machin.svelte` | Aucun gel ne lui répond : P-1.7 s'y applique en entier |
| Renommer un fichier en `V-38.svelte` pour hériter du gel de V-38 | Le mode démo sert alors *ce* fichier pour V-38, et le banc le compare à la maquette de V-38, pixel pour pixel. Hériter du gel, c'est se soumettre à lui |
| Déplacer les littéraux dans un `.ts` importé | **Fonctionnerait**, et c'est le contournement de vérification de `PLAN §12`. Il est nommé ici plutôt qu'emprunté (`ECART-015` É-3) |

**Le rapport nomme ce qui prouve quoi, à chaque exécution** — même garde-fou
qu'ARB-012 impose aux zones comparées : `pnpm verif:jetons` imprime, composant
par composant, la maquette qui répond de ses styles, la taille de son ensemble
clos et le nombre de déclarations admises. Une dispense silencieuse est
impossible.

**Ce que P-6.4 n'éprouve pas.** Il ne prouve pas que le style est posé sur le
**même élément** que dans le gel — cette preuve-là est celle du banc, au pixel
près (`pnpm verif:maquette V-xx --contre=app`). Les deux contrôles sont
complémentaires, aucun ne remplace l'autre.

### P-7 · Aucune information portée par la couleur seule (RG-M18-09)

| # | Interdit | Détection |
|---|---|---|
| P-7.1 | Un niveau de fraîcheur rendu sans sa jauge à trois barres ou sans son libellé | Analyse du gabarit du composant |
| P-7.2 | Une alerte de contenu rendue sans son glyphe textuel (`ASTUCE`, `ATTENTION`, `DANGER`) | idem |
| P-7.3 | Une notification rendue sans `.notif__marque` | idem |
| P-7.4 | Un nœud de cartographie distingué par la seule teinte | idem |

Complété par la batterie 10 (`pnpm test:a11y`) et la batterie 5
(`pnpm verif:fraicheur`).

### P-8 · Aucune action interdite rendue (ADR-011)

| # | Interdit | Détection |
|---|---|---|
| P-8.1 | Un élément d'action portant `disabled` ou `aria-disabled` pour cause de **droits** | Analyse des gabarits |
| P-8.2 | Une action réservée à l'écriture sans `.si-ecriture`, à l'administration sans `.si-admin` | idem |

Le bouton en attente (`[data-attente="oui"]`) est une **exception légitime** :
il ne traduit pas un droit, mais une opération en cours.

---

## 6. Constats de vérification

### 6.1 E-01 et E-02 — la correction est en place

Le plan §11 signale deux défauts de coquille ; la décision D-04 affirme leur
correction sur les 41 vues. **Vérification faite, la correction est
effectivement là.**

| Point vérifié | Constat |
|---|---|
| Vues portant `.app { display: grid }` | **35** — les 6 vues publiques et d'authentification (V-01 à V-06) n'ont pas de coquille, conformément au brief §3.3 |
| E-02, mode concentration | Corrigé dans les 35 : `.app[data-rail="ferme"] { grid-template-columns: minmax(0,1fr) }` — **une seule piste**, suivi de `.rail { display: none }` |
| E-01, sous 1240 px | Corrigé dans les 35 : `@media (max-width: 1240px) { .app { grid-template-columns: minmax(0,1fr) } .rail { display: none } }` |
| Motif fautif résiduel | **Aucun.** Recherche de `grid-template-columns: 0 …` sur les 41 fichiers : zéro occurrence |
| Justification tracée | Présente en commentaire dans le socle en ligne des 35 vues (cité au §1.15) |

**Mais la correction n'est pas dans `mockups/socle.css`.** Elle ne peut pas y
être : ce fichier ne contient aucune règle de coquille — `.app` n'y apparaît
qu'une fois, ligne 331, pour la règle de droits. La grille de coquille vit dans
le style local de chaque vue. Conséquence pour l'implémentation : **la grille
`.app` doit être portée dans la feuille applicative en reprenant le motif à une
piste, sans passer par le socle**, et ce point est un candidat naturel à la
batterie 2.

Deux corrections apparentées, non numérotées au §11 mais présentes dans les
maquettes et probablement E-03 / E-04 de D-04 : la troncature du fil d'Ariane
(*« le défaut ne se voyait qu'à 768 px »*) et le confinement du défilement des
contenus larges (§4.5, points 2 et 3). Elles sont présentes et commentées.

### 6.2 Contradiction majeure : `socle.css` ↔ maquettes

Décrite au §0.2, fichée en `docs/ecarts/ECART-006.md`. En résumé :

| Ce que dit le plan | Ce que montrent les fichiers |
|---|---|
| §3.4 : « les **61** jetons nommés » | **69** dans `socle.css`, **70** dans le socle en ligne |
| §3.5 : « `mockups/socle.css` […] la feuille globale de l'application en est une **copie contrôlée** » | Une copie conforme de ce fichier ne rendrait pas les vues : il manque 23 classes (champs de saisie, notifications à quatre types), la règle de rôle `.si-admin` et le jeton `--l-large` |
| §3.4 : « les **dix** familles de `socle.css` » | Dix sections numérotées dans le fichier ; **onze** dans le socle en ligne (la 11ᵉ étant « Champs de saisie ») |

Par ordre de préséance (maquettes > cadrage), c'est **le socle en ligne de V-41
qui fait foi**, et le présent document le documente comme tel.

### 6.3 Contradiction mineure : V-41 démontre des composants qu'aucune vue n'emploie

Quatre composants sont définis et démontrés dans la planche, mais n'apparaissent
dans aucune des quarante autres maquettes :

| Composant | Classe | Ce que font les vues à la place |
|---|---|---|
| Pagination | `.pagination` | Aucune vue ne pagine, bien que le brief V-41 l'exige *« au-delà de cinquante éléments »* |
| Tableau triable | `.tableau-tri` | V-34 emploie `.tg` (tableau de gestion), V-32 emploie ses propres tableaux |
| Indicateur chiffré | `.indicateur` | V-34 emploie `.mesure-a` et `.nord` |
| Infobulle | `.infobulle` | Seule V-08 en porte une |

**Ce n'est pas un défaut de la planche, c'est un signal sur l'inventaire.** Deux
lectures possibles, qui relèvent de l'arbitrage :

- soit ces classes sont la forme **canonique** et les variantes locales (`.tg`,
  `.mesure-a`, `.nord`) sont des divergences à résorber lors du portage ;
- soit V-41 propose une forme que les vues ont ensuite abandonnée.

**Décision retenue faute d'arbitrage** : l'implémentation reprend **la classe de
la vue à porter**, puisque c'est elle qui fait foi pour le rendu (préséance
maquettes), et l'écart est signalé au §6.5. Aucun renommage n'est entrepris dans
une session d'exécution.

> **Constat corrigé par le relevé (T-009b).** Ce ne sont pas quatre composants,
> **c'est 37** : la planche déclare 37 classes qu'aucune des quarante autres
> maquettes n'emploie (`--liste=V-41`). Et le tableau ci-dessus se trompait deux
> fois : `.infobulle` n'apparaît **pas** dans V-08, `.menu-ctx` **pas** dans V-12
> ni V-22. La décision, elle, tient — elle est confirmée par le décompte au
> **§2.D-2**, qui la chiffre : `.indicateur` 1 vue, `.mesure` 3 vues à trois
> définitions divergentes, `.mesure-a` 1 vue. Aucune n'est canonique, donc aucune
> ne se promeut.

### 6.4 Constat de volumétrie : l'inventaire fermé ne couvre pas tout le corpus

**Ce constat a été fait sur un décompte approximatif, et il est refait ici sur un
relevé mécanique** (T-009b, §2.0). Les chiffres qui suivent remplacent ceux de la
rédaction d'origine — « 1 202 classes », « 53 » au socle en ligne, « 255 »
inventoriées — dont la méthode n'était pas citée.

Les 41 maquettes connaissent **1 254 classes**, déclarées ou posées. Le socle en
ligne en déclare **58** ; **449** sont transverses, **790** propres à une vue,
**5** hors produit, **10** déclarées sans aucun emploi. L'inventaire du §2 les
porte toutes selon leur nature : nommément pour les 449 transverses (§2.A à
§2.E), par renvoi à leur maquette pour les 790 autres (§2.F).

Le reste du raisonnement d'origine reste exact, et le voici :

Ce n'est pas une contradiction : le plan §3.4 définit l'inventaire fermé comme
l'extraction de `socle.css` **et** de V-41, ce qui était fait. Mais il faut
l'énoncer clairement, sinon le mot « fermé » induit en erreur :

> **L'inventaire du §2 est fermé pour les composants transverses.** Les
> compositions propres à une vue restent gouvernées par leur maquette, elle-même
> gelée : elles ne s'inventent pas davantage, elles se **relèvent** de la
> maquette à porter. Le contrôle P-5 s'applique aux classes transverses ; les
> classes de vue sont contrôlées par la conformité de rendu (batterie 11).

Une classe de vue qui n'existe dans **aucune** maquette est, elle, une invention
pure et un écart au sens plein. **Ces deux phrases sont désormais mécaniques** :
P-5.3 refuse un transverse absent du §2, P-5.1 refuse une classe que le gel ne
porte pas, et P-5.2 refuse qu'une vue emploie la classe propre d'une autre.

### 6.5 Écarts et décisions prises pendant ce lot

| # | Nature | Décision |
|---|---|---|
| 1 | Le plan annonce 61 jetons ; il y en a 69 (70 en ligne) | Le décompte réel est donné au §1.0. Correction à porter au plan |
| 2 | `mockups/socle.css` est en retard sur le socle en ligne des maquettes | Fiché en `ECART-006`. Le socle en ligne de V-41 fait foi ici. Aucune écriture dans `mockups/` |
| 3 | Le plan annonce dix familles de composants dans `socle.css` | Exact pour le fichier, onze pour le socle en ligne. Les deux sont documentés (§2.A) |
| 4 | V-41 démontre quatre composants qu'aucune vue n'emploie | Documentés, marqués « V-41 seulement ». Arbitrage demandé (§6.3) |
| 5 | La grille de coquille n'est pas dans `socle.css` | Constaté (§6.1). Le motif à une piste doit être porté dans la feuille applicative |
| 6 | `--c-alerte` = `--c-vieil` et `--c-danger` = `--c-obsolete` en valeur | Jetons maintenus distincts par nom, substitution proscrite (P-2.2) |
| 7 | Huit valeurs de couleur en dur subsistent dans `socle.css` hors `:root` | Recensées et closes (P-1.8). Aucune promotion en jeton — ce serait éditer une source gelée |
| 8 | Le contrôle de non-divergence P-6.1 ne peut pas viser `mockups/socle.css` en l'état | Réserve écrite dans la section, à lever avec l'arbitrage de l'écart 2 |

### 6.6 Le complètement de l'inventaire — écarts et décisions de T-009b

Le §2 a été complété par relevé mécanique des 41 maquettes gelées, et P-5
outillé. Rien n'a été écrit hors de ce fichier et de
`verif/inventaire-composants.mjs`. Aucune vue n'a été implémentée.

| # | Nature | Décision |
|---|---|---|
| 9 | Le §2 ne portait que le socle et V-41 — dette d'`ECART-011` É-4, `ECART-013` É-4, `ECART-015`, `ECART-016` É-5 | 239 composants transverses ajoutés au §2.E, tracés. La règle des trois natures est écrite au §2.0 |
| 10 | `.zone-etat` contre `.vide` — « le constat le plus lourd » | Tranché au §2.D-1 : `.zone-etat` fait loi (socle, 5 vues, une définition) ; `.vide` reste au gel de V-08 et V-39 (2 vues, deux définitions divergentes) |
| 11 | Trois formes d'indicateur chiffré | Tranché au §2.D-2 : aucune n'est canonique. La vue à porter garde la sienne. Le motif se répète sur les onglets, les tableaux et la pagination |
| 12 | `.selecteur` absent de A-9, qui rangeait `select` sous `.saisie` | Tranché au §2.D-3 : sur 25 `select` classés, 15 portent `.selecteur`, 10 `.nav2__selecteur`, **aucun** `.saisie`. A-9 est corrigée, `.selecteur` entre à l'inventaire |
| 13 | `.contexte*`, quatrième famille d'encart | Tranché au §2.D-4 : elle entre à l'inventaire (6 vues, une définition) ; `.encart-b` reste une démonstration de planche (1 vue) |
| 14 | La colonne « En situation » des §2.A à §2.C portait 18 lignes que le relevé dément | Les 18 corrigées ; le contrôle P-5.4 les tient désormais. `.infobulle` n'est pas en V-08, `.menu-ctx` pas en V-12 ni V-22 |
| 15 | 66 noms de classe reçoivent deux définitions ou plus selon la vue | Recensés au §2.H. Interdiction de les factoriser ; chaque vue porte la sienne (P-6.3) |
| 16 | 92 emplois orphelins — la vue pose une classe qu'aucune de ses feuilles ne déclare | Recensés au §2.I. Ce sont des faits du gel : ni corrigés, ni retirés au portage |
| 17 | V-09 ne porte pas la correction de troncature du fil d'Ariane (E-03) | Constaté au §2.H. `mockups/` étant en lecture seule, rien n'est corrigé : c'est un écart de gel à arbitrer |
| 18 | P-5 était assigné à T-009 par `ADR-002` et non outillé (`ECART-008 c`) | Outillé : `node verif/inventaire-composants.mjs --verifier`, quatre sous-contrôles, 0 constat. **Non câblé à `package.json`**, hors périmètre d'écriture de ce lot |

---

## 7. Ce que ce document n'autorise pas

- Il ne remplace pas les maquettes. En cas de désaccord entre le §2 et une vue
  gelée, **la vue gagne**, et le désaccord se fiche dans `docs/ecarts/`.
- Il ne se complète pas en session d'exécution. Ajouter une ligne à l'inventaire
  suppose qu'un composant a été ajouté au socle ou à une maquette — donc un
  arbitrage. Le complètement du §2.E n'y déroge pas : **aucun composant n'y a été
  ajouté**, ils ont tous été **relevés** de maquettes déjà gelées, et le relevé
  se rejoue (§2.0).
- Il ne décide pas à la place d'une maquette. Les quatre contradictions du §2.D
  sont tranchées **par le décompte des emplois réels**, jamais par préférence ; et
  aucune ne conclut à un renommage.
- Il ne dispense d'aucune batterie. Il **spécifie** la batterie 2 ; il ne la
  remplace pas.

**Sources gelées consultées** : `mockups/socle.css`, **les 41 fichiers
`mockups/V-xx-*.html`** — relevés en entier par `verif/inventaire-composants.mjs`
pour le §2.0 et les §2.D à §2.I —, `mockups/GEL.md`, `cadrage/PLAN-DE-REALISATION.md` §3.3, §3.4, §3.5, §11, §15.1,
`cadrage/BRIEF-VUES.md` §3 et §V-41,
`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md` RG-DA-01, RG-DA-03, RG-M18-07,
RG-M18-09, RG-M18-12, RG-M18-13. Aucune n'a été modifiée.
