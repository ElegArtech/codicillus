---
identifiant: n-bkp-01
titre: bkp-01
type: Fiche
fiche: Serveur
domaine: Infrastructure
dossier: Exploitation › Sauvegardes
auteur: m.ferreira
etiquettes: sauvegarde, serveur
verifie-il-y-a-jours: 63
proprietes: nom-dns=bkp-01.interne; systeme=Debian 13; salle=Datacentre B; vcpu=8; sauvegarde=non
---
Serveur de sauvegarde. Il **n'est pas lui-même sauvegardé** — c'est délibéré : il porte les copies, sa perte ne fait perdre aucune donnée vivante, et le sauvegarder doublerait le volume sans rien protéger de plus.

Il est placé en **datacentre B**, séparé de la production, et sa copie hors site part chaque nuit vers le stockage distant.

## Restauration {#s-restauration}

Le débit de restauration observé est de **50 Go par heure** vers le datacentre A. C'est ce chiffre, et non celui du constructeur, qui sert à annoncer une durée d'indisponibilité.
