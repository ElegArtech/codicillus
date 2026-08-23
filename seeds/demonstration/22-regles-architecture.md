---
identifiant: n-regles-d-architecture
titre: Règles d'architecture
type: Note
domaine: Doctrine
dossier: Architecture
auteur: s.nguyen
etiquettes: architecture, doctrine
verifie-il-y-a-jours: 410
---
Ces règles s'appliquent à tout nouveau composant et à toute évolution majeure d'un composant existant. Elles ne s'appliquent pas rétroactivement : un composant conforme aux règles en vigueur au moment de sa mise en service le reste jusqu'à sa prochaine évolution majeure.

## Règles {#s-regles}

**ARCH-01 — Pas d'adhérence à un fournisseur sans porte de sortie.** Tout service reposant sur une offre propriétaire documente sa stratégie de sortie : format d'export, délai de réversibilité, coût estimé.

**ARCH-02 — L'authentification est centralisée.** Aucune application ne gère ses propres mots de passe. L'annuaire est la source unique des identités.

**ARCH-03 — Les échanges entre applications sont contractualisés.** Une intégration s'appuie sur une interface publiée et versionnée, jamais sur un accès direct à la base d'une autre application.

**ARCH-04 — Une donnée a un propriétaire et un seul.** Le propriétaire décide de sa structure et de sa diffusion. Les autres applications la consomment, ne la dupliquent pas.

**ARCH-05 — Ce qui n'est pas exploitable n'est pas mis en production.** Journalisation, supervision, sauvegarde et procédure de redémarrage sont livrés avec le service, pas après lui.

## Instruction d'un écart {#s-instruction-d-un-ecart}

Un écart est instruit par le comité d'architecture, qui rend un avis, et arbitré par le CODIR SI. Un écart accordé est daté et inscrit à la dette technique.
