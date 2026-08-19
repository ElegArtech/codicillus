-- Annulation de 001. `CASCADE` n'est pas employé : si une colonne `vector`
-- existait, le refus doit être visible plutôt que silencieusement contourné.
DROP EXTENSION IF EXISTS vector;
