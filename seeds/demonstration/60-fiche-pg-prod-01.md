---
identifiant: n-pg-prod-01
titre: pg-prod-01
type: Fiche
fiche: Serveur
domaine: Infrastructure
dossier: Exploitation
auteur: k.belhadj
etiquettes: postgresql, serveur, vital
verifie-il-y-a-jours: 14
proprietes: nom-dns=pg-prod-01.interne; systeme=Debian 13; salle=Datacentre A; vcpu=16; sauvegarde=oui
---
Serveur de bases de données principal. Porte les bases des applications de gestion et du portail. **Service vital** : son indisponibilité arrête la saisie des commandes.

## À savoir avant d'intervenir {#s-a-savoir-avant-d-intervenir}

- Le redémarrage prend **4 à 6 minutes** — la reprise des index est plus longue que l'arrêt.
- La fenêtre de sauvegarde va de 2 h à 3 h 30 ; aucune intervention pendant.
- La supervision remonte une alerte de charge tous les lundis à 8 h : c'est la reprise d'activité, pas un incident.

## Capacité {#s-capacite}

L'espace de données est occupé à 62 %. La croissance observée est d'environ 3 Go par mois, ce qui laisse **environ dix-huit mois** avant extension.
