---
identifiant: n-restaurer-une-sauvegarde-postgresql
titre: Restaurer une sauvegarde PostgreSQL
type: Procédure
domaine: Infrastructure
dossier: Exploitation › Sauvegardes
auteur: k.belhadj
etiquettes: postgresql, sauvegarde, astreinte, restauration
verifie-il-y-a-jours: 11
validite-operationnel: 21
verifie-operationnel-il-y-a-jours: 24
---
Cette procédure couvre la restauration d'une base PostgreSQL depuis les sauvegardes gérées sur le serveur de sauvegarde. Elle couvre la restauration complète et la restauration à un instant donné. Elle **ne couvre pas** la bascule d'un réplica en primaire, traitée séparément.

## Avant de commencer {#s-avant-de-commencer}

### Prérequis {#s-prerequis}

- Un accès d'administration sur le serveur de sauvegarde et sur le serveur cible.
- La clé du compte de sauvegarde déployée vers la cible.
- L'espace disque disponible sur la cible : au moins **1,4 fois** la taille de la sauvegarde.

### Fenêtre d'intervention {#s-fenetre-d-intervention}

> **ATTENTION — la base cible est arrêtée pendant toute la restauration.** Comptez 40 minutes pour une base de 120 Go sur disque local. Prévenez l'astreinte applicative avant de démarrer et déclarez la fenêtre au comité des changements si l'intervention n'est pas un rétablissement.

## Choisir la sauvegarde {#s-choisir-la-sauvegarde}

Les sauvegardes sont listées de la plus récente à la plus ancienne. Recoupez toujours l'identifiant obtenu avec le tableau de suivi tenu par l'exploitation : une sauvegarde valide au sens de l'outil peut porter des données déjà corrompues si l'incident est antérieur.

| Identifiant | Date | Type | Taille | Rétention |
|---|---|---|---|---|
| 20260310T020112 | 10 mars 2026, 02:01 | Complète | 118 Go | 30 jours |
| 20260303T020108 | 3 mars 2026, 02:01 | Complète | 117 Go | 30 jours |
| 20260224T020115 | 24 février 2026, 02:01 | Complète | 116 Go | 30 jours |

## Les deux modes {#s-les-deux-modes}

**Restauration complète** — on revient à l'état de la sauvegarde. C'est le mode du remplacement de matériel ou de la reconstruction d'un environnement.

**Restauration à un instant donné** — on rejoue les journaux de transaction jusqu'à un horodatage choisi. C'est le mode de la suppression accidentelle : on revient à la seconde qui précède l'erreur.

## Après la restauration {#s-apres-la-restauration}

Une restauration n'est pas finie quand la base démarre. Elle est finie quand une **requête témoin** rend le résultat attendu et que l'application se reconnecte. Le compte rendu d'intervention porte les deux, plus la durée réelle — c'est ce chiffre qui alimente la politique de sauvegarde.


--- OPERATIONNEL ---


## 1. Arrêter le service sur la cible {#s-1-arreter-le-service-sur-la-cible}

- [ ] Prévenir l'astreinte applicative.
- [ ] Arrêter le service de base de données sur le serveur cible.
- [ ] Vérifier qu'aucune connexion ne subsiste.

> **POINT DE NON-RETOUR** — au-delà de cette étape, la base cible est écrasée.

## 2. Transférer la sauvegarde {#s-2-transferer-la-sauvegarde}

- [ ] Se connecter au serveur de sauvegarde avec le compte dédié.
- [ ] Lancer la restauration vers la cible, en précisant l'identifiant relevé.
- [ ] Surveiller le transfert : il occupe la bande passante du lien de secours.

## 3. Rejouer les journaux {#s-3-rejouer-les-journaux}

- [ ] Laisser l'outil rejouer les journaux jusqu'à la fin de la sauvegarde.
- [ ] Pour une restauration à un instant donné, préciser l'horodatage cible **dans le fuseau du serveur de bases**, pas dans le vôtre.

## 4. Vérifier {#s-4-verifier}

- [ ] Démarrer le service.
- [ ] Exécuter la requête témoin et comparer au résultat attendu.
- [ ] Vérifier la reconnexion applicative.
- [ ] Relever la durée réelle et la consigner au compte rendu.

## En cas d'échec {#s-en-cas-d-echec}

Si le rejeu s'interrompt, ne relancez pas la restauration sur la même cible : le répertoire est dans un état intermédiaire. Repartez d'un répertoire vide, et signalez l'incident — un rejeu qui échoue met en cause la sauvegarde elle-même, donc toutes les autres.
