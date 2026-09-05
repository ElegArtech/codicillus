# Handoff : refonte de l'interface Codicillus

Prototype validé le 5 septembre 2026. Dépôt cible : `ElegArtech/codicillus` (branche `master`), SvelteKit + `src/socle.css` + vues `src/vues/V-xx.svelte`.

## À lire d'abord

Les fichiers de ce dossier sont des **références de design écrites en HTML** (`Codicillus - Lecture de note.dc.html` + `polices.css`). Ce ne sont pas du code à copier. La tâche est de **recréer ces écrans dans le code existant du dépôt**, en respectant ses conventions : jetons de `src/socle.css`, une feuille `V-xx.css` par vue, aucune valeur arbitraire dans les écrans, fabrique unique de fraîcheur `src/lib/fraicheur.ts`, câblage des gestes dans `src/routes/**/cablage.ts`, vocabulaire de `CLAUDE.md`.

Fidélité : **haute**. Couleurs, typographies, espacements, hiérarchie et libellés du prototype font foi. Là où le prototype et le dépôt divergent (vocabulaire, palette, nombre d'états), les arbitrages sont listés ci-dessous et priment sur les deux.

Ouvrir le prototype : le fichier `.dc.html` se lit dans un navigateur. Il contient les six vues ; naviguer par la sidebar, le fil d'Ariane et les liens. Les commentaires `<!-- ===== VUE X ===== -->` bornent chaque écran dans le template ; la logique (données, calcul des états, navigation) est dans la classe `Component` en bas du fichier.

## Arbitrages produits (décisions prises, ne pas rediscuter)

1. **Vocabulaire mixte.** Structure du dépôt : *Univers › Domaine › Dossier › Note*, *Registre* (Référence / Opérationnel), *Étiquette*. Mais le concept de fraîcheur s'appelle désormais **« Vivacité »** à l'écran (le code peut garder `fraicheur` en interne ; les libellés visibles changent). Jamais « tag », « espace », « document », « version opérationnelle » à l'écran.
2. **Cinq états de vivacité** au lieu de trois : `ajour`, `bientot`, `averifier`, `arevoir`, `obsolete`. Le calcul est purement temporel à partir de la dernière vérification et d'une **durée de validité par registre** (jours) :
   - reste = échéance − aujourd'hui, échéance = vérifiée + validité
   - reste > seuilBientôt → **À jour**
   - 0 ≤ reste ≤ seuilBientôt → **Bientôt à vérifier** (seuilBientôt = 10 jours, configurable)
   - −14 < reste < 0 → **À vérifier**
   - −90 < reste ≤ −14 → **À revoir**
   - reste ≤ −90 → **Obsolète**
   - Une **demande de révision** force **À revoir** jusqu'à la prochaine vérification, quel que soit le temps.
   Chaque registre (Référence, Opérationnel) a **son propre cycle** : sa date de vérification, sa validité, son état. Créer l'Opérationnel démarre un nouveau cycle (vérifié à l'instant).
3. **Le violet d'encre `--c-accent` disparaît.** Le vert profond devient l'accent fonctionnel et identitaire. Pas de bleu.
4. **Actions de vivacité** (« Marquer comme vérifiée », « Signaler à réviser » / « Lever la demande ») vivent dans le menu ⋮ du header, pas dans un cartouche.
5. **Le gros panneau « Vivacité de cette documentation » et la courbe sont supprimés.** Une ligne compacte sous le sélecteur de registre + une carte compacte en colonne droite + une timeline d'états dans la vue Historique.
6. Pas de décoration : ni texture papier, ni feuille, ni fond topographique, ni illustration. La cartographie est un lien, pas un graphe affiché.

## Jetons

À poser dans `src/socle.css` (remplacer / compléter les jetons existants ; les noms existants sont conservés quand ils existent).

Couleurs
- `--c-accent: #1f5a3c` (vert profond, remplace `#453ba0`) · `--c-accent-fonce: #174631` · `--c-accent-voile: #e6efe9` · `--c-accent-trait: #d8e6dc`
- Surfaces : `--c-fond: #f5f4ef` (sidebar, fond d'application) · `--c-papier: #fcfbf8` (colonne centrale, cartes) · `--c-papier-2: #f5f4ef` · `--c-fond-creux: #efeee8` (fond du code inline) · survol de liste `#ecebe5` · ligne active sidebar `#e9e8e1`
- Traits : `--c-trait: #dfe3df` · `--c-trait-fin: #eceee9` / `#f0f0ea` (séparateurs de lignes) · `--c-trait-fort: #9aa7a3`
- Encres : `--c-encre: #16222b` · `--c-encre-2: #46585f` · `--c-encre-3: #536066` · `--c-encre-4: #93a2a6`
- Vivacité (couleur + voile) :
  - À jour `#1d6b4a` / `#e4efe8`
  - Bientôt à vérifier `#6f6a0e` / `#f2f0dc`
  - À vérifier `#8f5c00` / `#f6eedd`
  - À revoir `#b4471c` / `#f8e6dc`
  - Obsolète `#a52c1b` / `#f7e7e3`
- Danger (Supprimer) `#a52c1b` / `#f7e7e3`

Typographie (polices déjà dans `static/polices/`)
- `--f-ui` Archivo : interface, corps de note (16.5px / 1.7), métadonnées, boutons
- `--f-lecture` Literata : titres de note (40px / 1.2 / 500), titres de section (27px / 500), salutation accueil (38px / 600), nom d'univers/domaine (42px / 600), grands chiffres (19–26px / 600), phrases d'accroche (17px)
- `--f-donnee` JetBrains Mono : labels de section (11px, letter-spacing .09em, uppercase, `--c-encre-3`), code, compteurs, numéros de sommaire, dates relatives
- Tailles interface : 12.5 / 13 / 13.5 / 14 / 14.5 / 15 px

Espacements, rayons, ombres
- Grille : sidebar 300px · centre `minmax(0,1fr)` · colonne contexte 340px · sommaire 190px
- Marges de la colonne centrale : `clamp(20px, 3.5–4vw, 56–64px)`
- Rayons : 5–6px (boutons, chips), 8px (blocs de code, cartes), 10px (grandes cartes), 99px (pastille révision)
- Ombre menu : `0 6px 20px -4px rgba(22,34,43,.18), 0 2px 6px rgba(22,34,43,.08)`
- Hauteurs : header 64px · boutons 40px · lignes sidebar 38px (univers) / 32px (enfants) · cibles ≥ 32px

Mouvement : `monte` 160–200ms (opacity 0 → 1, translateY 8px → 0) pour menus, tiroirs, toast, diff. Rien de permanent, pas de pulsation.

## Le composant central : glyphe de vivacité

Un seul composant, partout (ligne compacte, colonne droite, sidebar, listes, historique, tableaux). SVG 16×16 : un anneau `r=6.5` stroke 1.5 de la couleur d'état, plus un remplissage :
- À jour : disque plein
- Bientôt : trois quarts de disque (`M8 8V1.5A6.5 6.5 0 1 1 1.5 8z`)
- À vérifier : demi-disque droit (`M8 1.5a6.5 6.5 0 0 1 0 13z`)
- À revoir : point d'exclamation (`M7.1 4h1.8v5H7.1zM7.1 10.3h1.8v1.8H7.1z`)
- Obsolète : anneau vide

Toujours accompagné du libellé et de l'information temporelle. La couleur ne porte jamais seule l'information (RG-M18-09 reste vrai).

**Attention progressive** : la ligne compacte est transparente pour À jour et Bientôt ; fond `rgba(143,92,0,.06)` pour À vérifier ; fond voile de l'état pour À revoir et Obsolète. La partie « échéance » passe en gras et en couleur d'état à partir d'À vérifier.

## Écrans

### 1. Coquille (toutes les vues) — `src/lib/coquille/`
- **Sidebar gauche** (300px, fond `--c-fond`, bordure droite `--c-trait-fin`, padding 22px 20px) : logo carré vert 36px avec « C » Literata 600 + « Codicillus » Literata 24px 600 vert + « Vos connaissances. Vivantes. » 12.5px `--c-encre-3` ; champ Rechercher (⌘ K) ; label UNIVERS ; **arborescence dépliable** Univers › Domaine › Dossier › Note (chevron 20px à gauche qui tourne de 90°, icône propre à chaque univers, icônes dossier/note, indentation 14px par niveau, compteur mono à droite au niveau univers/domaine) ; « + Créer un univers » ; label RÉCENTS ; 5 notes ; « → Voir tous les récents » ; en bas, carte compte (avatar 32px vert, nom, courriel, chevron).
  - Ligne active : fond `#e9e8e1`, texte vert 600. Univers actif sans fond, texte vert 500.
  - Cliquer un univers ouvre sa page et le déplie ; un domaine ouvre sa page ; une note l'ouvre ; le chevron seul déplie/replie.
- **Header** (sticky, 64px, fond papier, bordure basse `--c-trait-fin`, padding 14px 24–32px) : fil d'Ariane 14px (maison → Univers → Domaine/slug ; les segments cliquables en vert) ; à droite selon la vue (voir chaque écran).
- **Responsive** : < 1380px le sommaire disparaît ; < 1180px la colonne contexte devient un **tiroir** (bouton « Contexte » avec le glyphe de vivacité courant dans le header) ; < 1024px la sidebar devient un tiroir (bouton ☰). Tiroir : 340px max 86vw, ombre, voile `rgba(22,34,43,.32)`, fermeture au clic sur le voile ou ✕.

### 2. Accueil — route `/`, `src/vues/V-07`
Header droit : bouton « + Créer » (contour) + avatar.
Colonne centrale (padding 36px, gap 22px) :
1. « Bonjour Alexandre. » Literata 38px 600 ; sous-titre Literata 17px « **N** notes dans votre bibliothèque, dont **M** sont actuellement à jour. » (chiffres en vert 600).
2. Grand champ de recherche (Literata 17px placeholder « Rechercher une note, une fiche, un signet... », ⌘ K).
3. Carte **À SURVEILLER** : grille `auto-fit minmax(280px,1fr)` à trois blocs — alertes (cercle 38px voile + glyphe, « **6** notes arrivent bientôt à échéance / Vérification prévue dans les 10 prochains jours » et « **6** notes nécessitent votre attention / Leur période de validité est dépassée », chevron) ; compteurs des 5 états (glyphe, chiffre Literata 19px, libellé) ; bilan (carte voile : « Tout est sous contrôle » ou « **3 notes critiques** » + phrase nommant la plus ancienne).
4. Deux cartes `auto-fit minmax(380px,1fr)` : **RÉCEMMENT CONSULTÉES** (7 derniers jours ▾) et **LES PLUS CONSULTÉES** (30 derniers jours ▾) ; lignes : icône 32px, titre 14px 500, sous-ligne 12.5px (délai / nb consultations), glyphe + état à droite ; lien « → Voir toutes… ».
5. Carte **VOS UNIVERS** : tableau (icône + nom · n notes · 5 compteurs avec glyphe, mono 13px, chiffre grisé si 0 · barre empilée 8px des 5 états · chevron → page univers). En-têtes 12.5px ; « Bientôt » abrégé.

### 3. Page d'un univers — route `/univers/{id}`, `src/vues/V-10`
Fil : Accueil › Univers › **Nom**. Header droit : Créer + avatar.
1. **Bandeau** (carte) : icône 80px sur voile vert, label UNIVERS, nom Literata 42px 600 **vert**, description (16.5px, max 60ch), stats en ligne (icône verte + chiffre 600 + libellé : notes · domaines · contributeur · dernière activité) ; bouton contour « Cartographie des univers → » à droite. Sous-bande séparée par un trait : compteurs des états non nuls (glyphe, chiffre Literata 24px, libellé minuscule) et « **N** notes au total » à droite.
2. Carte **DOMAINES** : en-tête (label, « 4 domaines », sélecteur « Activité récente ▾ ») ; une ligne par domaine, grille `40px 1fr auto auto auto 24px` : icône 40px voile, nom 16px 600 + description 13.5px grise, « **143** notes », trois compteurs (à jour / bientôt / en retard — la couleur du dernier est celle du pire état présent), dernière activité 13px `--c-encre-4`, chevron. Domaine vide : « — » partout. Clic → page domaine.
3. Deux cartes : **À SURVEILLER** (alertes de l'univers, ou « Rien à surveiller… » avec coche verte ; « → Voir toutes les notes à surveiller ») et **ACTIVITÉ RÉCENTE** (fil vertical : disque 24px coloré avec icône blanche — coche verte vérification, crayon vert modification, + création, horloge ambre échéance, flèche grise import — titre « **Type** — objet », « par X · il y a … », badge gris Vérification / Note / Vivacité / Import).

### 4. Page d'un domaine — route `/univers/{u}/{d}`, `src/vues/V-11`
Fil : Accueil › Univers › Substack › **Articles**.
1. **Bandeau** avec **filet gauche vert 4px** : label DOMAINE, nom Literata 42px 600 encre, phrase Literata 17px « Le domaine Articles de l'Univers **Substack**. » + description, stats (notes · contributeur · dernière activité) ; à droite « **+ Nouvelle note** » (vert plein), « Importer », « Exporter », ⋯. En bas du bandeau, une bande encadrée : compteurs par état non nul (glyphe, chiffre Literata 22px, libellé) séparés par des traits, « **N** notes au total » à droite.
2. Deux cartes : **CONTENU DU DOMAINE** (tuiles Notes / Dossiers / Fiches / Signets : icône 32px, libellé, chiffre Literata 26px, barre basse 3px verte si > 0, grise sinon ; puis EXPLORER : « Cartographie — Voir les relations et dépendances », « Carte mentale — Visualiser l'arborescence du domaine ») et **À SURVEILLER** (mêmes alertes, le détail nomme la note concernée).
3. Deux cartes : **NOTES LES PLUS CONSULTÉES** (7 jours ▾ ; « 01 » mono, titre 14.5px 500, glyphe + état dessous, « 5 vues » à droite) et **ACTIVITÉ RÉCENTE** (même fil que l'univers).

### 5. Lecture d'une note — route `/notes/{id}`, `src/vues/V-14`, `src/lib/lecture/`
Header droit : « Dernière modification / il y a 4 jours par X » (icône pulsation verte), bouton **Modifier** (vert plein, icône crayon), bouton ⋮ (40px contour) → menu 250px : *Marquer comme vérifiée* (vert), *Signaler à réviser* / *Lever la demande de révision*, ─, Historique des versions, Exporter, Imprimer, ─, Supprimer (rouge).
Grille centrale `190px sommaire | minmax(0,1fr) document`, padding 24px, gap 40px.
- **Sommaire** (sticky, apparaît au niveau du titre) : label SOMMAIRE, liste bordée à gauche d'un trait 1px ; entrée = numéro mono « 01 » + titre 13px (+ sous-titre 11.5px gris) ; l'entrée active porte une **barre gauche 2px verte** et le texte vert 600. Suivi au défilement ; clic → défilement doux.
- **Sélecteur de registre** (bordure basse 1px) : onglets « 📖 Référence » « ⚙ Opérationnel » (padding 13px 22px, actif : fond `--c-papier-2`, soulignement 2px vert, texte vert 600 ; l'icône est un SVG, pas un emoji). **Sans Opérationnel : un seul onglet + bouton contour « + Créer la version opérationnelle » à droite. Jamais d'onglet désactivé.**
- **Ligne de vivacité** (13.5px, séparateurs verticaux 1px) : glyphe + libellé 600 en couleur · « Vérifiée le 13 août 2026 par X » · « Prochaine vérification : 11 nov. 2026 (dans 67 jours) » ou « Échéance dépassée de 4 jours (1 sept. 2026) » · « Voir l'historique ⌄ » · pastille « Révision demandée · X » si active. Fond selon l'attention (voir plus haut).
- **Titre** Literata 40px 500, max 32ch, `text-wrap: pretty`, marge haute 34px.
- **Étiquettes** : chips 8px 14px, fond voile vert, texte vert 500, 13.5px ; « + Ajouter une étiquette » en contour.
- **Métadonnées** : ligne d'items séparés par un trait vertical — icône 22px + valeur 14px 500 + libellé 12.5px gris : date de création · rédacteur · consultations (« 2 consultations / 2 sur les 30 derniers jours ») · version.
- Séparateur documentaire (trait – petit glyphe vert – trait), résumé 18px / 1.65, max 72ch.
- **Sections** : h2 Literata 27px 500 avec numéro vert « 01 » ; paragraphes 16.5px / 1.7 max 75ch ; `code` inline mono 14px fond `#efeee8` ; **bloc de code** : bordure, rayon 8px, fond `--c-fond`, en-tête « bash · Copier » 12.5px, pre mono 13.5px / 1.6, commentaires `#` en vert ; listes ; **étapes** (Opérationnel) : cases à cocher dans des cadres 6px ; **avis** info (`#eef3ef` / `#2d4a3a`, marque « i ») et danger (`#f7e7e3` / `#7a2a1c`, marque « ! ») ; **tableau** (en-têtes mono 11px uppercase, cellules mono 13px) ; **schéma mermaid** rendu : figure bordée, en-tête « schéma · mermaid · légende », SVG pleine largeur, `<details>` « Source mermaid » ; « Notes et explications complémentaires » en `<details>` sous une section.
- Pied : « Cette note repassera automatiquement à « À vérifier » le 11 nov. 2026. » + lien discret « Planche des états de vivacité ».
- **Colonne contexte** (340px, padding 28px 24px, sections séparées par des traits) : ACTIONS (Modifier la référence · Modifier/Créer l'opérationnel · Historique des versions · Exporter · Imprimer · Supprimer en rouge ; icônes 16px) · CONTEXTE (Univers, └ domaine cliquable, « → 4 autres notes dans ce domaine ») · RELATIONS (« 3 notes liées › ») · PIÈCES JOINTES (0 · + Ajouter) · RÉTROLIENS (0) — **jamais de grande zone vide** · carte **VIVACITÉ (RÉFÉRENCE)** : glyphe + état 17px 600, « Vérifiée le … », **frise** (trait plein coloré de la vérification à aujourd'hui, pointillé jusqu'à l'échéance ; trois ronds : vérifiée, aujourd'hui avec halo, échéance en anneau ; légendes « 13 août 2026 / vérifiée », « aujourd'hui / J−67 », « 11 nov. 2026 / échéance ») · carte **RAPPEL AUTOMATIQUE** sur fond `--c-fond` (icône réveil, texte 13.5px).
- Quand l'utilisateur bascule sur Opérationnel, **tout** ce qui concerne la vivacité (ligne, carte, frise, rappel, menu) reflète le registre Opérationnel.

### 6. Historique — route `/notes/{id}/historique`, `src/vues/V-15`
Header droit : « ← Retour à la note ». Label HISTORIQUE, titre Literata 32px, phrase d'explication ; onglets **Tous / Référence / Opérationnel** ; fil vertical (trait 1px) d'événements du plus récent au plus ancien : glyphe d'état (ou carré gris pour une version), date 14px 500 + registre mono, titre 15.5px 500 (coloré si état ≥ À vérifier), détail 14px gris ; pour une version : pastille mono « v1.0.0 » + « Comparer avec la version précédente » → panneau deux colonnes « − AVANT » (voile rouge) / « + APRÈS » (voile vert).
Types d'événements : vérification, création/modification de version, passage automatique d'état, demande de révision, création de l'Opérationnel.

### 7. Planche des états — route interne / V-41 (bibliothèque)
Cinq lignes : nom + règle ; ligne compacte rendue dans l'état ; « rail compact » (glyphe 12px + « dans 67 j » / « 21 j de retard »). Encadré « Cycle » qui explicite la logique et le seuil.

## Interactions et états à implémenter

- Bascule Référence / Opérationnel : recharge le corps, le sommaire (retour en tête), la vivacité.
- « Créer la version opérationnelle » : crée le registre (vérifié à l'instant, validité propre, 21–30 j), sélectionne l'onglet, ajoute un événement d'historique, toast « Version opérationnelle créée — son propre cycle de vivacité démarre ».
- « Marquer comme vérifiée » : date de vérification = aujourd'hui pour le **registre courant**, lève une éventuelle demande de révision, événement d'historique, toast « Vérifiée à l'instant — le cycle repart pour 90 jours ».
- « Signaler à réviser » : pose la demande (état À revoir, pastille « Révision demandée · auteur »), événement ; le même menu propose « Lever la demande ».
- Copier un bloc de code : libellé → « Copié » 1,6 s.
- Toast : fond `--c-encre`, texte papier 13.5px 500, coche verte, sticky bas centre, 2,6 s.
- Menu ⋮ : se ferme à toute navigation.
- Toutes les listes : ligne entière cliquable, survol fond `--c-papier-2` / `#f5f4ef`.
- Aucune animation continue. `prefers-reduced-motion` respecté (déjà dans socle).

## Données et modèle

- Par registre : `verifiee` (date), `validite` (jours), `par` (compte), corps, sommaire.
- Par note : univers, domaine, dossier, étiquettes, créée le, auteur, modifiée (date + par), consultations (cumul + 30 j), version, relations (n), pièces jointes (n), rétroliens (n), événements d'historique `{date, registre, type: verif|version|etat, etat?, titre, detail, version?, avant?, apres?}`.
- Par univers/domaine : description, répartition par état (5 compteurs), dernière activité, événements.
- Configuration : `seuilBientot` (10), seuils « À revoir » (14 j de retard) et « Obsolète » (90 j de retard) — à exposer dans la console avec les seuils existants.

## Ordre de livraison conseillé

1. Jetons (`socle.css`) + composant glyphe de vivacité + fabrique 5 états (`fraicheur.ts`, tests).
2. Coquille : sidebar arborescente, header, tiroirs.
3. V-14 lecture : sélecteur de registre, ligne de vivacité, document, colonne contexte.
4. V-15 historique.
5. V-07 accueil, V-10 univers, V-11 domaine.
6. Planche des états (V-41) et console des seuils.

## Ce qu'il ne faut pas faire

- Pas de nouveau bleu, pas de violet, pas de dégradés, pas d'emoji.
- Pas de cartes imbriquées, pas de tableau de métadonnées horizontal, pas de panneau de vivacité de 200px, pas de courbe.
- Pas d'onglet Opérationnel désactivé.
- Pas de grande zone vide « Aucun rétrolien… » : un compteur suffit.
- Pas de graphe de cartographie affiché en permanence.
- Ne pas casser les câblages existants (`cablage.ts`) : les libellés d'actions du dépôt restent (« Modifier la référence », « Historique des versions », …).

## Contenu du package

| fichier | rôle |
|---|---|
| `README.md` | ce document : arbitrages, jetons, écrans, interactions, ordre de livraison |
| `PROMPT-claude-code.md` | consigne de démarrage à coller dans Claude Code |
| `BRIEF-UI-UX.md` | le brief d'origine (le « pourquoi ») |
| `SPEC-vivacite.md` | règles exactes des 5 états, libellés, frise, événements, tests attendus |
| `SPEC-modele-navigation.md` | entités, champs, routes, états d'interface, deep links du prototype |
| `Codicillus - Lecture de note.dc.html` + `support.js` + `polices.css` | le prototype interactif (6 vues) ; ouvrir le `.dc.html` dans un navigateur, depuis ce dossier |
| `reference/logique-prototype.js` | la logique du prototype extraite (données d'exemple, `ETATS`, `etatDe()`, construction des pages) — à lire, pas à copier |
| `captures/*.png` | **captures du prototype validé** (référence visuelle prioritaire) : 01 accueil, 02 univers, 03 domaine, 04 note Référence, 05 note Opérationnel (À vérifier), 06 historique, 07 planche des états, 08 note PostgreSQL (À revoir, sans opérationnel), 09 largeur 900 px (tiroirs) |
| `maquettes/*.png` | maquettes d'intention : 01 note, 02 accueil, 04 univers, 05 domaine |
| `github.md` | dépôt et fichiers source lus pour concevoir la refonte |

Ouvrir une vue précise du prototype : ajouter à l'URL `#vue=…` (et `&largeur=1536&hauteur=1150` pour reproduire les captures) — ex. `#vue=note&note=claude&registre=operationnel` (voir `SPEC-modele-navigation.md`).
