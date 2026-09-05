# BRIEF UI/UX — REFONTE DE L'INTERFACE CODICILLUS

(Brief d'origine, remis par le propriétaire du produit le 5 septembre 2026. Les arbitrages pris depuis sont dans `README.md` et priment sur ce texte en cas d'écart : vocabulaire mixte — Univers / Domaine / Registre / Étiquette / Vivacité —, cinq états, actions de vérification dans le menu ⋮.)

## 0. Résumé exécutif

**Codicillus** est une application de knowledge management destinée à stocker, organiser, consulter, faire évoluer et maintenir des connaissances documentaires. L'application ne doit pas être perçue comme un simple CMS ou un gestionnaire de notes.

Son enjeu différenciant est que **la connaissance est considérée comme vivante** : une information est créée ; elle peut être vérifiée ; elle est considérée comme fiable pendant une durée déterminée ; le temps passe ; elle arrive à échéance ; elle repasse automatiquement en statut « À vérifier » ; elle peut ensuite être revalidée et repartir dans un nouveau cycle.

Deuxième particularité : la coexistence possible de deux représentations d'une même connaissance — **Note de référence** (canonique) et **Version opérationnelle** (déclinaison destinée à l'usage concret). La refonte doit faire émerger ces deux concepts sans transformer l'application en dashboard complexe.

## 1. Objectif général

La version actuelle donne une impression de back-office / application métier / CMS administratif. L'objectif n'est pas de reproduire Notion, Linear ou Obsidian. Trois idées : la connaissance comme **document** (que l'on lit, pas une fiche CRUD) ; comme **système vivant** (état de vivacité qui évolue) ; comme **objet contextualisé** (espace, relations, versions, historique).

## 2. Principe directeur

« Codicillus doit ressembler à un instrument de connaissance, pas à un logiciel de gestion de connaissance. »

À réduire : cadres, bordures, cartes imbriquées, labels en capitales trop nombreux, informations secondaires omniprésentes, boutons d'administration, tableaux de métadonnées, éléments décoratifs.
À renforcer : hiérarchie éditoriale, lisibilité, respiration, temporalité de la connaissance, statut documentaire, navigation entre versions, contexte de la note.

## 3. À conserver fonctionnellement

Navigation par espaces, recherche, notes, sommaire, modification de la référence, modification de l'opérationnelle, historique des versions, export, impression, suppression, relations, pièces jointes, rétroliens, statut de vérification, historique de vivacité, création d'une version opérationnelle. Leur **niveau de présence visuelle** est rééquilibré.

## 4. Architecture de la page

Trois zones : SIDEBAR (navigation, espaces, récents) · DOCUMENT (version / vivacité / titre / contenu) · CONTEXTE (actions, relations, métadonnées, vivacité). **La colonne centrale domine.** Le document est le produit.

## 5–6. Sidebar gauche

Devient une navigation de workspace : logo + « Vos connaissances. Vivantes. », recherche, ESPACES (icône, nom, compteur discret), « + Créer un espace », RÉCENTS, « → Voir tous les récents ». Espace actif : fond très légèrement teinté, texte vert profond, éventuellement marque verticale. Pas de gros blocs colorés.

## 7. Identité visuelle

Palette : ivoire / blanc cassé, gris légèrement chaud ou verdâtre, vert profond, vert sauge, gris graphite. Le vert est la couleur fonctionnelle et identitaire. Pas de bleu SaaS.
Couleur et vivacité : À jour = vert profond ; À vérifier = vert/ambre ; À revoir = orange/rouge discret ; Obsolète = rouge marqué. **La couleur n'est jamais le seul moyen** : toujours couleur + forme + libellé + information temporelle.

## 8. Typographie

Document : serif contemporaine (titres, sections). Interface : sans-serif lisible (navigation, boutons, métadonnées). Technique : monospace (code, commandes, chemins).

## 9. Pas de « faux éditorial »

Ni journaling, ni bibliothèque ancienne, ni manuscrit, ni parchemin, ni botanique, ni texture papier. La référence au codex est conceptuelle. L'identité vient du système de connaissance.

## 10. Header

Extrêmement léger : fil d'Ariane `Accueil › Claude › slug`, « Dernière modification il y a 4 jours par … », [Modifier] [⋮].

## 11–12. Référence / Opérationnelle

Élément de premier niveau, au-dessus du document. Deux onglets ; onglet actif clairement identifiable (ligne / fond léger / soulignement vert). **Sans version opérationnelle : un seul onglet + CTA « + Créer la version opérationnelle » visible ; jamais d'onglet désactivé.** Logique : quelle version ? → quel état de vivacité ? → puis-je faire confiance ? → je lis.

## 13–15. Vivacité : concept central

Une vérification donne une période de validité ; à l'échéance la note repasse automatiquement à « À vérifier ». Le grand panneau « VIVACITÉ DE CETTE DOCUMENTATION » est abandonné. **Indicateur compact** sous le switch : `● À jour | Vérifiée le 13 août 2026 | Prochaine vérification : 13 nov. 2026 (dans 88 jours) | Voir l'historique ↓`. Très facile à voir, très peu coûteuse en espace.

## 16. Vivacité dans la sidebar droite

Version détaillée mais compacte : état, « Vérifiée le … », frise `━━━━●━━━○` avec vérifiée / aujourd'hui / échéance. Complémentaire, pas redondante.

## 17–18. Historique

Pas de courbe (trompeuse : suggère une métrique continue). **Timeline d'états** : `● 13 août 2026 À jour Vérifiée` … `◐ À vérifier — échéance dépassée de 2 jours` … `! À revoir` … `○ Obsolète`. L'historique complet vit dans une **vue dédiée** (versions, modifications, validations, changements de statut, dates, auteur, commentaires, comparaison).

## 19–20. Vivacité automatique et états

Expliciter la logique quand elle apporte de la valeur : « Cette note repassera automatiquement à « À vérifier » le 13 novembre 2026. » États : ● À jour · ◐ À vérifier · ! À revoir · ○ Obsolète (+ « bientôt à vérifier » comme état intermédiaire, §43–44).

## 21–24. Titre, tags, métadonnées, contenu

Titre : grand, éditorial, largeur limitée. Tags : petits, arrondis, fond très léger, texte vert/gris, « + Ajouter un tag » si pertinent. Métadonnées : plus de table horizontale ; une ligne élégante icône + valeur + libellé (création, rédacteur, consultations, version). Ordre du document : version → vivacité → titre → tags → métadonnées → résumé → sections numérotées 01, 02… avec blocs de code.

## 25–27. Sommaire, colonne centrale, code

Sommaire simplifié `01 Prérequis système / 02 Installation (installateur natif…)` ; section active repérée par une **barre verticale**. Colonne centrale : largeur de lecture maîtrisée, grands espacements, blocs techniques larges, très peu de bordures. Code : bloc légèrement teinté, en-tête `bash … Copier`.

## 28–32. Sidebar droite

Contextuelle et secondaire : ACTIONS (Modifier la référence, Modifier l'opérationnel, Historique des versions, Exporter, Imprimer, Supprimer) · CONTEXTE (espace › domaine) · RELATIONS (`3 notes liées ›`) · PIÈCES JOINTES (`0  + Ajouter`) · RÉTROLIENS (`0`) · VIVACITÉ (état, date, frise compacte) · RAPPEL AUTOMATIQUE. **Pas de grosse zone vide** pour un compteur à zéro.

## 33–36. Identité et métaphore

L'identité vient de : typographie éditoriale, vert profond, ivoire, marqueurs documentaires, timeline de vivacité, cycle Référence → Opérationnelle, états documentaires, métadonnées sobres. Métaphore : non pas « la connaissance pousse comme une plante » mais « la connaissance vit, évolue et doit être entretenue ». Signature : **Vos connaissances. Vivantes.**

## 37–40. Hiérarchie finale et registre

HEADER → RÉFÉRENCE / OPÉRATIONNELLE → VIVACITÉ (1 ligne) → TITRE → TAGS → MÉTADONNÉES → RÉSUMÉ → CONTENU. Quand on bascule sur Opérationnelle, le contenu change et la vivacité affichée est **celle de la version consultée**. Après création de l'opérationnelle, elle dispose de son propre cycle. Le lien référence → opérationnelle (« dérivée de ») n'est pas affiché en permanence : le switch suffit.

## 41. Responsive

Desktop large : trois colonnes. Moyen : sidebars réduites. Petit : le contexte devient un tiroir. Mobile : header → version → vivacité → titre → contenu ; sommaire et contexte en panneaux.

## 42. Micro-interactions

Discrètes. Pas de jauge animée, de pulsation, de compteur animé, de graphique dynamique. Interface calme.

## 43. États à designer

Vivacité : À jour, bientôt à vérifier, À vérifier, À revoir, Obsolète. Version : référence seule, référence + opérationnelle, opérationnelle sélectionnée, création. Historique : aucun, court, complet. Relations : aucune, quelques, nombreuses. Pièces jointes : aucune, une, plusieurs.

## 44. Attention progressive

Une documentation saine est silencieuse (`● À jour`). Près de l'échéance : légèrement plus visible (`◐ À vérifier bientôt · 6 jours`). En retard : attire clairement l'œil (`! À vérifier · 4 jours de retard`). Plus un document demande d'attention, plus l'interface attire l'œil.

## 45. Ce que l'utilisateur comprend en 3 secondes

1. Qu'est-ce que je lis ? 2. Quelle version ? 3. Puis-je lui faire confiance ? 4. Quand faudra-t-il s'en occuper ? Tout le reste est secondaire.

## 46. Avant → après

UI back-office → interface documentaire · cartes → respiration · table de métadonnées → métadonnées éditoriales · vivacité en gros panneau → compacte · historique dans sidebar → vue dédiée · courbe → timeline · actions très présentes → secondaires · sidebar catégorielle → workspace · illustrations → aucune décoration · couleurs génériques → vert identitaire · titre intégré → titre document · référence/opérationnelle peu visible → switch de premier niveau · statut isolé → cycle temporel explicite · « À jour » statique → « À jour jusqu'au… ».

## 47. Phases

1. Structure (sidebar, grille, header, switch, placement de la vivacité). 2. Document (typographie, titre, tags, métadonnées, contenu, code, sommaire). 3. Vivacité (statut, échéance, timeline, états, rappel, logique Référence / Opérationnelle). 4. Contexte (actions, relations, pièces jointes, rétroliens, historique). 5. Design system (couleurs, typographies, espacements, icônes, boutons, badges, états, responsive).

## 48–50. Critère de réussite et règle d'or

Réussite : « Je lis un document de connaissance sérieux, et je sais immédiatement si cette connaissance est encore fiable. »
Direction en une phrase : une interface éditoriale, calme et contemporaine, inspirée du document et de l'archive plutôt que du SaaS, dont l'identité repose sur la connaissance vivante : chaque information possède une version, un état de confiance et une durée de validité.
**Règle d'or : Ne décorez pas la connaissance. Visualisez son état.** Chaque élément graphique répond à une question réelle : qu'est-ce que je lis ? quelle version ? est-ce fiable ? quand dois-je le vérifier ? d'où vient cette connaissance ? à quoi est-elle liée ? qu'est-ce qui a changé ?
