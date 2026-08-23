---
identifiant: n-astreinte-conduite-a-tenir
titre: Astreinte — conduite à tenir
type: Procédure
domaine: Infrastructure
dossier: Exploitation › Astreinte
auteur: k.belhadj
etiquettes: astreinte, incident, exploitation
verifie-il-y-a-jours: 260
---
L'astreinte couvre les nuits, les week-ends et les jours fériés. Elle a un objectif unique : **rétablir le service**. Comprendre la cause est utile, mais vient après, et jamais au prix du rétablissement.

## Le périmètre {#s-le-perimetre}

L'astreinte intervient sur les services qualifiés vitaux. Elle n'intervient pas sur les demandes de support, les questions d'usage, ni les incidents affectant un utilisateur isolé — ceux-là attendent l'ouverture.

## Les trois questions {#s-les-trois-questions}

À chaque appel, dans cet ordre :

1. **Qu'est-ce qui ne marche plus, vu du métier ?** Pas « le serveur ne répond pas », mais « on ne peut plus enregistrer les commandes ».
2. **Depuis quand, et qu'est-ce qui a changé ?** Un changement récent explique la majorité des incidents. Le relevé du comité des changements est en ligne.
3. **Combien de personnes sont bloquées ?** C'est ce qui décide de réveiller quelqu'un d'autre ou d'attendre le matin.

## Escalade {#s-escalade}

| Situation | Qui | Délai |
|---|---|---|
| Service vital interrompu | responsable de production | immédiat |
| Suspicion de compromission | RSSI | immédiat, sans exception |
| Panne matérielle | support constructeur | selon contrat |
| Rien ne marche et rien n'est compris | responsable de production | 45 minutes |

La dernière ligne est la plus importante et la moins appliquée. Au bout de quarante-cinq minutes sans piste, on appelle. Ce n'est pas un aveu d'échec, c'est la procédure.


--- OPERATIONNEL ---


## À la prise d'astreinte {#s-a-la-prise-d-astreinte}

- [ ] Vérifier la réception des alertes sur le téléphone d'astreinte.
- [ ] Lire le relevé du dernier comité des changements.
- [ ] Vérifier qu'aucune intervention n'est en cours.

## À l'appel {#s-a-l-appel}

- [ ] Poser les trois questions et noter les réponses.
- [ ] Ouvrir un ticket d'incident, même si l'appel dure deux minutes.
- [ ] Annoncer un premier délai de retour, même approximatif.

## Pendant {#s-pendant}

- [ ] Rétablir d'abord, comprendre ensuite.
- [ ] Consigner chaque action au fil de l'eau, avec l'heure.
- [ ] Escalader au bout de 45 minutes sans piste.

## À la clôture {#s-a-la-cloture}

- [ ] Confirmer le rétablissement auprès de l'appelant, pas seulement de la supervision.
- [ ] Rédiger le compte rendu avant de vous recoucher — il ne sera jamais aussi juste que maintenant.
- [ ] Signaler à réviser toute procédure qui s'est révélée fausse cette nuit.
