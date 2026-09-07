---
identifiant: n-sub-linux
titre: Linux
type: Fiche
fiche: Serveur
proprietes: nom-dns=atelier-01.interne; systeme=Debian 13; salle=Local technique; vcpu=2; sauvegarde=oui
domaine: Atelier
dossier: Développement
auteur: j.tanaka
etiquettes: Développement, système
verifie-il-y-a-jours: 24
---
La chaîne de publication tourne sur Debian stable, sans couche d'orchestration : un service, un répertoire, une unité de démarrage.

Tout ce qui n'est pas dans ce répertoire peut disparaître sans conséquence, et c'est ce qui rend la restauration triviale.
