---
identifiant: n-lire-une-alerte-de-supervision
titre: Lire une alerte de supervision
type: Guide
domaine: Infrastructure
dossier: Supervision
auteur: j.tanaka
etiquettes: supervision, incident
verifie-il-y-a-jours: 47
---
La supervision produit environ soixante alertes par semaine. La plupart ne demandent aucune action. Ce guide sert à faire le tri sans y passer la journée, et surtout à ne pas s'habituer au bruit — une alerte qu'on ignore par réflexe est une panne qu'on découvrira par un appel.

## Les trois niveaux {#s-les-trois-niveaux}

**Information.** Un état a changé, rien n'est dégradé. On ne fait rien. Si une alerte d'information se répète, on la supprime : une alerte qui ne déclenche jamais d'action ne doit pas exister.

**Avertissement.** Un seuil est franchi, le service tient encore. On regarde dans la journée. C'est le niveau où se joue la prévention.

**Critique.** Le service est dégradé ou interrompu. On agit immédiatement, y compris en astreinte.

## Ce qu'il faut regarder avant d'agir {#s-ce-qu-il-faut-regarder-avant-d-agir}

1. **L'alerte est-elle isolée ?** Dix alertes simultanées désignent rarement dix pannes : cherchez le point commun — une salle, un lien, un hyperviseur.
2. **Y a-t-il eu un changement ?** Croisez avec le relevé du comité.
3. **L'alerte est-elle déjà connue ?** Un incident ouvert porte souvent déjà la cause.

## Les faux positifs fréquents {#s-les-faux-positifs-frequents}

| Alerte | Cause habituelle | Action |
|---|---|---|
| Espace disque, serveur de sauvegarde | rotation en cours | attendre 30 min |
| Latence réseau, nuit | fenêtre de sauvegarde | aucune |
| Charge processeur, lundi 8 h | reprise d'activité | aucune |

Ces trois-là représentent près de la moitié du bruit. Elles sont documentées ici plutôt que supprimées, parce qu'elles cessent d'être des faux positifs le jour où elles surviennent hors de leur créneau habituel.
