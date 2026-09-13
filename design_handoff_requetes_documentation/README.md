# Requêtes de documentation — paquet de maquettes

Ce paquet fixe l'ajout des requêtes de documentation avant son implémentation.

## Ordre d'autorité

1. Ce README pour le comportement et les états.
2. Les captures de `captures/` pour la composition visuelle.
3. Le prototype `Requetes de documentation.dc.html` pour les enchaînements et le responsive.

Les vues existantes de Codicillus restent la référence de leur propre structure. Ces maquettes
n'ajoutent que les éléments nécessaires aux requêtes de documentation.

## Objet

Une requête de documentation est un besoin de connaissance formulé par un lecteur. Elle peut être
déposée sans recherche préalable et ne crée jamais une note automatiquement.

États visibles :

- **À évaluer** : aucune décision n'a été prise.
- **Acceptée** : le besoin est reconnu ; la réponse peut être en préparation.
- **Diffusée** : une note publiée répond au besoin.
- **Non retenue** : le besoin ne sera pas traité comme une production documentaire.

« Supprimée » n'est pas un état visible. Une suppression administrative laisse une trace dans le
journal de la console.

## Droits et retours

- Le dépôt est ouvert à l'anonyme et à tout compte authentifié.
- L'anonyme reçoit seulement l'accusé de dépôt immédiat.
- Le demandeur authentifié retrouve ses requêtes et les commentaires qui lui sont destinés.
- L'évaluation est réservée aux personnes habilitées au module de console.
- Un commentaire visible est un retour à sens unique, jamais un fil de discussion.

## Captures de référence

- `01-depot-public.png` — formulaire public, avec contexte de recherche facultatif.
- `02-accuse-public.png` — accusé anonyme, sans promesse de suivi individuel.
- `03-accueil-authentifie.png` — signal à évaluer et suivi des requêtes du compte.
- `04-console-a-evaluer.png` — file et détail avant décision.
- `05-console-acceptee.png` — besoin accepté, réponse en préparation.
- `06-console-closes.png` — requêtes diffusées et non retenues.
- `07-console-non-retenue.png` — décision et séparation des commentaires.
- `08-retour-demandeur.png` — commentaire visible par le demandeur authentifié.
- `09-depot-public-mobile.png` — formulaire public sur petit écran.
- `10-console-mobile.png` — file et détail de console sur petit écran.

## Règles fixées par les maquettes

- L'entrée publique permanente reste secondaire face à l'assistance.
- Une recherche précédente enrichit le formulaire mais ne conditionne jamais le dépôt.
- Le formulaire porte deux champs obligatoires : sujet et besoin.
- L'avertissement sur les données personnelles est visible au-dessus du champ libre.
- L'accueil ne montre aucun compteur à zéro.
- « À évaluer » et « Mes requêtes » sont deux signaux distincts.
- Accepter ne signifie pas diffuser.
- Diffuser exige une note publiée et rend son accès au demandeur authentifié.
- Ne pas retenir permet un commentaire interne et un commentaire visible distincts.

## Parcours du prototype

Le sélecteur de planche permet d'ouvrir chaque état. Dans les écrans eux-mêmes, les boutons
principaux conduisent à l'étape suivante : dépôt, accusé, évaluation, acceptation et diffusion.
Ajouter `&capture=1` à l'adresse masque le sélecteur de planche.
