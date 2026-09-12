# Utiliser Codicillus

## Premiers pas sur une instance vide

1. Se connecter avec le premier administrateur créé pendant l'installation.
2. Ouvrir **Console → Univers** et créer un univers, par exemple « Exploitation ».
3. Ouvrir **Console → Domaines**, choisir cet univers et créer un domaine.
4. Ouvrir le domaine, puis créer une note. Ajouter des dossiers si le rangement le nécessite.
5. Rédiger le registre Référence, enregistrer, puis vérifier la note après relecture.

La console permet aussi de créer les comptes, les types de fiches, les types de relations et les
modèles de note. Aucun contenu de démonstration n'est nécessaire pour utiliser l'application.

## Organiser les connaissances

Un **univers** regroupe des **domaines**. Un domaine contient des notes, éventuellement rangées dans
des dossiers imbriqués jusqu'à dix niveaux. Les **étiquettes** permettent de retrouver des sujets
transversaux sans déplacer les notes.

Une **fiche** est une note portant un type et des propriétés structurées : application, serveur,
équipement réseau ou contact, selon les types créés sur l'instance. Les relations qualifient les
liens entre notes, par exemple « héberge » ou « dépend de ».

Les modules disponibles dans un domaine se règlent dans la console. Les signets regroupent les
liens externes ; la cartographie et la modélisation permettent d'explorer les relations.

## Référence et Opérationnel

Chaque note possède un registre **Référence**. Un registre **Opérationnel** peut le compléter avec
les étapes à suivre, commandes et points de contrôle. Les deux contenus se modifient séparément et
peuvent avoir des durées de validité et des dates de vérification différentes.

L'éditeur permet notamment les titres, listes, tâches, tableaux, blocs de code, liens, images et
schémas. Enregistrer conserve le contenu et son historique. Vérifier atteste une relecture ; ce
n'est pas la même action qu'enregistrer une modification.

## Lire la vivacité

| État | Sens |
|---|---|
| À jour | La prochaine échéance est encore éloignée |
| Bientôt à vérifier | L'échéance approche, ou tombe aujourd'hui |
| À vérifier | L'échéance est dépassée depuis peu |
| À revoir | Le retard est plus important, ou une révision a été demandée |
| Obsolète | La durée de retard a atteint le dernier seuil |

Le signal concerne le registre affiché. La vivacité indique le temps écoulé et les demandes de
révision ; elle ne garantit pas l'exactitude du contenu. Un utilisateur habilité peut vérifier le
registre après relecture. Les [règles détaillées](vivacite.md) expliquent le calcul et les seuils.

## Retrouver et relier les notes

La recherche par mots-clés accepte des filtres selon le périmètre et les droits du compte.
La palette de recherche permet un accès rapide depuis la navigation. Les relations et les liens
internes offrent un autre chemin pour parcourir le corpus.

La recherche sémantique n'est pas active dans cette version. Les résultats disponibles reposent
sur les mots-clés ; installer un service de modèles ne l'active pas.

## Importer et exporter

L'import accepte du Markdown et du texte. Le service de conversion ajoute les formats bureautiques
pris en charge, notamment DOCX, PPTX et PDF. Le résultat d'une conversion dépend de la structure du
fichier ; vérifier les notes obtenues avant de les considérer comme une référence.

L'interface d'import permet de choisir le rangement et de consulter les résultats par fichier.
Les exports se trouvent dans la console. Un export de contenu facilite un transfert de corpus ;
la sauvegarde complète de l'instance relève de la [procédure d'exploitation](exploitation.md).

## Comptes, droits et publication

L'administrateur gère les comptes et l'accès à la console. Les droits de dossier se transmettent
dans l'arborescence, avec priorité au droit explicite le plus proche. Les actions proposées dans
l'interface dépendent des droits effectifs.

Les notes internes demandent un accès autorisé. Une note publique doit aussi être publiée pour
être accessible sans connexion, et reste soumise aux règles du périmètre public.
Ne pas confondre la visibilité d'une note avec le caractère public du code source de Codicillus.

## Historique et profil

L'historique permet de retrouver les versions et les vérifications d'une note. La comparaison
montre les différences entre versions ; la restauration remet un ancien contenu en service selon
les droits du compte.

Le profil permet de modifier les informations personnelles et le mot de passe. Les nouveaux
comptes créés depuis la console doivent changer leur mot de passe temporaire à la première connexion.
