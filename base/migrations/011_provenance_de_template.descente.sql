-- Annulation de 011 — l'ordre est l'inverse exact de la montée, et l'index est
-- retiré EXPLICITEMENT d'abord : il tomberait de lui-même avec la colonne, mais
-- une symétrie qu'on suppose n'est pas une symétrie, et l'empreinte structurelle
-- est le seul juge (voir la descente de 006).
--
-- LES PROVENANCES DÉJÀ CONSIGNÉES SONT PERDUES : c'est le prix d'une descente.
-- Aucune note n'est touchée par ailleurs — la colonne n'était qu'une trace, le
-- contenu du squelette ayant été copié à la création.
DROP INDEX notes_template_idx;

ALTER TABLE notes
	DROP COLUMN template_id;
