---
identifiant: n-gestion-de-parc
titre: Gestion de parc
type: Fiche
fiche: Application
domaine: Applications
dossier: Fiches applicatives
auteur: l.pereira
etiquettes: application, parc, support
verifie-il-y-a-jours: 320
proprietes: editeur=Teclib; version=10.0.16; criticite=Importante; donnees-personnelles=oui; contrat=2027-03-31
---
Application de gestion du parc et des tickets de support. Utilisée quotidiennement par le support et, pour la saisie de tickets, par l'ensemble des agents.

## Ce qu'elle porte {#s-ce-qu-elle-porte}

L'inventaire du parc, les tickets de support, et les contrats fournisseurs. Elle contient des **données personnelles** — nom, service, poste attribué — et entre donc dans le registre des traitements.

## Points d'attention {#s-points-d-attention}

- L'authentification passe par l'annuaire (ARCH-02) ; aucun mot de passe local.
- La version 10.0.16 est en retard de deux versions mineures. La montée est inscrite au portefeuille mais non planifiée.
- L'export mensuel vers le contrôle de gestion s'appuie sur une requête directe en base, **contraire à ARCH-03**. Un écart est ouvert.
