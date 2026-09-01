-- Annulation de 013. L'index tombe avec la table.
--
-- LES TRACES SONT PERDUES, ET RIEN NE PEUT LES RECONSTRUIRE : elles sont la
-- seule mémoire d'objets qui n'existent plus. Une descente de cette migration
-- est donc une perte sèche, à la différence de toutes les autres, où la donnée
-- se recalcule depuis ce qui reste.
DROP TABLE traces_de_suppression;
