---
identifiant: n-politique-de-sauvegarde
titre: Politique de sauvegarde
type: Note
domaine: Doctrine
dossier: Sécurité
auteur: k.belhadj
etiquettes: sauvegarde, doctrine, continuite
verifie-il-y-a-jours: 38
---
Ce document fixe ce qui est sauvegardé, à quelle fréquence, pour combien de temps, et surtout **comment on prouve que la restauration fonctionne**. Une sauvegarde dont la restauration n'a jamais été jouée n'est pas une sauvegarde, c'est une dépense.

## La règle 3-2-1 {#s-la-regle-3-2-1}

Toute donnée de production respecte, sans exception :

- **3** copies — la donnée vivante et deux sauvegardes ;
- **2** supports distincts — disque et bande, ou disque et objet distant ;
- **1** copie hors site, déconnectée du réseau de production.

## Fréquences et rétentions {#s-frequences-et-retentions}

| Nature | Fréquence | Rétention | Hors site |
|---|---|---|---|
| Bases de données de production | quotidienne, complète | 30 jours | oui |
| Journaux de transaction | continue | 30 jours | oui |
| Serveurs de fichiers | quotidienne, incrémentale | 90 jours | oui |
| Configuration des équipements réseau | à chaque changement | 12 mois | oui |
| Postes de travail | non sauvegardés | — | — |

Les postes ne sont pas sauvegardés, et c'est une décision : les données de travail vivent sur les serveurs de fichiers. Un poste perdu ne doit rien coûter d'autre que le poste.

## Preuve de restauration {#s-preuve-de-restauration}

**Deux exercices par an**, en avril et en octobre, portant chacun sur au moins :

1. une base de production restaurée à un instant donné, choisie au hasard ;
2. un serveur de fichiers restauré intégralement sur matériel de secours ;
3. une configuration réseau restaurée depuis la sauvegarde hors site.

Chaque exercice donne lieu à un compte rendu chiffré : durée réelle de restauration, écart au délai annoncé, incidents rencontrés. Le compte rendu est présenté au comité sécurité.

## Ce que cette politique n'autorise pas {#s-ce-que-cette-politique-n-autorise-pas}

Elle n'autorise pas à considérer une réplication comme une sauvegarde. Une réplication propage l'effacement ; elle protège de la panne, pas de l'erreur ni du chiffrement malveillant.
