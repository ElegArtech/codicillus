---
identifiant: n-inventaire-des-dependances-a-l-annuaire
titre: Inventaire des dépendances à l'annuaire
type: Note
domaine: Migration 2027
dossier: Cadrage
auteur: l.pereira
etiquettes: migration, annuaire, inventaire
verifie-il-y-a-jours: 640
revision-demandee: Trois applications ont été mises en service depuis, dont deux s'authentifient sur l'annuaire. L'inventaire est faux et il conditionne le lot 4.
revision-par: s.nguyen
revision-il-y-a-jours: 9
---
Le décommissionnement de l'annuaire actuel suppose qu'aucune application ne s'y appuie plus. Cet inventaire recense ce qui en dépend, et à quel titre.

## Ce qui s'authentifie sur l'annuaire {#s-ce-qui-s-authentifie-sur-l-annuaire}

| Application | Usage | Bascule |
|---|---|---|
| Gestion de parc | authentification et annuaire des agents | à prévoir |
| Portail intranet | authentification seule | simple |
| Serveur de fichiers | authentification et droits | délicate |

## Ce qui le lit sans s'y authentifier {#s-ce-qui-le-lit-sans-s-y-authentifier}

L'export des effectifs vers la paie lit l'annuaire en direct chaque nuit. Cette lecture est **contraire à ARCH-03** et devra être remplacée par une interface publiée avant la bascule.

## Ce qui reste à instruire {#s-ce-qui-reste-a-instruire}

Les applications mises en service après la rédaction de cet inventaire ne sont pas couvertes. La liste doit être reprise à partir du parc applicatif, pas de mémoire.
