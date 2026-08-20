-- ═══════════════════════════════════════════════════════════════════════════
-- Annulation de 006 — l'ordre est l'inverse exact de la montée.
--
-- AUCUN `CASCADE`, comme en 002, 003, 004 et 005 : une dépendance oubliée doit
-- faire ÉCHOUER l'annulation, pas emporter silencieusement un objet que la
-- montée n'avait pas créé. C'est cette symétrie que `pnpm base:reversibilite`
-- mesure, par comparaison d'empreintes structurelles et non par déclaration.
--
-- L'index tombe avec la table ; il est malgré tout retiré EXPLICITEMENT et
-- d'abord, pour la raison qu'énonce la descente de 005 — une contrainte laissée
-- à la charge d'un retrait de table est une symétrie qu'on suppose, et
-- l'empreinte est le seul juge de ce qu'on suppose.
--
-- LA MONTÉE N'ÉCRIT AUCUNE DONNÉE, donc la descente n'a rien à défaire : le
-- journal se remplit à l'usage, jamais à la migration. Le compteur de la note,
-- lui, n'est pas touché par cette migration — il existait déjà en 002 — et il
-- n'est donc pas remis en arrière ici. Une descente ne rend pas les
-- consultations non advenues.
-- ═══════════════════════════════════════════════════════════════════════════

DROP INDEX consultations_note_idx;

DROP TABLE consultations;
