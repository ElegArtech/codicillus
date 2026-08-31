-- ═══════════════════════════════════════════════════════════════════════════
-- Annulation de 010 — l'ordre est l'inverse exact de la montée.
--
-- AUCUN `CASCADE`, comme partout depuis 002 : une dépendance oubliée doit faire
-- ÉCHOUER l'annulation, pas emporter silencieusement un objet que la montée
-- n'avait pas créé.
--
-- Les index tombent avec la table ; ils sont malgré tout retirés EXPLICITEMENT
-- et d'abord — une symétrie laissée à la charge d'un retrait de table est une
-- symétrie qu'on suppose, et l'empreinte structurelle est le seul juge de ce
-- qu'on suppose.
--
-- LA MONTÉE N'ÉCRIT AUCUNE DONNÉE : le journal se remplit à l'usage. Une
-- descente ne rend pas les recherches non advenues, elle en perd la trace.
-- ═══════════════════════════════════════════════════════════════════════════

DROP INDEX recherches_terme_idx;

DROP INDEX recherches_le_idx;

DROP TABLE recherches;
