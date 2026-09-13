# Requêtes de documentation — maquettes

Ouvrir **[index.html](index.html)** puis les vues du prototype. Les fichiers se consultent directement dans un navigateur, ou depuis un serveur statique. Le paquet contient les styles, les polices et le logo nécessaires ; aucun CDN n’est utilisé.

Ces maquettes proposent les ajouts à Codicillus. Elles ne constituent pas une fonctionnalité installée et ne déposent rien en base. Les exemples évoluent dans le stockage de l’onglet. « Maquettes · choisir une vue » permet de passer du public à l’administration puis au demandeur sans perdre le parcours. « Réinitialiser les exemples » restaure les situations de départ.

## Environnement conservé

Les enveloppes proviennent du **rendu navigateur du dépôt à partir du commit c10ba56**, le 13 septembre 2026 : V-01, V-02, V-07, V-08, V-14, V-17 et V-27. `vues.js` contient ces rendus, sans scripts applicatifs ni données de session. Les feuilles de `assets/` sont celles que le navigateur chargeait. Le compte personnel est remplacé par Camille Martin et une adresse de démonstration.

Les vues « Installation neuve » proviennent d’une base PostgreSQL distincte, migrée, sans univers, domaine ni note. La variante lecteur provient d’un compte lecteur réel de cette instance. Le corpus de l’instance de travail a été conservé.

La barre supérieure, le rail, les groupes de console, leurs onze sections et leurs compteurs sont conservés. Le nouveau module se place à la fin de **Contenus**. Le sélecteur mobile reçoit la même entrée. Les liens « Vue actuelle » permettent la comparaison sans les ajouts. Les fonctions existantes hors du parcours ouvrent l’application locale sur le port 5173 dans un autre onglet ; leurs écrans ne sont pas réimplémentés dans ce paquet.

`requetes.css` ne porte que les ajouts. Le formulaire d’univers masqué, propre à V-27, n’est pas repris dans le nouveau module. La lecture d’une réponse et l’éditeur conservent leur disposition existante ; leurs données de requête sont simulées.

## Décisions représentées

- Dépôt autonome public ou connecté, disponible indépendamment de la recherche et de son nombre de résultats. La recherche est un contexte facultatif. Aucun champ de contact.
- Sujet de 160 caractères au maximum ; besoin de 2 000. Les dépassements sont signalés sans tronquer la saisie. Échec d’envoi avec saisie conservée et nouvel essai.
- **À évaluer → Acceptée → Diffusée** ; sortie **Non retenue**. La console est réservée à l’administration. Un domaine est facultatif à l’acceptation : une installation neuve peut recevoir et accepter un besoin.
- L’association à une note ne vaut pas diffusion. Une note en brouillon conserve l’état Acceptée. Dans cette proposition, après publication ou association à une note déjà publiée, l’administrateur **confirme la diffusion** : publier seul ne prouve pas que le besoin est traité. Une réponse destinée au public doit être publique.
- Le commentaire interne reste dans la console. Le commentaire destiné au demandeur apparaît dans son suivi, à sens unique, sans conversation.
- Le visiteur anonyme reçoit seulement un accusé immédiat. Un compte retrouve l’acceptation, la non-retenue et la diffusion ; ouvrir une décision retire son signal de nouveauté.
- L’accueil garde les compteurs de vivacité. Le nombre à évaluer et l’actualité personnelle se présentent en lignes distinctes dans « À surveiller », absentes à zéro. Le lien de dépôt est secondaire ; le suivi reste accessible dans le menu du compte même sans nouvelle décision.
- Une suppression retire le contenu du module et garde une trace administrative sans recopier le besoin. Pour un dépôt connecté, elle conserve une indication de décision dans le suivi ; une requête encore à évaluer ou acceptée devient Non retenue. Ce reçu conserve le sujet et le commentaire destiné au demandeur.
- Une installation sans domaine peut accepter la requête ; la rédaction attend la création du rangement.

Le dépôt depuis une note (V-03), une messagerie, le courrier électronique et une file répartie entre rédacteurs ne sont pas représentés. Les durées de conservation et la notice propre à l’organisation restent à définir avant la mise en service ; aucune durée n’est inventée par la maquette.

## Parcours et captures

Les [captures](captures/) figent les propositions : accueils public, administrateur et lecteur ; formulaire et erreurs ; recherche ; accusés ; suivi ; file et détail ; acceptation ; association ; brouillon dans l’éditeur ; diffusion ; refus ; suppression ; installation neuve ; variantes mobiles.

Le parcours joué dans un navigateur comprend le dépôt anonyme à zéro donnée, le dépôt connecté, la qualification, l’association à un brouillon, l’enregistrement, la publication, la confirmation de diffusion, le suivi, la non-retenue avec séparation des commentaires, la suppression et le nouvel essai après un échec d’envoi. Les rendus sont contrôlés à 390, 1 180 et 1 440 pixels.
