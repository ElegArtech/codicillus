-- ═══════════════════════════════════════════════════════════════════════════
-- Annulation de 009 — l'ordre est l'inverse exact de la montée.
--
-- AUCUN `CASCADE`, comme en 002 à 008 : une dépendance oubliée doit faire
-- ÉCHOUER l'annulation, pas emporter silencieusement un objet que la montée
-- n'avait pas créé.
--
-- Les index tombent avec leurs tables ; ils sont malgré tout retirés
-- EXPLICITEMENT et d'abord, pour la raison qu'énonce la descente de 005 — une
-- contrainte laissée à la charge d'un retrait de table est une symétrie qu'on
-- suppose.
--
-- LA MONTÉE N'ÉCRIT AUCUNE DONNÉE, donc la descente n'a rien à défaire : le
-- journal se remplit à l'usage. Une descente ne rend pas les imports non
-- advenus — elle en perd la trace, et c'est le prix d'une descente.
-- ═══════════════════════════════════════════════════════════════════════════

DROP INDEX lignes_de_lot_lot_idx;

DROP TABLE lignes_de_lot;

DROP TYPE sort_de_fichier;

DROP INDEX lots_d_import_domaine_idx;
DROP INDEX lots_d_import_le_idx;

DROP TABLE lots_d_import;
