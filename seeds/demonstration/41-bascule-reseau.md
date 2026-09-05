---
identifiant: n-bascule-du-reseau-de-secours
titre: Bascule du réseau de secours
type: Procédure
domaine: Infrastructure
dossier: Réseau
auteur: j.tanaka
etiquettes: reseau, astreinte, continuite
verifie-il-y-a-jours: 5
validite-operationnel: 30
verifie-operationnel-il-y-a-jours: 5
---
La bascule fait passer le trafic sortant du lien opérateur principal vers le lien de secours. Elle est jouée en cas de coupure du lien principal, de dégradation prolongée, ou lors des exercices semestriels.

## Ce que la bascule change {#s-ce-que-la-bascule-change}

Le lien de secours offre **un quart de la bande passante** du principal et une latence supérieure d'environ 12 ms. Les conséquences sont connues et il faut les annoncer plutôt que les découvrir :

- la sauvegarde hors site ne tient plus sa fenêtre nocturne ;
- la visioconférence se dégrade au-delà de trente participants ;
- les transferts de gros fichiers vers l'extérieur doivent être différés.

## Décision {#s-decision}

La bascule est décidée par l'astreinte réseau seule si le lien principal est **coupé**. Elle est décidée conjointement avec le responsable de production s'il est seulement **dégradé** : une bascule inutile coûte plus qu'une lenteur temporaire.

## Retour au nominal {#s-retour-au-nominal}

Le retour n'est pas automatique et ne doit pas l'être : un lien qui remonte puis retombe ferait osciller le trafic. On attend **deux heures de stabilité** avant de rebasculer, et le retour se fait hors heures ouvrées.


--- OPERATIONNEL ---


## 1. Constater {#s-1-constater}

- [ ] Vérifier l'état du lien principal sur la supervision.
- [ ] Confirmer auprès de l'opérateur — un ticket est ouvert dans tous les cas.
- [ ] Noter l'heure de la coupure : elle conditionne les pénalités contractuelles.

## 2. Annoncer {#s-2-annoncer}

- [ ] Prévenir le responsable de production.
- [ ] Publier l'information sur le canal d'incident, en nommant les trois effets attendus (sauvegarde, visioconférence, transferts).

## 3. Basculer {#s-3-basculer}

- [ ] Modifier la préférence de route sur le routeur de bordure.
- [ ] Vérifier la propagation depuis un poste du réseau interne.
- [ ] Contrôler que le flux de supervision passe toujours — c'est lui qui vous dira si la bascule a réussi.

## 4. Adapter l'exploitation {#s-4-adapter-l-exploitation}

- [ ] Décaler la fenêtre de sauvegarde hors site.
- [ ] Suspendre les transferts sortants programmés.

## 5. Revenir {#s-5-revenir}

- [ ] Attendre deux heures de stabilité confirmée du lien principal.
- [ ] Rebasculer hors heures ouvrées.
- [ ] Rétablir la fenêtre de sauvegarde et les transferts.
- [ ] Clore le ticket opérateur avec la durée réelle de l'incident.
