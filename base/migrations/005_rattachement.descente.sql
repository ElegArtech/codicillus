-- ═══════════════════════════════════════════════════════════════════════════
-- Annulation de 005 — l'ordre est l'inverse exact de la montée.
--
-- AUCUN `CASCADE`, comme en 002, 003 et 004 : une dépendance oubliée doit faire
-- ÉCHOUER l'annulation, pas emporter silencieusement un objet que la montée
-- n'avait pas créé. C'est cette symétrie que `pnpm base:reversibilite` mesure,
-- par comparaison d'empreintes structurelles et non par déclaration.
--
-- CE QUI TOMBE AVEC UNE COLONNE, ET CE QUI NE TOMBE PAS. `DROP COLUMN` emporte
-- les contraintes et les index qui ne portent QUE sur elle : `comptes_domaine_fk`
-- et `comptes_domaine_idx` tombent avec `domaine_id`, les deux contraintes de
-- rang tombent avec `ordre`. Elles sont malgré tout retirées EXPLICITEMENT et
-- d'abord : une contrainte laissée à la charge d'un `DROP COLUMN` est une
-- symétrie qu'on suppose, et l'empreinte est le seul juge de ce qu'on suppose.
--
-- Le remplissage de la montée n'a pas d'inverse, et n'en a pas besoin : la
-- colonne qui le portait disparaît. L'empreinte est STRUCTURELLE — elle ignore
-- le contenu des tables —, et c'est pourquoi une descente n'a jamais à défaire
-- une écriture de données.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE etiquettes_de_note
	DROP CONSTRAINT etiquettes_de_note_ordre_unique,
	DROP CONSTRAINT etiquettes_de_note_ordre_positif;

ALTER TABLE etiquettes_de_note
	DROP COLUMN ordre;

ALTER TABLE comptes
	DROP COLUMN derniere_connexion_le;

DROP INDEX comptes_domaine_idx;

ALTER TABLE comptes
	DROP CONSTRAINT comptes_domaine_fk;

ALTER TABLE comptes
	DROP COLUMN domaine_id;
