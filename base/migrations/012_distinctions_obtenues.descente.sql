-- Annulation de 012. La clé primaire tombe avec la table ; aucun index n'a été
-- créé séparément — `(compte_id, cle)` sert les deux seules lectures du produit,
-- « les distinctions de CE compte » et « celle-ci l'est-elle déjà ? ».
--
-- LES INSTANTS D'OBTENTION SONT PERDUS : une remontée les réattribuera à la
-- date du jour. C'est le prix d'une descente, et rien d'autre n'est touché — les
-- contributions qui les fondent vivent dans leurs propres tables.
DROP TABLE distinctions_obtenues;
