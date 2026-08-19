-- ═══════════════════════════════════════════════════════════════════════════
-- Annulation de 002 — l'ordre est l'inverse exact de la montée.
--
-- AUCUN `CASCADE` sur les `DROP TABLE`. Une dépendance oubliée doit faire
-- ÉCHOUER l'annulation, pas emporter silencieusement un objet que la montée
-- n'avait pas créé : c'est cette symétrie stricte qui rend la réversibilité
-- vérifiable par empreinte plutôt que par déclaration.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE verifications;
DROP TABLE pieces_jointes;
DROP TABLE relations;
DROP TABLE etiquettes_de_note;
DROP TABLE notes;
DROP TABLE parametres;
DROP TABLE etiquettes;
DROP TABLE types_de_relation;
DROP TABLE champs_de_type_de_fiche;
DROP TABLE types_de_fiche;
DROP TABLE templates;
DROP TABLE types_de_note;
DROP TABLE droits_de_dossier;
DROP TABLE dossiers;
DROP TABLE modules_de_domaine;
DROP TABLE domaines;

DROP TRIGGER univers_systeme_indestructible ON univers;
DROP TABLE univers;
DROP FUNCTION refuser_suppression_univers_systeme();

DROP TABLE comptes;

DROP TYPE type_de_champ;
DROP TYPE origine_de_relation;
DROP TYPE module_de_domaine;
DROP TYPE droit_de_dossier;
DROP TYPE statut_de_note;
DROP TYPE visibilite;
DROP TYPE role_de_compte;
