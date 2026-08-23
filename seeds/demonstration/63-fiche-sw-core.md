---
identifiant: n-sw-core-01
titre: sw-core-01
type: Fiche
fiche: Équipement réseau
domaine: Infrastructure
dossier: Réseau
auteur: j.tanaka
etiquettes: reseau, coeur, vital
verifie-il-y-a-jours: 175
proprietes: modele=Catalyst 9300; role=Cœur; salle=Datacentre A; fin-de-support=2028-07-31
---
Commutateur de cœur du datacentre A. **Point de passage unique** du trafic entre les serveurs et le reste du réseau : il n'a pas de redondance, et c'est le risque majeur identifié au plan de traitement.

## Le risque, nommé {#s-le-risque-nomme}

Une panne de cet équipement interrompt tous les services hébergés en salle A. Le délai de remplacement contractuel est de quatre heures ouvrées, ce qui, un vendredi soir, signifie lundi matin.

L'acquisition d'un second châssis est demandée depuis deux exercices. Elle figure au portefeuille sans être engagée.

## Configuration {#s-configuration}

La configuration est sauvegardée à chaque changement et conservée douze mois, conformément à la politique de sauvegarde. Elle a été restaurée avec succès lors de l'exercice d'octobre 2025.
