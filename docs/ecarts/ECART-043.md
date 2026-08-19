# ÉCART-043 — Quatre écarts numérotés n'existent pas, et deux fichiers de seuil s'y adossent — 19 août 2026

**Gravité : moyenne. Défaut d'orchestrateur. Relevé par audit mécanique, pas par lecture.**

Le dépôt cite **quatre** numéros d'écart dont le fichier n'a jamais été écrit. Ils sont cités depuis
**huit** endroits, dont deux fichiers de `verif/references/` — les artefacts les plus opposables du
dépôt — et un instrument.

## Le fait, mesuré

```
$ for n in $(grep -rhoP "ECART-0\d\d" verif/ src/ base/ seeds/ docs/ CLAUDE.md | sort -u); do
    [ -f "docs/ecarts/$n.md" ] || echo "MANQUANT: $n"; done
MANQUANT: ECART-029
MANQUANT: ECART-030
MANQUANT: ECART-034
MANQUANT: ECART-042
```

`docs/ecarts/` porte **35** fichiers, numérotés 001 à 028, puis 033, 036 à 041.

| Numéro | Cité depuis | Ce que le citant en dit |
|---|---|---|
| **ECART-029** | `verif/banc/mode-demo.mjs:239`, `verif/references/protocole-app.json` bloc `focalisations` | la focalisation déclarée par la maquette, rendue vraie des deux côtés par le banc ; coût mesuré 5 148 px sur `V-23 env-page` |
| **ECART-030** | `docs/arbitrages.md:763` — `ARB-024` déclare y répondre (« É-3 ») | la famille des notifications suit V-38, et V-06 demande un regel |
| **ECART-034** | `docs/arbitrages.md:806` — `ARB-025` déclare y répondre (« É-1 ») | V-20 recompose son enveloppe, et le gabarit n'est pas rouvert |
| **ECART-042** | `verif/references/a11y-seuil.json:20`, `docs/reprise.md:65`, `docs/journal/V1.md:265`, `docs/orchestration.md:222` | « É-6 » : troisième source de non-déterminisme sur `V-37 chargement`, minuterie de 2 600 ms de `window.notifier` que les 2 × 1 000 ms d'avance virtuelle ne drainent pas |

## Pourquoi ce n'est pas une coquetterie de rangement

**Un seuil dont la justification est un pointeur mort n'est pas auditable.**
`verif/references/a11y-seuil.json:16-21` explique que **deux lignes sont volontairement absentes** du
seuil, et renvoie pour le motif à `ECART-042 É-6`. Le fichier est en écriture humaine seule
précisément pour qu'un tiers puisse *contrôler* la décision. Il ne peut pas : la pièce n'existe pas.

**Et deux arbitrages s'adossent à un dossier absent.** `ARB-024` et `ARB-025` écrivent « répond à
`ECART-030` É-3 » et « répond à `ECART-034` É-1 ». Un arbitrage se lit contre la question qu'il
tranche ; ici la question n'est nulle part.

C'est exactement la faute que la **question de clôture** du plan §9 est censée intercepter :

> *Le dépôt suffirait-il à réexpliquer ce lot sans le rouvrir ?*

**Non, pour quatre lots.** Et l'on a répondu « oui » au journal de la vague 1, parce que personne
n'avait compté les fichiers.

## La cause, et elle est structurelle

`docs/orchestration.md` §1.6 impose à chaque contrat : *« ajoute toujours : ne commite pas ; ne crée
rien dans `docs/ecarts/` — je numérote »*. **La numérotation est donc un geste d'orchestrateur, et
rien ne le vérifie.** Un numéro s'attribue en écrivant la phrase qui le cite ; le fichier est un
second geste, et c'est celui qui a manqué quatre fois.

Même famille que le dernier point du §6 de `docs/orchestration.md` : *« aucun hook ne refuse la
clôture d'un lot sans mise à jour du journal »*. Deux traces obligatoires, aucune des deux exigible.

## Ce qui n'est pas fait, et pourquoi

**Le contenu des quatre dossiers n'est pas reconstitué, et il ne doit pas l'être par inférence.**
L'historique git ne le porte pas — recherché par `git log -S` sur les quatre numéros : seuls
apparaissent les commits qui les *citent*. Ce qui survit de chacun est **exactement** ce que la
colonne « ce que le citant en dit » ci-dessus rapporte, mot pour mot depuis les fichiers citants.

Écrire un dossier d'écart à partir d'un résumé de deuxième main produirait une pièce d'apparence
opposable et de contenu deviné — le pire des trois régimes de ce dépôt appliqué à sa propre mémoire.
`P-21` vaut aussi pour l'orchestrateur qui documente : *fichier, ligne, et ce qu'on y lit — ou rien.*

## Réparation proposée

**Bloquant, pas déclaratif** — la hiérarchie du dépôt est *bloquant > vérifiable > déclaratif*, et une
consigne de rigueur documentaire est le régime le plus faible qui soit.

Un contrôle de traçabilité qui **refuse** toute référence `ECART-0xx` sans fichier, `ARB-xxx` sans
entrée, `É-n` sans écart porteur, et `P-xx` sans section de `CLAUDE.md` §6. Il rougit aujourd'hui sur
quatre lignes, et c'est la preuve qu'il mord — un contrôle de traçabilité posé sur un dépôt sans
pointeur mort serait vert par vacuité, donc `P-5`.

**Les quatre lignes existantes sont alors une dette de départ**, à borner par un seuil qui ne peut que
descendre, et **non** à effacer en écrivant quatre dossiers devinés.

Confié à un lot d'instrument, avec les six règles de méthode de `docs/orchestration.md` §1.2 — dont la
quatrième : *prouver que la batterie sait dire non*, et *que la mutation n'est pas inerte*.
