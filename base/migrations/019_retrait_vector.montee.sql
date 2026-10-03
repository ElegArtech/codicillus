-- Retire l’extension inutilisée des installations antérieures.
-- Sans CASCADE : aucune donnée dépendante ne doit être supprimée.
DROP EXTENSION IF EXISTS vector;
