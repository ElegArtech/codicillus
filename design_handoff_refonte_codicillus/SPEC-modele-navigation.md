# Modèle de données et navigation

## Entités (vue prototype → base réelle)

### Note
| champ | exemple | source dépôt |
|---|---|---|
| id / slug | `note-technique-claude-code-linux` | `notes.identifiant` |
| titre | Note technique — Installation de Claude Code sous Linux et mode autonome | `notes.titre` |
| univers, domaine, dossier | Claude / audit_code / — | rattachement |
| etiquettes | Linux, Ubuntu 20.04+, Claude Code, CLI Anthropic | étiquettes |
| creee, auteur | 13 août 2026, Alexandre Berge | `notes.cree_le`, compte |
| modifiee (date, par) | il y a 4 jours par Alexandre Berge | `notes.modifie_le` + `revision_*` |
| consultations (cumul, 30 j) | 2 / 2 | table consultations |
| version | v1.0.0 | versions |
| relations (n), pieces (n), retroliens (n) | 3 / 0 / 0 | panneaux |

### Registre (× 2 par note : reference, operationnel — l'opérationnel peut être absent)
| champ | exemple |
|---|---|
| verifiee | 2026-08-13 |
| validite (jours) | 90 (Référence) · 21 (Opérationnel) |
| par | Alexandre Berge |
| corps | blocs : p, code(lang, lignes), liste, etapes (cases), avis(info|danger), tableau, schema(mermaid) |
| sommaire | dérivé des h2 : numéro 01…, titre, sous-titre optionnel |

### Événement d'historique
`{ date, registre: 'reference'|'operationnel', type: 'verif'|'version'|'etat', etat?, titre, detail, version?, avant?, apres? }`

### Univers / Domaine (pages de garde)
- description (texte libre, configurable en console)
- répartition par état (5 compteurs) — agrégat des registres **Référence** des notes
- dernière activité, événements (verif, version, etat, import)
- domaine : nb notes, nb dossiers, fiches, signets

## Navigation (toutes les vues portent la même coquille)
| vue | route | atteinte par |
|---|---|---|
| Accueil | `/` | icône maison du fil d'Ariane, logo |
| Univers | `/univers/{id}` | ligne univers de la sidebar, chevron du tableau « Vos univers », fil d'Ariane d'une note, fil d'Ariane d'un domaine |
| Domaine | `/univers/{u}/{d}` | ligne domaine de la sidebar, ligne de la carte DOMAINES, « └ domaine » du bloc Contexte d'une note |
| Note | `/notes/{id}` | sidebar (feuilles), récents, listes de l'accueil / du domaine |
| Historique | `/notes/{id}/historique` | « Voir l'historique » (ligne de vivacité), « Historique des versions » (colonne droite, menu ⋮) ; retour par « ← Retour à la note » |
| Planche des états | bibliothèque V-41 | lien discret en pied de note |

Deep links du prototype (pour ouvrir une vue précise dans le navigateur) :
`#vue=accueil` · `#vue=univers&univers=Claude` · `#vue=domaine&univers=Claude&domaine=audit_code` · `#vue=note&note=claude&registre=reference` · `#vue=note&note=claude&registre=operationnel` · `#vue=historique&note=claude` · `#vue=etats` · `#vue=note&note=pg`. Ajouter `&largeur=1600` pour forcer la mise en page large.

## États d'interface à couvrir
- Registre : Référence seule (note `pg`) · Référence + Opérationnel (note `claude`) · Opérationnel sélectionné · création de l'Opérationnel (clic sur le CTA de `pg`)
- Vivacité : les 5 états (planche) ; `claude` Référence = À jour, `claude` Opérationnel = À vérifier (J+1), `pg` = À revoir (J+21)
- Historique : filtré par registre ; diff ouvert / fermé
- Relations 3 / pièces 0 / rétroliens 0 (`claude`) et 4 / 2 / 3 (`pg`) — compteurs compacts, jamais de zone vide
- Sidebar : nœud déplié / replié, actif (note, univers, domaine)
- Responsive : 3 colonnes ≥ 1380 ; sans sommaire 1180–1379 ; contexte en tiroir 1024–1179 ; sidebar + contexte en tiroirs < 1024
- Toast après vérification / révision / création d'opérationnel
