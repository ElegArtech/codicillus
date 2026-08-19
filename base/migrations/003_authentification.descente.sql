-- ═══════════════════════════════════════════════════════════════════════════
-- Annulation de 003 — l'ordre est l'inverse exact de la montée.
--
-- AUCUN `CASCADE`, comme en 002 : une dépendance oubliée doit faire ÉCHOUER
-- l'annulation, pas emporter silencieusement un objet que la montée n'avait pas
-- créé. C'est cette symétrie stricte que `pnpm base:reversibilite` mesure, par
-- comparaison d'empreintes et non par déclaration.
--
-- Les deux index tombent avec leurs tables ; la contrainte de la colonne
-- ajoutée tombe avec la colonne. Rien n'est laissé derrière.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE tentatives_de_connexion;
DROP TABLE sessions;

ALTER TABLE comptes DROP COLUMN condensat_mot_de_passe;
