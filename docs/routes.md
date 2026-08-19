# Inventaire des routes et des états

> **Lot T-006** — livrable de vague 0. Table `route → vue → états → exigences couvertes`, exhaustive sur les 41 vues.
>
> **Statut des sources.** Les 41 maquettes ne portent **aucun lien inter-vue**. Recensement exact de leurs 766 attributs `href` : **681** valent `"#"`, 41 pointent la feuille de polices, 34 sont des liens d'évitement intra-page (`#contenu`, `#travail`…), 5 sont des adresses externes de démonstration. La liaison n'est donc pas *lue* dans les maquettes, elle en est **dérivée**. Chaque route ci-dessous porte sa source. Ce qui n'était pas déductible a été porté à l'arbitrage : les six points sont clos, et le § « Arbitrages appliqués » dit par quel arbitrage. Ce document ne pose plus aucune question ouverte.
>
> **Ordre de préséance appliqué** (PLAN §15.1, D-08) : la maquette gelée l'emporte sur le cahier des charges. Les divergences relevées sont consignées au § « Contradictions relevées ».
>
> **Révision T-006b — 18 août 2026.** Les huit arbitrages de `docs/arbitrages.md` et les onze entrées de `docs/errata-cadrage.md` sont appliqués. Ces deux documents font autorité **au-dessus** de l'ordre de préséance ci-dessus, pour les seuls points qu'ils énumèrent (`CLAUDE.md`). Cinq arbitrages mordent sur cet inventaire : **ARB-001** (la forme raccourcie `/domaines/{domaine}` n'est pas implémentée ; l'unicité est portée par l'univers seul), **ARB-002** (la bibliothèque de composants est sous rôle administrateur, atteignable depuis la console qui y renvoie sans la contenir ; V-38, V-39 et V-40 cessent d'être des routes), **ARB-003** (le journal des imports ne sort pas de la console), **ARB-005** (articulation des deux régimes de refus), **ARB-007** (les trois routes mineures : pas de cartographie publique, `/guides/{identifiant}` servi tel quel, `?noeud=` ajouté). Le décompte du §9 est refait en conséquence.

---

## 1. Les cinq sources de l'adressage

| # | Source | Ce qu'elle fournit |
|---|---|---|
| S1 | **Adresses écrites en clair dans les maquettes** | `mockups/V-04-non-trouvee-public.html:2226-2228` affiche « Adresse demandée » : `/guides/reinitialiser-le-badge-daccess`, `/guides/plan-de-reprise-volet-bases`, `/guides/`. `mockups/V-26-non-trouvee-connecte.html:2612,2623,2631` affiche : `/notes/restaurer-une-sauvegarde-mariadb`, `/notes/bascule-telephonie-voip`, `/notes/comptes-a-privileges-production`. **Ce sont les seules adresses littérales du dépôt.** |
| S2 | **Paramètres d'état écrits par les maquettes** | `majAdresse()` : `?registre=` (V-03:1616, V-14:3959, V-37:3726, V-41:4766), `?version=` (V-15:2921), `#{ancre}` (V-03:1582, V-14:3925, V-15:2671). |
| S3 | **Fils d'Ariane rendus** | Appels `coquille({ fil: [...] })` dans 28 maquettes. Ils donnent la hiérarchie d'adressage segment par segment. |
| S4 | **Libellés de navigation de la coquille** | `mockups/V-37-coquille.html` — rail (`Accueil`, `Outils` : Cartographie / Carte mentale / Signets / Import, `Gestion` : Console), menu « Créer », menu utilisateur (`Mon profil`, `Console d'administration`, `Se déconnecter`), et les attributs `data-vers` qui nomment la vue cible. |
| S5 | **Cahier des charges** | RG-M03-02, RG-M03-03, RG-ACC-01…04, RG-M17-01, RG-M09-05, RG-M02-05…08 *(numérotation créée par E-05 sur les puces de §M02.6)*, §2.2, §4. |

### 1.1 La règle de dérivation appliquée

Trois règles, appliquées uniformément partout où S1 et S2 sont muettes.

**R1 — Le préfixe de ressource est le nom français pluriel de l'objet.**
Établi par S1 : `/notes/…` et `/guides/…`. Étendu par uniformité à `/univers/…`, `/dossiers/…`, `/signets/…`, `/console/…`. C'est l'application d'une convention posée par la maquette, pas un choix.
*Un préfixe que la première rédaction dérivait ainsi n'a plus d'emploi* : `/domaines/…`, supprimé par **ARB-001** (§2.2). `/bibliotheque` subsiste, mais comme **segment terminal** et non comme famille : ARB-002 en fait une adresse unique, sans sous-routes (§3.7).
*Conséquence directe* : l'exemple `/u/production/infrastructure/n/restaurer-…` de `PLAN-DE-REALISATION.md §4.2` **n'est pas retenu** — voir §7.

**R2 — Un segment ajouté au fil d'Ariane est un segment ajouté au chemin ; un fil qui n'ajoute rien n'ajoute pas de segment.**
Vérifiée sur S3 : V-12 ajoute « Notes » (`…/notes`), V-22 ajoute « Signets » (`…/signets`), V-16 ajoute « Comparaison » (`…/comparaison`), V-18 ajoute « Opérationnel » (`…/operationnel`), V-20 ajoute « Par type » (`…/par-type`), V-23 ajoute « Nouveau » (`…/nouveau`), les dix vues de console ajoutent « Console » puis leur section. À l'inverse **V-15 rend exactement le même fil que V-14** (`V-15:3269` = `V-14:4366`) : l'historique n'a pas de chemin propre, il est un état de la lecture — ce que confirme son classement « superposée » à l'Annexe Récapitulatif du brief.
*Limite connue* : le fil de V-17 (`["Accueil","Production",domaine,"Modifier"]`, `V-17:3559`) omet la note éditée. Le fil est ici moins précis que l'adresse ne doit l'être ; l'adresse conserve l'identifiant de la note.

**R3 — Un état qu'aucune maquette n'écrit dans l'adresse et qu'aucune règle n'exige d'y écrire est une préférence, pas une route.**
Appliquée au dépliage du rail (`codicillus.rail.deplies`, V-37:3110), à l'aide de première visite (`codicillus.aide.recherche`, V-07:3882) et, par uniformité, à la densité de V-12 et à l'escamotage du rail : stockage local, jamais l'adresse.

---

## 2. Adressage canonique — comment RG-M03-02 et RG-M03-03 sont satisfaites

### 2.1 RG-M03-03 — stabilité de l'adresse d'une note

> « L'adresse d'une note reste stable dans le temps, même si la note change de dossier **ou de domaine**. »

**L'adresse d'une note est plate : `/notes/{identifiant}`.** Aucun segment de rangement (univers, domaine, dossier) n'y figure. Déplacer la note dans un autre dossier, un autre domaine ou un autre univers **ne change pas son adresse** : la règle est satisfaite par construction, sans mécanisme de redirection.

C'est ce qu'écrit la maquette : `V-26:2612` affiche `/notes/restaurer-une-sauvegarde-mariadb` pour une note qui appartenait à *Infrastructure › Exploitation › Sauvegardes* (`V-26:2617`) — le chemin de rangement est affiché dans le corps de la page, **jamais dans l'adresse**.

L'identifiant est celui décrit au CDC §3.2 : « Identifiant lisible — dérivé du titre, unique, **stable**, utilisé dans l'adresse ». Il est dérivé du titre à la création et ne suit pas les renommages ultérieurs, faute de quoi la stabilité exigée serait perdue.

### 2.2 RG-M03-02 — l'adresse canonique d'un domaine inclut son univers

> « L'adresse canonique d'un domaine inclut son univers. Une adresse ancienne ou raccourcie est **redirigée**. En cas d'ambiguïté, le produit **demande à l'utilisateur de choisir**. »

| Forme | Adresse | Comportement |
|---|---|---|
| **Canonique** | `/univers/{univers}/{domaine}` | Sert la page (V-11). |
| **Raccourcie** | `/domaines/{quoi-que-ce-soit}` | **Non implémentée** (ARB-001). Rend la page non trouvée — **404 V-26** en connecté, **404 V-04** en anonyme — par le chemin de code unique d'ADR-007 : refus et inexistence y sont indiscernables, comme partout ailleurs. |
| **Ancienne** | `/univers/{ancien-univers}/{domaine}` | Le domaine a été rattaché à un autre univers (UC-M14-02) → **redirection 308** vers l'univers courant. |

Justification de la forme canonique : le fil d'Ariane de V-11 est `["Accueil", courant.univers, courant.nom]` (`V-11:1944`) — trois segments, univers puis domaine. R1 donne le préfixe `/univers/`. RG-STR-02 (« l'identifiant lisible d'un domaine est unique **au sein de son univers**, pas globalement ») est exactement ce qui rend l'univers obligatoire dans l'adresse — et ce qui rendrait une forme raccourcie ambiguë, si le produit en émettait une.

**Ce qu'ARB-001 arrête.** L'unicité est portée par l'**univers seul** : deux univers ne peuvent pas porter le même nom — contrainte bloquante appliquée à l'écriture, au schéma —, tandis que le domaine n'en porte aucune au-delà de son univers. Deux univers différents peuvent parfaitement contenir un domaine homonyme : « Infrastructure » dans *Production* et dans *Support* sont deux domaines distincts et légitimes.

Il en découle, pour RG-M03-02 :

- **clause 1** — l'adresse canonique inclut l'univers : **tenue**, par `/univers/{univers}/{domaine}` ;
- **clause « adresse ancienne redirigée »** — **tenue**, et pleinement applicable : elle vise le rattachement d'un domaine à un autre univers (UC-M14-02) et les renommages, cas où l'adresse d'origine est sans ambiguïté (§5.1) ;
- **clause « raccourcie redirigée »** et **clause de désambiguïsation** — **sans objet**, faute de forme raccourcie à rediriger. Le produit n'émet jamais `/domaines/{domaine}` ; la clause n'a donc aucun déclencheur. Elle est **consignée comme sans objet et ne sera jamais implémentée** (E-09, §5.3).

`RG-M03-02` n'est pas fautive pour autant : elle est cohérente, et c'est l'absence de forme raccourcie qui prive sa seconde moitié d'emploi.

### 2.3 Ce que devient l'exemple de `PLAN-DE-REALISATION.md §4.2`

L'exemple `/u/production/infrastructure/n/restaurer-une-sauvegarde-postgresql-depuis-barman` **n'est pas retenu**, pour deux raisons distinctes :

1. **Il est contredit par la maquette.** S1 écrit `/notes/{identifiant}`, pas `/u/…/n/…`. L'ordre de préséance (PLAN §15.1, D-08) tranche en faveur de la maquette.
2. **Il enfreint RG-M03-03.** Une adresse de note contenant son univers et son domaine change à chaque changement de domaine. La règle exige la stabilité ; seule une adresse plate la donne sans machinerie de redirection permanente.

Ce qui est conservé de l'exemple : l'idée que l'univers précède le domaine — mais elle s'applique aux **routes de rangement** (univers, domaine, dossier, liste, signets), pas à la note.

---

## 3. Table maîtresse

**Niveaux d'accès.** `anonyme` · `connecté` (compte local, quel que soit le rôle) · `lecteur` / `rédacteur` / `gestionnaire` (droit effectif de dossier, RG-DRO-01/02) · `administrateur`.

**Comportement en cas de refus.** Sauf mention contraire, tout refus produit la réponse d'inexistence : **HTTP 404 + V-04** en anonyme, **HTTP 404 + V-26** en connecté, par le même chemin de code que l'inexistence (RG-ACC-04, RG-NF-04, ADR-007). Aucune route ne rend de page « accès refusé ». Session expirée : redirection vers `/connexion?motif=session-expiree&suite={chemin}` (RG-ACC-03).

**Deux régimes de refus, et ils ne portent pas sur le même objet (ARB-005).** Le régime **indiscernable** de `RG-ACC-04` porte sur la résolution d'une **ressource entière** — une adresse : corps, en-têtes, code **et temps de réponse** identiques, un seul chemin de code. L'**état « sans droit »** porte sur une **zone** d'une page que l'utilisateur a le droit d'ouvrir, où l'existence de la ressource porteuse lui est déjà connue : la signaler ne révèle rien. Toute la colonne « Niveau d'accès » ci-dessous relève du premier régime ; la colonne « États » du second. **En cas de doute, l'indiscernable l'emporte** — le doute ne se résout jamais en faveur de l'information révélée. Détail au §6.

### 3.1 Espace public et racine

| Route | Vue | Niveau d'accès | États | Exigences | Source de l'adresse |
|---|---|---|---|---|---|
| `/` | **V-01** Accueil public *(sans session)* | anonyme | 7 — État : nominal · chargement · aucun contenu public · guides en erreur ; Frappe : champ vide · « mot de passe » · sans résultat | UC-M17-01, RG-M17-01…04, RG-M18-03 | BRIEF V-01 « Points d'entrée : **adresse racine du produit sans session active**. Également après une déconnexion » ; RG-ACC-02 |
| `/` | **V-07** Accueil contributeur *(avec session)* | connecté | 10 — Profil : référent · administrateur · lecture seule ; État : nominal · chargement · rien en attente · activité en erreur · aucune note ; Aide : première visite | UC-M01-01, RG-M01-01…03, RG-M18-03, RG-M18-04 | S3 `coquille({ fil: ["Accueil"] })` (`V-07:4231`) ; S4 rail `Accueil` → `data-vers="Accueil contributeur — vue V-07"` ; BRIEF V-07 « Après connexion · clic sur le logo ou Accueil » ; tous les fils d'Ariane du produit commencent par le segment cliquable **Accueil** |
| `/recherche` | **V-02** Recherche publique *(sans session)* | anonyme | 5 — État : nominal · chargement ; Requête : « mot de passe » · « support » · sans résultat | UC-M02-02, UC-M02-05, RG-M02-04, RG-M17-01 | S3 `fil: ["Accueil","Recherche"]` (`V-08:2370`) ; BRIEF V-02 « Points d'entrée : … ou **adresse partagée contenant une requête** » ; V-02 est V-08 « amputée de ce qui n'a pas de sens sans compte » — même fonction, périmètre restreint par RG-M02-04, donc même adresse |
| `/recherche` | **V-08** Recherche *(avec session)* | connecté | 8 — Droits : écriture · lecture seule ; État : nominal · chargement · sans résultat · trop de résultats ; Sens : indisponible | UC-M02-02…07, RG-M02-01…03, **RG-M02-05…08** *(E-05)* | S3 `fil: ["Accueil","Recherche"]` (`V-08:2370`) ; S4 champ de recherche de la barre supérieure |
| `/guides/{identifiant}` | **V-03** Lecture publique | anonyme **et connecté** — servi **tel quel** dans les deux cas (ARB-007, A-05) | 5 — Fraîcheur : frais · vieillissant · obsolète ; Registres : « En bref » existante · absente | RG-M17-01…03, UC-M04-02, UC-M04-03, RG-M04-05, RG-M18-17 | **S1** — `V-04:2226-2227` affiche `/guides/{identifiant}` comme adresse demandée |
| *(toute adresse non résolue)* | **V-04** Page non trouvée (public) | anonyme | 3 — Cas d'arrivée : adresse inexistante · note existante non publique · adresse racine erronée | RG-ACC-04, RG-NF-04, RG-M17-01, RG-M18-14 | Pas de route propre : réponse **404** rendue **à l'adresse demandée**, qui reste affichée (`V-04:715` « Adresse demandée »). `/guides/` nu en fait partie (`V-04:2228`, « adresse racine erronée ») : il n'existe pas d'index public des guides |

> **`/guides/{identifiant}` en session — ARB-007, A-05.** Une seule adresse, un seul rendu : la session ne change ni la route, ni la vue, ni les états. Pas de redirection vers `/notes/{identifiant}`, pas de bandeau « vue publique ». Le motif est double : la vérification « voir ce que voit le public » avant publication est un usage réel, et toute autre option créerait soit une seconde adresse sans canonique désignée, soit un état de V-03 qu'aucune planche ne déclare — donc hors du protocole de comparaison visuelle.

> **Point dur de cette famille.** Les deux premiers cas de la planche de V-04 — *adresse inexistante* et *note existante non publique* — doivent produire un rendu **strictement identique** ; le commentaire de la maquette (`V-04:2219`) le désigne comme « la vérification la plus importante de cette vue ». C'est RG-ACC-04 rendue mesurable.

### 3.2 Authentification

| Route | Vue | Niveau d'accès | États | Exigences | Source de l'adresse |
|---|---|---|---|---|---|
| `/connexion` | **V-05** Connexion | anonyme | 6 — Arrivée : page protégée · session expirée · accès direct ; Issue : réussite · identifiants refusés · trop de tentatives | UC-M16-01, RG-M16-01, RG-ACC-03, RG-NF-07 | BRIEF V-05 « Points d'entrée : lien discret depuis l'accueil public · **redirection depuis une page protégée** · expiration de session » ; S4 menu utilisateur `Se déconnecter` → `data-vers="Déconnexion — vue V-05"` |
| `/mot-de-passe-oublie` | **V-06** Réinitialisation, étapes 1–2 | anonyme | 4 des 8 — Étape : 1 identifiant · 2 envoi ; Compte : connu · inconnu | UC-M16-04, RG-ACC-04 | BRIEF V-05 « Récupération : lien vers la réinitialisation » ; BRIEF V-06 « parcours guidé en étapes visibles » |
| `/mot-de-passe-oublie/{jeton}` | **V-06** Réinitialisation, étapes 3–4 | anonyme (porteur du jeton) | 4 des 8 — Étape : 3 nouveau · 4 terminé ; Lien : expiré ; + succès | UC-M16-04, RG-M16-01 | Déduit de l'état *Lien expiré* de la planche (`c-expire`) : un lien expirable est un lien porteur d'un jeton, donc une adresse distincte de l'étape 1 |
| `/deconnexion` | *(aucune — action)* | connecté | — | UC-M16-02, RG-ACC-02 | S4 menu utilisateur `Se déconnecter`. Atterrit sur `/` (espace public), jamais sur une page d'erreur |

> **États indiscernables de V-06.** *Identifiant inconnu* rend le **même écran** que *identifiant connu* à l'étape 2 (BRIEF V-06, « message identique au succès, pour ne pas révéler l'existence d'un compte »). Même exigence de non-divulgation que V-04.

### 3.3 Rangement — univers, domaines, dossiers

| Route | Vue | Niveau d'accès | États | Exigences | Source de l'adresse |
|---|---|---|---|---|---|
| `/univers/{univers}` | **V-10** Page d'un univers | connecté (au moins un domaine lisible) | 7 — Droits : écriture · lecture seule ; Univers : Production · Projets ; État : nominal · sans domaine · chargement | UC-M01-02, RG-M01-04, RG-STR-01, UC-M03-02 | S3 `fil: ["Accueil", courant.nom]` (`V-10:1826`) + R1 |
| `/univers/{univers}/{domaine}` | **V-11** Page d'un domaine | connecté + lecteur | 8 — Domaine : 6 modules · 1 module · Poste de travail ; Profil : référent · administrateur · lecteur ; État : nominal · sans note | UC-M01-03, RG-M01-04, RG-STR-06, **RG-M03-02** | S3 `fil: ["Accueil", courant.univers, courant.nom]` (`V-11:1944`) + R1. **Forme canonique** au sens de RG-M03-02, et **seule forme** publiée depuis ARB-001 |
| `/univers/{univers}/{domaine}/notes` | **V-12** Liste des notes | connecté + lecteur | 7 — Domaine : Infrastructure · Poste de travail ; Arrivée : sans filtre · depuis la barre (obsolètes) · depuis l'accueil (brouillons) ; État : nominal · domaine sans note | UC-M03-03, RG-M18-03 | S3 `fil: [..., courant.nom, "Notes"]` (`V-12:2292`) → R2 |
| `/univers/{univers}/{domaine}/dossiers/{chemin…}` | **V-13** Page d'un dossier | connecté + lecteur (écriture selon droit effectif) | 6 — Dossier : Exploitation · Sauvegardes · dossier vide ; Droit effectif : gestionnaire · rédacteur · lecteur | UC-M03-04…06, RG-M03-04, RG-DRO-01…05, RG-STR-04, RG-STR-05 | S3 `fil: ["Accueil","Production", DOMAINE].concat(chemin)` (`V-13:2033`) ; le segment `dossiers` vient de R1 et lève la collision avec les mots réservés `notes` et `signets`. Le `{chemin…}` est la suite des identifiants de dossiers, jusqu'à 10 niveaux (RG-STR-04), conforme à la représentation `["infra","infra/exploitation","infra/exploitation/sauvegardes"]` de `STACK-TECHNIQUE.md §4.2` |
| `/univers/{univers}/{domaine}/signets` | **V-22** Signets | connecté + lecteur | 6 — Domaine : Infrastructure · Applications · sans signet ; Droits : écriture · lecture seule ; Rappel de sortie : affiché | UC-M11-01, RG-M11-01, RG-M11-02, RG-STR-06 | S3 `fil: [..., courant.nom, "Signets"]` (`V-22:2948`) → R2 ; S4 rail `Signets` |
| `/univers/{univers}/{domaine}/signets/nouveau` | **V-23** Formulaire de signet, création | connecté + rédacteur | 5 des 7 — Enveloppe : page dédiée · boîte de dialogue ; Récupération du titre : aboutit · lente · échoue | UC-M11-01 | S3 `fil: ["Accueil","Production","Infrastructure","Signets","Nouveau"]` (`V-23:3273`) → R2 |
| `/univers/{univers}/{domaine}/signets/{identifiant}/modifier` | **V-23** Formulaire de signet, édition | connecté + rédacteur | 2 des 7 — Mode : édition (champs pré-remplis + suppression) | UC-M11-01, RG-M18-05 | Même fil, mode *Édition* de la planche ; suffixe `/modifier` par uniformité avec `/notes/{identifiant}/modifier` |

> **`/domaines/…` n'est pas une route — ARB-001.** La forme raccourcie n'est pas implémentée : seule l'adresse canonique `/univers/{univers}/{domaine}` existe, et le produit n'émet jamais l'autre. `/domaines/{quoi-que-ce-soit}` tombe donc dans le cas commun de l'adresse non résolue et rend **404 V-26** en connecté, **404 V-04** en anonyme, par le chemin de code unique d'ADR-007. Il n'y a **ni redirection à écrire, ni écran de choix à maquetter** — donc aucune maquette manquante, et le régime assisté n'a pas à être rouvert.

> **Modules désactivés.** RG-STR-06 : « un module non activé n'apparaît ni dans la navigation du domaine, ni dans ses tableaux de bord ». Une route de module désactivé (`…/signets` sur un domaine sans module Signets) rend donc **404 V-26**, pas une page vide — cohérent avec RG-ACC-04 et avec le point dur n° 7 (« une action interdite n'est pas affichée »).

### 3.4 Notes

| Route | Vue | Niveau d'accès | États | Exigences | Source de l'adresse |
|---|---|---|---|---|---|
| `/notes/{identifiant}` | **V-14** Lecture d'une note | connecté + lecteur | 11 — Droits : écriture · lecture seule ; Fraîcheur : frais · vieillissant · obsolète ; Bandeaux : révision · brouillon · resynchronisation ; Registres : opérationnel existant ; État : nominal · chargement | UC-M04-01…05, RG-M04-01…10, UC-M06-02, UC-M06-03, RG-M06-05…11, RG-M18-03, RG-M18-04, RG-M18-17, **RG-M03-03** | **S1** — `V-26:2612` affiche `/notes/{identifiant}` |
| `/notes/{identifiant}` `?version={n}` | **V-15** Historique des versions *(panneau superposé)* | connecté + lecteur | 7 — Panneau : ouvert · fermé ; Historique : 10 versions · une seule version · aucune version antérieure ; Droits : écriture · lecture seule | UC-M07-01…04, RG-M07-01…06, RG-M18-10 | **S2** — `majAdresse("?version=" + v.n)` et `majAdresse("?")` pour la version courante (`V-15:2921`). **Pas de chemin propre** : R2 — le fil de V-15 (`V-15:3269`) est identique à celui de V-14 (`V-14:4366`) ; l'Annexe Récapitulatif du brief classe V-15 « superposée » |
| `/notes/{identifiant}/comparaison` | **V-16** Comparaison de deux versions | connecté + lecteur | 5 — Comparaison : 13→14 · 11→14 (écart large) · même version · sans différence ; Journal : tout afficher | UC-M07-03, RG-M18-11 | S3 `fil: [..., NOTE.titre, "Comparaison"]` (`V-16:2603`) → R2 ; BRIEF V-16 « Points d'entrée : depuis l'historique (V-15). **Adresse partageable** » |
| `/notes/nouvelle` | **V-17** Éditeur, création | connecté + rédacteur | 4 des 6 — Entrée : création vierge · depuis un template ; Enregistrement : réussi · en échec ; Aides : doublon détecté | UC-M05-01, UC-M05-02, UC-M05-07…10, RG-M05-01…07, RG-REF-01, RG-NF-02 | S4 menu « Créer » → `Nouvelle note` → `data-vers="Éditeur de note — vue V-17"` ; S3 `fil: ["Accueil","Production", domaine, "Nouvelle note"]` (`V-17:3568`) → R2. `nouvelle` est un identifiant réservé (§5.4) |
| `/notes/{identifiant}/modifier` | **V-17** Éditeur, modification | connecté + rédacteur | 2 des 6 — Entrée : modification ; + enregistrement, doublon | UC-M05-12, RG-M05-08, RG-M05-09, RG-NF-02 | S3 `fil: ["Accueil","Production", n.domaine, "Modifier"]` (`V-17:3559`) → R2. Le fil omet la note ; l'adresse la conserve (limite documentée de R2) |
| `/notes/{identifiant}/operationnel` | **V-18** Éditeur du registre Opérationnel | connecté + rédacteur | 6 — État : opérationnel existant · première rédaction · désynchronisé ; Référence : panneau · côte à côte · repliée | UC-M05-11, UC-M06-04, RG-M06-08…10, RG-NOT-02, RG-NOT-03 | S3 `fil: [..., NOTE.titre, "Opérationnel"]` (`V-18:3302`) → R2 |
| `/notes/{identifiant}/pieces-jointes/{fichier}` | *(aucune — téléchargement)* | connecté + lecteur **de la note porteuse** | — | UC-M04-04, **RG-M04-08** | Dérivée par R1. RG-M04-08 : « une pièce jointe d'une note interne n'est jamais servie en anonyme » — le contrôle porte sur la note, pas sur le fichier |

> **Pourquoi V-18 n'est pas `?registre=operationnel` sur `/modifier`.** Les deux formes étaient recevables. R2 tranche : le fil de V-18 ajoute un segment (`Opérationnel`), celui de V-17 en ajoute un autre (`Modifier`). Le paramètre `?registre=` reste réservé à la **lecture** (S2), où il est attesté.

### 3.5 Outils transverses

| Route | Vue | Niveau d'accès | États | Exigences | Source de l'adresse |
|---|---|---|---|---|---|
| `/cartographie` | **V-19** Cartographie, vue complète | connecté ; périmètre global : administrateur ou profil habilité | 6 — Profil : administrateur · référent ; État : nominal · calcul en cours · sans relation · trop dense | UC-M09-01, UC-M09-02, UC-M09-04, RG-M09-01…04, RG-M09-07, RG-M18-11 | S3 `fil: ["Accueil","Cartographie"]` (`V-19:3409`) ; S4 rail `Outils › Cartographie` → `data-vers="Cartographie — vue V-19"` |
| `/cartographie/par-type` | **V-20** Cartographie par type maître | idem V-19 | 5 — Moment : aucun type choisi · anneau seul · voisinage déplié ; Cas limites : maître sans relation · nœud disparu | UC-M09-03, **RG-M09-05**, RG-M09-03 | S3 `fil: ["Accueil","Cartographie","Par type"]` (`V-20:3359`) → R2. Le mode d'affichage exigé dans l'adresse par RG-M09-05 est porté par ce segment |
| `/carte-mentale` | **V-21** Carte mentale | connecté | 3 — Droits : accès complet · sans Applications ; Chargement : branches lentes | UC-M10-01, RG-M10-01, RG-M03-01, RG-M18-11 | S3 `fil: ["Accueil","Carte mentale"]` (`V-21:2893`) ; S4 rail `Outils › Carte mentale` → `data-vers="Carte mentale — vue V-21"` |
| `/importer` | **V-24** Import | connecté + rédacteur | 7 — Étape : 1 scénario · 2 dépôt · 3 aperçu · 4 import ; Issue : terminé avec erreurs · terminé sans erreur · échec global | UC-M12-04, RG-M12-01…11, RG-NF-01 | S3 `fil: ["Accueil","Importer"]` (`V-24:3662`) → R2 ; S4 rail `Outils › Import` et menu « Créer » → `Importer des fichiers` → `data-vers="Import — vue V-24"` |
| `/mon-profil` | **V-25** Profil | connecté | 7 — Onglet : identité · sécurité · distinctions · activité ; Compte : contributeur · nouvel arrivant ; Cas : mot de passe verrouillé | UC-M16-03…05, RG-M16-02, RG-M16-03, RG-CPT-01 | S3 `fil: ["Accueil","Mon profil"]` (`V-25:3259`) → R2 ; S4 menu utilisateur `Mon profil` → `data-vers="Profil — vue V-25"` |
| *(toute adresse non résolue)* | **V-26** Page non trouvée (connecté) | connecté | 5 — Cas d'arrivée : note supprimée · adresse inexistante · hors de vos droits ; Droits : écriture · lecture seule | **RG-ACC-04**, RG-NF-04, RG-NF-06, RG-M18-14 | Pas de route propre : réponse **404** à l'adresse demandée, qui reste affichée (`V-26:1067`). Le fil rendu est `["Accueil","Page introuvable"]` (`V-26:3045`) — c'est un libellé de repérage, pas un chemin |

> **Le rapport d'import ne quitte pas `/importer` — ARB-003.** Le contributeur reçoit son rapport **à l'étape 4 de V-24**, dans son propre parcours d'import, qui le porte déjà : progression puis rapport. Il n'a jamais besoin de la console. V-35 est et reste le journal **transverse** des imports de l'instance, de périmètre administrateur (§3.6). **Aucune route de rapport d'import n'est exposée hors console** — ni `/importer/{lot}`, ni variante, ni ouverture de `/console/imports` à l'auteur d'un lot. Le renvoi du brief V-24 vers V-35 est l'erreur, et il n'est pas implémenté (E-10).

> **La seule dérogation admise à RG-ACC-04.** Le cas *note supprimée* de V-26 en dit davantage que les deux autres (qui l'a supprimée, quand, pourquoi). Le commentaire de la maquette (`V-26:2604`) en donne la condition : « il n'est possible **que parce que l'utilisateur a des droits sur le domaine concerné** ». Ce n'est donc pas une fuite : l'information n'est révélée qu'à qui pouvait déjà la voir. Les cas *inexistante* et *hors de vos droits* sont rigoureusement identiques, à la chaîne demandée près (`V-26:2628`).

### 3.6 Console d'administration

Toutes ces routes exigent le rôle **administrateur**. Un utilisateur non administrateur reçoit **404 V-26**, pas un refus : le motif commun du brief impose que la console « n'apparaisse pas dans la navigation des autres profils », et RG-ACC-04 impose que l'accès direct ne l'apprenne pas davantage. Ce sont les deux faces d'un même principe : l'entrée n'est pas rendue (P-09, ADR-011) **et** l'adresse construite ne l'apprend pas (ARB-005, régime indiscernable).

**La bibliothèque de composants (V-41) n'appartient pas à cette famille**, bien qu'elle partage son rôle. ARB-002 : la console **y renvoie**, elle ne la **contient** pas — son adresse est `/bibliotheque`, au premier niveau (§3.7).

| Route | Vue | États | Exigences | Source de l'adresse |
|---|---|---|---|---|
| `/console` | *(redirection 308 → `/console/univers`)* | — | — | S4 rail `Gestion › Console` → `data-vers="Console — vue V-27"` : l'entrée unique du rail désigne V-27 comme section d'atterrissage |
| `/console/univers` | **V-27** Univers | 6 — Formulaire : fermé · création · édition ; Suppression : refusée (contient des domaines) · refusée (univers système) · possible (univers vide) | UC-M14-01, RG-M14-01, RG-STR-01, RG-M18-05 | S3 `fil: ["Accueil","Console","Univers"]` (`V-27:3901`) |
| `/console/domaines` | **V-28** Domaines | 5 — Formulaire : fermé · création · édition ; Suppression : domaine peuplé · domaine vide | UC-M14-02, UC-M14-03, RG-M14-02…05, RG-STR-06, RG-M18-05 | S3 `fil: [...,"Console","Domaines"]` (`V-28:3532`) |
| `/console/types-de-fiches` | **V-29** Types de fiches | 5 — Formulaire : fermé · création · édition ; Suppression : refusée (type utilisé) · possible | UC-M14-04, RG-M14-06, UC-M08-01, RG-M08-02 | S3 `fil: [...,"Console","Types de fiches"]` (`V-29:3773`) |
| `/console/types-de-relations` | **V-30** Types de relations | 5 — Formulaire : fermé · création · édition ; Suppression : type utilisé · type inutilisé | UC-M14-05, RG-M08-06, RG-M08-07 | S3 `fil: [...,"Console","Types de relations"]` (`V-30:3505`) |
| `/console/templates` | **V-31** Templates | 5 — Formulaire : fermé · création · édition ; Suppression : template par défaut · template ordinaire | UC-M14-06, RG-REF-01, RG-REF-02 | S3 `fil: [...,"Console","Templates"]` (`V-31:3842`) |
| `/console/comptes` | **V-32** Comptes | 6 — Formulaire : fermé · création · édition · édition du dernier administrateur ; Cas : réinitialisation · désactivation | UC-M14-07, RG-M14-07, RG-M14-08, RG-CPT-01, RG-CPT-02 | S3 `fil: [...,"Console","Comptes"]` (`V-32:3612`) |
| `/console/configuration` | **V-33** Configuration | 4 — Seuils : 90/180 en vigueur · 30/60 resserrés · 120/240 élargis · valeurs refusées | RG-M14-09, RG-M14-10, RG-M06-02, RG-M06-03 | S3 `fil: [...,"Console","Configuration"]` (`V-33:3495`) |
| `/console/analytique` | **V-34** Analytique | 2 — Données : suffisantes · insuffisantes | UC-M15-01…03, RG-M15-01…03, RG-M02-03, RG-M01-01 | S3 `fil: [...,"Console","Analytique"]` (`V-34:3613`) |
| `/console/imports` | **V-35** Imports | 4 — zone de dépôt au repos · accès direct aux trois scénarios · journal peuplé · rapport de lot ouvert *(aucune planche ; états présentés côte à côte dans la page)* | UC-M12-04, RG-M12-09, RG-M12-04 | S3 `fil: [...,"Console","Imports"]` (`V-35:3420`) |
| `/console/imports/{lot}` | **V-35** Rapport d'un lot | *(état « rapport de lot ouvert » ci-dessus)* | RG-M12-09, RG-M12-03, RG-M12-04 | BRIEF V-35 « accès au **rapport détaillé de chaque lot** » et « les rapports restent consultables **indéfiniment** » ; le journal de la maquette porte un identifiant stable par lot (`window.JOURNAL_IMPORTS`, `id: "i-2026-08"`, `V-35:2736`) — un objet identifié et consultable indéfiniment est un objet adressable |
| `/console/exports` | **V-36** Exports | 4 — Issue : sans avertissement · avec avertissements ; Volume : ordinaire · domaine volumineux | UC-M13-01, RG-M13-01…03 | S3 `fil: [...,"Console","Exports"]` (`V-36:3354`) |
| `/console/exports/{univers}/{domaine}` | *(aucune — téléchargement de l'archive)* | — | UC-M13-01, RG-M13-01, RG-M13-03 | Dérivée : le périmètre d'export est un domaine (BRIEF V-36), et un domaine se désigne par sa forme canonique (§2.2) |

### 3.7 Bibliothèque vivante — V-38 à V-41

**ARB-002 ferme A-02.** « Concepteur et développeurs », au brief V-41, est un vestige de rédaction : la population visée est celle des **administrateurs** (E-11). Quatre conséquences, toutes arrêtées :

1. **Le rôle est administrateur.** L'entrée correspondante apparaît **dans la navigation de la console** — et **n'apparaît pour aucun autre rôle** : une action interdite n'est pas rendue (P-09, ADR-011). L'accès direct par adresse construite ne l'apprend pas davantage : **404 V-26** pour tout non-administrateur (RG-ACC-04, ADR-007).
2. **L'adresse reste `/bibliotheque`, au premier niveau.** *La console y renvoie ; elle ne la contient pas.* C'est le constat de maquette qui tranche, et il est net : les **six vues de console** rendent `["Accueil", "Console", "<section>"]`, tandis que les **quatre vues de bibliothèque** rendent `["Accueil", "<nom>"]` — premier niveau, sans segment « Console » (`V-41:5069`, `V-38:2898`, `V-39:3166`, `V-40:3636`). R2 s'applique donc sans exception : un fil qui n'ajoute pas de segment n'en ajoute pas au chemin. Les deux contraintes — « atteignable depuis la console » et « sous rôle administrateur » — tiennent ensemble sans contredire une source gelée (ARB-002, précision du 18 août ; `ECART-009 b)`).
3. **V-41 reste une page réelle de l'application**, jamais une maquette morte (`STACK-TECHNIQUE.md §4.1`) : c'est là que la divergence du système visuel devient visible immédiatement (risque R-06).
4. **V-38, V-39 et V-40 ne sont pas des routes.** ARB-002 les tient pour des **catalogues transverses** : ils documentent des composants employés partout, et leur contenu est déjà déclaré dans le périmètre de V-41 par le brief lui-même (famille *Retours* = « notifications, états vides, états de chargement, états d'erreur » ; famille *Superpositions* = « boîte de dialogue, panneau latéral, palette de recherche, menu contextuel, infobulle »). Ce sont les **sections** de V-41, sans adresse propre — voir §3.8. Leur régime d'accès est celui de V-41.

| Route | Vue | Niveau d'accès | États | Exigences | Source de l'adresse |
|---|---|---|---|---|---|
| `/bibliotheque` | **V-41** Bibliothèque de composants | administrateur | 11 familles — signal de fraîcheur · boutons · champs de saisie · pastilles et marqueurs · conteneurs · navigation · restitution de données · superpositions · contenu rédigé · retours · identité *(aucune planche ; chaque famille présente ses variantes côte à côte)*, **plus les 36 états des trois sections** V-38, V-39 et V-40 | RG-DA-01, RG-DA-03, RG-M18-01…05, RG-M18-07…09, RG-M18-14 | S3 `fil: ["Accueil","Bibliothèque de composants"]` (`V-41:5069`) → R2 + R1 ; **ARB-002** pour le rôle et pour le point d'entrée dans la navigation de la console ; `STACK-TECHNIQUE.md §4.1` pour son statut de page réelle |

> **Une adresse de premier niveau n'est pas un défaut de rangement.** Le niveau d'accès et le niveau d'adressage sont deux choses distinctes, et rien n'oblige à les faire coïncider : `/mon-profil` est au premier niveau sans être ouvert à tous, `/importer` exige un droit de rédaction. Ce qui protège `/bibliotheque`, c'est la matrice du §5.5 et le chemin de code unique d'ADR-007 — pas la longueur de son chemin. Y ajouter un segment `console` n'aurait rien protégé de plus et aurait contredit quatre maquettes gelées.

### 3.8 Les six vues qui ne sont pas des routes

| Vue | Nature | Où elle vit | États | Source |
|---|---|---|---|---|
| **V-09** Palette de recherche rapide | **Superposition**, invoquée au clavier depuis n'importe quelle route de l'espace de travail. **Aucune adresse.** | Toutes les routes portant la coquille. Sortie « voir tous les résultats » → `/recherche?q={requête}` | 6 *(aucune planche ; six états côte à côte dans la maquette)* — au repos · un seul caractère · résultats · aucun résultat · recherche par sens indisponible · petit écran 360 px | Annexe Récapitulatif du brief : « superposée » ; `V-37:3714` monte la palette sur le champ de la barre supérieure ; les six états sont titrés « ÉTAT 01 » à « ÉTAT 06 » dans `V-09` |
| **V-15** Historique des versions | **Superposition** sur la lecture. Pas de chemin propre ; état adressable par `?version={n}` | `/notes/{identifiant}` | *(voir §3.4)* | R2 : fil identique à V-14. Annexe Récapitulatif : « superposée » |
| **V-37** Coquille applicative | **Gabarit**, pas une page. Enveloppe toutes les routes sauf `/` anonyme, `/recherche` anonyme, `/guides/…`, `/connexion`, `/mot-de-passe-oublie…`, et V-04 | Partout ailleurs — **35 vues sur 41** la portent | 8 — Contenu : tableau de bord · lecture d'une note ; Navigation : ouverte · escamotée ; Profil : référent · administrateur ; Cas : branche en chargement · aucun domaine accessible | BRIEF §3.3 : « toutes les vues de l'espace de travail et de la console s'inscrivent dans une coquille permanente décrite en V-37. Les vues de l'espace public (V-01 à V-04) et d'authentification (V-05, V-06) n'en font pas partie » |
| **V-38** Système de notification | **Section** de V-41, catalogue transverse. **Aucune adresse propre** depuis ARB-002 | `/bibliotheque`, famille *Retours* | 6 — types : succès · erreur · information · en cours ; planche : empiler les quatre types · tout refermer | **ARB-002** : « V-38, V-39 et V-40 restent des catalogues transverses, **non des routes** » ; famille *Retours* du brief V-41 |
| **V-39** États vides, de chargement et d'erreur | **Section** de V-41, catalogue transverse. **Aucune adresse propre** depuis ARB-002 | `/bibliotheque`, famille *Retours* | 20 — 10 états vides (corpus vide · domaine sans note · dossier vide · aucune révision · aucun rétrolien · aucune relation · graphe sans relation · aucun signet · aucune distinction · liste filtrée vide) + 6 esquisses de chargement (carte de résultat · ligne de liste · panneau latéral · tableau de bord · graphe · arborescence) + 4 portées d'erreur (un panneau · une vue entière · perte de connexion · fonctionnalité dégradée) | **ARB-002** ; famille *Retours* du brief V-41. Ses états sont la **référence** des quatre états de zone employés par toutes les vues (§6) |
| **V-40** Boîtes de dialogue | **Section** de V-41, catalogue transverse. **Aucune adresse propre** depuis ARB-002 | `/bibliotheque`, famille *Superpositions* ; chaque dialogue s'exécute dans la vue qui le déclenche (C-06) | 10 — quitter la comparaison · supprimer cette note · supprimer le dossier · restaurer la version 11 · signaler à réviser · droits du dossier · ajouter une relation · sélecteur de template · avertissement de doublon · déplacer une note | **ARB-002** ; famille *Superpositions* du brief V-41 |

> **V-23** est un cas intermédiaire, et son ambivalence est **déclarée par sa planche** (contrôle *Enveloppe* : « Boîte de dialogue » / « Page dédiée »). Elle a donc bien une adresse (§3.3) **et** un mode superposé, selon le contexte d'appel — ce que le brief formule ainsi : « formulaire court, en boîte de dialogue ou page dédiée **selon le contexte d'appel** ».

---

## 4. Paramètres d'état portés par l'adresse

### 4.1 Attestés par les maquettes

| Paramètre | Valeurs | Routes | Source |
|---|---|---|---|
| `?registre=` | `reference` (défaut) · `operationnel` | `/notes/{identifiant}`, `/guides/{identifiant}` | `V-14:3959`, `V-03:1616` — `majAdresse("?registre=" + reg)`. Le commentaire est explicite : « le registre affiché est reflété dans l'adresse : le lien est partageable tel quel » |
| `?version=` | entier ; `?` nu = version courante | `/notes/{identifiant}` | `V-15:2921` — `majAdresse(estCourante ? "?" : "?version=" + v.n)` |
| `#{ancre}` | identifiant de titre du sommaire | `/notes/{identifiant}`, `/guides/{identifiant}` | `V-14:3925`, `V-03:1582` — `majAdresse("#" + t.id)` |

**RG-M02-02** en découle : un résultat de recherche dont la correspondance a été trouvée dans le corps Opérationnel ouvre `/notes/{identifiant}?registre=operationnel`.

### 4.2 État de recherche partageable — `RG-M02-06`

> `RG-M02-06` — « L'état de la recherche — requête, filtres, mode — est partageable par l'adresse de la page. »

**Numérotation.** `RG-M02-05` et `RG-M02-06` étaient cités par le PLAN sans exister au cahier des charges, qui les laissait en puces non numérotées de §M02.6 et s'arrêtait à `RG-M02-04`. **E-05** (validé par ARB-006) leur attribue une numérotation, dans l'ordre des puces : `RG-M02-05` **compteur par facette**, `RG-M02-06` **état de recherche partageable par l'adresse**, `RG-M02-07` **pastilles de filtres supprimables et lien « tout effacer »**, `RG-M02-08` **compteur global reflétant le filtrage** (« 4 résultats sur 37 »). Ce document emploie désormais ces références partout où il écrivait « M02.6 » faute de mieux. Les quatre exigences sont réelles et couvertes : `RG-M02-06` par le présent §4.2, `RG-M02-05`, `RG-M02-07` et `RG-M02-08` par les contrôles de la planche de V-08 (facettes, pastilles, compteur).

Les noms de paramètres ne sont pas inventés : ce sont les identifiants de facettes et les valeurs de contrôles de la maquette V-08.

`/recherche?q={requête}&mode={mode}&tri={tri}&{facette}={valeur}…`

| Paramètre | Valeurs | Source |
|---|---|---|
| `q` | texte de la requête | BRIEF V-02 « adresse partagée contenant une requête » |
| `mode` | `motscles` · `sens` · `hybride` *(défaut)* | `V-08:1165-1171` — `data-mode="motscles|sens|hybride"` |
| `tri` | `pertinence` *(défaut)* · `modification` · `verification` · `consultations` · `alpha` | `V-08:1191-1195` — `<option value="…">` |
| `univers` `domaine` `type` `statut` `fraicheur` `etiquette` `visibilite` | libellé de la valeur de facette ; **répétable** | `V-08:1938-1946` — `definitions: [{ id: "univers" }, { id: "domaine" }, { id: "type" }, { id: "statut" }, { id: "fraicheur" }, { id: "etiquette" }, { id: "visibilite" }]` |

**Sémantique de combinaison**, lue dans `creerFacettes.passe()` (`V-08:1813-1821`) : à l'intérieur d'une facette les valeurs sont en **ou** (paramètre répété), entre facettes en **et**. `/recherche` sans paramètre autre que `q` réinitialise tout — c'est le lien « tout effacer » de `RG-M02-07`, et chaque pastille supprimable retire un couple `{facette}={valeur}` de l'adresse. Les compteurs de `RG-M02-05` (par facette) et de `RG-M02-08` (global) se calculent sur l'état ainsi porté par l'adresse : une adresse partagée rend exactement les mêmes compteurs.

**En anonyme** (V-02), seuls `q`, `domaine` et `type` sont honorés : le brief V-02 réduit les facettes à « domaine, type de note. **Pas de statut, pas de visibilité, pas d'étiquette interne** » et supprime la bascule de mode. Un paramètre `statut=` ou `visibilite=` présenté par un anonyme est **ignoré**, jamais refusé — un refus révélerait l'existence du filtre (RG-ACC-04, RG-M02-04).

**Listes filtrées** (mêmes règles, facettes propres à chaque vue) :

| Route | Paramètres | Source |
|---|---|---|
| `/univers/{u}/{d}/notes` | `type` `fraicheur` `statut` `dossier` `auteur` `etiquette` + `tri` | `V-12:2100-2106` |
| `/univers/{u}/{d}/signets` | `etiquette` `auteur` | `V-22:2755-2757` |

Ces paramètres sont ce qui rend exécutables les points d'entrée déclarés par le brief V-12 et par la planche de V-12 (`name="arr"`) : *« depuis la barre de fraîcheur · obsolètes »* → `?fraicheur=Obsolète%20probable` ; *« depuis l'accueil · brouillons »* → `?statut=Brouillon`. Les indicateurs cliquables de V-07 et les segments de barre de fraîcheur de V-11 produisent exactement ces adresses.

### 4.3 État de cartographie partageable — RG-M09-05

> « Le mode d'affichage, le type maître et le périmètre sont reflétés dans l'adresse de la page : la vue est partageable telle quelle. »

Les trois éléments nommés par la règle, et rien de plus :

| Élément de RG-M09-05 | Porté par | Valeurs | Source |
|---|---|---|---|
| **mode d'affichage** | le chemin | `/cartographie` *(vue complète)* · `/cartographie/par-type` | `V-19:1117-1118` — `data-vue="complete"` / `data-vue="maitre"` ; fils d'Ariane de V-19 et V-20 |
| **périmètre** | `?perimetre=` | `global` · `univers:{univers}` · `domaine:{univers}/{domaine}` | `V-19:3090-3091` — la valeur du sélecteur est `"{type}|{nom}"` (`"domaine|Applications"`, `V-19:3132`), lue en `{ type, nom }`. Le domaine est désigné par sa **forme canonique** (§2.2), sans quoi `domaine:support` serait ambigu (RG-STR-02) |
| **type maître** | `?type=` | identifiant du type de fiche | `V-20:1118` — `id="types-maitres"`, sélecteur des types présents dans le périmètre |

`?criticite=oui|non` complète l'ensemble pour la vue complète (`V-19:1128`, `id="c-criticite"`, coché par défaut) : c'est une bascule d'affichage, non nommée par RG-M09-05, portée dans l'adresse par cohérence avec les trois autres — elle change ce que montre la capture partagée.

**`?noeud={identifiant}` est ajouté — ARB-007, A-06.** Il porte le nœud sélectionné, sur `/cartographie` comme sur `/cartographie/par-type`. `RG-M09-05` ne le nomme pas : elle énumère trois éléments et s'arrête. Le **point dur n° 5** du brief fait pourtant de la sélection un **état durable** — « focus persistant au clic, jamais éphémère au survol » —, et **un état durable qui ne survit pas au partage de l'adresse n'en est pas un**. Sans ce paramètre, l'adresse partagée d'une analyse d'impact — l'usage central de la vue selon le brief, « référent en analyse d'impact, souvent pendant ou après un incident » — arriverait amputée de ce qui faisait l'objet de l'analyse. Une valeur qui ne désigne aucun nœud du périmètre est **ignorée**, comme tout paramètre d'affichage non résolu, jamais refusée.

Le **périmètre** de `/carte-mentale` suit la même forme (`?perimetre=`), le brief V-21 déclarant un « sélecteur de périmètre : tout · un univers · un domaine » de même nature.

`RG-M09-02` s'applique au paramètre : `?perimetre=global` demandé par un profil non habilité est **rabattu sur le périmètre autorisé**, jamais refusé — comportement de la maquette (`V-19:3092`).

### 4.4 Autres paramètres

| Paramètre | Route | Valeurs | Source |
|---|---|---|---|
| `?onglet=` | `/mon-profil` | `identite` *(défaut)* · `securite` · `distinctions` · `activite` | Planche V-25, `name="ong"` |
| `?versions=` | `/notes/{identifiant}/comparaison` | `{a}-{b}`, ex. `13-14` | Planche V-16, `name="cmp"`, valeurs `13-14`, `11-14`, `14-14`, `13-13` |
| `?suite=` | `/connexion` | chemin absolu à restaurer après connexion | UC-M16-01 « après connexion, l'utilisateur retourne à la page qu'il tentait d'atteindre » ; RG-ACC-03 |
| `?motif=` | `/connexion` | `page-protegee` · `session-expiree` · *(absent = accès direct)* | Planche V-05, `name="arrivee"`, valeurs `protegee` / `expiree` / `directe` |
| `?titre=` `?domaine=` `?dossier=` `?template=` | `/notes/nouvelle` | pré-remplissage | UC-M02-07 « bouton **Créer cette note** qui ouvre l'éditeur avec le titre pré-rempli et le domaine de l'utilisateur pré-sélectionné » ; BRIEF V-13 « nouvelle note **dans ce dossier** » ; RG-REF-01 (template subsidiaire, donc paramètre facultatif) |
| `?q=` | `/notes/nouvelle` *(depuis V-34)* | requête d'origine | BRIEF V-34 : « chaque ligne propose de **créer la note manquante** avec le titre pré-rempli » |

### 4.5 Ce qui n'est délibérément **pas** dans l'adresse

| État | Pourquoi | Où il vit |
|---|---|---|
| Dépliage du rail, escamotage du rail | R3 ; état mémorisé **entre les sessions** (UC-M03-01) | `codicillus.rail.deplies` (`V-37:3110`) |
| Aide de première visite | R3 ; « affichée une seule fois par utilisateur » (BRIEF V-07) | `codicillus.aide.recherche` (`V-07:3882`) |
| Densité de la liste (compact / confortable) | R3 ; préférence d'affichage, pas un état partageable | Stockage local, par uniformité |
| Étape courante de l'import (1 à 4) | Un parcours qui porte des fichiers déposés n'est pas restaurable depuis une adresse. L'objet adressable est le **lot**, pas l'étape | `/console/imports/{lot}` pour le rapport |
| Panneaux de formulaire de la console (`création` / `édition`) | R2 : **aucun** des dix fils d'Ariane de console ne porte de segment de formulaire — la source répond par son silence, là où le fil de V-23 porte explicitement « Nouveau » | Superposition |
| Boîtes de dialogue (V-40) | Superpositions ; elles piègent le focus et le rendent à leur déclencheur (RG-M18-10) — un état qui appartient au déclencheur, pas à l'adresse | Superposition |
| Palette V-09 | Idem ; « rend le focus à l'élément déclencheur » | Superposition |

*La sélection d'un nœud de cartographie figurait ici. **ARB-007 la fait passer dans l'adresse** : voir §4.3.*

---

## 5. Redirections, désambiguïsation, réservations

### 5.1 Redirections permanentes (308)

| Depuis | Vers | Motif |
|---|---|---|
| `/univers/{ancien-univers}/{domaine}` | `/univers/{univers-courant}/{domaine}` | **RG-M03-02** — adresse ancienne, après rattachement (UC-M14-02) |
| `/console` | `/console/univers` | S4 : l'entrée `Console` du rail désigne V-27 |
| `/univers/{u}/{d}` sur un identifiant d'univers ou de domaine renommé | forme courante | **RG-M03-02** — adresse ancienne |

**Ce qui a disparu de ce tableau, et ce qui y reste.** La ligne `/domaines/{domaine}` → forme canonique est **supprimée** : ARB-001 n'implémente pas la forme raccourcie, il n'y a donc rien à rediriger. La ligne des **adresses anciennes** reste, et elle n'est nullement ambiguë : elle vise le rattachement d'un domaine à un autre univers (UC-M14-02) et les renommages d'identifiant. L'adresse de départ y désigne un domaine et un seul — c'est un ancien état de la même ressource, pas une forme abrégée à résoudre. Les deux clauses de RG-M03-02 n'avaient pas le même objet ; seule la première perd le sien.

Aucune redirection n'est nécessaire pour les notes : leur adresse ne change pas (§2.1).

### 5.2 Redirections de session

| Situation | Comportement | Exigence |
|---|---|---|
| Route protégée sans session | `302 → /connexion?motif=page-protegee&suite={chemin}` | BRIEF V-05 « redirection depuis une page protégée » |
| Session expirée | `302 → /connexion?motif=session-expiree&suite={chemin}` puis restauration de `{suite}` après reconnexion | **RG-ACC-03** |
| Après connexion | `{suite}` si présent, sinon `/` | UC-M16-01 |
| Après déconnexion | `302 → /` (espace public), **jamais** une page d'erreur | **RG-ACC-02**, UC-M16-02 |

`?suite=` n'accepte qu'un chemin absolu interne : une valeur externe est ignorée et remplacée par `/`.

### 5.3 Désambiguïsation — clause sans objet, à ne jamais implémenter

RG-M03-02 : « en cas d'ambiguïté (même identifiant de domaine dans deux univers), le produit **demande à l'utilisateur de choisir** plutôt que de deviner ». La situation qu'elle décrit est réelle et légitime : RG-STR-02 l'autorise et l'illustre — « deux univers peuvent avoir chacun un domaine *support* » —, et ARB-001 la confirme sans réserve, l'unicité n'étant portée que par l'univers.

**Mais la clause n'a aucun déclencheur.** Elle ne pouvait survenir que sur `/domaines/{domaine}` — la forme canonique, elle, n'est jamais ambiguë. Cette forme n'étant pas implémentée (ARB-001), rien ne peut plus la déclencher.

**Consigné, et sans suite.** Cette clause est **sans objet** et **ne sera jamais implémentée** (E-09). Aucun écran de choix n'est à maquetter, aucune vue ne manque, et le compte des vues reste à 41. L'inscrire ici est le seul traitement qu'elle reçoit : une clause sans objet qu'on laisse sans trace revient tôt ou tard, sous forme de question déjà tranchée.

`RG-M03-02` n'est pas fautive. C'est l'absence de forme raccourcie qui prive sa seconde moitié d'emploi — non un défaut de rédaction du cahier des charges.

### 5.4 Identifiants réservés

L'identifiant lisible d'une note est généré et rendu unique automatiquement (RG-M12-11). La génération doit en outre **réserver** les segments qui occuperaient une place de route :

| Espace de noms | Réservés |
|---|---|
| Racine | `guides` · `notes` · `univers` · `recherche` · `connexion` · `deconnexion` · `mot-de-passe-oublie` · `cartographie` · `carte-mentale` · `importer` · `mon-profil` · `console` · `bibliotheque` |
| `/notes/…` | `nouvelle` |
| `/notes/{identifiant}/…` | `modifier` · `operationnel` · `comparaison` · `pieces-jointes` |
| `/univers/{u}/{d}/…` | `notes` · `dossiers` · `signets` |
| `/univers/{u}/{d}/signets/…` | `nouveau` |

Sans cette réservation, une note intitulée « Nouvelle » produirait `/notes/nouvelle` et masquerait l'éditeur de création.

**Un seul segment sort de la liste racine : `domaines`.** ARB-001 supprime la route qui le justifiait, et plus aucune adresse n'y répond. La règle est inchangée : on réserve les segments qui **occuperaient une place de route**, et celui-là n'en occupe plus (`ECART-009 f)`).

`bibliotheque` **y figure toujours** : ARB-002 en fait une adresse de premier niveau (§3.7), donc un segment racine à protéger comme les autres. En revanche il ne se décline plus en sous-routes — `/bibliotheque/notifications`, `/bibliotheque/etats` et `/bibliotheque/dialogues` n'existent pas.

### 5.5 Matrice d'accès et comportement en cas de refus

| Famille | Anonyme | Connecté sans droit | Connecté avec droit | Administrateur |
|---|---|---|---|---|
| `/`, `/recherche` | V-01 / V-02 *(périmètre public)* | V-07 / V-08 *(périmètre autorisé)* | idem | idem |
| `/guides/{id}` — note publique et publiée *(une seule adresse, un seul rendu — ARB-007, A-05)* | V-03 | V-03 | V-03 | V-03 |
| `/guides/{id}` — note interne ou brouillon | **404 V-04** | **404 V-04** | **404 V-04** | **404 V-04** |
| `/notes/{id}` et sous-routes | **404 V-04** | **404 V-26** | V-14… | V-14… |
| `/univers/…` | **404 V-04** | **404 V-26** | V-10… | V-10… |
| `/domaines/…` | **404 V-04** | **404 V-26** | **404 V-26** | **404 V-26** *(ARB-001 : forme raccourcie non implémentée — la réponse ne dépend d'aucun droit)* |
| `/cartographie`, `/carte-mentale` | **302 → `/connexion?motif=page-protegee`** *(ARB-052 ; ARB-007 ne parle que du connecté)* | périmètre rabattu (RG-M09-02) | V-19… | V-19… |
| `/importer` | **302 → `/connexion?motif=page-protegee`** *(ARB-052)* | **404 V-26** *(sans droit de rédaction)* | V-24 | V-24 |
| `/mon-profil` | **302 → `/connexion?motif=page-protegee`** *(ARB-052)* | V-25 | V-25 | V-25 |
| `/console/…` | **302 → `/connexion?motif=page-protegee`** *(ARB-052)* | **404 V-26** | **404 V-26** | V-27… |
| `/bibliotheque` | **302 → `/connexion?motif=page-protegee`** *(ARB-052 ; ARB-002 ne parle que du connecté)* | **404 V-26** | **404 V-26** | V-41 *(ARB-002 ; V-38, V-39 et V-40 en sont les sections, sans adresse propre)* |

Quatre principes sont appliqués sans exception :

1. **RG-ACC-04 / ADR-007** — refus et inexistence passent par le **même chemin de code**. Il n'existe pas de branche « interdit ».
2. **RG-ACC-01 / ADR-006** — le filtrage est calculé côté serveur et projeté dans l'index (`STACK-TECHNIQUE.md §4.2`). Une adresse construite à la main ne rapporte jamais un contenu interdit.
3. **Point dur n° 7 / P-09 / ADR-011** — une action interdite n'est pas affichée, et une entrée de navigation interdite n'est pas rendue. Une route interdite n'est pas plus signalée : elle n'existe pas, du point de vue de l'utilisateur.
4. **ARB-005, amendé par ARB-052** — cette matrice relève du régime indiscernable **pour les adresses de ressource** : celles qui portent un identifiant de corpus, et dont l'existence est elle-même l'information confidentielle. Les **chemins fixes de fonction** — `/importer`, `/mon-profil`, `/console/…`, `/bibliotheque`, `/cartographie`, `/carte-mentale` — ne révèlent aucun contenu : pour un **anonyme** ils redirigent vers `/connexion` en mémorisant la cible (§5.2, `UC-M16-01`), et c'est ce qui donne son déclencheur à l'état **par défaut** de la planche de V-05 (`V-05:615`). Pour un **connecté sans le droit**, ils restent indiscernables : l'information n'est plus « il faut un compte » mais « ce compte n'y a pas droit ». L'indiscernabilité y est **aussi temporelle** : un écart de latence entre un refus et une inexistence est une fuite, au même titre qu'un code de statut distinct. L'état « sans droit » de `RG-M18-03` n'a aucune place ici — il vit dans les **zones**, au §6. En cas de doute sur la frontière, **l'indiscernable l'emporte**.

---

## 6. Les quatre états de zone, RG-M18-03

Les planches énumèrent les **variantes propres** de chaque vue. Elles ne dispensent pas des quatre états exigés par `BRIEF-VUES.md §3.2` et `RG-M18-03` — point dur n° 9 : « chaque zone est maquettée dans ses quatre états ».

| État | Où il est déjà traçable à un contrôle de planche | Où il reste à couvrir par la vue elle-même |
|---|---|---|
| **Chargement** | V-01, V-02, V-07, V-08, V-10, V-14, V-19 *(« calcul en cours »)*, V-21 *(« branches lentes »)*, V-23 *(« récupération lente »)*, V-36 *(« domaine volumineux »)*, V-37 *(« branche en chargement »)* | Toutes les autres. Esquisses de référence : V-39, six structures |
| **Vide** | V-01, V-02, V-07, V-08, V-10, V-11, V-12, V-13, V-15, V-19, V-20, V-22, V-25, V-34, V-37 | Les dix vues de console. Catalogue de référence : V-39, dix états vides |
| **Erreur** | V-01 *(guides en erreur)*, V-07 *(activité en erreur)*, V-08 *(sens indisponible)*, V-17 *(enregistrement en échec)*, V-23 *(récupération échoue)*, V-24 *(échec global)*, V-33 *(valeurs refusées)*, V-36 *(avertissements)* | Toutes les autres. Quatre portées de référence : V-39 |
| **Sans droit** | V-07, V-08, V-10, V-13 *(droit effectif)*, V-14, V-15, V-19, V-21, V-22, V-26, V-27…V-32 *(suppressions refusées)*, V-37 | — |

**Les deux régimes de refus ne portent pas sur le même objet — ARB-005.** C'est la lecture posée par ADR-007, validée par le commanditaire. Confondre les deux est la faute qui coûte le plus cher : elle produit soit une fuite, soit une page muette là où l'utilisateur avait le droit de comprendre.

| Régime | Portée | Comportement |
|---|---|---|
| **Indiscernable** — `RG-ACC-04` | la résolution d'une **ressource entière**, c'est-à-dire d'une adresse | Refus et inexistence produisent une réponse identique : **corps, en-têtes, code, et temps de réponse**. Un seul chemin de code (ADR-007). Aucun état « sans droit » n'est affiché : la route rend **404** — V-04 en anonyme, V-26 en connecté |
| **État « sans droit »** — quatrième état de zone de `RG-M18-03` | une **zone** d'une page que l'utilisateur a le droit d'ouvrir | L'existence de la ressource porteuse lui est **déjà connue** : la signaler ne révèle rien. La zone s'affiche avec son explication et, si pertinent, à qui s'adresser ; les actions d'écriture disparaissent (RG-M05-08, P-09, point dur n° 7) |

**Règle de tranchage.** Le contrat de tâche décide ; à défaut, **le régime indiscernable l'emporte**. Le doute ne se résout jamais en faveur de l'information révélée.

C'est de ce second régime que relèvent les contrôles `Droits : écriture / lecture seule` des sept planches, et la ligne « Sans droit » du tableau ci-dessus. Le premier régime, lui, est tout entier au §5.5 — et c'est `verificateur-acces`, adversarial par construction, qui éprouve nommément la frontière : c'est là qu'une erreur d'implémentation se logera.


`RG-M18-04` complète : « une erreur dans un panneau secondaire ne fait jamais tomber la page entière ». Trois planches l'attestent explicitement — V-01 (« la recherche reste utilisable même si les guides populaires échouent »), V-07 (« activité en erreur » pendant que les indicateurs s'affichent), V-14 (« chaque panneau latéral gère ses états indépendamment »).

---

## 7. Contradictions relevées entre le cahier des charges et les maquettes

L'ordre de préséance (PLAN §15.1, D-08) donne raison à la maquette. Elles sont consignées ici pour le diff retour (T-008).

**Statut après arbitrage.** Neuf contradictions, aucune ouverte. **Cinq** étaient tranchées par la seule préséance et le restent, inchangées : C-01, C-04, C-05, C-06, C-07. **Quatre** sont closes par un arbitrage ou un errata, et la colonne *Tranché* porte le renvoi : C-02 (E-05), C-03 (E-03), C-08 (ARB-002), C-09 (ARB-007). Aucune résolution n'est inventée ici : ce qui n'a pas été arbitré reste écrit tel qu'il l'était.

| # | Contradiction | Ce que dit le cadrage | Ce que dit la maquette | Tranché |
|---|---|---|---|---|
| C-01 | **Forme de l'adresse d'une note** | `PLAN-DE-REALISATION.md §4.2` : `/u/production/infrastructure/n/restaurer-une-sauvegarde-postgresql-depuis-barman` | `V-26:2612` : `/notes/restaurer-une-sauvegarde-mariadb` — plate, sans univers ni domaine | **Maquette.** Elle est en outre la seule des deux formes à satisfaire RG-M03-03 sans redirection permanente (§2.3) |
| C-02 | **`RG-M02-05` et `RG-M02-06` n'existent pas** | `PLAN-DE-REALISATION.md:87` et `:107` citent `RG-M02-06` (état de recherche partageable) et `RG-M02-05` (compteur de facettes) comme des règles du cahier des charges | Le CDC M02 s'arrête à `RG-M02-04`. Les deux exigences existent bien, mais sous forme de **puces non numérotées** en M02.6 | **Résolu — E-05** (validé par ARB-006). Les exigences étaient réelles et couvertes (§4.2) ; la numérotation leur est attribuée à l'errata, dans l'ordre des puces de §M02.6 : `RG-M02-05` compteur par facette, `RG-M02-06` état de recherche partageable, `RG-M02-07` pastilles et « tout effacer », `RG-M02-08` compteur global. `cadrage/` n'est pas modifié — l'errata fait autorité |
| C-03 | **Nombre de planches de revue** | `PLAN-DE-REALISATION.md §4.1` : « une planche de revue dans **36 des 40** vues » ; le contrat T-006 annonce « 38 des 41 » et nomme V-35, V-40, V-41 comme les vues sans planche | Comptage sur le dépôt : **37 planches sur 41**. Les quatre vues sans planche sont **V-09, V-35, V-40, V-41** — ce que `PLAN §4.1` énonce d'ailleurs correctement deux phrases plus loin, en se contredisant lui-même | **Résolu — E-03** (validé par ARB-006), au même compte que la maquette : **37 planches sur 41 vues**, les quatre sans planche étant V-09, V-35, V-40 et V-41. Le §4.1 du PLAN se contredisait lui-même |
| C-04 | **Adresse de l'espace public** | Le CDC ne distingue pas l'espace d'adressage public de l'espace interne | `V-04` : `/guides/…` ; `V-26` : `/notes/…`. Deux espaces de noms distincts pour le même objet | **Maquette.** C'est une garantie de plus pour RG-M17-01 : aucune adresse `/guides/` ne peut rendre du contenu interne |
| C-05 | **`/guides/` n'a pas d'index** | Rien ne l'interdit | `V-04:2228` classe `/guides/` nu parmi les **adresses erronées** | **Maquette.** L'entrée du public est `/` et `/recherche`, jamais une liste de guides |
| C-06 | **Boîte de dialogue « suppression d'un domaine »** | `BRIEF V-40` la liste parmi les onze dialogues à maquetter | `V-40` n'en contient que dix ; le dialogue de suppression de domaine vit dans `V-28:1391` | **Maquette.** Chaque dialogue destructif vit dans la vue qui le déclenche ; V-40 est un catalogue de motifs, pas leur lieu d'exécution |
| C-07 | **Fil d'Ariane de l'éditeur** | `UC-M03-02` : « le fil d'Ariane reflète le **chemin complet** : Accueil › Univers › Domaine › Dossier › … › Note » | `V-17:3559` : `["Accueil","Production", domaine, "Modifier"]` — la note éditée est absente, les dossiers aussi | **Maquette** pour le rendu ; **l'adresse conserve l'identifiant de la note**, sans quoi `/modifier` ne désignerait rien |
| C-08 | **Fils d'Ariane de V-38, V-39, V-40, V-41** | Le brief classe V-38/39/40 « transverses » et V-41 hors coquille | Les quatre rendent un fil de **premier niveau** (`Accueil › …`), donc quatre pages de racine | **Résolu — ARB-002** *(précision du 18 août, `ECART-009 b)`)*. **La maquette l'emporte, et l'arbitrage ne la contredit pas.** Une seule route, **`/bibliotheque`**, au premier niveau que le fil rend, sous rôle administrateur, avec son point d'entrée dans la navigation de la console : *la console y renvoie, elle ne la contient pas*. V-38, V-39 et V-40 sont des catalogues transverses, **non des routes**, et deviennent les sections de V-41 (§3.7, §3.8) — c'est en cela que ces quatre fils de premier niveau ne font pas quatre pages de racine, mais une seule. Le fil rendu est **celui de la maquette**, sans segment ajouté |
| C-09 | **Cartographie en anonyme** | `RG-M09-02` : « un anonyme ne peut cartographier qu'un **périmètre public** » — donc une cartographie anonyme existe | `BRIEF §4` ne donne que quatre vues publiques, dont aucune n'est un graphe ; la planche de V-19 n'offre que les profils *administrateur* et *référent* | **Résolu — ARB-007 (A-04).** Pas de cartographie publique. L'espace public compte quatre vues, et la planche de V-19 n'offre aucun profil anonyme ; `RG-M09-02` ne l'impose pas explicitement, et l'implémenter serait un comblement. La règle est lue comme une **précaution de filtrage**, non comme l'annonce d'une route |

---

## 8. Arbitrages appliqués

Six points avaient été portés à l'arbitrage. **Les six sont clos.** Ce document ne pose plus aucune
question ouverte : ce qu'un arbitrage ferme n'a plus à être demandé.

| Point | Question posée | Arbitrage | Décision, et ce qu'elle emporte ici |
|---|---|---|---|
| **A-01** *(gravité haute)* | Quel écran demande de choisir entre deux domaines homonymes ? | **ARB-001** | **Aucun.** La forme raccourcie `/domaines/{domaine}` n'est pas implémentée ; seule l'adresse canonique existe. La clause de désambiguïsation de `RG-M03-02` est **sans objet** (E-09), à ne jamais implémenter. L'unicité est portée par l'**univers seul** : deux univers ne peuvent porter le même nom, deux univers différents peuvent contenir un domaine homonyme. **Aucune maquette ne manque**, le compte reste à 41 vues. → §2.2, §3.3, §5.1, §5.3, §5.4 |
| **A-02** *(moyenne)* | Qui voit V-38 à V-41 dans le produit livré ? | **ARB-002** | **Les administrateurs.** « Concepteur et développeurs » du brief désigne les administrateurs (E-11). L'adresse reste **`/bibliotheque`**, au premier niveau que rendent les quatre fils d'Ariane : *la console y renvoie, elle ne la contient pas*. Son entrée apparaît dans la navigation de la console et **pour aucun autre rôle** (P-09, ADR-011). Elle reste une **page réelle** (risque R-06). V-38, V-39, V-40 sont des catalogues transverses, **non des routes** : sections de V-41. → §3.6, §3.7, §3.8, §5.4, §5.5 |
| **A-03** *(moyenne)* | Où un contributeur retrouve-t-il son rapport d'import ? | **ARB-003** | **À l'étape 4 de son propre parcours (V-24)**, qui le porte déjà. V-35 est et reste le journal transverse de l'instance, en console administrateur. **Aucune route de rapport d'import n'est exposée hors console.** Le renvoi du brief V-24 vers V-35 est l'erreur et n'est pas implémenté (E-10). → §3.5, §3.6 |
| **A-04** *(moyenne)* | Existe-t-il une cartographie publique ? | **ARB-007** | **Non.** L'espace public compte quatre vues, la planche de V-19 n'offre aucun profil anonyme, et `RG-M09-02` ne l'impose pas explicitement : l'implémenter serait un comblement. → §5.5, C-09 |
| **A-05** *(faible)* | Que rend `/guides/{identifiant}` en session ? | **ARB-007** | **V-03, tel quel.** Une seule adresse, un seul rendu. Cela conserve la vérification « voir ce que voit le public », qui est un usage réel, et évite une seconde adresse sans canonique ou un état hors planche — donc hors protocole de comparaison. → §3.1, §5.5 |
| **A-06** *(faible)* | Le nœud sélectionné va-t-il dans l'adresse ? | **ARB-007** | **Oui — `?noeud=` est ajouté** à l'état de cartographie porté par l'adresse. Le point dur n° 5 fait de la sélection un **état durable** ; un état durable qui ne survit pas au partage de l'adresse n'en est pas un. → §4.3, §4.5 |

### 8.1 Les trois autres arbitrages, et ce qu'ils changent ici

| Arbitrage | Objet | Effet sur ce document |
|---|---|---|
| **ARB-004** | `n-doc-barman` est une note **interne**, non publique | Aucun changement de route. Effet sur la matrice d'étanchéité : cette note est traitée comme interne **sur toutes les routes et pour tous les personas**, `/guides/…` compris — un corpus qui l'exposerait ferait certifier la fuite par la comparaison visuelle |
| **ARB-005** | Articulation du refus indiscernable et de l'état « sans droit » | Appliqué partout où ce document décrit un refus : §3 (préambule), §5.5 (quatre principes), §6 (les deux régimes). L'indiscernabilité inclut le **temps de réponse**. Manque de couverture nommé par l'arbitrage et **non résolu** : aucune batterie ne mesure aujourd'hui l'indiscernabilité temporelle — à outiller au lot T-011 |
| **ARB-006** | Les corrections du cadrage vivent à l'errata, `cadrage/` n'est pas modifié | Ce document cite `E-xx` là où il citait un défaut du cadrage. Il ne propose plus de « corriger le CDC » : la correction existe déjà, datée et opposable |

*(ARB-008 — ligne pnpm 11 — est sans effet sur l'adressage.)*

### 8.2 Ce que ce document continue de ne pas trancher

La règle de non-comblement reste en vigueur. Un point reste **signalé, non résolu**, et ce n'est
pas un vide d'adressage :

- **La mesure de l'indiscernabilité temporelle** (ARB-005), sans batterie à ce jour — assignée à T-011 (`ECART-009 e)`). Tant qu'elle n'existe pas, **aucun lot ne déclare `RG-ACC-04` tenue** : la matrice du §5.5 décrit ce qui doit être rendu, elle ne prouve pas ce qui ne doit pas fuiter.

**Deux points l'ont quitté depuis la première rédaction de cette section**, et par des voies opposées. Le fil d'Ariane de la bibliothèque : refuser de le combler était juste, et la réconciliation a montré qu'il n'y avait rien à combler — la maquette avait déjà répondu (`ECART-009 b)`). La référence de l'état « sans droit » : corrigée à la source dans ADR-007 et ARB-005, elle n'a plus à être signalée ici (`ECART-009 a)`).

---

## 9. Récapitulatif chiffré

| Grandeur | Nombre | Écart à la première rédaction |
|---|---|---|
| Routes servant une vue | **35** | −3 : V-38, V-39 et V-40 cessent d'être des routes (ARB-002) |
| Routes de redirection ou de service (sans vue) | **5** — `/console`, `/deconnexion`, pièces jointes, archive d'export, capture 404 | −1 : `/domaines/{d}` supprimée (ARB-001) |
| **Total des routes** | **40** | −4. C'est le décompte arrêté par ARB-002 |
| Vues couvertes | **41 / 41** | — |
| dont vues sans route propre | **6** — V-09 et V-15 (superpositions), V-37 (gabarit), V-38, V-39 et V-40 (sections de V-41) | +3 |
| dont vues rendues à toute adresse non résolue | **2** — V-04, V-26 | — |
| Vues servies par deux routes ou plus | **4** — V-06, V-17, V-23, V-35 | — |
| Routes servant deux vues selon la session | **2** — `/` et `/recherche` | — |
| **États déclarés, tous traçables** | **268** *(voir l'avertissement ci-dessous)* | inchangé : une vue qui perd son adresse ne perd pas ses états |
| dont issus d'un contrôle de planche | **221** (37 planches, E-03) | — |
| dont issus d'une présentation côte à côte | **47** (V-09 : 6 · V-35 : 4 · V-39 : 20 · V-40 : 10 · V-41 : 11 familles) | — |
| Paramètres d'état attestés par une maquette | **3** — `?registre=`, `?version=`, `#{ancre}` | — |
| Paramètres d'état dérivés d'un contrôle de maquette ou d'un arbitrage | **21** | +1 : `?noeud=` (ARB-007) |
| Points portés à l'arbitrage | **6**, dont **6 clos** — A-01…A-06 | tous fermés |
| Contradictions cadrage ↔ maquettes | **9**, dont **5** tranchées par préséance et **4** closes par arbitrage ou errata | aucune ouverte |

> **Avertissement sur les décomptes d'états — `ECART-009 c)`.** Trois vues divergent entre ce document et `verif/scenarios/` : **V-03** (5 ici, 4 là), **V-08** (8 ici, 7 là), **V-39** (20 ici, 21 là). Deux dérivations de la même source n'aboutissent pas au même ensemble.
>
> **`verif/scenarios/` fait foi** : il est extrait mécaniquement des planches, et c'est lui que la commande exécute. Le critère de sortie de tout lot de vue s'énonce « conforme sur **tous** les états déclarés dans `verif/scenarios/V-xx.json` » — il désigne cet ensemble-là, jamais le décompte de ce tableau.
>
> **L'alignement n'est pas fait ici, et c'est délibéré.** Le lot qui écrit les scénarios est en cours ; s'aligner sur un fichier non figé produirait un alignement faux, à refaire. La réconciliation se fera à la clôture de T-007. Le total de 268 est donc à lire comme le décompte de la première dérivation, conservé pour la traçabilité, non comme l'ensemble opposable.

---

*Fin de `docs/routes.md` — lot T-006 (vague 0), révisé au lot T-006b après les arbitrages ARB-001
à ARB-008 et l'errata du cadrage.*
