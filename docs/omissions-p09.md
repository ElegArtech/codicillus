# Les omissions de P-09 — énumération, vue par vue

**Ce que ce fichier est.** La troisième condition d'`ARB-040` : *« l'omission est énumérée, vue par
vue »*. `ARB-040` autorise l'application à **omettre** un nœud que le gel rend **masqué**, à trois
conditions cumulatives — le nœud est effectivement masqué au gel pour cet état ; une règle du projet
exige l'absence (`P-09` / `RG-M05-08`, ou `P-04` / `RG-STR-06`) ; et l'omission est **énumérée**.
Les deux premières sont vérifiables par instrument ; la troisième ne l'est que par ce document.

**Il existait comme référence avant d'exister comme fichier.** Dix composants citaient
`verif/rapports/omissions-p09.md` — `V-07`, `V-08`, `V-10`, `V-11`, `V-13`, `V-14`, `V-15`, `V-22`,
`V-26` et `lib/lecture/NoteDeDemonstration.svelte` — et il n'avait **jamais été écrit**. Relevé au
lot **T-072**, qui le pose.

**Il n'est pas à l'adresse que ces dix composants citent, et il faut dire pourquoi.**
`verif/rapports/` est **ignoré par git** (`.gitignore:27`) : une énumération qui ne survit pas à un
commit n'est pas une référence. `ARB-040` §3 la veut d'ailleurs « dans un fichier de référence en
**écriture humaine seule** » — donc `verif/references/`, dont le bit d'écriture est **retiré** :
aucun agent ne peut l'y poser. Le fichier est donc ici, dans `docs/`, qui est suivi par git et dans
le périmètre d'écriture agentique. **Deux choses restent à faire par un humain**, et elles sont
remontées comme telles (T-072 É-5) : déplacer ce fichier vers `verif/references/` si l'on veut tenir
`ARB-040` §3 à la lettre, et redresser les dix pointeurs des composants.

**Ce que ce fichier n'est pas.** Ni un seuil, ni une autorisation. Le juge reste
`pnpm test:droits`, qui compte chaque omission en *constat favorable* — « l'application tient P-09
là où la maquette ne le tient pas » —, et `pnpm verif:maquette --contre=app`, qui exige zéro pixel
et zéro écart de structure sur la vue touchée. Une omission qui déplacerait quoi que ce soit est
refusée par le banc, quel que soit ce qui est écrit ici.

---

## Le décompte

| | Actions omises | Mesuré par |
|---|---|---|
| Lots antérieurs à T-072 — les vues | **32** | `pnpm test:droits`, ligne « constat favorable » |
| Lot T-072 — la coquille | **27** | idem |
| **Total** | **59** | |

Toutes relèvent du même motif : **`P-09` / `RG-M05-08`**. Aucune ne relève de `P-04` / `RG-STR-06`.

---

## 1. La coquille — lot T-072, 27 actions

Deux fichiers, six nœuds conditionnés, et **le rendu seul est conditionné** : la classe `si-*` reste
intacte sur le nœud émis, parce qu'elle porte aussi la mise en forme.

| Nœud | Fichier | Règle du socle | Vues |
|---|---|---|---|
| `a.rail__lien.si-ecriture` « Import », forme abrégée | `src/lib/coquille/Rail.svelte` | `socle.css:396` | V-08, V-10, V-11, V-13, V-15, V-22, V-26 |
| `div.rail__section.si-ecriture` « Gestion › Console », forme abrégée | `src/lib/coquille/Rail.svelte` | `socle.css:396` | V-08, V-10, V-11, V-13, V-15, V-22, V-26 |
| `a.rail__lien.si-ecriture` « Import », forme complète | `src/lib/coquille/Rail.svelte` | `socle.css:396` | V-07, V-14 |
| `div.rail__section.si-admin` « Gestion › Console », forme complète | `src/lib/coquille/Rail.svelte` | `socle.css:397` | V-07, V-37 |
| `button.btn.si-ecriture` « Créer », forme abrégée | `src/lib/coquille/BarreSuperieure.svelte` | `socle.css:396` | V-08, V-10, V-11, V-13, V-15, V-22, V-26 |
| `div.menu-barre.si-ecriture#menu-creer` « Créer » et son menu, forme complète | `src/lib/coquille/BarreSuperieure.svelte` | `socle.css:396` | V-07, V-14 |

Soit **9 + 7 + 1 + 7 + 2 + 1 = 27** couples vue × action, tels que `pnpm test:droits --detail` les
nomme un par un.

**Une action de coquille N'EST PAS omise, et il faut le dire plutôt que le taire** :
`button.si-admin` « Console d'administration », dans `#menu-compte` de la forme complète. Elle vit
dans `.menu-barre__liste`, que le gel rend `display: none` tant que le menu est fermé, et aucun des
états déclarés ne l'ouvre : la batterie 7 la classe « hors état » **des deux côtés** et ne la compte
nulle part. Elle est **remontée** (T-072 É-4), pas fermée : la fermer eût été une décision
fonctionnelle prise en exécution, hors des 26 actions que le contrat nommait.

## 2. Les vues — lots antérieurs, 32 actions

| Vue | Actions omises | Gouvernées par |
|---|---|---|
| V-07 | `#r-note` « Nouvelle note », `#r-import` « Importer des fichiers », `#r-signet` « Nouveau signet » | `data-droits` |
| V-11 | `#a-exporter` « Exporter » (`si-admin`), `#a-creer` « Nouvelle note », `#a-importer` « Importer ici » | `data-role`, `data-droits` |
| V-13 | `#a-sousdossier`, `#a-renommer`, `#a-droits`, `#a-supprimer` (`si-gestionnaire`), `#a-note` (`si-redacteur`) | `data-droit` |
| V-14 | `#btn-verifier`, `#btn-reviser`, « Modifier la référence », « Modifier l'opérationnel », « Supprimer », « + Ajouter » | `data-droits` |
| V-15 | `#btn-verifier`, `#btn-reviser`, `#txt-reviser`, `#btn-reviser-envoi`, `#btn-reviser-annul` | `data-droits` |
| V-22 | `#nouveau` « Nouveau signet », 4 × « Modifier », 4 × « Supprimer le signet … » | `data-droits` |
| V-26 | `#sup-restaurer` « Demander sa restauration » | `data-droits` |

---

*Posé au lot T-072. Toute campagne de portage qui ferme une action gouvernée l'ajoute ici, et le
décompte de ce fichier doit rester égal à la ligne « constat favorable » de `pnpm test:droits`.*
